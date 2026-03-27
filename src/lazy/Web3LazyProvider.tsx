import { Suspense, lazy } from 'react'
import type { PropsWithChildren } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import type { Web3CoreConfig } from '../config/wagmi'

const Web3Inner = lazy(() => import('./Web3Inner').then(m => ({ default: m.Web3Inner })))

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
}

/**
 * Provider that lazy-loads the heavy Web3 stack (wagmi, viem, react-query)
 * so it doesn't block the initial page render.
 *
 * While the Web3 bundle loads, children render normally using the lightweight
 * {@link WalletStateProvider} context (which reads wagmi's localStorage for
 * the initial signed-in state).
 *
 * Once loaded, the real wagmi providers mount and {@link Web3Sync} pushes
 * live wallet state into the lightweight context, so all consumers stay in
 * sync without needing to import wagmi themselves.
 *
 * Must be used inside both a Redux `Provider` and a {@link WalletStateProvider}.
 *
 * @example
 * ```tsx
 * import { Provider } from 'react-redux'
 * import { WalletStateProvider, Web3LazyProvider } from '@dcl/core-web3/lazy'
 * import { createWeb3CoreConfig } from '@dcl/core-web3'
 *
 * const config = createWeb3CoreConfig({ walletConnectProjectId: '...' })
 *
 * createRoot(document.getElementById('root')!).render(
 *   <Provider store={store}>
 *     <WalletStateProvider>
 *       <Web3LazyProvider config={config}>
 *         <App />
 *       </Web3LazyProvider>
 *     </WalletStateProvider>
 *   </Provider>
 * )
 * ```
 */
function Web3LazyProvider({ config, queryClient, children }: PropsWithChildren<Web3LazyProviderProps>) {
  return (
    <Suspense fallback={children}>
      <Web3Inner config={config} queryClient={queryClient}>
        {children}
      </Web3Inner>
    </Suspense>
  )
}

export { Web3LazyProvider }
export type { Web3LazyProviderProps }
