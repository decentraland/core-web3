import { useEffect } from 'react'
import type { PropsWithChildren } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import type { Web3CoreConfig } from '../config/wagmi'
import { Web3CoreProvider } from '../providers/Web3CoreProvider'
import { Web3SyncProvider } from '../providers/Web3SyncProvider'
import { Web3Sync } from './Web3Sync'

/**
 * Props for the Web3Inner component.
 */
interface Web3InnerProps {
  config: Web3CoreConfig
  queryClient?: QueryClient
  onLoad?: () => void
}

/**
 * Internal component that wires up the real Web3 providers and syncs their
 * state into the lightweight WalletStateContext. This module is the lazy
 * boundary: it imports wagmi, viem, and react-query, so it only loads when
 * the dynamic `import()` in {@link Web3LazyProvider} resolves.
 *
 * @internal
 */
function Web3Inner({ config, queryClient, onLoad, children }: PropsWithChildren<Web3InnerProps>) {
  useEffect(() => {
    onLoad?.()
  }, [onLoad])

  return (
    <Web3CoreProvider config={config} queryClient={queryClient}>
      <Web3SyncProvider>
        <Web3Sync>{children}</Web3Sync>
      </Web3SyncProvider>
    </Web3CoreProvider>
  )
}

export { Web3Inner }
