import { renderHook } from '@testing-library/react'

const mockUseSelector = jest.fn()
const mockUseBalance = jest.fn()

jest.mock('react-redux', () => ({
  useSelector: (selector: Function) => mockUseSelector(selector)
}))

jest.mock('wagmi', () => {
  return {
    useBalance: (...args: unknown[]) => mockUseBalance(...args)
  }
})

import { useTokenBalance } from './useTokenBalance'

describe('useTokenBalance', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when no wallet is connected', () => {
    beforeEach(() => {
      mockUseSelector.mockReturnValue(null)
      mockUseBalance.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn()
      })
    })

    it('should return null balance', () => {
      const { result } = renderHook(() => useTokenBalance())
      expect(result.current.balance).toBeNull()
    })

    it('should return null symbol', () => {
      const { result } = renderHook(() => useTokenBalance())
      expect(result.current.symbol).toBeNull()
    })

    it('should return null decimals', () => {
      const { result } = renderHook(() => useTokenBalance())
      expect(result.current.decimals).toBeNull()
    })

    it('should return null balanceRaw', () => {
      const { result } = renderHook(() => useTokenBalance())
      expect(result.current.balanceRaw).toBeNull()
    })

    it('should pass enabled false to useBalance', () => {
      renderHook(() => useTokenBalance())
      expect(mockUseBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { enabled: false }
        })
      )
    })
  })

  describe('when connected and balance is loaded', () => {
    let mockRefetch: jest.Mock

    beforeEach(() => {
      mockRefetch = jest.fn()
      mockUseSelector.mockReturnValue('0xabc123')
      mockUseBalance.mockReturnValue({
        data: {
          formatted: '1.5',
          value: BigInt(1500000000000000000),
          decimals: 18,
          symbol: 'ETH'
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch
      })
    })

    it('should return the formatted balance', () => {
      const { result } = renderHook(() => useTokenBalance())
      expect(result.current.balance).toBe('1.5')
    })

    it('should return the symbol', () => {
      const { result } = renderHook(() => useTokenBalance())
      expect(result.current.symbol).toBe('ETH')
    })

    it('should return the decimals', () => {
      const { result } = renderHook(() => useTokenBalance())
      expect(result.current.decimals).toBe(18)
    })

    it('should return the raw balance', () => {
      const { result } = renderHook(() => useTokenBalance())
      expect(result.current.balanceRaw).toBe(BigInt(1500000000000000000))
    })

    it('should return the refetch function', () => {
      const { result } = renderHook(() => useTokenBalance())
      expect(result.current.refetch).toBe(mockRefetch)
    })
  })

  describe('when a token address is provided', () => {
    let tokenAddress: `0x${string}`

    beforeEach(() => {
      tokenAddress = '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942'
      mockUseSelector.mockReturnValue('0xabc123')
      mockUseBalance.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: jest.fn()
      })
    })

    it('should pass the token address to useBalance', () => {
      renderHook(() => useTokenBalance({ tokenAddress }))
      expect(mockUseBalance).toHaveBeenCalledWith(
        expect.objectContaining({ token: tokenAddress })
      )
    })
  })

  describe('when an override address is provided', () => {
    let overrideAddress: `0x${string}`

    beforeEach(() => {
      overrideAddress = '0x1111111111111111111111111111111111111111'
      mockUseSelector.mockReturnValue('0xabc123')
      mockUseBalance.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn()
      })
    })

    it('should use the override address instead of the wallet address', () => {
      renderHook(() => useTokenBalance({ address: overrideAddress }))
      expect(mockUseBalance).toHaveBeenCalledWith(
        expect.objectContaining({ address: overrideAddress })
      )
    })
  })

  describe('when balance is loading', () => {
    beforeEach(() => {
      mockUseSelector.mockReturnValue('0xabc123')
      mockUseBalance.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: jest.fn()
      })
    })

    it('should return isLoading as true', () => {
      const { result } = renderHook(() => useTokenBalance())
      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('when there is an error', () => {
    let errorObj: Error

    beforeEach(() => {
      errorObj = new Error('Balance fetch failed')
      mockUseSelector.mockReturnValue('0xabc123')
      mockUseBalance.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: errorObj,
        refetch: jest.fn()
      })
    })

    it('should return isError as true', () => {
      const { result } = renderHook(() => useTokenBalance())
      expect(result.current.isError).toBe(true)
    })

    it('should return the error object', () => {
      const { result } = renderHook(() => useTokenBalance())
      expect(result.current.error).toBe(errorObj)
    })
  })

  describe('when a chainId is provided', () => {
    beforeEach(() => {
      mockUseSelector.mockReturnValue('0xabc123')
      mockUseBalance.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn()
      })
    })

    it('should pass the chainId to useBalance', () => {
      renderHook(() => useTokenBalance({ chainId: 137 }))
      expect(mockUseBalance).toHaveBeenCalledWith(
        expect.objectContaining({ chainId: 137 })
      )
    })
  })
})
