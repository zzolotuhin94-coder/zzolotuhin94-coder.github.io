const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const vp=process.env.VP==='m'?{width:390,height:844}:{width:1440,height:900};
const p=await b.newPage({viewport:vp});p.on('pageerror',e=>console.log('PE',e.message));await p.goto('http://127.0.0.1:8765/dahuam/index.html?nointro');await p.waitForTimeout(900);
for(const s of process.argv.slice(2)){ if(s.startsWith('shot:')){await p.waitForTimeout(350);await p.screenshot({path:s.slice(5)});continue;} try{console.log(JSON.stringify(await p.evaluate(s)));}catch(e){console.log('ERR',e.message.slice(0,300))} await p.waitForTimeout(200);}
await b.close();})();
