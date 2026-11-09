/* =====================================================================
   Rezept-Labor: aus ein paar Zutaten Rezeptideen entwickeln.
   Stufe B: eingebauter Beispiel-Generator (ohne KI, ohne Schlüssel).
   Später: labGenerate() ruft eine Cloud-Funktion mit KI auf; Antwortformat
   ist dasselbe ({name, desc, portionG, items:[{name,qty,unit}], steps:[]}).
   ===================================================================== */
ICO.labor = '<path d="M9 3h6M10 3v6.5L4.6 18.2A1.8 1.8 0 0 0 6.2 21h11.6a1.8 1.8 0 0 0 1.6-2.8L14 9.5V3"/><path d="M7.5 15h9"/>';
TABS.push(['labor','Rezept-Labor','Labor']);
(NAV_GROUPS.find(g => g[0]==='Küche') || NAV_GROUPS[0])[1].push('labor');
WOZU.labor = 'Zutaten eingeben, Rahmen setzen, Vorschläge mit Wareneinsatz und Allergenen bekommen.';

const LAB_TYPES = [['vor','Vorspeise'],['haupt','Hauptspeise'],['dessert','Dessert'],['special','Special']];
const LAB_STYLES = [['tirol','Tirolerisch'],['modern','Modern'],['huette','Hüttenküche']];
const LAB_DIETS = [['','alles'],['veg','vegetarisch'],['vegan','vegan']];
function labState(){ if(!view.lab) view.lab = {ings:[], type:'haupt', style:'tirol', diet:'', fcMax:+S.settings.target||28, price:'', season:'', res:null, seed:0, busy:false}; return view.lab; }

/* ---------- Rollen und Mengen ---------- */
const LAB_ROLES = [
  ['fish', /lachs|forelle|saibling|zander|fisch|garnele|sardell|thunfisch/],
  ['meat', /rind|kalb|schwein|hendl|huhn|pute|\bente|lamm|wild|hirsch|reh|speck|schinken|wurst|leber|beuschel|faschiert|tafelspitz|wange|filet|rücken|ruecken|kotelett|bratl/],
  ['cheese', /käse|kaese|parmesan|mozzarella|feta|ricotta|topfen|burrata/],
  ['dairy', /sahne|obers|rahm|milch|joghurt|butter|crème|creme|mascarpone/],
  ['egg', /\bei\b|eier|ei m|eigelb|wachtel/],
  ['starch', /kartoffel|erdäpfel|erdapfel|knödel|knoedel|nudel|pasta|spätzle|spaetzle|\breis|risotto|polenta|brot|semmel|mehl|teig|gnocchi|rösti|roesti/],
  ['fruit', /apfel|birne|beere|preiselbeer|marille|zwetsch|kirsch|feige|quitte|zitrone|orange|holunder|rhabarber/],
  ['nut', /nuss|walnuss|haselnuss|mandel|pinien|kürbiskern|kuerbiskern|pistazie/],
  ['herb', /petersilie|schnittlauch|kerbel|dill|thymian|rosmarin|salbei|basilikum|kresse|minze|bärlauch|baerlauch/],
  ['veg', /.*/]
];
const LAB_QTY = {
  vor:    {fish:80, meat:80, cheese:35, dairy:30, egg:1, starch:50, fruit:30, nut:12, herb:3, veg:90},
  haupt:  {fish:170, meat:190, cheese:45, dairy:40, egg:1, starch:170, fruit:35, nut:15, herb:4, veg:130},
  special:{fish:160, meat:180, cheese:40, dairy:40, egg:1, starch:150, fruit:35, nut:15, herb:4, veg:120},
  dessert:{fish:0, meat:0, cheese:60, dairy:80, egg:1, starch:60, fruit:120, nut:20, herb:2, veg:60}
};
function labRole(name){ const n = String(name).toLowerCase(); return (LAB_ROLES.find(([,re]) => re.test(n)) || ['veg'])[0]; }
function labFind(re){ return S.products.find(p => re.test(p.name.toLowerCase())); }
function labIngName(x){ const r = x.ref ? refObj(x.ref) : null; return r ? r.o.name : x.name; }

