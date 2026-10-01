# BSV Remote Signer Demo

A desktop web application that sends wallet requests to a local BRC-100 wallet or a paired mobile wallet. It demonstrates wallet detection, QR pairing, connection status and a request log using `@bsv/wallet-relay`.

The repository contains the desktop frontend and relay backend. A compatible mobile wallet is a separate prerequisite and is not included here.

## Architecture

| Component | Role |
| --- | --- |
| [frontend/](frontend/README.md) | React and Vite interface with local-wallet and mobile-session modes. |
| [backend/src/index.ts](backend/src/index.ts) | Express HTTP routes and the wallet relay service. |
| Local or mobile wallet | Handles wallet requests and any required user approvals. |

Local-wallet requests go directly from the interface to the wallet. In mobile mode, the frontend calls the backend's session/request API, and the relay library manages communication with the paired wallet. The backend handles request parameters and responses, so it must be treated as a trusted part of the demonstration.

The controls request an identity key, inspect outputs and actions, and create an event-ticket output. Creating a ticket requests a real wallet transaction with a one-satoshi output and fees.

## Run with a local wallet

Use Node.js 22.13 or later in the 22.x release line, and npm. From the repository root:

```sh
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Open `http://localhost:5173`. The application first tries a local wallet. If none is available, it offers wallet installation and mobile pairing options.

## Configure mobile pairing

Install backend dependencies from the repository root:

```sh
cd backend
npm ci
```

Create `backend/.env` with your own values:

| Variable | Purpose |
| --- | --- |
| `WALLET_PRIVATE_KEY` | Required hexadecimal private key for the relay's server-side `ProtoWallet`. |
| `PORT` | HTTP and WebSocket port; defaults to `3000`. |
| `ORIGIN` | Public frontend origin used for pairing and allowed origins. |
| `DESKTOP_ORIGIN` | Additional desktop origin allowed by CORS; defaults to `http://localhost:5173`. |
| `RELAY_URL` | Advertised WebSocket address reachable by the mobile wallet. |

Start the backend with `npm run dev`. It listens on all network interfaces.

A phone cannot reach the desktop through the phone's own `localhost`. Configure the advertised origin, WebSocket URL and any proxy or tunnel consistently. The Vite configuration also contains a fixed allowed hostname that may need updating.

The frontend proxies `/api` and `/ws` to port 3000 during development. Its `API_URL` and `WS_URL` overrides must be supplied to the Vite process; placing those unprefixed values in `.env.example` does not load them automatically. See the [frontend setup guide](frontend/README.md#mobile-pairing-dependencies) for commands and routing details.

## Build status

The backend supports `npm run build` and `npm start`. Its start script compiles the code and loads `backend/.env`.

The frontend's `npm run build` currently fails in `DesktopView.tsx` because the local-wallet request handler has a narrower method type than the shared callback. Resolve that mismatch before producing a deployment build.

Run `npx tsc --noEmit` in both components as a development check. The frontend production build performs an additional project-reference check. No automated test scripts are defined.

Production hosting must provide HTTP API and WebSocket routing; Vite's development proxy is not included in the static build. The current session routes and relay library are the source of truth for the architecture; older notes describe service classes and mobile application files that are absent from this checkout.
