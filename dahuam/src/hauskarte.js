
/* =====================================================================
   Hauskarte „Schiefer & Blattl“ – dritte Gestaltung der Gästekarte, Standard.
   Schiefer, Gold und Kreidetafel (Konzept C) mit Kapitelziffern, Haus-Favoriten
   und dem Tisch von oben (Konzept B). Echte A4-Blätter (794 × 1123 px):
   Gerichte werden vermessen und fließen auf weitere Blätter, nie geteilt.
   Texte: S.settings.menuCopy (vom Haus änderbar). Keine erfundenen Fakten.
   ===================================================================== */
const HS_W = 794, HS_H = 1123;
const HS_NAME = 'Hauskarte';
const HS_SEASON = {
  winter:   {ac:'#a9c3d6', ink:'#557890', gl:['snow','fir'],        word:'Jetzt im Winter'},
  fruehling:{ac:'#a8c97a', ink:'#5f7f3a', gl:['blossom','baerlauch'], word:'Jetzt im Frühling'},
  sommer:   {ac:'#86c5c0', ink:'#2f7b78', gl:['sun','wave'],        word:'Jetzt im Sommer'},
  herbst:   {ac:'#dd9150', ink:'#9a5620', gl:['leaf','mushroom'],   word:'Jetzt im Herbst'},
};
/* Standardtexte: nur Stimmung, keine Behauptungen. Alles im Reiter „Gestalten & PDF“ änderbar. */
const HS_COPY = {
  welcome: 'Servus und willkommen dahuam. Was gerade Saison hat, steht an der Tafel – mit Kreide, weil es sich ändert.',
  tafel: 'Heute an der Tafel',
  fav: 'Unsere Empfehlungen, quer durch die Karte.',
  back: 'Schön, dass Sie da sind. Lassen Sie sich Zeit.',
  sec: {
    'Flammkuchen': 'Dünn, heiß und knusprig.',
    'Zum Teilen': 'Für die Mitte vom Tisch.',
    'Suppen & Vorspeisen': 'Zum Ankommen und Aufwärmen.',
    'Salate & Bowls': 'Frisch und bunt – für alle, die es heute leichter mögen.',
    'Rösti': 'Außen knusprig, innen weich.',
    'Klassiker': 'Die Teller, auf die man sich schon am Heimweg freut.',
    'Burger, Pasta & Co.': 'Für den großen Hunger.',
    'Süßes': 'Ein bisserl was Süßes geht immer.',
    'Für Kinder': 'Kleine Portionen für große Augen.',
  },
};
function hsCopy(key, sec){
  const c = S.settings.menuCopy || {};
  if(key === 'sec'){ const v = c.sec && c.sec[sec]; return v != null ? v : (HS_COPY.sec[sec] || ''); }
  if(key === 'claim') return c.claim != null ? c.claim : WK_QUOTE;
  return c[key] != null ? c[key] : HS_COPY[key];
}
/* Zwei Stile: „haus“ (Hauskarte) und „schlicht“ (wenig Farbe, gut für den Bürodrucker) */
function hsStyle(){ return S.settings.guestStyle === 'schlicht' ? 'schlicht' : 'haus'; }
function hausMigrate(d){
  const s = d.settings; if(!s) return d;
  // frühere Stile 'web' und 'book' werden „Schlicht“, wenn sie bewusst gewählt waren; sonst gilt die Hauskarte
  s.guestStyle = s.guestStyle === 'schlicht' || (s.guestStylePick && (s.guestStyle === 'web' || s.guestStyle === 'book')) ? 'schlicht' : 'haus';
  delete s.guestStylePick;
  // Layout, Schriftpaar und Ornament je Saison gab es nur im alten Stil 'book'
  Object.values(s.seasons || {}).forEach(x => { if(x && typeof x === 'object'){ delete x.layout; delete x.fd; delete x.fb; delete x.orn; } });
  if(!s.menuCopy || typeof s.menuCopy !== 'object') s.menuCopy = {};
  if(!s.menuCopy.sec || typeof s.menuCopy.sec !== 'object') s.menuCopy.sec = {};
  return d;
}

/* ---------- Schriften: Barlow Condensed (Titel, Preise), Fraunces (Ziffern, Namen, Fließtext), Caveat (nur Tafel) ---------- */
/* seit Paket A als Dateien im Ordner vendor/fonts (fonts.css), kein fremder Dienst mehr */
const HS_FONTS = ['300 20px "Fraunces"','400 20px "Fraunces"','500 20px "Fraunces"','600 20px "Fraunces"','italic 300 20px "Fraunces"','italic 400 20px "Fraunces"','400 20px "Caveat"','600 20px "Caveat"','300 20px "Barlow Condensed"','400 20px "Barlow Condensed"','500 20px "Barlow Condensed"','600 20px "Barlow Condensed"'];

