import { NextRequest, NextResponse } from 'next/server'
import qubicLib from '@qubic-lib/qubic-ts-library'

const { QubicHelper, QubicTransaction } = qubicLib

// Server-side only — MASTER_SEED never leaves the server
const MASTER_SEED = process.env.MASTER_SEED
const MASTER_IDENTITY = process.env.MASTER_IDENTITY

const RPC_ENDPOINTS = [
  'https://rpc.qubic.org/v1',
  'https://rpc.qubic.li/v1',
  'https://rpc.qubic.network/v1',
]

// Rate limiting: max 1 transaction per 30 seconds
let lastTxTime = 0
const TX_COOLDOWN_MS = 30_000

async function rpcCall(endpoint: string, options?: RequestInit) {
  for (const base of RPC_ENDPOINTS) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(`${base}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...options?.headers },
      })
      clearTimeout(timeout)
      if (!res.ok) continue
      return res.json()
    } catch {
      continue
    }
  }
  return null
}

/**
 * GET /api/oracle — Get master account balance and network status
 */
export async function GET() {
  if (!MASTER_SEED || !MASTER_IDENTITY) {
    return NextResponse.json({ error: 'Master account not configured' }, { status: 503 })
  }

  try {
    const [balanceData, tickData] = await Promise.all([
      rpcCall(`/balances/${MASTER_IDENTITY}`),
      rpcCall('/tick-info'),
    ])

    const balance = balanceData?.balance
    const tickInfo = tickData?.tickInfo ?? tickData

    return NextResponse.json({
      identity: MASTER_IDENTITY,
      balance: balance ? Number(balance.balance) : 0,
      incomingTx: balance?.numberOfIncomingTransfers ?? 0,
      outgoingTx: balance?.numberOfOutgoingTransfers ?? 0,
      lastInTick: balance?.latestIncomingTransferTick ?? 0,
      lastOutTick: balance?.latestOutgoingTransferTick ?? 0,
      currentTick: tickInfo?.tick ?? 0,
      epoch: tickInfo?.epoch ?? 0,
      cooldownRemaining: Math.max(0, TX_COOLDOWN_MS - (Date.now() - lastTxTime)),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/oracle — Send QU transaction
 *
 * Body: { destination: string, amount: number }
 */
export async function POST(request: NextRequest) {
  if (!MASTER_SEED || !MASTER_IDENTITY) {
    return NextResponse.json({ error: 'Master account not configured' }, { status: 503 })
  }

  // Rate limit
  const now = Date.now()
  if (now - lastTxTime < TX_COOLDOWN_MS) {
    const remaining = Math.ceil((TX_COOLDOWN_MS - (now - lastTxTime)) / 1000)
    return NextResponse.json(
      { error: `Rate limited. Wait ${remaining}s before next transaction.` },
      { status: 429 }
    )
  }

  let body: { destination?: string; amount?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { destination, amount } = body

  // Validate destination
  if (!destination || typeof destination !== 'string') {
    return NextResponse.json({ error: 'Missing destination address' }, { status: 400 })
  }
  if (destination.length !== 60 || !/^[A-Z]+$/.test(destination)) {
    return NextResponse.json({ error: 'Invalid Qubic address format (60 uppercase letters)' }, { status: 400 })
  }

  // Validate amount
  if (!amount || typeof amount !== 'number' || amount < 1) {
    return NextResponse.json({ error: 'Amount must be at least 1 QU' }, { status: 400 })
  }
  if (amount > 10_000) {
    return NextResponse.json({ error: 'Maximum 10,000 QU per transaction (safety limit)' }, { status: 400 })
  }

  // Don't send to self
  if (destination === MASTER_IDENTITY) {
    return NextResponse.json({ error: 'Cannot send to self' }, { status: 400 })
  }

  try {
    // Get current tick
    const tickData = await rpcCall('/tick-info')
    const currentTick = tickData?.tickInfo?.tick ?? tickData?.tick
    if (!currentTick) {
      return NextResponse.json({ error: 'Cannot get current tick from network' }, { status: 502 })
    }

    // Target tick: current + 5 (gives time for propagation)
    const targetTick = currentTick + 5

    // Build and sign transaction using QubicHelper
    const helper = new QubicHelper()

    const txBytes = await helper.createTransaction(
      MASTER_SEED,
      destination,
      amount,
      targetTick
    )

    // Encode to base64 for RPC broadcast
    const tx = new QubicTransaction()
    const encodedTx = tx.encodeTransactionToBase64(txBytes)

    // Broadcast transaction
    const broadcastResult = await rpcCall('/broadcast-transaction', {
      method: 'POST',
      body: JSON.stringify({
        encodedTransaction: encodedTx,
      }),
    })

    if (!broadcastResult) {
      return NextResponse.json({ error: 'Failed to broadcast transaction' }, { status: 502 })
    }

    // Update rate limit timestamp
    lastTxTime = Date.now()

    return NextResponse.json({
      success: true,
      from: MASTER_IDENTITY,
      to: destination,
      amount,
      targetTick,
      currentTick,
      broadcastResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Oracle API] Transaction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transaction failed' },
      { status: 500 }
    )
  }
}
