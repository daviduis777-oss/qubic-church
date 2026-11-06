// node --experimental-strip-types --test apps/web/src/lib/bpp/__tests__/*.mts
// The BPP-9000 record: sealing, checking, the chain, the stats and Trader Maria.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const R = await import('../record.ts')
const V = await import('../record-view.ts')
const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

const H = Date.parse('2026-11-18T12:00:00Z') / 1000
const at = (hour: number, min: number) => (hour + min * 60) * 1000
const call = (side: 'up' | 'down' | 'skip') => async () => ({ side, net: 'abc', epoch: 240, source: 'test' })
const none = async () => null
const candle = (open: number, close: number) => async () => ({ open, close, source: 'test 1h' })

test('tick: seals the current hour once, never in its last minute, never without a call', async () => {
  const backend = R.memoryRecord()
  assert.deepEqual(await R.tick({ backend, now: at(H, 5), call: none, candle: none }), { ok: true, sealed: null, checked: [] })
  const a = await R.tick({ backend, now: at(H, 5), call: call('up'), candle: none })
  assert.equal(a.sealed, H)
  const b = await R.tick({ backend, now: at(H, 30), call: call('down'), candle: none })
  assert.equal(b.sealed, null, 'a second tick in the same hour seals nothing')
  const late = R.memoryRecord()
  assert.equal((await R.tick({ backend: late, now: at(H, 59.5), call: call('up'), candle: none })).sealed, null, 'the last minute is too late')
  const { entries } = await R.readRecord(backend)
  assert.equal(entries.length, 1)
  assert.equal(entries[0]!.kind, 'call')
})

test('tick: checks a closed hour against its candle, once, after it settled', async () => {
  const backend = R.memoryRecord()
  await R.tick({ backend, now: at(H, 2), call: call('up'), candle: none })
  assert.deepEqual((await R.tick({ backend, now: at(H, 60.5), call: none, candle: candle(100, 101) })).checked, [], 'not before the candle settles')
  assert.deepEqual((await R.tick({ backend, now: at(H, 62), call: none, candle: candle(100, 101) })).checked, [H])
  assert.deepEqual((await R.tick({ backend, now: at(H, 70), call: none, candle: candle(100, 99) })).checked, [], 'never twice')
  const hours = V.joinRecord((await R.readRecord(backend)).entries)
  assert.equal(hours.length, 1)
  assert.equal(hours[0]!.went, 'up')
  assert.equal(hours[0]!.hit, true)
})

test('chain: every entry hashes its predecessor; tampering breaks it from that entry on', async () => {
  const backend = R.memoryRecord()
  await R.tick({ backend, now: at(H, 2), call: call('up'), candle: none })
  await R.tick({ backend, now: at(H, 62), call: call('down'), candle: candle(100, 101) })
  const { entries } = await R.readRecord(backend)
  assert.equal(entries.length, 3)
  assert.equal(R.verifyRecord(entries).ok, true)
  const forged = entries.map(e => ({ ...e }))
  ;(forged[0] as { side: string }).side = 'down'
  const v = R.verifyRecord(forged)
  assert.equal(v.ok, false)
  assert.equal((v as { brokenAt: number }).brokenAt, 1)
})

test('tick: two ticks at once append the call once', async () => {
  const backend = R.memoryRecord()
  const [a, b] = await Promise.all([R.tick({ backend, now: at(H, 3), call: call('up'), candle: none }), R.tick({ backend, now: at(H, 3), call: call('up'), candle: none })])
  assert.equal([a.sealed, b.sealed].filter(x => x === H).length, 1)
  assert.equal((await R.readRecord(backend)).entries.length, 1)
})

test('stats: hits, rate, runs, skips, luck', () => {
  const mk = (i: number, side: 'up' | 'down' | 'skip', went: 'up' | 'down' | null): import('../record-view.ts').Hour => ({
    hour: H + i * 3600, side, net: 'n', epoch: 240, sealedAt: '', went, open: 1, close: 1, hit: went == null || side === 'skip' ? null : side === went,
  })
  const hours = [mk(0, 'up', 'up'), mk(1, 'up', 'down'), mk(2, 'down', 'down'), mk(3, 'down', 'down'), mk(4, 'skip', 'up'), mk(5, 'up', null)]
  const s = V.recordStats(hours, (H + 6 * 3600) * 1000)
  assert.equal(s.checked, 4)
  assert.equal(s.hits, 3)
  assert.equal(s.rate, 75)
  assert.equal(s.run, 2)
  assert.equal(s.bestRun, 2)
  assert.equal(s.skipped, 1)
  assert.equal(s.pending, 1)
  assert.equal(s.luck, null, 'under 10 hours the luck line is not drawn')
})

test('up means close >= open, the prediction-market rule', () => {
  assert.equal(V.wentOf(100, 100), 'up')
  assert.equal(V.wentOf(100, 99.99), 'down')
})

test('trader maria: venues, break-even, her curve and the what-if', () => {
  const [market, broker] = V.VENUES
  assert.ok(Math.abs(V.betBreakEven(market!) - 52.75) < 0.01, `market break-even ${V.betBreakEven(market!)}`)
  assert.ok(Math.abs(V.betBreakEven(broker!) - 54.05) < 0.01)
  // the run of bets needs more than one bet, and the what-if turns exactly there
  assert.ok(Math.abs(V.breakEven(market!) - 53.93) < 0.05, `market typical break-even ${V.breakEven(market!)}`)
  assert.ok(Math.abs(V.breakEven(broker!) - 55.2) < 0.05)
  for (const v of [market!, broker!]) {
    assert.ok(V.whatIf(V.breakEven(v) - 0.1, 168, v) < 100)
    assert.ok(V.whatIf(V.breakEven(v) + 0.1, 168, v) > 100)
  }
  const hours = [true, true, false].map((hit, i) => ({ hour: i, side: 'up' as const, net: '', epoch: 0, sealedAt: '', went: 'up' as const, open: 1, close: 1, hit }))
  const c = V.traderCurve(hours, broker!)
  assert.equal(c.length, 4)
  assert.ok(Math.abs(c[1]! - 104.25) < 1e-9)
  assert.ok(Math.abs(c[3]! - 100 * 1.0425 * 1.0425 * 0.95) < 1e-9)
  // a coin loses money at both venues; above break-even it grows
  assert.ok(V.whatIf(50, 168, market!) < 100)
  assert.ok(V.whatIf(56, 168, market!) > 100)
  assert.ok(V.whatIf(54, 168, broker!) < 100)
})

test('wiring: the tick is public and rate-limited, the live call waits for the core, Maria links her X', () => {
  const tickRoute = src('../../../app/api/bpp/tick/route.ts')
  assert.match(tickRoute, /tick\(\{ backend, call: liveCall, candle: hourCandle \}\)/)
  assert.match(tickRoute, /PER_MINUTE/)
  assert.match(src('../live-call.ts'), /return null/)
  const wf = readFileSync(new URL('../../../../../../.github/workflows/bpp-record.yml', import.meta.url), 'utf8')
  assert.match(wf, /cron: '7,37 \* \* \* \*'/)
  assert.match(wf, /https:\/\/qubic\.church\/api\/bpp\/tick/)
  assert.match(src('../../../components/bpp/TraderMaria.tsx'), /https:\/\/x\.com\/maria_aigarth/)
})
