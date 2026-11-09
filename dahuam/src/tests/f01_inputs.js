// Findings 1, 2, 7 (inputs), 8 (focus)
const L=require('./lib');const ok=L.ok;
(async()=>{const {b,p,errs}=await L.open({});
const toastT=()=>p.evaluate(()=>$('#toast').classList.contains('show')?$('#toast').textContent:'');
const foc=()=>p.evaluate(()=>{const a=document.activeElement;return a?(a.tagName+'#'+a.id):''});
const type=async(sel,v,key='Tab')=>{await p.locator(sel).click();await p.keyboard.press('Control+a');if(v==='')await p.keyboard.press('Delete');else await p.keyboard.type(v);await p.keyboard.press(key);await p.waitForTimeout(160);};
// --- 1 menu price
await p.evaluate(()=>go('menu'));await p.waitForTimeout(250);
const ids=await p.evaluate(()=>[...document.querySelectorAll('input[data-mp]')].slice(0,3).map(i=>i.dataset.mp));
const mp=id=>p.evaluate(id=>S.menu.find(m=>m.id===id).price,ids[0]);
const p0=await mp();
for(const v of ['abc','-3','','12abc','--']){ await type('#mp-'+ids[0],v); ok(await mp()===p0,`menu price "${v}" keeps ${p0}`,await mp()); ok(/Ungültiger Preis, nicht geändert/.test(await toastT()),`  hint toast for "${v}"`,await toastT()); ok(await p.locator('#mp-'+ids[0]).inputValue()===await p.evaluate(v=>num2(v),p0),'  field shows old value',await p.locator('#mp-'+ids[0]).inputValue()); await p.waitForTimeout(2300);}
await type('#mp-'+ids[0],'15,5'); ok(await mp()===15.5,'menu price 15,5 (comma)',await mp());
ok(/^BUTTON/.test(await foc()),'Tab → next element in row keeps focus after re-render',await foc());
await type('#mp-'+ids[0],'14.9'); ok(await mp()===14.9,'menu price 14.9 (dot)',await mp());
await type('#mp-'+ids[0],'1.234,5'); ok(await mp()===1234.5,'menu price 1.234,5',await mp());
ok(await p.locator('#mp-'+ids[0]).inputValue()==='1.234,50','German thousands display in field',await p.locator('#mp-'+ids[0]).inputValue());
await type('#mp-'+ids[0],String(p0).replace('.',','),'Enter'); ok(await mp()===p0,'restore via Enter');
ok(await foc()==='INPUT#mp-'+ids[1],'Enter moves to next row price',await foc());
ok(await p.evaluate(()=>!$('#dlg').open&&view.tab==='menu'),'Enter does not open anything');
// focus after Tab lands on a real element
await type('#mp-'+ids[1],'13,3'); const f1=await foc(); ok(f1!=='BODY#' && f1!=='', 'Tab after change: focus stays in page',f1);
await p.evaluate(()=>go('menu'));
// --- 1 product price
await p.evaluate(()=>go('products'));await p.waitForTimeout(250);
const pid=await p.evaluate(()=>document.querySelector('input[data-pp]').dataset.pp); const pid2=await p.evaluate(()=>document.querySelectorAll('input[data-pp]')[1].dataset.pp);
const pp=()=>p.evaluate(id=>({price:P(id).price,demo:P(id).priceDemo}),pid); const q0=await pp();
for(const v of ['abc','-2','']){ await type('#pp-'+pid,v); const q=await pp(); ok(q.price===q0.price&&q.demo===q0.demo,`product price "${v}" unchanged, not confirmed`,q); ok(/Ungültiger Preis, nicht geändert/.test(await toastT()),'  hint toast',await toastT()); await p.waitForTimeout(2300);}
await type('#pp-'+pid,'0,85','Enter'); ok((await pp()).price===0.85,'product price 0,85',await pp()); ok(await foc()==='INPUT#pp-'+pid2,'Enter → next product price',await foc());
await type('#pp-'+pid,String(q0.price).replace('.',','));
// --- 2 recipe qty (Teller)
const cid=await p.evaluate(()=>S.cards.find(c=>c.id==='dish_kaiser').id);
await p.evaluate(id=>{setV('teller','teller');go('cards',id)},cid);await p.waitForTimeout(300);
const qty=i=>p.evaluate(([id,i])=>C(id).items[i].qty,[cid,i]); const a0=await qty(0);
for(const v of ['-50','abc']){ await type('#qty-0',v); ok(await qty(0)===a0,`teller qty "${v}" keeps ${a0}`,await qty(0)); ok(/nicht geändert/.test(await toastT()),'  hint',await toastT()); await p.waitForTimeout(2300);}
await type('#qty-0','125,5'); ok(await qty(0)===125.5,'teller qty 125,5',await qty(0)); ok(await foc()!=='BODY#','focus kept after Tab',await foc());
await type('#qty-0','130','Enter'); ok(await qty(0)===130,'teller qty Enter'); ok(await foc()==='INPUT#qty-1','Enter → next ingredient qty',await foc());
// Tabelle
await p.evaluate(()=>{setV('teller','table');render()});await p.waitForTimeout(250);
for(const v of ['-1','x']){ await type('#qty-1',v); ok(await qty(1)===await p.evaluate(([id])=>C(id).items[1].qty,[cid]) && (await qty(1))>=0,`table qty "${v}" rejected`,await qty(1)); await p.waitForTimeout(300);}
const n0=await p.evaluate(id=>C(id).items[0].net,cid);
await type('#net-0','-5'); ok(await p.evaluate(id=>C(id).items[0].net,cid)===n0,'table net -5 rejected');
await type('#qty-1','260'); ok(await qty(1)===260,'table qty 260'); ok(await foc()==='INPUT#net-1','Tab → next field (net)',await foc());
// yield / Portionsgewicht
const y0=await p.evaluate(id=>C(id).yieldG,cid);
await p.waitForTimeout(2300);
for(const v of ['-100','abc']){ await type('#cf-yieldG',v); ok(await p.evaluate(id=>C(id).yieldG,cid)===y0,`yield "${v}" keeps ${y0}`); ok(/nicht geändert/.test(await toastT()) && !/Gespeichert/.test(await toastT()),'  hint, no Gespeichert',await toastT()); await p.waitForTimeout(2300);}
await type('#cf-yieldG','412,5'); ok(await p.evaluate(id=>C(id).yieldG,cid)===412.5,'yield 412,5');
await type('#cf-yieldG',''); ok(await p.evaluate(id=>C(id).yieldG,cid)==='','empty yield allowed');
ok(await p.evaluate(()=>/—/.test([...document.querySelectorAll('.hero-stats div')].find(d=>/pro 100 g/.test(d.textContent)).textContent)),'empty Portionsgewicht shows — for pro 100 g');
await type('#cf-yieldG',String(y0));
await p.evaluate(()=>{setV('teller','teller');render()});
// --- order qty
await p.evaluate(()=>{const o=newOrder(S.suppliers[0].id);if(!o.lines.length)o.lines.push(lineFor(supProducts(o.supplier)[0],2),lineFor(supProducts(o.supplier)[1],1));else if(o.lines.length<2)o.lines.push(lineFor(supProducts(o.supplier).find(x=>x.id!==o.lines[0].pid),1));view.stab='bestellung';view.order=o.id;go('buy')});await p.waitForTimeout(300);
const oq=()=>p.evaluate(()=>ORD(view.order).lines[0].n); const o0=await oq();
await p.waitForTimeout(2300);
for(const v of ['-4','abc','']){ await type('#ol-0',v); ok(await oq()===o0,`order qty "${v}" keeps ${o0}`,await oq()); ok(/nicht geändert/.test(await toastT()),'  hint',await toastT()); await p.waitForTimeout(2300);}
await type('#ol-0','3,5','Enter'); ok(await oq()===3.5,'order qty 3,5'); ok(await foc()==='INPUT#ol-1','Enter → next order line',await foc());
// --- settings
await p.evaluate(()=>go('setup'));await p.waitForTimeout(250);
const tg=()=>p.evaluate(()=>S.settings.target);
await p.waitForTimeout(2300);
for(const v of ['abc','-5','250','']){ await type('#s-target',v); ok(await tg()===28,`target "${v}" keeps 28`,await tg()); const t=await toastT(); ok(/nicht geändert/.test(t)&&!/^Gespeichert/.test(t),'  hint instead of Gespeichert',t); await p.waitForTimeout(2300);}
await type('#s-target','27,5'); ok(await tg()===27.5,'target 27,5'); ok(/Gespeichert/.test(await toastT()),'saved toast'); ok(await p.locator('#s-target').inputValue()==='27,5','German display 27,5');
await type('#s-target','28');
await p.waitForTimeout(2300);
await type('#s-vat','x'); ok(await p.evaluate(()=>S.settings.vat)===10,'vat x rejected');
await type('#s-limit','-1'); ok(await p.evaluate(()=>S.settings.orderLimit)===800,'limit -1 rejected');
// dialogs: product price with comma, negative rejected
await p.evaluate(()=>prodDialog(P('pork')));await p.waitForTimeout(150);
await p.fill('#dlgForm [name=price]','-4');await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(150);
ok(await p.evaluate(()=>$('#dlg').open && !!document.querySelector('#dlgForm .f-err')),'dialog: negative price blocked with inline hint');
await p.fill('#dlgForm [name=price]','9,45');await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(150);
ok(await p.evaluate(()=>P('pork').price)===9.45,'dialog: 9,45 saved',await p.evaluate(()=>P('pork').price));
await p.evaluate(()=>menuDialog(S.menu[0]));await p.waitForTimeout(150);
ok(/^\d+,\d\d$/.test(await p.inputValue('#dlgForm [name=price]')),'menu dialog price German',await p.inputValue('#dlgForm [name=price]'));
await p.fill('#dlgForm [name=price]','abc');await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(150);
ok(await p.evaluate(()=>$('#dlg').open),'menu dialog: letters blocked');await p.evaluate(()=>$('#dlg').close());
await L.done(b,errs);})();
