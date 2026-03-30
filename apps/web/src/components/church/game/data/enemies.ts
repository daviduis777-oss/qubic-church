/**
 * Anna Matrix Explorer - Enemy Definitions
 * All enemy types with stats, abilities, and loot tables
 */

import type { Enemy, EnemyType, EnemyTier, LootDrop } from '../engine/types'

// ============================================
// ENEMY TEMPLATES
// ============================================

export interface EnemyTemplate {
  type: EnemyType
  name: string
  tier: EnemyTier
  baseLevel: number
  baseStats: {
    health: number
    attack: number
    defense: number
  }
  xpReward: number
  abilities: string[]
  lootTable: LootDrop[]
  description: string
  behavior: 'aggressive' | 'defensive' | 'balanced' | 'swarm'
}

// ============================================
// TIER 1 ENEMIES (Level 1-25)
// ============================================

export const ENEMY_TEMPLATES: Record<EnemyType, EnemyTemplate> = {
  // Data Drone - Basic weak enemy
  'data-drone': {
    type: 'data-drone',
    name: 'Data Drone',
    tier: 1,
    baseLevel: 1,
    baseStats: {
      health: 30,
      attack: 8,
      defense: 2,
    },
    xpReward: 15,
    abilities: [],
    lootTable: [
      { itemId: 'data-fragment', chance: 0.8, minQuantity: 1, maxQuantity: 3 },
      { itemId: 'energy-cell', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
    ],
    description: 'A simple data collection unit. Easy to defeat but numerous.',
    behavior: 'aggressive',
  },

  // Firewall - Tanky defensive enemy
  firewall: {
    type: 'firewall',
    name: 'Firewall',
    tier: 1,
    baseLevel: 5,
    baseStats: {
      health: 80,
      attack: 5,
      defense: 15,
    },
    xpReward: 30,
    abilities: ['shield-boost'],
    lootTable: [
      { itemId: 'data-fragment', chance: 0.6, minQuantity: 2, maxQuantity: 4 },
      { itemId: 'shield-core', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
    ],
    description: 'A defensive barrier. High defense but slow attacks.',
    behavior: 'defensive',
  },

  // Bug Swarm - Multiple weak units
  'bug-swarm': {
    type: 'bug-swarm',
    name: 'Bug Swarm',
    tier: 1,
    baseLevel: 3,
    baseStats: {
      health: 15,
      attack: 12,
      defense: 0,
    },
    xpReward: 10,
    abilities: ['multiply'],
    lootTable: [
      { itemId: 'bug-essence', chance: 0.5, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'data-fragment', chance: 0.4, minQuantity: 1, maxQuantity: 1 },
    ],
    description: 'A swarm of data corruptions. Weak alone but dangerous in numbers.',
    behavior: 'swarm',
  },

  // ============================================
  // TIER 2 ENEMIES (Level 26-50)
  // ============================================

  // Processor - Balanced enemy
  processor: {
    type: 'processor',
    name: 'Processor',
    tier: 2,
    baseLevel: 15,
    baseStats: {
      health: 60,
      attack: 15,
      defense: 8,
    },
    xpReward: 50,
    abilities: ['compute-strike'],
    lootTable: [
      { itemId: 'data-fragment', chance: 0.7, minQuantity: 3, maxQuantity: 6 },
      { itemId: 'processing-chip', chance: 0.25, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'rare-code-shard', chance: 0.1, minQuantity: 1, maxQuantity: 1 },
    ],
    description: 'A computational unit. Balanced stats with moderate abilities.',
    behavior: 'balanced',
  },

  // Virus - Poison-based enemy
  virus: {
    type: 'virus',
    name: 'Virus',
    tier: 2,
    baseLevel: 20,
    baseStats: {
      health: 40,
      attack: 10,
      defense: 4,
    },
    xpReward: 45,
    abilities: ['infect', 'spread'],
    lootTable: [
      { itemId: 'virus-sample', chance: 0.6, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'data-fragment', chance: 0.5, minQuantity: 2, maxQuantity: 4 },
      { itemId: 'antivirus-core', chance: 0.15, minQuantity: 1, maxQuantity: 1 },
    ],
    description: 'A malicious program. Poisons targets over time.',
    behavior: 'aggressive',
  },

  // Guardian - High HP tank
  guardian: {
    type: 'guardian',
    name: 'Guardian',
    tier: 2,
    baseLevel: 25,
    baseStats: {
      health: 120,
      attack: 12,
      defense: 20,
    },
    xpReward: 75,
    abilities: ['protect', 'counter'],
    lootTable: [
      { itemId: 'data-fragment', chance: 0.8, minQuantity: 4, maxQuantity: 8 },
      { itemId: 'guardian-core', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'rare-equipment', chance: 0.05, minQuantity: 1, maxQuantity: 1 },
    ],
    description: 'An elite defense unit. Protects other enemies and counterattacks.',
    behavior: 'defensive',
  },

  // ============================================
  // TIER 3 ENEMIES (Level 51-75)
  // ============================================

  // Corrupted AI - Smart tactics
  'corrupted-ai': {
    type: 'corrupted-ai',
    name: 'Corrupted AI',
    tier: 3,
    baseLevel: 40,
    baseStats: {
      health: 90,
      attack: 25,
      defense: 12,
    },
    xpReward: 120,
    abilities: ['analyze', 'adapt', 'overwrite'],
    lootTable: [
      { itemId: 'data-fragment', chance: 0.9, minQuantity: 5, maxQuantity: 10 },
      { itemId: 'ai-core', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'rare-equipment', chance: 0.1, minQuantity: 1, maxQuantity: 1 },
    ],
    description: 'An AI gone rogue. Uses adaptive tactics in combat.',
    behavior: 'balanced',
  },

  // Security Protocol - Summons reinforcements
  'security-protocol': {
    type: 'security-protocol',
    name: 'Security Protocol',
    tier: 3,
    baseLevel: 45,
    baseStats: {
      health: 100,
      attack: 18,
      defense: 18,
    },
    xpReward: 150,
    abilities: ['summon-drones', 'lockdown', 'alert'],
    lootTable: [
      { itemId: 'data-fragment', chance: 0.9, minQuantity: 6, maxQuantity: 12 },
      { itemId: 'security-key', chance: 0.25, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'epic-equipment', chance: 0.08, minQuantity: 1, maxQuantity: 1 },
    ],
    description: 'A security system. Can summon reinforcements during battle.',
    behavior: 'defensive',
  },

  // Data Wraith - High evasion
  'data-wraith': {
    type: 'data-wraith',
    name: 'Data Wraith',
    tier: 3,
    baseLevel: 50,
    baseStats: {
      health: 60,
      attack: 30,
      defense: 5,
    },
    xpReward: 140,
    abilities: ['phase', 'drain', 'corrupt'],
    lootTable: [
      { itemId: 'wraith-essence', chance: 0.4, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'data-fragment', chance: 0.8, minQuantity: 5, maxQuantity: 10 },
      { itemId: 'shadow-equipment', chance: 0.12, minQuantity: 1, maxQuantity: 1 },
    ],
    description: 'A ghostly data entity. Hard to hit but fragile.',
    behavior: 'aggressive',
  },

  // ============================================
  // TIER 4 ENEMIES (Level 76-100)
  // ============================================

  // Core Defender - Mini-boss strength
  'core-defender': {
    type: 'core-defender',
    name: 'Core Defender',
    tier: 4,
    baseLevel: 60,
    baseStats: {
      health: 200,
      attack: 35,
      defense: 25,
    },
    xpReward: 300,
    abilities: ['core-blast', 'shield-matrix', 'regenerate'],
    lootTable: [
      { itemId: 'data-fragment', chance: 1.0, minQuantity: 10, maxQuantity: 20 },
      { itemId: 'core-fragment', chance: 0.4, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'legendary-equipment', chance: 0.05, minQuantity: 1, maxQuantity: 1 },
    ],
    description: 'An elite guardian of the core systems. Mini-boss level threat.',
    behavior: 'balanced',
  },

  // Neural Phantom - Unpredictable
  'neural-phantom': {
    type: 'neural-phantom',
    name: 'Neural Phantom',
    tier: 4,
    baseLevel: 70,
    baseStats: {
      health: 150,
      attack: 40,
      defense: 15,
    },
    xpReward: 350,
    abilities: ['mind-fracture', 'ilusion', 'neural-link'],
    lootTable: [
      { itemId: 'phantom-essence', chance: 0.5, minQuantity: 1, maxQuantity: 3 },
      { itemId: 'data-fragment', chance: 1.0, minQuantity: 8, maxQuantity: 15 },
      { itemId: 'neural-core', chance: 0.2, minQuantity: 1, maxQuantity: 1 },
    ],
    description: 'A mysterious neural entity. Attacks are unpredictable.',
    behavior: 'aggressive',
  },

  // The Architect - Rare spawn, legendary loot
  architect: {
    type: 'architect',
    name: 'The Architect',
    tier: 4,
    baseLevel: 80,
    baseStats: {
      health: 500,
      attack: 50,
      defense: 30,
    },
    xpReward: 1000,
    abilities: ['rewrite', 'construct', 'deconstruct', 'matrix-control'],
    lootTable: [
      { itemId: 'data-fragment', chance: 1.0, minQuantity: 20, maxQuantity: 50 },
      { itemId: 'architect-blueprint', chance: 0.8, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'legendary-equipment', chance: 0.25, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'mythic-artifact', chance: 0.05, minQuantity: 1, maxQuantity: 1 },
    ],
    description: 'The legendary Architect. Rarely seen, extremely dangerous.',
    behavior: 'balanced',
  },
}

// ============================================
// ENEMY SPAWNING
// ============================================

/**
 * Create enemy instance from template with level scaling
 */
export function createEnemy(type: EnemyType, level?: number): Enemy {
  const template = ENEMY_TEMPLATES[type]
  const actualLevel = level ?? template.baseLevel

  // Scale stats based on level difference
  const levelMultiplier = 1 + (actualLevel - template.baseLevel) * 0.05

  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    name: template.name,
    tier: template.tier,
    level: actualLevel,
    health: Math.floor(template.baseStats.health * levelMultiplier),
    maxHealth: Math.floor(template.baseStats.health * levelMultiplier),
    attack: Math.floor(template.baseStats.attack * levelMultiplier),
    defense: Math.floor(template.baseStats.defense * levelMultiplier),
    xpReward: Math.floor(template.xpReward * levelMultiplier),
    lootTable: template.lootTable,
    abilities: template.abilities,
  }
}

/**
 * Get random enemy for zone based on row
 */
export function getRandomEnemyForZone(row: number, playerLevel: number): Enemy {
  // Special: The Architect has a chance to spawn in the deep Void
  // 15% chance at row 110+, 25% at row 120+
  if (row >= 110) {
    const architectChance = row >= 120 ? 0.25 : 0.15
    if (Math.random() < architectChance) {
      return createEnemy('architect', 80)
    }
  }

  // Determine appropriate tier based on row
  let tier: EnemyTier
  if (row <= 42) {
    tier = 1
  } else if (row <= 68) {
    tier = 2
  } else if (row <= 95) {
    tier = 3
  } else {
    tier = 4
  }

  // Filter enemies by tier
  const validTypes = Object.entries(ENEMY_TEMPLATES)
    .filter(([_, template]) => template.tier === tier)
    .map(([type]) => type as EnemyType)

  // Pick random type (fallback to data-drone if no valid types)
  const randomType = validTypes[Math.floor(Math.random() * validTypes.length)] ?? 'data-drone'

  // Calculate level based on player level and zone
  const zoneBaseLevel = Math.floor(row / 10) * 5
  const levelVariance = Math.floor(Math.random() * 5) - 2
  const enemyLevel = Math.max(1, Math.min(100, zoneBaseLevel + levelVariance))

  return createEnemy(randomType, enemyLevel)
}

/**
 * Get encounter group for zone
 */
export function generateEncounter(row: number, playerLevel: number): Enemy[] {
  // Determine number of enemies
  const baseCount = Math.random() < 0.3 ? 2 : 1
  const bonusCount = Math.random() < 0.1 ? 1 : 0
  const enemyCount = Math.min(4, baseCount + bonusCount)

  const enemies: Enemy[] = []
  for (let i = 0; i < enemyCount; i++) {
    enemies.push(getRandomEnemyForZone(row, playerLevel))
  }

  return enemies
}

/**
 * Check if enemy should spawn (encounter chance)
 */
export function checkEncounter(row: number, hasEnemies: boolean): boolean {
  if (!hasEnemies) return false

  // Base 12% chance per move - increased for more action
  let chance = 0.12

  // Genesis zone has lower spawn rate (8%) for beginners
  if (row <= 20) {
    chance = 0.08
  }

  // Bitcoin layer and bridge have higher spawn rates (18%)
  if (row === 21 || row === 68 || row === 96) {
    chance = 0.18
  }

  // Deep network has increased spawns (15%)
  if (row > 68 && row < 97) {
    chance = 0.15
  }

  // Void has highest spawn rate (20%) - dangerous!
  if (row > 96) {
    chance = 0.20
  }

  return Math.random() < chance
}

// ============================================
// ENEMY DISPLAY HELPERS
// ============================================

export function getEnemyColor(tier: EnemyTier): string {
  switch (tier) {
    case 1:
      return 'text-gray-400'
    case 2:
      return 'text-blue-400'
    case 3:
      return 'text-purple-400'
    case 4:
      return 'text-orange-400'
  }
}

export function getEnemyBgColor(tier: EnemyTier): string {
  switch (tier) {
    case 1:
      return 'bg-gray-500/20'
    case 2:
      return 'bg-blue-500/20'
    case 3:
      return 'bg-purple-500/20'
    case 4:
      return 'bg-orange-500/20'
  }
}

export function getEnemyIcon(type: EnemyType): string {
  switch (type) {
    case 'data-drone':
      return '🤖'
    case 'firewall':
      return '🛡️'
    case 'bug-swarm':
      return '🐛'
    case 'processor':
      return '💻'
    case 'virus':
      return '🦠'
    case 'guardian':
      return '⚔️'
    case 'corrupted-ai':
      return '🧠'
    case 'security-protocol':
      return '🚨'
    case 'data-wraith':
      return '👻'
    case 'core-defender':
      return '🔒'
    case 'neural-phantom':
      return '💀'
    case 'architect':
      return '👁️'
  }
}
