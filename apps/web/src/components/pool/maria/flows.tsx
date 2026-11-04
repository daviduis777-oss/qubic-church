'use client'

import { useCallback, useState } from 'react'
import { OS_LABEL, POOL, RENTALS, type Os } from '@/lib/pool/config'
import { diagnose, SYMPTOMS, type Finding } from '@/lib/pool/doctor'
import { classifyCpu, pick, type PickMode, type Scale } from '@/lib/pool/hardware'
import { buildPlan, checkWallet, checkWorker, cleanWorker, type Avx, type Hw, suggestWorker, THREAD_COMMAND } from '@/lib/pool/wizard'
import { type Answers, Flow, restartChip, type StepDef } from './flow'
import { Card, Checklist, Command, Say, SEVERITY_LABEL, severityTone, TONE, useCopy, VerdictCard, verdictTone } from './ui'
import { RingGlyph } from './Ring'
import s from './maria.module.css'

export type Go = (screen: 'home' | 'pick' | 'connect' | 'doctor' | 'ask', handoff?: Answers) => void

const OS_CHIPS = (['linux', 'windows', 'macos', 'hiveos'] as Os[]).map(o => ({ value: o, label: OS_LABEL[o] }))

/* ---------------- Pick hardware (and consult on what you own) ---------------- */

const PICK_STEPS: StepDef[] = [
  {
    id: 'mode',
    ask: () => 'Are you buying, renting, or checking hardware you already have?',
    chips: () => [
      { value: 'own', label: 'I already have hardware' },
      { value: 'rent', label: 'Rent a box' },
      { value: 'buy', label: 'Buy hardware' },
    ],
  },
  {
    id: 'scale',
    when: a => a.mode === 'buy' || a.mode === 'rent',
    ask: a => (a.mode === 'rent' ? 'How big do you want to start?' : 'How big a setup?'),
    chips: a => [
      { value: 'small', label: a.mode === 'rent' ? 'One box, to test' : 'One machine, to learn' },
      { value: 'mid', label: 'One serious rig' },
      { value: 'large', label: 'Several GPUs' },
    ],
  },
  {
    id: 'os',
    when: a => a.mode === 'buy',
    ask: () => 'Which system should it run?',
    chips: () => [...OS_CHIPS, { value: 'any', label: 'No preference' }],
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
    id: 'os',
    when: a => a.mode === 'own',
    ask: () => 'Which system does it run?',
    chips: () => OS_CHIPS,
  },
]

