/**
 * Anna Concept Lab — data loading utilities.
 *
 * Loads:
 *  - Anna matrix from /data/anna-matrix-min.json (already in public)
 *  - Concepts from /data/phase_n/concepts.json
 *  - Random control matrix from /data/phase_n/random_controls/random_int8_seed42.json
 *  - Phase N index + verification report
 */

import type { Matrix } from '@/lib/ait/types'
import type {
  Concept,
  PhaseNIndex,
  RandomControlData,
  VerificationReport,
} from './types'

const ANNA_MATRIX_URL = '/data/anna-matrix-min.json'
const PHASE_N_BASE = '/data/phase_n'

let _annaCache: Matrix | null = null
let _conceptsCache: Concept[] | null = null
let _randomCache: RandomControlData | null = null
let _indexCache: PhaseNIndex | null = null
let _reportCache: VerificationReport | null = null

/** Fetch Anna 128×128 int8 matrix as flat Int8Array (length 16384). */
export async function loadAnnaMatrix(): Promise<Matrix> {
  if (_annaCache) return _annaCache
  const res = await fetch(ANNA_MATRIX_URL)
  if (!res.ok) throw new Error(`Failed to fetch Anna matrix: ${res.statusText}`)
  const data = await res.json() as { matrix: number[][] }
  const flat = new Int8Array(128 * 128)
  for (let i = 0; i < 128; i++) {
    for (let j = 0; j < 128; j++) {
      flat[i * 128 + j] = data.matrix[i]![j]!
    }
  }
  _annaCache = flat
  return flat
}

/** Fetch the 19 pre-computed concepts. */
export async function loadConcepts(): Promise<Concept[]> {
  if (_conceptsCache) return _conceptsCache
  const res = await fetch(`${PHASE_N_BASE}/concepts.json`)
  if (!res.ok) throw new Error(`Failed to fetch concepts: ${res.statusText}`)
  // Python output uses snake_case (concept_id, cluster_size, is_antipode_of, pos_count)
  // Lab types use camelCase. Convert.
  const raw = await res.json() as Array<{
    concept_id: number
    centroid: number[]
    cluster_size: number
    pos_count: number
    family: number
    is_antipode_of: number | null
  }>
  const concepts: Concept[] = raw.map((c) => ({
    conceptId: c.concept_id,
    centroid: c.centroid,
    clusterSize: c.cluster_size,
    posCount: c.pos_count,
    family: c.family,
    isAntipodeOf: c.is_antipode_of,
  }))
  _conceptsCache = concepts
  return concepts
}

/** Fetch the random control matrix data. */
export async function loadRandomControl(): Promise<RandomControlData> {
  if (_randomCache) return _randomCache
  const res = await fetch(`${PHASE_N_BASE}/random_controls/random_int8_seed42.json`)
  if (!res.ok) throw new Error(`Failed to fetch random control: ${res.statusText}`)
  const data = await res.json() as RandomControlData
  _randomCache = data
  return data
}

/** Convert a 128×128 number[][] matrix to flat Int8Array. */
export function matrixToFlatInt8(m: number[][]): Matrix {
  const flat = new Int8Array(128 * 128)
  for (let i = 0; i < 128; i++) {
    for (let j = 0; j < 128; j++) {
      flat[i * 128 + j] = m[i]![j]!
    }
  }
  return flat
}

/** Fetch Phase N index metadata. */
export async function loadPhaseNIndex(): Promise<PhaseNIndex> {
  if (_indexCache) return _indexCache
  const res = await fetch(`${PHASE_N_BASE}/index.json`)
  if (!res.ok) throw new Error(`Failed to fetch Phase N index: ${res.statusText}`)
  _indexCache = await res.json() as PhaseNIndex
  return _indexCache
}

/** Fetch verification report. */
export async function loadVerificationReport(): Promise<VerificationReport> {
  if (_reportCache) return _reportCache
  const res = await fetch(`${PHASE_N_BASE}/verification_report.json`)
  if (!res.ok) throw new Error(`Failed to fetch verification report: ${res.statusText}`)
  _reportCache = await res.json() as VerificationReport
  return _reportCache
}

/** Reset all caches (for HMR / testing). */
export function clearCaches(): void {
  _annaCache = null
  _conceptsCache = null
  _randomCache = null
  _indexCache = null
  _reportCache = null
}
