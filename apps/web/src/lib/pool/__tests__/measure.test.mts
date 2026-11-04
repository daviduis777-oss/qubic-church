// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/measure.test.mts
import assert from 'node:assert/strict'
import { test } from 'node:test'

const {
  extractMetrics,
  normalizeCpu,
  normalizeGpu,
  buildSample,
  partKey,
  rigKey,
  FIELD_SAMPLES,
  costPerSolution,
  modeFrom,
} = await import('../measure.ts')
const {
  aggregate,
  compareRun,
  judge,
  measuredBlock,
  driftLines,
  topRows,
  quantile,
  tierOf,
} = await import('../aggregate.ts')
const { parsePoolStats, hardwareFromWorker, poolStatsAdapter } = await import(
  '../stats-adapter.ts'
)
const { createStore, memoryBackend, dedupeHash, parseRow, listKey } =
  await import('../store.ts')
const { pick } = await import('../hardware.ts')
const { diagnose } = await import('../doctor.ts')
const { FACTS, FIELD_RUNS } = await import('../knowledge.ts')
const { mariaSystemPrompt, mariaSystemStatic } = await import('../prompt.ts')
const { MEASURE } = await import('../config.ts')
const { epochAt, epochStart } = await import('../epoch.ts')

type S = import('../measure.ts').Sample

const ADDR = 'A'.repeat(56) + 'BCDE'
const SEED = 'abcdefghijklmnopqrstuvwxyz'.repeat(3).slice(0, 55)
// mid epoch 238 (4 Nov 2026 12:00 UTC to 11 Nov)
const NOW = new Date(Date.UTC(2026, 10, 6, 15))
const CUR = epochAt(NOW).epoch

/* ---------------- logs ---------------- */

const QLI_4090 = `2026-11-06 08:00:02.114 INFO  qli-Client 3.2.1 starting
2026-11-06 08:00:02.120 INFO  worker: QC.4090-rig-a
2026-11-06 08:00:02.121 INFO  backend: GPU, threads: 48
2026-11-06 08:00:03.001 INFO  GPU 0: NVIDIA GeForce RTX 4090 (24564 MiB)
2026-11-06 08:00:03.002 INFO  GPU 1: NVIDIA GeForce RTX 4090 (24564 MiB)
2026-11-06 08:00:03.003 INFO  GPU 2: NVIDIA GeForce RTX 4090 (24564 MiB)
2026-11-06 08:00:03.004 INFO  GPU 3: NVIDIA GeForce RTX 4090 (24564 MiB)
2026-11-06 08:30:00.000 INFO  E:238 | SOL: 300/300 | [CUDA] 196 it/s | 190 avg it/s
2026-11-06 10:00:00.000 INFO  E:238 | SOL: 1000/1001 (R:1) | [CUDA] 201 it/s | 197 avg it/s
2026-11-06 11:00:00.000 INFO  E:238 | SOL: 1600/1603 (R:3) | [CUDA] 199 it/s | 198 avg it/s`

const JETSKI =
  'starting\nE:229 | SHARES: 0/0 | [CUDA] 49 it/s | [AVX2] 5 it/s\n'

const RQINER_CPU = `|   INFO   | 12:00:00 | Starting miner, threads: 32
|   INFO   | 12:00:05 | model name\t: AMD Ryzen 9 7950X 16-Core Processor
|   INFO   | 13:00:00 | Iterations: 31 It/s, Average: 30.5 It/s, Solutions found: 4
|   INFO   | 14:00:00 | Iterations: 30 It/s, Average: 30.2 It/s, Solutions found: 9`

const SMI_5080 = `+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 560.35.03              Driver Version: 560.35.03      CUDA Version: 12.6     |
|-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|=========================================+========================+======================|
|   0  NVIDIA GeForce RTX 5080        On  |   00000000:01:00.0 Off |                  N/A |
| 30%   61C    P2            298W /  300W |    9876MiB /  16303MiB |    100%      Default |
|   1  NVIDIA GeForce RTX 5080        On  |   00000000:41:00.0 Off |                  N/A |
| 32%   88C    P2            299W /  300W |    9876MiB /  16303MiB |    100%      Default |
+-----------------------------------------+------------------------+----------------------+
Model name:                           AMD EPYC 7B13 64-Core Processor
CPU(s):                               16
23:40:00 [CUDA] 702 it/s
23:50:00 SOL: 10
00:20:00 SOL: 40`

test('extract: qli log with timestamps gives epoch, it/s, solutions over a window, GPUs and worker', () => {
  const x = extractMetrics(QLI_4090)
  assert.equal(x.epoch, 238)
  assert.equal(x.gpuIts, 199)
  assert.equal(x.avgIts, 198)
  assert.equal(x.solutions, 1600)
  assert.equal(x.windowMin, 180) // from the start line, the counter began at 0
  assert.equal(x.solPerHour, 533.3)
  assert.equal(x.uptimeMin, 180)
  assert.equal(x.rejected, 3)
  assert.equal(x.gpu, 'RTX 4090')
  assert.equal(x.gpuCount, 4)
  assert.equal(x.threads, 48)
  assert.equal(x.backend, 'GPU')
  assert.equal(x.worker, 'QC.4090-rig-a')
  assert.equal(modeFrom(x), 'gpu')
  assert.ok(x.found)
})

