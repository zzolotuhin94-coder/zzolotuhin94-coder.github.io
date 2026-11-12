// Widmung: in den Einstellungen bearbeiten (maskiert, gekürzt), Geschenk-Link erstellen und öffnen (Umlaute, kaputte Links, bestehende Widmung,
// Adresse ohne Parameter), Kopieren mit und ohne Zwischenablage.
const L = require('./lib');
const XSS = '<img src=x onerror="window.__x=1">';
(async () => { const b = await L.launch(); const errs = [];
  const fresh = async (o = {}) => { const c = await L.ctx(b, o); const p = await L.page(c, 'index.html?nointro&fresh=1'); return {c, p}; };
  // ---------- Einstellungen ----------
  { const {c, p} = await fresh({ctx:{permissions:['clipboard-read', 'clipboard-write']}});
    L.ok(await p.evaluate(() => JSON.stringify(WELCOME_GIFT) === '{"from":"","to":"","text":""}'), 'im Quelltext steht keine Widmung (WELCOME_GIFT leer)');
    await p.evaluate(() => { go('setup'); }); await p.waitForTimeout(150);
    L.ok(!(await p.isVisible('#setupGift')), 'Widmung steht unter „Mehr Optionen“, zugeklappt');
    await p.click('#app details.setup-more > summary'); await p.waitForTimeout(150);
    L.ok(await p.isVisible('#setupGift [data-gift="to"]') && await p.isVisible('#setupGift [data-gift="text"]') && await p.isVisible('#setupGift [data-gift="from"]'), 'drei Felder: Für, Text, Von');
    await p.fill('#setupGift [data-gift="to"]', 'Familie Grüßer & Söhne ' + XSS); await p.press('#setupGift [data-gift="to"]', 'Tab');
    await p.fill('#setupGift [data-gift="text"]', 'Für die Küche – mit Dank.\n' + XSS + ' <script>window.__x=2</script>'); await p.press('#setupGift [data-gift="text"]', 'Tab');
    await p.fill('#setupGift [data-gift="from"]', 'Zoë'); await p.press('#setupGift [data-gift="from"]', 'Tab'); await p.waitForTimeout(150);
    const g = await p.evaluate(() => S.settings.gift);
    L.ok(g.to.startsWith('Familie Grüßer & Söhne') && g.from === 'Zoë' && /Dank\.\n<img/.test(g.text), 'gespeichert in S.settings.gift, Umlaute und Zeilenumbruch bleiben', g);
    await p.click('#setupGift [data-act="wlOpen"]'); await p.waitForTimeout(250);
    const w = await L.wl(p);
    L.ok(w && w.for === 'Für Familie Grüßer & Söhne ' + XSS && w.from === 'Zoë' && w.text.includes(XSS) && w.text.includes('<script>'), 'Willkommensseite zeigt die Widmung als Text (HTML erscheint wörtlich)', w && [w.for, w.text, w.from]);
    L.ok(await p.evaluate(() => !document.querySelector('#wl img, #wl script') && window.__x === undefined && document.querySelectorAll('#wl .wl-text br').length === 1), 'kein eingeschleustes Element, nichts ausgeführt; ein Zeilenumbruch als <br>');
    await L.shot(p, 'w-widmung-gesetzt'); await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    // Länge: Text höchstens 400 Zeichen, Namen 60
    await p.evaluate(() => { const t = document.querySelector('#setupGift [data-gift="text"]'); t.removeAttribute('maxlength'); t.value = 'ä'.repeat(900); t.dispatchEvent(new Event('change', {bubbles:true})); const f = document.querySelector('#setupGift [data-gift="from"]'); f.removeAttribute('maxlength'); f.value = 'ö'.repeat(200); f.dispatchEvent(new Event('change', {bubbles:true})); });
    L.ok(await p.evaluate(() => S.settings.gift.text.length === 400 && S.settings.gift.from.length === 60 && document.querySelector('#setupGift [data-gift="to"]').maxLength === 60), 'Text wird auf 400, Namen auf 60 Zeichen gekürzt (auch ohne maxlength im Feld)');
    // Geschenk-Link
    await p.fill('#setupGift [data-gift="text"]', 'Mit Dank für die Jahre – „Grüß Gott“ & Prost!'); await p.press('#setupGift [data-gift="text"]', 'Tab');
    await p.fill('#setupGift [data-gift="from"]', 'Zoë Müller-Lüdenscheidt'); await p.press('#setupGift [data-gift="from"]', 'Tab');
    await p.click('#setupGift [data-act="giftLink"]'); await p.waitForTimeout(150);
    const url = await p.inputValue('#giftUrl');
    L.ok(/^http:\/\/127\.0\.0\.1:\d+\/dahuam\/index\.html#willkommen=[A-Za-z0-9_-]+$/.test(url) && !/nointro|fresh/.test(url), 'Geschenk-Link: Adresse der App ohne Test-Parameter, dahinter #willkommen=… (URL-sicher)', url);
    L.ok(await p.evaluate(u => JSON.stringify(wlDec(u.split('#willkommen=')[1])) === JSON.stringify(S.settings.gift), url), 'der Link enthält genau die eingetragene Widmung');
    await p.click('#giftOut [data-act="giftCopy"]'); await p.waitForTimeout(200);
    L.ok(await L.toast(p) === 'Link kopiert' && await p.evaluate(() => navigator.clipboard.readText()) === url, 'Kopieren: Link in der Zwischenablage');
    errs.push(...p.errs); await c.close();
    // ---------- der Link auf einem frischen Gerät ----------
    const c2 = await L.ctx(b); const p2 = await c2.newPage(); p2.errs = []; p2.on('pageerror', e => p2.errs.push('PE ' + e.message));
    await p2.goto(L.BASE + 'index.html?fresh=1'); await L.ready(p2); await p2.evaluate(() => { localStorage.setItem(KEY + '_welcome', '1'); });   // auch wenn die Seite schon einmal gesehen wurde
    await p2.goto(url); await L.ready(p2); await p2.waitForTimeout(500);
    const w2 = await L.wl(p2);
    L.ok(w2 && w2.text === 'Mit Dank für die Jahre – „Grüß Gott“ & Prost!' && w2.from === 'Zoë Müller-Lüdenscheidt', 'Link öffnen: Willkommensseite mit der Widmung, Umlaute und Anführungszeichen unversehrt', w2 && [w2.text, w2.from]);
    L.ok(await p2.evaluate(() => S.settings.gift.from === 'Zoë Müller-Lüdenscheidt' && !/willkommen/.test(location.href) && location.hash === '#heute'), 'gespeichert; „willkommen=…“ ist aus der Adresse verschwunden', await p2.evaluate(() => location.href));
    await p2.click('#wl [data-wl="go"]'); await p2.goBack().catch(() => {}); await p2.waitForTimeout(300);
    L.ok(await p2.evaluate(() => !/willkommen/.test(location.href)), 'auch im Verlauf (Zurück) steht der Parameter nicht', await p2.evaluate(() => location.href));
    await c2.close(); errs.push(...p2.errs); }
  // ---------- bestehende Widmung wird nicht still überschrieben ----------
  { const {c, p} = await fresh();
    const enc = g => p.evaluate(x => wlEnc(x), g);
    await p.evaluate(() => { S.settings.gift = {to:'', text:'Erste Widmung', from:'A'}; save(); }); await p.evaluate(() => __store.idle());
    const other = await enc({text:'Zweite Widmung', from:'B'});
    await p.goto(L.BASE + 'index.html?nointro#willkommen=' + other); await L.ready(p);
    let w = await L.wl(p);
    L.ok(w && w.ask && w.text === 'Zweite Widmung' && await p.evaluate(() => S.settings.gift.text) === 'Erste Widmung', 'andere Widmung im Link: Seite zeigt sie mit leiser Frage; gespeichert bleibt die bisherige', w && [w.text, w.ask]);
    await p.click('#wl [data-wl="go"]'); await p.waitForTimeout(150);
    L.ok(await p.evaluate(() => S.settings.gift.text) === 'Erste Widmung', 'ohne Antwort geschlossen: die bisherige bleibt');
    await p.goto(L.BASE + 'index.html?nointro#willkommen=' + other); await L.ready(p);
    await p.click('#wl [data-wl="giftNo"]'); await p.waitForTimeout(100); w = await L.wl(p);
    L.ok(!w.ask && w.text === 'Erste Widmung' && await p.evaluate(() => S.settings.gift.text) === 'Erste Widmung', '„Bisherige behalten“: zeigt und behält die bisherige');
    await p.click('#wl [data-wl="go"]');
    await p.goto(L.BASE + 'index.html?nointro#willkommen=' + other); await L.ready(p);
    await p.click('#wl [data-wl="giftYes"]'); await p.waitForTimeout(150); w = await L.wl(p);
    L.ok(!w.ask && w.text === 'Zweite Widmung' && await p.evaluate(() => S.settings.gift.text === 'Zweite Widmung' && S.settings.gift.from === 'B'), '„Übernehmen“: die neue gilt');
    await p.click('#wl [data-wl="go"]');
    await p.goto(L.BASE + 'index.html?nointro#willkommen=' + other); await L.ready(p); w = await L.wl(p);
    L.ok(w && !w.ask, 'dieselbe Widmung noch einmal: keine Frage');
    // Link bei laufender App (hashchange)
    await p.click('#wl [data-wl="go"]'); const third = await enc({text:'Dritte'});
    await p.evaluate(h => { location.hash = '#willkommen=' + h; }, third); await p.waitForTimeout(400); w = await L.wl(p);
    L.ok(w && w.ask && w.text === 'Dritte' && await p.evaluate(() => !/willkommen/.test(location.href)), 'Link bei offener App (Adresse geändert): ebenso, Parameter wird entfernt');
    errs.push(...p.errs); await c.close(); }
  // ---------- kaputte Links: still ignorieren ----------
  { const {c, p} = await fresh();
    const bad = ['%%%', 'abc', '!!', Buffer.from('kein json').toString('base64url'), Buffer.from('[1,2]').toString('base64url'), Buffer.from('{"text":42,"from":{}}').toString('base64url'), Buffer.from([0xff, 0xfe, 0x7b]).toString('base64url'), 'A'.repeat(5000), ''];
    const res = [];
    for(const h of bad){ await p.goto(L.BASE + 'index.html?nointro#willkommen=' + h); await L.ready(p); res.push(await p.evaluate(() => ({wl:!!document.getElementById('wl'), gift:JSON.stringify(S.settings.gift || null), url:/willkommen/.test(location.href), dlg:!!document.querySelector('dialog[open]')}))); }
    L.ok(res.every(r => !r.wl && r.gift === 'null' && !r.url && !r.dlg), 'kaputte Links (kein Base64, kein JSON, falsche Felder, kein UTF-8, zu lang, leer): nichts gespeichert, keine Seite, kein Fenster, Parameter entfernt', res.filter(r => r.wl || r.gift !== 'null' || r.url));
    L.ok(await p.evaluate(() => [wlDec(null), wlDec(wlEnc({text:''})), wlDec(wlEnc({text:'x'.repeat(2000)})).text.length, wlDec(wlEnc({text:'a‮b\u0000c'})).text].join('|')) === '||400|abc', 'Dekoder: leer → nichts, zu lang → gekürzt, Steuerzeichen entfernt');
    L.ok(await p.evaluate(() => wlClean({to:'Für die Küche'}).to) === 'die Küche', '„Für …“ im Feld „Für“: das doppelte „Für“ fällt weg');
    // XSS über den Link
    const x = await p.evaluate(s => wlEnc({to:s, text:s + '</p><script>window.__x=3</script>', from:'"><svg onload=window.__x=4>'}), XSS);
    await p.goto(L.BASE + 'index.html?nointro#willkommen=' + x); await L.ready(p); await p.waitForTimeout(300);
    L.ok(await p.evaluate(() => !!document.getElementById('wl') && !document.querySelector('#wl img, #wl script, #wl svg:not(.wl-ico)') && window.__x === undefined && document.querySelector('#wl .wl-from').textContent.startsWith('">')), 'Link mit HTML: nur als Text gezeigt, nichts ausgeführt');
    await p.keyboard.press('Escape'); await p.evaluate(() => go('setup')); await p.click('#app details.setup-more > summary'); await p.waitForTimeout(150);
    L.ok(await p.evaluate(() => document.querySelector('#setupGift [data-gift="from"]').value.startsWith('">') && !document.querySelector('#app svg[onload], #app img[onerror]') && window.__x === undefined), 'auch im Feld der Einstellungen nur Text');
    errs.push(...p.errs); await c.close(); }
  // ---------- Kopieren ohne Zwischenablage: Text markiert ----------
  { const {c, p} = await fresh({init:() => { try { Object.defineProperty(navigator, 'clipboard', {get:() => ({writeText:() => Promise.reject(new Error('nein'))})}); } catch(e){} document.execCommand = () => false; }});
    await p.evaluate(() => { S.settings.gift = {to:'', text:'Hallo', from:''}; go('setup'); }); await p.click('#app details.setup-more > summary'); await p.waitForTimeout(100);
    await p.click('#setupGift [data-act="giftLink"]'); await p.click('#giftOut [data-act="giftCopy"]'); await p.waitForTimeout(200);
    L.ok(/selbst kopieren/.test(await L.toast(p)) && await p.evaluate(() => document.activeElement.id === 'giftUrl' && document.activeElement.selectionEnd - document.activeElement.selectionStart === document.activeElement.value.length), 'Kopieren verweigert: Link ist markiert, Hinweis „selbst kopieren“');
    await p.evaluate(() => { S.settings.gift = {to:'', text:'', from:''}; view.more = {...(view.more || {}), setup:true}; go('setup'); }); await p.waitForTimeout(100);
    await p.click('#setupGift [data-act="giftLink"]'); await p.waitForTimeout(100);
    L.ok(!(await p.$('#giftUrl')) && /zuerst eine Widmung/.test(await p.textContent('#giftOut')), 'ohne Widmung: kein Link, ein Satz, was fehlt');
    errs.push(...p.errs); await c.close(); }
  await L.done(b, errs);
})();
