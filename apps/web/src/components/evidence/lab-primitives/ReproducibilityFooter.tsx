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
  /** Optional repo URL — defaults to the public repo. */
  repoUrl?: string
  className?: string
}

/**
 * Reproducibility onramp footer — collapsed by default. When opened, shows the
 * exact shell commands a visitor can run to reproduce the lab's findings, plus
 * the expected output (so drift is immediately visible).
 */
export function ReproducibilityFooter({ intro, commands, repoUrl, className }: ReproducibilityFooterProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)

  const copy = (cmd: string, idx: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cmd).then(() => {
        setCopied(idx)
        setTimeout(() => setCopied(null), 1500)
      }).catch(() => {})
    }
  }

  return (
    <div className={cn('border border-white/[0.06] bg-[#0A0A0A]', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-3.5 h-3.5 text-[#D4AF37]/85 flex-shrink-0" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#D4AF37]/85 truncate">
            Reproduce these findings in 30 seconds
          </span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-white/45 transition-transform flex-shrink-0',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] p-3 sm:p-4 space-y-3">
              <p className="text-xs text-white/65 leading-relaxed">{intro}</p>

              {commands.map((c, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37]/70 flex-shrink-0">
                      {idx + 1}. {c.label}
                    </span>
                  </div>
                  <div className="flex items-stretch gap-1.5 group">
                    <code className="flex-1 min-w-0 text-[11px] sm:text-xs font-mono text-white/85 bg-[#020203] border border-white/[0.06] px-2 py-1.5 overflow-x-auto whitespace-pre">
                      {c.cmd}
                    </code>
                    <button
                      type="button"
                      onClick={() => copy(c.cmd, idx)}
                      className="px-2 border border-white/[0.06] bg-[#0A0A0A] hover:bg-white/[0.04] text-white/55 hover:text-[#D4AF37] flex-shrink-0"
                      aria-label="copy command"
                    >
                      {copied === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-white/45 font-mono pl-3 border-l border-white/[0.06]">
                    expect → <span className="text-emerald-400/85">{c.expected}</span>
                  </div>
                </div>
              ))}

              {repoUrl && (
                <div className="pt-2 border-t border-white/[0.04] text-[11px] text-white/55">
                  Repo: <a href={repoUrl} target="_blank" rel="noreferrer" className="text-[#D4AF37] hover:underline break-all">{repoUrl}</a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
