/**
 * What real miners ask, by theme, with the best factual answer we have, its sources and the date it was
 * true. Questions are in the miners' own words (short, no handles) or paraphrased. Maria's prompt
 * (prompt.ts) and the Discord card (scripts/pool-card.mts) read from here.
 *
 * Rules for this file: no income, profit or projection figures; losses only as "miners reported losses";
 * every field fact carries its epoch; only Qubic Church Pool is recommended, jetski only with its dated status and
 * "not recommended"; the partner pool is not named; answers speak as "I"; every answer that rests on our
 * own runs says it predates the E235/E236 changes. Community members
 * stay anonymous ("a miner"); `cite` names a handle only for Tier 1 voices (CfB, core devs, pool operators).
 *
 * Questions and channel answers from Qubic Discord #mining-general, 29 Jul to 4 Nov 2026, were added on 4 Nov 2026
 * (re-collected with the operators' reply bodies the same day).
 */
import type { SourceId } from './knowledge.ts'

export type FaqTheme =
  | 'start'
  | 'profitability'
  | 'hardware'
  | 'cpu-gpu'
  | 'ram'
  | 'breakage'
  | 'missing'
  | 'payout'
  | 'algo'
  | 'amd'
  | 'arm-mac'
  | 'mobile'
  | 'rentals'
  | 'trust'
  | 'tuning'

export const FAQ_THEMES: Record<FaqTheme, string> = {
  start: 'Getting started',
  profitability: 'Profitability',
  hardware: 'Which hardware',
  'cpu-gpu': 'CPU vs GPU',
  ram: 'RAM',
  breakage: 'Pool breakages',
  missing: 'Missing shares',
  payout: 'Payout timing',
  algo: 'New algorithm, new miner',
  amd: 'AMD GPUs',
  'arm-mac': 'ARM and Mac',
  mobile: 'Phones and Android',
  rentals: 'Renting rigs',
  trust: 'Trust in pools',
  tuning: 'Overclock, drivers, tools',
}

export type FaqEntry = {
  id: string
  theme: FaqTheme
  /** the topic as miners ask it, short and general (not one miner's wording) */
  q: string
  /**
   * 2 to 4 ranked must-say facts: Maria says all of them, in this order, before anything else.
   * Each carries its own date or source, and its "predates" note when it rests on our runs.
   */
  must: string[]
  /** optional extra context, only if there is room */
  more?: string
  /** the full answer: the must facts, then the extra (derived; the Discord card and tests read it) */
  a: string
  sources: SourceId[]
  /** when the answer was true, e.g. "epoch 233, Oct 2026" */
  asOf: string
  /** where in the Discord the answer comes from: "Qubic Discord #mining-general, <date>, <Tier 1 handle>" */
  cite?: string
}

const DISCORD = 'Qubic Discord #mining-general'

type Draft = Omit<FaqEntry, 'a'>
const entry = (e: Draft): FaqEntry => ({ ...e, a: [...e.must, ...(e.more ? [e.more] : [])].join(' ') })

