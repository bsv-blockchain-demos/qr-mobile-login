import type { WalletMethod } from '../types/wallet'

interface Props {
  connected: boolean
  onRequest: (method: WalletMethod, params?: unknown) => void
  signingHint?: string
}

const OP_NOP_LOCKING_SCRIPT = '61'

type ActionDef = {
  id: string
  method: WalletMethod
  label: string
  description: string
  params?: unknown
  icon: 'key' | 'coins' | 'ticket' | 'list' | 'history'
}

type ActionGroup = {
  title: string
  actions: ActionDef[]
}

const groups: ActionGroup[] = [
  {
    title: 'Identity',
    actions: [
      {
        id: 'identity-key',
        method: 'getPublicKey',
        label: 'Get Identity Key',
        description: 'Retrieve the wallet identity public key',
        params: { identityKey: true },
        icon: 'key',
      },
    ],
  },
  {
    title: 'Tokens',
    actions: [
      {
        id: 'list-tokens',
        method: 'listOutputs',
        label: 'List Tokens',
        description: 'View outputs in the tokens basket',
        params: { basket: 'tokens' },
        icon: 'coins',
      },
    ],
  },
  {
    title: 'Event Tickets',
    actions: [
      {
        id: 'create-event-ticket',
        method: 'createAction',
        label: 'Create Event Ticket',
        description: 'Mint a demo ticket output (1 sat)',
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
        icon: 'ticket',
      },
      {
        id: 'list-event-tickets',
        method: 'listOutputs',
        label: 'List Event Tickets',
        description: 'View outputs in the event tickets basket',
        params: { basket: 'event tickets' },
        icon: 'list',
      },
      {
        id: 'list-actions',
        method: 'listActions',
        label: 'List Recent Actions',
        description: 'Last 10 demo-labelled actions with outputs',
        params: { labels: ['demo'], limit: 10, includeOutputs: true },
        icon: 'history',
      },
    ],
  },
]

function ActionIcon({ type }: Readonly<{ type: ActionDef['icon'] }>) {
  const cls = 'w-4 h-4'
  switch (type) {
    case 'key':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499a3 3 0 013.75-.805z" />
        </svg>
      )
    case 'coins':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.172-.879-1.172-2.303 0-3.182C10.536 7.76 11.304 7.54 12 7.54c.696 0 1.464.22 2.003.659" />
        </svg>
      )
    case 'ticket':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a3 3 0 000 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 000-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
        </svg>
      )
    case 'list':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm0 5.25h.007v.008H3.75v-.008zm0 5.25h.007v.008H3.75v-.008z" />
        </svg>
      )
    case 'history':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
  }
}

export function WalletActions({ connected, onRequest, signingHint }: Readonly<Props>) {
  const hint = signingHint ?? (connected ? 'Requests are signed on your phone' : 'Pair first to unlock actions')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Wallet Actions</h2>
          <p className="text-xs text-ink-tertiary mt-0.5">{hint}</p>
        </div>
        {!connected && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-ink-muted px-2 py-1 rounded bg-surface-inset">
            Locked
          </span>
        )}
      </div>

      <div className={`flex flex-col gap-6 ${!connected ? 'opacity-50 pointer-events-none' : ''}`}>
        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted mb-2.5">
              {group.title}
            </p>
            <div className="flex flex-col gap-2">
              {group.actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  disabled={!connected}
                  onClick={() => onRequest(action.method, action.params)}
                  className="group flex items-center gap-3.5 w-full p-3.5 rounded-xl border border-border bg-surface-raised
                             text-left hover:border-border-emphasis hover:bg-brand-muted/20
                             disabled:cursor-not-allowed transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-surface-inset flex items-center justify-center shrink-0
                                  text-ink-tertiary group-hover:text-brand group-hover:bg-brand-muted transition-colors">
                    <ActionIcon type={action.icon} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{action.label}</p>
                    <p className="text-xs text-ink-tertiary mt-0.5 truncate">{action.description}</p>
                  </div>
                  <svg
                    className="w-4 h-4 text-ink-muted shrink-0 opacity-0 group-hover:opacity-100 group-hover:text-brand transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}