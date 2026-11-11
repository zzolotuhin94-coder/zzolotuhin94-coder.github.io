/* =====================================================================
   Bar & Getränke (Paket D1)
   Getränke-Artikel (Flasche, Fass, Kiste), Schankrezeptur, Pfand und Leergut,
   Zählen in Flaschen und Zehnteln, Beispiel-Getränke.
   Gerechnet wird überall im vorhandenen Kern: ein Getränk ist ein Artikel in Litern,
   eine Schankrezeptur ist eine Rezeptur vom Typ „Gericht“ mit c.drink = true.
   ===================================================================== */
const GEB = {fl:'Flasche', fass:'Fass', kiste:'Kiste'};
const VOL_U = {l:1000, cl:10, ml:1};
const numDe = (v, d = 3) => fin(v).toLocaleString('de-DE', {maximumFractionDigits:d});

/* ---------- Artikel ---------- */
function isDrink(p){ return !!(p && GEB[p.geb] && +p.gebL > 0 && p.unit === 'l'); }
function cntWord(p){ return p && p.geb === 'fass' ? 'Fass' : 'Fl.'; }
function gebLabel(geb, L, N){ return geb === 'kiste' ? `Kiste ${num(N)}×${numDe(L)} l` : `${GEB[geb] || 'Flasche'} ${numDe(L)} l`; }
function gebPrice(p){ return Math.round((+p.price || 0) * (+p.packQty || 0) * 100) / 100; }
/* Preis so, wie er auf der Rechnung steht: Getränke je Flasche, Fass oder Kiste, alles andere je Einheit */
function priceUnit(p){ return isDrink(p) && +p.packQty > 0 ? {f:+p.packQty, word:GEB[p.geb], label:p.pack} : {f:1, word:p ? p.unit : '', label:p ? p.unit : ''}; }
function prRound(p, v){ const k = isDrink(p) ? 10000 : 100; return Math.round(v * k) / k; }
/* Lager buchen: Wareneingang in Gebinden, Entnahme und Schwund in Flaschen (Fass: Liter) */
function mvUnit(p, type){
  if(!isDrink(p)) return {f:1, lbl:'Menge in ' + (p ? p.unit : 'Einheit'), word:'Einheit'};
  if(type === 'in') return {f:+p.packQty, lbl:`Anzahl ${{fl:'Flaschen', fass:'Fässer', kiste:'Kisten'}[p.geb]} (${p.pack.replace(/^\S+\s/, '')})`, word:GEB[p.geb]};
  return p.geb === 'fass' ? {f:1, lbl:'Menge in Litern', word:'Liter'} : {f:+p.gebL, lbl:'Anzahl Flaschen', word:'Flasche'};
}

/* ---------- Mengen ---------- */
function volTxt(ml){ ml = +ml || 0; return ml > 0 && ml < 100 ? numDe(ml / 10, 1) + ' cl' : numDe(ml / 1000) + ' l'; }
function volIn(ml, u){ return numIn(Math.round(ml / VOL_U[u] * 10000) / 10000); }
function volUnitFor(ml){ return +ml > 0 && +ml < 100 ? 'cl' : 'l'; }
/* Ausschankmenge eines Eintrags der Karte in ml: eigene Angabe, sonst die der Schankrezeptur */
function menuVol(m){ if(!m) return 0; if(+m.vol > 0) return +m.vol; const c = m.card ? C(m.card) : null; return c && c.drink && +c.yieldG > 0 ? +c.yieldG : 0; }
function guestVol(m){ return isDrinkEntry(m) && menuVol(m) ? volTxt(menuVol(m)) : ''; }
function menuTag(m){ return m.vlabel || (menuVol(m) ? volTxt(menuVol(m)) : ''); }
function drinkSection(){ const sv = S.settings.secVat || {}; return secList().find(s => sv[s] === 'g') || 'Getränke'; }
function isDrinkEntry(m){ return !!m && (vatClass(m) === 'g' || !!(m.card && C(m.card) && C(m.card).drink)); }
function drinkU(it){ return VOL_U[it.u] ? it.u : (+it.qty >= 100 ? 'l' : 'cl'); }
function volSel(attr, u){ return `<select ${attr} aria-label="Einheit">${Object.keys(VOL_U).map(k => `<option value="${k}" ${u === k ? 'selected' : ''}>${k}</option>`).join('')}</select>`; }

