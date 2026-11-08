import type { Metadata } from 'next'
import BppPage from '../../bpp9000/page'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'BPP lab', robots: { index: false, follow: false } }

/** Hidden preview: the live BPP-9000 page with the blue glass backdrop switched on. Not linked anywhere. */
export default function BppLab(props: { params: Promise<{ locale: string }> }) {
  return (
    <div className="bpp-glass">
      <BppPage {...props} />
    </div>
  )
}
