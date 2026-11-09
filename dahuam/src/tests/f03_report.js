// Findings 3, 16, 9 (Kasse import confirm + grammar), 6 (labels), 26, 29
const L=require('./lib');const ok=L.ok;
(async()=>{const {b,p,errs}=await L.open({});const ev=(f,a)=>p.evaluate(f,a);
const toastT=()=>ev(()=>$('#toast').textContent); const dlgText=()=>ev(()=>$('#dlg').open?$('#dlg').innerText.replace(/\s+/g,' '):'');
// ---- 3: pure function checks with a fixed "today"
const c=await ev(()=>{const out={};const mk=(unit,ref,cmp)=>{const rp={...view.rp,unit,ref,cmp};const r=rpRange(rp);return {r:[r.from,r.to],c:cmpRange(rp,r,'2026-03-10')}};
 out.yY=mk('year','2026-03-10','year');out.yP=mk('year','2026-03-10','prev');out.mY=mk('month','2026-03-10','year');out.mP=mk('month','2026-03-10','prev');out.qP=mk('quarter','2026-03-10','prev');
 out.done=mk('month','2026-02-10','prev');out.doneY=mk('month','2026-02-10','year');out.wY=mk('week','2026-03-10','year');return out;});
ok(c.yY.c.from==='2025-01-01'&&c.yY.c.to==='2025-03-10'&&c.yY.c.same===69,'running year vs Vorjahr: 01.01.–10.03.2025 (69 days)',c.yY.c);
ok(c.yP.c.from==='2025-01-01'&&c.yP.c.to==='2025-03-10','running year vs Vorperiode: same span',c.yP.c);
ok(c.mY.c.from==='2025-03-01'&&c.mY.c.to==='2025-03-10'&&c.mY.c.same===10,'running month vs Vorjahr: 10 days',c.mY.c);
ok(c.mP.c.from==='2026-02-01'&&c.mP.c.to==='2026-02-10','running month vs Vorperiode: 01.–10.02. (starts on the 1st)',c.mP.c);
ok(c.qP.c.from==='2025-10-01'&&c.qP.c.to==='2025-12-08','running quarter vs Vorperiode: 69 days from quarter start',c.qP.c);
ok(c.done.c.from==='2026-01-01'&&c.done.c.to==='2026-01-31'&&!c.done.c.same,'finished month vs Vorperiode: full previous month',c.done.c);
ok(c.doneY.c.from==='2025-02-01'&&c.doneY.c.to==='2025-02-28'&&!c.doneY.c.same,'finished month vs Vorjahr: full month',c.doneY.c);
ok(c.wY.c.from==='2025-03-10'&&c.wY.c.to==='2025-03-11'&&c.wY.c.same===2,'running week vs Vorjahr: same weekdays elapsed',c.wY.c);
// ---- 16 default period + label in UI
await ev(()=>go('report'));await p.waitForTimeout(300);
const st=await ev(()=>({ref:view.rp.ref,today:isoDate(new Date()),label:document.querySelector('.rp-label').innerText,empty:!!document.querySelector('#app .panel.empty'),tiles:document.querySelectorAll('#app .tiles .tile').length}));
ok(!st.empty&&st.tiles>=4,'Auswertung opens on a period with data',st.label);
ok(await ev(()=>{const r=rpRange({...view.rp,ref:isoDate(new Date())});return Object.keys(S.salesDays).some(d=>d>=r.from&&d<=r.to)}) || /letzter Zeitraum mit Verkäufen/.test(st.label),'…and says so when it is not the current one',st.label);
await p.click('[data-act=rpToday]');await p.waitForTimeout(200);ok(await ev(()=>view.rp.ref===isoDate(new Date())),'„Aktuell“ still jumps to today');
// running year in UI: label "gleicher Zeitraum"
await p.click('[data-act=rpUnit][data-id=year]');await p.waitForTimeout(300);
const note=await ev(()=>document.querySelector('.rp-cmpnote')?.textContent||'');
ok(/gleicher Zeitraum/.test(note),'running year: comparison labelled „gleicher Zeitraum“',note);
const span=await ev(()=>{const r=rpRange(view.rp),t=isoDate(new Date()),c=cmpRange(view.rp,r);return [dDiff(r.from,t),dDiff(c.from,c.to)]});ok(span[0]===span[1],'same number of elapsed days',span);
await p.click('[data-act=rpCmp][data-id=prev]');await p.waitForTimeout(300);ok(/gleicher Zeitraum/.test(await ev(()=>document.querySelector('.rp-cmpnote')?.textContent||'')),'Vorperiode also labelled');
// 6 labels
ok(await ev(()=>[...document.querySelectorAll('.rp-items tbody b')].some(x=>/Wiener Schnitzel · vom Kalb/.test(x.textContent))),'item table shows variant');
ok(await ev(()=>/Wiener Schnitzel · vom/.test(document.querySelector('.rp-quads')?.textContent||'') ),'Menü-Matrix lists show variant');
ok(await ev(()=>[...document.querySelectorAll('.rp-top li span')].some(x=>/Wiener Schnitzel · vom/.test(x.textContent))),'Renner/Penner lists show variant');
ok(await ev(()=>[...document.querySelectorAll('.rp-matrix g.pt text')].every(t=>{const bb=t.getBBox();return bb.x>=0&&bb.x+bb.width<=522})),'Menü-Matrix labels inside the chart');
// 26 sort cycle
const head=()=>ev(()=>[...document.querySelectorAll('.rp-items thead button')].find(b=>/Menge/.test(b.textContent)&&!/Δ/.test(b.textContent)).textContent);
const cl=async()=>{await ev(()=>[...document.querySelectorAll('.rp-items thead button')].find(b=>/^Menge/.test(b.textContent)).click());await p.waitForTimeout(120);return head();};
const h1=await cl(),h2=await cl(),h3=await cl();ok(/↓/.test(h1)&&/↑/.test(h2)&&!/[↓↑]/.test(h3),'report sort cycles ↓ → ↑ → off',[h1,h2,h3]);
await ev(()=>go('menu'));await p.waitForTimeout(200);
const mh=()=>ev(()=>document.querySelector('[data-id="menu:price"]').textContent);const mc=async()=>{await p.click('[data-id="menu:price"]');await p.waitForTimeout(120);return mh();};
const m1=await mc(),m2=await mc(),m3=await mc();ok(/↓/.test(m1)&&/↑/.test(m2)&&!/[↓↑]/.test(m3),'menu sort cycles ↓ → ↑ → off',[m1,m2,m3]);
// ---- 9/16 Kasse import
await ev(()=>{view.rp.tab='import';go('report')});await p.waitForTimeout(250);
ok(await p.locator('.page-h [data-act=rpTab][data-id=import]').count()===0,'no redundant primary „Kasse importieren“ on its own tab');
const days0=await ev(()=>Object.keys(S.salesDays).length);
await p.click('[data-act=rpSample]');await p.waitForTimeout(150);if(await p.locator('[data-act=rpImport]').count()===0){await p.click('[data-act=rpAnalyse]');await p.waitForTimeout(200);}
await p.click('[data-act=rpImport]');await p.waitForTimeout(250);
const dt=await dlgText();ok(/Demo-Verkäufen/.test(dt)&&new RegExp(days0+' Tage').test(dt)&&/1 Verkaufstag\b/.test(dt),'import asks first and says how many demo days are affected',dt.slice(0,260));
ok(await ev(()=>Object.keys(S.salesDays).length)===days0,'nothing removed before confirming');
await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(150);ok(await ev(()=>$('#dlg').open),'must choose delete/keep explicitly');
await p.click('#dlgForm label.tog:has(input[value=del])');await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(300);
const t1=await toastT();ok(/^1 Tag, \d+ Portionen importiert/.test(t1)&&/Demo-Tage entfernt/.test(t1),'toast grammar „1 Tag“',t1);
const un1=await ev(()=>JSON.stringify(Object.values(S.salesUnmapped).map(u=>[u.name,u.q,u.g])));
ok(await ev(()=>Object.keys(S.salesDays).length===1&&S.salesDemo===false),'demo days replaced by the real day');
// re-import same file
await ev(()=>{view.rp.tab='import';render()});await p.waitForTimeout(200);await p.click('[data-act=rpSample]');await p.waitForTimeout(150);if(await p.locator('[data-act=rpImport]').count()===0){await p.click('[data-act=rpAnalyse]');await p.waitForTimeout(200);}
await p.click('[data-act=rpImport]');await p.waitForTimeout(250);
ok(/1 bereits gespeicherter Tag wird ersetzt/.test(await dlgText()),'re-import: confirmation names the replaced day',await dlgText());
await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(300);
ok(await ev(()=>JSON.stringify(Object.values(S.salesUnmapped).map(u=>[u.name,u.q,u.g])))===un1,'re-import does not double unmapped totals',un1);
ok(await ev(()=>{const d=Object.values(S.salesDays)[0];return d.every(r=>r[1]<100)}),'re-import does not double mapped sales');
await ev(()=>{view.rp.tab='import';render()});ok(await ev(()=>/1 Tag/.test(document.querySelector('#app .todo')?.innerText||'')&&!/1 Tage/.test(document.querySelector('#app .todo').innerText)),'import log „1 Tag“');
// mapping select labels
await ev(()=>{view.rp.tab='map';render()});ok(await ev(()=>[...document.querySelectorAll('select[data-pmap] option')].some(o=>/Wiener Schnitzel · vom Kalb/.test(o.textContent))),'Kasse mapping selects show variant');
await L.done(b,errs);})();
