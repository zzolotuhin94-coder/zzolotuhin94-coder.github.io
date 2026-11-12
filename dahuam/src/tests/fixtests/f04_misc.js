// Findings 6, 9, 10, 11, 14, 15, 17, 18, 22, 23, 25, 27, 29, 30, 32
const L=require('./lib');const ok=L.ok;const fs=require('fs');
(async()=>{const {b,p,errs,ctx}=await L.open({});const ev=(f,a)=>p.evaluate(f,a);
const toastT=()=>ev(()=>$('#toast').textContent);const dlgText=()=>ev(()=>$('#dlg').open?$('#dlg').innerText.replace(/\s+/g,' '):'');const submit=async()=>{await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(220);};
// ---------- 9 undo ingredient / step
await ev(()=>{setV('teller','teller');go('cards','dish_kaiser')});await p.waitForTimeout(250);
const snap=()=>ev(()=>JSON.stringify([C('dish_kaiser').items,C('dish_kaiser').steps.map(s=>s.t)]));const s0=await snap();
await p.locator('.ti [data-act=delLine]').nth(2).click();await p.waitForTimeout(200);
ok(await snap()!==s0&&/entfernt/.test(await toastT())&&await p.locator('#toast .toast-act').isVisible(),'ingredient delete shows „Rückgängig“',await toastT());
await p.click('#toast .toast-act');await p.waitForTimeout(200);ok(await snap()===s0,'undo restores the ingredient at its place');
await p.locator('[data-act=stepDel]').nth(1).click();await p.waitForTimeout(200);ok(await snap()!==s0&&await p.locator('#toast .toast-act').isVisible(),'step delete shows „Rückgängig“',await toastT());
await p.click('#toast .toast-act');await p.waitForTimeout(200);ok(await snap()===s0,'undo restores the step');
ok(await ev(()=>[...document.querySelectorAll('#app textarea[data-step]')].every(t=>/Schritt \d+/.test(t.getAttribute('aria-label')||''))),'step textareas have aria-labels');
// 27 duplicate ingredient warning, pieces rounded
const n0=await ev(()=>C('dish_kaiser').items.length);
await ev(()=>tellerAdd(C('dish_kaiser'),C('dish_kaiser').items[0].ref,null));await p.waitForTimeout(200);
ok(await ev(()=>C('dish_kaiser').items.length)===n0&&/liegt schon am Teller/.test(await toastT()),'adding an ingredient twice warns instead of duplicating',await toastT());
ok(await ev(()=>document.activeElement.id==='qty-0'),'…and focuses the existing quantity');
await ev(()=>{view.portions=7;render()});ok(await ev(()=>{const li=[...document.querySelectorAll('#prodOut li')].find(l=>/Ei M/.test(l.textContent));return /21 Stk/.test(li.textContent)&&!/genau/.test(li.textContent)}),'whole piece counts stay plain (7 × 3 Ei = 21 Stk)');
await ev(()=>{go('cards','dish_schnitzel_pork')});await p.waitForTimeout(200);
ok(await ev(()=>{const li=[...document.querySelectorAll('#prodOut li')].find(l=>/Ei M/.test(l.textContent));return li?li.textContent:''}).then(t=>/3 Stk/.test(t)&&/genau 2,45/.test(t)),'piece counts rounded up, exact value muted (7 × 0,35 Ei → 3 Stk, genau 2,45)',await ev(()=>[...document.querySelectorAll('#prodOut li')].find(l=>/Ei M/.test(l.textContent))?.textContent));
ok(await ev(()=>/^\d+(,\d)? %$/.test(document.querySelector('.hero-ring b').textContent)),'ring in recipe header: „16,4 %“ with space',await ev(()=>document.querySelector('.hero-ring b').textContent));
// ---------- 27 hash keeps open recipe
ok(await ev(()=>location.hash)==='#rezepte/dish_schnitzel_pork','hash is #rezepte/<id>',await ev(()=>location.hash));
await p.reload();await p.waitForTimeout(800);ok(await ev(()=>view.tab==='cards'&&view.card==='dish_schnitzel_pork'&&!!document.querySelector('.hero')),'reload keeps the open recipe');
await ev(()=>go('cards'));ok(await ev(()=>location.hash)==='#rezepte','list → #rezepte');
// ---------- 10 fresh recipes
const c0=await ev(()=>S.cards.length);const no0=await ev(()=>S.settings.nextNo);
await p.click('[data-act=newCard][data-id=dish]');await p.waitForTimeout(250);ok(await ev(()=>S.cards.length)===c0+1,'+ Rezeptur creates a recipe');
await p.click('[data-act=backCards]');await p.waitForTimeout(250);ok(await ev(()=>S.cards.length)===c0&&await ev(()=>S.settings.nextNo)===no0,'leaving it untouched removes it silently (number reused)');
await ev(()=>document.querySelector('#app [data-act=newCard][data-id=semi]').click());await p.waitForTimeout(250);await ev(()=>go('dash'));ok(await ev(()=>S.cards.length)===c0,'same for + Basisrezept when leaving via the menu');
await ev(()=>go('cards'));await p.click('[data-act=newCard][data-id=dish]');await p.waitForTimeout(250);
await p.fill('#cf-name','Testgericht');await p.keyboard.press('Tab');await p.waitForTimeout(200);await ev(()=>go('cards'));ok(await ev(()=>S.cards.length)===c0+1,'a renamed new recipe is kept');
await ev(()=>{S.cards=S.cards.filter(c=>c.name!=='Testgericht');save()});
// ---------- 22 keyboard rows, 30 palette, 6 labels
for(const [tab,sel] of [['cards','#app tr.row .row-open'],['products','#app tr.row .row-open'],['menu','#app tr.row .row-open']]){await ev(t=>{view.stab='bestand';go(t)},tab);await p.waitForTimeout(250);ok(await p.locator(sel).count()>5,`${tab}: rows have a real button on the name`);}
await ev(()=>{view.stab='bestand';go('stock')});await p.waitForTimeout(200);ok(await p.locator('#app table.stock tr.row .row-open').count()>5,'Lager: rows have a real button');
await ev(()=>go('cards'));await p.waitForTimeout(200);await p.locator('#app tr.row .row-open').first().focus();await p.keyboard.press('Enter');await p.waitForTimeout(250);ok(await ev(()=>!!view.card),'Enter on a focused row opens the recipe');
ok(await ev(()=>{go('menu');return [...document.querySelectorAll('#app input[type=search]')].every(i=>i.getAttribute('aria-label'))}),'search inputs have aria-labels');
await ev(()=>palOpen());await p.fill('#palIn','schn');await p.waitForTimeout(150);
const pal=await ev(()=>palItems.slice(0,6).map(x=>x.n));const ws=pal.map(n=>/(^|[\s„-])schn/i.test(n));ok(/^Wiener Schnitzel · vom/.test(pal.find(x=>/Schnitzel/.test(x)))&&ws[0]&&ws[1]&&ws.slice(ws.indexOf(false)).every(x=>!x),'palette: word-start matches first, variant shown',pal); // fix-3: je Gericht nur ein Treffer, daher stehen weniger Wortanfang-Treffer oben
const ono=await ev(()=>S.orders[2].no);await p.fill('#palIn',ono.slice(-4));await p.waitForTimeout(150);ok(await ev(n=>palItems.some(x=>x.g==='Bestellung'&&x.n===n),ono),'palette finds orders by number',ono);
await p.keyboard.press('Enter');await p.waitForTimeout(250);ok(await ev(()=>view.tab==='buy'&&!!view.order),'…and opens it');
// dialog closes on backdrop click, not when dragging out
await ev(()=>prodDialog(P('pork')));await p.waitForTimeout(150);
const box=await p.locator('#dlgForm [name=name]').boundingBox();await p.mouse.move(box.x+20,box.y+10);await p.mouse.down();await p.mouse.move(5,5);await p.mouse.up();await p.waitForTimeout(150);
ok(await ev(()=>$('#dlg').open),'drag from field to outside keeps the dialog open');
await p.mouse.click(5,5);await p.waitForTimeout(150);ok(!(await ev(()=>$('#dlg').open)),'click on the backdrop closes the dialog');
// ---------- 14/15 Heute & Einkauf agree
for(const [h,m] of [[9,30],[23,30]]){await ev(([h,m])=>{nowMin=()=>h*60+m;go('dash')},[h,m]);await p.waitForTimeout(200);
 const d=await ev(()=>{const t=todayStr();const due=S.suppliers.filter(s=>s.active&&s.orderDays.includes(wd(t)));return {states:due.map(s=>s.name+':'+supToday(s).state),sub:document.querySelector('.page-h .dh-sub').textContent,rows:[...document.querySelectorAll('#app .dh-now > .rows > li')].map(li=>li.matches('.dh-ord:not(.past)')?'Bestellen':li.matches('.rw-fold')?'vorbei':li.matches('.dh-recv')?'Lieferungen prüfen':li.matches('.ek-dash')?'Eigenkontrolle':'sonst'),fold:document.querySelector('.rw-more')?.textContent||''}});
 await ev(()=>{view.stab='bestellung';view.order=null;go('buy')});await p.waitForTimeout(200);
 const e=await ev(()=>[...document.querySelectorAll('.oc')].map(c=>c.querySelector('h3').textContent+':'+c.querySelector('.cd').textContent));
 const agree=d.states.every(s=>{const [n,st]=s.split(':');const c=e.find(x=>x.startsWith(n+':'))||'';return st==='sent'?/heute bestellt/.test(c):st==='past'?/Annahmeschluss vorbei/.test(c):/noch/.test(c)});
 ok(agree,`${h}:${m} Heute and Einkauf show the same supplier state`,[d.states,e]);
 if(h===23){ok(!/offen|bis \d\d:\d\d/.test(d.sub)&&!d.rows.includes('Bestellen'),'after cut-off: Heute does not claim open orders',[d.sub,d.rows]); // fix-3: Heute ohne Bestell-Satz im Kopf, je Lieferant eine Zeile
  ok(/Annahmeschluss vorbei: \d+ Lieferant(en)? · anzeigen/.test(d.fold),'past rows collapsed into one line',d.fold);
  ok(d.rows.indexOf('Lieferungen prüfen')>=0&&d.rows.indexOf('Lieferungen prüfen')<d.rows.indexOf('vorbei'),'actionable „Lieferungen prüfen“ comes first',d.rows);
  await ev(()=>go('dash'));await p.click('.rw-more');await p.waitForTimeout(200);ok(await p.locator('.rw.past:not(.rw-fold)').count()>=1&&/ausblenden/.test(await p.locator('.rw-more').innerText()),'„anzeigen“ expands the past rows');}
 else ok(d.rows.indexOf('Bestellen')>=0&&d.rows.indexOf('Bestellen')<d.rows.indexOf('Eigenkontrolle')&&d.rows.indexOf('Bestellen')<d.rows.indexOf('Lieferungen prüfen'),'before cut-off: open orders first',d.rows);} // fix-3: oben steht die Vorbereitung, dann je offenem Lieferanten eine Zeile
await ev(()=>{view.stab='bestellung';view.order=null;setV('buy','list');go('buy')});await p.waitForTimeout(250);
ok(await ev(()=>[...document.querySelectorAll('.oc .row-btns .btn')].every(b=>{const r=b.getBoundingClientRect(),c=b.closest('.oc').getBoundingClientRect();return r.right<=c.right+1&&r.left>=c.left-1})),'„Wie zuletzt“ not clipped at 1440');
ok(await ev(()=>[...document.querySelectorAll('.lo .tot-l, .olist .tot-l')].length>3&&[...document.querySelectorAll('.tot-l')].every(x=>/bestellt|geliefert/.test(x.textContent))),'order totals labelled bestellt / geliefert');
ok(await ev(()=>document.querySelectorAll('#app [data-act=moveDlg][data-id=in]').length)===1,'„Lieferung ohne Bestellung“ only once');
// ---------- 23 timeline + specials without price
await ev(()=>{S.specials[0].items.push({name:'Gang ohne Preis',desc:'',price:0,veg:'',card:'',alg:''});view.mtab='plan';go('menu')});await p.waitForTimeout(300);
ok(await ev(()=>{const li=[...document.querySelectorAll('.sp-items li')].find(l=>/Gang ohne Preis/.test(l.textContent));return li&&!/€/.test(li.textContent)}),'special item without price prints no „€ 0,00“');
ok(await ev(()=>{const w=document.querySelector('.tline').getBoundingClientRect();const pins=[...document.querySelectorAll('.tl-pin')].map(x=>x.getBoundingClientRect());const inside=pins.every(r=>r.left>=w.left-1&&r.right<=w.right+1);let coll=false;for(let i=0;i<pins.length;i++)for(let j=i+1;j<pins.length;j++){const a=pins[i],c=pins[j];if(a.left<c.right&&c.left<a.right&&a.top<c.bottom&&c.top<a.bottom)coll=true;}return inside&&!coll}),'timeline markers: none cut at the edge, none overlapping');
ok(await ev(()=>{const t=document.querySelector('.tl-today');const lab=t.getBoundingClientRect();const y=lab.top-17;return [...document.querySelectorAll('.tl-months span')].every(s=>s.getBoundingClientRect().bottom<=y+6)}),'„Heute“ label clear of the month names');
// ---------- 17 roles: Chef und Team
await ev(()=>go('setup'));await p.waitForTimeout(200);
ok(await ev(()=>{const w=document.querySelector('#whoami').innerText.replace(/\s+/g,' ').trim();const cards=[...document.querySelectorAll('.who-b')].map(b=>b.innerText.replace(/\s+/g,' '));return w==='Chef'&&cards.length===2&&!cards.some(c=>/(Chef.*Chef|Team.*Team)/.test(c))}),'role shown once (no „Chef · Chef“)',await ev(()=>document.querySelector('#whoami').innerText));
await p.click('.who-b:has-text("Team")');await p.waitForTimeout(250);
ok(/Angemeldet als Team/.test(await toastT()),'switch toast',await toastT());
const ro=async(tab,pre)=>{await ev(pre);await p.waitForTimeout(250);return ev(()=>({note:document.querySelector('.ro-note')?.innerText||'',price:[...document.querySelectorAll('#app input.lt-price')].filter(i=>!i.disabled).length,nprice:document.querySelectorAll('#app input.lt-price').length,btn:[...document.querySelectorAll('#app [data-act=newMenu],#app [data-act=newProd],#app [data-act=newCard],#app [data-act=reset],#app [data-act=importPick],#app [data-act=editMenu],#app [data-act=plImport],#app [data-act=pcStart],#app [data-act=addLine],#app [data-act=delLine],#app [data-act=stepAdd]')].filter(b=>!b.disabled&&!b.hidden&&b.offsetParent).length,inp:[...document.querySelectorAll('#app [data-sf],#app [data-us],#app [data-li],#app [data-cf],#app textarea[data-step]')].filter(i=>!i.disabled).length}));};
let r=await ro('menu',()=>{view.mtab='calc';go('menu')});ok(/Chef/.test(r.note)&&r.nprice>10&&r.price===0&&r.btn===0,'team: Speisekarte read-only with one note',r);
const m0=await ev(()=>S.menu[0].price);await ev(()=>{const i=document.querySelector('input.lt-price');i.disabled=false;i.value='99';i.dispatchEvent(new Event('change',{bubbles:true}))});await p.waitForTimeout(150);ok(await ev(()=>S.menu[0].price)===m0,'team: forced price change is refused');
r=await ro('products',()=>go('products'));ok(/Chef/.test(r.note)&&r.price===0&&r.btn===0,'team: Preise read-only',r);
r=await ro('card',()=>{view.cv='kalk';/* seit Paket D2 öffnet das Team ein Rezept in der Küchen-Ansicht; hier geht es um die Kalkulation */go('cards','dish_kaiser')});ok(/Chef/.test(r.note)&&r.inp===0&&r.btn===0,'team: Rezeptur read-only',r);
r=await ro('setup',()=>go('setup'));ok(/Chef/.test(r.note)&&r.inp===0&&r.btn===0,'team: Einstellungen, Beispieldaten, Sicherung laden gesperrt',r);
ok(await ev(()=>!document.querySelector('#app [data-act=export]').disabled&&[...document.querySelectorAll('.who-b')].every(b=>!b.disabled)),'team: backup export and user switch stay available');
await ev(()=>{menuDialog(S.menu[0])});ok(!(await ev(()=>$('#dlg').open))&&/nur der Chef/.test(await toastT()),'team: edit dialog via palette refused');
await ev(()=>moveDlg('out:pork'));ok(!(await ev(()=>$('#dlg').open)),'team: Entnahme buchen (auch über die Suche) gesperrt; Wareneingang und Schwund sind seit Paket C erlaubt');
await ev(()=>go('setup'));await p.click('.who-b:has-text("Chef")');await p.waitForTimeout(250);r=await ro('menu',()=>go('menu'));ok(r.note===''&&r.price===r.nprice,'chef: everything editable again');
ok(await ev(()=>{const o={supplier:'sup_wein',lines:[{n:1,price:10000}]};S.settings.currentUser='u_chef';const a=canSend(o);S.settings.currentUser='u_staff';const d=canSend(o);S.settings.currentUser='u_chef';return a&&!d}),'orders: Chef sendet jede, Team keine (kein Limit mehr)');
// ---------- 18 cloud wording
await ev(()=>go('setup'));await p.waitForTimeout(200);
const ctext=await ev(()=>[...document.querySelectorAll('#app .panel')].find(x=>x.querySelector('h2')&&x.querySelector('h2').textContent==='Cloud').innerText);
ok(!/supabase|anon key|Projekt-URL|eyJ/i.test(ctext),'cloud panel: no technical wording',ctext.slice(0,120));
await p.click('#cloudForm button[type=submit]');await p.waitForTimeout(200);ok(/Bitte die Adresse/.test(await ev(()=>$('#cloudErr').textContent)),'cloud: empty form → German hint',await ev(()=>$('#cloudErr').textContent));
await p.fill('#cloudForm [name=url]','https://gibt-es-nicht.invalid');await p.fill('#cloudForm [name=anon]','abc');await p.fill('#cloudForm [name=email]','a@b.at');await p.fill('#cloudForm [name=pw]','x');await p.click('#cloudForm button[type=submit]');
await p.waitForFunction(()=>$('#cloudErr')&&$('#cloudErr').textContent.length>5,null,{timeout:20000});
ok(await ev(()=>$('#cloudErr').textContent)==='Keine Verbindung zum Cloud-Projekt. Adresse und Schlüssel prüfen.','cloud: network error mapped to German',await ev(()=>$('#cloudErr').textContent));
errs.splice(0,errs.length,...errs.filter(e=>!/ERR_NAME_NOT_RESOLVED|Failed to load resource|net::/.test(e)));
// ---------- 32 backup file, 9 Sicherung laden
const [dl]=await Promise.all([p.waitForEvent('download',{timeout:8000}).catch(()=>null),(async()=>{await p.click('#app [data-act=export]');await p.waitForTimeout(200);await p.click('#dlBtn');})()]);
ok(!!dl&&/^dahuam202-kueche-\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()),'„Sicherung erstellen“ saves a .json file directly',dl&&dl.suggestedFilename());
ok(await ev(()=>!document.querySelector('#dlgForm textarea')&&!!document.querySelector('#copyBtn')),'no raw JSON shown, copy button kept as fallback');
const f=__dirname+'/backup_test.json';await dl.saveAs(f);const d=JSON.parse(fs.readFileSync(f));ok(Array.isArray(d.menu)&&Array.isArray(d.moves)&&d.saleGroups&&d.salesReal,'backup contains data incl. new fields');
await ev(()=>$('#dlg').close());await ev(()=>{S.menu[0].price=99;S.menu[0].name='GEÄNDERT';save()});
await p.setInputFiles('#importFile',f);await p.waitForTimeout(400);
ok(/Sicherung laden\?/.test(await dlgText())&&/Sicherheitskopie/.test(await dlgText())&&await ev(()=>S.menu[0].name==='GEÄNDERT'),'„Sicherung laden“ asks first',(await dlgText()).slice(0,140));
await submit();await p.waitForTimeout(300);ok(await ev(()=>S.menu[0].name!=='GEÄNDERT'&&S.menu[0].price!==99),'backup loaded after confirming');
await ev(()=>go('setup'));await p.waitForTimeout(200);ok(await p.locator('[data-act=safetyRestore]').count()===1&&/Letzte Daten wiederherstellen/.test(await p.locator('[data-act=safetyRestore]').innerText()),'automatic safety copy offered: „Letzte Daten wiederherstellen“');
await p.click('[data-act=safetyRestore]');await p.waitForTimeout(200);await submit();await p.waitForTimeout(300);
ok(await ev(()=>S.menu[0].name==='GEÄNDERT'),'safety copy restores the previous data');await ev(()=>go('setup'));ok(await p.locator('[data-act=safetyRestore]').count()===0,'…once');
fs.writeFileSync(__dirname+'/bad_test.json','{"products":"x","cards":[],"menu":[{}]}');await p.setInputFiles('#importFile',__dirname+'/bad_test.json');await p.waitForTimeout(300);ok(/Laden fehlgeschlagen/.test(await dlgText()),'bad file → clear message');await ev(()=>$('#dlg').close());
// old state without new fields loads
const old=JSON.parse(fs.readFileSync(f));delete old.saleGroups;delete old.salesReal;old.moves.unshift({id:'mv_a',date:'2026-10-01T18:00:00.000Z',type:'sale',pid:'pork',qty:-1,price:9,note:'Verkauf 01.10.2026'},{id:'mv_b',date:'2026-10-01T18:00:00.000Z',type:'sale',pid:'fries',qty:-1,price:2,note:'Verkauf 01.10.2026'});old.invDraft={date:'2026-10-01T10:00:00.000Z',counts:{pork:-4,veal:2}};
await ev(d=>__store.replace(d),old);await p.reload();await p.waitForTimeout(800);
ok(await ev(()=>{const a=S.moves.find(m=>m.id==='mv_a'),c=S.moves.find(m=>m.id==='mv_b');return a.grp&&a.grp===c.grp&&!!S.saleGroups[a.grp]&&S.invDraft.counts.pork===''&&S.invDraft.counts.veal===2&&typeof S.salesReal==='object'}),'old saved state loads; legacy sale moves grouped, negative counts cleared');
await ev(()=>{S.invDraft=null;view.stab='buchungen';go('stock')});await p.waitForTimeout(200);ok(await p.locator('.moves li.mv-grp').count()>=1,'legacy sale booking shown as one unit');
await L.done(b,errs);})();
