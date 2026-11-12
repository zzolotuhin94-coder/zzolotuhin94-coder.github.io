// Platz: keine Seite breiter als der Bildschirm; Tabellen passen oder werden Zeilen (Handy 390, iPad hoch 768, iPad quer 1024, Desktop 1440).
// Ware › Bestand am Handy mit großer Menge; Speisekarte, Dienstplan und Wareneingang auf dem iPad quer vollständig; Rezept ohne Foto mit kleinem Zeichen.
const L = require('./lib');
const SCREENS = L.SCREENS.concat(['speisekarte/service', 'rezepte/dish_kaiser', 'apartments']);
const RECV = () => { const o = S.orders.find(x => ['sent', 'confirmed'].includes(x.status)); view.stab = 'bestellung'; view.order = o.id; view.recv = o.id; go('buy'); };
const ORDER = () => { const o = S.orders.find(x => ['sent', 'confirmed'].includes(x.status)); view.stab = 'bestellung'; view.order = o.id; view.recv = null; go('buy'); };
// Bereiche, die absichtlich seitlich laufen: Zeitleiste der Aktionen, Regal der Rezepte, Reiter- und Filterleisten
const SIDEWAYS = '.seg,.chips-row,.pl-days,.rp-units,.tl-wrap,.shelf-row,.gs-ed,.gs-stage';
const inner = p => p.evaluate(sel => [...document.querySelectorAll('#app *')].filter(e => { const cs = getComputedStyle(e); return /auto|scroll/.test(cs.overflowX) && e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 2 && !e.matches(sel) && !e.closest(sel); }).map(e => String(e.className).slice(0, 30) + ' ' + e.scrollWidth + '/' + e.clientWidth), SIDEWAYS);
(async () => { const b = await L.launch(); const errs = [];
  for(const [name, o] of [['handy', L.PHONE], ['ipad-hoch', {vp:{width:768, height:1024}, ctx:{hasTouch:true}}], ['ipad-quer', L.TABLET], ['desktop', {vp:{width:1440, height:900}}]]){
    const {p} = await L.open(b, o); const bad = [], side = [];
    for(const h of SCREENS){ await L.go(p, h); await p.waitForTimeout(80); if(await L.wide(p) > 0) bad.push(h); const i = await inner(p); if(i.length) side.push(h + ': ' + i.join(', ')); }
    for(const [n, f] of [['wareneingang', RECV], ['bestellung', ORDER]]){ await p.evaluate(f); await p.waitForTimeout(150); if(await L.wide(p) > 0) bad.push(n); const i = await inner(p); if(i.length) side.push(n + ': ' + i.join(', ')); }
    L.ok(bad.length === 0, `${name}: keine Seite breiter als der Bildschirm`, bad);
    L.ok(side.length === 0, `${name}: keine Tabelle, die man seitlich wischen muss`, side);
    errs.push(...p.errs); await p.context().close(); }
  // ---------- Ware › Bestand am Handy ----------
  { const {p} = await L.open(b, L.PHONE); await L.go(p, 'ware/bestand');
    const r = await p.evaluate(() => { const tr = [...document.querySelectorAll('#app table.stock tr.row')].find(x => /Butter$/.test(x.querySelector('.pn').textContent)); const q = tr.children[2], m = tr.children[3], n = tr.children[0];
      const vis = e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right <= innerWidth && b.left >= 0; };
      return {q:q.textContent.trim(), qv:vis(q), qfs:parseFloat(getComputedStyle(q).fontSize), nfs:parseFloat(getComputedStyle(n.querySelector('.pn')).fontSize), m:getComputedStyle(m, '::before').content.replace(/"/g, '') + m.innerText.trim(), mv:vis(m), wert:getComputedStyle(tr.children[4]).display, btn:[...tr.children[5].querySelectorAll('.icon-btn')].every(vis), head:getComputedStyle(document.querySelector('#app table.stock thead')).display}; });
    L.ok(r.q === '6 kg' && r.qv && r.qfs > r.nfs && r.m === 'Mindest 5 kg' && r.mv && r.btn && r.wert === 'none' && r.head === 'none', 'Handy: je Artikel eine Karte, die Menge groß rechts, „Mindest“ darunter, + und − sichtbar; Wert nur in der Summe', r);
    await L.shot(p, 'nachher-stock_phone'); errs.push(...p.errs); await p.context().close(); }
  // ---------- iPad quer: Speisekarte, Dienstplan, Wareneingang ----------
  { const {p} = await L.open(b, L.TABLET); const ev = (f, a) => p.evaluate(f, a);
    const rail = await ev(() => ({w:Math.round(document.querySelector('.side').getBoundingClientRect().width), label:getComputedStyle(document.querySelector('.side .nav-i span')).position, name:document.querySelector('.side .nav-i[data-tab="vorb"]').textContent.trim()}));
    L.ok(rail.w <= 80 && rail.label === 'absolute' && rail.name === 'Vorbereitung', 'iPad quer: die Seitenleiste ist eine schmale Leiste mit Zeichen (die Namen bleiben für Vorlesen)', rail);
    await L.go(p, 'speisekarte');
    const mc = await ev(() => { const w = document.querySelector('#app .lt-wrap'); const R = w.getBoundingClientRect().right; return {fit:w.scrollWidth <= w.clientWidth + 1, heads:[...w.querySelectorAll('thead th')].filter(t => t.getBoundingClientRect().width > 0).map(t => t.textContent.trim()), cut:[...w.querySelectorAll('tbody tr.row td')].filter(td => td.getBoundingClientRect().width > 0 && td.getBoundingClientRect().right > R + 1).length}; });
    L.ok(mc.fit && mc.cut === 0 && mc.heads.includes('Rohertrag') && mc.heads.includes('in %'), 'Speisekarte › Gerichte: alle Spalten sichtbar, bis Rohertrag und Allergene', mc);
    await L.shot(p, 'nachher-menu_ipadl');
    await L.go(p, 'team/dienstplan');
    const dp = await ev(() => [...document.querySelectorAll('#app .tm-sh')].filter(x => x.getBoundingClientRect().width > 0).filter(x => { const t = x.querySelector('b,strong,.tm-t,span') || x; return x.scrollWidth > x.clientWidth + 1; }).map(x => x.textContent.trim()).slice(0, 5));
    const times = await ev(() => [...document.querySelectorAll('#app .tm-sh')].map(x => x.innerText).join(' '));
    L.ok(dp.length === 0 && /08:00–16:00/.test(times) && !/16:0(?!0)/.test(times), 'Dienstplan Woche: Endzeiten vollständig („08:00–16:00“, nicht „08:00–16:0“)', dp);
    await L.shot(p, 'nachher-dienst_ipadl');
    await ev(RECV); await p.waitForTimeout(200);
    const rv = await ev(() => { const s = document.querySelector('#app select[data-rs="0"]').getBoundingClientRect(); const w = document.querySelector('#app table.recv').closest('.tbl-wrap'); return {sel:s.right <= w.getBoundingClientRect().right + 1 && s.width > 60, fit:w.scrollWidth <= w.clientWidth + 1}; });
    L.ok(rv.sel && rv.fit, 'Wareneingang: die Spalte „Status“ ist ohne Wischen ganz zu sehen', rv);
    await L.shot(p, 'nachher-recv_ipadl'); errs.push(...p.errs); await p.context().close(); }
  { const {p} = await L.open(b, {vp:{width:768, height:1024}, ctx:{hasTouch:true}}); await p.evaluate(RECV); await p.waitForTimeout(200);
    const rv = await p.evaluate(() => { const s = document.querySelector('#app select[data-rs="0"]').getBoundingClientRect(); return {vis:s.right <= innerWidth && s.width > 60, lab:getComputedStyle(document.querySelector('#app table.recv td[data-l="Status"]'), '::before').content}; });
    L.ok(rv.vis && rv.lab === '"Status"', 'iPad hoch: Wareneingang als Zeilen mit beschrifteten Feldern', rv);
    await L.shot(p, 'nachher-recv_ipadp'); errs.push(...p.errs); await p.context().close(); }
  // ---------- Rezept ohne Foto ----------
  for(const [name, o] of [['handy', L.PHONE], ['ipad-hoch', {vp:{width:768, height:1024}, ctx:{hasTouch:true}}], ['desktop', {vp:{width:1440, height:900}}]]){
    const {p} = await L.open(b, o); await L.go(p, 'rezepte/dish_kaiser');
    const r = await p.evaluate(() => { const ph = document.querySelector('#app .hero .ph-empty').getBoundingClientRect(); const h1 = document.querySelector('#app .hero h1, #app .hero .title-in, #app .hero-main'); const add = document.querySelector('#app .hero [data-act="photoCard"]'); return {w:Math.round(ph.width), h:Math.round(ph.height), title:Math.round(h1.getBoundingClientRect().top), add:add.textContent.trim(), addVis:add.getBoundingClientRect().width > 0}; });
    L.ok(r.w <= 64 && r.h <= 64 && r.title < 400 && r.add === 'Foto hinzufügen' && r.addVis, `Rezept ohne Foto (${name}): kleines Zeichen und „Foto hinzufügen“, der Name steht oben`, r);
    if(name === 'handy') await L.shot(p, 'nachher-rez_phone'); errs.push(...p.errs); await p.context().close(); }
  await L.done(b, errs);
})();
