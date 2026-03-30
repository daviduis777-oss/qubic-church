'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Download, ExternalLink, Users, Zap, Shield, TrendingUp, AlertTriangle, Target, Brain, Radio, BarChart3, ChevronRight } from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*  DESIGN TOKENS — Cyan/Teal theme                                           */
/* -------------------------------------------------------------------------- */

const CYAN = '#00d9ff'
const CYAN_DIM = 'rgba(0, 217, 255, 0.35)'
const GOLD = '#f0c040'
const BG = '#0d0d14'
const CARD_BG = 'rgba(255, 255, 255, 0.10)'
const CARD_BG_LIGHT = 'rgba(255, 255, 255, 0.06)'
const TEXT_PRIMARY = '#d8d8e2'
const TEXT_DIM = 'rgba(216, 216, 226, 0.55)'
const BORDER = 'rgba(0, 217, 255, 0.20)'

/* -------------------------------------------------------------------------- */
/*  SIMULATION DATA                                                           */
/* -------------------------------------------------------------------------- */

const SCENARIOS = [
  {
    id: 'launch',
    label: 'Launch Day',
    date: 'April 1, 2026',
    title: 'DOGE Mining Launch Day',
    summary: 'Qubic officially launches Dogecoin mining. Community reaction is swift and multifaceted. DOGE miners actively engage, expressing both anticipation and concerns. Bitcoin maximalists adopt a critical stance. Media closely monitors hashrate data.',
    stakeholders: [
      { group: 'DOGE Miners', stance: 'positive', detail: 'See economic opportunity in uPOW architecture. Form the first pro-Qubic coalition.' },
      { group: 'Bitcoin Maximalists', stance: 'negative', detail: 'Argue DOGE undermines Bitcoin. Leverage 51% attack narrative from Monero incident.' },
      { group: 'Media', stance: 'neutral', detail: 'Focus on hashrate data as primary evaluation metric. Coverage shapes public perception.' },
      { group: 'Monero Community', stance: 'negative', detail: 'Hostile due to prior Monero hashrate incident. Allied with maximalists.' },
    ],
    keyInsight: 'The dominant narrative splits into two competing frames: "revolutionary uPOW architecture" vs "another altcoin threatening established chains." The first gains traction among miners and AI researchers; the second among maximalists.',
  },
  {
    id: 'paris',
    label: 'Paris BW',
    date: 'April 15-16, 2026',
    title: 'Paris Blockchain Week',
    summary: 'Qubic presents at Carrousel du Louvre to 10,000+ institutional participants. The exhibition showcases DOGE mining technical details and explores its impact on the crypto community. Alliance formation accelerates.',
    stakeholders: [
      { group: 'DOGE Miners', stance: 'positive', detail: 'Visible enthusiasm signals strong grassroots support at the event.' },
      { group: 'Institutional Audience', stance: 'neutral', detail: 'Cautiously curious about "decentralised AI funded by meme coin mining" narrative.' },
      { group: 'VCs & AI Researchers', stance: 'positive', detail: 'Technical depth of uPOW presentation converts several sceptics.' },
      { group: 'Bitcoin Maximalists', stance: 'negative', detail: 'Voice strong opposition. Debates intensify around security implications.' },
    ],
    keyInsight: 'The institutional audience responds cautiously but with genuine curiosity. The technical depth converts sceptics among VCs and AI researchers. "Decentralised AI funded by meme coin mining" sounds absurd at first — but convinces at technical depth.',
  },
  {
    id: 'hashrate',
    label: '30-Day Report',
    date: 'May 1, 2026',
    title: '30-Day Hashrate Report',
    summary: 'The first public hashrate statistics after one month of DOGE mining. This data point becomes the pivotal moment that determines the trajectory of the entire narrative.',
    stakeholders: [
      { group: 'DOGE Miners', stance: 'positive', detail: 'Hashrate of ~2.78 PH/s validates economic returns. Confidence grows.' },
      { group: 'AI Researchers', stance: 'positive', detail: 'Analyse uPOW as potential driver for decentralised AI development.' },
      { group: 'Crypto VCs', stance: 'positive', detail: 'Adjust investment strategies. Identify new opportunities in Qubic ecosystem.' },
      { group: 'Bitcoin Maximalists', stance: 'negative', detail: 'Use hashrate data to criticise security model. 51% attack FUD continues.' },
    ],
    keyInsight: 'THE TURNING POINT. In the optimistic scenario (5% DOGE hashrate, $500K/week buyback), the narrative shifts decisively toward "revolutionary infrastructure." In the pessimistic scenario (<1%), maximalist criticism gains ground. Everything depends on this number.',
  },
  {
    id: 'aigarth',
    label: 'Aigarth 2027',
    date: 'April 2027',
    title: 'Aigarth Horizon',
    summary: 'By 2027, the sustained impact of DOGE mining produces new trends. Those who understand the architecture recognise its significance; those who don\'t dismiss it as vaporware. The community no longer debates whether Qubic matters — but how much.',
    stakeholders: [
      { group: 'AI Researchers', stance: 'positive', detail: 'Deepen analysis of uPOW. See it as key driver for decentralised intelligence.' },
      { group: 'DOGE Miners', stance: 'positive', detail: 'Sustained returns validate the thesis. Economic model proven.' },
      { group: 'Institutional', stance: 'positive', detail: 'New alliances form. Resource reallocation across ecosystem.' },
      { group: 'Maximalists', stance: 'negative', detail: 'Opposition does not diminish. 51% narrative persists but loses dominance.' },
    ],
    keyInsight: 'The "decentralised AGI" thesis gains meaningful traction among AI researchers and institutional observers. The transition from LLM-based Maria Aigarth to the Aigarth network becomes the key narrative catalyst.',
  },
]

