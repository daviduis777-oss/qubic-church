'use client'

/**
 * Anna Matrix Explorer - Crafting UI Component
 * Recipe browser, crafting interface, and material display
 */

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hammer,
  X,
  ChevronRight,
  Zap,
  Star,
  Lock,
  Check,
  AlertCircle,
} from 'lucide-react'
import type { InventoryItem, PlayerStats } from '../engine/types'
import {
  type Recipe,
  type RecipeCategory,
  RECIPES,
  getRecipesByCategory,
  getRecipeCategories,
  getCategoryInfo,
  getCraftedItem,
} from '../data/recipes'
import { RESOURCES, type ResourceType } from '../data/resources'
import {
  checkCraftRequirements,
  craftRecipe,
  getItemName,
  getItemIcon,
  inventoryToMap,
  formatCraftTime,
  getRarityColor,
  getRarityBg,
} from '../systems/crafting'

interface CraftingUIProps {
  isOpen: boolean
  onClose: () => void
  inventory: InventoryItem[]
  playerStats: PlayerStats
  energy: number
  onCraft: (result: {
    item: InventoryItem
    materialsConsumed: { itemId: string; quantity: number }[]
    energyUsed: number
    xpGained: number
  }) => void
}

export function CraftingUI({
  isOpen,
  onClose,
  inventory,
  playerStats,
  energy,
  onCraft,
}: CraftingUIProps) {
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory>('tools')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [craftingProgress, setCraftingProgress] = useState(0)
  const [isCrafting, setIsCrafting] = useState(false)

  // Convert inventory to map for quick lookups
  const inventoryMap = useMemo(() => inventoryToMap(inventory), [inventory])

  // Get recipes for current category
  const categoryRecipes = useMemo(
    () => getRecipesByCategory(selectedCategory),
    [selectedCategory]
  )

  // Get all categories
  const categories = getRecipeCategories()

  // Check if recipe can be crafted
  const getRecipeStatus = useCallback((recipe: Recipe) => {
    return checkCraftRequirements(
      recipe,
      inventoryMap,
      playerStats.level,
      energy
    )
  }, [inventoryMap, playerStats.level, energy])

  // Handle recipe selection
  const handleSelectRecipe = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe)
  }, [])

  // Handle crafting
  const handleCraft = useCallback(() => {
    if (!selectedRecipe || isCrafting) return

    const status = getRecipeStatus(selectedRecipe)
    if (!status.canCraft) return

    setIsCrafting(true)
    setCraftingProgress(0)

    // Simulate crafting progress
    const duration = selectedRecipe.craftTime
    const startTime = Date.now()

    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(100, (elapsed / duration) * 100)
      setCraftingProgress(progress)

      if (progress < 100) {
        requestAnimationFrame(updateProgress)
      } else {
        // Crafting complete
        const result = craftRecipe(
          selectedRecipe,
          inventoryMap,
          playerStats.level,
          energy
        )

        if (result.success && result.item && result.materialsConsumed) {
          onCraft({
            item: result.item,
            materialsConsumed: result.materialsConsumed,
            energyUsed: result.energyUsed,
            xpGained: result.xpGained || 0,
          })
        }

        setIsCrafting(false)
        setCraftingProgress(0)
      }
    }

    requestAnimationFrame(updateProgress)
  }, [selectedRecipe, isCrafting, getRecipeStatus, inventoryMap, playerStats.level, energy, onCraft])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-4xl max-h-[80vh] bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Hammer className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Crafting</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex h-[calc(80vh-80px)]">
            {/* Left Panel - Categories & Recipes */}
            <div className="w-1/2 border-r border-white/10 flex flex-col">
              {/* Category Tabs */}
              <div className="flex gap-1 p-2 border-b border-white/10 overflow-x-auto">
                {categories.map(cat => {
                  const info = getCategoryInfo(cat)
                  const isActive = selectedCategory === cat

                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat)
                        setSelectedRecipe(null)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <span className="mr-1">{info.icon}</span>
                      {info.name}
                    </button>
                  )
                })}
              </div>

              {/* Recipe List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {categoryRecipes.map(recipe => {
                  const status = getRecipeStatus(recipe)
                  const isSelected = selectedRecipe?.id === recipe.id
                  const craftedItem = getCraftedItem(recipe.outputId)

                  return (
                    <button
                      key={recipe.id}
                      onClick={() => handleSelectRecipe(recipe)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border border-cyan-500/30'
                          : status.canCraft
                            ? 'bg-white/5 hover:bg-white/10 border border-transparent'
                            : 'bg-white/5 opacity-60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{recipe.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${
                              craftedItem ? getRarityColor(craftedItem.rarity) : 'text-white'
                            }`}>
                              {recipe.name}
                            </span>
                            {!status.meetsLevel && (
                              <Lock className="w-3 h-3 text-red-400" />
                            )}
                          </div>
                          <div className="text-xs text-white/40">
                            Lv.{recipe.levelRequired} | {formatCraftTime(recipe.craftTime)}
                          </div>
                        </div>
                        {status.canCraft ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400/50" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right Panel - Recipe Details */}
            <div className="w-1/2 flex flex-col">
              {selectedRecipe ? (
                <>
                  {/* Recipe Info */}
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-xl ${
                        getCraftedItem(selectedRecipe.outputId)
                          ? getRarityBg(getCraftedItem(selectedRecipe.outputId)!.rarity)
                          : 'bg-white/10'
                      } flex items-center justify-center text-3xl`}>
                        {selectedRecipe.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold ${
                          getCraftedItem(selectedRecipe.outputId)
                            ? getRarityColor(getCraftedItem(selectedRecipe.outputId)!.rarity)
                            : 'text-white'
                        }`}>
                          {selectedRecipe.name}
                          {selectedRecipe.outputQuantity > 1 && (
                            <span className="text-sm text-white/50 ml-2">
                              x{selectedRecipe.outputQuantity}
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-white/60 mt-1">
                          {selectedRecipe.description}
                        </p>

                        {/* Item Stats Preview */}
                        {getCraftedItem(selectedRecipe.outputId) && (
                          <div className="flex gap-3 mt-2 text-xs">
                            {getCraftedItem(selectedRecipe.outputId)!.attackBonus && (
                              <span className="text-red-400">
                                +{getCraftedItem(selectedRecipe.outputId)!.attackBonus} ATK
                              </span>
                            )}
                            {getCraftedItem(selectedRecipe.outputId)!.defenseBonus && (
                              <span className="text-blue-400">
                                +{getCraftedItem(selectedRecipe.outputId)!.defenseBonus} DEF
                              </span>
                            )}
                            {getCraftedItem(selectedRecipe.outputId)!.healthBonus && (
                              <span className="text-green-400">
                                +{getCraftedItem(selectedRecipe.outputId)!.healthBonus} HP
                              </span>
                            )}
                            {getCraftedItem(selectedRecipe.outputId)!.healAmount && (
                              <span className="text-pink-400">
                                Heal {getCraftedItem(selectedRecipe.outputId)!.healAmount}
                              </span>
                            )}
                            {getCraftedItem(selectedRecipe.outputId)!.energyRestore && (
                              <span className="text-yellow-400">
                                +{getCraftedItem(selectedRecipe.outputId)!.energyRestore} Energy
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="p-4 border-b border-white/10">
                    <h4 className="text-sm font-medium text-white/70 mb-3">Requirements</h4>
                    <div className="flex gap-4 text-sm">
                      <div className={`flex items-center gap-1 ${
                        playerStats.level >= selectedRecipe.levelRequired
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        <Star className="w-4 h-4" />
                        Level {selectedRecipe.levelRequired}
                      </div>
                      <div className={`flex items-center gap-1 ${
                        energy >= selectedRecipe.energyCost
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        <Zap className="w-4 h-4" />
                        {selectedRecipe.energyCost} Energy
                      </div>
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <h4 className="text-sm font-medium text-white/70 mb-3">Materials</h4>
                    <div className="space-y-2">
                      {selectedRecipe.ingredients.map((ing, idx) => {
                        const hasEnough = (inventoryMap.get(ing.itemId) || 0) >= ing.quantity
                        const current = inventoryMap.get(ing.itemId) || 0

                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              hasEnough ? 'bg-green-500/10' : 'bg-red-500/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{getItemIcon(ing.itemId)}</span>
                              <span className="text-white">{getItemName(ing.itemId)}</span>
                            </div>
                            <span className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                              {current}/{ing.quantity}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Craft Button */}
                  <div className="p-4 border-t border-white/10">
                    {isCrafting ? (
                      <div className="space-y-2">
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                            style={{ width: `${craftingProgress}%` }}
                          />
                        </div>
                        <div className="text-center text-sm text-white/50">
                          Crafting... {Math.round(craftingProgress)}%
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleCraft}
                        disabled={!getRecipeStatus(selectedRecipe).canCraft}
                        className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                          getRecipeStatus(selectedRecipe).canCraft
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        <Hammer className="w-5 h-5" />
                        {getRecipeStatus(selectedRecipe).canCraft
                          ? 'Craft'
                          : getRecipeStatus(selectedRecipe).reason}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-white/30">
                  <div className="text-center">
                    <Hammer className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Select a recipe to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CraftingUI
