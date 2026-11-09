import type { Metadata } from 'next'
import { Brain } from '@/components/brain/Brain'

export const metadata: Metadata = { title: 'The brain', robots: { index: false, follow: false } }

/** Hidden preview of the pool's central figure. Not linked anywhere. */
export default function BrainLab() {
  return <Brain />
}
