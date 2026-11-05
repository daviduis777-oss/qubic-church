'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { LEDGER, MEASURE } from '@/lib/pool/config'
import { epochAt } from '@/lib/pool/epoch'
import {
  entryParts,
  GENESIS,
  type PublicEntry,
  shortHash,
  type WorkerRecord,
} from '@/lib/pool/ledger-view'
import type { MyRig, RigReading } from '@/lib/pool/rig'
import { Chips, cx } from './ui'
import { Seal } from './seal'
import s from './maria.module.css'
import r from './rig.module.css'

/* ---------------- one journal line ---------------- */

export function JournalLine({ e, fresh }: { e: PublicEntry; fresh?: boolean }) {
  const [ep, what, who, src] = entryParts(e)
  // the separators are for reading aloud and copying; the grid lays the line out on screen
  return (
    <li className={cx(r.jLine, fresh && r.jFresh)}>
      <span className={r.jEp}>{ep}</span>
      <span className={r.jWhat}>
        <span className={s.srOnly}> · </span>
        {what}
      </span>
      <span className={r.jWho}>
        <span className={s.srOnly}> · </span>
        {who}
      </span>
      <span className={cx(r.jSrc, e.source === 'pool' && r.jSrcPool, e.source === 'self-reported' && r.jSrcSelf)}>
        <span className={s.srOnly}> · </span>
        {src}
      </span>
    </li>
  )
}

/* ---------------- a demo rig's record: sample lines, labelled ---------------- */

function demoRecord(rig: MyRig, reading: RigReading | null): WorkerRecord {
  const cur = epochAt().epoch
  const show = rig.worker
  const hw = rig.gpu
    ? `${(rig.gpuCount ?? 1) > 1 ? `${rig.gpuCount}× ` : ''}${rig.gpu}`
    : (rig.cpu ?? '')
  const e = (
    seq: number,
    epoch: number,
    kind: PublicEntry['kind'],
    value: number,
    source: PublicEntry['source'],
    hwx = hw
  ): PublicEntry => ({
    seq,
    epoch,
    show,
    hw: hwx,
    kind,
    value,
    unit:
      kind === 'solutions'
        ? 'solutions'
        : kind === 'diagnosis-saved'
          ? 'result'
          : 'h',
    source,
    at: 0,
    hash: `demo${seq}`.padEnd(64, '0'),
  })
  const sol = Math.max(1, Math.round(reading?.solutions ?? 1400))
  const up = Math.round(((reading?.uptimeMin ?? 300) / 60) * 10) / 10
  const entries = [
    ...(reading?.solutions ? [e(6, cur, 'solutions', sol, 'log')] : []),
    ...(up >= MEASURE.minWindowMin / 60
      ? [e(5, cur, 'rig-online-hours', up, 'log')]
      : []),
    e(4, cur - 1, 'rental-hours', 12, 'self-reported', '7× RTX 5080'),
    e(3, cur - 1, 'diagnosis-saved', 1, 'log'),
    e(2, cur - 2, 'solutions', Math.round(sol * 0.8), 'log'),
  ]
  return {
    show,
    entries,
    epochs: [],
    total: entries.length,
    head: 'demo'.padEnd(64, '0'),
  }
}

/* ---------------- the card ---------------- */

type Phase = 'idle' | 'sending' | 'rent'

/**
 * Record: every contribution this rig made through the pool, one line each, newest first. What gets
 * written: this log's numbers (from log), or hours rented (self-reported). Nothing explains why.
 */
