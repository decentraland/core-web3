import type { WalletState } from './types'

/**
 * Root state type for wallet selectors.
 * Consumer apps should extend this with their full store type.
 */
type RootState = { wallet: WalletState }

const getWalletState = (state: RootState): WalletState => state.wallet

const getAddress = (state: RootState): string | null => getWalletState(state).address

const getIsConnected = (state: RootState): boolean => getWalletState(state).isConnected

const getIsConnecting = (state: RootState): boolean => getWalletState(state).isConnecting

const getIsDisconnecting = (state: RootState): boolean => getWalletState(state).isDisconnecting

const getWalletError = (state: RootState): string | null => getWalletState(state).error

export { getAddress, getIsConnected, getIsConnecting, getIsDisconnecting, getWalletError, getWalletState }
