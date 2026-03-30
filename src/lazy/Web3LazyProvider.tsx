import { useEffect, useState } from 'react'
import type { ComponentType, PropsWithChildren } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import type { Web3CoreConfig } from '../config/wagmi'

/**
 * Props for the Web3LazyProvider component.
 */
interface Web3LazyProviderProps {
  /**
   * wagmi config instance created by {@link createWeb3CoreConfig}.
   */
  config: Web3CoreConfig

  /**
   * Optional React Query client instance.
   */
  queryClient?: QueryClient

  /**
   * Callback invoked once the Web3 bundle has loaded and providers are ready.
   * Use this to inject web3 reducers into the Redux store via
   * {@link createLazyStoreEnhancer}.
   */
  onLoad?: () => void
}

type Web3InnerProps = PropsWithChildren<{
  config: Web3CoreConfig
  queryClient?: QueryClient
  onLoad?: () => void
}>

/**
 * Provider that lazy-loads the heavy Web3 stack (wagmi, viem, react-query)
 * so it doesn't block the initial page render.
 *
 * While the Web3 bundle loads, children render normally using the lightweight
 * {@link WalletStateProvider} context (which reads wagmi's localStorage for
 * the initial signed-in state).
 *
 * Once loaded, the real wagmi providers wrap the children tree without
 * unmounting it, and {@link Web3Sync} pushes live wallet state into the
 * lightweight context so all consumers stay in sync.
 *
 * Must be used inside both a Redux `Provider` and a {@link WalletStateProvider}.
 *
 * @example
 * ```tsx
 * import { Provider } from 'react-redux'
 * import { WalletStateProvider, Web3LazyProvider, createLazyStoreEnhancer } from '@dcl/core-web3/lazy'
 * import { createWeb3CoreConfig } from '@dcl/core-web3'
 * import { store, staticReducers } from './store'
 *
 * const config = createWeb3CoreConfig({ walletConnectProjectId: '...' })
 * const injectWeb3Reducers = createLazyStoreEnhancer(store, staticReducers)
 *
 * createRoot(document.getElementById('root')!).render(
 *   <Provider store={store}>
 *     <WalletStateProvider>
 *       <Web3LazyProvider config={config} onLoad={injectWeb3Reducers}>
 *         <App />
 *       </Web3LazyProvider>
 *     </WalletStateProvider>
 *   </Provider>
 * )
 * ```
 */
function Web3LazyProvider({
  config,
  queryClient,
  onLoad,
  children,
}: PropsWithChildren<Web3LazyProviderProps>) {
  const [Inner, setInner] = useState<ComponentType<Web3InnerProps> | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    import('./Web3Inner')
      .then((m) => setInner(() => m.Web3Inner))
      .catch(setError)
  }, [])

  if (error) throw error

  if (!Inner) return <>{children}</>

  return (
    <Inner config={config} queryClient={queryClient} onLoad={onLoad}>
      {children}
    </Inner>
  )
}

export { Web3LazyProvider }
export type { Web3LazyProviderProps }
