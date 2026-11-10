// Zwei Rollen. Chef: alles. Team: ansehen, Checklisten und Prep-Liste abhaken, eigener Frei-Wunsch, Bestellungen vorbereiten.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:1440, height:900}});
  await L.go(p, 'einstellungen');
  const who = await p.evaluate(() => ({roles:Object.keys(ROLES).join(), users:[...document.querySelectorAll('#app .who-b')].map(x => x.textContent.replace(/\s+/g, ' ').trim()), txt:document.querySelector('#app').textContent}));
  L.ok(who.roles === 'chef,team' && who.users.length === 2 && /^Chef/.test(who.users[0]) && /^Team/.test(who.users[1]), 'zwei Rollen: Chef und Team', who.users);
  L.ok(!/Freigabe|Inhaber|Küchenchef|Bar\b|Mitarbeiter/.test(who.txt) && await p.evaluate(() => !('orderLimit' in S.settings)), 'kein Freigabe-Limit, keine alten Rollennamen in den Einstellungen');
  // ---------- Chef ----------
  L.ok(await p.evaluate(() => canEditAll() && me().role === 'chef'), 'Chef darf alles ändern');
  await p.evaluate(() => { const sp = S.suppliers.find(s => s.active && !draftFor(s.id) && lowStock().some(x => x.supplier === s.id)); window.__sup = sp.id; const o = newOrder(sp.id); save(); view.stab = 'bestellung'; view.order = o.id; go('buy'); }); await p.waitForTimeout(300);
  const chefOrd = await p.evaluate(() => { const o = ORD(view.order); return {can:canSend(o), btn:!!document.querySelector('#app [data-act="ordMarkSent"]'), txt:document.querySelector('#app').textContent}; });
  L.ok(chefOrd.can && chefOrd.btn && !/Zur Freigabe|Freigeben|Limit/.test(chefOrd.txt), 'Chef sendet jede Bestellung, ohne Limit und Freigabe', chefOrd.can);
  await p.evaluate(() => { const o = ORD(view.order); S.orders = S.orders.filter(x => x !== o); view.order = null; save(); });
  // ---------- Team ----------
  await L.go(p, 'einstellungen'); await p.click('#app .who-b:nth-child(2)'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(() => me().role === 'team' && !canEditAll() && /Team/.test(document.querySelector('#whoami').textContent)), 'umgestellt auf Team');
  // ansehen: alle Seiten zeichnen
  for(const h of L.SCREENS) await L.go(p, h);
  // ändern ist gesperrt
  await L.go(p, 'speisekarte'); const pr = await p.evaluate(() => S.menu[0].price);
  const ro = await p.evaluate(() => ({price:document.querySelector('#app input[data-mp]').disabled, note:(document.querySelector('#app .ro-note') || {textContent:''}).textContent, grip:!!document.querySelector('#app .lt-grip')}));
  L.ok(ro.price && /Nur ansehen.*Chef/.test(ro.note) && !ro.grip, 'Speisekarte: Preisfelder gesperrt, Zeile „Nur ansehen“, kein Griff zum Verschieben', ro);
  await p.evaluate(() => { const x = document.querySelector('#app [data-act="newMenu"]'); x.disabled = false; x.click(); }); await p.waitForTimeout(250);
  L.ok(await p.evaluate(() => !document.querySelector('#dlg').open) && /nur der Chef/.test(await L.toast(p)), '„+ Gericht“: gesperrt, mit Hinweis', await L.toast(p));
  await p.evaluate(() => menuReorder(S.menu[0].id, null)); L.ok(await p.evaluate(v => S.menu[0].price === v, pr), 'Preis unverändert');
  await L.go(p, 'ware/bestand'); await p.evaluate(() => { const x = document.querySelector('#app [data-act="moveDlg"]'); x.disabled = false; x.click(); }); await p.waitForTimeout(250);
  L.ok(await p.evaluate(() => !document.querySelector('#dlg').open), 'Lager buchen (Schwund, Wareneingang): für das Team gesperrt');
  await L.go(p, 'ware/inventur'); await p.evaluate(() => { const x = document.querySelector('#app [data-act="invStart"]'); if(x){ x.disabled = false; x.click(); } }); await p.waitForTimeout(250); L.ok(await p.evaluate(() => !S.invDraft), 'Inventur starten: gesperrt');
  await L.go(p, 'ware/preise'); L.ok(await p.evaluate(() => document.querySelector('#app input[data-pp]').disabled), 'Preise: gesperrt');
  await L.go(p, 'einstellungen'); L.ok(await p.evaluate(() => document.querySelector('#s-target').disabled && !document.querySelector('#app [data-act="demoEmpty"]')), 'Einstellungen: Zielwert gesperrt, „Leer starten“ nicht angeboten');
  // erlaubt: Checkliste abhaken
  await L.go(p, 'checklisten'); await p.click('#app .ck-l'); await p.waitForTimeout(250); const ck0 = await p.evaluate(() => JSON.stringify(S.checks.runs).length);
  await p.click('#app .ck-c:not(.val)'); await p.waitForTimeout(250);
  L.ok(await p.evaluate(v => JSON.stringify(S.checks.runs).length > v && !!document.querySelector('#app .ck-c.on, #app .ck-i.on'), ck0), 'Team hakt eine Checkliste ab');
  // erlaubt: Prep-Liste abhaken, aber Prognose nicht ändern
  await p.evaluate(() => { let off = 0; while(off < 6 && vbForecast(dAdd(todayStr(), off)).closed) off++; view.pl.off = off; go('vorb'); }); await p.waitForTimeout(300);
  await p.click('#plPrep .pl-c'); await p.waitForTimeout(200);
  L.ok(await p.evaluate(() => !!document.querySelector('#plPrep .pl-c.on') && Object.keys(S.plan.chk).length === 1 && document.querySelector('#app input[data-plov]').disabled), 'Team hakt die Prep-Liste ab; die Prognose bleibt gesperrt');
  // erlaubt: Bestellung vorbereiten, aber nicht senden
  await p.evaluate(() => { const o = newOrder(__sup); save(); view.stab = 'bestellung'; view.order = o.id; go('buy'); }); await p.waitForTimeout(300);
  const ord = await p.evaluate(() => { const o = ORD(view.order); return {draft:o && o.status === 'draft', lines:o ? o.lines.length : 0, qty:!!document.querySelector('#app input[data-ol]') && !document.querySelector('#app input[data-ol]').disabled, send:!!document.querySelector('#app [data-act="ordMarkSent"], #app [data-act="ordCloudSend"]'), txt:document.querySelector('#app').textContent}; });
  L.ok(ord.draft && ord.qty && !ord.send && /Das Team bereitet Bestellungen vor\. Senden kann sie der Chef\./.test(ord.txt), 'Team legt einen Entwurf an und ändert Mengen; senden kann nur der Chef', {draft:ord.draft, qty:ord.qty, send:ord.send});
  if(ord.lines){ await p.fill('#app input[data-ol]', '7'); await p.keyboard.press('Tab'); await p.waitForTimeout(200); L.ok(await p.evaluate(() => +ORD(view.order).lines[0].n === 7), 'Menge im Entwurf geändert'); }
  // erlaubt: eigener Frei-Wunsch
  await L.go(p, 'team/dienstplan');
  const wish = await p.evaluate(() => { const me0 = tmS().people.find(x => x.active); me0.user = me().id; save(); render(); const D = dAdd(tmMonday(todayStr()), 8); tmWishDlg(me0.id, D); return {open:document.querySelector('#dlg').open, D, pid:me0.id, other:tmS().people.find(x => x.active && x.id !== me0.id).id}; }); await p.waitForTimeout(250);
  L.ok(wish.open, 'Frei-Wunsch für die eigene Zeile öffnet sich'); await p.click('#dlgForm button[type="submit"], #dlgForm .btn.primary'); await p.waitForTimeout(300);
  L.ok(await p.evaluate(w => { const a = tmAbsOf(w.pid, w.D); return !!a && a.t === 'wunsch'; }, wish), 'der eigene Frei-Wunsch ist eingetragen');
  await p.evaluate(w => tmWishDlg(w.other, w.D), wish); await p.waitForTimeout(250);
  L.ok(await p.evaluate(() => !document.querySelector('#dlg').open) && /nur Ihren eigenen/.test(await L.toast(p)), 'für andere geht das nicht', await L.toast(p));
  L.ok(await p.evaluate(() => !document.querySelector('#app [data-act="tmTeam"]') && /Den Plan ändert der Chef/.test(document.querySelector('#app').textContent)), 'Dienstplan: kein „Team verwalten“, ein Satz erklärt es');
  // zurück zum Chef
  await L.go(p, 'einstellungen'); await p.click('#app .who-b:nth-child(1)'); await p.waitForTimeout(300); await L.go(p, 'speisekarte');
  L.ok(await p.evaluate(() => canEditAll() && !document.querySelector('#app input[data-mp]').disabled && !document.querySelector('#app .ro-note') && !!document.querySelector('#app .lt-grip')), 'wieder Chef: alles frei');
  // Cloud-Konten mit alten Rollen
  L.ok(await p.evaluate(() => ['owner','chef','bar','staff','team','x'].map(roleNorm).join()) === 'chef,chef,team,team,team,team', 'Rollen aus der Cloud (Inhaber, Küchenchef, Bar, Mitarbeiter) werden Chef oder Team');
  await L.done(b, p.errs); })();
