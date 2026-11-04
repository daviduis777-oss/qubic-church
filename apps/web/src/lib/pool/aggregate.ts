/**
 * From samples to what Maria says: medians and spread per hardware and epoch, the "few data",
 * "self-reported" and "older" labels, disagreement with the static guide, the algorithm-drift flag,
 * the MEASURED table in her prompt, and the doctor's comparison of one rig with its peers.
 * Pure: no storage, no network. Rates only; never income, profit or projections.
 */
import { MEASURE } from './config.ts'
import type { Verdict } from './hardware.ts'
import {
  fmtRate,
  fmtWindow,
  partKey,
  type Sample,
  type SampleSource,
  type Unit,
} from './measure.ts'

export type EpochStat = {
  epoch: number
  /** rigs with a sol/h value */
  n: number
  nPool: number
  nLog: number
  nField: number
  /** sol/h per unit (per card for GPU-only rigs, per rig otherwise) */
  median?: number
  p25?: number
  p75?: number
  /** sol/h per whole rig */
  medianRig?: number
  /** it/s as the miners print it, per rig */
  medianGpuIts?: number
  medianCpuIts?: number
  /** rigs with an it/s readout */
  nIts: number
}

export type Drift = { from: number; to: number; pct: number }

export type HardwareRow = {
  key: string
  label: string
  unit: Unit
  latest: EpochStat
  previous?: EpochStat
  /** pool-sourced rigs and the epochs they span, within the recent window */
  poolRigs: number
  poolEpochs: number
  poolMedian?: number
  older: boolean
  drift?: Drift
  tags: string[]
}

export type Summary = { epoch: number; at: number; rows: HardwareRow[] }

