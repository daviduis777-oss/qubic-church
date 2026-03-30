'use client'

import { Suspense, useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  OrbitControls,
  Grid,
  Text,
  Float,
  Stars,
} from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronUp, Search, X, Info, Layers, Eye, EyeOff, RotateCcw, Keyboard } from 'lucide-react'
import type { AddressNode, AddressEdge, ViewState } from './types'
import { useAddressGraphData } from './useAddressGraphData'
import { LoadingScreen } from './LoadingScreen'
import { ErrorScreen } from './ErrorScreen'
import { AddressDetailPanel } from './AddressDetailPanel'
import { PERFORMANCE } from './constants'

// =============================================================================
// DESIGN SYSTEM - Consistent with Neuraxon & other visualizations
// =============================================================================

const COLORS = {
  bg: {
    primary: 'bg-[#050505]',
    secondary: 'bg-black/80',
    card: 'bg-white/5',
    cardHover: 'bg-white/10',
  },
  border: {
    subtle: 'border-white/[0.04]',
    active: 'border-[#D4AF37]/50',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-white/80',
    muted: 'text-white/60',
    subtle: 'text-white/40',
  },
}

// XOR Layer Colors - Subtle blue gradient
const LAYER_CONFIG = [
  { xor: 0,  y: 0,  color: '#1E3A5F', name: 'Base Layer (XOR 0)',   key: '1' },
  { xor: 7,  y: 8,  color: '#2D4A6E', name: 'Layer 1 (XOR 7)',      key: '2' },
  { xor: 13, y: 16, color: '#3C5A7D', name: 'Layer 2 (XOR 13)',     key: '3' },
  { xor: 27, y: 24, color: '#4B6A8C', name: 'Layer 3 (XOR 27)',     key: '4' },
  { xor: 33, y: 32, color: '#5A7A9B', name: 'Layer 4 (XOR 33)',     key: '5' },
]

const VIP_COLOR = '#D4AF37'
const SELECTED_COLOR = '#FFFFFF'

// =============================================================================
// COLLAPSIBLE PANEL COMPONENT
// =============================================================================

interface CollapsiblePanelProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  badge?: string | number
  className?: string
}

