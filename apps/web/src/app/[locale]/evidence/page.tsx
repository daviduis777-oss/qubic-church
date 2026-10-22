import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import {
  EvidenceHero,
  EvidenceTabs,
  KeyFindings,
  ResearchDownloads,
  LatestUpdates,
} from '@/components/evidence'
import { EvidenceFooter } from '@/components/evidence/EvidenceFooter'
import {
  GamificationProvider,
  AchievementUnlock,
} from '@/components/gamification'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import { defaultLocale, locales } from '@/config/i18n'
import { Link } from '@/navigation'

export const metadata: Metadata = {
  title: 'Research Lab',
  description:
    'What the Anna Matrix is, how we know it, and the tools to check it yourself.',
}

export const dynamicParams = true

export default async function EvidencePage(props: {
  params: Promise<{ locale: LocaleOptions }>
}) {
  const params = await props.params
  const currentLocale = locales.includes(params.locale)
    ? params.locale
    : defaultLocale
  setRequestLocale(currentLocale)

  return (
    <GamificationProvider>
      <div className="flex flex-col min-h-screen">
        {/* Achievement Unlock Overlay */}
        <AchievementUnlock />

        <div className="flex-1">
          {/* 1. Hero */}
          <EvidenceHero />

          <section className="container pb-10">
            <p
              className="mx-auto max-w-3xl text-center text-sm leading-relaxed text-muted-foreground"
              role="note"
            >
              This page was rebuilt in September 2026. Earlier versions showed
              claims that did not hold up; they are listed on the{' '}
              <Link
                className="underline underline-offset-4 hover:text-foreground"
                href="/docs/03-results/35-corrections-september-2026"
              >
                Corrections page
              </Link>
              .
            </p>
          </section>

          <KeyFindings />

          {/* 2. Tabbed Interface with all data */}
          <EvidenceTabs />

          {/* 3. Latest Research Updates */}
          <LatestUpdates locale={currentLocale} />

          {/* 4. Download & Verification Section */}
          <ResearchDownloads />
        </div>

        {/* Enhanced Footer */}
        <EvidenceFooter />
      </div>
    </GamificationProvider>
  )
}
