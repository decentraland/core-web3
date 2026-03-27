import { render } from '@testing-library/react'

const mockDispatch = jest.fn()
let mockAccountState = {
  address: undefined as string | undefined,
  isConnecting: false,
  isConnected: false,
  isReconnecting: false,
}
let mockChainId = 1

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}))

jest.mock('wagmi', () => ({
  useAccount: () => mockAccountState,
  useChainId: () => mockChainId,
}))

jest.mock('../store/wallet', () => ({
  walletActions: {
    setAccount: (address: string | null) => ({ type: 'wallet/setAccount', payload: address }),
    setConnecting: (value: boolean) => ({ type: 'wallet/setConnecting', payload: value }),
    reset: () => ({ type: 'wallet/reset' }),
  },
}))

jest.mock('../store/network', () => ({
  networkActions: {
    setChain: (chainId: number | null) => ({ type: 'network/setChain', payload: chainId }),
  },
}))

import { Web3SyncProvider } from './Web3SyncProvider'

describe('Web3SyncProvider', () => {
  afterEach(() => {
    jest.clearAllMocks()
    mockAccountState = {
      address: undefined,
      isConnecting: false,
      isConnected: false,
      isReconnecting: false,
    }
    mockChainId = 1
  })

  describe('when an account is connected', () => {
    beforeEach(() => {
      mockAccountState = {
        address: '0xabc123',
        isConnecting: false,
        isConnected: true,
        isReconnecting: false,
      }
      mockChainId = 1
      render(
        <Web3SyncProvider>
          <div>Child</div>
        </Web3SyncProvider>
      )
    })

    it('should dispatch setAccount with the address', () => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'wallet/setAccount',
        payload: '0xabc123',
      })
    })

    it('should dispatch setChain with the chainId', () => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'network/setChain',
        payload: 1,
      })
    })

    it('should dispatch setConnecting with false', () => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'wallet/setConnecting',
        payload: false,
      })
    })
  })

  describe('when no account is connected', () => {
    beforeEach(() => {
      mockAccountState = {
        address: undefined,
        isConnecting: false,
        isConnected: false,
        isReconnecting: false,
      }
      render(
        <Web3SyncProvider>
          <div>Child</div>
        </Web3SyncProvider>
      )
    })

    it('should dispatch reset', () => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'wallet/reset',
      })
    })

    it('should dispatch setChain with null', () => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'network/setChain',
        payload: null,
      })
    })
  })

  describe('when connecting', () => {
    beforeEach(() => {
      mockAccountState = {
        address: undefined,
        isConnecting: true,
        isConnected: false,
        isReconnecting: false,
      }
      render(
        <Web3SyncProvider>
          <div>Child</div>
        </Web3SyncProvider>
      )
    })

    it('should dispatch setConnecting with true', () => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'wallet/setConnecting',
        payload: true,
      })
    })
  })

  describe('when reconnecting', () => {
    beforeEach(() => {
      mockAccountState = {
        address: undefined,
        isConnecting: false,
        isConnected: false,
        isReconnecting: true,
      }
      render(
        <Web3SyncProvider>
          <div>Child</div>
        </Web3SyncProvider>
      )
    })

    it('should dispatch setConnecting with true', () => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'wallet/setConnecting',
        payload: true,
      })
    })
  })

  describe('when rendering children', () => {
    beforeEach(() => {
      mockAccountState = {
        address: undefined,
        isConnecting: false,
        isConnected: false,
        isReconnecting: false,
      }
    })

    it('should render the children', () => {
      const { getByText } = render(
        <Web3SyncProvider>
          <div>Test Content</div>
        </Web3SyncProvider>
      )
      expect(getByText('Test Content')).toBeDefined()
    })
  })
})
