# Wallet ↔ WebApp Secure Session Protocol

**QR Pairing + WebSocket Relay + BSV SDK Wallet-Native Encryption**

---

## 1. Goal

Enable a desktop web application to securely communicate with a mobile wallet by:

- Scanning a QR code once
- Establishing a persistent encrypted session
- Sending structured wallet RPC requests (sign, get balance, etc.)
- Supporting session resume without re-scanning
- Prioritizing **security, reliability, and UX**

---

## 2. High-Level Architecture

```
Desktop WebApp ── REST/WS ──► Relay Server (Backend) ◄── WebSocket ── Mobile Wallet
```

Key principles:

- Relay is a **stateless message router** — it never inspects plaintext
- All mobile ↔ relay payloads are **end-to-end encrypted using BSV SDK wallet primitives**
- Desktop and wallet both connect **outbound** to the relay
- No local HTTP or LAN communication required

### Phase 1 vs Library Target

**Phase 1 (this project):** The backend IS the relay and also holds a `WalletClient`. It decrypts
mobile messages and serves results to the desktop via REST. The desktop does no crypto — it just calls
HTTP endpoints. This is correct because you own and trust the relay.

**Library target (Phase 3):** The relay becomes a blind router (`{ topic, ciphertext }` only). The
desktop gets its own wallet and does encryption directly with the mobile. The relay never decrypts
anything. The `MobileWalletService` class API does not change between phases — only the internal
transport implementation does.

---

## 3. Key Model — BSV SDK Wallet-Native Encryption

This protocol uses the `@bsv/sdk` `WalletClient` encryption primitives. No custom ECDH, HKDF,
or symmetric cipher code is written — the SDK handles all of that internally.

### Identity Keys

Each wallet has a permanent root identity key. Both parties expose only their **public** identity key:

```ts
const { publicKey: identityKey } = await wallet.getPublicKey({ identityKey: true })
```

This is the only key that crosses the wire. Private keys never leave the device.

### Session Key Derivation (Internal to SDK)

When encrypting or decrypting, the SDK:

1. Derives a child private key from the wallet's root using `protocolID` + `keyID`
2. Performs ECDH between that child key and the counterparty's identity key
3. Uses the result as the symmetric encryption key

Both sides independently arrive at the same key because ECDH is commutative:

```
ECDH(backendChildPriv, mobileIdentityPub)
  = ECDH(mobileChildPriv, backendIdentityPub)   ← mathematically identical
```

The derived key is **never computed explicitly by application code** and is **never transmitted**.

### Encrypt / Decrypt API

```ts
// Encrypt (sender):
const { ciphertext } = await wallet.encrypt({
  protocolID,                   // e.g. [0, 'mobile-wallet-session']
  keyID,                        // sessionId — makes every session's key unique
  counterparty: otherIdentityKey,
  plaintext                     // Uint8Array
})

// Decrypt (receiver):
const { plaintext } = await wallet.decrypt({
  protocolID,
  keyID,
  counterparty: senderIdentityKey,
  ciphertext
})
```

### Why `keyID = sessionId`

Using the sessionId (base64url encoded) as `keyID` means each pairing session derives a
**unique symmetric key** even though both parties use the same identity keys. This provides
per-session isolation: compromising one session's derived context reveals nothing about other
sessions. It mirrors the forward-secrecy guarantee of the ephemeral keypair model, but using
wallet-native primitives instead of custom crypto.

### Security Properties

| Property | Guarantee |
|---|---|
| Private keys leave device | Never |
| Derived session key exposed | Never — internal to SDK |
| Session isolation | Yes — unique `keyID` per session |
| Replay protection | Yes — `seq` counter (Section 9.3) |
| Resume without re-scan | Yes — same `protocolID` + `keyID` + identity keys re-derive same context |
| Forward secrecy (per-session) | Yes — unique keyID per session; old sessions' keys are not derivable without their keyID |

---

## 4. Core Components

