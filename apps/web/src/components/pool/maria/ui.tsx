'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUp, Check, CircleHelp, Copy, Crown, Minus, Terminal, X } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import type { Severity } from '@/lib/pool/doctor'
import type { Card as HwCard, Verdict } from '@/lib/pool/hardware'
import { SOURCES, type SourceId } from '@/lib/pool/knowledge'
import s from './maria.module.css'

export const TONE = { gold: '#D9A441', cyan: '#6FE3FF', mist: '#8FD3C8', coral: '#FF7A6B', fog: '#9BA3C7' } as const

export const verdictTone = (v: Verdict) => (v === 'Golden' ? TONE.gold : v === 'Good' ? TONE.cyan : v === 'Works' ? TONE.mist : v === 'Skip' ? TONE.coral : TONE.fog)
export const severityTone = (v: Severity) => (v === 'fine' ? TONE.cyan : v === 'check' ? TONE.gold : TONE.coral)
export const SEVERITY_LABEL: Record<Severity, string> = { fault: 'Fix this', check: 'Check this', fine: 'Fine' }
const VERDICT_LABEL: Record<Verdict, string> = { Golden: 'Golden', Good: 'Good', Works: 'Works', Skip: 'Skip', Unknown: 'Not sure' }

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export const SPRING = { type: 'spring' as const, stiffness: 420, damping: 40, mass: 0.9 }
export const PRESS = { scale: 0.97 }

/* ---------- people ---------- */

export function Avatar({ size = 30, label }: { size?: number; label?: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: tiny local asset; a plain img keeps the app portable
    <img
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      className={s.avatar}
      decoding="async"
      height={size}
      src="/pool/maria-128.webp"
      srcSet="/pool/maria-128.webp 1x, /pool/maria-256.webp 2x"
      width={size}
    />
  )
}

/** One of Maria's messages: her avatar and a dark glass bubble. */
export function Say({ children, fault }: { children: ReactNode; fault?: boolean }) {
  return (
    <div className={s.mRow}>
      <Avatar size={26} />
      <div className={cx(s.bubbleM, fault && s.bubbleFault)} role={fault ? 'alert' : undefined}>
        {children}
      </div>
    </div>
  )
}

