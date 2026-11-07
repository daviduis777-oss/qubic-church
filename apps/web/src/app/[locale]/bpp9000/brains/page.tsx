import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { BrainWatch } from '@/components/bpp/brains/BrainWatch'
import { BppStyles } from '@/components/bpp/BppStyles'
import { bppFonts } from '@/components/bpp/fonts'
import { brainsAllowed, brainsPublic } from '@/lib/bpp/brains-gate'

/*
 * Brain Watch: the best BPP-9000 brain of the epoch under the glass, with its exam on the hours it never saw,
 * a download for anyone, and a shelf per epoch. Private preview: a plain 404 for everyone but the forum
 * moderator until BRAINS_PUBLIC=1. Not in the sitemap or llms.txt; nothing links here yet.
 */
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  if (!(await brainsAllowed())) return { robots: { index: false, follow: false } }
  return {
    title: { absolute: 'Brain Watch · BPP-9000' },
    description: 'The best brain Qubic miners grew this epoch, re-run with the core’s rule and graded on the hours it never saw. Download any brain and run it yourself.',
    // TODO(Bob): when going public, switch this to index and add the page to sitemap.ts and llms.txt.
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  }
}

export default async function BrainsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  if (!(await brainsAllowed())) notFound()
  return (
    <div className={`bpp ${bppFonts}`} style={{ minHeight: '100vh' }}>
      <BppStyles />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(76px, 9vw, 96px) clamp(16px, 4vw, 48px) 48px' }}>
        <BrainWatch preview={!brainsPublic()} />
      </div>
    </div>
  )
}
