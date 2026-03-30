'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Float, MeshTransmissionMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'

interface ScanResult {
  row: number
  col: number
  value: number
  energy: number
  address: string
  checked: boolean
  hasBalance: boolean
  balance?: string
  timestamp: number
}

// =============== 3D COMPONENTS ===============

// Cosmic background with animated stars
function CosmicBackground() {
  return (
    <>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={['#000', 10, 50]} />
    </>
  )
}

// The main matrix terrain - 16,384 cells visualized as a cityscape
function MatrixCityscape({
  matrix,
  scanProgress,
  hotspots,
  scanningRow,
  activeCell
}: {
  matrix: number[][]
  scanProgress: number
  hotspots: Set<string>
  scanningRow: number
  activeCell: { row: number; col: number } | null
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const glowRef = useRef<THREE.InstancedMesh>(null)

  const size = 128
  const cellSize = 0.06
  const spacing = 0.008

  // Initial setup
  useEffect(() => {
    if (!meshRef.current || !matrix.length) return

    const mesh = meshRef.current
    const glow = glowRef.current
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()

    let idx = 0
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const value = matrix[row]?.[col] ?? 0
        const normalizedValue = (value + 128) / 255

        const x = (col - size / 2) * (cellSize + spacing)
        const z = (row - size / 2) * (cellSize + spacing)
        const baseY = normalizedValue * 0.8

        dummy.position.set(x, baseY / 2, z)
        dummy.scale.set(cellSize, Math.max(0.01, baseY), cellSize)
        dummy.updateMatrix()
        mesh.setMatrixAt(idx, dummy.matrix)

        // Initial color (dark, unscanned)
        color.setHSL(0.6, 0.2, 0.05)
        mesh.setColorAt(idx, color)

        // Glow mesh
        if (glow) {
          dummy.scale.set(cellSize * 1.2, 0.01, cellSize * 1.2)
          dummy.position.set(x, 0.001, z)
          dummy.updateMatrix()
          glow.setMatrixAt(idx, dummy.matrix)
          glow.setColorAt(idx, new THREE.Color(0, 0, 0))
        }

        idx++
      }
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    if (glow) {
      glow.instanceMatrix.needsUpdate = true
      if (glow.instanceColor) glow.instanceColor.needsUpdate = true
    }
  }, [matrix])

  // Animation frame - update colors based on scan progress
  useFrame(({ clock }) => {
    if (!meshRef.current || !matrix.length) return

    const mesh = meshRef.current
    const glow = glowRef.current
    const time = clock.getElapsedTime()
    const color = new THREE.Color()
    const dummy = new THREE.Object3D()

    let idx = 0
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const value = matrix[row]?.[col] ?? 0
        const normalizedValue = (value + 128) / 255
        const cellProgress = (row * size + col) / (size * size)
        const scanned = cellProgress < scanProgress
        const isHotspot = hotspots.has(`${row},${col}`)
        const isActiveRow = row === scanningRow
        const isActiveCell = activeCell?.row === row && activeCell?.col === col

        // Calculate height with animation
        const x = (col - size / 2) * (cellSize + spacing)
        const z = (row - size / 2) * (cellSize + spacing)
        let baseY = normalizedValue * 0.8

        // Pulse effect for active cell
        if (isActiveCell) {
          baseY *= 1 + Math.sin(time * 10) * 0.3
        }
        // Wave effect for scanning row
        if (isActiveRow) {
          baseY += Math.sin(col * 0.1 + time * 5) * 0.05
        }
        // Breathing effect for hotspots
        if (isHotspot) {
          baseY *= 1 + Math.sin(time * 3) * 0.1
        }

        dummy.position.set(x, baseY / 2, z)
        dummy.scale.set(cellSize, Math.max(0.01, baseY), cellSize)
        dummy.updateMatrix()
        mesh.setMatrixAt(idx, dummy.matrix)

        // Determine color
        if (isActiveCell) {
          // Active cell - white hot
          color.setHSL(0, 0, 1)
        } else if (isHotspot) {
          // Hotspot - pulsing gold
          const brightness = 0.5 + Math.sin(time * 4) * 0.2
          color.setHSL(0.12, 1, brightness)
        } else if (isActiveRow) {
          // Scanning row - gold glow
          color.setHSL(0.12, 0.8, 0.4 + Math.sin(col * 0.1 + time * 5) * 0.2)
        } else if (scanned) {
          // Scanned - color by value
          if (value > 50) {
            color.setHSL(0.12, 0.6, 0.15 + normalizedValue * 0.25) // Gold (positive)
          } else if (value < -50) {
            color.setHSL(0, 0.6, 0.15 + (1 - normalizedValue) * 0.2) // Red (negative)
          } else {
            color.setHSL(0.12, 0.15, 0.08 + normalizedValue * 0.08) // Dim gold (neutral)
          }
        } else {
          // Unscanned - dark
          color.setHSL(0.6, 0.1, 0.03)
        }

        mesh.setColorAt(idx, color)

        // Glow effect
        if (glow) {
          if (isHotspot || isActiveCell) {
            const glowColor = isActiveCell
              ? new THREE.Color(1, 1, 1)
              : new THREE.Color().setHSL(0.12, 1, 0.5 + Math.sin(time * 4) * 0.3)
            glow.setColorAt(idx, glowColor)
          } else {
            glow.setColorAt(idx, new THREE.Color(0, 0, 0))
          }
        }

        idx++
      }
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    if (glow) {
      if (glow.instanceColor) glow.instanceColor.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Main cells */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, size * size]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          vertexColors
          metalness={0.8}
          roughness={0.2}
        />
      </instancedMesh>

      {/* Glow layer */}
      <instancedMesh ref={glowRef} args={[undefined, undefined, size * size]} position={[0, 0, 0]}>
        <planeGeometry args={[1, 1]} rotation-x={-Math.PI / 2} />
        <meshBasicMaterial vertexColors transparent opacity={0.3} />
      </instancedMesh>
    </group>
  )
}

