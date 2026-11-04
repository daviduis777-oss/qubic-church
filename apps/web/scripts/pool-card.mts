// Renders the Discord Maria knowledge card (cards/mining.md in maria-aigarth-botv3) from lib/pool/*.ts,
// so the site Maria and the Discord Maria say the same things. Regenerate, never edit the card by hand:
//   node --experimental-strip-types apps/web/scripts/pool-card.mts ../maria-aigarth-botv3/cards/mining.md
// Without a path it prints to stdout.
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const { HARDWARE_FIGURES, HARDWARE_FIGURES_SOURCE, OS_LABEL, POOL, RENTALS, WALLET, keepPercent } = await import('../src/lib/pool/config.ts')
const { RULES, SYMPTOMS } = await import('../src/lib/pool/doctor.ts')
const { EPOCH_ANCHOR, EPOCH_SOURCE, formatUtc, epochStart } = await import('../src/lib/pool/epoch.ts')
const { BUILDS, FACTS, GLANCE } = await import('../src/lib/pool/knowledge.ts')
const { FAQ, FAQ_THEMES } = await import('../src/lib/pool/faq.ts')
const { stalenessBlock } = await import('../src/lib/pool/prompt.ts')
const P = await import('../src/lib/pool/practice.ts')
const { HARD_RULES } = await import('../src/lib/pool/rules.ts')
const { SEED_WARNING } = await import('../src/lib/pool/wizard.ts')

type AnySource = Parameters<typeof P.sourceOf>[0]
type Entry = { title: string; tags: string[]; tier?: number; claim: string; extra?: string; sources: string; doNot?: string; status?: string }

const AS_OF = P.KNOWLEDGE_AS_OF
const SITE = 'https://qubic.church'

const src = (ids: AnySource[]) =>
  [...new Set(ids)]
    .map(id => {
      const s = P.sourceOf(id)
      const url = s.url ? (s.url.startsWith('/') ? SITE + s.url : s.url) : ''
      return `${s.label} (${s.date})${url ? ` ${url}` : ''}`
    })
    .join(' ; ')

const SITE_SRC = (file: string) => `qubic-church apps/web/src/lib/pool/${file} (${AS_OF})`

const PROC_TITLE: Record<string, string> = {
  'linux-nvidia': 'Драйвер NVIDIA на Ubuntu 22.04 / 24.04',
  'linux-cpu': 'Проверка CPU и памяти на Linux',
  'linux-run': 'Linux: команда пула в run.sh',
  'linux-systemd': 'Linux: служба systemd',
  'linux-nohup': 'Linux: быстрый запуск через nohup',
  'gpu-power': 'Лимит мощности GPU (общий совет)',
  windows: 'Windows',
  macos: 'macOS на Apple Silicon',
  hiveos: 'HiveOS: свой майнер в полётном листе',
  rental: 'Арендованный сервер',
}

const indent = (s: string, n = 4) => s.split('\n').map(l => (l ? ' '.repeat(n) + l : l)).join('\n')

