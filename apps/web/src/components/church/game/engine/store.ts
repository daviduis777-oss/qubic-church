/**
 * Anna Matrix Explorer - Game Store
 * Zustand store for global state management with manual persistence
 */

import { create } from 'zustand'
import type {
  GameState,
  PlayerState,
  PlayerStats,
  Position,
  CombatState,
  UIState,
  GameSettings,
  MenuScreen,
  Notification,
  ZoneId,
  InventoryItem,
  SaveData,
} from './types'
import { getZoneForRow } from '../data/zones'

// ============================================
// INITIAL STATE
// ============================================

const initialPlayerStats: PlayerStats = {
  level: 1,
  experience: 0,
  experienceToNextLevel: 100,
  energy: 100,
  maxEnergy: 100,
  health: 100,
  maxHealth: 100,
  attackPower: 10,
  defense: 5,
  critChance: 0.05,
  critDamage: 1.5,
  scanPower: 1,
  totalDistance: 0,
  totalMoves: 0,
}

const initialPlayer: PlayerState = {
  position: { row: 10, col: 64 }, // Start in Genesis Zone (safe, no enemies)
  stats: initialPlayerStats,
  inventory: [],
  equipment: {
    weapon: null,
    armor: null,
    module1: null,
    module2: null,
    artifact: null,
  },
  discoveries: [],
  completedQuests: [],
  activeQuests: [],
  skills: ['quick-strike', 'scan-weakness', 'emergency-shield'],
  achievementPoints: 0,
}

const initialCombat: CombatState = {
  active: false,
  playerPosition: { row: 2, col: 2 },
  enemies: [],
  turn: 'player',
  turnNumber: 0,
  selectedSkill: null,
  combatLog: [],
}

const initialUI: UIState = {
  activeMenu: 'none',
  showMinimap: true,
  showQuestTracker: true,
  notifications: [],
  dialogOpen: false,
  dialogContent: null,
}

const initialSettings: GameSettings = {
  masterVolume: 0.7,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  muteAll: false,
  touchControlsEnabled: true,
  vibrationEnabled: true,
  holdToMoveSpeed: 80,
  showFPS: false,
  showCoordinates: true,
  reducedMotion: false,
  highContrast: false,
  autoSave: true,
  tutorialComplete: false,
}

const createInitialState = (): GameState => ({
  initialized: false,
  paused: false,
  loading: true,
  lastSaved: 0,
  player: initialPlayer,
  combat: initialCombat,
  ui: initialUI,
  settings: initialSettings,
  currentZone: 'processing-core',
  exploredCells: new Set(['64,64']),
  visitedPOIs: [],
  playTime: 0,
  sessionStartTime: Date.now(),
})

// ============================================
// PERSISTENCE HELPERS
// ============================================

const STORAGE_KEY = 'anna-matrix-save'
const SAVE_VERSION = '1.0.0'

function saveToStorage(state: GameState): void {
  try {
    const saveData: SaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      player: state.player,
      currentZone: state.currentZone,
      exploredCells: Array.from(state.exploredCells),
      visitedPOIs: state.visitedPOIs,
      playTime: state.playTime,
      settings: state.settings,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))
  } catch (e) {
    console.error('Failed to save game:', e)
  }
}

function loadFromStorage(): Partial<GameState> | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null

    const saveData: SaveData = JSON.parse(data)

    return {
      player: saveData.player,
      currentZone: saveData.currentZone,
      exploredCells: new Set(saveData.exploredCells),
      visitedPOIs: saveData.visitedPOIs,
      playTime: saveData.playTime,
      settings: saveData.settings,
      lastSaved: saveData.timestamp,
    }
  } catch (e) {
    console.error('Failed to load game:', e)
    return null
  }
}

// ============================================
// STORE ACTIONS
// ============================================

interface GameActions {
  // Initialization
  initialize: () => void
  reset: () => void

  // Player Movement
  movePlayer: (direction: 'up' | 'down' | 'left' | 'right') => boolean
  setPlayerPosition: (position: Position) => void
  teleportTo: (position: Position) => void

  // Player Stats
  addExperience: (amount: number) => void
  levelUp: () => void
  useEnergy: (amount: number) => boolean
  regenerateEnergy: (amount: number) => void
  takeDamage: (amount: number) => void
  heal: (amount: number) => void

