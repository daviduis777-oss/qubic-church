// node --experimental-strip-types --test apps/web/src/lib/bpp/__tests__/*.mts
// Brain Watch: our emulator reproduces the core's verified score, the out-of-sample check, ranking, the genome file.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const B = await import('../brains-view.ts')
const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

type Fixture = {
  hash: string
  epoch: number
  score: number
  shift: number
  outputNeuron: number
  signalNeuron: number
  depth: number
  computorId: string
  nodes: { id: number; init: number; lut: number[] }[]
  links: [number, number, number][]
  task: { sourceStartUnix: number; firstTargetUnix: number; sourceMovementCount: number; roundedCloseBeforeFirstTarget: number }
  holdout: { pairIndex: number; prediction: number; movement: number }
  taskMovementBits: number
  taskMovements: string
}
const fx = JSON.parse(src('./fixtures/brain-wdcb.json')) as Fixture

/** 18-bit signed movements, little-endian bit packing, as the explorer publishes the task. */
function movements(b64: string, bits: number): number[] {
  const b = Buffer.from(b64, 'base64')
  const n = Math.floor((b.length * 8) / bits)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    let v = 0
    for (let k = 0; k < bits; k++) {
      const pos = i * bits + k
      if ((b[pos >> 3]! >> (pos & 7)) & 1) v |= 1 << k
    }
    if (v & (1 << (bits - 1))) v -= 1 << bits
    out.push(v)
  }
  return out
}

const core = {
  n: 32,
  k: 3,
  ctrl: fx.signalNeuron,
  out: fx.outputNeuron,
  init: fx.nodes.map(n => n.init).join(''),
  lut: fx.nodes.map(n => n.lut.join('')).join(''),
  links: fx.links,
}
const task = { start: fx.task.sourceStartUnix, hours: 8928, frame: 8760 }

test('the emulator reproduces the explorer-verified score and the holdout call of a real epoch-238 brain', () => {
  const mv = movements(fx.taskMovements, fx.taskMovementBits)
  assert.equal(mv.length, 8760)
  const targets = Uint8Array.from(mv, v => (v >= 0 ? 1 : 0))
  const em = B.emits(core, 8929)
  assert.equal(em.length, 8929, 'this brain emits every tick')
  assert.equal(B.frameErrors(em, targets, fx.shift, 8760), fx.score)
  assert.equal(em[fx.holdout.pairIndex], fx.holdout.prediction)
  // the task's own direction rule on the hour the explorer checked: a drop of 575 is down
  assert.equal(B.dirOf(100000, 100000 - 575), 0)
  assert.equal(B.dirOf(100000, 100000), 1, 'flat is up')
  assert.equal(B.dirOf(100000.4, 100000.6), 1, 'rounding to whole dollars first')
})

test('hour indexing: target 0 is the candle that opens at the first target time', () => {
  assert.equal(B.hourOfIndex(task, 0), fx.task.firstTargetUnix)
  assert.equal(B.indexOfHour(task, fx.task.sourceStartUnix + 8929 * 3600), 8928)
})

test('live check: only hours after the loaded sequence count, not-sure calls are skipped, the rest are graded', () => {
  const em = B.emits(core, 8928 + 6)
  const h = (i: number) => B.hourOfIndex(task, i)
  // closes chosen so that hours 8928..8930 go the way the brain called and 8931 goes against it
  const closes = [{ hour: h(8927), close: 100000 }]
  let c = 100000
  for (let i = 8928; i <= 8931; i++) {
    const call = em[i]!
    const agree = i !== 8931
    c += (call === 1) === agree ? 10 : -10
    closes.push({ hour: h(i), close: c })
  }
  closes.push({ hour: h(8920), close: 1 }) // inside the sequence: ignored
  const live = B.liveCheck(em, task, closes)
  assert.deepEqual(
    live.map(x => x.hour),
    [8928, 8929, 8930, 8931].map(h),
  )
  assert.deepEqual(live.map(x => x.hit), [true, true, true, false])
  const s = B.liveStats(live)
  assert.equal(s.checked, 4)
  assert.equal(s.hits, 3)
  assert.equal(s.rate, 75)
  // a not-sure call is skipped
  const unsure = B.liveStats([{ hour: 0, call: 2, went: 1, hit: null }, ...live])
  assert.equal(unsure.unsure, 1)
  assert.equal(unsure.checked, 4)
})

