'use client'

/**
 * useEpochData Hook
 * Fetches current epoch data from Qubic RPC with SWR caching
 */

import useSWR from 'swr'
import { qubicRPC } from '@/lib/qubic/rpc-client'
import { API_CONFIG } from '@/config/api'

interface EpochData {
  epoch: number
  tick: number
  timestamp: number
  nextEpochIn: number
}

const fetcher = async (): Promise<EpochData> => {
  return await qubicRPC.getCurrentEpoch()
}

export function useEpochData() {
  const { data, error, isLoading, mutate } = useSWR<EpochData>(
    'qubic/epoch',
    fetcher,
    {
      refreshInterval: API_CONFIG.cacheTime.epoch, // 5s
      revalidateOnFocus: true,
      dedupingInterval: API_CONFIG.cacheTime.epoch,
    }
  )

  return {
    epoch: data,
    error,
    isLoading,
    refresh: mutate,
  }
}
