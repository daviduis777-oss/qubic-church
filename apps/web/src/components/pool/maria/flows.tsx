'use client'

import { ExternalLink } from 'lucide-react'
import { useCallback, useState } from 'react'
import { OS_LABEL, POOL, RENTALS, type Os } from '@/lib/pool/config'
import type { Summary } from '@/lib/pool/aggregate'
import { diagnose, type Finding, SYMPTOMS } from '@/lib/pool/doctor'
import { classifyCpu, pick, type PickMode, type Scale } from '@/lib/pool/hardware'
import type { BuildTier } from '@/lib/pool/knowledge'
import { extractMetrics } from '@/lib/pool/measure'
import { type Avx, buildPlan, checkWallet, checkWorker, cleanWorker, type Hw, suggestWorker, THREAD_COMMAND } from '@/lib/pool/wizard'
import { type Answers, Flow, type Outcome, restartChip, type StepDef } from './flow'
import { LogMeasure, useMeasured } from './measured'
import { Checklist, Command, CopyButton, Group, Reveal, SEVERITY_LABEL, StatusCard, severityIcon, severityTone, TONE, VerdictCard, verdictTone } from './ui'
import s from './maria.module.css'

export type Screen = 'home' | 'pick' | 'connect' | 'doctor' | 'ask'
export type Go = (screen: Screen, handoff?: Answers) => void

const OS_CHIPS = (['linux', 'windows', 'macos', 'hiveos'] as Os[]).map(o => ({ value: o, label: OS_LABEL[o] }))

function Notes({ label, items }: { label: string; items: string[] }) {
  return (
    <Group label={label}>
      {items.map(n => (
        <li className={s.row} key={n}>
          <span className={s.rowBody} style={{ margin: 0, color: 'var(--bone)' }}>
            {n}
          </span>
        </li>
      ))}
    </Group>
  )
}

/* ---------------- Pick hardware (and consult on what you own) ---------------- */

const PICK_STEPS: StepDef[] = [
  {
    id: 'mode',
    ask: () => 'Are you buying, renting, or checking hardware you already have?',
    chips: () => [
      { value: 'own', label: 'I already have hardware' },
      { value: 'buy', label: 'Buy' },
      { value: 'rent', label: 'Rent a box' },
    ],
  },
  {
    id: 'build',
    when: a => a.mode === 'buy',
    ask: () => 'How far do you want to go?',
    chips: () => [
      { value: 'entry', label: 'Entry PC' },
      { value: 'cpu', label: 'Strong CPU' },
      { value: 'gpu', label: 'CPU + GPU' },
      { value: 'server', label: 'Server' },
    ],
  },
  {
    id: 'os',
    when: a => a.mode === 'buy',
    ask: () => 'Which system should it run?',
    chips: () => [...OS_CHIPS, { value: 'any', label: 'No preference' }],
  },
  {
    id: 'scale',
    when: a => a.mode === 'rent',
    ask: () => 'How big do you want to start?',
    chips: () => [
      { value: 'small', label: 'One box, to test' },
      { value: 'mid', label: 'One serious rig' },
      { value: 'large', label: 'Several GPUs' },
    ],
  },
  {
    id: 'cpu',
    when: a => a.mode === 'own',
    ask: () => 'Which CPU? The model name is enough, for example Ryzen 9 7950X, EPYC 9654 or Apple M3 Pro.',
    text: { label: 'CPU model', placeholder: 'CPU model', maxLength: 80 },
  },
  {
    id: 'gpu',
    when: a => a.mode === 'own',
    ask: () => 'And the graphics card?',
    chips: () => [{ value: 'none', label: 'No GPU' }],
    text: { label: 'GPU model', placeholder: 'For example RTX 5070 Ti', maxLength: 80 },
    echo: v => (v === 'none' ? 'No GPU' : v),
  },
  {
    id: 'gpus',
    when: a => a.mode === 'own' && !!a.gpu && a.gpu !== 'none',
    ask: () => 'How many of those cards?',
    chips: () => ['1', '2', '3', '4', '6', '8'].map(v => ({ value: v, label: v })),
  },
  {
    id: 'cores',
    when: a => a.mode === 'own' && !!a.gpu && a.gpu !== 'none',
    ask: () => 'How many CPU cores? It decides whether the CPU can feed the cards.',
    chips: () => [{ value: '0', label: 'Not sure' }],
    text: {
      label: 'CPU cores',
      placeholder: 'Cores, for example 16',
      numeric: true,
      maxLength: 4,
      validate: v => (/^\d{1,4}$/.test(v.trim()) && Number(v) > 0 ? { ok: true, value: String(Number(v)) } : { ok: false, error: 'A whole number, for example 16.' }),
    },
    echo: v => (v === '0' ? 'Not sure' : `${v} cores`),
  },
  {
    id: 'ram',
    when: a => a.mode === 'own',
    ask: () => 'How much RAM?',
    chips: () => [
      { value: '8', label: 'Under 16 GB' },
      { value: '16', label: '16 GB' },
      { value: '32', label: '32 GB' },
      { value: '64', label: '64 GB or more' },
      { value: '0', label: 'Not sure' },
    ],
  },
  {
    id: 'os',
    when: a => a.mode === 'own',
    ask: () => 'Which system does it run?',
    chips: () => OS_CHIPS,
  },
]

