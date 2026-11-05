/**
 * Hardware knowledge with a source and date per fact. The picker, the "Hardware at a glance" section
 * and Maria's AI prompt all read from here. Add a fact here, not in a component.
 */

export type SourceId =
  | 'academy'
  | 'cointribune'
  | 'guide'
  | 'partner'
  | 'doge'
  | 'field'
  | 'field-e229'
  | 'field-e233'
  | 'pool-lanes'
  | 'devs'
  | 'cfb'
  | 'qli-mod'
  | 'jetski-op'
  | 'qli-team'
  | 'community'

export const SOURCES: Record<SourceId, { label: string; url: string; date: string }> = {
  academy: { label: 'Qubic Academy, Mining 1.2', url: 'https://qubic.org/academy/mining/module-1/lesson-2', date: 'checked 4 Nov 2026' },
  cointribune: { label: 'Cointribune 2026 mining guide', url: 'https://www.cointribune.com/en/start-mining-qubic-the-complete-2026-guide/', date: '20 Sep 2026' },
  guide: { label: 'Qubic Church mining guide', url: '/mine-qubic', date: 'v0.3, epoch 230' },
  partner: { label: "Pool partner's hardware table (pool page)", url: '', date: '23 Oct 2026, est.' },
  doge: { label: 'Qubic DOGE launch release', url: 'https://doge-stats.qubic.org/', date: '1 Apr 2026' },
  field: { label: 'Qubic Church field runs on Clore', url: '', date: 'epochs 229 and 233, Sep to Oct 2026' },
  'field-e229': { label: 'Our field runs, epoch 229', url: '', date: '5 to 8 Sep 2026' },
  'field-e233': { label: 'Our field runs, epoch 233', url: '', date: '30 Sep to 3 Oct 2026' },
  'pool-lanes': { label: 'Pool-wide sol/h by lane, jetski dashboard (pool not recommended)', url: '', date: '6 Sep and 3 Oct 2026' },
  devs: { label: 'Qubic core dev posts on Discord', url: '', date: '25 to 27 Sep 2026' },
  cfb: { label: 'CfB on the Qubic Discord', url: '', date: 'Aug to Nov 2026' },
  'qli-mod': { label: 'QLI moderator on the Qubic Discord', url: '', date: '26 Jul 2026' },
  'jetski-op': { label: 'jetski pool operator on the Qubic Discord (pool not recommended)', url: '', date: 'Mar to 2 Nov 2026' },
  'qli-team': { label: 'Qubic Discord #mining-general, QLI team (Pomm3sgab3l, Zoxx)', url: '', date: '1 Aug to 4 Nov 2026' },
  community: { label: 'Qubic Discord #mining-general, miners (reported, not verified)', url: '', date: '31 Jul to 4 Nov 2026' },
}

export const sourceLine = (ids: SourceId[]) => ids.map(id => `${SOURCES[id].label} (${SOURCES[id].date})`).join('; ')

/** Our own measurements, by any of the field source ids. */
export const isField = (id: SourceId) => id === 'field' || id.startsWith('field-')

export type Fact = { topic: string; text: string; sources: SourceId[] }

/**
 * Short, checkable facts. The AI prompt lists these verbatim with their sources.
 * Where our own measurements disagree with a guide, both are listed and the text says which applies when.
 */
/** Said inside every fact that rests on our own runs, so the caveat travels with the number. */
export const PREDATES = 'predates the E235/E236 changes'

