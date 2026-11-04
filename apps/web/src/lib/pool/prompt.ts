/**
 * Maria's system prompt, built from the same config and rule tables the deterministic tools use.
 * Change a fact in config.ts / doctor.ts and both layers change together.
 */
import { aggregate, measuredBlock, type Summary } from './aggregate.ts'
import { HARDWARE_FIGURES, HARDWARE_FIGURES_SOURCE, OS_LABEL, POOL, RENTALS, WALLET } from './config.ts'
import { RULES } from './doctor.ts'
import { EPOCH_SOURCE, epochAt, nowLine } from './epoch.ts'
import { FAQ, FAQ_THEMES, type FaqTheme } from './faq.ts'
import { BUILDS, FACTS, SOURCES, type SourceId } from './knowledge.ts'
import { FIELD_SAMPLES } from './measure.ts'
import { KNOWLEDGE_AS_OF, MINER_COMMAND, PROCEDURES, procedureText, TIPS } from './practice.ts'
import { HARD_RULES } from './rules.ts'

/** The field runs alone, for callers without a store (tests, the Discord card). */
const fieldSummary = () => aggregate(FIELD_SAMPLES, epochAt().epoch, 0)

/** Short source tags for the FAQ lines, so the cached block stays compact. */
const SHORT: Record<SourceId, string> = {
  academy: 'Academy',
  cointribune: 'Cointribune',
  guide: 'guide',
  partner: 'est.',
  doge: 'DOGE',
  field: 'ours',
  'field-e229': 'ours E229',
  'field-e233': 'ours E233',
  'pool-lanes': 'lanes',
  devs: 'devs',
  cfb: 'CfB',
  'qli-mod': 'QLI mod',
  'jetski-op': 'pool op',
  'qli-team': 'QLI team',
  community: 'Discord',
}

const tags = (ids: SourceId[]) => [...new Set(ids)].map(id => SHORT[id]).join(', ')

/** Each source once, with its full label and date; FACTS and the FAQ then cite the short tag. */
export function sourcesBlock(): string {
  const used = [...new Set([...FACTS, ...FAQ].flatMap(x => x.sources))]
  return `SOURCES (tag = source, date; the HARDWARE facts and the FAQ cite these tags)
${used.map(id => `- ${SHORT[id]} = ${SOURCES[id].label} (${SOURCES[id].date})`).join('\n')}`
}

/** Rules whose step-by-step fix is a procedure: the triage line keeps the first step and points there. */
const IN_PROCEDURES = new Set(['defender', 'smartscreen', 'gatekeeper', 'hive-install', 'systemd', 'sleep', 'gpu-power'])

/** What miners ask, one line per entry, grouped by theme. */
export function faqBlock(): string {
  const themes = Object.keys(FAQ_THEMES) as FaqTheme[]
  const lines = themes.flatMap(t => {
    const es = FAQ.filter(e => e.theme === t)
    return es.length ? [`# ${FAQ_THEMES[t]}`, ...es.map(e => `- "${e.q}" ${e.a} [${tags(e.sources)}; ${e.asOf}]`)] : []
  })
  return `MINER FAQ (what real miners ask, our best answer, [sources; as of]; ours = our field runs. Keep the epoch and date; never add income figures)
${lines.join('\n')}`
}

/** Our measurements predate later algorithm changes: say so. */
export function stalenessBlock(): string {
  const fact = FACTS.find(f => f.topic === 'Staleness')
  return `STALENESS
- ${fact?.text ?? ''} No rig measurements of ours exist after epoch 233.
- Give the epoch with every field number and say it predates these changes. Never compare sol/h across eras: epoch 229 counts were tens per rig per hour, epoch 233 thousands.
- Where a guide and our measurements disagree, give both with their dates and say which applies when.`
}

/** The live part: the epoch now and the time to its end. Sent as its own block after the cached one. */
export function mariaNowBlock(now: Date = new Date()): string {
  return `NOW (computed by code at request time; use it for "when does the epoch end" questions)
- ${nowLine(now)} [epoch rule: ${EPOCH_SOURCE.label}, ${EPOCH_SOURCE.date}]`
}

/** Full prompt as one string (tests, the Discord card). The API sends static + now as two blocks. */
export function mariaSystemPrompt(now: Date = new Date(), measured?: Summary | null): string {
  return `${mariaSystemStatic(measured)}\n\n${mariaNowBlock(now)}`
}

/**
 * Everything that does not change per request, so the API can cache it. `measured` is the per-epoch
 * snapshot from store.ts (finished epochs only), so this block changes once a week at most.
 * Without it the MEASURED section still lists our own field runs.
 */
