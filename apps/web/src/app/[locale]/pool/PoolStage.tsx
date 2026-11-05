'use client'

import { Maximize2, Smartphone } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { Device } from '@/components/pool/Device'
import { WIDE_MIN_PX } from '@/lib/pool/ui-config'
import p from './pool.module.css'

const KEY = 'qc-pool:wide'

/**
 * Maria beside her phone, the page's feature. From WIDE_MIN_PX a toggle opens the wide view, the same app as
 * a page-wide panel for long plans and logs. The phone stays the default; the choice is remembered in this
 * browser only. The app's tree never changes between the two, so nothing in it is lost.
 */
export function PoolStage({ intro, children }: { intro: ReactNode; children: ReactNode }) {
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
    <section aria-labelledby="maria" className={`${p.top} ${wide ? p.topWide : ''}`}>
      <div className={p.intro}>
        {intro}
        {can && (
          <button aria-pressed={wide} className={p.wideToggle} onClick={toggle} type="button">
            {wide ? <Smartphone aria-hidden size={15} strokeWidth={2} /> : <Maximize2 aria-hidden size={15} strokeWidth={2} />}
            {wide ? 'Phone view' : 'Wide view for long plans'}
          </button>
        )}
      </div>
      <div className={p.deviceWrap} id="maria-phone">
        <Device label="Maria, the mining coach" wide={wide}>
          {children}
        </Device>
      </div>
    </section>
  )
}
