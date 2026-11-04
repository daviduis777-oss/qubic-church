'use client'

import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { type ChipOpt, Chips, Field, Say, TONE } from './ui'
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

export type Outcome = { body: ReactNode; tone: string; chips?: ChipOpt[]; onChip?: (v: string) => void }

type RingApi = { think: () => void; settle: (tone: string) => void; idle: () => void }
export const RingContext = createContext<RingApi>({ think: () => {}, settle: () => {}, idle: () => {} })
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

/**
 * A conversation driven by a list of questions. The thread is derived from the answers,
 * so tapping an earlier answer rewinds to that question.
 */
export function Flow({ steps, intro, initial, outcome, onAnswers }: { steps: StepDef[]; intro?: ReactNode; initial?: Answers; outcome: (a: Answers) => Outcome; onAnswers?: (a: Answers) => void }) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (hasResult && el && r) el.scrollTop = Math.max(0, r.offsetTop - el.offsetTop - 12)
  }, [hasResult, scroller])

  const label = (st: StepDef, v: string) => st.echo?.(v, answers) ?? st.chips?.(answers).find(c => c.value === v)?.label ?? v

  return (
    <>
      <div aria-live="polite" className={s.thread} ref={scroller}>
        {intro && <Say>{intro}</Say>}
        {active
          .filter(st => st.id in answers)
          .map(st => (
            <div className={s.stack} key={st.id} style={{ gap: 12 }}>
              <Say>{st.ask(answers)}</Say>
              <button aria-label={`Change answer: ${label(st, answers[st.id]!)}`} className={s.you} onClick={() => rewind(st.id)} style={{ border: 0, font: 'inherit', textAlign: 'left', cursor: 'pointer' }} title="Change this answer" type="button">
                <span className={st.monoEcho ? s.youMono : undefined}>{label(st, answers[st.id]!)}</span>
              </button>
            </div>
          ))}
        {current && <Say>{current.ask(answers)}</Say>}
        {error && <Say fault>{error}</Say>}
        {pending && (
          <div aria-label="Maria is working" className={s.typing} role="status">
            <span />
            <span />
            <span />
          </div>
        )}
        {result && <div ref={resultRef}>{result.body}</div>}
      </div>

      <div className={s.dock}>
        {current?.chips && <Chips label="Answers" onPick={v => answer(current, v)} options={current.chips(answers)} />}
        {current?.text && (
          <TextStep
            key={current.id}
            onError={setError}
            onValue={v => answer(current, v)}
            st={current}
            a={answers}
            hasChips={Boolean(current.chips)}
          />
        )}
        {result?.chips && <Chips label="Next" onPick={v => (v === '__restart' ? setOrder([]) : result.onChip?.(v))} options={result.chips} />}
        {done && !result?.chips && pending && <div style={{ height: 38 }} />}
      </div>
    </>
  )
}

function TextStep({ st, a, onValue, onError, hasChips }: { st: StepDef; a: Answers; onValue: (v: string) => void; onError: (e: string) => void; hasChips: boolean }) {
  const t = st.text!
  const sug = t.suggest?.(a)
  const ring = useRing()
  // A refusal is a verdict: it shows in the thread and the ring turns coral.
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
