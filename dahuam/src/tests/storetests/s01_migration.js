// Umzug localStorage → IndexedDB: Demostand, alter Stand ohne Team/Plan/Aufgaben, 3 Jahre Betrieb. Nichts geht verloren.
const L = require('./lib'); const synth = require('../review-technik/synth'); const fs = require('fs');
const OLD = fs.readFileSync(__dirname + '/../index.before-a.html', 'utf8');
(async () => { const b = await L.launch(); const errs = [];
  // alte App (Stand vor Paket A) unter derselben Adresse ausliefern, damit sie echten alten Speicher erzeugt
  const oldApp = async (c) => { const p = await c.newPage(); await p.route('**/dahuam/alt.html*', r => r.fulfill({contentType:'text/html; charset=utf-8', body:OLD})); await p.goto(L.BASE + 'alt.html?nointro'); await p.waitForTimeout(700); return p; };
  // Paket B stellt beim Laden bewusst um: zwei Rollen, zwei Gästekarten-Stile, keine Aufgaben/Stempel, Kennzeichen „Grundzutat“. Diese Felder bleiben beim Vergleich außen vor (btests/b01 prüft sie einzeln).
  const cmp = (p, raw) => p.evaluate(async raw => { const old0 = JSON.parse(raw); await __store.idle(); const pers0 = await __store.read(); const diff = [];
    const B = d => { d = JSON.parse(JSON.stringify(d)); const s = d.settings || {}; for(const k of ['users','currentUser','orderLimit','guestStyle','guestStylePick','vatDrinks','secVat','algV']) delete s[k]; /* Paket C: zweiter Steuersatz, Steuerklassen, Allergen-Umstellung */ Object.values(s.seasons || {}).forEach(x => { for(const k of ['layout','fd','fb','orn']) delete x[k]; });
      (d.products || []).forEach(x => { delete x.basic; delete x.algNone; }); (d.menu || []).forEach(m => { delete m.algNone; delete m.vat; }); (d.orders || []).forEach(o => { if(o.status === 'approval') o.status = 'draft'; for(const k of ['createdBy','sentBy','approvalBy','approvedBy','approved']) delete o[k]; if(o.receipt) delete o.receipt.by; });
      delete d.game; ((d.team && d.team.people) || []).forEach(x => { delete x.user; });
      /* Paket D2: Service-Felder an den Rezepturen, Eigenkontrolle (mit ihren Beispiel-Häkchen im Reinigungsplan) kommen einmalig dazu; etests/e06 prüft sie einzeln */ delete s.d2V; (d.cards || []).forEach(c => { delete c.svHide; delete c.svNote; }); if(d.checks){ delete d.checks.ek; Object.values(d.checks.runs || {}).forEach(r => { delete r.ek_clean; }); Object.keys(d.checks.runs || {}).forEach(D => { if(!Object.keys(d.checks.runs[D]).length) delete d.checks.runs[D]; }); }
      return d; };
    const old = B(old0), pers = B(pers0); if(JSON.stringify(Object.keys(pers0.game || {}).sort()) !== '["done","init"]') diff.push('game');
    for(const k of Object.keys(old)) if(JSON.stringify(old[k]) !== JSON.stringify(pers[k])) diff.push(k);
    return {diff, extra:Object.keys(pers0).filter(k => !(k in old0)), same:JSON.stringify(pers0) === JSON.stringify(S), marker:localStorage.getItem(KEY), st:__store.status(), units:__store.st.pers.size, snaps:(await __store.snaps()).map(x => x.kind + ':' + x.size)}; }, raw);

  { // 1 Demostand, von der alten App gespeichert
    const c = await L.ctx(b); const o = await oldApp(c); const raw = await o.evaluate(() => { S.settings.name = 'Alt gespeichert'; save(); return localStorage.getItem(KEY); }); await o.close();
    const p = await L.page(c); const r = await cmp(p, raw);
    L.ok(r.diff.length === 0, 'Demostand: jeder alte Schlüssel ist unverändert angekommen (bis auf die Umstellungen aus Paket B)', r.diff); L.ok(r.extra.sort().join() === 'imports,schema', 'neu sind nur das Datenformat und die Liste der Importe (Paket C)', r.extra);
    L.ok(r.same && r.st.mode === 'idb' && r.st.rev === 1 && !r.st.dirty, 'liegt in IndexedDB, Speicher und Bildschirm sind gleich', r.st);
    L.ok(/"_store":"idb"/.test(r.marker) && r.marker.length < 200, 'alter Schlüssel ist nur noch ein kleiner Marker', r.marker);
    L.ok(r.snaps.length === 1 && r.snaps[0] === 'umzug:' + raw.length, 'alter Stand liegt zusätzlich als „vor der Umstellung“ bei den früheren Ständen', r.snaps);
    await p.reload(); await L.ready(p); L.ok(await p.evaluate(() => S.settings.name === 'Alt gespeichert' && __store.status().rev === 1), 'nach Neuladen: Daten da, kein zweiter Umzug');
    // localStorage geleert, IndexedDB noch da: ein echter Nutzer behält seine Daten
    await p.evaluate(() => localStorage.clear()); await p.reload(); await L.ready(p);
    L.ok(await p.evaluate(() => S.settings.name === 'Alt gespeichert' && !document.querySelector('.rel-rec')), 'localStorage gelöscht, IndexedDB vorhanden → Daten bleiben');
    // alte App-Version schreibt später noch einmal in den alten Schlüssel: wird nicht übernommen, aber aufgehoben
    await p.evaluate(() => { const d = JSON.parse(JSON.stringify(S)); d.settings.name = 'Von alter Version'; localStorage.setItem(KEY, JSON.stringify(d)); }); await p.reload(); await L.ready(p); await L.idle(p);
    const s2 = await p.evaluate(async () => ({name:S.settings.name, kinds:(await __store.snaps()).map(x => x.kind), marker:localStorage.getItem(KEY).length}));
    L.ok(s2.name === 'Alt gespeichert' && s2.kinds.includes('alt') && s2.marker < 200, 'später Schreibversuch einer alten Version: Hauptdaten bleiben, der fremde Stand liegt bei den früheren Ständen', s2);
    errs.push(...p.errs); await c.close(); }

  { // 2 alter Stand aus der Zeit vor Team, Checklisten, Vorbereitung, Aufgaben
    const c = await L.ctx(b); const o = await oldApp(c);
    const raw = await o.evaluate(() => { const d = JSON.parse(JSON.stringify(S)); for(const k of ['team', 'checks', 'plan', 'game', 'saleGroups', 'salesReal']) delete d[k]; d.products.forEach(p => { delete p.priceDemo; }); delete d.settings.seasons; delete d.settings.users; d.menu[0].name = 'Altes Gericht'; const s = JSON.stringify(d); localStorage.setItem(KEY, s); return s; }); await o.close();
    const p = await L.page(c);
    const r = await p.evaluate(async raw => { const old = JSON.parse(raw); await __store.idle(); const pers = await __store.read(); const eq = k => JSON.stringify(old[k]) === JSON.stringify(pers[k]); const noBy = a => JSON.stringify(a.map(o => { const y = {...o}; delete y.createdBy; delete y.sentBy; if(y.receipt){ y.receipt = {...y.receipt}; delete y.receipt.by; } return y; }));
      const strip = a => a.map(x => { const y = {...x}; delete y.priceDemo; return y; });
      return {menu:JSON.stringify(old.menu.map(m => [m.id, m.name, m.price, m.card])) === JSON.stringify(pers.menu.map(m => [m.id, m.name, m.price, m.card])), cards:JSON.stringify(old.cards.map(c => [c.id, c.name, c.items])) === JSON.stringify(pers.cards.map(c => [c.id, c.name, c.items])),
        prods:JSON.stringify(old.products.map(p => [p.id, p.name, p.price, p.stock])) === JSON.stringify(pers.products.map(p => [p.id, p.name, p.price, p.stock])), moves:eq('moves'), orders:noBy(old.orders) === noBy(pers.orders), suppliers:eq('suppliers'), sales:eq('salesDays'),
        neu:!!(pers.team && pers.checks && pers.plan && pers.game && pers.settings.seasons && pers.settings.users) && pers.schema === 2, name:S.menu[0].name, rev:__store.status().rev}; }, raw);
    L.ok(r.menu && r.cards && r.prods && r.moves && r.orders && r.suppliers && r.sales, 'alter Stand: Karte, Rezepturen, Produkte, Buchungen, Bestellungen, Verkäufe unverändert', r);
    L.ok(r.neu && r.name === 'Altes Gericht' && r.rev === 1, 'fehlende Bereiche wurden ergänzt (Team, Checklisten, Vorbereitung, Einrichtung), Datenformat 2');
    for(const t of await p.evaluate(() => TABS.map(t => t[0]))){ await p.evaluate(t => go(t), t); await p.waitForTimeout(40); }
    L.ok(p.errs.length === 0, 'alle Bereiche lassen sich danach öffnen', p.errs);
    errs.push(...p.errs); await c.close(); }

  { // 3 drei Jahre Betrieb (synthetisch, ~4,7 MB) – so groß, wie der alte Speicher gerade noch fasst
    const c = await L.ctx(b); const o = await oldApp(c);
    const sz = await o.evaluate(`(${synth.toString()})(3)`); const raw = await o.evaluate(() => { const s = JSON.stringify(S); try { localStorage.setItem(KEY, s); return s; } catch(e){ return null; } });
    // Vergleichsmaßstab: genau das, was die alte App nach einem Neuladen aus diesem Speicher gemacht hätte (sie kürzt z. B. Dienste, die älter als die Aufbewahrungszeit sind)
    const ref = await o.evaluate(() => JSON.stringify(migrate(JSON.parse(localStorage.getItem(KEY)))));
    L.ok(!!raw, `alter Speicher fasst den 3-Jahres-Stand noch (${(sz.total/1e6).toFixed(2)} MB)`); await o.close();
    const p = await L.page(c); const t0 = Date.now(); const r = await cmp(p, ref); const dt = Date.now() - t0;
    L.ok(r.diff.length === 0 && r.same, '3 Jahre: jeder Schlüssel so, wie ihn die alte App geladen hätte; Speicher und Bildschirm gleich', r.diff);
    L.ok(r.st.rev === 1 && r.units > 100 && /"_store"/.test(r.marker), `in ${r.units} Teilen gespeichert, alter Schlüssel freigegeben (Umzug fertig nach ${dt} ms)`);
    const rt = await p.evaluate(() => { const u = __store.unitsOf(S); const back = __store.assemble(id => u.get(id)); let big = 0; for(const s of u.values()) big = Math.max(big, s.length); return {same:JSON.stringify(back) === JSON.stringify(S), keys:JSON.stringify(Object.keys(back.salesDays)) === JSON.stringify(Object.keys(S.salesDays)) && JSON.stringify(Object.keys(back.team)) === JSON.stringify(Object.keys(S.team)), n:u.size, big}; });
    L.ok(rt.same && rt.keys, `Zerlegen und Zusammensetzen ist verlustfrei, auch die Reihenfolge (größter Teil ${Math.round(rt.big/1024)} KB)`, rt);
    await p.evaluate(() => { S.moves.unshift({id:'mv_neu', date:new Date().toISOString(), type:'in', pid:S.products[0].id, qty:1, price:1, note:'neu'}); save(); }); await L.idle(p);
    await p.reload(); await L.ready(p);
    L.ok(await p.evaluate(() => S.moves[0].id === 'mv_neu' && S.moves.length > 7000 && Object.keys(S.salesDays).length > 900), 'Änderung im großen Stand überlebt Neuladen');
    errs.push(...p.errs); await c.close(); }
  await L.done(b, errs); })();
