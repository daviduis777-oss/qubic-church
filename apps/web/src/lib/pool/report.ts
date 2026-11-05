/**
 * Reports from miners: a bug, an idea or an update, with an optional screenshot and contact.
 * The rules every layer shares: the Report app checks with them before sending, the API checks again,
 * the review page formats with them. Pure and browser safe; storage lives in report-store.ts.
 *
 * Never kept: an IP (only a salted hash of it, for the daily limit), a raw user agent (only a coarse class),
 * a seed or an address (redacted from the text before it is stored).
 */
import { POOL } from './config.ts'
import { redactWallets, SEED_MARK } from './redact.ts'

export type ReportType = 'bug' | 'idea' | 'update'
export type ReportStatus = 'new' | 'seen' | 'done'

export const REPORT = {
  /** Description length, after trimming. */
  minText: 10,
  maxText: 2000,
  /** Discord handle, as typed. */
  maxContact: 40,
  /** What leaves the browser: re-encoded JPEG or WebP, longest side at most imageMaxPx, at most imageMaxBytes. */
  imageMaxPx: 1600,
  imageMaxBytes: 2_000_000,
  /** The browser aims under this, so most screenshots travel small. */
  imageTargetBytes: 900_000,
  /** The file a person picks, before downscaling. Above this the browser refuses it at once. */
  rawMaxBytes: 15_000_000,
  /** Reports per connection (hashed IP) per UTC day. */
  perDay: 5,
  /** Newest reports kept in the list; older ones drop off. */
  keep: 500,
  /** Days a report and its screenshot are kept. */
  ttlDays: 180,
} as const

export const REPORT_TYPES: { id: ReportType; label: string; ask: string; placeholder: string }[] = [
  { id: 'bug', label: 'Bug', ask: 'What went wrong, and what did you expect?', placeholder: 'Steps, what you saw, what you expected' },
  { id: 'idea', label: 'Idea', ask: 'What would make the pool or Maria better?', placeholder: 'Your idea, and who it helps' },
  { id: 'update', label: 'Update', ask: 'Something out of date? Tell us what changed and where you saw it.', placeholder: 'What changed, and a link or source' },
]

export const REPORT_WARNING = "Don't include your seed or private keys in the screenshot."

export const STATUS_LABEL: Record<ReportStatus, string> = { new: 'New', seen: 'Seen', done: 'Done' }

/** Where in Maria the report was started: the app, and a code for the step. Never user text. */
export type ReportContext = { app: string; step?: string }

export type ReportDraft = {
  type: ReportType
  text: string
  contact?: string
  ctx: ReportContext
  /** the screenshot as a data URL, checked by checkImage(); stored under its own key */
  image?: string
}

export type StoredReport = {
  v: 1
  id: string
  type: ReportType
  text: string
  contact?: string
  ctx: ReportContext
  /** coarse device class, e.g. "mobile · iOS · Safari"; never the raw user agent */
  ua: string
  at: number
  status: ReportStatus
  /** the screenshot's type and size; its data sits under its own key */
  img?: { type: 'jpeg' | 'webp'; bytes: number }
  /** true when the redaction removed a seed from the text */
  seed?: boolean
}

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string }

const isType = (x: unknown): x is ReportType => x === 'bug' || x === 'idea' || x === 'update'
export const isStatus = (x: unknown): x is ReportStatus => x === 'new' || x === 'seen' || x === 'done'

