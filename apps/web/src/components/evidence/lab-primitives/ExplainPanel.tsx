'use client'

import { useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Baby,
  Lightbulb,
  BookOpen,
  Sigma,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Lazy-loaded KaTeX wrapper, only loads when Math tab opens, saving ~120 KB
// on the initial bundle. Eager BlockMath/InlineMath re-exports below are
// still used by `explainContent.tsx` modules (each KaTeX usage triggers the
// bundle load lazily on first render).
const MathView = dynamic(() => import('./MathView'), {
  ssr: false,
  loading: () => (
    <div className="text-xs text-muted-foreground font-mono italic py-2">
      loading math typeset…
    </div>
  ),
})

export interface ExplainPanelProps {
  /** Kid level, no jargon, physical analogies, ~3 sentences. New in 2026-05-11. */
  kid: ReactNode
  /** Simple level, light technical terms with glossary tooltips. */
  simple: ReactNode
  /** Researcher level, formal prose with technical precision. */
  researcher: ReactNode
  /** Math level, KaTeX formulas and derivations. */
  math: ReactNode
  /** Optional title override; default is "What's happening here?" */
  title?: string
  /** Default-collapsed (true) or open (false). Default false. */
  defaultCollapsed?: boolean
  className?: string
}

type TabKey = 'kid' | 'simple' | 'researcher' | 'math'

const TABS: { key: TabKey; label: string; icon: ReactNode; aria: string }[] = [
  {
    key: 'kid',
    label: '5-year-old',
    icon: <Baby className="w-3.5 h-3.5" />,
    aria: 'Kid level, pure analogy',
  },
  {
    key: 'simple',
    label: 'Simple',
    icon: <Lightbulb className="w-3.5 h-3.5" />,
    aria: 'Simple level, light jargon',
  },
  {
    key: 'researcher',
    label: 'Researcher',
    icon: <BookOpen className="w-3.5 h-3.5" />,
    aria: 'Researcher level, formal prose',
  },
  {
    key: 'math',
    label: 'Math',
    icon: <Sigma className="w-3.5 h-3.5" />,
    aria: 'Math level, KaTeX formulas',
  },
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
    <div
      className={cn(
        'border border-gold/15 bg-[#0A0A0A]/80 backdrop-blur-sm',
        className
      )}
    >
      {/* Header */}
      <button
        aria-expanded={!collapsed}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.02] transition-colors"
        onClick={() => setCollapsed(c => !c)}
        type="button"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-gold/85" />
          <span className="text-xs font-mono uppercase tracking-wider text-gold/85">
            {title}
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground/70" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground/70" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            animate={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-border">
              {/* Tab switcher */}
              <div className="flex border-b border-border overflow-x-auto">
                {TABS.map(t => {
                  const isActive = tab === t.key
                  return (
                    <button
                      aria-label={t.aria}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono whitespace-nowrap transition-colors flex-shrink-0',
                        isActive
                          ? 'bg-gold/10 text-gold border-b-2 border-gold/60'
                          : 'text-white/55 hover:text-white/85 border-b-2 border-transparent'
                      )}
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      type="button"
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
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'text-white/80 leading-relaxed',
                      '[&_strong]:text-white/95 [&_em]:text-gold/85 [&_em]:not-italic [&_em]:font-mono',
                      tab === 'kid' ? 'text-sm' : 'text-xs'
                    )}
                    exit={{ opacity: 0, y: -4 }}
                    initial={{ opacity: 0, y: 4 }}
                    key={tab}
                    transition={{ duration: 0.15 }}
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
 * KaTeX components, re-exported for convenience.
 *
 * Note: these ship in any bundle that imports them directly (e.g. an
 * `explainContent.tsx`). The lazy-loading benefit only applies to the
 * KaTeX CSS + render runtime inside `MathView`, which is only loaded when
 * the visitor opens the Math tab.
 */
export { BlockMath, InlineMath } from 'react-katex'
