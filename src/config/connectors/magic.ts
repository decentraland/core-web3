import type { Chain, EIP1193Provider } from 'viem'
import { createConnector } from 'wagmi'
import { ChainId } from '@dcl/schemas'

type MagicInstance = {
  user: {
    isLoggedIn: () => Promise<boolean>
    logout: () => Promise<boolean>
    getInfo: () => Promise<{ email?: string; publicAddress?: string }>
  }
  wallet: {
    getProvider: () => Promise<EIP1193Provider>
  }
}

// RPC URLs for Magic - matches decentraland-connect
const MAGIC_RPC_URLS: Record<number, string> = {
  [ChainId.ETHEREUM_MAINNET]: 'https://rpc.decentraland.org/mainnet?project=magic',
  [ChainId.ETHEREUM_SEPOLIA]: 'https://rpc.decentraland.org/sepolia?project=magic',
  [ChainId.MATIC_MAINNET]: 'https://rpc.decentraland.org/polygon?project=magic',
  [ChainId.MATIC_AMOY]: 'https://rpc.decentraland.org/amoy?project=magic'
}

type StorageItem = { magicChainId?: number }

interface MagicParameters {
  /** Magic publishable API key (pk_live_...) */
  apiKey: string
}

/**
 * Magic connector for wagmi.
 *
 * This connector integrates Magic Link authentication with wagmi,
 * allowing users to sign in with social logins (Google, Discord, etc.)
 * or email-based authentication.
 *
 * Important: The user must already be logged in via Magic (typically through
 * the auth dapp redirect flow). This connector only maintains the session,
 * it does not initiate the Magic login flow.
 *
 * Flow:
 * 1. User goes to auth.decentraland.org and logs in with Magic (social login)
 * 2. Auth dapp redirects back to social dapp with Magic session
 * 3. This connector detects the Magic session and connects
 */
