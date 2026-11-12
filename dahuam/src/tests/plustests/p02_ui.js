// Abläufe: Prognose überschreiben, Tagesfaktor, Fehlendes in den Entwurf, Prep-Liste abhaken, PDF, Rollen, Migration
const L=require('../fixtests/lib');const ok=L.ok;
(async()=>{const {b,p,errs}=await L.open({});const ev=(f,a)=>p.evaluate(f,a);const w=ms=>p.waitForTimeout(ms);
const toastT=()=>ev(()=>$('#toast').classList.contains('show')?$('#toast').textContent:'');
// ---------- Navigation ----------
const nav=await ev(()=>({side:[...document.querySelectorAll('.side .nav-i')].map(x=>x.dataset.tab),ico:!!document.querySelector('.side .nav-i[data-tab="vorb"] svg rect'),desc:NAV_DESC.vorb,tabs:TABS.map(t=>t[0])}));
ok(nav.side.indexOf('vorb')===nav.side.indexOf('dash')+1&&nav.ico&&nav.desc.length>20,'nav: Vorbereitung after Heute, own icon, one-line description',nav.side);
ok(!nav.tabs.includes('berater')&&!nav.side.includes('berater')&&await ev(()=>typeof renderBerater==='undefined'&&typeof brData==='undefined'&&!Object.keys(HELP).some(k=>/^br_|berater|hebel|zugpferd/.test(k))&&!palData().some(x=>/Berater|Simulator: Was/.test(x.n+x.s))&&S.plan.loss===undefined),'nothing of the dropped „Berater“ remains (tab, code, help, palette, state)');
// ---------- Vorbereitung ----------
const off=await ev(()=>{let o=0;while((S.settings.closed||[]).includes(dParse(dAdd(todayStr(),o)).getDay()))o++;view.pl.off=o;go('vorb');return o});await w(300);
const vb=await ev(()=>({h:[...document.querySelectorAll('#app .day-h')].map(x=>x.firstChild.textContent),rows:document.querySelectorAll('#app .pl-fc .pl-row').length,tot:(document.querySelector('#app .page-h .sub').textContent.match(/(\d+) Portionen erwartet/)||[])[1],sum:vbPlan(vbDay()).total,basis:document.querySelector('#app .pl-basis').textContent,pdf:!!document.querySelector('#app .page-h [data-pdf="plPrint"]'),days:document.querySelectorAll('#app .pl-days button').length,range:document.querySelector('#app .pl-row .pl-r').textContent}));
ok(vb.h.join('|')==='Vorbereitungsliste|Prognose|Reicht die Ware?'&&vb.days===7&&vb.rows>=5&&vb.tot===String(vb.sum),'Vorbereitung: prep list first, then forecast and stock check; 7 days to pick',vb.h);
ok(/Prognose aus den letzten \d+ \w+tagen/.test(vb.basis)&&/Rückblick: In den letzten 4 Wochen \(\d+ Verkaufstage\) lag die Prognose je Gericht im Schnitt ± [\d,]+ Portionen daneben/.test(vb.basis)&&!/Beispieldaten/.test(vb.basis),'method and back-test line under „Wie die Prognose rechnet“; no per-page demo notice',vb.basis);
ok(/^meist \d+–\d+$/.test(vb.range)&&vb.pdf,'row shows a plausible range; „Als PDF speichern“ present',vb.range);
// überschreiben
const k0=await ev(()=>{const i=document.querySelector('#app .pl-fc input[data-plov]');return {key:i.dataset.plov,v:+i.value,tot:vbPlan(vbDay()).total}});
await p.fill(`#app input[data-plov="${k0.key}"]`,String(k0.v+20));await p.press(`#app input[data-plov="${k0.key}"]`,'Tab');await w(300);
const ov=await ev(k=>({ov:(S.plan.ov[vbDay()]||{})[k],tot:vbPlan(vbDay()).total,cls:document.querySelector(`#app input[data-plov="${k}"]`).closest('.pl-row').classList.contains('ov'),txt:document.querySelector(`#app input[data-plov="${k}"]`).closest('.pl-row').querySelector('.pl-r').textContent}),k0.key);
ok(ov.ov===k0.v+20&&ov.tot===k0.tot+20&&ov.cls&&new RegExp('Prognose '+k0.v).test(ov.txt),'override stored per date; total and row follow; forecast stays visible',ov);
await p.fill(`#app input[data-plov="${k0.key}"]`,'-3');await p.press(`#app input[data-plov="${k0.key}"]`,'Tab');await w(200);ok(await ev(k=>(S.plan.ov[vbDay()]||{})[k],k0.key)===k0.v+20,'negative number rejected');
// Tagesfaktor
const t1=await ev(()=>vbPlan(vbDay()).dishes.filter(x=>!x.ov).reduce((a,x)=>a+Math.round(x.f*1.3),0)+vbPlan(vbDay()).dishes.filter(x=>x.ov).reduce((a,x)=>a+x.q,0));
await p.click('#app [data-act="plFac"][data-id="1.3"]');await w(250);
ok(await ev(()=>S.plan.fac[vbDay()]===1.3&&vbPlan(vbDay()).total)===t1&&await ev(k=>(S.plan.ov[vbDay()]||{})[k],k0.key)===k0.v+20,'„volles Haus +30 %“ scales every forecast, not the overridden number',t1);
// Mise en place: fehlende Zutat → Entwurf
const miss=await ev(()=>{const pl=vbPlan(vbDay());const x=pl.prods.find(q=>SUP(q.p.supplier)&&q.p.packQty>0)||pl.prods.find(q=>SUP(q.p.supplier));x.p.stock=0;S.orders=S.orders.filter(o=>!(o.supplier===x.p.supplier&&['draft','sent','confirmed'].includes(o.status)));save();render();const pl2=vbPlan(vbDay());const y=pl2.prods.find(q=>q.p.id===x.p.id);return {pid:y.p.id,sid:y.p.supplier,miss:y.miss,need:y.need,packs:y.packs,pq:y.p.packQty,unit:y.p.unit,btn:!!document.querySelector(`#app [data-act="plDraft"][data-id="${y.p.supplier}"]`),txt:document.querySelector('#app .pl-sup').innerText.replace(/\n/g,' ')}});
ok(miss.btn&&Math.abs(miss.miss-miss.need)<1e-9&&/Bestellen bis .* Uhr · Lieferung/.test(miss.txt)&&/fehlt/.test(miss.txt),'missing ingredient: „fehlt x“ with the supplier’s next order time and delivery',miss.txt.slice(0,120));
await p.click(`#app [data-act="plDraft"][data-id="${miss.sid}"]`);await w(300);
const dr=await ev(m=>{const o=draftFor(m.sid);const l=o&&o.lines.find(x=>x.pid===m.pid);return {st:o&&o.status,n:l&&l.n,f:l&&l.f,open:!!document.querySelector(`#app [data-act="ordOpen"]`),again:!document.querySelector(`#app [data-act="plDraft"][data-id="${m.sid}"]`)}},miss);
const expN=miss.pq?Math.ceil(miss.miss/miss.pq-1e-9):miss.unit==='Stk'?Math.ceil(miss.miss):Math.ceil(miss.miss*2)/2;
ok(dr.st==='draft'&&dr.n===expN&&dr.n===miss.packs&&dr.again&&dr.open&&/im Entwurf/.test(await toastT()),'„In Bestellung legen“ → draft order with rounded packs; button turns into „Entwurf öffnen“',dr);
// Prep-Liste abhaken
const c0=await ev(()=>[...document.querySelectorAll('#app .pl-c')].slice(0,3).map(x=>x.dataset.id));
for(const k of c0){await p.click(`#app .pl-c[data-id="${k}"]`);await w(120);}
const ck=await ev(ks=>({st:ks.every(k=>S.plan.chk[vbDay()][k]===1),aria:ks.every(k=>document.querySelector(`#app .pl-c[data-id="${k}"]`).getAttribute('aria-checked')==='true'),prog:document.querySelector('#plProg').textContent,over:document.querySelectorAll('.reward,.gd-rw,dialog[open]').length}),c0);
ok(ck.st&&ck.aria&&/^3 von \d+ erledigt$/.test(ck.prog)&&ck.over===0,'three prep items checked: stored per date, progress shown, nothing pops up',ck.prog);
// PDF
await ev(()=>{window.__pr=0;window.print=()=>{window.__pr=$('#print').innerHTML.length;window.__pn=PDF_NAME}});
await p.click('#app [data-pdf="plPrint"]');await w(200);
const pr=await ev(()=>({n:window.__pr,name:window.__pn,h:$('#print h1')?.textContent,li:$('#print').querySelectorAll('.pp-l li').length,box:$('#print').querySelectorAll('.pp-l li i').length}));
ok(pr.n>500&&/^Vorbereitungsliste-\d{4}-\d\d-\d\d\.pdf$/.test(pr.name)&&/^Vorbereitungsliste · /.test(pr.h)&&pr.box>5,'PDF: #print filled with the list, file name Prep-Liste-<date>.pdf',pr);
// bleibt nach Neuladen
const before=await ev(k=>({ov:S.plan.ov[vbDay()][k],fac:S.plan.fac[vbDay()],chk:Object.keys(S.plan.chk[vbDay()]).length}),k0.key);
await p.reload();await w(800);await ev(o=>{view.pl.off=o;go('vorb')},off);await w(250);
const after=await ev(k=>({ov:S.plan.ov[vbDay()][k],fac:S.plan.fac[vbDay()],chk:Object.keys(S.plan.chk[vbDay()]).length,on:document.querySelectorAll('#app .pl-c.on').length,val:document.querySelector(`#app input[data-plov="${k}"]`).value}),k0.key);
ok(JSON.stringify(before)===JSON.stringify({ov:after.ov,fac:after.fac,chk:after.chk})&&after.on===3&&after.val===String(k0.v+20),'override, day factor and checks survive a reload',after);
await p.click(`#app [data-act="plOvReset"]`);await w(250);ok(await ev(()=>!S.plan.ov[vbDay()]),'„zurück“ restores the forecast');
// Ruhetag
const cl=await ev(()=>{let o=0;while(!(S.settings.closed||[]).includes(dParse(dAdd(todayStr(),o)).getDay()))o++;view.pl.off=o;render();return document.querySelector('#app .pl-closed h2')?.textContent});ok(cl==='Ruhetag – keine Vorbereitung','Ruhetag: „Ruhetag – keine Vorbereitung“',cl);
// Heute-Block
await ev(()=>go('dash'));await w(250);
const dh=await ev(()=>{const s=document.querySelector('#app .pl-dash');return s?{t:s.innerText.replace(/\n/g,' '),btn:!!s.querySelector('[data-act="plGo"]')}:null});ok(dh&&/Vorbereitung/.test(dh.t)&&/Portionen erwartet/.test(dh.t)&&dh.btn,'Heute: compact block with expected portions and a link',dh&&dh.t.slice(0,110));
await p.click('#app .pl-dash [data-act="plGo"]');await w(250);ok(await ev(()=>view.tab==='vorb'),'…opens Vorbereitung');
// ---------- Schnellsuche ----------
const pal=await ev(()=>{const a=palData();return ['Vorbereitung','Prognose für morgen','Vorbereitungsliste als PDF speichern'].map(n=>{const x=a.find(y=>y.n===n);return !!x&&!!x.s})});ok(pal.every(Boolean),'command palette: the area (with description) and two actions',pal);
ok(await ev(()=>['Prognose','Spanne','Charge','Vorbereitungsliste','Rückblick'].every(t=>Object.values(HELP).some(h=>h.g&&h.t===t))),'glossary has the new terms');
// ---------- Rolle Team: nur ansehen und abhaken ----------
await ev(()=>{S.settings.currentUser='u_staff';save()});
await ev(o=>{view.pl.off=o;go('vorb')},off);await w(250);
const st3=await ev(()=>({inDis:[...document.querySelectorAll('#app input[data-plov]')].every(i=>i.disabled),fac:[...document.querySelectorAll('#app [data-act="plFac"]')].every(b=>b.disabled)}));
const plan0=await ev(()=>JSON.stringify([S.plan.ov,S.plan.fac]));
await ev(()=>{const i=document.querySelector('#app input[data-plov]');i.disabled=false;i.value='77';i.dispatchEvent(new Event('change',{bubbles:true}));document.querySelectorAll('#app [data-act="plFac"]').forEach(b=>{b.disabled=false});document.querySelector('#app [data-act="plFac"][data-id="0.7"]').click()});await w(200);
const cN=await ev(()=>Object.keys(S.plan.chk[vbDay()]||{}).length);await ev(()=>document.querySelector('#app .pl-c:not(.on)').click());await w(150);
ok(st3.inDis&&st3.fac&&await ev(()=>JSON.stringify([S.plan.ov,S.plan.fac]))===plan0&&await ev(()=>Object.keys(S.plan.chk[vbDay()]||{}).length)===cN+1,'staff: forecast numbers and day factor are read-only; checking off the prep list is allowed',st3);
await ev(()=>{S.settings.currentUser='u_chef';save()});
// ---------- Migration: alter Speicherstand ohne S.plan, kaputtes S.plan ----------
await ev(async()=>{const d=await __store.read();delete d.plan;await __store.replace(d)});await p.reload();await w(800);
ok(await ev(()=>S.plan&&typeof S.plan.ov==='object'&&typeof S.plan.chk==='object'&&typeof S.plan.fac==='object'&&S.menu.length>50),'old saved state without S.plan loads and gets the new fields');
await ev(async()=>{const d=await __store.read();d.plan={ov:[1,2],chk:'x',fac:{'2020-01-01':1.3,'kaputt':2},loss:99};await __store.replace(d)});await p.reload();await w(800);
ok(await ev(()=>!Array.isArray(S.plan.ov)&&typeof S.plan.chk==='object'&&Object.keys(S.plan.fac).length===0),'broken or outdated S.plan is repaired; old dates are dropped');
await ev(()=>{go('vorb')});await w(200);ok(await ev(()=>!!document.querySelector('#app .pl-days')),'…and the tab renders');
// Sicherung: S.plan reist mit
ok(await ev(()=>{planState().fac[todayStr()]=1.3;const d=migrate(JSON.parse(JSON.stringify(S)));return d.plan.fac[todayStr()]===1.3}),'S.plan survives export → import (migrate)');
// keine Verkäufe
await ev(()=>{S.salesDays={};save();go('vorb')});await w(200);const e2=await ev(()=>document.querySelector('#app .panel.empty')?.innerText||'');await ev(()=>go('dash'));await w(200);
ok(/Kasse importieren/.test(e2)&&await ev(()=>!document.querySelector('#app .pl-dash')),'without sales: the tab explains what is needed, Heute shows no block');
await ev(()=>go('vorb'));await w(150);await p.click('#app [data-act="plKasse"]');await w(200);ok(await ev(()=>view.tab==='report'&&view.rp.tab==='import'),'…and leads to the Kassen-Import');
await L.done(b,errs);})();
