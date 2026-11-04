/**
 * Hardware picker and consult: deterministic verdicts from knowledge.ts (Qubic Academy, the 2026
 * Cointribune guide, our mining guide). Pure functions, no React, no network: see __tests__/pool.test.mts.
 */
import type { Os } from './config.ts'
import { HARDWARE_FIGURES, HARDWARE_FIGURES_SOURCE } from './config.ts'
import { BUILDS, type BuildTier, type SourceId } from './knowledge.ts'

export type Verdict = 'Golden' | 'Good' | 'Works' | 'Skip' | 'Unknown'
export type Avx = 'avx512' | 'avx2' | 'none' | 'apple' | 'unknown'
export type Card = { title: string; verdict: Verdict; reasons: string[]; specs?: [string, string][]; sources?: SourceId[]; avx?: Avx }

export const VERDICT_RANK: Record<Verdict, number> = { Golden: 4, Good: 3, Works: 2, Unknown: 1, Skip: 0 }

const est = (its: number) => `about ${its} it/s (est., ${HARDWARE_FIGURES_SOURCE.label}${HARDWARE_FIGURES_SOURCE.date ? `, ${HARDWARE_FIGURES_SOURCE.date}` : ''})`
const fig = (name: string) => HARDWARE_FIGURES.find(f => f.name === name)?.itPerSec

