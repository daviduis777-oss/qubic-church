import { SITE_URL } from '@/lib/books'

/** One link-preview card per main page: what the page is, in a picture. Rendered by /og/page/<id>.png. */
export type OgPage = {
  path: string
  eyebrow: string
  title: string
  sub: string
  note?: string
  theme: 'gold' | 'amber' | 'blue'
  image?: string
  round?: boolean
  lamp?: boolean
}

export const OG_PAGES: Record<string, OgPage> = {
  donate: {
    path: '/donate',
    eyebrow: 'Support the Atrium',
    title: 'Light a lamp',
    sub: 'The Atrium is the Qubic Church incubator: young talent and real projects, chosen in the open.',
    note: 'First mission: a film about Come-from-Beyond',
    theme: 'amber',
    lamp: true,
  },
  about: {
    path: '/about',
    eyebrow: 'Qubic Church',
    title: 'What we build',
    sub: 'Books, open research, The Crypt, BPP-9000 and the Atrium. Faith replaced by verification.',
    theme: 'gold',
    image: 'anna.png',
  },
  cfb: {
    path: '/cfb',
    eyebrow: 'The dossier',
    title: 'Come-from-Beyond',
    sub: 'NXT, IOTA, Qubic. Eras, personas and milestones, from primary sources.',
    theme: 'blue',
    image: 'cfb.png',
    round: true,
  },
  nfts: {
    path: '/nfts',
    eyebrow: 'The collection',
    title: 'Anna Aigarth',
    sub: '200 NFTs ranked by the Rarity Codex. Each Anna makes its holder a founder of Qubic Church.',
    theme: 'gold',
    image: 'nft.png',
  },
  maria: {
    path: '/maria-aigarth',
    eyebrow: 'The arbiter',
    title: 'Maria Aigarth',
    sub: 'A research agent testing whether an AI arbiter can be impartial by design.',
    theme: 'blue',
    image: 'maria.png',
  },
  mine: {
    path: '/mine-qubic',
    eyebrow: 'Field guide',
    title: 'Mine Qubic',
    sub: 'Useful proof of work: hardware, pools and payouts, explained plainly.',
    theme: 'amber',
    lamp: true,
  },
  timeline: {
    path: '/timeline',
    eyebrow: 'The Road to The Day',
    title: '2000 to 13.04.2027',
    sub: 'Come-from-Beyond year by year, with a Satoshi Nakamoto chapter and his own answers on record.',
    theme: 'gold',
    image: 'anna.png',
  },
  books: {
    path: '/books',
    eyebrow: 'Two free books by QC',
    title: 'The Books',
    sub: 'Come-from-Beyond and Qubic: The Long Version, chapter by chapter, from primary sources.',
    theme: 'gold',
    image: 'anna.png',
  },
  rarity: {
    path: '/rarity-codex',
    eyebrow: 'The collection',
    title: 'Rarity Codex',
    sub: '200 Annas, five trait layers, ranked by emergence.',
    theme: 'gold',
    image: 'nft.png',
  },
  getqubic: {
    path: '/get-qubic',
    eyebrow: 'Getting started',
    title: 'Get Qubic',
    sub: 'A wallet, where QUBIC is traded, and the Anna Aigarth collection, step by step.',
    theme: 'amber',
    lamp: true,
  },
  companion: {
    path: '/companion',
    eyebrow: 'Forensic appendix',
    title: 'Anna Matrix Companion',
    sub: 'The appendix to chapter 13, with runnable code, and which claims stay open after the re-check.',
    theme: 'blue',
    image: 'anna.png',
  },
  matrix: {
    path: '/research/anna-matrix',
    eyebrow: 'Research lab',
    title: 'The Anna Matrix',
    sub: 'The 128 by 128 table of Anna\'s answers, explorable cell by cell.',
    theme: 'blue',
    image: 'anna.png',
  },
  status: {
    path: '/status',
    eyebrow: 'Live',
    title: 'Is Qubic down?',
    sub: 'The live tick, how fast it moves, and every stall we have seen.',
    theme: 'blue',
    lamp: true,
  },
  monitor: {
    path: '/monitoring',
    eyebrow: 'Live network',
    title: 'Network Monitor',
    sub: 'Ticks, epoch progress and supply of the Qubic network.',
    theme: 'blue',
    lamp: true,
  },
}

export function ogFor(id: keyof typeof OG_PAGES, alt?: string) {
  const url = `${SITE_URL}/og/page/${id}.png`
  const a = alt ?? OG_PAGES[id]!.title
  return { images: [{ url, width: 1200, height: 630, alt: a }], twitter: { card: 'summary_large_image' as const, images: [url] } }
}
