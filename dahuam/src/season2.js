/* ---------- Design-Team: Themen, Ornamente, Schriften ---------- */
Object.assign(ORN, {
  schnee:'<path d="M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10M10 4l2 2 2-2M10 20l2-2 2 2M4.5 10.5l2.6-.7-.7-2.6M19.5 13.5l-2.6.7.7 2.6"/>',
  baerlauch:'<path d="M4 20C7 11 13 5 20 4c-1 7-6 13-16 16z"/><path d="M4 20L15 9"/>',
  bergsee:'<path d="M2 15l5-7 4 5 3-3 8 5"/><path d="M2 19q2.5-2 5 0t5 0 5 0 5 0"/>',
  laerche:'<path d="M4 20L19 5M8 16l-3-1M8 16l1 3M12 12l-3-1M12 12l1 3M16 8l-3-1M16 8l1 3"/><ellipse cx="19.5" cy="4.5" rx="1.6" ry="2.2" transform="rotate(45 19.5 4.5)"/>',
  stempel:'<circle cx="12" cy="12" r="10.5" stroke-dasharray="1.6 1.6"/><circle cx="12" cy="12" r="7.5"/><path d="M12 8.2l1.1 2.4 2.6.3-1.9 1.8.5 2.6-2.3-1.3-2.3 1.3.5-2.6-1.9-1.8 2.6-.3z" fill="currentColor" stroke="none"/>',
});
delete ORN.blatt; delete ORN.berg;
Object.assign(ORN_LABEL, {baerlauch:'Bärlauch', bergsee:'Bergsee', laerche:'Lärche', stempel:'Stempel'});
const ORN_ORDER = ['schnee','baerlauch','bluete','sonne','bergsee','laerche','stempel','keins'];
Object.assign(THEMES, {
  winter:   {theme:'Pulverschnee', layout:'alpin',  pal:{paper:'#eef2f4', ink:'#1b2a3a', accent:'#a3243b', muted:'#5e6e7a', rule:'#b9c6ce'}, fd:'Fraunces', fb:'Karla', orn:'schnee', title:'Winterkarte', subtitle:'Gegenüber der Piste · Fondue, Flammkuchen & Kaiserschmarrn'},
  fruehling:{theme:'Bärlauch',     layout:'alpin',  pal:{paper:'#f3f5ec', ink:'#23331f', accent:'#5f8b2e', muted:'#6e7766', rule:'#c9d4b8'}, fd:'Young Serif', fb:'Figtree', orn:'baerlauch', title:'Frühlingskarte', subtitle:'Bärlauch, Spargel & die ersten Almkräuter'},
  sommer:   {theme:'Almrausch',    layout:'modern', pal:{paper:'#fbfcfa', ink:'#0f3b4a', accent:'#c8325f', muted:'#557079', rule:'#bfd6dc'}, fd:'Bricolage Grotesque', fb:'Work Sans', orn:'bergsee', title:'Sommerkarte', subtitle:'Terrasse, Flammkuchen & kühle Getränke unterm Gerlospass'},
  herbst:   {theme:'Lärchengold',  layout:'alpin',  pal:{paper:'#e6e4d8', ink:'#2e2a1f', accent:'#9e7410', muted:'#6b6655', rule:'#c3bfa8'}, fd:'Alegreya SC', fb:'Alegreya Sans', orn:'laerche', title:'Herbstkarte', subtitle:'Wild, Kürbis & Kastanien aus dem Zillertal'},
});
const TAGESBLATT = {paper:'#23282b', ink:'#f4f2ec', accent:'#f2c14e', muted:'#a9b0b4', rule:'#4a5257'};
FONTPAIRS.length = 0;
FONTPAIRS.push(['Fraunces','Karla','Pulverschnee'],['Young Serif','Figtree','Bärlauch'],['Bricolage Grotesque','Work Sans','Almrausch'],['Alegreya SC','Alegreya Sans','Lärchengold'],['Cormorant Garamond','Figtree','Elegant']);
const SERIF_FONTS = ['Fraunces','Young Serif','Alegreya SC','Cormorant Garamond'];
fontStack = (f, serif) => `"${f}",${SERIF_FONTS.includes(f)?'Georgia,serif':'system-ui,sans-serif'}`;
const DAYS = [[1,'Mo'],[2,'Di'],[3,'Mi'],[4,'Do'],[5,'Fr'],[6,'Sa'],[0,'So']];
const DAYNAME = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];

