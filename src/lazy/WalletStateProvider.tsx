import { type PropsWithChildren, createContext, useCallback, useMemo, useState } from 'react'

/**
 * Lightweight wallet state that mirrors the shape of useWallet() but without
 * importing wagmi. Components that only need to read wallet state (address,
 * isConnected) can use this instead, keeping wagmi out of the critical path.
 */
interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  isDisconnecting: boolean
  disconnect: () => void
}

const DEFAULT_STATE: WalletState = {
  address: null,
  isConnected: false,
  isConnecting: false,
  isDisconnecting: false,
  disconnect: () => {},
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const WalletStateContext = createContext<WalletState>(DEFAULT_STATE)
// eslint-disable-next-line @typescript-eslint/naming-convention
const WalletStateSetterContext = createContext<(state: WalletState) => void>(() => {})

/**
 * Reads wagmi v2.x persisted store from localStorage to derive initial wallet
 * state without importing wagmi at all. This lets the UI show the correct
 * signed-in state on first paint while the heavy wagmi bundle loads in the
 * background.
 *
 * wagmi v2 stores its state under the key `wagmi.store` as JSON with the
 * following shape:
 * ```
 * { state: { connections: { value: [[id, { accounts: [addr, ...] }], ...] }, current: string } }
 * ```
 *
 * If wagmi upgrades change this format, this function safely returns
 * disconnected state and the real providers will correct it once loaded.
 */
function readWagmiLocalStorage(): Pick<WalletState, 'address' | 'isConnected'> {
  try {
    const raw = localStorage.getItem('wagmi.store')
    if (!raw) return { address: null, isConnected: false }

    const parsed = JSON.parse(raw) as {
      state?: {
        connections?: { value?: Array<[string, { accounts?: string[] }]> }
        current?: string
      }
    }
    const connections = parsed?.state?.connections?.value
    const current = parsed?.state?.current

    if (!current || !connections?.length) return { address: null, isConnected: false }

    const activeConnection = connections.find(([id]) => id === current)
    const address = activeConnection?.[1]?.accounts?.[0] ?? null

    return { address, isConnected: Boolean(address) }
  } catch {
    return { address: null, isConnected: false }
  }
}

/**
 * Lightweight provider that exposes wallet state via context without importing
 * wagmi or any heavy Web3 dependency. On mount it reads wagmi's localStorage
 * to hydrate the initial state so the UI can render correctly before the lazy
 * Web3 providers finish loading.
 *
 * Pair with {@link Web3LazyProvider} which updates this context once the real
 * wagmi providers are ready.
 *
 * @example
 * ```tsx
 * <Provider store={store}>
 *   <WalletStateProvider>
 *     <Web3LazyProvider config={config}>
 *       <App />
 *     </Web3LazyProvider>
 *   </WalletStateProvider>
 * </Provider>
 * ```
 */
function WalletStateProvider({ children }: PropsWithChildren) {
  const initial = useMemo(() => readWagmiLocalStorage(), [])
  const [state, setState] = useState<WalletState>(() => ({
    ...DEFAULT_STATE,
    ...initial,
  }))

  const setter = useCallback((next: WalletState) => setState(next), [])

  return (
    <WalletStateContext.Provider value={state}>
      <WalletStateSetterContext.Provider value={setter}>
        {children}
      </WalletStateSetterContext.Provider>
    </WalletStateContext.Provider>
  )
}

export { WalletStateContext, WalletStateProvider, WalletStateSetterContext }
export type { WalletState }
