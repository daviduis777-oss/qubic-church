/**
 * Qubic epochs: one week, Wednesday 12:00 UTC to the next Wednesday 12:00 UTC.
 * Anchor: epoch 236 started Wednesday 21 October 2026, 12:00 UTC (the same anchor lib/bpp/network.ts uses).
 * Pure and dependency free, so the page, Maria's prompt and the card generator can all call it.
 */

export const EPOCH_MS = 7 * 86_400_000
export const EPOCH_ANCHOR = { epoch: 236, startMs: Date.UTC(2026, 9, 21, 12) } as const
export const EPOCH_SOURCE = {
  label: 'Qubic docs glossary, Epoch: "Wednesday 12 UTC to Wednesday 12 UTC"',
  url: 'https://deploy-preview-30--docs-qubic-org.netlify.app/learn/glossary',
  date: 'checked 4 Nov 2026',
} as const

/** Start of an epoch. */
export function epochStart(epoch: number): Date {
  return new Date(EPOCH_ANCHOR.startMs + (epoch - EPOCH_ANCHOR.epoch) * EPOCH_MS)
}

export type EpochNow = { epoch: number; start: Date; end: Date; msLeft: number }

/** The epoch running at `now`, with its start, its end and the time left. */
export function epochAt(now: Date = new Date()): EpochNow {
  const t = now.getTime()
  const epoch = EPOCH_ANCHOR.epoch + Math.floor((t - EPOCH_ANCHOR.startMs) / EPOCH_MS)
  const start = epochStart(epoch)
  const end = epochStart(epoch + 1)
  return { epoch, start, end, msLeft: end.getTime() - t }
}

/** "6 d 23 h", "5 h 10 min", "12 min". Rounded down; never negative. */
export function formatLeft(ms: number): string {
  const m = Math.max(0, Math.floor(ms / 60_000))
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  const min = m % 60
  if (d) return `${d} d ${h} h`
  if (h) return `${h} h ${min} min`
  return `${min} min`
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const pad = (n: number) => String(n).padStart(2, '0')

/** "Wed 11 Nov 2026 12:00 UTC" */
export function formatUtc(d: Date): string {
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
}

/** One line for Maria's prompt, computed at request time. */
export function nowLine(now: Date = new Date()): string {
  const e = epochAt(now)
  return `Now: ${formatUtc(now)}. Epoch ${e.epoch}, started ${formatUtc(e.start)}, ends ${formatUtc(e.end)}, in ${formatLeft(e.msLeft)}.`
}
