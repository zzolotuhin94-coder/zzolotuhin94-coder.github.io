// Handy-Bedienung (phone.js): gemeinsame Helfer. Feste Uhr wie etests: Donnerstag, 12.11.2026, 10:30. Server auf :8765 (PORT).
process.env.PORT = process.env.PORT || '8765';
const E = require('../etests/lib'); const path = require('path'); const fs = require('fs');
Object.assign(exports, E);
exports.IP13 = {vp:{width:390, height:844}, ctx:{hasTouch:true, isMobile:true, deviceScaleFactor:2}};
exports.SE = {vp:{width:375, height:667}, ctx:{hasTouch:true, isMobile:true, deviceScaleFactor:2}};
exports.DESK = {vp:{width:1280, height:900}};
exports.OUT = process.env.PH_OUT || path.join(__dirname, '..', 'hy-out'); try { fs.mkdirSync(exports.OUT, {recursive:true}); } catch(e){}
exports.shot = async (p, name) => { await p.waitForTimeout(260); await p.screenshot({path:path.join(exports.OUT, name + '.png')}); };
exports.tap = async (p, sel) => { await p.click(sel); await p.waitForTimeout(260); };
exports.txt = (p, sel) => p.evaluate(s => { const n = document.querySelector(s); return n ? n.innerText.replace(/\s+/g, ' ').trim() : null; }, sel);
exports.key = p => p.evaluate(() => document.getElementById('app').dataset.ph || '');
// nichts ragt seitlich hinaus, die Seite lässt sich nicht quer schieben
exports.noSide = (p, w) => p.evaluate(w => { const over = [...document.querySelectorAll('#app *, #phSheet:not([hidden]) *, .bottom *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.right > w + 0.5 || r.left < -0.5) && !e.closest('.hy-chips,.tbl-wrap,.lt-wrap,.seg,.chips-row'); }).slice(0, 4).map(e => e.tagName + '.' + String(e.className).slice(0, 40)); return {sw:document.documentElement.scrollWidth, over}; }, w);
// alle sichtbaren Ziele (Knöpfe, Links, Felder) sind mindestens 44 px hoch und breit genug
exports.small = (p, root) => p.evaluate(root => [...document.querySelectorAll(root + ' button, ' + root + ' a[href], ' + root + ' select, ' + root + ' input:not([type=hidden])')].filter(e => { const r = e.getBoundingClientRect(); if(!r.width || !r.height) return false; if(e.closest('[hidden]')) return false; return r.height < 43.5 || r.width < 43.5; }).slice(0, 6).map(e => (e.dataset.act || e.id || e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().width) + '×' + Math.round(e.getBoundingClientRect().height)), root);
// Kontrast von Text gegen den (deckenden) Hintergrund dahinter, WCAG
exports.contrast = (p, root) => p.evaluate(root => {
  const lum = c => { const a = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', {willReadFrequently:true});
  const rgba = s => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const bgOf = el => { let stack = []; for(let n = el; n && n.nodeType === 1; n = n.parentElement){ const c = rgba(getComputedStyle(n).backgroundColor); if(c[3] > 0){ stack.push(c); if(c[3] >= 0.999) break; } } let out = rgba(getComputedStyle(document.body).backgroundColor).slice(0, 3); if(stack.length && stack[stack.length - 1][3] >= 0.999) out = stack.pop().slice(0, 3); while(stack.length){ const c = stack.pop(); out = out.map((v, i) => c[i] * c[3] + v * (1 - c[3])); } return out; };
  const bad = []; const seen = new Set();
  document.querySelectorAll(root + ' *').forEach(el => { if(![...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim())) return; const r = el.getBoundingClientRect(); if(!r.width || !r.height) return; const cs = getComputedStyle(el); if(cs.visibility === 'hidden' || +cs.opacity === 0 || +cs.fontSize.replace('px', '') === 0) return; if(el.closest('[hidden]')) return;
    const fg = rgba(cs.color); const bg = bgOf(el); const f = fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3])); const a = lum(f), b = lum(bg); const k = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if(k < 4.5){ const key = el.className + '|' + cs.color; if(!seen.has(key)){ seen.add(key); bad.push((el.className || el.tagName) + ' „' + el.textContent.trim().slice(0, 24) + '“ ' + k.toFixed(2)); } } });
  return bad.slice(0, 8); }, root);
