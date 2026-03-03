/**
 * Anna Matrix Explorer - Crafting Recipes
 * 25+ recipes across Tools, Consumables, Equipment, and Materials
 */

import type { ResourceType } from './resources'

// ============================================
// RECIPE TYPES
// ============================================

export type RecipeCategory =
  | 'tools'       // Gathering tools
  | 'weapons'     // Combat weapons
  | 'armor'       // Defensive gear
  | 'consumables' // Potions, buffs
  | 'materials'   // Processed materials
  | 'modules'     // Equipment upgrades

export interface RecipeIngredient {
  itemId: string          // Resource type or crafted item ID
  quantity: number
}

export interface Recipe {
  id: string
  name: string
  description: string
  category: RecipeCategory
  icon: string
  ingredients: RecipeIngredient[]
  outputId: string        // ID of crafted item
  outputQuantity: number
  craftTime: number       // Milliseconds
  levelRequired: number
  energyCost: number
  unlockCondition?: string // Quest or discovery ID to unlock
}

// ============================================
// CRAFTED ITEM DEFINITIONS
// ============================================

export interface CraftedItem {
  id: string
  name: string
  description: string
  category: RecipeCategory
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  stackable: boolean
  maxStack: number
  // Tool properties
  toolPower?: number
  toolDurability?: number
  // Weapon properties
  attackBonus?: number
  critBonus?: number
  // Armor properties
  defenseBonus?: number
  healthBonus?: number
  // Consumable properties
  healAmount?: number
  energyRestore?: number
  buffType?: string
  buffDuration?: number
}

