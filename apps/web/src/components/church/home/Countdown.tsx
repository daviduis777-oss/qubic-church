'use client'

import { useEffect, useState } from 'react'

const TARGET = Date.UTC(2027, 3, 13, 0, 0, 0)

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Runs every second until 13 April 2027 00:00 UTC.
 * Server HTML carries the date in words, so readers without JS
 * (and crawlers) still get the meaning.
 */
export function Countdown({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const p = now === null ? null : parts(TARGET - now)
  const cells: [string, string][] = p
    ? [
        [String(p.days), 'days'],
        [pad(p.hours), 'hours'],
        [pad(p.minutes), 'min'],
        [pad(p.seconds), 'sec'],
      ]
    : [
        ['—', 'days'],
        ['——', 'hours'],
        ['——', 'min'],
        ['——', 'sec'],
      ]

  return (
    <div aria-label="Time left until 13 April 2027, 00:00 UTC" role="timer">
      <time className="sr-only" dateTime="2027-04-13T00:00:00Z">
        13 April 2027
      </time>
      <div className={`flex items-end ${compact ? 'gap-3' : 'gap-4 md:gap-6'}`}>
        {cells.map(([v, l], i) => (
          <div className="flex items-end" key={l}>
            <div className="flex flex-col items-center">
              <span
                className={`font-mono tabular-nums leading-none text-foreground ${
                  compact ? 'text-3xl' : 'text-4xl sm:text-5xl md:text-6xl'
                }`}
              >
                {v}
              </span>
              <span className="mt-2 text-[10px] uppercase tracking-[0.3em] text-fg-2">
                {l}
              </span>
            </div>
            {i < 3 && (
              <span
                aria-hidden="true"
                className={`ml-3 font-mono text-gold/70 md:ml-5 ${
                  compact ? 'mb-5 text-2xl' : 'mb-6 text-3xl md:text-5xl'
                }`}
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
