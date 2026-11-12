/* =====================================================================
   Handy (bis 700 px): eine eigene, ruhige Bedienung über der bestehenden App.
   Heute passt auf einen Bildschirm · Suchen und Scannen · Bestellen · Mehr.
   Keine Tabellen: große Zeilen (Zahl links, Sache rechts), Einzelheiten als Blatt von unten.
   Dieses Modul steht als letztes in build.py. Es umhüllt bestehende Funktionen
   (renderDash, renderBuy, renderStock, renderVorb, renderCards, go, hashWant, fromHash …)
   und ändert sie nicht. Über 700 px läuft alles wie bisher.
   Daten kommen aus den vorhandenen Helfern (supToday, vbPlan, ckDue, ekDue, tmShifts, apDayInfo …).
   ===================================================================== */
const PH_MQ = window.matchMedia('(max-width:700px)');
function phOn(){ return PH_MQ.matches; }
function phS(){ const s = view.ph || (view.ph = {}); if(!('page' in s)) Object.assign(s, {page:null, loc:null, from:'heute', lap:false, buyAll:false, bf:'all', q:'', rq:'', fc:false}); return s; }
const PH = {sheet:null, cnt:null, ord:null};

ICO.phScan = '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M8 8.5v7M11 8.5v7M13.5 8.5v7M16 8.5v7"/>';
ICO.phChev = '<path d="M9.5 6l6 6-6 6"/>';
ICO.phLap = '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 18.5h18"/>';
ICO.phToday = '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M8.5 15l2.3 2.3 4.7-4.8"/>';
ICO.phBack = '<path d="M14.5 6l-6 6 6 6"/>';

/* ---------- Scanner: der Strichcode-Scanner aus scan.js (scanOpen) ----------
   Läuft eine Inventur, zählt er in die Inventur (Zählblatt des Scanners mit Ziffernblock, Flaschen und Zehntel,
   Dazuzählen, Rückgängig; die Kamera läuft dahinter weiter). Sonst schlägt er den Artikel nach.
   Ohne Kamera bietet der Scanner selbst „Code eintippen“ und „Artikel suchen“, unbekannte Codes lernt er. */
function phScan(){ scanOpen(S.invDraft ? 'inv' : 'look'); }

/* ---------- Bausteine ---------- */
function phRow(o){
  const a = (o.act ? ` data-act="${o.act}"` : '') + (o.id != null ? ` data-id="${esc(o.id)}"` : '') + (o.tab ? ` data-tab="${o.tab}"` : '');
  return `<li${o.x ? ' class="hy-hasx"' : ''}><button type="button" class="hy-row ${o.cls || ''}"${a}><span class="hy-n">${o.pre ? `<small>${o.pre}</small>` : ''}${o.n}</span><span class="hy-tm"><b>${o.t}</b>${o.m ? `<small>${o.m}</small>` : ''}</span>${o.e ? `<span class="hy-e">${o.e}</span>` : ''}${ico('phChev', 'hy-chev')}</button>${o.x ? `<div class="hy-xw">${o.x}</div>` : ''}</li>`;
}
function phQty(txt){ const s = String(txt); const i = s.lastIndexOf(' '); return i > 0 ? `${esc(s.slice(0, i))}<small>${esc(s.slice(i + 1))}</small>` : esc(s); }
function phBackBtn(label, act, id){ return `<button type="button" class="hy-back" data-act="${act || 'phBack'}"${id != null ? ` data-id="${esc(id)}"` : ''}>${ico('phBack')}${esc(label)}</button>`; }
function phHead(title, voice, back){ return `${back || ''}<h1 class="hy-h1" tabindex="-1">${esc(title)}</h1>${voice ? `<p class="hy-voice">${voice}</p>` : ''}`; }
function phSec(title, meta){ return `<h2 class="hy-sec">${esc(title)}${meta ? `<span>${meta}</span>` : ''}</h2>`; }
function phShortDay(D){ const t = todayStr(); return D === t ? 'heute' : D === dAdd(t, 1) ? 'morgen' : `${tmWdShort(D)} ${tmDm(D)}`; }
function phLocOf(p){ return LOCS[p.loc] ? p.loc : ''; }
function phLocName(k){ return LOCS[k] || 'Ohne Lagerort'; }
function phLocs(){ return Object.keys(LOCS).concat(['']); }

/* ---------- Seiten des Handys ---------- */
function phKey(){
  const s = phS(); const t = view.tab;
  if(t === 'dash') return s.page || 'heute';
  if(t === 'buy') return view.stab === 'bestellung' && !(view.order && ORD(view.order)) && !s.buyAll ? 'best' : 'x';
  if(t === 'stock') return view.stab === 'inventur' ? 'inv' : view.stab === 'bestand' ? 'bestand' : 'x';
  if(t === 'vorb') return 'vorb';
  if(t === 'cards') return view.card && C(view.card) ? 'rezk' : 'rez';
  return 'x';
}
function phGo(page){
  const s = phS(); phSheetClose(true); if(typeof mehrClose === 'function') mehrClose();
  s.page = page === 'such' || page === 'mehr' ? page : null; s.loc = null; s.buyAll = false;
  view = {...view, tab:'dash', card:null, order:null, recv:null, q:'', daten:null};
  render(); hashSync(); window.scrollTo({top:0});
}
const _goPh = go;
go = function(tab, card){
  const s = phS();
  if(phOn()){ const k = phKey(); if(['heute', 'such', 'mehr', 'best'].includes(k)) s.from = k; phSheetClose(true); }
  s.page = null; s.loc = null; s.buyAll = false; if(tab !== view.tab) s.fc = false;
  return _goPh(tab, card);
};
function phBack(){
  const f = phS().from;
  if(f === 'such') phGo('such'); else if(f === 'best') navGo('buy'); else if(f === 'heute') phGo(null); else phGo('mehr');
}

