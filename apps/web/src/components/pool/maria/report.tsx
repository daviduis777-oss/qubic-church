'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUp, Check, ImagePlus, LoaderCircle, ShieldAlert, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { containsAddress, hadSeed } from '@/lib/pool/redact'
import { contextLine, REPORT, REPORT_TYPES, REPORT_WARNING, type ReportContext, type ReportType, redactReport } from '@/lib/pool/report'
import { kb, type Shot, shrink } from '@/lib/pool/shrink-image'
import { type Answers, Screen, useRing } from './flow'
import type { Go } from './flows'
import { Halo } from './Halo'
import { Chips, cx, PRESS, SPRING, Say, TONE } from './ui'
import s from './maria.module.css'
import r from './report.module.css'

/** iOS segmented control: native radios (arrow keys move), a gold thumb that slides to the choice. */
function Segmented({ value, onChange }: { value: ReportType; onChange: (v: ReportType) => void }) {
  const name = useId()
  const reduce = useReducedMotion()
  return (
    <div aria-label="Kind of report" className={r.seg} role="radiogroup">
      {REPORT_TYPES.map(t => (
        <label className={cx(r.segItem, value === t.id && r.segOn)} key={t.id}>
          <input checked={value === t.id} className={r.segInput} name={name} onChange={() => onChange(t.id)} type="radio" value={t.id} />
          {value === t.id && <motion.span aria-hidden className={r.thumb} layoutId={`${name}thumb`} transition={reduce ? { duration: 0 } : SPRING} />}
          <span className={r.segLabel}>{t.label}</span>
        </label>
      ))}
    </div>
  )
}

/** Where the report was started, from the handoff: an app code and a step code. Never user text. */
function contextFrom(h?: Answers): ReportContext {
  const app = h?.from && /^[a-z]+$/.test(h.from) ? h.from : 'home'
  return h?.step ? { app, step: h.step } : { app }
}

/**
 * Report: a bug, an idea or an update, with an optional screenshot and a Discord handle. The text is
 * redacted here and again on the server; the screenshot is shrunk here and never leaves as the original.
 */
