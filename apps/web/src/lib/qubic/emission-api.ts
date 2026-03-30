/**
 * Qubic Emission API Client
 * Tracks emission rates and halving schedule
 */

import { API_CONFIG } from '@/config/api'

export interface EmissionData {
  currentEpoch: number
  baseEmission: bigint // QUBIC per epoch
  nextHalving: {
    epoch: number
    epochsUntil: number
    timeEstimate: Date
  }
  history: EmissionPoint[]
}

export interface EmissionPoint {
  epoch: number
  emission: bigint
  timestamp: number
}

/**
 * Qubic Emission API Client
 * Calculates emission rates and predicts halvings
 */
export class EmissionAPIClient {
  private static instance: EmissionAPIClient
  private cache: { data: EmissionData | null; timestamp: number } = {
    data: null,
    timestamp: 0,
  }

  private constructor() {}

  static getInstance(): EmissionAPIClient {
    if (!EmissionAPIClient.instance) {
      EmissionAPIClient.instance = new EmissionAPIClient()
    }
    return EmissionAPIClient.instance
  }

  /**
   * Get current emission data
   * Qubic halvings occur every 52 epochs
   */
  async getEmissionData(): Promise<EmissionData> {
    // Check cache
    const cacheAge = Date.now() - this.cache.timestamp
    if (this.cache.data && cacheAge < API_CONFIG.cacheTime.emission) {
      return this.cache.data
    }

    try {
      // In production, this would fetch from an API
      // For now, we'll calculate based on known constants
      const currentEpoch = await this.getCurrentEpoch()
      const emissionData = this.calculateEmission(currentEpoch)

      // Cache the result
      this.cache = {
        data: emissionData,
        timestamp: Date.now(),
      }

      return emissionData
    } catch (error) {
      // Return cached data if available, even if expired
      if (this.cache.data) return this.cache.data

      throw error instanceof Error
        ? error
        : new Error('Failed to fetch emission data')
    }
  }

  /**
   * Get current epoch from RPC or estimate
   */
  private async getCurrentEpoch(): Promise<number> {
    try {
      // Try to get from Qubic RPC
      const { qubicRPC } = await import('./rpc-client')
      const epochData = await qubicRPC.getCurrentEpoch()
      return epochData.epoch
    } catch (error) {
      // Fallback: Calculate based on genesis date
      const genesisDate = new Date('2024-01-01T00:00:00Z') // Approximate
      const epochDuration = 7 * 24 * 60 * 60 * 1000 // 7 days in ms
      const elapsed = Date.now() - genesisDate.getTime()
      return Math.floor(elapsed / epochDuration)
    }
  }

  /**
   * Calculate emission for a given epoch
   * Initial emission: 1B QUBIC per epoch
   * Halving every 52 epochs
   */
  private calculateEmission(currentEpoch: number): EmissionData {
    const EPOCHS_PER_HALVING = 52
    const INITIAL_EMISSION = 1_000_000_000n // 1B QUBIC

    // Calculate number of halvings that have occurred
    const halvings = Math.floor(currentEpoch / EPOCHS_PER_HALVING)

    // Calculate current emission (halve for each period)
    const currentEmission = INITIAL_EMISSION / BigInt(2 ** halvings)

    // Calculate next halving
    const nextHalvingEpoch = (halvings + 1) * EPOCHS_PER_HALVING
    const epochsUntil = nextHalvingEpoch - currentEpoch

    // Estimate time until next halving (7 days per epoch)
    const daysUntilHalving = epochsUntil * 7
    const nextHalvingDate = new Date(
      Date.now() + daysUntilHalving * 24 * 60 * 60 * 1000
    )

    // Generate emission history (last 10 halvings)
    const history: EmissionPoint[] = []
    for (let i = Math.max(0, halvings - 10); i <= halvings; i++) {
      const epoch = i * EPOCHS_PER_HALVING
      const emission = INITIAL_EMISSION / BigInt(2 ** i)
      const timestamp = Date.now() - (currentEpoch - epoch) * 7 * 24 * 60 * 60 * 1000
      history.push({ epoch, emission, timestamp })
    }

    return {
      currentEpoch,
      baseEmission: currentEmission,
      nextHalving: {
        epoch: nextHalvingEpoch,
        epochsUntil,
        timeEstimate: nextHalvingDate,
      },
      history,
    }
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache = { data: null, timestamp: 0 }
  }
}

/**
 * Singleton instance export
 */
export const emissionAPI = EmissionAPIClient.getInstance()
