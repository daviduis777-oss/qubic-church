/**
 * Maria's halo as two static SVGs (behind and in front of her face), for the share card.
 * The same network as the live engine (seedNetwork, createSim with the same seed), frozen after the same
 * calm idle firing the reduced-motion still shows. No DOM, no canvas: it runs inside next/og.
 */
import { BLUE, BLUE_DEEP, BLUE_HI, createSim, GOLD, HOT, mix, N, type RGB, rgba, seedNetwork } from './halo-engine'

const TAU = Math.PI * 2
const f = (n: number) => n.toFixed(1)

export function haloSvg(size: number, face: number, opts: { t?: number; tone?: RGB; gain?: number } = {}): { back: string; front: string } {
  const t = opts.t ?? 140 / 30
  // the canvas adds light where glows overlap ('lighter'); a still on plain alpha needs a little more of it
  const g = opts.gain ?? 1.25
  const tone = opts.tone ?? GOLD
  const S = size
  const C = S / 2
  const R = S / 2 - 1
  const faceR = face / 2
  const k = Math.max(0.8, S / 152)
  const net = seedNetwork(faceR / R)
  const sim = createSim(net)
  // the engine's idle at time t: the same spin and the same firing
  let spin = -0.35
  const steps = Math.round(t * 30)
  for (let i = 0; i < steps; i++) {
    spin += (TAU / 160) * (1 / 30)
    sim.update(1 / 30, 0, spin)
  }
  const cs = Math.cos(spin)
  const sn = Math.sin(spin)
  const X = (i: number) => C + ((net.x[i] as number) * cs - (net.y[i] as number) * sn) * R
  const Y = (i: number) => C + ((net.x[i] as number) * sn + (net.y[i] as number) * cs) * R

  const at = (r: number) => Math.max(0, Math.min(1, r))
  const [a0, b0] = net.orbits
  const defs = [
    `<radialGradient id="lane" cx="${C}" cy="${C}" r="${f(R)}" gradientUnits="userSpaceOnUse"><stop offset="${(faceR / R).toFixed(3)}" stop-color="${rgba(BLUE_DEEP, 0)}"/><stop offset="${at(a0 - 0.08).toFixed(3)}" stop-color="${rgba(BLUE_DEEP, 0.1 * g)}"/><stop offset="${at(a0).toFixed(3)}" stop-color="${rgba(BLUE_DEEP, 0.55 * g)}"/><stop offset="${at((a0 + b0) / 2).toFixed(3)}" stop-color="${rgba(BLUE_DEEP, 0.32 * g)}"/><stop offset="${at(b0).toFixed(3)}" stop-color="${rgba(BLUE_DEEP, 0.5 * g)}"/><stop offset="1" stop-color="${rgba(BLUE_DEEP, 0)}"/></radialGradient>`,
    `<radialGradient id="core" cx="${C}" cy="${C}" r="${f(faceR * 2.2)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${rgba(mix(GOLD, tone, 0.85), 0.2 * g)}"/><stop offset="0.45" stop-color="${rgba(GOLD, 0.06 * g)}"/><stop offset="1" stop-color="${rgba(GOLD, 0)}"/></radialGradient>`,
    `<radialGradient id="spark"><stop offset="0" stop-color="rgba(255,244,205,0.95)"/><stop offset="0.28" stop-color="rgba(254,206,52,0.42)"/><stop offset="1" stop-color="rgba(254,206,52,0)"/></radialGradient>`,
  ]
  const back: string[] = [`<rect width="${S}" height="${S}" fill="url(#lane)"/>`, `<rect width="${S}" height="${S}" fill="url(#core)"/>`]

  // the two orbits, the synapses, the nodes
  for (const o of net.orbits) back.push(`<circle cx="${C}" cy="${C}" r="${f(o * R)}" fill="none" stroke="${rgba(BLUE, 0.16 * g)}" stroke-width="${f(0.5 * k)}"/>`)
  let syn = ''
  for (let e = 0; e < net.edges.length; e += 2) {
    const i = net.edges[e] as number
    const j = net.edges[e + 1] as number
    syn += `M${f(X(i))} ${f(Y(i))}L${f(X(j))} ${f(Y(j))}`
  }
  back.push(`<path d="${syn}" fill="none" stroke="${rgba(BLUE, 0.36 * g)}" stroke-width="${f(0.42 * k)}"/>`)
  const dot = (x: number, y: number, r: number) => `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`
  let small = ''
  let big = ''
  for (let i = 0; i < N; i++) {
    const d = dot(X(i), Y(i), (net.sz[i] as number) * 0.62 * k)
    if ((net.sz[i] as number) > 0.85) big += d
    else small += d
  }
  back.push(`<path d="${small}" fill="${rgba(BLUE_HI, 0.44 * g)}"/>`, `<path d="${big}" fill="${rgba(BLUE_HI, 0.68 * g)}"/>`)

  // the firing frozen mid-run: signals on their synapses, then the lit nodes in gold
  const ps = sim.pulses
  let lines = ''
  for (let p = 0; p < ps.n; p++) {
    const a = ps.from[p] as number
    const b = ps.to[p] as number
    const u = ps.u[p] as number
    lines += `M${f(X(a))} ${f(Y(a))}L${f(X(a) + (X(b) - X(a)) * u)} ${f(Y(a) + (Y(b) - Y(a)) * u)}`
  }
  if (lines) back.push(`<path d="${lines}" fill="none" stroke="${rgba(GOLD, 0.6)}" stroke-width="${f(0.75 * k)}" stroke-linecap="round"/>`)
  const B = 4
  const lit = Array.from({ length: B }, () => '')
  for (let i = 0; i < N; i++) {
    const a = sim.act[i] as number
    if (a < 0.05) continue
    if (a > 0.4) back.push(`<circle cx="${f(X(i))}" cy="${f(Y(i))}" r="${f(3.5 * k)}" fill="url(#spark)" opacity="${((a - 0.4) * 0.8 * g).toFixed(2)}"/>`)
    lit[Math.min(B - 1, (a * B) | 0)] += dot(X(i), Y(i), (net.sz[i] as number) * (0.62 + 0.5 * a) * k)
  }
  lit.forEach((d, b) => {
    if (!d) return
    const q = (b + 0.5) / B
    back.push(`<path d="${d}" fill="${rgba(mix(mix(BLUE_HI, GOLD, Math.min(1, q * 1.7)), HOT, Math.max(0, q - 0.72) * 2.4), 0.35 + 0.65 * q)}"/>`)
  })

  const wrap = (body: string[], withDefs: boolean) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${withDefs ? `<defs>${defs.join('')}</defs>` : ''}${body.join('')}</svg>`
  // nothing crosses her face at rest: the front layer stays empty, kept so the card's layout does not change
  return { back: wrap(back, true), front: wrap([], false) }
}

export const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