/** Type-7 quantile on a sorted copy. */
export function quantile(values: number[], q: number): number | undefined {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (!v.length) return undefined
  const pos = (v.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return v[lo]! + (v[hi]! - v[lo]!) * (pos - lo)
}
export const median = (v: number[]) => quantile(v, 0.5)

/** sol/h per unit: per card for GPU-only rigs, per rig for CPU-only and GPU+CPU rigs. */
export function perUnit(s: Sample): number | undefined {
  const r = s.result.solPerHour
  if (r === undefined || !Number.isFinite(r)) return undefined
  const { unit } = partKey(s.hw)
  return unit === 'card' ? r / Math.max(1, s.hw.gpuCount) : r
}

/** Keep the newest sample per dedupe hash and epoch: a rig saved twice in a day counts once. */
export function dedupe(samples: Sample[]): Sample[] {
  const best = new Map<string, Sample>()
  const rest: Sample[] = []
  for (const s of samples) {
    if (!s.dedupe) {
      rest.push(s)
      continue
    }
    const k = `${s.dedupe}|${s.result.epoch}`
    const cur = best.get(k)
    if (!cur || s.at >= cur.at) best.set(k, s) // a tie goes to the later row in the list
  }
  return [...rest, ...best.values()]
}

function epochStat(epoch: number, list: Sample[]): EpochStat {
  const rated = list.filter(s => perUnit(s) !== undefined)
  const units = rated.map(s => perUnit(s)!)
  const count = (src: SampleSource) =>
    rated.filter(s => s.source === src).length
  const gIts = list
    .map(s => s.result.gpuIts)
    .filter((x): x is number => x !== undefined)
  const cIts = list
    .map(s => s.result.cpuIts)
    .filter((x): x is number => x !== undefined)
  return {
    epoch,
    n: rated.length,
    nPool: count('pool'),
    nLog: count('log'),
    nField: count('field'),
    median: median(units),
    p25: quantile(units, 0.25),
    p75: quantile(units, 0.75),
    medianRig: median(rated.map(s => s.result.solPerHour!)),
    medianGpuIts: median(gIts),
    medianCpuIts: median(cIts),
    nIts: list.filter(
      s => s.result.gpuIts !== undefined || s.result.cpuIts !== undefined
    ).length,
  }
}

/**
 * Per hardware key and epoch: median sol/h per card (and per rig), median it/s, n rigs, spread (p25 to p75).
 * The newest epoch with data leads each row; the one before it decides the drift flag.
 */
export function aggregate(
  samples: Sample[],
  currentEpoch: number,
  at = Date.now()
): Summary {
  const groups = new Map<
    string,
    { label: string; unit: Unit; byEpoch: Map<number, Sample[]> }
  >()
  for (const s of dedupe(samples)) {
    const p = partKey(s.hw)
    const g = groups.get(p.key) ?? {
      label: p.label,
      unit: p.unit,
      byEpoch: new Map(),
    }
    const l = g.byEpoch.get(s.result.epoch) ?? []
    l.push(s)
    g.byEpoch.set(s.result.epoch, l)
    groups.set(p.key, g)
  }

  const rows: HardwareRow[] = []
  for (const [key, g] of groups) {
    const epochs = [...g.byEpoch.keys()].sort((a, b) => b - a)
    const stats = epochs.map(e => epochStat(e, g.byEpoch.get(e)!))
    const latest = stats.find(x => x.n > 0) ?? stats[0]!
    const previous = stats.find(x => x.epoch === latest.epoch - 1 && x.n > 0)
    const older = currentEpoch - latest.epoch > MEASURE.olderAfterEpochs

    const recent = epochs.filter(
      e => currentEpoch - e <= MEASURE.olderAfterEpochs
    )
    const pool = recent.flatMap(e =>
      g.byEpoch
        .get(e)!
        .filter(s => s.source === 'pool' && perUnit(s) !== undefined)
    )
    const poolEpochs = new Set(pool.map(s => s.result.epoch)).size

    let drift: Drift | undefined
    if (previous?.median && latest.median !== undefined) {
      const pct = (latest.median / previous.median - 1) * 100
      if (Math.abs(pct) > MEASURE.driftPct)
        drift = { from: previous.epoch, to: latest.epoch, pct: Math.round(pct) }
    }

    const tags: string[] = []
    if (latest.nField === latest.n && latest.n > 0) tags.push('our own run')
    if (latest.n < MEASURE.fewData) tags.push('few data')
    if (latest.n > 0 && latest.nPool + latest.nField === 0)
      tags.push('self-reported')
    if (older) tags.push('older')

    rows.push({
      key,
      label: g.label,
      unit: g.unit,
      latest,
      previous,
      poolRigs: pool.length,
      poolEpochs,
      poolMedian: median(pool.map(s => perUnit(s)!)),
      older,
      drift,
      tags,
    })
  }
  rows.sort((a, b) => (b.latest.median ?? -1) - (a.latest.median ?? -1))
  return { epoch: currentEpoch, at, rows }
}

export const rowFor = (sum: Summary | null | undefined, key: string) =>
  sum?.rows.find(r => r.key === key)

/* ---------------- the guide against the measurements ---------------- */

export type Tier = 'top' | 'mid' | 'bottom'

/** Where a median falls among the other rows of the same unit. Needs MEASURE.minRowsForRank rows, or nothing is claimed. */
export function tierOf(
  value: number | undefined,
  unit: Unit,
  rows: HardwareRow[]
): { tier: Tier; of: number } | undefined {
  if (value === undefined) return undefined
  const peers = rows
    .filter(r => r.unit === unit && r.latest.median !== undefined)
    .map(r => r.latest.median!)
  if (peers.length < MEASURE.minRowsForRank) return undefined
  const below = peers.filter(v => v < value).length
  const rank = below / Math.max(1, peers.length - 1)
  return {
    tier:
      rank >= MEASURE.topQuantile
        ? 'top'
        : rank <= MEASURE.bottomQuantile
          ? 'bottom'
          : 'mid',
    of: peers.length,
  }
}

const disagrees = (v: Verdict, t: Tier) =>
  ((v === 'Skip' || v === 'Works') && t === 'top') ||
  ((v === 'Golden' || v === 'Good') && t === 'bottom')
const unitWord = (u: Unit) => (u === 'card' ? 'per card' : 'per rig')

export type Measured = {
  key: string
  /** "Measured: median 610 sol/h per card (1 rig, epoch 233)" */
  line: string
  spread?: string
  tags: string[]
  /** said plainly when the measurements and the static verdict disagree */
  disagree?: string
  flippedFrom?: Verdict
}

/** The measured line for one picker card, and the verdict after the flip rule. Never flips silently. */
export function judge(
  row: HardwareRow,
  rows: HardwareRow[],
  verdict: Verdict
): { measured: Measured; verdict: Verdict } {
  const L = row.latest
  const nTxt = (n: number) => `${n} rig${n === 1 ? '' : 's'}`
  const line =
    L.median !== undefined
      ? `Measured: median ${fmtRate(L.median)} sol/h ${unitWord(row.unit)} (${nTxt(L.n)}, epoch ${L.epoch})`
      : `Measured: median ${fmtRate(L.medianGpuIts ?? L.medianCpuIts ?? 0)} it/s (${nTxt(L.nIts)}, epoch ${L.epoch}); no solution counts yet`
  const spread =
    L.median !== undefined &&
    L.n > 1 &&
    L.p25 !== undefined &&
    L.p75 !== undefined
      ? `${fmtRate(L.p25)} to ${fmtRate(L.p75)} sol/h`
      : undefined
  const measured: Measured = { key: row.key, line, spread, tags: row.tags }

  const t = tierOf(L.median, row.unit, rows)
  if (!t || !disagrees(verdict, t.tier)) return { measured, verdict }

  const where = t.tier === 'top' ? 'top quarter' : 'bottom quarter'
  const poolTier = tierOf(row.poolMedian, row.unit, rows)
  const strong =
    row.poolRigs >= MEASURE.flipMinPoolRigs &&
    row.poolEpochs >= MEASURE.flipMinEpochs &&
    poolTier &&
    disagrees(verdict, poolTier.tier)
  if (strong) {
    const next: Verdict = t.tier === 'top' ? 'Good' : 'Works'
    measured.flippedFrom = verdict
    measured.disagree = `Our measurements disagree with the guide, so the verdict changed from ${verdict} to ${next}: ${row.poolRigs} pool-reported rigs over ${row.poolEpochs} epochs put it in the ${where} of ${t.of} we track.`
    return { measured, verdict: next }
  }
  measured.disagree = `Our measurements disagree with the guide: this measures in the ${where} of ${t.of} we track, yet the guide says ${verdict}. The guide stands until ${MEASURE.flipMinPoolRigs} pool-reported rigs over ${MEASURE.flipMinEpochs} epochs agree.`
  return { measured, verdict }
}

/* ---------------- Maria's prompt ---------------- */

/**
 * The MEASURED table for the cached system prompt. Build it from a snapshot that changes once per epoch
 * (store.ts passes only samples from finished epochs), so the cached block stays stable for a week.
 */
export function measuredBlock(sum: Summary | null | undefined): string {
  const head = `MEASURED (our miners' results, computed by code from saved runs; snapshot for epoch ${sum?.epoch ?? '?'})
- Prefer these numbers over guide figures when n is ${MEASURE.fewData} or more. With fewer, give both and say the data is thin.
- Always state n and the epoch when you use a row. Rows marked older are more than ${MEASURE.olderAfterEpochs} epochs old: the algorithm changes every few weeks.
- self-reported = from pasted logs only. These are rates, never income: do not turn them into money, except the user's own cost per solution from their own daily cost.`
  if (!sum?.rows.length) return `${head}\n- No measured rows yet.`
  const rows = sum.rows
    .filter(r => r.latest.median !== undefined || r.latest.nIts > 0)
    .slice(0, 24)
  const table = rows.map(r => {
    const L = r.latest
    const rate =
      L.median !== undefined
        ? `${fmtRate(L.median)} sol/h ${unitWord(r.unit)}`
        : 'no sol/h'
    const spread =
      L.n > 1 && L.p25 !== undefined
        ? `, p25 to p75 ${fmtRate(L.p25)} to ${fmtRate(L.p75!)}`
        : ''
    const rig =
      r.unit === 'card' && L.medianRig !== undefined
        ? `, ${fmtRate(L.medianRig)} per rig`
        : ''
    const its = [
      L.medianGpuIts !== undefined
        ? `CUDA ${fmtRate(L.medianGpuIts)} it/s`
        : '',
      L.medianCpuIts !== undefined ? `CPU ${fmtRate(L.medianCpuIts)} it/s` : '',
    ]
      .filter(Boolean)
      .join(', ')
    return `- ${r.label}: ${rate}${spread}${rig}${its ? `; ${its}` : ''}; n ${L.n || L.nIts}, epoch ${L.epoch}${r.tags.length ? ` [${r.tags.join(', ')}]` : ''}`
  })
  const drift = driftLines(sum)
  return [
    head,
    ...table,
    ...(drift.length ? ['ALGORITHM WATCH', ...drift] : []),
  ].join('\n')
}

/** "RTX 4090 per card moved +45% from epoch 236 to 237: the algorithm may have changed." */
export function driftLines(sum: Summary | null | undefined): string[] {
  return (sum?.rows ?? [])
    .filter(r => r.drift)
    .map(
      r =>
        `- ${r.label} ${unitWord(r.unit)} moved ${r.drift!.pct > 0 ? '+' : ''}${r.drift!.pct}% from epoch ${r.drift!.from} to ${r.drift!.to} (n ${r.previous?.n ?? 0} and ${r.latest.n}): the algorithm may have changed. Say so when rates come up, and treat older numbers as stale.`
    )
}

/* ---------------- the doctor: one rig against its peers ---------------- */

export type CauseId = 'warmup' | 'cpu-feed' | 'pcie' | 'power' | 'thermal'
export type Cause = { id: CauseId; title: string; text: string; seen: boolean }

export type RunInput = {
  key: string
  unit: Unit
  gpuCount: number
  solPerHour?: number
  windowMin?: number
  uptimeMin?: number
  threads?: number
  rejected?: number
  maxTempC?: number
  /** doctor finding ids seen in the same log */
  findings?: string[]
}

export type Comparison =
  | { kind: 'early'; text: string }
  | { kind: 'no-data'; text: string }
  | { kind: 'no-rate'; text: string }
  | {
      kind: 'compared'
      title: string
      /** the numbers and notes, without the title */
      detail: string
      yours: number
      row: HardwareRow
      below: boolean
      above: boolean
      warm: boolean
      text: string
      causes: Cause[]
    }

/**
 * Compare the user's rate with the median for their hardware. Below p25 lists the likely causes from the
 * rules, the ones the log shows first. Field rule: do not judge in the first 20 minutes; the first 1 to 2
 * hours overstate the rate by about 1.3 to 1.5x.
 */
export function compareRun(
  run: RunInput,
  sum: Summary | null | undefined
): Comparison {
  const span = run.uptimeMin ?? run.windowMin
  if (span !== undefined && span < MEASURE.minWindowMin)
    return {
      kind: 'early',
      text: `Too early to judge: under ${MEASURE.minWindowMin} minutes. Solutions come in bursts. Paste the log again after 2 hours.`,
    }
  const row = rowFor(sum, run.key)
  if (!row || row.latest.median === undefined)
    return {
      kind: 'no-data',
      text: 'No measured rigs like this one yet. Saving this result gives Maria a first number.',
    }
  if (run.solPerHour === undefined)
    return {
      kind: 'no-rate',
      text: `${row.latest.n} rigs like this one are measured. Add solutions and hours below to compare.`,
    }

  const yours =
    run.unit === 'card'
      ? run.solPerHour / Math.max(1, run.gpuCount)
      : run.solPerHour
  const L = row.latest
  const warm = span === undefined || span < MEASURE.warmupMin
  const below = L.p25 !== undefined && yours < L.p25
  const above = L.p75 !== undefined && yours > L.p75
  const vs = `${fmtRate(yours)} sol/h ${unitWord(run.unit)} against a median of ${fmtRate(L.median!)} (${L.n} rig${L.n === 1 ? '' : 's'}, epoch ${L.epoch}${L.n > 1 ? `, p25 ${fmtRate(L.p25!)}` : ''})`
  const warmNote = warm
    ? ` It is under 2 hours in, and early rates run high by about ${MEASURE.warmupFactor}, so the settled rate will likely be lower.`
    : ''
  // "most rigs" only when there are enough of them to say so
  const peers = L.n === 1 ? 'the one rig we measured' : L.n < MEASURE.fewData ? `the ${L.n} rigs we measured` : 'most rigs like it'
  const title = below ? `Slower than ${peers}` : above ? `Faster than ${peers}` : `In line with ${L.n < MEASURE.fewData ? peers : 'rigs like it'}`
  const oldNote = row.older ? ` That measurement is from epoch ${L.epoch}, more than ${MEASURE.olderAfterEpochs} epochs ago; the algorithm may have moved since.` : ''
  const detail = `${vs.charAt(0).toUpperCase()}${vs.slice(1)}.${warmNote}${oldNote}`
  const text = `${title}: ${vs}.${warmNote}${oldNote}`

  const causes: Cause[] = []
  if (below) {
    const f = new Set(run.findings ?? [])
    const gpus = Math.max(1, run.gpuCount)
    const gpuRig = run.key.startsWith('gpu|') || run.key.startsWith('mix|')
    if (warm)
      causes.push({
        id: 'warmup',
        title: 'Short window',
        text: `Solutions come in bursts, so a count ${span === undefined ? 'over an unknown time' : `over ${fmtWindow(span)}`} swings both ways. Judge by the wallet total on the pool after a few hours, not the per-worker counter.`,
        seen: true,
      })
    if (gpuRig) {
      const thin = run.threads !== undefined && run.threads / gpus < 12
      causes.push({
        id: 'cpu-feed',
        title: 'CPU feeding the cards',
        text: `Keep at least 8 CPU cores, 12 threads, per GPU.${run.threads !== undefined ? ` This log shows ${run.threads} threads for ${gpus} card${gpus > 1 ? 's' : ''}.` : ''}${run.rejected ? ` ${run.rejected} rejected or expired candidates point here too.` : ''}`,
        seen: thin || Boolean(run.rejected) || f.has('rejected'),
      })
      causes.push({
        id: 'pcie',
        title: 'PCIe link',
        text: 'PCIe 4.0 x8 or 3.0 x16 per card; x1 or x4 risers starve a card. Check: nvidia-smi -q | grep -A2 "Link Width"',
        seen: false,
      })
      causes.push({
        id: 'power',
        title: 'Power limit',
        text: 'If clocks are held by power and you did not set a limit, raise it toward the default: sudo nvidia-smi -pl <WATTS>.',
        seen: f.has('gpu-power'),
      })
    }
    causes.push({
      id: 'thermal',
      title: 'Heat',
      text: 'Throttling slows every engine. Improve airflow and clean the fans.',
      seen: f.has('thermal') || (run.maxTempC ?? 0) >= 85,
    })
    causes.sort((a, b) => Number(b.seen) - Number(a.seen))
  }
  return { kind: 'compared', yours, row, below, above, warm, title, detail, text, causes }
}

/** Rows for "What our miners measure": per-card rows first by median, then per-rig rows. */
export function topRows(
  sum: Summary | null | undefined,
  limit = 8
): HardwareRow[] {
  const rated = (sum?.rows ?? []).filter(r => r.latest.median !== undefined)
  const by = (u: Unit) =>
    rated
      .filter(r => r.unit === u)
      .sort((a, b) => b.latest.median! - a.latest.median!)
  return [...by('card'), ...by('rig')].slice(0, limit)
}
