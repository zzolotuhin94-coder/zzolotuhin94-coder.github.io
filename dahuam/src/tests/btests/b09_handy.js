// Handy 390 px: jede Seite und jeder Reiter genau 390 breit. „Heute“: keine Schrift unter 13 px, Zeilen mindestens 40 px.
const L = require('./lib');
(async () => { const b = await L.launch();
  for(const [name, dark] of [['hell', false], ['dunkel', true]]){
    const {p} = await L.open(b, {...L.PHONE, init: dark ? () => { try { localStorage.setItem('dahuam202_kueche_de_v1_theme', 'dark'); } catch(e){} } : undefined});
    const wide = []; for(const h of L.SCREENS){ await L.go(p, h); await p.waitForTimeout(120); const w = await p.evaluate(() => document.documentElement.scrollWidth); if(w !== 390) wide.push(h + ':' + w); }
    // dazu die Unter-Zustände
    await p.evaluate(() => go('cards', 'dish_schnitzel_pork')); await p.waitForTimeout(250); if(await p.evaluate(() => document.documentElement.scrollWidth) !== 390) wide.push('rezeptur');
    await L.go(p, 'ware/bestellen'); await p.click('#app [data-act="phOrd"]'); await p.waitForTimeout(250); /* Handy: die Bestellung öffnet als Blatt (phone.js) */ if(await p.evaluate(() => document.documentElement.scrollWidth) !== 390) wide.push('bestellung');
    await p.evaluate(() => { phSheetClose(true); view.order = null; view.recv = null; pcStart(); }); await p.waitForTimeout(250); if(await p.evaluate(() => document.documentElement.scrollWidth) !== 390) wide.push('preis-check');
    await p.evaluate(() => { view.rp.tab = 'import'; go('report'); }); await p.waitForTimeout(250); if(await p.evaluate(() => document.documentElement.scrollWidth) !== 390) wide.push('kasse importieren');
    await L.go(p, 'checklisten'); await p.click('#app .ck-l'); await p.waitForTimeout(250); if(await p.evaluate(() => document.documentElement.scrollWidth) !== 390) wide.push('checkliste');
    for(const h of ['speisekarte','rezepte','ware/bestand','ware/preise','team/dienstplan','team/auswertung','einstellungen']){ await L.go(p, h); await p.evaluate(() => document.querySelectorAll('#app details.more').forEach(d => { d.open = true; })); await p.waitForTimeout(80); if(await p.evaluate(() => document.documentElement.scrollWidth) !== 390) wide.push(h + ' + Mehr Optionen'); }
    L.ok(wide.length === 0, `${name}: alle ${L.SCREENS.length} Seiten und Reiter, die Unter-Seiten und „Mehr Optionen“ sind genau 390 px breit`, wide);
    await L.go(p, 'heute');
    const dash = await p.evaluate(() => { const small = [], low = []; const w = document.createTreeWalker(document.querySelector('#app'), NodeFilter.SHOW_TEXT); let n; while((n = w.nextNode())){ if(!n.nodeValue.trim()) continue; const e = n.parentElement; if(!e.getClientRects().length) continue; const fs = parseFloat(getComputedStyle(e).fontSize); if(fs < 12.99) small.push(e.className + ':' + fs + ':' + n.nodeValue.trim().slice(0, 20)); }
      document.querySelectorAll('#app .rw, #app .line-btn, #app .hy-row').forEach(r => { const h = r.getBoundingClientRect().height; if(h && h < 40) low.push(r.className + ':' + Math.round(h)); });
      document.querySelectorAll('#app button').forEach(x => { const r = x.getBoundingClientRect(); if(r.height && r.height < 40) low.push('btn ' + x.textContent.trim().slice(0, 14) + ':' + Math.round(r.height)); });
      return {small:[...new Set(small)].slice(0, 8), low:[...new Set(low)].slice(0, 8), rows:document.querySelectorAll('#app .hy-row').length,   /* Handy: Heute besteht aus den Zeilen der Tafel */ top:document.querySelector('#app .page-h [data-act="moveDlg"]')}; });
    L.ok(dash.rows > 5 && dash.small.length === 0, `${name}: Heute, kein Text unter 13 px`, dash.small);
    L.ok(dash.low.length === 0, `${name}: Heute, Zeilen und Knöpfe mindestens 40 px hoch`, dash.low);
    // Handy: die Reiter von „Ware“ gibt es hier nicht mehr (Ziele unter „Mehr“), dafür einen Zurück-Knopf
    await L.go(p, 'ware/buchungen'); L.ok(await p.evaluate(() => { const tb = document.querySelector('#app .toolbar.tabs'); const bk = document.querySelector('#app .hy-back'); return (!tb || getComputedStyle(tb).display === 'none') && !!bk && bk.getBoundingClientRect().height >= 44; }), `${name}: „Buchungen“ ohne Reiterzeile, mit Zurück-Knopf (44 px)`);
    await p.context().close(); if(dark) await L.done(b, p.errs); else if(p.errs.length) console.log('errors hell', p.errs);
  }
})();
