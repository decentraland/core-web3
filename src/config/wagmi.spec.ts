import { ChainId } from '@dcl/schemas'

jest.mock('wagmi', () => ({
  createConfig: jest.fn().mockReturnValue({ mock: 'config' }),
  http: jest.fn().mockReturnValue('http-transport'),
}))

jest.mock('wagmi/connectors', () => ({
  injected: jest.fn().mockReturnValue({ id: 'injected' }),
  walletConnect: jest.fn().mockReturnValue({ id: 'walletConnect' }),
  coinbaseWallet: jest.fn().mockReturnValue({ id: 'coinbaseWallet' }),
}))

jest.mock('./connectors/magic', () => ({
  magic: jest.fn().mockReturnValue({ id: 'magic' }),
}))

import { clearWagmiState, createWeb3CoreConfig } from './wagmi'
import { createConfig, http } from 'wagmi'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'
import { magic } from './connectors/magic'

const mockedCreateConfig = createConfig as jest.Mock
const mockedHttp = http as jest.Mock
const mockedInjected = injected as jest.Mock
const mockedWalletConnect = walletConnect as jest.Mock
const mockedCoinbaseWallet = coinbaseWallet as jest.Mock
const mockedMagic = magic as jest.Mock

describe('wagmi', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when calling createWeb3CoreConfig', () => {
    describe('when called with default options', () => {
      beforeEach(() => {
        createWeb3CoreConfig()
      })

      it('should create a config via wagmi createConfig', () => {
        expect(mockedCreateConfig).toHaveBeenCalledTimes(1)
      })

      it('should enable the injected connector', () => {
        expect(mockedInjected).toHaveBeenCalledTimes(1)
      })

      it('should enable the coinbaseWallet connector', () => {
        expect(mockedCoinbaseWallet).toHaveBeenCalledTimes(1)
      })

      it('should enable walletConnect with the default project ID', () => {
        expect(mockedWalletConnect).toHaveBeenCalledTimes(1)
        expect(mockedWalletConnect).toHaveBeenCalledWith(
          expect.objectContaining({ projectId: '61570c542c2d66c659492e5b24a41522' })
        )
      })

      it('should enable the magic connector with the default dev key', () => {
        expect(mockedMagic).toHaveBeenCalledTimes(1)
        expect(mockedMagic).toHaveBeenCalledWith({ apiKey: 'pk_live_CE856A4938B36648' })
      })
    })

    describe('when walletConnectProjectId is provided', () => {
      let projectId: string

      beforeEach(() => {
        projectId = 'test-project-id'
        createWeb3CoreConfig({ walletConnectProjectId: projectId })
      })

      it('should enable the walletConnect connector', () => {
        expect(mockedWalletConnect).toHaveBeenCalledTimes(1)
      })

      it('should pass the project ID to walletConnect', () => {
        expect(mockedWalletConnect).toHaveBeenCalledWith(expect.objectContaining({ projectId }))
      })
    })

    describe('when environment is prd', () => {
      beforeEach(() => {
        createWeb3CoreConfig({ environment: 'prd' })
      })

      it('should use the production magic key', () => {
        expect(mockedMagic).toHaveBeenCalledWith({ apiKey: 'pk_live_212568025B158355' })
      })
    })

    describe('when magicApiKey is explicitly false', () => {
      beforeEach(() => {
        createWeb3CoreConfig({ magicApiKey: false })
      })

      it('should not enable the magic connector', () => {
        expect(mockedMagic).not.toHaveBeenCalled()
      })
    })

    describe('when magic connector is disabled via connectors option', () => {
      beforeEach(() => {
        createWeb3CoreConfig({ connectors: { magic: false } })
      })

      it('should not enable the magic connector', () => {
        expect(mockedMagic).not.toHaveBeenCalled()
      })
    })

    describe('when connectors are selectively disabled', () => {
      beforeEach(() => {
        createWeb3CoreConfig({
          connectors: {
            injected: false,
            coinbaseWallet: false,
          },
        })
      })

      it('should not enable the injected connector', () => {
        expect(mockedInjected).not.toHaveBeenCalled()
      })

      it('should not enable the coinbaseWallet connector', () => {
        expect(mockedCoinbaseWallet).not.toHaveBeenCalled()
      })
    })

    describe('when additionalConnectors are provided', () => {
      let additionalConnector: jest.Mock

      beforeEach(() => {
        additionalConnector = jest.fn()
        createWeb3CoreConfig({ additionalConnectors: [additionalConnector] })
      })

      it('should include the additional connector in the config', () => {
        const call = mockedCreateConfig.mock.calls[0][0]
        expect(call.connectors).toContain(additionalConnector)
      })
    })

    describe('when custom chains are provided', () => {
      let customChains: readonly [
        {
          id: number
          name: string
          nativeCurrency: { name: string; symbol: string; decimals: number }
          rpcUrls: { default: { http: string[] } }
        },
      ]

      beforeEach(() => {
        customChains = [
          {
            id: 1,
            name: 'Ethereum',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: ['https://eth.example.com'] } },
          },
        ] as const
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createWeb3CoreConfig({ chains: customChains as any })
      })

      it('should pass custom chains to createConfig', () => {
        const call = mockedCreateConfig.mock.calls[0][0]
        expect(call.chains).toBe(customChains)
      })
    })

    describe('when custom transports are provided', () => {
      let customTransport: string

      beforeEach(() => {
        customTransport = 'custom-transport'
        createWeb3CoreConfig({
          transports: { [ChainId.ETHEREUM_MAINNET]: customTransport as never },
        })
      })

      it('should use the custom transport for the specified chain', () => {
        const call = mockedCreateConfig.mock.calls[0][0]
        expect(call.transports[ChainId.ETHEREUM_MAINNET]).toBe(customTransport)
      })
    })

    describe('when appMetadata overrides are provided', () => {
      describe('and a full url is provided', () => {
        beforeEach(() => {
          createWeb3CoreConfig({
            walletConnectProjectId: 'test-id',
            appMetadata: {
              name: 'My App',
              url: 'https://myapp.com',
            },
          })
        })

        it('should pass the custom app name to walletConnect', () => {
          expect(mockedWalletConnect).toHaveBeenCalledWith(
            expect.objectContaining({
              metadata: expect.objectContaining({ name: 'My App' }),
            })
          )
        })

        it('should pass the custom url to walletConnect', () => {
          expect(mockedWalletConnect).toHaveBeenCalledWith(
            expect.objectContaining({
              metadata: expect.objectContaining({ url: 'https://myapp.com' }),
            })
          )
        })
      })

      describe('and a urlPath is provided instead of url', () => {
        beforeEach(() => {
          createWeb3CoreConfig({
            walletConnectProjectId: 'test-id',
            appMetadata: {
              urlPath: '/marketplace',
            },
          })
        })

        it('should build the url from the default base and the path', () => {
          expect(mockedWalletConnect).toHaveBeenCalledWith(
            expect.objectContaining({
              metadata: expect.objectContaining({ url: 'https://decentraland.org/marketplace' }),
            })
          )
        })
      })

      describe('and an empty urlPath is provided', () => {
        beforeEach(() => {
          createWeb3CoreConfig({
            walletConnectProjectId: 'test-id',
            appMetadata: {
              urlPath: '  ',
            },
          })
        })

        it('should use the default base url', () => {
          expect(mockedWalletConnect).toHaveBeenCalledWith(
            expect.objectContaining({
              metadata: expect.objectContaining({ url: 'https://decentraland.org' }),
            })
          )
        })
      })

      describe('and a urlPath without leading slash is provided', () => {
        beforeEach(() => {
          createWeb3CoreConfig({
            walletConnectProjectId: 'test-id',
            appMetadata: {
              urlPath: 'marketplace',
            },
          })
        })

        it('should add the leading slash automatically', () => {
          expect(mockedWalletConnect).toHaveBeenCalledWith(
            expect.objectContaining({
              metadata: expect.objectContaining({ url: 'https://decentraland.org/marketplace' }),
            })
          )
        })
      })
    })

    describe('when appMetadata is not provided', () => {
      beforeEach(() => {
        createWeb3CoreConfig({
          walletConnectProjectId: 'test-id',
        })
      })

      it('should use default app metadata', () => {
        expect(mockedWalletConnect).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({ name: 'Decentraland' }),
          })
        )
      })
    })

    describe('when coinbaseWallet is enabled', () => {
      beforeEach(() => {
        createWeb3CoreConfig({
          appMetadata: { name: 'Test App' },
        })
      })

      it('should pass the app name to coinbaseWallet', () => {
        expect(mockedCoinbaseWallet).toHaveBeenCalledWith(
          expect.objectContaining({ appName: 'Test App' })
        )
      })
    })
  })

  describe('when calling clearWagmiState', () => {
    describe('when localStorage has wagmi keys', () => {
      let originalLocalStorage: Storage

      beforeEach(() => {
        originalLocalStorage = window.localStorage
        const store: Record<string, string> = {
          'wagmi.connected': 'true',
          'wagmi.wallet': 'metamask',
          'other.key': 'value',
        }
        const keys = Object.keys(store)

        Object.defineProperty(window, 'localStorage', {
          value: {
            length: keys.length,
            key: (i: number) => keys[i] ?? null,
            getItem: (k: string) => store[k] ?? null,
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
          },
          writable: true,
          configurable: true,
        })

        clearWagmiState()
      })

      afterEach(() => {
        Object.defineProperty(window, 'localStorage', {
          value: originalLocalStorage,
          writable: true,
          configurable: true,
        })
      })

      it('should remove wagmi-prefixed keys', () => {
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('wagmi.connected')
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('wagmi.wallet')
      })

      it('should not remove non-wagmi keys', () => {
        expect(window.localStorage.removeItem).not.toHaveBeenCalledWith('other.key')
      })
    })

    describe('when window is undefined', () => {
      let originalWindow: typeof globalThis.window

      beforeEach(() => {
        originalWindow = globalThis.window
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(globalThis as any).window = undefined
      })

      afterEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(globalThis as any).window = originalWindow
      })

      it('should not throw', () => {
        expect(() => clearWagmiState()).not.toThrow()
      })
    })
  })
})