export function mariaSystemStatic(measured?: Summary | null): string {
  const figures = HARDWARE_FIGURES.map(f => `${f.name} ~${f.itPerSec} it/s (${f.kind}, est., ${HARDWARE_FIGURES_SOURCE.label})`).join('; ')
  const triage = RULES.map(r => `- ${r.title}: ${r.means} Fix: ${IN_PROCEDURES.has(r.id) ? `${r.fix[0]} Steps in PROCEDURES.` : r.fix.join(' ')}`).join('\n')
  const launch = POOL.launchLine
    ? Object.entries(POOL.launchLine).map(([os, l]) => `${os}: ${l}`).join('\n')
    : `No confirmed launch command. Tell the user to open the pool setup page (${POOL.onboardingUrl}) and enter the exact values; it gives the command for their system.`

  const procedures = Object.values(PROCEDURES)
    .map(p => `## ${procedureText(p)}`)
    .join('\n\n')
  const tips = TIPS.map(x => `- ${x.title}: ${x.text}${x.general ? ' (general, not Qubic-measured)' : ''}`).join('\n')

  return `You are Maria, the technical mining coach of ${POOL.name}. You help people mine Qubic efficiently.

STYLE
- Technical only. No personality, no lore, no mysticism, no stories, no greetings or sign-offs. Never mention Anna or Aigarth lore.
- Terse, step by step. Numbered steps for procedures. Commands in code blocks. Under 180 words unless a procedure needs more.
- Answer in the language the user writes in.
- Never use em dashes.
- If you are not sure, say so and point to the in-app tools: Pick hardware, Connect my machine, Fix my rig.

HARD RULES
${HARD_RULES.map(r => `- ${r}`).join('\n')}

THE POOL
- Name: ${POOL.name}. Setup page: ${POOL.onboardingUrl}
- The setup page asks for: ${POOL.onboardingFields.join(', ')}.
- Operating systems: ${POOL.osOptions.map(o => OS_LABEL[o]).join(', ')}. Backends: ${POOL.backends.join(', ')}.
- Worker names must start with ${POOL.workerPrefix} (e.g. ${POOL.workerPrefix}5070ti-a). Allowed: letters, numbers, . - _ up to ${POOL.workerMaxLength} characters. One unique name per machine.
- Launch: ${launch}
- Stats page: ${POOL.statsUrl ?? 'not published yet; the worker shows on the pool dashboard'}.
- Rewards go straight to the user's own wallet, ${POOL.payout.timing}, paid in ${POOL.payout.currency}. An epoch runs ${POOL.payout.epoch}. ${POOL.payout.lands}.
- At an epoch change the miner idles by itself until the backend updates. Do nothing.

WALLET
- ${WALLET.seed.rule}
- ${WALLET.address.rule}

HARDWARE (facts with source tags from SOURCES; cite the source briefly when you use a fact)
- Judge every machine by solutions per hour and cost per solution, never by it/s. it/s is speed, not pay.
${FACTS.filter(f => f.topic !== 'Staleness').map(f => `- ${f.text} [${tags(f.sources)}]`).join('\n')}
- Extra figures: ${figures}.
- Buy builds, as tiers (never quote prices): ${Object.values(BUILDS).map(b => `${b.title} (${b.specs.map(([k, v]) => `${k} ${v}`).join(', ')})`).join('; ')}.
- Renting: ${RENTALS.map(r => r.name).join(', ')}. Deposit small, test one box for an hour, then scale. Never type card numbers or the seed into a rental site.
- Linux: run the miner as a systemd service, or detached with nohup for a quick run; see PROCEDURES.

PROCEDURES (${MINER_COMMAND} = the exact command the pool setup page gives; never invent it, its binary name or its flags. Give the steps for the user's system, numbered, commands in code blocks. Steps and tips follow the vendor docs (Ubuntu, NVIDIA, systemd, Microsoft, Apple, Hiveon, Clore, Vast, OctaSpace) and were checked on ${KNOWLEDGE_AS_OF}; the site lists each source.)
${procedures}

EFFICIENCY TIPS
${tips}

${stalenessBlock()}

${measuredBlock(measured ?? fieldSummary())}

${sourcesBlock()}

TRIAGE
${triage}
- No solutions yet: a fresh rig at 0 for 2 to 30 minutes is normal; judge after 20 minutes at the earliest.
- Dashboard "behind": display lag, the work is counted.

${faqBlock()}`
}
