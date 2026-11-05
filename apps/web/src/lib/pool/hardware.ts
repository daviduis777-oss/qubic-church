/**
 * Hardware picker and consult: deterministic verdicts from knowledge.ts (Qubic Academy, the 2026
 * Cointribune guide, our mining guide, our own field runs in epochs 229 and 233). Where the field runs
 * disagree with a guide, the text says which applies when. Pure functions, no React, no network:
 * see __tests__/pool.test.mts.
 */
import type { Os } from './config.ts'
import { judge, type Measured, rowFor, type Summary } from './aggregate.ts'
import { newestEraSummary } from './stats-view.ts'
import { HARDWARE_FIGURES, HARDWARE_FIGURES_SOURCE } from './config.ts'
import { BUILDS, type BuildTier, type SourceId } from './knowledge.ts'
import { normalizeCpu, normalizeGpu } from './measure.ts'

export type Verdict = 'Golden' | 'Good' | 'Works' | 'Skip' | 'Unknown'
export type Avx = 'avx512' | 'avx2' | 'none' | 'apple' | 'unknown'
/** measured: what our miners measure for this part (aggregate.ts), shown under the guide's verdict. */
export type Card = { title: string; verdict: Verdict; reasons: string[]; specs?: [string, string][]; sources?: SourceId[]; avx?: Avx; measured?: Measured }

export const VERDICT_RANK: Record<Verdict, number> = { Golden: 4, Good: 3, Works: 2, Unknown: 1, Skip: 0 }

const est = (its: number) => `about ${its} it/s (est., ${HARDWARE_FIGURES_SOURCE.label}${HARDWARE_FIGURES_SOURCE.date ? `, ${HARDWARE_FIGURES_SOURCE.date}` : ''})`
const fig = (name: string) => HARDWARE_FIGURES.find(f => f.name === name)?.itPerSec

const CHECK_AVX = 'Check on Linux: grep -o -m1 avx512f /proc/cpuinfo prints avx512f if the CPU has AVX-512.'
/** AMD Radeon: we have no measurement, and support depends on the pool's miner (not a flat no). */
export const AMD_REASONS = ["No measurements from us. Support depends on the pool's miner.", 'A QLI moderator said in July 2026 that QLI and jetski (not recommended) supported AMD; an AMD GPU miner was announced for later (30 Jul and 1 Aug 2026).', 'NVIDIA/CUDA is the proven path.']

/** Xeon E5 v3/v4 behind GPUs: what our runs measured. */
const E5_HOST = 'As a GPU host it works if threads per card and PCIe are fine: 4x RTX 4090 on an E5-2696 v3 made about 2,440 sol/h (epoch 233). EPYC hosts did better per dollar.'

const ASIC_RE = /\basic\b|antminer|whatsminer|goldshell|elphapex|\bscrypt\b|\bl[379]\b|innosilicon|bitmain/

const card = (title: string, verdict: Verdict, reasons: string[], avx: Avx, specs?: [string, string][], sources?: SourceId[]): Card => ({ title, verdict, reasons, avx, specs, sources })

export const isAsic = (s: string) => ASIC_RE.test(s.toLowerCase())

export const ASIC_CARD: Card = card(
  'ASIC miner',
  'Skip',
  ['ASICs are not for this pool. Since 1 April 2026 Qubic mines Dogecoin on ASICs, on separate hardware.', 'This pool mines with CPUs and NVIDIA GPUs.'],
  'none',
  undefined,
  ['doge'],
)

