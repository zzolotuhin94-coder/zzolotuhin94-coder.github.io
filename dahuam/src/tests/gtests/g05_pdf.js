// PDF: was man sieht, wird gespeichert – echte Datei je Vorlage, Seitenzahl = Blätter, kein geteiltes Gericht, Allergene mit Legende und °-Satz, Mengen bei Getränken, Preis-Hinweis.
const L = require('./lib'); const fs = require('fs');
(async () => { const b = await L.launch(); const errs = [];
  const {p} = await L.open(b, {vp:{width:1024, height:768}}); const ev = (f, a) => p.evaluate(f, a);
  await L.gk(p);
  for(const k of L.LOOKS){
    await L.pick(p, k); const sh = await L.sheets(p);
    // was beim Speichern im Druckbereich steht, mit dem vergleichen, was die Vorschau zeigt
    const prev = await ev(() => [...document.querySelectorAll('#gsCanvas .gs-page')].map(n => n.textContent.replace(/Seitenumbruch/g, '').replace(/\s+/g, ' ').trim()));
    await ev(() => { window.__gsSeen = null; const o = window.html2canvas; window.__h2c = 0; });
    const d = await L.dl(p, () => p.click('[data-pdf="printMenu"]')); const last = await ev(() => window.__gsLast);
    const pr = await ev(() => { const el = document.querySelector('#print'); const pages = [...el.querySelectorAll('.gs-page')]; return {n:pages.length, txt:pages.map(n => n.textContent.replace(/\s+/g, ' ').trim().length), sel:el.querySelectorAll('.sel,.gs-br,.gs-float').length, cls:el.className,
      over:pages.filter(pg => { const bd = pg.querySelector('.gs-body'); return bd && [...bd.children].reduce((a, c) => a + (c.classList.contains('gs-fill') ? 0 : (parseFloat(c.style.height) || 0)), 0) > 984; }).length,
      text:pages.map(n => n.textContent.replace(/\s+/g, ' ').trim())}; });
    const pages = L.pdfPages(d.file);
    L.ok(pages === sh.length && last.pages === sh.length && pr.n === sh.length && d.size > 60000, `${k}: echte PDF-Datei, ${pages} Seiten = ${sh.length} Blätter (${Math.round(d.size / 1024)} KB)`, d.name);
    L.ok(/\.pdf$/.test(d.name) && (k === 'getraenke' ? /^Getraenkekarte-/ : k === 'kreide' ? /^Heute-an-der-Tafel-/ : /^Speisekarte-/).test(d.name) && /2026-11-12/.test(d.name), `${k}: sprechender Dateiname`, d.name);
    L.ok(pr.over === 0 && pr.sel === 0, `${k}: im PDF läuft kein Blatt über, keine Bedien-Elemente (Auswahl, Marken)`);
    L.ok(JSON.stringify(pr.text) === JSON.stringify(prev), `${k}: Blatt für Blatt derselbe Inhalt wie in der Vorschau`);
    const all = pr.text.join(' ');
    // Allergene
    const al = await ev(() => { const pg = [...document.querySelectorAll('#print .gs-page')]; const marks = [...document.querySelectorAll('#print .gs-al')].map(n => n.textContent); const used = [...new Set(marks.join(' ').split(' ').filter(x => /^[A-Z]$/.test(x)))].sort(); const leg = [...document.querySelectorAll('#print .gs-lgl b')].map(n => n.textContent); return {n:marks.length, open:marks.filter(m => m.includes('°')).length, used, leg, sentence:!!document.querySelector('#print .gs-lg .alg-open'), txt:(document.querySelector('#print .gs-lg') || {}).textContent || ''}; });
    L.ok(al.n > 0 && al.used.join() === al.leg.join() && al.leg.length > 0, `${k}: Allergen-Buchstaben stehen bei den Gerichten, die Legende erklärt genau die verwendeten (${al.leg.join(' ')})`, [al.used, al.leg]);
    L.ok(al.open > 0 ? al.sentence && /Bei Gerichten mit ° fragen Sie bitte unser Team/.test(al.txt) : !al.sentence, `${k}: ${al.open} Gerichte mit ° (Angabe unvollständig) → der Satz dazu steht ${al.open ? '' : 'nicht '}in der Legende`);
    L.ok(/inkl\. MwSt\./.test(al.txt) && /Preise in Euro/.test(al.txt), `${k}: Preis-Hinweis „Alle Preise in Euro inkl. MwSt.“`);
    if(k !== 'kreide') L.ok(/0,5 l ?5,60/.test(all) && /0,125 l ?4,80/.test(all), `${k}: Getränke mit Menge vor dem Preis`);
    if(k === 'haus' || k === 'alpin') L.ok(/vegetarisch/.test(al.txt) && /vegan/.test(al.txt) && /saisonal/.test(al.txt), `${k}: Zeichen v, vg und saisonal sind erklärt`);
  }
  // Tag mit Aktion und unvollständigen Angaben in der Aktion
  await L.pick(p, 'kreide'); await ev(() => { view.gdate = '2026-11-14'; render(); }); await L.settle(p);
  const d2 = await L.dl(p, () => p.click('[data-pdf="printMenu"]'));
  L.ok(L.pdfPages(d2.file) === (await L.sheets(p)).length && await ev(() => /Gerlosser Wildwochenende/.test(document.querySelector('#print .gs-ak').textContent)), 'Kreidetafel am Aktionstag: die Aktion steht im PDF');
  // Speichern ändert nichts an der Vorschau und hinterlässt keinen Rest
  L.ok(await ev(() => !document.querySelector('#print').classList.contains('pdf') && document.querySelectorAll('#gsCanvas .gs-sheet').length > 0), 'nach dem Speichern steht die Vorschau wie vorher');
  // danach ein anderes PDF der App (Allergen-Blatt): unbeeinflusst
  await ev(() => { view.gdate = '2026-11-12'; render(); }); await L.settle(p);
  const d3 = await L.dl(p, () => ev(() => abExportPdf()));
  L.ok(/^Allergen-Blatt/.test(d3.name) && L.pdfPages(d3.file) >= 1 && await ev(() => !document.querySelector('#print .gs-page')), 'ein anderes PDF danach (Allergen-Blatt) ist nicht betroffen', d3.name);
  // Druck-Regeln: je Blatt eine A4-Seite
  L.ok(await ev(() => [...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => r.type === CSSRule.MEDIA_RULE && /print/.test(r.conditionText) && /gs-print \.gs-page/.test(r.cssText) && /break-after:\s*page/.test(r.cssText)); } catch(e){ return false; } })), 'Drucken: jedes Blatt beginnt auf einer eigenen A4-Seite');
  errs.push(...p.errs); await L.done(b, errs);
})();
