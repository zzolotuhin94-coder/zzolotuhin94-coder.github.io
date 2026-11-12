// Einstellungen: Sicherung oben, ein Name („Sicherung speichern“), Fotos standardmäßig dabei mit Größe; Anzeige; Selteneres unter „Weitere Einstellungen“.
const L = require('./lib');
(async () => { const b = await L.launch(); const errs = [];
  { const {p} = await L.open(b, L.PHONE); const ev = (f, a) => p.evaluate(f, a); const w = ms => p.waitForTimeout(ms);
    await L.go(p, 'einstellungen');
    const s = await ev(() => ({order:[...document.querySelectorAll('#app > .setup-grid > .panel .panel-h h2')].map(x => x.textContent), more:document.querySelector('#app details.setup-more > summary').textContent, inMore:[...document.querySelectorAll('#app details.setup-more .panel-h h2')].map(x => x.textContent), gift:!!document.querySelector('#app details.setup-more #setupGift'),
      names:[...document.querySelectorAll('#app button')].map(x => x.textContent.trim()).filter(t => /^Sicherung/.test(t)), erst:/Sicherung erstellen/.test(document.querySelector('#app').innerText), reset:!!document.querySelector('#app details.setup-more [data-act="reset"]')}));
    L.ok(s.order[0] === 'Sicherung' && s.order[1] === 'Anzeige', 'Sicherung steht ganz oben, gleich danach „Anzeige“', s.order);
    L.ok(s.names.join('|') === 'Sicherung speichern|Sicherung laden' && !s.erst, 'ein Name für die Sicherung: „Sicherung speichern“ (kein zweiter Knopf „Sicherung erstellen“)', s.names);
    L.ok(s.more === 'Weitere Einstellungen' && s.inMore.includes('Cloud') && s.gift && s.reset, 'Cloud, Widmung mit Geschenk-Link und „Beispieldaten wiederherstellen“ liegen ruhig unter „Weitere Einstellungen“', s);
    await L.shot(p, 'nachher-setup_phone');
    // Fotos: standardmäßig dabei, mit Größe
    await ev(() => { IMG.img_t1 = 'data:image/jpeg;base64,' + 'A'.repeat(300000); S.cards[0].img = 'img_t1'; save(); render(); });
    await p.click('#app [data-act="export"]'); await w(250);
    const d = await ev(() => ({t:document.querySelector('#dlgForm h3').textContent, on:document.querySelector('#expImg').checked, lab:document.querySelector('#expImg').closest('label') ? document.querySelector('#expImg').closest('label').textContent.trim() : '', size:document.querySelector('#expSize').textContent}));
    L.ok(d.t === 'Sicherung speichern' && d.on && /^Fotos einschließen \(1 Foto, etwa 29\d KB\)$/.test(d.lab) && /^Datei etwa \d/.test(d.size), 'Dialog „Sicherung speichern“: Fotos sind eingeschlossen, mit Größe', d);
    await p.click('#expImg + span', {force:true}).catch(() => {}); await ev(() => { const c = document.querySelector('#expImg'); if(c.checked){ c.checked = false; c.dispatchEvent(new Event('change')); } }); await w(100);
    L.ok(/ohne Fotos/.test(await L.txt(p, '#expSize')), 'ohne Fotos steht es auch so da');
    await ev(() => { const c = document.querySelector('#expImg'); c.checked = true; c.dispatchEvent(new Event('change')); });
    const f = await L.dl(p, () => p.click('#dlBtn')); const bk = JSON.parse(require('fs').readFileSync(f.file, 'utf8'));
    L.ok(/^dahuam202-kueche-2026-11-12\.json$/.test(f.name) && bk.images && bk.images.img_t1 && bk.schema, 'die Datei enthält die Fotos', f.name);
    await ev(() => document.querySelector('#dlg').close());
    // Design
    await p.click('#setupAnzeige [data-act="ansTheme"][data-id="dark"]'); await w(150);
    L.ok(await ev(() => document.documentElement.dataset.theme === 'dark'), 'Anzeige › Design: Dunkel');
    await p.click('#setupAnzeige [data-act="ansTheme"][data-id="auto"]'); await w(150);
    L.ok(await ev(() => !document.documentElement.dataset.theme && document.querySelector('#setupAnzeige [data-act="ansTheme"].on').dataset.id === 'auto'), '„Wie das Gerät“ nimmt die Wahl wieder zurück');
    // Team: Sicherung bleibt erlaubt
    await L.team(p); await L.go(p, 'einstellungen'); L.ok(await ev(() => !document.querySelector('#app [data-act="export"]').disabled && !document.querySelector('#setupAnzeige [data-act="ansFz"]').disabled), 'auch das Team darf sichern und die Schrift einstellen');
    errs.push(...p.errs); await p.context().close(); }
  await L.done(b, errs);
})();
