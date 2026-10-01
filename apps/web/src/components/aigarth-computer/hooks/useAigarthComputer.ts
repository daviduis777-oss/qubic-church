'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { AigarthEngine } from '@/lib/aigarth/engine'
import type {
  ProcessingResult,
  TernaryState,
  InputType,
  AnimationState,
  MatrixQueryResult,
} from '@/lib/aigarth/types'

export interface UseAigarthComputerReturn {
  // State
  engine: AigarthEngine | null
  isReady: boolean
  isProcessing: boolean
  error: string | null

  // Results
  result: ProcessingResult | null
  matrixQuery: MatrixQueryResult | null
  currentTick: number
  currentStates: TernaryState[]
  currentEnergy: number

  // Animation
  animation: AnimationState

  // Actions
  process: (input: string, inputType?: InputType) => Promise<ProcessingResult | null>
  streamProcess: (input: string, inputType?: InputType) => void
  cancelStream: () => void
  reset: () => void
  queryMatrix: (row: number, col: number) => MatrixQueryResult | null
}

export function useAigarthComputer(): UseAigarthComputerReturn {
  const [engine, setEngine] = useState<AigarthEngine | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [matrixQuery, setMatrixQuery] = useState<MatrixQueryResult | null>(null)
  const [currentTick, setCurrentTick] = useState(0)
  const [currentStates, setCurrentStates] = useState<TernaryState[]>([])
  const [currentEnergy, setCurrentEnergy] = useState(0)

  const [animation, setAnimation] = useState<AnimationState>({
    isProcessing: false,
    currentTick: 0,
    maxTicks: 1000,
    progress: 0,
    phase: 'idle',
  })

  const cancelRef = useRef<(() => void) | null>(null)

  // Initialize engine on mount
  useEffect(() => {
    const initEngine = async () => {
      try {
        const eng = new AigarthEngine({ maxTicks: 500 }) // Reduced for web
        const loaded = await eng.loadMatrix()

        if (loaded) {
          setEngine(eng)
          setIsReady(true)
        } else {
          setError('Failed to load Anna Matrix')
        }
      } catch (err) {
        setError(`Engine initialization failed: ${err}`)
      }
    }

    initEngine()
  }, [])

  // Standard process
  const process = useCallback(
    async (
      input: string,
      inputType?: InputType
    ): Promise<ProcessingResult | null> => {
      if (!engine || !isReady) {
        setError('Engine not ready')
        return null
      }

      setIsProcessing(true)
      setError(null)
      setAnimation((prev) => ({ ...prev, isProcessing: true, phase: 'encoding' }))

      try {
        // Small delay for UI feedback
        await new Promise((r) => setTimeout(r, 100))
        setAnimation((prev) => ({ ...prev, phase: 'processing' }))

        const res = await engine.process(input, inputType)

        // If coords input, also get matrix query result for Anna response
        const detectedType = inputType ?? (input.includes('+') || input.includes(',') ? 'coords' : 'text')
        if (detectedType === 'coords') {
          const query = parseAndQueryCoords(input)
          setMatrixQuery(query)
        } else {
          setMatrixQuery(null)
        }

        setResult(res)
        setCurrentStates(res.stateVector)
        setCurrentEnergy(res.energy)
        setCurrentTick(res.ticks)

        setAnimation((prev) => ({
          ...prev,
          isProcessing: false,
          phase: 'complete',
          currentTick: res.ticks,
          progress: 1,
        }))

        return res
      } catch (err) {
        setError(`Processing failed: ${err}`)
        setAnimation((prev) => ({ ...prev, isProcessing: false, phase: 'idle' }))
        return null
      } finally {
        setIsProcessing(false)
      }
    },
    [engine, isReady]
  )

  // Stream process with tick-by-tick updates
  const streamProcess = useCallback(
    (input: string, inputType?: InputType) => {
      if (!engine || !isReady) {
        setError('Engine not ready')
        return
      }

      // Cancel any existing stream
      if (cancelRef.current) {
        cancelRef.current()
      }

      setIsProcessing(true)
      setError(null)
      setResult(null)
      setCurrentTick(0)
      setCurrentStates([])
      setCurrentEnergy(0)

      setAnimation({
        isProcessing: true,
        currentTick: 0,
        maxTicks: engine.getStats().maxTicks,
        progress: 0,
        phase: 'processing',
      })

      cancelRef.current = engine.streamProcess(
        input,
        inputType,
        // onTick
        (tick, states, energy) => {
          setCurrentTick(tick)
          setCurrentStates(states)
          setCurrentEnergy(energy)
          setAnimation((prev) => ({
            ...prev,
            currentTick: tick,
            progress: tick / prev.maxTicks,
          }))
        },
        // onComplete
        (res) => {
          setResult(res)
          setIsProcessing(false)
          setAnimation((prev) => ({
            ...prev,
            isProcessing: false,
            phase: 'complete',
            progress: 1,
          }))
          cancelRef.current = null
        }
      )
    },
    [engine, isReady]
  )

  // Cancel streaming
  const cancelStream = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current()
      cancelRef.current = null
    }
    setIsProcessing(false)
    setAnimation((prev) => ({ ...prev, isProcessing: false, phase: 'idle' }))
  }, [])

  // Query matrix at specific coordinates
  const queryMatrix = useCallback(
    (row: number, col: number): MatrixQueryResult | null => {
      if (!engine) return null
      return engine.queryMatrix(row, col)
    },
    [engine]
  )

  // Helper to parse coords and query matrix
  const parseAndQueryCoords = useCallback(
    (input: string): MatrixQueryResult | null => {
      if (!engine) return null

      // Parse "X+Y" or "X,Y" format
      const parts = input.replace(',', '+').split('+')
      if (parts.length !== 2) return null

      const xStr = parts[0]?.trim() ?? '0'
      const yStr = parts[1]?.trim() ?? '0'
      const x = parseInt(xStr, 10)
      const y = parseInt(yStr, 10)

      if (isNaN(x) || isNaN(y)) return null

      // Convert Anna coords to matrix coords
      const col = ((x % 128) + 128) % 128
      const row = ((63 - y) % 128 + 128) % 128

      return engine.queryMatrix(row, col)
    },
    [engine]
  )

  // Reset state
  const reset = useCallback(() => {
    cancelStream()
    setResult(null)
    setMatrixQuery(null)
    setCurrentTick(0)
    setCurrentStates([])
    setCurrentEnergy(0)
    setError(null)
    setAnimation({
      isProcessing: false,
      currentTick: 0,
      maxTicks: engine?.getStats().maxTicks ?? 1000,
      progress: 0,
      phase: 'idle',
    })
  }, [cancelStream, engine])

  return {
    engine,
    isReady,
    isProcessing,
    error,
    result,
    matrixQuery,
    currentTick,
    currentStates,
    currentEnergy,
    animation,
    process,
    streamProcess,
    cancelStream,
    reset,
    queryMatrix,
  }
}
