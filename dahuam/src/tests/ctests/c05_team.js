// Import Team: Namen, Bereich, Wochenstunden in den Dienstplan.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1440, height:900}});
  await L.openImp(p, 'team'); await L.upload(p, L.sample('team.csv'));
  const pv = await L.preview(p); const cn = await L.counts(p);
  L.ok(cn.neu === 6 && cn.fehler === 3, '6 Personen neu, 3 Zeilen mit Fehler', cn);
  L.ok(pv.filter(x => x.st === 'fehler').map(x => x.n + ':' + x.why).join('|') === '8:Name fehlt|9:Wochenstunden nicht lesbar: „120“ (0 bis 80)|10:doppelt in der Datei (wie Zeile 2)', 'Fehler je Zeile mit Grund', pv.filter(x => x.st === 'fehler').map(x => x.why));
  const rows = await p.evaluate(() => [...document.querySelectorAll('#impList .imp-r')].slice(0, 6).map(x => x.querySelector('.imp-m').innerText.replace(/\s+/g, ' ')));
  L.ok(rows.join('|') === 'Maria Küche · 40 Std. je Woche|Jakob Küche · 38,5 Std. je Woche|Sophie Service · 30 Std. je Woche|Elias Bar · 20 Std. je Woche|Tereza Abwasch · 25 Std. je Woche|Lena Service · 15 Std. je Woche', 'Bereich wird erkannt („Koch“ → Küche, „Kellnerin“ → Service), Stunden mit Komma', rows);
  L.ok(await p.evaluate(() => !!document.querySelector('#app [data-impdrop]') && !document.querySelector('#app [data-impdrop]').checked), 'Beispiel-Team: Angebot „vorher entfernen“, nicht vorausgewählt');
  await p.click('#app .imp-opt .tog'); await p.waitForTimeout(250);
  const before = await p.evaluate(() => ({n:S.team.people.length, shifts:Object.keys(S.team.shifts).length}));
  await L.apply(p);
  const a = await p.evaluate(() => ({out:view.daten.out, ppl:S.team.people.map(x => [x.name, x.area, x.target, x.active, !!x.demo, x.color].join(':')), demo:S.team.demo, shifts:Object.keys(S.team.shifts).length, colors:new Set(S.team.people.map(x => x.color)).size}));
  L.ok(a.out.neu === 6 && a.ppl.length === 6 && a.ppl[1].startsWith('Jakob:kueche:38.5:true:false') && a.ppl[5].startsWith('Lena:service:15:true:false') && !a.demo && a.shifts === 0 && a.colors === 6, 'sechs Personen im Dienstplan, Beispiel-Team samt Diensten entfernt, jede Person eine eigene Farbe', a);
  await L.go(p, 'team/dienstplan');
  L.ok(await p.evaluate(() => ['Maria', 'Jakob', 'Sophie', 'Elias', 'Tereza', 'Lena'].every(n => document.querySelector('#app').innerText.includes(n)) && !/Beispiel-Team/.test(document.querySelector('#app').innerText)) && p.errs.length === 0, 'Dienstplan zeigt die neuen Namen, kein Hinweis auf das Beispiel-Team');
  await L.go(p, 'einstellungen/eigene-daten'); L.ok(/6 Personen im Dienstplan\. Letzter Import .* team\.csv/.test(await p.evaluate(() => datenSteps()[4].state)) && await p.evaluate(() => datenSteps()[4].done), 'Schritt 5 ist erledigt und nennt den Import');
  await p.click('#app [data-act="datenUndo"]'); await p.waitForTimeout(700);
  L.ok(await p.evaluate(v => S.team.people.length === v.n && S.team.demo === true && Object.keys(S.team.shifts).length === v.shifts, before), 'Rückgängig: Beispiel-Team mit allen Diensten wieder da');
  // ergänzen: vorhandene Person aktualisieren, eingefügter Text ohne Überschrift
  await L.openImp(p, 'team'); await p.fill('#impPaste', 'Anna\tService\t32\nBirgit\tBar\t'); await p.click('#app [data-act="impCheck"]'); await p.waitForTimeout(300);
  const d2 = await p.evaluate(() => ({noHead:view.daten.noHead, items:view.daten.res.items.map(i => [i.st, i.title, i.why || ''].join(':'))}));
  L.ok(d2.noHead && d2.items[0] === 'akt:Anna:Bereich Service · Stunden 40 → 32' && d2.items[1] === 'neu:Birgit:', 'ohne Überschriften: Spalten der Reihe nach; Anna wird aktualisiert, Birgit ist neu', d2);
  await L.apply(p);
  L.ok(await p.evaluate(() => { const a = S.team.people.find(x => x.name === 'Anna'), bi = S.team.people.find(x => x.name === 'Birgit'); return a.area === 'service' && a.target === 32 && a.demo === true && bi.area === 'bar' && bi.target === null && S.team.people.length === 7; }), 'ergänzt: Anna geändert (Dienste bleiben), Birgit ohne Stunden angelegt');
  await L.done(b, p.errs); })();
