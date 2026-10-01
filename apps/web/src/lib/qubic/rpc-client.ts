/**
 * Qubic API Client
 * Multi-endpoint REST client with fallback support, rate limiting, and caching
 */

import { QUBIC_RPC_ENDPOINTS, API_CONFIG } from '@/config/api'

export interface EpochData {
  epoch: number
  tick: number
  timestamp: number
  nextEpochIn: number
}

export interface NetworkStatus {
  tick: number
  tickRate: number
  tps: number
  health: 'excellent' | 'good' | 'fair' | 'slow'
}

export interface AddressBalance {
  address: string
  balance: bigint
}

/**
 * Simple rate limiter for API calls
 */
class RateLimiter {
  private timestamps: number[] = []

  canMakeRequest(): boolean {
    const now = Date.now()
    this.timestamps = this.timestamps.filter(
      (t) => now - t < API_CONFIG.rateLimit.perMilliseconds
    )
    return this.timestamps.length < API_CONFIG.rateLimit.maxRequests
  }

  recordRequest(): void {
    this.timestamps.push(Date.now())
  }
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
 * Qubic REST API Client
 * Handles communication with Qubic API nodes with automatic fallback
 */
export class QubicRPCClient {
  private static instance: QubicRPCClient
  private currentEndpointIndex = 0
  private rateLimiter = new RateLimiter()
  private cache = new APICache<unknown>()

  private constructor() {}

  static getInstance(): QubicRPCClient {
    if (!QubicRPCClient.instance) {
      QubicRPCClient.instance = new QubicRPCClient()
    }
    return QubicRPCClient.instance
  }

  /**
   * Make REST API call with automatic fallback
   */
  private async call<T>(
    endpoint: string,
    cacheTTL?: number
  ): Promise<T> {
    // Check cache first if TTL provided
    const cacheKey = endpoint
    if (cacheTTL) {
      const cached = this.cache.get(cacheKey, cacheTTL) as T | null
      if (cached) return cached
    }

    // Rate limiting
    if (!this.rateLimiter.canMakeRequest()) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Try each base URL until one succeeds
    let lastError: Error | null = null

    for (let i = 0; i < QUBIC_RPC_ENDPOINTS.length; i++) {
      const endpointIndex =
        (this.currentEndpointIndex + i) % QUBIC_RPC_ENDPOINTS.length
      const baseUrl = QUBIC_RPC_ENDPOINTS[endpointIndex]

      if (!baseUrl) {
        continue
      }

      try {
        this.rateLimiter.recordRequest()

        const controller = new AbortController()
        const timeoutId = setTimeout(
          () => controller.abort(),
          API_CONFIG.timeout
        )

        const url = `${baseUrl}${endpoint}`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Success - update current endpoint and cache result
        this.currentEndpointIndex = endpointIndex
        if (cacheTTL) {
          this.cache.set(cacheKey, data)
        }

        return data as T
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error('Unknown API error')
        // Continue to next endpoint
        continue
      }
    }

    // All endpoints failed
    throw lastError || new Error('All API endpoints failed')
  }

  /**
   * Get current epoch data
   * Qubic v1 API: /tick-info returns { tickInfo: { tick, duration, epoch, ... } }
   */
  async getCurrentEpoch(): Promise<EpochData> {
    try {
      // Qubic v1 API returns nested tickInfo object
      const response = await this.call<{
        tickInfo?: {
          tick: number
          duration?: number
          epoch?: number
          initialTick?: number
        }
        tick?: number
        epoch?: number
      }>(
        '/tick-info',
        API_CONFIG.cacheTime.epoch
      )

      // Handle nested tickInfo format from Qubic v1 API
      const tickData = response.tickInfo || response
      const tick = tickData.tick ?? 0
      const epoch = tickData.epoch

      // Calculate epoch from tick if not provided
      // Qubic: ~100 ticks/sec, ~8.64M ticks/day, ~60M per week (1 epoch)
      const TICKS_PER_EPOCH = 60_000_000
      const currentEpoch = epoch ?? Math.floor(tick / TICKS_PER_EPOCH)

      return {
        epoch: currentEpoch,
        tick: tick,
        timestamp: Date.now(),
        nextEpochIn: TICKS_PER_EPOCH - (tick % TICKS_PER_EPOCH),
      }
    } catch (error) {
      console.error('[QubicRPC] Epoch fetch error:', error)
      // Fallback to static data if API fails
      return {
        epoch: 156,
        tick: 0,
        timestamp: Date.now(),
        nextEpochIn: 0,
      }
    }
  }

