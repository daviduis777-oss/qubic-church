import type { Metadata } from 'next'
import Link from 'next/link'
import { ogFor } from '@/lib/og-pages'
import { SITE_URL } from '@/lib/books'
import raw from '../../../../public/data/anna-rarity.json'

export const metadata: Metadata = {
  title: 'Rarity Codex: Anna Aigarth Collection',
  description: '200 tokens, 5 trait layers, ranked by emergence. Explore the complete rarity analysis of the Anna Aigarth NFT collection.',
  alternates: { canonical: `${SITE_URL}/rarity-codex` },
  openGraph: { type: 'website', url: `${SITE_URL}/rarity-codex`, title: 'Rarity Codex: Anna Aigarth Collection', description: '200 tokens, 5 trait layers, ranked by emergence. Explore the complete rarity analysis of the Anna Aigarth NFT collection.', images: ogFor('rarity').images },
  twitter: ogFor('rarity').twitter,
}

type Trait = { value: string; count: number; percent: number; tier: string }
type Data = {
  total_tokens: number
  score_method: string
  stats: { max_score: number; min_score: number; mean_score: number }
  tokens: { token_id: number; rarity_score: number; rank?: number; traits: Record<string, Trait> }[]
}

const LAYERS: Record<string, string> = { background: 'Background', headwear: 'Headwear', accessories: 'Accessories', clothing: 'Clothing', hand: 'In hand' }

/** Bundled with the page: the codex itself draws in the browser, so the facts are also printed here for readers without scripts and for crawlers. */
function codex() {
  try {
    const d = raw as unknown as Data
    const layers: Record<string, Map<string, Trait>> = {}
    for (const t of d.tokens) for (const [k, v] of Object.entries(t.traits)) (layers[k] ??= new Map()).set(v.value, v)
    const top = d.tokens.slice().sort((a, b) => b.rarity_score - a.rarity_score).slice(0, 10)
    return { d, layers, top }
  } catch {
    return null
  }
}

export default function RarityCodexLayout({ children }: { children: React.ReactNode }) {
  const c = codex()
  return (
    <>
      {children}
      {c && (
        <section aria-labelledby="codex-facts" className="border-t border-border bg-black text-foreground">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
            <h2 className="font-display text-4xl leading-[0.95] md:text-5xl" id="codex-facts">
              The codex in numbers
            </h2>
            <p className="mt-4 max-w-2xl text-fg-2">
              The Anna Aigarth collection is {c.d.total_tokens} hand-made Annas on Qubic, each built from five trait layers. Each Anna&rsquo;s rarity score is the sum of
              1/frequency over its five traits: the rarer the traits, the higher the score. Scores run from {c.d.stats.min_score} to {c.d.stats.max_score}, with a mean of{' '}
              {c.d.stats.mean_score}. Holding an Anna makes its holder a founder of Qubic Church; it is a collector&rsquo;s mark, not an investment.{' '}
              <Link className="text-gold underline-offset-4 hover:underline" href="/nfts">
                See the collection
              </Link>
              .
            </p>

            <h3 className="mt-10 text-lg font-semibold">The ten rarest Annas</h3>
            <ol className="mt-3 grid gap-x-8 gap-y-1 text-sm text-fg-2 sm:grid-cols-2">
              {c.top.map((t, i) => (
                <li key={t.token_id}>
                  {i + 1}. Anna #{String(t.token_id).padStart(3, '0')}, score {t.rarity_score}:{' '}
                  {Object.values(t.traits)
                    .map(v => v.value)
                    .join(', ')}
                </li>
              ))}
            </ol>

            <h3 className="mt-10 text-lg font-semibold">Every trait and how many Annas carry it</h3>
            <div className="mt-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(c.layers).map(([layer, m]) => (
                <div key={layer}>
                  <h4 className="text-sm font-semibold text-gold">{LAYERS[layer] ?? layer}</h4>
                  <ul className="mt-2 grid gap-0.5 text-sm text-fg-2">
                    {[...m.values()]
                      .sort((a, b) => a.count - b.count)
                      .map(v => (
                        <li key={v.value}>
                          {v.value}: {v.count} of {c.d.total_tokens} ({v.percent}%), {v.tier}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