  // Discoveries
  discoverPattern: (patternId: string, xp: number, points: number) => void
  hasDiscovered: (patternId: string) => boolean

  // Inventory
  addItem: (item: InventoryItem) => void
  removeItem: (itemId: string, quantity?: number) => void
  equipItem: (item: InventoryItem, slot: keyof PlayerState['equipment']) => void
  unequipItem: (slot: keyof PlayerState['equipment']) => void

  // Quests
  startQuest: (questId: string) => void
  completeQuest: (questId: string) => void

  // Combat
  startCombat: (enemies: CombatState['enemies']) => void
  endCombat: (victory: boolean) => void
  playerAttack: (enemyIndex: number, skillId?: string) => void
  enemyTurn: () => void

  // UI
  setActiveMenu: (menu: MenuScreen) => void
  toggleMinimap: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  openDialog: (content: UIState['dialogContent']) => void
  closeDialog: () => void

  // Settings
  updateSettings: (settings: Partial<GameSettings>) => void

  // Game State
  pause: () => void
  resume: () => void
  updatePlayTime: () => void

  // Persistence
  save: () => void
  load: () => boolean
  exportSave: () => string
  importSave: (data: string) => boolean
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useGameStore = create<GameState & GameActions>()((set, get) => ({
  ...createInitialState(),

  // ========== Initialization ==========
  initialize: () => {
    // Prevent re-initialization
    if (get().initialized) return

    const savedState = loadFromStorage()
    if (savedState) {
      set({
        ...savedState,
        initialized: true,
        loading: false,
        sessionStartTime: Date.now(),
      })
    } else {
      set({ initialized: true, loading: false, sessionStartTime: Date.now() })
    }
  },

  reset: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({
      ...createInitialState(),
      initialized: true,
      loading: false,
      sessionStartTime: Date.now(),
    })
  },

  // ========== Player Movement ==========
  movePlayer: (direction) => {
    const state = get()
    if (state.paused || state.combat.active) return false

    const { row, col } = state.player.position
    let newRow = row
    let newCol = col

    switch (direction) {
      case 'up':
        newRow = Math.max(0, row - 1)
        break
      case 'down':
        newRow = Math.min(127, row + 1)
        break
      case 'left':
        newCol = Math.max(0, col - 1)
        break
      case 'right':
        newCol = Math.min(127, col + 1)
        break
    }

    if (newRow === row && newCol === col) return false

    const cellKey = `${newRow},${newCol}`
    const newZone = getZoneForRow(newRow)

    set((state) => {
      const newExplored = new Set(state.exploredCells)
      newExplored.add(cellKey)

      return {
        player: {
          ...state.player,
          position: { row: newRow, col: newCol },
          stats: {
            ...state.player.stats,
            totalMoves: state.player.stats.totalMoves + 1,
            totalDistance: state.player.stats.totalDistance + 1,
          },
        },
        currentZone: newZone?.id || state.currentZone,
        exploredCells: newExplored,
      }
    })

    // Auto-save occasionally
    if (state.settings.autoSave && state.player.stats.totalMoves % 50 === 0) {
      get().save()
    }

    return true
  },

  setPlayerPosition: (position) => {
    set((state) => ({
      player: { ...state.player, position },
    }))
  },

  teleportTo: (position) => {
    const newZone = getZoneForRow(position.row)
    set((state) => {
      const newExplored = new Set(state.exploredCells)
      newExplored.add(`${position.row},${position.col}`)

      return {
        player: { ...state.player, position },
        currentZone: newZone?.id || state.currentZone,
        exploredCells: newExplored,
      }
    })
  },

  // ========== Player Stats ==========
  addExperience: (amount) => {
    set((state) => {
      const newXP = state.player.stats.experience + amount
      return {
        player: {
          ...state.player,
          stats: { ...state.player.stats, experience: newXP },
        },
      }
    })

    // Check for level up
    const state = get()
    if (state.player.stats.experience >= state.player.stats.experienceToNextLevel) {
      get().levelUp()
    }
  },

  levelUp: () => {
    set((state) => {
      const newLevel = state.player.stats.level + 1
      const remainingXP =
        state.player.stats.experience - state.player.stats.experienceToNextLevel
      const newXPRequired = Math.floor(100 * Math.pow(1.5, newLevel - 1))

      return {
        player: {
          ...state.player,
          stats: {
            ...state.player.stats,
            level: newLevel,
            experience: remainingXP,
            experienceToNextLevel: newXPRequired,
            maxHealth: state.player.stats.maxHealth + 10,
            health: state.player.stats.maxHealth + 10,
            maxEnergy: state.player.stats.maxEnergy + 5,
            energy: state.player.stats.maxEnergy + 5,
            attackPower: state.player.stats.attackPower + 2,
            defense: state.player.stats.defense + 1,
          },
        },
      }
    })

    get().addNotification({
      type: 'level-up',
      title: 'Level Up!',
      message: `You reached level ${get().player.stats.level}!`,
      duration: 5000,
    })

    get().save()
  },

  useEnergy: (amount) => {
    const state = get()
    if (state.player.stats.energy < amount) return false

    set((state) => ({
      player: {
        ...state.player,
        stats: {
          ...state.player.stats,
          energy: state.player.stats.energy - amount,
        },
      },
    }))
    return true
  },

  regenerateEnergy: (amount) => {
    set((state) => ({
      player: {
        ...state.player,
        stats: {
          ...state.player.stats,
          energy: Math.min(
            state.player.stats.maxEnergy,
            state.player.stats.energy + amount
          ),
        },
      },
    }))
  },

  takeDamage: (amount) => {
    set((state) => {
      const actualDamage = Math.max(1, amount - state.player.stats.defense)
      const newHealth = Math.max(0, state.player.stats.health - actualDamage)

      return {
        player: {
          ...state.player,
          stats: { ...state.player.stats, health: newHealth },
        },
      }
    })
  },

  heal: (amount) => {
    set((state) => ({
      player: {
        ...state.player,
        stats: {
          ...state.player.stats,
          health: Math.min(
            state.player.stats.maxHealth,
            state.player.stats.health + amount
          ),
        },
      },
    }))
  },

  // ========== Discoveries ==========
  discoverPattern: (patternId, xp, points) => {
    const state = get()
    if (state.player.discoveries.includes(patternId)) return

    set((state) => ({
      player: {
        ...state.player,
        discoveries: [...state.player.discoveries, patternId],
        achievementPoints: state.player.achievementPoints + points,
      },
    }))

    get().addExperience(xp)
    get().save()
  },

  hasDiscovered: (patternId) => {
    return get().player.discoveries.includes(patternId)
  },

  // ========== Inventory ==========
  addItem: (item) => {
    set((state) => {
      const existing = state.player.inventory.find((i) => i.id === item.id)
      if (existing) {
        return {
          player: {
            ...state.player,
            inventory: state.player.inventory.map((i) =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          },
        }
      }
      return {
        player: {
          ...state.player,
          inventory: [...state.player.inventory, item],
        },
      }
    })
  },

  removeItem: (itemId, quantity = 1) => {
    set((state) => ({
      player: {
        ...state.player,
        inventory: state.player.inventory
          .map((i) =>
            i.id === itemId ? { ...i, quantity: i.quantity - quantity } : i
          )
          .filter((i) => i.quantity > 0),
      },
    }))
  },

  equipItem: (item, slot) => {
    set((state) => ({
      player: {
        ...state.player,
        equipment: { ...state.player.equipment, [slot]: item },
      },
    }))
  },

  unequipItem: (slot) => {
    const item = get().player.equipment[slot]
    if (item) {
      get().addItem(item)
    }
    set((state) => ({
      player: {
        ...state.player,
        equipment: { ...state.player.equipment, [slot]: null },
      },
    }))
  },

  // ========== Quests ==========
  startQuest: (questId) => {
    set((state) => ({
      player: {
        ...state.player,
        activeQuests: [...state.player.activeQuests, questId],
      },
    }))
  },

  completeQuest: (questId) => {
    set((state) => ({
      player: {
        ...state.player,
        activeQuests: state.player.activeQuests.filter((q) => q !== questId),
        completedQuests: [...state.player.completedQuests, questId],
      },
    }))
    get().save()
  },

  // ========== Combat ==========
  startCombat: (enemies) => {
    set({
      combat: {
        active: true,
        playerPosition: { row: 2, col: 2 },
        enemies,
        turn: 'player',
        turnNumber: 1,
        selectedSkill: null,
        combatLog: [],
      },
    })
  },

  endCombat: (victory) => {
    if (victory) {
      const state = get()
      const totalXP = state.combat.enemies.reduce((sum, e) => sum + e.xpReward, 0)
      get().addExperience(totalXP)

      get().addNotification({
        type: 'combat',
        title: 'Victory!',
        message: `You earned ${totalXP} XP!`,
        duration: 3000,
      })
    }

    set({
      combat: {
        active: false,
        playerPosition: { row: 2, col: 2 },
        enemies: [],
        turn: 'player',
        turnNumber: 0,
        selectedSkill: null,
        combatLog: [],
      },
    })
  },

  playerAttack: (enemyIndex, skillId) => {
    set((state) => ({
      combat: {
        ...state.combat,
        turn: 'enemy',
      },
    }))
  },

  enemyTurn: () => {
    set((state) => ({
      combat: {
        ...state.combat,
        turn: 'player',
        turnNumber: state.combat.turnNumber + 1,
      },
    }))
  },

  // ========== UI ==========
  setActiveMenu: (menu) => {
    set({ ui: { ...get().ui, activeMenu: menu } })
  },

  toggleMinimap: () => {
    set((state) => ({
      ui: { ...state.ui, showMinimap: !state.ui.showMinimap },
    }))
  },

  addNotification: (notification) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const newNotif: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
    }

    set((state) => ({
      ui: {
        ...state.ui,
        notifications: [...state.ui.notifications, newNotif],
      },
    }))

    setTimeout(() => {
      get().removeNotification(id)
    }, notification.duration)
  },

  removeNotification: (id) => {
    set((state) => ({
      ui: {
        ...state.ui,
        notifications: state.ui.notifications.filter((n) => n.id !== id),
      },
    }))
  },

  clearNotifications: () => {
    set((state) => ({
      ui: { ...state.ui, notifications: [] },
    }))
  },

  openDialog: (content) => {
    set((state) => ({
      ui: { ...state.ui, dialogOpen: true, dialogContent: content },
    }))
  },

  closeDialog: () => {
    set((state) => ({
      ui: { ...state.ui, dialogOpen: false, dialogContent: null },
    }))
  },

  // ========== Settings ==========
  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }))
    get().save()
  },

  // ========== Game State ==========
  pause: () => set({ paused: true }),
  resume: () => set({ paused: false }),

  updatePlayTime: () => {
    set((state) => ({
      playTime: state.playTime + 1,
    }))
  },

  // ========== Persistence ==========
  save: () => {
    const state = get()
    saveToStorage(state)
    set({ lastSaved: Date.now() })
  },

  load: () => {
    const savedState = loadFromStorage()
    if (savedState) {
      set(savedState)
      return true
    }
    return false
  },

  exportSave: () => {
    const state = get()
    const saveData: SaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      player: state.player,
      currentZone: state.currentZone,
      exploredCells: Array.from(state.exploredCells),
      visitedPOIs: state.visitedPOIs,
      playTime: state.playTime,
      settings: state.settings,
    }
    return btoa(JSON.stringify(saveData))
  },

  importSave: (data) => {
    try {
      const saveData: SaveData = JSON.parse(atob(data))
      set({
        player: saveData.player,
        currentZone: saveData.currentZone,
        exploredCells: new Set(saveData.exploredCells),
        visitedPOIs: saveData.visitedPOIs,
        playTime: saveData.playTime,
        settings: saveData.settings,
        lastSaved: saveData.timestamp,
      })
      return true
    } catch {
      return false
    }
  },
}))

// ============================================
// SELECTORS
// ============================================

export const selectPlayer = (state: GameState) => state.player
export const selectPosition = (state: GameState) => state.player.position
export const selectStats = (state: GameState) => state.player.stats
export const selectCombat = (state: GameState) => state.combat
export const selectUI = (state: GameState) => state.ui
export const selectSettings = (state: GameState) => state.settings
export const selectCurrentZone = (state: GameState) => state.currentZone
export const selectIsInCombat = (state: GameState) => state.combat.active
export const selectIsPaused = (state: GameState) => state.paused