function pickOutcome(a: Answers, go: Go, measured: Summary | null): Outcome {
  const r = pick({
    mode: a.mode as PickMode,
    scale: a.scale as Scale,
    build: a.build as BuildTier,
    os: a.os && a.os !== 'any' ? (a.os as Os) : undefined,
    cpu: a.cpu,
    gpu: a.gpu === 'none' ? '' : a.gpu,
    gpuCount: a.gpus ? Number(a.gpus) : undefined,
    cores: a.cores && a.cores !== '0' ? Number(a.cores) : undefined,
    ramGb: a.ram && a.ram !== '0' ? Number(a.ram) : undefined,
  }, measured)
  const own = a.mode === 'own'
  const lead = own
    ? r.overall === 'Skip'
      ? 'Not worth mining on as it is. Here is why, part by part.'
      : r.overall === 'Unknown'
        ? 'I could not place every part. Here is what I can tell.'
        : 'Here is how your hardware does, part by part.'
    : a.mode === 'buy'
      ? 'Your build first, then one step either side. No prices: they change weekly, so compare them yourself.'
      : 'What to rent, best first. No prices: they change weekly, so compare them yourself.'
  const cards = r.cards.map(c => <VerdictCard c={c} key={c.title} />)
  if (a.mode === 'rent') {
    cards.push(
      <Group key="rent" label="Where people rent">
        {RENTALS.map(x => (
          <li className={s.row} key={x.name}>
            <div className={s.rowMain}>
              <div className={s.rowTitle}>{x.name}</div>
              <p className={s.rowBody}>
                {x.note}
                {x.referral && ' Our referral link: a few credits come our way; the advice is the same either way.'}
              </p>
            </div>
            <a aria-label={`Open ${x.name}`} className={s.iconBtn} href={x.url} rel={x.referral ? 'noopener noreferrer sponsored' : 'noopener noreferrer'} target="_blank">
              <ExternalLink aria-hidden size={16} />
            </a>
          </li>
        ))}
      </Group>,
    )
  }
  cards.push(<Notes items={r.notes} key="notes" label={own ? 'Notes' : 'Before you spend'} />)
  return {
    tone: verdictTone(r.overall),
    lead,
    cards: [<Reveal key="r">{cards}</Reveal>],
    chips: [...(own && r.overall !== 'Skip' ? [{ value: 'connect', label: 'Set it up', primary: true }] : []), restartChip()],
    onChip: (v: string) => {
      if (v === 'home') return go('home')
      if (v === 'connect') {
        const gpu = a.gpu && a.gpu !== 'none' ? a.gpu : ''
        const cpu = classifyCpu(a.cpu ?? '')
        const hw: Hw = cpu.avx === 'apple' ? 'apple' : /radeon|\brx ?\d/i.test(gpu) ? 'amd' : gpu ? 'nvidia' : 'cpu'
        const handoff: Answers = { os: a.os ?? 'linux', hw }
        handoff.model = hw === 'nvidia' || hw === 'amd' ? gpu : (a.cpu ?? '')
        if (hw === 'cpu' || hw === 'amd') {
          handoff.cpuModel = a.cpu ?? ''
          if (cpu.avx === 'avx512' || cpu.avx === 'avx2') handoff.avx = cpu.avx
        }
        go('connect', handoff)
      }
    },
  }
}

export function PickFlow({ go }: { go: Go }) {
  const { summary } = useMeasured()
  return <Flow intro="Let's find hardware that wins on cost per solution." onBack={() => go('home')} outcome={a => pickOutcome(a, go, summary)} steps={PICK_STEPS} sub="What to buy, what to rent, or how yours does." title="Pick hardware" />
}

/* ---------------- Connect my machine ---------------- */

