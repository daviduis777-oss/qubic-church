import 'server-only'
import { epochWindow } from '@/content/epochs'
import { brainGenome, liveOf, shelf, topBrains } from '@/lib/bpp/brains'
import type { LiveStats } from '@/lib/bpp/brains-view'
import { kvGetJson } from '@/lib/bpp/store'
import { empty, history, type Incident, type NetState } from '@/lib/network/status-view'

export type EpochNumbers = {
  solutions: number | null
  best: { hash: string; computor: string; score: number; homework: number; exam: LiveStats | null } | null
  stalls: Incident[]
}

/** The numbers the site itself keeps for one epoch: brains grown, the best of them with its exam, and stalls seen. */
export async function epochNumbers(epoch: number): Promise<EpochNumbers> {
  const { start, end } = epochWindow(epoch)
  const net = (await kvGetJson<NetState>('net:state').catch(() => null)) ?? empty()
  const stalls = history(net).filter(i => i.from < end && (i.to ?? Date.now()) > start)

  const list = await topBrains(epoch).catch(async () => {
    const sh = await shelf(epoch).catch(() => null)
    return sh ? { rows: sh.rows, solutions: sh.solutions } : null
  })
  const row = list?.rows[0]
  let best: EpochNumbers['best'] = null
  if (row) {
    const g = await brainGenome(row.hash).catch(() => null)
    const live = g?.check.matches ? await liveOf(g).catch(() => null) : null
    const frame = g?.task.frame ?? 8760
    best = { hash: row.hash, computor: row.computor, score: row.score, homework: (1 - row.score / frame) * 100, exam: live?.all ?? null }
  }
  return { solutions: list?.solutions ?? null, best, stalls }
}
