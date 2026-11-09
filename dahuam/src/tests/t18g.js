const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:960}});
await p.goto('http://127.0.0.1:8765/dahuam/index.html?nointro');await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const k=curSeasonKey();const el=$('#print');el.innerHTML=guestHtmlWeb(k,todayStr(),{print:true});document.body.classList.add('print-menu');el.classList.add('pdf');const top=el.getBoundingClientRect().top;
const bl=[];el.querySelectorAll('h2,h3,h4,.wk-h,.wk-sp-h,.hk-sec-h').forEach(n=>{const r=n.getBoundingClientRect();bl.push([Math.floor(r.top-top),Math.ceil(r.bottom-top)+90,n.tagName+'.'+n.className])});
return bl.filter(x=>x[1]-x[0]>200).map(x=>x.join(' ')).join('\n')}));await b.close();})();
