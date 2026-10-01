'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileJson,
  FileSpreadsheet,
  Terminal,
  Copy,
  Check,
  ChevronDown,
} from 'lucide-react'

const DOWNLOADS = [
  {
    label: 'Anna Matrix, as transcribed (JSON)',
    description: 'The 128 × 128 map as a JSON array of rows',
    href: '/data/anna-matrix-raw.json',
    icon: FileJson,
    size: '~60 KB',
    format: 'JSON',
  },
  {
    label: 'Anna Matrix, as transcribed (CSV)',
    description: '128 rows × 128 columns, comma-separated',
    href: '/data/anna-matrix.csv',
    icon: FileSpreadsheet,
    size: '~60 KB',
    format: 'CSV',
  },
  {
    label: 'Anna Matrix, corrected candidate (JSON)',
    description: 'Same layout, 34 cells set from their mirror cells',
    href: '/data/anna-matrix-clean.json',
    icon: FileJson,
    size: '~60 KB',
    format: 'JSON',
  },
  {
    label: 'Aigarth unit fingerprint (JSON)',
    description: 'Per-run distances and fits behind the Origin tab',
    href: '/data/itu-fingerprint.json',
    icon: FileJson,
    size: '~33 KB',
    format: 'JSON',
  },
]

const VERIFICATION_STEPS = [
  {
    title: 'Download the matrix',
    code: 'curl -O https://raw.githubusercontent.com/daviduis777-oss/qubic-church/main/apps/web/public/data/anna-matrix-raw.json',
  },
  {
    title: 'Verify dimensions (128x128)',
    code: `python3 -c "
import json
m = json.load(open('anna-matrix-raw.json'))
assert len(m) == 128 and all(len(r) == 128 for r in m)
print(f'Dimensions: {len(m)}x{len(m[0])}')
print(f'Value range: {min(v for r in m for v in r)} to {max(v for r in m for v in r)}')
"`,
  },
  {
    title: 'Check the mirror rule (16,316 of 16,384 cells)',
    code: `python3 -c "
import json
m = json.load(open('anna-matrix-raw.json'))
n = len(m)
# Mirror rule: m[i][j] + m[n-1-i][n-1-j] == -1
ok = sum(1 for i in range(n) for j in range(n)
         if m[i][j] + m[n-1-i][n-1-j] == -1)
print(f'Mirror rule holds in {ok}/{n*n} cells, {n*n-ok} breaks')
"`,
  },
  {
    title: 'Verify SHA-256 hash',
    code: `# Expected: 104261fc18ea1ee7290cb3e05b39c7f1e6e4d6cd05c1d15d85295285fe085c8e
shasum -a 256 anna-matrix-raw.json`,
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for browsers without the async clipboard API (or without permission)
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      if (!ok) return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      aria-label={copied ? 'Copied' : 'Copy command to clipboard'}
      className="absolute top-1 right-1 p-2 text-muted-foreground transition-colors hover:text-foreground"
      onClick={handleCopy}
      title="Copy to clipboard"
      type="button"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  )
}

export function ResearchDownloads() {
  const [guideOpen, setGuideOpen] = useState(false)

  return (
    <section className="py-12">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="eyebrow mb-3 text-gold">Independent Verification</div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            Download &amp; Verify
          </h2>
          <p className="text-fg-2 max-w-2xl mx-auto text-sm">
            Download the data behind this page and run the checks yourself.
          </p>
        </motion.div>

        {/* Download cards */}
        <div className="mb-6 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2">
          {DOWNLOADS.map(dl => {
            const Icon = dl.icon
            return (
              <a
                className="group flex items-center gap-4 bg-card p-4 transition-colors hover:bg-surface-2"
                download
                href={dl.href}
                key={dl.href}
              >
                <div className="shrink-0">
                  <Icon aria-hidden="true" className="size-5 text-gold/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground transition-colors group-hover:text-gold">
                    {dl.label}
                  </div>
                  <div className="mt-0.5 text-xs text-fg-2">
                    {dl.description}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-xs uppercase text-fg-2">
                    {dl.format}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {dl.size}
                  </div>
                </div>
              </a>
            )
          })}
        </div>

        {/* Verification guide - collapsible */}
        <div className="border border-border bg-card">
          <button
            aria-controls="verification-guide"
            aria-expanded={guideOpen}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-surface-2"
            onClick={() => setGuideOpen(!guideOpen)}
            type="button"
          >
            <div className="flex items-center gap-3">
              <Terminal aria-hidden="true" className="size-4 text-gold/60" />
              <span className="text-sm font-medium text-foreground">
                Verification Guide
              </span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Run in your terminal
              </span>
            </div>
            <ChevronDown
              aria-hidden="true"
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ease-out ${guideOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {guideOpen && (
            <div
              className="px-5 pb-5 space-y-4 border-t border-border"
              id="verification-guide"
            >
              <p className="text-xs text-muted-foreground pt-4">
                Copy and paste these commands into your terminal to
                independently verify the Anna Matrix data. Requires Python 3 and
                curl.
              </p>

              {VERIFICATION_STEPS.map((step, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gold/80 font-mono font-bold">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm text-fg-2">{step.title}</span>
                  </div>
                  <div className="relative">
                    <pre className="bg-background border border-border p-3 pr-10 text-xs text-fg-2 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
                      {step.code.trim()}
                    </pre>
                    <CopyButton text={step.code.trim()} />
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                  Expected: 128x128 matrix, values -128 to 127, mirror rule
                  holds in 16,316 of 16,384 cells (68 breaks). The files contain
                  only numbers: no personal information, no tracking.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
