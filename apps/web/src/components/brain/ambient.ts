/**
 * The site's score: a calm, wide electronic piece made in the browser with Web Audio, nothing downloaded and
 * nothing borrowed. A sequencer at 84 BPM runs an eighth-note arpeggio of soft glass plucks through a long echo
 * over four chords in D (Dmaj9, Bm9, Gmaj7#11, A sus), a broad pad that swells with each bar over a held low root,
 * a few soft ticks and a low pulse on the downbeat. The arpeggio mutates every four bars and the ticks
 * drop out now and then, so it never loops the same way twice. The sound engine (`@/lib/sound/engine`) plays it
 * into its music bus once someone has pressed something and sound is on.
 */

export type Score = { stop: () => void; blip: (strong?: boolean) => void }

const D_PENTA = [587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.51, 1479.98]
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

// four chords as MIDI notes: the pad voicing and the tones the arpeggio climbs through
const CHORDS: { root: number; pad: number[]; arp: number[] }[] = [
  { root: 38, pad: [50, 54, 57, 61], arp: [62, 66, 69, 73, 76, 78] }, // Dmaj9
  { root: 35, pad: [47, 50, 54, 57], arp: [59, 62, 66, 69, 73, 74] }, // Bm9
  { root: 31, pad: [43, 47, 50, 54], arp: [55, 59, 62, 66, 68, 71] }, // Gmaj7#11
  { root: 33, pad: [45, 50, 52, 57], arp: [57, 62, 64, 69, 71, 76] }, // A sus2/4
]

