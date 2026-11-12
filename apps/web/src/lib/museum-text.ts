import { SITE_URL } from '@/lib/books'
import { ANNA, ANNA_ARCHIVE, HALLS, type Version } from './museum'

/*
 * The museum for machines: the hall as plain markdown (for AI assistants that fetch text) and as schema.org
 * (a CollectionPage whose ItemList holds every Anna.exe as a SoftwareApplication with its date, size and SHA-256).
 */

export const MUSEUM_URL = `${SITE_URL}/museum`
export const MUSEUM_MD_URL = `${SITE_URL}/text/museum.md`
export const MUSEUM_TITLE = 'Museum, Hall 1: Anna.exe, every version Come-from-Beyond posted'
export const MUSEUM_DESCRIPTION =
  'The Anna.exe race from 10 June to 8 November 2026: every version Come-from-Beyond posted in the Qubic Discord, with its SHA-256, build time, console output and his words, verbatim. From the first file to the seven tests at zero on 6 July, the BTC candle versions and the BPP9000 fitness function.'

const versions = () =>
  ANNA.filter((e): e is Version => e.kind === 'version')
    .slice()
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
const when = (iso: string) =>
  `${new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}, ${iso.slice(11, 16)} UTC`
const oneLine = (s?: string) => (s ?? '').replace(/\n/g, ' ')

export function museumMarkdown() {
  const hall = HALLS[0]!
  const out = [
    '# Museum, Hall 1: Anna.exe',
    '',
    `> Qubic Church keeps this hall at ${MUSEUM_URL}. ${hall.span}. Times are UTC. Quotes of Come-from-Beyond are verbatim from the Qubic Discord.`,
    '',
    hall.lead,
    '',
    'Finishing Aigarth is one of the most remarkable things I have seen with my own eyes. This museum is a way to capture the moment and to keep the names of everyone who took part. Thank you for the journey. (QC)',
    '',
    '## The timeline',
    '',
  ]
  for (const e of ANNA.slice().sort((a, b) => Date.parse(a.at) - Date.parse(b.at))) {
    if (e.kind === 'version') {
      out.push(`### ${e.name} (${when(e.at)})`, '')
      if (e.cfb) out.push(`Come-from-Beyond: "${oneLine(e.cfb)}"`, '')
      if (e.note) out.push(oneLine(e.note), '')
      if (e.bytes)
        out.push(`- Windows console program, ${(e.bytes / 1024).toFixed(1)} KB${e.built ? `, built ${e.built.slice(0, 16).replace('T', ' ')} UTC` : ''}`)
      if (e.sha256) out.push(`- SHA-256: ${e.sha256}`, `- Download: ${ANNA_ARCHIVE}/${e.id}.zip`)
      if (e.batch) for (const f of e.batch) out.push(`- ${f.name}: SHA-256 ${f.sha256}`)
      if (e.files) out.push(`- ${e.files}`)
      out.push('')
    } else if (e.kind === 'talk') {
      out.push(`- ${when(e.at)}: ${e.ask ? `${e.ask.who} asked "${oneLine(e.ask.text)}". ` : ''}Come-from-Beyond: "${oneLine(e.text)}"`)
    } else if (e.kind === 'mark') {
      out.push('', `### ${e.title} (${e.at.slice(0, 10)})`, '', oneLine(e.text), e.quote ? `Come-from-Beyond: "${e.quote}"` : '', '')
    }
  }
  return out.join('\n')
}

export function museumLd() {
  const list = versions()
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: MUSEUM_TITLE,
      url: MUSEUM_URL,
      description: MUSEUM_DESCRIPTION,
      about: { '@type': 'Thing', name: 'Aigarth', url: `${SITE_URL}/what-is-aigarth` },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: list.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: list.map((v, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'SoftwareApplication',
            name: v.name,
            applicationCategory: 'Research software',
            operatingSystem: 'Windows',
            datePublished: v.at.slice(0, 19) + 'Z',
            author: { '@type': 'Person', name: 'Come-from-Beyond' },
            ...(v.bytes ? { fileSize: `${(v.bytes / 1024).toFixed(1)} KB` } : {}),
            ...(v.sha256 ? { identifier: `sha256:${v.sha256}`, downloadUrl: `${ANNA_ARCHIVE}/${v.id}.zip` } : {}),
            ...(v.cfb ? { description: oneLine(v.cfb) } : {}),
            url: `${MUSEUM_URL}#${v.id}`,
          },
        })),
      },
    },
  ]
}
