/**
 * The site's sound: one Web Audio graph for the whole visit. A quiet generative score underneath (made in the
 * browser, nothing downloaded), and small electric sounds on top for what people press and for what the machines
 * on the page do (BPP-9000's ticks and calls, the pool brain's sparks). Browsers let sound start only after a
 * press, so the score begins with the first press anywhere; the speaker in the header turns everything off, and
 * that choice is remembered in this browser.
 *
 * Client only. Every call is safe before the first press (it does nothing) and when sound is off.
 */
import { buildScore, type Score } from '@/components/brain/ambient'

export type Press = 'tap' | 'link' | 'open' | 'close' | 'primary' | 'on' | 'off' | 'none'

const KEY = 'qc-sound'
const PENTA = [587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.51, 1479.98]

type Listener = () => void

class Engine {
  ctx: AudioContext | null = null
  private master!: GainNode
  private music!: GainNode
  private sfx!: GainNode
  private verb!: ConvolverNode
  private score: Score | null = null
  private noiseBuf!: AudioBuffer
  private listeners = new Set<Listener>()
  private last = new Map<string, number>()
  enabled = true

  constructor() {
    if (typeof window === 'undefined') return
    try {
      this.enabled = localStorage.getItem(KEY) !== 'off'
    } catch {}
  }

  subscribe = (f: Listener) => {
    this.listeners.add(f)
    return () => this.listeners.delete(f)
  }
  get = () => this.enabled
  private emit() {
    for (const f of this.listeners) f()
  }

  /** Called from the first press: builds the graph and, if sound is on, starts the score. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended' && this.enabled) void this.ctx.resume()
      return
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    // iPhone: play even with the ring switch on silent, like a video would
    try {
      const s = (navigator as unknown as { audioSession?: { type: string } }).audioSession
      if (s) s.type = 'playback'
    } catch {}
    const ctx = new AC()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = 1.6
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.ratio.value = 4
    this.master.connect(comp).connect(ctx.destination)
    this.music = ctx.createGain()
    this.music.gain.value = 0
    this.music.connect(this.master)
    this.sfx = ctx.createGain()
    this.sfx.gain.value = 0.9
    this.sfx.connect(this.master)
    this.verb = ctx.createConvolver()
    this.verb.buffer = impulse(ctx, 3.2, 3)
    const wet = ctx.createGain()
    wet.gain.value = 0.4
    this.verb.connect(wet).connect(this.master)
    this.noiseBuf = noise(ctx, 1.5)
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return
      if (document.hidden) void this.ctx.suspend()
      else if (this.enabled) void this.ctx.resume()
    })
    if (this.enabled) this.startMusic()
    else void ctx.suspend()
  }

  setEnabled(on: boolean) {
    this.enabled = on
    try {
      localStorage.setItem(KEY, on ? 'on' : 'off')
    } catch {}
    if (!this.ctx) this.unlock()
    if (on && this.ctx) {
      void this.ctx.resume().then(() => this.press('on'))
      this.startMusic()
    } else this.stopMusic()
    this.emit()
  }

  private startMusic() {
    const ctx = this.ctx
    if (!ctx || this.score) return
    this.score = buildScore(ctx, this.music, this.verb)
    const t = ctx.currentTime
    this.music.gain.cancelScheduledValues(t)
    this.music.gain.setValueAtTime(this.music.gain.value, t)
    this.music.gain.linearRampToValueAtTime(0.2, t + 4)
  }

  private stopMusic() {
    const ctx = this.ctx
    const sc = this.score
    if (!ctx || !sc) return
    this.score = null
    const t = ctx.currentTime
    this.music.gain.cancelScheduledValues(t)
    this.music.gain.setValueAtTime(this.music.gain.value, t)
    this.music.gain.linearRampToValueAtTime(0, t + 0.6)
    window.setTimeout(() => {
      sc.stop()
      if (!this.enabled) void ctx.suspend()
    }, 700)
  }

  /** true when a sound may play now; `gap` ms keeps busy things (ticks, sparks) from piling up */
  private ok(key: string, gap: number) {
    if (!this.ctx || !this.enabled || this.ctx.state !== 'running') return false
    const now = performance.now()
    if (now - (this.last.get(key) ?? 0) < gap) return false
    this.last.set(key, now)
    return true
  }