const LAST = 'qc-pool:connect'
const loadLast = (): Answers | null => {
  try {
    const j = JSON.parse(localStorage.getItem(LAST) ?? 'null') as Answers | null
    return j && typeof j === 'object' && j.os ? j : null
  } catch {
    return null
  }
}
const saveLast = (a: Answers) => {
  try {
    // Never the wallet: only what the machine is.
    const { os, hw, model, avx, dedicated, threads, worker } = a
    localStorage.setItem(LAST, JSON.stringify({ os, hw, model, avx, dedicated, threads, worker }))
  } catch {}
}

const avxFromModel = (model?: string): Avx => {
  const c = classifyCpu(model ?? '')
  return c.avx === 'avx512' || c.avx === 'avx2' ? c.avx : c.avx === 'apple' ? 'apple' : c.avx === 'none' ? 'none' : 'unknown'
}

const CONNECT_STEPS: StepDef[] = [
  { id: 'os', ask: () => 'Which system does the machine run?', chips: () => OS_CHIPS },
  {
    id: 'hw',
    ask: a => (a.os === 'macos' ? 'Which Mac?' : 'What will mine?'),
    chips: a =>
      a.os === 'macos'
        ? [
            { value: 'apple', label: 'Apple Silicon' },
            { value: 'cpu', label: 'Intel Mac' },
          ]
        : [
            { value: 'nvidia', label: 'NVIDIA GPU' },
            { value: 'cpu', label: 'CPU only' },
            { value: 'amd', label: 'AMD Radeon GPU' },
          ],
  },
  {
    id: 'model',
    ask: a => (a.hw === 'nvidia' ? 'Which card? I use it for the worker name.' : a.hw === 'apple' ? 'Which chip? For example M3 Pro.' : 'Which CPU? I use it to pick the backend.'),
    chips: () => [{ value: '-', label: 'Skip' }],
    text: { label: 'Model', placeholder: 'Model name', maxLength: 80 },
    echo: v => (v === '-' ? 'Skipped' : v),
  },
  {
    id: 'cpuModel',
    when: a => a.hw === 'amd',
    ask: () => 'AMD cards are not supported by the official GPU miner, so we mine on your CPU. Which CPU is it?',
    chips: () => [{ value: '-', label: 'Skip' }],
    text: { label: 'CPU model', placeholder: 'CPU model', maxLength: 80 },
    echo: v => (v === '-' ? 'Skipped' : v),
  },
  {
    id: 'avx',
    when: a => (a.hw === 'cpu' || a.hw === 'amd') && avxFromModel(a.hw === 'amd' ? a.cpuModel : a.model) === 'unknown',
    ask: a => (
      <>
        Does the CPU have AVX-512?{' '}
        {a.os === 'linux' || a.os === 'hiveos' ? (
          <>
            Run <code>grep -o -m1 avx512f /proc/cpuinfo</code>: it prints avx512f if yes.
          </>
        ) : (
          'Look up the model if you are not sure.'
        )}
      </>
    ),
    chips: () => [
      { value: 'avx512', label: 'Yes, AVX-512' },
      { value: 'avx2', label: 'AVX2 only' },
      { value: 'unknown', label: 'Not sure' },
    ],
  },
  {
    id: 'dedicated',
    ask: () => 'Is this a dedicated mining box, or a computer you also use?',
    chips: () => [
      { value: 'yes', label: 'Dedicated or rented' },
      { value: 'no', label: 'I also use it' },
    ],
  },
  {
    id: 'threads',
    ask: a => (
      <>
        How many CPU threads? Run <code>{THREAD_COMMAND[a.os as Os] ?? 'nproc'}</code> on it.
      </>
    ),
    chips: () => [{ value: '0', label: 'Not sure' }],
    text: {
      label: 'Threads',
      placeholder: 'Threads, for example 32',
      numeric: true,
      maxLength: 4,
      validate: v => (/^\d{1,4}$/.test(v.trim()) && Number(v) > 0 ? { ok: true, value: String(Number(v)) } : { ok: false, error: 'A whole number, the output of the command.' }),
    },
    echo: v => (v === '0' ? 'Not sure' : `${v} threads`),
  },
  {
    id: 'wallet',
    ask: () => 'Paste your Qubic address: 60 uppercase letters, from your wallet. Never the 55-letter seed. It stays in this browser.',
    text: {
      label: 'Qubic address',
      placeholder: '60 uppercase letters',
      mono: true,
      multiline: true,
      rows: 2,
      maxLength: 200,
      validate: v => {
        const r = checkWallet(v)
        return r.ok ? { ok: true, value: r.value } : { ok: false, error: r.message }
      },
    },
    echo: v => `${v.slice(0, 6)}…${v.slice(-6)}`,
    monoEcho: true,
  },
  {
    id: 'worker',
    ask: () => `Name this machine. Worker names start with ${POOL.workerPrefix}; one unique name per machine.`,
    text: {
      label: 'Worker name',
      placeholder: `${POOL.workerPrefix}rig-a`,
      mono: true,
      maxLength: POOL.workerMaxLength + 8,
      suggest: a => suggestWorker(a.hw as Hw, a.model === '-' ? '' : a.model),
      validate: v => {
        const w = cleanWorker(v)
        const c = checkWorker(w)
        return c.ok ? { ok: true, value: w } : { ok: false, error: c.message }
      },
    },
    monoEcho: true,
  },
]