test('extract: the doctor test format (jetski style), no timestamps', () => {
  const x = extractMetrics(JETSKI)
  assert.equal(x.epoch, 229)
  assert.deepEqual(x.its, { CUDA: 49, AVX2: 5 })
  assert.equal(x.gpuIts, 49)
  assert.equal(x.cpuIts, 5)
  assert.equal(x.solPerHour, undefined) // no clock, no rate
  assert.equal(modeFrom(x), 'gpu+cpu')
  assert.ok(x.found)
  // the doctor still calls it mining
  assert.equal(diagnose(JETSKI).findings[0]!.id, 'mining')
})

test('extract: rqiner-style CPU log, bare clock times, Average it/s, solutions found', () => {
  const x = extractMetrics(RQINER_CPU)
  assert.equal(x.its.total, 30)
  assert.equal(x.avgIts, 30.2)
  assert.equal(x.solutions, 9)
  assert.equal(x.windowMin, 120)
  assert.equal(x.solPerHour, 4.5)
  assert.equal(x.cpu, 'Ryzen 9 7950X')
  assert.equal(x.threads, 32)
  assert.equal(modeFrom(x), 'cpu')
})

test('extract: nvidia-smi table, lscpu, midnight rollover, power cap and temperature', () => {
  const x = extractMetrics(SMI_5080)
  assert.equal(x.gpu, 'RTX 5080')
  assert.equal(x.gpuCount, 2)
  assert.equal(x.powerLimitW, 300)
  assert.equal(x.maxTempC, 88)
  assert.equal(x.cpu, 'EPYC 7B13')
  assert.equal(x.threads, 16)
  assert.equal(x.gpuIts, 702)
  assert.equal(x.solutions, 30)
  assert.equal(x.windowMin, 30) // 23:50 to 00:20 across midnight
  assert.equal(x.solPerHour, 60)
})

test('extract: a counter reset after a restart is not a negative count', () => {
  const x = extractMetrics(
    '10:00:00 SOL: 50\n11:00:00 SOL: 110\n11:05:00 miner starting\n12:00:00 SOL: 40'
  )
  assert.equal(x.solutions, 60 + 40)
  assert.equal(x.windowMin, 120)
})

test('extract: nothing useful in a plain error log', () => {
  const x = extractMetrics(
    'error: connect ECONNREFUSED 51.89.12.7:443\nretrying in 10s'
  )
  assert.equal(x.found, false)
  assert.equal(extractMetrics('').found, false)
})

test('extract: a wallet in a worker line is never picked up', () => {
  assert.equal(
    extractMetrics(`worker: ${ADDR}\n[CUDA] 40 it/s`).worker,
    undefined
  )
})

/* ---------------- normalization ---------------- */

test('normalize CPU and GPU names', () => {
  assert.equal(
    normalizeCpu('Intel(R) Xeon(R) CPU E5-2696 v3 @ 2.30GHz'),
    'Xeon E5-2696 v3'
  )
  assert.equal(
    normalizeCpu('AMD Ryzen 9 7950X 16-Core Processor'),
    'Ryzen 9 7950X'
  )
  assert.equal(normalizeCpu('ryzen 9 9950x3d'), 'Ryzen 9 9950X3D')
  assert.equal(normalizeCpu('AMD EPYC 9654 96-Core Processor'), 'EPYC 9654')
  assert.equal(normalizeCpu('EPYC'), 'EPYC')
  assert.equal(
    normalizeCpu('AMD Ryzen Threadripper PRO 7995WX'),
    'Threadripper 7995WX'
  )
  assert.equal(normalizeCpu('Apple M3 Pro'), 'Apple M3 Pro')
  assert.equal(
    normalizeCpu('13th Gen Intel(R) Core(TM) i7-13700K'),
    'Core i7-13700K'
  )
  assert.equal(normalizeCpu('Intel Xeon Platinum 8480+'), 'Xeon Platinum 8480+')
  assert.equal(normalizeGpu('NVIDIA GeForce RTX 4090'), 'RTX 4090')
  assert.equal(normalizeGpu('rtx5070ti'), 'RTX 5070 Ti')
  assert.equal(normalizeGpu('GeForce RTX 4080 SUPER'), 'RTX 4080 Super')
  assert.equal(normalizeGpu('NVIDIA H100 80GB HBM3'), 'H100')
  assert.equal(normalizeGpu('none'), null)
})

test('keys: per card for GPU-only, per rig for CPU-only and GPU+CPU', () => {
  assert.deepEqual(partKey({ cpu: 'EPYC', gpu: 'RTX 5080', mode: 'gpu' }), {
    key: 'gpu|RTX 5080',
    label: 'RTX 5080',
    unit: 'card',
  })
  assert.equal(
    partKey({ cpu: 'Ryzen 9 7950X', gpu: null, mode: 'cpu' }).unit,
    'rig'
  )
  assert.equal(
    partKey({ cpu: 'Ryzen 9 9950X', gpu: 'RTX 5070 Ti', mode: 'gpu+cpu' }).key,
    'mix|RTX 5070 Ti'
  )
  assert.equal(
    rigKey({
      cpu: 'Xeon E5-2696 v3',
      gpu: 'RTX 4090',
      gpuCount: 4,
      mode: 'gpu',
    }),
    '4x RTX 4090 | Xeon E5-2696 v3 | gpu'
  )
})

/* ---------------- field seeds ---------------- */

