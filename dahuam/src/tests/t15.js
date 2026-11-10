const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
const F='http://127.0.0.1:8765/dahuam/index.html?nointro';
const p=await b.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
await p.goto(F);await p.evaluate(()=>__store.wipe(true));await p.reload();await p.waitForTimeout(1200);const ev=(f,a)=>p.evaluate(f,a);
await p.click('.nav-i[data-tab=labor]');await p.waitForTimeout(200);
for(const v of ['Kürbis','Ziegenkäse','Walnüsse']){await p.fill('#labIn',v);await p.press('#labIn','Enter');await p.waitForTimeout(100);}
console.log('ings',await ev(()=>JSON.stringify(view.lab.ings.map(x=>x.ref||('free:'+x.name)))));
await p.selectOption('[data-lab=type]','vor');
await p.click('[data-act=labGen]');await p.waitForTimeout(900);
console.log('ideas',await ev(()=>[...document.querySelectorAll('.lab-card h3')].map(h=>h.textContent).join(' || ')));
console.log('kpi',await ev(()=>document.querySelector('.lab-kpi').innerText.replace(/\n/g,' ')));
await p.screenshot({path:'lab-d.png',fullPage:true});
await p.fill('#labIn','Kalbsrücken');await p.press('#labIn','Enter');await p.selectOption('[data-lab=type]','haupt');await p.waitForTimeout(900);
await p.click('[data-act=labGen]');await p.waitForTimeout(900);
console.log('haupt',await ev(()=>[...document.querySelectorAll('.lab-card h3')].map(h=>h.textContent).join(' || ')));
await p.click('[data-act=labMod][data-id=cheaper]');await p.waitForTimeout(900);console.log('cheaper kpi',await ev(()=>document.querySelector('.lab-kpi').innerText.replace(/\n/g,' ')));
await p.click('[data-act=labMod][data-id=veg]');await p.waitForTimeout(900);console.log('veg',await ev(()=>document.querySelector('.lab-card h3').textContent));
const nP=await ev(()=>S.products.length);
await p.click('[data-act=labTake][data-id="0"]');await p.waitForTimeout(400);/* neu: neue Produkte werden erst nach Rückfrage angelegt */if(await p.evaluate(()=>$('#dlg').open)){await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(400);}
console.log('taken',await ev(()=>JSON.stringify({tab:view.tab,card:C(view.card)?.name,items:C(view.card)?.items.length,steps:C(view.card)?.steps.length,newProds:S.products.length})),'before',nP);
await p.screenshot({path:'lab-take.png'});
const m=await b.newPage({viewport:{width:390,height:844}});m.on('pageerror',e=>errs.push('m '+e.message));await m.goto(F);await m.waitForTimeout(900);
await m.evaluate(()=>{view.lab={ings:[{ref:'p:romaine'},{name:'Kürbis'}],type:'vor',style:'modern',diet:'',fcMax:28,price:'',season:'herbst',res:null,seed:0};go('labor')});await m.click('[data-act=labGen]');await m.waitForTimeout(900);
console.log('m width',await m.evaluate(()=>document.documentElement.scrollWidth));await m.screenshot({path:'lab-m.png',fullPage:true});
console.log('errors',errs);await b.close();})();
