import type { NetworkState } from './types'

/**
 * Root state type for network selectors.
 * Consumer apps should extend this with their full store type.
 */
type RootState = { network: NetworkState }

const getNetworkState = (state: RootState): NetworkState => state.network

const getChainId = (state: RootState): number | null => state.network.chainId

const getIsSupportedNetwork = (state: RootState): boolean => state.network.isSupportedNetwork

const getIsNetworkSwitching = (state: RootState): boolean => state.network.isNetworkSwitching

const getNetworkError = (state: RootState): string | null => state.network.error

export { getChainId, getIsNetworkSwitching, getIsSupportedNetwork, getNetworkError, getNetworkState }
