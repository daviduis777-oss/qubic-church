'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const ContactCubeScene = dynamic(
  () => import('../contact-cube/ContactCubeScene').then((mod) => mod.ContactCubeScene),
  {
    ssr: false,
    loading: () => <ContactCubeLoading />,
  }
)

function ContactCubeLoading() {
  return (
    <div className="w-full h-[700px] bg-[#050505] border border-white/[0.04] flex items-center justify-center">
      <div className="flex items-center gap-3 text-white/30">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading 3D scene...</span>
      </div>
    </div>
  )
}

export default function ContactCubeTab() {
  return (
    <div className="w-full space-y-4">
      {/* Minimal Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-lg font-medium text-white/90 tracking-wider">
            Contact Cube
          </h3>
          <p className="text-sm text-white/40">
            Fold the 128x128 matrix into 3D to reveal point symmetry patterns
          </p>
        </div>
        <div className="text-xs text-[#D4AF37]/40 font-mono">
          99.59% symmetric // 68 anomalies
        </div>
      </div>

      {/* Controls - simple inline */}
      <div className="flex items-center gap-6 text-xs text-white/40 border-b border-white/[0.04] pb-3">
        <span>
          <kbd className="px-1.5 py-0.5 bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono mr-1">Click</kbd>
          Fold/Unfold
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono mr-1">Drag</kbd>
          Rotate
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono mr-1">Scroll</kbd>
          Zoom
        </span>
        <span className="ml-auto flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#D4AF37]/60" />
            Center [22,22]
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#D4AF37]/30" />
            Anomalies
          </span>
        </span>
      </div>

      {/* 3D Scene */}
      <Suspense fallback={<ContactCubeLoading />}>
        <ContactCubeScene
          className="border border-white/[0.04]"
          showControls={true}
          showInfoPanel={true}
        />
      </Suspense>

      {/* Minimal formula */}
      <div className="text-center py-4 border-t border-white/[0.04]">
        <code className="text-sm text-[#D4AF37]/60 font-mono">
          M[r][c] + M[127-r][127-c] = 0
        </code>
        <p className="text-xs text-white/30 mt-1">
          Point symmetry formula -- cells sum to zero with their mirror
        </p>
      </div>
    </div>
  )
}
