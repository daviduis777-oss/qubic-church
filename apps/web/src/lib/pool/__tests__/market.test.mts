// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/market.test.mts
// Live rentals: parsing Vast and Clore, what qualifies, the ranking by cost per 1,000 solutions, the words.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const M = await import('../market.ts')
const { aggregate } = await import('../aggregate.ts')
const { FIELD_SAMPLES } = await import('../measure.ts')

const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

// shaped like the real Vast bundles answer (6 Nov 2026), trimmed
const vastOffer = (over: Record<string, unknown> = {}) => ({
  id: 54463551, machine_id: 153411, gpu_name: 'RTX 4090', num_gpus: 1, dph_total: 0.3807, cpu_cores_effective: 16,
  cpu_ram: 32080, reliability2: 0.9948, geolocation: 'Texas, US', rentable: true, rented: false, ...over,
})
// shaped like the Clore docs example; prices are per day
const cloreServer = (over: Record<string, unknown> = {}) => ({
  id: 6, rented: false, reliability: 0.991,
  price: { usd: { on_demand_clore: 80, spot: 40 } },
  specs: { cpu: 'AMD EPYC 7B13', cpus: '32/64', ram: 62.7, gpu: '4x NVIDIA GeForce RTX 4090', net: { cc: 'CZ' } },
  gpu_array: Array(4).fill('NVIDIA GeForce RTX 4090'),
  ...over,
})

const rates = M.ratesFrom(aggregate(FIELD_SAMPLES, 238, 0))

test('vast: one offer per row, per hour, RAM in GB, rented boxes dropped', () => {
  const [o, ...rest] = M.parseVast({ offers: [vastOffer(), vastOffer({ id: 2, rented: true }), { id: 3 }] })
  assert.equal(rest.length, 0)
  assert.deepEqual(
    { source: o!.source, id: o!.id, machine: o!.machine, gpu: o!.gpu, gpus: o!.gpus, threads: o!.threads, ramGb: o!.ramGb, country: o!.country },
    { source: 'Vast.ai', id: '54463551', machine: 'vast:153411', gpu: 'RTX 4090', gpus: 1, threads: 16, ramGb: 31, country: 'Texas, US' },
  )
  assert.ok(Math.abs(o!.usdHour - 0.3807) < 1e-9)
  assert.deepEqual(M.parseVast(null), [])
  assert.deepEqual(M.parseVast({ offers: 'x' }), [])
})

test('clore: the per-day price becomes per hour, threads from "cores/threads", mixed boxes skipped', () => {
  const [o] = M.parseClore({ servers: [cloreServer()] })
  assert.equal(o!.gpu, 'RTX 4090')
  assert.equal(o!.gpus, 4)
  assert.ok(Math.abs(o!.usdHour - 80 / 24) < 1e-9, 'per day / 24')
  assert.equal(o!.threads, 64)
  assert.equal(o!.ramGb, 63)
  assert.equal(o!.country, 'CZ')
  const mixed = cloreServer({ gpu_array: ['NVIDIA GeForce RTX 4090', 'NVIDIA GeForce RTX 3090'] })
  assert.equal(M.parseClore({ servers: [mixed, cloreServer({ rented: true })] }).length, 0)
  // no gpu_array: the "4x" prefix still counts the cards
  const [p] = M.parseClore({ servers: [cloreServer({ gpu_array: undefined })] })
  assert.equal(p!.gpus, 4)
})

test('qualify: reliability, threads per card, RAM, and a price sanity range that catches unit mistakes', () => {
  const base = M.parseVast({ offers: [vastOffer()] })[0]!
  assert.equal(M.rejectReason(base), null)
  assert.match(M.rejectReason({ ...base, reliability: 0.95 })!, /reliability/)
  assert.match(M.rejectReason({ ...base, gpus: 2, threads: 16 })!, /12 CPU threads/)
  assert.match(M.rejectReason({ ...base, ramGb: 8 })!, /16 GB/)
  // a per-day price read as per hour, or the reverse, never reaches the screen
  assert.match(M.rejectReason({ ...base, usdHour: 20 })!, /price/)
  assert.match(M.rejectReason({ ...base, usdHour: 0.01 })!, /price/)
  // unknown values are not held against a box
  assert.equal(M.rejectReason({ ...base, threads: undefined, ramGb: undefined, reliability: undefined }), null)
})

test('rates: only measured GPU-only cards, per card, with the epoch and the older flag', () => {
  const r4090 = rates.get('RTX 4090')!
  assert.equal(r4090.perCard, 610)
  assert.equal(r4090.epoch, 233)
  assert.ok(rates.has('RTX 5080'))
  assert.ok(!rates.has('RTX 5090'), 'never measured: never ranked')
  assert.ok(!rates.has('RTX 5070 Ti'), 'its only run is from epoch 229, another era: never mixed with 233')
  assert.match(M.rateNote(r4090), /epoch 233/)
})

