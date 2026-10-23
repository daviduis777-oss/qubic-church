import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import { defaultLocale, locales } from '@/config/i18n'
import { absoluteUrl } from '@/lib/utils'
import { jsonLd } from '@/lib/json-ld'
import {
  DisclaimerGate,
  JourneyV3Container,
  Phase01_TheVoid,
  Phase02_FirstArticles,
  Phase03_TheVanishing,
  Phase04_ThePots,
  Phase05_Qubic,
  Phase06_Coincidences,
  Phase07_SatoshiNakamoto,
  Phase07_AnnaSpeaks,
  Phase08_TheMatrix,
  Phase09_AigarthGrows,
  Phase10_TheDay,
  Phase11_WhatWeWithdrew,
  Phase12_TheRoadAhead,
} from '@/components/journey-v3'

const TITLE = 'The Road to The Day'
const DESCRIPTION =
  'Come-from-Beyond from 2000 to 13.04.2027: NXT, IOTA, Qubic, Aigarth, the Anna Matrix, and the Satoshi Nakamoto question argued as a hypothesis, with his denials. Every item labelled and sourced.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl('/timeline') },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: absoluteUrl('/timeline') },
}

export const dynamicParams = true

const ld = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: TITLE,
  description: DESCRIPTION,
  url: absoluteUrl('/timeline'),
  author: { '@type': 'Organization', name: 'Qubic Church', url: absoluteUrl('/') },
  about: [
    { '@type': 'Person', name: 'Sergey Ivancheglo', alternateName: 'Come-from-Beyond' },
    { '@type': 'Person', name: 'Satoshi Nakamoto' },
    { '@type': 'Thing', name: 'Qubic' },
    { '@type': 'Thing', name: 'Aigarth' },
  ],
  abstract:
    'A sourced timeline of Come-from-Beyond and Qubic. The Satoshi Nakamoto chapter is a hypothesis, not a finding: it sets out the coincidences from one side and includes his repeated denials.',
}

export default async function TimelinePage(props: { params: Promise<{ locale: LocaleOptions }> }) {
  const params = await props.params
  const currentLocale = locales.includes(params.locale) ? params.locale : defaultLocale
  setRequestLocale(currentLocale)

  return (
    <div className="min-h-screen bg-black">
      <script dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} type="application/ld+json" />
      <DisclaimerGate />
      <JourneyV3Container>
        <Phase01_TheVoid />
        <Phase02_FirstArticles />
        <Phase03_TheVanishing />
        <Phase04_ThePots />
        <Phase05_Qubic />
        <Phase06_Coincidences />
        <Phase07_SatoshiNakamoto />
        <Phase07_AnnaSpeaks />
        <Phase08_TheMatrix />
        <Phase09_AigarthGrows />
        <Phase10_TheDay />
        <Phase11_WhatWeWithdrew />
        <Phase12_TheRoadAhead />
      </JourneyV3Container>
    </div>
  )
}
