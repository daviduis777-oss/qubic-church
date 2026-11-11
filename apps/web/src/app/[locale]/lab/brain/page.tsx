import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Brain } from '@/components/brain/Brain'
import { poolFontVars } from '@/components/pool/fonts'
import { poolAllowed } from '@/lib/pool/gate'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'The brain', robots: { index: false, follow: false } }

/** Hidden preview of the pool's central figure. Not linked anywhere; closed like /pool until the pool opens. */
export default async function BrainLab() {
  if (!(await poolAllowed())) notFound()
  return (
    <div className={poolFontVars}>
      <Brain />
    </div>
  )
}
