// Willkommensseite: gemeinsame Helfer (Server auf :8765). Anders als die anderen Suiten: KEIN vorab gesetztes „Rundgang schon angeboten“,
// damit der erste Start echt ist. Feste Uhr wie etests (Do 12.11.2026, 10:30).
const {chromium, devices} = require('playwright'); const path = require('path'); const fs = require('fs');
const T = require('../teamtests/tlib');
const BASE = 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/dahuam/';
exports.BASE = BASE; exports.devices = devices;
exports.OUT = path.join(__dirname, '..', 'w-out'); fs.mkdirSync(exports.OUT, {recursive:true});
let fails = 0;
exports.ok = (c, msg, extra) => { console.log((c ? '  ok   ' : '  FAIL ') + msg + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); if(!c) fails++; };
exports.launch = () => chromium.launch();
exports.UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
};
exports.PHONE = {width:390, height:844}; exports.TABLET = {width:1024, height:768}; exports.DESK = {width:1400, height:900};
// neuer Kontext; Fremdadressen gesperrt und gezählt
exports.ctx = async (b, o = {}) => {
  const c = await b.newContext({viewport:o.vp || exports.DESK, timezoneId:'Europe/Vienna', locale:'de-AT', serviceWorkers:'block', colorScheme:o.dark ? 'dark' : 'light', acceptDownloads:true, ...(o.ctx || {})});
  c.ext = []; await c.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => { c.ext.push(r.request().url()); r.abort(); });
  await c.addInitScript(T.clock(2026, 11, 12, 10, 30));
  if(o.init) await c.addInitScript(o.init);
  return c;
};
exports.page = async (c, url) => {
  const p = await c.newPage(); p.errs = [];
  p.on('console', m => { if(m.type() === 'error') p.errs.push('console: ' + m.text().slice(0, 200)); });
  p.on('pageerror', e => p.errs.push('PE ' + String(e.message).slice(0, 200)));
  p.on('dialog', d => { p.errs.push('DIALOG ' + d.message()); d.accept(); });
  if(url) await exports.goto(p, url);
  return p;
};
exports.goto = async (p, url) => { await p.goto(url.startsWith('http') ? url : BASE + url); await exports.ready(p); };
exports.ready = async p => { await p.waitForFunction(() => !document.documentElement.classList.contains('booting'), null, {timeout:15000}); await p.waitForTimeout(500); };
exports.wl = p => p.evaluate(() => { const w = document.getElementById('wl'); if(!w) return null; return {txt:w.innerText.replace(/\s+/g, ' ').trim(), for:(w.querySelector('.wl-for') || {}).textContent || '', text:(w.querySelector('.wl-text') || {}).textContent || '', from:(w.querySelector('.wl-from') || {}).textContent || '', home:(w.querySelector('#wlHome') || {}).innerText || '', ask:!!w.querySelector('.wl-ask'), pdf:(w.querySelector('a[data-wl-pdf]') || {}).getAttribute ? w.querySelector('a[data-wl-pdf]').getAttribute('href') : null, btns:[...w.querySelectorAll('.wl-acts button')].map(b => b.textContent.trim())}; });
exports.toast = p => p.evaluate(() => { const t = document.querySelector('#toast'); return t && t.classList.contains('show') ? t.textContent : ''; });
exports.shot = (p, name, o = {}) => p.screenshot({path:path.join(exports.OUT, name + '.png'), fullPage:!!o.full});
exports.done = async (b, errs) => { errs = (errs || []).filter(Boolean); console.log('errors', JSON.stringify(errs)); console.log(fails ? 'FAILS ' + fails : 'ALL OK'); await b.close(); process.exit(fails || errs.length ? 1 : 0); };
