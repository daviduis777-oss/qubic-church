/**
 * Maria's halo: a ring of 676 neurons around her face, one per Qubic computor, drawn on two 2D canvases
 * (behind and in front of the avatar). Deep blue structure on black, gold activity.
 *
 * Two orbital bands of nodes; thin synapses join near neighbours, and a few bridges join the bands.
 * Signals run along the synapses, mostly clockwise, so firing travels round the ring. Idle: calm, sparse
 * firing. Thinking: more and faster, biased inward, with pulses converging on her face. Verdict: one wave of
 * activation runs round the ring in the verdict colour, then everything settles back to blue.
 *
 * The static network is drawn once into an offscreen sprite; a frame is that sprite, a few glows and the
 * active signals. Pure TypeScript, no React. The simulation is seeded, so the share card (halo-svg.ts)
 * draws the same network.
 */

import { HALO_FPS } from '@/lib/pool/ui-config'

export type HaloMode = 'idle' | 'thinking' | 'settled'
export type HaloOptions = { size: number; face: number; dpr?: number }
export type RGB = [number, number, number]

export const N = 676
const TAU = Math.PI * 2

export const GOLD: RGB = [254, 206, 52] // site --accent-gold
export const GOLD_HI: RGB = [255, 231, 124] // --accent-gold-strong
export const GOLD_DIM: RGB = [177, 132, 6] // --accent-gold-dim
export const HOT: RGB = [255, 244, 205]
/** The structure: a deep, quiet blue that reads on black without competing with the gold. */
export const BLUE_DEEP: RGB = [16, 36, 104]
export const BLUE: RGB = [58, 98, 214]
export const BLUE_HI: RGB = [138, 170, 255]

