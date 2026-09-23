# Short-code co-op rooms

The September 23 request adds an eight-character room code as the normal joining flow. Browser apps cannot enumerate nearby Wi-Fi games. The host advertises a temporary code through PeerJS Cloud, and the guest types that code. Internet access is needed for this setup. The existing manual/QR route remains available for offline pairing.

PeerJS 1.5.5 is bundled locally and imported only when code pairing starts. Its cloud service brokers peer IDs and WebRTC signaling. The adapter explicitly uses `iceServers: []`, with no STUN or TURN. Gameplay travels through an ordered direct DataChannel on a mutually reachable network. A network that isolates its clients can prevent either pairing method from connecting. See the [PeerJS connection API](https://peerjs.com/client/api/peer) and [DataConnection API](https://peerjs.com/client/api/data-connection).

No saves, character keys, names or world metadata are passed to PeerJS connection metadata or its signaling service. World ID, timeline ID and session ID are exchanged only after the DataChannel opens. The signaling service still sees the temporary peer IDs, connection information and SDP/ICE needed to arrange the connection. No game account is required.

## Integration

`CodeRoomTransport` implements the existing `Transport` interface. It has no network side effects until `host` or `join` runs. Each attempt uses a new instance.

```ts
const connection = new CodeRoomTransport();
const hostSession = new HostSession(connection, authority, status);
const { code, pairing } = await connection.host(worldId, epoch, { signal });
```

The host displays `code`, eight uppercase characters without ambiguous I/O/0/1. A hyphen or spaces and lowercase are accepted on input. The code contains 40 random bits from `crypto.getRandomValues`. Registration retries with a fresh code and peer up to four times on collisions.

```ts
const connection = new CodeRoomTransport();
const pairing = await connection.join(code, { signal });
// Select the existing guest identity and recovery mirror by pairing.worldId.
// Check pairing.epoch and durably save any new guest identity before activation.
const guestSession = new GuestSession(connection, database, identity, pairing, mirror, update, status);
connection.activate();
```

`RoomIdentity` contains `version`, `session`, `worldId` and `epoch`. `GuestSession` accepts those identity fields without requiring fabricated SDP. Ordinary manual `Pairing` values remain accepted. `join` can also take `expected` world/timeline/session values when the caller already knows them.

The guest starts with a random nonce. The host's metadata response echoes it. Activation acknowledges that nonce and session before either side exposes the gameplay transport as ready. The existing guest hello, automatic recovery key, revision checks and host authority remain unchanged. Early gameplay sends fail. Invalid messages, protocol mismatches and stale acknowledgements are rejected.

Optional `onStatus(text)` provides setup errors. `onState` retains `open`, `closed` and `failed`. `ready`, `send`, `onMessage` and `close` retain their existing meanings. Errors expose a `CodeRoomError.code` for UI handling, with human-readable messages.

## Lifetime and failure rules

- Registration/join has a 25-second default deadline. `timeoutMs` can override it. The host can keep an advertised code open after registration.
- Each candidate has 20 seconds to finish the channel handshake and guest activation. An abandoned candidate releases its reservation.
- Only one guest may be joining or active. Additional connections receive a busy rejection.
- Cancellation rejects pending work, clears timers and destroys channels and the signaling peer. The abort listener is removed once gameplay starts.
- Losing signaling after activation leaves the direct connection running. Losing the game channel closes the adapter and notifies the existing session so it releases the guest.
- A disconnected guest rejoins using a newly advertised host code and their existing saved identity. Closed transport instances cannot be reused.
- JSON payload length and send buffering are bounded, matching the existing transport's limits. Malformed input is never forwarded to gameplay.

## Evidence and remaining acceptance

`tests/code-room.test.ts` exercises private metadata exchange, the activation boundary, collision retries with PeerJS's real error/close ordering, busy rejection, stale timeline/session checks, version mismatch, signaling loss, guest dropout, cancellation, timeouts and malformed/oversized messages. The signaling service and channel are mocked in these tests. TypeScript and focused lint pass.

The combined app's isolated Chromium smoke passed against live PeerJS Cloud: host code registration, typed-code join, authoritative guest movement, continuing direct gameplay with both contexts offline, dropout and rejoin with the existing resident. No page errors. This caught and corrected the installed library's raw serializer name before release. Real two-iPhone testing remains required before describing co-op as stable.
