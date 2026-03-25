import { renderHook } from '@testing-library/react'
import type { AuthIdentity } from '@dcl/crypto'
import { useAuthIdentity } from './useAuthIdentity'

const mockUseWallet = jest.fn()

jest.mock('./useWallet', () => ({
  useWallet: () => mockUseWallet()
}))

jest.mock('@dcl/single-sign-on-client', () => ({
  localStorageGetIdentity: jest.fn()
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { localStorageGetIdentity } = require('@dcl/single-sign-on-client') as {
  localStorageGetIdentity: jest.Mock
}

describe('useAuthIdentity', () => {
  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`
  const mockIdentity = { authChain: [] } as unknown as AuthIdentity

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWallet.mockReturnValue({ address: null })
  })

  describe('when wallet is not connected', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue({ address: null })
    })

    it('should return undefined identity', () => {
      const { result } = renderHook(() => useAuthIdentity())
      expect(result.current.identity).toBeUndefined()
      expect(result.current.hasValidIdentity).toBe(false)
      expect(result.current.address).toBeUndefined()
    })

    it('should not call localStorageGetIdentity', () => {
      renderHook(() => useAuthIdentity())
      expect(localStorageGetIdentity).not.toHaveBeenCalled()
    })
  })

  describe('when wallet is connected', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue({ address: mockAddress })
    })

    describe('and identity exists in localStorage', () => {
      beforeEach(() => {
        localStorageGetIdentity.mockReturnValue(mockIdentity)
      })

      it('should return the identity', () => {
        const { result } = renderHook(() => useAuthIdentity())
        expect(result.current.identity).toBe(mockIdentity)
        expect(result.current.hasValidIdentity).toBe(true)
      })

      it('should return the wallet address', () => {
        const { result } = renderHook(() => useAuthIdentity())
        expect(result.current.address).toBe(mockAddress)
      })

      it('should call localStorageGetIdentity with lowercase address', () => {
        renderHook(() => useAuthIdentity())
        expect(localStorageGetIdentity).toHaveBeenCalledWith(mockAddress.toLowerCase())
      })
    })

    describe('and identity does not exist in localStorage', () => {
      beforeEach(() => {
        localStorageGetIdentity.mockReturnValue(null)
      })

      it('should return undefined identity', () => {
        const { result } = renderHook(() => useAuthIdentity())
        expect(result.current.identity).toBeUndefined()
        expect(result.current.hasValidIdentity).toBe(false)
      })
    })

    describe('and localStorageGetIdentity throws', () => {
      beforeEach(() => {
        localStorageGetIdentity.mockImplementation(() => {
          throw new Error('localStorage error')
        })
        jest.spyOn(console, 'error').mockImplementation(() => {})
      })

      afterEach(() => {
        jest.restoreAllMocks()
      })

      it('should return undefined identity', () => {
        const { result } = renderHook(() => useAuthIdentity())
        expect(result.current.identity).toBeUndefined()
        expect(result.current.hasValidIdentity).toBe(false)
      })

      it('should log the error', () => {
        renderHook(() => useAuthIdentity())
        expect(console.error).toHaveBeenCalledWith('[useAuthIdentity] Failed to get identity:', expect.any(Error))
      })
    })
  })

  describe('when wallet disconnects', () => {
    it('should clear the identity', () => {
      localStorageGetIdentity.mockReturnValue(mockIdentity)
      mockUseWallet.mockReturnValue({ address: mockAddress })

      const { result, rerender } = renderHook(() => useAuthIdentity())
      expect(result.current.identity).toBe(mockIdentity)

      mockUseWallet.mockReturnValue({ address: null })
      rerender()

      expect(result.current.identity).toBeUndefined()
      expect(result.current.hasValidIdentity).toBe(false)
      expect(result.current.address).toBeUndefined()
    })
  })
})
