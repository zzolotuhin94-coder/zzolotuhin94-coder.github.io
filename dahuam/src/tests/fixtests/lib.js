const {chromium}=require('playwright');
const URL='http://127.0.0.1:8775/dahuam/index.html?nointro';
exports.URL=URL;
exports.open=async(opts={})=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:opts.vp||{width:1440,height:900},hasTouch:!!opts.touch,isMobile:!!opts.mobile,acceptDownloads:true,timezoneId:'Europe/Vienna'});const p=await ctx.newPage();
const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.type()+': '+m.text())});p.on('pageerror',e=>errs.push('PE '+e.message+' '+(e.stack||'').split('\n')[1]));
p.on('dialog',d=>{errs.push('DIALOG '+d.type()+': '+d.message());d.accept()});
if(opts.init) await ctx.addInitScript(opts.init);
await p.goto(opts.url||URL);await p.waitForTimeout(700);
// „Mehr Optionen“ sind in diesen Tests aufgeklappt (dass sie sonst zu sind, prüft btests/b09)
const moreOpen=()=>p.evaluate(()=>{ if(typeof view!=='undefined'&&typeof S!=='undefined'&&S){ view.more={teller:true,menu:true,cards:true,stock:true,products:true,report:true,dienst:true,setup:true,addr:true,plhow:true}; try{render()}catch(e){} } }).catch(()=>{});
if(opts.more!==false){ await moreOpen(); p.on('load',()=>{ setTimeout(moreOpen,450); }); }   // auch nach einem Neuladen
return {b,p,errs,ctx};};
let fails=0;exports.ok=(c,msg,extra)=>{console.log((c?'  ok   ':'  FAIL ')+msg+(extra!==undefined?'  → '+JSON.stringify(extra):''));if(!c)fails++;};
exports.done=async(b,errs)=>{console.log('errors',JSON.stringify(errs||[]));console.log(fails?('FAILS '+fails):'ALL OK');await b.close();process.exit(fails||(errs&&errs.length)?1:0);};
