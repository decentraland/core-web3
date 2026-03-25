import { ChainId } from '@dcl/schemas'
import { getChainById, isSupportedChain, productionChains, supportedChains, testChains } from './chains'

describe('chains', () => {
  describe('when checking productionChains', () => {
    it('should contain Ethereum Mainnet and Polygon', () => {
      const chainIds = productionChains.map(c => c.id)
      expect(chainIds).toContain(ChainId.ETHEREUM_MAINNET)
      expect(chainIds).toContain(ChainId.MATIC_MAINNET)
    })

    it('should have exactly 2 chains', () => {
      expect(productionChains).toHaveLength(2)
    })
  })

  describe('when checking testChains', () => {
    it('should contain Sepolia and Polygon Amoy', () => {
      const chainIds = testChains.map(c => c.id)
      expect(chainIds).toContain(ChainId.ETHEREUM_SEPOLIA)
      expect(chainIds).toContain(ChainId.MATIC_AMOY)
    })

    it('should have exactly 2 chains', () => {
      expect(testChains).toHaveLength(2)
    })
  })

  describe('when checking supportedChains', () => {
    it('should contain all production and test chains', () => {
      expect(supportedChains).toHaveLength(productionChains.length + testChains.length)
    })
  })

  describe('when calling isSupportedChain', () => {
    describe('and the chain ID is a supported production chain', () => {
      it('should return true for Ethereum Mainnet', () => {
        expect(isSupportedChain(ChainId.ETHEREUM_MAINNET)).toBe(true)
      })

      it('should return true for Polygon Mainnet', () => {
        expect(isSupportedChain(ChainId.MATIC_MAINNET)).toBe(true)
      })
    })

    describe('and the chain ID is a supported test chain', () => {
      it('should return true for Sepolia', () => {
        expect(isSupportedChain(ChainId.ETHEREUM_SEPOLIA)).toBe(true)
      })

      it('should return true for Polygon Amoy', () => {
        expect(isSupportedChain(ChainId.MATIC_AMOY)).toBe(true)
      })
    })

    describe('and the chain ID is not supported', () => {
      it('should return false', () => {
        expect(isSupportedChain(999999)).toBe(false)
      })
    })
  })

  describe('when calling getChainById', () => {
    describe('and the chain ID exists', () => {
      it('should return the chain configuration for Ethereum Mainnet', () => {
        const chain = getChainById(ChainId.ETHEREUM_MAINNET)
        expect(chain).toBeDefined()
        expect(chain!.id).toBe(ChainId.ETHEREUM_MAINNET)
      })

      it('should return the chain configuration for Polygon Mainnet', () => {
        const chain = getChainById(ChainId.MATIC_MAINNET)
        expect(chain).toBeDefined()
        expect(chain!.id).toBe(ChainId.MATIC_MAINNET)
      })
    })

    describe('and the chain ID does not exist', () => {
      it('should return undefined', () => {
        expect(getChainById(999999)).toBeUndefined()
      })
    })
  })
})