  /**
   * Get network status
   * Qubic v1 API: /status returns { lastProcessedTick: { tickNumber, epoch }, ... }
   */
  async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      const response = await this.call<{
        lastProcessedTick?: {
          tickNumber: number
          epoch?: number
        }
        tick?: number
        numberOfEmptyTicks?: number
        numberOfSkippedTicks?: number
      }>(
        '/status',
        API_CONFIG.cacheTime.network
      )

      // Handle nested lastProcessedTick format from Qubic v1 API
      const tick = response.lastProcessedTick?.tickNumber ?? response.tick ?? 0

      // Estimate network health
      const emptyRatio = (response.numberOfEmptyTicks ?? 0) / Math.max(1, tick)
      const health: NetworkStatus['health'] =
        emptyRatio < 0.01 ? 'excellent' :
        emptyRatio < 0.05 ? 'good' :
        emptyRatio < 0.1 ? 'fair' : 'slow'

      return {
        tick,
        tickRate: 1, // Default tick rate
        tps: 0,
        health,
      }
    } catch (error) {
      console.error('[QubicRPC] Network status fetch error:', error)
      // Fallback
      return {
        tick: 0,
        tickRate: 1,
        tps: 0,
        health: 'good',
      }
    }
  }

  /**
   * Get address balance
   * Qubic v1 API returns: { balance: { id, balance, validForTick, ... } }
   */
  async getBalance(address: string): Promise<bigint> {
    try {
      // Try the v1 API format first (nested balance object)
      const result = await this.call<{
        balance: {
          id: string
          balance: string | number
          validForTick?: number
        }
      }>(
        `/balances/${address}`,
        API_CONFIG.cacheTime.nftOwner
      )

      // Handle nested response format from Qubic v1 API
      if (result.balance && typeof result.balance === 'object') {
        return BigInt(result.balance.balance)
      }

      // Fallback for simple format
      if (typeof result.balance === 'string' || typeof result.balance === 'number') {
        return BigInt(result.balance)
      }

      return BigInt(0)
    } catch (error) {
      console.error('[QubicRPC] Balance fetch error:', error)
      return BigInt(0)
    }
  }

  /**
   * Broadcast a signed transaction to the Qubic network.
   * Uses the /broadcast-transaction endpoint.
   *
   * @param encodedTransaction - Base64-encoded signed transaction
   * @returns The number of peers that received the broadcast
   */
  async broadcastTransaction(encodedTransaction: string): Promise<{
    peersBroadcasted: number
  }> {
    let lastError: Error | null = null

    for (let i = 0; i < QUBIC_RPC_ENDPOINTS.length; i++) {
      const endpointIndex =
        (this.currentEndpointIndex + i) % QUBIC_RPC_ENDPOINTS.length
      const baseUrl = QUBIC_RPC_ENDPOINTS[endpointIndex]

      if (!baseUrl) continue

      try {
        if (!this.rateLimiter.canMakeRequest()) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
        this.rateLimiter.recordRequest()

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

        const response = await fetch(`${baseUrl}/broadcast-transaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ encodedTransaction }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        this.currentEndpointIndex = endpointIndex
        return data as { peersBroadcasted: number }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Broadcast error')
        continue
      }
    }

    throw lastError || new Error('All endpoints failed for broadcast')
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
export const qubicRPC = QubicRPCClient.getInstance()
