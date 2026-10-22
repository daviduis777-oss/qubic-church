import type { Metadata } from 'next'
import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'
import { SITE_URL } from '@/lib/books'

/*
 * Mining field guide. Source: "Qubic Mining, explained like a human would",
 * QubicChurch mining desk, guide v0.3 (epoch 230), plus dated network changes.
 * Server-rendered on purpose: every answer is in the HTML for search and LLMs.
 */

const TITLE = 'How to mine Qubic: the field guide'
const DESC =
  'A practical guide to Qubic mining under useful proof of work: what a solution is, why it/s is not money, cost per solution, AVX-512 CPUs and GPUs, renting vs your own PC, wallet safety, pools, launch commands, troubleshooting and payouts.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/mine-qubic` },
  openGraph: { type: 'article', title: TITLE, description: DESC, url: `${SITE_URL}/mine-qubic` },
}

const TOC = [
  ['doing', 'What you are actually doing'],
  ['rule', 'The rule that saves your wallet'],
  ['money', 'Am I making money?'],
  ['cheap', 'Does cheap hardware earn the same?'],
  ['combo', 'GPU and CPU together'],
  ['rig', 'Pick the right rig'],
  ['where', 'Your own PC or a rented box'],
  ['wallet', 'Wallet: seed and address'],
  ['launch', 'Launch and keep it alive'],
  ['broken', 'When it looks broken'],
  ['paid', 'When do I get paid?'],
  ['rent', 'Phones, and rent vs buy'],
  ['ready', 'Anna, and getting ready'],
  ['cheat', 'One-screen cheat sheet'],
] as const

const CPUS = [
  ['Ryzen / Threadripper 7000 & 9000 (Zen 4/5)', 'Golden', 'Full AVX-512, many fast cores.'],
  ['EPYC 9004 / 9005', 'Golden', 'Server grade, best in class.'],
  ['Xeon Scalable Gold / Platinum (recent)', 'Good', 'Real AVX-512, plenty of cores.'],
  ['Xeon E5 v2 / v3 / v4', 'Skip', 'Old, no AVX-512. Looks like a server CPU, mines like a brick.'],
  ['Intel Core Ultra / Arrow Lake', 'Skip', 'Modern, but AVX-512 was dropped.'],
  ['Celeron / Pentium / i3, 2 cores', 'Skip', 'Chokes the cards. The classic cheap rented-box mistake.'],
] as const

const GPUS = [
  ['RTX 5070 Ti (16 GB)', 'Value champion', 'Best $/SOL when paired with a strong CPU. Start here.'],
  ['RTX 5090 / 4090', 'Fast, pricey', 'Top speed, top rent. Wins only while $/SOL stays high.'],
  ['RTX 3090 / 3080', 'Old but cheap', 'Often the quiet $/SOL winner. Slow is not the same as unprofitable.'],
  ['AMD Radeon', 'Bumpy', 'Works some epochs, rougher than NVIDIA/CUDA. Not for a first run.'],
] as const

const TRIAGE = [
  ['0 SOL in the first hour on one card', 'Normal. Solutions arrive in 5 to 30 minutes, sometimes longer.', 'Nothing. Hopping rigs every few minutes only burns money.'],
  ['Shares "frozen", reseeding, all miners locked', 'Almost always pool or backend lag around an epoch change.', 'Wait. Restart the miner once if you are anxious.'],
  ['Pool dashboard "10 behind"', 'Display lag, not lost work.', 'Cosmetic. Ignore or restart.'],
  ['Dashboard shows nothing for a worker', 'Duplicate worker name.', 'Give each rig a unique -workername.'],
  ['Many rejected or expired ant candidates', 'The CPU cannot keep up with the cards, or the host lags.', 'Stronger CPU or a better host.'],
  ['"worker package download failed"', 'Your region cannot reach the pool servers.', 'Rent a box in another country.'],
] as const

