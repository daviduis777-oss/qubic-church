// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/ledger.test.mts
import assert from 'node:assert/strict'
import { test } from 'node:test'

const L = await import('../ledger.ts')
const V = await import('../ledger-view.ts')
const { LEDGER } = await import('../config.ts')
const { epochAt } = await import('../epoch.ts')
const W = await import('../why.ts')

type Entry = import('../ledger.ts').LedgerEntry

// mid epoch 238: Fri 6 Nov 2026 15:00 UTC
const NOW = new Date(Date.UTC(2026, 10, 6, 15))
const CUR = epochAt(NOW).epoch
const SECRET = 'test-secret-0123456789abcdef'
const ADDR = 'A'.repeat(56) + 'BCDE'
const SEED = 'abcdefghijklmnopqrstuvwxyz'.repeat(3).slice(0, 55)

const fresh = (over: { secret?: string | null } = {}) => {
  const backend = L.memoryLedger()
  let t = NOW.getTime()
  const led = L.createLedger({
    backend,
    secret: over.secret === undefined ? SECRET : over.secret,
    now: () => new Date((t += 1000)),
  })
  return { led, backend }
}
const log = (over: Record<string, unknown> = {}) => ({
  type: 'log',
  worker: 'QC.5070ti-a',
  solutions: 1400,
  uptimeMin: 300,
  gpu: 'NVIDIA GeForce RTX 5070 Ti',
  gpuCount: 1,
  cpu: 'AMD Ryzen 9 9950X 16-Core Processor',
  ...over,
})
const rental = (over: Record<string, unknown> = {}) => ({
  type: 'rental',
  worker: 'QC.5080-rent',
  hours: 12,
  gpu: 'RTX 5080',
  gpuCount: 7,
  ...over,
})
const entries = (b: ReturnType<typeof L.memoryLedger>) =>
  b.state.rows.map(r => JSON.parse(r) as Entry)

/* ---------------- the chain ---------------- */

test('chain: each entry hashes the previous hash plus itself, starting from genesis', async () => {
  const { led, backend } = fresh()
  assert.equal((await led.record(log(), { ip: '1.1.1.1' })).ok, true)
  assert.equal((await led.record(rental(), { ip: '1.1.1.1' })).ok, true)
  const es = entries(backend)
  assert.equal(es.length, 3) // solutions, online hours, rental
  assert.equal(es[0]!.prev, V.GENESIS)
  assert.deepEqual(
    es.map(e => e.seq),
    [1, 2, 3]
  )
  for (let i = 1; i < es.length; i++) assert.equal(es[i]!.prev, es[i - 1]!.hash)
  for (const e of es) {
    const { hash, ...body } = e
    assert.equal(L.entryHash(body), hash)
    assert.match(hash, /^[0-9a-f]{64}$/)
  }
  const v = L.verifyChain(es)
  assert.equal(v.ok, true)
  assert.equal(v.head, es.at(-1)!.hash)
  assert.equal(backend.state.head, `3:${es.at(-1)!.hash}`)
})

test('chain: the hash covers every field, so an edited, dropped or reordered entry is caught', async () => {
  const { led, backend } = fresh()
  await led.record(log(), { ip: 'a' })
  await led.record(rental(), { ip: 'a' })
  await led.record(
    log({
      worker: 'QC.7950x-a',
      gpu: null,
      gpuCount: undefined,
      cpu: 'Ryzen 9 7950X',
      solutions: 90,
    }),
    { ip: 'a' }
  )
  const es = entries(backend)
  assert.equal(L.verifyChain(es).ok, true)

  // a bigger number
  const edited = es.map(e => ({ ...e }))
  edited[0]!.value = 14_000
  assert.deepEqual(L.verifyChain(edited), {
    ok: false,
    brokenAt: 1,
    head: es.at(-1)!.hash,
  })
  // a rewritten source, even with the hash recomputed for that one entry
  const forged = es.map(e => ({ ...e }))
  forged[1]!.source = 'pool'
  const { hash: _h, ...b } = forged[1]!
  forged[1]!.hash = L.entryHash(b)
  const fv = L.verifyChain(forged)
  assert.equal(fv.ok, false)
  assert.equal(!fv.ok && fv.brokenAt, 3) // the next entry no longer points at it
  // dropped
  assert.equal(L.verifyChain([es[0]!, es[2]!, es[3]!]).ok, false)
  // reordered
  assert.equal(L.verifyChain([es[1]!, es[0]!, ...es.slice(2)]).ok, false)
  // the whole chain re-hashed from scratch still has to start at genesis with seq 1
  assert.equal(L.verifyChain(es.slice(1)).ok, false)
})

