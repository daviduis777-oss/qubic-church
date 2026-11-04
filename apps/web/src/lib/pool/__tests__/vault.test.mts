// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/vault.test.mts
// Our own mining history (epochs 229 and 233): corrected facts, the new doctor rules, the miner FAQ.
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { FACTS, GLANCE, SOURCES, isField } = await import('../knowledge.ts')
const { FAQ, FAQ_THEMES } = await import('../faq.ts')
const { classifyCpu, classifyGpu, pick } = await import('../hardware.ts')
const { diagnose, RULES, SYMPTOMS } = await import('../doctor.ts')
const { mariaSystemPrompt, faqBlock, stalenessBlock } = await import('../prompt.ts')
const { HARD_RULES } = await import('../rules.ts')
const { buildPlan } = await import('../wizard.ts')
const { POOL } = await import('../config.ts')
const { renderMiningCard } = await import('../../../../scripts/pool-card.mts')

const NOW = new Date('2026-11-04T12:00:00Z')
const MONEY = /\$\s?\d|\bUSD\b|€|\bearn(ing)?s? per\b|\bprofit\b|\bROI\b|payback|revenue|per day you/i
const ids = (log: string) => diagnose(log).findings.map(f => f.id)
const first = (log: string) => diagnose(log).findings[0]?.id

/* ---------- corrected facts ---------- */

test('facts: 7x 5080 matched 4x 4090 on sol/h and won only per dollar', () => {
  const all = FACTS.map(f => f.text).join('\n')
  assert.doesNotMatch(all, /on both sol\/h and solutions per dollar/)
  assert.doesNotMatch(all, /10 Oct 2026: 7x RTX 5080/)
  const f = FACTS.find(x => /7x RTX 5080/.test(x.text) && x.topic === 'Measured')!
  assert.ok(f.sources.includes('field-e233'))
  for (const re of [/epoch 233/, /EPYC 7B13/, /PCIe 4\.0 x16/, /3,650 sol\/h in hour 1/, /2,460 sol\/h steady/, /2,570 averaged over 14 hours/, /Same raw rate/, /1\.9x the solutions per dollar/])
    assert.match(f.text, re)
})

test('facts: the CPU backbone claim is kept as a dated guide claim, next to our measurements', () => {
  const guide = FACTS.find(f => f.sources.includes('cointribune') && /backbone/.test(f.text))!
  assert.match(guide.text, /^Cointribune \(Sep 2026\)/)
  assert.match(guide.text, /CPU-only and home builds/)
  const ours = FACTS.find(f => f.topic === 'CPU' && /measured otherwise/.test(f.text))!
  for (const re of [/7 to 8%/, /37% \(epoch 229\)/, /17% \(epoch 233\)/, /79%/, /found 0/, /feeds and verifies/]) assert.match(ours.text, re)
  assert.ok(FACTS.some(f => /^Which applies when/.test(f.text)))
})

test('facts: AMD is unmeasured, not a flat no; staleness carries the later changes', () => {
  const amd = FACTS.find(f => /AMD Radeon/.test(f.text))!
  assert.match(amd.text, /^AMD Radeon: no measurements from us\. Support depends on the pool's miner/)
  assert.match(amd.text, /NVIDIA\/CUDA is the proven path/)
  assert.doesNotMatch(amd.text, /not supported/)
  assert.ok(!GLANCE.some(g => /AMD/.test(g.pick) && /Not for this pool/.test(g.part)))
  const st = FACTS.find(f => f.topic === 'Staleness')!
  for (const re of [/epochs 229 and 233/, /jetski pool and its miner \(not recommended/, /epoch 235 changed the threshold and task file/, /epoch 236 moved to 32-neuron/, /epoch 241/]) assert.match(st.text, re)
  assert.ok(FACTS.some(f => /POPULATION was set to 64, about 3 GB per colony/.test(f.text)))
  assert.ok(FACTS.some(f => /computor seats/.test(f.text) && /Miners reported losses in some epochs/.test(f.text)))
})

test('facts: every field fact names its epoch, and every source has a date', () => {
  for (const f of FACTS) {
    for (const id of f.sources) assert.ok(SOURCES[id].date.length > 0, id)
    if (f.sources.some(isField) && f.topic !== 'Staleness') assert.match(f.text, /epoch \d{3}|epochs \d{3}|\b20\d\d\b/i, f.text.slice(0, 60))
  }
  assert.doesNotMatch(JSON.stringify(FACTS), /—/)
})

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
  assert.match(classifyGpu('RTX 5080')!.reasons[0]!, /matched 4x 4090.*about half the price.*1\.9x/)
  assert.doesNotMatch(JSON.stringify(classifyGpu('RTX 5080')), /beat 4x 4090 on sol\/h/)
  assert.match(classifyCpu('EPYC 7B13').reasons.join(' '), /record in epoch 233/)
  assert.match(JSON.stringify(pick({ mode: 'rent', scale: 'mid' }).cards), /37% \(epoch 229\) to about 17% \(epoch 233\)/)
})

