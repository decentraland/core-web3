import { renderHook } from '@testing-library/react'

const mockUseSelector = jest.fn()
const mockWagmiConnect = jest.fn()
const mockWagmiDisconnect = jest.fn()
const mockConnectors = [
  { uid: '1', name: 'MetaMask' },
  { uid: '2', name: 'WalletConnect' }
]

jest.mock('react-redux', () => ({
  useSelector: (selector: Function) => mockUseSelector(selector)
}))

jest.mock('wagmi', () => ({
  useConnect: () => ({
    connect: mockWagmiConnect,
    connectors: mockConnectors,
    isPending: false
  }),
  useDisconnect: () => ({
    disconnect: mockWagmiDisconnect,
    isPending: false
  })
}))

import { useWallet } from './useWallet'

describe('useWallet', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when the wallet is connected', () => {
    beforeEach(() => {
      mockUseSelector.mockImplementation((selector: Function) => {
        const selectorStr = selector.toString()
        if (selectorStr.includes('address') || selectorStr.includes('Address')) return '0xabc123'
        if (selectorStr.includes('isConnected') || selectorStr.includes('Connected')) return true
        if (selectorStr.includes('isConnecting') || selectorStr.includes('Connecting')) return false
        if (selectorStr.includes('isDisconnecting') || selectorStr.includes('Disconnecting')) return false
        if (selectorStr.includes('error') || selectorStr.includes('Error')) return null
        return null
      })
    })

    it('should return the address', () => {
      const { result } = renderHook(() => useWallet())
      expect(result.current.address).toBe('0xabc123')
    })

    it('should return isConnected as true', () => {
      const { result } = renderHook(() => useWallet())
      expect(result.current.isConnected).toBe(true)
    })

    it('should return available connectors', () => {
      const { result } = renderHook(() => useWallet())
      expect(result.current.connectors).toEqual(mockConnectors)
    })
  })

  describe('when the wallet is not connected', () => {
    beforeEach(() => {
      mockUseSelector.mockImplementation((selector: Function) => {
        const selectorStr = selector.toString()
        if (selectorStr.includes('address') || selectorStr.includes('Address')) return null
        if (selectorStr.includes('isConnected') || selectorStr.includes('Connected')) return false
        if (selectorStr.includes('isConnecting') || selectorStr.includes('Connecting')) return false
        if (selectorStr.includes('isDisconnecting') || selectorStr.includes('Disconnecting')) return false
        if (selectorStr.includes('error') || selectorStr.includes('Error')) return null
        return null
      })
    })

    it('should return null address', () => {
      const { result } = renderHook(() => useWallet())
      expect(result.current.address).toBeNull()
    })

    it('should return isConnected as false', () => {
      const { result } = renderHook(() => useWallet())
      expect(result.current.isConnected).toBe(false)
    })
  })

  describe('when connect is called', () => {
    beforeEach(() => {
      mockUseSelector.mockReturnValue(null)
    })

    it('should call wagmiConnect with the connector', () => {
      const { result } = renderHook(() => useWallet())
      result.current.connect(mockConnectors[0] as never)
      expect(mockWagmiConnect).toHaveBeenCalledWith({ connector: mockConnectors[0] })
    })
  })

  describe('when disconnect is called', () => {
    beforeEach(() => {
      mockUseSelector.mockReturnValue(null)
    })

    it('should call wagmiDisconnect', () => {
      const { result } = renderHook(() => useWallet())
      result.current.disconnect()
      expect(mockWagmiDisconnect).toHaveBeenCalledTimes(1)
    })
  })

  describe('when connecting is in progress via Redux', () => {
    beforeEach(() => {
      mockUseSelector.mockImplementation((selector: Function) => {
        const selectorStr = selector.toString()
        if (selectorStr.includes('address') || selectorStr.includes('Address')) return null
        if (selectorStr.includes('isConnected') || selectorStr.includes('Connected')) return false
        if (selectorStr.includes('isConnecting') || selectorStr.includes('Connecting')) return true
        if (selectorStr.includes('isDisconnecting') || selectorStr.includes('Disconnecting')) return false
        if (selectorStr.includes('error') || selectorStr.includes('Error')) return null
        return null
      })
    })

    it('should return isConnecting as true', () => {
      const { result } = renderHook(() => useWallet())
      expect(result.current.isConnecting).toBe(true)
    })
  })

  describe('when there is a wallet error', () => {
    let errorMessage: string

    beforeEach(() => {
      errorMessage = 'Connection rejected'
      mockUseSelector.mockImplementation((selector: Function) => {
        const selectorStr = selector.toString()
        if (selectorStr.includes('address') || selectorStr.includes('Address')) return null
        if (selectorStr.includes('isConnected') || selectorStr.includes('Connected')) return false
        if (selectorStr.includes('isConnecting') || selectorStr.includes('Connecting')) return false
        if (selectorStr.includes('isDisconnecting') || selectorStr.includes('Disconnecting')) return false
        if (selectorStr.includes('error') || selectorStr.includes('Error')) return errorMessage
        return null
      })
    })

    it('should return the error message', () => {
      const { result } = renderHook(() => useWallet())
      expect(result.current.error).toBe(errorMessage)
    })
  })
})
