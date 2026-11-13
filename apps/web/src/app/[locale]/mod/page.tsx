import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { poolFontVars } from '@/components/pool/fonts'
import { isModerator } from '@/lib/forum/auth'
import { reports } from '@/lib/pool/report-store'
import m from './mod.module.css'
import { Tracker } from './Tracker'

/*
 * The moderator's desk: the hidden pages and outside tools in one place, then the tracker for everything people
 * send (the site's Suggest form and the pool's Report app). A plain 404 for everyone else, never indexed or linked.
 */

export const dynamic = 'force-dynamic'

const robots = { index: false, follow: false, googleBot: { index: false, follow: false } }
export async function generateMetadata(): Promise<Metadata> {
  if (!(await isModerator())) return { robots }
  return { title: { absolute: 'Moderator · Qubic Church' }, robots }
}

const HIDDEN = [
  { href: '/me', name: 'Cabinet', note: 'not public yet' },
  { href: '/pool', name: 'Aigarth Pool', note: 'hidden until launch' },
  { href: '/lab/brain', name: 'Lab: brain', note: 'pool gate' },
  { href: '/lab/garden', name: 'Lab: garden', note: 'pool gate' },
  { href: '/lab/nixie', name: 'Lab: nixie timers', note: 'unlinked preview' },
]

const TOOLS = [
  { href: 'https://github.com/daviduis777-oss/qubic-church', name: 'Site repo', note: 'GitHub' },
  { href: 'https://github.com/daviduis777-oss/anna-archive', name: 'Anna archive', note: 'museum files' },
  { href: 'https://annexplorer.jetskipool.ai', name: 'Ant colony explorer', note: 'jetski' },
  { href: 'https://search.google.com/search-console', name: 'Search Console', note: 'indexing' },
  { href: '/suggest', name: 'Suggest form', note: 'what visitors see' },
]

export default async function ModPage(props: { params: Promise<{ locale: string }> }) {
  if (!(await isModerator())) notFound()
  const { locale } = await props.params
  setRequestLocale(locale)
  const list = await reports()
    .list(500)
    .catch(() => null)
  const ext = (h: string) => (h.startsWith('http') ? { rel: 'noopener noreferrer', target: '_blank' } : {})
  return (
    <div className={`${m.backdrop} ${poolFontVars}`}>
      <main className={m.page}>
        <p className={m.kicker}>Qubic Church · only you see this page</p>
        <h1 className={m.title}>
          <span className={m.serif}>Moderator</span>
        </h1>
        <div className={m.desk}>
          <section aria-labelledby="mod-hidden" className={m.panel}>
            <h2 id="mod-hidden">Hidden pages</h2>
            <ul className={m.links}>
              {HIDDEN.map(l => (
                <li key={l.href}>
                  <a href={l.href}>
                    <span>{l.name}</span>
                    <span>{l.note}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="mod-tools" className={m.panel}>
            <h2 id="mod-tools">Tools</h2>
            <ul className={m.links}>
              {TOOLS.map(l => (
                <li key={l.href}>
                  <a href={l.href} {...ext(l.href)}>
                    <span>{l.name}</span>
                    <span>{l.note}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <Tracker initial={list} />
      </main>
    </div>
  )
}
