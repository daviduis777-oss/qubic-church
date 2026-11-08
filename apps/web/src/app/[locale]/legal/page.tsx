import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Legal Notice & Privacy Policy - Qubic Church',
  description:
    'Legal notice, privacy policy, and disclaimers for the Qubic Church research platform.',
  alternates: { canonical: 'https://qubic.church/legal' },
}

import { PageHeader } from '@/components/ui/page-header'

const H2 = 'text-xl font-semibold tracking-tight text-foreground mb-4'
const H3 = 'font-medium text-foreground mt-6 mb-2'
const A =
  'font-medium text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold'

export default function LegalPage() {
  return (
    <div className="min-h-screen pb-8">
      <PageHeader eyebrow="Imprint and privacy policy" title="Legal notice" />
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <div className="measure space-y-12 leading-7 text-fg-2">
          {/* Section: Disclaimer */}
          <section>
            <h2 className={H2}>1. Disclaimer</h2>
            <p>
              This website (&quot;Qubic Church&quot;) is an independent,
              community-driven research platform. It is not affiliated with,
              endorsed by, or officially connected to any blockchain protocol,
              foundation, or corporate entity unless explicitly stated.
            </p>
            <p className="mt-3">
              All content is provided{' '}
              <span className="text-foreground">&quot;as is&quot;</span> for
              educational and research purposes only. Nothing on this site
              constitutes financial advice, investment guidance, or a
              solicitation to purchase any digital asset.
            </p>
          </section>

          {/* Section: Research Content */}
          <section>
            <h2 className={H2}>2. Research Content</h2>
            <p>
              Research findings presented on this platform use a three-tier
              confidence system:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-muted-foreground">
              <li>
                <span className="font-medium text-verified">Proven:</span>{' '}
                Independently verifiable, calculator-reproducible
              </li>
              <li>
                <span className="font-medium text-gold">Observation:</span>{' '}
                Supported by multiple sources, documented patterns
              </li>
              <li>
                <span className="font-medium text-danger">Hypothesis:</span>{' '}
                Speculative, clearly marked, not verified
              </li>
            </ul>
            <p className="mt-3">
              Users should independently verify all claims. The authors assume
              no liability for decisions made based on information presented
              here.
            </p>
          </section>

          {/* Section: Intellectual Property */}
          <section>
            <h2 className={H2}>3. Intellectual Property</h2>
            <p>
              Research documentation is released under{' '}
              <span className="text-foreground">
                Creative Commons BY-SA 4.0
              </span>
              . Source code is licensed under the{' '}
              <span className="text-foreground">MIT License</span>.
            </p>
            <p className="mt-3">
              Third-party trademarks, logos, and brand names referenced on this
              site belong to their respective owners and are used solely for
              identification purposes.
            </p>
          </section>

          {/* Section: Privacy Policy */}
          <section>
            <h2 className={H2}>4. Privacy Policy</h2>
            <h3 className={H3}>4.1 What we collect</h3>
            <p>
              Reading the site needs no account. We use no advertising, no tracking cookies and no
              third-party analytics.
            </p>
            <p className="mt-3">
              You can sign in to take part in the forum (The Crypt) and in the BPP-9000 experiment.
              Sign-in works in one of two ways, and neither needs an e-mail address or a password
              stored by us:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-muted-foreground">
              <li>
                <span className="text-foreground">Qubic wallet:</span> you sign a one-time message
                with your wallet. We keep your public Qubic ID; we never see or ask for your seed.
              </li>
              <li>
                <span className="text-foreground">Tripcode:</span> you choose a secret word. We keep
                only a code derived from it, never the word itself.
              </li>
            </ul>
            <p className="mt-3">
              With either, we keep the display name you choose and the handle made from your
              sign-in. If you fill in your profile, we also keep what you add there: a link to
              your X account, a short bio and an avatar.
            </p>

            <h3 className={H3}>4.2 What becomes public</h3>
            <p>
              The forum is public by design. Posts you submit wait for moderation; approved posts,
              your name, handle, profile and avatar are published on this site and stored in
              its public{' '}
              <a className={A} href="https://github.com/daviduis777-oss/qubic-church" rel="noopener noreferrer" target="_blank">
                GitHub repository
              </a>
              , where their history stays visible. Entries you log in the BPP-9000 experiment
              (your calls and their times) are shown in your public journal and counted in
              the experiment&apos;s totals. Do not post anything you do not want to be public.
            </p>

            <h3 className={H3}>4.3 Cookies and browser storage</h3>
            <p>
              Signing in sets one cookie, <span className="text-foreground">qcf_session</span>,
              which keeps you signed in for up to 30 days; signing out removes it. Moderators get
              a second one, <span className="text-foreground">qcf_mod</span>, for up to 14 days.
              Both are strictly necessary for the feature you asked for and are not used for
              tracking. Some pages also keep small settings in your browser&apos;s own storage
              (for example a remembered choice); that data never leaves your device.
            </p>

            <h3 className={H3}>4.4 Your choices</h3>
            <p>
              You can sign out at any time. To have a post, your profile or your journal removed,
              open an issue on the GitHub repository (see Contact). Removing it from the site is
              straightforward; copies already in the repository&apos;s history may remain there.
            </p>

            <h3 className={H3}>4.5 Hosting</h3>
            <p>
              This site is hosted on{' '}
              <span className="text-foreground">Vercel Inc.</span> (San
              Francisco, CA). Vercel may collect standard server logs (IP
              addresses, request timestamps) as part of normal infrastructure
              operations. See{' '}
              <a
                className={A}
                href="https://vercel.com/legal/privacy-policy"
                rel="noopener noreferrer"
                target="_blank"
              >
                Vercel&apos;s Privacy Policy
              </a>{' '}
              for details.
            </p>

            <h3 className={H3}>4.6 External Links</h3>
            <p>
              This site contains links to external websites. We are not
              responsible for the privacy practices or content of those sites.
            </p>
          </section>

          {/* Section: No Investment Advice */}
          <section>
            <h2 className={H2}>5. No Investment Advice</h2>
            <p>
              Nothing on this website constitutes financial, legal, or tax
              advice. References to cryptocurrencies, tokens, or digital assets
              are for research documentation only. Past performance does not
              indicate future results. Always conduct your own research and
              consult qualified professionals before making financial decisions.
            </p>
          </section>

          {/* Section: Limitation of Liability */}
          <section>
            <h2 className={H2}>6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, the operators
              of this website shall not be liable for any direct, indirect,
              incidental, consequential, or punitive damages arising from the
              use of or inability to use this website or its content.
            </p>
          </section>

          {/* Section: Contact */}
          <section>
            <h2 className={H2}>7. Contact</h2>
            <p>
              For questions, corrections, or takedown requests regarding content
              on this site, please open an issue on the{' '}
              <a
                className={A}
                href="https://github.com/daviduis777-oss/qubic-church"
                rel="noopener noreferrer"
                target="_blank"
              >
                GitHub repository
              </a>
              .
            </p>
          </section>

          {/* Footer date */}
          <div className="border-t border-border pt-8 text-sm text-muted-foreground">
            Last updated: November 2026
          </div>
        </div>
      </div>
    </div>
  )
}
