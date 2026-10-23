'use client'

import { PhaseWrapper } from '../shared/PhaseWrapper'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { OpenQuestion, Prose, Quote } from '../shared/Story'

export function Phase02_FirstArticles() {
  return (
    <PhaseWrapper id="origin" phaseNumber={2} subtitle="2000 to 2002: a name and an idea, years early" title="The First Articles">
      <div className="space-y-10">
        <Prose>
          <p>
            December 2000. A computer weekly prints an article by Sergey Ivancheglo on proving who wrote a program: the &ldquo;birthmarks&rdquo; every programmer leaves
            in code, and the marks an author can plant on purpose. The contact address already carries the name he will use for the next quarter of a century:{' '}
            <span className="text-gold">come-from-beyond</span>.
          </p>
          <p>
            July 2002. The same weekly prints a short article under a dull title, <em>Distributed Computing at Minimal Cost</em>.
          </p>
          <p>
            The idea fits on one page. Some problems need enormous computing power, and power costs money. So gather it from volunteers: a small program borrows the
            computers of people who open a web page and puts them to work on one shared task. No centre, no owner, no bill.
          </p>
          <p>
            Among the tasks he lists for such a network: weather forecasting, the search for extraterrestrial life, and, first on the list, breaking cryptographic
            algorithms.
          </p>
        </Prose>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['2002', 'Distributed power from volunteers, no centre', 'The article'],
            ['2009', 'Distributed power from volunteers, no centre, built on cryptography', 'Bitcoin'],
            ['2022', 'Distributed power from miners, aimed at growing a mind', 'Qubic'],
          ].map(([year, text, label]) => (
            <div className="border border-white/10 bg-black/60 p-5" key={year}>
              <p className="font-mono text-2xl font-bold text-gold">{year}</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-wider text-white/40">{label}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{text}</p>
            </div>
          ))}
        </div>

        <Quote source="Come-from-Beyond, Discord, 15.07.2025">I wasn&rsquo;t created, I have always existed (and you too)</Quote>

        <OpenQuestion>Between the article in 2002 and his first project of his own in 2013 lies a decade. Bitcoin arrived exactly in the middle of it.</OpenQuestion>

        <SourceCitationGroup>
          <SourceCitation external href="https://kv.by/archive/index2000491105.htm" title="KV, No. 49, 2000 (found by @SatoshiCfB)" />
          <SourceCitation href="/books/come-from-beyond/03-one-line-through-25-years" title="Come-from-Beyond, ch. 3: One Line Through 25 Years" />
          <SourceCitation href="/books/come-from-beyond/02-where-time-grows-from" title="Come-from-Beyond, ch. 2: Where Time Grows From" />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
