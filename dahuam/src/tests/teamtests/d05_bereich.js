/* Dienstplan getrennt nach Küche und Service */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];let fails=0;const ok=(c,m,x)=>{console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?'  → '+JSON.stringify(x):''));if(!c)fails++};
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();p.on('pageerror',e=>errs.push(String(e)));
const ev=(f,a)=>p.evaluate(f,a);const w=ms=>p.waitForTimeout(ms);
await p.goto('http://127.0.0.1:8772/dahuam/index.html?fresh=1&nointro#team/dienstplan');await p.waitForSelector('.tm-dept');
const names=()=>ev(()=>[...document.querySelectorAll('#app .tm-t tbody tr:not(.tm-grp) .tm-name')].map(x=>x.textContent).join());
const W=await ev(()=>tmView().w);
ok(await ev(()=>[...document.querySelectorAll('#app .tm-dept button')].map(x=>x.textContent+(x.classList.contains('on')?'*':'')).join())==='Alle*,Küche,Service','switch Alle · Küche · Service, Alle first');
ok(await ev(()=>[...document.querySelectorAll('#app .tm-t .tm-grp th')].map(x=>x.textContent).join())==='Küche3,Service3'&&await names()==='Anna,Lukas,Florian,Magdalena,Theresa,Hannes','Alle: two blocks with heading, Abwasch with Küche, Bar with Service');
await p.click('[data-act="tmDept"][data-id="kueche"]');await w(150);
ok(await names()==='Anna,Lukas,Florian'&&await ev(()=>!document.querySelector('#app .tm-grp')&&!/Service|Bar/.test(document.querySelector('#app .tm-t tfoot').textContent)),'Küche: only kitchen people, staffing row without Service and Bar',await names());
ok(await ev(W=>{const t=tmWeekText(W,'kueche');return /^Dienstplan Küche KW/.test(t)&&!/Magdalena|Hannes|Theresa/.test(t)&&/Anna/.test(t)},W),'text for WhatsApp: only the kitchen plan');
ok(await ev(W=>{document.querySelector('#print').innerHTML=tmPrintHtml(W,'kueche');const r=[...document.querySelectorAll('#print tbody tr')].map(x=>x.querySelector('b').textContent).join();const h=document.querySelector('#print h1').textContent;document.querySelector('#print').innerHTML='';return h.startsWith('Dienstplan Küche')&&r==='Anna,Lukas,Florian'},W),'PDF: title „Dienstplan Küche“, three rows');
await p.click('[data-act="tmDept"][data-id="service"]');await w(150);
ok(await names()==='Magdalena,Theresa,Hannes','Service: service and bar people',await names());
ok(await ev(()=>localStorage.getItem('dahuam202_dienst_bereich'))==='service','choice is remembered on this device');
/* Aushilfe: Anna (Küche) bekommt einen Dienst im Service → erscheint in dieser Woche auch im Service-Plan */
await ev(W=>{tmSetWeek.x;const D=W;(S.team.shifts[D]=S.team.shifts[D]||[]).push({id:'ts_x1',pid:'tp_anna',parts:[['18:00','22:00']],area:'service',note:''});render()},W);await w(150);
ok(await names()==='Anna,Magdalena,Theresa,Hannes','someone helping out in the other area shows in that plan for the week',await names());
await ev(()=>{view.more=Object.assign({},view.more,{dienst:true});render()});await p.click('#app [data-act="tmMode"][data-id="month"]');await w(200);
ok(await ev(()=>document.querySelectorAll('#app .tm-month tbody tr').length)===3,'month hours follow the chosen plan');
await p.click('[data-act="tmDept"][data-id="all"]');await w(150);ok(await ev(()=>document.querySelectorAll('#app .tm-month tbody tr').length)===6,'Alle: six people in the month');
await c.close();
/* Handy */
const c2=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,colorScheme:'dark'});const q=await c2.newPage();q.on('pageerror',e=>errs.push(String(e)));
await q.goto('http://127.0.0.1:8772/dahuam/index.html?fresh=1&nointro#team/dienstplan');await q.waitForSelector('.tm-dept');
ok(await q.evaluate(()=>document.documentElement.scrollWidth<=390),'phone: no horizontal scroll');
ok(await q.evaluate(()=>[...document.querySelectorAll('#app .tm-dl .tm-dgrp')].map(x=>x.textContent).join())==='Küche,Service','phone day view: two headed blocks');
await q.tap('[data-act="tmDept"][data-id="service"]');await q.waitForTimeout(150);
ok(await q.evaluate(()=>[...document.querySelectorAll('#app .tm-dr .tm-pn b')].map(x=>x.textContent).join())==='Magdalena,Theresa,Hannes'&&await q.evaluate(()=>Math.min(...[...document.querySelectorAll('#app .tm-dept button')].map(x=>x.getBoundingClientRect().height))>=40),'phone Service: three people, buttons at least 40 px high');
await c2.close();
console.log('errors',JSON.stringify(errs));console.log(fails||errs.length?'FAILS '+fails:'ALL OK');await b.close();process.exit(fails||errs.length?1:0)})();
