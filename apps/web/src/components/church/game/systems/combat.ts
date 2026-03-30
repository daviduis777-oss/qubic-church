/**
 * Anna Matrix Explorer - Combat System
 * Turn-based tactical combat on a 5x5 grid
 */

import type { Position, Enemy, CombatState, CombatEnemy, CombatLogEntry, StatusEffect } from '../engine/types'

// ============================================
// COMBAT CONSTANTS
// ============================================

export const COMBAT_GRID_SIZE = 5
export const ESCAPE_ENERGY_COST = 25
export const MAX_COMBAT_LOG_ENTRIES = 50

// ============================================
// COMBAT ACTIONS
// ============================================

export type CombatAction =
  | 'attack'
  | 'defend'
  | 'skill'
  | 'item'
  | 'move'
  | 'escape'

export interface CombatActionResult {
  success: boolean
  damage?: number
  healing?: number
  message: string
  critical?: boolean
  missed?: boolean
  statusApplied?: StatusEffect
  combatEnded?: boolean
  escaped?: boolean
  victory?: boolean
}

// ============================================
// PLAYER COMBAT STATS
// ============================================

export interface PlayerCombatStats {
  health: number
  maxHealth: number
  attackPower: number
  defense: number
  critChance: number
  critDamage: number
  evasion: number
  position: Position
  isDefending: boolean
  cooldowns: Map<string, number>
}

// ============================================
// COMBAT SKILLS
// ============================================

export interface CombatSkill {
  id: string
  name: string
  description: string
  energyCost: number
  cooldown: number // turns
  damage?: number
  healing?: number
  range: number
  aoe: boolean // area of effect
  statusEffect?: StatusEffect
  levelRequired: number
}

export const COMBAT_SKILLS: CombatSkill[] = [
  {
    id: 'quick-strike',
    name: 'Quick Strike',
    description: 'Basic attack with no cooldown',
    energyCost: 0,
    cooldown: 0,
    damage: 1.0, // multiplier
    range: 1,
    aoe: false,
    levelRequired: 1,
  },
  {
    id: 'power-strike',
    name: 'Power Strike',
    description: 'Heavy attack dealing 150% damage',
    energyCost: 15,
    cooldown: 2,
    damage: 1.5,
    range: 1,
    aoe: false,
    levelRequired: 5,
  },
  {
    id: 'scan-weakness',
    name: 'Scan Weakness',
    description: 'Analyze enemy, next attack deals +50% damage',
    energyCost: 10,
    cooldown: 3,
    range: 3,
    aoe: false,
    statusEffect: { type: 'vulnerable', duration: 2, strength: 50 },
    levelRequired: 3,
  },
  {
    id: 'data-burst',
    name: 'Data Burst',
    description: 'AoE attack hitting all adjacent enemies',
    energyCost: 25,
    cooldown: 4,
    damage: 0.75,
    range: 1,
    aoe: true,
    levelRequired: 10,
  },
  {
    id: 'emergency-shield',
    name: 'Emergency Shield',
    description: 'Block 50% damage for 2 turns',
    energyCost: 20,
    cooldown: 5,
    range: 0,
    aoe: false,
    statusEffect: { type: 'shielded', duration: 2, strength: 50 },
    levelRequired: 7,
  },
  {
    id: 'data-drain',
    name: 'Data Drain',
    description: 'Steal HP from enemy (50% of damage dealt)',
    energyCost: 30,
    cooldown: 4,
    damage: 0.8,
    range: 2,
    aoe: false,
    levelRequired: 15,
  },
  {
    id: 'system-override',
    name: 'System Override',
    description: 'Stun enemy for 1 turn',
    energyCost: 35,
    cooldown: 6,
    range: 2,
    aoe: false,
    statusEffect: { type: 'stunned', duration: 1, strength: 100 },
    levelRequired: 20,
  },
]

// ============================================
// COMBAT INITIALIZATION
// ============================================

