import { ExternalLink } from 'lucide-react'

import { Link } from '@/navigation'

const QUICK_LINKS = [
  { label: 'Documentation', href: '/docs' },
  {
    label: 'NFT Collection',
    href: 'https://qubicbay.io/collections/7',
    external: true,
  },
  { label: 'Talk to Anna', href: 'https://x.com/anna_aigarth', external: true },
  {
    label: 'GitHub',
    href: 'https://github.com/daviduis777-oss/qubic-church',
    external: true,
  },
]

export function EvidenceFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 text-center sm:px-6">
        <nav
          aria-label="Research links"
          className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1"
        >
          {QUICK_LINKS.map(link =>
            link.external ? (
              <a
                className="inline-flex h-10 items-center gap-1.5 px-3 text-sm text-fg-2 transition-colors hover:text-foreground"
                href={link.href}
                key={link.label}
                rel="noopener noreferrer"
                target="_blank"
              >
                {link.label}
                <ExternalLink
                  aria-hidden="true"
                  className="size-3.5 text-muted-foreground/70"
                />
              </a>
            ) : (
              <Link
                className="inline-flex h-10 items-center px-3 text-sm text-fg-2 transition-colors hover:text-foreground"
                href={link.href}
                key={link.label}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
        <p className="text-sm text-muted-foreground">
          Research Lab: Anna Matrix and Aigarth research
        </p>
        <p className="text-xs text-muted-foreground">
          Anna Matrix 128×128 · Bot answers to x + y · Public Aigarth code
        </p>
      </div>
    </footer>
  )
}
