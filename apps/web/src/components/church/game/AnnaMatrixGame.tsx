'use client'

/**
 * AnnaMatrixGame - Advanced RPG exploration of the 128×128 Anna Matrix
 * Navigate through the neural network, discover patterns, complete quests, earn rewards
 *
 * Now using the new engine systems:
 * - Zustand store for state management
 * - Unified input system for keyboard/touch/gamepad
 * - Web Audio API for sound effects
 */

import { useEffect, useCallback, useRef, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gamepad2,
  Map,
  Trophy,
  X,
  Maximize2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Target,
  Sparkles,
  RotateCcw,
  Info,
  Volume2,
  VolumeX,
  Save,
  Scan,
  Zap,
  Heart,
  Hammer,
} from 'lucide-react'

// Import engine systems
import { useInput } from './engine/input'
import { useAudio } from './engine/audio'
import {
  useGameStore,
  selectPosition,
  selectStats,
  selectCurrentZone,
  selectUI,
} from './engine/store'
import { ZONES, getZoneForRow, getZoneColorClass } from './data/zones'
import { PATTERNS } from './data/patterns'
import { checkEncounter, generateEncounter } from './data/enemies'
import {
  type ResourceNode,
  generateWorldResources,
  RESOURCES,
} from './data/resources'
import {
  performScan,
  SCAN_CONFIGS,
  type ScanType,
  type ScanResult,
} from './systems/scan'
import {
  gatherResource,
  findResourceNodeAt,
  getResourceNodeDisplay,
} from './systems/gathering'
import { consumeMaterials, addToInventory } from './systems/crafting'
import { CombatUI, CraftingUI } from './ui'
import type { CombatRewards } from './systems/combat'
import type {
  Position,
  Pattern,
  PatternCategory,
  CombatEnemy,
  InventoryItem,
} from './engine/types'

// Game constants
const GRID_SIZE = 128
const VIEWPORT_SIZE = 17 // Visible cells - odd number for center alignment

// Pattern categories with display info
const PATTERN_TYPES: Record<
  PatternCategory,
  { name: string; color: string; icon: string }
> = {
  mathematical: { name: 'Mathematical', color: 'blue', icon: '∑' },
  cryptographic: { name: 'Cryptographic', color: 'orange', icon: '🔐' },
  cultural: { name: 'Cultural', color: 'purple', icon: '📜' },
  secret: { name: 'Secret', color: 'yellow', icon: '✨' },
}

// Rarity colors for display
const RARITY_COLORS = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-gold',
  legendary: 'text-orange-400',
  mythic: 'text-pink-400',
}

// Quests
const QUESTS = [
  {
    id: 'explore_bitcoin',
    name: 'Bitcoin Explorer',
    description: 'Visit Row 21 (Input Layer)',
    target: { type: 'row', value: 21 },
    reward: 50,
  },
  {
    id: 'find_bridge',
    name: 'Row Seeker',
    description: 'Discover the "cortex" row of the game lore (Row 68)',
    target: { type: 'row', value: 68 },
    reward: 75,
  },
  {
    id: 'output_hunter',
    name: 'Output Hunter',
    description: 'Find all 4 Output Neurons',
    target: {
      type: 'patterns',
      ids: ['output-alpha', 'output-beta', 'output-gamma', 'output-delta'],
    },
    reward: 200,
  },
  {
    id: 'center_pilgrim',
    name: 'Center Pilgrim',
    description: 'Reach the exact center [64, 64]',
    target: { type: 'position', row: 64, col: 64 },
    reward: 100,
  },
  {
    id: 'boot_master',
    name: 'Boot Master',
    description: 'Discover all Boot Sequence patterns',
    target: {
      type: 'patterns',
      ids: ['boot-alpha', 'boot-sync', 'boot-bridge'],
    },
    reward: 150,
  },
  {
    id: 'completionist',
    name: 'Matrix Master',
    description: 'Discover all 15 patterns',
    target: { type: 'all_patterns' },
    reward: 1000,
  },
]

interface Quest {
  id: string
  name: string
  description: string
  target: {
    type: string
    value?: number
    row?: number
    col?: number
    ids?: string[]
  }
  reward: number
}

