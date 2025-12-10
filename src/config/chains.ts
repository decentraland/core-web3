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
 * Enum-like object containing all supported chain IDs.
 * Use this to reference chain IDs in a type-safe manner.
 *
 * @example
 * ```ts
 * import { CHAIN_ID } from '@dcl/core-web3'
 *
 * const chainId = CHAIN_ID.ethereumMainnet // 1
 * const polygonId = CHAIN_ID.polygonMainnet // 137
 * ```
 * @readonly
 */
const CHAIN_ID = {
  /** Ethereum Mainnet chain ID (1) */
  ethereumMainnet: mainnet.id,
  /** Polygon Mainnet chain ID (137) */
  polygonMainnet: polygon.id,
  /** Ethereum Sepolia testnet chain ID (11155111) */
  ethereumSepolia: sepolia.id,
  /** Polygon Amoy testnet chain ID (80002) */
  polygonAmoy: polygonAmoy.id
} as const

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
 * import { isSupportedChain, CHAIN_ID } from '@dcl/core-web3'
 *
 * if (isSupportedChain(chainId)) {
 *   // chainId is narrowed to SupportedChainId
 *   console.log('Chain is supported!')
 * }
 *
 * isSupportedChain(1) // true (Ethereum Mainnet)
 * isSupportedChain(137) // true (Polygon)
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
 * import { getChainById, CHAIN_ID } from '@dcl/core-web3'
 *
 * const ethereum = getChainById(CHAIN_ID.ethereumMainnet)
 * // { id: 1, name: 'Ethereum', ... }
 *
 * const polygon = getChainById(137)
 * // { id: 137, name: 'Polygon', ... }
 *
 * const unknown = getChainById(999)
 * // undefined
 * ```
 */
function getChainById(chainId: number): Chain | undefined {
  return supportedChains.find(chain => chain.id === chainId)
}

export { CHAIN_ID, getChainById, isSupportedChain, productionChains, supportedChains, testChains }
export type { SupportedChainId }
