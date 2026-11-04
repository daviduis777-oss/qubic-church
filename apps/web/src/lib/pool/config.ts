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

  /** Partner that operates the pool infrastructure. Shown once, in the partners line at the end of the page. */
  partner: {
    name: 'CODED',
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
