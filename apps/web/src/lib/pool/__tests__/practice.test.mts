// node --experimental-strip-types --test apps/web/src/lib/pool/__tests__/*.mts
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const { epochAt, epochStart, formatLeft, formatUtc, nowLine, EPOCH_ANCHOR } = await import('../epoch.ts')
const P = await import('../practice.ts')
const { PROCEDURES, PRACTICE_SOURCES, TIPS, MINER_COMMAND, proceduresFor, procedureText, sourceOf, withCommand, runScript, detachCommand, stopCommand, SYSTEMD_UNIT, POWER_UNIT } = P
const { buildPlan } = await import('../wizard.ts')
const { diagnose, RULES, SYMPTOMS } = await import('../doctor.ts')
const { mariaSystemPrompt } = await import('../prompt.ts')
const { HARD_RULES } = await import('../rules.ts')
const { POOL } = await import('../config.ts')
const { renderMiningCard } = await import('../../../../scripts/pool-card.mts')

const ADDR = 'A'.repeat(56) + 'BCDE'
const NOW = new Date(Date.UTC(2026, 10, 4, 16, 0))
const base = { wallet: ADDR, worker: 'QC.rig-a', avx: 'avx512' as const }

/* ---------- live epoch ---------- */

test('epoch: anchor, boundaries and the current one', () => {
  assert.equal(epochAt(new Date(EPOCH_ANCHOR.startMs)).epoch, 236)
  assert.equal(epochAt(new Date(EPOCH_ANCHOR.startMs - 1)).epoch, 235)
  assert.equal(epochStart(237).toISOString(), '2026-10-28T12:00:00.000Z')
  const e = epochAt(NOW)
  assert.equal(e.epoch, 238)
  assert.equal(e.start.toISOString(), '2026-11-04T12:00:00.000Z')
  assert.equal(e.end.toISOString(), '2026-11-11T12:00:00.000Z')
  assert.equal(e.msLeft, 6 * 86_400_000 + 20 * 3_600_000)
  assert.equal(e.start.getUTCDay(), 3) // Wednesday
})

test('epoch: formatting and the prompt line', () => {
  assert.equal(formatLeft(6 * 86_400_000 + 20 * 3_600_000 + 59_000), '6 d 20 h')
  assert.equal(formatLeft(5 * 3_600_000 + 10 * 60_000), '5 h 10 min')
  assert.equal(formatLeft(12 * 60_000), '12 min')
  assert.equal(formatLeft(-5), '0 min')
  assert.equal(formatUtc(epochStart(238)), 'Wed 4 Nov 2026 12:00 UTC')
  assert.equal(nowLine(NOW), 'Now: Wed 4 Nov 2026 16:00 UTC. Epoch 238, started Wed 4 Nov 2026 12:00 UTC, ends Wed 11 Nov 2026 12:00 UTC, in 6 d 20 h.')
})

test('the prompt carries "now" at request time', () => {
  assert.match(mariaSystemPrompt(NOW), /Epoch 238, .* ends Wed 11 Nov 2026 12:00 UTC, in 6 d 20 h/)
  assert.match(mariaSystemPrompt(new Date(Date.UTC(2026, 10, 11, 12, 0))), /Epoch 239, .* in 7 d 0 h/)
})

/* ---------- practice data ---------- */

const allText = () => JSON.stringify([PROCEDURES, TIPS, RULES, SYMPTOMS, HARD_RULES])

test('every step, tip and rule source resolves to a dated source', () => {
  for (const p of Object.values(PROCEDURES)) {
    assert.ok(p.steps.length > 0, p.id)
    for (const s of p.steps) {
      assert.ok(s.sources.length > 0, `${p.id}: ${s.title}`)
      for (const id of s.sources) assert.ok(sourceOf(id)?.date, `${p.id}: ${id}`)
    }
  }
  for (const t of TIPS) for (const id of t.sources) assert.ok(sourceOf(id)?.date, id)
  for (const r of RULES) for (const id of r.sources ?? []) assert.ok(sourceOf(id)?.date, `${r.id}: ${id}`)
  for (const [id, s] of Object.entries(PRACTICE_SOURCES)) {
    assert.ok(s.date.length > 0, id)
    assert.ok(s.url === '' ? id === 'localCheck' : s.url.startsWith('https://'), id)
  }
})