export function initializeCombat(
  playerStats: PlayerCombatStats,
  enemies: Enemy[]
): CombatState {
  // Place player in center-bottom of grid
  const playerPos: Position = { row: 4, col: 2 }

  // Convert enemies to combat enemies with positions
  const combatEnemies: CombatEnemy[] = enemies.map((enemy, index) => {
    // Distribute enemies in top portion of grid
    const col = index % COMBAT_GRID_SIZE
    const row = Math.floor(index / COMBAT_GRID_SIZE)
    return {
      ...enemy,
      combatPosition: { row, col },
      statusEffects: [],
    }
  })

  return {
    active: true,
    playerPosition: playerPos,
    enemies: combatEnemies,
    turn: 'player',
    turnNumber: 1,
    selectedSkill: null,
    combatLog: [
      {
        turn: 0,
        actor: 'system',
        action: 'Combat started!',
        result: `Facing ${enemies.length} ${enemies.length === 1 ? 'enemy' : 'enemies'}`,
      },
    ],
  }
}

// ============================================
// COMBAT CALCULATIONS
// ============================================

/**
 * Calculate damage with all modifiers
 */
export function calculateDamage(
  baseDamage: number,
  attackPower: number,
  targetDefense: number,
  critChance: number,
  critDamage: number,
  damageMultiplier: number = 1.0,
  vulnerableBonus: number = 0
): { damage: number; critical: boolean } {
  // Roll for critical
  const critical = Math.random() < critChance

  // Base calculation
  let damage = baseDamage + attackPower * damageMultiplier

  // Apply critical
  if (critical) {
    damage *= critDamage
  }

  // Apply vulnerable bonus
  if (vulnerableBonus > 0) {
    damage *= 1 + vulnerableBonus / 100
  }

  // Apply defense reduction
  const defenseReduction = targetDefense / (targetDefense + 50) // Diminishing returns
  damage *= 1 - defenseReduction

  // Minimum damage
  damage = Math.max(1, Math.floor(damage))

  return { damage, critical }
}

/**
 * Check if attack hits (evasion check)
 */
export function checkHit(attackerAccuracy: number, targetEvasion: number): boolean {
  const hitChance = Math.max(0.1, 1 - targetEvasion / 100 + attackerAccuracy / 100)
  return Math.random() < hitChance
}

/**
 * Calculate distance between two positions
 */
export function getDistance(pos1: Position, pos2: Position): number {
  return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col)
}

/**
 * Check if position is valid in combat grid
 */
export function isValidCombatPosition(pos: Position): boolean {
  return (
    pos.row >= 0 &&
    pos.row < COMBAT_GRID_SIZE &&
    pos.col >= 0 &&
    pos.col < COMBAT_GRID_SIZE
  )
}

/**
 * Check if position is occupied by enemy
 */
export function isPositionOccupied(
  pos: Position,
  enemies: CombatEnemy[],
  playerPos: Position
): boolean {
  if (pos.row === playerPos.row && pos.col === playerPos.col) return true
  return enemies.some(
    (e) => e.health > 0 && e.combatPosition.row === pos.row && e.combatPosition.col === pos.col
  )
}

// ============================================
// COMBAT ACTIONS
// ============================================

/**
 * Player basic attack
 */
export function playerAttack(
  target: CombatEnemy,
  playerStats: PlayerCombatStats,
  playerPos: Position
): CombatActionResult {
  // Check range
  const distance = getDistance(playerPos, target.combatPosition)
  if (distance > 1) {
    return {
      success: false,
      message: 'Target out of range!',
    }
  }

  // Check hit
  if (!checkHit(100, 0)) {
    return {
      success: true,
      missed: true,
      message: `Attack missed ${target.name}!`,
    }
  }

  // Calculate damage
  const { damage, critical } = calculateDamage(
    10, // base damage
    playerStats.attackPower,
    target.defense,
    playerStats.critChance,
    playerStats.critDamage
  )

  return {
    success: true,
    damage,
    critical,
    message: critical
      ? `Critical hit! Dealt ${damage} damage to ${target.name}!`
      : `Attacked ${target.name} for ${damage} damage!`,
  }
}

/**
 * Player use skill
 */
