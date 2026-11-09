// node shots.js <prefix> <w> <h> [dark] [only]
const L=require('./lib');const pre=process.argv[2]||'d',W=+process.argv[3]||1440,H=+process.argv[4]||900,only=process.argv[6];
(async()=>{const {b,p,errs}=await L.open({vp:{width:W,height:H},mobile:W<600,touch:W<600});
if(process.argv[5]==='dark'){await p.evaluate(()=>setTheme('dark'));}
const S=[['dash',()=>go('dash')],['report',()=>go('report')],['report-year',()=>{view.rp.unit='year';view.rp.ref=isoDate(new Date());go('report')}],['plan',()=>{view.mtab='plan';go('menu')}],['menu',()=>{view.mtab='calc';go('menu')}],
['buy',()=>{view.stab='bestellung';view.order=null;go('buy')}],['order-done',()=>{view.stab='bestellung';view.order=S.orders.find(o=>o.receipt&&o.lines.some(l=>l.invPrice)).id;view.recv=null;go('buy')}],
['order-draft',()=>{const o=newOrder('sup_gross');view.stab='bestellung';view.order=o.id;go('buy')}],['recv',()=>{const o=S.orders.find(o=>o.status==='confirmed');view.order=o.id;view.recv=o.id;go('buy')}],
['stock',()=>{view.order=null;view.stab='bestand';go('stock')}],['moves',()=>{view.stab='buchungen';go('stock')}],['setup',()=>go('setup')],['labor',()=>go('labor')],['products',()=>go('products')],['cards',()=>go('cards')],['card',()=>go('cards','dish_kaiser')],['pcheck',()=>pcStart()]];
for(const [n,f] of S){if(only&&!only.split(',').includes(n))continue;await p.evaluate(f);await p.waitForTimeout(350);const sw=await p.evaluate(()=>document.documentElement.scrollWidth);await p.screenshot({path:`shots/${pre}-${n}.png`,fullPage:true});console.log(n,'scrollWidth',sw);}
console.log(errs);await b.close();})();
