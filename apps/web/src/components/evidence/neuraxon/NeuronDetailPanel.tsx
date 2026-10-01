'use client'

import { Button } from '@/components/ui/button'
import { Copy, Check, ExternalLink, X, ArrowRight, ArrowLeft, Zap, Activity, Box, Cpu, GitBranch, Binary } from 'lucide-react'
import { useState, useMemo } from 'react'
import type { QortexNode, QortexEdge } from './types'

interface NeuronDetailPanelProps {
  node: QortexNode
  connections: { incoming: QortexEdge[]; outgoing: QortexEdge[] }
  getNodeById: (id: number) => QortexNode | undefined
  onClose: () => void
  onNodeClick: (node: QortexNode) => void
  /** Callback to analyze this neuron's seed in Aigarth Processing */
  onAnalyzeInAigarth?: (seed: string, neuronId: number, publicId: string, frame: number) => void
}

// State display helpers
const STATE_CONFIG = {
  '-1': {
    label: 'Negative',
    color: 'bg-[#D4AF37]',
    textColor: 'text-[#D4AF37]',
    bgColor: 'bg-[#D4AF37]/10',
    borderColor: 'border-[#D4AF37]/30',
    glowColor: 'shadow-[#D4AF37]/20',
  },
  '0': {
    label: 'Neutral',
    color: 'bg-gray-500',
    textColor: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    glowColor: 'shadow-gray-500/20',
  },
  '1': {
    label: 'Positive',
    color: 'bg-[#D4AF37]',
    textColor: 'text-[#D4AF37]',
    bgColor: 'bg-[#D4AF37]/10',
    borderColor: 'border-[#D4AF37]/30',
    glowColor: 'shadow-[#D4AF37]/20',
  },
}

const TYPE_CONFIG = {
  input: { label: 'Input Layer', icon: ArrowRight, color: 'text-[#D4AF37]' },
  hidden: { label: 'Hidden Layer', icon: Activity, color: 'text-[#D4AF37]' },
  output: { label: 'Output Layer', icon: ArrowLeft, color: 'text-red-400' },
}

const SYNAPSE_COLORS = {
  fast: { bg: 'bg-[#D4AF37]/20', text: 'text-[#D4AF37]', border: 'border-[#D4AF37]/30' },
  slow: { bg: 'bg-[#D4AF37]/20', text: 'text-[#D4AF37]', border: 'border-[#D4AF37]/30' },
  meta: { bg: 'bg-[#D4AF37]/20', text: 'text-[#D4AF37]', border: 'border-[#D4AF37]/30' },
}