test('chain: a tampered store shows as unverified in the totals', async () => {
  const { led, backend } = fresh()
  await led.record(log(), { ip: 'a' })
  assert.equal((await led.totals()).verified, true)
  const row = JSON.parse(backend.state.rows[0]!)
  row.value = 99_999
  backend.state.rows[0] = JSON.stringify(row)
  const led2 = L.createLedger({ backend, secret: SECRET, now: () => NOW })
  const t = await led2.totals()
  assert.equal(t.verified, false)
  const v = await led2.verify()
  assert.equal(v.ok, false)
  // a junk row is caught too
  backend.state.rows.push('not json')
  const v2 = await L.createLedger({
    backend,
    secret: SECRET,
    now: () => NOW,
  }).verify()
  assert.equal(v2.ok, false)
})

test('chain: appends are compare-and-set on the head, so a racing writer cannot fork it', async () => {
  const backend = L.memoryLedger()
  const a = L.createLedger({ backend, secret: SECRET, now: () => NOW })
  const b = L.createLedger({ backend, secret: SECRET, now: () => NOW })
  // b writes between a's read and a's append: a must re-read and chain onto b
  const read = backend.read.bind(backend)
  let once = false
  backend.read = async () => {
    const r = await read()
    if (!once) {
      once = true
      await b.record(rental({ worker: 'QC.other-b' }), { ip: 'b' })
    }
    return r
  }
  const r = await a.record(log(), { ip: 'a' })
  assert.equal(r.ok, true)
  const es = entries(backend)
  assert.equal(es.length, 3)
  assert.equal(L.verifyChain(es).ok, true)
  // the stale head is refused outright
  assert.equal(await backend.append(L.headOf(), 'x', '{}'), false)
})

test('chain: the REST backend appends through one compare-and-set script', async () => {
  const calls: unknown[] = []
  const fake = (async (_url: string, init: RequestInit) => {
    const cmds = JSON.parse(String(init.body)) as string[][]
    calls.push(cmds)
    if (cmds[0]![0] === 'EVAL')
      return new Response(JSON.stringify([{ result: 1 }]))
    if (cmds[0]![0] === 'INCR')
      return new Response(JSON.stringify([{ result: 3 }, { result: 1 }]))
    return new Response(JSON.stringify([{ result: ['{"v":1}'] }]))
  }) as typeof fetch
  const be = L.restLedger('https://kv.example', 'tok', fake)
  assert.equal(await be.append(L.headOf(), '1:abc', '{"x":1}'), true)
  const ev = (calls[0] as string[][])[0]!
  assert.equal(ev[0], 'EVAL')
  assert.match(ev[1]!, /redis\.call\('GET', KEYS\[1\]\)/)
  assert.deepEqual(ev.slice(2), [
    '2',
    L.HEAD_KEY,
    L.LEDGER_KEY,
    L.headOf(),
    '1:abc',
    '{"x":1}',
    L.headOf(),
  ])
  assert.equal(await be.hit('k', 60), 3)
  assert.deepEqual((await be.read()).rows, ['{"v":1}'])
  // a failed read is reported, never thrown
  const down = L.restLedger(
    'https://kv.example',
    'tok',
    (async () => new Response('', { status: 500 })) as typeof fetch
  )
  assert.deepEqual(await down.read(), { rows: [], ok: false })
})

/* ---------------- tags: HMAC for lookup, a short public name for display ---------------- */

