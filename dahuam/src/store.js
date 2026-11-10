/* =====================================================================
   Paket A · Speicher
   Hauptdaten liegen in IndexedDB (Datenbank dahuam202_daten), zerlegt in
   kleine Teile ("units"). Ein Speichervorgang schreibt nur geänderte Teile
   und die Versionsnummer in EINER Transaktion: ganz oder gar nicht.
   Vorher steht dieselbe Änderung als Notiz ("Journal") im localStorage,
   damit auch ein Absturz zwischen Tippen und Schreiben nichts kostet.
   Ohne IndexedDB: localStorage wie früher, aber Fehler werden sichtbar.
   ===================================================================== */
const APP_SCHEMA = 2;                       // Datenformat; ohne Angabe = 1 (vor Paket A)
const APP_VERSION = '/*APP_VERSION*/', APP_BUILD = '/*APP_BUILD*/';
function schemaNewer(d){ return !!d && typeof d === 'object' && +d.schema > APP_SCHEMA; }
const NEWER_MSG = 'Diese Daten stammen aus einer neueren Version der App. Bitte zuerst die App neu laden, damit sie aktuell ist, und dann noch einmal versuchen. Es wurde nichts geändert.';

const STORE = (() => {
  const DBN = 'dahuam202_daten', JKEY = KEY + '_journal', LKEY = KEY + '_lease', BKEY = KEY + '_bus', RKEY = KEY + '_rev';
  const TAB = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const U = '\u001f', BUDGET = 20, SLICE = 8, JMAX = 1500000;
  const st = { mode:'mem', db:null, sid:'', rev:0, metaAt:0, writer:'', pers:new Map(), fly:null, cur:null, pass:null, restarts:0,
    dirty:false, gen:0, error:null, savedAt:0, role:'owner', confirmed:true, since:0, frozen:false, ready:false, fresh:false,
    legacy:null, stray:null, ops:0, safety:null, base:undefined, baseP:null, status:'', retryN:0, journalOk:true, blocked:0, stats:{} };
  const subs = [], waiters = [];
  const emit = (t, d) => { subs.slice().forEach(f => { try { f(t, d); } catch(e){ console.warn('Speicher:', e); } }); settle(); };
  const ls = {
    get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
    set(k, v){ try { localStorage.setItem(k, v); return true; } catch(e){ return false; } },
    del(k){ try { localStorage.removeItem(k); } catch(e){} } };
  const isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const now = () => Date.now();
  const dayOf = t => { const d = new Date(t); return new Date(d.getTime() - d.getTimezoneOffset()*6e4).toISOString().slice(0, 10); };
  const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const hash = s => { let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const isMarker = raw => { if(!raw || raw.length > 400) return false; try { const m = JSON.parse(raw); return !!(m && m._store); } catch(e){ return false; } };

  /* ---------- Zerlegen und Zusammensetzen ---------- */
  function plan(S){
    const man = {v:1, top:[], parts:{}}, list = [];
    const part = (path, v) => {
      if(Array.isArray(v) && v.length > 96){
        const names = [], used = new Set(); let a = 0;
        const cut = b => { const f = v[a]; let nm = f && typeof f === 'object' && f.id != null ? String(f.id) : '@' + a; if(used.has(nm)) nm += '~' + a; used.add(nm); names.push(nm); const x = a, y = b; list.push([path + U + '#' + nm, () => JSON.stringify(v.slice(x, y))]); a = b; };
        for(let i = 1; i < v.length; i++){ const e = v[i]; const edge = e && typeof e === 'object' && e.id != null ? hash(String(e.id)) % 128 === 0 : i % 128 === 0; if(edge || i - a >= 512) cut(i); }
        cut(v.length);
        return {t:'a', c:names};
      }
      if(isObj(v)){
        const keys = Object.keys(v); if(keys.length <= 48) return null;
        const bk = new Map();
        for(const k of keys){ const b = /^\d{4}-\d{2}/.test(k) ? k.slice(0, 7) : 'h' + (hash(k) % 16); let o = bk.get(b); if(!o) bk.set(b, o = {}); o[k] = v[k]; }
        const sim = []; for(const [b, o] of bk){ for(const k of Object.keys(o)) sim.push(k); list.push([path + U + '/' + b, () => JSON.stringify(o)]); }
        let same = sim.length === keys.length; for(let i = 0; same && i < keys.length; i++) if(sim[i] !== keys[i]) same = false;
        const d = {t:'o', b:[...bk.keys()]}; if(!same) d.ord = keys; return d;
      }
      return null;
    };
    for(const k of Object.keys(S)){
      const v = S[k]; if(v === undefined || typeof v === 'function') continue;
      man.top.push(k);
      let d = part(k, v);
      if(!d && isObj(v)){
        let sub = null; const rest = {};
        for(const k2 of Object.keys(v)){ const d2 = part(k + U + k2, v[k2]); if(d2) (sub = sub || {})[k2] = d2; else rest[k2] = v[k2]; }
        if(sub){ d = {t:'s', sub, ord:Object.keys(v)}; list.push([k, () => JSON.stringify(rest)]); }
      }
      if(d) man.parts[k] = d; else list.push([k, () => { const s = JSON.stringify(v); return s === undefined ? 'null' : s; }]);
    }
    list.push(['!m', () => JSON.stringify(man)]);
    return list;
  }
  function assemble(get){
    const mj = get('!m'); if(mj == null) throw new Error('Inhaltsverzeichnis fehlt');
    const man = JSON.parse(mj); if(!man || !Array.isArray(man.top)) throw new Error('Inhaltsverzeichnis unlesbar');
    const need = id => { const s = get(id); if(s == null) throw new Error('Teil fehlt: ' + id); return JSON.parse(s); };
    const build = (path, d) => {
      if(d.t === 'a'){ const out = []; for(const n of d.c){ const a = need(path + U + '#' + n); for(let i = 0; i < a.length; i++) out.push(a[i]); } return out; }
      const tmp = {}; for(const b of d.b) Object.assign(tmp, need(path + U + '/' + b));
      if(!d.ord) return tmp; const o = {}; for(const k of d.ord) if(k in tmp) o[k] = tmp[k]; return o;
    };
    const S = {};
    for(const k of man.top){ const d = (man.parts || {})[k];
      if(!d) S[k] = need(k);
      else if(d.t === 's'){ const rest = need(k), o = {}; for(const k2 of d.ord){ if(d.sub[k2]) o[k2] = build(k + U + k2, d.sub[k2]); else if(k2 in rest) o[k2] = rest[k2]; } S[k] = o; }
      else S[k] = build(k, d);
    }
    return S;
  }
  function unitsOf(S){ const m = new Map(); for(const [id, f] of plan(S)) m.set(id, f()); return m; }

  /* ---------- IndexedDB ---------- */
  function openDb(){
    return new Promise((res, rej) => {
      let done = false; const fin = (f, x) => { if(!done){ done = true; f(x); } };
      const tm = setTimeout(() => fin(rej, new Error('IndexedDB antwortet nicht')), 4000);
      try {
        const r = indexedDB.open(DBN, 1);
        r.onupgradeneeded = () => { const db = r.result; for(const n of ['kv', 'units', 'snapMeta', 'snapData']) if(!db.objectStoreNames.contains(n)) db.createObjectStore(n); };
        r.onsuccess = () => { clearTimeout(tm); const db = r.result; db.onversionchange = () => { try { db.close(); } catch(e){} if(st.db === db) st.db = null; }; db.onclose = () => { if(st.db === db) st.db = null; }; if(done){ try { db.close(); } catch(e){} } else fin(res, db); };
        r.onerror = () => { clearTimeout(tm); fin(rej, r.error || new Error('IndexedDB gesperrt')); };
        r.onblocked = () => {};
      } catch(e){ clearTimeout(tm); fin(rej, e); }
    });
  }
  const rq = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  function tx(names, mode, fn){
    return new Promise((res, rej) => {
      let t, out;
      try { try { t = st.db.transaction(names, mode, {durability:'strict'}); } catch(e){ if(e && e.name === 'TypeError') t = st.db.transaction(names, mode); else throw e; } }
      catch(e){ return rej(e); }
      t.oncomplete = () => res(out); t.onerror = e => { if(!t._why && e && e.target && e.target.error) t._why = e.target.error; }; t.onabort = () => rej(t._why || t.error || new Error('Abbruch'));
      try { out = fn(t); } catch(e){ t._why = e; try { t.abort(); } catch(x){ rej(e); } }
    });
  }
  async function op(p){ st.ops++; try { return await p; } finally { st.ops--; settle(); } }
  function kvGet(k){ if(!st.db) return Promise.resolve(k === 'meta' ? null : memKv.get(k)); let r; return op(tx(['kv'], 'readonly', t => { r = t.objectStore('kv').get(k); }).then(() => r.result)); }
  function kvSet(k, v){ if(!st.db){ if(v === undefined) memKv.delete(k); else memKv.set(k, v); return Promise.resolve(); } return op(tx(['kv'], 'readwrite', t => { const s = t.objectStore('kv'); if(v === undefined) s.delete(k); else s.put(v, k); })); }
  const memKv = new Map();
  async function readAll(){
    let meta, keys, vals, saf;
    await tx(['kv', 'units'], 'readonly', t => { const kv = t.objectStore('kv'), us = t.objectStore('units'); meta = kv.get('meta'); saf = kv.get('safetyMeta'); keys = us.getAllKeys(); vals = us.getAll(); });
    const m = new Map(); keys.result.forEach((k, i) => m.set(k, vals.result[i]));
    return {meta:meta.result || null, units:m, safety:saf.result || null};
  }

  /* ---------- Journal (Notiz der letzten ungeschriebenen Änderung) ---------- */
  function diff(cur){
    const ch = new Map(), rm = [];
    const fly = st.fly ? st.fly.touch : null;
    for(const [id, s] of cur) if(st.pers.get(id) !== s || (fly && fly.has(id))) ch.set(id, s);
    for(const id of st.pers.keys()) if(!cur.has(id)) rm.push(id);
    if(fly) for(const id of fly) if(!cur.has(id) && !st.pers.has(id)) rm.push(id);
    return {ch, rm};
  }
  function journalWrite(d){
    if(st.mode !== 'idb') return;
    if(!st.sid) st.sid = TAB + Math.random().toString(36).slice(2, 8);      // Kennung dieses Speichers, entsteht vor dem ersten Schreiben
    if(!d.ch.size && !d.rm.length){ ls.del(JKEY); st.journalOk = true; return; }
    let n = 0; for(const s of d.ch.values()) n += s.length;
    st.journalOk = n <= JMAX && ls.set(JKEY, JSON.stringify({v:1, base:st.rev, sid:st.sid, tab:TAB, at:now(), ch:[...d.ch], rm:d.rm}));
    if(!st.journalOk) ls.del(JKEY);
  }
  const journalFits = (j, meta) => !!j && j.sid === (meta.sid || '') && (j.base === meta.rev || (j.base < meta.rev && j.tab === meta.writer));
  /* Wurde der Schreibvorgang beim Schließen doch noch fertig, steht alles aus der Notiz schon im Speicher: dann gibt es nichts nachzuholen */
  const journalNews = (j, units) => j.ch.some(([id, s]) => units.get(id) !== s) || j.rm.some(id => units.has(id));
  function journalRead(){ const raw = ls.get(JKEY); if(!raw) return null; try { const j = JSON.parse(raw); return j && j.v === 1 && Array.isArray(j.ch) ? j : null; } catch(e){ return null; } }

  /* ---------- Speichern ---------- */
  function save(){
    if(st.frozen) return;
    if(st.role !== 'owner'){ st.blocked++; emit('blocked'); return; }
    st.dirty = true; st.gen++;
    if(st.ready) kick();
  }
  let kicked = false, sliceT = 0, commitT = 0, retryT = 0;
  function kick(){ if(kicked) return; kicked = true; const go = () => { kicked = false; run(BUDGET); }; if(typeof queueMicrotask === 'function') queueMicrotask(go); else Promise.resolve().then(go); }
  function canWrite(){ return st.ready && !st.frozen && st.role === 'owner' && st.confirmed; }
  function run(limit){
    if(!st.dirty || !canWrite()) return;
    if(st.mode !== 'idb') return lsCommit();
    if(!st.cur || st.cur.gen !== st.gen){
      let p = st.pass;
      if(!p || p.gen !== st.gen){ if(p) st.restarts++; p = st.pass = {gen:st.gen, list:plan(S), map:new Map(), i:0, t:0}; }
      const t0 = performance.now(), lim = st.restarts >= 3 ? Infinity : limit;
      while(p.i < p.list.length){ const u = p.list[p.i++]; p.map.set(u[0], u[1]()); if(performance.now() - t0 > lim) break; }
      const dt = performance.now() - t0; p.t += dt; if(dt > (st.stats.maxSlice || 0)) st.stats.maxSlice = dt;
      if(p.i < p.list.length){ clearTimeout(sliceT); sliceT = setTimeout(() => run(SLICE), 0); return; }
      st.cur = {gen:p.gen, map:p.map}; st.pass = null; st.restarts = 0; st.stats.lastPass = p.t;
      journalWrite(diff(st.cur.map));
    }
    clearTimeout(commitT);
    if(limit === Infinity) commit(); else commitT = setTimeout(commit, 120);
  }
  function commit(){
    clearTimeout(commitT);
    if(st.fly || !st.cur || !canWrite() || st.mode !== 'idb') return;
    const cur = st.cur, d = diff(cur.map);
    if(!d.ch.size && !d.rm.length){ if(st.gen === cur.gen){ st.dirty = false; ls.del(JKEY); st.error = null; emit('saved'); } return; }
    if(!st.db){ fail(new Error('Datenbank geschlossen')); return; }
    st.fly = {touch:new Set([...d.ch.keys(), ...d.rm])};
    emit('saving');
    const snapP = autoSnapshot();
    const expect = st.rev, at = now(), sid = st.sid || (st.sid = TAB + Math.random().toString(36).slice(2, 8));
    op(tx(['kv', 'units'], 'readwrite', t => {
      const kv = t.objectStore('kv'), us = t.objectStore('units'), g = kv.get('meta');
      g.onsuccess = () => {
        const m = g.result || {rev:0};
        if((+m.rev || 0) !== expect){ t._why = Object.assign(new Error('conflict'), {conflict:true}); t.abort(); return; }
        try { for(const [id, s] of d.ch) us.put(s, id); for(const id of d.rm) us.delete(id); kv.put({rev:expect + 1, sid, schema:APP_SCHEMA, at, writer:TAB, build:APP_BUILD}, 'meta'); }
        catch(e){ t._why = e; try { t.abort(); } catch(x){} }
      };
    })).then(() => {
      st.rev = expect + 1; st.metaAt = at; st.writer = TAB; st.sid = sid;
      for(const [id, s] of d.ch) st.pers.set(id, s); for(const id of d.rm) st.pers.delete(id);
      st.fly = null; st.error = null; st.retryN = 0; st.savedAt = at; st.fresh = false;
      if(st.gen === cur.gen){ st.dirty = false; ls.del(JKEY); } else if(st.cur && st.cur.gen === st.gen){ journalWrite(diff(st.cur.map)); commitT = setTimeout(commit, 60); } else kick();
      post({t:'saved', rev:st.rev});
      emit('saved');
      afterFirstCommit();
      return snapP;
    }, err => {
      st.fly = null;
      if(err && err.conflict){ conflict(); return; }
      fail(err);
    }).catch(e => console.warn('Speicher:', e));
  }
  function lsCommit(){
    if(st.mode === 'mem'){ st.error = describe({name:'NoStore'}); emit('error'); return; }
    try {
      const cr = +(localStorage.getItem(RKEY) || 0);
      if(cr !== st.rev){ conflict(); return; }
      localStorage.setItem(KEY, JSON.stringify(S)); localStorage.setItem(RKEY, String(st.rev + 1));
      st.rev++; st.dirty = false; st.error = null; st.savedAt = st.metaAt = now(); st.fresh = false;
      post({t:'saved', rev:st.rev}); emit('saved');
    } catch(e){ fail(e); }
  }
  function describe(e){
    const name = (e && e.name) || '', msg = String((e && e.message) || e || '');
    if(name === 'NoStore') return {kind:'nostore', text:'dieser Browser lässt hier kein Speichern zu (zum Beispiel im privaten Fenster)'};
    if(name === 'QuotaExceededError' || /quota|storage.*full|exceeded/i.test(msg)) return {kind:'quota', text:'der Speicher dieses Browsers ist voll'};
    return {kind:'other', text:'der Browser hat das Speichern abgelehnt', detail:name + ' ' + msg};
  }
  function fail(err){
    st.error = describe(err); st.error.at = now(); console.warn('Speichern fehlgeschlagen:', err);
    emit('error');
    clearTimeout(retryT); const wait = [4000, 15000, 60000][Math.min(st.retryN++, 2)];
    retryT = setTimeout(() => retry(true), wait);
  }
  async function retry(quiet){
    clearTimeout(retryT);
    if(st.mode === 'idb' && !st.db){ try { st.db = await openDb(); } catch(e){ if(!quiet) emit('error'); } }
    if(st.dirty){ if(st.mode === 'idb' && st.cur && st.cur.gen === st.gen) commit(); else run(Infinity); }
    else { st.error = null; emit('saved'); }
    return idle();
  }
  function flushNow(){ if(st.dirty && canWrite()) run(Infinity); }
  function settle(){ if(!waiters.length) return; if(st.ops > 0 || st.fly) return; if(st.dirty && canWrite() && !st.error) return; waiters.splice(0).forEach(f => f()); }
  function idle(){ return new Promise(res => { waiters.push(res); setTimeout(settle, 0); }); }

  /* ---------- Erster Schreibvorgang: alte Kopie im localStorage ablösen ---------- */
  let firstDone = false;
  async function afterFirstCommit(){
    if(firstDone || st.mode !== 'idb') return; firstDone = true;
    const raw = st.legacy || st.stray; if(!raw && isMarker(ls.get(KEY))) return;
    try {
      const back = await op(readAll());                       // zurücklesen und prüfen
      if(!back.meta || back.meta.rev < 1) throw new Error('Prüfung: keine Version');
      for(const [id, s] of st.pers) if(!st.fly && back.meta.rev === st.rev && back.units.get(id) !== s) throw new Error('Prüfung: Teil weicht ab');
      assemble(id => back.units.get(id));
      if(raw) await snapPut(st.legacy ? 'umzug' : 'alt', st.legacy ? 'Stand vor der Umstellung des Speichers' : 'Stand aus einer älteren App-Version', {raw}, 0, now());
      ls.set(KEY, JSON.stringify({_store:'idb', rev:back.meta.rev, at:new Date().toISOString()}));
      st.legacy = st.stray = null; emit('migrated');
    } catch(e){ console.warn('Umstellung noch nicht abgeschlossen:', e); firstDone = false; }
  }

  /* ---------- Frühere Stände ---------- */
  function sizeOf(data){ if(data.raw != null) return data.raw.length; let n = 0; for(const k in data.u) n += data.u[k].length; return n; }
  function countsOf(get){ const n = id => { try { const s = get(id); return s ? JSON.parse(s).length : null; } catch(e){ return null; } }; return {menu:n('menu'), cards:n('cards'), products:n('products')}; }
  async function snapPut(kind, why, data, rev, at){
    if(!st.db) return null;
    const id = new Date(now()).toISOString() + '-' + Math.random().toString(36).slice(2, 6);
    let counts = {}; try { if(data.raw != null){ const d = JSON.parse(data.raw); counts = {menu:(d.menu || []).length, cards:(d.cards || []).length, products:(d.products || []).length}; } else counts = countsOf(k => data.u[k]); } catch(e){}
    const meta = {id, kind, why, at, taken:now(), rev, size:sizeOf(data), counts};
    await op(tx(['snapMeta', 'snapData'], 'readwrite', t => { t.objectStore('snapMeta').put(meta, id); t.objectStore('snapData').put(data, id); }));
    await snapPrune(); emit('snaps'); return meta;
  }
  async function snapList(){ if(!st.db) return []; let r; await op(tx(['snapMeta'], 'readonly', t => { r = t.objectStore('snapMeta').getAll(); })); return r.result.sort((a, b) => b.at - a.at || b.taken - a.taken); }
  const weekOf = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayOf(d.getTime()); };
  async function snapPrune(){
    const all = await snapList(); const keep = new Set();
    const auto = all.filter(x => x.kind === 'auto'); auto.slice(0, 7).forEach(x => keep.add(x.id));
    const weeks = new Set(); for(const x of auto.slice(7)){ const w = weekOf(x.at); if(weeks.has(w)) continue; if(weeks.size >= 4) break; weeks.add(w); keep.add(x.id); }
    all.filter(x => x.kind !== 'auto').slice(0, 5).forEach(x => keep.add(x.id));
    const drop = all.filter(x => !keep.has(x.id)); if(!drop.length) return;
    await op(tx(['snapMeta', 'snapData'], 'readwrite', t => { for(const x of drop){ t.objectStore('snapMeta').delete(x.id); t.objectStore('snapData').delete(x.id); } }));
  }
  async function snapLoad(id){ let r; await op(tx(['snapData'], 'readonly', t => { r = t.objectStore('snapData').get(id); })); const d = r.result; if(!d) throw new Error('Stand nicht gefunden'); return d.raw != null ? JSON.parse(d.raw) : assemble(k => d.u[k]); }
  async function snapDelete(id){ await op(tx(['snapMeta', 'snapData'], 'readwrite', t => { t.objectStore('snapMeta').delete(id); t.objectStore('snapData').delete(id); })); emit('snaps'); }
  let lastAutoRev = -1;
  /* Tagesstand: vor der ersten Änderung eines neuen Tages wird der bisherige Stand aufgehoben */
  function autoSnapshot(){
    if(!st.db || !st.pers.size || !st.metaAt || st.rev === lastAutoRev) return Promise.resolve();
    if(dayOf(st.metaAt) === dayOf(now())) return Promise.resolve();
    lastAutoRev = st.rev; const rev = st.rev, at = st.metaAt, u = Object.fromEntries(st.pers);
    return snapList().then(l => l.some(x => x.kind === 'auto' && x.rev === rev && x.at === at) ? null : snapPut('auto', '', {u}, rev, at)).catch(e => console.warn('Früherer Stand:', e));
  }
  function snapNow(kind, why){ const u = Object.fromEntries(unitsOf(S)); return snapPut(kind, why, {u}, st.rev, now()); }

  /* ---------- Sicherheitskopie und Cloud-Basis ---------- */
  function safetyStore(why){
    let raw; try { raw = JSON.stringify(S); } catch(e){ return false; }
    const m = st.safety = {at:new Date().toISOString(), why, nMenu:(S.menu || []).length, nCards:(S.cards || []).length};
    memKv.set('safety', {...m, raw});
    if(st.db) op(tx(['kv'], 'readwrite', t => { t.objectStore('kv').put(m, 'safetyMeta'); t.objectStore('kv').put({...m, raw}, 'safety'); })).then(() => { if(st.safety === m) memKv.delete('safety'); }, e => console.warn('Sicherheitskopie:', e));
    else ls.set(KEY + '_safety', JSON.stringify({at:m.at, why, data:JSON.parse(raw)}));
    emit('safety'); return true;
  }
  async function safetyData(){ let x = memKv.get('safety'); if(!x && st.db) x = await kvGet('safety').catch(() => null); return x && x.raw ? JSON.parse(x.raw) : null; }
  function safetyClear(){ st.safety = null; memKv.delete('safety'); ls.del(KEY + '_safety'); if(st.db) op(tx(['kv'], 'readwrite', t => { t.objectStore('kv').delete('safetyMeta'); t.objectStore('kv').delete('safety'); })).catch(() => {}); emit('safety'); }
  function baseLoad(){ if(!st.baseP) st.baseP = (async () => { let b = null; try { b = st.db ? await kvGet('base') : null; } catch(e){} if(b == null){ const raw = ls.get(KEY + '_base'); if(raw){ try { b = JSON.parse(raw); if(st.db){ await kvSet('base', b); ls.del(KEY + '_base'); } } catch(e){ b = null; } } } if(st.base === undefined) st.base = b || null; })(); return st.baseP; }
  function baseGet(){ return st.base || null; }
  function baseSet(d){ st.base = d || null; if(st.db) kvSet('base', d == null ? undefined : d).catch(e => console.warn('Cloud-Basis:', e)); else if(d == null) ls.del(KEY + '_base'); else ls.set(KEY + '_base', JSON.stringify(d)); }

  /* ---------- Zwei Fenster: nur eines schreibt ---------- */
  let bc = null, seq = 0, onHere = null, onReleased = null, beatT = 0, reloadT = 0;
  function post(m){ m.from = TAB; m.n = ++seq; if(bc){ try { bc.postMessage(m); return; } catch(e){} } ls.set(BKEY, JSON.stringify(m)); }
  function leaseRead(){ try { return JSON.parse(ls.get(LKEY)); } catch(e){ return null; } }
  function leaseWrite(){ ls.set(LKEY, JSON.stringify({id:TAB, since:st.since, t:now()})); }
  function claim(){ st.role = 'owner'; st.confirmed = true; st.since = now(); leaseWrite(); }
  function beat(){
    const l = leaseRead();
    if(st.role === 'owner'){
      if(l && l.id !== TAB && (l.since > st.since || (l.since === st.since && l.id > TAB))){ demote('lease'); return; }
      leaseWrite();
    } else if(st.confirmed){
      if(!l){ takeover(true); return; }
      if(now() - l.t > 15000){ let got = false; onHere = () => { got = true; }; post({t:'who'}); setTimeout(() => { if(!got && st.role === 'reader'){ const l2 = leaseRead(); if(!l2 || now() - l2.t > 15000) takeover(true); } }, 600); }
    }
  }
  function leaseInit(){
    try { if(typeof BroadcastChannel === 'function'){ bc = new BroadcastChannel('dahuam202_bus'); bc.onmessage = e => onBus(e.data); } } catch(e){ bc = null; }
    window.addEventListener('storage', e => {
      if(e.key === BKEY && e.newValue && !bc){ try { onBus(JSON.parse(e.newValue)); } catch(x){} }
      if(e.key === LKEY) beat();
      if(e.key === RKEY && st.mode === 'ls' && st.role === 'reader') scheduleReload();
    });
    beatT = setInterval(beat, 4000);
    const l = leaseRead();
    if(!l || l.id === TAB){ claim(); setTimeout(beat, 300 + Math.random()*200); return Promise.resolve(); }
    st.role = 'reader'; st.confirmed = false;
    return new Promise(res => { let fin = false; const end = () => { if(!fin){ fin = true; res(); } };
      onHere = () => { st.confirmed = true; end(); };
      post({t:'who'});
      setTimeout(() => { if(!st.confirmed){ onHere = null; claim(); } end(); }, 500); });
  }
  function onBus(m){
    if(!m || m.from === TAB) return;
    if(m.t === 'who'){ if(st.role === 'owner' && st.confirmed) post({t:'here'}); }
    else if(m.t === 'here'){ if(onHere){ const f = onHere; onHere = null; f(); } }
    else if(m.t === 'takeover'){ if(st.role === 'owner'){ flushNow(); const end = () => { demote('takeover'); post({t:'released', rev:st.rev}); }; const tm = setTimeout(end, 1500); idle().then(() => { clearTimeout(tm); if(st.role === 'owner') end(); }); } }
    else if(m.t === 'released'){ if(onReleased){ const f = onReleased; onReleased = null; f(); } }
    else if(m.t === 'saved'){ if(st.role === 'reader') scheduleReload(); }
  }
  function demote(why){
    if(st.role !== 'owner') return;
    const lost = st.dirty; st.role = 'reader'; st.confirmed = true;
    clearTimeout(commitT); clearTimeout(sliceT); clearTimeout(retryT);
    if(lost && why !== 'takeover'){ try { snapNow('konflikt', 'Nicht gespeicherte Änderungen dieses Fensters'); } catch(e){} }
    st.dirty = false; st.cur = null; st.pass = null; st.error = null;
    try { const d = document.getElementById('dlg'); if(d && d.open) d.close(); } catch(e){}
    emit('role', why);
    if(why !== 'takeover') scheduleReload();
  }
  function conflict(){ if(st.role === 'owner'){ const l = leaseRead(); if(l && l.id === TAB) ls.del(LKEY); demote('conflict'); } }
  function scheduleReload(){ clearTimeout(reloadT); reloadT = setTimeout(() => { if(st.role === 'reader') reload().catch(e => console.warn(e)); }, 150); }
  /* Stand neu aus dem Speicher lesen (Lesefenster, Übernahme) */
  async function reload(asOwner){
    let state = null;
    if(st.mode === 'idb' && st.db){
      const r = await op(readAll()); if(!r.meta) return false;
      const get0 = id => r.units.get(id); let get = get0, applied = false;
      if(asOwner){ const j = journalRead(); if(journalFits(j, r.meta) && !journalNews(j, r.units)) ls.del(JKEY); else if(journalFits(j, r.meta)){ const o = new Map(j.ch), rm = new Set(j.rm); get = id => o.has(id) ? o.get(id) : rm.has(id) ? undefined : r.units.get(id); applied = true; } else if(j) ls.del(JKEY); }
      try { state = assemble(get); } catch(e){ if(!applied) throw e; state = assemble(get0); applied = false; ls.del(JKEY); }
      if(schemaNewer(state)) return false;
      st.rev = r.meta.rev; st.sid = r.meta.sid || ''; st.metaAt = r.meta.at; st.writer = r.meta.writer; st.pers = r.units; st.cur = null; st.pass = null; st.dirty = applied; if(applied) st.gen++;
    } else if(st.mode === 'ls'){
      const raw = ls.get(KEY); if(!raw) return false; state = JSON.parse(raw); st.rev = +(ls.get(RKEY) || 0); st.dirty = false;
    } else return false;
    const nd = migrate(state); if(!nd) return false;
    S = nd; st.savedAt = st.metaAt;
    try { render(); } catch(e){ console.warn(e); }
    emit('reloaded');
    return true;
  }
  async function takeover(auto){
    if(st.role === 'owner' || st.taking) return; st.taking = true;
    try {
      if(!auto){ await new Promise(res => { onReleased = res; post({t:'takeover'}); setTimeout(res, 1800); }); onReleased = null; }
      st.since = now(); leaseWrite();                 // Anspruch anmelden, aber erst nach dem Neuladen schreiben
      try { await reload(true); } finally { st.role = 'owner'; st.confirmed = true; }
      emit('role', 'owner');
      if(st.dirty) kick();
    } finally { st.taking = false; }
  }
  /* Lesefenster: Eingaben abfangen, Navigation bleibt möglich */
  const roOk = t => !!(t && t.closest && t.closest('#relBars, [data-tab], .nav-slot, .side nav, .bottom, [data-act="theme"]'));
  const roKeys = new Set(['Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', 'F5', 'F12']);
  function roGuard(e){
    if(st.recovering){ e.stopImmediatePropagation(); if(e.type === 'click' || e.type === 'change'){ try { relRecEvent(e); } catch(x){ console.warn(x); } } return; }
    if(st.role === 'owner' || !st.ready) return;
    const t = e.target;
    if(e.type === 'keydown'){ if(roKeys.has(e.key) || ((e.ctrlKey || e.metaKey) && /^[rRcCaAfF]$/.test(e.key))) return; if((e.key === 'Enter' || e.key === ' ') && roOk(t)) return; }
    else if(roOk(t)) return;
    e.stopImmediatePropagation(); if(e.cancelable && e.type !== 'pointerdown') e.preventDefault();
    if(e.type === 'click' || e.type === 'change'){ st.blocked++; emit('blocked'); }
  }
  ['click', 'dblclick', 'pointerdown', 'mousedown', 'keydown', 'beforeinput', 'input', 'change', 'submit', 'dragstart', 'drop', 'paste', 'cut'].forEach(ev => window.addEventListener(ev, roGuard, true));

  /* ---------- Start ---------- */
  /* Alles Gespeicherte löschen (Tests, „?fresh=1“ nur auf localhost). all: auch die kleinen Geräte-Einstellungen */
  async function wipe(all){
    clearInterval(beatT); clearTimeout(commitT); clearTimeout(sliceT); clearTimeout(retryT);
    st.frozen = true; st.dirty = false; st.cur = null; st.pass = null;
    try { await idle(); } catch(e){}
    try { if(st.db){ st.db.close(); st.db = null; } } catch(e){}
    await new Promise(res => { try { const r = indexedDB.deleteDatabase(DBN); r.onsuccess = r.onerror = r.onblocked = () => res(); } catch(e){ res(); } });
    try { Object.keys(localStorage).filter(k => all ? k.indexOf(KEY) === 0 : [KEY, JKEY, LKEY, BKEY, RKEY, KEY + '_safety', KEY + '_base', KEY + '_defekt', KEY + '_lastBackup'].includes(k)).forEach(k => localStorage.removeItem(k)); } catch(e){}
  }
  async function preserve(kind, data){ const rec = {at:new Date().toISOString(), kind, ...data}; memKv.set('corrupt', rec); if(st.db){ try { await kvSet('corrupt', rec); } catch(e){ console.warn(e); } } return rec; }
  async function boot(){
    const t0 = performance.now();
    if(isLocal && /[?&]fresh=1\b/.test(location.search)){ await wipe(true); st.frozen = false; }
    const lsOk = (() => { try { localStorage.setItem(KEY + '_probe', '1'); localStorage.removeItem(KEY + '_probe'); return true; } catch(e){ return false; } })();
    const roleP = leaseInit();
    try { st.db = await openDb(); st.mode = 'idb'; } catch(e){ st.db = null; st.mode = lsOk ? 'ls' : 'mem'; st.idbError = String((e && e.message) || e); }
    let res;
    try { res = st.mode === 'idb' ? await loadIdb(roleP) : (await roleP, loadLs()); }
    catch(e){ console.warn('Start:', e); res = {status:'corrupt', kind:'read', error:String((e && e.message) || e)}; }
    if(res.status !== 'ok' && res.status !== 'fresh') st.frozen = true;
    st.fresh = res.status === 'fresh'; st.status = res.status; st.stats.boot = performance.now() - t0;
    return res;
  }
  async function loadIdb(roleP){
    const r = await readAll(); await roleP;
    const raw = ls.get(KEY), full = !!raw && !isMarker(raw);
    st.safety = r.safety;
    if(!r.safety){ const sr = ls.get(KEY + '_safety'); if(sr){ try { const sf = JSON.parse(sr); if(sf && sf.data){ const m = {at:sf.at, why:sf.why, nMenu:(sf.data.menu || []).length, nCards:(sf.data.cards || []).length}; await tx(['kv'], 'readwrite', t => { t.objectStore('kv').put(m, 'safetyMeta'); t.objectStore('kv').put({...m, raw:JSON.stringify(sf.data)}, 'safety'); }); st.safety = m; } ls.del(KEY + '_safety'); } catch(e){} } }
    if(!r.meta){
      if(full){ let d; try { d = JSON.parse(raw); } catch(e){ await preserve('ls', {raw}); return {status:'corrupt', kind:'ls'}; }
        if(schemaNewer(d)) return {status:'newer'};
        st.legacy = raw; return {status:'ok', state:d, legacy:true}; }
      /* allererste Änderung, Absturz vor dem ersten Schreiben: die Notiz enthält dann den ganzen Stand */
      const j0 = st.role === 'owner' ? journalRead() : null;
      if(j0 && j0.base === 0 && !(raw && isMarker(raw))){ try { const o = new Map(j0.ch); const state = assemble(id => o.get(id)); if(!schemaNewer(state)){ st.sid = j0.sid || ''; return {status:'ok', state, replay:true}; } } catch(e){} }
      if(j0) ls.del(JKEY);
      if(raw && isMarker(raw)) return {status:'lost'};
      return {status:'fresh'};
    }
    st.rev = +r.meta.rev || 0; st.sid = r.meta.sid || ''; st.metaAt = r.meta.at || 0; st.writer = r.meta.writer || ''; st.pers = r.units; st.savedAt = st.metaAt;
    if(full) st.stray = raw;
    if(+r.meta.schema > APP_SCHEMA) return {status:'newer'};
    let get = id => r.units.get(id), replay = false;
    const j = st.role === 'owner' ? journalRead() : null;
    if(j){
      if(journalFits(j, r.meta) && !journalNews(j, r.units)) ls.del(JKEY);
      else if(journalFits(j, r.meta)){ const o = new Map(j.ch), rm = new Set(j.rm); get = id => o.has(id) ? o.get(id) : rm.has(id) ? undefined : r.units.get(id); replay = true; }
      else if(j.sid !== st.sid) ls.del(JKEY);
      else { try { const o = new Map(j.ch), rm = new Set(j.rm); const u = {}; for(const [id, s] of r.units) if(!rm.has(id)) u[id] = s; for(const [id, s] of o) u[id] = s; assemble(id => u[id]); await snapPut('konflikt', 'Nicht gespeicherte Änderungen aus einem anderen Fenster', {u}, j.base, j.at || now()); } catch(e){} ls.del(JKEY); }
    }
    let state;
    try { state = assemble(get); }
    catch(e){ if(replay){ replay = false; ls.del(JKEY); try { state = assemble(id => r.units.get(id)); } catch(e2){ state = null; } }
      if(!state){ await preserve('idb', {meta:r.meta, units:Object.fromEntries(r.units), error:String(e.message || e)}); return {status:'corrupt', kind:'idb'}; } }
    if(schemaNewer(state)) return {status:'newer'};
    return {status:'ok', state, replay};
  }
  function loadLs(){
    const raw = ls.get(KEY); st.rev = +(ls.get(RKEY) || 0);
    try { const sf = JSON.parse(ls.get(KEY + '_safety')); if(sf && sf.data){ st.safety = {at:sf.at, why:sf.why, nMenu:(sf.data.menu || []).length, nCards:(sf.data.cards || []).length}; memKv.set('safety', {...st.safety, raw:JSON.stringify(sf.data)}); } } catch(e){}
    if(!raw) return {status:'fresh'};
    if(isMarker(raw)) return {status:'unreachable'};
    let d; try { d = JSON.parse(raw); } catch(e){ memKv.set('corrupt', {at:new Date().toISOString(), kind:'ls', raw}); ls.set(KEY + '_defekt', raw); return {status:'corrupt', kind:'ls'}; }
    if(schemaNewer(d)) return {status:'newer'};
    return {status:'ok', state:d};
  }
  /* nach dem ersten Bild: Schreiben freigeben */
  function started(opts){
    st.ready = true; st.frozen = false;
    if(opts && opts.dirty){ st.dirty = true; st.gen++; }
    if(st.dirty) kick();
    else if(st.stray) afterFirstCommit();
    emit('ready');
  }
  /* beschädigter Stand: erst nach der Entscheidung des Nutzers wieder schreiben */
  function resume(){ st.frozen = false; st.ready = true; st.status = 'ok'; st.dirty = true; st.gen++; st.cur = null; st.pass = null; kick(); emit('ready'); }
  async function persistInfo(ask){
    const out = {supported:!!(navigator.storage && navigator.storage.persisted), persisted:null, usage:null, quota:null, mode:st.mode};
    try { if(out.supported){ out.persisted = await navigator.storage.persisted(); if(!out.persisted && ask && navigator.storage.persist) out.persisted = await navigator.storage.persist(); } } catch(e){}
    try { if(navigator.storage && navigator.storage.estimate){ const e = await navigator.storage.estimate(); out.usage = e.usage; out.quota = e.quota; } } catch(e){}
    st.persist = out; return out;
  }
  window.addEventListener('pagehide', e => { flushNow(); if(st.role === 'owner' && !e.persisted){ const l = leaseRead(); if(l && l.id === TAB) ls.del(LKEY); } });
  window.addEventListener('pageshow', e => { if(e.persisted) beat(); });
  document.addEventListener('visibilitychange', () => { if(document.hidden) flushNow(); else beat(); });

  /* ---------- Für Tests und Fehlersuche ---------- */
  async function read(){ await idle(); if(st.mode === 'idb' && st.db){ const r = await op(readAll()); return r.meta ? assemble(id => r.units.get(id)) : null; } const raw = ls.get(KEY); return raw && !isMarker(raw) ? JSON.parse(raw) : null; }
  async function replace(d){
    await idle(); st.frozen = true; clearTimeout(commitT); clearTimeout(sliceT); st.dirty = false; ls.del(JKEY);
    if(st.mode === 'idb' && st.db){ const u = unitsOf(d), rev = st.rev + 1; await op(tx(['kv', 'units'], 'readwrite', t => { const us = t.objectStore('units'); us.clear(); for(const [id, s] of u) us.put(s, id); t.objectStore('kv').put({rev, sid:st.sid || (st.sid = TAB + 'r'), schema:+d.schema || 1, at:now(), writer:TAB, build:APP_BUILD}, 'meta'); })); st.rev = rev; st.pers = u; if(!isMarker(ls.get(KEY))) ls.set(KEY, JSON.stringify({_store:'idb', rev, at:new Date().toISOString()})); }
    else { ls.set(KEY, JSON.stringify(d)); ls.set(RKEY, String(++st.rev)); }
  }
  return { st, TAB, boot, started, resume, save, flush:flushNow, idle, retry, read, replace, wipe, on:f => { subs.push(f); }, plan, assemble, unitsOf,
    kvGet, kvSet, preserve, snaps:snapList, snapLoad, snapDelete, snapNow, snapPut, safetyStore, safetyData, safetyClear, baseLoad, baseGet, baseSet,
    takeover, persistInfo, isReader:() => st.role !== 'owner', describe,
    status(){ return {mode:st.mode, role:st.role, confirmed:st.confirmed, dirty:st.dirty, writing:!!st.fly, error:st.error, savedAt:st.savedAt, rev:st.rev, journalOk:st.journalOk, fresh:st.fresh}; } };
})();
try { window.__store = STORE; } catch(e){}
/* Das Lesen aus dem Speicher beginnt sofort und läuft, während der Rest der App geladen wird. Gezeichnet wird erst danach (reliab.js: relStart). */
const BOOT_P = STORE.boot();
function save(){ STORE.save(); }
function load(){ return null; }
