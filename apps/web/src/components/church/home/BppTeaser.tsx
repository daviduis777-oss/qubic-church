'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import core from '@/data/bpp/net-core.json'
import { initial, step, wiring, type NetCore } from '@/lib/bpp/sim'

/** The homepage door to BPP-9000: a small live copy of the miners' network, ticking with the real rule. */
const LIVE_AT = Date.UTC(2026, 10, 18, 12)

function MiniNet({ size = 84 }: { size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = core as unknown as NetCore
    const cv = ref.current
    if (!cv) return
    const pr = Math.min(2, window.devicePixelRatio || 1)
    cv.width = size * pr
    cv.height = size * pr
    const g = cv.getContext('2d')!
    g.setTransform(pr, 0, 0, pr, 0, 0)
    const w = wiring(c)
    let s: Uint8Array = initial(c)
    // start where the hour stands, like the page does
    const start = Math.floor(((Date.now() / 1000) % 3600) / 3600 * 13390)
    for (let i = 0; i < start; i++) s = step(c, w, s)
    const cx = size / 2
    const R = size * 0.4
    const others = [...Array(c.n).keys()].filter(n => n !== c.ctrl && n !== c.out)
    const P: [number, number][] = []
    others.forEach((n, i) => {
      const a = (i / others.length) * Math.PI * 2 - Math.PI / 2
      P[n] = [cx + R * Math.cos(a), cx + R * Math.sin(a)]
    })
    P[c.ctrl] = [cx - R * 0.4, cx]
    P[c.out] = [cx + R * 0.4, cx]
    const glow = new Float32Array(c.n)
    const draw = () => {
      g.clearRect(0, 0, size, size)
      g.lineWidth = 0.6
      for (let k = 0; k < c.n * c.k; k++) {
        const t = Math.floor(k / c.k)
        const src = w.nb[k]!
        if (src === t) continue
        g.strokeStyle = glow[t]! > 0.3 ? `rgba(255,214,140,${0.12 + glow[t]! * 0.5})` : 'rgba(255,205,110,.1)'
        g.beginPath()
        g.moveTo(P[src]![0], P[src]![1])
        g.quadraticCurveTo(cx, cx, P[t]![0], P[t]![1])
        g.stroke()
      }
      for (let n = 0; n < c.n; n++) {
        const big = n === c.ctrl || n === c.out
        const v = s[n]
        g.beginPath()
        g.arc(P[n]![0], P[n]![1], big ? 4.2 : 2.8, 0, 7)
        g.fillStyle = v === 1 ? '#FFD68A' : v === 0 ? '#5a3c18' : '#2a2430'
        if (v === 1) {
          g.shadowColor = 'rgba(255,190,80,.9)'
          g.shadowBlur = 6
        }
        g.fill()
        g.shadowBlur = 0
        glow[n]! *= 0.88
      }
    }
    draw()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => {
      const nx = step(c, w, s)
      for (let n = 0; n < c.n; n++) if (nx[n] !== s[n]) glow[n] = 1
      s = nx
    }, 269)
    let raf = 0
    const loop = () => {
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      clearInterval(t)
      cancelAnimationFrame(raf)
    }
  }, [size])
  return <canvas aria-hidden ref={ref} style={{ width: size, height: size, flexShrink: 0 }} />
}

export function BppTeaser() {
  const [signed, setSigned] = useState<number | null>(null)
  const [days, setDays] = useState<number | null>(null)
  useEffect(() => {
    setDays(Math.max(0, Math.floor((LIVE_AT - Date.now()) / 86400000)))
    fetch('/api/bpp/crowd')
      .then(r => r.json())
      .then(j => typeof j.signedUp === 'number' && setSigned(j.signedUp))
      .catch(() => {})
  }, [])
  return (
    <Link
      className="bpp-teaser group mt-6 flex max-w-xl items-center gap-4 rounded-2xl border border-[#FFC46B]/45 bg-[linear-gradient(120deg,rgba(255,196,107,0.12),rgba(11,10,14,0.6)_60%)] p-3 pr-5 text-left transition-colors hover:border-[#FFC46B]/80"
      href="/bpp9000"
    >
      <MiniNet />
      <span className="flex min-w-0 flex-col">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#FFC46B]">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#FFC46B] shadow-[0_0_8px_#FFC46B]" />
          BPP-9000 · running now
        </span>
        <span className="mt-1 text-lg font-semibold leading-snug text-[#FFE3B0]">Watch the Bitcoin predictor Qubic miners grow</span>
        <span className="mt-1 text-sm text-fg-2">
          {days == null ? 'Live calls from 18 November' : days > 0 ? `First live call in ${days} ${days === 1 ? 'day' : 'days'}` : 'Live calls are on'}
          {signed != null && signed > 0 ? ` · ${signed.toLocaleString('en-US')} signed up` : ''}
        </span>
      </span>
      <span aria-hidden className="ml-auto text-2xl text-[#FFC46B] transition-transform group-hover:translate-x-1">
        →
      </span>
      <style>{`@keyframes bpp-teaser{0%,100%{box-shadow:0 0 22px -8px rgba(232,145,46,.45)}50%{box-shadow:0 0 34px -4px rgba(232,145,46,.7)}} .bpp-teaser{animation:bpp-teaser 3s ease-in-out infinite} @media (prefers-reduced-motion: reduce){.bpp-teaser{animation:none}}`}</style>
    </Link>
  )
}
