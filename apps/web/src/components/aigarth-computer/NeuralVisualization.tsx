'use client'

import { useMemo } from 'react'
import type { TernaryState } from '@/lib/aigarth/types'

interface NeuralVisualizationProps {
  states: TernaryState[]
  isProcessing: boolean
  tick: number
  energy: number
}

export function NeuralVisualization({
  states,
  isProcessing,
  tick,
  energy,
}: NeuralVisualizationProps) {
  // Create circle visualization data
  const neurons = useMemo(() => {
    if (states.length === 0) {
      // Default empty state
      return Array.from({ length: 128 }, (_, i) => ({
        index: i,
        state: 0 as TernaryState,
        angle: (i / 128) * Math.PI * 2,
        isInput: i < 64,
      }))
    }

    return states.map((state, i) => ({
      index: i,
      state,
      angle: (i / states.length) * Math.PI * 2,
      isInput: i < 64,
    }))
  }, [states])

  const centerX = 150
  const centerY = 150
  const radius = 120

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#050505] to-black overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-[#D4AF37]/30"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Neural Circle SVG */}
      <svg
        viewBox="0 0 300 300"
        className="w-full h-full"
        style={{ maxHeight: '100%' }}
      >
        {/* Glow effect */}
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(212, 175, 55, 0.2)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Center glow */}
        <circle cx={centerX} cy={centerY} r={radius * 0.8} fill="url(#centerGlow)" />

        {/* Outer ring */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="rgba(212, 175, 55, 0.2)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Inner ring (input/output boundary) */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius * 0.5}
          fill="none"
          stroke="rgba(212, 175, 55, 0.1)"
          strokeWidth="1"
        />

        {/* Connection lines (showing some key connections) */}
        {isProcessing && states.length > 0 && (
          <g className="animate-pulse">
            {neurons.slice(0, 8).map((n, i) => {
              const x = centerX + Math.cos(n.angle) * radius
              const y = centerY + Math.sin(n.angle) * radius
              const targetIdx = (i + 64) % neurons.length
              const target = neurons[targetIdx]
              if (!target) return null
              const tx = centerX + Math.cos(target.angle) * radius
              const ty = centerY + Math.sin(target.angle) * radius

              return (
                <line
                  key={`conn-${i}`}
                  x1={x}
                  y1={y}
                  x2={tx}
                  y2={ty}
                  stroke="rgba(212, 175, 55, 0.1)"
                  strokeWidth="1"
                />
              )
            })}
          </g>
        )}

        {/* Neurons */}
        {neurons.map((neuron) => {
          const x = centerX + Math.cos(neuron.angle) * radius
          const y = centerY + Math.sin(neuron.angle) * radius

          let color = 'rgb(75, 85, 99)' // gray for 0
          if (neuron.state > 0) color = 'rgb(212, 175, 55)' // gold
          if (neuron.state < 0) color = 'rgb(239, 68, 68)' // red

          const size = neuron.isInput ? 3 : 4

          return (
            <g key={neuron.index}>
              {/* Neuron dot */}
              <circle
                cx={x}
                cy={y}
                r={size}
                fill={color}
                filter={neuron.state !== 0 ? 'url(#glow)' : undefined}
                className={isProcessing ? 'animate-pulse' : ''}
              />

              {/* Selection ring for first/last neurons */}
              {(neuron.index === 0 || neuron.index === 63 || neuron.index === 64 || neuron.index === 127) && (
                <circle
                  cx={x}
                  cy={y}
                  r={size + 3}
                  fill="none"
                  stroke={neuron.isInput ? 'rgba(212, 175, 55, 0.5)' : 'rgba(212, 175, 55, 0.3)'}
                  strokeWidth="1"
                />
              )}
            </g>
          )
        })}

        {/* Center info */}
        <g>
          <text
            x={centerX}
            y={centerY - 15}
            textAnchor="middle"
            className="fill-white text-xs font-bold"
          >
            {isProcessing ? `TICK ${tick}` : states.length > 0 ? 'COMPLETE' : 'READY'}
          </text>

          <text
            x={centerX}
            y={centerY + 5}
            textAnchor="middle"
            className={`text-lg font-bold ${
              energy > 0 ? 'fill-[#D4AF37]' : energy < 0 ? 'fill-red-400' : 'fill-zinc-400'
            }`}
          >
            {energy > 0 ? '+' : ''}{energy}
          </text>

          <text
            x={centerX}
            y={centerY + 25}
            textAnchor="middle"
            className="fill-zinc-500 text-xs"
          >
            ENERGY
          </text>
        </g>

        {/* Legend */}
        <g transform="translate(10, 270)">
          <circle cx={5} cy={5} r={4} fill="rgb(212, 175, 55)" />
          <text x={15} y={9} className="fill-zinc-400 text-xs">Input (0-63)</text>

          <circle cx={85} cy={5} r={4} fill="rgba(212, 175, 55, 0.5)" />
          <text x={95} y={9} className="fill-zinc-400 text-xs">Output (64-127)</text>
        </g>
      </svg>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="h-1 bg-[#0a0a0a] overflow-hidden border border-white/[0.04]">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]/50 transition-all duration-100"
              style={{ width: `${(tick / 500) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
