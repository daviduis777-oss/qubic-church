/**
 * Hardware picker and consult: deterministic verdicts from the mining guide's tables.
 * Pure functions, no React, no network: unit-tested in __tests__/pool.test.mts.
 */
import type { Os } from './config.ts'
import { HARDWARE_FIGURES, HARDWARE_FIGURES_SOURCE } from './config.ts'

export type Verdict = 'Golden' | 'Good' | 'Works' | 'Skip' | 'Unknown'
export type Card = { title: string; verdict: Verdict; reasons: string[]; avx?: 'avx512' | 'avx2' | 'none' | 'apple' | 'unknown' }

export const VERDICT_RANK: Record<Verdict, number> = { Golden: 4, Good: 3, Works: 2, Unknown: 1, Skip: 0 }

const est = (its: number) => `about ${its} it/s (est., ${HARDWARE_FIGURES_SOURCE.label}${HARDWARE_FIGURES_SOURCE.date ? `, ${HARDWARE_FIGURES_SOURCE.date}` : ''})`
const fig = (name: string) => HARDWARE_FIGURES.find(f => f.name === name)?.itPerSec

const CHECK_AVX = 'Check it yourself on Linux: grep -o -m1 avx512f /proc/cpuinfo (prints avx512f if the CPU has AVX-512).'

