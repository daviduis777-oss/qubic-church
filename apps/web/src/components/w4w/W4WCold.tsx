'use client'

import { useEffect, useRef } from 'react'

/**
 * The cold, drawn: snow blowing across the hero (over Anna), and frost on the screen edges
 * that recedes as you read down the page. Warmth on this page only comes from the tube-lit numbers.
 */
export function W4WSnow() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const g = c.getContext('2d')
    if (!g) return
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const small = matchMedia('(max-width: 760px)').matches
    let w = 0
    let h = 0
    let dpr = 1
    const N = still ? 70 : small ? 110 : 220
    type F = { x: number; y: number; z: number; r: number; vy: number; ph: number }
    const flakes: F[] = []
    const seed = (f: Partial<F>, top: boolean): F => {
      const z = Math.random() // 0 far .. 1 near
      return { x: Math.random() * w, y: top ? -20 - Math.random() * h * 0.2 : Math.random() * h, z, r: 0.6 + z * z * 3.6, vy: 18 + z * 70, ph: Math.random() * 6.28, ...f }
    }
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 1.5)
      const b = c.getBoundingClientRect()
      w = b.width
      h = b.height
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()
    for (let i = 0; i < N; i++) flakes.push(seed({}, false))
    let visible = true
    let raf = 0
    let last = performance.now()
    let t = 0
    const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting })
    io.observe(c)
    const draw = () => {
      g.clearRect(0, 0, w, h)
      for (const f of flakes) {
        const a = 0.25 + f.z * 0.6
        if (f.z > 0.85) {
          // near flakes are big and out of focus, like snow right in front of your eyes
          const gr = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 2.4)
          gr.addColorStop(0, `rgba(225,240,255,${a * 0.55})`)
          gr.addColorStop(1, 'rgba(225,240,255,0)')
          g.fillStyle = gr
          g.beginPath()
          g.arc(f.x, f.y, f.r * 2.4, 0, 6.283)
          g.fill()
        } else {
          g.fillStyle = `rgba(222,238,255,${a})`
          g.beginPath()
          g.arc(f.x, f.y, f.r, 0, 6.283)
          g.fill()
        }
      }
    }
    const step = (now: number) => {
      raf = requestAnimationFrame(step)
      if (!visible || document.hidden) { last = now; return }
      if (now - last < 1000 / 40) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      t += dt
      const gust = 26 + Math.sin(t * 0.35) * 22 + Math.max(0, Math.sin(t * 0.11)) * 60
      for (const f of flakes) {
        f.y += f.vy * dt
        f.x += (gust * (0.4 + f.z) + Math.sin(t * 1.3 + f.ph) * 12) * dt
        if (f.y > h + 10 || f.x > w + 30) Object.assign(f, seed({ x: f.x > w + 30 ? -20 : Math.random() * w }, f.y > h + 10))
      }
      draw()
    }
    const ro = new ResizeObserver(() => { size(); draw() })
    ro.observe(c)
    if (still) draw()
    else raf = requestAnimationFrame(step)
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect() }
  }, [])
  return <canvas aria-hidden className="w4w-snow" ref={ref} />
}

/** Frost on the edges of the screen. Thick at the top of the page, thinning as you read on. */
export function W4WFrost() {
  useEffect(() => {
    const root = document.documentElement
    const on = () => {
      const max = Math.max(1, document.body.scrollHeight - innerHeight)
      const k = Math.min(1, scrollY / max)
      root.style.setProperty('--w4w-frost', String(1 - k * 0.7))
      root.style.setProperty('--w4w-thaw', String(k))
    }
    on()
    addEventListener('scroll', on, { passive: true })
    addEventListener('resize', on)
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); root.style.removeProperty('--w4w-frost'); root.style.removeProperty('--w4w-thaw') }
  }, [])
  return <div aria-hidden className="w4w-frost" />
}
