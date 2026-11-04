/**
 * Measured results: one normalized sample per rig and epoch, and the log reader that finds the numbers.
 * Pure and dependency free: the log doctor runs it in the browser (the log never leaves it), the API
 * validates with it, and the tests import it directly. Hashing and storage live in store.ts (server).
 *
 * Never in a sample: a wallet address, a seed, an IP or a worker name in clear text.
 */
import { type Backend, MEASURE, type Os, RENTALS } from './config.ts'
import { epochAt } from './epoch.ts'
import { FIELD_RUNS } from './knowledge.ts'
import { containsAddress, containsSeed } from './redact.ts'

export type SampleSource = 'pool' | 'log' | 'field'
export type MineMode = 'gpu' | 'cpu' | 'gpu+cpu'
export const MODE_LABEL: Record<MineMode, string> = {
  gpu: 'GPU only',
  cpu: 'CPU only',
  'gpu+cpu': 'GPU and CPU',
}
export const HOSTS = [...RENTALS.map(r => r.name), 'Other'] as const

export type SampleHardware = {
  /** normalized CPU model, e.g. "Ryzen 9 7950X", "Xeon E5-2696 v3", "EPYC" */
  cpu: string
  /** normalized GPU model, e.g. "RTX 4090"; null for CPU only */
  gpu: string | null
  gpuCount: number
  ramGb?: number
  os?: Os
  backend?: Backend
  mode: MineMode
  threads?: number
  owner: 'own' | 'rented'
  /** rental host, one of HOSTS */
  host?: string
  powerLimitW?: number
}

export type SampleResult = {
  epoch: number
  gpuIts?: number
  cpuIts?: number
  solutions?: number
  windowMin?: number
  /** solutions / windowMin * 60, or given directly (pool, field) */
  solPerHour?: number
  rejected?: number
  uptimeMin?: number
}

export type Sample = {
  v: 1
  source: SampleSource
  /** ms since epoch, UTC */
  at: number
  /** the whole rig: "4x RTX 4090 | Xeon E5-2696 v3 | gpu" */
  key: string
  hw: SampleHardware
  result: SampleResult
  /** salted hash of worker name + day (store.ts); the worker name itself is never kept */
  dedupe?: string
}

/* ---------------- normalization ---------------- */

const titleWord = (w: string) =>
  /^\d/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)

type NameRule = [RegExp, (m: RegExpMatchArray) => string]
const up = (x: string | undefined) => (x ?? '').toUpperCase()
const firstMatch = (l: string, rules: NameRule[]) => {
  for (const [re, f] of rules) {
    const m = l.match(re)
    if (m) return f(m)
  }
  return null
}

const CPU_RULES: NameRule[] = [
  [
    /\bapple\b.*?\bm([1-5])\b(?: (pro|max|ultra))?|^m([1-5])\b(?: (pro|max|ultra))?/,
    m =>
      `Apple M${m[1] ?? m[3]}${(m[2] ?? m[4]) ? ` ${titleWord(m[2] ?? m[4] ?? '')}` : ''}`,
  ],
  [
    /xeon\s*(?:cpu\s*)?(e[357])[- ]?(\d{4}[a-z]?)\s*(v\d)?/,
    m => `Xeon ${up(m[1])}-${up(m[2])}${m[3] ? ` ${m[3]}` : ''}`,
  ],
  [
    /xeon\s*(platinum|gold|silver|bronze)\s*(\d{4}[a-z+]*)/,
    m => `Xeon ${titleWord(m[1] ?? '')} ${up(m[2])}`,
  ],
  [/epyc\s*(\d[0-9a-z]{3}[a-z0-9]*)/, m => `EPYC ${up(m[1])}`],
  [/\bepyc\b/, () => 'EPYC'],
  [/threadripper\s*(?:pro\s*)?(\d{4}w?x)/, m => `Threadripper ${up(m[1])}`],
  [
    /ryzen\s*(?:ai\s*)?([3579])\s*(?:pro\s*)?(\d{4}[a-z0-9]*)/,
    m => `Ryzen ${m[1]} ${up(m[2])}`,
  ],
  [
    /core\s*ultra\s*([3579])\s*(\d{3}[a-z]*)/,
    m => `Core Ultra ${m[1]} ${up(m[2])}`,
  ],
  [
    /(?:core\s*)?i([3579])[- ](\d{4,5}[a-z]*)/,
    m => `Core i${m[1]}-${up(m[2])}`,
  ],
]

