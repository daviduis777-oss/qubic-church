/**
 * Brain Watch, the part that runs anywhere: a brain (one BPP-9000 network as the core stores it), how it is
 * run forward with the scorer's own rule, how its calls are checked against hours it never saw, and how the
 * brains of an epoch are ranked. Pure code, no network and no storage (brains.ts does that on the server).
 *
 * Source of the genomes: the public Jetski ANN Explorer, which replays the exact core release for every
 * solution and publishes the reconstructed network. We re-run it here (lib/bpp/sim.ts) and keep the result
 * only when our error count matches the verified score, so a brain on this page is never taken on trust.
 */
import { initial, type NetCore, step, wiring } from './sim.ts'

export type BrainRow = {
  hash: string
  computor: string
  epoch: number
  /** errors inside the scored frame, lower is better */
  score: number
  /** rolling-frame position reached, higher is better; 0 for almost every brain so far */
  shift: number
  /** ISO time the solution was published, when the explorer gives it */
  foundAt: string | null
  tick: number | null
}

export type BrainTask = {
  /** unix seconds: the open of the first hour of the task sequence */
  start: number
  /** hours in the loaded sequence (frame + room to shift) */
  hours: number
  /** hours in one scored frame */
  frame: number
}

export type Genome = NetCore &
  BrainRow & {
    /** generations of strict improvement behind it */
    depth: number | null
    parent: string | null
    task: BrainTask
    source: { explorer: string; coreVersion: string | null; coreCommit: string | null; genomeId: string | null; contentId: string | null }
  }

/** Rating as the core compares it: more frame progress first, then fewer errors; ties by time found. */
export function rankBrains<T extends Pick<BrainRow, 'score' | 'shift' | 'foundAt'>>(rows: T[]): T[] {
  return rows.slice().sort((a, b) => b.shift - a.shift || a.score - b.score || (a.foundAt ?? '').localeCompare(b.foundAt ?? ''))
}

/** Every output the brain emits from its saved start state: one trit per emit, 1 up, 0 down, 2 not sure. */
export function emits(c: NetCore, count: number, maxTicks = 200_000): Uint8Array {
  const w = wiring(c)
  const out = new Uint8Array(count)
  let n = 0
  let s: Uint8Array = initial(c)
  for (let t = 0; t < maxTicks && n < count; t++) {
    s = step(c, w, s)
    if (s[c.ctrl] !== 2) out[n++] = s[c.out]!
  }
  return n === count ? out : new Uint8Array(out.buffer, 0, n)
}

/** Errors inside the frame [shift, shift + width), as the scorer counts them (not sure counts as wrong). */
export function frameErrors(em: Uint8Array, targets: Uint8Array, shift: number, width: number): number {
  let e = 0
  for (let i = shift; i < shift + width; i++) if (em[i] !== targets[i]) e++
  return e
}

/**
 * The hour that target i is about: the candle opening at start + (i + 1) hours (the explorer's firstTargetUnix),
 * graded on its rounded close against the previous candle's. Checked on epoch 239: with this alignment the
 * exchange agrees with all 48 last shipped targets and the replay gives the verified score exactly; one hour
 * earlier agrees on about half, as chance would.
 */
export const hourOfIndex = (task: BrainTask, i: number) => task.start + (i + 1) * 3600
export const indexOfHour = (task: BrainTask, hour: number) => (hour - task.start) / 3600 - 1

/** The task's own direction rule: the hour's rounded close against the previous rounded close; flat is up. */
export const dirOf = (prevClose: number, close: number): 0 | 1 => (Math.round(close) - Math.round(prevClose) >= 0 ? 1 : 0)

export type LiveHour = { hour: number; call: 0 | 1 | 2; went: 0 | 1; hit: boolean | null }

/**
 * The brain's calls for hours after the loaded sequence, checked against what bitcoin did. Only hours the
 * sequence never held count (index >= task.hours). A "not sure" call is skipped, not counted wrong: live, a
 * network that says nothing has not called anything.
 */
export function liveCheck(em: Uint8Array, task: BrainTask, closes: { hour: number; close: number }[]): LiveHour[] {
  const byHour = new Map(closes.map(c => [c.hour, c.close]))
  const out: LiveHour[] = []
  for (const c of closes) {
    const i = indexOfHour(task, c.hour)
    if (!Number.isInteger(i) || i < task.hours || i >= em.length) continue
    const prev = byHour.get(c.hour - 3600)
    if (prev == null) continue
    const call = em[i] as 0 | 1 | 2
    const went = dirOf(prev, c.close)
    out.push({ hour: c.hour, call, went, hit: call === 2 ? null : call === went })
  }
  return out.sort((a, b) => a.hour - b.hour)
}

/**
 * Many brains, one call: every hour each brain says up, down or not sure; the side with more votes wins, and a tie
 * (or nobody sure) is "not sure". Arrays may differ in length; the vote runs as far as the shortest one.
 */
export function vote(calls: Uint8Array[]): Uint8Array {
  if (!calls.length) return new Uint8Array(0)
  const n = Math.min(...calls.map(c => c.length))
  const out = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    let up = 0
    let down = 0
    for (const c of calls) {
      if (c[i] === 1) up++
      else if (c[i] === 0) down++
    }
    out[i] = up > down ? 1 : down > up ? 0 : 2
  }
  return out
}

export type LiveStats = { checked: number; hits: number; rate: number | null; unsure: number; from: number | null; to: number | null }

