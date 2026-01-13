// Transaction state types

type TransactionStatus = 'pending' | 'confirmed' | 'failed'

interface Transaction {
  hash: string
  from: string
  to?: string
  chainId: number
  status: TransactionStatus
  error?: string
  timestamp: number
}

interface TransactionsState {
  transactions: Record<string, Transaction>
  pending: string[]
}

export type { Transaction, TransactionsState, TransactionStatus }