test('field seeds match the measured facts in knowledge.ts', () => {
  assert.equal(FIELD_SAMPLES.length, FIELD_RUNS.length)
  const r4090 = FIELD_SAMPLES.find(s => s.hw.gpu === 'RTX 4090')!
  const r5080 = FIELD_SAMPLES.find(s => s.hw.gpu === 'RTX 5080')!
  assert.deepEqual(
    [
      r4090.hw.gpuCount,
      r4090.result.solPerHour,
      r4090.result.epoch,
      r4090.hw.cpu,
      r4090.hw.mode,
    ],
    [4, 2440, 233, 'Xeon E5-2696 v3', 'gpu']
  )
  assert.deepEqual(
    [
      r5080.hw.gpuCount,
      r5080.result.solPerHour,
      r5080.result.epoch,
      r5080.hw.cpu,
    ],
    [7, 2460, 234, 'EPYC']
  )
  assert.ok(
    FACTS.some(f => /2,440 sol\/h/.test(f.text) && /epoch 233/.test(f.text))
  )
  assert.ok(
    FACTS.some(f => /2,460 sol\/h/.test(f.text) && /10 Oct 2026/.test(f.text))
  )
  assert.equal(epochAt(new Date(r5080.at)).epoch, 234) // 10 Oct 2026 falls in epoch 234
  assert.ok(FIELD_SAMPLES.every(s => s.source === 'field'))
})

/* ---------------- aggregation ---------------- */

let seq = 0
const mk = (o: {
  gpu?: string | null
  cpu?: string
  n?: number
  mode?: 'gpu' | 'cpu' | 'gpu+cpu'
  sph?: number
  epoch?: number
  src?: 'pool' | 'log' | 'field'
  its?: number
  dd?: string
  at?: number
}): S => {
  const mode = o.mode ?? (o.gpu ? 'gpu' : 'cpu')
  const hw = {
    cpu: o.cpu ?? 'EPYC 9654',
    gpu: o.gpu ?? null,
    gpuCount: o.gpu ? (o.n ?? 1) : 0,
    mode,
    owner: 'rented' as const,
  }
  return {
    v: 1,
    source: o.src ?? 'pool',
    at: o.at ?? ++seq,
    key: rigKey(hw),
    hw,
    result: { epoch: o.epoch ?? CUR, solPerHour: o.sph, gpuIts: o.its },
    dedupe: o.dd ?? `d${seq}`,
  }
}

test('quantile is type 7', () => {
  assert.equal(quantile([1, 2, 3, 4], 0.5), 2.5)
  assert.equal(quantile([10, 20, 30, 40, 50], 0.25), 20)
  assert.equal(quantile([], 0.5), undefined)
})

test('aggregate: per-GPU sol/h for GPU-only multi-GPU rigs, per rig for CPU-only, median and spread', () => {
  const sum = aggregate(
    [
      mk({ gpu: 'RTX 4090', n: 4, sph: 2400, its: 800 }),
      mk({ gpu: 'RTX 4090', n: 2, sph: 1300, its: 400 }),
      mk({ gpu: 'RTX 4090', n: 1, sph: 600 }),
      mk({ gpu: 'RTX 4090', n: 8, sph: 4000 }),
      mk({ cpu: 'Ryzen 9 7950X', sph: 30 }),
      mk({ cpu: 'Ryzen 9 7950X', sph: 40 }),
    ],
    CUR
  )
  const g = sum.rows.find(r => r.key === 'gpu|RTX 4090')!
  assert.equal(g.unit, 'card')
  assert.equal(g.latest.n, 4)
  assert.equal(g.latest.median, 600) // 600, 650, 600, 500 per card
  assert.equal(g.latest.p25, 575)
  assert.equal(g.latest.p75, 612.5)
  assert.equal(g.latest.medianRig, 1850)
  assert.equal(g.latest.medianGpuIts, 600)
  assert.deepEqual(g.tags, ['few data'])
  const c = sum.rows.find(r => r.key === 'cpu|Ryzen 9 7950X')!
  assert.equal(c.unit, 'rig')
  assert.equal(c.latest.median, 35)
})

test('aggregate: the same rig saved twice in a day counts once, the newer one wins', () => {
  const sum = aggregate(
    [
      mk({ gpu: 'RTX 3090', sph: 300, dd: 'same', at: 1 }),
      mk({ gpu: 'RTX 3090', sph: 500, dd: 'same', at: 2 }),
    ],
    CUR
  )
  assert.equal(sum.rows[0]!.latest.n, 1)
  assert.equal(sum.rows[0]!.latest.median, 500)
})

test('aggregate: labels for few data, self-reported, older, and our own runs', () => {
  const sum = aggregate(
    [
      ...FIELD_SAMPLES,
      ...Array.from({ length: 6 }, () =>
        mk({ gpu: 'RTX 3080', sph: 250, src: 'log' })
      ),
    ],
    CUR
  )
  const f = sum.rows.find(r => r.key === 'gpu|RTX 4090')!
  assert.deepEqual(f.tags, ['our own run', 'few data', 'older'])
  assert.equal(f.older, true)
  const l = sum.rows.find(r => r.key === 'gpu|RTX 3080')!
  assert.deepEqual(l.tags, ['self-reported'])
  assert.equal(l.older, false)
})

