import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import { useAccount, useChainId } from 'wagmi'
import { networkActions } from '../store/network'
import { walletActions } from '../store/wallet'

/**
 * Props for the Web3SyncProvider component.
 */
interface Web3SyncProviderProps {
  /**
   * Child components to render within the provider.
   */
  children: ReactNode
}

/**
 * Provider component that synchronizes wagmi state with Redux store.
 *
 * This provider listens to wagmi hooks and dispatches actions to keep
 * the Redux wallet and network slices in sync with the actual Web3 state.
 *
 * **Important**: This provider must be used inside both:
 * - `Web3CoreProvider` (for wagmi context)
 * - Redux `Provider` (for dispatch access)
 *
 * @example
 * ```tsx
 * import { Provider } from 'react-redux'
 * import { Web3CoreProvider, Web3SyncProvider } from '@dcl/web3-core'
 *
 * function App() {
 *   return (
 *     <Provider store={store}>
 *       <Web3CoreProvider config={config}>
 *         <Web3SyncProvider>
 *           <YourApp />
 *         </Web3SyncProvider>
 *       </Web3CoreProvider>
 *     </Provider>
 *   )
 * }
 * ```
 */
function Web3SyncProvider({ children }: Web3SyncProviderProps) {
  const dispatch = useDispatch()
  const { address, isConnecting, isConnected, isReconnecting } = useAccount()
  const chainId = useChainId()

  useEffect(() => {
    dispatch(walletActions.setAccount(address ?? null))
  }, [dispatch, address])

  useEffect(() => {
    dispatch(walletActions.setConnecting(isConnecting || isReconnecting))
  }, [dispatch, isConnecting, isReconnecting])

  useEffect(() => {
    if (!isConnected) {
      dispatch(walletActions.reset())
    }
  }, [dispatch, isConnected])

  useEffect(() => {
    dispatch(networkActions.setChain(isConnected ? chainId : null))
  }, [dispatch, chainId, isConnected])

  return <>{children}</>
}

export { Web3SyncProvider }
export type { Web3SyncProviderProps }
