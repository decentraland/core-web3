import { networkActions, networkReducer } from './slice'
import type { NetworkState } from './types'

describe('networkSlice', () => {
  let initialState: NetworkState

  beforeEach(() => {
    initialState = {
      chainId: null,
      isSupportedNetwork: false,
      isNetworkSwitching: false,
      error: null
    }
  })

  describe('when setChain is dispatched', () => {
    describe('and chainId is a supported network', () => {
      let supportedChainId: number
      let switchingState: NetworkState
      let errorState: NetworkState

      beforeEach(() => {
        supportedChainId = 1 // Ethereum mainnet
        switchingState = { ...initialState, isNetworkSwitching: true }
        errorState = { ...initialState, error: 'Previous error' }
      })

      it('should set the chainId', () => {
        const state = networkReducer(initialState, networkActions.setChain(supportedChainId))
        expect(state.chainId).toBe(supportedChainId)
      })

      it('should set isSupportedNetwork to true', () => {
        const state = networkReducer(initialState, networkActions.setChain(supportedChainId))
        expect(state.isSupportedNetwork).toBe(true)
      })

      it('should set isNetworkSwitching to false', () => {
        const state = networkReducer(switchingState, networkActions.setChain(supportedChainId))
        expect(state.isNetworkSwitching).toBe(false)
      })

      it('should clear any error', () => {
        const state = networkReducer(errorState, networkActions.setChain(supportedChainId))
        expect(state.error).toBeNull()
      })
    })

    describe('and chainId is an unsupported network', () => {
      let unsupportedChainId: number

      beforeEach(() => {
        unsupportedChainId = 999999
      })

      it('should set the chainId', () => {
        const state = networkReducer(initialState, networkActions.setChain(unsupportedChainId))
        expect(state.chainId).toBe(unsupportedChainId)
      })

      it('should set isSupportedNetwork to false', () => {
        const state = networkReducer(initialState, networkActions.setChain(unsupportedChainId))
        expect(state.isSupportedNetwork).toBe(false)
      })
    })

    describe('and chainId is null', () => {
      let connectedState: NetworkState

      beforeEach(() => {
        connectedState = { ...initialState, chainId: 1, isSupportedNetwork: true }
      })

      it('should set chainId to null', () => {
        const state = networkReducer(connectedState, networkActions.setChain(null))
        expect(state.chainId).toBeNull()
      })

      it('should set isSupportedNetwork to false', () => {
        const state = networkReducer(connectedState, networkActions.setChain(null))
        expect(state.isSupportedNetwork).toBe(false)
      })
    })
  })

  describe('when setSwitching is dispatched', () => {
    describe('and value is true', () => {
      let errorState: NetworkState

      beforeEach(() => {
        errorState = { ...initialState, error: 'Previous error' }
      })

      it('should set isNetworkSwitching to true', () => {
        const state = networkReducer(initialState, networkActions.setSwitching(true))
        expect(state.isNetworkSwitching).toBe(true)
      })

      it('should clear any error', () => {
        const state = networkReducer(errorState, networkActions.setSwitching(true))
        expect(state.error).toBeNull()
      })
    })

    describe('and value is false', () => {
      let switchingState: NetworkState

      beforeEach(() => {
        switchingState = { ...initialState, isNetworkSwitching: true }
      })

      it('should set isNetworkSwitching to false', () => {
        const state = networkReducer(switchingState, networkActions.setSwitching(false))
        expect(state.isNetworkSwitching).toBe(false)
      })
    })
  })

  describe('when setError is dispatched', () => {
    let errorMessage: string
    let switchingState: NetworkState

    beforeEach(() => {
      errorMessage = 'Network switch failed'
      switchingState = { ...initialState, isNetworkSwitching: true }
    })

    it('should set the error message', () => {
      const state = networkReducer(initialState, networkActions.setError(errorMessage))
      expect(state.error).toBe(errorMessage)
    })

    it('should set isNetworkSwitching to false', () => {
      const state = networkReducer(switchingState, networkActions.setError(errorMessage))
      expect(state.isNetworkSwitching).toBe(false)
    })
  })

  describe('when reset is dispatched', () => {
    let modifiedState: NetworkState

    beforeEach(() => {
      modifiedState = {
        chainId: 1,
        isSupportedNetwork: true,
        isNetworkSwitching: true,
        error: 'Some error'
      }
    })

    it('should return the initial state', () => {
      const state = networkReducer(modifiedState, networkActions.reset())
      expect(state).toEqual(initialState)
    })
  })
})
