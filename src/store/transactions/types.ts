// Transaction state types

type TransactionStatus = 'pending' | 'success' | 'error'

interface Transaction {
  hash: string
  status: TransactionStatus
  error?: string
  timestamp: number
}

interface TransactionsState {
  transactions: Record<string, Transaction>
  pending: string[]
}

export type { Transaction, TransactionsState, TransactionStatus }
