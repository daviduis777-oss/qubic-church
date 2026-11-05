// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/generalize.test.mts
// Round 3 (5 Nov 2026): Maria generalises instead of fitting the exam. The doctor reads failure classes (paste
// junk, wallet strings, nvidia-smi in three formats, weak hosts, the backend, prose symptoms) and ranks a known
// benign state above generic "computes nothing". Cases come from a dev set built from the raw Discord export and
// the vault, written in several formats; none is an exam item.
import assert from 'node:assert/strict'
import { test } from 'node:test'

const {
  diagnose,
  RULES,
  parseNvidiaSmi,
  hoursIn,
  timestamps,
  atEpochChange,
  cpuMentions,
  mask,
} = await import('../doctor.ts')
const {
  mariaSystemPrompt,
  stalenessNote,
  noteLanguage,
  STALE_ERA,
  checklistBlock,
  moneyBlock,
  faqBlock,
} = await import('../prompt.ts')
const { FAQ } = await import('../faq.ts')
const { FACTS } = await import('../knowledge.ts')
const { PROCEDURES } = await import('../practice.ts')
const { HARD_RULES } = await import('../rules.ts')

const NOW = new Date('2026-11-05T12:00:00Z')
const ids = (log: string) => diagnose(log).findings.map(f => f.id)
const first = (log: string) => diagnose(log).findings[0]?.id
const SEED = 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmabc'
const ADDR = 'QWERTYUIOPASDFGHJKLZXCVBNMQWERTYUIOPASDFGHJKLZXCVBNMQWERTYUI'

/* ---------- what the paste itself carries ---------- */

test('doctor: a 55-letter seed anywhere ranks first, is never echoed, and says move the funds', () => {
  for (const log of [
    `{"qubicAddress": "${SEED}", "alias": "rig"}`,
    `my seed is ${SEED} is that ok?`,
    `[CUDA] 900 it/s\n${SEED}`,
    `wallet=${SEED}`,
  ]) {
    const d = diagnose(log)
    assert.equal(d.findings[0]!.id, 'wallet-seed', log)
    assert.equal(d.status, 'fault')
    assert.equal(d.seedWarning, true)
    assert.ok(!JSON.stringify(d.findings).includes(SEED), 'seed echoed')
    assert.match(d.findings[0]!.fix[0]!, /new wallet now and move every coin/)
  }
  // the epoch SEED line keeps its exception
  assert.ok(
    !ids(`2026-10-01 12:00:03 [INFO] SEED ${SEED}`).includes('wallet-seed')
  )
  assert.equal(diagnose(`SEED ${SEED}`).seedWarning, false)
  // tokens are masked in quoted lines too
  assert.ok(
    !JSON.stringify(
      diagnose('"accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcd"')
        .findings
    ).includes('eyJhbGci')
  )
  assert.equal(mask(`x ${SEED} y`), 'x [seed removed] y')
})

test('doctor: bracketed-paste markers are the terminal, not the miner, with the Jupyter workarounds', () => {
  for (const log of [
    "bash: $'\\E[200~cd': command not found",
    'root@c:~# ^[[200~./run.sh~',
    "bash: $'\\e[200~wget': command not found",
    '\x1b[200~nohup ./run.sh &\x1b[201~',
  ])
    assert.equal(first(log), 'bracketed-paste', log)
  const fix = RULES.find(r => r.id === 'bracketed-paste')!.fix.join(' ')
  assert.match(fix, /New, Text File/)
  assert.match(fix, /bash \/root\/untitled\.txt/)
  assert.match(fix, /printf '\\e\[\?2004l'/)
  assert.match(fix, /Do not paste the command again into the same terminal/)
  // negative: an ordinary "not found" is not paste junk
  assert.ok(!ids('bash: curl: command not found').includes('bracketed-paste'))
})

