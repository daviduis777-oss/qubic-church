import { notFound, redirect } from 'next/navigation'
import { isModerator } from '@/lib/forum/auth'

// The pool's reports now live in the moderator's tracker, with the site's suggestions.
export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }

export default async function ReportsPage(props: { params: Promise<{ locale: string }> }) {
  if (!(await isModerator())) notFound()
  const { locale } = await props.params
  redirect(locale === 'en' ? '/mod' : `/${locale}/mod`)
}
