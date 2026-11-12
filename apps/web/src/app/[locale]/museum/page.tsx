import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { isModerator } from '@/lib/forum/auth'
import { MuseumApp } from '@/components/museum/MuseumApp'

// Hidden while it is hung: the moderator alone, nothing indexed.
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Museum', robots: { index: false, follow: false } }

export default async function MuseumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  if (!(await isModerator())) notFound()
  return <MuseumApp />
}
