// Erinnerung an die Sicherung: eine ruhige Zeile, nur bei echten Daten und wenn die letzte Datei älter als 7 Tage ist.
const L = require('./lib'); const fs = require('fs');
(async () => { const b = await L.launch(); const errs = []; const c = await L.ctx(b); const p = await L.page(c);
  const line = async () => { await p.evaluate(() => go('dash')); await p.waitForTimeout(150); const d = await p.evaluate(() => { const n = document.querySelector('#app .rel-remind'); return n ? n.innerText.replace(/\s+/g, ' ') : ''; }); await p.evaluate(() => go('setup')); await p.waitForTimeout(150); const s = await p.evaluate(() => { const n = document.querySelector('#relPanel .rel-remind'); return n ? n.innerText.replace(/\s+/g, ' ') : ''; }); return {d, s}; };
  let l = await line(); L.ok(!l.d && !l.s, 'Demodaten: keine Erinnerung', l);
  await p.evaluate(() => { S.settings.name = 'Nur der Name'; save(); }); l = await line(); L.ok(!l.d, 'nur den Namen geändert, sonst Demostand: noch keine Erinnerung');
  await p.evaluate(() => { const pr = S.products.find(x => x.priceDemo); markPrice(pr, 'manuell'); pr.price = 12.34; save(); }); l = await line();
  L.ok(l.d === 'Es gibt noch keine Sicherung als Datei. Sicherung speichern' && /noch keine Sicherung/.test(l.s), 'erster eigener Preis → eine Zeile auf Heute und in den Einstellungen', l);
  L.ok(await p.evaluate(() => !document.querySelector('#dlg').open && !document.querySelector('#toast.show')), 'kein Fenster, kein Hinweis, der sich aufdrängt');
  await p.evaluate(() => go('dash')); await p.waitForTimeout(150);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#app .rel-remind [data-rel=backup]')]); const bk = JSON.parse(fs.readFileSync(await dl.path(), 'utf8')); await p.waitForTimeout(300);
  L.ok(/^dahuam202-kueche-\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()) && bk.products.some(x => x.price === 12.34) && bk.schema === 2 && /^1\.\d+\.\d+ · [0-9a-f]{10}$/.test(bk.app) && !!bk.exportedAt, 'ein Klick speichert die Sicherung; sie trägt Datenformat und App-Version', [dl.suggestedFilename(), bk.schema, bk.app]);
  l = await line(); L.ok(!l.d && !l.s, 'danach ist die Zeile weg', l);
  L.ok(await p.evaluate(() => Date.now() - new Date(localStorage.getItem(KEY + '_lastBackup')).getTime() < 60000) && /^\d\d\.\d\d\.\d{4}$/.test(await p.textContent('#relLastBk')), 'Zeitpunkt der letzten Sicherung ist vermerkt und steht in den Einstellungen');
  await p.evaluate(() => localStorage.setItem(KEY + '_lastBackup', new Date(Date.now() - 6.5*864e5).toISOString())); l = await line(); L.ok(!l.d, '6 Tage alt: noch nichts');
  await p.evaluate(() => localStorage.setItem(KEY + '_lastBackup', new Date(Date.now() - 8.2*864e5).toISOString())); l = await line();
  L.ok(/^Die letzte Sicherung als Datei ist 8 Tage alt\. Sicherung speichern$/.test(l.d) && /8 Tage alt/.test(l.s), '8 Tage alt: Zeile mit dem Alter', l);
  // der bisherige Weg „Sicherung erstellen“ zählt genauso
  await p.evaluate(() => go('setup')); await p.click('[data-act=export]'); await p.waitForTimeout(200); const [dl2] = await Promise.all([p.waitForEvent('download'), p.click('#dlBtn')]); await p.waitForTimeout(300); await p.evaluate(() => document.querySelector('#dlg').close());
  const bk2 = JSON.parse(fs.readFileSync(await dl2.path(), 'utf8')); l = await line();
  L.ok(!l.d && bk2.schema === 2 && !!bk2.app, '„Sicherung erstellen“ setzt die Erinnerung ebenfalls zurück; Datei trägt Version und Datenformat');
  // andere Dateien (PDF, CSV) zählen nicht
  await p.evaluate(() => { localStorage.removeItem(KEY + '_lastBackup'); return saveFile('irgendwas.csv', new Blob(['a'])); }); l = await line(); L.ok(!!l.d, 'andere Dateien gelten nicht als Sicherung');
  // Sicherung wieder laden: Version und Zeitstempel landen nicht in den Daten
  fs.writeFileSync(__dirname + '/tmp_bk.json', JSON.stringify(bk2)); await p.evaluate(() => go('setup')); await p.setInputFiles('#importFile', __dirname + '/tmp_bk.json'); await p.waitForTimeout(300); await p.click('#dlgForm button[type=submit]'); await p.waitForTimeout(500);
  L.ok(await p.evaluate(() => S.schema === 2 && !('app' in S) && !('exportedAt' in S) && S.products.some(x => x.price === 12.34)), 'Sicherung lässt sich wieder laden');
  fs.unlinkSync(__dirname + '/tmp_bk.json'); errs.push(...p.errs); await L.done(b, errs); })();
