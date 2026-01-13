import { getChainId, getIsNetworkSwitching, getIsSupportedNetwork, getNetworkError, getNetworkState } from './selectors'
import type { NetworkState } from './types'

describe('network selectors', () => {
  let state: { network: NetworkState }

  beforeEach(() => {
    state = {
      network: {
        chainId: 1,
        isSupportedNetwork: true,
        isNetworkSwitching: false,
        error: null
      }
    }
  })

  describe('when getNetworkState is called', () => {
    it('should return the network state', () => {
      expect(getNetworkState(state)).toEqual(state.network)
    })
  })

  describe('when getChainId is called', () => {
    it('should return the chainId', () => {
      expect(getChainId(state)).toBe(1)
    })
  })

  describe('when getIsSupportedNetwork is called', () => {
    it('should return the isSupportedNetwork value', () => {
      expect(getIsSupportedNetwork(state)).toBe(true)
    })
  })

  describe('when getIsNetworkSwitching is called', () => {
    it('should return the isNetworkSwitching value', () => {
      expect(getIsNetworkSwitching(state)).toBe(false)
    })
  })

  describe('when getNetworkError is called', () => {
    describe('and there is no error', () => {
      it('should return null', () => {
        expect(getNetworkError(state)).toBeNull()
      })
    })

    describe('and there is an error', () => {
      beforeEach(() => {
        state.network.error = 'Network switch failed'
      })

      it('should return the error message', () => {
        expect(getNetworkError(state)).toBe('Network switch failed')
      })
    })
  })
})
