// Heute als ruhiges Tagesblatt: oben die Zeilen, die heute zählen; jede Zeile ist selbst der Knopf;
// „Öl gewechselt“ mit einem Tipp (und Rückgängig); Dienst jetzt/später; Checklisten in einer Zeile, „Schließen …“ erst ab 14 Uhr;
// Einrichtung und Datenlücken eingeklappt am Ende. Handy 390, iPad quer und hoch, Desktop, hell und dunkel.
const L = require('./lib');
(async () => { const b = await L.launch(); const errs = [];
  // ---------- schmal (760 px, fix-3-Tagesblatt; bis 700 px zeigt phone.js die Handy-Zeilen, siehe phonetests/p01), 10:30 ----------
  { const {p} = await L.open(b, L.NARROW); const ev = (f, a) => p.evaluate(f, a); const w = ms => p.waitForTimeout(ms);
    await L.go(p, 'heute');
    const h = await ev(() => document.documentElement.scrollHeight);
    L.ok(h < 1700, 'schmal: Heute ist höchstens zwei Bildschirme lang (vorher rund 2.800 px)', h);
    const secs = await ev(() => [...document.querySelectorAll('#app .dh-sec .dh-l')].map(x => x.textContent));
    L.ok(secs.join('|') === 'Heute zu tun|Team|Demnächst', 'drei ruhige Abschnitte: Heute zu tun, Team, Karte', secs);
    const now = await L.rows(p, '#app .dh-now .dh-r .rw-main b');
    L.ok(now[0] === 'Vorbereitung' && now.slice(1, 4).join('|') === 'Getränke Wildalm|Bäckerei Kornstube|Gastro-Großmarkt Inntal' && now[4] === 'Frittieröl' && now[5] === 'Reinigungsplan' && now[6] === 'Talmolkerei Gerlostal', 'Reihenfolge: Vorbereitung · Bestellen (je Lieferant, bis wann) · Eigenkontrolle · Lieferungen', now);
    const leads = await L.rows(p, '#app .dh-now .dh-ord .rw-lead');
    L.ok(leads.join('|') === 'bis 12:00|bis 15:00|bis 18:00', 'Bestellen: vorne steht „bis HH:MM“', leads);
    const btns = await ev(() => [...document.querySelectorAll('#app .day .btn')].map(x => x.textContent.trim()));
    L.ok(btns.join('|') === 'Öl gewechselt', 'keine Wand aus gleichen Knöpfen: die Zeilen sind die Knöpfe, nur „Öl gewechselt“ ist ein eigener Knopf', btns);
    const top = await ev(() => { const r = document.querySelector('#app .dh-oil').getBoundingClientRect(); return Math.round(r.top); });
    L.ok(top < 844, 'Frittieröl ist im ersten Bildschirm (ohne Scrollen)', top);
    const small = await ev(() => [...document.querySelectorAll('#app .dh-b, #app .dh-x, #app details.dh-more > summary')].filter(e => e.getBoundingClientRect().height < 44).map(e => e.className));
    L.ok(small.length === 0, 'Tippflächen mindestens 44 px hoch', small);
    L.ok(await L.wide(p) === 0, 'keine seitliche Verschiebung');
    const who = await L.txt(p, '#app .tm-dash-who .rw-main');
    L.ok(who === 'Heute im Dienst jetzt: Anna (Küche 08–16) · später: Lukas (Küche 15–23), Theresa (Service 15–23), Hannes (Bar 16–00)', 'Dienst: wer jetzt da ist und wer später kommt', who);
    const ck = await L.txt(p, '#app .ck-dash .rw-main');
    L.ok(ck === 'Checklisten Öffnen Küche 0/12 · Öffnen Bar/Service 0/12', 'Checklisten in einer Zeile; „Schließen …“ steht vormittags noch nicht da', ck);
    const st = await ev(() => { const d = document.querySelector('#app details.dh-more'); return {open:d.open, sum:d.querySelector('summary').innerText.replace(/\s+/g, ' ').trim(), last:!d.nextElementSibling || d.nextElementSibling.classList.contains('demo-line'), rows:[...d.querySelectorAll('.rw-main b')].map(x => x.textContent)}; });
    L.ok(!st.open && st.last && /^einrichtung 44 % · 62 ohne rezeptur · 57 ohne allergene · 9 unter mindestbestand$/.test(st.sum.toLowerCase()) && st.rows.join('|') === 'Einrichtung|Gerichte ohne Rezeptur|Gerichte ohne Allergenangabe|Artikel unter Mindestbestand|Inventur', 'Einrichtung und Datenlücken: eine leise, zugeklappte Zeile ganz unten', st);
    L.ok(!(await ev(() => /Wareneinsatz|Lagerwert|Rohertrag/.test(document.querySelector('#app .day').innerText))), 'keine Auswertung auf Heute (kein Wareneinsatz, kein Lagerwert)');
    await L.shot(p, 'heute-handy-nachher', {full:true});
    // Eigenkontrolle: „Öffnen“ führt an den richtigen Ort
    await p.click('#app .dh-oil .dh-b'); await w(250);
    L.ok(await ev(() => view.tab === 'checkl' && view.ck.ek === 'oil' && document.querySelector('#app h1').textContent.trim().startsWith('Frittieröl')), 'Zeile „Frittieröl“ öffnet das Frittieröl-Protokoll (nicht den Reinigungsplan)');
    await L.go(p, 'heute'); await p.click('#app .dh-clean .dh-b'); await w(250);
    L.ok(await ev(() => view.tab === 'checkl' && view.ck.ek === 'clean'), 'Zeile „Reinigungsplan“ öffnet den Reinigungsplan');
    // „Öl gewechselt“: ein Tipp
    await L.go(p, 'heute'); const n0 = await ev(() => S.checks.ek.log.length);
    await p.click('#app .dh-oil .dh-x'); await w(250);
    const o1 = await ev(() => ({r:S.checks.ek.log[0], n:S.checks.ek.log.length, tab:view.tab, row:!!document.querySelector('#app .dh-oil'), toast:document.querySelector('#toast').innerText, who:tmWhoName()}));
    L.ok(o1.n === n0 + 1 && o1.r.k === 'oil' && o1.r.t === 'wechsel' && o1.r.d === '2026-11-12' && o1.r.a === '10:30' && o1.tab === 'dash' && !o1.row && /Öl gewechselt, 10:30 Uhr/.test(o1.toast) && /Rückgängig/.test(o1.toast), '„Öl gewechselt“: ein Tipp trägt heute, 10:30 ein; die Zeile verschwindet; Hinweis mit „Rückgängig“', o1);
    // Zusammenführung fix2/fix3: eingetragen wird, wer an diesem Gerät arbeitet (wie im Dialog „Öl gewechselt“), und der Hinweis sagt, wer
    L.ok(o1.r.b === o1.who && o1.toast.includes(o1.who), '„Öl gewechselt“ mit einem Tipp: eingetragen von der Person dieses Geräts (wie im Dialog), der Hinweis nennt sie', [o1.r.b, o1.who]);
    await p.click('#toast .toast-act'); await w(250);
    L.ok(await ev(() => S.checks.ek.log.length) === n0 && await ev(() => !!document.querySelector('#app .dh-oil')), '„Rückgängig“ nimmt den Eintrag wieder weg');
    // direkte Sprünge
    await p.click('#app .pl-dash .dh-b'); await w(250); L.ok(await ev(() => view.tab === 'vorb'), 'Zeile „Vorbereitung“ öffnet die Vorbereitung von heute');
    await L.go(p, 'heute'); await p.click('#app .dh-ord .dh-b'); await w(250); L.ok(await ev(() => view.tab === 'buy' && !!view.order && ORD(view.order).supplier === 'sup_getraenke'), 'Bestellzeile öffnet die Bestellung dieses Lieferanten', await ev(() => view.order && ORD(view.order).supplier));
    await L.go(p, 'heute'); await p.click('#app .dh-recv .dh-b'); await w(250); L.ok(await ev(() => view.tab === 'buy' && !!view.recv), 'Lieferung öffnet direkt den Wareneingang');
    await L.go(p, 'heute'); await p.click('#app .tm-dash-who .dh-b'); await w(250); L.ok(await ev(() => view.tab === 'dienst'), 'Dienstzeile öffnet den Dienstplan');
    await L.go(p, 'heute'); await p.click('#app .ck-dash .dh-b'); await w(250); L.ok(await ev(() => view.tab === 'checkl' && ckTpl(view.ck.run).name === 'Öffnen Küche'), 'Checklisten-Zeile öffnet die nächste offene Liste');
    errs.push(...p.errs); await p.context().close(); }
  // ---------- Nachmittag: „Schließen …“ kommt dazu ----------
  { const {p} = await L.open(b, {...L.NARROW, at:[2026, 11, 12, 15, 10]}); await L.go(p, 'heute');
    const ck = await L.txt(p, '#app .ck-dash .rw-main');
    L.ok(ck === 'Checklisten Öffnen Küche 0/12 · Schließen Küche 0/12 · Öffnen Bar/Service 0/12 · Schließen Bar/Service 0/12', 'ab 14 Uhr stehen auch die „Schließen …“-Listen da', ck);
    const fold = await L.txt(p, '#app .rw-fold');
    L.ok(/^Annahmeschluss vorbei: 2 Lieferanten · anzeigen$/.test(fold), 'vorbei ist eingeklappt', fold);
    errs.push(...p.errs); await p.context().close(); }
  // ---------- Geräte, hell und dunkel ----------
  for(const [name, o] of [['ipad-quer', L.TABLET], ['ipad-hoch', {vp:{width:768, height:1024}, ctx:{hasTouch:true}}], ['desktop', {vp:{width:1440, height:900}}]]) for(const dark of [false, true]){
    const {p} = await L.open(b, {...o, dark}); await L.go(p, 'heute');
    const r = await p.evaluate(() => ({w:document.documentElement.scrollWidth - innerWidth, oil:Math.round(document.querySelector('#app .dh-oil').getBoundingClientRect().bottom), who:Math.round(document.querySelector('#app .tm-dash-who').getBoundingClientRect().top)}));
    L.ok(r.w <= 0 && r.oil <= innerHeightOf(o), `${name}${dark ? ' dunkel' : ''}: keine seitliche Verschiebung, Eigenkontrolle im ersten Bildschirm`, r);
    await L.shot(p, `heute-${name}${dark ? '-dunkel' : ''}-nachher`); errs.push(...p.errs); await p.context().close(); }
  await L.done(b, errs);
})();
function innerHeightOf(o){ return o.vp.height; }
