/* =====================================================================
   Eigenkontrolle (Paket D2): baut auf den Checklisten auf, eigener Zustand S.checks.ek.
   Wareneingang-Temperatur · Frittieröl · Reinigungsplan · Monatsmappe als PDF.
   Häkchen des Reinigungsplans liegen wie alle Häkchen in S.checks.runs[Tag] (Schlüssel ek_clean),
   Temperaturen der Lieferungen und das Frittieröl in S.checks.ek.log.
   Eine Hilfe zum Aufschreiben. Die App prüft nichts und verspricht nichts.
   ===================================================================== */
const EK_KEEP_DAYS = 400;            // Aufbewahrung: mindestens 13 Monate (13 Monate sind höchstens 397 Tage)
const EK_RUN = 'ek_clean';
const EK_RHY = {daily:'täglich', weekly:'wöchentlich', monthly:'monatlich'};
const EK_LIMITS = {kuehl:4, tk:-18}; // Vorgabe, vom Chef änderbar: Kühlware höchstens +4 °C, Tiefkühlware höchstens −18 °C

/* ---------- Zustand ---------- */
function ekDefaults(){ return {v:1, limits:{...EK_LIMITS}, fryers:[{id:'fr_1', name:'Fritteuse'}], oilDays:'', clean:[], log:[]}; }
function ekMigrate(d){
  if(!d || typeof d !== 'object') return d;
  const obj = x => !!x && typeof x === 'object' && !Array.isArray(x);
  if(!obj(d.checks)) return d;
  const c = d.checks; const fresh = !obj(c.ek); if(fresh) c.ek = ekDefaults();
  const k = c.ek; const today = isoDate(new Date());
  if(!obj(k.limits)) k.limits = {...EK_LIMITS};
  ['kuehl', 'tk'].forEach(x => { if(!isFinite(+k.limits[x]) || k.limits[x] === '' || k.limits[x] == null) k.limits[x] = EK_LIMITS[x]; else k.limits[x] = +k.limits[x]; });
  k.fryers = (Array.isArray(k.fryers) ? k.fryers : []).filter(f => obj(f) && f.id).map(f => { f.name = String(f.name || 'Fritteuse').slice(0, 30); return f; });
  k.oilDays = +k.oilDays > 0 ? Math.min(365, Math.round(+k.oilDays)) : '';
  k.clean = (Array.isArray(k.clean) ? k.clean : []).filter(t => obj(t) && t.id && String(t.t || '').trim()).map(t => { t.t = String(t.t).slice(0, 90); t.area = String(t.area || '').slice(0, 30); t.when = EK_RHY[t.when] ? t.when : 'weekly';
    t.wd = t.when === 'weekly' ? (+t.wd >= 0 && +t.wd <= 6 ? +t.wd : 1) : null; t.md = t.when === 'monthly' ? Math.min(31, Math.max(1, Math.round(+t.md) || 1)) : null; if(!TM_DATE.test(t.since || '')) t.since = today; return t; });
  const cut = dAdd(today, -EK_KEEP_DAYS);
  k.log = (Array.isArray(k.log) ? k.log : []).filter(r => obj(r) && r.id && (r.k === 'we' || r.k === 'oil' || r.k === 'ckv') && TM_DATE.test(r.d || '') && r.d >= cut);
  if(fresh && d.demo && d.team && d.team.demo){ try { ekDemo(d); } catch(e){ console.warn('Eigenkontrolle-Beispiel:', e); } }
  return d;
}
function ekS(){ const c = ckS(); if(!c.ek || !Array.isArray(c.ek.log)) ekMigrate(S); return c.ek; }
/* Beispiel: erfundene Einträge der letzten zwei Wochen, als Beispiel markiert (gehen mit dem Beispiel-Team) */
function ekDemo(d){
  const k = d.checks.ek; const today = isoDate(new Date()); const since = dAdd(today, -15); const closed = (d.settings && d.settings.closed) || [];
  const open = D => !closed.includes(dParse(D).getDay()) || ((d.team.shifts || {})[D] || []).length > 0;
  k.oilDays = 7;
  k.clean = [
    {id:'ec_hand', t:'Handwaschbecken und Seifenspender reinigen', area:'Küche', when:'daily', wd:null, md:null, since, demo:true},
    {id:'ec_schneid', t:'Aufschnittmaschine zerlegen und reinigen', area:'Küche', when:'weekly', wd:1, md:null, since, demo:true},
    {id:'ec_abzug', t:'Dunstabzug: Filter reinigen', area:'Küche', when:'monthly', wd:null, md:1, since, demo:true},
    {id:'ec_eis', t:'Eiswürfelmaschine reinigen', area:'Bar', when:'monthly', wd:null, md:15, since, demo:true},
  ];
  const runs = d.checks.runs; const tick = (D, id, due, b, a) => { const day = runs[D] = runs[D] || {}; const r = day[EK_RUN] = day[EK_RUN] || {items:{}, n:0, demo:true}; r.items[id] = {b, a, due}; };
  let mondays = 0;
  for(let i = 15; i >= 1; i--){ const D = dAdd(today, -i); if(!open(D)) continue;
    if(i !== 5) tick(D, 'ec_hand', D, i % 2 ? 'Anna' : 'Lukas', '21:4' + (i % 10));
    if(dParse(D).getDay() === 1 && i > 6){ tick(D, 'ec_schneid', D, 'Lukas', '14:20'); mondays++; }   // der jüngste Montag bleibt offen: so sieht „überfällig“ aus
    if(+D.slice(8) === 1 || (+D.slice(8) === 2 && !open(dAdd(D, -1)))) tick(D, 'ec_abzug', D.slice(0, 8) + '01', 'Lukas', '15:05'); }
  const sup = k2 => { const p = (d.products || []).find(x => x.loc === k2 && x.supplier); return p ? p.supplier : ''; };
  const at = (D, hm) => D + 'T' + hm + ':00';
  k.log = [
    {id:'ek_d5', k:'oil', d:dAdd(today, -3), a:'15:10', at:at(dAdd(today, -3), '15:10'), b:'Lukas', fr:'fr_1', t:'check', res:'ok', demo:true},
    {id:'ek_d4', k:'we', d:dAdd(today, -2), a:'07:55', at:at(dAdd(today, -2), '07:55'), b:'Anna', sup:sup('T') || sup('K'), kv:2.8, tv:-19, okc:true, note:'', out:0, lim:{...EK_LIMITS}, demo:true},
    {id:'ek_d3', k:'we', d:dAdd(today, -6), a:'08:10', at:at(dAdd(today, -6), '08:10'), b:'Anna', sup:sup('K'), kv:6.5, tv:null, okc:true, note:'Fahrer darauf hingewiesen, Ware sofort eingekühlt. Nach 20 Minuten 3 °C.', out:1, lim:{...EK_LIMITS}, demo:true},
    {id:'ek_d2', k:'oil', d:dAdd(today, -9), a:'22:30', at:at(dAdd(today, -9), '22:30'), b:'Lukas', fr:'fr_1', t:'wechsel', demo:true},
    {id:'ek_d1', k:'we', d:dAdd(today, -9), a:'07:40', at:at(dAdd(today, -9), '07:40'), b:'Anna', sup:sup('K'), kv:3.2, tv:null, okc:true, note:'', out:0, lim:{...EK_LIMITS}, demo:true},
  ];
  k.demo = true;
}
function ekDemoRemove(){ const k = ekS(); k.clean = k.clean.filter(t => !t.demo); k.log = k.log.filter(r => !r.demo); if(k.demo){ k.oilDays = ''; k.demo = false; } }

/* ---------- Kleines ---------- */
function ekDayDiff(a, b){ return Math.round((dParse(b) - dParse(a)) / 864e5); }
function ekT(v){ return v == null || v === '' ? '' : (num(v, 1) + ' °C').replace('-', '−'); }
function ekLimTxt(v){ return `höchstens ${+v > 0 ? '+' : ''}${num(v, 1)} °C`.replace('-', '−'); }
/* „3,5“, „+3,5 °C“, „−18“ → Zahl; leer → null; Unsinn → NaN */
function ekTemp(raw){ const s = String(raw == null ? '' : raw).trim().replace(/[−–]/g, '-').replace(/\s|°|c$/gi, '').replace(/^\+/, ''); if(s === '') return null; const v = /^-?\d+([.,]\d+)?$/.test(s) ? numParse(s) : NaN; return isFinite(v) && Math.abs(v) <= 99 ? Math.round(v * 10) / 10 : NaN; }
function ekWhenTxt(D, T){ const d = ekDayDiff(D, T); return d <= 0 ? 'heute' : d === 1 ? 'gestern' : `vor ${d} Tagen`; }
function ekDateTxt(D){ return `${tmWdShort(D)} ${tmDm(D)}`; }
function ekRec(extra){ const n = new Date(); return Object.assign({id:uid('ek'), d:isoDate(n), a:tmNowHm(), at:n.toISOString(), b:tmWhoName()}, extra || {}); }
function ekSupName(id){ const s = id && typeof SUP === 'function' ? SUP(id) : null; return s ? s.name : ''; }
function ekFryer(id){ return ekS().fryers.find(f => f.id === id) || null; }
function ekFryerName(id){ const f = ekFryer(id); return f ? f.name : 'Fritteuse'; }

