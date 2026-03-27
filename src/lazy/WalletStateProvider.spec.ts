import { readWagmiLocalStorage } from './WalletStateProvider'

describe('readWagmiLocalStorage', () => {
  let originalGetItem: Storage['getItem']

  beforeEach(() => {
    originalGetItem = Storage.prototype.getItem
  })

  afterEach(() => {
    Storage.prototype.getItem = originalGetItem
  })

  describe('when wagmi.store key does not exist', () => {
    beforeEach(() => {
      Storage.prototype.getItem = jest.fn().mockReturnValue(null)
    })

    it('should return disconnected state', () => {
      expect(readWagmiLocalStorage()).toEqual({ address: null, isConnected: false })
    })
  })

  describe('when wagmi.store contains malformed JSON', () => {
    beforeEach(() => {
      Storage.prototype.getItem = jest.fn().mockReturnValue('not valid json')
    })

    it('should return disconnected state', () => {
      expect(readWagmiLocalStorage()).toEqual({ address: null, isConnected: false })
    })
  })

  describe('when wagmi.store has no current connection', () => {
    beforeEach(() => {
      Storage.prototype.getItem = jest
        .fn()
        .mockReturnValue(JSON.stringify({ state: { connections: { value: [] }, current: null } }))
    })

    it('should return disconnected state', () => {
      expect(readWagmiLocalStorage()).toEqual({ address: null, isConnected: false })
    })
  })

  describe('when wagmi.store has empty connections array', () => {
    beforeEach(() => {
      Storage.prototype.getItem = jest
        .fn()
        .mockReturnValue(
          JSON.stringify({ state: { connections: { value: [] }, current: 'conn-1' } })
        )
    })

    it('should return disconnected state', () => {
      expect(readWagmiLocalStorage()).toEqual({ address: null, isConnected: false })
    })
  })

  describe('when wagmi.store has a current connection with no matching entry', () => {
    beforeEach(() => {
      Storage.prototype.getItem = jest.fn().mockReturnValue(
        JSON.stringify({
          state: {
            connections: { value: [['other-conn', { accounts: ['0xabc'] }]] },
            current: 'conn-1',
          },
        })
      )
    })

    it('should return disconnected state', () => {
      expect(readWagmiLocalStorage()).toEqual({ address: null, isConnected: false })
    })
  })

  describe('when wagmi.store has a valid active connection', () => {
    let address: string

    beforeEach(() => {
      address = '0x1234567890abcdef'
      Storage.prototype.getItem = jest.fn().mockReturnValue(
        JSON.stringify({
          state: {
            connections: { value: [['conn-1', { accounts: [address] }]] },
            current: 'conn-1',
          },
        })
      )
    })

    it('should return the connected address', () => {
      expect(readWagmiLocalStorage()).toEqual({ address, isConnected: true })
    })
  })

  describe('when wagmi.store has a connection with empty accounts', () => {
    beforeEach(() => {
      Storage.prototype.getItem = jest.fn().mockReturnValue(
        JSON.stringify({
          state: {
            connections: { value: [['conn-1', { accounts: [] }]] },
            current: 'conn-1',
          },
        })
      )
    })

    it('should return disconnected state', () => {
      expect(readWagmiLocalStorage()).toEqual({ address: null, isConnected: false })
    })
  })

  describe('when wagmi.store has unexpected structure', () => {
    beforeEach(() => {
      Storage.prototype.getItem = jest.fn().mockReturnValue(JSON.stringify({ unexpected: true }))
    })

    it('should return disconnected state', () => {
      expect(readWagmiLocalStorage()).toEqual({ address: null, isConnected: false })
    })
  })
})