/** Classify a CPU model string. Unknown strings get an honest "I don't recognise it" with a way to check. */
export function classifyCpu(raw: string): Card {
  const s = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  const title = raw.trim() || 'CPU'
  if (!s) return card('CPU', 'Unknown', ['No CPU given.'], 'unknown')
  if (isAsic(s)) return { ...ASIC_CARD, title }

  // Apple Silicon
  const m = s.match(/\bm([1-5])\b(?: (pro|max|ultra))?/)
  if (/apple|macbook|mac mini|imac|mac studio|\bm[1-5]\b/.test(s) && m) {
    const reasons = ['Apple Silicon mines on the CPU through the pool macOS miner.']
    if (m[1] === '3' && m[2] === 'pro') reasons.push(`The M3 Pro runs at ${est(fig('Apple M3 Pro') ?? 40)}.`)
    reasons.push('it/s is speed, not pay. Judge it by solutions per hour.')
    return card(title, 'Works', reasons, 'apple', [['Path', 'CPU, macOS miner']], ['partner'])
  }
  if (/intel/.test(s) && /mac/.test(s)) return card(title, 'Works', ['Intel Mac: AVX2 only, so it mines slowly.', 'Fine to try. Not worth buying for mining.'], 'avx2')

  // Intel budget and no-AVX-512 lines
  if (/celeron|pentium|atom|\bn100\b|\bn200\b|\bn\d{3}\b/.test(s)) {
    return card(title, 'Skip', ['Budget chip with too few cores. It chokes the miner and any card behind it.'], 'none', undefined, ['guide'])
  }
  if (/core ultra|\bultra [579] \d{3}|arrow lake|meteor lake|lunar lake/.test(s)) {
    return card(title, 'Skip', ['Modern, but Intel dropped AVX-512 on these chips, and Intel is slower without it.'], 'avx2', [['ISA', 'AVX2 only']], ['academy', 'guide'])
  }
  if (/xeon/.test(s)) {
    if (/\be5[- ]?\d{4}[a-z]? ?v[34]\b/.test(s)) {
      return card(title, 'Skip', ['For CPU mining: skip. AVX2 only, and in our runs an AVX2 CPU lane added nearly nothing.', E5_HOST], 'avx2', [['ISA', 'AVX2'], ['As GPU host', 'Works']], ['guide', 'field-e229', 'field-e233'])
    }
    if (/\be[357][- ]?\d{4}|\be[357]\b/.test(s)) return card(title, 'Skip', ['Old and no AVX-512. Looks like a server CPU, mines like a brick.', 'E5 v1/v2 lack even AVX2; only E5 v3/v4 worked as GPU hosts in our runs.'], 'avx2', [['ISA', 'AVX2 or older']], ['guide', 'field-e229'])
    const scal = s.match(/(platinum|gold|silver|bronze) ?(\d)(\d)(\d{2})/)
    if (scal) {
      if (Number(scal[3]) >= 3) return card(title, 'Good', ['Recent Xeon Scalable: real AVX-512 and plenty of cores.', 'Keep at least 8 CPU cores per GPU.'], 'avx512', [['ISA', 'AVX-512']], ['guide'])
      return card(title, 'Works', ['Early Xeon Scalable: AVX-512 on older, slower cores.'], 'avx512', [['ISA', 'AVX-512']], ['guide'])
    }
    if (/xeon ?6\d{3}e\b/.test(s)) return card(title, 'Works', ['Xeon 6 E-core part: no AVX-512, mines on AVX2.'], 'avx2', [['ISA', 'AVX2']], ['academy'])
    if (/xeon ?6\d{3}p\b|xeon w[- ]?\d/.test(s)) return card(title, 'Good', ['Recent Xeon with AVX-512.', 'Keep at least 8 CPU cores per GPU.'], 'avx512', [['ISA', 'AVX-512']], ['academy'])
    return card(title, 'Unknown', ["I don't recognise this Xeon. Recent Scalable (Gold, Platinum) is good; E5 is a skip for CPU mining, and E5 v3/v4 works as a GPU host.", CHECK_AVX], 'unknown')
  }
  if (/\bi3\b|core i3|i3-/.test(s)) return card(title, 'Skip', ['Budget chip. If it has 2 cores it chokes the miner.'], 'avx2', undefined, ['guide'])
  if (/\bi[579]\b|core i[579]|i[579]-/.test(s)) {
    return card(title, 'Works', ['Intel works, but is slower unless the CPU has AVX-512 enabled. Most Core i5/i7/i9 parts mine on AVX2.', CHECK_AVX], 'avx2', [['ISA', 'AVX2 on most generations']], ['academy'])
  }

  // AMD
  if (/epyc/.test(s)) {
    // cloud parts carry a letter in the second place: 7B12, 7B13, 7K62, 7V12, 7C13
    const n = s.match(/epyc ?(\d)([0-9a-z])(\d)(\d)/)
    if (n) {
      const [series, last] = [n[1], n[4]]
      if (series === '9' && (last === '4' || last === '5')) return card(title, 'Golden', ['EPYC with AVX-512: server grade, best tier.', 'Keep at least 8 CPU cores per GPU.'], 'avx512', [['ISA', 'AVX-512'], ['Gen', last === '5' ? 'Zen 5' : 'Zen 4']], ['academy', 'guide'])
      if ((series === '4' || series === '8') && (last === '4' || last === '5')) return card(title, 'Good', ['Zen 4/5 EPYC with AVX-512.'], 'avx512', [['ISA', 'AVX-512']], ['academy'])
      if (series === '7') return card(title, 'Works', ['EPYC 7002 / 7003 (Zen 2/3): AVX2 only. As a CPU miner it is slower than EPYC 9004/9005.', 'As a GPU host it was our best: an EPYC 7B12 had the best cost per solution in epoch 229, and an EPYC 7B13 fed our 7x RTX 5080 record in epoch 233. Run GPU only.'], 'avx2', [['ISA', 'AVX2'], ['As GPU host', 'Golden in our runs']], ['guide', 'field-e229', 'field-e233'])
    }
    return card(title, 'Unknown', ["I don't recognise this EPYC. 9004 and 9005 are best tier; 7002/7003 are AVX2 only.", CHECK_AVX], 'unknown')
  }
  if (/threadripper/.test(s)) {
    const n = s.match(/(\d)9\d\dw?x/)
    if (n && (n[1] === '7' || n[1] === '9')) return card(title, 'Golden', ['Threadripper 7000 and newer: best tier, full AVX-512, many fast cores.', 'A strong host for several GPUs at 8+ cores each.'], 'avx512', [['ISA', 'AVX-512']], ['academy'])
    if (n) return card(title, 'Works', ['Older Threadripper (Zen 2/3): AVX2 only. Mines, slower than 7000 and newer.'], 'avx2', [['ISA', 'AVX2']], ['academy'])
    return card(title, 'Unknown', ["I can't read the generation. Threadripper 7000 and newer is best tier.", CHECK_AVX], 'unknown')
  }
  if (/ryzen ai/.test(s)) return card(title, 'Works', ['Ryzen AI (Zen 5) laptop chip: AVX-512, but laptop cooling limits sustained load.'], 'avx512', [['ISA', 'AVX-512']], ['academy'])
  if (/ryzen|\b[1-9]\d{3}(x3d|x|g|f)\b/.test(s)) {
    const n = s.match(/(\d)(\d)(\d)(\d)([a-z0-9]*)/)
    const cls = s.match(/ryzen ?([3579])\b/)?.[1]
    if (n) {
      const [model, gen, , arch, , suffix] = [n[0], n[1], n[2], n[3], n[4], n[5] ?? '']
      const laptop = /^(u|h|hs|hx)$/.test(suffix)
      const zen45 = gen === '9' || gen === '8' || (gen === '7' && (arch === '0' || arch === '4' || arch === '5'))
      const tier = cls ?? (Number(n[2]) >= 9 ? '9' : Number(n[2]) >= 7 ? '7' : '5')
      const specs: [string, string][] = [['ISA', zen45 ? 'AVX-512' : 'AVX2'], ['Gen', zen45 ? (gen === '9' ? 'Zen 5' : 'Zen 4') : 'Zen 1 to 3']]
      if (zen45 && laptop) return card(title, 'Works', ['Zen 4/5 laptop chip: AVX-512, but laptop cooling limits sustained load.'], 'avx512', specs, ['academy'])
      if (zen45) {
        const best = /^(7900x|7950x|7950x3d|9950x|9950x3d)$/.test(`${model.slice(0, 4)}${suffix}`)
        if (best) {
          const r = ['Best tier in the Qubic Academy list: full AVX-512, many fast cores.']
          if (/7950x/.test(s)) r.push(`The 7950X runs at ${est(fig('AMD Ryzen 9 7950X') ?? 30)}.`)
          r.push('With one or two GPUs, run GPU and CPU together: AVX-512 added about 7 to 8% in our epoch 229 runs. With more cards, run GPU only.')
          return card(title, 'Golden', r, 'avx512', specs, ['academy'])
        }
        if (tier === '9') return card(title, 'Good', ['Ryzen 9 on Zen 4/5: AVX-512, close to the best tier.'], 'avx512', specs, ['academy'])
        if (tier === '7') return card(title, 'Good', ['Ryzen 7 (7700 and above): good tier, full AVX-512.'], 'avx512', specs, ['academy'])
        return card(title, 'Works', ['AVX-512, but only 6 cores. Ryzen 7 7700 and above is the good tier.'], 'avx512', specs, ['academy'])
      }
      if (/^[1-7]$/.test(gen ?? '')) return card(title, 'Works', ['Older Ryzen (Zen 1 to 3): AVX2 only. It mines, slower than Zen 4/5.'], 'avx2', specs, ['academy'])
    }
    return card(title, 'Unknown', ["I can't read the Ryzen generation. Ryzen 9 7950X / 9950X are best tier; Ryzen 7 7700 and above is good.", CHECK_AVX], 'unknown')
  }

  return card(title, 'Unknown', ["I don't recognise this CPU. What matters: AVX-512 (fast), AVX2 (works, slower), and at least 8 cores per GPU.", CHECK_AVX], 'unknown')
}

