'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import type { TernaryState } from '@/lib/aigarth/types'

interface AigarthSynapseProps {
  sourcePosition: [number, number, number]
  targetPosition: [number, number, number]
  weight: TernaryState
  isActive?: boolean
  isHighlighted?: boolean
}

export function AigarthSynapse({
  sourcePosition,
  targetPosition,
  weight,
  isActive = false,
  isHighlighted = false,
}: AigarthSynapseProps) {
  // Color based on weight - gold for excitatory, red for inhibitory
  const color = useMemo(() => {
    if (weight > 0) return '#D4AF37' // Gold for excitatory
    if (weight < 0) return '#EF4444' // Red for inhibitory
    return '#6B7280' // Gray for neutral
  }, [weight])

  // Opacity based on state
  const opacity = useMemo(() => {
    if (isHighlighted) return 0.8
    if (isActive) return 0.4
    return 0.1
  }, [isActive, isHighlighted])

  // Line width
  const lineWidth = isHighlighted ? 2 : 1

  const points = useMemo(() => {
    return [sourcePosition, targetPosition]
  }, [sourcePosition, targetPosition])

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={opacity}
    />
  )
}

// Generate all synapses for the neural circle
export function AigarthSynapseNetwork({
  positions,
  states,
  numInputs,
  numNeighbors,
  showAll = false,
  highlightedNeuron,
}: {
  positions: [number, number, number][]
  states: TernaryState[]
  numInputs: number
  numNeighbors: number
  showAll?: boolean
  highlightedNeuron?: number | null
}) {
  const population = positions.length

  // Generate synapse data
  const synapses = useMemo(() => {
    const result: {
      source: number
      target: number
      weight: TernaryState
    }[] = []

    const leftCount = Math.floor(numNeighbors / 2)
    const rightCount = numNeighbors - leftCount

    // Only generate synapses for output neurons (they receive connections)
    for (let i = numInputs; i < population; i++) {
      // Left neighbors
      for (let offset = 1; offset <= leftCount; offset++) {
        const neighborIdx = (i - offset + population) % population
        result.push({
          source: neighborIdx,
          target: i,
          weight: states[neighborIdx] || 0,
        })
      }

      // Right neighbors
      for (let offset = 1; offset <= rightCount; offset++) {
        const neighborIdx = (i + offset) % population
        result.push({
          source: neighborIdx,
          target: i,
          weight: states[neighborIdx] || 0,
        })
      }
    }

    return result
  }, [population, numInputs, numNeighbors, states])

  // Filter visible synapses
  const visibleSynapses = useMemo(() => {
    if (showAll) return synapses

    // Show only synapses connected to highlighted neuron
    if (highlightedNeuron !== null && highlightedNeuron !== undefined) {
      return synapses.filter(
        (s) => s.source === highlightedNeuron || s.target === highlightedNeuron
      )
    }

    // Show only active synapses (non-zero weight)
    return synapses.filter((s) => s.weight !== 0)
  }, [synapses, showAll, highlightedNeuron])

  return (
    <group>
      {visibleSynapses.map((synapse, index) => {
        const sourcePos = positions[synapse.source]
        const targetPos = positions[synapse.target]
        if (!sourcePos || !targetPos) return null

        const isHighlighted =
          highlightedNeuron !== null &&
          highlightedNeuron !== undefined &&
          (synapse.source === highlightedNeuron ||
            synapse.target === highlightedNeuron)

        return (
          <AigarthSynapse
            key={`${synapse.source}-${synapse.target}-${index}`}
            sourcePosition={sourcePos}
            targetPosition={targetPos}
            weight={synapse.weight}
            isActive={synapse.weight !== 0}
            isHighlighted={isHighlighted}
          />
        )
      })}
    </group>
  )
}
