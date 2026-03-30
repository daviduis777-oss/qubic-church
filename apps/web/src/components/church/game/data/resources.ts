/**
 * Anna Matrix Explorer - Resource System
 * Resource types, spawn positions, and gathering mechanics
 */

import type { Position, ZoneId } from '../engine/types'

// ============================================
// RESOURCE TYPES
// ============================================

export type ResourceType =
  // Tier 1 - Genesis Zone (Rows 0-20)
  | 'data-fiber'      // Basic organic material
  | 'bio-gel'         // Healing component
  // Tier 2 - Shallow Network (Rows 22-42)
  | 'silicon-ore'     // Basic mineral
  | 'copper-wire'     // Electronic component
  // Tier 3 - Processing Core (Rows 43-67)
  | 'crystal-shard'   // Energy storage
  | 'nano-tube'       // Advanced construction
  // Tier 4 - Deep Network (Rows 69-95)
  | 'circuit-board'   // Electronic crafting
  | 'quantum-dust'    // Rare material
  // Tier 5 - Void (Rows 97-127)
  | 'void-essence'    // Exotic material
  | 'architect-alloy' // Legendary material

export type ResourceTier = 1 | 2 | 3 | 4 | 5

export interface ResourceDefinition {
  type: ResourceType
  name: string
  description: string
  tier: ResourceTier
  icon: string
  color: string
  energyCost: number       // Energy to harvest
  baseYield: number        // Base amount per harvest
  maxYield: number         // Max with bonuses
  respawnTime: number      // Milliseconds
  requiredTool?: string    // Tool needed (null = hands)
  zones: ZoneId[]          // Where it spawns
  rarity: number           // 0-1, affects spawn density
}

export interface ResourceNode {
  id: string
  type: ResourceType
  position: Position
  quantity: number         // Current harvestable amount
  maxQuantity: number      // Max capacity
  lastHarvested: number    // Timestamp
  depleted: boolean        // True if quantity = 0
}

// ============================================
// RESOURCE DEFINITIONS
// ============================================

