/* =====================================================================
   Echte Einkaufspreise: Richtwerte markieren, Preisliste importieren
   ===================================================================== */
function pricesMigrate(d){ (d.products||[]).forEach(p => { if(p.priceDemo === undefined) p.priceDemo = !!d.demo; }); return d; }
function markPrice(p, src){ p.priceDemo = false; p.priceDate = todayStr(); p.priceSrc = src; }
function demoPriceLines(c, d=0, acc=new Set()){ if(!c || d > 6) return acc; c.items.forEach(it => { const r = refObj(it.ref); if(!r) return; if(r.t === 'p'){ if(r.o.priceDemo && !r.o.noStock && +r.o.price) acc.add(r.o.id); } else demoPriceLines(r.o, d+1, acc); }); return acc; }

function priceFixDialog(ids){
  const ps = ids.map(P).filter(Boolean);
  openDialog('Einkaufspreise eintragen', `<p class="dlg-p">Preis je Einheit ohne MwSt., wie auf Rechnung oder Preisliste. Leer lassen, wenn unbekannt.</p>
    <div class="pfix">${ps.map(p=>`<label class="pfix-r"><span><b>${esc(p.name)}</b><small class="muted">${esc(supName(p))} · Richtwert ${eur(p.price)} je ${esc(p.unit)}</small></span><span class="qty"><input name="p_${p.id}" class="num-in" type="text" inputmode="decimal" autocomplete="off" placeholder="${num2(p.price)}"><em>€/${esc(p.unit)}</em></span></label>`).join('')}</div>`,
    fd => { let n = 0; ps.forEach(p => { const v = fd.get('p_'+p.id); if(v !== '' && v != null){ p.price = Math.max(0, +v); markPrice(p, 'manuell'); n++; } }); priceFixDialog.n = n; },
    {ok:'Übernehmen', done:()=>`${priceFixDialog.n} Preise übernommen, Wareneinsatz neu berechnet`});
}

