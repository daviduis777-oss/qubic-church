'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { poolFontVars } from '../fonts'
import { HelpApp, RecordApp, WhoApp } from './apps'
import { AskFlow } from './AskFlow'
import { AiContext, type Answers, NavFocus, RingContext } from './flow'
import { ConnectFlow, DoctorFlow, type Go, PickFlow, type Screen } from './flows'
import { HomeScreen } from './home'
import { MeasuredProvider } from './measured'
import { ReportApp } from './report'
import { TipApp } from './tip'
import { RigFlow } from './rig'
import { OPEN_APP_EVENT, type OpenApp } from '@/lib/pool/qc'
import { loadRigs } from '@/lib/pool/rig'
import type { HaloMode as RingMode } from './halo-engine'
import { SPRING, TONE } from './ui'
import s from './maria.module.css'

type Entry = { id: number; screen: Screen; dir: 1 | -1; handoff?: Answers; first?: string; leaving?: 1 | -1; still?: boolean }

/**
 * Maria, the mining coach: a self-contained app. Home is an iPhone home screen; each app opens with a push.
 * It needs nothing from the page around it except a box to fill (and an optional --safe-top for a status
 * bar), so it can move into a native shell.
 */
export function MariaApp({ ai: aiHint }: { ai?: boolean } = {}) {
  // The navigation stack: the current screen, plus at most one screen on its way out.
  const [entries, setEntries] = useState<Entry[]>([{ id: 0, screen: 'home', dir: 1, still: true }])
  const nextId = useRef(1)
  const [ring, setRing] = useState<{ mode: RingMode; tone: string }>({ mode: 'idle', tone: TONE.gold })
  const [status, setStatus] = useState('')
  const reduce = useReducedMotion()
  // Is the AI connected? The page may pass what it knows; the gated GET probe has the last word.
  const [ai, setAi] = useState<boolean | null>(aiHint ?? null)
  useEffect(() => {
    let live = true
    fetch('/api/pool/maria', { cache: 'no-store' })
      .then(r => (r.ok ? (r.json() as Promise<{ ai?: boolean }>) : { ai: false }))
      .then(j => {
        if (live) setAi(Boolean(j.ai))
      })
      .catch(() => {
        if (live) setAi(false)
      })
    return () => {
      live = false
    }
  }, [])
  // focus follows navigation only after the first move, never on page load
  const navigated = useRef(false)
  const navFocus = useMemo(() => ({ armed: () => navigated.current }), [])
  const wordmarkRef = useRef<HTMLHeadingElement>(null)
  // rigs saved in this browser, read after mount so the server render and the first client render agree
  const [rigCount, setRigCount] = useState(0)
  useEffect(() => {
    if (entries.some(e => e.screen === 'home' && !e.leaving)) setRigCount(loadRigs().length)
  }, [entries])

  const api = useMemo(
    () => ({
      think: () => {
        setRing({ mode: 'thinking', tone: TONE.gold })
        setStatus('Maria is working')
      },
      settle: (tone: string) => {
        setRing({ mode: 'settled', tone })
        setStatus('Result ready')
      },
      idle: () => {
        setRing({ mode: 'idle', tone: TONE.gold })
        setStatus('')
      },
    }),
    [],
  )
  const ctx = useMemo(() => ({ ...api, state: ring }), [api, ring])

  const go: Go = useCallback(
    (to, h, first?: string) => {
      const dir: 1 | -1 = to === 'home' ? -1 : 1
      navigated.current = true
      setEntries(prev => {
        const cur = prev.find(e => !e.leaving)
        // A tap during a transition cancels the older exit: never more than two nodes, never a stale one.
        const out = cur && !reduceRef.current ? [{ ...cur, leaving: dir }] : []
        return [...out, { id: nextId.current++, screen: to, dir, handoff: h, first: to === 'ask' ? first : undefined }]
      })
      api.idle()
    },
    [api],
  )

  // The page can open an app on the phone: its "Report a bug, idea or update" link, or a #report link.
  useEffect(() => {
    const open = (ev: Event) => {
      const d = (ev as CustomEvent<OpenApp>).detail
      if (d?.app) go(d.app, { from: d.from || 'page' })
    }
    window.addEventListener(OPEN_APP_EVENT, open)
    if (window.location.hash === '#report') go('report', { from: 'page' })
    return () => window.removeEventListener(OPEN_APP_EVENT, open)
  }, [go])

  const remove = useCallback((id: number) => setEntries(prev => prev.filter(e => e.id !== id || !e.leaving)), [])
  // Safety net: an exit that never reports completion is removed anyway.
  useEffect(() => {
    if (!entries.some(e => e.leaving)) return
    const t = setTimeout(() => setEntries(prev => prev.filter(e => !e.leaving)), 900)
    return () => clearTimeout(t)
  }, [entries])

  // back on Home after a pop: focus her name in the widget, the screen's title
  const homeId = entries.find(e => e.screen === 'home' && !e.leaving)?.id
  useEffect(() => {
    if (homeId === undefined || !navigated.current) return
    const t = setTimeout(() => wordmarkRef.current?.focus({ preventScroll: true }), 30)
    return () => clearTimeout(t)
  }, [homeId])

  // Push and pop, like UINavigationController. Every screen is opaque. On a push the new screen slides in on top
  // and the old one drifts back 30% and dims; a pop mirrors it. The leaving node is removed when its exit ends.
  const enter = (d: number) => (reduce ? { opacity: 0, x: 0 } : { x: d > 0 ? '100%' : '-30%', opacity: d > 0 ? 1 : 0.55 })
  const center = { x: '0%', opacity: 1, transition: reduce ? { duration: 0.12 } : { x: SPRING, opacity: { duration: 0.3 } } }
  const exit = (d: number) => ({ x: d > 0 ? '-30%' : '100%', opacity: d > 0 ? 0.55 : 1, transition: { x: { type: 'tween' as const, ease: [0.32, 0.72, 0, 1] as const, duration: 0.42 }, opacity: { duration: 0.42 } } })
  const reduceRef = useRef(reduce)
  reduceRef.current = reduce

  return (
    <RingContext.Provider value={ctx}>
      <AiContext.Provider value={ai}>
      <NavFocus.Provider value={navFocus}>
      <MeasuredProvider>
        <div className={`${s.app} ${poolFontVars}`}>
          <p aria-live="polite" className={s.srOnly}>
            {status}
          </p>
          <div className={s.stack}>
            {entries.map(e => (
              <motion.div
                animate={e.leaving ? exit(e.leaving) : center}
                aria-hidden={e.leaving ? true : undefined}
                className={s.screen}
                data-screen={e.screen}
                initial={e.still ? false : enter(e.dir)}
                inert={e.leaving ? true : undefined}
                key={e.id}
                onAnimationComplete={() => {
                  if (e.leaving) remove(e.id)
                }}
                style={{ zIndex: e.leaving ? (e.leaving > 0 ? 1 : 2) : e.dir > 0 ? 2 : 1, boxShadow: reduce ? undefined : '-14px 0 32px -12px rgba(0,0,0,0.85)' }}
              >
                {e.screen === 'home' && <HomeScreen ai={ai} go={id => go(id)} rigCount={rigCount} ring={ring} titleRef={wordmarkRef} />}
                {e.screen === 'pick' && <PickFlow go={go} />}
                {e.screen === 'connect' && <ConnectFlow go={go} handoff={e.handoff} />}
                {e.screen === 'doctor' && <DoctorFlow go={go} initial={e.handoff} />}
                {e.screen === 'ask' && <AskFlow first={e.first} go={go} />}
                {e.screen === 'rig' && <RigFlow go={go} handoff={e.handoff} />}
                {e.screen === 'record' && <RecordApp go={go} />}
                {e.screen === 'who' && <WhoApp go={go} />}
                {e.screen === 'help' && <HelpApp go={go} />}
                {e.screen === 'report' && <ReportApp from={e.handoff} go={go} />}
                {e.screen === 'tip' && <TipApp go={go} />}
              </motion.div>
            ))}
          </div>
        </div>
      </MeasuredProvider>
      </NavFocus.Provider>
      </AiContext.Provider>
    </RingContext.Provider>
  )
}
