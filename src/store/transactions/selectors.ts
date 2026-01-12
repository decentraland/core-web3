import type { Transaction, TransactionsState } from './types'

/**
 * Root state type for transactions selectors.
 * Consumer apps should extend this with their full store type.
 */
type RootState = { transactions: TransactionsState }

const getTransactionsState = (state: RootState): TransactionsState => state.transactions

const getAllTransactions = (state: RootState): Record<string, Transaction> => getTransactionsState(state).transactions

const getPendingTransactionHashes = (state: RootState): string[] => getTransactionsState(state).pending

const getTransaction = (state: RootState, hash: string): Transaction | undefined => getAllTransactions(state)[hash]

const getPendingTransactions = (state: RootState): Transaction[] => {
  const transactions = getAllTransactions(state)
  return getPendingTransactionHashes(state)
    .map(hash => transactions[hash])
    .filter((tx): tx is Transaction => tx !== undefined)
}

const hasPendingTransactions = (state: RootState): boolean => getPendingTransactionHashes(state).length > 0

export {
  getAllTransactions,
  getPendingTransactionHashes,
  getPendingTransactions,
  getTransaction,
  getTransactionsState,
  hasPendingTransactions
}
