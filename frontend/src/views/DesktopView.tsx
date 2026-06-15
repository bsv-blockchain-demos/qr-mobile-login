import { useCallback, useEffect, useRef, useState } from 'react'
import { WalletClient } from '@bsv/sdk'
import { WalletConnectionModal } from '../components/WalletConnectionModal'
import { QRDisplay }             from '../components/QRDisplay'
import { WalletActions }         from '../components/WalletActions'
import { RequestLog }            from '../components/RequestLog'
import { useWalletSession }      from '../hooks/useWalletSession'

type WalletMode = 'detecting' | 'local' | 'mobile'

function MobileQRContent() {
  const { session, log, error, createSession, cancelSession, sendRequest } = useWalletSession({ autoCreate: false })

  const handleDisconnect = useCallback(() => {
    cancelSession()
    void createSession()
  }, [cancelSession, createSession])

  // StrictMode in dev mounts effects twice. A naive { createSession; cleanup→cancelSession }
  // would create session A, DELETE it, then create session B — and the mobile would
  // pair against an already-expired QR. Guard with a ref so we only ever create once
  // per component instance, and skip cancelSession in cleanup so the backend's own
  // GC reclaims the session if the user leaves.
  const startedRef = useRef(false)
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void createSession()
  }, [createSession])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">BSV Mobile Wallet</h1>
        <p className="text-gray-500 mb-8 text-sm">
          {session?.status === 'connected'
            ? 'Mobile wallet is connected — use the actions on the right'
            : 'Scan the QR code with your mobile wallet to connect'}
        </p>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center gap-6">
            <QRDisplay
              session={session}
              onRefresh={createSession}
              onDisconnect={handleDisconnect}
            />
            {session && (
              <p className="text-xs text-gray-400 text-center break-all">
                Session: {session.sessionId}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <WalletActions session={session} onRequest={sendRequest} />
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Request Log
              </h2>
              <RequestLog entries={log} />
            </div>
          </div>
        </div>
      </div>
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

      {mode === 'local' && (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Wallet connected</h2>
            <p className="text-sm text-gray-500">
              Local BSV wallet is ready.
            </p>
          </div>
        </div>
      )}

      {mode === 'mobile' && <MobileQRContent />}
    </>
  )
}
