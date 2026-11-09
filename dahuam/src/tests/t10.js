const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const [w,h,tag] of [[1440,900,'d'],[390,844,'m']]){
 const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
 await p.clock.install();
 await p.goto('http://127.0.0.1:8765/dahuam/index.html');
 await p.waitForFunction(()=>document.querySelector('#intro.play'),{timeout:8000}).catch(()=>{});
 for(const t of [500,1000,1400,1950]){
   await p.evaluate(t=>{document.getAnimations().forEach(a=>{a.pause();a.currentTime=t;});},t);
   await p.waitForTimeout(80);await p.screenshot({path:`f-${tag}-${t}.png`});
 }
 console.log(tag,'play',await p.evaluate(()=>!!document.querySelector('#intro.play')),'anims',await p.evaluate(()=>document.getAnimations().length));
}
await b.close();})();
