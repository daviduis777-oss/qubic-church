import type { Metadata } from 'next'
import { Brain } from '@/components/brain/Brain'
import { poolFontVars } from '@/components/pool/fonts'

export const metadata: Metadata = { title: 'The brain', robots: { index: false, follow: false } }

/** Hidden preview of the pool's central figure. Not linked anywhere. */
export default function BrainLab() {
  return (
    <div className={poolFontVars}>
      <Brain />
    </div>
  )
}
