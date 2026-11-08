import type { Metadata } from 'next'
import { LIVE_FEED_EPOCH, epochStart } from '@/lib/bpp/network'
import { Preview } from './Preview'

export const metadata: Metadata = { title: 'Nixie lab', robots: { index: false, follow: false } }

/** Hidden preview of the vacuum-tube design: 3D nixie timers on a quiet dark ground. Not linked anywhere. */
export default function NixieLab() {
  const liveAt = epochStart(LIVE_FEED_EPOCH).toISOString()
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'radial-gradient(900px 600px at 85% 0%, rgba(98,64,255,.18), transparent 70%), #07050c' }}>
      <div style={{ position: 'relative', zIndex: 1, padding: '110px 24px 80px', display: 'grid', gap: 64, justifyItems: 'start', maxWidth: 1100, margin: '0 auto' }}>
        <Preview liveAt={liveAt} />
      </div>
    </div>
  )
}
