'use client'

import { useEffect, useState } from 'react'

/** Days, hours and minutes until the town opens. Ticks once a minute. */
export function W4WCountdown({ at }: { at: string }) {
  const target = Date.parse(at)
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  if (now === null) return <div className="w4w-count" aria-hidden />
  const left = Math.max(0, target - now)
  if (left === 0) return <div className="w4w-count"><span className="w4w-live">The town is open</span></div>
  const d = Math.floor(left / 864e5)
  const h = Math.floor((left % 864e5) / 36e5)
  const m = Math.floor((left % 36e5) / 6e4)
  const cell = (n: number, w: string) => (
    <div className="w4w-cell">
      <b>{String(n).padStart(2, '0')}</b>
      <span>{w}</span>
    </div>
  )
  return (
    <div aria-label={`${d} days ${h} hours ${m} minutes until W4W opens`} className="w4w-count" role="timer">
      {cell(d, d === 1 ? 'day' : 'days')}
      {cell(h, h === 1 ? 'hour' : 'hours')}
      {cell(m, m === 1 ? 'minute' : 'minutes')}
    </div>
  )
}
