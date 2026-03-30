import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { spawn, execSync } from 'child_process'

const RESULTS_DIR = path.join(process.cwd(), 'scripts', 'aigarth', 'ane', 'results')
const ANE_DIR = path.join(process.cwd(), 'scripts', 'aigarth', 'ane')

// Track running simulation process
let simProcess: ReturnType<typeof spawn> | null = null
let simConfig: Record<string, string | number | boolean> = {}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action')

  switch (action) {
    case 'status':
      return getStatus()
    case 'stats':
      return getStats(request)
    case 'checkpoints':
      return getCheckpoints(request)
    case 'experiments':
      return getExperiments()
    case 'snapshot':
      return getSnapshot(request)
    default:
      return NextResponse.json({ error: 'Unknown action. Use: status, stats, checkpoints, experiments, snapshot' }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const action = body.action

  switch (action) {
    case 'start':
      return startSimulation(body)
    case 'stop':
      return stopSimulation()
    default:
      return NextResponse.json({ error: 'Unknown action. Use: start, stop' }, { status: 400 })
  }
}

// ============================================================================
// GET handlers
// ============================================================================

async function getStatus() {
  const running = simProcess !== null && simProcess.exitCode === null
  return NextResponse.json({
    running,
    pid: running ? simProcess?.pid : null,
    config: simConfig,
  })
}

async function getStats(request: NextRequest) {
  const file = request.nextUrl.searchParams.get('file')
  const tail = parseInt(request.nextUrl.searchParams.get('tail') || '50')

  if (!file) {
    return NextResponse.json({ error: 'file parameter required' }, { status: 400 })
  }

  // Sanitize path
  const safeName = path.basename(file)
  const filePath = path.join(RESULTS_DIR, safeName)

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const lines = content.trim().split('\n').filter(l => l.length > 0)
    const tailLines = lines.slice(-tail)
    const stats = tailLines.map(line => {
      try { return JSON.parse(line) }
      catch { return null }
    }).filter(Boolean)

    return NextResponse.json({
      file: safeName,
      total_lines: lines.length,
      returned: stats.length,
      stats,
    })
  } catch {
    return NextResponse.json({ error: `Cannot read ${safeName}` }, { status: 404 })
  }
}

async function getCheckpoints(request: NextRequest) {
  const experiment = request.nextUrl.searchParams.get('experiment') || ''
  const searchDir = experiment ? path.join(RESULTS_DIR, experiment) : RESULTS_DIR

  try {
    const files = await fs.readdir(searchDir)
    const checkpoints = files
      .filter(f => f.endsWith('.ckpt'))
      .map(f => ({
        name: f,
        path: experiment ? `${experiment}/${f}` : f,
      }))

    // Get file stats for each checkpoint
    const detailed = await Promise.all(
      checkpoints.map(async (ckpt) => {
        const stat = await fs.stat(path.join(searchDir, ckpt.name))
        return {
          ...ckpt,
          size_bytes: stat.size,
          modified: stat.mtime.toISOString(),
        }
      })
    )

    return NextResponse.json({
      directory: experiment || '.',
      checkpoints: detailed,
    })
  } catch {
    return NextResponse.json({ checkpoints: [] })
  }
}

async function getExperiments() {
  try {
    const entries = await fs.readdir(RESULTS_DIR, { withFileTypes: true })

    // Find JSONL files in root
    const rootFiles = entries
      .filter(e => !e.isDirectory() && e.name.endsWith('.jsonl'))
      .map(e => e.name)

    // Find experiment directories
    const experiments = []
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const expDir = path.join(RESULTS_DIR, entry.name)
        const expFiles = await fs.readdir(expDir)
        const jsonlFiles = expFiles.filter(f => f.endsWith('.jsonl'))
        const summaryExists = expFiles.includes('summary.txt')
        let summary = ''
        if (summaryExists) {
          summary = await fs.readFile(path.join(expDir, 'summary.txt'), 'utf-8')
        }
        experiments.push({
          name: entry.name,
          seeds: jsonlFiles.length,
          files: jsonlFiles,
          has_summary: summaryExists,
          summary: summary.slice(0, 500), // Truncate for API response
        })
      }
    }

    return NextResponse.json({
      root_files: rootFiles,
      experiments,
    })
  } catch {
    return NextResponse.json({ root_files: [], experiments: [] })
  }
}

