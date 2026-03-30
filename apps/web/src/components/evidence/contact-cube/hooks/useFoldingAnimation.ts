'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { CubeFaceId, FoldingState, ViewMode, FaceTransform } from '../types'
import {
  ANIMATION_TIMINGS,
  FLAT_POSITIONS,
  FLAT_ROTATIONS,
  CUBE_POSITIONS,
  CUBE_ROTATIONS,
  easeInOutCubic,
  CUBE_SCALE,
} from '../constants'

interface UseFoldingAnimationReturn {
  foldingState: FoldingState
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  startFolding: () => void
  startUnfolding: () => void
  toggleFolding: () => void
  pauseAnimation: () => void
  resumeAnimation: () => void
  resetAnimation: () => void
  getFaceTransform: (faceId: CubeFaceId) => FaceTransform
  isAnimating: boolean
  progress: number
}

// Interpolate between two arrays
function lerpArray(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
}

export function useFoldingAnimation(): UseFoldingAnimationReturn {
  const [foldingState, setFoldingState] = useState<FoldingState>({
    progress: 0,
    phase: 'flat',
    isAnimating: false,
  })

  const [viewMode, setViewModeState] = useState<ViewMode>('flat')

  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const targetProgressRef = useRef<number>(0)
  const pausedRef = useRef<boolean>(false)
  const pausedProgressRef = useRef<number>(0)

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp
    }

    if (pausedRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate)
      return
    }

    const elapsed = timestamp - startTimeRef.current
    const duration = ANIMATION_TIMINGS.foldingDuration
    const rawProgress = Math.min(elapsed / duration, 1)

    // Apply easing
    const easedProgress = easeInOutCubic(rawProgress)

    // Determine direction
    const isFolding = targetProgressRef.current === 1
    const currentProgress = isFolding
      ? easedProgress
      : 1 - easedProgress

    setFoldingState((prev) => ({
      ...prev,
      progress: currentProgress,
      phase: currentProgress === 0 ? 'flat' : currentProgress === 1 ? 'cube' : isFolding ? 'folding' : 'unfolding',
      isAnimating: rawProgress < 1,
    }))

    if (rawProgress < 1) {
      animationFrameRef.current = requestAnimationFrame(animate)
    } else {
      // Animation complete
      setFoldingState((prev) => ({
        ...prev,
        isAnimating: false,
        phase: currentProgress === 1 ? 'cube' : 'flat',
      }))
      startTimeRef.current = null
    }
  }, [])

  // Start folding (flat -> cube)
  const startFolding = useCallback(() => {
    if (foldingState.progress === 1) return // Already folded

    targetProgressRef.current = 1
    startTimeRef.current = null
    pausedRef.current = false

    setFoldingState((prev) => ({
      ...prev,
      isAnimating: true,
      phase: 'folding',
    }))

    setViewModeState('folding')

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [foldingState.progress, animate])

  // Start unfolding (cube -> flat)
  const startUnfolding = useCallback(() => {
    if (foldingState.progress === 0) return // Already flat

    targetProgressRef.current = 0
    startTimeRef.current = null
    pausedRef.current = false

    setFoldingState((prev) => ({
      ...prev,
      isAnimating: true,
      phase: 'unfolding',
    }))

    setViewModeState('folding')

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [foldingState.progress, animate])

  // Toggle between folded and unfolded
  const toggleFolding = useCallback(() => {
    if (foldingState.progress < 0.5) {
      startFolding()
    } else {
      startUnfolding()
    }
  }, [foldingState.progress, startFolding, startUnfolding])

  // Pause animation
  const pauseAnimation = useCallback(() => {
    pausedRef.current = true
    pausedProgressRef.current = foldingState.progress
    setFoldingState((prev) => ({
      ...prev,
      isAnimating: false,
    }))
  }, [foldingState.progress])

  // Resume animation
  const resumeAnimation = useCallback(() => {
    if (!foldingState.isAnimating && pausedRef.current) {
      pausedRef.current = false
      // Adjust start time to account for paused progress
      startTimeRef.current = null
      setFoldingState((prev) => ({
        ...prev,
        isAnimating: true,
      }))
      animationFrameRef.current = requestAnimationFrame(animate)
    }
  }, [foldingState.isAnimating, animate])

  // Reset to flat state
  const resetAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    pausedRef.current = false
    startTimeRef.current = null
    targetProgressRef.current = 0

    setFoldingState({
      progress: 0,
      phase: 'flat',
      isAnimating: false,
    })

    setViewModeState('flat')
  }, [])

  // Set view mode with automatic animation handling
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode)

    if (mode === 'flat' && foldingState.progress > 0) {
      startUnfolding()
    } else if (mode === 'cube' && foldingState.progress < 1) {
      startFolding()
    } else if (mode === 'overlay' || mode === 'mirror') {
      // These modes require the cube to be folded
      if (foldingState.progress < 1) {
        startFolding()
      }
    }
  }, [foldingState.progress, startFolding, startUnfolding])

  // Get interpolated transform for a face
  const getFaceTransform = useCallback((faceId: CubeFaceId): FaceTransform => {
    const progress = foldingState.progress
    const flatPos = FLAT_POSITIONS[faceId]
    const flatRot = FLAT_ROTATIONS[faceId]
    const cubePos = CUBE_POSITIONS[faceId]
    const cubeRot = CUBE_ROTATIONS[faceId]

    // Interpolate position
    const position = lerpArray(flatPos, cubePos, progress)

    // Interpolate rotation (from flat rotation to cube rotation)
    const rotation = lerpArray(flatRot, cubeRot, progress)

    return { position, rotation }
  }, [foldingState.progress])

  return {
    foldingState,
    viewMode,
    setViewMode,
    startFolding,
    startUnfolding,
    toggleFolding,
    pauseAnimation,
    resumeAnimation,
    resetAnimation,
    getFaceTransform,
    isAnimating: foldingState.isAnimating,
    progress: foldingState.progress,
  }
}
