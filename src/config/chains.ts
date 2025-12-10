import { ChainId } from '@dcl/schemas'
import type { Chain } from 'viem'
import { mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains'

/**
 * Production blockchain networks supported by Decentraland.
 * Includes Ethereum Mainnet and Polygon Mainnet.
 * @readonly
 */
const productionChains = [mainnet, polygon] as const

/**
 * Test/development blockchain networks supported by Decentraland.
 * Includes Ethereum Sepolia and Polygon Amoy testnets.
 * @readonly
 */
const testChains = [sepolia, polygonAmoy] as const

/**
 * All supported blockchain networks (production + test).
 * @readonly
 */
const supportedChains = [...productionChains, ...testChains] as const

/**
 * Union type of all supported chain IDs.
 * Useful for type-safe chain ID validation.
 */
type SupportedChainId = (typeof supportedChains)[number]['id']

/**
 * Type guard to check if a chain ID is supported by Decentraland.
 *
 * @param chainId - The chain ID to validate.
 * @returns `true` if the chain ID is supported, `false` otherwise.
 *
 * @example
 * ```ts
 * import { isSupportedChain, ChainId } from '@dcl/core-web3'
 *
 * if (isSupportedChain(chainId)) {
 *   // chainId is narrowed to SupportedChainId
 *   console.log('Chain is supported!')
 * }
 *
 * isSupportedChain(ChainId.ETHEREUM_MAINNET) // true
 * isSupportedChain(ChainId.MATIC_MAINNET) // true
 * isSupportedChain(999) // false (unsupported)
 * ```
 */
function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return supportedChains.some(chain => chain.id === chainId)
}

/**
 * Retrieves the chain configuration object for a given chain ID.
 *
 * @param chainId - The chain ID to look up.
 * @returns The chain configuration object if found, `undefined` otherwise.
 *
 * @example
 * ```ts
 * import { getChainById, ChainId } from '@dcl/core-web3'
 *
 * const ethereum = getChainById(ChainId.ETHEREUM_MAINNET)
 * // { id: 1, name: 'Ethereum', ... }
 *
 * const polygon = getChainById(ChainId.MATIC_MAINNET)
 * // { id: 137, name: 'Polygon', ... }
 *
 * const unknown = getChainById(999)
 * // undefined
 * ```
 */
function getChainById(chainId: number): Chain | undefined {
  return supportedChains.find(chain => chain.id === chainId)
}

export { ChainId, getChainById, isSupportedChain, productionChains, supportedChains, testChains }
export type { SupportedChainId }
