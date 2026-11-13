import { mediaDevices, RTCPeerConnection, type MediaStream } from 'react-native-webrtc';

/**
 * Audio media for a SIP call, carried over WebRTC (SIP over WebSocket, RFC 7118).
 *
 * The SIP signalling in client.ts exchanges SDP; this module owns the actual
 * microphone capture, the peer connection and the remote audio stream.
 */

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export class CallMedia {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onRemoteStream?: (stream: MediaStream) => void;

  constructor(onRemoteStream?: (stream: MediaStream) => void) {
    this.onRemoteStream = onRemoteStream;
  }

  get stream(): MediaStream | null {
    return this.remoteStream;
  }

  private async ensurePeer(): Promise<RTCPeerConnection> {
    if (this.pc) return this.pc;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.addEventListener('track', (event: { streams?: MediaStream[] }) => {
      const stream = event.streams?.[0];
      if (stream) {
        this.remoteStream = stream;
        this.onRemoteStream?.(stream);
      }
    });
    this.pc = pc;
    return pc;
  }

  private async ensureMic(): Promise<MediaStream> {
    if (this.localStream) return this.localStream;
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    this.localStream = stream;
    return stream;
  }

  /** SDP offer for an outgoing call. */
  async createOffer(): Promise<string> {
    const pc = await this.ensurePeer();
    const mic = await this.ensureMic();
    mic.getTracks().forEach((track) => pc.addTrack(track, mic));
    const offer = await pc.createOffer({});
    await pc.setLocalDescription(offer);
    return offer.sdp ?? '';
  }

  /** SDP answer for an incoming call, given the caller's offer. */
  async createAnswer(remoteSdp: string): Promise<string> {
    const pc = await this.ensurePeer();
    const mic = await this.ensureMic();
    mic.getTracks().forEach((track) => pc.addTrack(track, mic));
    await pc.setRemoteDescription({ type: 'offer', sdp: remoteSdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer.sdp ?? '';
  }

  /** Apply the remote answer to an outgoing call. */
  async applyAnswer(remoteSdp: string): Promise<void> {
    const pc = await this.ensurePeer();
    if (pc.signalingState === 'have-local-offer') {
      await pc.setRemoteDescription({ type: 'answer', sdp: remoteSdp });
    }
  }

  setMuted(muted: boolean): void {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }

  close(): void {
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
    this.remoteStream = null;
    if (this.pc) {
      try {
        this.pc.close();
      } catch {
        // already closed
      }
      this.pc = null;
    }
  }
}
