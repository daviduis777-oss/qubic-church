import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BRAINS_PER_CELL, cellAt, colourOf, gridFor, hilbert, marks, territories, toNextCell } from '../field-view.ts'

test('the Hilbert curve visits every cell of the block once', () => {
  const n = 16
  const seen = new Set<string>()
  for (let d = 0; d < n * n; d++) {
    const [x, y] = hilbert(n, d)
    assert.ok(x >= 0 && x < n && y >= 0 && y < n)
    seen.add(`${x},${y}`)
  }
  assert.equal(seen.size, n * n)
  // consecutive points are neighbours
  for (let d = 1; d < n * n; d++) {
    const [a, b] = hilbert(n, d - 1)
    const [c, e] = hilbert(n, d)
    assert.equal(Math.abs(a - c) + Math.abs(b - e), 1)
  }
})

test('grids grow by blocks and cells continue into the next block', () => {
  assert.deepEqual(gridFor(1000), { w: 256, h: 256, block: 256 })
  assert.deepEqual(gridFor(70_000), { w: 512, h: 256, block: 256 })
  const g = gridFor(70_000)
  const [x] = cellAt(g, 256 * 256)
  assert.ok(x >= 256)
})

test('territories: by first appearance, contiguous, only whole cells', () => {
  const ts = territories([
    { id: 'A'.repeat(60), n: 250, first: 2000, last: 9000 },
    { id: 'B'.repeat(60), n: 1000, first: 1000, last: 5000 },
    { id: 'C'.repeat(60), n: 99, first: 500, last: 600 },
  ])
  assert.deepEqual(ts.map(t => [t.id[0], t.at, t.cells]), [['B', 0, 10], ['A', 10, 2]])
  assert.equal(toNextCell(250), 50)
  assert.equal(toNextCell(BRAINS_PER_CELL), BRAINS_PER_CELL)
})

test('colours are stable and warm', () => {
  const c = colourOf('A'.repeat(60))
  assert.equal(c, colourOf('A'.repeat(60)))
  assert.match(c, /^hsl\((1[89]|[2-4]\d|5[0-2]) /)
})

test('marks follow the record', () => {
  const m = marks({ brains: 1200, cells: 12, epochs: 7, firstEpoch: 150 }, true, false)
  const got = Object.fromEntries(m.map(x => [x.key, x.got]))
  assert.deepEqual(got, { sprout: true, cell: true, ten: true, hundred: false, top: true, best: false, seven: true, elder: true })
  assert.ok(marks(null, false, false).every(x => !x.got))
})