/* ---------- Linienzeichnungen (Gold), eigenständige SVGs mit festen Farben ---------- */
function hsSvg(inner, vb, w, h, color, sw){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner.replace(/currentColor/g, color)}</svg>`; }
const HS_ILL = {
  flammkuchen:'<path d="M8,54c0-12 14-22 34-22s34,10 34,22-14,22-34,22S8,66 8,54z"/><path d="M76,51h18a3,3 0 0 1 0,6h-18"/><path d="M14,54c0-9 12-16 28-16s28,7 28,16-12,16-28,16S14,63 14,54z" stroke-opacity=".8"/><path d="M24,52l7-2 2 4-7 2z M44,44l8 1-1 4-8-1z M56,58l7-3 2 4-7 3z M34,60l7 0 1 4-7 0z M50,52l6 1 0 3-6-1z"/><circle cx="38" cy="50" r="2.2"/><circle cx="60" cy="49" r="1.9"/><circle cx="30" cy="58" r="1.7"/><circle cx="46" cy="64" r="1.8"/>',
  fondue:'<path d="M22,46h56l-5,25a9,7 0 0 1-9,6h-28a9,7 0 0 1-9-6z"/><ellipse cx="50" cy="46" rx="28" ry="5"/><path d="M78,50h9a4,4 0 0 1 0,8h-6"/><path d="M38,44l-8-23 M30,21l-3-6 M30,21l3-7 M30,21l0-8"/><path d="M27,23l5-3 3 5-5 3z"/><path d="M61,44l10-25 M71,19l-2-7 M71,19l4-6 M71,19l1-8"/><path d="M32,80h36 M36,80l-4,10h36l-4-10"/><path d="M50,89c-5-4-2-8 0-11 1 4 5 6 3 10-1 1-2 1-3 1z"/>',
  suppe:'<path d="M20,52h60c0,18-14,28-30,28s-30-10-30-28z"/><path d="M14,82h72"/><path d="M20,56h-8 M80,56h8"/><path d="M40,42c0-6 4-6 4-12s-4-6-4-12 M50,40c0-6 4-6 4-12s-4-6-4-12 M60,42c0-6 4-6 4-12s-4-6-4-12" stroke-opacity=".75"/><path d="M30,62c6 4 16 6 20 6s14-2 20-6" stroke-opacity=".5"/>',
  salat:'<path d="M18,56h64c0,16-12,27-32,27s-32-11-32-27z"/><path d="M16,84h68" stroke-opacity=".6"/><path d="M34,56c-4-14 6-24 16-26 2 10-4 22-16 26z M36,53c4-8 8-14 13-21"/><path d="M60,56c8-10 10-22 2-30-8 8-10 20-2 30z M61,53c0-8 1-16 2-25"/><circle cx="48" cy="48" r="6"/><path d="M28,64c10 3 34 3 44 0" stroke-opacity=".5"/>',
  roesti:'<circle cx="44" cy="54" r="27"/><circle cx="44" cy="54" r="21"/><path d="M70,51h24 M70,57h24 M94,51v6"/><path d="M33,45l6 3 M42,40l4 6 M53,45l-5 4 M34,59l7-2 M50,60l6 3 M38,66l5-3 M55,53l6-2 M28,52l5 1" stroke-opacity=".8"/><circle cx="44" cy="54" r="5"/>',
  teller:'<circle cx="50" cy="52" r="26"/><circle cx="50" cy="52" r="19"/><path d="M16,26v52 M12,26v12a4,4 0 0 0 8,0v-12 M16,26v12"/><path d="M84,26v52 M84,26c-6,8-6,20 0,26"/><path d="M38,52c3-6 9-9 12-9s9 3 12 9" stroke-opacity=".5"/>',
  burger:'<path d="M22,46a28,20 0 0 1 56,0z"/><path d="M38,36l3-2 M48,32l3-1 M58,36l3 1 M44,40l3 0 M54,40l3-1 M34,42l2-1 M64,42l2 1"/><path d="M20,50q5,5 10,0t10,0t10,0t10,0t10,0t10,0"/><rect x="22" y="54" width="56" height="8" rx="4"/><path d="M22,66h56v4a8,8 0 0 1-8,8h-40a8,8 0 0 1-8-8z"/>',
  schmarrn:'<circle cx="52" cy="54" r="27"/><path d="M26,50h-18 M26,58h-18 M8,50v8"/><path d="M38,44l10-3 3 9-10 3z M54,40l9 2-2 9-9-2z M40,60l9-1 2 8-9 1z M56,58l8 3-4 8-7-3z M63,48l7 1 0 7-7-1z"/><circle cx="35" cy="37" r=".9"/><circle cx="46" cy="33" r=".9"/><circle cx="60" cy="31" r=".9"/><circle cx="70" cy="38" r=".9"/><circle cx="74" cy="60" r=".9"/><circle cx="33" cy="68" r=".9"/><circle cx="52" cy="72" r=".9"/>',
  krake:'<path d="M32,24a14,14 0 0 1 28,0v28h-28z"/><path d="M34,52c-2,10-8,14-12,22 M40,52c-1,10-4,16-6,24 M46,52c0,10 0,16 0,24 M52,52c1,10 4,16 6,24 M58,52c2,10 8,14 12,22"/><circle cx="40" cy="30" r="1.6" fill="currentColor" stroke="none"/><circle cx="52" cy="30" r="1.6" fill="currentColor" stroke="none"/><path d="M41,38q5,4 10,0"/><path d="M70,64h22l-3,16h-16z"/><path d="M75,64l4-14 M81,64l1-14 M87,64l-2-13"/>',
};
const HS_ILL_FOR = [[/flamm/i,'flammkuchen'],[/teil|fondue/i,'fondue'],[/supp|vorsp/i,'suppe'],[/salat|bowl/i,'salat'],[/rösti|roesti/i,'roesti'],[/burger|pasta/i,'burger'],[/süß|suess|dessert|nachsp/i,'schmarrn'],[/kind/i,'krake']];
function hsIll(name, size, color, sw){ const k = (HS_ILL_FOR.find(([re]) => re.test(name)) || [,'teller'])[1]; return hsSvg(HS_ILL[k], '0 0 100 100', size, size, color, sw || 1.5); }
const HS_GLYPH = {
  snow:'<path d="M12,2v20 M3.3,7l17.4,10 M3.3,17l17.4-10 M12,2l-2.5,2.5 M12,2l2.5,2.5 M12,22l-2.5-2.5 M12,22l2.5-2.5 M3.3,7l3.4-.9 M3.3,7l.9,3.4 M20.7,17l-3.4,.9 M20.7,17l-.9-3.4 M3.3,17l3.4,.9 M3.3,17l.9-3.4 M20.7,7l-3.4-.9 M20.7,7l-.9,3.4"/>',
  fir:'<path d="M12,3v18 M12,7l-4,4 M12,7l4,4 M12,11l-5,5 M12,11l5,5 M12,15l-6,6 M12,15l6,6"/>',
  leaf:'<path d="M4,20C4,10 12,4 20,4C20,12 14,20 4,20z M4,20L18,6"/>',
  mushroom:'<path d="M3,12a9,7 0 0 1 18,0z M9,12v6a3,3 0 0 0 6,0v-6"/>',
  baerlauch:'<path d="M12,22C6,16 6,8 12,2C18,8 18,16 12,22z M12,22V2"/>',
  blossom:'<circle cx="12" cy="12" r="2.5"/><path d="M12,9.5c0-4-3-6-3-6s-1,4 3,6z M14.5,12c4,0 6-3 6-3s-4-1-6,3z M12,14.5c0,4 3,6 3,6s1-4-3-6z M9.5,12c-4,0-6,3-6,3s4,1 6-3z"/>',
  sun:'<circle cx="12" cy="12" r="5"/><path d="M12,2v3 M12,19v3 M2,12h3 M19,12h3 M5,5l2,2 M17,17l2,2 M5,19l2-2 M17,7l2-2"/>',
  wave:'<path d="M2,10q3-4 6,0t6,0t6,0 M2,16q3-4 6,0t6,0t6,0"/>',
};
function hsGl(name, size, color, sw){ return hsSvg(HS_GLYPH[name], '0 0 24 24', size, size, color, sw || 1.6); }
/* Bergkamm, je Saison anders geschmückt */
function hsRidge(season, w, color, sw){
  const peaks = 'M0,112 L48,84 L82,96 L128,56 L162,80 L200,66 L252,28 L296,70 L336,46 L380,86 L430,58 L470,74 L522,38 L560,76 L600,60';
  const back = 'M0,100 C90,70 150,96 230,62 C300,34 330,70 410,50 C470,36 520,72 600,50';
  const hatch = 'M252,28 L246,44 M296,70 L302,56 M522,38 L516,54 M128,56 L124,70 M380,86 L386,72';
  let deco = '';
  if(season === 'winter'){
    const dots = []; let s = 7;
    for(let i = 0; i < 46; i++){ s = (s*9301+49297)%233280; const x = (s/233280)*600; s = (s*9301+49297)%233280; const y = 4+(s/233280)*70; dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1"/>`); }
    const fir = (x,y,h) => `<path d="M${x},${y} v-${h} M${x},${y-h+h*.25} l-${h*.22},${h*.22} M${x},${y-h+h*.25} l${h*.22},${h*.22} M${x},${y-h+h*.5} l-${h*.3},${h*.3} M${x},${y-h+h*.5} l${h*.3},${h*.3} M${x},${y-h+h*.75} l-${h*.36},${h*.36} M${x},${y-h+h*.75} l${h*.36},${h*.36}"/>`;
    deco = `<g stroke-opacity=".7">${dots.join('')}</g>` + fir(30,120,16)+fir(44,122,12)+fir(560,120,14)+fir(576,122,18)+fir(590,121,11) + '<path d="M0,122c40-6 80 2 120-2 M480,120c40-6 80 2 120-2" stroke-opacity=".6"/>';
  } else if(season === 'herbst'){
    const larch = (x,y,h) => `<path d="M${x},${y} v-${h} M${x},${y-h+h*.2} q-${h*.18},${h*.18} -${h*.2},${h*.1} M${x},${y-h+h*.2} q${h*.18},${h*.18} ${h*.2},${h*.1} M${x},${y-h+h*.45} q-${h*.26},${h*.2} -${h*.3},${h*.08} M${x},${y-h+h*.45} q${h*.26},${h*.2} ${h*.3},${h*.08} M${x},${y-h+h*.7} q-${h*.32},${h*.22} -${h*.38},${h*.06} M${x},${y-h+h*.7} q${h*.32},${h*.22} ${h*.38},${h*.06}"/>`;
    const leaf = (x,y,r) => `<g transform="translate(${x},${y}) rotate(${r})"><path d="M-5,4C-5,-1 -1,-5 5,-5C5,1 1,5 -5,4z M-5,4L4,-4"/></g>`;
    deco = larch(28,120,22)+larch(48,122,16)+larch(552,121,18)+larch(574,123,24)+larch(592,121,13) + `<g stroke-opacity=".8">${leaf(90,30,20)}${leaf(140,20,-30)}${leaf(455,24,40)}${leaf(500,14,-15)}${leaf(330,22,10)}</g>` + '<path d="M0,122c40-6 80 2 120-2 M480,120c40-6 80 2 120-2" stroke-opacity=".6"/>';
  } else if(season === 'fruehling'){
    deco = '<path d="M20,122c20-4 40-4 60 0 M520,122c20-4 40-4 60 0" stroke-opacity=".6"/><g stroke-opacity=".8"><path d="M40,120c-4-8-2-16 4-22 4 6 4 14 0 22 M56,122c-4-6-2-12 3-16 3 4 3 10-1 16 M548,121c-4-8-2-16 4-22 4 6 4 14 0 22 M566,122c-4-6-2-12 3-16 3 4 3 10-1 16"/></g>';
  } else {
    deco = '<circle cx="470" cy="20" r="9"/><path d="M470,4v4 M470,32v4 M454,20h4 M482,20h4 M459,9l3,3 M478,28l3,3 M459,31l3-3 M478,12l3-3" stroke-opacity=".8"/><path d="M0,124q10-5 20,0t20,0t20,0t20,0t20,0t20,0 M480,124q10-5 20,0t20,0t20,0t20,0t20,0t20,0" stroke-opacity=".6"/>';
  }
  return hsSvg(`<path d="${back}" stroke-opacity=".45"/><path d="${peaks}"/><path d="${hatch}" stroke-opacity=".6"/>${deco}`, '0 0 600 130', w, Math.round(w*130/600), color, sw || 1.2);
}

