'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  AddressNode,
  AddressEdge,
  AddressGraphData,
  AddressGraphError,
  NetworkStats,
  LoadStats,
  RawInterestingAddress,
  AddressType,
} from './types'
import { DATA_URLS } from './constants'

// =============================================================================
// HOOK: useAddressGraphData
// =============================================================================
// Simplified version focusing on:
// - Anna Matrix addresses (983,040 mathematically derived)
// - VIP addresses (1CFB*, verified Bitcoin addresses)
// - NO Patoshi data (unverified Qubic connection)
// =============================================================================

interface UseAddressGraphDataReturn {
  loading: boolean
  progress: number
  loadStats: LoadStats
  error: AddressGraphError | null
  data: AddressGraphData | null
  retry: () => void
  retryCount: number

  // Helpers
  getNodeById: (id: string) => AddressNode | undefined
  getConnectedNodes: (nodeId: string) => { incoming: AddressEdge[]; outgoing: AddressEdge[] }
  searchNode: (query: string) => AddressNode | null
}

// Smart sampling function - select evenly distributed samples
function smartSample<T>(arr: T[], maxCount: number): T[] {
  if (arr.length <= maxCount) return arr
  const step = arr.length / maxCount
  const result: T[] = []
  for (let i = 0; i < maxCount; i++) {
    const item = arr[Math.floor(i * step)]
    if (item !== undefined) result.push(item)
  }
  return result
}

// XOR Layer Configuration - Subtle blue gradient for depth
const XOR_LAYER_CONFIG = [
  { xor: 0,  yLevel: 0,  color: '#1E3A5F', name: 'Layer 0 (XOR 0)'  },
  { xor: 7,  yLevel: 8,  color: '#2D4A6E', name: 'Layer 1 (XOR 7)'  },
  { xor: 13, yLevel: 16, color: '#3C5A7D', name: 'Layer 2 (XOR 13)' },
  { xor: 27, yLevel: 24, color: '#4B6A8C', name: 'Layer 3 (XOR 27)' },
  { xor: 33, yLevel: 32, color: '#5A7A9B', name: 'Layer 4 (XOR 33)' },
]

