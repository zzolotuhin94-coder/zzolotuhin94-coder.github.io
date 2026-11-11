// „So geht’s hier“: das „?“ neben dem Titel öffnet eine kleine Karte mit drei, vier Sätzen. Kein Lichtkegel, kein Warten auf Aktionen.
const {L,ok,done,settle,PHONE}=require('./h');
const VIEWS=[['dash',()=>go('dash')],['vorb',()=>go('vorb')],['checkl',()=>go('checkl')],['menu',()=>{view.mtab='calc';go('menu')}],['guest',()=>{view.mtab='guest';go('menu')}],['plan',()=>{view.mtab='plan';go('menu')}],['cards',()=>go('cards')],['card',()=>go('cards','dish_schnitzel_pork')],
 ['stock',()=>{view.stab='bestand';go('stock')}],['inventur',()=>{view.stab='inventur';go('stock')}],['moves',()=>{view.stab='buchungen';go('stock')}],['buy',()=>{view.stab='bestellung';view.order=null;go('buy')}],['suppliers',()=>{view.stab='lieferanten';view.order=null;go('buy')}],['products',()=>go('products')],
 ['dienst',()=>go('dienst')],['report',()=>{view.rp.tab='sales';go('report')}],['setup',()=>go('setup')],['einr',()=>go('einr')]];
(async()=>{
for(const [name,o] of [['Desktop',{}],['Handy',PHONE]]){
 const {b,p,errs}=await L.open(o);
 const txt=await p.evaluate(()=>({keys:Object.keys(HOWTO),bad:Object.entries(HOWTO).filter(([k,v])=>v.length<2||v.length>4||v.some(x=>x.length<25||x.length>190)).map(x=>x[0])}));
 ok(txt.bad.length===0,`${name}: jede Karte hat 2–4 Sätze, keiner zu lang`,txt.bad);
 let miss=[],wide=[],cover=[];
 for(const [id,f] of VIEWS){ await p.evaluate(f);await settle(p,250);
  const q=await p.$('#app .wozu-q, #app .crumb-q'); if(!q){miss.push(id+':kein ?');continue;}
  await q.click();await settle(p,200);
  const r=await p.evaluate(()=>{const n=document.querySelector('#gdHow');if(!n)return null;const b=n.getBoundingClientRect();return {ctx:guideCtx(),n:n.querySelectorAll('li').length,inApp:!!n.closest('#app'),pos:getComputedStyle(n).position,w:[Math.round(b.left),Math.round(b.right)],sw:document.documentElement.scrollWidth,gd:!!document.querySelector('#gd'),exp:(document.querySelector('#app .wozu-q, #app .crumb-q')||{getAttribute(){}}).getAttribute('aria-expanded')};});
  if(!r||r.ctx!==id||r.n<2||r.n>4||r.gd||r.exp!=='true') miss.push(id+':'+JSON.stringify(r));
  else { if(r.sw>(o.vp?390:1440)||r.w[0]<0||r.w[1]>(o.vp?390:1440)) wide.push(id); if(!r.inApp||r.pos==='fixed'||r.pos==='absolute') cover.push(id); }
 }
 ok(miss.length===0,`${name}: auf allen ${VIEWS.length} Seiten öffnet das „?“ die passende Karte, ohne Lichtkegel`,miss);
 ok(wide.length===0,`${name}: die Karte bleibt in der Breite`,wide);ok(cover.length===0,`${name}: die Karte steht im Seitenfluss und verdeckt nichts`,cover);
 // schließen: X, Esc, noch ein Tipp, Seitenwechsel
 await p.evaluate(()=>go('dash'));await settle(p,200);await p.click('#app .wozu-q');await settle(p,150);await p.click('#gdHow [data-act="howClose"]');await settle(p,150);ok(await p.evaluate(()=>!document.querySelector('#gdHow')),`${name}: X schließt`);
 await p.click('#app .wozu-q');await settle(p,150);await p.keyboard.press('Escape');await settle(p,150);ok(await p.evaluate(()=>!document.querySelector('#gdHow')),`${name}: Esc schließt`);
 await p.click('#app .wozu-q');await settle(p,150);await p.click('#app .wozu-q');await settle(p,150);ok(await p.evaluate(()=>!document.querySelector('#gdHow')),`${name}: noch ein Tipp auf „?“ schließt`);
 await p.click('#app .wozu-q');await settle(p,150);await p.evaluate(()=>go('vorb'));await settle(p,200);ok(await p.evaluate(()=>!document.querySelector('#gdHow')),`${name}: beim Seitenwechsel verschwindet die Karte`);
 // nichts startet von selbst
 ok(await p.evaluate(()=>typeof TOURS==='undefined'&&typeof guideHere==='undefined'&&typeof missionGo==='undefined'),`${name}: keine Schritt-für-Schritt-Anleitungen mehr im Code`);
 // Unterzeile: genau eine je Seite
 let subs=[];for(const [id,f] of VIEWS){await p.evaluate(f);await settle(p,120);const n=await p.evaluate(()=>document.querySelectorAll('#app .page-h .sub').length);if(n>1)subs.push(id+':'+n);}
 ok(subs.length===0,`${name}: höchstens eine Unterzeile je Seite`,subs);
 await done(b,errs);
}
})();
