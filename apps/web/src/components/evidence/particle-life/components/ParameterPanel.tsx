'use client'

import { ChevronDown, ChevronUp, Shuffle } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PARTICLE_COLORS } from '../config'
import type { SimulationConfig, MatrixMode, SamplingStrategy } from '../types'

interface ParameterPanelProps {
  config: SimulationConfig
  mode: MatrixMode
  samplingStrategy: SamplingStrategy
  randomSeed: number
  rules: number[][] | null
  isOpen: boolean
  onToggle: () => void
  onConfigChange: (update: Partial<SimulationConfig>) => void
  onSamplingChange: (strategy: SamplingStrategy) => void
  onNewSeed: () => void
}

export function ParameterPanel({
  config,
  mode,
  samplingStrategy,
  randomSeed,
  rules,
  isOpen,
  onToggle,
  onConfigChange,
  onSamplingChange,
  onNewSeed,
}: ParameterPanelProps) {
  return (
    <div className="border border-white/[0.06] bg-[#050505]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-xs font-mono text-white/55 uppercase tracking-wider">
          Parameters
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-white/45" /> : <ChevronDown className="w-3.5 h-3.5 text-white/45" />}
      </button>

      {isOpen && (
        <div className="p-2 sm:p-3 pt-0 space-y-3">
          {/* Sliders grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SliderParam
              label="Types"
              value={config.numTypes}
              min={2}
              max={12}
              step={1}
              onChange={(v) => onConfigChange({ numTypes: v })}
            />
            <SliderParam
              label="Particles / Type"
              value={config.particlesPerType}
              min={20}
              max={200}
              step={10}
              onChange={(v) => onConfigChange({ particlesPerType: v })}
            />
            <SliderParam
              label="Interaction Radius"
              value={config.radius}
              min={40}
              max={250}
              step={10}
              onChange={(v) => onConfigChange({ radius: v })}
            />
            <SliderParam
              label="Viscosity"
              value={config.viscosity}
              min={0.1}
              max={1.0}
              step={0.1}
              format={(v) => v.toFixed(1)}
              onChange={(v) => onConfigChange({ viscosity: v })}
            />
            <SliderParam
              label="Particle Size"
              value={config.particleSize}
              min={1}
              max={5}
              step={0.5}
              onChange={(v) => onConfigChange({ particleSize: v })}
            />
            <SliderParam
              label="Trail Length"
              value={config.trailLength}
              min={0}
              max={50}
              step={1}
              onChange={(v) => onConfigChange({ trailLength: v })}
            />
          </div>

          {/* Sampling strategy + seed */}
          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-white/45 uppercase">Sampling:</span>
              <select
                value={samplingStrategy}
                onChange={(e) => onSamplingChange(e.target.value as SamplingStrategy)}
                className="bg-[#0a0a0a] border border-white/[0.06] text-white/60 text-xs font-mono px-1.5 py-0.5 focus:outline-none focus:border-[#D4AF37]/30"
              >
                <option value="block-average">Block Average</option>
                <option value="diagonal">Diagonal</option>
                <option value="random">Random</option>
                <option value="energy-level">Energy Level</option>
              </select>
            </div>

            {mode === 'random' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNewSeed}
                className="h-6 px-2 border-white/[0.08] bg-transparent text-xs"
              >
                <Shuffle className="w-3 h-3 mr-1" />
                New Seed ({randomSeed})
              </Button>
            )}
          </div>

          {/* Interaction matrix mini-view */}
          {rules && (
            <div>
              <div className="text-xs font-mono text-white/40 uppercase mb-1.5">
                Interaction Matrix ({config.numTypes}x{config.numTypes})
              </div>
              <div className="flex gap-2 items-start">
                <div
                  className="inline-grid gap-px bg-white/[0.04] p-0.5 border border-white/[0.06]"
                  style={{ gridTemplateColumns: `repeat(${config.numTypes}, 1fr)` }}
                >
                  {rules.map((row, i) =>
                    row.map((val, j) => {
                      const intensity = Math.abs(val)
                      const isAttract = val > 0
                      return (
                        <div
                          key={`${i}-${j}`}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                          style={{
                            backgroundColor: isAttract
                              ? `rgba(212, 175, 55, ${intensity * 0.8})`
                              : `rgba(59, 130, 246, ${intensity * 0.8})`,
                          }}
                          title={`[${i},${j}] = ${val.toFixed(3)} (${isAttract ? 'attract' : 'repel'})`}
                        />
                      )
                    }),
                  )}
                </div>
                <div className="text-[11px] text-white/40 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 bg-[#D4AF37]/60" />
                    <span>Attraction</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 bg-[#3B82F6]/60" />
                    <span>Repulsion</span>
                  </div>
                  <div className="mt-1 text-white/30">
                    {mode === 'anna' ? `Anna Matrix / ${samplingStrategy}` : `Random seed: ${randomSeed}`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SliderParam({ label, value, min, max, step, format, onChange }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format?: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <label className="text-xs font-mono text-white/45 uppercase mb-1 block">
        {label} ({format ? format(value) : value})
      </label>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => { if (v !== undefined) onChange(v) }}
        className="w-full"
      />
    </div>
  )
}
