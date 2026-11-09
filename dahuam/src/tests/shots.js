// screenshots for review → ../guide-out/  (deviceScaleFactor 1)
const {chromium}=require('playwright');
const OUT=__dirname+'/../guide-out/';
const URLN='http://127.0.0.1:8765/dahuam/index.html?nointro';
const only=process.argv[2]||'';
(async()=>{const b=await chromium.launch();
for(const [dev,vp,mob] of [['desktop',{width:1440,height:900},false],['phone',{width:390,height:844},true]]){
 for(const th of ['light','dark']){
  if(only&&!(`${dev}-${th}`).includes(only)) continue;
  const ctx=await b.newContext({viewport:vp,deviceScaleFactor:1,isMobile:mob,hasTouch:mob,timezoneId:'Europe/Vienna'});const p=await ctx.newPage();
  p.on('pageerror',e=>console.log('PE',dev,th,e.message));
  await p.goto(URLN);await p.waitForTimeout(900);await p.evaluate(t=>setTheme(t),th);
  const shot=async n=>{await p.waitForTimeout(450);await p.screenshot({path:`${OUT}${n}-${dev}-${th}.png`});};
  // 01 first-run question (same dialog as on a fresh start)
  await p.evaluate(()=>{go('aufbau');gdWelcome()});await shot('01-erster-start');
  await p.evaluate(()=>{document.querySelector('.gd-wel [data-gw="full"]').click()});await shot('02-erster-start-rundgang');
  await p.evaluate(()=>{document.querySelector('.gd-wel [data-gw="later"]').click()});
  // 03–05 Rundgang
  await p.evaluate(()=>tourStart('main'));await shot('03-rundgang-aufbau');
  await p.evaluate(()=>tourGo(4,1));await p.waitForTimeout(400);await shot('04-rundgang-teller');
  await p.evaluate(()=>tourGo(7,1));await shot('05-rundgang-einkauf');
  await p.evaluate(()=>tourGo(12,1));await shot('06-rundgang-hilfe');
  await p.evaluate(()=>tourEnd(true));
  // 07 mini guide with an interactive step, 08 after the action
  await p.evaluate(()=>{view.mtab='calc';view.sec='all';go('menu');tourStart('menu');tourGo(2,1)});await shot('07-anleitung-speisekarte-preis');
  await p.keyboard.type('15,50');await p.keyboard.press('Enter');await p.waitForTimeout(250);await shot('08-anleitung-geschafft');
  await p.evaluate(()=>{tourEnd(true)});
  await p.evaluate(()=>{pcStart();tourStart('pcheck');tourGo(1,1)});await shot('09-anleitung-preis-check');await p.evaluate(()=>tourEnd(true));
  // 10 Hilfe-Modus
  await p.evaluate(()=>{view.mtab='calc';go('menu');helpSet(true)});await p.waitForTimeout(200);
  await p.evaluate(()=>{const th=[...document.querySelectorAll('#app table.lt thead th')].find(t=>t.textContent.trim()==='WE %');th.click()});await shot('10-hilfe-we-prozent');
  await p.evaluate(()=>{go('setup')});await p.waitForTimeout(200);await p.evaluate(()=>{const e=document.querySelector('#app [data-act="reset"]');e.scrollIntoView({block:'center'});e.click()});await shot('11-hilfe-sperrt-loeschen');
  await p.evaluate(()=>{helpSet(false);window.scrollTo(0,0)});
  // 12 Begriffe
  await p.evaluate(()=>go('begriffe'));await shot('12-begriffe');
  await p.fill('#bq','verlust');await shot('13-begriffe-suche');await p.evaluate(()=>{view.bq=''});
  // 14 Missionen: some real progress for the picture
  await p.evaluate(()=>{const g=gdGame();g.acts.tour=1;g.stamps.tour=todayStr();g.acts.prices=S.products.slice(0,5).map(p=>p.id);S.products.slice(0,5).forEach(p=>markPrice(p,'Preis-Check'));g.stamps.prices5=todayStr();g.acts.alg=S.menu.filter(m=>!hasAlg(m)).slice(0,3).map(m=>m.id);GSNAP=null;save();view.msOpen={};go('aufbau')});await shot('14-missionen');
  await p.evaluate(()=>{view.msOpen={0:true,1:true};render();window.scrollTo(0,260)});await shot('15-missionen-alltag');
  // 16 Stempelkarte + reward
  await p.evaluate(()=>{const g=gdGame();['order1','recv1','backup','sim'].forEach(k=>g.stamps[k]=todayStr());save();window.scrollTo(0,0);go('stempel')});await shot('16-stempelkarte');
  await p.evaluate(()=>{const g=gdGame();g.stamps.inv1=todayStr();g.rq=['inv1'];gdRewards()});await p.waitForTimeout(900);await shot('17-stempel-erhalten');
  await p.evaluate(()=>document.querySelectorAll('.reward').forEach(n=>n.remove()));
  // 18–19 Einfach-Modus
  await p.evaluate(()=>{setMode('simple',true);view.mtab='calc';view.sec='all';go('menu')});await shot('18-einfach-speisekarte');
  await p.evaluate(()=>{go('cards','dish_schnitzel_pork')});await shot('19-einfach-rezept');
  await p.evaluate(()=>{setMode('full',true);view.mtab='calc';go('menu')});await shot('20-alles-speisekarte');
  await p.evaluate(()=>{go('cards','dish_schnitzel_pork')});await shot('21-alles-rezept');
  await p.evaluate(()=>{go('setup')});await shot('22-einstellungen-hilfe');
  await ctx.close();}}
await b.close();})();
