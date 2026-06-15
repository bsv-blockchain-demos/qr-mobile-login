# MobileQRWallet — CLAUDE.md

## Project Overview

Desktop webapp that lets a mobile device act as a remote BSV wallet signer. The desktop shows a QR code; the mobile scans it, approves the connection, and from that point handles encrypted wallet requests relayed through the backend. All wallet keys stay on the mobile device. The backend never routes plaintext.

The backend service layer is structured for future extraction into a standalone npm library — `MobileWalletService` is the intended public API surface.

---

## Monorepo Structure

```
MobileQRWallet/
├── wallet-session-protocol.md    Full protocol spec — read this first
├── frontend/                     Vite + React 19 + TypeScript + Tailwind v4
└── backend/                      Express + TypeScript + ws (Node.js)
```

---

## Dev Commands

```bash
# From repo root
npm run dev:frontend     # Vite → http://localhost:5173
npm run dev:backend      # ts-node Express → http://localhost:3000

# TypeScript checks (run both before committing)
cd frontend && npx tsc --noEmit
cd backend && npx tsc --noEmit
```

---

## Environment Variables

`backend/.env` (not committed):

```
PORT=3000
RELAY_URL=ws://localhost:3000
ORIGIN=http://localhost:5173
```

---

## Encryption Model — Critical to Understand

All mobile ↔ backend messages are encrypted using `@bsv/sdk` wallet-native primitives. **No custom crypto.**

### Identity keys
Each wallet exposes its identity public key — this is the only key that crosses the wire:
```ts
const { publicKey: identityKey } = await wallet.getPublicKey({ identityKey: true })
```

### Encrypt / Decrypt
```ts
wallet.encrypt({ protocolID: PROTOCOL_ID, keyID: sessionId, counterparty: otherIdentityKey, plaintext: Array.from(bytes) })
wallet.decrypt({ protocolID: PROTOCOL_ID, keyID: sessionId, counterparty: senderIdentityKey, ciphertext: Array.from(bytes) })
```

- `PROTOCOL_ID = [0, 'mobile-wallet-session']` — typed as `WalletProtocol` at declaration in `backend/src/types/wallet.ts`; no cast needed on import
- `keyID = sessionId` — makes every session's derived key unique
- SDK handles ECDH + key derivation internally; derived keys are never exposed
- **Type notes:** `plaintext`/`ciphertext` are `Byte[]` (`number[]`), not `Uint8Array` — use `Array.from(...)` when passing in, `new Uint8Array(result)` when reading out.

### Bootstrap problem
The very first message (`pairing_approved`) needs the mobile's identity key to decrypt, but that key is inside the encrypted payload. Resolution: mobile sends `mobileIdentityKey` **unencrypted in the outer wire envelope** on `pairing_approved` only. Backend uses it to decrypt the body, verifies consistency, then stores it. All subsequent messages use the stored key.

---

## Backend Architecture

### Service Classes

#### `MobileWalletService` (`src/services/MobileWalletService.ts`)
Main orchestrator. Call `walletService.init(app, server)` once in `index.ts`.

Public methods:
- `init(app, server)` — registers routes + attaches `WebSocketRelay`
- `createSession()` — creates session, builds pairing URI, returns QR data URL
- `getSession(id)` — returns `{ sessionId, status }`
- `sendRequest(sessionId, method, params)` — encrypts + relays to mobile, returns `Promise<RpcResponse>` (30s timeout)

Internal flow on mobile message:
1. If `pairing_approved` (has `mobileIdentityKey` in outer envelope + session is `pending`) → `handlePairingApproved()`
2. Otherwise → decrypt, match `id` against `pending` Map, resolve the waiting Promise

#### `BackendWallet` (`src/services/BackendWallet.ts`)
Thin wrapper around `WalletClient` for session crypto. Caches identity key after first fetch.

Methods: `getIdentityKey()`, `encrypt({ sessionId, counterparty, plaintext })`, `decrypt({ sessionId, counterparty, ciphertext })`

#### `QRSessionManager` (`src/services/QRSessionManager.ts`)
In-memory session store. Sessions use `randomBytes(32).toString('base64url')` as ID (also the `keyID`).

- Pairing window: 120s (after which `status` becomes `expired` for pending sessions)
- Session TTL: 30 days
- `buildPairingURI()` — encodes `topic`, `relay`, `backendIdentityKey`, `protocolID`, `keyID`, `origin`, `expiry` into `bsv-browser://pair?...`

Statuses: `pending` → `connected` → `disconnected` | `expired`

#### `WebSocketRelay` (`src/services/WebSocketRelay.ts`)
Topic-keyed bridge between desktop and mobile WebSocket connections. Mounts at `/ws`.

- Connections: `ws://host/ws?topic=<sessionId>&role=desktop|mobile`
- On message from mobile → forwards to desktop socket (or buffers)
- On message from desktop → forwards to mobile socket (or buffers)
- Also calls `onIncoming` handler so `MobileWalletService` can intercept `pairing_approved`
- Buffer: 60s TTL, 50 message cap per topic
- Heartbeat: ping every 30s, terminates non-responsive sockets