test('drift: a median that moves more than 30% against the previous epoch is flagged', () => {
  const rows = [
    ...[600, 620, 610].map(v =>
      mk({ gpu: 'RTX 4090', sph: v, epoch: CUR - 1 })
    ),
    ...[880, 900, 910].map(v => mk({ gpu: 'RTX 4090', sph: v, epoch: CUR })),
    ...[300, 310].map(v => mk({ gpu: 'RTX 3090', sph: v, epoch: CUR - 1 })),
    ...[320, 330].map(v => mk({ gpu: 'RTX 3090', sph: v, epoch: CUR })),
  ]
  const sum = aggregate(rows, CUR)
  const d = sum.rows.find(r => r.key === 'gpu|RTX 4090')!.drift
  assert.deepEqual(d, { from: CUR - 1, to: CUR, pct: 48 })
  assert.equal(sum.rows.find(r => r.key === 'gpu|RTX 3090')!.drift, undefined)
  const lines = driftLines(sum)
  assert.equal(lines.length, 1)
  assert.match(
    lines[0]!,
    /RTX 4090 per card moved \+48% from epoch 237 to 238.*the algorithm may have changed/
  )
  assert.match(measuredBlock(sum), /ALGORITHM WATCH/)
  // two epochs apart is not "the previous epoch"
  const gap = aggregate(
    [
      mk({ gpu: 'RTX 4090', sph: 300, epoch: CUR - 2 }),
      mk({ gpu: 'RTX 4090', sph: 900, epoch: CUR }),
    ],
    CUR
  )
  assert.equal(gap.rows[0]!.drift, undefined)
})

/* ---------------- guide against measurements ---------------- */

// Five other cards of known speed, so ranking has enough rows.
const PEERS = (src: 'pool' | 'log' = 'pool', epoch = CUR) =>
  [
    ['RTX 5090', 700],
    ['RTX 4090', 600],
    ['RTX 5080', 350],
    ['RTX 3090', 300],
    ['RTX 3080', 250],
  ].map(([gpu, sph]) =>
    mk({ gpu: gpu as string, sph: sph as number, src, epoch })
  )

test('contradiction: a Works card measuring top quarter is shown next to the verdict, not flipped', () => {
  const sum = aggregate(
    [...PEERS(), mk({ gpu: 'RTX 4060', sph: 900, src: 'log' })],
    CUR
  )
  const card = pick(
    { mode: 'own', cpu: 'Ryzen 9 7950X', gpu: 'RTX 4060' },
    sum
  ).cards.find(c => /4060/.test(c.title))!
  assert.equal(card.verdict, 'Works')
  assert.match(
    card.measured!.line,
    /^Measured: median 900 sol\/h per card \(1 rig, epoch 238\)$/
  )
  assert.deepEqual(card.measured!.tags, ['few data', 'self-reported'])
  assert.match(
    card.measured!.disagree!,
    /^Our measurements disagree with the guide: this measures in the top quarter of 6/
  )
  assert.equal(card.measured!.flippedFrom, undefined)
})

test('contradiction: a Skip CPU measuring top quarter is said plainly', () => {
  const cpus = [
    'Ryzen 9 7950X',
    'Ryzen 7 7700',
    'EPYC 9654',
    'Threadripper 7980X',
  ].map((cpu, i) => mk({ cpu, sph: 20 + i * 5 }))
  const sum = aggregate(
    [...cpus, mk({ cpu: 'Xeon E5-2680 v4', sph: 80, src: 'log' })],
    CUR
  )
  const card = pick({ mode: 'own', cpu: 'Intel Xeon E5-2680 v4' }, sum)
    .cards[0]!
  assert.equal(card.verdict, 'Skip')
  assert.match(
    card.measured!.disagree!,
    /disagree with the guide.*top quarter.*the guide says Skip/
  )
})

test('flip: 5 pool rigs over 2 epochs that disagree change the verdict, and say so', () => {
  const r4060 = [CUR - 1, CUR - 1, CUR, CUR, CUR].map(epoch =>
    mk({ gpu: 'RTX 4060', sph: 900, src: 'pool', epoch })
  )
  const sum = aggregate([...PEERS(), ...r4060], CUR)
  const r = pick({ mode: 'own', cpu: 'Ryzen 9 7950X', gpu: 'RTX 4060' }, sum)
  const card = r.cards.find(c => /4060/.test(c.title))!
  assert.equal(card.verdict, 'Good')
  assert.equal(card.measured!.flippedFrom, 'Works')
  assert.match(
    card.measured!.disagree!,
    /verdict changed from Works to Good: 5 pool-reported rigs over 2 epochs/
  )
})

test('flip: not with 4 pool rigs, not with one epoch, not with log rigs', () => {
  const run = (list: S[]) =>
    pick(
      { mode: 'own', cpu: 'Ryzen 9 7950X', gpu: 'RTX 4060' },
      aggregate([...PEERS(), ...list], CUR)
    ).cards.find(c => /4060/.test(c.title))!
  assert.equal(
    run(
      [CUR - 1, CUR, CUR, CUR].map(epoch =>
        mk({ gpu: 'RTX 4060', sph: 900, epoch })
      )
    ).verdict,
    'Works'
  )
  assert.equal(
    run(
      [CUR, CUR, CUR, CUR, CUR].map(epoch =>
        mk({ gpu: 'RTX 4060', sph: 900, epoch })
      )
    ).verdict,
    'Works'
  )
  assert.equal(
    run(
      [CUR - 1, CUR - 1, CUR, CUR, CUR].map(epoch =>
        mk({ gpu: 'RTX 4060', sph: 900, epoch, src: 'log' })
      )
    ).verdict,
    'Works'
  )
  assert.equal(MEASURE.flipMinPoolRigs, 5)
  assert.equal(MEASURE.flipMinEpochs, 2)
})

