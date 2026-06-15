import http from 'node:http'
import express from 'express'
import cors from 'cors'
import { ProtoWallet, PrivateKey } from '@bsv/sdk'
import { WalletRelayService } from '@bsv/wallet-relay'

const PORT           = Number(process.env['PORT']           ?? 3000)
const ORIGIN         = process.env['ORIGIN']                ?? 'http://localhost:5173'
const DESKTOP_ORIGIN = process.env['DESKTOP_ORIGIN']        ?? 'http://localhost:5173'

if (!process.env['WALLET_PRIVATE_KEY']) throw new Error('WALLET_PRIVATE_KEY environment variable is required')
const wallet = new ProtoWallet(PrivateKey.fromHex(process.env['WALLET_PRIVATE_KEY']))

// Allow both the public (ngrok) origin — used by the mobile when fetching
// GET /api/session/:id over HTTPS — and the local desktop origin (Vite dev
// server) which talks to this backend directly via Vite proxy.
const allowed = new Set([ORIGIN, DESKTOP_ORIGIN])

const app = express()
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowed.has(origin)),
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Desktop-Token'],
}))
app.use(express.json())

const server = http.createServer(app)

// Construct without `app` so the library does not auto-register
// `GET /api/session` (which forwards the browser's Origin header into the QR).
// We register routes manually below so the QR always embeds ORIGIN (ngrok),
// reachable by the mobile device.
const relay = new WalletRelayService({
  server,
  wallet,
  allowedOrigins: (o: string) => allowed.has(o),
})

app.get('/api/session', (_req, res) => {
  void relay.createSession()
    .then((info) => res.json(info))
    .catch((err) => {
      const msg = err instanceof Error ? err.message : 'Failed'
      res.status(500).json({ error: msg })
    })
})

app.get('/api/session/:id', (req, res) => {
  const info = relay.getSession(req.params['id']!)
  if (!info) {
    res.status(404).json({ error: 'Session not found' })
    return
  }
  res.json(info)
})

app.post('/api/request/:id', (req, res) => {
  const { method, params } = req.body as { method?: string; params?: unknown }
  if (!method) {
    res.status(400).json({ error: 'method is required' })
    return
  }
  const token = req.headers['x-desktop-token'] as string | undefined
  void relay.sendRequest(req.params['id']!, method, params, token)
    .then((response) => res.json(response))
    .catch((err) => {
      const msg = err instanceof Error ? err.message : 'Request failed'
      let status = 504
      if (msg === 'Invalid desktop token') status = 401
      else if (msg.startsWith('Session is')) status = 400
      res.status(status).json({ error: msg })
    })
})

app.delete('/api/session/:id', (req, res) => {
  const token = req.headers['x-desktop-token'] as string | undefined
  if (!token) {
    res.status(401).json({ error: 'Missing desktop token' })
    return
  }
  try {
    relay.deleteSession(req.params['id']!, token)
    res.status(204).end()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    const status = msg === 'Invalid desktop token' ? 401
      : msg === 'Session not found' ? 404
      : 500
    res.status(status).json({ error: msg })
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server    -> http://0.0.0.0:${PORT}`)
  console.log(`Public    -> ${ORIGIN}`)
  console.log(`WebSocket -> ${RELAY_URL_LOG()}`)
})

function RELAY_URL_LOG() {
  return process.env['RELAY_URL'] ?? 'ws://0.0.0.0:3000'
}
