// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/rig.test.mts
import assert from 'node:assert/strict'
import { test } from 'node:test'

const R = await import('../rig.ts')
const { signCard, verifyCard, cardSecret } = await import('../card-sign.ts')
const { usage, cpuFamily } = await import('../usage.ts')
const { aggregate } = await import('../aggregate.ts')
const { workerReading, poolWorkerAdapter } = await import('../stats-adapter.ts')
const { epochAt, epochStart } = await import('../epoch.ts')
const { MEASURE, RIG } = await import('../config.ts')
const { FIELD_SAMPLES } = await import('../measure.ts')

type Reading = import('../rig.ts').RigReading
type Sample = import('../measure.ts').Sample

// mid epoch 238: Fri 6 Nov 2026 15:00 UTC, two days after the change
const NOW = new Date(Date.UTC(2026, 10, 6, 15))
const T = NOW.getTime()
const CUR = epochAt(NOW).epoch

const rd = (over: Partial<Reading> = {}): Reading => ({
  source: 'log',
  worker: 'QC.4090-rig-a',
  at: T - 60_000,
  epoch: CUR,
  hw: { gpu: 'RTX 4090', gpuCount: 4, cpu: 'Xeon E5-2696 v3', threads: 72, mode: 'gpu' },
  solutions: 6000,
  solPerHour: 2400,
  uptimeMin: 300,
  its: { CUDA: 796 },
  rejected: 10,
  series: [],
  faults: [],
  ...over,
})

/* ---------------- status ---------------- */

test('status: mining when settled, fresh and finding solutions', () => {
  const s = R.rigStatus(rd(), NOW)
  assert.equal(s.status, 'mining')
  assert.equal(s.title, 'Mining')
})

test('status: warming up in the first 20 minutes, early under 2 hours', () => {
  assert.equal(R.rigStatus(rd({ uptimeMin: 5, solutions: 30 }), NOW).status, 'warming')
  assert.equal(R.rigStatus(rd({ uptimeMin: MEASURE.minWindowMin - 0.5 }), NOW).status, 'warming')
  const e = R.rigStatus(rd({ uptimeMin: 90 }), NOW)
  assert.equal(e.status, 'early')
  assert.match(e.line, /1\.3 to 1\.5x/)
  assert.equal(R.rigStatus(rd({ uptimeMin: MEASURE.warmupMin }), NOW).status, 'mining')
})

test('status: waiting without a reading, no signal when the reading is stale for its source', () => {
  assert.equal(R.rigStatus(null, NOW).status, 'waiting')
  assert.equal(R.rigStatus(rd({ at: T - (RIG.noSignalMin.log + 1) * 60_000 }), NOW).status, 'no-signal')
  assert.equal(R.rigStatus(rd({ at: T - (RIG.noSignalMin.log - 1) * 60_000 }), NOW).status, 'mining')
  // pool stats refresh often, so they go stale sooner
  assert.equal(R.rigStatus(rd({ source: 'pool', at: T - (RIG.noSignalMin.pool + 1) * 60_000 }), NOW).status, 'no-signal')
  assert.match(R.rigStatus(rd({ at: T - 3 * 3600_000 }), NOW).line, /3 h/)
})

test('status: idle at the epoch change, from the clock or from the pool', () => {
  const change = new Date(epochStart(CUR).getTime() + 15 * 60_000)
  const fresh = (o: Partial<Reading>) => rd({ at: change.getTime() - 60_000, ...o })
  assert.equal(R.rigStatus(fresh({ solutions: 0, uptimeMin: 400 }), change).status, 'idle')
  assert.equal(R.rigStatus(fresh({ epoch: CUR - 1 }), change).status, 'idle')
  // once the new epoch's work comes in, it is mining again
  assert.equal(R.rigStatus(fresh({ solutions: 40, rejected: 0, uptimeMin: 400 }), change).status, 'mining')
  assert.equal(R.rigStatus(rd({ epochIdle: true }), NOW).status, 'idle')
})

test('status: needs a look for faults, zero solutions after 20 min, or many rejected', () => {
  assert.equal(R.rigStatus(rd({ faults: ['Out of memory'] }), NOW).status, 'look')
  const zero = R.rigStatus(rd({ uptimeMin: 34, solutions: 0 }), NOW)
  assert.equal(zero.status, 'look')
  assert.match(zero.line, /0 solutions after 34 min/)
  assert.equal(R.rigStatus(rd({ solutions: 80, rejected: 20 }), NOW).status, 'look')
})

