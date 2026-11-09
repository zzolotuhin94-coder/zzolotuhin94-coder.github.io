const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:960}});
await p.goto('http://127.0.0.1:8765/dahuam/index.html?nointro');await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const k=curSeasonKey();const el=$('#print');el.innerHTML=guestHtmlWeb(k,todayStr(),{print:true});document.body.classList.add('print-menu');el.classList.add('pdf');const top=el.getBoundingClientRect().top;
return [...el.querySelectorAll('.wk-dish,.wk-item,.hk-item,.g-item,tr,li,p,h1,h2,h3,h4,figure,img,.wk-legend,.wk-foot')].map(n=>{const r=n.getBoundingClientRect();return [n.tagName+'.'+n.className,Math.round(r.top-top),Math.round(r.bottom-top)]}).filter(x=>x[2]-x[1]>300).map(x=>x.join(' ')).join('\n')}));await b.close();})();
