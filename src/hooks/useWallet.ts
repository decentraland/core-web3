import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useConnect, useDisconnect } from 'wagmi'
import { clearConnectionStorage } from '../config/wagmi'
import { getAddress, getIsConnected, getIsConnecting, getIsDisconnecting, getWalletError } from '../store/wallet/selectors'

/**
 * Hook that provides wallet state and actions.
 *
 * Combines Redux wallet state with wagmi connection actions.
 *
 * @example
 * ```tsx
 * function WalletButton() {
 *   const { address, isConnected, connect, disconnect, connectors } = useWallet()
 *
 *   if (isConnected) {
 *     return (
 *       <button onClick={disconnect}>
 *         Disconnect {address?.slice(0, 6)}...
 *       </button>
 *     )
 *   }
 *
 *   return (
 *     <div>
 *       {connectors.map((connector) => (
 *         <button key={connector.uid} onClick={() => connect(connector)}>
 *           Connect with {connector.name}
 *         </button>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
function useWallet() {
  const address = useSelector(getAddress)
  const isConnected = useSelector(getIsConnected)
  const isConnecting = useSelector(getIsConnecting)
  const isDisconnecting = useSelector(getIsDisconnecting)
  const error = useSelector(getWalletError)

  const { connect: wagmiConnect, connectors, isPending: isConnectPending } = useConnect()
  const { disconnect: wagmiDisconnect, isPending: isDisconnectPending } = useDisconnect()

  const connect = useCallback(
    (connector: (typeof connectors)[number]) => {
      wagmiConnect({ connector })
    },
    [wagmiConnect]
  )

  const disconnect = useCallback(() => {
    wagmiDisconnect()
    clearConnectionStorage()
  }, [wagmiDisconnect])

  return {
    /** Current wallet address or null if not connected */
    address,
    /** Whether a wallet is currently connected */
    isConnected,
    /** Whether a connection attempt is in progress */
    isConnecting: isConnecting || isConnectPending,
    /** Whether a disconnection is in progress */
    isDisconnecting: isDisconnecting || isDisconnectPending,
    /** Error message from last failed operation */
    error,
    /** Available wallet connectors */
    connectors,
    /** Connect to a wallet using a specific connector */
    connect,
    /** Disconnect the current wallet */
    disconnect
  }
}

export { useWallet }
