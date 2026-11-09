const {chromium}=require('playwright');
const SP=process.cwd();
(async()=>{const b=await chromium.launch();const errs=[];
const F='http://127.0.0.1:8765/dahuam/index.html?nointro';
const p=await b.newPage({viewport:{width:1440,height:960}});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto(F);await p.waitForTimeout(800);
const ev=(f,a)=>p.evaluate(f,a);
await p.screenshot({path:'x-dash.png'});
// Foto für Schnitzel (Menü)
await ev(()=>{view.mtab='calc';go('menu')});
const sid=await ev(()=>S.menu.find(m=>(m.name==='Wiener Schnitzel'&&m.vlabel==='vom Kalb')).id);
await p.click(`[data-act=photoMenu][data-id="${sid}"]`,{force:true}).catch(()=>{});
// photoMenu triggers input click; set file directly
await p.setInputFiles('#imgFile', SP+'/d-card.png');await p.waitForTimeout(600);
console.log('menu img', await ev(()=>{const m=S.menu.find(m=>(m.name==='Wiener Schnitzel'&&m.vlabel==='vom Kalb'));return !!(m.img&&IMG[m.img])}));
// Rezept-Foto Kaiserschmarrn + Schritt-Foto
await ev(()=>go('cards','dish_kaiser'));
await ev(()=>setPhoto(C('dish_kaiser')));await p.setInputFiles('#imgFile', SP+'/m-menu.png');await p.waitForTimeout(500);
await ev(()=>setPhoto(C('dish_kaiser').steps[0]));await p.setInputFiles('#imgFile', SP+'/d-dash.png');await p.waitForTimeout(500);
console.log('steps', await ev(()=>C('dish_kaiser').steps.length), 'stepimg', await ev(()=>!!IMG[C('dish_kaiser').steps[0].img]));
await p.screenshot({path:'x-card.png',fullPage:true});
// neue Rezeptur -> auf die Karte
await ev(()=>{newCard('dish'); const c=S.cards[S.cards.length-1]; c.name='Topfenknödel'; c.category='Desserts (alt)'.replace(' (alt)',''); c.items=[{ref:'p:flour',qty:60,net:''},{ref:'p:butter',qty:20,net:''},{ref:'p:egg',qty:1,net:''}]; save(); render();});
const nid=await ev(()=>S.cards[S.cards.length-1].id);
await p.click(`[data-act=toMenu][data-id="${nid}"]`);await p.waitForTimeout(200);
await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(200);
console.log('toast',await p.textContent('#toast'));
console.log('placed', await ev(()=>{const l=menuSorted().filter(m=>m.section==='Süßes');return l[l.length-1].name+' '+l[l.length-1].price}));
// Gästekarte in 3 Stilen
await ev(()=>{view.mtab='guest';go('menu')});
for(const st of ['alpin','klassisch','modern']){ await ev(s=>{S.settings.guest.style=s;render()},st); await p.waitForTimeout(300); await p.screenshot({path:'x-g-'+st+'.png'}); }
await ev(()=>{view.mtab='layout';render()});await p.screenshot({path:'x-layout.png'});
// Lager
await ev(()=>go('stock'));await p.screenshot({path:'x-stock.png'});
const v0=await ev(()=>P('veal').stock);
await ev(()=>salesDlg());await p.fill(`#dlgForm input[name="s_${sid}"]`,'10');await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(200);
console.log('sale toast',await p.textContent('#toast'),'veal',v0,'->',await ev(()=>P('veal').stock));
await ev(()=>moveDlg('in:veal'));await p.fill('#dlgForm input[name=qty]','6');await p.fill('#mvPrice','30.5');await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(200);
console.log('in toast',await p.textContent('#toast'),'veal price',await ev(()=>P('veal').price));
await ev(()=>{view.stab='buchungen';render()});await p.screenshot({path:'x-moves.png'});
await ev(()=>{view.stab='inventur';render()});await p.click('[data-act=invStart]');await p.waitForTimeout(100);
await p.fill('#inv-pork','11.2');await p.press('#inv-pork','Enter');await p.fill('#inv-veal','5');await p.waitForTimeout(100);
await p.screenshot({path:'x-inv.png'});
await p.click('[data-act=invFinish]');await p.waitForTimeout(100);await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(200);
console.log('inv', await ev(()=>JSON.stringify(S.inventories[0])), 'pork', await ev(()=>P('pork').stock));
await ev(()=>{view.stab='bestellung';render()});await p.screenshot({path:'x-order.png'});
// mobile
const m=await b.newPage({viewport:{width:390,height:844},colorScheme:'dark'});m.on('pageerror',e=>errs.push('m '+e.message));
await m.goto(F);await m.waitForTimeout(600);
for(const [t,fn] of [['dash',()=>go('dash')],['calc',()=>{view.mtab='calc';go('menu')}],['guest',()=>{view.mtab='guest';go('menu')}],['layout',()=>{view.mtab='layout';go('menu')}],['card',()=>go('cards','dish_kaiser')],['stock',()=>{view.stab='bestand';go('stock')}],['moves',()=>{view.stab='buchungen';go('stock')}],['order',()=>{view.stab='bestellung';go('stock')}]]){
  await m.evaluate(fn);await m.waitForTimeout(250);const w=await m.evaluate(()=>document.documentElement.scrollWidth);if(w>390)console.log('OVERFLOW',t,w);
  if(['calc','guest','stock','card'].includes(t)) await m.screenshot({path:'xm-'+t+'.png'});
}
console.log('errors',errs);await b.close();})();
