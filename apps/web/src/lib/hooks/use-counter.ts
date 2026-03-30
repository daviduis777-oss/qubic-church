'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseCounterOptions {
  start?: number
  end: number
  duration?: number
  delay?: number
  easing?: 'linear' | 'easeOut' | 'easeInOut' | 'easeOutExpo'
  onComplete?: () => void
}

// Easing functions
const easingFunctions = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
}

export function useCounter({
  start = 0,
  end,
  duration = 2000,
  delay = 0,
  easing = 'easeOutExpo',
  onComplete,
}: UseCounterOptions) {
  const [count, setCount] = useState(start)
  const [isAnimating, setIsAnimating] = useState(false)
  const frameRef = useRef<number | undefined>(undefined)
  const startTimeRef = useRef<number | undefined>(undefined)

  const animate = useCallback(() => {
    const easingFn = easingFunctions[easing]
    const difference = end - start

    const step = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easingFn(progress)
      const currentValue = start + difference * easedProgress

      setCount(Math.round(currentValue))

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        setCount(end)
        setIsAnimating(false)
        onComplete?.()
      }
    }

    setIsAnimating(true)
    frameRef.current = requestAnimationFrame(step)
  }, [start, end, duration, easing, onComplete])

  const startAnimation = useCallback(() => {
    // Reset
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }
    startTimeRef.current = undefined
    setCount(start)

    // Start after delay
    if (delay > 0) {
      setTimeout(animate, delay)
    } else {
      animate()
    }
  }, [animate, delay, start])

  const reset = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }
    startTimeRef.current = undefined
    setCount(start)
    setIsAnimating(false)
  }, [start])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  return {
    count,
    isAnimating,
    startAnimation,
    reset,
  }
}

// Hook for auto-starting counter when element is in view
export function useCounterOnView(options: UseCounterOptions) {
  const [hasAnimated, setHasAnimated] = useState(false)
  const counter = useCounter({
    ...options,
    onComplete: () => {
      setHasAnimated(true)
      options.onComplete?.()
    },
  })

  const triggerAnimation = useCallback(() => {
    if (!hasAnimated) {
      counter.startAnimation()
    }
  }, [hasAnimated, counter.startAnimation]) // Only depend on startAnimation, not entire counter

  return {
    ...counter,
    hasAnimated,
    triggerAnimation,
  }
}
