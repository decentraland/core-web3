// Transaction state types

export type TransactionStatus = 'pending' | 'success' | 'error'

export interface Transaction {
  hash: string
  status: TransactionStatus
  error?: string
  timestamp: number
}

export interface TransactionsState {
  transactions: Record<string, Transaction>
  pending: string[]
}

