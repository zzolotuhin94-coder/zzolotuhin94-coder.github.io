// Schritt 1: leer starten, Beispiele behalten, nur Beispielverkäufe / nur Beispiel-Team entfernen. Jeweils mit „Rückgängig“.
const L = require('./lib');
const sub = async p => { await p.click('#dlgForm button[type="submit"]'); await p.waitForTimeout(650); };
const demoNotes = p => p.evaluate(async () => { const out = []; for(const h of ['heute','speisekarte','rezepte','ware/bestand','ware/preise','ware/inventur','team/dienstplan','team/auswertung','einstellungen','einstellungen/eigene-daten','einrichtung']){ location.hash = '#' + h; await new Promise(r => setTimeout(r, 160)); const t = document.querySelector('#app').innerText; const m = t.match(/Beispiel[a-zäöü-]*[^\n]{0,40}/g) || []; m.filter(x => !/^Beispieldaten$|^Beispielen zu Ihrem Betrieb|Beispieldaten wiederherstellen|Zurück zu den Beispieldaten|Beispiele vom Anfang|Beispiel einfügen|zum Beispiel|von den Beispielen|Beispiele übernommen/.test(x)).forEach(x => out.push(h + ': ' + x)); } return out; });
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1440, height:900}});
  // ---------- Wege zur Seite ----------
  L.ok(await p.evaluate(() => S.demo === true && !document.querySelector('#demoSide').hidden), 'Start: Beispieldaten, Zeile „Beispieldaten · eigene Daten“ in der Seitenleiste');
  await p.click('#demoSide [data-act="goDemo"]'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => view.tab === 'daten' && location.hash === '#einstellungen/eigene-daten' && document.querySelectorAll('#app .ed-row').length === 6), 'die Zeile führt zur Seite „Eigene Daten“ mit sechs Schritten', await p.evaluate(() => location.hash));
  await L.go(p, 'einstellungen'); L.ok(await p.evaluate(() => !!document.querySelector('#setupEigene [data-act="datenOpen"]')), 'Einstellungen: eigener Abschnitt „Eigene Daten“');
  await p.click('#setupEigene [data-act="datenOpen"]'); await p.waitForTimeout(250); L.ok(await p.evaluate(() => view.tab === 'daten'), 'der Knopf öffnet die Seite');
  await L.go(p, 'einrichtung'); const alt = await p.evaluate(() => [...document.querySelectorAll('#app .au-row [data-act="datenOpen"]')].map(x => x.dataset.id + ':' + x.textContent));
  L.ok(alt.length === 3 && alt.some(x => /^rec:/.test(x)) && alt.some(x => /^prod:/.test(x)) && alt.some(x => /^menu:/.test(x)), 'Einrichtung: Preise, Rezepturen und Speisekarte führen auch zum Import', alt);
  await p.click('#app .au-row [data-act="datenOpen"][data-id="rec"]'); await p.waitForTimeout(250); L.ok(await p.evaluate(() => view.tab === 'daten' && view.daten && view.daten.imp === 'rec' && /Rezepturen importieren/.test(document.querySelector('#app h1').textContent)), 'von der Einrichtung direkt in den Rezeptur-Import');
  L.ok(await p.evaluate(() => location.hash === '#einstellungen/eigene-daten/rezepturen'), 'jeder Import hat seine eigene Adresse');
  await p.reload(); await L.ready(p); L.ok(await p.evaluate(() => view.tab === 'daten' && view.daten && view.daten.imp === 'rec' && view.daten.stage === 'in'), 'nach dem Neuladen steht man wieder im Rezeptur-Import (Eingabe)');
  await p.click('#app .back'); await p.waitForTimeout(250); L.ok(await p.evaluate(() => view.tab === 'daten' && !view.daten && location.hash === '#einstellungen/eigene-daten'), '„Eigene Daten“ oben führt zurück zur Übersicht');
  const st0 = await p.evaluate(() => datenSteps().map(s => ({k:s.k, done:s.done, state:s.state, act:s.act && s.act.l, links:(s.links || []).map(l => l[1])})));
  L.ok(st0[0].act === 'Leer starten' && st0[0].links.join('|') === 'Beispiele behalten|nur Beispielverkäufe entfernen|nur Beispiel-Team entfernen' && /86 Gerichte, 26 Rezepturen, 65 Artikel, 7 Lieferanten/ /* D1: Beispiel-Getränke */.test(st0[0].state), 'Schritt 1 zeigt den Stand aus den Daten und alle vier Wege', st0[0]);
  L.ok(/24 von 86 Gerichten haben eine Rezeptur/.test(st0[3].state) && /6 Personen.*Beispiel-Team/.test(st0[4].state) && /Noch kein Import aus Ihrer Kasse/.test(st0[5].state), 'Schritte 4 bis 6: Stand aus echten Daten', [st0[3].state, st0[4].state, st0[5].state]);
  L.ok(await p.evaluate(() => document.querySelectorAll('#app .btn.primary').length === 1 && document.querySelector('#app .btn.primary').dataset.act === 'leerAsk'), 'genau ein Hauptknopf auf der Seite: der nächste Schritt');
  const before = await p.evaluate(() => ({menu:S.menu.length, cards:S.cards.length, prods:S.products.length, sups:S.suppliers.length, sd:Object.keys(S.salesDays).length, people:S.team.people.length, runs:Object.keys(S.checks.runs).length, tpl:S.checks.templates.length, name:S.settings.name, vat:S.settings.vat, target:S.settings.target, seas:JSON.stringify(S.settings.seasons), copy:JSON.stringify(S.settings.menuCopy), secs:S.settings.sections.join('|')}));

  // ---------- nur Beispielverkäufe ----------
  await p.click('#app [data-act="leerSales"]'); await p.waitForTimeout(250);
  L.ok(/Tage mit Beispielverkäufen entfernen\? Echte Importe und Buchungen bleiben/.test(await p.evaluate(() => document.querySelector('#dlgForm').textContent)), 'nur Beispielverkäufe: Rückfrage nennt die Folgen');
  await sub(p);
  L.ok(await p.evaluate(v => !S.salesDemo && Object.keys(S.salesDays).length === 0 && S.demo === true && S.menu.length === v.menu && S.team.people.length === v.people, before) && /Beispielverkäufe entfernt/.test(await L.toast(p)), 'Beispielverkäufe sind weg, alles andere bleibt', await L.toast(p));
  L.ok(await p.evaluate(() => !datenSteps()[0].links.some(l => /Beispielverkäufe/.test(l[1])) && !!document.querySelector('#app [data-act="datenUndo"]')), 'der Weg wird nicht mehr angeboten; „Rückgängig machen“ steht auf der Seite');
  await p.click('#toast .toast-act'); await p.waitForTimeout(600);
  L.ok(await p.evaluate(v => S.salesDemo === true && Object.keys(S.salesDays).length === v.sd, before), 'Rückgängig: alle Beispielverkäufe wieder da', await p.evaluate(() => Object.keys(S.salesDays).length));
  // ---------- nur Beispiel-Team ----------
  await p.click('#app [data-act="leerTeam"]'); await p.waitForTimeout(250); await sub(p);
  L.ok(await p.evaluate(v => S.team.people.length === 0 && !S.team.demo && Object.keys(S.team.shifts).length === 0 && Object.keys(S.checks.runs).length === 0 && S.checks.templates.length === v.tpl && S.demo === true && S.menu.length === v.menu, before), 'Beispiel-Team entfernt: Personen, Dienste und Beispiel-Checklisten weg, Vorlagen bleiben');
  await p.click('#app [data-act="datenUndo"]'); await p.waitForTimeout(600);
  L.ok(await p.evaluate(v => S.team.people.length === v.people && S.team.demo === true && Object.keys(S.checks.runs).length === v.runs, before) && /Rückgängig gemacht/.test(await L.toast(p)), 'Rückgängig über die Zeile auf der Seite: Team wieder da');
  // ---------- Beispiele behalten ----------
  await p.click('#app [data-act="leerKeep"]'); await p.waitForTimeout(250);
  L.ok(/gehören ab jetzt zu Ihrem Betrieb.*Richtwerte/.test(await p.evaluate(() => document.querySelector('#dlgForm').textContent)), 'Beispiele behalten: Rückfrage sagt, was das heißt');
  await sub(p);
  L.ok(await p.evaluate(v => S.demo === false && S.menu.length === v.menu && S.cards.length === v.cards && S.products.length === v.prods && document.querySelector('#demoSide').hidden && S.settings.ownData.mode === 'keep', before), 'behalten: S.demo ist false, alle Daten bleiben, die Zeile in der Seitenleiste ist weg');
  const st1 = await p.evaluate(() => datenSteps()[0]);
  L.ok(st1.done && /Sie arbeiten mit eigenen Daten.*Beispiele übernommen.*Noch da:.*Beispielverkäufe.*Beispiel-Team/.test(st1.state) && !st1.act && st1.links.length === 2, 'Schritt 1 ist erledigt und nennt, was noch Beispiel ist', st1.state);
  await L.idle(p); await p.reload(); await L.ready(p);
  L.ok(await p.evaluate(() => S.demo === false && document.querySelector('#demoSide').hidden), 'nach dem Neuladen: weiterhin eigene Daten');
  await L.go(p, 'einstellungen/eigene-daten'); await p.click('#app [data-act="datenUndo"]'); await p.waitForTimeout(600);
  L.ok(await p.evaluate(() => S.demo === true && !document.querySelector('#demoSide').hidden), 'Rückgängig: wieder Beispieldaten');

  // ---------- Leer starten ----------
  await p.click('#app [data-act="leerAsk"]'); await p.waitForTimeout(250);
  const dlg = await p.evaluate(() => document.querySelector('#dlgForm').innerText);
  L.ok(/Das wird entfernt/.test(dlg) && /86 Gerichte und 26 Rezepturen/.test(dlg) && /65 Artikel mit Beständen/.test(dlg) && /7 Lieferanten und \d+ Bestellungen/.test(dlg) && /Verkäufe \(\d+ Tage\)/.test(dlg) && /Team \(6 Personen\)/.test(dlg) && /abgehakte Checklisten/.test(dlg), 'Leer starten: der Dialog zählt auf, was entfernt wird', dlg.slice(0, 80));
  L.ok(/Das bleibt/.test(dlg) && /Einstellungen/.test(dlg) && /Saisonen mit Texten/.test(dlg) && /Checklisten als Vorschlag/.test(dlg) && /Sicherheitskopie/.test(dlg) && /Rückgängig/.test(dlg), 'und was bleibt; Sicherheitskopie und Rückgängig sind genannt');
  await p.click('#dlgCancel'); await p.waitForTimeout(200); L.ok(await p.evaluate(v => S.menu.length === v.menu && S.demo, before), 'Abbrechen ändert nichts');
  await p.click('#app [data-act="leerAsk"]'); await p.waitForTimeout(250); await sub(p);
  const leer = await p.evaluate(() => ({demo:S.demo, menu:S.menu.length, cards:S.cards.length, prods:S.products.length, sups:S.suppliers.length, orders:S.orders.length, moves:S.moves.length, inv:S.inventories.length, sd:Object.keys(S.salesDays).length, salesDemo:S.salesDemo, people:S.team.people.length, tdemo:S.team.demo, shifts:Object.keys(S.team.shifts).length, runs:Object.keys(S.checks.runs).length, tpl:S.checks.templates.length, sug:S.checks.templates.every(t => t.sug === true), spec:S.specials.length, name:S.settings.name, vat:S.settings.vat, target:S.settings.target, seas:JSON.stringify(S.settings.seasons), copy:JSON.stringify(S.settings.menuCopy), secs:S.settings.sections.join('|'), side:document.querySelector('#demoSide').hidden, safety:!!STORE.st.safety, tab:view.tab}));
  L.ok(leer.demo === false && leer.menu + leer.cards + leer.prods + leer.sups + leer.orders + leer.moves + leer.inv + leer.sd + leer.people + leer.shifts + leer.runs + leer.spec === 0 && !leer.salesDemo && !leer.tdemo, 'leer: S.demo false; Gerichte, Rezepturen, Artikel, Lieferanten, Bestellungen, Buchungen, Verkäufe, Team, Checklisten-Läufe, Aktionen sind weg', leer);
  L.ok(leer.name === before.name && leer.vat === before.vat && leer.target === before.target && leer.seas === before.seas && leer.copy === before.copy && leer.secs === before.secs && leer.tpl === before.tpl && leer.sug, 'geblieben: Einstellungen, Saisonen mit Texten, Kategorien, Checklisten als „Vorschlag“');
  L.ok(leer.side && leer.safety && leer.tab === 'daten' && /Leerer Betrieb angelegt/.test(await L.toast(p)), 'Seitenleiste ohne Beispiel-Zeile, Sicherheitskopie angelegt, man bleibt auf „Eigene Daten“', await L.toast(p));
  await p.waitForTimeout(400); const notes = await demoNotes(p);
  L.ok(notes.length === 0, 'kein Hinweis auf Beispieldaten mehr, auf keiner Seite (außer dem Knopf „Beispieldaten wiederherstellen“ in den Einstellungen)', notes.slice(0, 6));
  L.ok(p.errs.length === 0, 'leerer Betrieb: alle Seiten ohne Fehler', p.errs.slice(0, 3));
  await L.go(p, 'checklisten'); L.ok(/Vorschlag, bitte anpassen/.test(await p.evaluate(() => { const b = [...document.querySelectorAll('#app button, #app summary, #app [data-act]')].find(x => /Listen|Vorlagen|bearbeiten/i.test(x.textContent)); return ckTplListHtml(); })), 'Checklisten-Vorlagen tragen „Vorschlag, bitte anpassen“');
  await L.idle(p); await p.reload(); await L.ready(p);
  L.ok(await p.evaluate(() => S.demo === false && S.menu.length === 0 && S.products.length === 0 && S.team.people.length === 0), 'nach dem Neuladen bleibt der Betrieb leer (keine Beispieldaten kommen zurück)');
  await L.go(p, 'einstellungen/eigene-daten');
  const st2 = await p.evaluate(() => datenSteps().map(s => s.state));
  L.ok(/Sie arbeiten mit eigenen Daten seit/.test(st2[0]) && /Noch kein Gericht/.test(st2[1]) && /Noch kein Artikel/.test(st2[2]) && /Noch niemand im Dienstplan/.test(st2[4]), 'die Schritte zeigen den leeren Stand', st2);
  L.ok(await p.evaluate(() => document.querySelector('#app .btn.primary').dataset.id === 'menu'), 'der nächste Schritt ist jetzt die Speisekarte');
  await p.click('#app [data-act="datenUndo"]'); await p.waitForTimeout(700);
  L.ok(await p.evaluate(v => S.demo === true && S.menu.length === v.menu && S.cards.length === v.cards && S.products.length === v.prods && S.suppliers.length === v.sups && Object.keys(S.salesDays).length === v.sd && S.team.people.length === v.people, before), 'Rückgängig nach „Leer starten“: alle Beispieldaten sind wieder da');
  L.ok(await p.evaluate(() => !STORE.st.safety && !document.querySelector('#app [data-act="datenUndo"]')), 'die Sicherheitskopie ist verbraucht, „Rückgängig“ wird nicht mehr angeboten');
  await L.done(b, p.errs); })();