export const FACTS: Fact[] = [
  { topic: 'CPU', text: 'Best CPUs: AMD Ryzen 9 7900X / 7950X / 7950X3D / 9950X / 9950X3D, Threadripper 7000 and newer, EPYC with AVX-512. Good: Ryzen 7, 7700 and above. Intel works, but is generally slower unless the CPU has AVX-512.', sources: ['academy'] },
  { topic: 'CPU', text: 'AVX-512: every Ryzen 7000 and 9000 desktop CPU (7700, 7900X, 7950X3D, 9800X3D, 9900X, 9950X), Threadripper 7000/9000, EPYC 9004/9005. AVX2 only: EPYC Zen 2/3 (7xx2/7xx3, e.g. EPYC 7702), Xeon E5 v3/v4, Ryzen 3000/5000, Intel Core Ultra. Laptop and mini PC chips: check with lscpu (vendor specs; our epoch 229 notes).', sources: ['academy', 'field'] },
  { topic: 'CPU', text: 'Cointribune (Sep 2026): under BPP-9000 a strong CPU is slightly more efficient than an NVIDIA GPU, so an AVX-512 CPU is the backbone. This and the Academy tiers apply to CPU-only and home builds.', sources: ['cointribune'] },
  { topic: 'CPU', text: `Our GPU rigs measured otherwise (our E229/E233 runs, ${PREDATES}). Epoch 229 (6 Sep 2026): AVX-512 on a Ryzen 9 7950X3D feeding 2 cards added about 7 to 8% without starving them; AVX2 CPUs added nearly nothing, even with 64 to 96 cores (an EPYC 7V12 lane jumped between 1 and 96 it/s). The pool-wide CPU share of solutions fell from about 37% (epoch 229) to about 17% (epoch 233), CUDA about 79%. Our best epoch 233 rigs ran GPU only; an AVX-512 Ryzen running CPU and GPU found 0. On a GPU rig the CPU mainly feeds and verifies for the cards. A large CPU contribution needs a big AVX-512 CPU with few cards.`, sources: ['field-e229', 'field-e233', 'pool-lanes'] },
  { topic: 'CPU', text: `Which applies when: no card, or a home PC with one or two cards, follow the CPU tiers and tick the CPU on an AVX-512 Ryzen. Rigs with three or more cards: GPU only, and pick the CPU for threads per card, not for AVX-512 (our epoch 229 and 233 runs, ${PREDATES}).`, sources: ['academy', 'field-e229', 'field-e233'] },
  { topic: 'CPU', text: 'Reported after our runs, not verified: in epoch 236 (21 Oct 2026) an EPYC 9534 found 7 solutions while an RTX 5090 at about twice the it/s found about 9x as many. A QLI moderator said on 2 Aug 2026 that a CPU looked better than a GPU until optimizing was done, and on 5 Oct named the 7950X3D and 9950X as the best CPUs and the 4090/5090 as the best GPUs. A very low it/s on a big CPU usually means too few threads (CfB, 2 Aug 2026).', sources: ['community', 'qli-team', 'cfb'] },
  { topic: 'CPU', text: 'For CPU mining skip Xeon E5, Intel Core Ultra (no AVX-512) and 2-core Celeron / Pentium / i3. Keep at least 8 CPU cores per GPU.', sources: ['guide'] },
  { topic: 'CPU', text: `Threads per card (our runs, ${PREDATES}): about 2 to 3 cards per CPU was the ceiling (6 Sep 2026), 8 to 16 AVX-512 cores per card gave R:0 (8 Sep), at least 12 threads per card (epoch 233, 3 Oct); more than 4 cards on a weak CPU fell behind on verification and looped "Ant stream closed". Clock matters too: a 2.2 GHz Xeon E5-2699 v4 (11 cores per card) held RTX 5070 Tis to about 78 it/s against about 125 on a good host (epoch 229). Xeon E5 v3/v4 still hosts GPUs: 4x RTX 4090 on an E5-2696 v3 (about 9 threads per card) ran in epoch 233 but at a worse cost per solution than our EPYC rig. Whether "all threads" oversubscribes is not proven.`, sources: ['field-e229', 'field-e233'] },
  { topic: 'GPU', text: 'NVIDIA cards through CUDA 12 and recent drivers are the proven path. VRAM matters: cards with too little get smaller tasks. 16 GB was enough in E233, not re-checked since the 32-neuron change (E236, 21 Oct 2026).', sources: ['cointribune', 'field-e233'] },
  { topic: 'GPU', text: 'RTX 5070 Ti (16 GB) is the value pick behind a strong CPU. RTX 5090 / 4090 are fast but pricey. RTX 3090 / 3080 are old but cheap.', sources: ['guide'] },
  { topic: 'GPU', text: 'Old cards: from epoch 237 (28 Oct 2026) a GTX 1050 Ti CUDA worker (cuda 237.0) exited every few seconds though it worked in epoch 236, and a Tesla K80 does not run on current CUDA (20 Oct 2026). A QLI moderator said they would look; no fix by 4 Nov. Treat GTX 10 series and older as unsupported until the pool says otherwise; the CPU still mines. No older-algorithm option exists. The 5 Sep 2026 guide line "any NVIDIA from GTX 10xx" is outdated.', sources: ['community', 'qli-team'] },
  { topic: 'GPU', text: "AMD Radeon: no measurements from us. Support depends on the pool's miner; a QLI moderator said in July 2026 that QLI and jetski (not recommended) supported AMD, and on 30 Jul and 1 Aug 2026 that an AMD GPU miner would come later; by 4 Nov only miners' remarks, no operator confirmation and no measurement. NVIDIA/CUDA is the proven path.", sources: ['qli-mod', 'qli-team', 'field'] },
  { topic: 'RAM', text: 'RAM: 16 GB DDR4/DDR5 minimum, 32 GB or more recommended (Academy). Cointribune says higher RAM frequency helps; we never measured RAM speed or channels against output. A 5 Sep 2026 guide line that 8 GB is enough is not supported.', sources: ['academy', 'cointribune'] },
  { topic: 'RAM', text: `Before epoch 233 dev posts put a colony at about 45 to 90 GB of RAM. On 27 Sep 2026 POPULATION was set to 64, about 3 GB per colony, and the RAM scare ended. Our record rigs had 64 GB (epoch 233, ${PREDATES}). E236 (32 neurons) is not expected to need more RAM, but this was not measured.`, sources: ['devs', 'field-e233'] },
  { topic: 'Host', text: 'An SSD is required; stable broadband, at least 10 Mbps up and down, low latency.', sources: ['academy'] },
  { topic: 'Host', text: `Platform over card (our epoch 229 runs, ${PREDATES}): 12 or more CPU threads per card, PCIe 4.0 x8 or 3.0 x16 (on 8 Sep 2026 PCIe 4.0 x4 cut 2x RTX 4090 from about 370 to about 175 it/s at 100% use; a 5070 Ti on PCIe 1.0 x1 risers ran 50 to 70 it/s), and a host with 98% or better reliability. The hit varies by card: our best cost-per-solution rig (2x 5070 Ti, EPYC 7B12) ran on 4.0 x4. On consumer boards an NVMe in the first M.2 slot can share lanes with the GPU slot. A host can throttle every card: host 24255 held its RTX 5070 Tis back on every server we tried.`, sources: ['field-e229'] },
  { topic: 'Mac', text: 'Apple Silicon Macs mine on the CPU through the pool macOS miner, slowly: the pool page showed an M3 Pro at about 40 it/s (23 Oct 2026, est.). No measurement of ours, no Metal (GPU) mining.', sources: ['partner'] },
  { topic: 'Mac', text: 'Elsewhere Mac and ARM mining was patchy in Sep to Oct 2026: another pool needed a Docker Linux image and a new ARM64 build per algorithm (24 Sep), sent ARM64 Linux an Android worker (10 Oct, client issue #136), a Rosetta x64 Linux VM ran at about 18 to 19 it/s (a miner), and a miner said Mac was "not ready yet" (5 Oct). No measurement of ours.', sources: ['qli-team', 'community'] },
  { topic: 'Measured', text: `Measured, epoch 229 (5 to 6 Sep 2026, ${PREDATES}): 2x RTX 5070 Ti on an EPYC 7B12 (32 cores per card, PCIe 4.0 x4, 99% host reliability, GPU only) at 6.30 USD/day had the best cost per solution of our fleet, about 3 US cents: about 8.9 sol/h over 13.6 hours. In epoch 229 RTX 4090s had 2 to 7x worse cost per solution, and 5090s cost about twice a 4090 for about 10% more it/s. Epoch 229 counts were tens per rig per hour; from epoch 233 they were thousands, so compare rates only within one epoch.`, sources: ['field-e229'] },
  { topic: 'Measured', text: `Measured, epoch 233 (1 Oct 2026, ${PREDATES}): 4x RTX 4090 (PCIe 3.0 x8, Xeon E5-2696 v3 36/72 threads, GPU only, about 76 USD/day) averaged about 2,440 sol/h over about 4 hours (4.2 h), a window that includes the overstated first hours.`, sources: ['field-e233'] },
  { topic: 'Measured', text: `Measured, epoch 233 (2 to 3 Oct 2026, ${PREDATES}): 7x RTX 5080 (250 W host limit) on an EPYC 7B13, PCIe 4.0 x16, 64 GB RAM, GPU only, at 44.10 USD/day: about 3,650 sol/h in hour 1, about 2,900 in hour 2, about 2,460 sol/h steady after hour 2, about 2,570 averaged over 14 hours. Cost per solution: about 0.075 US cents (steady rate) against about 0.13 for the 4x 4090 rig (its 4.2 h average includes the overstated first hours, so its real cost was likely higher): about 1.7x cheaper per solution at 58% of the price. The platforms differ (CPU, PCIe), so it is not a pure card test.`, sources: ['field-e233'] },
  { topic: 'Measured', text: `Rental prices in epoch 233 (3 Oct 2026, Clore): an RTX 5080 (16 GB) rented at about 6 USD per card per day against about 20 for a 4090, because 16 GB is too small for AI rental; 16 GB was enough in E233, not re-checked since the 32-neuron change. Aim for about 8 USD/day or less per 16 GB card (Oct 2026 market, changes weekly).`, sources: ['field-e233'] },
  { topic: 'Rental', text: `Rental filters from our epoch 229 and 233 runs (Clore only, Vast not measured, ${PREDATES}): on-demand, not spot (spot is interruptible); host reliability 98% or more; PCIe 4.0 x8 or 3.0 x16 (never x1/x4 risers: cheap multi-card boxes are often old mining frames with a Celeron); a recent server CPU; 12 or more CPU threads per GPU; check the host power limit (hosts cut 5080s to 250 W and 5090s to 400 W); a max rental period of 12 h or more, extended well before it ends. Region: in epoch 229 hosts in Russia and Belarus could not reach the jetski endpoints and a China terminal hung; only those endpoints were tested, so run a cheap 10-minute test (Clore waives the creation fee for 10 minutes).`, sources: ['field-e229', 'field-e233'] },
  { topic: 'Mode', text: `CPU and GPU mode (our epoch 229 runs, ${PREDATES}): multi-GPU servers run GPU only (6 cards plus CPU looped "Ant stream closed; active work cancelled" every 2 seconds, 7 Sep 2026). One or two GPUs next to an AVX-512 CPU: both, worth about 7 to 8% (6 Sep 2026); a 1x 5090 plus a 76-thread Xeon Platinum ran clean, R:0, 314 solutions in epoch 229. An AVX2 CPU lane adds close to nothing.`, sources: ['field-e229'] },
  { topic: 'Judging', text: `Judge by solutions per hour on the pool and the wallet total, never by it/s (our epoch 229 runs, ${PREDATES}): one rig fell from 508 to 280 it/s in 30 minutes with no change in solutions, and a 5090 at 154 it/s per card found 0 while a 2x 5070 Ti rig at 80 it/s per card found 133. it/s falls through an epoch as the colony deepens: our E233 4x 5090 rig went from 40k to 8 to 12k it/s at 65 to 72 C, 100% use (30 Sep 2026). nvidia-smi: 100% use at normal clocks is fine, clocks dropping at 85 C or more is heat, use under 50% means the CPU or the pool starves the cards; if other rigs drop at the same time it is network-wide.`, sources: ['field-e229', 'field-e233'] },
  { topic: 'Judging', text: `Judging a rig (our epoch 229 and 233 rules, ${PREDATES}): 0 solutions for 5 to 30 minutes on a fresh rig was normal and solutions come in bursts, so wait at least 20 minutes and until after the "Ant work replaced" line; at 0 with normal it/s, restart once and wait 10 more, never in a loop; the first 1 to 2 hours overstate the rate by about 1.3 to 1.5x, so judge over 6 to 12 hours; the per-worker counter resets on restart, so check the wallet total. Still 0: close a rental; on your own machine paste the log into Fix my rig.`, sources: ['field-e229', 'field-e233'] },
  { topic: 'Operations', text: `Operations (our epoch 229 and 233 runs, ${PREDATES}): start detached with a log file, or the miner dies with the browser terminal (3 of our 4 rigs stopped overnight this way, 6 Sep 2026); one miner process per box (a second one causes "Ant stream closed" or "address already in use"); a unique worker name per rig.`, sources: ['field-e229', 'field-e233'] },
  { topic: 'Payouts', text: `From epoch 233 a miner's income depended more on whether the pool's IDs won computor seats than on the rig: the ranking is the best (shift, error) per ID, not the solution count (our epoch 233 notes, ${PREDATES}). Miners reported losses in some epochs.`, sources: ['field-e233', 'cfb'] },
  { topic: 'Algo', text: 'Each algorithm change needs the current miner; an old one shows it/s for work that no longer counts (QLI, 1 Aug 2026: really old clients sent only invalid shares). Client releases on the Qubic Discord: Ant Colony from epoch 228, a binary change in epoch 233, new workers around epoch 236 and again in epoch 237 (Sep to Oct 2026). QLI said a new algorithm needs at least 3 days to settle, with 0 or very many shares at first (29 Sep 2026).', sources: ['qli-team'] },
  { topic: 'Payouts', text: 'Shares are weighted by score, not counted equally (QLI, 6 Aug 2026), and every pool has its own share system (23 Sep 2026), so share counts do not compare across pools or with the payout. In epoch 237 scores above 3125 counted for nothing; lower is better (QLI moderator, 2 Nov 2026). Thresholds change per epoch.', sources: ['qli-team'] },
  { topic: 'Payouts', text: "Payout timing, Sep to Nov 2026: \"Always a week later\" (QLI moderator, 8 Sep 2026), sometimes up to about 10 days, and pools showed the pending payout with its date on their payout page. One pool acknowledged late payouts for epochs 230 to 233 on 17 Oct 2026.", sources: ['qli-team', 'jetski-op', 'community'] },
  { topic: 'Staleness', text: 'All our measurements are from epochs 229 and 233, on the jetski pool and its miner (not recommended; that miner has changed since, v4.5 by 5 Oct 2026). Since then epoch 235 changed the threshold and task file, epoch 236 moved to 32-neuron networks, and CfB said qualification moves to prediction accuracy after the live feed (about epoch 241). Treat every field number as a calibration point with its epoch, not a constant.', sources: ['field', 'cfb'] },
  { topic: 'ASIC', text: 'Since 1 April 2026 Qubic also mines Dogecoin on ASICs, on separate hardware. ASICs are not for this pool: it mines with CPUs and NVIDIA GPUs.', sources: ['doge'] },
]

