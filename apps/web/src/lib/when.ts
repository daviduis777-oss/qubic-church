/*
 * WEN: every date that matters for Qubic and Aigarth, from the proof of concept in 2021 to the ETA of 2027.
 * Newest first. Quotes of Come-from-Beyond are verbatim; dates are UTC days.
 * Sources: QC's research log (vault, Tier 1 quotes), qubic.org All-Hands recaps, press, GitHub.
 * Nothing here is a promise: an ETA is an ETA, and the page says so.
 */

export type Kind = 'aigarth' | 'science' | 'network' | 'mining' | 'economy' | 'qc'
export type Quote = { text: string; when: string; where?: string }
export type Moment = {
  /** ISO date or datetime, UTC */
  at: string
  /** shown instead of the exact day when only the month or season is known */
  approx?: string
  title: string
  line?: string
  kind: Kind
  /** the big ones: drawn as cards, the rest as lines */
  major?: boolean
  eta?: boolean
  epoch?: number
  quote?: Quote
  source?: { label: string; href: string }
}

export const KINDS: Record<Kind, { name: string; color: string }> = {
  aigarth: { name: 'Aigarth', color: '#ffc46b' },
  science: { name: 'Science', color: '#9fd3ff' },
  network: { name: 'Network', color: '#b9a6ff' },
  mining: { name: 'Mining', color: '#8be0b5' },
  economy: { name: 'Economy', color: '#ff9f8a' },
  qc: { name: 'QC', color: '#fff3dc' },
}

/** Epochs start every Wednesday at 12:00 UTC. E239 started on 11 November 2026. */
export const EPOCH_ANCHOR = { epoch: 239, start: Date.UTC(2026, 10, 11, 12) }
export const WEEK = 7 * 24 * 3600 * 1000
export const epochAt = (t: number) => EPOCH_ANCHOR.epoch + Math.floor((t - EPOCH_ANCHOR.start) / WEEK)
export const epochStart = (e: number) => EPOCH_ANCHOR.start + (e - EPOCH_ANCHOR.epoch) * WEEK

const D = 'Discord'
const AH = (date: string, slug: string) => ({ label: `qubic.org All-Hands, ${date}`, href: `https://qubic.org/blog-detail/${slug}` })
const SEPT = AH('Sept 2026', 'qubic-all-hands-recap-september-2026-neuraxon-arc-agi-3')
const AUG = AH('6 Aug 2026', 'qubic-all-hands-recap-august-6-2026')
const MAY = AH('28 May 2026', 'qubic-all-hands-recap-may-28-2026')
const APR = AH('30 Apr 2026', 'qubic-all-hands-recap-april-30-2026')
const E100 = { label: 'qubic.org: Epoch 100 to 200', href: 'https://qubic.org/blog-detail/qubic-epoch-100-to-200-milestones-fastest-blockchain-decentralized-ai' }
const THEFT = { label: 'Cointelegraph, 20 Oct 2026', href: 'https://cointelegraph.com/news/qubic-restarts-blockchain-opens-recovery-claims-after-14m-hack' }