test('rank: cheapest 1,000 solutions first, one offer per machine, the size respected, unmeasured apart', () => {
  const offers = [
    ...M.parseVast({
      offers: [
        vastOffer({ id: 1, machine_id: 10, num_gpus: 1, dph_total: 0.5, cpu_cores_effective: 16 }),
        vastOffer({ id: 2, machine_id: 10, num_gpus: 1, dph_total: 0.45, cpu_cores_effective: 16 }), // same machine, cheaper
        vastOffer({ id: 3, machine_id: 11, gpu_name: 'RTX 5080', num_gpus: 1, dph_total: 0.25, cpu_cores_effective: 16 }),
        vastOffer({ id: 4, machine_id: 12, gpu_name: 'RTX 5090', num_gpus: 1, dph_total: 0.6, cpu_cores_effective: 16 }),
        vastOffer({ id: 5, machine_id: 13, num_gpus: 8, dph_total: 3.2, cpu_cores_effective: 128 }),
      ],
    }),
  ]
  const { ranked, unmeasured } = M.rank(offers, rates, 'small')
  assert.ok(ranked.every(r => r.gpus <= 2), 'small means one or two cards')
  const per1k = ranked.map(r => r.usdPer1k)
  assert.deepEqual(per1k, [...per1k].sort((a, b) => a - b))
  assert.equal(new Set(ranked.map(r => r.machine)).size, ranked.length, 'one offer per machine')
  assert.equal(ranked.find(r => r.machine === 'vast:10')!.id, '2', 'the cheaper offer of a machine wins')
  // 0.45 $/h / 610 sol/h * 1000
  assert.ok(Math.abs(ranked.find(r => r.id === '2')!.usdPer1k - (0.45 / 610) * 1000) < 1e-9)
  assert.deepEqual(unmeasured.map(u => u.gpu), ['RTX 5090'])
  assert.equal(unmeasured[0]!.cardHourFrom, 0.6)
  const big = M.rank(offers, rates, 'large').ranked
  assert.deepEqual(big.map(b => b.id), ['5'])
  assert.equal(big[0]!.solHour, 8 * 610)
})

test('prompt block: live offers with the time and the rate source, or a plain "not available"', () => {
  const live = { at: Date.parse('2026-11-06T12:40:00Z'), offers: M.parseVast({ offers: [vastOffer()] }), sources: [{ name: 'Vast.ai' as const, ok: true }, { name: 'Clore.ai' as const, ok: false }] }
  const b = M.marketPromptBlock(live, rates)
  assert.match(b, /12:40 UTC/)
  assert.match(b, /1x RTX 4090 on Vast\.ai \(offer 54463551\), \$0\.38\/h, about 610 sol\/h/)
  assert.match(b, /not fetched: Clore\.ai/)
  assert.match(b, /credits bought with crypto/)
  assert.match(b, /Never present a price or rate as income/)
  assert.match(M.marketPromptBlock(null, rates), /not available/)
  assert.doesNotMatch(b, /—/)
})

test('policy: Vast mining only on crypto-bought credits, said in the app and in the static list', () => {
  assert.match(M.MARKET_POLICY['Vast.ai'].mining, /crypto/)
  assert.match(M.MARKET_POLICY['Clore.ai'].open, /ref_id=/, 'Clore opens with our referral link')
  assert.match(src('../config.ts'), /Mining only on credits bought with crypto/)
})

test('wiring: the gated route, Rent a box shows the live list first, Maria gets the block, Clore key from env', () => {
  const route = src('../../../app/api/pool/market/route.ts')
  assert.match(route, /poolAllowed\(req\)/)
  const flows = src('../../../components/pool/maria/flows.tsx')
  assert.match(flows, /cards\.unshift\(<LiveRentals key="live" scale=\{a\.scale as Scale\} \/>\)/)
  const maria = src('../../../app/api/pool/maria/route.ts')
  assert.match(maria, /marketPromptBlock\(live, ratesFrom\(measured\)\)/)
  assert.match(maria, /setTimeout\(\(\) => r\(null\), 2500\)/, 'a slow marketplace never holds up a reply')
  const fetcher = src('../market-fetch.ts')
  assert.match(fetcher, /process\.env\.CLORE_API_KEY/)
  assert.match(fetcher, /headers: \{ auth: key/)
  assert.doesNotMatch(fetcher, /console\.(log|warn)\([^)]*key/, 'the key is never logged')
})
