'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Avatar } from './Avatar'
import { LoginBox, type Me } from './LoginBox'

type Profile = { x?: string; signature?: string; bio?: string; avatar?: string }

/** Shrink any image to a 128px square JPEG in the browser, so nothing heavy reaches the server. */
async function squareJpeg(file: File, size = 128): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((ok, no) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = () => no(new Error('Not an image'))
      i.src = url
    })
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    const ctx = c.getContext('2d')!
    const s = Math.min(img.width, img.height)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, size, size)
    ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
    let q = 0.86
    let out = c.toDataURL('image/jpeg', q)
    while (out.length > 60_000 && q > 0.4) {
      q -= 0.1
      out = c.toDataURL('image/jpeg', q)
    }
    return out
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function Cabinet() {
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  const [handle, setHandle] = useState('')
  const [p, setP] = useState<Profile>({})
  const [avatar, setAvatar] = useState<string | undefined>(undefined)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const file = useRef<HTMLInputElement>(null)

  const load = async () => {
    const r = await fetch('/api/forum/profile', { cache: 'no-store' })
    if (r.status === 401) return setMe(null)
    const j = await r.json()
    if (!r.ok) return setErr(j.error)
    setHandle(j.handle)
    setP(j.profile ?? {})
  }
  useEffect(() => {
    fetch('/api/forum/me', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => {
        setMe(j.user ?? null)
        if (j.user) load()
      })
      .catch(() => setMe(null))
  }, [])

  const pick = async (f?: File) => {
    if (!f) return
    setErr('')
    try {
      setAvatar(await squareJpeg(f))
      setRemoveAvatar(false)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  const save = async () => {
    setBusy(true)
    setErr('')
    setMsg('')
    try {
      const r = await fetch('/api/forum/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ x: p.x ?? '', signature: p.signature ?? '', bio: p.bio ?? '', avatar, removeAvatar }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setP(j.profile)
      setAvatar(undefined)
      setRemoveAvatar(false)
      setMsg('Saved. The site rebuilds now; your profile shows the changes in about two minutes.')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const field = { width: '100%', padding: '6px 8px', border: '1px solid #8a8a8a', font: 'inherit', background: '#fff', boxSizing: 'border-box' as const, maxWidth: 520 }

  if (me === undefined) return <div className="qcf-box qcf-win" style={{ padding: 12 }}>…</div>
  if (!me)
    return (
      <LoginBox
        onLogin={u => {
          setMe(u)
          load()
        }}
      />
    )

  const shown = removeAvatar ? undefined : (avatar ?? p.avatar)
  return (
    <div className="qcf-box">
      <div className="qcf-cat">My cabinet · {me.name}</div>
      <div className="qcf-win" style={{ padding: '10px 14px' }}>
        <p className="qcf-small qcf-muted" style={{ margin: '0 0 12px' }}>
          Logged in with {me.auth === 'qubic' ? 'a Qubic wallet' : 'a tripcode'} as <b>{me.name}</b>
          {handle && (
            <>
              {' · '}
              <Link href={`/articles/profile/${handle.toLowerCase()}`}>public profile</Link>
            </>
          )}
          . Everything here is public. Nothing here is required.
        </p>

        <table style={{ marginBottom: 10 }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top', paddingRight: 14, borderTop: 0 }}>
                <b>Avatar</b>
                <div style={{ margin: '6px 0' }}>
                  <Avatar pic={shown} seed={me.auth === 'qubic' ? me.id : me.handle} size={96} />
                </div>
              </td>
              <td style={{ verticalAlign: 'top', borderTop: 0 }}>
                <p className="qcf-small" style={{ margin: '0 0 6px' }}>
                  Any picture. It is cut to a square and shrunk to 128 pixels in your browser before upload. Without one you keep the pixel avatar made from your ID.
                </p>
                <input accept="image/*" onChange={e => pick(e.target.files?.[0])} ref={file} style={{ font: 'inherit' }} type="file" />
                {(p.avatar || avatar) && (
                  <p style={{ margin: '6px 0 0' }}>
                    <button
                      className="qcf-btn"
                      onClick={() => {
                        setAvatar(undefined)
                        setRemoveAvatar(true)
                        if (file.current) file.current.value = ''
                      }}
                      style={{ cursor: 'pointer' }}
                      type="button"
                    >
                      Back to the pixel avatar
                    </button>
                  </p>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        <p style={{ margin: '0 0 8px' }}>
          <b>X</b>
          <br />
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, maxWidth: 520 }}>
            <span>@</span>
            <input maxLength={15} onChange={e => setP({ ...p, x: e.target.value })} placeholder="your X handle, optional" style={field} value={p.x ?? ''} />
          </span>
          <span className="qcf-small qcf-muted">Shown as a link under your name. Not verified; it is your word.</span>
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <b>Signature</b>
          <br />
          <input maxLength={160} onChange={e => setP({ ...p, signature: e.target.value })} placeholder="one line under every post, optional" style={field} value={p.signature ?? ''} />
        </p>
        <p style={{ margin: '0 0 10px' }}>
          <b>About</b>
          <br />
          <textarea maxLength={600} onChange={e => setP({ ...p, bio: e.target.value })} placeholder="a few lines on your profile page, optional" rows={4} style={field} value={p.bio ?? ''} />
          <span className="qcf-small qcf-muted">{(p.bio ?? '').length} / 600</span>
        </p>
        <p style={{ margin: 0 }}>
          <button className="qcf-btn qcf-btn-main" disabled={busy} onClick={save} style={{ cursor: 'pointer' }} type="button">
            Save
          </button>{' '}
          {busy && <span className="qcf-small">saving…</span>}
        </p>
        {msg && (
          <p className="qcf-small" style={{ color: '#060', margin: '8px 0 0' }}>
            {msg}
          </p>
        )}
        {err && (
          <p className="qcf-small" style={{ color: '#b00', margin: '8px 0 0' }}>
            {err}
          </p>
        )}
      </div>
    </div>
  )
}
