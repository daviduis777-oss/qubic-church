/**
 * What real miners ask, by theme, with the best factual answer we have, its sources and the date it was
 * true. Questions are in the miners' own words (short, no handles) or paraphrased. Maria's prompt
 * (prompt.ts) and the Discord card (scripts/pool-card.mts) read from here.
 *
 * Rules for this file: no income, profit or projection figures; losses only as "miners reported losses";
 * every field fact carries its epoch; jetski only as gone; the partner pool is not named.
 */
import type { SourceId } from './knowledge.ts'

export type FaqTheme =
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
  | 'rentals'
  | 'trust'
  | 'tuning'

export const FAQ_THEMES: Record<FaqTheme, string> = {
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
  rentals: 'Renting rigs',
  trust: 'Trust in pools',
  tuning: 'Overclock, drivers, laptops',
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
}

export const FAQ: FaqEntry[] = [
  {
    id: 'value-per-solution',
    theme: 'profitability',
    q: "Why is my income per sol so low now?",
    a: "An epoch has a fixed reward, divided by all solutions found in it, valued at the QU price. More miners or a faster algorithm means more solutions, each worth less. Ant Colony (epoch 228) raised solution counts about 50x; the value per solution fell by a similar factor.",
    sources: ['field-e229', 'jetski-op'],
    asOf: 'epochs 227 to 229, Sep 2026',
  },
  {
    id: 'estimate-drops',
    theme: 'profitability',
    q: "The estimate keeps dropping during the epoch. Bug?",
    a: "No. Later solutions dilute the ones already found, so their value falls too. In-epoch estimates are noise until about 80 to 90% of the epoch.",
    sources: ['jetski-op', 'field-e233'],
    asOf: 'epoch 233, Oct 2026',
  },
  {
    id: 'worth-it',
    theme: 'profitability',
    q: "Is there any point mining Qubic right now?",
    a: "We do not project income; measure your own cost per solution over one epoch. From epoch 233 income depended more on whether the pool's IDs won computor seats (ranked by best shift and error, not solution count) than on the rig. Algorithm-change epochs are the main risk. Miners reported losses in some epochs.",
    sources: ['field-e233', 'cfb', 'community'],
    asOf: 'epoch 233, Oct 2026',
  },
  {
    id: 'big-payout',
    theme: 'profitability',
    q: "Last epoch paid great, is that normal?",
    a: "Payouts swing: they depend on the network's total solutions, the pool's seats and the QU price. One good epoch says nothing about the next.",
    sources: ['community', 'field-e233'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'per-day',
    theme: 'profitability',
    q: "How much does a 9950X make per day?",
    a: "We give no income figures, and we have no measured sol/h for any CPU-only rig. Run it one epoch and read your own count on the pool.",
    sources: ['field'],
    asOf: 'Nov 2026',
  },
  {
    id: 'what-to-buy',
    theme: 'hardware',
    q: "What to buy, which PC to choose?",
    a: "Home PC: an AVX-512 Ryzen 9 (7950X, 9950X) with one RTX 5070 Ti, pool operator advice up to Jul 2026 and in line with the Academy. In our runs the platform beat the card tier: 12+ threads per card, PCIe 4.0 x8 or 3.0 x16, a reliable host.",
    sources: ['academy', 'jetski-op', 'field-e233'],
    asOf: 'Mar to Oct 2026',
  },
  {
    id: 'which-rental-gpu',
    theme: 'hardware',
    q: "Which GPU gives the most solutions per dollar?",
    a: "Judge price per card. Epoch 229: 2x RTX 5070 Ti on an EPYC 7B12 had our best cost per solution. Epoch 233: 7x RTX 5080 on an EPYC 7B13 matched 4x RTX 4090 on a Haswell Xeon in sol/h at about half the price (about 1.9x per dollar).",
    sources: ['field-e229', 'field-e233'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: '5090',
    theme: 'hardware',
    q: "Is a 5090 worth it over a 4090?",
    a: "Epoch 229: about twice the rent of a 4090 for about 10% more it/s, and a fresh 5090 rig at 154 it/s per card showed 0 solutions while a 5070 Ti at 80 had 133. Epoch 233: our 4x 5090 rig ran CPU-starved. No run of a well-fed 5090 since.",
    sources: ['field-e229', 'field-e233'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'x3d',
    theme: 'hardware',
    q: "x3d? 9900x vs 7950x?",
    a: "A pool operator preferred X over X3D (easier to overclock) and put the 9950X at about 1.5x the 7950X, on 2025 algorithms. Not re-measured.",
    sources: ['jetski-op'],
    asOf: '2025 to Jul 2026',
  },
  {
    id: 'old-xeon',
    theme: 'hardware',
    q: "Can I use an old Xeon server?",
    a: "CPU mining: skip Xeon E5 (AVX2 only). As a GPU host E5 v3/v4 works with 12+ threads per card and PCIe 3.0 x16 or 4.0 x8: 4x RTX 4090 on an E5-2696 v3 made about 2,440 sol/h (epoch 233). EPYC did better per dollar. E5 v1/v2 lack AVX2.",
    sources: ['guide', 'field-e229', 'field-e233'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'tick-cpu',
    theme: 'cpu-gpu',
    q: "GPU+CPU, or GPU only?",
    a: "One or two cards with an AVX-512 Ryzen: both, worth about 7 to 8% (epoch 229). AVX2 CPUs added nearly nothing. Three or more cards: GPU only; 6 cards plus CPU looped \"Ant stream closed\".",
    sources: ['field-e229'],
    asOf: 'epoch 229, Sep 2026',
  },
  {
    id: 'cpu-or-gpu',
    theme: 'cpu-gpu',
    q: "Best hashrate from CPU, not GPU?",
    a: "CPU-only and home builds: the Academy and Cointribune (Sep 2026) rate AVX-512 CPUs highly. GPU rigs, measured: the CPU share of pool solutions fell from about 37% (epoch 229) to 17% (epoch 233), CUDA about 79%, and our best rigs ran GPU only.",
    sources: ['academy', 'cointribune', 'pool-lanes', 'field-e233'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'threads',
    theme: 'cpu-gpu',
    q: "How many CPU threads per card?",
    a: "At least 12 (epoch 233). More than 4 cards on a weak CPU fell behind on verification. \"-threads all\" oversubscribing is suspected, not proven.",
    sources: ['field-e233'],
    asOf: 'epoch 233, Oct 2026',
  },
  {
    id: 'ram-size',
    theme: 'ram',
    q: "RAM matters? How much?",
    a: "The 45 to 90 GB scare ended on 27 Sep 2026 when POPULATION was set to 64, about 3 GB per colony. Our record rigs had 64 GB; Academy minimum 16 GB, 32 GB recommended. Not re-measured at 32 neurons (epoch 236).",
    sources: ['devs', 'field-e233', 'academy'],
    asOf: '27 Sep to 21 Oct 2026',
  },
  {
    id: 'ram-speed',
    theme: 'ram',
    q: "Dual channel or one stick? Does speed matter?",
    a: "Advice from before epoch 233: dual channel, DDR5 6000 CL30, speed over size. We never measured it.",
    sources: ['jetski-op', 'community'],
    asOf: 'Mar to Jul 2026',
  },
  {
    id: 'wrong-workload',
    theme: 'breakage',
    q: "My shares got deleted, no pool sends the right workload?",
    a: "Pools broke: QLI rejected shares 12 to 13 Sep, was down 2 days in epoch 231, and had 0-share releases 29 Sep to 3 Oct 2026. After an algorithm change stale clients show hashrate but invalid shares; a new algorithm can take 1 to 2 epochs to settle.",
    sources: ['community', 'qli-mod'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'pool-errors',
    theme: 'breakage',
    q: "HTTP 502 and websocket 1006 in my log. Rig broken?",
    a: "No, pool side, as is \"retired-lease progress rejected\". Do not restart; wait 5 to 15 minutes, then check the pool status channel. Solutions can be lost in an outage.",
    sources: ['field-e233'],
    asOf: 'epoch 233, Oct 2026',
  },
  {
    id: 'stream-closed',
    theme: 'breakage',
    q: "\"Ant stream closed\" every 2 seconds?",
    a: "A second miner process on the box, or CPU mining next to many cards. Stop all, start one, GPU only on 3+ cards.",
    sources: ['field-e229'],
    asOf: 'epoch 229, Sep 2026',
  },
  {
    id: 'where-from',
    theme: 'missing',
    q: "Where are all these shares coming from?",
    a: "Ant Colony multiplied network solution counts from epoch 228, and solutions come in bursts even for top rigs. Nothing we have confirms private miners.",
    sources: ['field-e233', 'community'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'zero-solutions',
    theme: 'missing',
    q: "My rig shows 0 solutions. Broken?",
    a: "A fresh rig at 0 for 2 to 30 minutes is normal. After 20 minutes at 0 with normal it/s, restart once and wait 10 more; still 0, close it. The first 1 to 2 hours overstate the rate 1.3 to 1.5x.",
    sources: ['field-e229', 'field-e233'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'counter',
    theme: 'missing',
    q: "Worker counter does not match. What did I get?",
    a: "The worker counter resets on restart and lags; the wallet total on the pool counts. Never judge by it/s: one card swung 508 to 280 it/s with no change in solutions.",
    sources: ['field-e229', 'field-e233'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'when-paid',
    theme: 'payout',
    q: "When do I get paid?",
    a: "Epochs run Wednesday 12:00 UTC to Wednesday. This pool calculates rewards after the epoch; payout usually lands about a week later. A candidate ID earns nothing in its first epoch.",
    sources: ['guide', 'qli-mod'],
    asOf: 'Jul to Nov 2026',
  },
  {
    id: 'irregular',
    theme: 'payout',
    q: "Payment irregularities lately are new?",
    a: "They came with algorithm changes and the seat contest: epoch 221 had no mining, epoch 231 broke a pool for 2 days, epoch 233 was a seat war. Keep rentals flexible.",
    sources: ['qli-mod', 'community', 'field-e233'],
    asOf: 'Jul to Oct 2026',
  },
  {
    id: 'switch-pool',
    theme: 'payout',
    q: "What happens if I switch pool mid-epoch?",
    a: "We do not know. Ask the pool you leave how it counts a partial epoch.",
    sources: ['community'],
    asOf: 'asked Sep 2026, unanswered',
  },
  {
    id: 'miner-valid',
    theme: 'algo',
    q: "New algo next week. Is my miner still valid?",
    a: "No: a new algorithm needs a new miner, and an old one shows it/s for work that no longer counts. Epoch 235 changed the threshold and task file, epoch 236 moved to 32 neurons. Get the current miner from the setup page.",
    sources: ['community', 'field'],
    asOf: 'Aug to Oct 2026',
  },
  {
    id: 'rent-before-change',
    theme: 'algo',
    q: "Rent before the algorithm changes?",
    a: "Avoid long rentals across a change: a miner reported almost nothing from a 5-day rental in epoch 226, an algorithm-change epoch.",
    sources: ['community'],
    asOf: 'epoch 226, Aug 2026',
  },
  {
    id: 'accuracy',
    theme: 'algo',
    q: "What changes with prediction accuracy?",
    a: "CfB (20 Oct 2026): qualification moves to prediction accuracy after the live feed (epoch 240, 18 Nov; accuracy from about epoch 241); ANN cloning and the RAM selector stop working. Unknown: whether hashrate or solution counts still matter. All our data predates it.",
    sources: ['cfb'],
    asOf: '20 Oct 2026',
  },
  {
    id: 'amd',
    theme: 'amd',
    q: "Can you mine with an AMD GPU? 9070 XT, no CUDA?",
    a: "No measurements from us. Support depends on the pool's miner; a QLI moderator said in Jul 2026 that QLI and jetski (gone) supported AMD. NVIDIA/CUDA is the proven path; pool advice preferred a 5070 Ti over a 9070 XT.",
    sources: ['qli-mod', 'jetski-op', 'field'],
    asOf: 'Jul 2026',
  },
  {
    id: 'mac',
    theme: 'arm-mac',
    q: "Can I mine on a Mac?",
    a: "Apple Silicon mines on the CPU via the pool macOS miner. A community Metal miner did about 33 nonces/s on an M4, roughly 1% of one RTX 5080, with no pool path.",
    sources: ['partner', 'community'],
    asOf: 'Oct 2026',
  },
  {
    id: 'arm',
    theme: 'arm-mac',
    q: "ARM support?",
    a: "Community tip: QLI on ARM64 via Docker (\"cpuVersion\": \"ARM64\" in appsettings.json). No confirmed ARM payout, no measurement.",
    sources: ['community'],
    asOf: '24 Sep 2026',
  },
  {
    id: 'how-rent',
    theme: 'rentals',
    q: "Is there a guide to renting a rig?",
    a: "Clore on-demand, not spot (spot is interruptible); the first 10 minutes waive the creation fee. Filter 98%+ reliability, 12+ threads per card, PCIe 4.0 x8 or 3.0 x16. Extend before the max rental time.",
    sources: ['field-e229', 'field-e233'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'avoid-hosts',
    theme: 'rentals',
    q: "Which hosts to avoid?",
    a: "Russia, Belarus, China: pool unreachable or hung (epoch 229, jetski endpoints). Host 24255 throttled every card. Cheap multi-card boxes on x1 risers with a Celeron.",
    sources: ['field-e229'],
    asOf: 'epoch 229, Sep 2026',
  },
  {
    id: 'died-overnight',
    theme: 'rentals',
    q: "My rented rig stopped overnight?",
    a: "Three of our four rigs died with the browser terminal on 6 Sep 2026. Use nohup and a log file, or systemd. Hosts at 48 to 67% reliability dropped at night.",
    sources: ['field-e229'],
    asOf: 'epoch 229, Sep 2026',
  },
  {
    id: 'rent-worth',
    theme: 'rentals',
    q: "Is renting worth it?",
    a: "We do not project income. Rank rigs by cost per solution over 6 to 12 hours without restarts, close 0-solution rigs, prefer one reliable rig to many cheap ones. Miners reported losses in some epochs.",
    sources: ['field-e229', 'field-e233', 'community'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'pool-power',
    theme: 'trust',
    q: "Pools have too much power?",
    a: "Pools do not set the value of a solution; the epoch reward and total solutions do. By 22 Oct 2026 jetski and Apool had left; QLI and MinerLab remain, newer pools in beta. Fees are public.",
    sources: ['community'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'insider',
    theme: 'trust',
    q: "Does one pool have an insider advantage?",
    a: "Claims went both ways in Oct 2026, including pay gaps between pools. None verified; we have no same-rig comparison.",
    sources: ['community'],
    asOf: 'Oct 2026, unverified',
  },
  {
    id: 'asic',
    theme: 'trust',
    q: "Will ASICs take over?",
    a: "CfB (21 Sep 2026): \"No, we use algo not implemented by ASIC\". Qubic mines Dogecoin on ASICs separately.",
    sources: ['cfb', 'doge'],
    asOf: 'Sep 2026',
  },
  {
    id: 'overclock',
    theme: 'tuning',
    q: "5070ti what's OC for current algo, hive os?",
    a: "No measured OC values. Hosts ran RTX 5080s at 250 W and our record rig ran there (epoch 233). Change one setting at a time; keep it if sol/h holds. A QLI moderator warned careless OC breaks hardware.",
    sources: ['field-e233', 'qli-mod'],
    asOf: 'Oct 2026',
  },
  {
    id: 'driver',
    theme: 'tuning',
    q: "Which NVIDIA driver and CUDA?",
    a: "No tested minimum for the current miner. Our epoch 229 and 233 rigs ran CUDA 13.0 to 13.2. Use a current driver and the setup page miner.",
    sources: ['field-e229', 'field-e233'],
    asOf: 'Sep to Oct 2026',
  },
  {
    id: 'laptop',
    theme: 'tuning',
    q: "Laptop GPU bbqs itself?",
    a: "Laptop cooling limits sustained load; no laptop measurement. Clocks dropping at 85 C or more is thermal throttling.",
    sources: ['field-e233'],
    asOf: 'Nov 2026',
  },
]

export const faqByTheme = (theme: FaqTheme) => FAQ.filter(e => e.theme === theme)
