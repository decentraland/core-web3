import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { isSupportedChain } from '../../config/chains'
import type { NetworkState } from './types'

const initialState: NetworkState = {
  chainId: null,
  isSupportedNetwork: false,
  isNetworkSwitching: false,
  error: null
}

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setChain(state, action: PayloadAction<number | null>) {
      state.chainId = action.payload
      state.isSupportedNetwork = action.payload !== null && isSupportedChain(action.payload)
      state.isNetworkSwitching = false
      state.error = null
    },
    setSwitching(state, action: PayloadAction<boolean>) {
      state.isNetworkSwitching = action.payload
      if (action.payload) {
        state.error = null
      }
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
      state.isNetworkSwitching = false
    },
    reset() {
      return initialState
    }
  }
})

const { actions: networkActions, reducer: networkReducer } = networkSlice

export { networkActions, networkReducer }
