import assert from 'node:assert/strict'
import { test } from 'node:test'
import { empty, observe, STALL_MS, verdict } from '../status-view.ts'

const T0 = Date.UTC(2026, 10, 9, 8, 0)
const min = 60_000

test('a moving tick is running and gives a rate', () => {
  let s = observe(empty(), { tick: 1000, epoch: 238, at: T0 })
  s = observe(s, { tick: 1600, epoch: 238, at: T0 + min })
  assert.equal(verdict(s, T0 + min).verdict, 'running')
  assert.equal(s.rate, 10)
  assert.equal(s.incidents.length, 0)
})

test('a tick stuck for ten minutes opens a stall that the next movement closes', () => {
  let s = observe(empty(), { tick: 1000, epoch: 238, at: T0 })
  s = observe(s, { tick: 1000, epoch: 238, at: T0 + 5 * min })
  assert.equal(s.incidents.length, 0, 'five minutes is not a stall yet')
  s = observe(s, { tick: 1000, epoch: 238, at: T0 + STALL_MS })
  assert.equal(s.incidents.length, 1)
  assert.deepEqual(verdict(s, T0 + STALL_MS), { verdict: 'stalled', stuckFor: STALL_MS })
  s = observe(s, { tick: 1000, epoch: 238, at: T0 + 30 * min })
  assert.equal(s.incidents.length, 1, 'still the same stall')
  s = observe(s, { tick: 1200, epoch: 238, at: T0 + 40 * min })
  assert.equal(s.incidents[0]!.from, T0)
  assert.equal(s.incidents[0]!.to, T0 + 40 * min)
  assert.equal(verdict(s, T0 + 40 * min).verdict, 'running')
  assert.equal(s.rate, null, 'a jump across a stall is not a rate')
})

test('without a recent look we do not guess', () => {
  const s = observe(empty(), { tick: 1, epoch: 238, at: T0 })
  assert.equal(verdict(s, T0 + 3 * 3600_000).verdict, 'unknown')
})
