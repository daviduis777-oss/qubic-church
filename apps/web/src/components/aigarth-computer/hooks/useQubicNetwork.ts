'use client'

import { useState, useEffect, useCallback } from 'react'
import { qubicRPC, type EpochData, type NetworkStatus } from '@/lib/qubic/rpc-client'

export interface QubicNetworkState {
  isConnected: boolean
  isLoading: boolean
  error: string | null
  epoch: EpochData | null
  networkStatus: NetworkStatus | null
  balance: bigint | null
  lastUpdate: number | null
}

export interface UseQubicNetworkReturn extends QubicNetworkState {
  refresh: () => Promise<void>
  fetchBalance: (address: string) => Promise<bigint>
}

const REFRESH_INTERVAL = 30000 // 30 seconds

export function useQubicNetwork(
  walletAddress?: string,
  autoRefresh = true
): UseQubicNetworkReturn {
  const [state, setState] = useState<QubicNetworkState>({
    isConnected: false,
    isLoading: true,
    error: null,
    epoch: null,
    networkStatus: null,
    balance: null,
    lastUpdate: null,
  })

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const [epoch, networkStatus] = await Promise.all([
        qubicRPC.getCurrentEpoch(),
        qubicRPC.getNetworkStatus(),
      ])

      let balance: bigint | null = null
      if (walletAddress) {
        balance = await qubicRPC.getBalance(walletAddress)
      }

      setState({
        isConnected: true,
        isLoading: false,
        error: null,
        epoch,
        networkStatus,
        balance,
        lastUpdate: Date.now(),
      })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Qubic network',
      }))
    }
  }, [walletAddress])

  const fetchBalance = useCallback(async (address: string): Promise<bigint> => {
    return qubicRPC.getBalance(address)
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  return {
    ...state,
    refresh: fetchData,
    fetchBalance,
  }
}
