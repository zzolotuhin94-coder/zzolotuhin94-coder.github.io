/* =====================================================================
   Hauskarte: eine feste Gestaltung für alle Saisonen
   (Art Director, Menu Engineering und Kritik zusammengeführt)
   ===================================================================== */
const HK_SECTIONS = ['Flammkuchen','Zum Teilen','Suppen & Vorspeisen','Salate & Bowls','Rösti','Klassiker','Burger, Pasta & Co.','Süßes','Für Kinder'];
const HK_ACCENT = {winter:'#8e2f2a', fruehling:'#5c7838', sommer:'#2d5c86', herbst:'#9c6b1e'};
const HK_ACCENT_NAME = {winter:'Preiselbeere', fruehling:'Bärlauch', sommer:'Enzian', herbst:'Lärche'};
const HK_TITLE = {winter:'Winterkarte', fruehling:'Frühlingskarte', sommer:'Sommerkarte', herbst:'Herbstkarte'};
const HK_PLACE = 'Restobar | Café · Gerlos, gegenüber der Piste';
const HK_DAYWORD = ['sonntags','montags','dienstags','mittwochs','donnerstags','freitags','samstags'];
const SEC_MAP = {'Vorspeisen':'Suppen & Vorspeisen', 'Suppen':'Suppen & Vorspeisen', 'Fondue & Hauptspeisen':'Klassiker', 'Burger & Kebap':'Burger, Pasta & Co.', 'Desserts':'Süßes', 'Kindermenü':'Für Kinder'};
// alter Name → [Abschnitt, neuer Name, Reihenfolge, Variantengruppe, Variante, Signatur]
const MENU_V2 = {
  '„Der Elsässer“':['Flammkuchen','Elsässer',0,'','',1], '„Die Gärtnerin“':['Flammkuchen','Gärtnerin',1], '„Der Weiße“':['Flammkuchen','Weißer',2], '„Schwammerlsuche“':['Flammkuchen','Schwammerl',3],
  'Zillertaler Käsefondue':['Zum Teilen','Zillertaler Käsefondue',0,'','',1], '„Garnelen Pfandl“':['Zum Teilen','Garnelenpfandl',1], 'Ripperl-Tower':['Zum Teilen','Ripperl-Tower',2], '„Vegan Dippin’“':['Zum Teilen','Artischocke zum Dippen',3], 'Tiroler Kiachl':['Zum Teilen','Tiroler Kiachl',4], 'DAHUAM.202 Knoblauchbrot':['Zum Teilen','Knoblauchbrot',5],
  'Hausgemachte Gulaschsuppe':['Suppen & Vorspeisen','Gulaschsuppe',0], 'Fruchtige Tomatensuppe':['Suppen & Vorspeisen','Tomatensuppe',1], 'Kürbiscremesuppe':['Suppen & Vorspeisen','Kürbiscremesuppe',2], 'Kalte Gurken-Buttermilchsuppe':['Suppen & Vorspeisen','Kalte Gurken-Buttermilchsuppe',2], 'Kokos-Curry-Suppe':['Suppen & Vorspeisen','Kokos-Curry-Suppe',3], 'Rindsuppe mit Frittaten':['Suppen & Vorspeisen','Rindsuppe mit Frittaten',4], 'Rindsuppe mit Kaspressknödel':['Suppen & Vorspeisen','Rindsuppe mit Kaspressknödel',5],
  'Tatar vom Tiroler Rind 130 g':['Suppen & Vorspeisen','Tatar vom Tiroler Rind',6,'tatar','130 g'], 'Tatar vom Tiroler Rind 180 g':['Suppen & Vorspeisen','Tatar vom Tiroler Rind',7,'tatar','180 g'], '„Fabian’s Caprese“':['Suppen & Vorspeisen','Fabians Caprese',8], 'Bärlauch-Kaspressknödel':['Suppen & Vorspeisen','Bärlauch-Kaspressknödel',8], '„Alpen Ceviche“':['Suppen & Vorspeisen','Alpen-Ceviche',9],
  'Caesar Salat':['Salate & Bowls','Caesar Salat',0], 'Gerlos Bowl':['Salate & Bowls','Gerlos Bowl',1], 'Salatschüsserl mit Backhendl':['Salate & Bowls','Salatschüsserl mit Backhendl',2], 'Salatschüsserl mit Ziegenkäse':['Salate & Bowls','Salatschüsserl mit Ziegenkäse',3], 'DAHUAM.202 Sommersalat':['Salate & Bowls','Sommersalat',4], 'Kebap Bowl':['Salate & Bowls','Kebap Bowl',5],
  'Bauernrösti':['Rösti','Bauernrösti',0], 'Schwammerlrösti':['Rösti','Schwammerlrösti',1], 'Dolce Vita Rösti':['Rösti','Dolce-Vita-Rösti',2],
  'Wiener Schnitzel vom Schwein':['Klassiker','Wiener Schnitzel',0,'schnitzel','vom Schwein',1], 'Wiener Schnitzel vom Kalb':['Klassiker','Wiener Schnitzel',1,'schnitzel','vom Kalb',1], '„Stück Fleisch“':['Klassiker','Filetsteak 230 g',2], 'Hirschragout':['Klassiker','Hirschragout',3], 'Gebratener Zillertaler Saibling':['Klassiker','Zillertaler Saibling',3], 'Eierschwammerlgulasch':['Klassiker','Eierschwammerlgulasch',3], 'Zillertaler Krapfen':['Klassiker','Zillertaler Krapfen',4],
  'Kalbsrahmgulasch':['Klassiker','Kalbsrahmgulasch',5], 'Zillertaler Forelle „Müllerin“':['Klassiker','Forelle Müllerin',6], 'Original Wiener Tafelspitz':['Klassiker','Wiener Tafelspitz',7], 'Gerolltes Cordon bleu':['Klassiker','Cordon bleu',8], '„Hans-Wurst“':['Klassiker','Hans-Wurst',9],
  'Wadel-Beißer-Burger':['Burger, Pasta & Co.','Wadel-Beißer-Burger',0], 'DFC Burger':['Burger, Pasta & Co.','DFC Burger',1], 'Alpen Kebap':['Burger, Pasta & Co.','Alpen-Kebap',2], '„Fish n’ Chips“':['Burger, Pasta & Co.','Fish & Chips',3], 'Eierschwammerl Carbonara':['Burger, Pasta & Co.','Eierschwammerl-Carbonara',4], '„Wilde Bolo“':['Burger, Pasta & Co.','Wilde Bolo',5], '„Veganista Couch Potato“':['Burger, Pasta & Co.','Süßkartoffel mit Shakshuka',6],
  '„Wir sind Kaiser!“':['Süßes','Kaiserschmarrn',0,'','',1], 'Oma Lisl’s Apfelstrudel':['Süßes','Oma Lisls Apfelstrudel',1], '„Marillenzeit = Knödelzeit“':['Süßes','Marillenknödel',2], 'Cookie Pfandl':['Süßes','Cookie-Pfandl',3], '„Dippin me softly!“':['Süßes','Schokofondue',4], 'Affogato':['Süßes','Affogato',5], '„French Twist“':['Süßes','Crème brûlée',6], '„Fabian’s Schokotraum“':['Süßes','Schokomousse',7], '„Endless Summer“':['Süßes','Erdbeeren mit Cheesecake-Creme',8], '„Say Cheese“':['Süßes','Antonias Käseauswahl',9],
};
const DESC_V2 = {'Kaiserschmarrn':'Mit Apfelmus und Heidelbeerkompott', 'Schokofondue':'Milchschokolade, Obst, Marshmallows, pro Person', 'Zillertaler Käsefondue':'Brot, Erdäpfel, hausgemachte Mixed Pickles, pro Person', 'Wiener Tafelspitz':'Klassisch, mit Apfelkren und Schnittlauchsauce', 'Ripperl-Tower':'Pro Person', 'Elsässer':'Speck, Zwiebel, Frühlingszwiebel', 'Wiener Schnitzel':'Mit Pommes, Preiselbeeren und Zitrone', 'Tomatensuppe':'Crème fraîche, Pesto', 'Artischocke zum Dippen':'Ganze Artischocke, Zitronenvinaigrette, Wasabi-Caesar-Dip', 'Filetsteak 230 g':'Pfefferjus, Kräuterblütenbutter', 'Crème brûlée':'Mit Vanille', 'Schokomousse':'In der Kaffeetasse serviert', 'Antonias Käseauswahl':'Kleine Käse, ausgesucht von Antonia'};