// Scanning beam - dramatic laser effect
function ScanBeam({ progress, active }: { progress: number; active: boolean }) {
  const beamRef = useRef<THREE.Group>(null)
  const size = 128 * 0.068

  useFrame(({ clock }) => {
    if (!beamRef.current || !active) return
    const time = clock.getElapsedTime()
    beamRef.current.position.z = (progress - 0.5) * size * 2
    beamRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        child.material.opacity = 0.5 + Math.sin(time * 10 + i) * 0.3
      }
    })
  })

  if (!active) return null

  return (
    <group ref={beamRef}>
      {/* Main beam */}
      <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, size * 2, 16]} />
        <meshBasicMaterial color="#D4AF37" transparent opacity={0.8} />
      </mesh>
      {/* Glow rings */}
      {[0, 0.1, 0.2].map((offset, i) => (
        <mesh key={i} position={[0, 0.4 + offset, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.05 + i * 0.02, 0.01, 8, 32]} />
          <meshBasicMaterial color="#D4AF37" transparent opacity={0.3} />
        </mesh>
      ))}
      {/* Scan surface */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size * 2, 0.3]} />
        <meshBasicMaterial color="#D4AF37" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// Hotspot markers - floating indicators
function HotspotMarkers({ hotspots }: { hotspots: Array<{ row: number; col: number; energy: number }> }) {
  return (
    <group>
      {hotspots.slice(0, 20).map((spot, i) => {
        const x = (spot.col - 64) * 0.068
        const z = (spot.row - 64) * 0.068
        const intensity = Math.min(spot.energy / 50, 1)

        return (
          <Float key={i} speed={2} floatIntensity={0.5}>
            <group position={[x, 1 + intensity * 0.5, z]}>
              {/* Diamond marker */}
              <mesh rotation={[0, 0, Math.PI / 4]}>
                <octahedronGeometry args={[0.05 + intensity * 0.03]} />
                <meshStandardMaterial
                  color="#D4AF37"
                  emissive="#D4AF37"
                  emissiveIntensity={0.5}
                  metalness={1}
                  roughness={0}
                />
              </mesh>
              {/* Connection line */}
              <mesh position={[0, -0.5 - intensity * 0.25, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 1 + intensity * 0.5, 8]} />
                <meshBasicMaterial color="#D4AF37" transparent opacity={0.3} />
              </mesh>
            </group>
          </Float>
        )
      })}
    </group>
  )
}

