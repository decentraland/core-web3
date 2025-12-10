// Wallet state types

export interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  isDisconnecting: boolean
  error: string | null
}