function connectOutcome(a: Answers, go: Go): Outcome {
  const hw = a.hw as Hw
  const model = a.model === '-' ? '' : a.model
  const avx: Avx = a.avx ? (a.avx as Avx) : hw === 'apple' ? 'apple' : hw === 'nvidia' ? 'unknown' : avxFromModel(hw === 'amd' ? a.cpuModel : model)
  const plan = buildPlan({
    os: a.os as Os,
    hw,
    avx,
    model,
    wallet: a.wallet ?? '',
    worker: a.worker ?? '',
    threads: a.threads && a.threads !== '0' ? Number(a.threads) : undefined,
    dedicated: a.dedicated === 'yes',
  })
  const cards = [
    ...plan.warnings.map(w => (
      <p className={s.warn} key={w}>
        {w}
      </p>
    )),
    <Group key="values" label="Your values">
      {plan.values.map(v => (
        <li className={s.row} key={v.label}>
          <div className={s.rowMain}>
            <div className={s.rowLabel}>{v.label}</div>
            <div className={`${s.rowValue} ${v.mono ? s.rowMono : ''}`}>{v.value}</div>
            {v.why && <div className={s.rowNote}>{v.why}</div>}
          </div>
          <CopyButton label={v.label} text={v.value} />
        </li>
      ))}
    </Group>,
    <Group key="steps" label="Steps">
      {plan.steps.map((st, i) => (
        <li className={s.row} key={st.title} style={{ alignItems: 'flex-start' }}>
          <span className={s.num}>{i + 1}</span>
          <div className={s.rowMain}>
            <div className={s.rowTitle}>{st.title}</div>
            {st.body && <p className={s.rowBody}>{st.body}</p>}
            {st.link && (
              <a className={s.cta} href={st.link.href} rel="noopener noreferrer" target="_blank">
                {st.link.label}
                <ExternalLink aria-hidden size={14} />
              </a>
            )}
            {st.command && <Command label={st.title} text={st.command} />}
          </div>
        </li>
      ))}
    </Group>,
    <Group key="checks" label="Check it is working">
      <Checklist items={plan.checks} />
    </Group>,
  ]
  return {
    tone: plan.warnings.length ? TONE.gold : TONE.sage,
    lead: 'Here is your setup. Copy each value exactly.',
    cards: [<Reveal key="r">{cards}</Reveal>],
    chips: [{ value: 'doctor', label: 'Something looks wrong' }, restartChip('Another machine')],
    onChip: (v: string) => go(v === 'doctor' ? 'doctor' : 'home'),
  }
}

export function ConnectFlow({ go, handoff }: { go: Go; handoff?: Answers }) {
  const [start, setStart] = useState<Answers | undefined | null>(() => (handoff ? handoff : undefined))
  const [last] = useState(() => (handoff ? null : loadLast()))
  const persist = useCallback((a: Answers) => {
    if (a.os && a.hw) saveLast(a)
  }, [])

  if (start === undefined && last) {
    const summary = [OS_LABEL[last.os as Os], last.model && last.model !== '-' ? last.model : null, last.worker].filter(Boolean).join(', ')
    const steps: StepDef[] = [
      {
        id: 'reuse',
        ask: () => `Last time: ${summary}. Use the same machine details? You will enter the address again.`,
        chips: () => [
          { value: 'yes', label: 'Use the same', primary: true },
          { value: 'no', label: 'Start fresh' },
        ],
      },
    ]
    return (
      <Flow
        onAnswers={a => {
          if (a.reuse === 'yes') {
            const { worker: _w, ...rest } = last
            setStart(Object.fromEntries(Object.entries(rest).filter(([, v]) => v != null)) as Answers)
          } else if (a.reuse === 'no') setStart(null)
        }}
        onBack={() => go('home')}
        outcome={() => ({ tone: TONE.gold, lead: 'One moment.', cards: [] })}
        steps={steps}
        sub="Your PC, Mac, rig or rented box, mining in the pool."
        title="Connect"
      />
    )
  }
  return (
    <Flow
      initial={start ?? undefined}
      intro={handoff ? 'I carried over your hardware. A few more details.' : "Let's get your machine mining in the pool."}
      onAnswers={persist}
      onBack={() => go('home')}
      outcome={a => connectOutcome(a, go)}
      steps={CONNECT_STEPS}
      sub="Your PC, Mac, rig or rented box, mining in the pool."
      title="Connect"
    />
  )
}

