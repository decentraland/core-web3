import { type EnhancedStore, Reducer, combineReducers } from '@reduxjs/toolkit'
import { networkReducer } from '../store/network'
import { transactionsReducer } from '../store/transactions'
import { walletReducer } from '../store/wallet'

/**
 * Creates a function that lazily injects the web3 reducers (wallet, network,
 * transactions) into an existing Redux store. Call it once when the heavy Web3
 * bundle has loaded - subsequent calls are no-ops.
 *
 * This keeps the web3 slices out of the initial store setup so that importing
 * the store module doesn't pull in @reduxjs/toolkit's slice definitions from
 * core-web3 eagerly.
 *
 * @param store - The Redux store instance.
 * @param staticReducers - The reducers already configured in the store.
 * @returns A function that injects web3 reducers when called.
 *
 * @example
 * ```ts
 * // store.ts
 * import { configureStore } from '@reduxjs/toolkit'
 * import { createLazyStoreEnhancer } from '@dcl/core-web3/lazy'
 * import { api } from './services/api'
 *
 * const staticReducers = {
 *   [api.reducerPath]: api.reducer,
 * }
 *
 * const store = configureStore({ reducer: staticReducers })
 *
 * const injectWeb3Reducers = createLazyStoreEnhancer(store, staticReducers)
 * export { store, injectWeb3Reducers }
 * ```
 */
function createLazyStoreEnhancer(store: EnhancedStore, staticReducers: Record<string, Reducer>) {
  let injected = false

  return function injectWeb3Reducers(): void {
    if (injected) return
    injected = true

    store.replaceReducer(
      combineReducers({
        ...staticReducers,
        network: networkReducer,
        transactions: transactionsReducer,
        wallet: walletReducer
      })
    )
  }
}

export { createLazyStoreEnhancer }
