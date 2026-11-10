// Hauskarte: Stil, Migration, Umbruch, Handy, Texte, Stressdaten
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const F='http://127.0.0.1:8765/dahuam/index.html?nointro';
const p=await b.newPage({viewport:{width:1440,height:960},timezoneId:'Europe/Vienna'});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push('c '+m.text().slice(0,160)));
await p.goto(F);await p.evaluate(()=>__store.wipe(true));await p.reload();await p.waitForTimeout(1200);const ev=(f,a)=>p.evaluate(f,a);
console.log('default style',await ev(()=>[S.settings.guestStyle,hsStyle(),!!S.settings.menuCopy]));
// Prüfung je Blatt: nichts läuft über, nichts wird abgeschnitten
const check=()=>ev(()=>{const out=[];document.querySelectorAll('.hs-sheet .hs-page').forEach((pg,i)=>{const pr=pg.getBoundingClientRect();const sc=pr.width/794;const bad=[];
  const body=pg.querySelector('.hs-body');if(body&&body.scrollHeight>body.clientHeight+1)bad.push('body overflow '+(body.scrollHeight-body.clientHeight));
  pg.querySelectorAll('.hs-d,.hs-feat,.hs-kd,.hs-tr,.hs-sh,.hs-cont,.hs-vm,.hs-leg,.hs-fav .it,.hs-strip').forEach(n=>{const r=n.getBoundingClientRect();const lim=n.closest('.hs-zone.paper,.hs-board,.hs-body,.area')||pg;const l=lim.getBoundingClientRect();
    if(r.bottom>l.bottom+1||r.right>l.right+1||r.left<l.left-1||r.top<l.top-1)bad.push((n.className+' '+n.textContent.trim().slice(0,24))+' out '+Math.round((r.bottom-l.bottom)/sc));});
  pg.querySelectorAll('.hs-plate .tx,.hs-fav .it,.hs-cloud').forEach(n=>{if(n.scrollHeight>n.clientHeight+1)bad.push('clip '+n.className+' '+n.textContent.trim().slice(0,20));});
  pg.querySelectorAll('.hs-n,.fn,.kn,.pnm').forEach(n=>{if(n.scrollWidth>n.clientWidth+2&&n.clientWidth>0)bad.push('wide '+n.textContent.trim().slice(0,20));});
  if(bad.length)out.push((i+1)+': '+bad.join('; '));});
  const names=new Set([...document.querySelectorAll('.hs-prev .hs-list .hs-n,.hs-prev .hs-list .fn,.hs-prev .hs-kids .kn,.hs-prev .pnm,.hs-strip .hs-n')].map(n=>(n.childNodes.length?[...n.childNodes].filter(c=>c.nodeType===3).map(c=>c.nodeValue).join(''):n.textContent).trim()));
  const want=[...new Set(guestItems(curSeasonKey(),view.gdate).map(m=>m.name))];const miss=want.filter(n=>!names.has(n));
  return {pages:document.querySelectorAll('.hs-sheet').length,bad:out,dishes:want.length,missing:miss};});
