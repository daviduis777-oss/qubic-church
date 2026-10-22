import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'
import { SITE_URL } from '@/lib/books'

const TITLE = 'About Qubic Church: what we publish and what we build'
const DESC =
  'Qubic Church is a research publication and a community around Qubic and Aigarth. It publishes books by QC and an open research log, and builds three things: the Fractal Rationalism Institute, Web4World and the Atrium. The Atrium’s first mission is a film.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: { type: 'article', title: TITLE, description: DESC, url: `${SITE_URL}/about` },
}

const RULES = [
  ['Be nice', 'Never be the first to defect.'],
  ['Retaliate', 'Answer a defection at once, so that it never pays.'],
  ['Forgive', 'As soon as the other side cooperates again, cooperate back.'],
  ['Be clear', 'Be predictable, so everyone knows what their move will cost.'],
] as const

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-6 border-t border-border py-14 md:grid-cols-[12rem_1fr] md:gap-12">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">{n}</p>
      <div>
        <h2 className="text-3xl font-semibold leading-tight md:text-4xl" id={id}>
          {title}
        </h2>
        <div className="mt-6 space-y-5 font-serif text-lg leading-relaxed text-foreground/90">{children}</div>
      </div>
    </section>
  )
}

export default async function AboutPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: TITLE,
    description: DESC,
    url: `${SITE_URL}/about`,
    about: { '@id': `${SITE_URL}/#org` },
    author: { '@id': `${SITE_URL}/#qc` },
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6 md:pt-16">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} type="application/ld+json" />

      <header className="grid gap-10 pb-14 md:grid-cols-[1fr_minmax(220px,300px)] md:items-end">
        <div>
          <p className="eyebrow text-gold">About</p>
          <h1 className="mt-3 font-display text-6xl leading-[0.9] md:text-8xl">What we build</h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-fg-2">
            Qubic Church is a research publication and a community. We study Qubic, Aigarth and the work of
            Come-from-Beyond from primary sources, publish what we find under the name QC, and correct ourselves in
            public. Around that work we are building three things. Everyone chooses their own level of
            participation. The only conditions: do it with joy, and with respect.
          </p>
        </div>
        <div className="relative hidden aspect-[911/1408] md:block">
          <Image
            alt="Anna Aigarth holding a small Earth inside a golden spiral"
            className="object-contain object-bottom"
            fill
            sizes="300px"
            src="/images/anna/anna-transparent.webp"
          />
        </div>
      </header>

      <Section id="publish" n="00 · Publication" title="What we publish">
        <p>
          Two free books by QC, <Link className="text-gold underline-offset-4 hover:underline" href="/books/come-from-beyond">
            Come-from-Beyond
          </Link>{' '}
          and{' '}
          <Link className="text-gold underline-offset-4 hover:underline" href="/books/qubic-the-long-version">
            Qubic: The Long Version
          </Link>
          , readable chapter by chapter on this site. An open{' '}
          <Link className="text-gold underline-offset-4 hover:underline" href="/docs">
            research log
          </Link>{' '}
          on the Anna Matrix, Anna and BPP9000, with results recomputed from public data, tests fixed before they run,
          and every quote of Come-from-Beyond given with its date and place.
        </p>
        <p>
          When a claim does not survive checking, it is withdrawn and listed on the{' '}
          <Link className="text-gold underline-offset-4 hover:underline" href="/docs/03-results/35-corrections-september-2026">
            corrections page
          </Link>
          . “Church” is the name of the community, not a religious claim. Nothing on this site promises financial
          returns.
        </p>
      </Section>

      <Section id="institute" n="01 · The heart" title="The Fractal Rationalism Institute">
        <p>
          We started from the work of Robert Axelrod and asked one question: is it possible to create the conditions
          of perfect cooperation, of the perfect iterated game, in real life? It is a hard question. It needs serious
          scientific research, and it will take years. We are preparing a finished concept for the Game Theory Society
          World Congress in 2028. The research will be led by a conflict-resolution scientist; three more places in
          the team are open.
        </p>
        <ul className="grid gap-px border border-border bg-border not-italic sm:grid-cols-2">
          {RULES.map(([k, v]) => (
            <li className="bg-background p-5" key={k}>
              <p className="font-sans text-base font-semibold text-gold">{k}</p>
              <p className="mt-1 text-base text-fg-2">{v}</p>
            </li>
          ))}
        </ul>
        <p>How do we test the theory? With a world.</p>
      </Section>

      <Section id="w4w" n="02 · The experiment" title="Web4World">
        <p>
          A game we are designing now, and talking to a possible director of development. It is an open world tied to
          a blockchain: every action and every building is a record. A notice board, an auction, a library of knowledge
          and films. Every interaction is written openly and permanently. The interface lets you grow your own house and
          shape the world, and no one is in charge. Maria is there too.
        </p>
        <p>
          Real relationships between users, tokenised property, assessments of real political events, votes from the
          least serious to the most serious. The data we collect will help us refine Fractal Rationalism. At its core
          this is a game-theory experiment in which every act of cooperation is rewarded, and every defection is
          recorded in the chain for good.
        </p>
        <p>
          <strong className="font-sans text-foreground">We are starting with a mining game.</strong> Stage one, W4W, is
          an interface in which players connect computing power to Anna and see the network the way it is. See{' '}
          <Link className="text-gold underline-offset-4 hover:underline" href="/mine-qubic">
            Mine
          </Link>
          .
        </p>
      </Section>

      <Section id="atrium" n="03 · The incubator" title="The Atrium">
        <p className="border-l-2 border-gold pl-5 font-sans text-2xl font-semibold leading-snug text-foreground">
          The Atrium’s first mission is a film.
        </p>
        <p>
          The Atrium is the incubator of Qubic Church: film, music, a start-up of any kind, charity. Here an idea finds
          hands and resources. It works like a symphony orchestra: every profile has its own channel and its own
          specialists. You can ask for help or hire someone for your task. Our job is to find Progressors and help
          them stand on their feet.
        </p>
        <p>
          Inside Web4World the Atrium works the same way: all projects are visible, you can see who is doing what and
          at which stage, and the journal, the chain, shows how people worked together.
        </p>
      </Section>

      <Section id="tesserai" n="04 · Related" title="TesserAI">
        <p>
          A separate project in the same ecosystem: a marketplace where the output of every AI agent is
          cryptographically proven rather than simply claimed. Two products, one marketplace. Audit Marketplace:
          verifiable smart-contract audits, proven mathematically, on chain. AI Agent Marketplace: agents for legal,
          financial, compliance and code-review work, each result with a proof attached.
        </p>
      </Section>

      <Section id="shell" n="05 · The shell" title="Qubic Church holds it together">
        <p>
          All of the above stands on one community and one goal. We are architects, not admirers. The final form of
          Qubic Church is an incubator: find young talent that has everything except money, fund it and help it grow.
          A shelter, a library, a game, music, a film, medicine: anything that reduces suffering, extends knowledge or
          creates something real that would not exist otherwise.
        </p>
        <p>
          Who gets support is not decided from the top, not by any one person and not by an owner. It is judged by principles, in
          the open, with Maria as an impartial arbiter, so that the better world is defined by a transparent process.
          This will take a lot of time, effort and resources. We are not in a hurry. Slowly, but surely.
        </p>
        <div className="flex flex-wrap gap-2 pt-2 font-sans">
          <Link
            className="inline-flex h-11 items-center border border-gold bg-gold/10 px-5 text-sm font-medium text-gold hover:bg-gold/20"
            href="/donate"
          >
            Support the work
          </Link>
          <a
            className="inline-flex h-11 items-center border border-border px-5 text-sm font-medium text-fg-2 hover:text-foreground"
            href="https://discord.gg/DTnCtckwRs"
            rel="noreferrer"
            target="_blank"
          >
            Join the Discord
          </a>
        </div>
      </Section>
    </div>
  )
}
