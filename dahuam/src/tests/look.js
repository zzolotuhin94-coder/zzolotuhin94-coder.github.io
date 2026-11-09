const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const [n,vp] of [['d',{width:1440,height:900}],['m',{width:390,height:844}]]){
const p=await b.newPage({viewport:vp});await p.goto('http://127.0.0.1:8765/dahuam/index.html?nointro');await p.waitForTimeout(900);
for(const t of ['aufbau','menu','setup','cards']){await p.evaluate(t=>go(t),t);await p.waitForTimeout(300);await p.screenshot({path:`guide-out/_look-${n}-${t}.png`});}
await p.evaluate(()=>go('cards',S.cards.find(c=>c.type==='dish').id));await p.waitForTimeout(300);await p.screenshot({path:`guide-out/_look-${n}-card.png`});
}
await b.close();})();
