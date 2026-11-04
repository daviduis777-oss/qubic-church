'use client'

import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import type { Verdict } from '@/lib/pool/hardware'
import type { Severity } from '@/lib/pool/doctor'
import { RingGlyph } from './Ring'
import s from './maria.module.css'

export const TONE = { brass: '#C8A45A', teal: '#5BC0A6', coral: '#E2786A', fog: '#9AA3B2' } as const

export const verdictTone = (v: Verdict) => (v === 'Golden' ? TONE.brass : v === 'Good' || v === 'Works' ? TONE.teal : v === 'Skip' ? TONE.coral : TONE.fog)
export const severityTone = (v: Severity) => (v === 'fine' ? TONE.teal : TONE.coral)
export const SEVERITY_LABEL: Record<Severity, string> = { fault: 'Fix', check: 'Check', fine: 'Fine' }

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function Say({ children, fault }: { children: ReactNode; fault?: boolean }) {
  return <div className={cx(s.say, fault && s.sayFault)}>{children}</div>
}

export function You({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return <div className={cx(s.you, mono && s.youMono)}>{children}</div>
}

export type ChipOpt = { value: string; label: string; primary?: boolean; mono?: boolean }

export function Chips({ options, onPick, label }: { options: ChipOpt[]; onPick: (v: string) => void; label: string }) {
  return (
    <div aria-label={label} className={s.chips} role="group">
      {options.map(o => (
        <button className={cx(s.chip, o.primary && s.chipPrimary, o.mono && s.chipMono)} key={o.value} onClick={() => onPick(o.value)} type="button">
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function useCopy() {
  const [done, setDone] = useState('')
  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setDone(id)
      setTimeout(() => setDone(d => (d === id ? '' : d)), 1600)
    } catch {}
  }
  return { done, copy }
}

export function Command({ text, label = 'command' }: { text: string; label?: string }) {
  const { done, copy } = useCopy()
  return (
    <pre className={s.cmd}>
      {text}
      <button aria-label={`Copy ${label}`} className={s.copy} onClick={() => copy('c', text)} type="button">
        {done ? 'Copied' : 'Copy'}
      </button>
    </pre>
  )
}

export function VerdictCard({ title, verdict, reasons, children }: { title: string; verdict: Verdict; reasons: string[]; children?: ReactNode }) {
  const tone = verdictTone(verdict)
  return (
    <article className={s.card}>
      <div className={s.cardHead}>
        <h3 className={s.cardTitle} style={{ margin: 0 }}>
          {title}
        </h3>
        <span className={s.verdict} style={{ color: tone }}>
          <RingGlyph color={tone} />
          {verdict === 'Unknown' ? 'Not sure' : verdict}
        </span>
      </div>
      <ul className={s.reasons}>
        {reasons.map(r => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      {children}
    </article>
  )
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className={s.card}>
      {title && (
        <h3 className={s.cardTitle} style={{ margin: '0 0 8px' }}>
          {title}
        </h3>
      )}
      {children}
    </section>
  )
}

export function Checklist({ items }: { items: { title: string; body?: string; command?: string }[] }) {
  const [on, setOn] = useState<Record<number, boolean>>({})
  const base = useId()
  return (
    <ul className={s.checks}>
      {items.map((c, i) => (
        <li className={s.check} key={c.title}>
          <input checked={!!on[i]} id={`${base}-${i}`} onChange={e => setOn(o => ({ ...o, [i]: e.target.checked }))} type="checkbox" />
          <div>
            <label className={cx(s.stepTitle, on[i] && s.checkDone)} htmlFor={`${base}-${i}`}>
              {c.title}
            </label>
            {c.body && <p className={s.stepBody}>{c.body}</p>}
            {c.command && (
              <div style={{ marginTop: 6 }}>
                <Command label={c.title} text={c.command} />
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

/** A text answer: single line or a log textarea. Enter sends (Shift+Enter for a new line in a textarea). */
export function Field({
  placeholder,
  onSubmit,
  multiline,
  mono,
  initial = '',
  label,
  error,
  inputMode,
  autoFocus = true,
  maxLength,
  rows,
  newlines,
}: {
  placeholder: string
  onSubmit: (v: string) => void
  multiline?: boolean
  mono?: boolean
  initial?: string
  label: string
  error?: string
  inputMode?: 'numeric' | 'text'
  autoFocus?: boolean
  maxLength?: number
  /** textarea height in lines */
  rows?: number
  /** Enter adds a line (logs); otherwise Enter sends and Shift+Enter adds a line */
  newlines?: boolean
}) {
  const [v, setV] = useState(initial)
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null)
  useEffect(() => setV(initial), [initial])
  useEffect(() => {
    if (autoFocus && window.matchMedia('(min-width: 768px)').matches) ref.current?.focus({ preventScroll: true })
  }, [autoFocus])
  // The field always clears on send, so a refused value (a seed) never stays on screen.
  const send = () => {
    if (!v.trim()) return
    onSubmit(v)
    setV('')
  }
  const common = {
    'aria-label': label,
    'aria-invalid': error ? true : undefined,
    className: cx(s.input, mono && s.inputMono),
    placeholder,
    value: v,
    maxLength,
    autoComplete: 'off',
    spellCheck: false,
    onChange: (e: { target: { value: string } }) => setV(e.target.value),
  }
  return (
    <>
      <form
        className={s.field}
        onSubmit={e => {
          e.preventDefault()
          send()
        }}
      >
        {multiline ? (
          <textarea
            {...common}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && !newlines) {
                e.preventDefault()
                send()
              }
            }}
            ref={ref}
            rows={rows ?? 1}
          />
        ) : (
          <input {...common} inputMode={inputMode} ref={ref} type="text" />
        )}
        <button aria-label="Send" className={s.send} disabled={!v.trim()} type="submit">
          <ArrowUp aria-hidden size={18} strokeWidth={2.25} />
        </button>
      </form>
      {error && (
        <p className={s.fieldError} role="alert">
          {error}
        </p>
      )}
    </>
  )
}

/** Very small renderer for Maria's AI answers: paragraphs, `code`, ```blocks```, **bold**. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/```[a-zA-Z]*\n?/)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <Command key={i} text={p.replace(/\n$/, '')} />
        ) : (
          p
            .split(/\n{2,}/)
            .filter(x => x.trim())
            .map((para, j) => <p key={`${i}-${j}`}>{inline(para.replace(/^\n+|\n+$/g, ''))}</p>)
        ),
      )}
    </>
  )
}

function inline(t: string): ReactNode[] {
  return t.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((x, i) => {
    if (x.startsWith('`') && x.endsWith('`') && x.length > 2) return <code key={i}>{x.slice(1, -1)}</code>
    if (x.startsWith('**') && x.endsWith('**') && x.length > 4) return <strong key={i}>{x.slice(2, -2)}</strong>
    return x
  })
}
