'use client'

import { Check, Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'

import { PageHeader } from '@/components/ui/page-header'
import { cn } from '@/lib/utils'

const DONATION_ADDRESS =
  'BDRFCOFWHRTEHHMQQUIYJBXEOLNARADAGFUSBFGJFABYZBZLQNWJIPPFRTXO'

const SUPPORTS = [
  {
    title: 'Young talent',
    desc: 'People who have everything except money: the Atrium finds them, funds them and helps them grow',
  },
  {
    title: 'Real projects',
    desc: 'A shelter, a library, a game, music, a film, medicine: anything that reduces suffering or extends knowledge',
  },
  {
    title: 'Open selection',
    desc: 'Who gets support is decided by principles, in the open, with Maria Aigarth as an impartial arbiter',
  },
  {
    title: 'First mission',
    desc: 'A film',
  },
]

export default function DonatePage() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(DONATION_ADDRESS).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="min-h-screen pb-8">
      <PageHeader
        eyebrow="Donate"
        lede="Donations go to the Atrium, the Qubic Church incubator for projects that make the world better."
        title="Support the Atrium"
      />

      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 space-y-12">
        {/* Address */}
        <section className="border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="shrink-0 bg-white p-3">
              <QRCodeSVG
                aria-label="QR code of the donation address"
                size={160}
                value={DONATION_ADDRESS}
              />
            </div>
            <div className="w-full min-w-0 space-y-3">
              <h2 className="eyebrow text-muted-foreground">
                Qubic wallet address
              </h2>
              <code className="block select-all break-all border border-border bg-background px-3 py-2.5 font-mono text-sm leading-relaxed text-foreground">
                {DONATION_ADDRESS}
              </code>
              <button
                className={cn(
                  'inline-flex h-10 items-center gap-2 border px-4 text-sm font-medium transition-colors duration-150 ease-out',
                  copied
                    ? 'border-verified/50 text-verified'
                    : 'border-gold/50 text-gold hover:border-gold hover:bg-gold/10'
                )}
                onClick={handleCopy}
                type="button"
              >
                {copied ? (
                  <Check aria-hidden="true" className="size-4" />
                ) : (
                  <Copy aria-hidden="true" className="size-4" />
                )}
                <span aria-live="polite">
                  {copied ? 'Copied' : 'Copy address'}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* What it supports */}
        <section>
          <h2 className="eyebrow mb-4 text-gold">Your donation supports</h2>
          <dl className="divide-y divide-border border-y border-border">
            {SUPPORTS.map(item => (
              <div
                className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-6"
                key={item.title}
              >
                <dt className="font-medium text-foreground">{item.title}</dt>
                <dd className="leading-relaxed text-fg-2 sm:col-span-2">
                  {item.desc}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* How to send */}
        <section>
          <h2 className="eyebrow mb-4 text-gold">How to send QUBIC</h2>
          <ol className="list-decimal space-y-2 pl-5 leading-relaxed text-fg-2 marker:text-muted-foreground">
            <li>
              Open your Qubic wallet at{' '}
              <a
                className="font-medium text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold"
                href="https://wallet.qubic.org"
                rel="noopener noreferrer"
                target="_blank"
              >
                wallet.qubic.org
              </a>
            </li>
            <li>Click &ldquo;Send&rdquo; and paste the address above</li>
            <li>Enter any amount and confirm the transaction</li>
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            Qubic transactions have zero fees and confirm in under 1 second.
          </p>
        </section>

        <nav
          aria-label="Related"
          className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-sm"
        >
          <a
            className="inline-flex items-center gap-1.5 text-fg-2 hover:text-foreground"
            href="https://wallet.qubic.org"
            rel="noopener noreferrer"
            target="_blank"
          >
            Qubic Wallet
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
          <Link className="text-fg-2 hover:text-foreground" href="/about#atrium">
            About the Atrium
          </Link>
          <Link className="text-fg-2 hover:text-foreground" href="/get-qubic">
            Get QUBIC
          </Link>
          <Link className="text-fg-2 hover:text-foreground" href="/">
            Homepage
          </Link>
        </nav>

        <p className="text-sm text-muted-foreground">
          Donations are voluntary gifts and carry no rights or returns. They go to the Atrium.
        </p>
      </div>
    </div>
  )
}
