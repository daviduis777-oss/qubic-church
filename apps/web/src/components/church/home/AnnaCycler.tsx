'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { NFT_RANK } from '@/config/nft-rarity'

/**
 * Hero Anna: starts with Anna holding the Earth, then glitches through
 * all 200 Annas of the collection in order (#001 → #200), and loops.
 * The first frame is server-rendered, so the page is complete without JS.
 */
const TOTAL = 200
const HOLD_MS = 2600
const GLITCH_MS = 320

const pad = (n: number) => String(n).padStart(3, '0')
const srcOf = (i: number) => (i === 0 ? '/images/anna/anna-transparent.webp' : `/images/nfts/anna-${pad(i)}.webp`)

export function AnnaCycler() {
  const [i, setI] = useState(0) // 0 = Anna with the Earth, 1..200 = collection
  const [glitch, setGlitch] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const step = () => {
      setGlitch(true)
      timer.current = setTimeout(() => {
        setI(prev => (prev + 1) % (TOTAL + 1))
        setGlitch(false)
        timer.current = setTimeout(step, HOLD_MS)
      }, GLITCH_MS)
    }
    timer.current = setTimeout(step, HOLD_MS + 1500)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  // warm the next image so the switch lands on a loaded frame
  useEffect(() => {
    const next = new window.Image()
    next.src = srcOf((i + 1) % (TOTAL + 1))
  }, [i])

  const rank = i ? NFT_RANK[i]?.[0] : null

  return (
    <figure className="relative mx-auto w-full max-w-[420px] lg:mx-0 lg:max-w-[460px] lg:justify-self-end">
      <div className={`relative aspect-[911/1408] w-full ${glitch ? 'qc-glitch' : ''}`}>
        <Image
          alt={i ? `Anna #${pad(i)} from the Anna Aigarth collection` : 'Anna Aigarth holding a small Earth inside a golden spiral'}
          className={
            i
              ? 'object-contain object-bottom [mask-image:radial-gradient(ellipse_72%_48%_at_50%_68%,black_62%,transparent_100%)]'
              : 'object-contain object-bottom [mask-image:linear-gradient(to_bottom,black_86%,transparent)]'
          }
          fill
          priority
          sizes="(min-width: 768px) 460px, 90vw"
          src={srcOf(i)}
          unoptimized={i !== 0}
        />
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 text-xs">
        <span className="font-mono uppercase tracking-[0.3em] text-fg-2 tabular-nums" aria-live="off">
          {i ? `Anna #${pad(i)} · rank ${rank}` : 'Anna Aigarth'}
        </span>
        <Link className="font-mono uppercase tracking-[0.3em] text-gold hover:underline" href="/nfts">
          The collection →
        </Link>
      </figcaption>
    </figure>
  )
}