/** Classify a CPU model string. Unknown strings get an honest "I don't recognise it" with a way to check. */
export function classifyCpu(raw: string): Card {
  const s = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  const title = raw.trim() || 'CPU'
  if (!s) return { title: 'CPU', verdict: 'Unknown', reasons: ['No CPU given.'], avx: 'unknown' }

  // Apple Silicon
  const m = s.match(/\bm([1-5])\b(?: (pro|max|ultra))?/)
  if (/apple|macbook|mac mini|imac|mac studio|\bm[1-5]\b/.test(s) && m) {
    const reasons = ['Apple Silicon mines on the CPU through the pool setup for macOS.']
    if (m[1] === '3' && m[2] === 'pro') reasons.push(`The M3 Pro runs at ${est(fig('Apple M3 Pro') ?? 40)}.`)
    reasons.push('it/s is speed, not pay. Judge it by solutions per hour.')
    return { title, verdict: 'Works', reasons, avx: 'apple' }
  }
  if (/intel/.test(s) && /mac/.test(s)) {
    return { title, verdict: 'Works', reasons: ['Intel Mac: AVX2 only, so it mines slowly.', 'Fine to try. Not worth buying for mining.'], avx: 'avx2' }
  }

  // Intel budget and no-AVX-512 lines
  if (/celeron|pentium|atom|\bn100\b|\bn200\b|\bn\d{3}\b/.test(s)) {
    return { title, verdict: 'Skip', reasons: ['Budget chip with too few cores. It chokes the miner and any card behind it.'], avx: 'none' }
  }
  if (/core ultra|\bultra [579] \d{3}|arrow lake|meteor lake|lunar lake/.test(s)) {
    return { title, verdict: 'Skip', reasons: ['Modern, but Intel dropped AVX-512 on these chips.', 'It would mine on AVX2 only, slower than a Zen 4/5 or EPYC.'], avx: 'avx2' }
  }
  if (/xeon/.test(s)) {
    if (/\be[357][- ]?\d{4}|\be[357]\b/.test(s)) {
      return { title, verdict: 'Skip', reasons: ['Xeon E5 / E3 / E7: old and no AVX-512. Looks like a server CPU, mines like a brick.'], avx: 'avx2' }
    }
    const scal = s.match(/(platinum|gold|silver|bronze) ?(\d)(\d)(\d{2})/)
    if (scal) {
      const gen = Number(scal[3])
      if (gen >= 3) return { title, verdict: 'Good', reasons: ['Recent Xeon Scalable: real AVX-512 and plenty of cores.', 'Keep at least 8 CPU cores per GPU.'], avx: 'avx512' }
      return { title, verdict: 'Works', reasons: ['Early Xeon Scalable: AVX-512, but older and slower cores.', 'Works; a Zen 4/5 or EPYC 9004/9005 does far better.'], avx: 'avx512' }
    }
    if (/xeon ?6\d{3}e\b/.test(s)) return { title, verdict: 'Works', reasons: ['Xeon 6 E-core part: no AVX-512, mines on AVX2.'], avx: 'avx2' }
    if (/xeon ?6\d{3}p\b|xeon w[- ]?\d/.test(s)) return { title, verdict: 'Good', reasons: ['Recent Xeon with AVX-512.', 'Keep at least 8 CPU cores per GPU.'], avx: 'avx512' }
    return { title, verdict: 'Unknown', reasons: ["I don't recognise this Xeon. Recent Scalable (Gold, Platinum) is good; E5 is a skip.", CHECK_AVX], avx: 'unknown' }
  }
  if (/\bi3\b|core i3|i3-/.test(s)) {
    return { title, verdict: 'Skip', reasons: ['Budget chip. If it has 2 cores it chokes the miner.', 'No AVX-512 on most i3 parts.'], avx: 'avx2' }
  }
  if (/\bi[579]\b|core i[579]|i[579]-/.test(s)) {
    return { title, verdict: 'Works', reasons: ['Intel Core i5/i7/i9: AVX2 on most generations, so it mines, but slower than AVX-512 chips.', CHECK_AVX], avx: 'avx2' }
  }

  // AMD
  if (/epyc/.test(s)) {
    const n = s.match(/epyc ?(\d)(\d)(\d)(\d)/)
    if (n) {
      const [series, last] = [n[1], n[4]]
      if (series === '9' && (last === '4' || last === '5')) return { title, verdict: 'Golden', reasons: ['EPYC 9004 / 9005: server grade, full AVX-512, best in class.', 'Keep at least 8 CPU cores per GPU.'], avx: 'avx512' }
      if ((series === '4' || series === '8') && (last === '4' || last === '5')) return { title, verdict: 'Good', reasons: ['Zen 4/5 EPYC with AVX-512.'], avx: 'avx512' }
      if (series === '7') return { title, verdict: 'Works', reasons: ['EPYC 7002 / 7003 (Zen 2/3): AVX2 only. It mines, slower than EPYC 9004/9005.'], avx: 'avx2' }
    }
    return { title, verdict: 'Unknown', reasons: ["I don't recognise this EPYC. 9004 and 9005 are golden; 7002/7003 are AVX2 only.", CHECK_AVX], avx: 'unknown' }
  }
  if (/threadripper/.test(s)) {
    const n = s.match(/(\d)9\d\dw?x/)
    if (n && (n[1] === '7' || n[1] === '9')) return { title, verdict: 'Golden', reasons: ['Threadripper 7000 / 9000 (Zen 4/5): full AVX-512, many fast cores.', 'A strong host for several GPUs at 8+ cores each.'], avx: 'avx512' }
    if (n) return { title, verdict: 'Works', reasons: ['Older Threadripper (Zen 2/3): AVX2 only. Mines, slower than Zen 4/5.'], avx: 'avx2' }
    return { title, verdict: 'Unknown', reasons: ["I can't read the generation. 7000 and 9000 Threadrippers are golden.", CHECK_AVX], avx: 'unknown' }
  }
  if (/ryzen ai/.test(s)) {
    return { title, verdict: 'Good', reasons: ['Ryzen AI (Zen 5): AVX-512.', 'Laptop cooling limits how long it holds full speed.'], avx: 'avx512' }
  }
  if (/ryzen|\b[1-9]\d{3}(x3d|x|g|f)\b/.test(s)) {
    const n = s.match(/(\d)(\d)(\d)(\d)([a-z0-9]*)/)
    if (n) {
      const [gen, , arch, , suffix] = [n[1], n[2], n[3], n[4], n[5]]
      const laptop = /^(u|h|hs|hx)$/.test(suffix ?? '')
      const zen45 =
        gen === '9' || // Ryzen 9000 (Zen 5)
        (gen === '7' && (arch === '0' || arch === '4' || arch === '5')) || // 7x00 desktop, 7x40/7x45 mobile
        gen === '8' // Ryzen 8000 (Zen 4)
      if (zen45 && !laptop) {
        const r = ['Ryzen 7000 / 9000 (Zen 4/5): full AVX-512, many fast cores.']
        if (/7950x/.test(s)) r.push(`The 7950X runs at ${est(fig('AMD Ryzen 9 7950X') ?? 30)}.`)
        r.push('With a GPU, keep at least 8 CPU cores per card.')
        return { title, verdict: 'Golden', reasons: r, avx: 'avx512' }
      }
      if (zen45) return { title, verdict: 'Good', reasons: ['Zen 4/5 laptop chip: AVX-512.', 'Laptop cooling limits how long it holds full speed.'], avx: 'avx512' }
      if (/^[1-7]$/.test(gen ?? '')) return { title, verdict: 'Works', reasons: ['Older Ryzen (Zen 1 to 3): AVX2 only. It mines, slower than Zen 4/5.'], avx: 'avx2' }
    }
    return { title, verdict: 'Unknown', reasons: ["I can't read the Ryzen generation. 7000 and 9000 desktop chips are golden.", CHECK_AVX], avx: 'unknown' }
  }

  return { title, verdict: 'Unknown', reasons: ["I don't recognise this CPU. What matters: AVX-512 (fast), AVX2 (works, slower), and at least 8 cores per GPU.", CHECK_AVX], avx: 'unknown' }
}