function noise(ctx: AudioContext, seconds: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

/** A fresh arpeggio: 16 steps, each an index into the chord's tones or a rest (-1). */
function pattern(): number[] {
  const shapes = [
    [0, 1, 2, 3, 4, 3, 2, 1],
    [0, 2, 1, 3, 2, 4, 3, 5],
    [0, 2, 4, 2, 5, 3, 1, 3],
    [4, 3, 2, 0, 1, 2, 3, 5],
  ]
  const a = shapes[Math.floor(Math.random() * shapes.length)]!
  const b = shapes[Math.floor(Math.random() * shapes.length)]!
  const p = [...a, ...b]
  for (let i = 0; i < p.length; i++) if (i % 4 === 3 && Math.random() < 0.3) p[i] = -1
  return p
}

/** Builds the score into `out` (dry) and `verb` (the shared reverb); `stop` ends it at once (the caller fades the bus). */
export function buildScore(ctx: AudioContext, out: AudioNode, verb: AudioNode): Score {
  const master = ctx.createGain()
  master.gain.value = 1
  master.connect(out)
  const send = (node: AudioNode, amount: number) => {
    const g = ctx.createGain()
    g.gain.value = amount
    node.connect(g).connect(verb)
  }

  // the echo: dotted eighths, darkening as they repeat
  const BEAT = 60 / 84
  const SIX = BEAT / 4
  const echo = ctx.createDelay(2)
  echo.delayTime.value = SIX * 3
  const fb = ctx.createGain()
  fb.gain.value = 0.45
  const dark = ctx.createBiquadFilter()
  dark.type = 'lowpass'
  dark.frequency.value = 2000
  echo.connect(dark).connect(fb).connect(echo)
  const echoOut = ctx.createGain()
  echoOut.gain.value = 0.36
  dark.connect(echoOut).connect(master)

  // the pad: detuned saws through a soft filter, its level pumping on every beat
  const padF = ctx.createBiquadFilter()
  padF.type = 'lowpass'
  padF.frequency.value = 1100
  padF.Q.value = 0.6
  const pump = ctx.createGain()
  pump.gain.value = 0
  padF.connect(pump).connect(master)
  send(pump, 0.7)
  const padVoices: OscillatorNode[] = []
  for (let v = 0; v < 4; v++)
    for (const det of [-7, 7]) {
      const o = ctx.createOscillator()
      o.type = 'sawtooth'
      o.detune.value = det
      o.frequency.value = hz(CHORDS[0]!.pad[v]!)
      const g = ctx.createGain()
      g.gain.value = 0.022
      o.connect(g).connect(padF)
      o.start()
      padVoices.push(o)
    }

  // a held low root under it all, the floor the chords stand on
  const root = ctx.createOscillator()
  root.type = 'triangle'
  root.frequency.value = hz(CHORDS[0]!.root + 12)
  const rootG = ctx.createGain()
  rootG.gain.value = 0.05
  root.connect(rootG).connect(padF)
  root.start()
  padVoices.push(root)

  const hiss = noise(ctx, 1)
  let stopped = false

  const pluck = (f: number, t: number, vol: number, pan: number) => {
    const o = ctx.createOscillator()
    o.type = 'square'
    o.frequency.value = f
    const o2 = ctx.createOscillator()
    o2.type = 'sine'
    o2.frequency.value = f * 2
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.Q.value = 4
    lp.frequency.setValueAtTime(2600, t)
    lp.frequency.exponentialRampToValueAtTime(420, t + 0.5)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
    const g2 = ctx.createGain()
    g2.gain.value = 0.35
    const p = ctx.createStereoPanner()
    p.pan.value = pan
    o.connect(lp)
    o2.connect(g2).connect(lp)
    lp.connect(g).connect(p)
    p.connect(master)
    p.connect(echo)
    send(p, 0.35)
    o.start(t)
    o2.start(t)
    o.stop(t + 0.75)
    o2.stop(t + 0.75)
  }

  const tick = (t: number, vol: number, open: boolean) => {
    const s = ctx.createBufferSource()
    s.buffer = hiss
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 7500
    const g = ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + (open ? 0.12 : 0.035))
    const p = ctx.createStereoPanner()
    p.pan.value = 0.3
    s.connect(hp).connect(g).connect(p).connect(master)
    s.start(t, Math.random() * 0.8, 0.15)
  }

  const pulse = (f: number, t: number) => {
    const o = ctx.createOscillator()
    o.frequency.setValueAtTime(f * 2, t)
    o.frequency.exponentialRampToValueAtTime(f, t + 0.08)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.06, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
    o.connect(g).connect(master)
    o.start(t)
    o.stop(t + 1)
  }

  // the sequencer: schedules a little ahead of the clock, a step at a time
  let step = 0
  let bar = 0
  let next = ctx.currentTime + 0.1
  let pat = pattern()
  let ticks = true
  const schedule = () => {
    if (stopped) return
    // after a pause (hidden tab) pick up from now rather than racing through the missed steps
    if (next < ctx.currentTime - 0.2) next = ctx.currentTime + 0.05
    while (next < ctx.currentTime + 0.15) {
      const s = step % 16
      const ch = CHORDS[bar % 4]!
      if (s === 0) {
        // new bar: move the pad to the chord, maybe a new arpeggio, maybe a breath without ticks
        for (let v = 0; v < 4; v++) for (let k = 0; k < 2; k++) padVoices[v * 2 + k]!.frequency.setTargetAtTime(hz(ch.pad[v]!), next, 0.18)
        if (bar % 4 === 0 && bar > 0) pat = pattern()
        ticks = bar % 8 < 6
      }
      if (s === 0) {
        // the pad swells with the bar instead of pumping on the beat; a soft pulse on the downbeat
        pump.gain.cancelScheduledValues(next)
        pump.gain.setValueAtTime(pump.gain.value, next)
        pump.gain.linearRampToValueAtTime(0.55, next + 0.08)
        pump.gain.linearRampToValueAtTime(1, next + BEAT * 2.5)
        pump.gain.linearRampToValueAtTime(0.8, next + BEAT * 4)
        pulse(hz(ch.root), next)
        root.frequency.setTargetAtTime(hz(ch.root + 12), next, 0.3)
      }
      const i = pat[s]!
      if (s % 2 === 0 && i >= 0) pluck(hz(ch.arp[i]!), next, s % 8 === 0 ? 0.04 : 0.026, s % 4 ? 0.4 : -0.4)
      if (ticks && s === 12) tick(next, 0.014, true)
      next += SIX
      step++
      if (step % 16 === 0) bar++
    }
  }
  schedule()
  const timer = window.setInterval(schedule, 25)

  /* data blips: a soft FM bell on the pentatonic, a little brighter when someone joins */
  const blip = (strong = false) => {
    const t = ctx.currentTime + 0.01
    const f = D_PENTA[Math.floor(Math.random() * D_PENTA.length)]!
    const car = ctx.createOscillator()
    car.frequency.value = f
    const mod = ctx.createOscillator()
    mod.frequency.value = f * 3.5
    const modAmt = ctx.createGain()
    modAmt.gain.setValueAtTime(f * (strong ? 1.6 : 0.9), t)
    modAmt.gain.exponentialRampToValueAtTime(1, t + 1.2)
    mod.connect(modAmt).connect(car.frequency)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(strong ? 0.11 : 0.065, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + (strong ? 2.6 : 1.8))
    car.connect(g).connect(master)
    send(g, 0.8)
    car.start(t)
    mod.start(t)
    car.stop(t + 3)
    mod.stop(t + 3)
  }

  return {
    blip,
    stop() {
      stopped = true
      window.clearInterval(timer)
      for (const o of padVoices) {
        try {
          o.stop()
        } catch {}
      }
      master.disconnect()
      dark.disconnect()
    },
  }
}
