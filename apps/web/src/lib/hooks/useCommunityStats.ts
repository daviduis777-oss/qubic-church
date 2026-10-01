'use client'

/**
 * useCommunityStats Hook
 * Fetches NFT collection and community statistics
 */

import useSWR from 'swr'
import { qubicBay } from '@/lib/qubic/qubicbay-api'
import { API_CONFIG } from '@/config/api'

interface CollectionStats {
  totalNFTs: number
  holders: number
  floorPrice: number
  volume24h: number
  totalTrades: number
}

const fetcher = async (): Promise<CollectionStats> => {
  return await qubicBay.getCollectionStats()
}

export function useCommunityStats() {
  const { data, error, isLoading, mutate } = useSWR<CollectionStats>(
    'qubic/community-stats',
    fetcher,
    {
      refreshInterval: API_CONFIG.cacheTime.community, // 30s
      revalidateOnFocus: true,
      dedupingInterval: API_CONFIG.cacheTime.community,
    }
  )

  return {
    stats: data,
    error,
    isLoading,
    refresh: mutate,
  }
}
