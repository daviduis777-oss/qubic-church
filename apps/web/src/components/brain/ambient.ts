/**
 * The site's score: a quiet generative piece made in the browser with Web Audio, nothing downloaded and nothing
 * borrowed. An open drone in D that breathes through a slow filter, a faint glass shimmer above it, soft electric
 * crackle panned round the room, and a data blip now and then, like a lab instrument thinking. The sound engine
 * (`@/lib/sound/engine`) plays it into its music bus once someone has pressed something and sound is on.
 */

export type Score = { stop: () => void; blip: (strong?: boolean) => void }

const D_PENTA = [587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.51, 1479.98] // D major pentatonic, two octaves up

function noise(ctx: AudioContext, seconds: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

/** Builds the score into `out` (dry) and `verb` (the shared reverb); `stop` ends it at once (the caller fades the bus). */
export function buildScore(ctx: AudioContext, out: AudioNode, verb: AudioNode): Score {
  const master = ctx.createGain()
  master.gain.value = 1
  master.connect(out)
  const dry = ctx.createGain()
  dry.gain.value = 0.8
  dry.connect(master)
  const send = (node: AudioNode, amount: number) => {
    const g = ctx.createGain()
    g.gain.value = amount
    node.connect(g).connect(verb)
  }

  const nodes: { stop: (t?: number) => void }[] = []
  let crackleT = 0
  let blipT = 0

  /* the drone: an open D (root, fifth, octave, ninth), each voice a pair of slightly detuned oscillators */
  const pad = ctx.createBiquadFilter()
  pad.type = 'lowpass'
  pad.frequency.value = 900
  pad.Q.value = 0.7
  const padGain = ctx.createGain()
  padGain.gain.value = 0.16
  pad.connect(padGain)
  padGain.connect(dry)
  send(padGain, 0.6)
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.035
  const lfoAmt = ctx.createGain()
  lfoAmt.gain.value = 450
  lfo.connect(lfoAmt).connect(pad.frequency)
  lfo.start()
  nodes.push(lfo)
  for (const [f, type, g] of [
    [73.42, 'sine', 0.9],
    [110, 'triangle', 0.35],
    [146.83, 'sine', 0.45],
    [164.81, 'sine', 0.18],
    [220, 'triangle', 0.16],
    // the upper voices carry the drone on phone and laptop speakers, which drop everything under ~250 Hz
    [293.66, 'triangle', 0.2],
    [440, 'sine', 0.12],
  ] as [number, OscillatorType, number][]) {
    for (const det of [-4, 4]) {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.value = f
      o.detune.value = det
      const og = ctx.createGain()
      og.gain.value = g * 0.5
      o.connect(og).connect(pad)
      o.start()
      nodes.push(o)
    }
  }

  /* the shimmer: two glassy high partials that swell and fade */
  for (const [f, rate] of [
    [1174.66, 0.07],
    [1760, 0.05],
  ] as [number, number][]) {
    const o = ctx.createOscillator()
    o.frequency.value = f
    const g = ctx.createGain()
    g.gain.value = 0
    const t = ctx.createOscillator()
    t.frequency.value = rate
    const tg = ctx.createGain()
    tg.gain.value = 0.026
    t.connect(tg).connect(g.gain)
    o.connect(g)
    send(g, 1)
    o.start()
    t.start()
    nodes.push(o, t)
  }

  /* electric crackle: short bursts of filtered noise, panned at random, a few a second */
  const hiss = noise(ctx, 2)
  const crackle = () => {
    const t = ctx.currentTime
    const n = 1 + Math.floor(Math.random() * 3)
    for (let k = 0; k < n; k++) {
      const s = ctx.createBufferSource()
      s.buffer = hiss
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 2200 + Math.random() * 5200
      bp.Q.value = 6 + Math.random() * 10
      const g = ctx.createGain()
      const at = t + k * (0.012 + Math.random() * 0.03)
      const len = 0.006 + Math.random() * 0.03
      g.gain.setValueAtTime(0, at)
      g.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.07, at + 0.002)
      g.gain.exponentialRampToValueAtTime(0.0001, at + len)
      const pan = ctx.createStereoPanner()
      pan.pan.value = Math.random() * 1.8 - 0.9
      s.connect(bp).connect(g).connect(pan)
      pan.connect(dry)
      send(pan, 0.25)
      s.start(at, Math.random() * 1.5, len + 0.02)
    }
    crackleT = window.setTimeout(crackle, 180 + Math.random() * 900)
  }

  /* data blips: a soft FM bell on the pentatonic, now and then, a little brighter when someone joins */
  const blip = (strong = false) => {
    const t = ctx.currentTime + 0.01
    const f = D_PENTA[Math.floor(Math.random() * D_PENTA.length)]! * (strong ? 1 : Math.random() < 0.3 ? 0.5 : 1)
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
    const pan = ctx.createStereoPanner()
    pan.pan.value = Math.random() * 1.2 - 0.6
    car.connect(g).connect(pan)
    pan.connect(dry)
    send(pan, 0.8)
    car.start(t)
    mod.start(t)
    car.stop(t + 3)
    mod.stop(t + 3)
  }
  const blips = () => {
    blip()
    blipT = window.setTimeout(blips, 1800 + Math.random() * 3800)
  }

  crackleT = window.setTimeout(crackle, 1200)
  blipT = window.setTimeout(blips, 3000)

  return {
    blip,
    stop() {
      window.clearTimeout(crackleT)
      window.clearTimeout(blipT)
      for (const n of nodes) {
        try {
          n.stop()
        } catch {}
      }
      master.disconnect()
    },
  }
}
