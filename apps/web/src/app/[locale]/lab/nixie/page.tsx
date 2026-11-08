import type { Metadata } from 'next'
import { TubeGlow } from '@/components/church/backgrounds/TubeGlow'
import { LIVE_FEED_EPOCH, epochStart } from '@/lib/bpp/network'
import { Preview } from './Preview'

export const metadata: Metadata = { title: 'Nixie lab', robots: { index: false, follow: false } }

/** Hidden preview of the vacuum-tube design: 3D nixie timers on the new homepage background. Not linked anywhere. */
export default function NixieLab() {
  const liveAt = epochStart(LIVE_FEED_EPOCH).toISOString()
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <TubeGlow />
      <div style={{ position: 'relative', zIndex: 1, padding: '110px 24px 80px', display: 'grid', gap: 64, justifyItems: 'start', maxWidth: 1100, margin: '0 auto' }}>
        <Preview liveAt={liveAt} />
      </div>
    </div>
  )
}
