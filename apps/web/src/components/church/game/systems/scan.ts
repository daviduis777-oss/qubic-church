/**
 * Anna Matrix Explorer - Scan System
 * Three-tier scanning mechanics for pattern discovery
 */

import type { Pattern, PatternRarity, Position } from '../engine/types'
import { getPatternAtPosition } from '../data/patterns'

// ============================================
// SCAN TYPES
// ============================================

export type ScanType = 'quick' | 'deep' | 'full'

export interface ScanConfig {
  name: string
  energyCost: number
  description: string
  discoveryChance: Record<PatternRarity, number> // 0-1 chance to discover each rarity
  revealHints: boolean
  cooldown: number // ms
}

export const SCAN_CONFIGS: Record<ScanType, ScanConfig> = {
  quick: {
    name: 'Quick Scan',
    energyCost: 0,
    description: 'Free basic scan. Good for common patterns.',
    discoveryChance: {
      common: 1.0,
      uncommon: 0.7,
      rare: 0.3,
      epic: 0.1,
      legendary: 0.05,
      mythic: 0.01,
    },
    revealHints: false,
    cooldown: 500,
  },
  deep: {
    name: 'Deep Scan',
    energyCost: 10,
    description: 'Thorough analysis. Reveals hidden patterns.',
    discoveryChance: {
      common: 1.0,
      uncommon: 1.0,
      rare: 0.8,
      epic: 0.5,
      legendary: 0.25,
      mythic: 0.1,
    },
    revealHints: true,
    cooldown: 1000,
  },
  full: {
    name: 'Full Analysis',
    energyCost: 50,
    description: 'Complete analysis. Guaranteed discovery.',
    discoveryChance: {
      common: 1.0,
      uncommon: 1.0,
      rare: 1.0,
      epic: 1.0,
      legendary: 1.0,
      mythic: 1.0,
    },
    revealHints: true,
    cooldown: 2000,
  },
}

// ============================================
// SCAN RESULT
// ============================================

export interface ScanResult {
  type: ScanType
  position: Position
  success: boolean
  pattern: Pattern | null
  discovered: boolean // Was it newly discovered?
  alreadyKnown: boolean // Was it already in discoveries?
  hint: string | null
  energyUsed: number
  message: string
}

// ============================================
// SCAN FUNCTIONS
// ============================================

/**
 * Perform a scan at the given position
 */
export function performScan(
  scanType: ScanType,
  position: Position,
  currentEnergy: number,
  alreadyDiscovered: string[],
  scanPowerBonus: number = 0 // From player stats
): ScanResult {
  const config = SCAN_CONFIGS[scanType]

  // Check energy
  if (currentEnergy < config.energyCost) {
    return {
      type: scanType,
      position,
      success: false,
      pattern: null,
      discovered: false,
      alreadyKnown: false,
      hint: null,
      energyUsed: 0,
      message: `Not enough energy! Need ${config.energyCost}, have ${currentEnergy}`,
    }
  }

  // Get pattern at position
  const pattern = getPatternAtPosition(position.row, position.col)

  // No pattern at this location
  if (!pattern) {
    return {
      type: scanType,
      position,
      success: true,
      pattern: null,
      discovered: false,
      alreadyKnown: false,
      hint: null,
      energyUsed: config.energyCost,
      message: 'No patterns detected at this location.',
    }
  }

  // Check if already discovered
  if (alreadyDiscovered.includes(pattern.id)) {
    return {
      type: scanType,
      position,
      success: true,
      pattern,
      discovered: false,
      alreadyKnown: true,
      hint: null,
      energyUsed: config.energyCost,
      message: `${pattern.name} - Already discovered!`,
    }
  }

  // Calculate discovery chance with bonus
  const baseChance = config.discoveryChance[pattern.rarity]
  const bonusMultiplier = 1 + scanPowerBonus * 0.01 // Each point adds 1%
  const finalChance = Math.min(1, baseChance * bonusMultiplier)

  // Roll for discovery
  const roll = Math.random()
  const discovered = roll <= finalChance

  if (discovered) {
    return {
      type: scanType,
      position,
      success: true,
      pattern,
      discovered: true,
      alreadyKnown: false,
      hint: null,
      energyUsed: config.energyCost,
      message: `Discovered: ${pattern.name}! +${pattern.points} points`,
    }
  }

  // Failed to discover - maybe provide hint
  const hint = config.revealHints && pattern.hint ? pattern.hint : null

  return {
    type: scanType,
    position,
    success: true,
    pattern: null, // Don't reveal the pattern
    discovered: false,
    alreadyKnown: false,
    hint,
    energyUsed: config.energyCost,
    message: hint
      ? `Something here... Hint: "${hint}"`
      : 'Faint traces detected. Try a deeper scan.',
  }
}

