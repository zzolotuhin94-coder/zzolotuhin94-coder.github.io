/* =====================================================================
   Rezept für Küche und Service (Paket D2)
   Dieselbe Rezeptur, drei Ansichten: Kalkulation (Chef, wie bisher) · Küche · Service.
   Küche:   Mengen für n Portionen, große Schrift, Basisrezepte zum Aufklappen, antippen zum Abhaken
            (wird nicht gespeichert), Bildschirm bleibt an. Keine Preise.
   Service: was am Teller ist, Allergene ausgeschrieben, Preis laut Karte, Service-Hinweis.
            Dazu die Service-Liste unter „Speisekarte“: alles, was heute auf der Karte steht.
   Gespeichert wird nur an der Rezeptur: c.svHide (Zeilen, die der Service nicht nennt) und c.svNote.
   ===================================================================== */
const RZ_MODES = [['kalk', 'Kalkulation'], ['kueche', 'Küche'], ['service', 'Service']];
const RZ_HASH = {kalk:'kalkulation', kueche:'kueche', service:'service'};
/* Grundzutaten, die der Service ohne eigene Auswahl des Chefs nicht aufzählt */
const SV_BASIC = /^(salz|pfeffer|wasser)(\s|,|$)/i;
const SV_NOTE_MAX = 300;

function rzDefault(){ return canEditAll() ? 'kalk' : 'kueche'; }
/* Ansicht einer Rezeptur. Basisrezepte stehen nicht auf der Karte: statt „Service“ gilt dort „Küche“. */
function rzMode(c){ let m = RZ_HASH[view.cv] ? view.cv : rzDefault(); if(c && c.type === 'semi' && m === 'service') m = 'kueche'; return m; }
function rzSwitch(c){ const semi = c && c.type === 'semi'; return `<div class="toolbar tabs rz-sw">${seg('rzView', rzMode(c), semi ? RZ_MODES.slice(0, 2) : RZ_MODES)}</div>`; }
function rzMigrate(d){
  if(!d || typeof d !== 'object' || !d.settings || d.settings.d2V) return d;
  (d.cards || []).forEach(c => { if(!c || typeof c !== 'object') return; if(typeof c.svNote !== 'string') c.svNote = '';
    if(!Array.isArray(c.svHide)) c.svHide = (c.items || []).filter(it => { const p = String(it.ref || '').startsWith('p:') ? (d.products || []).find(x => x.id === it.ref.slice(2)) : null; return p && SV_BASIC.test(p.name); }).map(it => it.ref); });
  d.settings.d2V = 1; return d;
}

