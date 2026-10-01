'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Box, Scan } from 'lucide-react'

const ContactCubeScene = dynamic(
  () =>
    import('../contact-cube/ContactCubeScene').then(
      mod => mod.ContactCubeScene
    ),
  {
    ssr: false,
    loading: () => <ContactCubeLoading />,
  }
)

function ContactCubeLoading() {
  return (
    <div className="w-full h-[700px] bg-card border border-border flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-gold/30" />
          <div className="absolute inset-0 w-12 h-12 border-2 border-gold border-t-transparent animate-spin" />
        </div>
        <span className="text-sm text-muted-foreground">
          Initializing 3D scene...
        </span>
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
            <p className="text-sm text-muted-foreground max-w-2xl">
              The 128x128 Anna Matrix folded into a 3D cube, revealing its
              near-perfect point symmetry. Every cell M[r][c] mirrors
              M[127-r][127-c] with only 68 exceptions out of 16,384.
            </p>
          </div>
          <div className="text-xs text-gold/80 font-mono text-right hidden sm:block">
            99.58% symmetric
            <br />
            68 anomalies
          </div>
        </div>

        {/* Key facts strip */}
        <div className="flex flex-wrap gap-2 text-xs sm:text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] border border-border">
            <Box className="w-3 h-3 text-gold/80" />
            <span className="text-muted-foreground">6 faces</span>
            <span className="text-muted-foreground">64x64 cells each</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] border border-border">
            <Scan className="w-3 h-3 text-gold/80" />
            <span className="text-muted-foreground">
              Position [22,22] = 100
            </span>
            <span className="text-muted-foreground">likely entry error</span>
          </div>
        </div>

        {/* Controls hint */}
        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-xs text-muted-foreground border-b border-border pb-3">
          <span>
            <kbd className="px-1.5 py-0.5 bg-white/[0.03] border border-border text-xs font-mono mr-1">
              Space
            </kbd>
            Fold / Unfold
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-white/[0.03] border border-border text-xs font-mono mr-1">
              Drag
            </kbd>
            Rotate
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-white/[0.03] border border-border text-xs font-mono mr-1">
              Scroll
            </kbd>
            Zoom
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-white/[0.03] border border-border text-xs font-mono mr-1">
              I
            </kbd>
            Info
          </span>
          <span className="ml-auto hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-gold/60" />
              Anomalies
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-gold" />
              (22,22) likely entry error
            </span>
          </span>
        </div>
      </div>

      {/* 3D Scene */}
      <Suspense fallback={<ContactCubeLoading />}>
        <ContactCubeScene
          className="border border-border"
          showControls={true}
          showInfoPanel={true}
        />
      </Suspense>

      {/* Bottom explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 border border-border bg-white/[0.01]">
          <div className="text-xs text-gold/80 font-mono uppercase tracking-wider mb-1">
            Point Symmetry
          </div>
          <code className="text-xs text-white/50 font-mono">
            M[r][c] + M[127-r][127-c] = -1
          </code>
          <p className="text-xs text-muted-foreground mt-1">
            Two's complement identity: 99.58% of cells sum to -1 with their
            mirror. The table follows an exact complement rule, apart from a few
            short runs.
          </p>
        </div>
        <div className="p-3 border border-border bg-white/[0.01]">
          <div className="text-xs text-gold/80 font-mono uppercase tracking-wider mb-1">
            68 Anomalies
          </div>
          <code className="text-xs text-white/50 font-mono">
            Cols: 22+105, 30+97, 41+86
          </code>
          <p className="text-xs text-muted-foreground mt-1">
            The exceptions sit in a few short runs. Mirrored columns always sum
            to 127, so that carries no meaning. The run around (22,22) and the
            column 30 run are very likely data-entry errors.
          </p>
        </div>
      </div>
    </div>
  )
}
