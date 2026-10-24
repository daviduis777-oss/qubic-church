import data from '@/data/articles/cfb-articles.json'

export type ArchiveEntry = {
  title: string
  /** YYYY-MM-DD, YYYY-MM when only the month is known, YYYY when only the year is. */
  date: string
  url: string
  platform: 'Medium' | 'Qubic blog' | 'X' | 'BitcoinTalk' | string
  summary: string
  tags: string[]
  /** where he shared it on X */
  shared?: { date: string; url: string }[]
}

/** Long-form articles by Come-from-Beyond, newest first. Links to the originals; nothing is republished. */
export const CFB_ARTICLES: ArchiveEntry[] = (data as ArchiveEntry[]).slice().sort((a, b) => b.date.localeCompare(a.date))

/** Full date, "Month YYYY" when only the month is known, "YYYY, undated" when only the year is. */
export const formatArchiveDate = (d: string) => {
  const [y, m, day] = d.split('-')
  if (!m) return `${y}, undated`
  const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(day ?? 15), 12))
  return dt.toLocaleDateString('en-GB', day ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** A preserved copy on the Internet Archive (nearest snapshot). */
export const archivedUrl = (url: string) => `https://web.archive.org/web/2026/${url}`

/** Stable id for an archive entry: the last path segment of the original URL. */
export const archiveId = (a: ArchiveEntry) => a.url.split('/').filter(Boolean).pop() ?? a.url
export const getArchiveEntry = (id: string) => CFB_ARTICLES.find(a => archiveId(a) === id)
