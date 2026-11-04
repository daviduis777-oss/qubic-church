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
  | 'community'

export const SOURCES: Record<SourceId, { label: string; url: string; date: string }> = {
  academy: { label: 'Qubic Academy, Mining 1.2', url: 'https://qubic.org/academy/mining/module-1/lesson-2', date: 'checked 4 Nov 2026' },
  cointribune: { label: 'Cointribune 2026 mining guide', url: 'https://www.cointribune.com/en/start-mining-qubic-the-complete-2026-guide/', date: '20 Sep 2026' },
  guide: { label: 'Qubic Church mining guide', url: '/mine-qubic', date: 'v0.3, epoch 230' },
  partner: { label: "Pool partner's hardware table", url: '', date: 'est.' },
  doge: { label: 'Qubic DOGE launch release', url: 'https://doge-stats.qubic.org/', date: '1 Apr 2026' },
  field: { label: 'Qubic Church field runs on Clore', url: '', date: 'epochs 229 and 233, Sep to Oct 2026' },
  'field-e229': { label: 'Our field runs, epoch 229', url: '', date: '5 to 8 Sep 2026' },
  'field-e233': { label: 'Our field runs, epoch 233', url: '', date: '30 Sep to 3 Oct 2026' },
  'pool-lanes': { label: 'Pool-wide sol/h by lane, jetski dashboard (gone)', url: '', date: '6 Sep and 3 Oct 2026' },
  devs: { label: 'Qubic core dev posts on Discord', url: '', date: '25 to 27 Sep 2026' },
  cfb: { label: 'CfB on the Qubic Discord', url: '', date: 'Sep to Oct 2026' },
  'qli-mod': { label: 'QLI moderator on the Qubic Discord', url: '', date: '26 Jul 2026' },
  'jetski-op': { label: 'jetski pool operator (pool gone since about 10 Oct 2026)', url: '', date: 'Mar to Sep 2026' },
  community: { label: 'Qubic Discord #mining-general', url: '', date: '12 to 26 Sep 2026' },
}

export const sourceLine = (ids: SourceId[]) => ids.map(id => `${SOURCES[id].label} (${SOURCES[id].date})`).join('; ')

/** Our own measurements, by any of the field source ids. */
export const isField = (id: SourceId) => id === 'field' || id.startsWith('field-')

export type Fact = { topic: string; text: string; sources: SourceId[] }

/**
 * Short, checkable facts. The AI prompt lists these verbatim with their sources.
 * Where our own measurements disagree with a guide, both are listed and the text says which applies when.
 */
