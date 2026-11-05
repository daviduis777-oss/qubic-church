/**
 * Log doctor: a rule set over a pasted miner log, or a described symptom.
 * Each finding cites the line that matched. Runs in the browser; logs are never sent anywhere.
 * A paste is usually the user's words around a log: rules marked logOnly read log-shaped lines only, and
 * rules with `when` / `unless` look at the whole paste (how long it has been, which device).
 *
 * Rules are written per failure class, not per message: a regex family per error, plus small parsers for
 * the tools miners paste (nvidia-smi in its three formats, lscpu, the client config). Findings are ranked
 * by tier first (safety, then the root cause, then generic symptoms, then context), then by severity, so a
 * known benign state (an epoch change, a pool-side miss) is never outranked by "computes nothing".
 * Validated on a dev set built from the raw Qubic Discord export (scratchpad devset/logs.jsonl).
 */
import { RIG } from './config.ts'
import { classifyCpu } from './hardware.ts'
import type { AnySource } from './practice.ts'
import { containsSeed } from './redact.ts'

export type Severity = 'fault' | 'check' | 'fine'
/** 0 safety (secrets, injected text), 1 root cause, 2 generic symptom, 3 context. Lower tiers lead. */
export type Tier = 0 | 1 | 2 | 3
/**
 * sources: where the fix comes from (practice.ts / knowledge.ts ids). Rules without it come from our mining guide.
 * logOnly: match only lines that look like miner output, never the user's own sentences.
 * when / unless: the whole paste must (not) match. drops: findings this one makes moot.
 * skipLine: lines this rule never reads (the epoch SEED line for the wallet-seed rule).
 * read: turn the matched line into a specific reading (for counters such as SOLS a/b (R:c)); null = not a hit.
 * open: a case with no confirmed fix; Maria's prompt lists it under OPEN CASES and says so first.
 * tier: ranking group (default 1, root cause).
 */
export type Rule = {
  id: string
  severity: Severity
  title: string
  means: string
  fix: string[]
  test: RegExp
  sources?: AnySource[]
  logOnly?: boolean
  when?: RegExp | ((log: string) => boolean)
  unless?: RegExp | ((log: string) => boolean)
  skipLine?: RegExp
  drops?: string[]
  read?: (m: RegExpExecArray, log: string) => { means: string; severity?: Severity } | null
  open?: boolean
  tier?: Tier
}
export type Finding = { id: string; severity: Severity; title: string; means: string; fix: string[]; line?: { n: number; text: string }; tier?: Tier }
export type Diagnosis = { status: Severity | 'empty' | 'unknown'; findings: Finding[]; seedWarning: boolean }

/** Our runs predate the later algorithm changes; every number from them says so. */
const OURS = 'our epoch 229/233 runs, predates the E235/E236 changes'

/** Never matches: rules whose findings come from a parser below, listed here so the prompt and the card see them. */
const PARSED = /(?!)/

