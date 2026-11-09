const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:960}});
await p.goto('http://127.0.0.1:8765/dahuam/index.html?nointro');await p.waitForTimeout(800);
await p.evaluate(()=>{view.mtab='guest';go('menu');const k=curSeasonKey();$('#print').innerHTML=guestHtmlWeb(k,todayStr(),{print:true});document.body.classList.add('print-menu');$('#print').classList.add('pdf')});
await p.waitForTimeout(300);
console.log(await p.evaluate(()=>{const el=$('#print');const top=el.getBoundingClientRect().top;const W=el.offsetWidth;const pagePx=Math.floor(W*(841.89-52)/595.28);
const q=s=>[...el.querySelectorAll(s)].length;return JSON.stringify({W,H:el.scrollHeight,pagePx,dish:q('.wk-dish'),h:q('.wk-h'),cols:getComputedStyle(el.querySelector('.wk-cols')||el).columnCount, secs:[...el.querySelectorAll('.wk-h')].map(n=>Math.round(n.getBoundingClientRect().top-top))})}));
await b.close();})();