/**
 * Our own runs as structured rows, so measure.ts can seed them as `field` samples. They must agree with
 * the "Measured" facts above (a test checks the numbers). Times are UTC. Only runs with a measured sol/h
 * (status "measured" in the vault extract) belong here; estimates and partial windows never do.
 */
export type FieldRun = {
  label: string
  cpu: string
  gpu: string
  gpuCount: number
  mode: 'gpu' | 'cpu' | 'gpu+cpu'
  solPerHour: number
  /** minutes the rate was measured over, when we logged it */
  windowMin?: number
  epoch: number
  at: string
  host: string
  /** our worker name, for the record (field runs only; user samples never keep one) */
  worker?: string
  pcie?: string
}

export const FIELD_RUNS: FieldRun[] = [
  { label: '2x RTX 5070 Ti, EPYC 7B12, GPU only', cpu: 'EPYC 7B12', gpu: 'RTX 5070 Ti', gpuCount: 2, mode: 'gpu', solPerHour: 8.9, windowMin: 816, epoch: 229, at: '2026-09-06T06:00:00Z', host: 'Clore.ai', worker: 'QC-C04', pcie: '4.0 x4' },
  { label: '4x RTX 4090, Xeon E5-2696 v3, GPU only', cpu: 'Xeon E5-2696 v3', gpu: 'RTX 4090', gpuCount: 4, mode: 'gpu', solPerHour: 2440, windowMin: 252, epoch: 233, at: '2026-10-01T16:00:00Z', host: 'Clore.ai', worker: 'QC-C68', pcie: '3.0 x8' },
  // steady rate after hour 2 (2h03m to 13h56m); the 14 h average incl. warm-up was about 2,570
  { label: '7x RTX 5080, EPYC 7B13, GPU only', cpu: 'EPYC 7B13', gpu: 'RTX 5080', gpuCount: 7, mode: 'gpu', solPerHour: 2460, windowMin: 713, epoch: 233, at: '2026-10-03T08:27:00Z', host: 'Clore.ai', worker: 'QC-C69', pcie: '4.0 x16' },
]

