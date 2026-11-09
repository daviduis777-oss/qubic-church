'use client'

import { useEffect, useRef, useState } from 'react'

/** The brain of the pool: a mosaic of the Anna Matrix among the stars of its miners. */
export function Brain() {
  const el = useRef<HTMLDivElement>(null)
  const api = useRef<{ connect: (on: boolean) => void; dispose: () => void } | null>(null)
  const [on, setOn] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let dead = false
    ;(async () => {
      try {
        const [{ mountBrain }, m] = await Promise.all([import('./scene'), fetch('/data/anna-matrix-min.json').then(r => r.json())])
        if (dead || !el.current) return
        api.current = mountBrain(el.current, { matrix: m.matrix })
      } catch {
        setFailed(true)
      }
    })()
    return () => {
      dead = true
      api.current?.dispose()
    }
  }, [])

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', background: '#020204', zIndex: 20 }}>
      <div ref={el} style={{ position: 'absolute', inset: 0 }} />
      {failed ? <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#93857a' }}>This page needs WebGL.</div> : null}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 'max(28px, env(safe-area-inset-bottom))', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
        <button
          type="button"
          onClick={() => {
            const next = !on
            setOn(next)
            api.current?.connect(next)
          }}
          style={{
            pointerEvents: 'auto',
            font: 'inherit',
            fontSize: 16,
            fontWeight: 600,
            padding: '14px 28px',
            borderRadius: 999,
            border: '1px solid rgba(185,166,255,.55)',
            background: on ? 'rgba(124,72,255,.35)' : 'rgba(11,10,14,.7)',
            color: '#ecdfcb',
            cursor: 'pointer',
            boxShadow: on ? '0 0 30px rgba(124,72,255,.6)' : 'none',
          }}
        >
          {on ? 'Connected: you are feeding the brain' : 'Connect'}
        </button>
      </div>
    </div>
  )
}
