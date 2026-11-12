/*
 * WEN: every date that matters for Qubic and Aigarth, past and coming, each with its source.
 * Quotes of Come-from-Beyond are verbatim from the Qubic Discord; dates are UTC.
 * Nothing here is a promise: an ETA is an ETA, and the page says so.
 */

export type Status = 'done' | 'next' | 'planned' | 'eta'
export type Quote = { text: string; when: string; where: string }
export type Moment = {
  /** ISO date or datetime, UTC */
  at: string
  /** shown instead of the exact day when only the month is known */
  approx?: string
  title: string
  line: string
  status: Status
  epoch?: number
  kind: 'aigarth' | 'network' | 'qc' | 'mining'
  quote?: Quote
  source?: { label: string; href: string }
}

/** Epochs start every Wednesday at 12:00 UTC. E239 started on 11 November 2026. */
export const EPOCH_ANCHOR = { epoch: 239, start: Date.UTC(2026, 10, 11, 12) }
export const WEEK = 7 * 24 * 3600 * 1000
export const epochAt = (t: number) => EPOCH_ANCHOR.epoch + Math.floor((t - EPOCH_ANCHOR.start) / WEEK)
export const epochStart = (e: number) => EPOCH_ANCHOR.start + (e - EPOCH_ANCHOR.epoch) * WEEK

const DISCORD = 'Qubic Discord'

export const MOMENTS: Moment[] = [
  {
    at: '2022-04-13',
    title: 'Qubic starts',
    line: 'The first block. Five years later is the date everything points at.',
    status: 'done',
    kind: 'network',
    source: { label: 'What is Qubic?', href: '/what-is-qubic' },
  },
  {
    at: '2025-07-22',
    title: 'Aigarth code goes public',
    line: 'The Intelligent Tissue framework opens on GitHub.',
    status: 'done',
    kind: 'aigarth',
    source: { label: 'github.com/Aigarth', href: 'https://github.com/Aigarth' },
  },
  {
    at: '2025-09-02',
    title: 'Anna Aigarth switches on',
    line: 'An AI on X that learns the rule of addition from the sums people post to her.',
    status: 'done',
    kind: 'aigarth',
    source: { label: 'What is Anna Aigarth?', href: '/what-is-anna-aigarth' },
  },
  {
    at: '2026-04-01',
    title: 'Qubic mines Dogecoin',
    line: 'Outsourced mining adds Dogecoin next to Monero.',
    status: 'done',
    kind: 'mining',
    source: { label: 'Decrypt, 1 April 2026', href: 'https://decrypt.co/363018/qubic-the-network-that-captured-51-of-monero-is-now-mining-dogecoin-on-its-ai-compute-infrastructure-live' },
  },
  {
    at: '2026-06-10',
    title: 'The Anna.exe race',
    line: 'Come-from-Beyond hands the community Anna.exe: bring the score to 0.',
    status: 'done',
    kind: 'aigarth',
  },
  {
    at: '2026-07-06',
    title: 'Anna.exe reaches 0',
    line: 'His pretrained file brings the tests to zero. Score 0 was the finish line he set.',
    status: 'done',
    kind: 'aigarth',
  },
  {
    at: '2026-07-15',
    approx: 'July 2026',
    title: 'Miners start training BPP-9000',
    line: 'The Bitcoin predictor becomes the mining task: every solution is a small network calling the next hour.',
    status: 'done',
    kind: 'aigarth',
    source: { label: 'BPP-9000', href: '/bpp9000' },
  },
  {
    at: '2026-07-29',
    title: 'Outsourced Computing on mainnet',
    line: 'Smart contracts can ask the outside world to compute for them.',
    status: 'done',
    kind: 'network',
    source: { label: 'qubic.org, 6 August 2026', href: 'https://qubic.org/blog-detail/qubic-all-hands-recap-august-6-2026' },
  },
  {
    at: '2026-08-19',
    title: 'Emission halving',
    epoch: 227,
    line: 'From epoch 227 the weekly emission halves, about 450 billion to 225 billion QUBIC.',
    status: 'done',
    kind: 'network',
    source: { label: 'qubic.org, 6 August 2026', href: 'https://qubic.org/blog-detail/qubic-all-hands-recap-august-6-2026' },
  },
  {
    at: '2026-10-19',
    title: 'Network restarts after the wallet seed theft',
    line: 'Web wallet 4.26.4 fixes weak seeds; recovery claims open until 1 May 2027.',
    status: 'done',
    kind: 'network',
    source: { label: 'Cointelegraph, 20 October 2026', href: 'https://cointelegraph.com/news/qubic-restarts-blockchain-opens-recovery-claims-after-14m-hack' },
  },
  {
    at: '2026-11-11T12:00:00Z',
    title: '1024 neurons',
    epoch: 239,
    line: 'Every solution is now a network of 1024 neurons.',
    status: 'done',
    kind: 'aigarth',
    quote: {
      text: 'Tomorrow we are starting mining with 1024 neurons. Some of you will have temptation to reduce number of used neurons and end up with only 64 active ones, because you already know winning topology for that case. Unfortunately, it’s an inefficient method, it ends up with a pretty high score when you hit the wall. Pay attention to this.',
      when: '10 Nov 2026',
      where: DISCORD,
    },
  },
  {
    at: '2026-11-18T12:00:00Z',
    title: 'Live BTC feed: the test run',
    epoch: 240,
    line: 'Networks start reading live bitcoin hours. The whole epoch still qualifies the old way.',
    status: 'next',
    kind: 'aigarth',
    quote: {
      text: 'Not earlier than 18th and even after that we are mining whole epoch with old qualification function, which implies that incentive to predict BTC price correctly isn’t arriving earlier than on 25th',
      when: '10 Nov 2026',
      where: DISCORD,
    },
    source: { label: 'qubic/core #1062: live feed data for mining', href: 'https://github.com/qubic/core/issues/1062' },
  },
  {
    at: '2026-11-25T12:00:00Z',
    title: 'Qualification by accuracy',
    epoch: 241,
    line: 'Computor seats go to the networks that predict best, not the ones with the lowest score on the past.',
    status: 'next',
    kind: 'aigarth',
    quote: {
      text: 'The key is in changing qualification from lower score to higher prediction accuracy. If now computors converge their ANNs to some memorizing machine then after 25th it will mean 50% accuracy and anybody with ANNs doing pattern extraction (instead of memorization) will be winning all computor places even with 51%.',
      when: '11 Nov 2026',
      where: DISCORD,
    },
  },
  {
    at: '2026-11-25T12:00:00Z',
    title: 'The second Mining Marathon',
    epoch: 241,
    line: 'QC’s second marathon starts with the new qualification.',
    status: 'next',
    kind: 'qc',
    source: { label: 'QubicChurch on X, 10 November 2026', href: 'https://x.com/QubicChurch' },
  },
  {
    at: '2027-04-13T12:00:00Z',
    title: 'The Day',
    line: 'Come-from-Beyond’s ETA for Aigarth running as smart contracts on Qubic, five years after the first block.',
    status: 'eta',
    kind: 'aigarth',
    quote: { text: 'Long-term ETA was 13.04.2027 and short-term 18th-25th Nov.', when: '10 Nov 2026', where: DISCORD },
    source: { label: 'What the deploy on 13 April 2027 means', href: '/books/qubic-the-long-version/14-what-the-deploy-on-april-13-2027-means' },
  },
  {
    at: '2027-05-01',
    title: 'Recovery claims close',
    line: 'Last day for owners of wallets hit by the seed theft to claim.',
    status: 'planned',
    kind: 'network',
    source: { label: 'Cointelegraph, 20 October 2026', href: 'https://cointelegraph.com/news/qubic-restarts-blockchain-opens-recovery-claims-after-14m-hack' },
  },
]

