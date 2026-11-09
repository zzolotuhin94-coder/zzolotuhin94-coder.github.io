/* =====================================================================
   Begleitung, Teil 3: Aufgaben, Stempelkarte, Begriffe, Hilfe in den Einstellungen.
   Aufgaben zählen nur, was seit dem ersten Start wirklich getan wurde.
   Demodaten erledigen nichts von selbst.
   ===================================================================== */

/* ---------- Spielstand in S.game (wandert mit Sicherung und Cloud mit) ---------- */
const GD_ACT_LISTS = ['prices','alg','recipes','linked'];
const GD_ACT_NUMS = ['sent','recv','inv','kasse','pdf','backup','sim','tour'];
function guideMigrate(d){
  if(!d || typeof d !== 'object') return d;
  if(!d.game || typeof d.game !== 'object') d.game = {done:{}, started:todayStr()};
  const g = d.game;
  if(!g.acts || typeof g.acts !== 'object') g.acts = {};
  GD_ACT_LISTS.forEach(k => { if(!Array.isArray(g.acts[k])) g.acts[k] = []; });
  GD_ACT_NUMS.forEach(k => { if(!(+g.acts[k] >= 0)) g.acts[k] = 0; });
  if(!g.stamps || typeof g.stamps !== 'object' || Array.isArray(g.stamps)) g.stamps = {};
  return d;
}
function gdGame(){ guideMigrate(S); return S.game; }
function gdActs(){ return gdGame().acts; }
function gdAct(k){ const a = gdActs(); a[k] = (+a[k] || 0) + 1; gdStampCheck(); save(); if(view.tab === 'aufbau' || view.tab === 'stempel') render(); }

/* Was hat sich seit dem letzten Blick geändert? Nur Übergänge zählen. */
let GSNAP = null;
function gdCardFull(c){ return c.type === 'dish' && c.items.length > 0 && c.items.every(i => refObj(i.ref) && +i.qty > 0) && (c.steps||[]).some(s => s.t && s.t.trim()) && !!c.img; }
function gdSnap(){
  return {S,
    conf:new Set(S.products.filter(p => !p.priceDemo && !p.noStock).map(p => p.id)),
    alg:new Set(S.menu.filter(hasAlg).map(m => m.id)),
    full:new Set(S.cards.filter(gdCardFull).map(c => c.id)),
    link:new Set(S.menu.filter(m => m.card && C(m.card)).map(m => m.id)),
    sent:new Set((S.orders||[]).filter(o => o.sentAt && o.status !== 'draft' && o.status !== 'approval').map(o => o.id)),
    ins:new Set((S.moves||[]).filter(m => m.type === 'in').map(m => m.id)),
    inv:(S.inventories||[]).length, imp:(S.salesImports||[]).length};
}
function gdTick(){
  if(!S || !Array.isArray(S.products)) return false;
  const n = gdSnap(), p = GSNAP; GSNAP = n;
  if(!p || p.S !== S) return false; // erster Blick oder Daten ersetzt: nur merken
  const a = gdActs(); let ch = false;
  const sets = [['prices','conf'], ['alg','alg'], ['recipes','full'], ['linked','link']];
  sets.forEach(([k, s]) => {
    n[s].forEach(id => { if(!p[s].has(id) && !a[k].includes(id)){ a[k].push(id); ch = true; } });
    const keep = a[k].filter(id => n[s].has(id)); if(keep.length !== a[k].length){ a[k] = keep; ch = true; }
  });
  let k = 0; n.sent.forEach(id => { if(!p.sent.has(id)) k++; }); if(k){ a.sent += k; ch = true; }
  let got = false; n.ins.forEach(id => { if(!p.ins.has(id)) got = true; }); if(got){ a.recv += 1; ch = true; }
  if(n.inv > p.inv){ a.inv += n.inv - p.inv; ch = true; }
  if(n.imp > p.imp){ a.kasse += n.imp - p.imp; ch = true; }
  return ch;
}
function gdTrack(){ const a = gdTick(); const b = gdStampCheck(); return a || b; }
const _saveGd = save;
save = function(){ try { gdTick(); gdStampCheck(); } catch(e){ console.warn('Aufgaben:', e); } _saveGd(); };
/* PDF der Speisekarte und Sicherung: zählen erst, wenn die Datei wirklich gespeichert ist */
const _saveFileGd = saveFile;
saveFile = async function(name, data){
  const ok = await _saveFileGd(name, data);
  try { if(ok && /^Speisekarte.*\.pdf$/i.test(name)) gdAct('pdf'); else if(ok && /^dahuam202-kueche-.*\.json$/.test(name)) gdAct('backup'); } catch(e){}
  return ok;
};

