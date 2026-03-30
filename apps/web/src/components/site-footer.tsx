import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { siteConfig } from '@/config/site'

export async function SiteFooter() {
  const t = await getTranslations('site.footer')

  return (
    <footer className="relative z-10 border-t border-white/[0.04] mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex flex-col items-center gap-6 text-center">
        {/* Quick links row */}
        <nav className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 text-sm">
          <Link
            href="/books"
            className="px-3 py-1.5 font-medium underline underline-offset-4 opacity-70 hover:opacity-100 transition-opacity"
          >
            Books
          </Link>
          <span className="opacity-30 select-none">·</span>
          <Link
            href="/companion"
            className="px-3 py-1.5 font-medium underline underline-offset-4 opacity-70 hover:opacity-100 transition-opacity"
          >
            Companion
          </Link>
          <span className="opacity-30 select-none">·</span>
          <Link
            href="/donate"
            className="px-3 py-1.5 font-medium underline underline-offset-4 opacity-70 hover:opacity-100 transition-opacity"
          >
            Donate
          </Link>
          <span className="opacity-30 select-none">·</span>
          <Link
            href="/legal"
            className="px-3 py-1.5 font-medium underline underline-offset-4 opacity-70 hover:opacity-100 transition-opacity"
          >
            Legal
          </Link>
        </nav>

        {/* Authorship */}
        <p className="text-muted-foreground text-balance text-sm leading-loose">
          {t('created_by')}{' '}
          <a
            className="font-medium underline underline-offset-4"
            href={siteConfig.author.site}
            rel="noreferrer"
            target="_blank"
          >
            {siteConfig.author.name}
          </a>
        </p>

        {/* Donation block */}
        <div className="flex flex-col items-center gap-2 pt-6 border-t border-white/[0.04] w-full max-w-md">
          <Link
            href="/donate"
            className="px-4 py-2 border border-[#D4AF37]/30 text-[#D4AF37]/70 text-xs font-mono tracking-[0.2em] uppercase hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/60 hover:text-[#D4AF37] transition-all"
          >
            Support Independent Research
          </Link>
          <code className="text-xs font-mono text-white/25 select-all break-all w-full text-center leading-relaxed px-2">
            BDRFCOFWHRTEHHMQQUIYJBXEOLNARADAGFUSBFGJFABYZBZLQNWJIPPFRTXO
          </code>
          <span className="text-[11px] text-white/15">Qubic Wallet · Zero Fees</span>
        </div>
      </div>
    </footer>
  )
}
