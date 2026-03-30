/**
 * AIGARTH ENGINE
 *
 * Main class for the Local Aigarth Computer.
 * Provides a high-level interface for neural network processing.
 */

import type {
  TernaryState,
  InputType,
  ProcessingResult,
  MatrixQueryResult,
  CompareResult,
  OracleResult,
  EngineStats,
  EngineConfig,
  InferenceResult,
} from './types'

import {
  ternaryClamp,
  textToTernary,
  hexToTernary,
  toTernaryBits,
  fromTernaryBits,
  computeEnergy,
  computeDistribution,
  sha256,
  bytesToTernary,
  getEnergyLabel,
} from './ternary'

import { runTickLoop, DEFAULT_CONFIG, streamTickLoop } from './tick-loop'

/**
 * The main Aigarth processing engine.
 */
export class AigarthEngine {
  private matrix: number[][] | null = null
  private config: Required<EngineConfig>
  public matrixLoaded = false

  constructor(config?: EngineConfig) {
    this.config = {
      numInputs: config?.numInputs ?? DEFAULT_CONFIG.numInputs,
      numOutputs: config?.numOutputs ?? DEFAULT_CONFIG.numOutputs,
      numNeighbors: config?.numNeighbors ?? DEFAULT_CONFIG.numNeighbors,
      maxTicks: config?.maxTicks ?? DEFAULT_CONFIG.maxTicks,
    }
  }

  /**
   * Load the Anna Matrix from URL or data.
   */
  async loadMatrix(urlOrData?: string | number[][]): Promise<boolean> {
    try {
      if (Array.isArray(urlOrData)) {
        // Direct data
        this.matrix = urlOrData
      } else {
        // Fetch from URL
        const url = urlOrData ?? '/data/anna-matrix.json'
        const response = await fetch(url)
        const data = await response.json()

        // Handle both {"matrix": [...]} and direct [...] formats
        this.matrix = data.matrix ?? data
      }

      this.matrixLoaded = this.matrix !== null && this.matrix.length === 128
      return this.matrixLoaded
    } catch (error) {
      console.error('Failed to load matrix:', error)
      this.matrixLoaded = false
      return false
    }
  }

  /**
   * Auto-detect input type.
   */
  private detectInputType(input: string): InputType {
    const trimmed = input.trim()

    // Coordinates: "X+Y" or "X,Y"
    if (trimmed.includes('+') || trimmed.includes(',')) {
      const parts = trimmed.replace(',', '+').split('+')
      if (parts.length === 2) {
        const xStr = parts[0]?.trim() ?? ''
        const yStr = parts[1]?.trim() ?? ''
        const x = parseInt(xStr, 10)
        const y = parseInt(yStr, 10)
        if (!isNaN(x) && !isNaN(y)) return 'coords'
      }
    }

    // Hex string
    if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
      return 'hex'
    }

    // Qubic seed (55 lowercase chars)
    if (trimmed.length === 55 && /^[a-z]+$/.test(trimmed)) {
      return 'qubic_seed'
    }

    // Bitcoin address
    if (/^(1|3|bc1)[a-zA-Z0-9]{24,61}$/.test(trimmed)) {
      return 'bitcoin'
    }

