'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type {
  CubeFaceId,
  CubeFaceData,
  AnomalyCell,
  AnomalyData,
  MatrixData,
} from '../types'
import {
  MATRIX_SIZE,
  CUBE_FACE_SIZE,
  QUADRANT_FACE_MAPPINGS,
  OPPOSING_FACES,
} from '../constants'

// Error types
export type CubeDataErrorType =
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR'

export interface CubeDataError {
  type: CubeDataErrorType
  message: string
  details?: string
  retryable: boolean
}

interface UseContactCubeDataReturn {
  loading: boolean
  error: CubeDataError | null
  faces: Record<CubeFaceId, CubeFaceData> | null
  anomalies: AnomalyCell[]
  anomalyData: AnomalyData | null
  matrix: number[][] | null
  stats: {
    totalCells: number
    symmetricCells: number
    anomalyCells: number
    symmetryPercentage: number
  } | null
  getFaceData: (faceId: CubeFaceId) => CubeFaceData | null
  getOpposingFace: (faceId: CubeFaceId) => CubeFaceData | null
  getCellValue: (row: number, col: number) => number | null
  getMirrorValue: (row: number, col: number) => number | null
  retry: () => void
  retryCount: number
}

const FETCH_TIMEOUT = 15000
const MAX_RETRIES = 3

const ALL_FACE_IDS: CubeFaceId[] = ['front', 'back', 'left', 'right', 'top', 'bottom']