/**
 * Get nearby patterns within radius (for area scanning)
 */
export function getNearbyPatterns(
  position: Position,
  radius: number,
  patterns: Pattern[],
  alreadyDiscovered: string[]
): { pattern: Pattern; distance: number; discovered: boolean }[] {
  const nearby: { pattern: Pattern; distance: number; discovered: boolean }[] = []

  for (const pattern of patterns) {
    const dx = pattern.col - position.col
    const dy = pattern.row - position.row
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance <= radius) {
      nearby.push({
        pattern,
        distance,
        discovered: alreadyDiscovered.includes(pattern.id),
      })
    }
  }

  return nearby.sort((a, b) => a.distance - b.distance)
}

/**
 * Get scan range based on scan type
 */
export function getScanRange(scanType: ScanType): number {
  switch (scanType) {
    case 'quick':
      return 1 // Current cell only
    case 'deep':
      return 3 // 3x3 area
    case 'full':
      return 5 // 5x5 area
  }
}

/**
 * Calculate XP bonus for scan-based discovery
 */
export function calculateScanXPBonus(scanType: ScanType, pattern: Pattern): number {
  const baseXP = pattern.points * 0.5

  switch (scanType) {
    case 'quick':
      return Math.floor(baseXP * 1.0) // Normal XP
    case 'deep':
      return Math.floor(baseXP * 1.25) // 25% bonus
    case 'full':
      return Math.floor(baseXP * 1.5) // 50% bonus
  }
}

// ============================================
// SCAN UI HELPERS
// ============================================

export function getScanButtonClass(
  scanType: ScanType,
  currentEnergy: number,
  isOnCooldown: boolean
): string {
  const config = SCAN_CONFIGS[scanType]
  const canAfford = currentEnergy >= config.energyCost
  const disabled = !canAfford || isOnCooldown

  const baseClass = 'px-3 py-2 rounded-lg font-medium text-sm transition-all'

  if (disabled) {
    return `${baseClass} bg-white/5 text-white/30 cursor-not-allowed`
  }

  switch (scanType) {
    case 'quick':
      return `${baseClass} bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30`
    case 'deep':
      return `${baseClass} bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30`
    case 'full':
      return `${baseClass} bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30`
  }
}

export function formatScanResult(result: ScanResult): {
  title: string
  subtitle: string
  color: string
  icon: string
} {
  if (!result.success) {
    return {
      title: 'Scan Failed',
      subtitle: result.message,
      color: 'red',
      icon: '❌',
    }
  }

  if (result.discovered && result.pattern) {
    const rarityColors = {
      common: 'gray',
      uncommon: 'green',
      rare: 'blue',
      epic: 'purple',
      legendary: 'orange',
      mythic: 'pink',
    }
    return {
      title: result.pattern.name,
      subtitle: `+${result.pattern.points} points`,
      color: rarityColors[result.pattern.rarity],
      icon: '✨',
    }
  }

  if (result.alreadyKnown) {
    return {
      title: 'Already Discovered',
      subtitle: result.message,
      color: 'cyan',
      icon: '📍',
    }
  }

  if (result.hint) {
    return {
      title: 'Something Here...',
      subtitle: result.hint,
      color: 'yellow',
      icon: '💡',
    }
  }

  return {
    title: 'Scan Complete',
    subtitle: result.message,
    color: 'white',
    icon: '🔍',
  }
}
