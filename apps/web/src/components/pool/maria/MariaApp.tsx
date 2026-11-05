'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Activity, ChevronRight, Cpu, MessageCircle, PlugZap, Stethoscope } from 'lucide-react'
import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { diagnose } from '@/lib/pool/doctor'
import { poolFontVars } from '../fonts'
import { AskFlow } from './AskFlow'
import { AiContext, type Answers, NavFocus, RingContext } from './flow'
import { ConnectFlow, DoctorFlow, type Go, PickFlow, type Screen } from './flows'
import { Halo } from './Halo'
import { MeasuredProvider } from './measured'
import { RigFlow } from './rig'
import { loadRigs } from '@/lib/pool/rig'
import type { HaloMode as RingMode } from './halo-engine'
import { cx, Field, PRESS, SPRING, TONE } from './ui'
import s from './maria.module.css'

const GOLD_TILE = { background: 'linear-gradient(160deg, #fff0a8 0%, #fece34 42%, #b18406 100%)', color: '#000' }
const CHAR_TILE = { background: 'linear-gradient(160deg, #3a3834 0%, #1c1b19 100%)', color: '#fece34' }

type Entry = { id: number; screen: Screen; dir: 1 | -1; handoff?: Answers; first?: string; leaving?: 1 | -1; still?: boolean }

const TILES: { id: Exclude<Screen, 'home' | 'rig'>; title: string; sub: string; off?: string; icon: ReactNode; look: CSSProperties }[] = [
  { id: 'pick', title: 'Pick hardware', sub: 'Buy, rent, or check yours', icon: <Cpu size={20} strokeWidth={2} />, look: GOLD_TILE },
  { id: 'connect', title: 'Connect my machine', sub: 'PC, Mac, rig or rented box', icon: <PlugZap size={20} strokeWidth={2} />, look: CHAR_TILE },
  { id: 'doctor', title: 'Fix my rig', sub: 'Paste a log or a symptom', icon: <Stethoscope size={20} strokeWidth={2} />, look: CHAR_TILE },
  { id: 'ask', title: 'Ask Maria', sub: 'Anything technical', off: 'Coming soon', icon: <MessageCircle size={20} strokeWidth={2} />, look: CHAR_TILE },
]

