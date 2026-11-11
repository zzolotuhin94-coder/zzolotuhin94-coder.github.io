/* =====================================================================
   Einrichtung (sechs Stationen aus echten Daten), Preis-Check,
   Teller (Rezeptur bauen), leere Zustände.
   ===================================================================== */
ICO.einr = '<circle cx="5" cy="19" r="2"/><path d="M7 19h6a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h6"/><circle cx="19" cy="3" r="2"/>';
ICO.check = '<path d="M5 12.5l4.5 4.5L19 7.5"/>';
ICO.tag = '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>';
ICO.pot = '<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 10h20M8.5 10V7.5M15.5 10V7.5M7 4.5h10"/>';
ICO.plate = '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5.5"/>';
ICO.coins = '<ellipse cx="10" cy="7" rx="7" ry="3"/><path d="M3 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M3 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>';
ICO.help = '<circle cx="12" cy="12" r="9.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>';

/* ---------- Daten: welche Station schon als fertig gemeldet wurde ---------- */
function gameMigrate(d){
  const g = d.game && typeof d.game === 'object' ? d.game : {};
  // ältere Stände: Stempel, Aufgaben und Stufen gibt es nicht mehr, die Felder fallen weg
  d.game = {done: g.done && typeof g.done === 'object' && !Array.isArray(g.done) ? g.done : {}, init: !!g.init};
  return d;
}

/* ---------- Stationen: Fortschritt aus echten Daten ---------- */
function firstMenuWithoutCard(){ return menuSorted().find(m => !m.hidden && !(m.card && C(m.card))) || menuSorted().find(m => !(m.card && C(m.card))); }
function stations(){
  const prods = S.products.filter(p=>!p.noStock);
  const confirmed = prods.filter(p=>!p.priceDemo).length;
  const sups = (S.suppliers||[]).filter(s=>s.active);
  const supOk = sups.filter(s => (s.email||s.whatsapp||s.phone||s.shopUrl) && s.orderDays.length && s.deliveryDays.length).length;
  const semis = S.cards.filter(c=>c.type==='semi');
  const semiOk = semis.filter(c => c.items.length && c.items.every(i=>refObj(i.ref) && +i.qty>0) && (+c.yieldG>0 || totals(c).out>0)).length;
  const withCard = S.menu.filter(m=>m.card && C(m.card)).length;
  const withAlg = S.menu.filter(hasAlg).length;
  const realDays = Object.keys(S.salesDays||{}).filter(d => (S.salesReal||{})[d]).length;
  const nextDish = firstMenuWithoutCard();
  const noAlg = S.menu.find(m=>!hasAlg(m));
  const pct = (a,b) => b ? Math.min(100, Math.round(a/b*100)) : 0;
  const list = [
    {k:'sup', no:1, name:'Lieferanten', ico:'truck', done:supOk, total:sups.length, pct: sups.length ? pct(supOk, sups.length) : 0,
      metric: sups.length ? `${supOk} von ${sups.length} Lieferanten mit Kontakt, Bestell- und Liefertagen` : 'Noch kein Lieferant angelegt',
      wozu:'Wer liefert was, an welchen Tagen? Dann weiß die App, wann bestellt werden muss.',
      act: supOk < sups.length || !sups.length ? {l: sups.length ? 'Lieferanten vervollständigen' : 'Ersten Lieferanten anlegen', a:'goBuyTab', id:'lieferanten'} : {l:'Lieferanten ansehen', a:'goBuyTab', id:'lieferanten'}},
    {k:'prices', no:2, name:'Preise', ico:'tag', done:confirmed, total:prods.length, pct:pct(confirmed, prods.length),
      metric: `${confirmed} von ${prods.length} Preisen bestätigt`,
      wozu:'Jede Zutat braucht Ihren echten Einkaufspreis. Erst dann stimmt der Wareneinsatz.',
      act: confirmed < prods.length ? {l:`Preis-Check starten · ${prods.length-confirmed} offen`, a:'pcStart', id:''} : {l:'Preise ansehen', a:'goTab', id:'products'}, alt:{l:'Artikelliste aus Datei importieren', id:'prod'}},
    {k:'semi', no:3, name:'Basisrezepte', ico:'pot', done:semiOk, total:semis.length, pct: semis.length ? pct(semiOk, semis.length) : 0,
      metric: semis.length ? `${semiOk} von ${semis.length} Basisrezepten vollständig (Zutaten + Ausbeute)` : 'Noch kein Basisrezept',
      wozu:'Teig, Fond, Dressing: einmal als Charge anlegen, in vielen Gerichten verwenden.',
      act: semis.length && semiOk < semis.length ? {l:'Basisrezept vervollständigen', a:'openCard', id:(semis.find(c => !(c.items.length && c.items.every(i=>refObj(i.ref) && +i.qty>0) && (+c.yieldG>0 || totals(c).out>0)))||semis[0]).id} : {l:'Neues Basisrezept', a:'newCard', id:'semi'}},
    {k:'recipes', no:4, name:'Rezepturen', ico:'cards', done:withCard, total:S.menu.length, pct:pct(withCard, S.menu.length),
      metric: `${withCard} von ${S.menu.length} Gerichten haben eine Rezeptur`,
      wozu:'Was in ein Gericht kommt. Daraus rechnet die App Wareneinsatz und Allergene.',
      act: nextDish ? {l:`Rezeptur anlegen: ${nextDish.name}`, a:'newCardFor', id:nextDish.id} : {l:'Rezepturen ansehen', a:'goTab', id:'cards'}, alt:{l:'Rezepturen aus Datei importieren', id:'rec'}},
    {k:'menu', no:5, name:'Speisekarte', ico:'menu', done:withAlg, total:S.menu.length, pct:pct(withAlg, S.menu.length),
      metric: `${withAlg} von ${S.menu.length} Gerichten mit vollständiger Allergenangabe`,
      wozu:'Preise, Allergene, Saison: Was die Gäste sehen, in Österreich mit Allergenpflicht.',
      act: noAlg ? {l:`Allergene ergänzen · ${S.menu.length - withAlg} offen`, a:'goMenu', id:'noalg'} : {l:'Gästekarte ansehen', a:'goGuest', id:''}, alt:{l:'Speisekarte aus Datei importieren', id:'menu'}},
    {k:'sales', no:6, name:'Kasse', ico:'report', done:realDays ? 1 : 0, total:1, pct: realDays ? 100 : 0,
      metric: `${realDays} ${realDays === 1 ? 'Verkaufstag' : 'Verkaufstage'} aus Ihrer Kasse importiert`,
      wozu:'Was wurde verkauft, was hat es gebracht? Mit Kassendaten wird aus Kalkulation Wissen.',
      act: realDays ? {l:'Auswertung öffnen', a:'goTab', id:'report'} : {l:'Kasse importieren', a:'goReportTab', id:'import'}},
  ];
  return list;
}
function einrStand(){
  const st = stations(); const all = st.every(x => x.pct >= 100); const pct = all ? 100 : Math.min(99, Math.round(st.reduce((s,x)=>s+x.pct,0)/st.length));   // 100 % erst, wenn wirklich alles fertig ist
  return {pct, doneN: st.filter(x=>x.pct>=100).length, st, next: st.find(x=>x.pct < 100) || null};
}

