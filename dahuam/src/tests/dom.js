const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto('http://127.0.0.1:8765/dahuam/index.html?nointro');await p.waitForTimeout(900);
const dump=async(name)=>{await p.waitForTimeout(250);const r=await p.evaluate(()=>{const o=[];const seen=new Set();
document.querySelectorAll('#app [data-act],#app input,#app select,#app textarea,#app th,#app h2,#app .t-l,#app .seg, #app section, #app [class]').forEach(el=>{let k;
if(el.dataset.act) k='A['+el.dataset.act+(el.closest('tbody,ul.rows,.rc-grid,.dish-grid')?'':':'+(el.dataset.id||''))+'] '+el.tagName.toLowerCase()+'.'+el.className.toString().split(' ')[0]+(el.closest('tbody,ul.rows,.rc-grid,.dish-grid')?'':' "'+(el.textContent.trim().slice(0,24)||el.title||el.getAttribute('aria-label')||'')+'"');
else if(/INPUT|SELECT|TEXTAREA/.test(el.tagName)) k='I '+el.tagName.toLowerCase()+(el.id?'#'+el.id.replace(/[-_][a-z0-9_]{5,}$/,'-*'):'')+'.'+el.className.split(' ')[0]+' ['+Object.keys(el.dataset).join(',')+']';
else if(el.tagName==='TH') k='TH "'+el.textContent.trim()+'"';
else if(el.tagName==='H2') k='H2 "'+el.textContent.trim().slice(0,30)+'" in .'+el.parentElement.className+' < .'+el.parentElement.parentElement.className;
else if(el.classList.contains('t-l')) k='TILE "'+el.textContent.trim()+'"';
else return;
k=k.replace(/\d+/g,'N'); if(seen.has(k))return;seen.add(k);o.push(k);});return o.join('\n');});console.log('\n=== '+name+'\n'+r);};
const steps=process.argv.slice(2);
for(const s of steps){ try{await p.evaluate(s);}catch(e){console.log("ERR",e.message.slice(0,90))} await dump(s); }
await b.close();})();
