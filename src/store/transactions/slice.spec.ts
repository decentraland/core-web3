import { transactionsActions, transactionsReducer } from './slice'
import type { Transaction, TransactionsState } from './types'

describe('transactionsSlice', () => {
  let initialState: TransactionsState

  beforeEach(() => {
    initialState = {
      transactions: {},
      pending: []
    }
  })

  describe('when addTransaction is dispatched', () => {
    let transaction: Transaction
    let confirmedTx: Transaction

    beforeEach(() => {
      transaction = {
        hash: '0xabc123',
        from: '0x1234',
        to: '0x5678',
        chainId: 1,
        status: 'pending',
        timestamp: Date.now()
      }
      confirmedTx = { ...transaction, status: 'confirmed' as const }
    })

    it('should add the transaction to the transactions record', () => {
      const state = transactionsReducer(initialState, transactionsActions.addTransaction(transaction))
      expect(state.transactions[transaction.hash]).toEqual(transaction)
    })

    it('should add the hash to the pending list when status is pending', () => {
      const state = transactionsReducer(initialState, transactionsActions.addTransaction(transaction))
      expect(state.pending).toContain(transaction.hash)
    })

    it('should not add to pending list when status is not pending', () => {
      const state = transactionsReducer(initialState, transactionsActions.addTransaction(confirmedTx))
      expect(state.pending).not.toContain(confirmedTx.hash)
    })
  })

  describe('when updateTransaction is dispatched', () => {
    let existingTransaction: Transaction

    beforeEach(() => {
      existingTransaction = {
        hash: '0xabc123',
        from: '0x1234',
        to: '0x5678',
        chainId: 1,
        status: 'pending',
        timestamp: Date.now()
      }
      initialState = {
        transactions: { [existingTransaction.hash]: existingTransaction },
        pending: [existingTransaction.hash]
      }
    })

    describe('and transaction status changes to confirmed', () => {
      it('should update the transaction status', () => {
        const state = transactionsReducer(
          initialState,
          transactionsActions.updateTransaction({ hash: existingTransaction.hash, status: 'confirmed' })
        )
        expect(state.transactions[existingTransaction.hash].status).toBe('confirmed')
      })

      it('should remove the hash from pending list', () => {
        const state = transactionsReducer(
          initialState,
          transactionsActions.updateTransaction({ hash: existingTransaction.hash, status: 'confirmed' })
        )
        expect(state.pending).not.toContain(existingTransaction.hash)
      })
    })

    describe('and transaction status changes to failed', () => {
      it('should update the transaction status', () => {
        const state = transactionsReducer(
          initialState,
          transactionsActions.updateTransaction({ hash: existingTransaction.hash, status: 'failed' })
        )
        expect(state.transactions[existingTransaction.hash].status).toBe('failed')
      })

      it('should remove the hash from pending list', () => {
        const state = transactionsReducer(
          initialState,
          transactionsActions.updateTransaction({ hash: existingTransaction.hash, status: 'failed' })
        )
        expect(state.pending).not.toContain(existingTransaction.hash)
      })
    })

    describe('and transaction does not exist', () => {
      it('should not modify the state', () => {
        const state = transactionsReducer(
          initialState,
          transactionsActions.updateTransaction({ hash: '0xnonexistent', status: 'confirmed' })
        )
        expect(state).toEqual(initialState)
      })
    })
  })

  describe('when removeTransaction is dispatched', () => {
    let existingTransaction: Transaction

    beforeEach(() => {
      existingTransaction = {
        hash: '0xabc123',
        from: '0x1234',
        to: '0x5678',
        chainId: 1,
        status: 'pending',
        timestamp: Date.now()
      }
      initialState = {
        transactions: { [existingTransaction.hash]: existingTransaction },
        pending: [existingTransaction.hash]
      }
    })

    it('should remove the transaction from the transactions record', () => {
      const state = transactionsReducer(initialState, transactionsActions.removeTransaction(existingTransaction.hash))
      expect(state.transactions[existingTransaction.hash]).toBeUndefined()
    })

    it('should remove the hash from the pending list', () => {
      const state = transactionsReducer(initialState, transactionsActions.removeTransaction(existingTransaction.hash))
      expect(state.pending).not.toContain(existingTransaction.hash)
    })
  })

  describe('when reset is dispatched', () => {
    let txHash: string
    let modifiedState: TransactionsState

    beforeEach(() => {
      txHash = '0x123'
      modifiedState = {
        transactions: {
          [txHash]: {
            hash: txHash,
            from: '0x1234',
            to: '0x5678',
            chainId: 1,
            status: 'pending',
            timestamp: Date.now()
          }
        },
        pending: [txHash]
      }
    })

    it('should return the initial state', () => {
      const state = transactionsReducer(modifiedState, transactionsActions.reset())
      expect(state).toEqual({ transactions: {}, pending: [] })
    })
  })
})
