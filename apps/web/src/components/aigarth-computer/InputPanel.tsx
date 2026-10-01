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
  hex: [
    '0xDEADBEEF',
    '0x000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
  ],
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
            className="w-full bg-card border border-border px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all resize-none font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
            onChange={e => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={PLACEHOLDERS[inputType]}
            ref={ref}
            rows={3}
            value={value}
          />

          {/* Character count */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-500">
            {value.length} chars
          </div>
        </div>

        {/* Quick Examples */}
        {examples.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-gold/80 text-xs uppercase tracking-widest font-mono">
              Try:
            </span>
            {examples.slice(0, 4).map(example => (
              <button
                className="px-2 py-1 text-xs bg-card hover:bg-surface-2 text-zinc-400 hover:text-gold border border-border transition-all disabled:opacity-50 font-mono"
                disabled={disabled}
                key={example}
                onClick={() => onChange(example)}
                type="button"
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
