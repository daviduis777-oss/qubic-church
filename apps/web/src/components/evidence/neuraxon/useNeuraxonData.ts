'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { QortexData, QortexNode, QortexEdge, QortexFrame } from './types'

// Error types for better error handling
export type QortexErrorType =
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'TIMEOUT_ERROR'
  | 'DATA_UNAVAILABLE'
  | 'UNKNOWN_ERROR'

export interface QortexError {
  type: QortexErrorType
  message: string
  details?: string
  retryable: boolean
}

interface UseQortexDataReturn {
  loading: boolean
  error: QortexError | null
  /** True when the dataset file is missing (too large for deployment) */
  dataUnavailable: boolean
  data: QortexData | null
  currentFrame: QortexFrame | null
  currentNodes: QortexNode[]
  currentEdges: QortexEdge[]
  frameIndex: number
  setFrameIndex: (index: number) => void
  totalFrames: number
  searchNode: (query: string) => QortexNode | null
  getNodeById: (id: number) => QortexNode | undefined
  getConnectedNodes: (nodeId: number) => { incoming: QortexEdge[]; outgoing: QortexEdge[] }
  retry: () => void
  retryCount: number
}

const FETCH_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3

// Validate the data structure
function validateQortexData(data: unknown): data is QortexData {
  if (!data || typeof data !== 'object') return false

  const d = data as Record<string, unknown>

  // Check required fields
  if (!Array.isArray(d.nodes) || d.nodes.length === 0) return false
  if (!Array.isArray(d.edges)) return false
  if (!Array.isArray(d.frames) || d.frames.length === 0) return false
  if (!d.metadata || typeof d.metadata !== 'object') return false

  // Validate first node structure
  const firstNode = d.nodes[0] as Record<string, unknown>
  if (
    typeof firstNode.id !== 'number' ||
    typeof firstNode.seed !== 'string' ||
    typeof firstNode.realId !== 'string' ||
    !Array.isArray(firstNode.position)
  ) {
    return false
  }

  return true
}

