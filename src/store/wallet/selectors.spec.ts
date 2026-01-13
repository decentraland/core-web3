import { getAddress, getIsConnected, getIsConnecting, getIsDisconnecting, getWalletError, getWalletState } from './selectors'
import type { WalletState } from './types'

describe('wallet selectors', () => {
  let state: { wallet: WalletState }

  beforeEach(() => {
    state = {
      wallet: {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        isConnected: true,
        isConnecting: false,
        isDisconnecting: false,
        error: null
      }
    }
  })

  describe('when getWalletState is called', () => {
    it('should return the wallet state', () => {
      expect(getWalletState(state)).toEqual(state.wallet)
    })
  })

  describe('when getAddress is called', () => {
    it('should return the address', () => {
      expect(getAddress(state)).toBe(state.wallet.address)
    })
  })

  describe('when getIsConnected is called', () => {
    it('should return the isConnected value', () => {
      expect(getIsConnected(state)).toBe(true)
    })
  })

  describe('when getIsConnecting is called', () => {
    it('should return the isConnecting value', () => {
      expect(getIsConnecting(state)).toBe(false)
    })
  })

  describe('when getIsDisconnecting is called', () => {
    it('should return the isDisconnecting value', () => {
      expect(getIsDisconnecting(state)).toBe(false)
    })
  })

  describe('when getWalletError is called', () => {
    describe('and there is no error', () => {
      it('should return null', () => {
        expect(getWalletError(state)).toBeNull()
      })
    })

    describe('and there is an error', () => {
      beforeEach(() => {
        state.wallet.error = 'Connection failed'
      })

      it('should return the error message', () => {
        expect(getWalletError(state)).toBe('Connection failed')
      })
    })
  })
})