const FAQ = [
  {
    q: 'What does a Qubic miner actually produce?',
    a: 'Solutions, not hashes. Under useful proof of work the network gives your machine a small AI candidate (an "ant") to train. When the trained ant beats the one you started with, that improvement is a solution. Solutions are checked and paid, and the work feeds Aigarth.',
  },
  {
    q: 'Does a higher it/s mean more money?',
    a: 'No. it/s (iterations per second) is speed, like lottery tickets per minute. You are paid for solutions found and for what each solution is worth that epoch. Judge every machine by solutions per hour and cost per solution.',
  },
  {
    q: 'How do I know if I am making money mining Qubic?',
    a: 'Compute your own cost per solution: what the server costs per day divided by the solutions it made that day. Run one machine for one epoch, read the real SOL count, divide. If this week’s $/SOL is comfortably above it, continue; if not, park the rig. Treat the pool’s estimate as a forecast, not a paycheck.',
  },
  {
    q: 'Why is $/SOL so high at the start of an epoch?',
    a: 'At the opening almost no solutions exist yet, so the estimate divides the reward across nearly nothing. As the week fills with solutions the rate slides toward reality. A wave of new miners dilutes it further.',
  },
  {
    q: 'Which CPU should I use for Qubic mining?',
    a: 'A modern CPU with AVX-512: Ryzen or Threadripper Zen 4/5, EPYC 9004/9005, or recent Xeon Scalable. Avoid Xeon E5, Intel Core Ultra (no AVX-512) and 2-core budget chips. Aim for at least 8 CPU cores per GPU, PCIe x8 or better, and a host with 99% or better uptime.',
  },
  {
    q: 'Which GPU is best for Qubic mining?',
    a: 'For most people an RTX 5070 Ti (16 GB) behind a strong AVX-512 CPU gives the best $/SOL. 16 GB of VRAM is enough. RTX 5090/4090 are faster but only pay off while $/SOL stays high; older 3090/3080 are often good value. AMD works but is less reliable.',
  },
  {
    q: 'Should I mine with GPU and CPU at the same time?',
    a: 'Yes, if the machine has a proper AVX-512 CPU: launch with both -gpu and -cpu (combo mining). On a box with a weak two-core CPU the CPU adds nothing and can slow the cards.',
  },
  {
    q: 'When are Qubic mining rewards paid?',
    a: 'In QUBIC, to your address, after the epoch ends. An epoch runs from Wednesday 12:00 UTC to the next Wednesday 12:00 UTC. Payout usually lands about a week later, on the following Wednesday or Thursday, sometimes Friday.',
  },
  {
    q: 'Do I need to stop or restart the miner at a new epoch?',
    a: 'No. At an epoch transition the miner idles by itself until the backend has the update, then continues.',
  },
  {
    q: 'What is the difference between the seed and the address?',
    a: 'The seed is 55 lowercase letters and is the master key: keep it on paper and never type it into a pool or rental site. The address (Qubic ID) is 60 uppercase letters and is safe to share; it is all a pool or miner needs.',
  },
] as const

function H2({ id, n, children }: { id: string; n: string; children: React.ReactNode }) {
  return (
    <header className="mb-6 mt-20 scroll-mt-24" id={id}>
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">{n}</p>
      <h2 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">{children}</h2>
    </header>
  )
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <aside className="my-6 border border-gold/40 bg-gold/5 p-5">
      <p className="eyebrow text-gold">{title}</p>
      <div className="mt-2 text-foreground/90">{children}</div>
    </aside>
  )
}

