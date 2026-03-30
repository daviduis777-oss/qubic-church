'use client'

import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExternalLink, Code2, Cpu, Zap, GitBranch } from 'lucide-react'

export function QinerReferencePanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-[#D4AF37]" />
            Qiner Reference Implementation
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Original C++ source code from qubic/qiner repository
          </p>
        </div>
        <a
          href="https://github.com/qubic/qiner"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-[#D4AF37] hover:text-[#D4AF37]/80"
        >
          <span>View on GitHub</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Algorithm Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#050505] border border-white/[0.04] p-4 hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-[#D4AF37]" />
            <h4 className="font-semibold text-[#D4AF37]">Hyperidentity</h4>
            <Badge variant="outline" className="text-xs border-white/[0.08]">Pattern Recognition</Badge>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Input Neurons (K)</span>
              <span className="text-white font-mono">256</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Output Neurons (L)</span>
              <span className="text-white font-mono">256</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Max Ticks (N)</span>
              <span className="text-white font-mono">120</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Neighbors (2M)</span>
              <span className="text-white font-mono">256</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Mutations (S)</span>
              <span className="text-white font-mono">100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Solution Threshold</span>
              <span className="text-white font-mono">80%</span>
            </div>
          </div>
        </div>

        <div className="bg-[#050505] border border-white/[0.04] p-4 hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-[#D4AF37]/80" />
            <h4 className="font-semibold text-[#D4AF37]/80">Addition</h4>
            <Badge variant="outline" className="text-xs border-white/[0.08]">Learning A+B=C</Badge>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Input Neurons (K)</span>
              <span className="text-white font-mono">14 (2x7)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Output Neurons (L)</span>
              <span className="text-white font-mono">8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Max Ticks (N)</span>
              <span className="text-white font-mono">120</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Training Set</span>
              <span className="text-white font-mono">16,384 pairs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Mutations (S)</span>
              <span className="text-white font-mono">100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Solution Threshold</span>
              <span className="text-white font-mono">80%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Code Tabs */}
      <Tabs defaultValue="ternary" className="w-full">
        <TabsList className="bg-[#050505] border border-white/[0.04]">
          <TabsTrigger value="ternary">toTenaryBits</TabsTrigger>
          <TabsTrigger value="clamp">clampNeuron</TabsTrigger>
          <TabsTrigger value="tick">processTick</TabsTrigger>
          <TabsTrigger value="mutate">mutate</TabsTrigger>
        </TabsList>

        <TabsContent value="ternary" className="mt-4">
          <div className="bg-[#050505] border border-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm text-zinc-400">score_common.h:97-105</span>
            </div>
            <pre className="text-xs text-zinc-300 overflow-x-auto font-mono leading-relaxed">
{`// Binary to Ternary Conversion
// 0 -> -1 (inhibited), 1 -> +1 (excited)
template <unsigned long long bitCount>
void toTenaryBits(long long A, char* bits)
{
    for (unsigned long long i = 0; i < bitCount; ++i)
    {
        long long bitValue = (A >> i) & 1;
        bits[i] = (bitValue == 0) ? -1 : bitValue;
    }
}`}
            </pre>
            <div className="mt-3 pt-3 border-t border-white/[0.04]">
              <p className="text-xs text-zinc-500">
                <strong className="text-[#D4AF37]">Key Insight:</strong> This is the fundamental transformation
                that converts binary data into ternary neural states. Each bit becomes either -1 (for 0) or +1 (for 1).
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="clamp" className="mt-4">
          <div className="bg-[#050505] border border-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm text-zinc-400">score_common.h:73-87</span>
            </div>
            <pre className="text-xs text-zinc-300 overflow-x-auto font-mono leading-relaxed">
{`// Clamp neuron value to ternary range [-1, 0, +1]
template <typename T>
char clampNeuron(T neuronValue)
{
    if (neuronValue > 1)
    {
        return 1;
    }

    if (neuronValue < -1)
    {
        return -1;
    }
    return static_cast<char>(neuronValue);
}`}
            </pre>
            <div className="mt-3 pt-3 border-t border-white/[0.04]">
              <p className="text-xs text-zinc-500">
                <strong className="text-[#D4AF37]">Purpose:</strong> After computing weighted sums,
                this function clamps the result to the ternary range. This is the &quot;activation function&quot;
                of the ternary neural network.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tick" className="mt-4">
          <div className="bg-[#050505] border border-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm text-zinc-400">score_hyperidentity.h:476-516</span>
            </div>
            <pre className="text-xs text-zinc-300 overflow-x-auto font-mono leading-relaxed">
{`void processTick()
{
    // Reset neuron values
    memset(neuronValueBuffer, 0, sizeof(neuronValueBuffer));

    // Loop through all neurons
    for (long long n = 0; n < population; ++n)
    {
        const Synapse* kSynapses = getSynapses(n);
        long long neuronValue = neurons[n].value;

        // Sum weighted contributions to neighbors
        for (long long m = 0; m < numberOfNeighbors; m++)
        {
            char synapseWeight = kSynapses[m].weight;
            unsigned long long nnIndex = getNeighborIndex(n, m);

            // Weight-sum: neighbor receives this neuron's value x weight
            neuronValueBuffer[nnIndex] += synapseWeight * neuronValue;
        }
    }

    // Clamp all neuron values
    for (long long n = 0; n < population; ++n)
    {
        neurons[n].value = clampNeuron(neuronValueBuffer[n]);
    }
}`}
            </pre>
            <div className="mt-3 pt-3 border-t border-white/[0.04]">
              <p className="text-xs text-zinc-500">
                <strong className="text-[#D4AF37]">Core Algorithm:</strong> Each tick, every neuron
                propagates its value x weight to neighbors. Then all neurons update simultaneously (atomic commit).
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mutate" className="mt-4">
          <div className="bg-[#050505] border border-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm text-zinc-400">score_hyperidentity.h:113-151</span>
            </div>
            <pre className="text-xs text-zinc-300 overflow-x-auto font-mono leading-relaxed">
{`void mutate(unsigned char nonce[32], int mutateStep)
{
    // Randomly pick a synapse
    unsigned long long synapseMutation = initValue.synpaseMutation[mutateStep];
    unsigned long long synapseIdx = (synapseMutation >> 1) % synapseCount;

    // Randomly increase or decrease weight by +/-1
    char weightChange = ((synapseMutation & 1ULL) == 0) ? -1 : 1;

    char newWeight = synapses[synapseIdx].weight + weightChange;

    // Valid weight: -1, 0, or +1
    if (newWeight >= -1 && newWeight <= 1)
    {
        synapses[synapseIdx].weight = newWeight;
    }
    else // Invalid weight: Insert a new neuron!
    {
        insertNeuron(synapseIdx);
    }

    // Clean redundant neurons
    while (scanRedundantNeurons() > 0)
    {
        cleanANN();
    }
}`}
            </pre>
            <div className="mt-3 pt-3 border-t border-white/[0.04]">
              <p className="text-xs text-zinc-500">
                <strong className="text-[#D4AF37]">Evolution:</strong> Genetic algorithm randomly mutates
                synapse weights. If weight exceeds range, a new neuron is inserted. This is how the network
                grows and learns through evolutionary optimization.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Mining Flow */}
      <div className="bg-[#050505] border border-white/[0.04] p-4">
        <h4 className="font-semibold text-white mb-3">Mining Algorithm Flow</h4>
        <div className="flex items-center justify-between text-xs">
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 bg-[#D4AF37]/20 flex items-center justify-center border border-[#D4AF37]/30">
              <span className="text-[#D4AF37] font-bold">1</span>
            </div>
            <span className="text-zinc-400">Init ANN</span>
          </div>
          <div className="flex-1 h-px bg-white/[0.06] mx-2" />
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 bg-[#D4AF37]/15 flex items-center justify-center border border-[#D4AF37]/20">
              <span className="text-[#D4AF37]/80 font-bold">2</span>
            </div>
            <span className="text-zinc-400">Mutate</span>
          </div>
          <div className="flex-1 h-px bg-white/[0.06] mx-2" />
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/15">
              <span className="text-[#D4AF37]/70 font-bold">3</span>
            </div>
            <span className="text-zinc-400">Run Ticks</span>
          </div>
          <div className="flex-1 h-px bg-white/[0.06] mx-2" />
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/15">
              <span className="text-[#D4AF37]/60 font-bold">4</span>
            </div>
            <span className="text-zinc-400">Score</span>
          </div>
          <div className="flex-1 h-px bg-white/[0.06] mx-2" />
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/15">
              <span className="text-[#D4AF37]/50 font-bold">5</span>
            </div>
            <span className="text-zinc-400">Keep/Rollback</span>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mt-4">
          Miners repeatedly mutate the neural network and keep only improvements (greedy optimization).
          This is <strong className="text-white">Proof of Useful Work</strong> -- instead of hashing,
          miners train an AI through genetic algorithms.
        </p>
      </div>

      {/* TypeScript Parity */}
      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-[#D4AF37] animate-pulse" />
          <span className="font-semibold text-[#D4AF37]">TypeScript Implementation Verified</span>
        </div>
        <p className="text-sm text-zinc-300">
          Our TypeScript implementation in <code className="text-[#D4AF37]">tick-loop.ts</code> exactly
          matches the C++ reference. The <code className="text-[#D4AF37]">toTernaryBits</code>,{' '}
          <code className="text-[#D4AF37]">ternaryClamp</code>, and <code className="text-[#D4AF37]">neuronFeedforward</code>{' '}
          functions produce identical outputs for all test cases.
        </p>
      </div>
    </div>
  )
}