/* ---------------- coach ---------------- */

const coach = (o: Partial<Reading>, s?: import('../rig.ts').Standing) => {
  const r = rd(o)
  return R.coachLine(r, R.rigStatus(r, NOW), s)
}

test('coach: one line, the most urgent first', () => {
  assert.equal(coach({}).text, 'Looks healthy, leave it.')
  assert.equal(coach({ at: T - 5 * 3600_000 }).id, 'no-signal')
  assert.equal(coach({ epochIdle: true }).id, 'idle')
  const f = coach({ faults: ['The NVIDIA driver is too old'] })
  assert.equal(f.id, 'fault')
  assert.equal(f.doctor, true)
  assert.equal(coach({ uptimeMin: 25, solutions: 0, restarts: 1 }).text, '0 solutions after 20 min and one restart: close it.')
  assert.equal(coach({ uptimeMin: 25, solutions: 0 }).id, 'restart')
})

test('coach: a starving CPU is named with its numbers, even while warming up', () => {
  const c = coach({ hw: { gpu: 'RTX 5080', gpuCount: 2, cpu: 'EPYC 7B13', threads: 6, mode: 'gpu' }, uptimeMin: 10, solutions: 20 })
  assert.equal(c.text, 'CPU may be starving the cards: 6 threads for 2 GPUs.')
  // 24 threads for 2 cards is enough
  assert.equal(coach({ hw: { gpu: 'RTX 5080', gpuCount: 2, cpu: 'EPYC', threads: 24, mode: 'gpu' } }).id, 'healthy')
  // a CPU-only rig never gets the GPU rule
  assert.equal(coach({ hw: { cpu: 'Ryzen 9 7950X', threads: 4, mode: 'cpu' } }).id, 'healthy')
})

test('coach: warming, rejected, early, slow', () => {
  assert.match(coach({ uptimeMin: 8, solutions: 10 }).text, /Come back in 12 min/)
  assert.match(coach({ solutions: 1000, rejected: 70 }).text, /^6\.5% rejected/)
  assert.equal(coach({ uptimeMin: 60 }).id, 'early')
  const slow = { kind: 'ok', yours: 300, median: 600, ratio: 0.5, n: 9, epoch: CUR, unit: 'card', label: 'RTX 4090', tags: [], pct: 8, band: 'low', enough: true } as const
  assert.equal(coach({}, slow).id, 'slow')
  // with few rigs, slow is not claimed
  assert.equal(coach({}, { ...slow, n: 3, enough: false }).id, 'healthy')
})

/* ---------------- against similar rigs ---------------- */

test('percentile: linear between the quartiles, extended and clamped outside', () => {
  assert.equal(R.approxPercentile(600, 500, 600, 700), 50)
  assert.equal(R.approxPercentile(500, 500, 600, 700), 25)
  assert.equal(R.approxPercentile(650, 500, 600, 700), 63)
  assert.equal(R.approxPercentile(700, 500, 600, 700), 75)
  assert.equal(R.approxPercentile(800, 500, 600, 700), 99)
  assert.equal(R.approxPercentile(100, 500, 600, 700), 1)
  // an uneven spread uses each side's own slope
  assert.equal(R.approxPercentile(550, 400, 500, 900), 53)
  // no spread, no percentile
  assert.equal(R.approxPercentile(600, 600, 600, 600), undefined)
  assert.equal(R.approxPercentile(600, undefined, 600, 700), undefined)
})

const sample = (i: number, perCard: number, epoch = CUR, cards = 4): Sample => ({
  v: 1,
  source: 'log',
  at: T - i * 1000,
  key: `${cards}x RTX 4090 | EPYC | gpu`,
  hw: { cpu: 'EPYC', gpu: 'RTX 4090', gpuCount: cards, mode: 'gpu', owner: i % 2 ? 'rented' : 'own', host: i % 2 ? 'Clore.ai' : undefined, os: 'linux' },
  result: { epoch, solPerHour: perCard * cards, uptimeMin: 300 },
  dedupe: `h${i}`,
})

test('standing: per card against the median for the same hardware, with n and labels', () => {
  const sum = aggregate([500, 550, 600, 650, 700, 750].map((v, i) => sample(i, v)), CUR, T)
  const s = R.standing(rd({ solPerHour: 4 * 700 }), sum)
  assert.equal(s.kind, 'ok')
  if (s.kind !== 'ok') return
  assert.equal(s.unit, 'card')
  assert.equal(s.yours, 700)
  assert.equal(s.median, 625)
  assert.equal(s.n, 6)
  assert.equal(s.enough, true)
  assert.ok(s.pct! > 75 && s.pct! < 95)
  assert.equal(s.band, 'high')
  assert.equal(R.vsMedian(s), '+12% vs median')
  assert.deepEqual(s.tags, ['self-reported'])
})

