import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import { defaultLocale, locales } from '@/config/i18n'
import { absoluteUrl } from '@/lib/utils'
import {
  DisclaimerGate,
  JourneyV3Container,
  Phase01_TheVoid,
  Phase02_Minsk2002,
  Phase03_TheVanishing,
  Phase04_ThePots,
  Phase05_Qubic,
  Phase06_Coincidences,
  Phase07_AnnaSpeaks,
  Phase08_TheMatrix,
  Phase09_AigarthGrows,
  Phase10_TheDay,
  Phase11_WhatWeWithdrew,
  Phase12_TheRoadAhead,
} from '@/components/journey-v3'

const TITLE = 'The Road to The Day'
const DESCRIPTION =
  'Come-from-Beyond from Minsk 2002 to 13.04.2027: NXT, IOTA, Qubic, Aigarth, the Anna Matrix and the coincidences that stay open. Every item labelled and sourced.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl('/timeline') },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: absoluteUrl('/timeline') },
}

export const dynamicParams = true

export default async function TimelinePage(props: { params: Promise<{ locale: LocaleOptions }> }) {
  const params = await props.params
  const currentLocale = locales.includes(params.locale) ? params.locale : defaultLocale
  setRequestLocale(currentLocale)

  return (
    <div className="min-h-screen bg-black">
      <DisclaimerGate />
      <JourneyV3Container>
        <Phase01_TheVoid />
        <Phase02_Minsk2002 />
        <Phase03_TheVanishing />
        <Phase04_ThePots />
        <Phase05_Qubic />
        <Phase06_Coincidences />
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
