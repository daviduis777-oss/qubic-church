'use client'

import { useState } from 'react'
import { LoginBox } from '@/components/church/forum/LoginBox'

/** For testers with an invite: log in with the site account, enter the code, the gate opens. */
export function W4WGate({ name }: { name: string | null }) {
  const [me, setMe] = useState<string | null>(name)
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function enter(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const r = await fetch('/api/w4w', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'redeem', code }) })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) throw new Error(j.error || 'The gate did not open. Try again.')
      window.location.reload()
    } catch (x) {
      setErr((x as Error).message)
      setBusy(false)
    }
  }

  if (!me && !open)
    return (
      <button className="w4w-link" onClick={() => setOpen(true)} type="button">
        I have an invite
      </button>
    )

  if (!me)
    return (
      <div className="w4w-panel">
        <p className="w4w-note">Log in with the same account as The Crypt and BPP-9000: a Qubic wallet, or a name and a secret code.</p>
        <div className="qcf" style={{ borderRadius: 10, overflow: 'hidden', textAlign: 'left' }}>
          <LoginBox onLogin={u => setMe(u.name)} />
        </div>
      </div>
    )

  return (
    <form className="w4w-panel" onSubmit={enter}>
      <label className="w4w-note" htmlFor="w4w-code">
        {me}, enter your invite code.
      </label>
      <div className="w4w-row">
        <input autoComplete="off" id="w4w-code" maxLength={64} onChange={e => setCode(e.target.value)} placeholder="Invite code" spellCheck={false} value={code} />
        <button disabled={busy || !code.trim()} type="submit">
          {busy ? 'Opening…' : 'Enter Aigarth'}
        </button>
      </div>
      {err && (
        <p className="w4w-err" role="alert">
          {err}
        </p>
      )}
    </form>
  )
}
