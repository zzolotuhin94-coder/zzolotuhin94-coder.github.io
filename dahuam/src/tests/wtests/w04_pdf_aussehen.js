// Anleitung als PDF (Links, Datei, offline) und das Aussehen der Willkommensseite: Handy 390 ohne Querscrollen, Tablet, Computer, hell und dunkel.
const L = require('./lib'); const fs = require('fs'); const path = require('path');
const SITE = '/home/user/wt-3/dahuam/';
(async () => { const b = await L.launch(); const errs = [];
  // ---------- PDF ----------
  { const c = await L.ctx(b); const p = await L.page(c, 'index.html?fresh=1'); await p.waitForTimeout(600);
    const w = await L.wl(p);
    L.ok(w && w.pdf === 'Anleitung-DAHUAM202.pdf' && await p.evaluate(() => { const a = document.querySelector('#wl a[data-wl-pdf]'); return a.textContent === 'Anleitung als PDF' && a.target === '_blank' && a.rel === 'noopener'; }), 'Willkommensseite: leiser Link „Anleitung als PDF“ (neuer Tab)', w && w.pdf);
    const r = await p.evaluate(async () => { const x = await fetch('Anleitung-DAHUAM202.pdf'); const buf = new Uint8Array(await x.arrayBuffer()); return {st:x.status, type:x.headers.get('content-type'), head:String.fromCharCode(...buf.slice(0, 5)), size:buf.length}; });
    L.ok(r.st === 200 && /pdf/.test(r.type) && r.head === '%PDF-' && r.size < 3e6, 'die Datei ist auf dem Server erreichbar, ein PDF, unter 3 MB', r);
    const pages = (fs.readFileSync(SITE + 'Anleitung-DAHUAM202.pdf', 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    L.ok(pages >= 2 && pages <= 3, 'die Anleitung hat 2–3 Seiten', pages);
    L.ok(/"Anleitung-DAHUAM202\.pdf"/.test(fs.readFileSync(SITE + 'sw.js', 'utf8')), 'steht in der Offline-Liste (sw.js)');
    await p.click('#wl [data-wl="go"]'); await p.evaluate(() => go('setup')); await p.waitForTimeout(200);
    L.ok(await p.evaluate(() => { const a = document.querySelector('#app .gd-panel a[data-wl-pdf]'); return !!a && a.getAttribute('href') === 'Anleitung-DAHUAM202.pdf' && a.closest('li').querySelector('b').textContent === 'Anleitung als PDF'; }), 'Einstellungen › Hilfe: „Anleitung als PDF“');
    L.ok(await p.evaluate(() => palData().some(x => x.n === 'Anleitung als PDF')), 'Suche: „Anleitung als PDF“');
    L.ok(!fs.existsSync(SITE + 'DAHUAM202-Bildanleitung.pdf') && !/Bildanleitung/.test(fs.readFileSync(SITE + 'index.html', 'utf8')), 'keine alte Bildanleitung mehr, kein Verweis darauf');
    L.ok(c.ext.length === 0, 'keine Anfrage nach außen', c.ext);
    errs.push(...p.errs); await c.close(); }
  // fehlt die Datei (anderer Server): Link zeigt auf die Website
  { const c = await L.ctx(b); await c.route(/Anleitung-DAHUAM202\.pdf$/, r => r.request().url().startsWith('http://127.0.0.1') ? r.fulfill({status:404, body:''}) : r.abort());
    const p = await L.page(c, 'index.html?fresh=1'); await p.waitForTimeout(800);
    L.ok(await p.evaluate(() => document.querySelector('#wl a[data-wl-pdf]').href) === 'https://zzolotuhin94-coder.github.io/dahuam/Anleitung-DAHUAM202.pdf', 'Datei fehlt hier (404): der Link führt zur Anleitung auf der Website');
    await c.close(); }
  // eingebettete Vorschau (FRAMED): Website-Adresse, Seite funktioniert
  { const c = await L.ctx(b); const p = await c.newPage(); const pe = []; p.on('pageerror', e => pe.push(e.message));
    await c.route(L.BASE + 'vorschau-test.html', r => r.fulfill({status:200, contentType:'text/html', body:`<!doctype html><iframe id="f" src="${L.BASE}index.html?fresh=1" style="width:420px;height:800px;border:0"></iframe>`}));
    await p.goto(L.BASE + 'vorschau-test.html'); await p.waitForTimeout(2500);
    const f = p.frame({url:/index\.html/}); const r = f ? await f.evaluate(() => ({framed:FRAMED, href:wlPdfHref(), wl:!!document.getElementById('wl'), home:(document.querySelector('#wlHome') || {}).innerText || '', link:(document.querySelector('#wl a[data-wl-pdf]') || {}).href || ''})) : null;
    L.ok(r && r.framed && r.href === 'https://zzolotuhin94-coder.github.io/dahuam/Anleitung-DAHUAM202.pdf' && (!r.wl || r.link === r.href), 'eingebettete Vorschau: Link auf die Website, kein toter Link', r);
    L.ok(r && (!r.wl || /Vorschau/.test(r.home)), 'eingebettete Vorschau: kein Installationshinweis, der hier nicht ginge', r && r.home);
    errs.push(...pe.map(x => 'PE ' + x)); await c.close(); }
  // ---------- Aussehen ----------
  const views = [['phone', L.PHONE, {isMobile:true, hasTouch:true, userAgent:L.UA.iphone}], ['tablet', L.TABLET, {hasTouch:true, userAgent:L.UA.ipad}], ['desktop', L.DESK, {}]];
  for(const dark of [false, true]) for(const [name, vp, ctx] of views){
    const c = await L.ctx(b, {vp, dark, ctx:{...ctx, deviceScaleFactor:name === 'desktop' ? 1 : 2}, init:name === 'tablet' ? () => { Object.defineProperty(navigator, 'maxTouchPoints', {get:() => 5}); } : null});
    const p = await L.page(c, 'index.html?fresh=1'); await p.waitForTimeout(700);
    const m = await p.evaluate(() => { const w = document.getElementById('wl'); const inn = w.querySelector('.wl-in'); const over = [...w.querySelectorAll('*')].filter(n => n.getBoundingClientRect().right > innerWidth + 0.5).map(n => n.className || n.tagName);
      const bg = getComputedStyle(w).backgroundColor, fg = getComputedStyle(w.querySelector('.wl-steps p')).color, logo = getComputedStyle(w.querySelector('.wl-logo'));
      const lum = c => { const v = c.match(/[\d.]+/g).slice(0, 3).map(Number).map(x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
      const L1 = lum(bg), L2 = lum(fg); const cr = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
      return {sw:w.scrollWidth, cw:w.clientWidth, over, inW:Math.round(inn.getBoundingClientRect().width), bg, cr:Math.round(cr * 10) / 10, mask:/logo\.svg/.test(logo.maskImage || logo.webkitMaskImage || ''), btnH:Math.round(w.querySelector('.wl-acts .btn.primary').getBoundingClientRect().height), opacity:getComputedStyle(w).opacity, h:w.scrollHeight, doc:document.documentElement.scrollWidth}; });
    const tag = `${name} ${dark ? 'dunkel' : 'hell'}`;
    L.ok(m.sw <= m.cw && m.over.length === 0 && m.doc <= vp.width, `${tag}: kein Querscrollen, nichts ragt hinaus`, {sw:m.sw, cw:m.cw, over:m.over.slice(0, 4)});
    L.ok(m.cr >= 4.5, `${tag}: Fließtext ausreichend kontrastreich (≥ 4,5:1)`, m.cr);
    L.ok(dark ? /rgb\(23, 24, 26\)/.test(m.bg) /* fix-3: dunkles Design etwas heller, damit die Seitenleiste sich abhebt */ : /rgb\(247, 245, 240\)/.test(m.bg), `${tag}: Hintergrund wie die App`, m.bg);
    L.ok(m.mask && m.btnH >= 44 && m.opacity === '1' && (name === 'phone' ? m.inW === 390 : m.inW <= 560), `${tag}: Logo, Knöpfe ≥ 44 px, Spalte ${name === 'phone' ? 'volle Breite' : 'höchstens 560 px'}`, {btnH:m.btnH, inW:m.inW});
    await p.screenshot({path:path.join(L.OUT, `w-${name}-${dark ? 'dunkel' : 'hell'}.png`), fullPage:false});
    if(name === 'phone'){ await p.evaluate(() => { const w = document.getElementById('wl'); w.scrollTop = w.scrollHeight; }); await p.waitForTimeout(150); await p.screenshot({path:path.join(L.OUT, `w-${name}-${dark ? 'dunkel' : 'hell'}-unten.png`)}); }
    errs.push(...p.errs); await c.close();
  }
  // Einstellungen am Handy mit offener Widmung und Link: kein Querscrollen
  { const c = await L.ctx(b, {vp:L.PHONE, ctx:{isMobile:true, hasTouch:true, deviceScaleFactor:2}}); const p = await L.page(c, 'index.html?nointro&fresh=1');
    await p.evaluate(() => { S.settings.gift = {to:'Für die Chefs', text:'Ein langer Text '.repeat(20), from:'Jemand'}; view.more = {setup:true}; go('setup'); }); await p.waitForTimeout(200);
    await p.click('#setupGift [data-act="giftLink"]'); await p.waitForTimeout(150);
    L.ok(await p.evaluate(() => document.documentElement.scrollWidth) === 390, 'Einstellungen › Widmung mit Geschenk-Link am Handy: genau 390 px breit');
    await p.evaluate(() => document.getElementById('setupGift').scrollIntoView()); await p.waitForTimeout(100);
    await p.screenshot({path:path.join(L.OUT, 'w-einstellungen-widmung.png')});
    errs.push(...p.errs); await c.close(); }
  await L.done(b, errs);
})();
