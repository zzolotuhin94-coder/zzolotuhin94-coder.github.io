/* =====================================================================
   Saisonkarten & Aktionen (Spezialitäten für 1–2 Tage)
   ===================================================================== */
const SEASONS = [['winter','Winter'],['fruehling','Frühling'],['sommer','Sommer'],['herbst','Herbst']];
const SEASON_RANGE = {winter:['12-01','04-15'], fruehling:['04-16','06-14'], sommer:['06-15','09-15'], herbst:['09-16','11-30']};
const ORN = {
  schnee:'<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M12 2l-2.2 2.2M12 2l2.2 2.2M12 22l-2.2-2.2M12 22l2.2-2.2M3.3 7l3 .8M3.3 7l.8 3M20.7 17l-3-.8M20.7 17l-.8-3M3.3 17l.8-3M3.3 17l3-.8M20.7 7l-.8 3M20.7 7l-3 .8"/>',
  bluete:'<circle cx="12" cy="6.5" r="3.2"/><circle cx="17.2" cy="10.3" r="3.2"/><circle cx="15.2" cy="16.4" r="3.2"/><circle cx="8.8" cy="16.4" r="3.2"/><circle cx="6.8" cy="10.3" r="3.2"/><circle cx="12" cy="12" r="1.6"/>',
  sonne:'<circle cx="12" cy="12" r="4.2"/><path d="M12 1.5v3.5M12 19v3.5M1.5 12H5M19 12h3.5M4.6 4.6l2.4 2.4M17 17l2.4 2.4M4.6 19.4L7 17M17 7l2.4-2.4"/>',
  blatt:'<path d="M12 22V9"/><path d="M12 9c0-4 3-7 8-7 0 5-3 8-8 8M12 13c0-3.5-3-6-8-6 0 4.5 3 7 8 7"/>',
  berg:'<path d="M1.5 20l7-12 4 6 3-4 7 10z"/><path d="M6.8 11l1.7-3 2 3"/>',
  keins:'',
};
const ORN_LABEL = {schnee:'Schneeflocke', bluete:'Blüte', sonne:'Sonne', blatt:'Blatt', berg:'Berge', keins:'Ohne'};
// Saison-Themen (Paletten, Schriften, Ornament) – vom Design-Team
const THEMES = {
  winter:   {theme:'Pulverschnee', layout:'alpin',     pal:{paper:'#13233a', ink:'#eef3f7', accent:'#9fc7e8', muted:'#93a6b8', rule:'#2e4562'}, fd:'Cormorant Garamond', fb:'Figtree', orn:'schnee', title:'Winterkarte', subtitle:'Nach dem Skitag · direkt an der Piste'},
  fruehling:{theme:'Almrausch',    layout:'klassisch', pal:{paper:'#f7f5ee', ink:'#23302a', accent:'#c2557a', muted:'#6f7a70', rule:'#d9dccf'}, fd:'Cormorant Garamond', fb:'Figtree', orn:'bluete', title:'Frühlingskarte', subtitle:'Erste Kräuter, frischer Bärlauch'},
  sommer:   {theme:'Bergsommer',   layout:'modern',    pal:{paper:'#fffdf6', ink:'#1c2b2a', accent:'#e0892b', muted:'#677370', rule:'#eadfc8'}, fd:'Bricolage Grotesque', fb:'Figtree', orn:'sonne', title:'Sommerkarte', subtitle:'Terrasse, Bergluft, Marillenzeit'},
  herbst:   {theme:'Almabtrieb',   layout:'alpin',     pal:{paper:'#2a1d16', ink:'#f3e6d6', accent:'#d98b3a', muted:'#b59f88', rule:'#4a3527'}, fd:'Cormorant Garamond', fb:'Figtree', orn:'blatt', title:'Herbstkarte', subtitle:'Wild, Schwammerl, Kastanien'},
};
const FONTPAIRS = [['Cormorant Garamond','Figtree','Elegant'],['Bricolage Grotesque','Figtree','Modern'],['Playfair Display','Source Sans 3','Klassisch'],['Fraunces','Figtree','Weich'],['DM Serif Display','DM Sans','Kontrast']];
const SPECIAL_STYLES = [['tafel','Kreidetafel'],['saison','Wie Saisonkarte'],['festlich','Festlich']];

