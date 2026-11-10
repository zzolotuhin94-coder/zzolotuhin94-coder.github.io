/* =====================================================================
   Navigation: sieben Bereiche und die Einstellungen.
   Heute · Vorbereitung · Checklisten · Speisekarte · Rezepte · Ware · Team & Zahlen
   Dazu: Adressen (#ware/bestellen …), alte Adressen leiten um, „Mehr“ am Handy,
   der gemeinsame Kopf für Ware und Team & Zahlen, die Einstellungen.
   ===================================================================== */
ICO.ware = ICO.stock; ICO.team = ICO.dienst;
ICO.more = '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>';
ICO.minus = ICO.minus || '<path d="M5 12h14"/>';

const NAV = [['dash','Heute','Heute'],['vorb','Vorbereitung','Prep'],['checkl','Checklisten','Checklisten'],['menu','Speisekarte','Karte'],['cards','Rezepte','Rezepte'],['ware','Ware','Ware'],['team','Team & Zahlen','Team']];
const NAV_BOTTOM = ['dash','vorb','checkl','cards'];                 // Handy: vier Bereiche und „Mehr“
const NAV_MORE = ['menu','ware','team','setup'];                     // stehen am Handy unter „Mehr“
const NAV_OF = {dash:'dash', vorb:'vorb', checkl:'checkl', menu:'menu', cards:'cards', stock:'ware', buy:'ware', products:'ware', pcheck:'ware', dienst:'team', report:'team', setup:'setup', einr:'setup'};
function navKey(tab){ return NAV_OF[tab] || tab; }
function navHtml(short){
  const item = (k, l) => `<button type="button" class="nav-i" data-tab="${k}" title="${esc(NAV_DESC[k] || '')}">${ico(k)}<span>${l}</span></button>`;
  if(short) return NAV.filter(n => NAV_BOTTOM.includes(n[0])).map(n => item(n[0], n[2])).join('') + `<button type="button" class="nav-i" data-act="mehr" aria-haspopup="dialog" aria-expanded="false">${ico('more')}<span>Mehr</span></button>`;
  return NAV.map(n => item(n[0], n[1])).join('') + '<div class="nav-gap" aria-hidden="true"></div>' + item('setup', 'Einstellungen');
}

/* ---------- Wohin führt ein Bereich? ---------- */
function tabResolve(tab){
  if(tab === 'ware'){ view.stab = 'bestand'; return 'stock'; }
  if(tab === 'team') return 'dienst';
  if(tab === 'stock' && BUY.includes(view.stab)) return 'buy';
  if(tab === 'buy' && !BUY.includes(view.stab)) view.stab = 'bestellung';
  if(tab === 'stock' && !['bestand','inventur','buchungen'].includes(view.stab)) view.stab = 'bestand';
  return TABS.some(t => t[0] === tab) ? tab : 'dash';
}
function navGo(k){ view.order = null; view.recv = null; mehrClose(); if(k === 'ware') view.stab = 'bestand'; go(k); }

/* ---------- Ware: sechs Reiter über drei Seiten ---------- */
const WARE_TABS = [['bestand','Bestand','stock','bestand'],['bestellen','Bestellen','buy','bestellung'],['lieferanten','Lieferanten','buy','lieferanten'],['preise','Preise','products',''],['inventur','Inventur','stock','inventur'],['buchungen','Buchungen','stock','buchungen']];
function wareKey(){ const t = view.tab; if(t === 'products' || t === 'pcheck') return 'preise'; const w = WARE_TABS.find(x => x[2] === t && x[3] === view.stab); return w ? w[0] : t === 'buy' ? 'bestellen' : 'bestand'; }
function wareGo(k){ const w = WARE_TABS.find(x => x[0] === k) || WARE_TABS[0]; view.order = null; view.recv = null; if(w[3]) view.stab = w[3]; go(w[2]); }
function wareHead(btns){
  const open = S.orders.filter(o => ['draft','sent','confirmed','complaint'].includes(o.status)).length;
  return `<div class="page-h"><div><h1>Ware</h1></div>${btns ? `<div class="row-btns">${btns}</div>` : ''}</div>
  <div class="toolbar tabs">${seg('wtab', wareKey(), WARE_TABS.map(w => [w[0], w[1], w[0] === 'bestellen' && open ? open : null]))}</div>`;
}
/* ---------- Team & Zahlen: Dienstplan und Auswertung ---------- */
function teamTabs(){ return `<div class="toolbar tabs">${seg('ttab', view.tab === 'report' ? 'report' : 'dienst', [['dienst','Dienstplan'],['report','Auswertung']])}</div>`; }

