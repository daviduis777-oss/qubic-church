import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { Instrument_Serif } from 'next/font/google'

/** Type for the pool page and the Maria app: Geist for UI, Geist Mono for commands, Instrument Serif for the wordmark. */
export const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

export const poolFontVars = [GeistSans.variable, GeistMono.variable, instrumentSerif.variable].join(' ')
