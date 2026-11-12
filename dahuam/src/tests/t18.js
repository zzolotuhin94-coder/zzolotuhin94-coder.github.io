const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const ctx=await b.newContext({acceptDownloads:true,viewport:{width:1440,height:960}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8775/dahuam/index.html?nointro');await p.evaluate(()=>__store.wipe(true));await p.reload();await p.waitForTimeout(1000);
await p.evaluate(()=>{view.mtab='guest';go('menu')});await p.waitForTimeout(400);
console.log('btns',await p.evaluate(()=>[...document.querySelectorAll('.page-h .row-btns button')].map(b=>b.textContent.trim()).join(' | ')));
const [d]=await Promise.all([p.waitForEvent('download',{timeout:60000}),p.click('[data-pdf=printMenu]')]);
await d.saveAs('menu.pdf');console.log('menu pdf',d.suggestedFilename());
const cid=await p.evaluate(()=>S.cards.find(c=>/Caesar/.test(c.name)&&c.type==='dish').id);
await p.evaluate(id=>{go('cards');view.card=id;render()},cid);await p.waitForTimeout(300);
const [d2]=await Promise.all([p.waitForEvent('download',{timeout:60000}),p.click('[data-pdf=printCard]')]);await d2.saveAs('card.pdf');console.log('card pdf',d2.suggestedFilename());
// framed
const f=await ctx.newPage();f.on('pageerror',e=>errs.push('f '+e.message));await f.setContent('<iframe src="http://127.0.0.1:8775/dahuam/index.html?nointro" style="width:1400px;height:900px"></iframe>');await f.waitForTimeout(1500);
const fr=f.frames()[1];await fr.evaluate(()=>{view.mtab='guest';go('menu')});await fr.waitForTimeout(300);
console.log('framed btns',await fr.evaluate(()=>[...document.querySelectorAll('.page-h .row-btns button')].map(b=>b.textContent.trim()).join(' | ')));
await fr.evaluate(id=>{go('cards');view.card=id;render()},cid);console.log('framed card pdf btn',await fr.evaluate(()=>!!document.querySelector('[data-pdf=printCard]')));
console.log(errs);await b.close();})();
