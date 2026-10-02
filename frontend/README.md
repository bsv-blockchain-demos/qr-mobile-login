# BSV Remote Signer Frontend

React application for sending wallet requests through a local BRC-100 wallet or a paired mobile wallet. It includes wallet detection, QR pairing, connection status and a request log.

The current implementation uses `@bsv/wallet-relay` for mobile sessions. The mobile wallet application is a separate prerequisite and is not included in this repository.

## Local wallet mode

Use Node.js 22.13 or later in the 22.x release line, and npm. From the repository root:

```sh
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Open `http://localhost:5173`. The app first tries a local wallet. If one is available, requests go directly to it. Otherwise, the interface offers a wallet installation link and mobile QR pairing.

The controls request an identity public key, list token outputs, create an event-ticket output, list event tickets and list recent demo-labelled actions. **Create Event Ticket** requests a real wallet transaction with a one-satoshi output and transaction fees; it is not a visual-only simulation.

## Mobile pairing dependencies

Mobile mode requires the [backend](../backend/src/index.ts), a compatible mobile wallet and API/WebSocket addresses reachable from the phone.

From the repository root, install the backend dependencies:

```sh
cd backend
npm ci
```

Create `backend/.env` with your own values for:

| Variable | Purpose |
| --- | --- |
| `WALLET_PRIVATE_KEY` | Required hexadecimal private key for the backend's `ProtoWallet`. Keep it on the server. |
| `PORT` | Backend HTTP and WebSocket port; defaults to `3000`. |
| `ORIGIN` | Frontend origin embedded in pairing invitations and allowed by CORS; defaults to `http://localhost:5173`. |
| `DESKTOP_ORIGIN` | Additional desktop origin allowed by CORS; defaults to `http://localhost:5173`. |
| `RELAY_URL` | WebSocket URL advertised by the relay library; use a phone-reachable address for mobile pairing. |

Start the backend with `npm run dev` from `backend/`.

The frontend calls relative `/api` paths. During development, [vite.config.ts](vite.config.ts) proxies `/api` to `http://localhost:3000` and `/ws` to `ws://localhost:3000`. To change those targets, supply environment variables to the Vite process:

```sh
API_URL=http://localhost:3000 WS_URL=ws://localhost:3000 npm run dev -- --host 127.0.0.1
```

The Vite configuration reads `process.env` directly and does not load the unprefixed values from `.env.example` itself. Export them or use the command form above.

A phone cannot reach the desktop through the phone's own `localhost`. Configure the public origin, relay URL and any proxy or tunnel consistently; the Vite configuration also has a fixed allowed hostname that may need updating. A production host must provide the API and WebSocket routing because Vite's development proxy is not part of the static bundle.

## Build status

```sh
npm run build
npm run lint
npm run preview -- --host 127.0.0.1
```

The production build currently fails in `DesktopView.tsx`: the local wallet request handler accepts a narrower set of methods than the shared workspace callback type. Development mode can serve the app, but a production build requires this type mismatch to be resolved. Successful builds write `dist/`.

No application test script is defined. The repository's development checks also include `npx tsc --noEmit` in both frontend and backend; the frontend production build performs the project-reference type check.

## Source guide

- [DesktopView.tsx](src/views/DesktopView.tsx): local-wallet detection and mobile-mode selection.
- [useLocalWallet.ts](src/hooks/useLocalWallet.ts): direct wallet requests.
- [useWalletSession.ts](src/hooks/useWalletSession.ts): relay library integration.
- [WalletActions.tsx](src/components/WalletActions.tsx): request parameters and example transaction.
- [Backend entry point](../backend/src/index.ts): session routes and relay service configuration.

Older architecture notes describe service classes and a mobile app tree that are no longer present in this checkout. Use the current entry points above when tracing behaviour.

## Licence

This frontend's [package.json](package.json) has no licence declaration. The backend declares the **ISC licence**; see the [repository licence section](../README.md#licence) for the recorded declarations. No standalone licence file is included in this repository.
