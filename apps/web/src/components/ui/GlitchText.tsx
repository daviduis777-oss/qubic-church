'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Glitch fragments that appear randomly
const GLITCH_FRAGMENTS = ['1CFB', '15ubic', '1A1z']

interface GlitchTextProps {
  children: string
  /** Min delay between glitches in ms */
  minInterval?: number
  /** Max delay between glitches in ms */
  maxInterval?: number
  /** How long the glitch is visible in ms (min 1 second) */
  glitchDuration?: number
  className?: string
}

export function GlitchText({
  children,
  minInterval = 8000,
  maxInterval = 15000,
  glitchDuration = 2000,
  className,
}: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(children)
  const [isGlitching, setIsGlitching] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update displayText when children changes (fixes typewriter visibility bug)
  useEffect(() => {
    if (!isGlitching) {
      setDisplayText(children)
    }
  }, [children, isGlitching])

  useEffect(() => {
    const scheduleGlitch = () => {
      const delay = minInterval + Math.random() * (maxInterval - minInterval)

      timeoutRef.current = setTimeout(() => {
        // Pick random position and fragment
        const fragment = GLITCH_FRAGMENTS[Math.floor(Math.random() * GLITCH_FRAGMENTS.length)]
        if (!fragment) return scheduleGlitch()

        const text = children
        const maxStart = Math.max(0, text.length - fragment.length)
        const startPos = Math.floor(Math.random() * maxStart)

        // Create glitched text
        const glitchedText =
          text.slice(0, startPos) +
          fragment +
          text.slice(startPos + fragment.length)

        setDisplayText(glitchedText)
        setIsGlitching(true)

        // Restore after glitchDuration
        setTimeout(() => {
          setDisplayText(children)
          setIsGlitching(false)
          scheduleGlitch()
        }, glitchDuration)

      }, delay)
    }

    scheduleGlitch()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [children, minInterval, maxInterval, glitchDuration])

  return (
    <motion.span
      className={cn('inline', className)}
      animate={{
        opacity: isGlitching ? [1, 0.8, 1] : 1,
      }}
      transition={{ duration: 0.1 }}
      style={{
        textShadow: isGlitching
          ? '2px 0 #f97316, -2px 0 #3b82f6'
          : 'none',
      }}
    >
      {displayText}
    </motion.span>
  )
}
