const {chromium}=require('playwright');const fs=require('fs');
const APP='http://127.0.0.1:9922/app/?nointro';const URL0='http://127.0.0.1:9922';
(async()=>{const b=await chromium.launch();const errs=[];
const dev=async(n)=>{const c=await b.newContext({viewport:{width:1300,height:900}});const p=await c.newPage();p.on('pageerror',e=>errs.push(n+': '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource/.test(m.text())&&errs.push(n+' console: '+m.text()));await p.goto(APP);await p.waitForTimeout(800);return p;};
const login=async(p,email,pw)=>{await p.evaluate(()=>go('setup'));await p.fill('#cloudForm [name=url]',URL0);await p.fill('#cloudForm [name=anon]','anon-key');await p.fill('#cloudForm [name=email]',email);await p.fill('#cloudForm [name=pw]',pw);await p.click('#cloudForm button[type=submit]');await p.waitForTimeout(900);};
const st=async()=>(await fetch(URL0+'/stats')).json();
const A=await dev('A');await login(A,'anna@x','wrong');console.log('wrong pw msg:',await A.textContent('#cloudErr'));
await login(A,'anna@x','pw1');console.log('A connected:',await A.evaluate(()=>cloudReady()+' '+me().name+' '+me().role),'server',JSON.stringify(await st()));
await A.screenshot({path:'c-setup.png'});
// Gerät B
const B=await dev('B');await login(B,'bernd@x','pw2');console.log('B dialog:',await B.evaluate(()=>document.getElementById('dlg').open));
await B.click('#dlgForm button[type=submit]');await B.waitForTimeout(800);
console.log('B has data, me:',await B.evaluate(()=>S.menu.length+' '+me().name+' '+me().role+' v'+CL.version));
// gleichzeitig ändern
const v0=await A.evaluate(()=>P('veal').stock);
await A.evaluate(()=>{receiveIn(P('veal'),5,30,'Test A',new Date().toISOString());P('flour').price=1.05;save();});
await B.evaluate(()=>{addMove('sale','veal',-1.7,'Verkauf B');S.menu.push({id:'m_new_b',section:'Desserts',name:'Topfenstrudel (von B)',desc:'',price:6.9,card:'',img:'',veg:'v',top:false,hidden:false,seasons:[],days:[],alg:'A C G',order:99});save();});
await A.waitForTimeout(2500);await B.waitForTimeout(2500);
await A.evaluate(()=>cloudPoll());await B.evaluate(()=>cloudPoll());await A.waitForTimeout(1500);await B.waitForTimeout(1500);await A.evaluate(()=>cloudPoll());await A.waitForTimeout(1200);
const ra=await A.evaluate(()=>({veal:P('veal').stock,flour:P('flour').price,newItem:!!S.menu.find(m=>m.id==='m_new_b'),moves:S.moves.filter(m=>/Test A|Verkauf B/.test(m.note)).length,v:CL.version}));
const rb=await B.evaluate(()=>({veal:P('veal').stock,flour:P('flour').price,newItem:!!S.menu.find(m=>m.id==='m_new_b'),moves:S.moves.filter(m=>/Test A|Verkauf B/.test(m.note)).length,v:CL.version}));
console.log('start veal',v0,'expected',Math.round((v0+5-1.7)*1000)/1000);console.log('A',JSON.stringify(ra));console.log('B',JSON.stringify(rb));
// Foto von A -> B
await A.evaluate(()=>{const m=S.menu.find(x=>x.name==='Caesar Salat');const id=uid('img');const c=document.createElement('canvas');c.width=40;c.height=30;c.getContext('2d').fillRect(0,0,40,30);imgPut(id,c.toDataURL('image/jpeg'));m.img=id;save();});
await A.waitForTimeout(2500);await B.evaluate(()=>cloudPoll());await B.waitForTimeout(2000);
console.log('photo on B:',await B.evaluate(()=>{const m=S.menu.find(x=>x.name==='Caesar Salat');return !!(m.img&&IMG[m.img]);}),'server files',(await st()).files.length);
// Bestellung per Cloud senden (Inhaber A)
await A.evaluate(()=>{const o=newOrder('sup_wein',false);o.lines.push(lineFor(P('gv'),3));save();view.stab='bestellung';view.order=o.id;go('stock');});await A.waitForTimeout(400);
console.log('cloud send button:',await A.isVisible('[data-act=ordCloudSend]'));await A.screenshot({path:'c-send.png'});
await A.click('[data-act=ordCloudSend]');await A.waitForTimeout(800);
console.log('after send:',await A.evaluate(()=>{const o=ORD(view.order);return o.status+' '+o.sentVia+' '+o.mailId}),'mails',JSON.stringify((await st()).mails));
// Mitarbeiter
const T=await dev('T');await login(T,'tom@x','pw3');await T.click('#dlgForm button[type=submit]');await T.waitForTimeout(600);
const tr=await T.evaluate(()=>{const o=newOrder('sup_gross');save();view.stab='bestellung';view.order=o.id;go('stock');return sendBlockReason(o);});console.log('staff:',tr,'send btn',await T.isVisible('[data-act=ordCloudSend]'));
// Offline + Reconnect
await A.context().setOffline(true);await A.evaluate(()=>{P('salt').price=0.55;save();});await A.waitForTimeout(2200);console.log('offline chip:',await A.evaluate(()=>cloudState));
await A.context().setOffline(false);await A.evaluate(()=>cloudPoll());await A.waitForTimeout(2500);console.log('after reconnect:',await A.evaluate(()=>cloudState+' dirty='+dirty),'server v',(await st()).version);
await B.evaluate(()=>cloudPoll());await B.waitForTimeout(1500);console.log('B salt',await B.evaluate(()=>P('salt').price));
// Reload A: still connected, data intact
await A.reload();await A.waitForTimeout(2000);console.log('A after reload:',await A.evaluate(()=>cloudReady()+' '+cloudState+' veal '+P('veal').stock));
console.log('errors',errs);await b.close();})();
