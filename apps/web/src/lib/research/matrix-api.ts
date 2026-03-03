/**
 * Anna Matrix Research API
 *
 * A comprehensive API for analyzing the 128x128 Anna Matrix.
 * This provides the foundation for all research operations.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface Position {
  row: number
  col: number
}

export interface CellData {
  row: number
  col: number
  value: number
  address: number
  hex: string
  binary: string
  neighbors: {
    north: number | null
    south: number | null
    east: number | null
    west: number | null
  }
  isSpecial: boolean
  specialInfo?: string
}

export interface Region {
  startRow: number
  endRow: number
  startCol: number
  endCol: number
}

export interface SymmetryResult {
  type: string
  found: boolean
  matches: number
  total: number
  percentage: number
  exceptions: Position[]
}

export interface PatternMatch {
  pattern: string
  positions: Position[]
  values: number[]
}

export interface RowAnalysis {
  row: number
  values: number[]
  sum: number
  mean: number
  min: number
  max: number
  zeros: number
  positives: number
  negatives: number
}

export interface MatrixStats {
  min: number
  max: number
  mean: number
  median: number
  stdDev: number
  variance: number
  sum: number
  zeroCount: number
  positiveCount: number
  negativeCount: number
  totalCells: number
  uniqueValues: number
  mostCommon: { value: number; count: number }[]
}

// =============================================================================
// SPECIAL VALUES & CONSTANTS
// =============================================================================

const SPECIAL_ROWS: Record<number, string> = {
  21: 'Bitcoin Address Row (21 million cap)',
  68: 'Patoshi Pattern Row',
  96: 'Qubic Computor Row',
}

const SPECIAL_POSITIONS: Array<{ row: number; col: number; name: string }> = [
  { row: 0, col: 0, name: 'Origin (Alpha-Alpha)' },
  { row: 0, col: 127, name: 'Top-Right (Alpha-Omega)' },
  { row: 127, col: 0, name: 'Bottom-Left (Omega-Alpha)' },
  { row: 127, col: 127, name: 'End (Omega-Omega)' },
  { row: 36, col: 36, name: 'ZZZ Magic Square Start' },
  { row: 8, col: 74, name: 'KEY Position' },
  { row: 19, col: 19, name: 'T (THE encoding)' },
  { row: 7, col: 7, name: 'H (THE encoding)' },
  { row: 4, col: 4, name: 'E (THE encoding)' },
]

const FIBONACCI = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127]
const TRIANGLE_NUMBERS = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78, 91, 105, 120]

// =============================================================================
// MATRIX RESEARCH API CLASS
// =============================================================================

export class MatrixResearchAPI {
  private matrix: number[][]
  private readonly size = 128

  constructor(matrix: number[][]) {
    if (!matrix || matrix.length !== 128 || matrix[0]?.length !== 128) {
      throw new Error('Matrix must be 128x128')
    }
    this.matrix = matrix
  }

  // ===========================================================================
  // BASIC ACCESS
  // ===========================================================================

  /**
   * Get data for a specific cell
   */
  getCell(row: number, col: number): CellData {
    this.validatePosition(row, col)
    const value = this.matrix[row]![col]!

    return {
      row,
      col,
      value,
      address: row * 128 + col,
      hex: this.toHex(value),
      binary: this.toBinary(value),
      neighbors: {
        north: row > 0 ? this.matrix[row - 1]![col]! : null,
        south: row < 127 ? this.matrix[row + 1]![col]! : null,
        east: col < 127 ? this.matrix[row]![col + 1]! : null,
        west: col > 0 ? this.matrix[row]![col - 1]! : null,
      },
      isSpecial: this.isSpecialPosition(row, col),
      specialInfo: this.getSpecialInfo(row, col),
    }
  }

  /**
   * Get a full row
   */
  getRow(row: number): number[] {
    this.validateRow(row)
    return [...this.matrix[row]!]
  }

  /**
   * Get a full column
   */
  getColumn(col: number): number[] {
    this.validateCol(col)
    return this.matrix.map(row => row[col]!)
  }

  /**
   * Get a rectangular region
   */
  getRegion(startRow: number, endRow: number, startCol: number, endCol: number): number[][] {
    this.validatePosition(startRow, startCol)
    this.validatePosition(endRow - 1, endCol - 1)

    return this.matrix
      .slice(startRow, endRow)
      .map(row => row.slice(startCol, endCol))
  }

  /**
   * Get the diagonal values
   */
  getDiagonal(main: boolean = true): number[] {
    const result: number[] = []
    for (let i = 0; i < this.size; i++) {
      const col = main ? i : (this.size - 1 - i)
      result.push(this.matrix[i]![col]!)
    }
    return result
  }

  /**
   * Get raw matrix
   */
  getRawMatrix(): number[][] {
    return this.matrix.map(row => [...row])
  }

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  /**
   * Calculate sum of a row
   */
  rowSum(row: number): number {
    return this.getRow(row).reduce((a, b) => a + b, 0)
  }

  /**
   * Calculate sum of a column
   */
  colSum(col: number): number {
    return this.getColumn(col).reduce((a, b) => a + b, 0)
  }

  /**
   * Calculate sum of a region
   */
  regionSum(region: Region): number {
    const data = this.getRegion(region.startRow, region.endRow, region.startCol, region.endCol)
    return data.flat().reduce((a, b) => a + b, 0)
  }

  /**
   * Get full matrix statistics
   */
  getStats(): MatrixStats {
    const flat = this.matrix.flat()
    const sorted = [...flat].sort((a, b) => a - b)

    const sum = flat.reduce((a, b) => a + b, 0)
    const mean = sum / flat.length
    const median = sorted[Math.floor(sorted.length / 2)]!

    const variance = flat.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / flat.length
    const stdDev = Math.sqrt(variance)

    const valueCounts = new Map<number, number>()
    let zeroCount = 0
    let positiveCount = 0
    let negativeCount = 0

    for (const val of flat) {
      valueCounts.set(val, (valueCounts.get(val) || 0) + 1)
      if (val === 0) zeroCount++
      else if (val > 0) positiveCount++
      else negativeCount++
    }

    const mostCommon = [...valueCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({ value, count }))

    return {
      min: sorted[0]!,
      max: sorted[sorted.length - 1]!,
      mean,
      median,
      stdDev,
      variance,
      sum,
      zeroCount,
      positiveCount,
      negativeCount,
      totalCells: flat.length,
      uniqueValues: valueCounts.size,
      mostCommon,
    }
  }

  /**
   * Analyze a specific row
   */
  analyzeRow(row: number): RowAnalysis {
    const values = this.getRow(row)
    const sorted = [...values].sort((a, b) => a - b)

    return {
      row,
      values,
      sum: values.reduce((a, b) => a + b, 0),
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      min: sorted[0]!,
      max: sorted[sorted.length - 1]!,
      zeros: values.filter(v => v === 0).length,
      positives: values.filter(v => v > 0).length,
      negatives: values.filter(v => v < 0).length,
    }
  }

  /**
   * Get all row sums
   */
  getAllRowSums(): { row: number; sum: number }[] {
    return Array.from({ length: 128 }, (_, i) => ({
      row: i,
      sum: this.rowSum(i),
    }))
  }

  /**
   * Get all column sums
   */
  getAllColSums(): { col: number; sum: number }[] {
    return Array.from({ length: 128 }, (_, i) => ({
      col: i,
      sum: this.colSum(i),
    }))
  }

  // ===========================================================================
  // PATTERN DETECTION
  // ===========================================================================

  /**
   * Find all occurrences of a value
   */
  findValue(value: number): Position[] {
    const positions: Position[] = []
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.matrix[row]![col] === value) {
          positions.push({ row, col })
        }
      }
    }
    return positions
  }

  /**
   * Find occurrences of values in a range
   */
  findValueRange(min: number, max: number): Position[] {
    const positions: Position[] = []
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const val = this.matrix[row]![col]!
        if (val >= min && val <= max) {
          positions.push({ row, col })
        }
      }
    }
    return positions
  }

  /**
   * Find pattern sequences (fibonacci, prime, triangle, or custom)
   */
  findPattern(pattern: 'fibonacci' | 'prime' | 'triangle' | number[]): PatternMatch {
    const sequence = pattern === 'fibonacci' ? FIBONACCI
      : pattern === 'prime' ? PRIMES
      : pattern === 'triangle' ? TRIANGLE_NUMBERS
      : pattern

    const positions: Position[] = []
    const values: number[] = []

    // Check rows
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col <= this.size - sequence.length; col++) {
        let match = true
        for (let i = 0; i < sequence.length && match; i++) {
          if (this.matrix[row]![col + i] !== sequence[i]) {
            match = false
          }
        }
        if (match) {
          for (let i = 0; i < sequence.length; i++) {
            positions.push({ row, col: col + i })
            values.push(this.matrix[row]![col + i]!)
          }
        }
      }
    }

    // Check columns
    for (let col = 0; col < this.size; col++) {
      for (let row = 0; row <= this.size - sequence.length; row++) {
        let match = true
        for (let i = 0; i < sequence.length && match; i++) {
          if (this.matrix[row + i]![col] !== sequence[i]) {
            match = false
          }
        }
        if (match) {
          for (let i = 0; i < sequence.length; i++) {
            positions.push({ row: row + i, col })
            values.push(this.matrix[row + i]![col]!)
          }
        }
      }
    }

    return {
      pattern: Array.isArray(pattern) ? pattern.join(',') : pattern,
      positions,
      values,
    }
  }

  /**
   * Check for various symmetries
   */
  findSymmetry(type: 'horizontal' | 'vertical' | 'rotational' | 'point'): SymmetryResult {
    const exceptions: Position[] = []
    let matches = 0
    const total = this.size * this.size / 2

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        let compareRow: number, compareCol: number
        let shouldCompare = false

        switch (type) {
          case 'horizontal':
            if (row < this.size / 2) {
              compareRow = this.size - 1 - row
              compareCol = col
              shouldCompare = true
            }
            break
          case 'vertical':
            if (col < this.size / 2) {
              compareRow = row
              compareCol = this.size - 1 - col
              shouldCompare = true
            }
            break
          case 'rotational':
          case 'point':
            if (row < this.size / 2 || (row === this.size / 2 && col < this.size / 2)) {
              compareRow = this.size - 1 - row
              compareCol = this.size - 1 - col
              shouldCompare = true
            }
            break
        }

        if (shouldCompare) {
          const val1 = this.matrix[row]![col]!
          const val2 = this.matrix[compareRow!]![compareCol!]!

          // For rotational antisymmetry, check if val1 = -val2
          if (type === 'rotational' && val1 === -val2) {
            matches++
          } else if (type !== 'rotational' && val1 === val2) {
            matches++
          } else {
            exceptions.push({ row, col })
          }
        }
      }
    }

    return {
      type,
      found: exceptions.length === 0,
      matches,
      total: Math.floor(total),
      percentage: (matches / total) * 100,
      exceptions: exceptions.slice(0, 100), // Limit exceptions
    }
  }

  // ===========================================================================
  // COMPARISONS & OPERATIONS
  // ===========================================================================

  /**
   * XOR two cell values
   */
  xor(pos1: Position, pos2: Position): number {
    const val1 = this.matrix[pos1.row]![pos1.col]!
    const val2 = this.matrix[pos2.row]![pos2.col]!
    // Convert to unsigned and XOR
    const u1 = val1 < 0 ? val1 + 256 : val1
    const u2 = val2 < 0 ? val2 + 256 : val2
    return u1 ^ u2
  }

  /**
   * Calculate correlation between two rows
   */
  correlate(row1: number, row2: number): number {
    const r1 = this.getRow(row1)
    const r2 = this.getRow(row2)

    const mean1 = r1.reduce((a, b) => a + b, 0) / r1.length
    const mean2 = r2.reduce((a, b) => a + b, 0) / r2.length

    let numerator = 0
    let denom1 = 0
    let denom2 = 0

    for (let i = 0; i < r1.length; i++) {
      const d1 = r1[i]! - mean1
      const d2 = r2[i]! - mean2
      numerator += d1 * d2
      denom1 += d1 * d1
      denom2 += d2 * d2
    }

    return numerator / Math.sqrt(denom1 * denom2)
  }

  /**
   * Check if row pairs sum to a specific value
   */
  findRowPairSums(targetSum: number): { row1: number; row2: number; sum: number }[] {
    const results: { row1: number; row2: number; sum: number }[] = []

    for (let row1 = 0; row1 < this.size; row1++) {
      const row2 = this.size - 1 - row1
      if (row1 >= row2) break

      const r1 = this.getRow(row1)
      const r2 = this.getRow(row2)

      let sum = 0
      for (let col = 0; col < this.size; col++) {
        sum += r1[col]! + r2[col]!
      }

      if (sum === targetSum) {
        results.push({ row1, row2, sum })
      }
    }

    return results
  }

  /**
   * Check column mirror symmetry (col[i] + col[127-i])
   */
  checkColumnMirrorSymmetry(): { col: number; mirrorCol: number; sum: number }[] {
    const results: { col: number; mirrorCol: number; sum: number }[] = []

    for (let col = 0; col < this.size / 2; col++) {
      const mirrorCol = this.size - 1 - col
      let sum = 0

      for (let row = 0; row < this.size; row++) {
        sum += this.matrix[row]![col]! + this.matrix[row]![mirrorCol]!
      }

      results.push({ col, mirrorCol, sum })
    }

    return results
  }

  // ===========================================================================
  // BULK OPERATIONS
  // ===========================================================================

  /**
   * Map over all rows
   */
  mapRows<T>(fn: (row: number[], rowIndex: number) => T): T[] {
    return this.matrix.map((row, i) => fn([...row], i))
  }

  /**
   * Map over all columns
   */
  mapCols<T>(fn: (col: number[], colIndex: number) => T): T[] {
    const results: T[] = []
    for (let col = 0; col < this.size; col++) {
      results.push(fn(this.getColumn(col), col))
    }
    return results
  }

  /**
   * Filter cells based on predicate
   */
  filterCells(predicate: (value: number, row: number, col: number) => boolean): Position[] {
    const results: Position[] = []
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (predicate(this.matrix[row]![col]!, row, col)) {
          results.push({ row, col })
        }
      }
    }
    return results
  }

  /**
   * Reduce over all cells
   */
  reduce<T>(fn: (acc: T, value: number, row: number, col: number) => T, initial: T): T {
    let acc = initial
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        acc = fn(acc, this.matrix[row]![col]!, row, col)
      }
    }
    return acc
  }

  /**
   * Apply a formula to all cells and return results
   */
  applyFormula(formula: (value: number, row: number, col: number) => number): number[][] {
    return this.matrix.map((rowData, row) =>
      rowData.map((value, col) => formula(value, row, col))
    )
  }

  // ===========================================================================
  // WORD ENCODING (A=0, B=1, ... Z=25)
  // ===========================================================================

  /**
   * Get diagonal sum for word encoding
   */
  wordEncodingSum(word: string): { word: string; positions: Position[]; values: number[]; sum: number } {
    const positions: Position[] = []
    const values: number[] = []

    for (const char of word.toUpperCase()) {
      const index = char.charCodeAt(0) - 65 // A=0, B=1, etc.
      if (index >= 0 && index < 26) {
        positions.push({ row: index, col: index })
        values.push(this.matrix[index]![index]!)
      }
    }

    return {
      word,
      positions,
      values,
      sum: values.reduce((a, b) => a + b, 0),
    }
  }

  /**
   * Find words that sum to a target value
   */
  findWordsWithSum(targetSum: number, maxLength: number = 5): string[] {
    const results: string[] = []
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

    // Get diagonal values
    const diagonalValues: number[] = []
    for (let i = 0; i < 26; i++) {
      diagonalValues.push(this.matrix[i]![i]!)
    }

    // Brute force for short words
    const findWords = (current: string, currentSum: number, maxLen: number) => {
      if (currentSum === targetSum && current.length > 0) {
        results.push(current)
      }
      if (current.length >= maxLen) return

      for (let i = 0; i < 26; i++) {
        const newSum = currentSum + diagonalValues[i]!
        if (Math.abs(newSum) <= Math.abs(targetSum) + 200) { // Pruning
          findWords(current + alphabet[i], newSum, maxLen)
        }
      }
    }

    findWords('', 0, maxLength)
    return results.slice(0, 100) // Limit results
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private validatePosition(row: number, col: number): void {
    if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
      throw new Error(`Invalid position: [${row}, ${col}]. Must be in range [0, ${this.size - 1}]`)
    }
  }

  private validateRow(row: number): void {
    if (row < 0 || row >= this.size) {
      throw new Error(`Invalid row: ${row}. Must be in range [0, ${this.size - 1}]`)
    }
  }

  private validateCol(col: number): void {
    if (col < 0 || col >= this.size) {
      throw new Error(`Invalid column: ${col}. Must be in range [0, ${this.size - 1}]`)
    }
  }

  private toHex(value: number): string {
    const unsigned = value < 0 ? value + 256 : value
    return '0x' + unsigned.toString(16).toUpperCase().padStart(2, '0')
  }

  private toBinary(value: number): string {
    const unsigned = value < 0 ? value + 256 : value
    return unsigned.toString(2).padStart(8, '0')
  }

  private isSpecialPosition(row: number, col: number): boolean {
    return SPECIAL_POSITIONS.some(p => p.row === row && p.col === col) ||
           SPECIAL_ROWS[row] !== undefined
  }

  private getSpecialInfo(row: number, col: number): string | undefined {
    const special = SPECIAL_POSITIONS.find(p => p.row === row && p.col === col)
    if (special) return special.name
    if (SPECIAL_ROWS[row]) return SPECIAL_ROWS[row]
    return undefined
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createMatrixAPI(matrix: number[][]): MatrixResearchAPI {
  return new MatrixResearchAPI(matrix)
}

// =============================================================================
// MATH UTILITIES (exposed to sandbox)
// =============================================================================

export const MathUtils = {
  sum: (arr: number[]) => arr.reduce((a, b) => a + b, 0),
  mean: (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length,
  median: (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b)
    return sorted[Math.floor(sorted.length / 2)]
  },
  stdDev: (arr: number[]) => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length
    return Math.sqrt(variance)
  },
  min: (arr: number[]) => Math.min(...arr),
  max: (arr: number[]) => Math.max(...arr),
  range: (arr: number[]) => Math.max(...arr) - Math.min(...arr),
  isPrime: (n: number) => {
    if (n < 2) return false
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false
    }
    return true
  },
  isFibonacci: (n: number) => {
    const isPerfectSquare = (x: number) => {
      const s = Math.sqrt(x)
      return s * s === x
    }
    return isPerfectSquare(5 * n * n + 4) || isPerfectSquare(5 * n * n - 4)
  },
  factorial: (n: number): number => n <= 1 ? 1 : n * MathUtils.factorial(n - 1),
  gcd: (a: number, b: number): number => b === 0 ? a : MathUtils.gcd(b, a % b),
  lcm: (a: number, b: number) => (a * b) / MathUtils.gcd(a, b),
}

// =============================================================================
// CRYPTO UTILITIES (exposed to sandbox)
// =============================================================================

export const CryptoUtils = {
  xor: (a: number, b: number) => {
    const ua = a < 0 ? a + 256 : a
    const ub = b < 0 ? b + 256 : b
    return ua ^ ub
  },
  and: (a: number, b: number) => {
    const ua = a < 0 ? a + 256 : a
    const ub = b < 0 ? b + 256 : b
    return ua & ub
  },
  or: (a: number, b: number) => {
    const ua = a < 0 ? a + 256 : a
    const ub = b < 0 ? b + 256 : b
    return ua | ub
  },
  rotateLeft: (value: number, bits: number) => {
    const u = value < 0 ? value + 256 : value
    return ((u << bits) | (u >> (8 - bits))) & 0xFF
  },
  rotateRight: (value: number, bits: number) => {
    const u = value < 0 ? value + 256 : value
    return ((u >> bits) | (u << (8 - bits))) & 0xFF
  },
  toSigned: (value: number) => value > 127 ? value - 256 : value,
  toUnsigned: (value: number) => value < 0 ? value + 256 : value,
}