test('standing: few data is labelled and not enough for a card; no data says so', () => {
  const few = R.standing(rd(), aggregate([sample(1, 600), sample(2, 640)], CUR, T))
  assert.equal(few.kind, 'ok')
  if (few.kind === 'ok') {
    assert.ok(few.tags.includes('few data'))
    assert.equal(few.enough, false)
  }
  // the field runs: one 4090 rig, our own run, older
  const field = R.standing(rd(), aggregate(FIELD_SAMPLES, CUR, T))
  assert.equal(field.kind, 'ok')
  if (field.kind === 'ok') {
    assert.equal(field.median, 610)
    assert.equal(field.pct, undefined)
    assert.deepEqual(field.tags, ['our own run', 'few data', 'older'])
  }
  assert.equal(R.standing(rd({ hw: { gpu: 'RTX 2060', gpuCount: 1, mode: 'gpu' } }), aggregate(FIELD_SAMPLES, CUR, T)).kind, 'none')
  assert.equal(R.standing(rd({ solPerHour: undefined }), null).kind, 'none')
})

/* ---------------- cost per solution ---------------- */

test('cost per solution: the user own daily cost over solutions per day, nothing else', () => {
  // 28 USD a day at 2,400 sol/h: 28 / 57,600
  const c = R.rigCost(28, { solPerHour: 2400 })!
  assert.ok(Math.abs(c - 28 / 57_600) < 1e-12)
  assert.equal(R.fmtCost(c), '0.0005')
  assert.equal(R.fmtCost(0.0214), '0.021')
  assert.equal(R.fmtCost(1.5), '1.50')
  assert.equal(R.rigCost(undefined, { solPerHour: 2400 }), undefined)
  assert.equal(R.rigCost(0, { solPerHour: 2400 }), undefined)
  assert.equal(R.rigCost(28, { solPerHour: 0 }), undefined)
  assert.equal(R.rigCost(28, null), undefined)
})

/* ---------------- epoch strip ---------------- */

test('epoch strip: progress, day and time left', () => {
  const e = R.epochStrip(NOW)
  assert.equal(e.epoch, CUR)
  assert.equal(e.day, 3)
  assert.ok(Math.abs(e.frac - (2 * 24 + 3) / 168) < 1e-9)
  assert.equal(e.left, '4 d 21 h')
  assert.match(e.payout, /calculated after each weekly epoch ends/)
})

/* ---------------- log readings ---------------- */

const LOG = `2026-11-06 12:00:02.114 INFO  qli-Client 3.2.1 starting
2026-11-06 12:00:02.120 INFO  worker: QC.4090-rig-a
2026-11-06 12:00:02.121 INFO  backend: GPU, threads: 6
2026-11-06 12:00:03.001 INFO  GPU 0: NVIDIA GeForce RTX 4090 (24564 MiB)
2026-11-06 12:00:03.002 INFO  GPU 1: NVIDIA GeForce RTX 4090 (24564 MiB)
2026-11-06 12:30:00.000 INFO  E:238 | SOL: 300/300 | [CUDA] 400 it/s
2026-11-06 13:30:00.000 INFO  E:238 | SOL: 1500/1504 (R:4) | [CUDA] 402 it/s
2026-11-06 14:00:00.000 INFO  E:238 | SOL: 100/100 | [CUDA] 401 it/s
2026-11-06 14:58:00.000 INFO  E:238 | SOL: 1300/1302 (R:5) | [CUDA] 399 it/s`

test('log reading: numbers, restarts, a sol/h series and the real time of the last line', () => {
  const r = R.readingFromLog(LOG, 'QC.4090-rig-a', NOW)
  assert.equal(r.source, 'log')
  assert.equal(r.epoch, 238)
  assert.equal(r.at, Date.UTC(2026, 10, 6, 14, 58))
  assert.equal(r.restarts, 1)
  assert.equal(r.hw.gpuCount, 2)
  assert.equal(r.hw.threads, 6)
  assert.deepEqual(r.its, { CUDA: 399 })
  assert.equal(r.series.length, 3)
  assert.equal(r.series[0]!.solPerHour, 1200)
  assert.equal(r.series[1]!.solPerHour, 200)
  assert.equal(R.rigStatus(r, NOW).status, 'mining')
  assert.match(R.coachLine(r, R.rigStatus(r, NOW)).text, /6 threads for 2 GPUs/)
  assert.equal(R.perCard(r), r.solPerHour! / 2)
})

