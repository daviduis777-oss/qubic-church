import { ChevronDown, LifeBuoy, Percent, Stamp, Wallet } from 'lucide-react'
import { JOIN, MARIA } from '@/lib/pool/qc'
import { ReportLink } from './ReportLink'
import { DECENTRAL, MACHINE } from '@/lib/pool/why'
import p from './pool.module.css'

/*
 * Aigarth Pool, top of the page: Come-from-Beyond's words once, the reason to join, and Maria.
 * Server components; every word lives in lib/pool/qc.ts and lib/pool/why.ts so tests can hold it verbatim.
 */

/** 676 dots, one per computor, as a faint field behind the quote. Static and decorative. */
function DotField() {
  const N = 676
  const g = Math.PI * (3 - Math.sqrt(5))
  const dots = Array.from({ length: N }, (_, i) => {
    const r = Math.sqrt((i + 0.5) / N) * 470
    const a = i * g
    return [500 + Math.cos(a) * r, 500 + Math.sin(a) * r, 0.6 + (i / N) * 0.7] as const
  })
  return (
    <svg aria-hidden className={p.field} viewBox="0 0 1000 1000">
      <defs>
        <radialGradient id="qcpFade">
          <stop offset="0.25" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="qcpMask">
          <rect fill="url(#qcpFade)" height="1000" width="1000" />
        </mask>
      </defs>
      <g fill="#FECE34" mask="url(#qcpMask)">
        {dots.map(([x, y, r]) => (
          <circle cx={x.toFixed(1)} cy={y.toFixed(1)} key={`${x.toFixed(1)}-${y.toFixed(1)}`} r={r.toFixed(2)} />
        ))}
      </g>
    </svg>
  )
}

/** (a) One quote, verbatim, signed and dated. Nothing above it. */
export function Hero({ preview }: { preview: boolean }) {
  return (
    <section aria-label={`${MACHINE.who} on miners`} className={p.hero}>
      <DotField />
      <figure className={p.heroFig}>
        <blockquote className={p.heroQ}>
          <p>
            <span aria-hidden className={p.qOpen}>
              “
            </span>
            {MACHINE.text}
            <span aria-hidden className={p.qClose}>
              ”
            </span>
          </p>
        </blockquote>
        <figcaption className={p.heroSign}>
          <span aria-hidden className={p.heroRule} />
          <cite className={p.heroName}>{MACHINE.who}</cite>
          <span className={p.heroMeta}>
            {MACHINE.where}, <time dateTime={MACHINE.iso}>{MACHINE.date}</time>
          </span>
        </figcaption>
      </figure>
      {preview && (
        <p className={p.pill} role="note">
          <span aria-hidden className={p.pillDot} />
          Private preview
        </p>
      )}
      <a className={p.cue} href="#join">
        Join the pool
        <ChevronDown aria-hidden size={16} strokeWidth={2} />
      </a>
    </section>
  )
}

const PROOF_ICON = { wallet: Wallet, record: Stamp, coach: LifeBuoy, fee: Percent } as const

/** (b) Why join: our aim, then four short proof lines. Beside it, the census that makes the aim concrete. */
export function Join() {
  const c = DECENTRAL.count
  return (
    <section aria-labelledby="join-h" className={p.join} id="join">
      <div className={p.joinText}>
        <p className={p.stageLine}>
          <span className={p.stageTag}>{JOIN.stage.label}</span>
          {JOIN.stage.line}
        </p>
        <h1 className={p.joinTitle} id="join-h">
          {JOIN.title}
        </h1>
        <p className={p.joinAim}>{JOIN.aim}</p>
        <p className={p.joinEase}>{JOIN.ease}</p>
        <ul className={p.proofs}>
          {JOIN.proofs.map(x => {
            const Icon = PROOF_ICON[x.id]
            return (
              <li key={x.id}>
                <Icon aria-hidden className={p.proofIcon} size={18} strokeWidth={1.7} />
                {x.text}
              </li>
            )
          })}
        </ul>
      </div>
      <figure className={p.census}>
        <p className={p.censusTitle}>{DECENTRAL.title}</p>
        <div className={p.censusNums}>
          <div>
            <span className={p.censusN}>{c.public}</span>
            <span className={p.censusL}>public</span>
          </div>
          <span aria-hidden className={p.censusPlus}>
            +
          </span>
          <div>
            <span className={p.censusN}>{c.independent}</span>
            <span className={p.censusL}>independent</span>
          </div>
        </div>
        <p className={p.censusGone}>
          <span aria-hidden className={p.censusRing} />
          {DECENTRAL.inactive}
        </p>
        <figcaption className={p.censusCap}>
          “{c.quote}”, {c.who}, {c.where}, <time dateTime="2026-11-02">{c.date}</time>
        </figcaption>
      </figure>
    </section>
  )
}

/** (c) Maria Aigarth, beside her phone. Her NFT face in a still halo: the phone's widget carries the live one. */
export function MariaIntro() {
  return (
    <div className={p.maria}>
      <div aria-hidden className={p.mariaHalo}>
        {/* biome-ignore lint/performance/noImgElement: tiny local asset */}
        <img alt="" height={88} src="/pool/maria-256.webp" width={88} />
      </div>
      <h2 className={p.mariaH} id="maria">
        <span className={p.mariaName}>{MARIA.name}</span>
      </h2>
      <p className={p.mariaRole}>{MARIA.role}</p>
      {MARIA.body.map(t => (
        <p className={p.mariaBody} key={t}>
          {t}
        </p>
      ))}
      <p className={p.mariaHint}>{MARIA.hint}</p>
      <a className={p.reportLink} href={MARIA.x.url} rel="noopener noreferrer" target="_blank">
        {MARIA.x.label}
      </a>
      <ReportLink className={p.reportLink} />
    </div>
  )
}
