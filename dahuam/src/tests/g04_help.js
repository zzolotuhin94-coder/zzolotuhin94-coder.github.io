// Hilfe-Modus, Begriffe, palette, nav descriptions
const {L,ok,done,T,settle,PHONE}=require('./h');
const bub=p=>p.evaluate(()=>{const n=document.querySelector('.gd-bub');return n?{t:n.querySelector('b').textContent,x:n.querySelector('p').textContent,note:(n.querySelector('small')||{}).textContent||'',r:(r=>[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)])(n.getBoundingClientRect())}:null});
(async()=>{
{const {b,p,errs}=await L.open();
 const cnt=await p.evaluate(()=>({help:Object.keys(HELP).length,gl:Object.values(HELP).filter(h=>h.g).length,sel:HELP_SEL.length,bad:HELP_SEL.filter(x=>!HELP[x[1]]).map(x=>x[1]).concat(Object.values(HELP_TXT).filter(k=>!HELP[k])),short:Object.values(HELP).filter(h=>h.x.length<25||h.x.length>230).map(h=>h.k)}));
 ok(cnt.help>=60&&cnt.gl>=40,'≥ 60 help texts, ≥ 40 glossary terms',cnt);ok(cnt.bad.length===0&&cnt.short.length===0,'every selector points to an existing text; texts are 25–230 characters',[cnt.bad,cnt.short]);
 ok(await p.evaluate(()=>['wareneinsatz','we_pct','rohertrag','richtwert','putzverlust','garverlust','mindestbestand','annahmeschluss','gebinde'].every(k=>HELP[k]&&HELP[k].g)),'required terms are in the glossary');
 // coverage in the DOM per view
 const views=[['menu',()=>{view.mtab='calc';go('menu')}],['card',()=>go('cards','dish_schnitzel_pork')],['stock',()=>{view.stab='bestand';go('stock')}],['buy',()=>{view.stab='bestellung';view.order=null;go('buy')}],['products',()=>go('products')],['report',()=>{view.rp.tab='sales';go('report')}],['setup',()=>go('setup')],['dash',()=>go('dash')]];
 const keys=new Set();for(const [n,f] of views){await p.evaluate(f);await settle(p,250);(await p.evaluate(()=>[...new Set([...document.querySelectorAll('[data-help]')].filter(e=>e.getClientRects().length).map(e=>e.dataset.help))])).forEach(k=>keys.add(k));}
 ok(keys.size>=75,'distinct help texts attached to visible elements across 8 views',keys.size);
 // switch on
 await p.evaluate(()=>go('setup'));await p.click('.side [data-act="helpMode"]');await settle(p,200);
 ok(await p.evaluate(()=>HELP_ON&&document.body.classList.contains('gd-help')&&!!document.querySelector('.gd-helpbar')&&document.querySelector('.side [data-act="helpMode"]').getAttribute('aria-pressed')==='true'),'switch turns the mode on (bar, aria-pressed)');
 // destructive click is blocked
 await p.click('#app [data-act="reset"]');await settle(p,250);let bb=await bub(p);
 ok(await p.evaluate(()=>!document.querySelector('#dlg').open)&&bb&&bb.t==='Demodaten wiederherstellen'&&/nichts ausgeführt/.test(bb.note),'„Demodaten wiederherstellen“: explained, not executed',bb);
 await p.evaluate(()=>go('cards','dish_schnitzel_pork'));await settle(p,250);
 await p.click('#app [data-act="delCard"]');await settle(p,250);bb=await bub(p);
 ok(await p.evaluate(()=>!document.querySelector('#dlg').open&&!!C('dish_schnitzel_pork'))&&bb&&bb.t==='Rezeptur löschen','„Löschen“ on a recipe: explained, not executed',bb&&bb.t);
 const n0=await p.evaluate(()=>C('dish_schnitzel_pork').items.length);await p.click('#app [data-act="delLine"]');await settle(p,200);
 ok(await p.evaluate(n=>C('dish_schnitzel_pork').items.length===n,n0),'„Vom Teller nehmen“ blocked');
 // inputs cannot be changed
 await p.evaluate(()=>{view.mtab='calc';go('menu')});await settle(p,250);
 const pr=await p.evaluate(()=>JSON.stringify(S.menu.map(m=>m.price)));
 await p.click('#app input[data-mp]');await p.keyboard.type('99');await p.keyboard.press('Enter');await settle(p,250);bb=await bub(p);
 ok(await p.evaluate(v=>JSON.stringify(S.menu.map(m=>m.price))===v,pr)&&bb&&bb.t==='Preisfeld','price field: explained, value unchanged',bb&&bb.t);
 // column header / KPI
 await p.click('#app table.lt thead th:nth-child(5)');await settle(p,250);bb=await bub(p);
 ok(bb&&/^WE %/.test(bb.t)&&/30 %/.test(bb.x)&&await p.evaluate(()=>!SORTS.menu),'column header „WE %“: explained with an example, list not re-sorted',bb);
 ok(bb.r[0]>=0&&bb.r[2]<=1440&&bb.r[1]>=0&&bb.r[3]<=900,'bubble inside the viewport',bb.r);
 await p.click('#app table.lt thead th:nth-child(6)');await settle(p,250);bb=await bub(p);ok(bb&&bb.t==='Rohertrag','„Rohertrag“ explained',bb&&bb.t);
 await p.evaluate(()=>go('products'));await settle(p,250);
 for(const [txt,title] of [['Putzverlust','Putzverlust'],['Garverlust','Garverlust']]){await p.evaluate(t=>[...document.querySelectorAll('#app th')].find(x=>x.textContent.trim()===t).click(),txt);await settle(p,200);bb=await bub(p);ok(bb&&bb.t===title,`„${txt}“ explained`,bb&&bb.x);}
 // harmless navigation works alongside
 await p.click('.side .nav-i[data-tab="stock"]');await settle(p,300);bb=await bub(p);
 ok(await p.evaluate(()=>view.tab==='stock')&&bb&&bb.t==='Lager','nav item: navigates and explains',bb&&bb.x);
 await p.hover('#app .tile[data-help]');await settle(p,500);bb=await bub(p);ok(bb&&bb.t==='Lagerwert','hover shows the explanation too',bb&&bb.t);
 // Esc switches off; afterwards everything works again
 await p.keyboard.press('Escape');await settle(p,200);
 ok(await p.evaluate(()=>!HELP_ON&&!document.body.classList.contains('gd-help')&&!document.querySelector('.gd-helpbar')&&!document.querySelector('.gd-bub')),'Esc switches the help mode off');
 await p.evaluate(()=>go('setup'));await p.click('#app [data-act="reset"]');await settle(p,250);
 ok(await p.evaluate(()=>document.querySelector('#dlg').open),'after switching off the button works again');await p.keyboard.press('Escape');
 // staff + help: explanation instead of the "nur Küchenchef" lock
 await p.evaluate(()=>{S.settings.currentUser='u_staff';save();view.mtab='calc';go('menu');helpSet(true)});await settle(p,250);
 await p.evaluate(()=>document.querySelector('#app [data-act="newMenu"]').click());await settle(p,250);bb=await bub(p);
 ok(bb&&bb.t==='Neues Gericht'&&await p.evaluate(()=>!document.querySelector('#toast').classList.contains('show')),'staff in help mode gets the explanation',bb&&bb.t);
 await p.evaluate(()=>{helpSet(false);S.settings.currentUser='u_chef';save()});
 // Begriffe
 await p.evaluate(()=>go('begriffe'));await settle(p,250);
 let g=await p.evaluate(()=>({n:document.querySelectorAll('#app .bg-e').length,h1:document.querySelector('#app h1').textContent,nav:document.querySelector('.side .nav-i.on').dataset.tab,title:document.title}));
 ok(g.n>=40&&/Begriffe/.test(g.h1)&&g.nav==='setup'&&/Begriffe/.test(g.title),'Begriffe page lists all terms; Einstellungen stays marked in the nav',g);
 await p.fill('#bq','schwund');await settle(p,150);g=await p.evaluate(()=>[...document.querySelectorAll('#app .bg-e:not([hidden]) dt')].map(e=>e.textContent));
 ok(g.length>=1&&g.length<6&&g.includes('Schwund'),'search filters',g);
 await p.fill('#bq','xyzxyz');await settle(p,150);ok(await p.evaluate(()=>!document.querySelector('#app .bg-none').hidden&&document.querySelectorAll('#app .bg-e:not([hidden])').length===0),'no hit → plain message');
 // reachable from Einstellungen and palette
 await p.evaluate(()=>go('setup'));await p.click('#app .gd-panel [data-act="goTab"][data-id="begriffe"]');await settle(p,200);ok(await p.evaluate(()=>view.tab==='begriffe'),'Begriffe reachable from Einstellungen');
 await p.keyboard.press('Control+k');await settle(p,200);
 let pal=await p.evaluate(()=>[...document.querySelectorAll('#palList button')].map(b=>b.querySelector('.pn').textContent+' | '+b.querySelector('.ps').textContent));
 ok(pal.some(x=>/^Rundgang starten/.test(x))&&pal.some(x=>/^Begriffe \| Alle Fachwörter/.test(x))&&pal.some(x=>/^Speisekarte \| Alle Gerichte mit Preis/.test(x))&&pal.some(x=>/^Was ist das/.test(x))&&pal.some(x=>/^So geht’s hier/.test(x)),'palette: Rundgang, Begriffe, Hilfe, and one line per area',pal.filter(x=>/Rundgang|Begriffe|Speisekarte \|/.test(x)));
 await p.fill('#palIn','garverlust');await settle(p,200);await p.keyboard.press('Enter');await settle(p,400);
 ok(await p.evaluate(()=>view.tab==='begriffe'&&document.querySelector('#bg-garverlust').classList.contains('hit')),'palette finds a term and jumps to it');
 // nav: title + group names
 const nav=await p.evaluate(()=>({titles:[...document.querySelectorAll('.side .nav-i')].map(b=>b.title),groups:[...document.querySelectorAll('.side .nav-group')].map(g=>g.textContent).filter(Boolean)}));
 ok(nav.titles.length===13&&nav.titles.every(t=>t.length>20),'every nav item has a one-line description',nav.titles[3]);ok(nav.groups.join('|')==='Start|Karte & Rezepte|Ware & Einkauf|Verkauf|Team','nav groups have plain names',nav.groups);
 // breadcrumb
 await p.evaluate(()=>go('cards','dish_kaiser'));await settle(p,250);
 ok(await p.evaluate(()=>{const c=document.querySelector('#app .crumb');return !!c&&c.querySelector('.back').textContent.trim()==='Alle Rezepturen'&&c.querySelector('.crumb-here').textContent===C('dish_kaiser').name&&/Kaiserschmarrn.*Rezepturen/.test(document.title)}),'recipe detail: back link + current place + document title');
 await p.click('#app .crumb .back');await settle(p,200);ok(await p.evaluate(()=>view.tab==='cards'&&!view.card),'back link works inside the breadcrumb');
 await done(b,errs);}
})();