/* ---------------- my rigs in localStorage ---------------- */

const mem = (init?: string) => {
  const m = new Map<string, string>(init === undefined ? [] : [[R.RIGS_KEY, init]])
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }
}

test('rigs: save and load round-trip, never more than the cap, newest first', () => {
  const s = mem()
  let list = R.upsertRig([], { worker: 'QC.a', gpu: 'RTX 4090', gpuCount: 2, dailyCost: 12 }, 1)
  list = R.upsertRig(list, { worker: 'QC.b', cpu: 'Ryzen 9 7950X' }, 2)
  list = R.upsertRig(list, { worker: 'QC.a', threads: 32 }, 3)
  assert.equal(R.saveRigs(list, s), true)
  const back = R.loadRigs(s)
  assert.deepEqual(back.map(r => r.worker), ['QC.b', 'QC.a'])
  assert.equal(back[1]!.threads, 32)
  assert.equal(back[1]!.dailyCost, 12)
  assert.equal(back[1]!.added, 1)
  let many: import('../rig.ts').MyRig[] = []
  for (let i = 0; i < 20; i++) many = R.upsertRig(many, { worker: `QC.r${i}` })
  assert.equal(many.length, RIG.maxRigs)
  assert.equal(R.removeRig(back, 'QC.a').length, 1)
})

test('rigs: storage that throws, is missing or holds junk gives an empty list, never an error', () => {
  const boom = {
    getItem: () => {
      throw new Error('SecurityError')
    },
    setItem: () => {
      throw new Error('QuotaExceededError')
    },
  }
  assert.deepEqual(R.loadRigs(boom), [])
  assert.equal(R.saveRigs([{ worker: 'QC.a', added: 0 }], boom), false)
  assert.deepEqual(R.loadRigs(null), [])
  assert.equal(R.saveRigs([], null), false)
  assert.deepEqual(R.loadRigs(mem('{not json')), [])
  assert.deepEqual(R.loadRigs(mem('{"worker":"QC.a"}')), [])
  // bad rows are dropped one by one; duplicates once
  const rows = JSON.stringify([{ worker: 'QC.ok', dailyCost: -4, gpuCount: 99 }, { worker: 'nope' }, { worker: 'QC.ok' }, null, 7])
  const out = R.loadRigs(mem(rows))
  assert.equal(out.length, 1)
  assert.equal(out[0]!.dailyCost, undefined)
  assert.equal(out[0]!.gpuCount, undefined)
  // the default store works under node too, where localStorage may not exist
  assert.ok(Array.isArray(R.loadRigs()))
})

test('rigs: no wallet or seed survives into storage', () => {
  const ADDR = `${'A'.repeat(56)}BCDE`
  const SEED = 'abcdefghijklmnopqrstuvwxyz'.repeat(3).slice(0, 55)
  assert.equal(R.cleanRig({ worker: `QC.${ADDR}` }), null)
  const r = R.cleanRig({ worker: 'QC.a', gpu: ADDR, cpu: SEED })!
  assert.equal(r.gpu, undefined)
  assert.equal(r.cpu, undefined)
})

test('rigs: the last reading keeps numbers only and comes back as a log reading', () => {
  const s = mem()
  const reading = R.readingFromLog(LOG, 'QC.a', NOW)
  R.saveRigs(R.upsertRig([], { worker: 'QC.a', gpu: 'RTX 4090', gpuCount: 2, last: R.toStored(reading) }), s)
  const raw = s.m.get(R.RIGS_KEY)!
  assert.ok(!raw.includes('qli-Client') && !raw.includes('INFO'))
  const back = R.storedReading(R.loadRigs(s)[0]!)!
  assert.equal(back.source, 'log')
  assert.equal(back.solPerHour, reading.solPerHour)
  assert.equal(back.series.length, 3)
})

/* ---------------- demo ---------------- */