function procedureBlock(p: (typeof P.PROCEDURES)[keyof typeof P.PROCEDURES]): string {
  const steps = p.steps.map((s, i) => {
    const head = `${i + 1}. ${s.title}.${s.body ? ` ${s.body}` : ''}`
    return s.command ? `${head}\n\n${indent('```\n' + s.command + '\n```', 3)}` : head
  })
  const checks = p.checks.map(c => `- ${c.title}${c.command ? `: \`${c.command}\`` : ''}${c.body ? `. ${c.body}` : ''}`)
  return [`- steps:\n\n${indent(steps.join('\n'), 2)}`, checks.length ? `- check:\n${indent(checks.join('\n'), 2)}` : ''].filter(Boolean).join('\n')
}

export function entries(): Entry[] {
  const out: Entry[] = []

  out.push({
    title: 'Как Мария держит тему майнинга',
    tags: ['mining rules', 'income', 'profit', 'price', 'seed', 'jetski', 'amd radeon'],
    tier: 0,
    claim: HARD_RULES.join(' '),
    sources: SITE_SRC('rules.ts'),
    doNot: 'не обещать и не считать доход; не говорить о цене; не придумывать команду майнера, имя бинарника или API статистики',
  })

  out.push({
    title: 'Живые данные: эпоха сейчас',
    tags: ['epoch', 'current epoch', 'epoch end', 'when does the epoch end', 'wednesday 12 utc'],
    claim: `An epoch runs ${POOL.payout.epoch}. Epoch ${EPOCH_ANCHOR.epoch} started ${formatUtc(epochStart(EPOCH_ANCHOR.epoch))}; every Wednesday 12:00 UTC the number goes up by one. Current epoch = ${EPOCH_ANCHOR.epoch} + floor((now - ${epochStart(EPOCH_ANCHOR.epoch).toISOString()}) / 7 days). The number and the time to its end are computed by code at answer time (site: nowLine() in lib/pool/epoch.ts); Maria does not count it in her head. At an epoch change the miner idles by itself until the backend updates: do nothing.`,
    sources: `${EPOCH_SOURCE.label} (${EPOCH_SOURCE.date}) ${EPOCH_SOURCE.url} ; ${SITE_SRC('epoch.ts')}`,
    doNot: 'не называть номер эпохи по памяти: брать из живых данных',
  })

  out.push({
    title: 'Пул: что это и как подключиться',
    tags: ['qubic church pool', 'connect', 'setup page', 'onboarding', 'worker name', 'backend', 'threads', 'QC.'],
    claim: [
      `${POOL.name} is a tagged sub-pool: workers whose names start with ${POOL.workerPrefix} count as ours.`,
      `Setup page: ${POOL.onboardingUrl}. It asks for: ${POOL.onboardingFields.join(', ')}.`,
      `Operating systems: ${POOL.osOptions.map(o => OS_LABEL[o]).join(', ')}. Backends: ${POOL.backends.join(', ')}: GPU for NVIDIA, AVX512 if the CPU has AVX-512, AVX2 otherwise, Auto when unsure or on Apple Silicon.`,
      `Worker names: start with ${POOL.workerPrefix}, letters, numbers and . - _ only, up to ${POOL.workerMaxLength} characters, one unique name per machine (e.g. ${POOL.workerPrefix}5070ti-a).`,
      `Launch command: ${POOL.launchLine ? 'see the setup page' : `not published yet. Procedures write it as ${P.MINER_COMMAND}: the exact command the setup page gives.`} Stats page: ${POOL.statsUrl ?? 'not published yet; the worker shows on the pool dashboard'}.`,
    ].join(' '),
    sources: SITE_SRC('config.ts'),
    status: POOL.launchLine ? undefined : 'черновик · команда запуска, имя бинарника и API статистики ждут Боба (TODO(Bob))',
  })

  out.push({
    title: 'Кто держит инфраструктуру пула',
    tags: ['who runs the pool', 'partner', 'operator', 'infrastructure'],
    claim: `${POOL.name} runs as a tagged sub-pool on the partner pool ${POOL.partner.name}. Only when the user asks directly who runs the pool: say this one sentence. Otherwise do not name or describe the partner.`,
    sources: SITE_SRC('config.ts'),
    doNot: 'не называть партнёра в обычных ответах; не описывать инфраструктуру и деление комиссии',
  })

  out.push({
    title: 'Выплаты по эпохам и комиссия',
    tags: ['payout', 'rewards', 'when paid', 'fee', 'epoch payout'],
    claim: `Rewards go straight to the user's own wallet, ${POOL.payout.timing}, paid in ${POOL.payout.currency}. An epoch runs ${POOL.payout.epoch}. Payout usually lands about a week after the epoch closes (Wednesday or Thursday, sometimes Friday). Fee, only if asked: ${POOL.feePercent}%, the user keeps ${keepPercent}%. No income projections: the self-check is cost per solution = daily cost ÷ solutions per day, measured over one real epoch.`,
    sources: `${SITE_SRC('config.ts')} ; ${SITE_SRC('prompt.ts')}`,
    doNot: 'не называть сумму выплаты, доходность и окупаемость; не описывать деление комиссии',
  })

  out.push({
    title: 'Кошелёк: адрес и сид',
    tags: ['wallet', 'address', 'seed', 'qubic id', '60 letters', '55 letters'],
    tier: 0,
    claim: `${WALLET.address.rule} ${WALLET.seed.rule} If someone shows a seed: ${SEED_WARNING}`,
    sources: SITE_SRC('config.ts'),
    doNot: 'никогда не просить и не принимать сид; не повторять сид из сообщения',
  })

  const topics = [...new Set(FACTS.map(f => f.topic))]
  const TOPIC_RU: Record<string, string> = { CPU: 'процессор', GPU: 'видеокарта', RAM: 'память', Storage: 'диск', Network: 'сеть', Host: 'хост', Mac: 'Mac', ASIC: 'ASIC', Measured: 'наши замеры', Rental: 'аренда', Mode: 'режим GPU и CPU', Judging: 'как судить о риге', Operations: 'эксплуатация', Payouts: 'выплаты', Staleness: 'свежесть замеров' }
  for (const t of topics) {
    const fs = FACTS.filter(f => f.topic === t)
    out.push({
      title: `Железо: ${TOPIC_RU[t] ?? t}`,
      tags: ['hardware', t.toLowerCase(), ...(t === 'GPU' ? ['nvidia', 'cuda 12', 'vram', 'amd radeon'] : []), ...(t === 'CPU' ? ['avx-512', 'ryzen', 'epyc', 'threadripper'] : [])],
      claim: fs.map(f => f.text).join(' '),
      sources: src(fs.flatMap(f => f.sources)),
      status: fs.some(f => f.sources.includes('partner')) ? 'черновик · цифры партнёра est., дата таблицы ждёт Боба' : undefined,
    })
  }

  out.push({
    title: 'Железо коротко',
    tags: ['hardware at a glance', 'what to buy', 'best cpu', 'best gpu'],
    claim: GLANCE.map(g => `${g.part}: ${g.pick}. ${g.note}`).join(' ') + ' Judge every machine by solutions per hour and cost per solution, never by it/s.',
    sources: src(GLANCE.flatMap(g => g.sources)),
  })

  out.push({
    title: 'Сборки по уровням',
    tags: ['build', 'buy', 'tier', 'entry', 'server'],
    claim: Object.values(BUILDS).map(b => `${b.title}: ${b.specs.map(([k, v]) => `${k} ${v}`).join(', ')}. ${b.reasons.join(' ')}`).join(' ') + ' No prices: they change weekly.',
    sources: src(Object.values(BUILDS).flatMap(b => b.sources)),
    doNot: 'не называть цены',
  })

  out.push({
    title: 'Цифры it/s с пометкой est.',
    tags: ['it/s', 'hashrate', 'iterations per second', 'speed'],
    claim: `${HARDWARE_FIGURES.map(f => `${f.name} about ${f.itPerSec} it/s (${f.kind}, est.)`).join('; ')}. Source: ${HARDWARE_FIGURES_SOURCE.label}. it/s is speed, not pay.`,
    sources: `${HARDWARE_FIGURES_SOURCE.label} (${HARDWARE_FIGURES_SOURCE.date ?? 'est., дата не записана'})`,
    status: HARDWARE_FIGURES_SOURCE.date ? undefined : 'черновик · дата таблицы партнёра ждёт Боба',
  })

  out.push({
    title: 'Аренда: где и что проверить',
    tags: ['rent', 'rental', 'clore', 'vast', 'octaspace', 'cloud gpu'],
    claim: `Marketplaces: ${RENTALS.map(r => `${r.name} (${r.note})`).join(' ')} ${P.PROCEDURES.rental.steps
      .slice(0, 3)
      .map(s => `${s.title}: ${s.body}`)
      .join(' ')}`,
    sources: src(P.PROCEDURES.rental.steps.slice(0, 3).flatMap(s => s.sources)),
    doNot: 'не сравнивать цены аренды; не обещать окупаемость',
  })

  for (const p of Object.values(P.PROCEDURES)) {
    out.push({
      title: PROC_TITLE[p.id] ?? p.title,
      tags: ['how to', p.id, ...p.title.toLowerCase().split(/[^a-z0-9.+-]+/).filter(w => w.length > 3)].slice(0, 8),
      tier: p.id === 'gpu-power' ? 2 : 1,
      claim: `${p.title}. ${p.summary}`,
      extra: procedureBlock(p),
      sources: src(P.procedureSources(p)),
      doNot: p.steps.some(s => s.command?.includes(P.MINER_COMMAND)) ? `не подставлять выдуманную команду вместо ${P.MINER_COMMAND}` : undefined,
    })
  }

  out.push({
    title: 'Советы по эффективности',
    tags: ['efficiency', 'power limit', 'cooling', 'one miner', 'unique worker'],
    claim: P.TIPS.map(t => `${t.title}: ${t.text}${t.general ? ' (general, not Qubic-measured)' : ''}`).join(' '),
    sources: src(P.TIPS.flatMap(t => t.sources)),
  })

  const ruleSources = (ids: AnySource[] | undefined) => (ids?.length ? ids : (['guide'] as AnySource[]))
  const groups: [string, string[], (typeof RULES)[number]['severity']][] = [
    ['Разбор логов: поломки', ['log', 'error', 'fix my rig', 'troubleshoot'], 'fault'],
    ['Разбор логов: проверить', ['log', 'warning', 'slow', 'sleep', 'throttle'], 'check'],
    ['Разбор логов: всё в порядке', ['log', 'normal', 'it/s', 'epoch idle'], 'fine'],
  ]
  for (const [title, tags, sev] of groups) {
    const rs = RULES.filter(r => r.severity === sev)
    out.push({
      title,
      tags,
      claim: rs.map(r => `${r.title}: ${r.means} Fix: ${r.fix.join(' ')}`).join(' | '),
      sources: src(rs.flatMap(r => ruleSources(r.sources))),
    })
  }
  out.push({
    title: 'Свежесть наших замеров',
    tags: ['stale', 'old data', 'epoch 229', 'epoch 233', 'jetski', '32 neurons', 'prediction accuracy'],
    claim: stalenessBlock().replace(/^STALENESS\n/, '').replace(/^- /gm, '').replace(/\n/g, ' '),
    sources: src(['field', 'field-e229', 'field-e233', 'cfb']),
    doNot: 'не выдавать цифры эпох 229 и 233 за текущие; не сравнивать sol/h между эпохами 229 и 233',
  })

  for (const [theme, label] of Object.entries(FAQ_THEMES) as [keyof typeof FAQ_THEMES, string][]) {
    const es = FAQ.filter(e => e.theme === theme)
    if (!es.length) continue
    out.push({
      title: `Вопросы майнеров: ${label}`,
      tags: ['faq', theme, label.toLowerCase(), ...es.map(e => e.id.replace(/-/g, ' '))].slice(0, 10),
      claim: es.map(e => `"${e.q}" ${e.a} (as of ${e.asOf})`).join(' | '),
      sources: src(es.flatMap(e => e.sources)),
      doNot: theme === 'profitability' || theme === 'rentals' ? 'не называть доход, прибыль и окупаемость в цифрах; об убытках только «майнеры сообщали об убытках в некоторых эпохах»' : undefined,
    })
  }

  out.push({
    title: 'Разбор по симптомам (без лога)',
    tags: ['no solutions', 'dashboard behind', 'worker missing', 'stops when away', 'blocked'],
    claim: SYMPTOMS.map(s => `${s.label}: ${s.finding.means} ${s.finding.fix.join(' ')}`).join(' | '),
    sources: src(['guide', 'field-e229', 'field-e233', 'winPower', 'caffeinate', 'defenderExclusion', 'gatekeeper']),
  })

  return out
}

