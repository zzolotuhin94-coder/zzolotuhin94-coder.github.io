// Dienstplan: Abläufe am Bildschirm. Uhr steht auf Donnerstag, 12.11.2026, 10:30 (KW 46). Beispiel-Team, angemeldet als Chef (= Anna).
const L=require('./tlib');const ok=L.ok;
(async()=>{const {b,p,errs}=await L.open({});const ev=(f,a)=>p.evaluate(f,a);const w=ms=>p.waitForTimeout(ms);
const toastT=()=>ev(()=>$('#toast').classList.contains('show')?$('#toast').textContent:'');
const cell=(pid,D)=>`#app .tm-t td[data-id="${pid}|${D}"]`;const submit=()=>p.click('#dlgForm button[type="submit"]');
const dlg=()=>ev(()=>$('#dlg').open?{t:$('#dlgForm h3').textContent,ok:($('#dlgForm button[type="submit"]')||{}).textContent,err:($('#dlgForm .f-err')||{}).textContent||'',del:!!$('#dlgDel')}:null);
const n=D=>ev(D=>tmShifts(D).length,D);
// ---------- Navigation ----------
const nav=await ev(()=>({side:[...document.querySelectorAll('.side .nav-i')].map(x=>x.dataset.tab),groups:document.querySelectorAll('.side .nav-group').length,ico:[...document.querySelectorAll('.side .nav-i[data-tab="team"] svg *,.side .nav-i[data-tab="checkl"] svg *')].length,desc:[NAV_DESC.team,NAV_DESC.checkl],titles:[...document.querySelectorAll('.side .nav-i')].every(b=>b.title.length>20),foot:(()=>{const r=document.querySelector('.side .side-foot').getBoundingClientRect();return r.bottom<=innerHeight+1})()}));
ok(nav.groups===0&&nav.side.join()==='dash,vorb,checkl,menu,cards,ware,team,apart,setup'&&nav.ico>=6&&nav.desc.every(d=>d.length>25)&&nav.titles,'nav: Checklisten and „Team & Zahlen“ among the seven areas, own icons, one-line descriptions',nav.side);
ok(nav.foot,'sidebar still fits at 1440×900 (footer visible)');
await p.click('.side .nav-i[data-tab="team"]');await w(300);
ok(await ev(()=>view.tab==='dienst'&&location.hash==='#team/dienstplan'&&/Team & Zahlen/.test(document.title)&&[...document.querySelectorAll('#app .toolbar.tabs .seg button')].map(x=>x.textContent.trim()).join()==='Dienstplan,Auswertung'),'„Team & Zahlen“ opens the Dienstplan (#team/dienstplan), with the tabs Dienstplan · Auswertung');
await ev(()=>{location.hash='#checkl'});await w(300);ok(await ev(()=>view.tab==='checkl'&&$('#app h1').textContent.includes('Checklisten')),'old address #checkl still opens Checklisten');
await ev(()=>go('dienst'));await w(250);
// ---------- Woche ----------
const wkv=await ev(()=>({h1:$('#app h1').firstChild.textContent,sub:$('#app .page-h .sub').textContent,kw:$('#app .tm-kw').textContent,rows:[...document.querySelectorAll('#app .tm-t tbody tr:not(.tm-grp)')].map(r=>r.querySelector('.tm-name').textContent),cols:[...document.querySelectorAll('#app .tm-t thead th')].slice(1).map(t=>t.textContent),closed:$('#app .tm-t thead th.closed').textContent,today:$('#app .tm-t thead th.today').textContent,now:$('#app .tm-now').disabled,prim:document.querySelectorAll('#app .btn.primary').length,anna:$('#app .tm-t tbody tr:not(.tm-grp) .tm-hv').textContent+' '+$('#app .tm-t tbody tr:not(.tm-grp) .tm-hs').textContent,demo:/Beispiel-Team/.test($('#app .page-h .sub').textContent),foot:$('#app .tm-t tfoot').innerText.replace(/\s+/g,' ')}));
ok(wkv.h1==='Team & Zahlen'&&/KW 46 · 9\.–15\. November 2026/.test(wkv.sub)&&/KW 46.*9\.11\.–15\.11\./.test(wkv.kw)&&wkv.now,'week view: KW number and date range, „Diese Woche“ inactive in the current week',wkv.kw);
ok(wkv.rows.join()==='Anna,Lukas,Florian,Magdalena,Theresa,Hannes'&&wkv.cols.length===7&&/^Mo9\.11\./.test(wkv.cols[0])&&/^Do12\.11\./.test(wkv.today),'rows = people (by area), columns = Monday to Sunday, today marked',wkv.cols);
ok(/Mi11\.11\.Ruhetag/.test(wkv.closed),'Ruhetag column is labelled „Ruhetag“',wkv.closed);
ok(wkv.anna==='37,5 von 40 Std.'&&wkv.prim===1&&wkv.demo,'hours per person against target; one primary action; example team is labelled',wkv.anna);
ok(/Besetzung Küche 1 Service 1 Küche 2 Service 1 Bar 1 Küche 2 Service 1 Bar 1/.test(wkv.foot),'day footer: people per area',wkv.foot);
await p.click('#app [data-act="tmNext"]');await w(200);ok(await ev(()=>/KW 47/.test($('#app .tm-kw').textContent)&&!$('#app .tm-now').disabled&&tmView().w==='2026-11-16'),'next week → KW 47');
await p.click('#app .tm-now');await w(200);ok(await ev(()=>tmView().w==='2026-11-09'),'„Diese Woche“ jumps back');
await p.keyboard.press('ArrowLeft');await w(200);ok(await ev(()=>tmView().w==='2026-11-02'),'arrow keys change the week');await p.keyboard.press('ArrowRight');await w(200);
// ---------- Dienst eintragen: Vorlage ----------
await p.click(cell('tp_anna','2026-11-09'));await w(250);let d=await dlg();
const tpl=await ev(()=>[...document.querySelectorAll('#dlgForm .tm-tb')].map(x=>x.innerText.replace(/\s+/g,' ')));
ok(d&&d.t==='Anna · Mo 9.11.'&&d.ok==='Eintragen'&&!d.del&&tpl.join('|')==='Früh 08:00–16:00|Spät 15:00–23:00|Teildienst 10:00–14:00 17:30–22:00','tap an empty cell → dialog with the three templates',tpl);
await submit();await w(150);d=await dlg();ok(d&&/Beginn und Ende/.test(d.err)&&await n('2026-11-09')===2,'empty times: message at the field, nothing saved',d&&d.err);
await p.click('#dlgForm .tm-tb[data-tmtpl="tt_teil"]');await w(100);
const f1=await ev(()=>{const f=$('#dlgForm');return {v:[f.elements.s1.value,f.elements.e1.value,f.elements.s2.value,f.elements.e2.value],two:!f.querySelector('.tm-p2').hidden,sum:$('#tmSum').textContent,on:f.querySelector('.tm-tb.on b').textContent}});
ok(f1.v.join()==='10:00,14:00,17:30,22:00'&&f1.two&&f1.sum==='8,5 Std.'&&f1.on==='Teildienst','template „Teildienst“ fills both parts; hours shown before saving',f1);
await submit();await w(300);
let st=await ev(()=>{const s=tmShiftsOf('tp_anna','2026-11-09')[0];return {parts:s&&s.parts,area:s&&s.area,chip:$('#app .tm-t td[data-id="tp_anna|2026-11-09"] .tm-sh').innerText.replace(/\s+/g,' '),h:$('#app .tm-t tbody tr:not(.tm-grp) .tm-hv').textContent,open:$('#dlg').open}});
ok(st.parts&&st.parts.join('|')==='10:00,14:00|17:30,22:00'&&st.area==='kueche'&&st.chip==='10:00–14:00 17:30–22:00'&&st.h==='46'&&!st.open,'split shift saved and shown; week hours 37,5 + 8,5 = 46',st);
ok(/Dienst eingetragen: Anna, Mo 9\.11\./.test(await toastT())&&await ev(()=>!!$('#toast .toast-act')),'toast with „Rückgängig“');
await p.click('#toast .toast-act');await w(250);ok(await ev(()=>tmShiftsOf('tp_anna','2026-11-09').length===0&&$('#app .tm-t tbody tr:not(.tm-grp) .tm-hv').textContent==='37,5'),'undo removes the shift again');
// eigene Zeiten, über Mitternacht, anderer Bereich, Notiz
await p.click(cell('tp_anna','2026-11-09'));await w(200);await p.fill('#dlgForm [name="s1"]','18:00');await p.fill('#dlgForm [name="e1"]','18:00');await submit();await w(100);
ok(/gleich/.test((await dlg()).err),'same start and end: rejected');
await p.fill('#dlgForm [name="e1"]','02:00');await p.selectOption('#dlgForm [name="area"]','bar');await p.fill('#dlgForm [name="note"]','Aushilfe');await w(100);
ok(await ev(()=>$('#tmSum').textContent)==='7,5 Std. · 8 Std. minus 30 Min. Pause · endet am nächsten Tag','custom 18:00–02:00: summary names the break and the next-day end');
await submit();await w(300);
st=await ev(()=>{const s=tmShiftsOf('tp_anna','2026-11-09')[0];return {s:[s.parts.join(),s.area,s.note],chip:$('#app .tm-t td[data-id="tp_anna|2026-11-09"] .tm-sh').innerText.replace(/\s+/g,' '),hint:tmHints('2026-11-09').filter(h=>h.pid==='tp_anna').map(h=>[h.D,h.k,h.v])}});
ok(st.s.join('|')==='18:00,02:00|bar|Aushilfe'&&st.chip==='18:00–02:00 Bar · Aushilfe','shift past midnight in another area with a note',st.chip);
// Anna: Mo 18–02, Di 08–16 → 6 h Ruhe; jetzt 6 Tage Mo,Di,Do,Fr,Sa,So (Mi frei) → kein Folge-Hinweis
ok(JSON.stringify(st.hint)==='[["2026-11-10","rest",6]]','new shift triggers the rest hint on Tuesday (02:00 → 08:00 = 6 h)',st.hint);
// zweiter Dienst am selben Tag: Überschneidung
await p.click(cell('tp_anna','2026-11-09'),{position:{x:8,y:52}});await w(200);d=await dlg();
if(d&&d.ok==='Eintragen'){await p.fill('#dlgForm [name="s1"]','20:00');await p.fill('#dlgForm [name="e1"]','23:00');await submit();await w(120);}
ok(/schon einen Dienst in dieser Zeit/.test((await dlg()||{}).err||''),'overlapping second shift on the same day is rejected');
await p.fill('#dlgForm [name="s1"]','08:00');await p.fill('#dlgForm [name="e1"]','11:00');await submit();await w(250);ok(await n('2026-11-09')===4&&await ev(()=>tmShiftsOf('tp_anna','2026-11-09').length===2),'a second, non-overlapping shift on the same day is possible');
// ändern, löschen, Rückgängig
await p.click(cell('tp_anna','2026-11-09')+' .tm-sh >> nth=0');await w(200);d=await dlg();ok(d&&d.ok==='Speichern'&&d.del&&await ev(()=>$('#dlgForm [name="s1"]').value==='08:00'&&!$('#dlgForm .tm-or')),'tap a shift → edit dialog with delete');
await p.fill('#dlgForm [name="e1"]','12:00');await submit();await w(250);ok(await ev(()=>tmShiftsOf('tp_anna','2026-11-09')[0].parts[0].join()==='08:00,12:00')&&/Dienst geändert/.test(await toastT()),'edit saves');
await p.click(cell('tp_anna','2026-11-09')+' .tm-sh >> nth=0');await w(200);await p.click('#dlgDel');await w(250);
ok(await ev(()=>tmShiftsOf('tp_anna','2026-11-09').length===1)&&/Dienst gelöscht/.test(await toastT()),'delete');
await p.click('#toast .toast-act');await w(250);ok(await ev(()=>tmShiftsOf('tp_anna','2026-11-09').length===2),'undo brings the deleted shift back');
// ---------- Ruhetag ----------
await p.click(cell('tp_lukas','2026-11-11'));await w(200);await p.click('#dlgForm .tm-tb[data-tmtpl="tt_frueh"]');await p.fill('#dlgForm [name="note"]','Putztag');await submit();await w(250);
ok(await n('2026-11-11')===1&&await ev(()=>$('#app .tm-t td.closed .tm-sh')&&/Putztag/.test($('#app .tm-t td.closed .tm-sh').textContent)&&/Küche 1/.test($('#app .tm-t tfoot td.closed').textContent)),'a shift on the Ruhetag is possible (e.g. cleaning)');
// ---------- Hinweise ----------
const hv=await ev(()=>({mk:document.querySelectorAll('#app .tm-t .tm-sh.hint .tm-mk').length,title:$('#app .tm-t td[data-id="tp_hannes|2026-11-15"] .tm-sh').title,h:$('#tmHints .day-h').textContent,rows:[...document.querySelectorAll('#tmHints .rw')].map(r=>r.innerText.replace(/\s+/g,' ')),note:$('#tmHints .hint').textContent,red:[...document.querySelectorAll('#tmHints *')].some(e=>getComputedStyle(e).color===getComputedStyle(document.documentElement).getPropertyValue('--bad'))}));
ok(/Hinweis, keine Rechtsprüfung/.test(hv.h)&&hv.rows.some(r=>/So 15\.11\. Hannes nur 9 Std\. Ruhe/.test(r))&&hv.rows.some(r=>/Di 10\.11\. Anna nur 6 Std\. Ruhe/.test(r))&&hv.mk>=2&&/Hinweis: nur 9 Std/.test(hv.title),'rule hints: marker on the cell, list under the plan, labelled „Hinweis, keine Rechtsprüfung“',hv.rows);
ok(/Sie können trotzdem alles so planen/.test(hv.note),'hints never block: said in plain words');
// ---------- Abwesenheit ----------
await p.click('#app [data-act="tmNext"]');await w(200);
const ab0=await ev(()=>({chip:$('#app .tm-t td[data-id="tp_theresa|2026-11-19"] .tm-ab').textContent,n:tmShiftsOf('tp_theresa','2026-11-19').length}));ok(ab0.chip==='Urlaub'&&ab0.n===0,'absence shown in the cell',ab0.chip);
await p.click(cell('tp_theresa','2026-11-19'),{position:{x:8,y:52}});await w(200);ok(await ev(()=>/Urlaub/.test(($('#dlgForm .tm-abn')||{}).textContent||'')),'add dialog on an absent day says so');
await p.click('#dlgForm .tm-tb[data-tmtpl="tt_spaet"]');await submit();await w(150);
const conf=await ev(()=>({open:$('#dlg').open,msg:($('#dlgForm .tm-conf')||{}).textContent,btn:$('#dlgForm button[type="submit"]').textContent,n:tmShiftsOf('tp_theresa','2026-11-19').length}));
ok(conf.open&&/Theresa: Urlaub an diesem Tag\. Wirklich einteilen\?/.test(conf.msg)&&conf.btn==='Trotzdem einteilen'&&conf.n===0,'adding a shift on an absence asks for confirmation first',conf);
await submit();await w(250);ok(await ev(()=>tmShiftsOf('tp_theresa','2026-11-19').length===1&&!$('#dlg').open&&!!tmAbsOf('tp_theresa','2026-11-19')),'second tap on „Trotzdem einteilen“ saves; the absence stays visible');
await p.click(cell('tp_lukas','2026-11-22'));await w(200);await p.click('#dlgForm [data-tmabs="krank"]');await w(250);
ok(await ev(()=>tmAbsOf('tp_lukas','2026-11-22').t==='krank'&&$('#app .tm-t td[data-id="tp_lukas|2026-11-22"] .tm-ab').textContent==='Krank')&&/Lukas, So 22\.11\.: Krank/.test(await toastT()),'absence „Krank“ entered with one tap from the add dialog');
await p.click(cell('tp_lukas','2026-11-22')+' .tm-ab');await w(200);await p.click('#dlgForm .tm-radio input[value="wunsch"]',{force:true});await p.fill('#dlgForm [name="note"]','Hochzeit');await submit();await w(250);
ok(await ev(()=>{const a=tmAbsOf('tp_lukas','2026-11-22');return a.t==='wunsch'&&a.note==='Hochzeit'&&/Kann nicht/.test($('#app .tm-t td[data-id="tp_lukas|2026-11-22"] .tm-ab').textContent)}),'absence can be changed to „Kann nicht“ with a note');
await p.click(cell('tp_lukas','2026-11-22')+' .tm-ab');await w(200);await p.click('#dlgDel');await w(250);ok(await ev(()=>!tmAbsOf('tp_lukas','2026-11-22'))&&/Abwesenheit entfernt/.test(await toastT()),'absence removed');
await p.click('#toast .toast-act');await w(200);ok(await ev(()=>tmAbsOf('tp_lukas','2026-11-22').t==='wunsch'),'… and restored with undo');
// ---------- Vorwoche kopieren ----------
await p.click('#app [data-act="tmNext"]');await w(200);ok(await ev(()=>tmView().w==='2026-11-23'&&tmWeekCount('2026-11-23')===0),'KW 48 is empty');
const src=await ev(()=>({n:tmWeekCount('2026-11-16')}));
await p.click('#app [data-act="tmCopyPrev"]');await w(300);
const cp=await ev(()=>({n:tmWeekCount('2026-11-23'),mo:tmShifts('2026-11-23').map(s=>tmPerson(s.pid).name+' '+tmPartsTxt(s.parts,true)).sort().join(', '),demo:tmShifts('2026-11-23').some(s=>s.demo),open:$('#dlg').open,over:document.querySelectorAll('.reward,.gd-rw').length}));
ok(cp.n===src.n&&!cp.open&&/aus der Vorwoche kopiert/.test(await toastT())&&cp.mo==='Lukas 15–23, Magdalena 10–14 + 17:30–22','„Vorwoche kopieren“ into an empty week copies every shift to the same weekday',[cp.n,cp.mo]);
ok(cp.over===0&&!cp.demo,'copying a week shows no reward card; copied shifts are not flagged as examples');
await p.click('#toast .toast-act');await w(250);ok(await ev(()=>tmWeekCount('2026-11-23')===0),'copy can be undone');
await p.click('#app [data-act="tmCopyPrev"]');await w(250);await p.click('#app [data-act="tmCopyPrev"]');await w(250);d=await dlg();
ok(d&&d.t==='Vorwoche kopieren'&&d.ok==='Ersetzen'&&await ev(()=>/stehen schon \d+ Dienste/.test($('#dlgForm .dlg-p').textContent)),'copying into a week that already has shifts asks before replacing');
await submit();await w(300);ok(await ev(()=>tmWeekCount('2026-11-23'))===src.n,'… and replaces, without doubling');
// ---------- Wochenvorlagen ----------
await p.click('#app [data-act="tmPatterns"]');await w(250);ok(await ev(()=>$('#dlgForm h3').textContent==='Wochenvorlagen'&&document.querySelectorAll('#dlgForm .tm-pats li').length===1&&/Normale Woche/.test($('#dlgForm .tm-pats').textContent)),'pattern dialog lists the saved patterns');
await p.click('#dlgForm [data-tmpatsave]');await w(100);ok(/Namen/.test((await dlg()).err),'saving a pattern needs a name');
await p.fill('#dlgForm [name="pname"]','Mit Aushilfe');await p.click('#dlgForm [data-tmpatsave]');await w(250);
ok(await ev(n=>{const pt=S.team.patterns.find(x=>x.name==='Mit Aushilfe');return !!pt&&pt.days.reduce((a,l)=>a+l.length,0)===n&&!$('#dlg').open},src.n)&&/Wochenvorlage „Mit Aushilfe“ gespeichert/.test(await toastT()),'„Als Vorlage speichern“ stores the week under a name');
await p.click('#app [data-act="tmNext"]');await w(200);await p.click('#app [data-act="tmPatterns"]');await w(200);await p.click('#dlgForm [data-tmpat="tw_normal"]');await w(300);
const pa=await ev(()=>({w:tmView().w,n:tmWeekCount('2026-11-30'),exp:S.team.patterns.find(x=>x.id==='tw_normal').days.reduce((a,l)=>a+l.length,0),mi:tmShifts('2026-12-02').length}));
ok(pa.w==='2026-11-30'&&pa.n===pa.exp&&pa.n>20&&pa.mi===0&&/Vorlage angewendet: \d+ Dienste/.test(await toastT()),'„Vorlage anwenden“ fills the week from the pattern',pa);
await p.click('#toast .toast-act');await w(250);ok(await ev(()=>tmWeekCount('2026-11-30')===0),'applying a pattern can be undone');
// ---------- Mein Dienst, Monat ----------
await p.click('#app .tm-now');await w(200);await p.click('#app .tm-mine');await w(250);
const mine=await ev(()=>({rows:[...document.querySelectorAll('#app .tm-t tbody tr:not(.tm-grp) .tm-name')].map(x=>x.textContent),on:$('#app .tm-mine').getAttribute('aria-pressed'),note:$('#app .tm-mine-n').textContent,hints:[...document.querySelectorAll('#tmHints .rw-main b')].map(x=>x.textContent)}));
ok(mine.rows.join()==='Anna'&&mine.on==='true'&&/Anna: 7 Dienste, 49 Std\. in dieser Woche/.test(mine.note)&&mine.hints.every(x=>x==='Anna'),'„Mein Dienst“ shows only the signed-in person (Küchenchef = Anna)',mine);
await p.click('#app .tm-mine');await w(200);ok(await ev(()=>document.querySelectorAll('#app .tm-t tbody tr:not(.tm-grp)').length===6),'second tap shows everyone again');
await p.click('#app [data-act="tmMode"][data-id="month"]');await w(250);
const mon=await ev(()=>({kw:$('#app .tm-kw').textContent,rows:document.querySelectorAll('#app .tm-month tbody tr').length,anna:$('#app .tm-month tbody tr').innerText.replace(/\s+/g,' '),hint:$('#app .tm-month + .hint').textContent,calc:tmMonthStats('2026-11').find(r=>r.pid==='tp_anna')}));
ok(mon.kw==='November 2026'&&mon.rows===6&&/ohne unbezahlte Pause \(30 Min\. bei Diensten über 6 Std\.\)/.test(mon.hint)&&/Keine Lohnabrechnung/.test(mon.hint)&&mon.anna.includes(String(mon.calc.n))&&mon.anna.includes(tmHs(mon.calc.h)),'month summary: shifts and hours per person, compared with the target; the break rule is stated',mon.anna);
function tmHs(h){return (Math.round(h*100)/100).toLocaleString('de-DE',{maximumFractionDigits:2})}
await p.click('#app [data-act="tmMode"][data-id="week"]');await w(200);
// ---------- Text kopieren ----------
await p.click('#app [data-act="tmText"]');await w(400);
const clip=await ev(async()=>({c:await navigator.clipboard.readText(),t:tmWeekText('2026-11-09')}));
ok(clip.c===clip.t&&/^Dienstplan KW 46 \(9\.11\.–15\.11\.\)\nMo 9\.11\.: Küche – Anna 08–12, Lukas 15–23 · Service – Magdalena 10–14 \+ 17:30–22 · Bar – Anna 18–02 \(Aushilfe\)\nDi 10\.11\./.test(clip.c)&&/Mi 11\.11\.: Küche – Lukas 08–16 \(Putztag\)/.test(clip.c)&&!/Kann nicht|Familienfeier|Urlaub|Krank/.test(clip.c)&&/kopiert/.test(await toastT()),'„Text kopieren“: plain text per day on the clipboard, without absences',clip.c.split('\n').slice(0,2));
await ev(()=>{navigator.clipboard.writeText=()=>Promise.reject(new Error('gesperrt'))});await p.click('#app [data-act="tmText"]');await w(300);
ok(await ev(()=>$('#dlg').open&&$('#dlgForm h3').textContent==='Dienstplan als Text'&&$('#tmTxt').value===tmWeekText('2026-11-09')&&$('#tmTxt').selectionEnd===$('#tmTxt').value.length),'clipboard blocked → dialog with the text selected');
await ev(()=>$('#dlg').close());
// ---------- PDF ----------
await ev(()=>{window.__pr=0;window.__p0=window.print;window.print=()=>{window.__pr=$('#print').innerHTML.length;window.__pn=PDF_NAME;window.__land=$('#print').classList.contains('land')}});
await p.click('#app .page-h [data-pdf="tmPrint"]');await w(300);
const pr=await ev(()=>({n:window.__pr,name:window.__pn,land:window.__land,h:$('#print h1').textContent,sub:$('#print .tp-sub').textContent,th:[...document.querySelectorAll('#print thead th')].map(x=>x.textContent),rows:[...document.querySelectorAll('#print tbody tr:not(.tp-g)')].map(r=>r.querySelector('th b').textContent),anna:$('#print tbody tr:not(.tp-g)').textContent.replace(/\s+/g,''),flo:[...document.querySelectorAll('#print tbody tr:not(.tp-g)')][2].textContent.replace(/\s+/g,''),foot:$('#print tfoot').textContent.replace(/\s+/g,''),meta:$('#print .meta').textContent,one:document.querySelectorAll('#print table').length}));
ok(pr.n>2000&&pr.name==='Dienstplan-KW46-2026-11-09.pdf'&&pr.land&&pr.h==='Dienstplan · KW 46'&&pr.sub==='9.–15. November 2026'&&pr.one===1,'„Als PDF speichern“: #print filled, landscape flag, file name Dienstplan-KW46-<Montag>.pdf',[pr.name,pr.h]);
ok(pr.th.length===8&&/Mi 11\.11\.Ruhetag/.test(pr.th[3])&&pr.rows.join()==='Anna,Lukas,Florian,Magdalena,Theresa,Hannes'&&/AnnaKüche08:00–12:0018:00–02:00Bar·Aushilfe08:00–16:00/.test(pr.anna)&&/BesetzungKüche2Service1Bar1/.test(pr.foot)&&/DAHUAM/.test(pr.meta)&&/Stand 12\.11\.2026/.test(pr.meta),'PDF content: one table, every person a row, times, area and note, staffing, restaurant name and date',pr.anna);
ok(/abwesend/.test(pr.flo)&&!/Familienfeier|Kann nicht/.test(pr.flo),'PDF for the wall: no reasons for absence',pr.flo);
const pw=await ev(()=>{const el=$('#print');el.classList.add('pdf','land');const r={w:el.offsetWidth,h:el.scrollHeight,fs:parseFloat(getComputedStyle(el.querySelector('.tp-s b')).fontSize),name:parseFloat(getComputedStyle(el.querySelector('tbody th b')).fontSize)};el.classList.remove('pdf','land');return r});
// A4 quer: 1123 px breit, eine Seite = 1123 × (595 − 52)/842 = 724 px
ok(pw.w===1123&&pw.h<=724&&pw.fs>=15&&pw.name>=20,'PDF layout: A4 landscape width, fits one page, shift times ≥ 15 px and names ≥ 20 px for the wall',pw);
await ev(()=>{window.print=window.__p0});
const [dl]=await Promise.all([p.waitForEvent('download'),ev(()=>saveFile('Dienstplan-KW46-2026-11-09.pdf',new Blob(['x'])))]);await w(200);
ok(dl.suggestedFilename()==='Dienstplan-KW46-2026-11-09.pdf'&&await ev(()=>!document.querySelector('.reward,.gd-rw')),'the file is saved under its name; nothing pops up afterwards');
// ---------- Team verwalten ----------
await p.click('#app [data-act="tmTeam"]');await w(250);
const td=await ev(()=>({t:$('#dlgForm h3').textContent,rows:document.querySelectorAll('#dlgForm .tm-pr').length,priv:$('#dlgForm .tm-priv').textContent,demo:$('#dlgForm .tm-demo-l').textContent,me:$('#dlgForm [name="meP"]').selectedOptions[0].textContent,brk:[$('#dlgForm [name="bp"]').value,$('#dlgForm [name="ba"]').value,$('#dlgForm [name="bm"]').value]}));
ok(td.t==='Team verwalten'&&td.rows===6&&/Die Namen bleiben auf diesem Gerät und, wenn Sie die Cloud nutzen, in der Cloud Ihres Betriebs\./.test(td.priv)&&/Beispiel-Team mit erfundenen Namen/.test(td.demo)&&td.me==='Anna'&&td.brk.join()==='0,6,30','team dialog: people, break rule, one quiet privacy line, example team named as such',td.priv);
await p.click('#dlgForm [data-tmpadd]');await w(100);await submit();await w(100);ok(/Namen eintragen/.test((await dlg()).err),'new person needs a name');
await p.fill('#dlgForm .tm-pr:last-child [name="pn"]','Vroni');await p.selectOption('#dlgForm .tm-pr:last-child [name="pa"]','service');await p.fill('#dlgForm .tm-pr:last-child [name="pt"]','12,5');
await p.click('#dlgForm .tm-pr[data-pid="tp_florian"] [data-tmpdel]');await p.selectOption('#dlgForm [name="bp"]','1');await submit();await w(300);
const tm=await ev(()=>{const v=S.team.people.find(p=>p.name==='Vroni');return {v:v&&[v.area,v.target,v.color,v.active,!!v.demo],n:S.team.people.length,flo:Object.values(S.team.shifts).flat().some(s=>s.pid==='tp_florian')||Object.values(S.team.abs).some(a=>a.tp_florian),paid:S.team.settings.breakPaid,anna:$('#app .tm-t tbody tr:not(.tm-grp) .tm-hv').textContent,rows:[...document.querySelectorAll('#app .tm-t tbody tr:not(.tm-grp) .tm-name')].map(x=>x.textContent)}});
ok(tm.v&&tm.v.join()==='service,12.5,6,true,false'&&tm.n===6&&!tm.flo&&tm.rows.join()==='Anna,Lukas,Magdalena,Theresa,Vroni,Hannes','person added (colour assigned automatically, target hours with comma), person removed together with its shifts',tm);
// bezahlte Pause: Anna Mo 4 + 8, Di,Do,Fr,Sa,So je 8 = 52
ok(tm.paid&&tm.anna==='52'&&/1 Person entfernt/.test(await toastT()),'break rule switched to „bezahlt“: hours follow at once (Anna 52)',tm.anna);
await p.click('#toast .toast-act');await w(300);ok(await ev(()=>S.team.people.length===6&&!!tmPerson('tp_florian')&&!S.team.settings.breakPaid&&Object.values(S.team.shifts).flat().some(s=>s.pid==='tp_florian')&&$('#app .tm-t tbody tr:not(.tm-grp) .tm-hv').textContent==='49'),'team changes can be undone as a whole');
// ---------- Dienst-Vorlagen ----------
await p.click(cell('tp_florian','2026-11-09'));await w(200);await p.click('#dlgForm [data-tmtpledit]');await w(400);
ok((await dlg()).t==='Dienst-Vorlagen'&&await ev(()=>document.querySelectorAll('#dlgForm .tm-tr').length===3),'template list is editable');
await p.click('#dlgForm [data-tmtadd]');await p.fill('#dlgForm .tm-tr:last-child [name="tn"]','Abend');await p.fill('#dlgForm .tm-tr:last-child [name="a1"]','17:00');await p.fill('#dlgForm .tm-tr:last-child [name="b1"]','22:00');await submit();await w(500);
ok(await ev(()=>S.team.templates.length===4&&S.team.templates[3].name==='Abend'&&$('#dlg').open&&[...document.querySelectorAll('#dlgForm .tm-tb b')].map(x=>x.textContent).join()==='Früh,Spät,Teildienst,Abend'),'new template is offered in the shift dialog right away');
await ev(()=>$('#dlg').close());
// ---------- Speichern ----------
const snap=await ev(()=>JSON.stringify([S.team.shifts['2026-11-09'],S.team.abs['2026-11-22'],S.team.patterns.length,S.team.templates.length]));
await p.reload();await w(800);ok(await ev(s=>JSON.stringify([S.team.shifts['2026-11-09'],S.team.abs['2026-11-22'],S.team.patterns.length,S.team.templates.length])===s,snap),'everything survives a reload');
// ---------- Rollen: das Team liest und trägt nur den eigenen Frei-Wunsch ein ----------
await ev(()=>{S.settings.currentUser='u_staff';save();go('dienst')});await w(300);
const ro=await ev(()=>({btn:[...document.querySelectorAll('#app .page-h .btn')].map(x=>x.textContent.trim()),tools:!!$('#app [data-act="tmCopyPrev"],#app [data-act="tmPatterns"],#app [data-act="tmTeam"]'),plus:[...new Set([...document.querySelectorAll('#app .tm-t .tm-plus')].map(x=>x.dataset.id.split('|')[0]))],note:$('#app .tm-ro').textContent,me:tmMePerson().name}));
ok(ro.btn.join()==='Text kopieren,Als PDF speichern'&&!ro.tools&&ro.plus.join()==='tp_florian'&&ro.me==='Florian'&&/Den Plan ändert der Chef/.test(ro.note),'team: no team, copy or pattern tools; plus only in the own row',ro);
const sBefore=await ev(()=>JSON.stringify(S.team.shifts));
await p.click(cell('tp_anna','2026-11-13')+' .tm-sh');await w(200);ok(!(await dlg())&&/nur der Chef/.test(await toastT()),'staff taps a shift: read-only message, no dialog');
await p.click(cell('tp_lukas','2026-11-12'),{position:{x:8,y:52}});await w(200);ok(!(await dlg())&&/nur Ihren eigenen Frei-Wunsch/.test(await toastT()),'staff taps someone else’s cell: nothing to edit');
await p.click(cell('tp_florian','2026-11-12'));await w(250);d=await dlg();ok(d&&d.t==='Frei-Wunsch · Do 12.11.'&&d.ok==='Wunsch eintragen'&&await ev(()=>!$('#dlgForm .tm-tb')&&!$('#dlgForm [name="s1"]')),'staff taps the own row: only the Frei-Wunsch dialog');
await p.fill('#dlgForm [name="note"]','Arzttermin');await submit();await w(250);
ok(await ev(()=>{const a=tmAbsOf('tp_florian','2026-11-12');return a&&a.t==='wunsch'&&a.note==='Arzttermin'&&a.by==='Florian'&&/Kann nicht/.test($('#app .tm-t td[data-id="tp_florian|2026-11-12"] .tm-ab').textContent)})&&await ev(s=>JSON.stringify(S.team.shifts)===s,sBefore),'own Frei-Wunsch („kann nicht“) saved with the name; shifts untouched');
await ev(()=>{S.team.abs['2026-11-13']={tp_florian:{t:'urlaub',note:''}};render()});await p.click(cell('tp_florian','2026-11-13')+' .tm-ab');await w(200);
ok(await ev(()=>$('#dlg').open&&/Das ändert der Chef/.test($('#dlgForm .dlg-p').textContent)&&!$('#dlgForm button[type="submit"]')&&!$('#dlgDel')),'staff cannot change an entered Urlaub');await ev(()=>$('#dlg').close());
ok(await ev(()=>{tmTeamDlg();tmCopyPrev('2026-11-09');tmPatternsDlg();tmTplDlg();return !$('#dlg').open&&tmWeekCount('2026-11-09')>20}),'staff: team, copy, patterns and templates are refused in code as well');
// unbekannte Anmeldung: Name wählen
await ev(()=>{S.team.people.forEach(p=>{if(p.user==='u_staff')p.user=''});S.settings.currentUser='u_staff';save();render()});await w(200);await p.click('#app .tm-mine');await w(250);
ok((await dlg()||{}).t==='Wer sind Sie?'&&await ev(()=>document.querySelectorAll('#dlgForm [data-tmwho]').length===6),'„Mein Dienst“ without a known name asks „Wer sind Sie?“');
await p.click('#dlgForm [data-tmwho="tp_theresa"]');await w(300);ok(await ev(()=>tmMePerson().id==='tp_theresa'&&tmView().mine&&[...document.querySelectorAll('#app .tm-t tbody tr:not(.tm-grp) .tm-name')].map(x=>x.textContent).join()==='Theresa'),'choice is remembered for this sign-in and the filter is on');
await ev(()=>{S.settings.currentUser='u_chef';tmView().mine=false;save();render()});
// ---------- Heute ----------
await ev(()=>go('dash'));await w(300);
const dash=await ev(()=>({who:$('#app .tm-dash .tm-dash-who').innerText.replace(/\s+/g,' '),h:$('#app .tm-dash .dh-l').textContent,boxes:document.querySelectorAll('#app .tm-dash .panel,#app .tm-dash .note').length,after:!!$('#app .pl-dash')&&!!($('#app .pl-dash').compareDocumentPosition($('#app .tm-dash'))&4)}));
// fix-3: die Zeile selbst führt zum Plan und trennt „jetzt“ und „später“
ok(dash.who==='4 Heute im Dienst jetzt: Anna (Küche 08–16) · später: Lukas (Küche 15–23), Theresa (Service 15–23), Hannes (Bar 16–00)'&&dash.boxes===0&&dash.after,'Heute: „Heute im Dienst: Anna (Küche 08–16), …“ as one row in the day sheet, no boxes',dash.who);
await p.click('#app .tm-dash [data-act="tmGo"]');await w(250);ok(await ev(()=>view.tab==='dienst'&&tmView().w==='2026-11-09'),'the row leads to the plan');
// ---------- Schnellsuche, Hilfe, „So geht’s hier“ ----------
const pal=await ev(()=>{const a=palData();return ['Dienstplan','Checklisten','Dienstplan diese Woche','Checkliste Öffnen Küche','Team verwalten','Mein Dienst'].map(n=>{const x=a.find(y=>y.n===n);return !!x&&!!x.s})});ok(pal.every(Boolean),'command palette: both areas (with description), „Dienstplan diese Woche“, „Checkliste Öffnen Küche“, „Team verwalten“',pal);
await ev(()=>{go('menu');palData().find(x=>x.n==='Checkliste Öffnen Küche').run()});await w(300);ok(await ev(()=>view.tab==='checkl'&&$('#app h1').firstChild.textContent==='Öffnen Küche'),'palette entry opens the list directly');
await ev(()=>{palData().find(x=>x.n==='Team verwalten').run()});await w(300);ok((await dlg()||{}).t==='Team verwalten','palette: Team verwalten');await ev(()=>$('#dlg').close());
ok(await ev(()=>['Dienstplan','Teildienst','Ruhezeit','Vorlage','Checkliste','Messwert'].every(t=>Object.values(HELP).some(h=>h.g&&h.t===t))),'glossary has Dienstplan, Teildienst, Ruhezeit, Vorlage, Checkliste, Messwert');
const hp=await ev(()=>{go('dienst');helpApply();const c=[...new Set([...document.querySelectorAll('#app [data-help]')].map(e=>e.dataset.help))];return {c,bad:HELP_SEL.filter(x=>!HELP[x[1]]).map(x=>x[1]),len:Object.values(HELP).filter(h=>h.x.length<25||h.x.length>230).map(h=>h.k)}});
ok(['tm_woche','tm_zelle','tm_dienst','tm_abw','tm_hinweise','tm_mein','tm_kopieren','tm_wochenvorlage','tm_text','tm_pdf','tm_team','tm_stunden','tm_besetzung'].every(k=>hp.c.includes(k))&&!hp.bad.length&&!hp.len.length,'help texts on the new controls; every selector has a text of 25–230 characters',hp.c);
ok(await ev(()=>!!$('#app .page-h h1 .wozu-q')),'„So geht’s hier“ next to the title');
for(const id of ['dienst','checkl']){await ev(id=>{view.ck.run=null;view.ck.tab='heute';go(id)},id);await w(250);await p.click('#app .page-h h1 .wozu-q');await w(250);
  ok(await ev(id=>{const n=document.querySelector('#gdHow');return !!n&&guideCtx()===id&&n.querySelectorAll('li').length>=3&&n.querySelectorAll('li').length<=4&&!document.querySelector('#gd')},id),`„So geht’s hier“ on „${id}“: a static card with 3–4 lines`);await ev(()=>howHide());}
// ---------- Beispiel-Team entfernen, Demo wiederherstellen ----------
await ev(()=>{go('dienst');tmTeamDlg()});await w(250);await p.click('#dlgForm [data-tmdemo]');await w(600);
const rm=await ev(()=>({ppl:S.team.people.map(p=>p.name),demo:S.team.demo,sh:Object.values(S.team.shifts).flat().length,runs:Object.values(S.checks.runs).flatMap(r=>Object.values(r)).filter(r=>r.demo).length,pat:S.team.patterns.map(p=>p.name),sub:$('#app .page-h .sub').textContent}));
ok(rm.ppl.length===0&&rm.demo===false&&rm.sh===0&&rm.runs===0&&rm.pat.join()==='Mit Aushilfe'&&!/Beispiel/.test(rm.sub),'„Beispiele entfernen“: demo people, their shifts, demo patterns and demo checklist runs are gone; own pattern stays',rm);
await ev(()=>{if($('#dlg').open)$('#dlg').close();safetyStore=()=>true;S=seed();save();go('dienst')});await w(300);
ok(await ev(()=>S.team.demo===true&&S.team.people.length===6&&S.team.people.every(p=>p.demo)&&tmWeekCount('2026-11-09')>20),'„Beispieldaten wiederherstellen“ (seed) brings the example team back, flagged demo');
await ev(()=>{S.team.people=[];S.team.shifts={};S.team.demo=false;S.settings.currentUser='u_chef';save();render()});await w(200);
ok(await ev(()=>/Noch kein Team/.test($('#app .tm-none').textContent)&&$('#app .tm-none .btn.primary').textContent.trim()==='Team anlegen'),'empty state: „Noch kein Team“ with one button');
await L.done(b,errs);})();
