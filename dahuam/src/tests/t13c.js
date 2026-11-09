const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('http://127.0.0.1:8765/dahuam/index.html?nointro');await p.waitForTimeout(1200);
console.log(await p.evaluate(()=>JSON.stringify(plAnalyse('Artikelnr;Artikel;Einheit;Preis\nGI-140;Römersalat;kg;3,95\nGI-128;Parmesan;kg;19,80\nBH-12;Wachtelei;Stk;0,29\nGI-133;Kapern;kg;12,40\nBK-02;Weißbrot / Baguette;kg;3,10\nGI-301;Sardellenfilets;kg;24,00').lines.map(l=>[l.name,l.pid,l.price,l.pid&&P(l.pid).name])) ));
await b.close();})();
