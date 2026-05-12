/**
 * Bit-packed sign-only AIT inference. Byte-equivalent to lib/ait `aitInference`
 * verified across 1000 random 64-bit inputs (see __tests__/ait-fast.test.mjs).
 *
 * Storage: 128×128 sign-only matrix packed as
 *   pos: Uint32Array(128 × 4) — bit i in row r set when sign(W[r,i]) > 0
 *   neg: Uint32Array(128 × 4) — bit i in row r set when sign(W[r,i]) < 0
 * Sign(W) = 0 means both bits unset.
 *
 * Vector v ∈ {-1, 0, +1}^128 packed similarly:
 *   vPos: Uint32Array(4) — bit i set when v[i] === +1
 *   vNeg: Uint32Array(4) — bit i set when v[i] === -1
 *
 * Dot product W_row · v decomposes into:
 *   dot = popcount(Wpos & vPos) + popcount(Wneg & vNeg)   // both same sign → +1
 *       - popcount(Wpos & vNeg) - popcount(Wneg & vPos)   // opposite sign → -1
 * (cells where W=0 or v=0 contribute 0 by construction)
 */

const N_NEURONS = 128
const N_INPUTS = 64
const ROW_WORDS = 4
const MAX_TICKS = 100

export interface PackedMatrix {
  /** rows × ROW_WORDS uint32 — bit-pattern of sign(W) > 0 */
  pos: Uint32Array
  /** rows × ROW_WORDS uint32 — bit-pattern of sign(W) < 0 */
  neg: Uint32Array
}

export function packSignMatrix(W: Int8Array): PackedMatrix {
  if (W.length !== N_NEURONS * N_NEURONS) {
    throw new Error(`expected ${N_NEURONS * N_NEURONS} entries, got ${W.length}`)
  }
  const pos = new Uint32Array(N_NEURONS * ROW_WORDS)
  const neg = new Uint32Array(N_NEURONS * ROW_WORDS)
  for (let r = 0; r < N_NEURONS; r++) {
    for (let c = 0; c < N_NEURONS; c++) {
      const v = W[r * N_NEURONS + c]!
      const wordIdx = r * ROW_WORDS + (c >>> 5)
      const bitIdx = c & 31
      if (v > 0) pos[wordIdx] = (pos[wordIdx]! | (1 << bitIdx)) >>> 0
      else if (v < 0) neg[wordIdx] = (neg[wordIdx]! | (1 << bitIdx)) >>> 0
    }
  }
  return { pos, neg }
}

function popcount32(x: number): number {
  x = x - ((x >>> 1) & 0x55555555)
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333)
  x = (x + (x >>> 4)) & 0x0f0f0f0f
  return (Math.imul(x, 0x01010101) >>> 24) & 0xff
}

export interface AITFastResult {
  output: Int8Array
  ticks: number
  endReason: 'NO_OUTPUT_ZEROES' | 'NO_NSTATE_CHANGES' | 'TICK_CAP'
}

/**
 * Production AIT inference — input-clamped iterative dynamics.
 * Stops when (a) every output neuron is non-zero, (b) state stops changing,
 * or (c) MAX_TICKS reached.
 */
