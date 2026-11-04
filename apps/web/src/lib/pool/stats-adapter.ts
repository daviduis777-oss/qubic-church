/**
 * Pool stats adapter: turns the pool's per-worker stats into `pool` samples.
 * Stubbed until POOL.statsUrl exists (TODO(Bob)): poolStatsAdapter() returns null, nothing is fetched.
 * The payload shape below is our assumption of a typical pool API; parsePoolStats is tested with a fake one,
 * so wiring the real API is a change to this parser only.
 *
 * Worker names are hashed by the caller's `hash` and dropped. Wallet fields in the payload are never read.
 */
import { POOL } from './config.ts'
import { epochAt } from './epoch.ts'
import {
  normalizeCpu,
  normalizeGpu,
  rigKey,
  type Sample,
  type SampleHardware,
  strip,
} from './measure.ts'
import type { RigReading } from './rig.ts'

/** One worker as we expect the pool to report it. Every field but `worker` is optional. */
export type PoolWorkerStat = {
  worker: string
  epoch?: number
  /** solutions accepted in this epoch, and the minutes the worker was online for them */
  solutions?: number
  onlineMinutes?: number
  rejected?: number
  its?: number
  /** when the miner reports its hardware */
  gpu?: string
  gpuCount?: number
  cpu?: string
  backend?: string
  lastSeen?: string | number
}

export type PoolStatsPayload =
  | { epoch?: number; workers?: unknown[] }
  | unknown[]

export interface PoolStatsAdapter {
  /** fetch the raw payload for one epoch (the current one when omitted) */
  fetch(epoch?: number): Promise<unknown>
}

/** null until the pool publishes a stats API. */
export function poolStatsAdapter(): PoolStatsAdapter | null {
  const url = POOL.statsUrl as string | null
  if (!url || /\{(WALLET|WORKER)\}/.test(url)) return null // a per-wallet page is not a pool-wide feed
  return {
    async fetch(epoch?: number) {
      const r = await fetch(
        epoch ? `${url}${url.includes('?') ? '&' : '?'}epoch=${epoch}` : url,
        { cache: 'no-store' }
      )
      if (!r.ok) throw new Error(`pool stats ${r.status}`)
      return r.json()
    },
  }
}

/** Hardware from our worker names (QC.5070ti-a, QC.4x4090-b, QC.7950x-a), when the pool does not report it. */
export function hardwareFromWorker(
  worker: string
): Pick<SampleHardware, 'gpu' | 'gpuCount' | 'cpu' | 'mode'> | null {
  const tag = worker.replace(/^QC\./i, '').toLowerCase()
  const g = tag.match(/^(?:(\d{1,2})x)?(\d{4})(ti|super)?\b/)
  if (g && /^[2-5]0[5-9]0$/.test(g[2]!))
    return {
      gpu: normalizeGpu(`RTX ${g[2]}${g[3] ? ` ${g[3]}` : ''}`),
      gpuCount: Number(g[1] ?? 1),
      cpu: 'Unknown',
      mode: 'gpu',
    }
  const c = tag.match(/^(\d{4}x3d|\d{4}x|\d{4})\b/)
  // Ryzen class from the second digit: x9xx is a Ryzen 9, x7xx and x8xx a Ryzen 7, x6xx a Ryzen 5
  if (c)
    return {
      gpu: null,
      gpuCount: 0,
      cpu: normalizeCpu(
        `Ryzen ${{ '9': '9', '8': '7', '7': '7' }[c[1]![1]!] ?? '5'} ${c[1]}`
      ),
      mode: 'cpu',
    }
  const m = tag.match(/^m([1-5])(pro|max|ultra)?\b/)
  if (m)
    return {
      gpu: null,
      gpuCount: 0,
      cpu: normalizeCpu(`Apple M${m[1]} ${m[2] ?? ''}`),
      mode: 'cpu',
    }
  return null
}

const n = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0
    ? v
    : typeof v === 'string' && v.trim() && Number.isFinite(Number(v))
      ? Number(v)
      : undefined
const str = (v: unknown) =>
  typeof v === 'string' ? v.trim().slice(0, 80) : undefined

/**
 * Parse a pool payload into samples. Only workers with our prefix count. Rigs whose hardware is unknown
 * (no hardware fields and an unreadable worker tag) are skipped: a rate without hardware teaches nothing.
 */
