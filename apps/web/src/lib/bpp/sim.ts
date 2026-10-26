/**
 * BPP-9000 network as qubic/core scores it (src/mining/score_bpp9000.h, commit 102b70f).
 * Trits {0,1,2}: 1 = up, 0 = down, 2 = unknown. Every tick each neuron reads its k wires and looks up
 * lut[n][t0 + 3·t1 + 9·t2 …]. Whenever the clock (control) neuron is not unknown, the output neuron's
 * trit is the network's call for the next hour of the sequence. Pure code: runs on the server and in the browser.
 */
export type NetCore = { n: number; k: number; ctrl: number; out: number; init: string; lut: string; links: [number, number, number][] }
export type NetData = NetCore & {
  hash: string
  computor: string
  epoch: number
  score: number
  threshold: number | null
  /** expected trits per hour of the training year, trit2-packed base64 (4 per byte, low bits first) */
  exp: string
  windows: number
  /** unix seconds of the first hour */
  t0: number
  /** BTC close at the start of each day of the training year */
  daily: number[]
  depth: number | null
  accepted: number | null
  rejected: number | null
  epochSolutions: number | null
  live?: boolean
}

export function wiring(c: NetCore) {
  const nb = new Int16Array(c.n * c.k).fill(-1)
  for (const [t, s, src] of c.links) nb[t * c.k + s] = src
  const lut = Uint8Array.from(c.lut, ch => +ch)
  const pow = Array.from({ length: c.k }, (_, i) => 3 ** i)
  const lutSize = 3 ** c.k
  return { nb, lut, pow, lutSize }
}

export function step(c: NetCore, w: ReturnType<typeof wiring>, prev: Uint8Array): Uint8Array {
  const next = new Uint8Array(c.n)
  for (let n = 0; n < c.n; n++) {
    let idx = 0
    for (let j = 0; j < c.k; j++) idx += prev[w.nb[n * c.k + j]!]! * w.pow[j]!
    next[n] = w.lut[n * w.lutSize + idx]!
  }
  return next
}

export function initial(c: NetCore) {
  return Uint8Array.from(c.init, ch => +ch)
}

export function unpackTrits(b64: string, count: number): Uint8Array {
  const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary')
  const out = new Uint8Array(count)
  for (let i = 0; i < count; i++) out[i] = (bin.charCodeAt(i >> 2) >> (2 * (i & 3))) & 3
  return out
}

/** Full replay of the training year: every tick's state, every emit. */
export function replay(d: NetData, maxTicks = 200_000) {
  const w = wiring(d)
  const exp = unpackTrits(d.exp, d.windows)
  const states: Uint8Array[] = [initial(d)]
  const emitTick: number[] = []
  const emitVal: number[] = []
  while (emitVal.length < d.windows && states.length < maxTicks) {
    const s = step(d, w, states.at(-1)!)
    states.push(s)
    if (s[d.ctrl] !== 2) {
      emitTick.push(states.length - 1)
      emitVal.push(s[d.out]!)
    }
  }
  const hits = new Uint32Array(emitVal.length + 1)
  for (let i = 0; i < emitVal.length; i++) hits[i + 1] = hits[i]! + (emitVal[i] === exp[i] ? 1 : 0)
  return { w, exp, states, emitTick, emitVal, hits, ticks: states.length - 1 }
}