test('doctor: address field and worker name are checked; redacted values are left alone', () => {
  assert.equal(
    first(`"qubicAddress": "${ADDR.slice(0, 58)}"`),
    'address-not-public'
  )
  assert.match(
    diagnose(`"wallet": "${ADDR.toLowerCase()}"`).findings[0]!.means,
    /lowercase/
  )
  assert.ok(!ids(`"qubicAddress": "${ADDR}"`).includes('address-not-public'))
  for (const v of ['[wallet address redacted]', '<your address>', '......', ''])
    assert.ok(!ids(`"qubicAddress": "${v}"`).includes('address-not-public'), v)
  assert.ok(!ids('"qubicAddress": null,').includes('address-not-public'))
  assert.equal(first('{"alias": "rig-07"}'), 'worker-not-qc')
  assert.equal(first(`./miner --wallet ${ADDR} --worker rig1`), 'worker-not-qc')
  assert.ok(!ids('{"alias": "QC.rig-07"}').includes('worker-not-qc'))
  assert.ok(!ids('"alias": ......,').includes('worker-not-qc'))
})

/* ---------- nvidia-smi and the host ---------- */

test('doctor: nvidia-smi in CSV, table and -q form is parsed', () => {
  const csv = parseNvidiaSmi(
    'name, pcie.link.width.current, utilization.gpu [%], temperature.gpu, power.draw [W], power.limit [W]\nNVIDIA GeForce RTX 3080, 1, 22 %, 61, 120.5 W, 320.00 W'.split(
      '\n'
    )
  )
  assert.deepEqual(
    [csv[0]!.width, csv[0]!.util, csv[0]!.temp, csv[0]!.power, csv[0]!.limit],
    [1, 22, 61, 120.5, 320]
  )
  const table = parseNvidiaSmi([
    '|   0  NVIDIA GeForce RTX 5080        On  |   00000000:01:00.0 Off |                  N/A |',
    '| 30%   61C    P2            249W /  250W |   9120MiB /  16303MiB |    100%      Default |',
  ])
  assert.deepEqual(
    [table[0]!.temp, table[0]!.power, table[0]!.limit, table[0]!.util],
    [61, 249, 250, 100]
  )
  const q = parseNvidiaSmi([
    'GPU 00000000:41:00.0',
    '    Product Name : NVIDIA GeForce RTX 4090',
    '        Link Width',
    '            Max : 16x',
    '            Current : 4x',
    '    Utilization',
    '        Gpu : 35 %',
    '    GPU Current Temp : 84 C',
  ])
  assert.deepEqual(
    [q[0]!.width, q[0]!.widthMax, q[0]!.util, q[0]!.temp],
    [4, 16, 35, 84]
  )
})

test('doctor: x1 risers, starved cards and a Celeron host are found together; the host leads', () => {
  const log =
    'name, pcie.link.width.current, utilization.gpu [%], temperature.gpu, clocks.sm [MHz]\nNVIDIA GeForce RTX 3080, 1, 22 %, 61, 1905 MHz\nNVIDIA GeForce RTX 3080, 1, 41 %, 63, 1905 MHz\nModel name: Intel(R) Celeron(R) CPU G3930 @ 2.90GHz\nCPU(s): 2'
  const got = ids(log)
  assert.deepEqual(got.slice(0, 2), ['weak-host-cpu', 'pcie-narrow'])
  assert.ok(got.includes('gpu-starved'))
  assert.equal(diagnose(log).findings[1]!.severity, 'fault') // x1 while mining
  // 2 to 4 threads behind several cards, no model name
  assert.equal(
    first(
      'CPU(s): 4\n' +
        [0, 1, 2, 3, 4, 5]
          .map(i => `GPU ${i}: NVIDIA GeForce RTX 3060 (UUID: GPU-${i})`)
          .join('\n')
    ),
    'weak-host-cpu'
  )
  // a fat host with busy cards is healthy
  assert.deepEqual(
    ids(
      'index, name, temperature.gpu, utilization.gpu [%]\n0, NVIDIA GeForce RTX 5090, 66, 100 %\n1, NVIDIA GeForce RTX 5090, 72, 100 %'
    ),
    ['gpu-ok']
  )
  // x4 alone is a check, not a fault: our best cost-per-solution rig ran on x4
  assert.equal(
    diagnose(
      'Link Width\n  Max : 16x\n  Current : 4x\nUtilization\n  Gpu : 100 %'
    ).findings[0]!.severity,
    'check'
  )
})

