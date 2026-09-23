import { z } from 'zod';
import type { DataConnection, Peer } from 'peerjs';
import { PROTOCOL_VERSION } from '../game/model';
import type { Transport } from './transport';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LABEL = 'twilight-room-v1';
const ID_PREFIX = 'twilight-room-';
const MAX_MESSAGE = 250000;
const Identity = z.object({ version: z.literal(PROTOCOL_VERSION), session: z.string().uuid(), worldId: z.string().uuid(), epoch: z.string().uuid() }).strict();
const Request = z.object({ kind: z.literal('room-request'), version: z.number().int(), nonce: z.string().uuid() }).strict();
const Offer = z.object({ kind: z.literal('room-offer'), nonce: z.string().uuid(), pairing: Identity }).strict();
const Ready = z.object({ kind: z.literal('room-ready'), version: z.literal(PROTOCOL_VERSION), session: z.string().uuid(), nonce: z.string().uuid() }).strict();
const Rejected = z.object({ kind: z.literal('room-rejected'), code: z.enum(['busy', 'version', 'stale', 'protocol']) }).strict();

export type RoomIdentity = z.infer<typeof Identity>;
export type CodeRoomOptions = { signal?: AbortSignal; timeoutMs?: number; expected?: Partial<Pick<RoomIdentity, 'worldId' | 'epoch' | 'session'>> };
export type RoomCodeError = 'cancelled' | 'invalid-code' | 'unavailable' | 'timeout' | 'busy' | 'version' | 'stale' | 'protocol' | 'network' | 'unsupported';
export class CodeRoomError extends Error {
  constructor(readonly code: RoomCodeError, message: string) { super(message); this.name = 'CodeRoomError'; }
}
const explanation: Record<RoomCodeError, string> = {
  cancelled: 'Room connection cancelled.',
  'invalid-code': 'Enter the eight-letter room code shown on the host phone.',
  unavailable: 'That room is not open. Check the code or ask the host to create a new one.',
  timeout: 'The phones could not connect. Keep both apps open on the same Wi-Fi, allow Local Network access, and try again. Offline pairing is also available.',
  busy: 'Another resident is already joining or playing in this room.',
  version: 'The phones are using different game versions. Update both before joining.',
  stale: 'This room invitation has changed. Ask the host for a new code.',
  protocol: 'The room sent an invalid connection message. Ask the host for a new code.',
  network: 'Room codes need internet access during setup. Try again or use Offline pairing.',
  unsupported: 'This browser cannot open co-op. Open Twilight in Safari on your iPhone or another browser with WebRTC support.',
};
const roomError = (code: RoomCodeError) => new CodeRoomError(code, explanation[code]);

export function normalizeRoomCode(input: string): string {
  const code = input.trim().toUpperCase().replace(/[\s-]/g, '');
  if (code.length !== 8 || [...code].some(character => !ALPHABET.includes(character))) throw roomError('invalid-code');
  return code;
}
export function createRoomCode(): string {
  return [...crypto.getRandomValues(new Uint8Array(8))].map(value => ALPHABET[value & 31]).join('');
}

/** PeerServer only brokers ICE/SDP. The private handshake and every game message use the DataChannel. */
export class CodeRoomTransport implements Transport {
  onMessage: Transport['onMessage'] = () => {};
  onState: Transport['onState'] = () => {};
  onStatus: (text: string) => void = () => {};
  pairing?: RoomIdentity;
  code?: string;
  private peer?: Peer;
  private channel?: DataConnection;
  private mode?: 'host' | 'guest';
  private phase: 'new' | 'connecting' | 'waiting' | 'offered' | 'active' | 'closed' = 'new';
  private nonce?: string;
  private expected?: CodeRoomOptions['expected'];
  private pendingReject?: (error: Error) => void;
  private pendingOffer?: (pairing: RoomIdentity) => void;
  private peerReject?: (error: Error) => void;
  private deadline?: ReturnType<typeof setTimeout>;
  private handshakeDeadline?: ReturnType<typeof setTimeout>;
  private removeAbort?: () => void;
  private rejected = new Map<DataConnection, ReturnType<typeof setTimeout>>();
  get ready() { return this.phase === 'active' && this.channel?.open === true; }

  host(worldId: string, epoch: string, options: CodeRoomOptions = {}): Promise<{ code: string; pairing: RoomIdentity }> {
    const pairing = Identity.parse({ version: PROTOCOL_VERSION, session: crypto.randomUUID(), worldId, epoch });
    return this.begin(options, resolve => {
      this.mode = 'host'; this.pairing = pairing;
      void (async () => {
        for (let attempt = 0; attempt < 4; attempt++) {
          this.code = createRoomCode();
          try {
            await this.openPeer(ID_PREFIX + this.code);
            if (this.phase === 'closed') return;
            if (this.phase === 'connecting') this.phase = 'waiting'; this.clearDeadline();
            resolve({ code: this.code, pairing }); return;
          } catch (error) {
            if ((error as { type?: string }).type !== 'unavailable-id') throw error;
            this.destroyPeer();
          }
        }
        throw roomError('network');
      })().catch(error => this.fail(this.describe(error)));
    });
  }