test('no disagreement is claimed with too few rows to rank, or when they agree', () => {
  const sum = aggregate(FIELD_SAMPLES, CUR)
  assert.equal(tierOf(610, 'card', sum.rows), undefined)
  const card = pick(
    { mode: 'own', cpu: 'Xeon E5-2696 v3', gpu: 'RTX 4090', gpuCount: 4 },
    sum
  ).cards.find(c => /4090/.test(c.title))!
  assert.equal(card.verdict, 'Good')
  assert.match(
    card.measured!.line,
    /Measured: median 610 sol\/h per card \(1 rig, epoch 233\)/
  )
  assert.equal(card.measured!.disagree, undefined)
  // the hand-written "Measured" spec row steps aside for the live line
  assert.ok(!card.specs!.some(([k]) => k === 'Measured'))
  // Golden 5070 Ti measuring top: agreement, no note
  const agree = aggregate(
    [...PEERS(), mk({ gpu: 'RTX 5070 Ti', sph: 800 })],
    CUR
  )
  const j = judge(
    agree.rows.find(r => r.key === 'gpu|RTX 5070 Ti')!,
    agree.rows,
    'Golden'
  )
  assert.equal(j.verdict, 'Golden')
  assert.equal(j.measured.disagree, undefined)
})

test('pick without measurements is unchanged', () => {
  const a = pick({ mode: 'own', cpu: 'Ryzen 9 7950X', gpu: 'RTX 4090' })
  assert.ok(a.cards.every(c => !c.measured))
  assert.ok(
    a.cards
      .find(c => /4090/.test(c.title))!
      .specs!.some(([k]) => k === 'Measured')
  )
})

/* ---------------- doctor comparison ---------------- */

const DOC_SUM = () =>
  aggregate(
    [
      ...[560, 600, 610, 640, 650].map(v =>
        mk({ gpu: 'RTX 4090', n: 1, sph: v })
      ),
    ],
    CUR
  )

test('doctor: below p25 lists the likely causes, the ones in the log first', () => {
  const c = compareRun(
    {
      key: 'gpu|RTX 4090',
      unit: 'card',
      gpuCount: 4,
      solPerHour: 1600,
      uptimeMin: 300,
      windowMin: 300,
      threads: 24,
      rejected: 12,
      findings: ['thermal'],
    },
    DOC_SUM()
  )
  assert.equal(c.kind, 'compared')
  if (c.kind !== 'compared') return
  assert.equal(c.yours, 400)
  assert.equal(c.below, true)
  assert.match(
    c.text,
    /^Slower than most rigs like it: 400 sol\/h per card against a median of 610 \(5 rigs, epoch 238, p25 600\)/
  )
  assert.deepEqual(
    c.causes.map(x => [x.id, x.seen]),
    [
      ['cpu-feed', true],
      ['thermal', true],
      ['pcie', false],
      ['power', false],
    ]
  )
  assert.match(c.causes[0]!.text, /24 threads for 4 cards.*12 rejected/)
})

test('doctor: the field rule on warm-up and the first 20 minutes', () => {
  assert.equal(
    compareRun(
      {
        key: 'gpu|RTX 4090',
        unit: 'card',
        gpuCount: 1,
        solPerHour: 900,
        uptimeMin: 12,
      },
      DOC_SUM()
    ).kind,
    'early'
  )
  const warm = compareRun(
    {
      key: 'gpu|RTX 4090',
      unit: 'card',
      gpuCount: 1,
      solPerHour: 500,
      uptimeMin: 60,
      windowMin: 60,
    },
    DOC_SUM()
  )
  assert.equal(warm.kind, 'compared')
  if (warm.kind !== 'compared') return
  assert.equal(warm.warm, true)
  assert.match(warm.text, /early rates run high by about 1\.3 to 1\.5x/)
  assert.equal(warm.causes[0]!.id, 'warmup')
  const fine = compareRun(
    {
      key: 'gpu|RTX 4090',
      unit: 'card',
      gpuCount: 1,
      solPerHour: 620,
      uptimeMin: 600,
    },
    DOC_SUM()
  )
  assert.ok(
    fine.kind === 'compared' &&
      !fine.below &&
      fine.causes.length === 0 &&
      /^In line/.test(fine.text)
  )
  assert.equal(
    compareRun(
      {
        key: 'gpu|RTX 2060',
        unit: 'card',
        gpuCount: 1,
        solPerHour: 100,
        uptimeMin: 600,
      },
      DOC_SUM()
    ).kind,
    'no-data'
  )
  assert.equal(
    compareRun(
      { key: 'gpu|RTX 4090', unit: 'card', gpuCount: 1, uptimeMin: 600 },
      DOC_SUM()
    ).kind,
    'no-rate'
  )
})

test("own cost per solution comes only from the user's own daily cost", () => {
  assert.equal(costPerSolution(24, 10), 0.1)
  assert.equal(costPerSolution(undefined, 10), undefined)
  assert.equal(costPerSolution(10, 0), undefined)
})

/* ---------------- samples, storage, privacy ---------------- */

const INPUT = {
  cpu: 'AMD EPYC 7B13 64-Core Processor',
  gpu: 'NVIDIA GeForce RTX 5080',
  gpuCount: 2,
  mode: 'gpu',
  owner: 'rented',
  host: 'clore.ai',
  threads: 16,
  solutions: 1200,
  windowMin: 180,
  uptimeMin: 240,
  gpuIts: 702,
  logEpoch: CUR,
  worker: 'QC.secret-rig-7',
  dailyCostUsd: 14,
}

