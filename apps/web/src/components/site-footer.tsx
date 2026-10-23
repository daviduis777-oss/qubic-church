import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { siteConfig } from '@/config/site'

const FOOTER_LINKS = [
  { href: '/books', label: 'Books' },
  { href: '/docs', label: 'Research' },
  { href: '/articles', label: 'Articles' },
  { href: '/cfb', label: 'Come-from-Beyond' },
  { href: '/satoshi-nakamoto', label: 'Satoshi Nakamoto' },
  { href: '/maria-aigarth', label: 'Maria' },
  { href: '/about', label: 'About' },
  { href: '/donate', label: 'Donate' },
  { href: '/legal', label: 'Legal' },
  { href: 'https://discord.gg/DTnCtckwRs', label: 'Discord' },
  { href: 'https://x.com/QubicChurch', label: 'X' },
]

const DONATION_ADDRESS =
  'BDRFCOFWHRTEHHMQQUIYJBXEOLNARADAGFUSBFGJFABYZBZLQNWJIPPFRTXO'

export async function SiteFooter() {
  const t = await getTranslations('site.footer')

  return (
    <footer className="relative z-10 mt-12 border-t border-border bg-black/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4">
          <nav
            aria-label="Footer"
            className="-ml-3 flex flex-wrap items-center gap-x-1 gap-y-1"
          >
            {FOOTER_LINKS.map(link => (
              <Link
                className="inline-flex h-10 items-center px-3 text-sm font-medium text-fg-2 transition-colors duration-150 ease-out hover:text-foreground"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-sm text-muted-foreground text-pretty">
            {t('created_by')}{' '}
            <a
              className="font-medium text-fg-2 underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-current"
              href={siteConfig.author.site}
              rel="noreferrer"
              target="_blank"
            >
              {siteConfig.author.name}
            </a>
          </p>
        </div>

        <div className="w-full max-w-sm space-y-3 md:w-80">
          <p className="eyebrow text-muted-foreground">
            Support the Atrium
          </p>
          <code className="block w-full select-all break-all border border-border bg-card px-3 py-2 font-mono text-xs leading-relaxed text-fg-2">
            {DONATION_ADDRESS}
          </code>
          <p className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>Qubic wallet · zero fees</span>
            <Link
              className="font-medium text-gold underline decoration-gold/40 underline-offset-4 transition-colors hover:decoration-gold"
              href="/donate"
            >
              Donate
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
