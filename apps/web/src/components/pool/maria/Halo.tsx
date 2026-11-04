'use client'

import { useEffect, useRef } from 'react'
import { createHalo, type Halo as Engine, type HaloMode } from './halo-engine'
import s from './maria.module.css'

/**
 * Maria's face inside her golden halo. The engine runs only while the halo is on screen and the tab is visible;
 * with prefers-reduced-motion it draws one composed still frame per state.
 */
export function Halo({ size, face, mode, tone, label }: { size: number; face: number; mode: HaloMode; tone: string; label?: string }) {
  const back = useRef<HTMLCanvasElement>(null)
  const front = useRef<HTMLCanvasElement>(null)
  const eng = useRef<Engine | null>(null)
  const reduce = useRef(false)

  useEffect(() => {
    const b = back.current
    const f = front.current
    if (!b || !f) return
    let e: Engine
    try {
      e = createHalo(b, f, { size, face, dpr: window.devicePixelRatio || 1 })
    } catch {
      return
    }
    eng.current = e
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = true
    const apply = () => {
      reduce.current = mq.matches
      if (mq.matches) e.still()
      else if (visible && !document.hidden) e.start()
      else e.stop()
    }
    const io = new IntersectionObserver(([x]) => {
      visible = Boolean(x?.isIntersecting)
      apply()
    })
    io.observe(b)
    document.addEventListener('visibilitychange', apply)
    mq.addEventListener('change', apply)
    apply()
    // test and perf hook: the harness can reach the engine through the canvas
    ;(b as HTMLCanvasElement & { __halo?: Engine }).__halo = e
    return () => {
      e.stop()
      io.disconnect()
      document.removeEventListener('visibilitychange', apply)
      mq.removeEventListener('change', apply)
      eng.current = null
    }
  }, [size, face])

  useEffect(() => {
    const e = eng.current
    if (!e) return
    e.set(mode, tone)
    if (reduce.current) e.still()
  }, [mode, tone])

  return (
    <div aria-label={label} className={s.halo} role={label ? 'img' : undefined} style={{ width: size, height: size }}>
      <canvas aria-hidden className={s.haloCanvas} height={size} ref={back} style={{ width: size, height: size }} width={size} />
      {/* biome-ignore lint/performance/noImgElement: tiny local asset */}
      <img alt="" className={s.haloFace} height={face} src="/pool/maria-256.webp" style={{ width: face, height: face }} width={face} />
      <canvas aria-hidden className={s.haloCanvas} height={size} ref={front} style={{ width: size, height: size }} width={size} />
    </div>
  )
}
