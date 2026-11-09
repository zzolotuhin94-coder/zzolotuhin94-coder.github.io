const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
const F='http://127.0.0.1:8765/dahuam/index.html?nointro';
const p=await b.newPage({viewport:{width:1440,height:960},timezoneId:'Europe/Vienna'});p.on('pageerror',e=>errs.push(e.message+' '+e.stack.split('\n')[1]));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto(F);await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(900);const ev=(f,a)=>p.evaluate(f,a);
await ev(()=>go('dash'));await p.screenshot({path:'e-dash.png'});
console.log('suppliers',await ev(()=>S.suppliers.length),'orders',await ev(()=>S.orders.map(o=>o.no+':'+o.status).join(' ')));
await ev(()=>{view.stab='bestellung';view.order=null;go('stock')});await p.waitForTimeout(300);await p.screenshot({path:'e-cockpit.png',fullPage:true});
// neue Bestellung Großmarkt
const oid=await ev(()=>{const o=newOrder('sup_gross');save();view.order=o.id;render();return o.id});
console.log('draft lines',await ev(id=>ORD(id).lines.map(l=>P(l.pid).name+' '+l.n+'×'+l.ou).join(' | '),oid));
await p.fill('#ol-0','3');await p.click('[data-act=olSuggest]');await p.waitForTimeout(200);
await p.selectOption('#olAdd',{index:1});await p.waitForTimeout(200);
await p.screenshot({path:'e-draft.png',fullPage:true});
console.log('text:\n'+await ev(id=>orderText(ORD(id)),oid));
// Rolle Bar darf nicht
await ev(()=>{S.settings.currentUser='u_bar';render()});console.log('bar block',await ev(id=>sendBlockReason(ORD(id)),oid));
await ev(()=>{S.settings.currentUser='u_chef';render()});
await p.click(`[data-act=ordMarkSent][data-id="${oid}"]`);await p.waitForTimeout(200);console.log('status',await ev(id=>ORD(id).status,oid),await p.textContent('#toast'));
// Wareneingang mit Fehlmenge + Preis hoch
await p.click(`[data-act=ordRecv][data-id="${oid}"]`);await p.waitForTimeout(200);
const flour0=await ev(()=>P('flour').stock);
await p.fill('#rd-0','2');await p.press('#rd-0','Tab');await p.fill('#rp-1','99');await p.press('#rp-1','Tab');await p.waitForTimeout(150);await p.fill('#rNo','LS 9001');
await p.screenshot({path:'e-recv.png',fullPage:true});
await p.click(`[data-act=rBook][data-id="${oid}"]`);await p.waitForTimeout(250);
console.log('after book',await ev(id=>ORD(id).status,oid),await p.textContent('#toast'),'flour',flour0,'->',await ev(()=>P('flour').stock));
await p.screenshot({path:'e-complaint.png',fullPage:true});
// Limit/Freigabe
const o2=await ev(()=>{const o=newOrder('sup_wein',false);o.lines.push(lineFor(P('gv'),200));save();S.settings.currentUser='u_bar';view.order=o.id;render();return o.id});
console.log('limit',await ev(id=>sendBlockReason(ORD(id)),o2));await p.click(`[data-act=ordApproval][data-id="${o2}"]`);
await ev(()=>{S.settings.currentUser='u_owner';render()});console.log('owner can',await ev(id=>canSend(ORD(id)),o2));
await ev(()=>{view.stab='lieferanten';view.order=null;render()});await p.screenshot({path:'e-sup.png',fullPage:true});
await ev(()=>supplierDialog(SUP('sup_fleisch')));await p.screenshot({path:'e-supdlg.png'});await ev(()=>document.getElementById('dlg').close());
await ev(()=>go('setup'));await p.screenshot({path:'e-setup.png',fullPage:true});
await ev(()=>prodDialog(P('flour')));await p.screenshot({path:'e-prod.png'});await ev(()=>document.getElementById('dlg').close());
const m=await b.newPage({viewport:{width:390,height:844}});m.on('pageerror',e=>errs.push('m '+e.message));await m.goto(F);await m.waitForTimeout(600);
for(const fn of [()=>{view.stab='bestellung';go('stock')},()=>{view.stab='lieferanten';go('stock')},()=>{const o=S.orders[0];view.stab='bestellung';view.order=o.id;go('stock')},()=>go('setup')]){await m.evaluate(fn);await m.waitForTimeout(250);const w=await m.evaluate(()=>document.documentElement.scrollWidth);if(w>390)console.log('OVERFLOW',w);}
console.log('errors',errs);await b.close();})();
