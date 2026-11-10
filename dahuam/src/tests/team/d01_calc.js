// Rechenkern Dienstplan gegen von Hand gerechnete Zahlen: Stunden, Pausenregel, Teildienst, über Mitternacht, Hinweise, Kopieren, Vorlagen, Text, Cloud-Zusammenführung, alte Daten
const L=require('./tlib');const ok=L.ok;const near=(a,b,t=1e-6)=>Math.abs(a-b)<=t;
(async()=>{const {b,p,errs}=await L.open({});const ev=(f,a)=>p.evaluate(f,a);
// ---------- künstliches Team: Woche ab Montag, 9.11.2026 ----------
await ev(()=>{const P=(id,name,area,target,color)=>({id,name,area,target,color,active:true,user:''});
  S.team.people=[P('a','Anna','kueche',40,0),P('b','Lukas','kueche',38.5,1),P('c','Maria','service',null,2),P('d','Josef','bar',20,3)];
  S.team.shifts={};S.team.abs={};S.team.patterns=[];S.team.demo=false;S.settings.closed=[3];
  window.W='2026-11-09';window.sh=(pid,D,parts,area,note)=>{const s={id:uid('ts'),pid,parts,area:area||tmPerson(pid).area,note:note||''};(S.team.shifts[D]=S.team.shifts[D]||[]).push(s);return s;};});
// ---------- Stunden ----------
const h=await ev(()=>{const st=S.team.settings;const H=parts=>tmShiftHours({parts});return {def:[st.breakAfter,st.breakMin,st.breakPaid],
  frueh:H([['08:00','16:00']]),teil:H([['10:00','14:00'],['17:30','22:00']]),nacht:H([['18:00','02:00']]),sechs:H([['09:00','15:00']]),sechs5:H([['09:00','15:05']]),nacht2:H([['22:00','06:00']]),
  paid:tmShiftHours({parts:[['08:00','16:00']]},{breakAfter:6,breakMin:30,breakPaid:true}),custom:tmShiftHours({parts:[['10:00','14:00'],['17:30','22:00']]},{breakAfter:4,breakMin:45,breakPaid:false}),
  span:tmSpan(['18:00','02:00']),span0:tmSpan(['16:00','00:00']),sum:tmSumTxt([['18:00','02:00']]),sumT:tmSumTxt([['10:00','14:00'],['17:30','22:00']])}});
ok(h.def.join()==='6,30,false','default break rule: unpaid 30 min for shifts longer than 6 h',h.def);
ok(h.frueh===7.5,'08:00–16:00 = 8 h − 0,5 h break = 7,5 h',h.frueh);
ok(h.teil===8.5,'split shift 10–14 + 17:30–22 = 4 + 4,5 = 8,5 h; no break deducted (no part longer than 6 h)',h.teil);
ok(h.nacht===7.5&&h.span.join()==='1080,1560'&&h.span0.join()==='960,1440','18:00–02:00 runs past midnight: 8 h − 0,5 = 7,5 h; 16:00–00:00 ends at 24:00',[h.nacht,h.span,h.span0]);
ok(h.sechs===6&&near(h.sechs5,6+5/60-0.5),'exactly 6 h: no break; 6 h 05: break deducted',[h.sechs,h.sechs5]);
ok(h.nacht2===7.5,'22:00–06:00 = 7,5 h',h.nacht2);
ok(h.paid===8,'paid break: 08:00–16:00 counts 8 h',h.paid);
ok(h.custom===7.75,'rule „45 min over 4 h“: 10–14 (4 h, none) + 17:30–22 (4,5 − 0,75) = 7,75 h',h.custom);
ok(/^7,5 Std\. · 8 Std\. minus 30 Min\. Pause · endet am nächsten Tag$/.test(h.sum)&&h.sumT==='8,5 Std.','dialog summary text explains the break and the next-day end',[h.sum,h.sumT]);
// Woche und Monat
const wk=await ev(()=>{sh('a','2026-11-09',[['08:00','16:00']]);sh('a','2026-11-10',[['10:00','14:00'],['17:30','22:00']]);sh('a','2026-11-13',[['18:00','02:00']]);sh('a','2026-11-15',[['09:00','15:00']]);
  sh('a','2026-11-16',[['08:00','16:00']]);sh('a','2026-11-30',[['08:00','16:00']]);sh('a','2026-12-01',[['08:00','16:00']]);S.team.abs['2026-11-20']={a:{t:'urlaub',note:''}};S.team.abs['2026-11-21']={a:{t:'krank',note:''}};
  const m=tmMonthStats('2026-11').find(r=>r.pid==='a');return {w:tmWeekHours('a',W),d:tmDayHours('a','2026-11-10'),m:[m.n,m.h,m.soll,m.diff,m.urlaub,m.krank],kw:tmKw(W),range:tmRangeTxt(W),range2:tmRangeTxt('2026-11-30'),mon:tmMonday('2026-11-15')}});
ok(wk.w===7.5+8.5+7.5+6&&wk.d===8.5,'week hours per person: 7,5 + 8,5 + 7,5 + 6 = 29,5',wk.w);
// November: 5 Dienste der KW 46 … (7,5+8,5+7,5+6) + 16.11. 7,5 + 30.11. 7,5 = 44,5; Soll 40 × 30/7 = 171,43
ok(wk.m[0]===6&&wk.m[1]===44.5&&near(wk.m[2],40*30/7)&&near(wk.m[3],44.5-40*30/7)&&wk.m[4]===1&&wk.m[5]===1,'month: 6 shifts, 44,5 h, target 40 × 30/7 = 171,43, Urlaub 1, Krank 1 (1 Dec not counted)',wk.m);
ok(wk.kw===46&&wk.range==='9.–15. November 2026'&&wk.range2==='30. November – 6. Dezember 2026'&&wk.mon==='2026-11-09','KW 46, date range texts, Monday of a Sunday',[wk.kw,wk.range,wk.range2]);
// ---------- Hinweise ----------
const hint=async(setup)=>ev(setup=>{S.team.shifts={};S.team.abs={};eval(setup);return tmHints(W).map(x=>[x.pid,x.D,x.k,Math.round(x.v*100)/100])},setup);
let r=await hint("sh('a','2026-11-09',[['15:00','23:00']]);sh('a','2026-11-10',[['08:00','16:00']]);sh('b','2026-11-09',[['15:00','23:00']]);sh('b','2026-11-10',[['10:00','18:00']])");
ok(JSON.stringify(r)==='[["a","2026-11-10","rest",9]]','rest: 23:00 → 08:00 next day = 9 h → hint; 23:00 → 10:00 = exactly 11 h → none',r);
r=await hint("sh('a','2026-11-12',[['18:00','02:00']]);sh('a','2026-11-13',[['12:00','20:00']]);sh('b','2026-11-12',[['18:00','02:00']]);sh('b','2026-11-13',[['13:00','20:00']])");
ok(JSON.stringify(r)==='[["a","2026-11-13","rest",10]]','rest across midnight: ends 02:00, next start 12:00 = 10 h → hint; 13:00 = 11 h → none',r);
r=await hint("sh('a','2026-11-08',[['16:00','23:30']]);sh('a','2026-11-09',[['07:00','12:00']])");
ok(JSON.stringify(r)==='[["a","2026-11-09","rest",7.5]]','rest is checked against the Sunday of the week before',r);
r=await hint("sh('a','2026-11-09',[['10:00','14:00'],['17:30','22:00']])");
ok(r.length===0,'the gap inside a split shift is not a rest-time hint',r);
r=await hint("sh('a','2026-11-13',[['08:00','19:00']]);sh('b','2026-11-13',[['08:00','18:30']]);sh('c','2026-11-13',[['07:00','13:00'],['15:00','20:30']])");
ok(JSON.stringify(r)==='[["a","2026-11-13","long",10.5],["c","2026-11-13","long",11.5]]','long day: 11 h − 0,5 = 10,5 → hint; 10,5 − 0,5 = 10,0 → none; split 6 + 5,5 = 11,5 → hint',r);
r=await hint("['2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-08','2026-11-09','2026-11-10'].forEach(D=>sh('a',D,[['12:00','17:00']]));['2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-08','2026-11-09'].forEach(D=>sh('b',D,[['12:00','17:00']]))");
ok(JSON.stringify(r)==='[["a","2026-11-09","row",7],["a","2026-11-10","row",8]]','7 days in a row (counted across the week border) → hint on day 7 and 8; 6 in a row → none',r);
r=await hint("['2026-11-09','2026-11-10','2026-11-12','2026-11-13','2026-11-14','2026-11-15'].forEach(D=>{sh('a',D,[['12:00','21:00']]);sh('b',D,D==='2026-11-15'?[['12:00','17:30']]:[['12:00','21:00']])})");
ok(JSON.stringify(r)==='[["a",null,"week",51]]','week: 6 × 8,5 = 51 h → hint; 5 × 8,5 + 5,5 = exactly 48 h → none',r);
ok(await ev(()=>{const t=tmHints(W)[0].txt;return /51 Std\. in dieser Woche \(über 48 Std\.\)/.test(t)}),'hint text is plain German');
ok(await ev(()=>JSON.stringify(TM_RULES)==='{"rest":11,"dayMax":10,"rowMax":6,"weekMax":48}'),'thresholds: 11 h rest, 10 h day, 6 days in a row, 48 h week');
// ---------- Besetzung ----------
const stf=await ev(()=>{S.team.shifts={};sh('a','2026-11-09',[['08:00','16:00']]);sh('b','2026-11-09',[['15:00','23:00']]);sh('c','2026-11-09',[['10:00','14:00'],['17:30','22:00']]);sh('a','2026-11-10',[['08:00','16:00']]);sh('d','2026-11-10',[['16:00','00:00']]);sh('c','2026-11-12',[['10:00','14:00']]);sh('a','2026-11-12',[['08:00','12:00']],'service');
  return {mo:tmStaff('2026-11-09'),gMo:tmGaps('2026-11-09',W),gDi:tmGaps('2026-11-10',W),gMi:tmGaps('2026-11-11',W),gDo:tmGaps('2026-11-12',W),gFr:tmGaps('2026-11-13',W),empty:tmGaps('2026-11-17','2026-11-16')}});
ok(stf.mo.kueche===2&&stf.mo.service===1&&stf.mo.bar===0&&stf.gMo.length===0,'staffing per area counts people',stf.mo);
ok(stf.gDi.join()==='Service'&&stf.gMi.length===0&&stf.gDo.join()==='Küche'&&stf.gFr.join()==='Küche,Service'&&stf.empty.length===0,'gaps: Küche/Service missing on an open day; never on the Ruhetag; not in a week without any shift',stf);
// ---------- Text für WhatsApp ----------
const txt=await ev(()=>{sh('d','2026-11-11',[['09:00','12:30']],'abwasch','Putztag');return tmWeekText(W)});
ok(txt.split('\n')[0]==='Dienstplan KW 46 (9.11.–15.11.)'&&txt.split('\n')[1]==='Mo 9.11.: Küche – Anna 08–16, Lukas 15–23 · Service – Maria 10–14 + 17:30–22','text line: „Mo 9.11.: Küche – Anna 08–16, Lukas 15–23 · Service – Maria 10–14 + 17:30–22“',txt.split('\n').slice(0,2));
ok(txt.split('\n')[2]==='Di 10.11.: Küche – Anna 08–16 · Bar – Josef 16–00'&&txt.split('\n')[3]==='Mi 11.11.: Abwasch – Josef 09–12:30 (Putztag)'&&txt.split('\n')[5]==='Fr 13.11.: niemand eingeteilt'&&txt.split('\n').length===8,'text: one line per day, note in brackets, shift on the Ruhetag shown, empty day named',txt.split('\n').slice(2));
ok(await ev(()=>{S.team.shifts={};return tmWeekText(W).split('\n')[3]==='Mi 11.11.: Ruhetag'}),'text: Ruhetag without shifts reads „Ruhetag“');
// ---------- Vorwoche kopieren, Vorlagen ----------
const cp=await ev(()=>{S.team.shifts={};S.team.abs={};sh('a','2026-11-02',[['08:00','16:00']],null,'x');sh('b','2026-11-02',[['15:00','23:00']]);sh('c','2026-11-04',[['10:00','14:00'],['17:30','22:00']]);sh('d','2026-11-08',[['18:00','02:00']]);
  S.team.abs['2026-11-11']={c:{t:'urlaub',note:''}};tmPerson('b').active=false;sh('a','2026-11-13',[['01:00','02:00']]);
  const res=tmSetWeek(W,tmWeekList('2026-11-02'));tmPerson('b').active=true;
  return {res,days:Object.keys(S.team.shifts).filter(D=>D>=W).sort(),mo:S.team.shifts['2026-11-09'].map(s=>[s.pid,s.parts.join('|'),s.note]),so:S.team.shifts['2026-11-15'][0].parts[0],ids:S.team.shifts['2026-11-09'][0].id!==S.team.shifts['2026-11-02'][0].id,src:tmWeekCount('2026-11-02'),abs:!!S.team.abs['2026-11-11'].c}});
ok(cp.res.add===2&&cp.res.skip===2&&cp.days.join()==='2026-11-09,2026-11-15'&&cp.mo.length===1&&cp.mo[0].join()==='a,08:00,16:00,x'&&cp.so.join()==='18:00,02:00','copy previous week: same weekdays, old shifts of the week replaced, absent and inactive people skipped (2 copied, 2 skipped)',cp);
ok(cp.ids&&cp.src===4&&cp.abs,'copies get new ids; the source week and absences stay untouched');
const pat=await ev(()=>{S.team.shifts={};S.team.abs={};sh('a','2026-11-09',[['08:00','16:00']]);sh('c','2026-11-10',[['10:00','14:00'],['17:30','22:00']],'bar','Fest');sh('d','2026-11-15',[['16:00','00:00']]);
  const pt=tmPatternSave(W,'  Hochsaison  ');sh('a','2026-11-23',[['05:00','06:00']]);const res=tmPatternApply('2026-11-23',pt.id);const w2=tmWeekList('2026-11-23').map(([i,s])=>[i,s.pid,s.parts.map(x=>x.join('–')).join('+'),s.area,s.note]);
  pt.days[0][0].parts[0][0]='07:00';return {name:pt.name,res,w2,indep:S.team.shifts['2026-11-09'][0].parts[0][0],n:S.team.patterns.length}});
ok(pat.name==='Hochsaison'&&pat.res.add===3&&JSON.stringify(pat.w2)==='[[0,"a","08:00–16:00","kueche",""],[1,"c","10:00–14:00+17:30–22:00","bar","Fest"],[6,"d","16:00–00:00","bar",""]]'&&pat.indep==='08:00','pattern: save a week under a name, apply to another week (replaces it), pattern is an independent copy',pat);
// ---------- Cloud: Zusammenführen je Datum und Eintrag ----------
const mg=await ev(()=>{const base=JSON.parse(JSON.stringify(S));base.team.shifts={'2026-11-09':[{id:'s1',pid:'a',parts:[['08:00','16:00']],area:'kueche',note:''}],'2026-11-10':[{id:'s2',pid:'b',parts:[['15:00','23:00']],area:'kueche',note:''}]};base.team.abs={};base.checks.runs={'2026-11-09':{ck_open_k:{items:{ck_open_k_1:{b:'Anna',a:'07:50'}},n:12}}};
  const loc=JSON.parse(JSON.stringify(base)),rem=JSON.parse(JSON.stringify(base));
  loc.team.shifts['2026-11-11']=[{id:'s3',pid:'a',parts:[['08:00','12:00']],area:'kueche',note:''}];loc.team.shifts['2026-11-09'][0].note='lokal';delete loc.team.shifts['2026-11-10'];loc.checks.runs['2026-11-09'].ck_open_k.items.ck_open_k_2={b:'Anna',a:'07:52',v:3.5};loc.team.abs['2026-11-12']={a:{t:'urlaub',note:''}};
  rem.team.shifts['2026-11-12']=[{id:'s4',pid:'c',parts:[['10:00','14:00']],area:'service',note:''}];rem.team.shifts['2026-11-09'].push({id:'s5',pid:'b',parts:[['15:00','23:00']],area:'kueche',note:''});rem.team.shifts['2026-11-09'][0].parts=[['09:00','17:00']];rem.checks.runs['2026-11-09'].ck_open_k.items.ck_open_k_3={b:'Lukas',a:'07:55',v:-19};rem.checks.runs['2026-11-10']={ck_close_k:{items:{ck_close_k_1:{b:'Lukas',a:'22:10'}},n:12}};rem.team.people[0].target=35;loc.team.people[1].name='Luki';
  const [m]=merge3(base,loc,rem);const mo=m.team.shifts['2026-11-09'];
  return {days:Object.keys(m.team.shifts).sort(),mo:mo.map(s=>[s.id,s.note,s.parts[0].join('–')]),items:Object.keys(m.checks.runs['2026-11-09'].ck_open_k.items).sort(),r10:!!m.checks.runs['2026-11-10'],abs:!!m.team.abs['2026-11-12'],ppl:[m.team.people[0].target,m.team.people[1].name,m.team.people.length],tpl:m.checks.templates.length,other:m.products.length===base.products.length}});
ok(mg.days.join()==='2026-11-09,2026-11-11,2026-11-12','cloud merge: a day added locally, a day added in the cloud, a day deleted locally → all three respected',mg.days);
ok(JSON.stringify(mg.mo)==='[["s1","lokal","09:00–17:00"],["s5","","15:00–23:00"]]','cloud merge inside one day: same shift changed on both sides (note here, time there) merged by field; new shift from the cloud kept',mg.mo);
ok(mg.items.join()==='ck_open_k_1,ck_open_k_2,ck_open_k_3'&&mg.r10&&mg.abs,'cloud merge: two people ticking the same checklist on two devices → all ticks kept',mg.items);
ok(mg.ppl.join()==='35,Luki,4'&&mg.tpl===5&&mg.other,'cloud merge: people merged by id; templates and the rest of the data intact',mg.ppl);
// ---------- alte und kaputte Daten ----------
const mig=await ev(()=>{const old=JSON.parse(JSON.stringify(S));delete old.team;delete old.checks;old.demo=false;const a=migrate(old);
  const old2=JSON.parse(JSON.stringify(S));delete old2.team;delete old2.checks;old2.demo=true;const d=migrate(old2);
  const bad=JSON.parse(JSON.stringify(S));bad.team={people:[{id:'x',name:'X',area:'nix',color:99},null,{name:'ohne id'}],shifts:{'2026-11-09':[{id:'s',pid:'x',parts:[['08:00','16:00'],['25:00','26:00']]},{pid:'x',parts:[['08:00','12:00']]},{id:'t',pid:'x',parts:'kaputt'}],'kein-datum':[],'2020-01-01':[{id:'alt',pid:'x',parts:[['08:00','16:00']]}]},abs:{'2026-11-10':{x:{t:'unsinn'},y:{t:'krank'}}},templates:'x',patterns:[{days:[1]}],settings:{breakAfter:'abc'}};
  bad.checks={templates:[{id:'l',name:'L',when:'weekly',wd:9,items:[{id:'i',t:'ok'},{id:'j',t:''},null]}],runs:{'2026-11-09':{l:{items:{i:{b:'A',a:'08:00'}}},m:'kaputt'},'2024-01-01':{l:{items:{}}},'x':{}}};
  const c=migrate(bad);
  return {a:[a.team.people.length,a.team.templates.map(t=>t.name).join(),a.checks.templates.map(t=>t.name).join('|'),Object.keys(a.checks.runs).length,a.checks.templates.every(t=>t.sug&&t.since===todayStr()),a.checks.templates[4].wd],
    d:[d.team.people.length,d.team.demo,d.team.people.every(p=>p.demo),Object.values(d.team.shifts).flat().every(s=>s.demo),Object.keys(d.checks.runs).length>8],
    c:[c.team.people.length,c.team.people[0].area,c.team.people[0].color,Object.keys(c.team.shifts).join(),c.team.shifts['2026-11-09'].length,!!c.team.shifts['2026-11-09'][0].id,JSON.stringify(c.team.abs),c.team.templates.length,c.team.patterns.length,c.team.settings.breakAfter,c.checks.templates[0].wd,c.checks.templates[0].items.length,Object.keys(c.checks.runs).join(),Object.keys(c.checks.runs['2026-11-09']).join()]}});
ok(mig.a[0]===0&&mig.a[1]==='Früh,Spät,Teildienst'&&mig.a[2]==='Öffnen Küche|Schließen Küche|Öffnen Bar/Service|Schließen Bar/Service|Wochenputz'&&mig.a[3]===0&&mig.a[4]&&mig.a[5]===3,'old saved state without team: loads with empty team, 3 shift templates, 5 suggested lists (Wochenputz on the Ruhetag), no runs',mig.a);
ok(mig.d[0]===6&&mig.d[1]===true&&mig.d[2]&&mig.d[3]&&mig.d[4],'old demo state: gets the example team, everything flagged demo',mig.d);
ok(mig.c[0]===1&&mig.c[1]==='kueche'&&mig.c[2]===3&&mig.c[3]==='2026-11-09'&&mig.c[4]===1&&mig.c[6]==='{"2026-11-10":{"y":{"t":"krank"}}}'&&mig.c[7]===3&&mig.c[8]===0&&mig.c[9]===6&&mig.c[10]===1&&mig.c[11]===1&&mig.c[12]==='2026-11-09'&&mig.c[13]==='l','broken state is repaired: bad people, shifts, dates, absences, templates dropped; runs older than 400 days and shifts older than 800 days pruned',mig.c);
const pr=await ev(()=>{const d=JSON.parse(JSON.stringify(S));const t=todayStr();d.checks.runs={};[399,400,401,600].forEach(k=>{d.checks.runs[dAdd(t,-k)]={ck_open_k:{items:{ck_open_k_1:{b:'A',a:'08:00'}},n:12}}});migrate(d);return Object.keys(d.checks.runs).map(D=>dDiff(D,t)).sort((a,b)=>a-b)});
ok(pr.join()==='399,400','runs are kept for 400 days, older ones pruned',pr);
await L.done(b,errs);})();
