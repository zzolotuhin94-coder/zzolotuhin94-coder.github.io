const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('http://127.0.0.1:8765/dahuam/index.html?nointro');await p.waitForTimeout(1200);
console.log(await p.evaluate(()=>{const c=S.cards.find(c=>/Caesar/.test(c.name));view.card=c.id;go('cards');return JSON.stringify({items:c.items.slice(0,3),dl:[...demoPriceLines(c)],tab:view.tab,card:view.card,has:document.body.innerHTML.includes('Wareneinsatz geschätzt'),grid:document.querySelectorAll('#app .grid2').length, src:renderCard.toString().slice(0,80)})}));
await b.close();})();
