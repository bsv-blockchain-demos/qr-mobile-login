import { QRDisplay as QRDisplayBase } from '@bsv/wallet-relay/react'
import type { SessionInfo } from '@bsv/wallet-relay/client'

const statusColor: Record<string, string> = {
  pending:      'bg-yellow-100 text-yellow-800',
  connected:    'bg-green-100 text-green-800',
  disconnected: 'bg-gray-100 text-gray-600',
  expired:      'bg-red-100 text-red-700',
}

interface Props {
  session: SessionInfo | null
  onRefresh: () => void
  onDisconnect?: () => void
}

export function QRDisplay({ session, onRefresh, onDisconnect }: Readonly<Props>) {
  const status = session?.status ?? 'pending'

  if (status === 'connected') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor.connected}`}
        >
          Mobile connected
        </span>
        {onDisconnect && (
          <button
            type="button"
            onClick={onDisconnect}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700
                       hover:bg-gray-50 transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>
    )
  }

  return (
    <QRDisplayBase
      session={session}
      onRefresh={onRefresh}
      className="flex flex-col items-center gap-4"
      loadingProps={{ className: 'w-64 h-64 bg-gray-100 rounded-xl animate-pulse' }}
      qrProps={{
        className: 'w-64 h-64 rounded-xl overflow-hidden border border-gray-200 shadow-sm',
        imageProps: { className: 'w-full h-full', alt: 'Scan to connect mobile wallet' },
      }}
      statusProps={{
        className: `px-3 py-1 rounded-full text-xs font-medium ${statusColor[status] ?? 'bg-gray-100 text-gray-600'}`,
      }}
      refreshButtonProps={{ className: 'text-sm text-blue-600 hover:underline' }}
    />
  )
}
