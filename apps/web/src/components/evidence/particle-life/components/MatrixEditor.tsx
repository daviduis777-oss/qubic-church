'use client'

import { useState, useCallback } from 'react'
import { ChevronDown, ChevronUp, Upload, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PARTICLE_COLORS } from '../config'

interface MatrixEditorProps {
  rules: number[][] | null
  numTypes: number
  isOpen: boolean
  onToggle: () => void
  onRulesChange: (rules: number[][]) => void
}

type MatrixTemplate = 'identity' | 'all-attract' | 'all-repel' | 'checkerboard' | 'predator-prey'

const TEMPLATES: { id: MatrixTemplate; name: string; description: string }[] = [
  { id: 'identity', name: 'Identity', description: 'Types only interact with themselves' },
  { id: 'all-attract', name: 'All Attract', description: 'Every type attracts every other (+0.5)' },
  { id: 'all-repel', name: 'All Repel', description: 'Every type repels every other (-0.5)' },
  { id: 'checkerboard', name: 'Checkerboard', description: 'Alternating attract/repel pattern' },
  { id: 'predator-prey', name: 'Predator-Prey', description: 'Circular chase: A->B->C->...->A' },
]

function generateTemplate(template: MatrixTemplate, n: number): number[][] {
  const rules: number[][] = Array.from({ length: n }, () => Array(n).fill(0) as number[])
  switch (template) {
    case 'identity':
      for (let i = 0; i < n; i++) rules[i]![i] = 0.8
      break
    case 'all-attract':
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) rules[i]![j] = 0.5
      break
    case 'all-repel':
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) rules[i]![j] = -0.5
      break
    case 'checkerboard':
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) rules[i]![j] = (i + j) % 2 === 0 ? 0.6 : -0.6
      break
    case 'predator-prey':
      for (let i = 0; i < n; i++) {
        rules[i]![(i + 1) % n] = 0.8  // chase next
        rules[i]![(i + n - 1) % n] = -0.4  // flee from prev
        rules[i]![i] = 0.3  // mild self-attraction
      }
      break
  }
  return rules
}

function valueToColor(val: number): string {
  if (val > 0) {
    const intensity = Math.min(1, val)
    return `rgba(212, 175, 55, ${0.2 + intensity * 0.8})`
  } else if (val < 0) {
    const intensity = Math.min(1, -val)
    return `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`
  }
  return 'rgba(255, 255, 255, 0.05)'
}

export function MatrixEditor({ rules, numTypes, isOpen, onToggle, onRulesChange }: MatrixEditorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [paintValue, setPaintValue] = useState(0.5)

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!rules) return
    const newRules = rules.map((r) => [...r])
    // Cycle: 0 -> +0.5 -> +1 -> -0.5 -> -1 -> 0
    const current = newRules[row]![col]!
    let next: number
    if (current >= 0.9) next = -0.5
    else if (current >= 0.4) next = 1.0
    else if (current <= -0.9) next = 0
    else if (current <= -0.4) next = -1.0
    else if (current > 0.1) next = 0.5
    else next = 0.5
    newRules[row]![col] = next
    onRulesChange(newRules)
  }, [rules, onRulesChange])

  const handleCellDrag = useCallback((row: number, col: number) => {
    if (!isDragging || !rules) return
    const newRules = rules.map((r) => [...r])
    newRules[row]![col] = paintValue
    onRulesChange(newRules)
  }, [isDragging, rules, paintValue, onRulesChange])

  const handleTemplate = (templateId: MatrixTemplate) => {
    onRulesChange(generateTemplate(templateId, numTypes))
  }

  return (
    <div className="border border-white/[0.06] bg-[#050505]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-xs font-mono text-white/55 uppercase tracking-wider">
          Custom Matrix Editor
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-white/45" /> : <ChevronDown className="w-3.5 h-3.5 text-white/45" />}
      </button>

      {isOpen && rules && (
        <div className="p-2 sm:p-3 pt-0 space-y-3">
          {/* Templates */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono text-white/35 uppercase">Templates</div>
            <div className="flex flex-wrap gap-1">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTemplate(t.id)}
                  className="px-2 py-1 text-[11px] font-mono text-white/45 border border-white/[0.06] hover:bg-white/[0.04] hover:text-white/65 transition-colors"
                  title={t.description}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Paint value selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/35 uppercase">Paint:</span>
            {[-1, -0.5, 0, 0.5, 1].map((v) => (
              <button
                key={v}
                onClick={() => setPaintValue(v)}
                className={cn(
                  'w-6 h-6 text-[10px] font-mono border transition-all',
                  paintValue === v ? 'border-white/40 scale-110' : 'border-white/[0.06]',
                )}
                style={{ backgroundColor: valueToColor(v) }}
                title={`${v > 0 ? '+' : ''}${v}`}
              >
                {v > 0 ? '+' : v < 0 ? '-' : '0'}
              </button>
            ))}
          </div>

          {/* Interactive matrix grid */}
          <div className="flex gap-3">
            {/* Column headers */}
            <div>
              <div className="flex">
                <div className="w-6 h-4" /> {/* spacer */}
                {Array.from({ length: numTypes }, (_, j) => (
                  <div
                    key={j}
                    className="w-8 h-4 flex items-center justify-center"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PARTICLE_COLORS[j] + 'CC' }}
                    />
                  </div>
                ))}
              </div>

              {/* Rows */}
              {rules.map((row, i) => (
                <div key={`row-${i}`} className="flex items-center">
                  {/* Row header */}
                  <div className="w-6 flex items-center justify-center">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PARTICLE_COLORS[i] + 'CC' }}
                    />
                  </div>

                  {/* Cells */}
                  {row.map((val, j) => (
                    <button
                      key={`cell-${i}-${j}`}
                      className="w-8 h-8 border border-white/[0.03] flex items-center justify-center text-[10px] font-mono text-white/55 hover:border-white/20 transition-colors cursor-pointer"
                      style={{ backgroundColor: valueToColor(val) }}
                      onClick={() => handleCellClick(i, j)}
                      onMouseDown={() => setIsDragging(true)}
                      onMouseUp={() => setIsDragging(false)}
                      onMouseEnter={() => handleCellDrag(i, j)}
                      title={`[${i},${j}] = ${val.toFixed(2)}\nType ${i} → Type ${j}`}
                    >
                      {val !== 0 ? (val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1)) : ''}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[10px] font-mono text-white/30">
            <span>Gold = attract</span>
            <span>Blue = repel</span>
            <span>Click to cycle values, drag to paint</span>
          </div>
        </div>
      )}
    </div>
  )
}