export const CRAFTED_ITEMS: Record<string, CraftedItem> = {
  // ========== TOOLS ==========
  'basic-pickaxe': {
    id: 'basic-pickaxe',
    name: 'Basic Pickaxe',
    description: 'A simple tool for mining silicon and copper.',
    category: 'tools',
    icon: '⛏️',
    rarity: 'common',
    stackable: false,
    maxStack: 1,
    toolPower: 1,
    toolDurability: 100,
  },
  'advanced-pickaxe': {
    id: 'advanced-pickaxe',
    name: 'Advanced Pickaxe',
    description: 'Enhanced pickaxe for mining crystals and rare ores.',
    category: 'tools',
    icon: '⚒️',
    rarity: 'uncommon',
    stackable: false,
    maxStack: 1,
    toolPower: 2,
    toolDurability: 200,
  },
  'quantum-extractor': {
    id: 'quantum-extractor',
    name: 'Quantum Extractor',
    description: 'Specialized tool for harvesting quantum materials.',
    category: 'tools',
    icon: '🔮',
    rarity: 'rare',
    stackable: false,
    maxStack: 1,
    toolPower: 3,
    toolDurability: 150,
  },
  'void-harvester': {
    id: 'void-harvester',
    name: 'Void Harvester',
    description: 'The only tool capable of extracting void essence.',
    category: 'tools',
    icon: '🌀',
    rarity: 'epic',
    stackable: false,
    maxStack: 1,
    toolPower: 5,
    toolDurability: 100,
  },
  'scanner-mk1': {
    id: 'scanner-mk1',
    name: 'Scanner MK1',
    description: 'Basic scanner. +10% pattern discovery chance.',
    category: 'tools',
    icon: '📡',
    rarity: 'common',
    stackable: false,
    maxStack: 1,
    toolPower: 1,
  },
  'scanner-mk2': {
    id: 'scanner-mk2',
    name: 'Scanner MK2',
    description: 'Advanced scanner. +25% pattern discovery chance.',
    category: 'tools',
    icon: '📡',
    rarity: 'uncommon',
    stackable: false,
    maxStack: 1,
    toolPower: 2,
  },

  // ========== WEAPONS ==========
  'data-blade': {
    id: 'data-blade',
    name: 'Data Blade',
    description: 'A sharp blade forged from hardened data fibers.',
    category: 'weapons',
    icon: '🗡️',
    rarity: 'common',
    stackable: false,
    maxStack: 1,
    attackBonus: 5,
    critBonus: 0.05,
  },
  'circuit-sword': {
    id: 'circuit-sword',
    name: 'Circuit Sword',
    description: 'Electrified blade that deals bonus shock damage.',
    category: 'weapons',
    icon: '⚔️',
    rarity: 'uncommon',
    stackable: false,
    maxStack: 1,
    attackBonus: 10,
    critBonus: 0.1,
  },
  'quantum-blade': {
    id: 'quantum-blade',
    name: 'Quantum Blade',
    description: 'Exists in multiple states. Unpredictable but powerful.',
    category: 'weapons',
    icon: '🔪',
    rarity: 'rare',
    stackable: false,
    maxStack: 1,
    attackBonus: 20,
    critBonus: 0.2,
  },

  // ========== ARMOR ==========
  'fiber-vest': {
    id: 'fiber-vest',
    name: 'Fiber Vest',
    description: 'Light armor woven from data fibers.',
    category: 'armor',
    icon: '🥋',
    rarity: 'common',
    stackable: false,
    maxStack: 1,
    defenseBonus: 3,
    healthBonus: 10,
  },
  'circuit-armor': {
    id: 'circuit-armor',
    name: 'Circuit Armor',
    description: 'Medium armor with integrated shielding.',
    category: 'armor',
    icon: '🛡️',
    rarity: 'uncommon',
    stackable: false,
    maxStack: 1,
    defenseBonus: 8,
    healthBonus: 25,
  },
  'nano-suit': {
    id: 'nano-suit',
    name: 'Nano Suit',
    description: 'Advanced armor that adapts to damage types.',
    category: 'armor',
    icon: '🦾',
    rarity: 'rare',
    stackable: false,
    maxStack: 1,
    defenseBonus: 15,
    healthBonus: 50,
  },

  // ========== CONSUMABLES ==========
  'health-gel': {
    id: 'health-gel',
    name: 'Health Gel',
    description: 'Restores 30 HP instantly.',
    category: 'consumables',
    icon: '💊',
    rarity: 'common',
    stackable: true,
    maxStack: 20,
    healAmount: 30,
  },
  'health-gel-plus': {
    id: 'health-gel-plus',
    name: 'Health Gel+',
    description: 'Restores 60 HP instantly.',
    category: 'consumables',
    icon: '💊',
    rarity: 'uncommon',
    stackable: true,
    maxStack: 20,
    healAmount: 60,
  },
  'energy-cell': {
    id: 'energy-cell',
    name: 'Energy Cell',
    description: 'Restores 25 Energy instantly.',
    category: 'consumables',
    icon: '🔋',
    rarity: 'common',
    stackable: true,
    maxStack: 20,
    energyRestore: 25,
  },
  'energy-cell-plus': {
    id: 'energy-cell-plus',
    name: 'Energy Cell+',
    description: 'Restores 50 Energy instantly.',
    category: 'consumables',
    icon: '🔋',
    rarity: 'uncommon',
    stackable: true,
    maxStack: 20,
    energyRestore: 50,
  },
  'attack-booster': {
    id: 'attack-booster',
    name: 'Attack Booster',
    description: '+25% attack for 60 seconds.',
    category: 'consumables',
    icon: '⚡',
    rarity: 'uncommon',
    stackable: true,
    maxStack: 10,
    buffType: 'attack',
    buffDuration: 60000,
  },
  'defense-booster': {
    id: 'defense-booster',
    name: 'Defense Booster',
    description: '+25% defense for 60 seconds.',
    category: 'consumables',
    icon: '🛡️',
    rarity: 'uncommon',
    stackable: true,
    maxStack: 10,
    buffType: 'defense',
    buffDuration: 60000,
  },

  // ========== MATERIALS (Processed) ==========
  'refined-silicon': {
    id: 'refined-silicon',
    name: 'Refined Silicon',
    description: 'Purified silicon for advanced crafting.',
    category: 'materials',
    icon: '🔷',
    rarity: 'uncommon',
    stackable: true,
    maxStack: 50,
  },
  'nano-composite': {
    id: 'nano-composite',
    name: 'Nano Composite',
    description: 'Strong lightweight material for armor.',
    category: 'materials',
    icon: '🔶',
    rarity: 'rare',
    stackable: true,
    maxStack: 30,
  },
  'power-core': {
    id: 'power-core',
    name: 'Power Core',
    description: 'Concentrated energy source.',
    category: 'materials',
    icon: '💠',
    rarity: 'rare',
    stackable: true,
    maxStack: 20,
  },

  // ========== MODULES ==========
  'crit-chip': {
    id: 'crit-chip',
    name: 'Crit Chip',
    description: '+10% critical hit chance when equipped.',
    category: 'modules',
    icon: '💾',
    rarity: 'uncommon',
    stackable: false,
    maxStack: 1,
    critBonus: 0.1,
  },
  'defense-module': {
    id: 'defense-module',
    name: 'Defense Module',
    description: '+5 defense when equipped.',
    category: 'modules',
    icon: '💿',
    rarity: 'uncommon',
    stackable: false,
    maxStack: 1,
    defenseBonus: 5,
  },
}

