// Schnellsuche: zwei Wörter, Wörter wie man sie tippt (Gluten, Öl, Backup …), Art je Treffer, nichts doppelt; „Schließen“ statt „Esc“ am Handy.
const L = require('./lib');
const top = (p, q, n = 6) => p.evaluate(([q, n]) => { palFilter(q); return palItems.slice(0, n).map(x => (x.t || PAL_TYPE[x.g] || x.g) + ':' + x.n); }, [q, n]);
(async () => { const b = await L.launch(); const errs = [];
  { const {p} = await L.open(b, {vp:{width:1440, height:900}}); const ev = (f, a) => p.evaluate(f, a); const w = ms => p.waitForTimeout(ms);
    for(const q of ['Gluten', 'glutenfrei', 'GLUTEN']){ const r = await top(p, q, 1); L.ok(r[0] === 'Service:Ohne Gluten', `„${q}“ → Service-Liste „ohne Gluten“`, r); }
    await ev(() => { palOpen(); }); await p.fill('#palIn', 'glutenfrei'); await w(150); await p.keyboard.press('Enter'); await w(300);
    L.ok(await ev(() => view.tab === 'menu' && view.mtab === 'service' && svView().f === 'A' && document.querySelector('#app [data-svf]').value === 'A'), 'Enter öffnet die Service-Liste mit dem Filter „ohne Gluten“');
    const f1 = await top(p, 'Frittieröl'); L.ok(f1[0] === 'Seite:Frittieröl' && f1[1] === 'Aktion:Öl gewechselt', '„Frittieröl“ → Seite Frittieröl, dann „Öl gewechselt“', f1);
    const f2 = await top(p, 'Öl'); L.ok(f2[0] === 'Seite:Frittieröl' && f2.includes('Artikel:Rapsöl') && !f2.some(x => /Talmolkerei|Tatar/.test(x)), '„Öl“ → Frittieröl zuerst, Rapsöl auch; nichts, was nur „ol“ im Wort hat', f2);
    L.ok((await top(p, 'oel'))[0] === 'Seite:Frittieröl' && (await top(p, 'Frittier'))[0] === 'Seite:Frittieröl', '„oel“ und „Frittier“ finden das Frittieröl (nicht nur einen Hilfetext)');
    await ev(() => { palOpen(); }); await p.fill('#palIn', 'Frittier'); await w(150); await p.keyboard.press('Enter'); await w(300);
    L.ok(await ev(() => view.tab === 'checkl' && view.ck.ek === 'oil' && !document.querySelector('#dlg[open]')), 'Enter öffnet das Frittieröl-Protokoll, kein Hilfe-Fenster');
    for(const q of ['Backup', 'Sicherung', 'sichern']){ const r = await top(p, q, 2); L.ok(r[0] === 'Aktion:Sicherung speichern', `„${q}“ → „Sicherung speichern“`, r); }
    L.ok((await top(p, 'Gästekarte PDF', 1))[0] === 'Seite:Gästekarte' && (await top(p, 'Speisekarte drucken', 1))[0] === 'Seite:Gästekarte', 'zwei Wörter: „Gästekarte PDF“ und „Speisekarte drucken“ finden die Gästekarte');
    const lb = await top(p, 'Lieferant bestellen', 8); L.ok(lb.length > 0 && lb.some(x => x.startsWith('Lieferant:')), '„Lieferant bestellen“ findet die Lieferanten zum Bestellen', lb);
    const sz = await top(p, 'Schnitzel', 10); L.ok(sz.join('|') === 'Gericht:Wiener Schnitzel · vom Schwein|Gericht:Wiener Schnitzel · vom Kalb|Gericht:Kinderschnitzel mit Pommes|Hilfe:Garverlust', '„Schnitzel“: je Gericht ein Treffer (die Rezeptur dahinter nicht noch einmal), Hilfe zuletzt', sz);
    const gu = await top(p, 'gulasch', 3); L.ok(gu.join('|') === 'Gericht:Gulaschsuppe|Rezeptur:Gulaschsuppe, Basis (Charge)|Artikel:Rindswadschinken (Gulasch)', '„gulasch“: Gericht, Rezeptur und Artikel sind beschriftet', gu);
    const an = await top(p, 'Anna', 2); L.ok(an[0] === 'Dienst:Anna' && /Heute im Dienst: Küche 08–16/.test(await ev(() => palItems[0].s)), '„Anna“ → ihr Dienst heute (nicht „Annahmeschluss“ zuerst)', an);
    await ev(() => { palOpen(); }); await p.fill('#palIn', 'Gulasch'); await w(150);
    const shown = await ev(() => [...document.querySelectorAll('#palList button')].slice(0, 3).map(x => [x.querySelector('.pal-t').textContent, getComputedStyle(x.querySelector('.pal-t')).display !== 'none']));
    L.ok(shown.every(x => x[1]) && shown.map(x => x[0]).join('|') === 'Gericht|Rezeptur|Artikel', 'die Art steht sichtbar an jedem Treffer', shown);
    await L.shot(p, 'suche-desktop-nachher'); await p.keyboard.press('Escape');
    errs.push(...p.errs); await p.context().close(); }
  // ---------- Handy ----------
  { const {p} = await L.open(b, L.PHONE); const ev = (f, a) => p.evaluate(f, a);
    await ev(() => palOpen()); await p.fill('#palIn', 'gulasch'); await p.waitForTimeout(150);
    const m = await ev(() => ({kbd:getComputedStyle(document.querySelector('#pal .pal-in kbd')).display, x:!!document.querySelector('#pal .pal-x') && getComputedStyle(document.querySelector('#pal .pal-x')).display !== 'none', t:[...document.querySelectorAll('#palList .pal-t')].slice(0, 3).map(x => getComputedStyle(x).display !== 'none' && x.textContent)}));
    L.ok(m.kbd === 'none' && m.x && m.t.join('|') === 'Gericht|Rezeptur|Artikel', 'Handy: „Schließen“ statt „Esc“; die Art steht auch hier', m);
    await L.shot(p, 'suche-handy-nachher');
    await p.click('#pal .pal-x'); L.ok(await ev(() => document.querySelector('#pal').hidden), '„Schließen“ schließt die Suche');
    errs.push(...p.errs); await p.context().close(); }
  await L.done(b, errs);
})();