/**
 * Maria, the mining coach: a self-contained app. It needs nothing from the page around it
 * except a box to fill (and an optional --safe-top for a status bar), so it can move into a native shell.
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

  const remove = useCallback((id: number) => setEntries(prev => prev.filter(e => e.id !== id || !e.leaving)), [])
  // Safety net: an exit that never reports completion is removed anyway.
  useEffect(() => {
    if (!entries.some(e => e.leaving)) return
    const t = setTimeout(() => setEntries(prev => prev.filter(e => !e.leaving)), 900)
    return () => clearTimeout(t)
  }, [entries])

  // back on Home after a pop: focus her name, the screen's title
  const homeId = entries.find(e => e.screen === 'home' && !e.leaving)?.id
  useEffect(() => {
    if (homeId === undefined || !navigated.current) return
    const t = setTimeout(() => wordmarkRef.current?.focus({ preventScroll: true }), 30)
    return () => clearTimeout(t)
  }, [homeId])

  const fromComposer = (text: string) => {
    // A pasted log goes to the log doctor, which runs here; a question goes to the AI.
    if (text.includes('\n') && diagnose(text).findings.length) return go('doctor', { mode: text })
    ;(go as (to: Screen, h?: Answers, first?: string) => void)('ask', undefined, text)
  }

  // Push and pop, like UINavigationController. Every screen is opaque. On a push the new screen slides in on top
  // and the old one drifts back 30% and dims; a pop mirrors it. The leaving node is removed when its exit ends.
  const enter = (d: number) => (reduce ? { opacity: 0, x: 0 } : { x: d > 0 ? '100%' : '-30%', opacity: d > 0 ? 1 : 0.55 })
  const center = { x: '0%', opacity: 1, transition: reduce ? { duration: 0.12 } : { x: SPRING, opacity: { duration: 0.3 } } }
  const exit = (d: number) => ({ x: d > 0 ? '-30%' : '100%', opacity: d > 0 ? 0.55 : 1, transition: { x: { type: 'tween' as const, ease: [0.32, 0.72, 0, 1] as const, duration: 0.42 }, opacity: { duration: 0.42 } } })
  const reduceRef = useRef(reduce)
  reduceRef.current = reduce

  const rigTile = (
    <motion.button className={`${s.tile} ${s.tileWide}`} onClick={() => go('rig')} transition={SPRING} type="button" whileTap={PRESS}>
      <span aria-hidden className={s.glyph} style={GOLD_TILE}>
        <Activity size={20} strokeWidth={2.2} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className={s.tileTitle}>My rig</span>
        <span className={s.tileSub}>{rigCount ? `${rigCount} rig${rigCount === 1 ? '' : 's'} in this browser` : 'Paste a log, see the numbers. Share it.'}</span>
      </span>
      <ChevronRight aria-hidden className={s.tileChev} size={18} />
    </motion.button>
  )

  // Home keeps its scroll position between visits; a pushed flow always starts at the top (it is a new node).
  const homeScroll = useRef(0)

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
                {e.screen === 'home' && (
                  <>
                    <div
                      className={s.home}
                      onScroll={e => {
                        homeScroll.current = e.currentTarget.scrollTop
                      }}
                      ref={el => {
                        if (el && homeScroll.current) el.scrollTop = homeScroll.current
                      }}
                    >
                      <div className={s.presence}>
                        <Halo face={62} label="Maria" mode={ring.mode} size={216} tone={ring.tone} />
                        {/* a span carries the serif: the site's global heading rule forces its own face on every h2 */}
                        <h2 className={s.wordmarkH} ref={wordmarkRef} tabIndex={-1}>
                          <span className={s.wordmark}>Maria</span>
                        </h2>
                        <p className={s.homeLine}>What are we working on?</p>
                      </div>
                      <nav aria-label="Maria tools" className={s.tiles}>
                        {/* a returning miner sees My rig first; a newcomer starts with Pick hardware */}
                        {rigCount > 0 && rigTile}
                        {TILES.map(t => {
                          // the AI is not connected: the tile says so, and opens the "coming soon" screen with the tools
                          const off = t.off && ai === false
                          return (
                            <motion.button className={cx(s.tile, off && s.tileOff)} key={t.id} onClick={() => go(t.id)} transition={SPRING} type="button" whileTap={PRESS}>
                              <span aria-hidden className={s.glyph} style={t.look}>
                                {t.icon}
                              </span>
                              <span>
                                <span className={s.tileTitle}>{t.title}</span>
                                <span className={s.tileSub}>{off ? t.off : t.sub}</span>
                              </span>
                            </motion.button>
                          )
                        })}
                        {rigCount === 0 && rigTile}
                      </nav>
                    </div>
                    {ai ? (
                      <div className={s.dock}>
                        <Field autoFocus={false} label="Ask Maria" multiline onSubmit={fromComposer} placeholder="Ask Maria" />
                      </div>
                    ) : (
                      ai === false && (
                        <div className={s.dock}>
                          <p className={s.dockNote}>Questions to Maria are coming soon. The three tools above work now.</p>
                        </div>
                      )
                    )}
                  </>
                )}
                {e.screen === 'pick' && <PickFlow go={go} />}
                {e.screen === 'connect' && <ConnectFlow go={go} handoff={e.handoff} />}
                {e.screen === 'doctor' && <DoctorFlow go={go} initial={e.handoff} />}
                {e.screen === 'ask' && <AskFlow first={e.first} go={go} />}
                {e.screen === 'rig' && <RigFlow go={go} handoff={e.handoff} />}
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
