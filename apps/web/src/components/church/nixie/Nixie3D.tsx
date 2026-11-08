'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { NixieRow } from '../Nixie'

const Scene = dynamic(() => import('./NixieScene'), { ssr: false })

function canRun3D() {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2'))
  } catch {
    return false
  }
}

/**
 * Nixie tubes: the 3D glass when the device can draw it, the flat SVG tubes otherwise (and until the 3D loads).
 * `label` is what screen readers hear.
 */
export function Nixie3D({ text, h, label }: { text: string; h: number; label?: string }) {
  const [three, setThree] = useState(false)
  useEffect(() => setThree(canRun3D()), [])
  return (
    <span aria-label={label ?? text} role="img" style={{ display: 'inline-block', lineHeight: 0 }}>
      {three ? <Scene h={h} text={text} /> : <NixieRow h={h} text={text} />}
    </span>
  )
}
