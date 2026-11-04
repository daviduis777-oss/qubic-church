'use client'

import { useEffect, useRef, useState } from 'react'
import { MARIA_LIMITS } from '@/lib/pool/config'
import { redactWallets } from '@/lib/pool/redact'
import { useRing, useStickToBottom } from './flow'
import type { Go } from './flows'
import { Chips, Field, Rich, Say, TONE, You } from './ui'
import s from './maria.module.css'

type Msg = { role: 'user' | 'assistant'; content: string; offline?: boolean }

const TOOL_CHIPS = [
  { value: 'pick', label: 'Pick hardware' },
  { value: 'connect', label: 'Connect my machine' },
  { value: 'doctor', label: 'Fix my rig' },
]

/** Free-form questions. Wallet strings are removed in the browser before anything is sent. */
export function AskFlow({ go, first }: { go: Go; first?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [busy, setBusy] = useState(false)
  const ring = useRing()
  const sent = useRef(false)
  const scroller = useStickToBottom(msgs.map(m => m.content.length).join(',') + busy)

  const ask = async (raw: string) => {
    const text = redactWallets(raw.trim()).slice(0, MARIA_LIMITS.maxInput)
    if (!text || busy) return
    const history = [...msgs.filter(m => !m.offline), { role: 'user' as const, content: text }]
    setMsgs(m => [...m, { role: 'user', content: text }])
    setBusy(true)
    ring.think()
    try {
      const r = await fetch('/api/pool/maria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      })
      if (!r.ok || !r.body || !(r.headers.get('content-type') ?? '').startsWith('text/plain')) {
        const j = (await r.json().catch(() => ({}))) as { message?: string }
        setMsgs(m => [...m, { role: 'assistant', content: j.message ?? `Ask Maria is not available (${r.status}).`, offline: true }])
        ring.settle(TONE.coral)
        return
      }
      setMsgs(m => [...m, { role: 'assistant', content: '' }])
      const reader = r.body.getReader()
      const dec = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = dec.decode(value, { stream: true })
        setMsgs(m => {
          const c = [...m]
          const last = c[c.length - 1]!
          c[c.length - 1] = { ...last, content: last.content + chunk }
          return c
        })
      }
      ring.idle()
    } catch {
      setMsgs(m => [...m, { role: 'assistant', content: 'No connection. Check your network and ask again. The tools below work offline.', offline: true }])
      ring.settle(TONE.coral)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (first && !sent.current) {
      sent.current = true
      ask(first)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first])

  const lastOffline = msgs.at(-1)?.offline
  return (
    <>
      <div aria-live="polite" className={s.thread} ref={scroller}>
        {!msgs.length && <Say>Ask anything technical about mining in the pool. Hardware, setup, errors. I answer in your language.</Say>}
        {msgs.map((m, i) =>
          m.role === 'user' ? (
            <You key={i}>{m.content}</You>
          ) : (
            <Say fault={m.offline} key={i}>
              {m.content ? <Rich text={m.content} /> : null}
            </Say>
          ),
        )}
        {busy && msgs.at(-1)?.role === 'user' && (
          <div aria-label="Maria is thinking" className={s.typing} role="status">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
      <div className={s.dock}>
        {lastOffline && (
          <div style={{ marginBottom: 8 }}>
            <Chips label="Tools" onPick={v => go(v as 'pick' | 'connect' | 'doctor')} options={TOOL_CHIPS} />
          </div>
        )}
        <Field label="Ask Maria" maxLength={MARIA_LIMITS.maxInput} multiline onSubmit={ask} placeholder="Ask Maria" />
      </div>
    </>
  )
}