export function useContactCubeData(): UseContactCubeDataReturn {
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null)
  const [anomalyData, setAnomalyData] = useState<AnomalyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<CubeDataError | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Fetch with timeout and optional external signal
  const fetchWithTimeout = useCallback(async (url: string, timeout: number, externalSignal?: AbortSignal): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const onExternalAbort = () => controller.abort()
    externalSignal?.addEventListener('abort', onExternalAbort)

    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      return response
    } catch (err) {
      clearTimeout(timeoutId)
      throw err
    } finally {
      externalSignal?.removeEventListener('abort', onExternalAbort)
    }
  }, [])

  // Load both data files
  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)

    try {
      // Fetch matrix and anomaly data in parallel
      const [matrixResponse, anomalyResponse] = await Promise.all([
        fetchWithTimeout('/data/anna-matrix.json', FETCH_TIMEOUT, signal),
        fetchWithTimeout('/data/anna-matrix-anomalies.json', FETCH_TIMEOUT, signal),
      ])

      if (!matrixResponse.ok) {
        throw {
          type: 'NETWORK_ERROR' as CubeDataErrorType,
          message: matrixResponse.status === 404 ? 'Matrix data not found' : `Server error: ${matrixResponse.status}`,
          retryable: matrixResponse.status >= 500,
        }
      }

      if (!anomalyResponse.ok) {
        throw {
          type: 'NETWORK_ERROR' as CubeDataErrorType,
          message: anomalyResponse.status === 404 ? 'Anomaly data not found' : `Server error: ${anomalyResponse.status}`,
          retryable: anomalyResponse.status >= 500,
        }
      }

      const [matrixJson, anomalyJson] = await Promise.all([
        matrixResponse.json() as Promise<{ matrix: number[][] }>,
        anomalyResponse.json() as Promise<AnomalyData>,
      ])

      // Validate matrix structure
      if (!matrixJson.matrix || !Array.isArray(matrixJson.matrix) || matrixJson.matrix.length !== MATRIX_SIZE) {
        throw {
          type: 'VALIDATION_ERROR' as CubeDataErrorType,
          message: 'Invalid matrix structure',
          details: `Expected ${MATRIX_SIZE}x${MATRIX_SIZE} matrix`,
          retryable: false,
        }
      }

      // Validate anomaly data
      if (!anomalyJson.anomalies || !Array.isArray(anomalyJson.anomalies)) {
        throw {
          type: 'VALIDATION_ERROR' as CubeDataErrorType,
          message: 'Invalid anomaly data structure',
          details: 'Expected anomalies array',
          retryable: false,
        }
      }

      setMatrixData({ matrix: matrixJson.matrix, dimensions: { rows: MATRIX_SIZE, cols: MATRIX_SIZE } })
      setAnomalyData(anomalyJson)
      setLoading(false)
    } catch (err) {
      setLoading(false)

      if (err instanceof Error && err.name === 'AbortError') {
        setError({
          type: 'NETWORK_ERROR',
          message: 'Request timed out',
          retryable: true,
        })
        return
      }

      if (err && typeof err === 'object' && 'type' in err) {
        setError(err as CubeDataError)
        return
      }

      setError({
        type: 'UNKNOWN_ERROR',
        message: 'Failed to load cube data',
        details: err instanceof Error ? err.message : 'Unknown error',
        retryable: true,
      })
    }
  }, [fetchWithTimeout])

  useEffect(() => {
    const controller = new AbortController()
    loadData(controller.signal)
    return () => controller.abort()
  }, [loadData])

  const retry = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount((c) => c + 1)
      loadData()
    }
  }, [retryCount, loadData])

  // Process matrix to ensure all values are numbers
  const matrix = useMemo(() => {
    if (!matrixData?.matrix) return null

    return matrixData.matrix.map((row) =>
      row.map((cell) => {
        if (typeof cell === 'number') return cell
        const parsed = parseInt(String(cell), 10)
        return isNaN(parsed) ? 0 : parsed
      })
    )
  }, [matrixData])

  // Extract face data from matrix
  const extractFaceData = useCallback((
    faceId: CubeFaceId,
    matrix: number[][],
    anomalies: AnomalyCell[]
  ): CubeFaceData => {
    const mapping = QUADRANT_FACE_MAPPINGS[faceId]
    const { rowStart, colStart } = mapping
    const rowEnd = rowStart + CUBE_FACE_SIZE - 1
    const colEnd = colStart + CUBE_FACE_SIZE - 1

    // Extract cells for this face
    const cells: number[][] = []
    let min = Infinity
    let max = -Infinity
    let sum = 0
    let positiveCount = 0
    let negativeCount = 0
    let zeroCount = 0

    for (let r = rowStart; r <= rowEnd; r++) {
      const row: number[] = []
      const matrixRow = matrix[r]
      if (!matrixRow) continue

      for (let c = colStart; c <= colEnd; c++) {
        const value = matrixRow[c] ?? 0
        row.push(value)

        // Statistics
        if (value < min) min = value
        if (value > max) max = value
        sum += value
        if (value > 0) positiveCount++
        else if (value < 0) negativeCount++
        else zeroCount++
      }
      cells.push(row)
    }

    const totalCells = cells.length * (cells[0]?.length ?? 0)
    const mean = totalCells > 0 ? sum / totalCells : 0

    // Find anomalies that belong to this face
    const faceAnomalies = anomalies.filter((a) => {
      const [row, col] = a.pos
      return row >= rowStart && row <= rowEnd && col >= colStart && col <= colEnd
    }).map((a) => ({
      ...a,
      faceId,
      localPos: [a.pos[0] - rowStart, a.pos[1] - colStart] as [number, number],
    }))

    return {
      id: faceId,
      cells,
      rowRange: [rowStart, rowEnd],
      colRange: [colStart, colEnd],
      opposingFace: OPPOSING_FACES[faceId],
      anomalies: faceAnomalies,
      stats: {
        min: min === Infinity ? 0 : min,
        max: max === -Infinity ? 0 : max,
        mean,
        positiveCount,
        negativeCount,
        zeroCount,
      },
    }
  }, [])

  // Build all faces from matrix
  const faces = useMemo((): Record<CubeFaceId, CubeFaceData> | null => {
    if (!matrix || !anomalyData?.anomalies) return null

    const result = {} as Record<CubeFaceId, CubeFaceData>
    for (const faceId of ALL_FACE_IDS) {
      result[faceId] = extractFaceData(faceId, matrix, anomalyData.anomalies)
    }
    return result
  }, [matrix, anomalyData, extractFaceData])

  // Process anomalies with additional info
  const anomalies = useMemo((): AnomalyCell[] => {
    if (!anomalyData?.anomalies) return []
    return anomalyData.anomalies
  }, [anomalyData])

  // Overall statistics
  const stats = useMemo(() => {
    if (!anomalyData) return null

    return {
      totalCells: anomalyData.statistics?.totalCells ?? MATRIX_SIZE * MATRIX_SIZE,
      symmetricCells: anomalyData.statistics?.symmetricCells ?? 0,
      anomalyCells: anomalyData.statistics?.anomalyCells ?? anomalies.length,
      symmetryPercentage: anomalyData.metadata?.symmetryPercentage ?? 99.59,
    }
  }, [anomalyData, anomalies])

  // Helper functions
  const getFaceData = useCallback((faceId: CubeFaceId): CubeFaceData | null => {
    return faces?.[faceId] ?? null
  }, [faces])

  const getOpposingFace = useCallback((faceId: CubeFaceId): CubeFaceData | null => {
    if (!faces) return null
    const opposingId = OPPOSING_FACES[faceId]
    return faces[opposingId] ?? null
  }, [faces])

  const getCellValue = useCallback((row: number, col: number): number | null => {
    if (!matrix || row < 0 || row >= MATRIX_SIZE || col < 0 || col >= MATRIX_SIZE) {
      return null
    }
    return matrix[row]?.[col] ?? null
  }, [matrix])

  const getMirrorValue = useCallback((row: number, col: number): number | null => {
    // Mirror position: (127 - row, 127 - col)
    const mirrorRow = MATRIX_SIZE - 1 - row
    const mirrorCol = MATRIX_SIZE - 1 - col
    return getCellValue(mirrorRow, mirrorCol)
  }, [getCellValue])

  return {
    loading,
    error,
    faces,
    anomalies,
    anomalyData,
    matrix,
    stats,
    getFaceData,
    getOpposingFace,
    getCellValue,
    getMirrorValue,
    retry,
    retryCount,
  }
}