  private out(pan = 0, rev = 0.2) {
    const ctx = this.ctx!
    const p = ctx.createStereoPanner()
    p.pan.value = Math.max(-1, Math.min(1, pan))
    p.connect(this.sfx)
    if (rev > 0) {
      const g = ctx.createGain()
      g.gain.value = rev
      p.connect(g).connect(this.verb)
    }
    return p
  }

  private tone(f: number, at: number, len: number, vol: number, out: AudioNode, type: OscillatorType = 'sine', glide?: number) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.setValueAtTime(f, at)
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, at + len)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(vol, at + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, at + len)
    o.connect(g).connect(out)
    o.start(at)
    o.stop(at + len + 0.05)
  }

  private bell(f: number, at: number, len: number, vol: number, out: AudioNode, bright = 1) {
    const ctx = this.ctx!
    const car = ctx.createOscillator()
    car.frequency.value = f
    const mod = ctx.createOscillator()
    mod.frequency.value = f * 3.5
    const amt = ctx.createGain()
    amt.gain.setValueAtTime(f * bright, at)
    amt.gain.exponentialRampToValueAtTime(1, at + len * 0.7)
    mod.connect(amt).connect(car.frequency)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(vol, at + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, at + len)
    car.connect(g).connect(out)
    car.start(at)
    mod.start(at)
    car.stop(at + len + 0.05)
    mod.stop(at + len + 0.05)
  }

  private hiss(at: number, len: number, vol: number, out: AudioNode, f0: number, f1: number, q = 8) {
    const ctx = this.ctx!
    const s = ctx.createBufferSource()
    s.buffer = this.noiseBuf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = q
    bp.frequency.setValueAtTime(f0, at)
    bp.frequency.exponentialRampToValueAtTime(f1, at + len)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(vol, at + Math.min(0.01, len / 3))
    g.gain.exponentialRampToValueAtTime(0.0001, at + len)
    s.connect(bp).connect(g).connect(out)
    s.start(at, Math.random() * 1.2, len + 0.05)
  }

  /** an electric arc: a crackle of high noise and a short mains buzz through a little drive */
  zap(strength = 0.5, pan = 0) {
    if (!this.ok('zap', 95)) return
    const ctx = this.ctx!
    const t = ctx.currentTime + 0.005
    const k = Math.max(0.15, Math.min(1, strength))
    const out = this.out(pan, 0.12)
    const n = 1 + Math.floor(k * 3)
    for (let i = 0; i < n; i++) this.hiss(t + i * (0.008 + Math.random() * 0.018), 0.012 + Math.random() * 0.03, 0.05 * k, out, 2600 + Math.random() * 4200, 1800 + Math.random() * 3000, 9)
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(90 + Math.random() * 40, t)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.03 * k, t + 0.003)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05 + 0.05 * k)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1400
    o.connect(g).connect(lp).connect(out)
    o.start(t)
    o.stop(t + 0.15)
  }

  /** BPP-9000 calls an hour: a relay closes and a note rings, higher for UP, lower for DOWN; hits ring brighter */
  call(up: boolean, hit: boolean) {
    if (!this.ok('call', 160)) return
    const t = this.ctx!.currentTime + 0.005
    const out = this.out(up ? 0.25 : -0.25, 0.3)
    this.hiss(t, 0.02, 0.06, out, 3200, 2400, 3)
    this.tone(up ? 1174.66 : 880, t, hit ? 0.5 : 0.28, hit ? 0.05 : 0.025, out, 'triangle')
    if (hit) this.tone(up ? 1760 : 1318.51, t + 0.01, 0.35, 0.012, out)
  }

  /** a spark from a miner lands in the pool brain */
  land(mine: boolean, pan = 0) {
    if (!this.ok(mine ? 'land-me' : 'land', mine ? 110 : 260)) return
    const t = this.ctx!.currentTime + 0.005
    const out = this.out(pan, 0.5)
    const f = PENTA[Math.floor(Math.random() * PENTA.length)]! * (mine ? 1 : 2)
    this.bell(f, t, mine ? 0.9 : 0.5, mine ? 0.035 : 0.012, out, mine ? 1.2 : 0.6)
    if (mine) this.hiss(t, 0.03, 0.025, out, 5000, 3000, 6)
  }

  /** a cell of Anna is chosen: its value sets the note (cold below, warm above) */
  cell(v: number) {
    if (!this.ok('cell', 60)) return
    const t = this.ctx!.currentTime + 0.005
    const out = this.out(0, 0.6)
    const idx = Math.max(0, Math.min(PENTA.length - 1, Math.round(((v + 128) / 256) * (PENTA.length - 1))))
    this.bell(PENTA[idx]! / 2, t, 1.4, 0.06, out, 1.4)
    this.bell(PENTA[idx]!, t + 0.04, 1.1, 0.025, out, 0.8)
  }

  /**
   * The machine of the future switching on: a whoop up ("uuiiii"), a dip, then it settles into a warm hum with a
   * vibrato that widens as it spins up ("uuuuuu"), a sub thump at the start and glass on top as it locks in.
   */
  powerUp() {
    if (!this.ok('power', 400)) return
    const ctx = this.ctx!
    const t = ctx.currentTime + 0.01
    const out = this.out(0, 0.35)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.Q.value = 9
    lp.frequency.setValueAtTime(300, t)
    lp.frequency.exponentialRampToValueAtTime(3800, t + 0.42)
    lp.frequency.exponentialRampToValueAtTime(1200, t + 0.75)
    lp.frequency.linearRampToValueAtTime(1700, t + 2.4)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.14, t + 0.06)
    env.gain.setValueAtTime(0.14, t + 1.6)
    env.gain.exponentialRampToValueAtTime(0.0001, t + 3.2)
    lp.connect(env).connect(out)
    // vibrato: slow and shallow while it climbs, then wider and quicker as it hums
    const vib = ctx.createOscillator()
    vib.frequency.setValueAtTime(3, t)
    vib.frequency.linearRampToValueAtTime(6.2, t + 1.2)
    const vibAmt = ctx.createGain()
    vibAmt.gain.setValueAtTime(2, t)
    vibAmt.gain.linearRampToValueAtTime(14, t + 1.4)
    vib.connect(vibAmt)
    for (const [type, mul, det] of [['sawtooth', 1, -8], ['sawtooth', 1, 8], ['square', 0.5, 0]] as [OscillatorType, number, number][]) {
      const o = ctx.createOscillator()
      o.type = type
      o.detune.value = det
      o.frequency.setValueAtTime(110 * mul, t)
      o.frequency.exponentialRampToValueAtTime(880 * mul, t + 0.38) // uu-iiii
      o.frequency.exponentialRampToValueAtTime(392 * mul, t + 0.62) // u
      o.frequency.exponentialRampToValueAtTime(587.33 * mul, t + 0.85) // UU
      o.frequency.exponentialRampToValueAtTime(293.66 * mul, t + 1.35) // uuuuu
      vibAmt.connect(o.frequency)
      const g = ctx.createGain()
      g.gain.value = type === 'square' ? 0.5 : 0.7
      o.connect(g).connect(lp)
      o.start(t)
      o.stop(t + 3.3)
    }
    vib.start(t)
    vib.stop(t + 3.3)
    // the sub thump as it engages, and the glass as it locks
    this.tone(150, t, 0.5, 0.12, out, 'sine', 45)
    this.hiss(t + 0.3, 0.35, 0.04, out, 2000, 9000, 4)
    this.bell(1174.66, t + 0.85, 1.8, 0.04, out, 1.2)
    this.bell(1760, t + 0.92, 1.6, 0.025, out, 0.9)
  }

  /** And switching off: a last lift ("uu-ii") then it winds down and the vibrato slows with it ("uuuu"). */
  powerDown() {
    if (!this.ok('power', 400)) return
    const ctx = this.ctx!
    const t = ctx.currentTime + 0.01
    const out = this.out(0, 0.35)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.Q.value = 9
    lp.frequency.setValueAtTime(1600, t)
    lp.frequency.exponentialRampToValueAtTime(3200, t + 0.25)
    lp.frequency.exponentialRampToValueAtTime(180, t + 1.7)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.12, t + 0.04)
    env.gain.setValueAtTime(0.12, t + 0.9)
    env.gain.exponentialRampToValueAtTime(0.0001, t + 2)
    lp.connect(env).connect(out)
    const vib = ctx.createOscillator()
    vib.frequency.setValueAtTime(6.2, t)
    vib.frequency.linearRampToValueAtTime(1.5, t + 1.8)
    const vibAmt = ctx.createGain()
    vibAmt.gain.setValueAtTime(14, t)
    vibAmt.gain.linearRampToValueAtTime(3, t + 1.8)
    vib.connect(vibAmt)
    for (const [type, mul, det] of [['sawtooth', 1, -8], ['sawtooth', 1, 8], ['square', 0.5, 0]] as [OscillatorType, number, number][]) {
      const o = ctx.createOscillator()
      o.type = type
      o.detune.value = det
      o.frequency.setValueAtTime(293.66 * mul, t)
      o.frequency.exponentialRampToValueAtTime(659.25 * mul, t + 0.22) // uu-ii
      o.frequency.exponentialRampToValueAtTime(440 * mul, t + 0.4)
      o.frequency.exponentialRampToValueAtTime(55 * mul, t + 1.8) // uuuu down
      vibAmt.connect(o.frequency)
      const g = ctx.createGain()
      g.gain.value = type === 'square' ? 0.5 : 0.7
      o.connect(g).connect(lp)
      o.start(t)
      o.stop(t + 2.1)
    }
    vib.start(t)
    vib.stop(t + 2.1)
    this.hiss(t + 0.2, 0.6, 0.03, out, 7000, 600, 4)
    this.tone(220, t + 1.5, 0.4, 0.06, out, 'sine', 40)
  }

  /* Maria at work: a quiet patter of data while she thinks, a pop when she answers, a chord when it is ready */
  private thinkers = 0
  private thinkT = 0
  thinkStart() {
    this.thinkers++
    if (this.thinkers > 1 || typeof window === 'undefined') return
    const run = () => {
      if (this.ctx && this.enabled && this.ctx.state === 'running') {
        const ctx = this.ctx
        const t = ctx.currentTime + 0.005
        const out = this.out(Math.random() * 1.2 - 0.6, 0.3)
        const f = PENTA[Math.floor(Math.random() * PENTA.length)]! * (Math.random() < 0.5 ? 1 : 2)
        this.tone(f, t, 0.05, 0.012, out, 'sine', f * (Math.random() < 0.5 ? 1.12 : 0.9))
        if (Math.random() < 0.25) this.hiss(t, 0.02, 0.012, out, 6000, 4000, 8)
      }
      this.thinkT = window.setTimeout(run, 70 + Math.random() * 110)
    }
    run()
  }
  thinkStop() {
    this.thinkers = Math.max(0, this.thinkers - 1)
    if (this.thinkers === 0) window.clearTimeout(this.thinkT)
  }

  /** a message from Maria appears */
  reply(fault = false) {
    if (!this.ok('reply', 220)) return
    const t = this.ctx!.currentTime + 0.005
    const out = this.out(-0.15, 0.35)
    if (fault) {
      this.tone(493.88, t, 0.18, 0.04, out, 'triangle')
      this.tone(466.16, t + 0.12, 0.3, 0.04, out, 'triangle')
      return
    }
    this.tone(880, t, 0.08, 0.035, out, 'sine', 1320)
    this.bell(1318.51, t + 0.06, 0.45, 0.025, out, 0.7)
  }

  /** Maria's result is ready; the halo's colour says how it went */
  settle(tone: 'good' | 'great' | 'warn' | 'plain') {
    if (!this.ok('settle', 300)) return
    const t = this.ctx!.currentTime + 0.01
    const out = this.out(0, 0.5)
    const notes =
      tone === 'great' ? [587.33, 739.99, 880, 1174.66] : tone === 'good' ? [587.33, 880, 1174.66] : tone === 'warn' ? [440, 415.3] : [659.25, 880]
    notes.forEach((f, i) => this.bell(f, t + i * 0.07, 1.2, tone === 'warn' ? 0.04 : 0.035, out, tone === 'warn' ? 0.5 : 1.1))
  }

  /** what a press sounds like */
  press(kind: Press, pan = 0) {
    if (kind === 'none' || !this.ok(`press-${kind}`, 40)) return
    const ctx = this.ctx!
    const t = ctx.currentTime + 0.003
    const out = this.out(pan, kind === 'tap' ? 0.08 : 0.25)
    switch (kind) {
      case 'tap':
        this.hiss(t, 0.018, 0.07, out, 4200, 2600, 4)
        this.tone(1480, t, 0.06, 0.02, out, 'sine', 1180)
        break
      case 'link':
        this.hiss(t, 0.02, 0.05, out, 3600, 2400, 4)
        this.bell(880, t, 0.35, 0.03, out, 0.7)
        this.bell(1318.51, t + 0.06, 0.4, 0.02, out, 0.6)
        break
      case 'open':
        this.hiss(t, 0.16, 0.05, out, 900, 5200, 5)
        this.tone(440, t, 0.18, 0.025, out, 'triangle', 880)
        break
      case 'close':
        this.hiss(t, 0.14, 0.04, out, 4800, 900, 5)
        this.tone(740, t, 0.16, 0.02, out, 'triangle', 370)
        break
      case 'on':
        this.tone(587.33, t, 0.18, 0.04, out, 'triangle')
        this.tone(880, t + 0.09, 0.3, 0.04, out, 'triangle')
        break
      case 'off':
        this.tone(880, t, 0.16, 0.035, out, 'triangle')
        this.tone(587.33, t + 0.08, 0.26, 0.03, out, 'triangle')
        break
      case 'primary': {
        // charging up, then the arc lands: a rising buzz, a crackle, a chord
        const o = ctx.createOscillator()
        o.type = 'sawtooth'
        o.frequency.setValueAtTime(110, t)
        o.frequency.exponentialRampToValueAtTime(440, t + 0.28)
        const bp = ctx.createBiquadFilter()
        bp.type = 'bandpass'
        bp.Q.value = 6
        bp.frequency.setValueAtTime(400, t)
        bp.frequency.exponentialRampToValueAtTime(3200, t + 0.28)
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.05, t + 0.22)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34)
        o.connect(bp).connect(g).connect(out)
        o.start(t)
        o.stop(t + 0.4)
        for (let i = 0; i < 4; i++) this.hiss(t + 0.27 + i * 0.015, 0.025, 0.07, out, 3000 + Math.random() * 4000, 2200, 7)
        this.bell(587.33, t + 0.3, 1.6, 0.05, out, 1.5)
        this.bell(880, t + 0.33, 1.4, 0.035, out, 1.2)
        this.bell(1174.66, t + 0.36, 1.2, 0.025, out, 1)
        break
      }
    }
  }
}

function impulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

function noise(ctx: AudioContext, seconds: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

let engine: Engine | null = null
/** The one engine for the page (created on the client on first use). */
export function sound(): Engine {
  if (!engine) engine = new Engine()
  return engine
}

/** Left or right in the stereo field from a screen x. */
export const panOf = (x: number) => (typeof window === 'undefined' ? 0 : (x / window.innerWidth) * 1.4 - 0.7)
