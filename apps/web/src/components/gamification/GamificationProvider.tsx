'use client'

import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react'

// ============================================
// TYPES
// ============================================

export type AchievementId =
  | 'first-discovery'
  | 'formula-verified'
  | 'address-detective'
  | 'deep-diver'
  | 'all-46'
  | 'perfect-formula'
  | 'bitcoin-expert'
  | 'qubic-explorer'
  | 'time-traveler'
  | 'pattern-master'

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Achievement {
  id: AchievementId
  name: string
  description: string
  rarity: AchievementRarity
  icon: string
  unlockedAt?: number
}

export interface GamificationState {
  // Progress tracking
  viewedDiscoveries: string[]
  verifiedProofs: string[]
  viewedTiers: number[]
  completedTools: string[]

  // Achievements
  unlockedAchievements: AchievementId[]

  // Session data
  sessionStartTime: number
  totalTimeSpent: number
  lastVisit: number

  // UI state
  showAchievementUnlock: AchievementId | null
}

type GamificationAction =
  | { type: 'VIEW_DISCOVERY'; id: string }
  | { type: 'VERIFY_PROOF'; id: string }
  | { type: 'VIEW_TIER'; tier: number }
  | { type: 'COMPLETE_TOOL'; toolId: string }
  | { type: 'UNLOCK_ACHIEVEMENT'; achievementId: AchievementId }
  | { type: 'DISMISS_ACHIEVEMENT_UNLOCK' }
  | { type: 'RESTORE_STATE'; state: Partial<GamificationState> }
  | { type: 'UPDATE_TIME'; time: number }

// ============================================
// ACHIEVEMENTS DEFINITIONS
// ============================================

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  'first-discovery': {
    id: 'first-discovery',
    name: 'The Journey Begins',
    description: 'View your first discovery',
    rarity: 'common',
    icon: '🔍',
  },
  'formula-verified': {
    id: 'formula-verified',
    name: 'Formula Master',
    description: 'Verify the 625,284 formula correctly',
    rarity: 'rare',
    icon: '🧮',
  },
  'address-detective': {
    id: 'address-detective',
    name: 'Address Detective',
    description: 'Verify an address on the blockchain',
    rarity: 'rare',
    icon: '🔎',
  },
  'deep-diver': {
    id: 'deep-diver',
    name: 'Deep Diver',
    description: 'View all 11 discovery tiers',
    rarity: 'epic',
    icon: '🤿',
  },
  'all-46': {
    id: 'all-46',
    name: 'Complete Researcher',
    description: 'View all 46 discoveries',
    rarity: 'epic',
    icon: '📚',
  },
  'perfect-formula': {
    id: 'perfect-formula',
    name: 'First Try Perfect',
    description: 'Set the correct formula values on first attempt',
    rarity: 'legendary',
    icon: '⭐',
  },
  'bitcoin-expert': {
    id: 'bitcoin-expert',
    name: 'Bitcoin Expert',
    description: 'Explore all Bitcoin-related discoveries',
    rarity: 'rare',
    icon: '₿',
  },
  'qubic-explorer': {
    id: 'qubic-explorer',
    name: 'Qubic Explorer',
    description: 'Explore all Qubic-related discoveries',
    rarity: 'rare',
    icon: '🔮',
  },
  'time-traveler': {
    id: 'time-traveler',
    name: 'Time Traveler',
    description: 'Use the timeline simulator',
    rarity: 'common',
    icon: '⏰',
  },
  'pattern-master': {
    id: 'pattern-master',
    name: 'Pattern Master',
    description: 'Identify 5 mathematical patterns',
    rarity: 'epic',
    icon: '🔢',
  },
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: GamificationState = {
  viewedDiscoveries: [],
  verifiedProofs: [],
  viewedTiers: [],
  completedTools: [],
  unlockedAchievements: [],
  sessionStartTime: Date.now(),
  totalTimeSpent: 0,
  lastVisit: Date.now(),
  showAchievementUnlock: null,
}

// ============================================
// REDUCER
// ============================================

function gamificationReducer(
  state: GamificationState,
  action: GamificationAction
): GamificationState {
  switch (action.type) {
    case 'VIEW_DISCOVERY':
      if (state.viewedDiscoveries.includes(action.id)) return state
      return {
        ...state,
        viewedDiscoveries: [...state.viewedDiscoveries, action.id],
      }

    case 'VERIFY_PROOF':
      if (state.verifiedProofs.includes(action.id)) return state
      return {
        ...state,
        verifiedProofs: [...state.verifiedProofs, action.id],
      }

    case 'VIEW_TIER':
      if (state.viewedTiers.includes(action.tier)) return state
      return {
        ...state,
        viewedTiers: [...state.viewedTiers, action.tier],
      }

    case 'COMPLETE_TOOL':
      if (state.completedTools.includes(action.toolId)) return state
      return {
        ...state,
        completedTools: [...state.completedTools, action.toolId],
      }

    case 'UNLOCK_ACHIEVEMENT':
      if (state.unlockedAchievements.includes(action.achievementId)) return state
      return {
        ...state,
        unlockedAchievements: [...state.unlockedAchievements, action.achievementId],
        showAchievementUnlock: action.achievementId,
      }

    case 'DISMISS_ACHIEVEMENT_UNLOCK':
      return {
        ...state,
        showAchievementUnlock: null,
      }

    case 'RESTORE_STATE':
      return {
        ...state,
        ...action.state,
        sessionStartTime: Date.now(),
        lastVisit: Date.now(),
      }

    case 'UPDATE_TIME':
      return {
        ...state,
        totalTimeSpent: state.totalTimeSpent + action.time,
      }

    default:
      return state
  }
}

