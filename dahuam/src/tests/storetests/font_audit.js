// Welche Schriften werden wirklich gebraucht? Rundgang durch alle Bereiche, Karten-Stile, Druckansichten.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());const p=await ctx.newPage();
await p.addInitScript(()=>{window.print=()=>{};try{localStorage.setItem('dahuam202_kueche_de_v1_guide',JSON.stringify({asked:1,mode:'full'}))}catch(e){}});
await p.goto(process.argv[2]||'http://127.0.0.1:8765/dahuam/_before.html?nointro');await p.waitForTimeout(900);
const used={};
const grab=async(tag)=>{const r=await p.evaluate(()=>{const o={};const KNOWN=/Figtree|Barlow Condensed|PT Sans|Saira Condensed|Roboto Condensed|Source Serif 4|Schibsted Grotesk|Bricolage Grotesque|JetBrains Mono|Fraunces|Caveat|Cormorant Garamond|Alegreya|Big Shoulders|Karla|Work Sans|Young Serif|Playfair|DM S/;
 for(const el of document.querySelectorAll('body *')){ if(el.closest('#intro'))continue; let txt=false;for(const n of el.childNodes)if(n.nodeType===3&&n.nodeValue.trim()){txt=true;break}
  if(!txt&&!/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName))continue; const cs=getComputedStyle(el); if(cs.display==='none')continue; const fam=cs.fontFamily.split(',').map(s=>s.trim().replace(/["']/g,'')); const f=fam.find(x=>KNOWN.test(x))||fam[0]; if(fam.indexOf(f)>0 && !KNOWN.test(fam[0])){} const k=(KNOWN.test(fam[0])?fam[0]:'('+fam[0]+')')+'|'+cs.fontWeight+'|'+cs.fontStyle; o[k]=(o[k]||0)+1;}
 return o});for(const k in r){used[k]=used[k]||{n:0,where:new Set()};used[k].n+=r[k];used[k].where.add(tag)}};
const ev=f=>p.evaluate(f).catch(e=>console.log('ERR',String(e).slice(0,120)));
const tabs=await ev(()=>TABS.map(t=>t[0]));
for(const t of tabs){await ev(`go('${t}')`);await p.waitForTimeout(120);await grab(t)}
for(const mt of ['calc','guest','layout','plan']){await ev(`view.mtab='${mt}';go('menu')`);await p.waitForTimeout(150);await grab('menu:'+mt)}
for(const st of ['haus','alpin','elegant','kreide','getraenke','schlicht']){await ev(`view.mtab='guest';go('menu')`);await p.click('#gsRail [data-gs="look"][data-id="'+st+'"]').catch(e=>console.log('noclick',st));await p.waitForTimeout(600);await grab('guest:'+st); /* Vorlagen des Gestalters (früher die Stile haus/web/book) */
  await ev(`gsPrintFill()`);await p.waitForTimeout(200);await ev(`document.getElementById('print').style.display='block'`);await grab('print:'+st);await ev(`document.getElementById('print').style.display=''`);
  for(const sea of ['winter','fruehling','sommer','herbst']){await ev(`view.season='${sea}';render()`);await p.waitForTimeout(120);await grab('guest:'+st+':'+sea)}}
const sps=await ev(()=>S.specials.map(s=>s.id));
for(const id of sps||[]){await ev(`document.querySelector('[data-act]');view.mtab='plan';go('menu')`);await ev(`(()=>{const sp=S.specials.find(x=>x.id==='${id}');document.getElementById('print').innerHTML=tageskarteHtml(sp);document.getElementById('print').style.display='block'})()`);await grab('tageskarte');await ev(`document.getElementById('print').style.display=''`)}
await ev(()=>{const c=S.cards[0];go('cards',c.id)});await p.waitForTimeout(150);await grab('card');
await ev(()=>{printCard(S.cards[0].id);document.getElementById('print').style.display='block'});await grab('print:card');
await ev(()=>{printOrder(S.orders[0]);document.getElementById('print').style.display='block'});await grab('print:order');await ev(`document.getElementById('print').style.display=''`);
for(const s of ['bestand','buchungen','inventur']){await ev(`view.stab='${s}';go('stock')`);await grab('stock:'+s)}
for(const s of ['bestellung','lieferanten']){await ev(`view.stab='${s}';go('buy')`);await grab('buy:'+s)}
await ev(()=>{view.stab='bestellung';view.order=S.orders[0].id;go('buy')});await grab('order');
console.log(Object.entries(used).sort().map(([k,v])=>k.padEnd(40)+String(v.n).padStart(6)+'  '+[...v.where].slice(0,6).join(',')).join('\n'));
await b.close()})();
