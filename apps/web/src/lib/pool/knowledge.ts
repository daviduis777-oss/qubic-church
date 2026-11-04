/**
 * Hardware knowledge with a source and date per fact. The picker, the "Hardware at a glance" section
 * and Maria's AI prompt all read from here. Add a fact here, not in a component.
 */

export type SourceId = 'academy' | 'cointribune' | 'guide' | 'partner' | 'doge' | 'field'

export const SOURCES: Record<SourceId, { label: string; url: string; date: string }> = {
  academy: { label: 'Qubic Academy, Mining 1.2', url: 'https://qubic.org/academy/mining/module-1/lesson-2', date: 'checked 4 Nov 2026' },
  cointribune: { label: 'Cointribune 2026 mining guide', url: 'https://www.cointribune.com/en/start-mining-qubic-the-complete-2026-guide/', date: '20 Sep 2026' },
  guide: { label: 'Qubic Church mining guide', url: '/mine-qubic', date: 'v0.3, epoch 230' },
  partner: { label: "Pool partner's hardware table", url: '', date: 'est.' },
  doge: { label: 'Qubic DOGE launch release', url: 'https://doge-stats.qubic.org/', date: '1 Apr 2026' },
  field: { label: 'Qubic Church field runs on Clore', url: '', date: 'epochs 233 to 234, Oct 2026' },
}

export const sourceLine = (ids: SourceId[]) => ids.map(id => `${SOURCES[id].label} (${SOURCES[id].date})`).join('; ')

export type Fact = { topic: string; text: string; sources: SourceId[] }

/** Short, checkable facts. The AI prompt lists these verbatim with their sources. */
export const FACTS: Fact[] = [
  { topic: 'CPU', text: 'Best CPUs: AMD Ryzen 9 7900X / 7950X / 7950X3D / 9950X / 9950X3D, Threadripper 7000 and newer, EPYC with AVX-512.', sources: ['academy'] },
  { topic: 'CPU', text: 'Good CPUs: AMD Ryzen 7, 7700 and above.', sources: ['academy'] },
  { topic: 'CPU', text: 'Intel works, but is generally slower unless the CPU has AVX-512 enabled.', sources: ['academy'] },
  { topic: 'CPU', text: 'Under BPP-9000 a strong CPU is slightly more efficient than an NVIDIA GPU, so an AVX-512 CPU is the backbone of a rig.', sources: ['cointribune'] },
  { topic: 'CPU', text: 'Skip Xeon E5, Intel Core Ultra (no AVX-512) and 2-core Celeron / Pentium / i3. Keep at least 8 CPU cores per GPU.', sources: ['guide'] },
  { topic: 'GPU', text: 'Only NVIDIA cards, through CUDA 12 and recent drivers. VRAM matters most: cards with too little get smaller tasks.', sources: ['cointribune'] },
  { topic: 'GPU', text: 'RTX 5070 Ti (16 GB) is the value pick behind a strong CPU. RTX 5090 / 4090 are fast but pricey. RTX 3090 / 3080 are old but cheap.', sources: ['guide'] },
  { topic: 'GPU', text: 'AMD Radeon is not supported by the official GPU miner and is unreliable.', sources: ['guide'] },
  { topic: 'RAM', text: 'RAM: 16 GB DDR4/DDR5 minimum, 32 GB or more recommended. Higher RAM frequency helps the iteration rate.', sources: ['academy', 'cointribune'] },
  { topic: 'Storage', text: 'An SSD is required.', sources: ['academy'] },
  { topic: 'Network', text: 'Stable broadband, at least 10 Mbps up and down. Low latency shortens job turnaround.', sources: ['academy'] },
  { topic: 'Host', text: 'PCIe x8 or better per card, and a host with 99% or better uptime.', sources: ['guide'] },
  { topic: 'Mac', text: 'Apple Silicon Macs mine on the CPU through the pool macOS miner. The M3 Pro runs at about 40 it/s (est.).', sources: ['partner'] },
  { topic: 'Measured', text: 'Measured, epoch 233: 4x RTX 4090 (PCIe 3.0 x8, Xeon E5-2696 v3 36/72 threads, GPU only) averaged about 2,440 sol/h over about 8 hours, so about 610 sol/h per 4090.', sources: ['field'] },
  { topic: 'Measured', text: 'Measured, 10 Oct 2026: 7x RTX 5080 on an EPYC server made about 2,460 sol/h and beat the 4x 4090 Haswell rig on both sol/h and solutions per dollar. The platform behind the cards matters more than the card tier.', sources: ['field'] },
  { topic: 'Measured', text: 'The RTX 5080 (16 GB) rents cheaply because 16 GB is too small for AI rental, yet it is enough for Qubic. On rentals judge price per card: aim for about 8 USD/day or less per 16 GB card (Oct 2026 market, changes weekly).', sources: ['field'] },
  { topic: 'Rental', text: 'Rental filters that worked: host reliability 98% or more, VRAM 16 GB or more, PCIe 4.0 x8 or 3.0 x16 (never x1/x4 risers), a recent server CPU (EPYC Zen 2 or newer, Threadripper Zen 4 or newer), 12 or more CPU threads per GPU, a max rental period of 12 h or more, and no hosts in Russia or Belarus (pool servers unreachable).', sources: ['field'] },
  { topic: 'Mode', text: 'Multi-GPU servers: run GPU only. One GPU next to a Ryzen 9 7000/9000 with AVX-512: run GPU and CPU together.', sources: ['field'] },
  { topic: 'Judging', text: 'Judging a rig, from our runs: do not judge it in the first 20 minutes (ant sessions start cold, solutions come in bursts); the first 1 to 2 hours overstate the rate by about 1.3 to 1.5x; judge by the wallet total on the pool, not the per-worker counter, which resets on restart; close a rig that shows 0 solutions after 20 minutes plus one restart.', sources: ['field'] },
  { topic: 'Measured', text: 'These measurements are from epochs 233 to 234. The mining algorithm changes every few weeks, so treat them as a calibration point, not a constant, until the pool reports fresh numbers.', sources: ['field'] },
  { topic: 'ASIC', text: 'Since 1 April 2026 Qubic also mines Dogecoin on ASICs, on separate hardware. ASICs are not for this pool: it mines with CPUs and NVIDIA GPUs.', sources: ['doge'] },
]

