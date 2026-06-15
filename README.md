# MobileQRWallet

A desktop web app that uses a mobile BSV wallet as a remote signer. The desktop shows a QR code — scan it with the **bsv-browser** mobile app to approve the connection, then sign wallet requests from your phone without exposing any private keys to the desktop or relay server.

## How It Works

```
Desktop browser                       Backend relay                    bsv-browser (mobile)
───────────────                       ─────────────                    ────────────────────
1. Load app
2. GET /api/session ─────────────────►
   ◄── { sessionId, qrDataUrl } ──────
3. Display QR + open WS ────────────► ws://.../ws?topic=<id>&role=desktop
                                                                       4. Camera scans QR
                                                                       5. Validates bsv-browser:// URI
                                                                       6. Navigates to pair screen
                                                                       7. User approves connection
                                                                       8. Connect WS ──────────► ws://.../ws?topic=<id>&role=mobile
                                                                       9. Send encrypted pairing_approved
                                                                          (mobileIdentityKey in outer envelope)
                                       10. Decrypt, verify + store mobileIdentityKey
                                       11. Send encrypted pairing_ack ──────────────►
                                       12. Mark session connected
13. Poll → status: connected ─────────►
14. Enable action buttons
15. POST /api/request/:id ───────────►
    { method, params }                 16. Encrypt → relay to mobile ──────────────►
                                                                       17. Approval modal (if needed)
                                                                       18. wallet.decrypt → execute
                                                                       19. wallet.encrypt response ──►
                                       20. Relay to desktop ◄──────────
   ◄── { result } ────────────────────
```

### Key Properties

- **Keys never leave the device** — the mobile wallet's private key never crosses the wire
- **End-to-end encrypted** — all mobile ↔ backend messages use BSV SDK wallet primitives; the relay never sees plaintext
- **Per-session key isolation** — each QR scan produces a unique encryption context (`keyID = sessionId`), so no two sessions share a derived key
- **No custom crypto** — encryption is handled entirely by `wallet.encrypt` / `wallet.decrypt` from `@bsv/sdk`
- **Mobile is the trust anchor** — the mobile validates every QR code, rejects unknown relay hosts, locks sessions to the original device identity key, and requires explicit user approval for sensitive wallet operations

---

## Encryption Model

Encryption uses `@bsv/sdk`'s wallet-native API. Both sides share:
- `protocolID: [0, 'mobile-wallet-session']`
- `keyID: sessionId` (the session ID doubles as the key derivation context)
- Each other's **identity public key** (from `wallet.getPublicKey({ identityKey: true })`)

The SDK internally derives a child key from the wallet's root identity using `protocolID` + `keyID`, performs ECDH against the counterparty's identity key, and uses the result for symmetric encryption. The derived key is never exposed to application code.

```ts
// Encrypt (either side):
wallet.encrypt({ protocolID, keyID: sessionId, counterparty: otherIdentityKey, plaintext })

// Decrypt (either side):
wallet.decrypt({ protocolID, keyID: sessionId, counterparty: senderIdentityKey, ciphertext })
```

The QR code carries the backend's identity key + `protocolID` + `keyID` so the mobile can decrypt from the first message. The mobile's identity key is sent unencrypted in the outer envelope of `pairing_approved` only (the bootstrap problem), then stored by the backend for all subsequent decryption.

---

## Project Structure