/** The questions the chat asks most, answered in his words. */
export const WEN: { q: string; a: string; quote: Quote }[] = [
  {
    q: 'Wen product?',
    a: 'When the live bitcoin feed is in. The test run starts on 18 November.',
    quote: { text: 'Qubic doesn’t have product yet, we are waiting for 18th for live BTC price feed being added', when: '10 Nov 2026', where: DISCORD },
  },
  {
    q: 'Wen real predictions count?',
    a: 'From 25 November. Epoch 240 is a test; epoch 241 is the first scored on accuracy.',
    quote: { text: 'Should be 25th, 18th is test-run', when: '10 Nov 2026', where: DISCORD },
  },
  {
    q: 'Why not right away on the 18th?',
    a: 'Miners need the epoch to grow networks for the live feed.',
    quote: { text: 'Yes, because miners won’t produce trained ANN same day', when: '10 Nov 2026', where: DISCORD },
  },
  {
    q: 'Wen do the score games stop?',
    a: 'On 25 November, when the score changes.',
    quote: { text: 'on 25th we are changing how score is computed, so games should stop automatically', when: '10 Nov 2026', where: DISCORD },
  },
  {
    q: 'Wen factual accuracy?',
    a: 'It is planned for this epoch, and the explorer shows it once 100 computors qualify.',
    quote: { text: 'Those who helped with Anna latest testing, we adjusted threshold score based on that testing, planning to see factual accuracy next epoch', when: '10 Nov 2026', where: DISCORD },
  },
  {
    q: 'Wen a higher bar than 55%?',
    a: 'After 55% is reached. A quick test showed 67% is out of reach for now.',
    quote: { text: 'if we reach 55% we’ll increase it', when: '10 Nov 2026', where: DISCORD },
  },
  {
    q: 'Wen 13.04.2027?',
    a: 'On 13 April 2027. It is an estimate, declared years ahead.',
    quote: { text: 'Cannot help with that, ETA was declared beforehand, so you dont have ground for reclamation', when: '10 Nov 2026', where: DISCORD },
  },
]