/** Apps and steps are codes: lowercase letters, digits and a few separators. */
const CODE = /^[a-z][a-z0-9:+._-]{0,79}$/
/** New Discord usernames (2 to 32 of a-z 0-9 _ .), an optional @, or a legacy name#1234. */
const DISCORD = /^@?(?:[a-z0-9_.]{2,32}|[^\s@#:]{2,32}#\d{4})$/i

/** Keep printable text: control characters out (newlines and tabs stay), runs of blank lines folded. */
const clean = (s: string) =>
  s
    .replace(/\r\n?/g, '\n')
    // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping them is the point
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()

/** The text as it will be stored: cleaned, then seeds and addresses redacted. */
export function redactReport(s: string): { text: string; seed: boolean } {
  const text = redactWallets(clean(s))
  return { text, seed: text.includes(SEED_MARK) }
}

export function checkContext(x: unknown): ReportContext {
  const c = (x && typeof x === 'object' ? x : {}) as { app?: unknown; step?: unknown }
  const app = typeof c.app === 'string' && CODE.test(c.app) ? c.app : 'unknown'
  const step = typeof c.step === 'string' && CODE.test(c.step) ? c.step : undefined
  return step ? { app, step } : { app }
}

/** base64 payload size in bytes, without decoding it. */
export const base64Bytes = (b64: string) => Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0)

const DATA_URL = /^data:image\/(jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/

/** Magic bytes: a JPEG starts FF D8 FF; a WebP is "RIFF", four size bytes, then "WEBP". */
function magicOk(type: 'jpeg' | 'webp', b64: string): boolean {
  let head: string
  try {
    head = atob(b64.slice(0, 16))
  } catch {
    return false
  }
  if (type === 'jpeg') return head.charCodeAt(0) === 0xff && head.charCodeAt(1) === 0xd8 && head.charCodeAt(2) === 0xff
  return head.slice(0, 4) === 'RIFF' && head.slice(8, 12) === 'WEBP'
}

/** A screenshot as the browser sends it: a JPEG or WebP data URL, under the size cap, with the right magic bytes. */
export function checkImage(x: unknown): Checked<{ type: 'jpeg' | 'webp'; bytes: number; dataUrl: string }> {
  if (typeof x !== 'string') return { ok: false, error: 'The screenshot could not be read.' }
  // a cheap length check first: base64 is 4/3 of the bytes, plus the prefix
  if (x.length > Math.ceil((REPORT.imageMaxBytes * 4) / 3) + 40) return { ok: false, error: 'The screenshot is too large. Try a smaller one.' }
  const m = x.match(DATA_URL)
  if (!m) return { ok: false, error: 'Only a JPEG or WebP screenshot can be attached.' }
  const type = m[1] as 'jpeg' | 'webp'
  const b64 = m[2] as string
  const bytes = base64Bytes(b64)
  if (bytes > REPORT.imageMaxBytes) return { ok: false, error: 'The screenshot is too large. Try a smaller one.' }
  if (bytes < 64 || !magicOk(type, b64)) return { ok: false, error: 'That file is not a picture.' }
  return { ok: true, value: { type, bytes, dataUrl: x } }
}

/** Validate a report as sent. The text and contact come back cleaned and redacted. */
export function checkReport(input: unknown): Checked<ReportDraft & { seed: boolean }> {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Nothing to send.' }
  const b = input as Record<string, unknown>
  if (!isType(b.type)) return { ok: false, error: 'Choose Bug, Idea or Update.' }
  if (typeof b.text !== 'string') return { ok: false, error: 'Write a few words first.' }
  const { text, seed } = redactReport(b.text)
  if (text.length < REPORT.minText) return { ok: false, error: `Write a little more: at least ${REPORT.minText} characters.` }
  if (text.length > REPORT.maxText) return { ok: false, error: `That is over ${REPORT.maxText.toLocaleString('en-US')} characters. Shorten it a little.` }
  let contact: string | undefined
  if (b.contact !== undefined && b.contact !== null && b.contact !== '') {
    if (typeof b.contact !== 'string') return { ok: false, error: 'That Discord handle looks wrong.' }
    const c = b.contact.trim()
    if (c) {
      if (c.length > REPORT.maxContact || !DISCORD.test(c)) return { ok: false, error: 'That Discord handle looks wrong. Use your username, like @name.' }
      contact = c.startsWith('@') ? c : `@${c}`
    }
  }
  let image: string | undefined
  if (b.image !== undefined && b.image !== null && b.image !== '') {
    const im = checkImage(b.image)
    if (!im.ok) return im
    image = im.value.dataUrl
  }
  return { ok: true, value: { type: b.type, text, ...(contact ? { contact } : {}), ctx: checkContext(b.ctx), ...(image ? { image } : {}), seed } }
}

/** The size a picture is drawn at: the longest side at most max, never upscaled, whole pixels. */
export function fitWithin(w: number, h: number, max: number = REPORT.imageMaxPx): { w: number; h: number } {
  if (!(w > 0 && h > 0)) return { w: 0, h: 0 }
  const k = Math.min(1, max / Math.max(w, h))
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) }
}

