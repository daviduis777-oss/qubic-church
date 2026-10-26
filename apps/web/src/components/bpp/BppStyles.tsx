/** BPP-9000 in Aigarth's official "vacuum tubes" colours: warm filament amber on near-black. */
export function BppStyles() {
  return (
    <style>{`
.bpp { --bg:#0B0A0E; --amber:#E8912E; --fil:#FFC46B; --hot:#FFE3B0; --g:#FFC46B; --r:#d9776a; --c:#ecdfcb; --gold:#FFC46B;
  --ink:#ecdfcb; --dim:#93857a; --line:rgba(255,200,140,.14); --panel:rgba(255,205,110,.03);
  color: var(--ink); background: var(--bg); font-family: var(--bpp-sans), system-ui, sans-serif; }
.bpp .nx { font-family: var(--bpp-nx), sans-serif; font-variant-numeric: tabular-nums; }
.bpp .eng { font-family: var(--bpp-eng), sans-serif; letter-spacing: .12em; }
.bpp .lit { color: var(--hot); text-shadow: 0 0 4px #ffd08a, 0 0 14px var(--fil), 0 0 40px rgba(232,145,46,.7), 0 0 90px rgba(232,145,46,.35); }
.bpp .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 18px; }
.bpp .label { font-size: 13px; font-weight: 600; color: var(--ink); }
.bpp .mute { color: var(--dim); }
.bpp .big { font-variant-numeric: tabular-nums; }
.bpp .glow-g { color: var(--fil); text-shadow: 0 0 16px rgba(232,145,46,.5); }
.bpp .glow-r { color: var(--r); }
.bpp .glow-c { color: var(--ink); }
.bpp .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height: 44px; padding: 10px 18px; border-radius: 999px; border: 1px solid rgba(255,200,140,.3); background: transparent; color: var(--ink); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; transition: background .15s, border-color .15s; }
.bpp .btn:hover { background: rgba(255,200,140,.08); border-color: rgba(255,200,140,.55); }
.bpp .btn-main { background: var(--fil); color: #2a1404; border-color: var(--fil); box-shadow: 0 0 18px rgba(232,145,46,.45); }
.bpp .btn-main:hover { background: var(--hot); }
.bpp .btn:focus-visible { outline: 2px solid var(--hot); outline-offset: 3px; }
.bpp input, .bpp select, .bpp textarea { background: rgba(0,0,0,.35); border: 1px solid var(--line); border-radius: 10px; color: var(--ink); font: inherit; font-size: 14px; padding: 9px 11px; width: 100%; box-sizing: border-box; }
.bpp input:focus, .bpp select:focus, .bpp textarea:focus { outline: none; border-color: rgba(255,200,140,.6); }
.bpp table { width: 100%; border-collapse: collapse; font-size: 13px; }
.bpp th { text-align: left; font-weight: 500; color: var(--dim); padding: 6px 8px; border-bottom: 1px solid var(--line); font-size: 12px; }
.bpp td { padding: 7px 8px; border-bottom: 1px solid rgba(255,200,140,.07); font-variant-numeric: tabular-nums; }
.bpp .lamps { display: grid; grid-template-columns: repeat(24, minmax(0,1fr)); gap: 4px; }
.bpp .lamps i { height: 34px; border-radius: 10px 10px 4px 4px; display: grid; place-items: center; font-style: normal; font-size: 12px; font-weight: 700; }
.bpp .lamps i.hit { background: radial-gradient(circle at 50% 65%, rgba(255,227,176,.95), rgba(232,145,46,.75) 45%, rgba(232,145,46,.15)); color: #3a1a04; box-shadow: 0 0 12px rgba(232,145,46,.45); }
.bpp .lamps i.miss { background: rgba(255,255,255,.035); box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); color: #6a5f66; }
.bpp .lamps i.off { background: rgba(255,255,255,.02); }
@media (max-width: 640px) { .bpp .bpp-hide-sm { display: none !important } .bpp .lamps { gap: 2px } .bpp .lamps i { height: 26px; font-size: 9px; border-radius: 7px 7px 3px 3px } }
@keyframes bpp-dot { 50% { opacity: .45 } }
.bpp .pilot { display:inline-block; width:8px; height:8px; border-radius:50%; background: var(--fil); box-shadow: 0 0 8px var(--fil), 0 0 18px var(--amber); animation: bpp-dot 2.4s ease-in-out infinite; }
.bpp .live-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:#7CFFA0; box-shadow:0 0 8px #7CFFA0; }
@media (prefers-reduced-motion: reduce) { .bpp .pilot { animation: none } }
`}</style>
  )
}