export function playerUseSkill(
  skill: CombatSkill,
  target: CombatEnemy | null,
  playerStats: PlayerCombatStats,
  playerPos: Position,
  allEnemies: CombatEnemy[]
): CombatActionResult {
  // Check if targeting required
  if (skill.range > 0 && !target) {
    return {
      success: false,
      message: 'Select a target!',
    }
  }

  // Check range if target required
  if (target && skill.range > 0) {
    const distance = getDistance(playerPos, target.combatPosition)
    if (distance > skill.range) {
      return {
        success: false,
        message: 'Target out of range!',
      }
    }
  }

  // Handle different skill effects
  if (skill.statusEffect && target) {
    return {
      success: true,
      statusApplied: skill.statusEffect,
      message: `Applied ${skill.statusEffect.type} to ${target.name}!`,
    }
  }

  if (skill.damage && target) {
    // Check for vulnerable status on target
    const vulnerableEffect = target.statusEffects.find((s) => s.type === 'vulnerable')
    const vulnerableBonus = vulnerableEffect ? vulnerableEffect.strength : 0

    const { damage, critical } = calculateDamage(
      10 * skill.damage,
      playerStats.attackPower,
      target.defense,
      playerStats.critChance,
      playerStats.critDamage,
      1.0,
      vulnerableBonus
    )

    // Handle lifesteal for data drain
    let healing = 0
    if (skill.id === 'data-drain') {
      healing = Math.floor(damage * 0.5)
    }

    return {
      success: true,
      damage,
      healing,
      critical,
      message: `${skill.name} dealt ${damage} damage to ${target.name}!${healing > 0 ? ` Healed ${healing} HP!` : ''}`,
    }
  }

  // Self-buff skills
  if (skill.statusEffect && skill.range === 0) {
    return {
      success: true,
      statusApplied: skill.statusEffect,
      message: `Used ${skill.name}! ${skill.description}`,
    }
  }

  return {
    success: true,
    message: `Used ${skill.name}!`,
  }
}

/**
 * Player defend action
 */
export function playerDefend(): CombatActionResult {
  return {
    success: true,
    message: 'Defending! Damage reduced by 50% this turn.',
  }
}

/**
 * Player move action
 */
export function playerMove(
  newPos: Position,
  currentPos: Position,
  enemies: CombatEnemy[]
): CombatActionResult {
  if (!isValidCombatPosition(newPos)) {
    return {
      success: false,
      message: 'Invalid position!',
    }
  }

  const distance = getDistance(currentPos, newPos)
  if (distance > 1) {
    return {
      success: false,
      message: 'Can only move 1 tile per turn!',
    }
  }

  if (isPositionOccupied(newPos, enemies, currentPos)) {
    return {
      success: false,
      message: 'Position occupied!',
    }
  }

  return {
    success: true,
    message: `Moved to [${newPos.row}, ${newPos.col}]`,
  }
}

/**
 * Player escape attempt
 */
export function playerEscape(currentEnergy: number): CombatActionResult {
  if (currentEnergy < ESCAPE_ENERGY_COST) {
    return {
      success: false,
      message: `Not enough energy to escape! Need ${ESCAPE_ENERGY_COST}`,
    }
  }

  // 70% base escape chance
  const escaped = Math.random() < 0.7

  return {
    success: true,
    escaped,
    combatEnded: escaped,
    message: escaped ? 'Escaped successfully!' : 'Failed to escape!',
  }
}

// ============================================
// ENEMY AI
// ============================================

export interface EnemyAction {
  type: 'attack' | 'move' | 'skill'
  target?: Position
  skillId?: string
}

/**
 * Basic enemy AI - choose action
 */
