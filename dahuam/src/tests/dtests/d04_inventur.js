// Bar-Inventur in der Zählliste, schmale Ansicht 760 px (bis 700 px zählt das Handy im Blatt mit denselben Zehnteln, siehe phonetests/p02 und p05): volle Flaschen als ganze Zahl, die angebrochene in Zehnteln, Fass genauso. Ergebnis in Litern für die vorhandene Bestands- und Differenzrechnung.
const L = require('./lib'); const near = (a, b, e = 1e-6) => Math.abs(a - b) < e; const sp = s => String(s).replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
(async () => { const b = await L.launch(); const {p} = await L.open(b, {vp:{width:760, height:1000}, ctx:L.PHONE.ctx});
  await L.go(p, 'ware/inventur');
  L.ok(/Getränke zählen Sie in vollen Flaschen oder Fässern, die angebrochene dazu in Zehnteln/.test(await p.evaluate(() => document.querySelector('#app .fact').textContent)), 'vor dem Start: ein Satz erklärt das Zählen der Getränke');
  await p.click('#app [data-act=invStart]'); await p.waitForTimeout(300);
  // Bar & Weinkeller ist ein eigener Abschnitt der Zählliste
  const sec = await p.evaluate(() => { const h = [...document.querySelectorAll('#app h2.sec-h')].find(x => /Bar & Weinkeller/.test(x.textContent)); const ul = h.nextElementSibling; return {n:ul.children.length, bars:ul.querySelectorAll('li.bar').length, plain:[...ul.querySelectorAll('li:not(.bar) .inv-n b')].map(x => x.textContent).join('|')}; });
  L.ok(sec.n === 12 && sec.bars === 9 && sec.plain === 'Kaffeebohnen|Kirschwasser|Kochwein weiß, trocken', 'Abschnitt „Bar & Weinkeller“: 9 Getränke mit Flaschen-Zählung, Kaffee und Kochzutaten wie bisher', sec);
  // Maße am Handy
  const m = await p.evaluate(() => { const bad = []; document.querySelectorAll('#app .inv-l li.bar').forEach(li => { const r = li.getBoundingClientRect(); const inp = li.querySelector('input[data-invf]').getBoundingClientRect(); const bs = [...li.querySelectorAll('.inv-t button')]; const br = bs.map(x => x.getBoundingClientRect());
      if(r.right > 760.5 || inp.height < 40 || bs.length !== 9 || br.some(x => x.right > 760.5 || x.height < 28 || x.width < 28) || br.some((x, i) => i && x.left < br[i - 1].right)) bad.push(li.id); });
    return {bad, w:document.documentElement.scrollWidth, txt:[...document.querySelectorAll('#ir-gv .inv-t button')].map(x => x.textContent).join(' '), em:document.querySelector('#ir-gv .inv-q em').textContent + '|' + document.querySelector('#ir-bier .inv-q em').textContent, soll:document.querySelector('#ir-gv .inv-n small').textContent + '|' + document.querySelector('#ir-bier .inv-n small').textContent}; });
  L.ok(m.bad.length === 0 && m.w === 760, 'schmal 760 px: Feld mindestens 40 px hoch, neun Zehntel-Knöpfe, nichts ragt hinaus, kein Querrollen (die Fingermaße 44/40 px prüft am Handy phonetests/p05 und p08)', m);
  L.ok(m.txt === '0,1 0,2 0,3 0,4 0,5 0,6 0,7 0,8 0,9' && m.em === 'Fl.|Fass' && m.soll === 'Soll 8 Fl.|Soll 1,5 Fass', 'Knöpfe 0,1 bis 0,9; Einheit „Fl.“ bzw. „Fass“; Soll in Flaschen und Fässern', [m.txt, m.em, m.soll]);
  await p.evaluate(() => document.querySelector('#ir-apfelsaft').scrollIntoView({block:'start'})); await p.evaluate(() => window.scrollBy(0, -120)); await L.shot(p, 'd04-inventur-handy', {full:false});
  // ---------- Veltliner: 5 volle + 0,3 ----------
  await p.fill('#inv-gv', '5'); await p.waitForTimeout(120);
  L.ok(await p.evaluate(() => S.invDraft.counts.gv === 3.75 && S.invDraft.bar.gv.f === 5 && S.invDraft.bar.gv.t === 0 && document.querySelector('#ir-gv').classList.contains('counted')), '5 volle Flaschen 0,75 l = 3,75 l');
  await p.tap('#ir-gv .inv-t button:nth-of-type(3)'); await p.waitForTimeout(150);
  const g = await p.evaluate(() => ({c:S.invDraft.counts.gv, on:[...document.querySelectorAll('#ir-gv .inv-t button.on')].map(x => x.textContent).join(), pressed:document.querySelector('#ir-gv .inv-t button:nth-of-type(3)').getAttribute('aria-pressed'), df:document.querySelector('#ir-gv .idf').textContent, dv:document.querySelector('#ir-gv .idv').textContent, val:document.querySelector('#inv-gv').value, prog:document.querySelector('#invProg').textContent}));
  // Soll 8 Fl. = 6 l; gezählt 5,3 Fl. = 3,975 l; Differenz −2,025 l = −2,7 Fl. × 6,40 = −17,28 €
  L.ok(near(g.c, 3.975) && g.on === '0,3' && g.pressed === 'true' && g.val === '5' && sp(g.df) === '-2,7 Fl.' && /17,28/.test(g.dv) && /^1 \/ /.test(g.prog), 'dazu „0,3“ getippt: 5,3 × 0,75 = 3,975 l · Differenz −2,7 Fl. = −€ 17,28 · zählt als 1 gezählt', g);
  await p.tap('#ir-gv .inv-t button:nth-of-type(7)'); await p.waitForTimeout(120);
  L.ok(near(await p.evaluate(() => S.invDraft.counts.gv), 5.7 * 0.75) && await p.evaluate(() => document.querySelectorAll('#ir-gv .inv-t button.on').length) === 1, 'anderes Zehntel getippt: 5,7 Flaschen, nur ein Knopf aktiv');
  await p.tap('#ir-gv .inv-t button:nth-of-type(7)'); await p.waitForTimeout(120);
  L.ok(await p.evaluate(() => S.invDraft.counts.gv === 3.75 && !document.querySelector('#ir-gv .inv-t button.on')), 'noch einmal getippt: Zehntel zurückgenommen, 5 Flaschen bleiben');
  // nur eine angebrochene, keine volle
  await p.tap('#ir-zweigelt .inv-t button:nth-of-type(4)'); await p.waitForTimeout(120);
  L.ok(near(await p.evaluate(() => S.invDraft.counts.zweigelt), 0.3) && await p.evaluate(() => document.querySelector('#ir-zweigelt').classList.contains('counted') && document.querySelector('#inv-zweigelt').value === ''), 'nur „0,4“ ohne volle Flasche: 0,4 × 0,75 = 0,3 l, gilt als gezählt');
  await p.tap('#ir-zweigelt .inv-t button:nth-of-type(4)'); await p.waitForTimeout(120);
  L.ok(await p.evaluate(() => S.invDraft.counts.zweigelt === '' && !document.querySelector('#ir-zweigelt').classList.contains('counted')), 'zurückgenommen: wieder „nicht gezählt“');
  // „12,5“ getippt: zwölf volle und fünf Zehntel
  await p.fill('#inv-mineral', '12,5'); await p.waitForTimeout(150);
  L.ok(await p.evaluate(() => Math.abs(S.invDraft.counts.mineral - 12.5 * 0.33) < 1e-9 && S.invDraft.bar.mineral.f === 12 && S.invDraft.bar.mineral.t === 5 && document.querySelector('#ir-mineral .inv-t button.on').textContent === '0,5'), '„12,5“ im Feld: 12 volle und 0,5 angebrochen = 4,125 l');
  await p.fill('#inv-mineral', 'abc'); await p.waitForTimeout(120);
  L.ok(await p.evaluate(() => document.querySelector('#inv-mineral').classList.contains('bad-in') && Math.abs(S.invDraft.counts.mineral - 4.125) < 1e-9), 'Buchstaben: Feld rot, der gezählte Wert bleibt');
  await p.fill('#inv-mineral', '12'); await p.waitForTimeout(120);
  L.ok(await p.evaluate(() => Math.abs(S.invDraft.counts.mineral - 4.125) < 1e-9 && S.invDraft.bar.mineral.t === 5), 'ganze Zahl nachgetragen: die angetippten Zehntel bleiben (12 volle + 0,5)');
  // ---------- Fass: 1 volles + 0,6 im Anstich ----------
  await p.fill('#inv-bier', '1'); await p.tap('#ir-bier .inv-t button:nth-of-type(6)'); await p.waitForTimeout(150);
  const f = await p.evaluate(() => ({c:S.invDraft.counts.bier, df:document.querySelector('#ir-bier .idf').textContent, dv:document.querySelector('#ir-bier .idv').textContent, label:document.querySelector('#ir-bier .inv-t').getAttribute('aria-label')}));
  // Soll 45 l; gezählt 1,6 × 30 = 48 l; +3 l × 2,20 = +6,60 €
  L.ok(f.c === 48 && sp(f.df) === '+3 l' && /6,60/.test(f.dv) && /^Angebrochenes Fass/.test(f.label), 'Fass: 1 volles + 0,6 im Anstich = 1,6 × 30 l = 48 l · Soll 45 l · +3 l = +€ 6,60', f);
  // normaler Artikel im selben Abschnitt wie bisher
  await p.fill('#inv-kaffee', '5,5'); await p.waitForTimeout(120);
  L.ok(await p.evaluate(() => S.invDraft.counts.kaffee === 5.5), 'Kaffeebohnen: Zählung in kg wie bisher');
  // Enter springt weiter, auch über Getränke-Felder
  await p.focus('#inv-apfelsaft'); await p.keyboard.press('Enter');
  L.ok(await p.evaluate(() => document.activeElement.id) === 'inv-bitter', 'Enter springt zum nächsten Zählfeld');
  await L.shot(p, 'd04-inventur-gezaehlt', {full:false}); await L.theme(p, 'dark'); await L.shot(p, 'd04-inventur-gezaehlt-dunkel', {full:false}); await L.theme(p, 'light');
  // gespeichert, neu geladen: Zehntel sind noch da
  await L.idle(p); await p.reload(); await L.ready(p); await L.go(p, 'ware/inventur');
  L.ok(await p.evaluate(() => document.querySelector('#inv-bier').value === '1' && document.querySelector('#ir-bier .inv-t button.on').textContent === '0,6' && document.querySelector('#inv-gv').value === '5' && document.querySelector('#inv-mineral').value === '12' && document.querySelector('#ir-mineral .inv-t button.on').textContent === '0,5'), 'neu geladen: volle Flaschen und Zehntel stehen wieder da');
  // ---------- Team zählt, nur der Chef schließt ab ----------
  await L.team(p); await L.go(p, 'ware/inventur');
  L.ok(await p.evaluate(() => !document.querySelector('#inv-zweigelt').disabled && !document.querySelector('#ir-zweigelt .inv-t button').disabled && document.querySelector('#app [data-act=invFinish]').disabled && document.querySelector('#app [data-act=invCancel]').disabled), 'Team: Feld und Zehntel sind frei, „Abschließen“ und „Verwerfen“ gesperrt');
  await p.fill('#inv-zweigelt', '18'); await p.tap('#ir-zweigelt .inv-t button:nth-of-type(2)'); await p.waitForTimeout(150);
  L.ok(near(await p.evaluate(() => S.invDraft.counts.zweigelt), 18.2 * 0.75), 'Team zählt Zweigelt: 18,2 Flaschen = 13,65 l');
  await L.chef(p); await L.go(p, 'ware/inventur');
  const before = await p.evaluate(() => ({gv:P('gv').stock, bier:P('bier').stock, zw:P('zweigelt').stock, min:P('mineral').stock, pork:P('pork').stock, mv:S.moves.length}));
  await p.click('#app [data-act=invFinish]'); await p.waitForTimeout(300);
  const q = sp(await p.evaluate(() => document.querySelector('#dlgForm .dlg-p').textContent));
  // gv −2,25 l × 8,5333 = −19,20 · zweigelt 13,65 − 15 = −1,35 × 9,60 = −12,96 · mineral 4,125 − 9,9 = −5,775 × 1,2727 = −7,35 · bier +3 × 2,2 = +6,60 · kaffee −0,5 × 17,5 = −8,75 → −41,66
  L.ok(/Inventur mit 5 gezählten Artikeln abschließen\? Differenz: −€ 41,66 \(Fehlbestand\)/.test(q), 'Abschluss-Frage: 5 Artikel, Differenz −19,20 − 12,96 − 7,35 + 6,60 − 8,75 = −€ 41,66', q);
  await L.dlgOk(p);
  const after = await p.evaluate(() => ({gv:P('gv').stock, bier:P('bier').stock, zw:P('zweigelt').stock, min:P('mineral').stock, pork:P('pork').stock, mv:S.moves.length, draft:S.invDraft, inv:S.inventories[0], m0:S.moves.filter(x => x.type === 'inv').map(x => x.pid + ':' + x.qty).sort().join('|')}));
  L.ok(after.gv === 3.75 && after.bier === 48 && after.zw === 13.65 && after.min === 4.125 && after.pork === before.pork && after.draft === null && after.inv.counted === 5 && near(after.inv.diff, -41.66, 0.006), 'abgeschlossen: Bestände in Litern gesetzt (3,75 · 48 · 13,65 · 4,125), nicht Gezähltes unverändert, Inventur mit −€ 41,66 abgelegt', after);
  L.ok(after.m0 === 'bier:3|gv:-2.25|kaffee:-0.5|mineral:-5.775|zweigelt:-1.35', 'Buchungen „Inventur“ in der Basiseinheit Liter', after.m0);
  await L.go(p, 'ware/buchungen');
  L.ok(await p.evaluate(() => document.documentElement.scrollWidth === 760 && /−?-?3 Fl\./.test([...document.querySelectorAll('#app .moves li')].find(li => /Grüner Veltliner/.test(li.textContent)).textContent)), 'Buchungen: Differenz Veltliner als −3 Fl. lesbar, Breite 390');
  await L.done(b, p.errs); })();