// Discovery explosion effect
function DiscoveryExplosion({ position, active }: { position: [number, number, number]; active: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const [particles] = useState(() =>
    Array.from({ length: 30 }, () => ({
      offset: [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5] as [number, number, number],
      speed: 0.5 + Math.random() * 0.5,
      size: 0.02 + Math.random() * 0.03,
    }))
  )

  useFrame(({ clock }) => {
    if (!groupRef.current || !active) return
    const time = clock.getElapsedTime()
    groupRef.current.children.forEach((child, i) => {
      const particle = particles[i]
      if (particle && child instanceof THREE.Mesh) {
        const t = (time * particle.speed) % 1
        child.position.set(
          particle.offset[0] * t * 2,
          particle.offset[1] * t * 2 + 0.5,
          particle.offset[2] * t * 2
        )
        child.scale.setScalar(particle.size * (1 - t))
        child.material.opacity = 1 - t
      }
    })
  })

  if (!active) return null

  return (
    <group ref={groupRef} position={position}>
      {particles.map((p, i) => (
        <mesh key={i}>
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshBasicMaterial color="#D4AF37" transparent />
        </mesh>
      ))}
    </group>
  )
}

// Camera controller
function CameraController({ scanning, progress }: { scanning: boolean; progress: number }) {
  const { camera } = useThree()

  useFrame(({ clock }) => {
    if (scanning) {
      const t = clock.getElapsedTime() * 0.05
      const radius = 10 + Math.sin(t) * 2
      const height = 6 + Math.sin(t * 1.5) * 2
      camera.position.x = Math.sin(t) * radius
      camera.position.z = Math.cos(t) * radius
      camera.position.y = height
      camera.lookAt(0, 0, (progress - 0.5) * 8)
    }
  })

  return null
}

// =============== UI COMPONENTS ===============

// Dramatic intro overlay
function IntroOverlay({ onStart, loading }: { onStart: () => void; loading: boolean }) {
  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50">
      <div className="text-center space-y-8">
        <div className="relative">
          <h1 className="text-6xl font-mono font-bold tracking-wider">
            <span className="text-[#D4AF37]">
              ANNA MATRIX
            </span>
          </h1>
          <h2 className="text-3xl font-mono text-zinc-400 mt-2">SCANNER v2.0</h2>
          <div className="absolute -inset-4 bg-[#D4AF37]/5 blur-3xl -z-10" />
        </div>

        <div className="space-y-2 text-zinc-500 font-mono text-sm max-w-md mx-auto">
          <p>128x128 Ternary Neural Network</p>
          <p>16,384 Addressable Cells</p>
          <p>Live Bitcoin Address Discovery</p>
        </div>

        <button
          type="button"
          onClick={onStart}
          disabled={loading}
          className="group relative px-12 py-4 bg-[#D4AF37]/[0.08] border border-[#D4AF37]/30 font-mono font-bold text-[#D4AF37] text-lg transition-all hover:bg-[#D4AF37]/[0.15] hover:border-[#D4AF37]/50 hover:shadow-[0_0_40px_rgba(212,175,55,0.1)] disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
              LOADING MATRIX...
            </span>
          ) : (
            <>
              INITIALIZE SCANNER
              <span className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </button>

        <p className="text-zinc-600 text-xs font-mono">
          Press SPACE to start/stop | R to reset | +/- to adjust speed
        </p>
      </div>
    </div>
  )
}

