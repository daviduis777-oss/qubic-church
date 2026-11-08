import type { Metadata } from 'next'
import { Nixie3D } from '@/components/church/nixie/Nixie3D'

export const metadata: Metadata = { title: 'Nixie lab', robots: { index: false, follow: false } }

/** Hidden test bench for the 3D nixie tubes. Not linked anywhere. */
export default function NixieLab() {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(900px 600px at 80% 0%, rgba(98,64,255,.22), transparent 70%), #07050c', padding: '90px 40px', display: 'grid', gap: 40, justifyItems: 'start' }}>
      <Nixie3D h={460} text="9" />
      <Nixie3D h={200} text="10" />
      <Nixie3D h={110} text="01:47:23" />
    </div>
  )
}
