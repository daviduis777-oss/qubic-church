/**
 * Anna Matrix Explorer - Crafting System
 * Recipe validation, material consumption, and item creation
 */

import type { InventoryItem, PlayerStats } from '../engine/types'
import {
  type Recipe,
  type RecipeIngredient,
  type RecipeCategory,
  type CraftedItem,
  RECIPES,
  CRAFTED_ITEMS,
  getRecipe,
  getCraftedItem,
  getAvailableRecipes,
  canCraftRecipe,
  getMissingIngredients,
} from '../data/recipes'
import { RESOURCES, type ResourceType } from '../data/resources'

// ============================================
// CRAFTING TYPES
// ============================================

export interface CraftingState {
  isActive: boolean
  currentRecipe: Recipe | null
  progress: number           // 0-100
  startTime: number | null
  queue: Recipe[]
}

export interface CraftResult {
  success: boolean
  message: string
  item?: InventoryItem
  energyUsed: number
  xpGained?: number
  materialsConsumed?: { itemId: string; quantity: number }[]
}

export interface CraftRequirements {
  canCraft: boolean
  reason?: string
  missingMaterials: RecipeIngredient[]
  energyCost: number
  hasEnergy: boolean
  levelRequired: number
  meetsLevel: boolean
}

// ============================================
// CRAFTING FUNCTIONS
// ============================================

/**
 * Check if player can craft a recipe
 */
export function checkCraftRequirements(
  recipe: Recipe,
  inventory: Map<string, number>,
  playerLevel: number,
  playerEnergy: number
): CraftRequirements {
  // Check level requirement
  const meetsLevel = playerLevel >= recipe.levelRequired

  // Check energy
  const hasEnergy = playerEnergy >= recipe.energyCost

  // Check materials
  const missingMaterials = getMissingIngredients(recipe, inventory)
  const hasMaterials = missingMaterials.length === 0

  // Determine overall can craft
  const canCraft = meetsLevel && hasEnergy && hasMaterials

  // Build reason message if can't craft
  let reason: string | undefined
  if (!meetsLevel) {
    reason = `Requires level ${recipe.levelRequired}.`
  } else if (!hasEnergy) {
    reason = `Not enough energy. Need ${recipe.energyCost}.`
  } else if (!hasMaterials) {
    const missing = missingMaterials.map(m => {
      const name = getItemName(m.itemId)
      return `${name} x${m.quantity}`
    }).join(', ')
    reason = `Missing: ${missing}`
  }

  return {
    canCraft,
    reason,
    missingMaterials,
    energyCost: recipe.energyCost,
    hasEnergy,
    levelRequired: recipe.levelRequired,
    meetsLevel,
  }
}

/**
 * Get display name for an item (resource or crafted)
 */
export function getItemName(itemId: string): string {
  // Check resources first
  if (itemId in RESOURCES) {
    return RESOURCES[itemId as ResourceType].name
  }

  // Check crafted items
  const craftedItem = getCraftedItem(itemId)
  if (craftedItem) {
    return craftedItem.name
  }

  // Fallback to ID
  return itemId
}

/**
 * Get display icon for an item
 */
export function getItemIcon(itemId: string): string {
  // Check resources first
  if (itemId in RESOURCES) {
    return RESOURCES[itemId as ResourceType].icon
  }

  // Check crafted items
  const craftedItem = getCraftedItem(itemId)
  if (craftedItem) {
    return craftedItem.icon
  }

  return '?'
}

/**
 * Start crafting a recipe (instant craft for now)
 */
export function craftRecipe(
  recipe: Recipe,
  inventory: Map<string, number>,
  playerLevel: number,
  playerEnergy: number
): CraftResult {
  // Check requirements
  const requirements = checkCraftRequirements(recipe, inventory, playerLevel, playerEnergy)

  if (!requirements.canCraft) {
    return {
      success: false,
      message: requirements.reason || 'Cannot craft this recipe.',
      energyUsed: 0,
    }
  }

  // Consume materials
  const materialsConsumed: { itemId: string; quantity: number }[] = []
  for (const ingredient of recipe.ingredients) {
    materialsConsumed.push({
      itemId: ingredient.itemId,
      quantity: ingredient.quantity,
    })
  }

  // Get the output item definition
  const outputDef = getCraftedItem(recipe.outputId)

  // Create the output item
  const outputItem: InventoryItem = {
    id: `${recipe.outputId}-${Date.now()}`,
    itemId: recipe.outputId,
    name: outputDef?.name || recipe.name,
    type: mapCategoryToItemType(recipe.category),
    rarity: outputDef?.rarity || 'common',
    quantity: recipe.outputQuantity,
    stackable: outputDef?.stackable || false,
    maxStack: outputDef?.maxStack || 1,
    description: outputDef?.description || recipe.description,
    icon: recipe.icon,
    // Copy stat bonuses if applicable
    attackBonus: outputDef?.attackBonus,
    defenseBonus: outputDef?.defenseBonus,
    healthBonus: outputDef?.healthBonus,
    critBonus: outputDef?.critBonus,
    healAmount: outputDef?.healAmount,
    energyRestore: outputDef?.energyRestore,
  }

  // Calculate XP (based on recipe level and tier)
  const xpGained = Math.floor(recipe.levelRequired * 5 + recipe.craftTime / 1000)

  return {
    success: true,
    message: `Crafted ${recipe.outputQuantity}x ${recipe.name}!`,
    item: outputItem,
    energyUsed: recipe.energyCost,
    xpGained,
    materialsConsumed,
  }
}

