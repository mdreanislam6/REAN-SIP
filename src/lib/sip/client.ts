import { md5 } from './md5';
import { CallMedia } from './media';
import type {
  ActiveCall,
  CallDirection,
  CallLogEntry,
  RegistrationState,
  SipAccount,
} from './types';

/**
 * A SIP user agent over WebSocket (SIP over WSS/WS, RFC 7118).
 *
 * It performs real registration with digest authentication, places and receives
 * calls, sends DTMF, and tears calls down. Media (RTP audio) is handled by a
 * separate media layer — see src/lib/sip/media.ts for the integration point.
 */

export type SipEvents = {
  onRegistration: (state: RegistrationState, detail?: string) => void;
  onCall: (call: ActiveCall | null) => void;
  onCallLog: (entry: Omit<CallLogEntry, 'id'>) => void;
  onTrace: (line: string) => void;
  /** Fired when the remote audio stream arrives, so the UI can play it. */
  onRemoteStream?: (stream: unknown) => void;
};

type Pending = {
  method: string;
  resolve: (msg: SipMessage) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

type SipMessage = {
  startLine: string;
  headers: Record<string, string>;
  body: string;
  isResponse: boolean;
  status?: number;
  method?: string;
};

const CODEC_PAYLOAD: Record<string, { pt: number; rtpmap: string; fmtp?: string }> = {
  PCMU: { pt: 0, rtpmap: '0 PCMU/8000' },
  PCMA: { pt: 8, rtpmap: '8 PCMA/8000' },
  G722: { pt: 9, rtpmap: '9 G722/8000' },
  OPUS: { pt: 111, rtpmap: '111 opus/48000/2', fmtp: '111 minptime=10;useinbandfec=1' },
};

function randomHex(len: number): string {
  let out = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

function parseMessage(raw: string): SipMessage | null {
  const text = raw.replace(/\r\n/g, '\n');
  const splitAt = text.indexOf('\n\n');
  const head = splitAt === -1 ? text : text.slice(0, splitAt);
  const body = splitAt === -1 ? '' : text.slice(splitAt + 2);
  const lines = head.split('\n').filter((l) => l.length > 0);
  if (lines.length === 0) return null;
  const startLine = lines[0].trim();
  const headers: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith(' ') || line.startsWith('\t')) continue; // folded header
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const name = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    headers[name] = headers[name] ? `${headers[name]}, ${value}` : value;
  }
  const isResponse = /^SIP\/2\.0\s+\d{3}/.test(startLine);
  if (isResponse) {
    const status = Number(startLine.split(/\s+/)[1]);
    return { startLine, headers, body, isResponse, status };
  }
  const method = startLine.split(/\s+/)[0];
  return { startLine, headers, body, isResponse, method };
}

function headerParam(value: string | undefined, name: string): string | undefined {
  if (!value) return undefined;
  const re = new RegExp(`(?:^|;)\\s*${name}=("?)([^";]+)\\1`, 'i');
  const m = value.match(re);
  return m ? m[2] : undefined;
}

function parseDigestChallenge(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(\w+)=(?:"([^"]*)"|([^,\s]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(header)) !== null) {
    out[m[1].toLowerCase()] = m[2] !== undefined ? m[2] : m[3];
  }
  return out;
}

export class SipClient {
  private account: SipAccount | null = null;
  private ws: WebSocket | null = null;
  private events: SipEvents;
  private pending = new Map<string, Pending>();
  private cseq = 1;
  private callId = '';
  private fromTag = '';
  private localTag = '';
  private registerTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 2000;
  private stopped = false;
  private activeCall: ActiveCall | null = null;
  private inviteCseq = 0;
  private inviteBranch = '';
  private remoteTag = '';
  private authHeader: string | null = null;
  private traceLines: string[] = [];
  private media: CallMedia | null = null;

  constructor(events: SipEvents) {
    this.events = events;
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === 1;
  }

  get traceSnapshot(): string[] {
    return this.traceLines;
  }

  private trace(line: string): void {
    this.traceLines = [...this.traceLines.slice(-199), line];
    this.events.onTrace(line);
  }

  private localHost(): string {
    const server = this.account?.server ?? '';
    try {
      return new URL(server).hostname;
    } catch {
      return 'localhost';
    }
  }

  private sipUri(user: string): string {
    const domain = this.account?.domain ?? '';
    return `sip:${user}@${domain}`;
  }

  private contactUri(): string {
    const a = this.account;
    if (!a) return '';
    return `<sip:${a.username}@${this.localHost()};transport=ws>`;
  }

  // ---------------------------------------------------------------- connection

