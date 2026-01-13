import { useSelector } from 'react-redux'
import type { Address } from 'viem'
import { useBalance } from 'wagmi'
import { getAddress } from '../store/wallet/selectors'

/**
 * Options for the useTokenBalance hook.
 */
interface UseTokenBalanceOptions {
  /**
   * ERC20 token contract address.
   * If not provided, returns the native token balance (ETH, MATIC, etc.)
   */
  tokenAddress?: Address

  /**
   * Override the wallet address to check balance for.
   * If not provided, uses the connected wallet address from Redux.
   */
  address?: Address

  /**
   * Chain ID to query balance on.
   * If not provided, uses the current connected chain.
   */
  chainId?: number
}

/**
 * Hook that provides token balance for the connected wallet.
 *
 * Uses wagmi's useBalance internally and combines with the wallet
 * address from Redux store.
 *
 * @example
 * ```tsx
 * // Native token balance (ETH, MATIC, etc.)
 * function NativeBalance() {
 *   const { balance, symbol, isLoading } = useTokenBalance()
 *
 *   if (isLoading) return <span>Loading...</span>
 *   if (!balance) return <span>Not connected</span>
 *
 *   return <span>{balance} {symbol}</span>
 * }
 *
 * // ERC20 token balance
 * function TokenBalance() {
 *   const { balance, symbol } = useTokenBalance({
 *     tokenAddress: '0x...' // MANA or other ERC20
 *   })
 *
 *   return <span>{balance} {symbol}</span>
 * }
 * ```
 */
function useTokenBalance(options: UseTokenBalanceOptions = {}) {
  const { tokenAddress, address: overrideAddress, chainId } = options

  const walletAddress = useSelector(getAddress)
  const address = overrideAddress ?? (walletAddress as Address | undefined)

  const { data, isLoading, isError, error, refetch } = useBalance({
    address,
    token: tokenAddress,
    chainId,
    query: {
      enabled: !!address
    }
  })

  return {
    /** Formatted balance as string (e.g., "1.5") */
    balance: data?.formatted ?? null,
    /** Raw balance value in wei */
    balanceRaw: data?.value ?? null,
    /** Number of decimals for the token */
    decimals: data?.decimals ?? null,
    /** Token symbol (e.g., "ETH", "MANA") */
    symbol: data?.symbol ?? null,
    /** Whether the balance is currently loading */
    isLoading,
    /** Whether there was an error fetching the balance */
    isError,
    /** Error object if fetch failed */
    error,
    /** Function to manually refetch the balance */
    refetch
  }
}

export { useTokenBalance }
export type { UseTokenBalanceOptions }
