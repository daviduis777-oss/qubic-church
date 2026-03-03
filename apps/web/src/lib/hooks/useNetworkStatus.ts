'use client'

/**
 * useNetworkStatus Hook
 * Fetches network status with real-time updates
 */

import useSWR from 'swr'
import { qubicRPC } from '@/lib/qubic/rpc-client'
import { API_CONFIG } from '@/config/api'

interface NetworkStatus {
  tick: number
  tickRate: number
  tps: number
  health: 'excellent' | 'good' | 'fair' | 'slow'
}

const fetcher = async (): Promise<NetworkStatus> => {
  return await qubicRPC.getNetworkStatus()
}

export function useNetworkStatus() {
  const { data, error, isLoading, mutate } = useSWR<NetworkStatus>(
    'qubic/network-status',
    fetcher,
    {
      refreshInterval: API_CONFIG.cacheTime.network, // 10s
      revalidateOnFocus: true,
      dedupingInterval: API_CONFIG.cacheTime.network,
    }
  )

  return {
    status: data,
    error,
    isLoading,
    refresh: mutate,
  }
}