test('demo: one rig per state, all labelled demo', () => {
  const d = R.demoRigs(NOW)
  const states = d.map(x => R.rigStatus(x.reading, NOW).status)
  assert.deepEqual(new Set(states), new Set(['mining', 'warming', 'early', 'idle', 'no-signal', 'look']))
  assert.ok(d.every(x => x.reading.source === 'demo'))
  assert.equal(R.coachLine(d[1]!.reading, R.rigStatus(d[1]!.reading, NOW)).text, 'CPU may be starving the cards: 6 threads for 2 GPUs.')
  assert.equal(R.coachLine(d[5]!.reading, R.rigStatus(d[5]!.reading, NOW)).id, 'close')
  assert.ok(d[0]!.reading.series.length > 1)
})

/* ---------------- share card ---------------- */

const card = () => {
  const r = rd()
  return R.cardFrom(r, R.rigStatus(r, NOW), { kind: 'none', text: '' }, { dailyCost: 28 })
}

test('card: no money unless the user turns it on; a percentile only with enough rigs', () => {
  const c = card()
  assert.equal(c.cost, undefined)
  assert.equal(c.pct, undefined)
  assert.equal(c.pc, 600)
  const r = rd()
  const withCost = R.cardFrom(r, R.rigStatus(r, NOW), { kind: 'none', text: '' }, { dailyCost: 28, withCost: true })
  assert.ok(withCost.cost! > 0)
  const ok = R.checkCard({ ...c, pct: 70 })
  assert.equal(ok.ok && ok.value.pct, undefined)
  const ok2 = R.checkCard({ ...c, pct: 70, pn: MEASURE.fewData })
  assert.equal(ok2.ok && ok2.value.pct, 70)
})

test('card: the browser may not ask for a pool card, a wallet, or numbers out of range', () => {
  const c = card()
  assert.equal(R.checkCard({ ...c, src: 'pool' }).ok, false)
  assert.equal(R.checkCard({ ...c, src: 'pool' }, { allowPool: true }).ok, true)
  assert.equal(R.checkCard({ ...c, w: 'A'.repeat(60) }).ok, false)
  assert.equal(R.checkCard({ ...c, hw: `${'A'.repeat(56)}BCDE` }).ok, false)
  assert.equal(R.checkCard({ ...c, rate: -1 }).ok, false)
  assert.equal(R.checkCard({ ...c, st: 'rich' }).ok, false)
  assert.equal(R.checkCard(null).ok, false)
})

test('card signing: round trip, tamper, wrong key, expiry', () => {
  const key = 'k'.repeat(32)
  const c = card()
  const { token, exp } = signCard(c, key, T, 600)
  assert.equal(exp, T / 1000 + 600)
  assert.deepEqual(verifyCard(token, key, T + 1000), c)
  // expired
  assert.equal(verifyCard(token, key, T + 601_000), null)
  // another key
  assert.equal(verifyCard(token, 'x'.repeat(32), T), null)
  // an edited number
  const [body, sig] = token.split('.')
  const j = JSON.parse(Buffer.from(body!, 'base64url').toString())
  j.rate = 99_999
  const forged = `${Buffer.from(JSON.stringify(j)).toString('base64url')}.${sig}`
  assert.equal(verifyCard(forged, key, T), null)
  // junk
  for (const t of ['', 'a', 'a.b', `${token}.x`, null, undefined]) assert.equal(verifyCard(t as string, key, T), null)
})

test('card signing: the key is FORUM_SECRET; production refuses without it', () => {
  assert.equal(cardSecret({ FORUM_SECRET: 's'.repeat(20) }), 's'.repeat(20))
  assert.equal(cardSecret({ FORUM_SECRET: 'short', NODE_ENV: 'production' }), null)
  assert.ok(cardSecret({ NODE_ENV: 'development' }))
})

/* ---------------- who mines with what ---------------- */