/* ---------- Ansicht: Einrichtung ---------- */
function renderEinrichtung(){
  const o = einrStand(); const nx = o.next;
  const row = s => { const st = s.pct >= 100 ? 'done' : (nx && nx.k === s.k) ? 'active' : 'open';
    return `<li class="au-row ${st}">
      <span class="au-n">${s.pct>=100 ? ico('check') : s.no}</span>
      <span class="au-t"><b>${esc(s.name)}</b><small>${esc(s.wozu)}</small>${s.alt && s.pct < 100 ? `<small class="ed-links"><button type="button" class="link" data-act="datenOpen" data-id="${s.alt.id}">${esc(s.alt.l)}</button></small>` : ''}</span>
      <span class="au-p"><span>${esc(s.metric)}</span><span class="au-m"><i style="width:${s.pct}%"></i></span></span>
      <span class="au-a"><button type="button" class="btn sm ${st==='active'?'primary':''}" data-act="${s.act.a}" data-id="${esc(s.act.id)}">${esc(s.act.l)}</button></span>
    </li>`; };
  return `<button type="button" class="back" data-act="goTab" data-id="dash">${ico('arrow')}Heute</button>
  <div class="page-h"><div><h1>Einrichtung</h1><p class="sub">${o.pct>=100 ? 'Alles eingerichtet. Ab jetzt nur noch pflegen.' : `${o.doneN} von ${o.st.length} fertig. Der Stand rechnet sich aus Ihren Daten.`}</p></div></div>
  <div class="au-sum"><span class="au-m big"><i style="width:${o.pct}%"></i></span><span class="au-sum-t"><b>${o.pct} %</b></span></div>
  <ol class="au-list">${o.st.map(row).join('')}</ol>`;
}
/* Heute: eine schmale Zeile, bis alles eingerichtet ist */
function einrLine(){
  const o = einrStand(); if(o.pct >= 100) return '';
  return `<button type="button" class="line-btn einr-line" data-act="goTab" data-id="einr"><span><b>Einrichtung ${o.pct} %</b>${o.next ? ` · als Nächstes: ${esc(o.next.name)}` : ''}</span><em>weiter</em></button>`;
}
/* Station fertig: ein Haken in der Liste und eine Zeile unten, nichts, das den Inhalt verdeckt */
function einrCheck(){
  if(!S || !S.game) return;
  const g = S.game; const st = stations(); let ch = false; const fresh = [];
  st.forEach(s => { const full = s.pct >= 100;
    if(full && !g.done[s.k]){ g.done[s.k] = todayStr(); ch = true; if(g.init) fresh.push(s); }
    else if(!full && g.done[s.k]){ delete g.done[s.k]; ch = true; } });
  if(!g.init){ g.init = true; ch = true; }   // erster Blick: was schon fertig ist, wird still vermerkt
  if(ch) save();
  if(fresh.length) toast(`Einrichtung: ${fresh.map(s => s.name).join(', ')} fertig`);
}