export function renderMiningCard(rev?: string): string {
  const es = entries()
  const head = [
    '---',
    'domain: mining',
    'title: Майнинг Qubic в Qubic Church Pool',
    'version: 1',
    `as_of: ${AS_OF}`,
    'status: черновик — ждёт «да» Боба',
    'rule: те же факты, что у Марии на сайте. Числа только с датированным источником или с пометкой est. Доход не обещать и не считать, единственная формула: стоимость решения = расходы в день ÷ решений в день. О цене не говорить. Сид не просить. Команду майнера не выдумывать. Утверждения дословно с сайта, по-английски; Мария пересказывает их на языке собеседника, не меняя чисел, команд и имён.',
    '---',
    '',
    '# Майнинг: карточки',
    '',
    `Сгенерировано из qubic-church \`apps/web/src/lib/pool/*.ts\`${rev ? ` (коммит ${rev})` : ''} скриптом \`apps/web/scripts/pool-card.mts\`. Руками не править: поменять факт на сайте и перегенерировать.`,
    '',
    `Команды пула пока нет: в процедурах она записана как \`${P.MINER_COMMAND}\`, то есть «команда со страницы настройки пула». Живые данные (номер эпохи, время до конца) считает код в момент ответа.`,
    '',
    '---',
    '',
    '',
  ]
  const body = es.map((e, i) => {
    const id = `mining-${String(i + 1).padStart(3, '0')}`
    return [
      `## ${id} · ${e.title}`,
      `- tags: ${[...new Set(e.tags)].join(', ')}`,
      `- tier: ${e.tier ?? 1}`,
      `- claim: ${e.claim}`,
      ...(e.extra ? [e.extra] : []),
      `- source: ${e.sources}`,
      `- as_of: ${AS_OF}`,
      ...(e.doNot ? [`- do_not: ${e.doNot}`] : []),
      `- status: ${e.status ?? 'черновик'}`,
      '',
    ].join('\n')
  })
  return head.join('\n') + body.join('\n')
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  let rev: string | undefined
  try {
    rev = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: dirname(fileURLToPath(import.meta.url)) }).toString().trim()
  } catch {}
  const md = renderMiningCard(rev)
  const out = process.argv[2]
  if (out) writeFileSync(out, md)
  else process.stdout.write(md)
}
