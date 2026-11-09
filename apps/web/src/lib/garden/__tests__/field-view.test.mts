import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BRAINS_PER_CELL, cellAt, colourOf, countInto, edgeHas, edgeNote, emptyField, gridFor, hilbert, marks, territories, toNextCell } from '../field-view.ts'

test('the Hilbert curve visits every cell of the block once, neighbours in sequence', () => {
  const n = 16
  const seen = new Set<string>()
  for (let d = 0; d < n * n; d++) {
    const [x, y] = hilbert(n, d)
    assert.ok(x >= 0 && x < n && y >= 0 && y < n)
    seen.add(`${x},${y}`)
  }
  assert.equal(seen.size, n * n)
  for (let d = 1; d < n * n; d++) {
    const [a, b] = hilbert(n, d - 1)
    const [c, e] = hilbert(n, d)
    assert.equal(Math.abs(a - c) + Math.abs(b - e), 1)
  }
})

test('grids grow by blocks and cells continue into the next block', () => {
  assert.deepEqual(gridFor(1000), { w: 256, h: 256, block: 256 })
  assert.deepEqual(gridFor(70_000), { w: 512, h: 256, block: 256 })
  const [x] = cellAt(gridFor(70_000), 256 * 256)
  assert.ok(x >= 256)
})

test('counting the stream: identities, firsts, lasts, best scores', () => {
  const f = emptyField(238)
  const idx = new Map<string, number>()
  const A = 'A'.repeat(60)
  const B = 'B'.repeat(60)
  countInto(f, { hash: 'h1', computorId: A, tickNumber: 10, timestamp: '2000', verification: { score: 4300 } }, idx)
  countInto(f, { hash: 'h2', computorId: B, tickNumber: 11, timestamp: '3000', verification: { score: 4100 } }, idx)
  countInto(f, { hash: 'h3', computorId: A, tickNumber: 12, timestamp: '1000', verification: { score: 4200 } }, idx)
  assert.deepEqual(f.ids, [A, B])
  assert.deepEqual(f.n, [2, 1])
  assert.deepEqual([f.first[0], f.last[0], f.best[0]], [1000, 2000, 4200])
  assert.equal(f.counted, 3)
})

test('territories: by first appearance, contiguous, only whole cells', () => {
  const ts = territories({
    ids: ['A'.repeat(60), 'B'.repeat(60), 'C'.repeat(60)],
    n: [250, 1000, 99],
    first: [2000, 1000, 500],
    last: [9000, 5000, 600],
    best: [null, 4000, null],
  })
  assert.deepEqual(ts.map(t => [t.h[0], t.at, t.cells]), [['B', 0, 10], ['A', 10, 2]])
  assert.equal(toNextCell(250), 50)
  assert.equal(toNextCell(BRAINS_PER_CELL), BRAINS_PER_CELL)
})

test('edges tell solutions already counted at a tick apart from new ones', () => {
  const e = { tick: 5, hashes: ['a'] }
  assert.ok(edgeHas(e, { hash: 'a', computorId: 'X', tickNumber: 5 }))
  assert.ok(!edgeHas(e, { hash: 'b', computorId: 'X', tickNumber: 5 }))
  edgeNote(e, { hash: 'b', computorId: 'X', tickNumber: 5 })
  assert.deepEqual(e.hashes, ['a', 'b'])
  edgeNote(e, { hash: 'c', computorId: 'X', tickNumber: 6 })
  assert.deepEqual(e, { tick: 6, hashes: ['c'] })
})

test('colours are stable and warm', () => {
  const c = colourOf('A'.repeat(60))
  assert.equal(c, colourOf('A'.repeat(60)))
  assert.match(c, /^hsl\((1[89]|[2-4]\d|5[0-2]) /)
})

test('marks follow the record', () => {
  const m = marks({ brains: 1200, cells: 12, best: 3400 }, true, false)
  const got = Object.fromEntries(m.map(x => [x.key, x.got]))
  assert.deepEqual(got, { sprout: true, cell: true, ten: true, hundred: false, sixty: true, top: true, best: false })
  assert.ok(marks(null, false, false).every(x => !x.got))
})
