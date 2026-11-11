import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { isModerator } from '@/lib/forum/auth'
import { MeApp } from '@/components/me/MeApp'

// Hidden while it is built: the moderator alone, nothing indexed.
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'My cabinet', robots: { index: false, follow: false } }

export default async function MePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  if (!(await isModerator())) notFound()
  return <MeApp />
}
