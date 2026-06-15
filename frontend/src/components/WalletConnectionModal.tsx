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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect your wallet</h2>
        <p className="text-sm text-gray-500 mb-6">
          No local wallet detected. Install a BSV wallet or connect your
          mobile wallet by scanning a QR code.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={installUrl ?? 'https://desktop.bsvb.tech'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white text-sm font-medium text-center hover:bg-blue-700 transition-colors"
          >
            Install BSV Wallet
          </a>
          <button
            type="button"
            onClick={onMobileQR}
            className="w-full py-3 px-4 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Connect via Mobile QR
          </button>
        </div>
      </div>
    </WalletConnectionModalBase>
  )
}
