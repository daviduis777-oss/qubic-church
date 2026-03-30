/**
 * Anna Matrix Explorer - Gathering System
 * Resource harvesting mechanics, tool requirements, and yields
 */

import type { Position, PlayerStats, InventoryItem } from '../engine/types'
import {
  type ResourceNode,
  type ResourceType,
  type ResourceDefinition,
  RESOURCES,
  getResource,
  hasRespawned,
  respawnNode,
} from '../data/resources'
import { CRAFTED_ITEMS, getCraftedItem } from '../data/recipes'

// ============================================
// GATHERING TYPES
// ============================================

export interface GatherResult {
  success: boolean
  message: string
  resourceType?: ResourceType
  quantity?: number
  energyUsed: number
  xpGained?: number
  toolDamage?: number
  nodeUpdated?: ResourceNode
  bonusDrops?: { itemId: string; quantity: number }[]
}

export interface GatherRequirements {
  canGather: boolean
  reason?: string
  energyCost: number
  toolRequired?: string
  hasTool: boolean
}

// ============================================
// GATHERING FUNCTIONS
// ============================================

/**
 * Check if player can gather from a resource node
 */
export function checkGatherRequirements(
  node: ResourceNode,
  playerEnergy: number,
  equippedTool: string | null,
  inventory: InventoryItem[]
): GatherRequirements {
  const resource = getResource(node.type)

  // Check if node is depleted
  if (node.depleted || node.quantity <= 0) {
    // Check if it can respawn
    if (hasRespawned(node)) {
      // Node will be respawned when gathered
    } else {
      return {
        canGather: false,
        reason: 'Resource depleted. Wait for respawn.',
        energyCost: resource.energyCost,
        toolRequired: resource.requiredTool,
        hasTool: false,
      }
    }
  }

  // Check energy
  if (playerEnergy < resource.energyCost) {
    return {
      canGather: false,
      reason: `Not enough energy. Need ${resource.energyCost}.`,
      energyCost: resource.energyCost,
      toolRequired: resource.requiredTool,
      hasTool: true,
    }
  }

  // Check tool requirement
  if (resource.requiredTool) {
    const hasTool = equippedTool === resource.requiredTool ||
      inventory.some(item => item.id === resource.requiredTool)

    if (!hasTool) {
      const toolDef = getCraftedItem(resource.requiredTool)
      return {
        canGather: false,
        reason: `Requires ${toolDef?.name || resource.requiredTool} to harvest.`,
        energyCost: resource.energyCost,
        toolRequired: resource.requiredTool,
        hasTool: false,
      }
    }
  }

  return {
    canGather: true,
    energyCost: resource.energyCost,
    toolRequired: resource.requiredTool,
    hasTool: true,
  }
}

/**
 * Calculate yield based on player stats and tools
 */
export function calculateYield(
  resource: ResourceDefinition,
  playerLevel: number,
  scanPower: number,
  equippedTool: string | null
): number {
  let baseYield = resource.baseYield

  // Level bonus: +1% per level
  const levelBonus = 1 + (playerLevel * 0.01)

  // Scan power bonus: +5% per scan power
  const scanBonus = 1 + (scanPower * 0.05)

  // Tool bonus
  let toolBonus = 1
  if (equippedTool) {
    const tool = getCraftedItem(equippedTool)
    if (tool?.toolPower) {
      toolBonus = 1 + (tool.toolPower * 0.1)
    }
  }

  // Random variance: 80%-120%
  const variance = 0.8 + (Math.random() * 0.4)

  const finalYield = Math.floor(baseYield * levelBonus * scanBonus * toolBonus * variance)

  // Ensure at least 1, cap at max
  return Math.max(1, Math.min(resource.maxYield, finalYield))
}

/**
 * Calculate XP gained from gathering
 */
export function calculateGatherXP(
  resource: ResourceDefinition,
  quantity: number
): number {
  const baseXP = resource.tier * 5
  return baseXP * quantity
}

/**
 * Check for bonus drops (rare materials)
 */
export function checkBonusDrops(
  resource: ResourceDefinition,
  playerLevel: number
): { itemId: string; quantity: number }[] {
  const drops: { itemId: string; quantity: number }[] = []

  // 5% chance for bonus drop based on tier
  if (Math.random() < 0.05) {
    // Higher tier resources can drop lower tier materials
    if (resource.tier >= 3 && Math.random() < 0.3) {
      drops.push({ itemId: 'bio-gel', quantity: 1 })
    }
    if (resource.tier >= 4 && Math.random() < 0.2) {
      drops.push({ itemId: 'crystal-shard', quantity: 1 })
    }
  }

  return drops
}