/* ---------- Demodaten: Saisongerichte (Küchenchef) & Aktionen (Gastronomie) ---------- */
const SEASON_DEMO = [
  ['Fondue & Hauptspeisen','Hirschragout','Mit Serviettenknödel, Rotkraut und Preiselbeerbirne',26.90,['winter','herbst'],'','A C G L O'],
  ['Fondue & Hauptspeisen','Zillertaler Krapfen','Roggenteig mit Graukäse-Erdäpfelfülle, Sauerkraut',15.90,['winter'],'v','A C G'],
  ['Vorspeisen','Bärlauch-Kaspressknödel','Auf Blattsalat mit Kernöl',15.50,['fruehling'],'v','A C G'],
  ['Fondue & Hauptspeisen','Gebratener Zillertaler Saibling','Mit grünem Spargel und Heurigen',27.50,['fruehling'],'','D G'],
  ['Fondue & Hauptspeisen','Eierschwammerlgulasch','Mit Serviettenknödel und Petersilie',19.90,['sommer'],'v','A C G'],
  ['Suppen','Kalte Gurken-Buttermilchsuppe','Mit Dille und Forellenkaviar',8.90,['sommer'],'','D G'],
  ['Suppen','Kürbiscremesuppe','Mit Kernöl und gerösteten Kernen',7.50,['herbst'],'v','G'],
  ['Fondue & Hauptspeisen','Tiroler Kiachl','Mit Sauerkraut oder Preiselbeeren',12.90,['herbst'],'v','A C G'],
];
function easter(Y){ const a=Y%19,b=Math.floor(Y/100),c=Y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1; return `${Y}-${String(mo).padStart(2,'0')}-${String(da).padStart(2,'0')}`; }
function nthSunday(Y,M,n){ const d = new Date(Y,M-1,1); const first = (7-d.getDay())%7+1; return `${Y}-${String(M).padStart(2,'0')}-${String(first+7*(n-1)).padStart(2,'0')}`; }
function nextFriday(t){ const d = new Date(t+'T12:00:00'); return addDays(t, ((5-d.getDay()+7)%7) || 7); }
function upcoming(fn, y, t){ const a = fn(y); return a >= t ? a : fn(y+1); }
const SPECIAL_DEMO = (y, t) => {
  const wild = nextFriday(t), ost = upcoming(easter, y, t), mut = upcoming(Y=>nthSunday(Y,5,2), y, t), alm = upcoming(Y=>`${Y}-09-26`, y, t), sch = upcoming(Y=>`${Y}-07-13`, y, t);
  return [
    ['Gerlosser Wildwochenende', wild, addDays(wild,2), 'insert', 'tafel', 'Frisch aus der heimischen Jagd', [['Rehragout','Mit Serviettenknödel, Rotkraut und Preiselbeeren',26.90,'','A C G L O'],['Hirschgulasch','Mit Butterspätzle',24.90,'','A C G L']]],
    ['Silvester-Fondue Chinoise', `${y}-12-31`, `${y}-12-31`, 'tageskarte', 'festlich', 'Reservierung um 18:15 oder ab 20:30 Uhr', [['Fondue Chinoise','Rind, Kalb und Huhn, Brühe, fünf hausgemachte Saucen, pro Person',42.00,'','C L M O'],['Mitternachts-Gulaschsuppe','Mit Gebäck',7.90,'','A']]],
    ['Ostern bei uns', ost, addDays(ost,1), 'insert', 'saison', 'Ostersonntag und Ostermontag', [['Osterbrunch-Teller','Osterschinken, Kren, gefärbte Eier, Bauernbrot, Butter',17.50,'','A C G']]],
    ['Muttertags-Menü', mut, mut, 'tageskarte', 'festlich', 'Drei Gänge für Mama', [['Bärlauchsuppe','',0,'v','G'],['Kalbsrücken mit Spargel','Hauptgang',0,'','G'],['Erdbeer-Topfencreme','Dessert',0,'v','G'],['Menü komplett','Drei Gänge',39.50,'','A C G']]],
    ['Almabtrieb-Wochenende', alm, addDays(alm,1), 'insert', 'tafel', 'Wenn die Kühe von der Alm kommen', [['Almabtrieb-Kasspatzln','Zillertaler Bergkäse, Röstzwiebel, grüner Salat',16.90,'v','A C G']]],
    ['Eierschwammerl-Tage', sch, addDays(sch,13), 'insert', 'saison', 'Je nach Ernte', [['Eierschwammerl à la crème','Mit Semmelknödel und Petersilie',21.50,'v','A C G']]],
  ];
};
// seasonSeed neu: mit Allergenen, Wochentagen, Ruhetag
seasonSeed = function(d){
  d.settings.seasons = {}; SEASONS.forEach(([k]) => d.settings.seasons[k] = seasonDefaults(k));
  d.settings.closed = [3];
  const tag = {'Zillertaler Käsefondue':['winter','herbst'], '„Dippin me softly!“':['winter'], '„Marillenzeit = Knödelzeit“':['sommer'], '„Endless Summer“':['fruehling','sommer'], 'DAHUAM.202 Sommersalat':['sommer'],
    '„Schwammerlsuche“':['sommer','herbst'], 'Eierschwammerl Carbonara':['sommer','herbst'], 'Schwammerlrösti':['sommer','herbst'], '„Wilde Bolo“':['herbst','winter'], '„Alpen Ceviche“':['fruehling','sommer'], 'Kokos-Curry-Suppe':['winter','herbst']};
  const days = {'Original Wiener Tafelspitz':[0], 'Ripperl-Tower':[2]};
  d.menu.forEach(m => { m.seasons = tag[m.name] || []; m.days = days[m.name] || []; m.alg = ''; });
  SEASON_DEMO.forEach(([section,name,desc,price,seasons,veg,alg]) => d.menu.push({id:uid('m'), section, name, desc, price, card:'', img:'', veg, top:false, hidden:false, seasons, days:[], alg, order: d.menu.filter(x=>x.section===section).length}));
  const y = new Date().getFullYear(), t = todayStr();
  d.specials = SPECIAL_DEMO(y, t).map(([name, from, to, mode, style, note, items]) => ({id:uid('sp'), name, from, to, mode, style, note, items:items.map(([n,ds,p,veg,alg])=>({name:n, desc:ds, price:p, veg:veg||'', card:'', alg:alg||''}))}));
};
const _seasonMigrate = seasonMigrate;
seasonMigrate = function(d){ _seasonMigrate(d); d.menu.forEach(m => { if(!m.days) m.days = []; if(m.alg==null) m.alg = ''; }); if(!d.settings.closed) d.settings.closed = [3]; return d; };