test('buildSample: normalizes, takes the epoch from epoch.ts, computes sol/h', () => {
  const r = buildSample(INPUT, NOW)
  assert.ok(r.ok)
  if (!r.ok) return
  assert.equal(r.value.result.epoch, CUR)
  assert.equal(r.value.result.solPerHour, 400)
  assert.equal(r.value.hw.cpu, 'EPYC 7B13')
  assert.equal(r.value.hw.gpu, 'RTX 5080')
  assert.equal(r.value.hw.host, 'Clore.ai')
  assert.equal(r.value.key, '2x RTX 5080 | EPYC 7B13 | gpu')
  assert.ok(!('dailyCostUsd' in r.value.result))
})

test('buildSample: refuses warm-up, short windows, old logs, wallet strings', () => {
  const err = (o: object) => {
    const r = buildSample({ ...INPUT, ...o }, NOW)
    return r.ok ? '' : r.error
  }
  assert.match(err({ uptimeMin: 90 }), /warming up.*1\.3 to 1\.5x/)
  assert.match(err({ windowMin: 10 }), /at least 20 minutes/)
  assert.match(err({ logEpoch: 229 }), /from epoch 229/)
  assert.match(err({ cpu: ADDR }), /wallet/)
  assert.match(err({ gpu: `RTX ${SEED}` }), /wallet/)
  assert.match(err({ mode: 'gpu', gpu: '' }), /GPU model/)
  assert.match(err({ solutions: undefined, gpuIts: undefined }), /No rate/)
})

test('privacy: stored rows carry no worker name, IP, wallet, seed or daily cost', async () => {
  const mem = memoryBackend()
  const store = createStore({
    backend: mem,
    salt: 'test-salt-0123456789abcdef',
    now: () => NOW,
    field: [],
  })
  const ok = await store.add(
    { ...INPUT, notes: ADDR, wallet: ADDR, seed: SEED },
    { ip: '203.0.113.9' }
  )
  assert.ok(ok.ok)
  const noWorker = await store.add(
    { ...INPUT, worker: undefined },
    { ip: '203.0.113.9' }
  )
  assert.ok(noWorker.ok)
  const rows = mem.map.get(listKey(CUR))!
  assert.equal(rows.length, 2)
  for (const row of rows) {
    assert.doesNotMatch(
      row,
      /secret-rig|QC\.|203\.0\.113|[A-Z]{60}|[a-z]{55}|dailyCost|wallet|seed|notes/i
    )
    const s = parseRow(row)!
    assert.match(s.dedupe!, /^[0-9a-f]{24}$/)
    assert.deepEqual(Object.keys(s).sort(), [
      'at',
      'dedupe',
      'hw',
      'key',
      'result',
      'source',
      'v',
    ])
  }
  // the dedupe hash is salted, per worker and per day
  assert.equal(
    parseRow(rows[0]!)!.dedupe,
    dedupeHash('w:QC.secret-rig-7', '2026-11-06', 'test-salt-0123456789abcdef')
  )
  assert.notEqual(
    dedupeHash('w:QC.a', '2026-11-06', 's1-0123456789abcdef'),
    dedupeHash('w:QC.a', '2026-11-06', 's2-0123456789abcdef')
  )
  assert.notEqual(
    dedupeHash('w:QC.a', '2026-11-06', 's1-0123456789abcdef'),
    dedupeHash('w:QC.a', '2026-11-07', 's1-0123456789abcdef')
  )
})

test('store: field rows are merged on read, saved twice counts once, live and prompt views', async () => {
  const mem = memoryBackend()
  let t = NOW
  const store = createStore({
    backend: mem,
    salt: 'test-salt-0123456789abcdef',
    now: () => t,
  })
  await store.add(INPUT, { ip: '1.1.1.1' })
  await store.add({ ...INPUT, solutions: 1500 }, { ip: '1.1.1.1' })
  const sum = await store.summary()
  const row = sum.rows.find(r => r.key === 'gpu|RTX 5080')!
  // the field run keeps the headline; the saved log rides along as self-reported
  assert.equal(row.source, 'field')
  assert.equal(row.latest.epoch, 234)
  assert.equal(row.selfReported!.epoch, CUR)
  assert.equal(row.selfReported!.n, 1)
  assert.equal(row.selfReported!.median, 250) // 1500 / 180 min * 60 = 500 per rig, 2 cards
  assert.equal(row.previous, undefined)
  assert.ok(sum.rows.some(r => r.key === 'gpu|RTX 4090'))
  // the prompt snapshot holds finished epochs only, so it is the same all week
  const snap = await store.promptSnapshot()
  assert.ok(!snap.rows.some(r => r.latest.epoch === CUR))
  assert.equal(snap.at, epochStart(CUR).getTime())
  t = new Date(NOW.getTime() + 3600_000)
  assert.equal(await store.promptSnapshot(), snap)
  // a stored row claiming to be a field row is ignored
  mem.map
    .get(listKey(CUR))!
    .push(
      JSON.stringify({
        ...parseRow(mem.map.get(listKey(CUR))![0]!),
        source: 'field',
      })
    )
  assert.equal(parseRow(mem.map.get(listKey(CUR))!.at(-1)!), null)
})

test('store: without a salt nothing is saved', async () => {
  const store = createStore({
    backend: memoryBackend(),
    salt: null,
    now: () => NOW,
  })
  const r = await store.add(INPUT)
  assert.equal(r.ok, false)
})

test('store: the list per epoch is capped', async () => {
  const mem = memoryBackend()
  for (let i = 0; i < MEASURE.capPerEpoch + 5; i++)
    await mem.append(CUR, String(i))
  assert.equal(mem.map.get(listKey(CUR))!.length, MEASURE.capPerEpoch)
  assert.equal(mem.map.get(listKey(CUR))![0], '5')
})

/* ---------------- pool stats adapter ---------------- */