function Table({ head, rows }: { head: readonly string[]; rows: readonly (readonly string[])[] }) {
  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {head.map(h => (
              <th className="py-3 pr-4 font-mono text-xs uppercase tracking-widest text-fg-2" key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr className="border-b border-border/60 align-top" key={r[0]}>
              {r.map((c, i) => (
                <td
                  className={`py-3 pr-4 ${i === 0 ? 'text-foreground' : 'text-fg-2'} ${
                    c === 'Golden' || c === 'Good' || c === 'Value champion' ? 'font-semibold text-emerald-300' : ''
                  } ${c === 'Skip' ? 'font-semibold text-rose-300' : ''}`}
                  key={i}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const code = 'block overflow-x-auto border border-border bg-card p-4 font-mono text-sm leading-relaxed text-foreground'
const inline = 'border border-border bg-card px-1.5 py-0.5 font-mono text-[0.85em]'

export default async function MineQubicPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: TITLE,
      description: DESC,
      url: `${SITE_URL}/mine-qubic`,
      author: { '@id': `${SITE_URL}/#qc` },
      publisher: { '@id': `${SITE_URL}/#org` },
      about: [{ '@type': 'Thing', name: 'Qubic mining' }, { '@type': 'Thing', name: 'Useful proof of work' }],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ]

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:px-6 md:pt-16">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} type="application/ld+json" />

      <header>
        <p className="eyebrow text-gold">Mining desk · field guide · useful proof of work</p>
        <h1 className="mt-3 font-display text-6xl leading-[0.9] md:text-8xl">Mining Qubic, explained</h1>
        <p className="mt-6 font-serif text-xl leading-relaxed text-foreground/85">
          Renting, hardware, payouts, the &ldquo;am I even making money&rdquo; question, and the Anna optimization game
          under all of it. Every question from the channel, answered in one place.
        </p>
        <p className="mt-4 text-sm text-fg-2">
          Based on the Qubic Church mining guide v0.3 (epoch 230). Rates, pools and Anna versions change: check the
          numbers yourself. Not financial advice.
        </p>
      </header>

      <nav aria-label="Contents" className="mt-10 border-y border-border py-6">
        <ol className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {TOC.map(([id, t], i) => (
            <li key={id}>
              <a className="flex gap-3 text-fg-2 hover:text-foreground" href={`#${id}`}>
                <span className="w-6 font-mono text-gold/80">{String(i + 1).padStart(2, '0')}</span>
                {t}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="text-lg leading-relaxed text-foreground/90 [&_li]:mt-2 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6">
        <H2 id="doing" n="01 · the 60-second version">What you are actually doing</H2>
        <p>
          Bitcoin mining makes a machine guess trillions of numbers and throw almost all of them away. Qubic uses{' '}
          <strong>useful proof of work</strong>. The network hands your machine a tiny AI candidate, called an
          &ldquo;ant&rdquo;, and your hardware trains it. When the trained ant beats the one you started with, that
          improvement is a <strong>solution</strong>. Solutions are checked and paid, and the work feeds Aigarth.
        </p>
        <ul>
          <li>
            <strong>Epoch</strong>: one mining week, Wednesday 12:00 UTC to the next Wednesday 12:00 UTC. Rewards settle
            at the end.
          </li>
          <li>
            <strong>it/s</strong> (iterations per second): how fast your card trains. Speed, not money.
          </li>
          <li>
            <strong>SOL</strong> and <strong>$ per SOL</strong>: a solution, and roughly what one is worth right now.
          </li>
        </ul>

        <H2 id="rule" n="02 · the rule that saves your wallet">More it/s does not mean more money</H2>
        <p>
          This is the most expensive misunderstanding in the whole Discord. Someone rents a big machine, watches a huge
          it/s number, and cannot understand why the payout is tiny. it/s is lottery tickets per minute: more tickets
          improve the odds, they do not guarantee the win and do not set the prize. You are paid for{' '}
          <strong>solutions found</strong> and what each one is worth that week. A fast card behind a weak CPU is a race
          car behind a blocked fuel line.
        </p>
        <Note title="Rule one">Judge every machine by solutions per hour and cost per solution. Never by it/s.</Note>

        <H2 id="money" n="03 · the question under every other question">Am I making money, or losing it?</H2>
        <p>
          There is no single break-even. It is <em>your</em> cost against <em>this week&rsquo;s</em> rate. Two things
          move underneath it.
        </p>
        <p>
          <strong>The start-of-epoch mirage.</strong> When an epoch opens almost no solutions exist yet, so the estimate
          divides the reward pot across nearly nothing. That is how people saw $0.46 per SOL at the opening of epoch
          230. As the week fills with solutions the rate slides toward reality.
        </p>
        <p>
          <strong>Dilution.</strong> Even if you change nothing, your earnings drop when other people start mining: more
          miners, more solutions, a smaller slice of the same pot. One miner watched it fall 35% in a day.
        </p>
        <Note title="The whole game in one line">
          <span className="font-mono">cost per solution = server cost per day ÷ solutions it made that day</span>
          <br />
          Run one machine for one epoch, read the real SOL count, divide. If this week&rsquo;s $/SOL is comfortably above
          it, keep going. If not, park the rig: rental billing is per minute, so testing is nearly free.
        </Note>
        <p>
          Mining Qubic is not a reliable daily paycheck. You are betting you will end up holding more QUBIC than if you
          had bought it, and that Aigarth pays off in the long run. Some epochs you win that bet, some you don&rsquo;t.
          Size it like a bet, not a salary.
        </p>

        <H2 id="cheap" n="04 · the complaint that won’t die">Does cheap hardware earn the same as a monster?</H2>
        <ul>
          <li>
            <strong>PPLNS smooths luck.</strong> In shared-reward mode payouts are averaged per share, so a modest rig
            looks similar to a big one over a short window. Solo mode is where strong hardware pulls ahead on the highs,
            and eats the lows.
          </li>
          <li>
            <strong>Old cards can still find solutions.</strong> That is deliberate: Qubic keeps the barrier low so many
            people can join.
          </li>
        </ul>
        <p>
          But $/SOL still separates winners from losers. The cheap box earns similar only until you divide by what it
          costs to run. Raw power was never the point; cost per solution is.
        </p>

        <H2 id="combo" n="05 · what changed">You run the GPU and the CPU now</H2>
        <p>
          The old advice was: on a rented box, skip CPU mining and let the cards work. Unlearn it. The CPU side, with the
          AVX-512 instructions of modern chips, now does real training work of its own. The modern setup is{' '}
          <strong>combo mining</strong>: both engines on, two it/s readouts, one pool.
        </p>
        <pre className={code}>E:229 | SHARES: 1/1 | [CUDA] 49 it/s … [AVX2] 5 it/s … GPU #0 found 148 exact ant candidates</pre>
        <Note title="Do this">
          Launch with <code className={inline}>-gpu -cpu</code> together, if the machine has a proper AVX-512 CPU. On a
          box with a weak two-core CPU the CPU adds nothing and may choke the cards. The fix is to rent a box whose CPU is
          worth turning on.
        </Note>

        <H2 id="rig" n="06 · the golden formula">Pick a rig that wins on cost per solution</H2>
        <p>
          Two servers with the same GPU and the same it/s can differ three to five times in solutions, purely because of
          the CPU behind the cards. The CPU must be modern, with <strong>AVX-512</strong>.
        </p>
        <Table head={['CPU family', 'Verdict', 'Why']} rows={CPUS} />
        <p>
          Beyond the family: at least <strong>8 CPU cores per GPU</strong>, <strong>PCIe x8 or better</strong> (gen 3 or
          4), <strong>host reliability of 99% or more</strong>, and a region that can reach the pool&rsquo;s servers.
        </p>
        <Table head={['Card', 'Role', 'Notes']} rows={GPUS} />
        <p>
          16 GB of VRAM is plenty. &ldquo;How much is a 5090 earning now?&rdquo; has no fixed answer: this epoch&rsquo;s
          $/SOL times its solutions, minus rent. Measure, don&rsquo;t assume.
        </p>
        <Note title="The pick for most people">
          A couple of RTX 5070 Ti behind a Zen 4/5 Threadripper or an EPYC, on a cheap, reliable host. Not the flashy
          4×5090 monster.
        </Note>

        <H2 id="where" n="07 · where the machine lives">Your own PC, or a rented box?</H2>
        <p>
          <strong>Your own PC</strong> is free, already yours, and fine for learning and one card; it runs hot and loud.{' '}
          <strong>A rented cloud GPU</strong> scales, and you can pick exactly the hardware from section 06. Marketplaces
          people use:
        </p>
        <ul>
          <li>
            <strong>Clore.ai</strong>: decentralized, usually cheapest, crypto-friendly, mining allowed.
          </li>
          <li>
            <strong>Octaspace</strong> (cube.octa.computer): clean access-token flow; the good cards sell out fast.
          </li>
          <li>
            <strong>Vast.ai</strong>: the other big decentralized option.
          </li>
        </ul>
        <p className="text-base text-fg-2">
          Our referral link, labelled openly: if you rent on Clore anyway, signing up through{' '}
          <a className="text-gold underline underline-offset-4" href="https://clore.ai/register?ref_id=tgwpwvbi" rel="noopener noreferrer sponsored" target="_blank">
            clore.ai/register?ref_id=tgwpwvbi
          </a>{' '}
          sends a few credits our way, and we spend them on mining Qubic. The hardware advice is the same either way.
        </p>
        <Note title="Two warnings">
          Deposit small first: run one cheap box for an hour, prove the loop pays, then scale. Never type card numbers,
          bank details or your wallet <strong>seed</strong> into a rental or pool site. A host only needs your 60-letter
          address. Anything asking for the 55-letter seed is a theft attempt.
        </Note>

        <H2 id="wallet" n="08 · do this exactly once">Make a wallet, keep the right half secret</H2>
        <p>
          Make the wallet at the official wallet site; type the address yourself, don&rsquo;t follow a link someone
          sends you. You get two strings:
        </p>
        <ul>
          <li>
            <strong>Seed</strong>: 55 lowercase letters, the master key. Paper only. Never a screenshot, a chat or a
            &ldquo;wallet validator&rdquo; site.
          </li>
          <li>
            <strong>Address (Qubic ID)</strong>: 60 uppercase letters. Safe to share; this is what the pool and miner
            use.
          </li>
        </ul>
        <p>
          Give every rig its own worker name, for example <code className={inline}>QC-5070ti-a</code>,{' '}
          <code className={inline}>QC-5070ti-b</code>. If two machines share a name, the dashboard blurs them and one
          looks dead.
        </p>

        <H2 id="launch" n="09 · getting it running">Launch the combo miner, and keep it alive</H2>
        <p>
          On a rented Linux box you get a web terminal. Whatever pool you choose, two rules never change:{' '}
          <strong>point it at your address</strong>, and <strong>launch it detached</strong> so it survives you closing
          the tab. With the JetSki client that looks like this:
        </p>
        <pre className={code}>
          {`# your 60-letter address and a unique worker name
nohup ./qubjetski-Client -wallet YOUR_ADDRESS -workername QC-a -gpu -cpu -start > miner.log 2>&1 &
sleep 4 && tail -n 20 miner.log`}
        </pre>
        <p>
          <code className={inline}>nohup</code> and the trailing <code className={inline}>&amp;</code> detach the miner,
          so it keeps running after you log out. Miss them and the rig goes dark the moment you look away. For
          shared-reward mode add <code className={inline}>-pplns</code> before <code className={inline}>-start</code>;
          leave it off for solo.
        </p>
        <ul>
          <li>
            <a className="text-gold underline underline-offset-4" href="https://jetskipool.ai" rel="noopener noreferrer" target="_blank">
              JetSki
            </a>
            : the simplest. No account, one line, the least fiddly place to start.
          </li>
          <li>
            <a className="text-gold underline underline-offset-4" href="https://app.qubic.li" rel="noopener noreferrer" target="_blank">
              QLI (qubic.li)
            </a>
            : get <code className={inline}>qli-Client</code> from dl.qubic.li/downloads, put an{' '}
            <code className={inline}>appsettings.json</code> next to it with your access token and trainer settings (
            <code className={inline}>&quot;cpu&quot;: true</code> only with a real AVX-512 CPU), run{' '}
            <code className={inline}>./qli-Client</code>. QLI ships its own background-service installer.
          </li>
          <li>
            <a className="text-gold underline underline-offset-4" href="https://qubic.minerlab.io" rel="noopener noreferrer" target="_blank">
              MinerLab
            </a>
            : account first. Register, add your payout address, create a worker; the dashboard gives you the exact
            command to paste.
          </li>
        </ul>
        <p>
          <strong>New epoch?</strong> Do nothing. At an epoch transition the miner idles by itself until the backend has
          the update, so it does not waste electricity.
        </p>

        <H2 id="broken" n="10 · reading the log without panicking">When it looks broken (but usually isn&rsquo;t)</H2>
        <Table head={['What you see', 'What it means', 'Do']} rows={TRIAGE} />
        <Note title="Rule two">
          The log stops scrolling when you press Ctrl+C, but the miner keeps running.{' '}
          <code className={inline}>tail -f miner.log</code> to watch, <code className={inline}>pgrep -f qubjetski</code>{' '}
          to confirm exactly one is alive, <code className={inline}>nvidia-smi</code> to see the cards working. Two
          processes means you launched twice: <code className={inline}>pkill -f qubjetski</code> and start one.
        </Note>

        <H2 id="paid" n="11 · the waiting game">When do I actually get paid?</H2>
        <p>
          In <strong>QUBIC</strong>, at the end of the epoch, to your address. Not in dollars, not daily. An epoch that
          closes on Wednesday usually pays the following Wednesday or Thursday, sometimes Friday. If the revenue tab seems
          to &ldquo;lose&rdquo; the epoch that just closed, the calculation is not finished yet; it comes back.
        </p>
        <p>
          Because you are paid in QUBIC a week later, you hold the coin between earning it and seeing its dollar value.
          The price can move either way in that week. That lag is part of the bet.
        </p>

        <H2 id="rent" n="12 · odds and ends">Phones, and the rent-vs-buy argument</H2>
        <p>
          <strong>Android mining</strong> exists and comes and goes with the epoch cycle. Fun to run, not a strategy.
        </p>
        <p>
          <strong>&ldquo;Why rent at all? I would rather buy the coin.&rdquo;</strong> Both sides are right. Renting out
          hardware gives the owner a steady income; mining is a lottery. If you only want QUBIC and hate variance, buy it:
          simpler and often cheaper per coin. Mine if you also want to learn the machine, contribute compute to Aigarth,
          and take the bet that mining nets more coins than buying. Rig owners renting instead of mining is a real signal
          about this week&rsquo;s odds.
        </p>

        <H2 id="ready" n="13 · the game under the game">Anna, and why the smart move is getting ready</H2>
        <p>
          Anna is the reference solver for Aigarth, the system the mining is training. Right now she is being optimized,
          not maxed out: versions move, modes change from epoch to epoch, and the target is a model that generalizes
          instead of bluffing. The network is not asking for maximum brute force yet.
        </p>
        <p>
          So the winning move today is not to throw money at raw power for a thin $/SOL. It is to be built and ready: the
          AVX-512 CPU, the combo launch, the right host, a $/SOL number you actually know, and a workflow that is
          reflexive. When the phase flips, the people who used the quiet window to prepare point tuned power at it from
          the first hour.
        </p>
        <Note title="What is changing next">
          Come-from-Beyond announced on 20 October 2026 that from epoch 240 (18 November 2026) mining moves to a live
          BTC data feed, with one more epoch run the old way, after which miners qualify by accuracy. Cloning and the RAM
          selector stop working. Follow the official{' '}
          <a className="text-gold underline underline-offset-4" href="https://join.qubic.org/discord" rel="noopener noreferrer" target="_blank">
            Qubic Discord
          </a>{' '}
          for the exact rules.
        </Note>

        <H2 id="cheat" n="14 · tape this to the monitor">One-screen cheat sheet</H2>
        <dl className="grid gap-4 border border-border bg-card p-5 text-base">
          {[
            ['Setup order (once)', 'Wallet → seed on paper → copy 60-letter address → AVX-512 CPU + NVIDIA card → unique worker name → launch detached → measure on the dashboard.'],
            ['Combo launch', 'nohup ./qubjetski-Client -wallet YOUR_ADDRESS -workername QC-a -gpu -cpu -start > miner.log 2>&1 &'],
            ['Rules that keep money', '$/SOL, not it/s. Cost per solution = rent ÷ solutions. Start-of-epoch spikes are a mirage; dilution is real. CPU must be AVX-512. A 5070 Ti with a strong CPU beats a 4×5090 on $/SOL.'],
            ['Health checks', 'tail -f miner.log · pgrep -f qubjetski (exactly one) · pkill -f qubjetski · nvidia-smi'],
            ['Don’t panic', '0 shares in the first hour is fine · frozen at rollover is backend lag · blank dashboard is a duplicate worker name · payout about a week later · miner idles between epochs on purpose.'],
            ['Safety', 'The 55-letter seed goes nowhere but the official wallet. Pools and hosts only need the 60-letter address.'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="eyebrow text-gold">{k}</dt>
              <dd className="mt-1 text-fg-2">{v}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="faq" className="mt-20">
          <h2 className="text-3xl font-semibold" id="faq">
            Questions people ask
          </h2>
          <div className="mt-6 divide-y divide-border border-y border-border">
            {FAQ.map(f => (
              <details className="group py-4" key={f.q}>
                <summary className="cursor-pointer list-none font-semibold text-foreground marker:hidden group-open:text-gold">
                  {f.q}
                </summary>
                <p className="text-base text-fg-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="mt-16 border-t border-border pt-6 text-base text-fg-2">
          You make the calls; run the profit maths yourself. Nothing here is financial advice and nothing on this site
          promises returns. Questions: ask in #mining-general on the Qubic Discord. See also{' '}
          <Link className="text-gold underline underline-offset-4" href="/monitoring">
            the network monitor
          </Link>{' '}
          and{' '}
          <Link className="text-gold underline underline-offset-4" href="/books/qubic-the-long-version/08-murdochs-gas-in-action-upow">
            the book chapter on UPoW
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
