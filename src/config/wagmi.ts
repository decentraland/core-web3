import type { Chain, Transport } from 'viem'
import { createConfig, http } from 'wagmi'
import type { CreateConnectorFn } from 'wagmi'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'
import { ChainId } from '@dcl/schemas'
import { supportedChains } from './chains'
import { magic } from './connectors/magic'

/**
 * Configuration options for creating a Web3 Core config.
 */
type AppMetadata = {
  /** Application name displayed in wallet connection prompts */
  name: string
  /** Application description */
  description?: string
  /** Application URL */
  url: string
  /** Application icons (URLs) */
  icons?: string[]
}

type AppMetadataInput = {
  /** Application name displayed in wallet connection prompts */
  name?: string
  /** Application description */
  description?: string
  /** Application URL */
  url?: string
  /** Application URL path relative to https://decentraland.org */
  urlPath?: string
  /** Application icons (URLs) */
  icons?: string[]
}

interface Web3CoreConfigOptions {
  /**
   * WalletConnect Cloud project ID.
   * @default Decentraland shared project ID
   */
  walletConnectProjectId?: string

  /**
   * Decentraland environment used to select the default Magic API key.
   * Only used when `connectors.magic` does not provide an explicit `apiKey`.
   * @default 'prd'
   */
  environment?: 'dev' | 'stg' | 'prd'

  /**
   * Application metadata used by wallet connectors.
   * Displayed to users when connecting their wallet.
   */
  appMetadata?: AppMetadataInput

  /**
   * Blockchain networks to support.
   * @default supportedChains (all Decentraland supported chains)
   */
  chains?: readonly [Chain, ...Chain[]]

  /**
   * Custom transport configuration per chain.
   * Keys are chain IDs, values are viem Transport instances.
   * @default Decentraland RPCs for supported chains, http() fallback otherwise
   */
  transports?: Record<number, Transport>

  /**
   * Enable/disable specific wallet connectors.
   * All connectors are enabled by default.
   */
  connectors?: {
    /** Enable injected wallet connector (MetaMask, etc.) @default true */
    injected?: boolean
    /** Enable WalletConnect connector @default true */
    walletConnect?: boolean
    /** Enable Coinbase Wallet connector @default true */
    coinbaseWallet?: boolean
    /** Enable Magic connector for social login. Pass `{ apiKey }` to override the default key. @default true */
    magic?: boolean | { apiKey: string }
  }

  /**
   * Additional custom connectors to include.
   * Use this to add connectors beyond the built-in ones.
   *
   * **Note:** Magic is now built-in (controlled via `connectors.magic`).
   * If you were passing `magic()` here, remove it to avoid double-registration.
   */
  additionalConnectors?: CreateConnectorFn[]
}

/**
 * Default application metadata for Decentraland dApps.
 * @internal
 */
const defaultAppMetadata: AppMetadata = {
  name: 'Decentraland',
  description: 'Decentraland dApp',
  url: 'https://decentraland.org',
  icons: ['https://cdn.decentraland.org/@dcl/marketplace-site/6.41.1/favicon.ico'],
}

// Publishable client-side keys — not secrets
const DEFAULT_WALLET_CONNECT_PROJECT_ID = '61570c542c2d66c659492e5b24a41522'

// dev and stg share the same Magic application
const NON_PRD_MAGIC_KEY = 'pk_live_CE856A4938B36648'
const DEFAULT_MAGIC_API_KEYS: Record<NonNullable<Web3CoreConfigOptions['environment']>, string> = {
  dev: NON_PRD_MAGIC_KEY,
  stg: NON_PRD_MAGIC_KEY,
  prd: 'pk_live_212568025B158355',
}

const DEFAULT_RPC_URLS: Record<number, string> = {
  [ChainId.ETHEREUM_MAINNET]: 'https://rpc.decentraland.org/mainnet',
  [ChainId.ETHEREUM_SEPOLIA]: 'https://rpc.decentraland.org/sepolia',
  [ChainId.MATIC_MAINNET]: 'https://rpc.decentraland.org/polygon',
  [ChainId.MATIC_AMOY]: 'https://rpc.decentraland.org/amoy',
}

const defaultTransports = supportedChains.reduce(
  (acc, chain) => {
    const rpcUrl = DEFAULT_RPC_URLS[chain.id]
    acc[chain.id] = rpcUrl ? http(rpcUrl) : http()
    return acc
  },
  {} as Record<number, Transport>
)

