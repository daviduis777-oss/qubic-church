/**
 * Anna Matrix Explorer - Type Definitions
 * Core types for the game engine
 */

// ============================================
// POSITION & GRID
// ============================================

export interface Position {
  row: number
  col: number
}

export interface GridBounds {
  minRow: number
  maxRow: number
  minCol: number
  maxCol: number
}

// ============================================
// PLAYER
// ============================================

export interface PlayerStats {
  // Core
  level: number
  experience: number
  experienceToNextLevel: number

  // Resources
  energy: number
  maxEnergy: number
  health: number
  maxHealth: number

  // Combat
  attackPower: number
  defense: number
  critChance: number
  critDamage: number

  // Discovery
  scanPower: number

  // Tracking
  totalDistance: number
  totalMoves: number
}

export interface PlayerState {
  position: Position
  stats: PlayerStats
  inventory: InventoryItem[]
  equipment: Equipment
  discoveries: string[]
  completedQuests: string[]
  activeQuests: string[]
  skills: string[]
  achievementPoints: number
}

// ============================================
// INVENTORY & EQUIPMENT
// ============================================

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type ItemType = 'weapon' | 'armor' | 'module' | 'artifact' | 'consumable' | 'material'
export type WeaponType = 'data-blade' | 'pulse-gun' | 'hack-module' | 'shield-gen'

export interface InventoryItem {
  id: string
  itemId?: string              // Item type ID (for crafted items)
  name: string
  type: ItemType
  rarity: ItemRarity
  description: string
  quantity: number
  stackable?: boolean
  maxStack?: number
  icon?: string
  stats?: Partial<PlayerStats>
  weaponType?: WeaponType
  // Combat bonuses
  attackBonus?: number
  defenseBonus?: number
  healthBonus?: number
  critBonus?: number
  // Consumable properties
  healAmount?: number
  energyRestore?: number
}

export interface Equipment {
  weapon: InventoryItem | null
  armor: InventoryItem | null
  module1: InventoryItem | null
  module2: InventoryItem | null
  artifact: InventoryItem | null
}

// ============================================
// ZONES & WORLD
// ============================================

export type ZoneId =
  | 'genesis'
  | 'bitcoin-layer'
  | 'shallow-network'
  | 'processing-core'
  | 'cortex-bridge'
  | 'deep-network'
  | 'output-layer'
  | 'void'

export interface Zone {
  id: ZoneId
  name: string
  description: string
  startRow: number
  endRow: number
  color: string
  bgColor: string
  levelRequirement: number
  hasEnemies: boolean
}

export interface PointOfInterest {
  id: string
  type: 'terminal' | 'well' | 'gate' | 'haven' | 'station' | 'cache'
  name: string
  position: Position
  discovered: boolean
  interacted: boolean
}

// ============================================
// PATTERNS & DISCOVERIES
// ============================================

export type PatternCategory = 'mathematical' | 'cryptographic' | 'cultural' | 'secret'
export type PatternRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'

export interface Pattern {
  id: string
  name: string
  category: PatternCategory
  rarity: PatternRarity
  // Position - can use either position object or direct row/col
  row: number
  col: number
  description: string
  points: number
  lore?: string
  hint?: string
}

// ============================================
// ENEMIES & COMBAT
// ============================================

export type EnemyTier = 1 | 2 | 3 | 4
export type EnemyType =
  | 'data-drone'
  | 'firewall'
  | 'bug-swarm'
  | 'processor'
  | 'virus'
  | 'guardian'
  | 'corrupted-ai'
  | 'security-protocol'
  | 'data-wraith'
  | 'core-defender'
  | 'neural-phantom'
  | 'architect'

export interface Enemy {
  id: string
  type: EnemyType
  name: string
  tier: EnemyTier
  level: number
  health: number
  maxHealth: number
  attack: number
  defense: number
  xpReward: number
  lootTable: LootDrop[]
  abilities: string[]
}

export interface LootDrop {
  itemId: string
  chance: number // 0-1
  minQuantity: number
  maxQuantity: number
}