  join(input: string, options: CodeRoomOptions = {}): Promise<RoomIdentity> {
    const code = normalizeRoomCode(input);
    return this.begin(options, resolve => {
      this.mode = 'guest'; this.code = code; this.expected = options.expected;
      this.pendingOffer = resolve;
      void (async () => {
        const peer = await this.openPeer(`twilight-guest-${crypto.randomUUID()}`);
        if (this.phase === 'closed') return;
        // PeerJS calls its no-serialization implementation "raw" (not "none").
        this.attach(peer.connect(ID_PREFIX + code, { label: LABEL, reliable: true, serialization: 'raw' }));
      })().catch(error => this.fail(this.describe(error)));
    });
  }

  /** Call after GuestSession is installed and its saved identity/mirror are selected. */
  activate() {
    if (this.mode !== 'guest' || this.phase !== 'offered' || !this.channel?.open || !this.pairing) throw roomError('stale');
    this.write({ kind: 'room-ready', version: PROTOCOL_VERSION, nonce: this.nonce, session: this.pairing.session });
    if (this.phase === 'offered') this.open();
  }

  send(message: unknown) {
    if (!this.ready) throw Error('The other phone is disconnected.');
    this.write(message);
  }
  close() { this.finish('closed', roomError('cancelled')); }

  private begin<T>(options: CodeRoomOptions, start: (resolve: (value: T) => void) => void): Promise<T> {
    if (this.phase !== 'new') return Promise.reject(Error('Create a new room connection before trying again.'));
    this.phase = 'connecting';
    return new Promise<T>((resolve, reject) => {
      this.pendingReject = reject;
      const abort = () => this.finish('closed', roomError('cancelled'));
      options.signal?.addEventListener('abort', abort, { once: true });
      this.removeAbort = () => options.signal?.removeEventListener('abort', abort);
      if (options.signal?.aborted) { abort(); return; }
      this.deadline = setTimeout(() => this.fail(roomError('timeout')), options.timeoutMs ?? 25000);
      try { start(value => { this.pendingReject = undefined; resolve(value); }); }
      catch (error) { this.fail(this.describe(error)); }
    });
  }

  private async openPeer(id: string): Promise<Peer> {
    if (typeof RTCPeerConnection !== 'function') throw roomError('unsupported');
    const { Peer } = await import('peerjs');
    if (this.phase === 'closed') throw roomError('cancelled');
    const peer = new Peer(id, { host: '0.peerjs.com', port: 443, secure: true, path: '/', debug: 0,
      config: { iceServers: [], iceCandidatePoolSize: 0 } });
    this.peer = peer;
    return new Promise<Peer>((resolve, reject) => {
      let opened = false, openingFailed = false;
      this.peerReject = reject;
      peer.on('open', () => { if (this.peer !== peer || this.phase === 'closed') return; opened = true; this.peerReject = undefined; resolve(peer); });
      peer.on('connection', connection => {
        if (this.peer !== peer || this.phase === 'closed') { connection.close(); return; }
        if (this.mode !== 'host' || this.channel) this.rejectConnection(connection, 'busy');
        else if (connection.label !== LABEL) this.rejectConnection(connection, 'version');
        else this.attach(connection);
      });
      peer.on('call', call => call.close());
      peer.on('error', error => {
        if (this.peer !== peer || this.phase === 'closed') return;
        // PeerJS emits error, then synchronous disconnected/close on a rejected
        // ID. Let the host's registration retry handle that initial error once.
        if (!opened) { openingFailed = true; reject(error); }
        else if (this.ready && ['network', 'socket-error', 'socket-closed', 'disconnected'].includes(error.type)) this.onStatus('The room service is unavailable. Your direct game connection can continue.');
        else this.fail(this.describe(error));
      });
      peer.on('disconnected', () => {
        if (this.peer === peer && this.phase !== 'closed' && !openingFailed && !this.ready) this.fail(roomError('network'));
      });
      peer.on('close', () => { if (this.peer === peer && this.phase !== 'closed' && !openingFailed) this.fail(roomError('network')); });
    });
  }

  private attach(channel: DataConnection) {
    this.channel = channel;
    const start = () => {
      if (this.channel !== channel || this.phase === 'closed') return;
      if (this.mode === 'guest') { this.nonce = crypto.randomUUID(); this.write({ kind: 'room-request', version: PROTOCOL_VERSION, nonce: this.nonce }); }
    };
    channel.on('open', start);
    channel.on('data', data => { if (this.channel === channel) this.receive(data); });
    channel.on('close', () => this.lostChannel(channel));
    channel.on('error', () => this.lostChannel(channel));
    this.handshakeDeadline = setTimeout(() => {
      if (this.channel !== channel || this.ready) return;
      if (this.mode === 'host') { this.releaseCandidate(channel); this.onStatus('The guest did not finish connecting. They can try the same room code again.'); }
      else this.fail(roomError('timeout'));
    }, 20000);
    if (channel.open) start();
  }