/** "Hardware at a glance" on the page: one row per part. */
export const GLANCE: { part: string; pick: string; note: string; sources: SourceId[] }[] = [
  { part: 'CPU', pick: 'Ryzen 9 7950X / 9950X, Threadripper 7000+, EPYC 9004/9005', note: 'For CPU-only and home builds AVX-512 leads; Ryzen 7 7700 and above is good. On a multi-card rig the CPU mainly feeds the cards: 12+ threads per card (our runs, epoch 233).', sources: ['academy', 'cointribune', 'field-e233'] },
  { part: 'GPU', pick: 'NVIDIA RTX 5070 Ti or 5080, 16 GB', note: 'CUDA 12, recent drivers. 12+ CPU threads per card, PCIe 4.0 x8 or 3.0 x16.', sources: ['cointribune', 'guide', 'field-e233'] },
  { part: 'Memory', pick: '32 GB or more', note: '16 GB minimum. Since epoch 233 about 3 GB per colony; our record rigs had 64 GB.', sources: ['academy', 'devs', 'field-e233'] },
  { part: 'Storage', pick: 'SSD', note: 'Required.', sources: ['academy'] },
  { part: 'Network', pick: '10 Mbps up and down', note: 'Stable, low latency.', sources: ['academy'] },
  { part: 'Mac', pick: 'Apple Silicon', note: 'Mines on the CPU.', sources: ['partner'] },
  { part: 'AMD Radeon', pick: 'Not measured by us', note: "Support depends on the pool's miner. NVIDIA/CUDA is the proven path.", sources: ['qli-mod', 'field'] },
  { part: 'Not for this pool', pick: 'Xeon E5 for CPU mining, Core Ultra, ASICs', note: 'Too slow, or a different kind of mining. Xeon E5 v3/v4 can still host GPUs.', sources: ['guide', 'field-e233', 'doge'] },
]

