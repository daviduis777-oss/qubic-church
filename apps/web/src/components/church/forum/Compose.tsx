'use client'

import { useEffect, useState } from 'react'
import { LoginBox, type Me } from './LoginBox'

/**
 * New topic, or a reply. Posts publish on their own (the site rebuilds in about two minutes);
 * with FORUM_MODERATION=queue they wait for a moderator instead.
 */
export function Compose({ kind, topic, topicTitle }: { kind: 'topic' | 'reply'; topic?: string; topicTitle?: string }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  const [ready, setReady] = useState(true)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [xUrl, setXUrl] = useState('')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [done, setDone] = useState<{ queue?: number; slug?: string; topic?: string; author?: string } | null>(null)

  useEffect(() => {
    fetch('/api/forum/me', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => {
        setMe(j.user ?? null)
        setReady(Boolean(j.ready))
      })
      .catch(() => setMe(null))
  }, [])

  const importX = async () => {
    setErr('')
    setBusy('Fetching the post…')
    try {
      const r = await fetch(`/api/forum/fetch-x?url=${encodeURIComponent(xUrl)}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      if (j.title && !title) setTitle(j.title)
      setText(j.text)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy('')
    }
  }

  const submit = async () => {
    setErr('')
    setBusy('Publishing…')
    try {
      const r = await fetch('/api/forum/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, topic, title, text, xUrl }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setDone(j.published ? { slug: j.slug, topic: j.topic, author: j.author } : { queue: j.queue })
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy('')
    }
  }

  const field = { width: '100%', padding: '6px 8px', border: '1px solid #8a8a8a', font: 'inherit', background: '#fff', boxSizing: 'border-box' as const }

  if (me === undefined) return <div className="qcf-box qcf-win" style={{ padding: 12 }}>…</div>
  if (!me) return <LoginBox onLogin={setMe} />
  if (!ready)
    return (
      <div className="qcf-box qcf-win" style={{ padding: 12 }}>
        Posting is not switched on yet. Until then, write on X starting with “hey @maria_aigarth”.
      </div>
    )
  if (done)
    return (
      <div className="qcf-box">
        <div className="qcf-cat">{done.queue ? 'Sent' : 'Published'}</div>
        <div className="qcf-win qcf-post" style={{ padding: 12 }}>
          {done.queue ? (
            <p>
              Your {kind} is in the queue (#{done.queue}). A moderator reads it and it appears on the board, usually within a day. Your name, {me.name}, stays on it.
            </p>
          ) : (
            <p>
              Your {kind} is in the archive under the name <b>{done.author ?? me.name}</b>. The site rebuilds now; in about two minutes it is live at{' '}
              <a href={`/articles/${done.slug ?? done.topic}`}>qubic.church/articles/{done.slug ?? done.topic}</a>.
            </p>
          )}
          <p className="qcf-small qcf-muted">If you also posted it on X with “hey @maria_aigarth”, Maria&apos;s repost adds merit.</p>
        </div>
      </div>
    )

  return (
    <div className="qcf-box">
      <div className="qcf-cat">{kind === 'topic' ? 'Start new topic · Open Board' : `Reply · ${topicTitle ?? ''}`}</div>
      <div className="qcf-win" style={{ padding: '10px 14px' }}>
        <p className="qcf-small qcf-muted" style={{ margin: '0 0 10px' }}>
          Posting as <b>{me.name}</b> ({me.auth === 'qubic' ? 'Qubic wallet' : 'tripcode'}). Plain text. A blank line starts a paragraph, a short line on its own becomes a heading, a line starting with “&gt; ” is a quote.
        </p>
        {kind === 'topic' && (
          <>
            <p style={{ margin: '0 0 8px' }}>
              <b>Already wrote it on X?</b>
              <br />
              <span style={{ display: 'flex', gap: 6, maxWidth: 640 }}>
                <input onChange={e => setXUrl(e.target.value)} placeholder="https://x.com/you/status/…" style={field} value={xUrl} />
                <button className="qcf-btn" disabled={!xUrl || Boolean(busy)} onClick={importX} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} type="button">
                  Import text
                </button>
              </span>
            </p>
            <p style={{ margin: '0 0 8px' }}>
              <b>Subject</b>
              <br />
              <input maxLength={120} onChange={e => setTitle(e.target.value)} style={{ ...field, maxWidth: 640 }} value={title} />
            </p>
          </>
        )}
        <p style={{ margin: '0 0 8px' }}>
          <b>{kind === 'topic' ? 'Text' : 'Your reply'}</b>
          <br />
          <textarea maxLength={15000} onChange={e => setText(e.target.value)} rows={kind === 'topic' ? 18 : 8} style={{ ...field, maxWidth: 760 }} value={text} />
          <span className="qcf-small qcf-muted">{text.length} / 15000</span>
        </p>
        <p style={{ margin: '0 0 4px' }}>
          <button className="qcf-btn qcf-btn-main" disabled={Boolean(busy)} onClick={submit} style={{ cursor: 'pointer' }} type="button">
            {kind === 'topic' ? 'Post topic' : 'Post reply'}
          </button>{' '}
          <span className="qcf-small qcf-muted">Publishes right away under your name. No topic, no category, no censorship. The site rebuilds in about two minutes.</span>
        </p>
        {busy && <p className="qcf-small">{busy}</p>}
        {err && (
          <p className="qcf-small" style={{ color: '#b00' }}>
            {err}
          </p>
        )}
      </div>
    </div>
  )
}
