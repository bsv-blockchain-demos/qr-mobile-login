import { useCallback, useState } from 'react'
import type { WalletClient } from '@bsv/sdk'
import type { RequestLogEntry, WalletMethod, WalletResponse } from '../types/wallet'

export function useLocalWallet(wallet: WalletClient) {
  const [log, setLog] = useState<RequestLogEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  const sendRequest = useCallback(
    async (method: WalletMethod, params?: unknown): Promise<WalletResponse> => {
      setError(null)
      const requestId = crypto.randomUUID()
      const request = { requestId, method, params: params ?? {}, timestamp: Date.now() }
      setLog((prev) => [{ request, pending: true }, ...prev])

      const resolve = (response: WalletResponse) => {
        setLog((prev) =>
          prev.map((entry) =>
            entry.request.requestId === requestId
              ? { request, response, pending: false }
              : entry,
          ),
        )
        return response
      }

      try {
        const result = await invokeWalletMethod(wallet, method, params)
        return resolve({ requestId, result, timestamp: Date.now() })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Request failed'
        setError(message)
        return resolve({
          requestId,
          error: { code: 500, message },
          timestamp: Date.now(),
        })
      }
    },
    [wallet],
  )

  return { log, error, sendRequest }
}

async function invokeWalletMethod(
  wallet: WalletClient,
  method: WalletMethod,
  params?: unknown,
): Promise<unknown> {
  switch (method) {
    case 'getPublicKey':
      return wallet.getPublicKey((params ?? {}) as Parameters<WalletClient['getPublicKey']>[0])
    case 'listOutputs':
      return wallet.listOutputs((params ?? {}) as Parameters<WalletClient['listOutputs']>[0])
    case 'createAction':
      return wallet.createAction((params ?? {}) as Parameters<WalletClient['createAction']>[0])
    case 'listActions':
      return wallet.listActions((params ?? {}) as Parameters<WalletClient['listActions']>[0])
    default:
      throw new Error(`Unsupported method: ${method}`)
  }
}