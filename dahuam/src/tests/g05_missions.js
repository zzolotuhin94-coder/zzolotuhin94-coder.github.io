// Missionen: progress only from real actions, never from demo data; stamps; persistence; roles; old data
const {L,ok,done,T,settle,PHONE}=require('./h');
const fs=require('fs');
const st=p=>p.evaluate(()=>({a:JSON.parse(JSON.stringify(S.game.acts)),s:Object.keys(S.game.stamps),rw:(document.querySelector('.reward.gd-rw h2')||{}).textContent||null}));
const closeRw=p=>p.evaluate(()=>{document.querySelectorAll('.reward').forEach(n=>n.remove());S.game.rq=[];save()});
(async()=>{
const {b,p,errs,ctx}=await L.open();
await p.evaluate(()=>go('aufbau'));await settle(p,900);
let s=await st(p);
ok(s.s.length===0&&Object.values(s.a).every(v=>Array.isArray(v)?v.length===0:v===0),'fresh demo data: no stamp, every counter 0',s);
const rows=await p.evaluate(()=>msState().map(x=>[x.m.id,x.n,x.goal,x.done]));
ok(rows.length===18&&rows.filter(r=>!['allprices','allrecipes','allalg'].includes(r[0])).every(r=>r[1]===0),'18 missions; all action missions at 0 although the demo data has prices, recipes, orders, inventories',rows.filter(r=>r[1]>0));
ok(await p.evaluate(()=>document.querySelectorAll('#app .ms-next [data-act="missionGo"]').length===1&&document.querySelector('#app .ms-next h2').textContent==='Rundgang ansehen'),'Aufbau shows exactly one "next mission" with one start button');
ok(await p.evaluate(()=>document.querySelectorAll('#app .au-row').length===6),'the six data stations are still there');
ok(await p.evaluate(()=>/Talstation/.test(document.querySelector('#app .ms-lvl').textContent)),'calm level title');
// tiers
await p.click('#app [data-act="msTier"][data-id="1"]');await settle(p,200);
ok(await p.evaluate(()=>document.querySelectorAll('#app .ms-row').length===13),'tier Alltag opens',await p.evaluate(()=>document.querySelectorAll('#app .ms-row').length));
// mission start button → right place + matching guide
await p.click('#app .ms-row [data-act="missionGo"][data-id="prices5"]');await settle(p,700);
let t=await T(p);ok(t&&t.id==='pcheck'&&t.tab==='pcheck','„5 echte Preise“ opens the Preis-Check and starts its guide',t&&[t.id,t.tab]);
await p.evaluate(()=>tourEnd(true));
// 5 prices through the real UI
const near=()=>p.evaluate(()=>String(Math.round(P(view.pc.q[view.pc.i]).price*110)/100).replace('.',','));
for(let i=0;i<4;i++){await p.fill('#pcIn',await near());await p.keyboard.press('Enter');await settle(p,150);}
s=await st(p);ok(s.a.prices.length===4&&!s.s.includes('prices5'),'4 prices typed → 4 of 5, no stamp yet',s.a.prices.length);
await p.click('#app [data-act="pcBack"]');await settle(p,200);s=await st(p);ok(s.a.prices.length===3,'undo in the Preis-Check takes the progress back',s.a.prices.length);
await p.fill('#pcIn',await near());await p.keyboard.press('Enter');await settle(p,150);await p.click('#app [data-act="pcOk"]');await settle(p,1500);
s=await st(p);ok(s.a.prices.length===5&&s.s.includes('prices5'),'5th price → stamp',s.s);ok(s.rw==='5 echte Preise eintragen','gold stamp card for the mission',s.rw);
ok(await p.evaluate(()=>!document.querySelector('.reward.gd-rw .rw-sparks')),'reward has no spark storm');
await closeRw(p);
// allergens via the dish dialog
await p.evaluate(()=>missionGo('alg5'));await settle(p,700);t=await T(p);ok(t&&t.id==='alg'&&await p.evaluate(()=>view.sec==='noalg'),'„Allergene“ mission opens the filtered list with its guide');
await p.evaluate(()=>tourEnd(true));
for(let i=0;i<2;i++){await p.click('#app table.lt tbody button[data-act="editMenu"]');await settle(p,250);await p.evaluate(()=>{const d=document.querySelector('#dlgForm details.alg-det');if(d)d.open=true;document.querySelector('#dlgForm input[name="alg"]').checked=true});await p.click('#dlgForm button[type=submit]');await settle(p,300);}
s=await st(p);ok(s.a.alg.length===2,'2 dishes got allergens → 2 of 5',s.a.alg.length);
// order sent
await p.evaluate(()=>missionGo('order1'));await settle(p,700);t=await T(p);ok(t&&t.id==='buy'&&t.tab==='buy','„Erste Bestellung“ opens Einkauf with its guide');await p.evaluate(()=>tourEnd(true));
await p.evaluate(()=>{const o=newOrder('sup_gross');view.order=o.id;save();go('buy')});await settle(p,300);
s=await st(p);ok(s.a.sent===0,'a draft does not count');
await p.click('#app [data-act="ordMarkSent"]');await settle(p,400);await p.evaluate(()=>{const f=document.querySelector('#dlg[open] button[type=submit]');if(f)f.click()});await settle(p,1300);
s=await st(p);ok(s.a.sent===1&&s.s.includes('order1'),'marking it as sent → stamp',s.a.sent);await closeRw(p);
// delivery checked
await p.evaluate(()=>missionGo('recv1'));await settle(p,700);t=await T(p);ok(t&&t.id==='recv'&&await p.evaluate(()=>!!view.recv),'„Erste Lieferung“ opens a waiting delivery with its guide');await p.evaluate(()=>tourEnd(true));
await p.click('#app [data-act="rAll"]');await settle(p,200);await p.click('#app [data-act="rBook"]');await settle(p,400);await p.evaluate(()=>{const f=document.querySelector('#dlg[open] button[type=submit]');if(f)f.click()});await settle(p,1300);
s=await st(p);ok(s.a.recv===1&&s.s.includes('recv1'),'booking the delivery → stamp',s.a.recv);await closeRw(p);
// inventory
await p.evaluate(()=>missionGo('inv1'));await settle(p,700);await p.evaluate(()=>tourEnd(true));
await p.click('#app [data-act="invStart"]');await settle(p,200);await p.fill('#app input[data-inv]','5');await settle(p,150);await p.click('#app [data-act="invFinish"]');await settle(p,300);await p.click('#dlgForm button[type=submit]');await settle(p,1300);
s=await st(p);ok(s.a.inv===1&&s.s.includes('inv1'),'finished inventory → stamp',s.a.inv);await closeRw(p);
// Kasse import (pasted rows)
await p.evaluate(()=>missionGo('kasse'));await settle(p,700);t=await T(p);ok(t&&t.id==='rimport','„Kassendatei“ opens the import with its guide');await p.evaluate(()=>tourEnd(true));
await p.click('#app [data-act="rpSample"]');await settle(p,200);await p.click('#app [data-act="rpAnalyse"]');await settle(p,500);
s=await st(p);ok(s.a.kasse===0,'preview alone does not count');
await p.click('#app [data-act="rpImport"]');await settle(p,400);await p.evaluate(()=>{const r=document.querySelector('#dlg[open] input[name="demoSales"][value="del"]');if(r)r.checked=true;const f=document.querySelector('#dlg[open] button[type=submit]');if(f)f.click()});await settle(p,1300);
s=await st(p);ok(s.a.kasse===1&&s.s.includes('kasse'),'import → stamp',s.a.kasse);await closeRw(p);
// backup download
await p.evaluate(()=>missionGo('backup'));await settle(p,700);t=await T(p);ok(t&&t.id==='backup'&&t.doing,'„Sicherung“ mission: interactive guide on Einstellungen');
await p.click('#app [data-act="export"]');await settle(p,300);
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#dlBtn')]);await settle(p,500);
s=await st(p);ok(s.a.backup===1&&s.s.includes('backup')&&/dahuam202-kueche/.test(dl.suggestedFilename()),'saved backup file → stamp',s.a.backup);
await p.keyboard.press('Escape');await settle(p,1700);await p.evaluate(()=>tourEnd(true));await closeRw(p);
// simulator
await p.evaluate(()=>missionGo('sim'));await settle(p,700);t=await T(p);ok(t&&t.id==='sim'&&t.tab==='cards','„Simulator“ mission opens a recipe with its guide');
await p.evaluate(()=>{const r=document.querySelector('#sim');r.value=+r.value+2;r.dispatchEvent(new Event('input',{bubbles:true}))});await settle(p,1600);t=await T(p);ok(t&&t.title==='Übernehmen','moving the slider advances');
await p.click('#simApply');await settle(p,1500);s=await st(p);ok(s.a.sim===1&&s.s.includes('sim'),'applying the price → stamp',s.a.sim);await p.evaluate(()=>tourEnd(true));await closeRw(p);
await p.evaluate(()=>missionGo('link5'));await settle(p,800);t=await T(p);ok(t&&t.id==='link'&&t.found&&await p.evaluate(()=>view.sec==='none'),'„Rezeptur verbinden“ mission opens the filtered list with its guide',t&&t.id);await p.evaluate(()=>tourEnd(true));
// Stempelkarte + level
await p.evaluate(()=>go('stempel'));await settle(p,300);
const sk=await p.evaluate(()=>({on:document.querySelectorAll('#app .stamp.on').length,all:document.querySelectorAll('#app .stamp').length,lvl:document.querySelector('#app .sk-lvl').textContent,nav:document.querySelector('.side .nav-i.on').dataset.tab}));
ok(sk.all===18&&sk.on===7&&/Mittelstation/.test(sk.lvl)&&sk.nav==='aufbau','Stempelkarte: 7 of 18 stamps, level Mittelstation',sk);
await p.click('#app .stamp.on');await settle(p,200);ok(await p.evaluate(()=>/Erledigt am/.test((document.querySelector('.gd-bub')||{}).textContent||'')),'tapping a stamp tells what it is for');
// persistence
await p.reload();await settle(p,900);const s2=await st(p);ok(s2.s.length===7&&s2.a.prices.length>=5&&s2.a.sent===1,'stamps and counters survive a reload',s2);
ok(s2.rw===null,'no reward is replayed after a reload');
// staff
await p.evaluate(()=>{S.settings.currentUser='u_staff';save();view.msOpen={0:true,1:true,2:true};go('aufbau')});await settle(p,300);
const ro=await p.evaluate(()=>({ro:[...document.querySelectorAll('#app .ms-row.ro .ms-ro')].map(e=>e.textContent),btn:[...document.querySelectorAll('#app .ms-row [data-act="missionGo"]')].map(b=>b.dataset.id),next:(document.querySelector('#app .ms-next h2')||{}).textContent}));
ok(ro.ro.length>=4&&ro.ro.every(x=>x==='für Küchenchef/Inhaber')&&!ro.btn.includes('alg5')&&ro.btn.includes('pdf'),'staff: edit missions marked „für Küchenchef/Inhaber“, others startable',ro);
await p.evaluate(()=>missionGo('alg5'));await settle(p,400);ok(await p.evaluate(()=>!GD.t&&view.tab==='aufbau'),'staff cannot start an edit mission');
await p.evaluate(()=>{S.settings.currentUser='u_chef';save()});
// PDF (needs the PDF libraries from the CDN; counted only when the file was really saved)
await p.evaluate(()=>missionGo('pdf'));await settle(p,900);t=await T(p);ok(t&&t.id==='guest','„PDF“ mission opens Gestalten & PDF with its guide');
await p.evaluate(()=>tourGo(GD.t.steps.length-1,1));await settle(p,700);
let pdfOk=false;try{const [d2]=await Promise.all([p.waitForEvent('download',{timeout:45000}),p.click('#app [data-pdf="printMenu"]')]);pdfOk=/\.pdf$/.test(d2.suggestedFilename());}catch(e){}
await settle(p,1500);s=await st(p);
if(pdfOk) ok(s.a.pdf===1&&s.s.includes('pdf'),'saved PDF → stamp',s.a.pdf); else {console.log('  note PDF libraries not reachable here: PDF stamp not exercised');ok(s.a.pdf===0,'no PDF file → no stamp');}
await p.evaluate(()=>{tourEnd(true);document.querySelectorAll('.reward').forEach(n=>n.remove())});
// reset demo data clears the game; stamps reset button
await p.evaluate(()=>{go('setup')});await p.click('#app [data-act="gdReset"]');await settle(p,200);await p.click('#dlgForm button[type=submit]');await settle(p,500);
s=await st(p);ok(s.s.length===0&&s.a.prices.length===0&&s.a.sent===0,'„Stempel zurücksetzen“ clears stamps and counters, data untouched',s.s);
ok(await p.evaluate(()=>S.products.filter(p=>!p.priceDemo&&!p.noStock).length>=5),'… confirmed prices are still confirmed, but no longer counted (not re-earned from data)');
// old saved state without game.acts
await p.evaluate(()=>{const d=JSON.parse(localStorage.getItem(KEY));delete d.game.acts;delete d.game.stamps;delete d.game.minit;localStorage.setItem(KEY,JSON.stringify(d));localStorage.removeItem(KEY+'_guide')});
await p.reload();await settle(p,900);
ok(await p.evaluate(()=>Array.isArray(S.game.acts.prices)&&typeof S.game.stamps==='object'&&!document.body.classList.contains('simple')&&!document.querySelector('.gd-wel')&&!GD.t),'old saved state: migrated, „Alles zeigen“, no dialog');
await p.evaluate(()=>{const d=JSON.parse(localStorage.getItem(KEY));delete d.game;localStorage.setItem(KEY,JSON.stringify(d))});await p.reload();await settle(p,900);
await p.evaluate(()=>go('aufbau'));await settle(p,200);ok(await p.evaluate(()=>!!S.game&&S.game.acts.tour===0&&document.querySelectorAll('#app .ms-row').length>0),'state without any game data loads');
// backup file from before the guide
const old=JSON.parse(fs.readFileSync(__dirname+'/../fixtests/backup_test.json','utf8'));
const r=await p.evaluate(d=>{try{loadBackup(d);return {ok:true,acts:!!S.game.acts,n:S.menu.length}}catch(e){return {ok:false,e:String(e)}}},old);await settle(p,500);
ok(r.ok&&r.acts,'an older backup file loads and gets the mission fields',r);
s=await st(p);ok(s.s.filter(x=>!['allprices','allrecipes','allalg'].includes(x)).length===0,'loading a backup does not hand out action stamps',s.s);
await done(b,errs);
})();