```
MobileQRWallet/
├── wallet-session-protocol.md        Full protocol specification
├── MOBILE_PAIRING_INTEGRATION.md     Integration guide for bsv-browser pairing
│
├── frontend/                         Desktop UI — Vite + React 19 + TypeScript + Tailwind v4
│   └── src/
│       ├── views/
│       │   └── DesktopView.tsx       QR display, wallet action buttons, request log
│       ├── components/
│       │   ├── QRDisplay.tsx
│       │   ├── WalletActions.tsx
│       │   └── RequestLog.tsx
│       ├── hooks/
│       │   └── useWalletSession.ts   Session creation, status polling, request dispatch
│       └── types/wallet.ts
│
├── backend/                          Express + WebSocket relay — Node.js + TypeScript
│   └── src/
│       ├── index.ts                  Server bootstrap, rate limiting, CORS
│       ├── services/
│       │   ├── MobileWalletService.ts    Main orchestrator (library entry point)
│       │   ├── BackendWallet.ts          WalletClient wrapper (identity key, encrypt, decrypt)
│       │   ├── QRSessionManager.ts       Session lifecycle, QR generation, 10-min GC
│       │   ├── WebSocketRelay.ts         Topic-based WS bridge with payload cap + topic validation
│       │   └── WalletRequestHandler.ts   JSON-RPC envelope + seq counter
│       └── types/wallet.ts
│
└── bsv-browser/                      Mobile wallet app — Expo + React Native + MobX
    ├── app/
    │   ├── _layout.tsx               Expo Router root — registers pair + connections screens
    │   ├── index.tsx                 Browser home screen (Web3 mode entry point)
    │   ├── pair.tsx                  Pairing screen: approve connection, WS lifecycle,
    │   │                             RPC approval modal, wallet method execution
    │   └── connections.tsx           Connection manager: list active/disconnected sessions,
    │                                 disconnect (sends encrypted session_revoke), reconnect
    ├── components/
    │   ├── QRScanner.tsx             expo-camera QR scanner (bsv-browser:// URIs only)
    │   └── browser/
    │       └── MenuPopover.tsx       Burger menu — includes Connections entry in Web3 mode
    └── stores/
        └── ConnectionStore.ts        MobX store, persisted via AsyncStorage (30-day sessions)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A BSV wallet daemon accessible to the backend (e.g. MetaNet Desktop)
- For the mobile app: an Android or iOS device with the `bsv-browser` development build installed

### Install

```bash
# From repo root
npm run install:all
```

### Environment

Create `backend/.env`:

```env
PORT=3000
API_URL=http://localhost:3000
ORIGIN=http://localhost:5173
DOMAIN=http://localhost:5173
```

Create `bsv-browser/.env.local`:

```env
EXPO_PUBLIC_DEFAULT_WAB_URL=https://wab-us-1.bsvb.tech
EXPO_PUBLIC_DEFAULT_STORAGE_URL=https://store-us-1.bsvb.tech
EXPO_PUBLIC_DEFAULT_MESSAGEBOX_URL=https://message-box-us-1.bsvb.tech
```

### Run desktop + backend

```bash
# Terminal 1
npm run dev:backend    # Express + WS relay → http://localhost:3000

# Terminal 2
npm run dev:frontend   # Vite → http://localhost:5173
```

Open `http://localhost:5173` in a desktop browser.

### Run mobile app

```bash
cd bsv-browser

# First-time: create a development build (EAS cloud, requires Expo account)
npm run build:android:dev

# Once installed on device, start the dev server
npx expo start
```

Scan the QR code on the desktop with the **Connections** screen in bsv-browser (menu → Connections → Scan QR Code).

---

## Wallet Methods

| Method | Description | Approval |
|--------|-------------|----------|
| `getPublicKey` | Retrieve a derived public key | Auto-approved |
| `listOutputs` | List BSV outputs from the wallet | User approval required |

The approval modal appears for all methods except those in `AUTO_APPROVE_METHODS` (`pair.tsx`). Methods not in `IMPLEMENTED_METHODS` are rejected immediately with code `501` without prompting the user.

To add a new method: add it to `IMPLEMENTED_METHODS` in `pair.tsx`, implement the case in `handleWalletRpc`, add a button in `WalletActions.tsx`.

---

## Security Model

### What the relay sees
The relay receives and forwards `WireEnvelope` objects — `{ topic, ciphertext }`. The `ciphertext` is the output of `wallet.encrypt`; the relay has no access to the derived session key and cannot decrypt any payload.