function labDemo(p, variant){
  const T = LAB_QTY[p.type] || LAB_QTY.haupt;
  let ings = p.ings.map(x => ({...x, name: labIngName(x), role: labRole(labIngName(x))}));
  if(p.diet) ings = ings.filter(x => !['meat','fish'].includes(x.role));
  if(p.diet === 'vegan') ings = ings.filter(x => !['cheese','dairy','egg'].includes(x.role));
  if(!ings.length) return null;
  const rot = (a, k) => a[(k % a.length + a.length) % a.length];
  const k = variant + (p.seed||0);
  const items = ings.map(x => { const r = x.ref ? refObj(x.ref) : null; const stk = r && r.t==='p' && r.o.unit === 'Stk';
    let q = stk ? Math.max(1, T[x.role] && x.role==='egg' ? 1 : 1) : (T[x.role] || 60);
    if(p.cheaper && (x.role==='meat' || x.role==='fish' || x.role==='cheese' || x.role==='nut')) q = Math.round(q * .75);
    return {name:x.name, ref:x.ref||'', qty: stk ? q : Math.round(q/5)*5 || q, unit: stk ? 'Stk' : 'g', role:x.role}; });
  const has = r => items.some(i => i.role === r);
  const addP = (re, q, role) => { const pr = labFind(re); if(pr && !items.some(i => i.ref === 'p:'+pr.id)) items.push({name:pr.name, ref:'p:'+pr.id, qty: pr.unit==='Stk' ? 1 : q, unit: pr.unit==='Stk' ? 'Stk' : 'g', role}); };
  // Beilage ergänzen, wenn keine Stärke dabei ist
  if(p.type !== 'dessert' && !has('starch')){
    const sides = p.style === 'modern' ? [/polenta|risotto|gnocchi/, /kartoffel|erdäpfel/, /brot|baguette/] : [/knödel|knoedel|semmel/, /kartoffel|erdäpfel/, /spätzle|spaetzle|mehl glatt/];
    addP(rot(sides, k), p.type==='vor' ? 40 : (p.cheaper ? 200 : 160), 'starch');
  }
  if(p.type === 'dessert'){ if(p.diet !== 'vegan') addP(/^butter/, 20, 'dairy'); addP(/zucker/, 25, 'veg'); if(!has('dairy') && p.diet !== 'vegan') addP(/obers|sahne|schlag/, 60, 'dairy'); }
  else { addP(/zwiebel/, p.type==='vor' ? 15 : 30, 'veg'); addP(p.diet==='vegan' ? /öl|oel|rapsöl|olivenöl/ : (p.style==='modern' ? /olivenöl|öl/ : /^butter|butterschmalz/), 12, 'dairy'); addP(/^salz/, 3, 'herb'); addP(/pfeffer/, 1, 'herb'); if(!has('herb')) addP(/schnittlauch|petersilie/, 3, 'herb'); }

  const main = (p.type==='dessert' ? ings.find(x => x.role==='fruit') : null) || ings.find(x => ['meat','fish'].includes(x.role)) || ings.find(x=>x.role==='veg') || ings.find(x => x.role==='cheese') || ings[0];
  const animal = ['meat','fish'].includes(main.role);
  const others = ings.filter(x => x !== main).map(x => x.name);
  const tech = !animal && p.type !== 'dessert' ? ({
    haupt: [['aus dem Ofen','Im Ofen geröstet, bis die Ränder karamellisieren'], ['gebraten','In der Pfanne goldbraun gebraten'], ['als Gröstl','In der Eisenpfanne zum Gröstl geröstet']],
    special:[['in Nussbutter','In schäumender Nussbutter glasiert'], ['vom Grill','Über der Glut gegrillt'], ['aus dem Ofen','Im Ofen geröstet und glasiert']],
    vor:   [['lauwarm','Lauwarm angerichtet mit Vinaigrette'], ['gratiniert','Kurz unter dem Salamander gratiniert'], ['als Salat','Roh und gebraten als Salat kombiniert']]
  })[p.type] || [] : {
    haupt: [['geschmort','Langsam geschmort, bis es weich ist'], ['rosa gebraten','Kurz und kräftig angebraten, im Ofen rosa gezogen'], ['aus dem Ofen','Im Ofen gegart und zum Schluss gratiniert']],
    special:[['vom Grill','Über der Glut gegrillt'], ['in Nussbutter','In schäumender Nussbutter glasiert'], ['geschmort','Mit Wurzelgemüse geschmort']],
    vor:   [['als Carpaccio','Hauchdünn aufgeschnitten und mariniert'], ['lauwarm','Lauwarm angerichtet mit Vinaigrette'], ['als Tatar','Fein geschnitten und abgeschmeckt']],
    dessert:[['als Schmarrn','Locker gebacken und gezupft'], ['als Parfait','Halbgefroren mit Fruchtragout'], ['im Strudelteig','Im knusprigen Teig gebacken']]
  }[p.type] || [];
  const [tn, td] = rot(tech, k);
  const join = a => a.length > 1 ? a.slice(0,-1).join(', ') + ' & ' + a[a.length-1] : (a[0] || '');
  const name = p.style === 'modern' ? [main.name, ...others].slice(0,3).join(' | ') + (tn ? ' · ' + tn : '')
    : p.style === 'huette' ? `${main.name} ${tn}${others.length ? ' mit ' + join(others.slice(0,2)) : ''}, wie auf der Alm`
    : `${main.name} ${tn}${others.length ? ' mit ' + join(others.slice(0,3)) : ''}`;
  const desc = `${td}. ${others.length ? 'Dazu ' + join(others) + '.' : ''} ${p.season ? 'Passt in die Saison ' + seasonName(p.season) + '.' : ''}`.replace(/\s+/g,' ').trim();
  const iN = r => items.filter(i => i.role === r).map(i => i.name);
  const steps = (p.type === 'dessert' ? [
      `${join(iN('fruit')) || 'Obst'} putzen, schneiden und mit etwas Zucker leicht einkochen.`,
      `${tn==='als Schmarrn' ? 'Teig aus Mehl, Milch und Eiern glatt rühren, in Butter backen, wenden und zerreißen.' : tn==='als Parfait' ? 'Eigelb und Zucker über Dampf schaumig schlagen, Obers unterheben, in Formen frieren.' : 'Füllung in Strudelteig einschlagen, mit Butter bestreichen und bei 190 °C goldbraun backen.'}`,
      `${iN('nut').length ? join(iN('nut')) + ' rösten und hacken. ' : ''}Anrichten und sofort servieren.`]
    : [
      `${main.name} parieren, portionieren und würzen.${p.type==='vor' ? '' : ' Mise en place für die Beilage vorbereiten.'}`,
      `${td} (${main.name}).`,
      `${join(iN('veg').filter(n => n !== main.name)) || 'Gemüse'} schneiden und in ${p.diet==='vegan' ? 'Öl' : 'Butter'} kurz anschwitzen.`,
      iN('starch').length ? `${join(iN('starch'))} zubereiten und warm halten.` : '',
      `${iN('nut').length ? join(iN('nut')) + ' rösten. ' : ''}${iN('cheese').length ? join(iN('cheese')) + ' zum Schluss darüber geben. ' : ''}Abschmecken, anrichten${iN('herb').length ? ', mit ' + join(iN('herb').filter(n=>!/salz|pfeffer/i.test(n))) + ' vollenden' : ''}.`
    ]).filter(Boolean).map(s => s.replace(/,\s*vollenden/, ' vollenden').replace(/mit\s+vollenden/, 'vollenden'));
  return {name: name.charAt(0).toUpperCase() + name.slice(1), desc, portionG: items.filter(i=>i.unit==='g').reduce((s,i)=>s+i.qty,0), items: items.map(({name,ref,qty,unit}) => ({name,ref,qty,unit})), steps, demo:true};
}

