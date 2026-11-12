const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
const F='http://127.0.0.1:8765/dahuam/index.html?nointro';
const p=await b.newPage({viewport:{width:1440,height:1000},timezoneId:'Europe/Vienna',deviceScaleFactor:1});p.on('pageerror',e=>errs.push(e.message));
await p.goto(F);await p.evaluate(()=>__store.wipe(true));await p.reload();await p.waitForTimeout(1300);const ev=(f,a)=>p.evaluate(f,a);await ev(()=>{gsState().cur='schlicht';save()}); /* Vorlage „Schlicht“ im Gestalter (früher Stil „Schlicht“) */
console.log('sections',await ev(()=>secList().join(' | ')));
console.log('klassiker',await ev(()=>menuSorted().filter(m=>m.section==='Klassiker').map(m=>m.name+(m.vlabel?' ('+m.vlabel+')':'')).join(', ')));
for(const [d,n] of [['2027-01-20','winter'],['2027-07-20','sommer']]){await ev(d=>{view.mtab='guest';view.gdate=d;view.gseason=null;go('menu')},d);await p.waitForTimeout(500);
 const el=await p.$('#gsCanvas .gs-sheet');await el.screenshot({path:'h-'+n+'.png'});}
const wild=await ev(()=>S.specials[0].from);await ev(d=>{view.gdate=d;render()},wild);await p.waitForTimeout(400);await (await p.$('#gsCanvas .gs-sheet')).screenshot({path:'h-herbst.png'});
await ev(()=>{view.gdate=new Date().getFullYear()+'-12-31';render()});await p.waitForTimeout(400);const tk=await p.$$('.hk-paper');console.log('sheets',tk.length);if(tk[1])await tk[1].screenshot({path:'h-tk.png'});if(tk[2])await tk[2].screenshot({path:'h-kids.png'});
await ev(()=>{view.gdate='2027-01-20';render()});await p.screenshot({path:'h-tools.png'});
const m=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});m.on('pageerror',e=>errs.push('m '+e.message));await m.goto(F);await m.waitForTimeout(800);await m.evaluate(()=>{gsState().cur='schlicht';});
await m.evaluate(()=>{view.mtab='guest';view.gdate='2027-01-20';go('menu');document.querySelector('#gsCanvas').scrollIntoView()});await m.waitForTimeout(400);
console.log('mobile w',await m.evaluate(()=>document.documentElement.scrollWidth));await m.screenshot({path:'h-mobile.png'});
console.log('errors',errs);await b.close();})();
