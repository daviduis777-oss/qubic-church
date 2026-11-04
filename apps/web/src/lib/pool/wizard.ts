/**
 * Connect wizard: validation and the exact plan for getting a machine mining in the pool.
 * Pure functions; the React flow only asks the questions and renders what this returns.
 */
import type { Backend, Os } from './config.ts'
import { OS_LABEL, POOL } from './config.ts'
import { formatUtc, epochAt } from './epoch.ts'
import { MINER_COMMAND, practiceSourceLine, procedureSources, proceduresFor, TIPS, type Where, withCommand } from './practice.ts'
import { containsSeed } from './redact.ts'

export type Hw = 'cpu' | 'nvidia' | 'amd' | 'apple'
export type Avx = 'avx512' | 'avx2' | 'apple' | 'none' | 'unknown'

export type WalletCheck =
  | { ok: true; value: string }
  | { ok: false; kind: 'empty' | 'seed' | 'lowercase' | 'length' | 'chars'; message: string }

export const SEED_WARNING =
  'That looks like a seed: 55 lowercase letters. Do not paste it anywhere. Nobody, including this pool, ever needs it. ' +
  'If you typed it into a site or a chat, move your funds to a new wallet now. The pool only needs your 60-letter uppercase address.'

/** Validate a Qubic address. A seed is refused outright. Spaces and line breaks are ignored. */
export function checkWallet(raw: string): WalletCheck {
  const v = raw.replace(/\s+/g, '')
  if (!v) return { ok: false, kind: 'empty', message: 'Paste your 60-letter address from your wallet.' }
  if (/^[a-z]{55}$/.test(v) || containsSeed(raw)) return { ok: false, kind: 'seed', message: SEED_WARNING }
  if (/^[A-Z]{60}$/.test(v)) return { ok: true, value: v }
  if (/^[a-z]{60}$/.test(v)) return { ok: false, kind: 'lowercase', message: 'An address is uppercase. Copy it again from your wallet instead of retyping it.' }
  if (/^[A-Za-z]+$/.test(v)) return { ok: false, kind: 'length', message: `An address is exactly 60 uppercase letters. This has ${v.length}.` }
  return { ok: false, kind: 'chars', message: 'An address has only the letters A to Z. No digits, no symbols.' }
}

/** Short, readable hardware tag for the worker name: 5070ti, 7950x, m3pro, cpu. */
export function hardwareTag(hw: Hw, model?: string): string {
  const s = (model ?? '').toLowerCase()
  const gpu = s.match(/(\d{4}) ?(ti|super)?/)
  if ((hw === 'nvidia' || hw === 'amd') && gpu) return `${gpu[1]}${gpu[2] ?? ''}`
  const apple = s.match(/\bm([1-5])\b ?(pro|max|ultra)?/)
  if (hw === 'apple') return apple ? `m${apple[1]}${apple[2] ?? ''}` : 'mac'
  const cpu = s.match(/(\d{4,5}[a-z0-9]{0,3})/)
  if (cpu) return cpu[1]!
  return hw === 'nvidia' ? 'gpu' : 'cpu'
}

/** Keep only allowed characters, force the QC. prefix, cap the length. */
export function cleanWorker(raw: string): string {
  let v = raw.trim().replace(/\s+/g, '-').replace(/[^A-Za-z0-9._-]/g, '')
  if (!v.toUpperCase().startsWith(POOL.workerPrefix.toUpperCase())) v = POOL.workerPrefix + v.replace(/^\.+/, '')
  else v = POOL.workerPrefix + v.slice(POOL.workerPrefix.length)
  return v.slice(0, POOL.workerMaxLength)
}

export function suggestWorker(hw: Hw, model?: string, suffix = 'a'): string {
  return cleanWorker(`${POOL.workerPrefix}${hardwareTag(hw, model)}-${suffix}`)
}

