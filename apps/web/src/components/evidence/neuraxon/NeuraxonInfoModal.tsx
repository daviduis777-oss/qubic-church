'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Brain, Zap, Network, Target, AlertCircle, ExternalLink, Cpu, Activity, GitBranch, Binary, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/navigation'

interface QortexInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QortexInfoModal({ isOpen, onClose }: QortexInfoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl max-h-[calc(100vh-32px)] md:max-h-[85vh] bg-background border border-border shadow-2xl z-[101] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-[#D4AF37]/10 via-gray-500/10 to-[#D4AF37]/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#D4AF37] via-gray-500 to-[#D4AF37]">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Understanding Qortex</h2>
                  <p className="text-sm text-muted-foreground">
                    Qubic's Evolutionary Ternary Neural Network
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.2) transparent'
              }}
            >
              {/* What is Qortex? */}
              <Section
                icon={Brain}
                title="What is Qortex?"
                color="from-[#D4AF37] to-[#D4AF37]"
              >
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Qortex visualizes the exact algorithm from Qubic's mining software.
                  Each neuron represents a Qubic seed, and the connections show how the neural network
                  evolves through mutation-based training.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Unlike traditional neural networks that use gradient descent, Qubic's AI learns through
                  <strong className="text-foreground"> evolutionary optimization</strong> - randomly mutating synaptic weights
                  and keeping only mutations that improve the score function.
                </p>
              </Section>

              {/* The Algorithm */}
              <Section
                icon={Cpu}
                title="Evolutionary Training"
                color="from-[#D4AF37] to-[#D4AF37]"
              >
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Qubic mining doesn't solve hash puzzles. Instead, miners train artificial
                  neural networks to perform useful computation through evolutionary optimization.
                </p>

                {/* Algorithm Constants Card */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <ConstantCard label="K (Input Neurons)" value="14" desc="7 bits × 2 operands" />
                  <ConstantCard label="L (Output Neurons)" value="8" desc="8-bit sum result" />
                  <ConstantCard label="N (Max Ticks)" value="120" desc="Simulation steps" />
                  <ConstantCard label="S (Mutations)" value="100" desc="Per training round" />
                  <ConstantCard label="M (Neighbors)" value="364" desc="Per neuron (2M total)" />
                  <ConstantCard label="Threshold" value="80%" desc="Solution accuracy" />
                </div>

                <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                  <div className="flex items-start gap-3">
                    <Cpu className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1 text-[#D4AF37]">Proof of Useful Work</p>
                      <p className="text-sm text-muted-foreground">
                        Qubic miners don't waste energy on meaningless hashes. They train AI to perform
                        useful tasks like addition, pattern recognition, and eventually more complex computations.
                      </p>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Exact Ternary Semantics */}
              <Section
                icon={Binary}
                title="Exact Ternary Semantics"
                color="from-[#D4AF37] to-[#D4AF37]"
              >
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Unlike continuous neural networks, Qubic uses <strong className="text-foreground">discrete ternary values</strong>.
                  Every neuron and synapse weight is exactly -1, 0, or +1.
                </p>

                {/* Code snippet */}
                <div className="bg-gray-900 p-4 font-mono text-xs overflow-x-auto mb-4">
                  <div className="text-gray-500 mb-2">// From qiner: score_common.h</div>
                  <div className="text-gray-500 mb-1">// Binary to ternary conversion:</div>
                  <div className="text-[#D4AF37]">template &lt;unsigned long long bitCount&gt;</div>
                  <div className="text-[#D4AF37]">void <span className="text-[#D4AF37]">toTenaryBits</span>(long long A, char* bits) {'{'}</div>
                  <div className="pl-4 text-gray-300">for (unsigned long long i = 0; i &lt; bitCount; ++i) {'{'}</div>
                  <div className="pl-8 text-gray-300">long long bitValue = (A &gt;&gt; i) & 1;</div>
                  <div className="pl-8 text-[#D4AF37]">bits[i] = (bitValue == 0) ? <span className="text-[#D4AF37]">-1</span> : bitValue;</div>
                  <div className="pl-4 text-gray-300">{'}'}</div>
                  <div className="text-[#D4AF37]">{'}'}</div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <StateCard
                    color="bg-[#D4AF37]"
                    state="+1"
                    label="Excited"
                    description="Binary 1 → Ternary +1"
                  />
                  <StateCard
                    color="bg-gray-500"
                    state="0"
                    label="Neutral"
                    description="Intermediate state"
                  />
                  <StateCard
                    color="bg-[#D4AF37]"
                    state="-1"
                    label="Inhibited"
                    description="Binary 0 → Ternary -1"
                  />
                </div>

                <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-[#D4AF37]">Key Insight:</strong> This is NOT a continuous neural network.
                    There are no gradients, no backpropagation. Only discrete mutations that either help or don't.
                  </p>
                </div>
              </Section>

              {/* Tick Simulation */}
              <Section
                icon={Activity}
                title="Tick Simulation Mechanics"
                color="from-[#D4AF37] to-pink-500"
              >
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Each training cycle runs up to <strong className="text-foreground">120 ticks</strong> of neural simulation.
                  Every tick, signals propagate through the network following this formula:
                </p>

                <div className="bg-gray-900 p-4 mb-4">
                  <div className="text-center font-mono text-lg text-[#D4AF37] mb-2">
                    new_value = clamp(Σ weight[i] × neighbor[i].value)
                  </div>
                  <div className="text-center text-xs text-gray-500">
                    Sum all (weight × neighbor_value), then clamp to {'{-1, 0, +1}'}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <StepCard step={1} title="Reset Buffer" desc="Initialize all neuron buffers to zero" />
                  <StepCard step={2} title="Propagate" desc="Each neuron sends (value × weight) to all neighbors" />
                  <StepCard step={3} title="Accumulate" desc="Each neuron sums all incoming signals" />
                  <StepCard step={4} title="Clamp" desc="Apply clampNeuron(): values → {-1, 0, +1}" />
                  <StepCard step={5} title="Commit" desc="Atomic update: all neurons get new values simultaneously" />
                </div>

                <div className="text-sm text-muted-foreground">
                  <strong>Early Exit:</strong> Simulation stops if all outputs are non-zero, no values change, or N ticks pass.
                </div>
              </Section>

              {/* Evolution Through Mutation */}
              <Section
                icon={GitBranch}
                title="Evolution Through Mutation"
                color="from-[#D4AF37] to-[#D4AF37]"
              >
                <p className="text-muted-foreground leading-relaxed mb-4">
                  This is the heart of Qubic's AI: <strong className="text-foreground">evolutionary learning</strong>.
                  Unlike gradient descent, mutations are random and only kept if they improve the score.
                </p>

                <div className="space-y-3 mb-4">
                  <MutationStep
                    number="1"
                    title="Random Selection"
                    desc="Pick a random synapse from the network"
                    color="text-[#D4AF37]"
                  />
                  <MutationStep
                    number="2"
                    title="Weight Mutation"
                    desc="Change weight by ±1 (randomly increase or decrease)"
                    color="text-[#D4AF37]"
                  />
                  <MutationStep
                    number="3"
                    title="Overflow Check"
                    desc="If |weight| > 1: INSERT new neuron (network grows!)"
                    color="text-[#D4AF37]"
                  />
                  <MutationStep
                    number="4"
                    title="Score Evaluation"
                    desc="R = count of mismatched output bits vs expected"
                    color="text-[#D4AF37]"
                  />
                  <MutationStep
                    number="5"
                    title="Keep or Rollback"
                    desc="Keep mutation ONLY if R decreases (greedy optimization)"
                    color="text-[#D4AF37]"
                  />
                  <MutationStep
                    number="6"
                    title="Pruning"
                    desc="Remove neurons with all-zero synapses (cleanup)"
                    color="text-red-400"
                  />
                </div>

                <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                  <div className="flex items-start gap-3">
                    <GitBranch className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1 text-[#D4AF37]">Survival of the Fittest</p>
                      <p className="text-sm text-muted-foreground">
                        Only beneficial mutations survive. The network literally <em>evolves</em> toward
                        the solution through random exploration and selective pressure.
                      </p>
                    </div>
                  </div>
                </div>
              </Section>

              {/* The Score Function */}
              <Section
                icon={Target}
                title="The Score Function: R"
                color="from-red-500 to-[#D4AF37]"
              >
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The score <strong className="text-foreground">R</strong> measures how many output bits are wrong.
                  Lower R = better solution. A solution is found when accuracy reaches 80%.
                </p>

                <div className="bg-gray-900 p-4 mb-4">
                  <div className="font-mono text-center">
                    <div className="text-lg text-red-400 mb-1">
                      R = Σ (expected_output[i] ≠ computed_output[i])
                    </div>
                    <div className="text-xs text-gray-500">
                      Count of mismatched bits between expected and computed outputs
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-card border border-border text-center">
                    <div className="text-3xl font-bold text-red-400 font-mono">R=0</div>
                    <div className="text-xs text-muted-foreground mt-1">Perfect solution</div>
                  </div>
                  <div className="p-4 bg-card border border-border text-center">
                    <div className="text-3xl font-bold text-[#D4AF37] font-mono">R&lt;20%</div>
                    <div className="text-xs text-muted-foreground mt-1">Solution found (≥80% accuracy)</div>
                  </div>
                  <div className="p-4 bg-card border border-border text-center">
                    <div className="text-3xl font-bold text-gray-400 font-mono">R&gt;50%</div>
                    <div className="text-xs text-muted-foreground mt-1">Keep mutating</div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  For the addition algorithm: MAX_SCORE = 16,384 × 8 = 131,072 bits.
                  Solution threshold = 80% = 104,857 correct bits.
                </p>
              </Section>

              {/* 23,765 Neurons */}
              <Section
                icon={Network}
                title="Why Exactly 23,765 Neurons?"
                color="from-[#D4AF37] to-[#D4AF37]"
              >
                <p className="text-muted-foreground leading-relaxed mb-4">
                  This isn't a random number. <strong className="text-foreground">23,765</strong> is
                  the exact number of private Qubic seeds in the genesis computor file.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <StatsCard
                    label="Qubic Seeds"
                    value="23,765"
                    description="From genesis computor file"
                    color="text-[#D4AF37]"
                  />
                  <StatsCard
                    label="Synapses"
                    value="188,452"
                    description="Verified K12 derivations"
                    color="text-[#D4AF37]"
                  />
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  Each neuron's connections are derived through the <strong>K12 (KangarooTwelve)</strong> hash function -
                  the same cryptographic function used in Qubic's random number generation.
                </p>
              </Section>

              {/* How to Explore */}
              <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  How to Explore Qortex
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>
                      <strong className="text-foreground">Click and drag</strong> to rotate the network
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>
                      <strong className="text-foreground">Scroll</strong> to zoom in/out
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>
                      <strong className="text-foreground">Click on neurons</strong> to see seed details and connections
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>
                      <strong className="text-foreground">Toggle synapses</strong> (press S) to show/hide all connections
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>
                      <strong className="text-foreground">Use arrow keys</strong> or play button to step through frames
                    </span>
                  </li>
                </ul>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-3">
                    Want to dive deeper into the research?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="https://github.com/qubic"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] transition-colors"
                    >
                      <Code className="w-3 h-3" />
                      Qubic GitHub
                    </a>
                    <Link
                      href="/docs/results/aigarth-architecture"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Aigarth Architecture
                    </Link>
                    <Link
                      href="/docs/results/ternary-neural-network"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ternary Network Docs
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/30 flex flex-col gap-2">
              <div className="p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs text-[#D4AF37] dark:text-[#D4AF37]">
                <strong>Data Sources:</strong> Seeds are real Qubic identities derived from the Anna Matrix.
                The network topology shown is a visualization model representing ternary neural network concepts.
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Qortex • Real Seeds • Network Visualization
                </p>
                <Button onClick={onClose}>Got it, let&apos;s explore!</Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Helper Components
function Section({
  icon: IconComponent,
  title,
  color,
  children,
}: {
  icon: React.ElementType
  title: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 bg-gradient-to-br ${color}`}>
          {React.createElement(IconComponent, { className: 'w-5 h-5 text-white' })}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="pl-11">{children}</div>
    </div>
  )
}

function ConstantCard({
  label,
  value,
  desc,
}: {
  label: string
  value: string
  desc: string
}) {
  return (
    <div className="p-3 bg-card border border-border">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl font-bold font-mono text-[#D4AF37]">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{desc}</div>
    </div>
  )
}

function StateCard({
  color,
  state,
  label,
  description,
}: {
  color: string
  state: string
  label: string
  description: string
}) {
  return (
    <div className="p-4 bg-card border border-border">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 ${color} shadow-lg`} />
        <span className="font-mono text-lg font-bold">{state}</span>
      </div>
      <div className="font-medium text-sm mb-1">{label}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  )
}

function StatsCard({
  label,
  value,
  description,
  color,
}: {
  label: string
  value: string
  description: string
  color: string
}) {
  return (
    <div className="p-4 bg-card border border-border">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-3xl font-bold font-mono mb-1 ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  )
}

function StepCard({
  step,
  title,
  desc,
}: {
  step: number
  title: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-card border border-border">
      <div className="w-6 h-6 bg-[#D4AF37]/20 text-[#D4AF37] font-bold flex items-center justify-center text-xs shrink-0">
        {step}
      </div>
      <div className="flex-1">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  )
}

function MutationStep({
  number,
  title,
  desc,
  color,
}: {
  number: string
  title: string
  desc: string
  color: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 bg-card border border-border ${color} font-bold flex items-center justify-center shrink-0 text-sm`}>
        {number}
      </div>
      <div className="flex-1 pt-1">
        <h4 className="font-medium mb-0.5">{title}</h4>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}
