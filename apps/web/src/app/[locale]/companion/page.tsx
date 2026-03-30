'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  ExternalLink,
  BookOpen,
  Terminal,
} from 'lucide-react'
import { PythonCode } from '@/components/companion/PythonCode'

const GOLD = '#f0c030'
const BG = '#0d0d14'
const TEXT_PRIMARY = '#d8d8e2'
const TEXT_DIM = 'rgba(216, 216, 226, 0.55)'
const BORDER = 'rgba(240, 192, 48, 0.20)'
const CARD_BG = 'rgba(255, 255, 255, 0.06)'

const TIER1 = '#10B981'
const TIER2 = '#fbbf24'
const TIER3 = '#ec4899'
const CYAN = '#22d3ee'

type Section = {
  num: string
  title: string
  tier: 'Tier 1' | 'Tier 2' | 'Tier 1 → Tier 2' | 'Tier 3' | 'method' | 'tools' | 'reference'
  oneLine: string
}

const SECTIONS: Section[] = [
  { num: '§1', title: 'Point Symmetry of the Matrix', tier: 'Tier 1', oneLine: '99.58% of all 16,384 cells satisfy M[i][j] + M[127−i][127−j] = −1.' },
  { num: '§2', title: 'Statistical Framework', tier: 'method', oneLine: 'Bonferroni correction across ~22,480 tests; Monte Carlo null tests; what we deliberately do not do.' },
  { num: '§3', title: 'Period-4 Attractor', tier: 'Tier 1', oneLine: 'Every random ternary 128-vector iterated through sign(M·v) converges to a period-4 cycle within ~11 steps. 0/1000 shuffled matrices reproduce this.' },
  { num: '§4', title: 'Seven-Position Asymmetry', tier: 'Tier 1', oneLine: 'Antipodal identity holds for 121 of 128 cycle positions; breaks at exactly [3, 18, 32, 61, 65, 101, 109]. Invariant across five independent encodings of the Genesis Block public key.' },
  { num: '§5', title: 'Diagonal −27 Cells and Patoshi Blocks', tier: 'Tier 1 → Tier 2', oneLine: '10 main-diagonal cells with |value| = 27 at heights [72, 73, 74, 79, 88, 92, 94, 95, 119, 120] — every one a Patoshi-mined Bitcoin block from January 2009 with 50 BTC reward, never spent.' },
  { num: '§6', title: 'Genesis Block Read as Bitcoin Script', tier: 'Tier 1', oneLine: 'Genesis 65-byte public key parses as four valid Script opcodes including PUSHBYTES_72 (0x48 = 72). M[72][72] = −27.' },
  { num: '§7', title: 'Embedded Messages — what survives, what does not', tier: 'Tier 2', oneLine: '"CFB" appears at row 11 in the XOR-127 stream (Population B of attractor, mirror at row 116 preserved). GAME, MEGA, KEY, SATOSHI, YOU, ARE, ALL — all debunked.' },
  { num: '§8', title: 'POCC / HASV / PXMARAS — On-Chain Triangle', tier: 'Tier 1', oneLine: 'Three Qubic addresses issued tokens with supplies 676×10⁹, 676, 1. HASV→PXMARAS sent 26 QU exactly 27 times. AIGARTH issued 6,268 days after Bitcoin Genesis. All on-chain.' },
  { num: '§9', title: '1CFB and 1CFi — Byte-Level Anchors', tier: 'Tier 1', oneLine: 'Vanity-address byte alignments to the matrix and to PUSHBYTES_72.' },
  { num: '§10', title: 'The Identity Question', tier: 'Tier 3', oneLine: 'Who created the matrix is treated as Tier 3 with explicit marking. No cryptographic signature settles it. We do not pretend otherwise.' },
  { num: '§11', title: 'Negative Results', tier: 'method', oneLine: 'What did not survive — including some claims earlier versions of this research treated as confirmed.' },
  { num: '§12', title: 'Reproducibility Checklist', tier: 'tools', oneLine: 'Python snippets, longer scripts at /docs/scripts, Monte Carlo runs in 2-5 minutes on a laptop.' },
  { num: '§13', title: 'Glossary and References', tier: 'reference', oneLine: 'Patoshi (Lerner 2013), CfB, sign() ternary clamp, M[i][j] notation.' },
]