export function checkWorker(v: string): { ok: true } | { ok: false; message: string } {
  if (!v.startsWith(POOL.workerPrefix)) return { ok: false, message: `Worker names start with ${POOL.workerPrefix} so the pool counts them as ours.` }
  if (v.length > POOL.workerMaxLength) return { ok: false, message: `Up to ${POOL.workerMaxLength} characters.` }
  if (!POOL.workerPattern.test(v)) return { ok: false, message: 'Letters, numbers and . - _ only.' }
  if (v.length <= POOL.workerPrefix.length) return { ok: false, message: `Add a name after ${POOL.workerPrefix}, for example ${POOL.workerPrefix}rig-a.` }
  return { ok: true }
}

export function backendFor(hw: Hw, avx: Avx): { backend: Backend; why: string } {
  if (hw === 'nvidia') return { backend: 'GPU', why: 'NVIDIA card: the GPU backend uses CUDA.' }
  if (hw === 'apple') return { backend: 'Auto', why: 'Apple Silicon has no AVX. Auto picks the right CPU path.' }
  if (avx === 'avx512') return { backend: 'AVX512', why: 'Your CPU has AVX-512, the fast path.' }
  if (avx === 'avx2') return { backend: 'AVX2', why: 'AVX2 only: it works, slower than AVX-512.' }
  return { backend: 'Auto', why: 'Not sure which instructions your CPU has, so let the miner detect them.' }
}

export const THREAD_COMMAND: Record<Os, string> = {
  linux: 'nproc',
  hiveos: 'nproc',
  macos: 'sysctl -n hw.logicalcpu',
  windows: 'echo %NUMBER_OF_PROCESSORS%',
}

/** Threads: a dedicated box uses all of them; a daily PC keeps two free so it stays usable. */
export function threadsFor(hw: Hw, threads: number | undefined, dedicated: boolean): { value: string; why: string } {
  if (!threads || threads < 1) return { value: 'all', why: 'Count your threads with the command below, then enter that number.' }
  if (hw === 'nvidia') {
    return { value: String(dedicated ? threads : Math.max(1, threads - 2)), why: 'The CPU feeds the card. Keep at least 8 CPU cores per GPU.' }
  }
  if (dedicated) return { value: String(threads), why: 'A dedicated machine can give the miner every thread.' }
  return { value: String(Math.max(1, threads - 2)), why: 'Two threads stay free so you can keep using the computer.' }
}

/** where: 'rental' for a rented box (always a Linux container). now: only used to name the next epoch change. */
export type WizardInput = { os: Os; hw: Hw; avx: Avx; model?: string; wallet: string; worker: string; threads?: number; dedicated: boolean; where?: Where; now?: Date }
export type Value = { label: string; value: string; mono?: boolean; why?: string }
/** group: the procedure a step belongs to (practice.ts), so a UI can show them as sections. */
export type Step = { title: string; body?: string; command?: string; link?: { href: string; label: string }; group?: string }
export type Check = { title: string; command?: string; body?: string }
export type PlanProcedure = { id: string; title: string; summary: string; sources: string }
export type Plan = { values: Value[]; steps: Step[]; checks: Check[]; warnings: string[]; procedures: PlanProcedure[]; tips: string[] }

/** Once the real command is known, drop the sentences that tell the user to paste it. */
const bodyFor = (body: string | undefined, command: string | null) =>
  body && command ? body.split(/(?<=\.) /).filter(x => !x.includes(MINER_COMMAND)).join(' ') || undefined : body

const fill = (tpl: string, v: Record<string, string>) => tpl.replace(/\{(WALLET|WORKER|BACKEND|THREADS)\}/g, (_, k: string) => v[k] ?? '')

