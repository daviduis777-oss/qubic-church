'use client'

import { Gauge } from 'lucide-react'
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { type Comparison, compareRun, type Summary } from '@/lib/pool/aggregate'
import {
  type Backend,
  MEASURE,
  OS_LABEL,
  type Os,
  POOL,
} from '@/lib/pool/config'
import { epochAt } from '@/lib/pool/epoch'
import {
  costPerSolution,
  type Extracted,
  extractMetrics,
  fmtRate,
  fmtWindow,
  HOSTS,
  type MineMode,
  MODE_LABEL,
  modeFrom,
  normalizeCpu,
  normalizeGpu,
  partKey,
} from '@/lib/pool/measure'
import {
  Chips,
  cx,
  SEVERITY_LABEL,
  Specs,
  StatusCard,
  severityIcon,
  TONE,
  Tags,
} from './ui'
import s from './maria.module.css'

/* ---------------- the aggregates, fetched once per app ---------------- */

type Ctx = { summary: Summary | null; setSummary: (s: Summary) => void }
const MeasuredContext = createContext<Ctx>({
  summary: null,
  setSummary: () => {},
})
export const useMeasured = () => useContext(MeasuredContext)

/** Loads what our miners measure from the (gated) API. Without it every tool still works, just without the measured lines. */
export function MeasuredProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<Summary | null>(null)
  useEffect(() => {
    let live = true
    fetch('/api/pool/measure', { cache: 'no-store' })
      .then(r => (r.ok ? (r.json() as Promise<Summary>) : null))
      .then(j => {
        if (live && j && Array.isArray(j.rows)) setSummary(j)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])
  const value = useMemo(() => ({ summary, setSummary }), [summary])
  return (
    <MeasuredContext.Provider value={value}>
      {children}
    </MeasuredContext.Provider>
  )
}

/* ---------------- Fix my rig: numbers, comparison, save ---------------- */

type Form = {
  cpu: string
  gpu: string
  gpuCount: string
  mode: MineMode
  backend: Backend | ''
  os: Os | ''
  ramGb: string
  threads: string
  owner: 'own' | 'rented'
  host: string
  powerLimitW: string
  solutions: string
  hours: string
  uptimeH: string
  worker: string
  dailyCost: string
}

const h1 = (min?: number) =>
  min === undefined ? '' : String(Math.round((min / 60) * 10) / 10)
const n = (v: string) => (v.trim() === '' ? undefined : Number(v))

function formFrom(x: Extracted): Form {
  return {
    cpu: x.cpu ?? '',
    gpu: x.gpu ?? '',
    gpuCount: x.gpuCount
      ? String(x.gpuCount)
      : x.gpu || x.gpuIts !== undefined
        ? '1'
        : '',
    mode: modeFrom(x),
    backend: x.backend ?? '',
    os: '',
    ramGb: '',
    threads: x.threads ? String(x.threads) : '',
    owner: 'own',
    host: '',
    powerLimitW: x.powerLimitW ? String(x.powerLimitW) : '',
    solutions: x.solutions !== undefined ? String(x.solutions) : '',
    hours: h1(x.windowMin),
    uptimeH: h1(x.uptimeMin ?? x.windowMin),
    worker: x.worker ?? '',
    dailyCost: '',
  }
}

/** The rig as the form or the log describes it, for the comparison. */
function runOf(f: Form, x: Extracted, findings: string[]) {
  const gpu = f.mode === 'cpu' ? null : normalizeGpu(f.gpu)
  const cpu = normalizeCpu(f.cpu)
  if (f.mode !== 'cpu' ? !gpu : !cpu) return null
  const p = partKey({ cpu, gpu, mode: f.mode })
  const solutions = n(f.solutions)
  const windowMin = n(f.hours) !== undefined ? n(f.hours)! * 60 : undefined
  return {
    key: p.key,
    label: p.label,
    unit: p.unit,
    gpuCount: gpu ? Math.max(1, n(f.gpuCount) ?? 1) : 0,
    solPerHour:
      solutions !== undefined && windowMin
        ? (solutions / windowMin) * 60
        : undefined,
    windowMin,
    uptimeMin: n(f.uptimeH) !== undefined ? n(f.uptimeH)! * 60 : undefined,
    threads: n(f.threads),
    rejected: x.rejected,
    maxTempC: x.maxTempC,
    findings,
  }
}

function NumbersCard({ x }: { x: Extracted }) {
  const rows: [string, string][] = []
  if (x.epoch) rows.push(['Epoch', `E:${x.epoch}`])
  for (const [k, v] of Object.entries(x.its))
    rows.push([k === 'total' ? 'Speed' : k, `${fmtRate(v)} it/s`])
  if (x.avgIts !== undefined)
    rows.push(['Average', `${fmtRate(x.avgIts)} it/s`])
  if (x.solutions !== undefined && x.windowMin)
    rows.push([
      'Solutions',
      `${x.solutions.toLocaleString('en-US')} in ${fmtWindow(x.windowMin)}`,
    ])
  if (x.solPerHour !== undefined)
    rows.push([
      'Rate',
      `${fmtRate(x.solPerHour)} sol/h${x.gpuCount && x.gpuCount > 1 ? `, ${fmtRate(x.solPerHour / x.gpuCount)} per card` : ''}`,
    ])
  if (x.rejected !== undefined) rows.push(['Rejected', String(x.rejected)])
  if (x.uptimeMin !== undefined) rows.push(['Running', fmtWindow(x.uptimeMin)])
  if (x.gpu)
    rows.push([
      'GPU',
      `${x.gpuCount && x.gpuCount > 1 ? `${x.gpuCount}x ` : ''}${x.gpu}`,
    ])
  if (x.cpu) rows.push(['CPU', x.cpu])
  if (x.threads) rows.push(['Threads', String(x.threads)])
  return (
    <StatusCard
      icon={<Gauge size={16} strokeWidth={2.2} />}
      label="Read from your log"
      title="Numbers in this log"
      tone={TONE.gold}
    >
      <Specs rows={rows} />
      {x.solPerHour === undefined && (
        <p className={s.rowBody} style={{ marginTop: 8 }}>
          No solution counter with timestamps, so no sol/h yet. it/s is speed,
          not pay: judge by solutions per hour.
        </p>
      )}
    </StatusCard>
  )
}

function CompareCard({ c }: { c: Comparison }) {
  if (c.kind !== 'compared') {
    return (
      <StatusCard
        icon={severityIcon(c.kind === 'early' ? 'check' : 'fine')}
        label="Compared with our miners"
        title={
          c.kind === 'early' ? 'Too early to judge' : 'Nothing to compare yet'
        }
        tone={TONE.fog}
      >
        <p className={s.rowBody} style={{ marginTop: 8 }}>
          {c.text}
        </p>
      </StatusCard>
    )
  }
  const sev = c.below ? 'check' : 'fine'
  return (
    <StatusCard
      icon={severityIcon(sev)}
      label={c.below ? SEVERITY_LABEL.check : 'Compared with our miners'}
      title={c.title}
      tone={c.below ? TONE.gold : TONE.sage}
    >
      <p className={s.rowBody} style={{ marginTop: 8 }}>
        {c.detail}
      </p>
      <Tags tags={c.row.tags} />
      {c.causes.length > 0 && (
        <ol className={s.fixList}>
          {c.causes.map(x => (
            <li key={x.id}>
              <span>
                <strong className={s.causeTitle}>{x.title}</strong>
                {x.seen && <span className={s.seen}>seen in your log</span>}{' '}
                {x.text}
              </span>
            </li>
          ))}
        </ol>
      )}
    </StatusCard>
  )
}

function Input({
  label,
  value,
  onChange,
  numeric,
  placeholder,
  hint,
  wide,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  numeric?: boolean
  placeholder?: string
  hint?: string
  wide?: boolean
}) {
  return (
    <label className={cx(s.fField, wide && s.fWide)}>
      <span className={s.fLabel}>{label}</span>
      <input
        autoComplete="off"
        className={s.fInput}
        inputMode={numeric ? 'decimal' : 'text'}
        maxLength={numeric ? 8 : 64}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        type="text"
        value={value}
      />
      {hint && <span className={s.fHint}>{hint}</span>}
    </label>
  )
}

function Select<T extends string>({
  label,
  value,
  onChange,
  options,
  wide,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  wide?: boolean
}) {
  return (
    <label className={cx(s.fField, wide && s.fWide)}>
      <span className={s.fLabel}>{label}</span>
      <select
        className={s.fInput}
        onChange={e => onChange(e.target.value as T)}
        value={value}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

type Phase = 'offer' | 'form' | 'sending' | 'saved' | 'no'

/**
 * Everything the doctor adds once a log has numbers: what it read, how the rig compares with the median
 * for its hardware, and the offer to save the result. Only the structured fields below are sent; the log stays here.
 */
export function LogMeasure({
  log,
  findings,
}: {
  log: string
  findings: string[]
}) {
  const x = useMemo(() => extractMetrics(log), [log])
  const { summary, setSummary } = useMeasured()
  const [f, setF] = useState<Form>(() => formFrom(x))
  const [phase, setPhase] = useState<Phase>('offer')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  // after a save, keep comparing with the peers as they were, not with this rig's own new row
  const before = useRef<Summary | null>(null)
  const set =
    <K extends keyof Form>(k: K) =>
    (v: Form[K]) =>
      setF(p => ({ ...p, [k]: v }))

  const run = runOf(f, x, findings)
  const cmp = run ? compareRun(run, phase === 'saved' ? before.current : summary) : null
  const cur = epochAt().epoch
  const oldLog = x.epoch !== undefined && x.epoch !== cur
  const own = costPerSolution(n(f.dailyCost), run?.solPerHour)

  useEffect(() => {
    if (phase === 'form')
      formRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [phase])

  const submit = async () => {
    if (phase === 'sending') return
    before.current = summary
    setError('')
    setPhase('sending')
    const body = {
      cpu: f.cpu,
      gpu: f.mode === 'cpu' ? null : f.gpu,
      gpuCount: n(f.gpuCount),
      mode: f.mode,
      backend: f.backend || undefined,
      os: f.os || undefined,
      ramGb: n(f.ramGb),
      threads: n(f.threads),
      owner: f.owner,
      host: f.owner === 'rented' ? f.host || undefined : undefined,
      powerLimitW: f.mode === 'cpu' ? undefined : n(f.powerLimitW),
      solutions: n(f.solutions),
      windowMin: n(f.hours) !== undefined ? n(f.hours)! * 60 : undefined,
      uptimeMin: n(f.uptimeH) !== undefined ? n(f.uptimeH)! * 60 : undefined,
      gpuIts: x.gpuIts,
      cpuIts: x.cpuIts,
      rejected: x.rejected,
      logEpoch: x.epoch,
      worker: f.worker.trim() || undefined,
      // never sent: the daily cost, the log text
    }
    try {
      const r = await fetch('/api/pool/measure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = (await r.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        epoch?: number
        row?: { latest: { n: number } } | null
        summary?: Summary
      }
      if (!r.ok || !j.ok) {
        setError(j.error ?? `Not saved (${r.status}).`)
        setPhase('form')
        return
      }
      if (j.summary) setSummary(j.summary)
      const nn = j.row?.latest.n ?? 1
      setSaved(
        `Saved. Maria now has ${nn} rig${nn === 1 ? '' : 's'} like yours in epoch ${j.epoch}. Thank you.`
      )
      setPhase('saved')
    } catch {
      setError('Not saved: the connection failed. Try again.')
      setPhase('form')
    }
  }

  const gpuRig = f.mode !== 'cpu'
  return (
    <div className={s.cards} style={{ marginTop: 0 }}>
      <NumbersCard x={x} />
      {cmp && <CompareCard c={cmp} />}

      {oldLog ? (
        <p className={s.note}>
          This log is from epoch {x.epoch}. Only results from the running epoch,{' '}
          {cur}, are saved.
        </p>
      ) : phase === 'offer' ? (
        <article className={s.card}>
          <p
            className={s.rowBody}
            style={{ margin: '0 0 10px', color: 'var(--bone)', fontSize: 14.5 }}
          >
            Save this result to help Maria learn? (no wallet, no name stored)
          </p>
          <Chips
            label="Save this result"
            onPick={v => setPhase(v === 'yes' ? 'form' : 'no')}
            options={[
              { value: 'yes', label: 'Yes, save it', primary: true },
              { value: 'no', label: 'No thanks' },
            ]}
          />
        </article>
      ) : phase === 'no' ? null : phase === 'saved' ? (
        <StatusCard
          icon={severityIcon('fine')}
          label="Saved"
          title="Result saved"
          tone={TONE.sage}
        >
          <p className={s.rowBody} style={{ marginTop: 8 }}>
            {saved}
          </p>
          {own !== undefined && (
            <p className={s.rowBody}>
              Your own cost per solution:{' '}
              {own < 0.01 ? own.toFixed(4) : own.toFixed(3)} USD (your daily
              cost ÷ your solutions per day). It stayed in this browser.
            </p>
          )}
        </StatusCard>
      ) : (
        <form
          aria-label="Save this result"
          className={s.card}
          onSubmit={e => {
            e.preventDefault()
            void submit()
          }}
          ref={formRef}
        >
          <h3 className={s.vTitle}>Save this result</h3>
          <p className={s.rowBody} style={{ margin: '3px 0 10px' }}>
            Filled in from your log. Check it, add what is missing. Only these
            fields are sent; the log stays here.
          </p>
          <div className={s.fGrid}>
            <Select
              label="Mining with"
              onChange={set('mode')}
              options={(['gpu', 'gpu+cpu', 'cpu'] as MineMode[]).map(m => ({
                value: m,
                label: MODE_LABEL[m],
              }))}
              value={f.mode}
              wide
            />
            {gpuRig && (
              <Input
                label="GPU model"
                onChange={set('gpu')}
                placeholder="RTX 4090"
                value={f.gpu}
              />
            )}
            {gpuRig && (
              <Input
                label="Cards"
                numeric
                onChange={set('gpuCount')}
                placeholder="1"
                value={f.gpuCount}
              />
            )}
            <Input
              label="CPU model"
              onChange={set('cpu')}
              placeholder="Ryzen 9 7950X"
              value={f.cpu}
            />
            <Input
              label="Threads"
              numeric
              onChange={set('threads')}
              placeholder="32"
              value={f.threads}
            />
            <Input
              label="RAM (GB)"
              numeric
              onChange={set('ramGb')}
              placeholder="64"
              value={f.ramGb}
            />
            <Select
              label="System"
              onChange={set('os')}
              options={[
                { value: '' as Os | '', label: 'Choose' },
                ...POOL.osOptions.map(o => ({
                  value: o as Os | '',
                  label: OS_LABEL[o],
                })),
              ]}
              value={f.os}
            />
            <Select
              label="Backend"
              onChange={set('backend')}
              options={[
                { value: '' as Backend | '', label: 'Not sure' },
                ...POOL.backends.map(b => ({
                  value: b as Backend | '',
                  label: b,
                })),
              ]}
              value={f.backend}
              wide={!gpuRig}
            />
            {gpuRig && (
              <Input
                label="Power limit (W)"
                numeric
                onChange={set('powerLimitW')}
                placeholder="default"
                value={f.powerLimitW}
              />
            )}
            <Select
              label="Own or rented"
              onChange={set('owner')}
              options={[
                { value: 'own' as const, label: 'My own' },
                { value: 'rented' as const, label: 'Rented' },
              ]}
              value={f.owner}
              wide={f.owner !== 'rented'}
            />
            {f.owner === 'rented' && (
              <Select
                label="Host"
                onChange={set('host')}
                options={[
                  { value: '', label: 'Choose' },
                  ...HOSTS.map(h => ({
                    value: h as string,
                    label: h as string,
                  })),
                ]}
                value={f.host}
              />
            )}
            <Input
              label="Solutions"
              numeric
              onChange={set('solutions')}
              placeholder="count"
              value={f.solutions}
            />
            <Input
              label="Over (hours)"
              numeric
              onChange={set('hours')}
              placeholder="3"
              value={f.hours}
            />
            <Input
              hint={`Saved after ${MEASURE.warmupMin / 60} hours: early rates run high.`}
              label="Running for (hours)"
              numeric
              onChange={set('uptimeH')}
              placeholder="3"
              value={f.uptimeH}
              wide
            />
            <Input
              hint="Optional. Hashed to count your rig once a day, then dropped. Never stored."
              label="Worker name"
              onChange={set('worker')}
              placeholder={`${POOL.workerPrefix}rig-a`}
              value={f.worker}
              wide
            />
            <Input
              hint="Optional. Stays in this browser. Shows your own cost per solution."
              label="Your daily cost (USD)"
              numeric
              onChange={set('dailyCost')}
              placeholder="8"
              value={f.dailyCost}
              wide
            />
          </div>
          {own !== undefined && (
            <p className={s.measuredSub} style={{ marginTop: 10 }}>
              Your own cost per solution:{' '}
              {own < 0.01 ? own.toFixed(4) : own.toFixed(3)} USD (your daily
              cost ÷ your solutions per day).
            </p>
          )}
          {error && (
            <p className={s.warn} role="alert" style={{ marginTop: 10 }}>
              {error}
            </p>
          )}
          <div style={{ marginTop: 12 }}>
            <Chips
              label="Save or cancel"
              onPick={v => (v === 'save' ? void submit() : setPhase('offer'))}
              options={[
                {
                  value: 'save',
                  label: phase === 'sending' ? 'Saving' : 'Save result',
                  primary: true,
                },
                { value: 'cancel', label: 'Cancel' },
              ]}
            />
          </div>
        </form>
      )}
    </div>
  )
}