/* ---------- Aufgaben ---------- */
const TIERS = ['Start', 'Alltag', 'Profi'];
const MS_LEVELS = [[0,'Talstation'], [5,'Mittelstation'], [11,'Bergstation'], [16,'Gipfel']];
function msStation(k){ const s = stations().find(x => x.k === k); return s || {done:0, total:1}; }
function msPriceGo(){ if(S.products.some(p => p.priceDemo && !p.noStock)){ view.pcBack = null; pcStart(); setTimeout(() => tourStart('pcheck'), 120); } else { go('products'); setTimeout(() => tourStart('products'), 120); } }
function msRecipeTarget(){
  const dishes = S.cards.filter(c => c.type === 'dish' && !gdCardFull(c));
  const score = c => (c.items.length && c.items.every(i => refObj(i.ref) && +i.qty > 0) ? 2 : 0) + ((c.steps||[]).some(s => s.t && s.t.trim()) ? 2 : 0) + (S.menu.some(m => m.card === c.id) ? 1 : 0);
  return dishes.sort((a,b) => score(b) - score(a))[0] || null;
}
function msRecipeMissing(c){ const out = []; if(!(c.items.length && c.items.every(i => refObj(i.ref) && +i.qty > 0))) out.push('Zutaten'); if(!(c.steps||[]).some(s => s.t && s.t.trim())) out.push('Schritte'); if(!c.img) out.push('Foto'); return out; }
const MISSIONS = [
  {id:'tour', tier:0, ico:'aufbau', t:'Rundgang ansehen', short:'Rundgang', goal:1, n:() => gdActs().tour, wozu:'Zwei Minuten, dann wissen Sie, wo was ist.', go:() => tourStart('main')},
  {id:'prices5', tier:0, ico:'tag', edit:1, t:'5 echte Preise eintragen', short:'5 Preise', goal:5, n:() => gdActs().prices.length, wozu:'Erst mit Ihren Einkaufspreisen stimmt, was ein Gericht kostet.', go:msPriceGo},
  {id:'recipe1', tier:0, ico:'plate', edit:1, t:'Erstes Rezept komplett machen', short:'Erstes Rezept', goal:1, n:() => gdActs().recipes.length,
    wozu:'Zutaten, Schritte und ein Foto. Dann kann es jeder in der Küche nachkochen.',
    info:() => { const c = msRecipeTarget(); if(!c) return ''; const miss = msRecipeMissing(c); return miss.length ? `${c.name}: Es ${miss.length === 1 ? 'fehlt' : 'fehlen'} noch ${miss.join(' und ')}.` : ''; },
    go:() => { const c = msRecipeTarget(); if(c){ go('cards', c.id); setTimeout(() => tourStart('card'), 120); } else { go('cards'); setTimeout(() => tourStart('cards'), 120); } }},
  {id:'alg5', tier:0, ico:'leaf', edit:1, t:'Allergene für 5 Gerichte', short:'5 × Allergene', goal:5, n:() => gdActs().alg.length, wozu:'In Österreich müssen die Allergene auf der Karte stehen.', go:() => { view.sec = 'noalg'; view.mtab = 'calc'; go('menu'); setTimeout(() => tourStart('alg'), 120); }},
  {id:'order1', tier:0, ico:'cart', edit:1, t:'Erste Bestellung senden', short:'Erste Bestellung', goal:1, n:() => gdActs().sent, wozu:'Die App schlägt vor, was fehlt. Sie schicken es dem Lieferanten.', go:() => { view.stab = 'bestellung'; view.order = null; view.recv = null; go('buy'); setTimeout(() => tourStart('buy'), 120); }},

  {id:'recv1', tier:1, ico:'truck', t:'Erste Lieferung prüfen', short:'Erste Lieferung', goal:1, n:() => gdActs().recv, wozu:'Menge und Preis prüfen, dann stimmt das Lager.',
    go:() => { const o = (S.orders||[]).find(x => ['sent','confirmed'].includes(x.status)); view.stab = 'bestellung'; if(o){ view.order = o.id; view.recv = o.id; go('buy'); setTimeout(() => tourStart('recv'), 120); } else { view.order = null; view.recv = null; view.stab = 'bestand'; go('stock'); setTimeout(() => tourStart('stock'), 120); } }},
  {id:'inv1', tier:1, ico:'clip', t:'Erste Inventur', short:'Erste Inventur', goal:1, n:() => gdActs().inv, wozu:'Einmal alles zählen. Dann wissen Sie, was wirklich da ist.', go:() => { view.stab = 'inventur'; view.order = null; view.recv = null; go('stock'); setTimeout(() => tourStart('inventur'), 120); }},
  {id:'prices20', tier:1, ico:'coins', edit:1, t:'20 Preise geprüft', short:'20 Preise', goal:20, n:() => gdActs().prices.length, wozu:'Je mehr echte Preise, desto genauer die Rechnung.', go:msPriceGo},
  {id:'link5', tier:1, ico:'cards', edit:1, t:'5 Gerichte mit einer Rezeptur verbinden', short:'5 × Rezeptur', goal:5, n:() => gdActs().linked.length, wozu:'Erst mit Rezeptur weiß die App, was ein Gericht kostet.', go:() => { view.sec = 'none'; view.mtab = 'calc'; go('menu'); setTimeout(() => tourStart('link'), 120); }},
  {id:'pdf', tier:1, ico:'download', t:'Speisekarte als PDF speichern', short:'Karte als PDF', goal:1, n:() => gdActs().pdf, wozu:'Eine Datei zum Drucken oder Verschicken.', go:() => { view.mtab = 'guest'; go('menu'); setTimeout(() => tourStart('guest'), 120); }},
  {id:'backup', tier:1, ico:'copy', t:'Erste Sicherung speichern', short:'Sicherung', goal:1, n:() => gdActs().backup, wozu:'Eine Datei mit allen Daten. Damit geht nichts verloren.', go:() => { go('setup'); setTimeout(() => tourStart('backup'), 120); }},

  {id:'kasse', tier:2, ico:'report', t:'Kassendatei importieren', short:'Kasse', goal:1, n:() => gdActs().kasse, wozu:'Dann sehen Sie, was verkauft wurde und was es gebracht hat.', go:() => { view.rp.tab = 'import'; go('report'); setTimeout(() => tourStart('rimport'), 120); }},
  {id:'sim', tier:2, ico:'sparkle', edit:1, t:'Einen Preis im Simulator ändern', short:'Preis geändert', goal:1, n:() => gdActs().sim, wozu:'Ausprobieren, was ein anderer Preis bringt, und dann übernehmen.',
    go:() => { const m = S.menu.find(x => x.card && C(x.card)); if(m){ go('cards', m.card); setTimeout(() => tourStart('sim'), 120); } else go('cards'); }},
  {id:'allprices', tier:2, ico:'tag', edit:1, t:'Alle Preise bestätigt', short:'Alle Preise', data:1, goal:() => msStation('prices').total, n:() => msStation('prices').done, wozu:'Kein Beispielpreis mehr: Die ganze Rechnung stimmt.', go:msPriceGo},
  {id:'allrecipes', tier:2, ico:'pot', edit:1, t:'Jedes Gericht hat eine Rezeptur', short:'Alle Rezepturen', data:1, goal:() => msStation('recipes').total, n:() => msStation('recipes').done, wozu:'Dann kennt die App den Wareneinsatz der ganzen Karte.', go:() => { view.sec = 'none'; view.mtab = 'calc'; go('menu'); setTimeout(() => tourStart('link'), 120); }},
  {id:'allalg', tier:2, ico:'check', edit:1, t:'Allergene für jedes Gericht', short:'Alle Allergene', data:1, goal:() => msStation('menu').total, n:() => msStation('menu').done, wozu:'Die Gästekarte ist damit vollständig.', go:() => { view.sec = 'noalg'; view.mtab = 'calc'; go('menu'); setTimeout(() => tourStart('alg'), 120); }},
];
TOURS.link = {id:'link', name:'Rezeptur verbinden', steps:[
  {t:'Gerichte ohne Rezeptur', sel:'#app [data-act="sec"][data-id="none"]', x:'Der Filter zeigt jetzt nur Gerichte, bei denen die App noch nicht weiß, was hineinkommt.'},
  {t:'Gericht öffnen', sel:() => gq('#app table.lt tbody tr.row') || gq('#app [data-act="editMenu"]'), x:'Im Fenster wählen Sie bei „Rezeptur“ eine vorhandene aus und speichern.', do:{hint:'Tippen Sie auf ein Gericht, wählen Sie eine Rezeptur und speichern Sie.', init:c => { c.n = S.menu.filter(m => m.card && C(m.card)).length; }, done:c => S.menu.filter(m => m.card && C(m.card)).length > c.n}},
  {t:'Noch keine Rezeptur da?', sel:'.side .nav-i[data-tab="cards"], .bottom .nav-i[data-tab="cards"]', x:'Neue Rezepturen legen Sie unter „Rezepturen“ an. Danach verbinden Sie sie hier mit dem Gericht.'},
]};
TOURS.sim = {id:'sim', name:'Preis ausprobieren', steps:[
  {t:'Der Regler', sel:gPanel('#sim'), x:'Der Regler ändert noch nichts. Er zeigt nur, was bei einem anderen Preis übrig bleibt.', do:{hint:'Schieben Sie den Regler auf einen anderen Preis.', init:c => { c.v = view.sim ? view.sim.price : null; }, done:c => !!view.sim && view.sim.price !== c.v}},
  {t:'Übernehmen', sel:'#simApply', x:'Gefällt Ihnen der neue Preis? Dann steht er mit einem Tipp auf der Speisekarte.', do:{hint:'Tippen Sie auf „Übernehmen“. Den alten Preis können Sie jederzeit wieder einstellen.', init:c => { c.n = gdActs().sim; }, done:c => gdActs().sim > c.n}},
]};
TOURS.backup = {id:'backup', name:'Sicherung', steps:[
  {t:'Sicherung erstellen', sel:'#app [data-act="export"]', x:'Die Sicherung ist eine Datei mit allen Daten der App. Heben Sie sie gut auf, zum Beispiel auf einem USB-Stick.', do:{ro:1, hint:'Tippen Sie auf „Sicherung erstellen“ und dann auf „Datei speichern“.', init:c => { c.n = gdActs().backup; }, done:c => gdActs().backup > c.n}},
  {t:'Sicherung laden', sel:'#app [data-act="importPick"]', x:'Neues Gerät oder etwas ging schief? Hier holen Sie die Daten aus der Datei zurück.'},
]};
function msState(){
  const g = gdGame(); const can = canEditAll();
  return MISSIONS.map((m, i) => { const goal = typeof m.goal === 'function' ? Math.max(1, m.goal()) : m.goal; let n = 0; try { n = Math.max(0, Math.min(goal, +m.n() || 0)); } catch(e){}
    return {m, i, no:i+1, goal, n, done:!!g.stamps[m.id], date:g.stamps[m.id] || '', ro: !!m.edit && !can, pct:Math.round(n / goal * 100)}; });
}
function msLevel(k){ let i = 0; MS_LEVELS.forEach(([n], j) => { if(k >= n) i = j; }); return {i, name:MS_LEVELS[i][1], next:MS_LEVELS[i+1] || null}; }
function gdStampCheck(){
  if(!S || !S.game) return false; const g = gdGame(); let ch = false;
  MISSIONS.forEach(m => { if(g.stamps[m.id]) return; let n = 0, goal = 1; try { n = +m.n() || 0; goal = typeof m.goal === 'function' ? Math.max(1, m.goal()) : m.goal; } catch(e){ return; }
    if(n >= goal){ g.stamps[m.id] = todayStr(); ch = true; if(g.minit){ g.rq = g.rq || []; g.rq.push(m.id); } } });
  if(!g.minit){ g.minit = true; ch = true; }
  return ch;
}
function missionGo(id){
  const m = MISSIONS.find(x => x.id === id); if(!m) return;
  if(m.edit && !canEditAll()){ toast('Diese Aufgabe ist für Küchenchef oder Inhaber.'); return; }
  try { m.go(); } catch(e){ console.warn(e); }
}