/**
 * Map recipe category to inventory item type
 */
function mapCategoryToItemType(category: RecipeCategory): InventoryItem['type'] {
  switch (category) {
    case 'tools': return 'module' // Tools use module slot for now
    case 'weapons': return 'weapon'
    case 'armor': return 'armor'
    case 'consumables': return 'consumable'
    case 'materials': return 'material'
    case 'modules': return 'module'
    default: return 'material'
  }
}

/**
 * Get crafting progress percentage for timed crafting
 */
export function getCraftingProgress(state: CraftingState): number {
  if (!state.isActive || !state.currentRecipe || !state.startTime) {
    return 0
  }

  const elapsed = Date.now() - state.startTime
  const progress = (elapsed / state.currentRecipe.craftTime) * 100

  return Math.min(100, progress)
}

/**
 * Check if crafting is complete
 */
export function isCraftingComplete(state: CraftingState): boolean {
  if (!state.isActive || !state.currentRecipe || !state.startTime) {
    return false
  }

  const elapsed = Date.now() - state.startTime
  return elapsed >= state.currentRecipe.craftTime
}

/**
 * Get recipe suggestions based on inventory
 */
export function getRecipeSuggestions(
  inventory: Map<string, number>,
  playerLevel: number,
  limit: number = 5
): Recipe[] {
  // Get all available recipes
  const available = getAvailableRecipes(playerLevel)

  // Score recipes by how close player is to crafting them
  const scored = available.map(recipe => {
    const missing = getMissingIngredients(recipe, inventory)
    const missingCount = missing.reduce((sum, m) => sum + m.quantity, 0)
    const totalRequired = recipe.ingredients.reduce((sum, i) => sum + i.quantity, 0)

    // Calculate completion percentage
    const completion = totalRequired > 0
      ? (totalRequired - missingCount) / totalRequired
      : 0

    return { recipe, completion, missingCount }
  })

  // Sort by completion (highest first), then by missing count
  scored.sort((a, b) => {
    if (b.completion !== a.completion) {
      return b.completion - a.completion
    }
    return a.missingCount - b.missingCount
  })

  // Return top recipes that aren't 0% completion
  return scored
    .filter(s => s.completion > 0)
    .slice(0, limit)
    .map(s => s.recipe)
}

/**
 * Get all recipes that use a specific material
 */
export function getRecipesUsingMaterial(itemId: string): Recipe[] {
  return RECIPES.filter(recipe =>
    recipe.ingredients.some(ing => ing.itemId === itemId)
  )
}

/**
 * Convert inventory array to map for quick lookup
 */
export function inventoryToMap(inventory: InventoryItem[]): Map<string, number> {
  const map = new Map<string, number>()

  for (const item of inventory) {
    // Use itemId if available, otherwise use id
    const key = item.itemId || item.id
    const current = map.get(key) || 0
    map.set(key, current + (item.quantity || 1))
  }

  return map
}

/**
 * Apply materials consumption to inventory
 */
export function consumeMaterials(
  inventory: InventoryItem[],
  materials: { itemId: string; quantity: number }[]
): InventoryItem[] {
  const result = [...inventory]

  for (const material of materials) {
    let remaining = material.quantity

    for (let i = result.length - 1; i >= 0 && remaining > 0; i--) {
      const item = result[i]
      if (!item) continue
      const itemKey = item.itemId || item.id

      if (itemKey === material.itemId) {
        const toRemove = Math.min(item.quantity || 1, remaining)
        const newQuantity = (item.quantity || 1) - toRemove
        remaining -= toRemove

        if (newQuantity <= 0) {
          result.splice(i, 1)
        } else {
          result[i] = { ...item, quantity: newQuantity }
        }
      }
    }
  }

  return result
}

/**
 * Add crafted item to inventory
 */
export function addToInventory(
  inventory: InventoryItem[],
  item: InventoryItem
): InventoryItem[] {
  // Check if item is stackable and already exists
  if (item.stackable) {
    const existingIndex = inventory.findIndex(i =>
      (i.itemId || i.id) === (item.itemId || item.id)
    )

    if (existingIndex >= 0) {
      const existing = inventory[existingIndex]
      if (existing) {
        const newQuantity = (existing.quantity || 1) + (item.quantity || 1)

        // Check max stack
        if (newQuantity <= (item.maxStack || 99)) {
          const updated = [...inventory]
          updated[existingIndex] = { ...existing, quantity: newQuantity }
          return updated
        }
      }
    }
  }

  // Add as new item
  return [...inventory, item]
}

/**
 * Format craft time for display
 */
export function formatCraftTime(ms: number): string {
  if (ms < 1000) return 'Instant'
  if (ms < 60000) return `${Math.ceil(ms / 1000)}s`
  return `${Math.ceil(ms / 60000)}m`
}

/**
 * Get rarity color class
 */
export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common': return 'text-gray-400'
    case 'uncommon': return 'text-green-400'
    case 'rare': return 'text-blue-400'
    case 'epic': return 'text-purple-400'
    case 'legendary': return 'text-orange-400'
    default: return 'text-white'
  }
}

/**
 * Get rarity background class
 */
export function getRarityBg(rarity: string): string {
  switch (rarity) {
    case 'common': return 'bg-gray-500/20'
    case 'uncommon': return 'bg-green-500/20'
    case 'rare': return 'bg-blue-500/20'
    case 'epic': return 'bg-purple-500/20'
    case 'legendary': return 'bg-orange-500/20'
    default: return 'bg-white/10'
  }
}
