type Step = 'choose' | 'pair' | 'authorize'

const steps: { id: Step; label: string; description: string }[] = [
  { id: 'choose', label: 'Choose', description: 'Connection method' },
  { id: 'pair', label: 'Pair', description: 'Scan QR code' },
  { id: 'authorize', label: 'Authorize', description: 'Sign requests' },
]

function stepIndex(step: Step): number {
  return steps.findIndex((s) => s.id === step)
}

interface Props {
  current: Step
}

export function StepProgress({ current }: Readonly<Props>) {
  const activeIdx = stepIndex(current)

  return (
    <nav aria-label="Connection progress" className="flex items-center gap-2 sm:gap-4">
      {steps.map((step, idx) => {
        const isComplete = idx < activeIdx
        const isActive = idx === activeIdx

        return (
          <div key={step.id} className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors',
                  isComplete && 'bg-success-muted text-success',
                  isActive && 'bg-brand-muted text-brand ring-1 ring-border-emphasis',
                  !isComplete && !isActive && 'bg-surface-raised text-ink-muted',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={isActive ? 'step' : undefined}
              >
                {isComplete ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <div className="hidden sm:block min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    isActive ? 'text-ink' : isComplete ? 'text-ink-secondary' : 'text-ink-muted'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-ink-tertiary truncate">{step.description}</p>
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={`w-6 sm:w-10 h-px shrink-0 ${isComplete ? 'bg-success/40' : 'bg-border'}`}
                aria-hidden
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}