const KEY_FINDINGS = [
  { icon: Users, text: 'DOGE miners form a pro-Qubic coalition early', confidence: 'High' },
  { icon: Shield, text: '"51% attack" framing is the #1 attack vector', confidence: 'High' },
  { icon: Brain, text: 'AI researchers become strongest intellectual allies', confidence: 'Medium-High' },
  { icon: BarChart3, text: '30-day hashrate report is THE turning point', confidence: 'High' },
  { icon: TrendingUp, text: '"Decentralised AGI" gains traction by 2027', confidence: 'Medium' },
]

const ATTACK_VECTORS = [
  { rank: 1, threat: '"51% Attack" Narrative', severity: 'Critical', counter: 'CfB corrected to 34%. Proactive communication. Frame as "proof of capability, not intent."' },
  { rank: 2, threat: '"Altcoin attacking real chain" framing', severity: 'High', counter: 'Reframe as "coordinated compute infrastructure" — additive, not adversarial.' },
  { rank: 3, threat: 'Aigarth is unproven / vaporware', severity: 'Medium', counter: 'IEEE peer-reviewed Neuraxon 2.0. Open-source architecture. Anna Matrix live since Sept 2025.' },
  { rank: 4, threat: 'LLM dependency (Maria on Anthropic)', severity: 'Medium', counter: 'Explicitly acknowledged as temporary. April 2027 migration target. Transparent roadmap.' },
  { rank: 5, threat: 'Execution risk (3 launches in 1 week)', severity: 'Medium', counter: 'Phased rollout. Each system independently tested. QBridge IPO already closed.' },
]

const COALITIONS = [
  { group: 'DOGE Miners', alignment: 'pro', color: '#10B981' },
  { group: 'AI Researchers', alignment: 'pro', color: '#10B981' },
  { group: 'Crypto VCs', alignment: 'pro', color: '#10B981' },
  { group: 'Media / Journalists', alignment: 'neutral', color: '#F59E0B' },
  { group: 'Institutional', alignment: 'neutral', color: '#F59E0B' },
  { group: 'Altcoin Traders', alignment: 'neutral', color: '#F59E0B' },
  { group: 'Bitcoin Maximalists', alignment: 'anti', color: '#EF4444' },
  { group: 'Monero Community', alignment: 'anti', color: '#EF4444' },
]

/* -------------------------------------------------------------------------- */
/*  REAL SIMULATION DATA (from MiroFish run, March 30, 2026)                  */
/* -------------------------------------------------------------------------- */

const AGENT_ROSTER = [
  { name: 'CfB (Come-from-Beyond)', type: 'Person', actions: 71 },
  { name: 'David Vivancos', type: 'Person', actions: 28 },
  { name: 'Joetom', type: 'Person', actions: 31 },
  { name: 'Raika', type: 'Person', actions: 28 },
  { name: 'CoinDesk', type: 'CryptoMedia', actions: 65 },
  { name: 'Decrypt', type: 'CryptoMedia', actions: 60 },
  { name: 'The Block', type: 'CryptoMedia', actions: 47 },
  { name: 'MIT Tech Review', type: 'CryptoMedia', actions: 58 },
  { name: 'Wired', type: 'CryptoMedia', actions: 54 },
  { name: 'bitcoinist.com', type: 'CryptoMedia', actions: 58 },
  { name: 'Mining media', type: 'CryptoMedia', actions: 54 },
  { name: 'ML engineers', type: 'AIResearcher', actions: 22 },
  { name: 'Princeton researchers', type: 'AIResearcher', actions: 18 },
  { name: 'AI researchers', type: 'AIResearcher', actions: 20 },
  { name: 'Bitcoin maximalists', type: 'BitcoinMaximalist', actions: 28 },
  { name: 'Monero community', type: 'MoneroCommunity', actions: 15 },
  { name: 'Crypto VCs', type: 'CryptoVC', actions: 22 },
  { name: 'Oracle', type: 'Organization', actions: 12 },
  { name: 'OpenAI', type: 'Organization', actions: 18 },
]

