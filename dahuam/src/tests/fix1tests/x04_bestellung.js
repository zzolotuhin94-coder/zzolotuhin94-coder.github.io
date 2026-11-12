// Befunde 4, 5, 9, 10 und die Bestell-Tabelle: Vorschlag ohne leeren Entwurf, „nichts nötig“, Rückfrage beim Senden, Namen statt Kennung, Beschriftungen, volle Tabellenbreite.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.DESK); const ev = async (f, a) => L.nb(await p.evaluate(f, a)); const w = ms => p.waitForTimeout(ms);
  // ---------- 4: Heute zeigt Lieferanten ohne Bedarf ruhig ----------
  await ev(() => go('dash')); await w(250);
  const row = await ev(() => { const r = [...document.querySelectorAll('#app .rw')].find(x => /Bäckerei Kornstube/.test(x.innerText)); return {t:r.innerText.replace(/\s+/g, ' '), past:r.classList.contains('past'), red:!!r.querySelector('.rw-meta .bad-t')}; });
  L.ok(/nichts nötig/.test(row.t) && row.past && !row.red && !/Vorbereiten/.test(row.t), 'Heute: Bäckerei ohne Bedarf grau „nichts nötig“, ohne roten Countdown und ohne „Vorbereiten“', row.t);
  const n0 = await ev(() => S.orders.length);
  await p.click('#app [data-act="ordNew"][data-id="sup_baeck"]'); await w(300);
  const pv = await ev(() => { const o = ORD(view.order); return {tmp:!!o.tmp, n:S.orders.length, lines:o.lines.length, txt:document.querySelector('#app .ol-empty').innerText, no:S.settings.orderNo}; });
  L.ok(pv.tmp && pv.n === n0 && pv.lines === 0 && /Nichts nötig/.test(pv.txt), 'öffnen legt keinen Entwurf an; die Tabelle sagt „Nichts nötig …“', pv);
  await p.click('#app [data-act="olSuggest"]'); await w(200);
  L.ok(/Bei Bäckerei Kornstube ist nichts nötig/.test(L.nb(await L.toast(p))) && await ev(() => S.orders.length) === n0, '„Vorschlag laden“: „… ist nichts nötig“, nicht „schon drin“; noch immer kein Entwurf');
  await L.shot(p, 'x04-baeckerei-nichts-noetig', {full:false});
  await p.click('#app [data-act="ordBack"]'); await w(200);
  L.ok(await ev(() => S.orders.length) === n0 && await ev(() => !draftFor('sup_baeck')), 'zurück: kein leerer Entwurf bleibt liegen, der Zähler „offen“ bleibt gleich');
  // erster Artikel → jetzt erst ein Entwurf mit der nächsten Nummer
  await ev(() => { view.order = null; go('dash'); }); await w(150); await p.click('#app [data-act="ordNew"][data-id="sup_baeck"]'); await w(250);
  await p.selectOption('#olAdd', 'bread'); await w(250);
  const d1 = await ev(() => { const o = ORD(view.order); return {inList:S.orders.includes(o), no:o.no, tmp:!!o.tmp}; });
  L.ok(d1.inList && !d1.tmp && d1.no === 'B-2026-0009', 'erster Artikel: Entwurf B-2026-0009 entsteht', d1);
  // Vorschlag beim Öffnen geladen (Großmarkt), mit Bedarf aus der Prognose
  const gm = await ev(() => { const o = ordStart('sup_gross'); const need = supNeed('sup_gross', o.deliveryDate); const r = {lines:o.lines.length, need:need.length, prog:need.filter(x => x.prog).map(x => x.p.name), low:lowStock().filter(x => x.supplier === 'sup_gross').length}; ORD_TMP = null; return r; });
  L.ok(gm.lines === gm.need && gm.lines >= gm.low && gm.lines > 0, 'Großmarkt: Vorschlag schon beim Öffnen geladen (Mindestbestand und Prognose bis zur nächsten Lieferung)', gm);
  L.ok(await ev(() => { const p0 = P('fries'); const s0 = p0.stock, m0 = p0.minStock; p0.stock = 0; p0.minStock = 0; S.orders.forEach(o => { if(o.status === 'sent' || o.status === 'confirmed') o.lines = o.lines.filter(l => l.pid !== 'fries'); }); const x = supNeed('sup_gross').find(y => y.p.id === 'fries'); p0.stock = s0; p0.minStock = m0; return !!x && x.prog; }), 'ohne Mindestbestand: Pommes kommen über den Prognose-Bedarf in den Vorschlag');
  // ---------- 5: Senden unter Mindestwert / kein Bestelltag ----------
  const oid = await ev(() => { const o = newOrder('sup_gem', false); o.lines.push(lineFor(P('potato'), 1)); save(); view.stab = 'bestellung'; view.order = o.id; go('stock'); return o.id; }); await w(250);
  await p.click('#app [data-act="ordMarkSent"]'); await w(250);
  const cf = await ev(id => ({open:document.querySelector('#dlg').open, t:document.querySelector('#dlgForm').innerText, st:ORD(id).status}), oid);
  L.ok(cf.open && cf.st === 'draft' && /Mindestbestellwert von Gemüsehof Hainzl ist € 80,00/.test(cf.t) && /Heute ist kein Bestelltag\. Gemüsehof Hainzl nimmt Bestellungen Mo Mi Fr an\./.test(cf.t), 'unter Mindestwert und kein Bestelltag: Rückfrage, nichts gesendet', cf.t.slice(0, 160));
  await p.click('#dlgCancel'); await w(150); L.ok(await ev(id => ORD(id).status === 'draft', oid), 'Abbrechen: bleibt Entwurf');
  await p.click('#app [data-act="ordMarkSent"]'); await w(200); await L.dlgOk(p); await w(250);
  L.ok(await ev(id => ORD(id).status === 'sent', oid), '„Trotzdem senden“: gesendet');
  // passt alles: keine Rückfrage
  const oid2 = await ev(() => { const o = newOrder('sup_getraenke', false); o.lines.push(lineFor(P('bier'), 5)); save(); view.order = o.id; render(); return o.id; }); await w(200);
  await p.click('#app [data-act="ordMarkSent"]'); await w(250);
  L.ok(await ev(id => ORD(id).status === 'sent' && !document.querySelector('#dlg').open, oid2), 'über Mindestwert am Bestelltag vor Annahmeschluss: ohne Rückfrage');
  // ---------- 9: Name statt Kennung ----------
  await ev(() => { const o = S.orders.find(x => x.no === 'B-2026-0004'); view.order = o.id; render(); }); await w(200);
  const st = await ev(() => document.querySelector('#app .ord-grid').innerText);
  L.ok(!/u_bar|u_staff|u_chef/.test(st) && /Geprüft von\s*Team/.test(st), '„Geprüft von Team“, keine interne Kennung', (st.match(/Geprüft von.*/) || [''])[0]);
  L.ok(await ev(() => userName('u_bar') === 'Team' && userName('u_owner') === 'Chef' && userName('u_weg') === 'unbekannt'), 'alte Kennungen werden zu Namen, Unbekannte heißen „unbekannt“');
  // ---------- Tabelle: volle Breite auf iPad und Desktop ----------
  for(const [vp, name] of [[{width:1024, height:768}, 'ipad'], [{width:1440, height:900}, 'desktop'], [{width:768, height:1024}, 'ipad-hoch']]){
    await p.setViewportSize(vp); await w(200);
    const cut = await ev(() => { const wr = document.querySelector('#app .ord-grid .tbl-wrap'); return {sw:wr.scrollWidth, cw:wr.clientWidth, page:document.documentElement.scrollWidth <= innerWidth + 1}; });
    L.ok(cut.sw <= cut.cw + 1 && cut.page, `Bestellung ${name}: Geliefert und Rechnungspreis ohne seitliches Wischen sichtbar`, cut);
    await L.shot(p, 'x04-bestellung-' + name, {full:false});
  }
  // ---------- 10: Lieferanten mit Beschriftung ----------
  await p.setViewportSize({width:1440, height:900}); await ev(() => { view.order = null; view.stab = 'lieferanten'; go('stock'); }); await w(250);
  const lb = await ev(() => { const kv = document.querySelector('#app .lo-grid .lo .kv'); const sp = [...kv.children]; return {labels:sp.filter((x, i) => i % 2 === 0).map(x => getComputedStyle(x).display !== 'none' ? x.textContent : '').join('|')}; });
  L.ok(/^Bestellen\|Lieferung\|Mindestwert\|Einkauf November$/.test(lb.labels), 'Lieferanten am Desktop: Bestellen · Lieferung · Mindestwert · Einkauf November beschriftet', lb.labels);
  await L.shot(p, 'x04-lieferanten-desktop', {full:false});
  await L.done(b, p.errs);
})();
