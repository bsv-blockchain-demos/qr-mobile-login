import type { SessionInfo } from '@bsv/wallet-relay/client'
import type { WalletMethod } from '../types/wallet'

interface Props {
  session: SessionInfo | null
  onRequest: (method: WalletMethod, params?: unknown) => void
}

// Script.fromASM('OP_NOP').toHex() — trivial locking script for demo tokens
const OP_NOP_LOCKING_SCRIPT = '61'

const actions: { id: string; method: WalletMethod; label: string; params?: unknown }[] = [
  {
    id: 'identity-key',
    method: 'getPublicKey',
    label: 'Get Identity Key',
    params: { identityKey: true },
  },
  {
    id: 'list-tokens',
    method: 'listOutputs',
    label: 'List Tokens',
    params: { basket: 'tokens' },
  },
  {
    id: 'create-event-ticket',
    method: 'createAction',
    label: 'Create Event Ticket',
    params: {
      description: 'create an event ticket',
      labels: ['demo'],
      outputs: [{
        satoshis: 1,
        lockingScript: OP_NOP_LOCKING_SCRIPT,
        basket: 'event tickets',
        outputDescription: 'event ticket',
      }],
    },
  },
  {
    id: 'list-event-tickets',
    method: 'listOutputs',
    label: 'List Event Tickets',
    params: { basket: 'event tickets' },
  },
  {
    id: 'list-actions',
    method: 'listActions',
    label: 'List Recent Actions',
    params: { labels: ['demo'], limit: 10, includeOutputs: true },
  },
]

export function WalletActions({ session, onRequest }: Readonly<Props>) {
  const connected = session?.status === 'connected'

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Wallet Actions
      </h2>

      {actions.map(({ id, method, label, params }) => (
        <button
          key={id}
          disabled={!connected}
          onClick={() => onRequest(method, params)}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium
                     hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          {label}
        </button>
      ))}

      {!connected && (
        <p className="text-xs text-gray-400 text-center">
          Connect mobile wallet to enable actions
        </p>
      )}
    </div>
  )
}