const CHECK_AVX = 'Check on Linux: grep -o -m1 avx512f /proc/cpuinfo prints avx512f if the CPU has AVX-512.'
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
    if (/\be[357][- ]?\d{4}|\be[357]\b/.test(s)) return card(title, 'Skip', ['Old and no AVX-512. Looks like a server CPU, mines like a brick.'], 'avx2', [['ISA', 'AVX2']], ['guide'])
    const scal = s.match(/(platinum|gold|silver|bronze) ?(\d)(\d)(\d{2})/)
    if (scal) {
      if (Number(scal[3]) >= 3) return card(title, 'Good', ['Recent Xeon Scalable: real AVX-512 and plenty of cores.', 'Keep at least 8 CPU cores per GPU.'], 'avx512', [['ISA', 'AVX-512']], ['guide'])
      return card(title, 'Works', ['Early Xeon Scalable: AVX-512 on older, slower cores.'], 'avx512', [['ISA', 'AVX-512']], ['guide'])
    }
    if (/xeon ?6\d{3}e\b/.test(s)) return card(title, 'Works', ['Xeon 6 E-core part: no AVX-512, mines on AVX2.'], 'avx2', [['ISA', 'AVX2']], ['academy'])
    if (/xeon ?6\d{3}p\b|xeon w[- ]?\d/.test(s)) return card(title, 'Good', ['Recent Xeon with AVX-512.', 'Keep at least 8 CPU cores per GPU.'], 'avx512', [['ISA', 'AVX-512']], ['academy'])
    return card(title, 'Unknown', ["I don't recognise this Xeon. Recent Scalable (Gold, Platinum) is good; E5 is a skip.", CHECK_AVX], 'unknown')
  }
  if (/\bi3\b|core i3|i3-/.test(s)) return card(title, 'Skip', ['Budget chip. If it has 2 cores it chokes the miner.'], 'avx2', undefined, ['guide'])
  if (/\bi[579]\b|core i[579]|i[579]-/.test(s)) {
    return card(title, 'Works', ['Intel works, but is slower unless the CPU has AVX-512 enabled. Most Core i5/i7/i9 parts mine on AVX2.', CHECK_AVX], 'avx2', [['ISA', 'AVX2 on most generations']], ['academy'])
  }

  // AMD
  if (/epyc/.test(s)) {
    const n = s.match(/epyc ?(\d)(\d)(\d)(\d)/)
    if (n) {
      const [series, last] = [n[1], n[4]]
      if (series === '9' && (last === '4' || last === '5')) return card(title, 'Golden', ['EPYC with AVX-512: server grade, best tier.', 'Keep at least 8 CPU cores per GPU.'], 'avx512', [['ISA', 'AVX-512'], ['Gen', last === '5' ? 'Zen 5' : 'Zen 4']], ['academy', 'guide'])
      if ((series === '4' || series === '8') && (last === '4' || last === '5')) return card(title, 'Good', ['Zen 4/5 EPYC with AVX-512.'], 'avx512', [['ISA', 'AVX-512']], ['academy'])
      if (series === '7') return card(title, 'Works', ['EPYC 7002 / 7003 (Zen 2/3): AVX2 only. It mines, slower than EPYC 9004/9005.'], 'avx2', [['ISA', 'AVX2']], ['guide'])
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
          r.push('With a GPU, keep at least 8 CPU cores per card.')
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
    return card(title, 'Skip', ['AMD Radeon cards are not supported by the official GPU miner and are unreliable.', 'Mine on the CPU instead, or use an NVIDIA card.'], 'none', undefined, ['guide'])
  }
  if (/\barc\b|intel/.test(s)) return card(title, 'Skip', ['Not an NVIDIA card. The GPU miner needs CUDA 12.'], 'none', undefined, ['cointribune'])
  if (/apple|\bm[1-5]\b/.test(s)) return card(title, 'Unknown', ['On a Mac the CPU does the mining; the built-in GPU is not used.'], 'none')
  const cuda: [string, string] = ['Needs', 'CUDA 12, recent driver']
  if (/5070 ?ti/.test(s)) return card(title, 'Golden', ['The value pick: best cost per solution behind a strong CPU.'], 'none', [['VRAM', '16 GB'], cuda], ['guide', 'cointribune'])
  if (/5090/.test(s)) return card(title, 'Good', ['Fast and pricey. Pays off only while a solution is worth a lot.'], 'none', [['VRAM', '32 GB'], cuda], ['guide'])
  if (/4090/.test(s)) return card(title, 'Good', ['Fast and pricey. Pays off only while a solution is worth a lot.'], 'none', [['VRAM', '24 GB'], cuda], ['guide'])
  if (/3090/.test(s)) return card(title, 'Good', ['Old but cheap. Often the quiet winner on cost per solution.'], 'none', [['VRAM', '24 GB'], cuda], ['guide'])
  if (/3080/.test(s)) return card(title, 'Good', ['Old but cheap. Often the quiet winner on cost per solution.'], 'none', [['VRAM', '10 to 12 GB'], cuda], ['guide'])
  if (/rtx|gtx|nvidia|geforce|quadro|tesla|\b[ahl]\d{2,3}\b|\bh100\b|\ba100\b/.test(s)) {
    return card(title, 'Works', ['NVIDIA card: it mines. VRAM matters most; a card with little memory gets smaller tasks.'], 'none', [cuda], ['cointribune'])
  }
  return card(title, 'Unknown', ["I don't recognise this card. NVIDIA cards with CUDA 12 work; AMD Radeon is not supported."], 'none')
}

export function classifyRam(gb: number): Card {
  const specs: [string, string][] = [['RAM', `${gb} GB`]]
  if (gb < 16) return card('Memory', 'Skip', ['Under the 16 GB minimum.'], 'none', specs, ['academy'])
  if (gb < 32) return card('Memory', 'Works', ['At the 16 GB minimum. 32 GB or more is recommended.'], 'none', specs, ['academy'])
  return card('Memory', 'Good', ['32 GB or more, as recommended. Faster RAM helps the iteration rate.'], 'none', specs, ['academy', 'cointribune'])
}

export type PickMode = 'buy' | 'rent' | 'own'
export type Scale = 'small' | 'mid' | 'large'
export type PickInput = { mode: PickMode; scale?: Scale; build?: BuildTier; os?: Os; cpu?: string; gpu?: string; gpuCount?: number; cores?: number; ramGb?: number }
export type PickResult = { overall: Verdict; cards: Card[]; notes: string[] }

