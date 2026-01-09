import type { Transaction, TransactionsState } from './types'

/**
 * Root state type for transactions selectors.
 * Consumer apps should extend this with their full store type.
 */
type RootState = { transactions: TransactionsState }

const getTransactionsState = (state: RootState): TransactionsState => state.transactions

const getAllTransactions = (state: RootState): Record<string, Transaction> => state.transactions.transactions

const getTransaction = (state: RootState, hash: string): Transaction | undefined => state.transactions.transactions[hash]

const getPendingTransactionHashes = (state: RootState): string[] => state.transactions.pending

const getPendingTransactions = (state: RootState): Transaction[] =>
  state.transactions.pending.map(hash => state.transactions.transactions[hash]).filter((tx): tx is Transaction => tx !== undefined)

const hasPendingTransactions = (state: RootState): boolean => state.transactions.pending.length > 0

export {
  getAllTransactions,
  getPendingTransactionHashes,
  getPendingTransactions,
  getTransaction,
  getTransactionsState,
  hasPendingTransactions
}
