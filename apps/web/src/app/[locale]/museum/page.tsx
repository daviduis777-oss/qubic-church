import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { MuseumApp } from '@/components/museum/MuseumApp'
import { jsonLd } from '@/lib/json-ld'
import { MUSEUM_DESCRIPTION, MUSEUM_MD_URL, MUSEUM_TITLE, MUSEUM_URL, museumLd } from '@/lib/museum-text'

export const metadata: Metadata = {
  title: MUSEUM_TITLE,
  description: MUSEUM_DESCRIPTION,
  alternates: { canonical: MUSEUM_URL, types: { 'text/markdown': MUSEUM_MD_URL } },
  openGraph: {
    type: 'website',
    url: MUSEUM_URL,
    title: MUSEUM_TITLE,
    description: MUSEUM_DESCRIPTION,
    images: [{ url: 'https://qubic.church/og-museum.jpg', width: 1200, height: 630, alt: 'Museum, Hall 1: Anna.exe' }],
  },
  twitter: { card: 'summary_large_image', title: MUSEUM_TITLE, description: MUSEUM_DESCRIPTION, images: ['https://qubic.church/og-museum.jpg'] },
}

export const revalidate = 3600

/** Hall 1: the Anna.exe race, every file Come-from-Beyond posted, kept as it was. */
export default async function MuseumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <>
      {museumLd().map((d, i) => (
        <script dangerouslySetInnerHTML={{ __html: jsonLd(d) }} key={i} type="application/ld+json" />
      ))}
      <MuseumApp canDownload />
    </>
  )
}