/** Miner output, not prose: a timestamp, a [TAG], a table bar, JSON, "E:229", a key: value, a shell prompt, or a known counter. */
export const LOG_LINE =
  /^\s*(?:\d{4}-\d\d-\d\d|\d{1,2}[./]\d{1,2}[./]\d{2,4}\b|\d{1,2}:\d\d|(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\w{3}\s+\d|[[|{<"#]|E:\s?\d|(?:current |average |total )?hashrate\b|iterations?\b|(?:SOLS|SHARES|INFO|WARN|WARNING|ERROR|ERR|DEBUG|TRACE|FATAL)\b|(?:CUDA|AVX2|AVX512|CPU|GPU)\s*[:\]|]|[\w.-]+@[\w.-]+:|[A-Za-z][\w.-]{0,24}:\s)/

/** Pasted miner output rather than a typed question: at least two log-shaped lines, or nvidia-smi / JSON config. */
export function looksLikeLog(text: string): boolean {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return false
  if (/NVIDIA-SMI|\+-{5,}|"(?:accessToken|cpuVersion|alias|poolAddress)"\s*:/i.test(text)) return true
  return lines.filter(l => LOG_LINE.test(l)).length >= 2
}

/** The user says it has gone on for hours, days or weeks. */
export const LONG_TIME = /\b(?:\d+\s*(?:h|hrs?|hours?|days?|weeks?|months?)\b|(?:hours|days|weeks|months)\b|overnight|all night|since (?:last night|yesterday)|all day|endless(?:ly)?)/i
const MOBILE = /\b(?:app|mobile|phones?|android|apk|smartphone|cellphone)\b/i

/** An epoch seed printed by the miner, as opposed to a wallet seed the user pasted. */
const SEED_LOG_LINE = /^\s*(?:[\d:.T-]+\s+|\[[^\]]*\]\s*){0,4}SEED\b/
const WALLET_SEED = /(?<![A-Za-z])[a-z]{55}(?![A-Za-z])/
const TOKEN_VALUE = /("?access_?token"?\s*[:=]\s*"?)(?!<)[A-Za-z0-9_.-]{6,}|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_.-]{4,}/gi
/** A value somebody already blanked out: never judged as a real address, token or name. */
const REDACTED = /removed|redacted|hidden|<[^>]*>|\.{3,}|…|\*{3,}|x{5,}|^your\b|^null$|^$/i

/** it/s in the forms miners write it: 49 it/s, 15its, 2 its/s, 1.8 kH/s, 200H/s. */
const READOUT = /(?<![\w.])(\d+(?:[.,]\d+)?)\s*(k)?\s*(?:it\s?\/\s?s|its\/s|its\b|i\/s|h\/s|iter\/s)/gi

const WORDS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, few: 3, couple: 2, several: 4 }
/** The longest duration a text names, in hours (minutes count as fractions). "overnight" = 8 h. */
export function hoursIn(text: string): number {
  let best = 0
  const re = /(\d+(?:[.,]\d+)?|\b(?:a|an|one|two|three|four|five|six|seven|eight|nine|ten|twelve|few|couple|several)\b)(?:\s*(?:-|to|or)\s*(\d+(?:[.,]\d+)?))?\s*(?:of\s+)?(min(?:ute)?s?|h|hrs?|hours?|d|days?|weeks?|months?)\b/gi
  for (const m of text.matchAll(re)) {
    // a range ("6 or 7 hours") counts as its upper end
    const n = Number(m[2]?.replace(',', '.') ?? NaN) || (WORDS[m[1]!.toLowerCase()] ?? Number(m[1]!.replace(',', '.')))
    const u = m[3]!.toLowerCase()
    const h = u.startsWith('min') ? n / 60 : u === 'h' || u.startsWith('hr') || u.startsWith('hour') ? n : u === 'd' || u.startsWith('day') ? n * 24 : u.startsWith('week') ? n * 168 : n * 720
    best = Math.max(best, h)
  }
  if (/overnight|all night|since (?:last night|yesterday)|all day/i.test(text)) best = Math.max(best, 8)
  if (/\bfor (?:hours|days|weeks|months)\b|endless(?:ly)?/i.test(text)) best = Math.max(best, 3)
  if (/since (?:the )?(?:middle|start|beginning|end) of\b[^\n.]{0,20}epoch|since (?:the )?(?:last|previous) epoch|for (?:two|2|several|a few) epochs/i.test(text)) best = Math.max(best, 24)
  return best
}

/** Timestamps in a paste (ISO, "2026-10-28 12:03:11", "28.10.2026 12:03", "Wed Oct 28 12:03:11 UTC 2026"); UTC unless an offset is given. */
export function timestamps(lines: string[]): { n: number; at: Date }[] {
  const out: { n: number; at: Date }[] = []
  const MON = 'jan feb mar apr may jun jul aug sep oct nov dec'.split(' ')
  lines.forEach((l, n) => {
    let m = /(\d{4})-(\d\d)-(\d\d)[T ](\d\d):(\d\d)(?::(\d\d))?(?:[.,]\d+)?\s*(Z|[+-]\d\d:?\d\d)?/.exec(l)
    if (m) {
      const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? '00'}${m[7] ? (m[7] === 'Z' ? 'Z' : m[7].replace(/^([+-]\d\d)(\d\d)$/, '$1:$2')) : 'Z'}`
      const d = new Date(iso)
      if (!Number.isNaN(d.getTime())) out.push({ n, at: d })
      return
    }
    m = /\b(\d{1,2})[./](\d{1,2})[./](\d{4})[ ,]+(\d{1,2}):(\d\d)/.exec(l)
    if (m) {
      out.push({ n, at: new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]))) })
      return
    }
    m = /\b(?:mon|tue|wed|thu|fri|sat|sun)\w*\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})\s+(\d\d):(\d\d)(?::\d\d)?(?:\s+\w{2,5})?\s+(\d{4})/i.exec(l)
    if (m) out.push({ n, at: new Date(Date.UTC(Number(m[5]), MON.indexOf(m[1]!.toLowerCase()), Number(m[2]), Number(m[3]), Number(m[4]))) })
  })
  return out
}

/** Wednesday 12:00 to 13:30 UTC: the epoch change, when "waiting for tasks" is expected. */
export const atEpochChange = (d: Date) => d.getUTCDay() === 3 && d.getUTCHours() * 60 + d.getUTCMinutes() >= 12 * 60 && d.getUTCHours() * 60 + d.getUTCMinutes() <= 13 * 60 + 30

const spanHours = (log: string) => {
  const ts = timestamps(log.split(/\r?\n/)).map(t => t.at.getTime())
  return ts.length > 1 ? (Math.max(...ts) - Math.min(...ts)) / 3_600_000 : 0
}
/** The paste shows it has gone on for 2 hours or more: the user's words, or the log's own timestamps. */
const longPaste = (log: string) => LONG_TIME.test(log) || spanHours(log) >= 2
/** Waiting lines whose timestamps fall in the epoch change window. */
const waitingAtChange = (log: string) => {
  const lines = log.split(/\r?\n/)
  return timestamps(lines).some(t => WAITING.test(lines[t.n]!) && atEpochChange(t.at))
}
const WAITING = /waiting (?:for|to receive) (?:the )?(?:new )?(?:tasks?|jobs?|work)/i
/** Under 20 minutes since start, said in words, and nothing longer named. */
const tooEarly = (log: string) => {
  const h = hoursIn(log)
  return h > 0 && h < 1 / 3 && !LONG_TIME.test(log)
}

/** The zero-solution sentence, with the duration named in that same sentence. */
const ZERO_SOLS = /\b(?:no|0|zero|any|not (?:a )?single|nothing)\s+(?:new\s+)?(?:shares?|solutions?|sols?)\b|\b(?:shares?|solutions?|sols?|values?|counts?)\b[^\n.!?]{0,30}\b(?:still|is|are|at|said|says|show(?:s|ing)?(?: as)?|stay(?:s|ed)?|remain(?:s|ed)?|been)\s*(?:at\s*)?(?:0|zero)\b|\b0\s*\/\s*sols?\b|\b(?:mine|mined|find|found|get|getting|got)\s+nothing\b|neither received any/i
/** The user does see shares: "no sols" then is about solutions, not a dead rig. */
const SEES_SHARES = /\b(?:see|seeing|can see|got|getting|found|have)\s+(?:\d[\d,.]*\s+|many\s+|lots of\s+|a lot of\s+)?shares\b/i
const zeroSolsHours = (log: string) => {
  let best = -1
  for (const sentence of log.split(/[\n.!?]+/)) if (ZERO_SOLS.test(sentence)) best = Math.max(best, hoursIn(sentence))
  return best
}

/* ---------- nvidia-smi: the CSV query, the default table, and -q ---------- */

export type GpuRow = { n: number; name?: string; util?: number; temp?: number; power?: number; limit?: number; sm?: number; width?: number; widthMax?: number }

const num = (v: string | undefined) => {
  const m = v?.match(/-?\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : undefined
}

/** Every GPU row nvidia-smi printed in the paste, in any of its usual formats. */
export function parseNvidiaSmi(lines: string[]): GpuRow[] {
  const rows: GpuRow[] = []
  // CSV: --query-gpu=... --format=csv (header row, then one row per card)
  for (let i = 0; i < lines.length; i++) {
    const head = lines[i]!.toLowerCase()
    if (!/(utilization\.gpu|pcie\.link\.width|temperature\.gpu|power\.draw|clocks\.(?:current\.)?sm)/.test(head) || !head.includes(',')) continue
    const cols = head.split(',').map(c => c.trim())
    const at = (re: RegExp) => cols.findIndex(c => re.test(c))
    const ix = { name: at(/^name/), util: at(/^utilization\.gpu/), temp: at(/^temperature\.gpu/), power: at(/^power\.draw/), limit: at(/^(?:enforced\.)?power\.limit|^power\.limit/), sm: at(/^clocks\.(?:current\.)?sm/), width: at(/^pcie\.link\.width\.current/), widthMax: at(/^pcie\.link\.width\.max/) }
    for (let j = i + 1; j < lines.length; j++) {
      const cells = lines[j]!.split(',').map(c => c.trim())
      if (cells.length !== cols.length) break
      const get = (k: number) => (k >= 0 ? num(cells[k]) : undefined)
      rows.push({ n: j, name: ix.name >= 0 ? cells[ix.name] : undefined, util: get(ix.util), temp: get(ix.temp), power: get(ix.power), limit: get(ix.limit), sm: get(ix.sm), width: get(ix.width), widthMax: get(ix.widthMax) })
    }
  }
  // Default table: "| 30%   45C    P2   250W / 450W |  1234MiB / 24564MiB |  22%  Default |"
  const TABLE = /^\|\s*(?:\d+%|N\/A)\s+(\d+)C\s+P\d+\s+(?:\S+\s+)?(?:(\d+(?:\.\d+)?)W|N\/A)\s*\/\s*(?:(\d+(?:\.\d+)?)W|N\/A)\s*\|\s*\d+MiB\s*\/\s*\d+MiB\s*\|\s*(\d+)%/i
  lines.forEach((l, n) => {
    const m = TABLE.exec(l)
    if (!m) return
    const name = /\|\s*\d+\s+(?:NVIDIA\s+)?(.*?)\s{2,}/.exec(lines[n - 1] ?? '')?.[1]
    rows.push({ n, name, temp: Number(m[1]), power: num(m[2]), limit: num(m[3]), util: Number(m[4]) })
  })
  // -q: blocks per GPU with "Link Width", "Utilization", "Temperature", "Power Readings" sections
  let cur: GpuRow | null = null
  let section = ''
  lines.forEach((l, n) => {
    const t = l.trim()
    if (/^GPU [0-9A-F]{4,}:/i.test(t) || /^Product Name\s*:/i.test(t)) {
      if (!cur || cur.name !== undefined || /^GPU /i.test(t)) {
        if (cur && Object.keys(cur).length > 1) rows.push(cur)
        cur = { n }
      }
      const pn = /^Product Name\s*:\s*(.+)$/i.exec(t)
      if (pn && cur) cur.name = pn[1]
      return
    }
    const sec = /^(Link Width|Utilization|Temperature|(?:GPU )?Power Readings|Clocks(?: Event| Throttle)? ?(?:Reasons)?)\s*$/i.exec(t)
    if (sec) {
      section = sec[1]!.toLowerCase()
      return
    }
    const kv = /^([A-Za-z][\w .]*?)\s*:\s*(.+)$/.exec(t)
    if (!kv) return
    const [k, v] = [kv[1]!.toLowerCase(), kv[2]!]
    const row: GpuRow = cur ?? (cur = { n })
    if (section === 'link width' && (k === 'current' || k === 'max')) {
      const w = num(v)
      if (w !== undefined) {
        if (k === 'current') row.width = w
        else row.widthMax = w
        row.n = n
      }
    } else if (section === 'utilization' && k === 'gpu') row.util = num(v)
    else if (k === 'gpu current temp') row.temp = num(v)
    else if (k === 'power draw' || k === 'instantaneous power draw') row.power = num(v)
    else if (/^(current |enforced )?power limit$/.test(k) && /w/i.test(v)) row.limit = num(v)
  })
  if (cur && Object.keys(cur as GpuRow).length > 1) rows.push(cur)
  return rows.filter(r => r.util !== undefined || r.temp !== undefined || r.width !== undefined || r.power !== undefined)
}

/** How many GPUs the paste shows: nvidia-smi rows, nvidia-smi -L lines, or "4x RTX 4090" / "6 cards" in words. */
function gpuCount(log: string, rows: GpuRow[]): number {
  const listed = (log.match(/^\s*GPU \d+:\s*(?:NVIDIA|GeForce|Tesla|Quadro)/gim) ?? []).length
  let said = 0
  for (const m of log.matchAll(/\b(\d{1,2})\s*x\s*(?:rtx|gtx|nvidia|geforce|tesla)?\s*\d{3,4}|\b(\d{1,2})\s*(?:gpus|cards|graphics cards)\b|\b(?:rtx|gtx)\s*\d{3,4}\s*(?:ti|super)?\s*x\s*(\d{1,2})\b/gi)) said = Math.max(said, Number(m[1] ?? m[2] ?? m[3]))
  return Math.max(rows.length, listed, said)
}

/** CPU model names in a paste, for classifyCpu (lscpu "Model name", /proc/cpuinfo, or the user's words). */
export function cpuMentions(log: string): string[] {
  const out: string[] = []
  for (const m of log.matchAll(/model name\s*:\s*(.+)/gi)) out.push(m[1]!.trim())
  const re = /\b(?:amd\s+)?(?:ryzen\s*(?:threadripper\s*)?(?:pro\s*)?[3579]?\s*(?:pro\s*)?\d{4}[a-z0-9]*|threadripper\s*(?:pro\s*)?\d{4}[a-z]*|epyc\s*\d[0-9a-z]\d\d[a-z]?|(?:[3579]\d{3})x3d|\b[3579]\d{2}0x\b)|\b(?:intel\s+)?(?:core\s+)?(?:i[3579][- ]?\d{4,5}[a-z]{0,2}|i1[3-4]\d{3}[a-z]*|ultra\s*[579]\s*\d{3}[a-z]?|xeon\s*(?:platinum|gold|silver|bronze|e[357])?[- ]?\s*\d{4}[a-z]?(?:\s*v[1-4])?|celeron\s*\w*|pentium\s*\w*|atom\s*\w*)/gi
  for (const m of log.matchAll(re)) out.push(m[0].replace(/\bi1([34]\d{3})/i, 'i9-1$1'))
  return out
}

/** The CPU backend the paste selects: the QLI config key, a backend line, or "AVX2" alone on a setup line. */
function backendIn(log: string): string | null {
  const m = /"?cpuVersion"?\s*:\s*"?(AVX512|AVX2|GENERIC|ARM64|AUTO)/i.exec(log) ?? /\b(?:backend|cpu ?version|mode)\b[^\n]{0,15}\b(AVX512|AVX-512|AVX2|GENERIC)\b/i.exec(log) ?? /^\s*[•*-]?\s*(AVX2|GENERIC)\s*$/im.exec(log)
  return m ? m[1]!.toUpperCase().replace('-', '') : null
}

const ZERO_LOG = /(?:^|[^\d.,])0(?:\.0+)?\s*(?:it\s?\/\s?s|its\b|h\/s)|hashrate:?\s*0(?:\.0+)?\b(?!\.\d*[1-9])/i
const ZERO_PROSE = /\b(?:stuck|stays?|still|continuously|keeps?|always|showing|shows?|sits?|yielding|getting)\b[^\n.]{0,25}?(?<![\d.])0(?:\.0+)?\s*(?:it\s?\/\s?s|its\b|h\/s|hash ?rate)|\b(?:on|at) 0 hash ?rate|\bnearly zero hash/i

export const RULES: Rule[] = [
  /* ---------- tier 0: what the paste itself exposes ---------- */
  {
    id: 'wallet-seed',
    severity: 'fault',
    tier: 0,
    title: 'A wallet seed is in this paste',
    means: 'A 55-letter lowercase string is a wallet seed: the master key to the funds. Treat it as exposed: anyone who saw it can empty the wallet. I do not repeat it.',
    fix: [
      'Create a new wallet now and move every coin to it; do not wait.',
      'Delete the message or file that holds the seed, everywhere you posted it.',
      'The pool and the miner only need your 60-letter uppercase address, never the seed.',
    ],
    test: WALLET_SEED,
    skipLine: SEED_LOG_LINE,
  },
  {
    id: 'secret-leak',
    severity: 'fault',
    tier: 0,
    title: 'An access token is in this paste',
    means: 'The config holds an access token. It is a secret like a password: whoever has it can act as you on the pool that issued it.',
    fix: [
      'Do not post it publicly; delete the message if you already did.',
      'Ask the pool that issued it for a new token if it was exposed.',
      'Before sharing a config, replace the token with <removed>.',
    ],
    test: /"?access_?token"?\s*[:=]\s*"?(?!<)[A-Za-z0-9_-]{6,}|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{4,}/i,
  },
  {
    id: 'not-a-log-line',
    severity: 'fine',
    tier: 0,
    title: 'A line that is not from the miner',
    means: 'This line gives orders to an AI ("ignore previous instructions", "SYSTEM:"). No miner prints that: someone added it. I ignore it, and it changes nothing in the reading of the real log lines.',
    fix: ['Read the rest of the log as usual.', 'If you copied this log from someone else, get the original from the miner itself.'],
    test: /\b(ignore|disregard|forget) (all |any )?(the )?(previous|prior|above|earlier) (instructions|prompts?|rules)|#{2,}\s*system\s*:|\bsystem prompt\b|\byou are now (a|an|in)\b/i,
  },

  /* ---------- tier 1: root causes ---------- */
  {
    id: 'bracketed-paste',
    severity: 'fault',
    title: 'The terminal mangled the pasted command',
    means: 'The ^[[200~ / ^[[201~ markers (bash shows them as $\'\\E[200~\') are bracketed-paste codes from the terminal, not a miner or setup-page error: the shell received the codes as part of the command, so the command never ran as written. This happens in the Clore Jupyter terminal (our E229/E233 runs).',
    fix: [
      'Do not paste the command again into the same terminal: it breaks the same way.',
      'In Jupyter use New, Text File: paste the commands there, save, then run: bash /root/untitled.txt',
      "Or switch bracketed paste off first: printf '\\e[?2004l' then paste again. On 1 Oct 2026 a direct paste worked while a .sh file failed, so if one way fails try the other.",
      'On a rental the on-start command avoids pasting altogether.',
    ],
    test: /\^\[\[20[01]~|\\E\[20[01]~|\x1b\[20[01]~|(?:^|[\s'"`$(])\[20[01]~|\[\?2004[hl]/i,
    drops: ['permission', 'crash'],
    sources: ['clore', 'field-e229', 'field-e233'],
  },
  {
    id: 'address-not-public',
    severity: 'fault',
    title: 'The wallet field does not hold a public address',
    means: 'A Qubic address (public ID) is exactly 60 uppercase letters A to Z. The value in this field is not one, so the pool cannot pay it.',
    fix: ['Copy the address again from your wallet: 60 uppercase letters, no spaces.', 'Never put the 55-letter lowercase seed there.', 'Enter it on the pool setup page and run the command it gives again.'],
    test: /"?(?:qubicAddress|address|wallet|walletAddress|wallet_address|payoutAddress|payout_address|publicId)"?\s*[:=]\s*"([^"\n]*)"|--(?:wallet|address)[ =]"?([^\s"]+)/i,
    read: m => {
      const v = (m[1] ?? m[2] ?? '').trim()
      if (REDACTED.test(v) || /^[A-Z]{60}$/.test(v) || WALLET_SEED.test(v) || /^(wss?|https?):\/\//i.test(v)) return null
      const why = /^[a-z]{60}$/.test(v) ? 'it is lowercase; an address is uppercase' : /^[A-Za-z]+$/.test(v) ? `it has ${v.length} letters, not 60` : 'it contains characters other than the letters A to Z'
      return { means: `A Qubic address (public ID) is exactly 60 uppercase letters A to Z. This value is not one (${why}), so the pool cannot pay it.` }
    },
  },
  {
    id: 'package-download',
    severity: 'fault',
    title: 'Worker package download failed',
    means: 'The machine cannot download the worker package from the pool servers: usually the network or region of this box.',
    fix: [
      'Rent the box in another country and test it for 10 minutes. Our only regional data is stale and from another pool: in our epoch 229 runs (predates the E235/E236 changes) hosts in Russia and Belarus could not reach the jetski endpoints and a China terminal hung; this pool was never tested by region.',
      'On your own PC, check a firewall or VPN is not blocking it.',
    ],
    test: /worker package download failed|package download failed/i,
    sources: ['guide', 'field-e229'],
  },
  {
    id: 'cuda-missing',
    severity: 'fault',
    title: 'CUDA or the NVIDIA driver is missing',
    means: 'The miner cannot reach the card through CUDA.',
    fix: [
      'Rented box: do not install drivers or reboot inside the container. Pick an image with CUDA 12 or newer (12.4 or newer for RTX 50 / Blackwell cards: the Clore filter needed it on 6 Sep 2026), or another box.',
      'Your own machine: install the NVIDIA driver (Ubuntu: sudo ubuntu-drivers install), then reboot.',
      'Check with nvidia-smi: it must list your cards before you start the miner. No tested driver minimum for the current miner is known.',
    ],
    test: /no cuda[- ]capable device|cuda_error_no_device|no cuda devices? (found|detected)|libcuda\.so[^\n]*(cannot open|not found|no such file)|nvidia-smi: (command )?not found|failed to initiali[sz]e nvml|nvidia-smi has failed|no devices were found|cuda (driver|runtime)[^\n]*(not found|missing|failed to load)|could not (load|find) cuda|cudaGetDeviceCount[^\n]*fail|cuda init(ialization)? failed/i,
    sources: ['clore', 'ubuntuNvidia', 'field-e229'],
  },
  {
    id: 'driver-old',
    severity: 'fault',
    title: 'The NVIDIA driver is too old',
    means: 'The miner was built for a newer CUDA than your driver supports.',
    fix: ['Rented box: choose a newer CUDA image or another box; do not install drivers inside the container.', 'Your own machine: update the NVIDIA driver to a current release, then reboot.'],
    test: /driver version is insufficient|cuda_error_unsupported_ptx_version|cuda_error_insufficient_driver|unsupported (ptx|toolchain)|requires a newer (driver|cuda)/i,
  },
  {
    id: 'gpu-kernel-missing',
    severity: 'fault',
    title: 'The GPU trainer cannot find its compute kernel',
    means: '"Kernel with original name kern_solve_cand_start not found in map": the GPU trainer fails to load its CUDA kernel and the card mines nothing while it repeats. No confirmed fix yet: 4 to 5 Windows NVIDIA miners reported it on one pool\'s client (9 to 14 Oct 2026), unanswered. Other pools\' GPU miners worked on the same cards: that client\'s bug, not the card.',
    fix: [
      'Run the current miner from the pool setup page and restart it once.',
      'If it still repeats, mine CPU only for now and report it to the pool with the log, the GPU model and the OS.',
    ],
    test: /kernel with original name[^\n]{0,80}not found in map|\[qjm error\][^\n]{0,40}kernel|kernel[^\n]{0,40}not found in (the )?map/i,
    drops: ['zero-hashrate'],
    sources: ['community'],
    open: true,
  },
  {
    id: 'oom',
    severity: 'fault',
    title: 'Out of memory',
    means: 'The card or the machine ran out of memory and the miner stopped.',
    fix: ['Close other programs that use the GPU (games, other miners, AI tools).', 'Lower the thread count.', 'On a rented box, pick one with more RAM.'],
    test: /(?<!no )out of memory|cuda_error_out_of_memory|cudaErrorMemoryAllocation|std::bad_alloc|cannot allocate memory|oom[- ]kill|killed process \d+/i,
  },
  {
    id: 'no-avx',
    severity: 'fault',
    title: 'The CPU lacks the instructions this backend needs',
    means: 'The miner asked for AVX-512 or AVX2 and the CPU does not have it.',
    fix: ['Set the backend to AVX2, or Auto, on the pool setup page.', 'If AVX2 also fails, this CPU cannot mine: use a GPU or another machine.', 'Check on Linux: grep -o -m1 avx512f /proc/cpuinfo'],
    test: /illegal instruction|sigill|avx-?(2|512)[^\n]*(not (supported|available|found|detected)|unsupported|missing)|(cpu|processor) does not support avx|requires avx|status=4\/ill\b/i,
  },
  {
    id: 'invalid-wallet',
    severity: 'fault',
    title: 'The wallet address is rejected',
    means: 'The pool did not accept the address the miner sent.',
    fix: ['Use your address: exactly 60 uppercase letters, copied from your wallet.', 'Never the 55-letter seed.', 'Enter it again on the pool setup page and restart the miner.'],
    test: /invalid (wallet|address|payout|public ?id|qubic ?id)|(wallet|address)[^\n]{0,30}(invalid|malformed|not valid|rejected|wrong)|bad (wallet|address)/i,
  },
  {
    id: 'dns',
    severity: 'fault',
    title: 'The pool address does not resolve',
    means: 'DNS cannot find the pool server, so the miner never connects.',
    fix: ['Check the internet connection on that machine.', 'Set a public DNS resolver, for example 1.1.1.1 or 8.8.8.8.', 'If you copied a server name, copy it again from the setup page.'],
    test: /enotfound|eai_again|getaddrinfo|could not resolve|name or service not known|temporary failure in name resolution|no such host|nodename nor servname/i,
  },
  {
    id: 'connection',
    severity: 'fault',
    title: 'Cannot connect to the pool',
    means: 'The connection failed, was refused or timed out: the rig never reaches the pool, so it/s and solutions do not matter yet.',
    fix: [
      'Check the machine is online: ping 1.1.1.1',
      'Check a firewall, VPN or the host is not blocking outgoing connections.',
      `On a rental, try a host in another region with a 10-minute test. Our only regional data is stale and from another pool: in ${OURS}, Russian and Belarusian hosts could not reach the jetski endpoints; this pool was never tested by region.`,
      'Restart the miner once. If it persists, check the pool status channel.',
    ],
    // A line with HTTP 502 or websocket code 1006 is the pool side (rule pool-side), not this machine.
    test: /^(?![^\n]*\b(1006|502)\b)[^\n]*(econnrefused|connection refused|econnreset|connection reset|etimedout|connection timed out|connection (failed|timeout|lost|aborted)|timed? ?out[^\n]{0,20}connect|could not connect|failed to connect|unable to connect|cannot connect|socket (error|closed|hang up)|websocket[^\n]*(error|closed)|network is unreachable|disconnected from (the )?(pool|server))/i,
    sources: ['field-e229'],
  },
  {
    id: 'auth-mobile',
    severity: 'fault',
    title: 'A phone miner login was rejected (another pool\'s app)',
    means: 'On 2 Oct 2026 another pool\'s moderator said "Authentication failed" in its phone app meant the phone was blacklisted for sending too many shares in a short time, and that they were fixing it. Qubic Church Pool has no Android option.',
    fix: ['Mine on a PC or a server: the pool setup page offers Linux, macOS, Windows and HiveOS.', 'For that app, ask the pool that runs it.'],
    test: /authentication failed|auth(entication)? (error|rejected)/i,
    when: MOBILE,
    drops: ['phone-miner'],
    sources: ['community', 'qli-team'],
  },
  {
    id: 'auth',
    severity: 'fault',
    title: 'The pool rejected the login',
    means: 'A token or key the miner sent was not accepted.',
    fix: ['Take the values again from the pool setup page and restart.', 'Do not reuse a command from another pool.', 'On another pool\'s phone app "Authentication failed" meant the worker was blacklisted for sending too many shares too fast; its moderator said they were fixing it (2 Oct 2026).'],
    sources: ['guide', 'community'],
    test: /\b(401|403)\b[^\n]*(unauthori[sz]ed|forbidden)|unauthori[sz]ed|forbidden|invalid (token|access token|api key)|authentication failed/i,
    unless: MOBILE,
  },
  {
    id: 'defender',
    severity: 'fault',
    title: 'Windows Defender quarantined or blocked the miner',
    means: 'Microsoft lists cryptomining software as a potentially unwanted app category, so miner files get flagged and removed.',
    fix: [
      'Only if you downloaded it from the pool setup page: add the miner folder, and only that folder, as a Folder exclusion (Windows Security, Virus & threat protection, Manage settings, Exclusions, Add or remove exclusions).',
      'Then Protection history, open the item, Actions, Restore or Allow on device. A Blocked item was already removed: download it again from the setup page.',
      'Never exclude a whole drive or Downloads, and never for a miner from a chat link, a video or a "faster" fork.',
    ],
    test: /(windows|microsoft) defender|windows security[^\n]{0,40}(threat|quarantin|block)|threat (quarantined|blocked|found)|contains a virus or potentially unwanted software|(trojan|pua|program|hacktool):win(32|64)\/coinminer|\bcoinminer\b|potentially unwanted (app|application|software)/i,
    sources: ['defenderPua', 'defenderExclusion', 'defenderHistory'],
  },
  {
    id: 'smartscreen',
    severity: 'fault',
    title: 'SmartScreen stopped the miner from starting',
    means: '"Windows protected your PC" appears for files without reputation yet.',
    fix: ['Only for the miner from the pool setup page: choose More info, then Run anyway.', 'If it was not from the setup page, delete it and download the official one.'],
    test: /windows protected your pc|smartscreen|unrecognized app/i,
    sources: ['smartscreen'],
  },
  {
    id: 'gatekeeper',
    severity: 'fault',
    title: 'macOS will not open the miner',
    means: 'Gatekeeper blocks apps it cannot verify: "cannot be opened because the developer cannot be verified".',
    fix: [
      'Only for the miner from the pool setup page: try to open it once, then System Settings, Privacy & Security, scroll to Security, Open Anyway, and enter your password.',
      'The Open Anyway button stays for about an hour after the attempt.',
      'Control-click, Open only works before macOS 15 Sequoia.',
    ],
    test: /cannot be opened because (the developer cannot be verified|it is from an unidentified developer|apple cannot check it)|developer cannot be verified|apple could not verify|unidentified developer|is damaged and can.t be opened|not opened[^\n]{0,40}(apple|malware)/i,
    sources: ['gatekeeper', 'sequoia'],
  },
  {
    id: 'hive-install',
    severity: 'fault',
    title: 'HiveOS could not install the custom miner',
    means: 'The package behind the Installation URL did not download or unpack.',
    fix: [
      'Copy the Installation URL again from the pool setup page: it must be the direct link to the .tar.gz package.',
      'Leave Miner name as HiveOS fills it from the URL: the package name without version and extension.',
      'Check the rig is online (ping 1.1.1.1 in the Hive shell), then miner stop and miner start.',
      'Read the details with miner log.',
    ],
    test: /(custom miner|custom_(install_)?url|\/hive\/miners\/custom|h-(manifest\.conf|run\.sh|config\.sh|stats\.sh))[^\n]{0,80}(not found|fail|error|no such file|missing|cannot)|gzip: stdin: not in gzip format|tar: [^\n]*(cannot open|not in gzip format|error is not recoverable|unexpected eof)|no appsettings\.json/i,
    sources: ['hiveCustom', 'hiveShell', 'qubicliHive'],
  },
  {
    id: 'systemd',
    severity: 'fault',
    title: 'The miner service fails or keeps restarting',
    means: 'systemd started the miner, it exited, and Restart=always started it again.',
    fix: [
      'See why: journalctl -u qubic-miner -n 50 --no-pager. The real error is in the lines just above "Main process exited".',
      'status=203/EXEC: ExecStart is not an executable file. Use the full path and chmod +x /opt/qubic-miner/run.sh.',
      'status=200/CHDIR or 217/USER: the folder or the user named in the unit does not exist.',
      'Test it by hand as that user: sudo -u qubic /opt/qubic-miner/run.sh',
      'After a fix: sudo systemctl daemon-reload && sudo systemctl restart qubic-miner. After "Start request repeated too quickly", run sudo systemctl reset-failed qubic-miner first.',
    ],
    test: /\.service: (main process exited|failed with result|start request repeated too quickly|scheduled restart job|failed at step|control process exited)|start-limit-hit|activating \(auto-restart\)|status=2\d\d\/[a-z]+|failed to start [^\n]*\.service/i,
    sources: ['systemdService', 'journalctl', 'localCheck'],
  },
  {
    id: 'permission',
    severity: 'fault',
    title: 'The miner is not allowed to run',
    means: 'The file is not executable, or the folder is not writable.',
    fix: ['Make it executable: chmod +x ./<miner file>', 'Run it from a folder you own, such as your home folder.'],
    test: /permission denied|eacces|operation not permitted|cannot execute binary/i,
  },
  {
    id: 'duplicate-process',
    severity: 'fault',
    title: 'A second miner process on this machine',
    means: '"Ant stream closed" every few seconds, or "address already in use", means two miner processes fight over the same cards and port. A multi-card rig that also mines on the CPU can loop the same line.',
    fix: [
      'List the miner processes: ps aux | grep -i miner (Windows: Task Manager, Details).',
      'Stop all of them, then start one instance only. One process per box: splitting the cards across several processes crashed them in our runs.',
      `If only one runs and this is a rig with 3 or more cards, turn CPU mining off (GPU only) and keep 12 or more CPU threads per card: 6 cards plus CPU looped "Ant stream closed" every 2 seconds (7 Sep 2026, ${OURS}).`,
    ],
    test: /ant stream closed|address already in use|eaddrinuse|another instance (is )?(already )?running/i,
    sources: ['field-e229'],
  },
  {
    id: 'ant-temp-locked',
    severity: 'fault',
    title: 'The miner cannot open its own Ant Colony work files',
    means: 'System.IO.IOException on tmp.ant_*.part files "being used by another process" makes the miner crash after a short run. Reported on Windows on 2 Oct 2026 (after forcing AVX512 on a Ryzen 9900X); no confirmed fix yet.',
    fix: [
      'Make sure only one miner runs: stop every miner process (Task Manager, Details), then start one copy only.',
      'Keep the miner folder excluded from Defender or your antivirus (only for the miner from the pool setup page).',
      'Use the current miner from the pool setup page, and report the log to the pool.',
    ],
    test: /ioexception[^\n]{0,160}\.part\b|\bant_\d+_\d+\.part\b|\.part[^\n]{0,80}being used by another process/i,
    drops: ['crash', 'closes-at-start'],
    sources: ['community', 'defenderExclusion'],
    open: true,
  },
  {
    id: 'weak-host-cpu',
    severity: 'fault',
    title: 'The host CPU is too weak for the cards',
    means: 'On a GPU rig the CPU feeds and verifies every card. A budget chip (Celeron, Pentium, Atom) or 2 to 4 threads for several cards starves them: cheap multi-card rentals are often old mining frames with a Celeron on x1 risers (our epoch 233 notes).',
    fix: [
      'Keep at least 12 CPU threads per card (our epoch 233 runs, predates the E235/E236 changes).',
      'On a rental, close this box and filter for a server CPU with 24 or more cores.',
      'On your own rig, move the cards to a stronger host or run fewer cards on this one.',
    ],
    test: PARSED,
    sources: ['field-e229', 'field-e233', 'guide'],
  },
  {
    id: 'pcie-narrow',
    severity: 'check',
    title: 'The card sits on a narrow PCIe link',
    means: `x1, x2 or x4 can starve the card: on 8 Sep 2026 PCIe 4.0 x4 halved the throughput of 2x RTX 4090 against x8 (${OURS}), and x1 risers held RTX 5070 Tis to 50 to 70 it/s. The hit varies by card: our best cost-per-solution rig ran on 4.0 x4.`,
    fix: [
      'Use PCIe 4.0 x8 or 3.0 x16 per card. Check: nvidia-smi -q | grep -A2 "Link Width"',
      'A card in a lower power state can show a narrow link at idle: read it while mining.',
      'On a rental, pick another host: cheap multi-card boxes are often old mining frames on x1 risers.',
    ],
    test: /^\s*current\s*:\s*[124]x\s*$|lnksta:[^\n]*width x[124]\b/i,
    sources: ['field-e229'],
  },
  {
    id: 'gpu-starved',
    severity: 'check',
    title: 'The cards are waiting for work',
    means: 'GPU use under 50% while the card is cool means it is starved, not throttling: too few CPU threads, a narrow PCIe link, or the pool. 100% use at normal clocks is healthy (our runs, predates the E235/E236 changes).',
    fix: [
      'Check CPU threads per card (nproc divided by the number of cards: 12 or more) and the link width (nvidia-smi -q | grep -A2 "Link Width").',
      'If several rigs drop at the same time, it is the pool or the network: check the pool status channel.',
      'Run GPU only on rigs with 3 or more cards.',
    ],
    test: PARSED,
    sources: ['field-e229', 'field-e233'],
  },
  {
    id: 'cpu-threads',
    severity: 'check',
    title: 'Very low CPU it/s: check the thread count first',
    means: 'A few it/s on a desktop or server CPU usually means the miner runs with one or a few threads: CfB answered exactly this case (2 it/s on an i9-13900) with "Running with single thread probably" (2 Aug 2026). AVX2 CPUs add little in any case.',
    fix: ['Set Threads to the nproc count on a dedicated box (leave 1 or 2 free on a PC you use).', 'Check the backend matches the CPU: AVX512 on AVX-512 CPUs, Auto if unsure.', 'Judge by solutions on the pool, not it/s.'],
    test: PARSED,
    drops: ['zero-hashrate'],
    sources: ['cfb'],
  },
  {
    id: 'backend-avx2',
    severity: 'check',
    title: 'The CPU backend is not AVX512 on an AVX-512 CPU',
    means: 'This config forces AVX2 or a generic backend ("cpuVersion" is the key in the QLI client\'s config, not ours). On an AVX-512 CPU (every Ryzen 7000 and 9000 desktop CPU such as the 9900X, Threadripper 7000, EPYC 9004/9005) that wastes the CPU: on 2 Oct 2026 a Ryzen 9 9900X sat at 0 it/s with AVX2 and forcing "cpuVersion": "AVX512" fixed it.',
    fix: [
      'Check the CPU: lscpu | grep -o avx512f (Windows: Coreinfo). avx512f present: choose AVX512, or Auto if unsure.',
      'On this pool set the backend on the setup page and run the command it gives.',
      'If it then crashes on tmp.ant_*.part files, that is a separate open issue with no confirmed fix.',
    ],
    test: /"?cpuVersion"?\s*:\s*"(?:AVX2|GENERIC)"/i,
    drops: ['cpu-threads'],
    sources: ['community', 'academy'],
  },
  {
    id: 'old-gpu',
    severity: 'check',
    title: 'Pre-Turing card on the current CUDA worker',
    means: 'From epoch 237 (28 Oct 2026, client 3.11, worker cuda 237.0) a GTX 1050 Ti CUDA worker exited every few seconds though it worked in epoch 236 (reported), and a Tesla K80 does not run on current CUDA (20 Oct 2026). The pool said it would look; no fix confirmed by 4 Nov 2026 and no workaround is known.',
    fix: [
      'Treat GTX 10 series (Pascal), Kepler cards such as the K80 and older as unsupported until the pool confirms otherwise.',
      'The CPU still mines: keep the CPU backend on.',
      'Report the GPU model, driver and log to the pool. No older-algorithm option exists.',
    ],
    test: /\b(gtx ?(?:10[5-8]0|9[5-8]0|7[5-8]0)( ?ti)?|titan xp?|tesla ?(k80|k40|m40|m60|p4|p40|p100)|quadro ?[kmp]\d{3,4}|pascal|kepler|maxwell|sm_?[356]\d|compute capability [3-6]\.\d)\b|cuda 237\.0[^\n]{0,60}exit|workers?\b[^\n]{0,60}exits? every/i,
    drops: ['zero-hashrate'],
    sources: ['community', 'qli-team'],
    open: true,
  },
  {
    id: 'closes-at-start',
    severity: 'check',
    title: 'The miner closes right after it starts',
    means: 'A miner that closes within seconds is usually an outdated build (one was 3.8.10 while 3.9.1 was current, 6 Oct 2026, found by a miner) or a file your antivirus removed.',
    fix: [
      'Download the current miner from the pool setup page into its own new folder, and check the version it prints.',
      'Run it from a terminal (not by double-click) so the window stays open, and paste the last lines here.',
      'If files vanish, add only the miner folder as an antivirus exclusion (setup-page miner only).',
    ],
    test: /\b(?:closes|closing|shuts? (?:itself )?down|shutting down|exits|quits)\b[^\n.]{0,40}\b(?:after \d+|within|right after|as soon as|immediately|automatically|on start|seconds?|sec\b)|automatically closes|keeps (?:closing|shutting down|crashing)/i,
    drops: ['crash'],
    sources: ['community', 'guide'],
  },
  {
    id: 'crash',
    severity: 'fault',
    title: 'The miner crashed',
    means: 'It exited with a segmentation fault, a core dump or an unhandled exception.',
    fix: ['Download the current miner again from the setup page.', 'Try the backend Auto; if only the AVX512 worker crashes, try AVX2 and report it.', 'If it repeats, paste the 20 lines before the crash.'],
    test: /segmentation fault|core dumped|sigsegv|status=11\/segv\b|panicked at|fatal error|unhandled exception|exited with (exit )?code [1-9]|terminated unexpectedly|has stopped working|\bcrash(?:es|ed|ing)?\b[^\n.]{0,20}\b(?:repeatedly|again|every|after|loop)/i,
  },
  {
    id: 'stats-file',
    severity: 'check',
    title: 'The saved solutions file for this epoch is damaged',
    means: '"failed to restore persisted solutions" or "decode stats file ... invalid character \'\\x00\'": the stats.<epoch>.lock file in the miner folder holds null bytes. Asked on 1 Oct 2026 and never answered: no confirmed fix yet.',
    fix: [
      'Stop the miner, back up the stats.<epoch>.lock file and move it out of the miner folder, then start the miner again.',
      'If it comes back, report it to the pool with the log.',
    ],
    test: /failed to restore persisted solutions|decode stats file|stats\.\d{3}\.lock/i,
    sources: ['community'],
    open: true,
  },
  {
    id: 'duplicate-worker',
    severity: 'check',
    title: 'Two machines share one worker name',
    means: 'The dashboard blurs them and one looks dead.',
    fix: ['Give every machine its own name, for example QC.rig-a and QC.rig-b.', 'Restart the miner on one of them with the new name.'],
    test: /duplicate worker|worker (name )?(already|is already) (in use|connected|registered|exists)|same worker name/i,
  },
  {
    id: 'worker-not-qc',
    severity: 'check',
    title: 'The worker name does not start with QC.',
    means: 'On Qubic Church Pool a worker name starts with QC. (for example QC.5070ti-a) and is unique per machine. If this config is for another pool, that pool\'s own naming applies.',
    fix: ['Rename the worker to QC.<something unique> on the pool setup page and run the command it gives.', 'One name per machine, so two rigs never merge on the dashboard.'],
    test: /"?(?:alias|worker|workerName|worker_name|rigName|rig_name)"?\s*[:=]\s*"([^"\n]*)"|--(?:worker|alias)[ =]"?([^\s"]+)/i,
    read: m => {
      const v = (m[1] ?? m[2] ?? '').trim()
      if (REDACTED.test(v) || v.startsWith('QC.') || /%[A-Z_]+%/.test(v)) return null
      return { means: `This worker name does not start with QC. On Qubic Church Pool every worker name starts with QC. (for example QC.5070ti-a) and is unique per machine. If this config is for another pool, that pool's own naming applies.` }
    },
  },
  {
    id: 'phone-miner',
    severity: 'check',
    title: 'A phone miner (another pool\'s app)',
    means: 'Qubic Church Pool has no Android option. Phone miners come from another pool\'s app (an Android beta since 22 Aug 2026), and in Oct 2026 phones there were erratic: days at 0 and most shares invalid in some epochs, which that pool called a backend issue (21 Oct). Not measured by us.',
    fix: ['For that app, ask the pool that runs it.', 'For this pool, mine on a PC or a server: Linux, macOS, Windows or HiveOS from the setup page.'],
    test: /\b(?:mobile|phone|android|apk|cellphone)\b[^\n]{0,60}\b(?:stopped|not working|doesn.t work|don.t work|zero|0|invalid|shut down|failed|no (?:shares|solutions))|\b(?:stopped|zero|invalid|failed)\b[^\n]{0,40}\b(?:mobile|phone|android) (?:mining|miner|app)/i,
    sources: ['qli-team', 'community'],
  },
  {
    id: 'thermal',
    severity: 'check',
    title: 'The hardware is throttling',
    means: 'It is too hot and slows itself down: clocks dropping at 85 C or more is heat (our runs). A hot reading alone is not a fault: our RTX 4070 Super ran a hotspot of 82 to 89 C, which we treated as normal (epoch 229, 5 Sep 2026).',
    fix: ['Improve airflow and clean the fans.', 'Lower the power limit a little and compare solutions per hour.', 'Lower the thread count on a laptop.'],
    test: /^(?!.*\bnot active\b)(?!\s*clocks? (event|throttle) reasons\s*:?\s*$).*(thermal (slowdown|throttl|limit)|throttl|temperature (too high|limit|critical)|overheat)/i,
  },
  {
    id: 'gpu-power',
    severity: 'check',
    title: 'The card is held by its power limit',
    means: 'nvidia-smi shows the clocks held down by power: expected at a limit you or the host set (hosts cut RTX 5080s to 250 W and 5090s to 400 W, and our record rig ran at 250 W per card, epoch 233, predates the E235/E236 changes), a problem only if nobody set one.',
    fix: [
      'If you or the host set the limit, this is expected. Compare solutions per hour, not it/s.',
      'If you did not: check the limit with nvidia-smi -q -d POWER and raise it toward the default with sudo nvidia-smi -pl <WATTS>.',
      'HW Slowdown or HW Power Brake: check the power supply and its cables, and the cooling.',
    ],
    test: /(sw power cap|hw slowdown|hw power brake slowdown)\s*:\s*active\b|power[- ]limit(ed)?[^\n]{0,20}(reached|exceeded|hit)|(gpu|card|cuda)[^\n]{0,30}(power[- ]limited|power cap\b)/i,
    sources: ['nvidiaSmi', 'pugetPower', 'field-e233'],
  },
  {
    id: 'old-miner',
    severity: 'check',
    title: 'The miner may be too old for the current algorithm',
    means: 'After an algorithm change an old miner keeps showing it/s while its work no longer counts: really old clients sent only invalid shares (QLI, 1 Aug 2026). Epoch 235 changed the threshold and task file, epoch 236 moved to 32-neuron networks, epoch 237 brought new workers again.',
    fix: [
      'Download the current miner from the pool setup page and restart it once.',
      'Miners built for other pools (jetski included, not recommended) do not work on this pool: use the setup page miner.',
      'A new algorithm can take 1 to 2 epochs to settle; QLI said at least 3 days, with 0 or very many shares at first (29 Sep 2026). Judge by solutions on the pool, not it/s.',
      'AutoUpdate failed for some workers on 2 to 4 Nov 2026: check the version the miner prints after every change.',
    ],
    test: /(client|miner|trainer|version)[^\n]{0,40}(outdated|too old|deprecated|no longer supported|mismatch|update required|please update|please upgrade)|(new|newer) version (is )?available|minimum (client )?version|invalid (share|solution)s?\b|\b(?:shares?|solutions?)\b[^\n.]{0,15}\b(?:were|are|is|was)\s+invalid\b|(share|solution) format|unsupported (task|template|algorithm)|unknown (task|template) (file|format|version)/i,
    sources: ['field', 'qli-mod', 'qli-team'],
  },
  {
    id: 'idle-long',
    severity: 'check',
    title: 'Waiting for tasks far too long',
    means: '"Waiting to receive tasks" is normal at an epoch change and in the first minutes, not for days or weeks. A Windows case like this (14 Oct 2026) went unanswered: no confirmed cause.',
    fix: [
      'Install the current miner from the pool setup page.',
      'Check the pool status channel.',
      'Keep the Defender or antivirus exclusion for the miner folder.',
      'Then paste the full log, from the start to the waiting line.',
    ],
    test: WAITING,
    when: longPaste,
    unless: waitingAtChange,
    sources: ['community'],
    open: true,
  },
  {
    id: 'foreign-endpoint',
    severity: 'check',
    tier: 3,
    title: 'This config points to another pool',
    means: 'The pool address is another pool\'s endpoint, not Qubic Church Pool. Its status, share rules and support are that pool\'s.',
    fix: ['For problems with that pool, check its status channel.', 'To mine on Qubic Church Pool, use the command from its setup page.'],
    test: /wss?:\/\/[^\s"']*(qubic\.li|jetski|jtsk|minerlab|apool)/i,
  },
  {
    id: 'sleep',
    severity: 'check',
    title: 'The machine went to sleep',
    means: 'Sleep stops mining until the machine wakes up.',
    fix: [
      'Windows: powercfg /change standby-timeout-ac 0 and powercfg /change hibernate-timeout-ac 0, or set sleep to Never when plugged in.',
      'macOS: run the miner as caffeinate -dimsu ~/qubic-miner/run.sh and keep the power adapter in, or turn on Prevent automatic sleeping in Energy (Battery, Options on a MacBook).',
      'Linux: sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target',
    ],
    test: /pm: suspend (entry|exit)|systemd-sleep|reached target (sleep|suspend|hibernate)|(entering|going to) (sleep|suspend|hibernat)|suspending system|idle sleep|kernel-power[^\n]*(\b42\b|\b107\b|sleep)|(resumed|resume|wake|woke)( up)? from (sleep|suspend|standby|hibernat)|darkwake/i,
    sources: ['powercfg', 'winPower', 'caffeinate', 'macSleep', 'localCheck'],
  },
  {
    id: 'cold-start',
    severity: 'fine',
    title: 'Cold start',
    means: '"No trainer available", "wait for propagation", "bind failed" and status "starting" are normal for the first minutes.',
    fix: ['Do not restart in a loop: each restart resets the wait and the progress.', `Wait at least 20 minutes, and until after the "Ant work replaced" line if the log prints it, then judge by solutions (${OURS}).`],
    test: /no trainer available|wait(ing)? for propagation|bind failed(?![^\n]*in use)|status"?\s*[:=]\s*"?starting/i,
    drops: ['zero-hashrate', 'no-shares'],
    sources: ['field-e233'],
  },
  {
    id: 'too-early',
    severity: 'fine',
    title: 'Too early to judge',
    means: 'Under 20 minutes, 0 it/s or 0 solutions on the dashboard is normal: the rig warms up, solutions come in bursts, and pool dashboards lag (a miner, 9 Sep 2026: "up to 10 behind").',
    fix: ['Wait at least 20 minutes, and until after the "Ant work replaced" line if the log prints it.', 'Give every machine its own worker name, so the dashboard does not merge them.', 'Still 0 after 20 minutes with a normal it/s: restart once and wait 10 more; still 0: close a rental, or paste the log here.'],
    test: /\b(?:dashboard|pool|worker|solutions?|shares?|it\/s|hash ?rate)\b/i,
    when: tooEarly,
    drops: ['zero-hashrate', 'no-shares', 'dashboard-lag'],
    sources: ['field-e229', 'field-e233', 'community'],
  },
  {
    id: 'pool-side',
    severity: 'fine',
    title: 'A pool-side error, not your rig',
    means: 'HTTP 502, websocket close 1006 and a refused connection to 127.0.0.1:8093, together, are a pool outage. "retired-lease progress rejected", "ant lease expired", "active search cancelled" (1 to 2 minute pauses) and "Submission backlog" are the pool changing work: routine.',
    fix: ['Leave the rig alone. Do not restart: a restart resets the warm-up.', 'Wait 5 to 15 minutes. If nothing moves after 20 to 30 minutes, check the pool status channel.', 'Solutions found during an outage may be lost; that is not your rig.'],
    test: /\b(http|status|code)\D{0,6}50[234]\b|bad gateway|service unavailable|gateway time-?out|websocket[^\n]{0,40}\b1006\b|\bclose[ds]?\D{0,8}1006\b|127\.0\.0\.1:8093[^\n]*(refused|econnrefused)|(refused|econnrefused)[^\n]*127\.0\.0\.1:8093|retired-lease progress rejected|(ant )?lease expired|ant progress rejected|ant work unavailable|active search cancelled|submission backlog|\borphaned\b/i,
    drops: ['connection', 'zero-hashrate'],
    read: m =>
      /50[234]|bad gateway|service unavailable|gateway time|1006|8093/i.test(m.input)
        ? { means: 'HTTP 502, websocket close 1006 and a refused connection to 127.0.0.1:8093, together, are a pool outage, not your rig. Solutions found during it may be lost.' }
        : { means: 'Routine: "retired-lease progress rejected", "ant lease expired", "active search cancelled" (1 to 2 minute pauses) and "Submission backlog" are the pool changing work. Not your rig.' },
    sources: ['field-e233'],
  },
  {
    id: 'ant-parent',
    severity: 'fine',
    title: 'The pool is missing the Ant Colony parent',
    means: '"parent ... not found", "server cache miss" or "0 walks served" means the pool did not have the work your worker asked for, so it/s drops to 0 for minutes. Pool side, nothing to fix locally: a "Parent LUT" fault stopped one pool for about 2 days in epoch 231 (Sep 2026), and cache misses came back on 21 Oct 2026, during that pool\'s 21 to 23 Oct outage.',
    fix: ['Leave the rig running; do not restart in a loop, and do not change threads or backend for this.', 'If it lasts more than 30 minutes on several rigs, check the pool status channel and report it with timestamps.', 'Judge by solutions over the epoch.'],
    test: /antcolony:?[^\n]{0,20}parent[^\n]{0,80}not found|server cache miss|\b0 walks served|parent lut/i,
    drops: ['zero-hashrate', 'zero-shares-long', 'no-shares'],
    sources: ['community', 'qli-team'],
  },
  {
    id: 'pool-frozen',
    severity: 'fine',
    title: 'Shares frozen or not counting',
    means: 'Shares frozen, "reseeding", shares not going up or "miners locked" across rigs is pool or backend lag, most often around an epoch change (Wednesday 12:00 UTC). Not your rig.',
    fix: ['Wait; leave the rig running.', 'Restart the miner once if you want to be sure, never in a loop.', 'If it lasts hours, check the pool status channel.'],
    test: /\breseed(?:ing)?\b|shares?[^\n.]{0,25}(?:frozen|not (?:counting|going up|moving))|(?:miners?|rigs?) (?:are |all )?(?:locked|frozen)|looks frozen|full locked/i,
    drops: ['zero-hashrate', 'no-shares'],
  },
  {
    id: 'epoch-idle',
    severity: 'fine',
    title: 'Idle at an epoch change',
    means: 'At Wednesday 12:00 UTC the miner waits for the backend update, then continues; "waiting to receive tasks" is also normal for the first minutes after a start. An idle miner wastes no power.',
    fix: ['Do nothing. It resumes on its own.', 'Restart once only if it stays idle for more than an hour (est.).', 'Waiting for tasks for hours outside an epoch change: update the miner and check the pool status channel.'],
    test: /epoch (transition|change|switch|rollover)|waiting (for|to receive) (the )?(new )?(epoch|tasks?|jobs?|work)|new epoch\b[^\n]{0,30}(start|wait|begin)|idl(e|ing)[^\n]{0,30}epoch/i,
    unless: log => longPaste(log) && !waitingAtChange(log),
    drops: ['zero-hashrate', 'no-shares', 'idle-long'],
  },
  {
    id: 'bursts',
    severity: 'fine',
    title: 'Solutions come in bursts',
    means: 'Few or no solutions for an hour while the miner runs is normal under Ant Colony: solutions arrive in bursts, and a harder branch can drop the rate to almost nothing for hours (a pool operator, 5 Oct 2026). Even our top rigs had empty minutes.',
    fix: ['Leave it running; do not restart in a loop.', 'Judge over 6 to 12 hours and by the wallet total after the epoch.', 'If nothing comes for hours on several rigs, check the pool status channel.'],
    test: /\b(?:dif\w*lt|hard|harder)\b[^\n.]{0,15}\bto find\b[^\n.]{0,15}\b(?:shares?|solutions?|sols?)|\b(?:only|just)\s+(?:gotten\s+|got\s+|found\s+)?\d+\s*(?:sols?|solutions?|shares?)\b[^\n.]{0,20}\b(?:an? |one |1 )?hour|\b(?:not (?:able to )?(?:mine|find|get)|no) (?:a )?single (?:solution|share|sol)\b/i,
    unless: log => zeroSolsHours(log) >= 2,
    sources: ['community', 'field-e233'],
  },
  {
    id: 'dashboard-lag',
    severity: 'fine',
    title: 'The pool dashboard shows less than the miner',
    means: 'The miner reports work but the pool dashboard shows 0 or fewer: dashboards lag and can drop rows (a miner, 9 Sep 2026: "up to 10 behind"), two rigs on one worker name look like one dead worker, and one pool rejected shares on its side on 11 to 13 Sep 2026.',
    fix: ['Give every machine its own worker name.', 'Judge by the wallet total after the epoch, and keep your miner log and a dashboard screenshot before the epoch ends.', 'If many miners report the same, it is the pool: check its status channel.'],
    test: /\b(?:dashboard|pool site|platform|site|statistics|stats)\b[^\n.]{0,60}\b(?:0 shares|zero|nothing|offline|inactive|dead|doesn.t show|does not show|not show|shows? less|fewer|disappeared|missing|0 it\/s|0 IT\/S)|\b(?:none|not one share)\b[^\n.]{0,30}\b(?:appearing|shown|showing|posted)\b|disappeared from (?:the )?statistics/i,
    sources: ['community', 'qli-team'],
  },

  /* ---------- tier 2: generic symptoms (a root cause above outranks them) ---------- */
  {
    id: 'rejected',
    severity: 'check',
    tier: 2,
    title: 'Many rejected or expired candidates',
    means: `A few rejects are normal (our record rig: R:9 in 14 h, ${OURS}); many are not. The most common cause after an algorithm change is an outdated client.`,
    fix: [
      'Update the miner from the pool setup page and check the version it prints.',
      'Make sure only one miner process runs on the box.',
      'If both are fine, it can be the pool side: check the pool status channel.',
      'Last, the CPU: keep 12 or more threads per card, and a reliable host (98%+).',
    ],
    test: /(rejected|expired|stale)[^\n]{0,20}(ant )?(candidates?|shares?|solutions?)|(candidates?|shares?|solutions?)[^\n]{0,10}(rejected|expired|stale)|\brejections?\b|\brejects?\b/i,
    sources: ['qli-team', 'field-e233'],
  },
  {
    id: 'zero-shares-long',
    severity: 'check',
    tier: 2,
    title: 'SHARES 0/0 for hours, or no solutions for hours',
    means: 'Past the 20-minute rule, 0 shares or solutions for hours means the pool is down or changing work, or the client is out of date. Pools broke often: one was down 2 to 4 Nov 2026 and said a new feature worked for some workers but not others (3 Nov). No confirmed cause for a single rig.',
    fix: [
      'Check the status channel of the pool this miner points to first.',
      'Confirm the miner prints the current version (AutoUpdate failed for some workers on 2 to 4 Nov 2026).',
      'If the pool is up and it stays at 0: on a rental, close it; on your own machine, report it to that pool with the log.',
    ],
    test: /SHARES:?\s*0\s*\/\s*0\b/i,
    when: longPaste,
    sources: ['qli-team', 'community'],
    open: true,
  },
  {
    id: 'no-shares',
    severity: 'check',
    tier: 2,
    title: 'No shares yet',
    means: 'In the first 20 minutes 0 is normal. After an algorithm change both 0 and very many shares are normal while it settles: QLI said at least 3 days (29 Sep 2026), and Ant Colony "takes longer, you have to find a good branch" (27 Aug 2026). An old client shows it/s for work that no longer counts.',
    fix: ['Check the miner prints the current version; if not, download it from the setup page.', 'Run at least 20 minutes, then check the pool status channel.', 'Judge by the wallet total after the epoch, not the first day.'],
    test: ZERO_SOLS,
    unless: log => zeroSolsHours(log) >= 2 || /\b0 walks served\b/i.test(log) || SEES_SHARES.test(log),
    sources: ['qli-team'],
  },
  {
    id: 'zero-hashrate',
    severity: 'check',
    tier: 2,
    title: 'The miner computes nothing (0 it/s)',
    means: 'The readout is 0 it/s. In the first minutes that is the cold start. Later, on a CPU the usual cause is the wrong backend (an AVX-512 CPU set to AVX2) or too few threads; on a GPU, a missing CUDA driver or an old card.',
    fix: [
      'Just started: wait 20 minutes before judging.',
      'Check the backend matches the CPU: AVX512 on AVX-512 CPUs, Auto if unsure.',
      'Set Threads to the nproc count on a dedicated box, and use the current miner from the setup page.',
    ],
    test: PARSED,
  },
  {
    id: 'sols-counter',
    severity: 'fine',
    tier: 2,
    title: 'Solutions counter (SOLS)',
    means: 'SOLS a/b (R:c) = solutions found / sent to the pool (rejected).',
    fix: ['Judge by solutions per hour on the pool and the wallet total, over 6 to 12 hours.', `A few rejects are normal: our record rig had R:1 in 2 h from one "orphaned" send and R:9 in 14 h (${OURS}).`],
    test: /SOLS\s+(\d+)\s*\/\s*(\d+)\s*\(\s*R\s*:\s*(\d+)\s*\)/i,
    read: m => {
      const [found, sent, rej] = [Number(m[1]), Number(m[2]), Number(m[3])]
      const pct = sent ? (rej / sent) * 100 : 0
      const many = rej >= 5 && pct >= RIG.rejectedCheckPct
      const gap = found > sent ? ` The ${found - sent} not yet sent ${found - sent === 1 ? 'is' : 'are'} in flight.` : ''
      const verdict = many
        ? ` ${pct.toFixed(1)}% rejected is more than a few: check the miner version first, then for a second miner process, then the pool status.`
        : ` ${rej === 0 ? 'No rejects' : rej === 1 ? 'One reject' : `${rej} rejects`}: normal, the rig is working.`
      return { means: `SOLS ${found}/${sent} (R:${rej}): ${found} found, ${sent} sent to the pool, ${rej} rejected.${gap}${verdict}`, severity: many ? 'check' : 'fine' }
    },
    sources: ['field-e233'],
  },

  /* ---------- tier 3: context ---------- */
  {
    id: 'epoch-seed',
    severity: 'fine',
    tier: 3,
    title: 'SEED is the epoch seed, not your wallet',
    means: 'The SEED line in a miner log is the epoch seed, not your wallet seed: nothing leaked. A wallet seed is 55 lowercase letters you never paste anywhere.',
    fix: ['Nothing to do.', 'Never paste your wallet seed anywhere; the pool only needs the 60-letter address.'],
    test: SEED_LOG_LINE,
    sources: ['field-e233'],
  },
  {
    id: 'gpu-ok',
    severity: 'fine',
    tier: 3,
    title: 'The cards look healthy',
    means: 'High GPU use at a normal temperature is what a working card looks like (our E233 4x 5090 rig: 65 to 72 C, 100% use, 30 Sep 2026). Up to the high 80s is not a fault by itself: our RTX 4070 Super ran a hotspot of 82 to 89 C, treated as normal (epoch 229, 5 Sep 2026); heat matters when clocks drop at 85 C or more.',
    fix: ['Judge by solutions per hour on the pool, not it/s: it/s falls through an epoch with no change in solutions.'],
    test: PARSED,
    sources: ['field-e229', 'field-e233'],
  },
  {
    id: 'mining',
    severity: 'fine',
    tier: 3,
    title: 'It is mining',
    means: 'The log shows a non-zero it/s readout, so the miner is working.',
    fix: [`Wait at least 20 minutes, and until after "Ant work replaced", before judging; read the rate after 2 hours: the first 1 to 2 hours ran about 1.3 to 1.5x high (${OURS}).`, 'Judge by solutions per hour on the pool and the wallet total, not it/s: it/s falls through an epoch with no change in solutions.', 'Leave it running. Hopping machines every few minutes only burns money.'],
    test: /(?<![\w.])(?!0(?:[.,]0+)?\s*(?:k\s*)?(?:it|i\/|h\/))\d+(?:[.,]\d+)?\s*(?:k\s*)?(?:it\s?\/\s?s|its\/s|its\b|h\/s)/i,
    logOnly: true,
  },
]

const ORDER: Record<Severity, number> = { fault: 0, check: 1, fine: 2 }
const RULE_INDEX = new Map(RULES.map((r, i) => [r.id, i]))
const rule = (id: string) => RULES[RULE_INDEX.get(id)!]!
const finding = (id: string, n: number | undefined, text: string | undefined, over: Partial<Finding> = {}): Finding => {
  const r = rule(id)
  return { id, severity: r.severity, title: r.title, means: r.means, fix: r.fix, tier: r.tier ?? 1, ...(n !== undefined && text !== undefined ? { line: { n: n + 1, text: mask(text) } } : {}), ...over }
}

/** Never echo a secret: seeds and tokens are masked in every line a finding quotes. */
export const mask = (text: string) =>
  text
    .replace(new RegExp(WALLET_SEED.source, 'g'), '[seed removed]')
    .replace(TOKEN_VALUE, (m, key: string | undefined) => (key ? `${key}<removed>` : '<removed>'))
    .trim()
    .slice(0, 240)

const test = (cond: Rule['when'], log: string) => (cond instanceof RegExp ? cond.test(log) : cond ? cond(log) : false)

/** Findings that need more than one line: nvidia-smi, the host CPU, the backend, the CPU rate, 0 it/s. */
function parsed(log: string, lines: string[]): Finding[] {
  const out: Finding[] = []
  const rows = parseNvidiaSmi(lines)
  const gpus = gpuCount(log, rows)

  // nvidia-smi: link width, use, temperature, power
  const narrow = rows.filter(r => r.width !== undefined && r.width <= 4 && (r.widthMax === undefined || r.widthMax > r.width))
  if (narrow.length) {
    const w = Math.min(...narrow.map(r => r.width!))
    const idle = narrow.every(r => r.util !== undefined && r.util < 10)
    out.push(
      finding('pcie-narrow', narrow[0]!.n, lines[narrow[0]!.n], {
        severity: w <= 2 && !idle ? 'fault' : 'check',
        means: `nvidia-smi shows ${narrow.length} card${narrow.length > 1 ? 's' : ''} on PCIe x${w}${narrow[0]!.widthMax ? ` (the slot can do x${narrow[0]!.widthMax})` : ''}. ${rule('pcie-narrow').means}${idle ? ' The cards are idle here, so read the link again while mining.' : ''}`,
      }),
    )
  }
  const used = rows.filter(r => r.util !== undefined)
  const starved = used.filter(r => r.util! < 50 && (r.temp === undefined || r.temp < 80))
  if (starved.length && starved.length * 2 >= used.length) {
    const u = starved.map(r => r.util!)
    const range = Math.min(...u) === Math.max(...u) ? `${u[0]}%` : `${Math.min(...u)} to ${Math.max(...u)}%`
    out.push(finding('gpu-starved', starved[0]!.n, lines[starved[0]!.n], { means: `GPU use is ${range} on ${starved.length} of ${used.length} card${used.length > 1 ? 's' : ''}${starved[0]!.temp !== undefined ? ` at ${Math.min(...starved.map(r => r.temp ?? 0))} C or cooler` : ''}: the cards wait for work, not for heat. ${rule('gpu-starved').means.replace(/^GPU use under 50% while the card is cool means it is starved, not throttling: /, 'Usual causes: ')}` }))
  }
  const hot = rows.filter(r => r.temp !== undefined && r.temp >= 90)
  if (hot.length) out.push(finding('thermal', hot[0]!.n, lines[hot[0]!.n], { means: `nvidia-smi shows ${Math.max(...hot.map(r => r.temp!))} C. ${rule('thermal').means}` }))
  const capped = rows.filter(r => r.power !== undefined && r.limit !== undefined && r.limit > 0 && r.power >= r.limit * 0.95)
  if (capped.length) out.push(finding('gpu-power', capped[0]!.n, lines[capped[0]!.n], { severity: 'fine', tier: 3, means: `The card draws ${capped[0]!.power} W against a ${capped[0]!.limit} W limit: it runs at its power limit. ${rule('gpu-power').means.replace(/^nvidia-smi shows the clocks held down by power: /, 'That is ')}` }))
  if (used.length && !starved.length && !hot.length && used.every(r => r.util! >= 80)) {
    const t = rows.filter(r => r.temp !== undefined).map(r => r.temp!)
    out.push(finding('gpu-ok', used[0]!.n, lines[used[0]!.n], { means: `GPU use ${Math.min(...used.map(r => r.util!))}% or more${t.length ? ` at ${Math.min(...t)} to ${Math.max(...t)} C` : ''}. ${rule('gpu-ok').means}` }))
  }

  // The host CPU: a budget chip, or too few threads for the cards
  const models = cpuMentions(log)
  const weakModel = models.find(m => /celeron|pentium|atom/i.test(m))
  const cpuLine = lines.findIndex(l => /model name|cpu\(s\)\s*:|celeron|pentium|atom/i.test(l))
  const threads = (() => {
    const l = /^\s*CPU\(s\)\s*:\s*(\d+)/im.exec(log)
    if (l) return Number(l[1])
    const t = /\b(\d{1,3})\s*(?:threads|cpu threads|logical (?:cpus|processors))\b|"cpuThreads"\s*:\s*(\d+)|\bthreads?\s*[:=]\s*(\d+)/i.exec(log)
    if (t) return Number(t[1] ?? t[2] ?? t[3])
    const c = /\b(\d{1,2})[- ]?(?:cores?|core cpu)\b/i.exec(log)
    return c ? Number(c[1]) : undefined
  })()
  if (gpus >= 1 && (weakModel || (threads !== undefined && gpus >= 2 && threads <= 4))) {
    out.push(finding('weak-host-cpu', cpuLine >= 0 ? cpuLine : undefined, cpuLine >= 0 ? lines[cpuLine] : undefined, { means: `${weakModel ? `${weakModel.trim()}` : `${threads} CPU threads`} for ${gpus} card${gpus > 1 ? 's' : ''}${threads !== undefined && weakModel ? ` (${threads} threads)` : ''}. ${rule('weak-host-cpu').means}` }))
  } else if (gpus >= 2 && threads !== undefined && threads / gpus < 12 && threads / gpus >= 1) {
    out.push(finding('weak-host-cpu', cpuLine >= 0 ? cpuLine : undefined, cpuLine >= 0 ? lines[cpuLine] : undefined, { severity: 'check', title: 'Fewer than 12 CPU threads per card', means: `${threads} threads for ${gpus} cards is about ${Math.floor(threads / gpus)} per card; our rule is 12 or more per card (epoch 233, 3 Oct 2026, predates the E235/E236 changes). A 4x RTX 4090 rig at about 9 threads per card ran, but at a worse cost per solution.` }))
  } else if (weakModel && gpus === 0) {
    out.push(finding('weak-host-cpu', cpuLine >= 0 ? cpuLine : undefined, cpuLine >= 0 ? lines[cpuLine] : undefined, { severity: 'check', title: 'A budget CPU', means: `${weakModel.trim()}: for CPU mining skip Celeron, Pentium and Atom; too few cores, and no AVX-512 (our guide).` }))
  }

  // The backend: AVX2 or GENERIC on an AVX-512 CPU, or AVX512 on a CPU without it
  const backend = backendIn(log)
  const avx = models.map(m => classifyCpu(m).avx)
  const zeroLine = lines.findIndex(l => (LOG_LINE.test(l) && ZERO_LOG.test(l)) || ZERO_PROSE.test(l))
  if (backend && (backend === 'AVX2' || backend === 'GENERIC') && avx.includes('avx512') && !/"?cpuVersion"?\s*:\s*"(?:AVX2|GENERIC)"/i.test(log)) {
    const n = lines.findIndex(l => new RegExp(`\\b${backend}\\b`, 'i').test(l))
    out.push(finding('backend-avx2', n, lines[n], { severity: zeroLine >= 0 ? 'fault' : 'check' }))
  }
  if (backend === 'AVX512' && avx.length && avx.every(a => a === 'avx2')) {
    const n = lines.findIndex(l => /AVX-?512/i.test(l))
    out.push(finding('no-avx', n, lines[n], { means: `The backend is AVX512 but ${models[0]!.trim()} has AVX2 only, so the AVX512 worker cannot run on it.` }))
  }

  // Very low CPU it/s on a desktop or server CPU: CfB's "single thread probably"
  const big = models.some(m => {
    const c = classifyCpu(m)
    return (c.avx === 'avx512' || c.avx === 'avx2') && !/laptop|budget|apple/i.test(c.reasons.join(' ')) && !/\b\d{4}[uh]s?\b|\b\d{3}u\b|\bh ?255\b|ryzen ai/i.test(m)
  })
  const lowCpu = [...log.matchAll(READOUT)].some(m => {
    const v = Number(m[1]!.replace(',', '.')) * (m[2] ? 1000 : 1)
    const ctx = log.slice(Math.max(0, m.index! - 40), m.index! + 40)
    return v > 0 && v <= 5 && !/\b(cuda|gpu|rtx|gtx)\b/i.test(ctx.slice(0, 40))
  })
  const manyThreads = threads !== undefined && threads >= 8 && !/single thread|1 thread/i.test(log)
  if ((lowCpu && big && !manyThreads) || /"cpuThreads"\s*:\s*1\b|\bthreads?\s*[:=]\s*1\b/i.test(log)) {
    const n = lines.findIndex(l => READOUT.test(l) || /threads?/i.test(l))
    READOUT.lastIndex = 0
    out.push(finding('cpu-threads', n >= 0 ? n : undefined, n >= 0 ? lines[n] : undefined))
  }

  // No shares or solutions for 2 hours or more, said in the same sentence ("all night", "after 6 or 7 hours still 0/sol")
  const zh = zeroSolsHours(log)
  if (zh >= 2 && !SEES_SHARES.test(log)) {
    const n = lines.findIndex(l => ZERO_SOLS.test(l))
    out.push(finding('zero-shares-long', n >= 0 ? n : undefined, n >= 0 ? lines[n] : undefined))
  }

  // 0 it/s: on a log line, or said plainly ("stuck at 0 it/s", "continuously on 0 hash rate")
  if (zeroLine >= 0) out.push(finding('zero-hashrate', zeroLine, lines[zeroLine]))
  return out
}

/** Run every rule over the log; each rule reports the latest line it matched. Mining is "fine" only if nothing is wrong. */
export function diagnose(log: string): Diagnosis {
  const lines = log.split(/\r?\n/)
  // The epoch seed a miner prints is not a wallet seed; only the rest of the paste can leak one.
  const seedWarning = containsSeed(lines.filter(l => !SEED_LOG_LINE.test(l)).join('\n'))
  if (!log.trim()) return { status: 'empty', findings: [], seedWarning }
  let findings: Finding[] = []
  for (const r of RULES) {
    if (r.test === PARSED) continue
    if (r.when && !test(r.when, log)) continue
    if (r.unless && test(r.unless, log)) continue
    // Scan from the end: the latest occurrence is the one that matters.
    for (let i = lines.length - 1; i >= 0; i--) {
      const text = lines[i]!
      if (r.logOnly && !LOG_LINE.test(text)) continue
      if (r.skipLine?.test(text)) continue
      const m = new RegExp(r.test.source, r.test.flags.replace('g', '')).exec(text)
      if (!m) continue
      const reading = r.read ? r.read(m, log) : undefined
      if (reading === null) continue
      findings.push(finding(r.id, i, text, reading ? { means: reading.means, severity: reading.severity ?? r.severity } : {}))
      break
    }
  }
  for (const f of parsed(log, lines)) if (!findings.some(x => x.id === f.id)) findings.push(f)
  const drop = new Set(findings.flatMap(f => rule(f.id).drops ?? []))
  findings = findings.filter(f => !drop.has(f.id))
  // "Mining" next to a real fault is not reassurance; drop it so the fault leads.
  if (findings.some(f => f.severity === 'fault')) findings = findings.filter(f => f.id !== 'mining')
  // Safety first, then the root cause, then generic symptoms, then context; within a tier the worst first, then rule order.
  findings.sort((a, b) => (a.tier ?? 1) - (b.tier ?? 1) || ORDER[a.severity] - ORDER[b.severity] || RULE_INDEX.get(a.id)! - RULE_INDEX.get(b.id)!)
  if (!findings.length) return { status: 'unknown', findings: [], seedWarning }
  return { status: findings[0]!.severity, findings, seedWarning }
}

/** Symptoms without a log: the triage table from the mining guide. */
export const SYMPTOMS: { id: string; label: string; finding: Omit<Finding, 'line'> }[] = [
  { id: 'no-sol', label: 'No solutions yet', finding: { id: 'no-sol', severity: 'fine', title: 'No solutions yet', means: 'A fresh rig at 0 for 2 to 30 minutes is normal, and even top rigs find solutions in bursts.', fix: ['Wait at least 20 minutes before judging, and until after the "Ant work replaced" line if the log prints it.', 'Still 0 after 20 minutes with a normal it/s readout: check the miner version and the pool status, restart once and wait 10 more minutes. Still 0: close a rental; on your own machine paste the log here.', 'Read the rate after 2 hours, and judge by the wallet total on the pool.'] } },
  { id: 'its-drop', label: 'it/s keeps falling', finding: { id: 'its-drop', severity: 'fine', title: 'it/s falls during the epoch', means: 'Normal: each iteration gets heavier as the work matures. In our runs one rig fell from 508 to 280 it/s in 30 minutes with no change in solutions.', fix: ['Judge by solutions per hour on the pool, not it/s.', 'nvidia-smi: 100% use at normal clocks is fine; clocks dropping at 85 C or more is heat; use under 50% means the CPU or the pool starves the cards.'] } },
  { id: 'slow-host', label: 'Slower than the same card elsewhere', finding: { id: 'slow-host', severity: 'check', title: 'The host may hold the cards back', means: 'Some hosts throttle every card: on host 24255 every server held its RTX 5070 Tis back in our epoch 229 runs. A narrow PCIe link, too few CPU threads or a host power limit do the same.', fix: ['Check the link: nvidia-smi -q | grep -A2 "Link Width". PCIe 4.0 x8 or 3.0 x16 per card.', 'Check the power limit: nvidia-smi -q -d POWER. Hosts cut RTX 5080s to 250 W and 5090s to 400 W.', 'Keep 12+ CPU threads per card. On a rental, move to another host and note this host ID to avoid.'] } },
  { id: 'pool-errors', label: 'Pool errors (502, 1006)', finding: { id: 'pool-errors', severity: 'fine', title: 'Pool-side errors', means: 'HTTP 502, websocket close 1006 and a refused connection to 127.0.0.1:8093 together are a pool outage; "retired-lease progress rejected" is routine. Not your rig.', fix: ['Leave the rig alone and do not restart.', 'Wait 5 to 15 minutes. After 20 to 30 minutes, check the pool status channel.', 'Solutions found during an outage may be lost.'] } },
  { id: 'dies-terminal', label: 'Stops when I close the terminal', finding: { id: 'dies-terminal', severity: 'check', title: 'The miner dies with the terminal', means: 'A miner started in a browser terminal stops when that terminal closes. On 6 Sep 2026 three of our four rigs stopped overnight this way.', fix: ['Start it detached with nohup and a log file, or as a systemd service (see the Linux procedures).', 'On a rental, watch the maximum rental time and extend well before it ends.'] } },
  { id: 'new-algo-zero', label: '0 shares after an algorithm change', finding: { id: 'new-algo-zero', severity: 'fine', title: '0 shares in the first days of a new algorithm', means: 'Both 0 and very high share counts are normal while a new algorithm settles: QLI said at least 3 days (29 Sep 2026). An old miner shows it/s for work that no longer counts.', fix: ['Check the miner prints the current version; if not, download it from the setup page.', 'Run at least 20 minutes, then check the pool status channel.', 'Judge by the wallet total after the epoch, not by the first day.'] } },
  { id: 'old-gpu', label: 'Old GPU stopped working', finding: { id: 'old-gpu', severity: 'check', title: 'The card may be too old for the current miner', means: 'From epoch 237 (28 Oct 2026) a GTX 1050 Ti CUDA worker exited every few seconds, and a Tesla K80 does not run on current CUDA. No fix confirmed and no workaround known by 4 Nov 2026. Treat GTX 10 series and older as unsupported until the pool says otherwise.', fix: ['Mine on the CPU meanwhile (backend AVX2, AVX512 or Auto).', 'Report the card, driver and log to the pool.', 'Ask the pool whether the card is still supported before buying or renting one.'] } },
  { id: 'paid-less', label: 'Paid for fewer shares than shown', finding: { id: 'paid-less', severity: 'check', title: 'The payout counts fewer shares than the dashboard showed', means: 'Pools weight shares by score instead of counting them equally (QLI, 6 Aug 2026), and in epoch 237 scores above 3125 counted for nothing (2 Nov 2026). Lower scores are better.', fix: ['Save your miner log and a dashboard screenshot before each epoch ends.', 'Ask the pool with the epoch, the worker name and that data.'] } },
  { id: 'payout-late', label: 'Payout has not arrived', finding: { id: 'payout-late', severity: 'check', title: 'The payout is not in the wallet yet', means: 'Pools calculate after the epoch and pay about a week later, in Sep to Nov 2026 sometimes up to about 10 days. A paid status can show before the wallet view does.', fix: ['Check the balance of your 60-letter address, not only the transaction list.', 'Check the pending payout and its date on the pool.', 'Still missing after that date: send the pool the epoch, worker name and a screenshot. Never the seed.'] } },
  { id: 'frozen', label: 'Shares frozen', finding: { id: 'frozen', severity: 'fine', title: 'Shares frozen, reseeding, miners locked', means: 'Almost always pool or backend lag around an epoch change.', fix: ['Wait.', 'Restart the miner once if you want to be sure.'] } },
  { id: 'behind', label: 'Dashboard is behind', finding: { id: 'behind', severity: 'fine', title: 'Dashboard shows "behind"', means: 'Display lag. The work is counted.', fix: ['Ignore it, or restart the miner once.'] } },
  { id: 'missing', label: 'Worker not on dashboard', finding: { id: 'missing', severity: 'check', title: 'A worker shows nothing', means: 'Usually two machines share one worker name.', fix: ['Give each machine its own name starting with QC.', 'Check the address on the setup page is yours, all 60 letters.'] } },
  { id: 'rejected', label: 'Many rejected', finding: { id: 'rejected', severity: 'check', title: 'Many rejected or expired candidates', means: 'A few rejects are normal; many are not. The most common cause after an algorithm change is an outdated client.', fix: ['Update the miner from the pool setup page and check the version it prints.', 'Make sure only one miner process runs.', 'Then check the pool status: it can be the pool side.', 'Last, the CPU: 12 or more threads per card, and a reliable host.'] } },
  { id: 'sleeps', label: 'Stops when I walk away', finding: { id: 'sleeps', severity: 'check', title: 'Mining stops when nobody uses the machine', means: 'Almost always sleep or hibernation.', fix: ['Windows: powercfg /change standby-timeout-ac 0 and powercfg /change hibernate-timeout-ac 0.', 'macOS: run it as caffeinate -dimsu ~/qubic-miner/run.sh, on the power adapter.', 'Linux: sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target'] } },
  { id: 'blocked', label: 'Antivirus or macOS blocks it', finding: { id: 'blocked', severity: 'check', title: 'The system blocks the miner', means: 'Windows Defender, SmartScreen or macOS Gatekeeper stopped a file it does not know.', fix: ['Only for the miner from the pool setup page.', 'Windows: exclude only the miner folder in Windows Security, then Restore it from Protection history.', 'macOS: System Settings, Privacy & Security, Open Anyway.'] } },
  { id: 'wont-start', label: "Miner won't start", finding: { id: 'wont-start', severity: 'check', title: 'The miner does not start', means: 'I need the log to tell which of the usual causes it is.', fix: ['Run it once in the foreground and paste the last 30 lines here.', 'Common causes: missing NVIDIA driver, wrong backend for the CPU, file not executable.'] } },
]
