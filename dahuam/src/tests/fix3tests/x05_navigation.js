// Navigation und Rahmen: untere Leiste (Heute · Vorbereitung · Rezepte · Ware · Mehr), überall „Vorbereitung“, kein „Prep“;
// weniger Kopf vor dem Inhalt am Handy; Abdunkeln über die ganze Breite; dunkle Seitenleiste mit Kante; kleines Zeichen; Speichern bleibt im Dialog sichtbar.
const L = require('./lib');
(async () => { const b = await L.launch(); const errs = [];
  // ---------- Handy (bis 700 px, phone.js): vier Ziele, auch hier nirgends „Prep“ ----------
  { const {p} = await L.open(b, L.PHONE); const ev = (f, a) => p.evaluate(f, a);
    const bar = await ev(() => [...document.querySelectorAll('.bottom .nav-i')].filter(n => n.getClientRects().length).map(x => x.textContent.trim()));
    L.ok(bar.join('|') === 'Heute|Suchen|Bestellen|Mehr', 'Handy: Heute · Suchen · Bestellen · Mehr (Vorbereitung als Zeile auf Heute)', bar);
    const prep = [];
    for(const h of L.SCREENS){ await L.go(p, h); const t = await ev(() => document.body.innerText); if(/\bPrep\b|Prep-/.test(t)) prep.push(h); }
    await L.go(p, 'vorbereitung'); const vh = await ev(() => { const n = document.querySelector('#plPrep .day-h'); return n ? n.firstChild.textContent : document.querySelector('#app h1').textContent; });
    L.ok(prep.length === 0 && /^Vorbereitung/.test(vh), 'Handy: überall „Vorbereitung“, nirgends „Prep“', {prep, vh});
    const w = ms => p.waitForTimeout(ms);
    // weniger Kopf, Untertitel und Dialoge: am Handy (bis 700 px; Bestand und Rezepte sind dort Zeilen der Handy-Bedienung)
    const first = {};
    for(const [h, sel] of [['ware/bestand', '#app table.stock tr.row, #app [data-act="phArt"]'], ['speisekarte', '#app table.lt tr.row'], ['rezepte', '#app table.lt tr.row, #app .shelf-row, #app [data-act="openCard"]'], ['einstellungen', '#app .panel']]){ await L.go(p, h); first[h] = await ev(s => Math.round(document.querySelector(s).getBoundingClientRect().top), sel); }
    L.ok(first['ware/bestand'] <= 420 && first['speisekarte'] <= 440 && first['rezepte'] <= 360 && first['einstellungen'] <= 130, 'Handy: der erste Inhalt steht rund 120 px höher (vorher Ware 511, Speisekarte 520, Rezepte 436, Einstellungen 158)', first);
    const desc = await ev(() => { go('menu'); const s = document.querySelector('#app .page-h .sub'); return s ? getComputedStyle(s).display : 'none'; });
    L.ok(desc === 'none', 'Handy: der beschreibende Untertitel steht hinter „?“, nicht im Kopf');
    // Speichern bleibt sichtbar
    for(const [n, f, lab] of [['Artikel bearbeiten', () => prodDialog(S.products[3]), 'Speichern'], ['Verkäufe buchen', () => salesDlg(), 'Abbuchen']]){
      await ev(f); await w(300);
      const r = await ev(lab => { const d = document.querySelector('#dlg'); const btn = [...d.querySelectorAll('.dlg-actions .btn')].find(x => x.textContent.trim() === lab); const br = btn.getBoundingClientRect(), dr = d.getBoundingClientRect(); return {long:d.scrollHeight > d.clientHeight + 50, vis:br.bottom <= dr.bottom + 1 && br.top >= dr.top && br.bottom <= innerHeight, pos:getComputedStyle(btn.closest('.dlg-actions')).position}; }, lab);
      L.ok(r.long && r.vis && r.pos === 'sticky', `„${n}“ (langer Dialog): „${lab}“ ist ohne Scrollen sichtbar`, r);
      if(n === 'Verkäufe buchen') await L.shot(p, 'nachher-dialog-verkaeufe');
      await ev(() => document.querySelector('#dlg').close()); await w(150); }
    errs.push(...p.errs); await p.context().close(); }
  // ---------- schmal (701–900 px): Leiste und „Mehr“ aus fix-3 ----------
  { const {p} = await L.open(b, L.NARROW); const ev = (f, a) => p.evaluate(f, a); const w = ms => p.waitForTimeout(ms);
    const bar = await ev(() => [...document.querySelectorAll('.bottom .nav-i')].map(x => x.textContent.replace(/­/g, '') + ':' + (x.dataset.tab || x.dataset.act)));
    L.ok(bar.join('|') === 'Heute:dash|Vorbereitung:vorb|Rezepte:cards|Ware:ware|Mehr:mehr', 'untere Leiste: Heute · Vorbereitung · Rezepte · Ware · Mehr (Ware mit einem Tipp, ein Wort je Bereich)', bar);
    await p.tap('.bottom .nav-i[data-tab="ware"]'); await w(250);
    L.ok(await ev(() => view.tab === 'stock' && document.querySelector('.bottom .nav-i[data-tab="ware"]').classList.contains('on')), 'Ware öffnet den Bestand, der Reiter „Bestellen“ ist gleich daneben');
    await p.tap('.bottom .nav-i[data-act="mehr"]'); await w(250);
    const more = await ev(() => [...document.querySelectorAll('#mehr .sheet-i b')].map(x => x.textContent));
    L.ok(more.join('|') === 'Checklisten|Speisekarte|Team & Zahlen|Apartments|Einstellungen|Suche', '„Mehr“: Checklisten, Speisekarte, Team & Zahlen, Apartments, Einstellungen, Suche', more);
    await p.tap('#mehr .sheet-i[data-tab="checkl"]'); await w(250); L.ok(await ev(() => view.tab === 'checkl' && document.querySelector('.bottom .nav-i[data-act="mehr"]').classList.contains('on')), 'Checklisten über „Mehr“; „Mehr“ ist dann markiert');
    const prep = [];
    for(const h of L.SCREENS){ await L.go(p, h); const t = await ev(() => document.body.innerText); if(/\bPrep\b|Prep-/.test(t)) prep.push(h); }
    await L.go(p, 'vorbereitung'); const vh = await ev(() => document.querySelector('#plPrep .day-h').firstChild.textContent);
    L.ok(prep.length === 0 && vh === 'Vorbereitungsliste', 'überall „Vorbereitung“ / „Vorbereitungsliste“, nirgends „Prep“', {prep, vh});
    const pal = await ev(() => palData().filter(x => /Prep/.test(x.n + ' ' + x.s)).map(x => x.n)); L.ok(pal.length === 0, 'auch die Suche sagt nicht „Prep“', pal);
    errs.push(...p.errs); await p.context().close(); }
  // ---------- Desktop: Abdunkeln, dunkle Seitenleiste, Zeichen ----------
  for(const dark of [false, true]){
    const {p} = await L.open(b, {vp:{width:1440, height:900}, dark}); const ev = (f, a) => p.evaluate(f, a);
    const x0 = await ev(() => Math.round(document.querySelector('#app .dh-go').getBoundingClientRect().left));
    await ev(() => palOpen()); await p.waitForTimeout(200);
    const o = await ev(() => { const r = document.querySelector('#pal').getBoundingClientRect(); const e = document.elementFromPoint(innerWidth - 4, 400); return {w:Math.round(r.width), vw:innerWidth, edge:!!(e && e.closest('#pal')), x:Math.round(document.querySelector('#app .dh-go').getBoundingClientRect().left)}; });
    L.ok(o.w === o.vw && o.edge && o.x === x0, `${dark ? 'dunkel' : 'hell'}: Schnellsuche dunkelt bis zum rechten Rand ab, die Seite darunter springt nicht`, {...o, x0});
    if(!dark) await L.shot(p, 'nachher-pal_desk');
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    await ev(() => menuDialog()); await p.waitForTimeout(250);
    const d = await ev(() => ({ov:document.documentElement.classList.contains('ov-on'), full:document.documentElement.clientWidth === innerWidth, x:Math.round(document.querySelector('#app h1').getBoundingClientRect().left)}));
    await ev(() => document.querySelector('#dlg').close()); await p.waitForTimeout(150);
    const after = await ev(() => ({ov:document.documentElement.classList.contains('ov-on'), x:Math.round(document.querySelector('#app h1').getBoundingClientRect().left)}));
    L.ok(d.ov && d.full && !after.ov && d.x === after.x, `${dark ? 'dunkel' : 'hell'}: Dialoge ebenso; danach wieder normal`, {d, after});
    const s = await ev(() => ({edge:getComputedStyle(document.querySelector('.side')).boxShadow, logo:getComputedStyle(document.querySelector('.side .logo'), '::after').content, mask:getComputedStyle(document.querySelector('.side .logo')).maskImage || getComputedStyle(document.querySelector('.side .logo')).webkitMaskImage}));
    L.ok((dark ? /inset/.test(s.edge) : true) && s.logo === '"D"' && (!s.mask || s.mask === 'none'), `${dark ? 'dunkel: Seitenleiste mit feiner goldener Kante; ' : ''}kleines Zeichen „D“ im Ring statt der verkleinerten Illustration`, s);
    await L.shot(p, `nachher-desktop-${dark ? 'dunkel' : 'hell'}`); errs.push(...p.errs); await p.context().close(); }
  await L.done(b, errs);
})();
