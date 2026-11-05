/**
 * The shape of Maria's brain: the prompt text, playbook, hard rules, FAQ, ecosystem facts and the other
 * coaching texts that make the AI coach good. The brain itself lives in the PRIVATE repo
 * (daviduis777-oss/maria-aigarth-botv3, branch pool-brain, file pool/brain.json); this public file only
 * holds its type, a validator, the template filler and a small generic fallback used when the brain cannot
 * be loaded. No brain text belongs here.
 *
 * Loaders: brain.ts (the site, server only, GitHub contents API with MARIA_BRAIN_TOKEN) and brain-local.ts
 * (scripts and tests: a local checkout via MARIA_BRAIN_DIR, or the same API).
 */
import { SOURCES, type SourceId } from './knowledge.ts'

/** Where the brain lives. Each can be overridden by env (MARIA_BRAIN_REPO, MARIA_BRAIN_REF). */
export const BRAIN_DEFAULTS = { repo: 'daviduis777-oss/maria-aigarth-botv3', ref: 'pool-brain', path: 'pool/brain.json' } as const

/** The GitHub contents API URL for the brain file (fetched with Accept: application/vnd.github.raw+json). */
export function brainApiUrl(repo: string = BRAIN_DEFAULTS.repo, ref: string = BRAIN_DEFAULTS.ref, path: string = BRAIN_DEFAULTS.path, api = 'https://api.github.com'): string {
  return `${api.replace(/\/$/, '')}/repos/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(ref)}`
}

/** A template: one string, or lines joined with "\n". Placeholders are {{name}}; see fill(). */
export type Text = string | string[]

export type Fact = { topic: string; text: string; sources: SourceId[] }
export type EcoFact = { topic: string; text: string; source: string }
export type FaqDraft = { id: string; theme: string; q: string; must: string[]; more?: string; sources: SourceId[]; asOf: string; cite?: string }
/** A FAQ entry with its full answer: the must facts, then the extra. */
export type FaqEntry = FaqDraft & { a: string }

/** The named prompt blocks; the prompt frame places them with {{checklist}}, {{playbook}}, ... */
export const BLOCK_IDS = ['checklist', 'playbook', 'money', 'machine', 'log', 'ecosystem', 'openCases', 'epochLog', 'faq', 'staleness', 'sources'] as const
export type BlockId = (typeof BLOCK_IDS)[number]

export type Brain = {
  /** version stamp of the brain file, e.g. "2026-11-05.1"; "fallback" for the public fallback */
  version: string
  /** said with every number from our own runs */
  predates: string
  /** the static system prompt frame */
  prompt: Text
  blocks: Record<BlockId, Text>
  /** hard rules; may use {{POOL.feePercent}}, {{keepPercent}}, {{MINER_COMMAND}} */
  hardRules: string[]
  /** hardware and field facts, with source tags */
  facts: Fact[]
  /** other clients and general systems, dated */
  ecosystem: EcoFact[]
  faq: { themes: Record<string, string>; entries: FaqDraft[] }
  /** the PROCEDURES section as the prompt gives it */
  procedures: Text
  /** short source tags used in the prompt */
  sourceTags: Partial<Record<SourceId, string>>
  /** which doctor rules, facts and tips the prompt leaves out because a block already carries them */
  select: {
    /** doctor rule ids the TRIAGE list skips, grouped by the reason */
    triageSkip: Record<string, string[]>
    /** doctor rule ids whose second fix step the TRIAGE line also gives */
    twoFixes: string[]
    /** a regular expression (source): facts it matches are left out of HARDWARE DETAILS */
    factInFaq: string
    /** FAQ ids answered in full by a block: the FAQ line points there */
    faqSee: Record<string, string>
    /** tip titles left out of EFFICIENCY TIPS */
    tipDuplicates: string[]
  }
  wording: { launchNone: string; statsNone: string }
  /** the per-request block: language line and private hints */
  request: {
    block: Text
    hints: Text
    seed: string
    language: string
    languageNot: string
    languageDefault: string
    languageFrom: string
    languageEarlier: string
    notToConfuse: Record<string, string>
  }
  /** the staleness caveat appended after an answer, by language code */
  notes: Record<string, string>
}

/* ---------------- templates ---------------- */

export type Vars = Record<string, string | (() => string)>
const PLACEHOLDER = /\{\{([\w.]+)\}\}/g
const WHOLE_LINE = /^\{\{([\w.]+)\}\}$/

/**
 * Fills {{name}} placeholders from `vars` (a value or a lazy getter). An unknown name throws, so a typo in
 * the brain never reaches the AI. A line that is only one placeholder whose value is empty is dropped.
 * Values are not scanned again.
 */
