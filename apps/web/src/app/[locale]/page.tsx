import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import { defaultLocale, locales } from '@/config/i18n'

// Church Homepage - Single Hero Page + Circular Menu + Modals
import { GalaxyHero } from '@/components/church/hero/GalaxyHero'
// Footer removed from homepage, single-screen hero only

export const metadata: Metadata = {
  title: 'Qubic Church | Research on Anna, Aigarth and Qubic',
  description:
    'Qubic Church is a research community studying the Anna Matrix, Aigarth and the Qubic ecosystem, with open data and published corrections.',
}

export const dynamicParams = true

export default async function ChurchHomePage(props: {
  params: Promise<{ locale: LocaleOptions }>
}) {
  const params = await props.params
  const currentLocale = locales.includes(params.locale)
    ? params.locale
    : defaultLocale
  setRequestLocale(currentLocale)

  return (
    <>
      {/* HERO - Full screen with NavigationWheel + Content Modals */}
      <GalaxyHero />
    </>
  )
}