/** Classify a GPU model string. */
export function classifyGpu(raw: string): Card | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!s || /^(none|no|no gpu|-|n\/a|cpu only)$/.test(s)) return null
  const title = raw.trim()
  if (/radeon|\brx ?\d{3,4}|amd|vega|navi/.test(s)) {
    return { title, verdict: 'Skip', reasons: ['AMD Radeon cards are not supported by the official GPU miner and are unreliable.', 'Mine on the CPU instead, or use an NVIDIA card.'] }
  }
  if (/\barc\b|intel/.test(s)) return { title, verdict: 'Skip', reasons: ['Not an NVIDIA CUDA card. The GPU miner needs CUDA.'] }
  if (/apple|\bm[1-5]\b/.test(s)) return { title, verdict: 'Unknown', reasons: ['On a Mac the CPU does the mining; the built-in GPU is not used.'] }
  if (/5070 ?ti/.test(s)) return { title, verdict: 'Golden', reasons: ['RTX 5070 Ti (16 GB): the value pick. Best cost per solution behind a strong CPU.', '16 GB of VRAM is plenty.'] }
  if (/5090|4090/.test(s)) return { title, verdict: 'Good', reasons: ['Fast and pricey. Pays off only while the value of a solution stays high.', 'Measure its cost per solution before you add more.'] }
  if (/3090|3080/.test(s)) return { title, verdict: 'Good', reasons: ['Old but cheap. Often the quiet winner on cost per solution.'] }
  if (/rtx|gtx|nvidia|geforce|quadro|tesla|\b[ahl]\d{2,3}\b|\bh100\b|\ba100\b/.test(s)) {
    return { title, verdict: 'Works', reasons: ['NVIDIA CUDA card: it mines.', 'Judge it by cost per solution, not by it/s.'] }
  }
  return { title, verdict: 'Unknown', reasons: ["I don't recognise this card. NVIDIA CUDA cards work; AMD Radeon is not supported by the official miner."] }
}

export type PickMode = 'buy' | 'rent' | 'own'
export type Scale = 'small' | 'mid' | 'large'
export type PickInput = { mode: PickMode; scale?: Scale; os?: Os; cpu?: string; gpu?: string; gpuCount?: number; cores?: number }
export type PickResult = { overall: Verdict; cards: Card[]; notes: string[] }

export const SELF_CHECK = 'Your own cost per solution = daily cost ÷ solutions per day. Run one machine for one epoch, read the real solution count, divide.'

const RULES_NOTE = 'At least 8 CPU cores per GPU, PCIe x8 or better, and a host with 99% or better uptime.'

