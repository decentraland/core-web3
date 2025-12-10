// Network state types

export interface NetworkState {
  chainId: number | null
  isSupportedNetwork: boolean
  isNetworkSwitching: boolean
  error: string | null
}
