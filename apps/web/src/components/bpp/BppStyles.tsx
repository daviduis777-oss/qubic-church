/** The BPP-9000 terminal look: dark glass, mono type, neon green/red, one gold accent. */
export function BppStyles() {
  return (
    <style>{`
.bpp { --g:#3dff9a; --r:#ff4d6d; --c:#5ee7ff; --gold:#ffd24a; --ink:#e8f1ff; --dim:#8a97ad; --line:rgba(94,231,255,.16); --panel:rgba(8,14,28,.78);
  color: var(--ink); font-family: ui-monospace, 'JetBrains Mono', 'SFMono-Regular', Menlo, monospace; }
.bpp .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; backdrop-filter: blur(8px); }
.bpp .label { font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: var(--dim); }
.bpp .big { font-variant-numeric: tabular-nums; }
.bpp .glow-g { color: var(--g); text-shadow: 0 0 18px rgba(61,255,154,.55); }
.bpp .glow-r { color: var(--r); text-shadow: 0 0 18px rgba(255,77,109,.55); }
.bpp .glow-c { color: var(--c); text-shadow: 0 0 18px rgba(94,231,255,.5); }
.bpp .btn { display:inline-flex; align-items:center; gap:8px; padding: 10px 16px; border-radius: 10px; border: 1px solid var(--line); background: rgba(94,231,255,.06); color: var(--ink); font: inherit; font-size: 13px; cursor: pointer; transition: background .15s, border-color .15s; }
.bpp .btn:hover { background: rgba(94,231,255,.12); border-color: rgba(94,231,255,.4); }
.bpp .btn-main { background: linear-gradient(180deg, rgba(61,255,154,.25), rgba(61,255,154,.08)); border-color: rgba(61,255,154,.55); color: #eafff3; box-shadow: 0 0 24px -6px rgba(61,255,154,.6); }
.bpp input, .bpp select, .bpp textarea { background: rgba(0,0,0,.35); border: 1px solid var(--line); border-radius: 8px; color: var(--ink); font: inherit; font-size: 13px; padding: 8px 10px; width: 100%; box-sizing: border-box; }
.bpp input:focus, .bpp select:focus, .bpp textarea:focus { outline: none; border-color: rgba(94,231,255,.6); }
.bpp .scan { position: relative; overflow: hidden; }
.bpp .scan::after { content:''; position:absolute; inset:0; background: linear-gradient(180deg, transparent 0%, rgba(94,231,255,.08) 50%, transparent 100%); height: 40%; animation: bpp-scan 3.2s linear infinite; pointer-events:none; }
@keyframes bpp-scan { from { transform: translateY(-100%) } to { transform: translateY(260%) } }
@keyframes bpp-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(61,255,154,.0), 0 0 40px -10px rgba(61,255,154,.5) } 50% { box-shadow: 0 0 0 10px rgba(61,255,154,.06), 0 0 70px -6px rgba(61,255,154,.75) } }
@keyframes bpp-blink { 0%,100% { opacity: 1 } 50% { opacity: .25 } }
.bpp .blink { animation: bpp-blink 1.4s ease-in-out infinite; }
.bpp .cannon { animation: bpp-pulse 2.4s ease-in-out infinite; }
.bpp table { width: 100%; border-collapse: collapse; font-size: 12px; }
.bpp th { text-align: left; font-weight: 500; color: var(--dim); padding: 6px 8px; border-bottom: 1px solid var(--line); font-size: 11px; letter-spacing: .1em; text-transform: uppercase; }
.bpp td { padding: 7px 8px; border-bottom: 1px solid rgba(94,231,255,.07); font-variant-numeric: tabular-nums; }
@media (prefers-reduced-motion: reduce) { .bpp .scan::after, .bpp .cannon, .bpp .blink { animation: none } }
`}</style>
  )
}
