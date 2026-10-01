/**
 * =============================================================================
 * BLOCKCHAIN API SERVICE
 * =============================================================================
 *
 * Integrates with multiple blockchain data providers:
 * - Blockchair API (primary)
 * - Mempool.space API (fallback)
 *
 * Features:
 * - Balance checking
 * - Transaction history
 * - First/Last seen timestamps
 * - Rate limiting & caching
 * - Automatic fallback
 */

// =============================================================================
// TYPES
// =============================================================================

export interface BlockchainAddressData {
  address: string
  balance: number // BTC
  totalReceived: number // BTC
  totalSent: number // BTC
  txCount: number
  firstSeen: Date | null
  lastSeen: Date | null
  isSpent: boolean
  hasTransactions: boolean

  // Explorer URLs
  explorerUrls: {
    blockchair: string
    blockchain: string
    mempool: string
  }

  // Raw data for debugging
  _raw?: any
  _source: 'blockchair' | 'mempool' | 'cache'
  _fetchedAt: Date
}

export interface BlockchainTransaction {
  txid: string
  blockHeight: number
  timestamp: Date
  value: number // BTC
  type: 'received' | 'sent'
}

export interface BlockchainBatchResult {
  results: Map<string, BlockchainAddressData | Error>
  success: number
  failed: number
  cached: number
  elapsed: number
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Rate limiting (requests per minute)
  RATE_LIMIT: {
    blockchair: 30, // Free tier: 30 req/min
    mempool: 60, // More generous
  },

  // Cache TTL (milliseconds)
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes

  // Batch size
  BATCH_SIZE: 10,

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second

  // API Endpoints
  ENDPOINTS: {
    blockchair: 'https://api.blockchair.com/bitcoin/dashboards/address',
    mempool: 'https://mempool.space/api/address',
  },
}

// =============================================================================
// CACHE
// =============================================================================

interface CacheEntry {
  data: BlockchainAddressData
  timestamp: number
}

class BlockchainCache {
  private cache: Map<string, CacheEntry> = new Map()
  private ttl: number

  constructor(ttl: number = CONFIG.CACHE_TTL) {
    this.ttl = ttl
  }

  get(address: string): BlockchainAddressData | null {
    const entry = this.cache.get(address)
    if (!entry) return null

    const age = Date.now() - entry.timestamp
    if (age > this.ttl) {
      this.cache.delete(address)
      return null
    }

    return entry.data
  }

  set(address: string, data: BlockchainAddressData): void {
    this.cache.set(address, {
      data,
      timestamp: Date.now(),
    })
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  getStats() {
    const now = Date.now()
    let fresh = 0
    let stale = 0

    this.cache.forEach((entry) => {
      const age = now - entry.timestamp
      if (age <= this.ttl) {
        fresh++
      } else {
        stale++
      }
    })

    return { total: this.cache.size, fresh, stale }
  }
}

// =============================================================================
// RATE LIMITER
// =============================================================================

class RateLimiter {
  private requests: number[] = []
  private limit: number
  private window: number

  constructor(limit: number, windowMs: number = 60000) {
    this.limit = limit
    this.window = windowMs
  }

  async acquire(): Promise<void> {
    const now = Date.now()

    // Remove old requests outside window
    this.requests = this.requests.filter((time) => now - time < this.window)

    if (this.requests.length >= this.limit) {
      // Wait until oldest request expires
      const oldestRequest = this.requests[0]!
      const waitTime = this.window - (now - oldestRequest)

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }

      return this.acquire() // Try again
    }

    this.requests.push(now)
  }

  getStats() {
    const now = Date.now()
    const recent = this.requests.filter((time) => now - time < this.window)

    return {
      requests: recent.length,
      limit: this.limit,
      available: this.limit - recent.length,
    }
  }
}

// =============================================================================
// BLOCKCHAIN API CLIENT
// =============================================================================

export class BlockchainAPI {
  private cache: BlockchainCache
  private blockchairLimiter: RateLimiter
  private mempoolLimiter: RateLimiter

  constructor() {
    this.cache = new BlockchainCache()
    this.blockchairLimiter = new RateLimiter(CONFIG.RATE_LIMIT.blockchair)
    this.mempoolLimiter = new RateLimiter(CONFIG.RATE_LIMIT.mempool)
  }

  /**
   * Fetch data for a single address
   */
  async fetchAddress(address: string): Promise<BlockchainAddressData> {
    // Check cache first
    const cached = this.cache.get(address)
    if (cached) {
      return { ...cached, _source: 'cache' }
    }

    // Try Blockchair first (more data)
    try {
      const data = await this.fetchFromBlockchair(address)
      this.cache.set(address, data)
      return data
    } catch (error) {
      console.warn(`Blockchair failed for ${address}, trying Mempool.space...`, error)
    }

    // Fallback to Mempool.space
    try {
      const data = await this.fetchFromMempool(address)
      this.cache.set(address, data)
      return data
    } catch (error) {
      throw new Error(`All APIs failed for ${address}: ${error}`)
    }
  }

