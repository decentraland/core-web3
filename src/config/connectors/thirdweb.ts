// Type-only imports - these are erased at compile time and don't add thirdweb to the bundle
// The actual thirdweb package is imported dynamically at runtime
import type { Chain as ThirdwebChain, ThirdwebClient } from 'thirdweb'
import type { Account as ThirdwebAccount, Wallet as ThirdwebWallet } from 'thirdweb/wallets'
import type { Chain, EIP1193Provider } from 'viem'
import { createConnector } from 'wagmi'
import { ChainId } from '@dcl/schemas'

type StorageItem = { thirdwebChainId?: number }

interface ThirdwebParameters {
  /** Thirdweb client ID */
  clientId: string
  /** Supported chain IDs */
  supportedChainIds?: ChainId[]
}

/**
 * Thirdweb connector for wagmi.
 *
 * This connector integrates Thirdweb in-app wallets with wagmi,
 * allowing users to sign in with email OTP authentication.
 *
 * Important: The user must already be logged in via Thirdweb (typically through
 * the auth dapp at decentraland.org/auth). This connector only maintains the session,
 * it does not initiate the Thirdweb login flow.
 *
 * Uses thirdweb's official EIP1193.toProvider() adapter which provides
 * a fully compliant EIP-1193 provider with all RPC methods supported.
 *
 * Flow:
 * 1. User goes to decentraland.org/auth and logs in with email OTP
 * 2. Auth dapp creates thirdweb session and redirects back
 * 3. This connector detects the thirdweb session and connects
 */
