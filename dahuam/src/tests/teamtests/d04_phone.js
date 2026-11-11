// Handy 390 × 844: keine Seitenbreite über 390, Tippflächen ≥ 40 px, Tagesansicht mit Wischen, Wochenübersicht, laufende Liste, Dialoge
const L=require('./tlib');const ok=L.ok;
(async()=>{const {b,p,errs}=await L.open({vp:{width:390,height:844},touch:true,mobile:true});const ev=(f,a)=>p.evaluate(f,a);const w=ms=>p.waitForTimeout(ms);
const sw=()=>ev(()=>document.documentElement.scrollWidth);
// alles Antippbare im Bereich: mindestens 40 × 40 px
const small=root=>ev(root=>{const out=[];const R=document.querySelector(root);if(!R)return ['kein '+root];
  R.querySelectorAll('button,select,input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]),textarea,label.tm-pact,label.ck-ev,.tm-radio label,label.tog').forEach(e=>{if(!e.getClientRects().length||e.closest('.adv')||e.closest('.wozu-q')||e.classList.contains('wozu-q')||e.id==='dlgX')return;const r=e.getBoundingClientRect();if(r.width<1||r.height<1)return;
    if(r.height<39.5||r.width<39.5)out.push((e.className||e.name||e.dataset.act||e.tagName)+' '+Math.round(r.width)+'×'+Math.round(r.height));});return out},root);
const dlgFit=()=>ev(()=>{const d=$('#dlg');const r=d.getBoundingClientRect();return d.open&&r.left>=0&&r.right<=390.5&&d.scrollWidth<=d.clientWidth+1&&$('#dlgForm').scrollWidth<=$('#dlgForm').clientWidth+1&&[...d.querySelectorAll('input,select,button,textarea')].every(e=>{const x=e.getBoundingClientRect();return !x.width||(x.left>=r.left-0.5&&x.right<=r.right+0.5)})});
const check=async(name,root='#app')=>{const s=await sw();const sm=await small(root);ok(s===390,`${name}: page scrollWidth === 390`,s);ok(sm.length===0,`${name}: touch targets ≥ 40 px`,sm.slice(0,6));};
const checkDlg=async name=>{const s=await sw();const fit=await dlgFit();const sm=await small('#dlgForm');ok(s===390&&fit,`${name}: dialog fits 390, nothing sticks out`,[s,fit]);ok(sm.length===0,`${name}: touch targets ≥ 40 px`,sm.slice(0,6));};
const swipe=(dx)=>ev(dx=>{const el=document.querySelector('#app .tm-dl');const T=(x)=>new Touch({identifier:1,target:el,clientX:x,clientY:420});el.dispatchEvent(new TouchEvent('touchstart',{touches:[T(200)],changedTouches:[T(200)],bubbles:true}));el.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[T(200+dx)],bubbles:true}))},dx);
// ---------- unter „Mehr“ › Team & Zahlen ----------
await p.tap('.bottom .nav-i[data-act="mehr"]');await w(300);
ok(await ev(()=>!!$('#mehr .sheet-i[data-tab="team"]')&&!document.querySelector('.bottom .nav-i[data-tab="team"]')&&!!document.querySelector('.bottom .nav-i[data-tab="checkl"]')),'phone: Checklisten in the bottom bar, „Team & Zahlen“ (Dienstplan) under „Mehr“');
await p.tap('#mehr .sheet-i[data-tab="team"]');await w(300);ok(await ev(()=>view.tab==='dienst'&&document.querySelector('.bottom .nav-i.on').dataset.act==='mehr'),'tap opens the plan; the bottom bar marks „Mehr“');
// ---------- Tagesansicht ----------
const dv=await ev(()=>({day:tmView().day,strip:[...document.querySelectorAll('#app .tm-days button')].map(x=>x.innerText.replace(/\s+/g,' ')),on:$('#app .tm-days button.on').innerText.replace(/\s+/g,' '),h:$('#app .tm-dh').firstChild.textContent,rows:[...document.querySelectorAll('#app .tm-dr')].map(r=>r.querySelector('.tm-pn b').textContent+': '+r.querySelector('.tm-dc').innerText.replace(/\s+/g,' ')),plus:document.querySelectorAll('#app .tm-dr .tm-plus').length,table:!!$('#app .tm-t'),staff:$('#app .tm-dstaff').innerText.replace(/\s+/g,' '),acts:[...document.querySelectorAll('#app .tm-acts .btn')].map(x=>x.textContent.trim()),top:$('#app .tm-dl').getBoundingClientRect().top}));
ok(dv.day==='2026-11-12'&&dv.strip.length===7&&dv.on==='Do 12.'&&dv.h==='Donnerstag, 12. November'&&!dv.table,'phone: one day per screen, opens on today, seven day buttons, no wide table',dv.strip);
ok(dv.rows.join(' | ')==='Anna: 08:00–16:00 | Lukas: 15:00–23:00 | Florian: frei | Magdalena: frei | Theresa: 15:00–23:00 | Hannes: 16:00–00:00'&&dv.plus===6&&dv.staff==='Küche 2 Service 1 Bar 1','every person with the shift of the day and a „+“; staffing below',dv.rows);
ok(dv.top<480&&dv.acts.join()==='Text kopieren,Als PDF speichern'&&await ev(()=>[...document.querySelectorAll('#app details.more .btn')].map(x=>x.textContent.trim()).join()==='Team verwalten,Vorwoche kopieren,Wochenvorlagen,Stunden im Monat'),'the list starts in the upper half; PDF and text sit below the plan, team and copy tools under „Mehr Optionen“',[dv.top,dv.acts]);
await check('Dienstplan day view');
await swipe(-120);await w(250);ok(await ev(()=>tmView().day==='2026-11-13'&&$('#app .tm-days button.on').innerText.replace(/\s+/g,' ')==='Fr 13.'),'swipe left → next day');
await swipe(120);await swipe(120);await w(250);ok(await ev(()=>tmView().day==='2026-11-11'&&/Ruhetag/.test($('#app .tm-dh').textContent)&&/Ruhetag, niemand eingeteilt/.test($('#app .tm-dstaff').textContent)),'swipe right twice → Wednesday, shown as Ruhetag');
await swipe(30);await w(150);ok(await ev(()=>tmView().day==='2026-11-11'),'a small movement is not a swipe');
for(let i=0;i<3;i++)await swipe(-120);await w(100);await swipe(-120);await swipe(-120);await w(250);ok(await ev(()=>tmView().day==='2026-11-16'&&tmView().w==='2026-11-16'&&/KW 47/.test($('#app .tm-kw').textContent)),'swiping past Sunday moves on to the next week');
await p.tap('#app [data-act="tmPrev"]');await w(200);await p.tap('#app .tm-days button[data-id="2026-11-15"]');await w(200);
ok(await ev(()=>tmView().day==='2026-11-15'&&document.querySelectorAll('#app .tm-dhints li').length===1&&/Hannes nur 9 Std\. Ruhe/.test($('#app .tm-dhints').innerText.replace(/\s+/g,' '))&&/Hinweis, keine Rechtsprüfung/.test($('#app .tm-dayview').textContent)&&!!$('#app .tm-dr .tm-sh.hint .tm-mk')),'day view shows the hint of the day with its label');
await check('Dienstplan day view with hint');
// Dienst eintragen am Handy
await p.tap('#app .tm-dr:nth-child(4) .tm-plus');await w(300);ok(await ev(()=>$('#dlg').open&&$('#dlgForm h3').textContent==='Florian · So 15.11.'&&!!$('#dlgForm .tm-abn')),'„+“ opens the shift dialog for that person and day');
await checkDlg('shift dialog');
await p.tap('#dlgForm .tm-tb[data-tmtpl="tt_teil"]');await w(150);await checkDlg('shift dialog with second part');
await p.tap('#dlgForm button[type="submit"]');await w(200);await checkDlg('shift dialog asking for confirmation');
await p.tap('#dlgForm button[type="submit"]');await w(300);ok(await ev(()=>tmShiftsOf('tp_florian','2026-11-15').length===1&&/10:00–14:00\s*17:30–22:00/.test($('#app .tm-dr:nth-child(4) .tm-sh').innerText)),'shift added from the phone in three taps (plus the confirmation for the absence)');
await check('Dienstplan day view with split shift and absence');
await p.tap('#app .tm-dr:nth-child(4) .tm-ab');await w(250);await checkDlg('absence dialog');await ev(()=>$('#dlg').close());
await p.tap('#app .tm-dr:nth-child(4) .tm-sh');await w(250);ok(await ev(()=>$('#dlgForm button[type="submit"]').textContent==='Speichern'&&!!$('#dlgDel')),'tap on a shift → edit');await checkDlg('edit dialog');await ev(()=>$('#dlg').close());
// ---------- Wochenübersicht ----------
await p.tap('#app [data-act="tmMode"][data-id="week"]');await w(250);
const mini=await ev(()=>({w:$('#app .tm-mini').getBoundingClientRect().width,cols:document.querySelectorAll('#app .tm-mini thead th').length,cells:document.querySelectorAll('#app .tm-mini tbody td').length,anna:[...document.querySelectorAll('#app .tm-mini tbody tr:not(.tm-grp)')][0].innerText.replace(/\s+/g,' '),split:document.querySelectorAll('#app .tm-mini .tm-mc.split').length,ab:[...document.querySelectorAll('#app .tm-mini .tm-ma')].map(x=>x.textContent).join(),hints:!!$('#tmHints'),mk:document.querySelectorAll('#app .tm-mini .tm-mk').length}));
ok(mini.w<=358.5&&mini.cols===8&&mini.cells===42&&/^Anna 37,5 Std\. 08 16 08 16 08 16 08 16 08 16$/.test(mini.anna)&&mini.split>=6&&mini.hints&&mini.mk>=1,'compact week overview: all seven days fit without sideways scrolling, start and end per cell',mini);
await check('Dienstplan week overview');
await p.tap('#app .tm-mini tbody tr:nth-child(3) td:nth-child(2) .tm-mb');await w(250);ok(await ev(()=>tmView().pm==='day'&&tmView().day==='2026-11-09'&&!!$('#app .tm-dl')),'tap a cell in the overview → that day opens');
await ev(()=>{view.more=Object.assign({},view.more,{dienst:true});render()});await p.tap('#app [data-act="tmMode"][data-id="month"]');await w(250);ok(await ev(()=>document.querySelectorAll('#app .tm-month tbody tr').length===6),'month summary on the phone');await check('Dienstplan month');
await p.tap('#app [data-act="tmMode"][data-id="week"]');await w(200);await p.tap('#app .tm-modes [data-act="tmMode"][data-id="day"]');await w(200);
// ---------- übrige Dialoge ----------
await p.tap('#app [data-act="tmTeam"]');await w(300);await checkDlg('team dialog');await p.tap('#dlgForm [data-tmpadd]');await w(150);await checkDlg('team dialog with a new row');await ev(()=>$('#dlg').close());
await p.tap('#app [data-act="tmPatterns"]');await w(300);await checkDlg('pattern dialog');await ev(()=>$('#dlg').close());
await ev(()=>tmTplDlg());await w(300);await checkDlg('template dialog');await ev(()=>$('#dlg').close());
await ev(()=>{S.team.people.forEach(p=>{if(p.user==='u_chef')p.user='';if(p.name==='Anna')p.name='Annemarie-Katharina'});render()});await p.tap('#app .tm-mine');await w(300);await checkDlg('„Wer sind Sie?“ dialog');await ev(()=>$('#dlg').close());
await check('Dienstplan day view with a long name');
await ev(()=>{navigator.clipboard.writeText=()=>Promise.reject(new Error('x'))});await p.tap('#app [data-act="tmText"]');await w(300);ok(await ev(()=>$('#dlg').open&&!!$('#tmTxt')),'text fallback dialog');await checkDlg('text dialog');await ev(()=>$('#dlg').close());
await ev(()=>{const p=S.team.people.find(x=>x.name==='Annemarie-Katharina');p.name='Anna';p.user='u_chef';tmView().w='2026-11-09';tmView().day='2026-11-12';render()});
// Team am Handy
await ev(()=>{S.settings.currentUser='u_staff';save();render()});await w(200);
ok(await ev(()=>document.querySelectorAll('#app .tm-dr .tm-plus').length===1&&$('#app .tm-dr .tm-plus').dataset.id.startsWith('tp_florian')&&[...document.querySelectorAll('#app .tm-acts .btn')].map(x=>x.textContent.trim()).join()==='Text kopieren,Als PDF speichern'),'team on the phone: read-only, „+“ only in the own row');
await p.tap('#app .tm-dr .tm-plus');await w(250);ok(await ev(()=>/^Frei-Wunsch/.test($('#dlgForm h3').textContent)),'… which opens the Frei-Wunsch');await checkDlg('Frei-Wunsch dialog');await ev(()=>$('#dlg').close());await check('Dienstplan staff view');
await ev(()=>{S.settings.currentUser='u_chef';save()});
// ---------- Checklisten ----------
await ev(()=>{view.ck.tab='heute';view.ck.run=null;go('checkl')});await w(300);await check('Checklisten overview');
await p.tap('#app .ck-l[data-id="ck_open_k"]');await w(300);
const run=await ev(()=>({rowH:Math.min(...[...document.querySelectorAll('#app .ck-c,#app .ck-vl')].map(x=>x.getBoundingClientRect().height)),font:parseFloat(getComputedStyle($('#app .ck-c')).fontSize),inH:$('#app .ck-v').getBoundingClientRect().height,boxW:$('#app .ck-box').getBoundingClientRect().width}));
ok(run.rowH>=60&&run.font>=17&&run.inH>=48&&run.boxW>=30,'running list on the phone: rows ≥ 60 px, text ≥ 17 px, value field ≥ 48 px',run);
await check('running checklist');
for(const i of [1,4,5,6])await p.tap(`#app .ck-items > li:nth-child(${i}) .ck-c`);await w(200);
await ev(()=>window.scrollTo(0,700));await w(300);
const stick=await ev(()=>{const r=$('#ckSticky').getBoundingClientRect();const tb=document.querySelector('.topbar').getBoundingClientRect();const el=document.elementFromPoint(100,r.top+r.height/2);return {top:Math.round(r.top),tb:Math.round(tb.bottom),vis:!!el&&!!el.closest('#ckSticky'),txt:$('#ckProg').textContent,full:r.left<=0.5&&r.right>=389.5}});
ok(stick.vis&&Math.abs(stick.top-stick.tb)<=3&&stick.txt==='4 von 12'&&stick.full,'progress stays stuck under the top bar while scrolling („4 von 12“)',stick);
await ev(()=>window.scrollTo(0,0));
await p.tap('#ckv-ck_open_k_2');await p.fill('#ckv-ck_open_k_2','8,5');await p.press('#ckv-ck_open_k_2','Enter');await w(300);ok(await ev(()=>$('#dlg').open&&$('#dlgForm h3').textContent==='Wert außerhalb des Bereichs'),'value out of range on the phone → note dialog');await checkDlg('out-of-range dialog');
await p.fill('#dlgForm [name="note"]','Kühlung nachgestellt');await p.tap('#dlgForm button[type="submit"]');await w(350);ok(await ev(()=>ckRun('2026-11-12','ck_open_k').items.ck_open_k_2.out===1&&$('#app .ck-i.val').classList.contains('out')),'saved with the note');
await check('running checklist with a value out of range');
ok(await ev(()=>$('#ckv-ck_open_k_2').inputMode==='decimal'&&$('#ckv-ck_open_k_3').inputMode==='text'),'number pad for values; where a minus can be needed (Tiefkühler) the full keyboard, so the minus is reachable');
await ev(()=>{view.ck.run=null;view.ck.tab='verlauf';view.ck.hist=null;render()});await w(250);await check('history');
await p.tap('#app .ck-hb[data-id="2026-11-08"]');await w(250);ok(await ev(()=>!!$('#app .ck-hr.open .ck-hdw svg.ck-spark')),'history detail opens on the phone');await check('history with a day open');
await ev(()=>{view.ck.tab='vorlagen';render()});await w(200);await check('checklist templates');
await p.tap('#app [data-act="ckTplEdit"][data-id="ck_open_k"]');await w(300);await checkDlg('edit list dialog');await ev(()=>$('#dlg').close());
// ---------- Heute ----------
await ev(()=>go('dash'));await w(300);ok(await ev(()=>!!$('#app .tm-dash')&&document.querySelectorAll('#app .tm-dash .rw').length===6&&document.querySelectorAll('#app .tm-dash .rw.ek-dash').length===1),'Heute on the phone has the team rows (seit Paket D2 dazu eine Zeile Eigenkontrolle, wenn etwas ansteht)');
ok(await sw()===390,'Heute: page scrollWidth === 390',await sw());const sm=await small('#app .tm-dash');ok(sm.length===0,'Heute team rows: touch targets ≥ 40 px',sm);
// ---------- eine Darstellung am Handy ----------
await ev(()=>go('dienst'));await w(300);ok(await ev(()=>[...document.querySelectorAll('#app .tm-modes button')].map(x=>x.textContent).join()==='Tag,Woche'&&typeof setMode==='undefined'&&!!$('#app .tm-dl')),'phone: Tag and Woche as the two views; the month is under „Mehr Optionen“');await check('Dienstplan');
await ev(()=>{view.ck.tab='heute';go('checkl')});await w(200);await p.tap('#app .ck-l');await w(250);await check('running checklist');

// ---------- dunkel ----------
await ev(()=>{setTheme('dark');go('dienst')});await w(250);
const dk=await ev(()=>{const lum=c=>{const m=c.match(/[\d.]+/g).map(Number);const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2])};const sh=$('#app .tm-sh');const cv=document.createElement('canvas');cv.width=cv.height=1;const g=cv.getContext('2d');g.fillStyle=getComputedStyle(sh).backgroundColor;g.fillRect(0,0,1,1);const d=g.getImageData(0,0,1,1).data;const bg=`rgb(${d[0]},${d[1]},${d[2]})`;const fg=getComputedStyle(sh.querySelector('b')).color;const a=lum(fg),b2=lum(bg);return {ratio:(Math.max(a,b2)+.05)/(Math.min(a,b2)+.05),bg}});
ok(dk.ratio>=7,'dark theme: shift text on its tinted background has contrast ≥ 7:1',dk);
await L.done(b,errs);})();