/* ---------- Mengen ---------- */
function rzRound(q){ return q < 10 ? Math.round(q * 10) / 10 : Math.round(q); }
/* g → kg und ml → l ab 1000; Stück bleibt Stück; Getränke in cl (oder so, wie die Schankrezeptur geschrieben ist) */
function rzAmount(q, unit, opt){
  q = fin(+q); if(!(q > 0)) return '';
  if(unit === 'Stk') return num(Math.round(q * 100) / 100, 2) + ' Stk';
  const r = rzRound(q); const big = v => num(Math.round(v / 10) / 100, 2);
  if(unit === 'ml'){
    if(opt && opt.drink){ if(r >= 1000 || (opt.u === 'l' && r >= 100)) return big(r) + ' l'; if(opt.u === 'ml' || r < 10) return num(r, 1) + ' ml'; return num(Math.round(r) / 10, 1) + ' cl'; }
    return r >= 1000 ? big(r) + ' l' : num(r, 1) + ' ml';
  }
  return r >= 1000 ? big(r) + ' kg' : num(r, 1) + ' g';
}
/* Zeilen einer Rezeptur für den Faktor f (Portionen, Gläser oder Chargen) */
function rzLines(c, f){
  const t = totals(c);
  return c.items.map((it, i) => { const l = t.lines[i]; const r = refObj(it.ref); if(!r) return null; const q = (+it.qty || 0) * f; const liquid = l.unit === 'ml';
    const frac = l.unit === 'Stk' && Math.abs(q - Math.round(q)) > 1e-6 && +r.o.pieceG > 0;
    return {i, ref:it.ref, name:r.o.name, sub:r.t === 'c' ? r.o : null, q, unit:l.unit, txt:rzAmount(q, l.unit, c.drink && liquid ? {drink:true, u:drinkU(it)} : null), approx:frac ? 'ca. ' + rzAmount(q * r.o.pieceG, 'g') : ''}; }).filter(Boolean);
}
function rzYield(c){ return +c.yieldG > 0 ? +c.yieldG : c.type === 'semi' ? totals(c).out : 0; }
function rzWord(c, n){ const one = Math.abs(n - 1) < 1e-9; return c.type === 'semi' ? (one ? 'Charge' : 'Chargen') : c.drink ? (one ? 'Glas' : 'Gläser') : (one ? 'Portion' : 'Portionen'); }
function rzNTxt(n){ return num(Math.round(n * 100) / 100, 2); }
/* „für 5 Portionen“ · „für 750 g (0,45 Chargen)“ */
function rzForTxt(c, n){ const y = rzYield(c);
  if(c.type === 'semi') return y > 0 ? `für ${rzAmount(y * n, 'g')}${Math.abs(n - 1) < 1e-9 ? ' (1 Charge)' : ` (${rzNTxt(n)} ${rzWord(c, n)})`}` : `für ${rzNTxt(n)} ${rzWord(c, n)}`;
  return `für ${rzNTxt(n)} ${rzWord(c, n)}`; }
function rzState(c){ if(!view.rz || view.rz.id !== c.id) view.rz = {id:c.id, n:1, stack:[]}; if(!(view.rz.n > 0)) view.rz.n = 1; if(!Array.isArray(view.rz.stack)) view.rz.stack = []; return view.rz; }
const RZ_TICKS = new Map();
function rzTicks(id){ if(!RZ_TICKS.has(id)) RZ_TICKS.set(id, new Set()); return RZ_TICKS.get(id); }

