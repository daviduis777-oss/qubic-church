/**
 * QC Pool: the page's own words and Maria's home screen, in one place so tests can hold them verbatim.
 * Pure and browser safe. English (the site language), sentence case, no em dashes.
 * The hero quote lives in why.ts (MACHINE), next to the other words of Come-from-Beyond.
 */
import { POOL } from './config.ts'

/** (b) Join: the aim, then what makes the pool comfortable and transparent. Our aim, never a claim about others. */
export const JOIN = {
  title: 'Join Qubic Church Pool.',
  aim: 'Our key task is decentralization. We aim to keep Qubic’s founding principle: no single operator should control the network’s compute.',
  ease: 'Being in the pool should be comfortable and transparent.',
  proofs: [
    { id: 'wallet', text: 'Rewards go straight to your wallet after each epoch.' },
    { id: 'record', text: 'Every contribution is recorded.' },
    { id: 'coach', text: 'A coach for every step, from buying to fixing.' },
    { id: 'fee', text: `One fee, disclosed up front: ${POOL.feePercent}%.` },
  ],
} as const

/** (c) Maria Aigarth. She develops; how is not said. Where she runs today is said plainly, with no date for the move. */
export const MARIA = {
  name: 'Maria Aigarth',
  role: 'Our self-learning mining coach.',
  body: [
    'She develops with every rig she helps and every question she answers. The best of what we know about mining, in one coach.',
    'Today she runs on Claude by Anthropic. She is built to move to Aigarth when it is ready.',
  ],
  hint: 'Tap an app to open it.',
} as const

/** The screens Maria's phone can open. 'home' is the home screen itself. */
export type AppId = 'pick' | 'connect' | 'doctor' | 'rig' | 'ask' | 'record' | 'who' | 'help'

/** Every app on Maria's phone, in order. Each appears once: in the dock, or in the grid above it. */
export const APPS: { id: AppId; label: string; name: string }[] = [
  { id: 'pick', label: 'Pick hardware', name: 'Pick hardware' },
  { id: 'connect', label: 'Connect', name: 'Connect my machine' },
  { id: 'doctor', label: 'Fix my rig', name: 'Fix my rig' },
  { id: 'rig', label: 'My rig', name: 'My rig' },
  { id: 'ask', label: 'Ask Maria', name: 'Ask Maria' },
  { id: 'record', label: 'The record', name: 'The record' },
  { id: 'who', label: 'Who mines', name: 'Who mines with what' },
  { id: 'help', label: 'Help', name: 'Help' },
]

/** The dock: the four most used. Ask Maria only once the AI is connected; until then My rig takes its place. */
export function dockApps(ai: boolean | null): AppId[] {
  return ai ? ['pick', 'connect', 'doctor', 'ask'] : ['pick', 'connect', 'doctor', 'rig']
}

/** The grid: every app not in the dock, in order. As on an iPhone, no app shows twice. */
export function gridApps(ai: boolean | null): AppId[] {
  const dock = dockApps(ai)
  return APPS.map(a => a.id).filter(id => !dock.includes(id))
}

/** What the Ask pill and the Ask Maria icon say. While the AI is not connected: coming soon, never a promise. */
export function askLabel(ai: boolean | null): { pill: string; a11y: string } {
  return ai === false ? { pill: 'Ask Maria · coming soon', a11y: 'Ask Maria, coming soon' } : { pill: 'Ask Maria', a11y: 'Ask Maria' }
}
