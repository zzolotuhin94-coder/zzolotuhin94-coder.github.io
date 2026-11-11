// Findings 3, 4, 5, 12, 13, 16, 9 (Kasse import), 29 (storno icon)
const L=require('./lib');const ok=L.ok;
(async()=>{const {b,p,errs}=await L.open({});
const ev=(f,a)=>p.evaluate(f,a); const dlgOpen=()=>ev(()=>$('#dlg').open); const dlgText=()=>ev(()=>$('#dlg').innerText.replace(/\s+/g,' '));
const toastT=()=>ev(()=>$('#toast').textContent); const submit=async()=>{await p.click('#dlgForm button[type=submit]');await p.waitForTimeout(200);};
// ---------- 4 Inventur
await ev(()=>{view.stab='inventur';go('stock')});await p.click('[data-act=invStart]');await p.waitForTimeout(200);
const first=await ev(()=>document.querySelector('input[data-inv]').dataset.inv);
await p.locator('#inv-'+first).click();await p.keyboard.type('-3');await p.waitForTimeout(100);
ok(await ev(id=>S.invDraft.counts[id]===undefined||S.invDraft.counts[id]==='',first),'negative count is not stored',await ev(id=>S.invDraft.counts[id],first));
await p.keyboard.press('Tab');await p.waitForTimeout(150);
ok(/nicht übernommen/.test(await toastT()),'negative count: hint',await toastT()); ok(await p.inputValue('#inv-'+first)==='','negative count reverted');
const soll=await ev(id=>+P(id).stock,first);
await p.locator('#inv-'+first).click();await p.keyboard.type(String(soll-1.5).replace('.',','));await p.keyboard.press('Tab');await p.waitForTimeout(150);
ok(await ev(id=>S.invDraft.counts[id],first)===soll-1.5,'comma count stored',await ev(id=>S.invDraft.counts[id],first));
await p.click('[data-act=invFinish]');await p.waitForTimeout(200);
ok(/Differenz: −€/.test(await dlgText()) && /Fehlbestand/.test(await dlgText()),'confirm shows signed difference',await dlgText());
await submit(); ok(await ev(id=>+P(id).stock,first)===soll-1.5,'inventory booked');
// ---------- 5 Entnahme über Bestand
const st=()=>ev(()=>+P('pork').stock); const s0=await st(); const mv0=await ev(()=>S.moves.length);
await ev(()=>moveDlg('out:pork'));await p.fill('#dlgForm [name=qty]',String(s0+5));await submit();
ok(await dlgOpen() && await st()===s0 && await ev(()=>S.moves.length)===mv0,'Entnahme > Bestand: blocked, nothing booked');
ok(/Mehr als der Bestand/.test(await dlgText()) && await p.locator('#mvForce').count()===1,'inline message + „Trotzdem buchen“',await dlgText());
await p.fill('#dlgForm [name=qty]','1,5');await submit();
ok(!(await dlgOpen()) && Math.abs(await st()-(s0-1.5))<1e-9,'valid Entnahme 1,5 booked after correcting',await st());
await ev(()=>moveDlg('waste:pork'));await p.fill('#dlgForm [name=qty]','999');await submit();
ok(await dlgOpen(),'Schwund > Bestand blocked'); await p.click('#mvForce');await p.waitForTimeout(200);
ok(!(await dlgOpen()) && await st()<0,'explicit „Trotzdem buchen“ books',await st());
ok(/Bestand jetzt/.test(await toastT()),'toast names the negative stock',await toastT());
await ev(()=>{const m=S.moves[0];undoMove(m);save()});
// negative / invalid qty
await ev(()=>moveDlg('in:pork'));await p.fill('#dlgForm [name=qty]','-2');await submit(); ok(await dlgOpen()&&await p.locator('#dlgForm .f-err').count()===1,'Wareneingang −2 blocked with hint');
await p.fill('#dlgForm [name=qty]','abc');await submit(); ok(await dlgOpen(),'Wareneingang abc blocked');
ok(/^\d+,\d\d$/.test(await p.inputValue('#mvPrice')),'Wareneingang price German (no raw 13.2)',await p.inputValue('#mvPrice'));
// 13 future date
await p.fill('#dlgForm [name=qty]','2');await ev(()=>{document.querySelector('#dlgForm [name=date]').removeAttribute('max');document.querySelector('#dlgForm [name=date]').value=addDays(todayStr(),5)});await submit();
ok(await dlgOpen() && /Zukunft/.test(await dlgText()),'date 5 days ahead rejected',(await dlgText()).slice(-160));
await ev(()=>{document.querySelector('#dlgForm [name=date]').value=addDays(todayStr(),-40)});await submit(); ok(!(await dlgOpen()),'past date accepted');
// 13 sorted by date desc
await ev(()=>{view.stab='buchungen';view.mtype='all';go('stock')});await p.waitForTimeout(200);
const dates=await ev(()=>[...document.querySelectorAll('.moves > li .mv-d')].map(x=>x.textContent.split('.').reverse().join('')));
ok(dates.every((d,i)=>i===0||dates[i-1]>=d),'Buchungen sorted by date desc',dates.slice(0,6));
ok(await ev(()=>{const a=priceHistory('pork');const m=movesByDate().filter(m=>m.pid==='pork'&&m.type==='in');return a[0]===m[0].price && m.every((x,i)=>i===0||m[i-1].date>=x.date)}),'priceHistory uses latest by date');
ok(await ev(()=>!!document.querySelector('.moves [data-act=moveUndo] svg path[d^="M9 14"]')),'storno has its own undo icon');
// ---------- 5 + 12 Verkäufe
await ev(()=>salesDlg());await p.waitForTimeout(200);
ok(await p.locator('#dlgForm input[name=demoSales]').count()===2,'first real booking asks about demo sales');
ok(await ev(()=>[...document.querySelectorAll('#dlg .sales li span:first-child')].some(s=>/Wiener Schnitzel · vom (Schwein|Kalb)/.test(s.textContent))),'sales dialog shows variant label');
await submit(); ok(await dlgOpen(),'zero portions: stays open');
await p.click('#dlgForm label.tog:has(input[value=keep])');await submit();
ok(/Noch keine Portionen/.test(await dlgText()),'zero-portion hint',(await dlgText()).slice(-120));
const idx=await ev(()=>[...document.querySelectorAll('#dlg .sales li')].findIndex(l=>/vom Schwein/.test(l.textContent)));
const inp=p.locator('#dlg .sales input').nth(idx);
await inp.fill('500');await submit();
ok(await dlgOpen() && /Bestand reicht nicht/.test(await dlgText()) && await p.locator('#salesForce').count()===1,'sale exceeding stock blocked with list');
const before=await ev(()=>({pork:+P('pork').stock,fries:+P('fries').stock,moves:S.moves.length,day:JSON.stringify(S.salesDays[todayStr()]||null),days:Object.keys(S.salesDays).length}));
await inp.fill('4');await submit();
ok(!(await dlgOpen()),'4 portions booked'); ok(/4 Portionen gebucht/.test(await toastT()),'toast',await toastT());
const after=await ev(()=>({pork:+P('pork').stock,moves:S.moves.length,day:S.salesDays[todayStr()],grp:[...new Set(S.moves.filter(m=>m.type==='sale').map(m=>m.grp))],groups:S.saleGroups,demo:S.salesDemo,days:Object.keys(S.salesDays).length}));
ok(after.pork<before.pork && after.grp.length===1 && after.grp[0],'all ingredient moves share one group id',after.grp);
ok(after.demo===true && after.days===before.days+ (before.day==='null'?1:0),'demo sales kept as chosen');
const mid=await ev(()=>S.menu.find(m=>m.vlabel==='vom Schwein').id);
ok(after.day.some(r=>r[0]===mid&&r[1]===4),'revenue row in salesDays',after.day);
await ev(()=>{view.stab='buchungen';go('stock')});await p.waitForTimeout(200);
ok(await p.locator('.moves li.mv-grp').count()===1,'booking shown as ONE row'); ok(/4 Portionen/.test(await p.locator('.moves li.mv-grp').first().innerText()),'row says 4 Portionen');
await p.locator('.moves li.mv-grp [data-act=moveUndo]').click();await p.waitForTimeout(200);
ok(/Verkaufsbuchung .* komplett stornieren/.test(await dlgText()) && /Umsatz/.test(await dlgText()),'storno confirm names whole booking',await dlgText());
await submit();
const und=await ev(()=>({pork:+P('pork').stock,fries:+P('fries').stock,moves:S.moves.length,day:JSON.stringify(S.salesDays[todayStr()]||null),sale:S.moves.filter(m=>m.type==='sale').length,groups:Object.keys(S.saleGroups).length}));
ok(Math.abs(und.pork-before.pork)<1e-9 && Math.abs(und.fries-before.fries)<1e-9 && und.moves===before.moves && und.sale===0,'storno reverses ALL ingredient moves',und);
ok(und.day===before.day && und.groups===0,'storno removes revenue from salesDays',und.day);
// demo delete choice
await ev(()=>salesDlg());await p.waitForTimeout(200);await p.click('#dlgForm label.tog:has(input[value=del])');await p.locator('#dlg .sales input').nth(idx).fill('1');await submit();
ok(await ev(()=>S.salesDemo===false && Object.keys(S.salesDays).length===1),'„Demo-Verkäufe löschen“ leaves only the real day',await ev(()=>Object.keys(S.salesDays)));
await ev(()=>salesDlg());await p.waitForTimeout(200);ok(await p.locator('#dlgForm input[name=demoSales]').count()===0,'no demo question once demo sales are gone');await ev(()=>$('#dlg').close());
await L.done(b,errs);})();
