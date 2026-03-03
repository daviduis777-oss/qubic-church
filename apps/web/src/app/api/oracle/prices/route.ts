import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_PATH = join(process.cwd(), 'public/data/oracle-price-history.json')

/**
 * GET /api/oracle/prices — Read oracle price sweep history
 * Query params: ?pair=qubic/usdt&limit=50
 */
export async function GET(request: NextRequest) {
  try {
    if (!existsSync(DATA_PATH)) {
      return NextResponse.json(
        { data: null, message: 'No price data yet. Run ORACLE_DOMINATOR.mjs to collect data.' },
        {
          status: 200,
          headers: { 'Cache-Control': 'public, max-age=15' },
        }
      )
    }

    const raw = readFileSync(DATA_PATH, 'utf-8')
    const sweeps = JSON.parse(raw)

    if (!Array.isArray(sweeps) || sweeps.length === 0) {
      return NextResponse.json(
        { data: null, message: 'Price history is empty.' },
        { status: 200, headers: { 'Cache-Control': 'public, max-age=15' } }
      )
    }

    // Optional filtering
    const { searchParams } = new URL(request.url)
    const pairFilter = searchParams.get('pair')?.toLowerCase()
    const limitParam = parseInt(searchParams.get('limit') ?? '50', 10)
    const limit = Math.min(Math.max(1, limitParam), 500)

    let filtered = sweeps.slice(-limit)

    if (pairFilter) {
      const [c1, c2] = pairFilter.split('/')
      filtered = filtered.map(sweep => ({
        ...sweep,
        results: sweep.results?.filter(
          (r: { currency1: string; currency2: string }) =>
            r.currency1 === c1 && r.currency2 === c2
        ),
      }))
    }

    // Build latest price grid
    const latestSweep = sweeps[sweeps.length - 1]
    const priceGrid: Record<string, Record<string, { status: string; tick: number; oracle: string }>> = {}

    if (latestSweep?.results) {
      for (const r of latestSweep.results) {
        const pair = `${r.currency1}/${r.currency2}`
        if (!priceGrid[pair]) priceGrid[pair] = {}
        priceGrid[pair][r.oracle] = {
          status: r.status,
          tick: r.targetTick,
          oracle: r.oracle,
        }
      }
    }

    return NextResponse.json(
      {
        data: {
          sweeps: filtered,
          latestSweep: latestSweep ?? null,
          priceGrid,
          totalSweeps: sweeps.length,
          lastUpdated: latestSweep?.timestamp ?? null,
        },
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=15' },
      }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to read price data' },
      { status: 500 }
    )
  }
}
