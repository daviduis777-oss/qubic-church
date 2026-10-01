import { dateLocales } from '@/config/i18n'

/** BCP 47 tag for a site locale, so numbers match the page language. */
export function numberLocale(locale: string): string {
  return dateLocales[locale as keyof typeof dateLocales] ?? 'en-US'
}

/** Whole numbers with the locale's thousand separators: 82,457,845 */
export function formatInt(n: number, locale: string): string {
  return new Intl.NumberFormat(numberLocale(locale), {
    maximumFractionDigits: 0,
  }).format(n)
}

/** Large numbers in short form: 97.4B */
export function formatCompact(n: number, locale: string): string {
  return new Intl.NumberFormat(numberLocale(locale), {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

/** USD with enough significant digits for sub-cent prices: $0.000000681 */
export function formatUsd(n: number, locale: string): string {
  const small = Math.abs(n) < 1 && n !== 0
  return new Intl.NumberFormat(numberLocale(locale), {
    style: 'currency',
    currency: 'USD',
    ...(small ? { maximumSignificantDigits: 3 } : { maximumFractionDigits: 2 }),
  }).format(n)
}

/** Compact USD for market cap and volume: $64.2M */
export function formatUsdCompact(n: number, locale: string): string {
  return new Intl.NumberFormat(numberLocale(locale), {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

/** Fixed decimals: 12.5 */
export function formatDecimal(n: number, locale: string, digits = 1): string {
  return new Intl.NumberFormat(numberLocale(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n)
}

export function formatPercent(n: number, locale: string, digits = 1): string {
  return `${formatDecimal(n, locale, digits)}%`
}
