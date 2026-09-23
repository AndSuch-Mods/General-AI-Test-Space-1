import type { Page } from '@playwright/test';

/** Test-only observation. It never changes SDP, connection timing or application handlers. */
export async function installRtcDiagnostics(page: Page, role: 'host' | 'guest') {
  await page.addInitScript(role => {
    const Native = window.RTCPeerConnection;
    type Detail = Record<string, unknown>;
    const events: Detail[] = [], peers: RTCPeerConnection[] = [];
    const ids = new WeakMap<RTCPeerConnection, number>();
    const channels = new Map<RTCPeerConnection, RTCDataChannel[]>();
    const started = performance.now();
    const record = (kind: string, detail: Detail = {}) => {
      events.push({ ms: Math.round(performance.now() - started), kind, ...detail });
      if (events.length > 180) events.shift();
    };
    const peerState = (peer: RTCPeerConnection) => ({ peer: ids.get(peer), connection: peer.connectionState,
      ice: peer.iceConnectionState, gathering: peer.iceGatheringState, signaling: peer.signalingState });
    const stack = () => new Error().stack?.split('\n').slice(2, 7).join('\n');
    const observeChannel = (peer: RTCPeerConnection, channel: RTCDataChannel, source: string) => {
      const list = channels.get(peer)!;
      if (list.includes(channel)) return;
      list.push(channel);
      const detail = () => ({ ...peerState(peer), channel: channel.id, label: channel.label,
        state: channel.readyState, buffered: channel.bufferedAmount });
      record('channel.created', { ...detail(), source });
      for (const event of ['open', 'closing', 'close']) channel.addEventListener(event, () => record(`channel.${event}`, detail()));
      channel.addEventListener('error', event => {
        const error = (event as Event & { error?: { message?: string; errorDetail?: string } }).error;
        record('channel.error', { ...detail(), message: error?.message, errorDetail: error?.errorDetail });
      });
      const close = channel.close.bind(channel);
      channel.close = () => { record('channel.close-call', { ...detail(), stack: stack() }); close(); };
    };
    if (Native) window.RTCPeerConnection = class extends Native {
      constructor(configuration?: RTCConfiguration) {
        super(configuration); peers.push(this); ids.set(this, peers.length); channels.set(this, []);
        record('peer.created', peerState(this));
        for (const event of ['connectionstatechange', 'iceconnectionstatechange', 'icegatheringstatechange', 'signalingstatechange']) {
          this.addEventListener(event, () => record(event, peerState(this)));
        }
        this.addEventListener('icecandidateerror', event => record('icecandidateerror', { ...peerState(this),
          code: event.errorCode, text: event.errorText, address: event.address, port: event.port }));
        this.addEventListener('datachannel', event => observeChannel(this, event.channel, 'remote'));
      }
      createDataChannel(label: string, options?: RTCDataChannelInit) {
        const channel = super.createDataChannel(label, options); observeChannel(this, channel, 'local'); return channel;
      }
      close() { record('peer.close-call', { ...peerState(this), stack: stack() }); super.close(); }
    };
    document.addEventListener('visibilitychange', () => record('visibilitychange', { hidden: document.hidden }));
    window.addEventListener('pagehide', () => record('pagehide'));
    const collect = async (includeDetails: boolean) => {
      const summaries = await Promise.all(peers.map(async peer => {
        const summary: Detail = { ...peerState(peer), channels: (channels.get(peer) ?? []).map(channel => ({
          id: channel.id, state: channel.readyState, buffered: channel.bufferedAmount,
        })) };
        if (includeDetails) {
          let timer: ReturnType<typeof setTimeout> | undefined;
          try {
            const stats = await Promise.race([peer.getStats(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Error('getStats timed out')), 1500); })]);
            const rows: Detail[] = []; stats.forEach(stat => rows.push(stat));
            summary.stats = rows.filter(stat => ['transport', 'candidate-pair'].includes(String(stat.type))).map(stat => {
              const keys = ['id', 'type', 'state', 'selectedCandidatePairId', 'dtlsState', 'iceState', 'nominated', 'localCandidateId', 'remoteCandidateId',
                'requestsSent', 'requestsReceived', 'responsesSent', 'responsesReceived', 'bytesSent', 'bytesReceived', 'currentRoundTripTime'];
              return Object.fromEntries(keys.filter(key => stat[key] !== undefined).map(key => [key, stat[key]]));
            }).slice(0, 24);
          } catch (error) { summary.statsError = String(error); }
          finally { clearTimeout(timer); }
        }
        return summary;
      }));
      return { role, supported: !!Native, hidden: document.hidden, peers: summaries, ...(includeDetails ? { events } : {}) };
    };
    (window as unknown as { __twilightRtcDiagnostics: typeof collect }).__twilightRtcDiagnostics = collect;
  }, role);
}

export async function reportRtcDiagnostics(pages: Page[], phase: string, includeDetails = false) {
  const reports = await Promise.all(pages.map(async page => {
    try {
      return await page.evaluate(async details => {
        const collect = (window as unknown as { __twilightRtcDiagnostics?: (details: boolean) => Promise<unknown> }).__twilightRtcDiagnostics;
        return collect ? collect(details) : { missing: true, url: location.href };
      }, includeDetails);
    } catch (error) { return { diagnosticError: String(error) }; }
  }));
  console.log('RTC diagnostics', JSON.stringify({ phase, reports }));
}
