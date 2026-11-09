import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BRAINS_PER_CELL, CELLS_PER_ANNA, annaCellOf, annaProgress, bandOf, cellAt, colourOf, countInto, edgeHas, edgeNote, emptyField, gridFor, marks, offsetOf, territories, toNextCell } from '../field-view.ts'

test('the curve visits every cell of one Anna once, row by row, two by two', () => {
  const g = gridFor(1)
  assert.deepEqual(g, { w: 256, h: 256, block: 256 })
  const seen = new Set<string>()
  for (let d = 0; d < CELLS_PER_ANNA; d++) {
    const [x, y] = cellAt(g, d)
    assert.ok(x >= 0 && x < 256 && y >= 0 && y < 256)
    seen.add(`${x},${y}`)
    assert.equal(offsetOf(g, x, y), d)
  }
  assert.equal(seen.size, CELLS_PER_ANNA)
  // the first four cells are Anna's top-left cell; the second row of Anna runs back
  assert.deepEqual([0, 1, 2, 3].map(d => cellAt(g, d)), [[0, 0], [1, 0], [0, 1], [1, 1]])
  assert.deepEqual(cellAt(g, 128 * 4), [254, 2])
  assert.deepEqual(annaCellOf(254, 2), [1, 127])
})

test('a second Anna opens beside the first when the epoch outgrows one', () => {
  assert.deepEqual(gridFor(70_000), { w: 512, h: 256, block: 256 })
  const [x] = cellAt(gridFor(70_000), CELLS_PER_ANNA)
  assert.equal(x, 256)
})

test('progress through Anna: the row reached and the share grown', () => {
  assert.deepEqual(annaProgress(0), { row: 0, grown: 0 })
  assert.deepEqual(annaProgress(512 * 43), { row: 43, grown: (512 * 43) / CELLS_PER_ANNA })
  assert.equal(bandOf(43).name, 'processing core')
  assert.equal(bandOf(127).name, 'the void')
  assert.equal(annaProgress(CELLS_PER_ANNA + 5).grown, 1)
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