### 4.1 Backend — `MobileWalletService`

The backend holds a `WalletClient` instance used to:
- Derive its identity key (`getPublicKey({ identityKey: true })`) — included in QR
- Decrypt inbound messages from mobile (`wallet.decrypt(...)`)
- Encrypt outbound wallet requests to mobile (`wallet.encrypt(...)`)

**Responsibilities:**
- `init(app)` — register all Express routes
- `createSession()` — create topic/sessionId, generate QR, return to desktop
- `getSession(id)` — return status
- `sendRequest(sessionId, method, params)` — encrypt + relay to mobile, await response

### 4.2 Mobile Wallet Client (`MobileView`)

- Parses QR URI: reads `topic`, `relayURL`, `backendIdentityKey`, `protocolID`, `keyID`, `origin`, `expiry`
- Validates `expiry`
- Shows approval screen: origin, requested permission scope
- On approve:
  - Gets own identity key: `wallet.getPublicKey({ identityKey: true })`
  - Connects WS to relay
  - Sends encrypted `pairing_approved` containing `mobileIdentityKey`
- On each incoming message: decrypts with `wallet.decrypt({ protocolID, keyID, counterparty: backendIdentityKey, ciphertext })`
- Executes wallet method, encrypts response, sends back

### 4.3 Relay Server (inside Express backend)

- Accept WebSocket connections at `/ws?topic=<id>&role=desktop|mobile`
- Route by topic: messages from `mobile` socket are forwarded to `desktop` socket and vice versa
- Buffer messages for briefly-offline subscribers (short TTL, capped at 50 per topic)
- Heartbeat ping/pong every 30s; drop dead sockets
- Must **not** inspect, authenticate, or log message payloads

---

## 5. Pairing Flow (First Connection)

### Step 1 — Backend Creates Pairing Invitation

On `GET /api/session`, backend:

1. Generates `sessionId` — 32 random bytes (base64url) — serves as both `topic` and `keyID`
2. Gets its identity key: `wallet.getPublicKey({ identityKey: true })` → `backendIdentityKey`
3. Sets `expiry` = now + 120 seconds
4. Encodes QR URI:

```
bsv-browser://pair?topic=BASE64URL
              &relay=wss://relay.example.com
              &backendIdentityKey=BASE64URL
              &protocolID=BASE64URL
              &keyID=BASE64URL
              &origin=https://app.example.com
              &expiry=UNIX_TIMESTAMP
```

5. Generates QR data URL from that URI
6. Returns `{ sessionId, qrDataUrl, status: 'pending' }` to desktop

Backend subscribes to `topic` on the relay WebSocket.

### Step 2 — Mobile Scans QR

Mobile (`MobileView`):

1. Parses URI, validates `expiry` (reject if expired)
2. Shows approval screen: `origin`, permission scope, Approve / Reject
3. User approves
4. Gets own identity key: `wallet.getPublicKey({ identityKey: true })` → `mobileIdentityKey`
5. Connects WS to relay: `ws://relay/ws?topic=<sessionId>&role=mobile`
6. Encrypts and sends `pairing_approved`:

```ts
const { ciphertext } = await wallet.encrypt({
  protocolID,
  keyID,
  counterparty: backendIdentityKey,
  plaintext: JSON.stringify({
    id: uuid(),
    seq: 1,
    method: 'pairing_approved',
    params: {
      mobileIdentityKey,
      walletMeta: { name: 'MyWallet', platform: 'iOS' },
      permissions: ['getPublicKey', 'listOutputs']
    }
  })
})
// Wire: { topic, ciphertext }
```

### Step 3 — Backend Finalizes Session

Backend relay receives `pairing_approved` from mobile socket:

1. Decrypts:
```ts
const { plaintext } = await wallet.decrypt({
  protocolID,
  keyID,
  counterparty: mobileIdentityKey, // read from outer envelope first time — see note below*
  ciphertext
})
```
2. Reads `mobileIdentityKey` from decrypted payload, stores against `sessionId`
3. Marks session `connected`
4. Sends encrypted `pairing_ack` to mobile
5. Notifies desktop (via its WS or polling) that session is active

> *Bootstrap note: The very first message from mobile includes `mobileIdentityKey` in the
> encrypted payload. To decrypt it, the backend needs that key first. Resolution: mobile sends
> `mobileIdentityKey` **unencrypted in the outer envelope** of `pairing_approved` only, so the
> backend can decrypt the body and verify consistency. All subsequent messages use the stored key.

Session is now active.

---

## 6. Message Format

### JSON-RPC Envelope (plaintext before encryption)

**Request (backend → mobile):**
```json
{
  "id": "uuid",
  "seq": 42,
  "method": "getPublicKey",
  "params": { "protocolID": [0, "auth"], "keyID": "1" }
}
```

**Response (mobile → backend):**
```json
{
  "id": "uuid",
  "seq": 42,
  "result": { "publicKey": "..." }
}
```

**Error:**
```json
{
  "id": "uuid",
  "seq": 42,
  "error": { "code": 4001, "message": "User rejected" }
}
```

The `seq` field is a monotonically increasing counter per sender. Used for replay protection
(Section 9.3).

### Encrypted Wire Format

```json
{
  "topic":      "BASE64URL",
  "ciphertext": "BASE64URL"
}
```

Only during `pairing_approved` (one-time bootstrap):
```json
{
  "topic":             "BASE64URL",
  "mobileIdentityKey": "BASE64URL",
  "ciphertext":        "BASE64URL"
}
```

- **`topic`**: relay routing key
- **`ciphertext`**: output of `wallet.encrypt(...)` — integrity-protected by SDK
- No `ephPub`, no `nonce` in application code — the SDK manages all of this internally
- Relay receives only this outer envelope — `ciphertext` cannot be decrypted without the
  wallet's private key and the correct `protocolID` + `keyID` context

---

## 7. Session Resume Flow

### On Desktop Page Load

`MobileWalletService` reads stored `{ topic, mobileIdentityKey, protocolID, keyID }`:

1. Reconnects WS to relay, subscribes to topic
2. Sends encrypted `session_resume`:

```ts
await wallet.encrypt({
  protocolID, keyID,
  counterparty: mobileIdentityKey,
  plaintext: JSON.stringify({
    id: uuid(), seq: <next>,
    method: 'session_resume',
    params: { lastSeq: <last known mobile seq> }
  })
})
```

No new key material needed — `protocolID` + `keyID` + `mobileIdentityKey` are sufficient to
re-derive the same encryption context.

### Mobile Handling Resume

1. Receives `session_resume` envelope (contains `topic`, `ciphertext`)
2. Decrypts using stored `{ protocolID, keyID, backendIdentityKey }`
3. Online → sends encrypted `session_ack`
4. Offline → desktop shows "Open wallet to reconnect"

### Why Resume is Secure

The decryption key is derived from the wallet's private key + `protocolID` + `keyID` +
counterparty identity. An attacker who forges a message will produce a ciphertext the
wallet cannot decrypt — it is silently dropped. No session key is ever stored anywhere.

---

## 8. RPC Method Layer

The relay protocol is method-agnostic — it carries any JSON-RPC payload. Wallet RPC methods
(`getPublicKey`, `listOutputs`, etc.) are defined by the wallet implementation.

The wallet **always** shows an approval UI for sensitive methods. Non-sensitive reads may be
auto-approved based on the permission scope granted during pairing.

---

## 9. Security Design

### 9.1 Wallet-Native Key Derivation

Covered in Section 3. The BSV SDK `wallet.encrypt` / `wallet.decrypt` API handles ECDH,
key derivation, and symmetric encryption internally. Application code never handles raw key
material. Per-session isolation is guaranteed by `keyID = sessionId`.

