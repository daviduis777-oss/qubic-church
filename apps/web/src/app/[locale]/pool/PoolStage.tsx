import type { ReactNode } from 'react'
import { Device } from '@/components/pool/Device'
import p from './pool.module.css'

/** Maria beside her phone, the page's feature. Phone only: the app is built and judged as a mobile app. */
export function PoolStage({ intro, children }: { intro: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby="maria" className={p.top}>
      <div className={p.intro}>{intro}</div>
      <div className={p.deviceWrap} id="maria-phone">
        <Device label="Maria, the mining coach">{children}</Device>
      </div>
    </section>
  )
}