/* ---------- Küche ---------- */
function rzAlgHtml(c){
  const ai = algInfo({card:c.id}); const names = ai.letters.map(a => `<span><b>${esc(a)}</b> ${esc(ALG[a] || a)}</span>`).join('');
  if(ai.state === 'open') return `<p class="rz-alg open"><b class="rz-al">Allergene</b>${names}<em>Angabe unvollständig${ai.open.length ? ` (${ai.open.slice(0, 4).map(p => esc(p.name)).join(', ')}${ai.open.length > 4 ? ' …' : ''})` : ''}</em></p>`;
  return `<p class="rz-alg"><b class="rz-al">Allergene</b>${names || '<span>keine</span>'}</p>`;
}
function rzStepperHtml(c, st){
  const semi = c.type === 'semi', y = rzYield(c); const chips = semi ? [[0.5, '½'], [1, '1'], [2, '2'], [3, '3']] : [[1, '×1'], [2, '×2'], [5, '×5'], [10, '×10']];
  const free = semi && y > 0 ? `<label class="rz-free">ergibt<input id="rzY" class="num-in" type="text" inputmode="decimal" data-num="self" data-rzy="1" value="${numIn(Math.round(y * st.n * 10) / 10)}" aria-label="Menge in Gramm"><span>g</span></label>`
    : `<label class="rz-free"><input id="rzN" class="num-in" type="text" inputmode="decimal" data-num="self" data-rzn="1" value="${numIn(Math.round(st.n * 100) / 100)}" aria-label="Anzahl ${semi ? 'Chargen' : c.drink ? 'Gläser' : 'Portionen'}"><span>${rzWord(c, st.n)}</span></label>`;
  return `<div class="rz-n" role="group" aria-label="${semi ? 'Menge' : c.drink ? 'Gläser' : 'Portionen'}"><span class="rz-chips">${chips.map(([k, l]) => `<button type="button" class="${Math.abs(st.n - k) < 1e-9 ? 'on' : ''}" data-act="rzN" data-id="${k}" aria-pressed="${Math.abs(st.n - k) < 1e-9}">${l}</button>`).join('')}${semi ? '<small>Chargen</small>' : ''}</span>${free}</div>`;
}
function rzKitchenHtml(c){
  const st = rzState(c); const lines = rzLines(c, st.n); const ticks = rzTicks(c.id); const steps = (c.steps || []).filter(s => (s.t && s.t.trim()) || (s.img && IMG[s.img]));
  const up = st.stack.length ? C(st.stack[st.stack.length - 1].id) : null;
  const ing = lines.map(l => `<li class="${ticks.has('z' + l.i) ? 'done' : ''}"><button type="button" class="rz-i" data-act="rzTick" data-id="z${l.i}" aria-pressed="${ticks.has('z' + l.i)}"><span class="rz-q">${l.txt || '–'}${l.approx ? `<small>${l.approx}</small>` : ''}</span><span class="rz-t">${esc(l.name)}${l.sub ? '<small>Basisrezept</small>' : ''}</span></button>${l.sub ? `<button type="button" class="rz-open" data-act="rzOpen" data-id="${l.i}" aria-label="Basisrezept ${esc(l.name)} öffnen">Rezept${ico('arrow', 'flip')}</button>` : ''}</li>`).join('');
  const stp = steps.map((s, i) => `<li class="${ticks.has('s' + i) ? 'done' : ''}"><button type="button" class="rz-step" data-act="rzTick" data-id="s${i}" aria-pressed="${ticks.has('s' + i)}"><span class="rz-sn">${i + 1}</span><span class="rz-st">${esc(s.t)}</span></button>${s.img && IMG[s.img] ? `<img class="rz-sp" src="${IMG[s.img]}" alt="Schritt ${i + 1}" loading="lazy">` : ''}</li>`).join('');
  const y = rzYield(c); const kind = c.type === 'semi' ? 'Basisrezept' : c.drink ? 'Getränk' : 'Gericht';
  const per = c.type === 'semi' ? (y > 0 ? `1 Charge ergibt ${rzAmount(y, 'g')}` : '') : c.drink ? (y > 0 ? `1 Glas · ${volTxt(y)}` : '') : (y > 0 ? `1 Portion · ${rzAmount(y, 'g')}` : '');
  return `${up ? `<button type="button" class="back" data-act="rzUp">${ico('arrow')}Zurück zu ${esc(up.name)}</button>` : `<button type="button" class="back" data-act="backCards">${ico('arrow')}Alle Rezepturen</button>`}
  <div class="rz-bar">${rzSwitch(c)}<button type="button" class="btn" data-pdf="printKueche" data-id="${c.id}">${ico('download')}Als PDF</button></div>
  <article class="rz rz-k">
    <header class="rz-h">${c.img && IMG[c.img] ? `<img class="rz-ph" src="${IMG[c.img]}" alt="${esc(c.name)}">` : ''}<div><div class="eyebrow">${kind}${c.category ? ' · ' + esc(c.category) : ''}${per ? ' · ' + per : ''}</div><h1>${esc(c.name)}</h1></div></header>
    ${rzStepperHtml(c, st)}
    <section class="rz-sec"><h2>${c.drink ? 'Ins Glas' : 'Zutaten'}<span>${esc(rzForTxt(c, st.n))}</span></h2>${ing ? `<ul class="rz-ing">${ing}</ul>` : '<p class="rz-none">Für diese Rezeptur sind noch keine Zutaten eingetragen.</p>'}</section>
    ${stp ? `<section class="rz-sec"><h2>Zubereitung</h2><ol class="rz-steps">${stp}</ol></section>` : c.drink ? '' : '<section class="rz-sec"><h2>Zubereitung</h2><p class="rz-none">Noch keine Schritte eingetragen.</p></section>'}
    ${rzAlgHtml(c)}
  </article>`;
}
/* Basisrezept aus einer Zeile öffnen: genau so viel, wie das Gericht gerade braucht */
function rzOpenSub(i){
  const c = C(view.card); if(!c) return; const st = rzState(c); const l = rzLines(c, st.n).find(x => x.i === +i); if(!l || !l.sub) return;
  const y = rzYield(l.sub); const n = y > 0 && l.q > 0 ? l.q / y : 1;
  view.rz = {id:l.sub.id, n, stack:st.stack.concat([{id:c.id, n:st.n}])}; view.card = l.sub.id; render(); hashSync(); window.scrollTo({top:0});
}
function rzUp(){ const st = view.rz; const p = st && st.stack && st.stack[st.stack.length - 1]; if(!p || !C(p.id)){ go('cards'); return; } view.rz = {id:p.id, n:p.n, stack:st.stack.slice(0, -1)}; view.card = p.id; render(); hashSync(); window.scrollTo({top:0}); }
function rzSetN(n){ const c = C(view.card); if(!c) return; if(!(n > 0) || n > 9999){ toast('Bitte eine Zahl größer als 0 eingeben, zum Beispiel 4 oder 2,5.'); render(); return; } rzState(c).n = n; render(); }

