// Rundgang: forward / back / skip, desktop + phone, robustness
const {L,ok,done,T,settle,PHONE}=require('./h');
(async()=>{
{const {b,p,errs}=await L.open();
 ok(await p.evaluate(()=>!document.querySelector('#gd')&&!document.querySelector('.gd-wel')),'?nointro: no tour, no first-run dialog');
 await p.evaluate(()=>go('menu'));
 await p.click('.side [data-act="tourMain"]');await settle(p,500);
 let t=await T(p);ok(t&&t.id==='main'&&t.n===13,'sidebar "Rundgang" starts the tour, 13 steps',t&&t.n);
 ok(t.role==='dialog'&&t.live>20,'card has dialog role, live region filled');
 ok(t.focus==='next','focus on Weiter',t.focus);
 const titles=[];let bad=[];
 for(let i=0;i<13;i++){await settle(p,i===4?700:420);t=await T(p);titles.push(t.title);
  if(!t.found||t.hr[2]<8||t.hr[3]<8||t.cr[0]<0||t.cr[2]>1440||t.cr[1]<0||t.cr[3]>900) bad.push([i,t.title,t.hr,t.cr]);
  if(i===4) ok(t.tab==='cards'&&!!t.card,'step 5 opens a recipe (Teller)',t.card);
  if(i===8) ok(t.tab==='products','step 9 is on Produkte',t.tab);
  if(i<12) await p.keyboard.press('ArrowRight');}
 ok(titles.join('|')==='Aufbau|Heute|Speisekarte|Rezepturen|Der Teller|Rezept-Labor|Lager|Einkauf|Produkte & Preis-Check|Auswertung|Einstellungen|Suchen|Was ist das?','all 13 steps in order',titles.join('|'));
 ok(bad.length===0,'every step has a real target and the card is inside the viewport',bad);
 // back
 await p.keyboard.press('ArrowLeft');await settle(p,400);t=await T(p);ok(t.i===11&&t.title==='Suchen','← goes back',t.title);
 await p.click('#gd [data-gd="back"]');await settle(p,500);t=await T(p);ok(t.i===10&&t.tab==='setup','Zurück button goes back and re-navigates',[t.i,t.tab]);
 // re-render + scroll + resize: spotlight follows
 await p.evaluate(()=>{tourGo(2,1)});await settle(p,500);
 await p.evaluate(()=>{render();render()});await settle(p,200);t=await T(p);ok(t.hr[2]>8&&t.title==='Speisekarte','survives re-render',t.hr);
 await p.evaluate(()=>{tourEnd(true);go('menu');tourStart('menu');tourGo(1,1)});await settle(p,600);
 const r1=await p.evaluate(()=>{const e=document.querySelector('#app table.lt thead').getBoundingClientRect();return [Math.round(e.left),Math.round(e.top)]});t=await T(p);
 ok(Math.abs(t.hr[0]-(r1[0]-6))<=2&&Math.abs(t.hr[1]-(r1[1]-6))<=2,'spotlight sits on the target',[t.hr,r1]);
 await p.evaluate(()=>window.scrollBy(0,60));await settle(p,200);
 const r2=await p.evaluate(()=>{const e=document.querySelector('#app table.lt thead').getBoundingClientRect();return [Math.round(e.left),Math.round(e.top)]});t=await T(p);
 ok(Math.abs(t.hr[1]-(r2[1]-6))<=2&&r2[1]!==r1[1],'spotlight follows on scroll',[t.hr,r2]);
 await p.setViewportSize({width:1100,height:800});await settle(p,300);
 const r3=await p.evaluate(()=>{const e=document.querySelector('#app table.lt thead').getBoundingClientRect();return [Math.round(e.left),Math.round(e.top),Math.round(e.width)]});t=await T(p);
 ok(Math.abs(t.hr[0]-(r3[0]-6))<=2&&Math.abs(t.hr[2]-(Math.min(1096,r3[0]+r3[2]+6)-(r3[0]-6)))<=3,'spotlight follows on resize (clamped to the viewport)',[t.hr,r3]);
 await p.setViewportSize({width:1440,height:900});
 // dialog during tour: overlay moves into the dialog, no dim; back afterwards
 await p.evaluate(()=>menuDialog());await settle(p,300);
 ok(await p.evaluate(()=>document.querySelector('#gd').parentNode.id==='dlg'&&document.querySelector('#gd .gd-hole').classList.contains('off')),'dialog open: overlay docks into the dialog, spotlight off');
 await p.keyboard.press('Escape');await settle(p,300);
 ok(await p.evaluate(()=>!!GD.t&&document.querySelector('#gd').parentNode===document.body&&!document.querySelector('#gd .gd-hole').classList.contains('off')),'Esc closes the dialog first, tour continues');
 await p.keyboard.press('Escape');await settle(p,200);
 ok(await p.evaluate(()=>!GD.t&&!document.querySelector('#gd')&&!document.body.classList.contains('gd-on')),'Esc exits the tour, nothing left on the page');
 // skip returns to origin
 await p.evaluate(()=>go('report'));await p.evaluate(()=>tourStart('main'));await settle(p,400);await p.keyboard.press('ArrowRight');await settle(p,400);
 await p.click('#gd [data-gd="skip"]');await settle(p,300);
 ok(await p.evaluate(()=>!GD.t&&view.tab==='report'&&S.game.acts.tour===0),'Überspringen ends and returns to where the user was; no stamp');
 // missing element → step skipped
 await p.evaluate(()=>{go('menu');tourStart({id:'x',name:'Test',steps:[{t:'A',x:'a',sel:'#app .page-h'},{t:'B',x:'b',sel:'#gibtsnicht'},{t:'C',x:'c',sel:'#app table.lt'}]})});await settle(p,300);
 await p.keyboard.press('ArrowRight');await settle(p,1300);t=await T(p);ok(t&&t.title==='C','missing target: step is skipped',t&&t.title);
 await p.keyboard.press('ArrowLeft');await settle(p,1300);t=await T(p);ok(t&&t.title==='A','missing target also skipped going back',t&&t.title);
 await p.evaluate(()=>tourEnd(true));
 await p.evaluate(()=>{tourStart({id:'y',name:'Test',steps:[{t:'B',x:'b',sel:'#gibtsnicht'}]})});await settle(p,1300);
 ok(await p.evaluate(()=>!GD.t&&!document.querySelector('#gd')),'tour with no existing target ends by itself');
 // error safety
 await p.evaluate(()=>{tourStart({id:'z',name:'Test',steps:[{t:'A',x:'a',sel:'#app .page-h',go:()=>{throw new Error('x')}},{t:'B',x:()=>{throw new Error('boom')},sel:'#app .page-h'}]})});await settle(p,300);
 ok(await p.evaluate(()=>!!GD.t),'error in a step\'s go() does not kill the tour');
 await p.evaluate(()=>{try{tourNext()}catch(e){} });await settle(p,300);
 await p.evaluate(()=>{ if(GD.t){ const o=gdPlace; gdPlace=()=>{throw new Error('place')}; setTimeout(()=>gdPlace=o,200);} });await settle(p,400);
 ok(await p.evaluate(()=>!GD.t&&!document.querySelector('#gd')&&!document.body.classList.contains('gd-on')),'error inside the engine: overlay removed, page not dimmed');
 // complete run → stamp
 await p.evaluate(()=>{go('dash');tourStart('main')});await settle(p,300);
 for(let i=0;i<12;i++){await p.click('#gd [data-gd="next"]');await settle(p,i===3?600:260);}
 t=await T(p);ok(t.i===12&&await p.evaluate(()=>document.querySelector('#gd [data-gd="next"]').textContent==='Fertig'),'last step shows Fertig');
 await p.click('#gd [data-gd="next"]');await settle(p,1500);
 const fin=await p.evaluate(()=>({t:!!GD.t,tab:view.tab,tour:S.game.acts.tour,stamp:!!S.game.stamps.tour,rw:!!document.querySelector('.reward.gd-rw'),rwT:(document.querySelector('.reward.gd-rw h2')||{}).textContent}));
 ok(!fin.t&&fin.tab==='aufbau'&&fin.tour===1&&fin.stamp,'finishing gives the Rundgang stamp and lands on Aufbau',fin);
 ok(fin.rw&&fin.rwT==='Rundgang ansehen','gold stamp card appears',fin.rwT);
 const e2=errs.filter(e=>!/Rundgang beendet: Error: place/.test(e));ok(errs.length===1&&e2.length===0,'only the deliberately provoked engine error was logged',e2);await b.close();}
{const {b,p,errs}=await L.open(PHONE);
 await p.evaluate(()=>go('setup'));
 ok(await p.evaluate(()=>!!document.querySelector('#app .gd-panel [data-act="tourMain"]')&&!!document.querySelector('.topbar [data-act="helpMode"]')),'phone: Rundgang under Mehr, help switch in the top bar');
 await p.click('#app .gd-panel [data-act="tourMain"]');await settle(p,500);
 const bad=[];const titles=[];let t;
 for(let i=0;i<13;i++){await settle(p,i===4?700:450);t=await T(p);titles.push(t.title);
  if(!t.found||t.hr[2]<8||t.hr[3]<8||t.cr[0]<0||t.cr[2]>390||t.cr[1]<0||t.cr[3]>844||t.sw!==390) bad.push([i,t.title,t.hr,t.cr,t.sw]);
  if(i===5) ok(t.tab==='setup'&&/Mehr/.test(t.text),'phone: Rezept-Labor is shown under Mehr',t.text.slice(-40));
  if(i<12) await p.click('#gd [data-gd="next"]');}
 ok(titles.length===13&&bad.length===0,'phone: 13 steps, targets found, card inside 390, no side scroll',bad);
 const sz=await p.evaluate(()=>[...document.querySelectorAll('#gd button')].map(x=>Math.round(x.getBoundingClientRect().height)));
 ok(sz.every(h=>h>=40),'phone: tour buttons ≥ 40 px',sz);
 await p.click('#gd [data-gd="back"]');await settle(p,400);t=await T(p);ok(t.i===11,'phone: Zurück works');
 await p.click('#gd [data-gd="skip"]');await settle(p,300);ok(await p.evaluate(()=>!GD.t&&!document.querySelector('#gd')),'phone: Überspringen ends');
 await done(b,errs);}
})();
