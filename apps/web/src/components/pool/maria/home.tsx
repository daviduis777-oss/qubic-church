'use client'

import { motion } from 'framer-motion'
import { Activity, ChartNoAxesColumn, Cpu, LifeBuoy, type LucideIcon, MessageCircle, PlugZap, ScrollText, Search, Stethoscope } from 'lucide-react'
import { type RefObject, useEffect, useId, useRef, useState } from 'react'
import { epochAt, formatLeft } from '@/lib/pool/epoch'
import type { PoolRecord } from '@/lib/pool/ledger-view'
import { APPS, type AppId, askLabel, dockApps, gridApps } from '@/lib/pool/qc'
import type { HaloMode } from './halo-engine'
import { Halo } from './Halo'
import { Seal } from './seal'
import h from './home.module.css'

const GLYPH: Record<AppId, LucideIcon> = {
  pick: Cpu,
  connect: PlugZap,
  doctor: Stethoscope,
  rig: Activity,
  ask: MessageCircle,
  record: ScrollText,
  who: ChartNoAxesColumn,
  help: LifeBuoy,
}

const TAP = { scale: 0.93 }
const cxs = (...c: (string | undefined)[]) => c.filter(Boolean).join(' ')
const EASE = { type: 'spring' as const, stiffness: 600, damping: 38 }