export type BuildTier = 'entry' | 'cpu' | 'gpu' | 'server'

/** Buy path: concrete builds, best first within each tier. No prices: they change weekly. */
export const BUILDS: Record<BuildTier, { title: string; specs: [string, string][]; reasons: string[]; sources: SourceId[] }> = {
  entry: {
    title: 'Entry: Ryzen 7 7700',
    specs: [['CPU', 'Ryzen 7 7700 (8 cores, AVX-512)'], ['RAM', '32 GB DDR5'], ['Disk', 'SSD'], ['GPU', 'none to start']],
    reasons: ['The lowest tier the Academy rates good. Room to add a card later.'],
    sources: ['academy'],
  },
  cpu: {
    title: 'Strong CPU: Ryzen 9 9950X',
    specs: [['CPU', 'Ryzen 9 9950X (16 cores, AVX-512)'], ['RAM', '32 to 64 GB DDR5, fast kit'], ['Disk', 'SSD'], ['GPU', 'optional']],
    reasons: ['Best-tier desktop CPU for CPU-only mining (Academy). Cointribune (Sep 2026) rates a CPU like this slightly above a GPU under BPP-9000; in our epoch 233 runs GPUs carried most solutions, so add a card for more output.'],
    sources: ['academy', 'cointribune'],
  },
  gpu: {
    title: 'CPU + GPU: 9950X + RTX 5070 Ti',
    specs: [['CPU', 'Ryzen 9 9950X'], ['GPU', 'RTX 5070 Ti 16 GB, CUDA 12'], ['RAM', '64 GB DDR5'], ['Disk', 'SSD'], ['Slot', 'PCIe x8 or better']],
    reasons: ['Both engines on: the CPU feeds the card and mines on its own. With one or two cards AVX-512 added about 7 to 8% in our epoch 229 runs.', 'The 5070 Ti is the value card behind a strong CPU.'],
    sources: ['academy', 'guide', 'field-e229'],
  },
  server: {
    title: 'Server: EPYC 9004 / 9005',
    specs: [['CPU', 'EPYC 9004 or 9005 (AVX-512)'], ['RAM', '64 GB+ ECC DDR5'], ['Disk', 'SSD'], ['GPU', 'several 16 GB RTX cards, 12+ threads each']],
    reasons: ['Server grade, best in class for many cards.', 'Run GPU only on many cards. Keep PCIe 4.0 x8 or 3.0 x16 per card.'],
    sources: ['academy', 'guide', 'field-e233'],
  },
}
