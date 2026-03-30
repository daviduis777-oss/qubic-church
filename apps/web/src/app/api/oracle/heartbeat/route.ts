import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_PATH = join(process.cwd(), 'public/data/oracle-heartbeat.json')
const HISTORY_PATH = join(process.cwd(), 'public/data/oracle-heartbeat-history.json')

/**
 * GET /api/oracle/heartbeat — Read oracle protocol health data
 */
export async function GET() {
  try {
    let snapshot = null
    let history = null

    if (existsSync(DATA_PATH)) {
      snapshot = JSON.parse(readFileSync(DATA_PATH, 'utf-8'))
    }

    if (existsSync(HISTORY_PATH)) {
      history = JSON.parse(readFileSync(HISTORY_PATH, 'utf-8'))
    }

    if (!snapshot && !history) {
      return NextResponse.json(
        { data: null, message: 'No heartbeat data yet. Run ORACLE_HEARTBEAT.mjs to scan protocol.' },
        { status: 200, headers: { 'Cache-Control': 'public, max-age=15' } }
      )
    }

    return NextResponse.json(
      {
        data: {
          snapshot,
          history: history ?? [],
          lastUpdated: snapshot?.timestamp ?? null,
        },
      },
      { status: 200, headers: { 'Cache-Control': 'public, max-age=15' } }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to read heartbeat data' },
      { status: 500 }
    )
  }
}