/** A coarse device class from the user agent: form factor, system, browser. The raw string is never kept. */
export function uaClass(ua: string | null | undefined): string {
  const u = ua ?? ''
  if (!u) return 'unknown'
  if (/bot|crawler|spider|curl|wget|python|node-fetch|undici|headless/i.test(u)) return 'bot or script'
  const tablet = /iPad|Tablet|Android(?!.*Mobile)/i.test(u)
  const mobile = !tablet && /Mobi|iPhone|iPod|Android/i.test(u)
  const os = /iPhone|iPad|iPod/.test(u)
    ? 'iOS'
    : /Android/.test(u)
      ? 'Android'
      : /Windows/.test(u)
        ? 'Windows'
        : /Mac OS X|Macintosh/.test(u)
          ? 'macOS'
          : /CrOS/.test(u)
            ? 'ChromeOS'
            : /Linux/.test(u)
              ? 'Linux'
              : 'other'
  const br = /Edg\//.test(u)
    ? 'Edge'
    : /OPR\/|Opera/.test(u)
      ? 'Opera'
      : /Firefox\/|FxiOS/.test(u)
        ? 'Firefox'
        : /Chrome\/|CriOS/.test(u)
          ? 'Chrome'
          : /Safari\//.test(u)
            ? 'Safari'
            : 'other'
  return `${tablet ? 'tablet' : mobile ? 'mobile' : 'desktop'} · ${os} · ${br}`
}

/** Where the report came from, in words, for the app and the review page. */
const APP_NAME: Record<string, string> = {
  home: 'Home screen',
  page: 'Pool page',
  doctor: 'Fix my rig',
  ask: 'Ask Maria',
  pick: 'Pick hardware',
  connect: 'Connect',
  rig: 'My rig',
  record: 'The record',
  who: 'Who mines',
  help: 'Help',
}
export const contextLine = (c: ReportContext) => `${APP_NAME[c.app] ?? c.app}${c.step ? ` · ${c.step}` : ''}`

/** The report as a GitHub issue body, for the review page's copy button. Text inside a fence, never rendered raw. */
export function issueMarkdown(r: StoredReport, site = 'https://qubic.church'): { title: string; body: string } {
  const label = REPORT_TYPES.find(t => t.id === r.type)?.label ?? r.type
  const first = (r.text.split('\n')[0] ?? '').replace(/\s+/g, ' ').trim()
  const title = `[${label}] ${first.length > 72 ? `${first.slice(0, 71)}…` : first}`
  const fence = r.text.includes('```') ? '~~~~' : '```'
  const body = [
    `**Type:** ${label}`,
    `**From:** ${contextLine(r.ctx)}`,
    `**Device:** ${r.ua}`,
    `**Reported:** ${new Date(r.at).toISOString().replace('T', ' ').slice(0, 16)} UTC`,
    ...(r.contact ? [`**Contact:** Discord ${r.contact}`] : []),
    ...(r.img ? [`**Screenshot:** attached in the review page (${site}/pool/reports, report ${r.id})`] : []),
    '',
    `${fence}text`,
    r.text,
    fence,
    '',
    `<sub>Report ${r.id} from the ${POOL.name} Report app. Seeds and addresses were redacted before it was stored.</sub>`,
  ].join('\n')
  return { title, body }
}
