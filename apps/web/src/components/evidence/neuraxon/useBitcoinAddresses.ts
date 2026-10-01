'use client'

import { useState, useEffect, useMemo } from 'react'

export interface BitcoinAddress {
  id: number
  address: string
  position: [number, number]
  method: string
  xor: number
  compressed: boolean
  hash160: string
}

interface BitcoinAddressData {
  total: number
  records: BitcoinAddress[]
}

export function useBitcoinAddresses() {
  const [addresses, setAddresses] = useState<BitcoinAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadAddresses() {
      try {
        const response = await fetch('/data/interesting-addresses.json', { signal: controller.signal })
        if (!response.ok) {
          throw new Error('Failed to load Bitcoin addresses')
        }
        const data: BitcoinAddressData = await response.json()
        setAddresses(data.records)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadAddresses()
    return () => controller.abort()
  }, [])

  // Create a mapping from matrix position to Bitcoin address
  const positionMap = useMemo(() => {
    const map = new Map<string, BitcoinAddress>()
    addresses.forEach((addr) => {
      const key = `${addr.position[0]},${addr.position[1]}`
      map.set(key, addr)
    })
    return map
  }, [addresses])

  // Get Bitcoin address for a given matrix position
  const getAddressForPosition = (row: number, col: number): BitcoinAddress | undefined => {
    return positionMap.get(`${row},${col}`)
  }

  // Check if a position has a Bitcoin address
  const hasAddress = (row: number, col: number): boolean => {
    return positionMap.has(`${row},${col}`)
  }

  return {
    addresses,
    loading,
    error,
    getAddressForPosition,
    hasAddress,
    positionMap,
  }
}