test('tags: the worker is stored as an HMAC plus a shortened display form, never in full', async () => {
  const { led, backend } = fresh()
  await led.record(log({ worker: 'QC.4090-rack-garage-2' }), {
    ip: '203.0.113.9',
  })
  const raw = backend.state.rows.join('\n')
  assert.doesNotMatch(raw, /4090-rack-garage-2/)
  assert.doesNotMatch(raw, /203\.0\.113\.9/)
  const e = entries(backend)[0]!
  assert.equal(e.tag, L.workerTag('QC.4090-rack-garage-2', SECRET))
  assert.match(e.tag, /^[0-9a-f]{32}$/)
  assert.equal(e.show, 'QC.4090-rac…e-2')
  // keyed: another secret gives another tag; the lookup is case-insensitive like the pool
  assert.notEqual(
    L.workerTag('QC.a', SECRET),
    L.workerTag('QC.a', 'another-secret-0123456789')
  )
  assert.equal(L.workerTag('QC.Rig-A', SECRET), L.workerTag('qc.rig-a', SECRET))
  // the API never hands out the HMAC
  const w = await led.forWorker('QC.4090-rack-garage-2')
  assert.ok(w)
  assert.doesNotMatch(JSON.stringify(w), new RegExp(e.tag))
  assert.doesNotMatch(JSON.stringify(await led.totals()), new RegExp(e.tag))
})

test('tags: display and anonymised forms', () => {
  assert.equal(V.displayTag('QC.5070ti-a'), 'QC.5070ti-a')
  assert.equal(V.displayTag('QC.abcdefghijkl'), 'QC.abcdefghijkl')
  assert.equal(V.displayTag('QC.abcdefghijklm'), 'QC.abcdefgh…klm')
  assert.equal(V.anonTag('QC.5070ti-a'), 'QC.5070··')
  assert.equal(V.anonTag('QC.4090-rac…e-2'), 'QC.4090··')
  assert.equal(V.anonTag('QC.ab'), 'QC.ab··')
})

/* ---------------- validation ---------------- */

test('validation: a log gives solutions and online hours; a save from Fix my rig adds the diagnosis', () => {
  const r = L.buildEntries(log({ saved: true }), NOW)
  assert.equal(r.ok, true)
  if (!r.ok) return
  assert.deepEqual(
    r.value.map(d => [d.kind, d.value, d.unit, d.source, d.epoch]),
    [
      ['solutions', 1400, 'solutions', 'log', CUR],
      ['rig-online-hours', 5, 'h', 'log', CUR],
      ['diagnosis-saved', 1, 'result', 'log', CUR],
    ]
  )
  assert.equal(r.value[0]!.hw, 'RTX 5070 Ti · Ryzen 9 9950X')
})

test('validation: a rental is self-reported, names its hardware, and stays within one epoch', () => {
  const r = L.buildEntries(rental(), NOW)
  assert.ok(r.ok)
  assert.deepEqual(
    r.ok && r.value.map(d => [d.kind, d.value, d.source, d.hw]),
    [['rental-hours', 12, 'self-reported', '7× RTX 5080']]
  )
  assert.equal(L.buildEntries(rental({ epoch: CUR - 1 }), NOW).ok, true)
  for (const [bad, why] of [
    [rental({ hours: 0 }), /Hours rented/],
    [rental({ hours: LEDGER.maxHours + 1 }), /Hours rented/],
    [rental({ hours: 'lots' }), /Hours rented/],
    [rental({ gpu: '', gpuCount: undefined }), /what you rented/],
    [rental({ gpuCount: 2.5 }), /Cards/],
    [rental({ gpuCount: LEDGER.maxCards + 1 }), /Cards/],
    [rental({ epoch: CUR - 2 }), /this epoch/],
    [rental({ epoch: CUR + 1 }), /this epoch/],
  ] as const)
    assert.match((L.buildEntries(bad, NOW) as { error: string }).error, why)
})

