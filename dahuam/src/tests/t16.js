const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const m=await b.newPage({viewport:{width:390,height:844}});const errs=[];m.on('pageerror',e=>errs.push(e.message));
await m.goto('http://127.0.0.1:8765/dahuam/index.html?nointro');await m.waitForTimeout(1000);await m.evaluate(()=>go('dash'));await m.waitForTimeout(300);
await m.evaluate(()=>document.querySelector('.day .tiles').scrollIntoView({block:'center'}));await m.screenshot({path:'t16.png'});
console.log(await m.evaluate(()=>document.documentElement.scrollWidth),errs);await b.close();})();