/* Schnittstelle für später (KI über Cloud-Funktion). Jetzt: Beispiel-Generator. */
async function labGenerate(p){
  await new Promise(r => setTimeout(r, 450)); // kurze „Denkpause“, damit es nicht wie ein Zufallsknopf wirkt
  return [0,1,2].map(v => labDemo(p, v)).filter(Boolean);
}

/* ---------- Auswerten mit echten Preisen ---------- */
function labEval(rec, p){
  const items = rec.items.map(i => { let ref = i.ref; if(!ref){ const m = plMatch(i.name, ''); if(m) ref = 'p:' + m.id; } return {...i, ref}; });
  const tmp = {id:'lab_tmp', type:'dish', items: items.filter(i => i.ref).map(i => ({ref:i.ref, qty:i.qty, net:''}))};
  const t = totals(tmp); const missing = items.filter(i => !i.ref);
  const demoP = items.filter(i => i.ref && refObj(i.ref)?.o.priceDemo).length;
  const vat = +S.settings.vat || 10, fcMax = +p.fcMax || 28;
  const sugg = t.cost && !missing.length ? Math.ceil(t.cost / (fcMax/100) * (1 + vat/100)) - 0.10 : null;
  const price = +p.price || (sugg && sugg > 0 ? sugg : null);
  const fc = price && !missing.length ? t.cost / (price / (1 + vat/100)) * 100 : null;
  return {items, t, missing, demoP, price, sugg, fc};
}