/** Shopping verdicts for buy or rent. No prices: those change weekly and we do not invent them. */
function shopping(mode: 'buy' | 'rent', scale: Scale, os?: Os): Card[] {
  const cards: Card[] = []
  if (os === 'macos') {
    cards.push({ title: 'A Mac with Apple Silicon', verdict: 'Works', reasons: ['Mines on the CPU through the macOS setup.', `The M3 Pro runs at ${est(fig('Apple M3 Pro') ?? 40)}.`, 'Good to learn on. For more output, a Zen 4/5 PC or a rented NVIDIA box.'] })
  }
  if (scale === 'small') {
    if (mode === 'rent') {
      cards.push({ title: 'One RTX 5070 Ti box, for an hour', verdict: 'Golden', reasons: ['Behind a Zen 4/5 or EPYC CPU with 8+ cores.', 'Deposit small, run it for an hour, prove the loop, then decide.'] })
    } else {
      cards.push({ title: 'Ryzen 7000 / 9000 desktop (Zen 4/5)', verdict: 'Golden', reasons: ['Full AVX-512. Mines well on the CPU alone.', 'Room to add one NVIDIA card later.'] })
    }
  }
  if (scale === 'mid') {
    cards.push({ title: 'RTX 5070 Ti (16 GB) + Zen 4/5 CPU', verdict: 'Golden', reasons: ['Best cost per solution for most people.', 'Run GPU and CPU together when the CPU has AVX-512.'] })
    cards.push({ title: 'RTX 3090 / 3080', verdict: 'Good', reasons: ['Old but cheap. Often the quiet winner on cost per solution.'] })
  }
  if (scale === 'large') {
    cards.push({ title: 'Several RTX 5070 Ti + Threadripper 7000/9000 or EPYC 9004/9005', verdict: 'Golden', reasons: [RULES_NOTE, 'Beats a flashy 4×5090 box on cost per solution in most weeks.'] })
    cards.push({ title: 'RTX 5090 / 4090', verdict: 'Good', reasons: ['Top speed, top cost. Pays off only while the value of a solution stays high.'] })
  }
  cards.push({ title: 'AMD Radeon cards', verdict: 'Skip', reasons: ['Not supported by the official GPU miner, and unreliable.'] })
  cards.push({ title: 'Xeon E5, Intel Core Ultra, 2-core Celeron / Pentium / i3', verdict: 'Skip', reasons: ['No AVX-512 or too few cores. The CPU chokes the cards.'] })
  return cards
}

export function pick(input: PickInput): PickResult {
  const notes: string[] = []
  if (input.mode !== 'own') {
    const cards = shopping(input.mode, input.scale ?? 'small', input.os)
    if (input.mode === 'rent') notes.push('Rented boxes: Clore.ai, Octaspace, Vast.ai. Never type card numbers or your seed into a rental site.')
    notes.push(RULES_NOTE)
    notes.push(SELF_CHECK)
    return { overall: 'Golden', cards, notes }
  }

  const cards: Card[] = []
  const cpu = classifyCpu(input.cpu ?? '')
  cards.push(cpu)
  const gpu = classifyGpu(input.gpu ?? '')
  if (gpu) cards.push(gpu)

  const gpus = gpu ? Math.max(1, input.gpuCount ?? 1) : 0
  if (gpu && gpu.verdict !== 'Skip' && cpu.verdict === 'Skip') {
    notes.push('The CPU is the bottleneck: it will choke the card. Put the card behind a Zen 4/5 or EPYC CPU, or rent a box.')
  }
  if (gpus > 0 && input.cores && input.cores / gpus < 8) {
    notes.push(`${input.cores} CPU cores for ${gpus} GPU${gpus > 1 ? 's' : ''} is under 8 per card. Expect rejected candidates; use fewer cards or a bigger CPU.`)
    cpu.verdict = cpu.verdict === 'Golden' ? 'Good' : cpu.verdict
  }
  if (gpu && gpu.verdict !== 'Skip' && cpu.avx === 'avx512') notes.push('Run GPU and CPU together: this CPU has AVX-512.')
  if (input.os === 'macos' && gpu && gpu.verdict !== 'Unknown') notes.push('On macOS the pool mines on the CPU. NVIDIA cards need Linux, Windows or HiveOS.')
  notes.push(SELF_CHECK)

  // Overall: the best usable part decides, unless the CPU chokes a GPU.
  const usable = cards.filter(c => c.verdict !== 'Skip' && c.verdict !== 'Unknown')
  let overall: Verdict = usable.length ? usable.reduce((a, c) => (VERDICT_RANK[c.verdict] > VERDICT_RANK[a] ? c.verdict : a), 'Works' as Verdict) : cards.some(c => c.verdict === 'Unknown') ? 'Unknown' : 'Skip'
  if (gpu && cpu.verdict === 'Skip' && overall !== 'Skip') overall = 'Works'
  return { overall, cards, notes }
}
