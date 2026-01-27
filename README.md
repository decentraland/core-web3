# @dcl/web3-core

[![Coverage Status](https://coveralls.io/repos/github/decentraland/core-web3/badge.svg)](https://coveralls.io/github/decentraland/core-web3)

A shared Web3 connectivity layer for Decentraland dApps, built with wagmi and Redux Toolkit.

## Objective

Provide a common foundation for Web3 connectivity across Decentraland dApps, including wallet connection, account/network synchronization, transaction helpers, and reusable hooks.

## What's Included

- **wagmi Configuration**: Standard chain configs, transports, and metadata for Decentraland dApps
- **Custom Connectors**:
  - `magic` - Social login (Google, Discord, etc.) via auth.decentraland.org
- **Shared Providers**: `Web3CoreProvider` and `Web3SyncProvider` for seamless integration
- **Redux Toolkit Slices**:
  - `wallet` - Account state management (address, connection status, etc.)
  - `network` - Chain/network state and switching
  - `transactions` - Transaction tracking and status management
- **High-level Hooks**: `useWallet`, `useNetwork`, `useTokenBalance`

## What's NOT Included

- UI components (buttons, modals, etc.)
- Text/copy content
- dApp-specific feature logic

## Supported Chains

| Chain | Chain ID | Environment |
|-------|----------|-------------|
| Ethereum Mainnet | 1 | Production |
| Polygon | 137 | Production |
| Sepolia | 11155111 | Test |
| Polygon Amoy | 80002 | Test |

## Installation

```bash
npm install @dcl/web3-core
```

## Peer Dependencies

This library expects the following peer dependencies to be installed in your dApp:

```json
{
  "@dcl/schemas": "^22.0.0",
  "@reduxjs/toolkit": "^2.5.0",
  "@tanstack/react-query": "^5.62.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "react-redux": "^9.2.0",
  "viem": "^2.21.0",
  "wagmi": "^2.14.0"
}
```

### Optional (for Magic connector)

`magic-sdk` is an optional peer dependency. Install it only when using the Magic connector for social login:

```bash
npm install magic-sdk @magic-ext/oauth2
```

## Usage

### 1. Create wagmi config

```typescript
import { createWeb3CoreConfig, magic } from '@dcl/web3-core'

// Basic config with default connectors (injected, WalletConnect, Coinbase)
const config = createWeb3CoreConfig({
  walletConnectProjectId: 'your-project-id',
  appMetadata: {
    name: 'My Decentraland App',
    description: 'An awesome dApp',
    url: 'https://myapp.decentraland.org',
  },
})

// With Magic connector for social login
const configWithMagic = createWeb3CoreConfig({
  walletConnectProjectId: 'your-project-id',
  additionalConnectors: [
    magic({ apiKey: 'pk_live_YOUR_MAGIC_KEY' }),
  ],
})
```

### 2. Add reducers to your Redux store

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

### 3. Wrap your app with providers

```tsx
import { Provider } from 'react-redux'
import { Web3CoreProvider, Web3SyncProvider } from '@dcl/web3-core'
import { store } from './store'
import { config } from './config'

function App() {
  return (
    <Provider store={store}>
      <Web3CoreProvider config={config}>
        <Web3SyncProvider>
          {/* Your app */}
        </Web3SyncProvider>
      </Web3CoreProvider>
    </Provider>
  )
}
```

### 4. Use hooks in your components

```tsx
import { useWallet, useNetwork, useTokenBalance } from '@dcl/web3-core'

function WalletButton() {
  const { address, isConnected, isConnecting, connect, disconnect, connectors } = useWallet()
  const { chainId, isSupportedNetwork, switchNetwork, chains } = useNetwork()
  const { balance, symbol } = useTokenBalance()

  if (isConnecting) {
    return <button disabled>Connecting...</button>
  }

  if (isConnected) {
    return (
      <div>
        <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
        <p>Balance: {balance} {symbol}</p>
        <p>Chain: {chainId} {isSupportedNetwork ? '✓' : '(unsupported)'}</p>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    )
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button key={connector.uid} onClick={() => connect(connector)}>
          Connect with {connector.name}
        </button>
      ))}
    </div>
  )
}
```

### 5. Clear wagmi state before auth redirect (optional)

If you redirect users to an external auth flow (e.g. decentraland.org/auth), call `clearWagmiState()` before redirecting. That clears wagmi’s localStorage so that when the user returns, wagmi re-checks wallet authorization instead of restoring a disconnected state.

```typescript
import { clearWagmiState } from '@dcl/web3-core'

function redirectToAuth() {
  clearWagmiState()
  window.location.href = 'https://auth.decentraland.org/...'
}
```

### 6. Track transactions (optional)

```typescript
import { useDispatch } from 'react-redux'
import { transactionsActions } from '@dcl/web3-core'

function useTransactionTracker() {
  const dispatch = useDispatch()

  const trackTransaction = (hash: string, from: string, chainId: number) => {
    dispatch(transactionsActions.addTransaction({
      hash,
      from,
      chainId,
      status: 'pending',
      timestamp: Date.now(),
    }))
  }

  const confirmTransaction = (hash: string) => {
    dispatch(transactionsActions.updateTransaction({
      hash,
      status: 'confirmed',
    }))
  }

  return { trackTransaction, confirmTransaction }
}
```

## API Reference

### Config

- `createWeb3CoreConfig(options)` - Creates a wagmi config with Decentraland defaults
- `clearWagmiState()` - Clears wagmi localStorage state; use before redirecting to auth so that on return wagmi re-checks wallet authorization
- `supportedChains` - Array of supported chain objects
- `isSupportedChain(chainId)` - Check if a chain ID is supported
- `getChainById(chainId)` - Get chain object by ID

### Connectors

- `magic(options)` - Magic connector for social login

### Providers

- `Web3CoreProvider` - Wraps WagmiProvider + QueryClientProvider
- `Web3SyncProvider` - Syncs wagmi state to Redux store

### Hooks

- `useWallet()` - Wallet state and connect/disconnect actions
- `useNetwork()` - Network state and switchNetwork action
- `useTokenBalance(options?)` - Token balance (native or ERC20)

### Redux

- `walletReducer`, `walletActions` - Wallet state management
- `networkReducer`, `networkActions` - Network state management
- `transactionsReducer`, `transactionsActions` - Transaction tracking

## License

Apache-2.0
