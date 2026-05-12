import type { PackedMatrix } from './evolution/ait-fast'
import { packSignMatrix } from './evolution/ait-fast'
import { signWeights } from '@/lib/ait'
import type { Matrix } from '@/lib/ait/types'

/**
 * Anna's HyperIdentity baseline — measured by
 * `apps/web/src/components/evidence/cognitive-lab/__tests__/anna-baseline.test.mjs`.
 * Used as the "Anna reference" line in Sub-module A's fitness chart.
 *
 * Interpretation: with Anna's 86 % sparse-output bias, most output bits are 0,
 * which never match the ±1 input — so the baseline lands slightly below 0.5
 * (chance). This is the fitness floor that evolved matrices need to clear
 * to "beat Anna" on the literal scoring task. Convergence to Anna means
 * structural similarity, NOT fitness improvement; the structural radar
 * (Sub-module C) is where Anna's design content shows.
 */
export const ANNA_HYPERIDENTITY_BASELINE = 0.4902

export interface CognitiveLabData {
  annaMatrix: Matrix
  annaPacked: PackedMatrix
  annaBaseline: number
}

export async function loadCognitiveLabData(): Promise<CognitiveLabData> {
  const res = await fetch('/data/anna-matrix-min.json')
  if (!res.ok) throw new Error(`Anna matrix fetch failed: ${res.status}`)
  const json = await res.json()
  const matrix = json.matrix ?? json
  const flat: number[] = Array.isArray(matrix[0]) ? (matrix as number[][]).flat() : (matrix as number[])
  const annaMatrix = new Int8Array(flat)
  const annaPacked = packSignMatrix(signWeights(annaMatrix))
  return { annaMatrix, annaPacked, annaBaseline: ANNA_HYPERIDENTITY_BASELINE }
}