/** Classify a GPU model string. */
export function classifyGpu(raw: string): Card | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!s || /^(none|no|no gpu|-|n\/a|cpu only)$/.test(s)) return null
  const title = raw.trim()
  if (isAsic(s)) return { ...ASIC_CARD, title }
  if (/radeon|\brx ?\d{3,4}|amd|vega|navi/.test(s)) {
    return card(title, 'Unknown', AMD_REASONS, 'none', undefined, ['qli-mod', 'field'])
  }
  if (/\barc\b|intel/.test(s)) return card(title, 'Skip', ['Not an NVIDIA card. The GPU miner needs CUDA 12.'], 'none', undefined, ['cointribune'])
  if (/apple|\bm[1-5]\b/.test(s)) return card(title, 'Unknown', ['On a Mac the CPU does the mining; the built-in GPU is not used.'], 'none')
  const cuda: [string, string] = ['Needs', 'CUDA 12, recent driver']
  if (/5070 ?ti/.test(s)) return card(title, 'Golden', ['The value pick: best cost per solution behind a strong CPU.', 'Measured: 2 of them on an EPYC 7B12 had the best cost per solution of our fleet in epoch 229.', 'Epoch 229 counts were tens per hour; from epoch 233 thousands. Compare rates within one epoch only.'], 'none', [['VRAM', '16 GB'], cuda, ['Measured', 'best cost per solution, E229']], ['guide', 'cointribune', 'field-e229'])
  if (/5080/.test(s)) return card(title, 'Golden', ['Our best measured rental value: 7 of them on an EPYC 7B13 (PCIe 4.0 x16) matched 4x 4090 on a Haswell Xeon in sol/h (about 2,460 against 2,440) at about half the price, so about 1.9x the solutions per dollar (epoch 233, 2 to 3 Oct 2026).', 'Rents cheap: 16 GB is too small for AI jobs, enough for Qubic.'], 'none', [['VRAM', '16 GB'], cuda, ['Measured', '7x ~2,460 sol/h, E233']], ['field-e233'])
  if (/5090/.test(s)) return card(title, 'Good', ['Fast and pricey. Pays off only while a solution is worth a lot.', 'In epoch 229 a fresh 5090 rig at 154 it/s per card showed 0 solutions while a 5070 Ti at 80 had 133: judge solutions, not it/s. We have no epoch 233 run of a well-fed 5090.'], 'none', [['VRAM', '32 GB'], cuda], ['guide', 'field-e229'])
  if (/4090/.test(s)) return card(title, 'Good', ['Fast and pricey. Pays off only while a solution is worth a lot.', 'Measured: about 610 sol/h per card in a 4-card GPU-only rig on a Xeon E5-2696 v3, PCIe 3.0 x8 (epoch 233).', 'Same sol/h as our 7x RTX 5080 rig at about twice the rent.'], 'none', [['VRAM', '24 GB'], cuda, ['Measured', '~610 sol/h, E233']], ['guide', 'field-e233'])
  if (/3090/.test(s)) return card(title, 'Good', ['Old but cheap. Often the quiet winner on cost per solution.'], 'none', [['VRAM', '24 GB'], cuda], ['guide'])
  if (/3080/.test(s)) return card(title, 'Good', ['Old but cheap. Often the quiet winner on cost per solution.'], 'none', [['VRAM', '10 to 12 GB'], cuda], ['guide'])
  // Pre-Turing (GTX 7/9/10 series, Tesla and Quadro K/M/P): dropped by the epoch 237 CUDA worker (Qubic Discord, 20 to 28 Oct 2026).
  if (/\bgtx ?(7|9|10)\d{2}\b|\btesla ?[kmp]\d{2,3}\b|\bquadro ?[kmp]\d{3,4}\b/.test(s)) {
    return card(title, 'Skip', ['Treat GTX 10 series and older as unsupported: from epoch 237 (28 Oct 2026) a GTX 1050 Ti CUDA worker kept exiting, and a Tesla K80 does not run on current CUDA (reported on the Qubic Discord). The CPU still mines.'], 'none', [cuda], ['community', 'qli-team'])
  }
  if (/rtx|gtx|nvidia|geforce|quadro|tesla|\b[ahl]\d{2,3}\b|\bh100\b|\ba100\b/.test(s)) {
    return card(title, 'Works', ['NVIDIA card: it mines. VRAM matters most; a card with little memory gets smaller tasks.'], 'none', [cuda], ['cointribune'])
  }
  return card(title, 'Unknown', ["I don't recognise this card. NVIDIA cards with CUDA 12 are the proven path; AMD Radeon is not measured by us."], 'none')
}

