'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { ClueCard, OpenQuestion, Prose, type Clue } from '../shared/Story'
import { loadAnnaMatrix } from './Phase07_AnnaSpeaks'

const N = 128
const at = (m: number[][], r: number, c: number) => m[r]?.[c] ?? 0

function MatrixCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [m, setM] = useState<number[][] | null>(null)
  const [mode, setMode] = useState<'all' | 'broken'>('all')
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null)

  useEffect(() => {
    loadAnnaMatrix()
      .then(setM)
      .catch(() => setM(null))
  }, [])

  const broken = useMemo(() => {
    const s = new Set<number>()
    if (!m) return s
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (at(m, r, c) + at(m, N - 1 - r, N - 1 - c) !== -1) s.add(r * N + c)
    return s
  }, [m])

  useEffect(() => {
    const cv = ref.current
    if (!cv || !m) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const img = ctx.createImageData(N, N)
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        const v = at(m, r, c)
        const k = (r * N + c) * 4
        const t = Math.min(1, Math.abs(v) / 128)
        const isBroken = broken.has(r * N + c)
        let rgb: [number, number, number]
        if (mode === 'broken') rgb = isBroken ? [255, 210, 74] : [Math.round(30 * t), Math.round(30 * t), Math.round(36 * t)]
        else rgb = v >= 0 ? [Math.round(255 * t), Math.round(200 * t), Math.round(60 * t)] : [Math.round(120 * t), Math.round(80 * t), Math.round(220 * t)]
        img.data[k] = rgb[0]
        img.data[k + 1] = rgb[1]
        img.data[k + 2] = rgb[2]
        img.data[k + 3] = 255
      }
    ctx.putImageData(img, 0, 0)
  }, [m, mode, broken])

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * N)
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * N)
    if (r >= 0 && r < N && c >= 0 && c < N) setHover({ r, c })
  }

  const v = hover && m ? at(m, hover.r, hover.c) : null

  return (
    <div className="border border-white/10 bg-black/70 p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold">The Anna Matrix, 128 &times; 128</p>
        <div className="flex gap-2 text-xs">
          {(
            [
              ['all', 'All 16,384 replies'],
              ['broken', 'The 68 that break the mirror'],
            ] as const
          ).map(([k, label]) => (
            <button
              aria-pressed={mode === k}
              className={`border px-3 py-1.5 transition-colors ${mode === k ? 'border-gold bg-gold/15 text-gold' : 'border-white/15 text-white/60 hover:text-white'}`}
              key={k}
              onClick={() => setMode(k)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-[minmax(0,420px)_1fr] md:items-start">
        <canvas
          aria-label="Heat map of the 128 by 128 Anna Matrix. Gold cells are positive replies, violet cells negative."
          className="aspect-square w-full max-w-[420px] cursor-crosshair border border-white/10 [image-rendering:pixelated]"
          height={N}
          onPointerLeave={() => setHover(null)}
          onPointerMove={onMove}
          ref={ref}
          role="img"
          width={N}
        />
        <div className="space-y-3 font-mono text-sm text-white/60">
          {hover && v !== null ? (
            <>
              <p>
                Row {hover.r}, column {hover.c}
              </p>
              <p className="text-white/85">
                Anna: {hover.c - 64} + {63 - hover.r} = <span className="text-2xl text-gold">{v}</span>
              </p>
              <p>
                Mirror cell [{N - 1 - hover.r}][{N - 1 - hover.c}] = {m ? at(m, N - 1 - hover.r, N - 1 - hover.c) : ''}
              </p>
              <p className={broken.has(hover.r * N + hover.c) ? 'text-gold' : ''}>
                {broken.has(hover.r * N + hover.c) ? 'This cell breaks the mirror.' : 'Together they make -1.'}
              </p>
            </>
          ) : (
            <p>Move across the grid. Every cell is one reply. Each has a twin on the opposite side of the centre, and almost every pair adds up to exactly -1.</p>
          )}
        </div>
      </div>
    </div>
  )
}

const CLUES: Clue[] = [
  {
    title: 'A perfect mirror, almost',
    text: '16,316 of 16,384 cells obey one rule: a cell and its twin across the centre add up to -1. Flip every bit of the question and Anna flips every bit of the answer.',
    status: 'documented',
    source: 'Verified facts',
    href: '/docs/05-appendices/02-foundation-facts',
  },
  {
    title: 'Sixty-eight exceptions',
    text: 'The cells that break the mirror sit in four runs. One looks like a block pasted a row off. Another, in column 22, fits neither the bot nor its mirror. Where it came from is unclear.',
    status: 'documented',
    source: 'Where the Anna Matrix comes from',
    href: '/docs/03-results/36-where-the-anna-matrix-comes-from',
  },
  {
    title: '137 on the diagonal',
    text: 'Add up the diagonal of the table as it was typed and you get 137, the number physicists know from the fine-structure constant. One cell pair, very likely mistyped, makes the difference.',
    status: 'documented',
    source: 'Verified facts',
    href: '/docs/05-appendices/02-foundation-facts',
  },
  {
    title: 'K, e, y',
    text: 'Three cells on the diagonal hold 75, 101 and 121. In ASCII those are the letters K, e and y. By the numbers, chance makes this unremarkable. It still reads Key.',
    status: 'documented',
    source: 'Verified facts',
    href: '/docs/05-appendices/02-foundation-facts',
  },
  {
    title: 'It beats in fours',
    text: 'Feed the table a pattern of +1, 0 and -1 and repeat. For all 768 patterns tested, it settles into one of two four-step cycles, each the exact negative of the other.',
    status: 'documented',
    source: 'Verified facts',
    href: '/docs/05-appendices/02-foundation-facts',
  },
  {
    title: 'One bit in eight',
    text: 'A small trained Aigarth unit explains most of the table. The last eighth stayed out of reach: in 140 runs of larger, grown units, none reproduced it. What produced the table is still open.',
    status: 'documented',
    source: 'Where the Anna Matrix comes from',
    href: '/docs/03-results/36-where-the-anna-matrix-comes-from',
  },
]

export function Phase08_TheMatrix() {
  return (
    <PhaseWrapper background="dark" id="matrix" phaseNumber={9} subtitle="16,384 answers and a shape nobody has fully explained" title="The Matrix">
      <div className="space-y-10">
        <MatrixCanvas />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CLUES.map((c, i) => (
            <ClueCard clue={c} index={i} key={c.title} />
          ))}
        </div>

        <Prose>
          <p>
            We checked the loud theories one by one: a hidden message, a weight file, a bridge to Bitcoin. None held, and the{' '}
            <a className="text-gold underline decoration-gold/40 underline-offset-4" href="/docs/03-results/35-corrections-september-2026">
              corrections page
            </a>{' '}
            says why. What remains is stranger than any of them. In August 2026 Come-from-Beyond wrote that Anna runs on an implementation of Intelligent Tissue he has not
            named, different from Neuraxon.
          </p>
        </Prose>

        <OpenQuestion>Most of the table can be explained. Who, or what, wrote the last eighth?</OpenQuestion>

        <SourceCitationGroup>
          <SourceCitation href="/docs/03-results/36-where-the-anna-matrix-comes-from" title="Where the Anna Matrix comes from" />
          <SourceCitation href="/docs/03-results/01-matrix-symmetry" title="Matrix symmetry" />
          <SourceCitation href="/data/anna-matrix.json" title="anna-matrix.json (raw data)" />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