export function liveStats(hours: LiveHour[]): LiveStats {
  const done = hours.filter(h => h.hit != null)
  const hits = done.filter(h => h.hit).length
  return {
    checked: done.length,
    hits,
    rate: done.length ? (hits / done.length) * 100 : null,
    unsure: hours.length - done.length,
    from: hours[0]?.hour ?? null,
    to: hours.at(-1)?.hour ?? null,
  }
}

/* ---------------- the explorer's shapes, compacted ---------------- */

export type ExplorerSolution = {
  hash: string
  computorId: string
  epoch: number
  timestamp?: string
  tickNumber?: number
  verification?: { score?: number; shift?: number; status?: string }
}

export type ExplorerReconstruction = {
  solutionHash?: string
  epoch: number
  score: number
  coreVersion?: string
  coreCommit?: string
  annGenomeId?: string
  antColony?: { depth?: number; parent?: { solutionHash?: string } | null; verifiedShift?: number; annContentId?: string }
  metrics: { population: number; neighborsPerNeuron: number; signalNeuron: number; outputNeuron: number; lutEntriesPerNeuron: number; numberOfWindows: number; sequenceLength?: number; frameShift?: number }
  topology: { nodes: { id: number; initialState: number; lut: { values: number[] } }[]; links: { target: number; slot: number; source: number }[] }
  searchReplay?: { finalPredictions?: { task?: { sourceStartUnix?: number; firstTargetUnix?: number; sourceMovementCount?: number } } }
}

export const EXPLORER = 'https://annexplorer.jetskipool.ai'

/** One row of the top list from the explorer's solution record. */
export function rowOf(s: ExplorerSolution): BrainRow | null {
  if (typeof s.verification?.score !== 'number') return null
  return {
    hash: s.hash,
    computor: s.computorId,
    epoch: s.epoch,
    score: s.verification.score,
    shift: s.verification.shift ?? 0,
    foundAt: s.timestamp ? new Date(Number(s.timestamp)).toISOString() : null,
    tick: s.tickNumber ?? null,
  }
}

/** The genome, compacted from a reconstruction; throws when the shape is not the one we know. */
export function genomeOf(r: ExplorerReconstruction, row: BrainRow): Genome {
  const m = r.metrics
  const k = m.neighborsPerNeuron
  if (m.lutEntriesPerNeuron !== 3 ** k || r.topology.nodes.length !== m.population || r.topology.links.length !== m.population * k) throw new Error('unexpected network shape')
  const nodes = r.topology.nodes.slice().sort((a, b) => a.id - b.id)
  const t = r.searchReplay?.finalPredictions?.task
  const start = t?.sourceStartUnix ?? (t?.firstTargetUnix != null ? t.firstTargetUnix - 3600 : null)
  if (start == null) throw new Error('task start missing')
  return {
    ...row,
    epoch: r.epoch,
    score: r.score,
    shift: r.antColony?.verifiedShift ?? m.frameShift ?? row.shift,
    depth: r.antColony?.depth ?? null,
    parent: r.antColony?.parent?.solutionHash ?? null,
    n: m.population,
    k,
    ctrl: m.signalNeuron,
    out: m.outputNeuron,
    init: nodes.map(n => n.initialState).join(''),
    lut: nodes.map(n => n.lut.values.join('')).join(''),
    links: r.topology.links.map(l => [l.target, l.slot, l.source] as [number, number, number]),
    task: { start, hours: m.sequenceLength ?? t?.sourceMovementCount ?? m.numberOfWindows, frame: m.numberOfWindows },
    source: { explorer: `${EXPLORER}/solutions/${row.hash}`, coreVersion: r.coreVersion ?? null, coreCommit: r.coreCommit ?? null, genomeId: r.annGenomeId ?? null, contentId: r.antColony?.annContentId ?? null },
  }
}

/** The file anyone can download and run: the genome plus how to read it. */
export function genomeFile(g: Genome) {
  const nodes = Array.from({ length: g.n }, (_, i) => ({
    id: i,
    initialState: +g.init[i]!,
    sources: Array.from({ length: g.k }, (_, j) => g.links.find(l => l[0] === i && l[1] === j)?.[2] ?? null),
    lut: Array.from(g.lut.slice(i * 3 ** g.k, (i + 1) * 3 ** g.k), ch => +ch),
  }))
  return {
    format: 'qc-bpp9000-brain-v1',
    about: 'One BPP-9000 network from the Qubic network, as the core stores it. Trits: 0 down, 1 up or flat, 2 not sure. Each tick every neuron reads its three sources from the previous state and looks up lut[s0 + 3*s1 + 9*s2]. Whenever the control neuron is not 2, the output neuron is the call for the next hour.',
    hash: g.hash,
    epoch: g.epoch,
    computor: g.computor,
    foundAt: g.foundAt,
    score: { errors: g.score, shift: g.shift, frameHours: g.task.frame, accuracy: Math.round((1 - g.score / g.task.frame) * 10000) / 100 },
    depth: g.depth,
    parent: g.parent,
    control: g.ctrl,
    output: g.out,
    task: { ...g.task, startIso: new Date(g.task.start * 1000).toISOString(), rule: 'nonnegative rounded close minus previous rounded close is up' },
    nodes,
    source: g.source,
    publishedBy: 'Qubic Church, qubic.church/bpp9000/brains',
  }
}
