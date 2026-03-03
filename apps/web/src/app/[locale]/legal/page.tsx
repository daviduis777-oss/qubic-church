import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Legal Notice & Privacy Policy - Qubic Church',
  description: 'Legal notice, privacy policy, and disclaimers for the Qubic Church research platform.',
}

const GOLD = '#f0c030'

export default function LegalPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: '#030208' }}
    >
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* Header */}
        <Link
          href="/"
          className="inline-block font-mono text-xs uppercase tracking-[0.3em] mb-12"
          style={{ color: `${GOLD}80` }}
        >
          &larr; Back to Home
        </Link>

        <h1
          className="text-3xl font-bold tracking-[0.15em] uppercase mb-2"
          style={{ color: GOLD, fontFamily: 'Cinzel, serif' }}
        >
          Legal Notice
        </h1>
        <div
          className="font-mono text-[0.6rem] tracking-[0.4em] uppercase mb-12"
          style={{ color: '#3a7090' }}
        >
          // Imprint &amp; Privacy Policy
        </div>

        <div className="space-y-12 font-mono text-sm leading-7 text-white/70">

          {/* Section: Disclaimer */}
          <section>
            <h2 className="text-lg font-bold tracking-[0.1em] mb-4" style={{ color: GOLD }}>
              1. Disclaimer
            </h2>
            <p>
              This website (&quot;Qubic Church&quot;) is an independent, community-driven research
              platform. It is not affiliated with, endorsed by, or officially connected to any
              blockchain protocol, foundation, or corporate entity unless explicitly stated.
            </p>
            <p className="mt-3">
              All content is provided <span style={{ color: '#5bc8f5' }}>&quot;as is&quot;</span> for
              educational and research purposes only. Nothing on this site constitutes financial advice,
              investment guidance, or a solicitation to purchase any digital asset.
            </p>
          </section>

          {/* Section: Research Content */}
          <section>
            <h2 className="text-lg font-bold tracking-[0.1em] mb-4" style={{ color: GOLD }}>
              2. Research Content
            </h2>
            <p>
              Research findings presented on this platform use a three-tier confidence system:
            </p>
            <ul className="mt-3 space-y-2 ml-4">
              <li>
                <span style={{ color: '#4ade80' }}>[PROVEN]</span> &mdash; Independently verifiable,
                calculator-reproducible
              </li>
              <li>
                <span style={{ color: GOLD }}>[OBSERVATION]</span> &mdash; Supported by multiple
                sources, documented patterns
              </li>
              <li>
                <span style={{ color: '#f87171' }}>[HYPOTHESIS]</span> &mdash; Speculative,
                clearly marked, not verified
              </li>
            </ul>
            <p className="mt-3">
              Users should independently verify all claims. The authors assume no liability for
              decisions made based on information presented here.
            </p>
          </section>

          {/* Section: Intellectual Property */}
          <section>
            <h2 className="text-lg font-bold tracking-[0.1em] mb-4" style={{ color: GOLD }}>
              3. Intellectual Property
            </h2>
            <p>
              Research documentation is released under{' '}
              <span className="text-white/90">Creative Commons BY-SA 4.0</span>.
              Source code is licensed under the <span className="text-white/90">MIT License</span>.
            </p>
            <p className="mt-3">
              Third-party trademarks, logos, and brand names referenced on this site belong to
              their respective owners and are used solely for identification purposes.
            </p>
          </section>

          {/* Section: Privacy Policy */}
          <section>
            <h2 className="text-lg font-bold tracking-[0.1em] mb-4" style={{ color: GOLD }}>
              4. Privacy Policy
            </h2>
            <h3 className="text-white/90 font-bold mb-2">4.1 Data Collection</h3>
            <p>
              This website does not collect personal data, use cookies for tracking, or employ
              third-party analytics services. No user accounts or login systems exist.
            </p>

            <h3 className="text-white/90 font-bold mt-4 mb-2">4.2 Hosting</h3>
            <p>
              This site is hosted on <span className="text-white/90">Vercel Inc.</span> (San Francisco, CA).
              Vercel may collect standard server logs (IP addresses, request timestamps) as part of
              normal infrastructure operations. See{' '}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: '#5bc8f5' }}
              >
                Vercel&apos;s Privacy Policy
              </a>{' '}
              for details.
            </p>

            <h3 className="text-white/90 font-bold mt-4 mb-2">4.3 External Links</h3>
            <p>
              This site contains links to external websites. We are not responsible for the
              privacy practices or content of those sites.
            </p>
          </section>

          {/* Section: No Investment Advice */}
          <section>
            <h2 className="text-lg font-bold tracking-[0.1em] mb-4" style={{ color: GOLD }}>
              5. No Investment Advice
            </h2>
            <p>
              Nothing on this website constitutes financial, legal, or tax advice. References to
              cryptocurrencies, tokens, or digital assets are for research documentation only.
              Past performance does not indicate future results. Always conduct your own research
              and consult qualified professionals before making financial decisions.
            </p>
          </section>

          {/* Section: Limitation of Liability */}
          <section>
            <h2 className="text-lg font-bold tracking-[0.1em] mb-4" style={{ color: GOLD }}>
              6. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, the operators of this website
              shall not be liable for any direct, indirect, incidental, consequential, or punitive
              damages arising from the use of or inability to use this website or its content.
            </p>
          </section>

          {/* Section: Contact */}
          <section>
            <h2 className="text-lg font-bold tracking-[0.1em] mb-4" style={{ color: GOLD }}>
              7. Contact
            </h2>
            <p>
              For questions, corrections, or takedown requests regarding content on this site,
              please open an issue on the{' '}
              <a
                href="https://github.com/RideMatch1/qubic-church"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: '#5bc8f5' }}
              >
                GitHub repository
              </a>.
            </p>
          </section>

          {/* Footer date */}
          <div
            className="pt-8 border-t font-mono text-xs"
            style={{ borderColor: `${GOLD}15`, color: `${GOLD}50` }}
          >
            Last updated: March 2026
          </div>
        </div>
      </div>
    </div>
  )
}
