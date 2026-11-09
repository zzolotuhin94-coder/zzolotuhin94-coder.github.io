const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const p=await b.newPage({viewport:{width:1340,height:800},colorScheme:'dark'});p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8765/dahuam/index.html?nointro');await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(1000);await p.evaluate(()=>go('menu'));await p.waitForTimeout(300);
const pos=async()=>p.evaluate(()=>{const r=document.querySelector('#mq').getBoundingClientRect();const v=document.querySelector('.vsw').getBoundingClientRect();return [Math.round(r.x),Math.round(v.x),document.documentElement.scrollWidth,window.scrollX]});
for(const v of ['list','compact','cards','list']){await p.click(`[data-act=vsw][data-id="menu:${v}"]`);await p.waitForTimeout(250);console.log(v,await pos(),'arts',await p.evaluate(()=>document.querySelectorAll('article.dish').length));}
await p.click(`[data-act=vsw][data-id="menu:cards"]`);await p.selectOption('[data-sel=sec]','Flammkuchen');await p.waitForTimeout(250);console.log('cards flamm',await p.evaluate(()=>document.querySelectorAll('article.dish').length));
await p.evaluate(()=>{view.sec='noalg';render()});console.log('cards noalg',await p.evaluate(()=>document.querySelectorAll('article.dish').length));
await p.evaluate(()=>{view.sec='over';render()});console.log('cards over',await p.evaluate(()=>document.querySelectorAll('article.dish').length),await p.evaluate(()=>!!document.querySelector('.empty-s')));
await p.evaluate(()=>{view.sec='all';render()});await p.screenshot({path:'t17.png'});console.log(errs);await b.close();})();
