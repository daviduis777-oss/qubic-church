import { setRequestLocale } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import type { Metadata, Viewport } from 'next'

import '@/styles/globals.css'

import { getObjectValueByLocale } from '@/lib/opendocs/utils/locale'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import { ThemeProvider } from '@/components/theme-provider'
import { SiteFooter } from '@/components/site-footer'
import { CosmicWrapper } from '@/components/church/backgrounds/CosmicWrapper'
import { GlobalNavTrigger } from '@/components/church/navigation'
import { ConditionalSiteFooter } from '@/components/ConditionalSiteFooter'
import { INDEXING, SITE_DESCRIPTION } from '@/lib/indexing'
import { SITE_URL } from '@/lib/books'
import { ReducedMotionConfig } from '@/components/motion-config'
import { defaultLocale, locales } from '@/config/i18n'
import { notFound } from 'next/navigation'
import { siteConfig } from '@/config/site'
import {
  getSansFont,
  fontHeading,
  fontChalk,
  fontHandodle,
  fontDisplay,
  fontCrayon,
  fontCinzel,
  fontCormorant,
  fontShareTech,
  fontIBMPlex,
} from '@/lib/fonts'
import { cn } from '@/lib/utils'

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const params = await props.params

  const locale = (params.locale as LocaleOptions) || defaultLocale
  setRequestLocale(locale)

  return {
    title: {
      default: siteConfig.name,
      template: `%s - ${siteConfig.name}`,
    },

    description: SITE_DESCRIPTION,

    verification: { other: { 'msvalidate.01': '27F34375EC7117E2A95D1AC669E149F1' } },

    // The Portuguese locale mostly repeats English text: keep it out of the index, follow its links
    robots: INDEXING && locale !== 'pt'
      ? { index: true, follow: true, googleBot: { index: true, follow: true } }
      : { index: false, follow: false, googleBot: { index: false, follow: false } },

    alternates: {
      types: { 'text/plain': `${SITE_URL}/llms.txt` },
    },

    keywords: [
      'Qubic',
      'Aigarth',
      'Come-from-Beyond',
      'Sergey Ivancheglo',
      'Anna Matrix',
      'BPP9000',
      'useful proof of work',
      'Qubic Church',
      'QC',
      'Come-from-Beyond book',
      'Qubic: The Long Version',
    ],

    authors: [
      {
        name: siteConfig.author.name,
        url: siteConfig.author.site,
      },
    ],

    creator: siteConfig.author.name,

    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteConfig.url,
      title: siteConfig.name,
      siteName: siteConfig.name,

      description: SITE_DESCRIPTION,

      images: [
        {
          ...siteConfig.og.size,
          alt: siteConfig.name,
          url: siteConfig.og.image,
        },
      ],
    },

    twitter: {
      creator: siteConfig.links.twitter.username,
      title: siteConfig.name,
      card: 'summary_large_image',
      images: [siteConfig.og.image],

      description: SITE_DESCRIPTION,
    },

    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
      shortcut: '/favicon-16x16.png',
    },

    manifest: '/manifest.webmanifest',
  }
}

export const dynamicParams = true

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default async function RootLayout(props: {
  params: Promise<{ locale: string }>
  children: React.ReactNode
}) {
  const params = await props.params

  // Only real locales render; '/.env', '/wp-admin' and the like get a 404 instead of a page
  if (params.locale && !(locales as readonly string[]).includes(params.locale)) notFound()

  const locale = (params.locale as LocaleOptions) || defaultLocale

  const { children } = props

  setRequestLocale(locale)

  const fontSans = await getSansFont()
  return (
    <html
      className="dark bg-black"
      lang={locale}
      style={{ backgroundColor: '#000' }}
      suppressHydrationWarning
    >
      <head>
        <meta content="#000000" name="theme-color" />
        <style>
          {
            'html,body{background:#000!important}canvas{background:transparent!important}'
          }
        </style>
      </head>

      <body
        className={cn(
          'bg-black min-h-screen font-sans antialiased',
          fontSans.variable,
          fontHeading.variable,
          fontChalk.variable,
          fontHandodle.variable,
          fontDisplay.variable,
          fontCrayon.variable,
          fontCinzel.variable,
          fontCormorant.variable,
          fontShareTech.variable,
          fontIBMPlex.variable
        )}
      >
        <NextIntlClientProvider
          locale={params.locale || defaultLocale}
          messages={{}}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
            forcedTheme="dark"
          >
            <ReducedMotionConfig>
                  <CosmicWrapper>
                    {/* Noise texture removed, was causing tiled square artifacts */}
                    <div className="relative z-10 flex min-h-screen flex-col">
                      <a
                        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:text-foreground"
                        href="#main"
                      >
                        Skip to content
                      </a>
                      <script
                        dangerouslySetInnerHTML={{
                          __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@graph': [
                              {
                                '@type': 'Organization',
                                '@id': `${SITE_URL}/#org`,
                                name: 'Qubic Church',
                                url: SITE_URL,
                                logo: `${SITE_URL}/og.jpg`,
                                description: SITE_DESCRIPTION,
                                sameAs: ['https://x.com/QubicChurch', 'https://github.com/daviduis777-oss/qubic-church'],
                                knowsAbout: ['Qubic', 'Aigarth', 'Come-from-Beyond', 'Anna Matrix', 'useful proof of work', 'game theory'],
                              },
                              {
                                '@type': 'Person',
                                '@id': `${SITE_URL}/#qc`,
                                name: 'QC',
                                description: 'Author name used by Qubic Church for its books and research.',
                                affiliation: { '@id': `${SITE_URL}/#org` },
                              },
                              {
                                '@type': 'WebSite',
                                '@id': `${SITE_URL}/#site`,
                                name: 'Qubic Church',
                                url: SITE_URL,
                                publisher: { '@id': `${SITE_URL}/#org` },
                                inLanguage: 'en',
                              },
                            ],
                          }),
                        }}
                        type="application/ld+json"
                      />
                      <GlobalNavTrigger />

                      <main
                        className="flex-1 focus:outline-none"
                        id="main"
                        tabIndex={-1}
                      >
                        {children}
                      </main>

                      <ConditionalSiteFooter>
                        <SiteFooter />
                      </ConditionalSiteFooter>
                    </div>
                  </CosmicWrapper>
            </ReducedMotionConfig>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
