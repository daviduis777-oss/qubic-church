'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ChevronRight, Download, Share2, Stethoscope, X } from 'lucide-react'
import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type HardwareRow, selfReportedLine, type Summary, topRows } from '@/lib/pool/aggregate'
import { MEASURE, POOL } from '@/lib/pool/config'
import { diagnose } from '@/lib/pool/doctor'
import { extractMetrics, fmtRate } from '@/lib/pool/measure'
import {
  type CardFormat,
  cardFrom,
  coachLine,
  demoRigs,
  epochStrip,
  fmtCost,
  fmtInt,
  fmtUpShort,
  gpuCount,
  hwLine,
  type MyRig,
  loadRigs,
  perCard,
  percentileLine,
  type RigReading,
  type RigStatus,
  readingFromLog,
  rejectedPct,
  removeRig,
  rigCost,
  rigHw,
  rigStatus,
  SOURCE_LABEL,
  type Standing,
  type StatusView,
  saveRigs,
  shortWorker,
  standing,
  storedReading,
  toStored,
  upsertRig,
  vsMedian,
} from '@/lib/pool/rig'
import type { Bar, Usage } from '@/lib/pool/usage'
import { checkWorker, cleanWorker } from '@/lib/pool/wizard'
import { type Answers, Screen, useStickToBottom } from './flow'
import type { Go } from './flows'
import { Halo } from './Halo'
import { useMeasured } from './measured'
import { Avatar, Chips, cx, Field, PRESS, SPRING, TONE, Tags } from './ui'
import s from './maria.module.css'
import r from './rig.module.css'

/* ---------------- status look ---------------- */

export const STATUS_TONE: Record<RigStatus, string> = { mining: TONE.gold, warming: '#FFE77C', early: TONE.gold, idle: '#B7B7B7', 'no-signal': TONE.fog, look: TONE.coral }

export function StatusChip({ status, title, live }: { status: RigStatus; title: string; live?: boolean }) {
  return (
    <span className={r.chip} style={{ '--tone': STATUS_TONE[status] } as CSSProperties}>
      <span aria-hidden className={cx(r.dot, live && r.dotLive)} />
      {title}
    </span>
  )
}

/** Maria's halo as the rig's pulse: a heartbeat while mining, working while warming up, a slow coral beat when it needs a look. */
function RigHalo({ status, size, face }: { status: RigStatus; size: number; face: number }) {
  const [beat, setBeat] = useState(false)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (reduce || (status !== 'mining' && status !== 'look')) return
    const every = status === 'mining' ? 3200 : 2600
    let off: ReturnType<typeof setTimeout> | undefined
    const id = setInterval(() => {
      setBeat(true)
      off = setTimeout(() => setBeat(false), 400)
    }, every)
    return () => {
      clearInterval(id)
      if (off) clearTimeout(off)
    }
  }, [status, reduce])
  // each beat is one settled shockwave from her face; warming up is her working
  const mode = status === 'warming' ? 'thinking' : beat ? 'settled' : 'idle'
  const tone = status === 'look' ? TONE.coral : status === 'idle' || status === 'no-signal' ? TONE.fog : TONE.gold
  return (
    <div className={cx(r.halo, (status === 'no-signal' || status === 'idle') && r.haloDim, status === 'look' && r.haloLook)}>
      <Halo face={face} label={`Rig status: ${status}`} mode={mode} size={size} tone={tone} />
    </div>
  )
}

/* ---------------- numbers ---------------- */

/** 0 reads as 0, not 0.0 */
const fmtSol = (v: number) => (v === 0 ? '0' : fmtRate(v))

/** One of the three: the size is shared (--len on the row), fitted to the column by a container query. */
function Big({ value, label, sub }: { value?: string; label: string; sub?: string }) {
  return (
    <div className={r.big}>
      <span className={cx(r.bigValue, !value && r.bigNone)}>{value ?? 'n/a'}</span>
      <span className={r.bigLabel}>{label}</span>
      <span className={r.bigSub}>{sub ?? ' '}</span>
    </div>
  )
}