function menuV2Migrate(d){
  const s = d.settings; if(s.menuV2) return d;
  d.menu.forEach(m => { const r = MENU_V2[m.name]; if(r){ const [sec,name,ord,grp,vl,sig] = r; m.section = sec; m.name = name; m.order = ord*10 + (vl==='vom Kalb'||vl==='180 g'?1:0); m.group = grp||''; m.vlabel = vl||''; m.top = !!sig; if(DESC_V2[name]) m.desc = DESC_V2[name]; if(name==='Ripperl-Tower'||name==='Wiener Tafelspitz') m.desc = m.desc.replace(/^(Nur|nur) (sonntags|dienstags)(, )?/,'') || DESC_V2[name]; } else { if(SEC_MAP[m.section]) m.section = SEC_MAP[m.section]; m.group = m.group||''; m.vlabel = m.vlabel||''; if(m.section==='Für Kinder') m.top = false; } m.name = m.name.replace(/[„“"]/g,''); });
  d.menu.filter(m=>m.name==='Ripperl-Tower'||m.name==='Wiener Tafelspitz').forEach(m=>{ m.desc = DESC_V2[m.name]; });
  d.cards.forEach(c => { if(SEC_MAP[c.category]) c.category = SEC_MAP[c.category]; if(c.category==='Fondue & Hauptspeisen') c.category = 'Klassiker'; });
  if(d.cards.find(c=>c.id==='dish_fondue')) d.cards.find(c=>c.id==='dish_fondue').category = 'Zum Teilen';
  const used = [...new Set(d.menu.map(m=>m.section))];
  s.sections = [...HK_SECTIONS.filter(x=>used.includes(x) || ['Flammkuchen','Süßes','Für Kinder'].includes(x)), ...used.filter(x=>!HK_SECTIONS.includes(x))];
  SEASONS.forEach(([k]) => { const ss = s.seasons[k]; if(!ss) return; ss.accent = HK_ACCENT[k]; ss.title = HK_TITLE[k]; ss.subtitle = HK_PLACE; ss.pal = {...ss.pal, accent:HK_ACCENT[k], paper:'#f4f0e7'}; });
  s.kidsSheet = true; s.menuV2 = true;
  return d;
}

/* ---------- Bausteine ---------- */
const hkPrice = p => fin(+p).toLocaleString('de-AT',{minimumFractionDigits:2, maximumFractionDigits:2});
function hkDays(m){ return m.days && m.days.length ? 'nur ' + m.days.map(i=>HK_DAYWORD[i]).join(' und ') : ''; }
function hkEntries(list){
  const out = [];
  for(const m of list){
    const last = out[out.length-1];
    if(m.group && last && last.group === m.group){ last.vars.push(m); continue; }
    out.push({group:m.group||'', head:m, vars:[m]});
  }
  return out;
}
function hkDish(e, used, opts={}){
  const m = e.head, vars = e.vars, multi = vars.length > 1 || (m.vlabel && vars.length===1 && m.group);
  const alg = [...new Set(vars.flatMap(v => itemAlg(v)))].sort(); alg.forEach(a=>used.add(a));
  const veg = vars.every(v=>v.veg==='vg') ? 'vg' : vars.every(v=>v.veg==='v' || v.veg==='vg') ? 'v' : '';
  const desc = [m.desc, hkDays(m)].filter(Boolean).join(', ');
  const name = m.name;
  const price = +m.price ? `<span class="hk-p">${hkPrice(m.price)}</span>` : '<span class="hk-p"></span>';
  return `<article class="hk-dish ${vars.some(v=>v.top) && !opts.noSig ? 'sig' : ''}">
    <div class="hk-l1"><span class="hk-n">${esc(name)}${veg?`<span class="hk-diet" title="${veg==='vg'?'vegan':'vegetarisch'}">${veg}</span>`:''}</span>${multi?'':price}</div>
    ${desc || alg.length ? `<p class="hk-d">${esc(desc)}${alg.length?`<span class="hk-alg" title="${esc(alg.map(a=>ALG[a]).join(', '))}">${alg.join(' ')}</span>`:''}</p>` : ''}
    ${multi ? vars.map(v=>`<div class="hk-var"><span>${esc(v.vlabel||v.name)}</span><span class="hk-p">${hkPrice(v.price)}</span></div>`).join('') : ''}
  </article>`;
}
function hkLegend(used, k){
  const s = S.settings.seasons[k];
  return `<footer class="hk-foot">
    ${used.size ? `<div class="hk-leg">${[...used].sort().map(a=>`<span><b>${a}</b> ${esc(ALG[a])}</span>`).join('')}</div>` : ''}
    <div class="hk-fl"><span>${esc(s.footer || 'Preise in Euro inkl. MwSt.')} · v vegetarisch · vg vegan · <span class="hk-sigkey"></span> Empfehlung des Hauses</span><span>Stand ${fmtDate(new Date().toISOString())}</span></div>
  </footer>`;
}
function hkHead(k, date, small){
  const s = S.settings.seasons[k];
  const season = `${esc(s.title)} ${seasonYear(k, date)}`;
  if(small) return `<header class="hk-head small"><div class="hk-top"><span class="hk-wm">DAHUAM<i>.</i>202</span><span class="hk-season">${small}</span></div></header>`;
  return `<header class="hk-head">
    <div class="hk-top"><span class="hk-wm">DAHUAM<i>.</i>202</span><span class="hk-season">${season}</span></div>
    <div class="hk-dict"><span class="hk-word">da·huam</span><span class="hk-gloss"><i>tirolerisch</i> — daheim, zuhause</span></div>
    <div class="hk-place">${esc(s.subtitle || HK_PLACE)}</div>
    <p class="hk-motto">Unkompliziert ist unser Motto beim Genießen.</p>
  </header>`;
}
function hkSpecial(sp, used, page){
  const d1 = new Date(sp.from+'T12:00:00'), d2 = new Date((sp.to||sp.from)+'T12:00:00');
  const f = d => d.toLocaleDateString('de-AT',{weekday:'short', day:'numeric'}).replace(/\./g,'')+'.';
  const date = sp.to && sp.to !== sp.from ? `${f(d1)} – ${f(d2)} ${d2.toLocaleDateString('de-AT',{month:'long'})}` : d1.toLocaleDateString('de-AT',{weekday:'long', day:'numeric', month:'long'});
  const items = sp.items.map(it => ({...it, id:'', top:false, group:'', days:[]}));
  return `<section class="hk-special ${page?'page':''}">
    <div class="hk-sp-label">${esc(date)}</div>
    <h3 class="hk-sp-title">${esc(sp.name)}</h3>${sp.note?`<p class="hk-sp-note">${esc(sp.note)}</p>`:''}
    ${hkEntries(items).map(e=>hkDish(e, used, {noSig:true})).join('')}
  </section>`;
}

/* ---------- Beiblätter: Kinderkarte und Tageskarte ---------- */
function kidsHtml(k, dateStr){
  const items = guestItems(k, dateStr).filter(m=>m.section==='Für Kinder'); if(!items.length) return '';
  const used = new Set(); const s = S.settings.seasons[k];
  return `<div class="hk-paper hk-kids" style="--hk-a:${esc(s.accent || HK_ACCENT[k])}">${hkHead(k, dateStr, 'Für Kinder')}
    <h2 class="hk-sheet-title">Für unsere kleinen Gäste</h2>
    <div class="hk-cols one">${hkEntries(items).map(e=>hkDish(e, used, {noSig:true})).join('')}</div>${hkLegend(used, k)}</div>`;
}
function tageskarteHtml(sp, k){
  k = k || seasonFor(sp.from) || 'winter'; const s = S.settings.seasons[k]; const used = new Set();
  return `<div class="hk-paper hk-tk" style="--hk-a:${esc(s.accent || HK_ACCENT[k])}">${hkHead(k, sp.from, 'Tageskarte')}
    ${hkSpecial(sp, used, true)}${hkLegend(used, k)}</div>`;
}
function guestPrevHtml(){
  const date = view.gdate || todayStr(); const k = curSeasonKey();
  const wdn = new Date(date+'T12:00:00').getDay();
  const closed = (S.settings.closed||[]).includes(wdn) ? `<div class="g-closed">${ico('spark')}${DAYNAME[wdn]} ist Ruhetag. So sähe die Karte trotzdem aus.</div>` : '';
  const tks = specialsFor(date).filter(sp => sp.mode === 'tageskarte');
  const kids = S.settings.kidsSheet !== false ? kidsHtml(k, date) : '';
  return closed + guestHtml(k, date)
    + tks.map(sp=>`<div class="tk-label">Tageskarte, liegt bei · ${esc(sp.name)}</div>${tageskarteHtml(sp, k)}`).join('')
    + (kids ? `<div class="tk-label">Kinderkarte, eigenes Blatt</div>${kids}` : '');
}

/* ---------- Werkzeuge ---------- */
function renderGuest(){
  const date = view.gdate || (view.gdate = todayStr());
  const auto = seasonFor(date); const k = view.gseason || auto || 'winter'; const s = S.settings.seasons[k];
  const sps = specialsFor(date);
  const miss = guestItems(k, date).filter(m=>!hasAlg(m)).length; const missSp = sps.reduce((n,sp)=>n+sp.items.filter(it=>!hasAlg(it)).length,0); const missAll = noAlgCount();
  const accent = s.accent || HK_ACCENT[k];
  return `<div class="guest-wrap">
    <aside class="guest-tools">
      <section class="panel">
        <div class="panel-h"><h2>Was sehen die Gäste?</h2></div>
        <label class="f">Datum<input id="gdate" type="date" value="${date}"></label>
        <div class="chips-row tight"><button type="button" class="chip ${date===todayStr()?'on':''}" data-act="gdate" data-id="${todayStr()}">Heute</button><button type="button" class="chip" data-act="gdate" data-id="${addDays(todayStr(),1)}">Morgen</button>${S.specials.filter(sp=>spStatus(sp)[0]!=='past').slice(0,3).map(sp=>`<button type="button" class="chip" data-act="gdate" data-id="${sp.from}">${esc(sp.name)}</button>`).join('')}</div>
        <p class="hint">${auto ? `Am ${fmtDate(date+'T12:00:00')} gilt die <b>${esc(S.settings.seasons[auto].title)}</b>` : 'An diesem Datum gilt keine Saisonkarte'}${sps.length ? ` und ${sps.length===1?'die Aktion':'die Aktionen'} <b>${sps.map(x=>esc(x.name)).join(', ')}</b>.` : '.'}</p>
        ${missAll || missSp ? `<p class="hint alg-miss"><b>${plural(missAll, 'Gericht', 'Gerichte')} ohne Allergenangabe</b>${missAll !== miss ? `, ${miss} davon auf dieser Karte. Die anderen sind ausgeblendet oder gerade nicht in Saison` : ''}${missSp ? `. Dazu ${missSp} in der Aktion` : ''}. In Österreich Pflicht. <button type="button" class="link" data-act="goMenu" data-id="noalg">Anzeigen</button></p>` : ''}
      </section>
      <!--gstyle-->
      <section class="panel">
        <div class="panel-h"><h2>Saison</h2>${view.gseason?`<button type="button" class="link sm-link" data-act="gseason" data-id="">nach Datum</button>`:''}</div>
        ${seg('gseason', k, SEASONS.map(([sk,sl])=>[sk,sl]))}
        <div class="fields two">
          <label class="f">Gültig ab<input type="text" inputmode="numeric" placeholder="TT.MM." data-smd="from" value="${mdLabel(s.from)}"></label>
          <label class="f">bis<input type="text" inputmode="numeric" placeholder="TT.MM." data-smd="to" value="${mdLabel(s.to)}"></label>
        </div>
        <div class="f">Akzentfarbe der Saison</div>
        <div class="acc-row">${SEASONS.map(([sk])=>`<button type="button" class="acc ${accent===HK_ACCENT[sk]?'on':''}" style="--c:${HK_ACCENT[sk]}" data-act="hkAccent" data-id="${HK_ACCENT[sk]}" title="${HK_ACCENT_NAME[sk]}"><i></i>${HK_ACCENT_NAME[sk]}</button>`).join('')}<label class="clr"><input type="color" data-hka="1" value="${accent}" aria-label="Eigene Farbe"><span>Eigene</span></label></div>
        <p class="hint">Schrift, Raster und Papier bleiben in jeder Saison gleich. So erkennt man immer dasselbe Haus.</p>
        <label class="f">Titel der Karte<input data-st="title" value="${esc(s.title)}"></label>
        <label class="f">Unterzeile<input data-st="subtitle" value="${esc(s.subtitle||HK_PLACE)}"></label>
        <label class="f">Fußzeile<input data-st="footer" value="${esc(s.footer)}"></label>
        <div class="togs"><label class="tog"><input type="checkbox" data-hkk="1" ${S.settings.kidsSheet!==false?'checked':''}><span></span>Kinderkarte als eigenes Blatt</label></div>
        <div class="row-btns"><button type="button" class="btn sm" data-act="gcover">${ico('camera')}${s.cover?'Titelbild ändern':'Titelbild (optional)'}</button>${s.cover?'<button type="button" class="btn sm" data-act="gcoverDel">Entfernen</button>':''}</div>
        <p class="hint">Fotos einzelner Gerichte erscheinen bewusst nicht in der Karte: Sie verschieben die Zeilen. Ein ruhiges Titelbild genügt.</p>
      </section>
    </aside>
    <div class="guest-prev">${guestPrevHtml()}</div>
  </div>`;
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return;
  if(el.dataset.act === 'hkAccent'){ const s = S.settings.seasons[curSeasonKey()]; s.accent = el.dataset.id; s.pal = {...s.pal, accent:el.dataset.id}; save(); render(); }
  if(el.dataset.act === 'hkJump'){ const sec = [...el.closest('.hk-paper').querySelectorAll('.hk-sec')].find(x=>x.dataset.sec===el.dataset.id); sec && sec.scrollIntoView({behavior:'smooth', block:'start'}); }
});
document.addEventListener('input', e => { const t = e.target; if(t.dataset.hka){ const s = S.settings.seasons[curSeasonKey()]; s.accent = t.value; s.pal = {...s.pal, accent:t.value}; save(); refreshGuest(); } });
document.addEventListener('change', e => { const t = e.target; if(t.dataset.hkk){ S.settings.kidsSheet = t.checked; save(); refreshGuest(); } });
