'use client'

/**
 * /game - Fullscreen Anna Matrix RPG Game
 * Immersive exploration of the 128×128 neural network
 */

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { CosmicBackground } from '@/components/church/backgrounds/CosmicBackground'

// Dynamic import for the game (heavy component)
const AnnaMatrixGame = dynamic(
  () => import('@/components/church/game/AnnaMatrixGame').then(mod => mod.AnnaMatrixGame),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading Anna Matrix...</p>
        </div>
      </div>
    ),
  }
)

export default function GamePage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <CosmicBackground
          intensity="low"
          showStars
        />
      </div>

      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/50 border border-white/10 text-white/70 hover:text-white hover:bg-black/70 hover:border-white/20 transition-all backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </Link>
      </div>

      {/* Game Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
          {/* Game Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Anna Matrix{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Explorer
              </span>
            </h1>
            <p className="text-white/50 text-sm md:text-base">
              Navigate the 128×128 neural network. Discover hidden patterns. Earn rewards.
            </p>
          </div>

          {/* Game */}
          <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-cyan-500/10">
            <AnnaMatrixGame />
          </div>

          {/* Instructions */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'W/↑', action: 'Move Up' },
              { key: 'S/↓', action: 'Move Down' },
              { key: 'A/←', action: 'Move Left' },
              { key: 'D/→', action: 'Move Right' },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
              >
                <kbd className="px-2 py-1 rounded bg-white/10 text-white font-mono text-xs">
                  {item.key}
                </kbd>
                <span className="text-white/50 text-xs">{item.action}</span>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
            <h3 className="text-white font-semibold mb-2">Tips</h3>
            <ul className="text-white/50 text-sm space-y-1">
              <li>• Visit <span className="text-orange-400">Row 21</span> - Bitcoin Input Layer</li>
              <li>• Explore <span className="text-purple-400">Row 68</span> - Primary Cortex Bridge</li>
              <li>• Find <span className="text-green-400">Row 96</span> - Output Layer with 4 decision neurons</li>
              <li>• Discover all 7 hidden patterns to maximize your score</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
