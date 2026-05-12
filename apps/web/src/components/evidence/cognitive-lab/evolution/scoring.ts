import { aitFastInference } from './ait-fast.ts'
import type { PackedMatrix } from './ait-fast.ts'

export const MULTITASK_NAMES = ['identity_a', 'max', 'and', 'or', 'parity', 'addition_low'] as const
export type MultiTaskName = (typeof MULTITASK_NAMES)[number]

/**
 * HyperIdentity scoring: output bit i should match input bit i.
 * Anna scores ~0.49 due to sparse-output bias; perfect identity scores 1.0.
 */
export function scoreHyperIdentity(W: PackedMatrix, samples: number, rng: () => number): number {
  let total = 0
  const input = new Int8Array(64)
  for (let s = 0; s < samples; s++) {
    for (let i = 0; i < 64; i++) input[i] = rng() < 0.5 ? -1 : 1
    const result = aitFastInference(W, input)
    let matches = 0
    for (let i = 0; i < 64; i++) {
      if (input[i]! === result.output[i]!) matches++
    }
    total += matches / 64
  }
  return total / samples
}

function groundTruth(taskIdx: number, input: Int8Array): Int8Array {
  const expected = new Int8Array(64)
  switch (MULTITASK_NAMES[taskIdx]) {
    case 'identity_a':
      for (let i = 0; i < 64; i++) expected[i] = input[i]!
      break
    case 'max':
      for (let i = 0; i < 32; i++) {
        const a = input[2 * i]! > 0 ? 1 : 0
        const b = input[2 * i + 1]! > 0 ? 1 : 0
        expected[i] = Math.max(a, b) === 1 ? 1 : -1
      }
      for (let i = 32; i < 64; i++) expected[i] = expected[i - 32]!
      break
    case 'and':
      for (let i = 0; i < 32; i++) {
        const a = input[2 * i]! > 0 ? 1 : 0
        const b = input[2 * i + 1]! > 0 ? 1 : 0
        expected[i] = a & b ? 1 : -1
      }
      for (let i = 32; i < 64; i++) expected[i] = expected[i - 32]!
      break
    case 'or':
      for (let i = 0; i < 32; i++) {
        const a = input[2 * i]! > 0 ? 1 : 0
        const b = input[2 * i + 1]! > 0 ? 1 : 0
        expected[i] = a | b ? 1 : -1
      }
      for (let i = 32; i < 64; i++) expected[i] = expected[i - 32]!
      break
    case 'parity':
      for (let i = 0; i < 16; i++) {
        let p = 0
        for (let j = 0; j < 4; j++) p ^= input[i * 4 + j]! > 0 ? 1 : 0
        expected[i] = p ? 1 : -1
      }
      for (let i = 16; i < 64; i++) expected[i] = expected[i % 16]!
      break
    case 'addition_low': {
      let a = 0
      let b = 0
      for (let i = 0; i < 32; i++) {
        if (input[i]! > 0) a |= 1 << i
        if (input[32 + i]! > 0) b |= 1 << i
      }
      const sum = (a + b) | 0
      for (let i = 0; i < 32; i++) expected[i] = (sum >>> i) & 1 ? 1 : -1
      for (let i = 32; i < 64; i++) expected[i] = expected[i - 32]!
      break
    }
  }
  return expected
}

/** Multi-task scoring: 6-dimensional fitness vector. */
export function scoreMultiTask(W: PackedMatrix, samples: number, rng: () => number): number[] {
  const totals = new Array(MULTITASK_NAMES.length).fill(0) as number[]
  const input = new Int8Array(64)
  for (let s = 0; s < samples; s++) {
    for (let i = 0; i < 64; i++) input[i] = rng() < 0.5 ? -1 : 1
    const result = aitFastInference(W, input)
    for (let task = 0; task < MULTITASK_NAMES.length; task++) {
      const expected = groundTruth(task, input)
      let matches = 0
      for (let i = 0; i < 64; i++) {
        if (expected[i]! === result.output[i]!) matches++
      }
      totals[task] = totals[task]! + matches / 64
    }
  }
  return totals.map((t) => t / samples)
}
