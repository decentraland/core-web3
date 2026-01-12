import type { NetworkState } from './types'

/**
 * Root state type for network selectors.
 * Consumer apps should extend this with their full store type.
 */
type RootState = { network: NetworkState }

const getNetworkState = (state: RootState): NetworkState => state.network

const getChainId = (state: RootState): number | null => getNetworkState(state).chainId

const getIsSupportedNetwork = (state: RootState): boolean => getNetworkState(state).isSupportedNetwork

const getIsNetworkSwitching = (state: RootState): boolean => getNetworkState(state).isNetworkSwitching

const getNetworkError = (state: RootState): string | null => getNetworkState(state).error

export { getChainId, getIsNetworkSwitching, getIsSupportedNetwork, getNetworkError, getNetworkState }
