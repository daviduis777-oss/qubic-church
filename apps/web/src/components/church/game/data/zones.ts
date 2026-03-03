/**
 * Anna Matrix Explorer - Zone Definitions
 * Defines all zones in the 128×128 matrix
 */

import type { Zone, ZoneId } from '../engine/types'

export const ZONES: Record<ZoneId, Zone> = {
  genesis: {
    id: 'genesis',
    name: 'Genesis Zone',
    description: 'The origin of all data. Weak enemies roam here.',
    startRow: 0,
    endRow: 20,
    color: 'blue',
    bgColor: 'bg-blue-500/30',
    levelRequirement: 1,
    hasEnemies: true,
  },
  'bitcoin-layer': {
    id: 'bitcoin-layer',
    name: 'Bitcoin Input Layer',
    description: 'Row 21 - Where Bitcoin data enters the neural network.',
    startRow: 21,
    endRow: 21,
    color: 'orange',
    bgColor: 'bg-orange-500/40',
    levelRequirement: 5,
    hasEnemies: true,
  },
  'shallow-network': {
    id: 'shallow-network',
    name: 'Shallow Network',
    description: 'The first processing layers. Basic computations happen here.',
    startRow: 22,
    endRow: 42,
    color: 'cyan',
    bgColor: 'bg-cyan-500/20',
    levelRequirement: 10,
    hasEnemies: true,
  },
  'processing-core': {
    id: 'processing-core',
    name: 'Processing Core',
    description: 'The heart of the matrix. Complex transformations occur here.',
    startRow: 43,
    endRow: 67,
    color: 'slate',
    bgColor: 'bg-slate-500/20',
    levelRequirement: 20,
    hasEnemies: true,
  },
  'cortex-bridge': {
    id: 'cortex-bridge',
    name: 'Cortex Bridge',
    description: 'Row 68 - The transformation layer between systems. Boss territory.',
    startRow: 68,
    endRow: 68,
    color: 'purple',
    bgColor: 'bg-purple-500/40',
    levelRequirement: 35,
    hasEnemies: true,
  },
  'deep-network': {
    id: 'deep-network',
    name: 'Deep Network',
    description: 'Hidden layer processing. Only the skilled venture here.',
    startRow: 69,
    endRow: 95,
    color: 'indigo',
    bgColor: 'bg-indigo-500/25',
    levelRequirement: 50,
    hasEnemies: true,
  },
  'output-layer': {
    id: 'output-layer',
    name: 'Output Layer',
    description: 'Row 96 - The 4 decision neurons that control everything.',
    startRow: 96,
    endRow: 96,
    color: 'green',
    bgColor: 'bg-green-500/40',
    levelRequirement: 75,
    hasEnemies: true,
  },
  void: {
    id: 'void',
    name: 'The Void',
    description: 'Unexplored territory. Only accessible during special events.',
    startRow: 97,
    endRow: 127,
    color: 'zinc',
    bgColor: 'bg-zinc-900/50',
    levelRequirement: 100,
    hasEnemies: true,
  },
}

/**
 * Get zone for a given row number
 */
export function getZoneForRow(row: number): Zone | null {
  for (const zone of Object.values(ZONES)) {
    if (row >= zone.startRow && row <= zone.endRow) {
      return zone
    }
  }
  return null
}

/**
 * Get zone by ID
 */
export function getZoneById(id: ZoneId): Zone | null {
  return ZONES[id] || null
}

/**
 * Check if player meets level requirement for zone
 */
export function canEnterZone(zone: Zone, playerLevel: number): boolean {
  return playerLevel >= zone.levelRequirement
}

/**
 * Get zone color class for Tailwind
 */
export function getZoneColorClass(zone: Zone): string {
  switch (zone.color) {
    case 'blue':
      return 'text-blue-400'
    case 'orange':
      return 'text-orange-400'
    case 'cyan':
      return 'text-cyan-400'
    case 'slate':
      return 'text-slate-400'
    case 'purple':
      return 'text-purple-400'
    case 'indigo':
      return 'text-indigo-400'
    case 'green':
      return 'text-green-400'
    case 'zinc':
      return 'text-zinc-400'
    default:
      return 'text-white'
  }
}

/**
 * Get all zones as array sorted by start row
 */
export function getAllZones(): Zone[] {
  return Object.values(ZONES).sort((a, b) => a.startRow - b.startRow)
}
