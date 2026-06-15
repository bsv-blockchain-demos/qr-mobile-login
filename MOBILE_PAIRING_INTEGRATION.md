# Mobile Pairing Integration

Documents how the mobile-side pairing system is integrated into `bsv-browser`.

---

## Source Files

The pairing feature lives in `mobile-pairing/` at the repo root and was copied into `bsv-browser` at the locations below.

| Source | Destination in `bsv-browser` | Role |
|---|---|---|
| `mobile-pairing/pair.tsx` | `app/pair.tsx` | Approval screen + WS pairing flow + wallet RPC handler |
| `mobile-pairing/connections.tsx` | `app/connections.tsx` | Connection list screen with QR scan button |
| `mobile-pairing/ConnectionStore.ts` | `stores/ConnectionStore.ts` | MobX store, persists connections via AsyncStorage |
| `mobile-pairing/QRScanner.tsx` | `components/QRScanner.tsx` | Camera-based QR scanner using `expo-camera` |

---

## Navigation Integration

### Stack registration (`app/_layout.tsx`)

`connections` and `pair` are registered as Stack screens alongside the existing app screens:

```tsx
<Stack.Screen name="connections" />
<Stack.Screen name="pair" />
```

Expo Router picks them up automatically from `app/connections.tsx` and `app/pair.tsx`.

### Menu entry (`components/browser/MenuPopover.tsx`)

A **Connections** row (icon: `link-outline`) was added to the wallet section of the `...` popover menu. It is only shown in Web3 mode (same condition as the Wallet row):

```tsx
<Row icon="link-outline" label="Connections" onPress={dismiss(onConnections)} />
```

The `onConnections` prop was added to `MenuPopoverProps` and destructured in the component.

### Handler (`app/index.tsx`)

The handler is passed to `MenuPopover` in the browser screen:

```tsx
onConnections={() => router.push('/connections')}
```

---

## User Flow

```
... menu
  └─ Connections
       └─ /connections  (ConnectionsScreen)
            ├─ Lists existing connections (active / disconnected)
            └─ "Scan QR Code" button
                  └─ QRScanner modal
                       └─ Scans bsv-browser://pair?... URI from desktop
                            └─ /pair?topic=&relay=&backendIdentityKey=&protocolID=&keyID=&origin=&expiry=
                                 └─ PairScreen
                                      ├─ Validates expiry
                                      ├─ Shows approval screen (origin + permissions)
                                      ├─ On approve: WalletClient.getPublicKey({ identityKey: true })
                                      ├─ Opens WebSocket to relay (role=mobile)
                                      ├─ Sends encrypted pairing_approved with mobileIdentityKey in outer envelope
                                      ├─ Receives pairing_ack → session live
                                      ├─ Saves connection to ConnectionStore
                                      └─ Handles incoming wallet RPC requests (getPublicKey, listOutputs)
```

---

## ConnectionStore

`stores/ConnectionStore.ts` — MobX observable, persisted to `AsyncStorage` under the key `connections`.

```ts
interface Connection {
  sessionId: string          // doubles as topic + keyID
  origin: string
  relay: string
  backendIdentityKey: string
  mobileIdentityKey: string
  protocolID: string         // JSON-stringified WalletProtocol
  keyID: string
  connectedAt: number
  status: 'active' | 'disconnected'
}
```

Key methods: `add(connection)`, `setStatus(sessionId, status)`, `remove(sessionId)`.

---

## Encryption

All messages use `@bsv/sdk` wallet-native primitives — no custom crypto. See `wallet-session-protocol.md` and `CLAUDE.md` for the full encryption model.

The `pair.tsx` helpers:

```ts
encryptToEnvelope(wallet, topic, protocolID, keyID, counterparty, payload)
  // → base64url ciphertext string

decryptEnvelope(wallet, protocolID, keyID, counterparty, ciphertextB64)
  // → plaintext string
```

Both use `Array.from(...)` for `plaintext`/`ciphertext` (SDK expects `number[]`, not `Uint8Array`).

---

## Adding New Wallet Methods

Wallet RPC methods are dispatched in `handleWalletRpc` at the bottom of `app/pair.tsx`:

```ts
switch (request.method) {
  case 'getPublicKey':
    result = await wallet.getPublicKey(...)
    break
  case 'listOutputs':
    result = await wallet.listOutputs(...)
    break
  default:
    error = { code: 501, message: `Method "${request.method}" not implemented on mobile` }
}
```

Add new cases here. The corresponding method must also be added on the desktop side in `frontend/src/components/WalletActions.tsx` and `backend/src/services/WalletRequestHandler.ts`.
