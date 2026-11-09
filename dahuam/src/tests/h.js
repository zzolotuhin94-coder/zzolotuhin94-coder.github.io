const L=require('../fixtests/lib');
exports.L=L; exports.ok=L.ok; exports.done=L.done;
exports.URL0='http://127.0.0.1:8765/dahuam/index.html';
exports.open=L.open;
exports.PHONE={vp:{width:390,height:844},mobile:true,touch:true};
// state of the running tour
exports.T=p=>p.evaluate(()=>{const T=GD.t;if(!T)return null;const h=document.querySelector('#gd .gd-hole');const c=document.querySelector('#gd .gd-card');const hr=h.getBoundingClientRect(),cr=c.getBoundingClientRect();
 return {id:T.id,i:T.i,n:T.steps.length,title:c.querySelector('h3').textContent,text:c.querySelector('#gdX').textContent,found:T.found,shown:T.shown,doing:T.doing,ok:c.classList.contains('ok'),hole:h.className,hr:[hr.left,hr.top,hr.width,hr.height].map(Math.round),cr:[cr.left,cr.top,cr.right,cr.bottom].map(Math.round),tab:view.tab,card:view.card,sw:document.documentElement.scrollWidth,role:c.getAttribute('role'),live:document.querySelector('#gd .gd-live').textContent.length,focus:document.activeElement&&(document.activeElement.dataset.gd||document.activeElement.id||document.activeElement.tagName)}});
exports.settle=async(p,ms=1150)=>{await p.waitForTimeout(ms)};