/* ---------- Wareneingang-Temperatur ---------- */
function ekWeOutWhy(kv, tv, okc, lim){ const w = []; if(kv != null && kv > +lim.kuehl + 1e-9) w.push(`Kühlware ${ekT(kv)} (Ihr Grenzwert: ${ekLimTxt(lim.kuehl)})`); if(tv != null && tv > +lim.tk + 1e-9) w.push(`Tiefkühlware ${ekT(tv)} (Ihr Grenzwert: ${ekLimTxt(lim.tk)})`); if(okc === false) w.push('Ware nicht in Ordnung'); return w; }
function ekLogWe(x){ const k = ekS(); const r = ekRec({k:'we', sup:x.sup || '', order:x.order || '', mv:x.mv || '', ref:x.ref || '', kv:x.kv == null ? null : x.kv, tv:x.tv == null ? null : x.tv, okc:x.okc !== false, note:String(x.note || '').slice(0, 160), lim:{...k.limits}}); if(x.d) r.d = x.d; if(x.nm) r.nm = 1; if(x.oka && r.okc === false) r.oka = 1; if(x.ls) r.ls = String(x.ls).slice(0, 40); if(x.goods) r.goods = String(x.goods).slice(0, 160);
  r.out = ekWeOutWhy(r.kv, r.tv, r.okc, r.lim).length ? 1 : 0; k.log.unshift(r); return r; }
function ekWeTxt(r){ return [r.nm ? 'Temperatur nicht gemessen' : '', r.kv != null ? 'Kühlware ' + ekT(r.kv) : '', r.tv != null ? 'Tiefkühlware ' + ekT(r.tv) : '', r.okc === false ? 'Ware nicht in Ordnung' : ''].filter(Boolean).join(' · ') || 'Ware in Ordnung'; }
/* Stornieren statt Löschen: der Eintrag bleibt durchgestrichen stehen, mit Grund, wer und wann */
function ekLive(r){ return !r.void; }
function ekVoidTxt(r){ return r.void ? `storniert von ${r.void.b} am ${fmtDate(r.void.at)}: ${r.void.why}` : ''; }
function ekVoidDlg(text, onVoid){
  if(!roGate()) return;
  tmDialog('Eintrag stornieren', `<p class="dlg-p">${esc(text)}<br>Der Eintrag bleibt durchgestrichen sichtbar, auch in der Monatsmappe.</p><label class="f">Grund<input name="why" maxlength="120" placeholder="z. B. doppelt eingetragen, falsche Lieferung" autocomplete="off"></label>`,
    (fd, f) => { const why = String(fd.get('why') || '').trim(); if(why.length < 3) return dlgErr(f.elements.why, 'Bitte kurz den Grund nennen.'); onVoid({why, b:tmWhoName(), at:new Date().toISOString()}); },
    {ok:'Stornieren', done:'Storniert'});
}
/* Lieferant, der heute erwartet wird, sonst der zuletzt eingetragene */
function ekSupGuess(){ const T = isoDate(new Date()); const o = (S.orders || []).find(o => o.status === 'sent' && o.deliveryDate === T && SUP(o.supplier)); if(o) return o.supplier; const r = ekS().log.find(r => r.k === 'we' && r.sup && SUP(r.sup)); return r ? r.sup : ''; }
/* Wert außerhalb des Grenzwerts: „Ware in Ordnung“ geht aus (und wieder an, wenn der Wert passt und es die App ausgeschaltet hatte) */
document.addEventListener('input', e => { const t = e.target; if(!t.matches || !t.matches('#rTemp,#rTempT,#ekK,#ekTk,#mvEkT')) return;
  const box = t.closest('.recv-f,#dlgForm,#mvEk'); const ok = box && box.querySelector('#rOk,[name=okc],[name=ekOk]'); if(!ok) return; const lim = ekS().limits;
  const out = [...box.querySelectorAll('#rTemp,#rTempT,#ekK,#ekTk,#mvEkT')].some(i => { const v = ekTemp(i.value); const tk = i.id === 'rTempT' || i.id === 'ekTk' || (i.id === 'mvEkT' && i.closest('#mvEk') && i.closest('#mvEk').dataset.kind === 't'); return v != null && !Number.isNaN(v) && v > +(tk ? lim.tk : lim.kuehl) + 1e-9; });
  if(out && ok.checked){ ok.checked = false; ok.dataset.auto = '1'; } else if(!out && ok.dataset.auto){ ok.checked = true; delete ok.dataset.auto; }
  const n = box.querySelector('#mvEkN'); if(n && out) n.hidden = false; });
/* welche Felder eine Lieferung braucht: nur was aus Kühlhaus (K) oder Tiefkühler (T) dabei ist */
function ekColdOf(pids){ const ps = pids.map(P).filter(Boolean); return {k:ps.some(p => p.loc === 'K'), t:ps.some(p => p.loc === 'T')}; }
function ekFieldHtml(id, name, label, lim, val){ return `<label class="f ek-tf">${label}<span class="ek-tin"><input id="${id}" name="${name}" type="text" inputmode="text" autocomplete="off" value="${esc(val || '')}" placeholder="–" aria-label="${label}, in Grad Celsius"><span>°C</span></span><small>Ihr Grenzwert: ${esc(ekLimTxt(lim))}</small></label>`; }
/* Felder im Wareneingang einer Bestellung: je Lieferung, nicht je Artikel; alles freiwillig */
function ekRecvFields(o){
  const cold = ekColdOf(o.lines.map(l => l.pid)); if(!cold.k && !cold.t) return ''; const dr = o.receiptDraft || {}; const lim = ekS().limits;
  return `${cold.k ? ekFieldHtml('rTemp', 'rTemp', 'Temperatur Kühlware', lim.kuehl, dr.temp) : ''}${cold.t ? ekFieldHtml('rTempT', 'rTempT', 'Temperatur Tiefkühlware', lim.tk, dr.tempT) : ''}<label class="tog ek-ok"><input type="checkbox" id="rOk" ${dr.cond === 'no' ? '' : 'checked'}><span></span>Ware in Ordnung</label>`;
}
/* vor dem Einbuchen: Eingaben lesen; außerhalb Ihres Grenzwerts oder „nicht in Ordnung“ → kurze Notiz, dann weiter.
   Mit Kühl- oder Tiefkühlware, aber ohne Temperatur: ausdrücklich „ohne Messung“ wählen; das wird vermerkt. */