/* ---------- Allergene & Verfügbarkeit ---------- */
function itemAlg(m){ const c = m.card && C(m.card); return c ? [...totals(c).alg].sort() : algList(m.alg).sort(); }
function hasAlg(m){ return !!(m.card && C(m.card)) || algList(m.alg).length > 0; }
function dayOk(m, date){ return !m.days || !m.days.length || m.days.includes(new Date(date+'T12:00:00').getDay()); }
function daysLabel(m){ return m.days && m.days.length ? 'nur ' + DAYS.filter(([i])=>m.days.includes(i)).map(([,l])=>l).join(', ') : ''; }
function seasonYear(k, date){ const y = +date.slice(0,4), s = S.settings.seasons[k]; if(s.from > s.to){ return date.slice(5) >= s.from ? `${y}/${String(y+1).slice(2)}` : `${y-1}/${String(y).slice(2)}`; } return String(y); }

itemHtml = function(m, s, used, date){
  const alg = itemAlg(m); alg.forEach(a=>used.add(a));
  const img = s.photos && m.id ? menuImg(m) : '';
  const dl = daysLabel(m);
  return `<article class="g-item ${img?'has-ph':''} ${m.top?'is-top':''}">
    ${img ? `<img class="g-ph" src="${IMG[img]}" alt="${esc(m.name)}" loading="lazy">` : ''}
    <div class="g-txt"><div class="g-row"><span class="g-n">${esc(m.name)}${m.veg==='vg'?' <i class="g-mark" title="Vegan">VG</i>':m.veg==='v'?' <i class="g-mark" title="Vegetarisch">V</i>':''}</span><span class="lead"></span>${+m.price ? `<span class="g-p"><span class="cur">€ </span>${fin(+m.price).toLocaleString('de-AT',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>` : ''}</div>
    ${m.top?`<div class="g-top">★ Empfehlung des Hauses</div>`:''}
    ${s.desc && (m.desc || dl) ? `<div class="g-d">${esc(m.desc)}${m.desc&&dl?' · ':''}${dl?`<b class="g-days">${esc(dl)}</b>`:''}</div>` : ''}
    ${s.allergens && alg.length ? `<div class="g-a">${alg.join(' · ')}</div>` : ''}</div>
  </article>`;
};
specialBlock = function(sp, s, used, standalone){
  const sty = sp.style || 'tafel';
  const d1 = new Date(sp.from+'T12:00:00'), d2 = new Date((sp.to||sp.from)+'T12:00:00');
  const f = d => d.toLocaleDateString('de-AT',{weekday:'short', day:'numeric', month:'short'}).replace(/\./g,'');
  const date = sp.to && sp.to !== sp.from ? `${f(d1)} – ${f(d2)}` : d1.toLocaleDateString('de-AT',{weekday:'long', day:'numeric', month:'long'});
  return `<section class="g-special g-sp-${sty} ${standalone?'is-page':''}">
    <div class="g-sp-head"><h3 class="g-sp-title">${esc(sp.name)}</h3><span class="g-sp-date">${esc(date)}</span>${sp.note?`<p class="g-sp-note">${esc(sp.note)}</p>`:''}</div>
    <div class="g-sp-list">${sp.items.map(it => itemHtml({...it, id:'', top:false}, {...s, photos:false}, used)).join('')}</div>
  </section>`;
};
function guestItems(k, date){ const sp = new Set(specialsFor(date).flatMap(x=>x.items.map(i=>i.name))); return menuSorted().filter(m => !m.hidden && inSeason(m, k) && dayOk(m, date) && !sp.has(m.name)); }
guestHtml = function(seasonKey, dateStr){
  dateStr = dateStr || todayStr();
  const k = seasonKey || seasonFor(dateStr) || 'winter';
  const s = S.settings.seasons[k];
  const items = guestItems(k, dateStr);
  const used = new Set();
  const inserts = specialsFor(dateStr).filter(sp => sp.mode !== 'tageskarte');
  let body = inserts.map(sp => specialBlock(sp, s, used)).join('');
  for(const sec of secList()){
    const list = items.filter(m=>m.section===sec); if(!list.length) continue;
    body += `<section class="g-sec"><h3 class="g-h">${ornSvg(s.orn,'g-h-orn')}<span>${esc(sec)}</span></h3><div class="g-list">${list.map(m => itemHtml(m, s, used, dateStr)).join('')}</div></section>`;
  }
  const legend = s.allergens && used.size ? `<div class="g-leg">${[...used].sort().map(a=>`<span><b>${a}</b> ${esc(ALG[a])}</span>`).join('')}</div>` : '';
  const cover = s.cover && IMG[s.cover] ? `<img class="g-cover" src="${IMG[s.cover]}" alt="">` : '';
  return `<div class="g-paper g-${s.layout} g-th-${k}" style="${paperStyle(s)}">
    ${cover}
    <header class="g-head">${ornSvg(s.orn,'g-orn top')}<div class="g-mark-logo">DAHUAM<span>.</span>202</div><h2 class="g-title">${esc(s.title)}</h2>${s.subtitle?`<div class="g-sub">${esc(s.subtitle)}</div>`:''}</header>
    ${body || '<p class="g-empty">Noch keine sichtbaren Gerichte in dieser Saison.</p>'}
    <footer class="g-foot">${ornSvg(s.orn,'g-orn')}<div class="g-keys"><span><i class="g-mark">V</i> vegetarisch</span><span><i class="g-mark">VG</i> vegan</span><span>★ Empfehlung des Hauses</span></div>${legend}<p>${esc(s.footer)}</p><p class="g-stand">${esc(s.title)} ${seasonYear(k, dateStr)} · Stand ${fmtDate(new Date().toISOString())}</p></footer>
  </div>`;
};
tageskarteHtml = function(sp, k){
  k = k || seasonFor(sp.from) || 'winter';
  const base = S.settings.seasons[k]; const used = new Set();
  const pal = sp.style === 'saison' ? base.pal : sp.style === 'festlich' ? {paper:'#1d1a16', ink:'#f3ead8', accent:'#d8b45a', muted:'#b5a990', rule:'#4a4234'} : TAGESBLATT;
  const s = {...base, pal, layout:'alpin', fd: sp.style==='festlich' ? 'Cormorant Garamond' : base.fd, fb: sp.style==='saison' ? base.fb : 'Figtree'};
  const legend = used.size; const inner = specialBlock(sp, s, used, true);
  return `<div class="g-paper g-tk g-alpin g-tk-${sp.style}" style="${paperStyle(s)}">
    <header class="g-head">${ornSvg(sp.style==='saison'?base.orn:'stempel','g-orn top')}<div class="g-mark-logo">DAHUAM<span>.</span>202</div><div class="g-sub">Tageskarte</div></header>${inner}
    <footer class="g-foot">${used.size ? `<div class="g-leg">${[...used].sort().map(a=>`<span><b>${a}</b> ${esc(ALG[a])}</span>`).join('')}</div>` : ''}<p>Nur für kurze Zeit, solange der Vorrat reicht. Preise in Euro inkl. MwSt.</p></footer></div>`;
};
function guestPrevHtml(){
  const date = view.gdate || todayStr(); const k = curSeasonKey();
  const wd = new Date(date+'T12:00:00').getDay();
  const closed = (S.settings.closed||[]).includes(wd) ? `<div class="g-closed">${ico('spark')}${DAYNAME[wd]} ist Ruhetag. So sähe die Karte trotzdem aus.</div>` : '';
  return closed + guestHtml(k, date) + specialsFor(date).filter(sp => sp.mode === 'tageskarte').map(sp=>`<div class="tk-label">Eigene Tageskarte · ${esc(sp.name)}</div>${tageskarteHtml(sp, k)}`).join('');
}
function curSeasonKey(){ return view.gseason || seasonFor(view.gdate || todayStr()) || 'winter'; }