    // Binary array
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return 'binary'
    }

    return 'text'
  }

  /**
   * Convert input to ternary based on type.
   */
  private async convertToTernary(
    input: string,
    inputType: InputType
  ): Promise<TernaryState[]> {
    const numInputs = this.config.numInputs

    switch (inputType) {
      case 'text':
        return textToTernary(input, numInputs / 8)

      case 'hex': {
        const ternary = hexToTernary(input)
        while (ternary.length < numInputs) ternary.push(-1)
        return ternary.slice(0, numInputs) as TernaryState[]
      }

      case 'qubic_seed': {
        // Each char (a-z) -> 5 bits
        const ternary: TernaryState[] = []
        for (const char of input) {
          const val = char.charCodeAt(0) - 'a'.charCodeAt(0)
          ternary.push(...toTernaryBits(val, 5))
        }
        while (ternary.length < numInputs) ternary.push(-1)
        return ternary.slice(0, numInputs)
      }

      case 'bitcoin': {
        // Hash the address
        const hash = await sha256(input)
        const ternary = bytesToTernary(hash)
        return ternary.slice(0, numInputs) as TernaryState[]
      }

      case 'binary': {
        try {
          const values = JSON.parse(input) as number[]
          const ternary = values.map((v) => ternaryClamp(v))
          while (ternary.length < numInputs) ternary.push(-1)
          return ternary.slice(0, numInputs)
        } catch {
          return textToTernary(input, numInputs / 8)
        }
      }

      case 'coords': {
        // For coords, return based on matrix value
        const parts = input.replace(',', '+').split('+')
        const xStr = parts[0]?.trim() ?? '0'
        const yStr = parts[1]?.trim() ?? '0'
        const x = parseInt(xStr, 10)
        const y = parseInt(yStr, 10)

        // Anna to matrix coords
        const col = ((x % 128) + 128) % 128
        const row = ((63 - y) % 128 + 128) % 128

        if (this.matrix) {
          const matrixRow = this.matrix[row]
          const value = matrixRow?.[col] ?? 0
          return toTernaryBits(Math.abs(value), numInputs)
        }
        return new Array(numInputs).fill(-1) as TernaryState[]
      }

      default:
        return textToTernary(input, numInputs / 8)
    }
  }

  /**
   * Process an input through the network.
   */
  async process(
    input: string,
    inputType?: InputType,
    recordHistory: boolean = false
  ): Promise<ProcessingResult> {
    if (!this.matrix) {
      throw new Error('Matrix not loaded. Call loadMatrix() first.')
    }

    const startTime = performance.now()

    // Detect type
    const detectedType = inputType ?? this.detectInputType(input)

    // Convert to ternary
    const ternaryInput = await this.convertToTernary(input, detectedType)

    // Run inference
    const result = runTickLoop(ternaryInput, this.matrix, this.config, recordHistory)

    const durationMs = performance.now() - startTime

    // Decode output
    const decodedValue = fromTernaryBits(result.outputs)

    return {
      inputRaw: input,
      inputType: detectedType,
      inputTernaryLength: ternaryInput.length,
      ticks: result.ticks,
      endReason: result.endReason,
      durationMs: Math.round(durationMs * 1000) / 1000,
      energy: result.energy,
      stateVector: result.allStates,
      outputVector: result.outputs,
      distribution: result.distribution,
      decodedValue,
      history: result.history,
    }
  }

  /**
   * Stream processing with tick callbacks.
   */
  streamProcess(
    input: string,
    inputType: InputType | undefined,
    onTick: (tick: number, states: TernaryState[], energy: number) => void,
    onComplete: (result: ProcessingResult) => void
  ): () => void {
    if (!this.matrix) {
      throw new Error('Matrix not loaded')
    }

    const startTime = performance.now()
    const detectedType = inputType ?? this.detectInputType(input)

    // Sync convert (for streaming we need immediate start)
    let ternaryInput: TernaryState[]

    if (detectedType === 'text') {
      ternaryInput = textToTernary(input, this.config.numInputs / 8)
    } else if (detectedType === 'hex') {
      const t = hexToTernary(input)
      while (t.length < this.config.numInputs) t.push(-1)
      ternaryInput = t.slice(0, this.config.numInputs) as TernaryState[]
    } else {
      ternaryInput = textToTernary(input, this.config.numInputs / 8)
    }

    return streamTickLoop(
      ternaryInput,
      this.matrix,
      this.config,
      onTick,
      (result) => {
        const durationMs = performance.now() - startTime
        onComplete({
          inputRaw: input,
          inputType: detectedType,
          inputTernaryLength: ternaryInput.length,
          ticks: result.ticks,
          endReason: result.endReason,
          durationMs: Math.round(durationMs * 1000) / 1000,
          energy: result.energy,
          stateVector: result.allStates,
          outputVector: result.outputs,
          distribution: result.distribution,
          decodedValue: fromTernaryBits(result.outputs),
        })
      }
    )
  }

  /**
   * Query a specific matrix cell.
   */
  queryMatrix(row: number, col: number): MatrixQueryResult | null {
    if (!this.matrix) return null

    row = ((row % 128) + 128) % 128
    col = ((col % 128) + 128) % 128

    const matrixRow = this.matrix[row]
    if (!matrixRow) return null

    const value = matrixRow[col] ?? 0

    // Matrix to Anna coords
    const annaX = col < 64 ? col : col - 128
    const annaY = 63 - row

    // Get neighbors
    const neighbors: number[] = []
    for (const dr of [-1, 0, 1]) {
      for (const dc of [-1, 0, 1]) {
        if (dr === 0 && dc === 0) continue
        const nr = ((row + dr) % 128 + 128) % 128
        const nc = ((col + dc) % 128 + 128) % 128
        const nRow = this.matrix[nr]
        neighbors.push(nRow?.[nc] ?? 0)
      }
    }

    return {
      row,
      col,
      value,
      annaX,
      annaY,
      annaFormat: `${annaX}+${annaY}`,
      hex: '0x' + (value >= 0 ? value : 256 + value).toString(16).toUpperCase().padStart(2, '0'),
      ternary: ternaryClamp(value),
      neighbors,
      neighborsSum: neighbors.reduce((a, b) => a + b, 0),
    }
  }

  /**
   * Compare two inputs.
   */
  async compare(inputA: string, inputB: string): Promise<CompareResult> {
    const resultA = await this.process(inputA)
    const resultB = await this.process(inputB)

    // Cosine-like similarity
    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < resultA.stateVector.length; i++) {
      const stateA = resultA.stateVector[i] ?? 0
      const stateB = resultB.stateVector[i] ?? 0
      dotProduct += stateA * stateB
      normA += Math.abs(stateA)
      normB += Math.abs(stateB)
    }

    const similarity =
      normA > 0 && normB > 0 ? ((dotProduct / (normA * normB) + 1) / 2) * 100 : 50

    // Exact matches
    let matches = 0
    for (let i = 0; i < resultA.stateVector.length; i++) {
      if (resultA.stateVector[i] === resultB.stateVector[i]) matches++
    }

    return {
      inputA,
      inputB,
      energyA: resultA.energy,
      energyB: resultB.energy,
      energyDiff: Math.abs(resultA.energy - resultB.energy),
      similarity: Math.round(similarity * 100) / 100,
      exactMatches: matches,
      matchPercentage: Math.round((matches / resultA.stateVector.length) * 10000) / 100,
      ticksA: resultA.ticks,
      ticksB: resultB.ticks,
    }
  }

  /**
   * Yes/No oracle based on energy.
   */
  async oracle(question: string): Promise<OracleResult> {
    const result = await this.process(question)

    let answer: 'YES' | 'NO' | 'UNCERTAIN'
    let confidence: number

    if (result.energy > 0) {
      answer = 'YES'
      confidence = Math.min((Math.abs(result.energy) / 64) * 100, 100)
    } else if (result.energy < 0) {
      answer = 'NO'
      confidence = Math.min((Math.abs(result.energy) / 64) * 100, 100)
    } else {
      answer = 'UNCERTAIN'
      confidence = 0
    }

    return {
      question,
      answer,
      confidence: Math.round(confidence * 10) / 10,
      energy: result.energy,
      ticks: result.ticks,
    }
  }

  /**
   * Get engine statistics.
   */
  getStats(): EngineStats {
    const stats: EngineStats = {
      engineVersion: '1.0.0',
      matrixLoaded: this.matrixLoaded,
      numInputs: this.config.numInputs,
      numOutputs: this.config.numOutputs,
      numNeighbors: this.config.numNeighbors,
      maxTicks: this.config.maxTicks,
      population: this.config.numInputs + this.config.numOutputs,
    }

    if (this.matrix) {
      let min = Infinity
      let max = -Infinity
      let sum = 0
      let positive = 0
      let negative = 0
      let zero = 0

      for (const row of this.matrix) {
        for (const val of row) {
          min = Math.min(min, val)
          max = Math.max(max, val)
          sum += val
          if (val > 0) positive++
          else if (val < 0) negative++
          else zero++
        }
      }

      const firstRow = this.matrix[0]
      const rowLength = firstRow?.length ?? 0
      stats.matrixShape = [this.matrix.length, rowLength]
      stats.matrixMin = min
      stats.matrixMax = max
      stats.matrixMean = rowLength > 0 ? sum / (this.matrix.length * rowLength) : 0
      stats.positiveCells = positive
      stats.negativeCells = negative
      stats.zeroCells = zero
    }

    return stats
  }
}