/* Bildschirm bleibt an, solange die Küchen-Ansicht offen ist. Lehnt das Gerät ab, geht alles andere trotzdem. */
let RZ_WL = null, RZ_WL_BUSY = false;
function rzKitchenOpen(){ const c = view.tab === 'cards' && view.card ? C(view.card) : null; return !!c && rzMode(c) === 'kueche'; }
async function rzWake(on){
  try {
    if(!on){ if(RZ_WL){ const l = RZ_WL; RZ_WL = null; await l.release(); } return; }
    if(RZ_WL || RZ_WL_BUSY || !navigator.wakeLock || document.visibilityState !== 'visible') return;
    RZ_WL_BUSY = true; const l = await navigator.wakeLock.request('screen'); RZ_WL = l;
    if(l && l.addEventListener) l.addEventListener('release', () => { if(RZ_WL === l) RZ_WL = null; });
    if(!rzKitchenOpen()){ RZ_WL = null; await l.release(); }
  } catch(e){ /* nicht erlaubt oder nicht vorhanden */ } finally { if(on) RZ_WL_BUSY = false; }
}
function rzAfter(){ const on = rzKitchenOpen(); if(!on){ if(RZ_TICKS.size) RZ_TICKS.clear(); if(view.rz && !(view.tab === 'cards' && view.card)) view.rz = null; } rzWake(on); }
document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible' && rzKitchenOpen()) rzWake(true); });

/* ---------- Küchen-Rezept als PDF: Mengen für die gewählte Zahl, ohne Preise ---------- */
function rzPrintBlock(c, n, depth, seen){
  const lines = rzLines(c, n); const steps = (c.steps || []).filter(s => s.t && s.t.trim());
  const ai = algInfo({card:c.id}); const alg = (ai.letters.map(a => `${a} ${ALG[a] || ''}`).join(', ') || (ai.state === 'open' ? '' : 'keine')) + (ai.state === 'open' ? (ai.letters.length ? ' · ' : '') + 'Angabe unvollständig' : '');
  let h = `<div class="rk-b">${depth ? `<h2 class="rk-sub">Basisrezept: ${esc(c.name)}</h2>` : `<h1>${esc(c.name)}</h1>`}
    <p class="rk-for">${depth ? '' : `${c.type === 'semi' ? 'Basisrezept' : c.drink ? 'Getränk' : 'Gericht'}${c.category ? ' · ' + esc(c.category) : ''} · `}${esc(rzForTxt(c, n))}</p>
    ${!depth && c.img && IMG[c.img] ? `<img class="pr-ph" src="${IMG[c.img]}" alt="">` : ''}
    <table class="rk-t"><thead><tr><th class="r">Menge</th><th>Zutat</th></tr></thead><tbody>${lines.map(l => `<tr><td class="r">${l.txt || '–'}${l.approx ? ` (${l.approx})` : ''}</td><td>${esc(l.name)}${l.sub ? ' (Basisrezept)' : ''}</td></tr>`).join('')}</tbody></table>
    ${steps.length ? `<h3 class="pr-steps-h">Zubereitung</h3><ol class="pr-steps">${steps.map(s => `<li>${esc(s.t)}</li>`).join('')}</ol>` : ''}
    <p class="rk-alg"><b>Allergene:</b> ${esc(alg)}</p></div>`;
  if(depth < 3) lines.forEach(l => { if(!l.sub || seen.has(l.sub.id)) return; seen.add(l.sub.id); const y = rzYield(l.sub); h += rzPrintBlock(l.sub, y > 0 && l.q > 0 ? l.q / y : 1, depth + 1, seen); });
  return h;
}
function rzPrintHtml(c, n){ return `<div class="rz-print"><div class="meta"><span>${esc(S.settings.name)}</span><span>Rezept für die Küche · ${fmtDate(new Date().toISOString())}</span></div>${rzPrintBlock(c, n, 0, new Set([c.id]))}</div>`; }
function printKitchen(id){
  const c = C(id); if(!c) return; const n = view.rz && view.rz.id === c.id && view.rz.n > 0 ? view.rz.n : 1;
  const el = $('#print'); el.classList.remove('hs-print', 'land'); el.innerHTML = rzPrintHtml(c, n); document.body.classList.remove('print-menu', 'print-report');
  PDF_NAME = pdfFileName('Kueche-' + c.name.replace(/[„“”‚‘’«»]/g, '')); window.print();
}