/* ---------- Preis-Check ---------- */
function pcQueue(ids){
  const all = ids ? ids.map(P).filter(Boolean) : S.products.filter(p=>p.priceDemo && !p.noStock);
  return all.sort((a,b) => supName(a).localeCompare(supName(b),'de') || usage('p:'+b.id).length - usage('p:'+a.id).length || byName(a,b)).map(p=>p.id);
}
function avgFcAll(){ const l = S.menu.map(menuCalc).filter(k=>k.fc!=null); return l.length ? l.reduce((s,k)=>s+k.fc,0)/l.length : null; }
function dishesUsing(pid){ return S.menu.filter(m=>m.card && C(m.card)).map(m=>({m, k:menuCalc(m)})).filter(x => explode(x.k.c, 1).has(pid)); }
function pcStart(ids){
  const q = pcQueue(ids && ids.length ? ids : null);
  // merken, von wo der Preis-Check gestartet wurde: „Beenden“ führt dorthin zurück
  if(view.tab !== 'pcheck') view.pcFrom = {tab:view.tab, card:view.tab === 'cards' ? view.card : null};
  view.pc = {q, i:0, saved:0, confirmed:0, skipped:0, avg0:avgFcAll(), last:null, ids:!!(ids && ids.length), hist:[], msg:'', sure:null};
  go('pcheck');
  setTimeout(() => $('#pcIn')?.focus(), 50);
}
function pcStep(kind){
  const pc = view.pc; if(!pc) return; const p = P(pc.q[pc.i]); if(!p){ pc.i++; render(); return; }
  pc.hist = pc.hist || [];
  const stay = msg => { pc.msg = msg; const el = $('#pcMsg'); if(el){ el.innerHTML = msg; el.hidden = !msg; } const i = $('#pcIn'); if(i){ i.classList.toggle('bad-in', !!msg && !pc.sure); i.focus(); i.select(); } };
  let val = null;
  if(kind === 'save'){
    const raw = $('#pcIn') ? $('#pcIn').value.trim() : '';
    if(raw === '') kind = 'ok'; // leer = Richtwert stimmt (steht so unter dem Feld)
    else { const v = numParse(raw);
      if(!isFinite(v) || v <= 0){ pc.sure = null; return stay(v === 0 ? 'Ein Preis von 0 ist nicht möglich. Bitte den Einkaufspreis eintippen oder „Richtwert stimmt“ wählen.' : 'Das ist kein gültiger Preis. Bitte eine Zahl eintippen, zum Beispiel 12,50.'); }
      const pu = priceUnit(p); val = Math.round(v*100)/100; const ref = +p.price*pu.f;
      if(ref > 0 && (val > ref*5 || val < ref/5) && pc.sure !== val){ pc.sure = val; return stay(`Wirklich ${eur(val)} je ${esc(pu.word)}? Der Richtwert ist ${eur(ref)}. <button type="button" class="btn sm" data-act="pcSave">Ja, übernehmen</button>`); } }
  }
  if(kind === 'ok' && !(+p.price > 0)) return stay('Dieser Artikel hat noch keinen Preis. Bitte den Einkaufspreis eintippen oder überspringen.');
  pc.msg = ''; pc.sure = null;
  pc.hist.push({i:pc.i, pid:p.id, kind, prev:{price:p.price, priceDemo:p.priceDemo, priceDate:p.priceDate, priceSrc:p.priceSrc}, saved:pc.saved, confirmed:pc.confirmed, skipped:pc.skipped, last:pc.last});
  if(kind === 'skip'){ pc.skipped++; pc.last = null; }
  else {
    const before = dishesUsing(p.id).map(x => ({name:dishLabel(x.m), a:x.k.fc}));
    const old = +p.price;
    const pu = priceUnit(p); if(kind === 'save') p.price = prRound(p, val / pu.f);
    markPrice(p, kind === 'save' ? 'Preis-Check' : 'bestätigt');
    if(kind === 'save') pc.saved++; else pc.confirmed++;
    const after = dishesUsing(p.id).map(x => x.k.fc);
    pc.last = {name:p.name, unit:pu.word, old:old*pu.f, nw:+p.price*pu.f, changed: kind==='save' && Math.abs(old-p.price)*pu.f > 0.004, dishes: before.map((b,i)=>({name:b.name, a:b.a, b:after[i]})).filter(d=>d.a!=null).sort((x,y)=>Math.abs(y.b-y.a)-Math.abs(x.b-x.a)).slice(0,3)};
    save();
  }
  pc.i++; render();
  setTimeout(() => { const i = $('#pcIn'); if(i){ i.focus(); } }, 30);
}
/* einen Schritt zurück: letzte Entscheidung samt Preisänderung rückgängig machen */
function pcBack(){
  const pc = view.pc; if(!pc || !pc.hist || !pc.hist.length) return; const h = pc.hist.pop(); const p = P(h.pid);
  if(p && h.kind !== 'skip'){ p.price = h.prev.price; p.priceDemo = h.prev.priceDemo; if(h.prev.priceDate === undefined) delete p.priceDate; else p.priceDate = h.prev.priceDate; if(h.prev.priceSrc === undefined) delete p.priceSrc; else p.priceSrc = h.prev.priceSrc; save(); }
  pc.i = h.i; pc.saved = h.saved; pc.confirmed = h.confirmed; pc.skipped = h.skipped; pc.last = h.last; pc.msg = ''; pc.sure = null;
  render(); toast(p ? `Zurück zu ${p.name}` : 'Einen Schritt zurück'); setTimeout(() => $('#pcIn')?.focus(), 30);
}
function pcFromLabel(){ const f = view.pcFrom || {}; return f.tab === 'cards' && f.card ? 'Zurück zur Rezeptur' : f.tab === 'products' ? 'Zur Preisliste' : f.tab === 'einr' ? 'Zur Einrichtung' : !f.tab ? 'Zu den Preisen' : 'Zurück'; }
function pcLeave(){ const f = view.pcFrom || {tab:'products'}; view.pc = null; view.pcBack = null; view.pcFrom = null; go(f.tab === 'cards' && f.card && !C(f.card) ? 'cards' : (f.tab || 'products'), f.tab === 'cards' ? (f.card && C(f.card) ? f.card : null) : null); }
function renderPriceCheck(){
  const pc = view.pc;
  const head = `<div class="page-h"><div><h1>Preis-Check</h1></div>
    <div class="row-btns">${pc && pc.hist && pc.hist.length ? `<button type="button" class="btn" data-act="pcBack">${ico('arrow')}Zurück</button>` : ''}<button type="button" class="btn" data-act="pcEnd" title="${esc(pcFromLabel())}">Beenden</button></div></div>`;
  if(!pc){ const n = S.products.filter(p=>p.priceDemo && !p.noStock).length;
    return head + emptyHtml('tag', n ? `${n} Preise warten auf Bestätigung` : 'Alle Preise sind bestätigt', n ? 'Wir gehen Artikel für Artikel durch: echten Einkaufspreis eintippen oder den Richtwert bestätigen.' : 'Neue Preise übernehmen Sie beim Wareneingang oder direkt in der Preisliste.', n ? `<button type="button" class="btn primary" data-act="pcStart">${ico('tag')}Preis-Check starten</button>` : `<button type="button" class="btn" data-act="goTab" data-id="products">Zu den Preisen</button>`); }
  const total = pc.q.length, i = pc.i;
  const prog = `<div class="pc-prog"><div class="pc-prog-t"><b>${Math.min(i,total)} von ${total}</b><span>${pc.saved} eingetragen · ${pc.confirmed} bestätigt · ${pc.skipped} übersprungen</span></div><div class="meter au-meter"><i style="width:${total?Math.min(100,i/total*100):100}%"></i></div></div>`;
  const fb = pc.last ? `<div class="pc-fb ${pc.last.changed?'chg':'ok'}">${ico('check')}<div><b>${esc(pc.last.name)}</b> ${pc.last.changed ? `${eur(pc.last.old)} → <b>${eur(pc.last.nw)}</b> je ${esc(pc.last.unit)}` : `${eur(pc.last.nw)} je ${esc(pc.last.unit)} bestätigt`}
      ${pc.last.dishes.length ? `<div class="pc-fb-d">${pc.last.dishes.map(d=>`<span>${esc(d.name)} <em class="${fcClass(d.b)}">${num(d.a,1)} % → ${num(d.b,1)} %</em></span>`).join('')}</div>` : (pc.last.changed ? '<div class="pc-fb-d muted">Noch in keiner Rezeptur verwendet.</div>' : '')}</div></div>` : '';
  if(i >= total){
    const avg1 = avgFcAll();
    return head + prog + `<section class="pc-done">
      <div class="pc-tick">${ico('check')}</div>
      <h2>${pc.ids ? 'Zutaten geprüft' : 'Preis-Check fertig'}</h2>
      <p>${pc.saved} Preise eingetragen, ${pc.confirmed} bestätigt${pc.skipped?`, ${pc.skipped} übersprungen`:''}.${pc.avg0!=null && avg1!=null ? ` Ø Wareneinsatz der kalkulierten Gerichte: ${num(pc.avg0,1)} % → <b>${num(avg1,1)} %</b>.` : ''}</p>
      <div class="row-btns" style="justify-content:center">${pc.skipped ? `<button type="button" class="btn" data-act="pcStart">Übersprungene noch einmal</button>` : ''}<button type="button" class="btn primary" data-act="pcEnd">${esc(pcFromLabel())}</button>${(view.pcFrom||{}).tab === 'products' ? '' : `<button type="button" class="btn" data-act="goTab" data-id="products">Preisliste</button>`}</div>
    </section>` + fb;
  }
  const p = P(pc.q[i]); if(!p){ pc.i++; return renderPriceCheck(); }
  const uses = dishesUsing(p.id); const semis = usage('p:'+p.id).filter(c=>c.type==='semi');
  const pu = priceUnit(p); const unitTxt = isDrink(p) ? p.pack : p.unit === 'Stk' ? 'Stück' : p.unit === 'l' ? 'Liter' : 'Kilogramm';
  return head + prog + `<section class="pc-card" data-key="${p.id}">
    <div class="pc-sup">${ico('truck')}<span>${esc(supName(p))}${p.artNo?` · Art.-Nr. ${esc(p.artNo)}`:''}${p.pack?` · ${esc(p.pack)}`:''}</span><span class="pc-count">Nr. ${i+1}</span></div>
    <h2 class="pc-name">${esc(p.name)}</h2>
    <div class="pc-grid">
      <div class="pc-ex ${+p.price > 0 ? '' : 'none'}"><small>${+p.price > 0 ? 'Richtwert' : 'Preis fehlt'}</small><b>${+p.price > 0 ? eur(p.price*pu.f) : '—'}</b><span>je ${esc(unitTxt)}${p.unit==='Stk'&&p.pieceG?` · ${num(p.pieceG)} g`:''} · exkl. MwSt.</span></div>
      <label class="pc-in"><span>Ihr Einkaufspreis je ${esc(pu.word)}</span><span class="pc-field"><em>€</em><input id="pcIn" class="num-in" type="text" inputmode="decimal" data-num="self" placeholder="${+p.price > 0 ? num2(p.price*pu.f) : '0,00'}" autocomplete="off" aria-describedby="pcMsg"></span><small>${+p.price > 0 ? 'Netto, wie auf der Rechnung. Leer lassen, wenn der Richtwert stimmt.' : 'Netto, wie auf der Rechnung. Für diesen Artikel gibt es noch keinen Preis.'}</small><span class="pc-msg" id="pcMsg" role="alert" ${pc.msg?'':'hidden'}>${pc.msg||''}</span></label>
    </div>
    <div class="pc-uses">${uses.length || semis.length ? `<b>Steckt in:</b> ${uses.slice(0,6).map(x=>`<span>${esc(dishLabel(x.m))} <em class="${fcClass(x.k.fc)}">${num(x.k.fc,1)} %</em></span>`).join('')}${semis.map(c=>`<span>${esc(c.name)} <em>Basisrezept</em></span>`).join('')}${uses.length>6?`<span class="muted">+${uses.length-6} weitere</span>`:''}` : '<span class="muted">Noch in keiner Rezeptur verwendet.</span>'}</div>
    <p class="pc-alg ${prodAlgState(p)}">Allergene: ${prodAlgState(p) === 'has' ? `<b>${esc(algClean(p.alg).join(' '))}</b>` : prodAlgState(p) === 'none' ? 'keine (bestätigt)' : '<b>nicht gepflegt</b>'} · <button type="button" class="link" data-act="pcAlg" data-id="${p.id}">${prodAlgState(p) === 'open' ? 'eintragen' : 'ändern'}</button></p>
    <div class="pc-acts">${pc.hist && pc.hist.length ? `<button type="button" class="btn" data-act="pcBack">${ico('arrow')}Zurück</button>` : ''}<button type="button" class="btn" data-act="pcSkip">Überspringen<kbd>Esc</kbd></button><span class="sp"></span>${+p.price > 0 ? `<button type="button" class="btn" data-act="pcOk">${ico('check')}Richtwert stimmt</button>` : ''}<button type="button" class="btn primary" data-act="pcSave">Übernehmen<kbd>↵</kbd></button></div>
  </section>${fb}`;
}

