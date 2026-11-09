const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const m=await b.newPage({viewport:{width:390,height:844}});
await m.goto('http://127.0.0.1:8765/dahuam/index.html?nointro');await m.waitForTimeout(600);
for(const t of [()=>go('dash'),()=>{view.mtab='guest';go('menu')},()=>{view.mtab='plan';go('menu')}]){
 await m.evaluate(t);await m.waitForTimeout(300);
 console.log(await m.evaluate(()=>{const out=[];document.querySelectorAll('#app *').forEach(e=>{const r=e.getBoundingClientRect();if(r.right>392&&r.width>0){let p=e.parentElement,sc=false;while(p){const o=getComputedStyle(p).overflowX;if(o==='auto'||o==='scroll'||o==='hidden'){sc=true;break}p=p.parentElement}if(!sc)out.push(e.tagName+'.'+e.className+' '+Math.round(r.right))}});return [document.documentElement.scrollWidth,...out.slice(0,6)].join('\n')}));
}
await b.close();})();
