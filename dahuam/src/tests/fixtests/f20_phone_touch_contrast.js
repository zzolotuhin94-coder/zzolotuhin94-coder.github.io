// Findings 19, 20, 21: phone layout (no side scroll), touch targets ≥ 40 px, light-theme contrast
const L=require('./lib');const ok=L.ok;
const VIEWS=[['einr',()=>go('einr')],['dash',()=>go('dash')],['menu',()=>{view.mtab='calc';go('menu')}],['menu-plan',()=>{view.mtab='plan';go('menu')}],['menu-guest',()=>{view.mtab='guest';go('menu')}],['cards',()=>go('cards')],['card',()=>{setV('teller','teller');go('cards','dish_kaiser')}],['card-table',()=>{setV('teller','table');go('cards','dish_kaiser')}],
 ['stock',()=>{setV('teller','teller');view.order=null;view.stab='bestand';go('stock')}],['moves',()=>{view.stab='buchungen';go('stock')}],['inventur',()=>{if(!S.invDraft)S.invDraft={date:new Date().toISOString(),counts:{}};view.stab='inventur';go('stock')}],
 ['buy',()=>{view.stab='bestellung';view.order=null;go('buy')}],['suppliers',()=>{view.stab='lieferanten';go('buy')}],['order-done',()=>{view.stab='bestellung';view.order=S.orders.find(o=>o.receipt&&o.lines.some(l=>l.invPrice)).id;view.recv=null;go('buy')}],
 ['order-draft',()=>{const o=newOrder('sup_gross');view.order=o.id;go('buy')}],['recv',()=>{const o=S.orders.find(o=>o.status==='confirmed');view.order=o.id;view.recv=o.id;go('buy')}],
 ['products',()=>{view.order=null;view.recv=null;go('products')}],['report',()=>{view.rp.tab='sales';go('report')}],['report-import',()=>{view.rp.tab='import';go('report')}],['setup',()=>go('setup')],['vorb',()=>go('vorb')],['dienst',()=>go('dienst')],['checkl',()=>go('checkl')],['pcheck',()=>pcStart()]];
