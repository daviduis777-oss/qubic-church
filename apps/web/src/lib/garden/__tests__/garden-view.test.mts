import assert from 'node:assert/strict'
import { test } from 'node:test'
import { type Gen, homework, isIdentity, perMinute, sittings } from '../garden-view.ts'

const gen = (depth: number, ts: number): Gen => ({ hash: 'h'.repeat(59) + String.fromCharCode(97 + (depth % 26)), depth, score: 4000 - depth, ts, tick: null, gardener: 'A'.repeat(60), parent: null })

test('homework is the share of the 8760 hours called right', () => {
  assert.equal(homework(3024).toFixed(1), '65.5')
  assert.equal(homework(4380), 50)
})

test('identity: 60 capital letters, nothing else', () => {
  assert.ok(isIdentity('JFDAERVKSUOWCFTQYKMLTJEXGKRCXHVUGMGTOHUZPERGQPGIOOPQIZDECFMO'))
  assert.ok(!isIdentity('jfdaervksuowcftqykmltjexgkrcxhvugmgtohuzpergqpgiooqizdecfmo'))
  assert.ok(!isIdentity('ABC'))
})

test('births per minute from newest-first timestamps, null when too few', () => {
  assert.equal(perMinute([1000, 2000]), null)
  const t = [0, 10_000, 20_000, 30_000, 40_000, 50_000, 60_000].map(x => 1_000_000 + x)
  assert.equal(perMinute(t), 6)
  assert.equal(perMinute([5, 5, 5, 5, 5]), null)
})

test('sittings split a lineage at long gaps, in depth order', () => {
  const m = 60_000
  const gens = [gen(3, 100 * m), gen(1, 0), gen(2, 2 * m), gen(4, 101 * m), gen(5, 200 * m)]
  const s = sittings(gens, 20 * m)
  assert.deepEqual(s.map(x => x.gens), [2, 2, 1])
  assert.equal(s[1]!.from, 100 * m)
  assert.deepEqual(sittings(gens, 120 * m).map(x => x.gens), [5])
})
