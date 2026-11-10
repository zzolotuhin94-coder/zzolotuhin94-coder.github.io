// Bilder der neuen Oberfläche (Paket A) zur Sichtprüfung
const L = require('./lib');
(async () => { const b = await L.launch();
  for(const [tag, vp, mobile] of [['d', {width:1280, height:860}, false], ['m', {width:390, height:800}, true]]){
    const c = await L.ctx(b, {vp, ctx:{isMobile:mobile, hasTouch:mobile, deviceScaleFactor:mobile ? 2 : 1}}); const p = await L.page(c);
    await p.evaluate(() => { S.demo = false; S.settings.name = 'DAHUAM.202'; save(); }); await L.idle(p);
    await p.evaluate(async () => { for(let n = 9; n >= 1; n--) await __store.snapPut('auto', '', {u:Object.fromEntries(__store.unitsOf(S))}, 100 + n, Date.now() - n*864e5 - 3e6); localStorage.setItem(KEY + '_lastBackup', new Date(Date.now() - 9*864e5).toISOString()); go('dash'); });
    await p.waitForTimeout(400); await p.screenshot({path:`shots/${tag}-heute.png`});
    await p.evaluate(() => go('setup')); await p.waitForTimeout(600); await p.locator('#relPanel').scrollIntoViewIfNeeded(); await p.waitForTimeout(200); await p.screenshot({path:`shots/${tag}-einstellungen.png`});
    await p.evaluate(() => { __store.st.error = {kind:'quota', text:'der Speicher dieses Browsers ist voll'}; REL.update = true; relBars(); relInd(); window.scrollTo(0, 0); go('menu'); }); await p.waitForTimeout(300); await p.screenshot({path:`shots/${tag}-fehler.png`});
    await p.evaluate(() => { __store.st.error = null; REL.update = false; relBars(); relInd(); });
    const p2 = await L.page(c); await p2.waitForTimeout(500); await p2.screenshot({path:`shots/${tag}-zweites-fenster.png`}); await p2.close();
    await p.evaluate(async () => { const d = JSON.parse(JSON.stringify(S)); await __store.replace(d); await new Promise(r => { const q = indexedDB.open('dahuam202_daten'); q.onsuccess = () => { const t = q.result.transaction('units', 'readwrite'); t.objectStore('units').put('{"kaputt', 'menu'); t.oncomplete = r; }; }); });
    await p.reload(); await L.ready(p); await p.waitForTimeout(300); await p.screenshot({path:`shots/${tag}-wiederherstellung.png`, fullPage:true});
    await c.close(); }
  await b.close(); })();
