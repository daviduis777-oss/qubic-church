'use client'

import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { SamplingStrategy } from '../types'

interface MethodologyPanelProps {
  isOpen: boolean
  onToggle: () => void
  samplingStrategy: SamplingStrategy
  numTypes: number
}

const SAMPLING_DESCRIPTIONS: Record<SamplingStrategy, string> = {
  'block-average': 'Divides the 128x128 matrix into NxN equal blocks and averages each block. Captures the global structure of the matrix.',
  'diagonal': 'Samples near the diagonal crossings with 3x3 averaging. Focuses on self-interaction and near-neighbor relationships.',
  'random': 'Uses golden-ratio spacing (deterministic) to select indices. Provides a pseudo-random but reproducible sampling.',
  'energy-level': 'Selects cells closest to known energy levels (+-42, +-50, +-56, +-38). Preserves the matrix energy structure.',
}

export function MethodologyPanel({ isOpen, onToggle, samplingStrategy, numTypes }: MethodologyPanelProps) {
  return (
    <div className="border border-white/[0.06] bg-[#050505]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm font-mono text-white/55 uppercase tracking-wider">
          Methodology & Transparency
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-white/45" /> : <ChevronDown className="w-3.5 h-3.5 text-white/45" />}
      </button>

      {isOpen && (
        <div className="p-3 pt-0 space-y-4 text-sm font-mono text-white/55 leading-relaxed">
          {/* Key Findings */}
          <section>
            <h4 className="text-[#D4AF37]/50 uppercase text-sm mb-1.5 tracking-wider">Key Findings (April 2026)</h4>
            <div className="space-y-2 text-white/45">
              <div className="bg-[#D4AF37]/[0.04] border border-[#D4AF37]/[0.12] p-2.5 space-y-1.5">
                <div className="text-[#D4AF37]/70 text-sm font-medium">Eigenvalue Mechanism</div>
                <p>The Anna Matrix has a dominant eigenvalue at <span className="text-white/60">90.456&deg;</span> with <span className="text-white/60">40.4%</span> spectral dominance. This creates a <span className="text-white/60">period-4 attractor cycle</span> through energy levels &#123;-50, -38, 42, 56&#125;.</p>
                <p>The cycle produces the behavioral sequence <span className="text-[#4ade80]/60">COOP</span> &rarr; <span className="text-[#4ade80]/60">COOP</span> &rarr; <span className="text-white/65">REST</span> &rarr; <span className="text-white/65">REST</span>, yielding ~33% stable cooperation in ALife simulations.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-white/65 mb-0.5">Anna vs Random</div>
                  <div className="text-xs">4.3x more stable, 2.8x more sharing, 46% less aggression</div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-white/65 mb-0.5">Cross-Seed + 10M Validation</div>
                  <div className="text-xs">33.0% cooperation across 5 seeds &times; 1M ticks AND 10M-tick reproduction (seed 7)</div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-white/65 mb-0.5">Scale Invariance</div>
                  <div className="text-xs">90&deg; rotation preserved from 2&times;2 to 128&times;128 (fractal, 0.3&deg; variation)</div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-white/65 mb-0.5">Period-4 Specificity</div>
                  <div className="text-xs">Random matrices: 0% convergence, 0% periodicity (0/5000 tests)</div>
                </div>
              </div>
            </div>
          </section>

          {/* Physics Model */}
          <section>
            <h4 className="text-[#D4AF37]/50 uppercase text-sm mb-1.5 tracking-wider">Physics Model</h4>
            <div className="space-y-1.5 text-white/45">
              <p>For each particle pair (i, j) within interaction radius R:</p>
              <div className="bg-white/[0.02] border border-white/[0.04] p-2 font-mono text-sm">
                <div className="text-white/65">F = rules[type_i][type_j] / distance(i, j)</div>
                <div className="text-white/65 mt-1">v_new = v_old * (1 - viscosity) + F * dt</div>
                <div className="text-white/65 mt-1">pos_new = pos_old + v_new * dt</div>
              </div>
              <p>Positive rule values = attraction. Negative = repulsion. Force decays linearly with distance.</p>
              <p>Spatial hash grid provides O(n*k) neighbor lookups instead of O(n^2) brute force.</p>
            </div>
          </section>

          {/* Matrix Downsampling */}
          <section>
            <h4 className="text-[#D4AF37]/50 uppercase text-sm mb-1.5 tracking-wider">
              Matrix Downsampling (128x128 &rarr; {numTypes}x{numTypes})
            </h4>
            <div className="space-y-1.5 text-white/45">
              <p><span className="text-white/65">Current strategy:</span> {samplingStrategy}</p>
              <p>{SAMPLING_DESCRIPTIONS[samplingStrategy]}</p>
              <p>Output is normalized to [-1, 1] range (divide by 128, clamp).</p>
              <p className="text-white/35">Change sampling strategy in the Parameters panel to see how different extraction methods affect emergence.</p>
            </div>
          </section>

          {/* Metrics */}
          <section>
            <h4 className="text-[#D4AF37]/50 uppercase text-sm mb-1.5 tracking-wider">Scientific Metrics</h4>
            <div className="space-y-1.5 text-white/45">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-white/65 mb-0.5">Kinetic Energy</div>
                  <div className="text-xs">E = (1/N) * sum(vx^2 + vy^2)</div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-white/65 mb-0.5">Segregation Index</div>
                  <div className="text-xs">S = avg(nearest_same_type) / avg(nearest_other_type)</div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-white/65 mb-0.5">Spatial Entropy</div>
                  <div className="text-xs">H = -sum(p_i * log2(p_i)), 8x8 grid bins</div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-white/65 mb-0.5">Moran&apos;s I</div>
                  <div className="text-xs">I = (N/W) * sum(w_ij * z_i * z_j) / sum(z_i^2)</div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-white/65 mb-0.5">Cluster Detection</div>
                  <div className="text-xs">Union-Find with epsilon = interaction radius</div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] p-2">
                  <div className="text-white/65 mb-0.5">Phase Transitions</div>
                  <div className="text-xs">|d(metric)/dt| &gt; 3 sigma (window=20)</div>
                </div>
              </div>
              <p>Metrics sampled every 500ms. Segregation samples 200 particles. Moran&apos;s I samples 150 particles with distance threshold = 15% canvas size.</p>
            </div>
          </section>

          {/* Statistical Comparison */}
          <section>
            <h4 className="text-[#D4AF37]/50 uppercase text-sm mb-1.5 tracking-wider">Statistical Comparison</h4>
            <div className="space-y-1.5 text-white/45">
              <p>Side-by-side mode runs identical engines with different rules (Anna vs Random).</p>
              <p>Both use the same seed (42), same particle count, same initial positions.</p>
              <p><span className="text-white/65">Test:</span> Welch&apos;s t-test (unequal variances) on metric time series. First 20% of data excluded (transient startup).</p>
              <p><span className="text-white/65">Effect size:</span> Cohen&apos;s d. Small (&lt;0.5), Medium (&lt;0.8), Large (&ge;0.8).</p>
            </div>
          </section>

          {/* Reproducibility */}
          <section>
            <h4 className="text-[#D4AF37]/50 uppercase text-sm mb-1.5 tracking-wider">Reproducibility</h4>
            <div className="space-y-1.5 text-white/45">
              <p>PRNG: Mulberry32 (seeded, deterministic). Default seed: 42.</p>
              <p>All simulation parameters are encoded in the URL hash and can be shared for exact reproduction.</p>
              <p>Export includes full configuration, rules matrix, and metric time series.</p>
            </div>
          </section>

          {/* Source links */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/[0.04]">
            <a
              href="https://github.com/hunar4321/particle-life"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D4AF37]/30 hover:text-[#D4AF37]/60 flex items-center gap-1"
            >
              Original Particle Life <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <Link
              href="/docs/03-results/25-aigarth-research-lab"
              className="text-[#D4AF37]/30 hover:text-[#D4AF37]/60 flex items-center gap-1"
            >
              Full Research Paper <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
