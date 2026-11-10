const L=require('./tlib');const fs=require('fs');
(async()=>{const {b,p,errs}=await L.open({});
await p.evaluate(()=>go('dienst'));await p.waitForTimeout(300);
try{const [dl]=await Promise.all([p.waitForEvent('download',{timeout:45000}),p.click('#app .page-h [data-pdf="tmPrint"]')]);const f='../team-out/Dienstplan-KW46.pdf';await dl.saveAs(f);console.log('saved',dl.suggestedFilename(),fs.statSync(f).size);
await p.waitForTimeout(500);console.log(await p.evaluate(()=>[$('#toast').textContent,$('#print').className,gdActs().dpdf]));
await p.evaluate(()=>{view.ck.tab='verlauf';go('checkl')});await p.waitForTimeout(300);
const [d2]=await Promise.all([p.waitForEvent('download',{timeout:45000}),p.click('#app [data-pdf="ckPrint"]')]);await d2.saveAs('../team-out/Checklisten-2026-11.pdf');console.log('saved',d2.suggestedFilename());await p.waitForTimeout(400);console.log(await p.evaluate(()=>$('#toast').textContent));
}catch(e){console.log('ERR',e.message.split('\n')[0],await p.evaluate(()=>$('#toast').textContent))}
console.log(JSON.stringify(errs));await b.close();})();