export function NeuronDetailPanel({
  node,
  connections,
  getNodeById,
  onClose,
  onNodeClick,
  onAnalyzeInAigarth,
}: NeuronDetailPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'connections' | 'evolution'>('info')

  // Calculate synapse weight distribution
  const synapseStats = useMemo(() => {
    const allEdges = [...connections.outgoing, ...connections.incoming]
    const total = allEdges.length
    const fast = allEdges.filter(e => e.weight > 0.7).length
    const slow = allEdges.filter(e => e.weight >= 0.4 && e.weight <= 0.7).length
    const meta = allEdges.filter(e => e.weight < 0.4).length
    return { total, fast, slow, meta }
  }, [connections])

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const stateConfig = STATE_CONFIG[String(node.state) as keyof typeof STATE_CONFIG]
  const typeConfig = TYPE_CONFIG[node.type]
  const TypeIcon = typeConfig.icon

  // Sort connections by weight
  const sortedOutgoing = [...connections.outgoing].sort((a, b) => b.weight - a.weight).slice(0, 8)
  const sortedIncoming = [...connections.incoming].sort((a, b) => b.weight - a.weight).slice(0, 8)

  return (
    <div className="absolute inset-x-2 top-12 md:inset-x-auto md:top-4 md:right-4 md:w-[340px] bg-[#050505] backdrop-blur-xl border border-white/[0.04] shadow-2xl overflow-hidden pointer-events-auto z-30 max-h-[80vh] md:max-h-none overflow-y-auto">
      {/* Header with gradient */}
      <div className={`relative p-4 ${stateConfig.bgColor} border-b ${stateConfig.borderColor}`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '16px 16px'
          }} />
        </div>

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* State indicator with glow */}
            <div className={`w-12 h-12 ${stateConfig.color} flex items-center justify-center shadow-lg ${stateConfig.glowColor}`}>
              <span className="text-white font-bold text-lg">
                {node.state > 0 ? '+1' : node.state < 0 ? '-1' : '0'}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-lg">Neuron #{node.id}</h3>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <TypeIcon className={`w-3 h-3 ${typeConfig.color}`} />
                <span className={`text-xs ${typeConfig.color}`}>{typeConfig.label}</span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* State badge */}
        <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 ${stateConfig.bgColor} border ${stateConfig.borderColor}`}>
          <Zap className={`w-3 h-3 ${stateConfig.textColor}`} />
          <span className={`text-xs font-medium ${stateConfig.textColor}`}>
            {stateConfig.label} State
          </span>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-white/[0.04]">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'info'
              ? 'text-white bg-white/5 border-b-2 border-white'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          Identity
        </button>
        <button
          onClick={() => setActiveTab('connections')}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'connections'
              ? 'text-white bg-white/5 border-b-2 border-white'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          Synapses
        </button>
        <button
          onClick={() => setActiveTab('evolution')}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'evolution'
              ? 'text-white bg-white/5 border-b-2 border-[#D4AF37]'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          Ternary
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
        {/* Identity Tab */}
        {activeTab === 'info' && (
          <>
            {/* Seed */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-wider font-medium">
                <span className="w-1.5 h-1.5 bg-[#D4AF37]" />
                Private Seed (55 chars)
              </label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/[0.04] p-2.5 group hover:border-white/[0.04] transition-colors">
                <code className="flex-1 text-xs font-mono text-white/80 truncate">
                  {node.seed}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-white/40 hover:text-white hover:bg-white/10"
                  onClick={() => handleCopy(node.seed, 'seed')}
                >
                  {copiedField === 'seed' ? (
                    <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Real ID */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-wider font-medium">
                <span className="w-1.5 h-1.5 bg-[#D4AF37]" />
                Public Identity (60 chars)
              </label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/[0.04] p-2.5 group hover:border-white/[0.04] transition-colors">
                <code className="flex-1 text-xs font-mono text-white/80 truncate">
                  {node.realId}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-white/40 hover:text-white hover:bg-white/10"
                  onClick={() => handleCopy(node.realId, 'realId')}
                >
                  {copiedField === 'realId' ? (
                    <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
                <a
                  href={`https://explorer.qubic.org/network/address/${node.realId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/40 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Live Balance Lookup */}
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Position */}
              <div className="bg-white/5 border border-white/[0.04] p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Box className="w-3 h-3 text-white/40" />
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">Position</span>
                </div>
                <div className="text-xs font-mono text-white/80">
                  [{node.position.map((v) => v.toFixed(1)).join(', ')}]
                </div>
              </div>

              {/* Frame */}
              <div className="bg-white/5 border border-white/[0.04] p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Activity className="w-3 h-3 text-white/40" />
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">Frame</span>
                </div>
                <div className="text-xs text-white/80">
                  <span className="font-semibold">{node.frame + 1}</span>
                  <span className="text-white/40"> / 47</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {onAnalyzeInAigarth && (
              <button
                onClick={() => onAnalyzeInAigarth(node.seed, node.id, node.realId, node.frame)}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#D4AF37] text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-[#D4AF37]/20"
              >
                <Zap className="w-4 h-4" />
                Analyze Neuron
              </button>
            )}
          </>
        )}

        {/* Synapses Tab */}
        {activeTab === 'connections' && (
          <>
            {/* Connection summary */}
            <div className="flex items-center justify-center gap-6 py-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#D4AF37]">{connections.outgoing.length}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider">Outgoing</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-2xl font-bold text-[#D4AF37]">{connections.incoming.length}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider">Incoming</div>
              </div>
            </div>

            {/* Outgoing connections */}
            {sortedOutgoing.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-[#D4AF37]" />
                  <span className="text-xs font-medium text-white/60">
                    Outgoing Synapses
                  </span>
                </div>
                <div className="space-y-1.5">
                  {sortedOutgoing.map((edge, i) => {
                    const targetNode = getNodeById(edge.target)
                    const synapseColor = SYNAPSE_COLORS[edge.type]
                    return (
                      <button
                        key={i}
                        className="flex items-center gap-2 w-full text-left text-xs bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/[0.04] p-2 transition-all group"
                        onClick={() => targetNode && onNodeClick(targetNode)}
                      >
                        <ArrowRight className="w-3 h-3 text-[#D4AF37]/50 group-hover:text-[#D4AF37]" />
                        <span className="font-mono text-white/70 group-hover:text-white flex-1">
                          #{edge.target}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-medium ${synapseColor.bg} ${synapseColor.text} border ${synapseColor.border}`}
                        >
                          {(edge.weight * 100).toFixed(0)}%
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Incoming connections */}
            {sortedIncoming.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ArrowLeft className="w-3 h-3 text-[#D4AF37]" />
                  <span className="text-xs font-medium text-white/60">
                    Incoming Synapses
                  </span>
                </div>
                <div className="space-y-1.5">
                  {sortedIncoming.map((edge, i) => {
                    const sourceNode = getNodeById(edge.source)
                    const synapseColor = SYNAPSE_COLORS[edge.type]
                    return (
                      <button
                        key={i}
                        className="flex items-center gap-2 w-full text-left text-xs bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/[0.04] p-2 transition-all group"
                        onClick={() => sourceNode && onNodeClick(sourceNode)}
                      >
                        <ArrowLeft className="w-3 h-3 text-[#D4AF37]/50 group-hover:text-[#D4AF37]" />
                        <span className="font-mono text-white/70 group-hover:text-white flex-1">
                          #{edge.source}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-medium ${synapseColor.bg} ${synapseColor.text} border ${synapseColor.border}`}
                        >
                          {(edge.weight * 100).toFixed(0)}%
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Synapse legend */}
            <div className="pt-2 border-t border-white/[0.04]">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Synapse Types</div>
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#D4AF37]" />
                  <span className="text-white/50">Fast &gt;70%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#D4AF37]" />
                  <span className="text-white/50">Slow 40-70%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#D4AF37]" />
                  <span className="text-white/50">Meta &lt;40%</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Ternary Tab */}
        {activeTab === 'evolution' && (
          <>
            {/* Data Notice */}
            <div className="p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30">
              <div className="text-[10px] text-[#D4AF37]/90">
                <strong>Seeds:</strong> Real Qubic seeds from Anna Matrix.
                <span className="text-[#D4AF37]/60"> Network structure is conceptual.</span>
              </div>
            </div>

            {/* Neuron Classification - Simplified */}
            <div className="p-3 bg-white/5 border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Classification</span>
              </div>
              <div className="text-xs text-gray-400">
                {node.type === 'input' ? (
                  <span><strong className="text-gray-300">K Neuron</strong> - Input layer concept</span>
                ) : node.type === 'output' ? (
                  <span><strong className="text-gray-300">L Neuron</strong> - Output layer concept</span>
                ) : (
                  <span><strong className="text-gray-300">Hidden Neuron</strong> - Demo node</span>
                )}
              </div>
            </div>

            {/* Ternary State - Simplified */}
            <div className="p-3 bg-white/5 border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-2">
                <Binary className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Ternary State</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 flex items-center justify-center font-mono font-bold ${
                  node.state === 1 ? 'bg-gray-700 text-[#D4AF37]' :
                  node.state === -1 ? 'bg-gray-700 text-[#D4AF37]' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {node.state > 0 ? '+1' : node.state < 0 ? '-1' : '0'}
                </div>
                <div className="text-xs text-gray-500">
                  {node.state === 1 ? 'Positive state (+1)' :
                   node.state === -1 ? 'Negative state (-1)' :
                   'Neutral state (0)'}
                </div>
              </div>
            </div>

            {/* Tick Formula - With Honesty Notice */}
            <div className="p-3 bg-white/5 border border-white/[0.04]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tick Formula</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37]">Conceptual</span>
              </div>
              <div className="font-mono text-xs text-gray-400 bg-black/30 p-2">
                new_value = clamp(Sigma w[i] x n[i])
              </div>
              <div className="text-[10px] text-gray-600 mt-2">
                Describes Qubic&apos;s ternary computation.
                <span className="text-[#D4AF37]/70"> Not simulated here.</span>
              </div>
            </div>

            {/* Connection Summary - Simplified Grayscale */}
            <div className="p-3 bg-white/5 border border-white/[0.04]">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Connection Summary
              </div>
              {synapseStats.total > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center h-2 overflow-hidden bg-gray-800">
                    <div
                      className="h-full bg-gray-500"
                      style={{ width: `${(synapseStats.fast / synapseStats.total) * 100}%` }}
                    />
                    <div
                      className="h-full bg-gray-600"
                      style={{ width: `${(synapseStats.slow / synapseStats.total) * 100}%` }}
                    />
                    <div
                      className="h-full bg-gray-700"
                      style={{ width: `${(synapseStats.meta / synapseStats.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {synapseStats.total} connections (visualization model)
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-600">No connections</div>
              )}
            </div>

            {/* What This Represents */}
            <div className="p-3 bg-white/5 border border-white/[0.04]">
              <div className="flex items-start gap-2">
                <GitBranch className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-gray-400 mb-1">Data Sources</div>
                  <div className="text-[10px] text-gray-500 leading-relaxed">
                    Seeds derived from Anna Matrix (real Qubic identities).
                    Network topology is a visualization model, not live network state.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.04] bg-white/5">
        <div className="flex items-center justify-between text-[10px] text-white/30">
          <span>Frame {node.frame + 1}</span>
          <span className="font-mono">ID: {node.id}</span>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}
