// Umstellung: Stände von vor dem Gestalter laden unverändert; der bisher gewählte Stil wird zur Vorlage. Einmalig, ohne Nebenwirkung auf andere Daten.
const L = require('./lib'); const fs = require('fs');
(async () => { const b = await L.launch(); const errs = [];
  const old = JSON.parse(fs.readFileSync(__dirname + '/../etests/samples/pre-d2-demo.json', 'utf8'));
  { const {p} = await L.open(b, {}); const ev = (f, a) => p.evaluate(f, a);
    L.ok(old.settings.karte === undefined && old.settings.guestStyle === 'haus', 'Beispielstand von 1.4.0: noch ohne Gestalter, Stil „Hauskarte“');
    const mg = await ev(o => { const before = JSON.parse(JSON.stringify(o)); const r = migrate(JSON.parse(JSON.stringify(o))); const again = migrate(JSON.parse(JSON.stringify(r)));
      const strip = s => { const x = JSON.parse(JSON.stringify(s)); delete x.karte; delete x.guestStyle; delete x.kidsSheet; delete x.d2V; return x; };
      return {karte:r.settings.karte, style:'guestStyle' in r.settings, kids:'kidsSheet' in r.settings, same:['products', 'menu', 'orders', 'moves', 'suppliers', 'specials', 'salesDays', 'inventories'].filter(k => JSON.stringify((k === 'products' ? r[k].map(x => { const y = {...x}; delete y.ean; return y; }) : r[k])) !== JSON.stringify(before[k])), ean:r.products.every(x => Array.isArray(x.ean)),
        settings:JSON.stringify(strip(r.settings)) === JSON.stringify(strip(before.settings)), copy:JSON.stringify(r.settings.menuCopy) === JSON.stringify(before.settings.menuCopy), seasons:JSON.stringify(r.settings.seasons) === JSON.stringify(before.settings.seasons), once:JSON.stringify(again) === JSON.stringify(r), schema:r.schema === before.schema}; }, old);
    L.ok(mg.karte && mg.karte.cur === 'haus' && JSON.stringify(mg.karte.docs) === '{}' && !mg.style, 'Stil „Hauskarte“ → Vorlage „Hauskarte“; der alte Schalter ist weg', mg.karte);
    L.ok(mg.same.length === 0 && mg.ean && mg.settings && mg.copy && mg.seasons, 'Artikel (nur um die leere Code-Liste ean ergänzt, Scanner), Gerichte, Bestellungen, Buchungen, Aktionen, Texte der Karte und Saisonen bleiben unverändert', mg.same);
    L.ok(mg.once && mg.schema, 'erneutes Laden ändert nichts mehr; das Datenformat bleibt dasselbe (ältere Sicherungen und Geräte passen weiter)');
    const map = await ev(o => { const f = (st, pick) => { const x = JSON.parse(JSON.stringify(o)); if(st === undefined) delete x.settings.guestStyle; else x.settings.guestStyle = st; if(pick) x.settings.guestStylePick = true; return migrate(x).settings.karte.cur; }; return {haus:f('haus'), schlicht:f('schlicht'), none:f(undefined), webPick:f('web', true), bookPick:f('book', true), web:f('web'), junk:f('<x>')}; }, old);
    L.ok(map.haus === 'haus' && map.schlicht === 'schlicht' && map.none === 'haus' && map.webPick === 'schlicht' && map.bookPick === 'schlicht' && map.web === 'haus' && map.junk === 'haus', 'jede frühere Wahl findet ihre Vorlage: Schlicht (auch die noch älteren, bewusst gewählten Stile) → Schlicht, alles andere → Hauskarte', map);
    // beschädigter oder fremder Gestalter-Stand wird repariert, nicht übernommen
    const rep = await ev(o => { const f = k => { const x = JSON.parse(JSON.stringify(o)); x.settings.karte = k; const r = migrate(x).settings.karte; return r; };
      const a = f('kaputt'), b2 = f({v:1, cur:'gibtsnicht', docs:{alpin:{blocks:'x'}, fremd:{blocks:[]}, haus:{blocks:[null, {t:'dish'}, {id:'"><img src=x onerror=1>', t:'text', txt:'ok'}, {id:'b_ok', t:'legend'}]}}});
      return {a, cur:b2.cur, keys:Object.keys(b2.docs).join(), ids:b2.docs.haus.blocks.map(x => x.id), hide:Array.isArray(b2.docs.haus.hide)}; }, old);
    L.ok(rep.a.cur === 'haus' && rep.cur === 'haus' && rep.keys === 'haus' && rep.ids.length === 3 && rep.ids.every(i => /^[\w-]+$/.test(i)) && rep.hide, 'beschädigter Gestalter-Stand: Unbrauchbares fliegt hinaus, Kennungen werden gesäubert', rep);
    errs.push(...p.errs); await p.context().close(); }
  // ---------- echter Start mit altem Stand im Speicher: einmal „Schlicht“, einmal „Hauskarte“ ----------
  for(const st of ['schlicht', 'haus']){
    const o = JSON.parse(JSON.stringify(old)); o.settings.guestStyle = st; o.settings.menuCopy = {sec:{'Rösti':'Eigener Satz zur Rösti'}, claim:'Eigener Leitspruch'}; o.settings.seasons.herbst.title = 'Herbst bei uns';
    const {p} = await L.open(b, {vp:{width:1024, height:768}, init:`(s => { try { if(!sessionStorage.getItem('g6')){ sessionStorage.setItem('g6', '1'); localStorage.setItem('dahuam202_kueche_de_v1', s); } } catch(e){} })(${JSON.stringify(JSON.stringify(o))})`});
    if(!p){ L.ok(false, 'Kontext mit altem Stand'); continue; }
    const ev = (f, a) => p.evaluate(f, a);
    L.ok(await ev(() => S.settings.seasons.herbst.title) === 'Herbst bei uns', `alter Stand (${st}) ist geladen`);
    await L.gk(p); const sh = await L.sheets(p); const txt = sh.map(s => s.units.map(u => u.txt).join(' ')).join(' ');
    L.ok(await ev(() => gsState().cur) === st && new RegExp(st === 'haus' ? 'gs-bg-schiefer' : 'gs-bg-weiss').test(sh[0].cls), `Gästekarte öffnet in der Vorlage „${st === 'haus' ? 'Hauskarte' : 'Schlicht'}“`, sh[0].cls);
    L.ok(/Herbst bei uns/i.test(txt) && /Eigener Satz zur Rösti/.test(txt) && (st === 'schlicht' || /Eigener Leitspruch/.test(txt)), 'eigene Texte von früher (Titel, Kapitelzeile, Leitspruch) stehen in der Karte');
    L.ok(sh.length >= 4 && /Elsässer/.test(txt) && /Kaiserschmarrn/.test(txt), `${sh.length} Blätter aus der Speisekarte des alten Stands`);
    await L.idle(p); await p.reload(); await L.ready(p); await L.gk(p);
    L.ok(await ev(() => gsState().cur) === st && await ev(() => !('guestStyle' in S.settings)), 'nach dem Neuladen bleibt es dabei');
    errs.push(...p.errs); await p.context().close(); }
  await L.done(b, errs);
})();