export interface CombatState {
  active: boolean
  playerPosition: Position // 5x5 grid position
  enemies: CombatEnemy[]
  turn: 'player' | 'enemy'
  turnNumber: number
  selectedSkill: string | null
  combatLog: CombatLogEntry[]
}

export interface CombatEnemy extends Enemy {
  combatPosition: Position
  statusEffects: StatusEffect[]
}

export type StatusEffectType =
  | 'poison'
  | 'stunned'
  | 'vulnerable'
  | 'shielded'
  | 'buffed'
  | 'weakened'

export interface StatusEffect {
  type: StatusEffectType
  duration: number
  strength: number // Percentage or flat value depending on type
}

export interface CombatLogEntry {
  turn: number
  actor: string
  action: string
  result?: string
  damage?: number
  healing?: number
}

// ============================================
// QUESTS
// ============================================

export type QuestType = 'daily' | 'weekly' | 'story' | 'side' | 'event'

export interface Quest {
  id: string
  name: string
  description: string
  type: QuestType
  objectives: QuestObjective[]
  rewards: QuestReward[]
  prerequisiteQuests?: string[]
  levelRequirement?: number
  expiresAt?: number // timestamp for daily/weekly
}

export interface QuestObjective {
  id: string
  description: string
  type: 'visit' | 'discover' | 'defeat' | 'collect' | 'reach-level' | 'complete-quests'
  target: string | number
  current: number
  required: number
}

export interface QuestReward {
  type: 'xp' | 'points' | 'item' | 'currency'
  value: number
  itemId?: string
}

// ============================================
// UI STATE
// ============================================

export type MenuScreen =
  | 'none'
  | 'pause'
  | 'inventory'
  | 'quests'
  | 'codex'
  | 'skills'
  | 'settings'
  | 'map'

export interface Notification {
  id: string
  type: 'discovery' | 'quest' | 'level-up' | 'achievement' | 'loot' | 'zone' | 'combat'
  title: string
  message: string
  duration: number
  timestamp: number
}

export interface UIState {
  activeMenu: MenuScreen
  showMinimap: boolean
  showQuestTracker: boolean
  notifications: Notification[]
  dialogOpen: boolean
  dialogContent: DialogContent | null
}

export interface DialogContent {
  npcId?: string
  title: string
  text: string
  options?: DialogOption[]
}

export interface DialogOption {
  text: string
  action: () => void
}

// ============================================
// SETTINGS
// ============================================

export interface GameSettings {
  // Audio
  masterVolume: number
  sfxVolume: number
  musicVolume: number
  muteAll: boolean

  // Controls
  touchControlsEnabled: boolean
  vibrationEnabled: boolean
  holdToMoveSpeed: number // ms between moves

  // Display
  showFPS: boolean
  showCoordinates: boolean
  reducedMotion: boolean
  highContrast: boolean

  // Gameplay
  autoSave: boolean
  tutorialComplete: boolean
}

// ============================================
// GAME STATE
// ============================================

export interface GameState {
  // Meta
  initialized: boolean
  paused: boolean
  loading: boolean
  lastSaved: number

  // Core
  player: PlayerState
  combat: CombatState
  ui: UIState
  settings: GameSettings

  // World
  currentZone: ZoneId
  exploredCells: Set<string>
  visitedPOIs: string[]

  // Time
  playTime: number // total seconds played
  sessionStartTime: number
}

// ============================================
// INPUT
// ============================================

export type InputAction =
  | 'move-up'
  | 'move-down'
  | 'move-left'
  | 'move-right'
  | 'scan'
  | 'interact'
  | 'menu'
  | 'inventory'
  | 'map'
  | 'cancel'

export interface InputState {
  activeInputs: Set<InputAction>
  lastInput: InputAction | null
  lastInputTime: number
  touchPosition: Position | null
  joystickDirection: { x: number; y: number } | null
}

// ============================================
// SAVE DATA
// ============================================

export interface SaveData {
  version: string
  timestamp: number
  player: PlayerState
  currentZone: ZoneId
  exploredCells: string[] // serialized from Set
  visitedPOIs: string[]
  playTime: number
  settings: GameSettings
}
