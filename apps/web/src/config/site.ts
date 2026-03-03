import en from '@/i18n/locales/en.json'
import pt from '@/i18n/locales/pt.json'
import { absoluteUrl } from '@/lib/utils'

export const siteConfig = {
  name: 'Qubic Church',

  description: {
    en: 'Nonprofit organization preparing humanity for the emergence of AGI. Open research, education, and community governance powered by Qubic.',
    pt: pt.site.description,
  },

  url: process.env.NEXT_PUBLIC_APP_URL || 'https://qubicchurch.com',

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

  author: {
    name: 'Qubic Church',
    site: 'https://qubicchurch.com',
  },

  links: {
    twitter: {
      label: 'Twitter',
      username: '@QubicChurch',
      url: 'https://x.com/QubicChurch',
    },

    github: {
      label: 'GitHub',
      url: 'https://github.com/qubic-church',
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
    'Qubic Giveaway',
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
    url: 'https://qubicchurch.com',
    logo: 'https://qubicchurch.com/logo.png',
    sameAs: [
      'https://x.com/QubicChurch',
      'https://discord.gg/wWJxAsbc',
    ],
  },
} as const

export type SiteConfig = typeof siteConfig
