'use client'

import Link from 'next/link'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import { siteConfig } from '@/config/site'

const NEXT: { href: string; title: string; desc: string; primary?: boolean }[] = [
  { href: '/books/come-from-beyond', title: 'Read Come-from-Beyond', desc: 'The whole road in one book, free, chapter by chapter.', primary: true },
  { href: '/docs/03-results/17-cfb-satoshi-analysis', title: 'The primary sources', desc: 'Every quote on this page, with dates and message IDs.' },
  { href: '/docs/03-results/36-where-the-anna-matrix-comes-from', title: 'The Anna Matrix', desc: 'The full investigation, and the eighth nobody has explained.' },
]

export function Phase12_TheRoadAhead() {
  return (
    <PhaseWrapper background="dark" id="ahead" phaseNumber={12} subtitle="Twenty-five years behind, a few months ahead" title="The Road Ahead">
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          {NEXT.map(l => (
            <Link
              className={`group border p-6 transition-colors ${l.primary ? 'border-gold/40 bg-gold/10 hover:border-gold' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              href={l.href}
              key={l.href}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-white/90">{l.title}</h3>
                <ChevronRight className="size-5 text-gold transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-sm text-white/60">{l.desc}</p>
            </Link>
          ))}
        </div>

        <div className="border border-gold/20 bg-black/70 p-6 text-center md:p-8">
          <h3 className="text-xl font-bold text-white/90">The founders&rsquo; mark</h3>
          <p className="mx-auto mt-3 max-w-xl text-white/65">
            Each of the 200 Annas gives its holder the status of a founder of Qubic Church. A keepsake of the years before Aigarth. And not only that.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link className="inline-flex items-center justify-center bg-gold px-6 py-3 font-semibold text-black hover:bg-gold-strong" href="/nfts">
              See the Annas
            </Link>
            <a
              className="inline-flex items-center justify-center gap-2 border border-white/15 px-6 py-3 text-white/80 hover:text-white"
              href={siteConfig.links.discord.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              Talk about it on Discord <ExternalLink className="size-4" />
            </a>
          </div>
        </div>

        <p className="py-6 text-center text-lg italic text-white/50">What happens on The Day, we will see together.</p>
      </div>
    </PhaseWrapper>
  )
}
