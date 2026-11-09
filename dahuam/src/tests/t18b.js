const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();p.on('console',m=>console.log('c',m.text().slice(0,200)));p.on('pageerror',e=>console.log('E',e.message));
await p.goto('http://127.0.0.1:8765/dahuam/index.html?nointro');await p.waitForTimeout(800);
await p.evaluate(()=>{view.mtab='guest';go('menu')});await p.click('[data-pdf=printMenu]');
for(let i=0;i<12;i++){await p.waitForTimeout(1000);const t=await p.evaluate(()=>[...document.querySelectorAll('.toast,#toast')].map(x=>x.textContent).join('|'));console.log(i,t,await p.evaluate(()=>!!window.html2canvas+'/'+!!window.jspdf));}
await b.close();})();
