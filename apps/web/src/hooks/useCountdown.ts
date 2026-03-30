'use client'

import { useState, useEffect } from 'react'

interface CountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/**
 * Shared countdown hook - returns time remaining until a target timestamp.
 * Used by ConvergenceCountdown, SimpleGiveawaySection, and GalaxyHeroClient.
 */
export function useCountdown(targetTimestamp: number): CountdownResult {
  const [timeLeft, setTimeLeft] = useState<CountdownResult>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculate = (): CountdownResult => {
      const diff = targetTimestamp - Date.now()
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      }
    }

    setTimeLeft(calculate())
    const id = setInterval(() => setTimeLeft(calculate()), 1000)
    return () => clearInterval(id)
  }, [targetTimestamp])

  return timeLeft
}