### 9.2 AEAD Encryption

The BSV SDK uses authenticated encryption internally. Ciphertext integrity is verified before
any decryption output is used. A tampered ciphertext causes decryption to fail — message is
silently dropped.

### 9.3 Replay Protection

Each sender maintains a monotonically increasing `seq` counter. Each receiver tracks the
highest `seq` seen per sender and rejects messages with `seq ≤ lastSeen`.

On session resume, the desktop sends `lastSeq` it saw from the wallet; the wallet can skip
re-delivering already-processed requests.

### 9.4 Session Expiry and Revocation

- Pairing invitations expire (default: 120 seconds)
- Active sessions carry a `notAfter` timestamp (default: 30 days, renewable)
- Wallet can revoke any session from its session management UI
- On revocation, wallet sends encrypted `session_revoke` then closes topic subscription
- Desktop must handle `session_revoke` and clear local session state

### 9.5 Origin Binding

The desktop includes its `origin` in the pairing URI. The wallet stores and displays this.
On resume, the wallet can reject requests from a different origin than originally paired.

### 9.6 Permission Scopes

| Scope          | Allows                               |
|----------------|--------------------------------------|
| `read`         | balance, addresses, UTXOs            |
| `sign`         | transaction signing (always prompts) |
| `sign:auto`    | signing below threshold, no prompt   |
| `broadcast`    | push signed tx to network            |

Wallet enforces scope; any out-of-scope request returns error `4003 Unauthorized`.

### 9.7 What Must Never Happen

- Relay must not log or inspect message contents
- Private keys must never leave their device
- Derived session keys are never exposed by the SDK — do not attempt to extract them
- Blind signing (no approval UI for `sign` scope)
- Infinite sessions (enforce `notAfter`)

---

## 10. Scalability

### Memory Per Connection

| Component | Per Connection |
|---|---|
| `ws` internal state machine | ~4–8 KB |
| Kernel socket send/receive buffers | ~16–32 KB |
| **Total** | **~20–40 KB** |

At 10,000 concurrent users (20,000 connections): budget 1–2 GB RAM for the relay process.

### CPU

The relay does **zero crypto** — it routes opaque blobs. Node.js non-blocking I/O handles
high connection counts well. CPU is not the bottleneck.

### OS File Descriptor Limit

Linux defaults to 1,024 open file descriptors per process. Configure at startup:

```bash
ulimit -n 65535
```

### Message Buffer Size Cap

TTL buffer must have a hard per-topic limit (recommended: 50 messages). Messages beyond
the cap are dropped; the wallet catches up via `lastSeq` on resume.

### Scaling Thresholds

| Concurrent Users | Single Relay Node | Recommendation |
|---|---|---|
| < 1,000 | Stable | MVP fine |
| 1,000 – 5,000 | Borderline | Tune OS limits; monitor heap |
| 5,000 – 10,000 | Risky | Add second node + Redis pub/sub |
| 10,000+ | Not suitable | Full production design required |

### Horizontal Scaling Path

Relay nodes cross-publish via Redis channels. A message on Node A for a topic whose wallet
is on Node B is forwarded automatically. Clients reconnecting after a restart land on any
healthy node — the protocol is stateless by design.

---

## 11. Relay Server Design

### MVP

- Node.js + `ws`
- In-memory `topic → { desktopSocket, mobileSocket, buffer }` map
- Message TTL buffer (60 seconds for offline subscribers, 50 message cap)
- Heartbeat ping/pong every 30 seconds; drop dead sockets
- Nginx reverse proxy with TLS termination
- No message logging

### Production

- Stateless relay nodes behind load balancer
- Redis pub/sub for cross-node topic routing
- Per-topic and per-IP rate limiting
- DDoS protection at edge (Cloudflare or equivalent)
- Horizontal autoscaling

---

## 12. Multiple Tabs (Desktop)

If multiple browser tabs subscribe to the same topic, all receive relay messages. To prevent
duplicate RPC dispatches:

