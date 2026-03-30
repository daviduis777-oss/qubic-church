import { createContentlayerPlugin } from 'next-contentlayer2'
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      'contentlayer/generated': './.contentlayer/generated',
    },
  },
  serverExternalPackages: ['pino', 'pino-pretty'],
  async redirects() {
    return [
      {
        source: '/data/anna_matrix.json',
        destination: '/data/anna-matrix.json',
        permanent: true,
      },
    ]
  },
}

const withContentlayer = createContentlayerPlugin({})

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(withContentlayer(nextConfig))
