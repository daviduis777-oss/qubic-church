import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import core from '@/data/bpp/net-core.json'
import { getParticipant } from '@/lib/bpp/store'
import { statsOf } from '@/lib/bpp/stats'
import { initial, step, wiring, type NetCore } from '@/lib/bpp/sim'

/** The card a participant posts ("<name> × BPP-9000 · Day N", the KDA line) and the page's own preview card. */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function fonts() {
  const dir = path.join(process.cwd(), 'public', 'fonts')
  const f = (n: string) => readFile(path.join(dir, n))
  const [regular, bold, light, medium, eng] = await Promise.all([f('Geist-Regular.ttf'), f('Geist-Bold.ttf'), f('BigShouldersDisplay-Light.woff'), f('BigShouldersDisplay-Medium.woff'), f('Michroma-Regular.woff')])
  return [
    { name: 'Geist', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Geist', data: bold, weight: 700 as const, style: 'normal' as const },
    { name: 'Nx', data: light, weight: 300 as const, style: 'normal' as const },
    { name: 'Nx', data: medium, weight: 500 as const, style: 'normal' as const },
    { name: 'Eng', data: eng, weight: 400 as const, style: 'normal' as const },
  ]
}

const HOT = '#FFE3B0'
const FIL = '#FFC46B'
const DIM = '#93857a'
const INK = '#ecdfcb'
const money = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: n < 1000 ? 2 : 0 })}`

/** The real network at some tick, drawn as the ring on the page. */
function ringSvg(size: number, tick: number) {
  const c = core as unknown as NetCore
  const w = wiring(c)
  let s: Uint8Array = initial(c)
  for (let i = 0; i < tick; i++) s = step(c, w, s)
  const cx = size / 2
  const cy = size / 2
  const R = size * 0.42
  const others = [...Array(c.n).keys()].filter(n => n !== c.ctrl && n !== c.out)
  const P: [number, number][] = []
  others.forEach((n, i) => {
    const a = (i / others.length) * Math.PI * 2 - Math.PI / 2 + Math.PI / others.length
    P[n] = [cx + R * Math.cos(a), cy + R * Math.sin(a)]
  })
  P[c.ctrl] = [cx - R * 0.52, cy]
  P[c.out] = [cx + R * 0.52, cy]
  let lines = ''
  for (let k = 0; k < c.n * c.k; k++) {
    const t = Math.floor(k / c.k)
    const src = w.nb[k]!
    if (src === t) continue
    const [x1, y1] = P[src]!
    const [x2, y2] = P[t]!
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
    const lit = s[src] === 1 && s[t] === 1
    lines += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} Q${(mx + (cx - mx) * 0.3).toFixed(1)} ${(my + (cy - my) * 0.3).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${lit ? 'rgba(255,214,140,.4)' : 'rgba(255,205,110,.1)'}" stroke-width="${lit ? 1.4 : 1}"/>`
  }
  let dots = ''
  for (let n = 0; n < c.n; n++) {
    const [x, y] = P[n]!
    const r = n === c.ctrl || n === c.out ? size * 0.03 : size * 0.021
    const v = s[n]
    if (v === 1) dots += `<circle cx="${x}" cy="${y}" r="${r * 2.2}" fill="url(#halo)"/>`
    dots += `<circle cx="${x}" cy="${y}" r="${r}" fill="${v === 1 ? '#FFD68A' : v === 0 ? '#2a1d10' : '#121014'}" stroke="${v === 1 ? '#fff0cf' : v === 0 ? 'rgba(255,205,110,.75)' : 'rgba(255,255,255,.18)'}" stroke-width="1.4"/>`
  }
  const ring = `<circle cx="${cx}" cy="${cy}" r="${R + size * 0.06}" fill="none" stroke="rgba(255,205,110,.14)" stroke-width="3"/><path d="M${cx} ${cy - R - size * 0.06} A${R + size * 0.06} ${R + size * 0.06} 0 1 1 ${cx - (R + size * 0.06) * Math.sin(1.1)} ${cy - (R + size * 0.06) * Math.cos(1.1)}" fill="none" stroke="rgba(255,205,110,.85)" stroke-width="3"/>`
  const hub = `<circle cx="${cx}" cy="${cy}" r="${R * 0.4}" fill="#0d0b10" stroke="rgba(255,205,110,.25)"/>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><defs><radialGradient id="halo"><stop offset="0" stop-color="rgba(255,190,80,.55)"/><stop offset="1" stop-color="rgba(255,190,80,0)"/></radialGradient></defs>${ring}${lines}${hub}${dots}</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const handle = id.replace(/\.png$/, '')
  const p = handle === 'home' ? null : await getParticipant(handle).catch(() => null)
  const opts = { width: 1200, height: 630, fonts: await fonts(), headers: { 'Cache-Control': 'public, max-age=300' } }
  const RING = 560
  const ring = ringSvg(RING, 5400)
  const bg = 'radial-gradient(900px 600px at 82% 50%, #1a130b, #0B0A0E 65%)'

  if (!p) {
    return new ImageResponse(
      <div style={{ display: 'flex', width: '100%', height: '100%', background: bg, color: INK, fontFamily: 'Geist', position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" height={RING} src={ring} style={{ position: 'absolute', right: 30, top: 35 }} width={RING} />
        <div style={{ position: 'absolute', right: 30, top: 35, width: RING, height: RING, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: FIL }}>
          <span style={{ fontSize: 16, letterSpacing: 3, color: DIM }}>FIRST LIVE CALL</span>
          <span style={{ fontFamily: 'Nx', fontWeight: 300, fontSize: 64, color: HOT }}>18 NOV</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '64px 64px', width: 640 }}>
          <span style={{ fontFamily: 'Eng', fontSize: 30, letterSpacing: 6, color: '#f3e4ce' }}>BPP-9000</span>
          <span style={{ fontFamily: 'Nx', fontWeight: 300, fontSize: 118, lineHeight: 0.95, color: HOT, marginTop: 40 }}>Watch it think.</span>
          <span style={{ fontSize: 30, lineHeight: 1.35, color: '#c9b9a8', marginTop: 28 }}>The network Qubic miners grow to call every hour of bitcoin, UP or DOWN, running live.</span>
          <span style={{ fontFamily: 'Eng', letterSpacing: 3, color: '#c9b39a', fontSize: 18, marginTop: 'auto' }}>qubic.church/bpp9000</span>
        </div>
      </div>,
      opts,
    )
  }

  const s = statsOf(p.trades, p.start, p.joined)
  const up = s.capital >= s.start
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', background: bg, color: INK, fontFamily: 'Geist', position: 'relative' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" height={RING} src={ring} style={{ position: 'absolute', right: 20, top: 35 }} width={RING} />
      <div style={{ position: 'absolute', right: 20, top: 35, width: RING, height: RING, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Eng', fontSize: 18, letterSpacing: 4, color: FIL }}>BPP-9000</div>
      <span style={{ position: 'absolute', right: 40, bottom: 14, fontSize: 15, color: '#7d7064' }}>Experiment. Not financial advice.</span>
      <div style={{ display: 'flex', flexDirection: 'column', padding: '56px 64px 40px', width: 700, height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontSize: 40, fontWeight: 700 }}>{p.name.slice(0, 20)}</span>
            <span style={{ fontSize: 34, color: DIM }}>× BPP-9000</span>
          </div>
          <span style={{ fontFamily: 'Eng', fontSize: 16, letterSpacing: 5, color: FIL, marginTop: 8 }}>{`DAY ${s.day}`}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 26, fontFamily: 'Nx', fontWeight: 300, lineHeight: 1 }}>
          <span style={{ fontSize: 150, color: HOT }}>{String(s.wins)}</span>
          <span style={{ fontSize: 90, color: '#5f5560', margin: '0 14px' }}>/</span>
          <span style={{ fontSize: 150, color: '#a8998a' }}>{String(s.losses)}</span>
          <span style={{ fontSize: 90, color: '#5f5560', margin: '0 14px' }}>/</span>
          <span style={{ fontSize: 150, color: s.streak.kind === 'L' ? '#a8998a' : HOT }}>{s.streak.kind ? `${s.streak.kind}${s.streak.n}` : '—'}</span>
        </div>
        <span style={{ fontSize: 18, color: DIM, marginTop: 4 }}>wins · losses · streak</span>
        <div style={{ display: 'flex', gap: 46, marginTop: 26 }}>
          {[
            [s.winRate == null ? '—' : `${s.winRate.toFixed(1)}%`, 'win rate'],
            [s.profitFactor == null ? '—' : s.profitFactor.toFixed(2), 'profit factor'],
            [String(s.trades), 'trades'],
          ].map(([big, label]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'Nx', fontWeight: 500, fontSize: 54, color: FIL, lineHeight: 1 }}>{big}</span>
              <span style={{ fontSize: 18, color: DIM, marginTop: 4 }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 26, fontFamily: 'Nx', fontWeight: 300, fontSize: 50 }}>
          <span>{`${money(s.start)} → ${money(s.capital)}`}</span>
          <span style={{ color: up ? FIL : '#d9776a' }}>{`${s.returnPct >= 0 ? '+' : ''}${s.returnPct.toFixed(1)}%`}</span>
        </div>
        <span style={{ fontFamily: 'Eng', fontSize: 18, letterSpacing: 3, color: '#c9b39a', marginTop: 'auto' }}>qubic.church/bpp9000</span>
      </div>
    </div>,
    opts,
  )
}
