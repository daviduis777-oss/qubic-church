'use client'

import { useCallback, useEffect, useState } from 'react'

type Pending = { number: number; created_at: string; html_url: string; data: { kind: string; title: string; text: string; topic?: string; xUrl?: string; author: { auth: string; id: string; name: string; handle: string }; date: string } }
type TopicRow = { slug: string; title: string; author: string; handle?: string; auth?: string; date: string }
type ReplyRow = { id: string; topic: string; author: string; handle: string; date: string; text: string }
type Me = { auth: string; id: string; name: string; handle: string } | null
type State = { queue: boolean; pending: Pending[]; topics: TopicRow[]; replies: ReplyRow[]; links: { identity?: string; handle?: string; member: string }[]; me: Me }

const KEY = 'qcf_mod_key'

/** The key arrives once in the URL, moves to sessionStorage, and the URL is cleaned so the key stays out of history and logs. */
function useModKey(initial?: string): string {
  const [key, setKey] = useState(initial ?? '')
  useEffect(() => {
    try {
      if (initial) {
        sessionStorage.setItem(KEY, initial)
        if (location.search.includes('key=')) history.replaceState(null, '', location.pathname)
      } else {
        const k = sessionStorage.getItem(KEY)
        if (k) setKey(k)
      }
    } catch {}
  }, [initial])
  return key
}

