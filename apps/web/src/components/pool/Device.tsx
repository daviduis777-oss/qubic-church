'use client'

import { type ReactNode, useEffect, useState } from 'react'
import d from './device.module.css'

/** Local time as an iPhone shows it: H:MM, no seconds, no AM/PM. Rendered after mount to avoid a hydration mismatch. */
function useClock() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () => {
      const n = new Date()
      setT(`${n.getHours() % 12 || 12}:${String(n.getMinutes()).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 15_000)
    return () => clearInterval(id)
  }, [])
  return t
}

function StatusBar() {
  const time = useClock()
  return (
    <div aria-hidden className={d.status}>
      <span className={d.time}>{time || '9:41'}</span>
      <span className={d.icons}>
        <svg height="12" viewBox="0 0 18 12" width="18">
          <rect fill="currentColor" height="4" rx="1" width="3" x="0" y="8" />
          <rect fill="currentColor" height="6.5" rx="1" width="3" x="5" y="5.5" />
          <rect fill="currentColor" height="9" rx="1" width="3" x="10" y="3" />
          <rect fill="currentColor" height="12" rx="1" width="3" x="15" y="0" />
        </svg>
        <svg height="12" viewBox="0 0 16 12" width="16">
          <path d="M8 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.6 10.6 0 0 0 8 .4C5.2.4 2.5 1.5.5 3.4l1.2 1.3A8.9 8.9 0 0 1 8 2.2Z" fill="currentColor" />
          <path d="M8 5.6c1.5 0 2.9.6 4 1.6l1.2-1.3A7.6 7.6 0 0 0 8 3.8c-2 0-3.8.8-5.2 2.1L4 7.2c1.1-1 2.5-1.6 4-1.6Z" fill="currentColor" />
          <path d="M8 9c.6 0 1.2.2 1.6.6L8 11.4 6.4 9.6C6.8 9.2 7.4 9 8 9Z" fill="currentColor" />
        </svg>
        <svg height="13" viewBox="0 0 28 13" width="28">
          <rect fill="none" height="12" opacity="0.4" rx="3.6" stroke="currentColor" width="24" x="0.5" y="0.5" />
          <rect fill="currentColor" height="9" rx="2.2" width="17" x="2" y="2" />
          <path d="M26 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill="currentColor" opacity="0.45" />
        </svg>
      </span>
    </div>
  )
}

/** An iPhone 16 Pro: titanium band, side buttons, dynamic island, glass. On phones the frame drops away. */
export function Device({ children, label }: { children: ReactNode; label: string }) {
  return (
    <section aria-label={label} className={d.device}>
      <span aria-hidden className={`${d.btn} ${d.action}`} />
      <span aria-hidden className={`${d.btn} ${d.volUp}`} />
      <span aria-hidden className={`${d.btn} ${d.volDown}`} />
      <span aria-hidden className={`${d.btn} ${d.power}`} />
      <span aria-hidden className={`${d.btn} ${d.camera}`} />
      <div className={d.bezel}>
        <div className={d.screen}>
          <StatusBar />
          <div aria-hidden className={d.island} />
          <div className={d.app}>{children}</div>
          <div aria-hidden className={d.glass} />
        </div>
      </div>
    </section>
  )
}
