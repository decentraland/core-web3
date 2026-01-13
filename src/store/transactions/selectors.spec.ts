import {
  getAllTransactions,
  getPendingTransactionHashes,
  getPendingTransactions,
  getTransaction,
  getTransactionsState,
  hasPendingTransactions
} from './selectors'
import type { Transaction, TransactionsState } from './types'

describe('transactions selectors', () => {
  let state: { transactions: TransactionsState }
  let pendingTx: Transaction
  let confirmedTx: Transaction

  beforeEach(() => {
    pendingTx = {
      hash: '0xpending',
      from: '0x1234',
      to: '0x5678',
      chainId: 1,
      status: 'pending',
      timestamp: Date.now()
    }
    confirmedTx = {
      hash: '0xconfirmed',
      from: '0x1234',
      to: '0x5678',
      chainId: 1,
      status: 'confirmed',
      timestamp: Date.now()
    }
    state = {
      transactions: {
        transactions: {
          [pendingTx.hash]: pendingTx,
          [confirmedTx.hash]: confirmedTx
        },
        pending: [pendingTx.hash]
      }
    }
  })

  describe('when getTransactionsState is called', () => {
    it('should return the transactions state', () => {
      expect(getTransactionsState(state)).toEqual(state.transactions)
    })
  })

  describe('when getAllTransactions is called', () => {
    it('should return all transactions', () => {
      expect(getAllTransactions(state)).toEqual(state.transactions.transactions)
    })
  })

  describe('when getTransaction is called', () => {
    describe('and the transaction exists', () => {
      it('should return the transaction', () => {
        expect(getTransaction(state, pendingTx.hash)).toEqual(pendingTx)
      })
    })

    describe('and the transaction does not exist', () => {
      it('should return undefined', () => {
        expect(getTransaction(state, '0xnonexistent')).toBeUndefined()
      })
    })
  })

  describe('when getPendingTransactionHashes is called', () => {
    it('should return the pending transaction hashes', () => {
      expect(getPendingTransactionHashes(state)).toEqual([pendingTx.hash])
    })
  })

  describe('when getPendingTransactions is called', () => {
    it('should return the pending transactions', () => {
      expect(getPendingTransactions(state)).toEqual([pendingTx])
    })
  })

  describe('when hasPendingTransactions is called', () => {
    describe('and there are pending transactions', () => {
      it('should return true', () => {
        expect(hasPendingTransactions(state)).toBe(true)
      })
    })

    describe('and there are no pending transactions', () => {
      beforeEach(() => {
        state.transactions.pending = []
      })

      it('should return false', () => {
        expect(hasPendingTransactions(state)).toBe(false)
      })
    })
  })
})
