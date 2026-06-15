import { RequestLog as RequestLogBase } from '@bsv/wallet-relay/react'
import type { RequestLogEntry } from '../types/wallet'

interface Props {
  entries: RequestLogEntry[]
}

export function RequestLog({ entries }: Readonly<Props>) {
  const hasEntries = entries.length > 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">Activity Log</h2>
          <p className="text-xs text-ink-tertiary mt-0.5">
            {hasEntries ? `${entries.length} request${entries.length === 1 ? '' : 's'}` : 'No requests yet'}
          </p>
        </div>
      </div>

      <RequestLogBase
        entries={entries}
        className="flex flex-col gap-2 overflow-y-auto max-h-80 pr-1
                   [&::-webkit-scrollbar]:w-1.5
                   [&::-webkit-scrollbar-thumb]:rounded-full
                   [&::-webkit-scrollbar-thumb]:bg-border"
        emptyProps={{
          className: 'flex flex-col items-center justify-center py-10 px-4 rounded-xl border border-dashed border-border-soft text-center',
        }}
        entryProps={{
          className: [
            'relative rounded-xl border p-3.5 text-xs font-mono pl-8',
            'data-[state=pending]:border-warning/25 data-[state=pending]:bg-warning-muted',
            'data-[state=error]:border-error/25 data-[state=error]:bg-error-muted',
            'data-[state=ok]:border-success/25 data-[state=ok]:bg-success-muted',
            '[&_[data-log-method]]:font-sans [&_[data-log-method]]:font-semibold [&_[data-log-method]]:text-sm [&_[data-log-method]]:text-ink',
            '[&_[data-log-status]]:font-sans [&_[data-log-status]]:text-[10px] [&_[data-log-status]]:uppercase [&_[data-log-status]]:tracking-wider',
            '[&_[data-log-status]]:float-right [&_[data-log-status]]:font-medium',
            'data-[state=pending]:[&_[data-log-status]]:text-warning',
            'data-[state=error]:[&_[data-log-status]]:text-error',
            'data-[state=ok]:[&_[data-log-status]]:text-success',
            '[&_[data-log-result]]:block [&_[data-log-result]]:mt-2 [&_[data-log-result]]:pt-2',
            '[&_[data-log-result]]:border-t [&_[data-log-result]]:border-border-soft',
            '[&_[data-log-result]]:text-ink-secondary',
            '[&_[data-log-result]]:whitespace-pre-wrap [&_[data-log-result]]:break-all',
            '[&_[data-log-result]]:leading-relaxed',
            'before:content-[""] before:absolute before:left-3 before:top-4 before:w-2 before:h-2 before:rounded-full',
            'data-[state=pending]:before:bg-warning data-[state=pending]:before:animate-pulse',
            'data-[state=error]:before:bg-error',
            'data-[state=ok]:before:bg-success',
          ].join(' '),
        }}
      >
        <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
        </div>
        <p className="text-sm text-ink-secondary font-medium">Waiting for requests</p>
        <p className="text-xs text-ink-tertiary mt-1 max-w-[200px]">
          Wallet responses will appear here in real time
        </p>
      </RequestLogBase>
    </div>
  )
}