test('ranking: frame progress first, then fewer errors, then the earlier find', () => {
  const rows = [
    { hash: 'a', score: 3000, shift: 0, foundAt: '2026-11-05T00:00:00.000Z' },
    { hash: 'b', score: 3100, shift: 1, foundAt: '2026-11-06T00:00:00.000Z' },
    { hash: 'c', score: 3000, shift: 0, foundAt: '2026-11-04T00:00:00.000Z' },
  ]
  assert.deepEqual(
    B.rankBrains(rows).map(r => r.hash),
    ['b', 'c', 'a'],
  )
})

test('genome: compacted from the explorer shape, and written out as a file anyone can run', () => {
  const rec = {
    epoch: fx.epoch,
    score: fx.score,
    coreVersion: 'v1.311.1',
    coreCommit: 'abc',
    annGenomeId: 'sha256:x',
    antColony: { depth: fx.depth, parent: { solutionHash: 'parent' }, verifiedShift: 0, annContentId: 'sha256:y' },
    metrics: { population: 32, neighborsPerNeuron: 3, signalNeuron: fx.signalNeuron, outputNeuron: fx.outputNeuron, lutEntriesPerNeuron: 27, numberOfWindows: 8760, sequenceLength: 8928, frameShift: 0 },
    topology: { nodes: fx.nodes.map(n => ({ id: n.id, initialState: n.init, lut: { values: n.lut } })).reverse(), links: fx.links.map(([target, slot, source]) => ({ target, slot, source })) },
    searchReplay: { finalPredictions: { task: { sourceStartUnix: fx.task.sourceStartUnix, firstTargetUnix: fx.task.firstTargetUnix, sourceMovementCount: 8928 } } },
  }
  const row = B.rowOf({ hash: fx.hash, computorId: fx.computorId, epoch: fx.epoch, timestamp: '1794069345000', tickNumber: 90418641, verification: { score: fx.score, shift: 0 } })!
  assert.equal(row.foundAt, '2026-11-07T16:35:45.000Z')
  const g = B.genomeOf(rec, row)
  assert.equal(g.init, core.init, 'nodes are put back in id order')
  assert.equal(g.lut, core.lut)
  assert.equal(g.depth, fx.depth)
  assert.equal(g.parent, 'parent')
  assert.deepEqual(g.task, task)
  assert.equal(g.source.explorer, `https://annexplorer.jetskipool.ai/solutions/${fx.hash}`)
  const f = B.genomeFile(g)
  assert.equal(f.format, 'qc-bpp9000-brain-v1')
  assert.equal(f.nodes.length, 32)
  assert.deepEqual(f.nodes[0]!.sources, [8, 20, 18])
  assert.deepEqual(f.nodes[9]!.lut, fx.nodes[9]!.lut)
  assert.equal(f.score.accuracy, 63.93)
  // a brain of another shape is refused rather than misread
  assert.throws(() => B.genomeOf({ ...rec, metrics: { ...rec.metrics, population: 64 } }, row))
  assert.equal(B.rowOf({ hash: 'p', computorId: 'c', epoch: 1, verification: { status: 'pending' } }), null)
})

test('vote: majority per hour, a tie or nobody sure is not sure', async () => {
  const { vote } = await import('../brains-view.ts')
  const v = vote([Uint8Array.from([1, 0, 2, 1, 0]), Uint8Array.from([1, 1, 2, 0, 2]), Uint8Array.from([0, 0, 2, 2, 2, 1])])
  assert.deepEqual([...v], [1, 0, 2, 2, 0])
  assert.equal(vote([]).length, 0)
})