/* ---------- Schankrezeptur ---------- */
function renderDrinkCard(c){
  const t = totals(c); const menus = menuSorted().filter(m => m.card === c.id); const m0 = menus.find(m => menuFactor(m) === 1) || menus[0], k0 = m0 ? menuCalc(m0) : null;   // oben steht die Größe, für die die Rezeptur geschrieben ist
  const cats = [...new Set([...secList(), ...S.cards.map(x => x.category)].filter(Boolean))];
  const yu = VOL_U[c.yu] ? c.yu : volUnitFor(c.yieldG);
  const rows = c.items.map((it, i) => { const l = t.lines[i]; const liquid = !l.missing && l.unit === 'ml'; const u = liquid ? drinkU(it) : ''; const r = refObj(it.ref); const pl = r && r.t === 'p' ? pourLossOf(r.o) : 0;
    return `<tr>
      <td class="c-ing"><select id="dref-${i}" data-dref="${i}" aria-label="Artikel">${refOptions(it.ref, c.id).replace('— Zutat wählen —', '— Artikel wählen —')}</select>${pl ? `<small class="dk-loss">mit ${num(pl, 1)} % Schankverlust</small>` : ''}</td>
      <td class="r"><span class="dk-q"><input id="dq-${i}" class="num-in" type="text" inputmode="decimal" data-num="de" data-msg="Ungültige Menge, nicht geändert" data-dq="${i}" value="${it.qty === '' || it.qty == null ? '' : liquid ? volIn(+it.qty, u) : numIn(it.qty)}" aria-label="Menge">${liquid ? volSel(`data-du="${i}"`, u) : `<em>${l.missing ? '' : l.unit}</em>`}</span></td>
      <td class="r mono">${eur(l.cost)}</td>
      <td><button type="button" class="icon-btn" data-act="delLine" data-id="${i}" title="Zeile entfernen" aria-label="Zeile entfernen">${ico('x')}</button></td></tr>`; }).join('');
  const onCard = menus.map(m => { const k = menuCalc(m); const v = menuVol(m); return `<li><button type="button" data-act="editMenu" data-id="${m.id}"><span class="dk-on-n"><b>${esc(v ? volTxt(v) : m.vlabel || m.name)}</b>${m.vlabel && v && m.vlabel !== volTxt(v) ? `<small>${esc(m.vlabel)}</small>` : !v && !m.vlabel ? `<small>${esc(m.section)}</small>` : ''}</span><span class="mono">${eur(m.price)}</span><span class="mono dk-on-c">${eur(k.cost)}</span><span class="lt-fc ${fcClass(k.fc)}"><i></i>${k.fc != null ? num(k.fc, 1) + ' %' : '—'}</span></button></li>`; }).join('');
  return `<button type="button" class="back" data-act="backCards">${ico('arrow')}Alle Rezepturen</button>
  ${rzSwitch(c)}
  <div class="hero">
    <div class="hero-ph">${photo(c.img, c.name, c.category)}<button type="button" class="ph-btn big" data-act="photoCard" data-id="${c.id}">${ico('camera')}<span>${c.img && IMG[c.img] ? 'Foto ändern' : 'Foto hinzufügen'}</span></button>${c.img && IMG[c.img] ? `<button type="button" class="ph-btn del" data-act="photoCardDel" data-id="${c.id}" aria-label="Foto entfernen">${ico('x')}</button>` : ''}</div>
    <div class="hero-main">
      <div class="eyebrow">Getränk · Schankrezeptur Nr. ${c.no || '—'} · ${esc(c.category || 'ohne Kategorie')}</div>
      <textarea id="cf-name" class="title-in" data-cf="name" rows="1" aria-label="Bezeichnung">${esc(c.name)}</textarea>
      <div class="hero-stats">
        <div><b class="mono">${eur(k0 ? k0.cost : t.cost)}</b><small>Wareneinsatz${k0 && menuVol(m0) ? ' für ' + volTxt(menuVol(m0)) : +c.yieldG > 0 ? ' für ' + volTxt(+c.yieldG) : ' pro Glas'}</small></div>
        ${k0 ? `<div><b class="mono">${eur(m0.price)}</b><small>Verkaufspreis</small></div>` : ''}
      </div>
      ${!m0 ? `<button type="button" class="btn primary sm" data-act="toMenu" data-id="${c.id}" style="margin-top:14px">${ico('plus')}Auf die Karte setzen</button>` : ''}
    </div>
    <div class="hero-ring">${ring(k0 ? k0.fc : null, 112, 10)}<span><b class="mono">${k0 ? pct(k0.fc) : '—'}</b><small>${k0 ? 'Wareneinsatz' : 'nicht auf der Karte'}</small></span></div>
    <div class="hero-acts">
      ${FRAMED ? '' : `<button type="button" class="icon-btn lg" data-act="printCard" data-id="${c.id}" title="Rezeptur drucken" aria-label="Rezeptur drucken">${ico('print')}</button>`}
      <button type="button" class="icon-btn lg danger" data-act="delCard" data-id="${c.id}" title="Löschen" aria-label="Löschen">${ico('trash')}</button>
    </div>
  </div>
  <div class="grid2">
    <div class="col">
      <section class="panel"><div class="fields">
        <label class="f">Typ<select id="cf-type" data-cf="type"><option value="dish">Gericht</option><option value="semi">Basisrezept</option><option value="drink" selected>Getränk</option></select></label>
        <label class="f">Kategorie<input id="cf-category" data-cf="category" list="cats" value="${esc(c.category)}"><datalist id="cats">${cats.map(x => `<option value="${esc(x)}">`).join('')}</datalist></label>
        <label class="f">Ausschankmenge<span class="dk-q"><input id="dk-y" class="num-in" type="text" inputmode="decimal" data-num="de" data-msg="Ungültige Menge, nicht geändert" data-dy="1" value="${+c.yieldG > 0 ? volIn(+c.yieldG, yu) : ''}" placeholder="z. B. 0,5">${volSel('data-dyu="1"', yu)}</span></label>
      </div></section>
      <section class="panel flush">
        <div class="panel-h pad"><h2>Ausschank</h2><span class="muted sm">${+c.yieldG > 0 ? 'für ' + volTxt(+c.yieldG) : 'pro Glas'}</span></div>
        <div class="tbl-wrap"><table class="edit dk-t">
          <thead><tr><th>Artikel</th><th class="r">Menge</th><th class="r">Betrag</th><th></th></tr></thead>
          <tbody>${rows || `<tr><td colspan="4" class="muted">Ersten Artikel hinzufügen.</td></tr>`}</tbody>
          <tfoot><tr><td>Wareneinsatz</td><td></td><td class="r mono">${eur(t.cost)}</td><td></td></tr></tfoot>
        </table></div>
        <div class="panel-f"><button type="button" class="btn" data-act="drinkLine">${ico('plus')}Artikel</button>${(c.steps || []).length ? '' : `<button type="button" class="btn" data-act="stepAdd">${ico('plus')}Zubereitung</button>`}</div>
      </section>
      ${(c.steps || []).length ? cardStepsPanel(c) : ''}
    </div>
    <div class="col">
      ${m0 ? `<section class="panel flush dk-on-p">
        <div class="panel-h pad"><h2>Auf der Karte</h2><span class="muted sm">exkl. ${num(vatRate(m0), 1)} % MwSt. gerechnet</span></div>
        <ul class="dk-on">${onCard}</ul>
        <div class="panel-f"><button type="button" class="btn" data-act="drinkSize" data-id="${c.id}">${ico('plus')}Weitere Größe</button></div>
      </section>` : ''}
      ${cardAlgPanel(c)}
    </div>
  </div>`;
}
/* Nach dem Speichern eines Getränks auf der Karte: gleiche Getränke in mehreren Größen stehen als ein Eintrag mit mehreren Preisen */
function drinkAfterSave(m, isNew, oldTag){
  if(!isDrinkEntry(m)) return;
  const tag = menuVol(m) ? volTxt(menuVol(m)) : '';
  if(tag && (!m.vlabel || m.vlabel === oldTag)) m.vlabel = tag;
  const key = x => String(x.name || '').trim().toLowerCase();
  const sib = S.menu.filter(x => x !== m && x.section === m.section && key(x) === key(m) && isDrinkEntry(x));
  if(!sib.length) return;
  const gid = (sib.find(x => x.group) || {}).group || m.group || uid('g');
  m.group = gid; sib.forEach(x => { x.group = gid; if(!x.vlabel && menuVol(x)) x.vlabel = volTxt(menuVol(x)); });
  // nebeneinander, kleinste Menge zuerst
  const all = sib.concat(m).sort((a, b) => (menuVol(a) || 1e9) - (menuVol(b) || 1e9)); const base = Math.min(...sib.map(x => x.order ?? 0));
  if(isNew || all.some((x, i) => i && (x.order ?? 0) < (all[i - 1].order ?? 0))) all.forEach((x, i) => { x.order = base + i / (all.length + 1); });
}

