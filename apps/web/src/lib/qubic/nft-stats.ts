/**
 * Fetch ANNA NFT stats.
 * Primary: QubicBay collection API (sold items = founders count).
 * Fallback: Qubic RPC on-chain owners.
 * Note: QubicBay "sold" and RPC "unique holders" differ because
 * some buyers hold multiple NFTs. We use QubicBay as the source
 * of truth for founder milestones.
 */

import { QUBIC_RPC_ENDPOINTS, QUBICBAY_API, API_CONFIG } from '@/config/api'

const ANNA_ISSUER = 'HIFUSWQYNUZTSDRPXZOXXIWUPWTAOVJUTCVLFIHLHARCXSARRTGCJLGGAREO'
const ASSET_NAME = 'ANNA'

interface OwnerEntry {
  identity: string
  numberOfShares: number
}

interface NFTStats {
  holders: number
  totalSupply: number
  source: 'qubicbay' | 'rpc' | 'fallback'
}

let cachedStats: NFTStats | null = null
let cacheTimestamp = 0

async function fetchFromQubicBay(): Promise<number | null> {
  // Try the stats endpoint first, then the collection endpoint
  const endpoints = [QUBICBAY_API.endpoints.stats, QUBICBAY_API.endpoints.collection]
  for (const endpoint of endpoints) {
    try {
      const url = `${QUBICBAY_API.baseUrl}${endpoint}`
      const response = await fetch(url, {
        signal: AbortSignal.timeout(API_CONFIG.timeout),
        headers: { 'Accept': 'application/json' },
      })
      if (!response.ok) continue
      const data = await response.json()
      // QubicBay may use different field names for sold/minted count
      const sold =
        data?.totalItems ??
        data?.itemCount ??
        data?.sold ??
        data?.count ??
        data?.totalNFTs ??
        data?.holders ??
        null
      if (typeof sold === 'number' && sold > 0) return sold
    } catch {
      continue
    }
  }
  return null
}

async function fetchFromRPC(): Promise<number | null> {
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
      const count = Array.isArray(owners) ? owners.length : 0
      if (count > 0) return count
    } catch {
      continue
    }
  }
  return null
}

export async function fetchNFTStats(): Promise<NFTStats> {
  const now = Date.now()
  if (cachedStats && now - cacheTimestamp < API_CONFIG.cacheTime.nftOwner) {
    return cachedStats
  }

  // 1. Try QubicBay (sold count — matches marketplace display)
  const qubicBaySold = await fetchFromQubicBay()
  if (qubicBaySold !== null) {
    const stats: NFTStats = { holders: qubicBaySold, totalSupply: 200, source: 'qubicbay' }
    cachedStats = stats
    cacheTimestamp = now
    return stats
  }

  // 2. Fall back to Qubic RPC (unique on-chain holders)
  const rpcHolders = await fetchFromRPC()
  if (rpcHolders !== null) {
    const stats: NFTStats = { holders: rpcHolders, totalSupply: 200, source: 'rpc' }
    cachedStats = stats
    cacheTimestamp = now
    return stats
  }

  // 3. Static fallback — last known sold count
  return { holders: 54, totalSupply: 200, source: 'fallback' }
}