export const RESOURCES: Record<ResourceType, ResourceDefinition> = {
  // ========== TIER 1 - Genesis ==========
  'data-fiber': {
    type: 'data-fiber',
    name: 'Data Fiber',
    description: 'Basic organic data strands. Used in many simple recipes.',
    tier: 1,
    icon: '🧬',
    color: 'text-cyan-400',
    energyCost: 5,
    baseYield: 2,
    maxYield: 5,
    respawnTime: 30000, // 30 seconds
    zones: ['genesis', 'shallow-network'],
    rarity: 0.8,
  },
  'bio-gel': {
    type: 'bio-gel',
    name: 'Bio Gel',
    description: 'Organic healing compound. Essential for consumables.',
    tier: 1,
    icon: '💧',
    color: 'text-green-400',
    energyCost: 8,
    baseYield: 1,
    maxYield: 3,
    respawnTime: 45000, // 45 seconds
    zones: ['genesis', 'shallow-network'],
    rarity: 0.5,
  },

  // ========== TIER 2 - Shallow Network ==========
  'silicon-ore': {
    type: 'silicon-ore',
    name: 'Silicon Ore',
    description: 'Raw silicon crystals. Base material for tools and electronics.',
    tier: 2,
    icon: '💎',
    color: 'text-slate-300',
    energyCost: 10,
    baseYield: 2,
    maxYield: 4,
    respawnTime: 60000, // 1 minute
    requiredTool: 'basic-pickaxe',
    zones: ['shallow-network', 'processing-core'],
    rarity: 0.6,
  },
  'copper-wire': {
    type: 'copper-wire',
    name: 'Copper Wire',
    description: 'Conductive wiring. Used in electronics and circuits.',
    tier: 2,
    icon: '🔌',
    color: 'text-orange-400',
    energyCost: 8,
    baseYield: 3,
    maxYield: 6,
    respawnTime: 45000,
    zones: ['shallow-network', 'processing-core'],
    rarity: 0.5,
  },

  // ========== TIER 3 - Processing Core ==========
  'crystal-shard': {
    type: 'crystal-shard',
    name: 'Crystal Shard',
    description: 'Energy-infused crystals. Powers advanced equipment.',
    tier: 3,
    icon: '✨',
    color: 'text-purple-400',
    energyCost: 15,
    baseYield: 1,
    maxYield: 3,
    respawnTime: 90000, // 1.5 minutes
    requiredTool: 'advanced-pickaxe',
    zones: ['processing-core', 'cortex-bridge'],
    rarity: 0.4,
  },
  'nano-tube': {
    type: 'nano-tube',
    name: 'Nano Tube',
    description: 'Microscopic carbon structures. Incredibly strong.',
    tier: 3,
    icon: '🔬',
    color: 'text-blue-400',
    energyCost: 12,
    baseYield: 2,
    maxYield: 4,
    respawnTime: 75000,
    requiredTool: 'basic-pickaxe',
    zones: ['processing-core', 'deep-network'],
    rarity: 0.45,
  },

  // ========== TIER 4 - Deep Network ==========
  'circuit-board': {
    type: 'circuit-board',
    name: 'Circuit Board',
    description: 'Complex circuitry. Required for advanced electronics.',
    tier: 4,
    icon: '🖥️',
    color: 'text-emerald-400',
    energyCost: 18,
    baseYield: 1,
    maxYield: 2,
    respawnTime: 120000, // 2 minutes
    requiredTool: 'advanced-pickaxe',
    zones: ['deep-network', 'output-layer'],
    rarity: 0.3,
  },
  'quantum-dust': {
    type: 'quantum-dust',
    name: 'Quantum Dust',
    description: 'Particles existing in superposition. Extremely rare.',
    tier: 4,
    icon: '⚛️',
    color: 'text-pink-400',
    energyCost: 25,
    baseYield: 1,
    maxYield: 2,
    respawnTime: 180000, // 3 minutes
    requiredTool: 'quantum-extractor',
    zones: ['cortex-bridge', 'deep-network'],
    rarity: 0.15,
  },

  // ========== TIER 5 - Void ==========
  'void-essence': {
    type: 'void-essence',
    name: 'Void Essence',
    description: 'Pure emptiness condensed. Unknown properties.',
    tier: 5,
    icon: '🌑',
    color: 'text-violet-500',
    energyCost: 30,
    baseYield: 1,
    maxYield: 1,
    respawnTime: 300000, // 5 minutes
    requiredTool: 'void-harvester',
    zones: ['void'],
    rarity: 0.1,
  },
  'architect-alloy': {
    type: 'architect-alloy',
    name: 'Architect Alloy',
    description: 'Material from The Architect. Legendary crafting component.',
    tier: 5,
    icon: '👁️',
    color: 'text-amber-400',
    energyCost: 35,
    baseYield: 1,
    maxYield: 1,
    respawnTime: 600000, // 10 minutes
    requiredTool: 'void-harvester',
    zones: ['void'],
    rarity: 0.05,
  },
}

// ============================================
// SPAWN CONFIGURATION
// ============================================

export interface SpawnConfig {
  zone: ZoneId
  resourceTypes: ResourceType[]
  density: number      // Nodes per 100 cells
  minDistance: number  // Min distance between nodes
}

