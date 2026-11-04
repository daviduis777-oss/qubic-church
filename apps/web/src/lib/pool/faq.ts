/**
 * What real miners ask, by theme, with the best factual answer we have, its sources and the date it was
 * true. Questions are in the miners' own words (short, no handles) or paraphrased. Maria's prompt
 * (prompt.ts) and the Discord card (scripts/pool-card.mts) read from here.
 *
 * Rules for this file: no income, profit or projection figures; losses only as "miners reported losses";
 * every field fact carries its epoch; only Qubic Church Pool is recommended, jetski only with its dated status and
 * "not recommended"; the partner pool is not named. Community members
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
  /** the question as miners ask it, short */
  q: string
  /** the best factual answer we have; says so when we do not know */
  a: string
  sources: SourceId[]
  /** when the answer was true, e.g. "epoch 233, Oct 2026" */
  asOf: string
  /** where in the Discord the answer comes from: "Qubic Discord #mining-general, <date>, <Tier 1 handle>" */
  cite?: string
}

const DISCORD = 'Qubic Discord #mining-general'

export const FAQ: FaqEntry[] = [
  {
    id: 'how-start',
    theme: 'start',
    q: 'How do I start mining? Simple steps please.',
    a: '1) Copy your wallet address (60 uppercase letters, never the seed). 2) Open the pool setup page: OS, address, a QC. worker name, backend, threads. 3) Run the exact command it gives. 4) Wait 20 minutes. 5) Judge by solutions on the pool. Connect my machine walks you through it.',
    sources: ['guide'],
    asOf: 'Nov 2026',
    cite: `${DISCORD}, asked about 28 times, 31 Aug to 1 Nov 2026`,
  },
  {
    id: 'client-closes',
    theme: 'start',
    q: 'Miner closes right after it starts?',
    a: 'Usually an outdated build (one was 3.8.10 while 3.9.1 was current, 6 Oct 2026) or a file removed by antivirus. Download the current miner into its own folder, run it from a terminal, paste the error into Fix my rig. Miners for other coins do not mine Qubic.',
    sources: ['community', 'guide'],
    asOf: 'Oct to Nov 2026',
    cite: `${DISCORD}, 5 Sep, 6 Oct and 1 Nov 2026`,
  },
  {
    id: 'value-per-solution',
    theme: 'profitability',
    q: 'Why is my income per sol so low now?',
    a: 'An epoch has a fixed reward, divided by all solutions found in it, weighted by score, valued at the QU price. More miners or a faster algorithm means more solutions, each worth less. Ant Colony (epoch 228) raised solution counts about 50x; the value per solution fell by a similar factor.',
    sources: ['field-e229', 'jetski-op', 'qli-team'],
    asOf: 'epochs 227 to 229, Sep 2026',
  },
  {
    id: 'estimate-drops',
    theme: 'profitability',
    q: 'The estimate keeps dropping during the epoch. Bug?',
    a: 'No. Later solutions dilute the ones already found, so their value falls too. In-epoch estimates are noise until about 80 to 90% of the epoch.',
    sources: ['jetski-op', 'field-e233'],
    asOf: 'epoch 233, Oct 2026',
  },
  {
    id: 'worth-it',
    theme: 'profitability',
    q: 'Is there any point mining Qubic right now?',
    a: "We do not project income; measure your own cost per solution over one epoch. From epoch 233 income depended more on whether the pool's IDs won computor seats (ranked by best shift and error, not solution count) than on the rig. Algorithm-change epochs are the main risk. Miners reported losses in some epochs.",
    sources: ['field-e233', 'cfb', 'community'],
    asOf: 'epoch 233, Oct 2026',
  },
  {
    id: 'big-payout',
    theme: 'profitability',
    q: 'Great night or epoch, then almost nothing. Normal?',
    a: "Yes. Solutions come in bursts, a harder branch can drop the rate to almost nothing for hours (a pool operator, 5 Oct 2026), and late solutions are worth less. Payouts also swing with the network's total solutions, the pool's seats and the QU price. Judge full epochs, not a night.",
    sources: ['jetski-op', 'community', 'field-e233'],
    asOf: 'Sep to Nov 2026',
    cite: `${DISCORD}, 5 Oct 2026, the jetski operator (pool not recommended)`,
  },
  {
    id: 'per-day',
    theme: 'profitability',
    q: 'How much does a 9950X make per day?',
    a: 'We give no income figures, and we have no measured sol/h for any CPU-only rig. A QLI moderator said it is hard to say because results vary greatly, week to week (16 Aug 2026). Run it one epoch and read your own count on the pool.',
    sources: ['field', 'qli-team'],
    asOf: 'Aug to Nov 2026',
    cite: `${DISCORD}, 16 and 26 Aug 2026, Pomm3sgab3l (QLI)`,
  },
  {
    id: 'mine-or-buy',
    theme: 'profitability',
    q: 'Mine, or just buy QU instead?',
    a: 'That is a market question, and Maria gives no buy or sell opinions. Mining adds compute to the network; if you mine, judge it by your own cost per solution over one full epoch, never by in-epoch estimates.',
    sources: ['community'],
    asOf: 'Aug to Oct 2026',
  },
  {
    id: 'what-to-buy',
    theme: 'hardware',
    q: 'What to buy, which PC to choose?',
    a: 'Home PC: an AVX-512 Ryzen 9 (7950X, 9950X) with one RTX 5070 Ti, in line with the Academy. A QLI moderator (5 Oct 2026): 7950X3D and 9950X lead, 4090/5090 for GPUs but expensive, and parts bought separately cost less than a prebuilt. In our runs the platform beat the card tier.',
    sources: ['academy', 'qli-team', 'field-e233'],
    asOf: 'Mar to Oct 2026',
    cite: `${DISCORD}, 5 Oct 2026, Pomm3sgab3l (QLI)`,
  },
  {
    id: '5090',
    theme: 'hardware',
    q: 'Is a 5090 worth it over a 4090?',
    a: 'Epoch 229: about twice the rent of a 4090 for about 10% more it/s, and a fresh 5090 rig at 154 it/s per card showed 0 solutions while a 5070 Ti at 80 had 133. Epoch 233: our 4x 5090 rig ran CPU-starved. No run of a well-fed 5090 since.',
    sources: ['field-e229', 'field-e233'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'x3d',
    theme: 'hardware',
    q: 'x3d? 9900x vs 7950x?',
    a: 'A pool operator preferred X over X3D on 2025 algorithms; a QLI moderator named the 7950X3D and 9950X the best CPUs on 5 Oct 2026. Miners found the comparison swung with each algorithm change. Not measured by us.',
    sources: ['jetski-op', 'qli-team', 'community'],
    asOf: '2025 to Oct 2026',
  },
  {
    id: 'old-gpu',
    theme: 'hardware',
    q: 'GTX 1050 Ti or Tesla K80, do they still mine?',
    a: 'Treat GTX 10 series and older as unsupported: from epoch 237 (28 Oct 2026) a 1050 Ti CUDA worker kept exiting, and a K80 does not run on current CUDA. A QLI moderator said they would look into it. The CPU still mines.',
    sources: ['community', 'qli-team'],
    asOf: '20 to 28 Oct 2026',
    cite: `${DISCORD}, 28 Oct 2026, Pomm3sgab3l (QLI)`,
  },
  {
    id: 'small-pc',
    theme: 'hardware',
    q: 'Mini PC or laptop, any use?',
    a: 'It mines if the CPU has AVX2 or AVX-512, slowly: a QLI moderator expected six mini PCs to do very little (5 Oct 2026). Laptops throttle: leave two threads free, keep it cool. A very low it/s on a big CPU usually means too few threads (CfB, 2 Aug 2026).',
    sources: ['academy', 'cfb', 'field-e233'],
    asOf: 'Aug to Nov 2026',
    cite: `${DISCORD}, 2 Aug 2026, CfB`,
  },
  {
    id: 'motherboard',
    theme: 'hardware',
    q: 'Which motherboard for a 9950X and a 5070 Ti?',
    a: 'No specific board needed; an inexpensive B650 does the same (QLI moderator, 4 Oct 2026). What matters: the card runs at PCIe x8 or better while mining, and on some boards an NVMe drive in the first M.2 slot shares lanes with the GPU slot.',
    sources: ['qli-team', 'community', 'field-e229'],
    cite: `${DISCORD}, 4 Oct 2026, Pomm3sgab3l (QLI)`,
    asOf: 'Oct 2026',
  },
  {
    id: 'tick-cpu',
    theme: 'cpu-gpu',
    q: 'GPU+CPU, or GPU only?',
    a: 'One or two cards with an AVX-512 Ryzen: both, worth about 7 to 8% (epoch 229); AVX2 CPUs added nearly nothing. Three or more cards: GPU only.',
    sources: ['field-e229'],
    asOf: 'epoch 229, Sep 2026',
  },
  {
    id: 'cpu-or-gpu',
    theme: 'cpu-gpu',
    q: 'Best hashrate from CPU, not GPU?',
    a: 'CPU-only and home builds: AVX-512 CPUs rate highly (Academy, Cointribune, Sep 2026). GPU rigs: the CPU share of pool solutions fell to about 17% by epoch 233, and in epoch 236 a miner saw a 5090 find about 9x what an EPYC 9534 found.',
    sources: ['academy', 'cointribune', 'pool-lanes', 'field-e233', 'community'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'threads',
    theme: 'cpu-gpu',
    q: 'How many CPU threads per card?',
    a: 'At least 12 per card (epoch 233). On a dedicated box set Threads to the nproc count. More than 4 cards on a weak CPU fell behind on verification. "-threads all" oversubscribing is suspected, not proven.',
    sources: ['field-e233', 'guide'],
    asOf: 'epoch 233, Oct 2026',
  },
  {
    id: 'ram-size',
    theme: 'ram',
    q: 'RAM matters? How much?',
    a: 'Academy: 16 GB minimum, 32 GB recommended. Since 27 Sep 2026 about 3 GB per colony; our record rigs had 64 GB. Not re-measured at 32 neurons (epoch 236). A guide claim that 8 GB is enough is not confirmed.',
    sources: ['devs', 'field-e233', 'academy'],
    asOf: '27 Sep to 4 Nov 2026',
  },
  {
    id: 'ram-speed',
    theme: 'ram',
    q: 'Dual channel or one stick? Does speed matter?',
    a: 'Advice from before epoch 233: dual channel, DDR5 6000 CL30, speed over size. We never measured it.',
    sources: ['jetski-op', 'community'],
    asOf: 'Mar to Jul 2026',
  },
  {
    id: 'wrong-workload',
    theme: 'breakage',
    q: 'My shares got deleted, no pool sends the right workload?',
    a: 'Pools broke often: QLI rejected shares 12 to 13 Sep, was down 2 days in epoch 231 ("Parent LUT"), had 0-share releases 29 Sep to 3 Oct, and outages 21 to 23 Oct and 2 to 4 Nov 2026. After an algorithm change stale clients show hashrate but invalid shares.',
    sources: ['community', 'qli-mod', 'qli-team'],
    asOf: 'Sep to Nov 2026',
  },
  {
    id: 'kern-error',
    theme: 'breakage',
    q: 'kern_solve_cand_start not found in map, over and over?',
    a: "A GPU trainer error seen on Windows with NVIDIA cards on one pool's client, 9 to 14 Oct 2026; other pools' GPU miners worked on the same cards and no fix was posted. The card mines nothing while it repeats. Update the miner and driver, restart once; if it persists, mine CPU only and report it.",
    sources: ['community'],
    asOf: '9 to 14 Oct 2026, unanswered',
  },
  {
    id: 'auto-update',
    theme: 'breakage',
    q: 'AutoUpdate ran, but the client is still old?',
    a: 'On 2 to 4 Nov 2026 a pool said its AutoUpdate worked on test machines but failed for some workers. After every algorithm change check the version the miner prints. Restart the miner service once; if the version is still old, download the current miner from the setup page.',
    sources: ['qli-team'],
    asOf: '4 Nov 2026',
    cite: `${DISCORD}, 4 Nov 2026, Pomm3sgab3l (QLI)`,
  },
  {
    id: 'where-from',
    theme: 'missing',
    q: 'Where are all these shares coming from?',
    a: 'Ant Colony multiplied network solution counts from epoch 228, and solutions come in bursts even for top rigs. Nothing we have confirms private miners.',
    sources: ['field-e233', 'community'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'zero-new-algo',
    theme: 'missing',
    q: '0 shares since the new algorithm or epoch. Broken?',
    a: 'Probably not. After a change both 0 and very high share counts are normal for at least 3 days (QLI, 29 Sep 2026), and Ant Colony takes longer: "you have to find a good branch" (27 Aug). Check in order: current miner version, 20+ minutes run, the pool status channel, then the log in Fix my rig.',
    sources: ['qli-team', 'field-e233'],
    asOf: '29 Sep to 4 Nov 2026',
    cite: `${DISCORD}, 27 Aug and 29 Sep 2026, Pomm3sgab3l (QLI)`,
  },
  {
    id: 'zero-solutions',
    theme: 'missing',
    q: 'My rig shows 0 solutions. Broken?',
    a: 'A fresh rig at 0 for 2 to 30 minutes is normal. After 20 minutes at 0 with normal it/s, restart once and wait 10 more; still 0, close it (rentals too). First check the pool status: on 18 Oct 2026 many rigs sat at 0 at once.',
    sources: ['field-e229', 'field-e233', 'community'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'counter',
    theme: 'missing',
    q: 'Worker counter does not match the pool. What did I get?',
    a: 'The worker counter resets on restart and lags; pool dashboards lagged and HiveOS graphs showed gaps in Sep 2026 (display only). Two machines on one worker name look like one dead worker: a pool operator asked for a unique name per worker (9 Sep). The wallet total counts, not it/s.',
    sources: ['field-e229', 'field-e233', 'community', 'jetski-op'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'paid-less',
    theme: 'missing',
    q: 'Pool showed 1,000 shares, paid for 25. Deleted?',
    a: 'Not necessarily: pools weight shares by score (QLI, 6 Aug 2026), and in epoch 237 scores above 3125 counted for nothing (2 Nov). Keep your own log and a dashboard screenshot before the epoch ends, then ask the pool with that data.',
    sources: ['qli-team', 'community'],
    asOf: '6 Aug to 2 Nov 2026',
    cite: `${DISCORD}, 6 Aug 2026 Pomm3sgab3l (QLI); 2 Nov 2026 Zoxx (QLI)`,
  },
  {
    id: 'when-paid',
    theme: 'payout',
    q: 'When do I get paid?',
    a: "Epochs run Wednesday 12:00 UTC to Wednesday. Rewards are calculated after the epoch and usually land about a week later, sometimes up to about 10 days (Sep to Nov 2026); the pool shows the pending payout. A candidate ID earns nothing in its first epoch.",
    sources: ['guide', 'qli-mod', 'qli-team', 'community'],
    asOf: 'Jul to Nov 2026',
    cite: `${DISCORD}, 2, 8 and 9 Sep 2026 Pomm3sgab3l (QLI); 29 Oct 2026 the jetski operator (pool not recommended)`,
  },
  {
    id: 'not-in-wallet',
    theme: 'payout',
    q: 'Dashboard says paid, nothing in my wallet?',
    a: 'Check the balance of the address itself, not only the transaction list: a miner saw a paid status before the transfer showed (30 Aug 2026). Check that the setup page has your 60-letter address. Still missing after the pool date: send the pool the epoch, worker name and a screenshot. Never the seed.',
    sources: ['community'],
    asOf: 'Aug to Oct 2026',
  },
  {
    id: 'irregular',
    theme: 'payout',
    q: 'Payment irregularities lately are new?',
    a: 'They came with algorithm changes and the seat contest: epoch 221 had no mining, epoch 231 broke a pool for 2 days, epoch 233 was a seat war, and one miner reported epochs 230 to 233 unpaid for weeks (Oct 2026). Keep rentals flexible.',
    sources: ['qli-mod', 'community', 'field-e233'],
    asOf: 'Jul to Oct 2026',
  },
  {
    id: 'switch-pool',
    theme: 'payout',
    q: 'What happens if I switch pool or address mid-epoch?',
    a: 'Each pool pays each address for its own work; a miner who changed address mid-epoch got the early part paid to the old one (29 Oct 2026). Ask the pool you leave how it counts a partial epoch.',
    sources: ['community'],
    asOf: 'Oct 2026',
  },
  {
    id: 'solo-pool',
    theme: 'payout',
    q: 'Solo, PPS or PPLNS?',
    a: 'Solo is a lottery for one rig. QLI dropped solo for PPS in Aug 2026, and a QLI moderator said on 2 Nov that high scores count for nothing, which is why pooling helps. This pool calculates rewards after each epoch; we do not compare modes in income terms.',
    sources: ['qli-team'],
    asOf: 'Aug to Nov 2026',
    cite: `${DISCORD}, 6 Aug 2026 Pomm3sgab3l (QLI); 2 Nov 2026 Zoxx (QLI)`,
  },
  {
    id: 'miner-valid',
    theme: 'algo',
    q: 'New algo next week. Is my miner still valid?',
    a: 'No: a new algorithm needs a new miner, and an old one shows it/s for work that no longer counts. Epoch 233 needed a new binary, epoch 235 changed the threshold and task file, epoch 236 moved to 32 neurons, epoch 237 brought new workers. Get the current miner from the setup page.',
    sources: ['community', 'field', 'qli-team'],
    asOf: 'Aug to Nov 2026',
  },
  {
    id: 'epoch-change',
    theme: 'algo',
    q: 'New epoch: do I need to do anything or stop?',
    a: 'Nothing. At Wednesday 12:00 UTC the miner idles until the backend updates: "Just wait until the backend has received the update" (QLI moderator, 9 Sep 2026), and an idle miner wastes no power. Do not restart it in a loop. After an algorithm change, check the miner version.',
    sources: ['qli-team', 'guide'],
    asOf: 'Sep to Nov 2026',
    cite: `${DISCORD}, 9 Sep 2026, Pomm3sgab3l (QLI)`,
  },
  {
    id: 'score',
    theme: 'algo',
    q: 'What score is good? Higher or lower?',
    a: 'Lower is better: the score measures error. In epoch 237 scores above 3125 counted for nothing (QLI moderator, 2 Nov 2026). The threshold moves with each epoch and algorithm; ask the pool for the current one.',
    sources: ['qli-team', 'community'],
    asOf: 'Oct to Nov 2026',
    cite: `${DISCORD}, 2 Nov 2026, Zoxx (QLI)`,
  },
  {
    id: 'rent-before-change',
    theme: 'algo',
    q: 'Rent before the algorithm changes?',
    a: 'Avoid long rentals across a change: a miner reported almost nothing from a 5-day rental in epoch 226, an algorithm-change epoch.',
    sources: ['community'],
    asOf: 'epoch 226, Aug 2026',
  },
  {
    id: 'accuracy',
    theme: 'algo',
    q: 'What changes with prediction accuracy?',
    a: 'CfB (20 Oct 2026): qualification moves to prediction accuracy after the live feed (epoch 240, 18 Nov; accuracy from about epoch 241); ANN cloning and the RAM selector stop working. Unknown: whether hashrate or solution counts still matter. All our data predates it.',
    sources: ['cfb'],
    asOf: '20 Oct 2026',
  },
  {
    id: 'amd',
    theme: 'amd',
    q: 'Can you mine with an AMD GPU? 9070 XT, no CUDA?',
    a: "No measurements from us. Support depends on the pool's miner: QLI moderators said on 30 Jul and 1 Aug 2026 that an AMD GPU miner would come later; by Oct miners said one pool had an AMD client, with no operator confirmation here. NVIDIA/CUDA is the proven path; pool advice preferred a 5070 Ti over a 9070 XT.",
    sources: ['qli-mod', 'qli-team', 'community', 'field'],
    asOf: 'Jul to Nov 2026',
    cite: `${DISCORD}, 30 Jul 2026 Pomm3sgab3l (QLI); 1 Aug 2026 Zoxx (QLI)`,
  },
  {
    id: 'mac',
    theme: 'arm-mac',
    q: 'Can I mine on a Mac?',
    a: 'Apple Silicon mines on the CPU via the pool macOS miner (est. figures). Elsewhere Macs were patchy in Oct 2026; a community Metal miner did about 33 nonces/s on an M4, with no pool path.',
    sources: ['partner', 'community'],
    asOf: 'Oct 2026',
  },
  {
    id: 'arm',
    theme: 'arm-mac',
    q: 'ARM support?',
    a: 'A QLI moderator (24 Sep 2026): ARM64 via a Docker Linux image with "cpuVersion": "ARM64" typed into appsettings.json, and a new ARM64 build for every algorithm. On 10 Oct a pool still sent ARM64 Linux an Android worker (client issue #136). No confirmed ARM payout, no measurement.',
    sources: ['qli-team', 'community'],
    asOf: '24 Sep to 10 Oct 2026',
    cite: `${DISCORD}, 24 Sep 2026, Zoxx (QLI)`,
  },
  {
    id: 'android',
    theme: 'mobile',
    q: 'Can I mine on my Android phone?',
    a: 'Not on this pool: its setup page offers Linux, macOS, Windows and HiveOS. Another pool has an Android beta (22 Aug 2026, Android 7.0+, arm64). There "Authentication failed" was a blacklist for too many shares too fast (2 Oct) and most-shares-invalid a backend issue (21 Oct), per its moderator. Not measured by us.',
    sources: ['qli-team', 'community'],
    asOf: 'Aug to Oct 2026',
    cite: `${DISCORD}, 22 Aug, 2 Oct and 21 Oct 2026, Pomm3sgab3l (QLI)`,
  },
  {
    id: 'how-rent',
    theme: 'rentals',
    q: 'Is there a guide to renting a rig?',
    a: 'Clore on-demand, not spot (spot is interruptible); the first 10 minutes waive the creation fee. Use the rental filters and extend before the max rental time. Template names do not matter; the start command must be the setup page one.',
    sources: ['field-e229', 'field-e233'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'avoid-hosts',
    theme: 'rentals',
    q: 'Which hosts to avoid?',
    a: 'Russia, Belarus, China: pool unreachable or hung (epoch 229, jetski endpoints). Host 24255 throttled every card. Cheap multi-card boxes on x1 risers with a Celeron.',
    sources: ['field-e229'],
    asOf: 'epoch 229, Sep 2026',
  },
  {
    id: 'died-overnight',
    theme: 'rentals',
    q: 'Rented rig stopped overnight? Can I close my laptop?',
    a: 'You can close the laptop if the miner was started detached on the server (on-start command, nohup or systemd). Started in a browser terminal it dies with it: three of our four rigs did on 6 Sep 2026.',
    sources: ['field-e229'],
    asOf: 'epoch 229, Sep 2026',
  },
  {
    id: 'rent-worth',
    theme: 'rentals',
    q: 'Is renting worth it?',
    a: 'We do not project income. A QLI moderator warned the network mining power can rise and you get fewer coins than you expect (7 Sep 2026). Rank rigs by cost per solution over 6 to 12 hours, close 0-solution rigs. Miners reported losses in some epochs.',
    sources: ['field-e229', 'field-e233', 'community'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'which-pool',
    theme: 'trust',
    q: 'Which pool is best right now?',
    a: 'Maria recommends only Qubic Church Pool and does not rank others. Share counts do not compare between pools: "Every pool has its own parameters and its own share system" (QLI, 23 Sep 2026). The fair test is the wallet total for the same rig over full epochs.',
    sources: ['qli-team'],
    asOf: 'Sep to Nov 2026',
    cite: `${DISCORD}, 23 Sep 2026, Pomm3sgab3l (QLI)`,
  },
  {
    id: 'pool-power',
    theme: 'trust',
    q: 'Pools have too much power?',
    a: 'Pools do not set the value of a solution; the epoch reward and total solutions do. Apool closed withdrawals on 31 Aug 2026 and MinerLab was no longer active by 2 Nov, when a QLI moderator counted "2 public and one independent" pools. Fees are public.',
    sources: ['community', 'qli-team'],
    asOf: 'Aug to Nov 2026',
    cite: `${DISCORD}, 27 Aug and 2 Nov 2026, Zoxx (QLI)`,
  },
  {
    id: 'jetski-status',
    theme: 'trust',
    q: 'Is jetski still running? I heard it left Qubic.',
    a: 'Not recommended here; Maria recommends only Qubic Church Pool. On the Qubic Discord its operator said on 18 Sep 2026 that Qubic support might be paused and that it has no ARM support, yet it kept operating: a new miner by 5 Oct, epoch 236 payout set for 4 Nov, replies to miners until 2 Nov.',
    sources: ['jetski-op'],
    asOf: '18 Sep to 3 Nov 2026',
    cite: `${DISCORD}, 18 Sep, 5 Oct, 29 Oct and 2 Nov 2026, the jetski operator`,
  },
  {
    id: 'insider',
    theme: 'trust',
    q: 'Does one pool have an insider advantage?',
    a: 'Claims went both ways in Oct and Nov 2026, including pay gaps between pools and "chosen ones". None verified; we have no same-rig comparison.',
    sources: ['community'],
    asOf: 'Oct to Nov 2026, unverified',
  },
  {
    id: 'scam-dm',
    theme: 'trust',
    q: 'Someone DMs offering to set up my miner. Safe?',
    a: 'No. Support warned of scammers and fake helpers (29 Sep 2026), and DM offers followed setup questions (Nov 2026). Nobody legitimate asks for your seed or remote access. Download the miner only from the pool setup page.',
    sources: ['community'],
    asOf: 'Sep to Nov 2026',
  },
  {
    id: 'asic',
    theme: 'trust',
    q: 'Will ASICs take over?',
    a: 'CfB (21 Sep 2026): "No, we use algo not implemented by ASIC". Qubic mines Dogecoin on ASICs separately.',
    sources: ['cfb', 'doge'],
    asOf: 'Sep 2026',
    cite: `${DISCORD}, 21 Sep 2026, CfB`,
  },
  {
    id: 'overclock',
    theme: 'tuning',
    q: "5070ti what's OC for current algo, hive os?",
    a: 'No measured OC values. QLI (27 Aug 2026): try GPUs without OC first on Ant Colony; a QLI moderator warned careless OC breaks hardware. Hosts ran RTX 5080s at 250 W and our record rig ran there (epoch 233). Change one setting at a time; keep it if sol/h holds.',
    sources: ['field-e233', 'qli-mod', 'qli-team'],
    asOf: 'Aug to Oct 2026',
    cite: `${DISCORD}, 27 Aug and 5 Sep 2026, Pomm3sgab3l (QLI)`,
  },
  {
    id: 'driver',
    theme: 'tuning',
    q: 'Which NVIDIA driver and CUDA?',
    a: 'No tested minimum for the current miner. Our epoch 229 and 233 rigs ran CUDA 13.0 to 13.2. Use a current driver and the setup page miner. ReBAR: no Qubic measurement.',
    sources: ['field-e229', 'field-e233'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'gpu-unlock',
    theme: 'tuning',
    q: 'Should I run the gpu-unlock tool on RTX 30/40?',
    a: 'Not recommended. It is a third-party tool shared on 24 Oct 2026; the gains posted were BF16 and TF32 benchmarks, not solutions, and it changes how the driver runs the card. If you try it anyway, measure solutions per hour before and after on one rig.',
    sources: ['community', 'qli-team'],
    asOf: '24 to 25 Oct 2026',
  },
]

export const faqByTheme = (theme: FaqTheme) => FAQ.filter(e => e.theme === theme)
