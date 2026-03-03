'use client'

import { forwardRef } from 'react'
import type { InputType } from '@/lib/aigarth/types'

interface InputPanelProps {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  inputType: InputType
  disabled?: boolean
}

const PLACEHOLDERS: Record<InputType, string> = {
  text: 'Enter any text to process through the neural network...',
  hex: '0xDEADBEEF or raw hex string...',
  coords: '6+33 (Anna coordinates)',
  qubic_seed: '55 lowercase letters (a-z)',
  bitcoin: '1BTC... or 3... or bc1...',
  binary: '[-1, 1, 1, -1, 0, 1, ...]',
  unknown: 'Enter input...',
}

const EXAMPLES: Record<InputType, string[]> = {
  text: ['Hello World', 'cfb', 'satoshi', 'bitcoin', 'qubic'],
  hex: ['0xDEADBEEF', '0x000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f'],
  coords: ['6+33', '0+0', '45+92', '82+39'],
  qubic_seed: ['abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz123'],
  bitcoin: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', '1CFB...'],
  binary: ['[-1, 1, 1, -1, 0, 1]'],
  unknown: [],
}

export const InputPanel = forwardRef<HTMLTextAreaElement, InputPanelProps>(
  ({ value, onChange, onKeyDown, inputType, disabled }, ref) => {
    const examples = EXAMPLES[inputType] || []

    return (
      <div className="space-y-3">
        {/* Main Input */}
        <div className="relative">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={PLACEHOLDERS[inputType]}
            disabled={disabled}
            rows={3}
            className="w-full bg-[#050505] border border-white/[0.04] px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]/50 transition-all resize-none font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Character count */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-500">
            {value.length} chars
          </div>
        </div>

        {/* Quick Examples */}
        {examples.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">Try:</span>
            {examples.slice(0, 4).map((example) => (
              <button
                key={example}
                onClick={() => onChange(example)}
                disabled={disabled}
                className="px-2 py-1 text-xs bg-[#050505] hover:bg-[#0a0a0a] hover:shadow-[0_0_30px_rgba(212,175,55,0.03)] text-zinc-400 hover:text-[#D4AF37] border border-white/[0.04] transition-all disabled:opacity-50 font-mono"
              >
                {example.length > 20 ? example.slice(0, 20) + '...' : example}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
)

InputPanel.displayName = 'InputPanel'
