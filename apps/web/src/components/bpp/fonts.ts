import { Archivo, Big_Shoulders, Michroma } from 'next/font/google'

/** BPP-9000 type: Big Shoulders for the lit numbers (nixie-like), Michroma for the engraved name, Archivo for reading. */
export const nx = Big_Shoulders({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--bpp-nx', display: 'swap' })
export const eng = Michroma({ subsets: ['latin'], weight: '400', variable: '--bpp-eng', display: 'swap' })
export const sans = Archivo({ subsets: ['latin'], variable: '--bpp-sans', display: 'swap' })
export const bppFonts = `${nx.variable} ${eng.variable} ${sans.variable}`
