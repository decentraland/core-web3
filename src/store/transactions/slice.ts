import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Transaction, TransactionStatus, TransactionsState } from './types'

const initialState: TransactionsState = {
  transactions: {},
  pending: []
}

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction(state, action: PayloadAction<Transaction>) {
      const tx = action.payload
      state.transactions[tx.hash] = tx
      if (tx.status === 'pending' && !state.pending.includes(tx.hash)) {
        state.pending.push(tx.hash)
      }
    },
    updateTransaction(state, action: PayloadAction<{ hash: string; status: TransactionStatus; error?: string }>) {
      const { hash, status, error } = action.payload
      const tx = state.transactions[hash]
      if (tx) {
        tx.status = status
        tx.error = error
        if (status !== 'pending') {
          state.pending = state.pending.filter(h => h !== hash)
        }
      }
    },
    removeTransaction(state, action: PayloadAction<string>) {
      const hash = action.payload
      delete state.transactions[hash]
      state.pending = state.pending.filter(h => h !== hash)
    },
    reset() {
      return initialState
    }
  }
})

const { actions: transactionsActions, reducer: transactionsReducer } = transactionsSlice

export { transactionsActions, transactionsReducer }