export function parsePoolStats(
  payload: unknown,
  hash: (worker: string, day: string) => string,
  now: Date = new Date()
): Sample[] {
  const p = payload as { epoch?: unknown; workers?: unknown; data?: unknown }
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(p?.workers)
      ? p.workers
      : Array.isArray(p?.data)
        ? p.data
        : []
  const fallbackEpoch = n(p?.epoch) ?? epochAt(now).epoch
  const day = now.toISOString().slice(0, 10)
  const out: Sample[] = []
  for (const raw of list as Record<string, unknown>[]) {
    if (!raw || typeof raw !== 'object') continue
    const worker = str(raw.worker ?? raw.workerName ?? raw.name)
    if (
      !worker ||
      !worker.toUpperCase().startsWith(POOL.workerPrefix.toUpperCase())
    )
      continue
    const fromTag = hardwareFromWorker(worker)
    const gpu = normalizeGpu(str(raw.gpu) ?? '') ?? fromTag?.gpu ?? null
    const cpuRaw = str(raw.cpu)
    const cpu = cpuRaw ? normalizeCpu(cpuRaw) : (fromTag?.cpu ?? '')
    if (!gpu && (!cpu || cpu === 'Unknown')) continue
    const backend = str(raw.backend)?.toUpperCase()
    const mode = gpu
      ? backend === 'AUTO' && cpuRaw
        ? 'gpu+cpu'
        : 'gpu'
      : 'cpu'
    const hw: SampleHardware = strip({
      cpu: cpu || 'Unknown',
      gpu,
      gpuCount: gpu ? (n(raw.gpuCount) ?? fromTag?.gpuCount ?? 1) : 0,
      mode,
      owner: 'own' as const,
    })
    const solutions = n(raw.solutions ?? raw.sols ?? raw.shares)
    const windowMin = n(raw.onlineMinutes ?? raw.uptimeMinutes)
    const epoch = n(raw.epoch) ?? fallbackEpoch
    const solPerHour =
      solutions !== undefined && windowMin
        ? Math.round((solutions / windowMin) * 600) / 10
        : undefined
    if (solPerHour === undefined && n(raw.its) === undefined) continue
    out.push({
      v: 1,
      source: 'pool',
      at: now.getTime(),
      key: rigKey(hw),
      hw,
      result: strip({
        epoch,
        solutions,
        windowMin,
        solPerHour,
        rejected: n(raw.rejected),
        uptimeMin: windowMin,
        gpuIts: gpu ? n(raw.its) : undefined,
        cpuIts: gpu ? undefined : n(raw.its),
      }),
      dedupe: hash(worker, day),
    })
  }
  return out
}

/* ---------------- one worker, for My rig ---------------- */

/**
 * The pool's numbers for one worker, as a My rig reading. Tested with a fake payload, like parsePoolStats.
 * Wallet fields in the payload are never read.
 */
export function workerReading(payload: unknown, worker: string, now: Date = new Date()): RigReading | null {
  const p = payload as { workers?: unknown; data?: unknown; epoch?: unknown }
  const list = (Array.isArray(payload) ? payload : Array.isArray(p?.workers) ? p.workers : Array.isArray(p?.data) ? p.data : [payload]) as Record<string, unknown>[]
  const raw = list.find(x => x && typeof x === 'object' && str(x.worker ?? x.workerName ?? x.name) === worker)
  if (!raw) return null
  const fromTag = hardwareFromWorker(worker)
  const gpu = normalizeGpu(str(raw.gpu) ?? '') ?? fromTag?.gpu ?? null
  const cpu = str(raw.cpu) ? normalizeCpu(str(raw.cpu)!) : fromTag?.cpu !== 'Unknown' ? fromTag?.cpu : undefined
  const solutions = n(raw.solutions ?? raw.sols ?? raw.shares)
  const online = n(raw.onlineMinutes ?? raw.uptimeMinutes)
  const seen = raw.lastSeen
  const at = typeof seen === 'number' ? (seen < 1e12 ? seen * 1000 : seen) : typeof seen === 'string' && Number.isFinite(Date.parse(seen)) ? Date.parse(seen) : now.getTime()
  const its = n(raw.its)
  const series = Array.isArray(raw.series)
    ? (raw.series as { t?: unknown; solPerHour?: unknown }[])
        .map(x => ({ t: n(x?.t), solPerHour: n(x?.solPerHour) }))
        .filter((x): x is { t: number; solPerHour: number } => x.t !== undefined && x.solPerHour !== undefined)
    : []
  return {
    source: 'pool',
    worker,
    at,
    epoch: n(raw.epoch) ?? n(p?.epoch) ?? epochAt(now).epoch,
    hw: { gpu, gpuCount: gpu ? (n(raw.gpuCount) ?? fromTag?.gpuCount ?? 1) : 0, cpu, mode: gpu ? 'gpu' : 'cpu' },
    solutions,
    solPerHour: solutions !== undefined && online ? Math.round((solutions / online) * 600) / 10 : undefined,
    uptimeMin: online,
    its: its === undefined ? {} : { [gpu ? 'CUDA' : 'CPU']: its },
    rejected: n(raw.rejected),
    series,
    faults: [],
    epochIdle: raw.state === 'idle' || raw.status === 'idle' ? true : undefined,
  }
}

/**
 * Per-worker stats for My rig. null until the pool publishes them.
 * TODO(Bob): when POOL.statsUrl exists, fetch it through a gated /api/pool/worker route (no CORS, no wallet in
 * the browser), pass the payload to workerReading(), and My rig shows source "pool" with no other change.
 */
export function poolWorkerAdapter(): { fetch(worker: string): Promise<RigReading | null> } | null {
  return null
}