function Spark({ points }: { points: { t: number; solPerHour: number }[] }) {
  if (points.length < 2) return null
  const W = 320
  const H = 64
  const t0 = points[0]!.t
  const t1 = points.at(-1)!.t
  const vs = points.map(p => p.solPerHour)
  const max = Math.max(...vs) * 1.08 || 1
  const min = Math.min(0, Math.min(...vs))
  const x = (t: number) => (t1 > t0 ? ((t - t0) / (t1 - t0)) * (W - 8) + 4 : W / 2)
  const y = (v: number) => H - 4 - ((v - min) / (max - min)) * (H - 10)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)} ${y(p.solPerHour).toFixed(1)}`).join('')
  const area = `${line}L${x(t1).toFixed(1)} ${H}L${x(t0).toFixed(1)} ${H}Z`
  const last = points.at(-1)!
  return (
    <figure className={r.spark}>
      <figcaption className={r.sparkHead}>
        <span>sol/h this epoch</span>
        <span className={r.sparkNow}>now {fmtRate(last.solPerHour)}</span>
      </figcaption>
      <svg aria-label={`sol/h over the epoch, ${points.length} readings, from ${fmtRate(vs[0]!)} to ${fmtRate(last.solPerHour)}`} preserveAspectRatio="none" role="img" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="rigSparkFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#FECE34" stopOpacity="0.28" />
            <stop offset="1" stopColor="#FECE34" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#rigSparkFill)" />
        <path d={line} fill="none" stroke="#FECE34" strokeLinejoin="round" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
    </figure>
  )
}

function EpochBar({ now }: { now: Date }) {
  const e = epochStrip(now)
  return (
    <section aria-label="Epoch" className={r.epoch}>
      <div className={r.epochHead}>
        <span className={r.epochName}>Epoch {e.epoch}</span>
        <span>
          day {e.day} of 7 · <span className={r.mono}>{e.left}</span> left
        </span>
      </div>
      <div aria-label={`${Math.round(e.frac * 100)}% through epoch ${e.epoch}`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={Math.round(e.frac * 100)} className={r.epochTrack} role="progressbar">
        <span className={r.epochFill} style={{ width: `${Math.max(2, e.frac * 100)}%` }} />
      </div>
      <p className={r.epochNote}>Wednesday 12:00 UTC to Wednesday 12:00 UTC. {e.payout}</p>
    </section>
  )
}

function Peer({ st }: { st: Standing }) {
  if (st.kind !== 'ok')
    return (
      <div className={cx(r.tile, r.tileWide)}>
        <span className={r.tileLabel}>vs similar rigs</span>
        <span className={r.tileNote}>{st.text}</span>
      </div>
    )
  return (
    <div className={cx(r.tile, r.tileWide)}>
      <span className={r.tileLabel}>vs similar rigs</span>
      <span className={r.tileRow}>
        <span className={r.tileValue}>
          {vsMedian(st).replace(/ vs median$/, '')}
          {vsMedian(st).endsWith('vs median') && <span className={r.tileUnit}> vs median</span>}
        </span>
        {st.pct !== undefined && <span className={r.tilePct}>about p{st.pct}</span>}
      </span>
      <span className={r.tileNote}>
        Median {fmtRate(st.median)} sol/h {st.unit === 'card' ? 'per card' : 'per rig'} for {st.label}, n {st.n}, epoch {st.epoch}
      </span>
      <Tags tags={st.tags} />
    </div>
  )
}

/* ---------------- one rig ---------------- */

function Dashboard({ rig, reading, st, peer, demo, now, onFix }: { rig: MyRig; reading: RigReading | null; st: StatusView; peer: Standing; demo: boolean; now: Date; onFix: () => void }) {
  const coach = coachLine(reading, st, peer)
  const cards = reading ? gpuCount(reading.hw) : 0
  const pc = reading ? perCard(reading) : undefined
  const rej = reading ? rejectedPct(reading) : undefined
  const cost = rigCost(rig.dailyCost, reading)
  const lanes = Object.entries(reading?.its ?? {})
  const age = reading ? Math.max(0, Math.round((now.getTime() - reading.at) / 60_000)) : undefined
  const src = reading ? (demo ? 'demo' : SOURCE_LABEL[reading.source]) : 'no data'
  const nums = [
    reading?.solutions !== undefined ? fmtInt(reading.solutions) : undefined,
    reading?.solPerHour !== undefined ? fmtSol(reading.solPerHour) : undefined,
    reading?.uptimeMin !== undefined ? fmtUpShort(reading.uptimeMin) : undefined,
  ]
  return (
    <div className={r.dash}>
      <section aria-label="Status" className={r.hero}>
        <RigHalo face={46} size={176} status={st.status} />
        <div className={r.heroText}>
          <StatusChip live={st.status === 'mining'} status={st.status} title={st.title} />
          <p className={r.heroLine}>{st.line}</p>
          <p className={r.heroMeta}>
            <span className={cx(r.src, demo && r.srcDemo)}>{src}</span>
            {age !== undefined && !demo && <span>{age < 1 ? 'just now' : `${fmtUpShort(age)} ago`}</span>}
            <span className={r.mono}>{hwLine(reading?.hw ?? rigHw(rig))}</span>
          </p>
        </div>
      </section>

      <section aria-label="Key numbers" className={r.bigs} style={{ '--len': Math.max(4, ...nums.map(v => v?.length ?? 0)) } as CSSProperties}>
        <Big label="solutions" sub={reading?.source === 'log' && !demo ? 'in this log' : 'this epoch'} value={nums[0]} />
        <Big label="sol/h" sub={pc !== undefined ? `${fmtRate(pc)} per card` : cards === 1 ? 'one card' : undefined} value={nums[1]} />
        <Big label="uptime" sub="this epoch" value={nums[2]} />
      </section>

      <motion.button className={cx(r.coach, coach.doctor && r.coachAct)} disabled={!coach.doctor} onClick={coach.doctor ? onFix : undefined} type="button" whileTap={coach.doctor ? PRESS : undefined}>
        <Avatar size={30} />
        <span className={r.coachText}>
          <span className={r.coachLabel}>Coach</span>
          {coach.text}
        </span>
        {coach.doctor && (
          <span className={r.coachGo}>
            <Stethoscope aria-hidden size={15} strokeWidth={2.2} />
            Fix my rig
          </span>
        )}
      </motion.button>

      <section aria-label="Details" className={r.tiles}>
        <div className={r.tile}>
          <span className={r.tileLabel}>it/s per lane</span>
          {lanes.length ? (
            lanes.map(([k, v]) => (
              <span className={r.lane} key={k}>
                <span>{k === 'total' ? 'all' : k}</span>
                <span className={r.mono}>{fmtRate(v)}</span>
              </span>
            ))
          ) : (
            <span className={r.tileNote}>No readout yet</span>
          )}
        </div>
        <div className={r.tile}>
          <span className={r.tileLabel}>rejected</span>
          <span className={r.tileValue}>{rej !== undefined ? `${rej}%` : 'n/a'}</span>
          <span className={r.tileNote}>
            {reading?.rejected !== undefined && reading.solutions !== undefined ? `${fmtInt(reading.rejected)} of ${fmtInt(reading.solutions + reading.rejected)} submitted` : 'not in the data'}
          </span>
        </div>
        <Peer st={peer} />
        {cost !== undefined && reading?.solPerHour !== undefined && (
          <div className={cx(r.tile, r.tileWide)}>
            <span className={r.tileLabel}>your cost per solution</span>
            <span className={r.tileValue}>{fmtCost(cost)} USD</span>
            <span className={r.tileNote}>
              Your {rig.dailyCost} USD a day ÷ {fmtInt(reading.solPerHour * 24)} solutions a day. It stays in this browser.
            </span>
          </div>
        )}
      </section>

      {reading && reading.series.length > 1 && <Spark points={reading.series} />}
      <EpochBar now={now} />
      {demo && <p className={s.note}>Sample data, so you can see the design. Add your own rig to watch it.</p>}
    </div>
  )
}

/* ---------------- the share sheet ---------------- */

type CardUrls = { story: string; x: string }

function ShareSheet({ rig, reading, st, peer, demo, onClose }: { rig: MyRig; reading: RigReading; st: StatusView; peer: Standing; demo: boolean; onClose: () => void }) {
  const [fmt, setFmt] = useState<CardFormat>('story')
  const [withCost, setWithCost] = useState(false)
  const [blobs, setBlobs] = useState<Partial<Record<CardFormat, { blob: Blob; url: string }>>>({})
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const canCost = rigCost(rig.dailyCost, reading) !== undefined
  const card = useMemo(() => cardFrom(demo ? { ...reading, source: 'demo' } : reading, st, peer, { dailyCost: rig.dailyCost, withCost: withCost && canCost }), [reading, st, peer, rig.dailyCost, withCost, canCost, demo])
  const name = (f: CardFormat) => `qubic-church-pool-${shortWorker(rig.worker, 40).replace(/[^A-Za-z0-9._-]/g, '')}-${f === 'x' ? '1200x675' : '1080x1350'}.png`

  // Sign, then fetch both PNGs up front: iOS Safari only shares a file inside the tap itself, with no await before it.
  useEffect(() => {
    let live = true
    const made: string[] = []
    setBlobs({})
    setError('')
    ;(async () => {
      try {
        const res = await fetch('/api/pool/card', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ card }) })
        const j = (await res.json().catch(() => ({}))) as Partial<CardUrls> & { ok?: boolean; error?: string }
        if (!res.ok || !j.ok || !j.story || !j.x) throw new Error(j.error ?? `The card could not be made (${res.status}).`)
        for (const f of ['story', 'x'] as CardFormat[]) {
          const b = await fetch(j[f]!).then(x => (x.ok ? x.blob() : Promise.reject(new Error(`The image could not be drawn (${x.status}).`))))
          const url = URL.createObjectURL(b)
          made.push(url)
          if (!live) return
          setBlobs(p => ({ ...p, [f]: { blob: b, url } }))
        }
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : 'The card could not be made.')
      }
    })()
    return () => {
      live = false
      for (const u of made) URL.revokeObjectURL(u)
    }
  }, [card])

  const cur = blobs[fmt]
  const save = () => {
    if (!cur) return
    const a = document.createElement('a')
    a.href = cur.url
    a.download = name(fmt)
    document.body.appendChild(a)
    a.click()
    a.remove()
    setDone('Saved')
  }
  const share = () => {
    if (!cur) return
    const file = new File([cur.blob], name(fmt), { type: 'image/png' })
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
    if (nav.share && nav.canShare?.({ files: [file] })) {
      nav.share({ files: [file], title: POOL.name }).then(
        () => setDone('Shared'),
        (e: unknown) => {
          if ((e as { name?: string })?.name !== 'AbortError') save()
        },
      )
    } else save()
  }

  return (
    <div className={r.sheetWrap}>
      <motion.button animate={{ opacity: 1 }} aria-label="Close share" className={r.scrim} initial={{ opacity: 0 }} onClick={onClose} type="button" />
      <motion.section animate={{ y: 0 }} aria-label="Share your rig" aria-modal="true" className={r.sheet} initial={{ y: '100%' }} role="dialog" transition={SPRING}>
        <span aria-hidden className={r.grabber} />
        <div className={r.sheetHead}>
          <h3 className={r.sheetTitle}>Share</h3>
          <motion.button aria-label="Close" className={r.close} onClick={onClose} type="button" whileTap={PRESS}>
            <X aria-hidden size={18} strokeWidth={2.4} />
          </motion.button>
        </div>
        <div className={cx(r.preview, fmt === 'x' && r.previewX)}>
          {cur ? (
            // biome-ignore lint/performance/noImgElement: the exact PNG that will be shared
            <img alt={`Share card for ${rig.worker}`} src={cur.url} />
          ) : (
            <span className={r.previewWait}>{error || 'Drawing your card'}</span>
          )}
        </div>
        <div className={r.seg}>
          {(['story', 'x'] as CardFormat[]).map(f => (
            <label className={cx(r.segBtn, fmt === f && r.segOn)} key={f}>
              <input checked={fmt === f} className={s.srOnly} name="card-format" onChange={() => setFmt(f)} type="radio" value={f} />
              {f === 'story' ? 'Portrait 4:5' : 'For X 16:9'}
            </label>
          ))}
        </div>
        {canCost && (
          <label className={r.toggle}>
            <span>
              Include my cost per solution
              <span className={r.toggleSub}>Off by default. Your own number, never income.</span>
            </span>
            <input aria-checked={withCost} checked={withCost} className={r.switch} onChange={e => setWithCost(e.target.checked)} role="switch" type="checkbox" />
          </label>
        )}
        <p className={r.sheetNote}>
          {demo ? 'A demo card: it says DEMO across it.' : `Marked "${SOURCE_LABEL[reading.source]}" so people know where the numbers come from.`} No wallet on it.
        </p>
        <div className={r.sheetActions}>
          <motion.button className={r.primary} disabled={!cur} onClick={share} type="button" whileTap={PRESS}>
            <Share2 aria-hidden size={17} strokeWidth={2.3} />
            Share
          </motion.button>
          <motion.button className={r.secondary} disabled={!cur} onClick={save} type="button" whileTap={PRESS}>
            <Download aria-hidden size={17} strokeWidth={2.3} />
            Save image
          </motion.button>
        </div>
        <p aria-live="polite" className={s.srOnly}>
          {done}
        </p>
      </motion.section>
    </div>
  )
}

/* ---------------- who mines with what (in the app) ---------------- */

function Bars({ title, bars, rate }: { title: string; bars: Bar[]; rate?: boolean }) {
  if (!bars.length) return null
  const max = Math.max(...bars.map(b => b.share))
  return (
    <section className={r.bars}>
      <h4 className={r.barsTitle}>{title}</h4>
      {bars.map(b => (
        <div className={r.bar} key={b.key}>
          <div className={r.barHead}>
            <span className={r.barLabel}>{b.label}</span>
            <span className={r.mono}>
              {Math.round(b.share * 100)}% <span className={r.barN}>n {b.n}</span>
            </span>
          </div>
          <div className={r.barTrack}>
            <span className={r.barFill} style={{ width: `${Math.max(3, (b.share / (max || 1)) * 100)}%` }} />
          </div>
          {rate && (
            <span className={r.barRate}>
              {b.median !== undefined ? `median ${fmtRate(b.median)} sol/h ${b.unit === 'card' ? 'per card' : 'per rig'}` : 'no current rate'}
              {b.tags.length > 0 && ` · ${b.tags.join(', ')}`}
            </span>
          )}
        </div>
      ))}
    </section>
  )
}

function Delivers({ rows }: { rows: HardwareRow[] }) {
  if (!rows.length) return <p className={r.tileNote}>No measured rigs yet.</p>
  return (
    <ul className={s.group}>
      {rows.map(x => (
        <li className={s.row} key={x.key} style={{ alignItems: 'flex-start' }}>
          <div className={s.rowMain}>
            <div className={s.rowTitle}>{x.label}</div>
            <div className={s.rowNote}>
              {x.unit === 'card' ? 'per card, GPU only' : x.key.startsWith('mix|') ? 'per rig, GPU and CPU' : 'per rig, CPU only'} · n {x.latest.n} · epoch {x.latest.epoch}
            </div>
            {selfReportedLine(x) && <div className={s.rowNote}>{selfReportedLine(x)}</div>}
            <Tags tags={x.tags} />
          </div>
          <span className={r.rowRate}>{fmtRate(x.latest.median ?? 0)}</span>
        </li>
      ))}
    </ul>
  )
}

export function UsageView({ summary }: { summary: Summary | null }) {
  const [tab, setTab] = useState<'use' | 'deliver'>('use')
  const u: Usage | undefined = summary?.usage
  return (
    <div className={r.dash}>
      <div aria-label="Who mines with what" className={r.seg} role="tablist">
        <button aria-selected={tab === 'use'} className={cx(r.segBtn, tab === 'use' && r.segOn)} onClick={() => setTab('use')} role="tab" type="button">
          What people use
        </button>
        <button aria-selected={tab === 'deliver'} className={cx(r.segBtn, tab === 'deliver' && r.segOn)} onClick={() => setTab('deliver')} role="tab" type="button">
          What it delivers
        </button>
      </div>
      {tab === 'use' ? (
        u && u.n ? (
          <>
            <p className={r.tileNote}>
              {u.n} rig{u.n === 1 ? '' : 's'}, epoch{u.from === u.to ? ` ${u.to}` : `s ${u.from} to ${u.to}`}. Saved runs and our own field runs.
            </p>
            <Tags tags={[...(u.few ? ['few data'] : []), ...(u.older ? ['older'] : [])]} />
            <Bars bars={u.gpu} rate title="GPU" />
            <Bars bars={u.cpu} rate title="CPU family" />
            <Bars bars={u.mode} title="Mode" />
            <Bars bars={u.os} title="System" />
            <Bars bars={u.owner} title="Own or rented" />
            {u.top && (
              <p className={s.note}>
                Most common setup: {u.top.label} ({u.top.n} of {u.n}).
              </p>
            )}
          </>
        ) : (
          <p className={r.tileNote}>No rigs measured yet.</p>
        )
      ) : (
        <>
          <p className={r.tileNote}>Median sol/h. Rates only, never income. Under {MEASURE.fewData} rigs is few data.</p>
          <Delivers rows={topRows(summary, 8)} />
        </>
      )}
    </div>
  )
}

/* ---------------- add or edit a rig ---------------- */

function In({ label, value, onChange, placeholder, numeric, mono, hint, wide }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; numeric?: boolean; mono?: boolean; hint?: string; wide?: boolean }) {
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
        style={mono ? { fontFamily: 'var(--mono)', fontSize: 15 } : undefined}
        type="text"
        value={value}
      />
      {hint && <span className={s.fHint}>{hint}</span>}
    </label>
  )
}

type Draft = { worker: string; gpu: string; gpuCount: string; cpu: string; threads: string; dailyCost: string }
const draftOf = (x?: Partial<MyRig>): Draft => ({
  worker: x?.worker ?? POOL.workerPrefix,
  gpu: x?.gpu ?? '',
  gpuCount: x?.gpuCount ? String(x.gpuCount) : '',
  cpu: x?.cpu ?? '',
  threads: x?.threads ? String(x.threads) : '',
  dailyCost: x?.dailyCost ? String(x.dailyCost) : '',
})
const num = (v: string) => (v.trim() === '' ? undefined : Number(v.replace(',', '.')))

function RigForm({ draft, set, error }: { draft: Draft; set: (k: keyof Draft) => (v: string) => void; error: string }) {
  return (
    <form
      aria-label="Your rig"
      className={s.card}
      onSubmit={e => {
        e.preventDefault()
      }}
    >
      <p className={s.rowBody} style={{ margin: '0 0 10px' }}>
        The worker name is how the pool knows this machine. Everything here stays in this browser. No wallet needed.
      </p>
      <div className={s.fGrid}>
        <In label="Worker name" mono onChange={set('worker')} placeholder={`${POOL.workerPrefix}rig-a`} value={draft.worker} wide />
        <In label="GPU model" onChange={set('gpu')} placeholder="RTX 4090, or empty" value={draft.gpu} />
        <In label="Cards" numeric onChange={set('gpuCount')} placeholder="1" value={draft.gpuCount} />
        <In label="CPU model" onChange={set('cpu')} placeholder="Ryzen 9 7950X" value={draft.cpu} />
        <In label="Threads" numeric onChange={set('threads')} placeholder="32" value={draft.threads} />
        <In hint="Optional. Shows your own cost per solution. Never income." label="Your daily cost (USD)" numeric onChange={set('dailyCost')} placeholder="8" value={draft.dailyCost} wide />
      </div>
      {error && (
        <p className={s.warn} role="alert" style={{ marginTop: 10 }}>
          {error}
        </p>
      )}
    </form>
  )
}

/* ---------------- the screen ---------------- */

type View = { kind: 'list' } | { kind: 'rig'; worker: string; demo: boolean } | { kind: 'edit'; worker?: string } | { kind: 'stats' }

function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

/**
 * My rig. Readings come from the pool (TODO(Bob): poolWorkerAdapter), from a pasted log (numbers only, read
 * here), or from the demo. The list of rigs lives in this browser; nothing new is sent anywhere.
 */
export function RigFlow({ go, handoff }: { go: Go; handoff?: Answers }) {
  const [rigs, setRigs] = useState<MyRig[]>(() => loadRigs())
  const [view, setView] = useState<View>(() => (handoff?.worker ? { kind: 'rig', worker: cleanWorker(handoff.worker), demo: false } : handoff?.demo ? { kind: 'rig', worker: handoff.demo, demo: true } : { kind: 'list' }))
  const [demoOn, setDemoOn] = useState(() => Boolean(handoff?.demo) || (!handoff?.worker && loadRigs().length === 0))
  const [live, setLive] = useState<Record<string, RigReading>>({})
  const [pasting, setPasting] = useState(false)
  const [notice, setNotice] = useState('')
  const [sharing, setSharing] = useState(false)
  const [draft, setDraft] = useState<Draft>(draftOf())
  const [formError, setFormError] = useState('')
  const now = useNow()
  const { summary } = useMeasured()
  const demo = useMemo(() => demoRigs(now), [now])
  const scroller = useStickToBottom(`${view.kind}-${view.kind === 'rig' ? view.worker : ''}`)

  const commit = useCallback((next: MyRig[]) => {
    setRigs(next)
    saveRigs(next)
  }, [])

  // From Connect my machine: the new worker joins the list with what Connect knew about the machine.
  const took = useRef(false)
  useEffect(() => {
    if (took.current || !handoff?.worker) return
    took.current = true
    const worker = cleanWorker(handoff.worker)
    if (checkWorker(worker).ok)
      commit(upsertRig(loadRigs(), { worker, gpu: handoff.gpu || undefined, gpuCount: num(handoff.gpuCount ?? ''), cpu: handoff.cpu || undefined, threads: num(handoff.threads ?? '') }))
  }, [handoff, commit])

  // scroll to the top whenever the view changes (the shared Screen sticks to the bottom by default)
  const viewKey = `${view.kind}-${view.kind === 'rig' ? view.worker : ''}`
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0
    setPasting(false)
    setNotice('')
    setSharing(false)
  }, [viewKey, scroller])

  const readingOf = (rig: MyRig, isDemo: boolean): RigReading | null => (isDemo ? (demo.find(d => d.rig.worker === rig.worker)?.reading ?? null) : (live[rig.worker] ?? storedReading(rig)))

  const onLog = (rig: MyRig, text: string) => {
    const d = diagnose(text)
    if (d.seedWarning) {
      setNotice('This log contains something that looks like a seed (55 lowercase letters). It was not read. Never paste it anywhere; if it was ever typed into a site, move your funds to a new wallet.')
      return
    }
    const x = extractMetrics(text)
    if (!x.found) {
      setNotice('No numbers in this log yet. Paste lines with the solution counter and it/s, ideally from the start of the run.')
      return
    }
    const faults = d.findings.filter(f => f.severity === 'fault').map(f => f.title)
    const base = readingFromLog(text, rig.worker, new Date(), faults, x)
    const hw = rig.gpu || rig.cpu ? { ...base.hw, ...rigHw(rig), mode: base.hw.mode === 'gpu+cpu' ? 'gpu+cpu' : rigHw(rig).mode, threads: rig.threads ?? base.hw.threads } : base.hw
    const reading = { ...base, hw }
    setLive(p => ({ ...p, [rig.worker]: reading }))
    commit(
      upsertRig(rigs, {
        worker: rig.worker,
        gpu: rig.gpu ?? x.gpu,
        gpuCount: rig.gpuCount ?? x.gpuCount,
        cpu: rig.cpu ?? x.cpu,
        threads: rig.threads ?? x.threads,
        last: toStored(reading),
      }),
    )
    setPasting(false)
    setNotice('')
  }

  const saveDraft = () => {
    const worker = cleanWorker(draft.worker)
    const c = checkWorker(worker)
    if (!c.ok) return setFormError(c.message)
    const cost = num(draft.dailyCost)
    if (cost !== undefined && !(cost > 0 && cost < 100_000)) return setFormError('The daily cost is a number in USD, for example 8.')
    const editing = view.kind === 'edit' ? view.worker : undefined
    const base = editing && editing !== worker ? removeRig(rigs, editing) : rigs
    const old = rigs.find(x => x.worker === editing)
    commit(
      upsertRig(base, {
        ...(old ?? {}),
        worker,
        gpu: draft.gpu.trim() || undefined,
        gpuCount: draft.gpu.trim() ? (num(draft.gpuCount) ?? 1) : undefined,
        cpu: draft.cpu.trim() || undefined,
        threads: num(draft.threads),
        dailyCost: cost,
      }),
    )
    if (editing && editing !== worker && live[editing]) setLive(p => ({ ...p, [worker]: { ...p[editing]!, worker } }))
    setView({ kind: 'rig', worker, demo: false })
  }

  /* ----- views ----- */

  if (view.kind === 'edit') {
    const set = (k: keyof Draft) => (v: string) => {
      setFormError('')
      setDraft(p => ({ ...p, [k]: v }))
    }
    return (
      <Screen
        backLabel="Rigs"
        dock={
          <Chips
            label="Save or cancel"
            onPick={v => (v === 'save' ? saveDraft() : setView(view.worker ? { kind: 'rig', worker: view.worker, demo: false } : { kind: 'list' }))}
            options={[
              { value: 'save', label: view.worker ? 'Save' : 'Add rig', primary: true },
              { value: 'cancel', label: 'Cancel' },
            ]}
          />
        }
        onBack={() => setView({ kind: 'list' })}
        scrollRef={scroller}
        sub="A worker name, and the hardware if you like."
        title={view.worker ? 'Edit rig' : 'Add a rig'}
      >
        <RigForm draft={draft} error={formError} set={set} />
      </Screen>
    )
  }

  if (view.kind === 'stats') {
    return (
      <Screen backLabel="Rigs" dock={<Chips label="Next" onPick={() => setView({ kind: 'list' })} options={[{ value: 'list', label: 'Back to my rigs' }]} />} onBack={() => setView({ kind: 'list' })} scrollRef={scroller} sub="From saved runs and our own field runs." title="Who mines with what">
        <UsageView summary={summary} />
      </Screen>
    )
  }

  if (view.kind === 'rig') {
    const rig = view.demo ? demo.find(d => d.rig.worker === view.worker)?.rig : rigs.find(x => x.worker === view.worker)
    if (!rig) {
      return (
        <Screen backLabel="Rigs" dock={null} onBack={() => setView({ kind: 'list' })} scrollRef={scroller} title="My rig">
          <p className={r.tileNote}>This rig is not in the list any more.</p>
        </Screen>
      )
    }
    const reading = readingOf(rig, view.demo)
    const st = rigStatus(reading, now)
    const peer = standing(reading, summary)
    const dock = pasting ? (
      <>
        <Chips label="Cancel" onPick={() => setPasting(false)} options={[{ value: 'x', label: 'Cancel' }]} />
        <div style={{ marginTop: 8 }}>
          <Field label="Miner log" mono multiline newlines onSubmit={t => onLog(rig, t)} placeholder="Paste the last 30 to 50 lines" rows={4} />
        </div>
      </>
    ) : (
      <Chips
        label="Actions"
        onPick={v => {
          if (v === 'share') setSharing(true)
          else if (v === 'log') setPasting(true)
          else if (v === 'edit') {
            setDraft(draftOf(rig))
            setView({ kind: 'edit', worker: rig.worker })
          }
        }}
        options={[
          ...(reading ? [{ value: 'share', label: 'Share', primary: true }] : []),
          ...(view.demo ? [] : [{ value: 'log', label: reading ? 'Paste a new log' : 'Paste a log', primary: !reading }, { value: 'edit', label: 'Edit' }]),
        ]}
      />
    )
    return (
      <>
        <Screen backLabel="Rigs" dock={dock} onBack={() => setView({ kind: 'list' })} scrollRef={scroller} serif title={shortWorker(rig.worker, 22)}>
          {notice && <p className={s.warn}>{notice}</p>}
          <Dashboard demo={view.demo} now={now} onFix={() => go('doctor')} peer={peer} reading={reading} rig={rig} st={st} />
          {!view.demo && !reading && (
            <p className={s.note}>
              The pool does not report per-worker stats yet. Until it does, paste the miner log: Maria reads the numbers here and the log stays in this browser.
            </p>
          )}
          {!view.demo && (
            <button
              className={r.remove}
              onClick={() => {
                commit(removeRig(rigs, rig.worker))
                setView({ kind: 'list' })
              }}
              type="button"
            >
              Remove from this browser
            </button>
          )}
        </Screen>
        {sharing && reading && <ShareSheet demo={view.demo} onClose={() => setSharing(false)} peer={peer} reading={reading} rig={rig} st={st} />}
      </>
    )
  }

  // the list
  const rows = [...rigs.map(x => ({ rig: x, demo: false })), ...(demoOn ? demo.map(d => ({ rig: d.rig, demo: true })) : [])]
  return (
    <Screen
      dock={
        <Chips
          label="Rigs"
          onPick={v => {
            if (v === 'add') {
              setDraft(draftOf())
              setFormError('')
              setView({ kind: 'edit' })
            } else if (v === 'demo') setDemoOn(d => !d)
            else if (v === 'stats') setView({ kind: 'stats' })
          }}
          options={[
            { value: 'add', label: 'Add a rig', primary: true },
            { value: 'demo', label: demoOn ? 'Hide demo' : 'Show demo' },
          ]}
        />
      }
      onBack={() => go('home')}
      scrollRef={scroller}
      sub="Watch it mine. Share it."
      title="My rig"
    >
      {rows.length === 0 && (
        <p className={s.note}>
          No rigs yet. Add one by its worker name ({POOL.workerPrefix}…), or connect a machine first. Show demo to see how it looks.
        </p>
      )}
      <ListSection label="My rigs" items={rows.filter(x => !x.demo)} now={now} onOpen={(w, d) => setView({ kind: 'rig', worker: w, demo: d })} readingOf={readingOf} />
      <ListSection demo label="Demo rigs" items={rows.filter(x => x.demo)} now={now} onOpen={(w, d) => setView({ kind: 'rig', worker: w, demo: d })} readingOf={readingOf} />
      <motion.button className={r.statsLink} onClick={() => setView({ kind: 'stats' })} transition={SPRING} type="button" whileTap={PRESS}>
        <span>
          <span className={s.rowTitle}>Who mines with what</span>
          <span className={s.rowNote} style={{ display: 'block' }}>
            GPUs, CPUs and setups across our miners
          </span>
        </span>
        <ChevronRight aria-hidden size={18} />
      </motion.button>
    </Screen>
  )
}

function ListSection({
  label,
  items,
  now,
  onOpen,
  readingOf,
  demo,
}: {
  label: string
  items: { rig: MyRig; demo: boolean }[]
  now: Date
  onOpen: (w: string, demo: boolean) => void
  readingOf: (rig: MyRig, demo: boolean) => RigReading | null
  demo?: boolean
}): ReactNode {
  if (!items.length) return null
  return (
    <section>
      <h3 className={s.groupLabel}>
        {label}
        {demo && <span className={cx(r.src, r.srcDemo)} style={{ marginLeft: 8 }}>demo</span>}
      </h3>
      <ul className={s.group}>
        {items.map(({ rig, demo: d }) => {
          const rd = readingOf(rig, d)
          const st = rigStatus(rd, now)
          return (
            <li className={s.row} key={`${d}-${rig.worker}`} style={{ padding: 0 }}>
              <motion.button className={r.rigRow} onClick={() => onOpen(rig.worker, d)} type="button" whileTap={PRESS}>
                <span className={r.rigMain}>
                  <span className={r.rigName}>{shortWorker(rig.worker, 22)}</span>
                  <span className={r.rigHw}>{hwLine(rd?.hw ?? rigHw(rig))}</span>
                  <StatusChip live={st.status === 'mining'} status={st.status} title={st.title} />
                </span>
                <span className={r.rigRate}>
                  <span className={r.rigRateV}>{rd?.solPerHour !== undefined ? fmtSol(rd.solPerHour) : 'n/a'}</span>
                  <span className={r.rigRateU}>sol/h</span>
                </span>
                <ChevronRight aria-hidden className={r.rigChev} size={18} />
              </motion.button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
