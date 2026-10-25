import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { ModQueue } from '@/components/church/forum/ModQueue'
import { ForumShell } from '@/components/church/forum/ForumUI'

export const metadata: Metadata = { title: { absolute: 'Moderation · The Crypt' }, robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function ModPage(props: { params: Promise<{ locale: string }>; searchParams: Promise<{ key?: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  const { key } = await props.searchParams
  return (
    <ForumShell crumbs={[{ label: 'The Crypt', href: '/articles' }, { label: 'Moderation queue' }]}>
      <h1 className="sr-only">Moderation queue</h1>
      <ModQueue modKey={key} />
      <p className="qcf-small qcf-muted" style={{ margin: '10px 2px' }}>
        Every change here is a commit; the site redeploys in about two minutes.
      </p>
    </ForumShell>
  )
}
