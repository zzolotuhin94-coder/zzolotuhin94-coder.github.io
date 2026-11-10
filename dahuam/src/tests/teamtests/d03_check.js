// Checklisten: tägliche Listen, Ruhetag, Wochenliste, Abhaken mit Name und Uhrzeit, Messwerte, Verlauf, Heute, PDF, Vorlagen. Uhr: Donnerstag, 12.11.2026, 10:30.
const L=require('./tlib');const ok=L.ok;
(async()=>{const {b,p,errs}=await L.open({});const ev=(f,a)=>p.evaluate(f,a);const w=ms=>p.waitForTimeout(ms);
const toastT=()=>ev(()=>$('#toast').classList.contains('show')?$('#toast').textContent:'');const submit=()=>p.click('#dlgForm button[type="submit"]');
const item=i=>`#app .ck-items > li:nth-child(${i+1})`;const T='2026-11-12';
// ---------- welche Liste ist wann fällig ----------
const due=await ev(()=>{const names=D=>ckDue(D).map(t=>t.name).join('|');const r={today:ckToday(),thu:names('2026-11-12'),wedNext:names('2026-11-18'),fri:names('2026-11-13')};
  (S.team.shifts['2026-11-18']=S.team.shifts['2026-11-18']||[]).push({id:'x1',pid:'tp_lukas',parts:[['09:00','13:00']],area:'kueche',note:'Putztag'});r.wedShift=names('2026-11-18');delete S.team.shifts['2026-11-18'];
  const wp=ckTpl('ck_week');r.wd=wp.wd;wp.wd=5;r.friW=names('2026-11-13');r.wedW=names('2026-11-18');wp.wd=3;
  const ok=ckTpl('ck_open_k');ok.active=false;r.off=names('2026-11-13');ok.active=true;const s=ok.since;ok.since='2026-11-14';r.since=names('2026-11-13');ok.since=s;
  r.tpl=S.checks.templates.map(t=>[t.name,t.items.length,t.items.filter(i=>i.val).length,!!t.sug]);r.words=JSON.stringify(S.checks.templates);return r});
ok(due.today==='2026-11-12'&&due.thu==='Öffnen Küche|Schließen Küche|Öffnen Bar/Service|Schließen Bar/Service','open day: the four daily lists are due',due.thu);
ok(due.wedNext==='Wochenputz'&&due.wd===3,'Ruhetag without shifts: no open/close lists, only the weekly list on its weekday',due.wedNext);
ok(due.wedShift==='Öffnen Küche|Schließen Küche|Öffnen Bar/Service|Schließen Bar/Service|Wochenputz','Ruhetag with a planned shift: open/close lists are due',due.wedShift);
ok(due.friW==='Öffnen Küche|Schließen Küche|Öffnen Bar/Service|Schließen Bar/Service|Wochenputz'&&due.wedW==='','weekly list follows its chosen weekday',[due.friW,due.wedW]);
ok(!/Öffnen Küche/.test(due.off)&&!/Öffnen Küche/.test(due.since),'a switched-off list is not due; a list is not due before the day it was created');
ok(JSON.stringify(due.tpl)==='[["Öffnen Küche",12,2,true],["Schließen Küche",12,1,true],["Öffnen Bar/Service",12,1,true],["Schließen Bar/Service",12,0,true],["Wochenputz",10,0,true]]','five default lists with sensible sizes, measured values where a number is read off, all flagged as suggestion',due.tpl);
ok(['Kühlhaus-Temperatur notieren','Fritteuse einschalten, Öl prüfen','MHD-Kontrolle Kühlhaus','desinfizieren','Kassa-Abschluss','Müll','Gas abdrehen','Eingangstür abschließen'].every(x=>due.words.includes(x))&&!/HACCP|gesetzlich|vorgeschrieben|konform/i.test(due.words),'default items cover the usual points; no claim of HACCP or legal compliance in the lists');
// ---------- Übersicht ----------
await ev(()=>go('checkl'));await w(300);
const ov=await ev(()=>({sub:$('#app .page-h .sub').textContent,rows:[...document.querySelectorAll('#app .ck-l')].map(x=>x.innerText.replace(/\s+/g,' ')),tabs:[...document.querySelectorAll('#app .ck-tabs button')].map(x=>x.textContent),prim:document.querySelectorAll('#app .btn.primary').length}));
ok(/Donnerstag, 12\. November · 0 von 4 Listen fertig/.test(ov.sub)&&ov.rows.length===4&&/^Öffnen Küche noch nicht begonnen 0 von 12/.test(ov.rows[0])&&ov.tabs.join()==='Heute,Verlauf,Vorlagen','overview: today’s lists with progress „0 von 12“',ov.rows);
// ---------- Abhaken ----------
await p.click('#app .ck-l[data-id="ck_open_k"]');await w(250);
const rv=await ev(()=>({h1:$('#app h1').firstChild.textContent,sub:$('#app .page-h .sub').textContent,prog:$('#ckProg').textContent,n:document.querySelectorAll('#app .ck-i').length,vals:document.querySelectorAll('#app .ck-i.val').length,sticky:getComputedStyle($('#ckSticky')).position,rowH:Math.min(...[...document.querySelectorAll('#app .ck-c')].map(x=>x.getBoundingClientRect().height)),back:!!$('#app .back')}));
ok(rv.h1==='Öffnen Küche'&&/Donnerstag, 12\. November · Vorschlag, bitte anpassen/.test(rv.sub)&&rv.prog==='0 von 12'&&rv.n===12&&rv.vals===2&&rv.sticky==='sticky'&&rv.rowH>=56&&rv.back,'running list: fresh instance for the day, big rows, sticky progress „0 von 12“, labelled „Vorschlag, bitte anpassen“',rv);
await p.click(item(0)+' .ck-c');await w(200);
let st=await ev(()=>{const r=ckRun('2026-11-12','ck_open_k');const li=document.querySelector('#app .ck-i');return {rec:r&&r.items.ck_open_k_1,prog:$('#ckProg').textContent,on:li.classList.contains('on'),aria:li.querySelector('.ck-c').getAttribute('aria-checked'),small:li.querySelector('small').textContent,bar:$('#ckSticky .ck-bar i').style.width}});
ok(st.rec&&st.rec.b==='Anna'&&st.rec.a==='10:30'&&st.prog==='1 von 12'&&st.on&&st.aria==='true'&&st.small==='Anna, 10:30 Uhr'&&st.bar==='8.3%','tick records who (current user = Anna) and when; progress „1 von 12“',st);
await p.click(item(0)+' .ck-c');await w(200);ok(await ev(()=>!ckRun('2026-11-12','ck_open_k')&&$('#ckProg').textContent==='0 von 12')&&/Häkchen entfernt/.test(await toastT())&&await ev(()=>!!$('#toast .toast-act')),'un-tick is allowed, with „Rückgängig“');
await p.click('#toast .toast-act');await w(200);ok(await ev(()=>{const r=ckRun('2026-11-12','ck_open_k');return r&&r.items.ck_open_k_1.b==='Anna'&&r.items.ck_open_k_1.a==='10:30'&&$('#ckProg').textContent==='1 von 12'}),'undo restores the tick with its original name and time');
// ---------- Messwerte ----------
const vin=id=>`#ckv-${id}`;
await p.fill(vin('ck_open_k_2'),'3,5');await p.press(vin('ck_open_k_2'),'Enter');await w(250);
st=await ev(()=>{const r=ckRun('2026-11-12','ck_open_k').items.ck_open_k_2;const li=document.querySelector('#app .ck-i[data-item="ck_open_k_2"]');return {r,open:$('#dlg').open,v:$('#ckv-ck_open_k_2').value,cls:li.className,small:li.querySelector('small').textContent,prog:$('#ckProg').textContent}});
ok(st.r&&st.r.v===3.5&&!st.r.out&&st.r.b==='Anna'&&!st.open&&st.v==='3,5'&&/on/.test(st.cls)&&!/out/.test(st.cls)&&/Anna, 10:30 Uhr · erlaubt 0 bis 5 °C/.test(st.small)&&st.prog==='2 von 12','value inside the range (3,5 °C, allowed 0–5) is saved at once, no question',st.small);
await p.fill(vin('ck_open_k_3'),'−19');await p.press(vin('ck_open_k_3'),'Tab');await w(250);ok(await ev(()=>{const r=ckRun('2026-11-12','ck_open_k').items.ck_open_k_3;return r&&r.v===-19&&!r.out&&!$('#dlg').open&&$('#ckv-ck_open_k_3').value==='-19'}),'negative value (Tiefkühler −19 °C, allowed −30 to −18) accepted');
await p.fill(vin('ck_open_k_3'),'abc');await p.press(vin('ck_open_k_3'),'Tab');await w(200);ok(await ev(()=>ckRun('2026-11-12','ck_open_k').items.ck_open_k_3.v===-19&&$('#ckv-ck_open_k_3').value==='-19')&&/Bitte eine Zahl/.test(await toastT()),'letters are refused, old value stays');
await p.fill(vin('ck_open_k_2'),'9');await p.press(vin('ck_open_k_2'),'Tab');await w(300);
st=await ev(()=>({open:$('#dlg').open,t:$('#dlgForm h3').textContent,txt:$('#dlgForm .dlg-p').textContent,ok:$('#dlgForm button[type="submit"]').textContent,v:ckRun('2026-11-12','ck_open_k').items.ck_open_k_2.v}));
ok(st.open&&st.t==='Wert außerhalb des Bereichs'&&/Kühlhaus-Temperatur notieren: 9 °C/.test(st.txt)&&/Erlaubt sind 0 bis 5 °C/.test(st.txt)&&st.ok==='Mit Notiz speichern'&&st.v===3.5,'value outside the range (9 °C) asks for a short note before anything is saved',st.txt);
await submit();await w(150);ok(await ev(()=>$('#dlg').open&&/kurz notieren/.test(($('#dlgForm .f-err')||{}).textContent||'')&&ckRun('2026-11-12','ck_open_k').items.ck_open_k_2.v===3.5),'without a note it is not saved');
await p.click('#dlgCancel');await w(300);ok(await ev(()=>ckRun('2026-11-12','ck_open_k').items.ck_open_k_2.v===3.5&&$('#ckv-ck_open_k_2').value==='3,5'),'cancel keeps the old value');
await p.fill(vin('ck_open_k_2'),'9');await p.press(vin('ck_open_k_2'),'Tab');await w(300);await p.fill('#dlgForm [name="note"]','Tür war offen, Chef informiert');await submit();await w(350);
st=await ev(()=>{const r=ckRun('2026-11-12','ck_open_k').items.ck_open_k_2;const li=document.querySelector('#app .ck-i[data-item="ck_open_k_2"]');const bad=getComputedStyle(document.documentElement).getPropertyValue('--bad').trim();const c=getComputedStyle(li.querySelector('.ck-v')).color;const d=document.createElement('i');d.style.color=bad;document.body.appendChild(d);const bc=getComputedStyle(d).color;d.remove();return {r,cls:li.className,note:li.querySelector('.ck-note').textContent,red:c===bc,prog:$('#ckProg').textContent}});
ok(st.r.v===9&&st.r.out===1&&st.r.note==='Tür war offen, Chef informiert'&&/out/.test(st.cls)&&st.note==='Tür war offen, Chef informiert'&&st.red&&st.prog==='3 von 12','out-of-range value saved with the note and marked (red only here)',st.r);
await p.fill(vin('ck_open_k_3'),'');await p.press(vin('ck_open_k_3'),'Tab');await w(250);ok(await ev(()=>!ckRun('2026-11-12','ck_open_k').items.ck_open_k_3)&&/Wert gelöscht/.test(await toastT()),'emptying the field removes the value');
await p.click('#toast .toast-act');await w(200);ok(await ev(()=>ckRun('2026-11-12','ck_open_k').items.ck_open_k_3.v===-19),'… with undo');
// ---------- das Team darf abhaken; fertig machen ----------
await ev(()=>{S.settings.currentUser='u_staff';save();render()});await w(200);
await p.click(item(3)+' .ck-c');await w(200);ok(await ev(()=>ckRun('2026-11-12','ck_open_k').items.ck_open_k_4.b==='Florian'),'team can tick; the name of the signed-in person is recorded');
for(let i=4;i<12;i++){await p.click(item(i)+' .ck-c');await w(120);}await w(200);
st=await ev(()=>({prog:$('#ckProg').textContent,state:$('#ckState').textContent,fin:!!$('#app .ck-fin'),over:document.querySelectorAll('.reward,.gd-rw,dialog[open]').length,n:ckRun('2026-11-12','ck_open_k').n,who:[...new Set(Object.values(ckRun('2026-11-12','ck_open_k').items).map(r=>r.b))].sort().join()}));
ok(st.prog==='12 von 12'&&st.state==='fertig'&&st.fin&&/Öffnen Küche: alles erledigt/.test(await toastT())&&st.who==='Anna,Florian','list complete: „12 von 12“, a short confirmation',st);
ok(st.over===0,'list complete: one line at the bottom, no card over the content');
await p.click('#app .ck-fin .btn');await w(250);
const ov2=await ev(()=>({sub:$('#app .page-h .sub').textContent,row:$('#app .ck-l').innerText.replace(/\s+/g,' '),done:$('#app .ck-l').classList.contains('done'),tabs:[...document.querySelectorAll('#app .ck-tabs button')].map(x=>x.textContent)}));
ok(/1 von 4 Listen fertig/.test(ov2.sub)&&/^Öffnen Küche fertig · Florian, 10:30 Uhr · 1 Wert außerhalb 12 von 12/.test(ov2.row)&&ov2.done,'overview shows the finished list and the deviation',ov2.row);
ok(ov2.tabs.join()==='Heute,Verlauf','staff has no „Vorlagen“ tab');
await ev(()=>{S.settings.currentUser='u_chef';save()});
// ---------- Heute ----------
await ev(()=>go('dash'));await w(300);
const dash=await ev(()=>[...document.querySelectorAll('#app .tm-dash .ck-dash')].map(r=>r.innerText.replace(/\s+/g,' ')));
ok(dash.length===4&&/^Öffnen Küche 12 von 12 erledigt · zuletzt Florian, 10:30 Uhr 1 Wert außerhalb Ansehen$/.test(dash[0])&&/^0\/12 Schließen Küche 0 von 12 erledigt Abhaken$/.test(dash[1]),'Heute: one compact row per list due today („Öffnen Küche … 12 von 12 erledigt“) with a button',dash);
await p.click('#app .tm-dash li.ck-dash:nth-of-type(3) [data-act="ckGo"]');await w(250);ok(await ev(()=>view.tab==='checkl'&&$('#app h1').firstChild.textContent==='Schließen Küche'),'button opens the list');
await p.click(item(0)+' .ck-c');await w(150);await ev(()=>go('dash'));await w(250);ok(await ev(()=>/^1\/12 Schließen Küche 1 von 12 erledigt · zuletzt Anna, 10:30 Uhr Abhaken$/.test(document.querySelectorAll('#app .tm-dash .ck-dash')[1].innerText.replace(/\s+/g,' '))),'Heute follows the progress');
// ---------- Verlauf ----------
await ev(()=>{view.ck.tab='verlauf';view.ck.run=null;go('checkl')});await w(300);
const hs=await ev(()=>({rows:[...document.querySelectorAll('#app .ck-hr')].map(r=>r.querySelector('.ck-hb').innerText.replace(/\s+/g,' ')),head:$('#app .ck-hhead').innerText.replace(/\s+/g,' '),late:[...document.querySelectorAll('#app .ck-hc.late')].map(x=>x.closest('.ck-hr').querySelector('.ck-hday b').textContent+' '+x.textContent),out:[...document.querySelectorAll('#app .ck-hc .ck-od')].map(x=>x.closest('.ck-hr').querySelector('.ck-hday b').textContent),todayLate:!!document.querySelector('#app .ck-hr .ck-hc.late')&&document.querySelector('#app .ck-hr').querySelectorAll('.ck-hc.late').length}));
ok(hs.rows.length===14&&/^Heute 12\/12 1\/12 0\/12 0\/12 –$/.test(hs.rows[0])&&/^Mi 11\.11\. – – – – 10\/10$/.test(hs.rows[1])&&/^Fr 30\.10\./.test(hs.rows[13]),'history: the last 14 days, completion per list; Ruhetag shows only the weekly list',hs.rows.slice(0,3));
ok(hs.late.length===1&&/^Fr 6\.11\. .*9\/12$/.test(hs.late[0])&&hs.todayLate===0,'„not finished“ is marked only for days that are over (Fr 6.11. 9/12); today’s open lists are not',hs.late);
ok(hs.out.join()==='Heute,So 8.11.','days with a value outside the range carry a quiet marker',hs.out);
await p.click('#app .ck-hb[data-id="2026-11-08"]');await w(250);
const hd=await ev(()=>{const box=$('#app .ck-hr.open .ck-hdw');const li=[...box.querySelectorAll('li')];const k=li.find(x=>/Kühlhaus/.test(x.textContent));return {lists:[...box.querySelectorAll('h3')].map(h=>h.textContent),k:k.innerText.replace(/\s+/g,' '),out:k.classList.contains('out'),spark:!!k.querySelector('svg.ck-spark polyline'),sparkLbl:k.querySelector('svg.ck-spark').getAttribute('aria-label'),dots:k.querySelectorAll('svg.ck-spark circle.out').length,first:li[0].innerText.replace(/\s+/g,' '),sparks:box.querySelectorAll('svg.ck-spark').length}});
ok(hd.lists.length===4&&/^Öffnen Küche12 von 12 · fertig$/.test(hd.lists[0])&&/^Hände waschen, saubere Arbeitskleidung anziehen Anna · 07:\d\d$/.test(hd.first),'tap a day: every list with who did what and when',hd.first);
ok(hd.out&&/Kühlhaus-Temperatur notieren Tür stand offen\. Nach 30 Minuten wieder 4 °C\. 6,4 °C Anna · 07:\d\d/.test(hd.k)&&hd.spark&&hd.dots===1&&/Messwerte in 14 Tagen, 1 außerhalb von 0 bis 5 °C/.test(hd.sparkLbl)&&hd.sparks===4,'values are shown with the note; each measured item has a tiny sparkline of the last 14 days with the outlier marked',hd.k);
await p.click('#app .ck-hb[data-id="2026-11-06"]');await w(250);
ok(await ev(()=>{const box=$('#app .ck-hr.open .ck-hdw');return document.querySelectorAll('#app .ck-hr.open').length===1&&[...box.querySelectorAll('li.miss')].length===3&&/Eingangstür abschließen offen geblieben/.test([...box.querySelectorAll('li.miss')].pop().innerText.replace(/\s+/g,' '))&&/9 von 12 · nicht fertig geworden/.test(box.textContent)}),'an unfinished list of a past day shows what stayed open');
// ---------- Verlauf als PDF ----------
await ev(()=>{window.__p0=window.print;window.print=()=>{window.__pr=$('#print').innerHTML.length;window.__pn=PDF_NAME;window.__land=$('#print').classList.contains('land')}});
const months=await ev(()=>[...$('#app [data-ckmonth]').options].map(o=>o.textContent));
await p.click('#app [data-pdf="ckPrint"]');await w(300);
const pr=await ev(()=>({n:window.__pr,name:window.__pn,land:window.__land,h:$('#print h1').textContent,days:[...document.querySelectorAll('#print .cp-d')].map(x=>x.textContent),t:$('#print').textContent.replace(/\s+/g,' ')}));
ok(months.join()==='November 2026,Oktober 2026'&&pr.n>3000&&pr.name==='Checklisten-2026-11.pdf'&&!pr.land&&pr.h==='Checklisten · November 2026'&&pr.days.length===12&&pr.days[0]==='Sonntag, 1. November'&&pr.days[11]==='Donnerstag, 12. November','„Als PDF speichern“ for the chosen month: one block per day up to today, file name Checklisten-<Monat>.pdf',pr.days.length);
ok(/Öffnen Küche12 von 12Anna, 07:\d\d–08:\d\d Uhr/.test(pr.t)&&/Kühlhaus-Temperatur notieren: 6,4 °C \(außerhalb: Tür stand offen/.test(pr.t)&&/9 von 12 · nicht fertig/.test(pr.t)&&/Offen: .*Eingangstür abschließen/.test(pr.t)&&/Anna, Florian, 10:30 Uhr/.test(pr.t)&&/Eigene Aufzeichnung des Betriebs/.test(pr.t)&&!/HACCP/.test(pr.t),'PDF content: who and when, measured values with notes, open points; no compliance claim',pr.t.slice(0,160));
await p.selectOption('#app [data-ckmonth]','2026-10');await p.click('#app [data-pdf="ckPrint"]');await w(300);ok(await ev(()=>window.__pn==='Checklisten-2026-10.pdf'&&$('#print h1').textContent==='Checklisten · Oktober 2026'&&document.querySelectorAll('#print .cp-d').length===4),'another month can be chosen');
await ev(()=>{window.print=window.__p0});
// ---------- Vorlagen bearbeiten ----------
await p.click('#app [data-act="ckTab"][data-id="vorlagen"]');await w(250);
ok(await ev(()=>document.querySelectorAll('#app .ck-tpls li').length===5&&/jeden Öffnungstag · 12 Punkte, davon 2 Messwerte · Vorschlag, bitte anpassen/.test($('#app .ck-tpls li').textContent)&&/jede Woche am Mittwoch/.test($('#app .ck-tpls').textContent)&&/Passen Sie sie an Ihren Betrieb an/.test($('#app .ck-tph').textContent)),'template list: rhythm, number of items, „Vorschlag, bitte anpassen“');
await p.click('#app [data-act="ckTplEdit"][data-id="ck_close_k"]');await w(250);
ok(await ev(()=>$('#dlgForm h3').textContent==='Liste bearbeiten'&&$('#dlgForm .ck-sug').textContent==='Vorschlag, bitte anpassen.'&&document.querySelectorAll('#dlgForm .ck-er').length===12&&$('#dlgForm .ck-wd').hidden),'edit dialog');
await p.click('#dlgForm .ck-er:nth-child(3) [data-ckup]');await p.click('#dlgForm .ck-er:nth-child(12) [data-ckdel]');await p.click('#dlgForm [data-ckadd]');await p.fill('#dlgForm .ck-er:last-child [name="it"]','Kerntemperatur Suppe notieren');await p.check('#dlgForm .ck-er:last-child [name="iv"]');await w(80);
await p.fill('#dlgForm .ck-er:last-child [name="imin"]','75');await p.fill('#dlgForm .ck-er:last-child [name="imax"]','');await submit();await w(120);ok(/erlaubten Bereich/.test(await ev(()=>($('#dlgForm .f-err')||{}).textContent||'')),'a measured value needs its range');
await p.fill('#dlgForm .ck-er:last-child [name="imax"]','95');await p.fill('#dlgForm .ck-er:nth-child(1) [name="it"]','Alles abdecken und beschriften');await submit();await w(300);
const te=await ev(()=>{const t=ckTpl('ck_close_k');return {items:t.items.map(i=>i.t),ids:t.items.map(i=>i.id),last:t.items[t.items.length-1].val,sug:!!t.sug,old:t.old.map(o=>o.t),n:t.items.length}});
ok(te.n===12&&te.items[0]==='Alles abdecken und beschriften'&&te.items[1]==='Kühlhaus-Temperatur notieren'&&te.ids[1]==='ck_close_k_3'&&te.ids[0]==='ck_close_k_1'&&te.items[11]==='Kerntemperatur Suppe notieren'&&JSON.stringify(te.last)==='{"unit":"°C","min":75,"max":95}'&&!te.sug&&te.old.join()==='Kühlhaus und Hintertür abschließen','items reordered, renamed, added (with range), removed; the „Vorschlag“ label is gone after the first own edit',te.items);
ok(await ev(()=>{view.ck.tab='verlauf';view.ck.hist='2026-11-08';render();const box=$('#app .ck-hr.open .ck-hdw');return /Kühlhaus und Hintertür abschließen/.test(box.textContent)&&/Schließen Küche12 von 12/.test(box.textContent.replace(/\s+/g,''))||/Kühlhaus und Hintertür abschließen/.test(box.textContent)}),'history still names an item that was removed from the list later');
await ev(()=>{view.ck.tab='vorlagen';render()});await p.click('#app [data-act="ckTplNew"]');await w(250);await p.fill('#dlgForm [name="name"]','Terrasse');await p.selectOption('#dlgForm [name="when"]','weekly');await w(80);
ok(await ev(()=>!$('#dlgForm .ck-wd').hidden),'weekly list: weekday can be picked');await p.selectOption('#dlgForm [name="wd"]','4');await p.fill('#dlgForm .ck-er [name="it"]','Möbel abwischen');await submit();await w(300);
ok(await ev(()=>{const t=S.checks.templates.find(x=>x.name==='Terrasse');return t&&t.when==='weekly'&&t.wd===4&&t.items.length===1&&t.since==='2026-11-12'&&!t.sug&&ckDue('2026-11-12').includes(t)&&!ckDue('2026-11-05').includes(t)&&ckDue('2026-11-19').includes(t)}),'new weekly list (Thursday) is due from today on, not in the past');
await p.click(`#app .ck-tpls li:last-child [data-act="ckTplEdit"]`);await w(200);await p.click('#dlgDel');await w(250);await submit();await w(300);
ok(await ev(()=>document.querySelectorAll('#app .ck-tpls li').length===5&&!ckDue('2026-11-12').some(t=>t.name==='Terrasse')),'a list can be deleted');
// ---------- Speichern ----------
const snap=await ev(()=>JSON.stringify([S.checks.runs['2026-11-12'],ckTpl('ck_close_k').items]));
await p.reload();await w(800);ok(await ev(s=>JSON.stringify([S.checks.runs['2026-11-12'],ckTpl('ck_close_k').items])===s,snap),'ticks, values and edited lists survive a reload');
// ---------- eine Darstellung: Chef sieht „Vorlagen“, das Team nicht ----------
await ev(()=>{view.ck.tab='vorlagen';view.ck.run=null;go('checkl')});await w(300);
ok(await ev(()=>[...document.querySelectorAll('#app .ck-tabs button')].map(x=>x.textContent).join()==='Heute,Verlauf,Vorlagen'),'Chef: Heute, Verlauf, Vorlagen');
await ev(()=>{S.settings.currentUser='u_staff';save();view.ck.tab='vorlagen';go('checkl')});await w(300);
ok(await ev(()=>[...document.querySelectorAll('#app .ck-tabs button')].map(x=>x.textContent).join()==='Heute,Verlauf'&&document.querySelectorAll('#app .ck-l').length===4),'Team: running lists and history stay, editing the lists is not offered');
await p.click('#app .ck-l[data-id="ck_open_s"]');await w(200);await p.click(item(0)+' .ck-c');await w(150);ok(await ev(()=>$('#ckProg').textContent==='1 von 12'),'Team: ticking works the same');
await ev(()=>{S.settings.currentUser='u_chef';save()});
await b.close();
// ---------- nach Mitternacht gehört noch zum Vortag; Ruhetag ----------
{const {b,p,errs:e2}=await L.open({at:[2026,11,13,1,40]});const ev=(f,a)=>p.evaluate(f,a);
ok(await ev(()=>todayStr()==='2026-11-13'&&ckToday()==='2026-11-12'),'01:40 at night still counts as the day before (until 5 o’clock), so closing lists can be finished');
await ev(()=>go('dash'));await p.waitForTimeout(250);ok(await ev(()=>/Checklisten noch vom Vortag/.test($('#app .tm-dash .day-h').textContent)),'Heute says so');errs.push(...e2);await b.close();}
{const {b,p,errs:e2}=await L.open({at:[2026,11,11,9,0]});const ev=(f,a)=>p.evaluate(f,a);await ev(()=>go('checkl'));await p.waitForTimeout(250);
ok(await ev(()=>document.querySelectorAll('#app .ck-l').length===1&&/Wochenputz/.test($('#app .ck-l').textContent)&&/jede Woche am Mittwoch/.test($('#app .ck-l').textContent)),'on the Ruhetag (Wednesday) only the Wochenputz is offered');
await ev(()=>{ckTpl('ck_week').wd=1;render()});ok(await ev(()=>/Heute ist keine Liste fällig/.test($('#app .ck-none').textContent)&&/Ruhetag/.test($('#app .ck-none').textContent)),'nothing due: said plainly');
await ev(()=>go('dash'));await p.waitForTimeout(250);ok(await ev(()=>document.querySelectorAll('#app .tm-dash .ck-dash').length===0&&/Ruhetag, niemand eingeteilt/.test($('#app .tm-dash-who').textContent)),'Heute on the Ruhetag: no list rows');errs.push(...e2);
await L.done(b,errs);}
})();
