'use client'

import { useEffect, useRef, useState } from 'react'
import { MARIA_LIMITS } from '@/lib/pool/config'
import { diagnose, looksLikeLog } from '@/lib/pool/doctor'
import { redactWallets } from '@/lib/pool/redact'
import { Screen, useAi, useRing, useStickToBottom } from './flow'
import type { Go } from './flows'
import { Halo } from './Halo'
import { Chips, Field, Rich, Say, TONE, You } from './ui'
import s from './maria.module.css'

type Msg = { role: 'user' | 'assistant'; content: string; offline?: boolean }

const TOOL_CHIPS = [
  { value: 'pick', label: 'Pick hardware' },
  { value: 'connect', label: 'Connect' },
  { value: 'doctor', label: 'Fix my rig' },
]

/** Free-form questions. Wallet strings are removed in the browser before anything is sent. */
export function AskFlow({ go, first }: { go: Go; first?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [busy, setBusy] = useState(false)
  const ring = useRing()
  const ai = useAi()
  const sent = useRef(false)
  const scroller = useStickToBottom(msgs.map(m => m.content.length).join(',') + busy)

  const ask = async (raw: string) => {
    // A pasted miner log goes to the log doctor, which runs here; a question, even a multi-line one, stays a question.
    if (looksLikeLog(raw) && diagnose(raw).findings.length) return go('doctor', { mode: raw })
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
          const last = c[c.length - 1]
          if (last) c[c.length - 1] = { ...last, content: last.content + chunk }
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
    if (first && !sent.current && ai !== false) {
      sent.current = true
      ask(first)
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: send the handed-over question once
  }, [first])

  const lastOffline = msgs.at(-1)?.offline
  const tools = <Chips label="Tools" onPick={v => go(v as 'pick' | 'connect' | 'doctor')} options={TOOL_CHIPS} />
  // The AI is not connected: no composer and no promise, only what works now.
  if (ai === false) {
    return (
      <Screen dock={tools} onBack={() => go('home')} scrollRef={scroller} sub="Coming soon." title="Ask Maria">
        <Say>
          Questions to Maria are coming soon: the AI is not connected yet. Until then these three tools answer most setups, right here in your browser: Pick hardware, Connect
          my machine, and Fix my rig.
        </Say>
      </Screen>
    )
  }
  const dock = (
    <>
      {lastOffline && <div style={{ marginBottom: 8 }}>{tools}</div>}
      {ai && <Field label="Ask Maria" maxLength={MARIA_LIMITS.maxInput} multiline onSubmit={ask} placeholder="Ask Maria" />}
    </>
  )
  return (
    <Screen dock={dock} onBack={() => go('home')} scrollRef={scroller} sub="Hardware, setup, errors. In your language." title="Ask Maria">
      {!msgs.length && <Say>Ask anything technical about mining in the pool.</Say>}
      {msgs.map((m, i) =>
        m.role === 'user' ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: an append-only list
          <You key={i}>{m.content}</You>
        ) : (
          m.content ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: an append-only list
            <Say fault={m.offline} key={i}>
              <Rich text={m.content} />
            </Say>
          ) : null
        ),
      )}
      {!busy && msgs.some(m => m.role === 'assistant' && !m.offline && m.content) && (
        <div className={s.quietRow}>
          <Chips
            label="After the answer"
            onPick={v => (v === 'tip' ? go('tip') : go('report', { from: 'ask', step: `answer:${msgs.filter(m => m.role === 'assistant').length}` }))}
            options={[
              { value: 'report', label: 'Report a problem', quiet: true },
              { value: 'tip', label: 'Tip Maria', quiet: true },
            ]}
          />
        </div>
      )}
      {busy && (msgs.at(-1)?.role === 'user' || !msgs.at(-1)?.content) && (
        <div className={s.haloSlot}>
          <Halo face={40} label="Maria is thinking" mode={ring.state.mode} size={152} tone={ring.state.tone} />
        </div>
      )}
    </Screen>
  )
}
