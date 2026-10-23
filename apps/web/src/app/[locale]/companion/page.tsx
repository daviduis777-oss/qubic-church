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

const GOLD = 'var(--accent-gold)'
const BG = 'var(--background)'
const TEXT_PRIMARY = 'var(--foreground)'
const TEXT_DIM = 'var(--fg-2)'
const BORDER = 'var(--border)'
const CARD_BG = 'var(--card)'

const TIER1 = '#10B981'
const TIER2 = '#fbbf24'
const TIER3 = '#ec4899'
const CYAN = '#22d3ee'

type Section = {
  num: string
  title: string
  tier:
    | 'Tier 1'
    | 'Tier 3'
    | 'hypothesis'
    | 'withdrawn'
    | 'method'
    | 'tools'
    | 'reference'
  oneLine: string
}

const SECTIONS: Section[] = [
  {
    num: '§1',
    title: 'Point Symmetry of the Matrix',
    tier: 'Tier 1',
    oneLine:
      '99.58% of all 16,384 cells satisfy M[i][j] + M[127−i][127−j] = −1.',
  },
  {
    num: '§2',
    title: 'Statistical Framework',
    tier: 'method',
    oneLine:
      'Bonferroni correction across ~22,480 tests; Monte Carlo null tests; what we deliberately do not do.',
  },
  {
    num: '§3',
    title: 'Period-4 Attractor',
    tier: 'hypothesis',
    oneLine:
      'Iterating sign(M·v) reached a period-4 cycle on the 768 sampled inputs that were verified. Global convergence is unproven, and there are at least two cycles.',
  },
  {
    num: '§4',
    title: 'Seven-Position Asymmetry',
    tier: 'withdrawn',
    oneLine:
      'Antipodal identity holds for 121 of 128 cycle positions; breaks at exactly [3, 18, 32, 61, 65, 101, 109]. Invariant across five independent encodings of the Genesis Block public key.',
  },
  {
    num: '§5',
    title: 'Diagonal −27 Cells and Patoshi Blocks',
    tier: 'withdrawn',
    oneLine:
      '10 main-diagonal cells with |value| = 27 at heights [72, 73, 74, 79, 88, 92, 94, 95, 119, 120]; the claim was that every one is a Patoshi-mined Bitcoin block from January 2009 with 50 BTC reward, never spent.',
  },
  {
    num: '§6',
    title: 'Genesis Block Read as Bitcoin Script',
    tier: 'withdrawn',
    oneLine:
      'Genesis 65-byte public key parses as four valid Script opcodes including PUSHBYTES_72 (0x48 = 72). M[72][72] = −27.',
  },
  {
    num: '§7',
    title: 'Embedded Messages: what survives, what does not',
    tier: 'withdrawn',
    oneLine:
      '"CFB" appears at row 11 in the XOR-127 stream (Population B of attractor, mirror at row 116 preserved). GAME, MEGA, KEY, SATOSHI, YOU, ARE, ALL: all debunked.',
  },
  {
    num: '§8',
    title: 'POCC / HASV / PXMARAS: On-Chain Triangle',
    tier: 'withdrawn',
    oneLine:
      'Three Qubic addresses issued tokens with supplies 676×10⁹, 676, 1. HASV→PXMARAS sent 26 QU exactly 27 times. AIGARTH issued 6,268 days after Bitcoin Genesis. All on-chain.',
  },
  {
    num: '§9',
    title: '1CFB and 1CFi: Byte-Level Anchors',
    tier: 'withdrawn',
    oneLine:
      'Vanity-address byte alignments to the matrix and to PUSHBYTES_72.',
  },
  {
    num: '§10',
    title: 'The Identity Question',
    tier: 'Tier 3',
    oneLine:
      'Who created the matrix is treated as Tier 3 with explicit marking. No cryptographic signature settles it. We do not pretend otherwise.',
  },
  {
    num: '§11',
    title: 'Negative Results',
    tier: 'method',
    oneLine:
      'What the re-check did not confirm, including some claims earlier versions of this research treated as confirmed.',
  },
  {
    num: '§12',
    title: 'Reproducibility Checklist',
    tier: 'tools',
    oneLine:
      'Python snippets, longer scripts at /docs/05-appendices/03-scripts, Monte Carlo runs in 2-5 minutes on a laptop.',
  },
  {
    num: '§13',
    title: 'Glossary and References',
    tier: 'reference',
    oneLine:
      'Patoshi (Lerner 2013), CfB, sign() ternary clamp, M[i][j] notation.',
  },
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

const TIER_BADGES: Record<Section['tier'], { color: string; label: string }> = {
  'Tier 1': { color: TIER1, label: 'Tier 1 · Verified' },
  'Tier 3': { color: TIER3, label: 'Tier 3 · Speculative' },
  hypothesis: { color: TIER2, label: 'Hypothesis' },
  withdrawn: { color: 'var(--muted-foreground)', label: 'Open · re-checked Sept 2026' },
  method: { color: CYAN, label: 'Method' },
  tools: { color: CYAN, label: 'Tools' },
  reference: { color: 'var(--muted-foreground)', label: 'Reference' },
}

function TierBadge({
  tier,
  dense = false,
}: {
  tier: Section['tier']
  dense?: boolean
}) {
  const { color, label } = TIER_BADGES[tier]
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${dense ? 'px-2 py-0.5' : 'px-2.5 py-1'} text-xs font-mono tracking-widest uppercase`}
      style={{
        color,
        borderLeft: `2px solid ${color}`,
        backgroundColor: `${color}10`,
      }}
    >
      <span
        className="inline-block w-1 h-1"
        style={{ backgroundColor: color }}
      />
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
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-16">
        <div className="flex items-center justify-between">
          <Link
            className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase hover:opacity-70 transition-opacity"
            href="/books"
            style={{ color: TEXT_DIM }}
          >
            <ArrowLeft className="w-3 h-3" /> Back to Books
          </Link>
          <span
            className="text-xs font-mono tracking-widest uppercase"
            style={{ color: `${CYAN}cc` }}
          >
            Anna Matrix companion
          </span>
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="space-y-16"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          {/* Hero */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-1 h-6"
                style={{ backgroundColor: TIER3 }}
              />
              <span
                className="text-xs sm:text-xs font-mono tracking-widest uppercase"
                style={{ color: TIER3 }}
              >
                Forensic Appendix
              </span>
              <span
                className="text-xs font-mono opacity-40"
                style={{ color: TEXT_DIM }}
              >
                ·
              </span>
              <span
                className="text-xs sm:text-xs font-mono tracking-widest uppercase"
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

            <p
              className="rounded-md border border-border bg-muted px-4 py-3 text-sm leading-relaxed text-foreground"
              role="note"
            >
              <strong>Re-check, September 2026.</strong> The matrix is a table
              our team compiled by hand from replies of the Anna bot on X. This
              notice covers every section of the companion and the PDF. Only the
              point symmetry (§1) holds as stated. The period-4 result (§3) is a
              hypothesis: only 768 sampled inputs were verified and global
              convergence is unproven. The seven-position asymmetry (§4) depends
              on a run of cells in column 30 that is very likely an entry error
              in the typed table, and the Genesis block script reading (§6) was
              not confirmed. The diagonal and Patoshi reading (§5), the embedded
              messages (§7), the on-chain triangle (§8) and the 1CFB anchors (§9)
              were not confirmed and stay open. The Tier labels in the PDF are
              out of date. No bridge or activation was found. See{' '}
              <Link
                className="underline"
                href="/docs/03-results/35-corrections-september-2026"
              >
                the September 2026 re-check
              </Link>
              .
            </p>

            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 pt-4 border-t border-b py-4"
              style={{ borderColor: 'rgba(34,211,238,0.15)' }}
            >
              <div>
                <div
                  className="text-xs font-mono tracking-widest uppercase"
                  style={{ color: `${CYAN}cc` }}
                >
                  Version
                </div>
                <div
                  className="text-xs font-mono mt-1"
                  style={{ color: TEXT_PRIMARY }}
                >
                  v1.0 · 2026
                </div>
              </div>
              <div>
                <div
                  className="text-xs font-mono tracking-widest uppercase"
                  style={{ color: `${CYAN}cc` }}
                >
                  Parent
                </div>
                <div
                  className="text-xs font-mono mt-1"
                  style={{ color: TEXT_PRIMARY }}
                >
                  Chapter 13
                </div>
              </div>
              <div>
                <div
                  className="text-xs font-mono tracking-widest uppercase"
                  style={{ color: `${CYAN}cc` }}
                >
                  Type
                </div>
                <div
                  className="text-xs font-mono mt-1"
                  style={{ color: TEXT_PRIMARY }}
                >
                  Reproducible
                </div>
              </div>
              <div>
                <div
                  className="text-xs font-mono tracking-widest uppercase"
                  style={{ color: `${CYAN}cc` }}
                >
                  Pages
                </div>
                <div
                  className="text-xs font-mono mt-1"
                  style={{ color: TEXT_PRIMARY }}
                >
                  41
                </div>
              </div>
            </div>
          </section>

          {/* Intro */}
          <section className="space-y-5">
            <p
              className="text-base sm:text-lg leading-relaxed"
              style={{ color: TEXT_PRIMARY }}
            >
              This companion is designed to be loaded into a large language
              model, Claude, GPT, Grok, Gemini, alongside{' '}
              <Link
                className="underline underline-offset-2"
                href="/books"
                style={{ color: GOLD }}
              >
                Chapter 13
              </Link>{' '}
              of <em>Qubic, The Long Version</em>. The chapter tells the story
              of how the Anna Matrix was found. This document carries the
              arguments. Several of them were not confirmed in September 2026
              and stay open (see the notice above).
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: TEXT_DIM }}
            >
              Large language models do not have statistical intuition. They
              complete patterns. When asked about a puzzle without forensic
              context, they hallucinate beautiful answers. This document exists
              so that an LLM reading it can distinguish a real finding from its
              own invention.
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: TEXT_DIM }}
            >
              If you are a human reader without an LLM: every claim still
              includes a verification method. You can run the four-line scripts
              yourself. You do not need to take anything on faith.{' '}
              <span style={{ color: TEXT_PRIMARY }}>That is the point.</span>
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
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: TIER3 }}
              >
                Three Confidence Tiers
              </h2>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: TEXT_DIM }}>
              These are the labels the PDF uses. They are out of date: most
              sections the PDF marks as Tier 1 were not confirmed in September
              2026 and stay open.
              The badges in the contents list below show the current status.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  tier: TIER1,
                  label: 'Tier 1 · Verified',
                  desc: 'Reproducible by anyone with a calculator or four lines of Python. Verifiable on public data. ~99% confidence.',
                },
                {
                  tier: TIER2,
                  label: 'Tier 2 · Supported',
                  desc: 'Multiple independent indicators point to the same conclusion. Documented patterns. 50–89% confidence.',
                },
                {
                  tier: TIER3,
                  label: 'Tier 3 · Speculative',
                  desc: 'Hypothesis only. Consistent with evidence but not proven. 10–49% confidence. Marked clearly as speculation.',
                },
              ].map(t => (
                <div
                  className="p-5 space-y-3"
                  key={t.label}
                  style={{
                    borderLeft: `2px solid ${t.tier}`,
                    backgroundColor: `${t.tier}08`,
                  }}
                >
                  <div
                    className="text-xs font-mono tracking-widest uppercase"
                    style={{ color: t.tier }}
                  >
                    ▪ {t.label}
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: TEXT_DIM }}
                  >
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
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: TIER3 }}
              >
                Honest Accounting
              </h2>
            </div>

            <div
              className="border p-6 sm:p-8 space-y-6"
              style={{ borderColor: BORDER, backgroundColor: CARD_BG }}
            >
              <div className="grid grid-cols-2 gap-4 sm:gap-12 text-center max-w-lg mx-auto">
                <div className="space-y-1">
                  <div
                    className="text-3xl sm:text-4xl font-bold font-mono"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    6
                  </div>
                  <div
                    className="text-xs font-mono tracking-widest uppercase"
                    style={{ color: TEXT_DIM }}
                  >
                    Sections open
                  </div>
                </div>
                <div className="space-y-1">
                  <div
                    className="text-3xl sm:text-4xl font-bold font-mono"
                    style={{ color: TIER1 }}
                  >
                    1
                  </div>
                  <div
                    className="text-xs font-mono tracking-widest uppercase"
                    style={{ color: TEXT_DIM }}
                  >
                    Section holds as stated
                  </div>
                </div>
              </div>
              <p
                className="text-sm leading-relaxed text-center pt-2 border-t"
                style={{
                  color: TEXT_DIM,
                  borderColor: 'rgba(216,216,226,0.08)',
                }}
              >
                The PDF reports 22,480 hypotheses tested and 10 confirmed at
                Tier 1. An independent review in September 2026 did not uphold
                those labels: only the point symmetry (§1) holds as stated, the
                period-4 result (§3) is a hypothesis, and §4 to §9 were not
                confirmed and stay open.
              </p>
            </div>
          </section>

          {/* Inline verification */}
          <section className="space-y-7">
            <div className="flex items-center gap-3">
              <Terminal className="w-3 h-3" style={{ color: TIER3 }} />
              <h2
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: TIER3 }}
              >
                Verify It Yourself
              </h2>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: TEXT_DIM }}>
              Two claims you can run yourself on any machine with NumPy. The
              first holds as stated; the second only covers the inputs you
              sample. The matrix data lives at{' '}
              <Link
                className="underline underline-offset-2 font-mono text-sm"
                href="/data/anna-matrix.json"
                style={{ color: GOLD }}
              >
                qubic.church/data/anna_matrix.json
              </Link>
              .
            </p>

            {/* §1, Point Symmetry */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-mono" style={{ color: CYAN }}>
                    §1
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    Point Symmetry
                  </span>
                </div>
                <span
                  className="text-xs font-mono tracking-widest uppercase"
                  style={{ color: TIER1 }}
                >
                  ▪ Tier 1 · 30 sec
                </span>
              </div>
              <div
                className="border overflow-hidden"
                style={{
                  borderColor: 'rgba(34,211,238,0.20)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-2 border-b"
                  style={{
                    borderColor: 'rgba(34,211,238,0.15)',
                    backgroundColor: 'rgba(34,211,238,0.04)',
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: '#ff5f57' }}
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: '#febc2e' }}
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: '#28c840' }}
                    />
                    <span
                      className="ml-3 text-xs font-mono"
                      style={{ color: `${CYAN}cc` }}
                    >
                      ~/qubic/companion ❯ python
                    </span>
                  </div>
                  <button
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono tracking-widest uppercase border transition-all"
                    onClick={() => handleCopySnippet('s1', VERIFY_SNIPPET_S1)}
                    style={{
                      color: copiedKey === 's1' ? TIER1 : `${CYAN}cc`,
                      borderColor:
                        copiedKey === 's1' ? `${TIER1}40` : `${CYAN}30`,
                      backgroundColor:
                        copiedKey === 's1' ? `${TIER1}10` : 'transparent',
                    }}
                    type="button"
                  >
                    {copiedKey === 's1' ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    {copiedKey === 's1' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <PythonCode code={VERIFY_SNIPPET_S1} />
              </div>
            </div>

            {/* §3, Period-4 Attractor */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-mono" style={{ color: CYAN }}>
                    §3
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    Period-4 Attractor
                  </span>
                </div>
                <span
                  className="text-xs font-mono tracking-widest uppercase"
                  style={{ color: TIER1 }}
                >
                  ▪ Hypothesis · ~1 min
                </span>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: TEXT_DIM }}
              >
                Iterating
                <code
                  className="mx-1 px-1.5 py-0.5 text-xs font-mono"
                  style={{
                    color: GOLD,
                    backgroundColor: 'rgba(240,192,48,0.08)',
                  }}
                >
                  sign(M·v)
                </code>
                reached a period-4 cycle on the 768 sampled inputs that were
                verified. That does not prove every input converges, and some
                inputs need 22 steps.
              </p>
              <div
                className="border overflow-hidden"
                style={{
                  borderColor: 'rgba(34,211,238,0.20)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-2 border-b"
                  style={{
                    borderColor: 'rgba(34,211,238,0.15)',
                    backgroundColor: 'rgba(34,211,238,0.04)',
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: '#ff5f57' }}
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: '#febc2e' }}
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: '#28c840' }}
                    />
                    <span
                      className="ml-3 text-xs font-mono"
                      style={{ color: `${CYAN}cc` }}
                    >
                      ~/qubic/companion ❯ python
                    </span>
                  </div>
                  <button
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono tracking-widest uppercase border transition-all"
                    onClick={() => handleCopySnippet('s3', VERIFY_SNIPPET_S3)}
                    style={{
                      color: copiedKey === 's3' ? TIER1 : `${CYAN}cc`,
                      borderColor:
                        copiedKey === 's3' ? `${TIER1}40` : `${CYAN}30`,
                      backgroundColor:
                        copiedKey === 's3' ? `${TIER1}10` : 'transparent',
                    }}
                    type="button"
                  >
                    {copiedKey === 's3' ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
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
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: TIER3 }}
              >
                Contents · 13 Sections
              </h2>
            </div>

            <div className="space-y-2">
              {SECTIONS.map(s => (
                <div
                  className="flex flex-col sm:flex-row sm:items-baseline gap-3 sm:gap-5 p-4 transition-colors hover:bg-white/[0.02]"
                  key={s.num}
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
                      <span
                        className="text-base font-medium"
                        style={{ color: TEXT_PRIMARY }}
                      >
                        {s.title}
                      </span>
                      <TierBadge dense tier={s.tier} />
                    </div>
                    <p
                      className="text-sm leading-[1.55]"
                      style={{ color: TEXT_DIM }}
                    >
                      {s.oneLine}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs italic pt-3" style={{ color: TEXT_DIM }}>
              Only §1 holds as stated. §3 is a hypothesis, and §4 to §9 were
              not confirmed in September 2026 and stay open.
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
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: TIER3 }}
              >
                What This Document Will Not Do
              </h2>
            </div>
            <ul
              className="space-y-3 text-sm leading-relaxed"
              style={{ color: TEXT_DIM }}
            >
              <li className="flex gap-3">
                <span
                  className="flex-shrink-0 mt-1.5 w-1 h-1"
                  style={{ backgroundColor: TIER3 }}
                />
                <span>
                  <span style={{ color: TEXT_PRIMARY }}>Claim identity.</span>{' '}
                  Who created the Anna Matrix is treated in §10 with explicit
                  Tier 3 marking. No cryptographic signature has been provided
                  that would settle it. We do not pretend otherwise.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  className="flex-shrink-0 mt-1.5 w-1 h-1"
                  style={{ backgroundColor: TIER3 }}
                />
                <span>
                  <span style={{ color: TEXT_PRIMARY }}>
                    Combine p-values across dependent tests.
                  </span>{' '}
                  Multiple structural findings about the same matrix are not
                  independent. We report each individually.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  className="flex-shrink-0 mt-1.5 w-1 h-1"
                  style={{ backgroundColor: TIER3 }}
                />
                <span>
                  <span style={{ color: TEXT_PRIMARY }}>
                    Hide unconfirmed hypotheses.
                  </span>{' '}
                  Section §11 lists what the re-check did not confirm, including
                  some claims that earlier versions of this research treated as confirmed.
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
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: TIER3 }}
              >
                Download the Full Companion
              </h2>
            </div>

            <div
              className="border p-6 sm:p-8 space-y-5"
              style={{ borderColor: BORDER, backgroundColor: CARD_BG }}
            >
              <p
                className="text-sm leading-relaxed"
                style={{ color: TEXT_DIM }}
              >
                The full PDF contains all 13 sections, all Python verification
                snippets, all tables of Bitcoin block heights,
                encoding-invariance proofs, and the complete table of negative
                results. 41 pages. Designed to be loaded into Claude, GPT, Grok
                or Gemini alongside Chapter 13.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  className="flex-1 flex items-center gap-3 p-4 border transition-all hover:opacity-90"
                  download
                  href="/books/anna-matrix-companion.pdf"
                  style={{
                    color: GOLD,
                    borderColor: `color-mix(in oklab, ${GOLD} 25%, transparent)`,
                    backgroundColor: `color-mix(in oklab, ${GOLD} 3%, transparent)`,
                  }}
                >
                  <Download className="w-4 h-4 flex-shrink-0" />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-mono tracking-widest uppercase">
                      Anna Matrix Companion
                    </span>
                    <span
                      className="text-xs font-mono mt-0.5"
                      style={{ color: GOLD }}
                    >
                      PDF · 1.6 MB · 41 pages
                    </span>
                  </div>
                </a>
                <Link
                  className="flex-1 flex items-center gap-3 p-4 border transition-all hover:opacity-90"
                  href="/books"
                  style={{
                    color: TEXT_PRIMARY,
                    borderColor: 'rgba(216,216,226,0.20)',
                    backgroundColor: 'rgba(216,216,226,0.04)',
                  }}
                >
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-mono tracking-widest uppercase">
                      Read the Parent Book
                    </span>
                    <span
                      className="text-xs font-mono mt-0.5"
                      style={{ color: TEXT_DIM }}
                    >
                      Qubic, The Long Version · Ch. 13
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div
            className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-mono pt-6 border-t"
            style={{ color: TEXT_DIM, borderColor: 'rgba(216,216,226,0.06)' }}
          >
            <Link
              className="flex items-center gap-1 hover:opacity-70"
              href="/data/anna-matrix.json"
            >
              <ExternalLink className="w-3 h-3" /> Anna Matrix JSON
            </Link>
            <Link
              className="flex items-center gap-1 hover:opacity-70"
              href="/evidence"
            >
              Evidence Vault
            </Link>
            <Link
              className="flex items-center gap-1 hover:opacity-70"
              href="/books"
            >
              Books
            </Link>
            <Link className="flex items-center gap-1 hover:opacity-70" href="/">
              Homepage
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