const FAKE_POOL = {
  epoch: 238,
  workers: [
    {
      worker: 'QC.4x4090-a',
      wallet: ADDR,
      solutions: 4800,
      onlineMinutes: 120,
      its: 800,
      rejected: 2,
    },
    {
      worker: 'QC.rig-b',
      wallet: ADDR,
      gpu: 'NVIDIA GeForce RTX 5070 Ti',
      gpuCount: 3,
      cpu: 'AMD Ryzen 9 9950X',
      solutions: '900',
      onlineMinutes: '600',
    },
    { worker: 'QC.7950x-c', solutions: 30, onlineMinutes: 600, its: 31 },
    { worker: 'QC.box', solutions: 10, onlineMinutes: 60 },
    { worker: 'OTHER.4090', solutions: 999, onlineMinutes: 60 },
    { worker: 'QC.5080-d' },
    null,
  ],
}

test('stats adapter: parses a fake payload, keeps only our hardware-known workers, hashes names', () => {
  const list = parsePoolStats(FAKE_POOL, (w, d) => `h(${w.length},${d})`, NOW)
  assert.equal(list.length, 3)
  const [a, b, c] = list
  assert.deepEqual(
    [
      a!.source,
      a!.hw.gpu,
      a!.hw.gpuCount,
      a!.result.solPerHour,
      a!.result.epoch,
      a!.result.gpuIts,
    ],
    ['pool', 'RTX 4090', 4, 2400, 238, 800]
  )
  assert.deepEqual(
    [b!.hw.gpu, b!.hw.gpuCount, b!.hw.cpu, b!.result.solPerHour],
    ['RTX 5070 Ti', 3, 'Ryzen 9 9950X', 90]
  )
  assert.deepEqual(
    [c!.hw.cpu, c!.hw.mode, c!.result.solPerHour, c!.result.cpuIts],
    ['Ryzen 9 7950X', 'cpu', 3, 31]
  )
  const all = JSON.stringify(list)
  assert.doesNotMatch(all, /QC\.|[A-Z]{60}|wallet/)
  assert.equal(a!.dedupe, 'h(11,2026-11-06)')
  // an array payload works too
  assert.equal(parsePoolStats(FAKE_POOL.workers, () => 'x', NOW).length, 3)
  assert.deepEqual(
    parsePoolStats({ nothing: true }, () => 'x', NOW),
    []
  )
})

test('stats adapter: worker tags and the stub', () => {
  assert.deepEqual(hardwareFromWorker('QC.5070ti-a'), {
    gpu: 'RTX 5070 Ti',
    gpuCount: 1,
    cpu: 'Unknown',
    mode: 'gpu',
  })
  assert.equal(hardwareFromWorker('QC.7900x-a')!.cpu, 'Ryzen 9 7900X')
  assert.equal(hardwareFromWorker('QC.7700-a')!.cpu, 'Ryzen 7 7700')
  assert.equal(hardwareFromWorker('QC.m3pro-a')!.cpu, 'Apple M3 Pro')
  assert.equal(hardwareFromWorker('QC.rig-a'), null)
  assert.equal(poolStatsAdapter(), null) // statsUrl is null until Bob confirms it
})

test('stats adapter: pool rows flow into the aggregates as pool-sourced', async () => {
  const store = createStore({
    backend: memoryBackend(),
    salt: 'test-salt-0123456789abcdef',
    now: () => NOW,
    field: [],
  })
  assert.equal(await store.ingestPool(FAKE_POOL), 3)
  const row = (await store.summary()).rows.find(r => r.key === 'gpu|RTX 4090')!
  assert.equal(row.latest.nPool, 1)
  assert.equal(row.latest.median, 600)
})

/* ---------------- prompt and page ---------------- */