for(const [d,n] of [['2027-01-20','winter'],['2026-11-09','herbst'],['2027-05-10','fruehling'],['2027-07-20','sommer'],['2026-11-13','wildwochenende'],['2026-12-31','silvester']]){
  await ev(d=>{view.mtab='guest';view.gdate=d;view.gseason=null;go('menu')},d);await p.waitForTimeout(n==='winter'?2500:900);
  console.log(n,JSON.stringify(await check()));
  if(n==='fruehling'||n==='sommer'||n==='wildwochenende'){await ev(()=>{view.hsBig=false;refreshGuest()});await p.waitForTimeout(300);
    const pv=await p.$('.hs-prev');await p.setViewportSize({width:2300,height:1400});await p.waitForTimeout(300);await ev(()=>hsFit());await pv.screenshot({path:'hauskarte-out/preview-'+n+'.png'});await p.setViewportSize({width:1440,height:960});}
}
// Texte ändern
await ev(()=>{view.gdate='2027-01-20';render()});await p.waitForTimeout(400);
console.log('panel',await ev(()=>!!document.querySelector('[data-hsc=welcome]')),'sec inputs',await ev(()=>document.querySelectorAll('[data-hsc=sec]').length));
await p.fill('[data-hsc=welcome]','Griaß enk! Testtext für die Tafel.');await p.waitForTimeout(700);
await ev(()=>{const d=document.querySelector('.hs-copy details');d.open=true});await p.fill('[data-hsc=sec][data-sec="Rösti"]','Testzeile Rösti');await p.waitForTimeout(700);
console.log('copy applied',await ev(()=>[document.querySelector('.hs-prev .hs-welcome').textContent, S.settings.menuCopy.welcome, [...document.querySelectorAll('.hs-prev .hs-intro')].some(n=>n.textContent==='Testzeile Rösti')]));
await p.reload();await p.waitForTimeout(900);console.log('copy persisted',await ev(()=>[hsCopy('welcome'),hsCopy('sec','Rösti'),hsCopy('sec','Klassiker')]));
// Stilwechsel + Merker
await ev(()=>{view.mtab='guest';go('menu')});await p.waitForTimeout(500);
await p.click('[data-act=gStyle][data-id=web]');await p.waitForTimeout(400);console.log('web',await ev(()=>[S.settings.guestStyle,S.settings.guestStylePick,!!document.querySelector('.wk-paper'),!!document.querySelector('.hs-sheet'),!!document.querySelector('[data-hsc]')]));
await p.reload();await p.waitForTimeout(900);console.log('web kept after reload',await ev(()=>hsStyle()));
await ev(()=>{view.mtab='guest';go('menu')});await p.waitForTimeout(400);await p.click('[data-act=gStyle][data-id=book]');await p.waitForTimeout(400);console.log('book',await ev(()=>[hsStyle(),!!document.querySelector('.hk-paper')]));
await p.click('[data-act=gStyle][data-id=haus]');await p.waitForTimeout(600);console.log('haus again',await ev(()=>[hsStyle(),document.querySelectorAll('.hs-sheet').length]));
// Migration: alte Daten mit 'web' ohne Merker
await ev(()=>{S.settings.guestStyle='web';delete S.settings.guestStylePick;delete S.settings.menuCopy;save()});await p.reload();await p.waitForTimeout(900);console.log('migrated',await ev(()=>[S.settings.guestStyle,hsStyle(),JSON.stringify(S.settings.menuCopy)]));
// Stressdaten: 14 Gerichte, 2 Gerichte, ausgeblendet, lange Namen, viele zum Teilen, viele Kinder
await ev(()=>{const add=(section,name,desc,price,o={})=>S.menu.push(Object.assign({id:uid('m'),section,name,desc,price,card:'',img:'',veg:'',top:false,hidden:false,seasons:[],days:[],alg:'',order:99+S.menu.length},o));
  for(let i=1;i<=8;i++)add('Klassiker','Zusatzgericht Nummer '+i+(i%3?'':' mit einem wirklich sehr langen Namen'),i%2?'Mit Beilage, Sauce und noch einer längeren Beschreibung, die umbricht':'',10+i);
  add('Klassiker','VERSTECKT-X','nicht zeigen',9,{hidden:true});add('Klassiker','NUR-SOMMER-X','nicht im Winter',9,{seasons:['sommer']});
  for(let i=1;i<=6;i++)add('Zum Teilen','Platte '+i,'Zum Teilen für alle am Tisch',15+i);
  for(let i=1;i<=7;i++)add('Für Kinder','Kindergericht '+i+' mit Pommes','',5+i);
  add('Frühstück','Bergfrühstück','Semmel, Butter, Marmelade, Ei',12.5,{top:true});add('Frühstück','Müsli','',7.5,{veg:'v'});
  S.menu.filter(m=>m.section==='Rösti').forEach(m=>m.hidden=true);save();view.mtab='guest';view.gdate='2027-01-20';go('menu');});await p.waitForTimeout(900);
const st=await check();console.log('stress',JSON.stringify(st));
console.log('hidden/out-of-season excluded',await ev(()=>!/VERSTECKT-X|NUR-SOMMER-X/.test(document.querySelector('.hs-prev').textContent)));
{const pv=await p.$('.hs-prev');await p.setViewportSize({width:2300,height:1400});await p.waitForTimeout(300);await ev(()=>hsFit());await pv.screenshot({path:'hauskarte-out/preview-stress.png'});await p.setViewportSize({width:1440,height:960});}
// leere Daten
await ev(()=>{S.menu=[];S.specials=[];render()});await p.waitForTimeout(500);console.log('empty',JSON.stringify(await check()));
// Handy 390
const m=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});m.on('pageerror',e=>errs.push('m '+e.message));await m.goto(F);await m.waitForTimeout(900);
await m.evaluate(()=>{view.mtab='guest';view.gdate='2027-01-20';go('menu')});await m.waitForTimeout(2500);
console.log('phone',await m.evaluate(()=>({sw:document.documentElement.scrollWidth,sheets:document.querySelectorAll('.hs-sheet').length,sheetW:Math.round(document.querySelector('.hs-sheet').getBoundingClientRect().width),cols:new Set([...document.querySelectorAll('.hs-sheet')].map(s=>Math.round(s.getBoundingClientRect().left))).size,scale:getComputedStyle(document.querySelector('.hs-prev')).getPropertyValue('--hs-s')})));
await m.evaluate(()=>document.querySelector('.hs-sheet').scrollIntoView());await m.waitForTimeout(300);await m.screenshot({path:'hauskarte-out/phone-390.png'});
// helles / dunkles App-Thema
for(const th of ['light','dark']){await p.goto(F);await p.evaluate(()=>__store.wipe(true));await p.reload();await p.waitForTimeout(800);
  await p.evaluate(t=>{const btn=document.querySelector('[data-act=theme],[data-act=toggleTheme],#themeBtn');const cur=document.documentElement.dataset.theme||document.documentElement.getAttribute('data-theme');window.__th=[cur,!!btn];document.documentElement.dataset.theme=t;view.mtab='guest';view.gdate='2027-01-20';go('menu')},th);await p.waitForTimeout(1500);
  console.log('theme',th,await p.evaluate(()=>[window.__th,getComputedStyle(document.body).backgroundColor]));await p.screenshot({path:'hauskarte-out/app-'+th+'.png'});}
console.log('errors',errs);await b.close();})();
