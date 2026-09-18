import { z } from 'zod';
import type { Transport } from './transport';
import { PROTOCOL_VERSION } from '../game/model';

const PairSchema = z.object({ version: z.literal(PROTOCOL_VERSION), session: z.string().uuid(), worldId: z.string().uuid(),
  epoch: z.string().uuid(), type: z.enum(['offer', 'answer']), sdp: z.string().min(20).max(20000) }).strict();
export type Pairing = z.infer<typeof PairSchema>;
export function decodePairing(text: string): Pairing {
  if (text.length > 30000 || !text.startsWith('TW1:')) throw Error('Use a Twilight pairing code from the other phone.');
  try { return PairSchema.parse(JSON.parse(atob(text.slice(4).trim()))); }
  catch { throw Error('Pairing code is incomplete or from a different game version.'); }
}
export function encodePairing(pairing: Pairing) { return 'TW1:' + btoa(JSON.stringify(PairSchema.parse(pairing))); }

export class WebRTCTransport implements Transport {
  readonly peer = new RTCPeerConnection({ iceServers: [], iceCandidatePoolSize: 0 });
  private channel?: RTCDataChannel;
  onMessage: Transport['onMessage'] = () => {};
  onState: Transport['onState'] = () => {};
  get ready() { return this.channel?.readyState === 'open'; }
  constructor() {
    this.peer.ondatachannel = event => this.attach(event.channel);
    this.peer.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(this.peer.connectionState)) this.onState(this.peer.connectionState === 'failed' ? 'failed' : 'closed');
    };
  }
  private attach(channel: RTCDataChannel) {
    this.channel = channel;
    channel.onopen = () => this.onState('open');
    channel.onclose = () => this.onState('closed');
    channel.onerror = () => this.onState('failed');
    channel.onmessage = event => {
      if (typeof event.data !== 'string' || event.data.length > 250000) { this.close(); return; }
      try { this.onMessage(JSON.parse(event.data)); }
      catch { this.close(); }
    };
  }
  private async gather() {
    if (this.peer.iceGatheringState === 'complete') return;
    await new Promise<void>((resolve, reject) => {
      const check = () => { if (this.peer.iceGatheringState === 'complete') { clearTimeout(timeout); this.peer.removeEventListener('icegatheringstatechange', check); resolve(); } };
      const timeout = setTimeout(() => { this.peer.removeEventListener('icegatheringstatechange', check); reject(Error('Local network discovery timed out. Keep both phones on the same Wi-Fi and try again.')); }, 12000);
      this.peer.addEventListener('icegatheringstatechange', check);
      check();
    });
  }
  async offer(worldId: string, epoch: string): Promise<Pairing> {
    this.attach(this.peer.createDataChannel('twilight-v1', { ordered: true }));
    await this.peer.setLocalDescription(await this.peer.createOffer());
    await this.gather();
    return { version: 1, session: crypto.randomUUID(), worldId, epoch, type: 'offer', sdp: this.peer.localDescription!.sdp };
  }
  async answer(offer: Pairing): Promise<Pairing> {
    if (offer.type !== 'offer') throw Error('The guest needs the host offer code.');
    await this.peer.setRemoteDescription({ type: 'offer', sdp: offer.sdp });
    await this.peer.setLocalDescription(await this.peer.createAnswer());
    await this.gather();
    return { ...offer, type: 'answer', sdp: this.peer.localDescription!.sdp };
  }
  async accept(answer: Pairing, offer: Pairing) {
    if (answer.type !== 'answer' || answer.session !== offer.session || answer.worldId !== offer.worldId || answer.epoch !== offer.epoch) throw Error('This answer belongs to a different pairing.');
    await this.peer.setRemoteDescription({ type: 'answer', sdp: answer.sdp });
  }
  send(message: unknown) {
    const data = JSON.stringify(message);
    if (!this.ready) throw Error('The other phone is disconnected.');
    if (data.length > 250000 || this.channel!.bufferedAmount > 500000) throw Error('Connection is busy. Please reconnect.');
    this.channel!.send(data);
  }
  close() { this.channel?.close(); this.peer.close(); }
}
