// „Aufs Handy“ je Gerät: iPhone/iPad (Safari), Android (Chrome, mit und ohne Installations-Angebot), Computer, schon installiert.
// „Installiert“ steht nur da, wenn der Browser appinstalled gemeldet hat.
const L = require('./lib');
// unechtes Installations-Angebot von Chrome, nach dem Start ausgelöst
const BIP = () => { window.__bip = {prompted:0}; window.__fireBip = () => { const e = new Event('beforeinstallprompt', {cancelable:true}); e.prompt = async () => { window.__bip.prompted++; }; e.userChoice = Promise.resolve({outcome:'accepted'}); window.dispatchEvent(e); return e.defaultPrevented; }; };
(async () => { const b = await L.launch(); const errs = [];
  const open = async (ua, vp, extra = {}) => { const c = await L.ctx(b, {vp, ctx:{userAgent:ua, isMobile:vp.width < 600, hasTouch:vp.width < 1100, ...(extra.ctx || {})}, init:extra.init}); const p = await L.page(c, 'index.html?fresh=1'); await p.waitForTimeout(600); return {c, p}; };
  // iPhone
  { const {c, p} = await open(L.UA.iphone, L.PHONE); const w = await L.wl(p);
    L.ok(w && /Teilen-Symbol/.test(w.home) && /„Zum Home-Bildschirm“/.test(w.home) && /ohne Internet/.test(w.home) && !/⋮|App installieren/.test(w.home), 'iPhone: „Teilen-Symbol → Zum Home-Bildschirm“, kein Android-Hinweis', w && w.home);
    L.ok(await p.evaluate(() => !!document.querySelector('#wlHome svg.wl-ico')), 'iPhone: das Teilen-Symbol ist mit abgebildet');
    await L.shot(p, 'w-iphone'); errs.push(...p.errs); await c.close(); }
  // iPad (gibt sich als Mac aus, hat aber Touch)
  { const {c, p} = await open(L.UA.ipad, L.TABLET, {init:() => { Object.defineProperty(navigator, 'maxTouchPoints', {get:() => 5}); }}); const w = await L.wl(p);
    L.ok(w && /Teilen-Symbol/.test(w.home), 'iPad (Mac-Kennung mit Touch): Safari-Hinweis', w && w.home); errs.push(...p.errs); await c.close(); }
  // Android ohne Angebot
  { const {c, p} = await open(L.UA.android, L.PHONE); const w = await L.wl(p);
    L.ok(w && /Menü ⋮/.test(w.home) && /„App installieren“/.test(w.home) && !/Teilen-Symbol/.test(w.home) && !(await p.$('#wl [data-wl="install"]')), 'Android ohne Angebot von Chrome: „Menü ⋮ → App installieren“, kein Knopf', w && w.home);
    errs.push(...p.errs); await c.close(); }
  // Android mit Angebot: Knopf, prompt(), aber „installiert“ erst nach appinstalled
  { const {c, p} = await open(L.UA.android, L.PHONE, {init:BIP});
    const prevented = await p.evaluate(() => window.__fireBip()); await p.waitForTimeout(150);
    L.ok(prevented && !!(await p.$('#wl [data-wl="install"]')) && /Mit einem Tipp/.test((await L.wl(p)).home), 'Android mit Angebot: Knopf „App installieren“ (Chrome-Leiste unterdrückt)', (await L.wl(p)).home);
    await L.shot(p, 'w-android');
    await p.click('#wl [data-wl="install"]'); await p.waitForTimeout(200);
    const after = await L.wl(p);
    L.ok(await p.evaluate(() => window.__bip.prompted) === 1 && !/installiert/.test(after.home) && !(await p.$('#wl [data-wl="install"]')), 'Tipp: Chrome fragt; ohne Meldung des Browsers steht nirgends „installiert“', after.home);
    await p.evaluate(() => window.dispatchEvent(new Event('appinstalled'))); await p.waitForTimeout(100);
    L.ok(/Die App ist installiert/.test((await L.wl(p)).home), 'erst nach „appinstalled“: „Die App ist installiert“');
    errs.push(...p.errs); await c.close(); }
  // Computer
  { const {c, p} = await open(L.UA.desktop, L.DESK); const w = await L.wl(p);
    L.ok(w && /am Handy oder Tablet/.test(w.home) && w.home.split(/[.!?]\s/).length <= 3 && !/Teilen-Symbol|⋮/.test(w.home), 'Computer: eine ruhige Zeile, kein Handy-Rezept', w && w.home);
    errs.push(...p.errs); await c.close(); }
  // schon vom Home-Bildschirm geöffnet
  { const {c, p} = await open(L.UA.iphone, L.PHONE, {init:() => { Object.defineProperty(navigator, 'standalone', {get:() => true}); }}); const w = await L.wl(p);
    L.ok(w && /bereits vom Home-Bildschirm/.test(w.home) && !/Teilen-Symbol/.test(w.home), 'vom Home-Bildschirm geöffnet: kein Installationshinweis mehr', w && w.home);
    errs.push(...p.errs); await c.close(); }
  await L.done(b, errs);
})();
