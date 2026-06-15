import { useCallback, useEffect, useRef, useState } from 'react'
import { WalletClient } from '@bsv/sdk'
import { WalletConnectionModal } from '../components/WalletConnectionModal'
import { QRDisplay }             from '../components/QRDisplay'
import { WalletActions }         from '../components/WalletActions'
import { RequestLog }            from '../components/RequestLog'
import { useWalletSession }      from '../hooks/useWalletSession'
import { StatusBadge }           from '../components/ui/StatusBadge'
import { StepProgress }          from '../components/ui/StepProgress'

type WalletMode = 'detecting' | 'local' | 'mobile'

function AppHeader({ mode, sessionStatus }: Readonly<{ mode: WalletMode; sessionStatus?: string }>) {
  const badgeStatus =
    mode === 'detecting'
      ? 'detecting' as const
      : mode === 'local'
        ? 'connected' as const
        : (sessionStatus ?? 'pending') as 'pending' | 'connected' | 'disconnected' | 'expired'

  return (
    <header className="border-b border-border-soft bg-surface/60 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-brand-muted flex items-center justify-center ring-1 ring-border-emphasis shrink-0">
            <svg className="w-[18px] h-[18px] text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-ink truncate">BSV Remote Signer</h1>
            <p className="text-xs text-ink-tertiary hidden sm:block">Encrypted mobile wallet pairing</p>
          </div>
        </div>
        <StatusBadge status={badgeStatus} />
      </div>
    </header>
  )
}

function MobileQRContent() {
  const { session, log, error, createSession, cancelSession, sendRequest } = useWalletSession({ autoCreate: false })

  const handleDisconnect = useCallback(() => {
    cancelSession()
    void createSession()
  }, [cancelSession, createSession])

  const startedRef = useRef(false)
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void createSession()
  }, [createSession])

  const connected = session?.status === 'connected'
  const currentStep = connected ? 'authorize' as const : 'pair' as const

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <AppHeader mode="mobile" sessionStatus={session?.status} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8 sm:mb-10 animate-fade-up">
          <StepProgress current={currentStep} />
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 px-4 py-3.5 rounded-xl bg-error-muted border border-error/25 text-sm animate-fade-up"
          >
            <svg className="w-5 h-5 text-error shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="font-medium text-error">Connection error</p>
              <p className="text-ink-secondary mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 lg:gap-8">
          <section
            className="rounded-2xl border border-border bg-surface p-6 sm:p-8 flex flex-col items-center justify-center
                       min-h-[420px] animate-fade-up-delay-1"
          >
            <div className="w-full max-w-sm">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-ink">
                  {connected ? 'Session active' : 'Scan to pair'}
                </h2>
                <p className="text-sm text-ink-secondary mt-1 text-balance">
                  {connected
                    ? 'Your phone is acting as the signing device for this browser session.'
                    : 'Point your BSV wallet camera at the code below.'}
                </p>
              </div>
              <QRDisplay
                session={session}
                onRefresh={createSession}
                onDisconnect={handleDisconnect}
              />
            </div>
          </section>

          <div className="flex flex-col gap-6 animate-fade-up-delay-2">
            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <WalletActions session={session} onRequest={sendRequest} />
            </section>

            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <RequestLog entries={log} />
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

function LocalWalletView() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <AppHeader mode="local" />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm animate-fade-up">
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 rounded-2xl bg-success-muted flex items-center justify-center ring-1 ring-success/20">
              <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
              </svg>
            </div>
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center ring-2 ring-canvas">
              <svg className="w-3.5 h-3.5 text-canvas" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
          <h2 className="text-xl font-semibold text-ink mb-2">Local wallet connected</h2>
          <p className="text-sm text-ink-secondary leading-relaxed">
            A BSV wallet extension was detected on this browser. You&apos;re ready to sign without mobile pairing.
          </p>
        </div>
      </main>
    </div>
  )
}

export function DesktopView() {
  const [mode, setMode] = useState<WalletMode>('detecting')

  const handleLocalWallet = useCallback((wallet: WalletClient) => {
    setMode('local')
    console.log('[DesktopView] local wallet connected', wallet)
  }, [])

  const handleMobileQR = useCallback(() => {
    setMode('mobile')
  }, [])

  return (
    <>
      {mode === 'detecting' && (
        <WalletConnectionModal
          onLocalWallet={handleLocalWallet}
          onMobileQR={handleMobileQR}
        />
      )}

      {mode === 'local' && <LocalWalletView />}
      {mode === 'mobile' && <MobileQRContent />}
    </>
  )
}