/* ---------- Stempel: selbst gezeichnet, leicht schief wie von Hand gedrückt ---------- */
function stampSvg(m, on, size){
  const h = [...m.id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 997, 7); const rot = on ? (h % 19) - 9 : 0;
  if(!on) return `<svg class="stamp-svg" width="${size||72}" height="${size||72}" viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="31" class="e"/><g transform="translate(24 24)" class="ic">${ICO[m.ico] || ICO.check}</g></svg>`;
  // Rundstempel: Schrift im Ring, Zeichen in der Mitte, leicht schief gedrückt
  return `<svg class="stamp-svg on" width="${size||72}" height="${size||72}" viewBox="0 0 72 72" aria-hidden="true"><g transform="rotate(${rot} 36 36)" filter="url(#skInk)"><circle cx="36" cy="36" r="33" class="o"/><circle cx="36" cy="36" r="21.500" class="i"/><text class="tx"><textPath href="#skRing" startOffset="0">DAHUAM.202 · GERLOS · ERLEDIGT ·</textPath></text><g transform="translate(25.200 25.200) scale(.9)" class="ic">${ICO[m.ico] || ICO.check}</g></g></svg>`;
}
(function(){ if(document.getElementById('skDefs')) return; const d = document.createElement('div'); d.id = 'skDefs'; d.setAttribute('aria-hidden', 'true'); d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = '<svg width="0" height="0"><defs><path id="skRing" d="M36 36m-25.300 0a25.300 25.300 0 1 1 50.600 0a25.300 25.300 0 1 1 -50.600 0"/></defs><filter id="skInk" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.3" xChannelSelector="R" yChannelSelector="G"/></filter></svg>'; document.body.appendChild(d); })();