/* ---------- Heute ---------- */
/* Bedarf bei einem Lieferanten wie in der Bestellung (einkauf.js supNeed: Mindestbestand und Prognose); ein Entwurf zählt als Bedarf */
function phSupNeed(sp, st){ if(st.draft) return st.draft.lines.length ? st.draft.lines : [1]; try { return supNeed(sp.id, st.delivery); } catch(e){ console.warn('Bedarf:', e); return []; } }
function phHeuteRows(){
  const t = todayStr(), w = wd(t); const act = [], done = [];
  const put = (r, isDone) => { if(r) (isDone ? done : act).push(phRow(isDone ? {...r, cls:(r.cls || '') + ' off'} : r)); };
  const safe = fn => { try { fn(); } catch(err){ console.warn('Heute (Handy):', err); } };
  // 1 Bestellen
  safe(() => {
    const due = (S.suppliers || []).filter(sp => sp.active && sp.orderDays.includes(w)).sort((a, b) => hm(a.cutoff) - hm(b.cutoff)).map(sp => ({sp, st:supToday(sp)}));
    const open0 = due.filter(x => x.st.state === 'open'), sent = due.filter(x => x.st.state === 'sent');
    const open = open0.filter(x => phSupNeed(x.sp, x.st).length), calm = open0.filter(x => !open.includes(x));
    if(open.length){ const f = open[0]; put({pre:'bis', n:esc(f.sp.cutoff), t:'Bestellen', m:esc(f.sp.name) + (open.length > 1 ? `, danach ${open.length - 1} ${open.length === 2 ? 'weiterer' : 'weitere'}` : '') + (f.st.urgent ? ` <span class="hy-bad">${esc(f.st.label)}</span>` : ''), cls:'now', tab:'buy'}); }
    else if(calm.length) put({n:'–', t:'Bestellen', m:`Heute nichts nötig${sent.length ? `, ${sent.length} bestellt` : ''}`, tab:'buy'}, true);
    else put({n:sent.length ? ico('check') : '–', t:'Bestellen', m:!due.length ? 'Heute ist kein Bestelltag' : sent.length ? (sent.length === due.length ? 'Heute alles bestellt' : `${sent.length} bestellt, sonst Annahmeschluss vorbei`) : 'Annahmeschluss heute vorbei', tab:'buy'}, true);
  });
  // 2 Vorbereitung
  safe(() => {
    const ix = plIdx(); if(!ix.days.length){ put({n:'–', t:'Vorbereitung', m:'Noch keine Verkäufe für eine Prognose', act:'plGo', id:0}, true); return; }
    let off = 0; if(vbForecast(t).closed) off = 1; const D = dAdd(t, off); const fc = vbForecast(D);
    if(fc.closed || fc.mode === 'none'){ put({n:'–', t:'Vorbereitung', m:fc.closed ? 'Ruhetag, nichts vorzubereiten' : 'Keine Prognose für heute', act:'plGo', id:off}, true); return; }
    const pl = vbPlan(D); const chk = planState().chk[D] || {};
    const items = pl.groups.flatMap(g => g.items.filter(i => !i.minor || chk[i.key])); const left = items.filter(i => !chk[i.key]).length;
    const bLeft = pl.groups.filter(g => g.k === 'b').flatMap(g => g.items).filter(i => !chk[i.key]).length;
    const miss = pl.nMiss ? ` <span class="hy-bad">${pl.nMiss} ${pl.nMiss === 1 ? 'Zutat fehlt' : 'Zutaten fehlen'}</span>` : '';
    const when = off ? ' für morgen' : '';
    if(items.length && !left) put({n:ico('check'), t:'Vorbereitung', m:`Alles vorbereitet${when}`, act:'plGo', id:off}, true);
    else if(bLeft) put({n:num(bLeft), t:'Vorbereitung', m:(bLeft === 1 ? 'Basisrezept vorkochen' : 'Basisrezepte vorkochen') + when + miss, act:'plGo', id:off});
    else put({pre:'etwa', n:num(pl.total), t:'Vorbereitung', m:`Portionen erwartet${when}` + miss, act:'plGo', id:off});
  });
  // 3 Checklisten
  safe(() => {
    const D = ckToday(); const late = D !== t || nowMin() >= DH_EVENING;
    const due = ckDue(D).map(tp => ({tp, pr:ckProg(tp, D)})).filter(x => late || !dhEvening(x.tp) || x.pr.started); if(!due.length) return;
    const open = due.filter(x => !x.pr.full);
    if(!open.length){ put({n:ico('check'), t:'Checklisten', m:due.length === 1 ? `${esc(due[0].tp.name)} erledigt` : `Alle ${due.length} Listen erledigt`, act:'ckGo', id:''}, true); return; }
    const f = open[0]; const more = open.length > 1 ? `, danach ${open.length - 1} ${open.length === 2 ? 'weitere' : 'weitere'}` : '';
    put({n:`${f.pr.done}/${f.pr.total}`, t:esc(f.tp.name), m:(more ? `Und ${open.length - 1} ${open.length === 2 ? 'weitere Liste' : 'weitere Listen'}` : f.pr.done ? 'Checkliste läuft' : 'Checkliste, noch nicht begonnen') + (f.pr.out ? ` <span class="hy-bad">${f.pr.out} ${f.pr.out === 1 ? 'Wert' : 'Werte'} außerhalb</span>` : ''), act:'ckGo', id:f.tp.id});
  });
  // 4 Eigenkontrolle
  safe(() => {
    const D = ckToday(); const d = ekDue(D); const k = ekS();
    if(!d.any){ if(d.cl.length || k.fryers.length) put({n:ico('check'), t:'Eigenkontrolle', m:'Für heute erledigt', act:'ekOpen', id:''}, true); return; }
    const parts = [];
    if(d.oil.length) parts.push(`<span class="hy-bad">Frittieröl ${esc(ekOilDueTxt(d.oil[0].st).replace(/^Wechsel /, ''))}</span>`);
    if(d.open.length) parts.push(d.over.length ? `<span class="hy-bad">Reinigungsplan: ${d.over.length} überfällig</span>` : `Reinigungsplan: ${d.open.length} offen`);
    const many = k.fryers.length > 1;
    const x = d.oil.map(({f}) => `<button type="button" class="hy-pill" data-act="dhOil" data-id="${esc(f.id)}">${ico('check')}Öl gewechselt${many ? ' · ' + esc(f.name) : ''}</button>`).join('');
    put({n:String(d.open.length + d.oil.length), t:'Eigenkontrolle', m:parts[0], act:'ekOpen', id:d.oil.length && !d.over.length ? 'oil' : d.open.length ? 'clean' : 'oil', x});
  });
  // 5 Lieferung
  safe(() => {
    const exp = (S.orders || []).filter(o => ['sent', 'confirmed'].includes(o.status) && o.deliveryDate <= t).sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));
    if(!exp.length){ const got = (S.orders || []).filter(o => o.receipt && String(o.receipt.date).slice(0, 10) === t).length;
      put({n:got ? ico('check') : '–', t:'Lieferung', m:got ? (got === 1 ? 'Heute geprüft und eingebucht' : `${got} Lieferungen heute eingebucht`) : 'Heute kommt nichts Bestelltes', tab:'buy'}, true); return; }
    const o = exp[0]; const sp = SUP(o.supplier); const late = o.deliveryDate < t;
    put({n:String(exp.length), t:exp.length === 1 ? 'Lieferung heute' : 'Lieferungen heute', m:(late ? '<span class="hy-bad">überfällig:</span> ' : '') + esc(sp ? sp.name : '?') + (exp.length > 1 ? ` und ${exp.length - 1} ${exp.length === 2 ? 'weitere' : 'weitere'}` : `, ${o.lines.length} ${o.lines.length === 1 ? 'Position' : 'Positionen'}`), ...(exp.length === 1 ? {act:'ordRecv', id:o.id} : {tab:'buy'})});
  });
  // 6 Im Dienst
  safe(() => {
    const st = tmS(); if(!st.people.length) return; const sh = tmShifts(t);
    const names = [...new Set(sh.slice().sort((a, b) => tmMin(a.parts[0][0]) - tmMin(b.parts[0][0])).map(s => (tmPerson(s.pid) || {name:'?'}).name))];
    const gaps = tmGaps(t);
    if(!names.length){ put({n:'–', t:'Im Dienst', m:tmClosed(t) ? 'Ruhetag, niemand eingeteilt' : 'Noch niemand eingeteilt', act:'tmGo'}, true); return; }
    put({n:String(names.length), t:'Im Dienst', m:esc(names.slice(0, 4).join(', ')) + (names.length > 4 ? ` und ${names.length - 4} mehr` : '') + (gaps.length ? ` <span class="hy-bad">${esc(gaps.join(' und '))} fehlt</span>` : ''), act:'tmGo'});
  });
  // 7 Apartments
  safe(() => {
    const a = S && S.apart; if(!a || !a.apts.length) return; const T = apToday(); let ni = 0, no = 0;
    a.apts.forEach(x => { const i = apDayInfo(x, T); ni += i.inn.length; no += i.out.length; });
    const open = apTasks(T, T).filter(x => !x.done).concat(apOverdue(T)); const urgent = open.find(x => x.D === T && x.wechsel);
    if(!ni && !no && !open.length){ put({n:'–', t:'Apartments', m:'Heute keine An- oder Abreise', act:'apGo', id:'uebersicht'}, true); return; }
    const parts = [ni ? (ni === 1 ? '1 Anreise' : ni + ' Anreisen') : '', no ? (no === 1 ? '1 Abreise' : no + ' Abreisen') : '', open.length && !(ni || no) ? (open.length === 1 ? '1 Reinigung offen' : open.length + ' Reinigungen offen') : ''].filter(Boolean);
    put({n:String(ni + no || open.length), t:'Apartments', m:esc(parts.join(', ')) + (urgent && !(ni && no) ? `, Reinigung bis ${esc(urgent.until)}` : ''), act:'apGo', id:open.length ? 'reinigung' : 'uebersicht'});
  });
  // 8 Abends: Verkäufe und Schwund
  safe(() => {
    if(new Date().getHours() < 17) return; const booked = !!(S.salesReal && S.salesReal[t]);
    put({n:booked ? ico('check') : ico('clip'), t:'Tagesabschluss', m:booked ? 'Verkäufe sind gebucht' : 'Verkäufe und Schwund buchen', act:'phAbend'}, booked);
  });
  return {act, done};
}
function phHeute(){
  const t = todayStr(); const now = new Date(); const h = now.getHours();
  const dateStr = now.toLocaleDateString('de-AT', {weekday:'long', day:'numeric', month:'long'});
  let say = h < 11 ? 'Guten Morgen.' : h < 17 ? 'Guten Tag.' : 'Guten Abend.';
  try { const closed = (S.settings.closed || []).includes(wd(t)); const fc = plIdx().days.length ? vbForecast(t) : null;
    if(closed) say += ' Heute ist Ruhetag.'; else if(fc && !fc.closed && fc.mode !== 'none') say += ` Heute etwa ${num(vbPlan(t).total)} Portionen.`;
    else { const sk = seasonFor(t); const st = sk && S.settings.seasons && S.settings.seasons[sk] ? S.settings.seasons[sk].title : ''; if(st) say += ` ${esc(st)}.`; } } catch(err){ console.warn(err); }
  const u = me(); const r = phHeuteRows();
  let extra = '';
  try { if(relBackupDue()) extra += `<p class="hy-note"><span>${esc(relBackupLine())}</span><button type="button" class="hy-lnk" data-rel="backup">Sicherung speichern</button></p>`; } catch(err){}
  return `<div class="hy-brand"><span class="hy-logo" aria-hidden="true"></span><b>DAHUAM.202</b><span class="hy-who">${esc(u.name)}<span class="save-dot" data-saveind="save-dot" role="img" hidden></span></span></div>
  <h1 class="hy-h1 hy-date" tabindex="-1">${esc(dateStr)}</h1>
  <p class="hy-voice">${say}</p>
  <div class="hy-entry"><button type="button" class="hy-find" data-act="phSuch">${ico('search')}Suchen</button><button type="button" class="hy-scan" data-act="phScan">${ico('phScan')}Scannen</button></div>
  <ul class="hy-board" id="phBoard">${r.act.join('')}${r.done.join('')}</ul>${extra}`;
}
const _renderDashPh = renderDash;
renderDash = function(){
  if(!phOn()) return _renderDashPh();
  const s = phS(); return s.page === 'such' ? phSuchen() : s.page === 'mehr' ? phMehr() : phHeute();
};

/* ---------- Suchen ---------- */
/* Seiten und Aktionen aus der Schnellsuche (ansicht.js: palScore mit den Wörtern, wie man sie im Stress tippt: Gluten, Öl, Backup …).
   Artikel, Rezepte und Gerichte listet die Handy-Suche selbst; hier nur, was direkt zu einem Ort oder einer Aktion führt. */