export function buildPlan(i: WizardInput): Plan {
  const warnings: string[] = []
  const { backend, why } = backendFor(i.hw, i.avx)
  const t = threadsFor(i.hw, i.threads, i.dedicated)
  if (i.hw === 'amd') warnings.push("We have no AMD Radeon measurements, and GPU support depends on the pool's miner. NVIDIA/CUDA is the proven path. This plan mines on your CPU.")
  if (i.os === 'macos' && i.hw === 'nvidia') warnings.push('On macOS the pool mines on the CPU. An NVIDIA card needs Linux, Windows or HiveOS.')

  const values: Value[] = [
    { label: 'Operating system', value: OS_LABEL[i.os] },
    { label: 'Wallet address', value: i.wallet, mono: true },
    { label: 'Worker name', value: i.worker, mono: true, why: 'One unique name per machine, or the dashboard blurs them.' },
    { label: 'Backend', value: backend, why },
    { label: 'Threads', value: t.value, why: t.why },
  ]

  const steps: Step[] = [{ title: 'Open the pool setup page', link: { href: POOL.onboardingUrl, label: 'Open pool setup' } }]
  steps.push({ title: 'Enter these exact values', body: 'Copy each one from the list above. Nothing else is needed: never a seed, never a card number.' })

  if (i.where === 'rental' && i.os !== 'linux') warnings.push('A rented box is a Linux container: choose Linux on the pool setup page.')

  const tpl = POOL.launchLine?.[i.os]
  const command = tpl ? fill(tpl, { WALLET: i.wallet, WORKER: i.worker, BACKEND: backend, THREADS: t.value === 'all' ? '' : t.value }) : null
  if (command) steps.push({ title: 'The pool command for this machine', command, body: 'The steps below save it in a start script.' })
  else
    steps.push({
      title: 'Take the command from the setup page',
      body: `The setup page shows the download and the command for ${OS_LABEL[i.where === 'rental' ? 'linux' : i.os]}. Below it is written ${MINER_COMMAND}: paste the real command there, exactly as given.`,
    })

  const procs = proceduresFor({ os: i.os, hw: i.hw, where: i.where, dedicated: i.dedicated })
  for (const p of procs)
    for (const st of p.steps) steps.push({ title: st.title, body: bodyFor(st.body, command), command: st.command && withCommand(st.command, command), group: p.title })

  const checks: Check[] = []
  const seen = new Set<string>()
  const addCheck = (c: Check) => {
    const key = c.command ?? c.title
    if (seen.has(key)) return
    seen.add(key)
    checks.push(c)
  }
  for (const p of procs) for (const c of p.checks) addCheck({ ...c, command: c.command && withCommand(c.command, command) })
  if (i.hw === 'nvidia') addCheck({ title: 'The card is busy', command: 'nvidia-smi' })
  addCheck(
    POOL.minerProcess && i.os !== 'windows'
      ? { title: 'Exactly one miner is running', command: `pgrep -fa ${POOL.minerProcess}`, body: 'Two lines means you launched twice. Stop both and start one.' }
      : { title: 'Exactly one miner is running', body: 'Launching twice makes two workers fight over one machine.' },
  )
  addCheck(
    POOL.statsUrl
      ? { title: `${i.worker} appears on the pool stats`, body: fill(POOL.statsUrl, { WALLET: i.wallet, WORKER: i.worker }) }
      : { title: `${i.worker} appears on the pool dashboard`, body: 'It can take a few minutes to show up (est.).' },
  )
  addCheck({ title: 'No solutions in the first hour is normal', body: 'Solutions arrive in 5 to 30 minutes, sometimes longer. Do not hop machines.' })
  const next = i.now ? ` Next one: ${formatUtc(epochAt(i.now).end)}.` : ''
  addCheck({ title: 'At an epoch change it idles by itself', body: `Wednesday 12:00 UTC.${next} Do nothing; it continues when the update lands.` })

  const procedures = procs.map(p => ({ id: p.id, title: p.title, summary: p.summary, sources: practiceSourceLine(procedureSources(p)) }))
  const tips = TIPS.filter(x => i.hw === 'nvidia' || !/power limit/i.test(x.title)).map(x => `${x.title}: ${x.text}`)
  return { values, steps, checks, warnings, procedures, tips }
}
