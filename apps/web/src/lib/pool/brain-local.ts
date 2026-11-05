/**
 * Loads Maria's brain outside the site: for the Discord card script, the dump helper and the tests. Node only
 * (node:fs); the site uses brain.ts. A local checkout is preferred (MARIA_BRAIN_DIR or a path argument: the
 * pool/ folder of a maria-aigarth-botv3 checkout on branch pool-brain, the repo root, or brain.json itself);
 * otherwise the GitHub contents API with MARIA_BRAIN_TOKEN, MARIA_BRAIN_REPO and MARIA_BRAIN_REF.
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { BRAIN_DEFAULTS, type Brain, brainApiUrl } from './brain-schema.ts'
import { checkedBrain } from './prompt.ts'

/** The brain.json inside a path: the file itself, <dir>/brain.json, or <dir>/pool/brain.json. */
export function brainFile(path: string): string {
  if (statSync(path).isFile()) return path
  const here = join(path, 'brain.json')
  return existsSync(here) ? here : join(path, BRAIN_DEFAULTS.path)
}

export function loadBrainDir(path: string): Brain {
  return checkedBrain(JSON.parse(readFileSync(brainFile(path), 'utf8')))
}

export async function loadBrainRemote(env: Record<string, string | undefined> = process.env): Promise<Brain> {
  const token = env.MARIA_BRAIN_TOKEN
  if (!token) throw new Error('no brain: pass a local path, or set MARIA_BRAIN_DIR, or MARIA_BRAIN_TOKEN for the GitHub API')
  const url = brainApiUrl(env.MARIA_BRAIN_REPO || BRAIN_DEFAULTS.repo, env.MARIA_BRAIN_REF || BRAIN_DEFAULTS.ref)
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw+json', 'X-GitHub-Api-Version': '2022-11-28' } })
  if (!r.ok) throw new Error(`brain: GitHub ${r.status} for ${url}`)
  return checkedBrain(await r.json())
}

/** A path argument, else MARIA_BRAIN_DIR, else the GitHub API. */
export async function loadBrain(path?: string, env: Record<string, string | undefined> = process.env): Promise<Brain> {
  const dir = path || env.MARIA_BRAIN_DIR
  return dir ? loadBrainDir(dir) : loadBrainRemote(env)
}
