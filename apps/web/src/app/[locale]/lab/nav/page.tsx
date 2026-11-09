import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { bppFonts } from '@/components/bpp/fonts'
import { BooksHome } from '@/components/church/home/BooksHome'
import { NavV2 } from '@/components/church/navigation/NavV2'

export const metadata: Metadata = { title: 'Navigation lab', robots: { index: false, follow: false } }

/** Hidden preview of navigation v2 over the real homepage. The live bar is hidden on this page only. */
export default async function NavLab(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  return (
    <div className={bppFonts}>
      <style>{'[data-nav="v1"]{display:none !important}'}</style>
      <NavV2 />
      <BooksHome locale="en" />
    </div>
  )
}
