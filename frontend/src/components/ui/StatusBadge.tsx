import type { SessionStatus } from '@bsv/wallet-relay/client'

const config: Record<
  SessionStatus | 'detecting',
  { label: string; dot: string; bg: string; text: string }
> = {
  detecting: {
    label: 'Detecting wallet',
    dot: 'bg-ink-tertiary',
    bg: 'bg-surface-raised',
    text: 'text-ink-secondary',
  },
  pending: {
    label: 'Awaiting scan',
    dot: 'bg-warning animate-pulse',
    bg: 'bg-warning-muted',
    text: 'text-warning',
  },
  connected: {
    label: 'Connected',
    dot: 'bg-success',
    bg: 'bg-success-muted',
    text: 'text-success',
  },
  disconnected: {
    label: 'Disconnected',
    dot: 'bg-ink-tertiary',
    bg: 'bg-surface-raised',
    text: 'text-ink-secondary',
  },
  expired: {
    label: 'Session expired',
    dot: 'bg-error',
    bg: 'bg-error-muted',
    text: 'text-error',
  },
}

interface Props {
  status: SessionStatus | 'detecting'
  className?: string
}

export function StatusBadge({ status, className = '' }: Readonly<Props>) {
  const { label, dot, bg, text } = config[status]

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${bg} ${text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  )
}