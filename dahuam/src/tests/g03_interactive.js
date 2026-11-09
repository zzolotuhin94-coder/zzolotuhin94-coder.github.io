// interactive steps wait for the real action, give feedback, then advance
const {L,ok,done,T,settle,PHONE}=require('./h');
(async()=>{
const {b,p,errs}=await L.open();
// Speisekarte: type a price + Enter
await p.evaluate(()=>{view.mtab='calc';view.sec='all';go('menu');tourStart('menu');tourGo(2,1)});await settle(p,600);
let t=await T(p);ok(t.title==='Preis ändern'&&t.doing&&/open/.test(t.hole),'price step is interactive, spotlight is open',t.hole);
ok(await p.evaluate(()=>document.activeElement.matches('input[data-mp]')),'focus is in the price field');
ok(await p.evaluate(()=>/Tippen Sie hier einen Preis ein und drücken Sie Enter/.test(document.querySelector('#gd .gd-do').textContent)),'hint tells what to do');
await settle(p,1500);t=await T(p);ok(t.i===2&&!t.ok,'does not advance by itself');
const before=await p.evaluate(()=>S.menu.find(m=>m.id===document.activeElement.dataset.mp).price);
await p.keyboard.type('15,50');await p.keyboard.press('Enter');await settle(p,350);
t=await T(p);ok(t.ok&&t.i===2,'after the real change: positive feedback on the card',await p.evaluate(()=>document.querySelector('#gd .gd-do').textContent));
ok(await p.evaluate(()=>S.menu.some(m=>m.price===15.5)),'the price was really saved',before);
await settle(p,1400);t=await T(p);ok(t.i===3&&t.title==='Filter','then advances to the next step',t.title);
await p.evaluate(()=>tourEnd(true));
// outside clicks are blocked while a tour runs
await p.evaluate(()=>{go('menu');tourStart('menu')});await settle(p,500);
const before2=await p.evaluate(()=>view.mtab);await p.mouse.click(700,500);await p.mouse.click(120,290);await settle(p,200);
ok(await p.evaluate(m=>view.tab==='menu'&&view.mtab===m&&!document.querySelector('dialog[open]')&&!!GD.t,before2),'clicks outside the card do nothing during a tour');
await p.evaluate(()=>tourEnd(true));
// Preis-Check
await p.evaluate(()=>{pcStart();tourStart('pcheck');tourGo(1,1)});await settle(p,600);
t=await T(p);ok(t.title==='Ihr Preis'&&t.doing,'Preis-Check: price step interactive');
const pid=await p.evaluate(()=>view.pc.q[view.pc.i]);
await p.keyboard.type('7,77');await p.keyboard.press('Enter');await settle(p,300);t=await T(p);
ok(t.ok&&await p.evaluate(id=>P(id).price===7.77&&!P(id).priceDemo,pid),'Preis-Check: Enter saves the price, feedback shown');
await settle(p,1400);t=await T(p);ok(t.i===2,'Preis-Check: advances',t.title);
await p.keyboard.press('Escape');await settle(p,200);
ok(await p.evaluate(()=>!GD.t&&view.pc&&view.pc.skipped===0),'Esc ends the guide and does not skip a product in the Preis-Check behind it');
// Inventur: start + count
await p.evaluate(()=>{S.invDraft=null;view.stab='inventur';go('stock');tourStart('inventur')});await settle(p,600);
t=await T(p);ok(t.title==='Inventur starten'&&t.doing,'Inventur: first step waits for the start button');
await p.click('#app [data-act="invStart"]');await settle(p,300);t=await T(p);ok(t.ok,'Inventur started → feedback');
await settle(p,1500);t=await T(p);ok(t.title==='Zählen'&&t.doing,'→ Zählen');
await p.keyboard.type('3');await settle(p,400);t=await T(p);ok(t.ok,'typing a count → feedback');
await settle(p,1400);t=await T(p);ok(t.i>=2,'→ next step',t.title);
await p.evaluate(()=>{tourEnd(true);S.invDraft=null;save()});
// Rezepturen: open a row, guide continues on the detail
await p.evaluate(()=>{view.card=null;setV('cards','list');go('cards');tourStart('cards');tourGo(2,1)});await settle(p,600);
await p.click('#app table.lt tbody tr.row');await settle(p,1900);t=await T(p);
ok(t&&t.title==='Der Teller'&&!!t.card,'Rezepturen: opening a row continues on the Teller',t&&t.title);
await p.evaluate(()=>tourEnd(true));
// Weiter always works without doing the action
await p.evaluate(()=>{go('products');tourStart('products');tourGo(1,1)});await settle(p,600);
await p.click('#gd [data-gd="next"]');await settle(p,400);t=await T(p);ok(t.i===2,'Weiter skips an interactive step without the action');
await p.evaluate(()=>tourEnd(true));
// staff: read-only → no "do", explanation instead
await p.evaluate(()=>{S.settings.currentUser='u_staff';save();view.mtab='calc';go('menu');tourStart('menu');tourGo(2,1)});await settle(p,600);
t=await T(p);ok(t.title==='Preis ändern'&&!t.doing&&await p.evaluate(()=>/nur Küchenchef und Inhaber/.test(document.querySelector('#gd .gd-ro').textContent)),'staff: price step is explained, not interactive');
await p.evaluate(()=>{tourEnd(true);S.invDraft=null;view.stab='inventur';go('stock');tourStart('inventur')});await settle(p,600);
t=await T(p);ok(t.doing,'staff: Inventur step stays interactive (staff may count)');
await p.evaluate(()=>{tourEnd(true);S.settings.currentUser='u_chef';save()});
await done(b,errs);
})();