test('doctor: heat and power readings follow our measurements', () => {
  // 84 C at full use is not a fault (our 4070 Super hotspot 82 to 89 C, E229)
  const d = diagnose(
    'name, temperature.gpu, utilization.gpu [%], power.draw [W], power.limit [W]\nNVIDIA GeForce RTX 4070 SUPER, 84, 99 %, 219.80 W, 220.00 W'
  )
  assert.ok(!d.findings.some(f => f.id === 'thermal'))
  assert.equal(d.status, 'fine')
  assert.match(RULES.find(r => r.id === 'gpu-ok')!.means, /82 to 89 C/)
  assert.match(RULES.find(r => r.id === 'gpu-power')!.means, /250 W/)
  assert.equal(
    first('Thermal Slowdown : Active\nGPU Current Temp : 91 C'),
    'thermal'
  )
})

/* ---------- backend, threads, prose symptoms ---------- */

test('doctor: the backend is judged against the CPU model', () => {
  assert.equal(
    first(
      'Ryzen 9 9900X, QLI Client 3.9.1.0\nCPU only\nAVX2\n23 threads\nstays at 0 it/s'
    ),
    'backend-avx2'
  )
  assert.equal(
    first(
      '"cpuVersion": "GENERIC",\nCPU: AMD Ryzen 9 7950X 16-Core Processor\n[CPU] 0 it/s'
    ),
    'backend-avx2'
  )
  assert.equal(
    first('EPYC 7742, backend AVX512, the worker crashes immediately'),
    'no-avx'
  )
  assert.ok(!ids('"cpuVersion": "ARM64",').length)
  assert.ok(!ids('"cpuVersion": "AVX512"').includes('backend-avx2'))
  assert.ok(
    cpuMentions('Getting 2 it/s on my i13900').some(m => /i9-13900/.test(m))
  )
})

test('doctor: very low CPU it/s on a big CPU points at the thread count (CfB, 2 Aug 2026)', () => {
  assert.equal(
    first(
      'Getting 2 it/s on my i13900 (I know it is avx2) and 0 for gpu. But 2 seems really low, right?'
    ),
    'cpu-threads'
  )
  assert.equal(
    first('my 9950X shows 3 it/s on the CPU, is that low?'),
    'cpu-threads'
  )
  assert.match(
    RULES.find(r => r.id === 'cpu-threads')!.means,
    /Running with single thread probably/
  )
  // not for a laptop, a Mac, a GPU readout, or a CPU already on many threads
  for (const l of [
    'my laptop i5-1235U does 2 it/s',
    '[CUDA] 3 it/s',
    'M2 Pro gets 4 it/s',
    '7950X with 32 threads shows 2 it/s',
  ])
    assert.ok(!ids(l).includes('cpu-threads'), l)
})

test('doctor: prose symptoms map to their class', () => {
  const cases: [string, string][] = [
    ['After 6 or 7 hours still 0/sol ! It’s normal!?', 'zero-shares-long'],
    [
      'left two miners running all night and neither received any shares at all',
      'zero-shares-long',
    ],
    [
      'My miner and shares have said zero since last night.',
      'zero-shares-long',
    ],
    ["new client isn't returning any shares", 'no-shares'],
    [
      'upgraded the miner and not able to mine a single solution till 1 hour',
      'bursts',
    ],
    ['today its diffiult to find share or is it just me', 'bursts'],
    [
      'rented 4070s, more than 10 minutes and the pool dashboard is showing 0 IT/S and 0 solutions',
      'too-early',
    ],
    ['shares not going up anymore, looks frozen', 'pool-frozen'],
    ['My Qubic.li Client shuts down after 2-3 seconds', 'closes-at-start'],
    ['phone miner keeps showing 0 shares for 2 days', 'phone-miner'],
    [
      'dashboard shows my worker offline but the miner runs fine at 600 it/s',
      'dashboard-lag',
    ],
    ['Last epoch more than 80% of my shares were invalid', 'old-miner'],
  ]
  for (const [l, id] of cases) assert.equal(first(l), id, l)
  // negatives: questions that carry no fault
  for (const l of [
    'does solo mining (pps: false) still work? I only can see shares but no sols in my output.',
    '3080ti - BF16 rate went from 63.7 to 116.1 TFLOPS (+82%)',
    'What does "tid = *" mean after a share has been found?',
  ])
    assert.equal(
      diagnose(l).findings.filter(f => f.severity !== 'fine').length,
      0,
      l
    )
})

