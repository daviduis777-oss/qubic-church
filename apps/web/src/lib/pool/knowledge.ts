/**
 * Public hardware knowledge with a source and date: the sources, our field runs, the "Hardware at a glance"
 * rows and the buy builds. The picker, the page and Maria's prompt read from here. Maria's own facts,
 * ecosystem notes and FAQ are in her private brain (brain-schema.ts), not in this repo.
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

/**
 * Our own runs as structured rows, so measure.ts can seed them as `field` samples. They must agree with
 * the "Measured" facts in Maria's brain (a brain test checks the numbers). Times are UTC. Only runs with a measured sol/h
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
