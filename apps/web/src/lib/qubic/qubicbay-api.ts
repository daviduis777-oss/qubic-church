/**
 * QubicBay API Client
 * NFT marketplace API for ownership verification and collection stats
 */

import { QUBICBAY_API, API_CONFIG } from '@/config/api'

export interface NFTOwnership {
  nftId: number
  owner: string
  price?: number
  listed: boolean
}

export interface CollectionStats {
  totalNFTs: number
  holders: number
  floorPrice: number
  volume24h: number
  totalTrades: number
}

export interface OwnerNFTs {
  address: string
  nfts: NFTOwnership[]
  count: number
}

/**
 * Simple cache for API responses
 */
class APICache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>()

  get(key: string, ttl: number): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const age = Date.now() - cached.timestamp
    if (age > ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  clear(): void {
    this.cache.clear()
  }
}

/**
 * QubicBay API Client
 * Handles NFT ownership verification and collection statistics
 */
export class QubicBayClient {
  private static instance: QubicBayClient
  private cache = new APICache<unknown>()

  private constructor() {}

  static getInstance(): QubicBayClient {
    if (!QubicBayClient.instance) {
      QubicBayClient.instance = new QubicBayClient()
    }
    return QubicBayClient.instance
  }

  /**
   * Make API call with caching
   */
  private async call<T>(
    endpoint: string,
    cacheTTL: number = API_CONFIG.cacheTime.community
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(endpoint, cacheTTL) as T | null
    if (cached) return cached

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

      const response = await fetch(`${QUBICBAY_API.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = (await response.json()) as T

      // Cache successful response
      this.cache.set(endpoint, data)

      return data
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error('QubicBay API request failed')
    }
  }

  /**
   * Get NFT ownership by ID
   */
  async getNFTOwnership(nftId: number): Promise<NFTOwnership> {
    return this.call<NFTOwnership>(
      QUBICBAY_API.endpoints.nft(nftId),
      API_CONFIG.cacheTime.nftOwner
    )
  }

  /**
   * Get all NFTs owned by an address
   */
  async getOwnerNFTs(address: string): Promise<OwnerNFTs> {
    return this.call<OwnerNFTs>(
      QUBICBAY_API.endpoints.owner(address),
      API_CONFIG.cacheTime.nftOwner
    )
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(): Promise<CollectionStats> {
    return this.call<CollectionStats>(
      QUBICBAY_API.endpoints.stats,
      API_CONFIG.cacheTime.community
    )
  }

  /**
   * Verify NFT ownership (lottery entry requirement)
   */
  async verifyOwnership(address: string, nftId: number): Promise<boolean> {
    try {
      const ownerData = await this.getOwnerNFTs(address)
      return ownerData.nfts.some((nft) => nft.nftId === nftId)
    } catch (error) {
      console.error('Ownership verification failed:', error)
      return false
    }
  }

  /**
   * Get total NFTs sold (for signal unlock check)
   */
  async getNFTsSoldCount(): Promise<number> {
    try {
      const stats = await this.getCollectionStats()
      return stats.totalNFTs - (200 - stats.holders) // Approximate calculation
    } catch (error) {
      console.error('Failed to get NFTs sold count:', error)
      return 0
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear()
  }
}

/**
 * Singleton instance export
 */
export const qubicBay = QubicBayClient.getInstance()