  private receive(data: unknown) {
    try {
      if (typeof data !== 'string' || data.length > (this.ready ? MAX_MESSAGE : 4096)) throw roomError('protocol');
      const message: unknown = JSON.parse(data);
      if (this.ready) { this.onMessage(message); return; }
      if (this.mode === 'host') {
        if (this.phase !== 'offered') {
          const request = Request.safeParse(message);
          if (!request.success) { this.rejectCurrent('protocol'); return; }
          if (request.data.version !== PROTOCOL_VERSION) { this.rejectCurrent('version'); return; }
          this.nonce = request.data.nonce; this.phase = 'offered';
          this.write({ kind: 'room-offer', nonce: this.nonce, pairing: this.pairing });
        } else {
          const ack = Ready.safeParse(message);
          if (!ack.success || ack.data.nonce !== this.nonce || ack.data.session !== this.pairing?.session) { this.rejectCurrent('stale'); return; }
          this.open();
        }
      } else {
        const refusal = Rejected.safeParse(message);
        if (refusal.success) throw roomError(refusal.data.code);
        const offer = Offer.safeParse(message);
        if (!offer.success) throw roomError('version');
        if (this.phase === 'offered' || offer.data.nonce !== this.nonce || Object.entries(this.expected ?? {}).some(([key, value]) => offer.data.pairing[key as keyof RoomIdentity] !== value)) throw roomError('stale');
        this.pairing = offer.data.pairing; this.phase = 'offered'; this.clearDeadline();
        this.pendingOffer?.(this.pairing); this.pendingOffer = undefined;
      }
    } catch (error) {
      if (this.mode === 'host' && !this.ready && this.channel) this.rejectCurrent('protocol');
      else this.fail(this.describe(error));
    }
  }

  private open() {
    this.phase = 'active'; this.clearDeadline(); clearTimeout(this.handshakeDeadline); this.removeAbort?.(); this.removeAbort = undefined;
    this.onState('open');
  }
  private write(message: unknown) {
    const data = JSON.stringify(message);
    if (!this.channel?.open) throw Error('The other phone is disconnected.');
    const bufferedMessages = (this.channel as DataConnection & { bufferSize?: number }).bufferSize ?? 0;
    if (typeof data !== 'string' || data.length > MAX_MESSAGE || (this.channel.dataChannel?.bufferedAmount ?? 0) > 500000 || bufferedMessages > 8) throw Error('Connection is busy. Please reconnect.');
    this.channel.send(data);
    if (!this.channel?.open) throw Error('The other phone is disconnected.');
  }
  private lostChannel(channel: DataConnection) {
    if (this.channel !== channel || this.phase === 'closed') return;
    if (this.mode === 'host' && this.phase !== 'active') this.releaseCandidate(channel);
    else this.finish('closed', roomError('unavailable'));
  }
  private releaseCandidate(channel: DataConnection) {
    if (this.channel === channel) { this.channel = undefined; this.nonce = undefined; this.phase = 'waiting'; clearTimeout(this.handshakeDeadline); }
    channel.close();
  }
  private rejectCurrent(code: 'busy' | 'version' | 'stale' | 'protocol') {
    const channel = this.channel; if (!channel) return;
    this.channel = undefined; this.nonce = undefined; this.phase = 'waiting'; clearTimeout(this.handshakeDeadline);
    this.rejectConnection(channel, code);
  }
  private rejectConnection(channel: DataConnection, code: 'busy' | 'version' | 'stale' | 'protocol') {
    const close = () => { clearTimeout(this.rejected.get(channel)); this.rejected.delete(channel); channel.close(); };
    const send = () => {
      try { channel.send(JSON.stringify({ kind: 'room-rejected', code })); } catch { close(); return; }
      clearTimeout(this.rejected.get(channel)); this.rejected.set(channel, setTimeout(close, 100));
    };
    this.rejected.set(channel, setTimeout(close, 1500));
    channel.on('error', close); channel.on('open', send);
    if (channel.open) send();
  }
  private clearDeadline() { clearTimeout(this.deadline); this.deadline = undefined; }
  private destroyPeer() { const peer = this.peer; this.peer = undefined; this.peerReject = undefined; peer?.destroy(); }
  private fail(error: Error) { this.finish('failed', error); }
  private finish(state: 'closed' | 'failed', error: Error) {
    if (this.phase === 'closed') return;
    this.phase = 'closed'; this.clearDeadline(); clearTimeout(this.handshakeDeadline); this.removeAbort?.(); this.removeAbort = undefined;
    this.pendingReject?.(error); this.pendingReject = undefined; this.pendingOffer = undefined;
    this.peerReject?.(error); this.peerReject = undefined;
    const channel = this.channel; this.channel = undefined; channel?.close();
    for (const [connection, timer] of this.rejected) { clearTimeout(timer); connection.close(); } this.rejected.clear();
    this.destroyPeer(); this.onStatus(error.message); this.onState(state);
  }
  private describe(error: unknown): Error {
    if (error instanceof CodeRoomError) return error;
    const type = (error as { type?: string })?.type;
    return roomError(type === 'peer-unavailable' ? 'unavailable' : type === 'browser-incompatible' ? 'unsupported' : 'network');
  }
}