const DRAFTS: Draft[] = [
  /* ---------- getting started ---------- */
  {
    id: 'how-start',
    theme: 'start',
    q: 'How do I start mining? Simple steps.',
    must: [
      'Copy your wallet address (60 uppercase letters, never the 55-letter seed); open the pool setup page and fill in OS, address, a QC. worker name, backend and threads; run the exact command it gives.',
      'Wait 20 minutes, then judge by solutions on the pool, not it/s.',
      'Download only from the setup page and ignore DM "helpers": a scam pattern seen 29 Sep and 1 Nov 2026.',
    ],
    more: 'Connect my machine in this app walks through it.',
    sources: ['guide', 'community'],
    asOf: 'Nov 2026',
    cite: `${DISCORD}, asked about 28 times, 31 Aug to 1 Nov 2026`,
  },
  {
    id: 'client-closes',
    theme: 'start',
    q: 'The miner closes right after it starts.',
    must: [
      'Usually an outdated build (a miner ran 3.8.10 while 3.9.1 was current, 6 Oct 2026, extracted into the wrong folder) or a file your antivirus removed.',
      'Download the current miner from the setup page into its own new folder, check the version it prints, and run it from a terminal so the error stays visible; paste it into Fix my rig.',
    ],
    more: 'Miners for other coins (SRB and the like) do not mine Qubic.',
    sources: ['community', 'guide'],
    asOf: 'Oct to Nov 2026',
    cite: `${DISCORD}, 5 Sep, 6 Oct and 1 Nov 2026`,
  },
  {
    id: 'update-miner',
    theme: 'start',
    q: 'How do I update or download the new miner version?',
    must: [
      'From the pool setup page only: download it again (or run the command it gives) into the miner folder, then restart once.',
      'Check the version the miner prints after every algorithm change: AutoUpdate failed for some workers on 2 to 4 Nov 2026 on another pool, and on Linux a service restart was the first step it suggested.',
    ],
    sources: ['guide', 'qli-team'],
    asOf: 'Nov 2026',
  },

  /* ---------- profitability ---------- */
  {
    id: 'value-per-solution',
    theme: 'profitability',
    q: 'Why is the value per solution so low or falling?',
    must: [
      'An epoch has a fixed reward, divided by all solutions found in it, weighted by score, valued at the QU price. More miners or a faster algorithm means more solutions, each worth less, including ones already found.',
      'Ant Colony (epoch 228) raised network solution counts about 50x (3.2K in epoch 227 to about 156K); the value per solution fell by a similar factor.',
      'In-epoch estimates are noise until about 80 to 90% of the epoch; only the payout is final.',
    ],
    sources: ['field', 'jetski-op', 'qli-team'],
    asOf: 'epochs 227 to 233, Sep to Oct 2026',
  },
  {
    id: 'estimate-drops',
    theme: 'profitability',
    q: 'The estimate keeps dropping during the epoch. Bug?',
    must: [
      'No. Later solutions dilute the ones already found, so their value falls too.',
      'In-epoch estimates are noise until about 80 to 90% of the epoch (a pool operator, 30 Sep 2026). Only the payout is final.',
    ],
    sources: ['jetski-op'],
    asOf: 'epoch 233, Oct 2026',
  },
  {
    id: 'worth-it',
    theme: 'profitability',
    q: 'Is mining worth it? Why no earnings forecast?',
    must: [
      'I do not project income, because nobody can: the fixed epoch reward is split over all weighted solutions, and that total, the pool\'s rules and the QU price are known only after the epoch.',
      'Measure your own cost per solution over one full epoch: daily cost / solutions per day.',
      'Algorithm-change epochs are the main risk, and from epoch 233 a pool\'s computor seats (ranked by best shift and error) mattered more than the rig (our epoch 233 notes, predates the E235/E236 changes). Miners reported losses in some epochs.',
    ],
    sources: ['cfb', 'community', 'field-e233'],
    asOf: 'epoch 233 to Nov 2026',
  },
  {
    id: 'big-payout',
    theme: 'profitability',
    q: 'Great night or epoch, then almost nothing. Normal?',
    must: [
      'Yes. Solutions come in bursts, and a harder branch can drop the rate to almost nothing for hours (a pool operator, 5 Oct 2026).',
      'A per-night amount on a dashboard is an in-epoch estimate that later solutions dilute; it is noise until about 80 to 90% of the epoch, and only the epoch payout is final.',
      'Judge full epochs, not a night. Changing the address mid-epoch splits the work between two addresses.',
    ],
    sources: ['jetski-op', 'community'],
    asOf: 'Sep to Nov 2026',
    cite: `${DISCORD}, 5 Oct 2026, the jetski operator (pool not recommended)`,
  },
  {
    id: 'per-day',
    theme: 'profitability',
    q: 'How much does a given CPU or GPU make per day?',
    must: [
      'I give no income figures. A QLI moderator said it is hard to say because results vary greatly (16 Aug 2026), and it changes every epoch.',
      'Run it one epoch, read your own solution count on the pool, and compute your cost per solution = daily cost / solutions per day.',
    ],
    sources: ['qli-team'],
    asOf: 'Aug to Nov 2026',
    cite: `${DISCORD}, 16 and 26 Aug 2026, Pomm3sgab3l (QLI)`,
  },
  {
    id: 'mine-or-buy',
    theme: 'profitability',
    q: 'Mine, or just buy QU instead?',
    must: [
      'That is a market question, and I give no buy or sell opinions.',
      'If you mine, judge it by your own cost per solution over one full epoch, never by in-epoch estimates.',
    ],
    sources: ['community'],
    asOf: 'Aug to Oct 2026',
  },

  /* ---------- hardware ---------- */
  {
    id: 'what-to-buy',
    theme: 'hardware',
    q: 'What PC to buy or build? Prebuilt or parts?',
    must: [
      'Home PC: an AVX-512 Ryzen 9 (7950X, 9950X) with one NVIDIA RTX 5070 Ti or better (Academy tiers); GPUs carried about 79% of one pool\'s solutions in epoch 233 (predates the E235/E236 changes).',
      'A QLI moderator (5 Oct 2026): 7950X3D and 9950X lead, 4090/5090 for GPUs but expensive, and parts bought separately cost less than a prebuilt.',
      'Feed each card: 12+ CPU threads per card, PCIe x8 or better, good cooling (our epoch 233 runs, predates the E235/E236 changes).',
    ],
    more: 'I give no capital-efficiency or return figures.',
    sources: ['academy', 'qli-team', 'field-e233', 'pool-lanes'],
    asOf: 'Mar to Oct 2026',
    cite: `${DISCORD}, 5 Oct 2026, Pomm3sgab3l (QLI)`,
  },
  {
    id: '5090',
    theme: 'hardware',
    q: 'RTX 5090 vs 4090 vs 5070 Ti or 5080?',
    must: [
      'Epoch 229: a 5090 cost about twice a 4090 to rent for about 10% more it/s, and a fresh 5090 rig at 154 it/s per card showed 0 solutions while a 5070 Ti at 80 had 133 (predates the E235/E236 changes).',
      'The ratio is not fixed: in epoch 236 a miner saw a 5090 find about 9x what an EPYC 9534 found (21 Oct 2026, reported).',
      'Epoch 233: 7x RTX 5080 matched 4x 4090 in sol/h at 58% of the rent, so about 1.7x cheaper per solution (predates the E235/E236 changes).',
    ],
    sources: ['field-e229', 'field-e233', 'community'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'x3d',
    theme: 'hardware',
    q: 'X or X3D? 9950X vs 7950X?',
    must: [
      'A QLI moderator named the 7950X3D and 9950X the best CPUs on 5 Oct 2026. A pool operator preferred X over X3D on 2025 algorithms (easier to overclock); the about 1.5x 9950X vs 7950X ratio is from 2025.',
      'There is no valid "normal it/s" across epochs: judge by solutions within one epoch. Not measured by us.',
    ],
    sources: ['jetski-op', 'qli-team', 'community'],
    asOf: '2025 to Oct 2026',
  },
  {
    id: 'threadripper',
    theme: 'hardware',
    q: 'Threadripper, EPYC or big Xeon: any good?',
    must: [
      'The Academy rates Threadripper 7000 and AVX-512 EPYC (9004/9005) highly; EPYC 7xx2/7xx3 such as the 7702 is AVX2 only. Use all threads (nproc) on a dedicated box.',
      'A miner said a Threadripper PRO 5975WX rig topped one pool\'s board (1 Sep 2026); a "half AVX-512" claim that day is unverified.',
      'A large CPU share needs a big AVX-512 CPU with few cards (our epoch 229 lesson, predates the E235/E236 changes). No CPU-only run of ours.',
    ],
    sources: ['academy', 'community', 'field-e229'],
    asOf: 'Sep 2026',
  },
  {
    id: 'cpu-only-rig',
    theme: 'hardware',
    q: 'Is a CPU-only rig a good idea now?',
    must: [
      'It still mines, but the data does not favour it: the CPU share of one pool\'s solutions fell from about 37% (epoch 229) to about 17% (epoch 233), GPUs about 79% (predates the E235/E236 changes).',
      'The Aug and Sep 2026 "CPU first" views (a QLI moderator 2 Aug, Cointribune Sep) predate Ant Colony; in epoch 236 a miner saw an RTX 5090 find about 9x what an EPYC 9534 found (21 Oct, reported).',
      'A big AVX-512 CPU helps most next to one or two NVIDIA cards (our epoch 229 runs, predates the E235/E236 changes).',
    ],
    sources: ['pool-lanes', 'field-e229', 'field-e233', 'qli-team', 'cointribune', 'community'],
    asOf: 'Aug to Oct 2026',
  },
  {
    id: 'old-gpu',
    theme: 'hardware',
    q: 'GTX 10 series, Tesla K80 or older cards: do they mine?',
    must: [
      'Treat GTX 10 series and older as unsupported: from epoch 237 (28 Oct 2026) a 1050 Ti CUDA worker kept exiting, and a K80 does not run on current CUDA (20 Oct). A QLI moderator said they would look; no fix by 4 Nov.',
      'The 5 Sep 2026 guide line "any NVIDIA from GTX 10xx" is outdated. There is no older-algorithm option.',
      'The CPU still mines.',
    ],
    sources: ['community', 'qli-team'],
    asOf: '20 Oct to 4 Nov 2026',
    cite: `${DISCORD}, 28 Oct 2026, Pomm3sgab3l (QLI)`,
  },
  {
    id: 'small-pc',
    theme: 'hardware',
    q: 'Mini PC, laptop or Intel desktop: any use?',
    must: [
      'It mines if the CPU has AVX2 or AVX-512, slowly; no measurement of ours. Intel without AVX-512 is generally slower (Academy). A miner reported about 2 it/s from a laptop (7 Sep 2026).',
      'Laptops and mini PCs run hot and are often poorly ventilated (31 Aug): leave two threads free, set a power limit, not 24/7. Judge by solutions.',
    ],
    sources: ['academy', 'community'],
    asOf: 'Aug to Nov 2026',
  },
  {
    id: 'motherboard',
    theme: 'hardware',
    q: 'Which motherboard or chipset?',
    must: [
      'No specific board needed; an inexpensive B650 does the same (QLI moderator, 4 Oct 2026).',
      'What matters: each card runs at PCIe x8 or better while mining (our epoch 229 runs, predates the E235/E236 changes), and on some boards an NVMe in the first M.2 slot shares lanes with the GPU slot. A Gen4 NVMe is enough (a miner, 4 Oct).',
    ],
    sources: ['qli-team', 'community', 'field-e229'],
    cite: `${DISCORD}, 4 Oct 2026, Pomm3sgab3l (QLI)`,
    asOf: 'Oct 2026',
  },
  {
    id: 'heat',
    theme: 'hardware',
    q: 'My card runs at 80 to 90 C. Too hot?',
    must: [
      'Not by itself: our RTX 4070 Super ran a hotspot of 82 to 89 C, which we treated as normal (epoch 229, 5 Sep 2026), and our 4x 5090 rig sat at 65 to 72 C at 100% use (30 Sep).',
      'Throttling means clocks dropping at 85 C or more; check with nvidia-smi -q -d PERFORMANCE (Thermal Slowdown: Active). Use under 50% means starvation, not heat.',
      'If it throttles: airflow and clean fans first, then a lower power limit, judged by sol/h (our runs, predates the E235/E236 changes).',
    ],
    sources: ['field-e229', 'field-e233'],
    asOf: 'Sep to Oct 2026',
  },

  /* ---------- CPU vs GPU ---------- */
  {
    id: 'tick-cpu',
    theme: 'cpu-gpu',
    q: 'GPU and CPU together, or GPU only? Enable GPU?',
    must: [
      'Enable the GPU if it is an NVIDIA card. With one or two cards next to an AVX-512 CPU, tick both: about 7 to 8% extra (epoch 229).',
      'Three or more cards: GPU only (6 cards plus CPU looped "Ant stream closed"). AVX2 CPUs added nearly nothing as a lane. A CPU-only machine still mines.',
      'Our epoch 229 runs, predates the E235/E236 changes.',
    ],
    sources: ['field-e229'],
    asOf: 'epoch 229, Sep 2026',
  },
  {
    id: 'cpu-or-gpu',
    theme: 'cpu-gpu',
    q: 'Which wins now, CPU or GPU?',
    must: [
      'GPUs, on the data we have: one pool\'s solutions in epoch 233 were about 79% CUDA, 17% AVX-512 CPU (predates the E235/E236 changes); in epoch 236 a miner saw a 5090 find about 9x what an EPYC 9534 found (21 Oct 2026).',
      'For CPU-only and home builds the AVX-512 tiers still apply (Academy, Cointribune, Sep 2026).',
    ],
    sources: ['academy', 'cointribune', 'pool-lanes', 'field-e233', 'community'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'threads',
    theme: 'cpu-gpu',
    q: 'How many CPU threads, per machine and per card?',
    must: [
      'On a dedicated box set Threads to the nproc count; on a PC you use, leave one or two free.',
      'On a GPU rig keep at least 12 threads per card; 2 to 3 cards per CPU was the ceiling, and more than 4 cards on a weak CPU fell behind on verification (our epoch 229/233 runs, predates the E235/E236 changes).',
      'Whether "-threads all" oversubscribes is suspected, not proven.',
    ],
    sources: ['field-e233', 'field-e229', 'guide'],
    asOf: 'epoch 233, Oct 2026',
  },
  {
    id: 'low-cpu-its',
    theme: 'cpu-gpu',
    q: 'Very low CPU it/s on a big CPU (1 to 5 it/s)?',
    must: [
      'Check the thread count first: CfB answered 2 it/s on an i9-13900 with "Running with single thread probably" (2 Aug 2026).',
      'Then the backend: AVX512 on AVX-512 CPUs (Auto if unsure); an AVX2 lane added little in our epoch 229 runs (predates the E235/E236 changes). A Ryzen 9 9900X at 0 it/s on AVX2 worked after forcing AVX512 (2 Oct 2026).',
    ],
    sources: ['cfb', 'community', 'field-e229'],
    asOf: 'Aug to Oct 2026',
    cite: `${DISCORD}, 2 Aug 2026, CfB`,
  },

  /* ---------- RAM ---------- */
  {
    id: 'ram-size',
    theme: 'ram',
    q: 'How much RAM?',
    must: [
      'Academy: 16 GB minimum, 32 GB recommended; 8 GB is not supported.',
      'Since 27 Sep 2026 about 3 GB per colony; our record rigs had 64 GB (epoch 233, predates the E235/E236 changes). Not re-measured at 32 neurons (epoch 236).',
    ],
    sources: ['devs', 'field-e233', 'academy'],
    asOf: '27 Sep to 4 Nov 2026',
  },
  {
    id: 'ram-speed',
    theme: 'ram',
    q: 'Dual channel or one stick? Does RAM speed matter?',
    must: ['Advice from before epoch 233: dual channel, DDR5 6000 CL30, speed over size.', 'We never measured RAM speed or channels against output.'],
    sources: ['jetski-op', 'community'],
    asOf: 'Mar to Jul 2026',
  },

  /* ---------- pool breakages ---------- */
  {
    id: 'me-or-pool',
    theme: 'breakage',
    q: 'Is it my rig or the pool? Is mining working now?',
    must: [
      'I cannot see live pool status. Check in order: the miner prints the current version, it ran 20+ minutes, the pool status channel, then the log in Fix my rig. If others report the same, it is the pool.',
      'After an algorithm change both 0 and very many shares are normal for at least 3 days (QLI, 29 Sep 2026); judge by the wallet total after the epoch, not one night.',
    ],
    more: 'Pools broke often: outages in epoch 231, 21 to 23 Oct and 2 to 4 Nov 2026.',
    sources: ['qli-team', 'community'],
    asOf: 'Sep to Nov 2026',
  },
  {
    id: 'wrong-workload',
    theme: 'breakage',
    q: 'Shares deleted or pool down: what happened?',
    must: [
      'Pools broke often: QLI rejected shares 12 to 13 Sep, was down 2 days in epoch 231 ("Parent LUT"), had 0-share releases 29 Sep to 3 Oct, and outages 21 to 23 Oct and 2 to 4 Nov 2026.',
      'For another pool\'s feature or a deletion there, ask in that pool\'s channel; keep a dashboard screenshot and your miner log from before the epoch ends.',
    ],
    sources: ['community', 'qli-mod', 'qli-team'],
    asOf: 'Sep to Nov 2026',
  },
  {
    id: 'kern-error',
    theme: 'breakage',
    q: 'kern_solve_cand_start not found in map, over and over?',
    must: [
      'No confirmed fix yet: 4 to 5 Windows NVIDIA miners reported it 9 to 14 Oct 2026 and nobody answered. Other pools\' GPU miners worked on the same cards, so it is one client\'s bug, not the card.',
      'Run the current miner from the setup page; mine CPU only meanwhile and report it with the log.',
    ],
    sources: ['community'],
    asOf: '9 to 14 Oct 2026, unanswered',
  },
  {
    id: 'many-rejected',
    theme: 'breakage',
    q: 'Lots of rejected shares. Why?',
    must: [
      'A few are normal: our record rig had R:9 in 14 h (0.03%) and one "orphaned" reject when the pool switched task (epoch 233, predates the E235/E236 changes). Many are not (QLI, 27 Aug 2026).',
      'Check in order: an outdated client (old clients sent only invalid shares, 1 Aug 2026), a second miner process, the pool side (one pool, 11 to 13 Sep 2026), and last a CPU too weak for the cards.',
    ],
    sources: ['field-e233', 'qli-team', 'community'],
    asOf: 'Aug to Oct 2026',
  },
  {
    id: 'hiveos-gaps',
    theme: 'breakage',
    q: 'HiveOS graph shows the miner off for periods?',
    must: [
      'Probably a HiveOS display or logging gap: two miners saw the same gaps at the same times (11 Sep 2026), not confirmed.',
      'Judge by the pool dashboard, the wallet total and the miner log. HiveOS sometimes needed a reboot to upgrade the miner (a miner, 1 Nov 2026).',
    ],
    sources: ['community'],
    asOf: 'Sep to Nov 2026',
  },
  {
    id: 'auto-update',
    theme: 'breakage',
    q: 'AutoUpdate ran, but the client is still old?',
    must: [
      'On 2 to 4 Nov 2026 a pool said its AutoUpdate worked on test machines but failed for some workers.',
      'Restart the miner service once; if the version it prints is still old, download the current miner from the setup page.',
    ],
    sources: ['qli-team'],
    asOf: '4 Nov 2026',
    cite: `${DISCORD}, 4 Nov 2026, Pomm3sgab3l (QLI)`,
  },

  /* ---------- missing shares ---------- */
  {
    id: 'where-from',
    theme: 'missing',
    q: 'Where do all these network shares come from?',
    must: ['Ant Colony multiplied network solution counts from epoch 228 (about 50x), and solutions come in bursts even for top rigs.', 'Nothing we have confirms private miners.'],
    sources: ['community'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'zero-new-algo',
    theme: 'missing',
    q: '0 shares since the new algorithm or update. Broken?',
    must: [
      'Probably not. After a change both 0 and very many shares are normal for at least 3 days (QLI, 29 Sep 2026), and Ant Colony takes longer: "you have to find a good branch" (27 Aug).',
      'Check in order: the current miner version, 20+ minutes run, the pool status channel, then the log in Fix my rig. If others report the same, it is pool side.',
    ],
    sources: ['qli-team'],
    asOf: '29 Sep to 4 Nov 2026',
    cite: `${DISCORD}, 27 Aug and 29 Sep 2026, Pomm3sgab3l (QLI)`,
  },
  {
    id: 'zero-solutions',
    theme: 'missing',
    q: 'My rig shows 0 solutions. Cancel or wait?',
    must: [
      '0 for 5 to 30 minutes on a fresh rig was normal in our runs (predates the E235/E236 changes): wait 20 minutes and until after "Ant work replaced".',
      'At 0 with normal it/s restart once and wait 10 more. Still 0: close a rental; on your own machine paste the log into Fix my rig.',
      'Check the pool status first: on 18 Oct 2026 many rigs sat at 0 at once.',
    ],
    sources: ['field-e229', 'field-e233', 'community'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'counter',
    theme: 'missing',
    q: 'Dashboard and miner disagree, or a worker is missing.',
    must: [
      'The worker counter resets on restart and lags (our runs, predates the E235/E236 changes); dashboards lagged and HiveOS graphs showed gaps in Sep 2026.',
      'Two machines on one worker name look like one dead worker: give each its own QC. name. The wallet total counts, not it/s.',
    ],
    sources: ['field-e229', 'field-e233', 'community'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'paid-less',
    theme: 'missing',
    q: 'Paid for far fewer shares than the pool showed.',
    must: [
      'Not necessarily deleted: pools weight shares by score (QLI, 6 Aug 2026), and in epoch 237 scores above 3125 counted for nothing (2 Nov). Lower scores are better.',
      'Keep your own log and a dashboard screenshot before the epoch ends, then ask the pool with that data.',
    ],
    sources: ['qli-team', 'community'],
    asOf: '6 Aug to 2 Nov 2026',
    cite: `${DISCORD}, 6 Aug 2026 Pomm3sgab3l (QLI); 2 Nov 2026 Zoxx (QLI)`,
  },

  /* ---------- payout ---------- */
  {
    id: 'when-paid',
    theme: 'payout',
    q: 'When do I get paid for an epoch?',
    must: [
      'Epochs run Wednesday 12:00 UTC to Wednesday. Rewards are calculated after the epoch and usually land about a week later, sometimes up to about 10 days (Sep to Nov 2026); the pool shows the pending payout and its date.',
      'One pool acknowledged late payouts for epochs 230 to 233 on 17 Oct 2026.',
    ],
    more: 'A candidate ID earns nothing in its first epoch.',
    sources: ['guide', 'qli-mod', 'qli-team', 'community'],
    asOf: 'Jul to Nov 2026',
    cite: `${DISCORD}, 2, 8 and 9 Sep 2026 Pomm3sgab3l (QLI); 29 Oct 2026 the jetski operator (pool not recommended)`,
  },
  {
    id: 'not-in-wallet',
    theme: 'payout',
    q: 'Dashboard says paid, nothing in my wallet?',
    must: [
      'Check the balance of the address itself, not only the transaction list: a miner saw a paid status before the transfer showed (30 Aug 2026).',
      'Check that the setup page has your 60-letter address. Still missing after the pool date: send the pool the epoch, worker name and a screenshot. Never the seed.',
    ],
    sources: ['community'],
    asOf: 'Aug to Oct 2026',
  },
  {
    id: 'irregular',
    theme: 'payout',
    q: 'Why were payouts irregular lately?',
    must: [
      'They came with algorithm changes and the seat contest: epoch 221 had no mining, epoch 231 broke a pool for 2 days, epoch 233 was a seat war.',
      'One pool acknowledged late payouts for epochs 230 to 233 on 17 Oct 2026. Keep rentals flexible.',
    ],
    sources: ['qli-mod', 'community', 'qli-team'],
    asOf: 'Jul to Oct 2026',
  },
  {
    id: 'switch-pool',
    theme: 'payout',
    q: 'Switching pool or address mid-epoch?',
    must: [
      'Each pool pays each address for its own work; a miner who changed address mid-epoch got the early part paid to the old one (29 Oct 2026).',
      'Ask the pool you leave how it counts a partial epoch.',
    ],
    sources: ['community'],
    asOf: 'Oct 2026',
  },
  {
    id: 'solo-pool',
    theme: 'payout',
    q: 'Solo, PPS or PPLNS?',
    must: [
      'Solo is a lottery for one rig: a pool pays for weighted shares across many. QLI dropped solo for PPS in Aug 2026.',
      'This pool calculates rewards after each epoch; its terms on the setup page and pool page set its mode. I do not compare modes in income terms.',
    ],
    sources: ['qli-team', 'guide'],
    asOf: 'Aug to Nov 2026',
    cite: `${DISCORD}, 6 Aug 2026 Pomm3sgab3l (QLI)`,
  },

  /* ---------- algorithm changes ---------- */
  {
    id: 'miner-valid',
    theme: 'algo',
    q: 'New algorithm: is my miner still valid?',
    must: [
      'No: a new algorithm needs a new miner, and an old one shows it/s for work that no longer counts. Get the current miner from the setup page and check the version it prints.',
      'Epoch 233 needed a new binary, epoch 235 changed the threshold and task file, epoch 236 moved to 32 neurons, epoch 237 brought new workers.',
    ],
    sources: ['community', 'field', 'qli-team'],
    asOf: 'Aug to Nov 2026',
  },
  {
    id: 'epoch-change',
    theme: 'algo',
    q: 'New epoch: do I need to do anything or stop?',
    must: [
      'Nothing. At Wednesday 12:00 UTC the miner idles until the backend updates: "Just wait until the backend has received the update" (QLI moderator, 9 Sep 2026), and an idle miner wastes no power.',
      'Do not restart it in a loop. After an algorithm change, check the miner version; the previous epoch still pays about a week later.',
    ],
    sources: ['qli-team', 'guide'],
    asOf: 'Sep to Nov 2026',
    cite: `${DISCORD}, 9 Sep 2026, Pomm3sgab3l (QLI)`,
  },
  {
    id: 'score',
    theme: 'algo',
    q: 'What score is good? Higher or lower?',
    must: [
      'Lower is better: the score measures error. In epoch 237 scores above 3125 counted for nothing (QLI moderator, 2 Nov 2026).',
      'The threshold moves with each epoch and algorithm; ask the pool for the current one.',
    ],
    sources: ['qli-team', 'community'],
    asOf: 'Oct to Nov 2026',
    cite: `${DISCORD}, 2 Nov 2026, Zoxx (QLI)`,
  },
  {
    id: 'rent-before-change',
    theme: 'algo',
    q: 'Keep renting across an algorithm change?',
    must: [
      'Avoid long rentals across a change: a miner reported almost nothing from a 5-day rental in epoch 226, an algorithm-change epoch.',
      'After the switch apply the 20-minute rule again, and expect up to 3 days to settle (QLI, 29 Sep 2026).',
    ],
    sources: ['community', 'qli-team'],
    asOf: 'Aug to Oct 2026',
  },
  {
    id: 'accuracy',
    theme: 'algo',
    q: 'What changes with prediction accuracy?',
    must: [
      'CfB (20 Oct 2026): qualification moves to prediction accuracy after the live feed (epoch 240, 18 Nov; accuracy from about epoch 241); ANN cloning and the RAM selector stop working.',
      'Unknown: whether hashrate or solution counts still matter. All our data predates it.',
    ],
    sources: ['cfb'],
    asOf: '20 Oct 2026',
  },

  /* ---------- AMD, Mac, ARM, phones ---------- */
  {
    id: 'amd',
    theme: 'amd',
    q: 'Can I mine with an AMD GPU?',
    must: [
      'No measurements from us. Support depends on the pool\'s miner: QLI moderators said on 30 Jul and 1 Aug 2026 that an AMD GPU miner would come later; none was confirmed released by 4 Nov.',
      'NVIDIA/CUDA is the proven path. Check which backends the setup page offers.',
    ],
    sources: ['qli-mod', 'qli-team', 'community'],
    asOf: 'Jul to Nov 2026',
    cite: `${DISCORD}, 30 Jul 2026 Pomm3sgab3l (QLI); 1 Aug 2026 Zoxx (QLI)`,
  },
  {
    id: 'mac',
    theme: 'arm-mac',
    q: 'Can I mine on a Mac?',
    must: [
      'Yes, on the CPU via the pool macOS miner from the setup page, slowly (pool page: about 40 it/s on an M3 Pro, 23 Oct 2026, est.). No measurement of ours, no Metal GPU mining.',
      'Elsewhere Mac and ARM mining was fragile in Sep to Oct 2026 (Docker images, a new ARM64 build per algorithm). Judge by solutions, not it/s.',
    ],
    sources: ['partner', 'community', 'qli-team'],
    asOf: 'Oct 2026',
  },
  {
    id: 'arm',
    theme: 'arm-mac',
    q: 'ARM or Linux ARM64 support?',
    must: [
      'A QLI moderator (24 Sep 2026): ARM64 via a Docker Linux image with "cpuVersion": "ARM64" in appsettings.json, and a new ARM64 build for every algorithm.',
      'On 10 Oct a pool still sent ARM64 Linux an Android worker (client issue #136). No confirmed ARM payout, no measurement.',
    ],
    sources: ['qli-team', 'community'],
    asOf: '24 Sep to 10 Oct 2026',
    cite: `${DISCORD}, 24 Sep 2026, Zoxx (QLI)`,
  },
  {
    id: 'android',
    theme: 'mobile',
    q: 'Can I mine on my Android phone? Where is the APK?',
    must: [
      'Not on this pool: its setup page offers Linux, macOS, Windows and HiveOS; use a PC or a server.',
      'Another pool released an Android beta (22 Aug 2026); phones were erratic there (days at 0, most shares invalid, Oct 2026), and "Authentication failed" was a blacklist for too many shares too fast (2 Oct), per its moderator. For that APK, ask that pool.',
    ],
    sources: ['qli-team', 'community'],
    asOf: 'Aug to Oct 2026',
    cite: `${DISCORD}, 22 Aug, 2 Oct and 21 Oct 2026, Pomm3sgab3l (QLI)`,
  },

  /* ---------- rentals ---------- */
  {
    id: 'how-rent',
    theme: 'rentals',
    q: 'How do I rent a rig? Which OS or image?',
    must: [
      'Clore on-demand, not spot (spot is interruptible); the first 10 minutes waive the creation fee. An Ubuntu image with CUDA 12 or newer (12.4+ for RTX 50); never install drivers or reboot inside the container.',
      'Put the setup page command into the on-start command so it runs detached; give each box its own QC. worker name; extend before the max rental time.',
      'Our Clore runs, predates the E235/E236 changes; Vast and OctaSpace not measured.',
    ],
    sources: ['field-e229', 'field-e233'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'what-to-rent',
    theme: 'rentals',
    q: 'What to rent, and which filters?',
    must: [
      'Filters: on-demand, 98%+ host reliability, PCIe 4.0 x8 or 3.0 x16 (no x1 risers), 12+ CPU threads per card on a recent server CPU, the host power limit, 12 h+ max rental time.',
      'In epoch 233 16 GB RTX 5080s were the best value per solution, rented cheap because 16 GB is too small for AI jobs; aim for about 8 US dollars a day or less per 16 GB card (Oct 2026 market).',
      'Our Clore runs, predates the E235/E236 changes; 16 GB VRAM not re-checked since the 32-neuron change.',
    ],
    sources: ['field-e229', 'field-e233'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'templates',
    theme: 'rentals',
    q: 'Rental templates: which app or image to pick?',
    must: [
      'A marketplace template name is the marketplace\'s label (a "qtc mining" label on OctaSpace was probably a typo, a miner said 16 Sep 2026); qubjetski (not recommended here) is another pool\'s miner.',
      'What matters: the start command is the one from this pool\'s setup page. Then check the dashboard after 20 minutes. OctaSpace not measured by us.',
    ],
    sources: ['community', 'guide'],
    asOf: 'Sep 2026',
  },
  {
    id: 'avoid-hosts',
    theme: 'rentals',
    q: 'Which hosts or regions to avoid?',
    must: [
      'Host 24255 throttled every card, and cheap multi-card boxes are often x1 risers with a Celeron (epoch 229, predates the E235/E236 changes).',
      'Regions: in epoch 229 hosts in Russia and Belarus could not reach the jetski endpoints and a China terminal hung; that is another pool and stale, and this pool was never tested by region. Run a 10-minute test in any new region.',
    ],
    sources: ['field-e229'],
    asOf: 'epoch 229, Sep 2026',
  },
  {
    id: 'died-overnight',
    theme: 'rentals',
    q: 'Rented rig stopped overnight? Can I close my laptop?',
    must: [
      'Yes, a rental is a remote machine, if the miner was started detached on the server (on-start command, nohup or systemd).',
      'Started in a browser terminal it dies with it: three of our four rigs did on 6 Sep 2026 (epoch 229, predates the E235/E236 changes).',
    ],
    sources: ['field-e229'],
    asOf: 'epoch 229, Sep 2026',
  },
  {
    id: 'rent-worth',
    theme: 'rentals',
    q: 'Is renting worth it?',
    must: [
      'I do not project income. A QLI moderator warned the network mining power can rise and you get fewer coins than you expect (7 Sep 2026).',
      'Self-check: cost per solution = daily rent / solutions per day over 6 to 12 hours; compare options by that. Close 0-solution rigs; avoid renting across algorithm changes.',
      'Miners reported losses in some epochs (14 Sep, 18 Oct 2026).',
    ],
    sources: ['qli-team', 'community'],
    asOf: 'Sep to Oct 2026',
  },

  /* ---------- trust ---------- */
  {
    id: 'which-pool',
    theme: 'trust',
    q: 'Which pool is best right now?',
    must: [
      'I recommend only Qubic Church Pool and do not rank others; its setup page has the command.',
      'Share counts do not compare between pools: "Every pool has its own parameters and its own share system" (QLI, 23 Sep 2026). The only fair comparison is the wallet total for the same rig over full epochs.',
    ],
    sources: ['qli-team'],
    asOf: 'Sep to Nov 2026',
    cite: `${DISCORD}, 23 Sep 2026, Pomm3sgab3l (QLI)`,
  },
  {
    id: 'pool-power',
    theme: 'trust',
    q: 'Pools have too much power? Which pools still run?',
    must: [
      'Pools do not set the value of a solution; the epoch reward and total solutions do.',
      'Apool closed withdrawals on 31 Aug 2026 and MinerLab was no longer active by 2 Nov, when a QLI moderator counted "2 public and one independent" pools. Fees are public.',
    ],
    sources: ['community', 'qli-team'],
    asOf: 'Aug to Nov 2026',
    cite: `${DISCORD}, 27 Aug and 2 Nov 2026, Zoxx (QLI)`,
  },
  {
    id: 'jetski-status',
    theme: 'trust',
    q: 'Is jetski still running?',
    must: [
      'I recommend only Qubic Church Pool, so jetski is not recommended here. Dated facts: its operator said on 18 Sep 2026 that Qubic support might be paused and that it has no ARM support.',
      'It kept operating: a new miner by 5 Oct, epoch 236 payout set for 4 Nov, replies to miners until 2 Nov.',
    ],
    sources: ['jetski-op'],
    asOf: '18 Sep to 3 Nov 2026',
    cite: `${DISCORD}, 18 Sep, 5 Oct, 29 Oct and 2 Nov 2026, the jetski operator`,
  },
  {
    id: 'insider',
    theme: 'trust',
    q: 'Does one pool have an insider advantage?',
    must: ['Claims went both ways in Oct and Nov 2026, including pay gaps between pools and "chosen ones". None verified.', 'We have no same-rig comparison.'],
    sources: ['community'],
    asOf: 'Oct to Nov 2026, unverified',
  },
  {
    id: 'scam-dm',
    theme: 'trust',
    q: 'Someone DMs offering to set up my miner. Safe?',
    must: [
      'No. Support warned of scammers and fake helpers (29 Sep 2026), and DM offers followed setup questions (Nov 2026).',
      'Nobody legitimate asks for your seed or remote access. Download the miner only from the pool setup page.',
    ],
    sources: ['community'],
    asOf: 'Sep to Nov 2026',
  },
  {
    id: 'asic',
    theme: 'trust',
    q: 'Can ASICs mine Qubic?',
    must: ['No. CfB (21 Sep 2026): "No, we use algo not implemented by ASIC".', 'Qubic mines Dogecoin on ASICs separately (since 1 Apr 2026).'],
    sources: ['cfb', 'doge'],
    asOf: 'Sep 2026',
    cite: `${DISCORD}, 21 Sep 2026, CfB`,
  },

  /* ---------- tuning ---------- */
  {
    id: 'overclock',
    theme: 'tuning',
    q: 'Overclock or tuning values for my card?',
    must: [
      'No measured OC values. QLI (27 Aug 2026): OC can behave differently on Ant Colony, try GPUs without OC first; a QLI moderator warned careless OC breaks hardware (5 Sep).',
      'Safer levers: stock clocks, PCIe x8 or better and 12+ CPU threads per card, then a lower power limit (hosts ran 5080s at 250 W and our record rig ran there, epoch 233, predates the E235/E236 changes).',
      'Change one setting at a time; keep it if sol/h holds.',
    ],
    sources: ['field-e233', 'qli-mod', 'qli-team'],
    asOf: 'Aug to Oct 2026',
    cite: `${DISCORD}, 27 Aug and 5 Sep 2026, Pomm3sgab3l (QLI)`,
  },
  {
    id: 'power-limit',
    theme: 'tuning',
    q: 'Does a power limit cost output?',
    must: [
      'Measured: hosts cut RTX 5080s to 250 W (stock 360) and 5090s to 400 W (stock 575), and our record 7x 5080 rig ran at 250 W per card (epoch 233, 3 Oct 2026, predates the E235/E236 changes).',
      'No same-card A/B was measured. Pick a lower value inside the range nvidia-smi -q -d POWER shows, run it for hours, keep it if sol/h holds.',
    ],
    sources: ['field-e233'],
    asOf: 'Oct 2026',
  },
  {
    id: 'driver',
    theme: 'tuning',
    q: 'Which NVIDIA driver and CUDA?',
    must: [
      'No tested driver minimum for the current miner. Our epoch 229 and 233 rigs ran CUDA 13.0 to 13.2 (predates the E235/E236 changes); on Clore, RTX 50 cards needed CUDA 12.4+ images (6 Sep 2026).',
      'Rental: pick the image, do not install drivers. Own machine: a current driver, then the setup page miner.',
    ],
    more: 'ReBAR: no Qubic measurement.',
    sources: ['field-e229', 'field-e233'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'gpu-unlock',
    theme: 'tuning',
    q: 'Should I run the gpu-unlock tool on RTX 30/40?',
    must: [
      'Not recommended. It is a third-party tool shared on 24 Oct 2026; the gains posted were BF16 and TF32 benchmarks, not solutions, and it changes how the driver runs the card.',
      'If you try it anyway, measure solutions per hour before and after on one rig.',
    ],
    sources: ['community', 'qli-team'],
    asOf: '24 to 25 Oct 2026',
  },
]

export const FAQ: FaqEntry[] = DRAFTS.map(entry)

export const faqByTheme = (theme: FaqTheme) => FAQ.filter(e => e.theme === theme)