test('practice text keeps the hard rules', () => {
  const all = allText()
  assert.doesNotMatch(all, /—/)
  assert.doesNotMatch(JSON.stringify([PROCEDURES, TIPS, RULES, SYMPTOMS]), /\$\d{2,}|\$\d+\.\d|earn(ing)?s? per|profit|\bROI\b|income|price/i)
  assert.doesNotMatch(all, /[a-z]{55}/)
  // jetski only ever as gone: each mention has "gone" within a few words
  for (const m of all.matchAll(/jetski/gi)) assert.match(all.slice(m.index!, m.index! + 70), /gone|no longer exists/i, all.slice(m.index!, m.index! + 70))
  assert.doesNotMatch(all, /\bCODED\b/)
  assert.doesNotMatch(JSON.stringify([PROCEDURES, TIPS]), /radeon/i)
  assert.ok(HARD_RULES.some(r => /AMD Radeon GPUs: we have no measurements/.test(r)))
  assert.ok(HARD_RULES.some(r => r.includes(MINER_COMMAND)))
  assert.ok(TIPS.some(t => /daily cost ÷ solutions per day/.test(t.text)))
  // General GPU-efficiency advice is labelled as general.
  assert.match(PROCEDURES['gpu-power'].summary, /General GPU advice, not measured on Qubic/)
  assert.ok(TIPS.filter(t => /power limit/i.test(t.title)).every(t => t.general))
})

test('procedures never invent the pool command', () => {
  const all = JSON.stringify(PROCEDURES)
  assert.doesNotMatch(all, /--wallet|--worker|qli-Client|qubminer\b/)
  for (const id of ['linux-run', 'windows', 'macos', 'rental'] as const) assert.ok(JSON.stringify(PROCEDURES[id]).includes(MINER_COMMAND), id)
})

test('systemd units: restart, network, dedicated user, journal', () => {
  assert.match(SYSTEMD_UNIT, /^Restart=always$/m)
  assert.match(SYSTEMD_UNIT, /^After=network-online\.target$/m)
  assert.match(SYSTEMD_UNIT, /^Wants=network-online\.target$/m)
  assert.match(SYSTEMD_UNIT, /^User=qubic$/m)
  assert.match(SYSTEMD_UNIT, /^ExecStart=\/opt\/qubic-miner\/run\.sh$/m)
  assert.match(SYSTEMD_UNIT, /^WantedBy=multi-user\.target$/m)
  assert.doesNotMatch(SYSTEMD_UNIT, /StandardOutput=(?!journal)/)
  assert.match(POWER_UNIT, /^Type=oneshot$/m)
  assert.match(POWER_UNIT, /^ExecStart=\/usr\/bin\/nvidia-smi -pl <WATTS>$/m)
  const text = procedureText(PROCEDURES['linux-systemd'])
  assert.match(text, /journalctl -u qubic-miner -f/)
  assert.match(text, /systemctl enable --now qubic-miner/)
})

test('OS procedures carry the key commands', () => {
  const t = (id: keyof typeof PROCEDURES) => procedureText(PROCEDURES[id])
  assert.match(t('linux-nvidia'), /ubuntu-drivers install/)
  assert.match(t('linux-nvidia'), /525\.60\.13/)
  assert.match(t('linux-nvidia'), /nvidia-smi -pm 1/)
  assert.match(t('linux-cpu'), /lscpu \| grep -o 'avx512\[a-z\]\*'/)
  assert.match(t('linux-cpu'), /\bnproc\b/)
  assert.match(t('linux-cpu'), /free -h/)
  assert.match(t('gpu-power'), /nvidia-smi -pl <WATTS>/)
  assert.match(t('windows'), /schtasks \/create .* \/sc onlogon/)
  assert.match(t('windows'), /Coreinfo64\.exe -accepteula -f/)
  assert.match(t('windows'), /Exclude only that folder/)
  assert.match(t('windows'), /powercfg \/change standby-timeout-ac 0/)
  assert.match(t('macos'), /caffeinate -dimsu/)
  assert.match(t('macos'), /Privacy & Security.*Open Anyway/)
  assert.match(t('hiveos'), /Installation URL/)
  assert.match(t('hiveos'), /Extra config arguments/)
  assert.match(t('hiveos'), /miner log/)
  assert.match(t('rental'), /On-start/)
  assert.match(t('rental'), /AVX-512, at least 8 CPU cores per GPU, PCIe x8/)
  assert.match(t('rental'), /Deposit small, test one box for an hour/)
})