function seasonDefaults(k){ const t = THEMES[k]; return {from:SEASON_RANGE[k][0], to:SEASON_RANGE[k][1], layout:t.layout, pal:{...t.pal}, fd:t.fd, fb:t.fb, orn:t.orn, title:t.title, subtitle:t.subtitle, footer:'Alle Preise in Euro inkl. MwSt. Bitte informieren Sie uns über Allergien und Unverträglichkeiten.', photos:true, desc:true, allergens:true, cover:''}; }
const todayStr = () => { const d = new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10); };
function addDays(s, n){ const d = new Date(s+'T12:00:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function inRangeMD(md, from, to){ return from <= to ? (md >= from && md <= to) : (md >= from || md <= to); }
function seasonFor(dateStr){ const md = dateStr.slice(5); const ss = S.settings.seasons; return SEASONS.map(x=>x[0]).find(k => inRangeMD(md, ss[k].from, ss[k].to)) || null; }
function specialsFor(dateStr){ return S.specials.filter(sp => sp.from <= dateStr && dateStr <= (sp.to||sp.from)); }
function inSeason(m, k){ return !m.seasons || !m.seasons.length || !k || m.seasons.includes(k); }
function seasonName(k){ return (SEASONS.find(x=>x[0]===k)||[,'Ganzjährig'])[1]; }
function spDays(sp){ return Math.round((new Date((sp.to||sp.from)+'T12:00:00') - new Date(sp.from+'T12:00:00'))/864e5) + 1; }
function spStatus(sp){ const t = todayStr(); if((sp.to||sp.from) < t) return ['past','vorbei']; if(sp.from <= t) return ['live','läuft heute']; const n = Math.round((new Date(sp.from+'T12:00:00') - new Date(t+'T12:00:00'))/864e5); return ['soon', n===1 ? 'morgen' : `in ${n} Tagen`]; }
function fmtShort(s){ const [y,m,d] = s.split('-'); return `${d}.${m}.`; }
function fmtRange(sp){ return sp.to && sp.to !== sp.from ? `${fmtShort(sp.from)}–${fmtShort(sp.to)}${sp.to.slice(0,4)}` : `${fmtShort(sp.from)}${sp.from.slice(0,4)}`; }
function mdLabel(md){ const [m,d] = md.split('-'); return `${d}.${m}.`; }
function fontStack(f, serif){ return `"${f}",${serif?'Georgia,serif':'system-ui,sans-serif'}`; }

function seasonSeed(d){
  d.settings.seasons = {}; SEASONS.forEach(([k]) => d.settings.seasons[k] = seasonDefaults(k));
  const tag = {'Zillertaler Käsefondue':['winter','herbst'], '„Dippin me softly!“':['winter'], '„Marillenzeit = Knödelzeit“':['sommer'], '„Endless Summer“':['fruehling','sommer'], 'DAHUAM.202 Sommersalat':['sommer'],
    '„Schwammerlsuche“':['sommer','herbst'], 'Eierschwammerl Carbonara':['sommer','herbst'], 'Schwammerlrösti':['sommer','herbst'], '„Wilde Bolo“':['herbst','winter'], '„Alpen Ceviche“':['fruehling','sommer'], 'Kokos-Curry-Suppe':['winter','herbst']};
  d.menu.forEach(m => m.seasons = tag[m.name] || []);
  const add = (section, name, desc, price, seasons, veg='') => d.menu.push({id:uid('m'), section, name, desc, price, card:'', img:'', veg, top:false, hidden:false, seasons, order: d.menu.filter(x=>x.section===section).length});
  SEASON_DEMO.forEach(x => add(...x));
  const y = new Date().getFullYear(); const t = todayStr();
  const mk = (name, from, to, mode, style, note, items) => ({id:uid('sp'), name, from, to, mode, style, note, items:items.map(([n,ds,p,veg])=>({name:n, desc:ds, price:p, veg:veg||'', card:''}))});
  d.specials = SPECIAL_DEMO(y, t).map(a => mk(...a));
}
function seasonMigrate(d){
  if(!d.settings.seasons){ d.settings.seasons = {}; SEASONS.forEach(([k]) => d.settings.seasons[k] = seasonDefaults(k)); const g = d.settings.guest; if(g){ SEASONS.forEach(([k]) => Object.assign(d.settings.seasons[k], {photos:g.photos, desc:g.desc, allergens:g.allergens, footer:g.footer||d.settings.seasons[k].footer})); } }
  d.menu.forEach(m => { if(!m.seasons) m.seasons = []; });
  if(!d.specials) d.specials = [];
  return d;
}

/* ---------- Gästekarte für Saison + Datum ---------- */

/* ---------- Gästekarte: Werkzeuge ---------- */

/* ---------- Saison & Aktionen ---------- */
function dayOfYear(md){ const [m,d] = md.split('-').map(Number); return Math.round((Date.UTC(2025,m-1,d) - Date.UTC(2025,0,1))/864e5); }
function renderPlan(){
  const ss = S.settings.seasons, y = new Date().getFullYear(), t = todayStr();
  const months = ['Jän','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
  const bars = SEASONS.map(([k,l]) => { const s = ss[k], a = dayOfYear(s.from), b = dayOfYear(s.to); const segs = a <= b ? [[a,b]] : [[a,364],[0,b]];
    return segs.map(([x,z]) => `<button type="button" class="tl-bar" style="left:${(x/365*100).toFixed(2)}%;width:${((z-x+1)/365*100).toFixed(2)}%;--c:${s.pal.accent};--p:${s.pal.paper}" data-act="editSeason" data-id="${k}" title="${esc(s.title)} ${mdLabel(s.from)}–${mdLabel(s.to)}"><span>${l}</span></button>`).join(''); }).join('');
  // Marker in Spuren legen, damit sich Beschriftungen nicht überdecken; am rechten Rand nach links schreiben
  const lanes = []; const LW = 15;
  const pinList = S.specials.filter(sp => sp.from.slice(0,4) == y || (sp.to||'').slice(0,4) == y).map(sp => ({sp, x: (sp.from.slice(0,4) == y ? dayOfYear(sp.from.slice(5)) : 0)/365*100})).sort((a,b) => a.x - b.x);
  pinList.forEach(p => { p.right = p.x > 86; const a = p.right ? p.x - LW : p.x - 1, b = p.right ? p.x + 1 : p.x + LW; let l = lanes.findIndex(end => end.every(([s,e]) => b <= s || a >= e)); if(l < 0){ l = lanes.length; lanes.push([]); } lanes[l].push([a,b]); p.lane = l; });
  const pins = pinList.map(({sp, x, right, lane}) => `<button type="button" class="tl-pin ${spStatus(sp)[0]} ${right?'r':''}" style="left:${x.toFixed(2)}%;top:${6 + lane*30}px" data-act="editSpecial" data-id="${sp.id}" title="${esc(sp.name)} · ${fmtRange(sp)}"><i></i><span>${esc(sp.name)}</span></button>`).join('');
  const todayX = dayOfYear(t.slice(5))/365*100;
  const groups = [['live','Läuft gerade'],['soon','Geplant'],['past','Vergangen']];
  const sorted = [...S.specials].sort((a,b)=>a.from.localeCompare(b.from));
  const q = view.pq.trim().toLowerCase();
  const dishes = menuSorted().filter(m => !q || m.name.toLowerCase().includes(q));
  return `<section class="panel">
    <div class="panel-h"><h2>Jahresplan ${y}</h2></div>
    <div class="tl-wrap"><div class="tline">
      <div class="tl-months">${months.map(m=>`<span>${m}</span>`).join('')}</div>
      <div class="tl-track">${bars}<span class="tl-today ${todayX > 92 ? 'r' : todayX < 4 ? 'l' : ''}" style="left:${todayX.toFixed(2)}%" title="Heute"></span></div>
      <div class="tl-pins" style="height:${Math.max(1, lanes.length)*30 + 10}px">${pins}</div>
    </div></div>
    <p class="hint">Saisonzeiten verschieben: Saison anklicken. Die Gästekarte wechselt automatisch am ersten Tag einer Saison. Aktionen erscheinen nur an ihren Tagen.</p>
  </section>
  <div class="plan-grid">
    <section class="col">
      ${groups.map(([g,l]) => { const list = sorted.filter(sp => spStatus(sp)[0]===g); if(!list.length) return ''; return `<h2 class="sec-h">${l}<small class="muted sm">${list.length}</small></h2><div class="sp-list">${(g==='past'?list.reverse():list).map(sp => { const [st,stl] = spStatus(sp); return `<article class="sp-card ${st}">
        <div class="sp-top"><span class="sp-st ${st}">${stl}</span><span class="muted sm mono">${fmtRange(sp)} · ${spDays(sp)} ${spDays(sp)===1?'Tag':'Tage'}</span></div>
        <h3>${esc(sp.name)}</h3>${sp.note?`<p class="muted sm">${esc(sp.note)}</p>`:''}
        <ul class="sp-items">${sp.items.map(it=>`<li><span>${esc(it.name)}</span>${+it.price > 0 ? `<span class="mono">${eur(it.price)}</span>` : ''}</li>`).join('')}</ul>
        <div class="sp-foot"><span class="tag">${sp.mode==='tageskarte'?'Eigene Tageskarte':'Einleger auf der Karte'} · ${esc((SPECIAL_STYLES.find(x=>x[0]===sp.style)||[,''])[1])}</span>
          <span class="row-btns"><button type="button" class="icon-btn" data-act="previewSpecial" data-id="${sp.id}" title="Vorschau" aria-label="Vorschau">${ico('eye')}</button><button type="button" class="icon-btn" data-act="dupSpecial" data-id="${sp.id}" title="Für nächstes Jahr kopieren" aria-label="Kopieren">${ico('copy')}</button>${sp.mode==='tageskarte'?`<button type="button" class="icon-btn" data-act="printSpecial" data-id="${sp.id}" title="Tageskarte drucken" aria-label="Drucken">${ico('print')}</button>`:''}<button type="button" class="icon-btn" data-act="editSpecial" data-id="${sp.id}" title="Bearbeiten" aria-label="Bearbeiten">${ico('edit')}</button></span></div>
      </article>`; }).join('')}</div>`; }).join('') || '<div class="panel empty">Noch keine Aktionen geplant.</div>'}
    </section>
    <section class="panel flush">
      <div class="panel-h pad"><h2>Welche Gerichte in welcher Saison?</h2></div>
      <div class="toolbar pad-x"><label class="search">${ico('search')}<input id="pq" type="search" placeholder="Gericht suchen" value="${esc(view.pq)}" autocomplete="off"></label></div>
      <div class="tbl-wrap"><table class="matrix"><thead><tr><th>Gericht</th>${SEASONS.map(([k,l])=>`<th class="c"><span class="sdot" style="background:${ss[k].pal.accent}"></span>${l}</th>`).join('')}</tr></thead>
      <tbody>${dishes.map(m=>{ const all = !m.seasons.length; return `<tr><td><b class="pn">${esc(m.name)}</b><small class="muted">${esc(m.section)}${all?' · ganzjährig':''}</small></td>${SEASONS.map(([k])=>`<td class="c"><label class="chk"><input type="checkbox" data-ms="${m.id}:${k}" ${all||m.seasons.includes(k)?'checked':''} aria-label="${esc(m.name)} ${seasonName(k)}"><span></span></label></td>`).join('')}</tr>`; }).join('')}</tbody></table></div>
      <p class="hint pad-x pad-b">Alle vier Haken bedeutet ganzjährig. Ein Gericht ohne passende Saison erscheint auf keiner Gästekarte, bleibt aber in der Kalkulation.</p>
    </section>
  </div>`;
}

function specialDialog(sp){
  const isNew = !sp;
  const t = todayStr();
  sp = sp ? JSON.parse(JSON.stringify(sp)) : {id:uid('sp'), name:'', from:addDays(t,1), to:addDays(t,2), mode:'insert', style:'tafel', note:'', items:[{name:'',desc:'',price:'',veg:'',card:''}]};
  const dishes = S.cards.filter(c=>c.type==='dish').sort(byName);
  const menuOpts = menuSorted();
  const row = (it,i) => `<div class="sp-row" data-row>
    <input placeholder="Gericht" data-f="name" value="${esc(it.name)}" required>
    <input type="text" inputmode="decimal" placeholder="€" data-f="price" value="${it.price===''||it.price==null||!+it.price?'':num2(it.price)}" class="pr num-in" aria-label="Preis">
    <button type="button" class="icon-btn" data-rm aria-label="Zeile entfernen">${ico('x')}</button>
    <input placeholder="Beschreibung" data-f="desc" value="${esc(it.desc)}" class="wide">
    <select data-f="veg" aria-label="Art"><option value="">Fleisch/Fisch</option><option value="v" ${it.veg==='v'?'selected':''}>Vegetarisch</option><option value="vg" ${it.veg==='vg'?'selected':''}>Vegan</option></select>
    <select data-f="card" aria-label="Rezeptur"><option value="">ohne Rezeptur</option>${dishes.map(c=>`<option value="${c.id}" ${it.card===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
    <input placeholder="Allergene ohne Rezeptur, z. B. A C G" data-f="alg" value="${esc(it.alg||'')}" class="wide" aria-label="Allergene">
  </div>`;
  openDialog(isNew ? 'Neue Aktion / Spezialität' : 'Aktion bearbeiten', `
    <label class="f">Name<input name="name" required placeholder="z. B. Wildwochenende" value="${esc(sp.name)}"></label>
    <div class="fields two"><label class="f">Von<input name="from" type="date" required value="${sp.from}"></label><label class="f">Bis<input name="to" type="date" value="${sp.to||sp.from}"></label></div>
    <div class="chips-row tight"><button type="button" class="chip" data-dur="1">1 Tag</button><button type="button" class="chip" data-dur="2">2 Tage</button><button type="button" class="chip" data-dur="3">Wochenende (3)</button><button type="button" class="chip" data-dur="7">1 Woche</button></div>
    <label class="f">Kurzer Text für die Gäste<input name="note" placeholder="z. B. Frisch aus der Gerlosser Jagd" value="${esc(sp.note)}"></label>
    <div class="fields two">
      <label class="f">Darstellung<select name="mode"><option value="insert" ${sp.mode==='insert'?'selected':''}>Einleger oben auf der Karte</option><option value="tageskarte" ${sp.mode==='tageskarte'?'selected':''}>Eigene Tageskarte</option></select></label>
      <label class="f">Stil<select name="style">${SPECIAL_STYLES.map(([k,l])=>`<option value="${k}" ${sp.style===k?'selected':''}>${l}</option>`).join('')}</select></label>
    </div>
    <div class="f">Gerichte</div>
    <div id="spRows">${sp.items.map(row).join('')}</div>
    <div class="row-btns"><button type="button" class="btn sm" id="spAdd">${ico('plus')}Gericht</button>
      <select id="spFromMenu" class="sm-sel"><option value="">Von der Karte übernehmen …</option>${menuOpts.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select></div>`,
    fd => { const rows = [...$('#spRows').querySelectorAll('[data-row]')].map(r => { const g = f => r.querySelector(`[data-f="${f}"]`).value; return {name:g('name').trim(), desc:g('desc').trim(), price:+g('price')||0, veg:g('veg'), card:g('card'), alg:g('alg').toUpperCase().replace(/[^A-PR\s,]/g,'').split(/[\s,]+/).filter(a=>ALG[a]).join(' ')}; }).filter(x=>x.name);
      if(!rows.length){ toast('Mindestens ein Gericht eintragen'); return false; }
      let from = fd.get('from'), to = fd.get('to') || from; if(to < from) [from,to] = [to,from];
      Object.assign(sp, {name:fd.get('name').trim(), from, to, note:fd.get('note').trim(), mode:fd.get('mode'), style:fd.get('style'), items:rows});
      const i = S.specials.findIndex(x=>x.id===sp.id); if(i>=0) S.specials[i] = sp; else S.specials.push(sp);
      view.gdate = sp.from; },
    {done:()=>`„${sp.name}“ gespeichert · ${fmtRange(sp)}`, del: isNew ? null : () => ask(`Aktion „${sp.name}“ löschen?`, () => { S.specials = S.specials.filter(x=>x.id!==sp.id); }),
     after: f => {
      const rows = $('#spRows');
      $('#spAdd').onclick = () => { rows.insertAdjacentHTML('beforeend', row({name:'',desc:'',price:'',veg:'',card:''})); rows.lastElementChild.querySelector('input').focus(); };
      rows.onclick = e => { const b = e.target.closest('[data-rm]'); if(b && rows.children.length > 1) b.closest('[data-row]').remove(); };
      rows.onchange = e => { if(e.target.dataset.f === 'card' && e.target.value){ const r = e.target.closest('[data-row]'); const c = C(e.target.value); const nm = r.querySelector('[data-f=name]'); if(!nm.value) nm.value = c.name; const pr = r.querySelector('[data-f=price]'); if(!pr.value){ const tt = totals(c); pr.value = num2(Math.ceil(tt.cost/(S.settings.target/100)*(1+vatRate(null)/100)) - 0.1); } } };
      $('#spFromMenu').onchange = e => { const m = S.menu.find(x=>x.id===e.target.value); if(!m) return; rows.insertAdjacentHTML('beforeend', row({name:m.name, desc:m.desc, price:m.price, veg:m.veg, card:m.card})); const first = rows.firstElementChild; if(first && !first.querySelector('[data-f=name]').value) first.remove(); e.target.value = ''; };
      f.querySelectorAll('[data-dur]').forEach(b => b.onclick = () => { const fr = f.elements.from.value || todayStr(); f.elements.to.value = addDays(fr, +b.dataset.dur - 1); });
     }});
}