/* ---------- Aufbau: Aufgaben oben, Stand des Betriebs darunter ---------- */
const _renderAufbauGd = renderAufbau;
renderAufbau = function(){
  const old = _renderAufbauGd(); const cut = old.indexOf('<div class="au-sum">'); const stationsHtml = cut >= 0 ? old.slice(cut) : '';
  const ms = msState(); const got = ms.filter(x => x.done).length; const lv = msLevel(got);
  const next = ms.find(x => !x.done && !x.ro) || null; const open = view.msOpen || {};
  const row = x => { const m = x.m; const cls = x.done ? 'done' : x.ro ? 'ro' : (next && next.m.id === m.id) ? 'next' : 'open';
    const info = !x.done && m.info ? m.info() : '';
    return `<li class="ms-row ${cls}">
      <span class="ms-st">${x.done ? ico('check') : x.no}</span>
      <span class="ms-t"><b>${esc(m.t)}</b><small>${esc(info || m.wozu)}</small></span>
      <span class="ms-p">${x.done ? `<span class="ms-date">Stempel vom ${fmtDate(x.date + 'T12:00:00').slice(0,6)}</span>` : `<span>${num(x.n)} von ${num(x.goal)}</span><span class="au-m"><i style="width:${x.pct}%"></i></span>`}</span>
      <span class="ms-a">${x.done ? '' : x.ro ? '<span class="ms-ro">für Küchenchef/Inhaber</span>' : `<button type="button" class="btn sm" data-act="missionGo" data-id="${m.id}">${x.n > 0 ? 'Weiter' : 'Starten'}</button>`}</span></li>`; };
  const tiers = TIERS.map((name, t) => { const list = ms.filter(x => x.m.tier === t); const dn = list.filter(x => x.done).length;
    const isOpen = open[t] != null ? open[t] : (next ? next.m.tier === t : t === 0);
    return `<section class="ms-tier ${dn === list.length ? 'all' : ''}"><h2 class="ms-th"><button type="button" data-act="msTier" data-id="${t}" aria-expanded="${isOpen}"><span class="ms-chev" aria-hidden="true"></span>${name}<small>${dn} von ${list.length}</small></button></h2>${isOpen ? `<ol class="ms-list">${list.map(row).join('')}</ol>` : ''}</section>`; }).join('');
  const nx = next ? `<section class="ms-next" aria-label="Nächste Aufgabe">
      <div class="ms-next-t"><span class="ms-kick">Als Nächstes</span><h2>${esc(next.m.t)}</h2><p>${esc((next.m.info && next.m.info()) || next.m.wozu)}</p></div>
      <div class="ms-next-p"><b>${num(next.n)} von ${num(next.goal)}</b><span class="au-m big"><i style="width:${next.pct}%"></i></span></div>
      <button type="button" class="btn primary ms-go" data-act="missionGo" data-id="${next.m.id}">${next.n > 0 ? 'Weitermachen' : 'Los geht’s'}${ico('arrow','flip')}</button></section>`
    : got >= ms.length ? `<p class="ms-alldone">${ico('check')}Alle Aufgaben erledigt. Sie sind am Gipfel.</p>` : `<p class="ms-alldone">Die offenen Aufgaben sind für Küchenchef oder Inhaber.</p>`;
  return `<div class="page-h"><div><h1>Aufbau</h1></div><div class="row-btns"><button type="button" class="btn ms-sk" data-act="goTab" data-id="stempel">Stempelkarte</button></div></div>
  <div class="ms-lvl"><span class="ms-lvl-n">${esc(lv.name)}</span><span class="ms-lvl-t">${got} von ${ms.length} Stempeln${lv.next ? ` · noch ${lv.next[0] - got} bis ${esc(lv.next[1])}` : ''}</span><span class="ms-pips" aria-hidden="true">${ms.map(x => `<i class="${x.done ? 'on' : ''}"></i>`).join('')}</span></div>
  ${nx}
  <div class="ms-tiers">${tiers}</div>
  <h2 class="sec-h ms-sth">Stand des Betriebs</h2>
  ${stationsHtml}`;
};

