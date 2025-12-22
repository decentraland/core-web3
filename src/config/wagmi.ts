import type { Chain, Transport } from 'viem'
import { createConfig, http } from 'wagmi'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'
import { supportedChains } from './chains'

/**
 * Configuration options for creating a Web3 Core config.
 */
interface Web3CoreConfigOptions {
  /**
   * WalletConnect Cloud project ID.
   * Required to enable WalletConnect connector.
   * Get one at https://cloud.walletconnect.com
   */
  walletConnectProjectId?: string

  /**
   * Application metadata used by wallet connectors.
   * Displayed to users when connecting their wallet.
   */
  appMetadata?: {
    /** Application name displayed in wallet connection prompts */
    name: string
    /** Application description */
    description?: string
    /** Application URL */
    url?: string
    /** Application icons (URLs) */
    icons?: string[]
  }

  /**
   * Blockchain networks to support.
   * @default supportedChains (all Decentraland supported chains)
   */
  chains?: readonly [Chain, ...Chain[]]

  /**
   * Custom transport configuration per chain.
   * Keys are chain IDs, values are viem Transport instances.
   * @default http() for each chain
   */
  transports?: Record<number, Transport>

  /**
   * Enable/disable specific wallet connectors.
   * All connectors are enabled by default.
   */
  connectors?: {
    /** Enable injected wallet connector (MetaMask, etc.) @default true */
    injected?: boolean
    /** Enable WalletConnect connector (requires walletConnectProjectId) @default true */
    walletConnect?: boolean
    /** Enable Coinbase Wallet connector @default true */
    coinbaseWallet?: boolean
  }
}

/**
 * Default application metadata for Decentraland dApps.
 * @internal
 */
const defaultAppMetadata = {
  name: 'Decentraland',
  description: 'Decentraland dApp',
  url: 'https://decentraland.org',
  icons: ['https://cdn.decentraland.org/@dcl/marketplace-site/6.41.1/favicon.ico']
}

/**
 * Creates a wagmi config instance pre-configured for Decentraland dApps.
 *
 * Supports the following wallet connectors:
 * - **Injected**: MetaMask, Brave Wallet, and other browser extension wallets
 * - **WalletConnect**: Mobile wallets via QR code (requires project ID)
 * - **Coinbase Wallet**: Coinbase Wallet app and extension
 *
 * @param options - Configuration options for the Web3 Core config.
 * @returns A wagmi config instance ready to use with wagmi hooks.
 *
 * @example
 * ```ts
 * import { createWeb3CoreConfig } from '@dcl/core-web3'
 *
 * // Basic usage with defaults
 * const config = createWeb3CoreConfig()
 *
 * // With WalletConnect enabled
 * const config = createWeb3CoreConfig({
 *   walletConnectProjectId: 'your-project-id',
 *   appMetadata: {
 *     name: 'My Decentraland App',
 *     description: 'An awesome dApp',
 *     url: 'https://myapp.com',
 *   },
 * })
 *
 * // With custom chains and disabled connectors
 * const config = createWeb3CoreConfig({
 *   chains: [mainnet, polygon],
 *   connectors: {
 *     injected: true,
 *     walletConnect: false,
 *     coinbaseWallet: false,
 *   },
 * })
 * ```
 */
function createWeb3CoreConfig(options: Web3CoreConfigOptions = {}) {
  const {
    walletConnectProjectId,
    appMetadata = defaultAppMetadata,
    chains = supportedChains,
    transports: customTransports,
    connectors: connectorOptions = {}
  } = options

  const {
    injected: enableInjected = true,
    walletConnect: enableWalletConnect = true,
    coinbaseWallet: enableCoinbaseWallet = true
  } = connectorOptions

  const transports = chains.reduce(
    (acc, chain) => {
      acc[chain.id] = customTransports?.[chain.id] ?? http()
      return acc
    },
    {} as Record<number, Transport>
  )

  const connectors = []

  if (enableInjected) {
    connectors.push(injected())
  }

  if (enableWalletConnect && walletConnectProjectId) {
    connectors.push(
      walletConnect({
        projectId: walletConnectProjectId,
        metadata: {
          name: appMetadata.name,
          description: appMetadata.description ?? '',
          url: appMetadata.url ?? '',
          icons: appMetadata.icons ?? []
        }
      })
    )
  }

  if (enableCoinbaseWallet) {
    connectors.push(
      coinbaseWallet({
        appName: appMetadata.name
      })
    )
  }

  return createConfig({
    chains,
    transports,
    connectors
  })
}

/**
 * Type representing the wagmi config returned by {@link createWeb3CoreConfig}.
 * Use this type when you need to pass the config to other functions or components.
 */
type Web3CoreConfig = ReturnType<typeof createWeb3CoreConfig>

export { createWeb3CoreConfig }
export type { Web3CoreConfig, Web3CoreConfigOptions }
