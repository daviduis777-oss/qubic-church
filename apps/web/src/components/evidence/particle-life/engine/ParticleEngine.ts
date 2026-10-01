import type { ParticleData, SimulationConfig } from '../types'

/**
 * High-performance particle life simulation engine.
 * Uses Structure-of-Arrays (SoA) with TypedArrays for cache coherence
 * and a spatial hash grid for O(n*k) force computation.
 */
export class ParticleEngine {
  particles: ParticleData
  rules: number[][] = []
  width = 800
  height = 600
  config: SimulationConfig

  // Spatial hash grid
  private gridCellSize = 120
  private gridCols = 1
  private gridRows = 1
  private gridCells: Uint32Array[] = []
  private gridCounts: Uint32Array = new Uint32Array(0)
  private readonly MAX_PER_CELL = 64

  // Seeded PRNG
  private seed = 42

  constructor(config: SimulationConfig) {
    this.config = { ...config }
    this.particles = {
      x: new Float32Array(0),
      y: new Float32Array(0),
      vx: new Float32Array(0),
      vy: new Float32Array(0),
      type: new Uint8Array(0),
      x0: new Float32Array(0),
      y0: new Float32Array(0),
      count: 0,
    }
  }

  private mulberry32(): number {
    let t = (this.seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  init(width: number, height: number, rules: number[][], seed = 42) {
    this.width = width
    this.height = height
    this.rules = rules
    this.seed = seed

    const total = this.config.numTypes * this.config.particlesPerType
    const p: ParticleData = {
      x: new Float32Array(total),
      y: new Float32Array(total),
      vx: new Float32Array(total),
      vy: new Float32Array(total),
      type: new Uint8Array(total),
      x0: new Float32Array(total),
      y0: new Float32Array(total),
      count: total,
    }

    let idx = 0
    for (let t = 0; t < this.config.numTypes; t++) {
      for (let i = 0; i < this.config.particlesPerType; i++) {
        const x = this.mulberry32() * (width - 100) + 50
        const y = this.mulberry32() * (height - 100) + 50
        p.x[idx] = x
        p.y[idx] = y
        p.vx[idx] = 0
        p.vy[idx] = 0
        p.type[idx] = t
        p.x0[idx] = x
        p.y0[idx] = y
        idx++
      }
    }
    this.particles = p
    this.initGrid()
  }

  private initGrid() {
    this.gridCellSize = Math.max(this.config.radius, 40)
    this.gridCols = Math.max(1, Math.ceil(this.width / this.gridCellSize))
    this.gridRows = Math.max(1, Math.ceil(this.height / this.gridCellSize))
    const totalCells = this.gridCols * this.gridRows
    this.gridCounts = new Uint32Array(totalCells)
    this.gridCells = []
    for (let i = 0; i < totalCells; i++) {
      this.gridCells.push(new Uint32Array(this.MAX_PER_CELL))
    }
  }

  private buildGrid() {
    this.gridCounts.fill(0)
    const p = this.particles
    for (let i = 0; i < p.count; i++) {
      const col = Math.min(this.gridCols - 1, Math.max(0, Math.floor(p.x[i]! / this.gridCellSize)))
      const row = Math.min(this.gridRows - 1, Math.max(0, Math.floor(p.y[i]! / this.gridCellSize)))
      const cellIdx = row * this.gridCols + col
      const count = this.gridCounts[cellIdx]!
      if (count < this.MAX_PER_CELL) {
        this.gridCells[cellIdx]![count] = i
        this.gridCounts[cellIdx] = count + 1
      }
    }
  }

  step(stepsPerFrame = 1) {
    for (let s = 0; s < stepsPerFrame; s++) {
      this.stepOnce()
    }
  }

  private stepOnce() {
    const p = this.particles
    const { radius, viscosity, timeScale, boundaryMode } = this.config
    const r2 = radius * radius
    const n = this.config.numTypes
    const vmix = 1 - viscosity

    this.buildGrid()

    // Update velocities using spatial grid
    for (let i = 0; i < p.count; i++) {
      let fx = 0
      let fy = 0
      const ax = p.x[i]!
      const ay = p.y[i]!
      const aType = p.type[i]!

      // Grid cell of this particle
      const col = Math.min(this.gridCols - 1, Math.max(0, Math.floor(ax / this.gridCellSize)))
      const row = Math.min(this.gridRows - 1, Math.max(0, Math.floor(ay / this.gridCellSize)))

      // Check 9 neighboring cells
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          let nr = row + dr
          let nc = col + dc

          if (boundaryMode === 'toroidal') {
            nr = ((nr % this.gridRows) + this.gridRows) % this.gridRows
            nc = ((nc % this.gridCols) + this.gridCols) % this.gridCols
          } else {
            if (nr < 0 || nr >= this.gridRows || nc < 0 || nc >= this.gridCols) continue
          }

          const cellIdx = nr * this.gridCols + nc
          const cellCount = this.gridCounts[cellIdx]!
          const cell = this.gridCells[cellIdx]!

          for (let k = 0; k < cellCount; k++) {
            const j = cell[k]!
            if (j === i) continue

            let dx = ax - p.x[j]!
            let dy = ay - p.y[j]!

            // Toroidal distance
            if (boundaryMode === 'toroidal') {
              if (dx > this.width / 2) dx -= this.width
              else if (dx < -this.width / 2) dx += this.width
              if (dy > this.height / 2) dy -= this.height
              else if (dy < -this.height / 2) dy += this.height
            }

            const d2 = dx * dx + dy * dy
            if (d2 < r2 && d2 > 0) {
              const bType = p.type[j]!
              const g = this.rules[aType]?.[bType] ?? 0
              const F = g / Math.sqrt(d2)
              fx += F * dx
              fy += F * dy
            }
          }
        }
      }

      // Wall repulsion (bounce mode only)
      if (boundaryMode === 'bounce') {
        const wallD = 30
        const wallStr = 0.1
        if (ax < wallD) fx += (wallD - ax) * wallStr
        if (ax > this.width - wallD) fx += (this.width - wallD - ax) * wallStr
        if (ay < wallD) fy += (wallD - ay) * wallStr
        if (ay > this.height - wallD) fy += (this.height - wallD - ay) * wallStr
      }

      p.vx[i] = p.vx[i]! * vmix + fx * timeScale
      p.vy[i] = p.vy[i]! * vmix + fy * timeScale
    }

    // Update positions
    for (let i = 0; i < p.count; i++) {
      p.x[i] = p.x[i]! + p.vx[i]!
      p.y[i] = p.y[i]! + p.vy[i]!

      if (boundaryMode === 'toroidal') {
        p.x[i] = ((p.x[i]! % this.width) + this.width) % this.width
        p.y[i] = ((p.y[i]! % this.height) + this.height) % this.height
      } else {
        // Bounce
        if (p.x[i]! < 0) { p.x[i] = -p.x[i]!; p.vx[i] = -p.vx[i]! }
        if (p.x[i]! >= this.width) { p.x[i] = 2 * this.width - p.x[i]!; p.vx[i] = -p.vx[i]! }
        if (p.y[i]! < 0) { p.y[i] = -p.y[i]!; p.vy[i] = -p.vy[i]! }
        if (p.y[i]! >= this.height) { p.y[i] = 2 * this.height - p.y[i]!; p.vy[i] = -p.vy[i]! }
      }
    }
  }

  applyPulse(px: number, py: number, strength: number) {
    const p = this.particles
    for (let i = 0; i < p.count; i++) {
      const dx = p.x[i]! - px
      const dy = p.y[i]! - py
      const d2 = dx * dx + dy * dy
      if (d2 > 0 && d2 < 40000) {
        const F = strength / (d2 * this.config.timeScale)
        p.vx[i] = p.vx[i]! + F * dx
        p.vy[i] = p.vy[i]! + F * dy
      }
    }
  }

  resize(width: number, height: number) {
    const scaleX = width / this.width
    const scaleY = height / this.height
    this.width = width
    this.height = height
    const p = this.particles
    for (let i = 0; i < p.count; i++) {
      p.x[i] = p.x[i]! * scaleX
      p.y[i] = p.y[i]! * scaleY
    }
    this.initGrid()
  }

  setRules(rules: number[][]) {
    this.rules = rules
  }

  setConfig(config: Partial<SimulationConfig>) {
    const oldRadius = this.config.radius
    Object.assign(this.config, config)
    if (config.radius && config.radius !== oldRadius) {
      this.initGrid()
    }
  }
}
