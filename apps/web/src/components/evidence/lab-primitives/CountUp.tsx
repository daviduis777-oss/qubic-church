'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  target: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
  formatNumber?: (n: number) => string
}

/**
 * Counts up from 0 to `target` when scrolled into view. Mirrors SpectralTab's CountUp.
 */
export function CountUp({
  target,
  suffix = '',
  prefix = '',
  duration = 1500,
  className,
  formatNumber,
}: CountUpProps) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          function tick(now: number) {
            const t = Math.min(1, (now - start) / duration)
            const ease = 1 - Math.pow(1 - t, 3)
            setValue(Math.round(target * ease))
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  const formatted = formatNumber ? formatNumber(value) : value.toLocaleString()
  return (
    <div ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </div>
  )
}
