// Bildschirmfotos: Desktop 1440×900 und Handy 390×844, hell und dunkel → ../team-out/
const L=require('./tlib');
const run=async(dev,dark)=>{const phone=dev==='p';const {b,p,errs}=await L.open(phone?{vp:{width:390,height:844},touch:true,mobile:true,dark}:{dark});
const w=ms=>p.waitForTimeout(ms);const ev=(f,a)=>p.evaluate(f,a);const th=dark?'dark':'light';await ev(t=>setTheme(t),th);
const shot=async(n,opt)=>{await w(350);await p.screenshot({path:`../team-out/${dev}-${n}-${th}.png`,...(opt||{})});};
// ein paar eigene Einträge, damit Hinweise, Notizen und Teildienste zu sehen sind
await ev(()=>{const add=(pid,D,parts,area,note)=>(S.team.shifts[D]=S.team.shifts[D]||[]).push({id:uid('ts'),pid,parts,area:area||tmPerson(pid).area,note:note||''});
  add('tp_lukas','2026-11-11',[['09:00','13:00']],'kueche','Wochenputz');add('tp_anna','2026-11-09',[['18:00','02:00']],'kueche','Törggelen');add('tp_magdalena','2026-11-12',[['09:00','14:00'],['16:00','23:30']]);add('tp_magdalena','2026-11-14',[['08:00','09:30']],'service','Frühstück');
  save();go('dienst')});
await shot('01-dienstplan-woche');
if(phone){await ev(()=>{tmView().pm='week';render()});await shot('01b-dienstplan-wochenuebersicht');await ev(()=>{tmView().pm='day';tmView().day='2026-11-12';render()});}
await ev(()=>{const el=document.querySelector(tmPhone()?'#app .tm-dr:nth-child(2) .tm-plus':'#app .tm-t td[data-id="tp_theresa|2026-11-10"]');el.click()});await w(250);await ev(()=>document.querySelector('#dlgForm .tm-tb[data-tmtpl="tt_teil"]').click());await shot('02-dienst-dialog');await ev(()=>$('#dlg').close());
if(phone){await ev(()=>{tmView().pm='week';render();document.querySelector('#tmHints').scrollIntoView({block:'center'})});}else await ev(()=>document.querySelector('#tmHints').scrollIntoView({block:'end'}));
await shot('03-hinweise');
if(phone){await ev(()=>{tmView().pm='day';tmView().day='2026-11-12';render();window.scrollTo(0,0)});await shot('04-tagesansicht');}
else {await ev(()=>{tmView().mode='month';render();window.scrollTo(0,0)});await shot('04-monat');await ev(()=>{tmView().mode='week';tmTeamDlg()});await shot('04b-team-verwalten');await ev(()=>$('#dlg').close());}
// Checklisten
await ev(()=>{view.ck.tab='heute';view.ck.run=null;go('checkl')});await ev(()=>{const D=ckToday();const tp=ckTpl('ck_open_k');tp.items.forEach((it,i)=>{if(i<9&&i!==2)ckSet(D,tp,it,it.val?{b:'Anna',a:'07:52',v:3.8}:{b:'Anna',a:'07:5'+Math.min(9,i)})});render()});
await shot('05-checklisten-heute');
await ev(()=>{view.ck.run='ck_open_k';render();window.scrollTo(0,0)});await shot('06-liste-abhaken');
await p.fill('#ckv-ck_open_k_3','-12');await p.press('#ckv-ck_open_k_3','Enter');await w(300);await p.fill('#dlgForm [name="note"]','Tür stand offen');await shot('07-wert-ausserhalb-dialog');
await p.click('#dlgForm button[type="submit"]');await w(400);await ev(()=>{$('#toast').classList.remove('show');window.scrollTo(0,0)});await shot('07b-wert-ausserhalb');
await ev(()=>{delete S.team.shifts['2026-11-11'];view.ck.run=null;view.ck.tab='verlauf';view.ck.hist='2026-11-08';render();window.scrollTo(0,0)});await shot('08-verlauf');await shot('08b-verlauf-ganz',{fullPage:true});
await ev(()=>{view.ck.tab='vorlagen';view.ck.hist=null;render();ckTplDlg('ck_open_k')});await shot('08c-liste-bearbeiten');await ev(()=>$('#dlg').close());
// Heute
await ev(()=>go('dash'));await ev(ph=>document.querySelector('#app .tm-dash').scrollIntoView({block:ph?'start':'center'}),phone);if(phone)await ev(()=>window.scrollBy(0,-70));await shot('09-heute-team');
// PDF: Inhalt so, wie er ins PDF geht
if(!dark){await ev(()=>{window.print=()=>{};go('dienst');tmPrint();const el=$('#print');el.classList.add('pdf','land');el.style.left='0';el.style.zIndex='999';document.querySelector('.shell,body > .layout,#app').style.visibility='hidden';window.scrollTo(0,0)});
  await p.setViewportSize({width:1123,height:760});await w(300);await p.locator('#print').screenshot({path:`../team-out/${dev}-10-pdf-dienstplan.png`});
  await ev(()=>{const el=$('#print');el.classList.remove('land');el.innerHTML=ckPrintHtml('2026-11')});await p.setViewportSize({width:794,height:1000});await w(300);await p.screenshot({path:`../team-out/${dev}-11-pdf-checklisten.png`});}
console.log(dev,th,JSON.stringify(errs));await b.close();};
(async()=>{for(const dev of ['d','p'])for(const dark of [false,true])await run(dev,dark);})();
