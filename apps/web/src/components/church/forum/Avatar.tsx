'use client'

import { useState } from 'react'
import { identicon } from '@/lib/forum/identicon'

/** Pixel identicon from the Qubic ID or tripcode. Deterministic, nothing uploaded, nothing stored. */
export function Identicon({ seed, size }: { seed: string; size: number }) {
  const { cells, color } = identicon(seed)
  return (
    <svg aria-hidden height={size} shapeRendering="crispEdges" style={{ display: 'block', border: '1px solid #8a8a8a', background: '#f4f4f6' }} viewBox="0 0 7 7" width={size}>
      {cells.map((on, i) => on && <rect fill={color} height={1} key={i} width={1} x={1 + (i % 5)} y={1 + Math.floor(i / 5)} />)}
    </svg>
  )
}

/** The X profile picture when there is one; the identicon otherwise, or when the picture fails to load. */
export function Avatar({ pic, seed, size = 64 }: { pic?: string; seed: string; size?: number }) {
  const [broken, setBroken] = useState(false)
  if (!pic || broken) return <Identicon seed={seed} size={size} />
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt="" height={size} onError={() => setBroken(true)} src={pic} style={{ display: 'block', border: '1px solid #8a8a8a', background: '#fff', objectFit: 'cover' }} width={size} />
}
