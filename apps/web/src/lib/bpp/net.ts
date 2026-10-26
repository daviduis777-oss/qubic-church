import 'server-only'
import snapshot from '@/data/bpp/net-snapshot.json'
import type { NetData } from './sim'

/**
 * The network shown on /bpp9000: the best-scoring solution among the latest verified ones in the current epoch,
 * read from the public Jetski ANN Explorer (reconstruction = full topology, LUTs and the training sequence).
 * Falls back to a saved epoch-236 solution if the explorer is down or its format changes.
 */
const API = 'https://annexplorer.jetskipool.ai/api/v1'

async function get<T>(path: string, revalidate = 600): Promise<T> {
  const r = await fetch(`${API}${path}`, { next: { revalidate }, signal: AbortSignal.timeout(12000) })
  if (!r.ok) throw new Error(`${r.status} ${path}`)
  return (await r.json()) as T
}

type Sol = { hash: string; computorId: string; epoch: number; threshold?: number; verification?: { score?: number } }
type Rec = {
  epoch: number
  score: number
  threshold?: number
  antColony?: { depth?: number }
  metrics: { population: number; neighborsPerNeuron: number; signalNeuron: number; outputNeuron: number; numberOfWindows: number; lutEntriesPerNeuron: number }
  topology: { nodes: { id: number; initialState: number; lut: { values: number[] } }[]; links: { target: number; slot: number; source: number }[] }
  searchReplay: {
    counts?: { acceptedSteps?: number; rejectedSteps?: number }
    finalPredictions: {
      expected: string
      task: { firstTargetUnix: number; roundedCloseBeforeFirstTarget: number; sourceMovementCount: number }
      taskMovements: string
      taskMovementBits: number
    }
  }
}

function dailyCloses(fp: Rec['searchReplay']['finalPredictions'], windows: number): number[] {
  const b = Buffer.from(fp.taskMovements, 'base64')
  const bits = fp.taskMovementBits
  const out: number[] = []
  let p = fp.task.roundedCloseBeforeFirstTarget
  const n = Math.min(fp.task.sourceMovementCount, windows)
  for (let i = 0; i < n; i++) {
    if (i % 24 === 0) out.push(p)
    let v = 0
    for (let k = 0; k < bits; k++) {
      const pos = i * bits + k
      if ((b[pos >> 3]! >> (pos & 7)) & 1) v |= 1 << k
    }
    if (v & (1 << (bits - 1))) v -= 1 << bits
    p += v
  }
  out.push(p)
  return out
}

export async function bestNetwork(): Promise<NetData> {
  try {
    const ep = await get<{ items: { epoch: number; algoFamily: string; solutions: number }[] }>('/epochs', 300)
    const cur = ep.items.filter(e => e.algoFamily === 'bpp9000').sort((a, b) => b.epoch - a.epoch)[0]
    if (!cur) throw new Error('no epoch')
    const list = await get<{ items: Sol[] }>(`/solutions?algorithm=BPP9000&epoch=${cur.epoch}&status=verified&limit=100`, 600)
    const best = list.items.filter(s => typeof s.verification?.score === 'number').sort((a, b) => a.verification!.score! - b.verification!.score!)[0]
    if (!best) throw new Error('no solutions')
    const r = await get<Rec>(`/solutions/${best.hash}/reconstruction`, 3600)
    const m = r.metrics
    const k = m.neighborsPerNeuron
    if (m.lutEntriesPerNeuron !== 3 ** k || r.topology.nodes.length !== m.population) throw new Error('format')
    const nodes = r.topology.nodes.slice().sort((a, b) => a.id - b.id)
    return {
      hash: best.hash,
      computor: best.computorId,
      epoch: r.epoch,
      score: r.score,
      threshold: r.threshold ?? best.threshold ?? null,
      n: m.population,
      k,
      ctrl: m.signalNeuron,
      out: m.outputNeuron,
      init: nodes.map(n => n.initialState).join(''),
      lut: nodes.map(n => n.lut.values.join('')).join(''),
      links: r.topology.links.map(l => [l.target, l.slot, l.source] as [number, number, number]),
      exp: r.searchReplay.finalPredictions.expected,
      windows: m.numberOfWindows,
      t0: r.searchReplay.finalPredictions.task.firstTargetUnix,
      daily: dailyCloses(r.searchReplay.finalPredictions, m.numberOfWindows),
      depth: r.antColony?.depth ?? null,
      accepted: r.searchReplay.counts?.acceptedSteps ?? null,
      rejected: r.searchReplay.counts?.rejectedSteps ?? null,
      epochSolutions: cur.solutions,
      live: true,
    }
  } catch {
    return { ...(snapshot as unknown as NetData), live: false }
  }
}