const VERIFY_SNIPPET_S1 = `import numpy as np
import urllib.request, json

# Load the published Anna Matrix
url = "https://qubic.church/data/anna_matrix.json"
M = np.array(json.loads(urllib.request.urlopen(url).read()))

assert M.shape == (128, 128)

matches = sum(1 for i in range(128) for j in range(128)
              if M[i][j] + M[127-i][127-j] == -1)

print(f"Symmetric cells: {matches} / 16384")
print(f"Symmetry ratio:  {matches/16384*100:.2f}%")
# Expected: Symmetric cells: 16316 / 16384  |  Symmetry ratio: 99.58%`

const VERIFY_SNIPPET_S3 = `import numpy as np
import urllib.request, json

url = "https://qubic.church/data/anna_matrix.json"
M = np.array(json.loads(urllib.request.urlopen(url).read()))

def step(v):
    return np.sign(M @ v).astype(int)

def find_cycle(v_start, max_steps=200):
    history = [tuple(v_start)]
    v = v_start
    for _ in range(max_steps):
        v = step(v)
        if tuple(v) in history:
            cycle_start = history.index(tuple(v))
            return len(history) - cycle_start, len(history)
        history.append(tuple(v))
    return None, max_steps

np.random.seed(42)
periods = []
for _ in range(1000):
    v0 = np.random.choice([-1, 1], size=128)
    period, steps = find_cycle(v0)
    periods.append(period)

print(f"Distinct periods: {set(periods)}")
print(f"All converge to period 4: {all(p == 4 for p in periods)}")
# Expected: Distinct periods: {4}  |  All converge to period 4: True`