test('proceduresFor picks the right path', () => {
  const ids = (i: Parameters<typeof proceduresFor>[0]) => proceduresFor(i).map(p => p.id)
  assert.deepEqual(ids({ os: 'linux', hw: 'nvidia', dedicated: true }), ['linux-nvidia', 'linux-cpu', 'linux-run', 'linux-systemd', 'gpu-power'])
  assert.deepEqual(ids({ os: 'linux', hw: 'cpu', dedicated: false }), ['linux-cpu', 'linux-run', 'linux-nohup'])
  assert.deepEqual(ids({ os: 'windows', hw: 'nvidia' }), ['windows'])
  assert.deepEqual(ids({ os: 'macos', hw: 'apple' }), ['macos'])
  assert.deepEqual(ids({ os: 'hiveos', hw: 'nvidia' }), ['hiveos'])
  assert.deepEqual(ids({ os: 'linux', hw: 'nvidia', where: 'rental' }), ['rental'])
})

test('withCommand replaces the placeholder only when a command is known', () => {
  assert.equal(withCommand(`a\n${MINER_COMMAND}\nb`, null), `a\n${MINER_COMMAND}\nb`)
  assert.equal(withCommand(`a\n${MINER_COMMAND}\nb`, './x --y'), 'a\n./x --y\nb')
})

/* ---------- the wrapper really runs any command ---------- */

const hasSetsid = spawnSync('bash', ['-c', 'command -v setsid']).status === 0

