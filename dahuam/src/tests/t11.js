const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h,tag] of [[1440,900,'d'],[390,844,'m']]){
 const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});p.on('pageerror',e=>errs.push(e.message));
 await p.clock.install();await p.goto('http://127.0.0.1:8765/dahuam/index.html');
 await p.waitForFunction(()=>document.querySelector('#intro.play'),{timeout:8000});
 for(const t of [150,500,900,1300,1700,2000]){await p.evaluate(t=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=t;}),t);await p.waitForTimeout(60);await p.screenshot({path:`k-${tag}-${t}.png`});}
}
console.log('errors',errs);await b.close();})();