test('validation: the browser cannot claim the pool or field source, and no wallet gets in', () => {
  for (const src of ['pool', 'field']) {
    const r = L.buildEntries({ ...log(), source: src }, NOW)
    assert.ok(r.ok)
    assert.ok(r.ok && r.value.every(d => d.source === 'log'))
  }
  assert.equal(L.buildEntries({ type: 'pool', worker: 'QC.a' }, NOW).ok, false)
  assert.match(
    (L.buildEntries(log({ worker: ADDR }), NOW) as { error: string }).error,
    /wallet/
  )
  assert.match(
    (L.buildEntries(log({ gpu: `RTX ${ADDR}` }), NOW) as { error: string })
      .error,
    /wallet/
  )
  assert.match(
    (L.buildEntries(log({ cpu: SEED }), NOW) as { error: string }).error,
    /wallet/
  )
  for (const w of [
    'rig-a',
    'QC.',
    'QC.a b',
    'QC.<script>',
    'QC.' + 'x'.repeat(70),
    42,
  ])
    assert.equal(L.buildEntries(log({ worker: w }), NOW).ok, false, String(w))
  assert.equal(L.buildEntries(null, NOW).ok, false)
  assert.equal(L.buildEntries(log({ solutions: 1.5 }), NOW).ok, false)
  assert.equal(L.buildEntries(log({ solutions: -1 }), NOW).ok, false)
  assert.equal(L.buildEntries(log({ uptimeMin: 169 * 60 }), NOW).ok, false)
  // nothing worth a line: no solutions, under the first 20 minutes
  assert.match(
    (
      L.buildEntries(log({ solutions: 0, uptimeMin: 10 }), NOW) as {
        error: string
      }
    ).error,
    /Nothing to record/
  )
})

/* ---------------- limits ---------------- */

test('limits: the same line twice is written once', async () => {
  const { led, backend } = fresh()
  assert.equal((await led.record(log(), { ip: 'a' })).ok, true)
  const again = await led.record(log(), { ip: 'a' })
  assert.deepEqual(again, {
    ok: false,
    error: 'Already in the record.',
    status: 409,
  })
  // a later log of the same run adds the new lines only
  const later = await led.record(log({ solutions: 2100, uptimeMin: 300 }), {
    ip: 'a',
  })
  assert.ok(later.ok)
  assert.deepEqual(later.ok && later.value.map(e => e.kind), ['solutions'])
  assert.equal(backend.state.rows.length, 3)
})

