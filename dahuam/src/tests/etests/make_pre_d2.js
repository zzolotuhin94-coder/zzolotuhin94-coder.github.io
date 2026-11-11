// Erzeugt samples/pre-d2-demo.json: der Beispielstand, wie ihn Version 1.4.0 (vor Paket D2) gespeichert hat. Braucht die alte index.html (Umgebung OLD_URL, sonst :8765 vor dem Neubau).
const L = require('./lib'); const fs = require('fs');
(async () => { const b = await L.launch(); const {p} = await L.open(b, {url:process.env.OLD_URL || L.URL});
  const d = await p.evaluate(async () => { // Spuren, die die Umstellung treffen muss: gesendete Bestellung mit Kühlware, gebuchter Wareneingang mit Temperatur als Text, Messwert außerhalb
    const sp = S.suppliers.find(s => S.products.some(x => x.supplier === s.id && x.loc === 'K')); const ps = S.products.filter(x => x.supplier === sp.id && x.loc === 'K').slice(0, 2);
    const o = newOrder(sp.id, false); o.lines = ps.map(x => lineFor(x, 1)); o.status = 'sent'; o.sentAt = new Date().toISOString(); o.id = 'ord_pre_d2';
    const done = S.orders.find(x => x.receipt); if(done) done.receipt.temp = '3,5 °C';
    save(); await __store.idle(); return await __store.read(); });
  fs.writeFileSync(__dirname + '/samples/pre-d2-demo.json', JSON.stringify(d)); console.log('ok', JSON.stringify(d).length, d.app || '', Object.keys(d.checks), d.cards.length); await b.close(); })();