export function useQortexData(): UseQortexDataReturn {
  const [data, setData] = useState<QortexData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<QortexError | null>(null)
  const [frameIndex, setFrameIndex] = useState(0)
  const [retryCount, setRetryCount] = useState(0)

  // Fetch with timeout and optional external signal
  const fetchWithTimeout = useCallback(async (url: string, timeout: number, externalSignal?: AbortSignal): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // If external signal aborts, also abort this request
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

  // Load data with error handling
  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)

    try {
      // Fetch with timeout
      const response = await fetchWithTimeout('/data/neuraxon-network.json', FETCH_TIMEOUT, signal)

      // Check HTTP status
      if (!response.ok) {
        if (response.status === 404) {
          throw {
            type: 'DATA_UNAVAILABLE' as QortexErrorType,
            message: 'Neuraxon Network',
            details: 'Dataset too large for web deployment. Available locally.',
            retryable: false,
          }
        }
        throw {
          type: 'NETWORK_ERROR' as QortexErrorType,
          message: `Server error: ${response.status}`,
          details: response.statusText,
          retryable: response.status >= 500,
        }
      }

      // Parse JSON
      let json: unknown
      try {
        json = await response.json()
      } catch {
        throw {
          type: 'PARSE_ERROR' as QortexErrorType,
          message: 'Failed to parse network data',
          details: 'The data file appears to be corrupted or malformed.',
          retryable: false,
        }
      }

      // Validate data structure
      if (!validateQortexData(json)) {
        throw {
          type: 'VALIDATION_ERROR' as QortexErrorType,
          message: 'Invalid network data structure',
          details: 'The data file does not contain the expected neural network structure.',
          retryable: false,
        }
      }

      setData(json)
      setLoading(false)
      setError(null)

    } catch (err) {
      setLoading(false)

      // Handle abort (timeout)
      if (err instanceof Error && err.name === 'AbortError') {
        setError({
          type: 'TIMEOUT_ERROR',
          message: 'Loading timed out',
          details: 'The network data took too long to load. Please check your connection and try again.',
          retryable: true,
        })
        return
      }

      // Handle known error types
      if (err && typeof err === 'object' && 'type' in err) {
        setError(err as QortexError)
        return
      }

      // Handle network errors (fetch itself failed -- likely data file missing)
      if (err instanceof TypeError) {
        setError({
          type: 'DATA_UNAVAILABLE',
          message: 'Neuraxon Network',
          details: 'Dataset too large for web deployment. Available locally.',
          retryable: false,
        })
        return
      }

      // Unknown error
      setError({
        type: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        details: err instanceof Error ? err.message : 'Unknown error',
        retryable: true,
      })
    }
  }, [fetchWithTimeout])

  // Initial load
  useEffect(() => {
    const controller = new AbortController()
    loadData(controller.signal)
    return () => controller.abort()
  }, [loadData])

  // Retry function
  const retry = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount((c) => c + 1)
      loadData()
    }
  }, [retryCount, loadData])

  // Current frame
  const currentFrame = useMemo(() => {
    if (!data) return null
    return data.frames[frameIndex] || null
  }, [data, frameIndex])

  // Nodes for current frame
  const currentNodes = useMemo(() => {
    if (!data || !currentFrame) return []
    return currentFrame.nodeIds
      .map((id) => data.nodes[id])
      .filter((node): node is QortexNode => node !== undefined)
  }, [data, currentFrame])

  // Edges for current frame (both endpoints must be in frame)
  const currentEdges = useMemo(() => {
    if (!data || !currentFrame) return []
    const nodeIdSet = new Set(currentFrame.nodeIds)
    return data.edges.filter(
      (edge) => nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)
    )
  }, [data, currentFrame])

  // Search for a node by seed or realId
  const searchNode = useCallback((query: string): QortexNode | null => {
    if (!data) return null
    const queryLower = query.toLowerCase().trim()
    if (!queryLower) return null

    // Try exact ID match first
    const numericId = parseInt(queryLower, 10)
    if (!isNaN(numericId) && data.nodes[numericId]) {
      return data.nodes[numericId]
    }

    // Search by seed or realId
    return (
      data.nodes.find(
        (node) =>
          node.seed.toLowerCase().includes(queryLower) ||
          node.realId.toLowerCase().includes(queryLower)
      ) || null
    )
  }, [data])

  // Get node by ID with bounds checking
  const getNodeById = useCallback((id: number): QortexNode | undefined => {
    if (!data || id < 0 || id >= data.nodes.length) return undefined
    return data.nodes[id]
  }, [data])

  // Get connected nodes
  const getConnectedNodes = useCallback((
    nodeId: number
  ): { incoming: QortexEdge[]; outgoing: QortexEdge[] } => {
    if (!data) return { incoming: [], outgoing: [] }

    const incoming = data.edges.filter((e) => e.target === nodeId)
    const outgoing = data.edges.filter((e) => e.source === nodeId)

    return { incoming, outgoing }
  }, [data])

  // Safe setFrameIndex with bounds checking
  const safeSetFrameIndex = useCallback((index: number) => {
    if (!data) return
    const clampedIndex = Math.max(0, Math.min(index, data.frames.length - 1))
    setFrameIndex(clampedIndex)
  }, [data])

  // Determine if data is unavailable (file not deployed)
  const dataUnavailable = error?.type === 'DATA_UNAVAILABLE'

  return {
    loading,
    error,
    dataUnavailable,
    data,
    currentFrame,
    currentNodes,
    currentEdges,
    frameIndex,
    setFrameIndex: safeSetFrameIndex,
    totalFrames: data?.frames.length || 0,
    searchNode,
    getNodeById,
    getConnectedNodes,
    retry,
    retryCount,
  }
}
