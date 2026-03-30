import type { SimulationConfig, SimulationStats, MatrixMode, SamplingStrategy } from '../types'

interface ExportMetadata {
  timestamp: string
  version: string
  mode: MatrixMode
  samplingStrategy: SamplingStrategy
  config: SimulationConfig
  seed: number
  totalTicks: number
  totalParticles: number
}

/** Export metric history as CSV */
export function exportMetricsCSV(
  history: SimulationStats[],
  metadata: ExportMetadata,
): string {
  const lines: string[] = []

  // Metadata header
  lines.push(`# Emergence Lab Export`)
  lines.push(`# Timestamp: ${metadata.timestamp}`)
  lines.push(`# Mode: ${metadata.mode}`)
  lines.push(`# Sampling: ${metadata.samplingStrategy}`)
  lines.push(`# Seed: ${metadata.seed}`)
  lines.push(`# Types: ${metadata.config.numTypes}`)
  lines.push(`# Particles/Type: ${metadata.config.particlesPerType}`)
  lines.push(`# Radius: ${metadata.config.radius}`)
  lines.push(`# Viscosity: ${metadata.config.viscosity}`)
  lines.push(`# Boundary: ${metadata.config.boundaryMode}`)
  lines.push(`# Total Ticks: ${metadata.totalTicks}`)
  lines.push(`# Total Particles: ${metadata.totalParticles}`)
  lines.push(`#`)

  // Header row
  lines.push('tick,energy,segregation,spatialEntropy,moransI,msd,clusterCount,largestCluster')

  // Data rows
  for (const s of history) {
    lines.push([
      s.tick,
      s.energy.toFixed(6),
      s.segregation.toFixed(6),
      s.spatialEntropy.toFixed(6),
      s.moransI.toFixed(6),
      s.msd.toFixed(2),
      s.clusterCount ?? '',
      s.largestCluster ?? '',
    ].join(','))
  }

  return lines.join('\n')
}

/** Export full state snapshot as JSON */
export function exportStateSnapshot(
  metadata: ExportMetadata,
  rules: number[][] | null,
  history: SimulationStats[],
): string {
  return JSON.stringify({
    ...metadata,
    rules,
    metrics: history,
  }, null, 2)
}

/** Trigger file download */
export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
