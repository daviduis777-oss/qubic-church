import { createContentlayerPlugin } from 'next-contentlayer2'
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Book covers render at quality 88; Next 16 gates quality to this allowlist.
    qualities: [75, 88],
  },
  turbopack: {
    resolveAlias: {
      'contentlayer/generated': './.contentlayer/generated',
    },
  },
  serverExternalPackages: ['pino', 'pino-pretty'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
        ],
      },
    ]
  },
  async redirects() {
    // Pages withdrawn in the September 2026 corrections; each is listed on the corrections page.
    const corrections = '/docs/03-results/35-corrections-september-2026'
    const withdrawn = [
      '/docs/03-results-backup/:path*',
      '/docs/01-introduction/01-overview',
      '/docs/02-methods/03-data-collection',
      '/docs/02-methods/04-stylometry-analysis',
      '/docs/02-methods/05-confidence-scoring',
      '/docs/03-results/06-address-archaeology',
      '/docs/03-results/08-mybitcoin-investigation',
      '/docs/03-results/09-bridge-hypothesis',
      '/docs/03-results/10-primary-formula',
      '/docs/03-results/11-mathematical-connections',
      '/docs/03-results/12-statistical-validation',
      '/docs/03-results/13-jinn-architecture',
      '/docs/03-results/18-temporal-mechanisms',
      '/docs/03-results/26-genesis-puzzle-analysis',
      '/docs/03-results/27-seven-position-signature',
      '/docs/03-results/28-grok-path-verification',
      '/docs/adding-new-docs',
      '/docs/customizing',
      '/docs/mdx/:path*',
    ]
    return [
      { source: '/satoshi-nakamoto', destination: '/timeline#satoshi', permanent: true },
      {
        source: '/data/anna_matrix.json',
        destination: '/data/anna-matrix.json',
        permanent: true,
      },
      ...withdrawn.flatMap((path) =>
        ['', '/en', '/pt'].map((locale) => ({
          source: locale + path,
          destination: corrections,
          permanent: true,
        })),
      ),
      ...['', '/en', '/pt'].flatMap((locale) => [
        { source: `${locale}/agents`, destination: '/', permanent: true },
        { source: `${locale}/agents/:path*`, destination: '/', permanent: true },
      ]),
    ]
  },
}

const withContentlayer = createContentlayerPlugin({})

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(withContentlayer(nextConfig))