### Session locking
Once a mobile device completes the initial pairing handshake, its identity key is stored in the session. Any reconnect attempt from a different device (different identity key) is silently rejected, even if it knows the session topic.

### QR code validation (mobile)
The mobile validates every scanned QR code before navigating to the pair screen:
- All required fields must be present
- QR expiry is checked at scan time
- Relay URL must use `ws://` or `wss://`
- **Relay hostname must match origin hostname** — prevents QR phishing attacks where a malicious QR points to an attacker-controlled relay
- `backendIdentityKey` must be a valid compressed secp256k1 public key
- `protocolID` must be a `[number, string]` tuple
- `keyID` must equal `topic`

### Replay protection
Each backend message carries a monotonically increasing `seq`. The mobile tracks a per-session highwater mark and drops any message with `seq ≤ lastSeq`.

### Rate limiting (backend)
| Route | Limit |
|-------|-------|
| `GET /api/session` | 5 / minute / IP |
| `GET /api/session/:id` | 60 / minute / IP |
| `POST /api/request/:id` | 30 / minute / IP |
| WebSocket payload | 64 KB max per frame |

### Session lifecycle
- Pairing window: 2 minutes (QR expiry)
- Session TTL: 30 days
- GC runs every 10 minutes — expired sessions are removed from memory and their relay topic entries are cleaned up
- Stale WebSocket connections are terminated after 60 seconds (30s ping + 30s grace)

---

## Current Status

| Area | Status |
|------|--------|
| Session lifecycle (`QRSessionManager`) + 10-min GC | Done |
| QR generation + pairing URI encoding | Done |
| WebSocket relay — TTL buffer, heartbeat, payload cap, topic validation | Done |
| Backend wallet encrypt/decrypt (`BackendWallet`) | Done |
| Pairing handshake (`pairing_approved` / `pairing_ack`) | Done |
| Reconnect flow (identity key lock, any-message ack) | Done |
| Session revocation (`session_revoke` encrypted message) | Done |
| JSON-RPC request relay + 30s timeout Promise | Done |
| Desktop UI (QR, actions, log) | Done |
| Mobile pairing screen + WS connection (`pair.tsx`) | Done |
| Mobile wallet encrypt / decrypt via `WalletClient` | Done |
| Mobile wallet method execution (`getPublicKey`, `listOutputs`) | Done |
| RPC approval modal (auto-approve `getPublicKey`, prompt others) | Done |
| Connection manager screen (`connections.tsx`) | Done |
| MobX `ConnectionStore` with AsyncStorage persistence | Done |
| Seq-based replay protection (mobile highwater mark) | Done |
| QR validation + relay host trust check (mobile) | Done |
| Rate limiting on REST routes (backend) | Done |
| CORS restriction to configured origin | Done |
| Session persistence across app restarts | Done — via `ConnectionStore` |
| Session resume flow (`session_resume` / `session_ack`) | TODO (Phase 2) |
| Backend seq highwater mark (server-side replay protection) | TODO (Phase 2) |
| Multiple tab leader election (`BroadcastChannel`) | TODO (Phase 2) |

---

## Protocol Specification

See [`wallet-session-protocol.md`](./wallet-session-protocol.md) for the full protocol design including the key model, pairing flow, wire format, session resume, security properties, and scalability notes.

See [`MOBILE_PAIRING_INTEGRATION.md`](./MOBILE_PAIRING_INTEGRATION.md) for the bsv-browser integration guide — file mapping, navigation wiring, ConnectionStore interface, and how to add new wallet methods.

---

## Library Extraction

`MobileWalletService` and its dependencies are designed to be extracted into a standalone npm package. The public API surface is `MobileWalletService` only — all other service classes are internal. In Phase 3 the relay becomes a blind router and the desktop gets its own wallet for true end-to-end encryption with no plaintext anywhere on the server.