export const hex = (h: string): RGB => {
  const n = Number.parseInt(h.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
export const mix = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
export const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, Math.min(1, a)).toFixed(3)})`

/** Deterministic noise so every render of the halo is the same network. */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ---------------- the network ---------------- */

export type Net = {
  /** node position in units of R, relative to the centre, in the network's own (unrotated) frame */
  x: Float32Array
  y: Float32Array
  r: Float32Array
  a: Float32Array
  /** 0 inner band, 1 outer band */
  band: Uint8Array
  /** dot size factor, 0.6 to 1.25 */
  sz: Float32Array
  /** synapses as node pairs */
  edges: Uint16Array
  /** neighbours of node i: adj[start[i] .. start[i+1]) */
  start: Int32Array
  adj: Uint16Array
  /** the two band radii (centres) in units of R, for the orbit hairlines */
  orbits: [number, number]
  inner: number
}

/**
 * 676 nodes in two orbital bands between the face and the rim, sized by how much of the halo the face takes.
 * Each node links to its two or three nearest neighbours; about one in eight inner nodes bridges outward.
 */
export function seedNetwork(faceFrac: number): Net {
  const rand = rng(676)
  const rIn = Math.max(faceFrac + 0.13, 0.4)
  const span = 0.95 - rIn
  const cA = rIn + span * 0.24
  const cB = rIn + span * 0.73
  const wA = span * 0.1
  const wB = span * 0.13
  const nA = Math.round((N * cA) / (cA + cB))
  const x = new Float32Array(N)
  const y = new Float32Array(N)
  const r = new Float32Array(N)
  const a = new Float32Array(N)
  const band = new Uint8Array(N)
  const sz = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const inA = i < nA
    const k = inA ? i : i - nA
    const n = inA ? nA : N - nA
    // even spacing round the ring with jitter, a soft triangular spread across the band
    const ang = ((k + 0.5 + (rand() - 0.5) * 0.9) / n) * TAU
    const tri = rand() + rand() - 1
    const rr = (inA ? cA : cB) + tri * (inA ? wA : wB)
    a[i] = ang
    r[i] = rr
    x[i] = Math.cos(ang) * rr
    y[i] = Math.sin(ang) * rr
    band[i] = inA ? 0 : 1
    sz[i] = 0.6 + rand() ** 2.2 * 0.65
  }
  // neighbours: nearest few within a window of the angle-sorted order of each band
  const set = new Set<number>()
  const pairs: number[] = []
  const link = (i: number, j: number) => {
    const key = i < j ? i * N + j : j * N + i
    if (i === j || set.has(key)) return
    set.add(key)
    pairs.push(i, j)
  }
  const dmax = 0.115
  for (let i = 0; i < N; i++) {
    const inA = band[i] === 0
    const base = inA ? 0 : nA
    const n = inA ? nA : N - nA
    const k = i - base
    const best: [number, number][] = []
    for (let o = -14; o <= 14; o++) {
      if (!o) continue
      const j = base + ((((k + o) % n) + n) % n)
      const dx = (x[j] as number) - (x[i] as number)
      const dy = (y[j] as number) - (y[i] as number)
      const d = dx * dx + dy * dy
      // prefer neighbours along the band to neighbours across it, so the bands read as orbits
      const dr = (r[j] as number) - (r[i] as number)
      if (d < dmax * dmax) best.push([d + 2.2 * dr * dr, j])
    }
    best.sort((p, q) => p[0] - q[0])
    const take = 2 + (rand() < 0.45 ? 1 : 0)
    for (const [, j] of best.slice(0, take)) link(i, j)
    // bridges between the bands, like dendrites reaching across
    if (inA && rand() < 0.12) {
      const nB = N - nA
      const kb = Math.round((a[i] as number) / TAU * nB)
      let bj = -1
      let bd = Number.POSITIVE_INFINITY
      for (let o = -4; o <= 4; o++) {
        const j = nA + ((((kb + o) % nB) + nB) % nB)
        const dx = (x[j] as number) - (x[i] as number)
        const dy = (y[j] as number) - (y[i] as number)
        const d = dx * dx + dy * dy
        if (d < bd) {
          bd = d
          bj = j
        }
      }
      if (bj >= 0) link(i, bj)
    }
  }
  const edges = Uint16Array.from(pairs)
  const deg = new Int32Array(N)
  for (let e = 0; e < edges.length; e++) {
    const i = edges[e] as number
    deg[i] = (deg[i] as number) + 1
  }
  const start = new Int32Array(N + 1)
  for (let i = 0; i < N; i++) start[i + 1] = (start[i] as number) + (deg[i] as number)
  const fill = start.slice(0, N)
  const adj = new Uint16Array(edges.length)
  for (let e = 0; e < edges.length; e += 2) {
    const i = edges[e] as number
    const j = edges[e + 1] as number
    adj[fill[i] as number] = j
    fill[i] = (fill[i] as number) + 1
    adj[fill[j] as number] = i
    fill[j] = (fill[j] as number) + 1
  }
  return { x, y, r, a, band, sz, edges, start, adj, orbits: [cA, cB], inner: rIn - 0.04 }
}

/* ---------------- the firing ---------------- */

/** How the ring fires in each state: spawn rate per second, seconds per hop, chance to fire on, to branch. */
export const FIRING = {
  idle: { rate: 2.6, hop: 0.13, carry: 0.93, branch: 0.025, decay: 0.6, max: 48, inward: 0 },
  thinking: { rate: 22, hop: 0.055, carry: 0.965, branch: 0.07, decay: 0.34, max: 240, inward: 0.3 },
} as const

const P = 256
const AFF = 72

/**
 * The firing itself, without a canvas: node activations, signals on synapses, pulses on their way to her
 * face, and the verdict wave. The live halo and the share card both run it.
 */
export function createSim(net: Net, seed = 7) {
  const rand = rng(seed)
  const act = new Float32Array(N)
  /** how much of a node's light is the verdict colour */
  const hue = new Float32Array(N)
  const pf = new Uint16Array(P)
  const pt = new Uint16Array(P)
  const pu = new Float32Array(P)
  const pd = new Float32Array(P)
  let np = 0
  const an = new Uint16Array(AFF)
  const au = new Float32Array(AFF)
  const ad = new Float32Array(AFF)
  let na = 0
  let acc = 0
  let wave = -1
  let waveFront = 0
  let rim = 0

  /** Pick where a signal goes next: forward (clockwise) is likelier; while thinking, inward is too. */
  const next = (at: number, from: number, inward: number): number => {
    const s = net.start[at] as number
    const e = net.start[at + 1] as number
    let sum = 0
    const w: number[] = []
    for (let k = s; k < e; k++) {
      const j = net.adj[k] as number
      if (j === from) {
        w.push(0)
        continue
      }
      let d = (net.a[j] as number) - (net.a[at] as number)
      d = d > Math.PI ? d - TAU : d < -Math.PI ? d + TAU : d
      let wt = d > 0 ? 3 : 0.55
      if (inward > 0 && (net.r[j] as number) < (net.r[at] as number)) wt *= 1 + inward * 5
      w.push(wt)
      sum += wt
    }
    if (sum <= 0) return -1
    let u = rand() * sum
    for (let k = 0; k < w.length; k++) {
      u -= w[k] as number
      if (u <= 0) return net.adj[s + k] as number
    }
    return -1
  }

  const spawn = (from: number, to: number, hop: number) => {
    if (np >= P || to < 0) return
    pf[np] = from
    pt[np] = to
    pu[np] = 0
    pd[np] = hop * (0.75 + rand() * 0.5)
    np++
  }

  const afferent = (node: number) => {
    if (na >= AFF) return
    an[na] = node
    au[na] = 0
    ad[na] = 0.32 + rand() * 0.22
    na++
  }

  return {
    act,
    hue,
    get pulses() {
      return { n: np, from: pf, to: pt, u: pu }
    },
    get afferents() {
      return { n: na, node: an, u: au }
    },
    get rim() {
      return rim
    },
    get wave() {
      return wave
    },
    /** how far round the verdict wave has run, 0 to pi on each side */
    get front() {
      return waveFront
    },
    /** Start the verdict wave at the top of the ring (in screen terms: `spin` is the ring's rotation). */
    verdict() {
      wave = 0
      waveFront = 0
    },
    /**
     * Advance by dt seconds. th: 0 idle .. 1 thinking (eased by the caller). spin: the ring's rotation, so the
     * verdict wave starts at the top of the screen whatever the ring's angle.
     */
    update(dt: number, th: number, spin: number) {
      const I = FIRING.idle
      const T = FIRING.thinking
      const k = Math.max(0, Math.min(1, th))
      const rate = I.rate + (T.rate - I.rate) * k
      const hop = I.hop + (T.hop - I.hop) * k
      const carry = I.carry + (T.carry - I.carry) * k
      const branch = I.branch + (T.branch - I.branch) * k
      const decay = I.decay + (T.decay - I.decay) * k
      const max = Math.round(I.max + (T.max - I.max) * k)
      const inward = T.inward * k
      // activations fade; the verdict colour lingers a little longer
      const f = Math.exp(-dt / decay)
      const fh = Math.exp(-dt / 2.2)
      for (let i = 0; i < N; i++) {
        act[i] = (act[i] as number) * f
        hue[i] = (hue[i] as number) * fh
      }
      rim *= Math.exp(-dt / 0.35)
      // spontaneous firing: a node fires and sends one signal on
      acc += rate * dt
      while (acc >= 1) {
        acc -= 1
        if (np >= max) continue
        const i = (rand() * N) | 0
        act[i] = Math.max(act[i] as number, 0.85)
        spawn(i, next(i, -1, inward), hop)
      }
      // signals travel; on arrival the node fires and the signal carries on, sometimes in two
      for (let p = 0; p < np; ) {
        pu[p] = (pu[p] as number) + dt / (pd[p] as number)
        if ((pu[p] as number) < 1) {
          p++
          continue
        }
        const at = pt[p] as number
        const from = pf[p] as number
        act[at] = 1
        if (inward > 0 && net.band[at] === 0 && rand() < inward * 0.6) afferent(at)
        const go = rand() < carry ? next(at, from, inward) : -1
        if (go >= 0) {
          pf[p] = at
          pt[p] = go
          pu[p] = 0
          pd[p] = hop * (0.75 + rand() * 0.5)
          if (np < max && rand() < branch) spawn(at, next(at, go, inward), hop)
          p++
        } else {
          np--
          pf[p] = pf[np] as number
          pt[p] = pt[np] as number
          pu[p] = pu[np] as number
          pd[p] = pd[np] as number
        }
      }
      // pulses on their way to her face
      for (let q = 0; q < na; ) {
        au[q] = (au[q] as number) + dt / (ad[q] as number)
        if ((au[q] as number) < 1) {
          q++
          continue
        }
        rim = Math.min(1.4, rim + 0.22)
        na--
        an[q] = an[na] as number
        au[q] = au[na] as number
        ad[q] = ad[na] as number
      }
      // the verdict: two fronts from the top, round both sides, meeting at the bottom
      if (wave >= 0) {
        wave += dt
        const dur = 1.05
        const p = Math.min(1, wave / dur)
        const front = Math.PI * (1 - (1 - p) ** 2.2)
        const top = -Math.PI / 2
        for (let i = 0; i < N; i++) {
          let d = (net.a[i] as number) + spin - top
          d = (((d % TAU) + TAU) % TAU)
          if (d > Math.PI) d = TAU - d
          if (d > waveFront && d <= front + 0.02) {
            act[i] = 1
            hue[i] = 1
          }
        }
        waveFront = front
        if (wave > dur + 0.1) wave = -1
      }
    },
  }
}

export type Sim = ReturnType<typeof createSim>

/** A damped spring toward a target, for eased transitions. */
type Spring = { x: number; v: number; k: number; c: number }
const spring = (k: number, c: number): Spring => ({ x: 0, v: 0, k, c })
const stepSpring = (s: Spring, target: number, dt: number) => {
  const a = -s.k * (s.x - target) - s.c * s.v
  s.v += a * dt
  s.x += s.v * dt
}

/** A soft round sprite: a radial gradient from `inner` (centre) to transparent. */
function glowSprite(px: number, stops: [number, string][]) {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const g = c.getContext('2d')
  if (g) {
    const gr = g.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2)
    for (const [o, col] of stops) gr.addColorStop(o, col)
    g.fillStyle = gr
    g.fillRect(0, 0, px, px)
  }
  return c
}

export function createHalo(back: HTMLCanvasElement, front: HTMLCanvasElement, opts: HaloOptions) {
  const S = opts.size
  const dpr = Math.min(2, opts.dpr ?? 1)
  const W = Math.round(S * dpr)
  for (const c of [back, front]) {
    c.width = W
    c.height = W
  }
  const bx = back.getContext('2d')
  const fx = front.getContext('2d')
  if (!bx || !fx) throw new Error('canvas 2d unavailable')

  const C = S / 2
  const R = S / 2 - 1
  const faceR = opts.face / 2
  /** line and dot scale: the design is drawn for a 152 px halo */
  const k = Math.max(0.8, S / 152)
  const net = seedNetwork(faceR / R)
  const sim = createSim(net)

  /* --- sprites, drawn once --- */
  const off = (w = W) => {
    const c = document.createElement('canvas')
    c.width = c.height = w
    return c
  }
  /** the network in blue: orbit hairlines, synapses, nodes. `ink` draws it white, to be tinted for a verdict. */
  const drawNet = (ink: boolean) => {
    const c = off()
    const g = c.getContext('2d')
    if (!g) return c
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.translate(C, C)
    const col = (b: RGB) => (ink ? ([255, 255, 255] as RGB) : b)
    // orbit hairlines, the two bands' paths
    for (const o of net.orbits) {
      g.strokeStyle = rgba(col(BLUE), ink ? 0.22 : 0.16)
      g.lineWidth = 0.5 * k
      g.beginPath()
      g.arc(0, 0, o * R, 0, TAU)
      g.stroke()
    }
    // synapses
    const syn = new Path2D()
    for (let e = 0; e < net.edges.length; e += 2) {
      const i = net.edges[e] as number
      const j = net.edges[e + 1] as number
      syn.moveTo((net.x[i] as number) * R, (net.y[i] as number) * R)
      syn.lineTo((net.x[j] as number) * R, (net.y[j] as number) * R)
    }
    g.strokeStyle = rgba(col(BLUE), ink ? 0.55 : 0.34)
    g.lineWidth = 0.42 * k
    g.stroke(syn)
    // nodes, two sizes of dot
    const dots = [new Path2D(), new Path2D()]
    for (let i = 0; i < N; i++) {
      const s = (net.sz[i] as number) * 0.62 * k
      const p = dots[(net.sz[i] as number) > 0.85 ? 1 : 0] as Path2D
      const px = (net.x[i] as number) * R
      const py = (net.y[i] as number) * R
      p.moveTo(px + s, py)
      p.arc(px, py, s, 0, TAU)
    }
    g.fillStyle = rgba(col(BLUE_HI), ink ? 0.7 : 0.42)
    g.fill(dots[0] as Path2D)
    g.fillStyle = rgba(col(BLUE_HI), ink ? 0.95 : 0.66)
    g.fill(dots[1] as Path2D)
    return c
  }
  const netSprite = drawNet(false)
  const inkSprite = drawNet(true)
  /** the ink sprite in the verdict colour, made once per verdict */
  let tinted: HTMLCanvasElement | null = null
  let tintedFor = ''
  const tintSprite = (c: RGB) => {
    const key = c.join(',')
    if (tinted && tintedFor === key) return tinted
    tinted ??= off()
    const g = tinted.getContext('2d')
    if (g) {
      g.setTransform(1, 0, 0, 1, 0, 0)
      g.globalCompositeOperation = 'source-over'
      g.clearRect(0, 0, W, W)
      g.drawImage(inkSprite, 0, 0)
      g.globalCompositeOperation = 'source-in'
      g.fillStyle = rgba(c, 1)
      g.fillRect(0, 0, W, W)
      g.globalCompositeOperation = 'source-over'
    }
    tintedFor = key
    return tinted
  }

  // the deep blue lane under the bands, and the warm light round her face
  const laneSprite = off()
  {
    const g = laneSprite.getContext('2d')
    if (g) {
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      const [a0, b0] = net.orbits
      const gr = g.createRadialGradient(C, C, faceR, C, C, R)
      const at = (r: number) => Math.max(0, Math.min(1, (r * R - faceR) / (R - faceR)))
      gr.addColorStop(0, rgba(BLUE_DEEP, 0))
      gr.addColorStop(at(a0 - 0.08), rgba(BLUE_DEEP, 0.1))
      gr.addColorStop(at(a0), rgba(BLUE_DEEP, 0.5))
      gr.addColorStop(at((a0 + b0) / 2), rgba(BLUE_DEEP, 0.3))
      gr.addColorStop(at(b0), rgba(BLUE_DEEP, 0.46))
      gr.addColorStop(1, rgba(BLUE_DEEP, 0))
      g.fillStyle = gr
      g.fillRect(0, 0, S, S)
    }
  }
  const coreSprite = glowSprite(64, [
    [0, 'rgba(254,206,52,0.55)'],
    [0.45, 'rgba(254,206,52,0.16)'],
    [1, 'rgba(254,206,52,0)'],
  ])
  const sparkSprite = glowSprite(32, [
    [0, 'rgba(255,244,205,0.95)'],
    [0.28, 'rgba(254,206,52,0.42)'],
    [1, 'rgba(254,206,52,0)'],
  ])

  /* --- state --- */
  const think = spring(30, 9) // 0 idle .. 1 thinking, eased
  let mode: HaloMode = 'idle'
  let tone: RGB = GOLD
  let tint = 0 // the ring in the verdict colour, 0..1
  let tintHold = 0
  let spin = -0.35
  let t = 0

  function set(next: HaloMode, toneHex?: string) {
    if (toneHex) tone = hex(toneHex)
    if (next === 'settled' && mode !== 'settled') {
      sim.verdict()
      tint = 1
      tintHold = 1.25
    }
    mode = next
  }

  function update(dt: number) {
    t += dt
    stepSpring(think, mode === 'thinking' ? 1 : 0, dt)
    const th = Math.max(0, think.x)
    spin += (TAU / 160) * (1 + 1.4 * th) * dt
    sim.update(dt, th, spin)
    if (tintHold > 0) tintHold -= dt
    else tint *= Math.exp(-dt / 1.1)
  }

  // reused per frame, no allocation in the loop beyond the paths
  const buckets = 4
  let frontInk = true
  function draw() {
    const th = Math.max(0, Math.min(1.2, think.x))
    // the front layer is touched only when something is on it: an untouched canvas costs the browser nothing to present
    for (const g of (frontInk ? [bx, fx] : [bx]) as CanvasRenderingContext2D[]) {
      g.setTransform(1, 0, 0, 1, 0, 0)
      g.globalCompositeOperation = 'source-over'
      g.globalAlpha = 1
      g.clearRect(0, 0, W, W)
    }
    frontInk = false
    const g = bx as CanvasRenderingContext2D
    const f = fx as CanvasRenderingContext2D
    const breath = 0.5 + 0.5 * Math.sin((t * TAU) / 7)

    // the lane and the core light
    g.globalAlpha = 0.7 + 0.2 * breath + 0.25 * th
    g.drawImage(laneSprite, 0, 0)
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.globalCompositeOperation = 'lighter'
    const coreR = faceR * (2.1 + 0.25 * breath + 0.5 * th)
    g.globalAlpha = Math.min(1, 0.3 + 0.12 * breath + 0.5 * th)
    g.drawImage(coreSprite, C - coreR, C - coreR, coreR * 2, coreR * 2)

    // the network, turning slowly; in the verdict colour while a verdict holds
    const cs = Math.cos(spin)
    const sn = Math.sin(spin)
    g.setTransform(dpr * cs, dpr * sn, -dpr * sn, dpr * cs, dpr * C, dpr * C)
    g.globalCompositeOperation = 'source-over'
    g.globalAlpha = 0.9 + 0.1 * th
    g.drawImage(netSprite, -C, -C, S, S)
    if (tint > 0.02) {
      g.globalAlpha = Math.min(1, tint) * 0.85
      // while the wave runs, only the part of the ring it has reached: two wedges down from the top
      const w = sim.wave >= 0 ? sim.front : Math.PI
      if (w < Math.PI - 0.01) {
        g.save()
        const top = -Math.PI / 2 - spin
        g.beginPath()
        g.moveTo(0, 0)
        g.arc(0, 0, S, top - w, top + w)
        g.closePath()
        g.clip()
        g.drawImage(tintSprite(tone), -C, -C, S, S)
        g.restore()
      } else g.drawImage(tintSprite(tone), -C, -C, S, S)
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.globalCompositeOperation = 'lighter'

    const X = (i: number) => C + ((net.x[i] as number) * cs - (net.y[i] as number) * sn) * R
    const Y = (i: number) => C + ((net.x[i] as number) * sn + (net.y[i] as number) * cs) * R

    // signals on their synapses: a gold stroke from the last node to the head
    const ps = sim.pulses
    if (ps.n) {
      const lines = new Path2D()
      const heads = new Path2D()
      for (let p = 0; p < ps.n; p++) {
        const a = ps.from[p] as number
        const b = ps.to[p] as number
        const u = ps.u[p] as number
        const ax = X(a)
        const ay = Y(a)
        const hx = ax + (X(b) - ax) * u
        const hy = ay + (Y(b) - ay) * u
        lines.moveTo(ax, ay)
        lines.lineTo(hx, hy)
        const s = 0.7 * k
        heads.moveTo(hx + s, hy)
        heads.arc(hx, hy, s, 0, TAU)
      }
      g.globalAlpha = 1
      g.strokeStyle = rgba(GOLD, 0.55 + 0.2 * th)
      g.lineWidth = 0.75 * k
      g.lineCap = 'round'
      g.stroke(lines)
      g.fillStyle = rgba(HOT, 0.95)
      g.fill(heads)
    }

    // firing nodes: a soft glow on the brightest, a core dot on all, gold, or the verdict colour
    const dots: Path2D[] = []
    const vdots: Path2D[] = []
    for (let b = 0; b < buckets; b++) {
      dots.push(new Path2D())
      vdots.push(new Path2D())
    }
    const gs = 7 * k * (1 + 0.25 * th)
    for (let i = 0; i < N; i++) {
      const a = sim.act[i] as number
      if (a < 0.05) continue
      const x = X(i)
      const y = Y(i)
      const v = (sim.hue[i] as number) > 0.5 && tint > 0.02
      if (a > 0.4) {
        g.globalAlpha = (a - 0.4) * (v ? 0.9 : 0.75)
        g.drawImage(sparkSprite, x - gs / 2, y - gs / 2, gs, gs)
      }
      const b = Math.min(buckets - 1, (a * buckets) | 0)
      const s = (net.sz[i] as number) * (0.62 + 0.5 * a) * k
      const p = (v ? vdots : dots)[b] as Path2D
      p.moveTo(x + s, y)
      p.arc(x, y, s, 0, TAU)
    }
    g.globalAlpha = 1
    for (let b = 0; b < buckets; b++) {
      const q = (b + 0.5) / buckets
      g.fillStyle = rgba(mix(mix(BLUE_HI, GOLD, Math.min(1, q * 1.7)), HOT, Math.max(0, q - 0.72) * 2.4), 0.35 + 0.65 * q)
      g.fill(dots[b] as Path2D)
      g.fillStyle = rgba(mix(tone, HOT, Math.max(0, q - 0.75) * 0.7), 0.45 + 0.55 * q)
      g.fill(vdots[b] as Path2D)
    }

    // pulses converging on her face, drawn in front so they reach the gold ring
    f.setTransform(dpr, 0, 0, dpr, 0, 0)
    f.globalCompositeOperation = 'lighter'
    const af = sim.afferents
    if (af.n) {
      frontInk = true
      const streaks = new Path2D()
      const sparks: number[] = []
      for (let q = 0; q < af.n; q++) {
        const i = af.node[q] as number
        const u = af.u[q] as number
        const e = u * u * (3 - 2 * u)
        const x0 = X(i)
        const y0 = Y(i)
        const dx = C - x0
        const dy = C - y0
        const d = Math.hypot(dx, dy) || 1
        const reach = d - faceR - 1
        const hx = x0 + (dx / d) * reach * e
        const hy = y0 + (dy / d) * reach * e
        const tl = Math.min(reach * e, 6 * k)
        streaks.moveTo(hx - (dx / d) * tl, hy - (dy / d) * tl)
        streaks.lineTo(hx, hy)
        sparks.push(hx, hy)
      }
      f.strokeStyle = rgba(GOLD_HI, 0.7)
      f.lineWidth = 0.8 * k
      f.lineCap = 'round'
      f.stroke(streaks)
      f.globalAlpha = 0.85
      const ss = 5 * k
      for (let s = 0; s < sparks.length; s += 2) f.drawImage(sparkSprite, (sparks[s] as number) - ss / 2, (sparks[s + 1] as number) - ss / 2, ss, ss)
      f.globalAlpha = 1
    }
    // her gold ring answers: brighter as pulses arrive, the verdict colour for a moment after
    const rim = Math.min(1, sim.rim * 0.6 + th * 0.25)
    if (rim > 0.02 || tint > 0.02) {
      frontInk = true
      f.strokeStyle = rgba(mix(GOLD_HI, tone, Math.min(1, tint)), Math.max(rim, tint * 0.7))
      f.lineWidth = (0.9 + rim * 0.8) * k
      f.beginPath()
      f.arc(C, C, faceR + 0.6, 0, TAU)
      f.stroke()
    }
  }

  let raf = 0
  let last = 0
  let due = 0
  let running = false
  const stats = { frames: 0, drawMs: 0, updateMs: 0 }

  /** Anything moving fast: thinking, the verdict wave and its tint, the ease back to idle. */
  const busy = () => mode === 'thinking' || sim.wave >= 0 || Math.abs(think.x) > 0.02 || Math.abs(think.v) > 0.05 || tint > 0.03

  // Idle is calm: HALO_FPS.idle frames a second. Thinking and the verdict run at full rate. Paced on an average.
  const loop = (now: number) => {
    raf = running ? requestAnimationFrame(loop) : 0
    const every = 1000 / (busy() ? HALO_FPS.active : HALO_FPS.idle)
    if (now < due - 1) return
    due = due + every < now ? now + every : due + every
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    const t0 = performance.now()
    update(dt)
    const t1 = performance.now()
    draw()
    stats.updateMs += t1 - t0
    stats.drawMs += performance.now() - t1
    stats.frames++
  }

  return {
    set,
    start() {
      if (running) return
      running = true
      last = performance.now()
      due = 0
      raf = requestAnimationFrame(loop)
    },
    stop() {
      running = false
      cancelAnimationFrame(raf)
    },
    /**
     * A composed still frame for reduced motion, per state: idle a few quiet chains; thinking a busy ring with
     * pulses on their way in; a verdict the whole ring in its colour. The same frame every time.
     */
    still() {
      running = false
      cancelAnimationFrame(raf)
      const target = mode === 'thinking' ? 1 : 0
      if (t === 0 || mode === 'thinking') {
        think.x = target
        think.v = 0
        for (let i = 0; i < (mode === 'thinking' ? 40 : 140); i++) update(1 / 30)
      }
      think.x = target
      think.v = 0
      if (mode === 'settled') {
        tint = 0.85
        tintHold = 0
        for (let i = 0; i < N; i++) {
          sim.hue[i] = 1
          if ((sim.act[i] as number) < 0.3 && i % 9 === 0) sim.act[i] = 0.55
        }
      } else tint = 0
      draw()
    },
    /** Test hook: run the simulation for a fixed time without a display. */
    advance(seconds: number, fps = 60) {
      for (let i = 0; i < seconds * fps; i++) update(1 / fps)
      draw()
    },
    stats,
  }
}

export type Halo = ReturnType<typeof createHalo>
