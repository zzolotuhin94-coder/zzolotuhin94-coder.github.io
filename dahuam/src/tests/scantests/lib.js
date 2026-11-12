// Strichcode-Scanner: gemeinsame Helfer. Server auf :8765 (PORT=…), feste Uhr Do 12.11.2026, 10:30, frische Beispieldaten je Kontext.
// Strichcodes zeichnet ein kleiner eigener Kodierer (EAN-13, EAN-8, UPC-A, Code 128, ITF-14) auf ein Canvas; daraus entstehen
// Bilder für den Dekoder und .y4m-Videos für die künstliche Kamera von Chromium (--use-file-for-fake-video-capture).
const E = require('../etests/lib'); const path = require('path'); const fs = require('fs');
Object.assign(exports, E); const S0 = require('../storetests/lib'); exports.chromium = S0.chromium; exports.ctx = S0.ctx; exports.page = S0.page;
exports.OUT = path.join(__dirname, '..', 's-out'); try { fs.mkdirSync(exports.OUT, {recursive:true}); } catch(e){}
exports.REVIEW = '/home/user/review-out/scan'; try { fs.mkdirSync(exports.REVIEW, {recursive:true}); } catch(e){}
exports.PHONE = {vp:{width:390, height:844}, ctx:{hasTouch:true, isMobile:true}};
exports.IPAD = {vp:{width:820, height:1180}, ctx:{hasTouch:true, isMobile:true}};
exports.shot = async (p, name, opts = {}) => { await p.screenshot({path:path.join(opts.review ? exports.REVIEW : exports.OUT, name + '.png'), fullPage:!!opts.full}); };

/* ---------- Kodierer (läuft im Browser: bc(type, text, opts) → Canvas) ---------- */
exports.ENCODER = `(() => {
  const L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  const R = L.map(s => s.replace(/./g, c => c === '0' ? '1' : '0')), G = R.map(s => s.split('').reverse().join(''));
  const PAR = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];
  const C128 = '212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232'.split(' ');
  const ITF = ['nnwwn','wnnnw','nwnnw','wwnnn','nnwnw','wnwnn','nwwnn','nnnww','wnnwn','nwnwn'];
  const chk = s => { let t = 0; s.split('').reverse().forEach((c, i) => { t += +c * (i % 2 ? 1 : 3); }); return String((10 - t % 10) % 10); };
  // Module als 0/1-Folge
  function ean13(d){ if(d.length === 12) d += chk(d); const p = PAR[+d[0]]; let m = '101'; for(let i = 1; i <= 6; i++) m += (p[i - 1] === 'L' ? L : G)[+d[i]]; m += '01010'; for(let i = 7; i <= 12; i++) m += R[+d[i]]; return {m:m + '101', text:d}; }
  function ean8(d){ if(d.length === 7) d += chk(d); let m = '101'; for(let i = 0; i < 4; i++) m += L[+d[i]]; m += '01010'; for(let i = 4; i < 8; i++) m += R[+d[i]]; return {m:m + '101', text:d}; }
  function widths2m(ws){ let m = '', bar = true; for(const w of ws){ m += (bar ? '1' : '0').repeat(+w); bar = !bar; } return m; }
  function code128(t){ const vals = [104]; for(const ch of t) vals.push(ch.charCodeAt(0) - 32); let s = vals[0]; for(let i = 1; i < vals.length; i++) s += i * vals[i]; vals.push(s % 103); return {m:vals.map(v => widths2m(C128[v])).join('') + widths2m('2331112'), text:t}; }
  function itf(d){ if(d.length === 13) d += chk(d); let m = '1010'; const W = 3; for(let i = 0; i < d.length; i += 2){ const a = ITF[+d[i]], b = ITF[+d[i + 1]]; for(let k = 0; k < 5; k++){ m += '1'.repeat(a[k] === 'w' ? W : 1) + '0'.repeat(b[k] === 'w' ? W : 1); } } return {m:m + '1'.repeat(W) + '01', text:d}; }
  window.bcCheck = chk;
  window.bc = (type, text, o = {}) => {
    const r = type === 'ean13' || type === 'upca' ? ean13(type === 'upca' ? '0' + text : text) : type === 'ean8' ? ean8(text) : type === 'code128' ? code128(text) : itf(text);
    const mod = o.mod || 3, quiet = 12 * mod, h = o.h || 90 * mod / 3;
    const W = o.W || r.m.length * mod + quiet * 2, H = o.H || h + 40;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = o.bg || '#fff'; g.fillRect(0, 0, W, H); g.fillStyle = '#000';
    const x0 = Math.round((W - r.m.length * mod) / 2), y0 = Math.round((H - h) / 2);
    for(let i = 0; i < r.m.length; i++) if(r.m[i] === '1') g.fillRect(x0 + i * mod, y0, mod, h);
    cv.dataset.text = r.text; return cv;
  };
})();`;

