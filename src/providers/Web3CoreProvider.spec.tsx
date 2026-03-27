import { render, screen } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'

const mockWagmiProvider = jest.fn(({ children }: { children: React.ReactNode }) => <div data-testid="wagmi-provider">{children}</div>)
const mockQueryClientProvider = jest.fn(({ children }: { children: React.ReactNode }) => (
  <div data-testid="query-client-provider">{children}</div>
))

jest.mock('wagmi', () => ({
  WagmiProvider: (props: { children: React.ReactNode }) => mockWagmiProvider(props)
}))

jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn().mockImplementation(() => ({ mount: jest.fn(), unmount: jest.fn() })),
  QueryClientProvider: (props: { children: React.ReactNode; client: unknown }) => mockQueryClientProvider(props)
}))

import { Web3CoreProvider } from './Web3CoreProvider'

describe('Web3CoreProvider', () => {
  let mockConfig: { mock: string }

  beforeEach(() => {
    mockConfig = { mock: 'config' }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when rendered with config and children', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<Web3CoreProvider config={mockConfig as any}><div>Test Child</div></Web3CoreProvider>)
    })

    it('should render the children', () => {
      expect(screen.getByText('Test Child')).toBeDefined()
    })

    it('should wrap children with WagmiProvider', () => {
      expect(mockWagmiProvider).toHaveBeenCalledWith(
        expect.objectContaining({ config: mockConfig })
      )
    })

    it('should wrap children with QueryClientProvider', () => {
      expect(mockQueryClientProvider).toHaveBeenCalled()
    })
  })

  describe('when a custom queryClient is provided', () => {
    let customClient: QueryClient

    beforeEach(() => {
      customClient = new QueryClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<Web3CoreProvider config={mockConfig as any} queryClient={customClient}><div>Child</div></Web3CoreProvider>)
    })

    it('should use the provided queryClient', () => {
      expect(mockQueryClientProvider).toHaveBeenCalledWith(
        expect.objectContaining({ client: customClient })
      )
    })
  })

  describe('when no queryClient is provided', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<Web3CoreProvider config={mockConfig as any}><div>Child</div></Web3CoreProvider>)
    })

    it('should create a default QueryClient', () => {
      expect(mockQueryClientProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          client: expect.anything()
        })
      )
    })
  })
})