/* ---------- Inventur: volle Flaschen und die angebrochene in Zehnteln ---------- */
function barCount(pid){ const d = S.invDraft; const b = d && d.bar && d.bar[pid]; return b ? {f:b.f === '' || b.f == null ? '' : +b.f, t:+b.t || 0} : {f:'', t:0}; }
function barTenths(p, b){ const what = p.geb === 'fass' ? 'Angebrochenes Fass' : 'Angebrochene Flasche';
  return `<span class="inv-t" role="group" aria-label="${what} ${esc(p.name)}, in Zehnteln"><small>offen</small>${[1,2,3,4,5,6,7,8,9].map(k => `<button type="button" class="${b.t === k ? 'on' : ''}" data-act="invT" data-id="${p.id}:${k}" aria-pressed="${b.t === k}">0,${k}</button>`).join('')}</span>`; }
function barSet(pid, f, t){
  const d = S.invDraft, p = P(pid); if(!d || !p) return;
  d.bar = d.bar || {}; d.bar[pid] = {f, t};
  d.counts[pid] = f === '' && !t ? '' : Math.round(((+f || 0) + t / 10) * p.gebL * 1000) / 1000;
  save(); invUpdate(pid);
  const row = $('#ir-' + pid); if(row) row.querySelectorAll('.inv-t button').forEach(b => { const on = +b.dataset.id.split(':')[1] === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
}
function barInput(t){
  const pid = t.dataset.invf; const cur = barCount(pid); const raw = t.value.trim();
  if(raw === ''){ t.classList.remove('bad-in'); barSet(pid, '', cur.t); return; }
  const v = numParse(raw); const ok = isFinite(v) && v >= 0; t.classList.toggle('bad-in', !ok); if(!ok) return;
  // „5,3“ getippt: fünf volle und drei Zehntel
  const f = Math.floor(v + 1e-9), fr = Math.round((v - f) * 10);
  barSet(pid, f, /[.,]/.test(raw) ? Math.min(9, fr) : cur.t);
}
function barTenth(pid, k){ const cur = barCount(pid); barSet(pid, cur.f, cur.t === k ? 0 : k); }

/* ---------- Pfand und Leergut ---------- */
function lgList(){ if(!Array.isArray(S.leergut)) S.leergut = []; return S.leergut; }
function lgAdd(sup, amt, note, date){ const e = {id:uid('lg'), date:date || new Date().toISOString(), sup, amt:Math.round(amt * 100) / 100, note:note || '', by:me().id}; lgList().unshift(e); return e; }
function lgRemove(id){ S.leergut = lgList().filter(e => e.id !== id); }
function lgBalance(sid){ return Math.round(lgList().filter(e => e.sup === sid).reduce((a, e) => a + (+e.amt || 0), 0) * 100) / 100; }
function linePfand(l){ if(l.pf != null) return +l.pf || 0; const p = P(l.pid); return isDrink(p) ? +p.pfand || 0 : 0; }
/* Pfand einer Bestellung: je bestelltem (oder geliefertem) Gebinde. Gehört nie zur Warensumme. */
function orderPfand(o, delivered){ return Math.round(o.lines.reduce((t, l) => t + (delivered ? +(l.delivered ?? l.n) || 0 : +l.n || 0) * linePfand(l), 0) * 100) / 100; }
/* Gebinde mit Pfand eines Lieferanten, je Pfandsatz eine Zeile: „Fass 30 l · € 30,00“, „Kiste · € 6,00 (24×0,33 l, 24×0,35 l)“ */
function lgKinds(sid){ const m = new Map(); S.products.forEach(p => { if(p.supplier !== sid || !isDrink(p) || !(+p.pfand > 0)) return; const k = p.geb + '|' + (+p.pfand).toFixed(2); const x = m.get(k) || {key:k, word:GEB[p.geb], pfand:+p.pfand, packs:[]}; if(!x.packs.includes(p.pack)) x.packs.push(p.pack); m.set(k, x); });
  return [...m.values()].map(x => ({...x, label:x.packs.length === 1 ? x.packs[0] : x.word, sizes:x.packs.length === 1 ? '' : x.packs.map(s => s.replace(/^\S+\s/, '')).join(', ')})).sort((a, b) => b.pfand - a.pfand); }
function lgSection(){
  const rows = (S.suppliers || []).map(sp => ({sp, bal:lgBalance(sp.id), kinds:lgKinds(sp.id), last:lgList().find(e => e.sup === sp.id)})).filter(x => x.kinds.length || Math.abs(x.bal) > 0.004);
  if(!rows.length) return '';
  const sum = rows.reduce((a, x) => a + x.bal, 0);
  return `<h2 class="sec-h">Leergut<small class="muted sm">Pfand, das bei den Lieferanten steht: ${eur(sum)}</small></h2>
  <ul class="lg-l">${rows.map(x => `<li><span class="lg-n"><b>${esc(x.sp.name)}</b><small>${x.last ? `${fmtDate(x.last.date)} · ${x.last.amt < 0 ? 'zurückgegeben' : 'geliefert'} ${eur(Math.abs(x.last.amt))}` : 'noch nichts gebucht'}</small></span><span class="mono lg-v">${eur(x.bal)}</span><button type="button" class="btn sm" data-act="lgReturn" data-id="${x.sp.id}">Leergut zurückgeben</button></li>`).join('')}</ul>`;
}
function lgDialog(sid){
  const sp = SUP(sid); if(!sp) return; const kinds = lgKinds(sid); const bal = lgBalance(sid); const hist = lgList().filter(e => e.sup === sid).slice(0, 8);
  openDialog('Leergut zurückgeben', `
    <p class="dlg-p">${esc(sp.name)} · Pfand offen <b class="mono">${eur(bal)}</b></p>
    ${kinds.length ? `<div class="lg-k">${kinds.map((k, i) => `<label class="lg-kr"><span><b>${esc(k.label)}</b><small>${eur(k.pfand)} Pfand je ${esc(k.word)}${k.sizes ? ' · ' + esc(k.sizes) : ''}</small></span><input name="k${i}" class="num-in" type="text" inputmode="numeric" placeholder="0" autocomplete="off" aria-label="Anzahl ${esc(k.label)}"></label>`).join('')}</div>` : ''}
    <label class="f">${kinds.length ? 'Oder Betrag laut Gutschrift, €' : 'Betrag laut Gutschrift, €'}<input name="amt" class="num-in" type="text" inputmode="decimal" autocomplete="off"></label>
    <p class="lg-sum" id="lgSum" aria-live="polite"></p>
    ${hist.length ? `<details class="alg-det lg-h"><summary>Letzte Buchungen</summary><ul>${hist.map(e => `<li><span class="mono">${fmtDate(e.date)}</span><span>${esc(e.note || (e.amt < 0 ? 'Rückgabe' : 'Lieferung'))}</span><span class="mono">${signedEur(e.amt)}</span>${e.ret ? `<button type="button" class="link" data-lgundo="${e.id}">stornieren</button>` : '<span></span>'}</li>`).join('')}</ul></details>` : ''}`,
    (fd, f0) => { let sum = 0; const parts = [];
      kinds.forEach((k, i) => { const n = Math.round(+fd.get('k' + i) || 0); if(n > 0){ sum += n * k.pfand; parts.push(`${n} × ${k.label}`); } });
      const amt = +fd.get('amt') || 0; if(amt > 0){ sum += amt; parts.push('Gutschrift'); }
      sum = Math.round(sum * 100) / 100;
      if(!(sum > 0)){ dlgErr(null, 'Bitte eintragen, was zurückgeht.'); (f0.elements.k0 || f0.elements.amt).focus(); return false; }
      const e = lgAdd(sid, -sum, 'Rückgabe: ' + parts.join(', ')); e.ret = true; lgDialog.last = `Leergut zurück an ${sp.name}: ${eur(sum)} · offen ${eur(lgBalance(sid))}`; },
    {ok:'Buchen', done:() => lgDialog.last, after: f => {
      const upd = () => { f.querySelectorAll('.f-err').forEach(n => n.remove()); let s = 0; kinds.forEach((k, i) => { const v = numParse(f.elements['k' + i].value); if(v > 0) s += Math.round(v) * k.pfand; }); const a = numParse(f.elements.amt.value); if(a > 0) s += a; f.querySelector('#lgSum').textContent = s > 0 ? `Zurück: ${eur(s)} · danach offen ${eur(bal - s)}` : ''; };
      f.oninput = upd;
      f.onclick = e => { const b = e.target.closest('[data-lgundo]'); if(!b) return; lgRemove(b.dataset.lgundo); save(); $('#dlg').close(); render(); toast('Rückgabe storniert'); }; }});
}

/* ---------- Ereignisse ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el || el.closest('#dlg') && !el.closest('#dlgForm')) return; const id = el.dataset.id; const c = view.card ? C(view.card) : null;
  switch(el.dataset.act){
    case 'drinkLine': if(!c) break; c.items.push({ref:'', qty:'', net:''}); save(); render(); setTimeout(() => document.getElementById('dref-' + (c.items.length - 1))?.focus(), 0); break;
    case 'drinkSize': { const cc = C(id); if(!cc) break; const m0 = menuSorted().find(m => m.card === id); menuDialog(null, {name:m0 ? m0.name : cc.name, section:m0 ? m0.section : drinkSection(), desc:m0 ? m0.desc : '', card:id, vat:m0 ? m0.vat || '' : '', price:''}); break; }
    case 'lgReturn': lgDialog(id); break;
    case 'pDrinks': view.pdrink = !view.pdrink; render(); break;
  }
});
document.addEventListener('change', e => {
  const t = e.target; if(!t.closest || !t.closest('#app')) return; const c = view.card ? C(view.card) : null; if(!c || !c.drink) return;
  if(t.dataset.dref != null){ const it = c.items[+t.dataset.dref]; if(!it) return; it.ref = t.value; it.net = ''; delete it.u; save(); softRender(); return; }
  if(t.dataset.dq != null){ const i = +t.dataset.dq, it = c.items[i]; if(!it) return; const l = line(it, 0); const u = !l.missing && l.unit === 'ml' ? drinkU(it) : ''; const v = numParse(t.value);
    it.qty = t.value.trim() === '' || !isFinite(v) ? '' : u ? Math.round(v * VOL_U[u] * 1000) / 1000 : v; if(u) it.u = u; save(); softRender(); return; }
  if(t.dataset.du != null){ const i = +t.dataset.du, it = c.items[i]; if(!it) return; const inp = document.getElementById('dq-' + i); const v = inp ? numParse(inp.value) : NaN; it.u = t.value; if(isFinite(v)) it.qty = Math.round(v * VOL_U[it.u] * 1000) / 1000; save(); softRender(); return; }
  if(t.dataset.dy != null || t.dataset.dyu != null){ const inp = document.getElementById('dk-y'), sel = document.querySelector('#app [data-dyu]'); const v = numParse(inp.value); c.yu = sel.value; c.yieldG = inp.value.trim() === '' || !isFinite(v) || v <= 0 ? '' : Math.round(v * VOL_U[c.yu] * 1000) / 1000; save(); softRender(); toast('Gespeichert'); return; }
});

/* ---------- Beispiel-Getränke und Umstellung ---------- */
/* Nur für frische Beispieldaten (seed). Die sechs Getränke der Beispieldaten sind dort in Stück angelegt; hier werden sie zu Litern mit Gebinde, Pfand und Schankverlust. */
const BAR_DEMO_CONV = {
  bier:{geb:'fass', L:30, N:1, pfand:30, loss:5, from:'Zillertaler Bier vom Fass', name:'Märzen vom Fass', price:[2.9, 2.2]},
  mineral:{geb:'kiste', L:0.33, N:24, pfand:6},
  almdudler:{geb:'kiste', L:0.35, N:24, pfand:6, from:'Almdudler 0,35 l', name:'Kräuterlimonade 0,35 l'},
  apfelsaft:{geb:'kiste', L:1, N:6, pfand:3},
  gv:{geb:'fl', L:0.75, N:1, pfand:0, from:'Grüner Veltliner Qualitätswein 0,75 l', name:'Grüner Veltliner 0,75 l'},
  zweigelt:{geb:'fl', L:0.75, N:1, pfand:0, from:'Zweigelt Qualitätswein 0,75 l', name:'Zweigelt 0,75 l'},
};
// [id, Name, Gebinde, Inhalt l, Flaschen je Kiste, Preis je Gebinde, Pfand, Allergene, Lieferant, Bestand, Mindestbestand (in Flaschen)]
const BAR_DEMO_NEW = [
  ['weizen', 'Weißbier 0,5 l', 'kiste', 0.5, 20, 19, 4.5, 'A', 'sup_getraenke', 40, 20],
  ['prosecco', 'Prosecco 0,75 l', 'fl', 0.75, 1, 5.9, 0, 'O', 'sup_wein', 9, 6],
  ['bitter', 'Bitter-Aperitif 0,7 l', 'fl', 0.7, 1, 11.9, 0, '', 'sup_wein', 3, 2],
];
// [id, Name, Ausschank ml, [[Artikel, Menge, Anzeige-Einheit]]]
const BAR_DEMO_CARDS = [
  ['dk_bier', 'Märzen vom Fass', 500, [['bier', 500, 'l']]],
  ['dk_weizen', 'Weißbier', 500, [['weizen', 500, 'l']]],
  ['dk_mineral', 'Mineralwasser', 330, [['mineral', 330, 'l']]],
  ['dk_limo', 'Kräuterlimonade', 350, [['almdudler', 350, 'l']]],
  ['dk_apfel', 'Apfelsaft gespritzt', 500, [['apfelsaft', 250, 'l'], ['mineral', 250, 'l']]],
  ['dk_gv', 'Grüner Veltliner', 125, [['gv', 125, 'l']]],
  ['dk_zw', 'Zweigelt', 125, [['zweigelt', 125, 'l']]],
  ['dk_spritzer', 'Weißer Spritzer', 250, [['gv', 125, 'l'], ['mineral', 125, 'l']]],
  ['dk_spritz', 'Aperitif Spritz', '', [['bitter', 40, 'cl'], ['prosecco', 80, 'cl'], ['mineral', 20, 'cl'], ['orange', 0.1, '']]],
  ['dk_espresso', 'Espresso', '', [['kaffee', 8, '']]],
  ['dk_capp', 'Cappuccino', '', [['kaffee', 8, ''], ['milk', 120, 'ml']]],
];
// [Name, Beschreibung, Preis, Rezeptur, Menge ml (leer = wie Rezeptur), Gruppe]
const BAR_DEMO_MENU = [
  ['Märzen vom Fass', '', 4.2, 'dk_bier', 300, 'dk_g_bier'], ['Märzen vom Fass', '', 5.4, 'dk_bier', '', 'dk_g_bier'],
  ['Weißbier', '', 5.6, 'dk_weizen', '', ''], ['Mineralwasser', '', 3.4, 'dk_mineral', '', ''], ['Kräuterlimonade', '', 3.9, 'dk_limo', '', ''], ['Apfelsaft gespritzt', '', 4.2, 'dk_apfel', '', ''],
  ['Grüner Veltliner', 'Trocken, vom Glas oder die Flasche', 4.8, 'dk_gv', '', 'dk_g_gv'], ['Grüner Veltliner', 'Trocken, vom Glas oder die Flasche', 29, 'dk_gv', 750, 'dk_g_gv'],
  ['Zweigelt', '', 5.2, 'dk_zw', '', 'dk_g_zw'], ['Zweigelt', '', 32, 'dk_zw', 750, 'dk_g_zw'],
  ['Weißer Spritzer', '', 5.4, 'dk_spritzer', '', ''], ['Aperitif Spritz', 'Bitter-Aperitif, Prosecco, Soda, Orange', 7.5, 'dk_spritz', '', ''],
  ['Espresso', '', 2.9, 'dk_espresso', '', ''], ['Cappuccino', '', 3.9, 'dk_capp', '', ''],
];
function barDemo(d){
  const s = d.settings; const prod = id => d.products.find(p => p.id === id); const r3 = v => Math.round(v * 1000) / 1000, r4 = v => Math.round(v * 10000) / 10000;
  if(!Array.isArray(d.leergut)) d.leergut = [];
  const supOk = id => (d.suppliers || []).some(x => x.id === id) ? id : '';
  // 1 · vorhandene Beispiel-Getränke umstellen
  Object.entries(BAR_DEMO_CONV).forEach(([id, c]) => { const p = prod(id); if(!p || p.geb) return;
    if(p.unit === 'Stk'){ const L = c.L;
      p.unit = 'l'; p.price = r4((+p.price || 0) / L); p.stock = r3((+p.stock || 0) * L); p.minStock = r3((+p.minStock || 0) * L); p.pieceG = '';
      d.cards.forEach(cd => cd.items.forEach(it => { if(it.ref === 'p:' + id && +it.qty > 0) it.qty = r3(+it.qty * L * 1000); }));
      (d.orders || []).forEach(o => (o.lines || []).forEach(l => { if(l.pid === id) l.f = r4((+l.f || 1) * L); }));
      (d.moves || []).forEach(m => { if(m.pid !== id) return; m.qty = r3((+m.qty || 0) * L); if(m.price != null) m.price = r4(+m.price / L); if(m.prevPrice != null) m.prevPrice = r4(+m.prevPrice / L); });
      if(d.invDraft && d.invDraft.counts && d.invDraft.counts[id] !== '' && d.invDraft.counts[id] != null) d.invDraft.counts[id] = r3(+d.invDraft.counts[id] * L);
    } else if(p.unit !== 'l') return;
    if(c.price && p.priceDemo !== false && Math.abs(+p.price - c.price[0]) < 0.0001) p.price = c.price[1];
    if(c.from && p.name === c.from) p.name = c.name;
    Object.assign(p, {geb:c.geb, gebL:c.L, gebN:c.N, pack:gebLabel(c.geb, c.L, c.N), packQty:r4(c.L * c.N), pfand:c.pfand, pourLoss:c.loss || 0, loc:'W'});
    (d.orders || []).forEach(o => (o.lines || []).forEach(l => { if(l.pid === id && Math.abs((+l.f || 0) - p.packQty) < 0.0001) l.ou = p.pack; }));
  });
  // Pfand der schon gelieferten Beispiel-Bestellungen steht beim Lieferanten
  if(!d.leergut.length) (d.orders || []).forEach(o => { if(!o.receipt || !o.lines) return; let sum = 0; o.lines.forEach(l => { const p = prod(l.pid); const pf = p && p.geb ? +p.pfand || 0 : 0; if(pf){ l.pf = pf; sum += (+(l.delivered ?? l.n) || 0) * pf; } }); if(sum > 0){ o.receipt.pfand = sum; d.leergut.push({id:uid('lg'), date:o.receipt.date, sup:o.supplier, amt:sum, note:'Lieferung ' + o.no, by:o.receipt.checkedBy || '', order:o.id}); } });
  // 2 · eine kleine Getränkekarte dazu, wenn es noch keine gibt
  const sv = s.secVat || (s.secVat = {});
  if(d.cards.some(c => c.drink) || d.menu.some(m => sv[m.section] === 'g' || m.vat === 'g') || (s.sections || []).includes('Getränke')) return;
  if(!['bier', 'mineral', 'almdudler', 'apfelsaft', 'gv', 'zweigelt', 'milk'].every(id => { const p = prod(id); return p && p.unit === 'l'; })) return;
  let n = 0;
  BAR_DEMO_NEW.forEach(([id, name, geb, L, N, gp, pfand, alg, sup, st, min]) => { if(prod(id)) return; const sid = supOk(sup); const sp = (d.suppliers || []).find(x => x.id === sid);
    d.products.push({id, name, unit:'l', price:r4(gp / (L * N)), lossCold:0, lossHot:0, alg, algNone:!alg, pieceG:'', stock:r3(st * L), minStock:r3(min * L), loc:'W', supplier:sid, artNo:sp && sp.prefix ? `${sp.prefix}-${300 + (++n) * 7}` : '', geb, gebL:L, gebN:N, pack:gebLabel(geb, L, N), packQty:r4(L * N), pfand, pourLoss:0, priceDemo:true}); });
  const plain = (id, name, unit, price, extra) => { if(!prod(id)) d.products.push({id, name, unit, price, lossCold:0, lossHot:0, alg:'', algNone:true, pieceG:'', stock:0, minStock:0, loc:'L', supplier:'', artNo:'', pack:'', packQty:0, priceDemo:true, ...extra}); };
  plain('kaffee', 'Kaffeebohnen', 'kg', 17.5, {stock:6, minStock:4, loc:'W', supplier:supOk('sup_gross'), pack:'Sack 1 kg', packQty:1});
  plain('orange', 'Orange', 'Stk', 0.45, {pieceG:200, stock:12, minStock:6, loc:'G', supplier:supOk('sup_gem')});
  if(!s.sections) s.sections = []; s.sections.push('Getränke'); sv['Getränke'] = 'g';
  BAR_DEMO_CARDS.forEach(([id, name, y, items]) => { if(d.cards.some(c => c.id === id) || !items.every(i => prod(i[0]))) return;
    d.cards.push({id, no:s.nextNo++, name, type:'dish', drink:true, category:'Getränke', yieldG:y, img:'', steps:[], items:items.map(([k, q, u]) => { const it = {ref:'p:' + k, qty:q, net:''}; if(u) it.u = u; return it; })}); });
  let ord = 0;
  BAR_DEMO_MENU.forEach(([name, desc, price, card, vol, group]) => { const c = d.cards.find(x => x.id === card); if(!c) return; const ml = +vol > 0 ? +vol : +c.yieldG || 0;
    d.menu.push({id:uid('m'), section:'Getränke', name, desc, price, card, img:'', veg:'', top:false, hidden:false, seasons:[], days:[], alg:'', algNone:false, vat:'', group, vlabel:group && ml ? volTxt(ml) : '', vol, order:ord++}); });
}
/* Gespeicherte Stände bleiben, wie sie sind: nichts wird umgerechnet, kein Feld muss vorbelegt werden (Leergut-Liste entsteht bei der ersten Buchung).
   Hier wird nur aufgeräumt, was nicht zusammenpasst. Die Beispiel-Getränke kommen allein mit frischen Beispieldaten (seed). */
function barMigrate(d){
  if(!d || typeof d !== 'object') return d;
  if(d.leergut !== undefined) d.leergut = Array.isArray(d.leergut) ? d.leergut.filter(e => e && typeof e === 'object' && e.id && isFinite(+e.amt)) : [];
  (d.products || []).forEach(p => { if(p.geb && !(GEB[p.geb] && +p.gebL > 0 && p.unit === 'l')){ ['geb', 'gebL', 'gebN', 'pfand', 'pourLoss'].forEach(k => { delete p[k]; }); } if(p.pourLoss != null && !(+p.pourLoss >= 0 && +p.pourLoss < 100)) p.pourLoss = 0; });
  (d.menu || []).forEach(m => { if(m.vol != null && m.vol !== '' && !(+m.vol > 0)) m.vol = ''; });
  return d;
}
