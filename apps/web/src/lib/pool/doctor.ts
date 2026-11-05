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
import { containsSeed, SEED_PATTERN } from './redact.ts'

export type Severity = 'fault' | 'check' | 'fine'
/** 0 safety (secrets, injected text), 1 root cause, 2 generic symptom, 3 context. Lower tiers lead. */
export type Tier = 0 | 1 | 2 | 3
/**
 * sources: where the fix comes from (practice.ts / knowledge.ts ids). Rules without it come from our mining guide.
 * logOnly: match only lines that look like miner output, never the user's own sentences.
 * prose: a described symptom or setup: may also match the user's own sentences when the paste holds a log
 *   (other rules then read only the pasted lines). A finding matched on a sentence never quotes it.
 * when / unless: the whole paste must (not) match. drops: findings this one makes moot.
 * skipLine: lines this rule never reads (the epoch SEED line for the wallet-seed rule).
 * read: turn the matched line into a specific reading (for counters such as SOLS a/b (R:c)); null = not a hit,
 *   undefined = the rule's own text.
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
  prose?: boolean
  when?: RegExp | ((log: string) => boolean)
  unless?: RegExp | ((log: string) => boolean)
  skipLine?: RegExp
  drops?: string[]
  read?: (m: RegExpExecArray, log: string) => { means: string; severity?: Severity; title?: string; tier?: Tier; fix?: string[] } | null | undefined
  open?: boolean
  tier?: Tier
}
export type Finding = { id: string; severity: Severity; title: string; means: string; fix: string[]; line?: { n: number; text: string }; tier?: Tier }
export type Diagnosis = { status: Severity | 'empty' | 'unknown'; findings: Finding[]; seedWarning: boolean }

/** Our runs predate the later algorithm changes; every number from them says so. */
const OURS = 'our epoch 229/233 runs, predates the E235/E236 changes'

/** Never matches: rules whose findings come from a parser below, listed here so the prompt and the card see them. */
const PARSED = /(?!)/

