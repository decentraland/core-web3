import { renderHook } from '@testing-library/react'

const mockUseSelector = jest.fn()
const mockSwitchChain = jest.fn()

jest.mock('react-redux', () => ({
  useSelector: (selector: Function) => mockUseSelector(selector)
}))

jest.mock('wagmi', () => ({
  useSwitchChain: () => ({
    switchChain: mockSwitchChain,
    chains: [{ id: 1, name: 'Ethereum' }, { id: 137, name: 'Polygon' }],
    isPending: false
  })
}))

import { useNetwork } from './useNetwork'

describe('useNetwork', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when connected to a supported network', () => {
    beforeEach(() => {
      mockUseSelector.mockImplementation((selector: Function) => {
        const selectorStr = selector.toString()
        if (selectorStr.includes('chainId')) return 1
        if (selectorStr.includes('Supported')) return true
        if (selectorStr.includes('Switching')) return false
        if (selectorStr.includes('error') || selectorStr.includes('Error')) return null
        return null
      })
    })

    it('should return the current chainId', () => {
      const { result } = renderHook(() => useNetwork())
      expect(result.current.chainId).toBe(1)
    })

    it('should return isSupportedNetwork as true', () => {
      const { result } = renderHook(() => useNetwork())
      expect(result.current.isSupportedNetwork).toBe(true)
    })

    it('should return isSwitching as false', () => {
      const { result } = renderHook(() => useNetwork())
      expect(result.current.isSwitching).toBe(false)
    })

    it('should return available chains', () => {
      const { result } = renderHook(() => useNetwork())
      expect(result.current.chains).toHaveLength(2)
    })

    it('should return null error', () => {
      const { result } = renderHook(() => useNetwork())
      expect(result.current.error).toBeNull()
    })
  })

  describe('when switching network', () => {
    beforeEach(() => {
      mockUseSelector.mockImplementation((selector: Function) => {
        const selectorStr = selector.toString()
        if (selectorStr.includes('chainId')) return 1
        if (selectorStr.includes('Supported')) return true
        if (selectorStr.includes('Switching')) return true
        if (selectorStr.includes('error') || selectorStr.includes('Error')) return null
        return null
      })
    })

    it('should return isSwitching as true', () => {
      const { result } = renderHook(() => useNetwork())
      expect(result.current.isSwitching).toBe(true)
    })
  })

  describe('when switchNetwork is called', () => {
    beforeEach(() => {
      mockUseSelector.mockReturnValue(null)
    })

    it('should call switchChain with the target chainId', () => {
      const { result } = renderHook(() => useNetwork())
      result.current.switchNetwork(137)
      expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: 137 })
    })
  })

  describe('when there is a network error', () => {
    let errorMessage: string

    beforeEach(() => {
      errorMessage = 'Network switch failed'
      mockUseSelector.mockImplementation((selector: Function) => {
        const selectorStr = selector.toString()
        if (selectorStr.includes('chainId')) return 1
        if (selectorStr.includes('Supported')) return false
        if (selectorStr.includes('Switching')) return false
        if (selectorStr.includes('error') || selectorStr.includes('Error')) return errorMessage
        return null
      })
    })

    it('should return the error message', () => {
      const { result } = renderHook(() => useNetwork())
      expect(result.current.error).toBe(errorMessage)
    })
  })
})
