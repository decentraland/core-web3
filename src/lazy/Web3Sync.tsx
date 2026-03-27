import { type PropsWithChildren, useContext, useLayoutEffect } from 'react'
import { useWallet } from '../hooks/useWallet'
import { WalletStateSetterContext } from './WalletStateProvider'

/**
 * Internal component that bridges the real wagmi wallet state into the
 * lightweight {@link WalletStateContext}. This runs inside the real
 * Web3CoreProvider + Web3SyncProvider tree, so `useWallet()` is available.
 *
 * @internal
 */
function Web3Sync({ children }: PropsWithChildren) {
  const wallet = useWallet()
  const setWalletState = useContext(WalletStateSetterContext)

  useLayoutEffect(() => {
    setWalletState({
      address: wallet.address,
      isConnected: wallet.isConnected,
      isConnecting: wallet.isConnecting,
      isDisconnecting: wallet.isDisconnecting,
      disconnect: wallet.disconnect,
    })
  }, [
    wallet.address,
    wallet.isConnected,
    wallet.isConnecting,
    wallet.isDisconnecting,
    wallet.disconnect,
    setWalletState,
  ])

  return <>{children}</>
}

export { Web3Sync }