async function getSnapshot(request: NextRequest) {
  const file = request.nextUrl.searchParams.get('file') || 'snapshot.bin'
  const safeName = path.basename(file)
  const filePath = path.join(RESULTS_DIR, safeName)

  try {
    const buffer = await fs.readFile(filePath)

    // Parse binary snapshot (see anna_neuraxon.m SnapshotHeader + SnapshotAgent)
    // Header: magic(4) + tick(4) + n_agents(4) + terrain(16384)
    const WORLD_SIZE = 128
    const HEADER_SIZE = 4 + 4 + 4 + (WORLD_SIZE * WORLD_SIZE)
    if (buffer.length < HEADER_SIZE) {
      return NextResponse.json({ error: 'Invalid snapshot file' }, { status: 400 })
    }

    const magic = buffer.readUInt32LE(0)
    if (magic !== 0x504E5347) { // "GSNP"
      return NextResponse.json({ error: 'Invalid snapshot magic bytes' }, { status: 400 })
    }

    const tick = buffer.readInt32LE(4)
    const nAgents = buffer.readInt32LE(8)
    const terrain: number[] = []
    for (let i = 0; i < WORLD_SIZE * WORLD_SIZE; i++) {
      terrain.push(buffer[12 + i]!)
    }

    // Parse agents: each is 10 bytes packed (x:2, y:2, energy:2, generation:2, behavior:1, signal:1)
    const AGENT_SIZE = 10
    const agents = []
    const agentStart = HEADER_SIZE
    for (let i = 0; i < nAgents; i++) {
      const offset = agentStart + i * AGENT_SIZE
      if (offset + AGENT_SIZE > buffer.length) break
      agents.push({
        x: buffer.readInt16LE(offset),
        y: buffer.readInt16LE(offset + 2),
        energy: buffer.readInt16LE(offset + 4),
        generation: buffer.readInt16LE(offset + 6),
        behavior: buffer.readInt8(offset + 8),
        signal: buffer.readUInt8(offset + 9),
      })
    }

    // Parse energy field (128x128 uint8, after agents)
    const energyStart = agentStart + nAgents * AGENT_SIZE
    const energy_field: number[] = []
    if (energyStart + WORLD_SIZE * WORLD_SIZE <= buffer.length) {
      for (let i = 0; i < WORLD_SIZE * WORLD_SIZE; i++) {
        energy_field.push(buffer[energyStart + i]!)
      }
    }

    return NextResponse.json({
      tick,
      n_agents: nAgents,
      world_size: WORLD_SIZE,
      terrain,
      agents,
      energy_field,
    })
  } catch {
    return NextResponse.json({ error: `Cannot read snapshot: ${safeName}` }, { status: 404 })
  }
}

// ============================================================================
// POST handlers
// ============================================================================

async function startSimulation(body: Record<string, unknown>) {
  if (simProcess && simProcess.exitCode === null) {
    return NextResponse.json({ error: 'Simulation already running' }, { status: 409 })
  }

  const seed = Number(body.seed || 42)
  const ticks = Number(body.ticks || 100000)
  const statsInterval = Number(body.stats_interval || 500)
  const signals = Boolean(body.signals)
  const seasons = Boolean(body.seasons)
  const catastrophes = Boolean(body.catastrophes)
  const snapshotInterval = Number(body.snapshot_interval || 1000)

  // Build args
  const args = [
    '--seed', String(seed),
    '--ticks', String(ticks),
    '--stats', String(statsInterval),
    '--deep-stats-interval', String(statsInterval * 10),
    '--stats-file', path.join(RESULTS_DIR, `live_run.jsonl`),
    '--snapshot-interval', String(snapshotInterval),
    '--snapshot-file', path.join(RESULTS_DIR, `live_snapshot.bin`),
    '--checkpoint-interval', String(Math.max(ticks / 10, 10000)),
    '--output', path.join(RESULTS_DIR, `live_run.json`),
    '--headless',
  ]
  if (signals) args.push('--signals')
  if (seasons) args.push('--seasons')
  if (catastrophes) args.push('--catastrophes')

  // Clear previous live run file
  try { await fs.writeFile(path.join(RESULTS_DIR, 'live_run.jsonl'), '') } catch {}

  const binary = path.join(ANE_DIR, 'anna_neuraxon')
  simProcess = spawn(binary, args, { cwd: ANE_DIR, stdio: 'pipe' })
  simConfig = { seed, ticks, statsInterval, signals, seasons, catastrophes }

  simProcess.on('exit', () => {
    simProcess = null
  })

  // Collect stderr for progress
  simProcess.stderr?.on('data', (data: Buffer) => {
    process.stderr.write(data) // Forward to server logs
  })

  return NextResponse.json({
    started: true,
    pid: simProcess.pid,
    config: simConfig,
    stats_file: 'live_run.jsonl',
    snapshot_file: 'live_snapshot.bin',
  })
}

async function stopSimulation() {
  if (!simProcess || simProcess.exitCode !== null) {
    return NextResponse.json({ error: 'No simulation running' }, { status: 404 })
  }

  simProcess.kill('SIGTERM')
  return NextResponse.json({ stopped: true })
}