export const SELF_CHECK = 'Your own cost per solution = daily cost ÷ solutions per day. Run one machine for one epoch, read the real solution count, divide.'
export const BASICS = 'Every rig: 16 GB RAM minimum (32 GB+ recommended), an SSD, and 10 Mbps up and down.'
const RULES_NOTE = 'At least 8 CPU cores per GPU, PCIe x8 or better, and a host with 99% or better uptime.'

const SKIPS: Card[] = [
  card('AMD Radeon cards', 'Skip', ['Not supported by the official GPU miner, and unreliable.'], 'none', undefined, ['guide']),
  card('Xeon E5, Core Ultra, 2-core budget chips', 'Skip', ['No AVX-512 or too few cores. The CPU chokes the cards.'], 'none', undefined, ['guide']),
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
    if (scale === 'small') cards.push(card('One RTX 5070 Ti box, for an hour', 'Golden', ['Behind a Zen 4/5 or EPYC CPU with 8+ cores.', 'Deposit small, run it for an hour, prove the loop, then decide.'], 'avx512', [['GPU', 'RTX 5070 Ti 16 GB'], ['CPU', 'Zen 4/5 or EPYC, 8+ cores'], ['RAM', '32 GB+'], ['Disk', 'SSD']], ['guide', 'academy']))
    if (scale === 'mid') {
      cards.push(card('Strong AVX-512 CPU box', 'Golden', ['Under BPP-9000 a strong CPU is slightly more efficient than a GPU.'], 'avx512', [['CPU', 'Ryzen 9 7950X / 9950X or EPYC 9004/9005'], ['RAM', '32 GB+'], ['Disk', 'SSD']], ['academy', 'cointribune']))
      cards.push(card('RTX 5070 Ti + Zen 4/5 CPU', 'Golden', ['Run GPU and CPU together.'], 'avx512', [['GPU', 'RTX 5070 Ti 16 GB'], ['CPU', '8+ cores per card']], ['guide']))
    }
    if (scale === 'large') {
      cards.push(card('Several RTX 5070 Ti on EPYC 9004/9005 or Threadripper 7000+', 'Golden', [RULES_NOTE], 'avx512', [['GPU', 'RTX 5070 Ti × n'], ['CPU', '8+ cores per card'], ['Slot', 'PCIe x8+ each']], ['guide', 'academy']))
      cards.push(card('RTX 5090 / 4090', 'Good', ['Top speed, top cost. Pays off only while a solution is worth a lot.'], 'none', [['VRAM', '24 to 32 GB']], ['guide']))
    }
  }
  return [...cards, ...SKIPS]
}

export function pick(input: PickInput): PickResult {
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
  const cpu = classifyCpu(input.cpu ?? '')
  cards.push(cpu)
  const gpu = classifyGpu(input.gpu ?? '')
  if (gpu) cards.push(gpu)
  if (input.ramGb) cards.push(classifyRam(input.ramGb))

  const gpus = gpu ? Math.max(1, input.gpuCount ?? 1) : 0
  if (gpu && gpu.verdict !== 'Skip' && cpu.verdict === 'Skip') {
    notes.push('The CPU is the bottleneck: it will choke the card. Put the card behind a Zen 4/5 or EPYC CPU, or rent a box.')
  }
  if (gpus > 0 && input.cores && input.cores / gpus < 8) {
    notes.push(`${input.cores} CPU cores for ${gpus} GPU${gpus > 1 ? 's' : ''} is under 8 per card. Expect rejected candidates; use fewer cards or a bigger CPU.`)
    cpu.verdict = cpu.verdict === 'Golden' ? 'Good' : cpu.verdict
  }
  if (gpu && gpu.verdict !== 'Skip' && cpu.avx === 'avx512') notes.push('Run GPU and CPU together: this CPU has AVX-512, and under BPP-9000 the CPU does real work.')
  if (input.os === 'macos' && gpu && gpu.verdict !== 'Unknown') notes.push('On macOS the pool mines on the CPU. NVIDIA cards need Linux, Windows or HiveOS.')
  notes.push(BASICS)
  notes.push(SELF_CHECK)

  // Overall: the CPU leads (it is the backbone); a good card lifts a works CPU by one step.
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
