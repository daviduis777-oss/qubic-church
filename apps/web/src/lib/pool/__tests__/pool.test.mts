// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/pool.test.mts
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { classifyCpu, classifyGpu, classifyRam, pick, isAsic } = await import('../hardware.ts')
const { FACTS, GLANCE, BUILDS, SOURCES } = await import('../knowledge.ts')
const { checkWallet, checkWorker, cleanWorker, suggestWorker, backendFor, buildPlan, threadsFor } = await import('../wizard.ts')
const { diagnose, RULES } = await import('../doctor.ts')
const { redactWallets } = await import('../redact.ts')
const { mariaSystemPrompt } = await import('../prompt.ts')
const { POOL } = await import('../config.ts')

const ADDR = 'A'.repeat(56) + 'BCDE'
const SEED = 'abcdefghijklmnopqrstuvwxyz'.repeat(3).slice(0, 55)

/* ---------- picker ---------- */

test('cpu verdicts follow the guide table', () => {
  const v = (s: string) => classifyCpu(s).verdict
  assert.equal(v('AMD Ryzen 9 7950X'), 'Golden')
  assert.equal(v('Ryzen 9 9950X3D'), 'Golden')
  assert.equal(v('Ryzen 9 7900X'), 'Golden')
  assert.equal(v('Ryzen 9 9900X'), 'Good')
  assert.equal(v('Ryzen 7 9700X'), 'Good')
  assert.equal(v('Ryzen 7 7700'), 'Good')
  assert.equal(v('Ryzen 7 7800X3D'), 'Good')
  assert.equal(v('Ryzen 5 7600X'), 'Works')
  assert.equal(v('Threadripper 7980X'), 'Golden')
  assert.equal(v('AMD EPYC 9654'), 'Golden')
  assert.equal(v('EPYC 9755'), 'Golden')
  assert.equal(v('Xeon Platinum 8480+'), 'Good')
  assert.equal(v('Intel Xeon E5-2680 v4'), 'Skip')
  assert.equal(v('Intel Core Ultra 7 155H'), 'Skip')
  assert.equal(v('Celeron G5905'), 'Skip')
  assert.equal(v('Intel Core i3-10100'), 'Skip')
  assert.equal(v('Ryzen 5 5600X'), 'Works')
  assert.equal(v('EPYC 7763'), 'Works')
  assert.equal(v('Intel Core i7-13700K'), 'Works')
  assert.equal(v('Apple M3 Pro'), 'Works')
  assert.equal(v('Ryzen 7 7840HS'), 'Works')
  assert.equal(v('Ryzen 5 7520U'), 'Works')
  assert.equal(v('Some Mystery Chip'), 'Unknown')
})

test('cpu avx detection drives the backend', () => {
  assert.equal(classifyCpu('Ryzen 9 7950X').avx, 'avx512')
  assert.equal(classifyCpu('Ryzen 5 5600X').avx, 'avx2')
  assert.equal(classifyCpu('Apple M2').avx, 'apple')
})

