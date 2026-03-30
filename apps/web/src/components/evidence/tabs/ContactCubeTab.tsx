'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, Box, Scan, Sparkles } from 'lucide-react'

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
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-[#D4AF37]/30" />
          <div className="absolute inset-0 w-12 h-12 border-2 border-[#D4AF37] border-t-transparent animate-spin" />
        </div>
        <span className="text-sm text-white/30">Initializing 3D scene...</span>
      </div>
    </div>
  )
}

export default function ContactCubeTab() {
  return (
    <div className="w-full space-y-4">
      {/* Header with explanation */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="text-lg font-medium text-white/90 tracking-wider">
              Contact Cube
            </h3>
            <p className="text-sm text-white/40 max-w-2xl">
              The 128x128 Anna Matrix folded into a 3D cube, revealing its near-perfect point symmetry.
              Every cell M[r][c] mirrors M[127-r][127-c] with only 68 exceptions out of 16,384.
            </p>
          </div>
          <div className="text-xs text-[#D4AF37]/50 font-mono text-right hidden sm:block">
            99.58% symmetric<br />68 anomalies
          </div>
        </div>

        {/* Key facts strip */}
        <div className="flex flex-wrap gap-2 text-xs sm:text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] border border-white/[0.04]">
            <Box className="w-3 h-3 text-[#D4AF37]/50" />
            <span className="text-white/40">6 faces</span>
            <span className="text-white/20">64x64 cells each</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] border border-white/[0.04]">
            <Scan className="w-3 h-3 text-[#D4AF37]/50" />
            <span className="text-white/40">Position [22,22] = 100</span>
            <span className="text-white/20">only self-mirror</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] border border-white/[0.04]">
            <Sparkles className="w-3 h-3 text-[#D4AF37]/50" />
            <span className="text-white/40">matrix[72][72] = -27</span>
            <span className="text-white/20">Genesis link</span>
          </div>
        </div>

        {/* Controls hint */}
        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-xs text-white/30 border-b border-white/[0.04] pb-3">
          <span>
            <kbd className="px-1.5 py-0.5 bg-white/[0.03] border border-white/[0.06] text-xs font-mono mr-1">Space</kbd>
            Fold / Unfold
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-white/[0.03] border border-white/[0.06] text-xs font-mono mr-1">Drag</kbd>
            Rotate
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-white/[0.03] border border-white/[0.06] text-xs font-mono mr-1">Scroll</kbd>
            Zoom
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-white/[0.03] border border-white/[0.06] text-xs font-mono mr-1">I</kbd>
            Info
          </span>
          <span className="ml-auto hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#D4AF37]/60" />
              Anomalies
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#D4AF37]" />
              [22,22] Primer
            </span>
          </span>
        </div>
      </div>

      {/* 3D Scene */}
      <Suspense fallback={<ContactCubeLoading />}>
        <ContactCubeScene
          className="border border-white/[0.04]"
          showControls={true}
          showInfoPanel={true}
        />
      </Suspense>

      {/* Bottom explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 border border-white/[0.04] bg-white/[0.01]">
          <div className="text-xs text-[#D4AF37]/50 font-mono uppercase tracking-wider mb-1">Point Symmetry</div>
          <code className="text-xs text-white/50 font-mono">M[r][c] + M[127-r][127-c] = -1</code>
          <p className="text-xs text-white/25 mt-1">Two's Complement identity: 99.58% of cell pairs sum to -1 with their mirror. A structural fingerprint that cannot arise by chance.</p>
        </div>
        <div className="p-3 border border-white/[0.04] bg-white/[0.01]">
          <div className="text-xs text-[#D4AF37]/50 font-mono uppercase tracking-wider mb-1">68 Anomalies</div>
          <code className="text-xs text-white/50 font-mono">Cols: 22+105, 30+97, 41+86</code>
          <p className="text-xs text-white/25 mt-1">The symmetry-breaking cells cluster in column pairs that sum to 127 (= 2^7 - 1, a Mersenne prime).</p>
        </div>
        <div className="p-3 border border-white/[0.04] bg-white/[0.01]">
          <div className="text-xs text-[#D4AF37]/50 font-mono uppercase tracking-wider mb-1">Genesis Connection</div>
          <code className="text-xs text-white/50 font-mono">matrix[72][72] = -27</code>
          <p className="text-xs text-white/25 mt-1">The PUSHBYTES_72 opcode from the Genesis public key lands on the diagonal value -27, the BTC address selection constant.</p>
        </div>
      </div>
    </div>
  )
}
