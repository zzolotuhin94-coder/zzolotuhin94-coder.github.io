// Hilfe-Modus „Was ist das?“: erklärt, was man antippt, und führt dabei nichts aus. Fachwörter stehen in den Blasen und in der Suche.
const {L,ok,done,settle,PHONE,bub}=require('./h');
(async()=>{
{const {b,p,errs}=await L.open();
 const cnt=await p.evaluate(()=>({help:Object.keys(HELP).length,gl:Object.values(HELP).filter(h=>h.g).length,sel:HELP_SEL.length,bad:HELP_SEL.filter(x=>!HELP[x[1]]).map(x=>x[1]).concat(Object.values(HELP_TXT).filter(k=>!HELP[k])),short:Object.values(HELP).filter(h=>h.x.length<25||h.x.length>230).map(h=>h.k)}));
 ok(cnt.help>=60&&cnt.gl>=40,'≥ 60 Erklärungen, ≥ 40 Fachwörter',cnt);ok(cnt.bad.length===0&&cnt.short.length===0,'jeder Selektor zeigt auf einen vorhandenen Text; Texte haben 25–230 Zeichen',[cnt.bad,cnt.short]);
 ok(await p.evaluate(()=>['wareneinsatz','we_pct','rohertrag','richtwert','putzverlust','garverlust','mindestbestand','annahmeschluss','gebinde'].every(k=>HELP[k]&&HELP[k].g)),'die wichtigen Fachwörter sind erklärt');
 ok(await p.evaluate(()=>!Object.values(HELP).some(h=>/Stempel|Beispielpreis|Demodaten|Einfach-Modus|Alles zeigen|Küchenchef|Inhaber/.test(h.t+h.x))),'kein Hilfetext nennt Entferntes oder alte Wörter',await p.evaluate(()=>Object.values(HELP).filter(h=>/Stempel|Beispielpreis|Demodaten|Einfach-Modus|Alles zeigen|Küchenchef|Inhaber/.test(h.t+h.x)).map(h=>h.k)));
 // Abdeckung im Bild
 const views=[['menu',()=>{view.mtab='calc';go('menu')}],['card',()=>go('cards','dish_schnitzel_pork')],['stock',()=>{view.stab='bestand';go('stock')}],['buy',()=>{view.stab='bestellung';view.order=null;go('buy')}],['products',()=>{view.pcols=true;go('products')}],['report',()=>{view.rp.tab='sales';go('report')}],['setup',()=>go('setup')],['dash',()=>go('dash')],['vorb',()=>go('vorb')],['dienst',()=>go('dienst')],['checkl',()=>go('checkl')]];
 const keys=new Set();for(const [n,f] of views){await p.evaluate(f);await settle(p,250);(await p.evaluate(()=>[...new Set([...document.querySelectorAll('[data-help]')].filter(e=>e.getClientRects().length).map(e=>e.dataset.help))])).forEach(k=>keys.add(k));}
 ok(keys.size>=70,'Erklärungen hängen an sichtbaren Elementen, über 11 Seiten',keys.size);
 // einschalten
 await p.evaluate(()=>go('setup'));await p.click('.side [data-act="helpMode"]');await settle(p,200);
 ok(await p.evaluate(()=>HELP_ON&&document.body.classList.contains('gd-help')&&!!document.querySelector('.gd-helpbar')&&document.querySelector('.side [data-act="helpMode"]').getAttribute('aria-pressed')==='true'),'Schalter stellt die Hilfe an (Leiste, aria-pressed)');
 await p.click('#app [data-act="reset"]');await settle(p,250);let bb=await bub(p);
 ok(await p.evaluate(()=>!document.querySelector('#dlg').open)&&bb&&bb.t==='Beispieldaten wiederherstellen'&&/nichts ausgeführt/.test(bb.note),'„Beispieldaten wiederherstellen“: erklärt, nicht ausgeführt',bb);
 await p.evaluate(()=>go('cards','dish_schnitzel_pork'));await settle(p,250);
 await p.click('#app [data-act="delCard"]');await settle(p,250);bb=await bub(p);
 ok(await p.evaluate(()=>!document.querySelector('#dlg').open&&!!C('dish_schnitzel_pork'))&&bb&&bb.t==='Rezeptur löschen','„Löschen“ in der Rezeptur: erklärt, nicht ausgeführt',bb&&bb.t);
 const n0=await p.evaluate(()=>C('dish_schnitzel_pork').items.length);await p.click('#app [data-act="delLine"]');await settle(p,200);
 ok(await p.evaluate(n=>C('dish_schnitzel_pork').items.length===n,n0),'„Vom Teller nehmen“ gesperrt');
 await p.evaluate(()=>{view.mtab='calc';go('menu')});await settle(p,250);
 const pr=await p.evaluate(()=>JSON.stringify(S.menu.map(m=>m.price)));
 await p.click('#app input[data-mp]');await p.keyboard.type('99');await p.keyboard.press('Enter');await settle(p,250);bb=await bub(p);
 ok(await p.evaluate(v=>JSON.stringify(S.menu.map(m=>m.price))===v,pr)&&bb&&bb.t==='Preisfeld','Preisfeld: erklärt, Wert bleibt',bb&&bb.t);
 await p.evaluate(()=>[...document.querySelectorAll('#app table.lt thead th')].find(x=>x.textContent.trim()==='in %').click());await settle(p,250);bb=await bub(p);
 ok(bb&&/Wareneinsatz in Prozent/.test(bb.t)&&/30 %/.test(bb.x),'Spaltenkopf „in %“: mit Beispiel erklärt',bb);
 ok(bb.r[0]>=0&&bb.r[2]<=1440&&bb.r[1]>=0&&bb.r[3]<=900,'Blase im Bild',bb.r);
 await p.evaluate(()=>[...document.querySelectorAll('#app table.lt thead th')].find(x=>x.textContent.trim()==='Rohertrag').click());await settle(p,250);bb=await bub(p);ok(bb&&bb.t==='Rohertrag','„Rohertrag“ erklärt',bb&&bb.t);
 await p.evaluate(()=>{view.pcols=true;go('products')});await settle(p,250);
 for(const txt of ['Putzverlust','Garverlust']){await p.evaluate(t=>[...document.querySelectorAll('#app th')].find(x=>x.textContent.trim()===t).click(),txt);await settle(p,200);bb=await bub(p);ok(bb&&bb.t===txt,`„${txt}“ erklärt`,bb&&bb.x);}
 // Navigation geht nebenher weiter und erklärt sich
 await p.click('.side .nav-i[data-tab="ware"]');await settle(p,300);bb=await bub(p);
 ok(await p.evaluate(()=>view.tab==='stock')&&bb&&bb.t==='Ware','Navigationspunkt: führt hin und erklärt',bb&&bb.x);
 await p.click('#app [data-act="wtab"][data-id="preise"]');await settle(p,300);ok(await p.evaluate(()=>view.tab==='products'&&HELP_ON),'Reiter lassen sich in der Hilfe wechseln');
 await p.evaluate(()=>{view.more={};render()});await settle(p,200);await p.click('#app details.more > summary');await settle(p,250);bb=await bub(p);ok(bb&&bb.t==='Mehr Optionen'&&await p.evaluate(()=>document.querySelector('#app details.more').open),'„Mehr Optionen“: klappt auf und erklärt sich',bb&&bb.t);
 await p.keyboard.press('Escape');await settle(p,200);
 ok(await p.evaluate(()=>!HELP_ON&&!document.body.classList.contains('gd-help')&&!document.querySelector('.gd-helpbar')&&!document.querySelector('.gd-bub')),'Esc stellt die Hilfe ab');
 await p.evaluate(()=>go('setup'));await p.click('#app [data-act="reset"]');await settle(p,250);
 ok(await p.evaluate(()=>document.querySelector('#dlg').open),'danach geht der Knopf wieder');await p.keyboard.press('Escape');
 // Team + Hilfe: Erklärung statt Sperre
 await p.evaluate(()=>{S.settings.currentUser='u_staff';save();view.mtab='calc';go('menu');helpSet(true)});await settle(p,250);
 await p.evaluate(()=>document.querySelector('#app [data-act="newMenu"]').click());await settle(p,250);bb=await bub(p);
 ok(bb&&bb.t==='Neues Gericht'&&await p.evaluate(()=>!document.querySelector('#toast').classList.contains('show')),'Team in der Hilfe bekommt die Erklärung',bb&&bb.t);
 await p.evaluate(()=>{helpSet(false);S.settings.currentUser='u_chef';save();render()});
 // Fachwörter: keine eigene Seite mehr, aber in der Suche
 ok(await p.evaluate(()=>typeof renderBegriffe==='undefined'&&!TABS.some(t=>t[0]==='begriffe')),'die Seite „Begriffe“ gibt es nicht mehr');
 await p.keyboard.press('Control+k');await settle(p,200);
 let pal=await p.evaluate(()=>[...document.querySelectorAll('#palList button')].map(b=>b.querySelector('.pn').textContent+' | '+b.querySelector('.ps').textContent));
 ok(pal.some(x=>/^Rundgang starten/.test(x))&&pal.some(x=>/^Was ist das/.test(x))&&pal.some(x=>/^Speisekarte \| Alle Gerichte mit Preis/.test(x))&&pal.some(x=>/^Ware|^Bestand \| Ware/.test(x)),'Schnellsuche: Rundgang, Hilfe und ein Satz je Bereich',pal.filter(x=>/Rundgang|Was ist|Speisekarte \||Bestand/.test(x)));
 ok(!pal.some(x=>/Stempel|Begriffe|Labor|Einfach|Aufbau/.test(x)),'Schnellsuche nennt nichts Entferntes',pal.filter(x=>/Stempel|Begriffe|Labor|Einfach|Aufbau/.test(x)));
 await p.fill('#palIn','garverlust');await settle(p,200);await p.keyboard.press('Enter');await settle(p,400);
 ok(await p.evaluate(()=>document.querySelector('#dlg').open&&/Garverlust/.test(document.querySelector('#dlg').textContent)),'Schnellsuche findet ein Fachwort und zeigt die Erklärung');await p.keyboard.press('Escape');
 // ein Satz je Navigationspunkt
 const nav=await p.evaluate(()=>({titles:[...document.querySelectorAll('.side .nav-i')].map(b=>b.title),groups:document.querySelectorAll('.side .nav-group').length}));
 ok(nav.titles.length===8&&nav.titles.every(t=>t.length>20)&&nav.groups===0,'acht Navigationspunkte, jeder mit einem Satz, keine Gruppen-Überschriften',nav);
 // Brotkrume
 await p.evaluate(()=>go('cards','dish_kaiser'));await settle(p,250);
 ok(await p.evaluate(()=>{const c=document.querySelector('#app .crumb');return !!c&&c.querySelector('.back').textContent.trim()==='Alle Rezepturen'&&c.querySelector('.crumb-here').textContent===C('dish_kaiser').name&&/Kaiserschmarrn.*Rezepte/.test(document.title)}),'Rezeptur: Zurück-Knopf, aktueller Ort, Titel des Fensters');
 await p.click('#app .crumb .back');await settle(p,200);ok(await p.evaluate(()=>view.tab==='cards'&&!view.card),'Zurück geht');
 await done(b,errs);}
// Handy
{const {b,p,errs}=await L.open(PHONE);
 await p.click('.topbar [data-act="helpMode"]');await settle(p,200);ok(await p.evaluate(()=>HELP_ON&&!!document.querySelector('.gd-helpbar')&&document.documentElement.scrollWidth===390),'Handy: Hilfe oben einschalten, Breite bleibt 390');
 await p.click('.bottom .nav-i[data-tab="vorb"]');await settle(p,300);let bb=await bub(p);ok(bb&&bb.t==='Vorbereitung'&&bb.r[0]>=0&&bb.r[2]<=390&&await p.evaluate(()=>view.tab==='vorb'),'Handy: Navigationspunkt erklärt, Blase im Bild',bb);
 await p.click('.bottom .nav-i[data-act="mehr"]');await settle(p,300);ok(await p.evaluate(()=>!document.getElementById('mehr').hidden),'Handy: „Mehr“ geht in der Hilfe auf');
 await p.click('#mehr [data-act="mehrClose"].icon-btn');await p.click('.gd-helpbar [data-act="helpMode"]');await settle(p,200);ok(await p.evaluate(()=>!HELP_ON),'Handy: „Hilfe aus“');
 await done(b,errs);}
})();