/* ---------- Bestellen und Lieferanten ---------- */
function renderBuy(){
  if(!BUY.includes(view.stab)) view.stab = 'bestellung';
  if(view.order && ORD(view.order)) return orderView();
  if(view.stab === 'lieferanten') return wareHead(`<button type="button" class="btn primary" data-act="supEdit" data-id="">${ico('plus')}Lieferant</button>`) + supplierView();
  const t = todayStr(); const dueAll = (S.suppliers||[]).filter(sp => sp.active && sp.orderDays.includes(wd(t))); const due = dueAll.filter(sp => supToday(sp).state === 'open').length;
  const exp = S.orders.filter(o => ['sent','confirmed'].includes(o.status) && o.deliveryDate <= t).length;
  const month = S.orders.filter(o => o.receipt && o.receipt.date.slice(0,7) === t.slice(0,7)).reduce((a,o) => a + deliveredTotal(o), 0);
  const fact = `<p class="fact">${dueAll.length ? `Heute noch bestellen: <b>${due}</b> von ${dueAll.length}` : 'Heute ist kein Bestelltag'} · ${exp ? `<b>${exp}</b> ${exp === 1 ? 'Lieferung' : 'Lieferungen'} heute prüfen` : 'heute keine Lieferung'} · Einkauf im ${MONTHS[+t.slice(5,7) - 1]} <b>${eur(month)}</b></p>`;
  return wareHead(`<button type="button" class="btn" data-act="moveDlg" data-id="in">Lieferung ohne Bestellung</button><button type="button" class="btn primary" data-act="buyNew">${ico('plus')}Bestellung</button>`) + fact + orderView();
}