function pickOutcome(a: Answers, go: Go) {
  const r = pick({
    mode: a.mode as PickMode,
    scale: a.scale as Scale,
    os: a.os && a.os !== 'any' ? (a.os as Os) : undefined,
    cpu: a.cpu,
    gpu: a.gpu === 'none' ? '' : a.gpu,
    gpuCount: a.gpus ? Number(a.gpus) : undefined,
    cores: a.cores && a.cores !== '0' ? Number(a.cores) : undefined,
  })
  const own = a.mode === 'own'
  const lead =
    own
      ? r.overall === 'Skip'
        ? 'This setup is not worth mining on as it is. Here is why, part by part.'
        : r.overall === 'Unknown'
          ? 'I could not place every part. Here is what I can tell.'
          : 'Here is how your hardware does, part by part.'
      : 'Here is what to look for, best first. No prices: they change weekly, so compare them yourself.'
  return {
    tone: verdictTone(r.overall),
    body: (
      <div className={s.stack}>
        <Say>{lead}</Say>
        {r.cards.map(c => (
          <VerdictCard key={c.title} reasons={c.reasons} title={c.title} verdict={c.verdict} />
        ))}
        {a.mode === 'rent' && (
          <Card title="Where people rent">
            <ul className={s.reasons}>
              {RENTALS.map(x => (
                <li key={x.name}>
                  <a className={s.textLink} href={x.url} rel={x.referral ? 'noopener noreferrer sponsored' : 'noopener noreferrer'} target="_blank">
                    {x.name}
                  </a>
                  : {x.note}
                  {x.referral && ' Our referral link: it sends a few credits our way; the advice is the same either way.'}
                </li>
              ))}
            </ul>
          </Card>
        )}
        <Card title={own ? 'Notes' : 'Before you spend'}>
          <ul className={s.reasons}>
            {r.notes.map(n => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Card>
      </div>
    ),
    chips: [
      ...(own && r.overall !== 'Skip' ? [{ value: 'connect', label: 'Set it up', primary: true }] : []),
      restartChip(),
      { value: 'home', label: 'Home' },
    ],
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
  return <Flow intro="Let's find hardware that wins on cost per solution." outcome={a => pickOutcome(a, go)} steps={PICK_STEPS} />
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
            { value: 'apple', label: 'Apple Silicon (M1 to M4)' },
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
        Does the CPU have AVX-512? {a.os === 'linux' || a.os === 'hiveos' ? <>Run <code>grep -o -m1 avx512f /proc/cpuinfo</code>: it prints avx512f if yes.</> : 'Look up the model if you are not sure.'}
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

function connectOutcome(a: Answers, go: Go) {
  const hw = a.hw as Hw
  const model = a.model === '-' ? '' : a.model
  const avx: Avx = hw === 'apple' ? 'apple' : hw === 'nvidia' ? 'unknown' : ((a.avx as Avx) ?? avxFromModel(hw === 'amd' ? a.cpuModel : model))
  const plan = buildPlan({
    os: a.os as Os,
    hw,
    avx: a.avx ? (a.avx as Avx) : avx,
    model,
    wallet: a.wallet!,
    worker: a.worker!,
    threads: a.threads && a.threads !== '0' ? Number(a.threads) : undefined,
    dedicated: a.dedicated === 'yes',
  })
  return {
    tone: plan.warnings.length ? TONE.brass : TONE.teal,
    body: (
      <div className={s.stack}>
        <Say>Here is your setup. Copy each value exactly.</Say>
        {plan.warnings.map(w => (
          <p className={s.warn} key={w}>
            {w}
          </p>
        ))}
        <Card title="Your values">
          <Values values={plan.values} />
        </Card>
        <Card title="Steps">
          <ol className={s.steps}>
            {plan.steps.map(st => (
              <li key={st.title}>
                <div>
                  <div className={s.stepTitle}>{st.title}</div>
                  {st.body && <p className={s.stepBody}>{st.body}</p>}
                  {st.link && (
                    <a className={s.link} href={st.link.href} rel="noopener noreferrer" target="_blank">
                      {st.link.label}
                    </a>
                  )}
                  {st.command && (
                    <div style={{ marginTop: 6 }}>
                      <Command label={st.title} text={st.command} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <Card title="Check it is working">
          <Checklist items={plan.checks} />
        </Card>
      </div>
    ),
    chips: [{ value: 'doctor', label: 'Something looks wrong' }, restartChip('Another machine'), { value: 'home', label: 'Home' }],
    onChip: (v: string) => go(v === 'doctor' ? 'doctor' : 'home'),
  }
}

function Values({ values }: { values: { label: string; value: string; mono?: boolean; why?: string }[] }) {
  const { done, copy } = useCopy()
  return (
    <dl className={s.values}>
      {values.map(v => (
        <div className={s.valueRow} key={v.label}>
          <dt className={s.valueLabel}>{v.label}</dt>
          <dd style={{ margin: 0 }}>
            <div className={s.valueLine}>
              <span className={`${s.value} ${v.mono ? s.valueMono : ''}`}>{v.value}</span>
              <button aria-label={`Copy ${v.label}`} className={`${s.copy} ${s.copyInline}`} onClick={() => copy(v.label, v.value)} type="button">
                {done === v.label ? 'Copied' : 'Copy'}
              </button>
            </div>
            {v.why && <p className={s.valueWhy}>{v.why}</p>}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function ConnectFlow({ go, handoff }: { go: Go; handoff?: Answers }) {
  const [start, setStart] = useState<Answers | undefined | null>(() => (handoff ? handoff : undefined))
  const [last] = useState(() => (handoff ? null : loadLast()))
  const persist = useCallback((a: Answers) => {
    if (a.os && a.hw) saveLast(a)
  }, [])

  if (start === undefined && last) {
    const summary = [OS_LABEL[last.os as Os], last.model && last.model !== '-' ? last.model : null, last.worker].filter(Boolean).join(', ')
    return (
      <>
        <div className={s.thread}>
          <Say>Last time: {summary}. Use the same machine details? You will enter the address again.</Say>
        </div>
        <div className={s.dock}>
          <div className={s.chips} role="group" aria-label="Answers">
            <button
              className={`${s.chip} ${s.chipPrimary}`}
              onClick={() => {
                const { worker: _w, ...rest } = last
                setStart(Object.fromEntries(Object.entries(rest).filter(([, v]) => v != null)) as Answers)
              }}
              type="button"
            >
              Use the same
            </button>
            <button className={s.chip} onClick={() => setStart(null)} type="button">
              Start fresh
            </button>
          </div>
        </div>
      </>
    )
  }
  return (
    <Flow
      initial={start ?? undefined}
      intro={handoff ? 'I carried over your hardware. A few more details.' : "Let's get your machine mining in the pool."}
      onAnswers={persist}
      outcome={a => connectOutcome(a, go)}
      steps={CONNECT_STEPS}
    />
  )
}

/* ---------------- Fix my rig ---------------- */

function Findings({ list }: { list: Finding[] }) {
  return (
    <>
      {list.map(f => {
        const tone = severityTone(f.severity)
        return (
          <article className={s.card} key={f.id}>
            <div className={s.cardHead}>
              <h3 className={s.cardTitle} style={{ margin: 0 }}>
                {f.title}
              </h3>
              <span className={s.verdict} style={{ color: tone }}>
                <RingGlyph color={tone} />
                {SEVERITY_LABEL[f.severity]}
              </span>
            </div>
            <p className={s.stepBody} style={{ marginTop: 4 }}>
              {f.means}
            </p>
            {f.line && (
              <div className={s.cite}>
                <span className={s.citeN}>line {f.line.n}</span>
                {f.line.text}
              </div>
            )}
            <ol className={s.reasons} style={{ marginTop: 8 }}>
              {f.fix.map(x => (
                <li key={x} style={{ color: 'var(--bone)' }}>
                  {x}
                </li>
              ))}
            </ol>
          </article>
        )
      })}
    </>
  )
}

const DOCTOR_STEPS: StepDef[] = [
  {
    id: 'mode',
    ask: () => 'Paste the miner log, or tell me what you see.',
    chips: () => SYMPTOMS.map(x => ({ value: `sym:${x.id}`, label: x.label })),
    text: { label: 'Miner log', placeholder: 'Paste the last 30 to 50 lines', multiline: true, rows: 5, newlines: true, mono: true, maxLength: 60000 },
    echo: v => (v.startsWith('sym:') ? (SYMPTOMS.find(x => `sym:${x.id}` === v)?.label ?? v) : `${v.split(/\r?\n/).length} lines of log`),
  },
]

function doctorOutcome(a: Answers, go: Go) {
  const v = a.mode ?? ''
  const restart = [restartChip('Check another'), { value: 'ask', label: 'Ask Maria' }, { value: 'home', label: 'Home' }]
  const onChip = (x: string) => go(x === 'ask' ? 'ask' : 'home')
  if (v.startsWith('sym:')) {
    const f = SYMPTOMS.find(x => `sym:${x.id}` === v)!.finding
    return { tone: severityTone(f.severity), body: <div className={s.stack}><Findings list={[f]} /></div>, chips: restart, onChip }
  }
  const d = diagnose(v)
  const tone = d.status === 'fine' ? TONE.teal : d.status === 'fault' || d.status === 'check' ? TONE.coral : TONE.fog
  const lead =
    d.status === 'fine'
      ? "It's fine. Wait."
      : d.status === 'unknown'
        ? 'Nothing in this log matches a problem I know. Paste more lines, ideally from the start of the run, or pick a symptom.'
        : d.findings.length > 1
          ? `${d.findings.filter(f => f.severity !== 'fine').length} things to fix, most important first.`
          : 'Found it.'
  return {
    tone: d.seedWarning ? TONE.coral : tone,
    body: (
      <div className={s.stack}>
        {d.seedWarning && (
          <Say fault>
            This log contains something that looks like a seed (55 lowercase letters). Never paste it anywhere. If it was ever typed into a site, a pool or a chat, move your funds to a new wallet now.
          </Say>
        )}
        <Say>{lead}</Say>
        <Findings list={d.findings} />
      </div>
    ),
    chips: restart,
    onChip,
  }
}

export function DoctorFlow({ go, initial }: { go: Go; initial?: Answers }) {
  return <Flow initial={initial} intro="The log stays in your browser." outcome={a => doctorOutcome(a, go)} steps={DOCTOR_STEPS} />
}
