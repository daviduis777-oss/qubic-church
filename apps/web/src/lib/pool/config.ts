/**
 * Qubic Church Pool: every pool fact in one place.
 * The page, the deterministic tools (picker, wizard, log doctor) and Maria's AI prompt all read from here,
 * so the two layers never disagree. No secrets in this file: it ships to the browser.
 *
 * Lines marked TODO(Bob) are placeholders until the partner confirms them.
 */

export type Os = 'linux' | 'macos' | 'windows' | 'hiveos'
export type Backend = 'Auto' | 'GPU' | 'AVX2' | 'AVX512'

export const OS_LABEL: Record<Os, string> = { linux: 'Linux', macos: 'macOS', windows: 'Windows', hiveos: 'HiveOS' }

export const POOL = {
  name: 'Qubic Church Pool',

  /**
   * Partner that operates the pool infrastructure. Shown once, in the partners line at the end of the page.
   * Maria names it only when asked who runs the pool (prompt.ts, THE POOL); the pool owner confirmed it.
   */
  partner: {
    name: 'CODED',
    confirmedBy: 'the pool owner',
    // TODO(Bob): final public site of the partner (the beta host is the only one we have confirmed).
    url: 'https://beta.codedonqubic.com',
  },

  /**
   * Where the user enters OS, wallet address, worker name, backend and threads.
   * TODO(Bob): final (non-beta) onboarding URL, and whether it takes a parameter that tags the sub-pool.
   */
  onboardingUrl: 'https://beta.codedonqubic.com/pool/onboarding',

  /** Fields the onboarding page asks for, in its order. */
  onboardingFields: ['Operating system', 'Qubic wallet address', 'Worker name', 'Backend', 'Threads'] as const,
  osOptions: ['linux', 'macos', 'windows', 'hiveos'] as Os[],
  backends: ['Auto', 'GPU', 'AVX2', 'AVX512'] as Backend[],

  /** Our workers carry this prefix; that is how the sub-pool is tagged. */
  workerPrefix: 'QC.',
  /** Partner rule: letters, numbers and . - _ , up to 64 characters. */
  workerMaxLength: 64,
  workerPattern: /^[A-Za-z0-9._-]{1,64}$/,

  /**
   * Headless launch line per OS, with placeholders {WALLET} {WORKER} {BACKEND} {THREADS}.
   * TODO(Bob): the exact command(s) for the partner miner. While this is null the connect wizard says
   * "open the pool setup page and enter these exact values" instead of printing a command.
   * Example shape (NOT confirmed): linux: './miner --wallet {WALLET} --worker {WORKER} --backend {BACKEND} --threads {THREADS}'
   */
  launchLine: null as Partial<Record<Os, string>> | null,

  /** Process name to check that exactly one miner runs. TODO(Bob): the partner miner's binary name. */
  minerProcess: null as string | null,

  /** Public stats page for a worker or wallet. TODO(Bob): URL, with {WALLET} or {WORKER} if it takes one. */
  statsUrl: null as string | null,

  /** Fee, disclosed quietly in the terms. Keep the internal split out of every user-facing string. */
  feePercent: 7,

  payout: {
    currency: 'QUBIC',
    epoch: 'Wednesday 12:00 UTC to the next Wednesday 12:00 UTC',
    timing: 'calculated after each weekly epoch ends',
    /** When the payout usually arrives. Qubic Discord #mining-general, Sep to Nov 2026. */
    lands: 'Payout usually lands about a week after the epoch closes, sometimes up to about 10 days; the pool shows a pending payout with its date',
  },
} as const

export const keepPercent = 100 - POOL.feePercent

/** Numbers we show. Each carries its source; anything without a dated source is shown as est. */
export const HARDWARE_FIGURES = [
  { name: 'AMD Ryzen 9 7950X', kind: 'CPU', itPerSec: 30 },
  { name: 'Apple M3 Pro', kind: 'CPU', itPerSec: 40 },
] as const
// TODO(Bob): the date you read the partner's public hardware table, so these can drop the "est." mark.
export const HARDWARE_FIGURES_SOURCE = { label: "the partner's public hardware table", date: null as string | null }

export const RENTALS = [
  { name: 'Clore.ai', note: 'Decentralized, usually cheapest, mining allowed.', url: 'https://clore.ai/register?ref_id=tgwpwvbi', referral: true },
  { name: 'Octaspace', note: 'Clean access-token flow; good cards sell out fast.', url: 'https://cube.octa.computer', referral: false },
  { name: 'Vast.ai', note: 'The other big decentralized marketplace.', url: 'https://vast.ai', referral: false },
] as const

