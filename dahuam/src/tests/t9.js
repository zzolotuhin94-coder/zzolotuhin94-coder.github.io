const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h,tag] of [[1440,900,'d'],[390,844,'m']]){
 const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
 await p.goto('http://127.0.0.1:8765/dahuam/index.html');
 for(const t of [300,700,1100,1500,1900,2300]){await p.waitForTimeout(t-(p._last||0));p._last=t;await p.screenshot({path:`i-${tag}-${t}.png`});}
 await p.waitForTimeout(1200);console.log(tag,'intro gone',await p.evaluate(()=>!document.getElementById('intro')));
 await p.reload();await p.waitForTimeout(300);console.log(tag,'second load intro?',await p.evaluate(()=>!!document.getElementById('intro')));
}
console.log('errors',errs);await b.close();})();