export const MOMENTS: Moment[] = [
  /* ---------- ahead ---------- */
  { at: '2027-05-01', title: 'Recovery claims close', line: 'Last day for owners of wallets hit by the October seed theft to claim.', kind: 'network', source: THEFT },
  {
    at: '2027-04-13T12:00:00Z',
    title: 'The Day',
    line: 'Come-from-Beyond’s ETA for Aigarth running as smart contracts on Qubic, five years after mining began.',
    kind: 'aigarth',
    major: true,
    eta: true,
    quote: { text: 'Long-term ETA was 13.04.2027 and short-term 18th-25th Nov.', when: '10 Nov 2026', where: D },
    source: { label: 'What the deploy on 13 April 2027 means', href: '/books/qubic-the-long-version/14-what-the-deploy-on-april-13-2027-means' },
  },
  {
    at: '2026-11-25T12:00:00Z',
    title: 'Qualification by accuracy',
    epoch: 241,
    line: 'Computor seats go to the networks that predict best, not to the ones that remember the past best.',
    kind: 'aigarth',
    major: true,
    quote: {
      text: 'The key is in changing qualification from lower score to higher prediction accuracy. If now computors converge their ANNs to some memorizing machine then after 25th it will mean 50% accuracy and anybody with ANNs doing pattern extraction (instead of memorization) will be winning all computor places even with 51%.',
      when: '11 Nov 2026',
      where: D,
    },
  },
  { at: '2026-11-25T12:00:00Z', title: 'The second Mining Marathon', epoch: 241, line: 'QC’s second marathon starts with the new qualification.', kind: 'qc', major: true, source: { label: 'QubicChurch on X, 10 Nov 2026', href: 'https://x.com/QubicChurch' } },
  {
    at: '2026-11-18T12:00:00Z',
    title: 'Live BTC feed: the test run',
    epoch: 240,
    line: 'Networks start reading live bitcoin hours. The whole epoch still qualifies the old way.',
    kind: 'aigarth',
    major: true,
    quote: {
      text: 'Not earlier than 18th and even after that we are mining whole epoch with old qualification function, which implies that incentive to predict BTC price correctly isn’t arriving earlier than on 25th',
      when: '10 Nov 2026',
      where: D,
    },
    source: { label: 'qubic/core #1062: live feed data for mining', href: 'https://github.com/qubic/core/issues/1062' },
  },

  /* ---------- 2026 ---------- */
  {
    at: '2026-11-11T12:00:00Z',
    title: '1024 neurons',
    epoch: 239,
    line: 'Every solution is now a network of 1024 neurons.',
    kind: 'aigarth',
    major: true,
    quote: {
      text: 'Tomorrow we are starting mining with 1024 neurons. Some of you will have temptation to reduce number of used neurons and end up with only 64 active ones, because you already know winning topology for that case. Unfortunately, it’s an inefficient method, it ends up with a pretty high score when you hit the wall. Pay attention to this.',
      when: '10 Nov 2026',
      where: D,
    },
  },
  { at: '2026-11-07', title: 'Solution threshold raised', line: 'A core commit lifts the bar a network must clear.', kind: 'aigarth', source: { label: 'qubic/core', href: 'https://github.com/qubic/core' } },
  { at: '2026-11-03', title: 'Live feed work starts in the core', line: 'The mining task will take in hourly candles instead of staying fixed for the epoch.', kind: 'network', source: { label: 'qubic/core #1062', href: 'https://github.com/qubic/core/issues/1062' } },
  { at: '2026-11-03', title: '155,192 Neuraxon brains published', line: 'The MultiNeuraxon 2.0 dataset goes up on Hugging Face.', kind: 'science' },
  { at: '2026-11-02', title: 'Neuraxon closes ARC-AGI-3 at 0.41', line: 'Vivancos and Sánchez finish the benchmark run.', kind: 'science' },
  { at: '2026-11-01', title: '“Aigarth is accomplished”', kind: 'aigarth', major: true, quote: { text: 'Aigarth is accomplished, now need to show it to others with BPP9000', when: '1 Nov 2026', where: D } },
  { at: '2026-10-20', title: 'The live feed is set for epoch 240', line: 'From 18 November mining moves to live bitcoin data.', kind: 'aigarth' },
  { at: '2026-10-19', title: 'Network restarts after the wallet seed theft', line: 'Web wallet 4.26.4 fixes weak seeds; recovery claims open.', kind: 'network', source: THEFT },
  { at: '2026-09-18', title: 'Grokking', line: 'The Qiner plan is rewritten after a “recent discovery”.', kind: 'aigarth', major: true, quote: { text: 'undeniable proof that our AI works', when: '18 Sep 2026', where: D } },
  { at: '2026-09-17', title: 'Moving to the 1024-neuron test', kind: 'aigarth' },
  { at: '2026-09-17', title: 'Neuraxon at 0.38 on ARC-AGI-3', line: '450,000 trials, Neuraxon 3.0 alpha; QPay Hub live.', kind: 'science', source: SEPT },
  { at: '2026-09-16', title: 'Noise teaches', line: 'A model trained on noisy data makes six times fewer errors on clean data: 3236 down to 534.', kind: 'aigarth' },
  { at: '2026-09-09', title: 'Avalanche topology', epoch: 230, line: 'New network topology in the core; oracles read EVM chains.', kind: 'network' },
  { at: '2026-09-05', title: 'Paperwork before “accomplished”', kind: 'aigarth', quote: { text: 'Need to finish some paperwork to deem Aigarth accomplished.', when: '5 Sep 2026', where: D } },
  { at: '2026-09-03', title: 'First holdout number: 55.3%', line: 'The ANN Explorer shows how the networks do on data they never saw.', kind: 'aigarth', major: true },
  { at: '2026-09-02', title: 'Shared root and holdout', epoch: 229, line: 'Every network grows from one root and is checked on a held-out hour.', kind: 'aigarth' },
  { at: '2026-08-26', title: 'Ant colony mining live', epoch: 228, line: 'Core v1.302.0: miners search networks like an ant colony.', kind: 'mining', major: true, source: AUG },
  { at: '2026-08-22', title: 'Oracle Machines read logs', line: 'readEVMLog and readQubicLog: contracts see other chains.', kind: 'network' },
  { at: '2026-08-19', title: 'Second halving', epoch: 227, line: 'Weekly emission halves, from about 450 to 225 billion QUBIC.', kind: 'economy', major: true, source: AUG },
  { at: '2026-08-11', title: 'NeuraxonLive2M on Hugging Face', line: 'Heritability confirmed.', kind: 'science' },
  { at: '2026-07-31', title: 'Qubic Atlas', line: 'An independent proof verifier.', kind: 'network' },
  { at: '2026-07-29', title: 'BPP-9000 and Outsourced Computing go live', line: 'Core v1.301.0: the Bitcoin predictor becomes the mining task; contracts can hire outside compute.', kind: 'aigarth', major: true, source: AUG },
  { at: '2026-07-28', approx: '27–30 Jul 2026', title: 'Multi-Neuraxon at AGI-26', line: 'Presented in San Francisco; in Springer’s AGI proceedings.', kind: 'science', source: AUG },
  { at: '2026-07-22', title: 'Best Oral Presentation, AMLDS Osaka', line: '“The Neutral Buffer State”; ARC-AGI-3 at 0.21.', kind: 'science', source: AUG },
  { at: '2026-07-16', title: 'BPP-9000 announced', line: 'The Bitcoin Price Predictor 9000: the first product of Aigarth.', kind: 'aigarth', major: true, source: { label: 'BPP-9000', href: '/bpp9000' } },
  { at: '2026-07-08', title: 'Qubic defines AGI', line: 'Neuraxon Intelligence Academy, volume 11.', kind: 'science' },
  { at: '2026-07-07', title: 'Anna.exe learns bitcoin candles', line: 'A prototype that predicts hourly BTC candles.', kind: 'aigarth' },
  { at: '2026-07-06', title: 'Anna.exe reaches 0', line: 'All seven tests at zero, with Come-from-Beyond’s pretrained file.', kind: 'aigarth', major: true, quote: { text: 'It’s not a milestone. It’s much bigger.', when: '6 Jul 2026', where: D } },
  { at: '2026-06-30', title: 'Dogecoin mining paused by vote', line: 'Room made for the ant colony.', kind: 'mining' },
  { at: '2026-06-29', title: 'Neuraxon 2.0 on ARC-AGI-3', line: '0.13% on CPU only, above Grok 4.2 beta.', kind: 'science' },
  { at: '2026-06-11', title: 'Detour live on mainnet', kind: 'network' },
  { at: '2026-06-10', title: 'The Anna.exe race', line: 'Come-from-Beyond hands the community Anna.exe: bring the score to 0.', kind: 'aigarth', major: true },
  { at: '2026-05-21', title: '“We solved AI”', kind: 'aigarth', major: true, quote: { text: 'We solved AI and now need practical proof which is just matter of getting enough power.', when: '21 May 2026', where: D } },
  { at: '2026-05-21', approx: '20–22 May 2026', title: 'Best Paper, ICMLT Berlin', line: 'And Best Presentation.', kind: 'science', source: MAY },
  { at: '2026-05-08', title: '41.5 trillion QUBIC burned', kind: 'economy' },
  { at: '2026-05-06', title: 'Paper submitted to NeurIPS 2026', kind: 'science', source: APR },
  { at: '2026-05-02', title: 'Constant dimensions', line: 'An architectural decision in Aigarth.', kind: 'aigarth', quote: { text: 'It means that instead of 2000 nuclear plants we’ll need 14.', when: '2 May 2026', where: D } },
  { at: '2026-04-22', title: 'All compute to Aigarth and Dogecoin', line: 'Phase 3, eight days ahead of plan; core v1.288.0.', kind: 'mining' },
  { at: '2026-04-20', title: '“Intelligence Is Not Scale”', line: 'The manifesto, on qubic.org.', kind: 'science' },
  { at: '2026-04-15', title: 'The Monero chapter closes', line: 'Custom XMR mining ends by community decision.', kind: 'mining', source: APR },
  { at: '2026-04-13', title: 'Qubic turns four', kind: 'network' },
  {
    at: '2026-04-01',
    title: 'Qubic mines Dogecoin',
    line: 'Outsourced mining moves to Dogecoin; first block on 3 April.',
    kind: 'mining',
    major: true,
    source: { label: 'Decrypt, 1 Apr 2026', href: 'https://decrypt.co/363018/qubic-the-network-that-captured-51-of-monero-is-now-mining-dogecoin-on-its-ai-compute-infrastructure-live' },
  },
  { at: '2026-03-26', title: 'The first deflationary epoch', epoch: 206, line: 'More QUBIC burned than emitted.', kind: 'economy' },
  {
    at: '2026-02-21',
    title: 'Oracle Machines fully live',
    line: 'Smart contracts read real-world data, checked by computor quorum. Testing on mainnet since epoch 200, 11 February.',
    kind: 'network',
    major: true,
    source: { label: 'OurCryptoTalk, 22 Feb 2026', href: 'https://ourcryptotalk.com/news/qubic-launches-oracle-machines-on-mainnet-for-real-world-data' },
  },
  { at: '2026-02-19', title: 'Without 1000 nuclear plants', kind: 'aigarth', quote: { text: 'Aigarth already found how to get AI, now trying to find out how to get AI without 1000 nuclear plants.', when: '19 Feb 2026', where: D } },
  { at: '2026-01-29', title: 'QX record day', line: '100 billion QU traded.', kind: 'economy', source: E100 },
  { at: '2026-01-24', title: 'Qiner miner on GitHub', kind: 'mining' },
  { at: '2026-01-14', title: 'Execution fees on mainnet', kind: 'network', source: E100 },

  /* ---------- 2025 ---------- */
  { at: '2025-12-14', title: 'Aigarth Lab funded by the Arbitrator', line: 'Salaries at AI-industry level.', kind: 'aigarth' },
  { at: '2025-12-11', title: 'A new mining task is coming', line: 'It changes the GPU/CPU balance: the future BPP-9000.', kind: 'mining' },
  { at: '2025-12-06', title: 'ETA set: 13 April 2027', kind: 'aigarth', major: true, quote: { text: 'And ETA for Aigarth was set as April 13, 2027.', when: '6 Dec 2025', where: D } },
  { at: '2025-12-04', title: '“Aigarth is hardware-agnostic”', kind: 'aigarth' },
  { at: '2025-11-15', approx: 'November 2025', title: 'First Neuraxon paper', line: 'Vivancos and Sánchez.', kind: 'science', source: E100 },
  { at: '2025-09-30', title: 'What intelligence is', kind: 'aigarth', quote: { text: 'In the Aigarth project we know what/where intelligence is and why LLMs actually have nothing to do with one.', when: '30 Sep 2025', where: D } },
  { at: '2025-09-10', title: 'Anti-attractors', line: 'The energy-saving direction of Aigarth, made public.', kind: 'aigarth' },
  {
    at: '2025-09-02',
    title: 'Anna Aigarth switches on',
    line: 'An AI on X that learns the rule of addition from the sums people post to her.',
    kind: 'aigarth',
    major: true,
    quote: { text: 'Real AI isn’t one which passes the Turing test, but one which fails it intentionally.', when: '2 Sep 2025', where: D },
    source: { label: 'What is Anna Aigarth?', href: '/what-is-anna-aigarth' },
  },
  { at: '2025-08-20', title: 'First halving', epoch: 175, kind: 'economy', source: E100 },
  { at: '2025-08-11', title: '51% of Monero', line: 'Qubic miners take 63 of 122 blocks in a verified window.', kind: 'mining', major: true, source: E100 },
  { at: '2025-07-23', title: '“We know how to create AI”', kind: 'aigarth', quote: { text: 'We know how to create AI, but we created none yet.', when: '23 Jul 2025', where: D } },
  { at: '2025-07-22', title: 'Aigarth code goes public', line: 'The Intelligent Tissue framework opens on GitHub.', kind: 'aigarth', major: true, quote: { text: 'Tests passed successfully, we are going to public now', when: '22 Jul 2025', where: D }, source: { label: 'github.com/Aigarth', href: 'https://github.com/Aigarth' } },
  { at: '2025-07-09', title: 'Two walls at once', line: 'Local extremum and overfitting solved together.', kind: 'aigarth' },
  { at: '2025-07-01', title: 'RPC 2.0', kind: 'network', source: E100 },
  { at: '2025-06-20', approx: 'Summer 2025', title: 'Monero merge mining begins', line: 'Miners lend spare CPU to Monero.', kind: 'mining', source: E100 },
  { at: '2025-04-22', title: '15.52 million TPS', epoch: 157, line: 'CertiK verifies the speed record on mainnet.', kind: 'network', major: true, source: E100 },
  { at: '2025-03-22', title: 'Madrid Hackathon', line: 'The first live smart-contract deployments on testnet.', kind: 'network', source: E100 },

  /* ---------- 2024 ---------- */
  { at: '2024-12-04', title: 'The midpoint of Aigarth', line: 'From generating networks to training them; Anna learns addition.', kind: 'aigarth', major: true, quote: { text: 'It’s the 2nd milestone of Aigarth. The first was 3 years ago.', when: '4 Dec 2024', where: D } },
  { at: '2024-12-15', approx: 'December 2024', title: 'Toward an AGI with Aigarth', line: 'The position paper.', kind: 'science', source: E100 },
  { at: '2024-08-18', title: 'Where intelligence starts', kind: 'aigarth', quote: { text: 'The moment of intelligence emergence can probably be spotted when interconnections implement a function which doesn’t have the inverse function.', when: '18 Aug 2024', where: D } },
  { at: '2024-08-01', title: 'Project X', epoch: 123, line: 'Max supply cut from 1,000 to 200 trillion.', kind: 'economy', major: true, source: E100 },
  { at: '2024-07-23', title: 'The midpoint is named', kind: 'aigarth', quote: { text: 'Now we see that the 4th of Dec, 2024 will be the mid-point of our road to Aigarth. After that date we are starting working on practically usable AIs.', when: '23 Jul 2024', where: D } },
  { at: '2024-07-17', title: 'QUBIC on MEXC', line: 'After XT (20 June) and Bitget (29 June).', kind: 'economy', source: { label: 'Invezz, 17 Jul 2024', href: 'https://invezz.com/news/2024/07/17/qubic-announces-token-listing-on-mexc-alongside-ambitious-2024-roadmap' } },
  { at: '2024-04-18', title: 'A neuron like a transistor', kind: 'aigarth', quote: { text: 'No, we found neuron which behaves like a transistor.', when: '18 Apr 2024', where: D } },

  /* ---------- 2023 and before ---------- */
  { at: '2023-11-20', title: 'Looking for the first signs', kind: 'aigarth', quote: { text: 'Now we are looking for threshold time when we can notice first signs of AI.', when: '20 Nov 2023', where: D } },
  { at: '2023-03-21', title: 'A breakthrough on the DIKW pyramid', kind: 'aigarth', quote: { text: 'We have got a breakthrough recently, related to concept of DIKW pyramid. It may be a fundamental change of point of view on AI development.', when: '21 Mar 2023', where: D } },
  { at: '2023-01-07', title: 'Cargo cult', line: 'On the AI everyone was talking about.', kind: 'aigarth', quote: { text: 'What we see now is just a variant of cargo cult - AI generates phrases and often they sound reasonable but we cannot rely on anything it says.', when: '7 Jan 2023', where: D } },
  {
    at: '2022-04-13',
    title: 'Mining begins',
    line: 'Qubic’s first real mining. Five years later is the date everything points at.',
    kind: 'network',
    major: true,
    quote: { text: 'Qubic launch is an important step toward Aigarth, a project aiming to compete against projects like [OpenAI].', when: '13 Apr 2022' },
    source: { label: 'What is Qubic?', href: '/what-is-qubic' },
  },
  { at: '2021-12-15', approx: 'December 2021', title: 'The proof of concept', line: 'The first milestone of Aigarth.', kind: 'aigarth' },
]

