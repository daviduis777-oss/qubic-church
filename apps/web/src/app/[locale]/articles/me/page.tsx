import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Cabinet } from '@/components/church/forum/Cabinet'
import { ForumShell } from '@/components/church/forum/ForumUI'

export const metadata: Metadata = { title: { absolute: 'My cabinet · The Crypt' }, robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function MePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  return (
    <ForumShell crumbs={[{ label: 'The Crypt', href: '/articles' }, { label: 'My cabinet' }]}>
      <h1 className="sr-only">My cabinet</h1>
      <Cabinet />
      <div className="qcf-box">
        <div className="qcf-cat">What is stored</div>
        <div className="qcf-win qcf-post" style={{ padding: '8px 14px' }}>
          <p>
            Your public Qubic ID or tripcode, the name you chose, and whatever you put on this page. All of it lives in the forum&apos;s public archive on GitHub, like the posts. No email, no password, no seed, no cookies beyond the login.
          </p>
        </div>
      </div>
    </ForumShell>
  )
}
