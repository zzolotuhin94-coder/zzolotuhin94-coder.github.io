// Zwei Fenster: nur eines schreibt. Der Fall aus der Prüfung (Name in A, Zielwert in B → A verloren) ist nicht mehr möglich.
const L = require('./lib');
const run = async (b, label, init) => { const errs = [];
  const c = await L.ctx(b, {init}); const A = await L.page(c);
  await A.evaluate(() => { S.settings.name = 'Start'; S.settings.target = 28; save(); }); await L.idle(A);
  const B = await L.page(c); await B.waitForTimeout(300);
  const bar = p => p.evaluate(() => { const n = document.querySelector('#relBars .rel-bar.info'); return n ? n.innerText.replace(/\s+/g, ' ') : ''; });
  const role = p => p.evaluate(() => __store.status().role);
  L.ok(await role(A) === 'owner' && await role(B) === 'reader', label + 'erstes Fenster schreibt, zweites liest');
  L.ok(/^In einem anderen Fenster geöffnet\..*Hier weiterarbeiten$/.test(await bar(B)) && !(await bar(A)), label + 'zweites Fenster zeigt die Zeile mit „Hier weiterarbeiten“', await bar(B));
  L.ok(await B.evaluate(() => document.querySelector('.save-ind').textContent) === 'Nur ansehen', label + 'Anzeige im zweiten Fenster: „Nur ansehen“');
  // --- der Fall aus der Prüfung ---
  await A.evaluate(() => { S.settings.name = 'Name aus A'; save(); }); await L.idle(A); await B.waitForTimeout(500);
  L.ok(await B.evaluate(() => S.settings.name) === 'Name aus A', label + 'zweites Fenster zeigt die Änderung aus dem ersten von selbst');
  await B.evaluate(() => go('setup')); await B.waitForTimeout(200);
  await B.click('#s-target').catch(() => {}); await B.keyboard.type('35').catch(() => {}); await B.keyboard.press('Tab').catch(() => {}); await B.waitForTimeout(200);
  const viaUi = await B.evaluate(() => ({target:S.settings.target, val:document.querySelector('#s-target').value}));
  L.ok(viaUi.target === 28 && viaUi.val === '28', label + 'im Lesefenster lässt sich das Feld nicht ändern', viaUi);
  await B.evaluate(() => { S.settings.target = 35; save(); }); await B.waitForTimeout(400);     // selbst wenn Code im Lesefenster speichern will
  let pers = await A.evaluate(async () => { const d = await __store.read(); return [d.settings.name, d.settings.target]; });
  L.ok(pers.join() === 'Name aus A,28', label + 'Speichern aus dem Lesefenster wird nicht geschrieben: Name aus A bleibt', pers);
  await B.evaluate(() => { document.querySelector('[data-tab=menu]').click(); }); await B.waitForTimeout(200); L.ok(await B.evaluate(() => view.tab) === 'menu', label + 'ansehen und blättern geht im Lesefenster');
  // --- Übernahme ---
  await A.evaluate(() => { S.settings.name = 'A kurz vor Übernahme'; save(); });         // noch nicht geschrieben
  await B.click('#relBars [data-rel=takeover]'); await B.waitForTimeout(900);
  L.ok(await role(B) === 'owner' && await role(A) === 'reader' && !(await bar(B)) && /In einem anderen Fenster/.test(await bar(A)), label + '„Hier weiterarbeiten“: Rollen tauschen, Zeile wandert ins andere Fenster');
  L.ok(await B.evaluate(() => S.settings.name) === 'A kurz vor Übernahme', label + 'das übernehmende Fenster hat die letzte Änderung des anderen');
  await B.evaluate(() => go('setup')); await B.waitForTimeout(200); await B.fill('#s-target', '33'); await B.keyboard.press('Tab'); await B.waitForTimeout(200); await L.idle(B); await A.waitForTimeout(500);
  pers = await B.evaluate(async () => { const d = await __store.read(); return [d.settings.name, d.settings.target]; });
  L.ok(pers.join() === 'A kurz vor Übernahme,33' && await A.evaluate(() => S.settings.target) === 33, label + 'Zielwert in B geändert: beide Änderungen gespeichert, A zeigt sie an', pers);
  // --- veraltetes Fenster, das sich für das schreibende hält (eingefroren gewesen o. ä.) ---
  // A bekommt nichts mehr mit (wie ein eingefrorenes Fenster) und hält sich für das schreibende; inzwischen speichert B
  await A.evaluate(() => { __store.st.role = 'owner'; __store.st.confirmed = true; }); await B.evaluate(() => { S.settings.target = 34; save(); }); await L.idle(B); await B.evaluate(() => { S.settings.target = 33; save(); }); await L.idle(B);
  await A.evaluate(() => { S.settings.name = 'Veraltet'; save(); }); await A.waitForTimeout(700);
  pers = await B.evaluate(async () => { const d = await __store.read(); return [d.settings.name, d.settings.target]; });
  const aSt = await A.evaluate(async () => ({role:__store.status().role, name:S.settings.name, snaps:(await __store.snaps()).filter(x => x.kind === 'konflikt').length}));
  L.ok(pers.join() === 'A kurz vor Übernahme,33', label + 'ein veraltetes Fenster kann neuere Daten nicht überschreiben', pers);
  L.ok(aSt.role === 'reader' && aSt.snaps === 1, label + '… es wird zum Lesefenster; seine Änderung liegt bei den früheren Ständen', aSt);
  // harte Probe: Schreibversuch mit alter Versionsnummer direkt am Speicher vorbei an der Fensterlogik
  await B.evaluate(() => { S.settings.name = 'B neu'; save(); }); await L.idle(B);
  const forced = await A.evaluate(async () => { const s = __store.st; s.role = 'owner'; s.confirmed = true; s.rev = s.rev - 1; S.settings.name = 'Erzwungen'; save(); await new Promise(r => setTimeout(r, 600)); return [(await __store.read()).settings.name, __store.status().role]; });
  L.ok(forced.join() === 'B neu,reader', label + 'Versionszähler: Schreiben mit alter Nummer wird abgelehnt', forced);
  // --- schreibendes Fenster schließen → das andere übernimmt von selbst ---
  await B.evaluate(() => { S.settings.name = 'B letzter Stand'; save(); }); await B.close({runBeforeUnload:true}); await A.waitForTimeout(1200);
  L.ok(await role(A) === 'owner' && !(await bar(A)) && await A.evaluate(() => S.settings.name) === 'B letzter Stand', label + 'schreibendes Fenster geschlossen → das verbleibende übernimmt mit dem letzten Stand', [await role(A), await A.evaluate(() => S.settings.name)]);
  await A.evaluate(() => { S.settings.name = 'A wieder allein'; save(); }); await L.idle(A); L.ok(await A.evaluate(async () => (await __store.read()).settings.name) === 'A wieder allein', label + '… und kann wieder speichern');
  // --- umgekehrte Reihenfolge: B zuerst offen, dann A ---
  const B2 = await L.page(c); await B2.waitForTimeout(300); L.ok(await role(B2) === 'reader', label + 'neues Fenster neben dem laufenden liest');
  await A.close({runBeforeUnload:true}); await B2.waitForTimeout(1200); L.ok(await role(B2) === 'owner', label + 'und übernimmt, sobald das andere zu ist');
  errs.push(...A.errs.filter(e => !/conflict|Speicher/.test(e)), ...B.errs, ...B2.errs); await c.close(); return errs; };
(async () => { const b = await L.launch();
  const e1 = await run(b, '', null);
  const e2 = await run(b, '[ohne BroadcastChannel] ', () => { delete window.BroadcastChannel; window.BroadcastChannel = undefined; });
  // zwei Fenster gleichzeitig geöffnet: genau eines schreibt
  const c = await L.ctx(b); const [A, B] = await Promise.all([L.page(c), L.page(c)]); await A.waitForTimeout(1200);
  const roles = [await A.evaluate(() => __store.status().role), await B.evaluate(() => __store.status().role)].sort();
  L.ok(roles.join() === 'owner,reader', 'zwei Fenster im selben Moment geöffnet: genau eines schreibt', roles);
  await L.done(b, [...e1, ...e2, ...A.errs, ...B.errs]); })();