function renderLabor(){
  const L = labState();
  const opts = (list, v) => list.map(([k,l]) => `<option value="${k}" ${k===v?'selected':''}>${l}</option>`).join('');
  const chipsHtml = L.ings.map((x,i) => { const r = x.ref ? refObj(x.ref) : null; return `<span class="lab-ing ${r?'':'free'}">${esc(labIngName(x))}${r ? '' : '<small title="Noch kein Produkt in der App: ohne Preis, wird beim Übernehmen neu angelegt">neu</small>'}<button type="button" data-act="labDel" data-id="${i}" aria-label="${esc(labIngName(x))} entfernen">${ico('x')}</button></span>`; }).join('');
  const pickHtml = L.pick ? `<div class="lab-pick" role="group" aria-label="Zutat auswählen"><span class="muted sm">„${esc(L.pick.v)}“ passt zu mehreren Produkten:</span>${L.pick.list.map(m => `<button type="button" class="chip" data-act="labPick" data-id="${esc(m.ref)}">${esc(m.name)}</button>`).join('')}<button type="button" class="chip lab-new" data-act="labPick" data-id="">„${esc(L.pick.v)}“ als neue Zutat</button></div>` : '';
  const dl = [...S.products].sort(byName).map(p => `<option value="${esc(p.name)}">`).join('') + S.cards.filter(c=>c.type==='semi').map(c=>`<option value="${esc(c.name)}">`).join('');
  const res = L.res;
  const card = (rec, i) => { const e = labEval(rec, L);
    return `<article class="lab-card">
      <div class="lab-ch"><span class="eyebrow">Idee ${i+1}${rec.demo ? ' · Beispiel' : ''}</span><h3>${esc(rec.name)}</h3><p>${esc(rec.desc)}</p></div>
      <div class="lab-kpi"><span><b>${e.missing.length ? 'ab ' : ''}${eur(e.t.cost)}</b><small>Wareneinsatz${e.missing.length ? ' (unvollständig)' : ''}</small></span><span><b>${e.price ? eur(e.price) : '—'}</b><small>${+L.price ? 'Ihr Preis' : `Preis für ${num(+L.fcMax)} %`}</small></span><span><b class="${fcClass(e.fc)}-t">${e.fc!=null ? num(e.fc,1)+' %' : '—'}</b><small>WE-Quote</small></span></div>
      <ul class="lab-items">${e.items.map(it => { const r = it.ref ? refObj(it.ref) : null; return `<li class="${r?'':'miss'}"><span>${esc(r ? r.o.name : it.name)}${r && r.o.priceDemo ? ' <i class="ti-flag">Richtwert</i>' : ''}${r ? '' : ' <i class="ti-flag bad">neu, ohne Preis</i>'}</span><b class="mono">${num(it.qty)} ${esc(it.unit)}</b></li>`; }).join('')}</ul>
      ${e.missing.length ? `<p class="hint">${e.missing.length} Zutat${e.missing.length>1?'en':''} noch ohne Preis, nicht im Wareneinsatz. Beim Übernehmen werden sie als Produkte angelegt und erscheinen im Preis-Check.</p>` : ''}
      <div class="lab-alg"><span class="muted sm">Allergene</span>${e.t.alg.size ? chips(e.t.alg) : '<span class="muted sm">keine erfasst</span>'}</div>
      <details class="lab-steps"><summary>Zubereitung (${rec.steps.length} Schritte)</summary><ol>${rec.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></details>
      <div class="lab-acts"><button type="button" class="btn sm" data-act="labMod" data-id="cheaper">Günstiger</button>${L.diet ? '' : '<button type="button" class="btn sm" data-act="labMod" data-id="veg">Vegetarisch</button>'}<button type="button" class="btn sm" data-act="labMod" data-id="other">Andere Variante</button><span class="sp"></span><button type="button" class="btn primary sm" data-act="labTake" data-id="${i}">${ico('plate')}Als Rezeptur übernehmen</button></div>
    </article>`; };
  return `<div class="page-h"><div><div class="eyebrow">Küche · Ideen</div><h1>Rezept-Labor</h1></div></div>
  <div class="lab">
    <section class="panel lab-form">
      <div class="panel-h"><h2>1 · Zutaten</h2><span class="muted sm">${L.ings.length} gewählt</span></div>
      <div class="lab-ings">${chipsHtml || '<span class="muted sm">Noch keine Zutat. Zwei bis vier reichen.</span>'}</div>
      <label class="search lab-in">${ico('search')}<input id="labIn" list="labDl" placeholder="Zutat eingeben, Enter" autocomplete="off" aria-label="Zutat eingeben"></label><datalist id="labDl">${dl}</datalist>${pickHtml}
      <p class="hint lab-hint">Teile des Namens genügen („Speck“ findet „Tiroler Speck g.g.A.“). Unbekannte Zutaten sind erlaubt und als <b>neu</b> markiert.</p>
      <div class="panel-h" style="margin-top:18px"><h2>2 · Rahmen</h2></div>
      <div class="lab-grid">
        <label class="f">Gang<select data-lab="type">${opts(LAB_TYPES, L.type)}</select></label>
        <label class="f">Stil<select data-lab="style">${opts(LAB_STYLES, L.style)}</select></label>
        <label class="f">Ernährung<select data-lab="diet">${opts(LAB_DIETS, L.diet)}</select></label>
        <label class="f">Saison<select data-lab="season"><option value="">egal</option>${opts(SEASONS, L.season)}</select></label>
        <label class="f">Ziel-Wareneinsatz<span class="qty"><input class="num-in" data-lab="fcMax" data-num="req" data-min="5" data-max="90" data-msg="Ziel-Wareneinsatz zwischen 5 und 90 %, nicht geändert" type="text" inputmode="decimal" value="${numIn(L.fcMax)}"><em>%</em></span></label>
        <label class="f">Verkaufspreis (optional)<span class="qty"><input class="num-in" data-lab="price" data-num="price" type="text" inputmode="decimal" value="${numIn(L.price)}" placeholder="frei"><em>€</em></span></label>
      </div>
      <button type="button" class="btn primary lab-go" data-act="labGen" ${L.ings.length && !L.busy ? '' : 'disabled aria-disabled="true"'}>${ico('labor')}${L.busy ? 'Ideen werden entwickelt …' : 'Rezepte erfinden'}</button>${L.ings.length ? '' : '<p class="hint lab-hint">Zuerst mindestens eine Zutat eingeben.</p>'}
      <p class="hint">Beispielgenerator ohne KI. Mit KI-Schlüssel in der Cloud kommen echte Vorschläge, gerechnet wird gleich.</p>
    </section>
    <div class="lab-res">${res ? (res.length ? res.map(card).join('') : emptyHtml('labor','Keine Idee möglich','Mit dieser Ernährungsform bleibt keine Zutat übrig. Andere Zutaten wählen.')) : emptyHtml('labor','Noch keine Vorschläge','Zutaten wählen und „Rezepte erfinden“ drücken.')}</div>
  </div>`;
}

