/**
 * Maria's system prompt, assembled at request time from the private brain (brain-schema.ts: the prompt text,
 * playbook, rules, FAQ and facts, kept in daviduis777-oss/maria-aigarth-botv3) and the public config and rule
 * tables the deterministic tools use. Change a fact in config.ts / doctor.ts and both layers change together;
 * change the coaching in the brain file. This file holds only the assembly code, no brain text.
 */
import { aggregate, measuredBlock, type Summary } from './aggregate.ts'
import { BLOCK_IDS, type BlockId, type Brain, type Fact, type FaqEntry, fill, lazyVars, validateBrain, type Vars } from './brain-schema.ts'
import { keepPercent, OS_LABEL, POOL, RENTALS, WALLET } from './config.ts'
import { checkerHints, isLogPaste, LOG_LINE, pastedLines, RULES } from './doctor.ts'
import { EPOCH_SOURCE, nowLine, epochAt } from './epoch.ts'
import { BUILDS, SOURCES, type SourceId } from './knowledge.ts'
import { FIELD_SAMPLES } from './measure.ts'
import { KNOWLEDGE_AS_OF, MINER_COMMAND, ONLY_OFFICIAL, PROCEDURES, procedureText, runScript, TIPS } from './practice.ts'
import { hadSeed } from './redact.ts'

/** The field runs alone, for callers without a store (tests, the Discord card). */
const fieldSummary = () => aggregate(FIELD_SAMPLES, epochAt().epoch, 0)

/** Public values the brain's templates may use. */
function publicVars(brain: Brain): Record<string, string> {
  return {
    'POOL.name': POOL.name,
    // Maria names the setup page by where it opens in the app, never by its address (config.ts, setupRef)
    'POOL.onboardingUrl': POOL.setupRef,
    'POOL.workerPrefix': POOL.workerPrefix,
    'POOL.workerMaxLength': String(POOL.workerMaxLength),
    'POOL.partner.name': POOL.partner.name,
    'POOL.partner.confirmedBy': POOL.partner.confirmedBy,
    'POOL.payout.timing': POOL.payout.timing,
    'POOL.payout.currency': POOL.payout.currency,
    'POOL.payout.epoch': POOL.payout.epoch,
    'POOL.payout.lands': POOL.payout.lands,
    'POOL.feePercent': String(POOL.feePercent),
    keepPercent: String(keepPercent),
    onboardingFields: POOL.onboardingFields.join(', '),
    osOptions: POOL.osOptions.map(o => OS_LABEL[o]).join(', '),
    backends: POOL.backends.join(', '),
    'WALLET.seed.rule': WALLET.seed.rule,
    'WALLET.address.rule': WALLET.address.rule,
    MINER_COMMAND,
    KNOWLEDGE_AS_OF,
    PREDATES: brain.predates,
  }
}

/** The hard rules with the public values filled in (the prompt and the Discord card). */
export const hardRules = (brain: Brain): string[] => brain.hardRules.map(r => fill(r, publicVars(brain)))

/** The FAQ entries with their full answers: the must facts, then the extra. */
export const faqEntries = (brain: Brain): FaqEntry[] => brain.faq.entries.map(e => ({ ...e, a: [...e.must, ...(e.more ? [e.more] : [])].join(' ') }))

export const facts = (brain: Brain): Fact[] => brain.facts

/** The first sentence of a fix line: the triage list is a pointer, the checker hints carry the rest. */
const firstSentence = (t: string) => t.match(/^.{25,}?\.(?=\s|$)/)?.[0] ?? t
const twoSentences = (t: string) => t.match(/^(?:.*?[.!?](?=\s|$)){1,2}/)?.[0] ?? t

