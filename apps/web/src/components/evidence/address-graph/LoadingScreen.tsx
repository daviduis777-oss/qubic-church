'use client'

import { Network } from 'lucide-react'
import type { LoadStats } from './types'

interface LoadingScreenProps {
  progress: number
  stats: LoadStats
}

export function LoadingScreen({ progress, stats }: LoadingScreenProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="flex flex-col items-center gap-6 max-w-md px-8">
        {/* Animated network icon */}
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 border-2 border-[#D4AF37]/30 animate-ping" />
          <div
            className="absolute inset-4 border-2 border-[#D4AF37]/30 animate-ping"
            style={{ animationDelay: '200ms' }}
          />
          <div
            className="absolute inset-8 border-2 border-[#D4AF37]/30 animate-ping"
            style={{ animationDelay: '400ms' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] via-[#D4AF37] to-[#D4AF37] flex items-center justify-center animate-pulse">
              <Network className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#D4AF37] via-[#D4AF37] to-[#D4AF37] bg-clip-text text-transparent">
            Address Graph
          </h2>
          <p className="text-sm text-gray-500 mt-1">Loading Bitcoin-Qubic network...</p>
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-2">
          <div className="h-2 bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] via-[#D4AF37] to-[#D4AF37] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Loading nodes & edges</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
        </div>

        {/* Stats preview */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-[#D4AF37]">
              {stats.patoshi > 0 ? stats.patoshi.toLocaleString() : '...'}
            </div>
            <div className="text-[10px] text-gray-600">Patoshi</div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#D4AF37]">
              {stats.cfbLinked > 0 ? stats.cfbLinked.toLocaleString() : '...'}
            </div>
            <div className="text-[10px] text-gray-600">CFB-Linked</div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#D4AF37]">
              {stats.matrixDerived > 0 ? stats.matrixDerived.toLocaleString() : '...'}
            </div>
            <div className="text-[10px] text-gray-600">Matrix</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white/80">
              {stats.totalEdges > 0 ? stats.totalEdges.toLocaleString() : '...'}
            </div>
            <div className="text-[10px] text-gray-600">Edges</div>
          </div>
        </div>

        {/* Loading phases */}
        <div className="w-full space-y-1.5">
          <LoadingPhase
            label="VIP Addresses"
            done={progress >= 10}
            active={progress < 10}
          />
          <LoadingPhase
            label="Patoshi Nodes"
            done={progress >= 25}
            active={progress >= 10 && progress < 25}
          />
          <LoadingPhase
            label="Matrix Derived"
            done={progress >= 45}
            active={progress >= 25 && progress < 45}
          />
          <LoadingPhase
            label="Qubic Seeds"
            done={progress >= 65}
            active={progress >= 45 && progress < 65}
          />
          <LoadingPhase
            label="Computing Graph"
            done={progress >= 95}
            active={progress >= 65 && progress < 95}
          />
          <LoadingPhase
            label="Initializing 3D"
            done={progress >= 100}
            active={progress >= 95 && progress < 100}
          />
        </div>
      </div>
    </div>
  )
}

function LoadingPhase({
  label,
  done,
  active,
}: {
  label: string
  done: boolean
  active: boolean
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`w-2 h-2 transition-colors ${
          done
            ? 'bg-[#D4AF37]'
            : active
            ? 'bg-[#D4AF37] animate-pulse'
            : 'bg-gray-700'
        }`}
      />
      <span className={done ? 'text-[#D4AF37]' : active ? 'text-[#D4AF37]' : 'text-gray-600'}>
        {label}
      </span>
      {done && <span className="text-[#D4AF37] text-[10px]">✓</span>}
    </div>
  )
}
