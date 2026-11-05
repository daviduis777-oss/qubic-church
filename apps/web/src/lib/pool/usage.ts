/**
 * "Who mines with what": from the measured samples (and the pool's, once it reports them), the share of
 * rigs by GPU model and by CPU family, the median sol/h for each, and the most common setups.
 * Pure. Each rig counts once: the newest sample per dedupe hash; our own field runs count once each.
 */
import { dedupe, median, perUnit } from './aggregate.ts'
import { MEASURE, OS_LABEL, type Os } from './config.ts'
import { MODE_LABEL, type Sample } from './measure.ts'

export type Bar = {
  key: string
  label: string
  /** rigs */
  n: number
  /** share of all rigs, 0..1 */
  share: number
  /** median sol/h per card (GPU rows) or per rig (CPU rows), when rated rigs exist */
  median?: number
  /** rigs behind the median */
  nRated: number
  unit: 'card' | 'rig'
  tags: string[]
}

export type Usage = {
  /** current epoch, and the epochs the rigs come from */
  epoch: number
  from: number
  to: number
  /** rigs counted */
  n: number
  /** of those, saved rigs that are not our own test runs (pool-reported and self-reported) */
  real: number
  few: boolean
  older: boolean
  gpu: Bar[]
  cpu: Bar[]
  mode: Bar[]
  os: Bar[]
  owner: Bar[]
  /** the most common whole setup: mode, system, own or rented */
  top?: { label: string; n: number }
}

/** "Ryzen 9 7950X" -> "Ryzen 9", "Xeon E5-2696 v3" -> "Xeon E5", "EPYC 7B13" -> "EPYC". */
export function cpuFamily(cpu: string): string {
  const c = (cpu ?? '').trim()
  if (!c || /^unknown$/i.test(c)) return 'Not given'
  const rules: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/^Apple (M[1-5])/, m => `Apple ${m[1]}`],
    [/^Ryzen ([3579])/, m => `Ryzen ${m[1]}`],
    [/^Threadripper/, () => 'Threadripper'],
    [/^EPYC/, () => 'EPYC'],
    [/^Xeon (E[357])/, m => `Xeon ${m[1]}`],
    [/^Xeon/, () => 'Xeon Scalable'],
    [/^Core Ultra/, () => 'Core Ultra'],
    [/^Core (i[3579])/, m => `Core ${m[1]}`],
  ]
  for (const [re, f] of rules) {
    const m = c.match(re)
    if (m) return f(m)
  }
  return 'Other'
}

/** One sample per rig: the newest per dedupe hash. */
export function oneEach(samples: Sample[]): Sample[] {
  const d = dedupe(samples)
  const by = new Map<string, Sample>()
  const rest: Sample[] = []
  for (const s of d) {
    if (!s.dedupe) rest.push(s)
    else {
      const cur = by.get(s.dedupe)
      if (!cur || s.result.epoch > cur.result.epoch || (s.result.epoch === cur.result.epoch && s.at >= cur.at)) by.set(s.dedupe, s)
    }
  }
  return [...rest, ...by.values()]
}

function bars(list: Sample[], keyOf: (s: Sample) => string, unitOf: (k: string) => 'card' | 'rig', rate: (s: Sample, k: string) => number | undefined, limit = 6): Bar[] {
  const groups = new Map<string, Sample[]>()
  for (const s of list) {
    const k = keyOf(s)
    groups.set(k, [...(groups.get(k) ?? []), s])
  }
  const total = list.length || 1
  const all = [...groups.entries()]
    .map(([k, l]) => {
      const rated = l.map(s => rate(s, k)).filter((x): x is number => x !== undefined)
      return { key: k, label: k, n: l.length, share: l.length / total, median: median(rated), nRated: rated.length, unit: unitOf(k), tags: l.length < MEASURE.fewData ? ['few data'] : [] }
    })
    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label))
  if (all.length <= limit) return all
  const head = all.slice(0, limit - 1)
  const tail = all.slice(limit - 1)
  const n = tail.reduce((a, b) => a + b.n, 0)
  return [...head, { key: 'other', label: 'Other', n, share: n / total, nRated: 0, unit: 'rig', tags: n < MEASURE.fewData ? ['few data'] : [] }]
}

const NO_GPU = 'No GPU'

export function usage(samples: Sample[], currentEpoch: number): Usage {
  const list = oneEach(samples)
  const epochs = list.map(s => s.result.epoch)
  const to = epochs.length ? Math.max(...epochs) : currentEpoch
  const from = epochs.length ? Math.min(...epochs) : currentEpoch
  const gpuOf = (s: Sample) => (s.hw.gpu && s.hw.mode !== 'cpu' ? s.hw.gpu : NO_GPU)
  const owner = (s: Sample) => (s.hw.owner === 'rented' ? 'Rented' : 'Own')
  const os = (s: Sample) => (s.hw.os ? OS_LABEL[s.hw.os as Os] : 'Not given')
  const flat = () => 'rig' as const
  const none = () => undefined
  const combo = new Map<string, number>()
  for (const s of list) {
    const k = `${MODE_LABEL[s.hw.mode]} · ${os(s)} · ${owner(s).toLowerCase()}`
    combo.set(k, (combo.get(k) ?? 0) + 1)
  }
  // medians only from the newest era: solution counts are not comparable across algorithm changes
  const era = (s: Sample) => to - s.result.epoch <= MEASURE.olderAfterEpochs
  const top = [...combo.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
  return {
    epoch: currentEpoch,
    from,
    to,
    n: list.length,
    real: list.filter(s => s.source !== 'field').length,
    few: list.length < MEASURE.fewData,
    older: list.length > 0 && currentEpoch - to > MEASURE.olderAfterEpochs,
    // per card from GPU-only rigs; a GPU+CPU rig's rate includes its CPU, so it does not count toward the card median
    gpu: bars(
      list,
      gpuOf,
      k => (k === NO_GPU ? 'rig' : 'card'),
      (s, k) => (!era(s) ? undefined : k === NO_GPU ? perUnit(s) : s.hw.mode === 'gpu' ? perUnit(s) : undefined),
    ),
    // per rig, from CPU-only rigs: a GPU rig's host CPU is counted in the share but not in the median
    cpu: bars(list, s => cpuFamily(s.hw.cpu), flat, s => (era(s) && s.hw.mode === 'cpu' ? perUnit(s) : undefined)),
    mode: bars(list, s => MODE_LABEL[s.hw.mode], flat, none, 3),
    os: bars(list, os, flat, none, 5),
    owner: bars(list, owner, flat, none, 2),
    top: top ? { label: top[0], n: top[1] } : undefined,
  }
}
