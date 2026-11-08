'use client'

import { useEffect, useState } from 'react'
import { Nixie3D } from '@/components/church/nixie/Nixie3D'

const HOME_TARGET = Date.UTC(2027, 3, 13, 0, 0, 0)
const pad = (n: number) => String(n).padStart(2, '0')

function split(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
}

const label: React.CSSProperties = { marginTop: 10, fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#b9aecf' }
const title: React.CSSProperties = { fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#FFC46B', marginBottom: 18 }

/** The two real timers, ticking, with the 3D tubes in place of the flat ones. */
export function Preview({ liveAt }: { liveAt: string }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const home = split(now == null ? 0 : HOME_TARGET - now)
  const bpp = split(now == null ? 0 : Date.parse(liveAt) - now)
  const cells: [string, string][] = [
    [String(home.d), 'days'],
    [pad(home.h), 'hours'],
    [pad(home.m), 'min'],
    [pad(home.s), 'sec'],
  ]
  return (
    <>
      <section>
        <div style={title}>Home page timer: 13 April 2027</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 22 }}>
          {cells.map(([v, l]) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Nixie3D h={110} label={`${v} ${l}`} text={v} />
              <span style={label}>{l}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div style={title}>BPP-9000: the first live call in</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 26 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <Nixie3D h={200} label={`${bpp.d} days`} text={pad(bpp.d)} />
            <span style={{ ...label, fontSize: 22, letterSpacing: '0.1em', textTransform: 'none', color: '#FFC46B', marginBottom: 12 }}>days</span>
          </div>
          <Nixie3D h={100} label="hours, minutes, seconds" text={`${pad(bpp.h)}:${pad(bpp.m)}:${pad(bpp.s)}`} />
        </div>
      </section>

      <section>
        <div style={title}>One tube, close up</div>
        <Nixie3D h={480} text={String(home.s % 10)} />
      </section>
    </>
  )
}
