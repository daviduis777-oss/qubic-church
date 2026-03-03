'use client'

import { useState, useEffect } from 'react'
import { blockchainAPI, type BlockchainAddressData } from '@/lib/blockchain/blockchain-api'

// =============================================================================
// TYPES
// =============================================================================

export interface UseBlockchainDataResult {
  data: BlockchainAddressData | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * React hook to fetch blockchain data for a Bitcoin address
 *
 * Features:
 * - Automatic caching (5 minutes)
 * - Rate limiting
 * - Error handling
 * - Loading states
 * - Manual refetch
 */
export function useBlockchainData(address: string | null): UseBlockchainDataResult {
  const [data, setData] = useState<BlockchainAddressData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [shouldFetch, setShouldFetch] = useState(0)

  useEffect(() => {
    // Skip if no address provided
    if (!address) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    // Skip if address looks invalid (too short, starts with brackets, etc.)
    if (address.length < 20 || address.startsWith('[')) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await blockchainAPI.fetchAddress(address)

        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setData(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [address, shouldFetch])

  const refetch = () => {
    setShouldFetch(prev => prev + 1)
  }

  return { data, isLoading, error, refetch }
}

// =============================================================================
// BATCH HOOK (For future use)
// =============================================================================

/**
 * Hook to fetch blockchain data for multiple addresses
 */
export function useBlockchainDataBatch(addresses: string[]) {
  const [data, setData] = useState<Map<string, BlockchainAddressData | Error>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [stats, setStats] = useState({ success: 0, failed: 0, cached: 0 })

  useEffect(() => {
    if (addresses.length === 0) {
      setData(new Map())
      return
    }

    let cancelled = false

    const fetchBatch = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await blockchainAPI.fetchBatch(addresses)

        if (!cancelled) {
          setData(result.results)
          setStats({
            success: result.success,
            failed: result.failed,
            cached: result.cached,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchBatch()

    return () => {
      cancelled = true
    }
  }, [addresses.join(',')])

  return { data, isLoading, error, stats }
}