function ekRecvGoods(o){ return o.lines.map(l => P(l.pid)).filter(p => p && (p.loc === 'K' || p.loc === 'T')).map(p => p.name).filter((n, i, a) => a.indexOf(n) === i).join(', '); }
function ekRecvCheck(o, done){
  const dr = o.receiptDraft || {}; const read = (sel, old) => { const n = $(sel); return n ? n.value : (old || ''); };
  const kv = ekTemp(read('#rTemp', dr.temp)), tv = ekTemp(read('#rTempT', dr.tempT)); const okEl = $('#rOk'); const okc = okEl ? okEl.checked : dr.cond !== 'no'; const oka = !!(okEl && okEl.dataset.auto);
  const bad = Number.isNaN(kv) ? '#rTemp' : Number.isNaN(tv) ? '#rTempT' : '';
  if(bad){ const n = $(bad); if(n){ n.classList.add('bad-in'); n.focus(); setTimeout(() => n.classList.remove('bad-in'), 1800); } toast('Temperatur bitte als Zahl eingeben, zum Beispiel 3,5 oder -18. Oder das Feld leer lassen.'); return; }
  const cold = ekColdOf(o.lines.map(l => l.pid)); if(!cold.k && !cold.t){ done(null); return; }
  const extra = {ls:String(read('#rNo', dr.noteNo) || '').trim(), goods:ekRecvGoods(o), oka};
  if(kv == null && tv == null){
    tmDialog('Ohne Temperatur einbuchen?', `<p class="dlg-p">In dieser Lieferung ist ${cold.k && cold.t ? 'Kühl- und Tiefkühlware' : cold.t ? 'Tiefkühlware' : 'Kühlware'}${extra.goods ? `: ${esc(extra.goods)}` : ''}. In der Eigenkontrolle steht dann „Temperatur nicht gemessen“.</p>
      <label class="f">${okc ? 'Grund (freiwillig)' : 'Ware nicht in Ordnung: was haben Sie getan?'}<input name="note" maxlength="160" placeholder="${okc ? 'z. B. Thermometer nicht zur Hand' : 'z. B. Ware zurückgegeben, Chef informiert'}" autocomplete="off"></label>`,
      (fd, f) => { const note = String(fd.get('note') || '').trim(); if(!okc && note.length < 3) return dlgErr(f.elements.note, 'Bitte kurz notieren, was getan wurde.'); setTimeout(() => done({kv:null, tv:null, okc, note, nm:1, ...extra}), 0); },
      {ok:'Ohne Messung einbuchen', cancel:'Zurück und messen', toast:false});
    return; }
  const why = ekWeOutWhy(kv, tv, okc, ekS().limits);
  if(!why.length){ done({kv, tv, okc, ...extra}); return; }
  tmDialog('Wareneingang: außerhalb Ihres Grenzwerts', `<p class="dlg-p"><b>${why.map(esc).join('<br>')}</b><br>Was haben Sie getan?</p><label class="f">Kurze Notiz<input name="note" maxlength="160" placeholder="z. B. Ware zurückgegeben, Chef informiert" autocomplete="off"></label>`,
    (fd, f) => { const note = String(fd.get('note') || '').trim(); if(note.length < 3) return dlgErr(f.elements.note, 'Bitte kurz notieren, was getan wurde.'); setTimeout(() => done({kv, tv, okc, note, ...extra}), 0); }, {ok:'Mit Notiz einbuchen', toast:false});
}
/* Lieferung ohne Bestellung (ein Artikel): Feld nur bei Kühl- oder Tiefkühlware */
function ekMoveFields(p){
  const cold = p ? ekColdOf([p.id]) : {k:false, t:false}; const lim = ekS().limits; const on = cold.k || cold.t;
  return `<div id="mvEk" class="ek-mv" ${on ? '' : 'hidden'} data-kind="${cold.t ? 't' : 'k'}">${on ? ekFieldHtml('mvEkT', 'ekT', cold.t ? 'Temperatur Tiefkühlware' : 'Temperatur Kühlware', cold.t ? lim.tk : lim.kuehl, '') + `<label class="tog ek-ok"><input type="checkbox" name="ekOk" checked><span></span>Ware in Ordnung</label><label class="f ek-mvn" id="mvEkN" hidden>Was haben Sie getan?<input name="ekNote" maxlength="160" placeholder="z. B. Ware zurückgegeben, Chef informiert" autocomplete="off"></label>` : ''}</div>`;
}
/* liest die Felder; false = Dialog bleibt offen (Hinweis steht am Feld), null = nichts eingetragen, sonst der Eintrag */
function ekMoveRead(fd, f, p){
  const box = f.querySelector('#mvEk'); if(!box || box.hidden) return null; const t = box.dataset.kind === 't';
  const v = ekTemp(fd.get('ekT')); if(Number.isNaN(v)) return dlgErr('ekT', 'Temperatur bitte als Zahl eingeben, zum Beispiel 3,5 oder -18. Oder das Feld leer lassen.');
  const okc = !!fd.get('ekOk'); if(v == null && okc) return null; const okb = f.querySelector('[name=ekOk]');
  const x = {kv:t ? null : v, tv:t ? v : null, okc, oka:!!(okb && okb.dataset.auto), note:String(fd.get('ekNote') || '').trim(), goods:p ? p.name : ''};
  const why = ekWeOutWhy(x.kv, x.tv, okc, ekS().limits);
  if(why.length && x.note.length < 3){ f.querySelector('#mvEkN').hidden = false; return dlgErr('ekNote', `${why.join(' · ')}. Bitte kurz notieren, was getan wurde.`); }
  return x;
}
/* von Hand nachtragen oder korrigieren. Der alte Wert bleibt sichtbar, mit seiner Notiz; die Korrektur bekommt ihre eigene. */
function ekWeDlg(id){
  const k = ekS(); const r = id ? k.log.find(x => x.id === id && x.k === 'we') : null; if(r && r.void) return; const lim = k.limits; const sup0 = r ? r.sup : ekSupGuess(); const sups = (S.suppliers || []).filter(s => s.active !== false || s.id === sup0);
  tmDialog(r ? 'Eintrag korrigieren' : 'Temperatur eintragen', `${r ? `<p class="dlg-p">${esc(ekDateTxt(r.d))}, ${esc(r.a)} Uhr · ${esc(r.b)}: ${esc(ekWeTxt(r))}${r.note ? ` · ${esc(r.note)}` : ''}. Der bisherige Eintrag bleibt mit seiner Notiz durchgestrichen sichtbar.</p>` : ''}
    <label class="f">Lieferant<select name="sup"><option value="">ohne Angabe</option>${sups.map(s => `<option value="${s.id}" ${sup0 === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
    <div class="fields"><label class="f">Ware<input name="goods" maxlength="160" value="${esc(r ? r.goods || '' : '')}" placeholder="z. B. Faschiertes, Milch" autocomplete="off"></label><label class="f">Lieferschein-Nr.<input name="ls" maxlength="40" value="${esc(r ? r.ls || '' : '')}" placeholder="freiwillig" autocomplete="off"></label></div>
    <div class="fields">${ekFieldHtml('ekK', 'kv', 'Temperatur Kühlware', lim.kuehl, r && r.kv != null ? numIn(r.kv) : '')}${ekFieldHtml('ekTk', 'tv', 'Temperatur Tiefkühlware', lim.tk, r && r.tv != null ? numIn(r.tv) : '')}</div>
    <label class="tog ek-ok"><input type="checkbox" name="okc" ${!r || r.okc !== false ? 'checked' : ''} ${r && r.oka ? 'data-auto="1"' : ''}><span></span>Ware in Ordnung</label>
    <label class="f">${r ? 'Notiz zur Korrektur' : 'Notiz'}<input name="note" maxlength="160" value="" placeholder="${r ? 'z. B. nachgemessen, Tippfehler' : 'bei Abweichung: was getan wurde'}" autocomplete="off"></label>`,
    (fd, f) => { const kv = ekTemp(fd.get('kv')), tv = ekTemp(fd.get('tv')); if(Number.isNaN(kv)) return dlgErr('kv', 'Bitte eine Zahl eingeben, zum Beispiel 3,5.'); if(Number.isNaN(tv)) return dlgErr('tv', 'Bitte eine Zahl eingeben, zum Beispiel -18.');
      const okc = !!fd.get('okc'), oka = !!f.elements.okc.dataset.auto, note = String(fd.get('note') || '').trim().slice(0, 160), sup = fd.get('sup') || '', goods = String(fd.get('goods') || '').trim(), ls = String(fd.get('ls') || '').trim();
      if(kv == null && tv == null && okc) return dlgErr('kv', 'Bitte eine Temperatur eintragen oder „Ware in Ordnung“ abwählen.');
      const why = ekWeOutWhy(kv, tv, okc, lim); if(why.length && note.length < 3) return dlgErr('note', `${why.join(' · ')}. Bitte kurz notieren, was getan wurde.`);
      if(!r){ ekLogWe({kv, tv, okc, oka, note, sup, goods, ls}); return; }
      const same = r.kv === kv && r.tv === tv && r.okc === okc && (r.sup || '') === sup;
      if(same && !note){ if((r.goods || '') !== goods || (r.ls || '') !== ls){ r.goods = goods; r.ls = ls; } return; }
      r.prev = (r.prev || []).concat([{kv:r.kv, tv:r.tv, okc:r.okc, note:r.note || '', sup:r.sup || '', nm:r.nm || 0, out:r.out || 0, b:r.cb || r.b, at:r.cat || r.at}]).slice(-8);
      Object.assign(r, {kv, tv, okc, note, sup, goods, ls, cb:tmWhoName(), cat:new Date().toISOString(), lim:{...lim}}); delete r.nm; if(oka && !okc) r.oka = 1; else delete r.oka; r.out = why.length ? 1 : 0; },
    {done:r ? 'Korrektur gespeichert' : 'Eingetragen', del: r && canEditAll() ? () => ekVoidDlg(`${ekDateTxt(r.d)}, ${r.a} Uhr: ${ekWeTxt(r)}`, v => { r.void = v; }) : null,
     after: f => { const d = $('#dlgDel'); if(d) d.textContent = 'Stornieren'; }});
}
function ekCorrTxt(r){ return r.cb ? `korrigiert von ${r.cb} am ${fmtDate(r.cat)}` : ''; }
function ekWePageHtml(){
  const k = ekS(); const list = k.log.filter(r => r.k === 'we').sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 60);
  const row = r => { const old = (r.prev || []).length ? r.prev[r.prev.length - 1] : null;
    const inner = `<span class="ek-rd"><b>${esc(ekDateTxt(r.d))}</b><small>${esc(r.a)} Uhr</small></span><span class="ek-rm"><b>${old ? `<s>${esc(ekWeTxt(old))}</s> ` : ''}${r.void ? `<s>${esc(ekWeTxt(r))}</s>` : esc(ekWeTxt(r))}</b><small>${esc([ekSupName(r.sup) || r.ref || 'ohne Lieferant', r.goods || '', r.ls ? 'Lieferschein ' + r.ls : '', r.b].filter(Boolean).join(' · '))}${old && old.note ? ` · vorher: <span class="ck-note">${esc(old.note)}</span>` : ''}${r.note ? ` · <span class="ck-note">${esc(r.note)}</span>` : ''}${r.cb ? ` · ${esc(ekCorrTxt(r))}` : ''}${r.void ? ` · <span class="ek-void">${esc(ekVoidTxt(r))}</span>` : ''}</small></span>`;
    return r.void ? `<li class="void"><div class="ek-r">${inner}</div></li>` : `<li class="${r.out ? 'out' : ''}"><button type="button" class="ek-r" data-act="ekWeEdit" data-id="${r.id}">${inner}</button></li>`; };
  return `<button type="button" class="back" data-act="ckBack">${ico('arrow')}Alle Listen</button>
    <div class="page-h ck-rh"><div><h1>Wareneingang</h1><p class="sub">Temperatur je Lieferung. Ihr Grenzwert: Kühlware ${esc(ekLimTxt(k.limits.kuehl))}, Tiefkühlware ${esc(ekLimTxt(k.limits.tk))}.</p></div><div class="row-btns"><button type="button" class="btn primary" data-act="ekWeNew">${ico('plus')}Temperatur eintragen</button></div></div>
    ${list.length ? `<ul class="ek-log">${list.map(row).join('')}</ul>` : '<section class="panel empty">Noch kein Eintrag. Beim Einbuchen einer Lieferung mit Kühl- oder Tiefkühlware fragt die App nach der Temperatur.</section>'}`;
}

/* ---------- Frittieröl ---------- */
function ekOilState(fr, D){
  const k = ekS(); const log = k.log.filter(r => r.k === 'oil' && r.fr === fr.id && ekLive(r)).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const ch = log.find(r => r.t === 'wechsel') || null; const chk = log.find(r => r.t === 'check' && (!ch || String(r.at) > String(ch.at))) || null;
  const days = ch ? Math.max(0, ekDayDiff(ch.d, D)) : null; const I = +k.oilDays > 0 ? +k.oilDays : 0;
  const byCheck = !!(chk && chk.res === 'wechseln'); const byDays = !!(ch && I && days >= I);
  return {ch, chk, days, I, due:byCheck || byDays, byCheck, over:byDays ? days - I : 0};
}
function ekOilTxt(st, D){ return st.ch ? `letzter Wechsel ${ekWhenTxt(st.ch.d, D)}` : 'noch kein Wechsel eingetragen'; }
function ekOilDueTxt(st){ return !st.due ? '' : st.byCheck ? 'geprüft: wechseln' : st.over === 0 ? 'Wechsel heute fällig' : `Wechsel seit ${st.over === 1 ? '1 Tag' : st.over + ' Tagen'} fällig`; }
/* wer trägt ein: vorgewählt ist, wer an diesem Gerät arbeitet; ein Tipp wählt jemand anderen aus dem Team */
function ekWhoOpts(){ const me0 = tmWhoName(); const names = [me0].concat(tmS().people.filter(p => p.active).map(p => p.name)).filter((n, i, a) => n && a.indexOf(n) === i); return {me0, names}; }
function ekOilResTxt(r){ return r.t === 'wechsel' ? 'Öl gewechselt' : 'Öl geprüft: ' + (r.res === 'wechseln' ? 'wechseln' : 'in Ordnung') + (r.tpm != null ? ` · ${num(r.tpm, 1)} % polare Anteile` : ''); }
function ekOilDlg(kind){
  const k = ekS(); if(!k.fryers.length) return; const D = isoDate(new Date()); const w = ekWhoOpts();
  tmDialog(kind === 'check' ? 'Öl geprüft' : 'Öl gewechselt', `${kind === 'check' ? `<fieldset class="ek-pick"><legend>Ergebnis</legend><label><input type="radio" name="res" value="ok" checked><span>In Ordnung</span></label><label><input type="radio" name="res" value="wechseln"><span>Wechseln</span></label></fieldset>` : ''}
    ${k.fryers.length > 1 ? `<label class="f">Fritteuse<select name="fr">${k.fryers.map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('')}</select></label>` : ''}
    <div class="fields">${kind === 'check' ? '<label class="f">Messwert, % polare Anteile<input name="tpm" type="text" inputmode="decimal" autocomplete="off" placeholder="freiwillig"></label>' : ''}<label class="f">Datum<input name="d" type="date" max="${D}" value="${D}" required></label></div>
    <label class="f">Eingetragen von<select name="who">${w.names.map(n => `<option ${n === w.me0 ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>`,
    fd => { const d = String(fd.get('d') || ''); if(!TM_DATE.test(d) || d > D) return dlgErr('d', 'Bitte ein Datum bis heute wählen.');
      let tpm = null; if(kind === 'check' && String(fd.get('tpm') || '').trim()){ tpm = numParse(String(fd.get('tpm')).replace('%', '').trim()); if(!(tpm >= 0 && tpm <= 100)) return dlgErr('tpm', 'Bitte eine Zahl von 0 bis 100 eingeben, zum Beispiel 18.'); tpm = Math.round(tpm * 10) / 10; }
      const r = ekRec({k:'oil', fr:fd.get('fr') || k.fryers[0].id, t:kind === 'check' ? 'check' : 'wechsel'}); const who = String(fd.get('who') || ''); if(who && w.names.includes(who)) r.b = who;
      if(d !== r.d){ r.d = d; r.at = d + 'T23:59:00'; r.late = 1; } if(kind === 'check'){ r.res = fd.get('res') === 'wechseln' ? 'wechseln' : 'ok'; if(tpm != null) r.tpm = tpm; }
      k.log.unshift(r); ekOilDlg.last = r.id; },
    {toast:false});
  $('#dlg').addEventListener('close', () => { const id = ekOilDlg.last; ekOilDlg.last = null; if(!id) return; setTimeout(() => toast('Eingetragen', {action:() => { k.log = k.log.filter(x => x.id !== id); save(); render(); }}), 30); }, {once:true});
}
function ekOilPageHtml(D){
  const k = ekS(); const many = k.fryers.length > 1; const log = k.log.filter(r => r.k === 'oil').sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 40);
  const stat = k.fryers.map(f => { const st = ekOilState(f, D); return `<li class="${st.due ? 'due' : ''}"><span class="ek-rm"><b>${many ? esc(f.name) + ': ' : ''}${esc(ekOilTxt(st, D).replace(/^l/, 'L').replace(/^n/, 'N'))}</b><small>${st.due ? `<span class="bad-t">${esc(ekOilDueTxt(st))}</span>` : st.I ? `nächster Wechsel ${st.ch ? 'in ' + (st.I - st.days === 1 ? '1 Tag' : (st.I - st.days) + ' Tagen') : 'nach dem ersten Eintrag'}` : ''}${st.chk && !st.byCheck ? `${st.due || st.I ? ' · ' : ''}geprüft ${esc(ekWhenTxt(st.chk.d, D))}: in Ordnung` : ''}</small></span></li>`; }).join('');
  const row = r => `<li class="${r.void ? 'void' : ''}"><span class="ek-rd"><b>${esc(ekDateTxt(r.d))}</b><small>${r.late ? 'nachgetragen' : esc(r.a) + ' Uhr'}</small></span><span class="ek-rm"><b>${r.void ? `<s>${esc(ekOilResTxt(r))}</s>` : esc(ekOilResTxt(r))}</b><small>${esc([many ? ekFryerName(r.fr) : '', r.b].filter(Boolean).join(' · '))}${r.void ? ` · <span class="ek-void">${esc(ekVoidTxt(r))}</span>` : ''}</small></span>${canEditAll() && !r.void ? `<button type="button" class="icon-btn" data-act="ekDel" data-id="${r.id}" aria-label="Eintrag stornieren" title="Eintrag stornieren">${ico('x')}</button>` : ''}</li>`;
  return `<button type="button" class="back" data-act="ckBack">${ico('arrow')}Alle Listen</button>
    <div class="page-h ck-rh"><div><h1>Frittieröl</h1><p class="sub">${k.oilDays ? `Ihr Intervall: Wechsel alle ${k.oilDays === 1 ? '1 Tag' : k.oilDays + ' Tage'}.` : 'Kein Intervall festgelegt.'}</p></div>
      <div class="row-btns"><button type="button" class="btn" data-act="ekOil" data-id="check">Öl geprüft</button><button type="button" class="btn primary" data-act="ekOil" data-id="wechsel">${ico('check')}Öl gewechselt</button></div></div>
    <ul class="ek-stat">${stat}</ul>
    ${log.length ? `<ul class="ek-log">${log.map(row).join('')}</ul>` : ''}`;
}

/* ---------- Reinigungsplan ---------- */
function ekOpenDay(D){ return !tmClosed(D) || tmShifts(D).length > 0; }
function ekMonthDay(ym, md){ const [y, m] = ym.split('-').map(Number); const n = new Date(y, m, 0).getDate(); return `${ym}-${String(Math.min(md, n)).padStart(2, '0')}`; }
/* letzter Fälligkeitstag einer Aufgabe bis einschließlich D; null = (noch) nicht fällig */
function ekLastDue(t, D){
  if(t.off || (t.gone && D > t.gone)) return null; let d = null;
  if(t.when === 'daily') d = ekOpenDay(D) ? D : null;
  else if(t.when === 'weekly'){ d = D; for(let i = 0; i < 7 && dParse(d).getDay() !== t.wd; i++) d = dAdd(d, -1); }
  else { d = ekMonthDay(D.slice(0, 7), t.md || 1); if(d > D) d = ekMonthDay(dAdd(D.slice(0, 8) + '01', -1).slice(0, 7), t.md || 1); }
  return d && d >= (t.since || '') ? d : null;
}
/* Häkchen zu einer Fälligkeit: gesucht vom Tag D zurück bis zum Fälligkeitstag */
function ekDoneRec(t, due, D){ const runs = ckS().runs; for(let d = D, i = 0; d >= due && i < 40; d = dAdd(d, -1), i++){ const r = runs[d] && runs[d][EK_RUN]; const x = r && r.items && r.items[t.id]; if(x && (!x.due || x.due === due)) return Object.assign({d}, x); } return null; }
/* was am Küchentag D ansteht: fällig heute, überfällig (bleibt stehen, bis erledigt) oder heute erledigt */
function ekCleanToday(D){
  return ekS().clean.filter(t => !t.gone && !t.off).map(t => { const due = ekLastDue(t, D); if(!due) return null; const rec = ekDoneRec(t, due, D); if(rec && rec.d !== D) return null; return {t, due, rec, state:rec ? 'done' : due === D ? 'due' : 'over'}; }).filter(Boolean)
    .sort((a, b) => (a.state === 'done') - (b.state === 'done') || a.due.localeCompare(b.due));
}
function ekRhyTxt(t){ return t.when === 'weekly' ? `jede Woche am ${DAYNAME[t.wd]}` : t.when === 'monthly' ? `jeden Monat am ${t.md}.` : 'jeden Öffnungstag'; }
function ekCleanTick(id){
  const D = ckToday(); const x = ekCleanToday(D).find(y => y.t.id === id); if(!x) return; const c = ckS();
  const put = rec => { const day = c.runs[D] = c.runs[D] || {}; const run = day[EK_RUN] = day[EK_RUN] || {items:{}, n:0}; if(rec) run.items[id] = rec; else delete run.items[id]; delete run.demo; if(!Object.keys(run.items).length){ delete day[EK_RUN]; if(!Object.keys(day).length) delete c.runs[D]; } save(); render(); };
  if(x.rec){ if(!canEditAll()){ toast(`Erledigt von ${x.rec.b}, ${x.rec.a} Uhr. Zurücknehmen kann das nur der Chef.`); return; } const old = c.runs[D][EK_RUN].items[id]; put(null); toast('Häkchen entfernt', {action:() => put(old)}); return; }
  const y = window.scrollY; put(ckRec({due:x.due})); window.scrollTo(0, y); toast('Erledigt', {action:() => put(null)});
}
function ekCleanPageHtml(D){
  const list = ekCleanToday(D); const done = list.filter(x => x.state === 'done').length; const pr = {done, total:list.length};
  const dLong = dParse(D).toLocaleDateString('de-AT', {weekday:'long', day:'numeric', month:'long'});
  const row = x => { const t = x.t, on = x.state === 'done';
    return `<li class="ck-i ${on ? 'on' : ''}" data-item="${t.id}"><button type="button" role="checkbox" aria-checked="${on}" class="ck-c" data-act="ekTick" data-id="${t.id}"><span class="ck-box" aria-hidden="true">${ico('check')}</span><span class="ck-t"><span>${esc(t.t)}</span><small>${on ? `${esc(x.rec.b)}, ${x.rec.a} Uhr` : `${t.area ? esc(t.area) + ' · ' : ''}${EK_RHY[t.when]}${x.state === 'over' ? ` · <span class="bad-t">fällig seit ${esc(ekDateTxt(x.due))}</span>` : ''}`}</small></span></button></li>`; };
  return `<button type="button" class="back" data-act="ckBack">${ico('arrow')}Alle Listen</button>
    <div class="page-h ck-rh"><div><h1>Reinigungsplan</h1><p class="sub">${esc(dLong)}</p></div></div>
    ${list.length ? `<div class="ck-sticky" id="ckSticky"><b id="ckProg">${pr.done} von ${pr.total}</b>${ckProgHtml(pr)}<span id="ckState">${done >= list.length ? 'fertig' : ''}</span></div><ul class="ck-items">${list.map(row).join('')}</ul>`
      : `<section class="pl-closed ck-none"><h2>Heute steht nichts an</h2><p>${ekS().clean.some(t => !t.gone) ? 'Aufgaben erscheinen an ihrem Tag und bleiben stehen, bis sie erledigt sind.' : canEditAll() ? 'Legen Sie die Aufgaben unter „Vorlagen“ an.' : 'Der Chef legt die Aufgaben an.'}</p></section>`}`;
}
function ekCleanDlg(){
  if(!roGate()) return; const k = ekS(); const cur = k.clean.filter(t => !t.gone); const areas = [...new Set(cur.map(t => t.area).concat(TM_AREAS.map(a => a[1]), ['Kühlhaus', 'Lager', 'Gastraum', 'WC']).filter(Boolean))];
  const row = t => `<li class="ek-er" data-tid="${t.id || ''}"><input name="t" value="${esc(t.t || '')}" maxlength="90" placeholder="Was ist zu reinigen?" aria-label="Aufgabe">
    <input name="area" value="${esc(t.area || '')}" maxlength="30" list="ekAreas" placeholder="Bereich" aria-label="Bereich">
    <select name="when" aria-label="Rhythmus">${Object.entries(EK_RHY).map(([v, l]) => `<option value="${v}" ${t.when === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <select name="wd" aria-label="Wochentag" ${t.when === 'weekly' ? '' : 'hidden'}>${[1, 2, 3, 4, 5, 6, 0].map(i => `<option value="${i}" ${t.wd === i ? 'selected' : ''}>${DAYNAME[i]}</option>`).join('')}</select>
    <label class="ek-md" ${t.when === 'monthly' ? '' : 'hidden'}>am<input name="md" inputmode="numeric" value="${t.md || 1}" maxlength="2" aria-label="Tag im Monat">.</label>
    <button type="button" class="icon-btn" data-ekdel="1" aria-label="Aufgabe entfernen" title="Entfernen">${ico('x')}</button></li>`;
  tmDialog('Reinigungsplan', `<datalist id="ekAreas">${areas.map(a => `<option value="${esc(a)}">`).join('')}</datalist>
    <ol class="ek-ed" id="ekEd">${cur.map(row).join('')}</ol>
    <button type="button" class="btn sm" data-ekadd="1">${ico('plus')}Aufgabe</button>
    <p class="hint">Eine Aufgabe erscheint an ihrem Tag bei den Checklisten und bleibt dort stehen, bis sie abgehakt ist. Tägliche Aufgaben gelten an Öffnungstagen.</p>`,
    (fd, f) => { const today = ckToday(); const next = [];
      for(const li of f.querySelectorAll('.ek-er')){ const g = n => li.querySelector(`[name="${n}"]`); const t = g('t').value.trim(); if(!t) continue; const when = EK_RHY[g('when').value] ? g('when').value : 'weekly';
        const md = Math.round(numParse(g('md').value)); if(when === 'monthly' && !(md >= 1 && md <= 31)) return dlgErr(g('md'), 'Bitte einen Tag von 1 bis 31 eintragen.');
        const x = {t, area:g('area').value.trim(), when, wd:when === 'weekly' ? +g('wd').value : null, md:when === 'monthly' ? md : null};
        const old = li.dataset.tid ? k.clean.find(o => o.id === li.dataset.tid) : null;
        // anderer Rhythmus = neue Aufgabe: was bisher erledigt wurde, bleibt unter der alten stehen
        if(old && old.when === x.when && old.wd === x.wd && old.md === x.md){ Object.assign(old, x); delete old.demo; next.push(old); } else next.push({id:uid('ec'), ...x, since:today}); }
      k.clean.forEach(o => { if(!o.gone && !next.includes(o)) o.gone = today; });
      k.clean = k.clean.filter(o => o.gone).concat(next).slice(-120); },
    {done:'Reinigungsplan gespeichert', after: f => { f.dataset.wide = '1';
      f.onchange = e => { if(e.target.name !== 'when') return; const li = e.target.closest('.ek-er'); li.querySelector('[name="wd"]').hidden = e.target.value !== 'weekly'; li.querySelector('.ek-md').hidden = e.target.value !== 'monthly'; };
      f.onclick = e => { if(e.target.closest('[data-ekadd]')){ $('#ekEd').insertAdjacentHTML('beforeend', row({id:'', t:'', area:'', when:'weekly', wd:1, md:1})); const i = $('#ekEd').lastElementChild.querySelector('[name="t"]'); i.focus(); i.scrollIntoView({block:'nearest'}); return; } const li = e.target.closest('.ek-er'); if(li && e.target.closest('[data-ekdel]')) li.remove(); };
      if(!cur.length) f.querySelector('[data-ekadd]').click(); }});
}
/* Grenzwerte, Fritteusen, Intervall */
function ekSetupDlg(){
  if(!roGate()) return; const k = ekS();
  tmDialog('Grenzwerte und Frittieröl', `<div class="fields"><label class="f">Kühlware höchstens, °C<input name="kuehl" inputmode="text" value="${numIn(k.limits.kuehl)}" required></label><label class="f">Tiefkühlware höchstens, °C<input name="tk" inputmode="text" value="${numIn(k.limits.tk)}" required></label></div>
    <p class="hint" style="margin-top:0">Ihre eigenen Grenzwerte für den Wareneingang. Liegt eine Lieferung darüber, fragt die App nach einer Notiz.</p>
    <label class="f">Fritteusen<input name="fryers" maxlength="140" value="${esc(k.fryers.map(f => f.name).join(', '))}" placeholder="z. B. Fritteuse links, Fritteuse rechts"></label>
    <label class="f">Ölwechsel alle … Tage<input name="oilDays" class="num-in" type="text" inputmode="numeric" data-max="365" value="${k.oilDays || ''}" placeholder="leer = keine Erinnerung"></label>
    <p class="hint" style="margin-top:0">Mehrere Fritteusen mit Komma trennen. Ohne Fritteuse das Feld leer lassen.</p>`,
    fd => { const ku = ekTemp(fd.get('kuehl')), tk = ekTemp(fd.get('tk')); if(ku == null || Number.isNaN(ku)) return dlgErr('kuehl', 'Bitte eine Zahl eingeben, zum Beispiel 4.'); if(tk == null || Number.isNaN(tk)) return dlgErr('tk', 'Bitte eine Zahl eingeben, zum Beispiel -18.');
      if(tk >= ku) return dlgErr('tk', 'Der Grenzwert für Tiefkühlware muss unter dem für Kühlware liegen.');
      k.limits = {kuehl:ku, tk};
      const names = [...new Set(String(fd.get('fryers') || '').split(',').map(s => s.trim().slice(0, 30)).filter(Boolean))].slice(0, 6);
      { const old = k.fryers; const used = new Set(); k.fryers = names.map((n, i) => { const hit = old.find(f => f.name === n && !used.has(f.id)) || (names.length === old.length && !names.includes(old[i].name) && !used.has(old[i].id) ? old[i] : null); const id = hit ? hit.id : uid('fr'); used.add(id); return {id, name:n}; }); }   // umbenannt: die Einträge bleiben bei der Fritteuse
      const od = Math.round(+fd.get('oilDays')); k.oilDays = od > 0 ? od : ''; },
    {done:'Gespeichert'});
}

/* ---------- Übersicht bei den Checklisten, Zeile auf „Heute“ ---------- */
function ekDue(D){
  const k = ekS(); const cl = ekCleanToday(D); const open = cl.filter(x => x.state !== 'done'), over = open.filter(x => x.state === 'over');
  const oil = k.fryers.map(f => ({f, st:ekOilState(f, D)})).filter(x => x.st.due);
  return {cl, open, over, oil, any:open.length > 0 || oil.length > 0};
}
function ekCleanSub(d){ return d.open.length ? `${d.open.length} offen${d.over.length ? `, <span class="bad-t">${d.over.length === d.open.length ? '' : d.over.length + ' davon '}überfällig</span>` : ''}` : d.cl.length ? 'für heute erledigt' : 'heute steht nichts an'; }
function ekOverviewHtml(D){
  const k = ekS(); const d = ekDue(D); const rows = []; const T = isoDate(new Date());
  const li = (id, name, sub, done) => `<li><button type="button" class="ek-l ${done ? 'done' : ''}" data-act="ekOpen" data-id="${id}"><span class="ck-ln"><b>${name}</b><small>${sub}</small></span><span class="ck-go" aria-hidden="true">${done ? ico('check') : ico('arrow', 'flip')}</span></button></li>`;
  if(k.clean.some(t => !t.gone)) rows.push(li('clean', 'Reinigungsplan', ekCleanSub(d), d.cl.length > 0 && !d.open.length));
  if(k.fryers.length){ const sts = k.fryers.map(f => ({f, st:ekOilState(f, T)})); const many = sts.length > 1;
    rows.push(li('oil', 'Frittieröl', sts.map(x => `${many ? esc(x.f.name) + ': ' : ''}${esc(ekOilTxt(x.st, T))}${x.st.due ? ` · <span class="bad-t">${esc(ekOilDueTxt(x.st))}</span>` : ''}`).join(' · '), false)); }
  const we = k.log.filter(r => r.k === 'we' && ekLive(r)).sort((a, b) => String(b.at).localeCompare(String(a.at)))[0];
  rows.push(li('we', 'Wareneingang', we ? `zuletzt ${esc(ekDateTxt(we.d))}: ${esc(ekWeTxt(we))}${we.out ? ' · <span class="bad-t">außerhalb</span>' : ''}` : 'noch keine Temperatur eingetragen', false));
  return `<h2 class="ek-h">Eigenkontrolle</h2><ul class="ek-lists">${rows.join('')}</ul>`;
}
function ekTplHtml(){
  const k = ekS(); const cur = k.clean.filter(t => !t.gone); const rh = [...new Set(cur.map(t => EK_RHY[t.when]))];
  return `<h2 class="ek-h">Eigenkontrolle</h2><ul class="ek-tpls">
    <li><span class="ck-ln"><b>Reinigungsplan</b><small>${cur.length ? `${plural(cur.length, 'Aufgabe', 'Aufgaben')} · ${rh.join(', ')}` : 'noch keine Aufgaben'}</small></span><button type="button" class="btn sm" data-act="ekCleanEdit">Bearbeiten</button></li>
    <li><span class="ck-ln"><b>Grenzwerte und Frittieröl</b><small>Kühlware ${esc(ekLimTxt(k.limits.kuehl))} · Tiefkühlware ${esc(ekLimTxt(k.limits.tk))} · ${k.fryers.length ? (k.oilDays ? `Ölwechsel alle ${k.oilDays === 1 ? '1 Tag' : k.oilDays + ' Tage'}` : 'Ölwechsel ohne Erinnerung') : 'keine Fritteuse'}</small></span><button type="button" class="btn sm" data-act="ekSetup">Bearbeiten</button></li></ul>`;
}
/* „Heute“: höchstens eine ruhige Zeile, nur wenn etwas ansteht */
function ekDashRow(D){
  const d = ekDue(D); if(!d.any) return ''; const parts = [];
  if(d.open.length) parts.push(`Reinigungsplan: ${d.open.length} offen${d.over.length ? `, ${d.over.length === d.open.length ? '' : d.over.length + ' davon '}überfällig` : ''}`);
  if(d.oil.length) parts.push(`Frittieröl: ${d.oil.length > 1 ? d.oil.length + ' Fritteusen, ' : ''}${ekOilDueTxt(d.oil[0].st)}`);
  return dayRow(String(d.open.length + d.oil.length), 'Eigenkontrolle', esc(parts.join(' · ')), '', `<button type="button" class="btn sm" data-act="ekOpen" data-id="${d.open.length ? 'clean' : 'oil'}">Öffnen</button>`, 'ek-dash');
}
function ekPageHtml(kind, D){ return kind === 'oil' ? ekOilPageHtml(isoDate(new Date())) : kind === 'we' ? ekWePageHtml() : ekCleanPageHtml(D); }
/* Verlauf eines Tages: was zur Eigenkontrolle eingetragen wurde */
function ekHistDetail(D){
  const k = ekS(); const run = ckRun(D, EK_RUN); const rows = [];
  if(run) Object.keys(run.items).forEach(id => { const r = run.items[id]; const t = k.clean.find(x => x.id === id); rows.push(`<li class="on"><span class="ck-hs" aria-hidden="true">${ico('check')}</span><span class="ck-ht">${esc(t ? t.t : 'Gelöschte Aufgabe')}${r.due && r.due !== D ? `<small>fällig war ${esc(ekDateTxt(r.due))}</small>` : ''}</span><span class="ck-hw">${esc(r.b)} · ${r.a}</span></li>`); });
  k.log.filter(r => r.d === D).forEach(r => { const what = r.k === 'we' ? `Wareneingang${ekSupName(r.sup) ? ' ' + esc(ekSupName(r.sup)) : ''}: ${esc(ekWeTxt(r))}` : r.k === 'ckv' ? `${esc(r.t)}: ${esc(ckVal(r.v))} ${esc(r.unit || '')}` : `${esc(ekFryerName(r.fr))}: ${r.t === 'wechsel' ? 'Öl gewechselt' : 'Öl geprüft, ' + (r.res === 'wechseln' ? 'wechseln' : 'in Ordnung')}`;
    rows.push(`<li class="on ${r.out ? 'out' : ''} ${r.void ? 'void' : ''}"><span class="ck-hs" aria-hidden="true">${r.void ? '' : ico('check')}</span><span class="ck-ht">${r.void ? `<s>${what}</s>` : what}${r.note ? `<small>${esc(r.note)}</small>` : ''}${r.void ? `<small>${esc(ekVoidTxt(r))}</small>` : ''}</span><span class="ck-hw">${esc(r.b)} · ${r.late ? 'nachgetragen' : r.a}</span></li>`); });
  return rows.length ? `<div class="ck-hd"><h3>Eigenkontrolle<span>${rows.length === 1 ? '1 Eintrag' : rows.length + ' Einträge'}</span></h3><ul>${rows.join('')}</ul></div>` : '';
}

/* ---------- Monatsmappe: feste A4-Blätter, Kopf auf jedem Blatt, keine geteilte Zeile ---------- */
function ekMonthDays(ym){ const [y, m] = ym.split('-').map(Number); const n = new Date(y, m, 0).getDate(); const today = ckToday(); const out = []; for(let d = 1; d <= n; d++){ const D = `${ym}-${String(d).padStart(2, '0')}`; if(D > today) break; out.push(D); } return out; }
/* Messwerte: alle Punkte mit Bereich, die in dem Monat auf einer fälligen Liste standen oder einen Eintrag haben */
function ekTempCols(days){
  const c = ckS(); const cols = [];
  c.templates.forEach(tp => { tp.items.concat(tp.old || []).forEach(it => { if(!it.val) return; const cur = tp.items.includes(it);
    const has = days.some(D => { const r = ckRun(D, tp.id); return r && r.items[it.id] && r.items[it.id].v != null; }); const due = cur && days.some(D => ckApplies(tp, D));
    if(has || due) cols.push({tp, it, cur}); }); });
  return cols;
}
/* erster Tag mit irgendeinem Eintrag (Checklisten, Reinigungsplan, Eigenkontrolle); vorher gibt es keine Aufzeichnung in der App */
function ekFirstDay(){ const runs = ckS().runs; const ds = Object.keys(runs).filter(D => TM_DATE.test(D) && Object.keys(runs[D] || {}).length).concat(ekS().log.map(r => r.d)).sort(); return ds[0] || ''; }
function ekMappeBlocks(ym){
  const c = ckS(), k = ekS(); const days = ekMonthDays(ym); const dev = []; const blocks = [];
  const dayCell = D => `<td class="mp-d">${esc(ekDateTxt(D))}</td>`;
  // Tage vor dem ersten Eintrag in der App: ehrlich als „vor Beginn der Aufzeichnung“, eine Zeile statt vieler leerer
  const first = ekFirstDay(); const pre = days.filter(D => !first || D < first), live = days.filter(D => first && D >= first);
  const preRow = n => pre.length ? [`<tr class="mp-pre"><td colspan="${n + 1}">${esc(tmDm(pre[0]))}${pre.length > 1 ? '–' + esc(tmDm(pre[pre.length - 1])) : ''}: vor Beginn der Aufzeichnung${first ? ` (erster Eintrag am ${esc(tmDm(first))})` : ' (noch kein Eintrag)'}</td></tr>`] : [];
  const voids = k.log.filter(r => r.k === 'ckv' && r.void && r.d.slice(0, 7) === ym);
  voids.forEach(r => dev.push({D:r.d, what:r.t, val:`storniert: ${ckVal(r.v)} ${r.unit || ''}`, lim:'', note:`Grund: ${r.void.why}${r.note ? ' · Notiz damals: ' + r.note : ''}`, who:`${r.void.b}, ${fmtDate(r.void.at)} (eingetragen von ${r.b}, ${r.a})`}));
  // 1 · Temperaturen: je Tag eine Zeile, auch ohne Eintrag
  const cols = ekTempCols(days);
  for(let i = 0; i < Math.max(1, cols.length); i += 4){ const part = cols.slice(i, i + 4);
    const rows = preRow(part.length).concat(live.map(D => `<tr>${dayCell(D)}${part.map(({tp, it, cur}) => { const run = ckRun(D, tp.id); const r = run && run.items[it.id]; const u = it.val.unit || '';
      if(r && r.v != null){ if(r.out) dev.push({D, what:`${tp.name}: ${it.t}`, val:`${ckVal(r.v)} ${u}`, lim:`erlaubt ${ckRangeTxt(it.val)}`, note:r.note || '', who:`${r.b}, ${r.a}`});
        const ps = r.prev || [];
        ps.forEach((p, j) => { if(p.out) dev.push({D, what:`${tp.name}: ${it.t}`, val:`${ckVal(p.v)} ${u}`, lim:`erlaubt ${ckRangeTxt(it.val)}`, note:p.note || '', who:`${p.b}, ${p.a}`});
          const nx = ps[j + 1] || r; dev.push({D, what:`${tp.name}: ${it.t}`, val:`korrigiert: ${ckVal(p.v)} → ${ckVal(nx.v)} ${u}${nx.ck === 'nach' ? ' · Nachmessung' : nx.ck === 'tipp' ? ' · Tippfehler' : ''}`, lim:'', note:[`zuerst eingetragen von ${p.b}, ${p.a} Uhr`, !nx.out && nx.note ? nx.note : ''].filter(Boolean).join(' · '), who:`${nx.b}, ${nx.a}`}); });
        const bang = r.out || (ps.some(p => p.out) && r.ck !== 'tipp');
        return `<td class="mp-v ${bang ? 'out' : ''}"><b>${ckVal(r.v).replace('-', '−')}${bang ? ' !' : ''}</b> <small>${esc(r.b)} ${r.a}${ps.length ? ' · korr.' : ''}</small></td>`; }
      if(voids.some(x => x.d === D && x.tp === tp.id && x.it === it.id)) return '<td class="mp-v gap">storniert</td>';
      return cur && ckApplies(tp, D) ? '<td class="mp-v gap">kein Eintrag</td>' : '<td class="mp-v na">·</td>'; }).join('')}</tr>`));
    blocks.push({title:'Temperaturen' + (cols.length > 4 ? ` (${i / 4 + 1})` : ''), cls:'mp-temp', head:`<tr><th class="mp-d">Tag</th>${part.map(({tp, it}) => `<th>${esc(it.t)}<small>${esc(tp.name)} · ${esc(ckRangeTxt(it.val))}</small></th>`).join('')}</tr>`,
      rows:cols.length ? rows : [], empty:'In den Checklisten gibt es keinen Messwert.', note:cols.length ? '„kein Eintrag“: Die Liste war fällig, der Wert wurde nicht eingetragen. · : an dem Tag nicht fällig (Ruhetag oder nicht auf dem Plan). ! : außerhalb des Bereichs, siehe Abweichungen. korr.: korrigiert, siehe Abweichungen und Korrekturen.' : ''}); }
  // 2 · Wareneingang
  const we = k.log.filter(r => r.k === 'we' && r.d.slice(0, 7) === ym).sort((a, b) => String(a.at).localeCompare(String(b.at)));
  we.forEach(r => { const what = 'Wareneingang' + (ekSupName(r.sup) ? ' ' + ekSupName(r.sup) : ''); const limT = `Ihr Grenzwert: Kühlware ${ekLimTxt((r.lim || k.limits).kuehl)}, Tiefkühlware ${ekLimTxt((r.lim || k.limits).tk)}`;
    if(r.out) dev.push({D:r.d, what, val:ekWeTxt(r), lim:limT, note:r.note || '', who:`${r.b}, ${r.a}`});
    (r.prev || []).forEach(p => { if(p.out) dev.push({D:r.d, what, val:ekWeTxt(p) + ' (vor der Korrektur)', lim:limT, note:p.note || '', who:`${p.b}, ${p.at ? fmtDate(p.at) : r.a}`});
      dev.push({D:r.d, what, val:`korrigiert: ${ekWeTxt(p)} → ${ekWeTxt(r)}`, lim:'', note:[`zuerst eingetragen von ${p.b}`, !r.out && r.note ? r.note : ''].filter(Boolean).join(' · '), who:`${r.cb || r.b}, ${fmtDate(r.cat || r.at)}`}); });
    if(r.void) dev.push({D:r.d, what, val:'storniert: ' + ekWeTxt(r), lim:'', note:'Grund: ' + r.void.why, who:`${r.void.b}, ${fmtDate(r.void.at)} (eingetragen von ${r.b}, ${r.a})`}); });
  blocks.push({title:'Wareneingang', cls:'mp-we', head:'<tr><th class="mp-d">Tag</th><th>Lieferant</th><th class="mp-n">Kühlware</th><th class="mp-n">Tiefkühlware</th><th>Zustand</th><th>Wer, wann</th></tr>',
    rows:we.map(r => `<tr class="${r.void ? 'mp-void' : ''}">${dayCell(r.d)}<td>${esc(ekSupName(r.sup) || r.ref || 'ohne Angabe')}${r.goods || r.ls ? `<small>${esc([r.goods || '', r.ls ? 'Lieferschein ' + r.ls : ''].filter(Boolean).join(' · '))}</small>` : ''}</td>${r.nm ? '<td class="mp-n gap" colspan="2">nicht gemessen</td>' : `<td class="mp-n">${r.kv != null ? esc(ekT(r.kv)) + (r.kv > +(r.lim || k.limits).kuehl ? ' !' : '') : '–'}</td><td class="mp-n">${r.tv != null ? esc(ekT(r.tv)) + (r.tv > +(r.lim || k.limits).tk ? ' !' : '') : '–'}</td>`}<td>${r.void ? 'storniert' : r.okc === false ? 'nicht in Ordnung !' : 'in Ordnung'}</td><td>${esc(r.b)}, ${r.a}${r.cb ? ' · korrigiert' : ''}</td></tr>`),
    empty:'In diesem Monat wurde keine Temperatur einer Lieferung eingetragen.'});
  // 3 · Frittieröl
  if(k.fryers.length || k.log.some(r => r.k === 'oil')){ const oil = k.log.filter(r => r.k === 'oil' && r.d.slice(0, 7) === ym).sort((a, b) => String(a.at).localeCompare(String(b.at)));
    oil.filter(r => r.void).forEach(r => dev.push({D:r.d, what:ekFryerName(r.fr), val:'storniert: ' + ekOilResTxt(r), lim:'', note:'Grund: ' + r.void.why, who:`${r.void.b}, ${fmtDate(r.void.at)} (eingetragen von ${r.b}, ${r.a})`}));
    blocks.push({title:'Frittieröl', cls:'mp-oil', head:'<tr><th class="mp-d">Tag</th><th>Fritteuse</th><th>Eintrag</th><th>Wer, wann</th></tr>',
      rows:oil.map(r => `<tr class="${r.void ? 'mp-void' : ''}">${dayCell(r.d)}<td>${esc(ekFryerName(r.fr))}</td><td>${esc(ekOilResTxt(r))}${r.void ? ' · storniert' : ''}</td><td>${esc(r.b)}${r.late ? ', nachgetragen' : ', ' + r.a}</td></tr>`),
      empty:'In diesem Monat wurde kein Ölwechsel und keine Prüfung eingetragen.'}); }
  // 4 · Reinigungsplan
  const recs = new Map(); Object.keys(c.runs).forEach(D => { const r = c.runs[D][EK_RUN]; if(r) Object.keys(r.items).forEach(id => { const x = r.items[id]; recs.set(id + '|' + (x.due || D), Object.assign({d:D}, x)); }); });
  const tasks = k.clean.filter(t => days.some(D => ekLastDue(t, D) === D));
  const cr = []; tasks.forEach(t => { const occ = days.filter(D => ekLastDue(t, D) === D); const head = `<td>${esc(t.t)}<small>${esc([t.area, ekRhyTxt(t)].filter(Boolean).join(' · '))}</small></td>`;
    if(t.when === 'daily'){ const miss = occ.filter(D => !recs.get(t.id + '|' + D)); const who = [...new Set(occ.map(D => recs.get(t.id + '|' + D)).filter(Boolean).map(r => r.b))];
      cr.push(`<tr>${head}<td>${occ.length === 1 ? '1 Öffnungstag' : occ.length + ' Öffnungstage'}</td><td>an ${occ.length - miss.length} von ${occ.length} Tagen${who.length ? ' · ' + esc(who.join(', ')) : ''}${miss.length ? `<small class="gap">nicht abgehakt: ${miss.map(tmDm).join(' ')}</small>` : ''}</td></tr>`); }
    else occ.forEach(D => { const r = recs.get(t.id + '|' + D); cr.push(`<tr>${head}<td>${esc(ekDateTxt(D))}</td>${r ? `<td>${esc(ekDateTxt(r.d))} · ${esc(r.b)}, ${r.a}</td>` : '<td class="gap">nicht abgehakt</td>'}</tr>`); }); });
  if(k.clean.length) blocks.push({title:'Reinigungsplan', cls:'mp-cl', head:'<tr><th>Aufgabe</th><th>Fällig</th><th>Erledigt</th></tr>', rows:cr, empty:'In diesem Monat war keine Aufgabe fällig.'});
  // 5 · Checklisten Tag für Tag
  const lr = preRow(4); live.forEach(D => { const due = ckDue(D); if(!due.length){ lr.push(`<tr class="cp-d mp-gap">${dayCell(D)}<td colspan="4">${tmClosed(D) ? 'Ruhetag, keine Liste fällig' : 'keine Liste fällig'}</td></tr>`); return; }
    due.forEach((tp, i) => { const run = ckRun(D, tp.id) || {items:{}}; const pr = ckProg(tp, D); const rs = Object.values(run.items); const who = [...new Set(rs.map(r => r.b))].join(', '); const times = rs.map(r => r.a).sort(); const first = times[0], last = times[times.length - 1];
      const open = pr.full ? [] : tp.items.filter(it => !run.items[it.id]).map(it => esc(it.t));
      lr.push(`<tr class="${i ? '' : 'cp-d'}">${i ? '<td class="mp-d"></td>' : dayCell(D)}<td>${esc(tp.name)}</td><td class="cp-n">${pr.done} von ${pr.total}${pr.full ? '' : pr.over ? (pr.started ? ' · nicht fertig' : ' · nicht gemacht') : ' · offen'}</td><td>${who ? `${esc(who)}${first ? `, ${first}${last !== first ? '–' + last : ''} Uhr` : ''}` : '<span class="gap">kein Eintrag</span>'}</td><td class="cp-o">${open.length && pr.started ? 'Offen: ' + open.join('; ') : ''}</td></tr>`); }); });
  blocks.push({title:'Checklisten', cls:'mp-ck', head:'<tr><th class="mp-d">Tag</th><th>Liste</th><th>Erledigt</th><th>Wer, wann</th><th>Offen geblieben</th></tr>', rows:lr, empty:'In diesem Monat war keine Liste fällig.'});
  // 6 · Abweichungen auf einem eigenen Blatt
  dev.sort((a, b) => a.D.localeCompare(b.D));
  blocks.push({title:'Abweichungen und Korrekturen', cls:'mp-dev', page:true, head:'<tr><th class="mp-d">Tag</th><th>Was</th><th>Wert</th><th>Notiz</th><th>Wer, wann</th></tr>',
    rows:dev.map(x => `<tr>${dayCell(x.D)}<td>${esc(x.what)}</td><td>${esc(x.val)}${x.lim ? `<small>${esc(x.lim)}</small>` : ''}</td><td>${esc(x.note) || '<span class="gap">keine Notiz</span>'}</td><td>${esc(x.who)}</td></tr>`), empty:'In diesem Monat wurde keine Abweichung eingetragen.'});
  return {blocks, days, nDev:dev.length};
}
/* Blöcke auf Blätter verteilen (gemessen wie beim Allergen-Blatt) */
function ekMappe(ym){
  const {blocks, days, nDev} = ekMappeBlocks(ym); const [y, m] = ym.split('-').map(Number); const part = ym === ckToday().slice(0, 7);
  const head = `<header class="ab-h"><div><b>${abU(S.settings.name)}</b><h1>Eigenkontrolle · ${MONTHS[m - 1]} ${y}</h1></div><div class="ab-meta"><span>${days.length ? `${tmDm(days[0])} bis ${tmDm(days[days.length - 1])}${part ? ' (laufender Monat)' : ''}` : 'noch keine Tage'}</span><span>erstellt am ${fmtDate(new Date().toISOString())} von ${esc(me().name)}</span><span class="ab-pn" data-ab-n="1"></span></div></header>`;
  const foot = '<footer class="ab-f"><p>Eigene Aufzeichnung des Betriebs, erstellt mit der Küchen-App. Die Angaben stammen aus den Einträgen des Teams. Wo nichts eingetragen wurde, steht „kein Eintrag“.</p><div class="mp-sig-l"><span>Geprüft (Name)</span><span>Datum</span><span>Unterschrift</span></div></footer>';
  let host = document.getElementById('abMeasure'); if(!host){ host = document.createElement('div'); host.id = 'abMeasure'; host.className = 'ab-measure'; host.setAttribute('aria-hidden', 'true'); document.body.appendChild(host); }
  host.innerHTML = ''; const pages = []; let body = null;
  const newPage = () => { const p = document.createElement('article'); p.className = 'ab-page mp-page'; p.innerHTML = `${head}<div class="ab-body"></div>${foot}`; host.appendChild(p); pages.push(p); body = p.querySelector('.ab-body'); };
  const fits = () => { const last = body.lastElementChild; return !last || last.getBoundingClientRect().bottom <= body.getBoundingClientRect().bottom - 4; };   // etwas Luft am Blattende
  const open = (b, cont) => { const s = document.createElement('section'); s.className = 'mp-sec ' + b.cls; s.innerHTML = `<h2>${esc(b.title)}${cont ? '<span>Fortsetzung</span>' : ''}</h2>${b.html ? b.html : b.rows.length ? `<table class="mp-t"><thead>${b.head}</thead><tbody></tbody></table>` : `<p class="mp-empty">${esc(b.empty)}</p>`}`; body.appendChild(s); return s; };
  newPage();
  blocks.forEach(b => {
    if(b.page && body.children.length) newPage();
    let sec = open(b, false), tb = sec.querySelector('tbody');
    if(!b.rows.length){ if(!fits() && body.children.length > 1){ sec.remove(); newPage(); open(b, false); } return; }
    const tmp = document.createElement('tbody');
    // ein Abschnitt beginnt nicht mit weniger als drei Zeilen am Blattende
    if(body.children.length > 1 && b.rows.length > 3){ tmp.innerHTML = b.rows.slice(0, 3).join(''); const probe = [...tmp.children]; probe.forEach(tr => tb.appendChild(tr)); const ok = fits(); probe.forEach(tr => tr.remove()); if(!ok){ sec.remove(); newPage(); sec = open(b, false); tb = sec.querySelector('tbody'); } }
    b.rows.forEach((html, i) => { tmp.innerHTML = html; const tr = tmp.firstElementChild; tb.appendChild(tr);
      if(fits()) return;
      if(i === 0){ if(body.children.length > 1){ sec.remove(); newPage(); sec = open(b, false); tb = sec.querySelector('tbody'); tb.appendChild(tr); } return; }
      tr.remove(); newPage(); sec = open(b, true); tb = sec.querySelector('tbody'); tb.appendChild(tr); });
    if(b.note){ const n = document.createElement('p'); n.className = 'mp-note'; n.textContent = b.note; sec.appendChild(n); if(!fits()) n.remove(); }
  });
  pages.forEach((pg, i) => { pg.querySelector('[data-ab-n]').textContent = `Blatt ${i + 1} von ${pages.length}`; });
  const out = pages.map(pg => pg.outerHTML); host.innerHTML = '';
  return {pages:out, name:pdfFileName('Monatsmappe-' + ym), ym, days:days.length, nDev};
}
/* der ganze Monat als HTML (ein Blatt nach dem anderen) */
function ckPrintHtml(ym){ return ekMappe(ym).pages.join(''); }
/* „Als PDF speichern“ im Verlauf: die Monatsmappe */
async function ckPrint(){
  const sel = document.querySelector('#app [data-ckmonth]'); const ym = (sel && sel.value) || view.ck.month || ckToday().slice(0, 7);
  // erst die Schriften laden lassen (ein Probedurchlauf zeigt dem Browser, welche gebraucht werden), dann messen: sonst stimmen die Zeilenhöhen nicht
  ekMappe(ym); try { if(document.fonts && document.fonts.ready) await document.fonts.ready; } catch(e){}
  const r = ekMappe(ym); const n = await a4Pdf(r.pages, r.name); window.__ekLast = {name:r.name, pages:n, ym, days:r.days, dev:r.nDev};
}

/* ---------- Bedienung ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const a = el.dataset.act, id = el.dataset.id || '';
  if(!/^ek[A-Z]/.test(a) || document.body.classList.contains('gd-help')) return;
  const v = view.ck || (view.ck = {tab:'heute'});
  switch(a){
    case 'ekOpen': v.tab = 'heute'; v.run = null; v.ek = ['clean', 'oil', 'we'].includes(id) ? id : null; if(view.tab !== 'checkl') go('checkl'); else { render(); window.scrollTo({top:0}); } break;
    case 'ekTick': ekCleanTick(id); break;
    case 'ekOil': ekOilDlg(id === 'check' ? 'check' : 'wechsel'); break;
    case 'ekWeNew': ekWeDlg(null); break;
    case 'ekWeEdit': ekWeDlg(id); break;
    case 'ekDel': { const k = ekS(); const r = k.log.find(x => x.id === id); if(r && !r.void) ekVoidDlg(`${ekDateTxt(r.d)}: ${r.k === 'oil' ? ekOilResTxt(r) : ekWeTxt(r)}`, v => { r.void = v; }); break; }
    case 'ekCleanEdit': ekCleanDlg(); break;
    case 'ekSetup': ekSetupDlg(); break;
  }
});

/* von Hand umgeschaltet: die App schaltet „Ware in Ordnung“ nicht mehr von selbst um */
document.addEventListener('change', e => { const t = e.target; if(t && t.matches && t.matches('#rOk,[name=okc],[name=ekOk]')) delete t.dataset.auto; });
/* Checklisten in der Navigation noch einmal antippen: zurück zur Übersicht */
const _navGoCk = navGo;
navGo = function(k){ if(k === 'checkl' && view.tab === 'checkl' && view.ck){ view.ck.run = null; view.ck.ek = null; view.ck.tab = 'heute'; } return _navGoCk(k); };

/* ---------- Hilfe ---------- */
H('eigenkontrolle','Eigenkontrolle','Was Sie für sich selbst aufschreiben: Temperaturen, Reinigung, Frittieröl. Die App hilft beim Aufschreiben und Sammeln. Sie prüft nichts und ersetzt keine behördlich verlangten Aufzeichnungen.',1);
H('ek_grenzwert','Ihr Grenzwert','Die Temperatur, die eine Lieferung höchstens haben darf. Den Wert legt der Chef unter „Vorlagen“ fest. Liegt eine Lieferung darüber, fragt die App nach einer kurzen Notiz.',1);
H('ek_reinigung','Reinigungsplan','Aufgaben, die täglich, jede Woche oder jeden Monat anfallen. Sie erscheinen an ihrem Tag und bleiben stehen, bis jemand sie abhakt.');
H('ek_oel','Frittieröl','Hier tragen Sie ein, wann das Öl gewechselt oder geprüft wurde. Die App zeigt, wie lange der letzte Wechsel her ist, und erinnert nach dem Intervall, das der Chef festgelegt hat.');
H('ek_we','Wareneingang-Temperatur','Die Temperatur der Kühl- und Tiefkühlware bei der Lieferung. Sie tragen sie beim Einbuchen ein oder hier von Hand. Ein Tipp auf einen Eintrag korrigiert ihn, der alte Wert bleibt sichtbar.');
H('ek_mappe','Monatsmappe','Ein PDF für den Ordner: Temperaturen, Wareneingang, Frittieröl, Reinigungsplan und Checklisten eines Monats, dazu alle Abweichungen auf einem eigenen Blatt. Tage ohne Eintrag bleiben sichtbar leer.');
H('ek_einstellen','Eigenkontrolle einstellen','Der Chef legt hier die Aufgaben des Reinigungsplans, die Grenzwerte für den Wareneingang und das Intervall für den Ölwechsel fest.');
HELP_SEL.unshift(['#app .ek-l[data-id="clean"],#app [data-act="ekTick"]','ek_reinigung'], ['#app .ek-l[data-id="oil"],#app [data-act="ekOil"],#app .ek-stat','ek_oel'], ['#app .ek-l[data-id="we"],#app [data-act="ekWeNew"],#app .ek-r','ek_we'],
  ['#app .ek-tf,#app .ek-ok','ek_grenzwert'], ['#app .ek-tpls li','ek_einstellen'], ['#app .ek-dash,#app .ek-h','eigenkontrolle']);
HELP.ck_pdf.t = 'Monatsmappe als PDF'; HELP.ck_pdf.x = HELP.ek_mappe.x;
