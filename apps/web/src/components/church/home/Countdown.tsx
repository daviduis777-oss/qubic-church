'use client'

import { useEffect, useState } from 'react'
import { nx } from '@/components/bpp/fonts'

const NX = nx.style.fontFamily

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
  const days = p ? String(p.days) : '···'
  const hms = p ? `${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}` : '--:--:--'

  // the BPP-9000 countdown, letter for letter: a big lit number in Big Shoulders with "days", the time below
  return (
    <div aria-label="Time left until 13 April 2027, 00:00 UTC" className={nx.variable} role="timer">
      <time className="sr-only" dateTime="2027-04-13T00:00:00Z">
        13 April 2027
      </time>
      <div className="qc-lit" style={{ fontFamily: NX, fontWeight: 300, fontSize: compact ? 'clamp(64px, 12vw, 110px)' : 'clamp(96px, 11vw, 160px)', lineHeight: 0.85, letterSpacing: '.01em' }}>
        {days}
        <span style={{ fontSize: '.36em', marginLeft: '.18em', letterSpacing: '.02em' }}>{p?.days === 1 ? 'day' : 'days'}</span>
      </div>
      <div style={{ fontFamily: NX, fontWeight: 300, fontSize: compact ? 'clamp(30px, 5vw, 44px)' : 'clamp(40px, 4.5vw, 56px)', lineHeight: 1, marginTop: 14, color: '#ecdfcb', fontVariantNumeric: 'tabular-nums' }}>
        {hms}
      </div>
      <style>{`.qc-lit { color: #FFE3B0; font-variant-numeric: tabular-nums; text-shadow: 0 0 4px #ffd08a, 0 0 14px #FFC46B, 0 0 40px rgba(232,145,46,.7), 0 0 90px rgba(232,145,46,.35); }`}</style>
    </div>
  )
}
