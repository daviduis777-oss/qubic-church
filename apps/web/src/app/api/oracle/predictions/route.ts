import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const DASHBOARD_PATH = join(process.cwd(), 'public/data/oracle-dashboard.json')
const LEGACY_PATH = join(process.cwd(), 'public/data/oracle-predictions.json')

/**
 * GET /api/oracle/predictions — Read oracle prediction + strategy data
 *
 * Prefers oracle-dashboard.json (from prediction engine).
 * Falls back to oracle-predictions.json (legacy).
 */
export async function GET() {
  try {
    // Try dashboard export first (richer data)
    if (existsSync(DASHBOARD_PATH)) {
      const raw = readFileSync(DASHBOARD_PATH, 'utf-8')
      const dashboard = JSON.parse(raw)

      const predictions = dashboard.recentPredictions ?? []
      const stats = dashboard.summary ?? {}

      // Map DB snake_case predictions to camelCase for frontend
      const mappedPredictions = predictions.map((p: Record<string, unknown>) => ({
        id: p.id,
        pair: p.pair,
        direction: p.direction,
        threshold: p.threshold,
        horizonHours: p.horizon_hours,
        priceAtCommit: p.price_at_commit,
        commitTimestamp: p.commit_timestamp,
        expiresAt: p.expires_at,
        commitHash: p.commit_hash,
        commitTick: p.commit_tick,
        commitTxId: p.commit_tx_id,
        epoch: p.epoch,
        status: p.status,
        outcome: p.outcome,
        priceAtExpiry: p.price_at_expiry,
        revealTick: p.reveal_tick,
        strategy: p.strategy,
        confidence: p.confidence,
        verificationJson: p.verification_json,
      }))

      return NextResponse.json(
        {
          data: {
            predictions: mappedPredictions,
            stats: {
              total: stats.totalPredictions ?? 0,
              real: stats.totalPredictions ?? 0,
              symbolic: 0,
              correct: stats.correct ?? 0,
              incorrect: stats.incorrect ?? 0,
              committed: stats.committed ?? 0,
              revealed: 0,
              accuracy: stats.overallAccuracy ?? null,
            },
            strategyPerformance: dashboard.strategyPerformance ?? [],
            pairPerformance: dashboard.pairPerformance ?? [],
            horizonPerformance: dashboard.horizonPerformance ?? [],
            accuracyOverTime: dashboard.accuracyOverTime ?? [],
            confidenceCalibration: dashboard.confidenceCalibration ?? [],
            pairHorizonMatrix: dashboard.pairHorizonMatrix ?? [],
            streakAnalysis: dashboard.streakAnalysis ?? null,
            backtestResults: dashboard.backtestResults ?? [],
            strategies: dashboard.strategies ?? [],
            oracleExplorer: dashboard.oracleExplorer ?? null,
            costEfficiency: dashboard.costEfficiency ?? null,
            lastUpdated: dashboard.generatedAt ?? null,
          },
        },
        { status: 200, headers: { 'Cache-Control': 'public, max-age=15' } }
      )
    }

    // Fallback to legacy predictions file
    if (existsSync(LEGACY_PATH)) {
      const raw = readFileSync(LEGACY_PATH, 'utf-8')
      const parsed = JSON.parse(raw)
      const predictions = Array.isArray(parsed) ? parsed : (parsed.predictions ?? [])

      if (!Array.isArray(predictions) || predictions.length === 0) {
        return NextResponse.json(
          { data: null, message: 'Prediction list is empty.' },
          { status: 200, headers: { 'Cache-Control': 'public, max-age=15' } }
        )
      }

      const real = predictions.filter((p: { type?: string }) => p.type !== 'symbolic')
      const correct = real.filter((p: { status: string }) => p.status === 'correct').length
      const incorrect = real.filter((p: { status: string }) => p.status === 'incorrect').length
      const committed = real.filter((p: { status: string }) => p.status === 'committed').length
      const total = correct + incorrect
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : null

      return NextResponse.json(
        {
          data: {
            predictions,
            stats: {
              total: predictions.length,
              real: real.length,
              symbolic: predictions.length - real.length,
              correct,
              incorrect,
              committed,
              revealed: 0,
              accuracy,
            },
            lastUpdated: predictions[predictions.length - 1]?.timestamp ?? null,
          },
        },
        { status: 200, headers: { 'Cache-Control': 'public, max-age=15' } }
      )
    }

    return NextResponse.json(
      { data: null, message: 'No predictions yet. Run ORACLE_PROPHECY.mjs to start predicting.' },
      { status: 200, headers: { 'Cache-Control': 'public, max-age=15' } }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to read predictions' },
      { status: 500 }
    )
  }
}