/** The screen's width in px, as the CSS computes it (--u): for what CSS cannot scale, the halo's canvas. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.round(Math.min(e?.contentRect.width ?? 0, ((e?.contentRect.height ?? 0) * 402) / 780))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const pad = (n: number) => String(n).padStart(2, '0')

/** The running epoch, after mount only (the server and the first client render agree on nothing here). */
function useEpoch() {
  const [e, setE] = useState<{ n: number; left: string; ends: string } | null>(null)
  useEffect(() => {
    const tick = () => {
      const x = epochAt()
      setE({ n: x.epoch, left: formatLeft(x.msLeft), ends: `${DAYS[x.end.getUTCDay()]} ${pad(x.end.getUTCHours())}:${pad(x.end.getUTCMinutes())} UTC` })
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])
  return e
}

/** Pool-wide totals for the record widget. Home remounts on every pop, so one read serves a minute. */
let recCache: { at: number; rec: PoolRecord | null } | null = null
function useRecord() {
  const [rec, setRec] = useState<PoolRecord | null | undefined>(() => (recCache && Date.now() - recCache.at < 60_000 ? recCache.rec : undefined))
  useEffect(() => {
    if (recCache && Date.now() - recCache.at < 60_000) return
    const ac = new AbortController()
    fetch('/api/pool/ledger', { cache: 'no-store', signal: ac.signal })
      .then(x => (x.ok ? (x.json() as Promise<PoolRecord>) : null))
      .then(j => {
        const r = j && typeof j.solutions === 'number' ? j : null
        recCache = { at: Date.now(), rec: r }
        setRec(r)
      })
      .catch(() => {
        if (!ac.signal.aborted) setRec(null)
      })
    return () => ac.abort()
  }, [])
  return rec
}

function AppIcon({ id, label, a11y, badge, grad, dock, onOpen }: { id: AppId; label: string; a11y: string; badge?: number; grad: string; dock?: boolean; onOpen: () => void }) {
  const Glyph = GLYPH[id]
  return (
    <motion.button aria-label={a11y} className={h.app} data-app={id} onClick={onOpen} title={dock ? label : undefined} transition={EASE} type="button" whileTap={TAP}>
      <span aria-hidden className={h.icon}>
        <span className={h.face}>
          <Glyph className={h.glyph} color={`url(#${grad})`} strokeWidth={1.6} />
        </span>
        {badge ? <span className={h.badge}>{badge > 9 ? '9+' : badge}</span> : null}
      </span>
      {!dock && (
        <span aria-hidden className={h.label}>
          {label}
        </span>
      )}
    </motion.button>
  )
}

/**
 * Maria's home screen, laid out like an iPhone's: a widget with her halo, a row of apps, two small widgets,
 * the Ask pill where Search sits, and the dock. Every app shows once. Sized in points of a 402 pt screen.
 */
export function HomeScreen({
  ai,
  rigCount,
  ring,
  go,
  titleRef,
}: {
  ai: boolean | null
  rigCount: number
  ring: { mode: HaloMode; tone: string }
  go: (to: AppId) => void
  titleRef: RefObject<HTMLHeadingElement | null>
}) {
  const grad = `qcg${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [box, width] = useWidth<HTMLDivElement>()
  const epoch = useEpoch()
  const rec = useRecord()
  const ask = askLabel(ai)
  // the halo sits in the widget's left third; its canvas needs whole pixels
  const halo = width ? Math.max(96, Math.min(168, Math.round(width * 0.36))) : 0
  const seal = width ? Math.max(20, Math.round(width * 0.075)) : 26
  const meta = (id: AppId) => {
    const a = APPS.find(x => x.id === id)!
    return { label: a.label, a11y: id === 'ask' ? ask.a11y : a.name, badge: id === 'rig' ? rigCount : undefined }
  }

  return (
    <div className={h.home} ref={box}>
      {/* the gold that every glyph is drawn in, defined once */}
      <svg aria-hidden className={h.defs} focusable="false">
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id={grad} x1="0" x2="0" y1="2" y2="22">
            <stop offset="0" stopColor="#fff2b0" />
            <stop offset="0.45" stopColor="#fece34" />
            <stop offset="1" stopColor="#c8960e" />
          </linearGradient>
        </defs>
      </svg>
      <div className={h.wall} aria-hidden />
      <div className={h.screen}>
        <section aria-labelledby={`${grad}w`} className={h.widgetCol}>
          <div className={h.widget}>
            <div className={h.widgetHalo}>{halo > 0 && <Halo face={Math.round(halo * 0.3)} label="Maria" mode={ring.mode} size={halo} tone={ring.tone} />}</div>
            <div className={h.widgetText}>
              {/* a span carries the serif: the site's global heading rule forces its own face on every h2 */}
              <h2 className={h.widgetH} id={`${grad}w`} ref={titleRef} tabIndex={-1}>
                <span className={h.wordmark}>Maria</span>
              </h2>
              <p className={h.role}>Self-learning mining coach</p>
              <p className={h.status}>
                <span aria-hidden className={h.live} />
                {rigCount > 0 ? `${rigCount} rig${rigCount === 1 ? '' : 's'} in this browser` : 'Ready when you are'}
              </p>
            </div>
          </div>
          <span aria-hidden className={h.widgetLabel}>
            Maria
          </span>
        </section>

        <nav aria-label="Maria apps" className={h.grid}>
          {gridApps(ai).map(id => (
            <AppIcon grad={grad} id={id} key={id} onOpen={() => go(id)} {...meta(id)} />
          ))}
        </nav>

        {/* two small widgets, as an iPhone stacks them under a row of apps */}
        <div className={h.smalls}>
          <div className={h.smallCol}>
            <div className={cxs(h.small, h.epochW)}>
              <span className={h.smallKicker}>{epoch ? `Epoch ${epoch.n}` : 'Epoch'}</span>
              <span className={h.smallBig}>{epoch?.left ?? ''}</span>
              <span className={h.smallSub}>left in this epoch</span>
              <span className={h.smallFoot}>{epoch ? `Ends ${epoch.ends}` : ''}</span>
            </div>
            <span aria-hidden className={h.widgetLabel}>
              Epoch
            </span>
          </div>
          <div className={h.smallCol}>
            <motion.button
              aria-label={`The record${rec ? `: ${rec.solutions.toLocaleString('en-US')} solutions recorded` : ''}`}
              className={cxs(h.small, h.recW)}
              onClick={() => go('record')}
              transition={EASE}
              type="button"
              whileTap={{ scale: 0.97 }}
            >
              <span className={h.recTop}>
                <Seal dim={!rec?.entries} size={seal} />
                <span className={h.smallKicker}>Recorded</span>
              </span>
              <span className={h.smallBig}>{rec ? rec.solutions.toLocaleString('en-US') : rec === null ? 'n/a' : ''}</span>
              <span className={h.smallSub}>solutions recorded</span>
              <span className={h.smallFoot}>{rec ? `${rec.rigs.toLocaleString('en-US')} rig${rec.rigs === 1 ? '' : 's'} · ${rec.epochs} epoch${rec.epochs === 1 ? '' : 's'}` : ''}</span>
            </motion.button>
            <span aria-hidden className={h.widgetLabel}>
              The record
            </span>
          </div>
        </div>

        <div className={h.spacer} />

        <motion.button className={h.pill} onClick={() => go('ask')} transition={EASE} type="button" whileTap={{ scale: 0.97 }}>
          <Search aria-hidden size={13} strokeWidth={2.4} />
          {ask.pill}
        </motion.button>

        <nav aria-label="Dock" className={h.dock}>
          {dockApps(ai).map(id => (
            <AppIcon dock grad={grad} id={id} key={id} onOpen={() => go(id)} {...meta(id)} />
          ))}
        </nav>
      </div>
    </div>
  )
}