#### `WalletRequestHandler` (`src/services/WalletRequestHandler.ts`)
Pure JSON-RPC utilities, no I/O.

- `createRequest(method, params)` → `RpcRequest` with UUID + incrementing `seq`
- `createProtocolMessage(method, params)` → same, for protocol-level messages
- `parseMessage(raw)` → `RpcRequest | RpcResponse`
- `isResponse(msg)` → type guard

### Backend Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/session` | Create session + QR, return `{ sessionId, status, qrDataUrl }` |
| `GET` | `/api/session/:id` | Return `{ sessionId, status }` |
| `POST` | `/api/request/:id` | Body `{ method, params }` — encrypt + relay to mobile, await response |
| `WS` | `/ws?topic=&role=` | WebSocket endpoint for desktop and mobile |

---

## Frontend Architecture

### Routing (`App.tsx`)
- `/` → `DesktopView` — QR display, wallet action buttons, request log
- `/mobile?topic=&relay=&backendIdentityKey=&protocolID=&keyID=&origin=&expiry=` → `MobileView`

### Key Files

| File | Responsibility |
|------|---------------|
| `hooks/useWalletSession.ts` | Creates session on mount, polls `/api/session/:id` until connected, dispatches `POST /api/request/:id` |
| `components/QRDisplay.tsx` | Renders QR `<img src={dataUrl}>` + status badge, refresh button on expiry |
| `components/WalletActions.tsx` | Buttons for each wallet method; disabled until `status === 'connected'` |
| `components/RequestLog.tsx` | Live list of `{ request, response, pending }` entries |
| `views/DesktopView.tsx` | Composes the above with `useWalletSession` |
| `views/MobileView.tsx` | Parses QR params, approval screen, WS connection, wallet request handler |

### `MobileView` TODOs
The structure and flow are complete. Wire in `WalletClient` when mobile wallet SDK is available:
1. Replace `PLACEHOLDER_MOBILE_IDENTITY_KEY` with `(await wallet.getPublicKey({ identityKey: true })).publicKey`
2. Replace `PLACEHOLDER_CIPHERTEXT` with `wallet.encrypt(...)` output
3. In `ws.onmessage`: replace `atob(ciphertext)` parse with `wallet.decrypt(...)` then parse
4. In `handleWalletRequest`: implement each `method` case using `wallet.<method>(params)`

### Styling
Tailwind v4 via `@tailwindcss/vite` plugin. No config file needed.
`src/index.css` → `@import "tailwindcss";`

---

## Wire Format

### Outer envelope (what the relay routes)
```ts
interface WireEnvelope {
  topic: string        // sessionId — relay routing key
  ciphertext: string   // base64url output of wallet.encrypt
  mobileIdentityKey?: string  // ONLY on pairing_approved (bootstrap)
}
```

### Inner payload (plaintext before encryption)
```ts
// Request
{ id: string, seq: number, method: string, params: unknown }

// Response
{ id: string, seq: number, result?: unknown, error?: { code: number, message: string } }
```

---

## Protocol Types

`backend/src/types/wallet.ts` and `frontend/src/types/wallet.ts` are kept in sync manually.

Key exports:
- `PROTOCOL_ID: WalletProtocol` — typed at declaration in `backend/src/types/wallet.ts`; import and use directly, no cast needed
- `RpcRequest`, `RpcResponse`, `WireEnvelope`, `Session`, `SessionInfo`, `SessionStatus`

---

## Key Dependencies

**Backend:** `express`, `cors`, `ws`, `qrcode`, `@bsv/sdk`
**Frontend:** `react`, `react-router-dom`, `@tailwindcss/vite`

`@bsv/message-box-client` was evaluated and removed — custom WebSocket relay is simpler and gives full session control. The wallet operations still use `@bsv/sdk`.

---

## Current TODO / Stub Locations

Search `// TODO` in the codebase. All remaining stubs are in `MobileView.tsx` and require a mobile `WalletClient`:

1. `MobileView.tsx` — replace placeholder identity key with `wallet.getPublicKey({ identityKey: true })`
2. `MobileView.tsx` — replace placeholder ciphertext with `wallet.encrypt(...)` on `pairing_approved`
3. `MobileView.tsx` — replace `atob` parse in `onmessage` with `wallet.decrypt(...)`
4. `MobileView.tsx:handleWalletRequest` — implement `getPublicKey` and `listOutputs` cases

Phase 2 items (not yet started):
- `seq`-based replay protection (track per-sender highwater mark)
- Session persistence to localStorage (`topic`, `mobileIdentityKey`, `protocolID`, `keyID`)
- Session resume flow (`session_resume` / `session_ack` messages)
- Session revocation (`session_revoke`)
- Multiple tab leader election (`BroadcastChannel`)

---

## Library Extraction Plan

When the service layer is tested:
1. Move `MobileWalletService`, `BackendWallet`, `QRSessionManager`, `WebSocketRelay`, `WalletRequestHandler`, and `types/wallet.ts` into a standalone npm package
2. Public API: `MobileWalletService` only — all other classes are internal
3. Phase 3: relay becomes a blind router; desktop gets its own wallet for true E2E encryption
