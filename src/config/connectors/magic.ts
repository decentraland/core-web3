import type { Chain, EIP1193Provider } from 'viem'
import { createConnector } from 'wagmi'
import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'

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

const MAGIC_CONFIG = {
  apiKey: 'pk_live_212568025B158355',
  testApiKey: 'pk_live_CE856A4938B36648',
  rpcUrls: {
    [ChainId.ETHEREUM_MAINNET]: 'https://rpc.decentraland.org/mainnet?project=magic',
    [ChainId.ETHEREUM_SEPOLIA]: 'https://rpc.decentraland.org/sepolia?project=magic',
    [ChainId.MATIC_MAINNET]: 'https://rpc.decentraland.org/polygon?project=magic',
    [ChainId.MATIC_AMOY]: 'https://rpc.decentraland.org/amoy?project=magic'
  } as Record<number, string>
} as const

type StorageItem = { magicChainId?: number }

interface MagicParameters {
  isTest?: boolean
}

function magic(parameters: MagicParameters = {}) {
  const { isTest = false } = parameters

  let magicInstance: MagicInstance | null = null
  let provider: EIP1193Provider | null = null

  async function getMagicInstance(chainId: number): Promise<MagicInstance> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { Magic } = await import('magic-sdk')
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { OAuthExtension } = await import('@magic-ext/oauth2')

    const apiKey = isTest ? MAGIC_CONFIG.testApiKey : MAGIC_CONFIG.apiKey
    const rpcUrl = MAGIC_CONFIG.rpcUrls[chainId] || MAGIC_CONFIG.rpcUrls[ChainId.ETHEREUM_MAINNET]

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
    async function fetchAccounts(): Promise<readonly `0x${string}`[]> {
      if (!provider) {
        return []
      }

      const accounts = await provider.request({
        method: 'eth_accounts'
      })

      return accounts as readonly `0x${string}`[]
    }

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
        const savedChainId = await config.storage?.getItem('magicChainId')
        const chainId = savedChainId ?? config.chains[0]?.id

        if (chainId) {
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
        try {
          if (!magicInstance) {
            const savedChainId = await config.storage?.getItem('magicChainId')
            const chainId = savedChainId ?? config.chains[0]?.id

            if (!chainId) {
              return false
            }

            magicInstance = await getMagicInstance(chainId)
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
        const chainId = Number(chain)
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
