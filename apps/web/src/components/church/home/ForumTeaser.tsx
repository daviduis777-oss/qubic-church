import Link from 'next/link'
import { MEMBERS, TOPICS } from '@/lib/forum'

/** A 2009-style forum window dropped onto the dark homepage: the door into /articles. */
export function ForumTeaser() {
  const open = TOPICS.filter(t => t.board !== 'founder')
  const latest = open.slice(0, 3)
  const members = MEMBERS.length
  return (
    <div className="qcf" style={{ background: 'transparent', fontSize: 12 }}>
      <div
        className="qcf-box"
        style={{
          margin: 0,
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,210,74,0.25)',
        }}
      >
        <div className="qcf-head" style={{ padding: '8px 14px' }}>
          <Link className="qcf-logo" href="/articles" style={{ fontSize: 20 }}>
            Qubic Church Forum
          </Link>
          <span className="qcf-tag">est. 2026 · the archive of Aigarth · {TOPICS.length} topics · {members} members</span>
          <span className="qcf-tag" style={{ marginLeft: 'auto' }}>
            <Link href="/articles/new">Login</Link> · <Link href="/articles/new">New topic</Link>
          </span>
        </div>
        <div className="qcf-menu">
          <Link href="/articles">Home</Link>
          <Link href="/articles/board/founder">Founder&rsquo;s Archive</Link>
          <Link href="/articles/board/chronicle">Chronicle</Link>
          <Link href="/articles/board/open">Open Board</Link>
          <Link href="/articles#ranks">Ranks</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Recent posts</th>
              <th className="qcf-hide-sm" style={{ width: 160 }}>
                Started by
              </th>
              <th style={{ width: 150 }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {latest.map((t, i) => (
              <tr className={i % 2 ? 'qcf-win2' : 'qcf-win'} key={t.id}>
                <td>
                  <Link className="qcf-strong" href={t.href}>
                    {t.title}
                  </Link>
                  {t.isNew && <span className="qcf-new">NEW</span>}
                </td>
                <td className="qcf-hide-sm">{t.author}</td>
                <td className="qcf-small qcf-muted">{t.dateLabel}</td>
              </tr>
            ))}
            <tr className="qcf-win3">
              <td colSpan={3} style={{ padding: '10px 8px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px' }}>
                  <span>
                    <b>Write us an article.</b> No topic. No category. No censorship. Login with a Qubic wallet or a tripcode, no email, no password.
                  </span>
                  <Link className="qcf-btn qcf-btn-main" href="/articles" style={{ marginLeft: 'auto', padding: '6px 16px', fontSize: 13 }}>
                    Enter the forum »
                  </Link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
