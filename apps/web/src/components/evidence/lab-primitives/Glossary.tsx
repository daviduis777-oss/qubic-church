'use client'

/**
 * Inline glossary popover. Wrap any term with `<Glossary term="...">visible text</Glossary>`
 * and a small definition popover appears on hover/focus.
 *
 * The popover stays accessible via keyboard (focusable button) and on touch
 * (tap to toggle, tap-elsewhere to dismiss).
 */
import { type ReactNode, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlossaryEntry {
  /** Display title in the popover header. */
  title: string
  /** One-sentence definition. */
  short: ReactNode
  /** Optional longer explanation with analogy. */
  long?: ReactNode
  /** Optional unit/range hint. */
  range?: string
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // Mathematical building blocks
  matrix: {
    title: 'Matrix',
    short: 'A 2D grid of numbers. Anna is a 128 × 128 grid (16,384 numbers).',
    long: "Think of a spreadsheet with rows and columns. The 'cell' at row 3 column 5 holds one number. A matrix is just a labelled grid of those numbers.",
    range: 'Anna: 128 × 128 integer cells; each cell ∈ [−137, +137]',
  },
  hamming: {
    title: 'Hamming distance',
    short: 'How many bits differ between two strings of the same length.',
    long: 'If string A = 01010 and string B = 01100, they differ at positions 2 and 3 → Hamming distance = 2. Used everywhere bits are compared.',
    range: '0 = identical · max = length of string',
  },
  bit: {
    title: 'Bit',
    short: 'A single on/off value. Written as 0 or 1, or here as +1 / −1.',
    long: 'In Anna we use ±1 (signed bits) instead of 0/1. A 64-bit input is a list of 64 switches each ±1.',
  },
  sign: {
    title: 'sign(M)',
    short: 'Replace every number with +1 if positive, −1 if negative, 0 if zero.',
    long: "We use the 'sign-only' version of Anna for the AIT algorithm. Magnitudes (137, etc.) carry the design content but don't participate in the iteration.",
  },
  ait: {
    title: 'AIT',
    short: 'Aigarth Intelligent Tissue — the network architecture Anna runs on.',
    long: 'AIT is an iterative update: state v → sign(W · v) with input neurons held fixed. Stops when outputs are all non-zero, or state stops changing.',
  },
  attractor: {
    title: 'Attractor (concept)',
    short: 'A stable output pattern the dynamics keep returning to.',
    long: 'Picture marbles rolling on a hilly landscape. They all end up in the valleys (attractors). Anna has 19 distinct valleys; random matrices have none.',
    range: 'Anna: exactly 19 (Phase N) · random: 0',
  },
  basin: {
    title: 'Basin',
    short: 'The set of inputs that flow into the same attractor.',
    long: 'Like the watershed of a valley — the area whose rain drains to one lake. Stable basins are where small input changes do NOT change the output.',
    range: 'Anna: ~7.3 % of inputs are stable basin members (Phase N M3)',
  },
  avalanche: {
    title: 'Avalanche',
    short: 'Output bits that change when one input bit flips.',
    long: 'Small avalanche (~0–3 bits): the output is stable. Big avalanche (28+): the input is near a boundary between concepts. Anna shows bimodal: most either low or high.',
    range: '0–64 bits · Anna mean ≈ 17.5 (Phase N M3)',
  },
  // Geometric / linear-algebra
  antipodal: {
    title: 'Antipodal antisymmetry',
    short: 'M[i, j] = −M[127−i, 127−j] for almost all cells.',
    long: "If you point-reflect Anna through the centre, every cell flips sign. 99.4 % of Anna's cells satisfy this. Random matrices: ~50 % by chance.",
    range: 'Anna: 99.4 % · random: 50.9 %',
  },
  cophenet: {
    title: 'Cophenetic correlation',
    short: 'How well a hierarchical clustering captures the data — 1.0 = perfect.',
    long: "Anna's attractor set forms a clean two-level tree (cophenet 0.68); random matrices show no hierarchy (cophenet ≈ 0.13). The difference is 45σ above noise.",
    range: 'Anna: 0.68 · random: 0.13',
  },
  pca: {
    title: 'PCA',
    short: 'Principal Component Analysis — find the 2 directions of biggest spread.',
    long: 'Imagine plotting 19 points in 64-D space; PCA finds the flat plane that captures most of their variance. Used to draw the concept scatter.',
    range: '2D projection captures 95 % of variance in Anna concepts',
  },
  // Statistical
  sigma: {
    title: 'σ (sigma)',
    short: 'Standard deviation. 45σ means 45 standard deviations above noise.',
    long: 'In normal sciences, 5σ is a discovery (≈ 1 in 3.5 million by chance). 45σ is so far above chance the probability is essentially zero (< 10⁻⁴⁰⁰).',
  },
  cohens_d: {
    title: "Cohen's d",
    short: 'Effect size. d ≥ 0.8 = large, d ≥ 1.2 = very large.',
    long: 'Measures how separated two distributions are in units of their standard deviation. Phase D Anna vs density-matched: d > 30 (extremely separated).',
  },
  // Anna-specific
  hyperidentity: {
    title: 'HyperIdentity',
    short: "Qubic mining's scoring rule: output bit i should match input bit i.",
    long: "Anna sits at HyperIdentity Config0 (the smallest test scale: 64 in / 64 out / 128 neurons dense). Production HyperIdentity is much larger (Config2: 512 / 512 sparse).",
  },
  kernel: {
    title: 'Kernel (Anna)',
    short: "The first 32 rows of Anna; they generate 94.5 % of the matrix via 'kernel + decorations' rule.",
    long: 'The remaining 96 rows are nearly reconstructible from the first 32: copy them, then rotate-and-flip-sign for rows 64–127. About 904 cells deviate (the decorations).',
    range: 'Kernel cells: 4,096 of 16,384 (25 %) · decorations: 904',
  },
  key_landmark: {
    title: 'K-e-y landmark',
    short: 'M[8,74] = −75, M[9,75] = 101, M[10,76] = −121 — ASCII codes for "K", "e", "y".',
    long: 'A position-specific signature on the diagonal of Anna. Has no functional effect on AIT, but is verifiable and unrecoverable by random search.',
  },
  // Used by Aigarth Lab
  config0: {
    title: 'Config0',
    short: 'The smallest test configuration of HyperIdentity: 64 input / 64 output / 128 neurons dense.',
    long: 'Anna fits Config0 dimensions exactly. Production HyperIdentity (Config2) is 512 / 512 with sparse connectivity. Anna is a reference substrate for the test scale.',
  },
  bias_correction: {
    title: 'Bias correction',
    short: "Subtract what the output would be if Anna's bits were just 86 % zeros, then check what's left.",
    long: "Anna's outputs are 86 % zeros (D10 finding), which inflates apparent task-success on tasks where the ground truth is also sparse. After bias correction, 7 of 14 tasks still show genuine task-conditional signal.",
  },
  welch: {
    title: 'Welch p-value',
    short: 'Probability the observed difference is just noise. p < 10⁻²⁸ = essentially zero.',
    long: 'The Welch t-test compares two distributions with potentially different variances. p-value < 10⁻²⁸ means we would see this difference by chance less than once in 10²⁸ trials.',
  },
}

interface GlossaryProps {
  /** Key into the GLOSSARY map. Must exist. */
  term: keyof typeof GLOSSARY
  children: ReactNode
}

const POPOVER_WIDTH_DESKTOP = 288 // w-72
const POPOVER_WIDTH_MOBILE = 256 // w-64

export function Glossary({ term, children }: GlossaryProps) {
  const entry = GLOSSARY[term]
  const [open, setOpen] = useState(false)
  const [shift, setShift] = useState(0) // horizontal offset in px to clamp popover to viewport
  const [popoverWidth, setPopoverWidth] = useState(POPOVER_WIDTH_DESKTOP)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  // Edge-detection: clamp popover inside viewport when trigger is near an edge
  useEffect(() => {
    if (!open) return
    const btn = buttonRef.current
    if (!btn) return
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
    const w = vw < 480 ? POPOVER_WIDTH_MOBILE : POPOVER_WIDTH_DESKTOP
    setPopoverWidth(w)
    const rect = btn.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const halfPop = w / 2
    const margin = 12 // viewport margin
    let s = 0
    if (centerX - halfPop < margin) {
      s = margin - (centerX - halfPop) // shift right
    } else if (centerX + halfPop > vw - margin) {
      s = (vw - margin) - (centerX + halfPop) // shift left (negative)
    }
    setShift(s)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (
        !buttonRef.current?.contains(e.target as Node) &&
        !popRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    function handleResize() {
      setOpen(false) // close on resize to recompute next open
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleResize)
    }
  }, [open])

  if (!entry) return <>{children}</>

  return (
    <span className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault()
          setOpen((o) => !o)
        }}
        className="inline border-b border-dotted border-[#D4AF37]/50 hover:border-[#D4AF37] hover:text-[#D4AF37] focus:text-[#D4AF37] focus:border-[#D4AF37] cursor-help text-inherit bg-transparent p-0 font-inherit"
        aria-expanded={open}
        aria-describedby={open ? `gloss-${term}` : undefined}
      >
        {children}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={popRef}
            id={`gloss-${term}`}
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{ width: popoverWidth, transform: `translateX(calc(-50% + ${shift}px))` }}
            className={cn(
              'absolute z-50 left-1/2 bottom-full mb-2',
              'bg-[#0A0A0A] border border-[#D4AF37]/35 shadow-xl px-3 py-2.5',
              'pointer-events-auto select-text',
            )}
          >
            <div className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] mb-1">{entry.title}</div>
            <div className="text-xs text-white/90 leading-snug">{entry.short}</div>
            {entry.long && (
              <div className="text-[11px] text-white/65 mt-1.5 leading-snug">{entry.long}</div>
            )}
            {entry.range && (
              <div className="text-[10px] font-mono text-[#D4AF37]/70 mt-1.5 border-t border-white/[0.06] pt-1.5">
                {entry.range}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}

/** Convenience helper for rendering inline glossary terms inside markdown-ish strings. */
export type GlossaryKey = keyof typeof GLOSSARY
