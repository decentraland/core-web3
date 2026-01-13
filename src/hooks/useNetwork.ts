import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useSwitchChain } from 'wagmi'
import { getChainId, getIsNetworkSwitching, getIsSupportedNetwork, getNetworkError } from '../store/network/selectors'

/**
 * Hook that provides network state and actions.
 *
 * Combines Redux network state with wagmi chain switching.
 *
 * @example
 * ```tsx
 * function NetworkSelector() {
 *   const { chainId, isSupportedNetwork, switchNetwork, chains, isSwitching } = useNetwork()
 *
 *   if (!isSupportedNetwork) {
 *     return (
 *       <div>
 *         <p>Please switch to a supported network</p>
 *         {chains.map((chain) => (
 *           <button key={chain.id} onClick={() => switchNetwork(chain.id)}>
 *             Switch to {chain.name}
 *           </button>
 *         ))}
 *       </div>
 *     )
 *   }
 *
 *   return <p>Connected to chain {chainId}</p>
 * }
 * ```
 */
function useNetwork() {
  const chainId = useSelector(getChainId)
  const isSupportedNetwork = useSelector(getIsSupportedNetwork)
  const isNetworkSwitching = useSelector(getIsNetworkSwitching)
  const error = useSelector(getNetworkError)

  const { switchChain, chains, isPending: isSwitchPending } = useSwitchChain()

  const switchNetwork = useCallback(
    (targetChainId: number) => {
      switchChain({ chainId: targetChainId })
    },
    [switchChain]
  )

  return {
    /** Current chain ID or null if not connected */
    chainId,
    /** Whether the current chain is supported by Decentraland */
    isSupportedNetwork,
    /** Whether a network switch is in progress */
    isSwitching: isNetworkSwitching || isSwitchPending,
    /** Error message from last failed operation */
    error,
    /** Available chains to switch to */
    chains,
    /** Switch to a different network by chain ID */
    switchNetwork
  }
}

export { useNetwork }
