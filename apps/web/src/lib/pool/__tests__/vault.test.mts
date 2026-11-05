// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/vault.test.mts
// Our own mining history (epochs 229 and 233): corrected facts, the new doctor rules, the miner FAQ.
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { GLANCE, SOURCES, isField } = await import('../knowledge.ts')
const { classifyCpu, classifyGpu, pick } = await import('../hardware.ts')
const { diagnose, RULES, SYMPTOMS } = await import('../doctor.ts')
const { buildPlan } = await import('../wizard.ts')
const { POOL } = await import('../config.ts')

const NOW = new Date('2026-11-04T12:00:00Z')
const MONEY = /\$\s?\d|\bUSD\b|€|\bearn(ing)?s? per\b|\bprofit\b|\bROI\b|payback|revenue|per day you/i
const ids = (log: string) => diagnose(log).findings.map(f => f.id)
const first = (log: string) => diagnose(log).findings[0]?.id

/* ---------- corrected facts ---------- */





test('hardware: Xeon E5 is a skip for CPU mining and works as a GPU host', () => {
  const c = classifyCpu('Intel(R) Xeon(R) CPU E5-2696 v3 @ 2.30GHz')
  assert.equal(c.verdict, 'Skip')
  assert.match(c.reasons[0]!, /^For CPU mining: skip/)
  assert.ok(c.specs!.some(([k, v]) => k === 'As GPU host' && v === 'Works'))
  const host = pick({ mode: 'own', cpu: 'Xeon E5-2696 v3', gpu: 'RTX 4090', gpuCount: 4 })
  assert.equal(host.cards[0]!.verdict, 'Works')
  assert.match(host.cards[0]!.reasons.join(' '), /2,440 sol\/h \(epoch 233\)/)
  assert.ok(!host.notes.some(n => /choke the card/.test(n)))
  assert.ok(host.notes.some(n => /Run GPU only/.test(n)))
  // E5 v2 has no AVX2: still a skip, also behind a card
  const v2 = pick({ mode: 'own', cpu: 'Xeon E5-2470 v2', gpu: 'RTX 4060 Ti', gpuCount: 2 })
  assert.equal(v2.cards[0]!.verdict, 'Skip')
  assert.ok(v2.notes.some(n => /choke the card/.test(n)))
})

test('hardware: CPU and GPU mode advice follows the card count', () => {
  const two = pick({ mode: 'own', cpu: 'Ryzen 9 7950X3D', gpu: 'RTX 4090', gpuCount: 2 })
  assert.ok(two.notes.some(n => /Run GPU and CPU together.*7 to 8%/.test(n)))
  const six = pick({ mode: 'own', cpu: 'Threadripper 7980X', gpu: 'RTX 5070 Ti', gpuCount: 6 })
  assert.ok(six.notes.some(n => /Run GPU only on this many cards/.test(n)))
  assert.match(classifyGpu('RTX 5080')!.reasons[0]!, /matched 4x 4090.*58% of the price.*1\.7x cheaper per solution/)
  assert.doesNotMatch(JSON.stringify(classifyGpu('RTX 5080')), /beat 4x 4090 on sol\/h/)
  assert.match(classifyCpu('EPYC 7B13').reasons.join(' '), /record in epoch 233/)
  assert.match(JSON.stringify(pick({ mode: 'rent', scale: 'mid' }).cards), /37% \(epoch 229\) to about 17% \(epoch 233\)/)
})


/* ---------- doctor: rules from our runs ---------- */

test('doctor: "Ant stream closed" and "address already in use" point to a duplicate process', () => {
  assert.equal(first('[POOL] Ant stream closed; active work cancelled'), 'duplicate-process')
  assert.equal(first('[GPU] bind failed: Address already in use'), 'duplicate-process')
  assert.equal(first('Error: listen EADDRINUSE: address already in use 127.0.0.1:17899'), 'duplicate-process')
  const r = RULES.find(x => x.id === 'duplicate-process')!
  assert.equal(r.severity, 'fault')
  assert.match(r.fix.join(' '), /start one instance only/)
  assert.match(r.fix.join(' '), /GPU only/)
})