test('prompt: MEASURED table with n and epoch, the instruction, and the field rows by default', () => {
  const p = mariaSystemPrompt(NOW)
  assert.match(p, /MEASURED \(our miners' results/)
  assert.match(p, /Prefer these numbers over guide figures when n is 5 or more/)
  assert.match(p, /Always state n and the epoch/)
  assert.match(
    p,
    /- RTX 4090: 610 sol\/h per card, 2,440 per rig; n 1, epoch 233 \[our own run, few data, older\]/
  )
  assert.match(
    p,
    /- RTX 5080: 351 sol\/h per card, 2,460 per rig; n 1, epoch 234/
  )
  assert.doesNotMatch(p, /—/)
  // the static block only depends on the snapshot, so it is stable for the cache
  const snap = aggregate(FIELD_SAMPLES, 238, 0)
  assert.equal(mariaSystemStatic(snap), mariaSystemStatic(snap))
  assert.match(mariaSystemStatic(aggregate([], 238, 0)), /No measured rows yet/)
})

test('page rows: per card first by median, then per rig; no income anywhere', () => {
  const sum = aggregate(
    [...PEERS(), mk({ cpu: 'Ryzen 9 7950X', sph: 30 }), ...FIELD_SAMPLES],
    CUR
  )
  const rows = topRows(sum, 8)
  assert.equal(rows[0]!.label, 'RTX 5090')
  assert.equal(rows.at(-1)!.unit, 'rig')
  const text = JSON.stringify([
    sum,
    measuredBlock(sum),
    compareRun(
      {
        key: 'gpu|RTX 4090',
        unit: 'card',
        gpuCount: 1,
        solPerHour: 100,
        uptimeMin: 300,
      },
      sum
    ),
  ])
  assert.doesNotMatch(text, /—|\$\d|profit|earning|payback|\bROI\b|revenue/i)
  assert.doesNotMatch(text.replace(/never income/g, ''), /income/i)
})

test('doctor: says "the one rig we measured" with n 1, and flags an older row', () => {
  const c = compareRun({ key: 'gpu|RTX 4090', unit: 'card', gpuCount: 4, solPerHour: 428, uptimeMin: 210, windowMin: 210 }, aggregate(FIELD_SAMPLES, CUR))
  assert.ok(c.kind === 'compared')
  if (c.kind !== 'compared') return
  assert.equal(c.title, 'Slower than the one rig we measured')
  assert.match(c.detail, /^107 sol\/h per card against a median of 610 \(1 rig, epoch 233\)\. That measurement is from epoch 233, more than 2 epochs ago/)
  assert.doesNotMatch(c.text, /most rigs/)
})

/* ---------------- source priority: pool, then field, then self-reported ---------------- */

const { SOURCE_PRIORITY, selfReportedLine } = await import('../aggregate.ts')

test('priority: a newer self-reported epoch never replaces a field headline; it becomes a second line', () => {
  const logs = [100, 110, 120].map(v => mk({ gpu: 'RTX 4090', sph: v, src: 'log' }))
  const sum = aggregate([...FIELD_SAMPLES, ...logs], CUR)
  const r = sum.rows.find(x => x.key === 'gpu|RTX 4090')!
  assert.deepEqual(SOURCE_PRIORITY, ['pool', 'field', 'log'])
  assert.equal(r.source, 'field')
  assert.deepEqual([r.latest.epoch, r.latest.median, r.latest.n], [233, 610, 1])
  assert.deepEqual(r.tags, ['our own run', 'few data', 'older'])
  assert.deepEqual([r.selfReported!.epoch, r.selfReported!.median, r.selfReported!.n], [CUR, 110, 3])
  assert.equal(selfReportedLine(r), `Self-reported, epoch ${CUR}: median 110 sol/h per card (3 rigs)`)
})

test('priority: pool beats field and log, even when they are newer; the newest pool epoch wins', () => {
  const list = [
    mk({ gpu: 'RTX 5080', sph: 300, src: 'pool', epoch: CUR - 3 }),
    mk({ gpu: 'RTX 5080', sph: 320, src: 'pool', epoch: CUR - 2 }),
    mk({ gpu: 'RTX 5080', sph: 900, src: 'log', epoch: CUR }),
    ...FIELD_SAMPLES,
  ]
  const r = aggregate(list, CUR).rows.find(x => x.key === 'gpu|RTX 5080')!
  assert.equal(r.source, 'pool')
  assert.deepEqual([r.latest.epoch, r.latest.median, r.latest.nPool, r.latest.nLog], [CUR - 2, 320, 1, 0])
  assert.equal(r.previous!.epoch, CUR - 3) // drift compares like with like
  assert.equal(r.selfReported!.median, 900)
  assert.ok(!r.tags.includes('self-reported') && !r.tags.includes('our own run'))
})

test('priority: only self-reported data keeps today\'s behaviour, the headline with its labels and no second line', () => {
  const r = aggregate([mk({ gpu: 'RTX 3080', sph: 250, src: 'log' })], CUR).rows[0]!
  assert.equal(r.source, 'log')
  assert.deepEqual(r.tags, ['few data', 'self-reported'])
  assert.equal(r.selfReported, undefined)
  assert.equal(selfReportedLine(r), undefined)
})

test('priority: drift is not triggered by a self-reported epoch next to pool data', () => {
  const list = [...[600, 610, 620].map(v => mk({ gpu: 'RTX 4090', sph: v, epoch: CUR - 1 })), ...[200, 210].map(v => mk({ gpu: 'RTX 4090', sph: v, src: 'log', epoch: CUR }))]
  assert.equal(aggregate(list, CUR).rows[0]!.drift, undefined)
})

test('priority applies to the disagreement logic: log rigs cannot push a guided card into the top quarter', () => {
  const list = [...PEERS(), mk({ gpu: 'RTX 4060', sph: 100 }), ...[2000, 2100].map(v => mk({ gpu: 'RTX 4060', sph: v, src: 'log' }))]
  const card = pick({ mode: 'own', cpu: 'Ryzen 9 7950X', gpu: 'RTX 4060' }, aggregate(list, CUR)).cards.find(c => /4060/.test(c.title))!
  assert.match(card.measured!.line, /median 100 sol\/h per card \(1 rig/)
  assert.equal(card.measured!.disagree, undefined)
  assert.match(card.measured!.secondary!, /^Self-reported, epoch 238: median 2,050 sol\/h per card \(2 rigs\)$/)
})

test('priority applies to the doctor comparison and the MEASURED table', () => {
  const sum = aggregate([...FIELD_SAMPLES, ...[100, 120].map(v => mk({ gpu: 'RTX 4090', sph: v, src: 'log' }))], CUR)
  const c = compareRun({ key: 'gpu|RTX 4090', unit: 'card', gpuCount: 1, solPerHour: 115, uptimeMin: 300 }, sum)
  assert.ok(c.kind === 'compared' && c.below && /median of 610 \(1 rig, epoch 233\)/.test(c.detail))
  const block = measuredBlock(sum)
  assert.match(block, /- RTX 4090: 610 sol\/h per card, 2,440 per rig; n 1, epoch 233 \[our own run, few data, older\]\. Self-reported, epoch 238: median 110 sol\/h per card \(2 rigs\)/)
  assert.match(block, /pool data first, then our own runs, then self-reported logs/)
})
