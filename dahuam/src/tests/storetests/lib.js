// Gemeinsame Helfer für die Speicher-Tests (Server auf :8765)
const {chromium} = require('playwright');
const BASE = 'http://127.0.0.1:' + (process.env.PORT || 8765) + '/dahuam/';
const URL = BASE + 'index.html?nointro';
const KEY = 'dahuam202_kueche_de_v1';
let fails = 0;
exports.BASE = BASE; exports.URL = URL; exports.KEY = KEY; exports.chromium = chromium;
exports.ok = (c, msg, extra) => { console.log((c ? '  ok   ' : '  FAIL ') + msg + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); if(!c) fails++; };
exports.launch = () => chromium.launch();
// neuer, leerer Browser-Kontext; Fremdadressen sind gesperrt (und werden gezählt)
exports.ctx = async (b, opts = {}) => {
  const ctx = await b.newContext({viewport:opts.vp || {width:1280, height:900}, acceptDownloads:true, timezoneId:'Europe/Vienna', serviceWorkers:opts.sw ? 'allow' : 'block', ...(opts.ctx || {})});
  ctx.ext = [];
  if(!opts.sw) await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => { ctx.ext.push(r.request().url()); r.abort(); });
  await ctx.addInitScript(() => { try { if(!localStorage.getItem('dahuam202_kueche_de_v1_guide')) localStorage.setItem('dahuam202_kueche_de_v1_guide', JSON.stringify({asked:1, mode:'full'})); } catch(e){} });
  if(opts.init) await ctx.addInitScript(opts.init);
  return ctx;
};
exports.page = async (ctx, url) => {
  const p = await ctx.newPage(); p.errs = [];
  p.on('console', m => { if(m.type() === 'error') p.errs.push('console: ' + m.text().slice(0, 200)); });
  p.on('pageerror', e => p.errs.push('PE ' + String(e.message).slice(0, 200) + ' ' + ((e.stack || '').split('\n')[1] || '').trim().slice(0, 120)));
  if(url !== null){ await p.goto(url || URL); await exports.ready(p); }
  return p;
};
exports.ready = async p => { await p.waitForFunction(() => !document.documentElement.classList.contains('booting'), null, {timeout:15000}); await p.waitForTimeout(150); };
exports.idle = p => p.evaluate(() => __store.idle());
exports.done = async (b, errs) => { errs = (errs || []).filter(Boolean); console.log('errors', JSON.stringify(errs)); console.log(fails ? 'FAILS ' + fails : 'ALL OK'); await b.close(); process.exit(fails || errs.length ? 1 : 0); };
