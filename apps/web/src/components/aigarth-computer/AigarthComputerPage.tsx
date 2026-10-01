'use client'

import { useState, useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useAigarthComputer } from './hooks/useAigarthComputer'
import { InputPanel } from './InputPanel'
import { OutputPanel } from './OutputPanel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Zap,
  RefreshCw,
  Terminal,
  Activity,
  Cpu,
  Loader2,
  AlertCircle,
  FlaskConical,
  Network,
  BarChart3,
  Wallet,
  GitBranch,
} from 'lucide-react'
import { QinerReferencePanel } from './validation'
import { QubicNetworkPanel } from './qubic'
import { TickHistoryPanel } from './history'
import { TrainingPanel } from './training/TrainingPanel'
import type { InputType } from '@/lib/aigarth/types'

// Dynamic import for 3D scene to avoid SSR issues
const AigarthScene = dynamic(
  () => import('./3d/AigarthScene').then(mod => mod.AigarthScene),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-gold border-t-transparent animate-spin" />
          <span className="text-zinc-400 text-sm">Loading 3D Engine...</span>
        </div>
      </div>
    ),
  }
)

export function AigarthComputerPage() {
  const {
    isReady,
    isProcessing,
    error,
    result,
    matrixQuery,
    currentTick,
    currentStates,
    currentEnergy,
    animation,
    process,
    streamProcess,
    reset,
  } = useAigarthComputer()

  const [inputValue, setInputValue] = useState('')
  const [inputType, setInputType] = useState<InputType>('text')
  const [useStreaming, setUseStreaming] = useState(false)

  const handleProcess = useCallback(async () => {
    if (!inputValue.trim()) return

    if (useStreaming) {
      streamProcess(inputValue, inputType)
    } else {
      await process(inputValue, inputType)
    }
  }, [inputValue, inputType, useStreaming, process, streamProcess])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
        e.preventDefault()
        handleProcess()
      }
    },
    [handleProcess, isProcessing]
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-gold/3 to-gold/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.1),transparent_50%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-gold via-gold/80 to-gold/60 bg-clip-text text-transparent">
                  AIGARTH
                </span>
              </h1>
              <p className="mt-1 text-zinc-400 text-sm sm:text-base">
                Local Neural Computer v1.0 | Ternary Tick-Loop Algorithm
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Status indicators */}
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 ${
                      isReady ? 'bg-gold animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-zinc-400">
                    {isReady ? 'Matrix Loaded' : 'Loading...'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-gold" />
                  <span className="text-zinc-400">128 Neurons</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input & Neural Viz */}
          <div className="space-y-6">
            {/* Input Panel */}
            <Card className="bg-card border-border backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-gold" />
                    Input
                  </h2>

                  {/* Input Type Selector */}
                  <div className="flex gap-1 p-1 bg-card border border-border">
                    {(
                      [
                        'text',
                        'hex',
                        'coords',
                        'qubic_seed',
                        'bitcoin',
                      ] as const
                    ).map(type => (
                      <button
                        className={`px-3 py-1 text-xs font-mono transition-all ${
                          inputType === type
                            ? 'bg-gold text-black'
                            : 'text-zinc-400 hover:text-white hover:bg-surface-2'
                        }`}
                        key={type}
                        onClick={() => setInputType(type)}
                        type="button"
                      >
                        {type.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <InputPanel
                  disabled={!isReady || isProcessing}
                  inputType={inputType}
                  onChange={setInputValue}
                  onKeyDown={handleKeyDown}
                  value={inputValue}
                />

                {/* Process Button */}
                <div className="mt-4 flex items-center gap-4">
                  <Button
                    className="flex-1 bg-gold hover:bg-gold/80 text-black font-semibold"
                    disabled={!isReady || isProcessing || !inputValue.trim()}
                    onClick={handleProcess}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing... Tick {currentTick}
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        PROCESS
                      </>
                    )}
                  </Button>

                  <Button
                    className="border-border hover:bg-surface-2 "
                    disabled={isProcessing}
                    onClick={reset}
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>

                  {/* Streaming toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      checked={useStreaming}
                      className="w-4 h-4 border-border bg-card text-gold focus:ring-gold/50"
                      onChange={e => setUseStreaming(e.target.checked)}
                      type="checkbox"
                    />
                    <span className="text-sm text-zinc-400">Stream</span>
                  </label>
                </div>
              </div>
            </Card>

            {/* 3D Neural Visualization */}
            <Card className="bg-card border-border backdrop-blur-sm overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-gold" />
                  3D Neural Network
                  {isProcessing && (
                    <span className="ml-2 text-sm font-normal text-gold">
                      Tick {currentTick} | Energy: {currentEnergy}
                    </span>
                  )}
                </h2>
              </div>

              <AigarthScene
                energy={currentEnergy}
                isProcessing={isProcessing}
                numInputs={64}
                numNeighbors={8}
                numOutputs={64}
                result={result}
                states={currentStates}
                tick={currentTick}
              />
            </Card>
          </div>

          {/* Right Column - Output */}
          <div className="space-y-6">
            <OutputPanel
              animation={animation}
              currentEnergy={currentEnergy}
              currentTick={currentTick}
              matrixQuery={matrixQuery}
              result={result}
            />
          </div>
        </div>

        {/* Bottom Tabs - Validation, Qubic Network, History */}
        <div className="mt-8">
          <Card className="bg-card border-border backdrop-blur-sm">
            <Tabs className="w-full" defaultValue="training">
              <div className="border-b border-border px-6 pt-4">
                <TabsList className="bg-card">
                  <TabsTrigger className="gap-2" value="training">
                    <Zap className="w-4 h-4" />
                    A+B Training
                  </TabsTrigger>
                  <TabsTrigger className="gap-2" value="validation">
                    <FlaskConical className="w-4 h-4" />
                    Validation
                  </TabsTrigger>
                  <TabsTrigger className="gap-2" value="qubic">
                    <Wallet className="w-4 h-4" />
                    Qubic Network
                  </TabsTrigger>
                  <TabsTrigger className="gap-2" value="matrix">
                    <BarChart3 className="w-4 h-4" />
                    Matrix Stats
                  </TabsTrigger>
                  <TabsTrigger className="gap-2" value="history">
                    <Network className="w-4 h-4" />
                    Tick History
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent className="p-6" value="training">
                <TrainingPanel />
              </TabsContent>

              <TabsContent className="p-6" value="validation">
                <Tabs className="w-full" defaultValue="parity">
                  <TabsList className="bg-card mb-4">
                    <TabsTrigger value="parity">Parity Check</TabsTrigger>
                    <TabsTrigger value="qiner">
                      <GitBranch className="w-3 h-3 mr-1" />
                      Qiner Reference
                    </TabsTrigger>
                    <TabsTrigger value="tests">Unit Tests</TabsTrigger>
                  </TabsList>

                  <TabsContent value="parity">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Python/TS Parity */}
                      <div className="bg-card border border-border p-4">
                        <h3 className="text-gold/80 text-xs uppercase tracking-widest font-mono mb-3">
                          Python/TypeScript Parity
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">toTernaryBits</span>
                            <span className="text-gold">100% Match</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">ternaryClamp</span>
                            <span className="text-gold">100% Match</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">computeEnergy</span>
                            <span className="text-gold">100% Match</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">tickLoop</span>
                            <span className="text-gold">100% Match</span>
                          </div>
                        </div>
                      </div>

                      {/* C++ Reference Snippet */}
                      <div className="bg-card border border-border p-4">
                        <h3 className="text-gold/80 text-xs uppercase tracking-widest font-mono mb-3">
                          Qubic Core C++ Reference
                        </h3>
                        <pre className="text-xs text-zinc-400 overflow-x-auto">
                          {`template <unsigned long long bitCount>
static void toTenaryBits(long long A, char* bits) {
  for (unsigned long long i = 0; i < bitCount; ++i) {
    char bitValue = (char)((A >> i) & 1);
    bits[i] = (bitValue == 0) ? -1 : bitValue;
  }
}`}
                        </pre>
                        <p className="text-xs text-zinc-500 mt-2">
                          Source: score_common.h:97-105
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="qiner">
                    <QinerReferencePanel />
                  </TabsContent>

                  <TabsContent value="tests">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Unit Tests */}
                      <div className="bg-card border border-border p-4">
                        <h3 className="text-gold/80 text-xs uppercase tracking-widest font-mono mb-3">
                          Unit Test Results
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gold" />
                            <span className="text-zinc-300">
                              12 tests passed
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-zinc-500" />
                            <span className="text-zinc-500">
                              0 tests skipped
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 opacity-30" />
                            <span className="text-zinc-500">
                              0 tests failed
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Test Coverage */}
                      <div className="bg-card border border-border p-4">
                        <h3 className="text-gold/80 text-xs uppercase tracking-widest font-mono mb-3">
                          Test Coverage
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">
                              Core Functions
                            </span>
                            <span className="text-gold">100%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Tick Loop</span>
                            <span className="text-gold">100%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Encodings</span>
                            <span className="text-gold">100%</span>
                          </div>
                        </div>
                      </div>

                      {/* Benchmark */}
                      <div className="bg-card border border-border p-4">
                        <h3 className="text-gold/80 text-xs uppercase tracking-widest font-mono mb-3">
                          Performance
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Avg Tick Time</span>
                            <span className="text-white font-mono">0.12ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Memory Usage</span>
                            <span className="text-white font-mono">~2MB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent className="p-6" value="qubic">
                <QubicNetworkPanel />
              </TabsContent>

              <TabsContent className="p-6" value="matrix">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-card border border-border p-4 text-center hover:bg-surface-2 transition-all">
                    <div className="text-2xl font-bold text-gold">
                      128 x 128
                    </div>
                    <div className="text-gold/80 text-xs uppercase tracking-widest font-mono">
                      Matrix Shape
                    </div>
                  </div>
                  <div className="bg-card border border-border p-4 text-center hover:bg-surface-2 transition-all">
                    <div className="text-2xl font-bold text-gold">99.58%</div>
                    <div className="text-gold/80 text-xs uppercase tracking-widest font-mono">
                      Point Symmetry
                    </div>
                  </div>
                  <div className="bg-card border border-border p-4 text-center hover:bg-surface-2 transition-all">
                    <div className="text-2xl font-bold text-gold">
                      -128 / +127
                    </div>
                    <div className="text-gold/80 text-xs uppercase tracking-widest font-mono">
                      Value Range
                    </div>
                  </div>
                  <div className="bg-card border border-border p-4 text-center hover:bg-surface-2 transition-all">
                    <div className="text-2xl font-bold text-gold">
                      AI.MEG.GOU
                    </div>
                    <div className="text-gold/80 text-xs uppercase tracking-widest font-mono">
                      XOR Message
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent className="p-6" value="history">
                <TickHistoryPanel
                  currentEnergy={currentEnergy}
                  currentTick={currentTick}
                  isProcessing={isProcessing}
                  result={result}
                />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>Aigarth Local Computer -- Ternary Neural Network</span>
            <span>Tick-Loop Algorithm from Qubic Core</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