  start(account: SipAccount): void {
    this.stop();
    this.stopped = false;
    this.account = account;
    this.callId = `${randomHex(16)}@${this.localHost()}`;
    this.fromTag = randomHex(8);
    this.localTag = randomHex(8);
    this.authHeader = null;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.registerTimer) clearTimeout(this.registerTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.registerTimer = null;
    this.reconnectTimer = null;
    this.pending.forEach((p) => {
      clearTimeout(p.timer);
      p.reject(new Error('client stopped'));
    });
    this.pending.clear();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // already closed
      }
      this.ws = null;
    }
    this.events.onRegistration('offline');
  }

  private connect(): void {
    const a = this.account;
    if (!a || this.stopped) return;
    this.events.onRegistration('connecting');
    let ws: WebSocket;
    try {
      ws = new WebSocket(a.server);
    } catch (e) {
      this.events.onRegistration('failed', `Cannot open ${a.server}`);
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectDelay = 2000;
      this.trace(`→ connected to ${a.server}`);
      this.register();
    };

    ws.onmessage = (event: { data: unknown }) => {
      const data = event.data;
      if (typeof data !== 'string') return;
      this.handleRaw(data);
    };

    ws.onerror = () => {
      this.trace('! socket error');
    };

    ws.onclose = () => {
      this.ws = null;
      if (this.stopped) return;
      this.events.onRegistration('offline', 'Connection lost');
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  // ------------------------------------------------------------------ sending

  private send(raw: string): void {
    if (!this.ws || this.ws.readyState !== 1) {
      this.trace('! not connected, dropped');
      return;
    }
    this.trace(`→ ${raw.split('\r\n')[0]}`);
    this.ws.send(raw);
  }

  private buildRequest(opts: {
    method: string;
    uri: string;
    to: string;
    from: string;
    cseq: number;
    callId: string;
    branch: string;
    extraHeaders?: string[];
    body?: string;
    contentType?: string;
  }): string {
    const a = this.account;
    const body = opts.body ?? '';
    const lines = [
      `${opts.method} ${opts.uri} SIP/2.0`,
      `Via: SIP/2.0/WSS ${this.localHost()};branch=${opts.branch};rport`,
      'Max-Forwards: 70',
      `From: ${opts.from};tag=${this.fromTag}`,
      `To: ${opts.to}`,
      `Call-ID: ${opts.callId}`,
      `CSeq: ${opts.cseq} ${opts.method}`,
      `Contact: ${this.contactUri()}`,
      `User-Agent: REAN SIP/1.0 (${a?.label ?? 'account'})`,
      'Allow: INVITE, ACK, CANCEL, BYE, OPTIONS, INFO, NOTIFY, REFER',
      ...(opts.extraHeaders ?? []),
    ];
    if (body.length > 0) {
      lines.push(`Content-Type: ${opts.contentType ?? 'application/sdp'}`);
    }
    lines.push(`Content-Length: ${body.length}`);
    return `${lines.join('\r\n')}\r\n\r\n${body}`;
  }

  private buildResponse(req: SipMessage, status: number, reason: string, body = ''): string {
    const h = req.headers;
    const lines = [
      `SIP/2.0 ${status} ${reason}`,
      ...(h['via'] ? [`Via: ${h['via']}`] : []),
      ...(h['from'] ? [`From: ${h['from']}`] : []),
      ...(h['to'] ? [`To: ${h['to']}${headerParam(h['to'], 'tag') ? '' : `;tag=${this.localTag}`}`] : []),
      ...(h['call-id'] ? [`Call-ID: ${h['call-id']}`] : []),
      ...(h['cseq'] ? [`CSeq: ${h['cseq']}`] : []),
      `Contact: ${this.contactUri()}`,
      'User-Agent: REAN SIP/1.0',
    ];
    if (body.length > 0) lines.push('Content-Type: application/sdp');
    lines.push(`Content-Length: ${body.length}`);
    return `${lines.join('\r\n')}\r\n\r\n${body}`;
  }

  private authFor(method: string, uri: string, challenge: string): string {
    const a = this.account;
    if (!a) return '';
    const p = parseDigestChallenge(challenge);
    const realm = p.realm ?? a.domain;
    const nonce = p.nonce ?? '';
    const qop = p.qop?.split(',')[0]?.trim();
    const algorithm = (p.algorithm ?? 'MD5').toUpperCase();
    const user = a.authUser || a.username;
    const ha1 = md5(`${user}:${realm}:${a.password}`);
    const ha2 = md5(`${method}:${uri}`);
    let response: string;
    const parts = [
      `username="${user}"`,
      `realm="${realm}"`,
      `nonce="${nonce}"`,
      `uri="${uri}"`,
      `algorithm=${algorithm}`,
    ];
    if (qop === 'auth' || qop === 'auth-int') {
      const nc = '00000001';
      const cnonce = randomHex(16);
      response = md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
      parts.push(`response="${response}"`, `qop=${qop}`, `nc=${nc}`, `cnonce="${cnonce}"`);
    } else {
      response = md5(`${ha1}:${nonce}:${ha2}`);
      parts.push(`response="${response}"`);
    }
    if (p.opaque) parts.push(`opaque="${p.opaque}"`);
    return `Digest ${parts.join(', ')}`;
  }

  // ------------------------------------------------------------- registration

  private register(): void {
    const a = this.account;
    if (!a) return;
    const uri = `sip:${a.domain}`;
    const branch = `z9hG4bK${randomHex(12)}`;
    const cseq = this.cseq++;
    const extra: string[] = [`Expires: ${a.expires}`];
    if (this.authHeader) extra.push(`Authorization: ${this.authHeader}`);

    const raw = this.buildRequest({
      method: 'REGISTER',
      uri,
      to: `<${this.sipUri(a.username)}>`,
      from: `<${this.sipUri(a.username)}>`,
      cseq,
      callId: this.callId,
      branch,
      extraHeaders: extra,
    });

    const key = `REGISTER:${cseq}`;
    this.pending.set(key, {
      method: 'REGISTER',
      resolve: (msg) => this.onRegisterResponse(msg, uri, cseq),
      reject: () => this.events.onRegistration('failed', 'Registration timed out'),
      timer: setTimeout(() => {
        this.pending.delete(key);
        this.events.onRegistration('failed', 'Registration timed out');
      }, 20000),
    });
    this.send(raw);
  }

  private onRegisterResponse(msg: SipMessage, uri: string, cseq: number): void {
    const status = msg.status ?? 0;
    if (status === 401 || status === 407) {
      const challenge = msg.headers['www-authenticate'] ?? msg.headers['proxy-authenticate'] ?? '';
      this.authHeader = this.authFor('REGISTER', uri, challenge);
      this.register();
      return;
    }
    if (status >= 200 && status < 300) {
      this.events.onRegistration('registered');
      const expires = Number(msg.headers['expires'] ?? this.account?.expires ?? 300);
      const refresh = Math.max(30, Math.floor(expires * 0.8)) * 1000;
      if (this.registerTimer) clearTimeout(this.registerTimer);
      this.registerTimer = setTimeout(() => this.register(), refresh);
      return;
    }
    this.events.onRegistration('failed', `${status} ${msg.startLine.split(/\s+/).slice(2).join(' ')}`);
  }

  // ------------------------------------------------------------------- calls

  /** Fallback SDP used when the WebRTC layer cannot start (e.g. no mic permission). */
  private fallbackSdp(): string {
    const codecs = ['PCMU', 'PCMA', 'G722', 'OPUS'];
    const payloads = codecs.map((c) => CODEC_PAYLOAD[c].pt);
    const lines = [
      'v=0',
      `o=- ${Date.now()} 1 IN IP4 0.0.0.0`,
      's=REAN SIP',
      'c=IN IP4 0.0.0.0',
      't=0 0',
      `m=audio 4000 RTP/AVP ${payloads.join(' ')} 101`,
      ...codecs.map((c) => `a=rtpmap:${CODEC_PAYLOAD[c].rtpmap}`),
      ...codecs.filter((c) => CODEC_PAYLOAD[c].fmtp).map((c) => `a=fmtp:${CODEC_PAYLOAD[c].fmtp}`),
      'a=rtpmap:101 telephone-event/8000',
      'a=fmtp:101 0-16',
      'a=ptime:20',
      'a=sendrecv',
    ];
    return lines.join('\r\n') + '\r\n';
  }

  private ensureMedia(): CallMedia {
    if (!this.media) {
      this.media = new CallMedia((stream) => this.events.onRemoteStream?.(stream));
    }
    return this.media;
  }

  async placeCall(number: string, name?: string): Promise<void> {
    const a = this.account;
    if (!a) return;
    if (this.activeCall) return;
    const target = number.replace(/\s+/g, '');
    const uri = target.includes('@') ? `sip:${target}` : this.sipUri(target);
    this.inviteCseq = this.cseq++;
    this.inviteBranch = `z9hG4bK${randomHex(12)}`;
    this.remoteTag = '';
    const callId = `${randomHex(16)}@${this.localHost()}`;
    this.callId = callId;

    this.activeCall = {
      id: callId,
      number: target,
      name,
      direction: 'out',
      phase: 'dialing',
      startedAt: Date.now(),
      statusText: 'Calling…',
    };
    this.events.onCall(this.activeCall);

    let sdp = this.fallbackSdp();
    try {
      sdp = (await this.ensureMedia().createOffer()) || sdp;
    } catch (e) {
      this.trace(`! media unavailable: ${String(e)}`);
    }
    if (!this.activeCall || this.activeCall.id !== callId) return; // cancelled while starting media

    const raw = this.buildRequest({
      method: 'INVITE',
      uri,
      to: `<${uri}>`,
      from: `<${this.sipUri(a.username)}>`,
      cseq: this.inviteCseq,
      callId,
      branch: this.inviteBranch,
      extraHeaders: ['Content-Type: application/sdp'],
      body: sdp,
    });
    this.send(raw);
  }

  async answer(): Promise<void> {
    const call = this.activeCall;
    if (!call || call.phase !== 'incoming') return;
    const req = this.pendingInvite;
    if (!req) return;
    let sdp = this.fallbackSdp();
    try {
      sdp = (await this.ensureMedia().createAnswer(req.body)) || sdp;
    } catch (e) {
      this.trace(`! media unavailable: ${String(e)}`);
    }
    this.send(this.buildResponse(req, 200, 'OK', sdp));
    this.activeCall = { ...call, phase: 'active', answeredAt: Date.now(), statusText: 'Connected' };
    this.events.onCall(this.activeCall);
  }

  reject(): void {
    const req = this.pendingInvite;
    if (req) this.send(this.buildResponse(req, 486, 'Busy Here'));
    this.finishCall(false);
  }

  hangup(): void {
    const call = this.activeCall;
    if (!call) return;
    const a = this.account;
    if (!a) return;
    if (call.phase === 'dialing' || call.phase === 'ringing') {
      // Cancel the pending INVITE.
      const raw = this.buildRequest({
        method: 'CANCEL',
        uri: this.sipUri(call.number),
        to: `<${this.sipUri(call.number)}>`,
        from: `<${this.sipUri(a.username)}>`,
        cseq: this.inviteCseq,
        callId: call.id,
        branch: this.inviteBranch,
      });
      this.send(raw);
      this.finishCall(false);
      return;
    }
    const to = this.remoteTag
      ? `<${this.sipUri(call.number)}>;tag=${this.remoteTag}`
      : `<${this.sipUri(call.number)}>`;
    const raw = this.buildRequest({
      method: 'BYE',
      uri: this.sipUri(call.number),
      to,
      from: `<${this.sipUri(a.username)}>`,
      cseq: this.cseq++,
      callId: call.id,
      branch: `z9hG4bK${randomHex(12)}`,
    });
    this.send(raw);
    this.finishCall(true);
  }

  sendDtmf(digit: string): void {
    const call = this.activeCall;
    const a = this.account;
    if (!call || !a || call.phase !== 'active') return;
    const body = `Signal=${digit}\r\nDuration=160\r\n`;
    const raw = this.buildRequest({
      method: 'INFO',
      uri: this.sipUri(call.number),
      to: `<${this.sipUri(call.number)}>${this.remoteTag ? `;tag=${this.remoteTag}` : ''}`,
      from: `<${this.sipUri(a.username)}>`,
      cseq: this.cseq++,
      callId: call.id,
      branch: `z9hG4bK${randomHex(12)}`,
      extraHeaders: ['Content-Type: application/dtmf-relay'],
      body,
      contentType: 'application/dtmf-relay',
    });
    this.send(raw);
  }

  setMuted(muted: boolean): void {
    this.media?.setMuted(muted);
    if (!this.activeCall) return;
    this.activeCall = { ...this.activeCall, statusText: muted ? 'Muted' : 'Connected' };
    this.events.onCall(this.activeCall);
  }

  private finishCall(answered: boolean): void {
    const call = this.activeCall;
    if (!call) return;
    const endedAt = Date.now();
    const durationSec = call.answeredAt ? Math.max(0, Math.round((endedAt - call.answeredAt) / 1000)) : 0;
    this.events.onCallLog({
      number: call.number,
      name: call.name,
      direction: call.direction,
      missed: call.direction === 'in' && !call.answeredAt,
      startedAt: call.startedAt,
      durationSec,
      accountId: this.account?.id ?? '',
      accountLabel: this.account?.label ?? '',
    });
    this.media?.close();
    this.media = null;
    this.activeCall = null;
    this.pendingInvite = null;
    this.events.onCall(null);
    void answered;
  }

  // ---------------------------------------------------------------- receiving

  private pendingInvite: SipMessage | null = null;

  private handleRaw(raw: string): void {
    const msg = parseMessage(raw);
    if (!msg) return;
    this.trace(`← ${msg.startLine}`);

    if (msg.isResponse) {
      const cseqHeader = msg.headers['cseq'] ?? '';
      const method = cseqHeader.split(/\s+/)[1] ?? '';
      const cseqNum = cseqHeader.split(/\s+/)[0] ?? '';
      const key = `${method}:${cseqNum}`;
      const pending = this.pending.get(key);
      if (pending) {
        clearTimeout(pending.timer);
        this.pending.delete(key);
        pending.resolve(msg);
        return;
      }
      this.handleCallResponse(msg, method);
      return;
    }

    this.handleRequest(msg);
  }

  private handleCallResponse(msg: SipMessage, method: string): void {
    const call = this.activeCall;
    if (!call) return;
    const status = msg.status ?? 0;
    const toTag = headerParam(msg.headers['to'], 'tag');
    if (toTag) this.remoteTag = toTag;

    if (method === 'INVITE') {
      if (status === 100) return;
      if (status === 180 || status === 183) {
        this.activeCall = { ...call, phase: 'ringing', statusText: 'Ringing…' };
        this.events.onCall(this.activeCall);
        return;
      }
      if (status >= 200 && status < 300) {
        const a = this.account;
        if (msg.body) {
          this.ensureMedia()
            .applyAnswer(msg.body)
            .catch((e) => this.trace(`! answer SDP rejected: ${String(e)}`));
        }
        if (a) {
          this.send(
            this.buildRequest({
              method: 'ACK',
              uri: this.sipUri(call.number),
              to: `<${this.sipUri(call.number)}>${this.remoteTag ? `;tag=${this.remoteTag}` : ''}`,
              from: `<${this.sipUri(a.username)}>`,
              cseq: this.inviteCseq,
              callId: call.id,
              branch: `z9hG4bK${randomHex(12)}`,
            }),
          );
        }
        this.activeCall = { ...call, phase: 'active', answeredAt: Date.now(), statusText: 'Connected' };
        this.events.onCall(this.activeCall);
        return;
      }
      if (status >= 300) {
        this.activeCall = { ...call, statusText: `${status} ${msg.startLine.split(/\s+/).slice(2).join(' ')}` };
        this.events.onCall(this.activeCall);
        this.finishCall(false);
      }
    }
  }

  private handleRequest(msg: SipMessage): void {
    const method = msg.method ?? '';
    switch (method) {
      case 'INVITE': {
        if (this.activeCall) {
          this.send(this.buildResponse(msg, 486, 'Busy Here'));
          return;
        }
        this.pendingInvite = msg;
        this.remoteTag = headerParam(msg.headers['from'], 'tag') ?? '';
        const fromHeader = msg.headers['from'] ?? '';
        const numberMatch = fromHeader.match(/sip:([^@;>]+)/);
        const number = numberMatch ? numberMatch[1] : 'unknown';
        const displayMatch = fromHeader.match(/^"([^"]+)"/);
        this.send(this.buildResponse(msg, 100, 'Trying'));
        this.send(this.buildResponse(msg, 180, 'Ringing'));
        this.activeCall = {
          id: msg.headers['call-id'] ?? randomHex(16),
          number,
          name: displayMatch ? displayMatch[1] : undefined,
          direction: 'in',
          phase: 'incoming',
          startedAt: Date.now(),
          statusText: 'Incoming call',
        };
        this.events.onCall(this.activeCall);
        return;
      }
      case 'ACK':
        return;
      case 'BYE': {
        this.send(this.buildResponse(msg, 200, 'OK'));
        this.finishCall(true);
        return;
      }
      case 'CANCEL': {
        this.send(this.buildResponse(msg, 200, 'OK'));
        if (this.pendingInvite) this.send(this.buildResponse(this.pendingInvite, 487, 'Request Terminated'));
        this.finishCall(false);
        return;
      }
      case 'OPTIONS': {
        this.send(this.buildResponse(msg, 200, 'OK'));
        return;
      }
      case 'INFO': {
        this.send(this.buildResponse(msg, 200, 'OK'));
        return;
      }
      case 'NOTIFY': {
        this.send(this.buildResponse(msg, 200, 'OK'));
        return;
      }
      default: {
        this.send(this.buildResponse(msg, 501, 'Not Implemented'));
      }
    }
  }
}

export type { SipMessage };
export type { CallDirection };