/* ---------- Bilder aus dem Canvas: Schiefer mit Kerzenlicht, Holztisch, Teller, Duoton-Fotos ---------- */
const HS_SRC = {logo:'brand/logo.svg', slate:'brand/slate.webp', wood:'brand/table.webp', fork:'brand/fork.webp', knife:'brand/knife.webp', stube:'photos/unmatched/gaststube.webp', aussen:'photos/unmatched/aussen-winter.webp', fondue:'photos/unmatched/silvesterabend-fondue.webp'};
const HS_A = {};            // fertige Daten-URLs
const HS_RAW = {};          // geladene Bilder
let HS_READY = false, HS_BASE_P = null; const HS_COVER_P = {}, HS_COVER_DONE = new Set();
function hsLoadImg(src){ return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('Bild fehlt: ' + src)); i.src = src; }); }
function hsUrl(c, type, q){ const d = c.toDataURL(type, q); try { const [h, b] = d.split(','); const bin = atob(b); const u = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return URL.createObjectURL(new Blob([u], {type:h.slice(5).split(';')[0]})); } catch(e){ return d; } }
function hsCan(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function hsDrawCover(g, img, W, H, fx, fy){ const r = Math.max(W/img.width, H/img.height); const w = img.width*r, h = img.height*r; g.drawImage(img, (W-w)*(fx==null?.5:fx), (H-h)*(fy==null?.5:fy), w, h); }
function hsDuotone(g, W, H, lo, hi, contrast, lift){
  const d = g.getImageData(0, 0, W, H), a = d.data;
  for(let i = 0; i < a.length; i += 4){ let l = (.299*a[i] + .587*a[i+1] + .114*a[i+2])/255; l = Math.min(1, Math.max(0, (l-.5)*(contrast||1) + .5 + (lift||0))); l = l*l*(3-2*l)*.5 + l*.5; a[i] = lo[0]+(hi[0]-lo[0])*l; a[i+1] = lo[1]+(hi[1]-lo[1])*l; a[i+2] = lo[2]+(hi[2]-lo[2])*l; }
  g.putImageData(d, 0, 0);
}
function hsVignette(g, W, H, warm, dark){
  let gr = g.createRadialGradient(W/2, H*.2, 0, W/2, H*.2, W*.95); gr.addColorStop(0, `rgba(255,196,120,${warm})`); gr.addColorStop(1, 'rgba(255,196,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  gr = g.createRadialGradient(W/2, H/2, H*.34, W/2, H/2, H*.74); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${dark})`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
function hsBase(){
  if(HS_BASE_P) return HS_BASE_P;
  HS_BASE_P = (async () => {
    try { await Promise.all(HS_FONTS.map(f => document.fonts.load(f, 'Äß09'))); } catch(e){}
    await Promise.all(Object.keys(HS_SRC).map(k => hsLoadImg(HS_SRC[k]).then(i => { HS_RAW[k] = i; }).catch(() => {})));
    try {
      const W = 1191, H = 1685;
      if(HS_RAW.slate){ const [c, g] = hsCan(W, H); hsDrawCover(g, HS_RAW.slate, W, H); g.fillStyle = 'rgba(12,13,16,.14)'; g.fillRect(0, 0, W, H); hsVignette(g, W, H, .09, .5); HS_A.slateC = c; HS_A.slate = hsUrl(c, 'image/jpeg', .86);
        const [c2, g2] = hsCan(900, 1100); hsDrawCover(g2, HS_RAW.slate, 900, 1100, .2, .3); g2.fillStyle = 'rgba(8,9,11,.42)'; g2.fillRect(0, 0, 900, 1100);
        for(const [x,y,r,a] of [[.3,.85,.5,.07],[.8,.2,.4,.05],[.55,.5,.6,.035]]){ const gr = g2.createRadialGradient(900*x, 1100*y, 0, 900*x, 1100*y, 900*r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 900, 1100); }
        let gr = g2.createRadialGradient(450, 550, 380, 450, 550, 760); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)'); g2.fillStyle = gr; g2.fillRect(0, 0, 900, 1100);
        HS_A.board = hsUrl(c2, 'image/jpeg', .86); }
      if(HS_RAW.wood){ const [c, g] = hsCan(W, H); hsDrawCover(g, HS_RAW.wood, W, H); g.fillStyle = 'rgba(30,17,8,.34)'; g.fillRect(0, 0, W, H); hsVignette(g, W, H, .05, .62); HS_A.wood = hsUrl(c, 'image/jpeg', .86); }
      { // Teller: weißes Porzellan mit Fahne und weichem Schatten
        const [c, g] = hsCan(640, 640); const cx = 320, cy = 310, R = 270;
        g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 34; g.shadowOffsetY = 16; g.fillStyle = '#e9e3d6'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.restore();
        let gr = g.createRadialGradient(cx-60, cy-80, 40, cx, cy, R); gr.addColorStop(0, '#fffdf8'); gr.addColorStop(.8, '#f4efe4'); gr.addColorStop(1, '#ddd5c5'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
        gr = g.createRadialGradient(cx, cy+6, R*.7, cx, cy, R*.8); gr.addColorStop(0, 'rgba(120,105,80,.0)'); gr.addColorStop(.55, 'rgba(120,105,80,.2)'); gr.addColorStop(1, 'rgba(120,105,80,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R*.82, 0, 7); g.fill();
        gr = g.createRadialGradient(cx-30, cy-40, 10, cx, cy, R*.74); gr.addColorStop(0, '#fffefb'); gr.addColorStop(1, '#f6f1e7'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R*.735, 0, 7); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R-2, 3.5, 5.2); g.stroke();
        HS_A.plate = hsUrl(c, 'image/png'); }
      for(const k of ['fork','knife']) if(HS_RAW[k]){ const i = HS_RAW[k]; const [c, g] = hsCan(i.width+70, i.height+50); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 20; g.shadowOffsetX = 10; g.shadowOffsetY = 12; g.drawImage(i, 25, 15); HS_A[k] = hsUrl(c, 'image/png'); }
      if(HS_RAW.stube){ const [c, g] = hsCan(1280, 600); hsDrawCover(g, HS_RAW.stube, 1280, 600, .5, .45); hsDuotone(g, 1280, 600, [26,24,24], [240,216,174], 1.12, -.02); HS_A.stube = hsUrl(c, 'image/jpeg', .86); }
      if(HS_RAW.fondue){ const [c, g] = hsCan(440, 784); hsDrawCover(g, HS_RAW.fondue, 440, 784, .5, .6); hsDuotone(g, 440, 784, [26,24,24], [240,216,174], 1.1, 0); HS_A.fondue = hsUrl(c, 'image/jpeg', .86); }
      if(HS_RAW.logo){ const [c, g] = hsCan(716, 731); g.drawImage(HS_RAW.logo, 0, 0, 716, 731); HS_A.logo = hsUrl(c, 'image/png'); const [e, eg] = hsCan(396, 396); eg.drawImage(c, -159, -39); HS_A.emblem = hsUrl(e, 'image/png'); }
      if(HS_A.slate) document.documentElement.style.setProperty('--hs-slate', `url("${HS_A.slate}")`);
      if(HS_A.wood) document.documentElement.style.setProperty('--hs-wood', `url("${HS_A.wood}")`);
      if(HS_A.board) document.documentElement.style.setProperty('--hs-board', `url("${HS_A.board}")`);
    } catch(e){ console.warn('Hauskarte: Bilder konnten nicht aufbereitet werden', e); }
    HS_READY = true;
  })();
  return HS_BASE_P;
}
/* Titelblatt: Foto (eigenes Titelbild der Saison, sonst im Winter das Haus im Schnee) als Duoton in den Schiefer geblendet */
function hsCoverKey(k){ const s = S.settings.seasons[k]; if(s.cover && IMG[s.cover]) return 'c:' + s.cover; return k === 'winter' ? 'aussen' : ''; }
function hsCoverBg(k){
  const key = hsCoverKey(k); if(!key) return Promise.resolve();
  if(HS_COVER_P[key]) return HS_COVER_P[key];
  return HS_COVER_P[key] = (async () => {
    await hsBase();
    try {
      const img = key === 'aussen' ? HS_RAW.aussen : await hsLoadImg(IMG[S.settings.seasons[k].cover]); if(!img || !HS_A.slateC) return;
      const W = 1191, H = 1685, y0 = Math.round(H*.235), bh = Math.round(H*.38);
      const [c, g] = hsCan(W, H); g.drawImage(HS_A.slateC, 0, 0);
      const [b, bg] = hsCan(W, bh); hsDrawCover(bg, img, W, bh, .5, .42); hsDuotone(bg, W, bh, [22,25,29], [214,186,142], 1.2, -.1);
      bg.globalCompositeOperation = 'destination-in'; const m = bg.createLinearGradient(0, 0, 0, bh); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(.1, 'rgba(0,0,0,.12)'); m.addColorStop(.3, 'rgba(0,0,0,.82)'); m.addColorStop(.52, 'rgba(0,0,0,.8)'); m.addColorStop(.8, 'rgba(0,0,0,.28)'); m.addColorStop(1, 'rgba(0,0,0,0)'); bg.fillStyle = m; bg.fillRect(0, 0, W, bh);
      g.drawImage(b, 0, y0);
      const v = g.createLinearGradient(0, 0, W, 0); v.addColorStop(0, 'rgba(20,22,26,.55)'); v.addColorStop(.18, 'rgba(20,22,26,0)'); v.addColorStop(.82, 'rgba(20,22,26,0)'); v.addColorStop(1, 'rgba(20,22,26,.55)'); g.fillStyle = v; g.fillRect(0, y0, W, bh);
      HS_A['cover:' + key] = hsUrl(c, 'image/jpeg', .88);
    } catch(e){ console.warn('Hauskarte: Titelbild', e); }
  })();
}
function hsAllReady(k){ const key = hsCoverKey(k); return HS_READY && (!key || HS_COVER_DONE.has(key)); }
function hsEnsure(k){ const key = hsCoverKey(k); return Promise.all([hsBase(), hsCoverBg(k)]).then(() => { if(key) HS_COVER_DONE.add(key); }); }

/* ---------- Bausteine ---------- */
const hsU = s => esc(String(s == null ? '' : s).toLocaleUpperCase('de-AT'));
const HS_MONTHS = ['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
function hsRange(a, b){ b = b || a; const [ya,ma,da] = a.split('-').map(Number), [yb,mb,db] = b.split('-').map(Number);
  if(a === b) return `${da}. ${HS_MONTHS[ma-1]}`; if(ma === mb) return `${da}.–${db}. ${HS_MONTHS[ma-1]}`; return `${da}. ${HS_MONTHS[ma-1]} – ${db}. ${HS_MONTHS[mb-1]}`; }
function hsTheme(k){ const d = HS_SEASON[k] || HS_SEASON.winter; const s = S.settings.seasons[k] || {}; let ac = d.ac, ink = d.ink;
  if(s.accent && /^#[0-9a-f]{6}$/i.test(s.accent) && s.accent.toLowerCase() !== (HK_ACCENT[k]||'').toLowerCase()){ const n = parseInt(s.accent.slice(1), 16), r = n>>16, g = n>>8&255, b = n&255; const mix = (c, t, f) => Math.round(c+(t-c)*f); const lum = (.299*r+.587*g+.114*b)/255;
    ink = lum > .5 ? `rgb(${mix(r,0,.4)},${mix(g,0,.4)},${mix(b,0,.4)})` : s.accent; ac = lum < .62 ? `rgb(${mix(r,255,.5)},${mix(g,255,.5)},${mix(b,255,.5)})` : s.accent; }
  return {ac, ink, gl:d.gl, word:d.word}; }
function hsInfo(e){
  const m = e.head, vars = e.vars, multi = vars.length > 1 || !!(m.group && m.vlabel);
  const alg = [...new Set(vars.flatMap(v => itemAlg(v)))].sort();
  const veg = vars.every(v => v.veg === 'vg') ? 'vg' : vars.every(v => v.veg === 'v' || v.veg === 'vg') ? 'v' : '';
  return {name:m.name, desc:[m.desc, hkDays(m)].filter(Boolean).join(' · '), alg, veg, top:vars.some(v => v.top), seasonal:vars.some(v => v.seasons && v.seasons.length),
    prices: multi ? vars.map(v => [v.vlabel || v.name, v.price]) : [['', m.price]], section:m.section};
}
function hsVeg(v){ return v === 'vg' ? '<span class="hs-veg">VEGAN</span>' : v === 'v' ? '<span class="hs-veg">VEG</span>' : ''; }
function hsAlg(a, used){ if(!a.length) return ''; a.forEach(x => used.add(x)); return `<span class="hs-al">${a.join(' ')}</span>`; }
function hsPrices(d){ const f = ([l, p]) => `<span class="hs-p">${l ? `<small>${esc(l)}</small>` : ''}${+p ? hkPrice(p) : ''}</span>`; return d.prices.length === 1 ? f(d.prices[0]) : `<span class="hs-ps">${d.prices.map(f).join('')}</span>`; }
function hsDish(d, x){
  const gl = d.seasonal ? `<span class="hs-gl">${hsGl(x.t.gl[0], 12, x.paper ? x.t.ink : x.t.ac)}</span>` : '';
  const al = hsAlg(d.alg, x.used);
  return `<div class="hs-d"><div class="hs-l"><span class="hs-n">${gl}${esc(d.name)}${hsVeg(d.veg)}</span><span class="hs-lead"></span>${hsPrices(d)}</div>${d.desc || al ? `<p class="hs-ds">${esc(d.desc)}${al}</p>` : ''}</div>`;
}
function hsFeat(d, x){
  const gl = d.seasonal ? `<span class="hs-gl">${hsGl(x.t.gl[0], 15, x.paper ? x.t.ink : x.t.ac)}</span>` : '';
  const al = hsAlg(d.alg, x.used);
  return `<div class="hs-feat"><span class="tab">EMPFEHLUNG DES HAUSES</span><i class="co a"></i><i class="co b"></i><i class="co c"></i><i class="co d"></i>
    <div><div class="fn">${gl}${esc(d.name)}${hsVeg(d.veg)}</div>${d.desc || al ? `<p class="hs-ds">${esc(d.desc)}${al}</p>` : ''}</div>${hsPrices(d)}</div>`;
}
function hsHost(){ let h = document.getElementById('hsMeasure'); if(!h){ h = document.createElement('div'); h.id = 'hsMeasure'; h.className = 'hs-measure'; h.setAttribute('aria-hidden', 'true'); document.body.appendChild(h); } return h; }
function hsEl(html){ const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function hsHead(x){ return `<header class="hs-ph"><span><b>${hsU(S.settings.name.split(' ')[0])}</b> ${hsU(S.settings.name.split(' ').slice(1).join(' '))}</span><span class="rr">${hsGl(x.t.gl[0], 14, x.t.ac)}${hsU(x.s.title)}</span></header>`; }
function hsFoot(left){ return `<footer class="hs-pf"><span>${left == null ? 'ALLERGENE &amp; ZEICHEN: SIEHE LETZTE SEITE' : left}</span><span class="n" data-hs-n></span></footer>`; }
function hsPage(x, cls, inner, o){ o = o || {}; const p = hsEl(`<article class="hs-page ${cls}" style="--ac:${x.t.ac};--ac-ink:${x.t.ink}${o.style ? ';' + o.style : ''}">${o.frame === false ? '' : '<div class="hs-frame"></div>'}${o.head === false ? '' : hsHead(x)}${inner}${o.foot === false ? '' : hsFoot(o.footLeft)}</article>`); x.host.appendChild(p); x.pages.push(p); return p; }

/* ---------- Blätter ---------- */
function hsCoverPage(x){
  const title = String(x.s.title || HK_TITLE[x.k] || 'Speisekarte'); const m = title.match(/^(.{3,}?)(karte)$/i);
  const bgKey = hsCoverKey(x.k), bg = bgKey && HS_A['cover:' + bgKey];
  const p = hsPage(x, 'hs-cover', `
    <div class="eb">${hsU(x.s.subtitle || HK_PLACE)}</div>
    <img class="hlogo" src="${HS_A.logo || 'brand/logo.svg'}" alt="${esc(S.settings.name)}">
    ${bg ? '' : `<div class="ridge">${hsRidge(x.k, HS_W, '#C59C69', 1.3)}</div>`}
    <div class="ttl"><div class="t1">${esc(m ? m[1] : title)}</div>${m ? `<div class="t2">${esc(m[2].toLowerCase())}</div>` : ''}
      <div class="yr"><i></i>${hsGl(x.t.gl[0], 16, x.t.ac)}<span>${esc(seasonYear(x.k, x.date))}</span>${hsGl(x.t.gl[1], 16, x.t.ac)}<i></i></div></div>
    ${hsCopy('claim') ? `<p class="claim">${esc(hsCopy('claim'))}</p>` : ''}
    ${S.settings.address ? `<p class="place">${hsU(S.settings.address)}</p>` : ''}
    <img class="cut fork" src="${HS_A.fork || HS_SRC.fork}" alt=""><img class="cut knife" src="${HS_A.knife || HS_SRC.knife}" alt="">`,
    {head:false, foot:false, style: bg ? `background-image:url('${bg}')` : ''});
  const t1 = p.querySelector('.t1'), t2 = p.querySelector('.t2'); let fs = 150;
  while(fs > 60 && t1.scrollWidth > 650){ fs -= 6; t1.style.fontSize = fs + 'px'; if(t2) t2.style.fontSize = Math.round(fs*.88) + 'px'; }
}
function hsTafelRow(d, x){ const al = hsAlg(d.alg, x.used);
  return `<div class="hs-tr"><div class="l"><span class="n">${esc(d.name)}${hsVeg(d.veg)}</span><span class="ld"></span><span class="p">${d.prices.map(([l,p]) => (l ? esc(l) + ' ' : '') + (+p ? hkPrice(p) : '')).join(' / ')}</span></div>${d.desc || al ? `<p class="d">${esc(d.desc)}${al}</p>` : ''}</div>`; }
function hsTafelPage(x){
  const seasonal = x.entries.filter(d => d.seasonal);
  const live = specialsFor(x.date);
  const until = addDays(x.date, 150);
  const soon = S.specials.filter(sp => sp.from > x.date && sp.from <= until).sort((a, b) => a.from < b.from ? -1 : 1).slice(0, 3);
  if(!seasonal.length && !live.length && !soon.length) return false;
  const chalk = '#efe9dc';
  const build = (list, c2, vm) => `
      <div class="hx">${esc(hsCopy('tafel'))}</div><div class="sq">${hsSvg('<path d="M2,7c20-6 30,4 50-1s40-6 60,0 30,4 50-2 40-4 56,1"/>', '0 0 220 12', 230, 12, 'rgba(228,203,159,.6)', 1.6)}</div>
      ${live.map(sp => `<div class="hs-tsub">${hsGl(x.t.gl[1], 20, x.t.ac)}${esc(sp.name)}<small>nur ${esc(hsRange(sp.from, sp.to))}${sp.note ? ' · ' + esc(sp.note) : ''}</small></div><div class="hs-tl">${hkEntries(sp.items.map(it => ({...it, id:'', top:false, group:'', days:[], seasons:[]}))).map(e => hsTafelRow(hsInfo(e), x)).join('')}</div>`).join('')}
      ${list.length ? `<div class="hs-tsub">${hsGl(x.t.gl[0], 20, x.t.ac)}${esc(x.t.word)}</div>${c2 ? `<div class="hs-tcols"><div class="hs-tl c2">${list.slice(0, Math.ceil(list.length/2)).map(d => hsTafelRow(d, x)).join('')}</div><div class="hs-tl c2">${list.slice(Math.ceil(list.length/2)).map(d => hsTafelRow(d, x)).join('')}</div></div>` : `<div class="hs-tl">${list.map(d => hsTafelRow(d, x)).join('')}</div>`}` : ''}
      ${vm.length ? `<div class="hs-tsub">${hsGl(x.t.gl[live.length ? 0 : 1], 20, x.t.ac)}Vormerken</div><div class="hs-vm">${vm.map(sp => `<span class="dt">${esc(hsRange(sp.from, sp.to))}</span><div><div class="vn">${esc(sp.name)}</div><p class="vi">${sp.items.map(i => esc(i.name)).join(' · ')}</p>${sp.note ? `<p class="vo">${esc(sp.note)}</p>` : ''}</div>`).join('')}</div>` : ''}
      <div class="mark">${hsSvg('<path d="M4,52 L22,30 L32,40 L48,14 L62,36 L70,28 L88,52"/><path d="M48,14 L45,26 M22,30 L24,38" stroke-opacity=".6"/><path d="M2,58c20-4 60-4 88,0" stroke-opacity=".5"/>', '0 0 92 62', 92, 62, 'rgba(239,233,220,.5)', 1.4)}</div>`;
  const welcome = hsCopy('welcome');
  const p = hsPage(x, 'hs-tafel', `<div class="hs-body">${welcome ? `<p class="hs-welcome">${esc(welcome)}</p>` : ''}<div class="hs-bframe"><div class="hs-board"></div></div>
    ${seasonal.length ? `<p class="hs-thint">Saisonales ist in der Karte mit <span class="hs-gl">${hsGl(x.t.gl[0], 12, x.t.ac)}</span> markiert.</p>` : ''}</div>`);
  const board = p.querySelector('.hs-board');
  const over = () => { const m = board.querySelector('.mark'); const last = m.previousElementSibling; return last.getBoundingClientRect().bottom > board.getBoundingClientRect().bottom - 22; };
  let list = seasonal.slice(), vm = soon.slice(), c2 = list.length > 7;
  for(let i = 0; i < 40; i++){ board.innerHTML = build(list, c2, vm); if(!over()) break; if(!c2 && list.length > 3){ c2 = true; continue; } if(vm.length > 1){ vm.pop(); continue; } if(list.length > 2){ list.pop(); continue; } if(vm.length){ vm.pop(); continue; } break; }
  return true;
}
function hsFavPage(x){
  let favs = x.entries.filter(d => d.top).slice(0, 5); if(!favs.length) return false;
  const item = (d, i) => `<div class="it"><div class="no">${i+1}</div><div class="tx"><div class="k">KAPITEL ${String(x.secNo[d.section] || 0).padStart(2, '0')} · ${hsU(d.section)}</div>
    <div class="fn">${esc(d.name)}${hsVeg(d.veg)}</div>${d.desc ? `<p class="hs-ds">${esc(d.desc)}</p>` : ''}<div class="pr">${d.prices.map(([l,p]) => `<span class="hs-p">${l ? `<small>${esc(l)}</small>` : ''}${+p ? hkPrice(p) : ''}</span>`).join('')}</div></div></div>`;
  const photo = HS_A.fondue ? `<div class="fph"><div class="fr"><img src="${HS_A.fondue}" alt=""></div></div>` : '';
  const p = hsPage(x, 'hs-fav', `<div class="hs-body"><div class="hd"><div class="hx">Haus-<i>Favoriten</i></div>${hsCopy('fav') ? `<p>${esc(hsCopy('fav'))}</p>` : ''}</div><div class="gr"><div class="li"></div>${photo}</div></div>`);
  const li = p.querySelector('.li');
  for(let n = favs.length; n > 0; n--){ li.innerHTML = favs.slice(0, n).map(item).join(''); p.classList.toggle('n5', n >= 5); if([...li.children].every(it => it.scrollHeight <= it.clientHeight + 1)) break; }
  return true;
}
const HS_SLOTS = { // Tellerplätze [x, y, Durchmesser] auf 794 × 831
  1:[[397,395,430]], 2:[[330,250,350],[500,610,270]], 3:[[300,215,330],[545,480,240],[290,630,230]],
  4:[[292,205,325],[578,215,228],[538,492,248],[272,628,252]],
  5:[[280,190,305],[570,150,205],[553,405,215],[272,565,225],[482,695,195]],
  6:[[270,175,285],[560,140,195],[555,372,205],[252,475,215],[472,595,195],[252,715,185]],
  7:[[260,165,265],[545,130,190],[560,352,195],[332,402,185],[542,582,195],[300,612,190],[440,752,152]],
  s:[[250,150,250],[540,118,182],[562,318,192],[342,378,172],[216,520,172],[480,538,178]],
};
function hsTablePage(x, sec){
  const all = sec.items.slice().sort((a, b) => (b.top - a.top) || (Math.max(...b.prices.map(p => +p[1]||0)) - Math.max(...a.prices.map(p => +p[1]||0))));
  const rest = all.length > 7 ? all.slice(6) : []; const on = all.length > 7 ? all.slice(0, 6) : all;
  if(rest.length > 8 || !HS_A.plate) return false;
  const slots = rest.length ? HS_SLOTS.s : HS_SLOTS[on.length];
  const used = new Set();
  const plate = (d, i) => { const [cx, cy, dm] = slots[i]; const al = d.alg.length ? `<span class="hs-al">${d.alg.join(' ')}</span>` : ''; d.alg.forEach(a => used.add(a));
    return `<div class="hs-plate" style="left:${cx-dm/2}px;top:${cy-dm/2}px;width:${dm}px;height:${dm}px;font-size:${(dm/14.2).toFixed(1)}px"><img src="${HS_A.plate}" alt="" style="left:-9.25%;top:-7.4%;width:118.5%;height:118.5%"><div class="tx">
      ${d.top && dm > 230 ? '<div class="tab">EMPFEHLUNG DES HAUSES</div>' : ''}<div class="pnm">${esc(d.name)}</div>${d.desc ? `<div class="pd">${esc(d.desc)}</div>` : ''}
      <div class="pp">${d.prices.map(([l,p]) => (l ? `<small>${esc(l)}</small>` : '') + (+p ? hkPrice(p) : '')).join(' &nbsp; ')}</div>${d.veg || al ? `<div class="pm">${hsVeg(d.veg)}${al}</div>` : ''}</div></div>`; };
  const xx = {...x, used, paper:true};
  const p = hsPage(x, 'hs-table wood', `<div class="hd"><div class="hs-num">${sec.no}</div><div class="tt"><div class="hs-title">${hsU(sec.name)}</div>${sec.intro ? `<p class="hs-intro">${esc(sec.intro)}</p>` : ''}</div></div>
    <div class="area"><img class="cut fork" src="${HS_A.fork || HS_SRC.fork}" alt=""><img class="cut knife" src="${HS_A.knife || HS_SRC.knife}" alt="">${on.map(plate).join('')}
    ${rest.length ? `<div class="hs-strip paper"><div class="st">AUSSERDEM FÜR DIE MITTE</div><div class="hs-grid c2">${rest.map(d => hsDish(d, xx)).join('')}</div></div>` : ''}</div>`, {frame:false});
  const strip = p.querySelector('.hs-strip');
  if(strip && strip.offsetHeight > 196){ p.remove(); x.pages.pop(); return false; }
  p.querySelectorAll('.hs-plate').forEach(pl => { const tx = pl.querySelector('.tx'); let fs = parseFloat(pl.style.fontSize); const pd = pl.querySelector('.pd');
    for(let i = 0; i < 14 && tx.scrollHeight > tx.clientHeight + 1; i++){ if(i === 5 && pd && pl.offsetWidth < 200){ pd.remove(); fs = parseFloat(pl.style.fontSize); continue; } fs *= .95; tx.style.fontSize = fs.toFixed(2) + 'px'; }
    // lange Wörter dürfen den Tellerspiegel nicht verlassen
    const pn = pl.querySelector('.pnm'); for(let i = 0; i < 10 && pn.scrollWidth > tx.clientWidth + 1; i++){ fs *= .95; tx.style.fontSize = fs.toFixed(2) + 'px'; } });
  used.forEach(a => x.used.add(a));
  return true;
}
function hsKidsPage(x, sec){
  const xx = {...x, paper:true};
  const kd = (d, i) => { const cls = d.top ? 'b' : ['b','','m',''][i % 4]; const al = hsAlg(d.alg, x.used);
    return `<div class="hs-kd ${cls}"><div class="kn">${esc(d.name)}${hsVeg(d.veg)}${d.desc || al ? `<small>${esc(d.desc)}${al}</small>` : ''}</div>${d.prices.map(([l,p]) => `<div class="kp" title="${esc(l)}">${+p ? hkPrice(p) : ''}</div>`).join('')}</div>`; };
  let i = 0, first = true, guard = 0;
  while(i < sec.items.length && guard++ < 6){
    const p = hsPage(x, 'hs-kids', `<div class="hs-body"><div class="hs-zone paper grow kz"><div class="hs-inl"></div>
      <div class="hs-sh"><div class="hs-num">${sec.no}</div><div class="tt"><div class="hs-title">${esc(sec.name)}${first ? '' : ' <span style="font-size:.5em">· Fortsetzung</span>'}</div>${first && sec.intro ? `<p class="hs-intro">${esc(sec.intro)}</p>` : ''}</div></div>
      <div class="ghost">${hsIll('kinder', 132, x.t.ink, 1.1)}</div><div class="hs-cloud"></div></div></div>`);
    const cloud = p.querySelector('.hs-cloud'); const fits = () => cloud.scrollHeight <= cloud.clientHeight + 1;
    const n0 = i;
    while(i < sec.items.length){ const n = hsEl(kd(sec.items[i], i)); cloud.appendChild(n); if(!fits()){ n.remove(); break; } i++; }
    if(i === n0){ cloud.appendChild(hsEl(kd(sec.items[i], i))); i++; }
    first = false;
  }
  return true;
}
function hsBackPage(x){
  const st = S.settings; const used = [...x.used].sort(); const keys = used.length ? used : Object.keys(ALG);
  const contact = [st.address, [st.phone, st.email].filter(Boolean).join(' · ')].filter(Boolean);
  hsPage(x, 'hs-back', `<div class="hs-body">
    ${HS_A.stube ? `<figure class="photo"><img src="${HS_A.stube}" alt="Die Gaststube"></figure>` : ''}
    ${hsCopy('claim') ? `<p class="claim">${esc(hsCopy('claim'))}</p>` : ''}
    ${hsCopy('back') ? `<p class="voice">${esc(hsCopy('back'))}</p>` : ''}
    <div class="mid">${HS_A.emblem ? `<img class="hs-emb2" src="${HS_A.emblem}" alt="">` : '<div class="hs-emb"><img src="brand/logo.svg" alt=""></div>'}<p class="addr"><b>${hsU(st.name)}</b>${contact.map(c => '<br>' + hsU(c)).join('')}</p></div>
    <div class="hs-leg"><div class="hx">ALLERGENE &amp; ZEICHEN</div><div class="lg">${keys.map(a => `<span><b>${a}</b> ${esc(ALG[a])}</span>`).join('')}</div>
      <div class="mk"><span>${hsVeg('v')} vegetarisch</span><span>${hsVeg('vg')} vegan</span><span>${hsGl(x.t.gl[0], 13, x.t.ac)} saisonal</span><span><i class="sw"></i> Empfehlung des Hauses</span></div>
      <p class="fnote">${esc(x.s.footer || 'Alle Preise in Euro inkl. MwSt.')}</p></div></div>`, {footLeft:''});
}

/* ---------- Fließende Kapitel: messen, umbrechen, nie ein Gericht teilen ---------- */
function hsFlow(x, secs){
  let page = null, body = null;
  const newPage = () => { page = hsPage(x, 'hs-list', '<div class="hs-body"></div>'); body = page.querySelector('.hs-body'); };
  const fits = () => body.scrollHeight <= body.clientHeight + 1;
  const zoneFor = surf => { let z = body.lastElementChild; if(z && z.classList.contains(surf)) return z; z = hsEl(`<div class="hs-zone ${surf}">${surf === 'paper' ? '<div class="hs-inl"></div>' : ''}</div>`); body.appendChild(z); return z; };
  for(const sec of secs){
    const surf = sec.surface, paper = surf === 'paper', xx = {...x, paper};
    const col = paper ? '#1f2328' : '#C59C69';
    const head = `<div class="hs-sh"><div class="hs-num">${sec.no}</div><div class="tt"><div class="hs-title">${hsU(sec.name)}</div>${sec.intro ? `<p class="hs-intro">${esc(sec.intro)}</p>` : ''}</div><div class="ill">${hsIll(sec.name, 58, paper ? '#b08a57' : col)}</div></div>`;
    const cont = `<div class="hs-cont"><span class="hs-num">${sec.no}</span>${hsU(sec.name)}<i>Fortsetzung</i></div>`;
    const feats = paper || sec.items.length > 1 ? sec.items.filter(d => d.top) : [];
    const units = [...feats.map(d => ['f', hsFeat(d, xx)]), ...sec.items.filter(d => !feats.includes(d)).map(d => ['d', hsDish(d, xx)])];
    const c2 = paper && units.filter(u => u[0] === 'd').length >= 6;
    let i = 0, first = true, guard = 0;
    while(i < units.length && guard++ < 30){
      if(!page) newPage();
      const fresh = !body.children.length;
      const zone = zoneFor(surf); const zNew = zone.children.length <= (paper ? 1 : 0);
      const se = hsEl(`<section class="hs-sec ${paper ? '' : 'hs-big'}" data-sec="${esc(sec.name)}">${first ? head : cont}<div class="hs-fts"></div>${c2 ? '<div class="hs-cols"><div class="hs-col"></div><div class="hs-col"></div></div>' : '<div class="hs-grid"></div>'}</section>`);
      zone.appendChild(se); const fts = se.querySelector('.hs-fts'), grid = se.querySelector('.hs-grid'), cols = [...se.querySelectorAll('.hs-col')]; const n0 = i;
      const put = []; // Gerichte dieses Abschnitts auf diesem Blatt (zweispaltig: Spalten gleich hoch, Lesefolge spaltenweise)
      const spread = () => { if(!c2) return; let tot = 0; put.forEach(n => { cols[0].appendChild(n); }); const hs = put.map(n => n.offsetHeight + 13); tot = hs.reduce((a, b) => a + b, 0); let acc = 0, k = 0; while(k < put.length && acc < tot/2 - 1){ acc += hs[k]; k++; } put.slice(k).forEach(n => cols[1].appendChild(n)); };
      const drop = () => { const n = put.pop(); n && n.remove(); spread(); };
      while(i < units.length){ const n = hsEl(units[i][1]);
        if(units[i][0] === 'f'){ fts.appendChild(n); if(!fits()){ n.remove(); break; } }
        else { put.push(n); if(c2) spread(); else grid.appendChild(n); if(!fits()){ drop(); break; } }
        i++; }
      let placed = i - n0; const left = units.length - i;
      // Überschrift nie allein, kein einzelnes Gericht als Rest
      if(left && !fresh && placed < Math.min(c2 ? 4 : 2, units.length - n0)){ i = n0; placed = 0; }
      if(left === 1 && placed >= 3 && put.length){ drop(); i--; placed--; }
      if(!placed){ se.remove(); if(zNew) zone.remove(); if(fresh){ // passt nicht einmal auf ein leeres Blatt: trotzdem setzen
          const z = zoneFor(surf); z.appendChild(se); const n = hsEl(units[i][1]); (units[i][0] === 'f' ? fts : (grid || cols[0])).appendChild(n); i++; first = false; } page = null; continue; }
      first = false;
      if(i < units.length) page = null;
    }
  }
}
/* Blätter ausgleichen: Papierbogen bis zum Rand, kurze Schieferkapitel groß, Bergkamm als Abschluss */
function hsBalance(x){
  for(const p of x.pages){ if(!p.classList.contains('hs-list')) continue;
    const body = p.querySelector('.hs-body'); const zones = [...body.children]; if(!zones.length) continue;
    const free = () => body.clientHeight - (zones[zones.length-1].offsetTop + zones[zones.length-1].offsetHeight);
    const last = zones[zones.length-1];
    if(zones.every(z => z.classList.contains('slate')) && free() > 260){
      const secs = [...body.querySelectorAll('.hs-sec')]; secs.forEach(s => s.classList.add('hs-hero')); secs.forEach(s => { const ill = s.querySelector('.ill'); if(ill) ill.innerHTML = hsIll(s.dataset.sec, 92, '#C59C69', 1.2); });
      if(body.scrollHeight > body.clientHeight + 1){ secs.forEach(s => { s.classList.remove('hs-hero'); const ill = s.querySelector('.ill'); if(ill) ill.innerHTML = hsIll(s.dataset.sec, 58, '#C59C69'); }); }
      else if(secs.length === 1 && zones.length === 1 && free() > 300){ // ein kurzes Kapitel allein: Gerichte gleichmäßig über das Blatt, Bergkamm als Abschluss
        last.classList.add('grow', 'hs-spread'); const n = secs[0].querySelectorAll('.hs-d,.hs-feat').length; last.style.paddingBottom = (n >= 4 ? 170 : 210) + 'px';
        last.appendChild(hsEl(`<div class="hs-fill">${hsRidge(x.k, 688, '#C59C69', 1.1)}</div>`)); continue; }
    }
    const f = free();
    if(last.classList.contains('paper')){ last.classList.add('grow'); if(f > 125) last.appendChild(hsEl(`<div class="hs-fill">${hsRidge(x.k, 660, '#C59C69', 1.1)}</div>`)); }
    else if(f > 190){ const sn = last.lastElementChild && last.lastElementChild.dataset.sec; body.appendChild(hsEl(`<div class="hs-fill">${f > 420 && sn ? `<div class="bigill">${hsIll(sn, 210, '#C59C69', .9)}</div>` : ''}${hsRidge(x.k, 688, '#C59C69', 1.1)}</div>`)); }
  }
}

function hsPages(k, date){
  const s = S.settings.seasons[k]; const host = hsHost(); host.innerHTML = '';
  const items = guestItems(k, date); const used = new Set();
  const secNames = secList().filter(sn => items.some(m => m.section === sn));
  const secs = secNames.map((name, i) => { const list = hkEntries(items.filter(m => m.section === name)).map(hsInfo);
    const kind = /teil/i.test(name) ? 'table' : /kind/i.test(name) ? 'kids' : 'list';
    return {name, no:String(i+1).padStart(2, '0'), intro:hsCopy('sec', name), items:list, kind, surface: list.length <= 4 ? 'slate' : 'paper'}; });
  const x = {k, date, s, t:hsTheme(k), host, pages:[], used, entries:secs.flatMap(sc => sc.items), secNo:Object.fromEntries(secs.map((sc, i) => [sc.name, i+1]))};
  hsCoverPage(x);
  hsTafelPage(x);
  hsFavPage(x);
  let run = [];
  const flush = () => { if(run.length){ hsFlow(x, run); run = []; } };
  for(const sec of secs){
    if(sec.kind === 'table'){ flush(); if(hsTablePage(x, sec)) continue; sec.kind = 'list'; }
    if(sec.kind === 'kids'){ flush(); hsKidsPage(x, sec); continue; }
    run.push(sec);
  }
  flush();
  if(!secs.length){ const p = hsPage(x, 'hs-list', '<div class="hs-body"><p class="hs-welcome">Für diese Saison sind noch keine Gerichte eingetragen.</p></div>'); }
  hsBalance(x);
  hsBackPage(x);
  x.pages.forEach((p, i) => { const n = p.querySelector('[data-hs-n]'); if(n) n.textContent = String(i+1).padStart(2, '0'); });
  const out = x.pages.map(p => p.outerHTML); host.innerHTML = '';
  return out;
}

/* ---------- Einbau: Stil, Vorschau, Texte ---------- */
view.hsBig = false;
let HS_PENDING = false;
function hsFit(){ document.querySelectorAll('.hs-prev').forEach(pv => { const sh = pv.querySelector('.hs-sheet'); if(sh && sh.clientWidth) pv.style.setProperty('--hs-s', (sh.clientWidth / HS_W).toFixed(5)); }); }
function guestHtmlHaus(k, date, opts){
  opts = opts || {}; date = date || todayStr(); k = k || seasonFor(date) || 'winter';
  const pages = hsPages(k, date);
  if(opts.print) return pages.join('');
  if(!hsAllReady(k) && !HS_PENDING){ HS_PENDING = true; hsEnsure(k).then(() => { HS_PENDING = false; if($('.hs-prev')) refreshGuest(); }, () => { HS_PENDING = false; }); }
  queueMicrotask(hsFit);
  return `<div class="hs-bar"><span class="hs-count">${pages.length} Blätter · A4 hoch</span>${seg('hsZoom', view.hsBig ? 'one' : 'grid', [['grid','Übersicht'],['one','Groß']])}</div>
    <div class="hs-prev ${view.hsBig ? 'one' : ''}">${pages.map((p, i) => `<div class="hs-sheet"><span class="hs-no">${i+1}</span>${p}</div>`).join('')}</div>`;
}
const _guestHtmlHs = guestHtml;
guestHtml = function(k, d, opts){ return hsStyle() === 'haus' ? guestHtmlHaus(k, d, opts) : _guestHtmlHs(k, d, opts); };
const _guestPrevHtmlHs = guestPrevHtml;
guestPrevHtml = function(){
  if(hsStyle() !== 'haus') return _guestPrevHtmlHs();
  const date = view.gdate || todayStr(); const k = curSeasonKey(); const wdn = new Date(date+'T12:00:00').getDay();
  const closed = (S.settings.closed||[]).includes(wdn) ? `<div class="g-closed">${ico('spark')}${DAYNAME[wdn]} ist Ruhetag. So sähe die Karte trotzdem aus.</div>` : '';
  return closed + guestHtmlHaus(k, date) + specialsFor(date).filter(sp => sp.mode === 'tageskarte').map(sp => `<div class="tk-label">Tageskarte, liegt bei · ${esc(sp.name)}</div>${tageskarteHtml(sp, k)}`).join('');
};
const _printMenuHs = printMenu;
printMenu = function(){
  const pr = $('#print');
  if(hsStyle() !== 'haus'){ pr.classList.remove('hs-print'); return _printMenuHs(); }
  const k = curSeasonKey(), date = view.gdate || todayStr();
  if(!hsAllReady(k)) toast('Karte wird vorbereitet …');
  hsEnsure(k).then(() => { pr.classList.add('hs-print'); pr.innerHTML = guestHtmlHaus(k, date, {print:true}); document.body.classList.add('print-menu'); window.print(); });
};
function hsCopyPanel(){
  const k = curSeasonKey(), date = view.gdate || todayStr(); const items = guestItems(k, date);
  const secs = secList().filter(sn => items.some(m => m.section === sn));
  return `<section class="panel"><div class="panel-h"><div class="hx">Texte</div><button type="button" class="link sm-link" data-act="hsCopyReset">Standardtexte</button></div>
    <div class="hs-copy">
      <label class="f">Begrüßung (Tafelseite)<textarea data-hsc="welcome" rows="3">${esc(hsCopy('welcome'))}</textarea></label>
      <label class="f">Überschrift der Tafel<input data-hsc="tafel" value="${esc(hsCopy('tafel'))}"></label>
      <label class="f">Zeile bei den Haus-Favoriten<input data-hsc="fav" value="${esc(hsCopy('fav'))}"></label>
      <details><summary>Einleitung je Kapitel (${secs.length})</summary>${secs.map(sn => `<label class="f">${esc(sn)}<input data-hsc="sec" data-sec="${esc(sn)}" value="${esc(hsCopy('sec', sn))}"></label>`).join('')}</details>
      <label class="f">Leitspruch (Titel und Rückseite)<input data-hsc="claim" value="${esc(hsCopy('claim'))}"></label>
      <label class="f">Text auf der Rückseite<textarea data-hsc="back" rows="2">${esc(hsCopy('back'))}</textarea></label>
      <p class="hint">Leere Felder bleiben in der Karte leer. Gerichte, Preise, Allergene, Saisonales und Aktionen kommen automatisch aus Ihren Daten.</p>
    </div></section>`;
}
const _renderGuestHs = renderGuest;
renderGuest = function(){
  let html = _renderGuestHs(); const st = hsStyle();
  const hint = st === 'haus' ? `„${HS_NAME}“: Schiefer, Gold und Kreidetafel auf fertigen A4-Blättern.` : '„Schlicht“: helles Papier, wenig Farbe. Gut für den Bürodrucker.';
  html = html.replace('<!--gstyle-->', `<section class="panel"><div class="panel-h"><h2>Gestaltung</h2></div>${seg('gStyle', st, [['haus', HS_NAME],['schlicht','Schlicht']])}<p class="hint">${hint}</p></section>`);
  if(st === 'haus'){
    html = html.replace(/<\/aside>\s*<div class="guest-prev">/, hsCopyPanel() + '</aside><div class="guest-prev">');
    html = html.replace(/<div class="togs"><label class="tog"><input type="checkbox" data-hkk="1"[\s\S]*?<\/div>/, '').replace('Schrift, Raster und Papier bleiben in jeder Saison gleich. So erkennt man immer dasselbe Haus.', 'Schiefer, Gold und Schriften bleiben in jeder Saison gleich. Die Standardfarbe der Saison ist auf den Schiefer abgestimmt; wählen Sie eine andere, färbt sie Saisonzeichen und Kinderseite.').replace('Fotos einzelner Gerichte erscheinen bewusst nicht in der Karte: Sie verschieben die Zeilen. Ein ruhiges Titelbild genügt.', 'Ein eigenes Titelbild wird in Gold-Schiefer-Tönen ins Titelblatt geblendet. Ohne Bild zeichnet die Karte den Bergkamm.');
  }
  return html;
};
let _hsT = 0;
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return;
  if(el.dataset.act === 'gStyle'){ S.settings.guestStyle = el.dataset.id === 'schlicht' ? 'schlicht' : 'haus'; save(); render(); }
  if(el.dataset.act === 'hsZoom'){ view.hsBig = el.dataset.id === 'one'; refreshGuest(); }
  if(el.dataset.act === 'hsCopyReset'){ ask('Alle Texte der Hauskarte auf die Standardtexte zurücksetzen?', () => { S.settings.menuCopy = {sec:{}}; save(); render(); }, 'Zurücksetzen'); }
}, true);
document.addEventListener('input', e => {
  const t = e.target; if(!t.dataset || !t.dataset.hsc) return;
  const c = S.settings.menuCopy || (S.settings.menuCopy = {}); if(!c.sec) c.sec = {};
  if(t.dataset.hsc === 'sec') c.sec[t.dataset.sec] = t.value; else c[t.dataset.hsc] = t.value;
  save(); clearTimeout(_hsT); _hsT = setTimeout(refreshGuest, 350);
});
window.addEventListener('resize', hsFit);
const _refreshGuestHs = refreshGuest;
refreshGuest = function(){ _refreshGuestHs(); hsFit(); };

/* ---------- PDF: jedes Blatt genau eine A4-Seite ---------- */
async function hsExportPdf(filename){
  const el = $('#print'); const pages = [...el.querySelectorAll('.hs-page')];
  toast('PDF wird erstellt …');
  try {
    await pdfLibs(); el.classList.add('pdf');
    if(document.fonts && document.fonts.ready) await document.fonts.ready;
    await Promise.all([...el.querySelectorAll('img')].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const {jsPDF} = window.jspdf; const pdf = new jsPDF({unit:'pt', format:'a4', compress:true});
    const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
    for(let i = 0; i < pages.length; i++){
      el.replaceChildren(pages[i]); await new Promise(r => requestAnimationFrame(r));
      const t = $('#toast'); if(t){ t.textContent = `PDF wird erstellt … Blatt ${i+1} von ${pages.length}`; t.classList.add('show'); clearTimeout(toast._t); }
      const t0 = performance.now(); const canvas = await window.html2canvas(pages[i], {scale:2, backgroundColor:'#1b1e23', useCORS:true, logging:false, width:HS_W, height:HS_H, windowWidth:Math.max(document.documentElement.clientWidth, 1000), windowHeight:window.innerHeight, scrollX:0, scrollY:-window.scrollY,
        ignoreElements: n => n.parentElement === document.body && n.id !== 'print' && n.tagName !== 'STYLE' && n.tagName !== 'LINK'});
      if(i) pdf.addPage(); if(window.HS_DEBUG) console.log('hs page', i+1, Math.round(performance.now() - t0)); 
      pdf.addImage(canvas.toDataURL('image/jpeg', .9), 'JPEG', 0, 0, pw, ph, undefined, 'FAST');
      canvas.width = canvas.height = 0;
    }
    const ok = await saveFile(filename, pdf.output('blob'));
    if(ok) toast(`PDF erstellt: ${filename} (${pages.length} Seiten)`);
  } catch(e){ toast('PDF fehlgeschlagen: ' + (e.message || e)); }
  finally { el.classList.remove('pdf'); el.replaceChildren(...pages); }
}
const _exportPdfHs = exportPdf;
exportPdf = function(filename){ const el = $('#print'); if(el && el.querySelector('.hs-page')) return hsExportPdf(filename); if(el) el.classList.remove('hs-print'); return _exportPdfHs(filename); };