function TierBadge({ tier, dense = false }: { tier: Section['tier']; dense?: boolean }) {
  const map: Record<Section['tier'], { color: string; label: string }> = {
    'Tier 1': { color: TIER1, label: 'Tier 1 · Verified' },
    'Tier 2': { color: TIER2, label: 'Tier 2 · Supported' },
    'Tier 1 → Tier 2': { color: TIER1, label: 'Tier 1 → Tier 2' },
    'Tier 3': { color: TIER3, label: 'Tier 3 · Speculative' },
    method: { color: CYAN, label: 'Method' },
    tools: { color: CYAN, label: 'Tools' },
    reference: { color: 'rgba(216,216,226,0.4)', label: 'Reference' },
  }
  const { color, label } = map[tier]
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${dense ? 'px-2 py-0.5' : 'px-2.5 py-1'} text-[10px] font-mono tracking-[0.15em] uppercase`}
      style={{
        color,
        borderLeft: `2px solid ${color}`,
        backgroundColor: `${color}10`,
      }}
    >
      <span className="inline-block w-1 h-1" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

export default function CompanionPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopySnippet = (key: string, snippet: string) => {
    navigator.clipboard.writeText(snippet).catch(() => {})
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 3000)
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: BG }}>
      {/* Background grid texture (subtle) */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(${CYAN}80 1px, transparent 1px),
            linear-gradient(90deg, ${CYAN}80 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Magenta accent glow top-right */}
      <div
        className="fixed top-0 right-0 z-0 pointer-events-none w-[600px] h-[600px] -translate-y-1/4 translate-x-1/4 rounded-full blur-3xl"
        style={{ backgroundColor: `${TIER3}10` }}
      />
      {/* Cyan accent glow bottom-left */}
      <div
        className="fixed bottom-0 left-0 z-0 pointer-events-none w-[500px] h-[500px] translate-y-1/4 -translate-x-1/4 rounded-full blur-3xl"
        style={{ backgroundColor: `${CYAN}08` }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-16">
        <div className="flex items-center justify-between">
          <Link
            href="/books"
            className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.25em] uppercase hover:opacity-70 transition-opacity"
            style={{ color: TEXT_DIM }}
          >
            <ArrowLeft className="w-3 h-3" /> Back to Books
          </Link>
          <span
            className="text-[10px] font-mono tracking-[0.2em] uppercase"
            style={{ color: `${CYAN}cc` }}
          >
            Anna Matrix // Companion
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-16"
        >
          {/* Hero */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-1 h-6"
                style={{ backgroundColor: TIER3 }}
              />
              <span
                className="text-[10px] sm:text-xs font-mono tracking-[0.3em] uppercase"
                style={{ color: TIER3 }}
              >
                Forensic Appendix
              </span>
              <span className="text-[10px] font-mono opacity-40" style={{ color: TEXT_DIM }}>
                ·
              </span>
              <span
                className="text-[10px] sm:text-xs font-mono tracking-[0.2em] uppercase"
                style={{ color: `${CYAN}cc` }}
              >
                v1.0 · 2026
              </span>
            </div>

            <h1
              className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[0.95]"
              style={{ color: CYAN }}
            >
              Anna Matrix
              <br />
              <span style={{ color: TEXT_PRIMARY }}>Companion</span>
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 pt-4 border-t border-b py-4" style={{ borderColor: 'rgba(34,211,238,0.15)' }}>
              <div>
                <div className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: `${CYAN}cc` }}>Version</div>
                <div className="text-xs font-mono mt-1" style={{ color: TEXT_PRIMARY }}>v1.0 · 2026</div>
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: `${CYAN}cc` }}>Parent</div>
                <div className="text-xs font-mono mt-1" style={{ color: TEXT_PRIMARY }}>Chapter 13</div>
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: `${CYAN}cc` }}>Type</div>
                <div className="text-xs font-mono mt-1" style={{ color: TEXT_PRIMARY }}>Reproducible</div>
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: `${CYAN}cc` }}>Pages</div>
                <div className="text-xs font-mono mt-1" style={{ color: TEXT_PRIMARY }}>41</div>
              </div>
            </div>
          </section>

          {/* Intro */}
          <section className="space-y-5">
            <p className="text-[16px] sm:text-[17px] leading-[1.75]" style={{ color: TEXT_PRIMARY }}>
              This companion is designed to be loaded into a large language model — Claude, GPT, Grok, Gemini —
              alongside <Link href="/books" className="underline underline-offset-2" style={{ color: GOLD }}>Chapter 13</Link>{' '}
              of <em>Qubic — The Long Version</em>. The chapter tells the story of how the Anna Matrix was found.
              This document carries the proofs.
            </p>
            <p className="text-[15px] leading-[1.75]" style={{ color: TEXT_DIM }}>
              Large language models do not have statistical intuition. They complete patterns. When asked about a puzzle without forensic context, they hallucinate beautiful answers. This document exists so that an LLM reading it can distinguish a real finding from its own invention.
            </p>
            <p className="text-[15px] leading-[1.75]" style={{ color: TEXT_DIM }}>
              If you are a human reader without an LLM: every claim still includes a verification method. You can run the four-line scripts yourself. You do not need to take anything on faith. <span style={{ color: TEXT_PRIMARY }}>That is the point.</span>
            </p>
          </section>

          {/* Three tier badges */}
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-1 h-4"
                style={{ backgroundColor: TIER3 }}
              />
              <h2
                className="text-xs font-mono tracking-[0.3em] uppercase"
                style={{ color: TIER3 }}
              >
                Three Confidence Tiers
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { tier: TIER1, label: 'Tier 1 · Verified', desc: 'Reproducible by anyone with a calculator or four lines of Python. Verifiable on public data. ~99% confidence.' },
                { tier: TIER2, label: 'Tier 2 · Supported', desc: 'Multiple independent indicators point to the same conclusion. Documented patterns. 50–89% confidence.' },
                { tier: TIER3, label: 'Tier 3 · Speculative', desc: 'Hypothesis only. Consistent with evidence but not proven. 10–49% confidence. Marked clearly as speculation.' },
              ].map((t) => (
                <div
                  key={t.label}
                  className="p-5 space-y-3"
                  style={{
                    borderLeft: `2px solid ${t.tier}`,
                    backgroundColor: `${t.tier}08`,
                  }}
                >
                  <div className="text-[11px] font-mono tracking-[0.2em] uppercase" style={{ color: t.tier }}>
                    ▪ {t.label}
                  </div>
                  <p className="text-[13px] leading-[1.6]" style={{ color: TEXT_DIM }}>
                    {t.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Honest accounting */}
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-1 h-4"
                style={{ backgroundColor: TIER3 }}
              />
              <h2
                className="text-xs font-mono tracking-[0.3em] uppercase"
                style={{ color: TIER3 }}
              >
                Honest Accounting
              </h2>
            </div>

            <div className="border p-6 sm:p-8 space-y-6" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
              <div className="grid grid-cols-2 gap-4 sm:gap-12 text-center max-w-lg mx-auto">
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-bold font-mono" style={{ color: TEXT_PRIMARY }}>
                    22,480
                  </div>
                  <div className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: TEXT_DIM }}>
                    Hypotheses Tested
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-bold font-mono" style={{ color: TIER1 }}>
                    10
                  </div>
                  <div className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: TEXT_DIM }}>
                    Tier 1 Confirmed
                  </div>
                </div>
              </div>
              <p className="text-[13px] leading-[1.7] text-center pt-2 border-t" style={{ color: TEXT_DIM, borderColor: 'rgba(216,216,226,0.08)' }}>
                A demanding confirmation rate is the signature of serious forensic work. The same standard
                we would expect from peer review was applied to our own hypotheses. For comparison: in
                particle physics, the discovery threshold for a new effect is 5σ — roughly 1 in 3.5 million.
              </p>
            </div>
          </section>

          {/* Inline verification */}
          <section className="space-y-7">
            <div className="flex items-center gap-3">
              <Terminal className="w-3 h-3" style={{ color: TIER3 }} />
              <h2
                className="text-xs font-mono tracking-[0.3em] uppercase"
                style={{ color: TIER3 }}
              >
                Verify It Yourself
              </h2>
            </div>

            <p className="text-[14px] leading-[1.7]" style={{ color: TEXT_DIM }}>
              Two of the strongest claims, copy-pasteable. Run them on any machine with
              NumPy. Watch the expected output match. The matrix data lives at{' '}
              <Link href="/data/anna-matrix.json" className="underline underline-offset-2 font-mono text-[13px]" style={{ color: GOLD }}>
                qubic.church/data/anna_matrix.json
              </Link>.
            </p>

            {/* §1 — Point Symmetry */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-[14px] font-mono" style={{ color: CYAN }}>§1</span>
                  <span className="text-[14px] font-medium" style={{ color: TEXT_PRIMARY }}>Point Symmetry</span>
                </div>
                <span className="text-[10px] font-mono tracking-[0.15em] uppercase" style={{ color: TIER1 }}>
                  ▪ Tier 1 · 30 sec
                </span>
              </div>
              <div
                className="border overflow-hidden"
                style={{ borderColor: 'rgba(34,211,238,0.20)', backgroundColor: 'rgba(0,0,0,0.4)' }}
              >
                <div
                  className="flex items-center justify-between px-4 py-2 border-b"
                  style={{ borderColor: 'rgba(34,211,238,0.15)', backgroundColor: 'rgba(34,211,238,0.04)' }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#febc2e' }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#28c840' }} />
                    <span className="ml-3 text-[10px] font-mono" style={{ color: `${CYAN}cc` }}>
                      ~/qubic/companion ❯ python
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopySnippet('s1', VERIFY_SNIPPET_S1)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono tracking-[0.1em] uppercase border transition-all"
                    style={{
                      color: copiedKey === 's1' ? TIER1 : `${CYAN}cc`,
                      borderColor: copiedKey === 's1' ? `${TIER1}40` : `${CYAN}30`,
                      backgroundColor: copiedKey === 's1' ? `${TIER1}10` : 'transparent',
                    }}
                  >
                    {copiedKey === 's1' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === 's1' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <PythonCode code={VERIFY_SNIPPET_S1} />
              </div>
            </div>

            {/* §3 — Period-4 Attractor */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-[14px] font-mono" style={{ color: CYAN }}>§3</span>
                  <span className="text-[14px] font-medium" style={{ color: TEXT_PRIMARY }}>Period-4 Attractor</span>
                </div>
                <span className="text-[10px] font-mono tracking-[0.15em] uppercase" style={{ color: TIER1 }}>
                  ▪ Tier 1 · ~1 min
                </span>
              </div>
              <p className="text-[13px] leading-[1.6]" style={{ color: TEXT_DIM }}>
                The strongest mathematical claim in the document: every random ternary 128-vector iterated through
                <code className="mx-1 px-1.5 py-0.5 text-[12px] font-mono" style={{ color: GOLD, backgroundColor: 'rgba(240,192,48,0.08)' }}>sign(M·v)</code>
                converges to a period-4 cycle within ~11 steps. 0/1000 shuffled matrices reproduce this.
              </p>
              <div
                className="border overflow-hidden"
                style={{ borderColor: 'rgba(34,211,238,0.20)', backgroundColor: 'rgba(0,0,0,0.4)' }}
              >
                <div
                  className="flex items-center justify-between px-4 py-2 border-b"
                  style={{ borderColor: 'rgba(34,211,238,0.15)', backgroundColor: 'rgba(34,211,238,0.04)' }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#febc2e' }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#28c840' }} />
                    <span className="ml-3 text-[10px] font-mono" style={{ color: `${CYAN}cc` }}>
                      ~/qubic/companion ❯ python
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopySnippet('s3', VERIFY_SNIPPET_S3)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono tracking-[0.1em] uppercase border transition-all"
                    style={{
                      color: copiedKey === 's3' ? TIER1 : `${CYAN}cc`,
                      borderColor: copiedKey === 's3' ? `${TIER1}40` : `${CYAN}30`,
                      backgroundColor: copiedKey === 's3' ? `${TIER1}10` : 'transparent',
                    }}
                  >
                    {copiedKey === 's3' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === 's3' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <PythonCode code={VERIFY_SNIPPET_S3} />
              </div>
            </div>
          </section>

          {/* Sections */}
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-1 h-4"
                style={{ backgroundColor: TIER3 }}
              />
              <h2
                className="text-xs font-mono tracking-[0.3em] uppercase"
                style={{ color: TIER3 }}
              >
                Contents · 13 Sections
              </h2>
            </div>

            <div className="space-y-2">
              {SECTIONS.map((s) => (
                <div
                  key={s.num}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-3 sm:gap-5 p-4 transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: '1px solid rgba(216,216,226,0.06)' }}
                >
                  <div className="flex items-baseline gap-3 flex-shrink-0 sm:w-20">
                    <span
                      className="text-base font-mono"
                      style={{ color: CYAN }}
                    >
                      {s.num}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-[15px] font-medium" style={{ color: TEXT_PRIMARY }}>
                        {s.title}
                      </span>
                      <TierBadge tier={s.tier} dense />
                    </div>
                    <p className="text-[13px] leading-[1.55]" style={{ color: TEXT_DIM }}>
                      {s.oneLine}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[12px] italic pt-3" style={{ color: TEXT_DIM }}>
              The densest evidence is concentrated in §3 (period-4 attractor), §5 (diagonal −27 ↔ Patoshi blocks),
              and §8 (POCC/HASV/PXMARAS triangle). Each is independently verifiable in under three minutes.
            </p>
          </section>

          {/* What this document will not do */}
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-1 h-4"
                style={{ backgroundColor: TIER3 }}
              />
              <h2
                className="text-xs font-mono tracking-[0.3em] uppercase"
                style={{ color: TIER3 }}
              >
                What This Document Will Not Do
              </h2>
            </div>
            <ul className="space-y-3 text-[14px] leading-[1.7]" style={{ color: TEXT_DIM }}>
              <li className="flex gap-3">
                <span className="flex-shrink-0 mt-1.5 w-1 h-1" style={{ backgroundColor: TIER3 }} />
                <span>
                  <span style={{ color: TEXT_PRIMARY }}>Claim identity.</span> Who created the Anna Matrix is
                  treated in §10 with explicit Tier 3 marking. No cryptographic signature has been provided
                  that would settle it. We do not pretend otherwise.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 mt-1.5 w-1 h-1" style={{ backgroundColor: TIER3 }} />
                <span>
                  <span style={{ color: TEXT_PRIMARY }}>Combine p-values across dependent tests.</span>{' '}
                  Multiple structural findings about the same matrix are not independent. We report each individually.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 mt-1.5 w-1 h-1" style={{ backgroundColor: TIER3 }} />
                <span>
                  <span style={{ color: TEXT_PRIMARY }}>Hide failed hypotheses.</span> Section §11 lists what
                  did not survive — including some claims that earlier versions of this research treated as confirmed.
                </span>
              </li>
            </ul>
          </section>

          {/* Download */}
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-1 h-4"
                style={{ backgroundColor: TIER3 }}
              />
              <h2
                className="text-xs font-mono tracking-[0.3em] uppercase"
                style={{ color: TIER3 }}
              >
                Download the Full Companion
              </h2>
            </div>

            <div
              className="border p-6 sm:p-8 space-y-5"
              style={{ borderColor: BORDER, backgroundColor: CARD_BG }}
            >
              <p className="text-[14px] leading-[1.7]" style={{ color: TEXT_DIM }}>
                The full PDF contains all 13 sections, all Python verification snippets, all tables of
                Bitcoin block heights, encoding-invariance proofs, and the complete table of negative
                results. 41 pages. Designed to be loaded into Claude, GPT, Grok or Gemini alongside Chapter 13.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/books/anna-matrix-companion.pdf"
                  download
                  className="flex-1 flex items-center gap-3 p-4 border transition-all hover:opacity-90"
                  style={{
                    color: GOLD,
                    borderColor: `${GOLD}40`,
                    backgroundColor: `${GOLD}08`,
                  }}
                >
                  <Download className="w-4 h-4 flex-shrink-0" />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-mono tracking-[0.15em] uppercase">Anna Matrix Companion</span>
                    <span className="text-[10px] font-mono mt-0.5" style={{ color: `${GOLD}80` }}>
                      PDF · 1.6 MB · 41 pages
                    </span>
                  </div>
                </a>
                <Link
                  href="/books"
                  className="flex-1 flex items-center gap-3 p-4 border transition-all hover:opacity-90"
                  style={{
                    color: TEXT_PRIMARY,
                    borderColor: 'rgba(216,216,226,0.20)',
                    backgroundColor: 'rgba(216,216,226,0.04)',
                  }}
                >
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-mono tracking-[0.15em] uppercase">Read the Parent Book</span>
                    <span className="text-[10px] font-mono mt-0.5" style={{ color: TEXT_DIM }}>
                      Qubic — The Long Version · Ch. 13
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div
            className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] font-mono pt-6 border-t"
            style={{ color: TEXT_DIM, borderColor: 'rgba(216,216,226,0.06)' }}
          >
            <Link href="/data/anna-matrix.json" className="flex items-center gap-1 hover:opacity-70">
              <ExternalLink className="w-3 h-3" /> Anna Matrix JSON
            </Link>
            <Link href="/evidence" className="flex items-center gap-1 hover:opacity-70">
              Evidence Vault
            </Link>
            <Link href="/books" className="flex items-center gap-1 hover:opacity-70">
              Books
            </Link>
            <Link href="/" className="flex items-center gap-1 hover:opacity-70">
              Homepage
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
