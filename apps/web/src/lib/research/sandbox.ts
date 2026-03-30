/**
 * Research Sandbox
 *
 * Provides a safe environment for executing user-written research code
 * with access to the Matrix API and utility functions.
 */

import { MatrixResearchAPI, MathUtils, CryptoUtils, type Position, type CellData } from './matrix-api'

export interface SandboxResult {
  success: boolean
  result?: unknown
  error?: string
  executionTime: number
  logs: string[]
}

export interface SandboxConfig {
  timeout?: number // ms
  maxIterations?: number
}

const DEFAULT_CONFIG: SandboxConfig = {
  timeout: 5000,
  maxIterations: 1000000,
}

/**
 * Execute user code in a sandboxed environment
 */
export function executeSandboxedCode(
  code: string,
  matrix: MatrixResearchAPI,
  config: SandboxConfig = {}
): SandboxResult {
  const { timeout, maxIterations } = { ...DEFAULT_CONFIG, ...config }
  const logs: string[] = []
  const startTime = performance.now()

  // Create a custom console that captures logs
  const sandboxConsole = {
    log: (...args: unknown[]) => logs.push(args.map(formatValue).join(' ')),
    info: (...args: unknown[]) => logs.push('[INFO] ' + args.map(formatValue).join(' ')),
    warn: (...args: unknown[]) => logs.push('[WARN] ' + args.map(formatValue).join(' ')),
    error: (...args: unknown[]) => logs.push('[ERROR] ' + args.map(formatValue).join(' ')),
    table: (data: unknown) => logs.push(formatTable(data)),
  }

  try {
    // Create the sandbox context
    const sandboxGlobals = {
      // Matrix API
      matrix,

      // Utility functions
      Math: MathUtils,
      Crypto: CryptoUtils,

      // Standard math
      abs: Math.abs,
      sqrt: Math.sqrt,
      pow: Math.pow,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      min: Math.min,
      max: Math.max,
      log: Math.log,
      log2: Math.log2,
      log10: Math.log10,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      PI: Math.PI,
      E: Math.E,

      // Array utilities
      range: (start: number, end?: number, step: number = 1) => {
        if (end === undefined) {
          end = start
          start = 0
        }
        const result: number[] = []
        for (let i = start; i < end; i += step) {
          result.push(i)
        }
        return result
      },
      sum: (arr: number[]) => arr.reduce((a, b) => a + b, 0),
      mean: (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length,

      // Console
      console: sandboxConsole,
      print: (...args: unknown[]) => sandboxConsole.log(...args),

      // JSON for output formatting
      JSON: {
        stringify: JSON.stringify,
        parse: JSON.parse,
      },

      // Prevent access to dangerous globals
      window: undefined,
      document: undefined,
      fetch: undefined,
      XMLHttpRequest: undefined,
      eval: undefined,
      Function: undefined,
    }

    // Wrap the code in a function to capture the return value
    const wrappedCode = `
      "use strict";
      const __result__ = (function() {
        ${code}
      })();
      __result__;
    `

    // Create a function with limited scope
    const fn = new Function(
      ...Object.keys(sandboxGlobals),
      wrappedCode
    )

    // Execute with timeout
    let result: unknown
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), timeout)
    })

    // For synchronous execution, we just run the function
    // (Real async would need web workers)
    result = fn(...Object.values(sandboxGlobals))

    const executionTime = performance.now() - startTime

    return {
      success: true,
      result,
      executionTime,
      logs,
    }
  } catch (error) {
    const executionTime = performance.now() - startTime
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTime,
      logs,
    }
  }
}

/**
 * Format a value for display
 */
function formatValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (value.length <= 10) {
      return '[' + value.map(formatValue).join(', ') + ']'
    }
    return `[${value.slice(0, 5).map(formatValue).join(', ')}, ... (${value.length} items)]`
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return '[Object]'
    }
  }
  return String(value)
}

/**
 * Format tabular data
 */
