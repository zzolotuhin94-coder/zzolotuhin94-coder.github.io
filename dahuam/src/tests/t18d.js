const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({acceptDownloads:true,viewport:{width:1440,height:960}});const p=await ctx.newPage();
await p.goto('http://127.0.0.1:8765/dahuam/index.html?nointro');await p.waitForTimeout(800);
await p.evaluate(()=>{view.mtab='guest';go('menu')});const [d]=await Promise.all([p.waitForEvent('download'),p.click('[data-pdf=printMenu]')]);
console.log(await p.evaluate(()=>JSON.stringify(window.__pdfdbg)));await b.close();})();