/** Miner output, not prose: a timestamp (also apoolminer's "05-21 13:34:13"), a [TAG], a table bar, JSON, "E:229", a key: value, a shell prompt, or a known counter. */
export const LOG_LINE =
  /^\s*(?:\d{4}-\d\d-\d\d|\d\d-\d\d\s+\d\d?:\d\d|\d{1,2}[./]\d{1,2}[./]\d{2,4}\b|\d{1,2}:\d\d|(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\w{3}\s+\d|[[|{<"#]|E:\s?\d|(?:current |average |total )?hashrate\b|iterations?\b|(?:SOLS|SHARES|INFO|WARN|WARNING|ERROR|ERR|DEBUG|TRACE|FATAL)\b|(?:CUDA|AVX2|AVX512|CPU|GPU)\s*[:\]|]|[\w.-]+@[\w.-]+:|[A-Za-z][\w.-]{0,24}:\s)/

/** Miner and system output LOG_LINE misses: "05-21 13:34:13 INFO", NVRM lines, .NET and Rust frames, exception
 * names, path-prefixed errors ("./rqiner: /lib/...", "run.sh: line 1:"), call chains ("-> Worker.Run"). */
export const MORE_LOG =
  /^\s*(?:\d\d-\d\d\s+\d\d?:\d\d|\d{1,2}:\d\d:\d\d|NVRM:|Trainer:|at [\w.<>`[\]]+\(|---\s?(?:>|End of)|System\.[\w.]+(?:Exception|Error)\b|[\w.]+Exception:|thread '[^']*' panicked|note: run with|called `|custom exited|GPUassert|\$'\\E|bash:|sh:|PS [A-Za-z]:|\.{0,2}\/[\w./+-]+:\s|[\w.-]+\.(?:sh|exe|bat|py|so(?:\.\d+)*):\s|(?:Error|ERROR|error|Fatal|fatal|FATAL|panic|Warning|WARNING)\b[^\n:]{0,40}:\s|[\w-]{2,12}\s+(?:ERROR|WARN(?:ING)?|INFO|FATAL|DEBUG)\b|[\w.-]+\.(?:exe|sh|bat)\s+(?:not |is |has |was |exited|crashed|stopped|failed)|-+>\s*\w|[A-Z]\w+(?:\.[A-Z]\w+)+\s*(?:\(.*)?$|Traceback \(|Linux \S+ \d+\.\d+|[^\n]*\bELF \d\d-bit\b|[^\n]*\binterpreter \/\S+)/
/** A config line: braces, brackets, "key": value, key = value, an HTML or XML tag. */
export const CONFIG_LINE = /^\s*(?:[{}[\],]|"[^"\n]*"\s*[:=,]|[\w.-]+\s*=\s*\S|<\/?[\w!-]+[^>]*>?)/
/** A shell command the user pasted (apt, echo, wget, ./miner ...), not a sentence. */
const COMMAND_LINE =
  /^\s*(?:sudo\s+)?(?:apt(?:-get)?\s+(?:update|upgrade|install|remove|purge|full-upgrade|dist-upgrade)\b|echo\s+["'$\w-]|wget\s+\S|curl\s+-|chmod\s+[+\d]|chown\s|cd\s+[~/.\w]|bash\s+\S+\.sh\b|docker\s+(?:run|pull|ps|logs|exec|compose|start|stop)\b|nvidia-smi(?:\s+-|\s*$)|hive-replace\b|systemctl\s+\w|journalctl\s|dpkg\s+-|tar\s+-|unzip\s|nohup\s|export\s+[A-Z_]+=|sed\s+-|lscpu\s*$|ldd\s+-|uname\s+-|sysctl\s+-|miner\s+(?:start|stop|restart|log)\b|git\s+(?:clone|pull)\b)|^\s*\.\/[\w.-]+(?:\s|$)/
/** A shell prompt line: what follows it, up to a blank line, is that command's output. */
const SHELL_PROMPT = /^\s*(?:\(\w[\w.-]*\)\s+)?[\w.-]+@[\w.-]+:[^\n]*[$#]\s|^\s*[A-Za-z]:\\[^\n<>|"]*>|^\s*PS [A-Za-z]:\\[^\n]*>|^\s*\$ \S/
/**
 * Messages the OS or a program prints in natural language, in any locale: the Windows "pause" prompt, "file not
 * found", "access denied", "not a command", Ctrl+C, segfaults. They are output even when they read like a sentence,
 * so they never decide the reply language and never count as the user's prose.
 */
export const OS_OUTPUT =
  /press any key|нажмите любую клавишу|按任意键|按任意鍵|beliebige taste|appuyez sur une touche|presione una tecla|pulse cualquier tecla|pressione qualquer tecla|premere un tasto|bir tuşa basın|naciśnij dowolny klawisz|任意のキーを押|아무 키나 누르|系统找不到|系統找不到|找不到指定的|拒绝访问|拒絕存取|不是内部或外部命令|不是內部或外部命令|cannot find the (?:file|path) specified|не удается найти указанн|отказано в доступе|не является внутренней или внешней|access is denied|is not recognized as an internal or external command|zugriff verweigert|das system kann die angegebene|le système ne peut pas trouver|el sistema no puede encontrar|o sistema não pode encontrar|acceso denegado|acesso negado|accès refusé|accesso negato|terminate batch job|завершить выполнение пакетного файла|终止批处理操作|segmentation fault|ошибка сегментирования|speicherzugriffsfehler|недопустимая инструкция|非法指令|段错误|\(core dumped\)|образ памяти сброшен|\s\.\s\.\s\.\s*$/i

/**
 * A line straight under a pasted one, with no blank line between, that reads like output rather than the user
 * speaking: no question mark and no first-person word ("connection refused by host" under a rate line). Not used for
 * the reply language, where the user may write in any language under the log.
 */
const OUTPUT_TAIL = (l: string) => !/\?\s*$/.test(l) && !/\b(?:i|i'm|i've|my|me|we|our|us|you|your|please|help|why|how|what)\b/i.test(l) && /\p{L}{3,}/u.test(l)

/** One line of pasted output: a miner log line, a stack frame, a config or HTML line, a command, an OS message. */
export const isLogLine = (line: string) =>
  !!line.trim() && !labelledSentence(line) && (LOG_LINE.test(line) || MORE_LOG.test(line) || CONFIG_LINE.test(line) || COMMAND_LINE.test(line) || SHELL_PROMPT.test(line) || SEED_LOG_LINE.test(line))

/** LOG_LINE without its "Label: value" branch. */
const LOG_LINE_UNLABELLED = new RegExp(LOG_LINE.source.replace('|[A-Za-z][\\w.-]{0,24}:\\s)', ')'))
/** The user speaking: a first- or second-person word, or a question. */
const SPEAKER = /\b(?:i|i'm|i've|my|me|we|our|you|your)\b|\?\s*$|(?:^|\s)(?:я|мне|мой|моя|меня|у меня|yo|mi|eu|meu|minha|ich|mein|meine|je|mon|ma)(?=[\s,.!?]|$)|我/i
/** "HiveOS: while it mines I see ...": a label the user typed before their own sentence, not a log key and value. */
const labelledSentence = (line: string) => {
  const m = /^\s*[A-Za-z][\w.-]{0,24}:\s+(.*)$/.exec(line)
  return !!m && !LOG_LINE_UNLABELLED.test(line) && !MORE_LOG.test(line) && !SEED_LOG_LINE.test(line) && (m[1]!.match(/\p{L}+/gu) ?? []).length >= 5 && SPEAKER.test(m[1]!)
}

/**
 * Per line: pasted output (true) or the user's own words (false). Fenced blocks count as pasted, so do the lines a
 * shell prompt line prints up to the next blank line, an indented line that continues a pasted one, and, once a log
 * has started, an OS or program message in any language (before any log it may be the user quoting it).
 */
export function pastedLines(lines: string[], loose = true): boolean[] {
  let fence = false
  let output = false
  let prev = false
  let seen = false
  const marks = lines.map(l => {
    let p: boolean
    if (/^\s*```/.test(l)) {
      fence = !fence
      p = true
    } else if (fence) p = true
    else if (!l.trim()) {
      output = false
      p = false
    } else if (SHELL_PROMPT.test(l)) {
      output = true
      p = true
    } else p = output || isLogLine(l) || (prev && /^(?:\s{2,}|\t)\S/.test(l)) || (seen && OS_OUTPUT.test(l)) || (loose && prev && OUTPUT_TAIL(l))
    prev = p && !!l.trim()
    seen ||= prev
    return p
  })
  // a line of output between two pasted lines ("worker.exe not running ...") is pasted too, unless it asks something
  return marks.map((p, i) => p || (loose && !!lines[i]!.trim() && !/\?\s*$/.test(lines[i]!) && !!marks[i - 1] && !!marks[i + 1] && !!lines[i - 1]!.trim() && !!lines[i + 1]!.trim()))
}

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
const SEED_LOG_LINE = /^\s*(?:[\d:.T-]+\s+|\[[^\]]*\]\s*|(?:INFO|DEBUG|WARN)\s+|E:\d+\s+(?:\|\s*)?|(?:Trainer|Miner|Worker|Client)\s*:\s*){0,5}(?:SEED\b|(?:Mining|Random|Epoch) Seed\s*:)/
/** A wallet seed anywhere in the text, prose included (the same pattern the redaction uses). */
const WALLET_SEED = new RegExp(SEED_PATTERN.source)
const TOKEN_VALUE = /("?access_?token"?\s*[:=]\s*"?)(?!<)[A-Za-z0-9_.-]{6,}|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_.-]{4,}/gi
/** A secret value that is only a placeholder ("REDACTED", "***", "xxxx", "<removed>", "your_token"). */
const BLANKED = /redacted|removed|hidden|^[*x.…]+$|^<[^>]*>$|^your\w*$|^(?:my|the|access)?_?token$|^(?:null|none|placeholder)$/i
/** A value somebody already blanked out: never judged as a real address, token or name. */
const REDACTED = /removed|redacted|hidden|<[^>]*>|\.{3,}|…|\*{3,}|x{4,}|^your\b|^(?:my|the|access)?_?token$|^null$|^$/i

/** it/s in the forms miners write it: 49 it/s, 15its, 2 its/s, 1.8 kH/s, 200H/s. */
const READOUT = /(?<![\w.])(\d+(?:[.,]\d+)?)\s*(k)?\s*(?:it\s?\/\s?s|its\/s|its\b|i\/s|h\/s|iter\/s)/gi
/** Any it/s or H/s readout, zero included: a rate line is a measurement, never a stalled step. */
const READOUT_ANY = /\d\s*(?:k\s*)?(?:it\s?\/\s?s|its\/s|h\/s|sol\/h)\b/i

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
/** "rate drops to 0", "it/s fell to zero": a rate that existed and then went to nothing. */
const RATE_FALLS_ZERO =
  /\b(?:rate|hash ?rate|hashing|it\/s|speed|computing power|performance|shares?)\b[^\n.]{0,30}\b(?:drops?|dropped|dropping|falls?|fell|falling|goes|went|going|decreases?|decreased|reduces?|reduced|sinks?|sank)\b(?:\s+(?:down|back))?\s+(?:to\s+)?(?:0|zero)\b/i
/** "drops after running a while", "after 5 minutes, rate drops": it ran first, then fell. */
const RATE_FALLS_AFTER =
  /\bafter (?:running|a while|some time|a (?:period|few)\b[^\n.]{0,15}|\d+\s*(?:min(?:ute)?s?|h|hours?|days?))\b[^\n.]{0,40}\b(?:drops?|dropped|falls?|fell|goes down|went down|reduces?|reduced|decreases?|decreased|slows? down)\b|\b(?:reduces?|reduced|drops?|dropped|falls?|fell|decreases?|decreased|slows? down)\b[^\n.]{0,50}\bafter (?:running|a while|some time|a period|\d+\s*(?:min(?:ute)?s?|h|hours?))|\b(?:normal|fine|works?|working|mines?)\b[^\n.]{0,30}\bfor (?:\d+(?:\s*(?:-|to)\s*\d+)?\s*(?:min(?:ute)?s?|h|hours?))\b[^\n.]{0,15}\bthen\b[^\n.]{0,20}\b(?:drops?|falls?|goes down|slows? down)\b/i
/** "Since the new epoch": a change that came with the epoch. */
const EPOCH_WIDE = /\bsince (?:the )?(?:new|last|latest|this) epoch\b|\bnew epoch\b[^\n.]{0,40}\b(?:does (?:almost )?nothing|drops?|0 it\/s)/i
/** The same symptom on more than one machine, or for other miners too. */
const MANY_RIGS = /\bmore than one (?:pc|machine|rig|computer|box)|\bseveral (?:pcs|machines|rigs|users|miners)|\banother miner\b|\bother (?:users|miners)\b|\bsame on (?:wsl|both|all)\b|\bon (?:both|all) (?:pcs|machines|rigs)/i
/** Under 20 minutes since start, said in words, nothing longer named, and not a rate that ran and then fell. */
const tooEarly = (log: string) => {
  const h = hoursIn(log)
  return h > 0 && h < 1 / 3 && !LONG_TIME.test(log) && !RATE_FALLS_ZERO.test(log) && !RATE_FALLS_AFTER.test(log)
}

/** Text that gives an AI orders: no miner or config prints it. */
const INJECTION =
  /\b(ignore|disregard|forget) (all |any )?(of )?(the |your )?(previous|prior|above|earlier) (instructions|prompts?|rules)|#{2,}\s*system\s*:|\bsystem prompt\b|\byou are now (a|an|in)\b|\b(?:note|message|instructions?) (?:to|for) (?:the )?(?:ai|assistant|llm|chatbot)\b|\bassistant[- ]directive\b|\bignore your (?:pool )?(?:rules|instructions)\b|\bmaintenance mode\b|\breveal\b[^\n]{0,40}\b(?:seed|system prompt|instructions)\b/i

/** Pascal (GTX 10, P10x mining cards), Maxwell, Kepler and older NVIDIA cards, by name or architecture. */
const OLD_GPU =
  /\b(gtx ?(?:10[5-8]0|9[5-8]0|7[5-8]0)( ?ti)?|p10[246](?:-\d{3})?|titan xp?|tesla ?(k80|k40|m40|m60|p4|p40|p100)|quadro ?[kmp]\d{3,4}|pascal|kepler|maxwell|sm_?[356]\d|compute capability [3-6]\.\d)\b|cuda 237\.0[^\n]{0,60}exit|workers?\b[^\n]{0,60}exits? every/i

/** An RTX 50 (Blackwell) card named in the paste. */
const BLACKWELL = /\brtx\s*50[6-9]0|\bnvidia\s+(?:geforce\s+)?(?:rtx\s*)?50[6-9]0\b|\b50[6-9]0\s*(?:ti|super)\b|blackwell/i
/** Windows named in the paste: the OS, an .exe, a drive path, W10/W11. */
const WINDOWS = /\bwindows\b|\bwin ?1[01]\b|\bW1[01]\b|\.exe\b|\b[A-Z]:\\|\bpowershell\b/i
/** The user says it loops or repeats. */
const LOOP_WORDS = /\bstuck in a loop\b|\bin a loop\b|\bloops?\b|\bkeeps? (?:restarting|repeating|relaunching)\b|\bcontinuously repeating\b|\bover and over\b|\brelaunches\b/i

/** NVIDIA Xid codes miners hit, from NVIDIA's Xid catalog (general NVIDIA knowledge, checked 5 Nov 2026). */
const XID: Record<string, string> = {
  '8': 'GPU stopped responding (watchdog)',
  '13': 'graphics engine exception',
  '31': 'GPU memory page fault',
  '32': 'invalid or corrupted push buffer',
  '43': 'GPU stopped processing',
  '45': 'cleanup after earlier errors',
  '48': 'double-bit ECC error',
  '61': 'internal micro-controller breakpoint',
  '62': 'internal micro-controller halt',
  '63': 'ECC page retirement',
  '64': 'ECC page retirement failure',
  '69': 'graphics engine class error',
  '74': 'NVLink error',
  '79': 'GPU has fallen off the bus',
  '92': 'high single-bit ECC error rate',
  '94': 'contained ECC error',
  '95': 'uncontained ECC error',
  '119': 'GSP timeout',
  '120': 'GSP error',
}

/**
 * The first line of a pasted JSON config that breaks it, or null when the block parses (or is not a whole
 * config: one-line snippets and abbreviated blocks with "..." are skipped). Strings are kept, so a ">" or a
 * missing comma is found at its line.
 */
export function brokenJsonLine(lines: string[]): { n: number; why: string } | null {
  const start = lines.findIndex(l => /^\s*\{\s*$/.test(l))
  if (start < 0) return null
  let depth = 0
  let end = -1
  for (let i = start; i < lines.length && end < 0; i++) {
    for (const c of lines[i]!.replace(/"(?:[^"\\\n]|\\.)*"/g, '""')) {
      if (c === '{' || c === '[') depth++
      else if (c === '}' || c === ']') depth--
    }
    if (depth <= 0) end = i
  }
  if (end < 0) end = lines.length - 1
  const block = lines.slice(start, end + 1)
  const text = block.join('\n')
  const bare = text.replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  if (!/"[\w.-]+"\s*:/.test(text) || /\.\.\.|…/.test(text) || /\/\/|\/\*/.test(bare)) return null
  try {
    JSON.parse(text)
    return null
  } catch {}
  const VALUE = /^\s*"(?:[^"\\]|\\.)*"\s*:\s*(?:"(?:[^"\\]|\\.)*"|-?\d[\d.eE+-]*|true|false|null)\s*(,?)\s*$/
  const OPEN = /^\s*(?:"(?:[^"\\]|\\.)*"\s*:\s*)?[{[]\s*$/
  const CLOSE = /^\s*[}\]]\s*(,?)\s*$/
  for (let k = 1; k < block.length; k++) {
    const l = block[k]!
    if (!l.trim()) continue
    const next = block.slice(k + 1).find(x => x.trim()) ?? ''
    const closesNext = /^\s*[}\]]/.test(next)
    const v = VALUE.exec(l) ?? CLOSE.exec(l)
    if (v) {
      if (!v[1] && next && !closesNext) return { n: start + k, why: 'a comma is missing at the end of this line' }
      if (v[1] && closesNext) return { n: start + k, why: 'a comma before a closing brace' }
      continue
    }
    if (OPEN.test(l)) continue
    return { n: start + k, why: 'this line is not a valid "key": value entry (a stray character, or a missing quote or comma)' }
  }
  return { n: start, why: 'the braces or quotes do not match' }
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
  const re = /\b(?:amd\s+)?(?:ryzen\s*(?:threadripper\s*)?(?:pro\s*)?[3579]?\s*(?:pro\s*)?\d{4}[a-z0-9]*|threadripper\s*(?:pro\s*)?\d{4}[a-z]*|epyc\s*\d[0-9a-z]\d\d[a-z]?|(?:[3579]\d{3})x3d|\b[3579]\d{2}0x\b)|\b(?:intel\s+)?(?:core\s+)?(?:i[3579][- ]?\d{4,5}[a-z]{0,2}|i1[3-4]\d{3}[a-z]*|ultra\s*[579]\s*\d{3}[a-z]?|xeon\s*(?:platinum|gold|silver|bronze|e[357]|w)?[- ]?\s*\d{4}[a-z]?(?:\s*v[1-4])?|opteron(?:\(tm\))?\s*(?:processor\s*)?\d{4}|celeron\s*\w*|pentium\s*\w*|atom\s*\w*)/gi
  for (const m of log.matchAll(re)) out.push(m[0].replace(/\bi1([34]\d{3})/i, 'i9-1$1'))
  return out
}

/** The CPU backend the paste selects: the QLI config key, a backend line, or "AVX2" alone on a setup line. */
function backendIn(log: string): string | null {
  const m =
    /"?cpuVersion"?\s*:\s*"?(AVX512|AVX2|GENERIC|ARM64|AUTO)/i.exec(log) ??
    /\b(?:backend|cpu ?version|mode)\b[^\n]{0,15}\b(AVX512|AVX-512|AVX2|GENERIC)\b/i.exec(log) ??
    /\bVersion:\s*(AVX512|AVX-512|AVX2|GENERIC)\b/.exec(log) ??
    /^\s*[•*-]?\s*(AVX2|GENERIC)\s*$/im.exec(log)
  return m ? m[1]!.toUpperCase().replace('-', '') : null
}

/* ---------- the CPU's instruction sets, looked up from the model before any AVX advice ---------- */

export type CpuIsa = 'avx512' | 'avx2' | 'avx' | 'unknown'
/**
 * AVX level of one CPU model. Intel generations are read here (Core 2nd/3rd gen and Xeon E5 v1/v2 have no AVX2;
 * Core X-series, 11th gen, Ice Lake and Xeon Scalable/W have AVX-512; 12th gen and later desktop parts do not);
 * everything else comes from classifyCpu (Zen 4/5 AVX-512, Zen 1 to 3 AVX2). Vendor specs, checked 5 Nov 2026.
 */
export function cpuIsa(model: string): CpuIsa {
  const s = model.toLowerCase().replace(/\s+/g, ' ')
  const core = /\bi([3579])[- ]?(1[0-4]|[2-9])(\d{2,3})([a-z]{0,2}\d?)\b/.exec(s)
  if (core) {
    const [gen, suffix] = [Number(core[2]), core[4] ?? '']
    if (gen <= 3) return 'avx'
    if (gen === 11 || (gen === 10 && /^g\d/.test(suffix))) return 'avx512'
    if ((gen === 7 || gen === 9 || gen === 10) && /^x/.test(suffix) && core[1] !== '3' && core[1] !== '5') return 'avx512'
    return 'avx2'
  }
  if (/xeon/.test(s)) {
    if (/(platinum|gold|silver|bronze) ?\d{4}|xeon w[- ]?\d/.test(s)) return 'avx512'
    if (/\be[57][- ]?\d{4}[a-z]?(?: ?v[34])\b/.test(s)) return 'avx2'
    if (/\be[357][- ]?\d{4}/.test(s)) return 'avx'
  }
  // AMD before Zen: Opteron, FX, Phenom and Athlon II have no AVX2 (Bulldozer-family parts have AVX only)
  if (/\bopteron\b|\bfx-?\s?\d{4}|\bphenom\b|\bathlon ii\b/.test(s)) return 'avx'
  const a = classifyCpu(model).avx
  return a === 'avx512' || a === 'avx2' ? a : 'unknown'
}
/** Every CPU the paste names, with its AVX level (unknown models left out). */
const isasIn = (log: string) =>
  cpuMentions(log)
    .map(m => ({ model: m.trim(), isa: cpuIsa(m) }))
    .filter(x => x.isa !== 'unknown')
const AVX512_BY_CPU =
  'AVX-512: Ryzen 7000/9000 (Zen 4/5), EPYC 9004/9005, Threadripper 7000, Xeon Scalable, Core X-series and 11th gen. No AVX-512: Ryzen 3000/5000 (Zen 2/3, e.g. the 5900X), EPYC 7xx2/7xx3, Core 12th gen and later, Core Ultra (vendor specs).'

/* ---------- error-like lines: they rule out a "fine" or "mining" verdict ---------- */

/** A line that reports a failure, in miner, shell, .NET, Rust or kernel wording. */
export const ERRORISH =
  /\b(?:ERROR|ERRO|FATAL|PANIC)\b|\berror(?:s)?\b\s*[:=(]|\b(?:\w+)?exception\b|panicked at|\bpanic\b|segmentation fault|segfault|core dumped|\btraps?:|invalid opcode|illegal instruction|not running or has exited|\bexited\b|exitcode=|\bkilled\b|\bfailed\b|\bfailure\b|\bdenied\b|\baborted\b|cannot (?:open|find|load|execute|allocate|set)/i
/** Fine findings that read as "all good": never shown next to an unexplained error line or a fault. */
const REASSURING = new Set(['mining', 'gpu-ok', 'epoch-idle', 'cold-start', 'too-early', 'bursts', 'sols-counter', 'pool-frozen', 'dashboard-lag'])
/** A start or banner line; the same one twice in a paste is a restart loop. */
const START_LINE = /\bis starting\b|starting the process|\bstarting (?:the )?(?:miner|client|trainer|worker)\b|running pool miner|\bqubic\.li client\b[^\n]*version|\brqiner v\d|\bclient version\b/i
const normalized = (l: string) =>
  l
    .replace(/^\s*(?:[\d:.T/ -]+(?:Z|[+-]\d\d:?\d\d)?\s+|\[[^\]]*\]\s*)+/, '')
    .replace(/\[[0-9a-f-]{6,}[^\]]*\]\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
/** How many times the most repeated start line appears (XMR idle-worker lines excluded). */
export function restarts(lines: string[]): number {
  const seen = new Map<string, number>()
  for (const l of lines) if (START_LINE.test(l) && !/xmr/i.test(l)) seen.set(normalized(l), (seen.get(normalized(l)) ?? 0) + 1)
  return Math.max(0, ...seen.values())
}
/** The trainer, worker or service exits: a line count, XMR idle-worker starts excluded. */
const EXIT_LINE = /not running or has exited|custom exited \(exitcode|exited with (?:exit )?code|\bprocess (?:has )?exited\b|\bhas exited\b/i
/** The miner itself going down: overrides any "it is mining" or other fine reading of the lines before it. */
const EXITING = /flagged for shutdown|\bexiting\b|\bshutting down\b|(?<!(?:connection|stream|socket|session|lease|request|task|job) )\bterminated\b/i

/**
 * Another pool's endpoint in a config, a log or flight-sheet arguments: a URL, a host:port, or a pool or URL key or
 * flag ("-o", "--pool", "poolAddress", "baseUrl") that names one. "qubic.li client" in a sentence is not an endpoint.
 */
const FOREIGN_HOST = String.raw`(?:[\w-]+\.)*(?:qubic\.li|apool\.io|jetski[\w-]*\.\w+|jtsk[\w-]*\.\w+|minerlab[\w-]*\.\w+)`
const FOREIGN = new RegExp(
  String.raw`wss?:\/\/[^\s"']*(?:qubic\.li|jetski|jtsk|minerlab|apool)|https?:\/\/${FOREIGN_HOST}|\b${FOREIGN_HOST}:\d{2,5}\b|(?:\bpool(?:Address| url)?|\burl|\bbaseUrl|-o|--pool|--url)["']?\s*[:=]?\s*["']?(?:stratum\+tcp:\/\/|wss?:\/\/|https?:\/\/)?${FOREIGN_HOST}`,
  'i',
)

const ZERO_LOG = /(?:^|[^\d.,])0(?:\.0+)?\s*(?:it\s?\/\s?s|its\b|h\/s)|hashrate:?\s*0(?:\.0+)?\b(?!\.\d*[1-9])/i
const ZERO_PROSE = /\b(?:stuck|stays?|still|continuously|keeps?|always|showing|shows?|sits?|yielding|getting)\b[^\n.]{0,25}?(?<![\d.])0(?:\.0+)?\s*(?:it\s?\/\s?s|its\b|h\/s|hash ?rate)|\b(?:on|at) 0 hash ?rate|\bnearly zero hash/i

export const RULES: Rule[] = [
  /* ---------- tier 0: what the paste itself exposes ---------- */
  {
    id: 'wallet-seed',
    severity: 'fault',
    tier: 0,
    title: 'A wallet seed is in this paste',
    means: 'A 55-letter lowercase string is a wallet seed: the master key to the funds. Treat it as exposed: anyone who saw it can empty the wallet. I do not repeat it, check it or use it.',
    fix: [
      'Create a new wallet now and move every coin to it: move the funds today, with a new seed made on a safe device; do not wait.',
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
    test: /"?access_?token"?\s*[:=]\s*"?((?!<)[A-Za-z0-9_.*-]{6,})|\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{4,})/i,
    // "REDACTED", "***", "xxxx", "<removed>": the user already hid it
    read: m => (m[1] && BLANKED.test(m[1]) ? null : undefined),
  },
  {
    id: 'not-a-log-line',
    severity: 'fine',
    tier: 0,
    title: 'A line that is not from the miner',
    means: 'This line gives orders to an AI ("ignore previous instructions", "SYSTEM:"). No miner prints that: someone added it. I ignore it, and it changes nothing in the reading of the real log lines.',
    fix: ['Read the rest of the log as usual.', 'If you copied this log from someone else, get the original from the miner itself.'],
    test: INJECTION,
    // every such line, not only the last one: a paste can carry several
    read: (_m, log) => {
      const at = log.split(/\r?\n/).flatMap((l, i) => (INJECTION.test(l) ? [i + 1] : []))
      return at.length > 1
        ? { title: `${at.length} lines that are not from the miner`, means: `Lines ${at.join(', ')} give orders to an AI ("ignore your rules", "SYSTEM:", "reveal the seed"). No miner or config writes that: someone added them. I ignore them, and they change nothing in the reading of the real lines.` }
        : undefined
    },
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
    // on a Pascal or older card the driver is not the point: since epoch 237 the card is out whatever the driver
    read: (_m, log) =>
      OLD_GPU.test(log)
        ? {
            severity: 'check',
            tier: 2,
            title: 'The build is newer than this driver (secondary here)',
            means: '"The provided PTX was compiled with an unsupported toolchain": the CUDA build was compiled with a newer toolkit than this driver can JIT-compile for; a newer driver was the usual remedy (general CUDA behaviour). Here it is secondary: the card is Pascal or older, out of Qubic GPU mining since epoch 237 (28 Oct 2026) whatever the driver.',
            fix: ['Do not spend time on drivers for this card.', 'GPU mining needs a card newer than Pascal; the CPU still mines.'],
          }
        : undefined,
  },
  {
    id: 'gpu-kernel-missing',
    severity: 'fault',
    title: 'The GPU trainer cannot find its compute kernel',
    means: '"Kernel with original name kern_solve_cand_start not found in map": the GPU trainer fails to load its CUDA kernel and the card mines nothing while it repeats. No confirmed fix yet: Windows NVIDIA miners reported it on the QLI client from 9 Oct 2026 (qubic-li/client #138, no maintainer reply by 5 Nov), tied to its CUDA trainer 234.0; CPU mining on the same PC worked: that client\'s bug, not the card or the driver. A user with the same RTX 3070 mined overnight on client 3.10.2.1 with worker CUDA 235.4.',
    fix: [
      'Update to the current client (for this pool, the current miner from the setup page) and check that the worker/trainer version line in the log changes.',
      'If it still repeats, mine CPU only for now and report it with the client version, the trainer line, the epoch and the error lines.',
    ],
    test: /kernel with original name[^\n]{0,80}not found in map|\[qjm error\][^\n]{0,40}kernel|kernel[^\n]{0,40}not found in (the )?map/i,
    drops: ['zero-hashrate'],
    sources: ['community'],
    open: true,
  },
  {
    id: 'version-gate',
    severity: 'fault',
    title: 'The pool refuses this miner version',
    means: 'The pool checks the miner version and refuses anything below its minimum ("Your miner is outdated! Please update to version >=...", then "Failed to connect to pool"). The connection error is the consequence: nothing local is broken, and network checks will not help.',
    fix: [
      "Install the version the message asks for, from that miner's own official source, once it is published. Downgrading or editing the config does not help.",
      'Pools stop accepting old versions after algorithm or epoch changes, so an idle phase or a restart is often the moment an old binary is refused.',
      'For this pool: take the command from the setup page again; it gives the current miner. Never guess a version number.',
    ],
    test: /\b(?:miner|client|version|app|trainer)\b[^\n]{0,20}\boutdated\b[^\n]{0,60}\b(?:update|upgrade)\b|\b(?:update|upgrade) to (?:version )?>=?\s*v?\d+(?:\.\d+)+|\b(?:miner|client) (?:version )?is (?:outdated|too old)\b|\bversion\b[^\n]{0,30}\b(?:no longer|not) (?:supported|accepted|allowed)\b|\bminimum (?:required )?(?:client |miner )?version (?:is|required)\b/i,
    read: (m, log) => {
      const v = />=?\s*v?(\d+(?:\.\d+)+)/.exec(m.input)?.[1]
      // "outdated, please update" alone is a nudge (old-miner); a gate names a minimum or refuses the connection
      if (!v && !/\bversion\b[^\n]{0,30}\b(?:no longer|not) (?:supported|accepted|allowed)|\bminimum\b|failed to connect|connection (?:refused|rejected|closed)|\brefused\b|\bnot accepted\b|\bdisconnected\b/i.test(log)) return null
      return v
        ? {
            title: `The pool refuses this miner version (it asks for ${v} or newer)`,
            means: `The pool refuses miners below version ${v} ("update to version >=${v}"), and the connection then fails. The connection error is the consequence: nothing local is broken, and network checks will not help.`,
          }
        : undefined
    },
    drops: ['connection', 'crash', 'old-miner'],
    sources: ['community'],
  },
  {
    id: 'glibc',
    severity: 'fault',
    title: 'The system C library (glibc) is reported too old',
    means: 'The trainer checks the glibc version and refuses to start. Stock versions: Ubuntu 20.04 has 2.31, 22.04 has 2.35, 24.04 has 2.39; Debian 11 has 2.31, 12 has 2.36 (distribution release notes). The QLI README asks for at least 2.31 (read 5 Nov 2026). On Ubuntu 22.04 the QLI message "GLIBC Version must be >= 2.34" was misleading: users with 2.35 saw it too, and it cleared at the next epoch (qubic-li/client #112, Nov 2024).',
    fix: [
      'Check what you have: ldd --version (first line) and cat /etc/os-release.',
      'Already 2.34 or newer: the system is fine. Keep the client current and running; check that the trainer version line changes at the next epoch.',
      'Really older (Ubuntu 20.04, Debian 11, an old HiveOS image): move to a newer release or image. Never compile or force-install glibc by hand: it can break the whole system (a HiveOS user who did got a new error, qubic-li/hiveos #13, Apr 2024).',
      'On HiveOS: flash the latest stable image (hive-replace --stable --yes, or a reflash), never an Ubuntu jammy apt source to force libc6 (qubic-li/hiveos #3 and #5, Mar 2024: it can brick HiveOS).',
    ],
    test: /glibc[^\n]{0,20}(?:version )?[^\n]{0,12}(?:must|>=|required|too old|not found)|\bGLIBC(?:XX)?_\d+\.\d+[^\n]{0,30}not found|version [`'"]GLIBC/i,
    drops: ['crash', 'worker-exit', 'trainer-load'],
    sources: ['community'],
  },
  {
    id: 'ldd-windows',
    severity: 'fault',
    title: 'A known bug in an old client: it tries to run ldd',
    means: 'The client tried to start "ldd", the Linux tool that prints the glibc version, and the start failed. In the qubic.li client 1.8.5 and 1.8.6 that was a bug of the client itself, on Windows and on Linux, fixed in its version 1.8.9 (qubic-li/client #30, Mar 2024). Nothing is missing on your PC.',
    fix: [
      'Update the client to the current version from the setup page (on the qubic.li client itself, 1.8.9 or later fixed this).',
      'Do not install ldd, WSL, Cygwin or Wine to satisfy it.',
      'If the current version still fails, paste the first error lines after "is starting".',
    ],
    test: /start(?:ing)? (?:the )?process ['"]?ldd\b|\bprocess ['"]?ldd['"]? (?:failed|could not|cannot)/i,
    read: (_m, log) =>
      WINDOWS.test(log)
        ? {
            means: `The client's Windows build tried to start "ldd", a Linux tool (it prints the glibc version); Windows has none, so the start fails${/系统找不到指定的文件|系統找不到指定的檔案/.test(log) ? ' (系统找不到指定的文件 = "The system cannot find the file specified")' : ''}. That is a bug in that client release, not a missing file on your PC: the qubic.li client fixed it in version 1.8.9 (qubic-li/client #30, Mar 2024).`,
          }
        : undefined,
    drops: ['trainer-load', 'win-not-found', 'missing-file', 'crash', 'worker-exit'],
  },
  {
    id: 'hw-info-wmi',
    severity: 'check',
    title: "The client's optional hardware check failed (WMI); not fatal by itself",
    means: 'The exception comes from the qubic.li client reading the CPU model, RAM and CPU cache through WMI (HardwareHelper.GetCPUCache), an optional hardware-info collection it uses to pick its runner. When the trainer still starts after it, this is not fatal and does not show a broken Windows or .NET.',
    fix: [
      'On that client, turn the collection off: "allowHwInfoCollect": false in its appsettings.json (that client\'s key since 1.3.4, not this pool\'s); in the 2024 threads users hit this with it set to true.',
      'No Windows or .NET reinstall is indicated by this trace.',
      'If it/s then stays at 0 for 20 minutes, that is a separate problem: paste the log lines after 20 minutes.',
    ],
    test: /WmiNetUtilsHelper|HardwareHelper\.GetCPU\w*|ManagementPath\.CreateWbemPath/i,
    drops: ['crash'],
  },
  {
    id: 'custom-runner',
    severity: 'check',
    prose: true,
    title: "A custom runner: removed from the qubic.li client in 3.0",
    means: 'The qubic.li client release notes say version 3.0 removed its legacy constructs, the custom runner among them, and CustomRunner.md is a DRAFT written for the old protocol. A customRunner setup on a 3.x client is unsupported, so no setting there is a known fix.',
    fix: [
      'Run that client with its own trainer, or report the failure upstream with the call chain; no user-side config fix is known.',
      'Stopgap: a supervisor that restarts the client when it dies (systemd Restart=always or similar).',
      "A custom trainer is not part of this pool's setup: on this pool use the setup page command.",
    ],
    test: /\bcustom ?runner\b|CustomRunner\.md/i,
    read: (_m, log) =>
      /stack ?overflow/i.test(log)
        ? {
            title: 'A stack overflow in an unsupported custom runner',
            means: `${/->|recurs/i.test(log) ? 'The call chain re-enters itself on every trainer update with no exit condition, so the stack grows per update until it overflows. ' : ''}A stack overflow in .NET cannot be caught, so the process dies with no handled exception. The qubic.li client release notes say version 3.0 removed the custom runner (CustomRunner.md is a DRAFT for the old protocol), so customRunner on a 3.x client is unsupported.`,
          }
        : undefined,
    drops: ['error-line', 'crash'],
  },
  {
    id: 'gateway-missing',
    severity: 'fault',
    title: "A copied flight sheet asks for a proxy gateway this rig does not have",
    means: "This is the qubminer HiveOS wrapper (the qubic.li package, h-config.sh, 2 Nov 2026): the trainer line asks for the 'proxy' call scheme, but no GATEWAY is set, so the miner falls back to a default gateway compiled in by its developer, a private LAN address your rig cannot reach. That is why it sits idle.",
    fix: [
      "If you do not run a gateway yourself, remove the 'proxy' call scheme from the copied trainer line in Extra config, then restart the miner.",
      'Only set "env": {"GATEWAY":"host:7733"} to a gateway you operate; never a host from a copied sheet.',
      'For this pool: use the HiveOS instructions from the setup page rather than a copied flight sheet.',
    ],
    test: /requests '?proxy'? but no GATEWAY|no GATEWAY is set|fall back to the miner dev'?s default gateway/i,
    drops: ['idle-long', 'epoch-idle'],
  },
  {
    id: 'apt-foreign-source',
    severity: 'fault',
    title: 'Another Ubuntu release was added to the apt sources',
    means: "The command adds an Ubuntu 22.04 (jammy) package source. Mixing releases means a later apt upgrade or install pulls that release's packages (libc6 and more) into a system built on another one, which breaks it.",
    fix: [
      'Remove that line from /etc/apt/sources.list (edit the file, or sudo sed -i \'/ubuntu jammy main/d\' /etc/apt/sources.list), then sudo apt update; run no apt upgrade while it is there.',
      'Already broken: move to the latest stable image (hive-replace --stable --yes, per the qubminer README) or reflash.',
      'For this pool: the HiveOS instructions on the setup page.',
    ],
    test: /\bdeb\s+\S*(?:ubuntu|debian)\S*\s+(?:jammy|noble|bookworm|trixie)\b|\b(?:jammy|noble|bookworm)\b[^\n]{0,60}sources\.list|sources\.list[^\n]{0,60}\b(?:jammy|noble|bookworm)\b/i,
    read: (_m, log) =>
      /hive/i.test(log)
        ? {
            title: 'An Ubuntu jammy apt source was added to HiveOS',
            means: "The command adds an Ubuntu 22.04 (jammy) package source to HiveOS. A later apt upgrade or install then pulls jammy packages into the HiveOS base, which can break it: users and the qubminer maintainers reported a broken console and installs that needed a reflash (qubic-li/hiveos #3, #5, Mar 2024). The maintainers said the line must be removed after installing libc6, and the current qubminer wrapper no longer needs it (h-run.sh fetches its own helper, 2026).",
          }
        : undefined,
    drops: ['glibc'],
  },
  {
    id: 'tar-archive',
    severity: 'check',
    prose: true,
    title: 'A Linux .tar.gz opened as a Windows archive',
    means: 'A .tar.gz is a Linux archive: a tar file inside gzip. It is unpacked inside Linux (for Ubuntu under Windows, inside WSL) with tar. Renaming it to .rar is wrong, and the one file without an extension that comes out is the inner .tar, not a Windows program.',
    fix: [
      'Inside Linux or WSL, in the folder that holds it: tar -xzf <file>.tar.gz',
      'On Windows, 7-Zip opens the .gz and then the .tar inside it; the Linux program still only runs inside Linux or WSL.',
      'If tar also reports damage, download it again and compare the checksum when the release gives one.',
      'For this pool: the command for the system you actually run (Linux in WSL, or Windows) from the setup page.',
    ],
    test: /\.tar(?:\.gz|\.xz)?\b[^\n]{0,120}\b(?:winrar|7-?zip|corrupt(?:ed)?|damaged|renam\w*)|\b(?:winrar|7-?zip)\b[^\n]{0,120}\.tar\b/i,
  },
  {
    id: 'trainer-load',
    severity: 'fault',
    title: 'The client cannot load its trainer',
    means: '"Error loading current trainer binary", then "the trainer isn\'t working properly": the client fetched its trainer, but the binary does not load or run on this system. Usual causes: system libraries older than the build needs (glibc on Linux), a CPU without the instruction set the build needs (AVX2), or on Windows an antivirus that removed the file or a missing VC++ Redistributable.',
    fix: [
      'Linux: ldd --version (first line) and cat /etc/os-release. Windows: Protection history, and the VC++ Redistributable 2015-2022.',
      "Check the CPU has AVX2: lscpu | grep -o avx2 (Windows: Coreinfo).",
      'Use the newest release of that client; for this pool, the command from the setup page.',
    ],
    test: /error loading (?:the )?(?:current )?trainer(?: binary)?|(?:failed|unable) to (?:load|start) (?:the )?trainer\b|trainer (?:binary )?(?:could not|cannot|failed to) (?:load|start)|trainer is(?:n.t| not) working properly/i,
    read: (_m, log) => {
      const low = isasIn(log).find(c => c.isa === 'avx')
      if (low)
        return {
          title: 'The CPU has no AVX2, so the trainer cannot run',
          means: `${low.model} has no AVX2 (AVX at most). The QLI maintainer said in Jan 2024 that the client cannot run without AVX2 or AVX-512, and the trainer then fails as in this log. A later QLI release added a GENERIC CPU trainer; whether current epochs run on a CPU like this is not confirmed in my sources.`,
          fix: ["Confirm: lscpu | grep -o 'avx2\\|avx512f' | sort -u prints nothing on this CPU.", 'Do not expect a config change to fix it: mine with a supported NVIDIA card or a CPU with AVX2.', 'For this pool, check the backends on the setup page; do not count on this CPU.'],
        }
      if (WINDOWS.test(log)) return { means: '"Error loading current trainer binary" on Windows: the trainer file did not load. Likely an antivirus that blocked or removed it, or a missing VC++ Redistributable 2015-2022. Likely, not confirmed.' }
      if (/linux|ubuntu|debian|rocky|centos|hiveos|乌班图|\/lib\/|\bldd\b/i.test(log))
        return {
          title: 'The trainer does not load: likely system libraries (glibc) too old',
          means: 'The trainer binary does not load on this Linux system. Likely, not confirmed: it needs a newer glibc than this OS release provides (Ubuntu 22.04 has 2.35, 24.04 has 2.39; Rocky 8 and Ubuntu 20.04 are older). Same-period QLI reports (Dec 2023) showed "GLIBC Version must be >= 2.34" on such systems.',
          fix: ['Check: ldd --version (first line) and cat /etc/os-release; paste the full log after "preparing the worker".', 'Use the newest client, on an OS release whose glibc meets the requirement. Never upgrade glibc by hand.', 'For this pool: the Linux option on the setup page gives the command.'],
        }
      return undefined
    },
    drops: ['worker-exit', 'crash'],
    sources: ['community'],
  },
  {
    id: 'wrong-arch',
    severity: 'fault',
    title: 'The binary is built for another platform',
    means: 'The file exists but cannot run here: it was built for another CPU architecture or operating system. "No such file or directory" on a file that is there usually means its loader (ELF interpreter) is missing.',
    fix: [
      'Check the machine: uname -m (x86_64 or aarch64) and the file: file <binary>.',
      'Download the build for this OS and architecture. On this pool the setup page offers Linux, macOS, Windows and HiveOS and gives the command.',
      'Never patch the ELF interpreter or fake system paths: the build itself is wrong for this system.',
    ],
    test: /interpreter \/system\/bin\/linker|exec format error|cannot execute binary file|wrong elf class|not a valid win32 application|bad cpu type in executable|is not compatible with the version of windows/i,
    read: (_m, log) =>
      /\/system\/bin\/linker/i.test(log)
        ? { means: 'The worker is an Android (bionic) build: its interpreter is /system/bin/linker64, which a normal glibc Linux system does not have, so starting it fails with "No such file or directory". It was delivered to a Linux ARM64 machine: an open QLI client bug since 28 Aug 2026 (qubic-li/client #136), not fixable locally.' }
        : undefined,
    drops: ['missing-file', 'permission', 'crash', 'worker-exit'],
  },
  {
    id: 'cpu-generic',
    severity: 'fault',
    title: 'The CPU has no AVX2: the generic worker runs, or fails',
    means: 'The QLI client starts its GENERIC worker when the CPU has no AVX2 (QLI README: GENERIC needs no specific instructions, AVX2 needs AVX2). That is Intel Core 2nd and 3rd gen, Xeon E5 v1/v2 and older: AVX2 arrived with Intel 4th gen (Haswell, 2013). In qubic-li/client #117 (Mar 2025) Core gen 2 and 3 machines did not run at all, gen 6 and newer did; gen 4 and 5 were untested.',
    fix: [
      'Check the CPU: lscpu | grep -o avx2 (Windows: Coreinfo, or the model on the vendor page). No avx2: retire this machine from Qubic rather than tweak it.',
      'On Windows the runner also needs the Microsoft Visual C++ Redistributable 2015-2022 (QLI README); install it if it is missing.',
      'For this pool, any machine with AVX2 or a supported NVIDIA card: use the setup page command.',
    ],
    test: /qli-worker-GENERIC|\[GENERIC\][^\n]{0,40}(?:trainer|worker)|generic (?:x64 )?(?:cpu )?(?:trainer|worker)[^\n]{0,40}(?:start|exit|fail)/i,
    drops: ['worker-exit'],
    sources: ['community'],
  },
  {
    id: 'docker-pull',
    severity: 'fault',
    title: 'Docker cannot pull that image name',
    means: '"pull access denied ... repository does not exist" means the image name or tag is wrong far more often than a login problem. Docker says "may require docker login" for any name it cannot find.',
    fix: [
      'Check the exact image name and tag in the source you copied it from. The qubic.li client images are qubicli/client:latest (CPU) and qubicli/client:cuda (NVIDIA + CPU) per its README (5 Nov 2026); qubicli/qubic-client was a README typo (qubic-li/client #134, Mar 2026). Those are qubic.li images, not this pool\'s.',
      'For this pool, use the setup page (Linux, macOS, Windows, HiveOS) and the command it gives.',
    ],
    test: /pull access denied|repository does not exist|manifest (?:for \S+ )?(?:not found|unknown)|toomanyrequests: |requested access to the resource is denied/i,
    drops: ['permission', 'auth'],
  },
  {
    id: 'docker-gpu',
    severity: 'fault',
    title: 'The container cannot see the GPU',
    means: 'Docker started the container without GPU access: the NVIDIA Container Toolkit is missing on the host, or the run command lacks --gpus all.',
    fix: [
      'On the host: install the NVIDIA Container Toolkit (NVIDIA docs), then sudo nvidia-ctk runtime configure --runtime=docker && sudo systemctl restart docker.',
      'Run with --gpus all. Test: docker run --rm --gpus all ubuntu nvidia-smi must list the cards.',
      'On a rented box the host decides: pick an image or offer with GPU access, never install drivers inside the container.',
    ],
    test: /could not select device driver[^\n]{0,40}gpu|nvidia-container-cli: |unknown flag: --gpus|nvidia-container-runtime[^\n]{0,40}(?:not found|error)/i,
    drops: ['cuda-missing'],
  },
  {
    id: 'cuda-module',
    severity: 'fault',
    title: 'The miner sees the card but cannot load its GPU code',
    means: 'The card is detected, but loading the CUDA module failed. Usual causes: an old or broken driver install, a driver/library mismatch after an update without a reboot, a card the build does not support, or on a laptop the NVIDIA GPU not being the active one.',
    fix: [
      'Check nvidia-smi: it must list the card with a driver and a CUDA version. "Driver/library version mismatch": reboot.',
      'Own machine: update or clean-reinstall the NVIDIA driver, then reboot. Rental: change the image or the box, never install drivers inside it.',
      'Laptop: plugged in, the NVIDIA GPU set as the high-performance GPU for the miner (Windows Graphics settings or the NVIDIA Control Panel), and watch the temperature.',
      'Pascal (GTX 10) and older: treat as unsupported since epoch 237 (28 Oct 2026).',
    ],
    test: /failed to load module|cuModuleLoad|no kernel image is available|CUDA_ERROR_NO_BINARY_FOR_GPU|PTX JIT compil|forward compatibility was attempted|driver\/library version mismatch|CUDA_ERROR_(?:INVALID_PTX|UNSUPPORTED_PTX)/i,
    drops: ['cuda-missing', 'crash'],
  },
  {
    id: 'nvidia-xid',
    severity: 'fault',
    title: 'NVIDIA Xid errors: the GPU faulted under load',
    means: 'The kernel logged NVIDIA Xid errors: the driver reports the GPU itself faulting while it worked. The usual first suspect is an unstable overclock, then power (PSU, cables), the riser or slot, or heat (general NVIDIA knowledge, Xid catalog).',
    fix: [
      'Put that card on stock clocks (no core or memory offset) and confirm it is stable; then re-tune slowly. An overclock stable in one epoch can fail in the next: the workload changes with epochs and algorithms, so re-check it after each change.',
      'Check temperatures, the PSU and its cables; reseat or swap the riser or slot if it continues.',
      'Ask: the current OC values, and whether every Xid line names the same PCI bus ID (one card) or several (the whole rig).',
    ],
    test: /\bNVRM:\s*Xid\b|\bXid\s*(?:\(PCI:[\w:.]+\))?\s*:\s*\d{1,3}\b/i,
    read: (_m, log) => {
      const hits = [...log.matchAll(/\bXid\s*(?:\((PCI:[\w:.]+)\))?\s*:\s*(\d{1,3})\b/gi)]
      if (!hits.length) return undefined
      const codes = [...new Set(hits.map(h => h[2]!))].sort((a, b) => Number(a) - Number(b))
      const buses = [...new Set(hits.map(h => h[1]).filter(Boolean))] as string[]
      const proc = /name=([\w.-]+)/.exec(log)?.[1]
      const where = buses.length === 1 ? `all on one card (${buses[0]})` : buses.length > 1 ? `on ${buses.length} cards (${buses.join(', ')})` : ''
      const xid79 = codes.includes('79') ? ' Xid 79 (fallen off the bus) points first to power, the riser or the slot.' : ''
      return {
        means: `Xid ${codes.map(c => `${c} (${XID[c] ?? 'see the NVIDIA Xid catalog'})`).join(', ')}${where ? `, ${where}` : ''}${proc ? `, under ${proc}` : ''}: that GPU faults under load. The usual first suspect is an unstable overclock, then power (PSU, cables), the riser or slot, or heat (general NVIDIA knowledge, Xid catalog).${xid79}`,
      }
    },
    drops: ['worker-exit', 'crash'],
  },
  {
    id: 'cuda-illegal-address',
    severity: 'fault',
    title: 'CUDA illegal memory access on the GPU',
    means: '"An illegal memory access was encountered" (cudaErrorIllegalAddress): a GPU kernel touched memory it should not. On a mining rig the usual causes are an unstable core or memory overclock, power, a riser or narrow PCIe link, or heat; a bug in the build is possible but rarer (general CUDA knowledge).',
    fix: [
      'Run every card at stock clocks first.',
      'Start with one or a few cards and add the rest back one at a time; check the link width with nvidia-smi -q | grep -A2 "Link Width" and the kernel log with sudo dmesg | grep -i xid.',
      'Ask: the riser type and link width per card, and whether the error still appears at stock clocks.',
    ],
    test: /illegal memory access|cudaErrorIllegalAddress|CUDA_ERROR_ILLEGAL_ADDRESS|\billegal address\b/i,
    read: (_m, log) => {
      const masked = /\bmask|one by one|each card|every card|card by card|removed? (?:the |each )?cards?/i.test(log)
      const tips = /TIPS:|PCIe x\d|low OC|check your OC/i.test(log)
      if (!masked && !tips) return undefined
      return {
        means: `"An illegal memory access was encountered": a GPU kernel touched memory it should not.${tips ? " The trainer's own hints name the overclock and the PCIe link (x8 or x16 recommended)." : ''}${masked ? ' Masking the cards one by one did not remove it, so a cause the whole rig shares is more likely than one bad card: x1 risers or a narrow link, the PSU, or the host (CPU and RAM for that many cards). Likely, not confirmed.' : ' Usual causes: an unstable overclock, power, a riser or narrow PCIe link, or heat.'}`,
      }
    },
    drops: ['crash', 'worker-exit'],
  },
  {
    id: 'config-invalid',
    severity: 'fault',
    title: 'The config file is empty or not valid JSON',
    means: 'The client cannot parse its config file, so it exits before mining. "The input does not contain any JSON tokens ... LineNumber: 0" means the file is empty.',
    fix: [
      'Open the file and check it: one JSON object, keys and strings in double quotes, commas between entries, none after the last.',
      'On a disk that is full, a rewritten config ends up empty: check df -h.',
      'Validate it: python3 -m json.tool appsettings.json',
    ],
    test: /failed to load configuration from file|could not parse the json|JsonReaderException|does not contain any json tokens|is an invalid start of a value|unexpected character encountered while parsing|invalid json|json[^\n]{0,20}(?:parse|syntax) error/i,
    read: (_m, log) =>
      /\/hive\/miners\/custom|hiveos|flight ?sheet/i.test(log)
        ? {
            means: 'The HiveOS package cannot parse its appsettings.json (an empty file if it says "does not contain any JSON tokens"). In the qubic.li HiveOS package the startup script recreates appsettings.json from the flight sheet on every start and merges each Extra Config line into it (qubic-li/hiveos README, 5 Nov 2026), so a hand edit is overwritten and the fix is in the flight sheet.',
            fix: [
              'Fix it in the flight sheet, not in the file: check every Extra Config line ("key": value, double quotes, no stray braces).',
              'Check free disk space with df -h: a full disk leaves the regenerated file empty.',
              'If the flight sheet is fine, reinstall the miner package, then miner start.',
            ],
          }
        : undefined,
    drops: ['crash', 'hive-install'],
  },
  {
    id: 'config-nesting',
    severity: 'fault',
    title: 'A config block sits at the wrong level, so it is ignored',
    means: 'In the QLI client\'s appsettings.json the "trainer" block (cpuThreads, cpuVersion, gpu) belongs inside "ClientSettings" (QLI README samples, read 5 Nov 2026). At the JSON root it is likely ignored, and the client uses its defaults.',
    fix: [
      'Move the block inside "ClientSettings", keep the JSON valid, restart the client, and check the line where it prints the thread count.',
      'These are the QLI client\'s keys; on this pool the setup page sets backend and threads in the command it gives.',
    ],
    test: PARSED,
    sources: ['community'],
  },
  {
    id: 'client-timeout',
    severity: 'fault',
    title: 'The client cannot reach its server (timeout)',
    means: 'The client\'s requests time out before any answer (".NET HttpClient.Timeout of 100 seconds", TaskCanceledException): it never reaches its backend at all. A local block (an antivirus or Windows Defender holding the program or its update, a firewall) or the network path; not the GPU or the trainer.',
    fix: [
      'Windows: open Windows Security, Protection history: if the miner or its update was blocked or quarantined, restore it and allow only the miner folder. Never switch protection off.',
      'Check the firewall and any VPN or proxy, then test from that machine: nslookup and curl -I to the host the client uses.',
      'Ask: do other machines on the same network connect, and what does Protection history show?',
    ],
    test: /HttpClient\.Timeout|request was canceled due to the configured|TaskCanceledException|System\.TimeoutException/i,
    drops: ['register-rejected', 'connection', 'crash', 'auth'],
    sources: ['defenderHistory', 'defenderExclusion'],
  },
  {
    id: 'register-rejected',
    severity: 'fault',
    title: "The client's registration was rejected",
    means: "The QLI client's registration call was refused by its backend. The reason is in the same line: Unauthorized (the credential), BadRequest (the request or the client version).",
    fix: [
      'Install the newest release of that client from its official page (check its release page for the version) and run it again.',
      'Never paste the access token into a chat or an issue.',
      'For this pool: the setup page asks for your public address and a QC. worker name and gives the command.',
    ],
    test: /register(?: error)?:? badrequest|api register error|feature registration (?:request )?failed|registration failed/i,
    // the title names the class in the log: Unauthorized, BadRequest, or only "rejected"
    read: (_m, log) => {
      if (/unauthori[sz]ed|access denied|\b401\b/i.test(log))
        return {
          title: "The client's credential was rejected (Unauthorized)",
          means: '"Unauthorized" on the update check and on registration (and "API: Access Denied") mean the backend rejected the client\'s credential, for the QLI client its access token: not a hardware, driver or trainer fault. The QLI README says to create a new access token after an authentication failure.',
          fix: [
            "Enter the token again in that client's config, whole (no stray quotes, spaces or line breaks), or create a new one in that client's account panel. Never paste it into a chat or an issue.",
            "Use that client's newest release (check its release page).",
            'This pool uses no token: the setup page asks for your public address and a QC. worker name and gives the command.',
          ],
        }
      if (/badrequest|\b400\b/i.test(log))
        return {
          title: "The client's registration was rejected (BadRequest)",
          means: 'The QLI client\'s registration call came back BadRequest. In qubic-li/client #115 (Mar 2025, client 1.9.6, no maintainer reply) the client was a 2024 release while 3.x was out, and its "up to date" check could not be trusted. Likely: a client too old for the backend, or an ID the backend no longer accepts.',
        }
      return undefined
    },
    drops: ['crash', 'auth'],
    sources: ['community'],
  },
  {
    id: 'pool-reply-not-json',
    severity: 'fault',
    title: 'The pool server answered with something that is not JSON',
    means: '"reqwest ... Decode ... expected value at line 1 column 1" (and "Unexpected token < in JSON") mean the miner asked the server and got a non-JSON reply: an HTML error or maintenance page, a wrong URL, or an endpoint that no longer serves that miner version.',
    fix: [
      'Check the miner version: an old build talks to endpoints that changed. Use the current release.',
      'Check the pool URL against its source, and whether that pool announced maintenance.',
      'For this pool, use the setup page command.',
    ],
    test: /reqwest::Error \{ kind: Decode|expected value", line: ?1, column: ?1|expected value at line 1 column 1|error decoding response body|unexpected token < in json/i,
  },
  {
    id: 'missing-file',
    severity: 'fault',
    title: 'A file the miner needs is missing',
    means: 'The program looked for a file that is not there. On Windows the usual cause is an antivirus that quarantined the runner or worker .exe right after download, or an incomplete extraction; a OneDrive-synced folder (Desktop, Documents) can also hold files back.',
    fix: [
      'Windows: open Windows Security, Protection history. If the file is listed, Restore it and add the miner folder, only that folder, as an exclusion (setup-page miner only).',
      'Extract the download again into a plain folder outside OneDrive, such as C:\\QubicMiner, and run it from there.',
      'Linux: check the path with ls -l and run the command from the miner folder.',
    ],
    test: /^(?![^\n]*(?:libcuda|nvidia|interpreter|\/hive\/miners))[^\n]*(?:FileNotFoundException|could not find file|cannot find the file specified|no such file or directory)/i,
    read: (_m, log) => (/linux|ubuntu|bash:|\/home\/|\/root\//i.test(log) && !/[A-Z]:\\|\.exe\b/i.test(log) ? { means: 'The program looked for a file that is not there: a wrong path, a file that was never extracted, or a command run from another folder.' } : undefined),
  },
  {
    id: 'win-blocked',
    severity: 'fault',
    title: 'Windows refused to start the miner (Access is denied)',
    means: '"Access is denied" when starting a miner .exe usually means an antivirus (Windows Defender or another) blocked or quarantined it: Microsoft lists mining software as a potentially unwanted app category. Less often the file is locked by another process or sits in a protected folder. Likely, not confirmed.',
    fix: [
      'Open Windows Security, Protection history: if the miner is listed, Restore it (or Allow on device).',
      'Check the .exe is still in its folder; then add that folder, and only that folder, as an exclusion (setup-page miner only). Never switch protection off.',
      'Start it from a Command Prompt opened in that folder, so the error stays visible.',
    ],
    test: /\baccess is denied\b|acceso denegado|acesso negado|acc[eè]s refus[eé]|zugriff verweigert|accesso negato|отказано в доступе|拒绝访问|拒絕存取/i,
    drops: ['permission'],
    sources: ['defenderPua', 'defenderHistory', 'defenderExclusion'],
  },
  {
    id: 'win-not-found',
    severity: 'fault',
    title: 'Windows cannot find the program you started',
    means: '"Is not recognized as an internal or external command": cmd looked for the program in the current folder and on the PATH and did not find it. Run as administrator, a .bat starts in C:\\Windows\\System32, so a bare name such as miner.exe is not found there; or an antivirus already removed the .exe. Likely, not confirmed.',
    fix: [
      'Put cd /d "%~dp0" as the first line of the .bat, so it runs in its own folder; or open a Command Prompt in the miner folder and start it there.',
      'Check the .exe is still in that folder; if not, look in Windows Security, Protection history, restore it, and exclude only that folder (setup-page miner only).',
      'In PowerShell a program in the current folder needs .\\ before its name.',
    ],
    test: /is not recognized as an internal or external command|no se reconoce como un comando interno o externo|n[aã]o [eé] reconhecido como um comando interno|n'est pas reconnu en tant que commande interne|ist entweder falsch geschrieben oder konnte nicht gefunden werden|не является внутренней или внешней|不是内部或外部命令|is not recognized as (?:the )?name of a cmdlet/i,
    drops: ['missing-file'],
    sources: ['defenderHistory', 'defenderExclusion'],
  },
  {
    id: 'disk-full',
    severity: 'fault',
    title: 'The disk is full',
    means: 'The miner cannot write its files. A full disk also leaves config files empty.',
    fix: ['Check free space: df -h (Windows: File Explorer, This PC).', 'Free space (old logs, old miner folders), then start the miner again.'],
    test: /no space left on device|\benospc\b|not enough space on the disk|disk (?:is )?full/i,
  },
  {
    id: 'hugepages',
    severity: 'check',
    title: 'Huge pages could not be set up',
    means: 'The miner asked for huge pages and the system had too few free. Most miners then fall back to normal memory, a little slower; the QLI trainer says how many it wants (52 per thread, QLI README).',
    fix: [
      'Linux: sudo sysctl -w vm.nr_hugepages=<the number the miner asks for>. Add vm.nr_hugepages=<n> to /etc/sysctl.conf to keep it after a reboot.',
      'After a long uptime memory fragments: set it right after boot, before other programs start.',
    ],
    test: /--enable-hugepages|huge ?pages?\b[^\n]{0,60}(?:smaller than needed|fail|unavailable|not available|cannot|error|disabled)|nr_hugepages|MAP_HUGETLB/i,
    read: (_m, log) =>
      /--enable-hugepages/i.test(log) && /segfault|segmentation fault|sigsegv|core dumped|crash/i.test(log)
        ? {
            severity: 'fault',
            title: 'A crash with the hugepages flag on',
            means: 'The miner crashes while started with --enable-hugepages. In rqiner #54 (Dec 2024) the 1.1.2-experimental Zen4 build segfaulted at once with that flag, and dropping it fixed it; the reporter suspected that switching CPU miners in idle periods fragments memory, so huge pages cannot be allocated and the experimental build crashes instead of falling back.',
            fix: ['Start the miner without --enable-hugepages first.', 'Prefer a stable build over an experimental one.', 'For this pool, use the setup page command.'],
          }
        : undefined,
  },
  {
    id: 'rate-falls',
    prose: true,
    severity: 'check',
    title: 'The rate falls after running a while',
    means: `The rate drops after a working start. On any rig, own or rented, the first 1 to 2 hours overstate the rate by about 1.3 to 1.5x (${OURS}), and it/s also falls through an epoch as the work deepens with no change in solutions. A larger drop that keeps going points to heat or power throttling, or to memory: huge pages not reserved at start make the trainer fall back to normal memory.`,
    fix: [
      'Judge over 6 to 12 hours and by solutions on the pool, not it/s.',
      'Check heat and clocks during the drop (CPU: sensors and the clock speed; GPU: nvidia-smi -q -d PERFORMANCE).',
      'After a huge pages change: grep Huge /proc/meminfo after the drop; HugePages_Free near 0 with the fallback warning means they were not reserved when the miner started (set them right after boot; sysctl -w does not survive a reboot).',
    ],
    test: new RegExp(`${RATE_FALLS_ZERO.source}|${RATE_FALLS_AFTER.source}`, 'i'),
    unless: log => MOBILE.test(log) || /\bepoch (?:change|switch|transition)\b/i.test(log),
    read: (_m, log) =>
      EPOCH_WIDE.test(log) && MANY_RIGS.test(log)
        ? {
            severity: 'fault',
            title: 'The rate collapses on several machines since the new epoch',
            means: "It started with the new epoch and hits more than one machine or other miners too: that points to the new epoch's trainer or client release, not your hardware (Likely, not confirmed). A reboot that helps for some minutes is not a fix; a scheduled reboot only resets the work each time.",
            fix: [
              'Do not script reboots or restart in a loop.',
              'Watch for a client or trainer update for this epoch and update the client to the current version from the setup page when it comes.',
              'Check with nvidia-smi while it shows 0 it/s whether the GPU is busy (use %, VRAM), and tell me the client and trainer version after any update.',
            ],
          }
        : RATE_FALLS_ZERO.test(log)
        ? {
            severity: 'fault',
            title: 'The rate falls to 0 after a working start',
            means: 'It ran, then fell to 0: that is not the warm-up (the 20-minute rule is for a rig that has not produced anything yet). Something stops the work: the worker exiting or being killed (out of memory), throttling, the pool refusing an outdated client, or the pool side. The log lines at the moment it drops show which.',
            fix: [
              'Read the log at the moment of the drop: an exit, a "killed" or out-of-memory line, a version message, a connection error.',
              'Check the version the miner prints, then heat and clocks, then sudo dmesg -T | grep -i -E "killed process|out of memory|xid".',
              'If several rigs drop at the same time, check the pool status channel.',
            ],
          }
        : undefined,
    drops: ['too-early', 'cold-start'],
    sources: ['field-e229', 'field-e233'],
  },
  {
    id: 'oom',
    severity: 'fault',
    title: 'Out of memory',
    means: 'The card or the machine ran out of memory and the miner stopped.',
    fix: ['Close other programs that use the GPU (games, other miners, AI tools).', 'Lower the thread count.', 'On a rented box, pick one with more RAM.'],
    test: /(?<!no )out of memory|\bOutOfMemory\b|cuda_error_out_of_memory|cudaErrorMemoryAllocation|std::bad_alloc|cannot allocate memory|memory allocation failed|oom[- ]kill|killed process \d+/i,
    read: (_m, log) =>
      WINDOWS.test(log) && /\b(?:cuda|gpu|cards?|rtx|gtx)\b/i.test(log)
        ? {
            title: 'Out of memory on the host as cards are added (Windows)',
            means: "Likely (general knowledge), not confirmed by the developers: a host memory limit, not one card's VRAM. On Windows each card's CUDA context reserves system memory against the commit limit (RAM plus page file); with a small page file or little RAM the allocation fails as cards are added, and the miner turns that into this OutOfMemory exit. A single broken card is not what this shows, all the more when each card works alone.",
            fix: [
              'Raise the Windows page file well above its current size (System, Advanced system settings, Performance, Virtual memory), reboot, then add the cards one at a time while watching Commit in Task Manager.',
              'Tell me the system RAM, the page file size, and the card models with their VRAM.',
              'For this pool: the Windows command from the setup page, not flags from another miner.',
            ],
          }
        : undefined,
    drops: ['crash'],
  },
  {
    id: 'no-avx',
    severity: 'fault',
    title: 'The CPU cannot run this build (illegal instruction)',
    means: '"Illegal instruction", "invalid opcode", SIGILL or exit code 132 mean the program used a CPU instruction this CPU, or this VM, does not execute. Almost always an AVX-512 or AVX2 build on a CPU or VM without it.',
    fix: [
      'Use the AVX2 build (or Auto); on this pool pick the backend on the setup page and run the command it gives.',
      "Check the CPU flags: lscpu | grep -o 'avx512[a-z_]*\\|avx2' | sort -u (Windows: Coreinfo). In a VM, the host may hide flags.",
      'If AVX2 also fails, this CPU cannot mine: use a GPU or another machine.',
    ],
    test: /illegal instruction|invalid opcode|\bsigill\b|exit(?:ed with)? code 132\b|avx-?(2|512)[^\n]*(not (supported|available|found|detected)|unsupported|missing)|(cpu|processor) does not support avx|requires avx|status=4\/ill\b/i,
    read: (_m, log) => {
      if (/\baarch64\b|\barm64\b/i.test(log) && !/avx/i.test(log))
        return {
          title: 'The ARM build uses instructions this CPU lacks (illegal instruction)',
          means: `An aarch64 build stops with "Illegal instruction": it uses ARM instructions this CPU does not have; not a config or address problem. rqiner's developer said its aarch64 build is compiled for Neoverse-N1, an ARMv8.2 server core (rqiner-builds #4, Mar 2024), and offered builds for other CPUs on request; in that repo it failed on a Snapdragon 625 and a Raspberry Pi and worked on a Snapdragon 7 Gen 2 (2024).${/jetson|tegra/i.test(log) ? ' A Jetson Nano has Cortex-A57 cores (ARMv8.0), so it fails the same way, and its small Maxwell GPU is not a mining device here.' : ''}`,
          fix: [
            'Check: uname -m and grep -m1 -i features /proc/cpuinfo.',
            'No setting fixes this: it needs a build for this CPU.',
            'For this pool: the setup page lists the supported systems and gives the command; my sources confirm no Linux ARM64 option, so check the page.',
          ],
        }
      const cpus = isasIn(log)
      const avx512 = cpus.find(c => c.isa === 'avx512')
      const asked512 = /avx-?512/i.test(log)
      if (avx512 && asked512)
        return {
          means: `${avx512.model} has AVX-512 (avx512f), yet the AVX512 build hit an illegal instruction. Likely: the build uses AVX-512 extensions this CPU generation lacks (early Xeon Scalable such as the Gold 61xx has no VNNI or BF16), or a VM hides some flags. The AVX512 build is not usable here; the AVX2 build is.`,
        }
      const low = cpus.find(c => c.isa === 'avx2' || c.isa === 'avx')
      if (low && asked512) return { means: `${low.model} has no AVX-512 (${low.isa === 'avx' ? 'not even AVX2' : 'AVX2 only'}), so the AVX512 build cannot run on it. ${AVX512_BY_CPU}` }
      if (low?.isa === 'avx') return { means: `${low.model} has no AVX2, so the AVX2 and AVX512 builds cannot run on it; only a generic build would, very slowly.` }
      return undefined
    },
    drops: ['crash'],
  },
  {
    id: 'cpu-no-flag',
    severity: 'fault',
    title: 'The miner found no CPU instruction set it supports',
    means: '"not find any flag to support" right after the mining info: the miner checked the CPU flags and found none of the instruction sets its CPU builds need. On a supported CPU the same line reads "support avx2" (apoolminer logs, 2024). Likely: the CPU has no AVX2, or a VM hides the flags.',
    fix: [
      "Check the CPU model and its flags: lscpu | grep -o 'avx[^ ]*' | sort -u (Windows: Coreinfo).",
      'No avx2 in the list: that build cannot run on this CPU; mine with a supported NVIDIA card or another machine. In a VM, ask the host to pass the CPU flags through.',
      'For this pool: the setup page lists the backends and gives the command.',
    ],
    test: /not find any flag to support|no (?:supported )?(?:cpu )?(?:instruction sets?|flags?) (?:found|to support|supported)|cpu (?:flags?|features?) (?:are )?not supported/i,
    drops: ['crash', 'worker-exit'],
    sources: ['community'],
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
    test: /\benotfound\b|\beai_again\b|getaddrinfo|could not resolve (?:host|hostname|address|the host)|name or service not known|temporary failure in name resolution|no such host is known|\bno such host\b|nodename nor servname/i,
  },
  {
    id: 'tls-cut',
    severity: 'fault',
    title: 'A secure (TLS) download or connection was cut off',
    means: 'The HTTPS stream ended mid-transfer ("unexpected EOF or 0 bytes from the transport stream", a failed TLS handshake): the client was downloading a file or talking to its server when the connection dropped. Likely causes, in order: an unstable network, a VPN or proxy, an antivirus web shield that scans TLS, a wrong system clock, the server side. Not the GPU.',
    fix: [
      'Retry on a stable connection; pause the VPN or proxy, and the antivirus web shield or HTTPS scanning, for the miner only.',
      'Check the system date and time, and the free disk space.',
      'Ask: does it fail at the same point every time, and is a VPN, proxy or web shield active?',
    ],
    test: /unexpected EOF or 0 bytes from the transport stream|the remote party has closed the transport stream|EnsureFullTlsFrame|\b(?:TLS|SSL) handshake (?:failed|failure|timed out|error)|\bhandshake (?:failed|failure)\b[^\n]{0,30}\b(?:tls|ssl)\b|SSL_ERROR_SYSCALL|\btls: (?:handshake failure|bad record mac)|unexpected eof while reading|error while copying content to a stream/i,
    drops: ['connection', 'crash', 'auth'],
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
    prose: true,
    severity: 'fault',
    title: 'A phone miner login was rejected (another pool\'s app)',
    means: 'On 2 Oct 2026 another pool\'s moderator said "Authentication failed" in its phone app meant the phone was blacklisted for sending too many shares in a short time, and that they were fixing it. Qubic Church Pool has no Android option.',
    fix: ['Mine on a PC or a server: the pool setup page offers Linux, macOS, Windows and HiveOS.', 'For that app, ask the pool that runs it.'],
    test: /authentication failed(?! because the remote party)|auth(entication)? (error|rejected)/i,
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
    test: /\b(401|403)\b[^\n]*(unauthori[sz]ed|forbidden)|unauthori[sz]ed|forbidden|invalid (token|access token|api key)|authentication failed(?! because the remote party)/i,
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
    id: 'hive-miner-dies',
    severity: 'fault',
    title: 'The HiveOS miner dies right after it starts',
    means: '"Miner screen is not running": HiveOS started the miner in its screen session and it exited at once. If the same flight sheet works on another rig, the cause is this rig\'s HiveOS install, not the flight sheet.',
    fix: [
      'Read the first error in miner log (or tail -n 50 /var/log/miner/custom/custom.log).',
      'Bring HiveOS to the latest stable image: hive-replace --stable --yes (the qubic.li HiveOS package README asks for the latest stable; in 2024 it asked for the beta). A cached old package: custom-get <install URL> -f.',
      "If the update command itself fails, the install is likely damaged: follow Hive's replace guide, else reflash the image from a PC or replace the drive.",
      'Take the flight sheet values from the pool setup page.',
    ],
    test: /miner screen is not running|screen session[^\n]{0,30}(?:terminated|not running|dead)/i,
    drops: ['error-line'],
    sources: ['hiveShell', 'qubicliHive'],
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
    test: /^(?![^\n]*(?:pull access denied|requested access to the resource|permission granted))[^\n]*(?:permission denied|\beacces\b|operation not permitted|access (?:to the path [^\n]{0,80} )?is denied)/i,
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
    title: 'The CPU backend may not match the CPU',
    means: 'This config forces AVX2 or a generic backend ("cpuVersion" is the key in the QLI client\'s config, not ours). On an AVX-512 CPU (every Ryzen 7000 and 9000 desktop CPU such as the 9900X, Threadripper 7000, EPYC 9004/9005) that wastes the CPU: on 2 Oct 2026 a Ryzen 9 9900X sat at 0 it/s with AVX2 and forcing "cpuVersion": "AVX512" fixed it.',
    fix: [
      'Check the CPU first: lscpu | grep -o avx512f (Windows: Coreinfo). avx512f present: choose AVX512, or Auto if unsure. Absent: AVX2 is right.',
      'On this pool set the backend on the setup page and run the command it gives.',
      'If it then crashes on tmp.ant_*.part files, that is a separate open issue with no confirmed fix.',
    ],
    test: /"?cpuVersion"?\s*:\s*"(AVX2|GENERIC)"/i,
    read: (m, log) => {
      const cpus = isasIn(log)
      const big = cpus.find(c => c.isa === 'avx512')
      if (big) return { means: `${big.model} has AVX-512, and this config forces ${m[1]!.toUpperCase()} ("cpuVersion" is the QLI client's key, not ours). That wastes the CPU: on 2 Oct 2026 a Ryzen 9 9900X sat at 0 it/s with AVX2 and forcing "cpuVersion": "AVX512" fixed it.` }
      const two = cpus.find(c => c.isa === 'avx2')
      if (two && m[1]!.toUpperCase() === 'GENERIC') return { means: `${two.model} has AVX2, and this config forces GENERIC ("cpuVersion" is the QLI client's key, not ours): AVX2 is the right setting for it.`, severity: 'check' }
      if (cpus.length) return null
      return { means: `This config forces ${m[1]!.toUpperCase()} ("cpuVersion" is the QLI client's key, not ours). Right if the CPU has no AVX-512; wasteful if it has. ${AVX512_BY_CPU}` }
    },
    drops: ['cpu-threads'],
    sources: ['community', 'academy'],
  },
  {
    id: 'old-gpu',
    prose: true,
    severity: 'fault',
    title: 'A Pascal or older card: out of Qubic GPU mining since epoch 237',
    means: 'From epoch 237 (28 Oct 2026, client 3.11, worker cuda 237.0) a GTX 1050 Ti CUDA worker exited every few seconds though it worked in epoch 236 (reported), and a Tesla K80 does not run on current CUDA (20 Oct 2026). Pascal (GTX 10, P104/P106) and older cards are out whatever the driver: a newer driver does not bring them back. The pool said it would look; no fix confirmed by 4 Nov 2026 and no workaround is known.',
    fix: [
      'Treat GTX 10 series and P10x mining cards (Pascal), Kepler cards such as the K80 and older as unsupported until the pool confirms otherwise; take them out of Qubic mining and test with the newer cards only.',
      'The CPU still mines: keep the CPU backend on.',
      'Report the GPU model, driver and log to the pool. No older-algorithm option exists.',
    ],
    test: OLD_GPU,
    drops: ['zero-hashrate'],
    sources: ['community', 'qli-team'],
    open: true,
  },
  {
    id: 'closes-at-start',
    prose: true,
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
    id: 'gpu-unresponsive',
    severity: 'fault',
    title: 'The GPUs stopped responding and the miner exited',
    means: "The miner's watchdog got no answer from the card within its timeout, flagged it for shutdown and, with no card left, exited. The it/s lines before that are history, not a working state. Cards failing within seconds of each other point at the shared driver layer, not one card. Likely (general knowledge): a driver hang or timeout.",
    fix: [
      'Read the system log for that moment (Windows: Event Viewer, System, display driver resets; Linux: dmesg for Xid or amdgpu errors), at stock clocks.',
      'No restart script fixes it: a loop only restarts the hang.',
      'For this pool: a supported device (CPU, or an NVIDIA card through CUDA) and the command from the setup page.',
    ],
    test: /\b(?:GPU|device|card)\s*#?\d*[^\n]{0,60}(?:didn'?t respond|did not respond|not responding|stopped responding|flagged for shutdown)|all gpus have been flagged/i,
    read: (_m, log) =>
      /zluda|radeon|\bamd\b|\brx ?\d{3,4}/i.test(log)
        ? {
            means: `Both cards stopped answering the miner's watchdog within seconds, were flagged for shutdown, and the miner exited: the it/s lines before that are history. ZLUDA runs CUDA code on AMD cards as an unofficial translation layer; a failure on every card at once points at that shared driver layer, not one card. Likely (general knowledge): a driver hang or timeout under ZLUDA. AMD Radeon: no measurements of ours, and NVIDIA/CUDA is the proven path.`,
          }
        : undefined,
    drops: ['crash', 'worker-exit', 'miner-exits'],
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
    id: 'worker-exit',
    severity: 'fault',
    title: 'The trainer or worker keeps exiting',
    means: 'The client restarts its worker ("not running or has exited. Starting the process..."): the worker dies right after it starts. The cause is in the worker, not the pool connection.',
    fix: [
      'Read the first lines after "is starting": the error there is the cause. Paste them, with the trainer version line and the epoch (E:...).',
      'Use the current client, and check that the trainer version line changes after an epoch change.',
      'Stock GPU clocks while you test: an overclock that holds in games can crash this load.',
    ],
    test: EXIT_LINE,
    skipLine: /xmr/i,
    read: (_m, log) => {
      const lines = log.split(/\r?\n/)
      const exits = lines.filter(l => EXIT_LINE.test(l) && !/xmr/i.test(l)).length
      const loop = exits >= 2 || restarts(lines) >= 2 || /\bloop|every \d+ ?(?:s|sec|seconds)\b|keeps? (?:restarting|cycling|exiting)|\bcycling\b|exit immediately/i.test(log)
      const oc = /overclock|\boc\b|core offset|\+\d{2,3} ?mhz/i.test(log)
      const hive = /custom exited \(exitcode/i.test(log)
      const gpu = /cuda|\[gpu\]|rtx|gtx|nvidia/i.test(log)
      const parts = [
        loop ? 'A restart loop: the worker starts, exits within seconds, and the client starts it again.' : rule('worker-exit').means,
        hive ? 'In HiveOS "custom exited (exitcode=...), waiting to cooldown a bit" is the same loop at the package level: read miner log for the lines just above it.' : '',
        oc ? 'You run a GPU overclock: go back to stock clocks first. In qubic-li/client #114 (Jan 2025) a 5-second CUDA restart loop stopped after lowering the core offset from +225 to +150.' : '',
        /\bon (?:two|2|several|\d) (?:windows )?(?:pcs|machines|boxes|rigs)|both (?:windows and linux|oses)|two ubuntu/i.test(log) ? 'The same failure on several machines and both OSes points to the trainer release for that epoch, not your hardware.' : '',
      ]
      const fix = rule('worker-exit').fix.filter(f => gpu && !oc ? true : !/GPU clocks/.test(f))
      if (oc) fix.unshift('Set the GPU back to stock clocks (no core or memory offset) and run it for an hour; then re-apply any overclock in small steps, judged by solutions.')
      // an RTX 50 card whose worker dies at its first GPU step: the build or driver, not the config
      if (gpu && BLACKWELL.test(log) && !OLD_GPU.test(log)) {
        const other = /\b(?:rtx\s*)?(?:4090|4080|4070|3090|3080|3070)\b[^\n]{0,60}\b(?:works?|fine|ok|as expected)\b|\b(?:works?|fine)\b[^\n]{0,60}\b(?:4090|4080|4070|3090|3080)\b/i.test(log)
        return {
          title: 'The CUDA worker dies at its first step on an RTX 50 (Blackwell) card',
          means: `${loop ? 'A restart loop: the CUDA worker starts, dies at its first GPU step, and the client starts it again, so the card never hashes. ' : ''}Likely, not confirmed: the worker build or the driver lacks support for the RTX 50 (Blackwell) architecture${other ? ', since the same build runs on the older card' : ''}; not your config. No confirmed fix in the reports I have.`,
          fix: [
            'Install a current NVIDIA driver that supports the card, and confirm nvidia-smi lists it.',
            'Run the newest release of the client and check that the trainer version line changes; settings from another card do not carry over.',
            'Ask: the driver version (nvidia-smi header) and the client and worker version now in use.',
          ],
        }
      }
      return { means: parts.filter(Boolean).join(' '), title: loop ? 'The worker is in a restart loop' : undefined, fix }
    },
    drops: ['epoch-idle', 'cold-start', 'closes-at-start'],
  },
  {
    id: 'miner-exits',
    severity: 'fault',
    title: 'The miner shuts down',
    means: 'The log ends with the miner exiting, shutting down or being terminated: the lines before it are history, not a working state. The cause is in the lines just before the exit.',
    fix: ['Read the lines just before the exit line, and paste 20 of them with the version line the miner prints at start.', 'Update the client to the current version from the setup page if the version line is old.', 'Do not wrap it in a restart loop before the cause is known.'],
    test: EXITING,
    logOnly: true,
    skipLine: /xmr|exit signal/i,
  },
  {
    id: 'stuck-loop',
    severity: 'check',
    title: 'The client repeats one step and never starts mining',
    means: 'The same line repeats with no trainer start and no it/s line after it: the client is stuck at that step, not idle by design. What the step does is not documented for every client; Likely: a stale local file or a failed download.',
    fix: [
      'Stop the client, make sure no old worker process is left (Task Manager, or ps aux | grep -i qli), update the client to the current version from the setup page, and start it again.',
      "On the qubic.li client, its README documents a Reset Configuration: stop it, remove the lock files, start again (that client's procedure).",
      'Tell me whether the loop ever ends, and paste the lines right before the first repeat after a fresh start.',
    ],
    test: PARSED,
  },
  {
    id: 'error-line',
    severity: 'check',
    title: 'An error line I have no rule for',
    means: 'The log has an error line that none of my rules explains, so I do not call it fine. That line, or the lines just before it, is where the cause is.',
    fix: ['Send this log to Ask Maria: the AI reads that line with the rest of the log.', 'Paste the 20 lines before it, with the version line the miner prints at start.'],
    test: PARSED,
  },
  {
    id: 'xmr-msr',
    severity: 'check',
    title: 'The XMR idle worker could not apply its MSR tweak',
    means: '"cannot set MSR ... FAILED TO APPLY MSR MOD, HASHRATE WILL BE LOW" comes from qli-worker-XMR, the QLI client\'s built-in XMRig worker that runs during Qubic idle phases. It lowers the XMR hashrate only; it is not why Qubic shares are 0.',
    fix: [
      'Nothing needed for Qubic. Linux, if you want the XMR tweak: sudo modprobe msr and huge pages, which needs root.',
      'Trade-off: the QLI README advises running the client with the least privileges (not as Administrator, not as root), because it downloads runners.',
      'Judge Qubic once tasks resume after the idle phase.',
    ],
    test: /failed to apply msr mod|cannot set msr|msr kernel module is not available|msr[^\n]{0,20}(?:not available|failed)/i,
    sources: ['community'],
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
    id: 'seed-update',
    severity: 'check',
    title: 'The client could not update the mining seed or public key',
    means: '"WARNING: Cannot update mining seed and publickey": the client did not get the epoch\'s mining seed or could not set your public key. qubic-li/client #127 (Jul 2025) had no reply: no confirmed cause. The "Mining Seed" line is the epoch seed, not a wallet seed.',
    fix: [
      'Watch the lines after the warning: if it/s and shares appear, it recovered.',
      'Restart the client once and check it is the current release.',
      'Check the address field holds your 60-letter public address and the token is set (never paste the token anywhere).',
    ],
    test: /cannot update (?:the )?(?:mining )?seed(?: and public ?key)?/i,
    open: true,
    sources: ['community'],
  },
  {
    id: 'duplicate-worker',
    prose: true,
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
    read: (m, log) => {
      const v = (m[1] ?? m[2] ?? '').trim()
      if (REDACTED.test(v) || v.startsWith('QC.') || /%[A-Z_]+%/.test(v) || FOREIGN.test(log) || INJECTION.test(v)) return null
      return { means: `This worker name does not start with QC. On Qubic Church Pool every worker name starts with QC. (for example QC.5070ti-a) and is unique per machine. If this config is for another pool, that pool's own naming applies.` }
    },
  },
  {
    id: 'phone-miner',
    prose: true,
    severity: 'check',
    title: 'A phone miner (another pool\'s app)',
    means: 'Qubic Church Pool has no Android option. Phone miners come from another pool\'s app (an Android beta since 22 Aug 2026), and in Oct 2026 phones there were erratic: days at 0 and most shares invalid in some epochs, which that pool called a backend issue (21 Oct). Not measured by us.',
    fix: ['For that app, ask the pool that runs it.', 'For this pool, mine on a PC or a server: Linux, macOS, Windows or HiveOS from the setup page.'],
    test: /\b(?:mobile|phone|android|apk|cellphone)\b[^\n]{0,60}\b(?:stopped|not working|doesn.t work|don.t work|zero|0|invalid|shut down|failed|no (?:shares|solutions))|\b(?:stopped|zero|invalid|failed)\b[^\n]{0,40}\b(?:mobile|phone|android) (?:mining|miner|app)|^\s*(?:v?\d+(?:\.\d+)+\s+)?apk\s*$|\b(?:android|apk)\b[^\n]{0,40}\b(?:installer|version|shows?|still)\b/i,
    read: (_m, log) =>
      RATE_FALLS_ZERO.test(log) || /no shares/i.test(log)
        ? { means: "Qubic Church Pool has no Android option. This is another pool's phone app (an Android beta since 22 Aug 2026); a rate that falls to 0 after a few minutes with no shares matches what its users reported in Oct 2026, with days at 0 and most shares invalid in some epochs (that pool called it a backend issue, 21 Oct). Not measured by us; for that app, ask the pool that runs it." }
        : undefined,
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
    prose: true,
    severity: 'check',
    tier: 3,
    title: 'This config points to another pool',
    means: 'The pool address is another pool\'s endpoint, not Qubic Church Pool. Its status, share rules and support are that pool\'s.',
    fix: ['For problems with that pool, check its status channel.', 'To mine on Qubic Church Pool, use the command from its setup page.'],
    test: FOREIGN,
  },
  {
    id: 'sleep',
    prose: true,
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
    prose: true,
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
    drops: ['connection', 'zero-hashrate', 'rate-falls'],
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
    drops: ['zero-hashrate', 'zero-shares-long', 'no-shares', 'rate-falls'],
    sources: ['community', 'qli-team'],
  },
  {
    id: 'pool-frozen',
    prose: true,
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
    prose: true,
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
    prose: true,
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
    prose: true,
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
    prose: true,
    severity: 'check',
    tier: 2,
    title: 'No shares yet',
    means: 'In the first 20 minutes 0 is normal. After an algorithm change both 0 and very many shares are normal while it settles: QLI said at least 3 days (29 Sep 2026), and Ant Colony "takes longer, you have to find a good branch" (27 Aug 2026). An old client shows it/s for work that no longer counts.',
    fix: ['Check the miner prints the current version; if not, download it from the setup page.', 'Run at least 20 minutes, then check the pool status channel.', 'Judge by the wallet total after the epoch, not the first day.'],
    test: ZERO_SOLS,
    unless: log => zeroSolsHours(log) >= 2 || /\b0 walks served\b/i.test(log) || SEES_SHARES.test(log) || RATE_FALLS_ZERO.test(log),
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
    id: 'xmr-idle',
    severity: 'fine',
    tier: 3,
    title: 'The XMR lines are the QLI idle worker',
    means: 'qli-worker-XMR is the QLI client\'s built-in XMRig worker: it mines Monero while Qubic is idle. Its lines ([XMR] Trainer, XMRig/6.x, msr, HUGE PAGES, READY threads n/n, the ryzen_19h preset) are XMRig\'s, with their own thread setting; they are not the Qubic trainer. QLI\'s xmrSettings block controls it ("disable": true worked where "disabled" did not, qubic-li/client #118, Apr 2025).',
    fix: ['Judge Qubic by its own trainer lines (E:..., it/s, SHARES) once tasks resume.', 'To check idle settings: the xmrSettings / idling blocks of that client\'s config.'],
    test: /qli-worker-XMR|\[XMR\]|XMRig\/\d|READY threads \d+\/\d+|ryzen_19h/i,
    read: (_m, log) =>
      /\[(?:GPU|CPU)\] Trainer: Received exit (?:signal|command)|GPU#?\d* finished/i.test(log)
        ? {
            severity: 'check',
            tier: 1,
            title: 'Qubic paused for the idle phase; check that it resumes',
            means: 'When Qubic went idle the GPU/CPU trainer received its exit signal and the XMR idle worker (qli-worker-XMR, the QLI client\'s built-in XMRig) started: that switch is by design. The problem to watch is Qubic mining not resuming when tasks come back. qubic-li/client #122 (May 2025, client 3.3.7.1) reported exactly that, with no reply: no confirmed fix.',
          }
        : undefined,
    drops: ['zero-hashrate'],
    sources: ['community'],
  },
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
/** Rules whose match explains an error-like line (the broad readings such as "mining" and "rejected" do not). */
const EXPLAINS = RULES.filter(r => r.test !== PARSED && !['mining', 'rejected', 'too-early', 'no-shares', 'bursts', 'dashboard-lag', 'closes-at-start'].includes(r.id)).map(r => ({ id: r.id, test: new RegExp(r.test.source, r.test.flags.replace('g', '')) }))
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

/** Keys at the top level of the first JSON object in a paste, with their line numbers (strings skipped). */
export function rootKeys(log: string): { key: string; n: number }[] {
  const start = log.indexOf('{')
  if (start < 0) return []
  const out: { key: string; n: number }[] = []
  let depth = 0
  for (let i = start; i < log.length; i++) {
    const c = log[i]!
    if (c === '"') {
      let j = i + 1
      while (j < log.length && log[j] !== '"' && log[j] !== '\n') j += log[j] === '\\' ? 2 : 1
      if (depth === 1 && /^\s*:/.test(log.slice(j + 1, j + 8))) out.push({ key: log.slice(i + 1, j), n: log.slice(0, i).split('\n').length - 1 })
      i = j
    } else if (c === '{' || c === '[') depth++
    else if (c === '}' || c === ']') {
      depth--
      if (depth === 0) break
    }
  }
  return out
}
const TRAINER_KEYS = /^(?:trainer|cpuThreads|cpuVersion|gpuVersion|cpu|gpu|gpuCards|cpuAffinity)$/i

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

  // A QLI config with the trainer block outside ClientSettings: the client ignores it
  const keys = rootKeys(log)
  const misplaced = keys.find(k => TRAINER_KEYS.test(k.key))
  if (misplaced && keys.some(k => /^clientsettings$/i.test(k.key))) {
    const set = /"cpuThreads"\s*:\s*(\d+)/i.exec(log)?.[1]
    const shown = /setting cpu threads to:?\s*(\d+)/i.exec(log)?.[1]
    out.push(
      finding('config-nesting', misplaced.n, lines[misplaced.n], {
        means: `"${misplaced.key}" sits at the JSON root, next to "ClientSettings" instead of inside it. In the QLI client's appsettings.json the trainer block belongs inside "ClientSettings" (QLI README samples, read 5 Nov 2026), so this block is likely ignored and the client uses its defaults${set && shown && set !== shown ? `: you set ${set} threads and it printed ${shown}, which fits a default of all threads minus one` : ''}.`,
      }),
    )
  }

  // lscpu or /proc/cpuinfo flags without avx2, next to a log that picked the AVX2 build: it cannot run there
  const flagsAt = lines.findIndex(l => /^\s*flags\s*:\s+\w/i.test(l))
  if (flagsAt >= 0) {
    const flags = new Set(lines[flagsAt]!.replace(/^\s*flags\s*:/i, '').trim().toLowerCase().split(/\s+/))
    const pickedAt = lines.findIndex(l => /version:\s*AVX2\b|qli-worker-AVX2|\[AVX2\]|\bAVX2\b[^\n]{0,30}\b(?:trainer|worker|runner|build)\b|"cpuVersion"\s*:\s*"AVX2"/i.test(l))
    if (!flags.has('avx2') && !flags.has('avx512f') && pickedAt >= 0) {
      const loop = restarts(lines) >= 2 || LOOP_WORDS.test(log) || /restarts? every/i.test(log)
      out.push(
        finding('no-avx', pickedAt, lines[pickedAt], {
          title: 'The CPU has no AVX2, but the AVX2 build was picked',
          means: `The CPU flags list ${flags.has('avx') ? 'avx but not avx2 (an Intel Ivy Bridge class CPU or older, or a VM hiding the flag)' : 'no avx2 and no avx'}, yet the client picked its AVX2 trainer, which cannot run on this CPU${loop ? ': hence the restart every few seconds' : ''}. Not a setting you got wrong.`,
          fix: [
            'On the qubic.li client, force its generic trainer: "cpuVersion": "GENERIC" in its appsettings.json (that client\'s key; its README lists GENERIC for CPUs without AVX2 or AVX-512). Later QLI releases changed their AVX2 detection, so update that client too.',
            'For this pool: pick the backend on the setup page and run the command it gives; if no backend there runs without AVX2, this CPU cannot mine here.',
            'Expect low throughput from an AVX-only CPU even when a build runs.',
          ],
        }),
      )
    }
  }

  // The backend: AVX2 or GENERIC on an AVX-512 CPU, or AVX512 on a CPU without it
  const backend = backendIn(log)
  const avx = models.map(m => cpuIsa(m))

  // The same start line twice, or a start line and "stuck in a loop", with no exit line: a restart loop the client does not name
  const startAt = lines.findIndex(l => START_LINE.test(l) && !/xmr/i.test(l))
  if (startAt >= 0 && (restarts(lines) >= 2 || LOOP_WORDS.test(log)) && !lines.some(l => EXIT_LINE.test(l) && !/xmr/i.test(l))) {
    if (backend === 'AVX512' && WINDOWS.test(log)) {
      const big = models.find(m => cpuIsa(m) === 'avx512')
      const n = lines.findIndex(l => /\bAVX-?512\b/i.test(l) && LOG_LINE.test(l))
      out.push(
        finding('worker-exit', n >= 0 ? n : startAt, lines[n >= 0 ? n : startAt], {
          title: 'The AVX512 trainer restarts in a loop on Windows',
          means: `The client picked its AVX512 trainer on Windows, and it restarts in a loop at 0 it/s: that build does not run correctly on this machine.${big ? ` ${big.trim()} does have AVX-512, so the CPU is not the problem; the build is.` : ''} In Mar 2024 users reported the QLI AVX512 trainer working only on Linux, not Windows, and the QLI README says its CPU detection is sometimes wrong. Likely, not confirmed.`,
          fix: [
            'On that client, force the AVX2 build ("cpuVersion": "AVX2" in its appsettings.json: that client\'s key, not ours), or run Linux to use AVX512.',
            'Then give the forced build 20 minutes before judging.',
            'For this pool: choose the backend on the setup page (AVX2 or Auto) and run the command it gives.',
          ],
        }),
      )
    } else out.push(finding('worker-exit', startAt, lines[startAt], { title: 'The miner restarts in a loop', means: 'The same start line repeats: the miner or its worker restarts in a loop. The cause is in the lines just before each restart.' }))
  }

  // A silent exit at start on a box whose RAM is nearly full: the miner header prints "RAM: used MB / total MB"
  const ram = /\bRAM:\s*(\d+)\s*MB\s*\/\s*(\d+)\s*MB/i.exec(log)
  const exitAt = lines.findIndex(l => EXIT_LINE.test(l) && !/xmr/i.test(l))
  if (ram && exitAt >= 0) {
    const [used, total] = [Number(ram[1]), Number(ram[2])]
    const tight = used / total >= 0.85 || (total <= 16_500 && (threads ?? 0) >= 24)
    if (tight) {
      const n = lines.findIndex(l => /\bRAM:/i.test(l))
      out.push(
        finding('oom', n, lines[n], {
          title: `Likely out of memory: ${threads ? `${threads} threads on ` : ''}${Math.round(total / 1024)} GB`,
          means: `The miner starts, prints no error and exits; its header shows ${used} of ${total} MB of RAM in use${threads ? ` with ${threads} threads` : ''}. Memory need grows with the thread count, so a silent exit at start on a box with little free RAM is most likely the kernel stopping it for memory, not a core-count bug. Likely, not confirmed. A dated data point: in May 2024 a 16-core Ryzen with 16 GB ran that miner at up to 27 threads but not 32 (that era; the per-thread memory changed with the E235 task file and E236's 32 neurons).`,
          fix: [
            'Lower the thread count well below the maximum, then raise it step by step; or add RAM. 8 GB is not enough for CPU mining.',
            'Check while it starts: free -m, and sudo dmesg -T | grep -i -E "killed process|out of memory".',
            'For this pool: set Threads on the setup page below the maximum if RAM is tight.',
          ],
        }),
      )
    }
  }

  // A pasted JSON config that does not parse
  const bad = brokenJsonLine(lines)
  if (bad)
    out.push(
      finding('config-invalid', bad.n, lines[bad.n], {
        severity: 'check',
        title: 'The pasted config is not valid JSON',
        means: `The config is not valid JSON: at line ${bad.n + 1}, ${bad.why}. A client that cannot parse its config exits or falls back to its defaults.`,
        fix: ['Fix that line (one "key": value per line, double quotes, a comma between entries and none after the last).', 'Validate it: python3 -m json.tool appsettings.json'],
      }),
    )
  const zeroLine = lines.findIndex(l => (LOG_LINE.test(l) && ZERO_LOG.test(l)) || ZERO_PROSE.test(l))
  if (backend && (backend === 'AVX2' || backend === 'GENERIC') && avx.includes('avx512') && !/"?cpuVersion"?\s*:\s*"(?:AVX2|GENERIC)"/i.test(log)) {
    const n = lines.findIndex(l => new RegExp(`\\b${backend}\\b`, 'i').test(l))
    out.push(finding('backend-avx2', n, lines[n], { severity: zeroLine >= 0 ? 'fault' : 'check' }))
  }
  if (backend === 'AVX512' && avx.length && avx.every(a => a === 'avx2' || a === 'avx')) {
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

/** HTML or XML markup: a pasted table or page, not miner output. */
const MARKUP = /^\s*<[a-z!/]/i
/** Routine lines a healthy miner repeats (leases, backlog, keep-alives): never a stall. */
const ROUTINE_REPEAT = /backlog|lease|cancelled|ant work replaced|heartbeat|keep-?alive|\bping\b|xmr/i
/** The user says one line repeats ("prints this every second", "same line for minutes"). */
const SAME_LINE_WORDS = /\bsame line\b|\bevery (?:second|few seconds)\b|\bprints? (?:this|it) (?:every|over and over|forever)\b|\bstuck (?:on|at) (?:this|that) (?:line|step)\b/i

/**
 * A stall: one pasted step repeating with no progress (the same line, timestamps aside, three times or more, not a
 * waiting line, not a rate readout, not routine), or a repeat the user names next to a pasted line. Returns the first
 * repeated line, or -1.
 */
function stalledAt(lines: string[], pasted: boolean[], log: string): number {
  const seen = new Map<string, number[]>()
  lines.forEach((l, i) => {
    if (!pasted[i] || !l.trim() || WAITING.test(l) || ROUTINE_REPEAT.test(l) || READOUT_ANY.test(l) || START_LINE.test(l)) return
    const k = normalized(l)
    if (k.length < 8 || /^[\W\d]*$/.test(k)) return
    seen.set(k, [...(seen.get(k) ?? []), i])
  })
  const top = [...seen.values()].sort((a, b) => b.length - a.length)[0]
  if (top && top.length >= 3) return top[0]!
  if (top && top.length >= 2 && SAME_LINE_WORDS.test(log)) return top[0]!
  return -1
}

/** Run every rule over the log; each rule reports the latest line it matched. Mining is "fine" only if nothing is wrong. */
export function diagnose(log: string): Diagnosis {
  const lines = log.split(/\r?\n/)
  // The epoch seed a miner prints is not a wallet seed; any other line, prose included, can leak one.
  const seedWarning = containsSeed(lines.filter(l => !SEED_LOG_LINE.test(l)).join('\n'))
  if (!log.trim()) return { status: 'empty', findings: [], seedWarning }
  // Which lines are pasted output and which are the user's own sentences. With a log in the paste, rules read
  // only the pasted lines; safety rules (seeds, tokens, injected text) and described symptoms (prose rules) read all.
  const pasted = pastedLines(lines)
  const hasLog = pasted.some(Boolean)
  let findings: Finding[] = []
  for (const r of RULES) {
    if (r.test === PARSED) continue
    if (r.when && !test(r.when, log)) continue
    if (r.unless && test(r.unless, log)) continue
    const anyLine = !hasLog || r.prose || (r.tier ?? 1) === 0
    // Scan from the end: the latest occurrence is the one that matters.
    for (let i = lines.length - 1; i >= 0; i--) {
      const text = lines[i]!
      if (!anyLine && !pasted[i]) continue
      if (r.logOnly && (!LOG_LINE.test(text) || MARKUP.test(text))) continue
      if (r.skipLine?.test(text)) continue
      const m = new RegExp(r.test.source, r.test.flags.replace('g', '')).exec(text)
      if (!m) continue
      const reading = r.read ? r.read(m, log) : undefined
      if (reading === null) continue
      findings.push(finding(r.id, i, text, reading ? { means: reading.means, severity: reading.severity ?? r.severity, ...(reading.title ? { title: reading.title } : {}), ...(reading.tier !== undefined ? { tier: reading.tier } : {}), ...(reading.fix ? { fix: reading.fix } : {}) } : {}))
      break
    }
  }
  for (const f of parsed(log, lines)) if (!findings.some(x => x.id === f.id)) findings.push(f)
  const drop = new Set(findings.flatMap(f => rule(f.id).drops ?? []))
  findings = findings.filter(f => !drop.has(f.id))
  // Error lines no rule explains: never call that log "fine" or "mining".
  const unexplained = lines.findIndex((l, i) => (!hasLog || pasted[i]) && ERRORISH.test(l) && !SEED_LOG_LINE.test(l) && !EXPLAINS.some(r => r.test.test(l)))
  if (unexplained >= 0) {
    findings = findings.filter(f => !REASSURING.has(f.id))
    if (!findings.some(f => f.severity !== 'fine' && f.tier !== 3)) findings.push(finding('error-line', unexplained, lines[unexplained]))
  }
  // The miner going down ("flagged for shutdown", "exiting", "terminated"), a restart loop or one step repeating
  // with no progress: nothing before it is "mining" or "fine", and a stall always gets a finding of its own.
  const exiting = lines.some((l, i) => pasted[i] && EXITING.test(l) && !/xmr|exit signal/i.test(l))
  const stall = stalledAt(lines, pasted, log)
  if (exiting || stall >= 0) {
    findings = findings.filter(f => !REASSURING.has(f.id))
    if (stall >= 0 && !findings.some(f => f.severity !== 'fine' && f.tier !== 3)) findings.push(finding('stuck-loop', stall, lines[stall]))
  }
  // "Mining" next to a real fault or check is not reassurance; drop it so the problem leads.
  if (findings.some(f => f.severity === 'fault' || (f.severity === 'check' && f.tier !== 3 && f.id !== 'sols-counter'))) findings = findings.filter(f => f.id !== 'mining' && f.id !== 'gpu-ok')
  // Next to a fault, "do nothing, it resumes" readings (idle, cold start, too early) would contradict the fix.
  if (findings.some(f => f.severity === 'fault' && (f.tier ?? 1) !== 0)) findings = findings.filter(f => !REASSURING.has(f.id))
  // A finding quotes pasted lines only, never the user's own sentence (an injected line keeps its number).
  findings = findings.map(f => (f.line && !pasted[f.line.n - 1] && f.id !== 'not-a-log-line' ? (({ line: _drop, ...rest }) => rest)(f) : f))
  // Safety first; then faults, whatever their tier, outrank everything; then the root cause, generic symptoms, context.
  const rank = (f: Finding) => ((f.tier ?? 1) === 0 ? 0 : f.severity === 'fault' ? 1 : 2)
  findings.sort((a, b) => rank(a) - rank(b) || (a.tier ?? 1) - (b.tier ?? 1) || ORDER[a.severity] - ORDER[b.severity] || RULE_INDEX.get(a.id)! - RULE_INDEX.get(b.id)!)
  if (!findings.length) return { status: 'unknown', findings: [], seedWarning }
  // The verdict is the worst finding, so a fine line at the top never hides a fault below it.
  let status = findings.reduce<Severity>((w, f) => (ORDER[f.severity] < ORDER[w] ? f.severity : w), 'fine')
  // a paste whose only reading is that someone added orders to it is never "fine"
  if (findings.every(f => f.id === 'not-a-log-line')) status = 'check'
  return { status, findings, seedWarning }
}

/** Pasted output rather than a typed question: log-shaped lines, a single error line, or one miner line a rule reads. */
export function isLogPaste(text: string): boolean {
  if (looksLikeLog(text)) return true
  // two or more pasted lines (a call chain, a command and its output) that a rule reads as a problem
  if (pastedLines(text.split(/\r?\n/)).filter(Boolean).length >= 2 && diagnose(text).findings.some(f => f.severity !== 'fine')) return true
  if (text.split(/\r?\n/).some(l => (LOG_LINE.test(l) || /^\s*(?:[\w.-]+:\s|\$ |PS [A-Za-z]:|(?:error|fatal|panic|warning|unhandled exception)\b|-+>|[A-Z][\w.]+Exception\b|kernel:|bash:)/i.test(l)) && ERRORISH.test(l))) return true
  // one miner line a rule reads ("AntColony: parent not found ... server cache miss")
  if (diagnose(text).findings.some(f => f.line && LOG_LINE.test(f.line.text))) return true
  // an error message the user quoted in a sentence, or pasted after a path ("/lib/...: version `GLIBC_2.33' not found"),
  // that a specific rule reads; a typed question without one stays a question
  const quoted = [...text.matchAll(/"([^"\n]{12,})"|“([^”\n]{12,})”|`([^`\n]{12,})`/g)].map(m => m[1] ?? m[2] ?? m[3]!)
  const pathLines = text.split(/\r?\n/).filter(l => /^\s*(?:\.{0,2}\/[\w./+-]+|[A-Za-z]:\\[^\s:]+)\S*:\s/.test(l))
  const pasted = [...quoted, ...pathLines].join('\n')
  return !!pasted && diagnose(pasted).findings.some(f => f.id !== 'error-line' && f.severity !== 'fine')
}

/**
 * The checker's reading of a paste, as hint lines for the AI (Maria reads the log herself and verifies them).
 * Secrets are masked in every quoted line; at most four findings, the most important first.
 */
export function checkerHints(text: string, max = 4): string {
  const d = diagnose(text)
  const lines = d.findings.slice(0, max).map(f => {
    // an injected line is named by its number only: its text never moves into the system block
    const line = f.line ? (f.id === 'not-a-log-line' ? ` (line ${f.line.n})` : ` (line ${f.line.n}: "${f.line.text.slice(0, 160)}")`) : " (from the user's own words, not a log line)"
    // the card's "no rule" wording speaks to the user; the hint says what the AI should do with that line
    if (f.id === 'error-line') return `  - [check] An error line no pattern explains${line}: read it and the lines just before it; the cause is there.`
    return `  - [${f.severity}] ${f.title}${line}: ${f.means} First step: ${f.fix[0] ?? ''}`
  })
  if (d.seedWarning && !d.findings.some(f => f.id === 'wallet-seed')) lines.unshift('  - [fault] The paste may contain a wallet seed: warn first, never repeat it, and tell them to move the funds to a new wallet now.')
  return lines.length ? lines.join('\n') : '  - No pattern matched: read the log yourself.'
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
