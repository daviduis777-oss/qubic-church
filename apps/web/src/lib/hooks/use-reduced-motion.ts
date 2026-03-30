'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect if user prefers reduced motion
 * Returns true if user has enabled reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches)

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    // Fallback for older browsers
    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  return prefersReducedMotion
}

/**
 * Hook to check WebGL support for canvas-based animations
 */
export function useWebGLSupport(): boolean {
  const [hasWebGL, setHasWebGL] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      setHasWebGL(!!gl)
    } catch {
      setHasWebGL(false)
    }
  }, [])

  return hasWebGL
}

/**
 * Utility to get motion-safe animation props
 * Returns empty/instant animations if user prefers reduced motion
 */
export function useMotionSafeAnimation<T extends object>(
  normalAnimation: T,
  reducedAnimation?: Partial<T>
): T {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion && reducedAnimation) {
    return { ...normalAnimation, ...reducedAnimation } as T
  }

  if (prefersReducedMotion) {
    // Return animation with instant duration
    return {
      ...normalAnimation,
      transition: { duration: 0 },
    } as T
  }

  return normalAnimation
}
