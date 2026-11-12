/* =====================================================================
   Speisekarte-Gestalter – EIN Modus für die Gästekarte.
   Die Karte besteht aus Bausteinen (Titel, Überschrift, Gericht, Text, Trenner, Foto,
   Leerraum, Seitenumbruch, Aktionen, Legende) auf A4-Blättern (794 × 1123 px).
   Alles sitzt auf einem Raster von 8 px: Höhen werden gemessen und aufs Raster gerundet,
   Spalten gleichen sich selbst aus, kein Gericht wird geteilt. Schief geht nicht.
   Gerichte bleiben mit der Speisekarte verbunden (Schlüssel statt Kopie).
   Vorlagen sind Startpunkte: je Vorlage ein eigenes Blatt-Set (S.settings.karte.docs).
   Dieser Teil: Daten, Vorlagen, Satz und PDF. Die Bedienung steht in gestalter_ed.js.
   Nur Eigenschaften, die html2canvas sauber zeichnet (kein filter, blend, columns,
   text-transform, object-fit, color-mix). Texturen kommen aus dem Canvas.
   ===================================================================== */
const GS_W = 794, GS_H = 1123, GS_U = 8, GS_BODY_H = 984;
const GS_BG = {
  papier:  {name:'Papier',   col:'#f2ebdc', dark:false},
  leinen:  {name:'Leinen',   col:'#f4f0e6', dark:false},
  weiss:   {name:'Weiß',     col:'#ffffff', dark:false},
  schiefer:{name:'Schiefer', col:'#1d2024', dark:true, ink:'#efe7d8'},
  holz:    {name:'Holz',     col:'#2a1c12', dark:true, ink:'#f1e6d0'},
  kreide:  {name:'Kreide',   col:'#232a2b', dark:true, ink:'#f3efe4'},
};
const GS_ORN = {berg:'Berge', linie:'Linie', schnoerkel:'Schnörkel', kreide:'Kreidestrich'};
/* Schriftpaare: Überschrift · Gericht · Fließtext · Preis. caps = Überschriften in Versalien (in JS, nicht per CSS). */
const GS_FONT = {
  haus:    {name:'Haus',     caps:true,  load:['600 20px "Barlow Condensed"','500 20px "Barlow Condensed"','400 20px "Fraunces"','500 20px "Fraunces"','italic 400 20px "Fraunces"']},
  alpin:   {name:'Alpin',    caps:false, load:['400 20px "Fraunces"','500 20px "Fraunces"','italic 400 20px "Fraunces"','400 20px "Source Serif 4"','italic 400 20px "Source Serif 4"']},
  elegant: {name:'Elegant',  caps:false, load:['400 20px "Cormorant Garamond"','500 20px "Cormorant Garamond"','600 20px "Cormorant Garamond"','italic 400 20px "Cormorant Garamond"','italic 500 20px "Cormorant Garamond"']},
  kreide:  {name:'Kreide',   caps:false, load:['500 20px "Caveat"','600 20px "Caveat"','400 20px "Barlow Condensed"','500 20px "Barlow Condensed"']},
  bar:     {name:'Bar',      caps:true,  load:['500 20px "Barlow Condensed"','600 20px "Barlow Condensed"','400 20px "Barlow Condensed"','italic 400 20px "Fraunces"']},
  schlicht:{name:'Schlicht', caps:false, load:['600 20px "Source Serif 4"','400 20px "Source Serif 4"','400 20px "Figtree"','600 20px "Figtree"']},
};
/* Vorlagen. acc: [Name, Farbe auf dunklem Grund, Farbe auf hellem Grund] – je Vorlage drei, die zueinander passen. */
const GS_LOOKS = {
  haus:     {name:'Hauskarte',     sub:'Schiefer und Gold', ink:'#1f2328', cover:true,  cols:2, scope:'alles',
             fx:{bg:'schiefer', orn:'berg', font:'haus', acc:0, cap:false, gold:true, frame:true, ill:true, ctr:false},
             acc:[['Gold','#C59C69','#8f6a35'],['Kupfer','#cf8f63','#9c5a30'],['Gletscher','#a9c3d6','#4f7289']]},
  alpin:    {name:'Alpin',         sub:'Papier, Berge, warmes Holz', ink:'#1b2a3a', cover:true, cols:2, scope:'alles',
             fx:{bg:'papier', orn:'berg', font:'alpin', acc:0, cap:true, gold:false, frame:true, ill:true, ctr:false},
             acc:[['Preiselbeere','#e79a90','#8e2f2a'],['Tanne','#a9c79a','#3d5a3a'],['Lärche','#e0b36a','#8a5a1c']]},
  elegant:  {name:'Elegant',       sub:'Viel Luft, eine Spalte', ink:'#23201c', cover:true, cols:1, scope:'alles',
             fx:{bg:'leinen', orn:'schnoerkel', font:'elegant', acc:0, cap:false, gold:false, frame:false, ill:false, ctr:true},
             acc:[['Bordeaux','#dda3ab','#6d2632'],['Flaschengrün','#a8c9b8','#2f4a3c'],['Graphit','#cfcac0','#3a3a3a']]},
  kreide:   {name:'Kreidetafel',   sub:'Für Tageskarte und Aktionen', ink:'#22282b', cover:false, cols:1, title:'Heute an der Tafel', scope:'tafel',
             fx:{bg:'kreide', orn:'kreide', font:'kreide', acc:0, cap:false, gold:false, frame:true, ill:false, ctr:true},
             acc:[['Kreidegelb','#f2d77c','#8a6a12'],['Kreiderosa','#f0a99c','#a4483a'],['Kreideblau','#a9d3e0','#2f6a80']]},
  getraenke:{name:'Getränkekarte', sub:'Bier, Wein, Kaffee, Cocktails', ink:'#1d2b26', cover:false, cols:2, colMin:2, title:'Getränkekarte', scope:'getraenke', by:'cat',
             fx:{bg:'holz', orn:'linie', font:'bar', acc:0, cap:false, gold:false, frame:false, ill:false, ctr:false},
             acc:[['Messing','#d9b168','#8a6420'],['Hopfen','#b9cc82','#4c6420'],['Schaum','#f1e6d0','#3b2a1c']]},
  schlicht: {name:'Schlicht',      sub:'Wenig Farbe, gut für den Bürodrucker', ink:'#1d1d1b', cover:false, cols:2, scope:'alles',
             fx:{bg:'weiss', orn:'linie', font:'schlicht', acc:0, cap:false, gold:false, frame:false, ill:false, ctr:false},
             acc:[['Tinte','#e8e4da','#1d1d1b'],['Tanne','#a9c79a','#2f5d4a'],['Preiselbeere','#e79a90','#8e2f2a']]},
};
const GS_SCOPE = [['alles','Alles'],['speisen','Speisen'],['getraenke','Getränke'],['tafel','Tafel']];
/* Getränke nach Art (nur für die Getränkekarte): Reihenfolge = Reihenfolge der Überschriften */
const GS_CAT = [
  ['aperitif','Aperitif & Cocktails', /aperiti|cocktail|\bspritz\b|hugo|\bgin\b|mojito|negroni|\bsour\b|tonic|aperol|sprizz|\bsekt\b|prosecco|champagner|frizzante/i],
  ['bier','Bier', /bier|märzen|maerzen|\bpils|radler|weizen|zwickl|\bhelles\b|vom fass|\blager\b|\bbock\b/i],
  ['wein','Wein', /wein|veltliner|zweigelt|riesling|spritzer|ros[ée]\b|blaufränk|chardonnay|sauvignon|muskateller|merlot|cuv[ée]e|burgunder|traminer|lagrein|schilcher/i],
  ['schnaps','Schnaps & Spirituosen', /schnaps|schnäpse|obstler|\bbrand\b|zirbe|lik[öo]r|whisk|\brum\b|w?vodka|wodka|grappa|williams|marille|enzian|j[äa]ger|cognac|spirituose/i],
  ['kaffee','Kaffee & Tee', /kaffee|espresso|cappuccino|latte|melange|verlängert|\btee\b|kakao|schokolade|chai|macchiato/i],
  ['alkfrei','Alkoholfrei', null],
];
function gsCat(m){ const s = m.name + ' ' + (m.section === 'Getränke' ? '' : m.section); const c = GS_CAT.find(c => c[2] && c[2].test(s)); return c ? c[0] : 'alkfrei'; }
const GS_PHOTOS = {stube:['photos/unmatched/gaststube.webp','Gaststube'], aussen:['photos/unmatched/aussen-winter.webp','Haus im Winter'], fondue:['photos/unmatched/silvesterabend-fondue.webp','Fondue-Abend']};