function buildAppUrl(baseUrl: string, path: string): string {
  const trimmedPath = path.trim()

  if (!trimmedPath) {
    return baseUrl
  }

  const normalizedBase = baseUrl.replace(/\/+$/, '')
  const normalizedPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`

  return `${normalizedBase}${normalizedPath}`
}

function resolveAppMetadata(overrides?: AppMetadataInput): AppMetadata {
  if (!overrides) {
    return defaultAppMetadata
  }

  const resolvedUrl =
    overrides.url ??
    (overrides.urlPath
      ? buildAppUrl(defaultAppMetadata.url, overrides.urlPath)
      : defaultAppMetadata.url)

  return {
    name: overrides.name ?? defaultAppMetadata.name,
    description: overrides.description ?? defaultAppMetadata.description,
    url: resolvedUrl,
    icons: overrides.icons ?? defaultAppMetadata.icons,
  }
}

/**
 * Creates a wagmi config instance pre-configured for Decentraland dApps.
 *
 * Supports the following wallet connectors (all enabled by default):
 * - **Injected**: MetaMask, Brave Wallet, and other browser extension wallets
 * - **WalletConnect**: Mobile wallets via QR code
 * - **Coinbase Wallet**: Coinbase Wallet app and extension
 * - **Magic**: Social login (email, Google, Discord)
 *
 * @param options - Configuration options for the Web3 Core config.
 * @returns A wagmi config instance ready to use with wagmi hooks.
 *
 * @example
 * ```ts
 * import { createWeb3CoreConfig } from '@dcl/core-web3'
 *
 * // Zero-config — all connectors enabled with Decentraland defaults
 * const config = createWeb3CoreConfig()
 *
 * // With custom app metadata
 * const config = createWeb3CoreConfig({
 *   appMetadata: {
 *     name: 'My Decentraland App',
 *     urlPath: '/marketplace',
 *   },
 * })
 *
 * // With disabled connectors and custom Magic key
 * const config = createWeb3CoreConfig({
 *   connectors: {
 *     walletConnect: false,
 *     coinbaseWallet: false,
 *     magic: { apiKey: 'pk_live_CUSTOM' },
 *   },
 * })
 * ```
 */
function createWeb3CoreConfig(options: Web3CoreConfigOptions = {}) {
  const {
    walletConnectProjectId = DEFAULT_WALLET_CONNECT_PROJECT_ID,
    environment = 'prd',
    appMetadata: appMetadataOverrides,
    chains = supportedChains,
    transports: customTransports,
    connectors: connectorOptions = {},
    additionalConnectors = [],
  } = options

  if (!Object.prototype.hasOwnProperty.call(DEFAULT_MAGIC_API_KEYS, environment)) {
    throw new Error(
      `Invalid environment "${environment}". Expected one of: ${Object.keys(DEFAULT_MAGIC_API_KEYS).join(', ')}`
    )
  }

  const appMetadata = resolveAppMetadata(appMetadataOverrides)

  const {
    injected: enableInjected = true,
    walletConnect: enableWalletConnect = true,
    coinbaseWallet: enableCoinbaseWallet = true,
    magic: magicOption = true,
  } = connectorOptions

  const transports = chains.reduce(
    (acc, chain) => {
      acc[chain.id] = customTransports?.[chain.id] ?? defaultTransports[chain.id] ?? http()
      return acc
    },
    {} as Record<number, Transport>
  )

  const connectors = []

  if (enableInjected) {
    connectors.push(injected())
  }

  if (enableWalletConnect) {
    connectors.push(
      walletConnect({
        projectId: walletConnectProjectId,
        metadata: {
          name: appMetadata.name,
          description: appMetadata.description ?? '',
          url: appMetadata.url,
          icons: appMetadata.icons ?? [],
        },
      })
    )
  }

  if (enableCoinbaseWallet) {
    connectors.push(
      coinbaseWallet({
        appName: appMetadata.name,
      })
    )
  }

  if (magicOption !== false) {
    const resolvedMagicKey =
      typeof magicOption === 'object' ? magicOption.apiKey : DEFAULT_MAGIC_API_KEYS[environment]
    connectors.push(magic({ apiKey: resolvedMagicKey }))
  }

  connectors.push(...additionalConnectors)

  return createConfig({
    chains,
    transports,
    connectors,
  })
}

/**
 * Type representing the wagmi config returned by {@link createWeb3CoreConfig}.
 * Use this type when you need to pass the config to other functions or components.
 */
type Web3CoreConfig = ReturnType<typeof createWeb3CoreConfig>

/**
 * Clears wagmi localStorage state.
 *
 * This is necessary because wagmi trusts its stored state. If the user was
 * disconnected before going to auth, wagmi has saved {connections: [], current: null}.
 * When returning from auth (even though MetaMask is now authorized), wagmi loads
 * this "disconnected" state and doesn't re-check authorization.
 *
 * The auth site doesn't update our wagmi state (it may use different config/storage),
 * so we clear it before redirecting to ensure a fresh reconnection on return.
 */
function clearWagmiState(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  const keysToRemove: string[] = []
  const { localStorage } = window

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('wagmi.')) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key))
}

/**
 * Clears connection-related localStorage entries that were set by
 * decentraland-connect, mirroring the cleanup performed by
 * decentraland-connect's `ConnectionManager.disconnect()`.
 *
 * Keys removed:
 * - `decentraland-connect-storage-key` – persisted provider type & chain
 */
function clearConnectionStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  window.localStorage.removeItem('decentraland-connect-storage-key')
}

export { createWeb3CoreConfig, clearWagmiState, clearConnectionStorage }
export type { Web3CoreConfig, Web3CoreConfigOptions }
