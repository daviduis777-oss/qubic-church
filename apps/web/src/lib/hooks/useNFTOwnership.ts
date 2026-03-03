'use client'

/**
 * useNFTOwnership Hook
 * Fetches NFT ownership data for a given address
 */

import useSWR from 'swr'
import { qubicBay } from '@/lib/qubic/qubicbay-api'
import { API_CONFIG } from '@/config/api'

interface NFTOwnership {
  nftId: number
  owner: string
  price?: number
  listed: boolean
}

interface OwnerNFTs {
  address: string
  nfts: NFTOwnership[]
  count: number
}

const fetcher = async (address: string): Promise<OwnerNFTs> => {
  return await qubicBay.getOwnerNFTs(address)
}

export function useNFTOwnership(address: string | null) {
  const { data, error, isLoading, mutate } = useSWR<OwnerNFTs | null>(
    address ? `qubic/nft-ownership/${address}` : null,
    address ? async () => await fetcher(address) : null,
    {
      refreshInterval: API_CONFIG.cacheTime.nftOwner, // 1min
      revalidateOnFocus: true,
      dedupingInterval: API_CONFIG.cacheTime.nftOwner,
    }
  )

  return {
    ownership: data,
    error,
    isLoading,
    refresh: mutate,
  }
}
