'use client'

import { useCallback, useEffect, useState } from 'react'

type Item = { number: number; created_at: string; html_url: string; data: { kind: string; title: string; text: string; topic?: string; xUrl?: string; author: { auth: string; id: string; name: string; handle: string }; date: string } }

export function ModQueue({ modKey }: { modKey: string }) {
  const [items, setItems] = useState<Item[] | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState<number | null>(null)
  const [maria, setMaria] = useState<Record<number, string>>({})
  const [note, setNote] = useState<Record<number, string>>({})

  const load = useCallback(async () => {
    const r = await fetch(`/api/forum/mod?key=${encodeURIComponent(modKey)}`, { cache: 'no-store' })
    const j = await r.json()
    if (!r.ok) return setErr(j.error ?? 'error')
    setItems(j.pending)
  }, [modKey])
  useEffect(() => {
    load()
  }, [load])

  const act = async (n: number, action: 'approve' | 'reject') => {
    setBusy(n)
    setErr('')
    const r = await fetch('/api/forum/mod', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: modKey, number: n, action, mariaRepost: maria[n] || undefined, note: note[n] || undefined }) })
    const j = await r.json()
    setBusy(null)
    if (!r.ok) return setErr(j.error ?? 'error')
    setItems(items => items?.filter(i => i.number !== n) ?? null)
  }

  const field = { width: '100%', padding: '4px 6px', border: '1px solid #8a8a8a', font: 'inherit', background: '#fff', boxSizing: 'border-box' as const, maxWidth: 520 }

  if (err) return <div className="qcf-box qcf-win" style={{ padding: 12, color: '#b00' }}>{err}</div>
  if (!items) return <div className="qcf-box qcf-win" style={{ padding: 12 }}>Loading the queue…</div>
  if (items.length === 0) return <div className="qcf-box qcf-win" style={{ padding: 12 }}>Nothing waiting. Go write something.</div>
  return (
    <>
      {items.map(i => (
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
            <button className="qcf-btn qcf-btn-main" disabled={busy === i.number} onClick={() => act(i.number, 'approve')} style={{ cursor: 'pointer' }} type="button">
              Approve and publish
            </button>{' '}
            <button className="qcf-btn" disabled={busy === i.number} onClick={() => act(i.number, 'reject')} style={{ cursor: 'pointer' }} type="button">
              Reject
            </button>
            {busy === i.number && <span className="qcf-small"> working…</span>}
          </div>
        </div>
      ))}
    </>
  )
}