test('AMD wording is the same everywhere', () => {
  assert.ok(HARD_RULES.some(r => /AMD Radeon GPUs: we have no measurements, and support depends on the pool's miner/.test(r)))
  assert.ok(!HARD_RULES.some(r => /not supported/.test(r)))
  const w = buildPlan({ os: 'linux', hw: 'amd', avx: 'avx512', wallet: 'A'.repeat(60), worker: 'QC.a', dedicated: true }).warnings.join(' ')
  assert.match(w, /no AMD Radeon measurements/)
  assert.doesNotMatch(w, /not supported/)
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

test('faq: every theme has entries, ids are unique, each entry is complete', () => {
  const themes = Object.keys(FAQ_THEMES)
  for (const t of ['profitability', 'hardware', 'cpu-gpu', 'ram', 'breakage', 'missing', 'payout', 'algo', 'amd', 'arm-mac', 'rentals', 'trust'])
    assert.ok(themes.includes(t) && FAQ.some(e => e.theme === t), t)
  assert.equal(new Set(FAQ.map(e => e.id)).size, FAQ.length)
  for (const e of FAQ) {
    assert.ok(themes.includes(e.theme), e.id)
    assert.ok(e.q.split(/\s+/).length <= 12, `${e.id}: question too long`)
    assert.ok(e.a.length > 40 && e.a.length < 420, `${e.id}: answer ${e.a.length} chars`)
    assert.ok(e.asOf.length > 0, e.id)
    assert.ok(e.sources.length > 0, e.id)
    for (const id of e.sources) assert.ok(SOURCES[id]?.date, `${e.id}: ${id}`)
  }
})

test('faq: no income figures, quotes under 15 words, jetski only as not recommended, no partner name', () => {
  const all = JSON.stringify(FAQ)
  assert.doesNotMatch(all, MONEY)
  assert.doesNotMatch(all, /—/)
  assert.doesNotMatch(all, new RegExp(`\\b${POOL.partner.name}\\b`))
  for (const e of FAQ) {
    // quoted text inside an answer (miner or CfB quotes, log lines) stays short
    for (const m of e.a.matchAll(/"([^"]+)"/g)) assert.ok(m[1]!.split(/\s+/).length < 15, `${e.id}: ${m[1]}`)
    for (const m of e.a.matchAll(/jetski/gi)) assert.match(e.a.slice(m.index!, m.index! + 40), /not recommended|endpoints/, e.id)
    assert.doesNotMatch(e.a, /\brecommend(ed)? jetski\b/i)
  }
  // losses only as a plain statement
  assert.ok(FAQ.filter(e => /loss/i.test(e.a)).every(e => /Miners reported losses in some epochs/.test(e.a)))
})

test('faq: profitability explains the value of a solution without a figure', () => {
  const p = FAQ.filter(e => e.theme === 'profitability').map(e => e.a).join(' ')
  for (const re of [/fixed reward, divided by all solutions/, /More miners/, /each worth less/, /noise until about 80 to 90% of the epoch/, /computor seats/, /We do not project income/, /We give no income figures/])
    assert.match(p, re)
})

test('faq: AMD and the staleness of our data', () => {
  const amd = FAQ.find(e => e.theme === 'amd')!
  assert.match(amd.a, /^No measurements from us\. Support depends on the pool's miner/)
  assert.match(amd.a, /NVIDIA\/CUDA is the proven path/)
  assert.ok(FAQ.some(e => /epoch 236 moved to 32 neurons/.test(e.a)))
  assert.ok(FAQ.some(e => e.id === 'accuracy' && /All our data predates it/.test(e.a)))
})

/* ---------- prompt and card ---------- */

test('prompt: STALENESS and MINER FAQ are in the cached block, compact and clean', () => {
  const p = mariaSystemPrompt(NOW)
  assert.match(p, /\nSTALENESS\n- All our measurements are from epochs 229 and 233/)
  assert.match(p, /No rig measurements of ours exist after epoch 233/)
  assert.match(p, /Never compare sol\/h across eras/)
  assert.match(p, /\nMINER FAQ \(/)
  for (const e of FAQ) assert.ok(p.includes(`"${e.q}"`), e.id)
  assert.equal(p.match(/All our measurements are from epochs 229 and 233/g)!.length, 1) // not repeated under HARDWARE
  assert.ok(faqBlock().length < 18_000, `faq block is ${faqBlock().length} chars`)
  assert.ok(stalenessBlock().length < 1_000)
  assert.doesNotMatch(p, /—/)
  assert.doesNotMatch(p, /\bCODED\b/)
  assert.doesNotMatch(faqBlock() + stalenessBlock(), MONEY)
})

test('discord card: carries the FAQ and the staleness entry', () => {
  const md = renderMiningCard('abc1234')
  assert.match(md, /^## mining-\d{3} · Свежесть наших замеров$/m)
  for (const label of Object.values(FAQ_THEMES)) assert.match(md, new RegExp(`^## mining-\\d{3} · Вопросы майнеров: ${label}$`, 'm'))
  for (const e of FAQ) assert.ok(md.includes(e.a), e.id)
})
