import { walletActions, walletReducer } from './slice'
import type { WalletState } from './types'

describe('walletSlice', () => {
  let initialState: WalletState

  beforeEach(() => {
    initialState = {
      address: null,
      isConnected: false,
      isConnecting: false,
      isDisconnecting: false,
      error: null
    }
  })

  describe('when setAccount is dispatched', () => {
    describe('and address is provided', () => {
      let address: string
      let connectingState: WalletState
      let errorState: WalletState

      beforeEach(() => {
        address = '0x1234567890abcdef1234567890abcdef12345678'
        connectingState = { ...initialState, isConnecting: true }
        errorState = { ...initialState, error: 'Previous error' }
      })

      it('should set the address', () => {
        const state = walletReducer(initialState, walletActions.setAccount(address))
        expect(state.address).toBe(address)
      })

      it('should set isConnected to true', () => {
        const state = walletReducer(initialState, walletActions.setAccount(address))
        expect(state.isConnected).toBe(true)
      })

      it('should set isConnecting to false', () => {
        const state = walletReducer(connectingState, walletActions.setAccount(address))
        expect(state.isConnecting).toBe(false)
      })

      it('should clear any error', () => {
        const state = walletReducer(errorState, walletActions.setAccount(address))
        expect(state.error).toBeNull()
      })
    })

    describe('and address is null', () => {
      let connectedState: WalletState

      beforeEach(() => {
        connectedState = { ...initialState, address: '0x123', isConnected: true }
      })

      it('should set the address to null', () => {
        const state = walletReducer(connectedState, walletActions.setAccount(null))
        expect(state.address).toBeNull()
      })

      it('should set isConnected to false', () => {
        const state = walletReducer(connectedState, walletActions.setAccount(null))
        expect(state.isConnected).toBe(false)
      })
    })
  })

  describe('when setConnecting is dispatched', () => {
    describe('and value is true', () => {
      let errorState: WalletState

      beforeEach(() => {
        errorState = { ...initialState, error: 'Previous error' }
      })

      it('should set isConnecting to true', () => {
        const state = walletReducer(initialState, walletActions.setConnecting(true))
        expect(state.isConnecting).toBe(true)
      })

      it('should clear any error', () => {
        const state = walletReducer(errorState, walletActions.setConnecting(true))
        expect(state.error).toBeNull()
      })
    })

    describe('and value is false', () => {
      let connectingState: WalletState

      beforeEach(() => {
        connectingState = { ...initialState, isConnecting: true }
      })

      it('should set isConnecting to false', () => {
        const state = walletReducer(connectingState, walletActions.setConnecting(false))
        expect(state.isConnecting).toBe(false)
      })
    })
  })

  describe('when setDisconnecting is dispatched', () => {
    it('should set isDisconnecting to the provided value', () => {
      const state = walletReducer(initialState, walletActions.setDisconnecting(true))
      expect(state.isDisconnecting).toBe(true)
    })
  })

  describe('when setError is dispatched', () => {
    let errorMessage: string
    let connectingState: WalletState
    let disconnectingState: WalletState

    beforeEach(() => {
      errorMessage = 'Connection failed'
      connectingState = { ...initialState, isConnecting: true }
      disconnectingState = { ...initialState, isDisconnecting: true }
    })

    it('should set the error message', () => {
      const state = walletReducer(initialState, walletActions.setError(errorMessage))
      expect(state.error).toBe(errorMessage)
    })

    it('should set isConnecting to false', () => {
      const state = walletReducer(connectingState, walletActions.setError(errorMessage))
      expect(state.isConnecting).toBe(false)
    })

    it('should set isDisconnecting to false', () => {
      const state = walletReducer(disconnectingState, walletActions.setError(errorMessage))
      expect(state.isDisconnecting).toBe(false)
    })
  })

  describe('when reset is dispatched', () => {
    let modifiedState: WalletState

    beforeEach(() => {
      modifiedState = {
        address: '0x123',
        isConnected: true,
        isConnecting: false,
        isDisconnecting: false,
        error: 'Some error'
      }
    })

    it('should return the initial state', () => {
      const state = walletReducer(modifiedState, walletActions.reset())
      expect(state).toEqual(initialState)
    })
  })
})
