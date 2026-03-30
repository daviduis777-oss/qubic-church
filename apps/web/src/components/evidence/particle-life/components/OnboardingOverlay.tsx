'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles, MousePointer2, GitCompare, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'emergence-lab-tour-seen'

interface OnboardingOverlayProps {
  onComplete: () => void
  onQuickDemo: () => void
}

const STEPS = [
  {
    icon: Zap,
    title: 'Particle Universe',
    description: 'Each color is a species of particle. They attract and repel each other based on rules from a mysterious 128x128 matrix.',
    highlight: 'Watch how simple rules create complex, lifelike patterns.',
  },
  {
    icon: Sparkles,
    title: 'The Anna Matrix',
    description: 'These rules come from the Anna Matrix — a cryptographic artifact with 99.58% point symmetry, 8 energy levels, and every column summing to 42.',
    highlight: 'It produces fundamentally different emergence than random matrices.',
  },
  {
    icon: MousePointer2,
    title: 'Interact',
    description: 'Click anywhere to attract particles toward your cursor. Hold Shift and click to repel them. Drag for continuous force.',
    highlight: 'Try it! Disturb a cluster and watch it self-repair.',
  },
  {
    icon: GitCompare,
    title: 'Compare & Analyze',
    description: 'Press C or click A/B to compare Anna Matrix vs Random side-by-side. Open the metrics panel to see real-time scientific measurements.',
    highlight: 'The statistical comparison proves the difference is significant.',
  },
] as const

export function OnboardingOverlay({ onComplete, onQuickDemo }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) setVisible(true)
  }, [])

  if (!visible) return null

  const currentStep = STEPS[step]!
  const Icon = currentStep.icon
  const isLast = step === STEPS.length - 1

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
    onComplete()
  }

  const handleQuickDemo = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
    onQuickDemo()
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 border border-white/[0.08] bg-[#0a0a0a] shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-white/35 hover:text-white/65 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all',
                i === step ? 'bg-[#D4AF37] w-4' : i < step ? 'bg-[#D4AF37]/30' : 'bg-white/10',
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              <Icon className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h3 className="text-base font-bold tracking-wider text-white/90">
              {currentStep.title}
            </h3>
          </div>

          <p className="text-sm text-white/65 leading-relaxed">
            {currentStep.description}
          </p>

          <p className="text-xs text-[#D4AF37]/60 font-mono">
            {currentStep.highlight}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 pt-0">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono text-white/45 hover:text-white/60 transition-colors"
              >
                <ChevronLeft className="w-3 h-3" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-xs font-mono text-white/35 hover:text-white/55 transition-colors"
            >
              Skip
            </button>

            {isLast ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleQuickDemo}
                  className="px-3 py-1.5 text-xs font-mono bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 transition-colors"
                >
                  Quick Demo
                </button>
                <button
                  onClick={handleClose}
                  className="px-3 py-1.5 text-xs font-mono bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/30 transition-colors"
                >
                  Start Exploring
                </button>
              </div>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono bg-white/[0.04] text-white/60 border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
