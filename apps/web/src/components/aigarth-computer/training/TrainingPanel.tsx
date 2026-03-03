'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Zap,
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Calculator,
  Settings,
  FlaskConical,
} from 'lucide-react'
import { useAigarthTrainer } from '../hooks/useAigarthTrainer'

export function TrainingPanel() {
  const {
    isTraining,
    isPaused,
    error,
    config,
    setConfig,
    currentIteration,
    bestScore,
    accuracy,
    iterations,
    testResult,
    startTraining,
    pauseTraining,
    resumeTraining,
    stopTraining,
    testNetwork,
    reset,
  } = useAigarthTrainer()

  const [testA, setTestA] = useState(2)
  const [testB, setTestB] = useState(3)
  const [showConfig, setShowConfig] = useState(false)

  const totalSamples = Math.pow(2, config.inputBits * 2)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-[#D4AF37]" />
            A+B Training Mode
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Train the neural network to learn addition (A + B = C) like real Qubic miners
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfig(!showConfig)}
          className="border-white/[0.04] hover:bg-[#0a0a0a]"
        >
          <Settings className="w-4 h-4 mr-2" />
          Config
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Configuration Panel */}
      {showConfig && (
        <div className="bg-[#050505] border border-white/[0.04] p-4">
          <h3 className="font-semibold text-white mb-4">Training Configuration</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono block mb-1">Input Bits (per number)</label>
              <input
                type="number"
                value={config.inputBits}
                onChange={(e) => setConfig({ inputBits: parseInt(e.target.value) || 4 })}
                disabled={isTraining}
                className="w-full bg-[#050505] border border-white/[0.04] px-3 py-2 text-white text-sm focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 focus:outline-none transition-all"
                min={2}
                max={6}
              />
              <span className="text-xs text-zinc-500">
                A,B in [{-Math.pow(2, config.inputBits - 1)}, {Math.pow(2, config.inputBits - 1) - 1}]
              </span>
            </div>

            <div>
              <label className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono block mb-1">Output Bits</label>
              <input
                type="number"
                value={config.outputBits}
                onChange={(e) => setConfig({ outputBits: parseInt(e.target.value) || 5 })}
                disabled={isTraining}
                className="w-full bg-[#050505] border border-white/[0.04] px-3 py-2 text-white text-sm focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 focus:outline-none transition-all"
                min={3}
                max={8}
              />
            </div>

            <div>
              <label className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono block mb-1">Max Mutations</label>
              <input
                type="number"
                value={config.maxMutations}
                onChange={(e) => setConfig({ maxMutations: parseInt(e.target.value) || 100 })}
                disabled={isTraining}
                className="w-full bg-[#050505] border border-white/[0.04] px-3 py-2 text-white text-sm focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 focus:outline-none transition-all"
                min={10}
                max={10000}
                step={10}
              />
            </div>

            <div>
              <label className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono block mb-1">Max Ticks</label>
              <input
                type="number"
                value={config.maxTicks}
                onChange={(e) => setConfig({ maxTicks: parseInt(e.target.value) || 20 })}
                disabled={isTraining}
                className="w-full bg-[#050505] border border-white/[0.04] px-3 py-2 text-white text-sm focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 focus:outline-none transition-all"
                min={5}
                max={100}
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-[#0a0a0a] border border-white/[0.04] text-xs text-zinc-400">
            <strong>Training Set Size:</strong> {totalSamples} pairs (all combinations of A and B)
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3">
        {!isTraining ? (
          <Button
            onClick={startTraining}
            className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black font-semibold"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Training
          </Button>
        ) : (
          <>
            <Button
              onClick={isPaused ? resumeTraining : pauseTraining}
              variant="outline"
              className="border-[#D4AF37]/50 text-[#D4AF37]"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
            <Button
              onClick={stopTraining}
              variant="outline"
              className="border-red-500/50 text-red-400"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          </>
        )}

        <Button
          onClick={reset}
          variant="outline"
          className="border-white/[0.04] hover:bg-[#0a0a0a]"
          disabled={isTraining}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#050505] border border-white/[0.04] p-4 hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] transition-all">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">Iteration</span>
          </div>
          <div className="text-2xl font-bold text-[#D4AF37] font-mono">
            {currentIteration}/{config.maxMutations}
          </div>
        </div>

        <div className="bg-[#050505] border border-white/[0.04] p-4 hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] transition-all">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <Target className="w-4 h-4" />
            <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">Best Score</span>
          </div>
          <div className="text-2xl font-bold text-[#D4AF37] font-mono">
            {bestScore}/{totalSamples}
          </div>
        </div>

        <div className="bg-[#050505] border border-white/[0.04] p-4 hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] transition-all">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">Accuracy</span>
          </div>
          <div className="text-2xl font-bold text-[#D4AF37]/80 font-mono">
            {accuracy.toFixed(1)}%
          </div>
        </div>

        <div className="bg-[#050505] border border-white/[0.04] p-4 hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] transition-all">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <Calculator className="w-4 h-4" />
            <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">Samples</span>
          </div>
          <div className="text-2xl font-bold text-[#D4AF37]/70 font-mono">
            {totalSamples}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-6 bg-[#0a0a0a] overflow-hidden border border-white/[0.04]">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]/60 transition-all duration-300"
          style={{ width: `${(currentIteration / config.maxMutations) * 100}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow-lg">
            {((currentIteration / config.maxMutations) * 100).toFixed(1)}% Complete
          </span>
        </div>
      </div>

      {/* Accuracy Progress */}
      <div className="relative h-4 bg-[#0a0a0a] overflow-hidden border border-white/[0.04]">
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-300 ${
            accuracy >= 80 ? 'bg-[#D4AF37]' :
            accuracy >= 50 ? 'bg-[#D4AF37]/60' :
            'bg-red-500'
          }`}
          style={{ width: `${accuracy}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow-lg">
            Accuracy: {accuracy.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Recent Iterations */}
      {iterations.length > 0 && (
        <div className="bg-[#050505] border border-white/[0.04] p-4">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
            Recent Mutations
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {iterations.slice(-10).reverse().map((iter) => (
              <div
                key={iter.iteration}
                className={`flex items-center justify-between p-2 text-sm ${
                  iter.accepted
                    ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30'
                    : 'bg-[#0a0a0a] border border-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono border-white/[0.08]">
                    #{iter.iteration}
                  </Badge>
                  {iter.accepted ? (
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-zinc-500" />
                  )}
                  {iter.mutation && (
                    <span className="text-zinc-400">
                      N{iter.mutation.neuronIdx}:S{iter.mutation.synapseIdx}{' '}
                      {iter.mutation.oldWeight}-&gt;{iter.mutation.newWeight}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-white font-mono">{iter.score}</span>
                  <span className="text-zinc-500 text-xs ml-1">
                    ({iter.accuracy.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Network */}
      {currentIteration > 0 && (
        <div className="bg-[#050505] border border-[#D4AF37]/20 p-4">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#D4AF37]" />
            Test the Network
          </h3>

          <div className="flex gap-4 items-end">
            <div>
              <label className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono block mb-1">A</label>
              <input
                type="number"
                value={testA}
                onChange={(e) => setTestA(parseInt(e.target.value) || 0)}
                className="w-20 bg-[#050505] border border-white/[0.04] px-3 py-2 text-white text-center font-mono focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 focus:outline-none transition-all"
              />
            </div>

            <div className="text-2xl text-zinc-500 pb-2">+</div>

            <div>
              <label className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono block mb-1">B</label>
              <input
                type="number"
                value={testB}
                onChange={(e) => setTestB(parseInt(e.target.value) || 0)}
                className="w-20 bg-[#050505] border border-white/[0.04] px-3 py-2 text-white text-center font-mono focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 focus:outline-none transition-all"
              />
            </div>

            <div className="text-2xl text-zinc-500 pb-2">=</div>

            <div>
              <label className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono block mb-1">Expected</label>
              <div className="w-20 bg-[#0a0a0a] border border-white/[0.04] px-3 py-2 text-[#D4AF37] text-center font-mono font-bold">
                {testA + testB}
              </div>
            </div>

            <Button
              onClick={() => testNetwork(testA, testB)}
              className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black font-semibold"
            >
              <Zap className="w-4 h-4 mr-2" />
              Test
            </Button>
          </div>

          {testResult && (
            <div className={`mt-4 p-4 ${
              testResult.correct
                ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {testResult.correct ? (
                    <CheckCircle2 className="w-6 h-6 text-[#D4AF37]" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                  <span className={`font-bold ${
                    testResult.correct ? 'text-[#D4AF37]' : 'text-red-400'
                  }`}>
                    {testResult.correct ? 'CORRECT!' : 'INCORRECT'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-zinc-400">Network Output:</div>
                  <div className={`text-2xl font-bold font-mono ${
                    testResult.correct ? 'text-[#D4AF37]' : 'text-red-400'
                  }`}>
                    {testResult.predictedC}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-zinc-400">
                Output bits matched: {testResult.outputMatch}/{testResult.predictedTernary.length}
                {' | '}
                Ternary: [{testResult.predictedTernary.join(', ')}]
              </div>
            </div>
          )}
        </div>
      )}

      {/* How It Works */}
      <div className="bg-[#050505] border border-white/[0.04] p-4">
        <h3 className="font-semibold text-white mb-3">How A+B Training Works</h3>
        <div className="text-sm text-zinc-400 space-y-2">
          <p>
            This implements the <strong className="text-white">real Qubic mining algorithm</strong> (from score_addition.h):
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li><strong className="text-[#D4AF37]">Generate Training Set:</strong> All possible (A, B, C=A+B) pairs</li>
            <li><strong className="text-[#D4AF37]/80">Initialize Network:</strong> Random ternary synapse weights (-1, 0, +1)</li>
            <li><strong className="text-[#D4AF37]/70">Mutate:</strong> Randomly change one synapse weight by +/-1</li>
            <li><strong className="text-[#D4AF37]/60">Score:</strong> Count correct predictions across all training pairs</li>
            <li><strong className="text-[#D4AF37]/50">Accept/Reject:</strong> Keep mutation if score improves, else rollback</li>
          </ol>
          <p className="text-xs mt-3 border-t border-white/[0.04] pt-3">
            Based on CFB&apos;s explanation: &quot;The score function measures how well the network computes A+B.
            Faster reduction of the score function towards zero = better mining solution.&quot;
          </p>
        </div>
      </div>
    </div>
  )
}
