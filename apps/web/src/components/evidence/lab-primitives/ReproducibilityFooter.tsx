'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, ChevronDown, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReproduceCommand {
  label: string
  cmd: string
  expected: string
}

export interface ReproducibilityFooterProps {
  /** Lab-specific intro sentence. */
  intro: string
  /** 2–4 shell commands the visitor can run to reproduce everything. */
  commands: ReproduceCommand[]
  /** Optional repo URL, defaults to the public repo. */
  repoUrl?: string
  className?: string
}

/**
 * Reproducibility onramp footer, collapsed by default. When opened, shows the
 * exact shell commands a visitor can run to reproduce the lab's findings, plus
 * the expected output (so drift is immediately visible).
 */
export function ReproducibilityFooter({
  intro,
  commands,
  repoUrl,
  className,
}: ReproducibilityFooterProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)

  const copy = (cmd: string, idx: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(cmd)
        .then(() => {
          setCopied(idx)
          setTimeout(() => setCopied(null), 1500)
        })
        .catch(() => {})
    }
  }

  return (
    <div className={cn('border border-border bg-card', className)}>
      <button
        aria-expanded={open}
        className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-3.5 h-3.5 text-gold/85 flex-shrink-0" />
          <span className="text-xs font-mono uppercase tracking-wider text-gold/85 truncate">
            Reproduce these findings in 30 seconds
          </span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform flex-shrink-0',
            open && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            animate={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-border p-3 sm:p-4 space-y-3">
              <p className="text-xs text-white/65 leading-relaxed">{intro}</p>

              {commands.map((c, idx) => (
                <div className="space-y-1" key={idx}>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs font-mono uppercase tracking-wider text-gold/70 flex-shrink-0">
                      {idx + 1}. {c.label}
                    </span>
                  </div>
                  <div className="flex items-stretch gap-1.5 group">
                    <code className="flex-1 min-w-0 text-xs sm:text-xs font-mono text-white/85 bg-background border border-border px-2 py-1.5 overflow-x-auto whitespace-pre">
                      {c.cmd}
                    </code>
                    <button
                      aria-label="copy command"
                      className="px-2 border border-border bg-card hover:bg-white/[0.04] text-white/55 hover:text-gold flex-shrink-0"
                      onClick={() => copy(c.cmd, idx)}
                      type="button"
                    >
                      {copied === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="text-xs sm:text-xs text-muted-foreground font-mono pl-3 border-l border-border">
                    expect →{' '}
                    <span className="text-emerald-400/85">{c.expected}</span>
                  </div>
                </div>
              ))}

              {repoUrl && (
                <div className="pt-2 border-t border-border text-xs text-white/55">
                  Repo:{' '}
                  <a
                    className="text-gold hover:underline break-all"
                    href={repoUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {repoUrl}
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