export function classifyRam(gb: number): Card {
  const specs: [string, string][] = [['RAM', `${gb} GB`]]
  if (gb < 16) return card('Memory', 'Skip', ['Under the 16 GB minimum.'], 'none', specs, ['academy'])
  if (gb < 32) return card('Memory', 'Works', ['At the 16 GB minimum. 32 GB or more is recommended.'], 'none', specs, ['academy'])
  return card('Memory', 'Good', ['32 GB or more, as recommended. Faster RAM helps the iteration rate.', 'Since epoch 233 (POPULATION 64) a colony needs about 3 GB; our record rigs had 64 GB.'], 'none', specs, ['academy', 'cointribune', 'devs', 'field-e233'])
}

export type PickMode = 'buy' | 'rent' | 'own'
export type Scale = 'small' | 'mid' | 'large'
export type PickInput = { mode: PickMode; scale?: Scale; build?: BuildTier; os?: Os; cpu?: string; gpu?: string; gpuCount?: number; cores?: number; ramGb?: number }
export type PickResult = { overall: Verdict; cards: Card[]; notes: string[] }

export const SELF_CHECK = 'Your own cost per solution = daily cost ÷ solutions per day. Run one machine for one epoch, read the real solution count, divide.'
export const BASICS = 'Every rig: 16 GB RAM minimum (32 GB+ recommended), an SSD, and 10 Mbps up and down.'
const RULES_NOTE = 'At least 12 CPU threads per GPU, PCIe 4.0 x8 or 3.0 x16 per card, and a host with 98% or better reliability (our runs, epochs 229 and 233).'

