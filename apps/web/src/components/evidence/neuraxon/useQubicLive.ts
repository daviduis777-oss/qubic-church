'use client'

import { useState, useEffect, useCallback } from 'react'
import { qubicRPC, type EpochData, type NetworkStatus } from '@/lib/qubic/rpc-client'

export interface QubicLiveState {
  isConnected: boolean
  isLoading: boolean
  error: string | null
  epoch: EpochData | null
  networkStatus: NetworkStatus | null
  lastUpdate: number | null
}

export interface IdentityLookupResult {
  address: string
  balance: bigint
  isLoading: boolean
  error: string | null
}

const REFRESH_INTERVAL = 15000 // 15 seconds

export function useQubicLive() {
  const [state, setState] = useState<QubicLiveState>({
    isConnected: false,
    isLoading: true,
    error: null,
    epoch: null,
    networkStatus: null,
    lastUpdate: null,
  })

  const [lookupCache, setLookupCache] = useState<Map<string, IdentityLookupResult>>(new Map())

  const fetchNetworkData = useCallback(async () => {
    try {
      const [epoch, networkStatus] = await Promise.all([
        qubicRPC.getCurrentEpoch(),
        qubicRPC.getNetworkStatus(),
      ])

      setState({
        isConnected: true,
        isLoading: false,
        error: null,
        epoch,
        networkStatus,
        lastUpdate: Date.now(),
      })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect',
      }))
    }
  }, [])

  // Look up a Qubic identity balance
  const lookupIdentity = useCallback(async (publicId: string): Promise<IdentityLookupResult> => {
    // Check cache first
    const cached = lookupCache.get(publicId)
    if (cached && !cached.isLoading && !cached.error) {
      return cached
    }

    // Set loading state
    const loadingResult: IdentityLookupResult = {
      address: publicId,
      balance: BigInt(0),
      isLoading: true,
      error: null,
    }
    setLookupCache((prev) => new Map(prev).set(publicId, loadingResult))

    try {
      const balance = await qubicRPC.getBalance(publicId)
      const result: IdentityLookupResult = {
        address: publicId,
        balance,
        isLoading: false,
        error: null,
      }
      setLookupCache((prev) => new Map(prev).set(publicId, result))
      return result
    } catch (error) {
      const result: IdentityLookupResult = {
        address: publicId,
        balance: BigInt(0),
        isLoading: false,
        error: error instanceof Error ? error.message : 'Lookup failed',
      }
      setLookupCache((prev) => new Map(prev).set(publicId, result))
      return result
    }
  }, [lookupCache])

  // Get cached lookup result
  const getCachedLookup = useCallback((publicId: string): IdentityLookupResult | null => {
    return lookupCache.get(publicId) || null
  }, [lookupCache])

  // Initial fetch
  useEffect(() => {
    fetchNetworkData()
  }, [fetchNetworkData])

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(fetchNetworkData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchNetworkData])

  return {
    ...state,
    refresh: fetchNetworkData,
    lookupIdentity,
    getCachedLookup,
  }
}