test('figures from the partner table are marked est.', () => {
  assert.ok(classifyCpu('Ryzen 9 7950X').reasons.some(r => /30 it\/s \(est\./.test(r)))
  assert.ok(classifyCpu('Apple M3 Pro').reasons.some(r => /40 it\/s \(est\./.test(r)))
})

test('gpu verdicts: NVIDIA works, AMD Radeon is unmeasured, not a flat no', () => {
  assert.equal(classifyGpu('RTX 5070 Ti')?.verdict, 'Golden')
  assert.equal(classifyGpu('RTX 4090')?.verdict, 'Good')
  assert.equal(classifyGpu('RTX 3080')?.verdict, 'Good')
  assert.equal(classifyGpu('RTX 4060')?.verdict, 'Works')
  assert.equal(classifyGpu('AMD Radeon RX 7900 XTX')?.verdict, 'Unknown')
  assert.match(classifyGpu('RX 6800')!.reasons[0]!, /^No measurements from us\. Support depends on the pool's miner\./)
  assert.match(classifyGpu('RX 9070 XT')!.reasons.join(' '), /NVIDIA\/CUDA is the proven path/)
  assert.doesNotMatch(classifyGpu('RX 9070 XT')!.reasons.join(' '), /not supported/)
  assert.equal(classifyGpu('none'), null)
  assert.equal(classifyGpu(''), null)
})

test('pick: weak CPU behind a good card is flagged', () => {
  const r = pick({ mode: 'own', cpu: 'Celeron G5905', gpu: 'RTX 5070 Ti', gpuCount: 1 })
  assert.equal(r.overall, 'Works')
  assert.ok(r.notes.some(n => /choke the card/.test(n)))
})

test('pick: under 8 cores per GPU is flagged', () => {
  const r = pick({ mode: 'own', cpu: 'Ryzen 9 7950X', gpu: 'RTX 5070 Ti', gpuCount: 4, cores: 16 })
  assert.ok(r.notes.some(n => /under 8 per card/.test(n)))
})

test('pick: shopping lists never carry prices or income', () => {
  for (const mode of ['buy', 'rent'] as const)
    for (const [scale, build] of [['small', 'entry'], ['mid', 'cpu'], ['large', 'gpu'], ['large', 'server']] as const) {
      const r = pick({ mode, scale, build, os: 'macos' })
      const text = JSON.stringify(r)
      assert.doesNotMatch(text, /\$\d|earn(ing)?s? per|profit|income|ROI/i)
      assert.ok(r.cards.some(c => c.verdict === 'Unknown' && /AMD Radeon/.test(c.title)))
      assert.ok(r.notes.some(n => /daily cost ÷ solutions per day/.test(n)))
    }
})

test('pick: buy builds follow the tiers, best first', () => {
  assert.equal(pick({ mode: 'buy', build: 'entry' }).cards[0]!.title, BUILDS.entry.title)
  assert.match(JSON.stringify(pick({ mode: 'buy', build: 'entry' }).cards[0]!.specs), /Ryzen 7 7700.*32 GB/)
  assert.match(JSON.stringify(pick({ mode: 'buy', build: 'cpu' }).cards[0]!.specs), /9950X.*32 to 64 GB DDR5/)
  assert.match(JSON.stringify(pick({ mode: 'buy', build: 'gpu' }).cards[0]!.specs), /9950X.*5070 Ti/)
  assert.match(pick({ mode: 'buy', build: 'server' }).cards[0]!.title, /EPYC 9004 \/ 9005/)
  assert.equal(pick({ mode: 'buy', build: 'cpu', os: 'macos' }).cards[0]!.title, 'A Mac with Apple Silicon')
})

test('ASICs are not for this pool', () => {
  assert.ok(isAsic('Antminer L9'))
  assert.equal(classifyGpu('Antminer L7')?.verdict, 'Skip')
  const r = pick({ mode: 'own', cpu: 'Bitmain Antminer L9' })
  assert.equal(r.overall, 'Skip')
  assert.match(r.cards[0]!.reasons.join(' '), /Dogecoin/)
  assert.ok(!isAsic('Ryzen 9 7950X'))
  assert.ok(!isAsic('RTX 5070 Ti'))
})

test('RAM follows the Academy minimum', () => {
  assert.equal(classifyRam(8).verdict, 'Skip')
  assert.equal(classifyRam(16).verdict, 'Works')
  assert.equal(classifyRam(64).verdict, 'Good')
  assert.equal(pick({ mode: 'own', cpu: 'Ryzen 9 7950X', ramGb: 8 }).overall, 'Works')
})

test('every fact and glance row has a dated source', () => {
  for (const f of [...FACTS, ...GLANCE]) {
    assert.ok(f.sources.length > 0)
    for (const id of f.sources) assert.ok(SOURCES[id].date.length > 0, id)
  }
  assert.ok(FACTS.some(f => /CUDA 12/.test(f.text)))
  assert.ok(FACTS.some(f => /16 GB.*32 GB/.test(f.text)))
  assert.ok(FACTS.some(f => /ASIC/.test(f.text)))
})

/* ---------- wizard ---------- */

test('wallet: valid 60-letter address passes, spaces ignored', () => {
  assert.deepEqual(checkWallet(ADDR), { ok: true, value: ADDR })
  assert.deepEqual(checkWallet(` ${ADDR.slice(0, 30)}\n${ADDR.slice(30)} `), { ok: true, value: ADDR })
})

test('wallet: a seed is refused with a warning', () => {
  const r = checkWallet(SEED)
  assert.equal(r.ok, false)
  assert.equal(r.ok === false && r.kind, 'seed')
  assert.match(r.ok === false ? r.message : '', /seed/)
  assert.equal(checkWallet(`my seed: ${SEED}`).ok, false)
})

test('wallet: other mistakes', () => {
  const kind = (s: string) => {
    const r = checkWallet(s)
    return r.ok ? 'ok' : r.kind
  }
  assert.equal(kind(''), 'empty')
  assert.equal(kind(ADDR.toLowerCase()), 'lowercase')
  assert.equal(kind(ADDR.slice(0, 59)), 'length')
  assert.equal(kind(`${ADDR.slice(0, 59)}1`), 'chars')
})

test('worker names: QC. prefix, allowed characters, 64 max', () => {
  assert.equal(suggestWorker('nvidia', 'RTX 5070 Ti'), 'QC.5070ti-a')
  assert.equal(suggestWorker('apple', 'M3 Pro'), 'QC.m3pro-a')
  assert.equal(suggestWorker('cpu', 'Ryzen 9 7950X'), 'QC.7950x-a')
  assert.equal(cleanWorker('my rig #1'), 'QC.my-rig-1')
  assert.equal(cleanWorker('qc.box'), 'QC.box')
  assert.equal(cleanWorker('x'.repeat(100)).length, 64)
  assert.deepEqual(checkWorker('QC.rig-a'), { ok: true })
  assert.equal(checkWorker('rig-a').ok, false)
  assert.equal(checkWorker('QC.').ok, false)
  assert.equal(checkWorker('QC.rig a').ok, false)
  assert.ok(POOL.workerPattern.test(cleanWorker('Ünïcødé rig!')))
})

test('backend and threads advice', () => {
  assert.equal(backendFor('nvidia', 'unknown').backend, 'GPU')
  assert.equal(backendFor('cpu', 'avx512').backend, 'AVX512')
  assert.equal(backendFor('cpu', 'avx2').backend, 'AVX2')
  assert.equal(backendFor('apple', 'apple').backend, 'Auto')
  assert.equal(threadsFor('cpu', 16, true).value, '16')
  assert.equal(threadsFor('cpu', 16, false).value, '14')
  assert.equal(threadsFor('cpu', undefined, false).value, 'all')
})

test('plan without a launch line falls back to the setup page with exact values', () => {
  const plan = buildPlan({ os: 'linux', hw: 'nvidia', avx: 'unknown', model: 'RTX 5070 Ti', wallet: ADDR, worker: 'QC.5070ti-a', threads: 32, dedicated: true })
  assert.equal(plan.steps[0]!.link?.href, POOL.onboardingUrl)
  assert.ok(plan.values.some(v => v.label === 'Wallet address' && v.value === ADDR))
  assert.ok(plan.values.some(v => v.label === 'Worker name' && v.value === 'QC.5070ti-a'))
  assert.ok(plan.values.some(v => v.label === 'Backend' && v.value === 'GPU'))
  assert.ok(plan.checks.some(c => c.command === 'nvidia-smi'))
  assert.ok(plan.checks.some(c => /first hour is normal/.test(c.title)))
})

test('plan warns for AMD and for NVIDIA on macOS', () => {
  assert.ok(buildPlan({ os: 'linux', hw: 'amd', avx: 'avx512', wallet: ADDR, worker: 'QC.a', dedicated: true }).warnings.length)
  assert.ok(buildPlan({ os: 'macos', hw: 'nvidia', avx: 'unknown', wallet: ADDR, worker: 'QC.a', dedicated: true }).warnings.length)
})

/* ---------- log doctor ---------- */

const first = (log: string) => diagnose(log).findings[0]?.id

test('doctor rules', () => {
  assert.equal(first('[ERR] no CUDA-capable device is detected'), 'cuda-missing')
  assert.equal(first('bash: nvidia-smi: command not found'), 'cuda-missing')
  assert.equal(first('CUDA driver version is insufficient for CUDA runtime version'), 'driver-old')
  assert.equal(first('cudaMalloc failed: out of memory'), 'oom')
  assert.equal(first('Illegal instruction (core dumped)'), 'no-avx')
  assert.equal(first('error: AVX512 not supported on this CPU'), 'no-avx')
  assert.equal(first('pool: invalid wallet address'), 'invalid-wallet')
  assert.equal(first('connect ECONNREFUSED 10.0.0.1:443'), 'connection')
  assert.equal(first('getaddrinfo ENOTFOUND pool.example'), 'dns')
  assert.equal(first('worker package download failed'), 'package-download')
  assert.equal(first('warn: duplicate worker name QC.a'), 'duplicate-worker')
  assert.equal(first('E:229 | 12 rejected ant candidates'), 'rejected')
  assert.equal(first('Epoch transition, waiting for new epoch'), 'epoch-idle')
  assert.equal(first('./miner: Permission denied'), 'permission')
  assert.equal(first('Segmentation fault'), 'crash')
})

test("doctor: a healthy log says it's fine and cites the line", () => {
  const d = diagnose('starting\nE:229 | SHARES: 0/0 | [CUDA] 49 it/s | [AVX2] 5 it/s\n')
  assert.equal(d.status, 'fine')
  assert.equal(d.findings[0]!.id, 'mining')
  assert.equal(d.findings[0]!.line?.n, 2)
  assert.match(d.findings[0]!.line!.text, /49 it\/s/)
})

test('doctor: a fault outranks the it/s line, and mining reassurance is dropped', () => {
  const d = diagnose('[CUDA] 49 it/s\nconnection refused by host\n')
  assert.equal(d.status, 'fault')
  assert.equal(d.findings[0]!.id, 'connection')
  assert.ok(!d.findings.some(f => f.id === 'mining'))
})

test('doctor: empty, unknown, and seed in a log', () => {
  assert.equal(diagnose('   ').status, 'empty')
  assert.equal(diagnose('hello world').status, 'unknown')
  assert.equal(diagnose(`seed=${SEED}\n[CUDA] 40 it/s`).seedWarning, true)
})

test('every rule has a fix', () => {
  for (const r of RULES) assert.ok(r.fix.length > 0, r.id)
})

/* ---------- AI layer ---------- */

test('redaction removes addresses and seeds', () => {
  const out = redactWallets(`addr ${ADDR} seed ${SEED} ok`)
  assert.doesNotMatch(out, /[A-Z]{60}|[a-z]{55}/)
  assert.match(out, /\[address removed\].*\[seed removed\]/)
  assert.equal(redactWallets('RTX 5070 Ti'), 'RTX 5070 Ti')
})

test('system prompt carries the hard rules and no internal split', () => {
  const p = mariaSystemPrompt()
  assert.match(p, /Never promise, project or estimate income/)
  assert.match(p, /Describe jetski only with dated facts, and say I do not recommend it/) // only as "do not recommend"
  assert.match(p, /Never use em dashes/)
  assert.match(p, /CUDA 12/)
  assert.match(p, /ASICs are not for this pool/)
  assert.match(p, /Qubic Academy/)
  assert.match(p, new RegExp(`${POOL.feePercent}% fee`))
  assert.doesNotMatch(p, /\b3%|\b4%|\bfund\b/i)
  assert.doesNotMatch(p, /—/)
})

test('user-facing strings have no em dashes', () => {
  const all = JSON.stringify([RULES, pick({ mode: 'buy', scale: 'large', os: 'macos' }), buildPlan({ os: 'linux', hw: 'cpu', avx: 'avx2', wallet: ADDR, worker: 'QC.a', dedicated: false })])
  assert.doesNotMatch(all, /—/)
})