// ============================================
// CONTEXT
// ============================================

interface GamificationContextType {
  state: GamificationState
  // Actions
  viewDiscovery: (id: string) => void
  verifyProof: (id: string) => void
  viewTier: (tier: number) => void
  completeTool: (toolId: string) => void
  unlockAchievement: (achievementId: AchievementId) => void
  dismissAchievementUnlock: () => void
  // Computed values
  getProgress: () => number
  getTierProgress: () => number
  getAchievement: (id: AchievementId) => Achievement & { unlocked: boolean }
  getAllAchievements: () => Array<Achievement & { unlocked: boolean }>
}

const GamificationContext = createContext<GamificationContextType | null>(null)

// ============================================
// PROVIDER
// ============================================

const STORAGE_KEY = 'qubic-research-progress'

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gamificationReducer, initialState)

  // Restore state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<GamificationState>
        dispatch({ type: 'RESTORE_STATE', state: parsed })
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Persist state to localStorage on changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const toStore = {
      viewedDiscoveries: state.viewedDiscoveries,
      verifiedProofs: state.verifiedProofs,
      viewedTiers: state.viewedTiers,
      completedTools: state.completedTools,
      unlockedAchievements: state.unlockedAchievements,
      totalTimeSpent: state.totalTimeSpent,
      lastVisit: Date.now(),
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    } catch {
      // Ignore storage errors
    }
  }, [
    state.viewedDiscoveries,
    state.verifiedProofs,
    state.viewedTiers,
    state.completedTools,
    state.unlockedAchievements,
    state.totalTimeSpent,
  ])

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'UPDATE_TIME', time: 60 }) // Add 60 seconds
    }, 60000) // Every minute

    return () => clearInterval(interval)
  }, [])

  // Check for achievements
  useEffect(() => {
    // First discovery
    if (
      state.viewedDiscoveries.length >= 1 &&
      !state.unlockedAchievements.includes('first-discovery')
    ) {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', achievementId: 'first-discovery' })
    }

    // All 11 tiers
    if (
      state.viewedTiers.length >= 11 &&
      !state.unlockedAchievements.includes('deep-diver')
    ) {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', achievementId: 'deep-diver' })
    }

    // All 46 discoveries
    if (
      state.viewedDiscoveries.length >= 46 &&
      !state.unlockedAchievements.includes('all-46')
    ) {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', achievementId: 'all-46' })
    }
  }, [state.viewedDiscoveries, state.viewedTiers, state.unlockedAchievements])

  // Actions
  const viewDiscovery = useCallback((id: string) => {
    dispatch({ type: 'VIEW_DISCOVERY', id })
  }, [])

  const verifyProof = useCallback((id: string) => {
    dispatch({ type: 'VERIFY_PROOF', id })
  }, [])

  const viewTier = useCallback((tier: number) => {
    dispatch({ type: 'VIEW_TIER', tier })
  }, [])

  const completeTool = useCallback((toolId: string) => {
    dispatch({ type: 'COMPLETE_TOOL', toolId })
  }, [])

  const unlockAchievement = useCallback((achievementId: AchievementId) => {
    dispatch({ type: 'UNLOCK_ACHIEVEMENT', achievementId })
  }, [])

  const dismissAchievementUnlock = useCallback(() => {
    dispatch({ type: 'DISMISS_ACHIEVEMENT_UNLOCK' })
  }, [])

  // Computed values
  const getProgress = useCallback((): number => {
    const totalDiscoveries = 46
    const totalTiers = 11
    const totalTools = 10

    const discoveryProgress = state.viewedDiscoveries.length / totalDiscoveries
    const tierProgress = state.viewedTiers.length / totalTiers
    const toolProgress = state.completedTools.length / totalTools

    // Weighted average
    return (discoveryProgress * 0.5 + tierProgress * 0.3 + toolProgress * 0.2) * 100
  }, [state.viewedDiscoveries, state.viewedTiers, state.completedTools])

  const getTierProgress = useCallback((): number => {
    return (state.viewedTiers.length / 11) * 100
  }, [state.viewedTiers])

  const getAchievement = useCallback(
    (id: AchievementId): Achievement & { unlocked: boolean } => {
      const achievement = ACHIEVEMENTS[id]
      return {
        ...achievement,
        unlocked: state.unlockedAchievements.includes(id),
      }
    },
    [state.unlockedAchievements]
  )

  const getAllAchievements = useCallback((): Array<Achievement & { unlocked: boolean }> => {
    return Object.values(ACHIEVEMENTS).map((achievement) => ({
      ...achievement,
      unlocked: state.unlockedAchievements.includes(achievement.id),
    }))
  }, [state.unlockedAchievements])

  const value: GamificationContextType = {
    state,
    viewDiscovery,
    verifyProof,
    viewTier,
    completeTool,
    unlockAchievement,
    dismissAchievementUnlock,
    getProgress,
    getTierProgress,
    getAchievement,
    getAllAchievements,
  }

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  )
}

// ============================================
// HOOKS
// ============================================

export function useGamification(): GamificationContextType {
  const context = useContext(GamificationContext)
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider')
  }
  return context
}

// Safe hook that doesn't throw - returns null if not in provider
export function useGamificationSafe(): GamificationContextType | null {
  return useContext(GamificationContext)
}