/* ---------- Stempelkarte ---------- */
function renderStempel(){
  const ms = msState(); const got = ms.filter(x => x.done).length; const lv = msLevel(got);
  const cell = x => `<button type="button" class="stamp ${x.done ? 'on' : ''}" data-act="stampInfo" data-id="${x.m.id}" aria-label="${esc(x.m.t)}: ${x.done ? 'Stempel erhalten' : 'noch offen'}">${stampSvg(x.m, x.done)}<b>${esc(x.m.short)}</b><small>${x.done ? fmtDate(x.date + 'T12:00:00').slice(0,6) : `${num(x.n)} von ${num(x.goal)}`}</small></button>`;
  return `<button type="button" class="back" data-act="goTab" data-id="aufbau">${ico('arrow')}Aufbau</button>
  <div class="page-h"><div><h1>Stempelkarte</h1><p class="sub">Für jede erledigte Aufgabe ein Stempel. Tippen Sie auf einen Stempel, um zu sehen, wofür er ist.</p></div></div>
  <section class="sk-card">
    <header class="sk-h"><div><span class="sk-brand">DAHUAM.202</span><span class="sk-title">Stempelkarte</span></div><div class="sk-lvl"><b>${esc(lv.name)}</b><span>${got} von ${ms.length}</span></div></header>
    ${TIERS.map((name, t) => `<div class="sk-tier"><h2>${name}</h2><div class="sk-grid">${ms.filter(x => x.m.tier === t).map(cell).join('')}</div></div>`).join('')}
    <footer class="sk-f"><span>${MS_LEVELS.map(([n, l], i) => `<span class="${lv.i >= i ? 'on' : ''}">${l}${n ? ` ab ${n}` : ''}</span>`).join('<i aria-hidden="true"></i>')}</span></footer>
  </section>
  <p class="hint sk-hint">Stempel gibt es nur für das, was Sie selbst in der App gemacht haben. Die Demodaten zählen nicht.</p>`;
}