/* Preisliste importieren */
function plMatch(name, art){
  if(art){ const p = S.products.find(x => x.artNo && String(x.artNo).trim() === String(art).trim()); if(p) return p; }
  const base = x => normName(String(x).split('(')[0]);
  const n = base(name); if(!n) return null; let best = null, bs = 0;
  for(const p of S.products){ const pn = base(p.name); if(!pn) continue; let sc = 0;
    if(pn === n || normName(p.name) === normName(name)) sc = 1;
    else { const a = n.split(' ').filter(x=>x.length>2), b = new Set(pn.split(' ').filter(x=>x.length>2)); const hit = a.filter(x=>b.has(x)).length; sc = hit / Math.max(a.length, b.size, 1);
      if(Math.min(n.length, pn.length) >= 4 && (pn.startsWith(n) || n.startsWith(pn))) sc = Math.max(sc, .75); }
    if(sc > bs){ bs = sc; best = p; } }
  return bs >= .6 ? best : null;
}
function plAnalyse(text){
  const rows = csvParse(text); if(rows.length < 2) throw new Error('Die Liste enthält keine Datenzeilen.');
  const head = rows[0].map(h=>h.trim()); const idx = re => head.findIndex(h => re.test(h));
  const ci = {name: idx(/^(artikel|bezeichnung|produkt|name|artikelbezeichnung|beschreibung)$/i), art: idx(/^(art(ikel)?\.?\s*-?\s*(nr|nummer)\.?|sku|plu|code)$/i), price: idx(/^(preis|ek|ek-preis|einkaufspreis|netto|preis netto|nettopreis|price|preis\/einheit)$/i), unit: idx(/^(einheit|me|unit|vk-einheit)$/i), pack: idx(/^(gebinde|ve|verpackung|packung|inhalt)$/i)};
  if(ci.name < 0 || ci.price < 0) throw new Error('Spalten „Artikel“ und „Preis“ nicht gefunden. Erwartet z. B. „Artikelnr; Artikel; Einheit; Preis“.');
  const lines = rows.slice(1).map(r => { const name = (r[ci.name]||'').trim(), art = ci.art>=0 ? (r[ci.art]||'').trim() : '', price = numDE(r[ci.price]); const p = plMatch(name, art); return {name, art, price, unit: ci.unit>=0 ? (r[ci.unit]||'').trim() : '', pack: ci.pack>=0 ? (r[ci.pack]||'').trim() : '', pid: p ? p.id : '', old: p ? +p.price : null}; }).filter(l => l.name && l.price > 0);
  return {lines};
}
function plDialog(){
  const sups = (S.suppliers||[]);
  openDialog('Preisliste importieren', `<p class="dlg-p">CSV oder Excel-Liste des Lieferanten (oder aus der Rechnung abgetippt) mit Spalten <b>Artikel</b>, <b>Preis</b> netto und optional Artikelnr, Einheit, Gebinde. Erkannte Produkte werden aktualisiert, die Liste prüfen Sie vorher.</p>
    <label class="f">Lieferant<select name="sup"><option value="">— beliebig —</option>${sups.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label>
    <div class="row-btns"><button type="button" class="btn sm" id="plFileBtn">Datei wählen</button><button type="button" class="btn sm" id="plSample">Beispiel</button><input id="plFile" type="file" accept=".csv,.txt,.xlsx,.xls" hidden></div>
    <textarea id="plText" class="code" rows="6" placeholder="Artikelnr;Artikel;Einheit;Preis"></textarea>
    <div class="row-btns"><button type="button" class="btn sm" id="plCheck">Prüfen</button></div>
    <div id="plOut"></div>`,
    fd => { const res = plDialog.res; if(!res) { toast('Bitte zuerst „Prüfen“'); return false; } let n = 0, add = 0; const sid = fd.get('sup');
      res.lines.forEach((l, i) => { const sel = fd.get('m_'+i); if(sel === 'skip' || sel == null) return;
        if(sel === 'new'){ const unit = /^(stk|stück|st)$/i.test(l.unit) ? 'Stk' : /^(l|liter)$/i.test(l.unit) ? 'l' : 'kg'; const p = {id:uid('p'), name:l.name, unit, price:l.price, lossCold:0, lossHot:0, alg:'', pieceG:'', stock:0, minStock:0, loc:'L', supplier:sid||'', artNo:l.art, pack:l.pack, packQty:0}; markPrice(p, 'Preisliste'); S.products.push(p); add++; return; }
        const p = P(sel); if(!p) return; p.price = l.price; if(l.art) p.artNo = l.art; if(sid && !p.supplier) p.supplier = sid; markPrice(p, 'Preisliste'); n++; });
      plDialog.msg = `${n} Preise aktualisiert${add?`, ${add} Produkte neu angelegt`:''}`; plDialog.res = null; },
    {ok:'Preise übernehmen', done:()=>plDialog.msg, after: f => {
      plDialog.res = null;
      const show = () => { const res = plDialog.res; const opts = sel => `<option value="skip">nicht übernehmen</option><option value="new">als neues Produkt</option>${[...S.products].sort(byName).map(p=>`<option value="${p.id}" ${sel===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}`;
        $('#plOut').innerHTML = `<p class="hint">${res.lines.filter(l=>l.pid).length} von ${res.lines.length} Artikeln erkannt.</p><ul class="pl-list">${res.lines.map((l,i)=>`<li><span><b>${esc(l.name)}</b><small class="muted">${l.art?'Nr. '+esc(l.art)+' · ':''}${esc(l.unit||'')} ${l.old!=null?`· bisher ${eur(l.old)}`:''}</small></span><b class="mono">${eur(l.price)}</b><select name="m_${i}" class="sm-sel">${opts(l.pid || 'skip')}</select></li>`).join('')}</ul>`; };
      const run = () => { try { plDialog.res = plAnalyse($('#plText').value); show(); } catch(x){ $('#plOut').innerHTML = `<p class="hint bad-t">${esc(x.message)}</p>`; } };
      $('#plCheck').onclick = run;
      $('#plSample').onclick = () => { const ex = [['romaine',3.95],['parmesan',19.8],['quail',0.29],['capers',12.4],['bread',3.1]].map(([id,pr]) => { const p = P(id); return p ? `${p.artNo||''};${p.name};${p.unit};${String(pr).replace('.',',')}` : ''; }).filter(Boolean); $('#plText').value = ['Artikelnr;Artikel;Einheit;Preis', ...ex, 'NEU-901;Sardellenfilets;kg;24,00'].join('\n'); run(); };
      $('#plFileBtn').onclick = () => $('#plFile').click();
      $('#plFile').onchange = async e => { const file = e.target.files[0]; if(!file) return; try { $('#plText').value = await readFileAsCsv(file); run(); } catch(x){ $('#plOut').innerHTML = `<p class="hint bad-t">${esc(x.message)}</p>`; } };
    }});
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const id = el.dataset.id;
  if(el.dataset.act === 'pFilter'){ view.pf = id; if(view.tab !== 'products') go('products'); else render(); }
  if(el.dataset.act === 'pConfirm'){ const p = P(id); markPrice(p, 'bestätigt'); save(); render(); toast(`${p.name}: ${eur(p.price)} bestätigt`); }
  if(el.dataset.act === 'pConfirmAll'){ const q = view.pq.trim().toLowerCase(); const list = S.products.filter(p => !p.noStock && p.priceDemo && (!q || (p.name+' '+supName(p)+' '+(p.artNo||'')).toLowerCase().includes(q))); if(!list.length) return; ask(`${list.length} Richtwerte als bestätigte Einkaufspreise übernehmen? Besser: nur Preise bestätigen, die Sie geprüft haben.`, () => { list.forEach(p => markPrice(p, 'bestätigt')); }, 'Bestätigen'); }
  if(el.dataset.act === 'pFix') priceFixDialog(id.split(','));
  if(el.dataset.act === 'plImport') plDialog();
});
document.addEventListener('change', e => { const t = e.target; if(t.dataset && t.dataset.pp && t.dataset.pf === 'price'){ const p = P(t.dataset.pp); if(p && +t.value !== +p.price) markPrice(p, 'manuell'); } }, true);