/**
 * Perform gathering action on a resource node
 */
export function gatherResource(
  node: ResourceNode,
  playerStats: PlayerStats,
  playerEnergy: number,
  equippedTool: string | null,
  inventory: InventoryItem[]
): GatherResult {
  // Check requirements
  const requirements = checkGatherRequirements(node, playerEnergy, equippedTool, inventory)

  if (!requirements.canGather) {
    return {
      success: false,
      message: requirements.reason || 'Cannot gather this resource.',
      energyUsed: 0,
    }
  }

  const resource = getResource(node.type)

  // Handle respawn if needed
  let currentNode = node
  if (node.depleted && hasRespawned(node)) {
    currentNode = respawnNode(node)
  }

  // Calculate yield
  const yield_ = calculateYield(
    resource,
    playerStats.level,
    playerStats.scanPower,
    equippedTool
  )

  // Ensure we don't harvest more than available
  const actualYield = Math.min(yield_, currentNode.quantity)

  // Calculate XP
  const xpGained = calculateGatherXP(resource, actualYield)

  // Check for bonus drops
  const bonusDrops = checkBonusDrops(resource, playerStats.level)

  // Update node
  const newQuantity = currentNode.quantity - actualYield
  const updatedNode: ResourceNode = {
    ...currentNode,
    quantity: newQuantity,
    depleted: newQuantity <= 0,
    lastHarvested: Date.now(),
  }

  // Tool durability damage
  let toolDamage = 0
  if (equippedTool) {
    const tool = getCraftedItem(equippedTool)
    if (tool?.toolDurability) {
      toolDamage = 1 // 1 durability per use
    }
  }

  return {
    success: true,
    message: `Gathered ${actualYield} ${resource.name}${bonusDrops.length > 0 ? ' + bonus!' : ''}`,
    resourceType: node.type,
    quantity: actualYield,
    energyUsed: resource.energyCost,
    xpGained,
    toolDamage,
    nodeUpdated: updatedNode,
    bonusDrops: bonusDrops.length > 0 ? bonusDrops : undefined,
  }
}

/**
 * Find resource node at position
 */
export function findResourceNodeAt(
  position: Position,
  nodes: ResourceNode[]
): ResourceNode | undefined {
  return nodes.find(n =>
    n.position.row === position.row &&
    n.position.col === position.col
  )
}

/**
 * Get nearby resource nodes within radius
 */
export function getNearbyResources(
  position: Position,
  nodes: ResourceNode[],
  radius: number
): ResourceNode[] {
  return nodes.filter(n => {
    const distance = Math.abs(n.position.row - position.row) +
      Math.abs(n.position.col - position.col)
    return distance <= radius && !n.depleted
  })
}

/**
 * Update all resource nodes (handle respawns)
 */
export function updateResourceNodes(nodes: ResourceNode[]): ResourceNode[] {
  return nodes.map(node => {
    if (node.depleted && hasRespawned(node)) {
      return respawnNode(node)
    }
    return node
  })
}

/**
 * Get resource node display info
 */
export function getResourceNodeDisplay(node: ResourceNode): {
  icon: string
  color: string
  glowColor: string
  depleted: boolean
  respawnProgress: number
} {
  const resource = getResource(node.type)

  let respawnProgress = 0
  if (node.depleted) {
    const elapsed = Date.now() - node.lastHarvested
    respawnProgress = Math.min(1, elapsed / resource.respawnTime)
  }

  // Glow colors by tier
  const glowColors = {
    1: 'rgba(34, 211, 238, 0.5)',  // cyan
    2: 'rgba(74, 222, 128, 0.5)',  // green
    3: 'rgba(96, 165, 250, 0.5)',  // blue
    4: 'rgba(192, 132, 252, 0.5)', // purple
    5: 'rgba(251, 146, 60, 0.5)',  // orange
  }

  return {
    icon: resource.icon,
    color: resource.color,
    glowColor: glowColors[resource.tier as keyof typeof glowColors],
    depleted: node.depleted,
    respawnProgress,
  }
}

/**
 * Format respawn time remaining
 */
export function formatRespawnTime(node: ResourceNode): string {
  if (!node.depleted) return ''

  const resource = getResource(node.type)
  const elapsed = Date.now() - node.lastHarvested
  const remaining = Math.max(0, resource.respawnTime - elapsed)

  if (remaining <= 0) return 'Ready!'

  const seconds = Math.ceil(remaining / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.ceil(seconds / 60)
  return `${minutes}m`
}
