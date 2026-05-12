/**
 * Sign-flip mutation: with probability `rate`, flip the sign of each cell.
 * Anna under AIT only uses sign(M); magnitudes are inert. Mutating sign-bits
 * is therefore the natural mutation operator for evolution under HyperIdentity
 * scoring pressure.
 */
export function mutate(parent: Int8Array, rate: number, rng: () => number): Int8Array {
  const child = new Int8Array(parent)
  for (let i = 0; i < parent.length; i++) {
    if (rng() < rate) child[i] = -child[i]! as -1 | 0 | 1
  }
  return child
}
