'use client'

/**
 * Anna Matrix Explorer - Combat UI Component
 * Visual battle interface with 5x5 grid, HP bars, skills, and actions
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords,
  Shield,
  Zap,
  Heart,
  Skull,
  Target,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  LogOut,
  RotateCcw,
} from 'lucide-react'
import type { CombatEnemy, Position, PlayerStats, StatusEffect } from '../engine/types'
import {
  COMBAT_SKILLS,
  COMBAT_GRID_SIZE,
  ESCAPE_ENERGY_COST,
  playerAttack,
  playerUseSkill,
  playerDefend,
  playerMove,
  playerEscape,
  getEnemyAction,
  enemyAttack,
  calculateDamage,
  calculateCombatRewards,
  isCombatOver,
  processStatusEffects,
  getDistance,
  isValidCombatPosition,
  isPositionOccupied,
  type CombatSkill,
  type CombatRewards,
  type PlayerCombatStats,
} from '../systems/combat'
import { getEnemyIcon, getEnemyColor } from '../data/enemies'

interface CombatUIProps {
  enemies: CombatEnemy[]
  playerStats: PlayerStats
  playerPosition: Position
  energy: number
  onCombatEnd: (victory: boolean, rewards?: CombatRewards, defeatedEnemies?: CombatEnemy[]) => void
  onEnergyUse: (amount: number) => void
  onDamage: (amount: number) => void
  onHeal: (amount: number) => void
}

interface CombatLogEntry {
  id: string
  turn: number
  message: string
  type: 'player' | 'enemy' | 'system'
}

export function CombatUI({
  enemies: initialEnemies,
  playerStats,
  playerPosition: initialPlayerPos,
  energy,
  onCombatEnd,
  onEnergyUse,
  onDamage,
  onHeal,
}: CombatUIProps) {
  // Combat state
  const [enemies, setEnemies] = useState<CombatEnemy[]>(initialEnemies)
  // Combat uses a 5x5 grid - player starts in center-bottom area
  const [playerPos, setPlayerPos] = useState<Position>({ row: 4, col: 2 })
  // Use passed health value, not maxHealth
  const [playerHP, setPlayerHP] = useState(playerStats.health)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [turnNumber, setTurnNumber] = useState(1)
  const [isDefending, setIsDefending] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<CombatSkill | null>(null)
  const [selectedEnemy, setSelectedEnemy] = useState<number | null>(0) // Auto-select first enemy
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([
    { id: '0', turn: 0, message: `Combat started! Facing ${initialEnemies.length} enemies.`, type: 'system' },
  ])
  const [skillCooldowns, setSkillCooldowns] = useState<Map<string, number>>(new Map())
  const [showVictory, setShowVictory] = useState(false)
  const [showDefeat, setShowDefeat] = useState(false)
  const [rewards, setRewards] = useState<CombatRewards | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Player combat stats derived from playerStats
  const playerCombatStats: PlayerCombatStats = {
    health: playerHP,
    maxHealth: playerStats.maxHealth,
    attackPower: playerStats.attackPower,
    defense: playerStats.defense,
    critChance: playerStats.critChance,
    critDamage: playerStats.critDamage,
    evasion: 5, // Base evasion
    position: playerPos,
    isDefending,
    cooldowns: skillCooldowns,
  }

  // Get available skills (defined early for keyboard handler)
  const availableSkills = COMBAT_SKILLS.filter((s) => s.levelRequired <= playerStats.level)

  // Add to combat log
  const addLog = useCallback((message: string, type: 'player' | 'enemy' | 'system') => {
    setCombatLog((prev) => [
      ...prev.slice(-20),
      { id: `${Date.now()}-${Math.random()}`, turn: turnNumber, message, type },
    ])
  }, [turnNumber])

  // Check for combat end
  useEffect(() => {
    const { over, victory } = isCombatOver(enemies)
    if (over && !showVictory && !showDefeat) {
      const combatRewards = calculateCombatRewards(enemies)
      setRewards(combatRewards)
      setShowVictory(true)
    }
  }, [enemies, showVictory, showDefeat])

  useEffect(() => {
    if (playerHP <= 0 && !showDefeat && !showVictory) {
      setShowDefeat(true)
    }
  }, [playerHP, showDefeat, showVictory])

  // Handle player attack
  const handleAttack = useCallback((enemyIndex: number) => {
    if (!isPlayerTurn || isAnimating) return

    const target = enemies[enemyIndex]
    if (!target || target.health <= 0) return

    setIsAnimating(true)
    const result = playerAttack(target, playerCombatStats, playerPos)

    if (result.success && result.damage) {
      // Apply damage to enemy
      setEnemies((prev) => prev.map((e, i) =>
        i === enemyIndex ? { ...e, health: Math.max(0, e.health - result.damage!) } : e
      ))
      addLog(result.message, 'player')
    } else {
      addLog(result.message, 'player')
    }

    setSelectedEnemy(null)
    setTimeout(() => {
      setIsAnimating(false)
      endPlayerTurn()
    }, 500)
  }, [isPlayerTurn, isAnimating, enemies, playerCombatStats, playerPos, addLog])

  // Handle skill use
  const handleUseSkill = useCallback((skill: CombatSkill, enemyIndex?: number) => {
    if (!isPlayerTurn || isAnimating) return

    // Check cooldown
    const cooldown = skillCooldowns.get(skill.id) || 0
    if (cooldown > 0) {
      addLog(`${skill.name} is on cooldown (${cooldown} turns)`, 'system')
      return
    }

    // Check energy
    if (energy < skill.energyCost) {
      addLog(`Not enough energy for ${skill.name}!`, 'system')
      return
    }

    const target = enemyIndex !== undefined ? enemies[enemyIndex] ?? null : null

    // Check if skill needs target
    if (skill.range > 0 && !target) {
      setSelectedSkill(skill)
      addLog(`Select a target for ${skill.name}`, 'system')
      return
    }

    setIsAnimating(true)
    onEnergyUse(skill.energyCost)

    const result = playerUseSkill(skill, target, playerCombatStats, playerPos, enemies)

    if (result.success) {
      // Apply damage
      if (result.damage && target) {
        const targetIndex = enemies.indexOf(target)
        setEnemies((prev) => prev.map((e, i) =>
          i === targetIndex ? { ...e, health: Math.max(0, e.health - result.damage!) } : e
        ))
      }

      // Apply healing
      if (result.healing) {
        setPlayerHP((prev) => Math.min(playerStats.maxHealth, prev + result.healing!))
        onHeal(result.healing)
      }

      // Apply status effect
      if (result.statusApplied && target) {
        const targetIndex = enemies.indexOf(target)
        setEnemies((prev) => prev.map((e, i) =>
          i === targetIndex
            ? { ...e, statusEffects: [...e.statusEffects, result.statusApplied!] }
            : e
        ))
      }

      // Set cooldown
      if (skill.cooldown > 0) {
        setSkillCooldowns((prev) => new Map(prev).set(skill.id, skill.cooldown))
      }

      addLog(result.message, 'player')
    } else {
      addLog(result.message, 'system')
    }

    setSelectedSkill(null)
    setSelectedEnemy(null)

    setTimeout(() => {
      setIsAnimating(false)
      if (result.success) {
        endPlayerTurn()
      }
    }, 500)
  }, [isPlayerTurn, isAnimating, skillCooldowns, energy, enemies, playerCombatStats, playerPos, playerStats.maxHealth, onEnergyUse, onHeal, addLog])

  // Handle defend
  const handleDefend = useCallback(() => {
    if (!isPlayerTurn || isAnimating) return

    setIsAnimating(true)
    setIsDefending(true)
    addLog('Defending! Damage reduced by 50% this turn.', 'player')

    setTimeout(() => {
      setIsAnimating(false)
      endPlayerTurn()
    }, 300)
  }, [isPlayerTurn, isAnimating, addLog])

  // Handle move
  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!isPlayerTurn || isAnimating) return

    const newPos = { ...playerPos }
    switch (direction) {
      case 'up': newPos.row -= 1; break
      case 'down': newPos.row += 1; break
      case 'left': newPos.col -= 1; break
      case 'right': newPos.col += 1; break
    }

    const result = playerMove(newPos, playerPos, enemies)

    if (result.success) {
      setIsAnimating(true)
      setPlayerPos(newPos)
      addLog(result.message, 'player')

      setTimeout(() => {
        setIsAnimating(false)
        endPlayerTurn()
      }, 200)
    } else {
      addLog(result.message, 'system')
    }
  }, [isPlayerTurn, isAnimating, playerPos, enemies, addLog])

  // Handle escape
  const handleEscape = useCallback(() => {
    if (!isPlayerTurn || isAnimating) return

    if (energy < ESCAPE_ENERGY_COST) {
      addLog(`Not enough energy to escape! Need ${ESCAPE_ENERGY_COST}`, 'system')
      return
    }

    setIsAnimating(true)
    onEnergyUse(ESCAPE_ENERGY_COST)

    const result = playerEscape(energy)
    addLog(result.message, 'player')

    if (result.escaped) {
      setTimeout(() => {
        onCombatEnd(false)
      }, 1000)
    } else {
      setTimeout(() => {
        setIsAnimating(false)
        endPlayerTurn()
      }, 500)
    }
  }, [isPlayerTurn, isAnimating, energy, onEnergyUse, addLog, onCombatEnd])

  // End player turn, start enemy turn
  const endPlayerTurn = useCallback(() => {
    setIsPlayerTurn(false)
    setIsDefending(false)

    // Process enemy turns with delay
    setTimeout(() => {
      processEnemyTurns()
    }, 500)
  }, [])

  // Process all enemy turns
  const processEnemyTurns = useCallback(() => {
    let currentHP = playerHP
    let delay = 0

    const aliveEnemies = enemies.filter((e) => e.health > 0)

    for (const enemy of aliveEnemies) {
      setTimeout(() => {
        // Check if enemy is stunned
        if (enemy.statusEffects.some((s) => s.type === 'stunned')) {
          addLog(`${enemy.name} is stunned and cannot act!`, 'enemy')
          return
        }

        const action = getEnemyAction(enemy, playerPos, enemies)

        if (action.type === 'attack') {
          const result = enemyAttack(enemy, playerCombatStats)
          if (result.damage) {
            currentHP = Math.max(0, currentHP - result.damage)
            setPlayerHP(currentHP)
            onDamage(result.damage)
          }
          addLog(result.message, 'enemy')
        } else if (action.type === 'move' && action.target) {
          setEnemies((prev) => prev.map((e) =>
            e.id === enemy.id ? { ...e, combatPosition: action.target! } : e
          ))
          addLog(`${enemy.name} moves closer.`, 'enemy')
        }
      }, delay)

      delay += 400
    }

    // End enemy turn after all actions
    setTimeout(() => {
      // Reduce cooldowns
      setSkillCooldowns((prev) => {
        const newCooldowns = new Map(prev)
        for (const [skill, cd] of newCooldowns) {
          if (cd > 0) newCooldowns.set(skill, cd - 1)
        }
        return newCooldowns
      })

      // Process status effects
      setEnemies((prev) => prev.map((e) => ({
        ...e,
        statusEffects: processStatusEffects(e.statusEffects),
      })))

      setTurnNumber((t) => t + 1)
      setIsPlayerTurn(true)
    }, delay + 300)
  }, [enemies, playerHP, playerPos, playerCombatStats, addLog, onDamage])

  // Handle victory confirmation
  const handleVictoryConfirm = useCallback(() => {
    onCombatEnd(true, rewards || undefined, initialEnemies)
  }, [onCombatEnd, rewards, initialEnemies])

  // Handle defeat confirmation
  const handleDefeatConfirm = useCallback(() => {
    onCombatEnd(false)
  }, [onCombatEnd])

  // Keyboard controls for combat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayerTurn || isAnimating || showVictory || showDefeat) return

      switch (e.key.toLowerCase()) {
        case 'enter':
        case ' ':
          // Attack selected enemy
          if (selectedEnemy !== null) {
            const target = enemies[selectedEnemy]
            if (target && target.health > 0) {
              handleAttack(selectedEnemy)
            }
          }
          e.preventDefault()
          break
        case 'w':
        case 'arrowup':
          handleMove('up')
          e.preventDefault()
          break
        case 's':
        case 'arrowdown':
          handleMove('down')
          e.preventDefault()
          break
        case 'a':
        case 'arrowleft':
          handleMove('left')
          e.preventDefault()
          break
        case 'd':
        case 'arrowright':
          handleMove('right')
          e.preventDefault()
          break
        case 'e':
          // Escape
          handleEscape()
          e.preventDefault()
          break
        case 'q':
          // Defend
          handleDefend()
          e.preventDefault()
          break
        case 'tab':
          // Cycle through enemies
          {
            const aliveEnemies = enemies.map((enemy, idx) => ({ enemy, idx })).filter(({ enemy }) => enemy.health > 0)
            if (aliveEnemies.length > 0) {
              const currentIdx = aliveEnemies.findIndex(({ idx }) => idx === selectedEnemy)
              const nextIdx = (currentIdx + 1) % aliveEnemies.length
              const nextEnemy = aliveEnemies[nextIdx]
              if (nextEnemy) {
                setSelectedEnemy(nextEnemy.idx)
              }
            }
          }
          e.preventDefault()
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
          // Quick skill use (1-7)
          {
            const skillIndex = parseInt(e.key) - 1
            const skill = availableSkills[skillIndex]
            if (skill) {
              handleUseSkill(skill, selectedEnemy ?? undefined)
            }
          }
          e.preventDefault()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlayerTurn, isAnimating, showVictory, showDefeat, selectedEnemy, enemies, availableSkills, handleAttack, handleMove, handleEscape, handleDefend, handleUseSkill])

  // Render grid cell
  const renderCell = (row: number, col: number) => {
    const isPlayer = playerPos.row === row && playerPos.col === col
    const enemy = enemies.find(
      (e) => e.health > 0 && e.combatPosition.row === row && e.combatPosition.col === col
    )
    const isTargetable = selectedSkill && enemy && !isAnimating

    return (
      <motion.div
        key={`${row}-${col}`}
        className={`
          aspect-square  border transition-all cursor-pointer
          ${isPlayer ? 'bg-cyan-500/30 border-cyan-400' : ''}
          ${enemy ? `bg-red-500/20 border-red-500/50 ${isTargetable ? 'hover:bg-red-500/40 hover:border-red-400' : ''}` : ''}
          ${!isPlayer && !enemy ? 'bg-white/5 border-white/10' : ''}
          ${selectedEnemy !== null && enemies[selectedEnemy]?.combatPosition.row === row && enemies[selectedEnemy]?.combatPosition.col === col ? 'ring-2 ring-yellow-400' : ''}
        `}
        onClick={() => {
          if (enemy && isPlayerTurn && !isAnimating) {
            const idx = enemies.findIndex((e) => e.id === enemy.id)
            if (selectedSkill) {
              handleUseSkill(selectedSkill, idx)
            } else {
              setSelectedEnemy(idx)
            }
          }
        }}
        whileHover={enemy && isPlayerTurn ? { scale: 1.05 } : {}}
        whileTap={enemy && isPlayerTurn ? { scale: 0.95 } : {}}
      >
        <div className="w-full h-full flex items-center justify-center relative">
          {isPlayer && (
            <motion.div
              className="text-2xl"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <div className="w-6 h-6 bg-cyan-400  shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            </motion.div>
          )}
          {enemy && (
            <div className="flex flex-col items-center">
              <span className="text-xl">{getEnemyIcon(enemy.type)}</span>
              {/* Mini HP bar */}
              <div className="w-8 h-1 bg-black/50  mt-1 overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Combat Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-red-400" />
            <span className="text-white font-bold">COMBAT</span>
            <span className="text-white/50 text-sm">Turn {turnNumber}</span>
          </div>
          <div className={`px-3 py-1  text-sm font-medium ${
            isPlayerTurn ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {isPlayerTurn ? 'Your Turn' : 'Enemy Turn'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Panel - Player Stats & Skills */}
          <div className="space-y-3">
            {/* Player HP */}
            <div className="p-3  bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-sm flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-400" /> HP
                </span>
                <span className="text-white font-medium">
                  {playerHP}/{playerStats.maxHealth}
                </span>
              </div>
              <div className="h-3 bg-black/50  overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(playerHP / playerStats.maxHealth) * 100}%` }}
                />
              </div>
            </div>

            {/* Energy */}
            <div className="p-3  bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-sm flex items-center gap-1">
                  <Zap className="w-4 h-4 text-yellow-400" /> Energy
                </span>
                <span className="text-white font-medium">{energy}</span>
              </div>
              <div className="h-2 bg-black/50  overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all"
                  style={{ width: `${(energy / 100) * 100}%` }}
                />
              </div>
            </div>

            {/* Skills */}
            <div className="p-3  bg-white/5 border border-white/10">
              <h3 className="text-white/70 text-sm mb-2 flex items-center gap-1">
                <Target className="w-4 h-4" /> Skills
              </h3>
              <div className="space-y-1.5">
                {availableSkills.map((skill) => {
                  const cooldown = skillCooldowns.get(skill.id) || 0
                  const canUse = isPlayerTurn && !isAnimating && energy >= skill.energyCost && cooldown === 0

                  return (
                    <button
                      key={skill.id}
                      onClick={() => {
                        if (canUse) {
                          if (skill.range > 0) {
                            setSelectedSkill(skill)
                            addLog(`Select target for ${skill.name}`, 'system')
                          } else {
                            handleUseSkill(skill)
                          }
                        }
                      }}
                      disabled={!canUse}
                      className={`w-full p-2  text-left text-sm transition-all ${
                        canUse
                          ? selectedSkill?.id === skill.id
                            ? 'bg-purple-500/30 border border-purple-400'
                            : 'bg-white/10 hover:bg-white/20 border border-transparent'
                          : 'bg-white/5 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={canUse ? 'text-white' : 'text-white/40'}>
                          {skill.name}
                        </span>
                        <span className="text-xs text-yellow-400">
                          {skill.energyCost > 0 ? `${skill.energyCost}E` : 'FREE'}
                        </span>
                      </div>
                      {cooldown > 0 && (
                        <span className="text-xs text-red-400">CD: {cooldown}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Center Panel - Battle Grid */}
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-5 gap-1 p-2  bg-black/50 border border-white/20">
              {Array.from({ length: COMBAT_GRID_SIZE }).map((_, row) =>
                Array.from({ length: COMBAT_GRID_SIZE }).map((_, col) => renderCell(row, col))
              )}
            </div>

            {/* Movement Controls */}
            <div className="mt-4 grid grid-cols-3 gap-1">
              <div />
              <button
                onClick={() => handleMove('up')}
                disabled={!isPlayerTurn || isAnimating}
                className="p-2  bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUp className="w-5 h-5 text-white" />
              </button>
              <div />
              <button
                onClick={() => handleMove('left')}
                disabled={!isPlayerTurn || isAnimating}
                className="p-2  bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleDefend}
                disabled={!isPlayerTurn || isAnimating}
                className="p-2  bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Defend"
              >
                <Shield className="w-5 h-5 text-blue-400" />
              </button>
              <button
                onClick={() => handleMove('right')}
                disabled={!isPlayerTurn || isAnimating}
                className="p-2  bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
              <div />
              <button
                onClick={() => handleMove('down')}
                disabled={!isPlayerTurn || isAnimating}
                className="p-2  bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowDown className="w-5 h-5 text-white" />
              </button>
              <div />
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-2">
              {selectedEnemy !== null && (
                <button
                  onClick={() => handleAttack(selectedEnemy)}
                  disabled={!isPlayerTurn || isAnimating}
                  className="px-4 py-2  bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 disabled:opacity-30"
                >
                  <Swords className="w-4 h-4 inline mr-1" />
                  Attack
                </button>
              )}
              <button
                onClick={handleEscape}
                disabled={!isPlayerTurn || isAnimating || energy < ESCAPE_ENERGY_COST}
                className="px-4 py-2  bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30 disabled:opacity-30"
              >
                <LogOut className="w-4 h-4 inline mr-1" />
                Escape ({ESCAPE_ENERGY_COST}E)
              </button>
            </div>

            {/* Keyboard Hints */}
            <div className="mt-2 text-center text-[10px] text-white/30 hidden md:block">
              <span className="px-1.5 py-0.5 rounded bg-white/10 mr-1">Enter</span> Attack
              <span className="mx-2">|</span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 mr-1">WASD</span> Move
              <span className="mx-2">|</span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 mr-1">Q</span> Defend
              <span className="mx-2">|</span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 mr-1">Tab</span> Target
              <span className="mx-2">|</span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 mr-1">1-7</span> Skills
            </div>
          </div>

          {/* Right Panel - Enemies & Log */}
          <div className="space-y-3">
            {/* Enemy List */}
            <div className="p-3  bg-white/5 border border-white/10">
              <h3 className="text-white/70 text-sm mb-2 flex items-center gap-1">
                <Skull className="w-4 h-4 text-red-400" /> Enemies
              </h3>
              <div className="space-y-2">
                {enemies.map((enemy, idx) => (
                  <div
                    key={enemy.id}
                    className={`p-2  transition-all ${
                      enemy.health <= 0
                        ? 'bg-black/30 opacity-50'
                        : selectedEnemy === idx
                          ? 'bg-red-500/20 border border-red-400'
                          : 'bg-white/5 hover:bg-white/10 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (enemy.health > 0 && isPlayerTurn && !isAnimating) {
                        setSelectedEnemy(idx)
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getEnemyIcon(enemy.type)}</span>
                        <div>
                          <div className={`text-sm font-medium ${getEnemyColor(enemy.tier)}`}>
                            {enemy.name}
                          </div>
                          <div className="text-xs text-white/40">Lv.{enemy.level}</div>
                        </div>
                      </div>
                      {enemy.health > 0 && (
                        <div className="text-right">
                          <div className="text-xs text-white/60">
                            {enemy.health}/{enemy.maxHealth}
                          </div>
                        </div>
                      )}
                    </div>
                    {enemy.health > 0 && (
                      <div className="mt-1.5 h-1.5 bg-black/50  overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all"
                          style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                        />
                      </div>
                    )}
                    {enemy.statusEffects.length > 0 && (
                      <div className="mt-1 flex gap-1">
                        {enemy.statusEffects.map((effect, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-xs bg-purple-500/30 text-purple-300"
                          >
                            {effect.type}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Combat Log */}
            <div className="p-3  bg-white/5 border border-white/10 max-h-40 overflow-hidden">
              <h3 className="text-white/70 text-sm mb-2">Combat Log</h3>
              <div className="space-y-1 text-xs overflow-y-auto max-h-28">
                {combatLog.slice(-8).map((entry) => (
                  <div
                    key={entry.id}
                    className={`${
                      entry.type === 'player'
                        ? 'text-cyan-400'
                        : entry.type === 'enemy'
                          ? 'text-red-400'
                          : 'text-white/50'
                    }`}
                  >
                    {entry.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Victory Screen */}
      <AnimatePresence>
        {showVictory && rewards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-b from-green-900/50 to-black/90 border border-green-500/50  p-8 text-center max-w-md"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-6xl mb-4"
              >
                🏆
              </motion.div>
              <h2 className="text-3xl font-bold text-green-400 mb-2">VICTORY!</h2>
              <p className="text-white/60 mb-6">All enemies defeated!</p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between p-3  bg-white/5">
                  <span className="text-white/70">XP Earned</span>
                  <span className="text-cyan-400 font-bold">+{rewards.xp}</span>
                </div>
                <div className="flex justify-between p-3  bg-white/5">
                  <span className="text-white/70">Points</span>
                  <span className="text-yellow-400 font-bold">+{rewards.points}</span>
                </div>
                {rewards.items.length > 0 && (
                  <div className="p-3  bg-white/5">
                    <span className="text-white/70 block mb-2">Loot</span>
                    <div className="flex flex-wrap gap-2">
                      {rewards.items.map((item, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleVictoryConfirm}
                className="w-full py-3  bg-green-500 text-white font-bold hover:bg-green-400 transition-colors"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Defeat Screen */}
      <AnimatePresence>
        {showDefeat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-b from-red-900/50 to-black/90 border border-red-500/50  p-8 text-center max-w-md"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-6xl mb-4"
              >
                💀
              </motion.div>
              <h2 className="text-3xl font-bold text-red-400 mb-2">DEFEATED</h2>
              <p className="text-white/60 mb-6">You have fallen in battle...</p>
              <p className="text-white/40 text-sm mb-6">
                You will respawn at the nearest Safe Haven with reduced energy.
              </p>

              <button
                onClick={handleDefeatConfirm}
                className="w-full py-3  bg-red-500 text-white font-bold hover:bg-red-400 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Respawn
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CombatUI