const PH_PAL_G = ['Bereich', 'Aktion', 'Allergen', 'Begriff'];
function phPalHits(q){
  if(typeof palData !== 'function' || typeof palScore !== 'function') return [];
  const toks = palTokens(q); if(!toks.length) return [];
  if(!PH.pal || PH.pal.at !== S) PH.pal = {at:S, all:palData().filter(x => PH_PAL_G.includes(x.g))};
  const hits = PH.pal.all.map(x => ({x, sc:palScore(x, toks)})).filter(h => h.sc < 3).sort((a, b) => a.sc - b.sc || (a.x.g === 'Begriff') - (b.x.g === 'Begriff'));
  const out = (typeof palDedupe === 'function' ? palDedupe(hits.map(h => h.x)) : hits.map(h => h.x)).slice(0, 4);
  out.exact = !!hits.length && hits[0].sc === 0;   // das Wort ist genau der Name (oder sein Stress-Wort: „Öl“ → Frittieröl)
  return out;
}
function phSuchRes(){
  const q = (phS().q || '').trim().toLowerCase();
  if(!q) return `<p class="hy-hint">Artikel, Rezept oder Gericht eingeben. Mit „Scannen“ geht es über den Strichcode.</p>`;
  const hit = s => String(s || '').toLowerCase().includes(q);
  const digits = /^\d{8,14}$/.test(q);
  // Strichcodes: ein Artikel hat beliebig viele (scan.js eanOf); EAN-8, UPC-A, EAN-13 und GTIN-14 werden gleich verglichen (eanKey)
  const arts = S.products.filter(p => digits ? eanOf(p).some(c => eanKey(c) === eanKey(q)) || String(p.artNo || '') === q : hit(p.name) || hit(p.artNo) || eanOf(p).some(hit)).sort(byName);
  const recs = digits ? [] : S.cards.filter(c => hit(c.name) || c.items.some(it => { const r = refObj(it.ref); return r && hit(r.o.name); })).sort((a, b) => (hit(b.name) - hit(a.name)) || byName(a, b));
  const dishes = digits ? [] : S.menu.filter(m => !m.hidden && (hit(m.name) || hit(m.desc) || hit(m.vlabel)));
  let pal = []; try { pal = digits ? [] : phPalHits(q); } catch(err){ console.warn('Suche:', err); } PH.palHits = pal;
  if(!arts.length && !recs.length && !dishes.length && !pal.length) return `<p class="hy-hint">Nichts gefunden für „${esc(phS().q.trim())}“.${digits ? ' Diese Nummer ist noch keinem Artikel zugeordnet.' : ''}</p>`;
  const cap = 8; const more = (n) => n > cap ? `<p class="hy-hint">${n - cap} weitere. Tippen Sie mehr Buchstaben ein.</p>` : '';
  const res = (icon, t, m, e, a) => `<li><button type="button" class="hy-row hy-res" ${a}><span class="hy-n">${ico(icon)}</span><span class="hy-tm"><b>${t}</b>${m ? `<small>${m}</small>` : ''}</span>${e ? `<span class="hy-e">${e}</span>` : ''}${ico('phChev', 'hy-chev')}</button></li>`;
  const cnt = n => `${n} gefunden`;
  const palIco = x => x.g === 'Aktion' ? 'check' : x.g === 'Allergen' ? 'menu' : x.g === 'Begriff' ? 'help' : 'clip';
  const palH = pal.length ? phSec('Direkt') + `<ul class="hy-board">${pal.map((x, i) => res(palIco(x), esc(x.n), esc(String(x.s || '').slice(0, 90)), '', `data-act="phPal" data-id="${i}"`)).join('')}</ul>` : '';
  // ein Wort wie „Backup“, „Gluten“ oder „Öl“: der direkte Weg zuerst; sonst nach den Artikeln, Rezepten und Gerichten
  const palFirst = pal.length && (pal.exact || (!arts.length && !recs.length));
  return (palFirst ? palH : '') + (arts.length ? phSec('Artikel', cnt(arts.length)) + `<ul class="hy-board">${arts.slice(0, cap).map(p => res('stock', esc(p.name), esc([p.noStock ? '' : phLocName(phLocOf(p)), supName(p)].filter(Boolean).join(', ')), p.noStock ? '' : `<b>${esc(qtyFmt(+p.stock || 0, p))}</b>`, `data-act="phArt" data-id="${p.id}"`)).join('')}</ul>${more(arts.length)}` : '')
    + (recs.length ? phSec('Rezepte', cnt(recs.length)) + `<ul class="hy-board">${recs.slice(0, cap).map(c => { const via = hit(c.name) ? '' : (() => { const it = c.items.map(x => refObj(x.ref)).find(r => r && hit(r.o.name)); return it ? ', mit ' + esc(it.o.name) : ''; })(); return res('cards', esc(c.name), (c.type === 'semi' ? 'Basisrezept' : c.drink ? 'Getränk' : 'Gericht') + via, '', `data-act="openCard" data-id="${c.id}"`); }).join('')}</ul>${more(recs.length)}` : '')
    + (dishes.length ? phSec('Speisekarte', cnt(dishes.length)) + `<ul class="hy-board">${dishes.slice(0, cap).map(m => res('menu', esc(dishLabel(m)), esc(m.section || ''), `<b>${eur(m.price)}</b>`, `data-act="phDish" data-id="${m.id}"`)).join('')}</ul>${more(dishes.length)}` : '') + (palFirst ? '' : palH);
}
function phSuchen(){
  const s = phS();
  return phHead('Suchen') + `<div class="hy-entry"><label class="hy-field">${ico('search')}<input id="phQ" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Artikel, Rezept, Gericht" aria-label="Suchen" value="${esc(s.q || '')}"></label><button type="button" class="hy-scan" data-act="phScan">${ico('phScan')}Scannen</button></div>
  <div id="phRes" aria-live="polite">${phSuchRes()}</div>`;
}
document.addEventListener('input', e => {
  const t = e.target; if(!t || !phOn()) return;
  if(t.id === 'phQ'){ phS().q = t.value; const r = document.getElementById('phRes'); if(r) r.innerHTML = phSuchRes(); }
  else if(t.id === 'phRq'){ phS().rq = t.value; const r = document.getElementById('phRl'); if(r) r.innerHTML = phRezList(); }
});
document.addEventListener('keydown', e => { if(e.key === 'Enter' && e.target && e.target.id === 'phQ'){ e.preventDefault(); const one = document.querySelectorAll('#phRes .hy-row'); if(one.length === 1) one[0].click(); else e.target.blur(); } });

/* ---------- Mehr ---------- */
function phMehrRow(icon, t, e, a){ return `<li><button type="button" class="hy-mr" ${a}>${ico(icon)}<span>${t}</span><span class="hy-e">${e || ''}</span>${ico('phChev', 'hy-chev')}</button></li>`; }
function phMehr(){
  const s = phS(); const t = todayStr(); let ckOpen = 0, ek = 0, duty = 0, apTxt = '';
  try { const D = ckToday(); ckOpen = ckDue(D).filter(tp => !ckProg(tp, D).full).length; const d = ekDue(D); ek = d.open.length + d.oil.length; } catch(err){}
  try { duty = new Set(tmShifts(t).map(x => x.pid)).size; } catch(err){}
  try { const a = S.apart; if(a && a.apts.length){ const n = a.apts.filter(x => apDayInfo(x, t).night).length; apTxt = `${n} von ${a.apts.length} belegt`; } } catch(err){}
  const low = lowStock().length; const inv = S.invDraft ? 'läuft' : S.inventories[0] ? 'zuletzt ' + fmtDate(S.inventories[0].date).slice(0, 6) : '';
  const exp = (S.orders || []).filter(o => ['sent', 'confirmed'].includes(o.status) && o.deliveryDate <= t).length;
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const hasAp = !!(S.apart && S.apart.apts.length);
  const lap = [['menu', 'Speisekarte und Kalkulation', 'data-act="phLapGo" data-id="calc"'], ['menu', 'Gästekarte gestalten', 'data-act="phLapGo" data-id="guest"'], ['leaf', 'Saison und Aktionen', 'data-act="phLapGo" data-id="plan"'], ['ware', 'Preise', 'data-act="phLapGo" data-id="preise"'], ['truck', 'Lieferanten', 'data-act="phLapGo" data-id="lieferanten"'], ['clip', 'Buchungen', 'data-act="phLapGo" data-id="buchungen"'], ['team', 'Auswertung', 'data-act="phLapGo" data-id="report"'], ['copy', 'Eigene Daten einlesen', 'data-act="phLapGo" data-id="daten"'], ['spark', 'Einrichtung', 'data-act="phLapGo" data-id="einr"']];
  return phHead('Mehr')
    + `<ul class="hy-grp">${phMehrRow('cards', 'Rezepte', String(S.cards.length), 'data-tab="cards"')}${phMehrRow('menu', 'Speisekarte', 'Allergene nachsehen', 'data-act="phLapGo" data-id="service"')}${phMehrRow('checkl', 'Checklisten', ckOpen + ek ? `${ckOpen + ek} offen` : 'erledigt', 'data-act="ckGo" data-id=""')}</ul>
    <ul class="hy-grp">${phMehrRow('stock', 'Bestand', low ? `${low} unter Mindest` : '', 'data-act="goStock" data-id="bestand"')}${phMehrRow('clip', 'Inventur', inv, 'data-act="goStock" data-id="inventur"')}${phMehrRow('truck', 'Wareneingang', exp ? `${exp} heute` : '', 'data-act="phWe"')}</ul>
    <ul class="hy-grp">${phMehrRow('dienst', 'Dienstplan', duty ? `${duty} im Dienst` : '', 'data-act="tmGo"')}${hasAp ? phMehrRow('apart', 'Apartments', apTxt, 'data-act="apGo" data-id="uebersicht"') : ''}${phMehrRow('setup', 'Einstellungen', esc(me().name), 'data-tab="setup"')}${typeof wlOpen === 'function' ? phMehrRow('help', 'Anleitung', '', 'data-act="wlOpen"') : ''}${phMehrRow(dark ? 'sun' : 'moon', dark ? 'Helles Design' : 'Dunkles Design', '', 'data-act="phTheme"')}</ul>
    <section class="hy-lap"><h2>${ico('phLap')}Am Laptop geht das besser</h2><p>Kalkulation, Gästekarte, eigene Daten, Auswertung.</p><button type="button" class="hy-lnk" data-act="phLap" aria-expanded="${!!s.lap}">${s.lap ? 'Liste schließen' : 'Hier öffnen'}</button>
      ${s.lap ? `<ul class="hy-grp hy-lapl">${lap.map(x => phMehrRow(x[0], x[1], '', x[2])).join('')}</ul>` : ''}</section>
    ${S.demo ? `<p class="hy-demo">${demoLine()}</p>` : ''}`;
}
function phLapGo(id){
  switch(id){
    case 'service': view.mtab = 'service'; go('menu'); break;
    case 'calc': view.mtab = 'calc'; go('menu'); break;
    case 'guest': view.mtab = 'guest'; go('menu'); break;
    case 'plan': view.mtab = 'plan'; go('menu'); break;
    case 'report': go('report'); break;
    case 'daten': go('daten'); break;
    case 'einr': go('einr'); break;
    default: wareGo(id);
  }
}

/* ---------- Das Blatt von unten: ein Baustein für alles ---------- */
function phSheetEl(){
  let el = document.getElementById('phSheet');
  if(!el){ el = document.createElement('div'); el.id = 'phSheet'; el.hidden = true;
    el.innerHTML = `<div class="hy-scrim" data-act="phClose"></div><div class="hy-box" role="dialog" aria-modal="true" aria-labelledby="phSheetT" tabindex="-1"><span class="hy-grab" aria-hidden="true"></span><button type="button" class="hy-x" data-act="phClose" aria-label="Schließen">${ico('x')}</button><div class="hy-body" id="phSheetB"></div></div>`;
    document.body.appendChild(el); }
  return el;
}
function phSheet(draw, opt){
  const el = phSheetEl(); const was = !el.hidden;
  PH.sheet = {draw, kind:(opt && opt.kind) || '', back:was && PH.sheet ? PH.sheet.back : document.activeElement};
  phSheetDraw(); el.hidden = false; document.body.classList.add('hy-lock');
  const f = opt && opt.focus ? el.querySelector(opt.focus) : null; (f || el.querySelector('.hy-box')).focus({preventScroll:true});
}
function phSheetDraw(){ const el = document.getElementById('phSheet'); if(!el || !PH.sheet) return; const b = document.getElementById('phSheetB'); const top = b.scrollTop; b.innerHTML = PH.sheet.draw(); b.scrollTop = top; }
function phSheetClose(quiet){
  const el = document.getElementById('phSheet'); if(!el || el.hidden){ PH.sheet = null; return; }
  // nur hineingeschaut: ein unberührter, eben erst angelegter Entwurf bleibt nicht liegen
  // nur hineingeschaut: die Vorschau (einkauf.js ORD_TMP) wird nie ein Entwurf
  if(PH.ord && ORD_TMP && ORD_TMP.id === PH.ord.id) ORD_TMP = null;
  const back = PH.sheet && PH.sheet.back; el.hidden = true; document.body.classList.remove('hy-lock'); PH.sheet = null; PH.cnt = null; PH.ord = null;
  if(!quiet && back && back.isConnected && back.focus) back.focus({preventScroll:true});
}
function phSheetOpen(){ const el = document.getElementById('phSheet'); return !!el && !el.hidden; }
window.addEventListener('keydown', e => { if(e.key === 'Escape' && phSheetOpen() && !(document.getElementById('dlg') || {}).open){ e.preventDefault(); phSheetTryClose(); } });
/* Eine getippte, noch nicht gespeicherte Zählung geht nicht still verloren: wie bei den Dialogen (ui2.js dlgTryClose) erst nachfragen */
function phSheetDirty(){ const c = PH.sheet && PH.sheet.kind === 'count' && PH.cnt; if(!c) return false; const i = document.getElementById('phCntV');
  return !!i && (i.value.trim() !== (c.v0 === '' ? '' : numIn(c.v0)) || c.t !== c.t0); }
