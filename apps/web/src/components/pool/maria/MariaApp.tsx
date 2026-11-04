'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { diagnose } from '@/lib/pool/doctor'
import { AskFlow } from './AskFlow'
import { type Answers, RingContext } from './flow'
import { ConnectFlow, DoctorFlow, type Go, PickFlow } from './flows'
import { Ring, type RingMode } from './Ring'
import { Field, TONE } from './ui'
import s from './maria.module.css'

type Screen = 'home' | 'pick' | 'connect' | 'doctor' | 'ask'

const TILES: { id: Exclude<Screen, 'home'>; title: string; sub: string }[] = [
  { id: 'pick', title: 'Pick hardware', sub: 'Buy, rent, or check yours' },
  { id: 'connect', title: 'Connect my machine', sub: 'PC, Mac, rig or rented box' },
  { id: 'doctor', title: 'Fix my rig', sub: 'Paste a log or pick a symptom' },
  { id: 'ask', title: 'Ask Maria', sub: 'Anything technical' },
]

const TITLE: Record<Screen, string> = { home: '', pick: 'Pick hardware', connect: 'Connect my machine', doctor: 'Fix my rig', ask: '' }

/**
 * Maria, the mining coach: a self-contained app. It needs nothing from the page around it
 * except a box to fill, so it can later move into a native shell as it is.
 */
export function MariaApp() {
  const [screen, setScreen] = useState<Screen>('home')
  const [handoff, setHandoff] = useState<Answers | undefined>()
  const [first, setFirst] = useState<string | undefined>()
  const [ring, setRing] = useState<{ mode: RingMode; tone: string }>({ mode: 'idle', tone: TONE.brass })
  const [status, setStatus] = useState('')
  const key = useRef(0)

  const api = useMemo(
    () => ({
      think: () => {
        setRing({ mode: 'thinking', tone: TONE.brass })
        setStatus('Maria is working')
      },
      settle: (tone: string) => {
        setRing({ mode: 'settled', tone })
        setStatus('Result ready')
      },
      idle: () => {
        setRing({ mode: 'idle', tone: TONE.brass })
        setStatus('')
      },
    }),
    [],
  )

  const go: Go = useCallback(
    (to, h) => {
      key.current++
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

  return (
    <RingContext.Provider value={api}>
      <div className={s.app}>
        <p aria-live="polite" className={s.srOnly}>
          {status}
        </p>
        {screen === 'home' ? (
          <>
            <div className={s.home}>
              <div className={s.presence}>
                <Ring label="Maria" mode={ring.mode} size={196} tone={ring.tone} />
                <h2 className={s.wordmark}>Maria</h2>
                <p className={s.homeLine}>What are we working on?</p>
              </div>
              <nav aria-label="Maria tools" className={s.tiles}>
                {TILES.map(t => (
                  <button className={s.tile} key={t.id} onClick={() => go(t.id)} type="button">
                    <span className={s.tileTitle}>{t.title}</span>
                    <span className={s.tileSub}>{t.sub}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div className={s.dock}>
              <Field autoFocus={false} label="Ask Maria" multiline onSubmit={fromComposer} placeholder="Ask Maria" />
            </div>
          </>
        ) : (
          <>
            <header className={s.bar}>
              <button aria-label="Back to home" className={s.iconBtn} onClick={() => go('home')} type="button">
                <ChevronLeft aria-hidden size={22} />
              </button>
              <div className={s.barTitle}>
                <Ring mode={ring.mode} size={30} tone={ring.tone} />
                <span>
                  <span className={s.barWordmark}>Maria</span>
                  <span className={s.barSub}>{TITLE[screen]}</span>
                </span>
              </div>
              <span />
            </header>
            {screen === 'pick' && <PickFlow go={go} key={key.current} />}
            {screen === 'connect' && <ConnectFlow go={go} handoff={handoff} key={key.current} />}
            {screen === 'doctor' && <DoctorFlow go={go} initial={handoff} key={key.current} />}
            {screen === 'ask' && <AskFlow first={first} go={go} key={key.current} />}
          </>
        )}
      </div>
    </RingContext.Provider>
  )
}
