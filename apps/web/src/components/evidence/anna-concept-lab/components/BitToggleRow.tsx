'use client'

import { useCallback } from 'react'
import { cn } from '@/lib/utils'

/**
 * 64 (or 128) clickable bit toggles for input editing.
 *
 * Each bit displays as a small square. Click to toggle.
 * Uses ±1 ternary internally for ait compatibility.
 *
 * Layout sizing is handled entirely via CSS Grid `minmax(0, 1fr)` so cells
 * shrink to fit their parent. No JS-driven layout switching — that caused
 * ResizeObserver feedback loops + visible flicker between sibling grids.
 */
export interface BitToggleRowProps {
  bits: Int8Array | number[]
  onToggle?: (index: number) => void
  readonly?: boolean
  changedCells?: Set<number>
  /** Layout: 8x8 (64-bit), 8x16 / 16x8 / 4x32 (128-bit), 2x32 / 4x16 (64-bit), or single row */
  layout?: '8x8' | '8x16' | '16x8' | 'row' | '4x16' | '4x32' | '2x32'
  cellSize?: 'xs' | 'sm' | 'md' | 'lg'
  showIndices?: boolean
  /** Highlight bits 0..63 differently from 64..127 (for full state). */
  splitInputOutput?: boolean
  className?: string
}

const SIZE_CLASSES: Record<NonNullable<BitToggleRowProps['cellSize']>, string> = {
  xs: 'max-w-[8px] text-[5px] min-w-0',
  sm: 'max-w-[12px] text-[8px] min-w-0',
  md: 'max-w-[16px] text-[10px] min-w-0',
  lg: 'max-w-[20px] text-[10px] min-w-0',
}

export function BitToggleRow({
  bits,
  onToggle,
  readonly = false,
  changedCells,
  layout = 'row',
  cellSize = 'md',
  showIndices = false,
  splitInputOutput = false,
  className,
}: BitToggleRowProps) {
  const len = bits.length
  const bitArray = Array.from(bits)

  const handleClick = useCallback(
    (i: number) => {
      if (readonly || !onToggle) return
      onToggle(i)
    },
    [readonly, onToggle],
  )

  let cols = len
  if (layout === '8x8' && len === 64) cols = 8
  else if (layout === '8x16' && len === 128) cols = 8
  else if (layout === '16x8' && len === 128) cols = 16
  else if (layout === '4x16' && len === 64) cols = 16
  else if (layout === '2x32' && len === 64) cols = 32
  else if (layout === '4x32' && len === 128) cols = 32
  else cols = len

  const sizeClasses = SIZE_CLASSES[cellSize]

  const renderCell = (v: number, i: number) => {
    const isInput = i < 64
    const isOutput = i >= 64
    const changed = changedCells?.has(i)

    let bg = 'bg-white/5'
    let text = 'text-white/30'
    if (v === 1) {
      bg = isOutput && splitInputOutput ? 'bg-emerald-500/80' : 'bg-[#D4AF37]/80'
      text = 'text-black'
    } else if (v === -1) {
      bg = isOutput && splitInputOutput ? 'bg-emerald-900/40' : 'bg-rose-700/40'
      text = 'text-white/60'
    }

    const ring = changed ? 'ring-1 ring-white/80' : ''
    const cursor = readonly
      ? 'cursor-default'
      : 'cursor-pointer hover:ring-1 hover:ring-white/40'
    const splitBorder = splitInputOutput && i === 64 ? 'border-l-2 border-l-white/40' : ''

    return (
      <button
        key={i}
        type="button"
        onClick={() => handleClick(i)}
        disabled={readonly}
        className={cn(
          'flex items-center justify-center font-mono select-none aspect-square w-full',
          sizeClasses,
          bg,
          text,
          ring,
          cursor,
          splitBorder,
        )}
        title={`bit ${i}: ${v === 1 ? '+1' : v === -1 ? '-1' : '0'}${
          isInput ? ' (input)' : ' (output)'
        }`}
        aria-label={`Bit position ${i}, current value ${v === 1 ? '+1' : v === -1 ? '-1' : '0'}${
          isInput ? ', input' : ', output'
        }${readonly ? '' : ', click to flip'}`}
      >
        {showIndices ? '' : v === 1 ? '+' : v === -1 ? '−' : '0'}
      </button>
    )
  }

  if (layout === 'row') {
    return (
      <div className={cn('flex flex-wrap gap-[1px]', className)}>
        {bitArray.map((v, i) => renderCell(v, i))}
      </div>
    )
  }

  return (
    <div
      className={cn('grid gap-[1px] w-full', className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {bitArray.map((v, i) => renderCell(v, i))}
    </div>
  )
}
