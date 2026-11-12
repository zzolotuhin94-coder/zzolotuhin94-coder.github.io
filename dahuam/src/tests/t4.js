const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];
const F='http://127.0.0.1:8775/dahuam/index.html?nointro';
const p=await b.newPage({viewport:{width:1440,height:960},timezoneId:'Europe/Vienna'});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto(F);await p.waitForTimeout(900);const ev=(f,a)=>p.evaluate(f,a);
console.log('specials',await ev(()=>S.specials.map(s=>s.name+' '+s.from+'..'+s.to).join(' | ')));
console.log('today season',await ev(()=>seasonFor(todayStr())));
for(const [d,n] of [['2027-01-20','winter'],['2027-05-01','fruehling'],['2027-07-20','sommer'],['2026-10-05','herbst']]){
  await ev(d=>{view.mtab='guest';view.gdate=d;view.gseason=null;go('menu')},d);await p.waitForTimeout(400);
  await p.screenshot({path:'s-'+n+'.png'});
  console.log(n, await ev(()=>({items:document.querySelectorAll('#gsCanvas .gs-d').length, sea:curSeasonKey()})));
}
const wild=await ev(()=>S.specials[0].from);
await ev(d=>{view.gdate=d;render()},wild);await p.waitForTimeout(300);await p.screenshot({path:'s-wild.png'});
await ev(()=>{view.gdate=new Date().getFullYear()+'-12-31';render()});await p.waitForTimeout(300);
await p.evaluate(()=>document.querySelector('.tk-label')?.scrollIntoView());await p.screenshot({path:'s-silvester.png'});
// Wednesday closed
await ev(()=>{view.gdate='2026-11-11';render()});console.log('closed', await ev(()=>!!document.querySelector('.g-closed')));
// Tafelspitz only Sunday
await ev(()=>{view.gdate='2026-11-15';render()});const sun=await ev(()=>document.querySelector('#gsCanvas').textContent.includes('Tafelspitz'));
await ev(()=>{view.gdate='2026-11-16';render()});const mon=await ev(()=>document.querySelector('#gsCanvas').textContent.includes('Tafelspitz'));console.log('tafelspitz sun/mon',sun,mon);
// plan
await ev(()=>{view.mtab='plan';render()});await p.waitForTimeout(300);await p.screenshot({path:'s-plan.png'});
// new special via dialog
await ev(()=>specialDialog());await p.fill('#dlgForm input[name=name]','Knödelwoche');await p.click('[data-dur="2"]');
await p.fill('#spRows [data-f=name]','Spinatknödel');await p.fill('#spRows [data-f=price]','14.9');await p.fill('#spRows [data-f=alg]','a c g x');
await p.screenshot({path:'s-spdlg.png'});
await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(200);console.log('sp toast',await p.textContent('#toast'),await ev(()=>JSON.stringify(S.specials.find(s=>s.name==='Knödelwoche'))));
// matrix toggle
const mid=await ev(()=>S.menu.find(m=>m.name==='Caesar Salat').id);
await p.click(`[data-ms="${mid}:winter"] + span`);console.log('caesar seasons',await ev(id=>S.menu.find(m=>m.id===id).seasons,mid));
// season edit: color + date
await ev(()=>{view.mtab='guest';view.gseason='winter';render()});
await p.fill('[data-smd=from]','15.11.');await p.press('[data-smd=from]','Tab');await p.waitForTimeout(150);console.log('winter from',await ev(()=>S.settings.seasons.winter.from),'today now',await ev(()=>seasonFor(todayStr())));
/* die Akzentfarbe je Saison gibt es im Gestalter nicht mehr (dort: drei Akzentfarben je Vorlage) */ await p.click('#gsRail [data-gs="fx"][data-k="acc"][data-id="1"]').catch(()=>{});console.log('akzent der vorlage',await ev(()=>gsDoc().fx.acc));await p.waitForTimeout(200);await p.screenshot({path:'s-custom.png'});
// menu dialog seasons
await ev(()=>menuDialog(S.menu.find(m=>m.name==='Caesar Salat')));await p.screenshot({path:'s-mdlg.png'});await p.click('#dlgCancel');
// QA: click after edit
await ev(()=>{view.more={teller:true};go('cards','dish_kaiser')});const n0=await ev(()=>C('dish_kaiser').items.length);
await p.fill('#qty-0','125');await p.click('[data-act=addLine]');await p.waitForTimeout(200);console.log('addLine after edit',n0,'->',await ev(()=>C('dish_kaiser').items.length),'qty',await ev(()=>C('dish_kaiser').items[0].qty));
// Tab focus
await p.fill('#qty-1','260');await p.keyboard.press('Tab');await p.waitForTimeout(100);console.log('focus after tab',await ev(()=>document.activeElement.id));
// bad import
fs.writeFileSync('bad.json',JSON.stringify({products:[{id:'x',name:'X',unit:'kg',price:1}],cards:[{id:'c1',name:'R',type:'dish'}],menu:[{id:'m1',name:'M',section:'Vorspeisen',price:5,card:'c1'}],settings:{name:'Mini'}}));
await ev(()=>go('setup'));await p.setInputFiles('#importFile','bad.json');await p.waitForTimeout(400);/* neu: Sicherung laden fragt nach */await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(400);
console.log('import toast',await p.textContent('#toast'),'menu',await ev(()=>S.menu.length));
await p.reload();await p.waitForTimeout(600);console.log('after reload app html len',await ev(()=>document.querySelector('#app').innerHTML.length), await ev(()=>S.settings.name));
// mobile
const m=await b.newPage({viewport:{width:390,height:844},colorScheme:'dark'});m.on('pageerror',e=>errs.push('m '+e.message));
await m.goto(F);await m.waitForTimeout(500);await m.evaluate(()=>__store.wipe(true));await m.reload();await m.waitForTimeout(600);
for(const t of ['guest','plan']){ await m.evaluate(t=>{view.mtab=t;go('menu')},t);await m.waitForTimeout(300);const w=await m.evaluate(()=>document.documentElement.scrollWidth);console.log('m',t,w);await m.screenshot({path:'sm-'+t+'.png'}); }
console.log('errors',errs);await b.close();})();
