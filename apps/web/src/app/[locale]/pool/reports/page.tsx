import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { poolFontVars } from '@/components/pool/fonts'
import { isModerator } from '@/lib/forum/auth'
import { reports } from '@/lib/pool/report-store'
import { ReportsBoard } from './ReportsBoard'
import r from './reports.module.css'

/*
 * Reports from the Report app, for the moderator only: a plain 404 for everyone else, whether or not the
 * pool page is public. Not linked from anywhere, not in the sitemap. Newest first, with the screenshot.
 */

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const robots = { index: false, follow: false, googleBot: { index: false, follow: false } }
  if (!(await isModerator())) return { robots }
  return { title: { absolute: 'Reports · Aigarth Pool' }, robots }
}

export default async function ReportsPage(props: { params: Promise<{ locale: string }> }) {
  if (!(await isModerator())) notFound()
  const { locale } = await props.params
  setRequestLocale(locale)
  const list = await reports()
    .list(200)
    .catch(() => null)
  return (
    <div className={`${r.backdrop} ${poolFontVars}`}>
      <ReportsBoard initial={list} />
    </div>
  )
}
