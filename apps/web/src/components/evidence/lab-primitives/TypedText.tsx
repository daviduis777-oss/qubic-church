'use client'

import { useEffect, useState } from 'react'

interface TypedTextProps {
  text: string
  className?: string
  delay?: number
  charDelay?: number
}

/**
 * Animated typing effect with blinking caret. Mirrors SpectralTab's TypedText.
 */
export function TypedText({ text, className, delay = 0, charDelay = 35 }: TypedTextProps) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  useEffect(() => {
    if (!started) return
    let i = 0
    const iv = setInterval(() => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i))
        i++
      } else {
        clearInterval(iv)
      }
    }, charDelay)
    return () => clearInterval(iv)
  }, [text, started, charDelay])

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && started && (
        <span className="inline-block w-[2px] h-[1em] bg-[#D4AF37] ml-0.5 animate-pulse" />
      )}
    </span>
  )
}
