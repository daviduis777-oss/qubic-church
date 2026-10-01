'use client'

import { useState, useCallback, useRef } from 'react'
import {
  AigarthTrainer,
  TrainerConfig,
  TrainingResult,
  TrainingIteration,
  SampleResult,
  DEFAULT_TRAINER_CONFIG,
} from '@/lib/aigarth/trainer'

export interface UseAigarthTrainerReturn {
  // State
  isTraining: boolean
  isPaused: boolean
  error: string | null

  // Config
  config: TrainerConfig
  setConfig: (config: Partial<TrainerConfig>) => void

  // Training progress
  currentIteration: number
  bestScore: number
  accuracy: number
  iterations: TrainingIteration[]

  // Results
  result: TrainingResult | null

  // Test
  testResult: SampleResult | null

  // Actions
  startTraining: () => void
  pauseTraining: () => void
  resumeTraining: () => void
  stopTraining: () => void
  testNetwork: (A: number, B: number) => void
  reset: () => void
}

export function useAigarthTrainer(): UseAigarthTrainerReturn {
  const [isTraining, setIsTraining] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [config, setConfigState] = useState<TrainerConfig>(DEFAULT_TRAINER_CONFIG)
  const [currentIteration, setCurrentIteration] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [accuracy, setAccuracy] = useState(0)
  const [iterations, setIterations] = useState<TrainingIteration[]>([])
  const [result, setResult] = useState<TrainingResult | null>(null)
  const [testResult, setTestResult] = useState<SampleResult | null>(null)

  const trainerRef = useRef<AigarthTrainer | null>(null)
  const pauseRef = useRef(false)
  const stopRef = useRef(false)

  const setConfig = useCallback((newConfig: Partial<TrainerConfig>) => {
    setConfigState((prev) => ({ ...prev, ...newConfig }))
  }, [])

  const startTraining = useCallback(() => {
    setIsTraining(true)
    setIsPaused(false)
    setError(null)
    setIterations([])
    setResult(null)
    pauseRef.current = false
    stopRef.current = false

    // Create trainer
    const trainer = new AigarthTrainer(config)
    trainerRef.current = trainer

    // Run training in chunks to not block UI
    const runTraining = async () => {
      try {
        // Initialize
        trainer.generateTrainingSet()
        trainer.initializeNetwork()

        const allIterations: TrainingIteration[] = []
        let currentBestScore = trainer.computeScore()
        trainer.saveBest()

        // Initial iteration
        const initialIter: TrainingIteration = {
          iteration: 0,
          score: currentBestScore,
          totalSamples: trainer.getStats().trainingSamples,
          accuracy: (currentBestScore / trainer.getStats().trainingSamples) * 100,
          mutation: null,
          accepted: true,
          bestScore: currentBestScore,
        }
        allIterations.push(initialIter)
        setIterations([...allIterations])
        setCurrentIteration(0)
        setBestScore(currentBestScore)
        setAccuracy(initialIter.accuracy)

        // Training loop
        for (let i = 1; i <= config.maxMutations; i++) {
          // Check for stop
          if (stopRef.current) {
            break
          }

          // Check for pause
          while (pauseRef.current && !stopRef.current) {
            await new Promise((r) => setTimeout(r, 100))
          }

          if (stopRef.current) break

          // Apply mutation
          const mutation = trainer.mutate()

          // Compute new score
          const newScore = trainer.computeScore()

          // Accept or reject
          const accepted = newScore >= currentBestScore

          if (accepted) {
            currentBestScore = newScore
            trainer.saveBest()
          } else {
            trainer.rollback(mutation)
          }

          const iter: TrainingIteration = {
            iteration: i,
            score: newScore,
            totalSamples: trainer.getStats().trainingSamples,
            accuracy: (newScore / trainer.getStats().trainingSamples) * 100,
            mutation,
            accepted,
            bestScore: currentBestScore,
          }

          allIterations.push(iter)

          // Update state periodically
          if (i % 5 === 0 || i === config.maxMutations) {
            setIterations([...allIterations])
            setCurrentIteration(i)
            setBestScore(currentBestScore)
            setAccuracy((currentBestScore / trainer.getStats().trainingSamples) * 100)

            // Yield to UI
            await new Promise((r) => setTimeout(r, 0))
          }

          // Early termination if perfect
          if (currentBestScore === trainer.getStats().trainingSamples) {
            setIterations([...allIterations])
            setCurrentIteration(i)
            setBestScore(currentBestScore)
            setAccuracy(100)
            break
          }
        }

        // Final result
        const finalResult: TrainingResult = {
          config,
          trainingSet: trainer.getStats().trainingSamples > 0
            ? (trainer as unknown as { trainingSamples: TrainingResult['trainingSet'] }).trainingSamples || []
            : [],
          finalScore: currentBestScore,
          finalAccuracy: (currentBestScore / trainer.getStats().trainingSamples) * 100,
          iterations: allIterations,
          synapseWeights: [],
          durationMs: 0,
        }

        setResult(finalResult)
        setIsTraining(false)
      } catch (err) {
        setError(`Training error: ${err}`)
        setIsTraining(false)
      }
    }

    runTraining()
  }, [config])

  const pauseTraining = useCallback(() => {
    pauseRef.current = true
    setIsPaused(true)
  }, [])

  const resumeTraining = useCallback(() => {
    pauseRef.current = false
    setIsPaused(false)
  }, [])

  const stopTraining = useCallback(() => {
    stopRef.current = true
    pauseRef.current = false
    setIsTraining(false)
    setIsPaused(false)
  }, [])

  const testNetwork = useCallback((A: number, B: number) => {
    if (!trainerRef.current) {
      setError('Train the network first')
      return
    }

    try {
      const result = trainerRef.current.test(A, B)
      setTestResult(result)
    } catch (err) {
      setError(`Test error: ${err}`)
    }
  }, [])

  const reset = useCallback(() => {
    stopTraining()
    setCurrentIteration(0)
    setBestScore(0)
    setAccuracy(0)
    setIterations([])
    setResult(null)
    setTestResult(null)
    setError(null)
    trainerRef.current = null
  }, [stopTraining])

  return {
    isTraining,
    isPaused,
    error,
    config,
    setConfig,
    currentIteration,
    bestScore,
    accuracy,
    iterations,
    result,
    testResult,
    startTraining,
    pauseTraining,
    resumeTraining,
    stopTraining,
    testNetwork,
    reset,
  }
}