/* ---------- priority: a benign explanation outranks "computes nothing" ---------- */

test('doctor: idle at the epoch change outranks 0 it/s; outside the window it is idle-long', () => {
  const change =
    '2026-10-28 12:02:11 [INFO] Waiting to receive tasks from AntColony...\n2026-10-28 12:02:41 [CPU] 0 it/s\n2026-10-28 12:03:11 [INFO] Waiting to receive tasks from AntColony...'
  assert.deepEqual(ids(change), ['epoch-idle'])
  assert.equal(diagnose(change).status, 'fine')
  const thursday =
    '2026-11-05T03:00:10Z INFO waiting for new tasks\n2026-11-05T05:30:10Z INFO waiting for new tasks\n2026-11-05T08:05:40Z INFO hashrate: 0 it/s'
  assert.equal(first(thursday), 'idle-long')
  assert.ok(atEpochChange(new Date('2026-10-28T12:40:00Z')))
  assert.ok(!atEpochChange(new Date('2026-10-29T12:40:00Z')))
})

test('doctor: pool-side Ant Colony misses outrank 0/0 and the foreign endpoint', () => {
  const log =
    'Pool: wss://wps.qubic.li/ws\nAntColony: parent 7f3a not found, server cache miss\nproxy: 0 walks served\nSHARES: 0/0\ncurrent hashrate: 0 it/s\ncollected about 14.7 hours of logs'
  const got = ids(log)
  assert.equal(got[0], 'ant-parent')
  assert.ok(!got.includes('zero-hashrate') && !got.includes('zero-shares-long'))
  assert.equal(got.at(-1), 'foreign-endpoint')
})

test('doctor: tiers order safety, root cause, symptom, context', () => {
  const log = `"accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcd",\n"poolAddress": "wss://wps.qubic.li/ws",\nSHARES 0/0 for 12 hours\n"cpuVersion": "AVX2"`
  const got = ids(log)
  assert.deepEqual([got[0], got.at(-1)], ['secret-leak', 'foreign-endpoint'])
  assert.ok(got.indexOf('backend-avx2') < got.indexOf('zero-shares-long'))
})

/* ---------- small helpers ---------- */

test('doctor: durations and timestamps in the forms miners write them', () => {
  assert.equal(hoursIn('after 6 or 7 hours'), 7)
  assert.equal(hoursIn('for nearly two months'), 1440)
  assert.equal(hoursIn('left it all night'), 8)
  assert.ok(Math.abs(hoursIn('more than 10 minutes') - 1 / 6) < 1e-9)
  assert.equal(hoursIn('since the middle of the 236th epoch'), 24)
  const ts = timestamps([
    '2026-10-28 12:02:11.611 [INFO] x',
    '28.10.2026 12:03 y',
    'Wed Oct 28 12:04:00 UTC 2026 z',
    '2026-10-28T12:05:00+02:00 w',
  ])
  assert.deepEqual(
    ts.map(t => t.at.toISOString()),
    [
      '2026-10-28T12:02:11.000Z',
      '2026-10-28T12:03:00.000Z',
      '2026-10-28T12:04:00.000Z',
      '2026-10-28T10:05:00.000Z',
    ]
  )
})

/* ---------- the staleness note the API route appends ---------- */

test('staleness: an E229/E233-era answer without "predates" gets one caveat line', () => {
  assert.match(
    stalenessNote('Our record rig ran 2,460 sol/h in epoch 233.'),
    /^\n\nNote: those measurements predate the E235\/E236 changes\.$/
  )
  assert.match(
    stalenessNote('On 7 Sep 2026 six cards plus CPU looped.'),
    /predate/
  )
  assert.match(stalenessNote('Our runs show 12 threads per card.'), /predate/)
  assert.equal(
    stalenessNote('Epoch 233 numbers, which predates the E235/E236 changes.'),
    ''
  )
  assert.equal(stalenessNote('E233-Daten, vor den Änderungen in E236.'), '')
  assert.equal(stalenessNote('Wait 20 minutes, then judge by solutions.'), '')
  assert.equal(stalenessNote('It ran 2,233 sol/h.'), '')
  assert.match(
    stalenessNote('В эпоху 233 наш риг...', 'Сколько ставить потоков?'),
    /до изменений E235\/E236/
  )
  assert.match(
    stalenessNote(
      'In E229 lief die Karte heiß.',
      'Ist 84 Grad zu heiß für meine Karte und wie soll ich das Power Limit setzen?'
    ),
    /Hinweis/
  )
  assert.equal(
    noteLanguage('¿Cómo puedo minar con mi 3070 y es para mi casa?'),
    'es'
  )
  assert.equal(noteLanguage('how do I start'), 'en')
  assert.ok(
    STALE_ERA.test('E229') &&
      STALE_ERA.test('30 Sep') &&
      !STALE_ERA.test('8 Oct 2026')
  )
})

