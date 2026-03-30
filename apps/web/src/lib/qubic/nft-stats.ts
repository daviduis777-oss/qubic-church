/**
 * Fetch real ANNA token holder stats from Qubic RPC.
 * Uses the /v1/issuers/{id}/assets/ANNA/owners endpoint.
 * Falls back to a static value if the API is unreachable.
 */

import { QUBIC_RPC_ENDPOINTS, API_CONFIG } from '@/config/api'

const ANNA_ISSUER = 'HIFUSWQYNUZTSDRPXZOXXIWUPWTAOVJUTCVLFIHLHARCXSARRTGCJLGGAREO'
const ASSET_NAME = 'ANNA'

interface OwnerEntry {
  identity: string
  numberOfShares: number
}

interface NFTStats {
  holders: number
  totalSupply: number
  source: 'api' | 'fallback'
}

let cachedStats: NFTStats | null = null
let cacheTimestamp = 0

export async function fetchNFTStats(): Promise<NFTStats> {
  const now = Date.now()
  if (cachedStats && now - cacheTimestamp < API_CONFIG.cacheTime.nftOwner) {
    return cachedStats
  }

  for (const baseUrl of QUBIC_RPC_ENDPOINTS) {
    try {
      const url = `${baseUrl}/issuers/${ANNA_ISSUER}/assets/${ASSET_NAME}/owners`
      const response = await fetch(url, {
        signal: AbortSignal.timeout(API_CONFIG.timeout),
        headers: { 'Accept': 'application/json' },
      })

      if (!response.ok) continue

      const data = await response.json()
      const owners: OwnerEntry[] = data?.owners ?? data ?? []

      const holders = Array.isArray(owners) ? owners.length : 0

      const stats: NFTStats = {
        holders,
        totalSupply: 200,
        source: 'api',
      }

      cachedStats = stats
      cacheTimestamp = now
      return stats
    } catch {
      continue
    }
  }

  // Fallback if all endpoints fail
  return {
    holders: 0,
    totalSupply: 200,
    source: 'fallback',
  }
}
