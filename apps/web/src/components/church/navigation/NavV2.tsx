'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { bppFonts } from '@/components/bpp/fonts'
import { ALL_ITEMS, NAV, type NavBadge, type NavGroup } from '@/lib/nav'
import { NO_TAB, POOL_TAB, type PoolTab, probePoolTab } from '@/lib/pool/nav'
import { usePathname } from '@/navigation'
import { SoundToggle } from '@/components/sound/SoundLayer'

/*
 * Navigation v2 (lab): four doors (Live, Read, Research, Join) instead of eleven links. Each door opens a panel of
 * cards with one line each, so every page says what it is before you click. The main feature, BPP-9000, keeps its
 * own lit chip in the bar; a live dot tells whether Qubic is running; ⌘K or / searches every page.
 */

const LIVE_CALL = Date.UTC(2026, 10, 18, 12) // epoch 240: the first live call
const E238 = Date.UTC(2026, 10, 4, 12)
const WEEK = 7 * 86_400_000
const GOLD = '#FFC46B'

function useLive() {
  const [now, setNow] = useState(() => Date.now())
  const [net, setNet] = useState<'running' | 'stalled' | 'unknown' | null>(null)
  useEffect(() => {
    let on = true
    const load = () =>
      fetch('/api/network/status')
        .then(r => r.json())
        .then(j => on && setNet(j?.ok ? j.verdict : 'unknown'))
        .catch(() => on && setNet('unknown'))
    load()
    const a = setInterval(load, 60_000)
    const b = setInterval(() => setNow(Date.now()), 30_000)
    return () => {
      on = false
      clearInterval(a)
      clearInterval(b)
    }
  }, [])
  const epoch = 238 + Math.floor((now - E238) / WEEK)
  const epochEnds = E238 + (epoch - 238 + 1) * WEEK
  const left = LIVE_CALL - now
  const d = Math.floor(left / 86_400_000)
  const h = Math.floor((left % 86_400_000) / 3_600_000)
  const countdown = left > 0 ? (d > 0 ? `${d}d ${h}h` : `${h}h`) : 'live'
  const hoursLeft = Math.max(0, Math.round((epochEnds - now) / 3_600_000))
  return { net, epoch, epochLeft: hoursLeft >= 48 ? `${Math.round(hoursLeft / 24)} days` : `${hoursLeft} h`, countdown }
}

type Live = ReturnType<typeof useLive>

const dotColor = (n: Live['net']) => (n === 'running' ? '#7CE0A3' : n === 'stalled' ? '#FF7A6B' : '#8d86a0')

function Badge({ kind, live }: { kind?: NavBadge; live: Live }) {
  if (!kind) return null
  const base: React.CSSProperties = { fontSize: 11.5, lineHeight: 1, padding: '5px 8px', borderRadius: 999, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }
  if (kind === 'status')
    return (
      <span style={{ ...base, border: '1px solid rgba(255,255,255,.14)', color: '#e9dfcf' }}>
        <i style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor(live.net), boxShadow: `0 0 8px ${dotColor(live.net)}` }} />
        {live.net === 'running' ? 'running' : live.net === 'stalled' ? 'stalled' : '…'}
      </span>
    )
  if (kind === 'countdown')
    return <span style={{ ...base, background: 'rgba(255,196,107,.14)', color: GOLD, border: '1px solid rgba(255,196,107,.45)' }}>{live.countdown === 'live' ? 'live now' : `live in ${live.countdown}`}</span>
  if (kind === 'epoch') return <span style={{ ...base, border: '1px solid rgba(255,255,255,.14)', color: '#e9dfcf' }}>E{live.epoch}</span>
  if (kind === 'private') return <span style={{ ...base, border: '1px dashed rgba(255,196,107,.6)', color: GOLD }}>only you</span>
  return <span style={{ ...base, background: 'rgba(98,120,255,.16)', color: '#b9c4ff', border: '1px solid rgba(120,140,255,.4)' }}>new</span>
}

/** A link that also works for #anchors on another page: those get a plain load so the browser scrolls to them. */
function Go({ href, className, onClick, children }: { href: string; className: string; onClick?: () => void; children: React.ReactNode }) {
  if (href.includes('#'))
    return (
      <a className={className} href={href} onClick={onClick}>
        {children}
      </a>
    )
  return (
    <Link className={className} href={href} onClick={onClick}>
      {children}
    </Link>
  )
}