/* ---------- Zustand, Umstellung alter Stände ---------- */
function gsMigrate(d){
  const s = d.settings; if(!s) return d;
  if(!s.karte || typeof s.karte !== 'object' || !s.karte.docs || typeof s.karte.docs !== 'object'){
    // bisherige Wahl „Hauskarte“ / „Schlicht“ bleibt als Vorlage erhalten
    s.karte = {v:1, cur: s.guestStyle === 'schlicht' ? 'schlicht' : 'haus', docs:{}};
  }
  if(!GS_LOOKS[s.karte.cur]) s.karte.cur = 'haus';
  for(const k of Object.keys(s.karte.docs)){ const doc = s.karte.docs[k]; if(!GS_LOOKS[k] || !doc || !Array.isArray(doc.blocks)){ delete s.karte.docs[k]; continue; }
    doc.blocks = doc.blocks.filter(b => b && typeof b === 'object' && typeof b.t === 'string'); doc.blocks.forEach(b => { if(typeof b.id !== 'string' || !/^[\w-]{1,40}$/.test(b.id)) b.id = uid('b'); if(b.t === 'dish' && typeof b.key !== 'string') b.key = ''; }); if(!Array.isArray(doc.hide)) doc.hide = []; doc.hide = doc.hide.filter(x => typeof x === 'string'); if(!GS_SCOPE.some(o => o[0] === doc.scope)) doc.scope = GS_LOOKS[k].scope; if(!doc.fx || typeof doc.fx !== 'object') doc.fx = {}; }
  delete s.guestStyle; delete s.kidsSheet;
  return d;
}
function gsState(){ let k = S.settings.karte; if(!k || typeof k !== 'object' || !k.docs){ gsMigrate(S); k = S.settings.karte; } return k; }
function gsKey(m){ return m.group ? 'g:' + m.group : 'm:' + m.id; }
function gsIsDrink(m){ return isDrinkEntry(m); }
/* alle Einträge der Speisekarte (Varianten zusammengefasst), in der Reihenfolge der Gerichte-Liste */
function gsAll(){ const map = new Map(); for(const m of menuSorted()){ const k = gsKey(m); let e = map.get(k); if(!e){ e = {key:k, section:m.section, vars:[]}; map.set(k, e); } e.vars.push(m); } return map; }
function gsWants(doc, e){ const d = e.vars.some(gsIsDrink); return doc.scope === 'getraenke' ? d : doc.scope === 'speisen' ? !d : true; }
function gsHome(doc, e){ return doc.by === 'cat' && e.vars.some(gsIsDrink) ? 'cat:' + gsCat(e.vars[0]) : e.section; }
function gsHeadName(b){ if(b.txt != null && b.txt !== '') return b.txt; const s = b.sec || ''; if(s.startsWith('cat:')){ const c = GS_CAT.find(c => c[0] === s.slice(4)); return c ? c[1] : ''; } return s; }
/* Eine Vorlage aus der laufenden Speisekarte aufbauen */
function gsBuild(look){
  const L = GS_LOOKS[look]; const doc = {fx:{...L.fx}, scope:L.scope, blocks:[], hide:[]}; if(L.by) doc.by = L.by;
  const add = o => { o.id = uid('b'); doc.blocks.push(o); return o; };
  add({t:'title', full:!!L.cover}); add({t:'aktion'});
  const ents = [...gsAll().values()].filter(e => gsWants(doc, e)); const homes = [];
  if(L.by === 'cat') GS_CAT.forEach(c => homes.push('cat:' + c[0])); else secList().forEach(s => homes.push(s));
  ents.forEach(e => { const h = gsHome(doc, e); if(!homes.includes(h)) homes.push(h); });
  for(const h of homes){ const list = ents.filter(e => gsHome(doc, e) === h); if(!list.length) continue;
    add({t:'head', sec:h, cols: L.cols === 2 && list.length >= (L.colMin || 6) ? 2 : 1}); list.forEach(e => add({t:'dish', key:e.key})); }
  add({t:'legend'});
  return doc;
}
function gsDoc(){ const st = gsState(); let d = st.docs[st.cur]; if(!d || !Array.isArray(d.blocks)){ d = st.docs[st.cur] = gsBuild(st.cur); GS.touched = true; } return d; }
/* Abgleich mit der Speisekarte: neue Gerichte ans Ende ihres Abschnitts, gelöschte hinaus. Die Anordnung bleibt sonst, wie sie ist. */
function gsSync(doc){
  const all = gsAll(); let ch = false; const bl = doc.blocks;
  for(let i = bl.length - 1; i >= 0; i--) if(bl[i].t === 'dish' && !all.has(bl[i].key)){ bl.splice(i, 1); ch = true; }
  const n0 = doc.hide.length; doc.hide = doc.hide.filter(k => all.has(k)); if(doc.hide.length !== n0) ch = true;
  const have = new Set(bl.filter(b => b.t === 'dish').map(b => b.key));
  // umbenannte Kategorie: die Überschrift folgt ihren Gerichten
  const secs = new Set(secList());
  bl.forEach((b, i) => { if(b.t !== 'head' || !b.sec || b.sec.startsWith('cat:') || secs.has(b.sec)) return; const nx = bl[i + 1]; const e = nx && nx.t === 'dish' && all.get(nx.key); if(e && !bl.some(o => o.t === 'head' && o.sec === e.section)){ b.sec = e.section; ch = true; } });
  for(const e of all.values()){
    if(have.has(e.key) || doc.hide.includes(e.key) || !gsWants(doc, e)) continue;
    const home = gsHome(doc, e); let at = -1;
    for(let i = 0; i < bl.length; i++){ if(bl[i].t !== 'dish') continue; const o = all.get(bl[i].key); if(o && gsHome(doc, o) === home) at = i; }
    if(at < 0){ const h = bl.findIndex(b => b.t === 'head' && b.sec === home); if(h >= 0){ at = h; while(at + 1 < bl.length && bl[at + 1].t === 'dish') at++; } }
    const nb = {id:uid('b'), t:'dish', key:e.key};
    if(at >= 0) bl.splice(at + 1, 0, nb);
    else { let end = bl.findIndex(b => b.t === 'legend'); if(end < 0) end = bl.length; bl.splice(end, 0, {id:uid('b'), t:'head', sec:home, cols:1}, nb); }
    have.add(e.key); ch = true;
  }
  if(!bl.some(b => b.t === 'legend')){ bl.push({id:uid('b'), t:'legend'}); ch = true; }
  if(ch) GS.touched = true;
  return ch;
}
const GS = {touched:false, tex:{}, texP:{}, fontOk:new Set(), pend:false};
function gsFlush(){ if(GS.touched){ GS.touched = false; save(); } }