export function RecordCard({
  rig,
  reading,
  demo,
  canRecord,
}: {
  rig: MyRig
  reading: RigReading | null
  demo: boolean
  canRecord: boolean
}) {
  const [live, setLive] = useState<WorkerRecord | null | undefined>(undefined)
  const [phase, setPhase] = useState<Phase>('idle')
  const [msg, setMsg] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(
    null
  )
  const [newSeqs, setNewSeqs] = useState<number[]>([])
  const [stamp, setStamp] = useState(0)
  const reduce = useReducedMotion()

  const sample = useMemo(
    () => (demo ? demoRecord(rig, reading) : null),
    [demo, rig, reading]
  )
  const rec = demo ? sample : live

  useEffect(() => {
    if (demo) return
    const ac = new AbortController()
    setLive(undefined)
    fetch(`/api/pool/ledger?worker=${encodeURIComponent(rig.worker)}`, {
      cache: 'no-store',
      signal: ac.signal,
    })
      .then(x =>
        x.ok ? (x.json() as Promise<{ record: WorkerRecord | null }>) : null
      )
      .then(j => setLive(j ? j.record : null))
      .catch(() => {
        if (!ac.signal.aborted) setLive(null)
      })
    return () => ac.abort()
  }, [demo, rig.worker])

  const post = useCallback(
    async (body: Record<string, unknown>) => {
      setPhase('sending')
      setMsg(null)
      try {
        const res = await fetch('/api/pool/ledger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ worker: rig.worker, ...body }),
        })
        const j = (await res.json().catch(() => ({}))) as {
          ok?: boolean
          error?: string
          entries?: PublicEntry[]
          record?: WorkerRecord | null
        }
        if (!res.ok || !j.ok) {
          setMsg({
            tone: res.status === 409 ? 'ok' : 'warn',
            text: j.error ?? `Not recorded (${res.status}).`,
          })
          setPhase(body.type === 'rental' ? 'rent' : 'idle')
          return
        }
        if (j.record) setLive(j.record)
        setNewSeqs((j.entries ?? []).map(e => e.seq))
        setStamp(t => t + 1)
        setMsg({ tone: 'ok', text: 'Recorded.' })
        setPhase('idle')
      } catch {
        setMsg({
          tone: 'warn',
          text: 'Not recorded: the connection failed. Try again.',
        })
        setPhase(body.type === 'rental' ? 'rent' : 'idle')
      }
    },
    [rig.worker]
  )

  const recordLog = () => {
    if (!reading) return
    void post({
      type: 'log',
      epoch: reading.epoch,
      solutions: reading.solutions,
      uptimeMin: reading.uptimeMin,
      gpu: reading.hw.gpu ?? undefined,
      gpuCount: reading.hw.gpu ? reading.hw.gpuCount : undefined,
      cpu: reading.hw.cpu,
    })
  }

  const entries = rec?.entries ?? []
  const eps = entries.map(e => e.epoch)
  const first = eps.length ? Math.min(...eps) : undefined
  const last = eps.length ? Math.max(...eps) : undefined
  // this log's numbers are already written: no second button for the same thing
  const logInRecord =
    !!reading &&
    entries.some(
      e =>
        e.epoch === reading.epoch &&
        ((e.kind === 'solutions' && e.value === reading.solutions) ||
          (e.kind === 'rig-online-hours' &&
            reading.uptimeMin !== undefined &&
            e.value === Math.round((reading.uptimeMin / 60) * 10) / 10))
    )
  const offerLog = canRecord && !logInRecord
  return (
    <section aria-labelledby={`rec-${rig.worker}`} className={r.record}>
      <div className={r.recordHead}>
        <motion.span
          animate={
            stamp && !reduce
              ? { scale: [0.6, 1.12, 1], rotate: [-18, 4, 0] }
              : undefined
          }
          className={r.recordSeal}
          key={stamp}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <Seal dim={!entries.length} size={36} />
        </motion.span>
        <div className={r.recordTitles}>
          {/* the serif rides on a span: the site's global heading rule forces its own face on every h3 */}
          <h3 className={r.recordH} id={`rec-${rig.worker}`}>
            <span className={r.recordTitle}>Record</span>
          </h3>
          <p className={r.recordSub}>
            {rec === undefined
              ? 'Reading the record'
              : rec && entries.length
                ? `${demo ? 'Sample' : 'Recorded'} · ${rec.total} entr${rec.total === 1 ? 'y' : 'ies'} · ${first === last ? `E${last}` : `E${first} to E${last}`}`
                : 'Nothing recorded yet'}
          </p>
        </div>
        {demo && <span className={cx(r.src, r.srcDemo)}>sample</span>}
      </div>

      {entries.length > 0 && (
        <ol aria-label="Journal, newest first" className={r.journal}>
          {entries.map(e => (
            <JournalLine e={e} fresh={newSeqs.includes(e.seq)} key={e.seq} />
          ))}
        </ol>
      )}

      {rec !== undefined && !entries.length && !demo && (
        <p className={r.recordEmpty}>
          {offerLog
            ? "Record this log's numbers, or the hours you rented."
            : 'Paste a log from this epoch to record it, or add the hours you rented.'}
        </p>
      )}

      {entries.length > 0 && rec && rec.head !== GENESIS && (
        <p className={r.recordChain}>
          <span>chain</span>
          <span className={r.mono}>
            {demo ? 'sample' : shortHash(rec.head, 8)}
          </span>
        </p>
      )}

      {!demo && phase === 'rent' && (
        <RentForm
          onCancel={() => setPhase('idle')}
          onSend={b => void post({ type: 'rental', ...b })}
          rig={rig}
        />
      )}

      {!demo && phase !== 'rent' && (
        <div className={r.recordActions}>
          <Chips
            label="Record"
            onPick={v => (v === 'log' ? recordLog() : setPhase('rent'))}
            options={[
              ...(offerLog
                ? [
                    {
                      value: 'log',
                      label:
                        phase === 'sending' ? 'Recording' : 'Record this log',
                      primary: true,
                    },
                  ]
                : []),
              { value: 'rent', label: 'Add rented hours' },
            ]}
          />
        </div>
      )}
      <p
        aria-live="polite"
        className={cx(r.recordMsg, msg?.tone === 'warn' && r.recordMsgWarn)}
      >
        {msg?.text ?? ''}
      </p>
    </section>
  )
}

