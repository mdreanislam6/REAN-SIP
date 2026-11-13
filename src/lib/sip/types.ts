/** Core data types for REAN SIP. */

export type SipTransport = 'WSS' | 'WS';

/** One SIP account the user has saved on this phone. */
export type SipAccount = {
  id: string;
  label: string;
  displayName: string;
  username: string;
  authUser: string;
  password: string;
  /** SIP domain / realm, e.g. sip.example.com */
  domain: string;
  /** WebSocket endpoint of the SIP server, e.g. wss://sip.example.com:7443/ws */
  server: string;
  transport: SipTransport;
  /** Registration lifetime in seconds. */
  expires: number;
  enabled: boolean;
};

export type RegistrationState = 'offline' | 'connecting' | 'registered' | 'failed';

export type CallDirection = 'in' | 'out';

export type CallPhase = 'idle' | 'dialing' | 'ringing' | 'incoming' | 'active' | 'ended';

export type ActiveCall = {
  id: string;
  number: string;
  name?: string;
  direction: CallDirection;
  phase: CallPhase;
  startedAt: number;
  answeredAt?: number;
  remoteUri?: string;
  /** Last SIP status line seen for this call, shown in the call screen. */
  statusText?: string;
};

export type CallLogEntry = {
  id: string;
  number: string;
  name?: string;
  direction: CallDirection;
  /** True when an incoming call was never answered. */
  missed: boolean;
  startedAt: number;
  durationSec: number;
  accountId: string;
  accountLabel: string;
};

export type Contact = {
  id: string;
  name: string;
  number: string;
  company?: string;
  favorite: boolean;
  blocked: boolean;
};

export type AppSettings = {
  /** Preferred audio codec order, first is offered first. */
  codecs: string[];
  ringtone: boolean;
  vibrate: boolean;
  /** Keep the dialer keypad tones on. */
  keypadTones: boolean;
  /** Ask before calling a blocked number. */
  confirmBlocked: boolean;
  /** Show the SIP trace in the call screen (useful while setting up a server). */
  showSipTrace: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  codecs: ['PCMU', 'PCMA', 'G722', 'OPUS'],
  ringtone: true,
  vibrate: true,
  keypadTones: true,
  confirmBlocked: false,
  showSipTrace: false,
};