// Stats HUD
function StatsHUD({
  scanning,
  progress,
  stats,
  currentCell
}: {
  scanning: boolean
  progress: number
  stats: {
    scanned: number
    hotspots: number
    addresses: number
    withBalance: number
    totalEnergy: number
  }
  currentCell: { row: number; col: number; value: number } | null
}) {
  return (
    <div className="absolute top-4 left-4 space-y-3">
      {/* Main stats card */}
      <div className="bg-black/80 backdrop-blur-xl border border-[#D4AF37]/15 p-4 font-mono">
        <div className="flex items-center gap-3 mb-4">
          {scanning && (
            <div className="relative">
              <span className="w-3 h-3 bg-[#D4AF37] animate-pulse" />
              <span className="absolute inset-0 w-3 h-3 bg-[#D4AF37] animate-ping" />
            </div>
          )}
          <span className="text-[#D4AF37] font-bold text-lg">MATRIX SCANNER</span>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>SCAN PROGRESS</span>
            <span className="text-[#D4AF37]">{(progress * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-zinc-900 overflow-hidden">
            <div
              className="h-full bg-[#D4AF37]/50 transition-all duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <StatItem label="CELLS" value={stats.scanned.toLocaleString()} max="16,384" />
          <StatItem label="HOTSPOTS" value={stats.hotspots} color="gold" />
          <StatItem label="ADDRESSES" value={stats.addresses} color="gold-dim" />
          <StatItem
            label="WITH BTC"
            value={stats.withBalance}
            color={stats.withBalance > 0 ? 'gold' : 'zinc'}
            pulse={stats.withBalance > 0}
          />
        </div>

        {/* Energy meter */}
        <div className="mt-4 pt-4 border-t border-white/[0.04]">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 text-xs">TOTAL ENERGY</span>
            <span className={`font-bold ${stats.totalEnergy >= 0 ? 'text-[#D4AF37]' : 'text-red-400'}`}>
              {stats.totalEnergy >= 0 ? '+' : ''}{stats.totalEnergy.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Current cell */}
      {currentCell && (
        <div className="bg-black/60 backdrop-blur border border-[#D4AF37]/10 p-3 font-mono text-sm">
          <div className="text-[11px] text-[#D4AF37]/50 uppercase tracking-[0.4em] mb-1">SCANNING</div>
          <div className="text-[#D4AF37]">
            [{currentCell.row}, {currentCell.col}]
          </div>
          <div className={`text-lg font-bold ${currentCell.value >= 0 ? 'text-[#D4AF37]' : 'text-red-400'}`}>
            {currentCell.value}
          </div>
        </div>
      )}
    </div>
  )
}

function StatItem({
  label,
  value,
  max,
  color = 'gold',
  pulse = false
}: {
  label: string
  value: string | number
  max?: string
  color?: string
  pulse?: boolean
}) {
  const colorClasses: Record<string, string> = {
    gold: 'text-[#D4AF37]',
    'gold-dim': 'text-[#D4AF37]/70',
    zinc: 'text-zinc-500',
  }

  return (
    <div>
      <div className="text-zinc-500 text-xs">{label}</div>
      <div className={`font-bold ${colorClasses[color] || colorClasses.gold} ${pulse ? 'animate-pulse' : ''}`}>
        {value}
        {max && <span className="text-zinc-600 text-xs font-normal"> / {max}</span>}
      </div>
    </div>
  )
}

// Results panel
function ResultsPanel({ results, expanded, onToggle }: { results: ScanResult[]; expanded: boolean; onToggle: () => void }) {
  const withBalance = results.filter(r => r.hasBalance)
  const sortedResults = [...results].sort((a, b) => b.energy - a.energy)

  return (
    <div className={`absolute top-4 right-4 bottom-4 transition-all duration-300 ${expanded ? 'w-96' : 'w-80'}`}>
      <div className="h-full bg-black/80 backdrop-blur-xl border border-[#D4AF37]/15 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.04] flex items-center justify-between">
          <div>
            <div className="text-[#D4AF37] font-mono font-bold">DISCOVERED</div>
            <div className="text-zinc-500 text-xs">{results.length} addresses found</div>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="text-zinc-500 hover:text-[#D4AF37] transition-colors"
          >
            {expanded ? '<<' : '>>'}
          </button>
        </div>

        {/* Balance alert */}
        {withBalance.length > 0 && (
          <div className="p-4 bg-[#D4AF37]/[0.06] border-b border-[#D4AF37]/20">
            <div className="flex items-center gap-2 text-[#D4AF37] font-mono font-bold animate-pulse">
              {withBalance.length} ADDRESS{withBalance.length > 1 ? 'ES' : ''} WITH BALANCE
            </div>
            {withBalance.map((r, i) => (
              <div key={i} className="mt-2 p-2 bg-black/40 border border-[#D4AF37]/10 font-mono text-xs">
                <div className="text-[#D4AF37]/80 break-all">{r.address}</div>
                <div className="text-[#D4AF37] font-bold">{r.balance} BTC</div>
              </div>
            ))}
          </div>
        )}

        {/* Results list */}
        <div className="flex-1 overflow-y-auto">
          {sortedResults.slice(0, 50).map((r, i) => (
            <div
              key={i}
              className={`p-3 border-b border-white/[0.04] hover:bg-[#0a0a0a] transition-colors ${
                r.hasBalance ? 'bg-[#D4AF37]/[0.04]' : ''
              }`}
            >
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-zinc-500">[{r.row},{r.col}]</span>
                <span className={`font-bold ${r.energy > 0 ? 'text-[#D4AF37]' : 'text-red-400'}`}>
                  {r.energy > 0 ? '+' : ''}{r.energy.toFixed(0)}
                </span>
              </div>
              <div className="text-[#D4AF37]/70 font-mono text-xs truncate mt-1" title={r.address}>
                {r.address}
              </div>
              <div className="text-zinc-600 text-xs mt-1">
                {r.checked
                  ? r.hasBalance
                    ? `${r.balance} BTC`
                    : 'Empty'
                  : 'Checking...'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Control panel
function ControlPanel({
  scanning,
  onStart,
  onStop,
  onReset,
  speed,
  onSpeedChange,
  mode,
  onModeChange
}: {
  scanning: boolean
  onStart: () => void
  onStop: () => void
  onReset: () => void
  speed: number
  onSpeedChange: (speed: number) => void
  mode: 'full' | 'hotspots' | 'smart'
  onModeChange: (mode: 'full' | 'hotspots' | 'smart') => void
}) {
  return (
    <div className="absolute bottom-4 left-4 right-[26rem] bg-black/80 backdrop-blur-xl border border-[#D4AF37]/15 p-4 font-mono">
      <div className="flex items-center gap-6">
        {/* Main control */}
        <button
          type="button"
          onClick={scanning ? onStop : onStart}
          className={`relative px-8 py-3 font-bold text-lg transition-all ${
            scanning
              ? 'bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400'
              : 'bg-[#D4AF37]/[0.08] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/[0.15] hover:border-[#D4AF37]/50 text-[#D4AF37]'
          }`}
        >
          {scanning ? 'STOP' : 'SCAN'}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="px-4 py-3 border border-white/[0.06] text-zinc-400 hover:border-[#D4AF37]/20 hover:text-[#D4AF37] transition-all"
        >
          RESET
        </button>

        {/* Speed control */}
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 text-sm">SPEED</span>
          <input
            type="range"
            min="1"
            max="50"
            value={speed}
            onChange={e => onSpeedChange(Number(e.target.value))}
            className="w-32 accent-[#D4AF37]"
          />
          <span className="text-[#D4AF37] text-sm w-12">{speed}x</span>
        </div>

        {/* Mode selector */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-sm">MODE</span>
          {(['smart', 'hotspots', 'full'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              className={`px-4 py-2 text-xs font-bold transition-all ${
                mode === m
                  ? 'bg-[#D4AF37]/[0.08] border-2 border-[#D4AF37]/40 text-[#D4AF37]'
                  : 'border border-white/[0.06] text-zinc-500 hover:border-white/[0.12]'
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============== MAIN COMPONENT ===============

export default function ScannerPage() {
  const [matrix, setMatrix] = useState<number[][]>([])
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [scanningRow, setScanningRow] = useState(-1)
  const [results, setResults] = useState<ScanResult[]>([])
  const [hotspots, setHotspots] = useState<Set<string>>(new Set())
  const [currentCell, setCurrentCell] = useState<{ row: number; col: number; value: number } | null>(null)
  const [totalEnergy, setTotalEnergy] = useState(0)
  const [speed, setSpeed] = useState(5)
  const [mode, setMode] = useState<'full' | 'hotspots' | 'smart'>('smart')
  const [expandedPanel, setExpandedPanel] = useState(false)
  const [discoveryPos, setDiscoveryPos] = useState<[number, number, number] | null>(null)

  const scanAbortRef = useRef<AbortController | null>(null)

  // Load matrix
  useEffect(() => {
    const controller = new AbortController()
    fetch('/data/anna-matrix.json', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        const raw = data.matrix ?? data
        if (Array.isArray(raw) && Array.isArray(raw[0])) {
          setMatrix(raw)
        } else {
          const m: number[][] = []
          for (let i = 0; i < 128; i++) {
            m.push(raw.slice(i * 128, (i + 1) * 128))
          }
          setMatrix(m)
        }
        setLoading(false)
      })
      .catch(err => {
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('Failed to load matrix:', err)
      })
    return () => controller.abort()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (scanning) stopScan()
        else startScan()
      } else if (e.code === 'KeyR') {
        reset()
      } else if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        setSpeed(s => Math.min(s + 5, 50))
      } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        setSpeed(s => Math.max(s - 5, 1))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [scanning])

  // Scan function
  const scanCell = useCallback(async (row: number, col: number, signal: AbortSignal) => {
    const value = matrix[row]?.[col] ?? 0
    setCurrentCell({ row, col, value })
    setScanningRow(row)

    if (Math.abs(value) < 30) return null

    try {
      const res = await fetch('/api/agents/resonance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'single', input: `matrix_${row}_${col}_${value}` }),
        signal,
      })
      const data = await res.json()

      if (data.success && data.data.normalizedEnergy > 0.08) {
        const addrRes = await fetch('/api/agents/treasure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `cell_${row}_${col}_${value}_${data.data.outputHash}`,
            verifyOnChain: true
          }),
          signal,
        })
        const addrData = await addrRes.json()

        if (addrData.success && addrData.data.derivedAddresses?.[0]) {
          const addr = addrData.data.derivedAddresses[0]
          const result: ScanResult = {
            row,
            col,
            value,
            energy: data.data.normalizedEnergy * 100,
            address: addr.address,
            checked: !!addr.onChain,
            hasBalance: addr.onChain?.exists && parseFloat(addr.onChain.balance) > 0,
            balance: addr.onChain?.balance,
            timestamp: Date.now(),
          }

          // Trigger discovery effect
          if (result.energy > 20) {
            const x = (col - 64) * 0.068
            const z = (row - 64) * 0.068
            setDiscoveryPos([x, 0.5, z])
            setTimeout(() => setDiscoveryPos(null), 2000)
          }

          setHotspots(prev => new Set([...prev, `${row},${col}`]))
          setTotalEnergy(prev => prev + result.energy)
          return result
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error('Scan error:', e)
      }
    }

    return null
  }, [matrix])

  // Start scanning
  const startScan = useCallback(async () => {
    if (scanning || !matrix.length) return

    setScanning(true)
    const controller = new AbortController()
    scanAbortRef.current = controller

    try {
      // Generate scan order based on mode
      let cells: Array<{ row: number; col: number; priority: number }> = []

      if (mode === 'smart') {
        // Smart mode: prioritize high-value cells
        for (let r = 0; r < 128; r++) {
          for (let c = 0; c < 128; c++) {
            const v = Math.abs(matrix[r]?.[c] ?? 0)
            if (v > 30) {
              cells.push({ row: r, col: c, priority: v })
            }
          }
        }
        cells.sort((a, b) => b.priority - a.priority)
      } else if (mode === 'hotspots') {
        // Hotspots mode: only very high values
        for (let r = 0; r < 128; r++) {
          for (let c = 0; c < 128; c++) {
            const v = Math.abs(matrix[r]?.[c] ?? 0)
            if (v > 80) {
              cells.push({ row: r, col: c, priority: v })
            }
          }
        }
        cells.sort((a, b) => b.priority - a.priority)
      } else {
        // Full mode: all cells in order
        for (let r = 0; r < 128; r++) {
          for (let c = 0; c < 128; c++) {
            cells.push({ row: r, col: c, priority: 0 })
          }
        }
      }

      const totalCells = cells.length
      let processed = 0

      for (let i = 0; i < totalCells; i += speed) {
        if (controller.signal.aborted) break

        const batch = cells.slice(i, i + speed)
        const batchResults = await Promise.all(
          batch.map(({ row, col }) => scanCell(row, col, controller.signal))
        )

        for (const result of batchResults) {
          if (result) {
            setResults(prev => [...prev, result])
          }
        }

        processed += batch.length
        setProgress(processed / totalCells)

        await new Promise(resolve => setTimeout(resolve, 30))
      }
    } finally {
      setScanning(false)
      setScanningRow(-1)
    }
  }, [scanning, matrix, mode, speed, scanCell])

  // Stop scanning
  const stopScan = useCallback(() => {
    scanAbortRef.current?.abort()
    setScanning(false)
    setScanningRow(-1)
  }, [])

  // Reset
  const reset = useCallback(() => {
    stopScan()
    setProgress(0)
    setResults([])
    setHotspots(new Set())
    setCurrentCell(null)
    setTotalEnergy(0)
    setDiscoveryPos(null)
  }, [stopScan])

  const hotspotArray = useMemo(
    () => results.filter(r => r.energy > 15).map(r => ({ row: r.row, col: r.col, energy: r.energy })),
    [results]
  )

  const stats = useMemo(
    () => ({
      scanned: Math.floor(progress * (mode === 'full' ? 16384 : mode === 'smart' ? 2000 : 500)),
      hotspots: hotspots.size,
      addresses: results.length,
      withBalance: results.filter(r => r.hasBalance).length,
      totalEnergy: Math.round(totalEnergy),
    }),
    [progress, mode, hotspots.size, results, totalEnergy]
  )

  // Show intro if not started
  if (!started) {
    return (
      <div className="w-full h-screen bg-black relative overflow-hidden">
        <Canvas camera={{ position: [0, 10, 15], fov: 50 }}>
          <CosmicBackground />
          {matrix.length > 0 && (
            <MatrixCityscape
              matrix={matrix}
              scanProgress={0}
              hotspots={new Set()}
              scanningRow={-1}
              activeCell={null}
            />
          )}
          <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom={false} enablePan={false} />
        </Canvas>
        <IntroOverlay onStart={() => setStarted(true)} loading={loading} />
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 8, 12], fov: 50 }}>
        <CosmicBackground />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#D4AF37" />
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#D4AF37" />

        {matrix.length > 0 && (
          <>
            <MatrixCityscape
              matrix={matrix}
              scanProgress={progress}
              hotspots={hotspots}
              scanningRow={scanningRow}
              activeCell={currentCell}
            />
            <ScanBeam progress={progress} active={scanning} />
            <HotspotMarkers hotspots={hotspotArray} />
            {discoveryPos && <DiscoveryExplosion position={discoveryPos} active={true} />}
          </>
        )}

        <CameraController scanning={scanning} progress={progress} />
        <OrbitControls enablePan={false} maxDistance={25} minDistance={5} />
      </Canvas>

      {/* UI Overlays */}
      <StatsHUD
        scanning={scanning}
        progress={progress}
        stats={stats}
        currentCell={currentCell}
      />

      <ResultsPanel
        results={results}
        expanded={expandedPanel}
        onToggle={() => setExpandedPanel(!expandedPanel)}
      />

      <ControlPanel
        scanning={scanning}
        onStart={startScan}
        onStop={stopScan}
        onReset={reset}
        speed={speed}
        onSpeedChange={setSpeed}
        mode={mode}
        onModeChange={setMode}
      />

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <h1 className="text-3xl font-mono font-bold tracking-wider">
          <span className="text-[#D4AF37]">
            ANNA MATRIX SCANNER
          </span>
        </h1>
        <p className="text-zinc-500 text-sm font-mono mt-1">
          128x128 Ternary Neural Network | Live Bitcoin Discovery
        </p>
      </div>
    </div>
  )
}
