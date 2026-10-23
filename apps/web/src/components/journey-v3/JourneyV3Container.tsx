'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'

// Phase configuration
export const JOURNEY_V3_PHASES = [
  { id: 'void', name: 'The Road', number: 1 },
  { id: 'origin', name: 'The First Articles', number: 2 },
  { id: 'vanishing', name: 'The Vanishing', number: 3 },
  { id: 'pots', name: 'NXT, IOTA and the Plant', number: 4 },
  { id: 'qubic', name: 'Qubic', number: 5 },
  { id: 'coincidences', name: 'Strange Coincidences', number: 6 },
  { id: 'satoshi', name: 'Satoshi Nakamoto', number: 7 },
  { id: 'anna', name: 'Anna Speaks', number: 8 },
  { id: 'matrix', name: 'The Matrix', number: 9 },
  { id: 'aigarth', name: 'Aigarth Grows', number: 10 },
  { id: 'the-day', name: 'The Day', number: 11 },
  { id: 'withdrawn', name: 'What We Got Wrong', number: 12 },
  { id: 'ahead', name: 'The Road Ahead', number: 13 },
] as const

export type PhaseId = (typeof JOURNEY_V3_PHASES)[number]['id']

interface JourneyV3ContextType {
  currentPhase: PhaseId
  currentIndex: number
  totalPhases: number
  scrollProgress: number
  visitedPhases: Set<PhaseId>
  achievements: Set<string>
  markPhaseVisited: (id: PhaseId) => void
  unlockAchievement: (id: string) => void
  scrollToPhase: (id: PhaseId) => void
  phases: typeof JOURNEY_V3_PHASES
}

const JourneyV3Context = createContext<JourneyV3ContextType | null>(null)

export function useJourneyV3() {
  const context = useContext(JourneyV3Context)
  if (!context) {
    throw new Error('useJourneyV3 must be used within JourneyV3Container')
  }
  return context
}

export function useJourneyV3Safe() {
  return useContext(JourneyV3Context)
}

interface JourneyV3ContainerProps {
  children: ReactNode
}

export function JourneyV3Container({ children }: JourneyV3ContainerProps) {
  const [currentPhase, setCurrentPhase] = useState<PhaseId>('void')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const visitedPhasesRef = useRef<Set<PhaseId>>(new Set(['void']))
  const achievementsRef = useRef<Set<string>>(new Set())
  const [visitedCount, setVisitedCount] = useState(1)
  const [achievementCount, setAchievementCount] = useState(0)

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight
      const progress =
        docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0
      setScrollProgress(progress)

      // Determine current phase based on scroll
      const phaseIndex = Math.min(
        JOURNEY_V3_PHASES.length - 1,
        Math.floor(progress * JOURNEY_V3_PHASES.length)
      )
      const phase = JOURNEY_V3_PHASES[phaseIndex]
      if (phase) {
        setCurrentPhase(phase.id)
        setCurrentIndex(phaseIndex)
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const markPhaseVisited = useCallback((id: PhaseId) => {
    if (visitedPhasesRef.current.has(id)) return
    visitedPhasesRef.current.add(id)
    setVisitedCount(visitedPhasesRef.current.size)
  }, [])

  const unlockAchievement = useCallback((id: string) => {
    if (achievementsRef.current.has(id)) return
    achievementsRef.current.add(id)
    setAchievementCount(achievementsRef.current.size)
  }, [])

  const scrollToPhase = useCallback((id: PhaseId) => {
    const element = document.getElementById(`phase-${id}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const visitedPhases = useMemo(() => visitedPhasesRef.current, [visitedCount])
  const achievements = useMemo(
    () => achievementsRef.current,
    [achievementCount]
  )

  const contextValue = useMemo<JourneyV3ContextType>(
    () => ({
      currentPhase,
      currentIndex,
      totalPhases: JOURNEY_V3_PHASES.length,
      scrollProgress,
      visitedPhases,
      achievements,
      markPhaseVisited,
      unlockAchievement,
      scrollToPhase,
      phases: JOURNEY_V3_PHASES,
    }),
    [
      currentPhase,
      currentIndex,
      scrollProgress,
      visitedPhases,
      achievements,
      markPhaseVisited,
      unlockAchievement,
      scrollToPhase,
    ]
  )

  return (
    <JourneyV3Context.Provider value={contextValue}>
      <div className="relative bg-black">
        {/* Subtle gradient background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/10 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent" />
        </div>

        {/* Progress Bar */}
        <div className="fixed top-14 left-0 right-0 z-40 h-0.5 bg-black/50">
          <div
            className="h-full bg-gradient-to-r from-gold to-gold transition-all duration-150"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>

        {/* Phase Navigation Dots */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-2">
          {JOURNEY_V3_PHASES.map((phase, index) => (
            <button
              aria-label={`Go to ${phase.name}`}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentIndex === index
                  ? 'bg-gold scale-150'
                  : visitedPhases.has(phase.id)
                    ? 'bg-gold/40 hover:bg-gold/70'
                    : 'bg-white/20 hover:bg-white/40'
              }`}
              key={phase.id}
              onClick={() => scrollToPhase(phase.id)}
              title={phase.name}
              type="button"
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    </JourneyV3Context.Provider>
  )
}