/* ---------- Belohnung: die ruhige Goldkarte, ohne Funken ---------- */
function gdRewards(){
  if(!S || !S.game || GD.t || document.querySelector('.reward') || document.querySelector('dialog[open]')) return;
  const g = gdGame(); if(!g.rq || !g.rq.length) return;
  const id = g.rq.shift(); _saveGd(); const m = MISSIONS.find(x => x.id === id); if(!m) return;
  const ms = msState(); const got = ms.filter(x => x.done).length; const lv = msLevel(got); const nx = ms.find(x => !x.done && !x.ro);
  const up = MS_LEVELS.some(([n]) => n === got && n > 0);
  const el = document.createElement('div'); el.className = 'reward gd-rw'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Stempel erhalten');
  el.innerHTML = `<div class="rw-box"><div class="gd-rw-stamp">${stampSvg(m, true, 88)}</div>
    <div class="eyebrow">Stempel ${got} von ${ms.length}${up ? ` · ${esc(lv.name)} erreicht` : ''}</div><h2>${esc(m.t)}</h2>
    <p>${nx ? `Als Nächstes: ${esc(nx.m.t)}.` : 'Das war die letzte Aufgabe. Sie sind am Gipfel.'}</p>
    <div class="row-btns rw-acts">${nx ? `<button type="button" class="btn gold" data-rw="next" data-act="missionGo" data-id="${nx.m.id}">Weiter</button>` : ''}<button type="button" class="btn" data-rw="close" data-act="goTab" data-id="stempel">Stempelkarte</button></div><button type="button" class="rw-x icon-btn" data-rw="close" aria-label="Schließen">${ico('x')}</button></div>`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('in'));
  const live = document.getElementById('toast'); if(live && !live.classList.contains('show')){ /* für Vorleser */ el.setAttribute('aria-live', 'polite'); }
  const bye = () => { el.classList.remove('in'); setTimeout(() => { el.remove(); gdRewards(); }, 320); };
  el.addEventListener('click', e => { if(e.target.closest('[data-rw]')) bye(); });
  el._t = setTimeout(bye, 11000);
  el.addEventListener('pointerenter', () => clearTimeout(el._t)); el.addEventListener('pointerleave', () => { el._t = setTimeout(bye, 5000); });
  if(view.tab === 'aufbau' || view.tab === 'stempel') render();
}

