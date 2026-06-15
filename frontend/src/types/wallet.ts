export type { WalletRequest, WalletResponse, RequestLogEntry, WalletMethodName } from '@bsv/wallet-relay/client'

export type WalletMethod =
  | 'getPublicKey'
  | 'listOutputs'
  | 'createAction'
  | 'listActions'