export const SPAWN_CONFIGS: SpawnConfig[] = [
  {
    zone: 'genesis',
    resourceTypes: ['data-fiber', 'bio-gel'],
    density: 8,
    minDistance: 5,
  },
  {
    zone: 'shallow-network',
    resourceTypes: ['data-fiber', 'bio-gel', 'silicon-ore', 'copper-wire'],
    density: 6,
    minDistance: 6,
  },
  {
    zone: 'processing-core',
    resourceTypes: ['silicon-ore', 'copper-wire', 'crystal-shard', 'nano-tube'],
    density: 5,
    minDistance: 7,
  },
  {
    zone: 'cortex-bridge',
    resourceTypes: ['crystal-shard', 'quantum-dust'],
    density: 3,
    minDistance: 8,
  },
  {
    zone: 'deep-network',
    resourceTypes: ['nano-tube', 'circuit-board', 'quantum-dust'],
    density: 4,
    minDistance: 8,
  },
  {
    zone: 'output-layer',
    resourceTypes: ['circuit-board', 'quantum-dust'],
    density: 3,
    minDistance: 10,
  },
  {
    zone: 'void',
    resourceTypes: ['void-essence', 'architect-alloy'],
    density: 2,
    minDistance: 15,
  },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get resource definition by type
 */
export function getResource(type: ResourceType): ResourceDefinition {
  return RESOURCES[type]
}

/**
 * Get all resources for a zone
 */
export function getResourcesForZone(zone: ZoneId): ResourceDefinition[] {
  return Object.values(RESOURCES).filter(r => r.zones.includes(zone))
}

/**
 * Get resources by tier
 */
export function getResourcesByTier(tier: ResourceTier): ResourceDefinition[] {
  return Object.values(RESOURCES).filter(r => r.tier === tier)
}

/**
 * Create a resource node at position
 */
export function createResourceNode(
  type: ResourceType,
  position: Position
): ResourceNode {
  const def = RESOURCES[type]
  return {
    id: `${type}-${position.row}-${position.col}-${Date.now()}`,
    type,
    position,
    quantity: def.baseYield + Math.floor(Math.random() * (def.maxYield - def.baseYield + 1)),
    maxQuantity: def.maxYield,
    lastHarvested: 0,
    depleted: false,
  }
}

/**
 * Check if resource node has respawned
 */
export function hasRespawned(node: ResourceNode): boolean {
  if (!node.depleted) return false
  const def = RESOURCES[node.type]
  return Date.now() - node.lastHarvested >= def.respawnTime
}

/**
 * Respawn a depleted node
 */
export function respawnNode(node: ResourceNode): ResourceNode {
  const def = RESOURCES[node.type]
  return {
    ...node,
    quantity: def.baseYield + Math.floor(Math.random() * (def.maxYield - def.baseYield + 1)),
    depleted: false,
  }
}

/**
 * Get color class for resource tier
 */
export function getResourceTierColor(tier: ResourceTier): string {
  switch (tier) {
    case 1: return 'text-gray-400'
    case 2: return 'text-green-400'
    case 3: return 'text-blue-400'
    case 4: return 'text-purple-400'
    case 5: return 'text-orange-400'
  }
}

/**
 * Get background class for resource tier
 */
export function getResourceTierBg(tier: ResourceTier): string {
  switch (tier) {
    case 1: return 'bg-gray-500/20'
    case 2: return 'bg-green-500/20'
    case 3: return 'bg-blue-500/20'
    case 4: return 'bg-purple-500/20'
    case 5: return 'bg-orange-500/20'
  }
}

/**
 * Generate resource nodes for the world
 * Called once on world initialization
 */
export function generateWorldResources(
  getZoneForRow: (row: number) => { id: ZoneId } | undefined
): ResourceNode[] {
  const nodes: ResourceNode[] = []
  const usedPositions = new Set<string>()

  // Generate nodes for each zone
  for (const config of SPAWN_CONFIGS) {
    // Calculate zone bounds (approximate based on zone)
    let startRow = 0
    let endRow = 127

    // Simple zone row mapping
    switch (config.zone) {
      case 'genesis': startRow = 0; endRow = 20; break
      case 'bitcoin-layer': startRow = 21; endRow = 21; break
      case 'shallow-network': startRow = 22; endRow = 42; break
      case 'processing-core': startRow = 43; endRow = 67; break
      case 'cortex-bridge': startRow = 68; endRow = 68; break
      case 'deep-network': startRow = 69; endRow = 95; break
      case 'output-layer': startRow = 96; endRow = 96; break
      case 'void': startRow = 97; endRow = 127; break
    }

    // Calculate number of nodes based on density
    const zoneArea = (endRow - startRow + 1) * 128
    const nodeCount = Math.floor((zoneArea / 100) * config.density)

    // Generate nodes
    for (let i = 0; i < nodeCount; i++) {
      // Pick random resource type from zone's available types
      const resourceType = config.resourceTypes[
        Math.floor(Math.random() * config.resourceTypes.length)
      ]

      // Skip if no resource type available
      if (!resourceType) continue

      // Find valid position
      let attempts = 0
      while (attempts < 50) {
        const row = startRow + Math.floor(Math.random() * (endRow - startRow + 1))
        const col = Math.floor(Math.random() * 128)
        const posKey = `${row},${col}`

        // Check distance from other nodes
        let validPosition = true
        if (usedPositions.has(posKey)) {
          validPosition = false
        } else {
          for (const existingPos of usedPositions) {
            const parts = existingPos.split(',').map(Number)
            const eRow = parts[0] ?? 0
            const eCol = parts[1] ?? 0
            const distance = Math.abs(row - eRow) + Math.abs(col - eCol)
            if (distance < config.minDistance) {
              validPosition = false
              break
            }
          }
        }

        if (validPosition) {
          usedPositions.add(posKey)
          nodes.push(createResourceNode(resourceType, { row, col }))
          break
        }

        attempts++
      }
    }
  }

  return nodes
}