function formatTable(data: unknown): string {
  if (!data || typeof data !== 'object') return formatValue(data)

  if (Array.isArray(data)) {
    if (data.length === 0) return '(empty array)'

    // Check if it's an array of objects
    if (typeof data[0] === 'object' && data[0] !== null) {
      const keys = Object.keys(data[0])
      const header = keys.join('\t')
      const rows = data.slice(0, 20).map(row =>
        keys.map(k => formatValue((row as Record<string, unknown>)[k])).join('\t')
      )
      return header + '\n' + rows.join('\n') + (data.length > 20 ? `\n... (${data.length - 20} more rows)` : '')
    }

    // Simple array
    return data.slice(0, 20).map((v, i) => `[${i}] ${formatValue(v)}`).join('\n') +
      (data.length > 20 ? `\n... (${data.length - 20} more items)` : '')
  }

  // Object
  return Object.entries(data)
    .map(([k, v]) => `${k}: ${formatValue(v)}`)
    .join('\n')
}

/**
 * Code snippets for the editor
 */
export const CODE_SNIPPETS = [
  {
    name: 'Get Cell Value',
    code: `// Get the value at position [row, col]
const cell = matrix.getCell(21, 68)
console.log(cell)
return cell.value`,
  },
  {
    name: 'Row Sum',
    code: `// Calculate the sum of a row
const row = 21
const sum = matrix.rowSum(row)
console.log(\`Row \${row} sum: \${sum}\`)
return sum`,
  },
  {
    name: 'Find Value',
    code: `// Find all cells with a specific value
const positions = matrix.findValue(0)
console.log(\`Found \${positions.length} zeros\`)
return positions`,
  },
  {
    name: 'Check Symmetry',
    code: `// Check rotational antisymmetry
const result = matrix.findSymmetry('rotational')
console.log(\`Rotational antisymmetry: \${result.percentage.toFixed(2)}%\`)
return result`,
  },
  {
    name: 'Word Encoding',
    code: `// Calculate word encoding sum
const word = "THE"
const result = matrix.wordEncodingSum(word)
console.log(\`"\${word}" = \${result.sum}\`)
return result`,
  },
  {
    name: 'Statistics',
    code: `// Get full matrix statistics
const stats = matrix.getStats()
console.log(\`Mean: \${stats.mean.toFixed(2)}\`)
console.log(\`StdDev: \${stats.stdDev.toFixed(2)}\`)
return stats`,
  },
  {
    name: 'All Row Sums',
    code: `// Get all row sums
const rowSums = matrix.getAllRowSums()
const specialRows = rowSums.filter(r => Math.abs(r.sum) < 10)
console.log('Rows with sum near zero:')
console.table(specialRows)
return specialRows`,
  },
  {
    name: 'Column Mirror',
    code: `// Check column mirror symmetry
const mirrors = matrix.checkColumnMirrorSymmetry()
const perfect = mirrors.filter(m => m.sum === -128)
console.log(\`Columns with sum -128: \${perfect.length}/64\`)
return perfect`,
  },
  {
    name: 'XOR Corners',
    code: `// XOR all four corners
const tl = matrix.getCell(0, 0).value
const tr = matrix.getCell(0, 127).value
const bl = matrix.getCell(127, 0).value
const br = matrix.getCell(127, 127).value

const xor = Crypto.xor(Crypto.xor(Crypto.xor(
  Crypto.toUnsigned(tl),
  Crypto.toUnsigned(tr)),
  Crypto.toUnsigned(bl)),
  Crypto.toUnsigned(br))

console.log(\`Corners: \${tl}, \${tr}, \${bl}, \${br}\`)
console.log(\`XOR: \${xor}\`)
return xor`,
  },
  {
    name: 'Filter Cells',
    code: `// Find cells matching a condition
const primes = matrix.filterCells((value) => {
  if (value <= 1) return false
  for (let i = 2; i <= sqrt(value); i++) {
    if (value % i === 0) return false
  }
  return value > 1
})
console.log(\`Found \${primes.length} prime values\`)
return primes.slice(0, 20)`,
  },
  {
    name: 'Custom Analysis',
    code: `// Write your own analysis
// Available: matrix, Math, Crypto, console, range, sum, mean

// Example: Find value pairs
const pairs = {}
for (let row = 0; row < 128; row++) {
  for (let col = 0; col < 128; col++) {
    const cell = matrix.getCell(row, col)
    const key = cell.value
    if (!pairs[key]) pairs[key] = 0
    pairs[key]++
  }
}

// Find most common
const sorted = Object.entries(pairs)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)

console.table(sorted.map(([value, count]) => ({ value: Number(value), count })))
return sorted`,
  },
]
