import { ArrowRight } from 'lucide-react'
import { Link } from '@/navigation'

const CH36 = '/docs/03-results/36-where-the-anna-matrix-comes-from'
const CH37 = '/docs/03-results/37-anna-0-22-and-btc'

const FINDINGS = [
  {
    title: 'A table of bot answers.',
    figure: '16,316 / 16,384',
    text: "The 128 × 128 Anna Matrix is a table our team compiled by hand from the Anna bot's replies on X to questions of the form x + y = ?. Row = 63 − y, column = x + 64. 16,316 of its 16,384 cells obey the mirror rule M[i, j] + M[127 − i, 127 − j] = −1. The 68 cells that break it sit in four runs. Three look like our own transcription errors (a block pasted one row off, a swapped digit, a copied neighbour); the cause of the fourth is unclear. Setting those cells to the value their mirror requires gives a fully symmetric candidate table, a symmetry imposed by the correction rather than evidence.",
    href: CH36,
  },
  {
    title: 'The fingerprint of a trained Aigarth unit.',
    figure: '10 / 100',
    text: `Qubic's public Aigarth code contains a unit type with exactly the bot's format: two 7-bit inputs, eight output bits. Of 100 such units trained on the full addition table, 10 land within 0.05 of Anna on six map statistics (a threshold set after a first exploration; at 0.06 it would be 17 of 100). Random mutation without selection never does. Units trained on x − y land just as close to their own target, so the shape says "trained on a full arithmetic table". Which operation it was is hard to read from the table alone; the bot's task, x + y = ?, is the stronger clue. Status: hypothesis, supported.`,
    href: CH36,
  },
  {
    title: 'More linear than expected.',
    figure: '+0.124',
    text: 'One ternary threshold per output bit explains a larger share of the remainder in Anna than in almost any trained unit: 2 of 217 reach her value (a measure we defined after seeing it). Starting from that threshold table, a search with units of the same size finds nothing further in Anna, while it recovers a large part of the remainder in 9 of 10 trained units. There is no exact reconstruction (best fit 87.8 % of bits). Which program produces this is the open question we are working on now.',
    href: CH36,
  },
  {
    title: 'Anna 0.22, Bitcoin data and Qubic mining.',
    figure: '9,456 / 9,456',
    text: `The Anna 0.22.64 program embeds 9,456 hourly BTCUSDT directions from Binance, 2 June 2025 to 30 June 2026, as its target values, and all of them match the exchange data. It is a network of 64 ternary neurons without market input, scored on how well its calls fit a year. The same design runs in Qubic's public mining algorithm BPP9000. A first test of the one saved state we found gave 48.9 % on 2,900 unseen hours (49.3 % in the pre-registered main window), as expected for a network without market input.`,
    href: CH37,
  },
]

function MethodLink({ href }: { href: string }) {
  return (
    <Link
      className="inline-flex items-center gap-1.5 text-sm font-medium text-gold underline decoration-gold/40 underline-offset-4 transition-colors hover:decoration-gold"
      href={href}
    >
      Method and data
      <ArrowRight aria-hidden className="size-3.5" />
    </Link>
  )
}

function Index({ n }: { n: number }) {
  return (
    <span className="font-mono text-xs tabular-nums text-muted-foreground">
      {String(n).padStart(2, '0')}
    </span>
  )
}

export function KeyFindings() {
  const [lead, ...rest] = FINDINGS
  if (!lead) return null

  return (
    <section aria-labelledby="key-findings" className="pb-12">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <h2
          className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mb-6"
          id="key-findings"
        >
          Key findings
        </h2>

        <ol className="grid gap-px bg-border border border-border md:grid-cols-3">
          <li className="grid gap-6 bg-card p-6 md:col-span-3 md:grid-cols-5 md:p-10">
            <div className="md:col-span-2 flex flex-col gap-3">
              <Index n={1} />
              <p className="font-mono text-4xl md:text-5xl font-semibold tabular-nums text-gold">
                {lead.figure}
              </p>
            </div>
            <div className="md:col-span-3 flex flex-col gap-4">
              <h3 className="font-serif text-xl md:text-2xl font-semibold">
                {lead.title}
              </h3>
              <p className="measure text-sm md:text-base leading-relaxed text-fg-2">
                {lead.text}
              </p>
              <MethodLink href={lead.href} />
            </div>
          </li>

          {rest.map((f, i) => (
            <li className="flex flex-col gap-4 bg-card p-6" key={f.title}>
              <Index n={i + 2} />
              <p className="font-mono text-3xl font-semibold tabular-nums text-gold">
                {f.figure}
              </p>
              <h3 className="font-serif text-lg font-semibold">{f.title}</h3>
              <p className="flex-1 text-sm leading-relaxed text-fg-2">
                {f.text}
              </p>
              <MethodLink href={f.href} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
