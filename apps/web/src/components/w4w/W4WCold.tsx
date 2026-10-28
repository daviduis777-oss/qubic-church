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
    const g = c.getContext('2d', { alpha: true })
    if (!g) return
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    // flakes are drawn from three ready sprites (no gradients per frame), at 1x pixels: snow needs no retina
    const sprite = (r: number, soft: boolean) => {
      const s = document.createElement('canvas')
      const n = Math.ceil(r * 2 + 4)
      s.width = s.height = n
      const x = s.getContext('2d')!
      const gr = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2)
      gr.addColorStop(0, 'rgba(232,244,255,1)')
      gr.addColorStop(soft ? 0.15 : 0.55, soft ? 'rgba(232,244,255,.55)' : 'rgba(232,244,255,.9)')
      gr.addColorStop(1, 'rgba(232,244,255,0)')
      x.fillStyle = gr
      x.fillRect(0, 0, n, n)
      return s
    }
    const SP = [sprite(1.6, false), sprite(3, false), sprite(9, true)]
    let w = 0
    let h = 0
    type F = { x: number; y: number; z: number; s: number; vy: number; ph: number }
    let flakes: F[] = []
    const make = (top: boolean): F => {
      const z = Math.random()
      return { x: Math.random() * w, y: top ? -30 : Math.random() * h, z, s: z > 0.97 ? 2 : z > 0.5 ? 1 : 0, vy: 22 + z * 80, ph: Math.random() * 6.28 }
    }
    const size = () => {
      w = innerWidth
      h = innerHeight
      c.width = w
      c.height = h
      const want = Math.min(still ? 80 : 260, Math.round((w * h) / 8000))
      while (flakes.length < want) flakes.push(make(false))
      flakes = flakes.slice(0, want)
    }
    size()
    let raf = 0
    let last = performance.now()
    let t = 0
    const draw = () => {
      // the snow eases off as you read further down: the thaw
      const fade = 1 - 0.75 * (Number(document.documentElement.style.getPropertyValue('--w4w-thaw')) || 0)
      g.clearRect(0, 0, w, h)
      for (const f of flakes) {
        const img = SP[f.s]!
        const k = f.s === 2 ? 1 + (f.z - 0.97) * 10 : 0.6 + f.z * 0.6
        const d = img.width * k
        g.globalAlpha = (f.s === 2 ? 0.28 : 0.3 + f.z * 0.6) * fade
        g.drawImage(img, f.x - d / 2, f.y - d / 2, d, d)
      }
      g.globalAlpha = 1
    }
    const step = (now: number) => {
      raf = requestAnimationFrame(step)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (document.hidden) return
      t += dt
      const gust = 24 + Math.sin(t * 0.35) * 20 + Math.max(0, Math.sin(t * 0.11)) * 55
      for (const f of flakes) {
        f.y += f.vy * dt
        f.x += (gust * (0.4 + f.z) + Math.sin(t * 1.3 + f.ph) * 12) * dt
        if (f.y > h + 30) Object.assign(f, make(true))
        else if (f.x > w + 30) f.x = -30
      }
      draw()
    }
    addEventListener('resize', size)
    if (still) draw()
    else raf = requestAnimationFrame(step)
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size) }
  }, [])
  return <canvas aria-hidden className="w4w-snow" ref={ref} />
}

/** Frost on the edges of the screen. Thick at the top of the page, thinning as you read on. */
export function W4WFrost() {
  useEffect(() => {
    const root = document.documentElement
    const on = () => {
      const main = document.querySelector('.w4w') as HTMLElement | null
      const end = main ? main.offsetTop + main.offsetHeight : document.body.scrollHeight
      const k = Math.min(1, Math.max(0, scrollY / Math.max(1, end - innerHeight)))
      root.style.setProperty('--w4w-frost', String(1 - k * 0.85))
      root.style.setProperty('--w4w-thaw', String(k))
      // warmth comes late: nothing in the first third, full at the end
      root.style.setProperty('--w4w-warmth', String(Math.min(1, Math.max(0, (k - 0.3) / 0.6)) ** 1.3))
    }
    on()
    addEventListener('scroll', on, { passive: true })
    addEventListener('resize', on)
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); root.style.removeProperty('--w4w-frost'); root.style.removeProperty('--w4w-thaw'); root.style.removeProperty('--w4w-warmth') }
  }, [])
  return <div aria-hidden className="w4w-frost" />
}