const SMALL_SEL='.seg button,.chip,.btn.sm,.ti-x,.ti-grip,.lt-grip,.wozu-q,details.more > summary,table.lt th button,input.lt-price,.icon-btn,.row-open,.toast-act';
(async()=>{
// ---------- phone
{const {b,p,errs}=await L.open({vp:{width:390,height:844},mobile:true,touch:true});
 for(const [n,f] of VIEWS){await p.evaluate(f);await p.waitForTimeout(280);
  const r=await p.evaluate(sel=>{const de=document.documentElement;const hid=document.querySelectorAll('#app .tiles').length;
   const small=[...document.querySelectorAll('#app '+sel.split(',').join(',#app '))].filter(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height||e.closest('[hidden]'))return false;if(getComputedStyle(e).visibility==='hidden')return false;return r.height<39.5||r.width<39.5}).map(e=>(e.className||e.tagName).toString().slice(0,22)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
   return {sw:de.scrollWidth,hid,small:[...new Set(small)].slice(0,6),n:small.length}},SMALL_SEL);
  ok(r.sw===390,`phone ${n}: scrollWidth === 390`,r.sw); ok(r.hid===0,`phone ${n}: no KPI tile row`); ok(r.n===0,`phone ${n}: touch targets ≥ 40 px`,r.small);
  if(['dash','report','order-done','recv','stock','buy','setup','order-draft','card','inventur','moves'].includes(n)) await p.screenshot({path:`shots/phone-${n}.png`,fullPage:false});}
 // order detail: price, sum, invoice price, status visible without horizontal scroll
 await p.evaluate(VIEWS.find(v=>v[0]==='order-done')[1]);await p.waitForTimeout(250);
 ok(await p.evaluate(()=>[...document.querySelectorAll('table.otab tbody td[data-l]')].filter(td=>td.textContent.trim()).every(td=>{const r=td.getBoundingClientRect();return r.left>=0&&r.right<=390&&r.width>0})),'phone order detail: all cells inside the viewport');
 ok(await p.evaluate(()=>['Preis','Summe','Geliefert','Rechnungspreis'].every(l=>document.querySelector(`table.otab td[data-l="${l}"]`)&&getComputedStyle(document.querySelector(`table.otab td[data-l="${l}"]`),'::before').content.includes(l))),'phone order detail: labelled Preis, Summe, Geliefert, Rechnungspreis');
 ok(await p.evaluate(()=>/€\s32,00 → €\s34,50 · \+7,8\s%/.test(document.querySelector('table.otab').innerText)),'order detail shows invoice deviation old → new, %');
 await p.evaluate(VIEWS.find(v=>v[0]==='recv')[1]);await p.waitForTimeout(250);
 ok(await p.evaluate(()=>[...document.querySelectorAll('table.recv tbody input,table.recv tbody select')].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=390})),'phone Wareneingang: fields inside the viewport');
 // report
 await p.evaluate(()=>{view.rp.tab='sales';go('report')});await p.waitForTimeout(300);
 await p.evaluate(()=>{view.rp.cmp='year';render()});await p.waitForTimeout(200);
 const rp=await p.evaluate(()=>{const sum=document.querySelector('#app .rp-sum');const head=document.querySelector('.rp-period').getBoundingClientRect();const ths=[...document.querySelectorAll('.rp-items thead th')].filter(t=>t.getBoundingClientRect().width>0).map(t=>t.textContent.trim().replace(/[↓↑ ]+$/,''));return {sum:!!sum&&sum.getBoundingClientRect().right<=390&&parseFloat(getComputedStyle(sum).fontSize)>=13,headH:Math.round(head.height),ths,lab:document.querySelector('.rp-label b').scrollWidth<=document.querySelector('.rp-label b').clientWidth+1}});
 ok(rp.sum,'phone Auswertung: key figures as one readable line (≥ 13 px, inside 390)'); ok(rp.headH<=190,'phone Auswertung: period header compact',rp.headH); ok(rp.lab,'period label not truncated');
 ok(['Menge','Umsatz netto','Δ Menge'].every(x=>rp.ths.includes(x)),'phone item table shows Menge, Umsatz, Δ',rp.ths);
 // sub-tab scrolled into view; per-sub-tab subtitle
 await p.evaluate(()=>{view.stab='buchungen';go('stock')});await p.waitForTimeout(250);
 ok(await p.evaluate(()=>{const b=document.querySelector('#app .seg button.on').getBoundingClientRect();return b.left>=0&&b.right<=390}),'active sub-tab scrolled into view');
 const subs=[];for(const t of ['calc','guest','plan']){await p.evaluate(t=>{view.mtab=t;go('menu')},t);await p.waitForTimeout(200);subs.push(await p.evaluate(()=>document.querySelector('#app .page-h .sub')?.textContent||''));}
 ok(new Set(subs).size===3&&/Preis, Wareneinsatz/.test(subs[0])&&!subs.slice(1).some(s=>/Preis direkt in der Zeile/.test(s)),'per-sub-tab subtitle (Kalkulation hint only on Kalkulation)',subs.map(s=>s.slice(0,28)));
 console.log('errors phone',JSON.stringify(errs));if(errs.length)process.exitCode=1;await b.close();}
