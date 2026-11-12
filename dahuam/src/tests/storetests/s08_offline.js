// Offline: nach dem ersten Besuch startet die App ohne Netz, mit Schriften, PDF-Export und Excel-Import. Installierbar.
const L = require('./lib'); const fs = require('fs'); const path = require('path');
(async () => { const b = await L.launch(); const errs = [];
  const c = await L.ctx(b, {sw:true}); const p = await L.page(c);
  await p.evaluate(() => navigator.serviceWorker.ready); await p.waitForFunction(() => navigator.serviceWorker.controller, null, {timeout:20000});
  const info = await p.evaluate(async () => { const keys = await caches.keys(); const c = await caches.open(keys.find(k => k !== 'dahuam202-laufzeit')); const reqs = await c.keys(); let bytes = 0; for(const r of reqs){ const x = await c.match(r); bytes += (await x.arrayBuffer()).byteLength; }
    return {keys, n:reqs.length, bytes, build:APP_BUILD, manifest:document.querySelector('link[rel=manifest]') && document.querySelector('link[rel=manifest]').getAttribute('href'), apple:document.querySelector('link[rel=apple-touch-icon]').getAttribute('href')}; });
  L.ok(info.keys.includes('dahuam202-' + info.build), 'Service Worker aktiv, Cache trägt die Build-Kennung der Seite', info.keys);
  console.log(`  info  Offline-Paket: ${info.n} Dateien, ${(info.bytes/1e6).toFixed(2)} MB`);
  const man = await p.evaluate(async () => { const m = await (await fetch('manifest.webmanifest')).json(); const sizes = []; for(const i of m.icons){ const im = new Image(); im.src = i.src; await im.decode(); sizes.push(i.purpose + ' ' + im.naturalWidth + 'x' + im.naturalHeight + (i.sizes === im.naturalWidth + 'x' + im.naturalHeight ? '' : ' ≠ ' + i.sizes)); } const a = new Image(); a.src = 'icons/apple-touch-icon.png'; await a.decode(); return {name:m.name, short:m.short_name, display:m.display, start:m.start_url, scope:m.scope, theme:m.theme_color, bg:m.background_color, sizes, apple:a.naturalWidth}; });
  L.ok(man.name === 'DAHUAM.202 Küche' && man.display === 'standalone' && man.scope === './' && man.sizes.join() === 'any 192x192,any 512x512,maskable 192x192,maskable 512x512' && man.apple === 180, 'Manifest: Name, eigenständiges Fenster, Symbole 192/512 normal und maskierbar, Apple-Symbol 180', man);
  L.ok(info.manifest === 'manifest.webmanifest' && info.apple === 'icons/apple-touch-icon.png', 'Seite verweist auf Manifest und Apple-Symbol');
  await p.evaluate(() => { S.settings.name = 'Offline-Test'; save(); }); await L.idle(p);
  // ---- Netz aus ----
  await c.setOffline(true);
  await p.reload(); await L.ready(p);
  L.ok(await p.evaluate(() => S.settings.name === 'Offline-Test' && S.menu.length > 50 && !!document.querySelector('#app h1')), 'ohne Netz neu laden: App startet mit den Daten (früher: ERR_INTERNET_DISCONNECTED)');
  for(const t of await p.evaluate(() => TABS.map(t => t[0]))){ await p.evaluate(t => go(t), t); await p.waitForTimeout(60); }
  await p.evaluate(() => { view.mtab = 'guest'; go('menu'); }); await p.waitForTimeout(800);
  for(const st of ['schlicht', 'alpin', 'elegant', 'kreide', 'getraenke', 'haus']){ await p.click(`#gsRail [data-gs="look"][data-id="${st}"]`); await p.waitForFunction(() => gsReadyNow(gsFx(gsDoc(), gsState().cur)) && !GS.pend); await p.waitForTimeout(250); }   // alle Vorlagen des Gestalters: Schriften und Hintergründe müssen ohne Netz da sein
  await p.evaluate(() => { const el = document.createElement('div'); el.innerHTML = tageskarteHtml(S.specials[0]); document.body.appendChild(el); }); await p.waitForTimeout(300);   // Tageskarten-Blatt (Schibsted Grotesk)
  await p.evaluate(() => { printOrder = printOrder; const el = document.createElement('pre'); el.style.font = "12pt 'JetBrains Mono',monospace"; el.textContent = 'Bestellung'; document.body.appendChild(el); }); await p.waitForTimeout(400);
  const fonts = await p.evaluate(async () => { await document.fonts.ready; const st = {}; for(const f of document.fonts){ const k = f.family.replace(/"/g, ''); st[k] = st[k] || new Set(); st[k].add(f.status); } return Object.fromEntries(Object.entries(st).map(([k, v]) => [k, [...v].join('/')])); });
  const need = ['Figtree', 'Barlow Condensed', 'Fraunces', 'Caveat', 'Cormorant Garamond', 'Schibsted Grotesk', 'Source Serif 4', 'JetBrains Mono'];   // PT Sans, Saira Condensed und Roboto Condensed gehörten zur früheren Ansicht „Schlicht“ und sind entfernt
  L.ok(need.every(f => /loaded/.test(fonts[f] || '')) && !Object.values(fonts).some(v => /error/.test(v)), 'ohne Netz: alle 8 Schriftfamilien aus dem eigenen Ordner geladen, keine fehlgeschlagen', fonts);
  L.ok(await p.evaluate(() => [...document.images].filter(i => i.src && !i.src.startsWith('data:') && !i.src.startsWith('blob:')).every(i => i.complete && i.naturalWidth > 0)), 'ohne Netz: Bilder der Gästekarte da');
  // PDF ohne Netz
  await p.evaluate(() => { const c = S.cards.find(x => x.type === 'dish'); go('cards', c.id); }); await p.waitForTimeout(300);
  const [dl] = await Promise.all([p.waitForEvent('download', {timeout:60000}), p.click('#app [data-pdf="printCard"]')]);
  const pdf = fs.readFileSync(await dl.path()); L.ok(pdf.slice(0, 5).toString() === '%PDF-' && pdf.length > 20000 && /\.pdf$/.test(dl.suggestedFilename()), `ohne Netz: Rezeptur als PDF gespeichert (${Math.round(pdf.length/1024)} KB)`, dl.suggestedFilename());
  L.ok(await p.evaluate(() => [...document.scripts].filter(s => s.src).map(s => s.src.replace(location.origin, '')).join()) === '/dahuam/vendor/html2canvas.min.js,/dahuam/vendor/jspdf.umd.min.js', 'PDF-Bibliotheken kamen aus dem eigenen Ordner');
  // Excel ohne Netz (Kassendatei und Preisliste)
  const XLSX = require(path.join('/home/user/wt-1/dahuam/vendor/xlsx.full.min.js'));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Artikel', 'Einheit', 'Preis'], ['Mehl glatt', 'kg', 1.11], ['Butter', 'kg', 9.99]]), 'Preise'); const xf = __dirname + '/tmp_preise.xlsx'; fs.writeFileSync(xf, Buffer.from(XLSX.write(wb, {type:'array', bookType:'xlsx'})));
  await p.evaluate(() => { go('products'); plDialog(); }); await p.waitForTimeout(300); await p.setInputFiles('#plFile', xf); await p.waitForTimeout(1500);
  const pl = await p.evaluate(() => ({txt:document.querySelector('#plText').value, out:document.querySelector('#plOut').innerText.replace(/\s+/g, ' ').slice(0, 260) /* D1: zwei Beispiel-Artikel mehr stehen vor „Butter“ */, lib:[...document.scripts].some(s => /vendor\/xlsx\.full\.min\.js$/.test(s.src))}));
  L.ok(pl.lib && /Mehl glatt;kg;1[.,]11/.test(pl.txt) && /Butter/.test(pl.out), 'ohne Netz: Excel-Preisliste gelesen, Vorschau zeigt die Zeilen', pl);
  await p.evaluate(() => document.querySelector('#dlg').close()); fs.unlinkSync(xf);
  L.ok(await p.evaluate(() => { go('setup'); return new Promise(r => setTimeout(() => r(document.querySelector('#relOff').textContent), 300)); }) === 'ja', 'Einstellungen: „Ohne Internet nutzbar: ja“');
  await p.evaluate(() => { S.settings.target = 29; save(); }); await p.reload(); await L.ready(p); L.ok(await p.evaluate(() => S.settings.target) === 29, 'ohne Netz arbeiten und speichern geht');
  errs.push(...p.errs); await c.close();

  // ---- erster Start: nur eigene Adresse, nichts blockiert das Bild ----
  { const c2 = await L.ctx(b); const reqs = []; c2.on('request', r => reqs.push(r.url())); const p2 = await L.page(c2); await p2.waitForTimeout(1500);
    const hosts = [...new Set(reqs.map(u => new URL(u).host))];
    L.ok(hosts.length === 1 && c2.ext.length === 0, 'Start: Anfragen nur an die eigene Adresse, keine an Dritte', hosts);
    L.ok(await p2.evaluate(() => !document.querySelector('link[rel=stylesheet]') && !document.querySelector('link[rel=preconnect]') && [...document.scripts].every(s => !s.src)), 'keine fremden Stylesheets oder Skripte in der Seite');
    L.ok(reqs.filter(u => /\.woff2$/.test(u)).length >= 2 && reqs.filter(u => /\.woff2$/.test(u)).every(u => /\/dahuam\/vendor\/fonts\//.test(u)), 'Schriften kommen aus vendor/fonts', reqs.filter(u => /\.woff2$/.test(u)).length);
    errs.push(...p2.errs); await c2.close(); }
  { // Schriftdateien fehlen/hängen: Seite erscheint sofort mit Systemschrift
    const c3 = await L.ctx(b); await c3.route('**/vendor/fonts/**', () => {}); const p3 = await c3.newPage(); const t0 = Date.now(); await p3.goto(L.URL, {waitUntil:'commit'}); await p3.waitForFunction(() => !document.documentElement.classList.contains('booting') && !!document.querySelector('#app h1')); const dt = Date.now() - t0;
    L.ok(dt < 3000 && await p3.evaluate(() => getComputedStyle(document.querySelector('#app h1')).visibility === 'visible' && document.querySelector('#app h1').offsetWidth > 0), `Schriftdateien hängen: App ist trotzdem nach ${dt} ms da (früher über 30 s weiß)`);
    await c3.close(); }
  await L.done(b, errs); })();