const GPU_RULES: NameRule[] = [
  [
    /\b(rtx|gtx)\s*(\d{3,4})\s*(ti|super)?(\s*super)?(\s*laptop)?/,
    m => {
      const suffix = [m[3], m[4]?.trim()]
        .filter((x): x is string => Boolean(x))
        .map(titleWord)
        .join(' ')
      return `${up(m[1])} ${m[2]}${suffix ? ` ${suffix}` : ''}${m[5] ? ' Laptop' : ''}`
    },
  ],
  [/\b(rtx\s*)?(a\d{3,4}|l40s?|l4|h100|h200|a100|b200)\b/, m => up(m[2])],
  [
    /\brx\s*(\d{4})\s*(xtx|xt)?/,
    m => `RX ${m[1]}${m[2] ? ` ${up(m[2])}` : ''}`,
  ],
]

/** "AMD Ryzen 9 7950X 16-Core Processor" -> "Ryzen 9 7950X"; "Intel(R) Xeon(R) CPU E5-2696 v3 @ 2.30GHz" -> "Xeon E5-2696 v3". */
export function normalizeCpu(raw: string): string {
  let s = (raw ?? '')
    .replace(/\((r|tm|c)\)/gi, ' ')
    .replace(/[™®]/g, ' ')
    .replace(/@\s*[\d.]+\s*ghz/gi, ' ')
    .replace(/\b\d+-core\b|\bprocessor\b|\bcpu\b|\bwith radeon[^,]*$/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const hit = firstMatch(s.toLowerCase(), CPU_RULES)
  if (hit) return hit
  s = s.replace(/^(amd|intel)\s+/i, '')
  return s.split(' ').map(titleWord).join(' ').slice(0, 48)
}

/** "NVIDIA GeForce RTX 4090" -> "RTX 4090"; "rtx5070ti" -> "RTX 5070 Ti". */
export function normalizeGpu(raw: string): string | null {
  const l = (raw ?? '')
    .toLowerCase()
    .replace(/\(r\)|\(tm\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!l || /^(none|no|no gpu|-|n\/a|cpu only)$/.test(l)) return null
  const hit = firstMatch(l, GPU_RULES)
  if (hit) return hit
  return l
    .replace(/^nvidia\s+(geforce\s+)?/, '')
    .split(' ')
    .map(titleWord)
    .join(' ')
    .slice(0, 48)
}

/** The whole rig, as one readable key. */
export function rigKey(
  hw: Pick<SampleHardware, 'cpu' | 'gpu' | 'gpuCount' | 'mode'>
): string {
  return hw.gpu && hw.mode !== 'cpu'
    ? `${hw.gpuCount}x ${hw.gpu} | ${hw.cpu} | ${hw.mode}`
    : `${hw.cpu} | cpu`
}

/** What a sample is aggregated under: per card for GPU rigs, per rig for CPU-only and GPU+CPU rigs. */
export type Unit = 'card' | 'rig'
export function partKey(hw: Pick<SampleHardware, 'cpu' | 'gpu' | 'mode'>): {
  key: string
  label: string
  unit: Unit
} {
  if (hw.mode === 'gpu' && hw.gpu)
    return { key: `gpu|${hw.gpu}`, label: hw.gpu, unit: 'card' }
  if (hw.mode === 'gpu+cpu' && hw.gpu)
    return { key: `mix|${hw.gpu}`, label: `${hw.gpu} + CPU`, unit: 'rig' }
  return { key: `cpu|${hw.cpu}`, label: hw.cpu, unit: 'rig' }
}

/* ---------------- log extraction ---------------- */

export type Extracted = {
  epoch?: number
  /** latest it/s per backend tag as printed: CUDA, AVX2, AVX512, CPU, or "total" for an untagged readout */
  its: Record<string, number>
  avgIts?: number
  gpuIts?: number
  cpuIts?: number
  solutions?: number
  windowMin?: number
  solPerHour?: number
  rejected?: number
  /** minutes since a miner start line, when the log has one */
  uptimeMin?: number
  gpu?: string
  gpuCount?: number
  cpu?: string
  threads?: number
  powerLimitW?: number
  maxTempC?: number
  backend?: Backend
  /** read from the log only so the browser can offer it for dedupe; it is hashed on the server */
  worker?: string
  /** timed solution-counter readouts, in log minutes (absolute UTC minutes when the log has full dates) */
  counter?: { t: number; n: number }[]
  /** true when the log's timestamps carry a date, so counter times and lastAt are real UTC */
  dated?: boolean
  /** ms UTC of the newest dated line */
  lastAt?: number
  /** counter resets seen in the log: each one is a miner restart */
  restarts?: number
  /** true when any number Maria can use was found */
  found: boolean
}

const TS_FULL = /\b(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/
const TS_TIME = /(?:^|[\s[|])(\d{2}):(\d{2}):(\d{2})(?:[.,]\d+)?(?=[\s\]|]|$)/
const START =
  /\b(start(ing|ed)?|launch(ing|ed)?|boot(ing)?|init(iali[sz]ing|iali[sz]ed)?)\b[^\n]{0,40}\b(miner|client|qli|worker|mining)\b|\b(miner|client|qli|worker)\b[^\n]{0,30}\bstart(ing|ed)?\b|^\s*starting\s*$/i
const ITS =
  /(?:\[(cuda|gpu|avx-?512|avx2|cpu)\]\s*)?(av(?:g|erage)\.?\s*[:=]?\s*)?(\d+(?:\.\d+)?)\s*(avg\.?\s*)?it\/s/gi
const SOL =
  /\b(?:sol(?:s|utions?)?(?: found)?|shares)\s*[:=]\s*(\d+)(?:\s*\/\s*(\d+))?/i
const SOL_FOUND =
  /\b(?:found|submitted|accepted)\s+(?:a\s+)?(?:new\s+)?(?:solution|share)\b/i
const REJ =
  /\b(\d+)\s+(?:rejected|expired|stale)\b|\b(?:rejected|expired|stale)\s*[:=]\s*(\d+)|\bR:(\d+)\b/gi
const GPU_NAME =
  /\b(?:nvidia\s+)?(?:geforce\s+)?((?:rtx|gtx)\s*\d{3,4}(?:\s*(?:ti|super))?(?:\s*super)?|rtx\s*a\d{4}|a100|h100|h200|l40s?)\b/i
const GPU_IDX =
  /\bgpu\s*#?(\d{1,2})\s*[:\]]|^\|\s+(\d{1,2})\s+nvidia|\b(?:device|dev)\s*#?(\d{1,2})\s*[:\]]|\[(?:cuda|gpu)\s*#?(\d{1,2})\]/i
const CPU_NAME =
  /(?:model name|^model name|cpu model|^cpu|\bcpu\s*:|processor\s*:)\s*[:=]?\s*((?:amd|intel|apple)[^|\n]{3,80}|(?:ryzen|epyc|xeon|threadripper|core)[^|\n]{2,60})/i
const THREADS =
  /\bcpu\(s\)\s*:\s*(\d{1,4})\b|\bthreads?\s*[:=]\s*(\d{1,4})\b|\b(\d{1,4})\s+threads\b/i
const POWER_LIMIT =
  /\b(?:power limit|enforced power limit|current power limit)\s*:\s*(\d{2,4})(?:\.\d+)?\s*w/i
const SMI_ROW =
  /\|\s*(?:\d+%|N\/A)\s+(\d{2,3})C\s+P\d+\s+(\d{2,4})W\s*\/\s*(\d{2,4})W\s*\|/
const TEMP = /\b(?:gpu current temp|temp(?:erature)?)\s*[:=]\s*(\d{2,3})\s*c\b/i
const BACKEND = /\bbackend\s*[:=]\s*(gpu|cuda|avx-?512|avx2|auto)\b/i
const WORKER = /\bworker(?:\s*name)?\s*[:=]\s*([A-Za-z0-9._-]{2,64})/i
const EPOCH = /\bE:(\d{3,4})\b|\bepoch\s*[:#=]?\s*(\d{3,4})\b/i

const tagOf = (t: string | undefined) => {
  const u = (t ?? '').toUpperCase().replace('-', '')
  return u === 'GPU' ? 'CUDA' : u || 'total'
}
const backendOf = (t: string): Backend | undefined => {
  const u = t.toUpperCase().replace('-', '')
  return u === 'GPU' || u === 'CUDA'
    ? 'GPU'
    : u === 'AVX512'
      ? 'AVX512'
      : u === 'AVX2'
        ? 'AVX2'
        : u === 'AUTO'
          ? 'Auto'
          : undefined
}

/**
 * Read the numbers out of a pasted miner log: epoch, it/s per backend, solution counters over time,
 * rejected candidates, and the hardware lines (nvidia-smi, lscpu, /proc/cpuinfo) when present.
 * Times come from the log's own timestamps; a log without timestamps gives it/s but no sol/h.
 */
export function extractMetrics(log: string): Extracted {
  const out: Extracted = { its: {}, found: false }
  const lines = (log ?? '').split(/\r?\n/)
  const gpuIdx = new Set<string>()
  const gpuNames: string[] = []
  let day = 0
  let lastSec = -1
  let startT: number | undefined
  let lastT: number | undefined
  const counts: { t?: number; n: number }[] = []
  let events = 0
  let firstEventT: number | undefined
  let lastEventT: number | undefined
  let rejMax = 0
  let rejSeen = false
  let dated = false

  for (const line of lines) {
    // a timestamp for this line, in minutes; bare clock times roll over at midnight
    let t: number | undefined
    const full = line.match(TS_FULL)
    if (full) {
      dated = true
      t =
        Date.UTC(
          +full[1]!,
          +full[2]! - 1,
          +full[3]!,
          +full[4]!,
          +full[5]!,
          +full[6]!
        ) / 60_000
    } else {
      const tm = line.match(TS_TIME)
      if (tm) {
        const sec = +tm[1]! * 3600 + +tm[2]! * 60 + +tm[3]!
        if (lastSec >= 0 && sec + 600 < lastSec) day++
        lastSec = sec
        t = day * 1440 + sec / 60
      }
    }
    if (t !== undefined) lastT = t
    if (START.test(line) && !ITS.test(line)) startT = t ?? startT
    ITS.lastIndex = 0

    const e = line.match(EPOCH)
    if (e) out.epoch = Number(e[1] ?? e[2])

    for (const m of line.matchAll(ITS)) {
      const v = Number(m[3])
      if (!Number.isFinite(v)) continue
      if (m[2] || m[4]) out.avgIts = v
      else out.its[tagOf(m[1])] = v
    }

    const s = line.match(SOL)
    if (s) counts.push({ t, n: Number(s[1]) })
    else if (SOL_FOUND.test(line)) {
      events++
      firstEventT ??= t
      lastEventT = t ?? lastEventT
    }

    for (const r of line.matchAll(REJ)) {
      const v = Number(r[1] ?? r[2] ?? r[3])
      if (Number.isFinite(v)) {
        rejSeen = true
        rejMax = Math.max(rejMax, v)
      }
    }

    const g = line.match(GPU_NAME)
    if (g) {
      gpuNames.push(g[1]!)
      const idx = line.match(GPU_IDX)
      const id = idx ? (idx[1] ?? idx[2] ?? idx[3] ?? idx[4]) : undefined
      if (id !== undefined) gpuIdx.add(id)
    }
    const c = line.match(CPU_NAME)
    if (c && !out.cpu) out.cpu = normalizeCpu(c[1]!)
    const th = line.match(THREADS)
    if (th && !out.threads) out.threads = Number(th[1] ?? th[2] ?? th[3])
    const pl = line.match(POWER_LIMIT)
    if (pl) out.powerLimitW = Number(pl[1])
    const smi = line.match(SMI_ROW)
    if (smi) {
      out.maxTempC = Math.max(out.maxTempC ?? 0, Number(smi[1]))
      out.powerLimitW ??= Number(smi[3])
    }
    const tp = line.match(TEMP)
    if (tp) out.maxTempC = Math.max(out.maxTempC ?? 0, Number(tp[1]))
    const b = line.match(BACKEND)
    if (b) out.backend = backendOf(b[1]!)
    const w = line.match(WORKER)
    if (w && !containsAddress(w[1]!)) out.worker = w[1]
  }

  // it/s: the CUDA tag is the GPU, AVX tags the CPU; an untagged readout is the rig's own total
  out.gpuIts = out.its.CUDA
  const cpuTags = ['AVX512', 'AVX2', 'CPU'].filter(
    k => out.its[k] !== undefined
  )
  if (cpuTags.length) out.cpuIts = cpuTags.reduce((a, k) => a + out.its[k]!, 0)
  if (!out.backend)
    out.backend =
      out.its.CUDA !== undefined
        ? 'GPU'
        : out.its.AVX512 !== undefined
          ? 'AVX512'
          : out.its.AVX2 !== undefined
            ? 'AVX2'
            : undefined

  // solutions over a window: the counter's growth between its first and last timestamped readout,
  // or from a start line to the last readout, or found-solution events between their timestamps
  const timed = counts.filter(x => x.t !== undefined) as {
    t: number
    n: number
  }[]
  if (timed.length) out.counter = timed.map(x => ({ t: x.t, n: x.n }))
  if (dated && lastT !== undefined) {
    out.dated = true
    out.lastAt = lastT * 60_000
  }
  if (timed.length >= 2) {
    let sol = 0
    let restarts = 0
    for (let i = 1; i < timed.length; i++) {
      const d = timed[i]!.n - timed[i - 1]!.n
      if (d < 0) restarts++
      sol += d >= 0 ? d : timed[i]!.n // a counter reset (restart) starts again from zero
    }
    if (restarts) out.restarts = restarts
    const from =
      startT !== undefined && startT <= timed[0]!.t && timed[0]!.n > 0
        ? startT
        : timed[0]!.t
    if (from === startT) sol += timed[0]!.n
    out.solutions = sol
    out.windowMin = round1(timed.at(-1)!.t - from)
  } else if (
    timed.length === 1 &&
    startT !== undefined &&
    timed[0]!.t > startT
  ) {
    out.solutions = timed[0]!.n
    out.windowMin = round1(timed[0]!.t - startT)
  } else if (
    events > 0 &&
    firstEventT !== undefined &&
    lastEventT !== undefined
  ) {
    const from = startT ?? firstEventT
    out.solutions = startT !== undefined ? events : events - 1
    out.windowMin = round1(lastEventT - from)
  }
  if (out.windowMin !== undefined && out.windowMin <= 0) {
    out.windowMin = undefined
    out.solutions = undefined
  }
  if (out.solutions !== undefined && out.windowMin)
    out.solPerHour = round1((out.solutions / out.windowMin) * 60)
  if (startT !== undefined && lastT !== undefined && lastT > startT)
    out.uptimeMin = round1(lastT - startT)
  if (rejSeen) out.rejected = rejMax

  if (gpuNames.length) {
    const names = gpuNames.map(n => normalizeGpu(n)!).filter(Boolean)
    // the most common card name wins; the count is the number of distinct device indices seen
    const tally = new Map<string, number>()
    for (const n of names) tally.set(n, (tally.get(n) ?? 0) + 1)
    out.gpu = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    out.gpuCount = gpuIdx.size || 1
  }

  out.found =
    Object.keys(out.its).length > 0 ||
    out.avgIts !== undefined ||
    out.solPerHour !== undefined
  return out
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** The mode a log implies: CUDA and an AVX readout together means GPU and CPU. */
export function modeFrom(
  x: Pick<Extracted, 'gpuIts' | 'cpuIts' | 'gpu'>
): MineMode {
  if (x.gpuIts !== undefined && x.cpuIts !== undefined) return 'gpu+cpu'
  if (x.gpuIts !== undefined || x.gpu) return 'gpu'
  return 'cpu'
}

/* ---------------- building and checking a sample ---------------- */

/** What the browser posts. No log text, no wallet; the worker name is hashed on the server and dropped. */
export type SampleInput = {
  cpu: string
  gpu?: string | null
  gpuCount?: number
  ramGb?: number
  os?: Os
  backend?: Backend
  mode: MineMode
  threads?: number
  owner: 'own' | 'rented'
  host?: string
  powerLimitW?: number
  gpuIts?: number
  cpuIts?: number
  solutions?: number
  windowMin?: number
  rejected?: number
  uptimeMin?: number
  /** the log's epoch, only to refuse an old log; the stored epoch always comes from epoch.ts */
  logEpoch?: number
  worker?: string
}

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string }

const num = (v: unknown, min: number, max: number): number | undefined => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max
    ? n
    : undefined
}
const OSES: Os[] = ['linux', 'macos', 'windows', 'hiveos']
const BACKENDS: Backend[] = ['Auto', 'GPU', 'AVX2', 'AVX512']
const MODES: MineMode[] = ['gpu', 'cpu', 'gpu+cpu']
// control characters out: printable text only
const clean = (s: unknown, max = 80) =>
  typeof s === 'string'
    ? [...s]
        .map(c => (c.charCodeAt(0) < 32 ? ' ' : c))
        .join('')
        .trim()
        .slice(0, max)
    : ''

/**
 * Validate a posted result and build the sample (without the dedupe hash, which store.ts adds).
 * Applies the field rules: nothing under 20 minutes of counting, nothing still in the 2-hour warm-up.
 */
export function buildSample(
  raw: unknown,
  now: Date = new Date(),
  source: SampleSource = 'log'
): Checked<Sample> {
  if (!raw || typeof raw !== 'object')
    return { ok: false, error: 'Nothing to save.' }
  const r = raw as Record<string, unknown>
  const texts = [r.cpu, r.gpu, r.host].map(x => clean(x, 200))
  if (texts.some(t => containsAddress(t) || containsSeed(t)))
    return {
      ok: false,
      error: 'That looks like a wallet string. Only hardware names are saved.',
    }

  const mode = MODES.includes(r.mode as MineMode)
    ? (r.mode as MineMode)
    : undefined
  if (!mode)
    return { ok: false, error: 'Pick GPU only, CPU only, or GPU and CPU.' }
  const cpu = normalizeCpu(clean(r.cpu))
  if (!cpu) return { ok: false, error: 'Add the CPU model.' }
  const gpu = mode === 'cpu' ? null : normalizeGpu(clean(r.gpu))
  if (mode !== 'cpu' && !gpu) return { ok: false, error: 'Add the GPU model.' }
  const gpuCount = gpu ? (num(r.gpuCount, 1, 16) ?? 1) : 0
  const owner =
    r.owner === 'rented' ? 'rented' : r.owner === 'own' ? 'own' : undefined
  if (!owner) return { ok: false, error: 'Own or rented?' }
  const hostRaw = clean(r.host, 40)
  const host =
    owner === 'rented' && hostRaw
      ? (HOSTS.find(h => h.toLowerCase() === hostRaw.toLowerCase()) ?? 'Other')
      : undefined

  const epoch = epochAt(now).epoch
  const logEpoch = num(r.logEpoch, 1, 100_000)
  if (logEpoch !== undefined && logEpoch !== epoch)
    return {
      ok: false,
      error: `This log is from epoch ${logEpoch}. Only results from the running epoch, ${epoch}, are saved.`,
    }

  const windowMin = num(r.windowMin, 0, 14 * 1440)
  const solutions = num(r.solutions, 0, 1_000_000)
  const uptimeMin = num(r.uptimeMin, 0, 60 * 1440)
  const gpuIts = num(r.gpuIts, 0, 1_000_000)
  const cpuIts = num(r.cpuIts, 0, 1_000_000)
  if (solutions === undefined && gpuIts === undefined && cpuIts === undefined)
    return {
      ok: false,
      error: 'No rate to save: add solutions and hours, or an it/s readout.',
    }
  if (
    solutions !== undefined &&
    (windowMin === undefined || windowMin < MEASURE.minWindowMin)
  )
    return {
      ok: false,
      error: `Count solutions over at least ${MEASURE.minWindowMin} minutes. Solutions come in bursts.`,
    }
  if (uptimeMin === undefined)
    return { ok: false, error: 'How long has it been running?' }
  if (uptimeMin < MEASURE.warmupMin)
    return {
      ok: false,
      error: `Still warming up. The first 1 to 2 hours overstate the rate by about ${MEASURE.warmupFactor}. Save it after 2 hours.`,
    }

  const hw: SampleHardware = {
    cpu,
    gpu,
    gpuCount,
    ramGb: num(r.ramGb, 1, 4096),
    os: OSES.includes(r.os as Os) ? (r.os as Os) : undefined,
    backend: BACKENDS.includes(r.backend as Backend)
      ? (r.backend as Backend)
      : undefined,
    mode,
    threads: num(r.threads, 1, 4096),
    owner,
    host,
    powerLimitW: num(r.powerLimitW, 20, 2000),
  }
  const result: SampleResult = {
    epoch,
    gpuIts,
    cpuIts,
    solutions,
    windowMin,
    solPerHour:
      solutions !== undefined && windowMin
        ? round1((solutions / windowMin) * 60)
        : undefined,
    rejected: num(r.rejected, 0, 1_000_000),
    uptimeMin,
  }
  if (result.solPerHour !== undefined && result.solPerHour > 100_000)
    return {
      ok: false,
      error: 'That rate is out of range. Check the solutions and hours.',
    }
  return {
    ok: true,
    value: {
      v: 1,
      source,
      at: now.getTime(),
      key: rigKey(hw),
      hw: strip(hw),
      result: strip(result),
    },
  }
}

/** Drop undefined fields so a stored row stays small and reads cleanly. */
export function strip<T extends object>(o: T): T {
  return Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined)
  ) as T
}

/** Our own runs from knowledge.ts, as `field` samples. Merged on read, never written to storage. */
export const FIELD_SAMPLES: Sample[] = FIELD_RUNS.map(f => {
  const hw: SampleHardware = {
    cpu: normalizeCpu(f.cpu),
    gpu: normalizeGpu(f.gpu),
    gpuCount: f.gpuCount,
    mode: f.mode,
    owner: 'rented',
    host: f.host,
    os: 'linux',
    backend: f.mode === 'cpu' ? undefined : 'GPU',
  }
  return {
    v: 1,
    source: 'field',
    at: Date.parse(f.at),
    key: rigKey(hw),
    hw: strip(hw),
    result: strip({
      epoch: f.epoch,
      solPerHour: f.solPerHour,
      windowMin: f.windowMin,
      uptimeMin: f.windowMin,
    }),
  }
})

/* ---------------- the user's own numbers ---------------- */

/** The only money figure Maria shows: the user's own cost per solution, from their own daily cost. */
export function costPerSolution(
  dailyCostUsd: number | undefined,
  solPerHour: number | undefined
): number | undefined {
  if (!dailyCostUsd || !solPerHour || dailyCostUsd <= 0 || solPerHour <= 0)
    return undefined
  return dailyCostUsd / (solPerHour * 24)
}

export const fmtRate = (n: number) =>
  n >= 100
    ? Math.round(n).toLocaleString('en-US')
    : n >= 10
      ? n.toFixed(0)
      : n.toFixed(1)
export const fmtWindow = (min: number) =>
  min >= 120
    ? `${(min / 60).toFixed(min % 60 ? 1 : 0)} h`
    : `${Math.round(min)} min`