export function ModQueue({ modKey: initial }: { modKey?: string }) {
  const modKey = useModKey(initial)
  const [st, setSt] = useState<State | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState('')
  const [maria, setMaria] = useState<Record<number, string>>({})
  const [note, setNote] = useState<Record<number, string>>({})
  const [pubAs, setAs] = useState<Record<number, string>>({})
  const [member, setMember] = useState('')

  const load = useCallback(async () => {
    if (!modKey) return setErr('Moderators only. Open this page with your key once: /articles/mod?key=…')
    const r = await fetch('/api/forum/mod', { cache: 'no-store', headers: { 'x-mod-key': modKey } })
    const j = await r.json()
    if (!r.ok) return setErr(j.error ?? 'error')
    setSt(j)
  }, [modKey])
  useEffect(() => {
    load()
  }, [load])

  const post = async (body: Record<string, unknown>, id: string, after?: string) => {
    setBusy(id)
    setErr('')
    setMsg('')
    const r = await fetch('/api/forum/mod', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-mod-key': modKey }, body: JSON.stringify(body) })
    const j = await r.json()
    setBusy('')
    if (!r.ok) return setErr(j.error ?? 'error')
    setMsg(after ?? 'Done. The site rebuilds in about two minutes.')
    await load()
  }

  const field = { width: '100%', padding: '4px 6px', border: '1px solid #8a8a8a', font: 'inherit', background: '#fff', boxSizing: 'border-box' as const, maxWidth: 520 }
  const cell = { padding: '4px 8px', borderBottom: '1px solid var(--qcf-line)', verticalAlign: 'top' as const }

  if (err && !st) return <div className="qcf-box qcf-win" style={{ padding: 12, color: '#b00' }}>{err}</div>
  if (!st) return <div className="qcf-box qcf-win" style={{ padding: 12 }}>Loading…</div>
  return (
    <>
      {(err || msg) && (
        <div className="qcf-box qcf-win" style={{ padding: 8, color: err ? '#b00' : '#060', marginBottom: 10 }}>
          {err || msg}
        </div>
      )}

      <div className="qcf-box">
        <div className="qcf-cat">Mode</div>
        <div className="qcf-win qcf-small" style={{ padding: '8px 12px' }}>
          {st.queue ? 'Queue: posts wait here until approved.' : 'Direct: posts publish on their own. Remove anything from the lists below if needed. Switch to a queue with FORUM_MODERATION=queue.'}
        </div>
      </div>

      <div className="qcf-box">
        <div className="qcf-cat">Link a login to an existing member</div>
        <div className="qcf-win" style={{ padding: '8px 12px' }}>
          {st.me ? (
            <>
              <p className="qcf-small" style={{ margin: '0 0 6px' }}>
                You are logged in as <b>{st.me.name}</b> ({st.me.auth}, {st.me.handle}). Link this login to a member handle, so your posts count for them from now on.
              </p>
              <p style={{ margin: 0, display: 'flex', gap: 6, maxWidth: 520 }}>
                <input onChange={e => setMember(e.target.value)} placeholder="member handle, e.g. usetesserai" style={field} value={member} />
                <button className="qcf-btn qcf-btn-main" disabled={!member || Boolean(busy)} onClick={() => post({ action: 'link', member }, 'link', `Linked to ${member}. Next posts from this login count for them.`)} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} type="button">
                  Link
                </button>
              </p>
            </>
          ) : (
            <p className="qcf-small" style={{ margin: 0 }}>
              Log in on the forum first (wallet or tripcode), then come back here to link that login to a member.
            </p>
          )}
          {st.links.length > 0 && (
            <p className="qcf-small qcf-muted" style={{ margin: '8px 0 0' }}>
              Links: {st.links.map(l => `${l.identity ? `${l.identity.slice(0, 6)}…` : l.handle} → ${l.member}`).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {st.queue &&
        (st.pending.length === 0 ? (
          <div className="qcf-box qcf-win" style={{ padding: 12 }}>
            Nothing waiting.
          </div>
        ) : (
          st.pending.map(i => (
            <div className="qcf-box" key={i.number}>
              <div className="qcf-cat">
                #{i.number} · {i.data.kind} · {i.data.author.name} ({i.data.author.auth}) · {i.data.date}
                {i.data.topic && ` · in ${i.data.topic}`}
              </div>
              <div className="qcf-win" style={{ padding: '10px 14px' }}>
                {i.data.kind === 'topic' && (
                  <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14 }}>
                    {i.data.title}
                  </p>
                )}
                <pre className="qcf-post" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: '0 0 10px', maxHeight: 420, overflow: 'auto', background: '#fff', border: '1px solid var(--qcf-line)', padding: 8 }}>
                  {i.data.text}
                </pre>
                <p className="qcf-small qcf-muted" style={{ margin: '0 0 8px' }}>
                  id: {i.data.author.id} · handle: {i.data.author.handle}
                  {i.data.xUrl && (
                    <>
                      {' · '}
                      <a href={i.data.xUrl} rel="noopener noreferrer">
                        on X
                      </a>
                    </>
                  )}
                  {' · '}
                  <a href={i.html_url} rel="noopener noreferrer">
                    issue
                  </a>
                </p>
                <p style={{ margin: '0 0 6px' }}>
                  <input onChange={e => setAs(m => ({ ...m, [i.number]: e.target.value }))} placeholder="Publish as existing member (handle), optional" style={field} value={pubAs[i.number] ?? ''} />
                </p>
                {i.data.kind === 'topic' && (
                  <>
                    <p style={{ margin: '0 0 6px' }}>
                      <input onChange={e => setMaria(m => ({ ...m, [i.number]: e.target.value }))} placeholder="Maria's repost URL (adds +1 merit), optional" style={field} value={maria[i.number] ?? ''} />
                    </p>
                    <p style={{ margin: '0 0 8px' }}>
                      <input onChange={e => setNote(m => ({ ...m, [i.number]: e.target.value }))} placeholder="Editor's note shown above the post, optional" style={field} value={note[i.number] ?? ''} />
                    </p>
                  </>
                )}
                <button className="qcf-btn qcf-btn-main" disabled={Boolean(busy)} onClick={() => post({ action: 'approve', number: i.number, as: pubAs[i.number] || undefined, mariaRepost: maria[i.number] || undefined, note: note[i.number] || undefined }, `a${i.number}`)} style={{ cursor: 'pointer' }} type="button">
                  Approve and publish
                </button>{' '}
                <button className="qcf-btn" disabled={Boolean(busy)} onClick={() => post({ action: 'reject', number: i.number }, `r${i.number}`, 'Rejected.')} style={{ cursor: 'pointer' }} type="button">
                  Reject
                </button>
              </div>
            </div>
          ))
        ))}

      <div className="qcf-box">
        <div className="qcf-cat">Forum topics (Open Board)</div>
        <div className="qcf-win" style={{ padding: 0 }}>
          <table className="qcf-small" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {st.topics.map(t => (
                <tr key={t.slug}>
                  <td style={cell}>{t.date}</td>
                  <td style={cell}>
                    <a href={`/articles/${t.slug}`}>{t.title}</a>
                  </td>
                  <td style={cell}>
                    {t.author} ({t.auth ?? 'x'})
                  </td>
                  <td style={{ ...cell, textAlign: 'right' }}>
                    <button className="qcf-btn" disabled={Boolean(busy)} onClick={() => confirm(`Remove "${t.title}" and its replies?`) && post({ action: 'remove', slug: t.slug }, t.slug)} style={{ cursor: 'pointer' }} type="button">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {st.topics.length === 0 && (
                <tr>
                  <td style={cell}>No forum topics yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="qcf-box">
        <div className="qcf-cat">Replies (latest 30)</div>
        <div className="qcf-win" style={{ padding: 0 }}>
          <table className="qcf-small" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {st.replies.map(r => (
                <tr key={r.id}>
                  <td style={cell}>{r.date}</td>
                  <td style={cell}>
                    <a href={`/articles/${r.topic}`}>{r.topic}</a>
                    <br />
                    <span className="qcf-muted">{r.text}</span>
                  </td>
                  <td style={cell}>{r.author}</td>
                  <td style={{ ...cell, textAlign: 'right' }}>
                    <button className="qcf-btn" disabled={Boolean(busy)} onClick={() => confirm(`Remove this reply by ${r.author}?`) && post({ action: 'remove', reply: r.id }, r.id)} style={{ cursor: 'pointer' }} type="button">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {st.replies.length === 0 && (
                <tr>
                  <td style={cell}>No replies yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
