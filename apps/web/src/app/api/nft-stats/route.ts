import { NextResponse } from 'next/server'
import { fetchNFTStats } from '@/lib/qubic/nft-stats'

export const revalidate = 60 // ISR: revalidate every 60 seconds

export async function GET() {
  const stats = await fetchNFTStats()
  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  })
}