/* ---------- Farben ---------- */
function gsRgb(h){ const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; }
function gsMix(a, b, f){ const x = gsRgb(a), y = gsRgb(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * f).toString(16).padStart(2, '0')).join(''); }
function gsFx(doc, look){ const L = GS_LOOKS[look], f = {...L.fx, ...(doc.fx || {})}, has = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
  if(!has(GS_BG, f.bg)) f.bg = L.fx.bg; if(!has(GS_FONT, f.font)) f.font = L.fx.font; if(!has(GS_ORN, f.orn)) f.orn = L.fx.orn; f.acc = [0, 1, 2].includes(f.acc) ? f.acc : 0;
  for(const k of ['cap', 'gold', 'frame', 'ill', 'ctr']) f[k] = !!f[k]; return f; }

/* ---------- Texturen (einmal je Hintergrund, aus dem Canvas) ---------- */
function gsRand(seed){ let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
function gsTexMake(bg){
  if(bg === 'weiss') return Promise.resolve('');
  const W = 1191, H = 1685; const [c, g] = hsCan(W, H); const r = gsRand(bg.length * 77 + 5);
  const fin = () => hsUrl(c, 'image/jpeg', .88);
  if(bg === 'schiefer' || bg === 'holz') return hsLoadImg(bg === 'schiefer' ? 'brand/slate.webp' : 'brand/table.webp').then(img => {
    if(bg === 'holz'){ const [c2, g2] = hsCan(W / 4, H / 4); hsDrawCover(g2, img, W / 4, H / 4); g.imageSmoothingQuality = 'high'; g.drawImage(c2, 0, 0, W, H); g.globalAlpha = .35; hsDrawCover(g, img, W, H); g.globalAlpha = 1; } else hsDrawCover(g, img, W, H);
    g.fillStyle = bg === 'schiefer' ? 'rgba(12,13,16,.2)' : 'rgba(20,11,5,.7)'; g.fillRect(0, 0, W, H); hsVignette(g, W, H, bg === 'schiefer' ? .08 : .05, .5); return fin(); });
  g.fillStyle = GS_BG[bg].col; g.fillRect(0, 0, W, H);
  if(bg === 'papier'){
    for(let i = 0; i < 26000; i++){ g.fillStyle = r() > .5 ? `rgba(120,96,60,${(r() * .05).toFixed(3)})` : `rgba(255,255,255,${(r() * .09).toFixed(3)})`; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    g.lineWidth = .7; for(let i = 0; i < 420; i++){ const x = r() * W, y = r() * H, a = r() * 6.3, l = 8 + r() * 26; g.strokeStyle = `rgba(110,84,50,${(.03 + r() * .06).toFixed(3)})`; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5 + (r() - .5) * 8, y + Math.sin(a) * l * .5 + (r() - .5) * 8, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    const gr = g.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .72); gr.addColorStop(0, 'rgba(150,118,70,0)'); gr.addColorStop(1, 'rgba(150,118,70,.16)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  } else if(bg === 'leinen'){
    for(let y = 0; y < H; y += 3){ g.fillStyle = `rgba(120,105,80,${(r() * .035).toFixed(3)})`; g.fillRect(0, y, W, 1); }
    for(let x = 0; x < W; x += 3){ g.fillStyle = `rgba(120,105,80,${(r() * .03).toFixed(3)})`; g.fillRect(x, 0, 1, H); }
    for(let i = 0; i < 9000; i++){ g.fillStyle = `rgba(255,255,255,${(r() * .12).toFixed(3)})`; g.fillRect(r() * W, r() * H, 2, 2); }
  } else if(bg === 'kreide'){
    for(let i = 0; i < 70; i++){ const x = r() * W, y = r() * H, rx = 120 + r() * 420; const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, `rgba(255,255,255,${(.012 + r() * .03).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - rx, y - rx, rx * 2, rx * 2); }
    g.lineCap = 'round'; for(let i = 0; i < 46; i++){ const x = r() * W, y = r() * H, l = 200 + r() * 700, a = -.5 + r() * .35; g.strokeStyle = `rgba(255,255,255,${(.008 + r() * .016).toFixed(3)})`; g.lineWidth = 18 + r() * 70; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    for(let i = 0; i < 14000; i++){ g.fillStyle = `rgba(255,255,255,${(r() * .05).toFixed(3)})`; g.fillRect(r() * W, r() * H, 1 + r(), 1 + r()); }
    const gr = g.createRadialGradient(W / 2, H / 2, H * .32, W / 2, H / 2, H * .75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.38)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  return Promise.resolve(fin());
}
function gsTex(bg){ if(!GS.texP[bg]) GS.texP[bg] = gsTexMake(bg).then(u => { GS.tex[bg] = u || ''; }, () => { GS.tex[bg] = ''; }); return GS.texP[bg]; }
/* Schriften und Textur dieser Karte laden; true = schon alles da */
function gsReadyNow(fx){ return GS.tex[fx.bg] != null && GS.fontOk.has(fx.font) && GS.logo != null; }
function gsEnsure(fx){
  const f = GS.fontOk.has(fx.font) ? Promise.resolve() : Promise.all(GS_FONT[fx.font].load.concat(['400 20px "Caveat"']).map(x => document.fonts.load(x, 'Äß09').catch(() => 0))).then(() => { GS.fontOk.add(fx.font); });
  if(!GS.logoP) GS.logoP = hsLoadImg('brand/logo.svg').then(img => { const [c, g] = hsCan(440, Math.round(440 * (img.height || 1) / (img.width || 1))); g.drawImage(img, 0, 0, c.width, c.height); GS.logo = hsUrl(c, 'image/png'); }).catch(() => { GS.logo = ''; });
  return Promise.all([f, gsTex(fx.bg), GS.logoP]);
}

/* ---------- Ornamente (eigenständige SVGs mit festen Farben) ---------- */
function gsDivider(x, wide){
  const c = x.ac, o = x.fx.orn;
  if(o === 'kreide') return `<div class="gs-dv k">${hsSvg('<path d="M3,6 C40,2 78,9 118,5 S196,8 236,4 S282,7 297,5"/><path d="M30,9 C90,7 150,10 262,8" stroke-opacity=".45"/>', '0 0 300 12', wide ? 300 : 220, wide ? 12 : 9, c, 2.2)}</div>`;
  const gl = o === 'berg' ? hsSvg('<path d="M0,12 L12,12 L21,4 L26,9 L34,1 L43,10 L48,6 L53,12 L66,12"/>', '0 0 66 14', 66, 14, c, 1.3)
    : o === 'schnoerkel' ? hsSvg('<path d="M46,8 c-6,-8 -17,-8 -21,-2 c-3,5 4,9 7,4 M46,8 c6,-8 17,-8 21,-2 c3,5 -4,9 -7,4 M0,8 h20 M72,8 h20"/><path d="M46,5 l3,3 l-3,3 l-3,-3 z" fill="' + c + '"/>', '0 0 92 16', 92, 16, c, 1.1)
    : '<b></b>';
  return `<div class="gs-dv${wide ? ' w' : ''}"><i></i>${gl}<i></i></div>`;
}
function gsOrnBlock(x){
  const o = x.fx.orn, c = x.ac;
  if(o === 'berg') return hsRidge(x.k, 664, c, 1.2);
  if(o === 'schnoerkel') return hsSvg('<path d="M110,20 c-14,-20 -42,-20 -52,-6 c-8,12 9,22 17,10 M110,20 c14,-20 42,-20 52,-6 c8,12 -9,22 -17,10 M0,20 h46 M174,20 h46 M110,34 c-8,-6 -8,-12 0,-18 c8,6 8,12 0,18"/>', '0 0 220 40', 220, 40, c, 1.1);
  if(o === 'kreide') return hsSvg('<path d="M6,22 C80,14 150,28 230,19 S380,26 460,17 S560,24 594,20"/><path d="M60,29 C180,25 300,31 520,27" stroke-opacity=".4"/><path d="M300,2 l2,6 6,1 -5,4 2,6 -5,-4 -5,4 2,-6 -5,-4 6,-1z M120,4 l1,4 4,0 -3,3 1,4 -3,-3 -3,3 1,-4 -3,-3 4,0z M480,3 l1,4 4,0 -3,3 1,4 -3,-3 -3,3 1,-4 -3,-3 4,0z" stroke-opacity=".8"/>', '0 0 600 34', 600, 34, c, 2.2);
  return `<div class="gs-rule3"><i></i><b></b><i></i></div>`;
}
const GS_DIA = c => `<svg class="gs-top" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="9" height="9" aria-hidden="true"><path d="M5,0 L10,5 L5,10 L0,5z" fill="${c}"/></svg>`;

/* ---------- Bausteine als HTML ---------- */
function gsInfo(vars){
  const m = vars[0], multi = vars.length > 1 || !!(m.group && m.vlabel);
  const ai = algOfVars(vars), alg = ai.letters.concat(ai.open ? [ALG_MARK] : []);
  const veg = vars.every(v => v.veg === 'vg') ? 'vg' : vars.every(v => v.veg === 'v' || v.veg === 'vg') ? 'v' : '';
  const drink = vars.some(v => guestVol(v));   // Getränke: die Menge steht vor jedem Preis
  return {name:m.name, desc:[m.desc, hkDays(m)].filter(Boolean).join(' · '), alg, veg, top:vars.some(v => v.top), seasonal:vars.some(v => v.seasons && v.seasons.length), drink, multi,
    prices: drink ? vars.map(v => [guestVol(v) || v.vlabel || (multi ? v.name : ''), v.price]) : multi ? vars.map(v => [v.vlabel || v.name, v.price]) : [['', m.price]]};
}
function gsDishHtml(b, d, x, plain){
  d.alg.forEach(a => x.used.add(a)); if(d.veg) x.marks.add(d.veg); if(d.seasonal) x.marks.add('s');
  const fr = !plain && x.fx.frame && (b.fr === 1 || (b.fr == null && d.top));
  if(d.top && !fr && !plain) x.marks.add('t'); if(fr) x.marks.add('f');
  const pre = (d.top && !fr && !plain ? GS_DIA(x.ac) : '') + (d.seasonal ? `<span class="gs-gl">${hsGl(x.gl, 12, x.ac)}</span>` : '');
  const veg = d.veg ? `<span class="gs-vg">${d.veg}</span>` : '';
  const al = d.alg.length ? `<span class="gs-al">${d.alg.join(' ')}</span>` : '';
  const pr = ([l, p]) => `<span class="gs-p">${l ? `<small>${esc(l)}</small>` : ''}${+p ? hkPrice(p) : ''}</span>`;
  const rows = !d.drink && d.multi;
  const price = rows ? '' : d.prices.length === 1 ? pr(d.prices[0]) : `<span class="gs-ps">${d.prices.map(pr).join('')}</span>`;
  return `<div class="gs-u ${plain ? '' : 'gs-b '}gs-d${fr ? ' fr' : ''}${d.drink ? ' dr' : ''}"${plain ? '' : ` data-b="${b.id}" data-k="dish"`}>${fr ? `<span class="gs-tab">${x.T('Empfehlung des Hauses')}</span>` : ''}<div class="gs-l"><span class="gs-n">${pre}${esc(d.name)}${veg}${d.desc ? '' : al}</span><i class="gs-lead"></i>${price}</div>${d.desc ? `<p class="gs-ds">${esc(d.desc)}${al}</p>` : ''}${rows ? d.prices.map(([l, p]) => `<div class="gs-v"><span>${esc(l)}</span><i class="gs-lead"></i><span class="gs-p">${+p ? hkPrice(p) : ''}</span></div>`).join('') : ''}</div>`;
}
function gsCapHtml(t, x){ t = String(t); if(!x.fx.cap || !t) return x.T(t); const ch = [...t]; return `<span class="gs-cap">${x.T(ch[0])}</span>${x.T(ch.slice(1).join(''))}`; }
function gsHeadHtml(b, x, cont){
  const name = gsHeadName(b); const intro = b.intro != null ? b.intro : (b.sec && !b.sec.startsWith('cat:') ? hsCopy('sec', b.sec) : '');
  if(cont) return `<div class="gs-u gs-h gs-cont"><div class="gs-ht"><h3 class="gs-hn">${x.T(name)}</h3><p class="gs-hi">Fortsetzung</p></div></div>`;
  const ill = x.fx.ill && name ? `<div class="gs-ill">${hsIll(name, 52, x.dark ? x.ac : x.ink, 1.4)}</div>` : '';
  return `<div class="gs-u gs-b gs-h" data-b="${b.id}" data-k="head">${ill}<div class="gs-ht"><h3 class="gs-hn">${gsCapHtml(name, x)}</h3>${intro ? `<p class="gs-hi">${esc(intro)}</p>` : ''}</div>${gsDivider(x)}</div>`;
}
function gsLogo(x, size){ return `<span class="gs-plq" style="width:${size}px;height:${size}px"><img src="${GS.logo || 'brand/logo.svg'}" alt="${esc(S.settings.name)}" width="${Math.round(size * .74)}" height="${Math.round(size * .74)}"></span>`; }
function gsTitleParts(x){ const own = (x.tb && x.tb.txt) || (x.look === 'kreide' ? hsCopy('tafel') : x.L.title) || ''; return {title: own || String(x.s.title || HK_TITLE[x.k] || 'Speisekarte'), year: own ? '' : seasonYear(x.k, x.date), sub:x.s.subtitle == null ? HK_PLACE : x.s.subtitle}; }
function gsTitleHtml(b, x){
  const t = gsTitleParts(x);
  return `<div class="gs-u gs-b gs-ti" data-b="${b.id}" data-k="title">${gsLogo(x, 72)}<div class="gs-tx"><h2 class="gs-tt">${x.T(t.title)}${t.year ? ` <span>${esc(t.year)}</span>` : ''}</h2>${t.sub ? `<p class="gs-ts">${esc(t.sub)}</p>` : ''}</div>${gsDivider(x, true)}</div>`;
}
function gsCoverHtml(b, x){
  const t = gsTitleParts(x); const cover = x.s.cover && IMG[x.s.cover]; const claim = hsCopy('claim');
  const art = cover ? `<div class="gs-cv-im" style="background-image:url('${cover}')"></div>` : x.fx.orn === 'berg' ? `<div class="gs-cv-or">${hsRidge(x.k, 794, x.ac, 1.25)}</div>` : `<div class="gs-cv-or s">${gsOrnBlock(x)}</div>`;
  return `<div class="gs-u gs-b gs-cv" data-b="${b.id}" data-k="title">
    ${t.sub ? `<p class="gs-cv-eb">${esc(t.sub)}</p>` : ''}${gsLogo(x, 148)}
    <h2 class="gs-tt gs-cv-t">${x.T(t.title)}</h2>
    <div class="gs-cv-y"><i></i>${hsGl(x.gl, 15, x.ac)}${t.year ? `<span>${esc(t.year)}</span>` : ''}${hsGl(x.gl2, 15, x.ac)}<i></i></div>
    ${art}${claim ? `<p class="gs-cv-c">${esc(claim)}</p>` : ''}${S.settings.address ? `<p class="gs-cv-a">${esc(S.settings.address)}</p>` : ''}</div>`;
}
function gsPhotoSrc(b){ if(b.src && b.src.startsWith('img:')) return IMG[b.src.slice(4)] || ''; return (GS_PHOTOS[b.src] || GS_PHOTOS.stube)[0]; }
function gsAktionHtml(b, sp, x){
  const items = sp.items.map(it => ({...it, id:'', top:false, group:'', days:[], seasons:[]}));
  return `<div class="gs-u gs-b gs-ak" data-b="${b.id}" data-k="aktion"><span class="gs-tab">${x.T(hsRange(sp.from, sp.to))}</span><h3 class="gs-akn">${esc(sp.name)}</h3>${sp.note ? `<p class="gs-hi">${esc(sp.note)}</p>` : ''}${hkEntries(items).map(e => gsDishHtml(null, gsInfo(e.vars), x, true)).join('')}</div>`;
}
function gsLegendHtml(b, x){
  const used = [...x.used].filter(a => ALG[a]).sort(); const mk = [];
  if(x.marks.has('v')) mk.push('<span><span class="gs-vg">v</span> vegetarisch</span>'); if(x.marks.has('vg')) mk.push('<span><span class="gs-vg">vg</span> vegan</span>');
  if(x.marks.has('s')) mk.push(`<span>${hsGl(x.gl, 12, x.ac)} saisonal</span>`); if(x.marks.has('t')) mk.push(`<span>${GS_DIA(x.ac)} Empfehlung des Hauses</span>`);
  return `<div class="gs-u gs-b gs-lg" data-b="${b.id}" data-k="legend">${gsDivider(x, true)}${used.length ? `<p class="gs-lgh">${x.T('Allergene & Zeichen')}</p><div class="gs-lgl">${used.map(a => `<span><b>${a}</b> ${esc(ALG[a])}</span>`).join('')}</div>` : ''}${mk.length ? `<div class="gs-mk">${mk.join('')}</div>` : ''}${x.used.has(ALG_MARK) ? `<p class="gs-fn alg-open">${esc(algOpenText())}</p>` : ''}<p class="gs-fn">${esc(x.s.footer || 'Alle Preise in Euro inkl. MwSt.')}</p></div>`;
}

/* ---------- Satz: Bausteine → Einheiten → messen → Blätter ---------- */
function gsCtx(doc, look, k, date, opts){
  const L = GS_LOOKS[look], fx = gsFx(doc, look);
  const bg = GS_BG[fx.bg], dark = bg.dark, ink = dark ? bg.ink : L.ink; const a = L.acc[fx.acc] || L.acc[0], ac = a[dark ? 1 : 2];
  const mut = gsMix(ink, bg.col, .34), ln = gsMix(ink, bg.col, .72), gold = dark ? '#d6b27a' : '#9a7436';
  const caps = GS_FONT[fx.font].caps; const sea = HS_SEASON[k] || HS_SEASON.winter;
  const vis = new Map(); const sc = GS_SCOPE.some(o => o[0] === doc.scope) ? doc.scope : 'alles';
  for(const m of guestItems(k, date)){ const d = gsIsDrink(m); if(sc === 'speisen' && d || sc === 'getraenke' && !d) continue; const key = gsKey(m); if(!vis.has(key)) vis.set(key, []); vis.get(key).push(m); }
  if(sc === 'tafel') for(const [key, vars] of [...vis]) if(!vars.some(v => v.top || (v.seasons && v.seasons.length))) vis.delete(key);
  const tex = GS.tex[fx.bg];
  return {look, L, tb:doc.blocks.find(b => b.t === 'title'), fx, bg, dark, ink, ac, mut, ln, gold, k, date, s:S.settings.seasons[k], vis, used:new Set(), marks:new Set(), gl:sea.gl[0], gl2:sea.gl[1], print:!!opts.print,
    T: s => esc(caps ? String(s == null ? '' : s).toLocaleUpperCase('de-AT') : s),
    cls:`gs-page gs-f-${fx.font} gs-o-${fx.orn} gs-bg-${fx.bg}${dark ? ' gs-dark' : ''}${fx.ctr ? ' gs-ctr' : ''}${fx.gold ? ' gs-gold' : ''}`,
    style:`--ink:${ink};--mut:${mut};--ln:${ln};--ac:${ac};--gold:${gold};--pg:${bg.col};background-color:${bg.col}${tex ? `;background-image:url('${tex}')` : ''}`};
}
function gsFlow(doc, x){
  const bl = doc.blocks, flow = []; let legend = null, lc = 1;
  for(let i = 0; i < bl.length;){
    const b = bl[i];
    if(b.t === 'head' || b.t === 'dish'){
      const head = b.t === 'head' ? b : null; let j = head ? i + 1 : i; const items = [];
      while(j < bl.length && bl[j].t === 'dish'){ const vars = x.vis.get(bl[j].key); if(vars) items.push({b:bl[j], html:gsDishHtml(bl[j], gsInfo(vars), x)}); j++; }
      if(head) lc = head.cols === 2 ? 2 : 1;
      if(items.length || (head && !head.sec)) flow.push({type:'run', cols:lc, head: head ? {html:gsHeadHtml(head, x)} : null, cont: head ? {html:gsHeadHtml(head, x, true)} : null, items});
      i = j; continue;
    }
    i++;
    if(b.t === 'title') flow.push(b.full ? {type:'page', html:gsCoverHtml(b, x)} : {type:'blk', html:gsTitleHtml(b, x), title:true});
    else if(b.t === 'aktion') specialsFor(x.date).forEach(sp => flow.push({type:'blk', ak:1, html:gsAktionHtml(b, sp, x)}));
    else if(b.t === 'text'){ if(String(b.txt || '').trim() || !x.print) flow.push({type:'blk', html:`<div class="gs-u gs-b gs-t${b.al === 'l' ? ' al-l' : b.al === 'c' ? ' al-c' : ''}${b.hand ? ' hand' : ''}${String(b.txt || '').trim() ? '' : ' empty'}" data-b="${b.id}" data-k="text"><p>${esc(String(b.txt || '').trim() || 'Text').replace(/\n/g, '<br>')}</p></div>`}); }
    else if(b.t === 'orn') flow.push({type:'blk', html:`<div class="gs-u gs-b gs-or" data-b="${b.id}" data-k="orn">${gsOrnBlock(x)}</div>`});
    else if(b.t === 'photo'){ const src = gsPhotoSrc(b); flow.push({type:'blk', html:`<div class="gs-u gs-b gs-f s-${b.size === 's' || b.size === 'l' ? b.size : 'm'}" data-b="${b.id}" data-k="photo"><div class="gs-im"${src ? ` style="background-image:url('${src}')"` : ''}></div>${b.cap ? `<p class="gs-fc">${esc(b.cap)}</p>` : ''}</div>`}); }
    else if(b.t === 'space') flow.push({type:'blk', html:`<div class="gs-u gs-b gs-sp s-${b.size === 's' || b.size === 'l' ? b.size : 'm'}" data-b="${b.id}" data-k="space"></div>`});
    else if(b.t === 'break') flow.push({type:'break', b});
    else if(b.t === 'legend'){ legend = {type:'blk', b}; flow.push(legend); }
  }
  if(!flow.some(f => f.type === 'run' ? f.items.length : f.ak) && !x.print) flow.splice(legend ? flow.indexOf(legend) : flow.length, 0, {type:'blk', html:`<div class="gs-u gs-t al-c empty"><p>${sc0(x)}</p></div>`});
  if(legend) legend.html = gsLegendHtml(legend.b, x);
  return flow;
}
function sc0(x){ return S.menu.length ? 'In dieser Vorlage steht für diesen Tag noch nichts. Unter „Tag“ lässt sich der Inhalt der Vorlage ändern.' : 'Noch keine Gerichte in der Speisekarte.'; }
function gsHost(){ let h = document.getElementById('gsMeasure'); if(!h){ h = document.createElement('div'); h.id = 'gsMeasure'; h.className = 'gs-measure'; h.setAttribute('aria-hidden', 'true'); document.body.appendChild(h); } return h; }
function gsSplit(hs){ const tot = hs.reduce((a, b) => a + b, 0); let acc = 0, k = 0; while(k < hs.length && acc < tot / 2 - .5){ acc += hs[k]; k++; } return {k, h:Math.max(acc, tot - acc)}; }
function gsPages(opts){
  opts = opts || {}; const st = gsState(), look = st.cur, doc = gsDoc(); gsSync(doc);
  const date = opts.date || view.gdate || todayStr(), k = opts.k || curSeasonKey();
  const x = gsCtx(doc, look, k, date, opts), flow = gsFlow(doc, x);
  // messen: alles einmal einsetzen, dann alle Höhen in einem Zug lesen
  const host = gsHost(); host.innerHTML = `<article class="${x.cls}" style="${x.style}"><div class="gs-body gs-mf"></div><div class="gs-body gs-mf"><div class="gs-cols"><div class="gs-col"></div><div class="gs-col"></div></div></div><div class="gs-mp"></div></article>`;
  const full = host.querySelector('.gs-body'), col = host.querySelector('.gs-col'), pg = host.querySelector('.gs-mp'); const els = [];
  const mk = (o, into) => { const t = document.createElement('template'); t.innerHTML = o.html.trim(); o.el = t.content.firstElementChild; into.appendChild(o.el); els.push(o); };
  for(const f of flow){ if(f.type === 'page') mk(f, pg); else if(f.type === 'blk') mk(f, full); else if(f.type === 'run'){ if(f.head){ mk(f.head, full); mk(f.cont, full); } f.items.forEach(it => mk(it, f.cols === 2 ? col : full)); } }
  for(const o of els) o.h = o.el.offsetHeight;
  for(const f of flow) if(f.type === 'page'){ const t = f.el.querySelector('.gs-cv-t'); let fs = 112; while(t && fs > 44 && t.scrollWidth > 640){ fs -= 6; t.style.fontSize = fs + 'px'; } f.html = f.el.outerHTML; }
  for(const o of els){ if(o.el.parentNode === pg) continue; o.h = Math.ceil(o.h / GS_U) * GS_U; o.el.style.height = o.h + 'px'; o.html = o.el.outerHTML; }
  host.innerHTML = '';
  // umbrechen: rein rechnerisch, nie ein Gericht geteilt, Überschrift nie allein
  const H = GS_BODY_H, pages = []; let cur = null, y = 0;
  const np = () => { cur = {parts:[]}; pages.push(cur); y = 0; };
  for(const f of flow){
    if(f.type === 'page'){ pages.push({cover:true, html:f.html}); cur = null; continue; }
    if(f.type === 'break'){ if(cur && y > 0){ cur.brk = f.b.id; cur.brkY = y; cur = null; } continue; }
    if(f.type === 'blk'){ if(!cur) np(); if(y + f.h > H && y > 0) np(); if(f.title && y === 0) cur.noHead = true; cur.parts.push(f.html); y += f.h; cur.free = H - y; continue; }
    const n = f.items.length; if(!n){ if(f.head){ if(!cur) np(); if(y + f.head.h > H && y > 0) np(); cur.parts.push(f.head.html); y += f.head.h; cur.free = H - y; } continue; }
    let i = 0, first = true, guard = 0;
    while(i < n && guard++ < 400){
      if(!cur) np();
      const hh = f.head ? (first ? f.head.h : f.cont.h) : 0, avail = H - y - hh; let c = 0;
      if(f.cols === 2){ while(i + c < n && gsSplit(f.items.slice(i, i + c + 1).map(o => o.h)).h <= avail) c++; }
      else { let a = 0; while(i + c < n && a + f.items[i + c].h <= avail){ a += f.items[i + c].h; c++; } }
      if(c < Math.min(f.cols === 2 ? 3 : 2, n - i) && y > 0){ cur = null; continue; }
      if(!c) c = 1;
      if(n - i - c === 1 && c >= 3) c--;
      if(f.head) cur.parts.push(first ? f.head.html : f.cont.html);
      const part = f.items.slice(i, i + c);
      if(f.cols === 2){ const sp = gsSplit(part.map(o => o.h)); cur.parts.push(`<div class="gs-cols" style="height:${sp.h}px"><div class="gs-col">${part.slice(0, sp.k).map(o => o.html).join('')}</div><div class="gs-col">${part.slice(sp.k).map(o => o.html).join('')}</div></div>`); y += hh + sp.h; }
      else { part.forEach(o => cur.parts.push(o.html)); y += hh + part.reduce((a, o) => a + o.h, 0); }
      i += c; first = false; cur.free = H - y; if(i < n) cur = null;
    }
    if(cur) cur.free = H - y;
  }
  if(cur) cur.free = H - y;
  if(!pages.length) pages.push({parts:[`<div class="gs-u gs-t al-c"><p>Für diesen Tag sind noch keine Gerichte eingetragen.</p></div>`]});
  const name = esc(S.settings.name), tt = gsTitleParts(x), many = pages.length > 1;
  const out = pages.map((p, i) => {
    if(p.cover) return `<article class="${x.cls} gs-cover" style="${x.style}"><i class="gs-frame"></i>${p.html}</article>`;
    const fill = x.fx.orn === 'berg' && (p.free == null ? 0 : p.free) > 176 && !p.parts.some(h => h.includes('data-k="orn"')) ? `<div class="gs-fill">${hsRidge(x.k, 664, x.ac, 1.1)}</div>` : '';
    const brk = p.brk && !x.print ? `<div class="gs-u gs-b gs-br" data-b="${p.brk}" data-k="break" style="top:${Math.min(p.brkY, GS_BODY_H - 24)}px"><span>Seitenumbruch</span></div>` : '';
    return `<article class="${x.cls}" style="${x.style}"><i class="gs-frame"></i>${p.noHead ? '' : `<header class="gs-ph"><span>${name}</span><span>${esc((tt.title + ' ' + tt.year).trim())}</span></header>`}<div class="gs-body">${p.parts.join('')}${fill}${brk}</div>${many ? `<footer class="gs-pf">${i + 1}</footer>` : ''}</article>`;
  });
  gsFlush();
  return out;
}

/* ---------- Druck und PDF: was man sieht, wird gedruckt – jedes Blatt genau eine A4-Seite ---------- */
function gsPrintFill(){ const pr = $('#print'); pr.className = ''; pr.classList.add('gs-print'); pr.innerHTML = gsPages({print:true}).join(''); document.body.classList.add('print-menu'); }
async function gsExportPdf(filename){
  const el = $('#print'); const pages = [...el.querySelectorAll('.gs-page')]; let done = 0;
  toast('PDF wird erstellt …');
  try {
    await pdfLibs(); el.classList.add('pdf');
    if(document.fonts && document.fonts.ready) await document.fonts.ready;
    await Promise.all([...el.querySelectorAll('img')].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const {jsPDF} = window.jspdf; const pdf = new jsPDF({unit:'pt', format:'a4', compress:true});
    const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight(); const bg = getComputedStyle(pages[0]).backgroundColor;
    for(let i = 0; i < pages.length; i++){
      el.replaceChildren(pages[i]); await new Promise(r => requestAnimationFrame(r));
      const t = $('#toast'); if(t && pages.length > 1){ t.textContent = `PDF wird erstellt … Blatt ${i + 1} von ${pages.length}`; t.classList.add('show'); clearTimeout(toast._t); }
      const canvas = await window.html2canvas(pages[i], {scale:2, backgroundColor:bg, useCORS:true, logging:false, width:GS_W, height:GS_H, windowWidth:Math.max(document.documentElement.clientWidth, 1000), windowHeight:window.innerHeight, scrollX:0, scrollY:-window.scrollY,
        ignoreElements: n => n.parentElement === document.body && n.id !== 'print' && n.tagName !== 'STYLE' && n.tagName !== 'LINK'});
      if(i) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', .9), 'JPEG', 0, 0, pw, ph, undefined, 'FAST'); canvas.width = canvas.height = 0; done++;
    }
    const ok = await saveFile(filename, pdf.output('blob'));
    if(ok) toast(`PDF erstellt: ${filename} (${pages.length} ${pages.length === 1 ? 'Seite' : 'Seiten'})`);
    window.__gsLast = {name:filename, pages:done, look:gsState().cur};
  } catch(e){ toast('PDF fehlgeschlagen: ' + (e.message || e)); }
  finally { el.classList.remove('pdf'); el.replaceChildren(...pages); }
}
const _exportPdfGs = exportPdf;
exportPdf = function(filename){ const el = $('#print'); if(el && el.querySelector('.gs-page')) return gsExportPdf(filename); if(el) el.classList.remove('gs-print'); return _exportPdfGs(filename); };
printMenu = function(){
  const fx = gsFx(gsDoc(), gsState().cur); const own = GS_LOOKS[gsState().cur].title;
  if(PDF_NAME && own) PDF_NAME = PDF_NAME.replace(/^Speisekarte/, own.replace(/\s+/g, '-').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'));
  if(!gsReadyNow(fx)) toast('Karte wird vorbereitet …');
  gsEnsure(fx).then(() => { gsPrintFill(); window.print(); });
};
/* Für andere Teile der App: die Gästekarte als fertige Blätter */
guestHtml = function(k, date, opts){ opts = opts || {}; const pages = gsPages({k, date, print:!!opts.print}); return opts.print ? pages.join('') : pages.map((p, i) => `<div class="gs-sheet"><span class="gs-no">${i + 1}</span>${p}</div>`).join(''); };
