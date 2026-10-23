'use client'

import { useEffect, useState } from 'react'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { OpenQuestion, Prose, Quote } from '../shared/Story'

type Matrix = number[][]

let cache: Promise<Matrix> | null = null
export function loadAnnaMatrix(): Promise<Matrix> {
  cache ??= fetch('/data/anna-matrix.json')
    .then(r => r.json())
    .then((d: { matrix: Matrix }) => d.matrix)
  return cache
}

const clamp = (n: number) => Math.max(-64, Math.min(63, Math.trunc(n) || 0))

function AskAnna() {
  const [m, setM] = useState<Matrix | null>(null)
  const [x, setX] = useState(1)
  const [y, setY] = useState(1)

  useEffect(() => {
    loadAnnaMatrix()
      .then(setM)
      .catch(() => setM(null))
  }, [])

  const answer = m ? m[63 - y]?.[x + 64] : undefined

  return (
    <div className="border border-gold/25 bg-black/70 p-5 md:p-7">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold">Ask Anna</p>
      <p className="mt-2 text-sm text-white/55">Pick two numbers from -64 to 63. You get the reply recorded from the bot for that question.</p>
      <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-2xl md:text-4xl">
        <label className="sr-only" htmlFor="anna-x">
          x
        </label>
        <input
          className="w-24 border border-white/15 bg-white/5 px-3 py-2 text-center text-white focus:border-gold focus:outline-none md:w-28"
          id="anna-x"
          max={63}
          min={-64}
          onChange={e => setX(clamp(Number(e.target.value)))}
          type="number"
          value={x}
        />
        <span className="text-white/50">+</span>
        <label className="sr-only" htmlFor="anna-y">
          y
        </label>
        <input
          className="w-24 border border-white/15 bg-white/5 px-3 py-2 text-center text-white focus:border-gold focus:outline-none md:w-28"
          id="anna-y"
          max={63}
          min={-64}
          onChange={e => setY(clamp(Number(e.target.value)))}
          type="number"
          value={y}
        />
        <span className="text-white/50">=</span>
        <output aria-live="polite" className="min-w-[4ch] text-gold" htmlFor="anna-x anna-y">
          {answer ?? '…'}
        </output>
      </div>
      <p className="mt-4 font-mono text-xs text-white/40">
        Arithmetic says {x + y}. The table cell is row {63 - y}, column {x + 64}.
      </p>
    </div>
  )
}

export function Phase07_AnnaSpeaks() {
  return (
    <PhaseWrapper id="anna" phaseNumber={8} subtitle="A bot on X that answers sums in its own way" title="Anna Speaks">
      <div className="space-y-10">
        <Prose>
          <p>
            On X, an account called <span className="text-gold">@anna_aigarth</span> answered questions of one kind: <span className="font-mono">x+y=?</span>. Asked
            what one plus one is, she said <span className="font-mono text-gold">-114</span>. The internet laughed.
          </p>
          <p>
            The community did something better than laugh. It asked her every sum from -64 to 63 and wrote the replies into one table of 128 by 128 numbers. That table
            became known as the Anna Matrix.
          </p>
        </Prose>

        <AskAnna />

        <div className="grid gap-4 md:grid-cols-2">
          <Quote source="Come-from-Beyond, Discord #aigarth, 14.04.2026">
            Anna training is split, part is done by computors. Public statements A+B=C are no longer used.
          </Quote>
          <Quote source="Come-from-Beyond, Discord #aigarth, 06.07.2026">It will be removed for a while</Quote>
        </div>

        <OpenQuestion>The answers look like nonsense one by one. Put all 16,384 of them side by side, and a shape appears.</OpenQuestion>

        <SourceCitationGroup>
          <SourceCitation href="/docs/03-results/36-where-the-anna-matrix-comes-from" title="Where the Anna Matrix comes from" />
          <SourceCitation href="/docs/03-results/04-anna-bot-verification" title="Anna bot verification" />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
