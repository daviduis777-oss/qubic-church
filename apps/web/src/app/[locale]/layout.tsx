import { setRequestLocale } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import type { Metadata, Viewport } from 'next'

import '@/styles/globals.css'

import { getObjectValueByLocale } from '@/lib/opendocs/utils/locale'
import type { LocaleOptions } from '@/lib/opendocs/types/i18n'
import { ThemeProvider } from '@/components/theme-provider'
import { SiteFooter } from '@/components/site-footer'
import { EasterEggProvider } from '@/components/church/easter-eggs/EasterEggProvider'
import { TreasureHuntProvider } from '@/components/church/easter-eggs/TreasureHuntProvider'
import { CosmicWrapper } from '@/components/church/backgrounds/CosmicWrapper'
import { GlobalNavTrigger } from '@/components/church/navigation'
import { ConditionalSiteFooter } from '@/components/ConditionalSiteFooter'
import { defaultLocale } from '@/config/i18n'
import { siteConfig } from '@/config/site'
import { getSansFont, fontHeading, fontChalk, fontHandodle, fontDisplay, fontCrayon, fontCinzel, fontCormorant, fontShareTech, fontIBMPlex } from '@/lib/fonts'
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

    description: getObjectValueByLocale(siteConfig.description, locale),

    keywords: [
      'Qubic',
      'Qubic Church',
      'Anna AI',
      'Aigarth',
      'Bitcoin Bridge',
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
      'Cryptocurrency',
      'Open Source Research',
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

      description: getObjectValueByLocale(siteConfig.description, locale),

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

      description: getObjectValueByLocale(siteConfig.description, locale),
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

  const locale = (params.locale as LocaleOptions) || defaultLocale

  const { children } = props

  setRequestLocale(locale)

  const fontSans = await getSansFont()
  return (
    <html lang={locale} suppressHydrationWarning className="dark bg-black" style={{ backgroundColor: '#000' }}>
      <head>
        <meta content="#000000" name="theme-color" />
        <style>{`html,body{background:#000!important}canvas{background:transparent!important}`}</style>
      </head>

      <body
        className={cn(
          'bg-black min-h-screen font-sans antialiased church-scan-lines',
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
            forcedTheme="dark"
            disableTransitionOnChange
          >
            <EasterEggProvider>
              <TreasureHuntProvider>
                <CosmicWrapper>
                  {/* Noise texture removed — was causing tiled square artifacts */}
                  <div className="relative z-10 flex min-h-screen flex-col">
                    <GlobalNavTrigger />

                    <main className="flex-1">{children}</main>

                    <ConditionalSiteFooter>
                      <SiteFooter />
                    </ConditionalSiteFooter>
                  </div>
                </CosmicWrapper>
              </TreasureHuntProvider>
            </EasterEggProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
