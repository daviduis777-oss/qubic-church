import 'server-only'

/**
 * BPP-9000 as the network trains it, read from the public Jetski ANN Explorer API.
 * Score = errors on a year of hourly BTC candles; lower is better; a solution counts when score < threshold.
 * The API cannot sort by score, so "best" is the best among the latest solutions it returns, and says so.
 */
const API = 'https://annexplorer.jetskipool.ai/api/v1'

export type EpochRow = { epoch: number; solutions: number; failed: number; coreVersion: string }
export type NetworkState = {
  ok: boolean
  epoch: number | null
  threshold: number | null
  sample: number
  bestRecent: number | null
  medianRecent: number | null
  recent: { score: number; ageSec: number; computor: string }[]
  epochs: EpochRow[]
  totalSolutions: number | null
  fetchedAt: string
}

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${API}${path}`, { next: { revalidate: 120 }, signal: AbortSignal.timeout(8000) })
  if (!r.ok) throw new Error(`${r.status} ${path}`)
  return (await r.json()) as T
}

type Sol = { epoch: number; computorId: string; threshold?: number; timestamp?: string; verification?: { score?: number; status?: string } }

export async function networkState(): Promise<NetworkState> {
  const empty: NetworkState = { ok: false, epoch: null, threshold: null, sample: 0, bestRecent: null, medianRecent: null, recent: [], epochs: [], totalSolutions: null, fetchedAt: new Date().toISOString() }
  try {
    const [ep, stats] = await Promise.all([
      get<{ items: { epoch: number; solutions: number; coreVersion: string; algoFamily: string; verification?: { failed?: number } }[] }>('/epochs'),
      get<{ totalSolutions?: number }>('/stats').catch(() => ({ totalSolutions: undefined })),
    ])
    const epochs = ep.items
      .filter(e => e.algoFamily === 'bpp9000')
      .map(e => ({ epoch: e.epoch, solutions: e.solutions, failed: e.verification?.failed ?? 0, coreVersion: e.coreVersion }))
      .sort((a, b) => a.epoch - b.epoch)
    const current = epochs.at(-1)?.epoch ?? null
    const sols = current ? await get<{ items: Sol[] }>(`/solutions?algorithm=BPP9000&epoch=${current}&status=verified&limit=200`) : { items: [] }
    const now = Date.now()
    const recent = sols.items
      .filter(s => typeof s.verification?.score === 'number')
      .map(s => ({ score: s.verification!.score!, ageSec: s.timestamp ? Math.max(0, Math.round((now - Date.parse(s.timestamp)) / 1000)) : 0, computor: s.computorId }))
    const scores = recent.map(r => r.score).sort((a, b) => a - b)
    return {
      ok: true,
      epoch: current,
      threshold: sols.items.find(s => s.threshold)?.threshold ?? null,
      sample: scores.length,
      bestRecent: scores[0] ?? null,
      medianRecent: scores.length ? scores[Math.floor(scores.length / 2)]! : null,
      recent: recent.slice(0, 12),
      epochs: epochs.slice(-12),
      totalSolutions: stats.totalSolutions ?? null,
      fetchedAt: new Date().toISOString(),
    }
  } catch {
    return empty
  }
}

/** Qubic epochs start on Wednesday at 12:00 UTC; the live BTC feed is set for epoch 240 (CfB, pinned 20.10.2026). */
export const LIVE_FEED_EPOCH = 240
export function epochStart(epoch: number): Date {
  // Epoch 236 started Wednesday 21 October 2026, 12:00 UTC.
  return new Date(Date.UTC(2026, 9, 21, 12) + (epoch - 236) * 7 * 86400_000)
}
