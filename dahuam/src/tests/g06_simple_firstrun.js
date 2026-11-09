// Einfach-Modus, first run, persistence, phone width with guide UI open
const {L,ok,done,T,settle,PHONE,URL0}=require('./h');
const vis=(p,sel)=>p.evaluate(s=>[...document.querySelectorAll(s)].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').length,sel);
const VIEWS=[['aufbau',()=>go('aufbau')],['dash',()=>go('dash')],['menu',()=>{view.mtab='calc';go('menu')}],['guest',()=>{view.mtab='guest';go('menu')}],['cards',()=>go('cards')],['card',()=>go('cards','dish_kaiser')],['labor',()=>go('labor')],['stock',()=>{view.order=null;view.recv=null;view.stab='bestand';go('stock')}],['inventur',()=>{if(!S.invDraft)S.invDraft={date:new Date().toISOString(),counts:{}};view.stab='inventur';go('stock')}],['buy',()=>{view.stab='bestellung';view.order=null;go('buy')}],['order',()=>{const o=draftFor('sup_gross')||newOrder('sup_gross');view.order=o.id;view.recv=null;go('buy')}],['recv',()=>{const o=S.orders.find(o=>o.status==='confirmed');view.order=o.id;view.recv=o.id;go('buy')}],['products',()=>{view.order=null;view.recv=null;go('products')}],['pcheck',()=>pcStart()],['report',()=>{view.rp.tab='sales';go('report')}],['rimport',()=>{view.rp.tab='import';go('report')}],['setup',()=>go('setup')],['begriffe',()=>go('begriffe')],['stempel',()=>go('stempel')]];
(async()=>{
{const {b,p,errs}=await L.open();
 ok(await p.evaluate(()=>!isSimple()&&!document.body.classList.contains('simple')),'default (test runs, ?nointro) = Alles zeigen');
 await p.evaluate(()=>{view.mtab='calc';go('menu')});
 ok(await vis(p,'#app .vsw')===1&&await vis(p,'#app table.lt thead th button[data-act="lsort"]')>=4,'full mode: view switch and sortable headers present');
 // switch in Einstellungen
 await p.evaluate(()=>go('setup'));await p.click('#app [data-act="guideMode"][data-id="simple"]');await settle(p,300);
 ok(await p.evaluate(()=>isSimple()&&document.body.classList.contains('simple')&&document.querySelector('#app [data-act="guideMode"][data-id="simple"]').getAttribute('aria-pressed')==='true'),'switch in Einstellungen turns Einfach on');
 ok(await vis(p,'#app .panel.adv')===0&&await p.evaluate(()=>[...document.querySelectorAll('#app .panel.adv h2')].map(h=>h.textContent.trim()).sort().join('|'))==='Cloud & Team|Startanimation|Wer arbeitet gerade?','cloud panel, roles and start animation are hidden');
 await p.evaluate(()=>{view.mtab='calc';view.sec='all';go('menu')});await settle(p,250);
 const m=await p.evaluate(()=>({ths:[...document.querySelectorAll('#app table.lt thead th')].map(t=>t.textContent.trim()).filter(Boolean),pe:getComputedStyle(document.querySelector('#app table.lt thead th button')).pointerEvents,h:Math.round(document.querySelector('#app .page-h .btn').getBoundingClientRect().height),tab:document.querySelector('#app [data-act="mtab"].on').textContent}));
 ok(await vis(p,'#app .vsw')===0,'view switch hidden');ok(m.pe==='none'&&!m.ths.some(t=>/[↑↓]/.test(t)),'sort arrows off',m.pe);
 ok(m.ths.includes('Kostet mich')&&m.ths.includes('Anteil am Preis')&&m.ths.includes('Bleibt übrig')&&!m.ths.includes('WE'),'plain column names instead of WE / WE % / Rohertrag',m.ths);
 ok(m.h>=44,'bigger controls',m.h);
 await p.evaluate(()=>{SORTS.menu={col:'price',dir:-1};render()});await settle(p,200);
 ok(await p.evaluate(()=>!!document.querySelector('#app table.lt tr.grp')&&SORTS.menu.col==='price'),'a saved sort order is ignored in Einfach, but kept for later');await p.evaluate(()=>{delete SORTS.menu});
 await p.evaluate(()=>{setV('teller','table');go('cards','dish_kaiser')});await settle(p,250);
 const c=await p.evaluate(()=>({teller:!!document.querySelector('#app .teller-sec .plate'),sw:[...document.querySelectorAll('#app [data-act="tellerMode"]')].filter(e=>e.getClientRects().length).length,lab:[...document.querySelectorAll('#app .hero small, #app .kv span, #app .plate-c span, #app .fcw small, #app h2')].map(e=>e.textContent.trim())}));
 ok(c.teller&&c.sw===0,'recipe: always the Teller, table switch hidden',c.sw);
 ok(c.lab.includes('Was kostet mich das Gericht?')&&c.lab.includes('Bleibt übrig, ohne Steuer')&&c.lab.some(x=>/% vom Preis$/.test(x))&&!c.lab.includes('Aufschlagsfaktor')||await vis(p,'#app .kv .adv')===0,'recipe: plain labels („Was kostet mich das Gericht?“)',c.lab.slice(0,14));
 await p.evaluate(()=>{const r=document.querySelector('#sim');r.value=+r.value+1;r.dispatchEvent(new Event('input',{bubbles:true}))});await settle(p,200);
 ok(await p.evaluate(()=>[...document.querySelectorAll('#app .kv span')].some(e=>e.textContent==='Bleibt übrig, ohne Steuer')),'labels stay plain after a partial redraw (simulator)');
 await p.evaluate(()=>go('products'));await settle(p,250);
 ok(await p.evaluate(()=>{const th=[...document.querySelectorAll('#app table thead th')];const i=th.findIndex(t=>t.textContent.trim()==='Putzverlust');return i>0&&th[i].getClientRects().length===0&&document.querySelector('#app table tbody tr').children[i].getClientRects().length===0&&[...document.querySelectorAll('#app table thead th')].filter(t=>t.textContent.trim()==='Garverlust')[0].getClientRects().length===0}),'Produkte: Putz- and Garverlust columns hidden');
 await p.evaluate(()=>{view.rp.tab='sales';go('report')});await settle(p,300);
 ok(await vis(p,'#app [data-act="rpCsv"]')===0&&await vis(p,'#app [data-act="rpCmp"]')===0,'Auswertung: CSV export and comparison settings hidden');
 // persistence
 await p.reload();await settle(p,900);ok(await p.evaluate(()=>isSimple()&&document.body.classList.contains('simple')),'Einfach survives a reload');
 // back to full: everything is there again
 await p.evaluate(()=>go('setup'));await p.click('#app [data-act="guideMode"][data-id="full"]');await settle(p,300);
 await p.evaluate(()=>{view.rp.tab='sales';go('report')});await settle(p,250);const full1=await vis(p,'#app [data-act="rpCsv"]')+await vis(p,'#app [data-act="rpCmp"]');
 await p.evaluate(()=>go('products'));await settle(p,200);const full2=await p.evaluate(()=>[...document.querySelectorAll('#app table thead th')].filter(t=>/Putzverlust|Garverlust/.test(t.textContent)&&t.getClientRects().length).length);
 await p.evaluate(()=>go('cards','dish_kaiser'));await settle(p,200);const full3=await p.evaluate(()=>!document.querySelector('#app .teller-sec .plate')&&[...document.querySelectorAll('#app [data-act="tellerMode"]')].some(e=>e.getClientRects().length));
 ok(full1>=4&&full2===2&&full3,'„Alles zeigen“ brings everything back (incl. the saved Tabelle view)',[full1,full2,full3]);
 await p.evaluate(()=>setV('teller','teller'));
 console.log('errors',JSON.stringify(errs));if(errs.length)ok(false,'console errors',errs);await b.close();}
// ---------- first run: fresh data, with intro
{const {b,p,errs}=await L.open({url:URL0});
 ok(await p.evaluate(()=>G_FRESH&&!G_NOINTRO),'fresh browser without ?nointro');
 const early=await p.evaluate(()=>({intro:!!document.getElementById('intro'),wel:!!document.querySelector('.gd-wel')}));
 ok(!early.wel,'while the start animation runs there is no dialog',early);
 await p.waitForSelector('dialog.gd-wel[open]',{timeout:9000});
 ok(await p.evaluate(()=>!document.getElementById('intro')),'first-run question comes after the intro');
 ok(await p.evaluate(()=>/Wie möchten Sie starten\?/.test(document.querySelector('.gd-wel').textContent)&&document.querySelectorAll('.gd-wel .gw-o').length===2),'asks „Wie möchten Sie starten?“ with two choices');
 await p.screenshot({path:__dirname+'/../guide-out/_firstrun-check.png'});
 await p.click('.gd-wel [data-gw="simple"]');await settle(p,300);
 ok(await p.evaluate(()=>isSimple()&&/Rundgang/.test(document.querySelector('.gd-wel h2').textContent)),'choosing Einfach switches the mode, then offers the Rundgang');
 await p.click('.gd-wel [data-gw="tour"]');await settle(p,600);
 const t=await T(p);ok(t&&t.id==='main'&&!await p.evaluate(()=>!!document.querySelector('.gd-wel')),'Rundgang starts');
 await p.keyboard.press('Escape');await settle(p,200);
 await p.reload();await settle(p,2500);ok(await p.evaluate(()=>!document.querySelector('.gd-wel')&&!GD.t&&isSimple()),'second visit: no question, no auto tour, mode remembered');
 console.log('errors',JSON.stringify(errs));if(errs.length)ok(false,'console errors',errs);await b.close();}
// skip path + existing data
{const {b,p,errs}=await L.open({url:URL0});
 await p.waitForSelector('dialog.gd-wel[open]',{timeout:9000});await p.keyboard.press('Escape');await settle(p,300);
 ok(await p.evaluate(()=>!document.querySelector('.gd-wel')&&!isSimple()&&GP.asked===1&&!GD.t),'Esc skips the question: Alles zeigen, no tour');
 await p.reload();await settle(p,2500);ok(await p.evaluate(()=>!document.querySelector('.gd-wel')),'skipped question is not asked again');
 console.log('errors',JSON.stringify(errs));if(errs.length)ok(false,'console errors',errs);await b.close();}
{const {b,p,errs}=await L.open({url:URL0});
 await p.waitForSelector('dialog.gd-wel[open]',{timeout:9000});await p.click('.gd-wel [data-gw="skip"]');await settle(p,300);
 ok(await p.evaluate(()=>!document.querySelector('.gd-wel')&&!isSimple()),'„Überspringen“ closes the question');
 // existing saved data, no guide prefs → no question, only a quiet pointer
 await p.evaluate(()=>{localStorage.removeItem(KEY+'_guide');sessionStorage.clear()});await p.reload();await settle(p,6500);
 ok(await p.evaluate(()=>!G_FRESH&&!document.querySelector('.gd-wel')&&!GD.t&&!isSimple()),'existing data: no first-run question, default Alles zeigen');
 ok(await p.evaluate(()=>GP.hinted===1),'existing data: one quiet toast points to the Rundgang');
 console.log('errors',JSON.stringify(errs));if(errs.length)ok(false,'console errors',errs);await b.close();}
// ---------- phone: 390 wide on all tabs, in Einfach, with help bar / bubble / tour open
{const {b,p,errs}=await L.open(PHONE);
 const bad=[];
 for(const mode of ['full','simple']){await p.evaluate(m=>setMode(m,true),mode);
  for(const [n,f] of VIEWS){await p.evaluate(f);await settle(p,200);
   let sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw!==390) bad.push([mode,n,'plain',sw]);
   await p.evaluate(()=>{helpSet(true);const e=[...document.querySelectorAll('#app [data-help]')].find(x=>x.getClientRects().length);if(e)bubShow(e,HELP[e.dataset.help])});await settle(p,120);
   const hb=await p.evaluate(()=>{const de=document.documentElement;const bb=document.querySelector('.gd-bub');const r=bb?bb.getBoundingClientRect():{left:0,right:0};const bar=document.querySelector('.gd-helpbar').getBoundingClientRect();return {sw:de.scrollWidth,bl:Math.round(r.left),br:Math.round(r.right),barL:Math.round(bar.left),barR:Math.round(bar.right)}});
   if(hb.sw!==390||hb.bl<0||hb.br>390||hb.barL<0||hb.barR>390) bad.push([mode,n,'help',hb]);
   await p.evaluate(()=>{helpSet(false);guideHere()});await settle(p,450);
   const tt=await T(p);if(tt&&(tt.sw!==390||tt.cr[0]<0||tt.cr[2]>390)) bad.push([mode,n,'tour',tt.sw,tt.cr]);
   await p.evaluate(()=>tourEnd(true));}
 }
 ok(bad.length===0,'phone 390: scrollWidth === 390 on 19 views × (plain, help bar + bubble, mini guide) × (Alles zeigen, Einfach)',bad);
 // touch sizes of the new controls
 await p.evaluate(()=>{setMode('full',true);view.msOpen={0:true,1:true,2:true};go('aufbau')});await settle(p,200);
 const NEW='.topbar [data-act="helpMode"], #app .ms-go, #app [data-act="missionGo"], #app [data-act="msTier"], #app .ms-sk, #app .stamp, #app .bg-search, #app .gd-panel button, #app .crumb-q, #app .wozu-q, #app .crumb .back, .gd-helpbar button';
 const sizes=()=>p.evaluate(sel=>[...document.querySelectorAll(sel)].filter(e=>e.getClientRects().length&&!e.closest('.adv')).map(e=>[(e.className.toString()||e.dataset.act||e.id).slice(0,18),Math.round(e.getBoundingClientRect().width),Math.round(e.getBoundingClientRect().height)]).filter(x=>x[2]<40||x[1]<40),NEW);
 await p.evaluate(()=>{helpSet(true)});let n0=0;
 for(const tab of ['aufbau','stempel','setup','begriffe']){await p.evaluate(t=>go(t),tab);await settle(p,200);const small=await sizes();n0+=await p.evaluate(sel=>document.querySelectorAll(sel).length,NEW);ok(small.length===0,`phone ${tab}: new controls ≥ 40 px`,small.slice(0,6));}
 await p.evaluate(()=>{helpSet(false);go('cards','dish_kaiser')});await settle(p,200);ok((await sizes()).length===0&&n0>30,'phone recipe detail: back link and "?" ≥ 40 px',await sizes());
 // "Mehr" stays marked for areas that are not in the bottom bar
 await p.evaluate(()=>go('products'));await settle(p,200);ok(await p.evaluate(()=>document.querySelector('.bottom .nav-i.on')?.dataset.tab==='setup'),'phone: on Produkte the bottom bar marks „Mehr“');
 // long press on a bottom nav item explains it and does not navigate
 await p.evaluate(()=>go('dash'));await settle(p,200);
 const bx=await p.evaluate(()=>{const r=document.querySelector('.bottom .nav-i[data-tab="stock"]').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]});
 await p.evaluate(([x,y])=>{const el=document.elementFromPoint(x,y);el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',clientX:x,clientY:y}))},bx);await settle(p,700);
 await p.evaluate(([x,y])=>{const el=document.elementFromPoint(x,y);el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch',clientX:x,clientY:y}));el.closest('button').click()},bx);await settle(p,200);
 ok(await p.evaluate(()=>view.tab==='dash'&&/Was im Haus ist/.test((document.querySelector('.gd-bub')||{}).textContent||'')),'phone: long press on „Lager“ shows its one-liner without navigating');
 await p.evaluate(()=>bubHide());await p.tap('.bottom .nav-i[data-tab="stock"]');await settle(p,250);ok(await p.evaluate(()=>view.tab==='stock'),'a normal tap still navigates');
 await done(b,errs);}
})();
