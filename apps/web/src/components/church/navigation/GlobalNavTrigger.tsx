'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from '@/navigation'
import { NO_TAB, POOL_TAB, type PoolTab, probePoolTab } from '@/lib/pool/nav'

const LINKS = [
  ['/bpp9000', 'BPP-9000'],
  ['/bpp9000/brains', 'Brains'],
  ['/articles', 'Crypt'],
  ['/books', 'Books'],
  ['/docs', 'Research'],
  ['/cfb', 'Come-from-Beyond'],
  ['/timeline#phase-satoshi', 'Satoshi'],
  ['/nfts', 'Anna'],
  ['/maria-aigarth', 'Maria'],
  ['/mine-qubic', 'Mine'],
  ['/about', 'About'],
] as const

/** One quiet bar on every page. No wheel, no modals: every section is a real page. */
export function GlobalNavTrigger() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  // The hidden QC Pool tab: asked once per page load; rendered only after the gate says yes, never hidden with CSS.
  const [pool, setPool] = useState<PoolTab>(NO_TAB)

  useEffect(() => {
    let live = true
    probePoolTab().then(t => {
      if (live) setPool(t)
    })
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  // a tab is current on its own page and below it, unless a more specific tab (Brains under BPP-9000) owns that path
  const under = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const active = (href: string) => under(href) && !LINKS.some(([h]) => h !== href && h.startsWith(`${href}/`) && under(h))
  // On the forum's blue bar the gold reads too loud: the wordmark and Donate turn white there.
  const crypt = pathname === '/articles' || pathname.startsWith('/articles/')
  const home = pathname === '/'

  return (
    <>
      <header
        data-nav="v1"
        className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md transition-colors duration-200 ${
          pathname === '/articles' || pathname.startsWith('/articles/')
            ? 'border-[#2f4a63] bg-[#2f4a63]'
            : scrolled || open
              ? 'border-border bg-black/85'
              : 'border-transparent bg-black/40'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-8">
          <Link
            className={`text-sm font-semibold uppercase tracking-wordmark transition-colors md:text-base ${crypt ? 'text-white hover:text-white/80' : 'text-gold hover:text-gold-strong'}`}
            href="/"
            aria-label={home ? 'Qubic Church' : 'Home: back to Qubic Church'}
          >
            {home ? (
              'Qubic Church'
            ) : (
              <span className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 ${crypt ? 'border-white/50 hover:bg-white/10' : 'border-gold/50 hover:bg-gold/10'}`}>
                <svg aria-hidden fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
                  <path d="M3 11l9-7 9 7" />
                  <path d="M5 10v10h14V10" />
                  <path d="M10 20v-6h4v6" />
                </svg>
                Home
              </span>
            )}
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {LINKS.map(([href, label]) => (
              <Link
                aria-current={active(href) ? 'page' : undefined}
                className={`inline-flex h-10 items-center whitespace-nowrap px-1.5 text-[13px] font-medium transition-colors hover:text-foreground xl:px-3 xl:text-sm ${
                  active(href) ? 'text-foreground' : 'text-fg-2'
                }`}
                href={href}
                key={href}
              >
                {href === '/bpp9000' && <span aria-hidden className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#FFC46B] shadow-[0_0_8px_#FFC46B]" />}
                {label}
              </Link>
            ))}
            {pool.show && (
              <Link
                aria-current={active(POOL_TAB.href) ? 'page' : undefined}
                className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap px-1.5 text-[13px] font-medium transition-colors hover:text-foreground xl:px-3 xl:text-sm ${
                  active(POOL_TAB.href) ? 'text-foreground' : 'text-fg-2'
                }`}
                href={POOL_TAB.href}
                title={pool.preview ? 'Private preview: only you see this tab' : undefined}
              >
                {POOL_TAB.label}
                {pool.preview && <span aria-label="private preview" className="inline-block h-1.5 w-1.5 rounded-full border border-gold" role="img" />}
              </Link>
            )}
            <Link
              aria-current={active('/account') ? 'page' : undefined}
              aria-label="Account: one key, no personal data"
              className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap px-1.5 text-sm font-medium xl:px-3 transition-colors hover:text-foreground ${active('/account') ? 'text-foreground' : 'text-fg-2'}`}
              href="/account"
              title="One account for the Crypt and BPP-9000. No personal data."
            >
              <svg aria-hidden fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="15"><circle cx="7.5" cy="15.5" r="4.5" /><path d="M10.7 12.3L20 3M16 7l3 3M14 9l2 2" /></svg>
              <span className="hidden xl:inline">Account</span>
            </Link>
            <Link
              className={`ml-1 inline-flex h-9 items-center whitespace-nowrap border px-2.5 text-[13px] font-medium xl:ml-2 xl:px-3 xl:text-sm transition-colors ${crypt ? 'border-white/50 text-white hover:border-white hover:bg-white/10' : 'border-gold/50 text-gold hover:border-gold hover:bg-gold/10'}`}
              href="/donate"
            >
              Donate
            </Link>
          </nav>

          <button
            aria-controls="mobile-nav"
            aria-expanded={open}
            className="inline-flex h-10 items-center gap-2 px-2 text-sm font-medium text-fg-2 hover:text-foreground lg:hidden"
            onClick={() => setOpen(v => !v)}
            type="button"
          >
            <svg aria-hidden="true" fill="none" height="18" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" width="18">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <>
                  <line x1="3" x2="21" y1="7" y2="7" />
                  <line x1="3" x2="21" y1="17" y2="17" />
                </>
              )}
            </svg>
            Menu
          </button>
        </div>

        {open && (
          <nav aria-label="Mobile" className="border-t border-border px-4 pb-6 pt-2 lg:hidden" id="mobile-nav">
            {LINKS.map(([href, label]) => (
              <Link
                className="flex h-12 items-center border-b border-border/60 text-lg text-foreground"
                href={href}
                key={href}
              >
                {href === '/bpp9000' && <span aria-hidden className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#FFC46B] shadow-[0_0_8px_#FFC46B]" />}
                {label}
              </Link>
            ))}
            {pool.show && (
              <Link className="flex h-12 items-center gap-2 border-b border-border/60 text-lg text-foreground" href={POOL_TAB.href}>
                {POOL_TAB.label}
                {pool.preview && <span className="text-xs font-medium text-fg-2">Private preview</span>}
              </Link>
            )}
            <Link className="flex h-12 items-center gap-2 border-b border-border/60 text-lg text-foreground" href="/account">
              <svg aria-hidden fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><circle cx="7.5" cy="15.5" r="4.5" /><path d="M10.7 12.3L20 3M16 7l3 3M14 9l2 2" /></svg>
              Account
            </Link>
            <Link
              className="mt-4 inline-flex h-11 items-center border border-gold/60 px-4 text-sm font-medium text-gold"
              href="/donate"
            >
              Donate
            </Link>
          </nav>
        )}
      </header>
      <div className="h-14" />
    </>
  )
}
