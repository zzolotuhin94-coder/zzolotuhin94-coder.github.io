// Erzeugt samples/pre-d-demo.json: der Beispielstand, wie ihn Version 1.3.0 (vor Paket D1) gespeichert hat. Braucht die alte index.html auf :8766.
const L = require('./lib'); const fs = require('fs');
(async () => { const b = await L.launch(); const c = await b.newContext(); const p = await c.newPage(); await p.goto('http://127.0.0.1:8766/dahuam/index.html?nointro'); await L.ready(p);
  const d = await p.evaluate(async () => { // ein paar Spuren, die die Umstellung treffen muss: offene Getränke-Bestellung, laufende Inventur, Rezeptur mit Stück-Flasche
    const o = newOrder('sup_getraenke', false); o.lines = [lineFor(P('mineral'), 2), lineFor(P('bier'), 1)]; o.status = 'sent'; o.sentAt = new Date().toISOString();
    S.cards.push({id:'old_schorle', no:S.settings.nextNo++, name:'Apfelschorle alt', type:'dish', category:'Für Kinder', yieldG:'', img:'', steps:[], items:[{ref:'p:apfelsaft', qty:0.25, net:''}, {ref:'p:mineral', qty:1, net:''}]});
    S.invDraft = {date:new Date().toISOString(), counts:{mineral:24, pork:10}};
    addMove('waste', 'gv', -1, 'Bruch');
    save(); await __store.idle(); const d = await __store.read(); d.salesDays = {}; d.salesDemo = false; return d; });
  fs.writeFileSync(__dirname + '/samples/pre-d-demo.json', JSON.stringify(d)); console.log('ok', JSON.stringify(d).length, d.settings.barV, d.products.find(x => x.id === 'mineral').unit); await b.close(); })();