function CollapsiblePanel({ title, defaultOpen = true, children, badge, className = '' }: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`border border-white/[0.04] overflow-hidden ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
      >
        <span className="text-[11px] text-white/80 font-medium uppercase tracking-wider">{title}</span>
        <div className="flex items-center gap-2">
          {badge !== undefined && (
            <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5">
              {badge}
            </span>
          )}
          {isOpen ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-black/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// =============================================================================
// KEYBOARD SHORTCUTS MODAL
// =============================================================================

function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: '1-5', action: 'Select XOR layer' },
    { key: 'E', action: 'Toggle edges' },
    { key: 'V', action: 'VIP addresses only' },
    { key: 'R', action: 'Reset view' },
    { key: '/', action: 'Focus search' },
    { key: 'Esc', action: 'Close / Deselect' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#050505] border border-white/[0.04] p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 transition-colors">
            <X size={16} className="text-white/60" />
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map(({ key, action }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-white/60 text-sm">{action}</span>
              <kbd className="px-2 py-1 bg-white/10 text-[11px] text-white/80 font-mono">{key}</kbd>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// =============================================================================
// 3D COMPONENTS - Simplified and Professional
// =============================================================================

// Subtle ambient particles
function AmbientParticles() {
  const particlesRef = useRef<THREE.Points>(null)
  const count = 1500

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 60 + Math.random() * 100
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.5 + 16
      pos[i * 3 + 2] = radius * Math.cos(phi)
    }
    return pos
  }, [])

  useFrame((state) => {
    if (!particlesRef.current) return
    particlesRef.current.rotation.y = state.clock.elapsedTime * 0.005
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        color="#3C5A7D"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// XOR Layer plane visualization
function LayerPlane({ config, isActive }: { config: typeof LAYER_CONFIG[0]; isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = isActive ? 0.04 : 0.01
  })

  return (
    <group position={[0, config.y, 0]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 70]} />
        <meshBasicMaterial
          color={config.color}
          transparent
          opacity={0.02}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

// VIP Node with subtle animation
function VIPNode({ node, isSelected, isHovered, onClick }: {
  node: AddressNode
  isSelected: boolean
  isHovered: boolean
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const time = state.clock.elapsedTime
    meshRef.current.position.y = node.position[1] + Math.sin(time * 2 + node.position[0]) * 0.1
    meshRef.current.rotation.y = time * 0.3
    const scale = isSelected ? 1.3 : isHovered ? 1.15 : 1
    meshRef.current.scale.setScalar(scale)
  })

  return (
    <mesh
      ref={meshRef}
      position={[node.position[0], node.position[1], node.position[2]]}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'default' }}
    >
      <octahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial
        color={isSelected ? SELECTED_COLOR : VIP_COLOR}
        emissive={VIP_COLOR}
        emissiveIntensity={isSelected ? 1 : 0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  )
}

// Instanced matrix nodes for performance
function MatrixNodes({
  nodes,
  selectedNodeId,
  hoveredNodeId,
  activeLayer,
  onNodeClick,
  onNodeHover,
}: {
  nodes: AddressNode[]
  selectedNodeId: string | null
  hoveredNodeId: string | null
  activeLayer: number | null
  onNodeClick: (node: AddressNode) => void
  onNodeHover: (nodeId: string | null) => void
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const tempObject = useMemo(() => new THREE.Object3D(), [])
  const tempColor = useMemo(() => new THREE.Color(), [])
  const nodesRef = useRef<AddressNode[]>(nodes)
  nodesRef.current = nodes

  const maxInstances = Math.min(nodes.length, PERFORMANCE.MAX_VISIBLE_NODES)
  const displayNodes = useMemo(() => nodes.slice(0, maxInstances), [nodes, maxInstances])

  useFrame((state) => {
    if (!meshRef.current || displayNodes.length === 0) return

    const time = state.clock.elapsedTime

    displayNodes.forEach((node, i) => {
      const wave = Math.sin(time * 0.3 + node.position[0] * 0.05 + node.position[2] * 0.05) * 0.05
      tempObject.position.set(node.position[0], node.position[1] + wave, node.position[2])

      const isSelected = node.id === selectedNodeId
      const isHovered = node.id === hoveredNodeId
      const isLayerActive = activeLayer === null || node.xorVariant === activeLayer

      let scale = 0.15
      if (isSelected) scale = 0.5
      else if (isHovered) scale = 0.35
      else if (!isLayerActive) scale = 0.03

      tempObject.scale.setScalar(scale)
      tempObject.updateMatrix()
      meshRef.current!.setMatrixAt(i, tempObject.matrix)

      const layerConfig = LAYER_CONFIG.find(l => l.xor === node.xorVariant) ?? LAYER_CONFIG[0]
      const intensity = isSelected ? 2 : isHovered ? 1.5 : isLayerActive ? 1 : 0.2
      if (layerConfig) {
        tempColor.set(layerConfig.color).multiplyScalar(intensity)
      }
      meshRef.current!.setColorAt(i, tempColor)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  })

  const { raycaster, camera, pointer, gl } = useThree()

  useEffect(() => {
    const handleClick = () => {
      if (!meshRef.current) return
      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObject(meshRef.current)
      if (intersects[0]?.instanceId !== undefined) {
        const node = nodesRef.current[intersects[0].instanceId]
        if (node) onNodeClick(node)
      }
    }

    const handleMove = () => {
      if (!meshRef.current) return
      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObject(meshRef.current)
      if (intersects[0]?.instanceId !== undefined) {
        const node = nodesRef.current[intersects[0].instanceId]
        onNodeHover(node?.id ?? null)
        gl.domElement.style.cursor = 'pointer'
      } else {
        onNodeHover(null)
        gl.domElement.style.cursor = 'default'
      }
    }

    gl.domElement.addEventListener('click', handleClick)
    gl.domElement.addEventListener('pointermove', handleMove)
    return () => {
      gl.domElement.removeEventListener('click', handleClick)
      gl.domElement.removeEventListener('pointermove', handleMove)
    }
  }, [onNodeClick, onNodeHover, raycaster, camera, pointer, gl])

  if (displayNodes.length === 0) return null

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxInstances]} frustumCulled={false}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.4} metalness={0.6} />
    </instancedMesh>
  )
}

// Edge connections
function EdgeConnections({ edges, nodeMap }: { edges: AddressEdge[], nodeMap: Map<string, AddressNode> }) {
  const lineRef = useRef<THREE.LineSegments>(null)
  const displayEdges = useMemo(() => edges.slice(0, 300), [edges])

  const geometry = useMemo(() => {
    const positions: number[] = []
    displayEdges.forEach((edge) => {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)
      if (!source || !target) return
      positions.push(...source.position, ...target.position)
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [displayEdges, nodeMap])

  useFrame((state) => {
    if (!lineRef.current) return
    const mat = lineRef.current.material as THREE.LineBasicMaterial
    mat.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.05
  })

  if (displayEdges.length === 0) return null

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color="#D4AF37" transparent opacity={0.25} blending={THREE.AdditiveBlending} />
    </lineSegments>
  )
}

// =============================================================================
// MAIN SCENE COMPONENT
// =============================================================================

export function AddressGraphScene() {
  const {
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
  } = useAddressGraphData()

  const [viewState, setViewState] = useState<ViewState>({
    mode: 'force',
    cameraPreset: 'overview',
    cameraPosition: [0, 50, 50],
    showEdges: true,
    selectedNodeId: null,
    highlightedPath: [],
    playbackSpeed: 1,
    isPlaying: false,
    currentBlock: 0,
  })

  const [filters, setFilters] = useState({ showVIPOnly: false })
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [activeLayer, setActiveLayer] = useState<number | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showInfo, setShowInfo] = useState(false)
  const orbitRef = useRef<any>(null)

  // Handlers
  const handleNodeClick = useCallback((node: AddressNode) => {
    setViewState((s) => ({ ...s, selectedNodeId: node.id }))
  }, [])

  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setViewState((s) => ({ ...s, selectedNodeId: null }))
  }, [])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (query.length > 3) {
      const result = searchNode(query)
      if (result) {
        setViewState((s) => ({ ...s, selectedNodeId: result.id }))
      }
    }
  }, [searchNode])

  const resetCamera = useCallback(() => {
    if (orbitRef.current) {
      orbitRef.current.reset()
    }
    setActiveLayer(null)
    setViewState((s) => ({ ...s, selectedNodeId: null }))
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      switch (e.key.toLowerCase()) {
        case 'e':
          setViewState((s) => ({ ...s, showEdges: !s.showEdges }))
          break
        case 'r':
          resetCamera()
          break
        case 'v':
          setFilters((f) => ({ ...f, showVIPOnly: !f.showVIPOnly }))
          break
        case '1': case '2': case '3': case '4': case '5':
          const idx = parseInt(e.key) - 1
          if (LAYER_CONFIG[idx]) {
            const targetXor = LAYER_CONFIG[idx].xor
            setActiveLayer((current) => current === targetXor ? null : targetXor)
          }
          break
        case 'escape':
          setActiveLayer(null)
          handleCloseDetail()
          setShowShortcuts(false)
          setShowInfo(false)
          break
        case '?':
          setShowShortcuts((s) => !s)
          break
        case '/':
          e.preventDefault()
          document.querySelector<HTMLInputElement>('input[type="text"]')?.focus()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleCloseDetail, resetCamera])

  // Memoized data
  const nodeMap = useMemo(() => {
    if (!data) return new Map<string, AddressNode>()
    const map = new Map<string, AddressNode>()
    data.nodes.forEach((n) => map.set(n.id, n))
    return map
  }, [data])

  const { matrixNodes, vipNodes } = useMemo(() => {
    if (!data) return { matrixNodes: [], vipNodes: [] }
    const matrix: AddressNode[] = []
    const vip: AddressNode[] = []
    data.nodes.forEach((n) => {
      if (filters.showVIPOnly && !n.isVIP) return
      if (n.isVIP) vip.push(n)
      else matrix.push(n)
    })
    return { matrixNodes: matrix, vipNodes: vip }
  }, [data, filters])

  const visibleEdges = useMemo(() => {
    if (!data || !viewState.showEdges) return []
    return data.edges
  }, [data, viewState.showEdges])

  const selectedNode = viewState.selectedNodeId ? getNodeById(viewState.selectedNodeId) : null
  const connections = viewState.selectedNodeId ? getConnectedNodes(viewState.selectedNodeId) : { incoming: [], outgoing: [] }

  // Layer statistics
  const layerStats = useMemo(() => {
    if (!data) return []
    return LAYER_CONFIG.map(config => {
      const count = data.stats.byXor[config.xor] || 0
      const total = Object.values(data.stats.byXor).reduce((a, b) => a + b, 0)
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
      return { ...config, count, percentage }
    })
  }, [data])

  // Loading/Error states
  if (loading) return <LoadingScreen progress={progress} stats={loadStats} />
  if (error) return <ErrorScreen error={error} onRetry={retry} retryCount={retryCount} />
  if (!data) return <div className="w-full h-full flex items-center justify-center bg-black"><p className="text-white/40">No data available</p></div>

  return (
    <div className="relative w-full h-full bg-[#030712] overflow-hidden">
      {/* 3D Canvas */}
      <Canvas
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        dpr={[1, 2]}
        camera={{ position: [60, 40, 60], fov: 50 }}
      >
        <color attach="background" args={['#030712']} />
        <fog attach="fog" args={['#030712', 80, 250]} />

        <Suspense fallback={null}>
          <OrbitControls
            ref={orbitRef}
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={200}
            target={[0, 16, 0]}
            enablePan
            panSpeed={0.6}
            rotateSpeed={0.5}
            zoomSpeed={1}
          />

          <Stars radius={150} depth={80} count={2000} factor={3} fade speed={0.5} />

          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[50, 100, 50]} intensity={0.5} />
          <pointLight position={[0, 50, 0]} intensity={0.6} color="#D4AF37" distance={150} />

          <AmbientParticles />

          {/* Floor grid */}
          <Grid
            position={[0, -1, 0]}
            args={[140, 140]}
            cellSize={5}
            cellThickness={0.3}
            cellColor="#1E3A5F"
            sectionSize={25}
            sectionThickness={0.8}
            sectionColor="#3C5A7D"
            fadeDistance={200}
            fadeStrength={1}
            infiniteGrid={false}
          />

          {/* XOR Layer planes */}
          {LAYER_CONFIG.map((config) => (
            <LayerPlane
              key={config.xor}
              config={config}
              isActive={activeLayer === null || activeLayer === config.xor}
            />
          ))}

          {/* Layer labels */}
          {LAYER_CONFIG.map((config) => (
            <Float key={`label-${config.xor}`} speed={1.5} floatIntensity={0.2}>
              <Text
                position={[-38, config.y, -38]}
                fontSize={1.5}
                color={config.color}
                anchorX="right"
                anchorY="middle"
                outlineWidth={0.03}
                outlineColor="#000"
              >
                XOR {config.xor}
              </Text>
            </Float>
          ))}

          {/* Edges */}
          {viewState.showEdges && <EdgeConnections edges={visibleEdges} nodeMap={nodeMap} />}

          {/* Matrix nodes */}
          <MatrixNodes
            nodes={matrixNodes}
            selectedNodeId={viewState.selectedNodeId}
            hoveredNodeId={hoveredNodeId}
            activeLayer={activeLayer}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
          />

          {/* VIP nodes */}
          {vipNodes.map((node) => (
            <VIPNode
              key={node.id}
              node={node}
              isSelected={node.id === viewState.selectedNodeId}
              isHovered={node.id === hoveredNodeId}
              onClick={() => handleNodeClick(node)}
            />
          ))}

          {/* Post-processing - Subtle */}
          <EffectComposer>
            <Bloom intensity={0.5} luminanceThreshold={0.5} luminanceSmoothing={0.9} mipmapBlur />
            <Vignette eskil={false} offset={0.1} darkness={0.5} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* ========== UI OVERLAY ========== */}

      {/* Left Panel - Collapsible sections */}
      <div className="absolute top-4 left-4 w-72 space-y-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#050505] backdrop-blur-xl border border-white/[0.04] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/[0.04]">
            <h1 className="text-sm font-semibold text-white">Anna Matrix Graph</h1>
            <p className="text-[11px] text-white/40 mt-1">
              {data.nodes.length.toLocaleString()} addresses from 128x128 matrix
            </p>
          </div>

          {/* Layer Selection */}
          <CollapsiblePanel title="XOR Layers" badge={activeLayer !== null ? `XOR ${activeLayer}` : 'All'}>
            <div className="space-y-2">
              {layerStats.map((layer) => {
                const isActive = activeLayer === layer.xor
                return (
                  <button
                    key={layer.xor}
                    onClick={() => setActiveLayer(isActive ? null : layer.xor)}
                    className={`w-full flex items-center justify-between p-2 transition-all ${
                      isActive ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3"
                        style={{ backgroundColor: layer.color, opacity: isActive ? 1 : 0.6 }}
                      />
                      <span className="text-xs text-white/80">XOR {layer.xor}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-white/60">{layer.count.toLocaleString()}</div>
                      <div className="text-[9px] text-white/40">{layer.percentage}%</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CollapsiblePanel>

          {/* Statistics */}
          <CollapsiblePanel title="Statistics" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-3">
                <div className="text-lg font-semibold text-[#D4AF37]">{vipNodes.length}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider">VIP Addresses</div>
              </div>
              <div className="bg-white/5 p-3">
                <div className="text-lg font-semibold text-white/80">{matrixNodes.length.toLocaleString()}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider">Matrix Nodes</div>
              </div>
              <div className="bg-white/5 p-3">
                <div className="text-lg font-semibold text-white/60">{data.edges.length}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider">Connections</div>
              </div>
              <div className="bg-white/5 p-3">
                <div className="text-lg font-semibold text-white/60">5</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider">XOR Layers</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.04]">
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Mathematical Basis</div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Addresses derived from Anna Matrix (128x128) using SHA-256 &rarr; RIPEMD-160 &rarr; XOR transformation with 5 distinct XOR values (0, 7, 13, 27, 33).
              </p>
            </div>
          </CollapsiblePanel>
        </motion.div>
      </div>

      {/* Right Panel - Controls */}
      <div className="absolute top-4 right-4 w-48">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#050505] backdrop-blur-xl border border-white/[0.04] p-4 space-y-2"
        >
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-3">View Controls</div>

          <button
            onClick={() => setViewState(s => ({ ...s, showEdges: !s.showEdges }))}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-all ${
              viewState.showEdges ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-2">
              {viewState.showEdges ? <Eye size={14} /> : <EyeOff size={14} />}
              Edges
            </span>
            <kbd className="text-[9px] bg-black/50 px-1.5 py-0.5">E</kbd>
          </button>

          <button
            onClick={() => setFilters(f => ({ ...f, showVIPOnly: !f.showVIPOnly }))}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-all ${
              filters.showVIPOnly ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers size={14} />
              VIP Only
            </span>
            <kbd className="text-[9px] bg-black/50 px-1.5 py-0.5">V</kbd>
          </button>

          <div className="border-t border-white/[0.04] pt-2 mt-2">
            <button
              onClick={resetCamera}
              className="w-full flex items-center justify-between px-3 py-2 text-xs bg-white/5 text-white/60 hover:bg-white/10 transition-all"
            >
              <span className="flex items-center gap-2">
                <RotateCcw size={14} />
                Reset View
              </span>
              <kbd className="text-[9px] bg-black/50 px-1.5 py-0.5">R</kbd>
            </button>
          </div>

          <div className="border-t border-white/[0.04] pt-2 mt-2">
            <button
              onClick={() => setShowShortcuts(true)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs bg-white/5 text-white/60 hover:bg-white/10 transition-all"
            >
              <span className="flex items-center gap-2">
                <Keyboard size={14} />
                Shortcuts
              </span>
              <kbd className="text-[9px] bg-black/50 px-1.5 py-0.5">?</kbd>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Search Bar - Bottom Center */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search address..."
            className="w-full pl-10 pr-12 py-3 bg-[#050505] backdrop-blur-xl border border-white/[0.04] text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/[0.04] transition-colors"
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-white/30 bg-white/5 px-2 py-0.5">/</kbd>
        </motion.div>
      </div>

      {/* Active Layer Indicator */}
      {activeLayer !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2"
        >
          <div className="bg-black/80 backdrop-blur px-4 py-2 border border-white/[0.04]">
            <span className="text-xs text-white/60">Active Layer: </span>
            <span className="text-xs font-medium" style={{ color: LAYER_CONFIG.find(l => l.xor === activeLayer)?.color }}>
              XOR {activeLayer}
            </span>
            <button
              onClick={() => setActiveLayer(null)}
              className="ml-3 text-white/40 hover:text-white/60 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedNode && (
          <AddressDetailPanel
            node={selectedNode}
            connections={connections}
            onClose={handleCloseDetail}
            onNodeClick={handleNodeClick}
            getNodeById={getNodeById}
          />
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
      </AnimatePresence>
    </div>
  )
}
