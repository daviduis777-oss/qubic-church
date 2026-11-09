import 'server-only'
import { kvGetJson, kvSetJson } from '@/lib/bpp/store'
import { empty, history, type NetState, observe, verdict } from './status-view'

const KEY = 'net:state'
/** Look at the network at most this often, however many people have the page open. */
const MIN_GAP_MS = 30_000

export type NetStatus = {
  ok: true
  tick: number
  epoch: number
  initialTick: number
  verdict: ReturnType<typeof verdict>['verdict']
  stuckFor: number | null
  changedAt: number | null
  rate: number | null
  lookedAt: number
  incidents: ReturnType<typeof history>
}

async function readTick() {
  const r = await fetch('https://rpc.qubic.org/v1/tick-info', { cache: 'no-store', signal: AbortSignal.timeout(8000) })
  if (!r.ok) throw new Error(`rpc ${r.status}`)
  const j = (await r.json()) as { tickInfo?: { tick: number; epoch: number; initialTick: number } }
  if (!j.tickInfo?.tick) throw new Error('rpc: no tick')
  return j.tickInfo
}

/** Read the state, take a fresh look if the last one is old enough, store it, and answer. */
export async function networkStatus(): Promise<NetStatus> {
  const now = Date.now()
  let s = (await kvGetJson<NetState>(KEY).catch(() => null)) ?? empty()
  const info = await readTick()
  if (!s.last || now - s.last.at >= MIN_GAP_MS) {
    s = observe(s, { tick: info.tick, epoch: info.epoch, at: now })
    await kvSetJson(KEY, s).catch(() => {})
  }
  const v = verdict(s, now)
  return {
    ok: true,
    tick: info.tick,
    epoch: info.epoch,
    initialTick: info.initialTick,
    verdict: v.verdict,
    stuckFor: v.stuckFor,
    changedAt: s.changedAt,
    rate: s.rate,
    lookedAt: now,
    incidents: history(s),
  }
}
