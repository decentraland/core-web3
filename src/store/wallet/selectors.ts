import type { WalletState } from './types'

/**
 * Root state type for wallet selectors.
 * Consumer apps should extend this with their full store type.
 */
type RootState = { wallet: WalletState }

const getWalletState = (state: RootState): WalletState => state.wallet

const getAddress = (state: RootState): string | null => state.wallet.address

const getIsConnected = (state: RootState): boolean => state.wallet.isConnected

const getIsConnecting = (state: RootState): boolean => state.wallet.isConnecting

const getIsDisconnecting = (state: RootState): boolean => state.wallet.isDisconnecting

const getWalletError = (state: RootState): string | null => state.wallet.error

export { getAddress, getIsConnected, getIsConnecting, getIsDisconnecting, getWalletError, getWalletState }
