'use client'

import { useEffect, useState } from 'react'
import { Nixie3D } from '@/components/church/nixie/Nixie3D'

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
      <div className={`flex flex-wrap items-end ${compact ? 'gap-2' : 'gap-x-2 gap-y-4 md:gap-3'}`}>
        {cells.map(([v, l], i) => (
          <div className="flex items-end" key={l}>
            <div className="flex flex-col items-center">
              <Nixie3D h={compact ? 56 : 84} label={`${v} ${l}`} text={v.replace(/—/g, '0')} />
              <span className="mt-2 text-[10px] uppercase tracking-[0.3em] text-fg-2">
                {l}
              </span>
            </div>
            {i < 3 && <span aria-hidden className={compact ? 'mb-5 w-2' : 'mb-6 w-3 md:w-4'} />}
          </div>
        ))}
      </div>
    </div>
  )
}
