import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Cache the matrix data
let cachedMatrix: number[][] | null = null

async function getMatrix(): Promise<number[][]> {
  if (cachedMatrix) return cachedMatrix

  const filePath = path.join(process.cwd(), 'public', 'data', 'anna-matrix.json')
  const fileContent = await fs.readFile(filePath, 'utf-8')
  const parsed = JSON.parse(fileContent)
  // Handle both { matrix: [...] } and direct array formats
  cachedMatrix = parsed.matrix || parsed
  return cachedMatrix!
}

function calculateStats(matrix: number[][]) {
  const flat = matrix.flat()
  const sorted = [...flat].sort((a, b) => a - b)

  const sum = flat.reduce((a, b) => a + b, 0)
  const mean = sum / flat.length
  const median = sorted[Math.floor(sorted.length / 2)]

  const variance = flat.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / flat.length
  const stdDev = Math.sqrt(variance)

  let zeroCount = 0, positiveCount = 0, negativeCount = 0
  for (const val of flat) {
    if (val === 0) zeroCount++
    else if (val > 0) positiveCount++
    else negativeCount++
  }

  return {
    dimensions: { rows: 128, cols: 128, total: 16384 },
    range: { min: sorted[0], max: sorted[sorted.length - 1] },
    statistics: { mean, median, stdDev, variance, sum },
    distribution: { zeroCount, positiveCount, negativeCount },
  }
}

