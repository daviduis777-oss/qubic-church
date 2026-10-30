/* W4W on qubic.church: gives the game the same db / room / user interface it had as an artifact,
   backed by /api/w4w and the site's shared login. Polls every few seconds; no sockets needed. */
;(() => {
  const API = '/api/w4w'
  const TAB = Math.random().toString(36).slice(2, 10)
  let me = null
  let state = null
  let lastEv = Date.now()
  let presenceData = null
  const subs = { houses: [], orders: [], notices: [], column: [], peers: [], x: [] }
  const topics = {}
  const last = {}

  async function post(body) {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) {
      const e = new Error(j.error || String(r.status))
      e.code = r.status === 403 ? 'permission_denied' : 'unavailable'
      throw e
    }
    return j
  }
  const doc = (id, data) => ({ id, exists: data != null, data: () => data })
  const snap = obj => ({ docs: Object.entries(obj || {}).map(([id, d]) => doc(id, d)) })
  const noticesSnap = () => snap(Object.fromEntries(Object.entries(state?.notices || {}).sort((a, b) => (b[1]?.at || 0) - (a[1]?.at || 0)).slice(0, 50)))
  const peersOf = () => (state?.peers || []).map(p => ({ peer: p.by, by: p.by, isMe: p.by === me?.uid, kind: 'viewer', presence: p.presence }))
  const emitTo = (key, payload) => subs[key].forEach(f => { try { f(payload()) } catch (e) { console.warn(e) } })
  function changed(key, val) {
    const s = JSON.stringify(val)
    if (last[key] === s) return false
    last[key] = s
    return true
  }

  let polling = null
  async function poll() {
    if (polling) return polling
    polling = (async () => {
      try {
        const r = await fetch(API, { cache: 'no-store', credentials: 'same-origin' })
        if (r.status === 403 || r.status === 401) { window.top.location.href = '/w4w'; return }
        if (!r.ok) return
        state = await r.json()
        me = state.me
        if (changed('houses', state.houses)) emitTo('houses', () => snap(state.houses))
        if (changed('orders', state.orders)) emitTo('orders', () => snap(state.orders))
        if (changed('notices', state.notices)) emitTo('notices', noticesSnap)
        if (changed('column', state.column)) emitTo('column', () => doc('column', state.column))
        if (changed('peers', state.peers)) emitTo('peers', () => ({ peers: peersOf() }))
        if (state.x && !state.x.error) emitTo('x', () => state.x)
        const evs = (state.events || []).slice().reverse()
        for (const ev of evs) {
          if (!(ev.t > lastEv)) continue
          lastEv = ev.t
          ;(topics[ev.topic] || []).forEach(f => { try { f({ by: ev.by, data: ev.data, sameTab: ev.tab === TAB }) } catch (e) { console.warn(e) } })
        }
      } catch (e) {
        console.warn('w4w poll', e)
      } finally {
        polling = null
      }
    })()
    return polling
  }
  const soon = () => setTimeout(poll, 250)
  const ready = poll()
  setInterval(() => { if (!document.hidden) poll() }, 4000)
  setInterval(() => { if (!document.hidden && presenceData) post({ op: 'presence', data: presenceData }).catch(() => {}) }, 15000)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) poll() })
  window.addEventListener('pagehide', () => { try { fetch(API, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: '{"op":"leave"}' }) } catch {} })

  const LIVE = { houses: 'houses', orders: 'orders', notices: 'notices' }
  function collection(path) {
    const q = {
      orderBy: () => q,
      limit: () => q,
      onSnapshot(cb) {
        const key = LIVE[path]
        if (!key) return () => {}
        subs[key].push(cb)
        if (state) try { cb(key === 'notices' ? noticesSnap() : snap(state[key])) } catch (e) { console.warn(e) }
        return () => { subs[key] = subs[key].filter(f => f !== cb) }
      },
      async get() {
        const m = path.match(/^houses\/([^/]+)\/log$/)
        if (!m) return snap(state?.[path] || {})
        const r = await fetch(`${API}?log=${encodeURIComponent(m[1])}`, { cache: 'no-store', credentials: 'same-origin' })
        const j = r.ok ? await r.json() : { log: [] }
        return { docs: (j.log || []).sort((a, b) => a.n - b.n).map(d => doc(String(d.n), d)) }
      },
      async add(data) {
        const j = await post({ op: 'add', collection: path, data })
        soon()
        return { id: j.id }
      },
    }
    return q
  }
  function docRef(path) {
    return {
      onSnapshot(cb) {
        if (path !== 'herald/column') return () => {}
        subs.column.push(cb)
        if (state) try { cb(doc('column', state.column)) } catch (e) { console.warn(e) }
        return () => { subs.column = subs.column.filter(f => f !== cb) }
      },
      async set(data) { await post({ op: 'set', path, data }); soon() },
      async update(data) { await post({ op: 'set', path, data, merge: true }); soon() },
      async delete() { await post({ op: 'delete', path }); soon() },
    }
  }
  const db = { collection, doc: docRef }
  const room = {
    onPeers(cb) { subs.peers.push(cb); if (state) cb({ peers: peersOf() }); return () => {} },
    on(topic, cb) { (topics[topic] ||= []).push(cb); return () => {} },
    async emit(topic, data) { await post({ op: 'emit', topic, data, tab: TAB }); soon() },
    async presence(data) { presenceData = data; await post({ op: 'presence', data }) },
  }
  const user = { id: async () => me?.uid ?? null, can: async () => true, isOwner: async () => !!me?.admin }
  // the expedition world: the server walks, counts the cold and freezes; the game only asks and draws
  window.W4W_X = {
    get: () => state?.x ?? null,
    admin: () => !!me?.admin,
    on(cb) { subs.x.push(cb); if (state?.x && !state.x.error) try { cb(state.x) } catch (e) { console.warn(e) }; return () => { subs.x = subs.x.filter(f => f !== cb) } },
    async act(name, body = {}) {
      const j = await post({ op: 'x', act: name, ...body })
      if (state) state.x = j
      emitTo('x', () => j)
      return j
    },
  }
  window.claude = { use: async name => { await ready; if (!me) return null; return { db, room, user }[name] ?? null } }

  /* ---------- the brand goes back to the site; admins get the gate panel ---------- */
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]) }
  async function boot() {
    const brand = document.querySelector('.brand')
    if (brand) { brand.style.cursor = 'pointer'; brand.title = 'Back to Qubic Church'; brand.addEventListener('click', () => { window.top.location.href = '/' }) }
    await ready
    if (!me?.admin) return
    const css = document.createElement('style')
    css.textContent = `#gateBtn{position:fixed;left:16px;bottom:40px;z-index:40;font:600 12px var(--f-body,system-ui);color:var(--cream,#FFE3B0);background:rgba(20,16,22,.86);border:1px solid rgba(232,145,46,.45);border-radius:999px;padding:8px 14px;cursor:pointer}
#gateBtn:hover{border-color:var(--amber,#E8912E)}
#gate{position:fixed;inset:0;z-index:80;display:none;place-items:center;background:rgba(5,4,8,.6)}
#gate.on{display:grid}
#gate .box{width:min(560px,calc(100vw - 32px));max-height:calc(100vh - 64px);overflow:auto;background:#141016;border:1px solid rgba(232,145,46,.35);border-radius:14px;padding:20px;color:#efe3cf;font:14px/1.5 var(--f-body,system-ui)}
#gate h3{margin:0 0 4px;font:500 18px var(--f-label,system-ui);letter-spacing:.06em;color:var(--gold,#FFC46B)}
#gate p{margin:0 0 14px;color:#b9ab97}
#gate .row{display:flex;gap:8px;margin-bottom:16px}
#gate input{flex:1;min-width:0;background:#0b0a0e;border:1px solid #3a2f28;border-radius:8px;color:#efe3cf;padding:9px 10px;font:inherit}
#gate button{background:var(--amber,#E8912E);color:#1a1008;border:0;border-radius:8px;padding:9px 14px;font:600 13px inherit;cursor:pointer}
#gate button.q{background:none;color:#d6c3a8;border:1px solid #3a2f28;padding:5px 10px;font-size:12px}
#gate .code{font:600 22px ui-monospace,monospace;letter-spacing:.18em;color:var(--gold,#FFC46B);background:#0b0a0e;border:1px dashed rgba(255,196,107,.5);border-radius:8px;padding:10px 12px;margin:0 0 16px;display:flex;justify-content:space-between;align-items:center;gap:8px}
#gate table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px}
#gate td,#gate th{text-align:left;padding:6px 4px;border-bottom:1px solid #2a221d;vertical-align:middle}
#gate th{color:#8e806e;font-weight:500}
#gate .x{float:right}`
    document.head.appendChild(css)
    const btn = document.createElement('button')
    btn.id = 'gateBtn'
    btn.textContent = 'Gate · invites'
    const wrap = document.createElement('div')
    wrap.id = 'gate'
    wrap.innerHTML = '<div class="box" role="dialog" aria-label="Who can enter Aigarth"></div>'
    document.body.append(btn, wrap)
    const box = wrap.querySelector('.box')
    let fresh = null
    async function render() {
      box.innerHTML = '<p>Loading…</p>'
      let v
      try { v = await post({ op: 'admin' }) } catch (e) { box.innerHTML = `<p>${esc(e.message)}</p>`; return }
      box.innerHTML = `<button class="q x" data-close>Close</button><h3>Who can enter Aigarth</h3>
<p>The town is closed. Make a one-time code for each tester. They log in on qubic.church/w4w with the same account as the Crypt and BPP-9000, then enter the code.</p>
<div class="row"><input id="gNote" maxlength="60" placeholder="Who is it for (only you see this)"><button id="gMake">Make a code</button></div>
${fresh ? `<div class="code"><span>${esc(fresh)}</span><button class="q" data-copy="${esc(fresh)}">Copy</button></div>` : ''}
<table><tr><th>Code</th><th>For</th><th>Used by</th><th></th></tr>${v.invites.map(i => `<tr><td><code>${esc(i.code)}</code></td><td>${esc(i.note || '')}</td><td>${i.usedBy ? esc(i.usedName || i.usedBy) : '<span style="color:#8e806e">not yet</span>'}</td><td>${i.usedBy ? '' : `<button class="q" data-drop="${esc(i.code)}">Cancel</button>`}</td></tr>`).join('') || '<tr><td colspan="4" style="color:#8e806e">No codes yet.</td></tr>'}</table>
<h3 style="font-size:15px">Inside now</h3>
<table><tr><th>Name</th><th>Account</th><th></th></tr>${v.players.map(p => `<tr><td>${esc(p.name)}${p.admin ? ' · admin' : ''}</td><td><code>${esc(p.handle)}</code></td><td>${p.admin ? '' : `<button class="q" data-revoke="${esc(p.handle)}">Close the gate</button>`}</td></tr>`).join('')}</table>`
      box.querySelector('[data-close]').onclick = () => wrap.classList.remove('on')
      box.querySelector('#gMake').onclick = async () => { const note = box.querySelector('#gNote').value; try { const j = await post({ op: 'invite', note }); fresh = j.invite.code; render() } catch (e) { alert(e.message) } }
      box.querySelectorAll('[data-copy]').forEach(b => { b.onclick = () => { navigator.clipboard?.writeText(b.dataset.copy); b.textContent = 'Copied' } })
      box.querySelectorAll('[data-drop]').forEach(b => { b.onclick = async () => { await post({ op: 'dropInvite', code: b.dataset.drop }).catch(() => {}); render() } })
      box.querySelectorAll('[data-revoke]').forEach(b => { b.onclick = async () => { await post({ op: 'revoke', handle: b.dataset.revoke }).catch(() => {}); render() } })
    }
    btn.onclick = () => { fresh = null; wrap.classList.add('on'); render() }
    wrap.addEventListener('click', e => { if (e.target === wrap) wrap.classList.remove('on') })

    /* ---------- the story desk: letters under the North Gate, the Captain's phase, the Hush ---------- */
    const sbtn = document.createElement('button'); sbtn.id = 'storyBtn'; sbtn.textContent = 'Story desk'
    sbtn.style.cssText = 'position:fixed;left:16px;bottom:82px;z-index:40;font:600 12px var(--f-body,system-ui);color:#cfe0ff;background:rgba(14,16,26,.88);border:1px solid rgba(140,170,255,.4);border-radius:999px;padding:8px 14px;cursor:pointer'
    const swrap = document.createElement('div'); swrap.id = 'storydesk'; css.textContent += css.textContent.replaceAll('#gate', '#storydesk')
    swrap.innerHTML = '<div class="box" role="dialog" aria-label="Story desk"></div>'
    document.body.append(sbtn, swrap)
    const sbox = swrap.querySelector('.box')
    const PH = ['0 · Unseen. Only letters from the twelve.', '1 · Whispers. His letters ask; a pylon can be drained for warmth.', '2 · Knocking. The Hush shows; the Gate bar can be lifted.', '3 · Unveiling. When the Hush is full, the Veil falls for 3 hours.']
    const when = t => new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    async function story(body) {
      sbox.innerHTML = '<p>Loading…</p>'
      let v; try { v = await post({ op: 'story', ...body }) } catch (e) { sbox.innerHTML = `<button class="q x" data-close>Close</button><p>${esc(e.message)}</p>`; sbox.querySelector('[data-close]').onclick = () => swrap.classList.remove('on'); return }
      const st = v.story, now = Date.now(), un = st.unveil && now < st.unveil.until
      sbox.innerHTML = `<button class="q x" data-close>Close</button><h3>Story desk</h3>
<p>Everything here goes live at once for every player. Letters are stored on the server only, so nobody can read them ahead.</p>
<h3 style="font-size:15px">Slip a letter under the North Gate</h3>
<div class="row"><input id="sFrom" maxlength="60" value="the twelve" placeholder="Signed by"><input id="sHours" type="number" min="0.1" max="48" step="0.5" value="1" style="flex:0 0 80px" title="Hours it lies there"></div>
<div class="row"><input id="sTitle" maxlength="120" placeholder="Title, as players will see it"></div>
<div class="row"><textarea id="sText" maxlength="4000" rows="7" placeholder="The letter" style="flex:1;background:#0b0a0e;border:1px solid #3a2f28;border-radius:8px;color:#efe3cf;padding:9px 10px;font:inherit;resize:vertical"></textarea></div>
<div class="row"><input id="sAt" type="datetime-local" title="Leave empty to post now"><button id="sPost">Post the letter</button></div>
<table><tr><th>Letter</th><th>Lies there</th><th>Read by</th><th></th></tr>${v.letters.slice().reverse().map(l => `<tr><td>${esc(l.title)}<br><span style="color:#8e806e">${esc(l.from)}</span></td><td>${when(l.at)} to ${when(l.until)}${now >= l.at && now < l.until ? ' · <b style="color:#ffc46b">now</b>' : now < l.at ? ' · waiting' : ''}</td><td>${l.reads}</td><td><button class="q" data-del="${esc(l.id)}">Delete</button></td></tr>`).join('') || '<tr><td colspan="4" style="color:#8e806e">No letters yet.</td></tr>'}</table>
<h3 style="font-size:15px">The Captain</h3>
<p>Phase now: <b>${esc(PH[st.phase] || st.phase)}</b><br>Hush: <b>${st.hush}</b> of 100${un ? `<br><b style="color:#ff6a50">The Veil is down until ${when(st.unveil.until)}.</b>` : ''}</p>
<div class="row" style="flex-wrap:wrap">${PH.map((t, i) => `<button class="q" data-phase="${i}" ${i === st.phase ? 'disabled' : ''}>Phase ${i}</button>`).join('')}</div>
<div class="row" style="flex-wrap:wrap"><input id="sHush" type="number" min="0" max="100" value="${st.hush}" style="flex:0 0 90px"><button class="q" id="sHushSet">Set the Hush</button>${un ? '<button class="q" data-calm>Raise the Veil again</button>' : '<button class="q" data-unveil>Drop the Veil now (3 h)</button>'}</div>`
      sbox.querySelector('[data-close]').onclick = () => swrap.classList.remove('on')
      sbox.querySelector('#sPost').onclick = () => { const at = sbox.querySelector('#sAt').value; story({ do: 'post', from: sbox.querySelector('#sFrom').value, hours: +sbox.querySelector('#sHours').value, title: sbox.querySelector('#sTitle').value, text: sbox.querySelector('#sText').value, at: at ? new Date(at).toISOString() : undefined }) }
      sbox.querySelectorAll('[data-del]').forEach(b => { b.onclick = () => { if (confirm('Delete this letter for everyone?')) story({ do: 'del', id: b.dataset.del }) } })
      sbox.querySelectorAll('[data-phase]').forEach(b => { b.onclick = () => { if (confirm(`Move the Captain to phase ${b.dataset.phase}?`)) story({ do: 'phase', phase: +b.dataset.phase }) } })
      sbox.querySelector('#sHushSet').onclick = () => story({ do: 'hush', hush: +sbox.querySelector('#sHush').value })
      sbox.querySelector('[data-unveil]')?.addEventListener('click', () => { if (confirm('Drop the Veil for every player for 3 hours? This is the apocalypse.')) story({ do: 'unveil', hours: 3 }) })
      sbox.querySelector('[data-calm]')?.addEventListener('click', () => story({ do: 'calm' }))
    }
    sbtn.onclick = () => { swrap.classList.add('on'); story({ do: 'list' }) }
    swrap.addEventListener('click', e => { if (e.target === swrap) swrap.classList.remove('on') })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
  else boot()
})()
