const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
const F='http://127.0.0.1:8775/dahuam/index.html?nointro';
const p=await b.newPage({viewport:{width:1440,height:960},timezoneId:'Europe/Vienna',deviceScaleFactor:1});p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto(F);await p.evaluate(()=>__store.wipe(true));await p.reload();await p.waitForTimeout(1500);const ev=(f,a)=>p.evaluate(f,a);await ev(()=>{gsState().cur='schlicht';save()}); /* Vorlage „Schlicht“ im Gestalter */
console.log('sales days',await ev(()=>Object.keys(S.salesDays).length),'size KB',await ev(()=>Math.round(JSON.stringify(S.salesDays).length/1024)),'S KB',await ev(()=>Math.round(JSON.stringify(S).length/1024)));
await ev(()=>{view.rp.unit='month';view.rp.ref='2026-02-15';view.rp.cmp='prev';go('report')});await p.waitForTimeout(500);await p.screenshot({path:'r-month.png',fullPage:true});
console.log('label',await p.textContent('.rp-label b'));
for(const u of ['week','quarter','half','year','season','day']){await ev(u=>{view.rp.unit=u;render()},u);await p.waitForTimeout(80);console.log(u,await p.textContent('.rp-label b'),'|',await p.textContent('.rp-label small'));}
await ev(()=>{view.rp.unit='season';view.rp.ref='2026-02-15';view.rp.cmp='year';render()});await p.waitForTimeout(300);await p.screenshot({path:'r-season.png',fullPage:true});
await p.click('[data-act=rpStep][data-id="-1"]');console.log('prev season',await p.textContent('.rp-label b'));
await p.click('[data-act=rpStep][data-id="1"]');await p.click('[data-act=rpStep][data-id="1"]');console.log('next season',await p.textContent('.rp-label b'));
// sort
await ev(()=>{view.rp.unit='year';view.rp.ref='2026-06-01';render()});await p.click('[data-act=rpSort][data-id=q]');console.log('top by q',await ev(()=>document.querySelector('table.rp-items tbody tr.row b').textContent));
// CSV
console.log('csv head',await ev(()=>rpCsvText().text.split('\r\n').slice(0,3).join(' || ')));
// import
await ev(()=>{view.rp.tab='import';render()});await p.click('[data-act=rpSample]');await p.click('[data-act=rpAnalyse]');await p.waitForTimeout(200);
console.log('preview',await ev(()=>JSON.stringify({lines:view.rpImport.lines.length,unk:view.rpImport.unknown.map(u=>u.name),mapped:Math.round(view.rpImport.mappedPct)})));
await p.screenshot({path:'r-import.png',fullPage:true});
await p.click('[data-act=rpImport]');await p.waitForTimeout(300);/* neu: Demo-Verkäufe löschen/behalten wird gefragt */await p.click('#dlgForm label.tog:has(input[value=del])');await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(300);console.log('after import tab',await ev(()=>view.rp.tab),'demo',await ev(()=>S.salesDemo),'days',await ev(()=>Object.keys(S.salesDays).length),'unmapped',await ev(()=>Object.keys(S.salesUnmapped).join(',')));
await p.screenshot({path:'r-map.png',fullPage:true});
// map Hüttenteller -> Bauernrösti, Gutschein ignore
await ev(()=>{const k=Object.keys(S.salesUnmapped).find(k=>/hutten/.test(k));const m=S.menu.find(x=>x.name==='Bauernrösti');applyMapping(k,m.id);const g=Object.keys(S.salesUnmapped).find(k=>/gutschein/.test(k)||/9001/.test(k));if(g)applyMapping(g,'-');save();render();});
console.log('rösti on day',await ev(()=>JSON.stringify(S.salesDays['2026-11-09'].find(r=>S.menu.find(m=>m.id===r[0]).name==='Bauernrösti'))),'unmapped left',await ev(()=>Object.keys(S.salesUnmapped).length));
await ev(()=>{view.rp.tab='sales';view.rp.unit='custom';view.rp.from='2026-11-09';view.rp.to='2026-11-09';view.rp.cmp='off';render()});await p.waitForTimeout(200);console.log('day total',await ev(()=>{const r=report('2026-11-09','2026-11-09');return r.qty+' / '+r.gross.toFixed(2)}));
// guest menu web style
await ev(()=>{gsState().cur='schlicht';view.mtab='guest';view.gdate='2027-01-20';view.gseason=null;go('menu')});await p.waitForTimeout(500);
await (await p.$('#gsCanvas .gs-sheet')).screenshot({path:'w-all.png'}); /* Reiter und Kostfilter der früheren Website-Ansicht gibt es im Gestalter nicht mehr */
console.log('blaetter',await ev(()=>document.querySelectorAll('#gsCanvas .gs-sheet').length));
await p.screenshot({path:'w-tools.png'});
const m=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});m.on('pageerror',e=>errs.push('m '+e.message));await m.goto(F);await m.waitForTimeout(900);await m.evaluate(()=>{gsState().cur='schlicht';});
for(const [n,fn] of [['report',()=>{view.rp.unit='month';view.rp.ref='2026-02-15';go('report')}],['guest',()=>{view.mtab='guest';view.gdate='2027-01-20';go('menu');document.querySelector('#gsCanvas').scrollIntoView()}]]){await m.evaluate(fn);await m.waitForTimeout(400);console.log('m',n,await m.evaluate(()=>document.documentElement.scrollWidth));await m.screenshot({path:'rm-'+n+'.png'});}
console.log('errors',errs);await b.close();})();
