import en from '@/i18n/locales/en.json'
import pt from '@/i18n/locales/pt.json'
import { absoluteUrl } from '@/lib/utils'

export const siteConfig = {
  name: 'Qubic Church',

  description: {
    en: 'Nonprofit organization preparing humanity for the emergence of AGI. Open research, education, and community governance powered by Qubic.',
    pt: pt.site.description,
  },

  url: process.env.NEXT_PUBLIC_APP_URL || 'https://github.com/daviduis777-oss/qubic-church',

  og: {
    image: absoluteUrl('/og.jpg'),

    size: {
      width: 1200,
      height: 630,
    },
  },

  app: {
    latestVersion: '1.0.0',
  },

  /**
   * NFT / Founders Count — UPDATE HERE when new NFTs are sold.
   * This is the single source of truth. All components read from here.
   *
   * Files that use this value:
   * - apps/web/src/components/church/hero/DesignerHeroClient.tsx (SOLD_COUNT + Roadmap HTML)
   * - apps/web/src/components/church/ContentModals.tsx (Roadmap modal)
   * - apps/web/src/components/church/sections/ChurchRoadmapSection.tsx (live section)
   * - apps/web/src/components/church/nfts/NFTCollectionSection.tsx (collection page)
   */
  nft: {
    foundersCount: 200,
    foundersTotal: 200,
    nextUnlockAt: 200,
  },

  author: {
    name: 'Qubic Church',
    site: 'https://github.com/daviduis777-oss/qubic-church',
  },

  links: {
    twitter: {
      label: 'Twitter',
      username: '@QubicChurch',
      url: 'https://x.com/QubicChurch',
    },

    github: {
      label: 'GitHub',
      url: 'https://github.com/daviduis777-oss/qubic-church',
    },

    discord: {
      label: 'Discord',
      url: 'https://discord.gg/wWJxAsbc',
    },
  },

  // SEO Keywords
  keywords: [
    'Qubic',
    'Qubic Church',
    'Anna AI',
    'Aigarth',
    'AGI',
    'Qubic NFT',
    'Anna NFT',
    'Crypto Research',
    'Blockchain Research',
    'CFB',
    'Ternary Computing',
    'Neural Network',
    'Qubic Mining',
    'Qubic Research',
    'Web3',
    'DeFi',
    'Cryptocurrency',
    'Open Source Research',
  ],

  // JSON-LD Structured Data
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Qubic Church',
    description: 'Nonprofit organization preparing humanity for the emergence of AGI. Open research, education, and community governance powered by Qubic.',
    url: 'https://github.com/daviduis777-oss/qubic-church',
    logo: 'https://github.com/daviduis777-oss/qubic-church/logo.png',
    sameAs: [
      'https://x.com/QubicChurch',
      'https://discord.gg/wWJxAsbc',
    ],
  },
} as const

export type SiteConfig = typeof siteConfig
