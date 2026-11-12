const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
const F='http://127.0.0.1:8772/dahuam/index.html?nointro';
const p=await b.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});p.on('pageerror',e=>errs.push(e.message));
await p.goto(F);await p.evaluate(()=>__store.wipe(true));await p.reload();await p.waitForTimeout(1200);const ev=(f,a)=>p.evaluate(f,a);
const cid=await ev(()=>S.cards.find(c=>/Caesar/.test(c.name)&&c.items.some(i=>i.ref==='p:romaine')).id);
await ev(id=>{go('cards');view.card=id;render()},cid);await p.waitForTimeout(300);
const refs=()=>ev(id=>C(id).items.map(i=>i.ref.slice(2)).join(','),cid);
console.log('before',await refs());
// move tile 0 after tile 2
const g=await p.$('[data-grip="0"]');const gb=await g.boundingBox();const t2=await (await p.$('.ti[data-ti="2"]')).boundingBox();
await p.mouse.move(gb.x+5,gb.y+5);await p.mouse.down();await p.mouse.move(gb.x+40,gb.y+20,{steps:5});await p.mouse.move(t2.x+t2.width*0.8,t2.y+t2.height/2,{steps:10});
await p.screenshot({path:'dd-move.png'});await p.mouse.up();await p.waitForTimeout(200);
console.log('after move',await refs());
// drag chip (Sardellen? pick 'lemon') onto plate
await p.fill('#shelfQ','zitro');await p.waitForTimeout(100);
await ev(()=>document.querySelector('.teller').scrollIntoView({block:'start'}));const ch=await p.$('.sh-chip:not([hidden])');const cb=await ch.boundingBox();const pl=await (await p.$('.plate')).boundingBox();
await p.mouse.move(cb.x+10,cb.y+10);await p.mouse.down();await p.mouse.move(cb.x+30,cb.y-20,{steps:5});await p.mouse.move(pl.x+pl.width/2,pl.y+pl.height/2,{steps:12});
await p.screenshot({path:'dd-add.png'});await p.mouse.up();await p.waitForTimeout(300);
console.log('after add',await refs(),'focused',await ev(()=>document.activeElement.id));
// click chip
await p.fill('#shelfQ','kapern');await p.waitForTimeout(100);const n0=(await refs()).split(',').length;await p.click('.sh-chip:not([hidden])');await p.waitForTimeout(200);/* neu: Zutat liegt schon am Teller → bewusst zweimal */await p.click('#toast .toast-act');await p.waitForTimeout(200);console.log('click add',(await refs()).split(',').length-n0);
// keyboard
await p.focus('[data-grip="1"]');await p.keyboard.press('ArrowLeft');await p.waitForTimeout(200);console.log('kbd',await refs(),'focus',await ev(()=>document.activeElement.dataset.grip));
await p.screenshot({path:'dd-after.png'});
// mobile touch
const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const m=await ctx.newPage();m.on('pageerror',e=>errs.push('m '+e.message));
await m.goto(F);await m.waitForTimeout(900);await m.evaluate(id=>{go('cards');view.card=id;render();document.querySelector('.shelf').scrollIntoView({block:'center'})},cid);await m.waitForTimeout(300);
console.log('m width',await m.evaluate(()=>document.documentElement.scrollWidth));await m.screenshot({path:'dd-m.png'});
// simulate touch drag of chip via CDP
const cdp=await ctx.newCDPSession(m);const c2=await (await m.$('.sh-chip')).boundingBox();const tl=await (await m.$('.ti-add')).boundingBox();
const tp=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
const before=await m.evaluate(id=>C(id).items.length,cid);
await tp('touchStart',c2.x+10,c2.y+10);for(let i=1;i<=12;i++){await tp('touchMove',c2.x+10,c2.y+10-(c2.y-(tl.y+10))*i/12);}await tp('touchEnd');await m.waitForTimeout(300);
console.log('m touch add',await m.evaluate(id=>C(id).items.length,cid)-before);
console.log('errors',errs);await b.close();})();
