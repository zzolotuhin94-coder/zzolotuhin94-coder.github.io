/* =====================================================================
   Hauskarte – was davon bleibt: Texte der Karte (S.settings.menuCopy), Linienzeichnungen,
   Saisonzeichen, Bergkamm und Canvas-Helfer. Die Blätter selbst setzt seit 1.6 der
   Speisekarte-Gestalter (gestalter.js); „Hauskarte“ ist dort eine Vorlage.
   ===================================================================== */
const HS_SEASON = {
  winter:   {ac:'#a9c3d6', ink:'#557890', gl:['snow','fir'],        word:'Jetzt im Winter'},
  fruehling:{ac:'#a8c97a', ink:'#5f7f3a', gl:['blossom','baerlauch'], word:'Jetzt im Frühling'},
  sommer:   {ac:'#86c5c0', ink:'#2f7b78', gl:['sun','wave'],        word:'Jetzt im Sommer'},
  herbst:   {ac:'#dd9150', ink:'#9a5620', gl:['leaf','mushroom'],   word:'Jetzt im Herbst'},
};
/* Standardtexte: nur Stimmung, keine Behauptungen. Im Gestalter am jeweiligen Baustein änderbar. */
const HS_COPY = {
  tafel: 'Heute an der Tafel',
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
  glas:'<path d="M26,20h26c0,18-4,29-13,29s-13-11-13-29z"/><path d="M39,49v25 M28,76h22"/><path d="M28,33h22" stroke-opacity=".6"/><path d="M60,42h22v35a3,3 0 0 1-3,3h-16a3,3 0 0 1-3-3z"/><path d="M82,50h5a5,5 0 0 1 5,5v10a5,5 0 0 1-5,5h-5"/><path d="M58,42c-1-5 4-8 8-6 2-4 9-4 11 0 4-2 8 1 7 6"/><path d="M67,52v19 M75,52v19" stroke-opacity=".6"/>',
  krake:'<path d="M32,24a14,14 0 0 1 28,0v28h-28z"/><path d="M34,52c-2,10-8,14-12,22 M40,52c-1,10-4,16-6,24 M46,52c0,10 0,16 0,24 M52,52c1,10 4,16 6,24 M58,52c2,10 8,14 12,22"/><circle cx="40" cy="30" r="1.6" fill="currentColor" stroke="none"/><circle cx="52" cy="30" r="1.6" fill="currentColor" stroke="none"/><path d="M41,38q5,4 10,0"/><path d="M70,64h22l-3,16h-16z"/><path d="M75,64l4-14 M81,64l1-14 M87,64l-2-13"/>',
};
const HS_ILL_FOR = [[/flamm/i,'flammkuchen'],[/teil|fondue/i,'fondue'],[/supp|vorsp/i,'suppe'],[/salat|bowl/i,'salat'],[/rösti|roesti/i,'roesti'],[/burger|pasta/i,'burger'],[/süß|suess|dessert|nachsp/i,'schmarrn'],[/kind/i,'krake']];
function hsIll(name, size, color, sw){ const k = (HS_ILL_FOR.find(([re]) => re.test(name)) || [, (S.settings.secVat || {})[name] === 'g' || secLooksDrink(name) ? 'glas' : 'teller'])[1]; return hsSvg(HS_ILL[k], '0 0 100 100', size, size, color, sw || 1.5); }
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
function hsLoadImg(src){ return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('Bild fehlt: ' + src)); i.src = src; }); }
function hsUrl(c, type, q){ const d = c.toDataURL(type, q); try { const [h, b] = d.split(','); const bin = atob(b); const u = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return URL.createObjectURL(new Blob([u], {type:h.slice(5).split(';')[0]})); } catch(e){ return d; } }
function hsCan(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function hsDrawCover(g, img, W, H, fx, fy){ const r = Math.max(W/img.width, H/img.height); const w = img.width*r, h = img.height*r; g.drawImage(img, (W-w)*(fx==null?.5:fx), (H-h)*(fy==null?.5:fy), w, h); }
function hsVignette(g, W, H, warm, dark){
  let gr = g.createRadialGradient(W/2, H*.2, 0, W/2, H*.2, W*.95); gr.addColorStop(0, `rgba(255,196,120,${warm})`); gr.addColorStop(1, 'rgba(255,196,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  gr = g.createRadialGradient(W/2, H/2, H*.34, W/2, H/2, H*.74); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${dark})`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
const HS_MONTHS = ['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
function hsRange(a, b){ b = b || a; const [ya,ma,da] = a.split('-').map(Number), [yb,mb,db] = b.split('-').map(Number);
  if(a === b) return `${da}. ${HS_MONTHS[ma-1]}`; if(ma === mb) return `${da}.–${db}. ${HS_MONTHS[ma-1]}`; return `${da}. ${HS_MONTHS[ma-1]} – ${db}. ${HS_MONTHS[mb-1]}`; }