/* ---------- Teller: Rezeptur bauen ---------- */
function tellerHints(c){
  const h = []; const t = totals(c);
  const demo = [...demoPriceLines(c)];
  if(!c.items.some(it => refObj(it.ref))) h.push({cls:'', t:'Noch keine Zutaten. Sie können ein Rezept als Text einfügen: eine Zutat je Zeile', a:'recPaste', id:c.id, l:'Rezeptur einfügen'});
  else if(c.items.some(it => !refObj(it.ref))) h.push({cls:'bad', t:`${c.items.filter(it=>!refObj(it.ref)).length} Zutat ohne Auswahl`, a:'tellerTable', id:'', l:'Zur Tabelle'});
  if(demo.length) h.push({cls:'warn', t:`${demo.length} ${demo.length===1?'Zutat hat':'Zutaten haben'} noch einen Richtwert-Preis: ${demo.slice(0,3).map(id=>P(id)?.name).filter(Boolean).join(', ')}${demo.length>3?' …':''}`, a:'pcFor', id:demo.join(','), l:'Preise prüfen'});
  if(!(+c.yieldG > 0)) h.push({cls:'warn', t:c.type==='semi' ? 'Ausbeute der Charge fehlt (Gramm)' : 'Portionsgewicht fehlt (Gramm)', a:'focusEl', id:'cf-yieldG', l:'Eintragen'});
  if(!(c.img && IMG[c.img])) h.push({cls:'', t:'Kein Foto', a:'photoCard', id:c.id, l:'Foto'});
  if(!(c.steps||[]).some(s=>s.t && s.t.trim())) h.push({cls:'', t:'Zubereitung noch leer', a:'focusEl', id:'st-0', l:'Schritt schreiben'});
  if(c.type==='dish' && !S.menu.some(m=>m.card===c.id)) h.push({cls:'', t:'Noch nicht auf der Speisekarte', a:'toMenu', id:c.id, l:'Auf die Karte'});
  { const ai = algInfo({card:c.id}); if(c.items.length && ai.open.length) h.push({cls:'', t:`Allergene unvollständig: bei ${plural(ai.open.length, 'Artikel', 'Artikeln')} fehlt die Angabe`, a:'pFilter', id:'noalg', l:'Artikel pflegen'}); }
  return h;
}
function tellerHtml(c){
  const t = totals(c); const sum = t.cost || 0;
  const menus = S.menu.filter(m => m.card === c.id); const k0 = menus[0] ? menuCalc(menus[0]) : null;
  const parts = c.items.map((it,i) => ({i, it, l:t.lines[i]})).sort((a,b)=>b.l.cost-a.l.cost);
  const colorOf = {}; parts.forEach((p,idx) => colorOf[p.i] = idx < 6 ? `var(--s${idx+1})` : 'var(--s7)');
  // Donut
  const R = 54, CX = 70, CY = 70, cir = 2*Math.PI*R; let off = 0;
  const segs = sum ? parts.filter(p=>p.l.cost>0).map(p => { const f = p.l.cost/sum; const s = `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${colorOf[p.i]}" stroke-width="16" stroke-dasharray="${(f*cir).toFixed(2)} ${cir.toFixed(2)}" stroke-dashoffset="${(-off*cir).toFixed(2)}" transform="rotate(-90 ${CX} ${CY})"><title>${esc(p.l.name)}: ${eur(p.l.cost)} · ${num(f*100)} %</title></circle>`; off += f; return s; }).join('') : '';
  const plate = `<div class="plate"><svg viewBox="0 0 140 140" aria-hidden="true"><circle cx="${CX}" cy="${CY}" r="66" class="rim"/><circle cx="${CX}" cy="${CY}" r="${R}" class="trk" fill="none" stroke-width="16"/>${segs}</svg>
    <div class="plate-c"><b>${eur(sum)}</b><small>${c.type==='semi'?'pro Charge':'pro Portion'}</small>${c.type==='dish' ? `<span class="fc ${fcClass(k0?k0.fc:null)}">${k0 ? pct(k0.fc)+' WE' : 'nicht auf der Karte'}</span>` : (c.yieldG ? `<span class="fc na">${eur(t.cost/c.yieldG*1000)} / kg</span>` : '')}</div></div>`;
  const tile = ({i, it, l}) => { const r = refObj(it.ref); const p = r && r.t==='p' ? r.o : null; const share = sum ? l.cost/sum*100 : 0;
    const flags = [];
    if(!r) flags.push('<span class="ti-flag bad">Zutat wählen</span>');
    if(p && p.priceDemo && !p.noStock) flags.push('<span class="ti-flag" title="Preis ist noch ein Richtwert">Richtwert</span>');
    if(r && r.t==='c') flags.push('<span class="ti-flag">Basisrezept</span>');
    return `<div class="ti" style="--c:${colorOf[i]}">
      <span class="ti-dot"></span>
      <div class="ti-h"><b class="ti-n">${esc(r ? l.name.replace(/^BR · /,'') : 'Neue Zutat')}</b><button type="button" class="icon-btn ti-x" data-act="delLine" data-id="${i}" title="Vom Teller nehmen" aria-label="Vom Teller nehmen">${ico('x')}</button></div>
      ${r ? `<div class="ti-q"><span class="qty"><input id="qty-${i}" class="num-in" type="text" inputmode="decimal" data-li="${i}" data-lf="qty" value="${numIn(it.qty)}" aria-label="Menge ${esc(l.name)}"><em>${l.unit}</em></span><span class="ti-c"><b>${eur(l.cost)}</b><small>${num(share)} %</small></span></div>
      <div class="ti-bar"><i style="width:${Math.min(100,share).toFixed(1)}%"></i></div>
      <div class="ti-m">${l.unit==='Stk' ? `${num(l.grossG)} g brutto · ` : ''}netto ${num(l.net)} g · fertig ${num(l.out)} g${p && p.alg ? ` · ${esc(p.alg)}` : ''}${flags.length?' ':''}${flags.join('')}</div>`
      : `<div class="ti-q"><select id="ref-${i}" data-li="${i}" data-lf="ref" aria-label="Zutat">${refOptions(it.ref, c.id)}</select></div><div class="ti-m">${flags.join('')}</div>`}
    </div>`; };
  const hints = tellerHints(c);
  return `<section class="panel teller-sec">
    <div class="panel-h"><h2>${ico('plate')}Teller · Zutaten ${c.type==='semi'?'pro Charge':'pro Portion'}</h2></div>
    <div class="teller">${plate}
      <div class="tl-tiles">${c.items.map((it,i)=>tile({i,it,l:t.lines[i]})).join('')}
        <button type="button" class="ti ti-add" data-act="tellerPick">${ico('plus')}<b>Zutat</b><small>Artikel oder Basisrezept</small></button></div>
    </div>
    <div class="teller-f"><span class="kv-inline"><span>Brutto <b>${num(t.gross)} g</b></span><span>Netto <b>${num(t.net)} g</b></span><span>Fertig <b>${num(t.out)} g</b></span><span>Wareneinsatz <b>${eur(t.cost)}</b></span></span></div>
    ${moreOpts('teller', `<button type="button" class="btn sm" data-act="addLine">${ico('plus')}Leere Zeile</button><button type="button" class="btn sm" data-act="recPaste" data-id="${c.id}">Rezeptur einfügen</button><button type="button" class="btn sm" data-act="tellerMode" data-id="table">Als Tabelle bearbeiten (Brutto, Netto, Fertig)</button><button type="button" class="btn sm" data-act="dupCard" data-id="${c.id}">${ico('copy')}Rezeptur duplizieren</button>`)}
    ${hints.length ? `<ul class="hints">${hints.map(h=>`<li class="${h.cls}"><span>${esc(h.t)}</span><button type="button" class="btn sm" data-act="${h.a}" data-id="${esc(h.id)}">${esc(h.l)}</button></li>`).join('')}</ul>` : `<div class="teller-ok muted sm">${ico('check')}Vollständig: Zutaten, Preise, Foto, Zubereitung.</div>`}
  </section>`;
}
const _renderCardT = renderCard;
renderCard = function(c){
  let h = _renderCardT(c);
  if(vmode('teller') === 'table'){ return h.replace('<div class="panel-h pad"><h2>Zutaten', `<div class="panel-h pad teller-sw"><button type="button" class="link-btn" data-act="tellerMode" data-id="teller">${ico('arrow')}Zurück zum Teller</button></div><div class="panel-h pad"><h2>Zutaten`); }
  const a = h.indexOf('<div class="panel-h pad"><h2>Zutaten'); if(a < 0) return h;
  const s = h.lastIndexOf('<section class="panel flush">', a); const e = h.indexOf('</section>', a); if(s < 0 || e < 0) return h;
  return h.slice(0, s) + tellerHtml(c) + h.slice(e + '</section>'.length);
};
function tellerPickDialog(c){
  const ps = [...S.products].sort(byName), cs = S.cards.filter(x => x.type==='semi' && x.id!==c.id).sort(byName);
  const used = new Set(c.items.map(it=>it.ref));
  const tileP = p => `<button type="button" class="pk ${used.has('p:'+p.id)?'used':''}" data-pick="p:${p.id}" data-s="${esc((p.name+' '+supName(p)).toLowerCase())}"><b>${esc(p.name)}</b><small>${eur(p.price)} / ${esc(p.unit)}${p.priceDemo?' · Richtwert':''}</small>${used.has('p:'+p.id)?'<i>am Teller</i>':''}</button>`;
  const tileC = x => { const tt = totals(x); const y = +x.yieldG || tt.out; return `<button type="button" class="pk semi ${used.has('c:'+x.id)?'used':''}" data-pick="c:${x.id}" data-s="${esc(x.name.toLowerCase())} basisrezept"><b>${esc(x.name)}</b><small>Basisrezept · ${y ? eur(tt.cost/y*1000)+' / kg' : 'ohne Ausbeute'}</small>${used.has('c:'+x.id)?'<i>am Teller</i>':''}</button>`; };
  openDialog('Zutat auf den Teller', `<label class="search pk-s">${ico('search')}<input id="pkIn" placeholder="Zutat suchen …" autocomplete="off"></label>
    <div class="pk-wrap">${cs.length ? `<div class="pk-g">Basisrezepte</div><div class="pk-grid">${cs.map(tileC).join('')}</div>` : ''}<div class="pk-g">Artikel</div><div class="pk-grid">${ps.map(tileP).join('')}</div>
    <p class="hint pk-empty" hidden>Nichts gefunden. <button type="button" class="link" id="pkNew">Neuen Artikel anlegen</button></p></div>`, null,
    {cancel:'Schließen', after: f => {
      const inp = f.querySelector('#pkIn'); setTimeout(()=>inp.focus(), 30);
      const filter = () => { const q = inp.value.trim().toLowerCase(); let n = 0; f.querySelectorAll('.pk').forEach(b => { const on = !q || b.dataset.s.includes(q); b.hidden = !on; if(on) n++; }); f.querySelectorAll('.pk-g').forEach(g => { const grid = g.nextElementSibling; g.hidden = ![...grid.children].some(x=>!x.hidden); }); f.querySelector('.pk-empty').hidden = n > 0; };
      inp.oninput = filter;
      inp.onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); const first = [...f.querySelectorAll('.pk')].find(b=>!b.hidden); first && first.click(); } };
      f.onclick = e => { const b = e.target.closest('[data-pick]'); if(!b) return; const ref = b.dataset.pick; const r = refObj(ref); if(!r) return;
        $('#dlg').close(); tellerAdd(c, ref, null); };
      const nb = f.querySelector('#pkNew'); if(nb) nb.onclick = () => { $('#dlg').close(); prodDialog(); };
    }});
}