test('doctor: pool-side errors are left alone, and are not a local connection fault', () => {
  for (const l of [
    '[POOL] HTTP 502 Bad Gateway',
    '[WS] websocket close 1006 (abnormal closure)',
    'WebSocket closed with code 1006',
    '[ANT] retired-lease progress rejected',
    'Ant progress rejected: ant lease expired',
    'Ant work unavailable: active search cancelled',
    '[QUEUE] Submission backlog detected | pending 1',
  ]) {
    assert.deepEqual(ids(l), ['pool-side'], l)
    assert.equal(diagnose(l).status, 'fine', l)
  }
  // a real local refusal is still a connection fault
  assert.equal(first('connect ECONNREFUSED 10.0.0.1:443'), 'connection')
  assert.match(RULES.find(x => x.id === 'pool-side')!.fix[0]!, /Do not restart/)
})

test('doctor: the cold start is normal, but a duplicate bind is not', () => {
  assert.equal(first('[CPU] No trainer available... Wait for propagation'), 'cold-start')
  assert.equal(first('[GPU] bind failed'), 'cold-start')
  assert.equal(first('{"status":"starting"}'), 'cold-start')
  assert.equal(diagnose('[GPU] bind failed').status, 'fine')
  assert.equal(first('[GPU] bind failed: address already in use'), 'duplicate-process')
})

test('doctor: an old miner after an algorithm change', () => {
  assert.equal(first('[WARN] client version outdated, please update'), 'old-miner')
  assert.equal(first('[POOL] invalid share format'), 'old-miner')
  assert.ok(ids('share rejected: invalid share').includes('old-miner'))
  assert.equal(first('unsupported task template v1.308.1'), 'old-miner')
  const r = RULES.find(x => x.id === 'old-miner')!
  assert.match(r.means, /epoch 235 changed the threshold and task file, epoch 236 moved to 32-neuron/i)
  assert.match(r.fix.join(' '), /jetski included, not recommended/)
  // existing rules keep their place
  assert.equal(first('CUDA driver version is insufficient for CUDA runtime version'), 'driver-old')
  assert.equal(first('pool: invalid wallet address'), 'invalid-wallet')
})

test('doctor: a narrow PCIe link and the host throttling hint', () => {
  assert.equal(first('            Current                           : 4x'), 'pcie-narrow')
  assert.equal(first('LnkSta: Speed 16GT/s, Width x4'), 'pcie-narrow')
  assert.equal(diagnose('            Current                           : 16x').status, 'unknown')
  const slow = SYMPTOMS.find(s => s.id === 'slow-host')!
  assert.match(slow.finding.means, /host 24255/)
  assert.match(slow.finding.fix.join(' '), /Link Width/)
  for (const id of ['its-drop', 'pool-errors', 'dies-terminal']) assert.ok(SYMPTOMS.some(s => s.id === id), id)
  assert.match(SYMPTOMS.find(s => s.id === 'dies-terminal')!.finding.fix[0]!, /nohup/)
  assert.match(SYMPTOMS.find(s => s.id === 'no-sol')!.finding.fix[0]!, /20 minutes/)
})

test('doctor: every rule has a fix and a source, no money words, no em dash', () => {
  for (const id of ['duplicate-process', 'pool-side', 'cold-start', 'old-miner', 'pcie-narrow']) {
    const r = RULES.find(x => x.id === id)!
    assert.ok(r.fix.length > 0 && (r.sources?.length ?? 0) > 0, id)
  }
  const text = JSON.stringify([RULES, SYMPTOMS])
  assert.doesNotMatch(text, /—/)
  assert.doesNotMatch(text, MONEY)
})

/* ---------- the miner FAQ ---------- */





/* ---------- prompt and card ---------- */


