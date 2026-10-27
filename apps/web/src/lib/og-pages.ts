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
}

export function ogFor(id: keyof typeof OG_PAGES, alt?: string) {
  const url = `${SITE_URL}/og/page/${id}.png`
  const a = alt ?? OG_PAGES[id]!.title
  return { images: [{ url, width: 1200, height: 630, alt: a }], twitter: { card: 'summary_large_image' as const, images: [url] } }
}