test('run.sh keeps any command byte for byte and runs it from its folder', { skip: process.platform === 'win32' }, () => {
  const home = mkdtempSync(join(tmpdir(), 'qc-run-'))
  try {
    // Quotes, $, &&, two lines: what a setup page might hand over.
    const cmd = 'echo "it\'s \\$HOME-free: $(basename "$PWD")" && printf \'%s\\n\' \'x $y\'\necho second line'
    execFileSync('bash', ['-c', withCommand(runScript('~/qubic-miner'), cmd)], { env: { ...process.env, HOME: home } })
    const saved = readFileSync(join(home, 'qubic-miner/run.sh'), 'utf8')
    assert.ok(saved.includes(cmd), saved)
    const out = execFileSync(join(home, 'qubic-miner/run.sh'), { cwd: tmpdir(), env: { ...process.env, HOME: home } }).toString()
    assert.equal(out, "it's $HOME-free: qubic-miner\nx $y\nsecond line\n")
    assert.ok(Number(readFileSync(join(home, 'qubic-miner/miner.pid'), 'utf8')) > 0)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('detached start and the stop command handle the whole process group', { skip: process.platform === 'win32' || !hasSetsid }, async () => {
  const home = mkdtempSync(join(tmpdir(), 'qc-run-'))
  const env = { ...process.env, HOME: home }
  const marker = `sleep 31${Math.floor(Math.random() * 1000)}`
  const alive = () => spawnSync('pgrep', ['-xf', marker]).status === 0
  try {
    execFileSync('bash', ['-c', withCommand(runScript('~/qubic-miner'), `echo started && ${marker}`)], { env })
    execFileSync('bash', ['-c', detachCommand('~/qubic-miner')], { env })
    for (let i = 0; i < 50 && !alive(); i++) await new Promise(r => setTimeout(r, 50))
    assert.ok(alive(), 'the miner child is running after the launching shell exited')
    execFileSync('bash', ['-c', stopCommand('~/qubic-miner')], { env })
    for (let i = 0; i < 50 && alive(); i++) await new Promise(r => setTimeout(r, 50))
    assert.ok(!alive(), 'stop kills run.sh and the command it started')
    assert.match(readFileSync(join(home, 'qubic-miner/miner.log'), 'utf8'), /started/)
  } finally {
    spawnSync('pkill', ['-xf', marker])
    rmSync(home, { recursive: true, force: true })
  }
})

/* ---------- wizard ---------- */

const plan = (i: Partial<Parameters<typeof buildPlan>[0]> & Pick<Parameters<typeof buildPlan>[0], 'os' | 'hw'>) => buildPlan({ ...base, dedicated: true, ...i })
const cmds = (p: ReturnType<typeof buildPlan>) => p.steps.map(s => s.command ?? '').join('\n')

test('wizard: the OS procedure follows the values', () => {
  const linux = plan({ os: 'linux', hw: 'nvidia' })
  assert.equal(linux.steps[0]!.link?.href, POOL.onboardingUrl)
  assert.match(cmds(linux), /systemctl enable --now qubic-miner/)
  assert.match(cmds(linux), /ubuntu-drivers install/)
  assert.ok(cmds(linux).includes(MINER_COMMAND))
  assert.deepEqual(linux.procedures.map(p => p.id), ['linux-nvidia', 'linux-cpu', 'linux-run', 'linux-systemd', 'gpu-power'])
  assert.ok(linux.procedures.every(p => p.sources.length > 0))
  assert.ok(linux.steps.filter(s => s.group).length > 10)

  assert.match(cmds(plan({ os: 'linux', hw: 'cpu', dedicated: false })), /setsid -f nohup ~\/qubic-miner\/run\.sh/)
  assert.match(cmds(plan({ os: 'windows', hw: 'nvidia' })), /schtasks \/create/)
  assert.match(cmds(plan({ os: 'macos', hw: 'apple', avx: 'apple' })), /caffeinate -dimsu/)
  assert.ok(plan({ os: 'hiveos', hw: 'nvidia' }).steps.some(s => /Installation URL/.test(s.body ?? '')))
  const rent = plan({ os: 'linux', hw: 'nvidia', where: 'rental' })
  assert.match(cmds(rent), /\/root\/qubic-miner\/run\.sh/)
  assert.ok(rent.steps.some(s => /On-start/.test(s.body ?? '')))
  assert.ok(plan({ os: 'windows', hw: 'nvidia', where: 'rental' }).warnings.some(w => /Linux container/.test(w)))
})

test('wizard: checks are deduplicated and name the next epoch change', () => {
  const p = plan({ os: 'linux', hw: 'nvidia', where: 'rental', now: NOW })
  const keys = p.checks.map(c => c.command ?? c.title)
  assert.equal(new Set(keys).size, keys.length)
  assert.ok(p.checks.some(c => /Next one: Wed 11 Nov 2026 12:00 UTC/.test(c.body ?? '')))
  assert.ok(p.checks.some(c => /first hour is normal/.test(c.title)))
  assert.ok(!plan({ os: 'linux', hw: 'cpu' }).tips.some(t => /power limit/i.test(t)))
  assert.ok(plan({ os: 'linux', hw: 'nvidia' }).tips.some(t => /power limit/i.test(t)))
})

test('wizard: no em dashes, no seed, no invented command', () => {
  for (const os of ['linux', 'windows', 'macos', 'hiveos'] as const) {
    const all = JSON.stringify(plan({ os, hw: os === 'macos' ? 'apple' : 'nvidia' }))
    assert.doesNotMatch(all, /—/)
    assert.doesNotMatch(all, /[a-z]{55}/)
    assert.doesNotMatch(all, /--wallet/)
  }
})

/* ---------- doctor: new rules ---------- */

const ids = (log: string) => diagnose(log).findings.map(f => f.id)
const first = (log: string) => diagnose(log).findings[0]?.id

test('doctor: Windows Defender and SmartScreen', () => {
  assert.equal(first('Threat quarantined: Trojan:Win32/CoinMiner'), 'defender')
  assert.equal(first('Operation did not complete successfully because the file contains a virus or potentially unwanted software.'), 'defender')
  assert.equal(first('Microsoft Defender Antivirus has taken action to protect this machine'), 'defender')
  assert.equal(first('PUA:Win32/CoinMiner detected'), 'defender')
  assert.equal(first('Windows protected your PC'), 'smartscreen')
  assert.equal(first('Microsoft Defender SmartScreen prevented an unrecognized app from starting'), 'defender')
  assert.ok(ids('Microsoft Defender SmartScreen prevented an unrecognized app from starting').includes('smartscreen'))
})

test('doctor: macOS Gatekeeper', () => {
  assert.equal(first('"qminer" cannot be opened because the developer cannot be verified.'), 'gatekeeper')
  assert.equal(first('"qminer" Not Opened. Apple could not verify "qminer" is free of malware'), 'gatekeeper')
  assert.equal(first('“qminer” cannot be opened because it is from an unidentified developer.'), 'gatekeeper')
})

test('doctor: HiveOS custom miner install', () => {
  assert.equal(first('gzip: stdin: not in gzip format'), 'hive-install')
  assert.equal(first('tar: Error is not recoverable: exiting now'), 'hive-install')
  assert.equal(first('/hive/miners/custom/qminer/h-run.sh: No such file or directory'), 'hive-install')
  assert.equal(first('Custom miner qminer install failed'), 'hive-install')
  assert.equal(first('worker package download failed'), 'package-download')
})

test('doctor: systemd failures and restart loops', () => {
  assert.equal(first('qubic-miner.service: Main process exited, code=exited, status=1/FAILURE'), 'systemd')
  assert.equal(first('qubic-miner.service: Start request repeated too quickly.'), 'systemd')
  assert.equal(first('qubic-miner.service: Scheduled restart job, restart counter is at 5.'), 'systemd')
  assert.equal(first('Active: activating (auto-restart) (Result: exit-code) since Wed'), 'systemd')
  assert.equal(first('qubic-miner.service: Failed at step EXEC spawning /opt/qubic-miner/run.sh: Permission denied'), 'systemd')
  assert.equal(first('Process: 812 ExecStart=/opt/qubic-miner/run.sh (code=exited, status=203/EXEC)'), 'systemd')
  // The cause outranks the restart loop.
  const d = diagnose('qubic-miner.service: Main process exited, code=dumped, status=4/ILL\nqubic-miner.service: Failed with result \'core-dump\'.')
  assert.equal(d.findings[0]!.id, 'no-avx')
  assert.ok(d.findings.some(f => f.id === 'systemd'))
})

test('doctor: the machine going to sleep', () => {
  assert.equal(first('PM: suspend entry (deep)'), 'sleep')
  assert.equal(first('systemd[1]: Reached target Sleep.'), 'sleep')
  assert.equal(first('The system is entering sleep.'), 'sleep')
  assert.equal(first('Sleep  Entering Sleep state due to \'Idle Sleep\''), 'sleep')
  assert.equal(first('The system has resumed from sleep.'), 'sleep')
  assert.equal(first('Kernel-Power event 42'), 'sleep')
})

const SMI_CLEAN = `    Clocks Event Reasons
        Idle                              : Not Active
        Applications Clocks Setting       : Not Active
        SW Power Cap                      : Not Active
        HW Slowdown                       : Not Active
            HW Thermal Slowdown           : Not Active
            HW Power Brake Slowdown       : Not Active
        Sync Boost                        : Not Active
        SW Thermal Slowdown               : Not Active
        Display Clock Setting             : Not Active`

test('doctor: GPU power-limited or throttled, and a clean nvidia-smi dump is not', () => {
  assert.equal(first('        SW Power Cap                      : Active'), 'gpu-power')
  assert.equal(first('        HW Slowdown                       : Active'), 'gpu-power')
  assert.equal(first('GPU 0 power limit reached, clocks reduced'), 'gpu-power')
  assert.equal(first('        SW Thermal Slowdown               : Active'), 'thermal')
  assert.equal(first('[WARN] GPU throttling detected'), 'thermal')
  assert.equal(diagnose(SMI_CLEAN).status, 'unknown')
  assert.equal(diagnose(SMI_CLEAN.replace('Clocks Event Reasons', 'Clocks Throttle Reasons')).status, 'unknown')
  assert.deepEqual(ids(`${SMI_CLEAN}\n[CUDA] 49 it/s`), ['mining'])
})

test('doctor: new symptoms exist and every rule has a fix', () => {
  assert.ok(SYMPTOMS.some(s => s.id === 'sleeps'))
  assert.ok(SYMPTOMS.some(s => s.id === 'blocked'))
  for (const id of ['defender', 'smartscreen', 'gatekeeper', 'hive-install', 'systemd', 'sleep', 'gpu-power']) {
    const r = RULES.find(x => x.id === id)
    assert.ok(r && r.fix.length > 0 && (r.sources?.length ?? 0) > 0, id)
  }
})

/* ---------- prompt ---------- */

test('prompt: procedures, tips and rules, compact and clean', () => {
  const p = mariaSystemPrompt(NOW)
  for (const re of [/systemctl enable --now qubic-miner/, /caffeinate -dimsu/, /schtasks \/create/, /Installation URL/, /On-start/, /nvidia-smi -pl <WATTS>/, /general, not Qubic-measured/, /AMD Radeon GPUs: we have no measurements/])
    assert.match(p, re)
  assert.ok(p.includes(MINER_COMMAND))
  assert.match(p, /never invent it/)
  assert.doesNotMatch(p, /—/)
  assert.doesNotMatch(p, /\bCODED\b/)
  assert.doesNotMatch(p, /--wallet/)
  assert.ok(p.length < 56_000, `prompt is ${p.length} chars`)
})

/* ---------- the Discord Maria card ---------- */

test('discord card: format of the bot repo, from the same facts', () => {
  const md = renderMiningCard('abc1234')
  assert.match(md, /^---\ndomain: mining\ntitle: .+\nversion: 1\nas_of: 2026-11-04\nstatus: черновик — ждёт «да» Боба\nrule: .+\n---\n/)
  const heads = [...md.matchAll(/^## (mining-(\d{3})) · .+$/gm)]
  assert.ok(heads.length >= 25)
  for (const [i, h] of heads.entries()) assert.equal(Number(h[2]), i + 1)
  for (const block of md.split(/^## /m).slice(1)) {
    for (const field of ['- tags: ', '- claim: ', '- source: ', '- as_of: ', '- status: ']) assert.ok(block.includes(field), `${block.slice(0, 40)}: ${field}`)
  }
  // Same facts as the site.
  for (const s of [SYSTEMD_UNIT.split('\n')[0]!, 'Restart=always', 'caffeinate -dimsu', 'schtasks /create', 'Installation URL', MINER_COMMAND, POOL.onboardingUrl, ...HARD_RULES])
    assert.ok(md.includes(s), s)
  // Em dash only in the required status line; the partner is named in one entry only.
  assert.deepEqual(md.split('\n').filter(l => l.includes('—')), ['status: черновик — ждёт «да» Боба'])
  assert.equal(md.split(/^## /m).filter(b => b.includes(POOL.partner.name)).length, 1)
  assert.doesNotMatch(md, /[a-z]{55}/)
  assert.match(md, /коммит abc1234/)
})

test('field measurements: 5080 is golden from our runs, 4090 carries its measured rate', async () => {
  const hw = await import('../hardware.ts')
  const fn = Object.values(hw).find((f: any) => typeof f === 'function' && /gpu/i.test(f.name) && f.length >= 1) as any
  const { FACTS, isField } = await import('../knowledge.ts')
  assert.ok(FACTS.some(f => f.sources.some(isField) && /2,440 sol\/h/.test(f.text)))
  assert.ok(FACTS.some(f => f.sources.some(isField) && /20 minutes/.test(f.text)))
  if (fn) {
    const c = fn('RTX 5080')
    if (c && c.verdict) assert.equal(c.verdict, 'Golden')
  }
})