/** Every var a prompt template can use: public values, lists computed from the brain and public tables, and the blocks. */
function promptVars(brain: Brain, measured?: Summary | null): Vars {
  const pub = publicVars(brain)
  const tag = (id: SourceId) => brain.sourceTags[id]
  const tags = (ids: SourceId[]) => [...new Set(ids)].map(tag).join(', ')
  const factInFaq = new RegExp(brain.select.factInFaq)
  const skip = new Set(Object.values(brain.select.triageSkip).flat())
  const twoFixes = new Set(brain.select.twoFixes)
  const tipDuplicates = new Set(brain.select.tipDuplicates)
  const vars: Vars = lazyVars({
    ...pub,
    hardRules: () => hardRules(brain).map(r => `- ${r}`).join('\n'),
    sourceLines: () => [...new Set([...brain.facts, ...brain.faq.entries].flatMap(x => x.sources))].map(id => `- ${tag(id)} = ${SOURCES[id].label} (${SOURCES[id].date})`).join('\n'),
    faqLines: () =>
      Object.keys(brain.faq.themes)
        .flatMap(t => {
          const es = brain.faq.entries.filter(e => e.theme === t)
          const line = (e: (typeof es)[number]) => {
            const see = brain.select.faqSee[e.id]
            return see ? `- "${e.q}" See ${see}.` : `- "${e.q}" [${e.asOf}] ${e.must.map((m, i) => `(${i + 1}) ${m}`).join(' ')}${e.more ? ` Also: ${e.more}` : ''}`
          }
          return es.length ? [`# ${brain.faq.themes[t]}`, ...es.map(line)] : []
        })
        .join('\n'),
    stalenessFact: () => brain.facts.find(f => f.topic === 'Staleness')?.text ?? '',
    ecosystemLines: () => brain.ecosystem.map(f => `- [${f.topic}] ${f.text} (${f.source})`).join('\n'),
    openCasesDoctor: () =>
      RULES.filter(r => r.open)
        .map(r => `- ${r.title}: ${twoSentences(r.means)}`)
        .join('\n'),
    hardwareFacts: () =>
      brain.facts
        .filter(f => f.topic !== 'Staleness' && !factInFaq.test(f.text))
        .map(f => `- [${f.topic}] ${f.text} [${tags(f.sources)}]`)
        .join('\n'),
    builds: () =>
      Object.values(BUILDS)
        .map(b => `${b.title} (${b.specs.map(([k, v]) => `${k} ${v}`).join(', ')})`)
        .join('; '),
    rentals: () => RENTALS.map(r => r.name).join(', '),
    launch: () => (POOL.launchLine ? Object.entries(POOL.launchLine).map(([os, l]) => `${os}: ${l}`).join('\n') : fill(brain.wording.launchNone, pub)),
    statsUrl: () => POOL.statsUrl ?? fill(brain.wording.statsNone, pub),
    procedures: () => fill(brain.procedures, pub),
    tips: () =>
      TIPS.filter(x => !tipDuplicates.has(x.title))
        .map(x => `- ${x.title}: ${x.text}${x.general ? ' (general, not Qubic-measured)' : ''}`)
        .join('\n'),
    measured: () => measuredBlock(measured ?? fieldSummary()),
    // error classes only: the brain's skip lists name the rules a block, the FAQ or general knowledge already covers
    triage: () =>
      RULES.filter(r => !r.open && (r.tier ?? 1) === 1 && r.severity !== 'fine' && !skip.has(r.id))
        .map(r => `- ${r.title}: ${r.fix.slice(0, twoFixes.has(r.id) ? 2 : 1).map(firstSentence).join(' ')}`)
        .join('\n'),
  })
  for (const id of BLOCK_IDS) vars[id] = lazyVars({ [id]: () => fill(brain.blocks[id], vars) })[id]!
  return vars
}

/** One named block of the prompt, filled (tests, the Discord card). */
export const promptBlock = (brain: Brain, id: BlockId): string => fill(brain.blocks[id], promptVars(brain))

/** The procedures as the prompt renders them from practice.ts: the source of the brain's PROCEDURES section. */
export function renderPromptProcedures(): string {
  const indent = (t: string) => t.split('\n').map(l => `    ${l}`).join('\n')
  const homeScript = indent(runScript('~/qubic-miner'))
  const rentScript = indent(runScript('/root/qubic-miner'))
  let seenHome = false
  return Object.values(PROCEDURES)
    .map(p => {
      let t = procedureText(p, { brief: true }).split(ONLY_OFFICIAL).join('Official setup-page miner only.')
      if (t.includes(homeScript)) {
        if (seenHome) t = t.split(homeScript).join("    (the run.sh block from 'Save the start command on Linux')")
        seenHome = true
      }
      t = t.split(rentScript).join("    (the run.sh block from 'Save the start command on Linux', folder /root/qubic-miner)")
      return `## ${t}`
    })
    .join('\n\n')
}

/**
 * Everything that does not change per request, so the API can cache it. `measured` is the per-epoch
 * snapshot from store.ts (finished epochs only), so this block changes once a week at most.
 * Without it the MEASURED section still lists our own field runs.
 */
