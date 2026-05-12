'use client'

import { useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Baby, Lightbulb, BookOpen, Sigma, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

// Lazy-loaded KaTeX wrapper — only loads when Math tab opens, saving ~120 KB
// on the initial bundle. Eager BlockMath/InlineMath re-exports below are
// still used by `explainContent.tsx` modules (each KaTeX usage triggers the
// bundle load lazily on first render).
const MathView = dynamic(() => import('./MathView'), {
  ssr: false,
  loading: () => (
    <div className="text-xs text-white/40 font-mono italic py-2">loading math typeset…</div>
  ),
})

export interface ExplainPanelProps {
  /** Kid level — no jargon, physical analogies, ~3 sentences. New in 2026-05-11. */
  kid: ReactNode
  /** Simple level — light technical terms with glossary tooltips. */
  simple: ReactNode
  /** Researcher level — formal prose with technical precision. */
  researcher: ReactNode
  /** Math level — KaTeX formulas and derivations. */
  math: ReactNode
  /** Optional title override; default is "What's happening here?" */
  title?: string
  /** Default-collapsed (true) or open (false). Default false. */
  defaultCollapsed?: boolean
  className?: string
}

type TabKey = 'kid' | 'simple' | 'researcher' | 'math'

const TABS: { key: TabKey; label: string; icon: ReactNode; aria: string }[] = [
  { key: 'kid', label: '5-year-old', icon: <Baby className="w-3.5 h-3.5" />, aria: 'Kid level — pure analogy' },
  { key: 'simple', label: 'Simple', icon: <Lightbulb className="w-3.5 h-3.5" />, aria: 'Simple level — light jargon' },
  { key: 'researcher', label: 'Researcher', icon: <BookOpen className="w-3.5 h-3.5" />, aria: 'Researcher level — formal prose' },
  { key: 'math', label: 'Math', icon: <Sigma className="w-3.5 h-3.5" />, aria: 'Math level — KaTeX formulas' },
]

/**
 * Four-tier expandable explanation:
 *   Kid (no jargon, physical analogy)
 *   Simple (light jargon with glossary)
 *   Researcher (formal prose)
 *   Math (KaTeX)
 *
 * Designed to live above each module so non-technical visitors can understand
 * what they're looking at, while researchers get the formal notation on demand.
 */
export function ExplainPanel({
  kid,
  simple,
  researcher,
  math,
  title = "What's happening here?",
  defaultCollapsed = false,
  className,
}: ExplainPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [tab, setTab] = useState<TabKey>('kid')

  return (
    <div className={cn('border border-[#D4AF37]/15 bg-[#0A0A0A]/80 backdrop-blur-sm', className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.02] transition-colors"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-[#D4AF37]/85" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#D4AF37]/85">
            {title}
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-white/45" />
        ) : (
          <ChevronUp className="w-4 h-4 text-white/45" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06]">
              {/* Tab switcher */}
              <div className="flex border-b border-white/[0.06] overflow-x-auto">
                {TABS.map((t) => {
                  const isActive = tab === t.key
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTab(t.key)}
                      aria-label={t.aria}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono whitespace-nowrap transition-colors flex-shrink-0',
                        isActive
                          ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-b-2 border-[#D4AF37]/60'
                          : 'text-white/55 hover:text-white/85 border-b-2 border-transparent',
                      )}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  )
                })}
              </div>

              {/* Content */}
              <div className="px-4 py-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'text-white/80 leading-relaxed',
                      '[&_strong]:text-white/95 [&_em]:text-[#D4AF37]/85 [&_em]:not-italic [&_em]:font-mono',
                      tab === 'kid' ? 'text-sm' : 'text-xs',
                    )}
                  >
                    {tab === 'kid' && kid}
                    {tab === 'simple' && simple}
                    {tab === 'researcher' && researcher}
                    {tab === 'math' && <MathView>{math}</MathView>}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * KaTeX components — re-exported for convenience.
 *
 * Note: these ship in any bundle that imports them directly (e.g. an
 * `explainContent.tsx`). The lazy-loading benefit only applies to the
 * KaTeX CSS + render runtime inside `MathView`, which is only loaded when
 * the visitor opens the Math tab.
 */
export { BlockMath, InlineMath } from 'react-katex'
