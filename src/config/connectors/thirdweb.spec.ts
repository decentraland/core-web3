import type { EIP1193Provider } from 'viem'
import { ChainId } from '@dcl/schemas'

let connectorFactory: (config: MockConfig) => ReturnType<typeof buildConnectorObject>

type MockConfig = {
  chains: { id: number }[]
  storage: {
    getItem: jest.Mock
    setItem: jest.Mock
    removeItem: jest.Mock
  }
  emitter: {
    emit: jest.Mock
  }
}

function buildConnectorObject() {
  return {
    id: '',
    name: '',
    type: '',
    setup: async () => {},
    connect: async (_opts?: { chainId?: number }) => ({ accounts: [] as readonly `0x${string}`[], chainId: 0 }),
    disconnect: async () => {},
    getAccounts: async () => [] as readonly `0x${string}`[],
    getChainId: async () => 0,
    getProvider: async () => ({} as EIP1193Provider),
    isAuthorized: async () => false,
    switchChain: async (_opts: { chainId: number }) => ({} as never),
    onAccountsChanged: (_accounts: string[]) => {},
    onChainChanged: (_chain: string) => {},
    onDisconnect: () => {}
  }
}

const mockCreateThirdwebClient = jest.fn()
const mockInAppWallet = jest.fn()
const mockDefineChain = jest.fn()
const mockEIP1193ToProvider = jest.fn()
const mockAutoConnect = jest.fn()
const mockDisconnect = jest.fn()
const mockGetAccount = jest.fn()

jest.mock('thirdweb', () => ({
  createThirdwebClient: mockCreateThirdwebClient
}))

jest.mock('thirdweb/wallets', () => ({
  inAppWallet: mockInAppWallet,
  EIP1193: {
    toProvider: mockEIP1193ToProvider
  }
}))

jest.mock('thirdweb/chains', () => ({
  defineChain: mockDefineChain
}))

jest.mock('wagmi', () => ({
  createConnector: (factory: (config: MockConfig) => ReturnType<typeof buildConnectorObject>) => {
    connectorFactory = factory
    return factory
  }
}))

import { thirdweb } from './thirdweb'

