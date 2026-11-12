// fix2 · Befund 8–11: Portionen beim Tippen, Portionen/Häkchen bleiben; Küche als Standard für Küchen-Wege; Rezepte-Liste „Gerichte“;
// Zurück-Geste geht einen Schritt zurück; Kalkulation am iPad quer ohne Überlappung.
const L = require('./lib');
(async () => { const b = await L.launch();
  // ---------- 8 · Handy: 12 Portionen ----------
  { const {c, p} = await L.open(b, L.PHONE); const ev = (f, a) => p.evaluate(f, a); const w = ms => p.waitForTimeout(ms);
    await ev(() => { view.cv = 'kueche'; go('cards', 'dish_schnitzel_pork'); }); await w(300);
    await p.tap('#rzN'); await w(100);
    L.ok(await ev(() => { const i = document.querySelector('#rzN'); return i.selectionStart === 0 && i.selectionEnd === i.value.length; }), 'Antippen markiert die ganze Zahl');
    await p.keyboard.type('12'); await w(200);
    const t = await ev(() => ({v:document.querySelector('#rzN').value, h:document.querySelector('#app .rz-sec h2 span').textContent, q:document.querySelector('#app .rz-ing li .rz-q').textContent, focus:document.activeElement.id}));
    L.ok(t.v === '12' && t.h === 'für 12 Portionen' && t.q === '2,16 kg' && t.focus === 'rzN', '„12“ tippen: 12 Portionen (nicht 121), Mengen rechnen sofort mit, ohne Enter; das Feld behält den Fokus', t);
    await L.shot(p, 'x05-portionen-12');
    await p.tap('#app .rz-ing li:nth-child(1) .rz-i'); await w(100);
    await ev(() => go('checkl')); await w(200); await ev(() => { view.cv = 'kueche'; go('cards', 'dish_schnitzel_pork'); }); await w(250);
    L.ok(await ev(() => document.querySelector('#rzN').value === '12' && document.querySelectorAll('#app .rz li.done').length === 1), 'zu den Checklisten und zurück: 12 Portionen und das Häkchen sind noch da');
    await p.tap('#rzN'); await p.keyboard.type('0'); await w(150);
    L.ok(await ev(() => /für 12 Portionen/.test(document.querySelector('#app .rz-sec h2').textContent)), '„0“ während des Tippens: Mengen bleiben beim letzten gültigen Wert');
    await c.close(); }
  // ---------- 9 · Wege in die Rezeptur ----------
  const {p} = await L.open(b, L.TABLET); const ev = (f, a) => p.evaluate(f, a); const w = ms => p.waitForTimeout(ms);
  await L.go(p, 'vorbereitung'); await w(250); await p.click('#app .pl-rz >> nth=0'); await w(300);
  L.ok(await ev(() => view.tab === 'cards' && rzMode(C(view.card)) === 'kueche' && !!document.querySelector('#app .rz-k')), 'Vorbereitung → „Rezeptur“: Küche, nicht der Kalkulations-Editor');
  await ev(() => { view.cv = null; go('dash'); palOpen(); }); await p.fill('#palIn', 'gulasch'); await w(150); await p.keyboard.press('Enter'); await w(300);
  L.ok(await ev(() => view.tab === 'cards' && !!document.querySelector('#app .rz-k')), 'Schnellsuche → Rezeptur: Küche');
  await ev(() => { view.cv = null; view.ctype = 'dish'; go('cards'); }); await w(250);
  const li = await ev(() => ({tab:document.querySelector('#app .rz-sw [role=tab].on').dataset.id, f:document.querySelector('#app [data-act="ctype"].on').dataset.id, drinks:[...document.querySelectorAll('#app table.lt tbody tr')].filter(tr => C(tr.dataset.id).drink).length, semi:[...document.querySelectorAll('#app table.lt tbody tr')].filter(tr => C(tr.dataset.id).type === 'semi').length}));
  L.ok(li.tab === 'kueche' && li.f === 'dish' && li.drinks === 0 && li.semi === 0, 'Rezepte-Liste: zuerst Küche, Filter „Gerichte“, keine Getränke dazwischen', li);
  await p.click('#app table.lt tbody tr:first-child'); await w(250);
  L.ok(await ev(() => !!document.querySelector('#app .rz-k')), 'aus der Liste: Küche');
  await ev(() => { view.cv = null; view.mtab = 'calc'; go('menu'); }); await w(250); await p.click('#app tr.row[data-act="openCard"] >> nth=0 >> td:nth-child(2)'); await w(300);
  L.ok(await ev(() => view.tab === 'cards' && rzMode(C(view.card)) === 'kalk'), 'Speisekarte (Preise) → Rezeptur: Kalkulation');
  // ---------- 10 · Zurück ----------
  await L.go(p, 'heute'); await ev(() => { view.cv = null; navGo('cards'); }); await w(200);
  const dish = await ev(() => S.cards.find(c => c.type === 'dish' && c.items.some(i => String(i.ref).startsWith('c:'))).id);
  await p.click(`#app table.lt tbody tr[data-id="${dish}"]`).catch(async () => { await ev(id => { view.ctype = 'all'; render(); }); await p.click(`#app table.lt tbody tr[data-id="${dish}"]`); }); await w(250);
  await p.click('#app .rz-open >> nth=0'); await w(250);
  const sub = await ev(() => view.card);
  await p.goBack(); await w(400);
  L.ok(await ev(d => view.tab === 'cards' && view.card === d && location.href.includes('/dahuam/'), dish), 'Zurück aus dem Basisrezept: wieder beim Gericht (nicht aus der App)', await ev(() => location.hash));
  await p.goBack(); await w(400);
  L.ok(await ev(() => view.tab === 'cards' && !view.card), 'noch einmal Zurück: Rezepte-Liste');
  await p.goBack(); await w(400);
  L.ok(await ev(() => view.tab === 'dash'), 'noch einmal: Heute');
  await p.goForward(); await w(400); L.ok(await ev(() => view.tab === 'cards' && !view.card), 'Vorwärts geht auch');
  await ev(() => { view.cv = 'kueche'; render(); hashSync(); }); const hl = await ev(() => history.length); await ev(() => { view.cv = 'service'; render(); hashSync(); });
  L.ok(await ev(n => history.length === n, hl), 'nur die Ansicht gewechselt: kein neuer Eintrag im Verlauf');
  L.ok(!!sub, 'Basisrezept war offen');
  // ---------- 11 · Kalkulation am iPad quer ----------
  await ev(() => { view.cv = 'kalk'; go('cards', 'semi_goulash'); }); await w(400);
  const g = await ev(() => { const sec = document.querySelector('#app .teller-sec').getBoundingClientRect(); const right = document.querySelector('#app .grid2 > .col:nth-child(2)').getBoundingClientRect(); const tiles = [...document.querySelectorAll('#app .teller .tl-tiles > *')].map(t => t.getBoundingClientRect().right); return {max:Math.max(...tiles), sec:sec.right, col:right.left, n:tiles.length}; });
  L.ok(g.n > 3 && g.max <= g.sec + 0.5 && g.max < g.col, '1024 × 768: Zutaten-Kacheln bleiben im Teller und überlappen „Produktionsmenge“ nicht', g);
  await L.shot(p, 'x05-kalk-1024');
  await p.setViewportSize({width:1440, height:900}); await w(300);
  const g2 = await ev(() => { const t = document.querySelector('#app .teller'); return getComputedStyle(t).gridTemplateColumns.split(' ').length; });
  L.ok(g2 === 2, 'breiter Bildschirm: Teller und Kacheln wieder nebeneinander', g2);
  await L.done(b, p.errs); })();
