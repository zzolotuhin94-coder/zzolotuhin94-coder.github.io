const { chromium } = require('playwright');
const URL = 'http://127.0.0.1:8765/dahuam/index.html';
async function open(opts={}){
  const browser = opts.browser || await chromium.launch();
  const ctx = opts.ctx || await browser.newContext(opts.ctxOpts || {viewport:{width:1280,height:900}});
  if(!opts.net) await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e.message).slice(0,300))); page.on('console', m => { if(m.type()==='error') errors.push('console: '+m.text().slice(0,200)); });
  await page.addInitScript(() => { try { sessionStorage.setItem('dahuam202_intro','1'); if(!localStorage.getItem('dahuam202_kueche_de_v1_guide')) localStorage.setItem('dahuam202_kueche_de_v1_guide', JSON.stringify({asked:1,mode:'full'})); } catch(e){} });
  if(opts.init) await page.addInitScript(opts.init);
  await page.goto(opts.url || URL, {waitUntil:'load'});
  await page.waitForTimeout(opts.wait ?? 600);
  return {browser, ctx, page, errors};
}
module.exports = {open, URL, chromium};
