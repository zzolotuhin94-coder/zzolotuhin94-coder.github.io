const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:960}});
await p.goto('http://127.0.0.1:8765/dahuam/index.html?nointro');await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const k=curSeasonKey();const root=$('#print');root.innerHTML=guestHtmlWeb(k,todayStr(),{print:true});document.body.classList.add('print-menu');root.classList.add('pdf');const top=root.getBoundingClientRect().top;
let blocks=[...root.querySelectorAll('.wk-dish,.wk-item,.hk-item,.g-item,tr,li,p,h1,h2,h3,h4,figure,img,.wk-legend,.wk-foot')].map(n=>{const r=n.getBoundingClientRect();return [Math.floor(r.top-top),Math.ceil(r.bottom-top),n.tagName+'.'+n.className]}).filter(([t,b])=>b>t);
const c=1036;return blocks.filter(([t,b])=>t<c&&c<b).map(x=>x.join(' ')).join('\n')+' | total '+blocks.length}));await b.close();})();
