'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Me = { auth: 'qubic' | 'trip'; name: string; handle: string } | null

/** "Welcome, Guest" / "Hello, Name" in the forum menu bar. */
export function LoginStatus() {
  const [me, setMe] = useState<Me | undefined>(undefined)
  useEffect(() => {
    const load = () =>
      fetch('/api/forum/me', { cache: 'no-store' })
        .then(r => r.json())
        .then(j => setMe(j.user ?? null))
        .catch(() => setMe(null))
    load()
    window.addEventListener('qcf-login', load)
    return () => window.removeEventListener('qcf-login', load)
  }, [])
  if (me === undefined) return <>Welcome.</>
  if (!me)
    return (
      <>
        Welcome, Guest. <Link href="/articles/new">Login</Link> with a Qubic wallet or a tripcode, or write on X starting with “hey @maria_aigarth”.
      </>
    )
  return (
    <>
      Hello, <Link href="/articles/me">{me.name}</Link>. <Link href="/articles/me">My cabinet</Link> ·{' '}
      <button
        onClick={async () => {
          await fetch('/api/forum/logout', { method: 'POST' })
          setMe(null)
        }}
        style={{ background: 'none', border: 0, padding: 0, color: 'var(--qcf-link)', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}
        type="button"
      >
        Logout
      </button>
    </>
  )
}