/* ---------- Service ---------- */
function svHidden(c){ return Array.isArray(c.svHide) ? c.svHide : (c.items || []).filter(it => { const r = refObj(it.ref); return r && r.t === 'p' && SV_BASIC.test(r.o.name); }).map(it => it.ref); }
/* Zeilen der Rezeptur ohne Doppelte, in der Reihenfolge der Rezeptur */
function svRefs(c){ const seen = new Set(); return (c.items || []).map(it => { const r = refObj(it.ref); if(!r || seen.has(it.ref)) return null; seen.add(it.ref); return {ref:it.ref, name:r.o.name}; }).filter(Boolean); }
function svParts(c){ const hide = new Set(svHidden(c)); return svRefs(c).filter(x => !hide.has(x.ref)).map(x => x.name); }
function svVeg(m){ return m && m.veg === 'vg' ? 'vegan' : m && m.veg === 'v' ? 'vegetarisch' : ''; }
function svAlgHtml(ai, m){
  const list = ai.letters.length ? `<ul class="sv-al">${ai.letters.map(a => `<li><b>${esc(a)}</b>${esc(ALG[a] || a)}</li>`).join('')}</ul>` : '';
  if(ai.state === 'open') return `<p class="sv-ask">Angabe unvollständig – bitte in der Küche nachfragen.</p>${list ? `<p class="sv-sure">Sicher enthalten:</p>${list}` : ''}`;
  if(ai.state === 'none') return `<p class="sv-none">${ai.src === 'recipe' ? 'Keine Allergene. Alle Zutaten sind geprüft.' : 'Keine Allergene' + (m && algStampText(m) ? ', ' + esc(algStampText(m)) : '') + '.'}</p>`;
  return list;
}
/* Kurzform für eine Zeile: Buchstaben, „keine“ oder „nachfragen“ */
function svAlgShort(ai){ return ai.state === 'open' ? '<span class="sv-q">nachfragen</span>' : ai.letters.length ? `<span class="sv-ls" title="${esc(ai.letters.map(a => ALG[a] || a).join(', '))}">${ai.letters.map(esc).join(' ')}</span>` : '<span class="sv-ls none">keine</span>'; }
/* der Block, den der Service liest (Rezeptseite und aufgeklappte Zeile der Liste) */
function svBodyHtml(m, c){
  const ai = algInfo(m || {card:c.id}); const parts = c ? svParts(c) : []; const note = c && c.svNote ? String(c.svNote).trim() : '';
  return `${parts.length ? `<section class="sv-b"><h2>${c.drink ? 'Im Glas' : 'Am Teller'}</h2><p class="sv-parts">${parts.map(esc).join(', ')}</p></section>` : ''}
    <section class="sv-b"><h2>Allergene</h2>${svAlgHtml(ai, m)}</section>
    ${note ? `<section class="sv-b"><h2>Service-Hinweis</h2><p class="sv-note">${esc(note)}</p></section>` : ''}`;
}
function svCardHtml(c){
  const menus = menuSorted().filter(m => m.card === c.id); const m0 = menus[0] || null; const veg = svVeg(m0);
  const price = m => `<li><span>${menus.length > 1 || dishLabel(m) !== c.name ? esc(dishLabel(m)) : 'Preis'}${c.drink && menuVol(m) && !m.vlabel ? ' · ' + volTxt(menuVol(m)) : ''}</span><b class="mono">${eur(m.price)}</b></li>`;
  return `<button type="button" class="back" data-act="backCards">${ico('arrow')}Alle Rezepturen</button>
  <div class="rz-bar">${rzSwitch(c)}${canEditAll() ? `<button type="button" class="btn" data-act="svEdit" data-id="${c.id}">${ico('edit')}Anpassen</button>` : ''}</div>
  <article class="rz rz-s">
    <header class="rz-h">${c.img && IMG[c.img] ? `<img class="rz-ph" src="${IMG[c.img]}" alt="${esc(c.name)}">` : ''}<div><div class="eyebrow">${m0 ? esc(m0.section) : 'Nicht auf der Karte'}${veg ? ' · ' + veg : ''}${c.drink && +c.yieldG > 0 ? ' · ' + volTxt(+c.yieldG) : ''}</div><h1>${esc(c.name)}</h1>${m0 && m0.desc ? `<p class="sv-desc">${esc(m0.desc)}</p>` : ''}</div></header>
    ${menus.length ? `<ul class="sv-prices">${menus.map(price).join('')}</ul>` : ''}
    ${svBodyHtml(m0 ? m0 : null, c)}
  </article>`;
}
function svEditDlg(id){
  const c = C(id); if(!c || !roGate()) return; const refs = svRefs(c); const hide = new Set(svHidden(c));
  openDialog('Für den Service · ' + c.name, `<fieldset class="sv-ed"><legend>${c.drink ? 'Im Glas' : 'Am Teller'}: Was soll der Service nennen?</legend>
      ${refs.length ? refs.map(x => `<label class="tog"><input type="checkbox" name="show" value="${esc(x.ref)}" ${hide.has(x.ref) ? '' : 'checked'}><span></span>${esc(x.name)}</label>`).join('') : '<p class="hint" style="margin:0">Die Rezeptur hat noch keine Zutaten.</p>'}</fieldset>
    <label class="f">Service-Hinweis<textarea name="note" rows="3" maxlength="${SV_NOTE_MAX}" placeholder="z. B. Garstufe wählbar · Beilage tauschbar · dauert 20 Minuten">${esc(c.svNote || '')}</textarea></label>
    <p class="hint">Allergene kommen immer aus der ganzen Rezeptur, auch von Zeilen, die hier ausgeblendet sind.</p>`,
    fd => { const show = new Set(fd.getAll('show')); c.svHide = refs.filter(x => !show.has(x.ref)).map(x => x.ref); c.svNote = String(fd.get('note') || '').trim().slice(0, SV_NOTE_MAX); });
}

