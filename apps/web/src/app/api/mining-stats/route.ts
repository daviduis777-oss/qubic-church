import { NextResponse } from 'next/server'

// Data sources
const COINGECKO_API = 'https://api.coingecko.com/api/v3'
const QUBIC_RPC_API = 'https://rpc.qubic.org/v1'

export const dynamic = 'force-dynamic'
export const revalidate = 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all'

  try {
    if (type === 'price') {
      // CoinGecko for price data with 24h change
      const res = await fetch(
        `${COINGECKO_API}/simple/price?ids=qubic-network&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`,
        { next: { revalidate: 60 } }
      )

      if (!res.ok) throw new Error('CoinGecko API error')
      const data = await res.json()
      const qubic = data['qubic-network']

      return NextResponse.json({
        price_usd: qubic?.usd || 0,
        market_cap: qubic?.usd_market_cap || 0,
        volume_24h: qubic?.usd_24h_vol || 0,
        change_24h: qubic?.usd_24h_change || 0,
        last_updated: qubic?.last_updated_at || Date.now() / 1000,
        source: 'coingecko',
      })
    }

    if (type === 'network') {
      // Qubic RPC latest-stats - comprehensive network data
      const res = await fetch(`${QUBIC_RPC_API}/latest-stats`, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 30 },
      })

      if (!res.ok) throw new Error('Qubic RPC API error')
      const json = await res.json()
      const data = json.data

      return NextResponse.json({
        current_tick: data?.currentTick || 0,
        epoch: data?.epoch || 0,
        ticks_in_epoch: data?.ticksInCurrentEpoch || 0,
        empty_ticks: data?.emptyTicksInCurrentEpoch || 0,
        tick_quality: data?.epochTickQuality || 0,
        circulating_supply: data?.circulatingSupply || '0',
        active_addresses: data?.activeAddresses || 0,
        burned_qus: data?.burnedQus || '0',
        price: data?.price || 0,
        market_cap: data?.marketCap || '0',
        timestamp: data?.timestamp || Date.now() / 1000,
        source: 'qubic-rpc',
      })
    }

    if (type === 'tick') {
      // Real-time tick info
      const res = await fetch(`${QUBIC_RPC_API}/tick-info`, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 5 },
      })

      if (!res.ok) throw new Error('Qubic RPC API error')
      const json = await res.json()
      const tickInfo = json.tickInfo

      return NextResponse.json({
        tick: tickInfo?.tick || 0,
        epoch: tickInfo?.epoch || 0,
        initial_tick: tickInfo?.initialTick || 0,
        duration: tickInfo?.duration || 0,
        source: 'qubic-rpc',
      })
    }

    // Default: fetch all data from multiple sources
    const [priceRes, networkRes, tickRes] = await Promise.allSettled([
      fetch(
        `${COINGECKO_API}/simple/price?ids=qubic-network&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
        { next: { revalidate: 60 } }
      ),
      fetch(`${QUBIC_RPC_API}/latest-stats`, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 30 },
      }),
      fetch(`${QUBIC_RPC_API}/tick-info`, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 5 },
      }),
    ])

    const priceData = priceRes.status === 'fulfilled' && priceRes.value.ok
      ? await priceRes.value.json()
      : null
    const networkJson = networkRes.status === 'fulfilled' && networkRes.value.ok
      ? await networkRes.value.json()
      : null
    const tickJson = tickRes.status === 'fulfilled' && tickRes.value.ok
      ? await tickRes.value.json()
      : null

    const qubic = priceData?.['qubic-network']
    const networkData = networkJson?.data
    const tickInfo = tickJson?.tickInfo

    return NextResponse.json({
      price: {
        usd: qubic?.usd || networkData?.price || 0,
        market_cap: qubic?.usd_market_cap || parseFloat(networkData?.marketCap || '0'),
        volume_24h: qubic?.usd_24h_vol || 0,
        change_24h: qubic?.usd_24h_change || 0,
      },
      network: {
        tick: tickInfo?.tick || networkData?.currentTick || 0,
        epoch: tickInfo?.epoch || networkData?.epoch || 0,
        initial_tick: tickInfo?.initialTick || 0,
        ticks_in_epoch: networkData?.ticksInCurrentEpoch || 0,
        empty_ticks: networkData?.emptyTicksInCurrentEpoch || 0,
        tick_quality: networkData?.epochTickQuality || 0,
        circulating_supply: networkData?.circulatingSupply || '0',
        active_addresses: networkData?.activeAddresses || 0,
        burned_qus: networkData?.burnedQus || '0',
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Mining stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
