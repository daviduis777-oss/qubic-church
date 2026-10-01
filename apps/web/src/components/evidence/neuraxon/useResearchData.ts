'use client'

import { useState, useEffect, useRef } from 'react'
import type { SpectralData, AnomalyData, ResearchDataReturn } from './types'

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

async function fetchJSON<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export function useResearchData(): ResearchDataReturn {
  const [matrix, setMatrix] = useState<FetchState<number[][]>>({ data: null, loading: true, error: null })
  const [spectral, setSpectral] = useState<FetchState<SpectralData>>({ data: null, loading: true, error: null })
  const [anomalies, setAnomalies] = useState<FetchState<AnomalyData>>({ data: null, loading: true, error: null })
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller

    // Fetch matrix
    fetchJSON<{ matrix: number[][] }>('/data/anna-matrix-min.json', signal)
      .then((d) => setMatrix({ data: d.matrix, loading: false, error: null }))
      .catch((e) => { if (!signal.aborted) setMatrix({ data: null, loading: false, error: e.message }) })

    // Fetch spectral
    fetchJSON<SpectralData>('/data/anna-spectral-data.json', signal)
      .then((d) => setSpectral({ data: d, loading: false, error: null }))
      .catch((e) => { if (!signal.aborted) setSpectral({ data: null, loading: false, error: e.message }) })

    // Fetch anomalies
    fetchJSON<AnomalyData>('/data/anna-matrix-anomalies.json', signal)
      .then((d) => setAnomalies({ data: d, loading: false, error: null }))
      .catch((e) => { if (!signal.aborted) setAnomalies({ data: null, loading: false, error: e.message }) })

    return () => controller.abort()
  }, [])

  const loadedSources: string[] = []
  const failedSources: string[] = []
  if (matrix.data) loadedSources.push('matrix')
  else if (matrix.error) failedSources.push('matrix')
  if (spectral.data) loadedSources.push('spectral')
  else if (spectral.error) failedSources.push('spectral')
  if (anomalies.data) loadedSources.push('anomalies')
  else if (anomalies.error) failedSources.push('anomalies')

  const loading = matrix.loading || spectral.loading || anomalies.loading
  const ready = matrix.data !== null || spectral.data !== null

  return {
    loading,
    ready,
    loadedSources,
    failedSources,
    matrix: matrix.data,
    spectral: spectral.data,
    anomalies: anomalies.data,
  }
}
