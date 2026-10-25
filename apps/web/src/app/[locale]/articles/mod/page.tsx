import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { ModQueue } from '@/components/church/forum/ModQueue'
import { ForumShell } from '@/components/church/forum/ForumUI'

export const metadata: Metadata = { title: { absolute: 'Moderation · Qubic Church Forum' }, robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function ModPage(props: { params: Promise<{ locale: string }>; searchParams: Promise<{ key?: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  const { key } = await props.searchParams
  return (
    <ForumShell crumbs={[{ label: 'Qubic Church Forum', href: '/articles' }, { label: 'Moderation queue' }]}>
      <h1 className="sr-only">Moderation queue</h1>
      {key ? (
        <ModQueue modKey={key} />
      ) : (
        <div className="qcf-box qcf-win" style={{ padding: 12 }}>
          Moderators only. Open this page with your key: <code>/articles/mod?key=…</code>
        </div>
      )}
      <p className="qcf-small qcf-muted" style={{ margin: '10px 2px' }}>
        Approve commits the post to the archive and the site redeploys in about two minutes. Reject closes it without publishing.
      </p>
    </ForumShell>
  )
}
