/**
 * Maria's halo as two static SVGs (behind and in front of her face), for the share card.
 * The same sky as the live engine: seedDust(), the same bezel, arcs and jewels, frozen at the moment the
 * reduced-motion still shows (220 frames at 30 fps). No DOM, no canvas: it runs inside next/og.
 */
import { ARCS, GOLD, GOLD_DIM, GOLD_HI, HOT, mix, N, type RGB, rgba, seedDust } from './halo-engine'

const TAU = Math.PI * 2
const f = (n: number) => n.toFixed(1)

export function haloSvg(size: number, face: number, opts: { t?: number; tone?: RGB; gain?: number } = {}): { back: string; front: string } {
  const t = opts.t ?? 220 / 30
  // the canvas adds light where grains overlap ('lighter'); a still on plain alpha needs a little more of it
  const g = opts.gain ?? 1.3
  const tone = opts.tone ?? GOLD
  const S = size
  const C = S / 2
  const R = S / 2 - 1
  const faceR = face / 2
  const dustIn = Math.max(faceR + 6, R * 0.33) / R
  const { r0, phi, om, ph, tw, sz } = seedDust(dustIn, 0.74)
  // the engine's motion at time t, idle
  const bezel = (TAU / 120) * t
  const arcs = -(TAU / 40) * t
  const prec = 0.035 * t
  const breath = 0.5 + 0.5 * Math.sin((t * TAU) / 6)
  // stroke widths scale with the card, so the hairlines stay hairlines at 1080 px
  const k = S / 216
  const lw = (w: number) => f(Math.max(w, w * k * 0.62))

  const defs: string[] = []
  const back: string[] = []
  const front: string[] = []

  // bloom behind her face, and the faint lane where the dust is densest
  const bloomA = (0.11 + 0.06 * breath) * g
  const bloomR = R * (0.66 + 0.06 * breath)
  defs.push(
    `<radialGradient id="bloom" cx="${C}" cy="${C}" r="${f(bloomR)}" gradientUnits="userSpaceOnUse"><stop offset="${(faceR * 0.6) / bloomR}" stop-color="${rgba(mix(GOLD, tone, 0.85), bloomA * 1.5)}"/><stop offset="${0.35}" stop-color="${rgba(mix(GOLD, tone, 0.85), bloomA * 0.6)}"/><stop offset="1" stop-color="${rgba(GOLD, 0)}"/></radialGradient>`,
    `<radialGradient id="lane" cx="${C}" cy="${C}" r="${f(R * 0.62)}" gradientUnits="userSpaceOnUse"><stop offset="${0.3 / 0.62}" stop-color="${rgba(GOLD, 0)}"/><stop offset="${(0.3 + 0.45 * 0.32) / 0.62}" stop-color="${rgba(GOLD, 0.035)}"/><stop offset="1" stop-color="${rgba(GOLD, 0)}"/></radialGradient>`,
    `<radialGradient id="jewel"><stop offset="0" stop-color="rgba(255,244,205,0.95)"/><stop offset="0.25" stop-color="rgba(254,206,52,0.45)"/><stop offset="1" stop-color="rgba(254,206,52,0)"/></radialGradient>`,
  )
  back.push(`<rect width="${S}" height="${S}" fill="url(#bloom)"/>`, `<rect width="${S}" height="${S}" fill="url(#lane)"/>`)

  // the engraved bezel: hairline, inner hairline, 60 ticks, a longer one every 5
  const rb = R * 0.965
  back.push(`<circle cx="${C}" cy="${C}" r="${f(rb)}" fill="none" stroke="${rgba(GOLD, 0.3)}" stroke-width="${lw(1)}"/>`)
  back.push(`<circle cx="${C}" cy="${C}" r="${f(rb - R * 0.09)}" fill="none" stroke="${rgba(GOLD, 0.1)}" stroke-width="${lw(1)}"/>`)
  let major = ''
  let minor = ''
  for (let i = 0; i < 60; i++) {
    const a = bezel + (i / 60) * TAU
    const big = i % 5 === 0
    const len = R * (big ? 0.075 : 0.035)
    const c = Math.cos(a)
    const s = Math.sin(a)
    const seg = `M${f(C + c * rb)} ${f(C + s * rb)}L${f(C + c * (rb - len))} ${f(C + s * (rb - len))}`
    if (big) major += seg
    else minor += seg
  }
  back.push(`<path d="${major}" stroke="${rgba(GOLD, 0.55)}" stroke-width="${lw(1.15)}"/>`, `<path d="${minor}" stroke="${rgba(GOLD, 0.26)}" stroke-width="${lw(0.8)}"/>`)

  // counter-rotating arcs with end caps and a jewel riding each
  const rm = R * 0.81
  const arcPath = (a0: number, a1: number, r: number) =>
    `M${f(C + Math.cos(a0) * r)} ${f(C + Math.sin(a0) * r)}A${f(r)} ${f(r)} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${f(C + Math.cos(a1) * r)} ${f(C + Math.sin(a1) * r)}`
  ARCS.forEach((arc, i) => {
    const a0 = arcs + arc.at
    const a1 = a0 + arc.len
    const d = arcPath(a0, a1, rm)
    back.push(`<path d="${d}" fill="none" stroke="${rgba(GOLD, 0.05)}" stroke-width="${f(5 * k * 0.7)}"/>`)
    back.push(
      `<path d="${d}" fill="none" stroke="${rgba(GOLD_HI, 0.5)}" stroke-width="${lw(arc.dash ? 1.1 : 0.9)}"${arc.dash ? ` stroke-dasharray="${f(1.4 * k * 0.6)} ${f(3.2 * k * 0.6)}"` : ''}/>`,
    )
    let caps = ''
    for (const e of [a0, a1]) {
      const c = Math.cos(e)
      const s = Math.sin(e)
      const cap = 3 * k * 0.6
      caps += `M${f(C + c * (rm - cap))} ${f(C + s * (rm - cap))}L${f(C + c * (rm + cap))} ${f(C + s * (rm + cap))}`
    }
    back.push(`<path d="${caps}" stroke="${rgba(GOLD, 0.45)}" stroke-width="${lw(0.8)}"/>`)
    const u = 0.5 + 0.5 * Math.sin(t * (0.55 + i * 0.17) + i * 1.7)
    const ja = a0 + arc.len * u
    const jx = C + Math.cos(ja) * rm
    const jy = C + Math.sin(ja) * rm
    back.push(`<circle cx="${f(jx)}" cy="${f(jy)}" r="${f(5 * k * 0.8)}" fill="url(#jewel)" opacity="0.8"/>`)
    back.push(`<circle cx="${f(jx)}" cy="${f(jy)}" r="${f(1.05 * k * 0.7)}" fill="${rgba(HOT, 0.95)}"/>`)
  })

  // 676 grains in a precessing elliptical vortex, short trails, four brightness buckets
  const tilt = 0.8
  const cp = Math.cos(prec)
  const sp = Math.sin(prec)
  const trail = 0.045
  const B = 4
  const trails = Array.from({ length: B }, () => '')
  const heads = Array.from({ length: B }, () => '')
  const fronts = Array.from({ length: B }, () => '')
  const glows: string[] = []
  const inner = faceR + 2
  for (let i = 0; i < N; i++) {
    const r = r0[i]! * R * (1 + 0.018 * Math.sin(t * 0.7 + ph[i]!))
    const a = phi[i]! + om[i]! * t
    const pa = a - om[i]! * trail
    const ex = Math.cos(a) * r
    const ey = Math.sin(a) * r * tilt
    const qx = Math.cos(pa) * r
    const qy = Math.sin(pa) * r * tilt
    const x = C + ex * cp - ey * sp
    const y = C + ex * sp + ey * cp
    const x0 = C + qx * cp - qy * sp
    const y0 = C + qx * sp + qy * cp
    const twk = 0.5 + 0.5 * Math.sin(t * tw[i]! + ph[i]!)
    const b = Math.min(B - 1, (twk * B) | 0)
    const dx = x - C
    const dy = y - C
    const seg = `M${f(x0)} ${f(y0)}L${f(x)} ${f(y)}`
    if (Math.sin(a) > 0 && dx * dx + dy * dy < inner * inner) {
      fronts[b] += seg
      continue
    }
    trails[b] += seg
    const s = sz[i]! * k * 0.62
    heads[b] += `M${f(x - s / 2)} ${f(y - s / 2)}h${f(s)}v${f(s)}h${f(-s)}z`
    if (b === B - 1 && sz[i]! > 0.8) glows.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(3.5 * k * 0.7)}" fill="url(#jewel)" opacity="${(0.18 * g).toFixed(2)}"/>`)
  }
  back.push(...glows)
  for (let bi = 0; bi < B; bi++) {
    const kk = (bi + 0.5) / B
    const col = mix(mix(GOLD_DIM, GOLD, Math.min(1, kk * 1.6)), HOT, Math.max(0, kk - 0.7) * 1.6)
    back.push(`<path d="${trails[bi]}" fill="none" stroke="${rgba(col, (0.08 + kk * 0.16) * g)}" stroke-width="${lw(0.7)}" stroke-linecap="round"/>`)
    back.push(`<path d="${heads[bi]}" fill="${rgba(col, (0.35 + kk * 0.6) * g)}"/>`)
    front.push(`<path d="${fronts[bi]}" fill="none" stroke="${rgba(col, 0.1 + kk * 0.22)}" stroke-width="${lw(0.7)}" stroke-linecap="round"/>`)
  }

  const wrap = (body: string[], withDefs: boolean) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${withDefs ? `<defs>${defs.join('')}</defs>` : ''}${body.join('')}</svg>`
  return { back: wrap(back, true), front: wrap(front, false) }
}

export const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