// ---------- desktop density unchanged
{const {b,p,errs}=await L.open({});await p.evaluate(()=>go('menu'));await p.waitForTimeout(250);
 const d=await p.evaluate(()=>({seg:Math.round(document.querySelector('#app .toolbar.filters .seg button').getBoundingClientRect().height),price:Math.round(document.querySelector('input.lt-price').getBoundingClientRect().height),sm:Math.round((document.querySelector('#app .btn.sm')||document.querySelector('#app .icon-btn')).getBoundingClientRect().height)}));
 ok(d.seg===30&&d.price===30,'desktop density unchanged (segment 30 px, price field 30 px)',d);
 // ---------- contrast, light theme
 const CON=()=>{const lum=c=>{const a=c.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]};const parse=s=>{const m=s.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(/[, /]+/).map(Number);return [p[0],p[1],p[2],p.length>3&&!isNaN(p[3])?p[3]:1]};
  const cv=document.createElement('canvas').getContext('2d');const norm=s=>{cv.fillStyle='#000';cv.fillStyle=s;const v=cv.fillStyle;if(v[0]==='#')return [parseInt(v.slice(1,3),16),parseInt(v.slice(3,5),16),parseInt(v.slice(5,7),16),1];return parse(v)};
  const bgOf=el=>{let layers=[];for(let e=el;e;e=e.parentElement){const c=norm(getComputedStyle(e).backgroundColor);if(c&&c[3]>0){layers.push(c);if(c[3]>=1)break;}}let base=[255,255,255];for(const c of layers.reverse())base=base.map((b,i)=>b*(1-c[3])+c[i]*c[3]);return base};
  const out=[];const seen=new Set();const w=document.createTreeWalker(document.querySelector('#app'),NodeFilter.SHOW_TEXT);
  while(w.nextNode()){const t=w.currentNode;if(!t.nodeValue.trim())continue;const el=t.parentElement;if(seen.has(el))continue;seen.add(el);const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;const cs=getComputedStyle(el);if(cs.visibility==='hidden'||el.closest('[hidden],svg,.guest-prev,.ph,.wk-paper,.hs-host,.g-paper,button.btn.primary,.chip.on,.tl-bar'))continue;
   let op=1;for(let e=el;e&&e.id!=='app';e=e.parentElement)op*=+getComputedStyle(e).opacity;if(op<0.05||/^[★●•·—–\-]+$/.test(t.nodeValue.trim()))continue;const fg=norm(cs.color);if(!fg)continue;const bg=bgOf(el);const a=fg[3]*op;const mix=fg.slice(0,3).map((v,i)=>v*a+bg[i]*(1-a));const L1=lum(mix),L2=lum(bg);const cr=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
   const fs=parseFloat(cs.fontSize),bold=+cs.fontWeight>=600;const disabled=el.closest(':disabled,[aria-disabled=true]');if(disabled)continue;const need=3;const body=4.5;
   out.push({cr:+cr.toFixed(2),fs,txt:t.nodeValue.trim().slice(0,24),cls:(el.className||el.tagName).toString().slice(0,24),large:fs>=18||(fs>=14&&bold)});}
  return out;};
 const tabs=[['dash',()=>{view.dashPast=true;go('dash')}],['menu',()=>{view.mtab='calc';go('menu')}],['plan',()=>{view.mtab='plan';go('menu')}],['cards',()=>go('cards')],['card',()=>go('cards','dish_kaiser')],['stock',()=>{view.stab='bestand';go('stock')}],['buy',()=>{view.stab='bestellung';go('buy')}],['products',()=>go('products')],['report',()=>go('report')],['setup',()=>go('setup')],['einr',()=>go('einr')],['vorb',()=>go('vorb')],['dienst',()=>go('dienst')],['checkl',()=>go('checkl')]];
 await p.evaluate(()=>setTheme('light'));
 for(const [n,f] of tabs){await p.evaluate(f);await p.waitForTimeout(250);const all=await p.evaluate(CON);
  const lt3=all.filter(x=>x.cr<3),lt45=all.filter(x=>x.cr<4.5&&!x.large&&x.fs>=13);
  ok(lt3.length===0,`light ${n}: no text below 3:1 (${all.length} text runs)`,lt3.slice(0,5).map(x=>`${x.cr} ${x.cls} "${x.txt}"`));
  ok(lt45.length===0,`light ${n}: body-size text (≥ 13 px) ≥ 4.5:1`,lt45.slice(0,5).map(x=>`${x.cr} ${x.fs}px ${x.cls} "${x.txt}"`));}
 await L.done(b,errs);}
})();
