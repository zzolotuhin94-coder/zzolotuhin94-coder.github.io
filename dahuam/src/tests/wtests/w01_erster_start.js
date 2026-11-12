// Erster Start: Willkommensseite einmal je Gerät, statt des früheren Rundgang-Angebots; Chef ohne Rollenfrage; wieder öffnen aus Einstellungen und Suche.
const L = require('./lib');
(async () => { const b = await L.launch(); const errs = [];
  // ---------- frisches Gerät, ohne ?nointro ----------
  { const c = await L.ctx(b); const p = await L.page(c, 'index.html?fresh=1'); await p.waitForTimeout(700);
    const w = await L.wl(p);
    L.ok(!!w, 'frisches Gerät: die Willkommensseite ist offen');
    const s = await p.evaluate(() => ({toast:document.querySelector('#toast').classList.contains('show') ? document.querySelector('#toast').textContent : '', gd:!!document.querySelector('#gd'), dlg:!!document.querySelector('dialog[open]'), n:document.querySelectorAll('#wl').length, modal:document.getElementById('wl').getAttribute('aria-modal'), focus:document.activeElement && document.activeElement.id}));
    L.ok(!/Rundgang/.test(s.toast) && !s.gd && !s.dlg && s.n === 1, 'nur eine Aufforderung: kein Rundgang-Angebot als Zeile, kein Fenster, kein Rundgang', s);
    L.ok(s.modal === 'true' && s.focus === 'wlT', 'als Dialog ausgezeichnet, der Fokus steht auf der Überschrift', s);
    L.ok(w.for === 'Für DAHUAM.202' && w.text === 'Damit Küche, Karte und Einkauf an einem Ort sind.' && w.from === '', 'Widmung ohne Eintrag: „Für DAHUAM.202“ und der Satz ohne Namen, keine Absenderzeile', [w.for, w.text, w.from]);
    L.ok(/Beispiele ansehen/.test(w.txt) && /Eigene Daten/.test(w.txt) && /Aufs Handy/.test(w.txt) && /bleiben auf diesem Gerät/.test(w.txt) && /Jedes Gerät hat seine eigenen Daten/.test(w.txt) && /Sicherung/.test(w.txt), 'drei Schritte und die Zeile zu Daten und Sicherung');
    L.ok(w.btns.join('|') === 'Los geht’s|Kurzer Rundgang' && await p.evaluate(() => document.querySelectorAll('#wl .btn.primary').length) === 1, 'ein Hauptknopf „Los geht’s“, daneben „Kurzer Rundgang“', w.btns);
    L.ok(!/\b(Chef|Team|Rolle|Rollen)\b/.test(w.txt), 'keine Rede von Rollen');
    L.ok(await p.evaluate(() => S.settings.currentUser === 'u_chef' && me().role === 'chef' && canEditAll()), 'frisches Gerät: man ist Chef, ohne etwas zu wählen');
    L.ok(await p.evaluate(() => getComputedStyle(document.documentElement).overflow === 'hidden' || getComputedStyle(document.body).overflow === 'hidden'), 'die App dahinter scrollt nicht mit');
    // Escape-freie Wege: Tab bleibt in der Seite
    for(let i = 0; i < 12; i++) await p.keyboard.press('Tab');
    L.ok(await p.evaluate(() => !!document.activeElement.closest('#wl')), 'Tab bleibt in der Willkommensseite');
    await p.click('#wl [data-wl="go"]'); await p.waitForTimeout(250);
    L.ok(await p.evaluate(() => !document.getElementById('wl') && view.tab === 'dash' && localStorage.getItem(KEY + '_welcome') === '1' && !document.documentElement.classList.contains('wl-on')), '„Los geht’s“: zu, auf „Heute“, gemerkt');
    await p.reload(); await L.ready(p); await p.waitForTimeout(700);
    L.ok(!(await L.wl(p)) && !/Rundgang/.test(await L.toast(p)), 'nach dem Neuladen: keine Willkommensseite und kein Rundgang-Angebot mehr');
    // wieder öffnen: Einstellungen › Hilfe
    await p.evaluate(() => go('setup')); await p.waitForTimeout(200);
    L.ok(await p.evaluate(() => [...document.querySelectorAll('#app .gd-panel .gd-r-t b')].map(x => x.textContent).join('|')) === 'Willkommen|Rundgang|Was ist das?|Anleitung als PDF|Einrichtung', 'Einstellungen › Hilfe: Willkommen, Rundgang, Was ist das?, Anleitung als PDF, Einrichtung');
    await p.click('#app .gd-panel [data-act="wlOpen"]'); await p.waitForTimeout(250);
    L.ok(!!(await L.wl(p)), '„Willkommen“ in den Einstellungen öffnet die Seite wieder');
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    L.ok(await p.evaluate(() => !document.getElementById('wl') && view.tab === 'setup'), 'Esc schließt sie, man bleibt, wo man war');
    // Suche
    const pal = await p.evaluate(() => palData().filter(x => x.g === 'Aktion').map(x => x.n));
    L.ok(pal.includes('Willkommen') && pal.includes('Anleitung als PDF') && pal.includes('Rundgang starten'), 'Schnellsuche: Willkommen, Anleitung als PDF, Rundgang', pal);
    await p.evaluate(() => palData().find(x => x.n === 'Willkommen').run()); await p.waitForTimeout(200);
    L.ok(!!(await L.wl(p)), 'Suche › Willkommen öffnet die Seite');
    // Links in der Seite
    await p.click('#wl [data-wl="daten"]'); await p.waitForTimeout(300);
    L.ok(await p.evaluate(() => view.tab === 'daten' && !document.getElementById('wl') && location.hash === '#einstellungen/eigene-daten'), '„Eigene Daten öffnen“ führt zu Einstellungen › Eigene Daten');
    await p.evaluate(() => wlOpen()); await p.waitForTimeout(150); await p.click('#wl [data-wl="backup"]'); await p.waitForTimeout(300);
    L.ok(await p.evaluate(() => view.tab === 'setup' && document.activeElement && document.activeElement.dataset.act === 'export'), '„Sicherung“ führt zu Einstellungen › Sicherung, der Knopf „Sicherung erstellen“ hat den Fokus');
    errs.push(...p.errs); await c.close(); }
  // ---------- „Kurzer Rundgang“ aus der Willkommensseite ----------
  { const c = await L.ctx(b, {vp:L.PHONE, ctx:{isMobile:true, hasTouch:true}}); const p = await L.page(c, 'index.html?fresh=1'); await p.waitForTimeout(700);
    await p.click('#wl [data-wl="tour"]'); await p.waitForTimeout(900);
    L.ok(await p.evaluate(() => !document.getElementById('wl') && !!GD.t && GD.t.i === 0 && document.querySelectorAll('#gd').length === 1), '„Kurzer Rundgang“: Seite zu, Rundgang bei Schritt 1');
    L.ok(!/Rundgang/.test(await L.toast(p)), 'dabei keine zusätzliche Zeile');
    await p.keyboard.press('Escape'); await p.reload(); await L.ready(p); await p.waitForTimeout(700);
    L.ok(!(await L.wl(p)) && await p.evaluate(() => !GD.t), 'danach beim nächsten Start nichts mehr');
    errs.push(...p.errs); await c.close(); }
  // ---------- ?nointro: nie (Tests und Vorführung) ----------
  { const c = await L.ctx(b); const p = await L.page(c, 'index.html?nointro&fresh=1'); await p.waitForTimeout(800);
    L.ok(!(await L.wl(p)) && await p.evaluate(() => !document.querySelector('dialog[open]') && !GD.t), '?nointro: keine Willkommensseite');
    errs.push(...p.errs); await c.close(); }
  // ---------- ein Gerät, auf dem der Rundgang schon angeboten wurde (bisherige Nutzer): keine Willkommensseite ----------
  { const c = await L.ctx(b, {init:() => { try { if(!sessionStorage.getItem('w1')){ sessionStorage.setItem('w1', '1'); localStorage.setItem('dahuam202_kueche_de_v1_guide', JSON.stringify({asked:1, tour:0})); } } catch(e){} }}); const p = await L.page(c, 'index.html'); await p.waitForTimeout(800);
    L.ok(!(await L.wl(p)), 'Gerät, auf dem der Rundgang schon angeboten wurde: keine Willkommensseite (sie bleibt über Einstellungen erreichbar)');
    errs.push(...p.errs); await c.close(); }
  await L.done(b, errs);
})();
