import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_PATH = join(process.cwd(), 'public/data/oracle-live-queries.json')

/**
 * GET /api/oracle/live — Read all on-chain oracle queries from live scan
 * Query params: ?seals_only=true (filter to Seven Seals only)
 */
export async function GET(request: NextRequest) {
  try {
    if (!existsSync(DATA_PATH)) {
      return NextResponse.json(
        { data: null, message: 'No live query data yet. Run ORACLE_LIVE_SCAN.mjs to scan on-chain queries.' },
        { status: 200, headers: { 'Cache-Control': 'public, max-age=15' } }
      )
    }

    const raw = readFileSync(DATA_PATH, 'utf-8')
    const scanData = JSON.parse(raw)

    if (!scanData || !Array.isArray(scanData.queries)) {
      return NextResponse.json(
        { data: null, message: 'Live query data is malformed.' },
        { status: 200, headers: { 'Cache-Control': 'public, max-age=15' } }
      )
    }

    const { searchParams } = new URL(request.url)
    const sealsOnly = searchParams.get('seals_only') === 'true'

    const queries = sealsOnly
      ? scanData.queries.filter((q: { isSeal: boolean }) => q.isSeal)
      : scanData.queries

    return NextResponse.json(
      {
        data: {
          scanTimestamp: scanData.scanTimestamp,
          scanDurationSeconds: scanData.scanDurationSeconds,
          monitorMode: scanData.monitorMode ?? null,
          monitorStarted: scanData.monitorStarted ?? null,
          monitorUptime: scanData.monitorUptime ?? null,
          newSinceMonitorStart: scanData.newSinceMonitorStart ?? null,
          epoch: scanData.epoch,
          currentTick: scanData.currentTick,
          tickRange: scanData.tickRange,
          stats: scanData.stats,
          totalOnChain: scanData.totalOnChain,
          sealsFound: scanData.sealsFound,
          uniqueSenders: scanData.uniqueSenders ?? null,
          senderBreakdown: scanData.senderBreakdown ?? null,
          queries,
        },
      },
      { status: 200, headers: { 'Cache-Control': 'public, max-age=15' } }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to read live query data' },
      { status: 500 }
    )
  }
}
