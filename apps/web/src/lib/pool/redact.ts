/** Wallet strings never leave the browser for the AI, and never reach a server log. */

const ADDRESS = /(?<![A-Za-z])[A-Z]{60}(?![A-Za-z])/g
/** A seed is 55 lowercase letters; 54 or 56 is a seed with one letter lost or doubled in copying, still a secret. */
const SEED = /(?<![A-Za-z])[a-z]{54,56}(?![A-Za-z])/g
export const SEED_PATTERN = new RegExp(SEED.source)
/** What the redaction leaves in place of a seed, so later steps still know one was pasted. */
export const SEED_MARK = '[seed removed]'

export const containsSeed = (s: string) => new RegExp(SEED.source).test(s)
export const containsAddress = (s: string) => new RegExp(ADDRESS.source).test(s)
/** A seed, or the mark the browser's redaction left where one was. */
export const hadSeed = (s: string) => containsSeed(s) || s.includes(SEED_MARK)

/** Replace 60-letter uppercase strings (addresses) and 55-letter lowercase strings (seeds). */
export function redactWallets(s: string): string {
  return s.replace(SEED, SEED_MARK).replace(ADDRESS, '[address removed]')
}
