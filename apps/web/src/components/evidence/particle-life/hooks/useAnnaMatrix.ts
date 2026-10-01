import { useState, useEffect, useCallback, useRef } from 'react'
import type { SamplingStrategy } from '../types'

interface UseAnnaMatrixReturn {
  matrix: number[][] | null
  isLoading: boolean
  error: string | null
  extractInteractionMatrix: (numTypes: number, strategy: SamplingStrategy) => number[][]
  generateRandomMatrix: (numTypes: number, seed: number) => number[][]
}

export function useAnnaMatrix(): UseAnnaMatrixReturn {
  const [matrix, setMatrix] = useState<number[][] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cacheRef = useRef<Map<string, number[][]>>(new Map())

  useEffect(() => {
    let cancelled = false
    fetch('/data/anna-matrix-min.json')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setMatrix(data.matrix)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setIsLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  const extractInteractionMatrix = useCallback(
    (numTypes: number, strategy: SamplingStrategy): number[][] => {
      if (!matrix) return generateRandomMatrix(numTypes, 0)

      const cacheKey = `${numTypes}-${strategy}`
      const cached = cacheRef.current.get(cacheKey)
      if (cached) return cached

      let result: number[][]

      switch (strategy) {
        case 'diagonal':
          result = extractDiagonal(matrix, numTypes)
          break
        case 'random':
          result = extractRandom(matrix, numTypes)
          break
        case 'energy-level':
          result = extractEnergyLevel(matrix, numTypes)
          break
        case 'block-average':
        default:
          result = extractBlockAverage(matrix, numTypes)
          break
      }

      cacheRef.current.set(cacheKey, result)
      return result
    },
    [matrix],
  )

  return { matrix, isLoading, error, extractInteractionMatrix, generateRandomMatrix }
}

/** Block average: divide 128x128 into numTypes x numTypes blocks, average each */
function extractBlockAverage(matrix: number[][], numTypes: number): number[][] {
  const step = Math.floor(128 / numTypes)
  const rules: number[][] = []

  for (let i = 0; i < numTypes; i++) {
    const row: number[] = []
    for (let j = 0; j < numTypes; j++) {
      const r = i * step
      const c = j * step
      let sum = 0
      let count = 0
      for (let dr = 0; dr < step && r + dr < 128; dr++) {
        for (let dc = 0; dc < step && c + dc < 128; dc++) {
          sum += matrix[r + dr]![c + dc]!
          count++
        }
      }
      row.push(Math.max(-1, Math.min(1, (sum / count) / 128)))
    }
    rules.push(row)
  }
  return rules
}

/** Diagonal: sample along the main diagonal region */
function extractDiagonal(matrix: number[][], numTypes: number): number[][] {
  const step = Math.floor(128 / numTypes)
  const rules: number[][] = []

  for (let i = 0; i < numTypes; i++) {
    const row: number[] = []
    for (let j = 0; j < numTypes; j++) {
      // Use values near the diagonal crossing of blocks i and j
      const r = Math.min(127, i * step + Math.floor(step / 2))
      const c = Math.min(127, j * step + Math.floor(step / 2))
      // Average a 3x3 region around the center
      let sum = 0
      let count = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const rr = Math.max(0, Math.min(127, r + dr))
          const cc = Math.max(0, Math.min(127, c + dc))
          sum += matrix[rr]![cc]!
          count++
        }
      }
      row.push(Math.max(-1, Math.min(1, (sum / count) / 128)))
    }
    rules.push(row)
  }
  return rules
}

/** Random: sample random row/column indices */
function extractRandom(matrix: number[][], numTypes: number): number[][] {
  // Deterministic "random" selection using golden ratio spacing
  const indices: number[] = []
  for (let i = 0; i < numTypes; i++) {
    indices.push(Math.floor(((i * 0.618033988749895) % 1) * 128))
  }
  indices.sort((a, b) => a - b)

  const rules: number[][] = []
  for (let i = 0; i < numTypes; i++) {
    const row: number[] = []
    for (let j = 0; j < numTypes; j++) {
      const val = matrix[indices[i]!]![indices[j]!]!
      row.push(Math.max(-1, Math.min(1, val / 128)))
    }
    rules.push(row)
  }
  return rules
}

/** Energy level: filter to cells near specific energy levels (±42, ±50, etc.) */
function extractEnergyLevel(matrix: number[][], numTypes: number): number[][] {
  // Use cells that are close to the known energy levels
  const targetLevels = [42, -42, 50, -50, 56, -56, 38, -38]
  const step = Math.floor(128 / numTypes)
  const rules: number[][] = []

  for (let i = 0; i < numTypes; i++) {
    const row: number[] = []
    for (let j = 0; j < numTypes; j++) {
      const r = i * step
      const c = j * step
      // Find the cell nearest to an energy level in this block
      let bestVal = matrix[r]![c]!
      let bestDist = Infinity
      for (let dr = 0; dr < step && r + dr < 128; dr++) {
        for (let dc = 0; dc < step && c + dc < 128; dc++) {
          const v = matrix[r + dr]![c + dc]!
          for (const level of targetLevels) {
            const dist = Math.abs(v - level)
            if (dist < bestDist) {
              bestDist = dist
              bestVal = v
            }
          }
        }
      }
      row.push(Math.max(-1, Math.min(1, bestVal / 128)))
    }
    rules.push(row)
  }
  return rules
}

/** Generate a seeded random interaction matrix */
export function generateRandomMatrix(numTypes: number, seed: number): number[][] {
  let s = seed
  function rand() {
    let t = (s += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const rules: number[][] = []
  for (let i = 0; i < numTypes; i++) {
    const row: number[] = []
    for (let j = 0; j < numTypes; j++) {
      row.push(rand() * 2 - 1)
    }
    rules.push(row)
  }
  return rules
}