/* ---------- künstliche Kamera: Bild (RGBA) → .y4m (4:2:0) ---------- */
exports.y4m = (file, w, h, rgba, frames = 6) => {
  const Y = Buffer.alloc(w * h), U = Buffer.alloc(w * h / 4), V = Buffer.alloc(w * h / 4);
  for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){ const i = (y * w + x) * 4; const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
    Y[y * w + x] = Math.max(0, Math.min(255, Math.round(0.299 * r + 0.587 * g + 0.114 * b)));
    if(!(y % 2) && !(x % 2)){ const k = (y / 2) * (w / 2) + x / 2; U[k] = Math.max(0, Math.min(255, Math.round(-0.169 * r - 0.331 * g + 0.5 * b + 128))); V[k] = Math.max(0, Math.min(255, Math.round(0.5 * r - 0.419 * g - 0.081 * b + 128))); } }
  const parts = [Buffer.from(`YUV4MPEG2 W${w} H${h} F15:1 Ip A1:1 C420jpeg\n`)];
  for(let f = 0; f < frames; f++) parts.push(Buffer.from('FRAME\n'), Y, U, V);
  fs.writeFileSync(file, Buffer.concat(parts)); return file;
};
// Szene wie vor der Kamera: grauer Tisch, Etikett mit Strichcode etwas schräg (Mitte auf 40 % der Höhe, dort steht der Sucher), leichtes Rauschen
exports.scene = async (p, type, text, opts = {}) => p.evaluate(([enc, type, text, o]) => { if(!window.bc) (0, eval)(enc);
  const W = o.w || 640, H = o.h || 480; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = '#6f6a60'; g.fillRect(0, 0, W, H);
  const b = window.bc(type, text, {mod:o.mod || 2});
  g.save(); g.translate(W / 2, Math.round(H * (o.cy || 0.4))); g.rotate((o.rot || 0) * Math.PI / 180); g.fillStyle = '#f4f1ea'; g.fillRect(-b.width / 2 - 14, -b.height / 2 - 14, b.width + 28, b.height + 28); g.drawImage(b, -b.width / 2, -b.height / 2); g.restore();
  const id = g.getImageData(0, 0, W, H); let s = 7; for(let i = 0; i < id.data.length; i += 4){ s = (s * 1103515245 + 12345) & 0x7fffffff; const n = (s % 17) - 8; id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n; }
  return {w:W, h:H, data:Array.from(id.data), text:b.dataset.text};
}, [exports.ENCODER, type, text, opts]);
// Browser mit künstlicher Kamera (zeigt die .y4m-Datei)
exports.launchCam = file => exports.chromium.launch({args:['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', ...(file ? ['--use-file-for-fake-video-capture=' + file] : [])]});
// eine Zahl wie in der App (de-AT, Komma)
exports.de = n => String(n).replace('.', ',');
exports.wait = (p, fn, arg, ms = 15000) => p.waitForFunction(fn, arg, {timeout:ms, polling:100});
