const {L,PHONE}=require('./h');
(async()=>{const {b,p}=await L.open(PHONE);
await p.evaluate(()=>{setMode('simple',true);view.rp.tab='sales';go('report')});await p.waitForTimeout(400);
console.log(await p.evaluate(()=>{const out=[];document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();if(r.right>391&&r.width>0&&!e.closest('.lt-wrap,.tbl-wrap,svg,.rp-units,.seg')) out.push(e.tagName+'.'+e.className+' '+Math.round(r.left)+'-'+Math.round(r.right))});return [document.documentElement.scrollWidth,out.slice(0,12)]}));
await b.close()})();
