import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { isModerator } from '@/lib/forum/auth'
import { PeopleApp } from '@/components/me/PeopleApp'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'People of Qubic Church', robots: { index: false, follow: false } }

export default async function PeoplePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  if (!(await isModerator())) notFound()
  return <PeopleApp />
}