const SAMPLE_POSTS = [
  { agent: 'MIT Tech Review', content: 'Qubic will launch Dogecoin mining on April 1, 2026! This revolutionary uPOW architecture will change the landscape of crypto mining.', platform: 'twitter', round: 0 },
  { agent: 'Bitcoin maximalists', content: 'While the Dogecoin community celebrates Qubic\'s mining launch, we must remember the risks of 51% attacks. History shows what happened with Monero.', platform: 'twitter', round: 2 },
  { agent: 'ML engineers', content: 'The upcoming launch of Dogecoin mining by Qubic presents an exciting opportunity for innovative decentralization in the crypto space.', platform: 'twitter', round: 5 },
  { agent: 'CfB', content: 'As we approach the DOGE mining launch, I want to clarify: our Monero operation demonstrated capability, not intent. The 34% figure was our actual hashrate.', platform: 'twitter', round: 12 },
  { agent: 'Crypto VCs', content: 'Qubic\'s Dogecoin launch could reshape how we view altcoins. The uPOW model creates real economic value — mining revenue drives buyback and burn.', platform: 'twitter', round: 20 },
  { agent: 'Monero community', content: 'We haven\'t forgotten August 2025. Qubic\'s coordinated hashrate caused a blockchain reorganization on our network. Why should DOGE trust them?', platform: 'reddit', round: 8 },
  { agent: 'Princeton researchers', content: 'Our recent paper on domain-specific superintelligence aligns with what Qubic has been building. Thousands of small specialists vs one giant model.', platform: 'twitter', round: 45 },
  { agent: 'CoinDesk', content: 'BREAKING: Qubic\'s DOGE mining Phase 1 goes live. First oracle-validated shares confirmed on-chain. Hashrate ramping.', platform: 'twitter', round: 60 },
  { agent: 'Bitcoin maximalists', content: 'Another altcoin trying to piggyback on a legitimate chain. DOGE doesn\'t need Qubic, and Qubic\'s "AI training" claims remain unverified.', platform: 'reddit', round: 30 },
  { agent: 'AI researchers', content: 'The separation of ASIC mining (DOGE) from CPU/GPU (AI training) is architecturally sound. Both workstreams at 100% capacity simultaneously.', platform: 'twitter', round: 80 },
]

const ACTIVITY_TIMELINE = [
  { round: 0, twitter: 14, reddit: 15 },
  { round: 10, twitter: 25, reddit: 60 },
  { round: 20, twitter: 0, reddit: 51 },
  { round: 30, twitter: 22, reddit: 40 },
  { round: 40, twitter: 8, reddit: 77 },
  { round: 50, twitter: 2, reddit: 18 },
  { round: 60, twitter: 12, reddit: 76 },
  { round: 70, twitter: 0, reddit: 29 },
  { round: 80, twitter: 5, reddit: 46 },
  { round: 90, twitter: 0, reddit: 48 },
  { round: 100, twitter: 1, reddit: 23 },
  { round: 110, twitter: 1, reddit: 19 },
  { round: 120, twitter: 0, reddit: 0 },
  { round: 130, twitter: 0, reddit: 0 },
  { round: 140, twitter: 0, reddit: 0 },
  { round: 150, twitter: 1, reddit: 0 },
  { round: 160, twitter: 2, reddit: 0 },
]

const TYPE_COLORS: Record<string, string> = {
  Person: '#f0c040',
  CryptoMedia: '#00d9ff',
  AIResearcher: '#8b7ff5',
  BitcoinMaximalist: '#ef4444',
  MoneroCommunity: '#ef4444',
  CryptoVC: '#10b981',
  Organization: '#6b7280',
}

/* -------------------------------------------------------------------------- */
/*  COMPONENTS                                                                */
/* -------------------------------------------------------------------------- */