export function useAddressGraphData(): UseAddressGraphDataReturn {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<AddressGraphError | null>(null)
  const [data, setData] = useState<AddressGraphData | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [loadStats, setLoadStats] = useState<LoadStats>({
    patoshi: 0, // Removed - keeping interface for compatibility
    cfbLinked: 0,
    matrixDerived: 0,
    totalEdges: 0,
  })

  // Load all data
  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setProgress(0)
    setError(null)

    try {
      // Phase 1: Load VIP addresses (1CFB*, verified) - 20%
      setProgress(10)
      const interestingRes = await fetch(DATA_URLS.interesting, { signal })
      if (!interestingRes.ok) throw new Error('Failed to load VIP addresses')
      const interestingJson = await interestingRes.json()
      const interestingAddresses: RawInterestingAddress[] = interestingJson.records || []
      setProgress(20)

      // Phase 2: Try to load matrix addresses (optional - large file may not be deployed)
      setProgress(30)
      let matrixAddresses: any[] = []
      try {
        const matrixRes = await fetch(DATA_URLS.matrix, { signal })
        if (matrixRes.ok) {
          const matrixJson = await matrixRes.json()
          matrixAddresses = matrixJson.records || []
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') throw err
        // Matrix addresses unavailable - continue with VIP-only mode
        console.info('Matrix addresses not available, showing VIP addresses only')
      }
      setProgress(70)

      // Update load stats
      setLoadStats({
        patoshi: 0, // Removed
        cfbLinked: interestingAddresses.length,
        matrixDerived: matrixAddresses.length,
        totalEdges: 0,
      })

      // Phase 3: Process data into nodes - 95%
      setProgress(75)

      const nodes: AddressNode[] = []
      const nodeMap = new Map<string, AddressNode>()
      const vipNodes: AddressNode[] = []

      // Process VIP nodes (1CFB* addresses) - ALL of them
      interestingAddresses.forEach((addr) => {
        const isCFB = addr.address.startsWith('1CFB')
        const type: AddressType = isCFB ? 'cfb-vanity' : 'matrix-derived'

        // Position VIP nodes prominently at the center
        const centerX = (addr.position[0] - 64) * 0.5
        const centerZ = (addr.position[1] - 64) * 0.5
        const xorLayer = XOR_LAYER_CONFIG.find(l => l.xor === addr.xor) ?? XOR_LAYER_CONFIG[0]
        const yLevel = xorLayer?.yLevel ?? 0

        const node: AddressNode = {
          id: addr.address,
          address: addr.address,
          type,
          position: [centerX, yLevel + 2, centerZ], // Slightly elevated
          color: '#06B6D4', // Cyan for VIP
          shape: 'cube',
          size: 'large',
          glowIntensity: 0.8,
          xorRings: xorLayer?.xor === 0 ? 0 : Math.floor((xorLayer?.xor ?? 0) / 10) + 1,
          matrixPosition: addr.position,
          derivationMethod: addr.method as any,
          xorVariant: addr.xor,
          compressed: addr.compressed,
          hash160: addr.hash160,
          state: 'default',
          isVIP: true,
        }

        nodes.push(node)
        nodeMap.set(addr.address, node)
        vipNodes.push(node)
      })

      setProgress(80)

      // =========================================================================
      // ANNA MATRIX ADDRESSES - 128×128 Grid with XOR Layers
      // =========================================================================
      // Layout:
      //   X-axis = Matrix column (0-127)
      //   Y-axis = XOR layer (0, 7, 13, 27, 33)
      //   Z-axis = Matrix row (0-127)
      // =========================================================================

      const ADDRESSES_PER_LAYER = 2000
      const GRID_SCALE = 0.5

      // Group addresses by XOR value
      const addressesByXor: Record<number, any[]> = {
        0: [], 7: [], 13: [], 27: [], 33: []
      }

      matrixAddresses.forEach((addr: any) => {
        const xor = addr.xor
        if (xor in addressesByXor) {
          addressesByXor[xor]!.push(addr)
        }
      })

      // Create nodes for each XOR layer
      XOR_LAYER_CONFIG.forEach((layerConfig) => {
        const layerAddresses = addressesByXor[layerConfig.xor] || []
        const sampledLayer = smartSample(layerAddresses, ADDRESSES_PER_LAYER)

        sampledLayer.forEach((addr: any) => {
          if (nodeMap.has(addr.address)) return

          // Position based on matrix coordinates
          const [row, col] = addr.position || [0, 0]
          const x = (col - 64) * GRID_SCALE
          const z = (row - 64) * GRID_SCALE

          // Small variation for visual depth (deterministic)
          const microOffset = ((addr.id * 7919) % 100) / 500
          const y = layerConfig.yLevel + microOffset

          const node: AddressNode = {
            id: addr.address,
            address: addr.address,
            type: 'matrix-derived',
            position: [x, y, z],
            color: layerConfig.color,
            shape: 'sphere',
            size: 'small',
            glowIntensity: 0.2,
            xorRings: layerConfig.xor === 0 ? 0 : Math.floor(layerConfig.xor / 10) + 1,
            xorVariant: layerConfig.xor,
            matrixPosition: [row, col],
            derivationMethod: addr.method as any,
            compressed: addr.compressed,
            hash160: addr.hash160,
            state: 'default',
            isVIP: false,
          }

          nodes.push(node)
          nodeMap.set(addr.address, node)
        })
      })

      setProgress(90)

      // Create edges between VIP nodes based on matrix proximity
      const edges: AddressEdge[] = []

      vipNodes.forEach((nodeA, i) => {
        vipNodes.slice(i + 1).forEach((nodeB) => {
          if (!nodeA.matrixPosition || !nodeB.matrixPosition) return
          const dist = Math.abs(nodeA.matrixPosition[0] - nodeB.matrixPosition[0]) +
                       Math.abs(nodeA.matrixPosition[1] - nodeB.matrixPosition[1])
          if (dist <= 30) {
            edges.push({
              id: `matrix-${nodeA.id}-${nodeB.id}`,
              source: nodeA.id,
              target: nodeB.id,
              type: 'matrix-adjacent',
              weight: 1 - dist / 30,
              color: '#06B6D4',
              style: 'dotted',
              animated: true,
              particleCount: 2,
              matrixDistance: dist,
            })
          }
        })
      })

      setProgress(95)

      // Calculate stats
      const stats: NetworkStats = {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        clusters: 5, // XOR layers
        avgConnections: edges.length / Math.max(1, nodes.length),
        byType: {
          'patoshi-genesis': 0,
          'patoshi': 0,
          'cfb-vanity': nodes.filter((n) => n.type === 'cfb-vanity').length,
          'patoshi-vanity': 0,
          'matrix-derived': nodes.filter((n) => n.type === 'matrix-derived').length,
          'seed-validated': 0,
          'seed-mismatch': 0,
          'unknown': 0,
        },
        byMethod: {},
        byXor: {
          0: addressesByXor[0]?.length ?? 0,
          7: addressesByXor[7]?.length ?? 0,
          13: addressesByXor[13]?.length ?? 0,
          27: addressesByXor[27]?.length ?? 0,
          33: addressesByXor[33]?.length ?? 0,
        },
        patoshiBlocks: { min: 0, max: 0 },
        totalBTC: 0,
        validatedSeeds: 0,
        mismatchedSeeds: 0,
        fullDatasetCounts: {
          patoshi: 0,
          matrix: matrixAddresses.length,
          interesting: interestingAddresses.length,
        },
      }

      setLoadStats((s) => ({ ...s, totalEdges: edges.length }))
      setProgress(100)

      setData({ nodes, edges, stats, vipNodes })
      setLoading(false)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('Failed to load address graph data:', err)
      setError({
        type: 'NETWORK_ERROR',
        message: 'Failed to Load Data',
        details: err instanceof Error ? err.message : 'Unknown error',
        retryable: true,
      })
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    const controller = new AbortController()
    loadData(controller.signal)
    return () => controller.abort()
  }, [loadData])

  // Retry handler
  const retry = useCallback(() => {
    setRetryCount((c) => c + 1)
    loadData()
  }, [loadData])

  // Memoized node map for O(1) lookups
  const nodeMapRef = useMemo(() => {
    if (!data) return new Map<string, AddressNode>()
    const map = new Map<string, AddressNode>()
    data.nodes.forEach((n) => map.set(n.id, n))
    data.nodes.forEach((n) => {
      if (n.address && !map.has(n.address)) {
        map.set(n.address, n)
      }
    })
    return map
  }, [data])

  // Helper: Get node by ID
  const getNodeById = useCallback(
    (id: string): AddressNode | undefined => {
      return nodeMapRef.get(id)
    },
    [nodeMapRef]
  )

  // Helper: Get connected nodes
  const getConnectedNodes = useCallback(
    (nodeId: string) => {
      if (!data) return { incoming: [], outgoing: [] }
      return {
        incoming: data.edges.filter((e) => e.target === nodeId),
        outgoing: data.edges.filter((e) => e.source === nodeId),
      }
    },
    [data]
  )

  // Helper: Search node
  const searchNode = useCallback(
    (query: string): AddressNode | null => {
      if (!data || !query.trim()) return null
      const q = query.trim().toLowerCase()

      // Try exact match first (O(1))
      const exactMatch = nodeMapRef.get(query.trim())
      if (exactMatch) return exactMatch

      // Partial match search
      return (
        data.nodes.find(
          (n) =>
            n.address.toLowerCase().includes(q) ||
            n.id.toLowerCase().includes(q)
        ) || null
      )
    },
    [data, nodeMapRef]
  )

  return {
    loading,
    progress,
    loadStats,
    error,
    data,
    retry,
    retryCount,
    getNodeById,
    getConnectedNodes,
    searchNode,
  }
}