/* ---------- Begriffe ---------- */
function renderBegriffe(){
  const list = Object.values(HELP).filter(h => h.g).sort((a,b) => a.t.localeCompare(b.t, 'de'));
  let last = '', body = '';
  list.forEach(h => { const L = h.t.replace(/^[^A-Za-zÄÖÜäöü]+/, '')[0].toUpperCase().replace('Ä','A').replace('Ö','O').replace('Ü','U');
    if(L !== last){ if(last) body += '</div>'; body += `<div class="bg-grp"><div class="bg-l" aria-hidden="true">${L}</div>`; last = L; }
    body += `<div class="bg-e" id="bg-${h.k}" data-s="${esc((h.t + ' ' + h.x).toLowerCase())}"><dt>${esc(h.t)}</dt><dd>${esc(h.x)}</dd></div>`; });
  if(last) body += '</div>';
  return `<div class="page-h"><div><h1>Begriffe<span class="h-n">${list.length}</span></h1><p class="sub">Fachwörter der App, kurz erklärt. Im Hilfe-Modus „Was ist das?“ erklärt die App dieselben Wörter dort, wo sie stehen.</p></div></div>
  <div class="toolbar"><label class="search bg-search">${ico('search')}<input id="bq" type="search" placeholder="Begriff suchen, zum Beispiel Schwund" value="${esc(view.bq || '')}" autocomplete="off" aria-label="Begriff suchen"></label></div>
  <dl class="bg-list">${body}</dl><p class="hint bg-none" hidden>Dazu gibt es keinen Begriff. Probieren Sie ein anderes Wort.</p>`;
}
function bgFilter(){
  const q = (view.bq || '').trim().toLowerCase(); let n = 0;
  document.querySelectorAll('#app .bg-e').forEach(e => { const on = !q || e.dataset.s.includes(q); e.hidden = !on; if(on) n++; });
  document.querySelectorAll('#app .bg-grp').forEach(g => { g.hidden = !g.querySelector('.bg-e:not([hidden])'); });
  const none = document.querySelector('#app .bg-none'); if(none) none.hidden = n > 0;
}
function bgAfter(){
  bgFilter();
  if(view.bgo){ const el = document.getElementById('bg-' + view.bgo); view.bgo = null; if(el) setTimeout(() => { el.scrollIntoView({block:'center'}); el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 2600); }, 60); }
}
document.addEventListener('input', e => { if(e.target.id === 'bq'){ view.bq = e.target.value; bgFilter(); } });