export function fill(t: Text, vars: Vars): string {
  const get = (k: string) => {
    if (!Object.hasOwn(vars, k)) throw new Error(`brain template: unknown placeholder {{${k}}}`)
    const v = vars[k]
    return typeof v === 'function' ? v() : v!
  }
  const lines = Array.isArray(t) ? t : t.split('\n')
  const out: string[] = []
  for (const line of lines) {
    const whole = line.match(WHOLE_LINE)
    if (whole && get(whole[1]!) === '') continue
    out.push(line.replace(PLACEHOLDER, (_, k: string) => get(k)))
  }
  return out.join('\n')
}

/** Lazy, memoized getters: a var is computed once, and only when a template uses it. */
export function lazyVars(defs: Record<string, string | (() => string)>): Vars {
  const out: Vars = {}
  for (const [k, v] of Object.entries(defs)) {
    if (typeof v !== 'function') {
      out[k] = v
      continue
    }
    let done = false
    let val = ''
    out[k] = () => {
      if (!done) {
        val = v()
        done = true
      }
      return val
    }
  }
  return out
}

/* ---------------- validation ---------------- */

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)
const isStr = (x: unknown): x is string => typeof x === 'string'
const isStrs = (x: unknown): x is string[] => Array.isArray(x) && x.every(isStr)
const isText = (x: unknown): x is Text => isStr(x) || isStrs(x)
const isStrRecord = (x: unknown): x is Record<string, string> => isObj(x) && Object.values(x).every(isStr)

/** Checks the shape of a parsed brain file and returns it typed; throws with the first problem found. */
export function validateBrain(x: unknown): Brain {
  const fail = (what: string): never => {
    throw new Error(`brain: ${what}`)
  }
  if (!isObj(x)) fail('not an object')
  const b = x as Record<string, unknown>
  if (!isStr(b.version) || !b.version) fail('version missing')
  if (!isStr(b.predates)) fail('predates missing')
  if (!isText(b.prompt)) fail('prompt is not text')
  if (!isObj(b.blocks)) fail('blocks missing')
  for (const id of BLOCK_IDS) if (!isText((b.blocks as Record<string, unknown>)[id])) fail(`blocks.${id} is not text`)
  if (!isStrs(b.hardRules) || !b.hardRules.length) fail('hardRules missing')
  const known = (id: unknown) => isStr(id) && Object.hasOwn(SOURCES, id)
  if (!Array.isArray(b.facts)) fail('facts missing')
  ;(b.facts as unknown[]).forEach((f, i) => {
    if (!isObj(f) || !isStr(f.topic) || !isStr(f.text) || !Array.isArray(f.sources) || !f.sources.every(known)) fail(`facts[${i}] is malformed or cites an unknown source`)
  })
  if (!Array.isArray(b.ecosystem)) fail('ecosystem missing')
  ;(b.ecosystem as unknown[]).forEach((f, i) => {
    if (!isObj(f) || !isStr(f.topic) || !isStr(f.text) || !isStr(f.source)) fail(`ecosystem[${i}] is malformed`)
  })
  if (!isObj(b.faq) || !isStrRecord(b.faq.themes) || !Array.isArray(b.faq.entries)) fail('faq missing')
  const faq = b.faq as { themes: Record<string, string>; entries: unknown[] }
  const ids = new Set<string>()
  faq.entries.forEach((e, i) => {
    if (!isObj(e) || !isStr(e.id) || !isStr(e.q) || !isStrs(e.must) || !isStr(e.asOf) || !Array.isArray(e.sources) || !e.sources.every(known)) fail(`faq.entries[${i}] is malformed or cites an unknown source`)
    const entry = e as Record<string, unknown>
    if (!isStr(entry.theme) || !Object.hasOwn(faq.themes, entry.theme)) fail(`faq.entries[${i}] has an unknown theme`)
    if (entry.more !== undefined && !isStr(entry.more)) fail(`faq.entries[${i}].more is not a string`)
    if (entry.cite !== undefined && !isStr(entry.cite)) fail(`faq.entries[${i}].cite is not a string`)
    if (ids.has(entry.id as string)) fail(`faq id ${entry.id} twice`)
    ids.add(entry.id as string)
  })
  if (!isText(b.procedures)) fail('procedures is not text')
  if (!isStrRecord(b.sourceTags) || !Object.keys(b.sourceTags).every(known)) fail('sourceTags malformed')
  const s = b.select
  if (!isObj(s)) fail('select missing')
  const sel = s as Record<string, unknown>
  if (!isObj(sel.triageSkip) || !Object.values(sel.triageSkip).every(isStrs)) fail('select.triageSkip malformed')
  if (!isStrs(sel.twoFixes) || !isStrs(sel.tipDuplicates) || !isStrRecord(sel.faqSee) || !isStr(sel.factInFaq)) fail('select malformed')
  try {
    new RegExp(sel.factInFaq as string)
  } catch {
    fail('select.factInFaq is not a regular expression')
  }
  if (!isObj(b.wording) || !isStr(b.wording.launchNone) || !isStr(b.wording.statsNone)) fail('wording malformed')
  const r = b.request
  if (!isObj(r) || !isText(r.block) || !isText(r.hints) || !isStr(r.seed) || !isStr(r.language) || !isStr(r.languageNot) || !isStr(r.languageDefault) || !isStr(r.languageFrom) || !isStr(r.languageEarlier) || !isStrRecord(r.notToConfuse)) fail('request malformed')
  if (!isStrRecord(b.notes)) fail('notes malformed')
  // every source the facts and the FAQ cite needs a short tag, or the prompt would print "undefined"
  const used = [...(b.facts as Fact[]), ...(faq.entries as FaqDraft[])].flatMap(f => f.sources)
  for (const id of used) if (!isStr((b.sourceTags as Record<string, unknown>)[id])) fail(`sourceTags.${id} missing`)
  return x as Brain
}

