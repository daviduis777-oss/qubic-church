'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, RotateCcw } from 'lucide-react'
import { createContext, type ReactNode, type RefObject, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { RingMode } from './Ring'
import { type ChipOpt, Chips, cx, Field, PRESS, Say, TONE, Typing } from './ui'
import s from './maria.module.css'

export type Answers = Record<string, string>
export type Checked = { ok: true; value: string } | { ok: false; error: string }

export type StepDef = {
  id: string
  ask: (a: Answers) => ReactNode
  when?: (a: Answers) => boolean
  chips?: (a: Answers) => ChipOpt[]
  text?: {
    label: string
    placeholder: string
    multiline?: boolean
    rows?: number
    newlines?: boolean
    mono?: boolean
    numeric?: boolean
    maxLength?: number
    /** a ready-made answer shown as a chip above the field */
    suggest?: (a: Answers) => string | undefined
    validate?: (v: string, a: Answers) => Checked
  }
  /** how the user's answer is echoed in the thread (default: the chip label or the text) */
  echo?: (v: string, a: Answers) => string
  monoEcho?: boolean
}

export type Outcome = { lead: ReactNode; cards: ReactNode[]; tone: string; chips?: ChipOpt[]; onChip?: (v: string) => void }

type RingState = { mode: RingMode; tone: string }
type RingApi = { think: () => void; settle: (tone: string) => void; idle: () => void; state: RingState }
export const RingContext = createContext<RingApi>({ think: () => {}, settle: () => {}, idle: () => {}, state: { mode: 'idle', tone: TONE.gold } })
export const useRing = () => useContext(RingContext)

/** Keep the newest message in view. */
export function useStickToBottom(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [dep])
  return ref
}

/** Her avatar in the nav bar carries the ring's state: a glow while she works, the verdict colour after. */
function NavPresence() {
  const { state } = useRing()
  const reduce = useReducedMotion()
  const tone = state.mode === 'thinking' ? TONE.cyan : state.mode === 'settled' ? state.tone : TONE.gold
  return (
    <motion.span
      animate={state.mode === 'thinking' && !reduce ? { boxShadow: [`0 0 0 1px ${tone}`, `0 0 0 1px ${tone}, 0 0 14px 2px ${tone}88`, `0 0 0 1px ${tone}`] } : { boxShadow: `0 0 0 1px ${tone}` }}
      style={{ borderRadius: '50%', display: 'block', lineHeight: 0 }}
      transition={state.mode === 'thinking' && !reduce ? { duration: 1.4, repeat: Number.POSITIVE_INFINITY } : { duration: 0.3 }}
    >
      {/* biome-ignore lint/performance/noImgElement: tiny local asset */}
      <img alt="" height={30} src="/pool/maria-128.webp" srcSet="/pool/maria-128.webp 1x, /pool/maria-256.webp 2x" style={{ borderRadius: '50%', display: 'block', objectFit: 'cover' }} width={30} />
    </motion.span>
  )
}

/** An app screen: translucent nav bar, an iOS large title that collapses on scroll, the content, and a dock. */
export function Screen({ title, sub, onBack, onRestart, scrollRef, children, dock }: { title: string; sub?: string; onBack: () => void; onRestart?: () => void; scrollRef: RefObject<HTMLDivElement | null>; children: ReactNode; dock: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <>
      <header className={cx(s.nav, collapsed && s.navCollapsed)}>
        <div className={s.navRow}>
          <motion.button aria-label="Back to home" className={s.back} onClick={onBack} type="button" whileTap={PRESS}>
            <ChevronLeft aria-hidden size={26} strokeWidth={2.2} style={{ marginLeft: -4 }} />
            Home
          </motion.button>
          <div className={s.navCenter}>
            <NavPresence />
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
              <span className={s.navWord}>Maria</span>
              <motion.span animate={{ opacity: collapsed ? 1 : 0, height: collapsed ? 'auto' : 0 }} aria-hidden={!collapsed} className={s.navSmall} initial={false} transition={{ duration: 0.18 }}>
                {title}
              </motion.span>
            </span>
          </div>
          {onRestart ? (
            <motion.button aria-label="Start over" className={s.navAction} onClick={onRestart} type="button" whileTap={PRESS}>
              <RotateCcw aria-hidden size={19} strokeWidth={2.2} />
            </motion.button>
          ) : (
            <span />
          )}
        </div>
      </header>
      <div className={s.scroll} onScroll={e => setCollapsed(e.currentTarget.scrollTop > 34)} ref={scrollRef}>
        <h2 className={s.largeTitle}>{title}</h2>
        {sub && <p className={s.largeSub}>{sub}</p>}
        <div aria-live="polite" className={s.thread}>
          {children}
        </div>
      </div>
      <div className={s.dock}>{dock}</div>
    </>
  )
}

/**
 * A conversation driven by a list of questions. The thread is derived from the answers,
 * so tapping an earlier answer rewinds to that question.
 */