/* ---------------- Fix my rig ---------------- */

function FindingCard({ f }: { f: Finding }) {
  const tone = severityTone(f.severity)
  return (
    <StatusCard icon={severityIcon(f.severity)} label={SEVERITY_LABEL[f.severity]} title={f.title} tone={tone}>
      <p className={s.rowBody} style={{ marginTop: 8 }}>
        {f.means}
      </p>
      {f.line && (
        <div className={s.cite}>
          <span className={s.citeN}>line {f.line.n}</span>
          {f.line.text}
        </div>
      )}
      <ol className={s.fixList}>
        {f.fix.map(x => (
          <li key={x}>{x}</li>
        ))}
      </ol>
    </StatusCard>
  )
}

const DOCTOR_STEPS: StepDef[] = [
  {
    id: 'mode',
    ask: () => 'Paste the miner log, or tell me what you see.',
    chips: () => SYMPTOMS.map(x => ({ value: `sym:${x.id}`, label: x.label })),
    text: { label: 'Miner log', placeholder: 'Paste the last 30 to 50 lines', multiline: true, rows: 4, newlines: true, mono: true, maxLength: 60000 },
    echo: v => (v.startsWith('sym:') ? (SYMPTOMS.find(x => `sym:${x.id}` === v)?.label ?? v) : `${v.split(/\r?\n/).length} lines of log`),
  },
]

function doctorOutcome(a: Answers, go: Go): Outcome {
  const v = a.mode ?? ''
  const chips = [restartChip('Check another'), { value: 'ask', label: 'Ask Maria' }]
  const onChip = (x: string) => go(x === 'ask' ? 'ask' : 'home')
  if (v.startsWith('sym:')) {
    const f = SYMPTOMS.find(x => `sym:${x.id}` === v)?.finding
    if (f) return { tone: severityTone(f.severity), lead: f.severity === 'fine' ? "It's fine. Wait." : 'Here is what that usually means.', cards: [<Reveal key="r">{[<FindingCard f={f} key="f" />]}</Reveal>], chips, onChip }
  }
  const d = diagnose(v)
  const tone = d.status === 'fine' ? TONE.sage : d.status === 'fault' ? TONE.coral : d.status === 'check' ? TONE.gold : TONE.fog
  const n = d.findings.filter(f => f.severity !== 'fine').length
  const lead =
    d.status === 'fine'
      ? "It's fine. Wait."
      : d.status === 'unknown'
        ? 'Nothing in this log matches a problem I know. Paste more lines, ideally from the start of the run, or pick a symptom.'
        : n > 1
          ? `${n} things to fix, most important first.`
          : 'Found it.'
  const cards = d.findings.map(f => <FindingCard f={f} key={f.id} />)
  // Numbers in the log: show them, compare the rig with its peers, and offer to save the result.
  if (!d.seedWarning && extractMetrics(v).found) cards.push(<LogMeasure findings={d.findings.map(f => f.id)} key="measure" log={v} />)
  if (d.seedWarning) {
    cards.unshift(
      <p className={s.warn} key="seed">
        This log contains something that looks like a seed (55 lowercase letters). Never paste it anywhere. If it was ever typed into a site, a pool or a chat, move your funds to a new wallet now.
      </p>,
    )
  }
  return { tone: d.seedWarning ? TONE.coral : tone, lead, cards: [<Reveal key="r">{cards}</Reveal>], chips, onChip }
}

export function DoctorFlow({ go, initial }: { go: Go; initial?: Answers }) {
  return <Flow initial={initial} intro="The log stays in your browser." onBack={() => go('home')} outcome={a => doctorOutcome(a, go)} steps={DOCTOR_STEPS} sub="Paste a log or pick what you see." title="Fix my rig" />
}
