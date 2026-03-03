'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FileJson, FileSpreadsheet, Terminal, Copy, Check, ChevronDown } from 'lucide-react'

const DOWNLOADS = [
  {
    label: 'Anna Matrix (JSON)',
    description: 'Raw 128x128 integer matrix as JSON array',
    href: '/data/anna-matrix-raw.json',
    icon: FileJson,
    size: '~60 KB',
    format: 'JSON',
  },
  {
    label: 'Anna Matrix (CSV)',
    description: '128 rows x 128 columns, comma-separated',
    href: '/data/anna-matrix.csv',
    icon: FileSpreadsheet,
    size: '~60 KB',
    format: 'CSV',
  },
]

const VERIFICATION_STEPS = [
  {
    title: 'Download the matrix',
    code: 'curl -O https://qubicchurch.com/data/anna-matrix-raw.json',
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
    title: 'Check negation symmetry (99.58%)',
    code: `python3 -c "
import json
m = json.load(open('anna-matrix-raw.json'))
n = len(m)
# Negation symmetry: m[i][j] + m[n-1-i][n-1-j] is 0 or +-1
sym = sum(1 for i in range(n) for j in range(n)
          if abs(m[i][j] + m[n-1-i][n-1-j]) <= 1)
print(f'Negation symmetry: {sym/(n*n)*100:.2f}% ({sym}/{n*n})')
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

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 text-white/20 hover:text-[#D4AF37]/60 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

export function ResearchDownloads() {
  const [guideOpen, setGuideOpen] = useState(false)

  return (
    <section className="py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/[0.06] border border-[#D4AF37]/15 text-sm text-[#D4AF37]/70 mb-4">
            <Download className="w-4 h-4" />
            <span className="font-mono tracking-wider">Independent Verification</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-wider mb-2">
            Download &amp; Verify
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto text-sm">
            Download the raw Anna Matrix data and verify all claims independently.
            No trust required &mdash; run the checks yourself.
          </p>
        </motion.div>

        {/* Download cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {DOWNLOADS.map((dl) => {
            const Icon = dl.icon
            return (
              <a
                key={dl.href}
                href={dl.href}
                download
                className="group flex items-center gap-4 p-4 bg-[#050505] border border-white/[0.04] hover:border-[#D4AF37]/20 hover:bg-[#0a0a0a] transition-all"
              >
                <div className="shrink-0 p-2.5 bg-[#D4AF37]/[0.06] border border-[#D4AF37]/10 group-hover:bg-[#D4AF37]/[0.1] transition-colors">
                  <Icon className="w-5 h-5 text-[#D4AF37]/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                    {dl.label}
                  </div>
                  <div className="text-xs text-white/30 mt-0.5">{dl.description}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[10px] text-[#D4AF37]/40 font-mono uppercase">{dl.format}</div>
                  <div className="text-[10px] text-white/20 font-mono">{dl.size}</div>
                </div>
              </a>
            )
          })}
        </div>

        {/* Verification guide - collapsible */}
        <div className="border border-white/[0.04] bg-[#050505]">
          <button
            onClick={() => setGuideOpen(!guideOpen)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-4 h-4 text-[#D4AF37]/50" />
              <span className="text-sm font-medium text-white/70">
                Verification Guide
              </span>
              <span className="text-[10px] text-white/25 font-mono uppercase tracking-wider hidden sm:inline">
                Run in your terminal
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-white/30 transition-transform duration-200 ${guideOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {guideOpen && (
            <div className="px-5 pb-5 space-y-4 border-t border-white/[0.04]">
              <p className="text-xs text-white/30 pt-4">
                Copy and paste these commands into your terminal to independently verify the Anna Matrix data.
                Requires Python 3 and curl.
              </p>

              {VERIFICATION_STEPS.map((step, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-[#D4AF37]/40 font-mono font-bold">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-white/50">{step.title}</span>
                  </div>
                  <div className="relative">
                    <pre className="bg-black/60 border border-white/[0.04] p-3 pr-10 text-xs text-white/60 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
                      {step.code.trim()}
                    </pre>
                    <CopyButton text={step.code.trim()} />
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-white/[0.04]">
                <p className="text-[10px] text-white/20 font-mono leading-relaxed">
                  Expected: 128x128 matrix, values -128 to 127, 99.58% negation symmetry (16,316 / 16,384 cells).
                  Files contain only the raw integer matrix &mdash; no personal information, no metadata, no tracking.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