export function Flow({
  title,
  sub,
  steps,
  intro,
  initial,
  outcome,
  onAnswers,
  onBack,
}: {
  title: string
  sub?: string
  steps: StepDef[]
  intro?: ReactNode
  initial?: Answers
  outcome: (a: Answers) => Outcome
  onAnswers?: (a: Answers) => void
  onBack: () => void
}) {
  const [order, setOrder] = useState<[string, string][]>(() => Object.entries(initial ?? {}))
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const ring = useRing()
  const answers = useMemo(() => Object.fromEntries(order) as Answers, [order])

  const active = steps.filter(st => !st.when || st.when(answers))
  const current = active.find(st => !(st.id in answers))
  const done = !current

  useEffect(() => {
    if (!done) {
      ring.idle()
      return
    }
    setPending(true)
    ring.think()
    const t = setTimeout(() => {
      setPending(false)
      ring.settle(outcome(answers).tone)
    }, 450)
    return () => clearTimeout(t)
    // biome-ignore lint/correctness/useExhaustiveDependencies: run once per completed answer set
  }, [done, answers])

  useEffect(() => {
    onAnswers?.(answers)
  }, [answers, onAnswers])

  const answer = (st: StepDef, v: string) => {
    setError('')
    setOrder(o => [...o.filter(([k]) => k !== st.id), [st.id, v]])
  }
  const rewind = (id: string) => {
    setError('')
    setOrder(o => o.slice(0, o.findIndex(([k]) => k === id)))
  }

  const result = done && !pending ? outcome(answers) : null
  const scroller = useStickToBottom(`${order.length}-${pending}-${error}`)
  const resultRef = useRef<HTMLDivElement>(null)
  const hasResult = Boolean(result)
  // A result is read from its first line, not its last.
  useEffect(() => {
    const el = scroller.current
    const r = resultRef.current
    if (hasResult && el && r) el.scrollTop = Math.max(0, r.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - 96)
  }, [hasResult, scroller])

  const label = (st: StepDef, v: string) => st.echo?.(v, answers) ?? st.chips?.(answers).find(c => c.value === v)?.label ?? v

  const dock = (
    <>
      {current?.chips && <Chips label="Answers" onPick={v => answer(current, v)} options={current.chips(answers)} />}
      {current?.text && <TextStep a={answers} hasChips={Boolean(current.chips)} key={current.id} onError={setError} onValue={v => answer(current, v)} st={current} />}
      {result?.chips && <Chips label="Next" onPick={v => (v === '__restart' ? setOrder([]) : result.onChip?.(v))} options={result.chips} />}
      {done && pending && <div style={{ height: 36 }} />}
    </>
  )

  return (
    <Screen dock={dock} onBack={onBack} onRestart={order.length ? () => setOrder([]) : undefined} scrollRef={scroller} sub={sub} title={title}>
      {intro && <Say>{intro}</Say>}
      {active
        .filter(st => st.id in answers)
        .map(st => (
          <div className={s.thread} key={st.id}>
            <Say>{st.ask(answers)}</Say>
            <motion.button aria-label={`Change answer: ${label(st, answers[st.id] ?? '')}`} className={cx(s.you, st.monoEcho && s.youMono)} onClick={() => rewind(st.id)} title="Change this answer" type="button" whileTap={PRESS}>
              {label(st, answers[st.id] ?? '')}
            </motion.button>
          </div>
        ))}
      {current && <Say>{current.ask(answers)}</Say>}
      {error && <Say fault>{error}</Say>}
      {pending && <Typing />}
      {result && (
        <div className={s.thread} ref={resultRef}>
          <Say>{result.lead}</Say>
          {result.cards}
        </div>
      )}
    </Screen>
  )
}

function TextStep({ st, a, onValue, onError, hasChips }: { st: StepDef; a: Answers; onValue: (v: string) => void; onError: (e: string) => void; hasChips: boolean }) {
  // biome-ignore lint/style/noNonNullAssertion: only rendered for steps with text
  const t = st.text!
  const sug = t.suggest?.(a)
  const ring = useRing()
  // A refusal is a verdict: it shows in the thread and the presence turns coral.
  const submit = (raw: string) => {
    const r = t.validate ? t.validate(raw, a) : ({ ok: true, value: raw.trim() } as Checked)
    if (!r.ok) {
      onError(r.error)
      ring.settle(TONE.coral)
      return
    }
    ring.idle()
    onValue(r.value)
  }
  return (
    <div style={hasChips ? { marginTop: 8 } : undefined}>
      {sug && <Chips label="Suggestion" onPick={() => submit(sug)} options={[{ value: sug, label: `Use ${sug}`, mono: true }]} />}
      <div style={sug ? { marginTop: 8 } : undefined}>
        <Field inputMode={t.numeric ? 'numeric' : 'text'} label={t.label} maxLength={t.maxLength} mono={t.mono} multiline={t.multiline} newlines={t.newlines} onSubmit={submit} placeholder={t.placeholder} rows={t.rows} />
      </div>
    </div>
  )
}

export function restartChip(label = 'Start over'): ChipOpt {
  return { value: '__restart', label }
}