/** The questions the chat asks most, answered in his words. */
export const WEN: { q: string; a: string; quote: Quote }[] = [
  {
    q: 'Wen product?',
    a: 'When the live bitcoin feed is in. The test run starts on 18 November.',
    quote: { text: 'Qubic doesn’t have product yet, we are waiting for 18th for live BTC price feed being added', when: '10 Nov 2026', where: D },
  },
  { q: 'Wen do real predictions count?', a: 'From 25 November. Epoch 240 is a test; epoch 241 is the first scored on accuracy.', quote: { text: 'Should be 25th, 18th is test-run', when: '10 Nov 2026', where: D } },
  { q: 'Why not right away on the 18th?', a: 'Miners need the epoch to grow networks for the live feed.', quote: { text: 'Yes, because miners won’t produce trained ANN same day', when: '10 Nov 2026', where: D } },
  { q: 'Wen do the score games stop?', a: 'On 25 November, when the score changes.', quote: { text: 'on 25th we are changing how score is computed, so games should stop automatically', when: '10 Nov 2026', where: D } },
  {
    q: 'Wen factual accuracy?',
    a: 'Planned for this epoch; the explorer shows it once 100 computors qualify.',
    quote: { text: 'Those who helped with Anna latest testing, we adjusted threshold score based on that testing, planning to see factual accuracy next epoch', when: '10 Nov 2026', where: D },
  },
  { q: 'Wen a higher bar than 55%?', a: 'After 55% is reached. A quick test showed 67% is out of reach for now.', quote: { text: 'if we reach 55% we’ll increase it', when: '10 Nov 2026', where: D } },
  { q: 'Wen 13.04.2027?', a: 'On 13 April 2027. It is an estimate, declared years ahead.', quote: { text: 'Cannot help with that, ETA was declared beforehand, so you dont have ground for reclamation', when: '10 Nov 2026', where: D } },
]