async function labRun(){ const L = labState(); L.busy = true; render(); try { L.res = await labGenerate(L); } finally { L.busy = false; render(); } }
/* Produkte und Basisrezepte zum eingetippten Wort: genauer Name, Namensanfang, Wortanfang, Teil des Namens */
function labMatches(v){
  const q = normName(v); if(!q) return [];
  const pool = [...S.products.filter(p => !p.noStock || p.id !== 'water').map(p => ({ref:'p:'+p.id, name:p.name})), ...S.cards.filter(c => c.type==='semi').map(c => ({ref:'c:'+c.id, name:c.name}))];
  const out = [];
  for(const x of pool){ const n = normName(x.name); if(!n) continue; let sc = 9;
    if(n === q) sc = 0; else if(n.startsWith(q + ' ') || n.startsWith(q)) sc = 1; else if(n.split(' ').some(w => w.startsWith(q))) sc = 2; else if(q.length >= 3 && n.includes(q)) sc = 3;
    if(sc < 9) out.push({...x, sc}); }
  if(!out.length){ const m = plMatch(v, ''); if(m) out.push({ref:'p:'+m.id, name:m.name, sc:4}); }
  return out.sort((a,b) => a.sc - b.sc || a.name.length - b.name.length || a.name.localeCompare(b.name,'de'));
}
function labPush(ing, note){ const L = labState(); L.pick = null; if(ing.ref && L.ings.some(x => x.ref === ing.ref)){ render(); toast('Diese Zutat ist schon gewählt'); } else { L.ings.push(ing); render(); if(note) toast(note); } setTimeout(() => $('#labIn')?.focus(), 20); }
function labAddFromInput(){
  const inp = $('#labIn'); if(!inp) return; const v = inp.value.trim(); if(!v) return; const L = labState();
  const ms = labMatches(v); const exact = ms.filter(m => m.sc === 0);
  if(exact.length === 1 || ms.length === 1){ const m = exact[0] || ms[0]; return labPush({ref:m.ref}, m.sc ? `„${v}“ → ${m.name}` : ''); }
  if(ms.length > 1){ L.pick = {v, list: ms.slice(0, 8)}; render(); setTimeout(() => document.querySelector('.lab-pick .chip')?.focus(), 20); return; }
  labPush({name: v}, `„${v}“ ist neu: kein Produkt mit diesem Namen, vorerst ohne Preis`);
}
function labTake(i, sure){
  const L = labState(); const rec = L.res && L.res[i]; if(!rec) return; const e = labEval(rec, L);
  // neue Produkte nicht stillschweigend anlegen: erst zeigen und fragen
  if(e.missing.length && !sure){ openDialog('Neue Produkte anlegen?', `<p class="dlg-p">Für „${esc(rec.name)}“ ${e.missing.length === 1 ? 'gibt es eine Zutat' : `gibt es ${e.missing.length} Zutaten`} noch nicht als Produkt. Beim Übernehmen ${e.missing.length === 1 ? 'wird sie' : 'werden sie'} neu angelegt, ohne Preis, und ${e.missing.length === 1 ? 'erscheint' : 'erscheinen'} im Preis-Check:</p><ul class="plist">${e.missing.map(m => `<li><span>${esc(m.name)}</span><b class="mono">${num(m.qty)} ${esc(m.unit)}</b></li>`).join('')}</ul><p class="hint">Gibt es die Zutat schon unter anderem Namen, brechen Sie ab und wählen Sie im Labor das vorhandene Produkt.</p>`, () => { setTimeout(() => labTake(i, true), 0); }, {ok: e.missing.length === 1 ? 'Produkt anlegen und übernehmen' : `${e.missing.length} Produkte anlegen und übernehmen`, toast:false}); return; }
  const items = e.items.map(it => { if(it.ref) return {ref:it.ref, qty:it.qty, net:''};
    const p = {id:uid('p'), name:it.name, unit: it.unit==='Stk' ? 'Stk' : 'kg', price:0, priceDemo:true, lossCold:0, lossHot:0, alg:'', pieceG:'', stock:0, minStock:0, loc:'L', supplier:'', artNo:'', pack:'', packQty:0};
    S.products.push(p); return {ref:'p:'+p.id, qty:it.qty, net:''}; });
  const cat = {vor:'Suppen & Vorspeisen', haupt:'Klassiker', dessert:'Süßes', special:'Specials'}[L.type] || '';
  const c = {id:uid('dish'), no:S.settings.nextNo++, name:rec.name, type:'dish', category:cat, yieldG:'', img:'', portionG: rec.portionG || '', note: rec.desc, steps: rec.steps.map(t => ({t, img:''})), items, fromLab:true};
  S.cards.push(c); save(); go('cards', c.id); toast('Rezeptur angelegt: jetzt am Teller verfeinern');
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const a = el.dataset.act, id = el.dataset.id; if(!a.startsWith('lab')) return;
  const L = labState();
  if(a === 'labDel'){ L.ings.splice(+id, 1); L.pick = null; render(); }
  if(a === 'labPick'){ const v = L.pick ? L.pick.v : ''; if(id) labPush({ref:id}); else if(v) labPush({name:v}, `„${v}“ ist neu, vorerst ohne Preis`); }
  if(a === 'labGen'){ L.seed = 0; L.cheaper = false; labRun(); }
  if(a === 'labMod'){ if(id === 'cheaper') L.cheaper = true; if(id === 'veg') L.diet = 'veg'; if(id === 'other') L.seed = (L.seed||0) + 1; labRun(); }
  if(a === 'labTake') labTake(+id);
});
document.addEventListener('keydown', e => { if(e.target.id === 'labIn' && e.key === 'Enter'){ e.preventDefault(); labAddFromInput(); } });
document.addEventListener('change', e => {
  const t = e.target; if(t.id === 'labIn'){ if(S.products.some(p => p.name === t.value) || S.cards.some(c => c.name === t.value)) labAddFromInput(); return; }
  if(!t.dataset || !t.dataset.lab) return; const L = labState(); L[t.dataset.lab] = t.value; if(L.res) labRun(); else if(t.classList.contains('num-in')) softRender();
});
