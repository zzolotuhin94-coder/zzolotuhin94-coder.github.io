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
Object.assign(THEMES, {
  winter:   {theme:'Pulverschnee', layout:'alpin',  pal:{paper:'#eef2f4', ink:'#1b2a3a', accent:'#a3243b', muted:'#5e6e7a', rule:'#b9c6ce'}, fd:'Fraunces', fb:'Karla', orn:'schnee', title:'Winterkarte', subtitle:'Gegenüber der Piste · Fondue, Flammkuchen & Kaiserschmarrn'},
  fruehling:{theme:'Bärlauch',     layout:'alpin',  pal:{paper:'#f3f5ec', ink:'#23331f', accent:'#5f8b2e', muted:'#6e7766', rule:'#c9d4b8'}, fd:'Young Serif', fb:'Figtree', orn:'baerlauch', title:'Frühlingskarte', subtitle:'Bärlauch, Spargel & die ersten Almkräuter'},
  sommer:   {theme:'Almrausch',    layout:'modern', pal:{paper:'#fbfcfa', ink:'#0f3b4a', accent:'#c8325f', muted:'#557079', rule:'#bfd6dc'}, fd:'Bricolage Grotesque', fb:'Work Sans', orn:'bergsee', title:'Sommerkarte', subtitle:'Terrasse, Flammkuchen & kühle Getränke unterm Gerlospass'},
  herbst:   {theme:'Lärchengold',  layout:'alpin',  pal:{paper:'#e6e4d8', ink:'#2e2a1f', accent:'#9e7410', muted:'#6b6655', rule:'#c3bfa8'}, fd:'Alegreya SC', fb:'Alegreya Sans', orn:'laerche', title:'Herbstkarte', subtitle:'Wild, Kürbis & Kastanien aus dem Zillertal'},
});
FONTPAIRS.length = 0;
FONTPAIRS.push(['Fraunces','Karla','Pulverschnee'],['Young Serif','Figtree','Bärlauch'],['Bricolage Grotesque','Work Sans','Almrausch'],['Alegreya SC','Alegreya Sans','Lärchengold'],['Cormorant Garamond','Figtree','Elegant']);
const SERIF_FONTS = ['Fraunces','Young Serif','Alegreya SC','Cormorant Garamond'];
fontStack = (f, serif) => `"${f}",${SERIF_FONTS.includes(f)?'Georgia,serif':'system-ui,sans-serif'}`;
const DAYS = [[1,'Mo'],[2,'Di'],[3,'Mi'],[4,'Do'],[5,'Fr'],[6,'Sa'],[0,'So']];
const DAYNAME = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];

/* ---------- Beispieldaten: Saisongerichte und Aktionen ---------- */
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
/* itemAlg(), hasAlg() und algInfo(): siehe allergen.js (eine Zählung für alle Stellen) */
function dayOk(m, date){ return !m.days || !m.days.length || m.days.includes(new Date(date+'T12:00:00').getDay()); }
function seasonYear(k, date){ const y = +date.slice(0,4), s = S.settings.seasons[k]; if(s.from > s.to){ return date.slice(5) >= s.from ? `${y}/${String(y+1).slice(2)}` : `${y-1}/${String(y).slice(2)}`; } return String(y); }

function guestItems(k, date){ const sp = new Set(specialsFor(date).flatMap(x=>x.items.map(i=>i.name))); return menuSorted().filter(m => !m.hidden && inSeason(m, k) && dayOk(m, date) && !sp.has(m.name)); }
function curSeasonKey(){ return view.gseason || seasonFor(view.gdate || todayStr()) || 'winter'; }