function phSheetTryClose(){
  if(!phSheetDirty()){ phSheetClose(); render(); return; }
  const b = document.getElementById('phSheetB'); let bar = b.querySelector('.hy-discard');
  if(!bar){ b.insertAdjacentHTML('afterbegin', `<div class="hy-discard" role="alert"><span>Änderungen verwerfen?</span><div class="hy-two"><button type="button" class="hy-btn q" data-act="phKeep">Weiter bearbeiten</button><button type="button" class="hy-btn q hy-danger" data-act="phDrop">Verwerfen</button></div></div>`); bar = b.querySelector('.hy-discard'); }
  b.scrollTop = 0; bar.querySelector('[data-act="phKeep"]').focus({preventScroll:true});
}

/* ---------- Zählen: ein Artikel, eine Zahl (Suche, Scanner, Inventur) ---------- */
function phCntUnit(p){ return isDrink(p) ? (p.geb === 'fass' ? 'Fass' : 'Flaschen') : p.unit === 'l' ? 'Liter' : p.unit; }
function phCntStep(p){ return isDrink(p) || p.unit === 'Stk' ? 1 : 0.5; }
function phCntStock(p){ return isDrink(p) ? Math.floor((+p.stock || 0) / p.gebL + 1e-9) : (+p.stock || 0); }
function phCount(pid, o){
  const p = P(pid); if(!p) return; o = o || {};
  const inv = !!S.invDraft; const c = PH.cnt = {pid, inv, loc:o.loc != null ? o.loc : null, seq:!!o.seq, v:'', t:0};
  if(inv){ if(isDrink(p)){ const b = barCount(pid); c.v = b.f === '' ? '' : b.f; c.t = b.t; } else { const x = S.invDraft.counts[pid]; c.v = x === undefined || x === '' ? '' : x; } }
  else if(isDrink(p)){ const n = (+p.stock || 0) / p.gebL; c.v = Math.floor(n + 1e-9); c.t = Math.round((n - c.v) * 10); }
  else c.v = +p.stock || 0;
  c.v0 = c.v; c.t0 = c.t;
  phSheet(phCountHtml, {kind:'count'});
}
function phCountHtml(){
  const c = PH.cnt; const p = c && P(c.pid); if(!p) return '';
  const bar = isDrink(p); const unit = phCntUnit(p); const stockTxt = qtyFmt(+p.stock || 0, p);
  let pos = '';
  if(c.seq && c.loc != null){ const list = phInvList(c.loc); const i = list.findIndex(x => x.id === p.id); if(i >= 0) pos = `Artikel ${i + 1} von ${list.length}`; }
  const sub = [c.seq ? '' : phLocName(phLocOf(p)), p.pack || '', pos].filter(Boolean).join(', ');
  const tenths = bar ? `<div class="hy-tenths" role="group" aria-label="${p.geb === 'fass' ? 'Angebrochenes Fass' : 'Angebrochene Flasche'}, in Zehnteln"><small>offen</small>${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<button type="button" class="${c.t === k ? 'on' : ''}" data-act="phCntT" data-id="${k}" aria-pressed="${c.t === k}">0,${k}</button>`).join('')}</div>` : '';
  const edit = canEditAll() && !c.seq ? `<button type="button" class="hy-btn t" data-act="phArtEdit" data-id="${p.id}">Artikel bearbeiten</button>` : '';
  return `<h2 id="phSheetT">${esc(p.name)}</h2>${sub ? `<p class="hy-sub">${esc(sub)}</p>` : ''}
    <div class="hy-count"><button type="button" data-act="phCntStep" data-id="-1" aria-label="weniger">${ico('minus')}</button>
      <label><input id="phCntV" class="num-in" type="text" inputmode="decimal" autocomplete="off" data-num="self" data-pid="${esc(p.id)}" value="${c.v === '' ? '' : numIn(c.v)}" placeholder="${numIn(phCntStock(p))}" aria-label="Gezählt ${esc(p.name)}, ${esc(unit)}"><span>${esc(unit)}</span></label>
      <button type="button" data-act="phCntStep" data-id="1" aria-label="mehr">${ico('plus')}</button></div>${tenths}
    <p class="hy-was">Laut App ${/^1([ ,]|$)/.test(stockTxt) && !/^1,/.test(stockTxt) ? 'ist' : 'sind'} <b>${esc(stockTxt)}</b> da.${c.inv && !c.seq ? ' Die Zählung geht in die laufende Inventur.' : ''}</p>
    <button type="button" class="hy-btn" data-act="phCntSave">${c.seq ? 'Speichern und weiter' : 'Zählung speichern'}</button>
    ${c.seq ? `<div class="hy-two"><button type="button" class="hy-btn t" data-act="phCntSame">Stimmt, ${esc(stockTxt)}</button><button type="button" class="hy-btn t" data-act="phCntSkip">Überspringen</button></div>` : edit}`;
}
function phCntRead(){ const i = document.getElementById('phCntV'); const c = PH.cnt; if(!i || !c) return true; const raw = i.value.trim(); if(raw === ''){ c.v = ''; return true; } const v = numParse(raw); if(!isFinite(v) || v < 0 || v > 99999){ i.classList.add('bad-in'); toast('Bitte eine Zahl eingeben, zum Beispiel 12,5.'); return false; } c.v = Math.round(v * 1000) / 1000; return true; }
function phCntValue(){ const c = PH.cnt; const p = P(c.pid); if(c.v === '' && !c.t) return null; return isDrink(p) ? Math.round(((+c.v || 0) + c.t / 10) * p.gebL * 1000) / 1000 : +c.v; }
function phCntSave(same){
  const c = PH.cnt; const p = c && P(c.pid); if(!p) return;
  if(same){ if(isDrink(p)){ const n = (+p.stock || 0) / p.gebL; c.v = Math.floor(n + 1e-9); c.t = Math.round((n - c.v) * 10); } else c.v = +p.stock || 0; }
  else if(!phCntRead()) return;
  let val = same && !isDrink(p) ? (+p.stock || 0) : phCntValue();
  if(val == null){ if(c.seq){ phCntNext(); return; } toast('Bitte die gezählte Menge eintragen.'); const i = document.getElementById('phCntV'); if(i) i.focus(); return; }
  if(S.invDraft){
    const d = S.invDraft; if(isDrink(p)){ d.bar = d.bar || {}; d.bar[p.id] = {f:c.v === '' ? 0 : +c.v, t:c.t}; } d.counts[p.id] = val; save();
    if(c.seq){ phCntNext(); return; }
    phSheetClose(); render(); toast(`${p.name}: ${qtyFmt(val, p)} in der Inventur eingetragen`); return;
  }
  const df = Math.round((val - (+p.stock || 0)) * 1000) / 1000; const before = +p.stock || 0;
  if(Math.abs(df) > 1e-9) addMove('inv', p.id, df, 'Gezählt am Handy');
  save(); phSheetClose(); render();
  toast(Math.abs(df) > 1e-9 ? `${p.name}: ${qtyFmt(val, p)} gespeichert (vorher ${qtyFmt(before, p)})` : `${p.name}: Bestand stimmt`, Math.abs(df) > 1e-9 ? {action:() => { const i = S.moves.findIndex(m => m.pid === p.id && m.type === 'inv' && m.note === 'Gezählt am Handy'); if(i >= 0){ S.moves.splice(i, 1); p.stock = before; save(); render(); toast('Zählung zurückgenommen'); } }} : undefined);
}
function phCntNext(){
  const c = PH.cnt; const list = phInvList(c.loc); const d = S.invDraft; const isOpen = x => d.counts[x.id] === undefined || d.counts[x.id] === '';
  const i = list.findIndex(x => x.id === c.pid); const next = list.slice(i + 1).find(isOpen) || (list.slice(0, i).find(isOpen));
  if(next && next.id !== c.pid){ const loc = c.loc; phCount(next.id, {loc, seq:true}); render(); const f = document.getElementById('phCntV'); if(f) f.focus({preventScroll:true}); return; }
  const name = phLocName(c.loc); const allDone = list.every(x => !isOpen(x)); phSheetClose(true); if(allDone) phS().loc = null; render(); if(allDone) hashSync(); toast(allDone ? `${name} fertig gezählt` : `${name}: Ende der Liste`);
}

/* ---------- Bestand: große Zeilen statt Tabelle ---------- */
function phBestand(){
  const s = phS(); const f = s.bf || 'all'; const all = stockProducts().sort((a, b) => phLocs().indexOf(phLocOf(a)) - phLocs().indexOf(phLocOf(b)) || byName(a, b));
  const low = new Set(lowStock().map(p => p.id));
  const list = f === 'all' ? all : f === 'low' ? all.filter(p => low.has(p.id)) : all.filter(p => phLocOf(p) === (f === 'none' ? '' : f));
  const chips = [['all', 'Alle', all.length], ['low', 'Unter Mindest', low.size]].concat(phLocs().filter(k => all.some(p => phLocOf(p) === k)).map(k => [k || 'none', phLocName(k), all.filter(p => phLocOf(p) === k).length]));
  let h = '', cur = null;
  list.forEach(p => { const k = phLocOf(p); if(k !== cur && (f === 'all' || f === 'low')){ if(cur !== null) h += '</ul>'; h += phSec(phLocName(k)) + '<ul class="hy-board">'; cur = k; } else if(cur === null){ h += '<ul class="hy-board">'; cur = k; }
    const isLow = low.has(p.id);
    h += phRow({n:phQty(qtyFmt(+p.stock || 0, p)), t:esc(p.name), m:isLow ? `<span class="hy-bad">Mindestens ${esc(qtyFmt(+p.minStock || 0, p))}</span>` : esc(supName(p)), cls:'hy-q', act:'phArt', id:p.id}); });
  if(cur !== null) h += '</ul>';
  return phHead('Bestand', '', phBackBtn(phBackLabel())) + `<button type="button" class="hy-btn q hy-scanb" data-scan="look">${ico('phScan')}Artikel scannen</button><div class="hy-chips" role="tablist" aria-label="Filter">${chips.map(([k, l, n]) => `<button type="button" role="tab" aria-selected="${f === k}" class="${f === k ? 'on' : ''}" data-act="phBf" data-id="${k}">${esc(l)}<small>${n}</small></button>`).join('')}</div>`
    + (list.length ? h : `<p class="hy-hint">${f === 'low' ? 'Nichts unter Mindestbestand.' : 'Hier liegt noch kein Artikel.'}</p>`)
    + `<div class="hy-foot"><button type="button" class="hy-btn q" data-act="moveDlg" data-id="waste">Schwund buchen</button></div>`;
}

/* ---------- Inventur: ein Lagerort nach dem anderen ---------- */
function phInvList(loc){ return stockProducts().filter(p => phLocOf(p) === (loc || '')).sort(byName); }
function phInvDone(p){ const d = S.invDraft; return !!d && d.counts[p.id] !== undefined && d.counts[p.id] !== ''; }
function phInventur(){
  const d = S.invDraft; const s = phS();
  if(!d){
    const old = S.inventories.length ? phSec('Bisherige Inventuren') + `<ul class="hy-board">${S.inventories.slice(0, 6).map(i => `<li><div class="hy-row hy-q hy-static"><span class="hy-n">${esc(fmtDate(i.date).slice(0, 6))}</span><span class="hy-tm"><b>${i.counted} Artikel gezählt</b><small>${i.demo ? 'Beispiel, ' : ''}Lagerwert ${eur(i.value)}</small></span><span class="hy-e"><b class="${i.diff < 0 ? 'hy-bad' : ''}">${signedEur(i.diff)}</b></span></div></li>`).join('')}</ul>` : '';
    return phHead('Inventur', 'Ein Lagerort nach dem anderen.', phBackBtn(phBackLabel()))
      + `<p class="hy-text">Sie gehen einmal durch Kühlhaus, Tiefkühler und Lager. Was Sie nicht zählen, bleibt unverändert.${stockProducts().some(isDrink) ? ' Getränke zählen Sie in vollen Flaschen oder Fässern, die angebrochene dazu in Zehnteln.' : ''}</p>
      <button type="button" class="hy-btn" data-act="invStart">Inventur starten</button>${old}`;
  }
  const locs = phLocs().map(k => ({k, list:phInvList(k)})).filter(x => x.list.length).map(x => ({...x, done:x.list.filter(phInvDone).length}));
  if(s.loc != null && locs.some(x => x.k === s.loc)){
    const L = locs.find(x => x.k === s.loc);
    return phHead(phLocName(L.k), '', phBackBtn('Inventur', 'phInvLoc', '~'))
      + `<div class="hy-bar"><i style="width:${(L.done / L.list.length * 100).toFixed(1)}%"></i></div><p class="hy-prog" id="phInvProg">${L.done} von ${L.list.length} gezählt</p>
      <button type="button" class="hy-btn q hy-scanb" data-scan="inv">${ico('phScan')}Mit dem Scanner zählen</button>
      <ul class="hy-board">${L.list.map(p => { const on = phInvDone(p); return `<li><button type="button" class="hy-ck ${on ? 'on' : ''}" data-act="phInvArt" data-id="${p.id}"><span class="hy-o" aria-hidden="true">${on ? ico('check') : ''}</span><span class="hy-tm"><b>${esc(p.name)}</b><small>laut App ${esc(qtyFmt(+p.stock || 0, p))}</small></span><span class="hy-cq">${on ? phQty(qtyFmt(+d.counts[p.id], p)) : ''}</span></button></li>`; }).join('')}</ul>`;
  }
  s.loc = null;
  const tot = locs.reduce((a, x) => a + x.list.length, 0), dn = locs.reduce((a, x) => a + x.done, 0); const next = locs.find(x => x.done < x.list.length);
  const diff = stockProducts().reduce((a, p) => phInvDone(p) ? a + (d.counts[p.id] - (+p.stock || 0)) * (+p.price || 0) : a, 0);
  return phHead('Inventur', 'Ein Lagerort nach dem anderen.', phBackBtn(phBackLabel()))
    + `<ul class="hy-board">${locs.map(x => phRow({n:`${x.done}/${x.list.length}`, t:esc(phLocName(x.k)), m:x.done === x.list.length ? 'Fertig gezählt' : x.done ? `${x.list.length - x.done} ${x.list.length - x.done === 1 ? 'Artikel fehlt' : 'Artikel fehlen'} noch` : 'Noch nicht begonnen', cls:x.done === x.list.length ? 'done' : next && x.k === next.k ? 'now' : '', act:'phInvLoc', id:x.k || '-'})).join('')}</ul>
    <p class="hy-text">${dn} von ${tot} Artikeln gezählt${dn && canEditAll() ? `, Differenz <b class="${diff < 0 ? 'hy-bad' : ''}">${signedEur(diff)}</b>` : ''}. Was Sie nicht zählen, bleibt unverändert.</p>
    <div class="hy-foot">${next ? `<button type="button" class="hy-btn" data-act="phInvNext" data-id="${next.k || '-'}">${next.done ? 'Im' : 'Mit'} ${esc(phLocName(next.k))} ${next.done ? 'weiterzählen' : 'beginnen'}</button>` : ''}
      <button type="button" class="hy-btn q hy-scanb" data-scan="inv">${ico('phScan')}Mit dem Scanner zählen</button>
      ${dn ? `<button type="button" class="hy-btn ${next ? 'q' : ''}" data-act="invFinish">Inventur abschließen</button>` : ''}
      <button type="button" class="hy-btn t" data-act="invCancel">Inventur verwerfen</button></div>`;
}
const _renderStockPh = renderStock;
renderStock = function(){
  if(!phOn()) return _renderStockPh();
  if(!['bestand', 'inventur', 'buchungen'].includes(view.stab)) view.stab = 'bestand';
  return view.stab === 'inventur' ? phInventur() : view.stab === 'bestand' ? phBestand() : _renderStockPh();
};

/* ---------- Bestellen: Liste und eine Bestellung als Blatt ---------- */
function phBestellen(){
  const t = todayStr(), w = wd(t); const sups = (S.suppliers || []).filter(s => s.active);
  const due = sups.filter(sp => sp.orderDays.includes(w)).map(sp => ({sp, st:supToday(sp)}));
  due.forEach(x => { x.need = x.st.state === 'sent' || x.st.draft ? [] : phSupNeed(x.sp, x.st); x.calm = x.st.state === 'open' && !x.st.draft && !x.need.length; });
  const rank = x => x.st.state === 'open' && !x.calm ? 0 : x.calm ? 1 : x.st.state === 'sent' ? 3 : 2;
  due.sort((a, b) => rank(a) - rank(b) || hm(a.sp.cutoff) - hm(b.sp.cutoff));
  const nOpen = due.filter(x => rank(x) === 0).length; const first = due.find(x => rank(x) === 0);
  const voice = !due.length ? 'Heute ist kein Bestelltag.' : nOpen ? `Heute ${nOpen === 1 ? 'ist noch ein Lieferant' : `sind noch ${num(nOpen)} Lieferanten`} dran.` : due.some(x => x.calm) ? 'Heute ist nichts nötig.' : 'Für heute ist alles erledigt.';
  // Bedarf wie in der Bestellung (einkauf.js supNeed: Mindestbestand und Prognose); ohne Bedarf ruhig und grau „nichts nötig“
  const row = ({sp, st, need}) => { const dr = st.draft; need = need || []; const val = need.reduce((a, x) => a + x.n * (x.p.packQty || 1) * (+x.p.price || 0), 0);
    const calm = st.state === 'open' && !dr && !need.length;
    const m = st.state === 'sent' ? 'Heute bestellt' : dr ? `Entwurf, ${dr.lines.length} ${dr.lines.length === 1 ? 'Artikel' : 'Artikel'}, ${eur(orderTotal(dr))}` : need.length ? `${need.length} Artikel, ${eur(val)}${sp.minOrder && val < sp.minOrder ? `. Mindestwert ${eur(sp.minOrder)}` : ''}` : 'nichts nötig';
    return phRow({pre:st.state === 'sent' ? '' : 'bis', n:st.state === 'sent' ? ico('check') : esc(sp.cutoff), t:esc(sp.name), m:st.state === 'past' ? `Annahmeschluss vorbei. ${m}` : m + (st.urgent && !calm ? ` <span class="hy-bad">${esc(st.label)}</span>` : ''), cls:st.state === 'open' && !calm ? (first && first.sp.id === sp.id ? 'now' : '') : 'off', act:'phOrd', id:sp.id}); };
  const exp = (S.orders || []).filter(o => ['sent', 'confirmed'].includes(o.status)).sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));
  const expRow = o => { const sp = SUP(o.supplier); const late = o.deliveryDate < t; const day = late ? tmDm(o.deliveryDate) : o.deliveryDate === t ? 'heute' : o.deliveryDate === dAdd(t, 1) ? 'morgen' : tmWdShort(o.deliveryDate);
    return phRow({pre:late ? 'sollte' : 'kommt', n:esc(day), t:esc(sp ? sp.name : '?'), m:(late ? '<span class="hy-bad">überfällig.</span> ' : '') + `${o.lines.length} ${o.lines.length === 1 ? 'Position' : 'Positionen'}, ${eur(orderTotal(o))}`, cls:'hy-w', act:'ordRecv', id:o.id}); };
  const others = sups.filter(sp => !sp.orderDays.includes(w));
  return phHead('Bestellen', voice)
    + (due.length ? `<ul class="hy-board">${due.map(row).join('')}</ul>` : '')
    + (exp.length ? phSec('Unterwegs') + `<ul class="hy-board">${exp.map(expRow).join('')}</ul>` : '')
    + `<div class="hy-links">${others.length ? `<button type="button" class="hy-lnk" data-act="phOrdOther">Bei anderem Lieferanten bestellen</button>` : ''}<button type="button" class="hy-lnk" data-act="moveDlg" data-id="in">Lieferung ohne Bestellung</button><button type="button" class="hy-lnk" data-act="phBuyAll">Alle Bestellungen</button></div>`;
}
const _renderBuyPh = renderBuy;
renderBuy = function(){
  if(!phOn()) return _renderBuyPh();
  if(!BUY.includes(view.stab)) view.stab = 'bestellung';
  return phKey() === 'best' ? phBestellen() : _renderBuyPh();
};
function phOrdOpen(sid){
  const sp = SUP(sid); if(!sp) return; const st = supToday(sp);
  if(st.state === 'sent'){ const o = lastOrder(sid); if(o){ view.stab = 'bestellung'; view.order = o.id; view.recv = null; go('stock'); return; } }
  // vorhandener Entwurf oder eine Vorschau mit dem Vorschlag (einkauf.js ordStart): ein Entwurf entsteht erst mit der ersten Änderung
  const o = ordStart(sid);
  PH.ord = {id:o.id, asked:null}; phSheet(phOrdHtml, {kind:'ord'}); render();
}
/* Vorschau → Entwurf (mit Nummer), sobald am Handy etwas geändert, geöffnet oder kopiert wird */
function phOrdKeep(){ const o = PH.ord && ORD(PH.ord.id); if(o && o === ORD_TMP) ordTmpCommit(true); return o; }
const _ordTmpCommitPh = ordTmpCommit;
ordTmpCommit = function(force){
  if(!force && PH.ord && ORD_TMP && ORD_TMP.id === PH.ord.id) return;   // die Vorschau im Handy-Blatt bleibt beim Speichern anderer Dinge stehen
  return _ordTmpCommitPh(force);
};
/* Senden über einen Link (E-Mail, WhatsApp, Webshop, Telefon): unter dem Mindestbestellwert oder außerhalb der Bestelltage erst nachfragen, wie am Laptop (einkauf.js ordSendWarn) */
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('#phSheet [data-act="phOrdSend"]'); if(!el || !PH.ord) return;
  const o = ORD(PH.ord.id); if(!o || ORD_SEND_OK.has(o.id)) return; const warn = ordSendWarn(o); if(!warn.length) return;
  e.preventDefault(); e.stopImmediatePropagation();
  openDialog('Trotzdem senden?', warn.map(w => `<p class="dlg-p">${w}</p>`).join('') + '<p class="dlg-p">Der Lieferant nimmt die Bestellung vielleicht nicht an.</p>',
    () => { ORD_SEND_OK.add(o.id); setTimeout(() => { const a = el.isConnected ? el : document.querySelector('#phSheet [data-act="phOrdSend"]'); if(a) a.click(); }, 30); }, {ok:'Trotzdem senden', toast:false});
}, true);
function phOrdVia(o, sp){
  const cloud = typeof cloudReady === 'function' && cloudReady() && sp.email; const b = [];
  if(cloud) b.push({l:'Jetzt per E-Mail senden', act:'ordCloudSend'});
  if(sp.email) b.push({l:'E-Mail öffnen', href:mailHref(o), via:'E-Mail'});
  if(sp.whatsapp) b.push({l:'WhatsApp öffnen', href:waHref(o), via:'WhatsApp', blank:true});
  if(sp.shopUrl) b.push({l:'Webshop öffnen', href:sp.shopUrl, via:'Webshop', blank:true});
  if(sp.phone && (sp.channel === 'phone' || !b.length)) b.push({l:'Anrufen', href:'tel:' + String(sp.phone).replace(/[^\d+]/g, ''), via:'Telefon'});
  const key = {email:'E-Mail', whatsapp:'WhatsApp', shop:'Webshop', phone:'Telefon'}[sp.channel];
  b.sort((x, y) => (y.via === key) - (x.via === key));
  return b;
}
function phOrdHtml(){
  const st = PH.ord; const o = st && ORD(st.id); if(!o) return ''; const sp = SUP(o.supplier); const tot = orderTotal(o);
  const lines = o.lines.map((l, i) => { const p = P(l.pid); return `<li class="hy-li"><span class="hy-tm"><b>${esc(p ? p.name : '?')}</b><small>${esc(l.ou)}${p && !p.noStock ? `, noch ${esc(qtyFmt(+p.stock || 0, p))} da` : ''}</small></span><span class="hy-step"><button type="button" data-act="phOl" data-id="${i}:-1" aria-label="${esc(p ? p.name : '')}: weniger">${ico('minus')}</button><b aria-live="polite">${num(l.n, 2)}</b><button type="button" data-act="phOl" data-id="${i}:1" aria-label="${esc(p ? p.name : '')}: mehr">${ico('plus')}</button></span></li>`; }).join('');
  const addable = supProducts(sp.id).filter(p => !o.lines.some(l => l.pid === p.id));
  const add = addable.length ? `<label class="hy-add"><span class="hy-lnk">Artikel dazu</span><select id="phOlAdd" aria-label="Artikel von ${esc(sp.name)} hinzufügen"><option value="">Artikel dazu …</option>${addable.map(p => `<option value="${p.id}">${esc(p.name)}${p.pack ? ' (' + esc(p.pack) + ')' : ''}</option>`).join('')}</select></label>` : '';
  const below = sp.minOrder && tot < sp.minOrder; const has = o.lines.some(l => +l.n > 0); const block = sendBlockReason(o);
  let foot;
  if(!has) foot = `<p class="hy-text">${o.lines.length ? 'Alle Mengen stehen auf 0.' : 'Nichts nötig: nichts unter Mindestbestand, nichts fehlt laut Prognose.'} Mit „Artikel dazu“ bestellen Sie trotzdem.</p>`;
  else if(block) foot = `<p class="hy-text">${esc(block)}</p><button type="button" class="hy-btn q" data-act="phOrdSave">${o.tmp ? 'Als Entwurf speichern' : 'Als Entwurf liegen lassen'}</button>`;
  else if(st.asked) foot = `<p class="hy-ask" role="status">Im ${esc(st.asked)} geöffnet. Ist die Bestellung draußen?</p><button type="button" class="hy-btn" data-act="ordMarkSent" data-id="${o.id}">Ja, gesendet</button><button type="button" class="hy-btn t" data-act="phOrdNot">Noch nicht</button>`;
  else { const via = phOrdVia(o, sp); const main = via[0];
    foot = (main ? (main.href ? `<a class="hy-btn" href="${esc(main.href)}"${main.blank ? ' target="_blank" rel="noopener"' : ''} data-act="phOrdSend" data-id="${esc(main.via)}">${main.l}</a>` : `<button type="button" class="hy-btn" data-act="${main.act}" data-id="${o.id}">${main.l}</button>`) : `<button type="button" class="hy-btn" data-act="phOrdCopy" data-id="${o.id}">Text kopieren</button>`)
      + `<div class="hy-two">${main ? `<button type="button" class="hy-btn t" data-act="ordCopy" data-id="${o.id}">Text kopieren</button>` : ''}<button type="button" class="hy-btn t" data-act="ordMarkSent" data-id="${o.id}">${sp.channel === 'phone' ? 'Telefonisch bestellt' : 'Schon gesendet'}</button></div>`; }
  return `<h2 id="phSheetT">${esc(sp.name)}</h2><p class="hy-sub">${esc(CHANNELS[sp.channel] || '')}, bis ${esc(sp.cutoff)} Uhr. Lieferung ${esc(phShortDay(o.deliveryDate))}.</p>
    <ul class="hy-lis">${lines}</ul>${add}
    <div class="hy-sum"><span>Summe ohne MwSt.</span><b>${eur(tot)}</b></div>
    ${sp.minOrder ? `<p class="hy-min ${below ? 'no' : 'ok'}">${below ? `Noch ${eur(sp.minOrder - tot)} bis zum Mindestwert ${eur(sp.minOrder)}` : `${ico('check')}Mindestwert ${eur(sp.minOrder)} erreicht`}</p>` : ''}
    ${foot}${o.tmp ? '' : `<button type="button" class="hy-btn t hy-del" data-act="phOrdDel" data-id="${o.id}">Entwurf löschen</button>`}`;
}
function phOrdOtherHtml(){
  const w = wd(todayStr()); const list = (S.suppliers || []).filter(s => s.active && !s.orderDays.includes(w)).sort(byName);
  return `<h2 id="phSheetT">Anderer Lieferant</h2><p class="hy-sub">Heute kein Bestelltag. Vorbereiten geht trotzdem.</p><ul class="hy-board hy-in">${list.map(sp => { const od = nextOrderDate(sp); return phRow({pre:'wieder', n:esc(tmWdShort(od)), t:esc(sp.name), m:`bis ${esc(sp.cutoff)} Uhr, ${esc(CHANNELS[sp.channel] || '')}`, cls:'hy-w', act:'phOrd', id:sp.id}); }).join('')}</ul>`;
}
function phWeHtml(){
  const t = todayStr(); const exp = (S.orders || []).filter(o => ['sent', 'confirmed'].includes(o.status)).sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));
  return `<h2 id="phSheetT">Wareneingang</h2><p class="hy-sub">${exp.length ? 'Welche Lieferung ist gekommen?' : 'Es ist keine bestellte Lieferung unterwegs.'}</p>
    ${exp.length ? `<ul class="hy-board hy-in">${exp.map(o => { const sp = SUP(o.supplier); return phRow({pre:o.deliveryDate < t ? 'sollte' : 'kommt', n:esc(o.deliveryDate < t ? tmDm(o.deliveryDate) : o.deliveryDate === t ? 'heute' : tmWdShort(o.deliveryDate)), t:esc(sp ? sp.name : '?'), m:`${o.lines.length} ${o.lines.length === 1 ? 'Position' : 'Positionen'}, ${eur(orderTotal(o))}`, cls:'hy-w', act:'ordRecv', id:o.id}); }).join('')}</ul>` : ''}
    <button type="button" class="hy-btn ${exp.length ? 'q' : ''}" data-act="moveDlg" data-id="in">Lieferung ohne Bestellung</button>`;
}
function phAbendHtml(){
  return `<h2 id="phSheetT">Tagesabschluss</h2><p class="hy-sub">Was heute verkauft wurde und was weg musste.</p>
    <button type="button" class="hy-btn" data-act="sales">Verkäufe buchen</button><button type="button" class="hy-btn q" data-act="plKasse">Kassenbericht importieren</button><button type="button" class="hy-btn q" data-act="moveDlg" data-id="waste">Schwund buchen</button>`;
}
function phDishHtml(id){
  const m = S.menu.find(x => x.id === id); if(!m) return ''; const ai = algInfo(m);
  const alg = ai.letters.length ? `<div class="hy-alg">${ai.letters.map(a => `<span><b>${esc(a)}</b> ${esc(ALG[a] || a)}</span>`).join('')}</div>` : '';
  return `<h2 id="phSheetT">${esc(dishLabel(m))}</h2><p class="hy-sub">${esc(m.section || '')}${m.desc ? '. ' + esc(m.desc) : ''}</p>
    <div class="hy-sum"><span>Preis laut Karte</span><b>${eur(m.price)}</b></div>
    ${phSec('Allergene')}${alg}${ai.state === 'open' ? `<p class="hy-min no">${ai.letters.length ? 'Angabe unvollständig' : 'Noch nicht gepflegt'}. Im Zweifel in der Küche fragen.</p>` : ai.state === 'none' ? '<p class="hy-text">Keine Allergene.</p>' : ''}
    ${m.card && C(m.card) ? `<button type="button" class="hy-btn q" data-act="openCard" data-id="${m.card}">Rezept öffnen</button>` : ''}`;
}

/* ---------- Vorbereitung: Tag wählen, abhaken ---------- */
const _renderVorbPh = renderVorb;
renderVorb = function(){
  if(!phOn()) return _renderVorbPh();
  const ix = plIdx(); const t = todayStr(); const off = Math.max(0, Math.min(6, +view.pl.off || 0)); const D = dAdd(t, off); const s = phS();
  const back = phBackBtn(phBackLabel());
  const days = `<div class="hy-chips hy-days" role="tablist" aria-label="Tag wählen">${[0, 1, 2, 3, 4, 5, 6].map(i => { const d = dAdd(t, i); const cl = (S.settings.closed || []).includes(dParse(d).getDay()); return `<button type="button" role="tab" aria-selected="${i === off}" class="${i === off ? 'on' : ''} ${cl ? 'closed' : ''}" data-act="plDay" data-id="${i}">${i === 0 ? 'Heute' : i === 1 ? 'Morgen' : `${PL_WD[dParse(d).getDay()]} ${+d.slice(8)}.`}</button>`; }).join('')}</div>`;
  if(!ix.days.length) return phHead('Vorbereitung', '', back) + `<p class="hy-text">Für eine Prognose braucht es Verkäufe. Die Artikelumsätze aus der Kasse laden Sie am besten am Laptop.</p><button type="button" class="hy-btn q" data-act="plKasse">Kasse importieren</button>`;
  const fc = vbForecast(D);
  if(fc.closed) return phHead('Vorbereitung', '', back) + days + `<p class="hy-text"><b>Ruhetag.</b> ${esc(dParse(D).toLocaleDateString('de-AT', {weekday:'long', day:'numeric', month:'long'}))} ist nichts vorzubereiten. Wählen Sie oben einen anderen Tag.</p>`;
  const pl = vbPlan(D); const ro = !canEditAll();
  const chk = planState().chk[D] || {}; const vis = i => view.pl.allIng || !i.minor || chk[i.key];
  const all = pl.groups.reduce((a, g) => a + g.items.filter(vis).length, 0), done = pl.groups.reduce((a, g) => a + g.items.filter(i => chk[i.key]).length, 0);
  const facSeg = `<div class="seg pl-fac" role="group" aria-label="Wie wird der Tag?">${PL_FACS.map(([f, l]) => `<button type="button" class="${Math.abs(pl.fac - f) < 0.001 ? 'on' : ''}" data-act="plFac" data-id="${f}" aria-pressed="${Math.abs(pl.fac - f) < 0.001}">${l}</button>`).join('')}</div>`;
  return phHead('Vorbereitung', '', back) + days
    + `<p class="hy-fcline"><span><b>${num(pl.total)} Portionen</b> erwartet${pl.fac !== 1 ? (pl.fac > 1 ? ', volles Haus' : ', ruhiger Tag') : ''}</span><button type="button" class="hy-lnk" data-act="phFc" aria-expanded="${!!s.fc}">${s.fc ? 'Fertig' : 'Ändern'}</button></p>`
    + (s.fc ? `<div class="hy-fc">${vbFcHtml(pl, ro, facSeg)}${vbMiseHtml(pl)}</div>` : `<div class="hy-bar"><i id="phPlBar" style="width:${all ? (done / all * 100).toFixed(1) : 0}%"></i></div>${pl.nMiss ? `<p class="hy-min no">${pl.nMiss} ${pl.nMiss === 1 ? 'Zutat fehlt' : 'Zutaten fehlen'}. <button type="button" class="hy-lnk" data-act="phFc">Ansehen</button></p>` : ''}` + vbPrepHtml(pl).replace('class="day-h">Vorbereitungsliste<span', 'class="day-h"><span class="hy-sr">Vorbereitungsliste</span><span'));   // die Überschrift steht oben schon; für Vorleser bleibt sie
};

/* ---------- Rezepte: Liste und Küchen-Ansicht ---------- */
function phRezList(){
  const q = (phS().rq || '').trim().toLowerCase(); const list = S.cards.filter(c => !q || c.name.toLowerCase().includes(q));
  const grp = [['Gerichte', c => c.type !== 'semi' && !c.drink], ['Basisrezepte', c => c.type === 'semi'], ['Getränke', c => c.type !== 'semi' && c.drink]];
  const h = grp.map(([t, f]) => { const l = list.filter(f).sort(byName); return l.length ? phSec(t, String(l.length)) + `<ul class="hy-board">${l.map(c => `<li><button type="button" class="hy-row hy-one" data-act="openCard" data-id="${c.id}"><span class="hy-tm"><b>${esc(c.name)}</b></span>${ico('phChev', 'hy-chev')}</button></li>`).join('')}</ul>` : ''; }).join('');
  return h || `<p class="hy-hint">${q ? `Kein Rezept für „${esc(phS().rq.trim())}“.` : 'Noch keine Rezepte.'}</p>`;
}
const _renderCardsPh = renderCards;
renderCards = function(){
  if(!phOn()) return _renderCardsPh();
  return phHead('Rezepte', '', phBackBtn(phBackLabel())) + `<label class="hy-field hy-solo">${ico('search')}<input id="phRq" type="search" autocomplete="off" placeholder="Rezept suchen" aria-label="Rezept suchen" value="${esc(phS().rq || '')}"></label><div id="phRl">${phRezList()}</div>`;
};
/* Am Handy öffnet jede Rezeptur in der Küchen-Ansicht. Kalkulation und Service bleiben über den Umschalter erreichbar. */
const _rzDefaultPh = rzDefault;
rzDefault = function(){ return phOn() ? 'kueche' : _rzDefaultPh(); };

/* ---------- Adressen und Zurück ---------- */
function phBackLabel(){ const f = phS().from; return f === 'such' ? 'Suchen' : f === 'best' ? 'Bestellen' : f === 'mehr' ? 'Mehr' : 'Heute'; }
const _hashWantPh = hashWant;
hashWant = function(){
  if(phOn()){ const s = phS(); if(view.tab === 'dash' && s.page) return s.page === 'such' ? 'suchen' : 'mehr';
    if(view.tab === 'stock' && view.stab === 'inventur' && s.loc != null && S.invDraft) return 'ware/inventur/' + (s.loc || '-'); }
  return _hashWantPh();
};
const _hashParsePh = hashParse;
hashParse = function(h){ if(phOn() && (h === 'suchen' || h === 'mehr')) return {tab:'dash'}; return _hashParsePh(/^ware\/inventur\//.test(h) ? 'ware/inventur' : h); };
const _fromHashPh = fromHash;
fromHash = function(){
  if(!phOn()) return _fromHashPh();
  let h = ''; try { h = decodeURIComponent(location.hash.slice(1)); } catch(e){ h = location.hash.slice(1); }
  if(!h) return _fromHashPh();
  const s = phS(); const page = h === 'suchen' ? 'such' : h === 'mehr' ? 'mehr' : null; const m = /^ware\/inventur\/(.+)$/.exec(h); const loc = m ? (m[1] === '-' ? '' : m[1]) : null;
  const before = [view.tab, s.page, s.loc, view.card, view.order, view.stab].join('|');
  if(page){ if(view.tab !== 'dash' || s.page !== page){ phSheetClose(true); s.page = page; s.loc = null; view = {...view, tab:'dash', card:null, order:null, recv:null}; render(); } hashSync(); return; }
  s.page = null; s.loc = loc; if(h !== 'ware/bestellen') s.buyAll = false;
  PH.replace = true; try { _fromHashPh(); } finally { PH.replace = false; }   // beim Zurückgehen nur die Adresse ordnen, nie einen neuen Schritt anlegen
  if(before !== [view.tab, s.page, s.loc, view.card, view.order, view.stab].join('|')){ phSheetClose(true); render(); }
};
/* Zurück-Taste des Handys: jede neue Adresse wird ein Schritt im Verlauf, wie fix-2 (rezept.js) es auch über 700 px macht.
   Wie dort ersetzt nur der Wechsel der Ansicht einer Rezeptur (Küche, Kalkulation, Service) den Eintrag, damit Zurück nicht doppelt zählt. */
const _hashSyncPh = hashSync;
hashSync = function(){
  if(!phOn()) return _hashSyncPh();
  try { const w = hashWant(); const cur = decodeURIComponent(location.hash.slice(1)); if(cur === w) return; const base = x => String(x).replace(/\/(kalkulation|kueche|service)$/, '');
    if(!cur || PH.replace || base(cur) === base(w)) history.replaceState(null, '', '#' + w); else history.pushState(null, '', '#' + w); RZ_HLAST = w; } catch(e){}
};

/* ---------- Leiste unten ---------- */
function phNavHtml(){
  const it = (a, icon, l) => `<button type="button" class="nav-i hy-nav" ${a}>${ico(icon)}<span>${l}</span></button>`;
  return it('data-tab="dash" data-ph="heute"', 'phToday', 'Heute') + it('data-act="phSuch" data-ph="such"', 'search', 'Suchen') + it('data-tab="buy" data-ph="best"', 'cart', 'Bestellen') + it('data-act="phMehr" data-ph="mehr"', 'more', 'Mehr');
}
function phNavOn(){
  const k = phKey(); const s = phS();
  if(k === 'heute' || k === 'such' || k === 'mehr' || k === 'best') return k;
  if(view.tab === 'buy') return 'best';
  return s.from === 'best' ? 'mehr' : s.from || 'mehr';
}
/* Klasse und Seiten-Kennung nur setzen, wenn sie sich ändern: jede Änderung lässt den Browser die Stile der ganzen Seite neu rechnen.
   Vor dem Zeichnen gesetzt, rechnet render() (das für den Übergang einmal das Layout abfragt) gleich mit den Handy-Regeln. */
function phMarks(){
  const on = phOn(); const root = document.documentElement; if(root.classList.contains('ph') !== on) root.classList.toggle('ph', on);
  const app = document.getElementById('app'); if(!app) return on;
  const k = on ? phKey() : null; if(k){ if(app.dataset.ph !== k) app.dataset.ph = k; } else if('ph' in app.dataset) delete app.dataset.ph;
  const kue = !!k && k === 'rezk' && rzMode(C(view.card)) === 'kueche'; if(app.classList.contains('hy-kueche') !== kue) app.classList.toggle('hy-kueche', kue);
  return on;
}
/* Statusleiste des Handys in der Farbe der Seite (der dunkle Kopf ist am Handy weg). Erst im nächsten Bild gelesen:
   sonst müsste der Browser mitten in render() alle Stile einmal extra rechnen (am Start rund 10 ms bei gedrosseltem Prozessor). */
function phThemeColor(){
  if(PH.tcT) return; PH.tcT = requestAnimationFrame(() => { PH.tcT = 0;
    try { const m = document.querySelector('meta[name="theme-color"]'); if(!m) return; if(PH.tc == null) PH.tc = m.getAttribute('content'); const want = phOn() ? getComputedStyle(document.body).backgroundColor : PH.tc; if(m.getAttribute('content') !== want) m.setAttribute('content', want); } catch(e){} });
}
function phApply(){
  const on = phMarks(); phThemeColor();
  const slot = document.querySelector('.bottom .nav-slot'); const app = document.getElementById('app');
  if(!on){ if(slot && slot.querySelector('.hy-nav')){ slot.innerHTML = navHtml(true); navApply(); } if(phSheetOpen()) phSheetClose(true); return; }
  if(slot && !slot.querySelector('.hy-nav')) slot.innerHTML = phNavHtml();
  const k = phKey();
  const cur = phNavOn(); document.querySelectorAll('.bottom .hy-nav').forEach(b => { const o = b.dataset.ph === cur; if(b.classList.contains('on') !== o){ b.classList.toggle('on', o); if(o) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); } });
  // bestehende Seiten ohne eigenen Zurück-Knopf bekommen einen
  if(app && k === 'x' && !app.querySelector('.back, .hy-back')) app.insertAdjacentHTML('afterbegin', phBackBtn(phBackLabel()));
  if(k === 'rezk' && app && !app.querySelector('.hy-rzmore') && rzMode(C(view.card)) === 'kueche' && canEditAll()) app.insertAdjacentHTML('beforeend', `<p class="hy-rzmore"><button type="button" class="hy-lnk" data-act="rzView" data-id="kalk">Kalkulation ansehen</button><button type="button" class="hy-lnk" data-act="rzView" data-id="service">Ansicht für den Service</button></p>`);
  try { if(k === 'heute' && typeof relInd === 'function') relInd(); } catch(e){}
  if(phSheetOpen() && PH.sheet){ if((PH.sheet.kind === 'ord' && !(PH.ord && ORD(PH.ord.id) && ORD(PH.ord.id).status === 'draft')) || (PH.sheet.kind === 'count' && !(PH.cnt && P(PH.cnt.pid)))) phSheetClose(true); else phSheetDraw(); }
}
const _renderPh = render;
render = function(){
  try { phMarks(); } catch(e){}
  _renderPh();
  try { phApply(); } catch(e){ console.warn('Handy:', e); }
};
function phMqChange(){ const s = phS(); if(!phOn()){ s.page = null; s.loc = null; s.buyAll = false; } try { render(); } catch(e){} }
if(PH_MQ.addEventListener) PH_MQ.addEventListener('change', phMqChange); else if(PH_MQ.addListener) PH_MQ.addListener(phMqChange);

/* ---------- Bedienung ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el || !phOn()) return; const act = el.dataset.act, id = el.dataset.id || '';
  if(document.body.classList.contains('gd-help')) return;
  // Aktionen der App, die aus einem Blatt heraus eine andere Seite oder einen Dialog öffnen: Blatt zu
  if(phSheetOpen() && el.closest('#phSheet') && ['ordRecv', 'moveDlg', 'sales', 'plKasse', 'openCard', 'ordCloudSend'].includes(act)){ phSheetClose(true); return; }
  if(act === 'ordMarkSent' && phSheetOpen()){ phSheetClose(true); return; }
  if(!/^ph[A-Z]/.test(act)) return;
  const s = phS();
  switch(act){
    case 'phSuch': phGo('such'); setTimeout(() => { const i = document.getElementById('phQ'); if(i && el.classList.contains('hy-find')) i.focus(); }, 30); break;
    case 'phMehr': phGo('mehr'); break;
    case 'phScan': phScan(); break;
    case 'phBack': phBack(); break;
    case 'phClose': phSheetTryClose(); break;
    case 'phKeep': { const bar = el.closest('.hy-discard'); if(bar) bar.remove(); const i = document.getElementById('phCntV'); if(i) i.focus({preventScroll:true}); break; }
    case 'phDrop': phSheetClose(); render(); break;
    case 'phTheme': setTheme(themeIcon() ? 'light' : 'dark'); render(); break;
    case 'phLap': s.lap = !s.lap; render(); if(s.lap) setTimeout(() => { const l = document.querySelector('#app .hy-lapl'); if(l) l.scrollIntoView({block:'nearest', behavior:'smooth'}); }, 30); break;
    case 'phLapGo': phLapGo(id); break;
    case 'phAbend': phSheet(phAbendHtml); break;
    case 'phWe': phSheet(phWeHtml); break;
    case 'phPal': { const x = (PH.palHits || [])[+id]; if(x && x.run){ phSheetClose(true); try { x.run(); } catch(err){ console.warn(err); } } break; }
    case 'phDish': { const m = S.menu.find(x => x.id === id); if(m) phSheet(() => phDishHtml(id)); break; }
    case 'phArt': phCount(id); break;
    case 'phArtEdit': { const p = P(id); phSheetClose(true); if(p) prodDialog(p); break; }
    case 'phBf': s.bf = id; render(); break;
    case 'phFc': s.fc = !s.fc; render(); break;
    case 'phBuyAll': s.buyAll = true; s.from = 'best'; render(); window.scrollTo({top:0}); break;
    case 'phOrd': phOrdOpen(id); break;
    case 'phOrdOther': phSheet(phOrdOtherHtml); break;
    case 'phOl': { const o = PH.ord && ORD(PH.ord.id); if(!o) break; const [i, dir] = id.split(':').map(Number); const l = o.lines[i]; if(!l) break; l.n = Math.max(0, Math.round(((+l.n || 0) + dir) * 100) / 100); phOrdKeep(); PH.ord.asked = null; save(); phSheetDraw(); const b = document.querySelector(`#phSheet [data-act="phOl"][data-id="${i}:${dir}"]`); if(b) b.focus({preventScroll:true}); break; }
    case 'phOrdSave': { const o = phOrdKeep(); save(); phSheetClose(); render(); if(o) toast(`Entwurf ${o.no} gespeichert`); break; }
    case 'phOrdSend': if(PH.ord){ phOrdKeep(); save(); PH.ord.asked = id; view.opened = PH.ord.id; view.openedVia = id; setTimeout(phSheetDraw, 350); } break;
    case 'phOrdCopy': { const o = phOrdKeep(); if(!o) break; save(); const txt = orderText(o); const pr = navigator.clipboard && navigator.clipboard.writeText(txt); const ok = () => { toast('Bestelltext kopiert'); if(PH.ord){ PH.ord.asked = 'Text'; phSheetDraw(); } }; if(pr) pr.then(ok, ok); else ok(); break; }
    case 'phOrdNot': if(PH.ord){ PH.ord.asked = null; view.opened = null; phSheetDraw(); } break;
    case 'phOrdDel': { const oid = id; phSheetClose(true); S.orders = S.orders.filter(o => o.id !== oid); save(); render(); toast('Entwurf gelöscht'); break; }
    case 'phCntStep': { const c = PH.cnt; const p = c && P(c.pid); if(!p) break; phCntRead(); const base = c.v === '' ? phCntStock(p) : +c.v; c.v = Math.max(0, Math.round((base + (+id) * phCntStep(p)) * 1000) / 1000); const i = document.getElementById('phCntV'); if(i){ i.value = numIn(c.v); i.classList.remove('bad-in'); } break; }
    case 'phCntT': { const c = PH.cnt; if(!c) break; phCntRead(); c.t = c.t === +id ? 0 : +id; phSheetDraw(); const b = document.querySelector(`#phSheet [data-act="phCntT"][data-id="${id}"]`); if(b) b.focus({preventScroll:true}); break; }
    case 'phCntSave': phCntSave(false); break;
    case 'phCntSame': phCntSave(true); break;
    case 'phCntSkip': phCntNext(); break;
    case 'phInvLoc': s.loc = id === '~' ? null : id === '-' ? '' : id; render(); hashSync(); window.scrollTo({top:0}); break;
    case 'phInvNext': { const loc = id === '-' ? '' : id; s.loc = loc; render(); hashSync(); window.scrollTo({top:0}); const nx = phInvList(loc).find(p => !phInvDone(p)); if(nx) phCount(nx.id, {loc, seq:true}); break; }
    case 'phInvArt': phCount(id, {loc:s.loc, seq:true}); break;
  }
});
document.addEventListener('change', e => {
  const t = e.target; if(!t || !phOn()) return;
  if(t.id === 'phOlAdd' && t.value && PH.ord){ const o = ORD(PH.ord.id); const p = P(t.value); if(o && p){ o.lines.push(lineFor(p, packSuggest(p) || 1)); phOrdKeep(); PH.ord.asked = null; save(); phSheetDraw(); } }
  // nur das Feld des Artikels, der gerade im Blatt steht (beim Weiterzählen meldet das alte Feld sein „change“ erst, wenn schon der nächste Artikel dasteht)
  if(t.id === 'phCntV' && PH.cnt && t.dataset.pid === PH.cnt.pid && t.isConnected) phCntRead();
});
document.addEventListener('keydown', e => { if(e.key === 'Enter' && e.target && e.target.id === 'phCntV'){ e.preventDefault(); phCntSave(false); } });
