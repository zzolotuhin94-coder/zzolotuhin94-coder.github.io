const {L,PHONE}=require('./h');
(async()=>{const {b,p}=await L.open(PHONE);
for(const [n,f] of [['menu',()=>{view.mtab='calc';go('menu')}],['cards',()=>go('cards')],['products',()=>go('products')],['report',()=>{view.rp.tab='sales';go('report')}],['stock',()=>{view.stab='bestand';go('stock')}]]){
await p.evaluate(()=>setMode('simple',true));await p.evaluate(f);await p.waitForTimeout(300);
console.log(n,await p.evaluate(()=>[...document.querySelectorAll('#app .lt-wrap')].map(w=>w.scrollWidth+'/'+w.clientWidth+' '+[...w.querySelectorAll('thead th')].filter(t=>t.getClientRects().length).map(t=>t.textContent.trim()).join(','))));
await p.screenshot({path:__dirname+'/../guide-out/_simple-phone-'+n+'.png'});}
await b.close()})();
