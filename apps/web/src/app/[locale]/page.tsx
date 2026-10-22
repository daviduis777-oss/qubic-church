import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import { defaultLocale, locales } from '@/config/i18n'

// Church Homepage - Single Hero Page + Circular Menu + Modals
import { BooksHome } from '@/components/church/home/BooksHome'
// Footer removed from homepage, single-screen hero only

export const metadata: Metadata = {
  title: 'Qubic Church | Books and open research on Qubic, Aigarth and Come-from-Beyond',
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
      <BooksHome locale={currentLocale} />
    </>
  )
}