/* ---------- Service-Liste: alles, was heute auf der Karte steht ---------- */
function svView(){ return view.sv || (view.sv = {q:'', f:'', open:null}); }
function svRows(){
  const date = todayStr(), k = seasonFor(date) || 'winter'; const items = guestItems(k, date); const rows = [];
  for(const sec of secList()){ items.filter(m => m.section === sec).forEach(m => rows.push({id:m.id, sec, m, name:dishLabel(m), c:m.card ? C(m.card) : null})); }
  specialsFor(date).forEach(sp => (sp.items || []).forEach((it, i) => rows.push({id:sp.id + ':' + i, sec:'Aktion · ' + sp.name, m:it, name:it.name, c:it.card ? C(it.card) : null})));
  rows.forEach(r => { r.ai = algInfo(r.m); r.parts = r.c ? svParts(r.c) : []; });
  return {rows, date};
}
/* „ohne X“: nur Gerichte mit vollständiger Angabe, die X nicht enthalten. Unvollständige fehlen und werden gezählt. */
function svFilter(rows, a){
  if(!a || !ALG[a]) return {list:rows, left:0};
  return {list:rows.filter(r => r.ai.state !== 'open' && !r.ai.letters.includes(a)), left:rows.filter(r => r.ai.state === 'open' && !r.ai.letters.includes(a)).length};
}
function svRowHtml(r, open){
  const m = r.m, c = r.c; const veg = svVeg(m); const vol = isDrinkEntry(m) && menuVol(m) && !m.vlabel ? volTxt(menuVol(m)) : '';
  const sub = [m.desc, veg, vol].filter(Boolean).map(esc).join(' · ');
  return `<li class="sv-r ${open ? 'open' : ''}"><button type="button" class="sv-rb" data-act="svOpen" data-id="${esc(r.id)}" aria-expanded="${open}"><span class="sv-n"><b>${esc(r.name)}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="sv-a">${svAlgShort(r.ai)}</span><span class="sv-p mono">${+m.price > 0 ? eur(m.price) : ''}</span></button>
    ${open ? `<div class="sv-d">${svBodyHtml(m, c)}${c ? `<button type="button" class="link" data-act="svKueche" data-id="${c.id}">Rezept für die Küche</button>` : ''}</div>` : ''}</li>`;
}
function renderService(){
  const v = svView(); const {rows, date} = svRows(); const q = v.q.trim().toLowerCase();
  const f = svFilter(rows, v.f); const list = f.list.filter(r => !q || (r.name + ' ' + (r.m.desc || '') + ' ' + r.sec + ' ' + r.parts.join(' ')).toLowerCase().includes(q));
  const dLong = dParse(date).toLocaleDateString('de-AT', {weekday:'long', day:'numeric', month:'long'});
  const fact = v.f ? `Ohne ${esc(ALG[v.f])}: <b>${list.length}</b> ${list.length === 1 ? 'Gericht' : 'Gerichte'}${q ? ' zur Suche' : ''}.${f.left ? ` ${f.left === 1 ? '<b>1</b> weiteres fehlt' : `<b>${f.left}</b> weitere fehlen`} in dieser Liste, weil die Allergenangabe unvollständig ist: bitte in der Küche nachfragen.` : ''}`
    : `Karte von heute, ${esc(dLong)} · ${rows.length} ${rows.length === 1 ? 'Eintrag' : 'Einträge'}`;
  let body = '', sec = null;
  list.forEach(r => { if(r.sec !== sec){ sec = r.sec; body += `<li class="sv-sec">${esc(sec)}</li>`; } body += svRowHtml(r, v.open === r.id); });
  return `<div class="toolbar sv-tools"><label class="search">${ico('search')}<input id="svq" type="search" placeholder="Gericht oder Zutat suchen" value="${esc(v.q)}" autocomplete="off"></label>
      <label class="sv-f"><span>Allergen</span><select data-svf="1" aria-label="Allergen-Filter"><option value="">alle zeigen</option>${Object.entries(ALG).map(([k, n]) => `<option value="${k}" ${v.f === k ? 'selected' : ''}>ohne ${esc(n)}</option>`).join('')}</select></label></div>
    <p class="fact sv-fact">${fact}</p>
    ${list.length ? `<ul class="sv-list">${body}</ul>` : `<section class="panel empty">${rows.length ? 'Kein Gericht passt.' : 'Heute steht nichts auf der Karte.'}</section>`}`;
}