export function ReportApp({ go, from }: { go: Go; from?: Answers }) {
  const scroller = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const ring = useRing()
  const ctx = contextFrom(from)
  const [type, setType] = useState<ReportType>(from?.type === 'idea' || from?.type === 'update' ? from.type : 'bug')
  const [text, setText] = useState('')
  const [contact, setContact] = useState('')
  const [shot, setShot] = useState<Shot | null>(null)
  const [shotBusy, setShotBusy] = useState(false)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<'edit' | 'sending' | 'sent'>('edit')
  const [sent, setSent] = useState<{ id: string; seed: boolean } | null>(null)
  const kind = REPORT_TYPES.find(t => t.id === type) ?? (REPORT_TYPES[0] as (typeof REPORT_TYPES)[number])
  const ids = useId()
  const len = redactReport(text).text.length
  const ready = len >= REPORT.minText && len <= REPORT.maxText && !shotBusy && phase === 'edit'
  const secret = hadSeed(text) || containsAddress(text)

  const pick = async (f: File | undefined) => {
    if (!f) return
    setError('')
    setShotBusy(true)
    try {
      setShot(await shrink(f))
    } catch (e) {
      setShot(null)
      setError(e instanceof Error ? e.message : 'That picture could not be attached.')
    } finally {
      setShotBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const send = async () => {
    if (!ready) return
    setError('')
    setPhase('sending')
    ring.think()
    try {
      const res = await fetch('/api/pool/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // redacted here as well as on the server: a seed never travels, even over TLS
        body: JSON.stringify({ type, text: redactReport(text).text, contact: contact.trim() || undefined, ctx, image: shot?.dataUrl }),
      })
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; seed?: boolean; error?: string }
      if (!res.ok || !j.ok || !j.id) {
        setError(j.error ?? (res.status === 404 ? 'Reports are not open here yet.' : `The report could not be sent (${res.status}). Try again in a moment.`))
        setPhase('edit')
        ring.settle(TONE.coral)
        return
      }
      setSent({ id: j.id, seed: Boolean(j.seed) || hadSeed(text) })
      setPhase('sent')
      ring.settle(TONE.sage)
    } catch {
      setError('No connection. Check your network and send again.')
      setPhase('edit')
      ring.settle(TONE.coral)
    }
  }

  const again = () => {
    setText('')
    setShot(null)
    setSent(null)
    setError('')
    setPhase('edit')
    ring.idle()
  }

  if (phase === 'sent' && sent) {
    return (
      <Screen
        dock={
          <Chips
            label="Next"
            onPick={v => (v === 'home' ? go('home') : again())}
            options={[
              { value: 'home', label: 'Done', primary: true },
              { value: 'again', label: 'Send another' },
            ]}
          />
        }
        onBack={() => go('home')}
        scrollRef={scroller}
        title="Report"
      >
        <div className={s.haloSlot}>
          <Halo face={40} label="Report sent" mode={ring.state.mode} size={152} tone={ring.state.tone} />
        </div>
        <div className={r.done}>
          <p className={r.doneTitle}>Thank you.</p>
          <p className={r.doneLine}>Your {kind.label.toLowerCase()} report is in. QC reads every one.</p>
          <p className={r.ref}>
            Reference <code>{sent.id.toUpperCase()}</code>
          </p>
        </div>
        {sent.seed && (
          <Say fault>
            Your text had something that looks like a seed. It was removed before saving. If it is a real seed, move your funds to a new wallet now.
          </Say>
        )}
      </Screen>
    )
  }

  return (
    <Screen
      dock={
        <motion.button
          aria-disabled={!ready}
          className={cx(r.send, !ready && r.sendOff)}
          onClick={send}
          transition={SPRING}
          type="button"
          whileTap={ready ? PRESS : undefined}
        >
          {phase === 'sending' ? (
            <LoaderCircle aria-hidden className={r.spin} size={17} strokeWidth={2.4} />
          ) : (
            <ArrowUp aria-hidden size={17} strokeWidth={2.6} />
          )}
          {phase === 'sending' ? 'Sending' : 'Send report'}
        </motion.button>
      }
      onBack={() => go('home')}
      scrollRef={scroller}
      sub="A bug, an idea or an update. QC reads every one."
      title="Report"
    >
      <Segmented onChange={setType} value={type} />

      <label className={r.ask} htmlFor={`${ids}t`}>
        {kind.ask}
      </label>
      <div className={r.group}>
        <textarea
          className={r.text}
          id={`${ids}t`}
          maxLength={REPORT.maxText}
          onChange={e => setText(e.target.value)}
          placeholder={kind.placeholder}
          rows={6}
          value={text}
        />
        <div className={r.count} aria-live="polite">
          {len > 0 && len < REPORT.minText
            ? `${REPORT.minText - len} more to go`
            : len > REPORT.maxText * 0.8
              ? `${len.toLocaleString('en-US')} / ${REPORT.maxText.toLocaleString('en-US')}`
              : ''}
        </div>
        <div className={r.hair} />
        {shot ? (
          <div className={r.shot}>
            {/* biome-ignore lint/performance/noImgElement: a local data URL preview */}
            <img alt="Screenshot to attach" className={r.thumb2} height={52} src={shot.dataUrl} width={52} />
            <span className={r.shotMeta}>
              <span className={r.shotName}>Screenshot</span>
              <span className={r.shotSub}>
                {shot.w} × {shot.h} · {kb(shot.bytes)} · {shot.type.toUpperCase()}
              </span>
            </span>
            <motion.button aria-label="Remove screenshot" className={r.remove} onClick={() => setShot(null)} type="button" whileTap={PRESS}>
              <X aria-hidden size={15} strokeWidth={2.4} />
            </motion.button>
          </div>
        ) : (
          <button className={r.add} disabled={shotBusy} onClick={() => fileRef.current?.click()} type="button">
            {shotBusy ? <LoaderCircle aria-hidden className={r.spin} size={18} strokeWidth={2} /> : <ImagePlus aria-hidden size={18} strokeWidth={1.8} />}
            <span>{shotBusy ? 'Preparing the picture' : 'Add a screenshot'}</span>
            <span className={r.opt}>Optional</span>
          </button>
        )}
        <input
          accept="image/*"
          className={r.file}
          onChange={e => pick(e.target.files?.[0])}
          ref={fileRef}
          tabIndex={-1}
          type="file"
          aria-label="Screenshot file"
        />
      </div>
      <p className={r.warn}>
        <ShieldAlert aria-hidden size={16} strokeWidth={2} />
        {REPORT_WARNING}
      </p>

      <AnimatePresence initial={false}>
        {secret && (
          <motion.p animate={{ opacity: 1, height: 'auto' }} className={r.redact} exit={{ opacity: 0, height: 0 }} initial={{ opacity: 0, height: 0 }}>
            A seed or an address in your text is removed before it is sent. If you pasted a real seed anywhere, move your funds to a new wallet.
          </motion.p>
        )}
      </AnimatePresence>

      <label className={r.ask} htmlFor={`${ids}c`}>
        Discord, if you want a reply
      </label>
      <div className={r.group}>
        <input
          autoCapitalize="off"
          autoComplete="off"
          className={r.contact}
          id={`${ids}c`}
          maxLength={REPORT.maxContact}
          onChange={e => setContact(e.target.value)}
          placeholder="@yourname"
          spellCheck={false}
          type="text"
          value={contact}
        />
      </div>

      {error && <Say fault>{error}</Say>}

      <p className={r.foot}>
        <Check aria-hidden size={13} strokeWidth={2.4} />
        <span>Sent with where you started ({contextLine(ctx)}) and your device type. Never your IP address, a log or a wallet.</span>
      </p>
    </Screen>
  )
}