function Section({ number, label, children }: { number: string; label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="relative">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-xs font-mono tracking-[0.3em] px-2.5 py-1 border" style={{ color: CYAN, borderColor: BORDER }}>{number}</span>
        <span className="text-xs font-mono tracking-[0.25em] uppercase font-light" style={{ color: TEXT_DIM }}>{label}</span>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${BORDER}, transparent)` }} />
      </div>
      {children}
    </motion.section>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center px-4 py-4 border" style={{ borderColor: BORDER, backgroundColor: CARD_BG_LIGHT }}>
      <div className="text-[2rem] sm:text-[2.5rem] font-mono font-bold leading-none" style={{ color: CYAN }}>{value}</div>
      <div className="text-[11px] font-mono tracking-[0.2em] uppercase mt-2" style={{ color: TEXT_DIM }}>{label}</div>
    </div>
  )
}

function StanceBadge({ stance }: { stance: string }) {
  const colors = {
    positive: { bg: 'rgba(16,185,129,0.10)', text: '#10B981', label: 'Pro-Qubic' },
    negative: { bg: 'rgba(239,68,68,0.10)', text: '#EF4444', label: 'Opposition' },
    neutral: { bg: 'rgba(245,158,11,0.10)', text: '#F59E0B', label: 'Neutral' },
  }
  const c = colors[stance as keyof typeof colors] ?? colors.neutral
  return (
    <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm" style={{ backgroundColor: c.bg, color: c.text }}>
      {c.label}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  MAIN PAGE                                                                 */
/* -------------------------------------------------------------------------- */

export default function SimulationPage() {
  const [activeScenario, setActiveScenario] = useState('launch')
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const scenario = SCENARIOS.find((s) => s.id === activeScenario)!

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const accepted = localStorage.getItem('simulation-disclaimer-accepted')
      if (accepted === '1') setDisclaimerAccepted(true)
    }
  }, [])

  const handleAccept = () => {
    setDisclaimerAccepted(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('simulation-disclaimer-accepted', '1')
    }
  }

  // Disclaimer overlay
  if (!disclaimerAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#020208' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-[540px] w-full"
          style={{
            background: '#05040a',
            border: '1px solid rgba(0,217,255,0.2)',
            borderLeft: '3px solid #00d9ff',
            padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 4vw, 3rem)',
          }}
        >
          <div className="font-mono text-[0.65rem] tracking-[0.4em] uppercase mb-4" style={{ color: '#3a90a0' }}>
            // Swarm Intelligence Simulation
          </div>
          <div className="text-xl tracking-[0.15em] mb-6" style={{ color: CYAN, fontFamily: 'Cinzel, serif' }}>
            Disclaimer
          </div>

          <div className="font-mono text-sm leading-8 mb-6 space-y-4" style={{ color: 'rgba(255,255,255,0.75)' }}>
            <p>
              You are viewing results from a <span style={{ color: CYAN }}>MiroFish Swarm Intelligence Simulation</span> &mdash;
              an open-source AI engine (<a href="https://github.com/666ghj/MiroFish" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: CYAN }}>github.com/666ghj/MiroFish</a>) that
              creates virtual social media environments populated by autonomous AI agents.
            </p>

            <p>
              <strong style={{ color: TEXT_PRIMARY }}>How it works:</strong> 100 AI agents with distinct personas (miners, researchers, journalists, maximalists, VCs) were generated from a knowledge graph built from a detailed briefing document about Qubic&apos;s DOGE mining transition. These agents interacted across simulated Twitter and Reddit platforms for 168 rounds, producing 1,370 interactions. Their opinions, alliances, and arguments emerged organically from the simulation &mdash; they were not scripted.
            </p>

            <p>
              <strong style={{ color: TEXT_PRIMARY }}>What this is NOT:</strong> This is not financial advice, not a price prediction, and not a guarantee of any outcome. Agent behaviour is generated by GPT-4o-mini based on persona descriptions &mdash; it reflects plausible social dynamics, not certain futures.
            </p>

            <p>
              All raw data (1,163 Twitter events, 777 Reddit events, agent configurations, and the full report) is <span style={{ color: CYAN }}>publicly downloadable</span> for independent verification. The simulation brief used as input is also available.
            </p>

            <p style={{ color: 'rgba(255,255,255,0.4)' }}>
              Claims and predictions are <span style={{ color: '#5bc8f5' }}>[SIMULATION OUTPUT]</span> &mdash;
              emergent behaviour from AI agents, not verified facts. Always conduct your own research.
            </p>
          </div>

          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleAccept}
              className="font-mono text-[0.7rem] tracking-[0.3em] uppercase px-7 py-3 cursor-pointer transition-all"
              style={{
                backgroundColor: `${CYAN}10`,
                border: `1px solid ${CYAN}50`,
                color: CYAN,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${CYAN}20` }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${CYAN}10` }}
            >
              I Understand &mdash; View Results
            </button>
            <Link
              href="/"
              className="font-mono text-[0.7rem] tracking-[0.3em] uppercase px-7 py-3 cursor-pointer transition-all"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              Go Back
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-16 sm:space-y-24">

        <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.25em] uppercase hover:opacity-70 transition-opacity" style={{ color: TEXT_DIM }}>
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>

        {/* ================================================================ */}
        {/*  HERO                                                            */}
        {/* ================================================================ */}

        <header className="space-y-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: CYAN }} />
            <span className="text-xs font-mono uppercase tracking-[0.3em]" style={{ color: CYAN }}>Swarm Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.04em]" style={{ color: CYAN, textShadow: `0 0 60px ${CYAN}22` }}>
            What Happens When Qubic Mines Dogecoin?
          </h1>

          <p className="text-[15px] leading-[1.75] max-w-2xl" style={{ color: TEXT_DIM }}>
            100 AI agents simulated the crypto community&apos;s reaction to Qubic&apos;s DOGE mining launch across Twitter and Reddit. Here&apos;s what emerged.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <StatCard value="100" label="AI Agents" />
            <StatCard value="1,370" label="Interactions" />
            <StatCard value="168" label="Rounds" />
            <StatCard value="4" label="Scenarios" />
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono" style={{ color: `${CYAN}50` }}>
            <span>Powered by MiroFish Swarm Intelligence Engine</span>
            <span style={{ color: `${CYAN}20` }}>|</span>
            <span>GPT-4o-mini</span>
            <span style={{ color: `${CYAN}20` }}>|</span>
            <span>March 30, 2026</span>
          </div>
        </header>

        {/* ================================================================ */}
        {/*  KEY FINDINGS                                                    */}
        {/* ================================================================ */}

        <Section number="01" label="Key Findings">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {KEY_FINDINGS.map((finding, i) => (
              <motion.div
                key={finding.text}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border p-4 space-y-3"
                style={{
                  borderColor: i === 3 ? `${CYAN}40` : BORDER,
                  backgroundColor: i === 3 ? `${CYAN}08` : CARD_BG_LIGHT,
                }}
              >
                <div className="flex items-center justify-between">
                  <finding.icon className="w-5 h-5" style={{ color: CYAN }} />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm" style={{
                    backgroundColor: finding.confidence === 'High' ? 'rgba(0,217,255,0.10)' : 'rgba(245,158,11,0.10)',
                    color: finding.confidence === 'High' ? CYAN : '#F59E0B',
                  }}>
                    {finding.confidence}
                  </span>
                </div>
                <p className="text-[13px] leading-[1.6] font-medium" style={{ color: TEXT_PRIMARY }}>{finding.text}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ================================================================ */}
        {/*  SCENARIO TABS                                                   */}
        {/* ================================================================ */}

        <Section number="02" label="Scenario Analysis">
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveScenario(s.id)}
                  className="px-3 py-2 text-xs font-mono tracking-[0.1em] uppercase border transition-all"
                  style={{
                    borderColor: activeScenario === s.id ? `${CYAN}60` : BORDER,
                    backgroundColor: activeScenario === s.id ? `${CYAN}10` : 'transparent',
                    color: activeScenario === s.id ? CYAN : TEXT_DIM,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Active Scenario */}
            <AnimatePresence mode="wait">
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="border p-6 sm:p-8 space-y-6"
                style={{ borderColor: BORDER, backgroundColor: CARD_BG }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-lg font-bold tracking-[0.05em]" style={{ color: TEXT_PRIMARY }}>{scenario.title}</h3>
                  <span className="text-[11px] font-mono" style={{ color: `${CYAN}60` }}>{scenario.date}</span>
                </div>

                <p className="text-[15px] leading-[1.75]" style={{ color: TEXT_DIM }}>{scenario.summary}</p>

                {/* Stakeholder reactions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono tracking-[0.2em] uppercase" style={{ color: `${CYAN}80` }}>Stakeholder Reactions</h4>
                  {scenario.stakeholders.map((sh) => (
                    <div key={sh.group} className="flex items-start gap-3 p-3 border" style={{ borderColor: `${BORDER}`, backgroundColor: CARD_BG_LIGHT }}>
                      <StanceBadge stance={sh.stance} />
                      <div>
                        <span className="text-xs font-mono font-bold" style={{ color: TEXT_PRIMARY }}>{sh.group}</span>
                        <p className="text-[13px] mt-1" style={{ color: TEXT_DIM }}>{sh.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Insight */}
                <div className="border-l-2 pl-5 py-3" style={{ borderColor: `${CYAN}45`, backgroundColor: `rgba(0,217,255,0.04)` }}>
                  <p className="text-[13px] font-mono uppercase tracking-[0.15em] mb-2" style={{ color: CYAN }}>Key Insight</p>
                  <p className="text-[15px] leading-[1.75]" style={{ color: TEXT_PRIMARY }}>{scenario.keyInsight}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Section>

        {/* ================================================================ */}
        {/*  LIVE DATA VISUALIZATIONS                                        */}
        {/* ================================================================ */}

        <Section number="03" label="Live Simulation Data">
          <div className="space-y-8">

            {/* Activity Timeline */}
            <div className="border p-6 space-y-4" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
              <h3 className="text-xs font-mono tracking-[0.3em] uppercase font-light" style={{ color: CYAN }}>
                Activity Timeline (Actions per Round)
              </h3>
              <div className="relative" style={{ height: '180px' }}>
                <div className="absolute inset-0 flex items-end gap-[3px]">
                  {ACTIVITY_TIMELINE.map((d) => {
                    const maxVal = Math.max(...ACTIVITY_TIMELINE.map((t) => t.twitter + t.reddit))
                    const containerH = 180
                    const twPx = maxVal > 0 ? Math.round((d.twitter / maxVal) * containerH) : 0
                    const rdPx = maxVal > 0 ? Math.round((d.reddit / maxVal) * containerH) : 0
                    return (
                      <div key={d.round} className="flex-1 flex flex-col justify-end gap-[1px] group" title={`Round ${d.round}: ${d.twitter} Twitter + ${d.reddit} Reddit`}>
                        {d.twitter > 0 && (
                          <div className="rounded-t-sm group-hover:opacity-100 opacity-80 transition-opacity" style={{ height: `${twPx}px`, backgroundColor: CYAN }} />
                        )}
                        {d.reddit > 0 && (
                          <div className="rounded-t-sm group-hover:opacity-100 opacity-60 transition-opacity" style={{ height: `${rdPx}px`, backgroundColor: '#8b7ff5' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono" style={{ color: TEXT_DIM }}>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CYAN }} /> Twitter (823)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#8b7ff5' }} /> Reddit (547)</span>
                <span className="ml-auto" style={{ color: `${CYAN}40` }}>168 rounds</span>
              </div>
            </div>

            {/* Agent Network */}
            <div className="border p-6 space-y-4" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
              <h3 className="text-xs font-mono tracking-[0.3em] uppercase font-light" style={{ color: CYAN }}>
                Agent Network (27 Entities, 7 Types)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {AGENT_ROSTER.sort((a, b) => b.actions - a.actions).map((agent) => (
                  <motion.div
                    key={agent.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="p-3 border text-center space-y-1 group hover:scale-[1.02] transition-transform"
                    style={{ borderColor: `${TYPE_COLORS[agent.type] ?? CYAN}20`, backgroundColor: `${TYPE_COLORS[agent.type] ?? CYAN}06` }}
                  >
                    <div className="w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-mono font-bold" style={{ backgroundColor: `${TYPE_COLORS[agent.type] ?? CYAN}15`, color: TYPE_COLORS[agent.type] ?? CYAN }}>
                      {agent.actions}
                    </div>
                    <div className="text-[11px] font-mono font-medium truncate" style={{ color: TEXT_PRIMARY }}>{agent.name}</div>
                    <div className="text-[9px] font-mono" style={{ color: TYPE_COLORS[agent.type] ?? CYAN }}>{agent.type}</div>
                  </motion.div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-[10px] font-mono pt-2 border-t" style={{ borderColor: `${CYAN}10` }}>
                {Object.entries(TYPE_COLORS).map(([type, color]) => (
                  <span key={type} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span style={{ color: TEXT_DIM }}>{type}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Live Post Feed */}
            <div className="border p-6 space-y-4" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
              <h3 className="text-xs font-mono tracking-[0.3em] uppercase font-light" style={{ color: CYAN }}>
                Sample Agent Posts (from 157 total)
              </h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {SAMPLE_POSTS.map((post, i) => (
                  <motion.div
                    key={`${post.agent}-${post.round}`}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-3 p-3 border"
                    style={{ borderColor: `${CYAN}08`, backgroundColor: CARD_BG_LIGHT }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono" style={{ backgroundColor: `${CYAN}10`, color: CYAN }}>
                      R{post.round}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold" style={{ color: TEXT_PRIMARY }}>{post.agent}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: post.platform === 'twitter' ? `${CYAN}10` : 'rgba(139,127,245,0.10)', color: post.platform === 'twitter' ? CYAN : '#8b7ff5' }}>
                          {post.platform}
                        </span>
                      </div>
                      <p className="text-[13px] leading-[1.6]" style={{ color: TEXT_DIM }}>{post.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <p className="text-[11px] font-mono text-center" style={{ color: `${CYAN}30` }}>
                Showing 10 of 157 posts with content. Full data available for download below.
              </p>
            </div>
          </div>
        </Section>

        {/* ================================================================ */}
        {/*  COALITION MAP                                                   */}
        {/* ================================================================ */}

        <Section number="04" label="Coalition Map">
          <div className="border p-6 sm:p-8 space-y-6" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Pro */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono tracking-[0.2em] uppercase flex items-center gap-2" style={{ color: '#10B981' }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }} /> Pro-Qubic
                </h4>
                {COALITIONS.filter((c) => c.alignment === 'pro').map((c) => (
                  <div key={c.group} className="text-[13px] py-1.5 px-3 border-l-2" style={{ borderColor: c.color, color: TEXT_PRIMARY }}>{c.group}</div>
                ))}
              </div>
              {/* Neutral */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono tracking-[0.2em] uppercase flex items-center gap-2" style={{ color: '#F59E0B' }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F59E0B' }} /> Persuadable
                </h4>
                {COALITIONS.filter((c) => c.alignment === 'neutral').map((c) => (
                  <div key={c.group} className="text-[13px] py-1.5 px-3 border-l-2" style={{ borderColor: c.color, color: TEXT_PRIMARY }}>{c.group}</div>
                ))}
              </div>
              {/* Anti */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono tracking-[0.2em] uppercase flex items-center gap-2" style={{ color: '#EF4444' }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }} /> Opposition
                </h4>
                {COALITIONS.filter((c) => c.alignment === 'anti').map((c) => (
                  <div key={c.group} className="text-[13px] py-1.5 px-3 border-l-2" style={{ borderColor: c.color, color: TEXT_PRIMARY }}>{c.group}</div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ================================================================ */}
        {/*  ATTACK VECTORS                                                  */}
        {/* ================================================================ */}

        <Section number="05" label="Attack Vectors & Counter-Strategies">
          <div className="space-y-3">
            {ATTACK_VECTORS.map((av) => (
              <div key={av.rank} className="border p-4 sm:p-5 flex flex-col sm:flex-row gap-4" style={{ borderColor: BORDER, backgroundColor: CARD_BG_LIGHT }}>
                <div className="flex items-start gap-3 sm:w-1/3">
                  <span className="text-lg font-mono font-bold" style={{ color: `${CYAN}40` }}>#{av.rank}</span>
                  <div>
                    <span className="text-sm font-bold" style={{ color: TEXT_PRIMARY }}>{av.threat}</span>
                    <div className="mt-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm" style={{
                        backgroundColor: av.severity === 'Critical' ? 'rgba(239,68,68,0.12)' : av.severity === 'High' ? 'rgba(245,158,11,0.12)' : 'rgba(0,217,255,0.08)',
                        color: av.severity === 'Critical' ? '#EF4444' : av.severity === 'High' ? '#F59E0B' : CYAN,
                      }}>
                        {av.severity}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="sm:w-2/3 border-l-2 pl-4" style={{ borderColor: `${CYAN}20` }}>
                  <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: `${CYAN}60` }}>Recommended Counter</span>
                  <p className="text-[13px] mt-1 leading-[1.6]" style={{ color: TEXT_DIM }}>{av.counter}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ================================================================ */}
        {/*  METHODOLOGY                                                     */}
        {/* ================================================================ */}

        <Section number="06" label="Methodology & Raw Data">
          <div className="space-y-6">
            <div className="border p-6 sm:p-8 space-y-4" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
              <h3 className="text-xs font-mono tracking-[0.3em] uppercase font-light" style={{ color: CYAN }}>About This Simulation</h3>
              <p className="text-[15px] leading-[1.75]" style={{ color: TEXT_DIM }}>
                This analysis was generated using <strong style={{ color: TEXT_PRIMARY }}>MiroFish</strong>, an open-source swarm intelligence engine that creates virtual social media worlds populated by AI agents. Each agent has a unique personality, persistent memory, and the ability to post, comment, like, and form opinions based on interactions with other agents.
              </p>
              <p className="text-[15px] leading-[1.75]" style={{ color: TEXT_DIM }}>
                The seed document describing Qubic&apos;s DOGE mining transition was processed through GraphRAG to build a knowledge graph, which then generated 27 entity profiles across 7 stakeholder categories. Agents interacted across simulated Twitter and Reddit platforms for 168 and 113 rounds respectively.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {[
                  { label: 'Engine', value: 'MiroFish v0.1' },
                  { label: 'LLM', value: 'GPT-4o-mini' },
                  { label: 'Agents', value: '100 (27 profiles)' },
                  { label: 'Platforms', value: 'Twitter + Reddit' },
                ].map((p) => (
                  <div key={p.label} className="text-center p-2 border" style={{ borderColor: `${CYAN}10` }}>
                    <div className="text-xs font-mono" style={{ color: CYAN }}>{p.value}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: TEXT_DIM }}>{p.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reproduce instructions */}
            <div className="border p-6 sm:p-8 space-y-4" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
              <h3 className="text-xs font-mono tracking-[0.3em] uppercase font-light" style={{ color: CYAN }}>Reproduce This Simulation</h3>
              <p className="text-[15px] leading-[1.75]" style={{ color: TEXT_DIM }}>
                This simulation is fully reproducible. Follow these steps to run it yourself:
              </p>
              <div className="space-y-3 font-mono text-[13px]" style={{ color: TEXT_DIM }}>
                <div className="p-3 border" style={{ borderColor: `${CYAN}10`, backgroundColor: `${CYAN}04` }}>
                  <span style={{ color: CYAN }}>1.</span> Clone MiroFish: <code style={{ color: TEXT_PRIMARY }}>git clone https://github.com/666ghj/MiroFish.git</code>
                </div>
                <div className="p-3 border" style={{ borderColor: `${CYAN}10`, backgroundColor: `${CYAN}04` }}>
                  <span style={{ color: CYAN }}>2.</span> Configure <code style={{ color: TEXT_PRIMARY }}>.env</code> with an OpenAI API key and Zep Cloud key (free tier)
                </div>
                <div className="p-3 border" style={{ borderColor: `${CYAN}10`, backgroundColor: `${CYAN}04` }}>
                  <span style={{ color: CYAN }}>3.</span> Run <code style={{ color: TEXT_PRIMARY }}>npm run setup:all && npm run dev</code>
                </div>
                <div className="p-3 border" style={{ borderColor: `${CYAN}10`, backgroundColor: `${CYAN}04` }}>
                  <span style={{ color: CYAN }}>4.</span> Upload the <strong style={{ color: TEXT_PRIMARY }}>Simulation Brief</strong> (downloadable below) as the seed document
                </div>
                <div className="p-3 border" style={{ borderColor: `${CYAN}10`, backgroundColor: `${CYAN}04` }}>
                  <span style={{ color: CYAN }}>5.</span> Set parameters: 100 agents, GPT-4o-mini, Twitter + Reddit platforms
                </div>
                <div className="p-3 border" style={{ borderColor: `${CYAN}10`, backgroundColor: `${CYAN}04` }}>
                  <span style={{ color: CYAN }}>6.</span> Run the simulation (~45 min, ~$5 with GPT-4o-mini)
                </div>
              </div>
              <p className="text-[13px]" style={{ color: `${CYAN}40` }}>
                The <strong>Simulation Config</strong> file below contains the exact agent profiles, entity types, and parameters used in our run. Load it to replicate our setup exactly.
              </p>
            </div>

            {/* Downloads — ALL raw data */}
            <div className="border p-6 space-y-4" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
              <h3 className="text-xs font-mono tracking-[0.3em] uppercase font-light" style={{ color: CYAN }}>
                Download Raw Data
              </h3>
              <p className="text-[13px]" style={{ color: TEXT_DIM }}>
                All simulation data is publicly available. Verify our findings independently.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { href: '/papers/mirofish-report.md', label: 'Full Report (English)', size: 'Markdown' },
                  { href: '/papers/mirofish-qubic-simulation.md', label: 'Simulation Brief', size: 'Input Document' },
                  { href: '/data/mirofish-twitter-actions.jsonl', label: 'Twitter Actions Log', size: '1,163 events' },
                  { href: '/data/mirofish-reddit-actions.jsonl', label: 'Reddit Actions Log', size: '777 events' },
                  { href: '/data/mirofish-config.json', label: 'Simulation Config', size: '27 agent profiles' },
                  { href: '/data/mirofish-visualization.json', label: 'Visualization Data', size: 'Charts + Network' },
                  { href: '/data/mirofish-report.json', label: 'Raw Report (JSON)', size: 'Original output' },
                ].map((dl) => (
                  <a
                    key={dl.href}
                    href={dl.href}
                    download
                    className="flex items-center gap-3 p-3 border transition-all hover:scale-[1.01]"
                    style={{ borderColor: `${CYAN}15`, backgroundColor: CARD_BG_LIGHT }}
                  >
                    <Download className="w-4 h-4 flex-shrink-0" style={{ color: CYAN }} />
                    <div className="min-w-0">
                      <div className="text-xs font-mono" style={{ color: TEXT_PRIMARY }}>{dl.label}</div>
                      <div className="text-[10px]" style={{ color: `${CYAN}40` }}>{dl.size}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://github.com/666ghj/MiroFish"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono tracking-[0.15em] uppercase border transition-all hover:scale-[1.02]"
                style={{ color: TEXT_DIM, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.02)' }}
              >
                <ExternalLink className="w-4 h-4" /> MiroFish on GitHub
              </a>
            </div>

            {/* Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t" style={{ borderColor: `${CYAN}10` }}>
              <Link href="/maria-aigarth" className="flex items-center gap-3 p-4 border transition-colors hover:border-opacity-60" style={{ borderColor: 'rgba(139,127,245,0.15)', backgroundColor: CARD_BG_LIGHT }}>
                <Radio className="w-4 h-4" style={{ color: '#8b7ff5' }} />
                <div>
                  <div className="text-xs font-mono font-bold" style={{ color: '#8b7ff5' }}>Maria Aigarth</div>
                  <div className="text-[11px]" style={{ color: TEXT_DIM }}>The Arbiter</div>
                </div>
                <ChevronRight className="w-3 h-3 ml-auto" style={{ color: 'rgba(139,127,245,0.3)' }} />
              </Link>
              <Link href="/monitoring" className="flex items-center gap-3 p-4 border transition-colors hover:border-opacity-60" style={{ borderColor: `${GOLD}15`, backgroundColor: CARD_BG_LIGHT }}>
                <BarChart3 className="w-4 h-4" style={{ color: GOLD }} />
                <div>
                  <div className="text-xs font-mono font-bold" style={{ color: GOLD }}>Live Dashboard</div>
                  <div className="text-[11px]" style={{ color: TEXT_DIM }}>Network Stats</div>
                </div>
                <ChevronRight className="w-3 h-3 ml-auto" style={{ color: `${GOLD}30` }} />
              </Link>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <footer className="text-center space-y-3 pt-8 border-t" style={{ borderColor: `${CYAN}08` }}>
          <p className="text-xs font-mono tracking-[0.2em] uppercase" style={{ color: `${CYAN}30` }}>
            MiroFish Swarm Intelligence &middot; Qubic Church &middot; March 2026
          </p>
          <p className="text-[11px] italic" style={{ color: `${CYAN}15` }}>
            Simulation results are predictive models, not guarantees. Crypto markets involve significant risk.
          </p>
        </footer>

      </div>
    </div>
  )
}
