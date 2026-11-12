// Bilder der echten Umsetzung, hell und dunkel: PH_OUT=/pfad node shots.js
const L = require('./lib');
(async () => { const b = await L.launch();
  for(const dark of [false, true]){ const sfx = dark ? '-dark' : '';
    const {p} = await L.open(b, {...L.IP13, dark});
    await L.shot(p, '01-heute' + sfx);
    await L.tap(p, '.hy-find'); await p.fill('#phQ', 'but'); await L.shot(p, '02a-suchen' + sfx);
    await L.tap(p, '#phRes [data-act="phArt"]'); await L.shot(p, '02b-zaehlen-aus-suche' + sfx); await L.tap(p, '#phSheet .hy-x');
    await L.tap(p, '.bottom [data-ph="best"]'); await L.shot(p, '03a-bestellen' + sfx);
    await L.tap(p, '#app [data-act="phOrd"]'); await L.shot(p, '03b-bestellung' + sfx);
    await p.evaluate(() => { const a = document.querySelector('#phSheet a.hy-btn'); if(a){ a.removeAttribute('href'); a.click(); } }); await p.waitForTimeout(500); await L.shot(p, '03c-gesendet-frage' + sfx); await L.tap(p, '#phSheet .hy-x');
    await L.tap(p, '.bottom [data-ph="heute"]'); await L.tap(p, '#phBoard [data-act="plGo"]'); await p.evaluate(() => { document.querySelectorAll('#app .pl-c')[0].click(); document.querySelectorAll('#app .pl-c')[1].click(); }); await L.shot(p, '04-vorbereitung' + sfx);
    await L.tap(p, '.bottom [data-ph="mehr"]'); await L.shot(p, '07-mehr' + sfx);
    await L.tap(p, '#app [data-act="goStock"][data-id="inventur"]'); await L.shot(p, '05-inventur-start' + sfx);
    await L.tap(p, '#app [data-act="invStart"]');
    await p.evaluate(() => { const d = S.invDraft; stockProducts().filter(x => x.loc === 'K' || x.loc === 'T').forEach(x => { d.counts[x.id] = +x.stock; }); stockProducts().filter(x => x.loc === 'L').sort(byName).slice(0, 3).forEach((x, i) => { d.counts[x.id] = Math.max(0, +x.stock - i * 0.5); }); save(); render(); });
    await p.waitForTimeout(2400); await L.shot(p, '05a-inventur' + sfx);
    await L.tap(p, '#app [data-act="phInvNext"]'); await L.shot(p, '05b-zaehlen' + sfx); await L.tap(p, '#phSheet .hy-x');
    await p.evaluate(() => { S.invDraft = null; save(); });
    await L.tap(p, '.bottom [data-ph="mehr"]'); await L.tap(p, '#app [data-tab="cards"]'); await L.shot(p, '06a-rezepte' + sfx);
    await p.evaluate(() => { [...document.querySelectorAll('#app [data-act="openCard"]')].find(x => /Kaiserschmarrn/.test(x.textContent)).click(); }); await p.waitForTimeout(300); await L.tap(p, '#app [data-act="rzN"][data-id="5"]'); await L.shot(p, '06-rezept' + sfx);
    await L.tap(p, '.bottom [data-ph="mehr"]'); await L.tap(p, '#app [data-act="goStock"][data-id="bestand"]'); await L.shot(p, '08-bestand' + sfx);
    await p.context().close();
  }
  const {p} = await L.open(b, L.SE); await L.shot(p, '01-heute-se');
  await L.tap(p, '.bottom [data-ph="mehr"]'); await L.shot(p, '07-mehr-se');
  const e = await L.open(b, {...L.IP13, at:[2026, 11, 12, 19, 30]}); await L.shot(e.p, '01-heute-abend');
  console.log('errors', JSON.stringify(p.errs.concat(e.p.errs)));
  await b.close(); })();
