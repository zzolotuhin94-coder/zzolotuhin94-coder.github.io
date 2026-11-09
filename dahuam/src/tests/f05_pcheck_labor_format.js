// Findings 7, 11, 24, 25, 28, 31
const L=require('./lib');const ok=L.ok;
(async()=>{const {b,p,errs}=await L.open({});const ev=(f,a)=>p.evaluate(f,a);const toastT=()=>ev(()=>$('#toast').textContent);
// ---------- 11 Preis-Check
await ev(()=>go('products'));await p.waitForTimeout(200);await p.click('#app .page-h [data-act=pcStart]');await p.waitForTimeout(300);
const cur=()=>ev(()=>{const pc=view.pc;const pr=P(pc.q[pc.i]);return {i:pc.i,id:pr&&pr.id,price:pr&&pr.price,demo:pr&&pr.priceDemo,saved:pc.saved,conf:pc.confirmed,msg:document.querySelector('#pcMsg')?.innerText||''}});
const c0=await cur();
for(const v of ['abc','0','-4']){await p.fill('#pcIn',v);await p.keyboard.press('Enter');await p.waitForTimeout(200);const c=await cur();ok(c.i===0&&c.demo===true&&c.price===c0.price&&c.conf===0&&c.saved===0&&c.msg.length>10,`Preis-Check "${v}": stays on card, not confirmed, hint shown`,c.msg);}
await p.fill('#pcIn','abc');await p.click('[data-act=pcSave]');await p.waitForTimeout(200);ok((await cur()).i===0&&(await cur()).demo===true,'invalid + click „Übernehmen“ does not confirm either');
const big=(c0.price*50).toFixed(2).replace('.',',');
await p.fill('#pcIn',big);await p.keyboard.press('Enter');await p.waitForTimeout(200);let c=await cur();
ok(c.i===0&&c.price===c0.price&&/^Wirklich €\s[\d.,]+ je (kg|l|Stk)\?/.test(c.msg),'factor > 5: plausibility question',c.msg);
await p.fill('#pcIn',(c0.price*1.1).toFixed(2).replace('.',','));await p.keyboard.press('Enter');await p.waitForTimeout(250);c=await cur();
ok(c.i===1&&c.saved===1&&await ev(id=>P(id).priceDemo===false&&P(id).priceSrc==='Preis-Check',c0.id),'plausible price accepted, next card');
ok(await p.locator('[data-act=pcBack]').count()>=1,'„Zurück“ available');
await p.locator('[data-act=pcBack]').first().click();await p.waitForTimeout(250);c=await cur();
ok(c.i===0&&c.saved===0&&c.price===c0.price&&c.demo===true,'„Zurück“ goes one step back and undoes the price change',c);
await p.fill('#pcIn','');await p.keyboard.press('Enter');await p.waitForTimeout(250);c=await cur();ok(c.i===1&&c.conf===1,'empty + Enter confirms the Richtwert (as documented under the field)');
await p.keyboard.press('Escape');await p.waitForTimeout(200);await p.locator('[data-act=pcBack]').first().click();await p.waitForTimeout(200);ok((await cur()).i===1,'Zurück after skip');
await p.click('[data-act=pcEnd]');await p.waitForTimeout(250);ok(await ev(()=>view.tab)==='products','„Beenden“ returns to Produkte (where it was started)',await ev(()=>view.tab));
await ev(()=>go('aufbau'));await p.waitForTimeout(200);await ev(()=>document.querySelector('#app [data-act=pcStart]').click());await p.waitForTimeout(250);await p.click('[data-act=pcEnd]');await p.waitForTimeout(200);ok(await ev(()=>view.tab)==='aufbau','…to Aufbau when started there');
await ev(()=>{setV('teller','teller');go('cards','dish_kaiser')});await p.waitForTimeout(250);
if(await p.locator('[data-act=pcFor]').count()){await p.locator('[data-act=pcFor]').first().click();await p.waitForTimeout(250);await p.click('[data-act=pcEnd]');await p.waitForTimeout(250);ok(await ev(()=>view.tab==='cards'&&view.card==='dish_kaiser'),'…to the recipe when started there');}
// ---------- 25 Rezept-Labor
await ev(()=>go('labor'));await p.waitForTimeout(250);
ok(await ev(()=>{const b=document.querySelector('.lab-go');const cs=getComputedStyle(b);return b.disabled&&cs.cursor==='not-allowed'&&(cs.backgroundColor!==getComputedStyle(document.querySelector('.btn.primary:not(:disabled)')||document.body).backgroundColor)}),'disabled „Rezepte erfinden“ looks disabled');
await p.fill('#labIn','Speck');await p.keyboard.press('Enter');await p.waitForTimeout(250);
ok(await ev(()=>labState().ings.some(x=>x.ref==='p:speck'))&&/Tiroler Speck g\.g\.A\./.test(await ev(()=>document.querySelector('.lab-ings').innerText)),'„Speck“ finds „Tiroler Speck g.g.A.“',await ev(()=>document.querySelector('.lab-ings').innerText));
await p.fill('#labIn','zwie');await p.keyboard.press('Enter');await p.waitForTimeout(250);
const picks=await ev(()=>[...document.querySelectorAll('.lab-pick .chip')].map(c=>c.textContent));ok(picks.length>=3&&picks.some(x=>/als neue Zutat/.test(x)),'several matches → pick list',picks);
await p.locator('.lab-pick .chip').first().click();await p.waitForTimeout(250);ok(await ev(()=>labState().ings.length===2&&!!labState().ings[1].ref),'pick adds the chosen product');
await p.fill('#labIn','Trüffelspäne');await p.keyboard.press('Enter');await p.waitForTimeout(250);
ok(await ev(()=>{const c=[...document.querySelectorAll('.lab-ing.free')];return c.length===1&&/neu/i.test(c[0].querySelector('small').textContent)}),'unknown word allowed and marked „neu“');
const np=await ev(()=>S.products.length),nc=await ev(()=>S.cards.length);
await p.click('.lab-go');await p.waitForSelector('.lab-card');await p.waitForTimeout(200);await p.locator('[data-act=labTake]').first().click();await p.waitForTimeout(250);
const dt=await ev(()=>$('#dlg').open?$('#dlg').innerText:'');ok(/Neue Produkte anlegen\?/.test(dt)&&/Trüffelspäne/.test(dt)&&await ev(()=>S.products.length)===np&&await ev(()=>S.cards.length)===nc,'taking over asks first and lists the new products',dt.replace(/\s+/g,' ').slice(0,160));
await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(350);ok(await ev(()=>S.products.length)===np+1&&await ev(()=>S.cards.length)===nc+1&&await ev(()=>view.tab==='cards'&&!!view.card),'…then creates recipe + product');
// ---------- 7 formats
await ev(()=>{view.rp.unit='year';view.rp.ref=isoDate(new Date());go('report')});await p.waitForTimeout(300);
const txt=await ev(()=>document.querySelector('#app').innerText);
ok(await ev(()=>num(26796)==='26.796'&&num(1234.5,1)==='1.234,5'&&num2(1234.5)==='1.234,50'&&pct(16.4)==='16,4 %'&&/1\.234,50/.test(eur(1234.5))),'one German number format (26.796 · 1.234,50 · 16,4 %)');
ok(!/\d[   ]\d{3}(?!\d)/.test(txt.replace(/\d{2}\.\d{2}\.\d{4}/g,'')),'no space-grouped thousands on the Auswertung page',(txt.match(/\d[   ]\d{3}(?!\d)/)||[])[0]);
ok(!/\d%/.test(txt),'percent always with a space',(txt.match(/.{6}\d%/)||[])[0]);
for(const t of ['dash','menu','cards','stock','products','buy']){await ev(t=>go(t),t);await p.waitForTimeout(200);const x=await ev(()=>document.querySelector('#app').innerText);ok(!/\d%/.test(x),`${t}: no „13%“ without space`,(x.match(/.{8}\d%/)||[])[0]);}
// dialogs / Wareneingang: no raw dots
await ev(()=>{P('pork').price=13.2;moveDlg('in:pork')});ok(await p.inputValue('#mvPrice')==='13,20','Wareneingang dialog price 13,20',await p.inputValue('#mvPrice'));await ev(()=>$('#dlg').close());
await ev(()=>{P('pork').lossHot=13.9;prodDialog(P('pork'))});ok(await p.inputValue('#dlgForm [name=lossHot]')==='13,9'&&await p.inputValue('#dlgForm [name=price]')==='13,2','product dialog 13,9 / 13,2',[await p.inputValue('#dlgForm [name=lossHot]'),await p.inputValue('#dlgForm [name=price]')]);
ok(await ev(()=>[...document.querySelectorAll('#dlgForm input[type=number]')].length)===0,'product dialog: no type=number fields');await ev(()=>$('#dlg').close());
await ev(()=>{const o=S.orders.find(o=>o.status==='confirmed');o.lines[0].invPrice=13.9;view.order=o.id;view.recv=o.id;go('buy')});await p.waitForTimeout(250);
ok(await p.inputValue('#rp-0')==='13,90'&&await ev(()=>document.querySelectorAll('#app table.recv input[type=number]').length)===0,'Wareneingang prüfen: 13,90, text fields',await p.inputValue('#rp-0'));
await p.fill('#rd-0','1,5');await p.keyboard.press('Tab');await p.waitForTimeout(150);ok(await ev(()=>ORD(view.order).lines[0].delivered)===1.5,'delivered 1,5 with comma');
await p.fill('#rd-0','-2');await p.keyboard.press('Tab');await p.waitForTimeout(150);ok(await ev(()=>ORD(view.order).lines[0].delivered)===1.5&&await p.inputValue('#rd-0')==='1,5','delivered −2 rejected, old value back',await p.inputValue('#rd-0'));
// ---------- 24 report desktop
for(const w of [1100,1280,1440]){await p.setViewportSize({width:w,height:900});await ev(()=>{view.order=null;view.recv=null;view.rp.unit='year';view.rp.cmp='year';go('report')});await p.waitForTimeout(300);
 const r=await ev(()=>{const wrap=document.querySelector('.lt-wrap:has(.rp-items)').getBoundingClientRect();const cells=[...document.querySelectorAll('.rp-items thead th')].filter(t=>t.getBoundingClientRect().width>0);const last=cells[cells.length-1].getBoundingClientRect();
  const th=document.querySelector('.rp-items thead th');const g=document.querySelector('.rp-items tr.grp td');window.scrollTo(0,document.querySelector('.rp-items tbody tr:nth-child(12)').getBoundingClientRect().top+scrollY-60);const a=th.getBoundingClientRect(),c=document.querySelectorAll('.rp-items tr.grp td')[0].getBoundingClientRect();
  const stuck=[...document.querySelectorAll('.rp-items tr.grp td')].map(x=>x.getBoundingClientRect()).filter(x=>x.top<a.bottom+2&&x.top>=a.top)[0];
  const mx=[...document.querySelectorAll('.rp-matrix g.pt text')].every(t=>{const bb=t.getBBox();return bb.x>=40&&bb.x+bb.width<=520});
  return {clip:last.right<=wrap.right+0.5,sw:document.documentElement.scrollWidth<=innerWidth,gap:stuck?Math.round((stuck.top-a.bottom)*10)/10:null,mx,n:cells.length}});
 ok(r.clip&&r.sw,`report ${w}px: item table not clipped at the right edge (${r.n} columns)`,r);ok(r.gap!==null&&r.gap<=0,`report ${w}px: no row sliver between header and group row`,r.gap);ok(r.mx,`report ${w}px: Menü-Matrix labels not cut`);}
await p.setViewportSize({width:1440,height:900});
// ---------- 28 draft rows aligned, 31 setup without holes
await ev(()=>{const o=newOrder('sup_gross');view.stab='bestellung';view.order=o.id;go('buy')});await p.waitForTimeout(250);
ok(await ev(()=>{const xs=[...document.querySelectorAll('table.otab input[data-ol]')].map(i=>Math.round(i.getBoundingClientRect().left)+':'+Math.round(i.getBoundingClientRect().width));return xs.length>1&&new Set(xs).size===1}),'draft order: quantity fields aligned');
ok(await ev(()=>{const o=ORD(view.order),sp=SUP(o.supplier);const below=orderTotal(o)<sp.minOrder;const el=[...document.querySelectorAll('.kv span')].find(s=>s.textContent==='Mindestbestellwert').nextElementSibling;const red=el.classList.contains('bad-t');o.lines[0].n=999;render();const el2=[...document.querySelectorAll('.kv span')].find(s=>s.textContent==='Mindestbestellwert').nextElementSibling;return red===below&&!el2.classList.contains('bad-t')&&/erreicht/.test(el2.textContent)}),'Mindestbestellwert red only when below');
await ev(()=>go('setup'));await p.waitForTimeout(250);
ok(await ev(()=>{const ps=[...document.querySelectorAll('.setup-grid > .panel')].map(x=>x.getBoundingClientRect());const cols={};ps.forEach(r=>{(cols[Math.round(r.left)]=cols[Math.round(r.left)]||[]).push(r)});return Object.values(cols).every(c=>c.sort((a,b)=>a.top-b.top).every((r,i)=>i===0||r.top-c[i-1].bottom<=24))}),'Einstellungen: no large holes between cards');
await L.done(b,errs);})();
