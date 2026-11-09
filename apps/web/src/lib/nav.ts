/**
 * The site map as people use it: four doors, each with its pages. One list drives the bar, the drop-down panels,
 * the mobile sheet and the search (⌘K), so a new page added here shows up everywhere at once.
 */
export type NavBadge = 'status' | 'countdown' | 'epoch' | 'new'
export type NavItem = { href: string; name: string; desc: string; badge?: NavBadge; keys?: string }
export type NavGroup = { id: 'live' | 'read' | 'research' | 'join'; label: string; title: string; line: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  {
    id: 'live',
    label: 'Live',
    title: 'Live',
    line: 'The experiment, as it happens: the Bitcoin predictor, the brains it grows, and the network under it.',
    items: [
      { href: '/bpp9000', name: 'BPP-9000', desc: 'Bitcoin, hour by hour, UP or DOWN. The record opens with the first live call.', badge: 'countdown', keys: 'bitcoin predictor btc record live call' },
      { href: '/bpp9000/brains', name: 'Brain Watch', desc: 'The epoch’s best brain under the glass, ten brains voting, and how to run one yourself.', badge: 'new', keys: 'brains genome exam homework ensemble download run' },
      { href: '/epochs', name: 'Epochs', desc: 'The week in Aigarth: what changed, what was released, what was said.', badge: 'epoch', keys: 'week digest news changes' },
      { href: '/status', name: 'Is Qubic down?', desc: 'One answer, live: is the tick moving right now.', badge: 'status', keys: 'status network down stall tick' },
      { href: '/monitoring', name: 'Network monitor', desc: 'Ticks, epoch clock, supply and your address watchlist.', keys: 'monitor ticks supply burned watchlist' },
    ],
  },
  {
    id: 'read',
    label: 'Read',
    title: 'Read',
    line: 'Two free books, the forum, Come-from-Beyond, Satoshi, and the questions people ask most.',
    items: [
      { href: '/books', name: 'The Books', desc: 'Come-from-Beyond and Qubic: The Long Version, chapter by chapter.', keys: 'book chapters read' },
      { href: '/articles', name: 'The Crypt', desc: 'The forum: articles by the community, and CfB’s own archive.', keys: 'forum articles crypt post write' },
      { href: '/cfb', name: 'Come-from-Beyond', desc: 'The person behind NXT, IOTA and Qubic, in his own words.', keys: 'cfb sergey ivancheglo' },
      { href: '/who-is-come-from-beyond', name: 'Who is Come-from-Beyond?', desc: 'The short answer, with sources.', keys: 'who is cfb' },
      { href: '/timeline#phase-satoshi', name: 'Satoshi', desc: 'The Satoshi Nakamoto question: the case block by block, and CfB’s own answers on record.', keys: 'satoshi nakamoto bitcoin creator identity' },
      { href: '/timeline', name: 'The Road to The Day', desc: 'Come-from-Beyond from 2000 to 13.04.2027, every item sourced.', keys: 'timeline history 2027 nxt iota' },
      { href: '/what-is-qubic', name: 'What is Qubic?', desc: 'The network in plain words: computors, epochs, useful proof of work.', keys: 'qubic explained basics' },
      { href: '/what-is-anna-aigarth', name: 'What is Anna?', desc: 'The AI the network grows, and what it can and cannot do yet.', keys: 'anna aigarth ai' },
    ],
  },
  {
    id: 'research',
    label: 'Research',
    title: 'Research',
    line: 'Methods, numbers and re-checks. Every claim with its source.',
    items: [
      { href: '/docs', name: 'Research log', desc: 'Methods, results and re-checks. Every number recomputed.', keys: 'research docs log' },
      { href: '/evidence', name: 'Anna Matrix', desc: 'The 128 × 128 grid, its symmetries, and what they do and do not prove.', keys: 'matrix evidence grid' },
      { href: '/research/anna-matrix', name: 'Matrix explorer', desc: 'Every cell of Anna’s answers, explorable.', keys: 'matrix explorer cells' },
      { href: '/companion', name: 'Matrix companion', desc: 'The forensic appendix to chapter 13, with runnable code.', keys: 'companion appendix code' },
      { href: '/rarity-codex', name: 'Rarity Codex', desc: 'All 200 Annas ranked by trait rarity.', keys: 'rarity traits nft' },
    ],
  },
  {
    id: 'join',
    label: 'Join',
    title: 'Join',
    line: 'Take part: talk to Maria, mine, hold an Anna, support the work.',
    items: [
      { href: '/maria-aigarth', name: 'Maria', desc: 'Our AI on X. Ask her anything about Qubic.', keys: 'maria ai x twitter' },
      { href: '/nfts', name: 'Anna collection', desc: '200 hand-made Annas. Each gives its holder the status of a founder.', keys: 'nft anna collection founder' },
      { href: '/mine-qubic', name: 'Mine Qubic', desc: 'How mining works and how to start.', keys: 'mine mining miner pool' },
      { href: '/get-qubic', name: 'Get Qubic', desc: 'A wallet, where QUBIC is traded, step by step.', keys: 'wallet exchange buy' },
      { href: '/donate', name: 'Donate', desc: 'Support independent research.', keys: 'donate support' },
      { href: '/about', name: 'About', desc: 'What Qubic Church is, and what it is not.', keys: 'about church' },
    ],
  },
]

/** Pages the bar reaches directly (not inside a door), still findable by search. */
const EXTRA = [
  { href: '/account', name: 'Account', desc: 'One key for the Crypt and BPP-9000. No personal data.', keys: 'account login sign in key', group: 'Account' },
  { href: '/legal', name: 'Legal and privacy', desc: 'What the site keeps, cookies, and how to have your data removed.', keys: 'legal privacy cookies terms', group: 'About' },
]

export const ALL_ITEMS = [...NAV.flatMap(g => g.items.map(i => ({ ...i, group: g.label }))), ...EXTRA]
