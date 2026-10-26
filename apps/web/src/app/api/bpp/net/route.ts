import { NextResponse } from 'next/server'
import { bestNetwork } from '@/lib/bpp/net'

export const revalidate = 600

export async function GET() {
  const d = await bestNetwork()
  return NextResponse.json(d, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } })
}
