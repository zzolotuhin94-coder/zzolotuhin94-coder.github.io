// XSS-Durchlauf der technischen Prüfung (t07), erweitert um Import-Vorschauen (Preisliste, Kassendatei) und die neuen Seiten aus Paket A.
const {open} = require('../review-technik/lib'); const fs = require('fs'); const L = require('./lib');
(async()=>{
  const {browser, page, errors} = await open({url:L.BASE + 'index.html'});
  page.on('dialog', d => d.dismiss().catch(()=>{}));
  const prep = await page.evaluate(() => {
    window.__hits = {}; window.__step=''; window.__x = n => { (window.__hits[n] = window.__hits[n]||[]).push(window.__step); };
    const SKIPK = new Set(['id','pid','ref','type','status','unit','role','area','when','supplier','card','img','user','currentUser','channel','mode','style','guestStyle','loc','veg','cover','photo','createdBy','sentBy','checkedBy','color','from','to','date','alg','t0']);
    const map = new Map(); const paths = []; let n = 0;
    const walk = (o, path) => { if(Array.isArray(o)) o.forEach((v,i) => { if(typeof v === 'string') o[i] = rep(v, path+'[]', null); else if(v && typeof v === 'object') walk(v, path+'[]'); });
      else for(const k of Object.keys(o)){ const v = o[k]; if(typeof v === 'string') o[k] = rep(v, path+'.'+k, k); else if(v && typeof v === 'object') walk(v, path+'.'+(/^\d{4}-\d\d|^[a-z]+_[a-z0-9_]+$/.test(k)?'*':k)); } };
    const rep = (v, path, k) => { if(k === 't' && /abs/.test(path)) return v; if(k && SKIPK.has(k) && !(k==='t' )) return v; if(!v || /^\d{4}-\d\d-\d\d/.test(v) || /^\d\d:\d\d$/.test(v) || /^[a-z0-9_:.#-]+$/.test(v) || /^[A-Z]( [A-Z])*$/.test(v) || /^data:|^https?:|^\+?[\d ]+$/.test(v)) return v;
      if(map.has(v)) return map.get(v); const i = n++; paths[i] = path + ' = ' + v.slice(0,30); const p = `Z${i}"'><img src=x onerror=__x(${i})>`; map.set(v, p); return p; };
    walk(S, 'S');
    return {n, paths};
  });
  
  const visit = await page.evaluate(async () => {
    const log = []; const wait = (ms=120) => new Promise(r => setTimeout(r, ms));
    const T = async (name, f) => { window.__step = name; try { await f(); await wait(); } catch(e){ log.push(name+': EXC '+String(e).slice(0,120)); } };
    for(const [t] of TABS) await T('tab '+t, () => go(t));
    for(const m of ['calc','guest','plan']) await T('menu '+m, () => { view.mtab = m; go('menu'); });
    for(const s of ['bestand','buchungen','inventur']) await T('stock '+s, () => { view.stab = s; go('stock'); });
    for(const s of ['bestellung','lieferanten']) await T('buy '+s, () => { view.stab = s; go('buy'); });
    for(const o of S.orders.slice(0,8)) await T('order', () => { view.stab='bestellung'; view.order = o.id; go('buy'); });
    await T('x', () => { view.order = null; });
    for(const c of S.cards) await T('card', () => go('cards', c.id));
    for(const s of ['sales','import']) await T('rp '+s, () => { view.rp.tab = s; go('report'); });
    for(const s of ['heute','verlauf','listen','vorlagen']) await T('ck '+s, () => { view.ck.tab = s; view.ck.run = null; go('checkl'); });
    for(const tp of S.checks.templates) await T('ckrun', () => { view.ck.tab='heute'; view.ck.run = tp.id; go('checkl'); });
    for(const m of ['week','day','month']) await T('dienst '+m, () => { tmView().mode = m; go('dienst'); });
    const sink = document.createElement('div'); sink.style.cssText = 'position:absolute;left:-9999px'; document.body.appendChild(sink);
    const H = async (name, f) => T(name, () => { sink.innerHTML = f(); });
    await H('guestHtml', () => guestHtml()); await H('guestPrevHtml', () => guestPrevHtml()); for(const k of Object.keys(GS_LOOKS)) await H('Vorlage ' + k, () => { gsState().cur = k; return gsPages({print:true}).join(''); });   // Gestalter: jede Vorlage (früher guestHtmlWeb / guestHtmlHaus)
    gsState().cur = 'haus';
    for(const sp of S.specials) await H('tageskarte', () => tageskarteHtml(sp));
    await H('vbPrint', () => vbPrintHtml(todayStr())); await H('tmPrint', () => tmPrintHtml(tmMonday(todayStr()))); await H('ckPrint', () => ckPrintHtml(todayStr().slice(0,7)));
    await H('tmMonth', () => tmMonthHtml(todayStr().slice(0,7)));
    for(const o of S.orders) await H('orderText', () => `<pre>${esc(orderText(o))}</pre>`);
    const D = async (name, f) => T('dlg '+name, async () => { f(); await wait(150); const d = document.querySelector('#dlg'); if(d && d.open) d.close(); });
    for(const m of S.menu.slice(0,6)) await D('menuDialog', () => menuDialog(m));
    for(const p of S.products.slice(0,6)) await D('prodDialog', () => prodDialog(p));
    await D('moveDlg', () => moveDlg(S.products[0].id)); await D('moveDlg2', () => moveDlg({pid:S.products[0].id, type:'in'})); await D('salesDlg', () => salesDlg());
    for(const sp of S.specials) await D('specialDialog', () => specialDialog(sp));
    for(const sp of S.suppliers) await D('supplierDialog', () => supplierDialog(sp));
    for(const o of S.orders) await D('delayDialog', () => delayDialog(o));
    await D('buyNew', () => buyNewDialog()); await D('priceFix', () => priceFixDialog(S.products.slice(0,5).map(p=>p.id))); await D('plDialog', () => plDialog());
    for(const c of S.cards.slice(0,4)) await D('tellerPick', () => tellerPickDialog(c));
    const D0 = todayStr(), ppl = S.team.people;
    await D('tmWho', () => tmWhoDlg(()=>{})); for(const p of ppl) { await D('tmShift', () => tmShiftDlg(p.id, D0)); await D('tmAbs', () => tmAbsDlg(p.id, D0)); await D('tmWish', () => tmWishDlg(p.id, D0)); }
    for(const [d, arr] of Object.entries(S.team.shifts).slice(0,5)) for(const sh of arr) await D('tmShiftEdit', () => tmShiftDlg(sh.pid, d, sh.id));
    await D('tmTeam', () => tmTeamDlg()); await D('tmTpl', () => tmTplDlg(()=>{})); await D('tmPatterns', () => tmPatternsDlg());
    for(const tp of S.checks.templates) await D('ckTpl', () => ckTplDlg(tp.id));
    await D('export', () => exportData());
    await T('palette', () => { const b = document.querySelector('[data-act="pal"],#palBtn'); palItems = palData(); sink.innerHTML = palItems.map(i => `<div>${esc(i.n)} ${esc(i.s)}</div>`).join(''); });
    for(const [t] of TABS) await T('tab2 '+t, () => go(t));
    // command palette
    await T('pal', () => { sink.innerHTML = ''; const d = palData(); });
    return log;
  });
  // ---- Erweiterung 1: Preislisten-Import (Vorschau und Übernahme) ----
  const PAY = n => `X${n}"'><img src=x onerror=__x(${n})>`;
  const imp = await page.evaluate(async ({a, b, c, d}) => { const wait = ms => new Promise(r => setTimeout(r, ms)); const out = {};
    window.__step = 'Preisliste Vorschau'; go('products'); plDialog(); await wait(150);
    document.querySelector('#plText').value = ['Artikelnr;Artikel;Einheit;Preis;Gebinde', `${a};${b};${c};3,50;${d}`, `77;Mehl glatt;kg;1,20;Sack`, `<svg onload=__x(9004)>;<script>__x(9005)</script>;<b>kg</b>;2,00;x`].join('\n');
    document.querySelector('#plCheck').click(); await wait(250); out.rows = document.querySelectorAll('#plOut .pl-list li').length; out.html = document.querySelector('#plOut').innerHTML.includes('<img src=x');
    window.__step = 'Preisliste übernehmen'; document.querySelectorAll('#plOut select').forEach(s => { s.value = 'new'; }); document.querySelector('#dlgForm button[type=submit]').click(); await wait(300);
    for(const t of ['products', 'stock', 'buy', 'dash', 'pcheck']){ window.__step = 'nach Preisliste ' + t; go(t); await wait(120); }
    out.added = S.products.filter(p => /onerror|<script|<svg/.test(p.name + p.artNo + (p.pack || ''))).length;
    // ---- Erweiterung 2: Kassendatei (Verkäufe), Zuordnung unbekannter Artikel ----
    window.__step = 'Kassendatei'; view.rp.tab = 'import'; go('report'); await wait(150);
    try { const csv = ['Datum;Artikel;Menge;Umsatz', `01.11.2026;${b};3;30,00`, `01.11.2026;<script>__x(9006)</script>;1;5,00`].join('\n'); const f = new File([csv], `kasse${a}.csv`, {type:'text/csv'}); const inp = document.querySelector('#rpFileIn'); if(inp){ const dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; inp.dispatchEvent(new Event('change', {bubbles:true})); await wait(500); } out.kasse = !!inp; } catch(e){ out.kasseErr = String(e).slice(0, 100); }
    for(const s of ['sales', 'import']){ window.__step = 'nach Kassendatei ' + s; view.rp.tab = s; go('report'); await wait(150); }
    const d0 = document.querySelector('#dlg'); if(d0.open) d0.close();
    // ---- Erweiterung 3: neue Seiten aus Paket A (Einstellungen, frühere Stände, Statuszeilen) ----
    window.__step = 'Paket A'; await __store.snapNow('hand', a); await __store.snapPut('auto', b, {raw:JSON.stringify(S)}, 1, Date.now() - 864e5); safetyStore(c);
    localStorage.setItem(KEY + '_lastBackup', a); go('setup'); await wait(500); out.snaps = document.querySelectorAll('#relPanel .rel-snaps li').length;
    __store.st.error = {kind:'other', text:d}; relBars(); await wait(100); __store.st.error = null; relBars();
    go('dash'); await wait(150);
    return out; }, {a:PAY(9000), b:PAY(9001), c:PAY(9002), d:PAY(9003)});
  console.log('import/Paket A:', JSON.stringify(imp));
  await page.waitForTimeout(800);
  const hits = await page.evaluate(() => window.__hits);
  console.log('payload fields:', prep.n, '| executed:', Object.keys(hits).length);
  for(const i of Object.keys(hits)) console.log('  HIT', prep.paths[i], '@', [...new Set(hits[i])].join(', '));
  console.log('visit log:', visit.slice(0,30));
  console.log('page errors:', [...new Set(errors.filter(e=>!/ERR_FAILED|ERR_NAME|net::/.test(e)))].slice(0,10));
  L.ok(prep.n > 400, 'Nutzlast in ' + prep.n + ' Textfeldern des Datenbestands');
  L.ok(imp.rows >= 2 && imp.added >= 2 && imp.kasse && imp.snaps >= 2, 'Import-Vorschauen und neue Seiten wurden mit Nutzlast durchlaufen', imp);
  L.ok(Object.keys(hits).length === 0, 'keine einzige Nutzlast wurde ausgeführt', Object.keys(hits).map(i => (prep.paths[i] || 'Import ' + i) + ' @ ' + [...new Set(hits[i])].join(',')));
  L.ok(visit.length === 0, 'Rundgang ohne Ausnahmen', visit.slice(0, 5));
  await L.done(browser, [...new Set(errors.filter(e => !/ERR_FAILED|ERR_NAME|net::|Failed to load resource/.test(e)))]);
})().catch(e => { console.error('ERR', e); process.exit(1); });
