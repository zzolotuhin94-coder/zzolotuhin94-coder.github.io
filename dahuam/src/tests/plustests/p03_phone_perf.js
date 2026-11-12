// Handy 390: keine Seitenbreite über 390, Tippflächen ≥ 40 px; „So geht’s hier“; Hilfe; Geschwindigkeit mit einem Jahr Daten
const L=require('../fixtests/lib');const ok=L.ok;
// feste Uhr: Dienstag, 10.11.2026, 10:30. Die Prep-Liste dieses Tests gilt für übermorgen (Donnerstag, 12.11.): ein offener Tag ohne Aktion.
// Ohne feste Uhr hing das Ergebnis vom Wochentag ab: montags ist übermorgen Ruhetag (keine Zeilen), mittwochs und donnerstags
// fällt übermorgen in das Beispiel-„Wildwochenende“ (Freitag bis Sonntag), das zwei Gerichte mehr in die Prognose bringt (74 statt 72).
const CLOCK=require('../teamtests/tlib').clock(2026,11,10,10,30);
(async()=>{
// ---------- Desktop ----------
{const {b,p,errs}=await L.open({init:CLOCK});const ev=(f,a)=>p.evaluate(f,a);const w=ms=>p.waitForTimeout(ms);
// ein volles Jahr: 250 Verkaufstage × 72 Gerichte, jedes Gericht mit Rezeptur
const big=await ev(()=>{const cards=S.cards.filter(c=>c.type==='dish'&&!c.drink);/* D1: Schankrezepturen sind keine Küchen-Rezepturen */S.menu.forEach((m,i)=>{if(!m.card)m.card=cards[i%cards.length].id;m.seasons=[];m.days=[]});S.salesDays={};let d=todayStr(),n=0,k=0;while(n<250){d=dAdd(d,-1);if(dParse(d).getDay()===3)continue;S.salesDays[d]=S.menu.slice(0,72).map((m,i)=>{const q=1+((i*7+k*3)%9);return [m.id,q,q*m.price]});n++;k++;}save();return {days:Object.keys(S.salesDays).length,dishes:S.salesDays[d].length}});
const time=async(tab,pre)=>{const out=[];for(let i=0;i<3;i++){out.push(await ev(([tab,pre])=>{go('menu');if(pre)eval(pre);save();/* leert den Zwischenspeicher */const t0=performance.now();go(tab);document.querySelector('#app').offsetHeight;return performance.now()-t0},[tab,pre]));}return Math.round(Math.min(...out));};
const tV=await time('vorb','view.pl.off=2;view.pl.all=true'),tD=await time('dash');
ok(big.days===250&&big.dishes===72&&tV<150,`Vorbereitung renders < 150 ms with 250 days × 72 dishes (cold cache, all rows, incl. back-test): ${tV} ms`);ok(tD<150,`Heute with the forecast block: ${tD} ms`);
const warm=await ev(()=>{go('vorb');const t0=performance.now();render();return performance.now()-t0});ok(warm<60,`second render uses the cache: ${Math.round(warm)} ms`);
ok(await ev(()=>{const pl=vbPlan(vbDay());return pl.dishes.length===72&&pl.batches.length>0&&pl.prods.length>20&&document.querySelectorAll('#app .pl-fc .pl-row').length===72}),'72 dishes forecast, batches and ingredients computed');
await ev(()=>__store.wipe());await p.goto('about:blank');await p.goto(L.URL);await w(800);await ev(()=>__store.wipe());await p.reload();await w(800);
const openDay=()=>ev(()=>{let o=0;while((S.settings.closed||[]).includes(dParse(dAdd(todayStr(),o)).getDay()))o++;view.pl.off=o;go('vorb');window.scrollTo(0,0)});
// eine Darstellung für alle: Prep-Liste, Prognose, Warenprüfung; der Rückblick steht zugeklappt darunter
await openDay();await w(250);
const sv=await ev(()=>({h:[...document.querySelectorAll('#app .day-h')].map(x=>x.firstChild.textContent),how:!!document.querySelector('#app details.pl-how'),pdf:!!document.querySelector('#app [data-pdf="plPrint"]'),mode:typeof setMode}));
ok(sv.h.join('|')==='Prep-Liste|Prognose|Reicht die Ware?'&&sv.how&&sv.pdf&&sv.mode==='undefined','one presentation (no mode switch): prep list, forecast, stock check',sv.h);
// keine Geld-Auswertung auf dieser Seite
await openDay();await w(200);ok(await ev(()=>!/€|Deckungsbeitrag|Rohertrag|Wareneinsatz|Umsatz/.test(document.querySelector('#app').innerText)),'no money figures on the Vorbereitung screen');
// Anleitung
ok(await ev(()=>!!document.querySelector('#app .page-h h1 .wozu-q')),'„So geht’s hier“ button next to the title');
await p.click('#app .page-h h1 .wozu-q');await w(250);const how=await ev(()=>({n:document.querySelectorAll('#gdHow li').length,gd:!!document.querySelector('#gd'),txt:(document.querySelector('#gdHow')||{textContent:''}).textContent}));
ok(how.n>=3&&how.n<=4&&!how.gd&&/Prep-Liste/.test(how.txt),'„So geht’s hier“: a static card with 3–4 lines, no spotlight tour',how.n);await ev(()=>howHide());
// Hilfe
const hp=await ev(()=>{go('vorb');helpApply();const c=[...document.querySelectorAll('#app [data-help]')].map(e=>e.dataset.help);return {v:[...new Set(c)],bad:HELP_SEL.filter(x=>!HELP[x[1]]).length,len:Object.values(HELP).filter(h=>h.x.length<25||h.x.length>230).map(h=>h.k)}});
ok(['prognose','spanne','pl_menge','tagesfaktor','mise','prepliste','pl_abhaken','pl_tag','pdf'].every(k=>hp.v.includes(k))&&hp.bad===0&&hp.len.length===0,'help mode: new elements carry explanations; all texts 25–230 characters',hp.v);
if(errs.length)console.log('errors desktop',JSON.stringify(errs));await b.close();if(errs.length)process.exitCode=1;}
// ---------- Handy 390 ----------
{const {b,p,errs}=await L.open({vp:{width:390,height:844},mobile:true,touch:true,init:CLOCK});const ev=(f,a)=>p.evaluate(f,a);const w=ms=>p.waitForTimeout(ms);
const sw=()=>ev(()=>[document.documentElement.scrollWidth,document.body.scrollWidth]);const bad=[];
const small=()=>ev(()=>[...document.querySelectorAll('#app button,#app input,#app select,#app summary,#app [role=checkbox]')].filter(e=>e.closest('.pl-sec,.pl-days,.pl-how,.pl-dash,[data-pdf="plPrint"]')).filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.height<39.5||r.width<39.5)}).map(e=>(e.dataset.act||e.className||e.tagName)+' '+Math.round(e.getBoundingClientRect().width)+'×'+Math.round(e.getBoundingClientRect().height)));
const check=async(name)=>{await w(200);const s=await sw();if(s[0]!==390||s[1]!==390)bad.push(name+' '+s);const sm=await small();if(sm.length)bad.push(name+' klein: '+sm.slice(0,4).join(' | '));};
let views=0;
for(const mode of ['']){
  for(let o=0;o<7;o++){await ev(o=>{view.pl.off=o;view.pl.all=o===2;go('vorb')},o);await check(mode+' vorb +'+o);views++;}
  await ev(()=>{let o=0;while((S.settings.closed||[]).includes(dParse(dAdd(todayStr(),o)).getDay()))o++;view.pl.off=o;render();const pl=vbPlan(vbDay());pl.prods.slice(0,4).forEach(x=>{x.p.stock=0});if(!document.querySelector('#app input[data-plov]')){phS().fc=true;render();}/* Handy: Prognose hinter „Ändern“ (phone.js) */const i=document.querySelector('#app input[data-plov]');i.value='55';i.dispatchEvent(new Event('change',{bubbles:true}))});await w(200);await ev(()=>{document.querySelectorAll('#app details').forEach(d=>d.open=true)});await check(mode+' vorb fehlt + überschrieben');views++;
  await ev(()=>go('dash'));await check(mode+' heute');await ev(()=>go('setup'));await check(mode+' mehr');views+=2;
}
ok(bad.length===0,`phone 390: scrollWidth === 390 and controls ≥ 40 px on ${views} views (7 days, missing stock, Heute, Einstellungen)`,bad);
await ev(()=>go('dash'));await w(200);
await p.tap('#phBoard [data-act="plGo"]');await w(250);ok(await ev(()=>view.tab==='vorb'),'phone: Vorbereitung is one tap from Heute (row on the board, phone.js)');
await ev(()=>{let o=0;while((S.settings.closed||[]).includes(dParse(dAdd(todayStr(),o)).getDay()))o++;view.pl.off=o;render()});await w(200);
ok(await ev(()=>{const c=document.querySelector('#app .pl-c');return c&&parseFloat(getComputedStyle(c).fontSize)>=16&&c.getBoundingClientRect().height>=48}),'prep list: big type (≥ 16 px), rows ≥ 48 px');
await p.tap('#app .pl-c');await w(150);ok(await ev(()=>document.querySelector('#app .pl-c').classList.contains('on')),'tap checks an item');
ok(await ev(()=>{const d=document.querySelector('#app .pl-days, #app .hy-days');return d.scrollWidth>=d.clientWidth&&getComputedStyle(d).overflowX==='auto'}),'day picker scrolls inside itself, not the page');
// „So geht’s hier“ steht am Handy nicht mehr im Seitenkopf (phone.js: eigener, ruhiger Kopf; die Anleitung liegt unter „Mehr“)
ok((await sw())[0]===390&&await ev(()=>!document.querySelector('#app .page-h')&&!!document.querySelector('#app .hy-back')),'phone: Vorbereitung has the quiet phone head with a back button, no side scroll');
await L.done(b,errs);}
})();
