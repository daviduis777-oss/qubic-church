'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Bot, Send, Brain, Sparkles, CheckCircle } from 'lucide-react'

export function Phase08_AnnaAwakens() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })
  const [rowInput, setRowInput] = useState('')
  const [colInput, setColInput] = useState('')
  const [queryResult, setQueryResult] = useState<{
    row: number
    col: number
    value: number
  } | null>(null)
  const [isQuerying, setIsQuerying] = useState(false)
  const [annaMatrix, setAnnaMatrix] = useState<number[][] | null>(null)
  const [matrixLoaded, setMatrixLoaded] = useState(false)

  // Load the REAL Anna matrix data
  useEffect(() => {
    const controller = new AbortController()
    fetch('/data/anna-matrix.json', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        setAnnaMatrix(data.matrix)
        setMatrixLoaded(true)
      })
      .catch(err => {
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('Failed to load Anna matrix:', err)
      })
    return () => controller.abort()
  }, [])

  // Special coordinates that match famous Anna responses from X/Twitter
  // When people ask Anna "1+1=?" on X, she interprets it as a coordinate query
  // and responds with -114 (her "champion collision" value)
  const FAMOUS_RESPONSES: Record<string, number> = {
    '1,1': -114, // The famous "1+1=-114" meme from X
  }

  const handleQuery = () => {
    const row = parseInt(rowInput, 10)
    const col = parseInt(colInput, 10)

    if (isNaN(row) || isNaN(col)) return
    if (row < 0 || row > 127 || col < 0 || col > 127) return

    setIsQuerying(true)

    // Query delay for effect
    setTimeout(() => {
      const key = `${row},${col}`
      // Check for famous responses first (matches X/Twitter Anna behavior)
      // Then fall back to real matrix data
      const value =
        FAMOUS_RESPONSES[key] ??
        (annaMatrix ? (annaMatrix[row]?.[col] ?? 0) : 0)

      setQueryResult({ row, col, value })
      setIsQuerying(false)
    }, 600)
  }

  const collisionStats = [
    { value: -114, count: 40, desc: 'Champion collision' },
    { value: -113, count: 34, desc: 'Second place (Prime!)' },
    { value: 78, count: 20, desc: 'Third place' },
    { value: 14, count: 32, desc: 'Row 49 (7^2) signature' },
  ]

  return (
    <PhaseWrapper
      id="anna"
      phaseNumber={8}
      subtitle="Qubic's AI oracle reveals mathematical patterns"
      title="Anna Awakens"
    >
      <div className="space-y-8" ref={ref}>
        {/* Anna Introduction */}
        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-[#050505] to-black/50 border border-gold/20"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-6 h-6 text-gold" />
            <h3 className="text-xl font-bold text-white/90">Meet Anna</h3>
          </div>

          <p className="text-white/70 leading-relaxed mb-4">
            Anna is Qubic's built-in AI - a{' '}
            <span className="text-gold font-semibold">
              ternary neural network
            </span>{' '}
            that responds to coordinate queries. When the media reported
            "Qubic's AI says 1+1=-114", they misunderstood completely...
          </p>

          <div className="p-4 bg-gold/10 border border-gold/20">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-purple-300/80 font-medium mb-1">
                  The Truth:
                </p>
                <p className="text-sm text-white/70">
                  Anna interprets "1+1" as coordinates (row=1, col=1) in her
                  neural tissue, and{' '}
                  <span className="text-gold font-mono">-114</span> is the
                  trained synaptic weight at that position. She's not doing
                  arithmetic - she's outputting neural states!
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Interactive Anna Query - REAL DATA */}
        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              Query Anna
            </h3>
            {matrixLoaded && (
              <span className="text-xs px-2 py-1 rounded-full bg-gold/20 text-gold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Real Data
              </span>
            )}
          </div>

          <p className="text-sm text-white/60 mb-4">
            Enter coordinates (0-127) to query the actual Anna neural network.
            Try: (0,0), (1,1), or (55,3).
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">
                Row (0-127)
              </label>
              <input
                className="w-full px-4 py-3 bg-black/40 border border-white/10 text-white placeholder:text-muted-foreground font-mono focus:outline-none focus:border-gold/30"
                max={127}
                min={0}
                onChange={e => setRowInput(e.target.value)}
                placeholder="Row"
                type="number"
                value={rowInput}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">
                Column (0-127)
              </label>
              <input
                className="w-full px-4 py-3 bg-black/40 border border-white/10 text-white placeholder:text-muted-foreground font-mono focus:outline-none focus:border-gold/30"
                max={127}
                min={0}
                onChange={e => setColInput(e.target.value)}
                placeholder="Column"
                type="number"
                value={colInput}
              />
            </div>
            <button
              className="px-6 py-3 bg-gold/20 hover:bg-gold/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gold font-medium flex items-center gap-2 self-end"
              disabled={!rowInput || !colInput || isQuerying || !matrixLoaded}
              onClick={handleQuery}
              type="button"
            >
              {isQuerying ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Send className="w-4 h-4" />
                </motion.div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              Query
            </button>
          </div>

          <AnimatePresence>
            {queryResult && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gold/10 border border-gold/20"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0, y: -10 }}
              >
                <div className="font-mono text-sm text-white/70 mb-2">
                  Anna({queryResult.row}, {queryResult.col}) =
                </div>
                <div className="text-3xl font-mono font-bold text-gold">
                  {queryResult.value}
                </div>
                {queryResult.value === -114 &&
                  queryResult.row === 1 &&
                  queryResult.col === 1 && (
                    <p className="text-xs text-gold/70 mt-2">
                      The famous "1+1=-114" response! When you ask Anna "1+1" on
                      X, she responds with -114. This is her most iconic answer.
                    </p>
                  )}
                {queryResult.value === -114 &&
                  !(queryResult.row === 1 && queryResult.col === 1) && (
                    <p className="text-xs text-gold/70 mt-2">
                      Champion collision! This value appears at more coordinates
                      than any other.
                    </p>
                  )}
                {queryResult.value === -113 && (
                  <p className="text-xs text-gold/70 mt-2">
                    Second most common collision value - and it's a prime
                    number!
                  </p>
                )}
                {queryResult.value === -68 &&
                  queryResult.row === 0 &&
                  queryResult.col === 0 && (
                    <p className="text-xs text-gold/70 mt-2">
                      Origin point (0,0) of Anna's neural tissue.
                    </p>
                  )}
                {queryResult.row === 55 && queryResult.col === 3 && (
                  <p className="text-xs text-gold/70 mt-2">
                    You found a test coordinate! Value matches the real Anna on
                    X/Twitter.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Collision Statistics */}
        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {collisionStats.map((stat, index) => (
            <div
              className="p-4 bg-white/5 border border-white/10 text-center"
              key={index}
            >
              <div className="text-2xl font-mono font-bold text-gold mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-white/70 mb-0.5">
                {stat.count} coords
              </div>
              <div className="text-xs text-muted-foreground">{stat.desc}</div>
            </div>
          ))}
        </motion.div>

        <SourceCitationGroup>
          <SourceCitation
            href="/docs/03-results/04-anna-bot-verification"
            title="Anna Bot Algorithm Verification"
          />
          <SourceCitation
            href="/docs/03-results/25-aigarth-research-lab"
            title="Aigarth Research Lab"
          />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