  /**
   * Fetch data for multiple addresses in batch
   */
  async fetchBatch(addresses: string[]): Promise<BlockchainBatchResult> {
    const startTime = Date.now()
    const results = new Map<string, BlockchainAddressData | Error>()
    let success = 0
    let failed = 0
    let cached = 0

    // Process in batches to avoid overwhelming APIs
    for (let i = 0; i < addresses.length; i += CONFIG.BATCH_SIZE) {
      const batch = addresses.slice(i, i + CONFIG.BATCH_SIZE)

      const promises = batch.map(async (address) => {
        try {
          const data = await this.fetchAddress(address)
          if (data._source === 'cache') cached++
          success++
          return { address, data }
        } catch (error) {
          failed++
          return { address, error: error as Error }
        }
      })

      const batchResults = await Promise.all(promises)

      batchResults.forEach(({ address, data, error }: any) => {
        if (data) {
          results.set(address, data)
        } else {
          results.set(address, error)
        }
      })

      // Small delay between batches
      if (i + CONFIG.BATCH_SIZE < addresses.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    return {
      results,
      success,
      failed,
      cached,
      elapsed: Date.now() - startTime,
    }
  }

  /**
   * Fetch from Blockchair API
   */
  private async fetchFromBlockchair(address: string): Promise<BlockchainAddressData> {
    await this.blockchairLimiter.acquire()

    const url = `${CONFIG.ENDPOINTS.blockchair}/${address}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Blockchair API error: ${response.status} ${response.statusText}`)
    }

    const json = await response.json()
    const data = json.data?.[address]

    if (!data) {
      throw new Error('No data returned from Blockchair')
    }

    const addressData = data.address
    const stats = data.stats || {}

    return {
      address,
      balance: (addressData.balance || 0) / 100000000, // Satoshi to BTC
      totalReceived: (addressData.received || 0) / 100000000,
      totalSent: (addressData.spent || 0) / 100000000,
      txCount: addressData.transaction_count || 0,
      firstSeen: addressData.first_seen_receiving
        ? new Date(addressData.first_seen_receiving)
        : null,
      lastSeen: addressData.last_seen_receiving
        ? new Date(addressData.last_seen_receiving)
        : null,
      isSpent: (addressData.balance || 0) === 0 && (addressData.received || 0) > 0,
      hasTransactions: (addressData.transaction_count || 0) > 0,
      explorerUrls: this.getExplorerUrls(address),
      _raw: data,
      _source: 'blockchair',
      _fetchedAt: new Date(),
    }
  }

  /**
   * Fetch from Mempool.space API
   */
  private async fetchFromMempool(address: string): Promise<BlockchainAddressData> {
    await this.mempoolLimiter.acquire()

    const url = `${CONFIG.ENDPOINTS.mempool}/${address}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Mempool API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    return {
      address,
      balance: (data.chain_stats?.funded_txo_sum || 0) / 100000000 -
               (data.chain_stats?.spent_txo_sum || 0) / 100000000,
      totalReceived: (data.chain_stats?.funded_txo_sum || 0) / 100000000,
      totalSent: (data.chain_stats?.spent_txo_sum || 0) / 100000000,
      txCount: (data.chain_stats?.tx_count || 0),
      firstSeen: null, // Mempool doesn't provide this easily
      lastSeen: null,
      isSpent: (data.chain_stats?.funded_txo_sum || 0) > 0 &&
               (data.chain_stats?.funded_txo_sum || 0) === (data.chain_stats?.spent_txo_sum || 0),
      hasTransactions: (data.chain_stats?.tx_count || 0) > 0,
      explorerUrls: this.getExplorerUrls(address),
      _raw: data,
      _source: 'mempool',
      _fetchedAt: new Date(),
    }
  }

  /**
   * Get explorer URLs for an address
   */
  private getExplorerUrls(address: string) {
    return {
      blockchair: `https://blockchair.com/bitcoin/address/${address}`,
      blockchain: `https://www.blockchain.com/btc/address/${address}`,
      mempool: `https://mempool.space/address/${address}`,
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats()
  }

  /**
   * Get rate limiter statistics
   */
  getRateLimitStats() {
    return {
      blockchair: this.blockchairLimiter.getStats(),
      mempool: this.mempoolLimiter.getStats(),
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const blockchainAPI = new BlockchainAPI()

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format BTC amount for display
 */
export function formatBTC(amount: number, decimals: number = 8): string {
  return amount.toFixed(decimals).replace(/\.?0+$/, '') + ' BTC'
}

/**
 * Check if address has ever been used
 */
export function isAddressUsed(data: BlockchainAddressData): boolean {
  return data.hasTransactions || data.totalReceived > 0
}

/**
 * Get address status label
 */
export function getAddressStatus(data: BlockchainAddressData): string {
  if (!data.hasTransactions) return 'Never used'
  if (data.balance > 0) return 'Active'
  if (data.isSpent) return 'Spent'
  return 'Unknown'
}

/**
 * Calculate address age in days
 */
export function getAddressAge(data: BlockchainAddressData): number | null {
  if (!data.firstSeen) return null
  const ageMs = Date.now() - data.firstSeen.getTime()
  return Math.floor(ageMs / (1000 * 60 * 60 * 24))
}