export function AnnaMatrixGame() {
  const gameRef = useRef<HTMLDivElement>(null)

  // Use engine stores and hooks
  const store = useGameStore()
  const position = useGameStore(selectPosition)
  const stats = useGameStore(selectStats)
  const currentZone = useGameStore(selectCurrentZone)
  const uiState = useGameStore(selectUI)

  const audio = useAudio()

  // Local UI state
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMinimap, setShowMinimap] = useState(true)
  const [showQuests, setShowQuests] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [notification, setNotification] = useState<{
    message: string
    type: 'discovery' | 'quest' | 'zone' | 'combat'
  } | null>(null)
  const [recentDiscovery, setRecentDiscovery] = useState<Pattern | null>(null)

  // Track completed quests locally (will be integrated into store later)
  const [completedQuests, setCompletedQuests] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [discoveredPatterns, setDiscoveredPatterns] = useState<string[]>([])

  // Scan system state
  const [showScanPanel, setShowScanPanel] = useState(false)
  const [energy, setEnergy] = useState(100)
  const [maxEnergy] = useState(100)
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null)
  const [scanCooldown, setScanCooldown] = useState(false)

  // Combat state
  const [inCombat, setInCombat] = useState(false)
  const [combatEnemies, setCombatEnemies] = useState<CombatEnemy[]>([])
  const [playerHP, setPlayerHP] = useState(stats.maxHealth)

  // Crafting state
  const [showCrafting, setShowCrafting] = useState(false)
  const [resourceNodes, setResourceNodes] = useState<ResourceNode[]>([])
  const [gatherNotification, setGatherNotification] = useState<string | null>(
    null
  )

  // Game progress state
  const [gameWon, setGameWon] = useState(false)
  const [bossesDefeated, setBossesDefeated] = useState<string[]>([])

  // Initialize game on mount (empty deps - only run once)
  useEffect(() => {
    store.initialize()
    // Generate resource nodes for the world
    const getZoneForRowWrapper = (row: number) => {
      const zone = getZoneForRow(row)
      return zone ? { id: zone.id } : undefined
    }
    const nodes = generateWorldResources(getZoneForRowWrapper)
    setResourceNodes(nodes)
    // eslint_disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Energy regeneration (1 per second)
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(prev => Math.min(maxEnergy, prev + 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [maxEnergy])

  // Crafting hotkey (C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c' && !inCombat) {
        setShowCrafting(prev => !prev)
        audio.click()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inCombat, audio])

  // Handle direction input from the input system
  const handleDirection = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (inCombat) return // Don't move during combat

      const moved = store.movePlayer(direction)
      if (!moved) return

      audio.move()

      // Check for random encounter after moving
      const newPos = store.player.position
      const zone = getZoneForRow(newPos.row)
      if (zone && checkEncounter(newPos.row, zone.hasEnemies)) {
        // Generate enemies and start combat!
        const enemies = generateEncounter(newPos.row, stats.level)
        // Position enemies spread across top rows for tactical feel
        const spawnPositions = [
          { row: 0, col: 2 }, // Center top
          { row: 0, col: 0 }, // Left top
          { row: 0, col: 4 }, // Right top
          { row: 1, col: 1 }, // Second row left
          { row: 1, col: 3 }, // Second row right
        ]
        const combatEnemiesWithPosition: CombatEnemy[] = enemies.map(
          (enemy, index) => ({
            ...enemy,
            combatPosition: spawnPositions[index] || {
              row: Math.floor(index / 5),
              col: index % 5,
            },
            statusEffects: [],
          })
        )
        setCombatEnemies(combatEnemiesWithPosition)
        setInCombat(true)
        setNotification({
          message: `Encounter! ${enemies.length} ${enemies.length === 1 ? 'enemy' : 'enemies'} appeared!`,
          type: 'combat',
        })
        setTimeout(() => setNotification(null), 2000)
      }
    },
    [store, audio, inCombat, stats.level]
  )

  // Handle combat end
  const handleCombatEnd = useCallback(
    (
      victory: boolean,
      rewards?: CombatRewards,
      defeatedEnemies?: CombatEnemy[]
    ) => {
      setInCombat(false)

      // Check if The Architect was defeated (win condition!)
      const architectDefeated =
        victory && defeatedEnemies?.some(e => e.type === 'architect')

      setCombatEnemies([])

      if (victory && rewards) {
        // Apply rewards
        setScore(prev => prev + rewards.points)
        store.addExperience(rewards.xp)
        // Heal 30% of max HP after victory
        setPlayerHP(prev =>
          Math.min(stats.maxHealth, prev + Math.floor(stats.maxHealth * 0.3))
        )

        if (architectDefeated) {
          // GAME WON!
          setGameWon(true)
          setBossesDefeated(prev => [...prev, 'architect'])
          setNotification({
            message: '🏆 THE ARCHITECT DEFEATED! YOU WIN! 🏆',
            type: 'quest',
          })
        } else {
          setNotification({
            message: `Victory! +${rewards.xp} XP, +${rewards.points} points`,
            type: 'quest',
          })
        }
        audio.questComplete()
      } else if (!victory) {
        // Respawn with reduced energy but full HP
        setEnergy(prev => Math.max(10, Math.floor(prev * 0.5)))
        setPlayerHP(stats.maxHealth)
        setNotification({ message: 'Respawned at Safe Haven', type: 'zone' })
      }

      setTimeout(() => setNotification(null), 3000)
    },
    [store, audio, stats.maxHealth]
  )

  // Handle energy use in combat
  const handleCombatEnergyUse = useCallback((amount: number) => {
    setEnergy(prev => Math.max(0, prev - amount))
  }, [])

  // Handle damage in combat
  const handleCombatDamage = useCallback((amount: number) => {
    setPlayerHP(prev => Math.max(0, prev - amount))
  }, [])

  // Handle healing in combat
  const handleCombatHeal = useCallback(
    (amount: number) => {
      setPlayerHP(prev => Math.min(stats.maxHealth, prev + amount))
    },
    [stats.maxHealth]
  )

  // Handle crafting
  const handleCraft = useCallback(
    (result: {
      item: InventoryItem
      materialsConsumed: { itemId: string; quantity: number }[]
      energyUsed: number
      xpGained: number
    }) => {
      // Consume materials from inventory
      const updatedInventory = consumeMaterials(
        store.player.inventory,
        result.materialsConsumed
      )

      // Add crafted item
      const finalInventory = addToInventory(updatedInventory, result.item)

      // Update store inventory (we need to rebuild it item by item)
      // First clear, then re-add
      store.player.inventory.forEach(item =>
        store.removeItem(item.id, item.quantity)
      )
      finalInventory.forEach(item => store.addItem(item))

      // Use energy
      setEnergy(prev => Math.max(0, prev - result.energyUsed))

      // Add XP
      if (result.xpGained > 0) {
        store.addExperience(result.xpGained)
      }

      // Show notification
      setNotification({
        message: `Crafted ${result.item.name}!`,
        type: 'quest',
      })
      audio.questComplete()
      setTimeout(() => setNotification(null), 2000)
    },
    [store, audio]
  )

  // Handle resource gathering
  const handleGather = useCallback(() => {
    if (inCombat) return

    // Find resource at player position
    const node = findResourceNodeAt(position, resourceNodes)
    if (!node) return

    // Get equipped tool (simplified - check inventory for tools)
    const equippedTool =
      store.player.inventory.find(
        item => item.type === 'module' && item.itemId?.includes('pickaxe')
      )?.itemId || null

    // Attempt to gather
    const result = gatherResource(
      node,
      stats,
      energy,
      equippedTool,
      store.player.inventory
    )

    if (result.success && result.resourceType && result.quantity) {
      // Update node
      if (result.nodeUpdated) {
        setResourceNodes(prev =>
          prev.map(n => (n.id === node.id ? result.nodeUpdated! : n))
        )
      }

      // Add resource to inventory
      const resource = RESOURCES[result.resourceType]
      const resourceItem: InventoryItem = {
        id: `${result.resourceType}-${Date.now()}`,
        itemId: result.resourceType,
        name: resource.name,
        type: 'material',
        rarity: 'common',
        quantity: result.quantity,
        stackable: true,
        maxStack: 99,
        description: resource.description,
        icon: resource.icon,
      }
      store.addItem(resourceItem)

      // Use energy
      setEnergy(prev => Math.max(0, prev - result.energyUsed))

      // Add XP
      if (result.xpGained) {
        store.addExperience(result.xpGained)
      }

      // Show notification
      setGatherNotification(result.message)
      audio.discover(false)
      setTimeout(() => setGatherNotification(null), 2000)

      // Handle bonus drops
      if (result.bonusDrops) {
        result.bonusDrops.forEach(drop => {
          const bonusItem: InventoryItem = {
            id: `${drop.itemId}-${Date.now()}`,
            itemId: drop.itemId,
            name: drop.itemId,
            type: 'material',
            rarity: 'uncommon',
            quantity: drop.quantity,
            stackable: true,
            maxStack: 99,
            description: 'Bonus resource',
          }
          store.addItem(bonusItem)
        })
      }
    } else {
      setGatherNotification(result.message)
      setTimeout(() => setGatherNotification(null), 2000)
    }
  }, [position, resourceNodes, store, stats, energy, audio, inCombat])

  // Perform scan with specified type
  const doScan = useCallback(
    (scanType: ScanType) => {
      if (scanCooldown) return

      const result = performScan(
        scanType,
        position,
        energy,
        discoveredPatterns,
        stats.scanPower
      )

      // Use energy
      if (result.energyUsed > 0) {
        setEnergy(prev => prev - result.energyUsed)
      }

      // Set cooldown
      setScanCooldown(true)
      setTimeout(() => setScanCooldown(false), SCAN_CONFIGS[scanType].cooldown)

      setLastScanResult(result)

      // Handle discovery
      if (result.discovered && result.pattern) {
        setDiscoveredPatterns(prev => [...prev, result.pattern!.id])
        setScore(prev => prev + result.pattern!.points)
        setRecentDiscovery(result.pattern)
        setNotification({
          message: `${result.pattern.name} discovered! +${result.pattern.points}`,
          type: 'discovery',
        })
        audio.discover(
          result.pattern.rarity === 'legendary' ||
            result.pattern.rarity === 'epic' ||
            result.pattern.rarity === 'mythic'
        )
        setTimeout(() => {
          setNotification(null)
          setRecentDiscovery(null)
        }, 3000)
      } else if (result.hint) {
        setNotification({ message: `Hint: ${result.hint}`, type: 'zone' })
        setTimeout(() => setNotification(null), 3000)
      }

      audio.scan()
    },
    [position, energy, discoveredPatterns, stats.scanPower, scanCooldown, audio]
  )

  // Handle action input
  const handleAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'scan':
          // Quick scan on spacebar
          doScan('quick')
          break
        case 'menu':
          setShowHelp(prev => !prev)
          audio.click()
          break
        case 'map':
          setShowMinimap(prev => !prev)
          audio.click()
          break
        case 'inventory':
          setShowQuests(prev => !prev)
          audio.click()
          break
        case 'interact':
          // E key to gather resources
          handleGather()
          break
      }
    },
    [position, discoveredPatterns, audio, handleGather, doScan]
  )

  // Register input handlers
  useInput(handleDirection, handleAction)

  // Check for pattern discovery when moving
  useEffect(() => {
    const pattern = PATTERNS.find(
      p => p.row === position.row && p.col === position.col
    )
    if (pattern && !discoveredPatterns.includes(pattern.id)) {
      setDiscoveredPatterns(prev => [...prev, pattern.id])
      setScore(prev => prev + pattern.points)
      setRecentDiscovery(pattern)
      setNotification({
        message: `${pattern.name} discovered! +${pattern.points}`,
        type: 'discovery',
      })
      audio.discover(
        pattern.rarity === 'legendary' || pattern.rarity === 'epic'
      )
      setTimeout(() => {
        setNotification(null)
        setRecentDiscovery(null)
      }, 3000)
    }

    // Check zone change
    const newZone = getZoneForRow(position.row)
    if (newZone && newZone.id !== currentZone) {
      if (!pattern) {
        setNotification({ message: `Entering ${newZone.name}`, type: 'zone' })
        setTimeout(() => setNotification(null), 2000)
      }
    }

    // Check quest completion
    checkQuestCompletion()
  }, [position.row, position.col])

  // Quest completion checker
  const checkQuestCompletion = useCallback(() => {
    const newlyCompleted: string[] = []

    for (const quest of QUESTS as Quest[]) {
      if (completedQuests.includes(quest.id)) continue

      let completed = false

      switch (quest.target.type) {
        case 'row':
          completed = position.row === quest.target.value
          break
        case 'position':
          completed =
            position.row === quest.target.row &&
            position.col === quest.target.col
          break
        case 'patterns':
          completed =
            quest.target.ids?.every(id => discoveredPatterns.includes(id)) ??
            false
          break
        case 'all_patterns':
          completed = discoveredPatterns.length === PATTERNS.length
          break
      }

      if (completed) {
        newlyCompleted.push(quest.id)
      }
    }

    if (newlyCompleted.length > 0) {
      const questRewards = newlyCompleted.reduce((sum, id) => {
        const quest = QUESTS.find(q => q.id === id)
        return sum + (quest?.reward || 0)
      }, 0)
      setCompletedQuests(prev => [...prev, ...newlyCompleted])
      setScore(prev => prev + questRewards)

      const questNames = newlyCompleted
        .map(id => QUESTS.find(q => q.id === id)?.name)
        .join(', ')
      setTimeout(
        () => {
          setNotification({
            message: `Quest Complete: ${questNames}! +${questRewards}`,
            type: 'quest',
          })
          audio.questComplete()
          setTimeout(() => setNotification(null), 3000)
        },
        recentDiscovery ? 3100 : 100
      )
    }
  }, [position, discoveredPatterns, completedQuests, recentDiscovery, audio])

  // Get cell appearance (player is rendered separately as pixel character)
  const getCellStyle = useCallback(
    (row: number, col: number) => {
      const pattern = PATTERNS.find(p => p.row === row && p.col === col)
      const isDiscovered = pattern && discoveredPatterns.includes(pattern.id)
      const zone = getZoneForRow(row)

      // Check for resource node
      const resourceNode = resourceNodes.find(
        n => n.position.row === row && n.position.col === col
      )

      if (isDiscovered && pattern) {
        const typeInfo = PATTERN_TYPES[pattern.category]
        return `bg-${typeInfo.color}-400 animate-pulse shadow-[0_0_10px_rgba(255,255,0,0.5)]`
      }

      if (pattern && !isDiscovered) {
        return 'bg-yellow-500/20 hover:bg-yellow-500/30'
      }

      // Resource node styling
      if (resourceNode && !resourceNode.depleted) {
        const display = getResourceNodeDisplay(resourceNode)
        return `${display.depleted ? 'bg-gray-500/20' : 'bg-gold/30'} shadow-[0_0_8px_${display.glowColor}] hover:brightness-125`
      }

      if (zone) {
        return zone.bgColor
      }

      return 'bg-white/5'
    },
    [discoveredPatterns, resourceNodes]
  )

  // Calculate visible viewport and player position within it
  const { visibleCells, playerViewportPos } = useMemo(() => {
    const { row, col } = position
    const halfView = Math.floor(VIEWPORT_SIZE / 2)

    let startRow = row - halfView
    let startCol = col - halfView

    // Clamp viewport to grid boundaries
    startRow = Math.max(0, Math.min(GRID_SIZE - VIEWPORT_SIZE, startRow))
    startCol = Math.max(0, Math.min(GRID_SIZE - VIEWPORT_SIZE, startCol))

    const cells: Position[] = []
    for (let r = startRow; r < startRow + VIEWPORT_SIZE; r++) {
      for (let c = startCol; c < startCol + VIEWPORT_SIZE; c++) {
        cells.push({ row: r, col: c })
      }
    }

    // Calculate player's position within the viewport (0-16 for VIEWPORT_SIZE=17)
    const playerViewportRow = row - startRow
    const playerViewportCol = col - startCol

    return {
      visibleCells: cells,
      playerViewportPos: { row: playerViewportRow, col: playerViewportCol },
    }
  }, [position])

  // Reset game
  const resetGame = () => {
    store.reset()
    setDiscoveredPatterns([])
    setCompletedQuests([])
    setScore(0)
    setNotification(null)
    setRecentDiscovery(null)
    audio.click()
  }

  // Save game
  const saveGame = () => {
    store.save()
    audio.click()
    setNotification({ message: 'Game saved!', type: 'zone' })
    setTimeout(() => setNotification(null), 2000)
  }

  const currentZoneInfo = currentZone
    ? ZONES[currentZone]
    : getZoneForRow(position.row)
  const progressPercent = (discoveredPatterns.length / PATTERNS.length) * 100

  return (
    <div
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'overflow-hidden'}`}
      ref={gameRef}
      tabIndex={0}
    >
      {/* Game Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/60 to-transparent">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Level Badge with XP Progress */}
          <div className="flex items-center gap-1.5 px-3 py-1.5  bg-gold/20 border border-gold/30">
            <span className="text-gold font-bold text-sm">
              Lv.{stats.level}
            </span>
            <div
              className="w-12 h-1.5 bg-black/50  overflow-hidden"
              title={`${stats.experience}/${stats.experienceToNextLevel} XP`}
            >
              <motion.div
                animate={{
                  scaleX: stats.experience / stats.experienceToNextLevel,
                }}
                className="h-full w-full origin-left bg-gradient-to-r from-gold to-gold/70"
              />
            </div>
          </div>

          {/* HP Bar */}
          <div className="flex items-center gap-1.5 px-2 py-1.5  bg-red-500/10 border border-red-500/30">
            <Heart className="w-3.5 h-3.5 text-red-400" />
            <div className="w-16 h-2 bg-black/50  overflow-hidden">
              <motion.div
                animate={{ width: `${(playerHP / stats.maxHealth) * 100}%` }}
                className="h-full bg-gradient-to-r from-red-600 to-red-400"
              />
            </div>
            <span className="text-red-400 text-xs font-medium">{playerHP}</span>
          </div>

          {/* Energy Bar */}
          <div className="flex items-center gap-1.5 px-2 py-1.5  bg-yellow-500/10 border border-yellow-500/30">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <div className="w-16 h-2 bg-black/50  overflow-hidden">
              <motion.div
                animate={{ width: `${(energy / maxEnergy) * 100}%` }}
                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
              />
            </div>
            <span className="text-yellow-400 text-xs font-medium">
              {energy}
            </span>
          </div>

          {/* Score */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5  bg-yellow-500/20 border border-yellow-500/30">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold text-sm">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Discoveries */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5  bg-gold/20 border border-gold/30">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-gold text-sm font-medium">
              {discoveredPatterns.length}/{PATTERNS.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5  bg-white/5 border border-white/10">
            <div className="w-20 h-1.5 bg-white/10  overflow-hidden">
              <motion.div
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-gold to-gold/70"
                initial={{ width: 0 }}
              />
            </div>
            <span className="text-white/50 text-xs">
              {Math.round(progressPercent)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            className={`p-2  transition-colors ${showCrafting ? 'bg-orange-500/30 text-orange-400' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            onClick={() => {
              setShowCrafting(!showCrafting)
              audio.click()
            }}
            title="Crafting (C)"
            type="button"
          >
            <Hammer className="w-4 h-4" />
          </button>
          <button
            className={`p-2  transition-colors ${showScanPanel ? 'bg-gold/30 text-gold' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            onClick={() => {
              setShowScanPanel(!showScanPanel)
              audio.click()
            }}
            title="Scanner (Tab)"
            type="button"
          >
            <Scan className="w-4 h-4" />
          </button>
          <button
            className={`p-2  transition-colors ${showQuests ? 'bg-gold/30 text-gold' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            onClick={() => {
              setShowQuests(!showQuests)
              audio.click()
            }}
            title="Quests (Q)"
            type="button"
          >
            <Target className="w-4 h-4" />
          </button>
          <button
            className={`p-2  transition-colors ${showMinimap ? 'bg-gold/30 text-gold' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            onClick={() => {
              setShowMinimap(!showMinimap)
              audio.click()
            }}
            title="Minimap (M)"
            type="button"
          >
            <Map className="w-4 h-4" />
          </button>
          <button
            className="p-2  bg-white/10 hover:bg-white/20 transition-colors text-white/70"
            onClick={() => audio.toggleMute()}
            title="Toggle Sound"
            type="button"
          >
            {audio.config.muted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <button
            className="p-2  bg-white/10 hover:bg-white/20 transition-colors text-white/70"
            onClick={() => {
              setShowHelp(!showHelp)
              audio.click()
            }}
            title="Help (H)"
            type="button"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            className="p-2  bg-white/10 hover:bg-white/20 transition-colors text-white/70"
            onClick={saveGame}
            title="Save"
            type="button"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            className="p-2  bg-white/10 hover:bg-white/20 transition-colors text-white/70"
            onClick={resetGame}
            title="Reset"
            type="button"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            className="p-2  bg-white/10 hover:bg-white/20 transition-colors text-white/70"
            onClick={() => setIsFullscreen(!isFullscreen)}
            type="button"
          >
            {isFullscreen ? (
              <X className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Game Grid */}
      <div className="relative w-full aspect-square bg-black overflow-hidden">
        {/* Ambient glow based on zone */}
        <div
          className={`absolute inset-0 opacity-20 transition-colors duration-1000 ${
            currentZoneInfo?.color === 'orange'
              ? 'bg-orange-500'
              : currentZoneInfo?.color === 'purple'
                ? 'bg-gold'
                : currentZoneInfo?.color === 'green'
                  ? 'bg-green-500'
                  : currentZoneInfo?.color === 'blue'
                    ? 'bg-blue-500'
                    : 'bg-slate-500'
          }`}
          style={{ filter: 'blur(8px)' }}
        />

        {/* Grid */}
        <div
          className="absolute inset-0 grid gap-px p-1"
          style={{
            gridTemplateColumns: `repeat(${VIEWPORT_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${VIEWPORT_SIZE}, 1fr)`,
          }}
        >
          {visibleCells.map(cell => (
            <div
              className={`rounded-[2px] transition-all duration-75 ${getCellStyle(cell.row, cell.col)}`}
              key={`${cell.row}-${cell.col}`}
            />
          ))}
        </div>

        {/* Player character - positioned based on actual viewport position */}
        <div
          className="absolute pointer-events-none z-20"
          style={{
            // Center of the cell = (col + 0.5) / VIEWPORT_SIZE * 100%
            left: `${((playerViewportPos.col + 0.5) / VIEWPORT_SIZE) * 100}%`,
            top: `${((playerViewportPos.row + 0.5) / VIEWPORT_SIZE) * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Pixel character */}
            <motion.div
              animate={{ y: [0, -2, 0] }}
              className="w-5 h-6 relative z-10"
              transition={{
                duration: 0.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center">
                <div className="w-3 h-3 bg-gold shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                <div className="w-4 h-2 bg-gold -mt-0.5" />
                <div className="flex gap-[2px] -mt-[1px]">
                  <div className="w-[6px] h-[6px] bg-blue-600 rounded-sm" />
                  <div className="w-[6px] h-[6px] bg-blue-600 rounded-sm" />
                </div>
              </div>
            </motion.div>
            {/* Glow ring */}
            <div className="absolute -inset-3 bg-gold/20  blur-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <div className="flex items-center justify-between gap-4">
          {/* Position & Zone */}
          <div className="flex items-center gap-4">
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wider">
                Position
              </div>
              <div className="font-mono text-white text-sm">
                [{position.row}, {position.col}]
              </div>
            </div>
            {currentZoneInfo && (
              <div
                className={`px-3 py-1.5  ${currentZoneInfo.bgColor} border border-white/10`}
              >
                <div
                  className={`${getZoneColorClass(currentZoneInfo)} text-sm font-medium`}
                >
                  {currentZoneInfo.name}
                </div>
              </div>
            )}
          </div>

          {/* Mobile D-Pad */}
          <div className="flex md:hidden">
            <div className="grid grid-cols-3 gap-0.5">
              <div />
              <button
                className="p-2.5  bg-white/10 active:bg-white/30"
                onTouchStart={() => handleDirection('up')}
                type="button"
              >
                <ArrowUp className="w-5 h-5 text-white" />
              </button>
              <div />
              <button
                className="p-2.5  bg-white/10 active:bg-white/30"
                onTouchStart={() => handleDirection('left')}
                type="button"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="p-2.5  bg-white/5 flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 text-muted-foreground/70" />
              </div>
              <button
                className="p-2.5  bg-white/10 active:bg-white/30"
                onTouchStart={() => handleDirection('right')}
                type="button"
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
              <div />
              <button
                className="p-2.5  bg-white/10 active:bg-white/30"
                onTouchStart={() => handleDirection('down')}
                type="button"
              >
                <ArrowDown className="w-5 h-5 text-white" />
              </button>
              <div />
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
            <span>Moves: {stats.totalMoves}</span>
            <span>Level: {stats.level}</span>
            <span>WASD to move</span>
          </div>
        </div>
      </div>

      {/* Minimap */}
      <AnimatePresence>
        {showMinimap && (
          <motion.div
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="absolute top-14 right-3 w-28 h-28  bg-black/90 border border-white/20 overflow-hidden z-30"
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
          >
            <div className="relative w-full h-full">
              {/* Zone bands */}
              <div
                className="absolute w-full bg-blue-500/30"
                style={{ top: 0, height: `${(20 / 128) * 100}%` }}
              />
              <div
                className="absolute w-full h-[1px] bg-orange-500"
                style={{ top: `${(21 / 128) * 100}%` }}
              />
              <div
                className="absolute w-full h-[1px] bg-gold"
                style={{ top: `${(68 / 128) * 100}%` }}
              />
              <div
                className="absolute w-full h-[1px] bg-green-500"
                style={{ top: `${(96 / 128) * 100}%` }}
              />

              {/* Discovered patterns */}
              {PATTERNS.filter(p => discoveredPatterns.includes(p.id)).map(
                p => (
                  <div
                    className="absolute w-1 h-1 bg-yellow-400 "
                    key={p.id}
                    style={{
                      top: `${(p.row / GRID_SIZE) * 100}%`,
                      left: `${(p.col / GRID_SIZE) * 100}%`,
                    }}
                  />
                )
              )}

              {/* Player */}
              <motion.div
                animate={{
                  top: `${(position.row / GRID_SIZE) * 100}%`,
                  left: `${(position.col / GRID_SIZE) * 100}%`,
                }}
                className="absolute w-2 h-2 bg-gold  shadow-[0_0_6px_rgba(212,175,55,0.8)]"
                style={{ transform: 'translate(-50%, -50%)' }}
                transition={{ duration: 0.1 }}
              />

              {/* Viewport box */}
              <div
                className="absolute border border-white/30"
                style={{
                  width: `${(VIEWPORT_SIZE / GRID_SIZE) * 100}%`,
                  height: `${(VIEWPORT_SIZE / GRID_SIZE) * 100}%`,
                  top: `${Math.max(0, Math.min(100 - (VIEWPORT_SIZE / GRID_SIZE) * 100, ((position.row - VIEWPORT_SIZE / 2) / GRID_SIZE) * 100))}%`,
                  left: `${Math.max(0, Math.min(100 - (VIEWPORT_SIZE / GRID_SIZE) * 100, ((position.col - VIEWPORT_SIZE / 2) / GRID_SIZE) * 100))}%`,
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quest Panel */}
      <AnimatePresence>
        {showQuests && (
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-14 left-3 w-64 max-h-80  bg-black/95 border border-gold/30 overflow-hidden z-30"
            exit={{ opacity: 0, x: -20 }}
            initial={{ opacity: 0, x: -20 }}
          >
            <div className="p-3 border-b border-white/10">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-gold" />
                Quests
              </h3>
            </div>
            <div className="p-2 space-y-2 max-h-60 overflow-y-auto">
              {QUESTS.map(quest => {
                const isComplete = completedQuests.includes(quest.id)
                return (
                  <div
                    className={`p-2  ${isComplete ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5'}`}
                    key={quest.id}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${isComplete ? 'text-green-400' : 'text-white'}`}
                      >
                        {quest.name}
                      </span>
                      {isComplete ? (
                        <span className="text-green-400 text-xs">
                          +{quest.reward}
                        </span>
                      ) : (
                        <span className="text-yellow-400 text-xs">
                          {quest.reward} pts
                        </span>
                      )}
                    </div>
                    <p className="text-white/50 text-xs mt-1">
                      {quest.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan Panel */}
      <AnimatePresence>
        {showScanPanel && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-32 left-3 w-72  bg-black/95 border border-gold/30 overflow-hidden z-30"
            exit={{ opacity: 0, y: 20 }}
            initial={{ opacity: 0, y: 20 }}
          >
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Scan className="w-4 h-4 text-gold" />
                  Scanner
                </h3>
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <div className="w-16 h-2 bg-white/10  overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                      style={{ width: `${(energy / maxEnergy) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/60">{energy}</span>
                </div>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {/* Quick Scan */}
              <button
                className={`w-full p-3  text-left transition-all ${
                  scanCooldown
                    ? 'bg-white/5 text-muted-foreground cursor-not-allowed'
                    : 'bg-gold/10 hover:bg-gold/20 border border-gold/30'
                }`}
                disabled={scanCooldown}
                onClick={() => doScan('quick')}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gold font-medium">Quick Scan</span>
                  <span className="text-xs text-green-400">FREE</span>
                </div>
                <p className="text-white/50 text-xs mt-1">
                  Basic scan. Good for common patterns.
                </p>
              </button>

              {/* Deep Scan */}
              <button
                className={`w-full p-3  text-left transition-all ${
                  scanCooldown || energy < 10
                    ? 'bg-white/5 text-muted-foreground cursor-not-allowed'
                    : 'bg-gold/10 hover:bg-gold/20 border border-gold/30'
                }`}
                disabled={scanCooldown || energy < 10}
                onClick={() => doScan('deep')}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gold font-medium">Deep Scan</span>
                  <span className="text-xs text-yellow-400">10 Energy</span>
                </div>
                <p className="text-white/50 text-xs mt-1">
                  Thorough analysis. Reveals hints.
                </p>
              </button>

              {/* Full Analysis */}
              <button
                className={`w-full p-3  text-left transition-all ${
                  scanCooldown || energy < 50
                    ? 'bg-white/5 text-muted-foreground cursor-not-allowed'
                    : 'bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30'
                }`}
                disabled={scanCooldown || energy < 50}
                onClick={() => doScan('full')}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <span className="text-orange-400 font-medium">
                    Full Analysis
                  </span>
                  <span className="text-xs text-yellow-400">50 Energy</span>
                </div>
                <p className="text-white/50 text-xs mt-1">
                  Guaranteed discovery if pattern exists.
                </p>
              </button>

              {/* Last Scan Result */}
              {lastScanResult && (
                <div className="mt-3 p-2 rounded bg-white/5 text-xs text-white/70">
                  {lastScanResult.message}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              animate={{ scale: 1 }}
              className="bg-black/90 border border-white/20  p-6 max-w-md"
              exit={{ scale: 0.9 }}
              initial={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">How to Play</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <kbd className="px-2 py-1 rounded bg-white/10 text-white font-mono text-xs">
                    WASD
                  </kbd>
                  <span className="text-white/70">
                    Move around the matrix (hold for continuous movement)
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <kbd className="px-2 py-1 rounded bg-white/10 text-white font-mono text-xs">
                    Space
                  </kbd>
                  <span className="text-white/70">
                    Scan current cell for patterns
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <kbd className="px-2 py-1 rounded bg-white/10 text-white font-mono text-xs">
                    E
                  </kbd>
                  <span className="text-white/70">
                    Gather resources from nodes
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <kbd className="px-2 py-1 rounded bg-white/10 text-white font-mono text-xs">
                    C
                  </kbd>
                  <span className="text-white/70">Open crafting menu</span>
                </div>
                <div className="flex items-start gap-3">
                  <kbd className="px-2 py-1 rounded bg-white/10 text-white font-mono text-xs">
                    M
                  </kbd>
                  <span className="text-white/70">Toggle minimap</span>
                </div>
                <div className="flex items-start gap-3">
                  <kbd className="px-2 py-1 rounded bg-white/10 text-white font-mono text-xs">
                    I
                  </kbd>
                  <span className="text-white/70">Toggle quest panel</span>
                </div>
                <div className="border-t border-white/10 pt-3 mt-3">
                  <h4 className="text-white font-medium mb-2">
                    Main Quest: Defeat The Architect
                  </h4>
                  <ul className="text-white/60 space-y-1">
                    <li>🎯 Fight enemies to gain XP and level up</li>
                    <li>🌿 Gather resources and craft better gear</li>
                    <li>⬇️ Journey down through the zones (Row 21→96→Void)</li>
                    <li>
                      👁️ Find and defeat The Architect in the Void (Row 97+)
                    </li>
                  </ul>
                </div>
                <div className="border-t border-white/10 pt-3 mt-3">
                  <h4 className="text-white font-medium mb-2">Zones</h4>
                  <ul className="text-white/60 space-y-1 text-xs">
                    <li>🔵 Genesis (0-20): Weak enemies, training area</li>
                    <li>🟠 Bitcoin Layer (21): First boss zone</li>
                    <li>🔷 Shallow Network (22-42): Tier 1 enemies</li>
                    <li>⬛ Processing Core (43-67): Tier 2 enemies</li>
                    <li>🟣 Deep Network (69-95): Tier 3 enemies</li>
                    <li>⚫ Void (97-127): The Architect awaits!</li>
                  </ul>
                </div>
              </div>
              <button
                className="mt-6 w-full py-2  bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={() => setShowHelp(false)}
                type="button"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            className={`absolute top-16 left-1/2 z-50 px-4 py-2  backdrop-blur-sm border ${
              notification.type === 'discovery'
                ? 'bg-yellow-500/20 border-yellow-500/50'
                : notification.type === 'quest'
                  ? 'bg-gold/20 border-gold/50'
                  : notification.type === 'combat'
                    ? 'bg-red-500/20 border-red-500/50'
                    : 'bg-gold/20 border-gold/50'
            }`}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            initial={{ opacity: 0, y: -20, x: '-50%' }}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'discovery' && (
                <Sparkles className="w-4 h-4 text-yellow-400" />
              )}
              {notification.type === 'quest' && (
                <Trophy className="w-4 h-4 text-gold" />
              )}
              {notification.type === 'combat' && (
                <Heart className="w-4 h-4 text-red-400" />
              )}
              {notification.type === 'zone' && (
                <Map className="w-4 h-4 text-gold" />
              )}
              <span
                className={`font-medium text-sm ${
                  notification.type === 'discovery'
                    ? 'text-yellow-300'
                    : notification.type === 'quest'
                      ? 'text-gold/80'
                      : notification.type === 'combat'
                        ? 'text-red-300'
                        : 'text-gold/80'
                }`}
              >
                {notification.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discovery Detail Popup */}
      <AnimatePresence>
        {recentDiscovery && (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 p-4  bg-black/90 border border-yellow-500/30 backdrop-blur-sm"
            exit={{ opacity: 0, scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.9 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12  bg-yellow-500/20 flex items-center justify-center text-2xl">
                {PATTERN_TYPES[recentDiscovery.category]?.icon}
              </div>
              <div>
                <div className="text-yellow-400 font-bold">
                  {recentDiscovery.name}
                </div>
                <div className="text-white/50 text-sm">
                  {PATTERN_TYPES[recentDiscovery.category]?.name}
                </div>
                <div className="text-yellow-300 text-sm font-medium">
                  +{recentDiscovery.points} points
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combat UI */}
      <AnimatePresence>
        {inCombat && combatEnemies.length > 0 && (
          <CombatUI
            enemies={combatEnemies}
            energy={energy}
            onCombatEnd={handleCombatEnd}
            onDamage={handleCombatDamage}
            onEnergyUse={handleCombatEnergyUse}
            onHeal={handleCombatHeal}
            playerPosition={position}
            playerStats={{ ...stats, health: playerHP }}
          />
        )}
      </AnimatePresence>

      {/* Crafting UI */}
      <CraftingUI
        energy={energy}
        inventory={store.player.inventory}
        isOpen={showCrafting}
        onClose={() => setShowCrafting(false)}
        onCraft={handleCraft}
        playerStats={stats}
      />

      {/* Gather Notification */}
      <AnimatePresence>
        {gatherNotification && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-36 left-1/2 -translate-x-1/2 z-40 px-4 py-2  bg-gold/20 border border-gold/50 backdrop-blur-sm"
            exit={{ opacity: 0, y: 20 }}
            initial={{ opacity: 0, y: 20 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌿</span>
              <span className="text-gold font-medium text-sm">
                {gatherNotification}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resource indicator when standing on node */}
      <AnimatePresence>
        {findResourceNodeAt(position, resourceNodes) &&
          !findResourceNodeAt(position, resourceNodes)?.depleted && (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-36 right-3 z-30 p-3  bg-black/90 border border-gold/30 backdrop-blur-sm"
              exit={{ opacity: 0, scale: 0.9 }}
              initial={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {
                    RESOURCES[findResourceNodeAt(position, resourceNodes)!.type]
                      ?.icon
                  }
                </span>
                <div>
                  <div className="text-gold font-medium text-sm">
                    {
                      RESOURCES[
                        findResourceNodeAt(position, resourceNodes)!.type
                      ]?.name
                    }
                  </div>
                  <div className="text-white/50 text-xs">Press E to gather</div>
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* GAME WON Screen */}
      <AnimatePresence>
        {gameWon && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          >
            <motion.div
              animate={{ scale: 1, opacity: 1 }}
              className="text-center p-8"
              initial={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 15, delay: 0.2 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
                className="text-8xl mb-6"
                transition={{ duration: 2, repeat: Infinity }}
              >
                👁️
              </motion.div>
              <motion.h1
                animate={{ y: 0, opacity: 1 }}
                className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold/80 to-gold mb-4"
                initial={{ y: 20, opacity: 0 }}
                transition={{ delay: 0.4 }}
              >
                THE ARCHITECT DEFEATED
              </motion.h1>
              <motion.p
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl text-white/80 mb-8"
                initial={{ y: 20, opacity: 0 }}
                transition={{ delay: 0.6 }}
              >
                You have conquered the Matrix!
              </motion.p>
              <motion.div
                animate={{ y: 0, opacity: 1 }}
                className="grid grid-cols-3 gap-6 mb-8"
                initial={{ y: 20, opacity: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="bg-white/10  p-4">
                  <div className="text-3xl font-bold text-gold">
                    {stats.level}
                  </div>
                  <div className="text-white/60 text-sm">Final Level</div>
                </div>
                <div className="bg-white/10  p-4">
                  <div className="text-3xl font-bold text-gold">{score}</div>
                  <div className="text-white/60 text-sm">Score</div>
                </div>
                <div className="bg-white/10  p-4">
                  <div className="text-3xl font-bold text-pink-400">
                    {discoveredPatterns.length}/15
                  </div>
                  <div className="text-white/60 text-sm">Patterns Found</div>
                </div>
              </motion.div>
              <motion.button
                animate={{ y: 0, opacity: 1 }}
                className="px-8 py-3  bg-gradient-to-r from-gold to-gold/80 text-white font-bold text-lg hover:opacity-90 transition-opacity"
                initial={{ y: 20, opacity: 0 }}
                onClick={() => {
                  setGameWon(false)
                  setNotification({
                    message: 'Continue exploring the Matrix...',
                    type: 'zone',
                  })
                  setTimeout(() => setNotification(null), 3000)
                }}
                transition={{ delay: 1 }}
              >
                Continue Playing
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AnnaMatrixGame