function magic(parameters: MagicParameters) {
  const { apiKey } = parameters

  let magicInstance: MagicInstance | null = null
  let provider: EIP1193Provider | null = null

  async function getMagicInstance(chainId: number): Promise<MagicInstance> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { Magic } = await import('magic-sdk')
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { OAuthExtension } = await import('@magic-ext/oauth2')

    const rpcUrl = MAGIC_RPC_URLS[chainId] || MAGIC_RPC_URLS[ChainId.ETHEREUM_MAINNET]

    return new Magic(apiKey, {
      extensions: [new OAuthExtension()],
      network: {
        rpcUrl,
        chainId
      }
    }) as unknown as MagicInstance
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createConnector<EIP1193Provider, any, StorageItem>(config => {
    /**
     * Helper to get accounts from the provider.
     * Used by setup(), connect(), and getAccounts().
     */
    async function fetchAccounts(): Promise<readonly `0x${string}`[]> {
      if (!provider) {
        return []
      }

      const accounts = await provider.request({
        method: 'eth_accounts'
      })

      return accounts as readonly `0x${string}`[]
    }

    /**
     * Helper to initialize the provider and get connection data.
     * Abstracts the common pattern of getting provider + accounts + saving chainId.
     */
    async function initializeConnection(chainId: number): Promise<{ accounts: readonly `0x${string}`[]; chainId: number } | null> {
      provider = await magicInstance!.wallet.getProvider()
      const accounts = await fetchAccounts()

      if (accounts.length === 0) {
        return null
      }

      await config.storage?.setItem('magicChainId', chainId)

      return { accounts, chainId }
    }

    return {
      id: 'magic',
      name: 'Magic',
      type: 'magic',

      async setup() {
        // The auth dapp stores dcl_magic_user_email in localStorage after
        // a successful Magic OAuth login and removes it on disconnect.
        // We use this as a lightweight signal to avoid loading magic-sdk
        // (~400ms iframe cost) for users who have never used Magic.
        let hasMagicSession = false
        try {
          hasMagicSession = !!localStorage.getItem('dcl_magic_user_email')
        } catch {
          // localStorage not available (SSR, sandboxed iframes, privacy-restricted browsers)
        }
        const savedChainId = await config.storage?.getItem('magicChainId')
        const chainId = savedChainId ?? config.chains[0]?.id
        if (!chainId || (!savedChainId && !hasMagicSession)) return

        try {
          magicInstance = await getMagicInstance(chainId)
          const isLoggedIn = await magicInstance.user.isLoggedIn()

          if (isLoggedIn) {
            const connection = await initializeConnection(chainId)

            if (connection) {
              config.emitter.emit('connect', connection)
            }
          }
        } catch {
          // User not logged in or Magic not available
        }
      },

      async connect({ chainId: requestedChainId }: { chainId?: number } = {}) {
        const targetChainId = requestedChainId ?? config.chains[0].id

        if (!magicInstance) {
          magicInstance = await getMagicInstance(targetChainId)
        }

        const isLoggedIn = await magicInstance.user.isLoggedIn()

        if (!isLoggedIn) {
          throw new Error('Magic: User is not logged in. Please authenticate via the auth dapp first.')
        }

        const connection = await initializeConnection(targetChainId)

        if (!connection) {
          throw new Error('Magic: No accounts found')
        }

        return connection
      },

      async disconnect() {
        if (magicInstance) {
          await magicInstance.user.logout()
        }
        magicInstance = null
        provider = null
        await config.storage?.removeItem('magicChainId')
      },

      async getAccounts() {
        return fetchAccounts()
      },

      async getChainId() {
        // Magic is agnostic of the current chain - it doesn't track chain state
        // internally like MetaMask does. We need to return the chainId we stored.
        const savedChainId = await config.storage?.getItem('magicChainId')
        return savedChainId ?? config.chains[0].id
      },

      async getProvider() {
        if (!provider && magicInstance) {
          provider = await magicInstance.wallet.getProvider()
        }
        return provider!
      },

      async isAuthorized() {
        // This is called by wagmi during reconnect() to check if the connector
        // has an active session. For Magic, we check if the user is logged in.
        try {
          if (!magicInstance) {
            const savedChainId = await config.storage?.getItem('magicChainId')
            if (!savedChainId) return false

            magicInstance = await getMagicInstance(savedChainId)
          }

          return await magicInstance.user.isLoggedIn()
        } catch {
          return false
        }
      },

      async switchChain({ chainId: newChainId }: { chainId: number }): Promise<Chain> {
        const chain = config.chains.find(c => c.id === newChainId)

        if (!chain) {
          throw new Error(`Chain ${newChainId} not configured`)
        }

        // Magic doesn't support wallet_switchEthereumChain natively
        // We need to recreate the Magic instance with the new chain
        // This is the same approach decentraland-connect uses
        magicInstance = await getMagicInstance(newChainId)
        const isLoggedIn = await magicInstance.user.isLoggedIn()

        if (!isLoggedIn) {
          throw new Error('Magic: User is not logged in')
        }

        provider = await magicInstance.wallet.getProvider()
        await config.storage?.setItem('magicChainId', newChainId)

        config.emitter.emit('change', { chainId: newChainId })

        return chain
      },

      // These handlers are required by wagmi's connector interface.
      // They would be called if Magic emitted wallet events, but Magic
      // doesn't emit events like MetaMask does. They're here for interface
      // compliance and potential future Magic SDK updates.
      onAccountsChanged(accounts: string[]) {
        if (accounts.length === 0) {
          this.onDisconnect()
        } else {
          config.emitter.emit('change', {
            accounts: accounts as readonly `0x${string}`[]
          })
        }
      },

      onChainChanged(chain: string) {
        // EIP-1193 specifies chain IDs as hex strings
        const chainId = chain.startsWith('0x') ? parseInt(chain, 16) : Number(chain)
        config.emitter.emit('change', { chainId })
      },

      onDisconnect() {
        config.emitter.emit('disconnect')
        magicInstance = null
        provider = null
      }
    }
  })
}

export { magic }
export type { MagicParameters }
