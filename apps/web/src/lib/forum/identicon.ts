/** A deterministic 5x5 pixel avatar from a string (Qubic ID or tripcode). No upload, nothing stored. */
export function identicon(seed: string): { cells: boolean[]; color: string } {
  let h = 2166136261
  for (const ch of seed) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619) >>> 0
  }
  const bits: boolean[] = []
  let x = h || 1
  for (let i = 0; i < 15; i++) {
    x ^= x << 13
    x >>>= 0
    x ^= x >>> 17
    x ^= x << 5
    x >>>= 0
    bits.push((x & 1) === 1)
  }
  const cells: boolean[] = []
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) cells.push(bits[r * 3 + (c < 3 ? c : 4 - c)]!)
  const hue = h % 360
  return { cells, color: `hsl(${hue} 45% 42%)` }
}
