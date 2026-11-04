/** Wallet strings never leave the browser for the AI, and never reach a server log. */

const ADDRESS = /(?<![A-Za-z])[A-Z]{60}(?![A-Za-z])/g
const SEED = /(?<![A-Za-z])[a-z]{55}(?![A-Za-z])/g

export const containsSeed = (s: string) => new RegExp(SEED.source).test(s)
export const containsAddress = (s: string) => new RegExp(ADDRESS.source).test(s)

/** Replace 60-letter uppercase strings (addresses) and 55-letter lowercase strings (seeds). */
export function redactWallets(s: string): string {
  return s.replace(SEED, '[seed removed]').replace(ADDRESS, '[address removed]')
}