/* ---------------- the panel under a door ---------------- */

function Panel({ g, live, onClose }: { g: NavGroup; live: Live; onClose: () => void }) {
  return (
    <div className="nv2-panel" role="region" aria-label={g.title}>
      <div className="nv2-wrap" style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) minmax(0, 1fr)', gap: 36, padding: '28px 32px 32px' }}>
        <div style={{ display: 'grid', alignContent: 'start', gap: 12 }}>
          <span className="nv2-lit" style={{ fontSize: 54 }}>{g.title}</span>
          <p style={{ margin: 0, color: '#b9aecf', fontSize: 14.5, lineHeight: 1.55 }}>{g.line}</p>
          {g.id === 'live' && (
            <div style={{ marginTop: 10, display: 'grid', gap: 10, borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 14 }}>
              <Now k="Qubic" v={live.net === 'running' ? 'running' : live.net === 'stalled' ? 'stalled' : '…'} dot={dotColor(live.net)} />
              <Now k={`Epoch ${live.epoch}`} v={`ends in ${live.epochLeft}`} />
              <Now k="First live call" v={live.countdown === 'live' ? 'now' : `in ${live.countdown}`} gold />
            </div>
          )}
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
          {g.items.map(it => (
            <li key={it.href}>
              <Go className="nv2-card" href={it.href} onClick={onClose}>
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <b style={{ fontSize: 15.5, fontWeight: 600, color: '#f3e4ce' }}>{it.name}</b>
                  <Badge kind={it.badge} live={live} />
                </span>
                <span style={{ fontSize: 13.5, lineHeight: 1.5, color: '#a89fb8' }}>{it.desc}</span>
              </Go>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Now({ k, v, dot, gold }: { k: string; v: string; dot?: string; gold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5 }}>
      <span style={{ color: '#a89fb8', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {dot && <i style={{ width: 7, height: 7, borderRadius: '50%', background: dot, boxShadow: `0 0 8px ${dot}` }} />}
        {k}
      </span>
      <span style={{ color: gold ? GOLD : '#f3e4ce' }}>{v}</span>
    </div>
  )
}

/* ---------------- search everything: ⌘K or / ---------------- */

function Search({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return ALL_ITEMS
    return ALL_ITEMS.filter(x => `${x.name} ${x.desc} ${x.keys ?? ''} ${x.group}`.toLowerCase().includes(t))
  }, [q])
  useEffect(() => {
    if (open) {
      setQ('')
      setI(0)
      setTimeout(() => input.current?.focus(), 10)
    }
  }, [open])
  useEffect(() => setI(0), [q])
  if (!open) return null
  const go = (href: string) => {
    onClose()
    window.location.href = href
  }
  return (
    <div aria-label="Search the site" aria-modal className="nv2-scrim" onClick={onClose} role="dialog">
      <div className="nv2-search" onClick={e => e.stopPropagation()}>
        <input
          aria-label="Search pages"
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setI(v => Math.min(v + 1, hits.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setI(v => Math.max(v - 1, 0))
            } else if (e.key === 'Enter' && hits[i]) go(hits[i].href)
            else if (e.key === 'Escape') onClose()
          }}
          placeholder="Where to? Brains, books, status, Maria…"
          ref={input}
          value={q}
        />
        <ul role="listbox" style={{ listStyle: 'none', margin: 0, padding: 6, maxHeight: 'min(60vh, 460px)', overflowY: 'auto' }}>
          {hits.map((x, k) => (
            <li aria-selected={k === i} key={x.href} onClick={() => go(x.href)} onMouseEnter={() => setI(k)} role="option" style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: k === i ? 'rgba(255,196,107,.1)' : 'transparent', display: 'grid', gap: 2 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <b style={{ color: k === i ? GOLD : '#f3e4ce', fontWeight: 600, fontSize: 15 }}>{x.name}</b>
                <span style={{ color: '#8d86a0', fontSize: 12.5 }}>{x.group}</span>
              </span>
              <span style={{ color: '#a89fb8', fontSize: 13 }}>{x.desc}</span>
            </li>
          ))}
          {hits.length === 0 && <li style={{ padding: 14, color: '#a89fb8' }}>Nothing by that name. Try “brain”, “book” or “status”.</li>}
        </ul>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', padding: '8px 14px', fontSize: 12, color: '#8d86a0' }}>↑ ↓ to move · Enter to open · Esc to close</div>
      </div>
    </div>
  )
}

/* ---------------- the bar ---------------- */

export function NavV2() {
  const pathname = usePathname()
  const live = useLive()
  const [door, setDoor] = useState<NavGroup['id'] | null>(null)
  const [sheet, setSheet] = useState(false)
  const [search, setSearch] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The hidden QC Pool: asked once per page load; shown in Join only after the gate says yes.
  const [pool, setPool] = useState<PoolTab>(NO_TAB)
  useEffect(() => {
    let on = true
    probePoolTab().then(t => on && setPool(t))
    return () => {
      on = false
    }
  }, [])
  const doors = useMemo(
    () =>
      pool.show
        ? NAV.map(x =>
            x.id === 'join'
              ? { ...x, items: [{ href: POOL_TAB.href, name: POOL_TAB.label, desc: pool.preview ? 'Private preview. Hidden from everyone else until you open it.' : 'Mine with Qubic Church.', badge: pool.preview ? ('private' as const) : undefined }, ...x.items] }
              : x,
          )
        : NAV,
    [pool],
  )

  useEffect(() => {
    setDoor(null)
    setSheet(false)
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setSearch(true)
      } else if (e.key === 'Escape') {
        setDoor(null)
        setSheet(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const hoverOpen = useCallback((id: NavGroup['id']) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setDoor(id), 90)
  }, [])
  const hoverClose = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setDoor(null), 180)
  }, [])

  const inGroup = (g: NavGroup) => g.items.some(it => pathname === it.href || pathname.startsWith(`${it.href}/`))
  const g = doors.find(x => x.id === door) ?? null
  // On the forum's blue bar the gold reads too loud: the bar turns the forum's blue there, as before.
  const crypt = pathname === '/articles' || pathname.startsWith('/articles/')

  return (
    <>
      <style>{CSS}</style>
      <header className={`nv2 ${bppFonts}${crypt ? ' nv2-crypt' : ''}`} onMouseLeave={hoverClose}>
        <div className="nv2-wrap nv2-bar">
          <Link aria-label="Home: Qubic Church" className="nv2-home" href="/">
            Qubic Church
          </Link>

          <nav aria-label="Primary" className="nv2-doors">
            {doors.map(x => (
              <button
                aria-expanded={door === x.id}
                className={`nv2-door${door === x.id ? ' is-open' : ''}${inGroup(x) ? ' is-here' : ''}`}
                key={x.id}
                onClick={() => setDoor(d => (d === x.id ? null : x.id))}
                onMouseEnter={() => hoverOpen(x.id)}
                type="button"
              >
                {x.id === 'live' && <i aria-hidden className="nv2-dot" style={{ background: dotColor(live.net), boxShadow: `0 0 8px ${dotColor(live.net)}` }} />}
                {x.label}
                <svg aria-hidden fill="none" height="12" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="12">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            ))}
          </nav>

          <div className="nv2-right">
            <Link className="nv2-chip" href="/bpp9000" title="BPP-9000: the first live call">
              <i aria-hidden className="nv2-dot" style={{ background: GOLD, boxShadow: `0 0 8px ${GOLD}` }} />
              BPP-9000
              <span className="nv2-chip-n">{live.countdown === 'live' ? 'live' : live.countdown}</span>
            </Link>
            <SoundToggle className="nv2-icon nv2-sound" />
            <button aria-label="Search the site" className="nv2-search-btn" data-sound="open" onClick={() => setSearch(true)} type="button">
              <svg aria-hidden fill="none" height="15" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="15">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <span className="nv2-hide-md">Search</span>
              <kbd className="nv2-hide-md">⌘K</kbd>
            </button>
            <Link aria-label="Account: one key, no personal data" className="nv2-icon nv2-hide-md" href="/account" title="Account: one key for the Crypt and BPP-9000">
              <svg aria-hidden fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
                <circle cx="7.5" cy="15.5" r="4.5" />
                <path d="M10.7 12.3L20 3M16 7l3 3M14 9l2 2" />
              </svg>
            </Link>
            <Link className="nv2-donate nv2-hide-md" href="/donate">
              Donate
            </Link>
            <button aria-expanded={sheet} className="nv2-menu" onClick={() => setSheet(v => !v)} type="button">
              {sheet ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>

        {g && (
          <div onMouseEnter={() => timer.current && clearTimeout(timer.current)}>
            <Panel g={g} live={live} onClose={() => setDoor(null)} />
          </div>
        )}

        {sheet && (
          <div className="nv2-sheet">
            <button className="nv2-sheet-search" onClick={() => setSearch(true)} type="button">
              Search every page…
            </button>
            <div className="nv2-strip">
              <Now dot={dotColor(live.net)} k="Qubic" v={live.net === 'running' ? 'running' : live.net === 'stalled' ? 'stalled' : '…'} />
              <Now k={`Epoch ${live.epoch}`} v={`ends in ${live.epochLeft}`} />
              <Now gold k="First live call" v={live.countdown === 'live' ? 'now' : `in ${live.countdown}`} />
            </div>
            {doors.map(x => (
              <section key={x.id} style={{ display: 'grid', gap: 6 }}>
                <span className="nv2-lit" style={{ fontSize: 34 }}>{x.title}</span>
                {x.items.map(it => (
                  <Go className="nv2-row" href={it.href} key={it.href} onClick={() => setSheet(false)}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <b style={{ color: '#f3e4ce', fontWeight: 600 }}>{it.name}</b>
                      <Badge kind={it.badge} live={live} />
                    </span>
                    <span style={{ color: '#a89fb8', fontSize: 13.5 }}>{it.desc}</span>
                  </Go>
                ))}
              </section>
            ))}
            <div style={{ display: 'flex', gap: 10 }}>
              <Link className="nv2-donate" href="/account" onClick={() => setSheet(false)} style={{ borderColor: 'rgba(255,255,255,.2)', color: '#e9dfcf' }}>
                Account
              </Link>
              <Link className="nv2-donate" href="/donate" onClick={() => setSheet(false)}>
                Donate
              </Link>
            </div>
          </div>
        )}
      </header>
      <div aria-hidden style={{ height: 60 }} />
      <Search onClose={() => setSearch(false)} open={search} />
    </>
  )
}

const CSS = `
.nv2 { position: fixed; inset: 0 0 auto 0; z-index: 60; background: rgba(6,5,10,.82); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid rgba(255,255,255,.07); }
.nv2-wrap { max-width: 1280px; margin: 0 auto; }
.nv2-crypt { background: #2f4a63; border-bottom-color: #2f4a63; }
.nv2-crypt .nv2-home, .nv2-crypt .nv2-donate { color: #fff; border-color: rgba(255,255,255,.5); }
.nv2-bar { height: 60px; display: flex; align-items: center; gap: 18px; padding: 0 20px; }
.nv2-home { font: 600 14px/1 var(--font-sans, system-ui); letter-spacing: .32em; text-transform: uppercase; color: ${GOLD}; text-decoration: none; white-space: nowrap; }
.nv2-doors { display: flex; gap: 4px; margin-left: 12px; }
.nv2-door { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid transparent; background: none; color: #cfc6dc; font-size: 15px; font-weight: 500; cursor: pointer; }
.nv2-door:hover, .nv2-door.is-open { color: #fff; background: rgba(255,255,255,.06); }
.nv2-door.is-here { color: #fff; border-color: rgba(255,196,107,.35); }
.nv2-door svg { opacity: .6; transition: transform .2s; }
.nv2-door.is-open svg { transform: rotate(180deg); }
.nv2-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; }
.nv2-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.nv2-chip { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 14px; border-radius: 999px; text-decoration: none; color: #FFE3B0; font-weight: 600; font-size: 14px; background: linear-gradient(180deg, rgba(255,196,107,.16), rgba(232,145,46,.08)); border: 1px solid rgba(255,196,107,.5); box-shadow: 0 0 22px -6px rgba(255,170,70,.55); }
.nv2-chip-n { font-family: var(--bpp-nx, inherit), sans-serif; font-weight: 400; font-size: 16px; color: ${GOLD}; text-shadow: 0 0 10px rgba(255,196,107,.6); }
.nv2-search-btn { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.03); color: #cfc6dc; cursor: pointer; font-size: 14px; }
.nv2-search-btn kbd { font: 11px/1 ui-monospace, monospace; padding: 3px 5px; border: 1px solid rgba(255,255,255,.18); border-radius: 5px; color: #a89fb8; }
.nv2-icon { width: 38px; height: 38px; display: inline-grid; place-items: center; border-radius: 10px; border: 1px solid rgba(255,255,255,.12); color: #cfc6dc; }
.nv2-icon:hover { color: #fff; border-color: rgba(255,255,255,.3); }
.nv2-sound { background: none; cursor: pointer; padding: 0; }
.nv2-sound[aria-pressed="true"] { color: #FFE3B0; border-color: rgba(255,196,107,.35); }
.nv2-sound:focus-visible { outline: 2px solid #FFE3B0; outline-offset: 2px; }
.nv2-donate { height: 38px; display: inline-flex; align-items: center; padding: 0 14px; border: 1px solid rgba(255,196,107,.5); color: ${GOLD}; text-decoration: none; font-size: 14px; font-weight: 500; }
.nv2-menu { display: none; height: 38px; padding: 0 12px; background: none; border: 1px solid rgba(255,255,255,.14); border-radius: 10px; color: #e9dfcf; font-size: 14px; cursor: pointer; }
.nv2-panel { border-top: 1px solid rgba(255,255,255,.06); background: linear-gradient(180deg, #0b0a11, #08070d); box-shadow: 0 30px 60px -20px rgba(0,0,0,.8); animation: nv2-in .16s ease-out; }
.nv2-lit { font-family: var(--bpp-nx, inherit), sans-serif; font-weight: 300; line-height: .9; color: #FFE3B0; text-shadow: 0 0 4px #ffd08a, 0 0 14px ${GOLD}, 0 0 40px rgba(232,145,46,.55); }
.nv2-card { display: grid; gap: 6px; height: 100%; padding: 14px 16px; border-radius: 14px; text-decoration: none; border: 1px solid rgba(255,255,255,.07); background: rgba(255,255,255,.025); transition: border-color .15s, background .15s; }
.nv2-card:hover, .nv2-card:focus-visible { border-color: rgba(255,196,107,.45); background: rgba(255,196,107,.05); outline: none; }
.nv2-scrim { position: fixed; inset: 0; z-index: 80; background: rgba(0,0,0,.55); backdrop-filter: blur(4px); display: grid; place-items: start center; padding: 12vh 16px 16px; }
.nv2-search { width: min(640px, 100%); border-radius: 16px; background: #0d0b14; border: 1px solid rgba(255,196,107,.3); box-shadow: 0 0 60px -10px rgba(255,170,70,.35), 0 30px 80px rgba(0,0,0,.7); overflow: hidden; }
.nv2-search input { width: 100%; height: 56px; padding: 0 18px; background: transparent; border: 0; border-bottom: 1px solid rgba(255,255,255,.08); color: #f3e4ce; font-size: 17px; outline: none; }
.nv2-sheet { display: none; }
.nv2-strip { display: grid; gap: 8px; padding: 12px 14px; border: 1px solid rgba(255,255,255,.08); border-radius: 12px; }
.nv2-row { display: grid; gap: 3px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.06); text-decoration: none; }
.nv2-sheet-search { height: 46px; border-radius: 12px; border: 1px solid rgba(255,196,107,.35); background: rgba(255,196,107,.05); color: #e9dfcf; text-align: left; padding: 0 14px; font-size: 15px; }
@keyframes nv2-in { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: none } }
@media (max-width: 1000px) {
  .nv2-doors, .nv2-hide-md { display: none; }
  .nv2-menu { display: inline-flex; align-items: center; }
  .nv2-panel { display: none; }
  .nv2-bar { padding: 0 14px; gap: 10px; }
  .nv2-home { font-size: 12px; letter-spacing: .24em; }
  .nv2-sheet { display: grid; gap: 22px; background: #08070d; max-height: calc(100dvh - 60px); overflow-y: auto; padding: 16px 16px 28px; border-top: 1px solid rgba(255,255,255,.07); }
}
@media (max-width: 420px) { .nv2-chip { padding: 0 10px; font-size: 0; gap: 6px } .nv2-chip-n { font-size: 16px } }
@media (prefers-reduced-motion: reduce) { .nv2-panel { animation: none } }
`
