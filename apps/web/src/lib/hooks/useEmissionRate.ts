'use client'

/**
 * useEmissionRate Hook
 * Fetches emission rate and halving schedule
 */

import useSWR from 'swr'
import { emissionAPI } from '@/lib/qubic/emission-api'
import { API_CONFIG } from '@/config/api'

interface EmissionPoint {
  epoch: number
  emission: bigint
  timestamp: number
}

interface EmissionData {
  currentEpoch: number
  baseEmission: bigint
  nextHalving: {
    epoch: number
    epochsUntil: number
    timeEstimate: Date
  }
  history: EmissionPoint[]
}

const fetcher = async (): Promise<EmissionData> => {
  return await emissionAPI.getEmissionData()
}

export function useEmissionRate() {
  const { data, error, isLoading, mutate } = useSWR<EmissionData>(
    'qubic/emission',
    fetcher,
    {
      refreshInterval: API_CONFIG.cacheTime.emission, // 30s
      revalidateOnFocus: false,
      dedupingInterval: API_CONFIG.cacheTime.emission,
    }
  )

  return {
    emission: data,
    error,
    isLoading,
    refresh: mutate,
  }
}
