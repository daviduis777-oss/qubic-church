/**
 * Search result snippets show about 60 characters of a title and about 160 of a
 * description. These helpers keep page metadata inside those limits so the
 * text people see in Google and Bing is never cut mid-word.
 */

const BRAND_SUFFIX = ' - Qubic Church'
const TITLE_MAX = 65
const DESCRIPTION_MAX = 160

/** Shortens a title at a natural break (colon, dash, bracket) when it is too long. */
function shortTitle(title: string): string {
  if (title.length <= TITLE_MAX) return title
  for (const sep of [': ', ' - ', ' — ', ' (', '. ', ', ']) {
    const i = title.indexOf(sep)
    if (i >= 20 && i <= TITLE_MAX) return title.slice(0, i)
  }
  const cut = title.slice(0, TITLE_MAX - 1)
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`
}

/**
 * Metadata title for the root template `%s - Qubic Church`. Short titles keep the
 * brand suffix; long ones are used as they are (or shortened) without it.
 */
export function seoTitle(title: string): string | { absolute: string } {
  const t = shortTitle(title.trim())
  return t.length + BRAND_SUFFIX.length <= TITLE_MAX ? t : { absolute: t }
}

/** Plain-string variant for Open Graph and Twitter titles. */
export function seoTitleText(title: string): string {
  const t = seoTitle(title)
  return typeof t === 'string' ? t : t.absolute
}

/** Description of at most 160 characters, cut at a sentence end or a word boundary. */
export function seoDescription(description?: string): string | undefined {
  if (!description) return description
  const d = description.replace(/\s+/g, ' ').trim()
  if (d.length <= DESCRIPTION_MAX) return d
  const head = d.slice(0, DESCRIPTION_MAX)
  const sentenceEnd = Math.max(head.lastIndexOf('. '), head.lastIndexOf('? '), head.lastIndexOf('! '))
  if (sentenceEnd >= 80) return head.slice(0, sentenceEnd + 1)
  const words = d.slice(0, DESCRIPTION_MAX - 1)
  return `${words.slice(0, words.lastIndexOf(' ')).replace(/[,;:–-]+$/, '')}…`
}
