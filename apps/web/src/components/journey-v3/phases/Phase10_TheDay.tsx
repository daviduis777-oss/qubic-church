'use client'

import { useEffect, useState } from 'react'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { OpenQuestion, Quote } from '../shared/Story'

const THE_DAY = new Date('2027-04-13T00:00:00Z')

function left() {
  const d = Math.max(0, THE_DAY.getTime() - Date.now())
  return {
    Days: Math.floor(d / 864e5),
    Hours: Math.floor((d % 864e5) / 36e5),
    Min: Math.floor((d % 36e5) / 6e4),
    Sec: Math.floor((d % 6e4) / 1e3),
  }
}

function Countdown() {
  const [t, setT] = useState<ReturnType<typeof left> | null>(null)
  useEffect(() => {
    setT(left())
    const i = setInterval(() => setT(left()), 1000)
    return () => clearInterval(i)
  }, [])
  return (
    <div className="border-2 border-gold/30 bg-black/70 p-6 text-center md:p-10">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">The Day &middot; 13.04.2027</p>
      <div className="mx-auto mt-6 grid max-w-xl grid-cols-4 gap-3">
        {(['Days', 'Hours', 'Min', 'Sec'] as const).map(k => (
          <div key={k}>
            <div className="font-mono text-3xl font-bold tabular-nums text-white md:text-5xl">{t ? String(t[k]).padStart(2, '0') : '--'}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-white/40">{k}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Phase10_TheDay() {
  return (
    <PhaseWrapper background="dark" id="the-day" phaseNumber={11} subtitle="The date he keeps returning to" title="The Day">
      <div className="space-y-10">
        <Countdown />

        <div className="grid gap-4 md:grid-cols-2">
          <Quote source="Come-from-Beyond, Discord, 11.06.2024">It&rsquo;s 5 years after launch of Qubic</Quote>
          <Quote source="Come-from-Beyond, Discord #aigarth, 15.07.2025">No ETA other than April 13, 2027</Quote>
        </div>

        <Quote className="border-gold" source="Come-from-Beyond, Discord, 10.10.2025">
          I can reveal this info on 13th of April 2027
          <br />
          And you&rsquo;ll see who is really behind CFB acc
        </Quote>

        <OpenQuestion>Qubic went live on 13.04.2022. Five years to the day. What happens on The Day, we will see together.</OpenQuestion>

        <SourceCitationGroup>
          <SourceCitation href="/docs/05-appendices/02-foundation-facts" title="Verified facts: the 13 April 2027 messages" />
          <SourceCitation href="/books/qubic-the-long-version/14-what-the-deploy-on-april-13-2027-means" title="Qubic: The Long Version, ch. 14" />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