function thirdweb(parameters: ThirdwebParameters) {
  const { clientId, supportedChainIds = [ChainId.ETHEREUM_MAINNET, ChainId.ETHEREUM_SEPOLIA] } = parameters

  let client: ThirdwebClient | null = null
  let wallet: ThirdwebWallet | null = null
  let chain: ThirdwebChain | null = null
  let account: ThirdwebAccount | null = null
  let eip1193Provider: EIP1193Provider | null = null
  let currentChainId: number | null = null

  /**
   * Get or create the thirdweb client
   */
  async function getThirdwebClient(): Promise<ThirdwebClient> {
    if (client) {
      return client
    }

    try {
      const thirdweb = await import('thirdweb')
      client = thirdweb.createThirdwebClient({ clientId })
      return client
    } catch {
      throw new Error('Thirdweb: thirdweb package is not installed.')
    }
  }

  /**
   * Get or create the in-app wallet instance
   */
  async function getInAppWallet(): Promise<ThirdwebWallet> {
    if (wallet) {
      return wallet
    }

    try {
      const wallets = await import('thirdweb/wallets')
      wallet = wallets.inAppWallet()
      return wallet
    } catch {
      throw new Error('Thirdweb: thirdweb package is not installed. Run: npm install thirdweb')
    }
  }

  /**
   * Get or create the thirdweb chain object
   */
  async function getThirdwebChain(chainId: number): Promise<ThirdwebChain> {
    if (chain && currentChainId === chainId) {
      return chain
    }

    const chains = await import('thirdweb/chains')
    chain = chains.defineChain(chainId)
    currentChainId = chainId
    return chain
  }

  /**
   * Create the EIP-1193 provider using thirdweb's official adapter
   */
  async function createEIP1193Provider(
    walletInstance: ThirdwebWallet,
    chainInstance: ThirdwebChain,
    clientInstance: ThirdwebClient
  ): Promise<EIP1193Provider> {
    const { EIP1193 } = await import('thirdweb/wallets')
    return EIP1193.toProvider({
      wallet: walletInstance,
      chain: chainInstance,
      client: clientInstance,
    })
  }

  /**
   * Validate that a chainId is supported
   */
  function validateChainId(chainId: number): void {
    if (!supportedChainIds.includes(chainId as ChainId)) {
      throw new Error(`Thirdweb: Chain ${chainId} is not supported. Supported chains: ${supportedChainIds.join(', ')}`)
    }
  }

  /**
   * Clear all internal state
   */
  function clearState(): void {
    wallet = null
    client = null
    chain = null
    account = null
    eip1193Provider = null
    currentChainId = null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createConnector<EIP1193Provider, any, StorageItem>((config) => {
    /**
     * Initialize connection and create the EIP-1193 provider
     */
    async function initializeConnection(
      chainId: number
    ): Promise<{ accounts: readonly `0x${string}`[]; chainId: number } | null> {
      if (!account || !wallet) {
        return null
      }

      const clientInstance = await getThirdwebClient()
      const chainInstance = await getThirdwebChain(chainId)

      // Create the EIP-1193 provider using thirdweb's official adapter
      eip1193Provider = await createEIP1193Provider(wallet, chainInstance, clientInstance)
      await config.storage?.setItem('thirdwebChainId', chainId)

      return {
        accounts: [account.address as `0x${string}`],
        chainId,
      }
    }

    return {
      id: 'thirdweb',
      name: 'Thirdweb',
      type: 'thirdweb',

      async setup() {
        // Check if user is already logged in via Thirdweb
        const savedChainId = await config.storage?.getItem('thirdwebChainId')
        const chainId = savedChainId ?? config.chains[0]?.id

        if (!chainId) {
          return
        }

        try {
          wallet = await getInAppWallet()
          const clientInstance = await getThirdwebClient()

          // Auto-connect to existing session (without chain, like decentraland-connect)
          account = await wallet.autoConnect({ client: clientInstance })

          if (!account) {
            return
          }

          const connection = await initializeConnection(chainId)

          if (!connection) {
            return
          }

          config.emitter.emit('connect', connection)
        } catch {
          // User not logged in or Thirdweb not available
        }
      },

      async connect({ chainId: requestedChainId }: { chainId?: number } = {}) {
        const targetChainId = requestedChainId ?? config.chains[0]?.id

        if (!targetChainId) {
          throw new Error('Thirdweb: No chain ID provided and no chains configured')
        }

        // Validate the requested chain is supported
        validateChainId(targetChainId)

        if (!wallet) {
          wallet = await getInAppWallet()
        }

        const clientInstance = await getThirdwebClient()

        try {
          // Auto-connect to existing session (without chain, like decentraland-connect)
          account = await wallet.autoConnect({ client: clientInstance })
        } catch {
          throw new Error('Thirdweb: No active session. User must authenticate first.')
        }

        if (!account) {
          throw new Error('Thirdweb: No active session. User must authenticate first.')
        }

        const connection = await initializeConnection(targetChainId)

        if (!connection) {
          throw new Error('Thirdweb: Failed to initialize connection')
        }

        return connection
      },

      async disconnect() {
        if (wallet) {
          await wallet.disconnect()
        }
        clearState()
        await config.storage?.removeItem('thirdwebChainId')
      },

      async getAccounts() {
        if (!account) {
          return []
        }
        return [account.address as `0x${string}`]
      },

      async getChainId() {
        const savedChainId = await config.storage?.getItem('thirdwebChainId')
        return savedChainId ?? currentChainId ?? config.chains[0]?.id
      },

      async getProvider() {
        if (!eip1193Provider) {
          throw new Error('Thirdweb: wallet is not connected. Call connect() first.')
        }

        // Wrap the thirdweb provider to handle wallet_switchEthereumChain
        const originalProvider = eip1193Provider
        return new Proxy(originalProvider, {
          get(target, prop) {
            if (prop === 'request') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return async (args: any) => {
                const { method, params } = args as { method: string; params?: unknown[] }

                // Handle wallet_switchEthereumChain by updating internal state
                if (method === 'wallet_switchEthereumChain') {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const newChainIdHex = (params as any)?.[0]?.chainId
                  const newChainId = parseInt(newChainIdHex, 16)

                  if (Number.isNaN(newChainId)) {
                    throw new Error('Thirdweb: Invalid chain ID')
                  }

                  validateChainId(newChainId)

                  // Reset chain and provider to be recreated
                  chain = null
                  eip1193Provider = null

                  // Recreate provider with new chain
                  const clientInstance = await getThirdwebClient()
                  const walletInstance = await getInAppWallet()
                  const chainInstance = await getThirdwebChain(newChainId)

                  eip1193Provider = await createEIP1193Provider(walletInstance, chainInstance, clientInstance)
                  await config.storage?.setItem('thirdwebChainId', newChainId)

                  config.emitter.emit('change', { chainId: newChainId })
                  return null
                }

                return target.request(args)
              }
            }
            return Reflect.get(target, prop)
          },
        }) as EIP1193Provider
      },

      async isAuthorized() {
        try {
          if (!wallet) {
            const savedChainId = await config.storage?.getItem('thirdwebChainId')
            const chainId = savedChainId ?? config.chains[0]?.id

            if (!chainId) {
              return false
            }

            wallet = await getInAppWallet()
            const clientInstance = await getThirdwebClient()

            try {
              // Auto-connect to existing session (without chain, like decentraland-connect)
              account = await wallet.autoConnect({ client: clientInstance })
              return !!account
            } catch {
              return false
            }
          }

          return !!wallet.getAccount()
        } catch {
          return false
        }
      },

      async switchChain({ chainId: newChainId }: { chainId: number }): Promise<Chain> {
        const chainConfig = config.chains.find((c) => c.id === newChainId)

        if (!chainConfig) {
          throw new Error(`Chain ${newChainId} not configured`)
        }

        validateChainId(newChainId)

        if (!wallet || !account) {
          throw new Error('Thirdweb: Not connected')
        }

        // Reset chain and provider to be recreated
        chain = null
        eip1193Provider = null

        // Recreate provider with new chain
        const clientInstance = await getThirdwebClient()
        const chainInstance = await getThirdwebChain(newChainId)

        eip1193Provider = await createEIP1193Provider(wallet, chainInstance, clientInstance)
        await config.storage?.setItem('thirdwebChainId', newChainId)

        config.emitter.emit('change', { chainId: newChainId })

        return chainConfig
      },

      onAccountsChanged(accounts: string[]) {
        if (accounts.length === 0) {
          this.onDisconnect()
        } else {
          config.emitter.emit('change', {
            accounts: accounts as readonly `0x${string}`[],
          })
        }
      },

      onChainChanged(chainIdHex: string) {
        const chainId = parseInt(chainIdHex, 16)
        if (Number.isNaN(chainId)) {
          return
        }
        config.emitter.emit('change', { chainId })
      },

      onDisconnect() {
        config.emitter.emit('disconnect')
        clearState()
        // Note: storage cleanup is async but onDisconnect is sync
        // We fire and forget here since it's cleanup
        void config.storage?.removeItem('thirdwebChainId')
      },
    }
  })
}

export { thirdweb }
export type { ThirdwebParameters }
