// Alte Stände laden: vier Rollen werden zwei, alte Gästekarten-Stile werden „Hauskarte“ oder „Schlicht“, entfernte Felder verschwinden still.
const L = require('./lib');
(async () => { const b = await L.launch(); const {p} = await L.open(b);
  // ein Stand, wie ihn Version 1.1 gespeichert hat
  const res = await p.evaluate(() => {
    const old = JSON.parse(JSON.stringify(S));
    old.settings.users = [{id:'u_owner',name:'Inhaber',role:'owner'},{id:'u_chef',name:'Küchenchef',role:'chef'},{id:'u_bar',name:'Bar',role:'bar'},{id:'u_staff',name:'Commis',role:'staff'}];
    old.settings.currentUser = 'u_bar'; old.settings.orderLimit = 800;
    old.settings.guestStyle = 'book'; old.settings.guestStylePick = true;
    Object.values(old.settings.seasons).forEach(s => { s.layout = 'zweispaltig'; s.fd = 'Fraunces'; s.fb = 'Figtree'; s.orn = 'schnee'; });
    old.game = {done:{sup:'2026-01-01'}, started:'2026-01-01', init:true, minit:true, acts:{prices:['a'], alg:[], recipes:[], linked:[], sent:2, recv:1, inv:0, kasse:0, pdf:1, backup:0, sim:0, tour:1, fc:1, prep:3, plan:5, chk:1, dpdf:0}, stamps:{tour:'2026-01-02', fc1:'2026-01-03'}, rq:['prep3']};
    old.orders[0].status = 'approval'; old.orders[0].approvalBy = 'u_chef'; old.orders[0].createdBy = 'u_owner';
    old.team.people[0].user = 'u_owner';
    const acc = old.settings.seasons.winter.accent, from = old.settings.seasons.winter.from, title = old.settings.seasons.winter.title;
    const d = migrate(JSON.parse(JSON.stringify(old)));
    return {users:d.settings.users, cur:d.settings.currentUser, limit:'orderLimit' in d.settings, style:d.settings.guestStyle, pick:'guestStylePick' in d.settings,
      seasonKeys:Object.keys(d.settings.seasons.winter), keep:d.settings.seasons.winter.accent === acc && d.settings.seasons.winter.from === from && d.settings.seasons.winter.title === title,
      game:d.game, ord:{st:d.orders[0].status, by:d.orders[0].createdBy, ap:'approvalBy' in d.orders[0]}, person:d.team.people[0].user,
      counts:[d.menu.length, d.cards.length, d.products.length, d.orders.length] + '' === [old.menu.length, old.cards.length, old.products.length, old.orders.length] + ''};
  });
  L.ok(res.users.length === 2 && res.users[0].role === 'chef' && res.users[0].name === 'Chef' && res.users[1].role === 'team' && res.users[1].name === 'Team', 'vier Standard-Benutzer werden „Chef“ und „Team“', res.users);
  L.ok(res.cur === 'u_staff', 'wer als Bar angemeldet war, ist jetzt Team', res.cur);
  L.ok(!res.limit, 'Freigabe-Limit ist weg');
  L.ok(res.ord.st === 'draft' && !res.ord.ap && res.ord.by === 'u_chef', 'Bestellung „Zur Freigabe“ ist wieder ein Entwurf, der Ersteller bleibt zugeordnet', res.ord);
  L.ok(res.person === 'u_chef', 'Person im Dienstplan bleibt mit ihrem Benutzer verbunden', res.person);
  L.ok(res.style === 'schlicht' && !res.pick, 'gewählter Stil „Buchsatz“ wird „Schlicht“', res.style);
  L.ok(!res.seasonKeys.some(k => ['layout','fd','fb','orn'].includes(k)) && res.keep, 'Layout, Schrift und Ornament je Saison sind weg; Zeitraum, Farbe und Titel bleiben', res.seasonKeys);
  L.ok(JSON.stringify(Object.keys(res.game).sort()) === '["done","init"]' && res.game.done.sup === '2026-01-01', 'Stempel, Aufgaben und Stufen sind weg; der Stand der Einrichtung bleibt', res.game);
  L.ok(res.counts, 'Gerichte, Rezepturen, Produkte und Bestellungen bleiben vollständig');
  // die anderen Stil-Fälle
  const styles = await p.evaluate(() => { const f = (st, pick) => { const o = JSON.parse(JSON.stringify(S)); if(st === undefined) delete o.settings.guestStyle; else o.settings.guestStyle = st; if(pick) o.settings.guestStylePick = true; else delete o.settings.guestStylePick; return migrate(o).settings.guestStyle; };
    return [f('web', true), f('web', false), f(undefined, false), f('haus', true), f('book', false), f('schlicht', false), f('irgendwas', true)]; });
  L.ok(styles.join() === 'schlicht,haus,haus,haus,haus,schlicht,haus', '„Wie die Website“ (gewählt) → Schlicht; nie gewählt → Hauskarte; Unbekanntes → Hauskarte', styles);
  // eigene Benutzer bleiben, nur die Rolle wird umgestellt
  const own = await p.evaluate(() => { const o = JSON.parse(JSON.stringify(S)); o.settings.users = [{id:'x1',name:'Maria',role:'owner'},{id:'x2',name:'Sepp',role:'bar'},{id:'x3',name:'Lena',role:'staff'}]; o.settings.currentUser = 'x2'; const d = migrate(o); return d.settings.users.map(u => u.name + ':' + u.role).join() + '|' + d.settings.currentUser; });
  L.ok(own === 'Maria:chef,Sepp:team,Lena:team|x2', 'eigene Benutzer bleiben mit Namen erhalten', own);
  // der alte Stand läuft wirklich: laden, speichern, neu laden, alle Seiten zeichnen
  await p.evaluate(() => { const old = JSON.parse(JSON.stringify(S)); old.settings.users = [{id:'u_owner',name:'Inhaber',role:'owner'},{id:'u_chef',name:'Küchenchef',role:'chef'},{id:'u_bar',name:'Bar',role:'bar'},{id:'u_staff',name:'Commis',role:'staff'}]; old.settings.currentUser = 'u_owner'; old.settings.guestStyle = 'web'; old.settings.guestStylePick = true; old.game = {done:{}, acts:{prices:[]}, stamps:{a:'2026-01-01'}, rq:['x'], minit:true, init:true}; loadBackup(old); });
  await p.waitForTimeout(400); await L.idle(p); await p.reload(); await p.waitForFunction(() => !document.documentElement.classList.contains('booting')); await p.waitForTimeout(300);
  for(const h of L.SCREENS) await L.go(p, h);
  const live = await p.evaluate(() => ({role:me().role, name:me().name, style:hsStyle(), game:Object.keys(S.game).sort().join(), reward:!!document.querySelector('.reward,.gd-rw'), tab:view.tab}));
  L.ok(live.role === 'chef' && live.name === 'Chef' && live.style === 'schlicht' && live.game === 'done,init' && !live.reward, 'geladene alte Sicherung: Chef, Stil Schlicht, keine Belohnung, alle Seiten zeichnen', live);
  // Geräte-Einstellungen von früher stören nicht
  await p.evaluate(() => { localStorage.setItem('dahuam202_kueche_de_v1_views', JSON.stringify({menu:'cards', cards:'compact', buy:'cards', teller:'table'})); localStorage.setItem('dahuam202_kueche_de_v1_guide', JSON.stringify({mode:'simple', asked:1, tour:1, helpSeen:1})); localStorage.setItem('dahuam202_kueche_de_v1_intro', 'plate'); });
  await p.reload(); await p.waitForFunction(() => !document.documentElement.classList.contains('booting')); await p.waitForTimeout(300);
  await L.go(p, 'speisekarte'); const dev = await p.evaluate(() => ({list:!!document.querySelector('#app table.lt-menu'), grid:!!document.querySelector('#app .dish-grid, #app .rc-grid'), simple:document.body.classList.contains('simple'), intro:!!document.getElementById('intro'), vsw:!!document.querySelector('#app .vsw')}));
  L.ok(dev.list && !dev.grid && !dev.simple && !dev.intro && !dev.vsw, 'gemerkte Karten-Ansicht, Einfach-Modus und Startanimation von früher: werden übergangen', dev);
  await L.done(b, p.errs); })();
