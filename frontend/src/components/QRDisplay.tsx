import { QRDisplay as QRDisplayBase } from '@bsv/wallet-relay/react'
import type { SessionInfo } from '@bsv/wallet-relay/client'
import { ScanFrame } from './ui/ScanFrame'
import { StatusBadge } from './ui/StatusBadge'

interface Props {
  session: SessionInfo | null
  onRefresh: () => void
  onDisconnect?: () => void
}

function SessionIdChip({ sessionId }: Readonly<{ sessionId: string }>) {
  const short = `${sessionId.slice(0, 8)}…${sessionId.slice(-6)}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sessionId)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      title={sessionId}
      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-inset border border-border-soft
                 text-xs font-mono text-ink-tertiary hover:text-ink-secondary hover:border-border transition-colors"
    >
      <span>{short}</span>
      <svg
        className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    </button>
  )
}

export function QRDisplay({ session, onRefresh, onDisconnect }: Readonly<Props>) {
  const status = session?.status ?? 'pending'

  if (status === 'connected') {
    return (
      <div className="flex flex-col items-center gap-6 animate-fade-up">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-success-muted flex items-center justify-center ring-1 ring-success/20">
            <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
              />
            </svg>
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center ring-2 ring-canvas">
            <svg className="w-3.5 h-3.5 text-canvas" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        </div>

        <div className="text-center space-y-2">
          <StatusBadge status="connected" />
          <p className="text-sm text-ink-secondary max-w-xs text-balance">
            Your mobile wallet is paired and ready to sign requests from this session.
          </p>
        </div>

        {session && <SessionIdChip sessionId={session.sessionId} />}

        {onDisconnect && (
          <button
            type="button"
            onClick={onDisconnect}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-ink-secondary
                       hover:text-ink hover:bg-surface-raised transition-colors"
          >
            Disconnect &amp; new QR
          </button>
        )}
      </div>
    )
  }

  const isPending = status === 'pending'
  const needsRefresh = status === 'expired' || status === 'disconnected'

  return (
    <div className="flex flex-col items-center gap-5 animate-fade-up">
      <ScanFrame active={isPending}>
        <QRDisplayBase
          session={session}
          onRefresh={onRefresh}
          className="flex flex-col items-center gap-4 [&_[data-qr-status]]:hidden [&_button]:hidden"
          loadingProps={{
            className: 'w-56 h-56 sm:w-64 sm:h-64 bg-surface-inset rounded-lg animate-pulse',
          }}
          qrProps={{
            className: 'block',
            imageProps: {
              className: 'w-56 h-56 sm:w-64 sm:h-64 block',
              alt: 'Scan to connect mobile wallet',
            },
          }}
        />
      </ScanFrame>

      <div className="text-center space-y-2">
        <StatusBadge status={status} />
        <p className="text-sm text-ink-secondary max-w-xs text-balance">
          {isPending && 'Open your BSV wallet app and scan this code to establish an encrypted session.'}
          {status === 'expired' && 'This pairing code has expired. Generate a fresh one to continue.'}
          {status === 'disconnected' && 'The mobile wallet disconnected. Scan a new code to reconnect.'}
        </p>
      </div>

      {session && <SessionIdChip sessionId={session.sessionId} />}

      {needsRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand text-canvas text-sm font-semibold
                     hover:bg-brand-hover transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Generate new code
        </button>
      )}
    </div>
  )
}