export function You({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return <div className={cx(s.you, mono && s.youMono)}>{children}</div>
}

export function Typing({ label = 'Maria is working' }: { label?: string }) {
  const reduce = useReducedMotion()
  return (
    <div aria-label={label} className={s.mRow} role="status">
      <Avatar size={26} />
      <div className={s.bubbleM}>
        <span className={s.typing}>
          {[0, 1, 2].map(i => (
            <motion.span
              animate={reduce ? { opacity: 0.8 } : { opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
              key={i}
              transition={reduce ? undefined : { duration: 1, repeat: Number.POSITIVE_INFINITY, delay: i * 0.16, ease: 'easeInOut' }}
            />
          ))}
        </span>
      </div>
    </div>
  )
}

/* ---------- controls ---------- */

export type ChipOpt = { value: string; label: string; primary?: boolean; mono?: boolean }

export function Chips({ options, onPick, label }: { options: ChipOpt[]; onPick: (v: string) => void; label: string }) {
  return (
    <div aria-label={label} className={s.chips} role="group">
      {options.map(o => (
        <motion.button className={cx(s.chip, o.primary && s.chipPrimary, o.mono && s.chipMono)} key={o.value} onClick={() => onPick(o.value)} transition={SPRING} type="button" whileTap={PRESS}>
          {o.label}
        </motion.button>
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

/** A terminal block with a copy button that confirms. */
export function Command({ text, label = 'command', shell = 'Terminal' }: { text: string; label?: string; shell?: string }) {
  const { done, copy } = useCopy()
  return (
    <div className={s.term}>
      <div className={s.termBar}>
        <span className={s.termLabel}>
          <Terminal aria-hidden size={13} />
          {shell}
        </span>
        <motion.button aria-label={done ? 'Copied' : `Copy ${label}`} className={cx(s.copy, done && s.copied)} onClick={() => copy('c', text)} type="button" whileTap={PRESS}>
          {done ? <Check aria-hidden size={13} strokeWidth={2.5} /> : <Copy aria-hidden size={13} />}
          {done ? 'Copied' : 'Copy'}
        </motion.button>
      </div>
      <pre className={s.termBody}>
        <span aria-hidden className={s.prompt}>
          ${' '}
        </span>
        {text}
      </pre>
    </div>
  )
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const { done, copy } = useCopy()
  return (
    <motion.button aria-label={done ? `${label} copied` : `Copy ${label}`} className={s.iconBtn} onClick={() => copy('v', text)} type="button" whileTap={PRESS}>
      {done ? <Check aria-hidden size={16} strokeWidth={2.5} /> : <Copy aria-hidden size={16} />}
    </motion.button>
  )
}

/* ---------- result cards ---------- */

function StatusGlyph({ tone, icon }: { tone: string; icon: ReactNode }) {
  return (
    <span aria-hidden className={s.status} style={{ background: `${tone}24`, color: tone, boxShadow: `inset 0 0 0 1px ${tone}55` }}>
      {icon}
    </span>
  )
}

const verdictIcon = (v: Verdict) =>
  v === 'Golden' ? <Crown size={16} strokeWidth={2.2} /> : v === 'Good' || v === 'Works' ? <Check size={16} strokeWidth={2.6} /> : v === 'Skip' ? <X size={16} strokeWidth={2.6} /> : <CircleHelp size={16} strokeWidth={2.2} />
export const severityIcon = (v: Severity) => (v === 'fine' ? <Check size={16} strokeWidth={2.6} /> : v === 'check' ? <Minus size={16} strokeWidth={2.8} /> : <X size={16} strokeWidth={2.6} />)

export function Sources({ ids }: { ids?: SourceId[] }) {
  if (!ids?.length) return null
  return (
    <p className={s.src}>
      Source:{' '}
      {ids.map((id, i) => {
        const x = SOURCES[id]
        return (
          <span key={id}>
            {i > 0 && '; '}
            {x.url ? (
              <a href={x.url} rel="noopener noreferrer" target={x.url.startsWith('http') ? '_blank' : undefined}>
                {x.label}
              </a>
            ) : (
              x.label
            )}
            , {x.date}
          </span>
        )
      })}
    </p>
  )
}

export function Specs({ rows }: { rows?: [string, string][] }) {
  if (!rows?.length) return null
  return (
    <dl className={s.specs}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function StatusCard({ title, tone, label, icon, children }: { title: string; tone: string; label: string; icon: ReactNode; children?: ReactNode }) {
  return (
    <article className={s.card}>
      <div className={s.vHead}>
        <StatusGlyph icon={icon} tone={tone} />
        <div>
          <h3 className={s.vTitle}>{title}</h3>
          <span className={s.vLabel} style={{ color: tone }}>
            {label}
          </span>
        </div>
      </div>
      {children}
    </article>
  )
}

export function VerdictCard({ c }: { c: HwCard }) {
  const tone = verdictTone(c.verdict)
  return (
    <StatusCard icon={verdictIcon(c.verdict)} label={VERDICT_LABEL[c.verdict]} title={c.title} tone={tone}>
      <Specs rows={c.specs} />
      <ul className={s.why}>
        {c.reasons.map(r => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <Sources ids={c.sources} />
    </StatusCard>
  )
}

/** Inset grouped list, like Settings. */
export function Group({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section>
      {label && <h3 className={s.groupLabel}>{label}</h3>}
      <ul className={s.group}>{children}</ul>
    </section>
  )
}

export function Checklist({ items }: { items: { title: string; body?: string; command?: string }[] }) {
  const [on, setOn] = useState<Record<number, boolean>>({})
  const base = useId()
  return (
    <>
      {items.map((c, i) => (
        <li className={cx(s.row, s.rowIndent)} key={c.title} style={{ alignItems: 'flex-start' }}>
          <input checked={!!on[i]} className={s.tick} id={`${base}-${i}`} onChange={e => setOn(o => ({ ...o, [i]: e.target.checked }))} type="checkbox" />
          <div className={s.rowMain}>
            <label className={cx(s.rowTitle, on[i] && s.rowDone)} htmlFor={`${base}-${i}`} style={{ cursor: 'pointer' }}>
              {c.title}
            </label>
            {c.body && <p className={s.rowBody}>{c.body}</p>}
            {c.command && <Command label={c.title} text={c.command} />}
          </div>
        </li>
      ))}
    </>
  )
}

/** Result cards arrive one after another. */
export function Reveal({ children }: { children: ReactNode[] }) {
  const reduce = useReducedMotion()
  return (
    <div className={s.cards}>
      {children.map((child, i) => (
        <motion.div
          animate={{ opacity: 1, y: 0, scale: 1 }}
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14, scale: 0.985 }}
          // biome-ignore lint/suspicious/noArrayIndexKey: the list is fixed once shown
          key={i}
          transition={reduce ? { duration: 0 } : { ...SPRING, delay: 0.06 * i }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}

/* ---------- input ---------- */

/** The floating glass capsule. Enter sends; logs (newlines) keep Enter for a new line. */
export function Field({
  placeholder,
  onSubmit,
  multiline,
  mono,
  initial = '',
  label,
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
  inputMode?: 'numeric' | 'text'
  autoFocus?: boolean
  maxLength?: number
  rows?: number
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
    className: cx(s.input, mono && s.inputMono),
    placeholder,
    value: v,
    maxLength,
    autoComplete: 'off',
    spellCheck: false,
    onChange: (e: { target: { value: string } }) => setV(e.target.value),
  }
  return (
    <form
      className={s.capsule}
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
      <motion.button aria-label="Send" className={s.send} disabled={!v.trim()} type="submit" whileTap={PRESS}>
        <ArrowUp aria-hidden size={18} strokeWidth={2.5} />
      </motion.button>
    </form>
  )
}

/** Very small renderer for Maria's AI answers: paragraphs, `code`, ```blocks```, **bold**. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/```[a-zA-Z]*\n?/)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: parts of one immutable string
          <Command key={i} text={p.replace(/\n$/, '')} />
        ) : (
          p
            .split(/\n{2,}/)
            .filter(x => x.trim())
            // biome-ignore lint/suspicious/noArrayIndexKey: parts of one immutable string
            .map((para, j) => <p key={`${i}-${j}`}>{inline(para.replace(/^\n+|\n+$/g, ''))}</p>)
        ),
      )}
    </>
  )
}

function inline(t: string): ReactNode[] {
  return t.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((x, i) => {
    // biome-ignore lint/suspicious/noArrayIndexKey: parts of one immutable string
    if (x.startsWith('`') && x.endsWith('`') && x.length > 2) return <code key={i}>{x.slice(1, -1)}</code>
    // biome-ignore lint/suspicious/noArrayIndexKey: parts of one immutable string
    if (x.startsWith('**') && x.endsWith('**') && x.length > 4) return <strong key={i}>{x.slice(2, -2)}</strong>
    return x
  })
}
