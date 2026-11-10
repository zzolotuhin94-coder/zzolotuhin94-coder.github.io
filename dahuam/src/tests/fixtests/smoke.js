const L=require('./lib');
(async()=>{const {b,p,errs}=await L.open({});
for(const t of ['aufbau','dash','menu','cards','stock','buy','products','report','setup','labor','pcheck']){await p.evaluate(t=>go(t),t);await p.waitForTimeout(150);}
for(const mt of ['guest','plan','layout','calc']){await p.evaluate(t=>{view.mtab=t;go('menu')},mt);await p.waitForTimeout(250);}
for(const st of ['buchungen','inventur','bestand']){await p.evaluate(t=>{view.stab=t;go('stock')},st);await p.waitForTimeout(150);}
for(const st of ['import','map','sales']){await p.evaluate(t=>{view.rp.tab=t;go('report')},st);await p.waitForTimeout(150);}
await p.evaluate(()=>go('cards',S.cards[6].id));await p.waitForTimeout(200);
await p.evaluate(()=>{setV('teller','table');render()});await p.waitForTimeout(200);await p.evaluate(()=>{setV('teller','teller');render()});
await p.evaluate(()=>{view.stab='bestellung';view.order=S.orders[1].id;go('buy')});await p.waitForTimeout(200);
await p.evaluate(()=>{view.order=S.orders[S.orders.length-1].id;view.recv=view.order;go('buy')});await p.waitForTimeout(200);
for(const d of ['moveDlg("in")','moveDlg("out")','salesDlg()','prodDialog(S.products[0])','menuDialog(S.menu[0])','exportData()','supplierDialog(S.suppliers[0])','specialDialog(S.specials[0])','priceFixDialog([S.products[0].id])','palOpen()']){await p.evaluate(d=>{eval(d)},d);await p.waitForTimeout(120);await p.evaluate(()=>{if($('#dlg').open)$('#dlg').close();palClose()});}
await L.done(b,errs);})();