export function mariaSystemStatic(brain: Brain, measured?: Summary | null): string {
  return fill(brain.prompt, promptVars(brain, measured))
}

/** The live part: the epoch now and the time to its end. Sent as its own block after the cached one. */
export function mariaNowBlock(now: Date = new Date()): string {
  return `NOW (computed by code at request time; use it for "when does the epoch end" questions)
- ${nowLine(now)} [epoch rule: ${EPOCH_SOURCE.label}, ${EPOCH_SOURCE.date}]`
}

/** Full prompt as one string (tests, the Discord card). The API sends static + now as two blocks. */
export function mariaSystemPrompt(brain: Brain, now: Date = new Date(), measured?: Summary | null): string {
  return `${mariaSystemStatic(brain, measured)}\n\n${mariaNowBlock(now)}`
}

/**
 * A parsed brain file, checked: the shape (validateBrain), then one full assembly so a template that names an
 * unknown placeholder fails here, at load time, and never reaches the AI. Throws on any problem.
 */
export function checkedBrain(raw: unknown): Brain {
  const brain = validateBrain(raw)
  mariaSystemStatic(brain)
  for (const id of BLOCK_IDS) promptBlock(brain, id)
  mariaRequestBlock(brain, [{ role: 'user', content: 'Hola, mi minero no arranca, ¿qué hago?' }], '')
  requestBlock(brain, 'x', 'y')
  return brain
}

/**
 * Numbers from our E229/E233 runs need a caveat about the E235/E236 changes. The answer streams, so the API route
 * appends one short caveat line at the end when an answer cites that era (by epoch, by "our runs", or by a date
 * from 2 Sep to 7 Oct 2026) and says nothing about E235/E236 itself. Any mention of 235 or 236 counts as the
 * caveat, so answers in other languages are not caveated twice. The caveat wording is in the brain (notes).
 */
export const STALE_ERA =
  /(?<![\d,.])(?:E\s?)?(?:229|233)(?![\d,.]?\d)|\bour (?:runs?|rigs?|record(?: rig)?|fleet|measurements?|field runs?)\b|\b(?:[2-9]|30) Sep(?:t(?:ember)?)?(?: 2026)?\b|\b[1-7] Oct(?:ober)? 2026\b/i
const CAVEATED = /predates|(?<!\d)23[56](?!\d)/i

/* ---------- the user's language, decided by code for every request ---------- */

export const LANGUAGE_NAME: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese',
  de: 'German',
  fr: 'French',
  it: 'Italian',
  tr: 'Turkish',
  ru: 'Russian',
  uk: 'Ukrainian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  he: 'Hebrew',
  hi: 'Hindi',
  th: 'Thai',
  el: 'Greek',
}

