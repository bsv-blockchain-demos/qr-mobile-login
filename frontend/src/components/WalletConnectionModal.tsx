import { WalletConnectionModal as WalletConnectionModalBase } from '@bsv/wallet-relay/react'
import type { WalletClient } from '@bsv/sdk'

interface Props {
  onLocalWallet: (wallet: WalletClient) => void
  onMobileQR: () => void
  installUrl?: string
}

export function WalletConnectionModal({ onLocalWallet, onMobileQR, installUrl }: Readonly<Props>) {
  return (
    <WalletConnectionModalBase
      onLocalWallet={onLocalWallet}
      onMobileQR={onMobileQR}
      installUrl={installUrl}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6
                 bg-canvas/80 backdrop-blur-md"
    >
      <div className="w-full max-w-lg animate-fade-up">
        <div className="rounded-2xl border border-border bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.45)] overflow-hidden">
          <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-border-soft">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-muted flex items-center justify-center ring-1 ring-border-emphasis">
                <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-ink">Connect your wallet</h2>
                <p className="text-sm text-ink-tertiary">No local wallet detected on this device</p>
              </div>
            </div>
            <p className="text-sm text-ink-secondary leading-relaxed text-balance">
              Choose how you&apos;d like to sign. Install a desktop wallet for direct access, or pair your
              phone as a remote signer via encrypted QR.
            </p>
          </div>

          <div className="p-4 sm:p-6 flex flex-col gap-3">
            <a
              href={installUrl ?? 'https://desktop.bsvb.tech'}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 p-4 rounded-xl border border-border bg-surface-raised
                         hover:border-border-emphasis hover:bg-brand-muted/30 transition-colors"
            >
              <div className="w-11 h-11 rounded-lg bg-surface-inset flex items-center justify-center shrink-0
                              group-hover:bg-brand-muted transition-colors">
                <svg className="w-5 h-5 text-ink-secondary group-hover:text-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-ink">Install BSV Wallet</p>
                <p className="text-xs text-ink-tertiary mt-0.5 leading-relaxed">
                  Browser extension for direct signing on this machine
                </p>
              </div>
              <svg className="w-4 h-4 text-ink-muted shrink-0 mt-1 group-hover:text-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>

            <button
              type="button"
              onClick={onMobileQR}
              className="group flex items-start gap-4 p-4 rounded-xl border border-border-emphasis bg-brand-muted/40
                         hover:bg-brand-muted/70 transition-colors text-left w-full"
            >
              <div className="w-11 h-11 rounded-lg bg-brand/15 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM6.75 6.75h.008v.008H6.75V6.75zm0 10.5h.008v.008H6.75v-.008zm10.5-10.5h.008v.008h-.008V6.75zm0 10.5h.008v.008h-.008v-.008zM13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">Connect via Mobile QR</p>
                <p className="text-xs text-ink-tertiary mt-0.5 leading-relaxed">
                  Scan a code with your phone — keys never leave your device
                </p>
              </div>
              <svg className="w-4 h-4 text-brand shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          <div className="px-6 sm:px-8 py-4 border-t border-border-soft flex items-center gap-2 text-xs text-ink-muted">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            End-to-end encrypted relay — backend never sees plaintext
          </div>
        </div>
      </div>
    </WalletConnectionModalBase>
  )
}