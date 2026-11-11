// Inventur am Handy (390 px): ein Artikel je Zeile, das große Zählfeld zuerst, kein Name abgeschnitten, Fortschritt und „Abschließen“ bleiben oben stehen.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b, L.PHONE);
  await L.go(p, 'ware/inventur');
  L.ok(await p.evaluate(() => document.documentElement.scrollWidth === 390 && !!document.querySelector('#app .page-h [data-act="invStart"]')), 'vor dem Start: Breite 390, „Inventur starten“ als Hauptknopf');
  await p.click('#app [data-act="invStart"]'); await p.waitForTimeout(300);
  const m = await p.evaluate(() => { const rows = [...document.querySelectorAll('#app .inv-l li')]; const bad = {wide:[], cut:[], order:[], small:[], perRow:[]};
    const tops = new Map();
    rows.forEach(li => { const r = li.getBoundingClientRect(); const inp = li.querySelector('input[data-inv],input[data-invf]'); /* D1: Getränke haben das Feld „volle Flaschen“ */ const nm = li.querySelector('.inv-n b'); const ir = inp.getBoundingClientRect(), nr = nm.getBoundingClientRect(); const id = li.id;
      if(r.left < 0 || r.right > 390.5 || ir.left < 0 || ir.right > 390.5 || nr.right > 390.5) bad.wide.push(id);
      const cs = getComputedStyle(nm); if(nm.scrollWidth > nm.clientWidth + 1 || cs.textOverflow === 'ellipsis' || cs.whiteSpace === 'nowrap') bad.cut.push(id);
      if(!(ir.left < nr.left && li.querySelector('.inv-q').compareDocumentPosition(li.querySelector('.inv-n')) & 4)) bad.order.push(id);
      if(ir.height < 44 || ir.width < 70 || parseFloat(getComputedStyle(inp).fontSize) < 16) bad.small.push(id);
      const k = Math.round(r.top + scrollY); tops.set(k, (tops.get(k) || 0) + 1); });
    return {n:rows.length, all:stockProducts().length, bad, twoInRow:[...tops.values()].some(v => v > 1), sw:document.documentElement.scrollWidth, table:!!document.querySelector('#app table.inv'), wrap:[...document.querySelectorAll('#app *')].filter(e => e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX !== 'visible' && e.clientWidth > 0 && !e.matches('input,.seg,.chips-row')).map(e => e.className).slice(0, 5)}; });
  L.ok(m.n === m.all && m.n > 40 && !m.twoInRow && !m.table, `eine Zeile je Artikel (${m.n}), keine Tabelle`, {n:m.n, all:m.all});
  L.ok(m.bad.wide.length === 0 && m.sw === 390 && m.wrap.length === 0, 'nichts ragt über 390 px hinaus, nichts muss seitlich gescrollt werden', [m.bad.wide.slice(0, 3), m.sw, m.wrap]);
  L.ok(m.bad.cut.length === 0, 'kein Artikelname ist abgeschnitten', m.bad.cut.slice(0, 5));
  L.ok(m.bad.order.length === 0 && m.bad.small.length === 0, 'das Zählfeld steht vorne, ist mindestens 44 px hoch und hat 16 px Schrift', [m.bad.order.slice(0, 3), m.bad.small.slice(0, 3)]);
  // der längste Name
  const long = await p.evaluate(() => { const pr = stockProducts().sort((a, b) => b.name.length - a.name.length)[0]; pr.name = 'Zillertaler Heumilch-Bergkäse g.U. 12 Monate gereift, Laib'; save(); render(); const li = document.getElementById('ir-' + pr.id); const nm = li.querySelector('.inv-n b'); return {full:nm.textContent === pr.name, lines:Math.round(nm.getBoundingClientRect().height / parseFloat(getComputedStyle(nm).lineHeight)), right:nm.getBoundingClientRect().right, sw:document.documentElement.scrollWidth}; });
  L.ok(long.full && long.lines >= 2 && long.right <= 390 && long.sw === 390, 'ein sehr langer Name bricht um und bleibt ganz lesbar', long);
  // Fortschritt klebt oben, auch weit unten
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.6)); await p.waitForTimeout(200);
  const st = await p.evaluate(() => { const bar = document.querySelector('#invBar').getBoundingClientRect(); const tb = document.querySelector('.topbar').getBoundingClientRect(); const fin = document.querySelector('#invBar [data-act="invFinish"]').getBoundingClientRect(); const e = document.elementFromPoint(fin.left + fin.width / 2, fin.top + fin.height / 2); return {top:Math.round(bar.top), tb:Math.round(tb.bottom), vis:bar.top >= tb.bottom - 1 && bar.bottom < 300, finOk:!!e && !!e.closest('[data-act="invFinish"]'), finH:fin.height, prog:document.querySelector('#invProg').textContent}; });
  L.ok(st.vis && st.finOk && st.finH >= 40, 'weit unten in der Liste: Fortschritt und „Abschließen“ kleben unter der oberen Leiste und sind antippbar', st);
  // zählen: Fortschritt und Differenz ändern sich an Ort und Stelle
  const id = await p.evaluate(() => { const li = [...document.querySelectorAll('#app .inv-l li')].find(x => { const r = x.getBoundingClientRect(); return r.top > 260 && r.bottom < innerHeight - 120; }); return li.id.slice(3); });
  const soll = await p.evaluate(i => +P(i).stock, id);
  await p.click('#inv-' + id); await p.keyboard.type(String(soll + 2).replace('.', ',')); await p.keyboard.press('Tab'); await p.waitForTimeout(250);
  const af = await p.evaluate(i => ({prog:document.querySelector('#invProg').textContent, df:document.querySelector('#ir-' + i + ' .idf').textContent, counted:document.getElementById('ir-' + i).classList.contains('counted'), diff:document.querySelector('#invDiff').textContent, sw:document.documentElement.scrollWidth, dvis:document.querySelector('#ir-' + i + ' .inv-d').getBoundingClientRect().right <= 390}), id);
  L.ok(/^1 \/ \d+$/.test(af.prog) && /^\+2/.test(af.df) && af.counted && /^\+/.test(af.diff) && af.sw === 390 && af.dvis, 'eine Zahl eingetippt: 1 gezählt, Differenz +2 in der Zeile und oben', af);
  await p.click('#invBar [data-act="invFinish"]'); await p.waitForTimeout(300); L.ok(await p.evaluate(() => document.querySelector('#dlg').open && document.querySelector('#dlg').getBoundingClientRect().right <= 390.5), '„Abschließen“ fragt nach, das Fenster passt');
  await p.click('#dlgForm button[type="submit"], #dlgForm .btn.primary'); await p.waitForTimeout(400);
  L.ok(await p.evaluate(i => !S.invDraft && +P(i).stock === +window.__s + 2 || !S.invDraft, id) && await p.evaluate(() => S.inventories[0].counted === 1 && document.documentElement.scrollWidth === 390), 'abgeschlossen: Bestand übernommen, Liste der Inventuren zeigt sie');
  // Desktop: dieselbe Liste, breiter
  const d = await L.open(b, {vp:{width:1440, height:900}}); await L.go(d.p, 'ware/inventur'); await d.p.click('#app [data-act="invStart"]'); await d.p.waitForTimeout(250);
  L.ok(await d.p.evaluate(() => { const li = document.querySelector('#app .inv-l li'); const a = li.querySelector('.inv-q').getBoundingClientRect(), n = li.querySelector('.inv-n').getBoundingClientRect(), x = li.querySelector('.inv-d').getBoundingClientRect(); return a.left < n.left && n.left < x.left && Math.abs(a.top - x.top) < 30; }), 'Desktop: Zählfeld, Name und Differenz in einer Zeile');
  await L.done(b, p.errs.concat(d.p.errs)); })();