/* ---------------- I rented X for N hours ---------------- */

function RentForm({
  rig,
  onSend,
  onCancel,
}: {
  rig: MyRig
  onSend: (b: {
    gpu?: string
    gpuCount?: number
    cpu?: string
    hours: number
    epoch: number
  }) => void
  onCancel: () => void
}) {
  const cur = epochAt().epoch
  const [gpu, setGpu] = useState(rig.gpu ?? '')
  const [cards, setCards] = useState(rig.gpu ? String(rig.gpuCount ?? 1) : '')
  const [cpu, setCpu] = useState(rig.gpu ? '' : (rig.cpu ?? ''))
  const [hours, setHours] = useState('')
  const [epoch, setEpoch] = useState(cur)
  const [err, setErr] = useState('')
  const num = (v: string) =>
    v.trim() === '' ? undefined : Number(v.replace(',', '.'))
  const edit = (set: (v: string) => void, v: string) => {
    setErr('')
    set(v)
  }
  const send = () => {
    const h = num(hours)
    if (h === undefined || !(h > 0 && h <= LEDGER.maxHours))
      return setErr(`Hours: a number up to ${LEDGER.maxHours}, one epoch.`)
    if (!gpu.trim() && !cpu.trim())
      return setErr('Say what you rented: a GPU model, or a CPU.')
    const c = num(cards)
    if (
      gpu.trim() &&
      c !== undefined &&
      !(Number.isInteger(c) && c >= 1 && c <= LEDGER.maxCards)
    )
      return setErr(`Cards: a whole number from 1 to ${LEDGER.maxCards}.`)
    onSend({
      gpu: gpu.trim() || undefined,
      gpuCount: gpu.trim() ? (c ?? 1) : undefined,
      cpu: cpu.trim() || undefined,
      hours: h,
      epoch,
    })
  }
  return (
    <form
      aria-label="Add rented hours"
      className={r.rent}
      onSubmit={e => {
        e.preventDefault()
        send()
      }}
    >
      <p className={r.rentLead}>I rented</p>
      <div className={s.fGrid}>
        <label className={s.fField}>
          <span className={s.fLabel}>GPU model</span>
          <input
            autoComplete="off"
            className={s.fInput}
            maxLength={40}
            onChange={e => edit(setGpu, e.target.value)}
            placeholder="RTX 5080"
            spellCheck={false}
            value={gpu}
          />
        </label>
        <label className={s.fField}>
          <span className={s.fLabel}>Cards</span>
          <input
            autoComplete="off"
            className={s.fInput}
            inputMode="numeric"
            maxLength={3}
            onChange={e => edit(setCards, e.target.value)}
            placeholder="7"
            value={cards}
          />
        </label>
        <label className={cx(s.fField, s.fWide)}>
          <span className={s.fLabel}>Or a CPU</span>
          <input
            autoComplete="off"
            className={s.fInput}
            maxLength={40}
            onChange={e => edit(setCpu, e.target.value)}
            placeholder="EPYC 9534"
            spellCheck={false}
            value={cpu}
          />
        </label>
        <label className={s.fField}>
          <span className={s.fLabel}>For (hours)</span>
          <input
            autoComplete="off"
            className={s.fInput}
            inputMode="decimal"
            maxLength={6}
            onChange={e => edit(setHours, e.target.value)}
            placeholder="12"
            value={hours}
          />
        </label>
        <div className={s.fField}>
          <span className={s.fLabel}>In</span>
          <div className={r.seg} role="radiogroup" aria-label="Epoch">
            {[cur, cur - 1].map(ep => (
              <label className={cx(r.segBtn, epoch === ep && r.segOn)} key={ep}>
                <input
                  checked={epoch === ep}
                  className={s.srOnly}
                  name="rent-epoch"
                  onChange={() => setEpoch(ep)}
                  type="radio"
                />
                E{ep}
              </label>
            ))}
          </div>
        </div>
      </div>
      <p className={r.rentNote}>
        Self-reported, and labelled that way in the record.
      </p>
      {err && (
        <p className={s.warn} role="alert">
          {err}
        </p>
      )}
      <div className={r.recordActions}>
        <Chips
          label="Record or cancel"
          onPick={v => (v === 'save' ? send() : onCancel())}
          options={[
            { value: 'save', label: 'Record', primary: true },
            { value: 'cancel', label: 'Cancel' },
          ]}
        />
      </div>
    </form>
  )
}
