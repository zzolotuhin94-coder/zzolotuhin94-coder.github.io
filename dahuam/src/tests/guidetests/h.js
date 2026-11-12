const L=require('../fixtests/lib');
exports.L=L; exports.ok=L.ok; exports.done=L.done;
exports.URL0='http://127.0.0.1:8771/dahuam/index.html';
exports.open=L.open;
exports.PHONE={vp:{width:390,height:844},mobile:true,touch:true};
// Zustand des laufenden Rundgangs
exports.T=p=>p.evaluate(()=>{const T=GD.t;if(!T)return null;const h=document.querySelector('#gd .gd-hole');const c=document.querySelector('#gd .gd-card');const hr=h.getBoundingClientRect(),cr=c.getBoundingClientRect();
 return {i:T.i,n:T.steps.length,title:c.querySelector('h3').textContent,text:c.querySelector('#gdX').textContent,found:T.found,hole:h.className,hr:[hr.left,hr.top,hr.width,hr.height].map(Math.round),cr:[cr.left,cr.top,cr.right,cr.bottom].map(Math.round),tab:view.tab,sw:document.documentElement.scrollWidth,live:document.querySelector('#gd .gd-live').textContent.length,focus:document.activeElement&&(document.activeElement.dataset.gd||document.activeElement.tagName),btns:[...c.querySelectorAll('button')].map(b=>b.textContent.trim())};});
exports.settle=async(p,ms=1150)=>{await p.waitForTimeout(ms)};
exports.bub=p=>p.evaluate(()=>{const n=document.querySelector('.gd-bub');return n?{t:n.querySelector('b').textContent,x:n.querySelector('p').textContent,note:(n.querySelector('small')||{}).textContent||'',r:(r=>[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)])(n.getBoundingClientRect())}:null});
