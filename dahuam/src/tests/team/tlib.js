// Gemeinsames für die Team-Tests: feste Uhr (Donnerstag, 12.11.2026, 10:30, KW 46), frischer Speicher
const {chromium}=require('playwright');
const URL='http://127.0.0.1:8765/dahuam/index.html?nointro';
exports.URL=URL;
const clock=(y,mo,d,h,mi)=>`(()=>{const _D=Date;const FIX=new _D(${y},${mo-1},${d},${h},${mi},0).getTime();const T0=_D.now();class MD extends _D{constructor(...a){if(a.length===0)super(FIX+(_D.now()-T0));else super(...a);}static now(){return FIX+(_D.now()-T0);}}window.Date=MD;})();`;
exports.clock=clock;
exports.open=async(opts={})=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:opts.vp||{width:1440,height:900},hasTouch:!!opts.touch,isMobile:!!opts.mobile,deviceScaleFactor:1,acceptDownloads:true,timezoneId:'Europe/Vienna',locale:'de-AT',colorScheme:opts.dark?'dark':'light',permissions:opts.clip===false?[]:['clipboard-read','clipboard-write']});
const at=opts.at||[2026,11,12,10,30];await ctx.addInitScript(clock(...at));
if(opts.init) await ctx.addInitScript(opts.init);
const p=await ctx.newPage();
const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.type()+': '+m.text())});p.on('pageerror',e=>errs.push('PE '+e.message+' '+(e.stack||'').split('\n')[1]));
p.on('dialog',d=>{errs.push('DIALOG '+d.type()+': '+d.message());d.accept()});
await p.goto(opts.url||URL);await p.waitForTimeout(700);
await p.addStyleTag({content:'.reward{display:none!important}'});
return {b,p,errs,ctx};};
let fails=0;exports.ok=(c,msg,extra)=>{console.log((c?'  ok   ':'  FAIL ')+msg+(extra!==undefined?'  → '+JSON.stringify(extra):''));if(!c)fails++;};
exports.done=async(b,errs)=>{console.log('errors',JSON.stringify(errs||[]));console.log(fails?('FAILS '+fails):'ALL OK');await b.close();process.exit(fails||(errs&&errs.length)?1:0);};
