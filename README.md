# @dcl/web3-core

A shared Web3 connectivity layer for Decentraland dApps, built with wagmi and Redux Toolkit.

## Objective

Provide a common foundation for Web3 connectivity across Decentraland dApps, including wallet connection, account/network synchronization, transaction helpers, and reusable hooks.

## What's Included

- **wagmi Configuration**: Standard chain configs, transports, and metadata for Decentraland dApps
- **Shared Providers**: `Web3CoreProvider` and `Web3SyncProvider` for seamless integration
- **Redux Toolkit Slices**:
  - `wallet` - Account state management (address, connection status, etc.)
  - `network` - Chain/network state and switching
  - `transactions` - Transaction tracking and status management
- **High-level Hooks**: `useWallet`, `useNetwork`, `useTokenBalance`, and more
- **Identity Helpers**: Integration with Decentraland identity/autologin (if applicable)

## What's NOT Included

- UI components (buttons, modals, etc.)
- Text/copy content
- dApp-specific feature logic
- Dependencies on app-specific modules (e.g., social-specific code)

## Installation

```bash
npm install @dcl/web3-core
```

## Peer Dependencies

This library expects the following peer dependencies to be installed in your dApp:

- `react` (^18.0.0)
- `react-dom` (^18.0.0)
- `@reduxjs/toolkit` (^2.0.0)
- `react-redux` (^9.0.0)
- `wagmi` (^2.0.0)
- `viem` (^2.0.0)
- `@tanstack/react-query` (^5.0.0)

## Usage

### 1. Add reducers to your store

```typescript
import { configureStore } from '@reduxjs/toolkit'
import { walletReducer, networkReducer, transactionsReducer } from '@dcl/web3-core'

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    network: networkReducer,
    transactions: transactionsReducer,
    // ... your other reducers
  },
})
```

### 2. Wrap your app with providers

```typescript
import { Web3CoreProvider, Web3SyncProvider } from '@dcl/web3-core'

function App() {
  return (
    <Web3CoreProvider>
      <Web3SyncProvider>
        {/* Your app */}
      </Web3SyncProvider>
    </Web3CoreProvider>
  )
}
```

### 3. Use hooks in your components

```typescript
import { useWallet, useNetwork, useTokenBalance } from '@dcl/web3-core'

function WalletInfo() {
  const { address, isConnected, connect, disconnect } = useWallet()
  const { chainId, isSupportedNetwork } = useNetwork()
  const { balance } = useTokenBalance()

  // ...
}
```

## License

Apache-2.0