/* ---------- Preise (früher „Produkte“) ---------- */
const PROD_SORTS = [['','Name'],['sup','Lieferant'],['price','Preis']];
function renderProducts(){
  const q = view.pq.trim().toLowerCase(); const f = view.pf || 'all'; const wide = !!view.pcols;
  const all = S.products.filter(p => !p.noStock);
  const nDemo = all.filter(p => p.priceDemo).length; const sCol = (SORTS.products && SORTS.products.col) || '';
  let list = all.filter(p => (!q || (p.name+' '+supName(p)+' '+(p.artNo||'')).toLowerCase().includes(q)) && (f==='all' || (f==='demo' ? p.priceDemo : !p.priceDemo)));
  list = sCol === 'sup' ? list.sort((a,b) => supName(a).localeCompare(supName(b),'de') || byName(a,b)) : sCol === 'price' ? list.sort((a,b) => (+b.price||0) - (+a.price||0)) : list.sort(byName);
  const cols = wide ? 9 : 5;
  const more = moreOpts('products', `${nDemo ? `<button type="button" class="btn sm" data-act="newProd">${ico('plus')}Produkt</button>` : ''}<button type="button" class="btn sm" data-act="plImport">Preisliste importieren</button>${nDemo && list.some(p => p.priceDemo) ? `<button type="button" class="btn sm" data-act="pConfirmAll" data-id="${f}">Angezeigte Richtwerte bestätigen</button>` : ''}
    <label class="f inl">Sortieren<select data-sel="psort" aria-label="Sortieren">${PROD_SORTS.map(([k,l]) => `<option value="${k}" ${sCol===k?'selected':''}>${l}</option>`).join('')}</select></label>
    <label class="tog"><input type="checkbox" data-pcols="1" ${wide?'checked':''}><span></span>Putzverlust, Garverlust, Allergene zeigen</label>`);
  return wareHead(nDemo ? `<button type="button" class="btn primary" data-act="pcStart">${ico('tag')}Preis-Check · ${nDemo}</button>` : `<button type="button" class="btn primary" data-act="newProd">${ico('plus')}Produkt</button>`)
  + `<p class="fact">${all.length} Produkte · Preise je Einheit ohne Steuer${nDemo ? ` · <b>${nDemo}</b> ${nDemo === 1 ? 'Richtwert' : 'Richtwerte'} noch nicht bestätigt` : ' · alle Preise bestätigt'}</p>
  <div class="toolbar"><label class="search">${ico('search')}<input id="pq" type="search" placeholder="Produkt, Lieferant oder Artikelnummer" value="${esc(view.pq)}" autocomplete="off"></label>${seg('pFilter', f, [['all','Alle',all.length],['demo','Richtwerte',nDemo],['ok','Bestätigt',all.length-nDemo]])}</div>
  <div class="lt-wrap"><table class="lt"><thead><tr><th>Produkt</th><th class="hide-m">Lieferant</th><th class="r">Preis €</th><th>Stand</th>${wide ? '<th class="r hide-m">Putzverlust</th><th class="r hide-m">Garverlust</th><th class="hide-m">Allergene</th><th class="r hide-m">Rezepturen</th>' : ''}<th></th></tr></thead><tbody>
  ${list.map(p => `<tr class="row" data-act="editProd" data-id="${p.id}">
    <td><div class="lt-n"><span><b>${esc(p.name)}</b><small>${p.unit==='Stk'&&p.pieceG?`je Stk · ${num(p.pieceG)} g`:`je ${esc(p.unit)}`}${p.artNo?' · Nr. '+esc(p.artNo):''}${p.pack?' · '+esc(p.pack):''}</small></span></div></td>
    <td class="hide-m lt-muted">${esc(supName(p))}</td>
    <td class="r"><input class="lt-price num-in" id="pp-${p.id}" type="text" inputmode="decimal" data-num="req price" data-pp="${p.id}" data-pf="price" value="${num2(p.price)}" aria-label="Preis ${esc(p.name)}"></td>
    <td>${p.priceDemo ? '<span class="st-ref" title="Richtwert, noch nicht bestätigt">Richtwert</span>' : `<span class="lt-muted sm">${p.priceDate?fmtDate(p.priceDate+'T12:00:00'):'bestätigt'}${p.priceSrc?' · '+esc(p.priceSrc):''}</span>`}</td>
    ${wide ? `<td class="r hide-m">${num(+p.lossCold||0,1)} %</td><td class="r hide-m">${num(+p.lossHot||0,1)} %</td><td class="hide-m">${chips(new Set(algList(p.alg)))}</td><td class="r hide-m">${usage('p:'+p.id).length}</td>` : ''}
    <td><div class="lt-acts">${p.priceDemo?`<button type="button" class="btn sm" data-act="pConfirm" data-id="${p.id}" title="Preis stimmt">Stimmt</button>`:''}<button type="button" class="icon-btn" data-act="editProd" data-id="${p.id}" aria-label="Bearbeiten">${ico('edit')}</button></div></td></tr>`).join('') || `<tr><td colspan="${cols}" class="lt-muted">Nichts gefunden.</td></tr>`}
  </tbody></table></div>
  ${more}`;
}

