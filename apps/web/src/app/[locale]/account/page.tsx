import { Check, KeyRound, ShieldAlert, Wallet, X } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'
import { PageHeader } from '@/components/ui/page-header'
import { SITE_URL } from '@/lib/books'

const DESC = 'One sign-in for The Crypt, BPP-9000, W4W and the Atrium. Qubic Church only checks that you are you: no email, no password, no real name, no tracking.'

export const metadata: Metadata = {
  title: 'Your account: one key, no personal data',
  description: DESC,
  alternates: { canonical: `${SITE_URL}/account` },
  openGraph: { type: 'website', title: 'One account, no personal data', description: DESC, url: `${SITE_URL}/account` },
}

const PLACES = [
  { href: '/articles', name: 'The Crypt', what: 'Write and publish articles under your name.', when: 'Open' },
  { href: '/bpp9000', name: 'BPP-9000', what: 'Keep your trading journal and your card.', when: 'Open' },
  { href: '/w4w', name: 'W4W', what: 'Your house in the frozen town of Aigarth.', when: 'From 11.11.2026' },
  { href: '/donate', name: 'Atrium', what: 'The incubator. It will use the same account.', when: 'Next' },
] as const

const KEEP = [
  'The name you choose to show',
  'Your public Qubic ID, or a short code made from your secret word',
  'What you choose to publish or log: an article, a journal trade, your house in W4W',
]
const NEVER = [
  'Email, phone, password or real name',
  'Your secret word itself',
  'Seed phrases or private keys',
  'Your IP address or location; there are no tracking or analytics scripts',
]

/** One account node feeding four places: drawn, because the point is the shape. */
function Diagram() {
  const xs = [70, 230, 390, 550]
  return (
    <svg aria-label="One account opens The Crypt, BPP-9000, W4W and the Atrium" className="h-auto w-full" role="img" viewBox="0 0 620 230">
      <defs>
        <linearGradient id="acct-line" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#FFC46B" stopOpacity=".9" />
          <stop offset="1" stopColor="#FFC46B" stopOpacity=".25" />
        </linearGradient>
      </defs>
      {xs.map(x => (
        <path d={`M310 78 C310 120 ${x} 120 ${x} 156`} fill="none" key={x} stroke="url(#acct-line)" strokeWidth="1.5" />
      ))}
      <rect fill="#141016" height="56" rx="28" stroke="#FFC46B" strokeWidth="1.5" width="220" x="200" y="22" />
      <text fill="#FFE3B0" fontSize="16" fontWeight="600" textAnchor="middle" x="310" y="55">
        Your one account
      </text>
      {PLACES.map((p, i) => (
        <g key={p.name}>
          <rect fill="#0d0d10" height="48" rx="10" stroke="#3a3330" strokeWidth="1" width="130" x={xs[i]! - 65} y="156" />
          <text fill="#efe6da" fontSize="14.5" fontWeight="600" textAnchor="middle" x={xs[i]} y="178">
            {p.name}
          </text>
          <text fill="#9a8f80" fontSize="11.5" textAnchor="middle" x={xs[i]} y="195">
            {p.when}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default async function AccountPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  return (
    <div className="min-h-screen pb-16">
      <PageHeader eyebrow="Account" lede="The same sign-in opens every part of Qubic Church. We check that you are you. We never learn who you are." title="One key. No personal data." />

      <div className="mx-auto w-full max-w-3xl space-y-16 px-4 sm:px-6">
        <section aria-labelledby="where" className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground" id="where">
            Where it works
          </h2>
          <div className="border border-border bg-card px-3 py-6 sm:px-8">
            <Diagram />
          </div>
          <ul className="grid gap-px border border-border bg-border sm:grid-cols-2">
            {PLACES.map(p => (
              <li className="bg-background p-5" key={p.name}>
                <Link className="font-semibold text-foreground hover:underline" href={p.href}>
                  {p.name}
                </Link>
                <span className="ml-2 text-xs text-muted-foreground">{p.when}</span>
                <p className="mt-1.5 text-[15px] leading-relaxed text-fg-2">{p.what}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ways" className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground" id="ways">
            Two ways to sign in
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-border bg-card p-6">
              <Wallet aria-hidden className="mb-4 h-6 w-6 text-[#FFC46B]" />
              <h3 className="text-lg font-semibold text-foreground">A Qubic wallet</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-fg-2">Your wallet signs a one-time message. The signature proves you hold the ID and moves nothing. We keep your public ID, which is already public on the chain.</p>
            </div>
            <div className="border border-border bg-card p-6">
              <KeyRound aria-hidden className="mb-4 h-6 w-6 text-[#FFC46B]" />
              <h3 className="text-lg font-semibold text-foreground">A name and a secret word</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-fg-2">Pick a name and a secret word of 8 characters or more. The server turns the secret into a short code with a one-way function and keeps only the code. The same secret opens the same account on any device.</p>
              <p className="mt-3 text-[15px] leading-relaxed text-foreground">Keep the secret word safe. We have no email to send a reset to, so if it is lost, so is the account.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="data" className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground" id="data">
            What the site keeps
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-border p-6">
              <h3 className="font-semibold text-foreground">Kept</h3>
              <ul className="mt-4 space-y-3">
                {KEEP.map(k => (
                  <li className="flex gap-3 text-[15px] leading-relaxed text-fg-2" key={k}>
                    <Check aria-hidden className="mt-1 h-4 w-4 shrink-0 text-[#8fd18f]" />
                    {k}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-border p-6">
              <h3 className="font-semibold text-foreground">Never asked for, never kept</h3>
              <ul className="mt-4 space-y-3">
                {NEVER.map(k => (
                  <li className="flex gap-3 text-[15px] leading-relaxed text-fg-2" key={k}>
                    <X aria-hidden className="mt-1 h-4 w-4 shrink-0 text-[#e0806a]" />
                    {k}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-[15px] leading-relaxed text-fg-2">Signing in sets one cookie on this site, signed by the server, valid for 30 days. There is no session database. Logging out deletes the cookie. Like any website, our hosting provider sees requests as they pass through; the site itself stores none of it.</p>
        </section>

        <section className="flex gap-4 border border-[#e0806a55] bg-[#e0806a0d] p-6">
          <ShieldAlert aria-hidden className="mt-0.5 h-6 w-6 shrink-0 text-[#e0806a]" />
          <div>
            <h2 className="font-semibold text-foreground">Never type your seed here</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-fg-2">Qubic Church will never ask for your seed or private key, on this site or anywhere else. Your wallet only signs a message. Anyone asking for your seed is trying to take your funds.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
