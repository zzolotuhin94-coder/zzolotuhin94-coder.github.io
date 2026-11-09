// every mini guide starts from the "?" and can be walked to the end (desktop + phone)
const {L,ok,done,T,settle,PHONE}=require('./h');
const CTX=[
 ['aufbau',()=>go('aufbau'),4],['dash',()=>go('dash'),4],['menu',()=>{view.mtab='calc';view.sec='all';setV('menu','list');go('menu')},5],['guest',()=>{view.mtab='guest';go('menu')},4],['plan',()=>{view.mtab='plan';go('menu')},3],['layout',()=>{view.mtab='layout';go('menu')},4],
 ['cards',()=>{view.card=null;setV('cards','list');go('cards')},3],['card',()=>{setV('teller','teller');go('cards','dish_schnitzel_pork')},6],['labor',()=>go('labor'),3],
 ['stock',()=>{view.order=null;view.recv=null;view.stab='bestand';go('stock')},5],['moves',()=>{view.stab='buchungen';go('stock')},2],['inventur',()=>{S.invDraft=null;view.stab='inventur';go('stock')},1],['inventur',()=>{S.invDraft={date:new Date().toISOString(),counts:{}};view.stab='inventur';go('stock')},3],
 ['buy',()=>{view.stab='bestellung';view.order=null;view.recv=null;go('buy')},4],['suppliers',()=>{view.stab='lieferanten';go('buy')},3],['order',()=>{const o=draftFor('sup_gross')||newOrder('sup_gross');view.stab='bestellung';view.order=o.id;view.recv=null;go('buy')},5],['recv',()=>{const o=S.orders.find(o=>o.status==='confirmed'||o.status==='sent');view.stab='bestellung';view.order=o.id;view.recv=o.id;go('buy')},5],
 ['products',()=>{view.order=null;view.recv=null;go('products')},4],['pcheck',()=>pcStart(),3],['report',()=>{view.rp.tab='sales';go('report')},5],['rimport',()=>{view.rp.tab='import';go('report')},4],['rmap',()=>{view.rp.tab='map';go('report')},1],['setup',()=>go('setup'),4]];
async function run(opts,label,W,H){
 const {b,p,errs}=await L.open(opts);
 for(const [id,setup,min] of CTX){
  await p.evaluate(setup);await settle(p,300);
  const q=await p.$('#app .page-h .wozu-q[data-act="guideHere"], #app .crumb-q[data-act="guideHere"]');
  if(!q){ok(false,`${label} ${id}: "?" present`);continue;}
  const qh=await q.evaluate(e=>{const r=e.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)]});
  await q.click();await settle(p,450);
  let t=await T(p); if(!t){ok(false,`${label} ${id}: guide starts`);continue;}
  const seen=[];let bad=[];let guard=0;
  while(t&&t.id===id&&guard++<10){await settle(p,t.found?250:1150);t=await T(p);if(!t||t.id!==id)break;
   if(t.found){seen.push(t.title);if(t.cr[0]<0||t.cr[2]>W||t.cr[1]<0||t.cr[3]>H||(opts.mobile&&t.sw!==W)||t.hr[2]<8) bad.push([t.title,t.hr,t.cr,t.sw]);}
   const last=t.i===t.n-1;await p.click('#gd [data-gd="next"]');await settle(p,200);const t2=await T(p);if(last||!t2||t2.id!==id){t=t2;break;}t=t2;}
  await settle(p,200);const still=await p.evaluate(()=>GD.t?GD.t.id:null);
  const need=opts.mobile&&id==='products'?3:min;ok(t0(id,still)&&seen.length>=need&&bad.length===0,`${label} ${id}: ${seen.length} steps shown (≥ ${min}), ends cleanly`,{seen,bad,still,qh});
  if(opts.mobile) ok(qh[0]>=40&&qh[1]>=40,`${label} ${id}: "?" is ≥ 40 px`,qh);
  await p.evaluate(()=>{tourEnd(true);const d=document.querySelector('dialog[open]');if(d)d.close()});
 }
 return {b,errs};
}
// buy chains into the order guide when the user really prepared an order; otherwise nothing may be left
function t0(id,still){return still===null||(id==='buy'&&still==='order')}
(async()=>{
 const a=await run({},'desktop',1440,900);console.log('errors',JSON.stringify(a.errs));await a.b.close();
 const m=await run(PHONE,'phone',390,844);
 if(a.errs.length) L.ok(false,'desktop console errors',a.errs);
 await done(m.b,m.errs);
})();