// GET /api/research/anna-matrix
// Query params:
//   - format: 'full' | 'stats' | 'row' | 'col' | 'cell' | 'region'
//   - row: number (for row/cell/region)
//   - col: number (for col/cell/region)
//   - endRow: number (for region)
//   - endCol: number (for region)
export async function GET(request: NextRequest) {
  try {
    const matrix = await getMatrix()
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'stats'

    // API Info response
    if (format === 'info') {
      return NextResponse.json({
        name: 'Anna Matrix Research API',
        version: '2.0',
        description: 'REST API for accessing the 128x128 Anna Matrix',
        endpoints: {
          'GET /api/research/anna-matrix': 'Matrix statistics (default)',
          'GET /api/research/anna-matrix?format=full': 'Complete matrix data',
          'GET /api/research/anna-matrix?format=stats': 'Statistical analysis',
          'GET /api/research/anna-matrix?format=row&row=21': 'Get specific row',
          'GET /api/research/anna-matrix?format=col&col=68': 'Get specific column',
          'GET /api/research/anna-matrix?format=cell&row=21&col=68': 'Get specific cell',
          'GET /api/research/anna-matrix?format=region&row=0&col=0&endRow=64&endCol=64': 'Get region',
          'GET /api/research/anna-matrix?format=diagonal': 'Get main diagonal',
          'GET /api/research/anna-matrix?format=search&value=0': 'Find all cells with value',
        },
      })
    }

    // Full matrix
    if (format === 'full') {
      return NextResponse.json({
        source: 'Anna Matrix Research API',
        timestamp: new Date().toISOString(),
        dimensions: { rows: 128, cols: 128 },
        matrix,
      })
    }

    // Statistics
    if (format === 'stats') {
      const stats = calculateStats(matrix)
      return NextResponse.json({
        source: 'Anna Matrix Research API',
        timestamp: new Date().toISOString(),
        ...stats,
      })
    }

    // Get specific row
    if (format === 'row') {
      const row = parseInt(searchParams.get('row') || '', 10)
      if (isNaN(row) || row < 0 || row >= 128) {
        return NextResponse.json({ error: 'Invalid row number. Must be 0-127.' }, { status: 400 })
      }

      const rowData = matrix[row]!
      const sum = rowData.reduce((a, b) => a + b, 0)

      return NextResponse.json({
        row,
        values: rowData,
        sum,
        mean: sum / 128,
        min: Math.min(...rowData),
        max: Math.max(...rowData),
      })
    }

    // Get specific column
    if (format === 'col') {
      const col = parseInt(searchParams.get('col') || '', 10)
      if (isNaN(col) || col < 0 || col >= 128) {
        return NextResponse.json({ error: 'Invalid column number. Must be 0-127.' }, { status: 400 })
      }

      const colData = matrix.map(row => row[col]!)
      const sum = colData.reduce((a, b) => a + b, 0)

      return NextResponse.json({
        col,
        values: colData,
        sum,
        mean: sum / 128,
        min: Math.min(...colData),
        max: Math.max(...colData),
      })
    }

    // Get specific cell
    if (format === 'cell') {
      const row = parseInt(searchParams.get('row') || '', 10)
      const col = parseInt(searchParams.get('col') || '', 10)

      if (isNaN(row) || row < 0 || row >= 128) {
        return NextResponse.json({ error: 'Invalid row number. Must be 0-127.' }, { status: 400 })
      }
      if (isNaN(col) || col < 0 || col >= 128) {
        return NextResponse.json({ error: 'Invalid column number. Must be 0-127.' }, { status: 400 })
      }

      const value = matrix[row]![col]!
      const unsigned = value < 0 ? value + 256 : value

      return NextResponse.json({
        row,
        col,
        value,
        address: row * 128 + col,
        hex: '0x' + unsigned.toString(16).toUpperCase().padStart(2, '0'),
        binary: unsigned.toString(2).padStart(8, '0'),
        neighbors: {
          north: row > 0 ? matrix[row - 1]![col]! : null,
          south: row < 127 ? matrix[row + 1]![col]! : null,
          east: col < 127 ? matrix[row]![col + 1]! : null,
          west: col > 0 ? matrix[row]![col - 1]! : null,
        },
      })
    }

    // Get region
    if (format === 'region') {
      const startRow = parseInt(searchParams.get('row') || '0', 10)
      const startCol = parseInt(searchParams.get('col') || '0', 10)
      const endRow = parseInt(searchParams.get('endRow') || '128', 10)
      const endCol = parseInt(searchParams.get('endCol') || '128', 10)

      if (startRow < 0 || startRow >= 128 || endRow < 0 || endRow > 128 || startRow >= endRow) {
        return NextResponse.json({ error: 'Invalid row range.' }, { status: 400 })
      }
      if (startCol < 0 || startCol >= 128 || endCol < 0 || endCol > 128 || startCol >= endCol) {
        return NextResponse.json({ error: 'Invalid column range.' }, { status: 400 })
      }

      const region = matrix.slice(startRow, endRow).map(row => row.slice(startCol, endCol))
      const flat = region.flat()

      return NextResponse.json({
        region: { startRow, endRow, startCol, endCol },
        dimensions: { rows: endRow - startRow, cols: endCol - startCol },
        data: region,
        stats: {
          sum: flat.reduce((a, b) => a + b, 0),
          mean: flat.reduce((a, b) => a + b, 0) / flat.length,
          min: Math.min(...flat),
          max: Math.max(...flat),
        },
      })
    }

    // Get diagonal
    if (format === 'diagonal') {
      const main = searchParams.get('type') !== 'anti'
      const diagonal: number[] = []

      for (let i = 0; i < 128; i++) {
        const col = main ? i : (127 - i)
        diagonal.push(matrix[i]![col]!)
      }

      return NextResponse.json({
        type: main ? 'main' : 'anti',
        values: diagonal,
        sum: diagonal.reduce((a, b) => a + b, 0),
        mean: diagonal.reduce((a, b) => a + b, 0) / 128,
      })
    }

    // Search for value
    if (format === 'search') {
      const value = parseInt(searchParams.get('value') || '', 10)
      if (isNaN(value) || value < -128 || value > 127) {
        return NextResponse.json({ error: 'Invalid value. Must be -128 to 127.' }, { status: 400 })
      }

      const positions: { row: number; col: number; address: number }[] = []
      for (let row = 0; row < 128; row++) {
        for (let col = 0; col < 128; col++) {
          if (matrix[row]![col]! === value) {
            positions.push({ row, col, address: row * 128 + col })
          }
        }
      }

      return NextResponse.json({
        value,
        count: positions.length,
        positions: positions.slice(0, 1000), // Limit to 1000 results
        truncated: positions.length > 1000,
      })
    }

    // Default: return stats
    const stats = calculateStats(matrix)
    return NextResponse.json({
      source: 'Anna Matrix Research API',
      timestamp: new Date().toISOString(),
      usage: 'Add ?format=info for API documentation',
      ...stats,
    })

  } catch (error) {
    console.error('Anna Matrix API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/research/anna-matrix
// Body: { query: 'rowSum', params: { row: 21 } }
export async function POST(request: NextRequest) {
  try {
    const matrix = await getMatrix()
    const body = await request.json()

    const { query, params } = body

    switch (query) {
      case 'rowSum': {
        const row = params?.row
        if (typeof row !== 'number' || row < 0 || row >= 128) {
          return NextResponse.json({ error: 'Invalid row' }, { status: 400 })
        }
        return NextResponse.json({
          query: 'rowSum',
          row,
          result: matrix[row]!.reduce((a, b) => a + b, 0),
        })
      }

      case 'colSum': {
        const col = params?.col
        if (typeof col !== 'number' || col < 0 || col >= 128) {
          return NextResponse.json({ error: 'Invalid column' }, { status: 400 })
        }
        return NextResponse.json({
          query: 'colSum',
          col,
          result: matrix.reduce((sum, row) => sum + row[col]!, 0),
        })
      }

      case 'xor': {
        const { row1, col1, row2, col2 } = params || {}
        if (
          typeof row1 !== 'number' || typeof col1 !== 'number' ||
          typeof row2 !== 'number' || typeof col2 !== 'number'
        ) {
          return NextResponse.json({ error: 'Invalid positions' }, { status: 400 })
        }

        const v1 = matrix[row1]![col1]!
        const v2 = matrix[row2]![col2]!
        const u1 = v1 < 0 ? v1 + 256 : v1
        const u2 = v2 < 0 ? v2 + 256 : v2

        return NextResponse.json({
          query: 'xor',
          positions: [{ row: row1, col: col1, value: v1 }, { row: row2, col: col2, value: v2 }],
          result: u1 ^ u2,
        })
      }

      case 'wordEncoding': {
        const word = params?.word
        if (typeof word !== 'string' || word.length === 0) {
          return NextResponse.json({ error: 'Invalid word' }, { status: 400 })
        }

        const positions: { char: string; index: number; value: number }[] = []
        let sum = 0

        for (const char of word.toUpperCase()) {
          const index = char.charCodeAt(0) - 65
          if (index >= 0 && index < 26) {
            const value = matrix[index]![index]!
            positions.push({ char, index, value })
            sum += value
          }
        }

        return NextResponse.json({
          query: 'wordEncoding',
          word,
          positions,
          sum,
        })
      }

      default:
        return NextResponse.json({
          error: 'Unknown query',
          availableQueries: ['rowSum', 'colSum', 'xor', 'wordEncoding'],
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Anna Matrix API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