test('limits: records per connection per day, counted after validation, like saved results', async () => {
  const { led } = fresh()
  // a refused record does not use up the quota
  for (let i = 0; i < 20; i++)
    await led.record(rental({ hours: 0 }), { ip: '9.9.9.9' })
  for (let i = 0; i < LEDGER.postsPerDay; i++)
    assert.equal(
      (
        await led.record(rental({ hours: i + 1, worker: `QC.r-${i}` }), {
          ip: '9.9.9.9',
        })
      ).ok,
      true,
      `post ${i}`
    )
  const over = await led.record(rental({ hours: 99, worker: 'QC.r-x' }), {
    ip: '9.9.9.9',
  })
  assert.equal(over.ok, false)
  assert.equal(over.status, 429)
  assert.match((over as { error: string }).error, /today's 8 records/)
  // another connection is not affected; a save from Fix my rig counts against its own quota
  assert.equal(
    (
      await led.record(rental({ hours: 99, worker: 'QC.r-x' }), {
        ip: '8.8.8.8',
      })
    ).ok,
    true
  )
  assert.equal(
    (
      await led.record(log({ worker: 'QC.r-y' }), {
        ip: '9.9.9.9',
        skipQuota: true,
      })
    ).ok,
    true
  )
})

test('limits: entries per worker per epoch', async () => {
  const { led } = fresh()
  for (let i = 0; i < LEDGER.perWorkerEpoch; i++)
    assert.equal(
      (await led.record(rental({ hours: i + 1 }), { ip: `ip-${i}` })).ok,
      true
    )
  const r = await led.record(rental({ hours: 100 }), { ip: 'z' })
  assert.equal(r.status, 429)
  assert.match(
    (r as { error: string }).error,
    /24 entries for this rig in epoch 238/
  )
  // the last epoch is its own page
  assert.equal(
    (await led.record(rental({ hours: 100, epoch: CUR - 1 }), { ip: 'z' })).ok,
    true
  )
})

test('limits: no secret, no record', async () => {
  const { led } = fresh({ secret: null })
  const r = await led.record(log(), { ip: 'a' })
  assert.equal(r.ok, false)
  assert.equal(r.status, 503)
  assert.equal(L.ledgerSecret({ NODE_ENV: 'production' }), null)
  assert.equal(
    L.ledgerSecret({ NODE_ENV: 'production', FORUM_SECRET: 'x'.repeat(16) }),
    'x'.repeat(16)
  )
  assert.ok(L.ledgerSecret({ NODE_ENV: 'development' }))
})

/* ---------------- totals ---------------- */

test('totals: overlapping logs count once per rig and epoch; rentals and diagnoses add up', async () => {
  const { led } = fresh()
  await led.record(log({ solutions: 1400, uptimeMin: 300, saved: true }), {
    ip: 'a',
  })
  await led.record(log({ solutions: 2100, uptimeMin: 420 }), { ip: 'a' }) // the same run, later: max, not sum
  await led.record(log({ solutions: 500, uptimeMin: 120, epoch: CUR - 1 }), {
    ip: 'a',
  })
  await led.record(
    log({
      worker: 'QC.7950x-a',
      gpu: null,
      gpuCount: undefined,
      cpu: 'Ryzen 9 7950X',
      solutions: 90,
      uptimeMin: 600,
    }),
    { ip: 'b' }
  )
  await led.record(rental({ hours: 12 }), { ip: 'c' })
  await led.record(rental({ hours: 6.5 }), { ip: 'c' })
  const t = await led.totals()
  assert.equal(t.solutions, 2100 + 500 + 90)
  assert.equal(t.rigs, 3)
  assert.equal(t.rentalHours, 18.5)
  assert.equal(t.onlineHours, 7 + 2 + 10)
  assert.equal(t.results, 1)
  assert.equal(t.epochs, 2)
  assert.equal(t.firstEpoch, CUR - 1)
  assert.equal(t.lastEpoch, CUR)
  assert.equal(t.verified, true)
  assert.equal(t.entries, 11)
  assert.equal(t.newest.length, LEDGER.newest)
  assert.equal(t.newest[0]!.kind, 'rental-hours') // newest first
  assert.deepEqual([...new Set(t.newest.map(e => e.show))].sort(), [
    'QC.5070··',
    'QC.5080··',
    'QC.7950··',
  ]) // anonymised
  assert.equal(t.head, t.newest[0]!.hash)
})

test('totals: once the pool reports a rig and epoch, its number stands over the logs', async () => {
  const { led } = fresh()
  await led.record(
    log({ worker: 'QC.4090-rig-a', solutions: 9000, uptimeMin: 600 }),
    { ip: 'a' }
  )
  const n = await led.ingestPool({
    epoch: CUR,
    workers: [
      {
        worker: 'QC.4090-rig-a',
        solutions: 8400,
        onlineMinutes: 610,
        gpu: 'RTX 4090',
        gpuCount: 4,
        wallet: ADDR,
      },
      { worker: 'someone-else', solutions: 1 },
      { worker: 'QC.7950x-a', solutions: 70, onlineMinutes: 5 },
    ],
  })
  assert.equal(n, 3) // two lines for the 4090 rig, solutions only for the 7950X (5 minutes is not worth a line)
  const t = await led.totals()
  assert.equal(t.solutions, 8400 + 70)
  assert.equal(t.onlineHours, 10.2)
  // ingesting the same payload again writes nothing; the wallet never lands
  assert.equal(
    await led.ingestPool({
      epoch: CUR,
      workers: [
        { worker: 'QC.4090-rig-a', solutions: 8400, onlineMinutes: 610 },
      ],
    }),
    0
  )
  const w = await led.forWorker('QC.4090-rig-a')
  assert.ok(w)
  assert.equal(w!.epochs[0]!.solutions, 8400)
  assert.ok(w!.entries.some(e => e.source === 'pool'))
  assert.equal(await led.verify().then(v => v.ok), true)
})

test('worker record: newest first, totals per epoch, unknown workers get nothing', async () => {
  const { led } = fresh()
  await led.record(log({ epoch: CUR - 1, solutions: 1400 }), { ip: 'a' })
  await led.record(log({ solutions: 300, uptimeMin: 60 }), { ip: 'a' })
  await led.record(
    rental({ worker: 'QC.5070ti-a', hours: 12, gpu: 'RTX 5080', gpuCount: 7 }),
    { ip: 'a' }
  )
  const w = await led.forWorker('QC.5070ti-a')
  assert.ok(w)
  assert.equal(w!.show, 'QC.5070ti-a')
  assert.equal(w!.total, 5)
  assert.equal(w!.entries[0]!.kind, 'rental-hours')
  assert.deepEqual(
    w!.epochs.map(e => [e.epoch, e.solutions, e.rentalHours]),
    [
      [CUR, 300, 12],
      [CUR - 1, 1400, 0],
    ]
  )
  assert.equal(await led.forWorker('QC.nobody'), null)
  assert.equal(await led.forWorker('not-a-worker'), null)
})

/* ---------------- the lines people read ---------------- */

test('lines: the journal reads as Bob wrote it, labelled by source', () => {
  const base = {
    seq: 1,
    at: 0,
    hash: 'h',
    show: 'QC.5070ti-a',
    hw: 'RTX 5070 Ti',
  }
  assert.equal(
    V.entryLine({
      ...base,
      epoch: 235,
      kind: 'solutions',
      value: 1400,
      unit: 'solutions',
      source: 'log',
    }),
    'E235 · 1,400 solutions · QC.5070ti-a · from log'
  )
  assert.equal(
    V.entryLine({
      ...base,
      epoch: 236,
      kind: 'rental-hours',
      value: 12,
      unit: 'h',
      source: 'self-reported',
      hw: '7× RTX 5080',
    }),
    'E236 · 12 h rented · 7× RTX 5080 · self-reported'
  )
  assert.equal(
    V.entryLine({
      ...base,
      epoch: 236,
      kind: 'rig-online-hours',
      value: 41.5,
      unit: 'h',
      source: 'pool',
    }),
    'E236 · 41.5 h online · QC.5070ti-a · pool'
  )
  assert.equal(
    V.entryLine(
      {
        ...base,
        epoch: 237,
        kind: 'diagnosis-saved',
        value: 1,
        unit: 'result',
        source: 'log',
      },
      { anon: true }
    ),
    'E237 · diagnosis saved · QC.5070·· · from log'
  )
  assert.equal(V.entryWhat({ kind: 'solutions', value: 1 }), '1 solution')
  assert.equal(V.shortHash('a'.repeat(64)), 'aaaaaa…aaaa')
})

/* ---------------- the why: verbatim quotes, no em dashes, no reward talk ---------------- */

test('why: the quotes are verbatim, sourced and dated', () => {
  assert.equal(
    W.MACHINE.text,
    'All depends on miners. I constructed a machine, throw computing power into it and it will do anything'
  )
  assert.equal(W.MACHINE.who, 'Come-from-Beyond')
  assert.equal(W.MACHINE.where, 'Qubic Discord')
  assert.equal(W.MACHINE.date, '20 Jul 2026')
  assert.deepEqual(
    W.ASK.map(a => `${a.text}|${a.date}`),
    [
      'ask miners|26 Aug',
      'ask miners|31 Aug',
      'ask miners|31 Aug',
      'ask miners|2 Sep',
      'ask miners|7 Sep',
      'ask miners|9 Sep',
      'ask miners|14 Sep',
      'ask miners|20 Sep',
      'ask miner devs|7 Oct',
      'ask miner devs|10 Oct',
      'ask miners|14 Oct',
      'ask miners|14 Oct',
      'ask miners|22 Oct',
    ]
  )
  const all = JSON.stringify(W)
  assert.doesNotMatch(all, /—/)
  assert.doesNotMatch(all, /airdrop|reward|earn|profit|income|\$\d|promise/i)
  assert.match(all, /2 public and one independent/)
})

/* ---------------- the share card carries "Recorded" only when the server says so ---------------- */

test('card: the browser cannot claim the record; a signed card keeps it', async () => {
  const R = await import('../rig.ts')
  const { signCard, verifyCard } = await import('../card-sign.ts')
  const card = {
    v: 1,
    src: 'log',
    w: 'QC.5070ti-a',
    hw: 'RTX 5070 Ti',
    sol: 1400,
    rate: 420,
    up: 300,
    ep: CUR,
    st: 'mining',
    rec: CUR,
  }
  const fromBrowser = R.checkCard(card)
  assert.ok(fromBrowser.ok)
  assert.equal(fromBrowser.ok && fromBrowser.value.rec, undefined)
  const { token } = signCard(
    { ...(fromBrowser.ok ? fromBrowser.value : ({} as never)), rec: CUR },
    SECRET,
    NOW.getTime()
  )
  assert.equal(verifyCard(token, SECRET, NOW.getTime())?.rec, CUR)
})
