import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { EvidenceHero, EvidenceTabs, ResearchDownloads } from '@/components/evidence'
import { EvidenceFooter } from '@/components/evidence/EvidenceFooter'
import { GamificationProvider, AchievementUnlock } from '@/components/gamification'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import { defaultLocale, locales } from '@/config/i18n'

export const metadata: Metadata = {
  title: 'Evidence Vault | Qubic Church',
  description:
    'Explore the evidence dashboard with address databases, blockchain visualizations, and research data supporting the Bitcoin-Qubic connection.',
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

        <main className="flex-1">
          {/* 1. Hero: Evidence Vault Title */}
          <EvidenceHero />

          {/* 2. Tabbed Interface with all data */}
          <EvidenceTabs />

          {/* 3. Download & Verification Section */}
          <ResearchDownloads />
        </main>

        {/* Enhanced Footer */}
        <EvidenceFooter />
      </div>
    </GamificationProvider>
  )
}
