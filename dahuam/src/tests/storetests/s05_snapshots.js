// Frühere Stände: täglich, doppelte werden nicht angelegt, 7 Tage + 4 Wochen bleiben, Laden mit Rückfrage und Sicherheitskopie. Speicher-Auskunft.
const L = require('./lib');
(async () => { const b = await L.launch(); const errs = []; const c = await L.ctx(b); const p = await L.page(c);
  const DAY = 864e5;
  // „Tag n“: letzter Speicherzeitpunkt wird n Tage zurückgelegt, dann kommt die erste Änderung von heute
  const day = (n, name) => p.evaluate(async ([n, name, DAY]) => { __store.st.metaAt = Date.now() - n*DAY; S.settings.name = name; save(); await __store.idle(); }, [n, name, DAY]);
  await p.evaluate(() => { S.settings.name = 'Tag 0'; S.demo = false; save(); }); await L.idle(p);
  L.ok((await p.evaluate(() => __store.snaps())).length === 0, 'am selben Tag entsteht kein Stand');
  await p.evaluate(() => { S.settings.name = 'Tag 0b'; save(); }); await L.idle(p);
  L.ok((await p.evaluate(() => __store.snaps())).length === 0, '… auch nicht bei weiteren Änderungen am selben Tag');
  await day(1, 'Heute 1'); let s = await p.evaluate(() => __store.snaps());
  L.ok(s.length === 1 && s[0].kind === 'auto' && s[0].counts.menu > 50 && s[0].size > 100000, 'erste Änderung am neuen Tag hebt den Stand von gestern auf', s.map(x => [x.kind, x.counts, x.size]));
  L.ok(await p.evaluate(async id => (await __store.snapLoad(id)).settings.name, s[0].id) === 'Tag 0b', '… und zwar den letzten Stand von gestern, nicht den neuen');
  await p.evaluate(() => { S.settings.name = 'Heute 2'; save(); }); await L.idle(p); await p.reload(); await L.ready(p); await p.evaluate(() => { S.settings.name = 'Heute 3'; save(); }); await L.idle(p);
  L.ok((await p.evaluate(() => __store.snaps())).length === 1, 'kein doppelter Stand bei weiteren Änderungen und nach Neuladen');
  // 40 Arbeitstage rückwärts simulieren
  for(let n = 40; n >= 1; n--){ await p.evaluate(async ([n, DAY]) => { const at = Date.now() - n*DAY; const u = Object.fromEntries(__store.unitsOf({...S, settings:{...S.settings, name:'vor ' + n + ' Tagen'}})); await __store.snapPut('auto', '', {u}, 1000 + n, at); }, [n, DAY]); }
  s = await p.evaluate(() => __store.snaps()); const auto = s.filter(x => x.kind === 'auto'); const ages = auto.map(x => Math.round((Date.now() - x.at) / DAY));
  const weeks = new Set(auto.slice(7).map(x => { const d = new Date(x.at); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toDateString(); }));
  L.ok(auto.length === 11 && ages.slice(0, 7).every((a, i) => a <= i + 1), 'es bleiben 7 Tagesstände + 4 Wochenstände', ages);
  L.ok(weeks.size === 4 && ages[10] <= 40 && ages[7] > ages[6], 'die 4 älteren stammen aus 4 verschiedenen Wochen', ages.slice(7));
  // Einstellungen: Liste und Laden
  await p.evaluate(() => go('setup')); await p.waitForTimeout(500);
  const rows = await p.evaluate(() => [...document.querySelectorAll('#relPanel .rel-snaps li')].map(li => li.innerText.replace(/\s+/g, ' ')));
  L.ok(rows.length === 11 && /^\d\d\.\d\d\.\d{4}, \d\d:\d\d Uhr Tagesstand · \d+ Gerichte · \d+ Rezepturen · [\d,]+ (KB|MB) Laden$/.test(rows[0]), 'Einstellungen zeigen die Liste mit Datum, Inhalt und Größe', rows[0]);
  const cur = await p.evaluate(() => S.settings.name);
  await p.click('#relPanel .rel-snaps li:nth-child(3) [data-rel=snap]'); await p.waitForTimeout(250);
  const q = await p.evaluate(() => document.querySelector('#dlg').open && document.querySelector('#dlgForm').innerText);
  L.ok(q && /laden\? Der jetzige Stand wird ersetzt\. Vorher legt die App eine Sicherheitskopie an/.test(q), 'Laden fragt nach und nennt die Sicherheitskopie', q && q.slice(0, 160));
  await p.evaluate(() => document.querySelector('#dlg').close()); L.ok(await p.evaluate(() => S.settings.name) === cur, 'Abbrechen ändert nichts');
  await p.click('#relPanel .rel-snaps li:nth-child(3) [data-rel=snap]'); await p.waitForTimeout(200); await p.click('#dlgForm button[type=submit]'); await p.waitForTimeout(500); await L.idle(p);
  const after = await p.evaluate(async () => ({name:S.settings.name, pers:(await __store.read()).settings.name, saf:__store.st.safety, tab:view.tab}));
  L.ok(/^vor \d+ Tagen$/.test(after.name) && after.pers === after.name && after.tab === 'dash', 'gewählter Stand ist geladen und gespeichert', after.name);
  L.ok(after.saf && /Früheren Stand laden/.test(after.saf.why) && (await p.evaluate(async () => (await __store.safetyData()).settings.name)) === cur, 'der vorige Stand liegt als Sicherheitskopie in IndexedDB', after.saf);
  L.ok(await p.evaluate(() => localStorage.getItem(KEY + '_safety') === null), '… nicht mehr im localStorage');
  await p.evaluate(() => go('setup')); await p.waitForTimeout(300); await p.click('[data-act=safetyRestore]'); await p.waitForTimeout(200); await p.click('#dlgForm button[type=submit]'); await p.waitForTimeout(500); await L.idle(p);
  L.ok(await p.evaluate(() => S.settings.name) === cur, '„Letzte Daten wiederherstellen“ holt den Stand von vor dem Laden zurück');
  // Speicher-Auskunft
  await p.evaluate(() => go('setup')); await p.waitForTimeout(600);
  let kv = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#relPanel .rel-kv > span')].map(x => x.textContent).reduce((a, x, i, all) => i % 2 ? a : [...a, [x, all[i + 1]]], [])));
  L.ok(kv['Speicher'] === 'kann vom Browser gelöscht werden' && /^[\d,.]+ (KB|MB) von [\d,.]+ (MB|GB)$/.test(kv['Belegt']), 'Speicher: Auskunft in klaren Worten, belegt/verfügbar', kv);
  L.ok(/^1\.\d+\.\d+ · Stand [0-9a-f]{10} · Datenformat 2$/.test(kv['Version']) && kv['Gespeichert'] === 'in diesem Browser auf diesem Gerät', 'Version, Stand und Datenformat stehen in den Einstellungen', kv['Version']);
  L.ok(await p.locator('#relPanel [data-rel=persist]').count() === 1, 'Knopf „Dauerhaft speichern“, solange der Browser es nicht zugesagt hat');
  // (im Test-Browser lässt sich die Zusage nicht erzwingen; hier antwortet der Browser ersatzweise mit „ja“)
  await p.evaluate(() => { let ok = false; navigator.storage.persist = async () => (ok = true); navigator.storage.persisted = async () => ok; });
  await p.click('#relPanel [data-rel=persist]'); await p.waitForTimeout(600);
  kv = await p.evaluate(() => ({dur:document.querySelector('#relDur').textContent, btn:!!document.querySelector('#relPanel [data-rel=persist]'), toast:document.querySelector('#toast').textContent}));
  L.ok(kv.dur === 'dauerhaft' && !kv.btn, 'nach der Zusage des Browsers: „dauerhaft“, Knopf verschwindet', kv);
  errs.push(...p.errs); await L.done(b, errs); })();
