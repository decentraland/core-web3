import { configureStore } from '@reduxjs/toolkit'
import { createLazyStoreEnhancer } from './createLazyStoreEnhancer'

describe('createLazyStoreEnhancer', () => {
  describe('when called for the first time', () => {
    let store: ReturnType<typeof configureStore>
    let staticReducers: Record<string, () => Record<string, unknown>>

    beforeEach(() => {
      staticReducers = {
        app: (state = { ready: true }) => state,
      }
      store = configureStore({ reducer: staticReducers })
    })

    it('should inject web3 reducers into the store', () => {
      const inject = createLazyStoreEnhancer(store, staticReducers)
      inject()
      const state = store.getState() as Record<string, unknown>
      expect(state).toHaveProperty('wallet')
      expect(state).toHaveProperty('network')
      expect(state).toHaveProperty('transactions')
    })

    it('should preserve existing state', () => {
      const inject = createLazyStoreEnhancer(store, staticReducers)
      inject()
      const state = store.getState() as Record<string, unknown>
      expect(state).toHaveProperty('app', { ready: true })
    })
  })

  describe('when called multiple times', () => {
    let store: ReturnType<typeof configureStore>
    let staticReducers: Record<string, () => Record<string, unknown>>
    let replaceReducerSpy: jest.SpyInstance

    beforeEach(() => {
      staticReducers = {
        app: (state = {}) => state,
      }
      store = configureStore({ reducer: staticReducers })
      replaceReducerSpy = jest.spyOn(store, 'replaceReducer')
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should only call replaceReducer once', () => {
      const inject = createLazyStoreEnhancer(store, staticReducers)
      inject()
      inject()
      inject()
      expect(replaceReducerSpy).toHaveBeenCalledTimes(1)
    })
  })
})
