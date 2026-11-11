// Der kurze Rundgang: fünf Schritte über die täglichen Seiten, einmal angeboten, in den Einstellungen und in der Suche
const {L,ok,done,T,settle,PHONE,URL0}=require('./h');
(async()=>{
// ---------- Desktop
{const {b,p,errs}=await L.open();
 ok(await p.evaluate(()=>!document.querySelector('#gd')&&!document.querySelector('dialog[open]')),'?nointro: kein Rundgang, kein Fenster beim Start');
 ok(await p.evaluate(()=>RUNDGANG.length>=4&&RUNDGANG.length<=5&&RUNDGANG.every(s=>s.t&&(typeof s.x==='function'?s.x():s.x).length>40&&!s.do)),'Rundgang hat 4–5 Schritte, keiner wartet auf eine Aktion',await p.evaluate(()=>RUNDGANG.map(s=>s.t)));
 ok(await p.evaluate(()=>JSON.stringify(RUNDGANG.map(s=>s.t))===JSON.stringify(['Heute','Vorbereitung','Checklisten','Ware','Suche'])),'Schritte: Heute, Vorbereitung, Checklisten, Ware, Suche');
 await p.evaluate(()=>go('setup'));await p.click('#app [data-act="tourMain"]');await settle(p);
 let t=await T(p);ok(t&&t.i===0&&t.n===5&&t.title==='Heute'&&t.tab==='dash'&&t.found,'Start aus den Einstellungen: Schritt 1 „Heute“',t&&[t.title,t.tab]);
 ok(t.hr[2]>20&&t.hr[3]>20&&t.cr[0]>=0&&t.cr[2]<=1440&&t.cr[1]>=0&&t.cr[3]<=900,'Lichtkegel auf dem Navigationspunkt, Karte im Bild',[t.hr,t.cr]);
 ok(t.live>40&&t.focus==='next','Text für Vorleser, Fokus auf „Weiter“',t.focus);
 const want=[['Vorbereitung','vorb'],['Checklisten','checkl'],['Ware','buy'],['Suche','buy']];
 for(const [title,tab] of want){await p.click('#gd [data-gd="next"]');await settle(p);t=await T(p);ok(t&&t.title===title&&t.tab===tab&&t.found,`Schritt „${title}“ zeigt die Seite ${tab}`,t&&[t.title,t.tab,t.found]);}
 ok(t.btns.includes('Fertig')&&t.btns.includes('Schließen'),'letzter Schritt: „Fertig“',t.btns);
 await p.keyboard.press('ArrowLeft');await settle(p,600);t=await T(p);ok(t.title==='Ware','← geht einen Schritt zurück');
 await p.keyboard.press('ArrowRight');await settle(p,600);await p.click('#gd [data-gd="next"]');await settle(p,500);
 ok(await p.evaluate(()=>!GD.t&&!document.querySelector('#gd')&&view.tab==='dash'&&!document.body.classList.contains('gd-on')),'„Fertig“ beendet den Rundgang auf „Heute“');
 // Esc bricht ab und führt zurück
 await p.evaluate(()=>{go('cards');tourStart()});await settle(p,700);await p.click('#gd [data-gd="next"]');await settle(p,700);await p.keyboard.press('Escape');await settle(p,400);
 ok(await p.evaluate(()=>!GD.t&&view.tab==='cards'),'Esc bricht ab und führt dorthin zurück, wo man war');
 // während des Rundgangs wird nichts anderes bedient
 await p.evaluate(()=>tourStart());await settle(p,700);await p.keyboard.press('Control+k');await settle(p,200);
 ok(await p.evaluate(()=>document.querySelector('#pal').hidden&&!!GD.t),'Strg+K öffnet während des Rundgangs nichts');await p.keyboard.press('Escape');await settle(p,300);
 // Schnellsuche
 await p.keyboard.press('Control+k');await p.fill('#palIn','rundgang');await settle(p,200);await p.keyboard.press('Enter');await settle(p,900);
 ok(await p.evaluate(()=>!!GD.t&&GD.t.i===0),'Schnellsuche „Rundgang“ startet ihn');await p.keyboard.press('Escape');
 await done(b,errs);}
// ---------- Handy
{const {b,p,errs}=await L.open(PHONE);
 await p.evaluate(()=>tourStart());await settle(p);
 let t=await T(p);ok(t&&t.title==='Heute'&&t.sw===390&&t.cr[0]>=0&&t.cr[2]<=390,'Handy: Schritt 1, Karte im Bild, keine Breite über 390',t&&[t.sw,t.cr]);
 for(let i=0;i<3;i++){await p.click('#gd [data-gd="next"]');await settle(p);}
 t=await T(p);ok(t.title==='Ware'&&/unter „Mehr“/.test(t.text)&&t.found&&t.sw===390,'Handy: „Ware“ zeigt auf „Mehr“ und sagt es dazu',t.text.slice(-40));
 await p.click('#gd [data-gd="skip"]');await settle(p,400);ok(await p.evaluate(()=>!GD.t),'„Überspringen“ beendet');
 await done(b,errs);}
// ---------- Erster Start: einmal angeboten, als Zeile, nicht als Fenster
{const {b,p,errs}=await L.open({url:URL0,init:()=>{try{ if(!sessionStorage.getItem('t_once')){ sessionStorage.setItem('t_once','1'); localStorage.removeItem('dahuam202_kueche_de_v1_guide'); } }catch(e){}}});
 await settle(p,1600);
 const s=await p.evaluate(()=>({toast:document.querySelector('#toast').classList.contains('show')?document.querySelector('#toast').textContent:'',dlg:!!document.querySelector('dialog[open]'),gd:!!document.querySelector('#gd'),intro:!!document.getElementById('intro'),cover:(()=>{const e=document.elementFromPoint(720,300);return e&&!!e.closest('#toast,.reward,dialog')})()}));
 ok(/Rundgang/.test(s.toast)&&!s.dlg&&!s.gd&&!s.intro&&!s.cover,'erster Start: Angebot als Zeile unten, kein Fenster, keine Startanimation, nichts verdeckt den Inhalt',s);
 await p.click('#toast .toast-act');await settle(p);ok(await p.evaluate(()=>!!GD.t&&GD.t.i===0),'der Knopf in der Zeile startet den Rundgang');await p.keyboard.press('Escape');
 await p.reload();await p.waitForTimeout(1800);
 ok(await p.evaluate(()=>!/Rundgang/.test(document.querySelector('#toast').classList.contains('show')?document.querySelector('#toast').textContent:'')),'beim zweiten Start kein Angebot mehr');
 await done(b,errs);}
})();