/* ---------- Einstellungen: Hilfe steht oben ---------- */
const _renderSetupGd = renderSetup;
renderSetup = function(){
  let h = _renderSetupGd();
  h = h.replace(/<section class="panel"><div class="panel-h"><h2>Aufbau & Hilfe<\/h2>[\s\S]*?<\/section>/, '');
  const ms = msState(); const got = ms.filter(x => x.done).length; const lv = msLevel(got); const nG = Object.values(HELP).filter(x => x.g).length;
  const panel = `<section class="panel gd-panel"><div class="panel-h"><h2>Hilfe</h2><span class="muted sm">${esc(lv.name)} · ${got} von ${ms.length} Stempeln</span></div>
    <ul class="gd-rows">
      <li><span class="gd-r-t"><b>Rundgang</b><small>Zeigt in zwei Minuten alle Bereiche der App.</small></span><button type="button" class="btn sm" data-act="tourMain">Starten</button></li>
      <li><span class="gd-r-t"><b>Ansicht</b><small>Einfach zeigt nur das Wichtigste, mit großen Knöpfen und einfachen Wörtern.</small></span><span class="seg gd-keep" role="group" aria-label="Ansicht"><button type="button" class="${isSimple() ? 'on' : ''}" data-act="guideMode" data-id="simple" aria-pressed="${isSimple()}">Einfach</button><button type="button" class="${isSimple() ? '' : 'on'}" data-act="guideMode" data-id="full" aria-pressed="${!isSimple()}">Alles zeigen</button></span></li>
      <li><span class="gd-r-t"><b>Was ist das?</b><small>Einschalten und auf etwas tippen. Die App erklärt es und ändert dabei nichts.</small></span><button type="button" class="btn sm" data-act="helpMode" aria-pressed="${HELP_ON}">${HELP_ON ? 'Ausschalten' : 'Einschalten'}</button></li>
      <li><span class="gd-r-t"><b>Begriffe</b><small>${nG} Fachwörter, kurz erklärt.</small></span><button type="button" class="btn sm" data-act="goTab" data-id="begriffe">Öffnen</button></li>
      <li><span class="gd-r-t"><b>Aufgaben und Stempelkarte</b><small>Kleine Aufgaben führen Sie durch die App.</small></span><span class="row-btns"><button type="button" class="btn sm" data-act="goTab" data-id="aufbau">Aufgaben</button><button type="button" class="btn sm" data-act="goTab" data-id="stempel">Stempelkarte</button></span></li>
    </ul>
    <p class="hint"><button type="button" class="link" data-act="gdReset">Stempel zurücksetzen</button></p></section>`;
  let i = h.indexOf('<div class="setup-grid">'); if(i < 0) i = h.indexOf('<div class="grid2">'); return i >= 0 ? h.slice(0, i) + panel + h.slice(i) : h + panel;
};
