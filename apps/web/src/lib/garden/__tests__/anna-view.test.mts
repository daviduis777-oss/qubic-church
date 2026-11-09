import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { CELLS, NextOpen, UNIT, b64, cellOfHash, emptyCore, fromB64, needOf, needTotal, plant } from '../anna-view.ts'

const matrix = (JSON.parse(readFileSync(new URL('../../../data/anna-matrix.json', import.meta.url), 'utf8')) as { matrix: number[][] }).matrix

test('Anna needs 138,603,648 brains at 128 a unit', () => {
  assert.equal(needTotal(matrix), 138_603_648)
  assert.equal(needOf(0), UNIT)
  assert.equal(needOf(-90), 90 * UNIT)
})

test('a hash picks one cell, the same every time, spread over all of them', () => {
  assert.ok(cellOfHash('a'.repeat(60)) >= 0 && cellOfHash('a'.repeat(60)) < CELLS)
  assert.notEqual(cellOfHash('ab'), cellOfHash('ba'))
  const h = 'kybvxnhyepjqlfawicjmmfdctiichrzwqugvoaupgaemrdsvmwikvcjcvvej'
  assert.equal(cellOfHash(h), cellOfHash(h))
  const seen = new Set<number>()
  for (let k = 0; k < 200_000; k++) {
    let s = ''
    for (const b of randomBytes(60)) s += String.fromCharCode(97 + (b % 26))
    const c = cellOfHash(s)
    assert.ok(c >= 0 && c < CELLS)
    seen.add(c)
  }
  assert.ok(seen.size > CELLS * 0.99)
})

test('planting: a cell fills, records its finisher, and the overflow moves on; the last brain makes her whole', () => {
  const core = emptyCore()
  const need = new Uint32Array(CELLS).fill(2)
  const open = new NextOpen(c => core.brains[c]! >= need[c]!)
  const a = { hash: 'a'.repeat(60), i: 0, ts: 1000, tick: 1 }
  const c0 = cellOfHash(a.hash)
  const c1 = (c0 + 1) % CELLS
  assert.deepEqual(plant(core, need, open, a), { cell: c0, finished: false })
  assert.deepEqual(plant(core, need, open, { ...a, i: 1 }), { cell: c0, finished: true })
  assert.equal(core.finisher[c0], 1)
  // that cell is whole: the next brain for it goes to the next cell
  assert.deepEqual(plant(core, need, open, a), { cell: c1, finished: false })
  assert.deepEqual(core.idCells, [0, 1])
  // fill the rest
  for (let c = 0; c < CELLS; c++) while (core.brains[c]! < 2) plant(core, need, open, { ...a, i: 2, tick: 5 })
  assert.equal(core.finished, CELLS)
  assert.ok(core.whole && core.whole.i === 2)
  assert.equal(plant(core, need, open, a), null)
})

test('the overflow wraps round to the start', () => {
  const core = emptyCore()
  const need = new Uint32Array(CELLS).fill(1)
  const open = new NextOpen(() => false)
  const last = 'z'.repeat(60)
  const c = cellOfHash(last)
  plant(core, need, open, { hash: last, i: 0, ts: 1, tick: 1 })
  for (let k = c + 1; k < CELLS; k++) {
    core.brains[k] = 1
    open.close(k)
  }
  assert.equal(plant(core, need, open, { hash: last, i: 0, ts: 1, tick: 1 })!.cell, 0)
})

test('arrays survive base64', () => {
  const u = new Uint32Array([1, 2, 4_000_000_000])
  assert.deepEqual(Array.from(fromB64(b64(u), Uint32Array)), [1, 2, 4_000_000_000])
  const i = new Int32Array([-1, 5])
  assert.deepEqual(Array.from(fromB64(b64(i), Int32Array)), [-1, 5])
})