export function getEnemyAction(
  enemy: CombatEnemy,
  playerPos: Position,
  allEnemies: CombatEnemy[]
): EnemyAction {
  // Check if stunned
  if (enemy.statusEffects.some((s) => s.type === 'stunned')) {
    return { type: 'move' } // Skip turn effectively
  }

  const distance = getDistance(enemy.combatPosition, playerPos)

  // If adjacent, attack
  if (distance <= 1) {
    return { type: 'attack', target: playerPos }
  }

  // Otherwise, move toward player
  const dx = Math.sign(playerPos.col - enemy.combatPosition.col)
  const dy = Math.sign(playerPos.row - enemy.combatPosition.row)

  // Try horizontal first, then vertical
  let newPos: Position = { row: enemy.combatPosition.row, col: enemy.combatPosition.col + dx }
  if (
    !isValidCombatPosition(newPos) ||
    isPositionOccupied(newPos, allEnemies, playerPos)
  ) {
    newPos = { row: enemy.combatPosition.row + dy, col: enemy.combatPosition.col }
  }

  if (
    isValidCombatPosition(newPos) &&
    !isPositionOccupied(newPos, allEnemies, playerPos)
  ) {
    return { type: 'move', target: newPos }
  }

  // Can't move, stay in place
  return { type: 'move' }
}

/**
 * Execute enemy attack
 */
export function enemyAttack(
  enemy: CombatEnemy,
  playerStats: PlayerCombatStats
): CombatActionResult {
  // Check if enemy is in range (melee = 1 cell)
  const distance = getDistance(enemy.combatPosition, playerStats.position)
  if (distance > 1) {
    return {
      success: false,
      message: `${enemy.name} is too far to attack!`,
    }
  }

  // Check hit (player evasion)
  if (!checkHit(100, playerStats.evasion)) {
    return {
      success: true,
      missed: true,
      message: `${enemy.name}'s attack missed!`,
    }
  }

  // Calculate damage
  let defense = playerStats.defense
  if (playerStats.isDefending) {
    defense *= 1.5 // 50% more effective defense
  }

  // Check for shield status
  const shieldEffect = playerStats.cooldowns.get('shielded')
  let damageReduction = 0
  if (shieldEffect && shieldEffect > 0) {
    damageReduction = 50
  }

  const baseDamage = enemy.attack
  let damage = Math.max(1, baseDamage - defense / 2)

  if (damageReduction > 0) {
    damage = Math.floor(damage * (1 - damageReduction / 100))
  }

  if (playerStats.isDefending) {
    damage = Math.floor(damage * 0.5)
  }

  return {
    success: true,
    damage,
    message: `${enemy.name} dealt ${damage} damage!`,
  }
}

// ============================================
// COMBAT REWARDS
// ============================================

export interface CombatRewards {
  xp: number
  points: number
  items: string[]
}

export function calculateCombatRewards(defeatedEnemies: CombatEnemy[]): CombatRewards {
  let xp = 0
  let points = 0
  const items: string[] = []

  for (const enemy of defeatedEnemies) {
    xp += enemy.xpReward
    points += enemy.xpReward * 2

    // Roll for loot
    for (const loot of enemy.lootTable) {
      if (Math.random() < loot.chance) {
        const quantity =
          loot.minQuantity +
          Math.floor(Math.random() * (loot.maxQuantity - loot.minQuantity + 1))
        for (let i = 0; i < quantity; i++) {
          items.push(loot.itemId)
        }
      }
    }
  }

  return { xp, points, items }
}

// ============================================
// STATUS EFFECT PROCESSING
// ============================================

export function processStatusEffects(effects: StatusEffect[]): StatusEffect[] {
  return effects
    .map((effect) => ({
      ...effect,
      duration: effect.duration - 1,
    }))
    .filter((effect) => effect.duration > 0)
}

// ============================================
// COMBAT STATE HELPERS
// ============================================

export function isCombatOver(enemies: CombatEnemy[]): { over: boolean; victory: boolean } {
  const allDead = enemies.every((e) => e.health <= 0)
  return { over: allDead, victory: allDead }
}

export function addCombatLog(
  combatLog: CombatLogEntry[],
  turn: number,
  actor: string,
  action: string,
  result: string
): CombatLogEntry[] {
  const newLog = [...combatLog, { turn, actor, action, result }]
  // Keep only last N entries
  if (newLog.length > MAX_COMBAT_LOG_ENTRIES) {
    return newLog.slice(-MAX_COMBAT_LOG_ENTRIES)
  }
  return newLog
}
