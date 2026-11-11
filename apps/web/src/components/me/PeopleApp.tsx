'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { bppFonts } from '@/components/bpp/fonts'
import { Identicon } from '@/components/church/forum/Avatar'
import { MEDALS, type MedalId } from '@/lib/me/medals'
import type { Person } from '@/lib/me/me'
import { MedalCoin } from './Medal'

const css = `
.pp{min-height:100svh;background:#08080a;color:#ece6da;font-family:var(--bpp-sans),system-ui,sans-serif;padding:96px 16px 80px}
.pp-in{max-width:1080px;margin:0 auto;display:grid;gap:22px}
.pp-h{font-family:var(--bpp-nx),sans-serif;font-size:clamp(40px,6vw,64px);line-height:.95;color:#fff3dc;margin:0}
.pp-sub{color:#a39a8c;font-size:15px;max-width:62ch;line-height:1.6;margin:8px 0 0}
.pp-f{display:flex;gap:8px;flex-wrap:wrap}
.pp-f button{background:#121014;border:1px solid #2c2620;color:#cfc6b8;border-radius:999px;padding:6px 14px;font:inherit;font-size:13.5px;cursor:pointer}
.pp-f button.on{background:#ffc46b;color:#1a1408;border-color:#ffc46b;font-weight:600}
.pp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.pp-c{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;padding:14px;border:1px solid #29241f;border-radius:14px;background:#0f0d10;color:inherit;text-decoration:none}
.pp-c:hover{border-color:rgba(255,196,107,.5)}
.pp-a{width:56px;height:56px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:#15120f}
.pp-a.founder{box-shadow:0 0 0 2px #ffc46b,0 0 14px rgba(255,196,107,.4)}
.pp-a img{width:100%;height:100%;object-fit:cover}
.pp-c b{font-size:15.5px;color:#fff3dc}
.pp-c small{display:block;font-size:12.5px;color:#a39a8c;margin-top:2px}
.pp-m{display:flex;gap:2px;margin-top:6px}
`

type Filter = 'all' | MedalId

export function PeopleApp() {
  const [list, setList] = useState<Person[] | null>(null)
  const [f, setF] = useState<Filter>('all')
  useEffect(() => {
    fetch('/api/me/people', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => setList(j.people ?? []))
      .catch(() => setList([]))
  }, [])
  const shown = useMemo(() => (list ?? []).filter(p => f === 'all' || p.medals.includes(f)), [list, f])
  const count = (id: MedalId) => (list ?? []).filter(p => p.medals.includes(id)).length
  return (
    <main className={`pp ${bppFonts}`}>
      <style>{css}</style>
      <div className="pp-in">
        <div>
          <Link href="/me" style={{ color: '#ffe3b0', fontSize: 14 }}>
            ← My cabinet
          </Link>
          <h1 className="pp-h" style={{ marginTop: 14 }}>
            People of Qubic Church
          </h1>
          <p className="pp-sub">
            Everyone with a key: miners, writers, founders. Ordered by useful solutions, then by medals. {list ? `${list.length} people.` : ''} Hidden page: only you see it while it is built.
          </p>
        </div>
        <div className="pp-f">
          <button className={f === 'all' ? 'on' : ''} onClick={() => setF('all')} type="button">
            Everyone
          </button>
          {MEDALS.filter(m => !m.opens).map(m => (
            <button className={f === m.id ? 'on' : ''} key={m.id} onClick={() => setF(m.id)} type="button">
              {m.name} · {count(m.id)}
            </button>
          ))}
        </div>
        {list === null ? (
          <p style={{ color: '#a39a8c' }}>Loading…</p>
        ) : (
          <div className="pp-grid">
            {shown.map(p => {
              const anna = p.annas.slice().sort((a, b) => a.rank - b.rank)[0]
              const pic = anna?.image ?? p.avatar
              return (
                <Link className="pp-c" href={`/me?as=${encodeURIComponent(p.handle)}`} key={p.handle}>
                  <div className={`pp-a${anna ? ' founder' : ''}`}>{pic ? <img alt="" src={pic} /> : <Identicon seed={p.id ?? p.handle} size={44} />}</div>
                  <div>
                    <b>{p.name}</b>
                    <small>
                      {p.stage.name} · {p.solutions.total} solutions{p.solutions.preview ? ' (preview)' : ''}
                    </small>
                    <div className="pp-m">
                      {MEDALS.filter(m => p.medals.includes(m.id)).map(m => (
                        <span key={m.id} title={m.name}>
                          <MedalCoin earned medal={m} size={22} />
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