test('usage: share by GPU and CPU family, median per card, the common setup', () => {
  const cpuRig = (i: number, cpu: string, rate: number): Sample => ({
    v: 1,
    source: 'log',
    at: T,
    key: `${cpu} | cpu`,
    hw: { cpu, gpu: null, gpuCount: 0, mode: 'cpu', owner: 'own', os: 'windows' },
    result: { epoch: CUR, solPerHour: rate, uptimeMin: 300 },
    dedupe: `c${i}`,
  })
  const list = [sample(1, 600), sample(2, 640), sample(3, 700, CUR - 1), sample(3, 720), cpuRig(4, 'Ryzen 9 7950X', 60), cpuRig(5, 'Ryzen 9 9950X', 70), cpuRig(6, 'Apple M3 Pro', 38)]
  const u = usage(list, CUR)
  // rig 3 counts once, with its newest sample
  assert.equal(u.n, 6)
  const g = u.gpu.find(b => b.label === 'RTX 4090')!
  assert.equal(g.n, 3)
  assert.ok(Math.abs(g.share - 0.5) < 1e-9)
  assert.equal(g.median, 640)
  assert.equal(g.unit, 'card')
  assert.deepEqual(g.tags, ['few data'])
  const noGpu = u.gpu.find(b => b.label === 'No GPU')!
  assert.equal(noGpu.n, 3)
  assert.equal(noGpu.median, 60)
  const ry = u.cpu.find(b => b.label === 'Ryzen 9')!
  assert.equal(ry.n, 2)
  assert.equal(ry.median, 65)
  assert.equal(u.cpu.find(b => b.label === 'EPYC')!.median, undefined) // GPU hosts: share only
  assert.deepEqual(u.top, { label: 'CPU only · Windows · own', n: 3 })
  assert.equal(u.few, false)
  assert.equal(u.older, false)
  assert.equal(usage(FIELD_SAMPLES, CUR).older, true)
  assert.equal(usage([], CUR).n, 0)
})

test('usage: CPU families', () => {
  assert.equal(cpuFamily('Xeon E5-2696 v3'), 'Xeon E5')
  assert.equal(cpuFamily('Xeon Gold 6338'), 'Xeon Scalable')
  assert.equal(cpuFamily('EPYC 7B13'), 'EPYC')
  assert.equal(cpuFamily('Apple M3 Pro'), 'Apple M3')
  assert.equal(cpuFamily('Core i7-12700K'), 'Core i7')
  assert.equal(cpuFamily('Unknown'), 'Not given')
  assert.equal(cpuFamily('Snapdragon X'), 'Other')
})

/* ---------------- pool source ---------------- */

test('pool source: a worker from a fake payload becomes a reading; the adapter stays off until the API exists', () => {
  const payload = {
    epoch: CUR,
    workers: [
      { worker: 'QC.other', solutions: 1 },
      { worker: 'QC.4x4090-a', wallet: 'A'.repeat(60), solutions: 1200, onlineMinutes: 600, rejected: 4, its: 790, lastSeen: T / 1000 - 60 },
    ],
  }
  const r = workerReading(payload, 'QC.4x4090-a', NOW)!
  assert.equal(r.source, 'pool')
  assert.equal(r.solPerHour, 120)
  assert.equal(r.hw.gpu, 'RTX 4090')
  assert.equal(r.hw.gpuCount, 4)
  assert.deepEqual(r.its, { CUDA: 790 })
  assert.equal(r.at, T - 60_000)
  assert.ok(!JSON.stringify(r).includes('AAAAAAAAAA'))
  assert.equal(workerReading(payload, 'QC.missing', NOW), null)
  assert.equal(poolWorkerAdapter(), null)
})

test('text: no em dashes in what My rig says', () => {
  const lines: string[] = []
  for (const d of R.demoRigs(NOW)) {
    const st = R.rigStatus(d.reading, NOW)
    lines.push(st.line, st.title, R.coachLine(d.reading, st).text)
  }
  lines.push(R.percentileLine(70), R.epochStrip(NOW).payout)
  for (const l of lines) assert.ok(!l.includes('\u2014'), l)
})

test('eras: a rate from another algorithm era is not compared, and does not set a usage median', () => {
  // the epoch 229 field row: 2x RTX 5070 Ti at 8.9 sol/h; today a 5070 Ti makes hundreds
  const sum = aggregate(FIELD_SAMPLES, CUR, T)
  const s = R.standing(rd({ hw: { gpu: 'RTX 5070 Ti', gpuCount: 1, mode: 'gpu' }, solPerHour: 420 }), sum)
  assert.equal(s.kind, 'none')
  if (s.kind === 'none') assert.match(s.text, /epoch 229, under an older algorithm/)
  const u = usage(FIELD_SAMPLES, CUR)
  const ti = u.gpu.find(b => b.label === 'RTX 5070 Ti')
  assert.ok(ti, 'the rig still counts toward who mines with what')
  assert.equal(ti!.median, undefined)
  assert.equal(u.gpu.find(b => b.label === 'RTX 4090')!.median, 610)
})

test('uptime: compact for the big numbers', () => {
  assert.equal(R.fmtUpShort(300), '5h')
  assert.equal(R.fmtUpShort(310), '5h 10m')
  assert.equal(R.fmtUpShort(12), '12m')
  assert.equal(R.fmtUpShort(4200), '2d 22h')
})
