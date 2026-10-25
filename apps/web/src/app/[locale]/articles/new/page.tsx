import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Compose } from '@/components/church/forum/Compose'
import { ForumShell } from '@/components/church/forum/ForumUI'

export const metadata: Metadata = { title: { absolute: 'New topic · Qubic Church Forum' }, robots: { index: false } }

export default async function NewTopicPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  return (
    <ForumShell crumbs={[{ label: 'Qubic Church Forum', href: '/articles' }, { label: 'Open Board', href: '/articles/board/open' }, { label: 'Start new topic' }]}>
      <h1 className="sr-only">Start new topic</h1>
      <Compose kind="topic" />
      <div className="qcf-box">
        <div className="qcf-cat">How this works</div>
        <div className="qcf-win qcf-post qcf-small" style={{ padding: '10px 14px' }}>
          <p>
            <b>Identity without personal data.</b> Login is a signature from your Qubic wallet, or a tripcode. The forum never sees an email, a password or a seed. The signature is a one-time line of text; it moves nothing and cannot be reused.
          </p>
          <p>
            <b>Publishing.</b> A post goes straight into the forum&apos;s public archive on GitHub under your name, and the site rebuilds in about two minutes. Nobody reads it first. Moderators can remove a post afterwards; that is the whole rulebook. </p>
          <p>
            <b>Ranks.</b> A topic weighs 1. A repost by Maria on X adds 1 merit. Replies count as activity. Weight sets your rank, from Newbie to Legendary.
          </p>
          <p>
            <b>Still prefer X?</b> Post there starting with “hey @maria_aigarth”, then paste the link here and press Import. Or just tag her and wait: she may bring it in.
          </p>
        </div>
      </div>
    </ForumShell>
  )
}