// ============================================
// RECIPES
// ============================================

export const RECIPES: Recipe[] = [
  // ========== TOOLS ==========
  {
    id: 'recipe-basic-pickaxe',
    name: 'Basic Pickaxe',
    description: 'Craft a basic mining tool.',
    category: 'tools',
    icon: '⛏️',
    ingredients: [
      { itemId: 'silicon-ore', quantity: 3 },
      { itemId: 'data-fiber', quantity: 2 },
    ],
    outputId: 'basic-pickaxe',
    outputQuantity: 1,
    craftTime: 5000,
    levelRequired: 3,
    energyCost: 10,
  },
  {
    id: 'recipe-advanced-pickaxe',
    name: 'Advanced Pickaxe',
    description: 'Craft an enhanced mining tool.',
    category: 'tools',
    icon: '⚒️',
    ingredients: [
      { itemId: 'refined-silicon', quantity: 2 },
      { itemId: 'copper-wire', quantity: 4 },
      { itemId: 'nano-tube', quantity: 2 },
    ],
    outputId: 'advanced-pickaxe',
    outputQuantity: 1,
    craftTime: 10000,
    levelRequired: 15,
    energyCost: 20,
  },
  {
    id: 'recipe-quantum-extractor',
    name: 'Quantum Extractor',
    description: 'Craft a tool for quantum materials.',
    category: 'tools',
    icon: '🔮',
    ingredients: [
      { itemId: 'crystal-shard', quantity: 5 },
      { itemId: 'circuit-board', quantity: 2 },
      { itemId: 'quantum-dust', quantity: 1 },
    ],
    outputId: 'quantum-extractor',
    outputQuantity: 1,
    craftTime: 20000,
    levelRequired: 40,
    energyCost: 35,
  },
  {
    id: 'recipe-void-harvester',
    name: 'Void Harvester',
    description: 'Craft the ultimate harvesting tool.',
    category: 'tools',
    icon: '🌀',
    ingredients: [
      { itemId: 'quantum-dust', quantity: 5 },
      { itemId: 'void-essence', quantity: 2 },
      { itemId: 'architect-alloy', quantity: 1 },
    ],
    outputId: 'void-harvester',
    outputQuantity: 1,
    craftTime: 30000,
    levelRequired: 75,
    energyCost: 50,
  },
  {
    id: 'recipe-scanner-mk1',
    name: 'Scanner MK1',
    description: 'Craft a basic pattern scanner.',
    category: 'tools',
    icon: '📡',
    ingredients: [
      { itemId: 'copper-wire', quantity: 3 },
      { itemId: 'silicon-ore', quantity: 2 },
    ],
    outputId: 'scanner-mk1',
    outputQuantity: 1,
    craftTime: 8000,
    levelRequired: 5,
    energyCost: 15,
  },
  {
    id: 'recipe-scanner-mk2',
    name: 'Scanner MK2',
    description: 'Craft an advanced pattern scanner.',
    category: 'tools',
    icon: '📡',
    ingredients: [
      { itemId: 'circuit-board', quantity: 1 },
      { itemId: 'crystal-shard', quantity: 2 },
      { itemId: 'refined-silicon', quantity: 3 },
    ],
    outputId: 'scanner-mk2',
    outputQuantity: 1,
    craftTime: 15000,
    levelRequired: 25,
    energyCost: 25,
  },

  // ========== WEAPONS ==========
  {
    id: 'recipe-data-blade',
    name: 'Data Blade',
    description: 'Craft a basic combat weapon.',
    category: 'weapons',
    icon: '🗡️',
    ingredients: [
      { itemId: 'data-fiber', quantity: 5 },
      { itemId: 'silicon-ore', quantity: 2 },
    ],
    outputId: 'data-blade',
    outputQuantity: 1,
    craftTime: 8000,
    levelRequired: 5,
    energyCost: 15,
  },
  {
    id: 'recipe-circuit-sword',
    name: 'Circuit Sword',
    description: 'Craft an electrified blade.',
    category: 'weapons',
    icon: '⚔️',
    ingredients: [
      { itemId: 'refined-silicon', quantity: 3 },
      { itemId: 'copper-wire', quantity: 5 },
      { itemId: 'power-core', quantity: 1 },
    ],
    outputId: 'circuit-sword',
    outputQuantity: 1,
    craftTime: 15000,
    levelRequired: 20,
    energyCost: 25,
  },
  {
    id: 'recipe-quantum-blade',
    name: 'Quantum Blade',
    description: 'Craft a quantum-powered weapon.',
    category: 'weapons',
    icon: '🔪',
    ingredients: [
      { itemId: 'quantum-dust', quantity: 3 },
      { itemId: 'nano-composite', quantity: 2 },
      { itemId: 'power-core', quantity: 2 },
    ],
    outputId: 'quantum-blade',
    outputQuantity: 1,
    craftTime: 25000,
    levelRequired: 50,
    energyCost: 40,
  },

  // ========== ARMOR ==========
  {
    id: 'recipe-fiber-vest',
    name: 'Fiber Vest',
    description: 'Craft basic protective armor.',
    category: 'armor',
    icon: '🥋',
    ingredients: [
      { itemId: 'data-fiber', quantity: 8 },
      { itemId: 'bio-gel', quantity: 2 },
    ],
    outputId: 'fiber-vest',
    outputQuantity: 1,
    craftTime: 10000,
    levelRequired: 5,
    energyCost: 15,
  },
  {
    id: 'recipe-circuit-armor',
    name: 'Circuit Armor',
    description: 'Craft medium protective armor.',
    category: 'armor',
    icon: '🛡️',
    ingredients: [
      { itemId: 'refined-silicon', quantity: 4 },
      { itemId: 'copper-wire', quantity: 6 },
      { itemId: 'nano-tube', quantity: 3 },
    ],
    outputId: 'circuit-armor',
    outputQuantity: 1,
    craftTime: 20000,
    levelRequired: 25,
    energyCost: 30,
  },
  {
    id: 'recipe-nano-suit',
    name: 'Nano Suit',
    description: 'Craft advanced adaptive armor.',
    category: 'armor',
    icon: '🦾',
    ingredients: [
      { itemId: 'nano-composite', quantity: 5 },
      { itemId: 'circuit-board', quantity: 2 },
      { itemId: 'quantum-dust', quantity: 2 },
    ],
    outputId: 'nano-suit',
    outputQuantity: 1,
    craftTime: 30000,
    levelRequired: 50,
    energyCost: 45,
  },

  // ========== CONSUMABLES ==========
  {
    id: 'recipe-health-gel',
    name: 'Health Gel',
    description: 'Craft a basic healing item.',
    category: 'consumables',
    icon: '💊',
    ingredients: [
      { itemId: 'bio-gel', quantity: 2 },
      { itemId: 'data-fiber', quantity: 1 },
    ],
    outputId: 'health-gel',
    outputQuantity: 2,
    craftTime: 3000,
    levelRequired: 1,
    energyCost: 5,
  },
  {
    id: 'recipe-health-gel-plus',
    name: 'Health Gel+',
    description: 'Craft an improved healing item.',
    category: 'consumables',
    icon: '💊',
    ingredients: [
      { itemId: 'bio-gel', quantity: 4 },
      { itemId: 'crystal-shard', quantity: 1 },
    ],
    outputId: 'health-gel-plus',
    outputQuantity: 2,
    craftTime: 5000,
    levelRequired: 15,
    energyCost: 10,
  },
  {
    id: 'recipe-energy-cell',
    name: 'Energy Cell',
    description: 'Craft a basic energy restoration item.',
    category: 'consumables',
    icon: '🔋',
    ingredients: [
      { itemId: 'copper-wire', quantity: 2 },
      { itemId: 'silicon-ore', quantity: 1 },
    ],
    outputId: 'energy-cell',
    outputQuantity: 2,
    craftTime: 3000,
    levelRequired: 1,
    energyCost: 5,
  },
  {
    id: 'recipe-energy-cell-plus',
    name: 'Energy Cell+',
    description: 'Craft an improved energy item.',
    category: 'consumables',
    icon: '🔋',
    ingredients: [
      { itemId: 'crystal-shard', quantity: 2 },
      { itemId: 'copper-wire', quantity: 3 },
    ],
    outputId: 'energy-cell-plus',
    outputQuantity: 2,
    craftTime: 5000,
    levelRequired: 15,
    energyCost: 10,
  },
  {
    id: 'recipe-attack-booster',
    name: 'Attack Booster',
    description: 'Craft an offensive buff item.',
    category: 'consumables',
    icon: '⚡',
    ingredients: [
      { itemId: 'bio-gel', quantity: 2 },
      { itemId: 'crystal-shard', quantity: 1 },
      { itemId: 'quantum-dust', quantity: 1 },
    ],
    outputId: 'attack-booster',
    outputQuantity: 1,
    craftTime: 8000,
    levelRequired: 30,
    energyCost: 20,
  },
  {
    id: 'recipe-defense-booster',
    name: 'Defense Booster',
    description: 'Craft a defensive buff item.',
    category: 'consumables',
    icon: '🛡️',
    ingredients: [
      { itemId: 'bio-gel', quantity: 2 },
      { itemId: 'nano-tube', quantity: 2 },
      { itemId: 'refined-silicon', quantity: 1 },
    ],
    outputId: 'defense-booster',
    outputQuantity: 1,
    craftTime: 8000,
    levelRequired: 30,
    energyCost: 20,
  },

  // ========== MATERIALS ==========
  {
    id: 'recipe-refined-silicon',
    name: 'Refined Silicon',
    description: 'Process raw silicon into a purer form.',
    category: 'materials',
    icon: '🔷',
    ingredients: [
      { itemId: 'silicon-ore', quantity: 4 },
    ],
    outputId: 'refined-silicon',
    outputQuantity: 2,
    craftTime: 5000,
    levelRequired: 10,
    energyCost: 10,
  },
  {
    id: 'recipe-nano-composite',
    name: 'Nano Composite',
    description: 'Combine materials into strong composite.',
    category: 'materials',
    icon: '🔶',
    ingredients: [
      { itemId: 'nano-tube', quantity: 3 },
      { itemId: 'refined-silicon', quantity: 2 },
    ],
    outputId: 'nano-composite',
    outputQuantity: 1,
    craftTime: 10000,
    levelRequired: 25,
    energyCost: 20,
  },
  {
    id: 'recipe-power-core',
    name: 'Power Core',
    description: 'Create a concentrated power source.',
    category: 'materials',
    icon: '💠',
    ingredients: [
      { itemId: 'crystal-shard', quantity: 3 },
      { itemId: 'copper-wire', quantity: 4 },
    ],
    outputId: 'power-core',
    outputQuantity: 1,
    craftTime: 12000,
    levelRequired: 20,
    energyCost: 25,
  },

  // ========== MODULES ==========
  {
    id: 'recipe-crit-chip',
    name: 'Crit Chip',
    description: 'Craft a critical hit enhancement module.',
    category: 'modules',
    icon: '💾',
    ingredients: [
      { itemId: 'circuit-board', quantity: 1 },
      { itemId: 'crystal-shard', quantity: 2 },
    ],
    outputId: 'crit-chip',
    outputQuantity: 1,
    craftTime: 15000,
    levelRequired: 30,
    energyCost: 25,
  },
  {
    id: 'recipe-defense-module',
    name: 'Defense Module',
    description: 'Craft a defensive enhancement module.',
    category: 'modules',
    icon: '💿',
    ingredients: [
      { itemId: 'circuit-board', quantity: 1 },
      { itemId: 'nano-composite', quantity: 1 },
    ],
    outputId: 'defense-module',
    outputQuantity: 1,
    craftTime: 15000,
    levelRequired: 30,
    energyCost: 25,
  },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get recipe by ID
 */
export function getRecipe(id: string): Recipe | undefined {
  return RECIPES.find(r => r.id === id)
}

/**
 * Get crafted item definition
 */
export function getCraftedItem(id: string): CraftedItem | undefined {
  return CRAFTED_ITEMS[id]
}

/**
 * Get all recipes for a category
 */
export function getRecipesByCategory(category: RecipeCategory): Recipe[] {
  return RECIPES.filter(r => r.category === category)
}

/**
 * Get recipes available at player level
 */
export function getAvailableRecipes(playerLevel: number): Recipe[] {
  return RECIPES.filter(r => r.levelRequired <= playerLevel)
}

/**
 * Check if player has ingredients for a recipe
 */
export function canCraftRecipe(
  recipe: Recipe,
  inventory: Map<string, number>
): boolean {
  return recipe.ingredients.every(ing => {
    const count = inventory.get(ing.itemId) || 0
    return count >= ing.quantity
  })
}

/**
 * Get missing ingredients for a recipe
 */
export function getMissingIngredients(
  recipe: Recipe,
  inventory: Map<string, number>
): RecipeIngredient[] {
  return recipe.ingredients.filter(ing => {
    const count = inventory.get(ing.itemId) || 0
    return count < ing.quantity
  }).map(ing => ({
    itemId: ing.itemId,
    quantity: ing.quantity - (inventory.get(ing.itemId) || 0),
  }))
}

/**
 * Get all recipe categories
 */
export function getRecipeCategories(): RecipeCategory[] {
  return ['tools', 'weapons', 'armor', 'consumables', 'materials', 'modules']
}

/**
 * Get category display info
 */
export function getCategoryInfo(category: RecipeCategory): { name: string; icon: string; color: string } {
  switch (category) {
    case 'tools': return { name: 'Tools', icon: '🔧', color: 'text-slate-400' }
    case 'weapons': return { name: 'Weapons', icon: '⚔️', color: 'text-red-400' }
    case 'armor': return { name: 'Armor', icon: '🛡️', color: 'text-blue-400' }
    case 'consumables': return { name: 'Consumables', icon: '💊', color: 'text-green-400' }
    case 'materials': return { name: 'Materials', icon: '🔷', color: 'text-purple-400' }
    case 'modules': return { name: 'Modules', icon: '💿', color: 'text-cyan-400' }
  }
}
