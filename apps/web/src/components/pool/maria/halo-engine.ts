/**
 * Maria's halo: a golden orrery around her face, drawn on two 2D canvases (behind and in front of the avatar).
 * Outermost to innermost: an engraved bezel with 60 ticks, counter-rotating jewelled arcs, 676 particles of
 * gold dust in a precessing elliptical vortex (one per Qubic computor), and a breathing bloom behind the face.
 *
 * Pure TypeScript, no React. State changes are eased with springs; nothing jumps.
 */

export type HaloMode = 'idle' | 'thinking' | 'settled'
export type HaloOptions = { size: number; face: number; dpr?: number }

export const N = 676
const TAU = Math.PI * 2
export const GOLD: RGB = [254, 206, 52] // site --accent-gold, oklch(0.87 0.165 90)
export const GOLD_HI: RGB = [255, 231, 124] // --accent-gold-strong
export const GOLD_DIM: RGB = [177, 132, 6] // --accent-gold-dim
export const HOT: RGB = [255, 244, 205]

export type RGB = [number, number, number]

const hex = (h: string): RGB => {
  const n = Number.parseInt(h.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
export const mix = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
export const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, Math.min(1, a)).toFixed(3)})`

/** Deterministic noise so every render of the halo is the same sky. */
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

/** A damped spring toward a target, for eased, slightly alive transitions. */
type Spring = { x: number; v: number; k: number; c: number }
const spring = (k: number, c: number): Spring => ({ x: 0, v: 0, k, c })
const step = (s: Spring, target: number, dt: number) => {
  const a = -s.k * (s.x - target) - s.c * s.v
  s.v += a * dt
  s.x += s.v * dt
}

/**
 * The 676 grains: base radius (fraction of R), angle, angular-speed factor, phase, twinkle frequency, size.
 * Seeded, so the live halo and the share card's still (halo-svg.ts) draw the same sky.
 */
export function seedDust(dustIn: number, dustOut: number) {
  const r0 = new Float32Array(N)
  const phi = new Float32Array(N)
  const om = new Float32Array(N)
  const ph = new Float32Array(N)
  const tw = new Float32Array(N)
  const sz = new Float32Array(N)
  const rand = rng(676)
  for (let i = 0; i < N; i++) {
    // mostly a broad band, with two denser lanes like the rings of a planet
    const lane = rand()
    const u = lane < 0.5 ? rand() ** 1.35 : lane < 0.78 ? 0.3 + (rand() - 0.5) * 0.14 : lane < 0.93 ? 0.62 + (rand() - 0.5) * 0.1 : 0.85 + rand() * 0.2
    r0[i] = dustIn + (dustOut - dustIn) * Math.min(1, Math.max(0, u))
    phi[i] = rand() * TAU
    om[i] = (0.42 / (r0[i] as number)) ** 1.5 * (0.85 + rand() * 0.3) // Keplerian: inner orbits are faster
    ph[i] = rand() * TAU
    tw[i] = 0.5 + rand() * 1.8
    sz[i] = 0.5 + rand() ** 2.5 * 1.1
  }
  return { r0, phi, om, ph, tw, sz }
}

export const ARCS = [
  { at: 0.15, len: 1.3, dash: false },
  { at: 1.95, len: 0.55, dash: true },
  { at: 3.05, len: 1.65, dash: false },
  { at: 5.1, len: 0.34, dash: true },
]

export function createHalo(back: HTMLCanvasElement, front: HTMLCanvasElement, opts: HaloOptions) {
  const S = opts.size
  const dpr = Math.min(2, opts.dpr ?? 1)
  for (const c of [back, front]) {
    c.width = Math.round(S * dpr)
    c.height = Math.round(S * dpr)
  }
  const bx = back.getContext('2d')
  const fx = front.getContext('2d')
  if (!bx || !fx) throw new Error('canvas 2d unavailable')

  const C = S / 2
  const R = S / 2 - 1
  const faceR = opts.face / 2
  const dustIn = Math.max(faceR + 6, R * 0.33) / R
  const dustOut = 0.74

  const { r0, phi, om, ph, tw, sz } = seedDust(dustIn, dustOut)

  // pre-rendered glow sprite for the jewels
  const sprite = document.createElement('canvas')
  const sp = 32
  sprite.width = sprite.height = sp
  const sx = sprite.getContext('2d')
  if (sx) {
    const g = sx.createRadialGradient(sp / 2, sp / 2, 0, sp / 2, sp / 2, sp / 2)
    g.addColorStop(0, 'rgba(255,244,205,0.95)')
    g.addColorStop(0.25, 'rgba(254,206,52,0.45)')
    g.addColorStop(1, 'rgba(254,206,52,0)')
    sx.fillStyle = g
    sx.fillRect(0, 0, sp, sp)
  }

  const glowX = new Float32Array(N)
  const glowY = new Float32Array(N)

  const think = spring(34, 8.5) // 0 idle .. 1 thinking, with a little overshoot
  const kick = spring(70, 9) // outward breath after a verdict
  let mode: HaloMode = 'idle'
  let tone: RGB = GOLD
  let tint = 0
  let tintHold = 0
  let shock = -1 // seconds since the verdict shockwave started, -1 = none
  let shockTone: RGB = GOLD
  let bezel = 0
  let arcs = 0
  let prec = 0
  let sweep = 0
  let t = 0

  function set(next: HaloMode, toneHex?: string) {
    if (next === 'settled' && mode !== 'settled') {
      shock = 0
      shockTone = toneHex ? hex(toneHex) : GOLD
      kick.v += 2.6
      tint = 1
      tintHold = 1.6
    }
    if (toneHex) tone = hex(toneHex)
    if (next === 'thinking' && mode !== 'thinking') sweep = bezel
    mode = next
  }

  /** Advance the simulation by dt seconds. */
  function update(dt: number) {
    t += dt
    step(think, mode === 'thinking' ? 1 : 0, dt)
    step(kick, 0, dt)
    const th = Math.max(-0.1, think.x)
    const speed = 1 + 2 * th // about 3x while thinking
    for (let i = 0; i < N; i++) phi[i] = (phi[i] as number) + (om[i] as number) * speed * dt
    bezel += (TAU / 120) * (1 + 0.6 * th) * dt
    arcs -= (TAU / 40) * (1 + 1.6 * th) * dt
    prec += (0.035 + 0.08 * th) * dt
    sweep += 2.4 * dt
    if (shock >= 0) {
      shock += dt
      if (shock > 1.6) shock = -1
    }
    if (tintHold > 0) tintHold -= dt
    else tint *= Math.exp(-dt / 1.8)
  }

  function draw() {
    const th = Math.max(0, think.x)
    const kk = kick.x
    for (const g of [bx, fx] as CanvasRenderingContext2D[]) {
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.globalCompositeOperation = 'source-over'
      g.clearRect(0, 0, S, S)
      g.globalCompositeOperation = 'lighter'
    }
    const g = bx as CanvasRenderingContext2D
    const f = fx as CanvasRenderingContext2D

    // d) inner bloom, breathing on a 6 s period; pulses with the work; tinted after a verdict
    const breath = 0.5 + 0.5 * Math.sin((t * TAU) / 6)
    const pulse = 0.5 + 0.5 * Math.sin(t * 7.5)
    const bloomC = mix(GOLD, tone, tint * 0.85)
    const bloomA = 0.11 + 0.06 * breath + th * (0.16 + 0.1 * pulse)
    const bloom = g.createRadialGradient(C, C, faceR * 0.6, C, C, R * (0.66 + 0.06 * breath + 0.06 * th))
    bloom.addColorStop(0, rgba(bloomC, bloomA * 1.5))
    bloom.addColorStop(0.35, rgba(bloomC, bloomA * 0.6))
    bloom.addColorStop(1, rgba(bloomC, 0))
    g.fillStyle = bloom
    g.fillRect(0, 0, S, S)

    // a faint lane of light where the dust is densest, so the disk has depth
    const lane = g.createRadialGradient(C, C, R * 0.3, C, C, R * 0.62)
    lane.addColorStop(0, rgba(GOLD, 0))
    lane.addColorStop(0.45, rgba(GOLD, 0.035 + th * 0.03))
    lane.addColorStop(1, rgba(GOLD, 0))
    g.fillStyle = lane
    g.fillRect(0, 0, S, S)

    // a) the engraved bezel: hairline, 60 ticks, a longer one every 5, slow clockwise turn
    const rb = R * 0.965
    g.lineWidth = 1
    g.strokeStyle = rgba(GOLD, 0.3)
    g.beginPath()
    g.arc(C, C, rb, 0, TAU)
    g.stroke()
    g.strokeStyle = rgba(GOLD, 0.1)
    g.beginPath()
    g.arc(C, C, rb - R * 0.09, 0, TAU)
    g.stroke()
    for (let i = 0; i < 60; i++) {
      const a = bezel + (i / 60) * TAU
      const major = i % 5 === 0
      const baseLen = R * (major ? 0.075 : 0.035)
      // the sweep: ticks light up one after another while she works
      let lit = 0
      if (th > 0.02) {
        const d = (((sweep - (i / 60) * TAU) % TAU) + TAU) % TAU
        lit = th * Math.exp(-d * 2.2)
      }
      const len = baseLen * (1 + lit * 0.7)
      const c = Math.cos(a)
      const s = Math.sin(a)
      g.strokeStyle = rgba(lit > 0.25 ? mix(GOLD, HOT, lit) : GOLD, (major ? 0.55 : 0.26) + lit * 0.7)
      g.lineWidth = major ? 1.15 : 0.8
      g.beginPath()
      g.moveTo(C + c * rb, C + s * rb)
      g.lineTo(C + c * (rb - len), C + s * (rb - len))
      g.stroke()
    }

    // b) counter-rotating arcs, a soft glow under each, a jewel riding along
    const rm = R * 0.81
    for (let k = 0; k < ARCS.length; k++) {
      const arc = ARCS[k]!
      const a0 = arcs + arc.at
      const a1 = a0 + arc.len
      g.setLineDash([])
      g.strokeStyle = rgba(GOLD, 0.05 + th * 0.05)
      g.lineWidth = 5
      g.beginPath()
      g.arc(C, C, rm, a0, a1)
      g.stroke()
      g.setLineDash(arc.dash ? [1.4, 3.2] : [])
      g.strokeStyle = rgba(GOLD_HI, 0.5 + th * 0.25)
      g.lineWidth = arc.dash ? 1.1 : 0.9
      g.beginPath()
      g.arc(C, C, rm, a0, a1)
      g.stroke()
      g.setLineDash([])
      // end caps, like the screws of a movement
      g.strokeStyle = rgba(GOLD, 0.45)
      g.lineWidth = 0.8
      for (const e of [a0, a1]) {
        const c = Math.cos(e)
        const s = Math.sin(e)
        g.beginPath()
        g.moveTo(C + c * (rm - 3), C + s * (rm - 3))
        g.lineTo(C + c * (rm + 3), C + s * (rm + 3))
        g.stroke()
      }
      const u = 0.5 + 0.5 * Math.sin(t * (0.55 + k * 0.17) * (1 + th) + k * 1.7)
      const ja = a0 + arc.len * u
      const jx = C + Math.cos(ja) * rm
      const jy = C + Math.sin(ja) * rm
      const js = 10 + th * 4
      g.globalAlpha = 0.75 + th * 0.25
      g.drawImage(sprite, jx - js / 2, jy - js / 2, js, js)
      g.globalAlpha = 1
      g.fillStyle = rgba(HOT, 0.95)
      g.beginPath()
      g.arc(jx, jy, 1.05, 0, TAU)
      g.fill()
    }

    // c) 676 particles of gold dust in a precessing elliptical vortex, with short trails and twinkle
    const tilt = 0.8
    const cp = Math.cos(prec)
    const sp2 = Math.sin(prec)
    const trail = 0.045 + th * 0.07
    const speed = 1 + 2 * th
    const buckets = 4
    const paths: Path2D[] = []
    const heads: Path2D[] = []
    const fronts: Path2D[] = []
    for (let b = 0; b < buckets; b++) {
      paths.push(new Path2D())
      heads.push(new Path2D())
      fronts.push(new Path2D())
    }
    let nGlow = 0
    const inner = faceR + 2
    for (let i = 0; i < N; i++) {
      const wob = 1 + 0.018 * Math.sin(t * 0.7 + ph[i]!)
      const pull = 1 - th * (0.36 + 0.14 * Math.sin(ph[i]! + t * 0.9)) // spiral in toward her while thinking
      const r = r0[i]! * R * wob * pull * (1 + 0.09 * kk)
      const a = phi[i]!
      const pa = a - om[i]! * speed * trail
      // ellipse in its own frame, then the slow precession of its axis
      const ex = Math.cos(a) * r
      const ey = Math.sin(a) * r * tilt
      const qx = Math.cos(pa) * r
      const qy = Math.sin(pa) * r * tilt
      const x = C + ex * cp - ey * sp2
      const y = C + ex * sp2 + ey * cp
      const x0 = C + qx * cp - qy * sp2
      const y0 = C + qx * sp2 + qy * cp
      const twk = 0.5 + 0.5 * Math.sin(t * tw[i]! + ph[i]!)
      const b = Math.min(buckets - 1, (twk * buckets) | 0)
      const dx = x - C
      const dy = y - C
      // the near half of the disk passes in front of her face
      if (Math.sin(a) > 0 && dx * dx + dy * dy < inner * inner) {
        fronts[b]!.moveTo(x0, y0)
        fronts[b]!.lineTo(x, y)
        continue
      }
      paths[b]!.moveTo(x0, y0)
      paths[b]!.lineTo(x, y)
      const s = sz[i]! * (1 + th * 0.3)
      heads[b]!.rect(x - s / 2, y - s / 2, s, s)
      // the brightest grains carry a soft glow, so the dense lanes bloom
      if (b === buckets - 1 && sz[i]! > 0.8) {
        glowX[nGlow] = x
        glowY[nGlow++] = y
      }
    }
    g.globalAlpha = 0.16 + th * 0.14
    const gs = 7 + th * 3
    for (let k = 0; k < nGlow; k++) g.drawImage(sprite, glowX[k]! - gs / 2, glowY[k]! - gs / 2, gs, gs)
    g.globalAlpha = 1
    for (let b = 0; b < buckets; b++) {
      const k = (b + 0.5) / buckets
      const col = mix(mix(GOLD_DIM, GOLD, Math.min(1, k * 1.6)), HOT, Math.max(0, k - 0.7) * 1.6)
      g.strokeStyle = rgba(col, 0.08 + k * 0.16 + th * 0.16)
      g.lineWidth = 0.7
      g.stroke(paths[b]!)
      g.fillStyle = rgba(col, 0.35 + k * 0.6)
      g.fill(heads[b]!)
      f.strokeStyle = rgba(col, 0.1 + k * 0.22)
      f.lineWidth = 0.7
      f.stroke(fronts[b]!)
    }

    // the verdict: one shockwave out from her face, in the verdict colour
    if (shock >= 0) {
      const p = Math.min(1, shock / 1.4)
      const e = 1 - (1 - p) ** 3
      const rr = faceR + (R * 1.0 - faceR) * e
      const a = (1 - p) ** 1.6
      g.strokeStyle = rgba(shockTone, 0.14 * a)
      g.lineWidth = 7 * (1 - p) + 2
      g.beginPath()
      g.arc(C, C, rr, 0, TAU)
      g.stroke()
      g.strokeStyle = rgba(mix(shockTone, HOT, 0.25), 0.85 * a)
      g.lineWidth = 0.6 + 0.9 * (1 - p)
      g.beginPath()
      g.arc(C, C, rr, 0, TAU)
      g.stroke()
    }
  }

  let raf = 0
  let last = 0
  let running = false
  const stats = { frames: 0, drawMs: 0 }

  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    update(dt)
    const t0 = performance.now()
    draw()
    stats.drawMs += performance.now() - t0
    stats.frames++
    raf = running ? requestAnimationFrame(loop) : 0
  }

  return {
    set,
    start() {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(loop)
    },
    stop() {
      running = false
      cancelAnimationFrame(raf)
    },
    /** A composed still frame for reduced motion: the dust frozen mid-orbit, state applied instantly. */
    still() {
      running = false
      cancelAnimationFrame(raf)
      if (t === 0) for (let i = 0; i < 220; i++) update(1 / 30)
      think.x = mode === 'thinking' ? 1 : 0
      think.v = 0
      kick.x = kick.v = 0
      shock = -1
      if (mode !== 'settled') tint = 0
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
