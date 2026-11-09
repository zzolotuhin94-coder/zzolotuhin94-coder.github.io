const {L,PHONE}=require('./h');
(async()=>{const {b,p}=await L.open(PHONE);
await p.evaluate(()=>{setMode('simple',true);view.rp.tab='sales';go('report')});await p.waitForTimeout(400);
console.log(await p.evaluate(()=>{const out=[];document.querySelectorAll('#app *').forEach(e=>{if(e.scrollWidth>e.clientWidth+2||e.getBoundingClientRect().right>391){const cs=getComputedStyle(e);out.push(e.tagName+'.'+e.className+' sw'+e.scrollWidth+' cw'+e.clientWidth+' ox:'+cs.overflowX+' r'+Math.round(e.getBoundingClientRect().right))}});return out.slice(0,14).join('\n')}));
await b.close()})();
