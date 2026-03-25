import type { EIP1193Provider } from 'viem'

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

const mockIsLoggedIn = jest.fn()
const mockLogout = jest.fn()
const mockGetInfo = jest.fn()
const mockGetProvider = jest.fn()
const mockMagicConstructor = jest.fn()
const mockOAuthExtension = jest.fn()

jest.mock('magic-sdk', () => ({
  Magic: mockMagicConstructor
}))

jest.mock('@magic-ext/oauth2', () => ({
  OAuthExtension: mockOAuthExtension
}))

jest.mock('wagmi', () => ({
  createConnector: (factory: (config: MockConfig) => ReturnType<typeof buildConnectorObject>) => {
    connectorFactory = factory
    return factory
  }
}))

import { magic } from './magic'

describe('magic connector', () => {
  let config: MockConfig
  let connector: ReturnType<typeof buildConnectorObject>
  let mockProvider: { request: jest.Mock }

  beforeEach(() => {
    mockProvider = {
      request: jest.fn()
    }

    mockMagicConstructor.mockReturnValue({
      user: {
        isLoggedIn: mockIsLoggedIn,
        logout: mockLogout,
        getInfo: mockGetInfo
      },
      wallet: {
        getProvider: mockGetProvider
      }
    })

    mockGetProvider.mockResolvedValue(mockProvider)
    mockOAuthExtension.mockReturnValue({})

    config = {
      chains: [{ id: 1 }, { id: 137 }],
      storage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      emitter: {
        emit: jest.fn()
      }
    }

    magic({ apiKey: 'pk_test_123' })
    connector = connectorFactory(config)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should have the correct id', () => {
    expect(connector.id).toBe('magic')
  })

  it('should have the correct name', () => {
    expect(connector.name).toBe('Magic')
  })

  it('should have the correct type', () => {
    expect(connector.type).toBe('magic')
  })

  describe('when calling setup', () => {
    describe('when the user is logged in', () => {
      beforeEach(async () => {
        mockIsLoggedIn.mockResolvedValueOnce(true)
        mockProvider.request.mockResolvedValueOnce(['0x1234567890abcdef1234567890abcdef12345678'])
        config.storage.getItem.mockResolvedValueOnce(null)
        await connector.setup()
      })

      it('should emit a connect event', () => {
        expect(config.emitter.emit).toHaveBeenCalledWith(
          'connect',
          expect.objectContaining({ chainId: 1 })
        )
      })
    })

    describe('when the user is not logged in', () => {
      beforeEach(async () => {
        mockIsLoggedIn.mockResolvedValueOnce(false)
        config.storage.getItem.mockResolvedValueOnce(null)
        await connector.setup()
      })

      it('should not emit a connect event', () => {
        expect(config.emitter.emit).not.toHaveBeenCalled()
      })
    })

    describe('when there is a saved chainId', () => {
      beforeEach(async () => {
        config.storage.getItem.mockResolvedValueOnce(137)
        mockIsLoggedIn.mockResolvedValueOnce(true)
        mockProvider.request.mockResolvedValueOnce(['0x1234567890abcdef1234567890abcdef12345678'])
        await connector.setup()
      })

      it('should use the saved chainId', () => {
        expect(config.emitter.emit).toHaveBeenCalledWith(
          'connect',
          expect.objectContaining({ chainId: 137 })
        )
      })
    })

    describe('when Magic initialization fails', () => {
      beforeEach(async () => {
        config.storage.getItem.mockResolvedValueOnce(null)
        mockMagicConstructor.mockImplementationOnce(() => {
          throw new Error('Magic not available')
        })
        await connector.setup()
      })

      it('should not emit any event', () => {
        expect(config.emitter.emit).not.toHaveBeenCalled()
      })
    })

    describe('when accounts are empty', () => {
      beforeEach(async () => {
        config.storage.getItem.mockResolvedValueOnce(null)
        mockIsLoggedIn.mockResolvedValueOnce(true)
        mockProvider.request.mockResolvedValueOnce([])
        await connector.setup()
      })

      it('should not emit a connect event', () => {
        expect(config.emitter.emit).not.toHaveBeenCalled()
      })
    })
  })

  describe('when calling connect', () => {
    describe('when the user is logged in', () => {
      let result: { accounts: readonly `0x${string}`[]; chainId: number }

      beforeEach(async () => {
        mockIsLoggedIn.mockResolvedValueOnce(true)
        mockProvider.request.mockResolvedValueOnce(['0xabc123'])
        result = await connector.connect()
      })

      it('should return the accounts', () => {
        expect(result.accounts).toEqual(['0xabc123'])
      })

      it('should return the chainId', () => {
        expect(result.chainId).toBe(1)
      })

      it('should save the chainId to storage', () => {
        expect(config.storage.setItem).toHaveBeenCalledWith('magicChainId', 1)
      })
    })

    describe('when a specific chainId is requested', () => {
      let result: { accounts: readonly `0x${string}`[]; chainId: number }

      beforeEach(async () => {
        mockIsLoggedIn.mockResolvedValueOnce(true)
        mockProvider.request.mockResolvedValueOnce(['0xabc123'])
        result = await connector.connect({ chainId: 137 })
      })

      it('should use the requested chainId', () => {
        expect(result.chainId).toBe(137)
      })
    })

    describe('when the user is not logged in', () => {
      beforeEach(() => {
        mockIsLoggedIn.mockResolvedValueOnce(false)
      })

      it('should throw an error', async () => {
        await expect(connector.connect()).rejects.toThrow('Magic: User is not logged in')
      })
    })

    describe('when no accounts are found', () => {
      beforeEach(() => {
        mockIsLoggedIn.mockResolvedValueOnce(true)
        mockProvider.request.mockResolvedValueOnce([])
      })

      it('should throw an error', async () => {
        await expect(connector.connect()).rejects.toThrow('Magic: No accounts found')
      })
    })
  })

  describe('when calling disconnect', () => {
    beforeEach(async () => {
      mockIsLoggedIn.mockResolvedValueOnce(true)
      mockProvider.request.mockResolvedValueOnce(['0xabc123'])
      await connector.connect()
      jest.clearAllMocks()
      mockLogout.mockResolvedValueOnce(true)
      await connector.disconnect()
    })

    it('should call Magic logout', () => {
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })

    it('should remove the chainId from storage', () => {
      expect(config.storage.removeItem).toHaveBeenCalledWith('magicChainId')
    })
  })

  describe('when calling getAccounts', () => {
    describe('when connected', () => {
      let accounts: readonly `0x${string}`[]

      beforeEach(async () => {
        mockIsLoggedIn.mockResolvedValueOnce(true)
        mockProvider.request.mockResolvedValueOnce(['0xabc123'])
        await connector.connect()
        mockProvider.request.mockResolvedValueOnce(['0xabc123'])
        accounts = await connector.getAccounts()
      })

      it('should return the accounts', () => {
        expect(accounts).toEqual(['0xabc123'])
      })
    })
  })

  describe('when calling getChainId', () => {
    describe('when there is a saved chainId', () => {
      let chainId: number

      beforeEach(async () => {
        config.storage.getItem.mockResolvedValueOnce(137)
        chainId = await connector.getChainId()
      })

      it('should return the saved chainId', () => {
        expect(chainId).toBe(137)
      })
    })

    describe('when there is no saved chainId', () => {
      let chainId: number

      beforeEach(async () => {
        config.storage.getItem.mockResolvedValueOnce(undefined)
        chainId = await connector.getChainId()
      })

      it('should return the first chain from config', () => {
        expect(chainId).toBe(1)
      })
    })
  })

  describe('when calling getProvider', () => {
    describe('when connected', () => {
      beforeEach(async () => {
        mockIsLoggedIn.mockResolvedValueOnce(true)
        mockProvider.request.mockResolvedValueOnce(['0xabc123'])
        await connector.connect()
      })

      it('should return the provider', async () => {
        const provider = await connector.getProvider()
        expect(provider).toBeDefined()
      })
    })
  })

  describe('when calling isAuthorized', () => {
    describe('when the user is logged in', () => {
      let result: boolean

      beforeEach(async () => {
        config.storage.getItem.mockResolvedValueOnce(1)
        mockIsLoggedIn.mockResolvedValueOnce(true)
        result = await connector.isAuthorized()
      })

      it('should return true', () => {
        expect(result).toBe(true)
      })
    })

    describe('when the user is not logged in', () => {
      let result: boolean

      beforeEach(async () => {
        config.storage.getItem.mockResolvedValueOnce(1)
        mockIsLoggedIn.mockResolvedValueOnce(false)
        result = await connector.isAuthorized()
      })

      it('should return false', () => {
        expect(result).toBe(false)
      })
    })

    describe('when Magic throws an error', () => {
      let result: boolean

      beforeEach(async () => {
        config.storage.getItem.mockResolvedValueOnce(1)
        mockMagicConstructor.mockImplementationOnce(() => {
          throw new Error('Magic error')
        })
        result = await connector.isAuthorized()
      })

      it('should return false', () => {
        expect(result).toBe(false)
      })
    })

    describe('when there is no chainId available', () => {
      let result: boolean

      beforeEach(async () => {
        const noChainConfig: MockConfig = {
          ...config,
          chains: []
        }
        magic({ apiKey: 'pk_test_123' })
        const noChainConnector = connectorFactory(noChainConfig)
        noChainConfig.storage.getItem.mockResolvedValueOnce(undefined)
        result = await noChainConnector.isAuthorized()
      })

      it('should return false', () => {
        expect(result).toBe(false)
      })
    })
  })

  describe('when calling switchChain', () => {
    describe('when the chain is configured and user is logged in', () => {
      let result: { id: number }

      beforeEach(async () => {
        mockIsLoggedIn.mockResolvedValueOnce(true)
        mockProvider.request.mockResolvedValueOnce(['0xabc123'])
        await connector.connect()
        jest.clearAllMocks()
        mockIsLoggedIn.mockResolvedValueOnce(true)
        mockGetProvider.mockResolvedValueOnce(mockProvider)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await connector.switchChain({ chainId: 137 }) as any
      })

      it('should return the chain config', () => {
        expect(result.id).toBe(137)
      })

      it('should emit a change event', () => {
        expect(config.emitter.emit).toHaveBeenCalledWith('change', { chainId: 137 })
      })

      it('should save the new chainId to storage', () => {
        expect(config.storage.setItem).toHaveBeenCalledWith('magicChainId', 137)
      })
    })

    describe('when the chain is not configured', () => {
      it('should throw an error', async () => {
        await expect(connector.switchChain({ chainId: 999 })).rejects.toThrow('Chain 999 not configured')
      })
    })

    describe('when the user is not logged in', () => {
      beforeEach(() => {
        mockIsLoggedIn.mockResolvedValueOnce(true)
        mockProvider.request.mockResolvedValueOnce(['0xabc123'])
      })

      it('should throw an error', async () => {
        await connector.connect()
        mockIsLoggedIn.mockResolvedValueOnce(false)
        await expect(connector.switchChain({ chainId: 137 })).rejects.toThrow('Magic: User is not logged in')
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
    beforeEach(() => {
      connector.onChainChanged('0x89')
    })

    it('should emit a change event with the parsed chainId', () => {
      expect(config.emitter.emit).toHaveBeenCalledWith('change', { chainId: 137 })
    })
  })

  describe('when onDisconnect is triggered', () => {
    beforeEach(() => {
      connector.onDisconnect()
    })

    it('should emit a disconnect event', () => {
      expect(config.emitter.emit).toHaveBeenCalledWith('disconnect')
    })
  })
})
