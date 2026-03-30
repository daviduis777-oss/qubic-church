'use client'

import { useState, useMemo } from 'react'
import {
  Code2,
  BarChart3,
  Sparkles,
  Download,
  BookOpen,
  Play,
  Loader2,
  Copy,
  Check,
  Terminal,
  FileJson,
  Table,
  Binary,
  FileCode,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { MatrixResearchAPI, MathUtils, type MatrixStats } from '@/lib/research/matrix-api'
import { executeSandboxedCode, CODE_SNIPPETS, type SandboxResult } from '@/lib/research/sandbox'
import dynamic from 'next/dynamic'

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface ResearchWorkspaceProps {
  matrix: MatrixResearchAPI
  stats: MatrixStats
  selectedCell: { row: number; col: number } | null
  onCellSelect: (row: number, col: number) => void
}

// =============================================================================
// CODE TAB
// =============================================================================

function CodeTab({
  matrix,
  selectedCell,
}: {
  matrix: MatrixResearchAPI
  selectedCell: { row: number; col: number } | null
}) {
  const [code, setCode] = useState(CODE_SNIPPETS[0]?.code || '')
  const [result, setResult] = useState<SandboxResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleRun = () => {
    setIsRunning(true)
    // Small delay to show loading state
    setTimeout(() => {
      const sandboxResult = executeSandboxedCode(code, matrix)
      setResult(sandboxResult)
      setIsRunning(false)
    }, 50)
  }

  const handleCopy = () => {
    if (result) {
      const text = result.logs.join('\n') + '\n\nResult: ' + JSON.stringify(result.result, null, 2)
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const loadSnippet = (snippetCode: string) => {
    setCode(snippetCode)
    setResult(null)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Snippets Bar */}
      <div className="border-b border-white/10 p-2 bg-[#050505]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[10px] text-white/40 uppercase shrink-0">Snippets:</span>
          {CODE_SNIPPETS.map((snippet, i) => (
            <button
              key={i}
              onClick={() => loadSnippet(snippet.code)}
              className="shrink-0 px-2 py-1 text-[10px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              {snippet.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language="javascript"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 8 },
          }}
        />
      </div>

      {/* Run Button */}
      <div className="flex items-center justify-between border-y border-white/10 px-3 py-2 bg-[#050505]">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRun}
            disabled={isRunning || !code.trim()}
            className="bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/30"
            size="sm"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Code
          </Button>
          {result && (
            <span className={cn(
              'text-xs',
              result.success ? 'text-[#D4AF37]/70' : 'text-red-400'
            )}>
              {result.success ? `Completed in ${result.executionTime.toFixed(1)}ms` : 'Error'}
            </span>
          )}
        </div>
        {result && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-white/60 hover:text-white"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Output */}
      <div className="h-48 bg-black border-t border-white/10 overflow-auto">
        <div className="p-3 font-mono text-xs">
          {result ? (
            <>
              {result.logs.length > 0 && (
                <div className="mb-2">
                  {result.logs.map((log, i) => (
                    <div key={i} className="text-white/80 whitespace-pre-wrap">{log}</div>
                  ))}
                </div>
              )}
              {result.success ? (
                <div className="border-t border-white/10 pt-2 mt-2">
                  <span className="text-white/40">Return: </span>
                  <span className="text-[#D4AF37]/70">
                    {typeof result.result === 'object'
                      ? JSON.stringify(result.result, null, 2)
                      : String(result.result)}
                  </span>
                </div>
              ) : (
                <div className="text-red-400">
                  Error: {result.error}
                </div>
              )}
            </>
          ) : (
            <div className="text-white/30">
              Click "Run Code" to execute your analysis.
              {selectedCell && (
                <span className="block mt-1">
                  Try: <code className="text-[#D4AF37]/60">matrix.getCell({selectedCell.row}, {selectedCell.col})</code>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// ANALYSIS TAB
// =============================================================================

function AnalysisTab({
  matrix,
  stats,
}: {
  matrix: MatrixResearchAPI
  stats: MatrixStats
}) {
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<unknown>(null)

  const analyses = [
    {
      id: 'stats',
      name: 'Statistics',
      icon: <BarChart3 className="h-4 w-4" />,
      run: () => stats,
    },
    {
      id: 'rowSums',
      name: 'All Row Sums',
      icon: <Table className="h-4 w-4" />,
      run: () => matrix.getAllRowSums(),
    },
    {
      id: 'colSums',
      name: 'All Column Sums',
      icon: <Table className="h-4 w-4" />,
      run: () => matrix.getAllColSums(),
    },
    {
      id: 'symmetry',
      name: 'Rotational Antisymmetry',
      icon: <Binary className="h-4 w-4" />,
      run: () => matrix.findSymmetry('rotational'),
    },
    {
      id: 'colMirror',
      name: 'Column Mirror Symmetry',
      icon: <Binary className="h-4 w-4" />,
      run: () => matrix.checkColumnMirrorSymmetry(),
    },
    {
      id: 'zeros',
      name: 'Zero Positions',
      icon: <Sparkles className="h-4 w-4" />,
      run: () => matrix.findValue(0),
    },
    {
      id: 'diagonal',
      name: 'Main Diagonal',
      icon: <Code2 className="h-4 w-4" />,
      run: () => matrix.getDiagonal(true),
    },
    {
      id: 'theWord',
      name: '"THE" Word Encoding',
      icon: <FileText className="h-4 w-4" />,
      run: () => matrix.wordEncodingSum('THE'),
    },
  ]

  const runAnalysis = (id: string) => {
    const analysis = analyses.find(a => a.id === id)
    if (analysis) {
      setActiveAnalysis(id)
      setAnalysisResult(analysis.run())
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Analysis Buttons */}
      <div className="grid grid-cols-2 gap-2 p-3 border-b border-white/10">
        {analyses.map((analysis) => (
          <button
            key={analysis.id}
            onClick={() => runAnalysis(analysis.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
              activeAnalysis === analysis.id
                ? 'bg-[#D4AF37]/15 text-[#D4AF37]/60 border border-[#D4AF37]/25'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-transparent'
            )}
          >
            {analysis.icon}
            {analysis.name}
          </button>
        ))}
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {analysisResult ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white">
                  {analyses.find(a => a.id === activeAnalysis)?.name}
                </h4>
                <Badge variant="secondary" className="bg-white/10 text-white/60">
                  {Array.isArray(analysisResult) ? `${analysisResult.length} items` : 'Object'}
                </Badge>
              </div>

              <pre className="bg-black/50 p-3 text-xs font-mono text-[#D4AF37]/70 overflow-auto max-h-96">
                {JSON.stringify(analysisResult, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-center py-12 text-white/40">
              Select an analysis to run
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// =============================================================================
// DISCOVERIES TAB
// =============================================================================

const DISCOVERIES = [
  {
    id: 'the-33',
    category: 'Word Encoding',
    name: '"THE" = 33',
    description: 'Diagonal positions T(19), H(7), E(4) sum to 33 - exactly the days between Blood Moon and Easter 2026.',
    verification: 'matrix.wordEncodingSum("THE")',
    importance: 'high',
  },
  {
    id: 'rotational',
    category: 'Symmetry',
    name: 'Rotational Antisymmetry',
    description: 'Matrix - Rot180(Matrix) = 0. The matrix is perfectly antisymmetric under 180° rotation.',
    verification: 'matrix.findSymmetry("rotational")',
    importance: 'high',
  },
  {
    id: 'col-mirror',
    category: 'Symmetry',
    name: 'Column Mirror Symmetry',
    description: 'For 60 of 64 column pairs: Col[i] + Col[127-i] = -128 for all rows.',
    verification: 'matrix.checkColumnMirrorSymmetry()',
    importance: 'high',
  },
  {
    id: 'xor-corners',
    category: 'Mathematical',
    name: 'XOR(4 Corners) = 0',
    description: 'The XOR of all four corner values equals zero.',
    verification: 'Crypto.xor(corners...)',
    importance: 'medium',
  },
  {
    id: 'zero-26',
    category: 'Special Values',
    name: '26 Zeros',
    description: 'Zero appears exactly 26 times in the matrix - the number of letters in the alphabet.',
    verification: 'matrix.findValue(0).length',
    importance: 'medium',
  },
  {
    id: 'value-90',
    category: 'Special Values',
    name: '90 appears 256 times',
    description: 'The value 90 (ASCII "Z") appears exactly 256 times - a power of 2.',
    verification: 'matrix.findValue(90).length',
    importance: 'medium',
  },
  {
    id: 'row-21',
    category: 'Bitcoin',
    name: 'Row 21 - Bitcoin Connection',
    description: 'Row 21 (21 million BTC cap) has special properties and sum = 4.',
    verification: 'matrix.analyzeRow(21)',
    importance: 'high',
  },
  {
    id: 'zzz-magic',
    category: 'Easter Egg',
    name: 'ZZZ Magic Square',
    description: '3x3 region at [36,36] has magic properties (Z=25, 36=6²).',
    verification: 'matrix.getRegion(36, 39, 36, 39)',
    importance: 'medium',
  },
]

function DiscoveriesTab({
  matrix,
  onCellSelect,
}: {
  matrix: MatrixResearchAPI
  onCellSelect: (row: number, col: number) => void
}) {
  const [selectedDiscovery, setSelectedDiscovery] = useState<string | null>(null)

  const groupedDiscoveries = useMemo(() => {
    const groups: Record<string, typeof DISCOVERIES> = {}
    for (const d of DISCOVERIES) {
      if (!groups[d.category]) groups[d.category] = []
      groups[d.category]!.push(d)
    }
    return groups
  }, [])

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        <div className="text-xs text-white/40">
          Documented discoveries found through analysis of the Anna Matrix.
        </div>

        {Object.entries(groupedDiscoveries).map(([category, discoveries]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              {category}
            </h4>
            {discoveries.map((discovery) => (
              <div
                key={discovery.id}
                className={cn(
                  'p-3 border transition-colors cursor-pointer',
                  selectedDiscovery === discovery.id
                    ? 'bg-white/10 border-white/30'
                    : 'bg-white/5 border-white/10 hover:bg-white/8'
                )}
                onClick={() => setSelectedDiscovery(
                  selectedDiscovery === discovery.id ? null : discovery.id
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{discovery.name}</span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] px-1.5',
                          discovery.importance === 'high'
                            ? 'bg-[#D4AF37]/20 text-[#D4AF37]/70'
                            : 'bg-white/10 text-white/60'
                        )}
                      >
                        {discovery.importance}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/60 mt-1">{discovery.description}</p>
                  </div>
                </div>

                {selectedDiscovery === discovery.id && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-[10px] text-white/40 uppercase mb-1">Verify with</div>
                    <code className="text-xs text-[#D4AF37]/60 font-mono block bg-black/30 px-2 py-1">
                      {discovery.verification}
                    </code>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

// =============================================================================
// EXPORT TAB
// =============================================================================

function ExportTab({
  matrix,
  stats,
}: {
  matrix: MatrixResearchAPI
  stats: MatrixStats
}) {
  const [exporting, setExporting] = useState<string | null>(null)

  const exportFormats = [
    {
      id: 'json',
      name: 'JSON',
      icon: <FileJson className="h-4 w-4" />,
      description: 'Raw matrix data as JSON array',
      export: () => {
        const data = {
          source: 'Anna Matrix Research Platform',
          timestamp: new Date().toISOString(),
          dimensions: { rows: 128, cols: 128 },
          stats,
          matrix: matrix.getRawMatrix(),
        }
        downloadFile(JSON.stringify(data, null, 2), 'anna-matrix.json', 'application/json')
      },
    },
    {
      id: 'csv',
      name: 'CSV',
      icon: <Table className="h-4 w-4" />,
      description: 'Spreadsheet-compatible format',
      export: () => {
        const raw = matrix.getRawMatrix()
        const csv = raw.map(row => row.join(',')).join('\n')
        downloadFile(csv, 'anna-matrix.csv', 'text/csv')
      },
    },
    {
      id: 'python',
      name: 'Python (NumPy)',
      icon: <FileCode className="h-4 w-4" />,
      description: 'NumPy array for Python analysis',
      export: () => {
        const raw = matrix.getRawMatrix()
        const code = `import numpy as np

# Anna Matrix - 128x128 signed bytes
anna_matrix = np.array([
${raw.map(row => `    [${row.join(', ')}]`).join(',\n')}
], dtype=np.int8)

# Quick stats
print(f"Shape: {anna_matrix.shape}")
print(f"Min: {anna_matrix.min()}, Max: {anna_matrix.max()}")
print(f"Mean: {anna_matrix.mean():.2f}")
`
        downloadFile(code, 'anna_matrix.py', 'text/x-python')
      },
    },
    {
      id: 'typescript',
      name: 'TypeScript',
      icon: <FileCode className="h-4 w-4" />,
      description: 'Typed array for TypeScript projects',
      export: () => {
        const raw = matrix.getRawMatrix()
        const code = `// Anna Matrix - 128x128 signed bytes
export const ANNA_MATRIX: number[][] = [
${raw.map(row => `  [${row.join(', ')}]`).join(',\n')}
];

export const MATRIX_SIZE = 128;
export const MATRIX_STATS = ${JSON.stringify(stats, null, 2)};
`
        downloadFile(code, 'anna-matrix.ts', 'text/typescript')
      },
    },
    {
      id: 'stats',
      name: 'Statistics Report',
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'Detailed statistical analysis',
      export: () => {
        const report = `
ANNA MATRIX STATISTICAL REPORT
Generated: ${new Date().toISOString()}
===============================

BASIC STATISTICS
----------------
Dimensions: 128 × 128 (16,384 cells)
Value Range: ${stats.min} to ${stats.max}
Mean: ${stats.mean.toFixed(4)}
Median: ${stats.median}
Standard Deviation: ${stats.stdDev.toFixed(4)}
Variance: ${stats.variance.toFixed(4)}
Total Sum: ${stats.sum}

DISTRIBUTION
------------
Negative Values: ${stats.negativeCount} (${((stats.negativeCount / stats.totalCells) * 100).toFixed(1)}%)
Zero Values: ${stats.zeroCount} (${((stats.zeroCount / stats.totalCells) * 100).toFixed(1)}%)
Positive Values: ${stats.positiveCount} (${((stats.positiveCount / stats.totalCells) * 100).toFixed(1)}%)
Unique Values: ${stats.uniqueValues}

MOST COMMON VALUES
------------------
${stats.mostCommon.map((v, i) => `${i + 1}. Value ${v.value}: ${v.count} occurrences`).join('\n')}

ROW SUMS
--------
${matrix.getAllRowSums().map(r => `Row ${r.row.toString().padStart(3)}: ${r.sum.toString().padStart(6)}`).join('\n')}

COLUMN SUMS
-----------
${matrix.getAllColSums().map(c => `Col ${c.col.toString().padStart(3)}: ${c.sum.toString().padStart(6)}`).join('\n')}
`
        downloadFile(report, 'anna-matrix-report.txt', 'text/plain')
      },
    },
  ]

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = async (id: string, exportFn: () => void) => {
    setExporting(id)
    setTimeout(() => {
      exportFn()
      setExporting(null)
    }, 100)
  }

  return (
    <div className="p-3 space-y-3">
      <div className="text-xs text-white/40">
        Export the Anna Matrix in various formats for your research.
      </div>

      {exportFormats.map((format) => (
        <button
          key={format.id}
          onClick={() => handleExport(format.id, format.export)}
          disabled={exporting === format.id}
          className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/[0.04] hover:border-white/[0.06] transition-colors text-left"
        >
          <div className="w-10 h-10 bg-white/10 flex items-center justify-center text-white/70">
            {exporting === format.id ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              format.icon
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-white">{format.name}</div>
            <div className="text-xs text-white/50">{format.description}</div>
          </div>
          <Download className="h-4 w-4 text-white/40" />
        </button>
      ))}
    </div>
  )
}

// =============================================================================
// MAIN WORKSPACE COMPONENT
// =============================================================================

export function ResearchWorkspace({
  matrix,
  stats,
  selectedCell,
  onCellSelect,
}: ResearchWorkspaceProps) {
  return (
    <Tabs defaultValue="code" className="flex h-full flex-col">
      <TabsList className="w-full justify-start rounded-none border-b border-white/10 bg-[#050505] p-0 h-auto">
        <TabsTrigger
          value="code"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D4AF37]/50 data-[state=active]:bg-transparent px-4 py-2"
        >
          <Code2 className="h-4 w-4 mr-2" />
          Code
        </TabsTrigger>
        <TabsTrigger
          value="analysis"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D4AF37]/50 data-[state=active]:bg-transparent px-4 py-2"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Analysis
        </TabsTrigger>
        <TabsTrigger
          value="discoveries"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D4AF37]/50 data-[state=active]:bg-transparent px-4 py-2"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Discoveries
        </TabsTrigger>
        <TabsTrigger
          value="export"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D4AF37]/50 data-[state=active]:bg-transparent px-4 py-2"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </TabsTrigger>
      </TabsList>

      <TabsContent value="code" className="flex-1 mt-0 data-[state=inactive]:hidden">
        <CodeTab matrix={matrix} selectedCell={selectedCell} />
      </TabsContent>

      <TabsContent value="analysis" className="flex-1 mt-0 data-[state=inactive]:hidden">
        <AnalysisTab matrix={matrix} stats={stats} />
      </TabsContent>

      <TabsContent value="discoveries" className="flex-1 mt-0 data-[state=inactive]:hidden">
        <DiscoveriesTab matrix={matrix} onCellSelect={onCellSelect} />
      </TabsContent>

      <TabsContent value="export" className="flex-1 mt-0 data-[state=inactive]:hidden">
        <ExportTab matrix={matrix} stats={stats} />
      </TabsContent>
    </Tabs>
  )
}

export default ResearchWorkspace
