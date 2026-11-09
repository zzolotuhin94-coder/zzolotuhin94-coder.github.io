const L=require('./lib');
(async()=>{const {b,p}=await L.open({});
await p.evaluate(()=>{view.mtab='plan';go('menu')});await p.waitForTimeout(300);
console.log(await p.evaluate(()=>{const w=document.querySelector('.tline').getBoundingClientRect();return JSON.stringify({w:[w.left,w.right],pins:[...document.querySelectorAll('.tl-pin')].map(x=>{const r=x.getBoundingClientRect();return [x.textContent.slice(0,14),Math.round(r.left),Math.round(r.right),Math.round(r.top),Math.round(r.bottom),x.className]})})}));
await b.close();})();