const SKIPS: Card[] = [
  card('AMD Radeon cards', 'Unknown', AMD_REASONS, 'none', undefined, ['qli-mod', 'field']),
  card('Core Ultra, 2-core budget chips, Xeon E5 for CPU mining', 'Skip', ['No AVX-512 or too few cores. Xeon E5 v3/v4 can still host GPUs with 12+ threads per card.'], 'none', undefined, ['guide', 'field-e233']),
  ASIC_CARD,
]

const buildCard = (tier: BuildTier, verdict: Verdict = 'Golden'): Card => {
  const b = BUILDS[tier]
  return card(b.title, verdict, b.reasons, 'avx512', b.specs, b.sources)
}

function shopping(mode: 'buy' | 'rent', p: PickInput): Card[] {
  const cards: Card[] = []
  if (mode === 'buy') {
    if (p.os === 'macos') {
      cards.push(card('A Mac with Apple Silicon', 'Works', ['Mines on the CPU through the pool macOS miner.', `The M3 Pro runs at ${est(fig('Apple M3 Pro') ?? 40)}.`, 'For more output, one of the PC builds below.'], 'apple', [['Path', 'CPU, macOS miner']], ['partner']))
    }
    const tier = p.build ?? 'cpu'
    cards.push(buildCard(tier))
    // One step up and one step down, so the choice is visible.
    const order: BuildTier[] = ['entry', 'cpu', 'gpu', 'server']
    const i = order.indexOf(tier)
    if (order[i + 1]) cards.push(buildCard(order[i + 1]!, 'Good'))
    if (i > 0) cards.push(buildCard(order[i - 1]!, 'Good'))
  } else {
    const scale = p.scale ?? 'small'
    if (scale === 'small') cards.push(card('One RTX 5070 Ti box, for an hour', 'Golden', ['Behind a Zen 4/5 or EPYC CPU with 12+ threads per card.', 'Deposit small. Judge it after 20 minutes at the earliest and read the rate after 2 hours, then decide.'], 'avx512', [['GPU', 'RTX 5070 Ti 16 GB'], ['CPU', 'Zen 4/5 or EPYC, 12+ threads'], ['RAM', '32 GB+'], ['Disk', 'SSD']], ['guide', 'academy', 'field-e233']))
    if (scale === 'mid') {
      cards.push(card('RTX 5070 Ti + Zen 4/5 CPU', 'Golden', ['Run GPU and CPU together on one or two cards: AVX-512 added about 7 to 8% in our epoch 229 runs.'], 'avx512', [['GPU', 'RTX 5070 Ti 16 GB'], ['CPU', '12+ threads per card']], ['guide', 'field-e229']))
      cards.push(card('Strong AVX-512 CPU box', 'Good', ['CPU-only path: Cointribune (Sep 2026) rates a strong CPU slightly above a GPU under BPP-9000.', 'Our pool-wide snapshots: the CPU share of solutions fell from about 37% (epoch 229) to about 17% (epoch 233).'], 'avx512', [['CPU', 'Ryzen 9 7950X / 9950X or EPYC 9004/9005'], ['RAM', '32 GB+'], ['Disk', 'SSD']], ['academy', 'cointribune', 'pool-lanes']))
    }
    if (scale === 'large') {
      cards.push(card('Several 16 GB RTX cards (5070 Ti, 5080) on EPYC or Threadripper 7000+', 'Golden', ['Run GPU only.', RULES_NOTE, 'Our epoch 233 record: 7x RTX 5080 on an EPYC 7B13, PCIe 4.0 x16, about 2,460 sol/h steady.'], 'avx2', [['GPU', 'RTX 5070 Ti / 5080 × n'], ['CPU', '12+ threads per card'], ['Slot', 'PCIe 4.0 x8+ each']], ['guide', 'academy', 'field-e233']))
      cards.push(card('RTX 5090 / 4090', 'Good', ['Top speed, top cost. Pays off only while a solution is worth a lot.', 'In our runs 4090s and 5090s cost more per solution than 16 GB cards.'], 'none', [['VRAM', '24 to 32 GB']], ['guide', 'field-e229', 'field-e233']))
    }
  }
  return [...cards, ...SKIPS]
}

