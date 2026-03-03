'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { AnnaMatrixData, MatrixStats, MatrixCell } from './types'

// Error types
export type MatrixErrorType =
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR'

export interface MatrixError {
  type: MatrixErrorType
  message: string
  details?: string
  retryable: boolean
}

interface UseAnnaMatrixDataReturn {
  loading: boolean
  error: MatrixError | null
  data: AnnaMatrixData | null
  matrix: number[][] | null
  stats: MatrixStats | null
  getCell: (row: number, col: number) => MatrixCell | null
  getCellColor: (value: number) => string
  getNormalizedValue: (value: number) => number
  retry: () => void
  retryCount: number
}

const FETCH_TIMEOUT = 15000
const MAX_RETRIES = 3

// Color scale for heatmap (blue -> white -> orange)
function getHeatmapColor(normalizedValue: number): string {
  // normalizedValue is 0-1, where 0.5 is zero (neutral)
  if (normalizedValue < 0.5) {
    // Blue range (negative values)
    const intensity = 1 - normalizedValue * 2 // 1 at 0, 0 at 0.5
    const blue = Math.round(150 + 105 * intensity) // 150-255
    const green = Math.round(150 * (1 - intensity)) // 0-150
    const red = Math.round(100 * (1 - intensity)) // 0-100
    return `rgb(${red}, ${green}, ${blue})`
  } else {
    // Orange range (positive values)
    const intensity = (normalizedValue - 0.5) * 2 // 0 at 0.5, 1 at 1
    const red = Math.round(200 + 55 * intensity) // 200-255
    const green = Math.round(150 - 50 * intensity) // 100-150
    const blue = Math.round(100 * (1 - intensity)) // 0-100
    return `rgb(${red}, ${green}, ${blue})`
  }
}

export function useAnnaMatrixData(): UseAnnaMatrixDataReturn {
  const [data, setData] = useState<AnnaMatrixData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<MatrixError | null>(null)
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

  // Load data
  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchWithTimeout('/data/anna-matrix.json', FETCH_TIMEOUT, signal)

      if (!response.ok) {
        throw {
          type: 'NETWORK_ERROR' as MatrixErrorType,
          message: response.status === 404 ? 'Matrix data not found' : `Server error: ${response.status}`,
          retryable: response.status >= 500,
        }
      }

      const json = await response.json() as AnnaMatrixData

      // Validate structure
      if (!json.matrix || !Array.isArray(json.matrix) || json.matrix.length !== 128) {
        throw {
          type: 'VALIDATION_ERROR' as MatrixErrorType,
          message: 'Invalid matrix structure',
          details: 'Expected 128x128 matrix',
          retryable: false,
        }
      }

      setData(json)
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
        setError(err as MatrixError)
        return
      }

      setError({
        type: 'UNKNOWN_ERROR',
        message: 'Failed to load matrix data',
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
    if (!data?.matrix) return null

    return data.matrix.map((row) =>
      row.map((cell) => {
        if (typeof cell === 'number') return cell
        // Convert string values like "00000000" to 0
        const parsed = parseInt(cell, 10)
        return isNaN(parsed) ? 0 : parsed
      })
    )
  }, [data])

  // Calculate statistics
  const stats = useMemo((): MatrixStats | null => {
    if (!matrix) return null

    const values: number[] = []
    let positiveCount = 0
    let negativeCount = 0
    let zeroCount = 0

    for (const row of matrix) {
      for (const val of row) {
        values.push(val)
        if (val > 0) positiveCount++
        else if (val < 0) negativeCount++
        else zeroCount++
      }
    }

    // Guard against empty array
    if (values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    const min = sorted[0] ?? 0
    const max = sorted[sorted.length - 1] ?? 0
    const sum = values.reduce((a, b) => a + b, 0)
    const mean = sum / values.length
    const median = sorted[Math.floor(sorted.length / 2)] ?? 0

    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2))
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length
    const stdDev = Math.sqrt(avgSquaredDiff)

    return {
      min,
      max,
      mean,
      median,
      stdDev,
      totalCells: values.length,
      positiveCount,
      negativeCount,
      zeroCount,
    }
  }, [matrix])

  // Get normalized value (0-1)
  const getNormalizedValue = useCallback((value: number): number => {
    if (!stats) return 0.5
    // Map from [min, max] to [0, 1]
    return (value - stats.min) / (stats.max - stats.min)
  }, [stats])

  // Get color for a value
  const getCellColor = useCallback((value: number): string => {
    return getHeatmapColor(getNormalizedValue(value))
  }, [getNormalizedValue])

  // Get cell info
  const getCell = useCallback((row: number, col: number): MatrixCell | null => {
    if (!matrix || !stats || row < 0 || row >= 128 || col < 0 || col >= 128) {
      return null
    }

    const rowData = matrix[row]
    if (!rowData) return null

    const value = rowData[col]
    if (value === undefined) return null

    const normalizedValue = getNormalizedValue(value)

    return {
      row,
      col,
      value,
      normalizedValue,
      height: normalizedValue * 2 - 1, // Map to [-1, 1] for terrain height
    }
  }, [matrix, stats, getNormalizedValue])

  return {
    loading,
    error,
    data,
    matrix,
    stats,
    getCell,
    getCellColor,
    getNormalizedValue,
    retry,
    retryCount,
  }
}
