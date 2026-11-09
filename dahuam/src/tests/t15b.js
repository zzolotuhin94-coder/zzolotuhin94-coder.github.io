const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://127.0.0.1:8765/dahuam/index.html?nointro');await p.waitForTimeout(1200);
console.log(await p.evaluate(()=>S.products.map(p=>p.id).join(' ')));
await p.evaluate(()=>{view.lab={ings:[{ref:'p:veal'},{ref:'p:cranberry'},{name:'Kürbis'}],type:'haupt',style:'tirol',diet:'',fcMax:28,price:'',season:'herbst',res:null,seed:0};go('labor')});
await p.click('[data-act=labGen]');await p.waitForTimeout(900);await p.screenshot({path:'lab-d.png'});
await p.evaluate(()=>{view.lab.ings=[{ref:'p:veal'},{ref:'p:cranberry'},{ref:'p:potato'}];});await p.click('[data-act=labGen]');await p.waitForTimeout(900);
console.log(await p.evaluate(()=>document.querySelector('.lab-kpi').innerText.replace(/\n/g,' ')));await p.screenshot({path:'lab-d2.png'});await b.close();})();