/* ---------- prompt and knowledge ---------- */

test('prompt: the checklist asks for every question, must-say facts, scoped unknowns and the 800 cap', () => {
  const c = checklistBlock()
  assert.match(c, /answer every question the user literally asked/)
  assert.match(c, /MUST facts, in order, before any extra/)
  assert.match(
    c,
    /about 800 for expert, rental, comparison or multi-part questions/
  )
  // round 4: "no confirmed fix" is scoped to open cases, and even there the general troubleshooting follows
  assert.match(c, /"no confirmed fix yet" only for an OPEN CASE, and then still the general troubleshooting that fits the log/)
  assert.match(c, /"not measured" only for a "Never measured" item/)
  assert.match(c, /never open with "I don't know" when they cover it/)
})

test('prompt: cost maths with rental prices is allowed; income and price predictions are not', () => {
  const m = moneyBlock()
  assert.match(m, /Rental prices and power bills are costs, not price talk/)
  assert.match(m, /compute cost per solution for each option/)
  assert.match(m, /0\.00075 USD.*0\.0013/)
  assert.ok(
    HARD_RULES.some(r =>
      /Rental and power costs are costs, not price talk/.test(r)
    )
  )
  assert.match(
    mariaSystemPrompt(NOW),
    /Per-card values are averages over a whole rig/
  )
})

test('prompt: every FAQ topic has 2 to 4 ranked must-say facts, rendered numbered', () => {
  for (const e of FAQ) {
    assert.ok(e.must.length >= 2 && e.must.length <= 4, e.id)
    assert.equal(e.a, [...e.must, ...(e.more ? [e.more] : [])].join(' '))
  }
  assert.match(faqBlock(), /\(1\) .* \(2\) /)
  const p = mariaSystemPrompt(NOW)
  assert.ok(
    p.length / 4 <= 20_000,
    `prompt is about ${Math.round(p.length / 4)} tokens`
  )
})

test('knowledge: measured heat, power-cap and thread facts are in, the unsourced ones are out', () => {
  const p = mariaSystemPrompt(NOW)
  assert.match(
    p,
    /hotspot of 82 to 89 C, which we treated as normal \(epoch 229, 5 Sep 2026\)/
  )
  assert.match(
    p,
    /5080s to 250 W \(stock 360\) and 5090s to 400 W \(stock 575\)/
  )
  assert.match(p, /Running with single thread probably" \(2 Aug 2026\)/)
  assert.ok(
    FACTS.some(
      f =>
        /Heat and power/.test(f.text) &&
        /predates the E235\/E236 changes/.test(f.text)
    )
  )
  assert.doesNotMatch(
    JSON.stringify([PROCEDURES, FAQ, FACTS]),
    /10% below the default/
  )
  assert.doesNotMatch(
    p,
    /which is why pooling helps|high scores count for nothing/
  )
  // regional failures are another pool's endpoints, stale, and this pool untested
  assert.doesNotMatch(p, /could not reach the pool/)
  assert.match(
    FAQ.find(e => e.id === 'avoid-hosts')!.a,
    /jetski endpoints.*another pool and stale.*never tested by region/
  )
})

test('a typed multi-line question is not treated as a log', async () => {
  const { looksLikeLog } = await import('../doctor.ts')
  assert.equal(looksLikeLog('hi maria\nmy 4090 shows 0 shares for hours, what do i do?'), false)
  assert.equal(looksLikeLog('2026-11-02 10:00:01 INFO started\nE:237 | SHARES: 0/0 | [CUDA] 0 it/s'), true)
  assert.equal(looksLikeLog('{\n  "accessToken": "x",\n  "cpuVersion": "AVX2"\n}'), true)
})
