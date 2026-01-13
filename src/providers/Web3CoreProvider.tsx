import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import type { Web3CoreConfig } from '../config/wagmi'

/**
 * Props for the Web3CoreProvider component.
 */
interface Web3CoreProviderProps {
  /**
   * wagmi config instance created by {@link createWeb3CoreConfig}.
   */
  config: Web3CoreConfig

  /**
   * Optional React Query client instance.
   * If not provided, a default QueryClient will be created.
   */
  queryClient?: QueryClient

  /**
   * Child components to render within the provider.
   */
  children: ReactNode
}

/**
 * Default QueryClient configuration for Web3 dApps.
 * @internal
 */
function createDefaultQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minute
        retry: 1
      }
    }
  })
}

/**
 * Provider component that sets up wagmi and React Query contexts.
 *
 * This provider wraps your application with:
 * - `WagmiProvider` for Web3 wallet connectivity
 * - `QueryClientProvider` for async state management
 *
 * @example
 * ```tsx
 * import { createWeb3CoreConfig, Web3CoreProvider } from '@dcl/web3-core'
 *
 * const config = createWeb3CoreConfig({
 *   walletConnectProjectId: 'your-project-id',
 * })
 *
 * function App() {
 *   return (
 *     <Web3CoreProvider config={config}>
 *       <YourApp />
 *     </Web3CoreProvider>
 *   )
 * }
 * ```
 */
function Web3CoreProvider({ config, queryClient, children }: Web3CoreProviderProps) {
  const client = useMemo(() => queryClient ?? createDefaultQueryClient(), [queryClient])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export { Web3CoreProvider }
export type { Web3CoreProviderProps }
