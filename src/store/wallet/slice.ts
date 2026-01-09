import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { WalletState } from './types'

const initialState: WalletState = {
  address: null,
  isConnected: false,
  isConnecting: false,
  isDisconnecting: false,
  error: null
}

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setAccount(state, action: PayloadAction<string | null>) {
      state.address = action.payload
      state.isConnected = action.payload !== null
      state.isConnecting = false
      state.error = null
    },
    setConnecting(state, action: PayloadAction<boolean>) {
      state.isConnecting = action.payload
      if (action.payload) {
        state.error = null
      }
    },
    setDisconnecting(state, action: PayloadAction<boolean>) {
      state.isDisconnecting = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
      state.isConnecting = false
      state.isDisconnecting = false
    },
    reset() {
      return initialState
    }
  }
})

const { actions: walletActions, reducer: walletReducer } = walletSlice

export { walletActions, walletReducer }
