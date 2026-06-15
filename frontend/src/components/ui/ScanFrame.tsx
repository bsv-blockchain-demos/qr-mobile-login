import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  active?: boolean
  className?: string
}

export function ScanFrame({ children, active = false, className = '' }: Readonly<Props>) {
  const corner =
    'absolute w-5 h-5 border-brand/70 pointer-events-none'

  return (
    <div className={`relative ${className}`}>
      {active && (
        <div
          className="absolute -inset-3 rounded-2xl border border-brand/20 animate-pulse-ring pointer-events-none"
          aria-hidden
        />
      )}

      <div className="relative rounded-xl overflow-hidden bg-white p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        <span className={`${corner} top-0 left-0 border-t-2 border-l-2 rounded-tl-sm`} />
        <span className={`${corner} top-0 right-0 border-t-2 border-r-2 rounded-tr-sm`} />
        <span className={`${corner} bottom-0 left-0 border-b-2 border-l-2 rounded-bl-sm`} />
        <span className={`${corner} bottom-0 right-0 border-b-2 border-r-2 rounded-br-sm`} />

        {active && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            <div className="absolute inset-x-4 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent animate-scan-line" />
          </div>
        )}

        {children}
      </div>
    </div>
  )
}