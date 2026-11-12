import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { WhenApp } from '@/components/when/WhenApp'
import { isModerator } from '@/lib/forum/auth'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'WEN?', robots: { index: false, follow: false } }

/** Hidden while it is built: the roadmap and the tracker of moments, for the moderator only. */
export default async function WhenPage() {
  if (!(await isModerator())) notFound()
  return <WhenApp />
}
