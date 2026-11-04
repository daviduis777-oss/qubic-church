'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Cpu, MessageCircle, PlugZap, Stethoscope } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import { diagnose } from '@/lib/pool/doctor'
import { poolFontVars } from '../fonts'
import { AskFlow } from './AskFlow'
import { type Answers, RingContext } from './flow'
import { ConnectFlow, DoctorFlow, type Go, PickFlow, type Screen } from './flows'
import { Ring, type RingMode } from './Ring'
import { Field, PRESS, SPRING, TONE } from './ui'
import s from './maria.module.css'

const TILES: { id: Exclude<Screen, 'home'>; title: string; sub: string; icon: ReactNode; bg: string }[] = [
  { id: 'pick', title: 'Pick hardware', sub: 'Buy, rent, or check yours', icon: <Cpu size={20} strokeWidth={2} />, bg: 'linear-gradient(160deg, #f0c062 0%, #d9a441 45%, #a8741e 100%)' },
  { id: 'connect', title: 'Connect my machine', sub: 'PC, Mac, rig or rented box', icon: <PlugZap size={20} strokeWidth={2} />, bg: 'linear-gradient(160deg, #8eeaff 0%, #3a8fe0 48%, #1d2c8f 100%)' },
  { id: 'doctor', title: 'Fix my rig', sub: 'Paste a log or a symptom', icon: <Stethoscope size={20} strokeWidth={2} />, bg: 'linear-gradient(160deg, #ff9d8a 0%, #ff7a6b 45%, #c2405f 100%)' },
  { id: 'ask', title: 'Ask Maria', sub: 'Anything technical', icon: <MessageCircle size={20} strokeWidth={2} />, bg: 'linear-gradient(160deg, #b6efe6 0%, #8fd3c8 40%, #2f7f8f 100%)' },
]

/**
 * Maria, the mining coach: a self-contained app. It needs nothing from the page around it
 * except a box to fill (and an optional --safe-top for a status bar), so it can move into a native shell.
 */
export function MariaApp() {
  const [screen, setScreen] = useState<Screen>('home')
  const [dir, setDir] = useState<1 | -1>(1)
  const [handoff, setHandoff] = useState<Answers | undefined>()
  const [first, setFirst] = useState<string | undefined>()
  const [ring, setRing] = useState<{ mode: RingMode; tone: string }>({ mode: 'idle', tone: TONE.gold })
  const [status, setStatus] = useState('')
  const key = useRef(0)
  const reduce = useReducedMotion()

  const api = useMemo(
    () => ({
      think: () => {
        setRing({ mode: 'thinking', tone: TONE.cyan })
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
    (to, h) => {
      key.current++
      setDir(to === 'home' ? -1 : 1)
      setHandoff(h)
      if (to !== 'ask') setFirst(undefined)
      setScreen(to)
      api.idle()
    },
    [api],
  )

  const fromComposer = (text: string) => {
    // A pasted log goes to the log doctor, which runs here; a question goes to the AI.
    if (text.includes('\n') && diagnose(text).findings.length) return go('doctor', { mode: text })
    setFirst(text)
    go('ask')
  }

  // Push and pop, like a navigation controller: the new screen slides in, the old one drifts back and dims.
  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { x: d > 0 ? '100%' : '-28%', opacity: d > 0 ? 1 : 0.6 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { x: d > 0 ? '-28%' : '100%', opacity: d > 0 ? 0.6 : 1 }),
  }

  return (
    <RingContext.Provider value={ctx}>
      <div className={`${s.app} ${poolFontVars}`}>
        <p aria-live="polite" className={s.srOnly}>
          {status}
        </p>
        <div className={s.stack}>
          <AnimatePresence custom={dir} initial={false}>
            <motion.div
              animate="center"
              className={s.screen}
              custom={dir}
              exit="exit"
              initial="enter"
              key={`${screen}-${key.current}`}
              style={{ zIndex: dir > 0 ? 2 : 1, boxShadow: dir > 0 && !reduce ? '-12px 0 30px -10px rgba(3,4,20,0.6)' : undefined }}
              transition={reduce ? { duration: 0.15 } : SPRING}
              variants={variants}
            >
              {screen === 'home' && (
                <>
                  <div className={s.home}>
                    <div className={s.presence}>
                      <div className={s.ringWrap}>
                        <Ring label="Maria" mode={ring.mode} size={212} tone={ring.tone} />
                        {/* biome-ignore lint/performance/noImgElement: tiny local asset */}
                        <img alt="" className={s.ringFace} height={64} src="/pool/maria-128.webp" width={64} />
                      </div>
                      <h2 className={s.wordmark}>Maria</h2>
                      <p className={s.homeLine}>What are we working on?</p>
                    </div>
                    <nav aria-label="Maria tools" className={s.tiles}>
                      {TILES.map(t => (
                        <motion.button className={s.tile} key={t.id} onClick={() => go(t.id)} transition={SPRING} type="button" whileTap={PRESS}>
                          <span aria-hidden className={s.glyph} style={{ background: t.bg }}>
                            {t.icon}
                          </span>
                          <span>
                            <span className={s.tileTitle}>{t.title}</span>
                            <span className={s.tileSub}>{t.sub}</span>
                          </span>
                        </motion.button>
                      ))}
                    </nav>
                  </div>
                  <div className={s.dock}>
                    <Field autoFocus={false} label="Ask Maria" multiline onSubmit={fromComposer} placeholder="Ask Maria" />
                  </div>
                </>
              )}
              {screen === 'pick' && <PickFlow go={go} />}
              {screen === 'connect' && <ConnectFlow go={go} handoff={handoff} />}
              {screen === 'doctor' && <DoctorFlow go={go} initial={handoff} />}
              {screen === 'ask' && <AskFlow first={first} go={go} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </RingContext.Provider>
  )
}
