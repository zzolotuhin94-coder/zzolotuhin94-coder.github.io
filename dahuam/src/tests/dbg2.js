const L=require('./lib');
(async()=>{const {b,p,errs}=await L.open({});
console.log(await p.evaluate(()=>({demo:S.salesDemo,days:Object.keys(S.salesDays).length,real:Object.keys(S.salesReal||{}).length,dd:demoSalesDays().length, f:salesDlg.toString().slice(0,200)})));
await p.evaluate(()=>salesDlg());console.log(await p.evaluate(()=>$('#dlg').innerText.slice(0,300)));
console.log(errs);await b.close();})();