/* ---------- Adressen ---------- */
const HASH = {dash:'heute', vorb:'vorbereitung', checkl:'checklisten', setup:'einstellungen', einr:'einrichtung', pcheck:'ware/preis-check', products:'ware/preise', dienst:'team/dienstplan', report:'team/auswertung'};
function hashWant(){
  const t = view.tab;
  if(t === 'cards') return 'rezepte' + (view.card ? '/' + view.card : '');
  if(t === 'menu') return 'speisekarte' + ({guest:'/gaestekarte', plan:'/saison'}[view.mtab] || '');
  if(t === 'stock') return 'ware/' + (['inventur','buchungen'].includes(view.stab) ? view.stab : 'bestand');
  if(t === 'buy') return 'ware/' + (view.stab === 'lieferanten' ? 'lieferanten' : 'bestellen');
  return HASH[t] || 'heute';
}
function hashSync(){ try { const w = hashWant(); if(decodeURIComponent(location.hash.slice(1)) !== w) history.replaceState(null, '', '#' + w); } catch(e){} }
/* Adresse lesen. Neue Adressen und alle früheren (#stock, #buy, #products, #aufbau, #labor …) */
function hashParse(h){
  const i = h.indexOf('/'); const a = i < 0 ? h : h.slice(0, i), b = i < 0 ? '' : h.slice(i + 1);
  switch(a){
    case 'heute': case 'dash': return {tab:'dash'};
    case 'vorbereitung': case 'vorb': return {tab:'vorb'};
    case 'checklisten': case 'checkl': return {tab:'checkl'};
    case 'speisekarte': case 'menu': return {tab:'menu', mtab: b === 'gaestekarte' ? 'guest' : b === 'saison' ? 'plan' : 'calc'};
    case 'rezepte': case 'cards': return {tab:'cards', card: b && C(b) ? b : null};
    case 'labor': return {tab:'cards'};
    case 'ware': { const w = WARE_TABS.find(x => x[0] === b); if(b === 'preis-check') return {tab:'pcheck'}; return w ? {tab:w[2], stab:w[3] || null} : {tab:'stock', stab:'bestand'}; }
    case 'stock': return {tab:'stock', stab:'bestand'};
    case 'buy': return {tab:'buy', stab:'bestellung'};
    case 'products': return {tab:'products'};
    case 'pcheck': return {tab:'pcheck'};
    case 'team': return {tab: b === 'auswertung' ? 'report' : 'dienst'};
    case 'dienst': return {tab:'dienst'};
    case 'report': return {tab:'report'};
    case 'einstellungen': case 'setup': case 'begriffe': return {tab:'setup'};
    case 'einrichtung': case 'aufbau': case 'stempel': return {tab:'einr'};
  }
  return null;
}
function fromHash(){
  let h = ''; try { h = decodeURIComponent(location.hash.slice(1)); } catch(e){ h = location.hash.slice(1); }
  if(!h) return;
  const r = hashParse(h); if(!r){ hashSync(); return; }
  const same = r.tab === view.tab && (r.tab !== 'cards' || (r.card || null) === (view.card || null)) && (!r.stab || r.stab === view.stab) && (!r.mtab || r.mtab === view.mtab);
  if(!same){ view = {...view, tab:r.tab, card:r.card || null, q:'', sim:null}; if(r.stab) view.stab = r.stab; if(r.mtab) view.mtab = r.mtab; view.order = null; view.recv = null; render(); }
  hashSync();
}