describe('thirdweb connector', () => {
  let config: MockConfig
  let connector: ReturnType<typeof buildConnectorObject>
  let mockWalletInstance: { autoConnect: jest.Mock; disconnect: jest.Mock; getAccount: jest.Mock }
  let mockClientInstance: { clientId: string }
  let mockChainInstance: { id: number }
  let mockEIP1193Provider: { request: jest.Mock }

  beforeEach(() => {
    mockClientInstance = { clientId: 'test-client-id' }
    mockWalletInstance = {
      autoConnect: mockAutoConnect,
      disconnect: mockDisconnect,
      getAccount: mockGetAccount
    }
    mockChainInstance = { id: ChainId.ETHEREUM_MAINNET }
    mockEIP1193Provider = { request: jest.fn() }

    mockCreateThirdwebClient.mockReturnValue(mockClientInstance)
    mockInAppWallet.mockReturnValue(mockWalletInstance)
    mockDefineChain.mockReturnValue(mockChainInstance)
    mockEIP1193ToProvider.mockResolvedValue(mockEIP1193Provider)
    mockAutoConnect.mockResolvedValue({ address: '0xabc123' })

    config = {
      chains: [{ id: ChainId.ETHEREUM_MAINNET }, { id: ChainId.ETHEREUM_SEPOLIA }],
      storage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      emitter: {
        emit: jest.fn()
      }
    }

    thirdweb({ clientId: 'test-client-id' })
    connector = connectorFactory(config)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should have the correct id', () => {
    expect(connector.id).toBe('thirdweb')
  })

  it('should have the correct name', () => {
    expect(connector.name).toBe('Thirdweb')
  })

  it('should have the correct type', () => {
    expect(connector.type).toBe('thirdweb')
  })

  describe('when calling setup', () => {
    describe('when a session exists', () => {
      beforeEach(async () => {
        config.storage.getItem.mockResolvedValueOnce(null)
        await connector.setup()
      })

      it('should emit a connect event', () => {
        expect(config.emitter.emit).toHaveBeenCalledWith(
          'connect',
          expect.objectContaining({
            accounts: ['0xabc123'],
            chainId: ChainId.ETHEREUM_MAINNET
          })
        )
      })
    })

    describe('when no session exists', () => {
      beforeEach(async () => {
        config.storage.getItem.mockResolvedValueOnce(null)
        mockAutoConnect.mockResolvedValueOnce(null)
        await connector.setup()
      })

      it('should not emit a connect event', () => {
        expect(config.emitter.emit).not.toHaveBeenCalled()
      })
    })

    describe('when autoConnect throws', () => {
      beforeEach(async () => {
        config.storage.getItem.mockResolvedValueOnce(null)
        mockAutoConnect.mockRejectedValueOnce(new Error('No session'))
        await connector.setup()
      })

      it('should not emit any event', () => {
        expect(config.emitter.emit).not.toHaveBeenCalled()
      })
    })

    describe('when there are no chains configured', () => {
      beforeEach(async () => {
        const noChainConfig: MockConfig = {
          ...config,
          chains: []
        }
        noChainConfig.storage = { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() }
        noChainConfig.storage.getItem.mockResolvedValueOnce(undefined)
        thirdweb({ clientId: 'test-client-id' })
        const noChainConnector = connectorFactory(noChainConfig)
        await noChainConnector.setup()
      })

      it('should not emit any event', () => {
        expect(config.emitter.emit).not.toHaveBeenCalled()
      })
    })
  })

  describe('when calling connect', () => {
    describe('when a session exists', () => {
      let result: { accounts: readonly `0x${string}`[]; chainId: number }

      beforeEach(async () => {
        result = await connector.connect()
      })

      it('should return the account address', () => {
        expect(result.accounts).toEqual(['0xabc123'])
      })

      it('should return the chainId', () => {
        expect(result.chainId).toBe(ChainId.ETHEREUM_MAINNET)
      })
    })

    describe('when a specific chainId is requested', () => {
      let result: { accounts: readonly `0x${string}`[]; chainId: number }

      beforeEach(async () => {
        result = await connector.connect({ chainId: ChainId.ETHEREUM_SEPOLIA })
      })

      it('should use the requested chainId', () => {
        expect(result.chainId).toBe(ChainId.ETHEREUM_SEPOLIA)
      })
    })

    describe('when no session exists', () => {
      beforeEach(() => {
        mockAutoConnect.mockRejectedValueOnce(new Error('No session'))
      })

      it('should throw an error', async () => {
        await expect(connector.connect()).rejects.toThrow('Thirdweb: No active session')
      })
    })

    describe('when autoConnect returns null', () => {
      beforeEach(() => {
        mockAutoConnect.mockResolvedValueOnce(null)
      })

      it('should throw an error', async () => {
        await expect(connector.connect()).rejects.toThrow('Thirdweb: No active session')
      })
    })

    describe('when an unsupported chain is requested', () => {
      it('should throw an error', async () => {
        await expect(connector.connect({ chainId: 999 })).rejects.toThrow('Thirdweb: Chain 999 is not supported')
      })
    })

    describe('when no chainId is provided and no chains are configured', () => {
      it('should throw an error', async () => {
        const noChainConfig: MockConfig = {
          ...config,
          chains: []
        }
        noChainConfig.storage = { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() }
        thirdweb({ clientId: 'test-client-id' })
        const noChainConnector = connectorFactory(noChainConfig)
        await expect(noChainConnector.connect()).rejects.toThrow('Thirdweb: No chain ID provided')
      })
    })
  })

  describe('when calling disconnect', () => {
    beforeEach(async () => {
      await connector.connect()
      jest.clearAllMocks()
      await connector.disconnect()
    })

    it('should call wallet disconnect', () => {
      expect(mockDisconnect).toHaveBeenCalledTimes(1)
    })

    it('should remove the chainId from storage', () => {
      expect(config.storage.removeItem).toHaveBeenCalledWith('thirdwebChainId')
    })
  })

  describe('when calling getAccounts', () => {
    describe('when connected', () => {
      let accounts: readonly `0x${string}`[]

      beforeEach(async () => {
        await connector.connect()
        accounts = await connector.getAccounts()
      })

      it('should return the account address', () => {
        expect(accounts).toEqual(['0xabc123'])
      })
    })

    describe('when not connected', () => {
      let accounts: readonly `0x${string}`[]

      beforeEach(async () => {
        accounts = await connector.getAccounts()
      })

      it('should return an empty array', () => {
        expect(accounts).toEqual([])
      })
    })
  })

  describe('when calling getChainId', () => {
    describe('when there is a saved chainId', () => {
      let chainId: number

      beforeEach(async () => {
        config.storage.getItem.mockResolvedValueOnce(ChainId.ETHEREUM_SEPOLIA)
        chainId = await connector.getChainId()
      })

      it('should return the saved chainId', () => {
        expect(chainId).toBe(ChainId.ETHEREUM_SEPOLIA)
      })
    })

    describe('when there is no saved chainId', () => {
      let chainId: number

      beforeEach(async () => {
        config.storage.getItem.mockResolvedValueOnce(undefined)
        chainId = await connector.getChainId()
      })

      it('should return the first chain from config', () => {
        expect(chainId).toBe(ChainId.ETHEREUM_MAINNET)
      })
    })
  })

  describe('when calling getProvider', () => {
    describe('when connected', () => {
      beforeEach(async () => {
        await connector.connect()
      })

      it('should return a provider', async () => {
        const provider = await connector.getProvider()
        expect(provider).toBeDefined()
      })
    })

    describe('when not connected', () => {
      it('should throw an error', async () => {
        await expect(connector.getProvider()).rejects.toThrow('Thirdweb: wallet is not connected')
      })
    })

    describe('when handling wallet_switchEthereumChain', () => {
      beforeEach(async () => {
        await connector.connect()
        jest.clearAllMocks()
        mockEIP1193ToProvider.mockResolvedValueOnce(mockEIP1193Provider)
        const provider = await connector.getProvider()
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }] // Sepolia
        })
      })

      it('should emit a change event with the new chainId', () => {
        expect(config.emitter.emit).toHaveBeenCalledWith('change', { chainId: ChainId.ETHEREUM_SEPOLIA })
      })

      it('should save the new chainId to storage', () => {
        expect(config.storage.setItem).toHaveBeenCalledWith('thirdwebChainId', ChainId.ETHEREUM_SEPOLIA)
      })
    })

    describe('when handling a non-switch RPC call', () => {
      let provider: EIP1193Provider

      beforeEach(async () => {
        await connector.connect()
        provider = await connector.getProvider()
        mockEIP1193Provider.request.mockResolvedValueOnce(['0xabc123'])
      })

      it('should delegate to the original provider', async () => {
        await provider.request({ method: 'eth_accounts' })
        expect(mockEIP1193Provider.request).toHaveBeenCalledWith({ method: 'eth_accounts' })
      })
    })

    describe('when wallet_switchEthereumChain receives an invalid chainId', () => {
      it('should throw an error', async () => {
        await connector.connect()
        const provider = await connector.getProvider()
        await expect(
          provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: 'invalid' }]
          })
        ).rejects.toThrow('Thirdweb: Invalid chain ID')
      })
    })

    describe('when wallet_switchEthereumChain targets an unsupported chain', () => {
      it('should throw an error', async () => {
        await connector.connect()
        const provider = await connector.getProvider()
        await expect(
          provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x3e7' }] // 999
          })
        ).rejects.toThrow('Thirdweb: Chain 999 is not supported')
      })
    })
  })

  describe('when calling isAuthorized', () => {
    describe('when the wallet has an active session', () => {
      let result: boolean

      beforeEach(async () => {
        await connector.connect()
        mockGetAccount.mockReturnValueOnce({ address: '0xabc123' })
        result = await connector.isAuthorized()
      })

      it('should return true', () => {
        expect(result).toBe(true)
      })
    })

    describe('when the wallet has no session but can auto-connect', () => {
      let result: boolean

      beforeEach(async () => {
        config.storage.getItem.mockResolvedValueOnce(ChainId.ETHEREUM_MAINNET)
        mockAutoConnect.mockResolvedValueOnce({ address: '0xabc123' })
        result = await connector.isAuthorized()
      })

      it('should return true', () => {
        expect(result).toBe(true)
      })
    })

    describe('when auto-connect fails', () => {
      let result: boolean

      beforeEach(async () => {
        config.storage.getItem.mockResolvedValueOnce(ChainId.ETHEREUM_MAINNET)
        mockAutoConnect.mockRejectedValueOnce(new Error('No session'))
        result = await connector.isAuthorized()
      })

      it('should return false', () => {
        expect(result).toBe(false)
      })
    })

    describe('when there is no chainId and no chains configured', () => {
      let result: boolean

      beforeEach(async () => {
        const noChainConfig: MockConfig = {
          ...config,
          chains: []
        }
        noChainConfig.storage = { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() }
        noChainConfig.storage.getItem.mockResolvedValueOnce(undefined)
        thirdweb({ clientId: 'test-client-id' })
        const noChainConnector = connectorFactory(noChainConfig)
        result = await noChainConnector.isAuthorized()
      })

      it('should return false', () => {
        expect(result).toBe(false)
      })
    })
  })

  describe('when calling switchChain', () => {
    describe('when the chain is configured and connected', () => {
      let result: { id: number }

      beforeEach(async () => {
        await connector.connect()
        jest.clearAllMocks()
        mockEIP1193ToProvider.mockResolvedValueOnce(mockEIP1193Provider)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await connector.switchChain({ chainId: ChainId.ETHEREUM_SEPOLIA }) as any
      })

      it('should return the chain config', () => {
        expect(result.id).toBe(ChainId.ETHEREUM_SEPOLIA)
      })

      it('should emit a change event', () => {
        expect(config.emitter.emit).toHaveBeenCalledWith('change', { chainId: ChainId.ETHEREUM_SEPOLIA })
      })

      it('should save the new chainId', () => {
        expect(config.storage.setItem).toHaveBeenCalledWith('thirdwebChainId', ChainId.ETHEREUM_SEPOLIA)
      })
    })

    describe('when the chain is not configured', () => {
      beforeEach(async () => {
        await connector.connect()
      })

      it('should throw an error', async () => {
        await expect(connector.switchChain({ chainId: 999 })).rejects.toThrow('Chain 999 not configured')
      })
    })

    describe('when not connected', () => {
      it('should throw an error', async () => {
        await expect(connector.switchChain({ chainId: ChainId.ETHEREUM_SEPOLIA })).rejects.toThrow('Thirdweb: Not connected')
      })
    })

    describe('when the chain is not supported', () => {
      beforeEach(async () => {
        const extendedConfig: MockConfig = {
          ...config,
          chains: [...config.chains, { id: 42161 }]
        }
        extendedConfig.storage = config.storage
        extendedConfig.emitter = config.emitter
        thirdweb({ clientId: 'test-client-id' })
        connector = connectorFactory(extendedConfig)
        await connector.connect()
      })

      it('should throw an error about unsupported chain', async () => {
        await expect(connector.switchChain({ chainId: 42161 })).rejects.toThrow('Thirdweb: Chain 42161 is not supported')
      })
    })
  })

  describe('when onAccountsChanged is triggered', () => {
    describe('when accounts become empty', () => {
      beforeEach(() => {
        connector.onAccountsChanged([])
      })

      it('should emit a disconnect event', () => {
        expect(config.emitter.emit).toHaveBeenCalledWith('disconnect')
      })
    })

    describe('when accounts are provided', () => {
      beforeEach(() => {
        connector.onAccountsChanged(['0xabc123'])
      })

      it('should emit a change event with the accounts', () => {
        expect(config.emitter.emit).toHaveBeenCalledWith('change', {
          accounts: ['0xabc123']
        })
      })
    })
  })

  describe('when onChainChanged is triggered', () => {
    describe('when a valid hex chainId is provided', () => {
      beforeEach(() => {
        connector.onChainChanged('0x89')
      })

      it('should emit a change event with the parsed chainId', () => {
        expect(config.emitter.emit).toHaveBeenCalledWith('change', { chainId: 137 })
      })
    })

    describe('when an invalid chainId is provided', () => {
      beforeEach(() => {
        connector.onChainChanged('invalid')
      })

      it('should not emit any event', () => {
        expect(config.emitter.emit).not.toHaveBeenCalled()
      })
    })
  })

  describe('when onDisconnect is triggered', () => {
    beforeEach(() => {
      connector.onDisconnect()
    })

    it('should emit a disconnect event', () => {
      expect(config.emitter.emit).toHaveBeenCalledWith('disconnect')
    })

    it('should remove the chainId from storage', () => {
      expect(config.storage.removeItem).toHaveBeenCalledWith('thirdwebChainId')
    })
  })
})