export const FACTS: Fact[] = [
  { topic: 'CPU', text: 'Best CPUs: AMD Ryzen 9 7900X / 7950X / 7950X3D / 9950X / 9950X3D, Threadripper 7000 and newer, EPYC with AVX-512.', sources: ['academy'] },
  { topic: 'CPU', text: 'Good CPUs: AMD Ryzen 7, 7700 and above.', sources: ['academy'] },
  { topic: 'CPU', text: 'Intel works, but is generally slower unless the CPU has AVX-512 enabled.', sources: ['academy'] },
  { topic: 'CPU', text: 'Cointribune (Sep 2026): under BPP-9000 a strong CPU is slightly more efficient than an NVIDIA GPU, so an AVX-512 CPU is the backbone. This and the Academy tiers apply to CPU-only and home builds.', sources: ['cointribune'] },
  { topic: 'CPU', text: 'Our GPU rigs measured otherwise. Epoch 229 (6 Sep 2026): AVX-512 on a Ryzen 9 7950X3D feeding 2 cards added about 7 to 8%; AVX2 CPUs added nearly nothing. The pool-wide CPU share of solutions fell from about 37% (epoch 229) to about 17% (epoch 233), CUDA about 79%. Our best epoch 233 rigs ran GPU only on non-AVX-512 CPUs; an AVX-512 Ryzen running CPU and GPU found 0. On a GPU rig the CPU mainly feeds and verifies for the cards.', sources: ['field-e229', 'field-e233', 'pool-lanes'] },
  { topic: 'CPU', text: 'Which applies when: no card, or a home PC with one or two cards, follow the CPU tiers and tick the CPU on an AVX-512 Ryzen. Rigs with three or more cards: GPU only, and pick the CPU for threads per card, not for AVX-512 (our epoch 229 and 233 runs).', sources: ['academy', 'field-e229', 'field-e233'] },
  { topic: 'CPU', text: 'For CPU mining skip Xeon E5, Intel Core Ultra (no AVX-512) and 2-core Celeron / Pentium / i3. Keep at least 8 CPU cores per GPU.', sources: ['guide'] },
  { topic: 'CPU', text: 'Xeon E5 v3/v4 as a GPU host works if threads per card and PCIe are fine: 4x RTX 4090 on an E5-2696 v3 (72 threads) made about 2,440 sol/h in epoch 233, and 2x RTX 5070 Ti on two E5-2650 v4 came within about 1 US cent per solution of our best rig in epoch 229. EPYC hosts did better per dollar, and a 2.2 GHz E5-2699 v4 held its cards back.', sources: ['field-e229', 'field-e233'] },
  { topic: 'GPU', text: 'NVIDIA cards through CUDA 12 and recent drivers are the proven path. VRAM matters: cards with too little get smaller tasks. 16 GB was enough in epoch 233 (64 neurons); not re-checked at 32 neurons.', sources: ['cointribune', 'field-e233'] },
  { topic: 'GPU', text: 'RTX 5070 Ti (16 GB) is the value pick behind a strong CPU. RTX 5090 / 4090 are fast but pricey. RTX 3090 / 3080 are old but cheap.', sources: ['guide'] },
  { topic: 'GPU', text: "AMD Radeon: no measurements from us. Support depends on the pool's miner; a QLI moderator said in July 2026 that QLI and jetski (now gone) supported AMD. NVIDIA/CUDA is the proven path.", sources: ['qli-mod', 'field'] },
  { topic: 'RAM', text: 'RAM: 16 GB DDR4/DDR5 minimum, 32 GB or more recommended. Higher RAM frequency helps the iteration rate.', sources: ['academy', 'cointribune'] },
  { topic: 'RAM', text: 'Before epoch 233 dev posts put a colony at about 45 to 90 GB of RAM. On 27 Sep 2026 POPULATION was set to 64, about 3 GB per colony, and the RAM scare ended. Our record rigs had 64 GB. RAM speed against output is not measured by us.', sources: ['devs', 'field-e233'] },
  { topic: 'Storage', text: 'An SSD is required.', sources: ['academy'] },
  { topic: 'Network', text: 'Stable broadband, at least 10 Mbps up and down. Low latency shortens job turnaround.', sources: ['academy'] },
  { topic: 'Host', text: 'PCIe x8 or better per card, and a host with 99% or better uptime.', sources: ['guide'] },
  { topic: 'Host', text: 'Platform over card, from our runs: 12 or more CPU threads per card, PCIe 4.0 x8 or 3.0 x16 (on 8 Sep 2026 PCIe 4.0 x4 halved the throughput of 2x RTX 4090 against x8), and a reliable host. A host can throttle every card: host 24255 held its RTX 5070 Tis back on every server we tried (epoch 229). Check the host ID before renting.', sources: ['field-e229'] },
  { topic: 'Mac', text: 'Apple Silicon Macs mine on the CPU through the pool macOS miner. The M3 Pro runs at about 40 it/s (est.).', sources: ['partner'] },
  { topic: 'Measured', text: 'Measured, epoch 229 (5 to 6 Sep 2026): 2x RTX 5070 Ti on an EPYC 7B12 (32 cores per card, PCIe 4.0 x4, 99% host reliability, GPU only) at 6.30 USD/day had the best cost per solution of our fleet, about 3 US cents: about 8.9 sol/h over 13.6 hours. Epoch 229 counts were tens per rig per hour; from epoch 233 they were thousands, so compare rates only within one epoch.', sources: ['field-e229'] },
  { topic: 'Measured', text: 'Measured, epoch 233 (1 Oct 2026): 4x RTX 4090 (PCIe 3.0 x8, Xeon E5-2696 v3 36/72 threads, GPU only) averaged about 2,440 sol/h over about 4 hours, so about 610 sol/h per 4090.', sources: ['field-e233'] },
  { topic: 'Measured', text: 'Measured, epoch 233 (2 to 3 Oct 2026): 7x RTX 5080 (250 W host limit) on an EPYC 7B13, PCIe 4.0 x16, 64 GB RAM, GPU only, at 44.10 USD/day: about 3,650 sol/h in hour 1, about 2,460 sol/h steady after hour 2, about 2,570 averaged over 14 hours. Same raw rate as the 4x 4090 Xeon rig at about half the price, so about 1.9x the solutions per dollar. The platform behind the cards matters more than the card tier.', sources: ['field-e233'] },
  { topic: 'Measured', text: 'The RTX 5080 (16 GB) rents cheaply because 16 GB is too small for AI rental, yet it is enough for Qubic. On rentals judge price per card: aim for about 8 USD/day or less per 16 GB card (Oct 2026 market, changes weekly).', sources: ['field-e233'] },
  { topic: 'Rental', text: 'Rental filters that worked in epochs 229 and 233: host reliability 98% or more, VRAM 16 GB or more, PCIe 4.0 x8 or 3.0 x16 (never x1/x4 risers), a recent server CPU (EPYC Zen 2 or newer, Threadripper Zen 4 or newer), 12 or more CPU threads per GPU, a max rental period of 12 h or more, no hosts in Russia, Belarus or China. On Clore use on-demand, not spot, and extend a rental well before it ends.', sources: ['field-e229', 'field-e233'] },
  { topic: 'Mode', text: 'Multi-GPU servers: run GPU only (6 cards plus CPU looped "Ant stream closed" every 2 seconds, 7 Sep 2026). One or two GPUs next to a Ryzen 9 7000/9000 with AVX-512: GPU and CPU together, worth about 7 to 8% (6 Sep 2026).', sources: ['field-e229'] },
  { topic: 'Judging', text: 'Judge by solutions per hour on the pool and the wallet total, never by it/s: one rig fell from 508 to 280 it/s in 30 minutes with no change in solutions, and a 5090 at 154 it/s per card found 0 while a 5070 Ti at 80 found 133 (epoch 229).', sources: ['field-e229'] },
  { topic: 'Judging', text: 'Judging a rig, from our epoch 229 and 233 runs: a fresh rig at 0 for 2 to 30 minutes is normal, so wait at least 20 minutes before judging; the first 1 to 2 hours overstate the rate by about 1.3 to 1.5x; the per-worker counter resets on restart, so check the wallet total; close a rig that shows 0 solutions after 20 minutes plus one restart.', sources: ['field-e229', 'field-e233'] },
  { topic: 'Operations', text: 'Operations from our epoch 229 and 233 runs: start with nohup and a log file, or the miner dies with the browser terminal; one miner process per box (a second one causes "Ant stream closed" or "address already in use"); a unique worker name per rig. Leave pool-side errors alone: HTTP 502, websocket close 1006, "retired-lease progress rejected".', sources: ['field-e229', 'field-e233'] },
  { topic: 'Payouts', text: "From epoch 233 a miner's income depended more on whether the pool's IDs won computor seats than on the rig: the ranking is the best (shift, error) per ID, not the solution count. Miners reported losses in some epochs.", sources: ['field-e233', 'cfb'] },
  { topic: 'Staleness', text: 'All our measurements are from epochs 229 and 233, on the jetski pool and its miner, both gone since about 10 Oct 2026. Since then epoch 235 changed the threshold and task file, epoch 236 moved to 32-neuron networks, and CfB said qualification moves to prediction accuracy after the live feed (about epoch 241). Treat every field number as a calibration point with its epoch, not a constant.', sources: ['field', 'cfb'] },
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