/* ---------- „Mehr“ am Handy: ein Blatt von unten ---------- */
function mehrOpen(){
  let el = document.getElementById('mehr');
  if(!el){ el = document.createElement('div'); el.id = 'mehr'; el.className = 'sheet'; el.hidden = true; document.body.appendChild(el); }
  const cur = navKey(view.tab);
  const row = (k, l) => `<li><button type="button" class="sheet-i ${cur === k ? 'on' : ''}" data-tab="${k}">${ico(k)}<span><b>${l}</b><small>${esc(NAV_DESC[k] || '')}</small></span></button></li>`;
  el.innerHTML = `<div class="sheet-bg" data-act="mehrClose"></div><div class="sheet-box" role="dialog" aria-modal="true" aria-label="Mehr"><div class="sheet-h"><b>Mehr</b><button type="button" class="icon-btn" data-act="mehrClose" aria-label="Schließen">${ico('x')}</button></div>
    <ul class="sheet-l">${NAV_MORE.map(k => row(k, k === 'setup' ? 'Einstellungen' : NAV.find(n => n[0] === k)[1])).join('')}
      <li><button type="button" class="sheet-i" data-act="mehrSuche">${ico('search')}<span><b>Suche</b><small>Gericht, Rezeptur, Produkt oder Seite finden.</small></span></button></li></ul></div>`;
  el.hidden = false; document.body.classList.add('sheet-on');
  document.querySelectorAll('.nav-i[data-act="mehr"]').forEach(b => b.setAttribute('aria-expanded', 'true'));
  const f = el.querySelector('.sheet-i'); if(f) f.focus({preventScroll:true});
}
function mehrClose(){
  const el = document.getElementById('mehr'); if(!el || el.hidden) return; el.hidden = true; document.body.classList.remove('sheet-on');
  document.querySelectorAll('.nav-i[data-act="mehr"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
}
window.addEventListener('keydown', e => { const el = document.getElementById('mehr'); if(e.key === 'Escape' && el && !el.hidden){ e.preventDefault(); e.stopImmediatePropagation(); mehrClose(); const b = document.querySelector('.bottom .nav-i[data-act="mehr"]'); if(b) b.focus(); } }, true);

/* ---------- Nach jedem Zeichnen: wo bin ich? ---------- */
function navApply(){
  try { const tb = document.querySelector('.topbar'); document.documentElement.style.setProperty('--top-h', ((tb && tb.offsetHeight) || 0) + 'px'); } catch(e){}
  const cur = navKey(view.tab);
  document.querySelectorAll('.nav-i[data-tab], .sheet-i[data-tab], #whoami').forEach(b => b.classList.toggle('on', b.dataset.tab === cur && b.id !== 'whoami'));
  const mehr = document.querySelector('.bottom .nav-i[data-act="mehr"]'); if(mehr) mehr.classList.toggle('on', !NAV_BOTTOM.includes(cur));
  document.querySelectorAll('.nav-i').forEach(b => { if(b.classList.contains('on')) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  const tab = TABS.find(x => x[0] === view.tab); const c = view.tab === 'cards' && view.card ? C(view.card) : null;
  try { document.title = (c ? c.name + ' · ' : '') + (tab ? tab[1] : 'Küche') + ' · DAHUAM.202'; } catch(e){}
  // „Sie sind hier“ neben dem Zurück-Knopf
  const b = $('#app .back'); if(b && !b.closest('.crumb')){
    let here = ''; if(c) here = c.name; else if(view.order && ORD(view.order)){ const o = ORD(view.order); here = (view.recv ? 'Wareneingang · ' : 'Bestellung ') + o.no; }
    const nav = document.createElement('nav'); nav.className = 'crumb'; nav.setAttribute('aria-label', 'Sie sind hier'); b.parentNode.insertBefore(nav, b); nav.appendChild(b);
    nav.insertAdjacentHTML('beforeend', (here ? `<span class="crumb-sep" aria-hidden="true">/</span><span class="crumb-here" aria-current="page">${esc(here)}</span>` : '') + (HOWTO[guideCtx()] && !$('#app .page-h .wozu-q') ? `<span class="sp"></span><button type="button" class="crumb-q" data-act="guideHere" aria-expanded="false" aria-label="So geht’s hier: kurze Anleitung für diese Seite">${ico('help')}<span>So geht’s hier</span></button>` : ''));
  }
  // Beispieldaten: eine ruhige Zeile unten in der Seitenleiste
  const dl = document.getElementById('demoSide'); if(dl){ dl.hidden = !(S && S.demo); if(S && S.demo && !dl.firstChild) dl.innerHTML = demoLine(); }
}
function demoLine(){ return `Beispieldaten · <button type="button" class="link" data-act="goDemo">eigene Daten</button>`; }
(function navShell(){
  const foot = document.querySelector('.side .side-foot');
  if(foot && !document.getElementById('demoSide')) foot.insertAdjacentHTML('beforebegin', '<p class="demo-line" id="demoSide" hidden></p>');
})();
const _renderNav = render;
render = function(){
  _renderNav();
  try { navApply(); einrCheck(); hashSync(); } catch(e){ console.warn('Navigation:', e); }
};

/* ---------- Einstellungen ---------- */
function renderSetup(){
  const n = Object.keys(IMG).length, s = S.settings, u = me(); const cloud = cloudReady(); const ro = !canEditAll(); const o = einrStand();
  if(REL.snaps === null) relSnaps(); if(REL.persist === null) relPersist(false);
  const sf = safetyGet();
  const cloudBox = FRAMED ? `<p class="hint">Die Cloud funktioniert in der installierten Version der App auf Ihrer Website. In dieser Vorschau ist sie abgeschaltet.</p>`
    : cloud ? `<div class="kv"><span>Betrieb</span><span>${esc(CL.rname)}</span><span>Angemeldet</span><span>${esc(whoLabel(CL.member ? {name:CL.member.name, role:roleNorm(CL.member.role)} : u))}</span><span>Konto</span><span>${esc(CL.email)}</span><span>Stand</span><span>${{ok:'alles übertragen', busy:'wird übertragen …', offline:'kein Internet', err:'nicht übertragen'}[cloudState]||'—'}</span></div>
        ${cloudMsg?`<p class="hint">${esc(cloudMsg)}</p>`:''}
        <div class="row-btns" style="margin-top:12px"><button type="button" class="btn" data-act="cloudSync">Jetzt abgleichen</button><button type="button" class="btn danger" data-act="cloudOut">Abmelden</button></div>`
    : `<p class="hint" style="margin-top:0">Mit der Cloud sehen alle Geräte dieselben Daten und Fotos, und Bestellungen gehen mit einem Klick per E-Mail raus. Sie brauchen dafür ein eigenes Cloud-Projekt; Adresse und Schlüssel stehen in der Einrichtungs-Anleitung (Ordner <b>dahuam/cloud</b>).</p>
        <form id="cloudForm" class="cloud-form" novalidate>
          <label class="f">Adresse des Cloud-Projekts<input name="url" type="url" required inputmode="url" autocomplete="off" placeholder="https://…" value="${esc(CL.url||'')}"></label>
          <label class="f">Schlüssel des Projekts<input name="anon" required autocomplete="off" placeholder="lange Zeichenfolge aus der Anleitung" value="${esc(CL.anon||'')}"></label>
          <label class="f">Ihre E-Mail<input name="email" type="email" required autocomplete="username" value="${esc(CL.email||'')}"></label>
          <label class="f">Passwort<input name="pw" type="password" required autocomplete="current-password"></label>
          <div class="row-btns"><button type="submit" class="btn primary">Verbinden</button></div>
          <p class="hint bad-t" id="cloudErr" role="alert"></p>
        </form>`;
  return `<div class="page-h"><div><h1>Einstellungen</h1></div></div>
  <div class="setup-grid">
    <section class="panel"><div class="panel-h"><h2>Betrieb</h2></div><div class="fields">
      <label class="f">Name des Betriebs<input id="s-name" data-sf="name" value="${esc(s.name)}"></label>
      <label class="f">MwSt. Speisen, %<input id="s-vat" class="num-in" data-sf="vat" data-num="req de" data-max="100" data-msg="MwSt. muss zwischen 0 und 100 liegen, nicht geändert" type="text" inputmode="decimal" value="${numIn(s.vat)}"></label>
      <label class="f">Ziel-Wareneinsatz, %<input id="s-target" class="num-in" data-sf="target" data-num="req de" data-min="1" data-max="100" data-msg="Ziel-Wareneinsatz muss zwischen 1 und 100 liegen, nicht geändert" type="text" inputmode="decimal" value="${numIn(s.target)}"></label>
    </div><p class="hint">In Österreich gilt für Speisen der ermäßigte Steuersatz von 10 %. Der Wareneinsatz wird vom Preis ohne Steuer berechnet.</p>
    <details class="more" data-more="addr" ${(view.more||{}).addr?'open':''}><summary>Lieferadresse und Kontakt für Bestellungen</summary><div class="fields two">
      <label class="f">Lieferadresse<input data-us="addr" data-k="address" value="${esc(s.address)}"></label>
      <label class="f">Hinweis für Fahrer<input data-us="addr" data-k="deliveryNote" value="${esc(s.deliveryNote)}"></label>
      <label class="f">Telefon für Rückfragen<input data-us="addr" data-k="phone" value="${esc(s.phone)}"></label>
      <label class="f">Antwort-E-Mail<input data-us="addr" data-k="email" type="email" value="${esc(s.email)}"></label>
    </div></details></section>
    <section class="panel"><div class="panel-h"><h2>Wer arbeitet gerade?</h2><span class="muted sm">${esc(whoLabel(u))}</span></div>
      ${cloud ? `<p class="hint">Mit der Cloud verbunden: Name und Rolle kommen aus Ihrem Konto.</p>`
      : `<div class="who">${s.users.map(x=>`<button type="button" class="who-b ${s.currentUser===x.id?'on':''}" data-act="userSwitch" data-id="${x.id}" aria-pressed="${s.currentUser===x.id}"><b>${esc(x.name)}</b>${x.name===ROLES[x.role]?'':`<small>${ROLES[x.role]}</small>`}<small class="who-can">${x.role === 'chef' ? 'darf alles' : 'ansehen, abhaken, Bestellungen vorbereiten'}</small></button>`).join('')}</div>
        <p class="hint">Eine Auswahl auf diesem Gerät, ohne Passwort.</p>`}
    </section>
    <section class="panel gd-panel"><div class="panel-h"><h2>Hilfe</h2></div>
      <ul class="gd-rows">
        <li><span class="gd-r-t"><b>Rundgang</b><small>Die täglichen Seiten in fünf Schritten.</small></span><button type="button" class="btn sm" data-act="tourMain">Starten</button></li>
        <li><span class="gd-r-t"><b>Was ist das?</b><small>Einschalten und auf etwas tippen. Die App erklärt es und ändert dabei nichts.</small></span><button type="button" class="btn sm" data-act="helpMode" aria-pressed="${HELP_ON}">${HELP_ON ? 'Ausschalten' : 'Einschalten'}</button></li>
        <li><span class="gd-r-t"><b>Einrichtung</b><small>${o.pct >= 100 ? 'Alles eingerichtet.' : `${o.pct} % · ${o.doneN} von ${o.st.length} Schritten fertig.`}</small></span><button type="button" class="btn sm" data-act="goTab" data-id="einr">Öffnen</button></li>
      </ul></section>
    <section class="panel" id="setupDaten"><div class="panel-h"><h2>Sicherung</h2></div>
      <p class="hint" style="margin-top:0">${cloud ? 'Die Daten liegen in der Cloud und zusätzlich auf diesem Gerät. Eine Sicherung als Datei schadet trotzdem nicht.' : 'Daten und Fotos liegen nur in diesem Browser. Speichern Sie einmal pro Woche eine Sicherung als Datei.'}</p>
      <div class="row-btns wrap" style="margin-top:12px"><button type="button" class="btn primary" data-act="export">Sicherung erstellen</button>
        <button type="button" class="btn" data-act="importPick">Sicherung laden</button><input id="importFile" type="file" accept="application/json,.json" hidden></div>
      ${sf ? `<div class="safety"><span><b>Sicherheitskopie vom ${fmtDate(sf.at)}</b><small class="muted">${esc(sf.why||'')} · ${plural(+sf.nMenu||0,'Gericht','Gerichte')}, ${plural(+sf.nCards||0,'Rezeptur','Rezepturen')}</small></span><span class="row-btns"><button type="button" class="btn sm" data-act="safetyRestore">Letzte Daten wiederherstellen</button><button type="button" class="btn sm" data-act="safetyDl">Als Datei speichern</button></span></div>` : ''}
      <h3 class="rel-h3" id="setupDemo">${S.demo ? 'Beispieldaten' : 'Neu anfangen'}</h3>
      <p class="hint" style="margin-top:0">${S.demo ? 'Die App ist mit Beispieldaten gefüllt: Die Karte ist echt, Rezepturen, Preise und Bestände sind Richtwerte. Ersetzen Sie sie nach und nach, oder starten Sie leer.' : 'Sie arbeiten mit eigenen Daten.'}</p>
      <div class="row-btns wrap">${ro ? '' : `<button type="button" class="btn sm" data-act="demoEmpty">Leer starten</button>`}<button type="button" class="btn sm danger" data-act="reset">Beispieldaten wiederherstellen</button></div>
    </section>
    ${relPanel()}
  </div>
  <details class="more setup-more" data-more="setup" ${(view.more||{}).setup?'open':''}><summary>Mehr Optionen</summary><div class="setup-grid">
    <section class="panel"><div class="panel-h"><h2>Cloud</h2>${cloud?`<span class="cloud-chip ${cloudState}">${{ok:'synchron',busy:'speichert …',offline:'offline',err:'Fehler',off:''}[cloudState]}</span>`:''}</div>${cloudBox}<p class="hint">${n} Fotos gespeichert.</p></section>
  </div></details>`;
}

/* ---------- Klicks ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const id = el.dataset.id;
  switch(el.dataset.act){
    case 'wtab': wareGo(id); break;
    case 'ttab': go(id === 'report' ? 'report' : 'dienst'); break;
    case 'mehr': { const m = document.getElementById('mehr'); if(m && !m.hidden) mehrClose(); else mehrOpen(); break; }
    case 'mehrClose': mehrClose(); break;
    case 'mehrSuche': mehrClose(); palOpen(); break;
    case 'goDemo': view.more = Object.assign({}, view.more); go('setup'); setTimeout(() => { const t = document.getElementById('setupDemo'); if(t) t.scrollIntoView({block:'center'}); }, 60); break;
    case 'demoEmpty': ask('Leer starten? Alle Beispieldaten werden entfernt: Gerichte, Rezepturen, Produkte, Lieferanten, Verkäufe und das Beispiel-Team. Vorher legt die App eine Sicherheitskopie an.', () => { const d = relEmptyState(); if(!d){ toast('Leer starten ist gerade nicht möglich.'); return; } safetyStore('vor „Leer starten“'); S = d; setTimeout(() => toast('Leerer Betrieb angelegt', {label:'Rückgängig', ms:8000, action:safetyRestore}), 50); }, 'Leer starten'); break;
  }
});
document.addEventListener('change', e => { const t = e.target; if(t.dataset && t.dataset.pcols){ view.pcols = t.checked; render(); } });