export function aitFastInference(W: PackedMatrix, input: Int8Array): AITFastResult {
  if (input.length !== N_INPUTS) {
    throw new Error(`expected ${N_INPUTS} input bits, got ${input.length}`)
  }

  // Initial v: input bits at 0..63, output bits at 64..127 = 0
  // Pack input directly: word 0 = bits 0-31, word 1 = bits 32-63
  let vPos0 = 0
  let vPos1 = 0
  let vNeg0 = 0
  let vNeg1 = 0
  for (let i = 0; i < 32; i++) {
    if (input[i]! > 0) vPos0 = (vPos0 | (1 << i)) >>> 0
    else if (input[i]! < 0) vNeg0 = (vNeg0 | (1 << i)) >>> 0
  }
  for (let i = 0; i < 32; i++) {
    if (input[32 + i]! > 0) vPos1 = (vPos1 | (1 << i)) >>> 0
    else if (input[32 + i]! < 0) vNeg1 = (vNeg1 | (1 << i)) >>> 0
  }
  let vPos2 = 0
  let vPos3 = 0
  let vNeg2 = 0
  let vNeg3 = 0

  // Input clamp: words 0 and 1 must be re-set to clampPos / clampNeg every tick
  const clampPos0 = vPos0
  const clampPos1 = vPos1
  const clampNeg0 = vNeg0
  const clampNeg1 = vNeg1

  const Wp = W.pos
  const Wn = W.neg

  for (let t = 1; t <= MAX_TICKS; t++) {
    let nPos0 = 0
    let nPos1 = 0
    let nPos2 = 0
    let nPos3 = 0
    let nNeg0 = 0
    let nNeg1 = 0
    let nNeg2 = 0
    let nNeg3 = 0

    for (let r = 0; r < N_NEURONS; r++) {
      const base = r * ROW_WORDS
      const wp0 = Wp[base]!
      const wp1 = Wp[base + 1]!
      const wp2 = Wp[base + 2]!
      const wp3 = Wp[base + 3]!
      const wn0 = Wn[base]!
      const wn1 = Wn[base + 1]!
      const wn2 = Wn[base + 2]!
      const wn3 = Wn[base + 3]!

      let dot = 0
      dot += popcount32((wp0 & vPos0) | (wn0 & vNeg0))
      dot += popcount32((wp1 & vPos1) | (wn1 & vNeg1))
      dot += popcount32((wp2 & vPos2) | (wn2 & vNeg2))
      dot += popcount32((wp3 & vPos3) | (wn3 & vNeg3))
      dot -= popcount32((wp0 & vNeg0) | (wn0 & vPos0))
      dot -= popcount32((wp1 & vNeg1) | (wn1 & vPos1))
      dot -= popcount32((wp2 & vNeg2) | (wn2 & vPos2))
      dot -= popcount32((wp3 & vNeg3) | (wn3 & vPos3))

      if (dot > 0) {
        if (r < 32) nPos0 = (nPos0 | (1 << r)) >>> 0
        else if (r < 64) nPos1 = (nPos1 | (1 << (r - 32))) >>> 0
        else if (r < 96) nPos2 = (nPos2 | (1 << (r - 64))) >>> 0
        else nPos3 = (nPos3 | (1 << (r - 96))) >>> 0
      } else if (dot < 0) {
        if (r < 32) nNeg0 = (nNeg0 | (1 << r)) >>> 0
        else if (r < 64) nNeg1 = (nNeg1 | (1 << (r - 32))) >>> 0
        else if (r < 96) nNeg2 = (nNeg2 | (1 << (r - 64))) >>> 0
        else nNeg3 = (nNeg3 | (1 << (r - 96))) >>> 0
      }
    }

    // Apply input clamp: words 0 and 1 forced to clamp values
    nPos0 = clampPos0
    nPos1 = clampPos1
    nNeg0 = clampNeg0
    nNeg1 = clampNeg1

    // Check NO_OUTPUT_ZEROES: bits 64..127 (words 2 + 3) must all be set in (nPos | nNeg)
    const outMask2 = (nPos2 | nNeg2) >>> 0
    const outMask3 = (nPos3 | nNeg3) >>> 0
    if (outMask2 === 0xffffffff && outMask3 === 0xffffffff) {
      vPos0 = nPos0; vPos1 = nPos1; vPos2 = nPos2; vPos3 = nPos3
      vNeg0 = nNeg0; vNeg1 = nNeg1; vNeg2 = nNeg2; vNeg3 = nNeg3
      return { output: extractOutput(vPos2, vPos3, vNeg2, vNeg3), ticks: t, endReason: 'NO_OUTPUT_ZEROES' }
    }

    // Check NO_NSTATE_CHANGES
    if (
      nPos0 === vPos0 && nPos1 === vPos1 && nPos2 === vPos2 && nPos3 === vPos3 &&
      nNeg0 === vNeg0 && nNeg1 === vNeg1 && nNeg2 === vNeg2 && nNeg3 === vNeg3
    ) {
      return { output: extractOutput(nPos2, nPos3, nNeg2, nNeg3), ticks: t, endReason: 'NO_NSTATE_CHANGES' }
    }

    vPos0 = nPos0; vPos1 = nPos1; vPos2 = nPos2; vPos3 = nPos3
    vNeg0 = nNeg0; vNeg1 = nNeg1; vNeg2 = nNeg2; vNeg3 = nNeg3
  }

  return { output: extractOutput(vPos2, vPos3, vNeg2, vNeg3), ticks: MAX_TICKS, endReason: 'TICK_CAP' }
}

function extractOutput(vPos2: number, vPos3: number, vNeg2: number, vNeg3: number): Int8Array {
  const out = new Int8Array(64)
  for (let i = 0; i < 32; i++) {
    const p = (vPos2 >>> i) & 1
    const n = (vNeg2 >>> i) & 1
    out[i] = p ? 1 : n ? -1 : 0
  }
  for (let i = 0; i < 32; i++) {
    const p = (vPos3 >>> i) & 1
    const n = (vNeg3 >>> i) & 1
    out[32 + i] = p ? 1 : n ? -1 : 0
  }
  return out
}
