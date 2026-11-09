// Hauskarte: echtes Handy-Profil (390 px) und nativer Druckweg
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const F='http://127.0.0.1:8765/dahuam/index.html?nointro';
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const m=await ctx.newPage();m.on('pageerror',e=>errs.push('m '+e.message));
await m.goto(F);await m.waitForTimeout(900);await m.evaluate(()=>{view.mtab='guest';view.gdate='2027-01-20';go('menu')});await m.waitForTimeout(2500);
console.log('phone scrollWidth',await m.evaluate(()=>document.documentElement.scrollWidth),'sheet',await m.evaluate(()=>Math.round(document.querySelector('.hs-sheet').getBoundingClientRect().width)));
await m.evaluate(()=>{view.hsBig=true;refreshGuest()});await m.waitForTimeout(300);console.log('phone big scrollWidth',await m.evaluate(()=>document.documentElement.scrollWidth));
const p=await b.newPage({viewport:{width:1440,height:960}});p.on('pageerror',e=>errs.push(e.message));
await p.goto(F);await p.waitForTimeout(900);await p.evaluate(()=>{view.mtab='guest';view.gdate='2027-01-20';go('menu')});await p.waitForTimeout(2500);
await p.evaluate(()=>{const pr=document.querySelector('#print');pr.classList.add('hs-print');pr.innerHTML=guestHtmlHaus('winter','2027-01-20',{print:true});document.body.classList.add('print-menu');});
await p.waitForTimeout(500);fs.writeFileSync('hauskarte-out/_druck-nativ.pdf',await p.pdf({preferCSSPageSize:true,printBackground:true}));
console.log('errors',errs);await b.close();})();