/* ---------- Leere Zustände ---------- */
function emptyHtml(icon, title, text, btn){ return `<section class="panel empty-s">${ico(icon)}<h3>${esc(title)}</h3><p>${esc(text)}</p>${btn ? `<div class="row-btns" style="justify-content:center">${btn}</div>` : ''}</section>`; }
const _renderCardsG = renderCards;
renderCards = function(){ return _renderCardsG().replace('<div class="panel empty">Keine Rezepturen gefunden.</div>', emptyHtml('cards', view.q ? 'Keine Rezeptur passt zur Suche' : 'Noch keine Rezepturen', view.q ? 'Anders schreiben oder die Suche leeren.' : 'Eine Rezeptur sagt, was in ein Gericht kommt und was es kostet.', view.q ? `<button type="button" class="btn" data-act="clearQ">Suche leeren</button>` : `<button type="button" class="btn primary" data-act="newCard" data-id="dish">${ico('plus')}Erste Rezeptur anlegen</button>`)); };
const _renderMenuCalcG = renderMenuCalc;
renderMenuCalc = function(){ return _renderMenuCalcG().replace('<div class="panel empty">Keine Gerichte für diesen Filter.</div>', emptyHtml('menu', 'Hier ist nichts', view.sec==='over' ? 'Kein Gericht liegt über dem Ziel-Wareneinsatz. Sehr gut.' : view.sec==='none' ? 'Jedes Gericht hat eine Rezeptur.' : view.sec==='noalg' ? 'Alle Gerichte haben Allergenangaben.' : 'Kein Gericht passt zu Filter und Suche.', `<button type="button" class="btn" data-act="sec" data-id="all">Alle Gerichte zeigen</button>`)); };

