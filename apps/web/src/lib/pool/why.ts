/**
 * Why the pool exists, in Come-from-Beyond's own words, and the few facts behind the decentralization line.
 * Quotes are verbatim from the Qubic Discord, posted by Come-from-Beyond: never edit inside the quote marks.
 * Pure and browser safe. No rewards talk anywhere here: the record says what was done, never why.
 */

export const CFB = { who: 'Come-from-Beyond', where: 'Qubic Discord' } as const

/** The anchor. No closing full stop: that is how he wrote it. */
export const MACHINE = {
  text: 'All depends on miners. I constructed a machine, throw computing power into it and it will do anything',
  ...CFB,
  date: '20 Jul 2026',
} as const

/** His answer, again and again, lowercase as he writes it. Two on 31 Aug and two on 14 Oct. All 2026. */
export const ASK: {
  text: 'ask miners' | 'ask miner devs'
  date: string
  iso: string
}[] = [
  { text: 'ask miners', date: '26 Aug', iso: '2026-08-26' },
  { text: 'ask miners', date: '31 Aug', iso: '2026-08-31' },
  { text: 'ask miners', date: '31 Aug', iso: '2026-08-31' },
  { text: 'ask miners', date: '2 Sep', iso: '2026-09-02' },
  { text: 'ask miners', date: '7 Sep', iso: '2026-09-07' },
  { text: 'ask miners', date: '9 Sep', iso: '2026-09-09' },
  { text: 'ask miners', date: '14 Sep', iso: '2026-09-14' },
  { text: 'ask miners', date: '20 Sep', iso: '2026-09-20' },
  { text: 'ask miner devs', date: '7 Oct', iso: '2026-10-07' },
  { text: 'ask miner devs', date: '10 Oct', iso: '2026-10-10' },
  { text: 'ask miners', date: '14 Oct', iso: '2026-10-14' },
  { text: 'ask miners', date: '14 Oct', iso: '2026-10-14' },
  { text: 'ask miners', date: '22 Oct', iso: '2026-10-22' },
]

export const ASK_SPAN = 'Aug to Oct 2026'

/** Our answer: plain, no em dashes, no promise beyond what the pool does today. */
export const ANSWER = {
  line: 'Miners ask. Maria answers.',
  sub: 'Qubic Church Pool is built around what miners ask for: help choosing hardware, a clean setup, a rig that keeps running, and a record of every contribution.',
} as const

/** Facts only; no other pool is named except one that is no longer active. */
export const DECENTRAL = {
  title: 'Very few pools carry Qubic’s mining.',
  count: {
    public: 2,
    independent: 1,
    quote: '2 public and one independent',
    who: 'a QLI moderator',
    where: 'Qubic Discord',
    date: '2 Nov 2026',
  },
  inactive: 'MinerLab is no longer active.',
  why: 'The more independent pools there are, the less the network’s compute depends on any one operator.',
  line: 'Mining through Qubic Church Pool adds weight to an independent pool, in a network that depends on very few.',
} as const

/** The record, said once. No reason given: it is recorded, and that is all it says. */
export const RECORD = {
  title: 'Recorded. Remembered.',
  line: 'Every contribution through Qubic Church Pool is recorded.',
  empty: 'The first entry is written when a miner records a result.',
} as const
