import { useContext } from 'react'
import { WalletStateContext } from './WalletStateProvider'
import type { WalletState } from './WalletStateProvider'

/**
 * Lightweight hook that reads wallet state from {@link WalletStateProvider}.
 *
 * Use this instead of `useWallet()` in components that only need to read
 * wallet state (address, isConnected, disconnect). This avoids importing
 * wagmi and keeps it out of the initial bundle.
 *
 * @example
 * ```tsx
 * function Navbar() {
 *   const { address, isConnected, disconnect } = useWalletState()
 *   // ...
 * }
 * ```
 */
function useWalletState(): WalletState {
  return useContext(WalletStateContext)
}

export { useWalletState }