export const WALLET = {
  seed: { length: 55, pattern: /^[a-z]{55}$/, rule: 'The seed is 55 lowercase letters. It is the master key. Never type it into any site, pool, miner or chat.' },
  address: { length: 60, pattern: /^[A-Z]{60}$/, rule: 'The address (Qubic ID) is 60 uppercase letters. It is safe to share and it is all the pool needs.' },
} as const

export const MARIA_LIMITS = { perDay: 20, maxInput: 1200, maxTurns: 8 } as const

/**
 * Measured results: how Maria learns from real runs (measure.ts, aggregate.ts, store.ts).
 * Every threshold that changes what Maria says lives here.
 */
export const MEASURE = {
  /** Under this many rigs a measurement is labelled "few data". */
  fewData: 5,
  /** A verdict flips only when this many pool-sourced rigs, over at least flipMinEpochs epochs, disagree with it. */
  flipMinPoolRigs: 5,
  flipMinEpochs: 2,
  /** Quantiles for "top" and "bottom" when a hardware's median is ranked against the others of its unit. */
  topQuantile: 0.75,
  bottomQuantile: 0.25,
  /** Ranking needs this many hardware rows of the same unit, or no disagreement is claimed. */
  minRowsForRank: 4,
  /** Measurements whose newest epoch is more than this many epochs back are shown as "older". */
  olderAfterEpochs: 2,
  /** An epoch median that moves more than this against the previous epoch flags a possible algorithm change. */
  driftPct: 30,
  /** Field rule: do not judge a rig in its first 20 minutes. */
  minWindowMin: 20,
  /** Field rule: the first 1 to 2 hours overstate the rate by about 1.3 to 1.5x; samples are saved only after this. */
  warmupMin: 120,
  warmupFactor: '1.3 to 1.5x',
  /** Epochs read back for aggregation, and the newest rows kept per epoch list. */
  readEpochs: 8,
  capPerEpoch: 2000,
  /** Aggregates are recomputed on read, at most this often per server instance. */
  cacheMs: 60_000,
  /** Saved results per connection per day. */
  postsPerDay: 6,
} as const

/**
 * My rig: the miner's own dashboard (rig.ts) and its share card (card-sign.ts, /api/pool/card).
 * Warm-up and early windows come from MEASURE (minWindowMin, warmupMin) so the two never disagree.
 */
export const RIG = {
  /** A reading older than this many minutes is "no signal". Pool stats refresh often; a pasted log is a snapshot. */
  noSignalMin: { pool: 20, log: 60, demo: 60 },
  /**
   * After the weekly epoch change, miners sit idle until the new epoch's work arrives.
   * TODO(Bob): confirm the real idle window with the partner; 60 minutes is our field estimate.
   */
  epochIdleMin: 60,
  /** Rejected share of submitted solutions: the coach mentions it from here, the status turns "needs a look" from lookPct. */
  rejectedCheckPct: 5,
  rejectedLookPct: 12,
  /** Field rule: at least 12 CPU threads (8 cores) per GPU, or the CPU starves the cards. */
  threadsPerGpu: 12,
  /** Rigs kept in this browser's list. */
  maxRigs: 12,
  /** Share card links expire after this many seconds; the PNG itself is the thing people post. */
  cardTtlS: 30 * 60,
} as const

/**
 * The record (ledger.ts): every contribution through the pool, one journal entry each, hash chained.
 * Limits that shape what may be written; the page and My rig read the display counts from here.
 */
export const LEDGER = {
  /** Record requests per connection per day (saves from Fix my rig count against MEASURE.postsPerDay instead). */
  postsPerDay: 8,
  /** Entries per worker per epoch. A rig that saves every few hours stays well under it. */
  perWorkerEpoch: 24,
  /** One epoch is 168 hours: no single entry claims more. */
  maxHours: 168,
  /** Rented machines: up to this many cards in one entry. */
  maxCards: 32,
  /** Entries per worker returned to My rig, newest first. */
  workerEntries: 40,
  /** Newest entries on the page strip, anonymised. */
  newest: 5,
  /** Pool-wide totals are recomputed at most this often per server instance. */
  cacheMs: 60_000,
} as const
