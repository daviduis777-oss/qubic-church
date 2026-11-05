/**
 * Why the pool exists, in Come-from-Beyond's own words, and the few facts behind the decentralization line.
 * Quotes are verbatim from the Qubic Discord, posted by Come-from-Beyond: never edit inside the quote marks.
 * Pure and browser safe. No rewards talk anywhere here: the record says what was done, never why.
 */

export const CFB = { who: 'Come-from-Beyond', where: 'Qubic Discord' } as const

/** The hero of the pool page, shown once. No closing full stop: that is how he wrote it. */
export const MACHINE = {
  text: 'All depends on miners. I constructed a machine, throw computing power into it and it will do anything',
  ...CFB,
  date: '20 July 2026',
  iso: '2026-07-20',
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
  line: 'Mining through Aigarth Pool adds weight to an independent pool, in a network that depends on very few.',
} as const

/** The record, said once. No reason given: it is recorded, and that is all it says. */
export const RECORD = {
  title: 'Recorded. Remembered.',
  line: 'Every contribution through Aigarth Pool is recorded.',
  empty: 'The first entry is written when a miner records a result.',
} as const
