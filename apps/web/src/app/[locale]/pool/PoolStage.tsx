'use client'

import { Maximize2, Smartphone } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { Device } from '@/components/pool/Device'
import { WIDE_MIN_PX } from '@/lib/pool/ui-config'
import p from './pool.module.css'

const KEY = 'qc-pool:wide'

/**
 * The hero: the page's intro beside Maria's phone. From WIDE_MIN_PX a toggle opens the wide view, the same
 * app as a page-wide panel for long plans and logs. The phone stays the default; the choice is remembered
 * in this browser only. The app's tree never changes between the two, so nothing in it is lost.
 */
export function PoolStage({ intro, rest, backdrop, children }: { intro: ReactNode; rest: ReactNode; backdrop?: ReactNode; children: ReactNode }) {
  const [can, setCan] = useState(false)
  const [wide, setWide] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${WIDE_MIN_PX}px)`)
    const apply = () => {
      setCan(mq.matches)
      if (!mq.matches) setWide(false)
    }
    apply()
    try {
      if (mq.matches && localStorage.getItem(KEY) === '1') setWide(true)
    } catch {}
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const toggle = () =>
    setWide(w => {
      try {
        localStorage.setItem(KEY, w ? '0' : '1')
      } catch {}
      return !w
    })

  return (
    <div className={`${p.top} ${wide ? p.topWide : ''}`}>
      <header className={p.intro}>
        {intro}
        {can && (
          <button aria-pressed={wide} className={p.wideToggle} onClick={toggle} type="button">
            {wide ? <Smartphone aria-hidden size={15} strokeWidth={2} /> : <Maximize2 aria-hidden size={15} strokeWidth={2} />}
            {wide ? 'Phone view' : 'Wide view for long plans'}
          </button>
        )}
        {rest}
      </header>
      <div className={p.deviceWrap}>
        {/* always rendered, hidden by CSS in the wide view: a changed child list would remount the app */}
        {backdrop}
        <Device label="Maria, the mining coach" wide={wide}>
          {children}
        </Device>
      </div>
    </div>
  )
}