/** "Hardware at a glance" on the page: one row per part. */
export const GLANCE: { part: string; pick: string; note: string; sources: SourceId[] }[] = [
  { part: 'CPU', pick: 'Ryzen 9 7950X / 9950X, Threadripper 7000+, EPYC 9004/9005', note: 'AVX-512 is the backbone. Ryzen 7 7700 and above is good.', sources: ['academy', 'cointribune'] },
  { part: 'GPU', pick: 'NVIDIA RTX 5070 Ti 16 GB', note: 'CUDA 12, recent drivers, generous VRAM. 8+ CPU cores per card.', sources: ['cointribune', 'guide'] },
  { part: 'Memory', pick: '32 GB or more', note: '16 GB minimum. Faster RAM helps.', sources: ['academy', 'cointribune'] },
  { part: 'Storage', pick: 'SSD', note: 'Required.', sources: ['academy'] },
  { part: 'Network', pick: '10 Mbps up and down', note: 'Stable, low latency.', sources: ['academy'] },
  { part: 'Mac', pick: 'Apple Silicon', note: 'Mines on the CPU.', sources: ['partner'] },
  { part: 'Not for this pool', pick: 'AMD Radeon, Xeon E5, Core Ultra, ASICs', note: 'Unsupported, too slow, or a different kind of mining.', sources: ['guide', 'doge'] },
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
    reasons: ['Best-tier desktop CPU. Under BPP-9000 a CPU like this does slightly better than a GPU.'],
    sources: ['academy', 'cointribune'],
  },
  gpu: {
    title: 'CPU + GPU: 9950X + RTX 5070 Ti',
    specs: [['CPU', 'Ryzen 9 9950X'], ['GPU', 'RTX 5070 Ti 16 GB, CUDA 12'], ['RAM', '64 GB DDR5'], ['Disk', 'SSD'], ['Slot', 'PCIe x8 or better']],
    reasons: ['Both engines on: the CPU feeds the card and mines on its own.', 'The 5070 Ti is the value card behind a strong CPU.'],
    sources: ['academy', 'cointribune', 'guide'],
  },
  server: {
    title: 'Server: EPYC 9004 / 9005',
    specs: [['CPU', 'EPYC 9004 or 9005 (AVX-512)'], ['RAM', '64 GB+ ECC DDR5'], ['Disk', 'SSD'], ['GPU', 'several RTX 5070 Ti, 8+ cores each']],
    reasons: ['Server grade, best in class for many cards.', 'Keep PCIe x8+ per card and 99%+ uptime.'],
    sources: ['academy', 'guide'],
  },
}