/* ---------- Bedienung ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const a = el.dataset.act, id = el.dataset.id;
  if(!/^(rz|sv)[A-Z]/.test(a) || (document.body.classList.contains('gd-help') && a !== 'rzView')) return;
  switch(a){
    case 'rzView': view.cv = RZ_HASH[id] ? id : null; render(); hashSync(); break;
    case 'rzN': rzSetN(+id); break;
    case 'rzTick': { const c = C(view.card); if(!c) break; const t = rzTicks(c.id); const on = !t.has(id); if(on) t.add(id); else t.delete(id); el.closest('li').classList.toggle('done', on); el.setAttribute('aria-pressed', on); break; }
    case 'rzOpen': rzOpenSub(id); break;
    case 'rzUp': rzUp(); break;
    case 'svEdit': svEditDlg(id); break;
    case 'svOpen': { const v = svView(); v.open = v.open === id ? null : id; render(); break; }
    case 'svKueche': view.cv = 'kueche'; go('cards', id); break;
    case 'svGo': view.mtab = 'service'; go('menu'); break;
  }
});
document.addEventListener('change', e => { const t = e.target; if(!t.dataset) return;
  if(t.dataset.rzn){ rzSetN(numParse(t.value)); return; }
  if(t.dataset.rzy){ const c = C(view.card); const y = c ? rzYield(c) : 0; const v = numParse(t.value); rzSetN(y > 0 ? v / y : NaN); return; }
  if(t.dataset.svf){ const v = svView(); v.f = ALG[t.value] ? t.value : ''; v.open = null; render(); } });
document.addEventListener('keydown', e => { const t = e.target; if(e.key === 'Enter' && t.matches && t.matches('#rzN,#rzY')){ e.preventDefault(); t.blur(); } });
document.addEventListener('input', e => { const t = e.target; if(t.id !== 'svq') return; const v = svView(); v.q = t.value; v.open = null; const pos = t.selectionStart; render(); const n = $('#svq'); if(n){ n.focus(); try { n.setSelectionRange(pos, pos); } catch(err){} } });

/* ---------- Hilfe ---------- */
H('rz_ansicht','Kalkulation, Küche, Service','Dieselbe Rezeptur in drei Ansichten. Kalkulation: Preise und Wareneinsatz, hier ändert der Chef. Küche: Mengen und Schritte zum Kochen. Service: was am Teller ist und welche Allergene drin sind.');
H('rz_portionen','Portionen','Tippen Sie auf ×2, ×5 oder ×10, oder tragen Sie eine Zahl ein. Alle Mengen rechnen sofort mit. Bei einem Basisrezept wählen Sie Chargen oder die Menge in Gramm.');
H('rz_haken','Antippen zum Abhaken','Ein Tipp auf eine Zutat oder einen Schritt streicht sie durch, damit Sie wissen, wo Sie sind. Das wird nicht gespeichert.');
H('rz_basis','Basisrezept öffnen','Zeigt das Basisrezept mit genau der Menge, die das Gericht gerade braucht. Oben geht es zurück zum Gericht.');
H('rz_pdf','Rezept als PDF','Das Rezept für die Küche mit den Mengen für die gewählte Zahl, ohne Preise. Basisrezepte stehen darunter.');
H('sv_liste','Service-Liste','Alles, was heute auf der Karte steht. Ein Tipp auf ein Gericht zeigt, was am Teller ist und welche Allergene drin sind.');
H('sv_filter','Ohne ein Allergen','Zeigt nur Gerichte, die dieses Allergen sicher nicht enthalten. Gerichte mit unvollständiger Angabe fehlen in der Liste. Wie viele das sind, steht darüber.');
H('sv_anpassen','Für den Service anpassen','Der Chef wählt, welche Zutaten der Service nennt, und schreibt einen kurzen Hinweis dazu, zum Beispiel zur Garstufe.');
HELP_SEL.unshift(['#app .rz-sw','rz_ansicht'], ['#app .rz-n','rz_portionen'], ['#app .rz-i,#app .rz-step','rz_haken'], ['#app .rz-open','rz_basis'], ['#app [data-pdf="printKueche"]','rz_pdf'],
  ['#app .sv-f','sv_filter'], ['#app .sv-rb,#app [data-act="svGo"]','sv_liste'], ['#app [data-act="svEdit"]','sv_anpassen'], ['#app .rz-alg,#app .sv-b','allergene']);