/* ---------------- the public fallback ---------------- */

/**
 * Used when the private brain cannot be loaded (no token, GitHub down, a malformed file): the hard safety
 * rules and a short generic coach instruction, so the AI still answers safely. Deliberately generic: none of
 * the brain's playbook, facts or FAQ.
 */
export const FALLBACK_BRAIN: Brain = {
  version: 'fallback',
  predates: 'is older than the latest algorithm changes',
  prompt: [
    'You are Maria, the mining helper of {{POOL.name}}. Answer mining questions and problems briefly and technically, in the first person.',
    '',
    'SAFETY RULES',
    '{{hardRules}}',
    '',
    'POOL FACTS',
    '- {{POOL.name}}, setup page {{POOL.onboardingUrl}}. It asks for {{onboardingFields}} and shows the exact start command.',
    '- Systems: {{osOptions}}. Backends: {{backends}}. Worker names begin with {{POOL.workerPrefix}}, one name per machine.',
    "- Payouts land in the user's own wallet, {{POOL.payout.timing}}, in {{POOL.payout.currency}}.",
    '',
    'WALLET',
    '- {{WALLET.seed.rule}}',
    '- {{WALLET.address.rule}}',
    '',
    'APPROACH',
    '- First read the pasted log or the description. Give the likely cause and how certain it is, then numbered fix steps with commands in code blocks, then ask for the one or two details that would settle it.',
    '- Generic operating system, driver, container and HiveOS advice is fine; mark it as a general tip.',
    '- When a Qubic or pool detail is not given here, say you do not have it and send the user to the setup page or to the in-app tools (Pick hardware, Connect my machine, Fix my rig).',
    '- Short answers, no greetings, no em dashes.',
  ],
  blocks: { checklist: '', playbook: '', money: '', machine: '', log: '', ecosystem: '', openCases: '', epochLog: '', faq: '', staleness: '', sources: '' },
  hardRules: [
    "Answer in the language of the user's own words; a pasted log does not set the language.",
    'Give no income, profit, payback or return estimates, and say nothing about coin prices or markets.',
    'Do not ask for or accept a wallet seed or an access token. If a seed appears, warn that it is compromised and that the funds belong in a new wallet right away. Mining needs only the public address.',
    'Do not make up commands, binary names, flags, settings, versions, driver numbers or links; the setup page provides the exact command.',
    'Point only to {{POOL.name}}: no other pools, third-party miners or tools passed around in chats.',
    'Numbers come with a date or a source, or are marked "est."; no invented measurements.',
  ],
  facts: [],
  ecosystem: [],
  faq: { themes: {}, entries: [] },
  procedures: '',
  sourceTags: {},
  select: { triageSkip: {}, twoFixes: [], factInFaq: '(?!)', faqSee: {}, tipDuplicates: [] },
  wording: { launchNone: 'see the setup page ({{POOL.onboardingUrl}})', statsNone: 'not available yet' },
  request: {
    block: 'REQUEST\n- Answer language: {{language}}{{hints}}',
    hints: '\n- Unchecked notes from an automatic scan of the pasted log, for you only (do not mention them; confirm each against the log yourself):\n{{list}}',
    seed: "  - [fault] A wallet seed was removed from the user's message: tell them it is compromised and to move the funds to a new wallet right away; do not ask for it.",
    language: "{{name}}, the language of the user's own words, even when a pasted log is in another language.",
    languageNot: '',
    languageDefault: '',
    languageFrom: '',
    languageEarlier: '',
    notToConfuse: {},
  },
  notes: {},
}
