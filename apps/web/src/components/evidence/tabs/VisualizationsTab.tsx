'use client'

import { motion } from 'framer-motion'
import { Maximize2, Zap, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'

// Loading component
function VizLoadingScreen({ name }: { name: string }) {
  return (
    <div className="w-full h-[700px] bg-[#050505] border border-white/[0.04] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-[#D4AF37]/30" />
          <div className="absolute inset-0 w-16 h-16 border-2 border-[#D4AF37] border-t-transparent animate-spin" />
        </div>
        <span className="text-white/40">Loading {name}...</span>
      </div>
    </div>
  )
}

// Dynamic import - only Qortex
const QortexScene = dynamic(
  () => import('@/components/evidence/neuraxon/NeuraxonScene'),
  { loading: () => <VizLoadingScreen name="Qortex" />, ssr: false }
)

export default function VisualizationsTab() {
  const handleFullscreen = () => {
    const element = document.querySelector('[data-viz-container]')
    if (element && !document.fullscreenElement) {
      element.requestFullscreen()
    } else if (document.fullscreenElement) {
      document.exitFullscreen()
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-mono text-[#D4AF37]/70 tracking-wider uppercase">Qortex Neural Network</h3>
          <span className="text-xs text-white/30 font-mono">Ternary neural network with real Qubic seeds</span>
        </div>

        <Button variant="outline" size="sm" onClick={handleFullscreen}>
          <Maximize2 className="w-4 h-4 mr-2" />
          Fullscreen
        </Button>
      </div>

      {/* Visualization Container */}
      <div data-viz-container className="overflow-hidden border border-white/[0.04]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <QortexScene />
        </motion.div>
      </div>

      {/* Minimal footer */}
      <div className="flex items-center justify-center gap-6 text-xs text-white/30">
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3" /> WebGL
        </span>
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3" /> Drag to rotate • Scroll to zoom
        </span>
      </div>
    </div>
  )
}