- Use `BroadcastChannel` for tab leader election
- Only the leader tab sends requests and processes responses
- Non-leader tabs defer and re-elect on leader close

---

## 13. UX Requirements

### First Connection

1. Desktop shows QR code with countdown timer (120s expiry)
2. Mobile shows: site origin, permission scope, Approve / Reject
3. On approve: desktop transitions to "Wallet Connected" immediately

### Subsequent Connections

1. Desktop reconnects silently on page load if session valid
2. If wallet offline: non-blocking banner "Open wallet to reconnect"
3. No QR re-scan unless session expired or revoked

### Wallet Session Management

- List of paired sites (origin, last seen, permissions)
- Per-session revoke button
- Global "revoke all" option

---

## 14. Build Roadmap

### Phase 1 — Prototype (current)

- WebSocket relay in Express backend (`ws` package)
- `QRSessionManager`: sessionId generation, QR encoding, 120s expiry
- `BackendWallet`: `WalletClient` instance, `getPublicKey({ identityKey: true })`, encrypt/decrypt
- `WebSocketRelay`: topic map, desktop + mobile socket registration, message bridging, TTL buffer, heartbeat
- `WalletRequestHandler`: JSON-RPC envelope, `seq` counter, `createRequest` / `parseResponse`
- `MobileWalletService`: orchestrates all of the above, exposes `init(app)` / `createSession()` / `sendRequest()`
- QR URI encoding: `backendIdentityKey` + `protocolID` + `keyID` + `topic` + `relayURL` + `origin` + `expiry`
- Mobile pairing flow: parse URI, approval screen, `pairing_approved` with `mobileIdentityKey`
- `pairing_ack`, basic `session_resume`

### Phase 2 — Stability

- `seq`-based replay protection (full enforcement)
- Session persistence (localStorage: `topic`, `mobileIdentityKey`, `protocolID`, `keyID`)
- Session expiry + revocation (`session_revoke` message)
- Multiple tab leader election (`BroadcastChannel`)
- Deep link wallet wake
- Permission scope enforcement

### Phase 3 — Production / Library

- Extract `MobileWalletService` + supporting classes into standalone npm package
- Blind relay mode: desktop gets own wallet, relay routes ciphertext only
- Redis pub/sub for horizontal scaling
- Rate limiting + DDoS protection
- Security audit
- Wallet identity key rotation (coordinated re-pairing)

---

## 15. BSV SDK Primitives Used

```ts
import { WalletClient } from '@bsv/sdk'

const wallet = new WalletClient('auto', 'localhost')

// Get identity key (share with counterparty):
const { publicKey: identityKey } = await wallet.getPublicKey({ identityKey: true })

// Encrypt a message to counterparty:
const { ciphertext } = await wallet.encrypt({
  protocolID: [0, 'mobile-wallet-session'],   // protocol security level + name
  keyID: sessionId,                            // base64url sessionId — unique per pairing
  counterparty: otherIdentityKey,              // other party's identity public key
  plaintext: new TextEncoder().encode(jsonString)
})

// Decrypt a message from counterparty:
const { plaintext } = await wallet.decrypt({
  protocolID: [0, 'mobile-wallet-session'],
  keyID: sessionId,
  counterparty: senderIdentityKey,
  ciphertext
})
const message = new TextDecoder().decode(plaintext)
```

`protocolID` is a tuple of `[securityLevel: 0|1|2, protocolName: string]`. Use `0` for
standard security. The same `protocolID` + `keyID` + both identity keys must be used on
both sides to produce matching keys.

---

## 16. Success Criteria

- QR pairing completes reliably within the expiry window
- Session resume connects in < 2 seconds when wallet is online
- Relay never sees plaintext payloads
- Wallet always shows approval UI for signing
- Mobile backgrounding does not break session recovery
- Session revocation takes effect immediately on both ends
- No private key or derived session key ever written to persistent storage