/**
 * Put the measured line on a part's card. The verdict changes only under the flip rule in aggregate.ts
 * (enough pool-reported rigs over enough epochs); otherwise a disagreement is shown next to the verdict.
 * The guide's own hand-written "Measured" line steps aside when live measurements exist.
 */
export function withMeasured(c: Card, key: string, all: Summary | null | undefined): Card {
  // only the newest algorithm era: a rate from an older era next to today's would read as a slow card
  const sum = newestEraSummary(all)
  const row = rowFor(sum, key)
  if (!row || !sum) return c
  const j = judge(row, sum.rows, c.verdict)
  return { ...c, verdict: j.verdict, measured: j.measured, specs: c.specs?.filter(([k]) => k !== 'Measured'), reasons: c.reasons.filter(r => !r.startsWith('Measured:')) }
}

export function pick(input: PickInput, measured?: Summary | null): PickResult {
  const notes: string[] = []
  if (input.mode !== 'own') {
    const cards = shopping(input.mode, input)
    if (input.mode === 'rent') notes.push('Rented boxes: Clore.ai, Octaspace, Vast.ai. Never type card numbers or your seed into a rental site.')
    notes.push(BASICS)
    notes.push(RULES_NOTE)
    notes.push(SELF_CHECK)
    return { overall: 'Golden', cards, notes }
  }

  if (isAsic(`${input.cpu ?? ''} ${input.gpu ?? ''}`)) return { overall: 'Skip', cards: [ASIC_CARD], notes: ['For this pool you need a CPU (ideally AVX-512) or an NVIDIA card.'] }

  const cards: Card[] = []
  const gpuName = normalizeGpu(input.gpu ?? '')
  const gpuRaw = classifyGpu(input.gpu ?? '')
  const cpuRaw = classifyCpu(input.cpu ?? '')
  // Xeon E5 v3/v4 is a skip for CPU mining, yet it hosted GPUs fine in our runs: judge it as a host here.
  const e5Host = gpuRaw && gpuRaw.verdict !== 'Skip' && cpuRaw.specs?.some(([k, v]) => k === 'As GPU host' && v === 'Works')
  const cpu = withMeasured(e5Host ? { ...cpuRaw, verdict: 'Works', reasons: [E5_HOST, 'Run GPU only and keep 12+ threads per card.'] } : cpuRaw, `cpu|${normalizeCpu(input.cpu ?? '')}`, measured)
  cards.push(cpu)
  // a GPU-only row is per card; without one, a GPU-and-CPU row for the same card
  const gpuKey = rowFor(measured, `gpu|${gpuName}`) ? `gpu|${gpuName}` : `mix|${gpuName}`
  const gpu = gpuRaw && gpuName ? withMeasured(gpuRaw, gpuKey, measured) : gpuRaw
  if (gpu) cards.push(gpu)
  if (input.ramGb) cards.push(classifyRam(input.ramGb))

  const gpus = gpu ? Math.max(1, input.gpuCount ?? 1) : 0
  if (gpu && gpu.verdict !== 'Skip' && cpu.verdict === 'Skip') {
    notes.push('The CPU is the bottleneck: it will choke the card. Put the card behind a Zen 4/5 or EPYC CPU, or rent a box.')
  }
  if (gpus > 0 && input.cores && input.cores / gpus < 8) {
    notes.push(`${input.cores} CPU cores for ${gpus} GPU${gpus > 1 ? 's' : ''} is under 8 per card (our runs: 12+ threads per card). Expect rejected candidates; use fewer cards or a bigger CPU.`)
    cpu.verdict = cpu.verdict === 'Golden' ? 'Good' : cpu.verdict
  }
  if (gpu && gpu.verdict !== 'Skip' && cpu.avx === 'avx512') {
    notes.push(
      gpus <= 2
        ? 'Run GPU and CPU together: this CPU has AVX-512. Next to one or two cards it added about 7 to 8% in our epoch 229 runs.'
        : 'Run GPU only on this many cards: the CPU is busier feeding and verifying for them. CPU plus 6 cards looped "Ant stream closed" in our epoch 229 runs.',
    )
  }
  if (gpu && gpu.verdict !== 'Skip' && cpu.avx === 'avx2' && /xeon|epyc|threadripper/i.test(cpu.title)) notes.push('Run GPU only: an AVX2 CPU lane added nearly nothing in our runs. The CPU still feeds the cards, so keep 12+ threads per card.')
  if (input.os === 'macos' && gpu && gpu.verdict !== 'Unknown') notes.push('On macOS the pool mines on the CPU. NVIDIA cards need Linux, Windows or HiveOS.')
  notes.push(BASICS)
  notes.push(SELF_CHECK)

  // Overall: the best usable part leads; a CPU that chokes its card caps the rig at Works.
  const usable = cards.filter(c => c.verdict !== 'Skip' && c.verdict !== 'Unknown' && c.title !== 'Memory')
  let overall: Verdict = usable.length
    ? usable.reduce((a, c) => (VERDICT_RANK[c.verdict] > VERDICT_RANK[a] ? c.verdict : a), 'Works' as Verdict)
    : cards.some(c => c.verdict === 'Unknown')
      ? 'Unknown'
      : 'Skip'
  if (gpu && cpu.verdict === 'Skip' && overall !== 'Skip') overall = 'Works'
  if (input.ramGb && input.ramGb < 16 && overall !== 'Skip') overall = 'Works'
  return { overall, cards, notes }
}
