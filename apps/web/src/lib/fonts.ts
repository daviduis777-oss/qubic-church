import { JetBrains_Mono as FontMono, Inter, Caveat, Bebas_Neue, Cinzel, Cormorant_Garamond, Share_Tech_Mono, IBM_Plex_Mono } from 'next/font/google'
import localFont from 'next/font/local'

import { absoluteUrl } from './utils'

export const fontHeading = Inter({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
})

export async function getSansFont() {
  try {
    const { GeistSans } = await import('geist/font/sans')
    return GeistSans
  } catch {
    return { variable: '' } as { variable: string }
  }
}

export const fontChalk = Caveat({
  subsets: ['latin'],
  variable: '--font-chalk',
  weight: ['400', '700'],
})

export const fontHandodle = localFont({
  src: '../../public/fonts/Handodle.ttf',
  variable: '--font-handodle',
  display: 'swap',
})

export const fontCrayon = localFont({
  src: '../../public/fonts/DKCrayonCrumble.ttf',
  variable: '--font-crayon',
  display: 'swap',
})

export const fontDisplay = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-display',
  weight: '400',
})

export const fontMono = FontMono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const fontCinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  weight: ['400', '600', '900'],
})

export const fontCormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400'],
  style: ['normal', 'italic'],
})

export const fontShareTech = Share_Tech_Mono({
  subsets: ['latin'],
  variable: '--font-share-tech',
  weight: '400',
})

export const fontIBMPlex = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex',
  weight: ['200', '300', '400', '500', '600', '700'],
})

export async function getFonts() {
  try {
    const [bold, regular] = await Promise.all([
      fetch(new URL(absoluteUrl('/fonts/Geist-Bold.ttf')), {
        cache: 'force-cache',
      }).then(res => res.arrayBuffer()),

      fetch(new URL(absoluteUrl('/fonts/Geist-Regular.ttf')), {
        cache: 'force-cache',
      }).then(res => res.arrayBuffer()),
    ])

    return {
      bold,
      regular,
    }
  } catch (error) {
    console.warn('Failed to load fonts, using fallback:', error)
    return {
      bold: null,
      regular: null,
    }
  }
}
