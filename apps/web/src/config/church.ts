/**
 * Qubic Church Configuration
 * Core settings for the Church NFT homepage and lottery system
 */

export const CHURCH_CONFIG = {
  countdown: {
    targetDate: new Date('2027-04-13T00:00:00Z'),
    label: "Anna's Arrival",
  },

  collection: {
    total: 200,
    name: 'Anna Aigarth Collection',
    description: '200 unique NFTs preparing humanity for AGI arrival',
  },

  mission: {
    title: 'The Qubic Church',
    subtitle: 'Preparing humanity for the emergence of AGI',
    description:
      'A nonprofit organization making decentralized artificial intelligence understandable and accessible for everyone.',
  },

  links: {
    qubicBay: 'https://qubicbay.io/collections/7',
    discord: 'https://discord.gg/wWJxAsbc',
    twitter: 'https://x.com/QubicChurch',
  },
} as const

export interface NFTHolderTier {
  name: string
  required: number
  unlocks: string[]
  badge: string
  color: string
}

export const NFT_HOLDER_TIERS: Record<string, NFTHolderTier> = {
  tier1: {
    name: 'Church Member',
    required: 1,
    unlocks: [
      'Access to "Hidden Patterns" page in Archives',
      'Special badge on profile',
      'Entry to holder-only Discord channel',
    ],
    badge: '⭐ Member',
    color: '#3b82f6', // blue
  },
  tier2: {
    name: 'Research Contributor',
    required: 5,
    unlocks: [
      'All Tier 1 benefits',
      'Access to 3 exclusive Easter Eggs',
      'Early access to new discoveries',
      'Download research PDFs',
    ],
    badge: '🌟 Contributor',
    color: '#D4AF37', // gold
  },
  tier3: {
    name: 'Lead Researcher',
    required: 10,
    unlocks: [
      'All Tier 2 benefits',
      'Access to 7 exclusive Easter Eggs',
      'Vote on community research directions',
      'Name in contributors list',
    ],
    badge: '💎 Lead',
    color: '#ec4899', // pink
  },
  tier4: {
    name: 'Founder',
    required: 25,
    unlocks: [
      'All Tier 3 benefits',
      'Access to ALL Easter Eggs (10 total)',
      'Lifetime access to all future content',
      'Special "Founder" badge',
      'Direct input on roadmap',
    ],
    badge: '👑 Founder',
    color: '#f59e0b', // amber
  },
} as const