/** Injected text that gives an AI orders, never the user's own prose. */
const INJECTED = /\b(?:ignore|disregard|forget)\b[^\n]{0,40}\b(?:instructions?|prompts?|rules)\b|\bsystem prompt\b|\byou are now\b|\bassistant[- ]directive\b|^\s*(?:#{2,}\s*)?(?:system|assistant)\s*:|\bmaintenance mode\b/i
/** "Model name:     AMD ...", "Thread(s) per core: 2", "CPU : Xeon": a label of up to four words and its value. */
const KEY_VALUE = /^\s*[\p{L}][\p{L}\p{N} ()/._-]{0,30}?\s*:\s+(?=\S)/u

/** Words of a line, letters only, for matching prose against the log it quotes. */
const wordsOf = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []

/**
 * The user's own words, line by line: a paste minus every log line, config or JSON line, code block, shell prompt
 * and what it printed, stack frame, OS or program message in any language ("Для продолжения нажмите любую клавишу",
 * "系统找不到指定的文件"), quoted or injected line, URL, path, version and ID, so a Spanish sentence under an English
 * log still reads as Spanish and an English question never turns Russian because of a Windows "pause" line.
 * A log line keeps only a question typed after it ("[CUDA] 38 it/s     is it normal?"); a "Label: value" line
 * keeps its value; and words the user copied out of the log ("помогите not find any flag to support") are dropped.
 * `at` is the line number; `lead` marks prose before the first pasted line.
 */
function proseLines(text: string): { at: number; text: string; lead: boolean }[] {
  const lines = text.split(/\r?\n/)
  const pasted = pastedLines(lines, false)
  const firstPasted = pasted.findIndex(Boolean)
  const prose: { at: number; text: string }[] = []
  const logs: string[] = []
  lines.forEach((raw, at) => {
    if (/^\s*```/.test(raw)) return
    if (INJECTED.test(raw) || /^\s*>/.test(raw)) return
    if (pasted[at]) {
      const tail = /\?\s*$/.test(raw) ? (raw.split(/\s{3,}|\|/).at(-1) ?? '') : ''
      const typed = tail && !LOG_LINE.test(tail) && !/^\s*```/.test(raw) ? tail : ''
      logs.push(typed ? raw.slice(0, raw.lastIndexOf(typed)) : raw)
      if (typed) prose.push({ at, text: typed })
      return
    }
    if (/^\s*(?:[A-Za-z]:\\|\$ |# |\||-{3,}|[\w.-]+@[\w.-]+[:$#])/.test(raw)) {
      logs.push(raw)
      return
    }
    prose.push({ at, text: raw.replace(KEY_VALUE, ' ') })
  })
  const logText = ` ${logs.map(l => wordsOf(l).join(' ')).join(' ')} `
  const out: { at: number; text: string; lead: boolean }[] = []
  for (const { at, text: line } of prose) {
    const cleaned = line
      .replace(/`[^`]*`|https?:\/\/\S+|\bwww\.\S+|[\w.-]*[\\/][\w.\\/-]+|"[^"\n]*"|“[^”\n]*”|«[^»\n]*»|„[^“”\n]*[“”]|(?<!\p{L})'[^'\n]*'(?!\p{L})/gu, ' ')
      .replace(/\b[\w.-]*\d[\w.-]*\b|\b[A-Z]{20,}\b/g, ' ')
    // drop runs of three or more words that also appear in the pasted log: the user quoting the error
    const tokens = cleaned.split(/\s+/).filter(Boolean)
    const plain = tokens.map(t => wordsOf(t).join(' '))
    const drop = new Set<number>()
    for (let i = 0; i + 2 < tokens.length; i++) {
      if (!plain[i] || !plain[i + 1] || !plain[i + 2]) continue
      if (logText.includes(` ${plain[i]} ${plain[i + 1]} ${plain[i + 2]} `)) [i, i + 1, i + 2].forEach(k => drop.add(k))
    }
    const kept = tokens.filter((_, i) => !drop.has(i)).join(' ')
    if (/\p{L}{2,}/u.test(kept)) out.push({ at, text: kept, lead: firstPasted < 0 || at < firstPasted })
  }
  return out
}

const joinProse = (xs: { text: string }[]) => xs.map(x => x.text).join('\n').replace(/\s+/g, ' ').trim()

/** The user's own words in a paste (see proseLines). */
export const userProse = (text: string): string => joinProse(proseLines(text))

/** The user's words before the first pasted log, code or config line: the primary language signal. */
export const leadProse = (text: string): string => joinProse(proseLines(text).filter(x => x.lead))

/** Words in a piece of prose; Chinese, Japanese and Korean count about two characters per word. */
export const proseWords = (prose: string) => (prose.match(/[\p{L}'][\p{L}'-]*/gu) ?? []).filter(w => !/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(w)).length + Math.floor((prose.match(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g) ?? []).length / 2)

/**
 * Frequent short words per language; "en" competes, so a stray "con" in an English question stays English.
 * Words two languages share (que, como, para) sit in both lists and cancel out; words that are also English or
 * technical ("per core", "come", "con") are left out of the other lists.
 */
const STOP: Record<string, string[]> = {
  en: ['the', 'is', 'and', 'my', 'i', 'it', 'to', 'of', 'what', 'how', 'why', 'with', 'do', 'does', 'not', 'but', 'have', 'this', 'can', 'get', 'when', 'should', 'any', 'all', 'there', 'are', 'just', 'me', 'you', 'your', 'was', 'after', 'from', 'only', 'or', 'so', 'im', "i'm", "it's", 'has', 'been', 'use', 'using', 'which', 'on', 'for', 'be', 'will', 'then', 'still', 'please', 'help', 'thanks', 'hello', 'hi', 'than', 'same', 'other', 'working', 'run', 'running'],
  es: ['que', 'por', 'para', 'una', 'es', 'mi', 'todo', 'lo', 'hace', 'cómo', 'como', 'pero', 'tengo', 'está', 'puedo', 'qué', 'también', 'muy', 'hay', 'funciona', 'el', 'los', 'las', 'del', 'al', 'y', 'se', 'sí', 'cuando', 'porque', 'minar', 'eso', 'la', 'me', 'dice', 'hola', 'alguna', 'solución', 'sin', 'embargo', 'paso', 'inicio', 'minero', 'gracias', 'ayuda', 'versión', 'nueva', 'siempre', 'usar', 'puede', 'debo'],
  pt: ['não', 'é', 'com', 'uma', 'um', 'meu', 'minha', 'está', 'estou', 'você', 'tenho', 'posso', 'mas', 'também', 'isso', 'ele', 'faz', 'funciona', 'porque', 'quando', 'ou', 'os', 'do', 'da', 'no', 'na', 'ao', 'suporta', 'minerar', 'que', 'como', 'para', 'e', 'sempre', 'mais', 'nova', 'versão', 'época', 'atual', 'possível', 'encontrar', 'usar', 'obrigado', 'olá', 'ajuda', 'minerador', 'pode', 'devo', 'preciso'],
  de: ['ich', 'ist', 'nicht', 'und', 'mein', 'meine', 'der', 'die', 'das', 'mit', 'auf', 'wie', 'was', 'warum', 'funktioniert', 'habe', 'kann', 'bei', 'ein', 'eine', 'auch', 'schon', 'aber', 'zu', 'es', 'wird', 'sich', 'mir', 'läuft'],
  fr: ['je', 'est', 'pas', 'mon', 'ma', 'mes', 'avec', 'pour', 'une', 'le', 'les', 'comment', 'dans', 'mais', 'ça', 'il', 'ne', 'fonctionne', "j'ai", "c'est", 'sur', 'quoi', 'pourquoi', 'et', 'des', 'du', 'que', 'un', 'carte', 'la'],
  it: ['il', 'è', 'non', 'che', 'una', 'mio', 'mia', 'perché', 'sono', 'ho', 'posso', 'funziona', 'anche', 'questo', 'della', 'nel', 'gli', 'lo', 'ma', 'la', 'cosa', 'grazie', 'quando'],
  tr: ['ve', 'bir', 'bu', 'ne', 'neden', 'nasıl', 'için', 'ile', 'çalışmıyor', 'değil', 'var', 'yok', 'mi', 'mı', 'ben', 'benim', 'ama', 'çok', 'da', 'de', 'hata', 'madencilik', 'ekran'],
}
/** Letters and endings only one of these languages uses: a strong hint even in a short sentence. */
const MARKS: [string, RegExp][] = [
  ['es', /[ñ¿¡]|ción\b|ciones\b|\bustedes?\b/],
  ['pt', /[ãõ]|ções\b|ção\b|\bvocê\b|\bnão\b|lh[aeo]\b|nh[ao]s?\b/],
  ['de', /ß|\b\w*[äöü]\w*(?:en|t)\b/],
  ['tr', /[ğşı]/],
  ['fr', /[èêëœ]|\bç[a-z]/],
  ['it', /\b(?:è|perché|più)\b|zione\b|zioni\b/],
]

/** Fewer Latin words than this is too short to tell a language: the caller falls back, finally to English. */
const MIN_WORDS = 3

/** The prose before a log decides when it has at least this many words. */
const LEAD_MIN_WORDS = 3

/**
 * The language of the user's own words, or null when there are none or too few to tell (a log only, "ok", "?").
 * The sentences before the first log or code line decide when they have three words or more; otherwise all the
 * prose does, which never includes OS or program messages inside or after the log. A script other than Latin
 * decides first; Latin text goes by stopwords and marks, and anything ambiguous is English.
 */
export function detectLanguage(text: string): string | null {
  const lead = leadProse(text)
  if (lead && proseWords(lead) >= LEAD_MIN_WORDS) {
    const code = languageOf(lead)
    if (code) return code
  }
  return languageOf(userProse(text))
}

function languageOf(prose: string): string | null {
  if (!prose) return null
  const n = (re: RegExp) => (prose.match(re) ?? []).length
  const latin = n(/[A-Za-zÀ-ÖØ-öø-ÿĀ-ſ]/g)
  const share = (count: number, min = 4) => count >= min && count >= latin * 0.25
  if (n(/[぀-ヿ]/g) >= 2) return 'ja'
  if (n(/[가-힯ᄀ-ᇿ]/g) >= 2) return 'ko'
  const han = n(/[㐀-䶿一-鿿]/g)
  if (han >= 2 && han * 4 >= latin * 0.3) return 'zh'
  const cyr = n(/[Ѐ-ӿ]/g)
  if (share(cyr)) return /[іїєґ]/i.test(prose) ? 'uk' : 'ru'
  for (const [code, re] of [['ar', /[؀-ۿ]/g], ['he', /[֐-׿]/g], ['hi', /[ऀ-ॿ]/g], ['th', /[฀-๿]/g], ['el', /[Ͱ-Ͽ]/g]] as const) if (share(n(re), 2)) return code
  const lower = prose.toLowerCase()
  const words = lower.match(/[\p{L}']+/gu) ?? []
  if (words.length < MIN_WORDS) return null
  const score = (code: string) => words.filter(w => STOP[code]!.includes(w)).length + MARKS.filter(([c, re]) => c === code && re.test(lower)).length * 3
  const en = score('en')
  const ranked = Object.keys(STOP)
    .filter(c => c !== 'en')
    .map(c => [c, score(c)] as const)
    .sort((a, b) => b[1] - a[1])
  const [best, top] = ranked[0]!
  const second = ranked[1]?.[1] ?? 0
  return top >= 2 && top > en && top > second ? best : 'en'
}

/** The language code for a conversation: the latest user prose, else the earlier user prose, else English. */
export function conversationLanguage(messages: { role: string; content: string }[]): { code: string; from: 'latest' | 'earlier' | 'default' } {
  const users = messages.filter(x => x.role === 'user').reverse()
  for (const [i, m] of users.entries()) {
    const code = detectLanguage(m.content)
    if (code) return { code, from: i === 0 ? 'latest' : 'earlier' }
  }
  return { code: 'en', from: 'default' }
}

/** The per-request instruction: names the target language and says the log never decides it (wording: brain.request). */
export function languageLine(brain: Brain, messages: { role: string; content: string }[]): string {
  const { code, from } = conversationLanguage(messages)
  const name = LANGUAGE_NAME[code] ?? 'English'
  const r = brain.request
  const why = from === 'default' ? r.languageDefault : fill(r.languageFrom, { name, earlier: from === 'earlier' ? r.languageEarlier : '' })
  const other = r.notToConfuse[code]
  const not = other ? fill(r.languageNot, { name, other }) : ''
  return fill(r.language, { name, not, why })
}

/**
 * Sent after the cached prompt on every request: the language decided by code and, for a pasted log, private
 * hints from the pattern scan (doctor.ts). The hints are unverified: the AI checks each against the log, drops
 * what the log does not support, and never mentions the scan or the hints to the user.
 */
export function requestBlock(brain: Brain, language: string, hints?: string): string {
  return fill(brain.request.block, { language, hints: hints ? fill(brain.request.hints, { list: hints }) : '' })
}

/**
 * The REQUEST block for one API call. `messages` are the redacted turns the AI sees; `rawLast` is the user's last
 * message before redaction, only to know that a seed was removed (its value never goes anywhere).
 */
export function mariaRequestBlock(brain: Brain, messages: { role: string; content: string }[], rawLast = ''): string {
  const last = messages.filter(m => m.role === 'user').at(-1)?.content ?? ''
  // the browser redacts a seed before sending, so the mark it leaves counts as a seed too
  const seed = hadSeed(rawLast) || hadSeed(last) ? brain.request.seed : ''
  const hints = isLogPaste(last) ? [seed, checkerHints(last)].filter(Boolean).join('\n') : seed || undefined
  return requestBlock(brain, languageLine(brain, messages), hints)
}

/** The user's language for the caveat line: the same detector as the REQUEST block (prose only, never the log). */
export function noteLanguage(text: string, notes: Record<string, string> = { en: '' }): string {
  const code = detectLanguage(text)
  return code && code in notes ? code : 'en'
}

/** The caveat line to append after a streamed answer, or "" when none is needed (or the brain has no caveat). */
export function stalenessNote(brain: Brain, answer: string, userText = ''): string {
  if (!STALE_ERA.test(answer) || CAVEATED.test(answer)) return ''
  const note = brain.notes[noteLanguage(userText, brain.notes)] ?? brain.notes.en
  return note ? `\n\n${note}` : ''
}