/* ---------- Ereignisse ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const id = el.dataset.id; const c = view.card ? C(view.card) : null;
  switch(el.dataset.act){
    case 'goBuyTab': view.stab = id; view.order = null; view.recv = null; go('buy'); break;
    case 'goReportTab': view.rp.tab = id; go('report'); break;
    case 'goGuest': view.mtab = 'guest'; go('menu'); break;
    case 'clearQ': view.q = ''; render(); break;
    case 'pcStart': view.pcBack = null; pcStart(); break;
    case 'pcFor': view.pcBack = view.card; pcStart(id.split(',').filter(Boolean)); break;
    case 'pcSkip': pcStep('skip'); break;
    case 'pcOk': pcStep('ok'); break;
    case 'pcSave': pcStep('save'); break;
    case 'pcEnd': pcLeave(); break;
    case 'pcBack': pcBack(); break;
    case 'tellerMode': setV('teller', id); render(); break;
    case 'tellerTable': setV('teller', 'table'); render(); break;
    case 'tellerPick': if(c) tellerPickDialog(c); break;
    case 'focusEl': { const n = document.getElementById(id); if(n){ n.scrollIntoView({behavior:'smooth', block:'center'}); n.focus({preventScroll:true}); } else if(id==='st-0' && c){ c.steps = c.steps || []; if(!c.steps.length){ c.steps.push({t:'',img:''}); save(); render(); } setTimeout(()=>document.getElementById('st-0')?.focus(), 50); } break; }
  }
});
document.addEventListener('keydown', e => {
  if(view.tab !== 'pcheck' || !view.pc || $('#dlg').open || !$('#pal').hidden) return;
  if(e.key === 'Enter' && e.target.id === 'pcIn'){ e.preventDefault(); pcStep('save'); }
  else if(e.key === 'Escape'){ e.preventDefault(); pcStep('skip'); }
});
