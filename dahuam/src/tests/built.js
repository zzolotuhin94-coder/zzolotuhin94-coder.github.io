
'use strict';
const KEY = 'dahuam202_kueche_de_v1';
const FRAMED = (()=>{ try { return window.self !== window.top; } catch(e){ return true; } })();
const ALG = {A:'Gluten',B:'Krebstiere',C:'Ei',D:'Fisch',E:'Erdnuss',F:'Soja',G:'Milch/Laktose',H:'Schalenfrüchte',L:'Sellerie',M:'Senf',N:'Sesam',O:'Sulfite',P:'Lupinen',R:'Weichtiere'};

/* ---------- Demodaten ---------- */
function seedBase(){
  // [id, Name, Einheit, Preis € je Einheit exkl. MwSt., Putzverlust %, Garverlust %, Allergene, Gewicht 1 Stk g]
  const prods = [
    ['pork','Schweinerücken','kg',9.5,5,15,''],
    ['veal','Kalbsoberschale','kg',32,11,15,''],
    ['beef_goulash','Rindswadschinken (Gulasch)','kg',14,11,35,''],
    ['beef_mince','Rindsfaschiertes','kg',13,0,20,''],
    ['speck','Tiroler Speck g.g.A.','kg',19.5,5,20,''],
    ['flour','Mehl glatt','kg',0.9,0,0,'A'],
    ['egg','Ei M','Stk',0.28,12,0,'C',60],
    ['quail','Wachtelei','Stk',0.35,12,0,'C',10],
    ['crumbs','Semmelbrösel','kg',2.5,0,0,'A'],
    ['schmalz','Butterschmalz','kg',11,0,0,'G'],
    ['fries','Pommes frites TK','kg',2.2,0,20,''],
    ['lemon','Zitrone','Stk',0.35,0,0,'',110],
    ['cranberry','Preiselbeeren','kg',7,0,0,''],
    ['parsley','Petersilie','kg',12,30,0,''],
    ['milk','Vollmilch 3,5 %','l',1.1,0,0,'G'],
    ['cream','Schlagobers 36 %','l',4.5,0,0,'G'],
    ['butter','Butter','kg',8.5,0,0,'G'],
    ['cremefr','Crème fraîche','kg',6,0,0,'G'],
    ['parmesan','Parmesan','kg',22,0,0,'G'],
    ['bergkase','Zillertaler Bergkäse','kg',18,8,0,'G'],
    ['emmental','Emmentaler','kg',12,3,0,'G'],
    ['cheddar','Cheddar','kg',14,0,0,'G'],
    ['sugar','Kristallzucker','kg',1.0,0,0,''],
    ['icing','Staubzucker','kg',1.6,0,0,''],
    ['raisins','Rosinen (geschwefelt)','kg',6,0,0,'O'],
    ['applesauce','Apfelmus','kg',3,0,0,''],
    ['blueberry','Heidelbeeren TK','kg',9,0,0,''],
    ['apples','Äpfel','kg',1.8,28,0,''],
    ['strudel_dough','Strudelteig','kg',6,0,0,'A'],
    ['cinnamon','Zimt gemahlen','kg',20,0,0,''],
    ['onion','Zwiebel','kg',1.2,12,0,''],
    ['red_onion','Rote Zwiebel','kg',1.8,12,0,''],
    ['spring','Frühlingszwiebel','kg',6,15,0,''],
    ['garlic','Knoblauch','kg',8,15,0,''],
    ['potato','Kartoffeln','kg',0.9,20,0,''],
    ['romaine','Römersalat','kg',4.5,20,0,''],
    ['passata','Tomaten passiert','kg',2.2,0,0,''],
    ['tomato_paste','Tomatenmark','kg',4,0,0,''],
    ['capers','Kapern','kg',14,0,0,''],
    ['pickles','Mixed Pickles','kg',6,0,0,'M O'],
    ['pesto','Basilikumpesto','kg',18,0,0,'G H'],
    ['mustard','Senf','kg',4,0,0,'M'],
    ['bbq','BBQ-Sauce','kg',6,0,0,'M O'],
    ['chutney','Tomatenchutney','kg',7,0,0,'O'],
    ['bread','Weißbrot / Baguette','kg',3.5,0,0,'A'],
    ['brioche','Brioche-Bun','Stk',0.85,0,0,'A C G',80],
    ['wine','Kochwein weiß, trocken','l',4,0,0,'O'],
    ['kirsch','Kirschwasser','l',25,0,0,''],
    ['starch','Maisstärke','kg',3,0,0,''],
    ['oil','Rapsöl','l',2.2,0,0,''],
    ['paprika','Paprikapulver edelsüß','kg',18,0,0,''],
    ['caraway','Kümmel','kg',15,0,0,''],
    ['salt','Salz','kg',0.5,0,0,''],
    ['pepper','Pfeffer schwarz gemahlen','kg',25,0,0,''],
    ['water','Wasser','l',0,0,0,''],
  ].map(([id,name,unit,price,lossCold,lossHot,alg,pieceG])=>({id,name,unit,price,lossCold,lossHot,alg,pieceG:pieceG||''}));

  const ref = k => (k.startsWith('semi_')?'c:':'p:')+k;
  // [id, Name, Typ, Kategorie, Ausbeute g, Zutaten, Zubereitung]
  const cards = [
    ['semi_flammdough','Flammkuchenteig','semi','Basisrezepte',1650,
      [['flour',1000],['water',600],['oil',80],['salt',20]],
      'Mehl, Salz, Wasser und Öl 8 Min. glatt kneten. 30 Min. abgedeckt bei +4 °C rasten lassen. In Portionen zu 200 g teilen. Haltbarkeit 48 h bei +2 bis +4 °C.'],
    ['semi_goulash','Gulaschsuppe, Basis (Charge)','semi','Basisrezepte',8000,
      [['beef_goulash',2000],['onion',1500],['oil',100],['paprika',80],['tomato_paste',80],['garlic',40],['caraway',10],['potato',1500],['water',4000],['salt',40],['pepper',5]],
      'Zwiebeln goldbraun rösten. Vom Herd nehmen, Paprikapulver und Tomatenmark einrühren, sofort mit etwas Wasser ablöschen. Rindfleisch in 1,5-cm-Würfeln, Kümmel und Knoblauch zugeben, 1,5 h schmoren. Kartoffelwürfel und restliches Wasser zugeben, 25 Min. köcheln. Salzen. Schockkühlen. Haltbarkeit 72 h.'],
    ['semi_caesar','Caesar-Dressing','semi','Basisrezepte',600,
      [['egg',3],['parmesan',80],['garlic',15],['lemon',1],['mustard',20],['oil',400],['salt',5],['pepper',2]],
      'Pasteurisiertes Eigelb mit Senf, Knoblauch und Zitronensaft mixen. Öl in dünnem Strahl zur Emulsion einarbeiten. Geriebenen Parmesan, Salz und Pfeffer zugeben. Haltbarkeit 24 h bei +2 bis +4 °C.'],
    ['semi_strudel','Apfelstrudel, Blech für 16 Portionen','semi','Basisrezepte',3000,
      [['strudel_dough',500],['apples',3000],['sugar',300],['cinnamon',10],['raisins',150],['crumbs',150],['butter',250]],
      'Äpfel schälen, blättrig schneiden, mit Zucker, Zimt und Rosinen mischen. Teig mit flüssiger Butter bestreichen, mit gerösteten Bröseln bestreuen, Fülle auflegen und einrollen. 40 Min. bei 180 °C backen, dabei mit Butter bestreichen.'],
    ['semi_blueberry','Heidelbeerkompott','semi','Basisrezepte',900,
      [['blueberry',800],['sugar',150],['water',100],['starch',15]],
      'Heidelbeeren mit Zucker und Wasser aufkochen. Mit in kaltem Wasser angerührter Stärke binden. Auskühlen lassen.'],

    ['dish_schnitzel_pork','Wiener Schnitzel vom Schwein mit Pommes','dish','Fondue & Hauptspeisen',470,
      [['pork',180],['flour',12],['egg',0.35],['crumbs',35],['schmalz',40],['fries',200],['lemon',0.25],['cranberry',30],['parsley',3],['salt',2]],
      'Fleisch auf 4 mm klopfen, salzen. In Mehl, Ei und Bröseln panieren, Panier nicht andrücken. In Butterschmalz bei 170 °C schwimmend herausbacken, Pfanne schwenken, damit die Panier souffliert, je Seite 2–3 Min. Anrichten mit Pommes, Zitronenspalte, Preiselbeeren und Petersilie.'],
    ['dish_schnitzel_veal','Wiener Schnitzel vom Kalb mit Pommes','dish','Fondue & Hauptspeisen',460,
      [['veal',170],['flour',12],['egg',0.35],['crumbs',35],['schmalz',40],['fries',200],['lemon',0.25],['cranberry',30],['parsley',3],['salt',2]],
      'Wie Schweinsschnitzel. Kalbfleisch vorsichtig zwischen Folie auf 4 mm klopfen.'],
    ['dish_fondue','Zillertaler Käsefondue (pro Person)','dish','Fondue & Hauptspeisen',700,
      [['bergkase',120],['emmental',80],['wine',100],['starch',8],['kirsch',20],['garlic',3],['bread',150],['potato',200],['pickles',80]],
      'Caquelon mit Knoblauch ausreiben. Wein aufkochen, geriebenen Käse unter Rühren in Achterform schmelzen. Stärke im Kirschwasser anrühren, einrühren und glatt erhitzen. Auf dem Rechaud servieren mit Brotwürfeln, Kartoffeln in der Schale und Mixed Pickles.'],
    ['dish_kaiser','Kaiserschmarrn mit Apfelmus und Heidelbeerkompott','dish','Desserts',480,
      [['flour',120],['milk',250],['egg',3],['sugar',25],['butter',30],['raisins',20],['icing',10],['applesauce',80],['semi_blueberry',60],['salt',1]],
      'Dotter mit Milch und Mehl glatt rühren, Eiklar mit Zucker und einer Prise Salz steif schlagen, unterheben. In die Pfanne mit geschmolzener Butter gießen, Rosinen darüberstreuen, unten anbacken. 6 Min. bei 180 °C im Rohr fertig backen. Mit zwei Spateln zerreißen, mit Staubzucker karamellisieren. Mit Apfelmus und Kompott servieren.'],
    ['dish_elsasser','Flammkuchen „Der Elsässer“','dish','Flammkuchen',380,
      [['semi_flammdough',150],['cremefr',80],['speck',60],['onion',50],['spring',15],['salt',1],['pepper',0.5]],
      'Teig dünn (2 mm) ausrollen, mit Crème fraîche bestreichen, salzen, pfeffern. Zwiebelringe und Speckstreifen verteilen. 6–8 Min. bei 300 °C backen. Mit Frühlingszwiebel bestreuen.'],
    ['dish_goulash','Gulaschsuppe mit Brot','dish','Suppen',360,
      [['semi_goulash',300],['bread',60]],
      'Portion Basis auf Kerntemperatur mindestens 75 °C regenerieren. Im tiefen Teller anrichten, Brot extra.'],
    ['dish_tomato','Fruchtige Tomatensuppe mit Crème fraîche und Pesto','dish','Suppen',330,
      [['passata',250],['onion',30],['oil',10],['sugar',5],['cream',30],['cremefr',20],['pesto',10],['salt',2]],
      'Zwiebel in Öl anschwitzen, Passata und Zucker zugeben, 15 Min. köcheln. Obers zugeben, pürieren, salzen. Mit einem Löffel Crème fraîche und Pestotupfen servieren.'],
    ['dish_caesar','Caesar Salat','dish','Salate & Bowls',300,
      [['romaine',150],['semi_caesar',50],['parmesan',15],['capers',10],['quail',3],['bread',40],['butter',10],['garlic',3]],
      'Brotwürfel in Butter mit Knoblauch rösten. Römersalat zupfen, mit Dressing marinieren. Anrichten, Croûtons, Kapern, halbierte Wachteleier und Parmesanspäne darauf.'],
    ['dish_strudel','Oma Lisl’s Apfelstrudel','dish','Desserts',185,
      [['semi_strudel',180],['icing',5]],
      'Portion 5 Min. bei 160 °C erwärmen, mit Staubzucker bestreuen.'],
    ['dish_burger','Wadel-Beißer-Burger','dish','Burger & Kebap',380,
      [['beef_mince',200],['brioche',1],['speck',30],['cheddar',30],['bbq',30],['red_onion',30],['romaine',20],['chutney',30],['salt',2],['pepper',0.5]],
      'Patty 200 g am Grill medium braten, zum Schluss mit Cheddar belegen. Speck knusprig braten. Bun an der Schnittfläche toasten. Aufbau: Boden, BBQ, Römersalat, Patty mit Käse, Speck, eingelegte rote Zwiebel, Chutney, Deckel.'],
  ].map(([id,name,type,category,yieldG,items,method],i)=>({id,no:i+1,name,type,category,yieldG,method,items:items.map(([k,q])=>({ref:ref(k),qty:q,net:''}))}));

  // Speisekarte laut dahuam202.at (Preise inkl. MwSt.)
  const M = [
    ['Flammkuchen','„Der Elsässer“','Klassisch mit Speck, Frühlingszwiebel und Zwiebel',13.90,'dish_elsasser'],
    ['Flammkuchen','„Die Gärtnerin“','Getrocknete Tomaten, heimischer Mozzarella, Rucola, Pesto',14.90],
    ['Flammkuchen','„Der Weiße“','Ziegenkäse, Thymian, Honig, Walnüsse',14.90],
    ['Flammkuchen','„Schwammerlsuche“','Frische Eierschwammerl, Tiroler Speck, Spinat, Kräuter-Mascarpone',17.50],
    ['Suppen','Fruchtige Tomatensuppe','Crème fraîche, Pesto',6.90,'dish_tomato'],
    ['Suppen','Kokos-Curry-Suppe','Mit gebackener Garnele',8.90],
    ['Suppen','Hausgemachte Gulaschsuppe','Mit Brot',7.90,'dish_goulash'],
    ['Suppen','Rindsuppe mit Frittaten','Kräuterfrittaten',6.50],
    ['Suppen','Rindsuppe mit Kaspressknödel','',6.80],
    ['Vorspeisen','DAHUAM.202 Knoblauchbrot','',5.20],
    ['Vorspeisen','„Vegan Dippin’“','Ganze Artischocke, Zitronenvinaigrette, Wasabi-Caesar-Dip',11.90],
    ['Vorspeisen','Tatar vom Tiroler Rind 130 g','Pikant mariniert, Toast, Butter',19.50],
    ['Vorspeisen','Tatar vom Tiroler Rind 180 g','Pikant mariniert, Toast, Butter',26.40],
    ['Vorspeisen','„Fabian’s Caprese“','Cremige Burrata, Tomatenchutney, marinierte Tomaten, Pesto',16.50],
    ['Vorspeisen','„Garnelen Pfandl“','Riesengarnelen, Aioli, asiatischer BBQ-Dip',21.20],
    ['Salate & Bowls','Caesar Salat','Römersalat, Parmesan-Dressing, Kapern, Wachtelei, Knoblauch-Croûtons',14.90,'dish_caesar'],
    ['Salate & Bowls','„Alpen Ceviche“','Roh marinierte Forelle mit Limette, Chili und Koriander',18.20],
    ['Salate & Bowls','Gerlos Bowl','Sushireis, Erdnuss-Limetten-Dressing, Avocado, Gurken-Kimchi, Edamame',18.90],
    ['Salate & Bowls','DAHUAM.202 Sommersalat','Hausgemachte Kaspressknödel, Kräuterdip, Radieschen',18.20],
    ['Salate & Bowls','Salatschüsserl mit Backhendl','Kürbiskernpanier, Kürbiskernöl',18.10],
    ['Salate & Bowls','Salatschüsserl mit Ziegenkäse','Gebackener Ziegenkäse, Marillenchutney, karamellisierte Nüsse',17.20],
    ['Salate & Bowls','Kebap Bowl','Reis, Eisberg, Hühner-Gyros, Joghurt-Knoblauch-Sauce, Feta',18.90],
    ['Fondue & Hauptspeisen','Zillertaler Käsefondue','Pro Person: Brot, Kartoffeln, hausgemachte Mixed Pickles',28.90,'dish_fondue'],
    ['Fondue & Hauptspeisen','Kalbsrahmgulasch','Hausgemachte Butterspätzle',20.90],
    ['Fondue & Hauptspeisen','Zillertaler Forelle „Müllerin“','Petersilkartoffeln, Mandelbutter',25.20],
    ['Fondue & Hauptspeisen','„Fish n’ Chips“','Kabeljau im Bierteig, Pommes, Coleslaw, Dip',24.20],
    ['Fondue & Hauptspeisen','„Veganista Couch Potato“','Süßkartoffel, Shakshuka, Kichererbsensalat, Tahini',18.50],
    ['Fondue & Hauptspeisen','Eierschwammerl Carbonara','Pasta, Eierschwammerl, Speck, Ei, Petersilie, Parmesan',18.90],
    ['Fondue & Hauptspeisen','„Wilde Bolo“','Spaghetti Bolognese vom Gerlosser Wild, Chili-Crunch',18.90],
    ['Fondue & Hauptspeisen','Original Wiener Tafelspitz','Nur sonntags',26.00],
    ['Fondue & Hauptspeisen','Bauernrösti','Tiroler Speck, Tomate, Bergkäse, Spiegelei',16.80],
    ['Fondue & Hauptspeisen','Dolce Vita Rösti','Mediterranes Gemüse, Babyspinat, getrocknete Tomaten, Burrata',18.90],
    ['Fondue & Hauptspeisen','Schwammerlrösti','Ayinger Weiderind, Eierschwammerl, Pfefferrahmsauce',24.50],
    ['Fondue & Hauptspeisen','Gerolltes Cordon bleu','Schweinerücken, Zillertaler Bergkäse, Bauernschinken, Pommes',23.20],
    ['Fondue & Hauptspeisen','Wiener Schnitzel vom Schwein','Mit Pommes',20.90,'dish_schnitzel_pork'],
    ['Fondue & Hauptspeisen','Wiener Schnitzel vom Kalb','Mit Pommes',28.90,'dish_schnitzel_veal'],
    ['Fondue & Hauptspeisen','„Hans-Wurst“','Drei Würste vom Kainzenhof, hausgemachte Dips, Pommes',18.30],
    ['Fondue & Hauptspeisen','Ripperl-Tower','Nur dienstags, pro Person',21.90],
    ['Fondue & Hauptspeisen','„Stück Fleisch“','230 g Filetsteak, Pfefferjus, Kräuterblütenbutter',41.50],
    ['Burger & Kebap','Alpen Kebap','Hühner-Gyros im Fladenbrot, Knoblauchdip, Salat, Tomate, Gurke',16.90],
    ['Burger & Kebap','Wadel-Beißer-Burger','100 % Rind, Brioche, Speck, Cheddar, BBQ, eingelegte Zwiebel',20.50,'dish_burger'],
    ['Burger & Kebap','DFC Burger','Fried Chicken, Korean BBQ, Gurken-Kimchi, Spicy Mayo, Erdnüsse',19.90],
    ['Desserts','„Dippin me softly!“','Milchschokolade-Nuss-Fondue mit Obst und Marshmallows, pro Person',10.50],
    ['Desserts','„Endless Summer“','Marinierte Erdbeeren, Cheesecake-Creme, Butterstreusel',8.50],
    ['Desserts','„Fabian’s Schokotraum“','Schokomousse in der Kaffeetasse',6.50],
    ['Desserts','Affogato','Espresso mit Vanilleeis',5.90],
    ['Desserts','„Marillenzeit = Knödelzeit“','Hausgemachte Marillenknödel mit Butterbröseln',9.50],
    ['Desserts','„Wir sind Kaiser!“','Kaiserschmarrn mit Apfelmus und Heidelbeerkompott',15.80,'dish_kaiser'],
    ['Desserts','Oma Lisl’s Apfelstrudel','Hausgemacht, warm serviert',5.40,'dish_strudel'],
    ['Desserts','„French Twist“','Vanille-Crème-brûlée',9.50],
    ['Desserts','Cookie Pfandl','Warmer Chocolate-Chip-Cookie, Vanilleeis',12.50],
    ['Desserts','„Say Cheese“','Antonias Auswahl an kleinen Käsen',10.90],
    ['Kindermenü','Nudelsuppe','',4.90],
    ['Kindermenü','Kinder-Hamburger mit Käse und Pommes','',12.50],
    ['Kindermenü','Kinderschnitzel mit Pommes','',12.50],
    ['Kindermenü','Kindersteak mit Pommes','',19.90],
    ['Kindermenü','„Würstlkrake“ mit Pommes','',8.20],
    ['Kindermenü','Chicken Nuggets mit Pommes','',9.80],
    ['Kindermenü','Spätzle mit Rahmsauce','',8.40],
    ['Kindermenü','Nudeln mit Tomaten- oder Bolognesesauce','',8.90],
    ['Kindermenü','Kindertoast (Schinken, Käse)','',7.90],
    ['Kindermenü','Bitterballen mit Pommes','',11.60],
    ['Kindermenü','Palatschinke','Mit Nutella, Apfelmus oder Staubzucker',6.50],
    ['Kindermenü','Milchshake','Banane, Schoko, Erdbeer, Vanille oder Karamell',5.50],
  ].map(([section,name,desc,price,card])=>({id:uid('m'),section,name,desc,price,card:card||''}));

  return {settings:{name:'DAHUAM.202 Restobar | Café',vat:10,target:28,nextNo:cards.length+1}, products:prods, cards, menu:M, demo:true};
}

/* ---------- Hilfsfunktionen ---------- */
function uid(p){ return p+'_'+Math.random().toString(36).slice(2,9); }
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fin = n => (typeof n === 'number' && isFinite(n)) ? n : 0;
const eur = n => fin(n).toLocaleString('de-AT',{style:'currency',currency:'EUR'});
const num = (n,d=0) => fin(n).toLocaleString('de-DE',{maximumFractionDigits:d});
const pct = n => (n==null || !isFinite(n)) ? '—' : num(n,1)+' %';
const byName = (a,b) => a.name.localeCompare(b.name,'de');

let S;
let view = {tab:'menu', card:null, q:'', ctype:'all', pq:''};

function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} }
function load(){ try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch(e){ return null; } }

const P = id => S.products.find(p => p.id === id);
const C = id => S.cards.find(c => c.id === id);
function refObj(ref){ if(!ref) return null; const i = ref.indexOf(':'); const t = ref.slice(0,i), id = ref.slice(i+1); const o = t==='p' ? P(id) : C(id); return o ? {t,o} : null; }
const algList = s => String(s||'').split(/[\s,]+/).filter(Boolean);

/* ---------- Berechnung ---------- */
function line(it, depth){
  const res = {name:'Zutat wählen', unit:'g', grossG:0, net:0, out:0, cost:0, alg:new Set(), missing:true, netAuto:0};
  const r = refObj(it.ref); if(!r) return res;
  res.missing = false;
  const q = +it.qty || 0;
  if(r.t === 'p'){
    const p = r.o; res.name = p.name;
    if(p.unit === 'Stk'){ res.unit = 'Stk'; res.cost = q * fin(+p.price); res.grossG = q * fin(+p.pieceG); }
    else { res.unit = p.unit === 'l' ? 'ml' : 'g'; res.cost = q/1000 * fin(+p.price); res.grossG = q; }
    res.netAuto = res.grossG * (1 - fin(+p.lossCold)/100);
    res.net = it.net !== '' && it.net != null ? +it.net : res.netAuto;
    res.out = res.net * (1 - fin(+p.lossHot)/100);
    algList(p.alg).forEach(a => res.alg.add(a));
  } else {
    const c = r.o; res.name = 'BR · ' + c.name; res.grossG = q;
    const t = totals(c, depth+1);
    { const y = +c.yieldG || t.out; res.cost = y ? q * t.cost / y : 0; }
    res.netAuto = q; res.net = it.net !== '' && it.net != null ? +it.net : q; res.out = res.net;
    t.alg.forEach(a => res.alg.add(a));
  }
  return res;
}
function totals(c, depth=0){
  const t = {cost:0, gross:0, net:0, out:0, alg:new Set(), lines:[]};
  if(!c || depth > 6) return t;
  for(const it of c.items){ const l = line(it, depth); t.lines.push(l); t.cost += l.cost; t.gross += l.grossG; t.net += l.net; t.out += l.out; l.alg.forEach(a => t.alg.add(a)); }
  return t;
}
function menuCalc(m){
  const c = m.card ? C(m.card) : null;
  const t = c ? totals(c) : null;
  const netPrice = (+m.price||0) / (1 + S.settings.vat/100);
  const cost = t ? t.cost : null;
  return {c, t, cost, netPrice, fc: cost!=null && netPrice ? cost/netPrice*100 : null, margin: cost!=null ? netPrice - cost : null};
}
function fcClass(fc){ if(fc==null) return 'na'; const tg = +S.settings.target; return fc <= tg ? 'good' : fc <= tg+7 ? 'warn' : 'bad'; }
function fcBadge(fc){ return `<span class="fc ${fcClass(fc)}">${fc==null ? 'keine Rezeptur' : pct(fc)}</span>`; }
function chips(set){ const a = [...set].sort(); return a.length ? `<div class="chips">${a.map(x=>`<span class="alg" title="${esc(ALG[x]||x)}">${esc(x)}</span>`).join('')}</div>` : ''; }
function usage(ref){ return S.cards.filter(c => c.items.some(i => i.ref === ref)); }

/* =====================================================================
   Erweiterung: Lager, Inventur, Fotos, Zubereitungsschritte, Gästekarte
   ===================================================================== */
const LOCS = {K:'Kühlhaus', T:'Tiefkühler', L:'Trockenlager', G:'Gemüselager', W:'Bar & Weinkeller'};
const MOVE = {in:'Wareneingang', out:'Entnahme', waste:'Schwund', sale:'Verkauf', inv:'Inventur'};
const WASTE = ['Verdorben / abgelaufen','Überproduktion','Zubereitungsfehler','Personalessen','Bruch','Sonstiges'];
const SECTION_ORDER = ['Vorspeisen','Suppen','Salate & Bowls','Flammkuchen','Fondue & Hauptspeisen','Burger & Kebap','Desserts','Kindermenü'];
const GSTYLES = [['alpin','Alpin'],['klassisch','Klassisch'],['modern','Modern']];

// Demo-Lagerdaten: Bestand, Mindestbestand, Lagerort, Lieferant
const DEMO_STOCK = {
  pork:[12,8,'K','Metzgerei'], veal:[3.5,5,'K','Metzgerei'], beef_goulash:[9,6,'K','Metzgerei'], beef_mince:[6,5,'K','Metzgerei'], speck:[4,3,'K','Metzgerei'],
  flour:[25,15,'L','Großhandel'], egg:[180,120,'K','Bauernhof'], quail:[36,24,'K','Bauernhof'], crumbs:[6,4,'L','Bäckerei'], schmalz:[5,4,'L','Großhandel'],
  fries:[16,20,'T','Großhandel'], lemon:[30,20,'G','Gemüsehändler'], cranberry:[3,2,'L','Großhandel'], parsley:[0.3,0.5,'K','Gemüsehändler'],
  milk:[20,15,'K','Molkerei'], cream:[8,6,'K','Molkerei'], butter:[6,5,'K','Molkerei'], cremefr:[4,3,'K','Molkerei'], parmesan:[2.5,1.5,'K','Großhandel'],
  bergkase:[7,6,'K','Sennerei'], emmental:[5,4,'K','Sennerei'], cheddar:[2,1.5,'K','Großhandel'], sugar:[20,10,'L','Großhandel'], icing:[5,3,'L','Großhandel'],
  raisins:[2,1,'L','Großhandel'], applesauce:[6,4,'L','Großhandel'], blueberry:[2.5,4,'T','Großhandel'], apples:[15,10,'G','Bauernhof'], strudel_dough:[3,2,'K','Großhandel'],
  cinnamon:[0.5,0.2,'L','Großhandel'], onion:[20,10,'G','Gemüsehändler'], red_onion:[5,3,'G','Gemüsehändler'], spring:[1,1,'K','Gemüsehändler'], garlic:[2,1,'G','Gemüsehändler'],
  potato:[40,25,'G','Bauernhof'], romaine:[2.5,4,'K','Gemüsehändler'], passata:[12,8,'L','Großhandel'], tomato_paste:[3,2,'L','Großhandel'], capers:[1,0.5,'L','Großhandel'],
  pickles:[5,4,'L','Großhandel'], pesto:[1.5,1,'K','Großhandel'], mustard:[2,1,'L','Großhandel'], bbq:[3,2,'L','Großhandel'], chutney:[2,1.5,'K','Großhandel'],
  bread:[6,4,'L','Bäckerei'], brioche:[40,30,'T','Bäckerei'], wine:[24,12,'W','Weinhandel'], kirsch:[3,2,'W','Weinhandel'], starch:[3,1,'L','Großhandel'],
  oil:[20,10,'L','Großhandel'], paprika:[1,0.5,'L','Großhandel'], caraway:[0.5,0.2,'L','Großhandel'], salt:[10,5,'L','Großhandel'], pepper:[1,0.5,'L','Großhandel'],
};
const DEMO_VEG = {'„Die Gärtnerin“':'v','„Der Weiße“':'v','Fruchtige Tomatensuppe':'v','„Vegan Dippin’“':'vg','„Fabian’s Caprese“':'v','„Veganista Couch Potato“':'vg','Dolce Vita Rösti':'v','„Wir sind Kaiser!“':'v','Oma Lisl’s Apfelstrudel':'v','„Marillenzeit = Knödelzeit“':'v','Zillertaler Käsefondue':'v'};
const DEMO_TOP = ['Zillertaler Käsefondue','„Wir sind Kaiser!“','Wiener Schnitzel vom Kalb','„Schwammerlsuche“'];

function daysAgo(n){ const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString(); }
function splitSteps(t){ const parts = String(t||'').split(/\.\s+(?=[A-ZÄÖÜ„])/).map(s=>s.trim()).filter(Boolean); return parts.map((s,i)=>({t: i<parts.length-1 || !/[.!?]$/.test(s) ? s.replace(/\.?$/,'.') : s, img:''})); }

function seed(){
  const d = seedBase();
  d.products.forEach(p => { const s = DEMO_STOCK[p.id]; if(s){ [p.stock,p.minStock,p.loc,p.supplier] = s; } else { p.stock = 0; p.minStock = 0; p.loc = 'L'; p.supplier = ''; p.noStock = p.id==='water'; } });
  d.cards.forEach(c => { c.steps = splitSteps(c.method); delete c.method; c.img = ''; });
  const order = {};
  d.menu.forEach(m => { order[m.section] = (order[m.section]||0); m.order = order[m.section]++; m.img = ''; m.veg = DEMO_VEG[m.name]||''; m.top = DEMO_TOP.includes(m.name); m.hidden = false; });
  d.settings.sections = [...SECTION_ORDER];
  d.settings.guest = {style:'alpin', photos:true, allergens:true, desc:true, title:'Speisekarte', subtitle:'Restobar | Café · Gerlos im Zillertal', footer:'Alle Preise in Euro inkl. MwSt. Bitte informieren Sie uns über Allergien und Unverträglichkeiten.'};
  const mv = (n,type,pid,qty,note) => { const p = d.products.find(x=>x.id===pid); return {id:uid('mv'), date:daysAgo(n), type, pid, qty, price:p.price, note}; };
  d.moves = [
    mv(6,'in','pork',10,'Lieferschein 2231'), mv(6,'in','veal',5,'Lieferschein 2231'), mv(5,'in','milk',20,'Molkerei Frühlieferung'),
    mv(4,'in','potato',25,''), mv(3,'waste','parsley',-0.1,'Verdorben / abgelaufen'), mv(2,'in','bergkase',4,''), mv(1,'out','wine',-2,'Für Fondue-Vorbereitung'),
  ];
  d.inventories = [{id:uid('inv'), date:daysAgo(31), counted:54, value:2386.40, diff:-42.30, demo:true}];
  d.invDraft = null;
  seasonSeed(d);
  einkaufSeed(d);
  menuV2Migrate(d);
  salesEnsure(d); if(d.demo && !d.salesDemoDone) salesDemo(d);
  pricesMigrate(d);
  gameMigrate(d);
  hausMigrate(d);
  fixesMigrate(d);
  return d;
}

function migrate(d){
  if(!d || typeof d !== 'object') return null;
  if(!Array.isArray(d.products) || !Array.isArray(d.cards) || !Array.isArray(d.menu)) return null;
  d.settings = Object.assign({name:'Mein Betrieb', vat:10, target:28, nextNo:d.cards.length+1}, d.settings||{});
  if(!(+d.settings.target >= 1)) d.settings.target = 28; if(!(+d.settings.vat >= 0)) d.settings.vat = 10;
  d.products = d.products.filter(p=>p && p.id); d.products.forEach(p=>{ p.name = p.name||p.id; p.unit = ['kg','l','Stk'].includes(p.unit)?p.unit:'kg'; p.price = +p.price||0; p.alg = p.alg||''; });
  d.cards = d.cards.filter(c=>c && c.id); d.cards.forEach(c=>{ c.name = c.name||'Rezeptur'; c.type = c.type==='semi'?'semi':'dish'; if(!Array.isArray(c.items)) c.items = []; c.items = c.items.filter(i=>i && typeof i==='object'); if(c.steps && !Array.isArray(c.steps)) c.steps = []; });
  d.menu = d.menu.filter(m=>m && m.id); d.menu.forEach(m=>{ m.name = m.name||'Gericht'; m.section = m.section||'Ohne Kategorie'; m.price = +m.price||0; m.desc = m.desc||''; });
  d.products.forEach(p => { if(p.stock==null){ const s = d.demo && DEMO_STOCK[p.id]; [p.stock,p.minStock,p.loc,p.supplier] = s || [0,0,'L','']; } if(p.id==='water') p.noStock = true; });
  d.cards.forEach(c => { if(!c.steps){ c.steps = splitSteps(c.method); delete c.method; } if(c.img==null) c.img=''; });
  const order = {};
  d.menu.forEach(m => { if(m.order==null){ order[m.section] = (order[m.section]||0); m.order = order[m.section]++; } if(m.img==null) m.img=''; if(m.veg==null) m.veg=''; });
  if(!d.settings.sections) d.settings.sections = [...SECTION_ORDER];
  if(!d.settings.guest) d.settings.guest = {style:'alpin', photos:true, allergens:true, desc:true, title:'Speisekarte', subtitle:'', footer:'Alle Preise in Euro inkl. MwSt.'};
  d.moves = d.moves || []; d.inventories = d.inventories || []; if(d.invDraft===undefined) d.invDraft = null;
  seasonMigrate(d);
  einkaufMigrate(d);
  menuV2Migrate(d);
  salesEnsure(d); if(d.demo && !d.salesDemoDone) salesDemo(d);
  pricesMigrate(d);
  gameMigrate(d);
  hausMigrate(d);
  fixesMigrate(d);
  return d;
}

/* ---------- Fotos (IndexedDB) ---------- */
const IMG = {}; let idb = null;
function idbOpen(){ return new Promise(res => { try { const r = indexedDB.open('dahuam202_fotos', 1); r.onupgradeneeded = () => r.result.createObjectStore('img'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch(e){ res(null); } }); }
async function imgLoadAll(){ idb = await idbOpen(); if(!idb) return; await new Promise(res => { try { const rq = idb.transaction('img').objectStore('img').openCursor(); rq.onsuccess = () => { const c = rq.result; if(c){ IMG[c.key] = c.value; c.continue(); } else res(); }; rq.onerror = () => res(); } catch(e){ res(); } }); }
function imgPut(id, data){ IMG[id] = data; try { idb && idb.transaction('img','readwrite').objectStore('img').put(data, id); } catch(e){} }
function imgDel(id){ if(!id) return; delete IMG[id]; try { idb && idb.transaction('img','readwrite').objectStore('img').delete(id); } catch(e){} }
function resizeImage(file, max=1400){
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onerror = rej; fr.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => {
    const k = Math.min(1, max/Math.max(im.width, im.height)); const cv = document.createElement('canvas'); cv.width = Math.round(im.width*k); cv.height = Math.round(im.height*k);
    cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); res(cv.toDataURL('image/jpeg', 0.82)); }; im.src = fr.result; }; fr.readAsDataURL(file); });
}
let pickCb = null;
function pickImage(cb){ pickCb = cb; const i = $('#imgFile'); const d = $('#dlg'); (d.open ? d : document.body).appendChild(i); i.value = ''; i.click(); }
function setPhoto(obj, field='img'){ pickImage(data => { if(obj[field]) imgDel(obj[field]); const id = uid('img'); imgPut(id, data); obj[field] = id; save(); render(); toast('Foto gespeichert'); }); }
function initials(n){ const w = String(n||'').replace(/[„“"'«»]/g,'').trim().split(/\s+/); return ((w[0]||'')[0]||'·').toUpperCase(); }
function menuImg(m){ const c = m.card && C(m.card); return (m.img && IMG[m.img]) ? m.img : (c && c.img && IMG[c.img]) ? c.img : ''; }
function photo(imgId, name, hue, cls=''){
  const src = imgId && IMG[imgId];
  return src ? `<img class="ph ${cls}" src="${src}" alt="${esc(name)}" loading="lazy">` : `<span class="ph ph-empty ${cls}" style="--h:${secHue(hue)}" aria-hidden="true"><b>${esc(initials(name))}</b></span>`;
}

/* ---------- Lager-Logik ---------- */
function unitOf(p){ return p ? p.unit : ''; }
function qtyFmt(q, p){ const d = p && p.unit==='Stk' ? 0 : (Math.abs(q) < 10 ? 2 : 1); return num(q, d)+' '+unitOf(p); }
function stockProducts(){ return S.products.filter(p => !p.noStock); }
function stockValue(){ return stockProducts().reduce((s,p)=>s + Math.max(0,+p.stock||0)*(+p.price||0), 0); }
function lowStock(){ return stockProducts().filter(p => (+p.minStock||0) > 0 && (+p.stock||0) < +p.minStock); }
function addMove(type, pid, delta, note='', price=null, date=null){
  const p = P(pid); if(!p || !delta) return;
  p.stock = Math.round(((+p.stock||0) + delta)*1000)/1000;
  S.moves.unshift({id:uid('mv'), date: date || new Date().toISOString(), type, pid, qty:delta, price: price ?? p.price, note});
}
function explode(c, f, acc=new Map(), d=0){
  if(!c || d > 6) return acc;
  for(const it of c.items){ const r = refObj(it.ref); if(!r) continue; const q = (+it.qty||0)*f;
    if(r.t==='p'){ if(r.o.noStock) continue; acc.set(r.o.id, (acc.get(r.o.id)||0) + (r.o.unit==='Stk' ? q : q/1000)); }
    else { const y = +r.o.yieldG || totals(r.o).out; if(y) explode(r.o, q/y, acc, d+1); } }
  return acc;
}
function orderSuggest(p){ const min = +p.minStock||0, s = +p.stock||0; let q = Math.max(0, min*2 - s); if(p.unit==='Stk') return Math.ceil(q); return Math.ceil(q*2)/2; }

/* ---------- Karten-Reihenfolge ---------- */
function secList(){ const s = S.settings.sections; for(const m of S.menu) if(m.section && !s.includes(m.section)) s.push(m.section); return s; }
function menuSorted(){ const s = secList(); return [...S.menu].sort((a,b) => s.indexOf(a.section) - s.indexOf(b.section) || (a.order??0) - (b.order??0)); }
function nextOrder(sec){ return S.menu.filter(m=>m.section===sec).reduce((mx,m)=>Math.max(mx, m.order??0), -1) + 1; }
function moveItem(id, dir){
  const m = S.menu.find(x=>x.id===id); const list = menuSorted().filter(x=>x.section===m.section); list.forEach((x,i)=>x.order=i);
  const i = list.indexOf(m), j = i+dir; if(j<0 || j>=list.length) return; [list[i].order, list[j].order] = [list[j].order, list[i].order];
}

/* ---------- Icons ---------- */
const ICO = {
  dash:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  menu:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M9 9h6M9 13h6"/>',
  cards:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
  stock:'<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/>',
  products:'<path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
  setup:'<path d="M4 6h9M19 6h1M4 12h3M13 12h7M4 18h11M21 18h-1"/><circle cx="16" cy="6" r="2.2"/><circle cx="10" cy="12" r="2.2"/><circle cx="18" cy="18" r="2.2"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  arrow:'<path d="M15 5l-7 7 7 7"/>',
  up:'<path d="M6 15l6-6 6 6"/>', down:'<path d="M6 9l6 6 6-6"/>',
  print:'<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff:'<path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.6 6.6C3.8 8.4 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1"/>',
  truck:'<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  clip:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 11l2 2 4-4M9 17h6"/>',
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  leaf:'<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19l7-7"/>',
  cart:'<path d="M3 4h2l2.5 11h10L20 7H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
};
const ico = (n, cls='') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICO[n]}</svg>`;

const TABS = [['dash','Übersicht','Start'],['menu','Speisekarte','Karte'],['cards','Rezepturen','Rezepte'],['stock','Lager','Lager'],['products','Produkte','Produkte'],['setup','Einstellungen','Mehr']];
view = {tab:'dash', card:null, q:'', sec:'all', ctype:'all', pq:'', sim:null, portions:20, mtab:'calc', stab:'bestand', loc:'all', mtype:'all', order:{}};

/* ---------- Bausteine ---------- */
function ring(fc, size=46, stroke=5){
  const r = (size-stroke)/2, c = 2*Math.PI*r, v = fc==null ? 0 : Math.min(fc,60)/60;
  return `<svg class="ring ${fcClass(fc)}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle class="trk" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" fill="none"/>
    <circle class="val" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-dasharray="${(c*v).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 ${size/2} ${size/2})"/></svg>`;
}
function secHue(name){ const secs = [...new Set(secList().concat(S.cards.map(c=>c.category)))]; const i = Math.max(0, secs.indexOf(name)); return (i*47 + 20) % 360; }
function catDot(name){ return `<span class="dot" style="--h:${secHue(name)}"></span>`; }
function toast(msg, opt){
  const t = $('#toast'); clearTimeout(toast._t); t.textContent = msg; t.classList.remove('has-act');
  if(opt && opt.action){ const b = document.createElement('button'); b.type = 'button'; b.className = 'toast-act'; b.textContent = opt.label || 'Rückgängig'; b.onclick = () => { clearTimeout(toast._t); t.classList.remove('show','has-act'); opt.action(); }; t.appendChild(b); t.classList.add('has-act'); }
  t.classList.add('show'); toast._t = setTimeout(()=>t.classList.remove('show','has-act'), (opt && opt.ms) || (opt && opt.action ? 6000 : 2200));
}
function demoNote(){ return S.demo ? `<div class="note">${ico('spark')}<span>Demodaten: Speisekarte und Preise von dahuam202.at. Rezepturen, Einkaufspreise und Lagerbestände sind Richtwerte, bitte durch eigene ersetzen.</span></div>` : ''; }
function seg(name, cur, opts){ return `<div class="seg" role="tablist">${opts.map(([k,l,n])=>`<button type="button" role="tab" class="${cur===k?'on':''}" data-act="${name}" data-id="${k}">${l}${n!=null?`<small>${n}</small>`:''}</button>`).join('')}</div>`; }
function vegBadge(v){ return v==='vg' ? '<span class="vb vg" title="Vegan">VG</span>' : v==='v' ? '<span class="vb" title="Vegetarisch">V</span>' : ''; }
function fmtDate(iso){ return new Date(iso).toLocaleDateString('de-AT',{day:'2-digit',month:'2-digit',year:'numeric'}); }

/* ---------- Rahmen ---------- */
function render(){
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === view.tab));
  const app = $('#app');
  const fn = {dash:renderDash, menu:renderMenu, stock:renderStock, products:renderProducts, setup:renderSetup, buy:renderBuy, report:renderReport, aufbau:renderAufbau, pcheck:renderPriceCheck, labor:renderLabor}[view.tab];
  app.innerHTML = fn ? fn() : (view.card && C(view.card) ? renderCard(C(view.card)) : renderCards());
  app.dataset.view = view.tab; app.classList.toggle('v-list', vmode('buy') !== 'cards');
  app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter');
  autosize();
  const wEl = $('#whoami'); if(wEl){ const u = me(); wEl.innerHTML = `<b>${esc(u.name)}</b><small>${ROLES[u.role]}${cloudReady()?' · Cloud':''}</small>`; }
  pendingRender = false;
  if(kbdSel){ const el = document.querySelector(kbdSel); kbdSel = null; if(el) el.focus({preventScroll:true}); }
}
let kbdSel = null, ptrDown = false, pendingRender = false;
function softRender(){ if(ptrDown){ pendingRender = true; return; } setTimeout(() => { const id = document.activeElement && document.activeElement.id; render(); if(id){ const n = document.getElementById(id); if(n){ n.focus({preventScroll:true}); if(n.matches('input.num-in') && n.select) n.select(); } } }, 0); }
document.addEventListener('pointerdown', () => { ptrDown = true; }, true);
document.addEventListener('pointerup', () => { ptrDown = false; if(pendingRender) setTimeout(() => { if(pendingRender){ pendingRender = false; render(); } }, 0); }, true);
document.addEventListener('click', e => { const b = e.target.closest('[data-act][data-id],[data-act]'); if(b && e.detail === 0 && b.closest('#app')) kbdSel = `[data-act="${b.dataset.act}"]` + (b.dataset.id!=null ? `[data-id="${CSS.escape(b.dataset.id)}"]` : ''); }, true);
function autosize(el){ (el ? [el] : document.querySelectorAll('#app .title-in, #app [data-step]')).forEach(t => { if(t.tagName!=='TEXTAREA') return; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }); }
function navHtml(short){ return TABS.map(([k,l,s])=>`<button type="button" class="nav-i" data-tab="${k}">${ico(k)}<span>${short?s:l}</span></button>`).join(''); }

/* ---------- Übersicht ---------- */
function renderDash(){
  const all = S.menu.map(m => ({m, k:menuCalc(m)}));
  const linked = all.filter(x => x.k.cost != null).sort((a,b)=>b.k.fc-a.k.fc);
  const avg = linked.length ? linked.reduce((s,x)=>s+x.k.fc,0)/linked.length : null;
  const over = linked.filter(x => x.k.fc > S.settings.target);
  const cover = S.menu.length ? linked.length/S.menu.length*100 : 0;
  const tg = +S.settings.target;
  const scale = Math.max(40, Math.ceil(((linked[0]?.k.fc)||0)/10)*10 + 5);
  const low = lowStock();
  const drv = new Map();
  linked.forEach(x => explode(x.k.c, 1).forEach((q,pid) => { const p = P(pid); drv.set(pid, (drv.get(pid)||0) + q*(+p.price||0)); }));
  const drvList = [...drv.entries()].sort((a,b)=>b[1]-a[1]);
  const drvSum = drvList.reduce((s,x)=>s+x[1],0) || 1;
  const top = drvList.slice(0,6);
  const hour = new Date().getHours();
  const hi = hour < 11 ? 'Guten Morgen' : hour < 17 ? 'Servus' : 'Guten Abend';
  const lastInv = S.inventories[0];
  return `<div class="page-h"><div><div class="eyebrow">${new Date().toLocaleDateString('de-AT',{weekday:'long', day:'numeric', month:'long'})}</div><h1>${hi}, Küche!</h1></div>
    <div class="row-btns"><button type="button" class="btn" data-act="sales">${ico('cart')}Verkäufe buchen</button><button type="button" class="btn primary" data-act="moveDlg" data-id="in">${ico('truck')}Wareneingang</button></div></div>
  ${demoNote()}
  <div class="tiles">
    <div class="tile"><div class="tile-ring">${ring(avg,58,6)}<b>${avg==null?'—':num(avg,0)+'%'}</b></div><div><div class="t-l">Ø Wareneinsatz</div><div class="t-s">Ziel ${num(tg)} %</div></div></div>
    <div class="tile"><div><div class="t-v">${linked.length}<small>/${S.menu.length}</small></div><div class="t-l">Gerichte kalkuliert</div><div class="meter"><i style="width:${cover.toFixed(1)}%"></i></div></div></div>
    <button type="button" class="tile click" data-act="goStock" data-id="bestand"><div><div class="t-v">${eur(stockValue())}</div><div class="t-l">Lagerwert</div><div class="t-s">${lastInv?'Inventur '+fmtDate(lastInv.date):'Noch keine Inventur'}</div></div></button>
    <button type="button" class="tile click" data-act="goStock" data-id="bestellung"><div><div class="t-v ${low.length?'bad-t':'good-t'}">${low.length}</div><div class="t-l">unter Mindestbestand</div><div class="t-s">${low.length?'Bestellvorschlag ansehen →':'Lager ist gut gefüllt'}</div></div></button>
  </div>
  <div class="dash-grid">
    <section class="panel">
      <div class="panel-h"><h2>Wareneinsatz je Gericht</h2><span class="legend"><i class="tl"></i>Ziel ${num(tg)} %</span></div>
      <div class="bars" style="--tg:${(tg/scale*100).toFixed(2)}%">
        ${linked.map(({m,k})=>`<button type="button" class="bar-r" data-act="openCard" data-id="${k.c.id}" title="${esc(m.name)}">
          <span class="bar-n">${esc(m.name)}</span>
          <span class="bar-t"><i class="${fcClass(k.fc)}" style="width:${Math.min(100,k.fc/scale*100).toFixed(2)}%"></i></span>
          <span class="bar-v">${num(k.fc,1)}%</span></button>`).join('') || '<div class="empty">Noch keine Gerichte kalkuliert.</div>'}
        <div class="bar-axis"><span></span><span class="ax"><i>0 %</i><i>${num(scale/2)} %</i><i>${num(scale)} %</i></span><span></span></div>
      </div>
    </section>
    <div class="stack">
      <section class="panel">
        <div class="panel-h"><h2>Zu erledigen</h2></div>
        <ul class="todo">
          <li><button type="button" data-act="goStock" data-id="bestellung"><b class="${low.length?'bad-t':''}">${low.length}</b><span>Artikel nachbestellen</span>${ico('arrow','flip')}</button></li>
          ${(() => { const t = todayStr(), w = wd(t); const due = (S.suppliers||[]).filter(sp=>sp.active && sp.orderDays.includes(w) && !lastOrderToday(sp.id)); const exp = (S.orders||[]).filter(o=>['sent','confirmed'].includes(o.status) && o.deliveryDate<=t); return (due.length?`<li><button type="button" data-act="goStock" data-id="bestellung"><b class="${due.some(sp=>hm(sp.cutoff)-nowMin()<90)?'bad-t':''}">${due.length}</b><span>Heute bestellen: ${due.map(x=>esc(x.name)).join(', ')}</span>${ico('arrow','flip')}</button></li>`:'') + (exp.length?`<li><button type="button" data-act="goStock" data-id="bestellung"><b>${ico('truck')}</b><span>${exp.length} ${exp.length===1?'Lieferung':'Lieferungen'} heute prüfen</span>${ico('arrow','flip')}</button></li>`:''); })()}
          ${(() => { const nx = S.specials.filter(sp=>spStatus(sp)[0]!=='past').sort((a,b)=>a.from.localeCompare(b.from))[0]; return nx ? `<li><button type="button" data-act="previewSpecial" data-id="${nx.id}"><b>${ico('star')}</b><span>${esc(nx.name)} · ${spStatus(nx)[1]}</span>${ico('arrow','flip')}</button></li>` : ''; })()}
          <li><button type="button" data-act="goMenu" data-id="noalg"><b class="${S.menu.some(m=>!hasAlg(m))?'bad-t':''}">${S.menu.filter(m=>!hasAlg(m)).length}</b><span>Gerichte ohne Allergenangabe</span>${ico('arrow','flip')}</button></li>
          <li><button type="button" data-act="goMenu" data-id="none"><b>${S.menu.length-linked.length}</b><span>Gerichte ohne Rezeptur</span>${ico('arrow','flip')}</button></li>
          <li><button type="button" data-act="goMenu" data-id="over"><b class="${over.length?'bad-t':''}">${over.length}</b><span>Gerichte über ${num(tg)} % Wareneinsatz</span>${ico('arrow','flip')}</button></li>
          <li><button type="button" data-act="goStock" data-id="inventur"><b>${S.invDraft?'…':ico('clip')}</b><span>${S.invDraft?'Laufende Inventur fortsetzen':'Inventur durchführen'}</span>${ico('arrow','flip')}</button></li>
        </ul>
      </section>
      <section class="panel">
        <div class="panel-h"><h2>Größte Kostentreiber</h2></div>
        <div class="stackbar">${top.map(([id,v],i)=>`<i style="width:${(v/drvSum*100).toFixed(2)}%;background:var(--s${i+1})"></i>`).join('')}<i style="flex:1;background:var(--s7)"></i></div>
        <ul class="leg">${top.map(([id,v],i)=>`<li><span class="sw" style="background:var(--s${i+1})"></span><span class="ln">${esc(P(id)?.name)}</span><span class="mono">${num(v/drvSum*100,1)} %</span></li>`).join('')}
          <li><span class="sw" style="background:var(--s7)"></span><span class="ln muted">Übrige Produkte</span><span class="mono">${num((1-top.reduce((s,x)=>s+x[1],0)/drvSum)*100,1)} %</span></li></ul>
        <p class="hint">Anteil am Wareneinsatz aller kalkulierten Gerichte, je eine Portion.</p>
      </section>
    </div>
  </div>`;
}

/* ---------- Speisekarte ---------- */
function renderMenu(){
  const hidden = S.menu.filter(m=>m.hidden).length;
  const head = `<div class="page-h"><div><div class="eyebrow">${S.menu.length} Gerichte · ${secList().length} Kategorien${hidden?` · ${hidden} ausgeblendet`:''}</div><h1>Speisekarte</h1></div>
    <div class="row-btns">${view.mtab==='guest' && !FRAMED ? `<button type="button" class="btn" data-act="printMenu">${ico('print')}Drucken</button>` : ''}<button type="button" class="btn primary" data-act="newMenu">${ico('plus')}Gericht</button></div></div>
  <div class="toolbar">${seg('mtab', view.mtab, [['calc','Kalkulation'],['guest','Gästekarte'],['layout','Aufbau & Reihenfolge']])}</div>`;
  return head + (view.mtab==='guest' ? renderGuest() : view.mtab==='layout' ? renderLayout() : renderMenuCalc());
}

function renderMenuCalc(){
  const q = view.q.trim().toLowerCase();
  const all = menuSorted().map(m => ({m, k:menuCalc(m)}));
  const f = view.sec;
  const shown = all.filter(({m,k}) => (!q || (m.name+' '+m.desc+' '+m.section+' '+(k.t?k.t.lines.map(l=>l.name).join(' '):'')).toLowerCase().includes(q))
    && (f==='all' || (f==='none' ? k.cost==null : f==='over' ? (k.fc!=null && k.fc > S.settings.target) : f==='nophoto' ? !menuImg(m) : f==='noalg' ? !hasAlg(m) : SEASONS.some(x=>x[0]===f) ? m.seasons.includes(f) : m.section===f)));
  const cnt = x => all.filter(x).length;
  const chip = (k,l,n,dot) => `<button type="button" class="chip ${f===k?'on':''}" data-act="sec" data-id="${esc(k)}">${dot||''}${esc(l)}<small>${n}</small></button>`;
  let h = `<div class="toolbar"><label class="search">${ico('search')}<input id="mq" type="search" placeholder="Gericht, Zutat oder Kategorie" value="${esc(view.q)}" autocomplete="off"></label></div>
  <div class="chips-row">${chip('all','Alle',all.length)}${chip('over','Über Ziel',cnt(x=>x.k.fc!=null&&x.k.fc>S.settings.target))}${chip('none','Ohne Rezeptur',cnt(x=>x.k.cost==null))}${chip('nophoto','Ohne Foto',cnt(x=>!menuImg(x.m)))}${chip('noalg','Ohne Allergene',cnt(x=>!hasAlg(x.m)))}<span class="sep"></span>${SEASONS.map(([k,l])=>chip(k,'Nur '+l,cnt(x=>x.m.seasons.includes(k)))).join('')}<span class="sep"></span>${secList().filter(s=>all.some(x=>x.m.section===s)).map(s=>chip(s,s,cnt(x=>x.m.section===s),catDot(s))).join('')}</div>`;
  if(!shown.length) return h + `<div class="panel empty">Keine Gerichte für diesen Filter.</div>`;
  for(const s of secList().filter(s=>shown.some(x=>x.m.section===s))){
    h += `<h2 class="sec-h">${catDot(s)}${esc(s)}</h2><div class="dish-grid">`;
    for(const {m,k} of shown.filter(x=>x.m.section===s)){
      h += `<article class="dish ${k.c?'':'nocard'} ${m.hidden?'is-hidden':''}">
        <div class="dish-ph">${photo(menuImg(m), m.name, m.section)}
          <button type="button" class="ph-btn" data-act="photoMenu" data-id="${m.id}" title="Foto ${menuImg(m)?'ändern':'hinzufügen'}" aria-label="Foto ${menuImg(m)?'ändern':'hinzufügen'}">${ico('camera')}</button>
          <span class="ph-flags">${m.top?'<span class="vb top" title="Empfehlung">★</span>':''}${vegBadge(m.veg)}${m.hidden?'<span class="vb off">ausgeblendet</span>':''}${m.seasons.length?`<span class="vb off">${m.seasons.map(seasonName).join(' · ')}</span>`:''}${m.days.length?`<span class="vb off">${esc(daysLabel(m))}</span>`:''}</span></div>
        <button type="button" class="dish-main" data-act="${k.c?'openCard':'newCardFor'}" data-id="${k.c?k.c.id:m.id}">
          <span class="dish-top"><span class="dish-n">${esc(m.name)}</span><span class="price">${eur(m.price)}</span></span>
          ${m.desc?`<span class="dish-d">${esc(m.desc)}</span>`:''}
          <span class="dish-b">${k.c ? `<span class="fcw">${ring(k.fc,34,4)}<span><b class="mono">${pct(k.fc)}</b><small>WE ${eur(k.cost)}</small></span></span>${chips(k.t.alg)}`
            : `<span class="add">${ico('plus')}Rezeptur anlegen</span>${hasAlg(m) ? chips(new Set(algList(m.alg))) : '<span class="vb warn">Allergene fehlen</span>'}`}</span>
        </button>
        <button type="button" class="icon-btn edit" title="Gericht bearbeiten" aria-label="Gericht bearbeiten" data-act="editMenu" data-id="${m.id}">${ico('edit')}</button>
      </article>`;
    }
    h += `</div>`;
  }
  return h;
}

function guestHtml(){
  const g = S.settings.guest;
  const items = menuSorted().filter(m => !m.hidden);
  const used = new Set();
  let body = '';
  for(const s of secList()){
    const list = items.filter(m=>m.section===s); if(!list.length) continue;
    body += `<section class="g-sec"><h3 class="g-h"><span>${esc(s)}</span></h3><div class="g-list">`;
    for(const m of list){
      const k = menuCalc(m); const alg = k.t ? [...k.t.alg].sort() : []; alg.forEach(a=>used.add(a));
      const img = g.photos ? menuImg(m) : '';
      body += `<article class="g-item ${img?'has-ph':''} ${m.top?'is-top':''}">
        ${img ? `<img class="g-ph" src="${IMG[img]}" alt="${esc(m.name)}" loading="lazy">` : ''}
        <div class="g-txt"><div class="g-row"><span class="g-n">${esc(m.name)}${m.veg==='vg'?' <i class="g-mark" title="Vegan">VG</i>':m.veg==='v'?' <i class="g-mark" title="Vegetarisch">V</i>':''}</span><span class="lead"></span><span class="g-p">${fin(+m.price).toLocaleString('de-AT',{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
        ${m.top?`<div class="g-top">★ Empfehlung des Hauses</div>`:''}
        ${g.desc && m.desc ? `<div class="g-d">${esc(m.desc)}</div>` : ''}
        ${g.allergens && alg.length ? `<div class="g-a">${alg.join(' · ')}</div>` : ''}</div>
      </article>`;
    }
    body += `</div></section>`;
  }
  const legend = g.allergens && used.size ? `<div class="g-leg">${[...used].sort().map(a=>`<span><b>${a}</b> ${esc(ALG[a])}</span>`).join('')}</div>` : '';
  return `<div class="g-paper g-${g.style}">
    <header class="g-head"><div class="g-mark-logo">DAHUAM<span>.</span>202</div><h2 class="g-title">${esc(g.title)}</h2>${g.subtitle?`<div class="g-sub">${esc(g.subtitle)}</div>`:''}</header>
    ${body || '<p class="g-empty">Noch keine sichtbaren Gerichte.</p>'}
    <footer class="g-foot"><div class="g-keys"><span><i class="g-mark">V</i> vegetarisch</span><span><i class="g-mark">VG</i> vegan</span><span>★ Empfehlung des Hauses</span></div>${legend}<p>${esc(g.footer)}</p></footer>
  </div>`;
}
function renderGuest(){
  const g = S.settings.guest;
  const tog = (k,l) => `<label class="tog"><input type="checkbox" data-gf="${k}" ${g[k]?'checked':''}><span></span>${l}</label>`;
  return `<div class="guest-wrap">
    <aside class="panel guest-tools">
      <div class="panel-h"><h2>Gestaltung</h2></div>
      <div class="f">Stil</div>${seg('gstyle', g.style, GSTYLES)}
      <div class="togs">${tog('photos','Fotos zeigen')}${tog('desc','Beschreibungen')}${tog('allergens','Allergene')}</div>
      <label class="f">Titel<input id="g-title" data-gs="title" value="${esc(g.title)}"></label>
      <label class="f">Untertitel<input id="g-sub" data-gs="subtitle" value="${esc(g.subtitle)}"></label>
      <label class="f">Fußzeile<textarea id="g-foot" data-gs="footer" class="sm-ta">${esc(g.footer)}</textarea></label>
      <p class="hint">Gerichte erscheinen automatisch in ihrer Kategorie. Reihenfolge und Sichtbarkeit legen Sie unter „Aufbau & Reihenfolge“ fest.</p>
      <button type="button" class="btn" data-act="mtab" data-id="layout">${ico('up')}Reihenfolge ändern</button>
    </aside>
    <div class="guest-prev">${guestHtml()}</div>
  </div>`;
}

function renderLayout(){
  const secs = secList();
  return `<div class="layout-intro"><p class="hint" style="margin:0">So ist Ihre Karte aufgebaut. Neue Gerichte landen automatisch in der passenden Kategorie, am Ende der Liste. Mit den Pfeilen ändern Sie die Reihenfolge, mit dem Auge blenden Sie ein Gericht auf der Gästekarte aus.</p>
    <button type="button" class="btn" data-act="addSec">${ico('plus')}Kategorie</button></div>
  <div class="lay">${secs.map((s,si)=>{ const items = menuSorted().filter(m=>m.section===s); return `<section class="panel lay-sec">
    <div class="lay-h"><span class="lay-no mono">${si+1}</span>${catDot(s)}<input class="lay-name" data-secname="${si}" value="${esc(s)}" aria-label="Kategoriename"><span class="muted sm">${items.length}</span>
      <span class="lay-acts"><button type="button" class="icon-btn" data-act="secMove" data-id="${si}:-1" ${si===0?'disabled':''} aria-label="Kategorie nach oben">${ico('up')}</button><button type="button" class="icon-btn" data-act="secMove" data-id="${si}:1" ${si===secs.length-1?'disabled':''} aria-label="Kategorie nach unten">${ico('down')}</button>
      <button type="button" class="icon-btn" data-act="secSort" data-id="${si}" title="Nach Preis sortieren" aria-label="Nach Preis sortieren"><span class="mono" style="font-size:12px">€↑</span></button>
      ${items.length?'':`<button type="button" class="icon-btn danger" data-act="secDel" data-id="${si}" aria-label="Kategorie löschen">${ico('trash')}</button>`}</span></div>
    ${items.length ? `<ol class="lay-list">${items.map((m,i)=>`<li class="${m.hidden?'off':''}">${photo(menuImg(m), m.name, s, 'xs')}<span class="lay-n" title="${esc(m.name)}">${esc(m.name)}</span><span class="mono sm">${eur(m.price)}</span>
      <button type="button" class="icon-btn" data-act="itemMove" data-id="${m.id}:-1" ${i===0?'disabled':''} aria-label="Nach oben">${ico('up')}</button><button type="button" class="icon-btn" data-act="itemMove" data-id="${m.id}:1" ${i===items.length-1?'disabled':''} aria-label="Nach unten">${ico('down')}</button>
      <button type="button" class="icon-btn" data-act="itemHide" data-id="${m.id}" title="${m.hidden?'Auf der Gästekarte zeigen':'Auf der Gästekarte ausblenden'}" aria-label="Sichtbarkeit">${ico(m.hidden?'eyeoff':'eye')}</button></li>`).join('')}</ol>` : '<p class="hint">Leer. Ein Gericht mit dieser Kategorie erscheint hier automatisch.</p>'}
  </section>`; }).join('')}</div>`;
}

/* ---------- Rezepturen ---------- */
function renderCards(){
  const q = view.q.trim().toLowerCase();
  const list = S.cards.filter(c => (view.ctype==='all' || c.type===view.ctype) && (!q || (c.name+' '+c.category).toLowerCase().includes(q)))
    .sort((a,b) => a.type===b.type ? byName(a,b) : (a.type==='semi'?1:-1));
  const n = t => S.cards.filter(c=>t==='all'||c.type===t).length;
  let h = `<div class="page-h"><div><div class="eyebrow">${n('dish')} Gerichte · ${n('semi')} Basisrezepte</div><h1>Rezepturen</h1></div>
    <div class="row-btns"><button type="button" class="btn" data-act="newCard" data-id="semi">${ico('plus')}Basisrezept</button><button type="button" class="btn primary" data-act="newCard" data-id="dish">${ico('plus')}Gericht</button></div></div>
  <div class="toolbar"><label class="search">${ico('search')}<input id="cq" type="search" placeholder="Rezeptur suchen" value="${esc(view.q)}" autocomplete="off"></label>
    ${seg('ctype', view.ctype, [['all','Alle',n('all')],['dish','Gerichte',n('dish')],['semi','Basisrezepte',n('semi')]])}</div>`;
  if(!list.length) return h + `<div class="panel empty">Keine Rezepturen gefunden. Legen Sie eine mit „Gericht“ an.</div>`;
  h += `<div class="rc-grid">`;
  for(const c of list){
    const t = totals(c);
    const per100 = c.yieldG ? t.cost / c.yieldG * 100 : 0;
    const mk = S.menu.filter(m => m.card === c.id).map(menuCalc)[0];
    h += `<button type="button" class="rc" data-act="openCard" data-id="${c.id}">
      <span class="rc-ph">${photo(c.img, c.name, c.category)}${c.type==='dish' && !mk ? '<span class="vb off">nicht auf der Karte</span>' : ''}</span>
      <span class="rc-body">
      <span class="rc-top"><span class="tag ${c.type}">${c.type==='semi'?'Basisrezept':'Gericht'} · Nr. ${c.no||'—'}</span>${c.type==='dish'?`<span class="fcw sm">${ring(mk?mk.fc:null,28,4)}<b class="mono">${mk?pct(mk.fc):'—'}</b></span>`:''}</span>
      <span class="rc-n">${esc(c.name)}</span>
      <span class="rc-m">${catDot(c.category)}${esc(c.category||'ohne Kategorie')} · ${c.items.length} Zutaten · ${(c.steps||[]).length} Schritte</span>
      <span class="rc-b"><span><b class="mono">${eur(t.cost)}</b><small>${c.type==='semi'?'pro Charge':'pro Portion'}</small></span><span><b class="mono">${eur(per100)}</b><small>pro 100 g</small></span></span>
      </span>
    </button>`;
  }
  return h + `</div>`;
}

function refOptions(sel, selfId){
  const ps = [...S.products].sort(byName);
  const cs = S.cards.filter(c => c.type==='semi' && c.id!==selfId).sort(byName);
  return `<option value="">— Zutat wählen —</option><optgroup label="Produkte">${ps.map(p=>`<option value="p:${p.id}" ${sel==='p:'+p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</optgroup>`
    + (cs.length ? `<optgroup label="Basisrezepte">${cs.map(c=>`<option value="c:${c.id}" ${sel==='c:'+c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</optgroup>` : '');
}
function simHtml(cost, price){
  const np = price/(1+S.settings.vat/100), fc = np ? cost/np*100 : null;
  return `<div class="sim-out"><div class="fcw">${ring(fc,52,6)}<span><b class="mono big2">${pct(fc)}</b><small>Wareneinsatz</small></span></div>
    <div class="kv"><span>Rohertrag exkl. MwSt.</span><span>${eur(np-cost)}</span><span>Aufschlagsfaktor</span><span>${cost?num(np/cost,2)+'×':'—'}</span></div></div>`;
}
function prodHtml(c, n){
  const t = totals(c), f = c.type==='semi' && c.yieldG ? 1 : n;
  const rows = c.items.map((it,i)=>{ const l = t.lines[i]; if(l.missing) return ''; const q = (+it.qty||0)*f; const v = l.unit==='Stk' ? (Math.abs(q - Math.round(q)) < 1e-6 ? num(q)+' Stk' : `${num(Math.ceil(q - 1e-9))} Stk <small class="muted exact">genau ${num(q,2)}</small>`) : q>=1000 ? num(q/1000,2)+(l.unit==='ml'?' l':' kg') : num(q)+' '+l.unit; return `<li><span>${esc(l.name)}</span><b class="mono">${v}</b></li>`; }).join('');
  return `<ul class="plist">${rows}</ul><div class="kv"><span>Wareneinsatz gesamt</span><span>${eur(t.cost*f)}</span></div>`;
}

function renderCard(c){
  const t = totals(c);
  const per100 = c.yieldG ? t.cost / c.yieldG * 100 : 0;
  const menus = S.menu.filter(m => m.card === c.id);
  const m0 = menus[0], k0 = m0 ? menuCalc(m0) : null;
  const cats = [...new Set([...secList(), ...S.cards.map(x=>x.category)].filter(Boolean))];
  const usedIn = usage('c:'+c.id);
  const vat = 1 + S.settings.vat/100;
  const rec = t.cost / (S.settings.target/100) * vat;
  const parts = t.lines.map(l=>({n:l.name, v:l.cost})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
  const top = parts.slice(0,5), rest = parts.slice(5).reduce((s,x)=>s+x.v,0), sum = t.cost || 1;
  const base = m0 ? +m0.price : Math.round(rec*10)/10;
  if(!view.sim || view.sim.id !== c.id) view.sim = {id:c.id, price:base};
  const smin = Math.max(1, Math.floor(t.cost*vat*1.2)), smax = Math.max(smin+5, Math.ceil(Math.max(base, rec)*1.6));
  const steps = c.steps || [];

  const rows = c.items.map((it,i) => { const l = t.lines[i]; return `<tr>
      <td class="c-ing"><select id="ref-${i}" data-li="${i}" data-lf="ref" aria-label="Zutat">${refOptions(it.ref, c.id)}</select></td>
      <td class="r"><span class="qty"><input id="qty-${i}" class="num-in" type="text" inputmode="decimal" data-li="${i}" data-lf="qty" value="${numIn(it.qty)}" aria-label="Brutto"><em>${l.unit}</em></span></td>
      <td class="r"><input id="net-${i}" class="num-in" type="text" inputmode="decimal" data-li="${i}" data-lf="net" value="${numIn(it.net)}" placeholder="${num(l.netAuto,1)}" aria-label="Netto in g"></td>
      <td class="r mono">${num(l.out,1)}</td>
      <td class="r mono">${eur(l.cost)}<span class="share" style="width:${(l.cost/sum*100).toFixed(1)}%"></span></td>
      <td><button type="button" class="icon-btn" data-act="delLine" data-id="${i}" title="Zeile entfernen" aria-label="Zeile entfernen">${ico('x')}</button></td></tr>`; }).join('');

  const stepsHtml = steps.map((s,i)=>`<li class="step">
      <span class="step-no">${i+1}</span>
      <div class="step-body"><textarea id="st-${i}" data-step="${i}" rows="2" aria-label="Zubereitung Schritt ${i+1}" placeholder="Was passiert in diesem Schritt?">${esc(s.t)}</textarea>
        ${s.img && IMG[s.img] ? `<div class="step-ph"><img src="${IMG[s.img]}" alt="Schritt ${i+1}"><button type="button" class="ph-btn" data-act="stepPhoto" data-id="${i}" aria-label="Foto ändern">${ico('camera')}</button><button type="button" class="ph-btn del" data-act="stepPhotoDel" data-id="${i}" aria-label="Foto entfernen">${ico('x')}</button></div>`
          : `<button type="button" class="btn sm ghost" data-act="stepPhoto" data-id="${i}">${ico('camera')}Foto</button>`}</div>
      <div class="step-acts"><button type="button" class="icon-btn" data-act="stepMove" data-id="${i}:-1" ${i===0?'disabled':''} aria-label="Nach oben">${ico('up')}</button><button type="button" class="icon-btn" data-act="stepMove" data-id="${i}:1" ${i===steps.length-1?'disabled':''} aria-label="Nach unten">${ico('down')}</button><button type="button" class="icon-btn" data-act="stepDel" data-id="${i}" aria-label="Schritt löschen">${ico('trash')}</button></div>
    </li>`).join('');

  return `<button type="button" class="back" data-act="backCards">${ico('arrow')}Alle Rezepturen</button>
  <div class="hero">
    <div class="hero-ph">${photo(c.img, c.name, c.category)}<button type="button" class="ph-btn big" data-act="photoCard" data-id="${c.id}">${ico('camera')}<span>${c.img&&IMG[c.img]?'Foto ändern':'Foto hinzufügen'}</span></button>${c.img&&IMG[c.img]?`<button type="button" class="ph-btn del" data-act="photoCardDel" data-id="${c.id}" aria-label="Foto entfernen">${ico('x')}</button>`:''}</div>
    <div class="hero-main">
      <div class="eyebrow">${c.type==='semi'?'Basisrezept':'Gericht'} · Rezeptur Nr. ${c.no||'—'} · ${esc(c.category||'ohne Kategorie')}</div>
      <textarea id="cf-name" class="title-in" data-cf="name" rows="1" aria-label="Bezeichnung">${esc(c.name)}</textarea>
      <div class="hero-stats">
        <div><b class="mono">${eur(t.cost)}</b><small>Wareneinsatz ${c.type==='semi'?'pro Charge':'pro Portion'}</small></div>
        <div><b class="mono">${+c.yieldG > 0 ? eur(per100) : '—'}</b><small>pro 100 g</small></div>
        ${c.type==='semi' && c.yieldG ? `<div><b class="mono">${eur(t.cost/c.yieldG*1000)}</b><small>pro kg</small></div>` : ''}
        ${k0 ? `<div><b class="mono">${eur(m0.price)}</b><small>Verkaufspreis</small></div>` : ''}
      </div>
      ${c.type==='dish' && !m0 ? `<button type="button" class="btn primary sm" data-act="toMenu" data-id="${c.id}" style="margin-top:14px">${ico('plus')}Auf die Karte setzen</button>` : ''}
    </div>
    ${c.type==='dish' ? `<div class="hero-ring">${ring(k0?k0.fc:null,112,10)}<span><b class="mono">${k0?pct(k0.fc):'—'}</b><small>${k0?'Wareneinsatz':'nicht auf der Karte'}</small></span></div>` : ''}
    <div class="hero-acts">
      ${FRAMED ? '' : `<button type="button" class="icon-btn lg" data-act="printCard" data-id="${c.id}" title="Rezeptur drucken" aria-label="Rezeptur drucken">${ico('print')}</button>`}
      <button type="button" class="icon-btn lg" data-act="dupCard" data-id="${c.id}" title="Duplizieren" aria-label="Duplizieren">${ico('copy')}</button>
      <button type="button" class="icon-btn lg danger" data-act="delCard" data-id="${c.id}" title="Löschen" aria-label="Löschen">${ico('trash')}</button>
    </div>
  </div>
  <div class="grid2">
    <div class="col">
      <section class="panel"><div class="fields">
        <label class="f">Typ<select id="cf-type" data-cf="type"><option value="dish" ${c.type==='dish'?'selected':''}>Gericht</option><option value="semi" ${c.type==='semi'?'selected':''}>Basisrezept</option></select></label>
        <label class="f">Kategorie<input id="cf-category" data-cf="category" list="cats" value="${esc(c.category)}"><datalist id="cats">${cats.map(x=>`<option value="${esc(x)}">`).join('')}</datalist></label>
        <label class="f">${c.type==='semi'?'Ausbeute Charge, g':'Portionsgewicht, g'}<input id="cf-yieldG" class="num-in" data-cf="yieldG" type="text" inputmode="decimal" data-msg="Ungültiges Gewicht, nicht geändert" value="${numIn(c.yieldG)}" placeholder="${num(t.out)}"></label>
      </div></section>
      <section class="panel flush">
        <div class="panel-h pad"><h2>Zutaten ${c.type==='semi'?'pro Charge':'pro Portion'}</h2><span class="muted sm">${c.items.length} Positionen</span></div>
        <div class="tbl-wrap"><table class="edit">
          <thead><tr><th>Zutat</th><th class="r">Brutto</th><th class="r">Netto, g</th><th class="r">Fertig, g</th><th class="r">Betrag</th><th></th></tr></thead>
          <tbody>${rows || `<tr><td colspan="6" class="muted">Erste Zutat hinzufügen.</td></tr>`}</tbody>
          <tfoot><tr><td>Summe</td><td class="r mono">${num(t.gross)} g</td><td class="r mono">${num(t.net)}</td><td class="r mono">${num(t.out)}</td><td class="r mono">${eur(t.cost)}</td><td></td></tr></tfoot>
        </table></div>
        <div class="panel-f"><button type="button" class="btn" data-act="addLine">${ico('plus')}Zutat</button><span class="hint">Netto ergibt sich aus dem Putzverlust. Eigenen Wert einfach überschreiben.</span></div>
      </section>
      <section class="panel">
        <div class="panel-h"><h2>Zubereitung</h2><span class="muted sm">${steps.length} Schritte</span></div>
        <ol class="steps">${stepsHtml || '<li class="hint">Noch keine Schritte.</li>'}</ol>
        <button type="button" class="btn" data-act="stepAdd">${ico('plus')}Schritt</button>
      </section>
    </div>
    <div class="col">
      ${c.type==='dish' ? `<section class="panel accent">
        <div class="panel-h"><h2>Preis-Simulator</h2><span class="muted sm">inkl. ${num(S.settings.vat)} % MwSt.</span></div>
        <div class="sim-price"><b class="mono" id="simVal">${eur(view.sim.price)}</b>${m0?`<button type="button" class="btn sm" data-act="applySim" data-id="${m0.id}" id="simApply" ${Math.abs(view.sim.price-m0.price)<0.05?'hidden':''}>Übernehmen</button>`:''}</div>
        <input id="sim" type="range" min="${smin}" max="${smax}" step="0.1" value="${view.sim.price}" aria-label="Verkaufspreis">
        <div class="range-l"><span>${eur(smin)}</span><span>${eur(smax)}</span></div>
        <div id="simOut">${simHtml(t.cost, +view.sim.price)}</div>
        <p class="hint">Für ${num(S.settings.target)} % Wareneinsatz: <button type="button" class="link" data-act="simTo" data-id="${(Math.round(rec*10)/10).toFixed(1)}">${eur(Math.round(rec*10)/10)}</button></p>
      </section>` : ''}
      <section class="panel">
        <div class="panel-h"><h2>Kostenstruktur</h2></div>
        <div class="stackbar">${top.map((x,i)=>`<i style="width:${(x.v/sum*100).toFixed(2)}%;background:var(--s${i+1})" title="${esc(x.n)}"></i>`).join('')}${rest?`<i style="flex:1;background:var(--s7)"></i>`:''}</div>
        <ul class="leg">${top.map((x,i)=>`<li><span class="sw" style="background:var(--s${i+1})"></span><span class="ln">${esc(x.n)}</span><span class="mono">${num(x.v/sum*100,0)} %</span></li>`).join('')}${rest?`<li><span class="sw" style="background:var(--s7)"></span><span class="ln muted">Rest</span><span class="mono">${num(rest/sum*100,0)} %</span></li>`:''}</ul>
      </section>
      <section class="panel">
        <div class="panel-h"><h2>Produktionsmenge</h2>${c.type==='dish'?`<label class="portions"><input id="portions" type="number" min="1" step="1" value="${view.portions}" aria-label="Portionen"> Portionen</label>`:'<span class="muted sm">1 Charge</span>'}</div>
        <div id="prodOut">${prodHtml(c, view.portions)}</div>
      </section>
      <section class="panel">
        <div class="panel-h"><h2>Allergene</h2><span class="muted sm">EU-VO 1169/2011</span></div>
        ${t.alg.size ? `<div class="alg-big">${[...t.alg].sort().map(a=>`<span><b>${esc(a)}</b>${esc(ALG[a]||a)}</span>`).join('')}</div>` : '<p class="hint">Keine gefunden. Bitte die Produktdaten prüfen.</p>'}
      </section>
      ${c.type==='semi' ? `<section class="panel"><div class="panel-h"><h2>Verwendet in</h2></div>
        ${usedIn.length ? `<ul class="todo">${usedIn.map(u=>`<li><button type="button" data-act="openCard" data-id="${u.id}"><span>${esc(u.name)}</span>${ico('arrow','flip')}</button></li>`).join('')}</ul>` : '<p class="hint">Noch in keiner Rezeptur verwendet.</p>'}
      </section>` : ''}
    </div>
  </div>`;
}

/* ---------- Lager ---------- */
function renderStock(){
  const low = lowStock(), last = S.inventories[0];
  const week = S.moves.filter(m => m.type==='in' && (Date.now()-new Date(m.date))/864e5 <= 7).reduce((s,m)=>s+m.qty*m.price, 0);
  const head = `<div class="page-h"><div><div class="eyebrow">${stockProducts().length} Artikel · ${Object.keys(LOCS).length} Lagerorte</div><h1>Lager</h1></div>
    <div class="row-btns"><button type="button" class="btn" data-act="sales">${ico('cart')}Verkäufe buchen</button><button type="button" class="btn" data-act="moveDlg" data-id="waste">${ico('trash')}Schwund</button><button type="button" class="btn primary" data-act="moveDlg" data-id="in">${ico('truck')}Wareneingang</button></div></div>
  ${demoNote()}
  <div class="tiles">
    <div class="tile"><div><div class="t-v">${eur(stockValue())}</div><div class="t-l">Lagerwert</div><div class="t-s">zu Einkaufspreisen</div></div></div>
    <button type="button" class="tile click" data-act="goStock" data-id="bestellung"><div><div class="t-v ${low.length?'bad-t':'good-t'}">${low.length}</div><div class="t-l">unter Mindestbestand</div><div class="t-s">${low.length?'Bestellvorschlag →':'Alles vorrätig'}</div></div></button>
    <div class="tile"><div><div class="t-v">${eur(week)}</div><div class="t-l">Wareneingang 7 Tage</div><div class="t-s">${S.moves.filter(m=>m.type==='in').length} Lieferungen gesamt</div></div></div>
    <button type="button" class="tile click" data-act="stab" data-id="inventur"><div><div class="t-v ${last&&last.diff<0?'bad-t':''}">${last?eur(last.diff):'—'}</div><div class="t-l">Differenz letzte Inventur</div><div class="t-s">${S.invDraft?'Inventur läuft →':last?fmtDate(last.date):'Noch keine Inventur'}</div></div></button>
  </div>
  <div class="toolbar">${seg('stab', view.stab, [['bestand','Bestand'],['buchungen','Buchungen',S.moves.length],['inventur','Inventur']])}</div>`;
  return head + ({bestand:stockList, buchungen:moveList, inventur:invView, bestellung:orderView, lieferanten:supplierView}[view.stab] || stockList)();
}
function levelBar(p){ const s = +p.stock||0, mn = +p.minStock||0; const w = mn ? Math.min(100, s/(mn*2)*100) : 100; const cls = mn && s < mn*0.5 ? 'bad' : mn && s < mn ? 'warn' : 'good'; return `<span class="lvl"><i class="${cls}" style="width:${w.toFixed(1)}%"></i>${mn?`<em style="left:50%"></em>`:''}</span>`; }
function stockList(){
  const q = view.pq.trim().toLowerCase();
  const all = stockProducts();
  const list = all.filter(p => (view.loc==='all' || p.loc===view.loc) && (!q || (p.name+' '+supName(p)).toLowerCase().includes(q))).sort((a,b)=> (a.loc||'').localeCompare(b.loc||'') || byName(a,b));
  const chip = (k,l,n) => `<button type="button" class="chip ${view.loc===k?'on':''}" data-act="loc" data-id="${k}">${l}<small>${n}</small></button>`;
  return `<div class="toolbar"><label class="search">${ico('search')}<input id="pq" type="search" placeholder="Artikel oder Lieferant" value="${esc(view.pq)}" autocomplete="off"></label></div>
  <div class="chips-row">${chip('all','Alle Lagerorte',all.length)}${Object.entries(LOCS).map(([k,l])=>chip(k,l,all.filter(p=>p.loc===k).length)).join('')}</div>
  <section class="panel flush"><div class="tbl-wrap"><table class="stock">
    <thead><tr><th>Artikel</th><th>Lagerort</th><th>Füllstand</th><th class="r">Bestand</th><th class="r">Mindest</th><th class="r">Wert</th><th></th></tr></thead>
    <tbody>${list.map(p=>{ const low = (+p.minStock||0) && (+p.stock||0) < +p.minStock; return `<tr class="row ${low?'is-low':''}" data-act="editProd" data-id="${p.id}">
      <td><b class="pn">${esc(p.name)}</b><small class="muted">${esc(supName(p))}</small></td>
      <td><span class="tag">${esc(LOCS[p.loc]||'—')}</span></td>
      <td>${levelBar(p)}</td>
      <td class="r mono ${(+p.stock||0)<0?'bad-t':''}">${qtyFmt(+p.stock||0,p)}</td>
      <td class="r mono muted">${qtyFmt(+p.minStock||0,p)}</td>
      <td class="r mono">${eur(Math.max(0,+p.stock||0)*(+p.price||0))}</td>
      <td class="nowrap"><button type="button" class="icon-btn" data-act="moveDlg" data-id="in:${p.id}" title="Wareneingang" aria-label="Wareneingang">${ico('plus')}</button><button type="button" class="icon-btn" data-act="moveDlg" data-id="out:${p.id}" title="Entnahme" aria-label="Entnahme">${ico('minus')}</button><button type="button" class="icon-btn" data-act="editProd" data-id="${p.id}" title="Artikel bearbeiten" aria-label="Artikel bearbeiten">${ico('edit')}</button></td>
    </tr>`; }).join('') || '<tr><td colspan="7" class="muted">Nichts gefunden.</td></tr>'}</tbody>
    <tfoot><tr><td colspan="5">Summe ${view.loc==='all'?'':esc(LOCS[view.loc])}</td><td class="r mono">${eur(list.reduce((s,p)=>s+Math.max(0,+p.stock||0)*(+p.price||0),0))}</td><td></td></tr></tfoot>
  </table></div></section>`;
}
function movesByDate(){ return S.moves.map((m,i)=>[m,i]).sort((a,b) => String(b[0].date).localeCompare(String(a[0].date)) || a[1]-b[1]).map(x=>x[0]); }
function moveList(){
  const t = view.mtype;
  const all = movesByDate().filter(m => t==='all' || m.type===t);
  const chip = (k,l) => `<button type="button" class="chip ${t===k?'on':''}" data-act="mtype" data-id="${k}">${l}<small>${k==='all'?S.moves.length:S.moves.filter(m=>m.type===k).length}</small></button>`;
  const undo = (id, lbl) => `<button type="button" class="icon-btn" data-act="moveUndo" data-id="${id}" title="Stornieren" aria-label="${lbl}">${ico('undo')}</button>`;
  const seen = new Set(); const out = [];
  for(const m of all){
    if(out.length >= 300) break;
    if(m.grp){ if(seen.has(m.grp)) continue; seen.add(m.grp);
      const ms = all.filter(x => x.grp === m.grp); const g = (S.saleGroups||{})[m.grp] || {}; const val = ms.reduce((a,x)=>a+x.qty*x.price,0);
      out.push(`<li class="mv-grp"><span class="mv-d mono">${fmtDate(m.date)}</span><span class="mvt ${m.type}">${MOVE[m.type]}</span>
        <span class="mv-n"><b>${g.n ? `${num(g.n)} ${g.n===1?'Portion':'Portionen'}` : esc(m.note||'Sammelbuchung')}</b><details class="mv-det"><summary>${ms.length} Artikel abgebucht${g.gross ? ` · Umsatz ${eur(g.gross)}` : ''}</summary><ul>${ms.map(x=>{ const p = P(x.pid); return `<li><span>${esc(p?p.name:'gelöschter Artikel')}</span><span class="mono">${qtyFmt(x.qty,p)}</span></li>`; }).join('')}</ul></details></span>
        <span class="mv-q mono muted">${ms.length} Pos.</span><span class="mv-v mono">${eur(val)}</span>${undo(m.id, 'Verkaufsbuchung stornieren')}</li>`); continue; }
    const p = P(m.pid);
    out.push(`<li><span class="mv-d mono">${fmtDate(m.date)}</span><span class="mvt ${m.type}">${MOVE[m.type]}</span>
    <span class="mv-n"><b>${esc(p?p.name:'gelöschter Artikel')}</b>${m.note?`<small class="muted">${esc(m.note)}</small>`:''}</span>
    <span class="mv-q mono ${m.qty<0?'bad-t':'good-t'}">${m.qty>0?'+':''}${qtyFmt(m.qty,p)}</span>
    <span class="mv-v mono">${eur(m.qty*m.price)}</span>${undo(m.id, 'Buchung stornieren')}</li>`);
  }
  return `<div class="chips-row">${chip('all','Alle')}${Object.entries(MOVE).map(([k,l])=>chip(k,l)).join('')}</div>
  <section class="panel flush">${out.length ? `<ul class="moves">${out.join('')}</ul>` : '<div class="empty">Noch keine Buchungen.</div>'}</section>`;
}
function invView(){
  const d = S.invDraft;
  if(!d){
    return `<div class="grid2"><section class="panel accent"><div class="panel-h"><h2>Neue Inventur</h2></div>
      <p class="dlg-p">Die Zählliste ist nach Lagerorten sortiert, so gehen Sie einmal durch Kühlhaus, Tiefkühler und Lager. Tragen Sie die gezählte Menge ein; Differenzen in Menge und Euro erscheinen sofort. Nicht gezählte Artikel bleiben unverändert.</p>
      <div class="row-btns" style="margin-top:14px"><button type="button" class="btn primary" data-act="invStart">${ico('clip')}Inventur starten</button></div></section>
      <section class="panel"><div class="panel-h"><h2>Bisherige Inventuren</h2></div>
      ${S.inventories.length ? `<ul class="todo">${S.inventories.map(i=>`<li><div class="inv-h"><span><b class="mono">${fmtDate(i.date)}</b><small class="muted">${i.counted} Artikel gezählt${i.demo?' · Demo':''}</small></span><span class="r"><b class="mono">${eur(i.value)}</b><small class="mono ${i.diff<0?'bad-t':'good-t'}">${signedEur(i.diff)}</small></span></div></li>`).join('')}</ul>` : '<p class="hint">Noch keine abgeschlossene Inventur.</p>'}
      </section></div>`;
  }
  const items = stockProducts().sort((a,b)=>(a.loc||'').localeCompare(b.loc||'') || byName(a,b));
  const done = items.filter(p => d.counts[p.id] !== undefined && d.counts[p.id] !== '').length;
  const diffSum = items.reduce((s,p)=>{ const c = d.counts[p.id]; return c===undefined||c==='' ? s : s + (c-(+p.stock||0))*(+p.price||0); }, 0);
  let h = `<section class="panel inv-bar"><div><div class="eyebrow">Inventur seit ${fmtDate(d.date)}</div><b class="mono" id="invProg">${done} / ${items.length}</b> gezählt · Differenz <b class="mono ${diffSum<0?'bad-t':''}" id="invDiff">${signedEur(diffSum)}</b>
    <div class="meter"><i id="invMeter" style="width:${(done/items.length*100).toFixed(1)}%"></i></div></div>
    <div class="row-btns"><button type="button" class="btn" data-act="invCancel">Verwerfen</button><button type="button" class="btn primary" data-act="invFinish">Inventur abschließen</button></div></section>`;
  for(const [k,l] of Object.entries(LOCS)){
    const list = items.filter(p=>p.loc===k); if(!list.length) continue;
    h += `<h2 class="sec-h">${esc(l)}<small class="muted sm">${list.length} Artikel</small></h2><section class="panel flush"><div class="tbl-wrap"><table class="inv">
      <thead><tr><th>Artikel</th><th class="r">Soll</th><th class="r">Ist gezählt</th><th class="r">Differenz</th><th class="r">Wert</th></tr></thead><tbody>
      ${list.map(p=>{ const c = d.counts[p.id]; const has = c!==undefined && c!==''; const df = has ? c-(+p.stock||0) : 0; return `<tr id="ir-${p.id}" class="${has?'counted':''}">
        <td><b class="pn">${esc(p.name)}</b></td><td class="r mono muted">${qtyFmt(+p.stock||0,p)}</td>
        <td class="r"><span class="qty"><input id="inv-${p.id}" class="num-in" type="text" inputmode="decimal" data-num="de" data-msg="Ungültige Zählmenge, nicht übernommen" data-inv="${p.id}" data-old="${has?numIn(c):''}" value="${has?numIn(c):''}" placeholder="—" aria-label="Gezählt ${esc(p.name)}"><em>${esc(p.unit)}</em></span></td>
        <td class="r mono idf ${df<0?'bad-t':df>0?'good-t':''}">${has?(df>0?'+':'')+qtyFmt(df,p):''}</td><td class="r mono idv ${df<0?'bad-t':df>0?'good-t':''}">${has?eur(df*(+p.price||0)):''}</td></tr>`; }).join('')}
      </tbody></table></div></section>`;
  }
  return h;
}
function invUpdate(pid){
  const d = S.invDraft, p = P(pid), row = $('#ir-'+pid); const c = d.counts[pid]; const has = c!==undefined && c!=='';
  const df = has ? c-(+p.stock||0) : 0; const cls = df<0?'bad-t':df>0?'good-t':'';
  row.classList.toggle('counted', has);
  const a = row.querySelector('.idf'), b = row.querySelector('.idv'); a.className = 'r mono idf '+cls; b.className = 'r mono idv '+cls;
  a.textContent = has ? (df>0?'+':'')+qtyFmt(df,p) : ''; b.textContent = has ? eur(df*(+p.price||0)) : '';
  const items = stockProducts(); const done = items.filter(x => d.counts[x.id] !== undefined && d.counts[x.id] !== '').length;
  const sum = items.reduce((s,x)=>{ const v = d.counts[x.id]; return v===undefined||v==='' ? s : s + (v-(+x.stock||0))*(+x.price||0); }, 0);
  $('#invProg').textContent = `${done} / ${items.length}`; $('#invDiff').textContent = signedEur(sum); $('#invDiff').className = 'mono '+(sum<0?'bad-t':''); $('#invMeter').style.width = (done/items.length*100).toFixed(1)+'%';
}
function orderView(){
  const low = lowStock();
  if(!low.length) return `<section class="panel empty">Alle Artikel sind über dem Mindestbestand. Mindestbestände stellen Sie im Artikel ein.</section>`;
  const groups = {}; low.forEach(p => { const s = p.supplier || 'Ohne Lieferant'; (groups[s] = groups[s] || []).push(p); });
  return `<p class="hint" style="margin:0 0 14px">Vorschlag: auffüllen auf den doppelten Mindestbestand. Mengen anpassen, Text kopieren und per Mail oder WhatsApp senden. Kommt die Lieferung, buchen Sie sie mit einem Klick ein.</p>
  <div class="ord-grid">${Object.entries(groups).map(([s,list])=>`<section class="panel">
    <div class="panel-h"><h2>${ico('truck')} ${esc(s)}</h2><span class="muted sm">${list.length} Artikel</span></div>
    <ul class="ord">${list.map(p=>{ const q = view.order[p.id] ?? orderSuggest(p); return `<li><span><b>${esc(p.name)}</b><small class="muted">Bestand ${qtyFmt(+p.stock||0,p)} · Mindest ${qtyFmt(+p.minStock||0,p)}</small></span>
      <span class="qty"><input id="ord-${p.id}" type="number" step="any" min="0" data-ord="${p.id}" value="${q}" aria-label="Bestellmenge"><em>${esc(p.unit)}</em></span></li>`; }).join('')}</ul>
    <div class="kv"><span>Geschätzter Einkauf</span><span>${eur(list.reduce((t,p)=>t+(view.order[p.id] ?? orderSuggest(p))*(+p.price||0),0))}</span></div>
    <div class="row-btns" style="margin-top:12px"><button type="button" class="btn" data-act="ordCopy" data-id="${esc(s)}">${ico('copy')}Bestelltext</button><button type="button" class="btn primary" data-act="ordBook" data-id="${esc(s)}">${ico('truck')}Lieferung einbuchen</button></div>
  </section>`).join('')}</div>`;
}
function orderText(s){
  const list = lowStock().filter(p => (p.supplier||'Ohne Lieferant')===s);
  return `Bestellung ${S.settings.name}\nLieferant: ${s}\nGewünschte Lieferung: ________\n\n${list.map(p=>`• ${p.name}: ${num(view.order[p.id] ?? orderSuggest(p),2)} ${p.unit}`).join('\n')}\n\nDanke und liebe Grüße\nKüche ${S.settings.name}`;
}

/* ---------- Produkte ---------- */
function renderProducts(){
  const q = view.pq.trim().toLowerCase();
  const list = S.products.filter(p => !q || p.name.toLowerCase().includes(q)).sort(byName);
  return `<div class="page-h"><div><div class="eyebrow">${S.products.length} Produkte · Preise exkl. MwSt.</div><h1>Produkte</h1></div>
    <button type="button" class="btn primary" data-act="newProd">${ico('plus')}Produkt</button></div>
  ${demoNote()}
  <div class="toolbar"><label class="search">${ico('search')}<input id="pq" type="search" placeholder="Produkt suchen" value="${esc(view.pq)}" autocomplete="off"></label></div>
  <section class="panel flush"><div class="tbl-wrap"><table class="prods">
    <thead><tr><th>Produkt</th><th class="r">Preis €</th><th class="r">Putzverlust</th><th class="r">Garverlust</th><th>Allergene</th><th class="r">Rezepturen</th><th></th></tr></thead>
    <tbody>${list.map(p=>{ const u = usage('p:'+p.id).length; return `<tr>
      <td><b class="pn">${esc(p.name)}</b><small class="muted">${p.unit==='Stk'&&p.pieceG?`je Stk · ${num(p.pieceG)} g`:`je ${esc(p.unit)}`}${p.supplier?' · '+esc(supName(p)):''}</small></td>
      <td class="r"><span class="qty"><input id="pp-${p.id}" type="number" step="0.01" min="0" inputmode="decimal" data-pp="${p.id}" data-pf="price" value="${esc(p.price)}" aria-label="Preis"><em>€</em></span></td>
      <td class="r"><span class="qty"><input id="plc-${p.id}" type="number" step="any" min="0" max="100" data-pp="${p.id}" data-pf="lossCold" value="${esc(p.lossCold)}" aria-label="Putzverlust"><em>%</em></span></td>
      <td class="r"><span class="qty"><input id="plh-${p.id}" type="number" step="any" min="0" max="100" data-pp="${p.id}" data-pf="lossHot" value="${esc(p.lossHot)}" aria-label="Garverlust"><em>%</em></span></td>
      <td>${chips(new Set(algList(p.alg)))}</td>
      <td class="r"><span class="cnt ${u?'':'zero'}">${u}</span></td>
      <td><button type="button" class="icon-btn" data-act="editProd" data-id="${p.id}" title="Bearbeiten" aria-label="Produkt bearbeiten">${ico('edit')}</button></td>
    </tr>`; }).join('') || `<tr><td colspan="7" class="muted">Nichts gefunden.</td></tr>`}</tbody>
  </table></div></section>
  <p class="hint">Preis ändern, und Wareneinsatz aller Rezepturen und der ganzen Speisekarte wird sofort neu berechnet.</p>`;
}

/* ---------- Einstellungen ---------- */
function renderSetup(){
  const n = Object.keys(IMG).length;
  return `<div class="page-h"><div><div class="eyebrow">Betrieb & Daten</div><h1>Einstellungen</h1></div></div>
  <div class="grid2">
    <section class="panel"><div class="panel-h"><h2>Kalkulation</h2></div><div class="fields">
      <label class="f">Name des Betriebs<input id="s-name" data-sf="name" value="${esc(S.settings.name)}"></label>
      <label class="f">MwSt. Speisen, %<input id="s-vat" data-sf="vat" type="number" step="any" min="0" value="${esc(S.settings.vat)}"></label>
      <label class="f">Ziel-Wareneinsatz, %<input id="s-target" data-sf="target" type="number" step="any" min="1" value="${esc(S.settings.target)}"></label>
    </div><p class="hint">In Österreich gilt für Speisen der ermäßigte Steuersatz von 10 %. Der Wareneinsatz wird vom Preis exkl. MwSt. berechnet.</p></section>
    <section class="panel"><div class="panel-h"><h2>Daten</h2><span class="muted sm">${n} Fotos gespeichert</span></div>
      <p class="hint">Daten und Fotos werden nur in diesem Browser gespeichert. Erstellen Sie regelmäßig eine Sicherung und übertragen Sie sie per Import auf andere Geräte.</p>
      <div class="row-btns wrap" style="margin-top:12px"><button type="button" class="btn" data-act="export">Sicherung erstellen</button>
        <button type="button" class="btn" data-act="importPick">Sicherung laden</button><input id="importFile" type="file" accept="application/json,.json" hidden>
        <button type="button" class="btn danger" data-act="reset">Demodaten wiederherstellen</button></div>
    </section>
  </div>`;
}

/* ---------- Dialoge ---------- */
function openDialog(title, body, onOk, opts={}){
  const f = $('#dlgForm'), d = $('#dlg');
  f.oninput = null; f.onclick = null; delete f.dataset.force;
  f.innerHTML = `<div class="dlg-h"><h3>${esc(title)}</h3><button type="button" class="icon-btn" id="dlgX" aria-label="Schließen">${ico('x')}</button></div>${body}<div class="dlg-actions">${opts.del?'<button type="button" class="btn danger" id="dlgDel">Löschen</button>':''}<span class="sp"></span><button type="button" class="btn" id="dlgCancel">${opts.cancel||'Abbrechen'}</button>${onOk?`<button type="submit" class="btn primary">${opts.ok||'Speichern'}</button>`:''}</div>`;
  f.onsubmit = e => { e.preventDefault();
    // Zahlenfelder: Komma oder Punkt, nie negativ; erst prüfen, dann für den Handler normalisieren
    const nums = [...f.querySelectorAll('input.num-in')]; const shown = nums.map(i => i.value); let bad = null;
    f.querySelectorAll('.f-err').forEach(n => n.remove());
    nums.forEach(i => { i.classList.remove('bad-in'); const raw = i.value.trim(); if(raw === '') return; const v = numParse(raw); const min = i.dataset.min != null ? +i.dataset.min : 0, max = i.dataset.max != null ? +i.dataset.max : Infinity; if(!isFinite(v) || v < min || v > max){ i.classList.add('bad-in'); bad = bad || i; } });
    if(bad){ dlgErr(bad, bad.dataset.msg || 'Bitte eine gültige Zahl eingeben, zum Beispiel 12,5. Negative Werte sind nicht möglich.'); return; }
    nums.forEach(i => { if(i.value.trim() !== '') i.value = String(numParse(i.value)); });
    let r; try { r = onOk ? onOk(new FormData(f), f) : undefined; } finally { nums.forEach((i,k) => { if(i.isConnected) i.value = shown[k]; }); }
    if(r === false) return;
    d.close(); save(); render(); if(opts.toast!==false) toast(typeof opts.done==='function' ? opts.done() : (opts.done||'Gespeichert')); };
  $('#dlgCancel').onclick = $('#dlgX').onclick = () => d.close();
  if(opts.del) $('#dlgDel').onclick = () => { d.close(); opts.del(); };
  d.showModal();
  opts.after && opts.after(f);
}
/* Hinweis direkt am Feld; Dialog bleibt offen */
function dlgErr(input, msg){
  const f = $('#dlgForm'); if(typeof input === 'string') input = f.elements[input] || f.querySelector(input);
  f.querySelectorAll('.f-err').forEach(n => n.remove());
  const el = document.createElement('small'); el.className = 'f-err'; el.setAttribute('role','alert'); el.textContent = msg;
  if(input && input.insertAdjacentElement){ input.classList.add('bad-in'); (input.closest('.qty') || input).insertAdjacentElement('afterend', el); input.focus(); const off = () => { input.classList.remove('bad-in'); input.removeEventListener('input', off); }; input.addEventListener('input', off); }
  else f.querySelector('.dlg-actions').insertAdjacentElement('beforebegin', el);
  return false;
}
/* Klick neben den Dialog schließt ihn (nicht, wenn eine Textmarkierung hinausgezogen wird) */
(() => { const d = $('#dlg'); if(!d) return; let down = false;
  const outside = e => { const r = d.getBoundingClientRect(); return e.target === d && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom); };
  d.addEventListener('pointerdown', e => { down = outside(e); });
  d.addEventListener('click', e => { if(down && outside(e)) d.close(); down = false; }); })();
function signedEur(n){ n = fin(n); return (n > 0.004 ? '+' : n < -0.004 ? '−' : '') + eur(Math.abs(n)); }
function plural(n, one, many){ return `${num(n)} ${n === 1 ? one : many}`; }
function dateTooFar(ds){ return !!ds && ds > addDays(todayStr(), 1); }
function ask(text, yes, ok='Löschen'){ openDialog('Bitte bestätigen', `<p class="dlg-p">${esc(text)}</p>`, () => { yes(); }, {ok, done: ok==='Löschen'?'Gelöscht':'Erledigt'}); }
function info(title, text){ openDialog(title, `<p class="dlg-p">${esc(text)}</p>`, null, {cancel:'OK'}); }

function menuDialog(m, prefill){
  const isNew = !m; m = m || {id:uid('m'), section:'', name:'', desc:'', price:'', card:'', img:'', veg:'', top:false, hidden:false, seasons:[], days:[], alg:'', ...(prefill||{})};
  if(isNew && !m.section && secList().includes(view.sec)) m.section = view.sec;
  let img = m.img;
  const opts = S.cards.filter(c=>c.type==='dish').sort(byName);
  const thumb = () => img && IMG[img] ? `<img src="${IMG[img]}" alt="">` : `<span class="muted sm">${m.card && C(m.card)?.img ? 'Foto der Rezeptur wird verwendet' : 'Kein Foto'}</span>`;
  openDialog(isNew ? 'Neues Gericht' : 'Gericht bearbeiten', `
    <div class="dlg-ph"><div id="dlgThumb">${thumb()}</div><div class="row-btns"><button type="button" class="btn sm" id="dlgPhoto">${ico('camera')}Foto wählen</button>${img?'<button type="button" class="btn sm" id="dlgPhotoDel">Entfernen</button>':''}</div></div>
    <label class="f">Bezeichnung<input name="name" required value="${esc(m.name)}"></label>
    <label class="f">Beschreibung<input name="desc" value="${esc(m.desc)}"></label>
    <div class="fields">
      <label class="f">Kategorie<select name="section" required>${secList().map(s=>`<option ${m.section===s?'selected':''}>${esc(s)}</option>`).join('')}</select></label>
      <label class="f">Preis inkl. MwSt., €<input name="price" class="num-in" type="text" inputmode="decimal" required value="${m.price===''?'':num2(m.price)}"></label>
    </div>
    <label class="f">Rezeptur<select name="card"><option value="">— nicht verknüpft —</option>${opts.map(c=>`<option value="${c.id}" ${m.card===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>
    <div class="togs">
      <label class="tog"><input type="radio" name="veg" value="" ${!m.veg?'checked':''}><span></span>Fleisch / Fisch</label>
      <label class="tog"><input type="radio" name="veg" value="v" ${m.veg==='v'?'checked':''}><span></span>Vegetarisch</label>
      <label class="tog"><input type="radio" name="veg" value="vg" ${m.veg==='vg'?'checked':''}><span></span>Vegan</label>
    </div>
    <div class="f">Saison</div><div class="algs seasons">${SEASONS.map(([k,l])=>`<label class="algc"><input type="checkbox" name="sea" value="${k}" ${!m.seasons.length||m.seasons.includes(k)?'checked':''}><span>${l}</span></label>`).join('')}</div>
    <div class="f">Wochentage</div><div class="days">${DAYS.map(([i,l])=>`<label class="algc"><input type="checkbox" name="day" value="${i}" ${!m.days.length||m.days.includes(i)?'checked':''}><span>${l}</span></label>`).join('')}</div>
    <details class="alg-det" ${!m.card && !algList(m.alg).length ? 'open' : ''}><summary>Allergene von Hand (wenn keine Rezeptur verknüpft ist)</summary><div class="algs">${Object.entries(ALG).map(([k,v])=>`<label class="algc"><input type="checkbox" name="alg" value="${k}" ${algList(m.alg).includes(k)?'checked':''}><span><b>${k}</b>${esc(v)}</span></label>`).join('')}</div></details>
    <div class="togs"><label class="tog"><input type="checkbox" name="top" ${m.top?'checked':''}><span></span>Empfehlung des Hauses</label>
      <label class="tog"><input type="checkbox" name="show" ${m.hidden?'':'checked'}><span></span>Auf der Gästekarte zeigen</label></div>`,
    fd => { const sec = fd.get('section'); if(isNew || sec !== m.section) m.order = nextOrder(sec);
      if(m.img && m.img !== img) imgDel(m.img);
      Object.assign(m, {section:sec, name:fd.get('name').trim(), desc:fd.get('desc').trim(), price:+fd.get('price'), card:fd.get('card'), img, veg:fd.get('veg')||'', top:!!fd.get('top'), hidden:!fd.get('show'), seasons: fd.getAll('sea').length===4 ? [] : fd.getAll('sea'), days: fd.getAll('day').length===7 ? [] : fd.getAll('day').map(Number), alg: fd.getAll('alg').join(' ')}); if(isNew) S.menu.push(m); },
    {done: isNew ? ()=>`„${m.name}“ steht jetzt unter ${m.section}` : 'Gespeichert',
     del: isNew ? null : () => ask(`„${m.name}“ von der Speisekarte löschen? Die Rezeptur bleibt erhalten.`, () => { imgDel(m.img); S.menu = S.menu.filter(x=>x!==m); }),
     after: f => { const bind = () => { $('#dlgPhoto').onclick = () => pickImage(data => { const id = uid('img'); imgPut(id, data); img = id; $('#dlgThumb').innerHTML = thumb(); }); const del = $('#dlgPhotoDel'); if(del) del.onclick = () => { img = ''; $('#dlgThumb').innerHTML = thumb(); }; }; bind(); }});
}

function prodDialog(p){
  const isNew = !p; p = p || {id:uid('p'), name:'', unit:'kg', price:'', lossCold:0, lossHot:0, alg:'', pieceG:'', stock:0, minStock:0, loc:'L', supplier:''};
  const has = new Set(algList(p.alg));
  const sups = [...new Set(S.products.map(x=>x.supplier).filter(Boolean))];
  openDialog(isNew ? 'Neues Produkt' : 'Produkt bearbeiten', `
    <label class="f">Bezeichnung<input name="name" required value="${esc(p.name)}"></label>
    <div class="fields">
      <label class="f">Einheit<select name="unit">${['kg','l','Stk'].map(u=>`<option ${p.unit===u?'selected':''}>${u}</option>`).join('')}</select></label>
      <label class="f">Preis je Einheit, €<input name="price" class="num-in" type="text" inputmode="decimal" required value="${numIn(p.price)}"></label>
      <label class="f">Gewicht 1 Stk, g<input name="pieceG" class="num-in" type="text" inputmode="decimal" value="${numIn(p.pieceG)}"></label>
      <label class="f">Putzverlust, %<input name="lossCold" class="num-in" type="text" inputmode="decimal" data-max="100" value="${numIn(p.lossCold)}"></label>
      <label class="f">Garverlust, %<input name="lossHot" class="num-in" type="text" inputmode="decimal" data-max="100" value="${numIn(p.lossHot)}"></label>
    </div>
    <div class="fields">
      <label class="f">Lagerort<select name="loc">${Object.entries(LOCS).map(([k,l])=>`<option value="${k}" ${p.loc===k?'selected':''}>${l}</option>`).join('')}</select></label>
      <label class="f">Lieferant<select name="supplier"><option value="">— keiner —</option>${(S.suppliers||[]).map(s=>`<option value="${s.id}" ${p.supplier===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>
      <label class="f">Artikelnummer beim Lieferanten<input name="artNo" value="${esc(p.artNo||'')}"></label>
      <label class="f">Gebinde<input name="pack" value="${esc(p.pack||'')}" placeholder="z. B. Sack 10 kg"></label>
      <label class="f">Inhalt Gebinde in ${esc(p.unit)}<input name="packQty" class="num-in" type="text" inputmode="decimal" value="${numIn(p.packQty||'')}"></label>
      <label class="f">Mindestbestand<input name="minStock" class="num-in" type="text" inputmode="decimal" value="${numIn(p.minStock)}"></label>
      ${isNew?`<label class="f">Anfangsbestand<input name="stock" class="num-in" type="text" inputmode="decimal" value="0"></label>`:''}
    </div>
    <div class="f">Allergene</div>
    <div class="algs">${Object.entries(ALG).map(([k,v])=>`<label class="algc"><input type="checkbox" name="alg" value="${k}" ${has.has(k)?'checked':''}><span><b>${k}</b>${esc(v)}</span></label>`).join('')}</div>`,
    fd => { if(+fd.get('price') !== +p.price) markPrice(p, 'manuell'); Object.assign(p, {name:fd.get('name').trim(), unit:fd.get('unit'), price:+fd.get('price'), pieceG:fd.get('pieceG'), lossCold:+fd.get('lossCold')||0, lossHot:+fd.get('lossHot')||0, alg:fd.getAll('alg').join(' '), loc:fd.get('loc'), supplier:fd.get('supplier'), artNo:fd.get('artNo').trim(), pack:fd.get('pack').trim(), packQty:+fd.get('packQty')||0, minStock:+fd.get('minStock')||0});
      if(isNew){ p.stock = 0; S.products.push(p); const s = +fd.get('stock')||0; if(s) addMove('in', p.id, s, 'Anfangsbestand'); } },
    {del: isNew ? null : () => { const u = usage('p:'+p.id); if(u.length) return info('Produkt wird verwendet', `Es steckt in diesen Rezepturen: ${u.map(c=>c.name).join(', ')}. Entfernen Sie es dort zuerst.`); ask(`Produkt „${p.name}“ löschen?`, () => { S.products = S.products.filter(x=>x!==p); }); }});
}

function moveDlg(arg){
  const [type, pid] = String(arg).split(':');
  const prods = stockProducts().sort(byName);
  const title = {in:'Wareneingang buchen', out:'Entnahme buchen', waste:'Schwund buchen'}[type];
  const p0 = pid ? P(pid) : null;
  openDialog(title, `
    <label class="f">Artikel<select name="pid" id="mvPid" required>${p0?'':'<option value="">— wählen —</option>'}${prods.map(p=>`<option value="${p.id}" ${p0&&p0.id===p.id?'selected':''}>${esc(p.name)} · ${qtyFmt(+p.stock||0,p)}</option>`).join('')}</select></label>
    <div class="fields">
      <label class="f">Menge in <span id="mvUnit">${p0?esc(p0.unit):'Einheit'}</span><input name="qty" class="num-in" type="text" inputmode="decimal" required autocomplete="off" autofocus></label>
      ${type==='in'?`<label class="f">Preis je Einheit, €<input name="price" id="mvPrice" class="num-in" type="text" inputmode="decimal" autocomplete="off" value="${p0?num2(p0.price):''}"></label>`:''}
      <label class="f">Datum<input name="date" type="date" max="${addDays(todayStr(),1)}" value="${todayStr()}"></label>
    </div>
    ${type==='waste'?`<label class="f">Grund<select name="note">${WASTE.map(w=>`<option>${w}</option>`).join('')}</select></label>`:`<label class="f">${type==='in'?'Lieferschein / Notiz':'Notiz'}<input name="note" placeholder="${type==='in'?'z. B. Lieferschein 2240':'z. B. für Mise en place'}"></label>`}
    ${type==='in'?`<div class="togs"><label class="tog"><input type="checkbox" name="upd" checked><span></span>Preis in die Kalkulation übernehmen (gleitender Durchschnitt)</label></div>`:''}
    <div id="mvWarn"></div>`,
    (fd, f) => { const p = P(fd.get('pid')); const q = +fd.get('qty'); if(!p) return false;
      if(!(q > 0)) return dlgErr('qty', 'Bitte eine Menge größer als 0 eingeben.');
      if(dateTooFar(fd.get('date'))) return dlgErr('date', 'Das Datum liegt in der Zukunft. Buchungen sind höchstens für morgen möglich.');
      const date = fd.get('date') ? new Date(fd.get('date')+'T12:00:00').toISOString() : null;
      if(type==='in'){ const old = p.price; const pr = fd.get('price')==='' ? p.price : +fd.get('price'); if(fd.get('upd') && pr !== p.price){ const s0 = Math.max(0, +p.stock||0); p.price = Math.round((s0*p.price + q*pr)/(s0+q)*100)/100; } addMove('in', p.id, q, fd.get('note'), pr, date); if(old !== p.price) S.moves[0].prevPrice = old; }
      else { const st = +p.stock||0; const key = p.id+':'+q;
        if(q > st + 1e-9 && f.dataset.force !== key){
          $('#mvWarn').innerHTML = `<div class="warn-box dlg-warn" role="alert">${ico('spark')}<span><b>Mehr als der Bestand.</b> Im Lager sind ${esc(qtyFmt(st,p))}, gebucht würden ${esc(qtyFmt(q,p))}. Der Bestand ginge auf ${esc(qtyFmt(st-q,p))}. Bitte Menge prüfen oder zuerst den Wareneingang buchen.</span><button type="button" class="btn sm" id="mvForce">Trotzdem buchen</button></div>`;
          $('#mvForce').onclick = () => { f.dataset.force = key; f.requestSubmit(); };
          return false; }
        addMove(type, p.id, -q, fd.get('note'), null, date); }
      moveDlg.last = `${MOVE[type]}: ${p.name} ${type==='in'?'+':'−'}${qtyFmt(q,p)}` + (type==='in' ? ` · Ø-Preis ${eur(p.price)}` : (+p.stock||0) < 0 ? ` · Bestand jetzt ${qtyFmt(+p.stock||0,p)}` : ''); },
    {ok:'Buchen', done:()=>moveDlg.last, after: f => { const s = f.querySelector('#mvPid'); const clr = () => { $('#mvWarn').innerHTML = ''; delete f.dataset.force; }; s.onchange = () => { const p = P(s.value); f.querySelector('#mvUnit').textContent = p ? p.unit : 'Einheit'; const pr = f.querySelector('#mvPrice'); if(pr && p) pr.value = num2(p.price); clr(); }; f.elements.qty.addEventListener('input', clr); }});
}

/* Verkaufsbuchung: eine Buchung = eine Einheit (S.saleGroups[grp]), Storno macht alles rückgängig */
const DEMO_SALES_OPT = ['Demo-Verkäufe löschen (empfohlen)', 'Demo-Verkäufe behalten'];
function demoSalesDays(){ const real = S.salesReal || {}; return Object.keys(S.salesDays||{}).filter(d => !real[d]); }
function demoSalesText(n){ return `Es sind noch ${plural(n,'Tag','Tage')} mit erfundenen Demo-Verkäufen gespeichert. Echte und erfundene Zahlen sollten nicht gemischt werden.`; }
function demoSalesAskHtml(){ const n = demoSalesDays().length; return `<fieldset class="demo-ask"><legend>Demo-Verkäufe</legend><p class="dlg-p">${demoSalesText(n)}</p><div class="togs" style="flex-direction:column;align-items:flex-start"><label class="tog"><input type="radio" name="demoSales" value="del" required><span></span>${DEMO_SALES_OPT[0]}</label><label class="tog"><input type="radio" name="demoSales" value="keep" required><span></span>${DEMO_SALES_OPT[1]}</label></div></fieldset>`; }
function clearDemoSales(){ const ds = demoSalesDays(); ds.forEach(d => { delete S.salesDays[d]; }); S.salesDemo = false; return ds.length; }
function markRealDay(d){ S.salesReal = S.salesReal || {}; S.salesReal[d] = 1; }
function salesDlg(){
  const items = [...specialsFor(todayStr()).flatMap(sp => sp.items.map((it,i)=>({...it, id:'sp_'+sp.id+'_'+i, section:'Aktion · '+sp.name})).filter(it => it.card && C(it.card))), ...menuSorted().filter(m => m.card && C(m.card))];
  const askDemo = !!S.salesDemo && demoSalesDays().length > 0;
  openDialog('Verkäufe buchen', `<p class="dlg-p">Tragen Sie die verkauften Portionen ein, zum Beispiel aus dem Kassenbericht. Die Zutaten werden laut Rezeptur vom Lager abgebucht, auch aus Basisrezepten.</p>
    <label class="f">Datum<input name="date" type="date" max="${addDays(todayStr(),1)}" value="${todayStr()}"></label>
    <ul class="sales">${items.map(m=>`<li><span>${esc(dishLabel(m))}<small class="muted">${esc(m.section)}</small></span><span class="stepper"><button type="button" class="icon-btn" data-step="-1" aria-label="weniger">${ico('minus')}</button><input name="s_${m.id}" type="number" min="0" step="1" value="0" inputmode="numeric" aria-label="Portionen ${esc(dishLabel(m))}"><button type="button" class="icon-btn" data-step="1" aria-label="mehr">${ico('plus')}</button></span></li>`).join('') || '<li class="muted">Noch kein Gericht mit Rezeptur. Verkäufe lassen sich erst buchen, wenn eine Rezeptur verknüpft ist.</li>'}</ul>
    <div class="kv"><span>Portionen gesamt</span><span id="salesN">0</span><span>Wareneinsatz</span><span id="salesC">${eur(0)}</span></div>
    ${askDemo ? demoSalesAskHtml() : ''}
    <div id="salesWarn"></div>`,
    (fd, f) => { const acc = new Map(); let n = 0; const dk = fd.get('date') || todayStr();
      if(dateTooFar(dk)) return dlgErr('date', 'Das Datum liegt in der Zukunft. Buchungen sind höchstens für morgen möglich.');
      const date = new Date(dk+'T20:00:00').toISOString(); const sold = [];
      items.forEach(m => { const q = Math.max(0, Math.floor(+fd.get('s_'+m.id)||0)); if(q>0){ n += q; explode(C(m.card), q, acc); sold.push([m, q]); } });
      if(!n){ $('#salesWarn').innerHTML = `<p class="f-err" role="alert">Noch keine Portionen eingetragen. Bitte bei mindestens einem Gericht die Menge erhöhen.</p>`; return false; }
      const short = [...acc.entries()].map(([pid,q]) => ({p:P(pid), q:Math.round(q*1000)/1000})).filter(x => x.p && x.q > (+x.p.stock||0) + 1e-9);
      const key = dk+'|'+sold.map(([m,q])=>m.id+':'+q).join(',');
      if(short.length && f.dataset.force !== key){
        $('#salesWarn').innerHTML = `<div class="warn-box dlg-warn" role="alert">${ico('spark')}<span><b>Bestand reicht nicht für ${plural(short.length,'Artikel','Artikel')}.</b> ${short.slice(0,6).map(x=>`${esc(x.p.name)}: Bestand ${esc(qtyFmt(+x.p.stock||0,x.p))}, gebraucht ${esc(qtyFmt(x.q,x.p))}`).join(' · ')}${short.length>6?' …':''}. Fehlt ein Wareneingang?</span><button type="button" class="btn sm" id="salesForce">Trotzdem buchen</button></div>`;
        $('#salesForce').onclick = () => { f.dataset.force = key; f.requestSubmit(); };
        return false; }
      if(askDemo && fd.get('demoSales') === 'del') clearDemoSales();
      const grp = uid('sb'); const rows = []; S.salesDays = S.salesDays || {};
      sold.forEach(([m, q]) => { if(String(m.id).startsWith('sp_')) return; const g = Math.round(q*(+m.price||0)*100)/100; const day = S.salesDays[dk] = S.salesDays[dk] || []; const r = day.find(x=>x[0]===m.id); if(r){ r[1] += q; r[2] = Math.round((r[2] + g)*100)/100; } else day.push([m.id, q, g]); rows.push([m.id, q, g]); });
      if(rows.length) markRealDay(dk);
      acc.forEach((q,pid) => { const before = S.moves.length; addMove('sale', pid, -Math.round(q*1000)/1000, `Verkauf ${fmtDate(date)}`, null, date); if(S.moves.length > before) S.moves[0].grp = grp; });
      S.saleGroups = S.saleGroups || {}; S.saleGroups[grp] = {day:dk, n, rows, gross: Math.round(rows.reduce((a,r)=>a+r[2],0)*100)/100};
      const neg = [...acc.keys()].map(P).filter(p => p && (+p.stock||0) < 0).length; salesDlg.last = `${plural(n,'Portion','Portionen')} gebucht, ${acc.size} Artikel abgebucht` + (neg ? ` · ${neg} Artikel im Minus, Wareneingang prüfen` : ''); },
    {ok:'Abbuchen', done:()=>salesDlg.last, after: f => {
      const upd = () => { let n = 0, c = 0; items.forEach(m => { const q = +f.elements['s_'+m.id].value||0; n += q; c += q*menuCalc(m).cost; }); $('#salesN').textContent = num(n); $('#salesC').textContent = eur(c); $('#salesWarn').innerHTML = ''; delete f.dataset.force; };
      f.oninput = upd;
      f.querySelectorAll('[data-step]').forEach(b => b.onclick = () => { const i = b.parentNode.querySelector('input'); i.value = Math.max(0, (+i.value||0) + +b.dataset.step); upd(); });
    }});
}
/* Storno: Einzelbuchung oder ganze Verkaufsbuchung */
function undoMove(m){ const p = P(m.pid); if(p) p.stock = Math.round(((+p.stock||0) - m.qty)*1000)/1000; if(p && m.prevPrice != null) p.price = m.prevPrice; S.moves = S.moves.filter(x=>x!==m); }
function undoSaleGroup(grp){
  const ms = S.moves.filter(m => m.grp === grp); ms.forEach(undoMove);
  const g = (S.saleGroups||{})[grp];
  if(g && g.rows && S.salesDays && S.salesDays[g.day]){ const day = S.salesDays[g.day];
    g.rows.forEach(([mid,q,gr]) => { const r = day.find(x=>x[0]===mid); if(!r) return; r[1] = Math.round((r[1]-q)*1000)/1000; r[2] = Math.round((r[2]-gr)*100)/100; });
    S.salesDays[g.day] = day.filter(r => r[1] > 1e-9); if(!S.salesDays[g.day].length){ delete S.salesDays[g.day]; if(S.salesReal) delete S.salesReal[g.day]; } }
  if(S.saleGroups) delete S.saleGroups[grp];
  return ms.length;
}

function salesDlg(){
  const items = menuSorted().filter(m => m.card && C(m.card));
  openDialog('Verkäufe buchen', `<p class="dlg-p">Tragen Sie die verkauften Portionen ein, zum Beispiel aus dem Kassenbericht. Die Zutaten werden laut Rezeptur vom Lager abgebucht, auch aus Basisrezepten.</p>
    <label class="f">Datum<input name="date" type="date" value="${todayStr()}"></label>
    <ul class="sales">${items.map(m=>`<li><span>${esc(m.name)}<small class="muted">${esc(m.section)}</small></span><span class="stepper"><button type="button" class="icon-btn" data-step="-1" aria-label="weniger">${ico('minus')}</button><input name="s_${m.id}" type="number" min="0" step="1" value="0" inputmode="numeric" aria-label="Portionen"><button type="button" class="icon-btn" data-step="1" aria-label="mehr">${ico('plus')}</button></span></li>`).join('')}</ul>
    <div class="kv"><span>Portionen gesamt</span><span id="salesN">0</span><span>Wareneinsatz</span><span id="salesC">${eur(0)}</span></div>`,
    fd => { const acc = new Map(); let n = 0; const date = fd.get('date') ? new Date(fd.get('date')+'T20:00:00').toISOString() : null;
      items.forEach(m => { const q = +fd.get('s_'+m.id)||0; if(q>0){ n += q; explode(C(m.card), q, acc); } });
      if(!n) return false;
      acc.forEach((q,pid) => addMove('sale', pid, -Math.round(q*1000)/1000, `Verkauf ${fmtDate(date||new Date().toISOString())}`, null, date));
      salesDlg.last = `${n} Portionen gebucht, ${acc.size} Artikel abgebucht`; },
    {ok:'Abbuchen', done:()=>salesDlg.last, after: f => {
      const upd = () => { let n = 0, c = 0; items.forEach(m => { const q = +f.elements['s_'+m.id].value||0; n += q; c += q*menuCalc(m).cost; }); $('#salesN').textContent = n; $('#salesC').textContent = eur(c); };
      f.oninput = upd;
      f.querySelectorAll('[data-step]').forEach(b => b.onclick = () => { const i = b.parentNode.querySelector('input'); i.value = Math.max(0, (+i.value||0) + +b.dataset.step); upd(); });
    }});
}

function newCard(type, fromMenu){
  const c = {id:uid(type==='semi'?'semi':'dish'), no:S.settings.nextNo++, name: fromMenu ? fromMenu.name : (type==='semi'?'Neues Basisrezept':'Neues Gericht'), type, category: fromMenu ? fromMenu.section : (type==='semi'?'Basisrezepte':''), yieldG:'', img:'', steps:[{t:'',img:''}], items:[{ref:'',qty:'',net:''}]};
  S.cards.push(c); if(fromMenu) fromMenu.card = c.id;
  go('cards', c.id); save(); toast('Rezeptur angelegt');
}

function printCard(id){
  const c = C(id), t = totals(c);
  $('#print').innerHTML = `
    <div class="meta"><span>${esc(S.settings.name)}</span><span>Datum: ${new Date().toLocaleDateString('de-AT')}</span></div>
    <h1>Rezeptur Nr. ${c.no||''}</h1>
    <div><b>${esc(c.name)}</b> · ${c.type==='semi'?'Basisrezept':'Gericht'} · ${esc(c.category||'')}</div>
    <div>Ausbeute: ${num(c.yieldG||t.out)} g ${c.type==='semi'?'(Charge)':'(1 Portion)'}</div>
    ${c.img&&IMG[c.img]?`<img class="pr-ph" src="${IMG[c.img]}" alt="">`:''}
    <table><thead><tr><th>Nr.</th><th>Zutat</th><th class="r">Brutto</th><th>Einh.</th><th class="r">Netto, g</th><th class="r">Fertig, g</th><th class="r">Betrag, €</th></tr></thead>
    <tbody>${c.items.map((it,i)=>{const l=t.lines[i];return `<tr><td>${i+1}</td><td>${esc(l.name)}</td><td class="r">${num(+it.qty,2)}</td><td>${l.unit}</td><td class="r">${num(l.net,1)}</td><td class="r">${num(l.out,1)}</td><td class="r">${num(l.cost,2)}</td></tr>`}).join('')}</tbody>
    <tfoot><tr><td></td><td>Summe</td><td class="r">${num(t.gross)}</td><td></td><td class="r">${num(t.net)}</td><td class="r">${num(t.out)}</td><td class="r">${num(t.cost,2)}</td></tr></tfoot></table>
    <h2>Zubereitung</h2><ol class="pr-steps">${(c.steps||[]).map(s=>`<li>${esc(s.t)}${s.img&&IMG[s.img]?`<br><img src="${IMG[s.img]}" alt="">`:''}</li>`).join('')}</ol>
    <p><b>Allergene:</b> ${[...t.alg].sort().map(a=>`${a} (${ALG[a]||''})`).join(', ') || 'keine'}</p>
    <div class="sign"><span>Küchenchef ____________</span><span>Kalkulation ____________</span></div>`;
  document.body.classList.remove('print-menu'); window.print();
}
function printMenu(){ $('#print').innerHTML = guestHtml(); document.body.classList.add('print-menu'); window.print(); }

function backupName(){ return 'dahuam202-kueche-'+todayStr()+'.json'; }
function exportData(){
  const nImg = Object.keys(IMG).length;
  openDialog('Sicherung erstellen', `<p class="dlg-p">Die Sicherung ist eine Datei mit allen Daten dieser App. Aufheben, zum Beispiel auf einem USB-Stick oder in der Cloud. Zurückholen unter „Einstellungen“ mit „Sicherung laden“.</p>
    <div class="togs"><label class="tog"><input type="checkbox" id="expImg" ${nImg?'checked':''}><span></span>Fotos einschließen (${nImg})</label></div>
    <div class="row-btns"><button type="button" class="btn primary" id="dlBtn">${ico('download')}Datei speichern</button><button type="button" class="btn" id="copyBtn">${ico('copy')}Als Text kopieren</button></div>
    <p class="hint" id="expMsg" role="status">${esc(backupName())}</p>`, null, {cancel:'Schließen'});
  const json = () => JSON.stringify($('#expImg').checked ? {...S, images:IMG} : S);
  $('#dlBtn').onclick = async () => { const ok = await saveFile(backupName(), new Blob([json()], {type:'application/json'})); $('#expMsg').textContent = ok ? `Gespeichert als ${backupName()}` : 'Nicht gespeichert. „Als Text kopieren“ funktioniert immer.'; if(ok) toast('Sicherung gespeichert'); };
  $('#copyBtn').onclick = () => { const txt = json(); const fb = () => { let ta = $('#expTxt'); if(!ta){ ta = document.createElement('textarea'); ta.id = 'expTxt'; ta.className = 'code'; ta.readOnly = true; ta.setAttribute('aria-label','Sicherung als Text'); $('#expMsg').insertAdjacentElement('afterend', ta); } ta.value = txt; ta.select(); toast('Text markiert, mit Strg+C kopieren'); }; const pr = navigator.clipboard?.writeText(txt); if(pr) pr.then(()=>toast('Kopiert'), fb); else fb(); };
}
/* Sicherheitskopie vor dem Überschreiben aller Daten (ohne Fotos; die bleiben im Browser gespeichert) */
const SAFETY_KEY = KEY + '_safety';
function safetyStore(why){ try { localStorage.setItem(SAFETY_KEY, JSON.stringify({at:new Date().toISOString(), why, data:S})); return true; } catch(e){ return false; } }
function safetyGet(){ try { return JSON.parse(localStorage.getItem(SAFETY_KEY)); } catch(e){ return null; } }
function safetyClear(){ try { localStorage.removeItem(SAFETY_KEY); } catch(e){} }
function loadBackup(d){
  const imgs = d.images; delete d.images; const nd = migrate(d); if(!nd) throw 0;
  const old = S; const kept = safetyStore('vor „Sicherung laden“'); S = nd;
  try { render(); } catch(e2){ S = old; render(); throw e2; }
  if(imgs) Object.entries(imgs).forEach(([k,v])=>imgPut(k,v)); save(); go('dash');
  toast(kept ? 'Sicherung geladen' : 'Sicherung geladen (ohne Sicherheitskopie, Speicher voll)', kept ? {label:'Rückgängig', ms:8000, action:safetyRestore} : null);
}
function safetyRestore(){ const sf = safetyGet(); if(!sf || !sf.data) return; const nd = migrate(sf.data); if(!nd){ toast('Sicherheitskopie ist nicht lesbar'); return; } S = nd; safetyClear(); save(); go('dash'); toast('Letzte Daten wiederhergestellt'); }

/* ---------- Schnellsuche ---------- */
let palSel = 0, palItems = [];
function palData(){
  return [
    ...TABS.map(([k,l])=>({g:'Bereich', n:l, s:'', run:()=>go(k)})),
    {g:'Bereich', n:'Gästekarte ansehen', s:'Speisekarte', run:()=>{ view.mtab='guest'; go('menu'); }},
    {g:'Bereich', n:'Saison & Aktionen', s:'Speisekarte', run:()=>{ view.mtab='plan'; go('menu'); }},
    {g:'Aktion', n:'Neue Aktion / Spezialität', s:'', run:()=>specialDialog()},
    {g:'Bereich', n:'Bestellungen', s:'Lager & Einkauf', run:()=>{ view.stab='bestellung'; view.order=null; go('stock'); }},
    {g:'Bereich', n:'Lieferanten', s:'Lager & Einkauf', run:()=>{ view.stab='lieferanten'; view.order=null; go('stock'); }},
    ...(S.suppliers||[]).map(sp=>({g:'Bestellen', n:sp.name, s:CHANNELS[sp.channel], run:()=>{ const o = newOrder(sp.id); save(); view.stab='bestellung'; view.order=o.id; go('stock'); }})),
    {g:'Bereich', n:'Inventur', s:'Lager', run:()=>{ view.stab='inventur'; go('stock'); }},
    {g:'Bereich', n:'Bestellvorschlag', s:'Lager', run:()=>{ view.stab='bestellung'; go('stock'); }},
    {g:'Aktion', n:'Wareneingang buchen', s:'', run:()=>moveDlg('in')},
    {g:'Aktion', n:'Verkäufe buchen', s:'', run:()=>salesDlg()},
    {g:'Aktion', n:'Schwund buchen', s:'', run:()=>moveDlg('waste')},
    {g:'Aktion', n:'Neues Gericht auf die Speisekarte', s:'', run:()=>menuDialog()},
    {g:'Aktion', n:'Neue Rezeptur anlegen', s:'', run:()=>newCard('dish')},
    {g:'Aktion', n:'Neues Produkt anlegen', s:'', run:()=>prodDialog()},
    ...S.menu.map(m=>({g:'Speisekarte', n:dishLabel(m), s:eur(m.price)+' · '+m.section, run:()=> m.card ? go('cards', m.card) : menuDialog(m)})),
    ...S.cards.map(c=>({g:'Rezeptur', n:c.name, s:(c.type==='semi'?'Basisrezept':'Gericht')+' · Nr. '+c.no, run:()=>go('cards', c.id)})),
    ...S.products.map(p=>({g:'Produkt', n:p.name, s:p.noStock?eur(p.price):qtyFmt(+p.stock||0,p)+' auf Lager', run:()=>prodDialog(p)})),
  ];
}
function palOpen(){ $('#pal').hidden = false; const i = $('#palIn'); i.value = ''; palFilter(''); i.focus(); }
function palClose(){ $('#pal').hidden = true; }
function palFilter(q){
  q = q.trim().toLowerCase();
  const all = palData();
  palItems = (q ? all.filter(x => (x.n+' '+x.s+' '+x.g).toLowerCase().includes(q)) : all.filter(x=>x.g==='Bereich'||x.g==='Aktion')).slice(0,40);
  palSel = 0; palDraw();
}
function palDraw(){
  $('#palList').innerHTML = palItems.length ? palItems.map((x,i)=>`<li><button type="button" class="${i===palSel?'sel':''}" data-pal="${i}"><span class="pg">${esc(x.g)}</span><span class="pn">${esc(x.n)}</span><span class="ps">${esc(x.s)}</span></button></li>`).join('') : '<li class="empty">Nichts gefunden.</li>';
  $('#palList .sel')?.scrollIntoView({block:'nearest'});
}

/* ---------- Navigation ---------- */
function go(tab, card=null){
  if(tab==='stock' && BUY.includes(view.stab)) tab = 'buy';
  view = {...view, tab, card, q: tab===view.tab ? view.q : '', pq: tab===view.tab ? view.pq : ''};
  if(card) view.sim = null;
  try { if(location.hash.slice(1) !== tab) history.replaceState(null, '', '#'+tab); } catch(e){}
  render(); window.scrollTo({top:0});
}
function setTheme(t){ document.documentElement.dataset.theme = t; try { localStorage.setItem(KEY+'_theme', t); } catch(e){} themeIcon(); }
function themeIcon(){ const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme==='dark' : matchMedia('(prefers-color-scheme: dark)').matches; document.querySelectorAll('[data-act=theme]').forEach(b => { b.innerHTML = ico(dark?'sun':'moon'); b.title = dark ? 'Helles Design' : 'Dunkles Design'; }); return dark; }

/* ---------- Ereignisse ---------- */
document.addEventListener('click', e => {
  const tab = e.target.closest('[data-tab]');
  if(tab){ view.order = null; view.recv = null; const tt = tab.dataset.tab; if(tt==='stock' && BUY.includes(view.stab)) view.stab = 'bestand'; if(tt==='buy' && !BUY.includes(view.stab)) view.stab = 'bestellung'; go(tt); return; }
  const pi = e.target.closest('[data-pal]');
  if(pi){ const x = palItems[+pi.dataset.pal]; palClose(); x && x.run(); return; }
  if(e.target.id === 'pal'){ palClose(); return; }
  const el = e.target.closest('[data-act]'); if(!el || el.closest('#dlg') && !el.closest('#dlgForm')) return;
  const id = el.dataset.id, act = el.dataset.act;
  const c = view.card ? C(view.card) : null;
  switch(act){
    case 'theme': setTheme(themeIcon() ? 'light' : 'dark'); break;
    case 'palette': palOpen(); break;
    case 'goTab': go(id); break;
    case 'goMenu': view.sec = id; view.mtab = 'calc'; go('menu'); break;
    case 'goStock': view.stab = id; go('stock'); break;
    case 'sec': view.sec = id; render(); break;
    case 'mtab': view.mtab = id; render(); break;
    case 'stab': view.stab = id; view.order = null; view.recv = null; render(); break;
    case 'loc': view.loc = id; render(); break;
    case 'mtype': view.mtype = id; render(); break;
    case 'gstyle': S.settings.guest.style = id; save(); render(); break;
    case 'newMenu': menuDialog(); break;
    case 'editMenu': menuDialog(S.menu.find(m=>m.id===id)); break;
    case 'photoMenu': setPhoto(S.menu.find(m=>m.id===id)); break;
    case 'toMenu': { const cc = C(id); const t = totals(cc); const rec = t.cost/(S.settings.target/100)*(1+S.settings.vat/100); const sec = secList().includes(cc.category) ? cc.category : secList().includes(SEC_MAP[cc.category]) ? SEC_MAP[cc.category] : secList()[0];
      menuDialog(null, {name:cc.name, section:sec, card:cc.id, price: Math.max(0.9, Math.ceil(rec) - 0.1).toFixed(2)}); break; }
    case 'openCard': go('cards', id); break;
    case 'backCards': go('cards'); break;
    case 'newCardFor': newCard('dish', S.menu.find(m=>m.id===id)); break;
    case 'newCard': newCard(id); break;
    case 'ctype': view.ctype = id; render(); break;
    case 'photoCard': setPhoto(C(id)); break;
    case 'photoCardDel': { const cc = C(id); imgDel(cc.img); cc.img = ''; save(); render(); toast('Foto entfernt'); break; }
    case 'addLine': c.items.push({ref:'',qty:'',net:''}); save(); render(); setTimeout(()=>document.getElementById('ref-'+(c.items.length-1))?.focus(),0); break;
    case 'delLine': { const i = +id, it = c.items[i]; if(!it) break; c.items.splice(i,1); save(); render(); const cid = c.id; const nm = refObj(it.ref) ? line(it,0).name : 'Leere Zeile'; toast(`${nm} entfernt`, {action: () => { const cc = C(cid); if(!cc) return; cc.items.splice(Math.min(i, cc.items.length), 0, it); save(); render(); toast('Wiederhergestellt'); }}); break; }
    case 'stepAdd': c.steps.push({t:'',img:''}); save(); render(); setTimeout(()=>document.getElementById('st-'+(c.steps.length-1))?.focus(),0); break;
    case 'stepDel': { const i = +id, st = c.steps[i]; if(!st) break; c.steps.splice(i,1); save(); render(); const cid = c.id; let undone = false; toast(`Schritt ${i+1} gelöscht`, {action: () => { const cc = C(cid); if(!cc) return; undone = true; cc.steps.splice(Math.min(i, cc.steps.length), 0, st); save(); render(); toast('Wiederhergestellt'); }}); if(st.img) setTimeout(() => { if(!undone) imgDel(st.img); }, 6500); break; }
    case 'stepMove': { const [i,d] = id.split(':').map(Number); const j = i+d; [c.steps[i], c.steps[j]] = [c.steps[j], c.steps[i]]; save(); render(); break; }
    case 'stepPhoto': setPhoto(c.steps[+id]); break;
    case 'stepPhotoDel': imgDel(c.steps[+id].img); c.steps[+id].img = ''; save(); render(); break;
    case 'simTo': { const r = $('#sim'); view.sim.price = Math.min(+r.max, Math.max(+r.min, +id)); r.value = view.sim.price; r.dispatchEvent(new Event('input',{bubbles:true})); break; }
    case 'applySim': { const m = S.menu.find(x=>x.id===id); m.price = Math.round(view.sim.price*10)/10; save(); render(); toast('Verkaufspreis auf '+eur(m.price)+' gesetzt'); break; }
    case 'dupCard': { const src = C(id); const cp = JSON.parse(JSON.stringify(src)); cp.id = uid(src.type); cp.no = S.settings.nextNo++; cp.name += ' (Kopie)'; cp.img = ''; cp.steps.forEach(s=>s.img=''); S.cards.push(cp); save(); go('cards', cp.id); toast('Kopie angelegt (ohne Fotos)'); break; }
    case 'delCard': { const src = C(id); const u = usage('c:'+id); if(u.length){ info('Basisrezept wird verwendet', `Es steckt in diesen Rezepturen: ${u.map(x=>x.name).join(', ')}. Entfernen Sie es dort zuerst.`); break; }
      ask(`Rezeptur „${src.name}“ löschen? Die Gerichte bleiben auf der Speisekarte, aber ohne Rezeptur.`, () => { imgDel(src.img); (src.steps||[]).forEach(s=>imgDel(s.img)); S.cards = S.cards.filter(x=>x.id!==id); S.menu.forEach(m=>{ if(m.card===id) m.card=''; }); view.card = null; }); break; }
    case 'printCard': printCard(id); break;
    case 'printMenu': printMenu(); break;
    case 'addSec': { let n = 'Neue Kategorie', i = 2; while(secList().includes(n)) n = 'Neue Kategorie '+i++; S.settings.sections.push(n); save(); render(); setTimeout(()=>{ const inp = document.querySelector(`[data-secname="${S.settings.sections.length-1}"]`); inp?.focus(); inp?.select(); },0); break; }
    case 'secMove': { const [i,d] = id.split(':').map(Number); const s = S.settings.sections; [s[i], s[i+d]] = [s[i+d], s[i]]; save(); render(); break; }
    case 'secDel': S.settings.sections.splice(+id,1); save(); render(); toast('Kategorie gelöscht'); break;
    case 'secSort': { const s = secList()[+id]; S.menu.filter(m=>m.section===s).sort((a,b)=>a.price-b.price).forEach((m,i)=>m.order=i); save(); render(); toast(`${s}: nach Preis sortiert`); break; }
    case 'itemMove': { const [mid,d] = id.split(':'); moveItem(mid, +d); save(); render(); break; }
    case 'itemHide': { const m = S.menu.find(x=>x.id===id); m.hidden = !m.hidden; save(); render(); toast(m.hidden ? `„${m.name}“ ausgeblendet` : `„${m.name}“ wird angezeigt`); break; }
    case 'moveDlg': moveDlg(id); break;
    case 'sales': salesDlg(); break;
    case 'moveUndo': { const m = S.moves.find(x=>x.id===id); if(!m) break; const p = P(m.pid);
      if(m.grp){ const g = (S.saleGroups||{})[m.grp] || {}; const k = S.moves.filter(x=>x.grp===m.grp).length;
        ask(`${g.n ? `Verkaufsbuchung vom ${fmtDate(m.date)} (${plural(g.n,'Portion','Portionen')})` : `Sammelbuchung vom ${fmtDate(m.date)}`} komplett stornieren? ${plural(k,'Artikel wird','Artikel werden')} zurück ins Lager gebucht${g.rows && g.rows.length ? `, ${eur(g.gross)} Umsatz werden aus der Auswertung entfernt` : g.n ? '' : '; der Umsatz in der Auswertung bleibt unverändert'}.`, () => { undoSaleGroup(m.grp); }, 'Stornieren'); break; }
      ask(`Buchung stornieren? ${MOVE[m.type]} ${p?p.name:''} ${qtyFmt(m.qty,p)} wird rückgängig gemacht.`, () => { undoMove(m); }, 'Stornieren'); break; }
    case 'invStart': S.invDraft = {date:new Date().toISOString(), counts:{}}; save(); render(); toast('Inventur gestartet'); break;
    case 'invCancel': ask('Laufende Inventur verwerfen? Die gezählten Mengen gehen verloren.', () => { S.invDraft = null; }, 'Verwerfen'); break;
    case 'invFinish': { const d = S.invDraft; const items = stockProducts().filter(p => d.counts[p.id]!==undefined && d.counts[p.id]!=='' && +d.counts[p.id] >= 0);
      if(!items.length){ info('Noch nichts gezählt', 'Tragen Sie mindestens eine gezählte Menge ein.'); break; }
      const diff = items.reduce((s,p)=>s+(d.counts[p.id]-(+p.stock||0))*(+p.price||0),0);
      ask(`Inventur mit ${items.length} gezählten Artikeln abschließen? Differenz: ${signedEur(diff)}${diff < -0.005 ? ' (Fehlbestand)' : diff > 0.005 ? ' (Mehrbestand)' : ''}. Die Bestände werden auf die gezählten Mengen gesetzt.`, () => {
        items.forEach(p => { const df = d.counts[p.id]-(+p.stock||0); if(Math.abs(df) > 1e-9) addMove('inv', p.id, Math.round(df*1000)/1000, 'Inventurdifferenz'); });
        S.inventories.unshift({id:uid('inv'), date:new Date().toISOString(), counted:items.length, value:stockValue(), diff}); S.invDraft = null; }, 'Abschließen'); break; }
    case 'ordCopy_v1': { const txt = orderText(id); const pr = navigator.clipboard?.writeText(txt); const fb = () => openDialog('Bestelltext', `<textarea class="code" readonly id="ordTxt">${esc(txt)}</textarea>`, null, {cancel:'Schließen', after:()=>$('#ordTxt').select()});
      if(pr) pr.then(()=>toast('Bestelltext kopiert'), fb); else fb(); break; }
    case 'ordBook_v1': { const list = lowStock().filter(p => (p.supplier||'Ohne Lieferant')===id);
      ask(`Lieferung von ${id} mit ${list.length} Artikeln einbuchen?`, () => { list.forEach(p => { const q = +(view.order[p.id] ?? orderSuggest(p)); if(q>0) addMove('in', p.id, q, 'Lieferung laut Bestellung'); delete view.order[p.id]; }); }, 'Einbuchen'); break; }
    case 'newProd': prodDialog(); break;
    case 'editProd': prodDialog(P(id)); break;
    case 'export': exportData(); break;
    case 'reset': ask('Alle Daten durch die Demodaten ersetzen? Ihre Änderungen und Lagerbuchungen gehen verloren. Fotos bleiben gespeichert.', () => { safetyStore('vor „Demodaten wiederherstellen“'); S = seed(); }, 'Ersetzen'); break;
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  if(t.id === 'mq' || t.id === 'cq' || t.id === 'pq'){
    if(t.id === 'pq') view.pq = t.value; else view.q = t.value;
    const pos = t.selectionStart; render(); const n = $('#'+t.id); n.focus(); try { n.setSelectionRange(pos,pos); } catch(err){}
  }
  if(t.id === 'sim'){
    const c = C(view.card); view.sim.price = +t.value;
    $('#simVal').textContent = eur(+t.value); $('#simOut').innerHTML = simHtml(totals(c).cost, +t.value);
    const ap = $('#simApply'); if(ap){ const m = S.menu.find(x=>x.card===c.id); ap.hidden = Math.abs(+t.value - +m.price) < 0.05; }
  }
  if(t.id === 'portions'){ view.portions = Math.max(1, +t.value||1); $('#prodOut').innerHTML = prodHtml(C(view.card), view.portions); }
  if(t.id === 'palIn') palFilter(t.value);
  if(t.dataset.inv){ const v = t.value.trim()==='' ? '' : numParse(t.value); const ok = v === '' || (isFinite(v) && v >= 0); t.classList.toggle('bad-in', !ok); if(ok){ S.invDraft.counts[t.dataset.inv] = v; t.dataset.old = t.value; save(); invUpdate(t.dataset.inv); } }
  if(t.dataset.step != null && t.closest('#app')){ const c = C(view.card); c.steps[+t.dataset.step].t = t.value; save(); autosize(t); }
  if(t.classList.contains('title-in')) autosize(t);
  if(t.dataset.gs){ S.settings.guest[t.dataset.gs] = t.value; save(); $('.guest-prev').innerHTML = guestHtml(); }
});

document.addEventListener('keydown', e => {
  if($('#dlg').open && $('#pal').hidden) { if(e.key === 'Enter' && e.target.matches('input[data-li],input[data-pp],input[data-cf],textarea.title-in,input[data-secname],input[data-ord]')) {} if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k') e.preventDefault(); return; }
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); $('#pal').hidden ? palOpen() : palClose(); return; }
  if(!$('#pal').hidden){
    if(e.key === 'Escape'){ palClose(); }
    else if(e.key === 'ArrowDown'){ e.preventDefault(); palSel = Math.min(palItems.length-1, palSel+1); palDraw(); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); palSel = Math.max(0, palSel-1); palDraw(); }
    else if(e.key === 'Enter'){ e.preventDefault(); const x = palItems[palSel]; palClose(); x && x.run(); }
    return;
  }
  if(e.key === 'Enter' && e.target.matches('input[data-inv]')){ e.preventDefault(); const all = [...document.querySelectorAll('input[data-inv]')]; const n = all[all.indexOf(e.target)+1]; n ? (n.focus(), n.select()) : e.target.blur(); return; }
  if(e.key === 'Enter' && e.target.matches('input[data-li],input[data-pp],input[data-cf],textarea.title-in,input[data-secname],input[data-ord]')){ e.preventDefault(); e.target.blur(); }
  if(e.key === '/' && !e.target.closest('input,textarea,select')){ e.preventDefault(); palOpen(); }
});

document.addEventListener('change', e => {
  const t = e.target, c = view.card ? C(view.card) : null;
  if(t.id === 'imgFile'){ const f = t.files[0]; if(!f) return; resizeImage(f).then(d => { pickCb && pickCb(d); pickCb = null; }, () => info('Foto nicht lesbar', 'Bitte ein JPG- oder PNG-Bild wählen.')); return; }
  if(t.dataset.cf && c){ const f = t.dataset.cf; c[f] = f==='yieldG' ? (t.value===''?'':+t.value) : t.value; save(); softRender(); toast('Gespeichert'); return; }
  if(t.dataset.li != null && c){ const it = c.items[+t.dataset.li]; const f = t.dataset.lf; it[f] = f==='ref' ? t.value : (t.value===''?'':+t.value); if(f==='ref') it.net = ''; save(); softRender(); return; }
  if(t.dataset.step != null && t.closest('#app')){ toast('Gespeichert'); return; }
  if(t.dataset.pp){ const p = P(t.dataset.pp); const old = +p[t.dataset.pf]; p[t.dataset.pf] = Math.max(0, +t.value || 0); save(); softRender(); if(t.dataset.pf==='price' && old !== p.price) toast(`${p.name}: ${eur(old)} → ${eur(p.price)} · ${usage('p:'+p.id).length} Rezepturen neu berechnet`); return; }
  if(t.dataset.sf){ const f = t.dataset.sf; S.settings[f] = f==='name' ? t.value : f==='target' ? Math.min(100, Math.max(1, +t.value || 28)) : Math.min(100, Math.max(0, +t.value || 0)); if(f!=='name') t.value = S.settings[f]; save(); toast('Gespeichert'); return; }
  if(t.dataset.gf){ S.settings.guest[t.dataset.gf] = t.checked; save(); $('.guest-prev').innerHTML = guestHtml(); return; }
  if(t.dataset.secname != null){ const i = +t.dataset.secname, old = S.settings.sections[i], nv = t.value.trim(); if(!nv || nv===old){ t.value = old; return; }
    if(S.settings.sections.includes(nv)){ t.value = old; toast('Diese Kategorie gibt es schon'); return; }
    S.settings.sections[i] = nv; S.menu.forEach(m=>{ if(m.section===old) m.section = nv; }); S.cards.forEach(x=>{ if(x.category===old) x.category = nv; }); if(view.sec===old) view.sec = nv; save(); render(); toast('Kategorie umbenannt'); return; }
  if(t.dataset.ord){ view.order[t.dataset.ord] = Math.max(0, +t.value||0); softRender(); return; }
  if(t.id === 'importFile' && t.files[0]){
    const r = new FileReader(); const fname = t.files[0].name;
    r.onload = () => { let d; try { d = JSON.parse(r.result); if(!d || typeof d !== 'object' || !Array.isArray(d.products) || !Array.isArray(d.cards) || !Array.isArray(d.menu)) throw 0; } catch(err){ info('Laden fehlgeschlagen', 'Die Datei ist keine Sicherung dieser App. Wählen Sie eine .json-Datei, die mit „Sicherung erstellen“ gespeichert wurde.'); return; }
      openDialog('Sicherung laden?', `<p class="dlg-p">Die Datei <b>${esc(fname)}</b> enthält ${plural(d.menu.length,'Gericht','Gerichte')}, ${plural(d.cards.length,'Rezeptur','Rezepturen')} und ${plural(d.products.length,'Produkt','Produkte')}.</p><p class="dlg-p">Alle aktuellen Daten (${plural(S.menu.length,'Gericht','Gerichte')}, ${plural(S.cards.length,'Rezeptur','Rezepturen')}, ${plural(S.products.length,'Produkt','Produkte')}, Lager, Bestellungen, Verkäufe) werden ersetzt. Vorher wird automatisch eine Sicherheitskopie angelegt; unter „Einstellungen“ lässt sie sich einmal zurückholen.</p>`,
        () => { setTimeout(() => { try { loadBackup(d); } catch(err){ info('Laden fehlgeschlagen', 'Die Datei ist keine Sicherung dieser App. Wählen Sie eine .json-Datei, die mit „Sicherung erstellen“ gespeichert wurde.'); } }, 0); }, {ok:'Daten ersetzen', toast:false}); };
    r.readAsText(t.files[0]); t.value = '';
  }
});


/* =====================================================================
   Saisonkarten & Aktionen (Spezialitäten für 1–2 Tage)
   ===================================================================== */
const SEASONS = [['winter','Winter'],['fruehling','Frühling'],['sommer','Sommer'],['herbst','Herbst']];
const SEASON_RANGE = {winter:['12-01','04-15'], fruehling:['04-16','06-14'], sommer:['06-15','09-15'], herbst:['09-16','11-30']};
const ORN = {
  schnee:'<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M12 2l-2.2 2.2M12 2l2.2 2.2M12 22l-2.2-2.2M12 22l2.2-2.2M3.3 7l3 .8M3.3 7l.8 3M20.7 17l-3-.8M20.7 17l-.8-3M3.3 17l.8-3M3.3 17l3-.8M20.7 7l-.8 3M20.7 7l-3 .8"/>',
  bluete:'<circle cx="12" cy="6.5" r="3.2"/><circle cx="17.2" cy="10.3" r="3.2"/><circle cx="15.2" cy="16.4" r="3.2"/><circle cx="8.8" cy="16.4" r="3.2"/><circle cx="6.8" cy="10.3" r="3.2"/><circle cx="12" cy="12" r="1.6"/>',
  sonne:'<circle cx="12" cy="12" r="4.2"/><path d="M12 1.5v3.5M12 19v3.5M1.5 12H5M19 12h3.5M4.6 4.6l2.4 2.4M17 17l2.4 2.4M4.6 19.4L7 17M17 7l2.4-2.4"/>',
  blatt:'<path d="M12 22V9"/><path d="M12 9c0-4 3-7 8-7 0 5-3 8-8 8M12 13c0-3.5-3-6-8-6 0 4.5 3 7 8 7"/>',
  berg:'<path d="M1.5 20l7-12 4 6 3-4 7 10z"/><path d="M6.8 11l1.7-3 2 3"/>',
  keins:'',
};
const ORN_LABEL = {schnee:'Schneeflocke', bluete:'Blüte', sonne:'Sonne', blatt:'Blatt', berg:'Berge', keins:'Ohne'};
// Saison-Themen (Paletten, Schriften, Ornament) – vom Design-Team
const THEMES = {
  winter:   {theme:'Pulverschnee', layout:'alpin',     pal:{paper:'#13233a', ink:'#eef3f7', accent:'#9fc7e8', muted:'#93a6b8', rule:'#2e4562'}, fd:'Cormorant Garamond', fb:'Figtree', orn:'schnee', title:'Winterkarte', subtitle:'Nach dem Skitag · direkt an der Piste'},
  fruehling:{theme:'Almrausch',    layout:'klassisch', pal:{paper:'#f7f5ee', ink:'#23302a', accent:'#c2557a', muted:'#6f7a70', rule:'#d9dccf'}, fd:'Cormorant Garamond', fb:'Figtree', orn:'bluete', title:'Frühlingskarte', subtitle:'Erste Kräuter, frischer Bärlauch'},
  sommer:   {theme:'Bergsommer',   layout:'modern',    pal:{paper:'#fffdf6', ink:'#1c2b2a', accent:'#e0892b', muted:'#677370', rule:'#eadfc8'}, fd:'Bricolage Grotesque', fb:'Figtree', orn:'sonne', title:'Sommerkarte', subtitle:'Terrasse, Bergluft, Marillenzeit'},
  herbst:   {theme:'Almabtrieb',   layout:'alpin',     pal:{paper:'#2a1d16', ink:'#f3e6d6', accent:'#d98b3a', muted:'#b59f88', rule:'#4a3527'}, fd:'Cormorant Garamond', fb:'Figtree', orn:'blatt', title:'Herbstkarte', subtitle:'Wild, Schwammerl, Kastanien'},
};
const FONTPAIRS = [['Cormorant Garamond','Figtree','Elegant'],['Bricolage Grotesque','Figtree','Modern'],['Playfair Display','Source Sans 3','Klassisch'],['Fraunces','Figtree','Weich'],['DM Serif Display','DM Sans','Kontrast']];
const SPECIAL_STYLES = [['tafel','Kreidetafel'],['saison','Wie Saisonkarte'],['festlich','Festlich']];

function seasonDefaults(k){ const t = THEMES[k]; return {from:SEASON_RANGE[k][0], to:SEASON_RANGE[k][1], layout:t.layout, pal:{...t.pal}, fd:t.fd, fb:t.fb, orn:t.orn, title:t.title, subtitle:t.subtitle, footer:'Alle Preise in Euro inkl. MwSt. Bitte informieren Sie uns über Allergien und Unverträglichkeiten.', photos:true, desc:true, allergens:true, cover:''}; }
const todayStr = () => { const d = new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10); };
function addDays(s, n){ const d = new Date(s+'T12:00:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function inRangeMD(md, from, to){ return from <= to ? (md >= from && md <= to) : (md >= from || md <= to); }
function seasonFor(dateStr){ const md = dateStr.slice(5); const ss = S.settings.seasons; return SEASONS.map(x=>x[0]).find(k => inRangeMD(md, ss[k].from, ss[k].to)) || null; }
function specialsFor(dateStr){ return S.specials.filter(sp => sp.from <= dateStr && dateStr <= (sp.to||sp.from)); }
function inSeason(m, k){ return !m.seasons || !m.seasons.length || !k || m.seasons.includes(k); }
function seasonName(k){ return (SEASONS.find(x=>x[0]===k)||[,'Ganzjährig'])[1]; }
function spDays(sp){ return Math.round((new Date((sp.to||sp.from)+'T12:00:00') - new Date(sp.from+'T12:00:00'))/864e5) + 1; }
function spStatus(sp){ const t = todayStr(); if((sp.to||sp.from) < t) return ['past','vorbei']; if(sp.from <= t) return ['live','läuft heute']; const n = Math.round((new Date(sp.from+'T12:00:00') - new Date(t+'T12:00:00'))/864e5); return ['soon', n===1 ? 'morgen' : `in ${n} Tagen`]; }
function fmtShort(s){ const [y,m,d] = s.split('-'); return `${d}.${m}.`; }
function fmtRange(sp){ return sp.to && sp.to !== sp.from ? `${fmtShort(sp.from)}–${fmtShort(sp.to)}${sp.to.slice(0,4)}` : `${fmtShort(sp.from)}${sp.from.slice(0,4)}`; }
function mdLabel(md){ const [m,d] = md.split('-'); return `${d}.${m}.`; }
function ornSvg(k, cls='g-orn'){ return ORN[k] ? `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ORN[k]}</svg>` : ''; }
function fontStack(f, serif){ return `"${f}",${serif?'Georgia,serif':'system-ui,sans-serif'}`; }

function seasonSeed(d){
  d.settings.seasons = {}; SEASONS.forEach(([k]) => d.settings.seasons[k] = seasonDefaults(k));
  const tag = {'Zillertaler Käsefondue':['winter','herbst'], '„Dippin me softly!“':['winter'], '„Marillenzeit = Knödelzeit“':['sommer'], '„Endless Summer“':['fruehling','sommer'], 'DAHUAM.202 Sommersalat':['sommer'],
    '„Schwammerlsuche“':['sommer','herbst'], 'Eierschwammerl Carbonara':['sommer','herbst'], 'Schwammerlrösti':['sommer','herbst'], '„Wilde Bolo“':['herbst','winter'], '„Alpen Ceviche“':['fruehling','sommer'], 'Kokos-Curry-Suppe':['winter','herbst']};
  d.menu.forEach(m => m.seasons = tag[m.name] || []);
  const add = (section, name, desc, price, seasons, veg='') => d.menu.push({id:uid('m'), section, name, desc, price, card:'', img:'', veg, top:false, hidden:false, seasons, order: d.menu.filter(x=>x.section===section).length});
  SEASON_DEMO.forEach(x => add(...x));
  const y = new Date().getFullYear(); const t = todayStr();
  const mk = (name, from, to, mode, style, note, items) => ({id:uid('sp'), name, from, to, mode, style, note, items:items.map(([n,ds,p,veg])=>({name:n, desc:ds, price:p, veg:veg||'', card:''}))});
  d.specials = SPECIAL_DEMO(y, t).map(a => mk(...a));
}
function seasonMigrate(d){
  if(!d.settings.seasons){ d.settings.seasons = {}; SEASONS.forEach(([k]) => d.settings.seasons[k] = seasonDefaults(k)); const g = d.settings.guest; if(g){ SEASONS.forEach(([k]) => Object.assign(d.settings.seasons[k], {photos:g.photos, desc:g.desc, allergens:g.allergens, footer:g.footer||d.settings.seasons[k].footer})); } }
  d.menu.forEach(m => { if(!m.seasons) m.seasons = []; });
  if(!d.specials) d.specials = [];
  return d;
}

/* ---------- Gästekarte für Saison + Datum ---------- */
function paperStyle(s){ const p = s.pal; return `--gp:${p.paper};--gi:${p.ink};--ga:${p.accent};--gm:${p.muted};--gr:${p.rule};--gfd:${fontStack(s.fd, !/Grotesque|Sans/.test(s.fd))};--gfb:${fontStack(s.fb)}`; }
function itemHtml(m, s, used){
  const k = m.card ? menuCalc(m) : null; const alg = k && k.t ? [...k.t.alg].sort() : []; alg.forEach(a=>used.add(a));
  const img = s.photos && m.id ? menuImg(m) : '';
  return `<article class="g-item ${img?'has-ph':''} ${m.top?'is-top':''}">
    ${img ? `<img class="g-ph" src="${IMG[img]}" alt="${esc(m.name)}" loading="lazy">` : ''}
    <div class="g-txt"><div class="g-row"><span class="g-n">${esc(m.name)}${m.veg==='vg'?' <i class="g-mark" title="Vegan">VG</i>':m.veg==='v'?' <i class="g-mark" title="Vegetarisch">V</i>':''}</span><span class="lead"></span><span class="g-p">${fin(+m.price).toLocaleString('de-AT',{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
    ${m.top?`<div class="g-top">★ Empfehlung des Hauses</div>`:''}
    ${s.desc && m.desc ? `<div class="g-d">${esc(m.desc)}</div>` : ''}
    ${s.allergens && alg.length ? `<div class="g-a">${alg.join(' · ')}</div>` : ''}</div>
  </article>`;
}
function specialBlock(sp, s, used, standalone){
  const items = sp.items.map(it => ({...it, id:'', top:false, card: it.card || ''}));
  const st = sp.style === 'saison' ? '' : ` g-sp-${sp.style}`;
  return `<section class="g-special${st} ${standalone?'is-page':''}">
    <div class="g-sp-head"><span class="g-sp-date">${sp.to && sp.to!==sp.from ? `${fmtShort(sp.from)} – ${fmtShort(sp.to)}` : new Date(sp.from+'T12:00:00').toLocaleDateString('de-AT',{weekday:'long', day:'numeric', month:'long'})}</span>
      <h3 class="g-sp-title">${esc(sp.name)}</h3>${sp.note?`<p class="g-sp-note">${esc(sp.note)}</p>`:''}</div>
    <div class="g-list">${items.map(it => itemHtml(it, {...s, photos:false}, used)).join('')}</div>
  </section>`;
}
function guestHtml(seasonKey, dateStr){
  dateStr = dateStr || todayStr();
  const k = seasonKey || seasonFor(dateStr) || 'winter';
  const s = S.settings.seasons[k];
  const items = menuSorted().filter(m => !m.hidden && inSeason(m, k));
  const used = new Set();
  const inserts = specialsFor(dateStr).filter(sp => sp.mode !== 'tageskarte');
  let body = inserts.map(sp => specialBlock(sp, s, used)).join('');
  for(const sec of secList()){
    const list = items.filter(m=>m.section===sec); if(!list.length) continue;
    body += `<section class="g-sec"><h3 class="g-h"><span>${esc(sec)}</span></h3><div class="g-list">${list.map(m => itemHtml(m, s, used)).join('')}</div></section>`;
  }
  const legend = s.allergens && used.size ? `<div class="g-leg">${[...used].sort().map(a=>`<span><b>${a}</b> ${esc(ALG[a])}</span>`).join('')}</div>` : '';
  const cover = s.cover && IMG[s.cover] ? `<img class="g-cover" src="${IMG[s.cover]}" alt="">` : '';
  return `<div class="g-paper g-${s.layout} g-season-${k}" style="${paperStyle(s)}">
    ${cover}
    <header class="g-head">${ornSvg(s.orn,'g-orn top')}<div class="g-mark-logo">DAHUAM<span>.</span>202</div><h2 class="g-title">${esc(s.title)}</h2>${s.subtitle?`<div class="g-sub">${esc(s.subtitle)}</div>`:''}</header>
    ${body || '<p class="g-empty">Noch keine sichtbaren Gerichte in dieser Saison.</p>'}
    <footer class="g-foot">${ornSvg(s.orn,'g-orn')}<div class="g-keys"><span><i class="g-mark">V</i> vegetarisch</span><span><i class="g-mark">VG</i> vegan</span><span>★ Empfehlung des Hauses</span></div>${legend}<p>${esc(s.footer)}</p></footer>
  </div>`;
}
function tageskarteHtml(sp, k){
  const s = S.settings.seasons[k || seasonFor(sp.from) || 'winter']; const used = new Set();
  const inner = specialBlock(sp, s, used, true);
  const legend = used.size ? `<div class="g-leg">${[...used].sort().map(a=>`<span><b>${a}</b> ${esc(ALG[a])}</span>`).join('')}</div>` : '';
  return `<div class="g-paper g-tk g-${s.layout} ${sp.style!=='saison'?'g-tk-'+sp.style:''}" style="${paperStyle(s)}">
    <header class="g-head"><div class="g-mark-logo">DAHUAM<span>.</span>202</div><div class="g-sub">Tageskarte</div></header>${inner}
    <footer class="g-foot">${legend}<p>Solange der Vorrat reicht. Preise in Euro inkl. MwSt.</p></footer></div>`;
}

/* ---------- Gästekarte: Werkzeuge ---------- */
function renderGuest(){
  const date = view.gdate || (view.gdate = todayStr());
  const auto = seasonFor(date);
  const k = view.gseason || auto || 'winter';
  const s = S.settings.seasons[k];
  const sps = specialsFor(date);
  const tks = sps.filter(sp => sp.mode === 'tageskarte');
  const tog = (f,l) => `<label class="tog"><input type="checkbox" data-sv="${f}" ${s[f]?'checked':''}><span></span>${l}</label>`;
  const presets = SEASONS.map(([pk,pl]) => { const p = THEMES[pk].pal; return `<button type="button" class="sw-preset ${JSON.stringify(s.pal)===JSON.stringify(p)?'on':''}" data-act="palPreset" data-id="${pk}" title="${esc(THEMES[pk].theme)}"><i style="background:${p.paper}"></i><i style="background:${p.accent}"></i><i style="background:${p.ink}"></i><span>${esc(THEMES[pk].theme)}</span></button>`; }).join('');
  return `<div class="guest-wrap">
    <aside class="guest-tools">
      <section class="panel">
        <div class="panel-h"><h2>Was sehen die Gäste?</h2></div>
        <label class="f">Datum<input id="gdate" type="date" value="${date}"></label>
        <div class="chips-row tight"><button type="button" class="chip ${date===todayStr()?'on':''}" data-act="gdate" data-id="${todayStr()}">Heute</button><button type="button" class="chip" data-act="gdate" data-id="${addDays(todayStr(),1)}">Morgen</button>${S.specials.filter(sp=>spStatus(sp)[0]!=='past').slice(0,3).map(sp=>`<button type="button" class="chip" data-act="gdate" data-id="${sp.from}">${esc(sp.name)}</button>`).join('')}</div>
        <p class="hint">${auto ? `Am ${fmtDate(date+'T12:00:00')} gilt die <b>${esc(S.settings.seasons[auto].title)}</b>` : 'An diesem Datum gilt keine Saisonkarte'}${sps.length ? ` und ${sps.length===1?'die Aktion':'die Aktionen'} <b>${sps.map(x=>esc(x.name)).join(', ')}</b>.` : '.'}</p>
        ${(() => { const miss = guestItems(k, date).filter(m=>!hasAlg(m)).length + sps.reduce((n,sp)=>n+sp.items.filter(it=>!hasAlg(it)).length,0); return miss ? `<div class="warn-box">${ico('spark')}<span><b>${miss} Gerichte ohne Allergenangabe.</b> In Österreich Pflicht: Rezeptur verknüpfen oder Allergene im Gericht eintragen.</span><button type="button" class="btn sm" data-act="goMenu" data-id="noalg">Anzeigen</button></div>` : '<div class="ok-box">Alle Gerichte haben Allergenangaben.</div>'; })()}
      </section>
      <section class="panel">
        <div class="panel-h"><h2>Saisonkarte gestalten</h2>${view.gseason?`<button type="button" class="link sm-link" data-act="gseason" data-id="">nach Datum</button>`:''}</div>
        ${seg('gseason', k, SEASONS.map(([sk,sl])=>[sk,sl]))}
        <div class="fields two">
          <label class="f">Gültig ab<input type="text" inputmode="numeric" placeholder="TT.MM." data-smd="from" value="${mdLabel(s.from)}"></label>
          <label class="f">bis<input type="text" inputmode="numeric" placeholder="TT.MM." data-smd="to" value="${mdLabel(s.to)}"></label>
        </div>
        <div class="f">Layout</div>${seg('glayout', s.layout, GSTYLES)}
        <div class="f">Farben</div><div class="presets">${presets}</div>
        <div class="colors">${[['paper','Papier'],['ink','Schrift'],['accent','Akzent']].map(([c,l])=>`<label class="clr"><input type="color" data-pal="${c}" value="${s.pal[c]}" aria-label="${l}"><span>${l}</span></label>`).join('')}</div>
        <label class="f">Schrift<select data-sv="fontpair">${FONTPAIRS.map(([a,b,l])=>`<option value="${esc(a+'|'+b)}" ${s.fd===a&&s.fb===b?'selected':''}>${l} · ${esc(a)}</option>`).join('')}</select></label>
        <div class="f">Ornament</div><div class="orns">${ORN_ORDER.map(o=>`<button type="button" class="orn-b ${s.orn===o?'on':''}" data-act="gorn" data-id="${o}" title="${ORN_LABEL[o]}" aria-label="${ORN_LABEL[o]}">${o==='keins'?'<span>—</span>':ornSvg(o,'ico')}</button>`).join('')}</div>
        <div class="togs">${tog('photos','Fotos')}${tog('desc','Beschreibungen')}${tog('allergens','Allergene')}</div>
        <label class="f">Titel<input data-st="title" value="${esc(s.title)}"></label>
        <label class="f">Untertitel<input data-st="subtitle" value="${esc(s.subtitle)}"></label>
        <label class="f">Fußzeile<textarea data-st="footer" class="sm-ta">${esc(s.footer)}</textarea></label>
        <div class="row-btns"><button type="button" class="btn sm" data-act="gcover">${ico('camera')}${s.cover?'Titelbild ändern':'Titelbild'}</button>${s.cover?'<button type="button" class="btn sm" data-act="gcoverDel">Entfernen</button>':''}<button type="button" class="btn sm" data-act="gReset" data-id="${k}">Design zurücksetzen</button></div>
        <p class="hint">${S.menu.filter(m=>!m.hidden && inSeason(m,k)).length} Gerichte auf der ${esc(s.title)}. Welche Gerichte in welcher Saison laufen, legen Sie unter „Saison & Aktionen“ fest.</p>
      </section>
    </aside>
    <div class="guest-prev">${guestPrevHtml()}</div>
  </div>`;
}

/* ---------- Saison & Aktionen ---------- */
function dayOfYear(md){ const [m,d] = md.split('-').map(Number); return Math.round((Date.UTC(2025,m-1,d) - Date.UTC(2025,0,1))/864e5); }
function renderPlan(){
  const ss = S.settings.seasons, y = new Date().getFullYear(), t = todayStr();
  const months = ['Jän','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
  const bars = SEASONS.map(([k,l]) => { const s = ss[k], a = dayOfYear(s.from), b = dayOfYear(s.to); const segs = a <= b ? [[a,b]] : [[a,364],[0,b]];
    return segs.map(([x,z]) => `<button type="button" class="tl-bar" style="left:${(x/365*100).toFixed(2)}%;width:${((z-x+1)/365*100).toFixed(2)}%;--c:${s.pal.accent};--p:${s.pal.paper}" data-act="editSeason" data-id="${k}" title="${esc(s.title)} ${mdLabel(s.from)}–${mdLabel(s.to)}"><span>${l}</span></button>`).join(''); }).join('');
  // Marker in Spuren legen, damit sich Beschriftungen nicht überdecken; am rechten Rand nach links schreiben
  const lanes = []; const LW = 15;
  const pinList = S.specials.filter(sp => sp.from.slice(0,4) == y || (sp.to||'').slice(0,4) == y).map(sp => ({sp, x: (sp.from.slice(0,4) == y ? dayOfYear(sp.from.slice(5)) : 0)/365*100})).sort((a,b) => a.x - b.x);
  pinList.forEach(p => { p.right = p.x > 86; const a = p.right ? p.x - LW : p.x - 1, b = p.right ? p.x + 1 : p.x + LW; let l = lanes.findIndex(end => end.every(([s,e]) => b <= s || a >= e)); if(l < 0){ l = lanes.length; lanes.push([]); } lanes[l].push([a,b]); p.lane = l; });
  const pins = pinList.map(({sp, x, right, lane}) => `<button type="button" class="tl-pin ${spStatus(sp)[0]} ${right?'r':''}" style="left:${x.toFixed(2)}%;top:${6 + lane*30}px" data-act="editSpecial" data-id="${sp.id}" title="${esc(sp.name)} · ${fmtRange(sp)}"><i></i><span>${esc(sp.name)}</span></button>`).join('');
  const todayX = dayOfYear(t.slice(5))/365*100;
  const groups = [['live','Läuft gerade'],['soon','Geplant'],['past','Vergangen']];
  const sorted = [...S.specials].sort((a,b)=>a.from.localeCompare(b.from));
  const q = view.pq.trim().toLowerCase();
  const dishes = menuSorted().filter(m => !q || m.name.toLowerCase().includes(q));
  return `<section class="panel">
    <div class="panel-h"><h2>Jahresplan ${y}</h2><div class="row-btns"><button type="button" class="btn sm primary" data-act="newSpecial">${ico('plus')}Aktion / Spezialität</button></div></div>
    <div class="tl-wrap"><div class="tline">
      <div class="tl-months">${months.map(m=>`<span>${m}</span>`).join('')}</div>
      <div class="tl-track">${bars}<span class="tl-today ${todayX > 92 ? 'r' : todayX < 4 ? 'l' : ''}" style="left:${todayX.toFixed(2)}%" title="Heute"></span></div>
      <div class="tl-pins" style="height:${Math.max(1, lanes.length)*30 + 10}px">${pins}</div>
    </div></div>
    <p class="hint">Saisonzeiten verschieben: Saison anklicken. Die Gästekarte wechselt automatisch am ersten Tag einer Saison. Aktionen erscheinen nur an ihren Tagen.</p>
  </section>
  <div class="plan-grid">
    <section class="col">
      ${groups.map(([g,l]) => { const list = sorted.filter(sp => spStatus(sp)[0]===g); if(!list.length) return ''; return `<h2 class="sec-h">${l}<small class="muted sm">${list.length}</small></h2><div class="sp-list">${(g==='past'?list.reverse():list).map(sp => { const [st,stl] = spStatus(sp); return `<article class="sp-card ${st}">
        <div class="sp-top"><span class="sp-st ${st}">${stl}</span><span class="muted sm mono">${fmtRange(sp)} · ${spDays(sp)} ${spDays(sp)===1?'Tag':'Tage'}</span></div>
        <h3>${esc(sp.name)}</h3>${sp.note?`<p class="muted sm">${esc(sp.note)}</p>`:''}
        <ul class="sp-items">${sp.items.map(it=>`<li><span>${esc(it.name)}</span>${+it.price > 0 ? `<span class="mono">${eur(it.price)}</span>` : ''}</li>`).join('')}</ul>
        <div class="sp-foot"><span class="tag">${sp.mode==='tageskarte'?'Eigene Tageskarte':'Einleger auf der Karte'} · ${esc((SPECIAL_STYLES.find(x=>x[0]===sp.style)||[,''])[1])}</span>
          <span class="row-btns"><button type="button" class="icon-btn" data-act="previewSpecial" data-id="${sp.id}" title="Vorschau" aria-label="Vorschau">${ico('eye')}</button><button type="button" class="icon-btn" data-act="dupSpecial" data-id="${sp.id}" title="Für nächstes Jahr kopieren" aria-label="Kopieren">${ico('copy')}</button>${sp.mode==='tageskarte'?`<button type="button" class="icon-btn" data-act="printSpecial" data-id="${sp.id}" title="Tageskarte drucken" aria-label="Drucken">${ico('print')}</button>`:''}<button type="button" class="icon-btn" data-act="editSpecial" data-id="${sp.id}" title="Bearbeiten" aria-label="Bearbeiten">${ico('edit')}</button></span></div>
      </article>`; }).join('')}</div>`; }).join('') || '<div class="panel empty">Noch keine Aktionen geplant.</div>'}
    </section>
    <section class="panel flush">
      <div class="panel-h pad"><h2>Welche Gerichte in welcher Saison?</h2></div>
      <div class="toolbar pad-x"><label class="search">${ico('search')}<input id="pq" type="search" placeholder="Gericht suchen" value="${esc(view.pq)}" autocomplete="off"></label></div>
      <div class="tbl-wrap"><table class="matrix"><thead><tr><th>Gericht</th>${SEASONS.map(([k,l])=>`<th class="c"><span class="sdot" style="background:${ss[k].pal.accent}"></span>${l}</th>`).join('')}</tr></thead>
      <tbody>${dishes.map(m=>{ const all = !m.seasons.length; return `<tr><td><b class="pn">${esc(m.name)}</b><small class="muted">${esc(m.section)}${all?' · ganzjährig':''}</small></td>${SEASONS.map(([k])=>`<td class="c"><label class="chk"><input type="checkbox" data-ms="${m.id}:${k}" ${all||m.seasons.includes(k)?'checked':''} aria-label="${esc(m.name)} ${seasonName(k)}"><span></span></label></td>`).join('')}</tr>`; }).join('')}</tbody></table></div>
      <p class="hint pad-x pad-b">Alle vier Haken bedeutet ganzjährig. Ein Gericht ohne passende Saison erscheint auf keiner Gästekarte, bleibt aber in der Kalkulation.</p>
    </section>
  </div>`;
}

function specialDialog(sp){
  const isNew = !sp;
  const t = todayStr();
  sp = sp ? JSON.parse(JSON.stringify(sp)) : {id:uid('sp'), name:'', from:addDays(t,1), to:addDays(t,2), mode:'insert', style:'tafel', note:'', items:[{name:'',desc:'',price:'',veg:'',card:''}]};
  const dishes = S.cards.filter(c=>c.type==='dish').sort(byName);
  const menuOpts = menuSorted();
  const row = (it,i) => `<div class="sp-row" data-row>
    <input placeholder="Gericht" data-f="name" value="${esc(it.name)}" required>
    <input type="number" step="0.1" min="0" placeholder="€" data-f="price" value="${esc(it.price)}" required class="pr">
    <button type="button" class="icon-btn" data-rm aria-label="Zeile entfernen">${ico('x')}</button>
    <input placeholder="Beschreibung" data-f="desc" value="${esc(it.desc)}" class="wide">
    <select data-f="veg" aria-label="Art"><option value="">Fleisch/Fisch</option><option value="v" ${it.veg==='v'?'selected':''}>Vegetarisch</option><option value="vg" ${it.veg==='vg'?'selected':''}>Vegan</option></select>
    <select data-f="card" aria-label="Rezeptur"><option value="">ohne Rezeptur</option>${dishes.map(c=>`<option value="${c.id}" ${it.card===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
    <input placeholder="Allergene ohne Rezeptur, z. B. A C G" data-f="alg" value="${esc(it.alg||'')}" class="wide" aria-label="Allergene">
  </div>`;
  openDialog(isNew ? 'Neue Aktion / Spezialität' : 'Aktion bearbeiten', `
    <label class="f">Name<input name="name" required placeholder="z. B. Wildwochenende" value="${esc(sp.name)}"></label>
    <div class="fields two"><label class="f">Von<input name="from" type="date" required value="${sp.from}"></label><label class="f">Bis<input name="to" type="date" value="${sp.to||sp.from}"></label></div>
    <div class="chips-row tight"><button type="button" class="chip" data-dur="1">1 Tag</button><button type="button" class="chip" data-dur="2">2 Tage</button><button type="button" class="chip" data-dur="3">Wochenende (3)</button><button type="button" class="chip" data-dur="7">1 Woche</button></div>
    <label class="f">Kurzer Text für die Gäste<input name="note" placeholder="z. B. Frisch aus der Gerlosser Jagd" value="${esc(sp.note)}"></label>
    <div class="fields two">
      <label class="f">Darstellung<select name="mode"><option value="insert" ${sp.mode==='insert'?'selected':''}>Einleger oben auf der Karte</option><option value="tageskarte" ${sp.mode==='tageskarte'?'selected':''}>Eigene Tageskarte</option></select></label>
      <label class="f">Stil<select name="style">${SPECIAL_STYLES.map(([k,l])=>`<option value="${k}" ${sp.style===k?'selected':''}>${l}</option>`).join('')}</select></label>
    </div>
    <div class="f">Gerichte</div>
    <div id="spRows">${sp.items.map(row).join('')}</div>
    <div class="row-btns"><button type="button" class="btn sm" id="spAdd">${ico('plus')}Gericht</button>
      <select id="spFromMenu" class="sm-sel"><option value="">Von der Karte übernehmen …</option>${menuOpts.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select></div>`,
    fd => { const rows = [...$('#spRows').querySelectorAll('[data-row]')].map(r => { const g = f => r.querySelector(`[data-f="${f}"]`).value; return {name:g('name').trim(), desc:g('desc').trim(), price:+g('price')||0, veg:g('veg'), card:g('card'), alg:g('alg').toUpperCase().replace(/[^A-PR\s,]/g,'').split(/[\s,]+/).filter(a=>ALG[a]).join(' ')}; }).filter(x=>x.name);
      if(!rows.length){ toast('Mindestens ein Gericht eintragen'); return false; }
      let from = fd.get('from'), to = fd.get('to') || from; if(to < from) [from,to] = [to,from];
      Object.assign(sp, {name:fd.get('name').trim(), from, to, note:fd.get('note').trim(), mode:fd.get('mode'), style:fd.get('style'), items:rows});
      const i = S.specials.findIndex(x=>x.id===sp.id); if(i>=0) S.specials[i] = sp; else S.specials.push(sp);
      view.gdate = sp.from; },
    {done:()=>`„${sp.name}“ gespeichert · ${fmtRange(sp)}`, del: isNew ? null : () => ask(`Aktion „${sp.name}“ löschen?`, () => { S.specials = S.specials.filter(x=>x.id!==sp.id); }),
     after: f => {
      const rows = $('#spRows');
      $('#spAdd').onclick = () => { rows.insertAdjacentHTML('beforeend', row({name:'',desc:'',price:'',veg:'',card:''})); rows.lastElementChild.querySelector('input').focus(); };
      rows.onclick = e => { const b = e.target.closest('[data-rm]'); if(b && rows.children.length > 1) b.closest('[data-row]').remove(); };
      rows.onchange = e => { if(e.target.dataset.f === 'card' && e.target.value){ const r = e.target.closest('[data-row]'); const c = C(e.target.value); const nm = r.querySelector('[data-f=name]'); if(!nm.value) nm.value = c.name; const pr = r.querySelector('[data-f=price]'); if(!pr.value){ const tt = totals(c); pr.value = (Math.ceil(tt.cost/(S.settings.target/100)*(1+S.settings.vat/100)) - 0.1).toFixed(1); } } };
      $('#spFromMenu').onchange = e => { const m = S.menu.find(x=>x.id===e.target.value); if(!m) return; rows.insertAdjacentHTML('beforeend', row({name:m.name, desc:m.desc, price:m.price, veg:m.veg, card:m.card})); const first = rows.firstElementChild; if(first && !first.querySelector('[data-f=name]').value) first.remove(); e.target.value = ''; };
      f.querySelectorAll('[data-dur]').forEach(b => b.onclick = () => { const fr = f.elements.from.value || todayStr(); f.elements.to.value = addDays(fr, +b.dataset.dur - 1); });
     }});
}

/* ---------- Design-Team: Themen, Ornamente, Schriften ---------- */
Object.assign(ORN, {
  schnee:'<path d="M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10M10 4l2 2 2-2M10 20l2-2 2 2M4.5 10.5l2.6-.7-.7-2.6M19.5 13.5l-2.6.7.7 2.6"/>',
  baerlauch:'<path d="M4 20C7 11 13 5 20 4c-1 7-6 13-16 16z"/><path d="M4 20L15 9"/>',
  bergsee:'<path d="M2 15l5-7 4 5 3-3 8 5"/><path d="M2 19q2.5-2 5 0t5 0 5 0 5 0"/>',
  laerche:'<path d="M4 20L19 5M8 16l-3-1M8 16l1 3M12 12l-3-1M12 12l1 3M16 8l-3-1M16 8l1 3"/><ellipse cx="19.5" cy="4.5" rx="1.6" ry="2.2" transform="rotate(45 19.5 4.5)"/>',
  stempel:'<circle cx="12" cy="12" r="10.5" stroke-dasharray="1.6 1.6"/><circle cx="12" cy="12" r="7.5"/><path d="M12 8.2l1.1 2.4 2.6.3-1.9 1.8.5 2.6-2.3-1.3-2.3 1.3.5-2.6-1.9-1.8 2.6-.3z" fill="currentColor" stroke="none"/>',
});
delete ORN.blatt; delete ORN.berg;
Object.assign(ORN_LABEL, {baerlauch:'Bärlauch', bergsee:'Bergsee', laerche:'Lärche', stempel:'Stempel'});
const ORN_ORDER = ['schnee','baerlauch','bluete','sonne','bergsee','laerche','stempel','keins'];
Object.assign(THEMES, {
  winter:   {theme:'Pulverschnee', layout:'alpin',  pal:{paper:'#eef2f4', ink:'#1b2a3a', accent:'#a3243b', muted:'#5e6e7a', rule:'#b9c6ce'}, fd:'Fraunces', fb:'Karla', orn:'schnee', title:'Winterkarte', subtitle:'Gegenüber der Piste · Fondue, Flammkuchen & Kaiserschmarrn'},
  fruehling:{theme:'Bärlauch',     layout:'alpin',  pal:{paper:'#f3f5ec', ink:'#23331f', accent:'#5f8b2e', muted:'#6e7766', rule:'#c9d4b8'}, fd:'Young Serif', fb:'Figtree', orn:'baerlauch', title:'Frühlingskarte', subtitle:'Bärlauch, Spargel & die ersten Almkräuter'},
  sommer:   {theme:'Almrausch',    layout:'modern', pal:{paper:'#fbfcfa', ink:'#0f3b4a', accent:'#c8325f', muted:'#557079', rule:'#bfd6dc'}, fd:'Bricolage Grotesque', fb:'Work Sans', orn:'bergsee', title:'Sommerkarte', subtitle:'Terrasse, Flammkuchen & kühle Getränke unterm Gerlospass'},
  herbst:   {theme:'Lärchengold',  layout:'alpin',  pal:{paper:'#e6e4d8', ink:'#2e2a1f', accent:'#9e7410', muted:'#6b6655', rule:'#c3bfa8'}, fd:'Alegreya SC', fb:'Alegreya Sans', orn:'laerche', title:'Herbstkarte', subtitle:'Wild, Kürbis & Kastanien aus dem Zillertal'},
});
const TAGESBLATT = {paper:'#23282b', ink:'#f4f2ec', accent:'#f2c14e', muted:'#a9b0b4', rule:'#4a5257'};
FONTPAIRS.length = 0;
FONTPAIRS.push(['Fraunces','Karla','Pulverschnee'],['Young Serif','Figtree','Bärlauch'],['Bricolage Grotesque','Work Sans','Almrausch'],['Alegreya SC','Alegreya Sans','Lärchengold'],['Cormorant Garamond','Figtree','Elegant']);
const SERIF_FONTS = ['Fraunces','Young Serif','Alegreya SC','Cormorant Garamond'];
fontStack = (f, serif) => `"${f}",${SERIF_FONTS.includes(f)?'Georgia,serif':'system-ui,sans-serif'}`;
const DAYS = [[1,'Mo'],[2,'Di'],[3,'Mi'],[4,'Do'],[5,'Fr'],[6,'Sa'],[0,'So']];
const DAYNAME = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];

/* ---------- Demodaten: Saisongerichte (Küchenchef) & Aktionen (Gastronomie) ---------- */
const SEASON_DEMO = [
  ['Fondue & Hauptspeisen','Hirschragout','Mit Serviettenknödel, Rotkraut und Preiselbeerbirne',26.90,['winter','herbst'],'','A C G L O'],
  ['Fondue & Hauptspeisen','Zillertaler Krapfen','Roggenteig mit Graukäse-Erdäpfelfülle, Sauerkraut',15.90,['winter'],'v','A C G'],
  ['Vorspeisen','Bärlauch-Kaspressknödel','Auf Blattsalat mit Kernöl',15.50,['fruehling'],'v','A C G'],
  ['Fondue & Hauptspeisen','Gebratener Zillertaler Saibling','Mit grünem Spargel und Heurigen',27.50,['fruehling'],'','D G'],
  ['Fondue & Hauptspeisen','Eierschwammerlgulasch','Mit Serviettenknödel und Petersilie',19.90,['sommer'],'v','A C G'],
  ['Suppen','Kalte Gurken-Buttermilchsuppe','Mit Dille und Forellenkaviar',8.90,['sommer'],'','D G'],
  ['Suppen','Kürbiscremesuppe','Mit Kernöl und gerösteten Kernen',7.50,['herbst'],'v','G'],
  ['Fondue & Hauptspeisen','Tiroler Kiachl','Mit Sauerkraut oder Preiselbeeren',12.90,['herbst'],'v','A C G'],
];
function easter(Y){ const a=Y%19,b=Math.floor(Y/100),c=Y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1; return `${Y}-${String(mo).padStart(2,'0')}-${String(da).padStart(2,'0')}`; }
function nthSunday(Y,M,n){ const d = new Date(Y,M-1,1); const first = (7-d.getDay())%7+1; return `${Y}-${String(M).padStart(2,'0')}-${String(first+7*(n-1)).padStart(2,'0')}`; }
function nextFriday(t){ const d = new Date(t+'T12:00:00'); return addDays(t, ((5-d.getDay()+7)%7) || 7); }
function upcoming(fn, y, t){ const a = fn(y); return a >= t ? a : fn(y+1); }
const SPECIAL_DEMO = (y, t) => {
  const wild = nextFriday(t), ost = upcoming(easter, y, t), mut = upcoming(Y=>nthSunday(Y,5,2), y, t), alm = upcoming(Y=>`${Y}-09-26`, y, t), sch = upcoming(Y=>`${Y}-07-13`, y, t);
  return [
    ['Gerlosser Wildwochenende', wild, addDays(wild,2), 'insert', 'tafel', 'Frisch aus der heimischen Jagd', [['Rehragout','Mit Serviettenknödel, Rotkraut und Preiselbeeren',26.90,'','A C G L O'],['Hirschgulasch','Mit Butterspätzle',24.90,'','A C G L']]],
    ['Silvester-Fondue Chinoise', `${y}-12-31`, `${y}-12-31`, 'tageskarte', 'festlich', 'Reservierung um 18:15 oder ab 20:30 Uhr', [['Fondue Chinoise','Rind, Kalb und Huhn, Brühe, fünf hausgemachte Saucen, pro Person',42.00,'','C L M O'],['Mitternachts-Gulaschsuppe','Mit Gebäck',7.90,'','A']]],
    ['Ostern bei uns', ost, addDays(ost,1), 'insert', 'saison', 'Ostersonntag und Ostermontag', [['Osterbrunch-Teller','Osterschinken, Kren, gefärbte Eier, Bauernbrot, Butter',17.50,'','A C G']]],
    ['Muttertags-Menü', mut, mut, 'tageskarte', 'festlich', 'Drei Gänge für Mama', [['Bärlauchsuppe','',0,'v','G'],['Kalbsrücken mit Spargel','Hauptgang',0,'','G'],['Erdbeer-Topfencreme','Dessert',0,'v','G'],['Menü komplett','Drei Gänge',39.50,'','A C G']]],
    ['Almabtrieb-Wochenende', alm, addDays(alm,1), 'insert', 'tafel', 'Wenn die Kühe von der Alm kommen', [['Almabtrieb-Kasspatzln','Zillertaler Bergkäse, Röstzwiebel, grüner Salat',16.90,'v','A C G']]],
    ['Eierschwammerl-Tage', sch, addDays(sch,13), 'insert', 'saison', 'Je nach Ernte', [['Eierschwammerl à la crème','Mit Semmelknödel und Petersilie',21.50,'v','A C G']]],
  ];
};
// seasonSeed neu: mit Allergenen, Wochentagen, Ruhetag
seasonSeed = function(d){
  d.settings.seasons = {}; SEASONS.forEach(([k]) => d.settings.seasons[k] = seasonDefaults(k));
  d.settings.closed = [3];
  const tag = {'Zillertaler Käsefondue':['winter','herbst'], '„Dippin me softly!“':['winter'], '„Marillenzeit = Knödelzeit“':['sommer'], '„Endless Summer“':['fruehling','sommer'], 'DAHUAM.202 Sommersalat':['sommer'],
    '„Schwammerlsuche“':['sommer','herbst'], 'Eierschwammerl Carbonara':['sommer','herbst'], 'Schwammerlrösti':['sommer','herbst'], '„Wilde Bolo“':['herbst','winter'], '„Alpen Ceviche“':['fruehling','sommer'], 'Kokos-Curry-Suppe':['winter','herbst']};
  const days = {'Original Wiener Tafelspitz':[0], 'Ripperl-Tower':[2]};
  d.menu.forEach(m => { m.seasons = tag[m.name] || []; m.days = days[m.name] || []; m.alg = ''; });
  SEASON_DEMO.forEach(([section,name,desc,price,seasons,veg,alg]) => d.menu.push({id:uid('m'), section, name, desc, price, card:'', img:'', veg, top:false, hidden:false, seasons, days:[], alg, order: d.menu.filter(x=>x.section===section).length}));
  const y = new Date().getFullYear(), t = todayStr();
  d.specials = SPECIAL_DEMO(y, t).map(([name, from, to, mode, style, note, items]) => ({id:uid('sp'), name, from, to, mode, style, note, items:items.map(([n,ds,p,veg,alg])=>({name:n, desc:ds, price:p, veg:veg||'', card:'', alg:alg||''}))}));
};
const _seasonMigrate = seasonMigrate;
seasonMigrate = function(d){ _seasonMigrate(d); d.menu.forEach(m => { if(!m.days) m.days = []; if(m.alg==null) m.alg = ''; }); if(!d.settings.closed) d.settings.closed = [3]; return d; };

/* ---------- Allergene & Verfügbarkeit ---------- */
function itemAlg(m){ const c = m.card && C(m.card); return c ? [...totals(c).alg].sort() : algList(m.alg).sort(); }
function hasAlg(m){ return !!(m.card && C(m.card)) || algList(m.alg).length > 0; }
function dayOk(m, date){ return !m.days || !m.days.length || m.days.includes(new Date(date+'T12:00:00').getDay()); }
function daysLabel(m){ return m.days && m.days.length ? 'nur ' + DAYS.filter(([i])=>m.days.includes(i)).map(([,l])=>l).join(', ') : ''; }
function seasonYear(k, date){ const y = +date.slice(0,4), s = S.settings.seasons[k]; if(s.from > s.to){ return date.slice(5) >= s.from ? `${y}/${String(y+1).slice(2)}` : `${y-1}/${String(y).slice(2)}`; } return String(y); }

itemHtml = function(m, s, used, date){
  const alg = itemAlg(m); alg.forEach(a=>used.add(a));
  const img = s.photos && m.id ? menuImg(m) : '';
  const dl = daysLabel(m);
  return `<article class="g-item ${img?'has-ph':''} ${m.top?'is-top':''}">
    ${img ? `<img class="g-ph" src="${IMG[img]}" alt="${esc(m.name)}" loading="lazy">` : ''}
    <div class="g-txt"><div class="g-row"><span class="g-n">${esc(m.name)}${m.veg==='vg'?' <i class="g-mark" title="Vegan">VG</i>':m.veg==='v'?' <i class="g-mark" title="Vegetarisch">V</i>':''}</span><span class="lead"></span>${+m.price ? `<span class="g-p"><span class="cur">€ </span>${fin(+m.price).toLocaleString('de-AT',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>` : ''}</div>
    ${m.top?`<div class="g-top">★ Empfehlung des Hauses</div>`:''}
    ${s.desc && (m.desc || dl) ? `<div class="g-d">${esc(m.desc)}${m.desc&&dl?' · ':''}${dl?`<b class="g-days">${esc(dl)}</b>`:''}</div>` : ''}
    ${s.allergens && alg.length ? `<div class="g-a">${alg.join(' · ')}</div>` : ''}</div>
  </article>`;
};
specialBlock = function(sp, s, used, standalone){
  const sty = sp.style || 'tafel';
  const d1 = new Date(sp.from+'T12:00:00'), d2 = new Date((sp.to||sp.from)+'T12:00:00');
  const f = d => d.toLocaleDateString('de-AT',{weekday:'short', day:'numeric', month:'short'}).replace(/\./g,'');
  const date = sp.to && sp.to !== sp.from ? `${f(d1)} – ${f(d2)}` : d1.toLocaleDateString('de-AT',{weekday:'long', day:'numeric', month:'long'});
  return `<section class="g-special g-sp-${sty} ${standalone?'is-page':''}">
    <div class="g-sp-head"><h3 class="g-sp-title">${esc(sp.name)}</h3><span class="g-sp-date">${esc(date)}</span>${sp.note?`<p class="g-sp-note">${esc(sp.note)}</p>`:''}</div>
    <div class="g-sp-list">${sp.items.map(it => itemHtml({...it, id:'', top:false}, {...s, photos:false}, used)).join('')}</div>
  </section>`;
};
function guestItems(k, date){ const sp = new Set(specialsFor(date).flatMap(x=>x.items.map(i=>i.name))); return menuSorted().filter(m => !m.hidden && inSeason(m, k) && dayOk(m, date) && !sp.has(m.name)); }
guestHtml = function(seasonKey, dateStr){
  dateStr = dateStr || todayStr();
  const k = seasonKey || seasonFor(dateStr) || 'winter';
  const s = S.settings.seasons[k];
  const items = guestItems(k, dateStr);
  const used = new Set();
  const inserts = specialsFor(dateStr).filter(sp => sp.mode !== 'tageskarte');
  let body = inserts.map(sp => specialBlock(sp, s, used)).join('');
  for(const sec of secList()){
    const list = items.filter(m=>m.section===sec); if(!list.length) continue;
    body += `<section class="g-sec"><h3 class="g-h">${ornSvg(s.orn,'g-h-orn')}<span>${esc(sec)}</span></h3><div class="g-list">${list.map(m => itemHtml(m, s, used, dateStr)).join('')}</div></section>`;
  }
  const legend = s.allergens && used.size ? `<div class="g-leg">${[...used].sort().map(a=>`<span><b>${a}</b> ${esc(ALG[a])}</span>`).join('')}</div>` : '';
  const cover = s.cover && IMG[s.cover] ? `<img class="g-cover" src="${IMG[s.cover]}" alt="">` : '';
  return `<div class="g-paper g-${s.layout} g-th-${k}" style="${paperStyle(s)}">
    ${cover}
    <header class="g-head">${ornSvg(s.orn,'g-orn top')}<div class="g-mark-logo">DAHUAM<span>.</span>202</div><h2 class="g-title">${esc(s.title)}</h2>${s.subtitle?`<div class="g-sub">${esc(s.subtitle)}</div>`:''}</header>
    ${body || '<p class="g-empty">Noch keine sichtbaren Gerichte in dieser Saison.</p>'}
    <footer class="g-foot">${ornSvg(s.orn,'g-orn')}<div class="g-keys"><span><i class="g-mark">V</i> vegetarisch</span><span><i class="g-mark">VG</i> vegan</span><span>★ Empfehlung des Hauses</span></div>${legend}<p>${esc(s.footer)}</p><p class="g-stand">${esc(s.title)} ${seasonYear(k, dateStr)} · Stand ${fmtDate(new Date().toISOString())}</p></footer>
  </div>`;
};
tageskarteHtml = function(sp, k){
  k = k || seasonFor(sp.from) || 'winter';
  const base = S.settings.seasons[k]; const used = new Set();
  const pal = sp.style === 'saison' ? base.pal : sp.style === 'festlich' ? {paper:'#1d1a16', ink:'#f3ead8', accent:'#d8b45a', muted:'#b5a990', rule:'#4a4234'} : TAGESBLATT;
  const s = {...base, pal, layout:'alpin', fd: sp.style==='festlich' ? 'Cormorant Garamond' : base.fd, fb: sp.style==='saison' ? base.fb : 'Figtree'};
  const legend = used.size; const inner = specialBlock(sp, s, used, true);
  return `<div class="g-paper g-tk g-alpin g-tk-${sp.style}" style="${paperStyle(s)}">
    <header class="g-head">${ornSvg(sp.style==='saison'?base.orn:'stempel','g-orn top')}<div class="g-mark-logo">DAHUAM<span>.</span>202</div><div class="g-sub">Tageskarte</div></header>${inner}
    <footer class="g-foot">${used.size ? `<div class="g-leg">${[...used].sort().map(a=>`<span><b>${a}</b> ${esc(ALG[a])}</span>`).join('')}</div>` : ''}<p>Nur für kurze Zeit, solange der Vorrat reicht. Preise in Euro inkl. MwSt.</p></footer></div>`;
};
function guestPrevHtml(){
  const date = view.gdate || todayStr(); const k = curSeasonKey();
  const wd = new Date(date+'T12:00:00').getDay();
  const closed = (S.settings.closed||[]).includes(wd) ? `<div class="g-closed">${ico('spark')}${DAYNAME[wd]} ist Ruhetag. So sähe die Karte trotzdem aus.</div>` : '';
  return closed + guestHtml(k, date) + specialsFor(date).filter(sp => sp.mode === 'tageskarte').map(sp=>`<div class="tk-label">Eigene Tageskarte · ${esc(sp.name)}</div>${tageskarteHtml(sp, k)}`).join('');
}
function curSeasonKey(){ return view.gseason || seasonFor(view.gdate || todayStr()) || 'winter'; }

/* ---------- Speisekarte: Reiter inkl. Saison & Aktionen ---------- */
renderMenu = function(){
  const hidden = S.menu.filter(m=>m.hidden).length;
  const live = S.specials.filter(sp => spStatus(sp)[0]==='live').length;
  const head = `<div class="page-h"><div><div class="eyebrow">${S.menu.length} Gerichte · ${secList().length} Kategorien${hidden?` · ${hidden} ausgeblendet`:''}</div><h1>Speisekarte</h1></div>
    <div class="row-btns">${view.mtab==='guest' && !FRAMED ? `<button type="button" class="btn" data-act="printMenu">${ico('print')}Drucken</button>` : ''}${view.mtab==='plan' ? `<button type="button" class="btn primary" data-act="newSpecial">${ico('plus')}Aktion</button>` : `<button type="button" class="btn primary" data-act="newMenu">${ico('plus')}Gericht</button>`}</div></div>
  <div class="toolbar">${seg('mtab', view.mtab, [['calc','Kalkulation'],['guest','Gestalten & PDF'],['plan','Saison & Aktionen', live?'live':null],['layout','Aufbau & Reihenfolge']])}</div>`;
  return head + (view.mtab==='guest' ? renderGuest() : view.mtab==='layout' ? renderLayout() : view.mtab==='plan' ? renderPlan() : renderMenuCalc());
};
printMenu = function(){ $('#print').innerHTML = guestPrevHtml().replace(/<div class="g-closed">.*?<\/div>/,''); document.body.classList.add('print-menu'); window.print(); };

function parseMD(v){ const m = String(v).trim().match(/^(\d{1,2})\.(\d{1,2})\.?$/); if(!m) return null; const d = +m[1], mo = +m[2]; if(mo<1||mo>12||d<1||d>31) return null; return `${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function refreshGuest(){ const p = $('.guest-prev'); if(p) p.innerHTML = guestPrevHtml(); }

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return;
  const id = el.dataset.id, s = S.settings.seasons[curSeasonKey()];
  switch(el.dataset.act){
    case 'importPick': $('#importFile').click(); break;
    case 'gdate': view.gdate = id; view.gseason = null; render(); break;
    case 'gseason': view.gseason = id || null; render(); break;
    case 'glayout': s.layout = id; save(); render(); break;
    case 'gorn': s.orn = id; save(); render(); break;
    case 'palPreset': s.pal = {...THEMES[id].pal}; save(); render(); toast(`Farben „${THEMES[id].theme}“ übernommen`); break;
    case 'gcover': pickImage(data => { if(s.cover) imgDel(s.cover); const iid = uid('img'); imgPut(iid, data); s.cover = iid; save(); render(); toast('Titelbild gespeichert'); }); break;
    case 'gcoverDel': imgDel(s.cover); s.cover = ''; save(); render(); break;
    case 'gReset': ask(`Design der ${s.title} auf „${THEMES[id].theme}“ zurücksetzen? Zeitraum und Texte bleiben.`, () => { const d = seasonDefaults(id); Object.assign(s, {layout:d.layout, pal:d.pal, fd:d.fd, fb:d.fb, orn:d.orn}); }, 'Zurücksetzen'); break;
    case 'editSeason': view.mtab = 'guest'; view.gseason = id; go('menu'); break;
    case 'newSpecial': specialDialog(); break;
    case 'editSpecial': specialDialog(S.specials.find(x=>x.id===id)); break;
    case 'previewSpecial': { const sp = S.specials.find(x=>x.id===id); view.gdate = sp.from; view.gseason = null; view.mtab = 'guest'; go('menu'); break; }
    case 'dupSpecial': { const sp = S.specials.find(x=>x.id===id); const n = JSON.parse(JSON.stringify(sp)); n.id = uid('sp'); const sh = d => `${+d.slice(0,4)+1}${d.slice(4)}`; n.from = sh(sp.from); n.to = sh(sp.to||sp.from); S.specials.push(n); save(); render(); toast(`„${n.name}“ für ${n.from.slice(0,4)} angelegt. Datum bitte prüfen.`); break; }
    case 'printSpecial': { const sp = S.specials.find(x=>x.id===id); $('#print').innerHTML = tageskarteHtml(sp); document.body.classList.add('print-menu'); window.print(); break; }
  }
});
document.addEventListener('input', e => {
  const t = e.target; if(!t.closest('#app')) return;
  const s = S.settings.seasons[curSeasonKey()];
  if(t.dataset.st){ s[t.dataset.st] = t.value; save(); refreshGuest(); }
  if(t.dataset.pal){ s.pal[t.dataset.pal] = t.value; save(); refreshGuest(); }
});
document.addEventListener('change', e => {
  const t = e.target; if(!t.closest('#app')) return;
  const s = S.settings.seasons[curSeasonKey()];
  if(t.id === 'gdate' && t.value){ view.gdate = t.value; view.gseason = null; render(); return; }
  if(t.dataset.pal){ document.querySelectorAll('.sw-preset').forEach(b=>b.classList.remove('on')); return; }
  if(t.dataset.sv){ if(t.dataset.sv === 'fontpair'){ const [a,b] = t.value.split('|'); s.fd = a; s.fb = b; } else s[t.dataset.sv] = t.checked; save(); refreshGuest(); return; }
  if(t.dataset.smd){ const v = parseMD(t.value); if(!v){ t.value = mdLabel(s[t.dataset.smd]); toast('Datum als TT.MM. eingeben, z. B. 01.12.'); return; } s[t.dataset.smd] = v; save(); render(); toast(`${s.title}: ${mdLabel(s.from)} bis ${mdLabel(s.to)}`); return; }
  if(t.dataset.ms){ const [mid,k] = t.dataset.ms.split(':'); const m = S.menu.find(x=>x.id===mid); let set = new Set(m.seasons.length ? m.seasons : SEASONS.map(x=>x[0])); t.checked ? set.add(k) : set.delete(k); m.seasons = set.size === 4 ? [] : SEASONS.map(x=>x[0]).filter(x=>set.has(x)); save(); const st = t.closest('tr').querySelector('small'); if(st) st.textContent = m.section + (m.seasons.length ? '' : ' · ganzjährig'); if(!set.size) toast(`„${m.name}“ steht jetzt auf keiner Saisonkarte`); return; }
});

/* =====================================================================
   Einkauf: Lieferanten, Bestellungen, Wareneingang, Reklamation, Rollen
   ===================================================================== */
const SUP_CATS = {fleisch:'Fleisch & Wurst', getraenke:'Getränke', wein:'Wein & Spirituosen', gross:'Großhandel', baeckerei:'Bäckerei', molkerei:'Molkerei & Käse', gemuese:'Obst, Gemüse & Eier'};
const CHANNELS = {email:'E-Mail', whatsapp:'WhatsApp', shop:'Webshop / App', phone:'Telefon', rep:'Vertreter'};
const ROLES = {owner:'Inhaber', chef:'Küchenchef', bar:'Bar', staff:'Mitarbeiter'};
const OSTAT = {draft:'Entwurf', approval:'Zur Freigabe', sent:'Gesendet', confirmed:'Bestätigt', delivered:'Geliefert', complaint:'Reklamation', cancelled:'Storniert'};
const LSTAT = {ok:'in Ordnung', short:'zu wenig', missing:'fehlt', damaged:'beschädigt', wrong:'falscher Artikel', subst:'Ersatzartikel'};
const CSTAT = {open:'offen', credit:'Gutschrift erhalten', closed:'erledigt'};
const DRINK_CATS = ['getraenke','wein'];

// Demo-Lieferanten (frei erfunden) laut Betriebsleitung
const DEMO_SUP = [
  ['sup_fleisch','Metzgerei Brunnhuber','fleisch','whatsapp',{contact:'Hr. Brunnhuber', phone:'+43 664 1234501', whatsapp:'+43 664 1234501', email:'bestellung@metzgerei-brunnhuber.example'},[1,3,5],'14:00',[2,4,6],150,'MB'],
  ['sup_getraenke','Getränke Wildalm','getraenke','shop',{contact:'Kundenservice', phone:'+43 5282 4401', email:'service@getraenke-wildalm.example', shopUrl:'https://shop.getraenke-wildalm.example'},[1,4],'12:00',[2,5],300,'GW'],
  ['sup_wein','Weinkontor Steinberger','wein','email',{contact:'Fr. Steinberger', phone:'+43 512 99880', email:'order@weinkontor-steinberger.example'},[2],'16:00',[4],250,'WS'],
  ['sup_gross','Gastro-Großmarkt Inntal','gross','shop',{contact:'Außendienst Hr. Moser', phone:'+43 5332 7700', email:'kundenservice@grossmarkt-inntal.example', shopUrl:'https://shop.grossmarkt-inntal.example'},[1,2,3,4,5],'18:00',[2,3,4,5,6],200,'GI'],
  ['sup_baeck','Bäckerei Kornstube','baeckerei','whatsapp',{contact:'Backstube', phone:'+43 664 1234505', whatsapp:'+43 664 1234505'},[0,1,2,3,4,5,6],'15:00',[0,1,2,3,4,5,6],40,'BK'],
  ['sup_molk','Talmolkerei Gerlostal','molkerei','email',{contact:'Bestellannahme', phone:'+43 5284 6610', email:'bestellung@talmolkerei.example'},[1,3,5],'11:00',[2,4,6],120,'TG'],
  ['sup_gem','Gemüsehof Hainzl','gemuese','phone',{contact:'Fam. Hainzl', phone:'+43 664 1234507'},[1,3,5],'17:00',[2,4,6],80,'GH'],
];
const SUP_MAP = {Metzgerei:'sup_fleisch', 'Großhandel':'sup_gross', 'Bäckerei':'sup_baeck', Molkerei:'sup_molk', Sennerei:'sup_molk', 'Gemüsehändler':'sup_gem', Bauernhof:'sup_gem', Weinhandel:'sup_wein'};
const DEMO_PACK = {flour:['Sack 10 kg',10], sugar:['Sack 10 kg',10], icing:['Pkg 1 kg',1], oil:['Kanister 10 l',10], fries:['Karton 4×2,5 kg',10], egg:['Tray 30 Stk',30], quail:['Pkg 18 Stk',18],
  milk:['Kiste 12×1 l',12], cream:['Karton 6×1 l',6], butter:['Karton 10×250 g',2.5], cremefr:['Becher 1 kg',1], brioche:['Karton 24 Stk',24], wine:['Bag-in-Box 5 l',5], kirsch:['Flasche 0,7 l',0.7],
  salt:['Pkg 1 kg',1], potato:['Sack 25 kg',25], onion:['Sack 10 kg',10], apples:['Kiste 13 kg',13], lemon:['Netz 10 Stk',10], passata:['Karton 6×1 kg',6], schmalz:['Kübel 2,5 kg',2.5], crumbs:['Sack 5 kg',5],
  bier:['Fass 30 l',30], mineral:['Kiste 24 Stk',24], almdudler:['Kiste 24 Stk',24], apfelsaft:['Kiste 6 Stk',6], gv:['Karton 6 Fl.',6], zweigelt:['Karton 6 Fl.',6]};
const DEMO_DRINKS = [
  ['bier','Zillertaler Bier vom Fass','l',2.9,'A','sup_getraenke',45,60,'K'],
  ['mineral','Mineralwasser 0,33 l','Stk',0.42,'','sup_getraenke',30,72,'L'],
  ['almdudler','Almdudler 0,35 l','Stk',0.78,'','sup_getraenke',40,48,'L'],
  ['apfelsaft','Apfelsaft naturtrüb 1 l','Stk',1.65,'','sup_getraenke',14,12,'L'],
  ['gv','Grüner Veltliner Qualitätswein 0,75 l','Stk',6.4,'O','sup_wein',8,18,'W'],
  ['zweigelt','Zweigelt Qualitätswein 0,75 l','Stk',7.2,'O','sup_wein',20,18,'W'],
];

function einkaufSeed(d){
  const s = d.settings;
  Object.assign(s, {address:'Gerlos 202, 6281 Gerlos', deliveryNote:'Anlieferung über den Hintereingang zur Küche', phone:'+43 5284 5283-11', email:'genuss@dahuam202.at', orderLimit:800, orderNo:1,
    users:[{id:'u_owner',name:'Inhaber',role:'owner'},{id:'u_chef',name:'Küchenchef',role:'chef'},{id:'u_bar',name:'Bar',role:'bar'},{id:'u_staff',name:'Commis',role:'staff'}], currentUser:'u_chef'});
  d.suppliers = DEMO_SUP.map(([id,name,cat,channel,c,orderDays,cutoff,deliveryDays,minOrder,pre]) => ({id,name,cat,channel,contact:c.contact||'',phone:c.phone||'',whatsapp:c.whatsapp||'',email:c.email||'',shopUrl:c.shopUrl||'',customerNo:'4'+String(1000+DEMO_SUP.findIndex(x=>x[0]===id)*37),orderDays,cutoff,deliveryDays,minOrder,freight:0,note:'',prefix:pre,active:true}));
  DEMO_DRINKS.forEach(([id,name,unit,price,alg,sup,stock,minStock,loc]) => d.products.push({id,name,unit,price,lossCold:0,lossHot:0,alg,pieceG:'',stock,minStock,loc,supplier:sup}));
  d.products.forEach(p => { if(SUP_MAP[p.supplier]) p.supplier = SUP_MAP[p.supplier]; const pk = DEMO_PACK[p.id]; p.pack = pk ? pk[0] : ''; p.packQty = pk ? pk[1] : 0; });
  const cnt = {}; d.products.forEach(p => { const sp = d.suppliers.find(x=>x.id===p.supplier); if(sp){ cnt[sp.id] = (cnt[sp.id]||0)+1; p.artNo = `${sp.prefix}-${String(100+cnt[sp.id]*7)}`; } else p.artNo = ''; });
  d.orders = [];
  const t = todayStr();
  const mk = (sid, daysAgo, status, lines, extra={}) => { const sp = d.suppliers.find(x=>x.id===sid); const o = {id:uid('o'), no:`B-${t.slice(0,4)}-${String(s.orderNo++).padStart(4,'0')}`, supplier:sid, createdAt:daysAgoIso(daysAgo+1), createdBy:daysAgo>3?'u_owner':'u_chef', status, deliveryDate:addDays(t,-daysAgo), note:'', sentAt:daysAgoIso(daysAgo+1), sentVia:CHANNELS[sp.channel],
      lines: lines.map(([pid,n,dn,ip,ls]) => { const p = d.products.find(x=>x.id===pid); const f = p.packQty||1; return {pid, n, f, ou:p.packQty?p.pack:p.unit, price:Math.round(p.price*f*100)/100, artNo:p.artNo, delivered: dn ?? null, invPrice: ip ?? null, ls: ls || ''}; }), ...extra}; d.orders.push(o); return o; };
  mk('sup_gross', 6, 'delivered', [['flour',2,2],['sugar',1,1],['oil',1,1],['fries',3,3]], {receipt:{date:daysAgoIso(6), noteNo:'LS 88412', checkedBy:'u_chef', temp:'', photo:''}});
  mk('sup_fleisch', 5, 'delivered', [['pork',10,10],['veal',5,5,34.5],['beef_mince',6,6]], {receipt:{date:daysAgoIso(5), noteNo:'LS 2231', checkedBy:'u_chef', temp:'2,8 °C', photo:''}});
  mk('sup_wein', 9, 'delivered', [['gv',3,3],['zweigelt',2,2],['kirsch',2,2]], {receipt:{date:daysAgoIso(9), noteNo:'R 2026-1190', checkedBy:'u_bar', temp:'', photo:''}});
  mk('sup_getraenke', 4, 'delivered', [['bier',2,2],['mineral',3,3],['almdudler',2,2]], {receipt:{date:daysAgoIso(4), noteNo:'LS 55021', checkedBy:'u_bar', temp:'', photo:''}});
  mk('sup_baeck', 1, 'delivered', [['brioche',2,2],['bread',6,6]], {receipt:{date:daysAgoIso(1), noteNo:'', checkedBy:'u_staff', temp:'', photo:''}});
  mk('sup_gem', 3, 'complaint', [['potato',1,1],['romaine',4,2,null,'short'],['parsley',1,0,null,'missing'],['lemon',2,2]], {receipt:{date:daysAgoIso(3), noteNo:'ohne Nr.', checkedBy:'u_chef', temp:'', photo:''}, complaint:{status:'open', text:'Römersalat: 2 von 4 kg geliefert. Petersilie fehlt (1 kg). Bitte Gutschrift oder Nachlieferung.'}});
  const mo = mk('sup_molk', 0, 'confirmed', [['milk',2],['cream',1],['butter',2],['bergkase',4]]); mo.confirmedNote = 'Telefonisch bestätigt';
  const fl = mk('sup_fleisch', -1, 'sent', [['veal',5],['speck',3],['beef_goulash',6]]);
}
function daysAgoIso(n){ const x = new Date(); x.setDate(x.getDate()-n); return x.toISOString(); }
function einkaufMigrate(d){
  const s = d.settings;
  if(!d.suppliers){ d.suppliers = [];
    const names = [...new Set(d.products.map(p=>p.supplier).filter(Boolean))];
    names.forEach(n => { const id = uid('sup'); d.suppliers.push({id, name:n, cat:'gross', channel:'email', contact:'', phone:'', whatsapp:'', email:'', shopUrl:'', customerNo:'', orderDays:[1,3,5], cutoff:'12:00', deliveryDays:[2,4,6], minOrder:0, freight:0, note:'', prefix:'', active:true}); d.products.forEach(p => { if(p.supplier===n) p.supplier = id; }); });
  }
  d.products.forEach(p => { if(p.pack==null){ p.pack = ''; p.packQty = 0; } if(p.artNo==null) p.artNo = ''; });
  if(!d.orders) d.orders = [];
  if(!s.users) s.users = [{id:'u_owner',name:'Inhaber',role:'owner'}];
  if(!s.currentUser) s.currentUser = s.users[0].id;
  if(s.orderLimit==null) s.orderLimit = 800; if(!s.orderNo) s.orderNo = d.orders.length+1;
  ['address','deliveryNote','phone','email'].forEach(k => { if(s[k]==null) s[k] = ''; });
  return d;
}

/* ---------- Hilfsfunktionen ---------- */
const SUP = id => (S.suppliers||[]).find(x=>x.id===id);
const ORD = id => (S.orders||[]).find(x=>x.id===id);
function supName(p){ const s = SUP(p.supplier); return s ? s.name : (p.supplier || 'kein Lieferant'); }
function me(){ if(typeof cloudReady==='function' && cloudReady() && CL.member) return {id:CL.session?.user?.id||'cloud', name:CL.member.name, role:CL.member.role}; return S.settings.users.find(u=>u.id===S.settings.currentUser) || {id:'?', name:'?', role:'owner'}; }
function userName(id){ const u = (S.settings.users||[]).find(x=>x.id===id); return u ? u.name : (id && id.length > 20 ? 'Team' : id || '—'); }
function orderTotal(o){ return o.lines.reduce((t,l)=>t + (+l.n||0)*(+l.price||0), 0); }
function deliveredTotal(o){ return o.lines.reduce((t,l)=>t + (+(l.delivered ?? l.n)||0)*(+(l.invPrice ?? l.price)||0), 0); }
function supProducts(sid){ return stockProducts().filter(p=>p.supplier===sid).sort(byName); }
function packSuggest(p){ const q = orderSuggest(p); if(!q) return 0; return p.packQty ? Math.ceil(q/p.packQty) : q; }
function lineFor(p, n){ const f = p.packQty || 1; return {pid:p.id, n, f, ou:p.packQty ? p.pack : p.unit, price:Math.round((+p.price||0)*f*100)/100, artNo:p.artNo||'', delivered:null, invPrice:null, ls:''}; }
function hm(s){ const [h,m] = String(s||'00:00').split(':').map(Number); return (h||0)*60+(m||0); }
function nowMin(){ const d = new Date(); return d.getHours()*60+d.getMinutes(); }
function wd(dateStr){ return new Date(dateStr+'T12:00:00').getDay(); }
function nextOrderDate(sp){ const t = todayStr(); for(let i=0;i<14;i++){ const d = addDays(t,i); if(sp.orderDays.includes(wd(d)) && (i>0 || nowMin() < hm(sp.cutoff))) return d; } return t; }
function nextDelivery(sp, orderDate){ orderDate = orderDate || nextOrderDate(sp); for(let i=1;i<15;i++){ const d = addDays(orderDate,i); if(sp.deliveryDays.includes(wd(d))) return d; } return addDays(orderDate,1); }
function deliveryOptions(sp){ const base = nextOrderDate(sp); const out = []; for(let i=1;i<21 && out.length<5;i++){ const d = addDays(base,i); if(sp.deliveryDays.includes(wd(d))) out.push(d); } return out; }
function dayLabel(d){ return new Date(d+'T12:00:00').toLocaleDateString('de-AT',{weekday:'long', day:'2-digit', month:'2-digit'}); }
function lastOrder(sid){ return S.orders.filter(o=>o.supplier===sid && o.status!=='draft' && o.status!=='cancelled').sort((a,b)=>(b.sentAt||b.createdAt).localeCompare(a.sentAt||a.createdAt))[0]; }
function draftFor(sid){ return S.orders.find(o=>o.supplier===sid && (o.status==='draft' || o.status==='approval')); }
function canSend(o){ const u = me(), sp = SUP(o.supplier); if(u.role==='owner') return true; if(u.role==='staff') return false; const drink = DRINK_CATS.includes(sp?.cat); if(u.role==='bar' && !drink) return false; if(u.role==='chef' && drink) return false; return orderTotal(o) <= (+S.settings.orderLimit||Infinity); }
function sendBlockReason(o){ const u = me(), sp = SUP(o.supplier); if(u.role==='staff') return 'Mitarbeiter dürfen Bestellungen vorbereiten, aber nicht senden.'; const drink = DRINK_CATS.includes(sp?.cat); if(u.role==='bar' && !drink) return 'Die Bar bestellt nur Getränke und Wein.'; if(u.role==='chef' && drink) return 'Getränke und Wein bestellt die Bar.'; if(orderTotal(o) > +S.settings.orderLimit) return `Über dem Limit von ${eur(S.settings.orderLimit)}: Der Inhaber muss freigeben.`; return ''; }
function statusPill(st){ return `<span class="ost ${st}">${OSTAT[st]||st}</span>`; }
function orderNoNext(){ const n = S.settings.orderNo++; return `B-${todayStr().slice(0,4)}-${String(n).padStart(4,'0')}`; }
function supStats(sid){ const done = S.orders.filter(o=>o.supplier===sid && o.receipt); const late = done.filter(o=>o.receipt.date.slice(0,10) > o.deliveryDate).length; const short = done.filter(o=>o.lines.some(l=>l.ls && l.ls!=='ok')).length; return {n:done.length, onTime: done.length ? Math.round((done.length-late)/done.length*100) : null, shortRate: done.length ? Math.round(short/done.length*100) : null}; }
function priceHistory(pid){ return movesByDate().filter(m=>m.pid===pid && m.type==='in').slice(0,6).map(m=>m.price); }

function newOrder(sid, fill=true){
  const sp = SUP(sid); const ex = draftFor(sid); if(ex) return ex;
  const o = {id:uid('o'), no:orderNoNext(), supplier:sid, createdAt:new Date().toISOString(), createdBy:me().id, status:'draft', deliveryDate:nextDelivery(sp), note:'', lines:[]};
  if(fill) lowStock().filter(p=>p.supplier===sid).forEach(p => { const n = packSuggest(p); if(n>0) o.lines.push(lineFor(p,n)); });
  S.orders.push(o); return o;
}
function orderText(o){
  if(typeof o === 'string') o = ORD(o);
  const sp = SUP(o.supplier), s = S.settings;
  const rows = o.lines.filter(l=>+l.n>0).map(l => { const p = P(l.pid); return `• ${num(l.n,2)} × ${l.ou}${l.artNo?'  ['+l.artNo+']':''}  ${p?p.name:'?'}`; }).join('\n');
  return `Bestellung ${o.no}\n${s.name}${sp.customerNo?' · Kundennr. '+sp.customerNo:''}\nLieferadresse: ${s.address}${s.deliveryNote?' ('+s.deliveryNote+')':''}\nGewünschte Lieferung: ${dayLabel(o.deliveryDate)}\nAnsprechpartner: ${userName(o.createdBy)==='?'?me().name:me().name} · ${s.phone}\n\n${rows}\n${o.note?'\nBemerkung: '+o.note+'\n':''}\nErsatzartikel bitte nur nach Rücksprache. Bitte bestätigen Sie die Bestellung kurz per Antwort. Danke!\n${s.name}`;
}
function mailHref(o){ const sp = SUP(o.supplier); return `mailto:${encodeURIComponent(sp.email)}?subject=${encodeURIComponent(`Bestellung ${o.no} – ${S.settings.name}`)}&body=${encodeURIComponent(orderText(o))}`; }
function waHref(o){ const sp = SUP(o.supplier); return `https://wa.me/${String(sp.whatsapp||sp.phone).replace(/\D/g,'').replace(/^00/,'')}?text=${encodeURIComponent(orderText(o))}`; }
function receiveIn(p, units, unitPrice, note, date){
  const old = p.price; if(unitPrice && Math.abs(unitPrice - p.price) > 0.0001){ const s0 = Math.max(0, +p.stock||0); p.price = Math.round((s0*p.price + units*unitPrice)/(s0+units)*100)/100; }
  addMove('in', p.id, units, note, unitPrice || p.price, date); if(unitPrice) markPrice(p, 'Wareneingang'); if(old !== p.price) S.moves[0].prevPrice = old;
}

/* ---------- Ansicht: Bestellungen-Cockpit ---------- */
orderView = function(){
  if(view.order && ORD(view.order)) return orderEditor(ORD(view.order));
  const t = todayStr(), now = nowMin(), today = wd(t);
  const sups = (S.suppliers||[]).filter(s=>s.active);
  const todayList = sups.filter(s => s.orderDays.includes(today)).sort((a,b)=>hm(a.cutoff)-hm(b.cutoff));
  const expected = S.orders.filter(o => ['sent','confirmed'].includes(o.status) && o.deliveryDate <= addDays(t,1)).sort((a,b)=>a.deliveryDate.localeCompare(b.deliveryDate));
  const open = S.orders.filter(o => ['draft','approval','sent','confirmed','complaint'].includes(o.status));
  const card = sp => { const low = lowStock().filter(p=>p.supplier===sp.id); const val = low.reduce((a,p)=>a+packSuggest(p)*(p.packQty||1)*p.price,0); const st = supToday(sp); const left = st.left; const dr = draftFor(sp.id); const last = lastOrder(sp.id);
    const cls = st.state === 'sent' ? 'past done' : st.state === 'past' ? 'past' : left < 60 ? 'urgent' : left < 180 ? 'soon' : '';
    return `<article class="oc ${cls}"><div class="oc-h"><span class="tag">${esc(SUP_CATS[sp.cat]||'')}</span><span class="cd mono">${esc(st.label)}</span></div>
      <h3>${esc(sp.name)}</h3><div class="muted sm">${CHANNELS[sp.channel]} · bis ${esc(sp.cutoff)} Uhr · Lieferung ${dayLabel(st.delivery)}</div>
      <div class="oc-m"><span><b class="mono">${low.length}</b><small>unter Mindestbestand</small></span><span><b class="mono">${eur(val)}</b><small>Vorschlag${sp.minOrder ? ` · Mindestwert ${eur(sp.minOrder)}` : ''}</small></span></div>
      <div class="meter"><i style="width:${Math.min(100, sp.minOrder?val/sp.minOrder*100:100).toFixed(0)}%"></i></div>
      <div class="row-btns">${dr ? `<button type="button" class="btn sm primary" data-act="ordOpen" data-id="${dr.id}">${statusPill(dr.status)} öffnen</button>` : `<button type="button" class="btn sm primary" data-act="ordNew" data-id="${sp.id}">${ico('cart')}Bestellung vorbereiten</button>`}${last?`<button type="button" class="btn sm" data-act="ordRe" data-id="${last.id}">Wie zuletzt</button>`:''}</div></article>`; };
  return `<div class="ord-top">
    <section class="panel"><div class="panel-h"><h2>Heute bestellen · ${DAYNAME[today]}</h2><span class="muted sm">${todayList.length} Lieferanten</span></div>
      ${todayList.length ? `<div class="oc-grid">${todayList.map(card).join('')}</div>` : '<p class="hint">Heute ist kein Bestelltag.</p>'}
    </section>
    <section class="panel"><div class="panel-h"><h2>Erwartete Lieferungen</h2></div>
      ${expected.length ? `<ul class="todo">${expected.map(o=>{ const sp = SUP(o.supplier); const late = o.deliveryDate < t; return `<li><button type="button" data-act="ordRecv" data-id="${o.id}"><b class="${late?'bad-t':''}">${late?'!':o.deliveryDate===t?'heute':'morgen'}</b><span>${esc(sp.name)} · ${o.lines.length} Positionen · ${eur(orderTotal(o))}<small class="muted" style="display:block">${o.no} · ${statusPill(o.status)} ${late?'· überfällig':''}</small></span>${ico('arrow','flip')}</button></li>`; }).join('')}</ul>` : '<p class="hint">Heute und morgen kommen keine bestellten Lieferungen.</p>'}
    </section></div>
  <h2 class="sec-h">Letzte Bestellung je Lieferant</h2>
  <div class="lo-grid">${sups.map(sp => { const o = lastOrder(sp.id); const st = supStats(sp.id); return `<article class="lo">
    <div class="lo-h"><b>${esc(sp.name)}</b>${o?statusPill(o.status):''}</div>
    ${o ? `<div class="muted sm">${o.no} · ${fmtDate(o.sentAt||o.createdAt)} · von ${esc(userName(o.createdBy))}</div>
      <div class="lo-m"><span class="mono">${o.lines.length} Pos.</span><span class="mono">${o.receipt ? `<small class="tot-l">geliefert</small> ${eur(deliveredTotal(o))}` : `<small class="tot-l">bestellt</small> ${eur(orderTotal(o))}`}</span><span class="muted sm">${st.onTime!=null?`pünktlich ${st.onTime} %`:''}</span></div>
      <div class="row-btns"><button type="button" class="btn sm" data-act="ordOpen" data-id="${o.id}">Ansehen</button><button type="button" class="btn sm" data-act="ordRe" data-id="${o.id}">Nachbestellen</button></div>` : `<p class="hint">Noch keine Bestellung.</p><div class="row-btns"><button type="button" class="btn sm" data-act="ordNew" data-id="${sp.id}">Erste Bestellung</button></div>`}
  </article>`; }).join('')}</div>
  <h2 class="sec-h">Alle Bestellungen<small class="muted sm">${open.length} offen</small></h2>
  <div class="chips-row">${['all','open','draft','approval','sent','confirmed','delivered','complaint'].map(k=>`<button type="button" class="chip ${(view.ofilter||'open')===k?'on':''}" data-act="ofilter" data-id="${k}">${k==='all'?'Alle':k==='open'?'Offen':OSTAT[k]}<small>${k==='all'?S.orders.length:k==='open'?open.length:S.orders.filter(o=>o.status===k).length}</small></button>`).join('')}</div>
  <section class="panel flush">${orderList()}</section>`;
};
function orderList(){
  const f = view.ofilter || 'open';
  const list = S.orders.filter(o => f==='all' || (f==='open' ? ['draft','approval','sent','confirmed','complaint'].includes(o.status) : o.status===f)).sort((a,b)=>(b.sentAt||b.createdAt).localeCompare(a.sentAt||a.createdAt));
  return list.length ? `<ul class="olist">${list.map(o=>{ const sp = SUP(o.supplier); return `<li><button type="button" data-act="ordOpen" data-id="${o.id}">
    <span class="mono sm muted">${o.no}</span><span class="on"><b>${esc(sp?sp.name:'?')}</b><small class="muted">${o.lines.length} Positionen · Lieferung ${fmtDate(o.deliveryDate+'T12:00:00')}</small></span>${statusPill(o.status)}<span class="mono ol-tot">${o.receipt ? `<small class="tot-l">geliefert</small> ${eur(deliveredTotal(o))}` : `<small class="tot-l">bestellt</small> ${eur(orderTotal(o))}`}</span></button></li>`; }).join('')}</ul>` : '<div class="empty">Keine Bestellungen in dieser Ansicht.</div>';
}

/* ---------- Bestellung bearbeiten / senden / empfangen ---------- */
function orderEditor(o){
  const sp = SUP(o.supplier); const tot = orderTotal(o); const editable = ['draft','approval'].includes(o.status);
  const recv = view.recv === o.id && ['sent','confirmed'].includes(o.status);
  const block = sendBlockReason(o);
  const hasCold = o.lines.some(l => P(l.pid)?.loc === 'K' || P(l.pid)?.loc === 'T');
  const head = `<button type="button" class="back" data-act="ordBack">${ico('arrow')}Alle Bestellungen</button>
  <section class="panel ord-head">
    <div><div class="eyebrow">${o.no} · ${esc(SUP_CATS[sp.cat]||'')}</div><h1 class="h-ord">${esc(sp.name)}</h1>
      <div class="muted sm">${CHANNELS[sp.channel]}${sp.email?' · '+esc(sp.email):''}${sp.phone?' · '+esc(sp.phone):''}${sp.customerNo?' · Kundennr. '+esc(sp.customerNo):''}</div></div>
    <div class="ord-st">${statusPill(o.status)}<span class="muted sm">erstellt ${fmtDate(o.createdAt)} von ${esc(userName(o.createdBy))}${o.sentAt?` · gesendet ${fmtDate(o.sentAt)} via ${esc(o.sentVia||'')}`:''}</span></div>
  </section>`;
  if(recv) return head + receiveForm(o, hasCold);
  const rows = o.lines.map((l,i) => { const p = P(l.pid); const hist = priceHistory(l.pid); const ip = l.invPrice != null && l.invPrice !== '' ? +l.invPrice : null; const dev = o.receipt && ip != null && +l.price && Math.abs(ip - l.price) > 0.004 ? (ip/l.price-1)*100 : null; return `<tr>
    <td data-l="Artikel"><b class="pn">${esc(p?p.name:'?')}</b><small class="muted">${esc(l.artNo||'ohne Art.-Nr.')} · Bestand ${p?qtyFmt(+p.stock||0,p):'—'}${hist.length>1 && hist[0]!==hist[1] && hist[1] ? ` · Preis ${hist[0]>hist[1]?'▲':'▼'} ${num(Math.abs(hist[0]/hist[1]-1)*100,1)} %`:''}</small></td>
    <td class="r" data-l="Menge">${editable ? `<span class="qty"><input id="ol-${i}" class="num-in" type="text" inputmode="decimal" data-num="req" data-msg="Ungültige Menge, nicht geändert" data-ol="${i}" value="${numIn(l.n)}" aria-label="Menge ${esc(p?p.name:'')}"><em>× ${esc(l.ou)}</em></span>` : `<span class="mono">${num(l.n,2)} × ${esc(l.ou)}</span>`}</td>
    <td class="r mono muted" data-l="= Einheit">${l.f!==1?qtyFmt(l.n*l.f,p):''}</td>
    <td class="r mono" data-l="Preis">${eur(l.price)}</td><td class="r mono" data-l="Summe">${eur(l.n*l.price)}</td>
    ${o.receipt ? `<td class="r mono ${l.ls&&l.ls!=='ok'?'bad-t':''}" data-l="Geliefert">${l.delivered!=null?num(l.delivered,2):'—'}${l.ls&&l.ls!=='ok'?' · '+LSTAT[l.ls]:''}</td>
    <td class="r mono" data-l="Rechnungspreis">${ip != null ? eur(ip) : '—'}${dev != null ? `<small class="dev ${dev>3?'bad-t':dev<0?'good-t':''}">${eur(l.price)} → ${eur(ip)} · ${dev>0?'+':'−'}${num(Math.abs(dev),1)} %</small>` : ''}</td>` : ''}
    <td class="ol-x">${editable?`<button type="button" class="icon-btn" data-act="olDel" data-id="${i}" aria-label="Position entfernen">${ico('x')}</button>`:''}</td></tr>`; }).join('');
  const addable = supProducts(sp.id).filter(p => !o.lines.some(l=>l.pid===p.id));
  const sendBtns = () => { if(!editable) return ''; if(!o.lines.some(l=>+l.n>0)) return '<p class="hint">Fügen Sie mindestens eine Position hinzu.</p>';
    if(block) return `<div class="warn-box">${ico('spark')}<span>${esc(block)}</span>${o.status!=='approval' && me().role!=='staff' ? `<button type="button" class="btn sm" data-act="ordApproval" data-id="${o.id}">Zur Freigabe</button>` : ''}${o.status==='approval'?'<span class="muted sm">wartet auf Freigabe</span>':''}</div>`;
    const cloud = typeof cloudReady==='function' && cloudReady() && sp.email;
    const b = [];
    if(o.status==='approval' && me().role==='owner') b.push(`<button type="button" class="btn" data-act="ordApprove" data-id="${o.id}">Freigeben</button>`);
    if(cloud) b.push(`<button type="button" class="btn primary" data-act="ordCloudSend" data-id="${o.id}">${ico('truck')}Jetzt per E-Mail senden</button>`);
    if(sp.email) b.push(`<a class="btn ${cloud?'':'primary'}" href="${mailHref(o)}" data-act="ordOpened" data-id="${o.id}:E-Mail">${ico('menu')}E-Mail öffnen</a>`);
    if(sp.whatsapp) b.push(`<a class="btn ${!sp.email&&!cloud?'primary':''}" href="${waHref(o)}" target="_blank" rel="noopener" data-act="ordOpened" data-id="${o.id}:WhatsApp">WhatsApp öffnen</a>`);
    if(sp.shopUrl) b.push(`<a class="btn" href="${esc(sp.shopUrl)}" target="_blank" rel="noopener" data-act="ordOpened" data-id="${o.id}:Webshop">Webshop öffnen</a>`);
    b.push(`<button type="button" class="btn" data-act="ordCopy" data-id="${o.id}">${ico('copy')}Text kopieren</button>`);
    if(!FRAMED) b.push(`<button type="button" class="btn" data-act="ordPrint" data-id="${o.id}">${ico('print')}Drucken</button>`);
    b.push(`<button type="button" class="btn" data-act="ordMarkSent" data-id="${o.id}">${sp.channel==='phone'?'Telefonisch bestellt':'Als gesendet markieren'}</button>`);
    return `<div class="send-row">${b.join('')}</div>${view.opened===o.id?`<div class="ok-box">Bestellung im ${esc(view.openedVia||'')} geöffnet? Nach dem Senden hier bestätigen: <button type="button" class="btn sm" data-act="ordMarkSent" data-id="${o.id}">Ja, gesendet</button></div>`:''}`; };
  const below = sp.minOrder && tot < sp.minOrder;
  return head + `<div class="grid2">
    <div class="col">
      <section class="panel flush"><div class="panel-h pad"><h2>Positionen</h2><span class="muted sm">${o.lines.length}</span></div>
        <div class="tbl-wrap"><table class="otab"><thead><tr><th>Artikel</th><th class="r">Menge</th><th class="r">= Einheit</th><th class="r">Preis</th><th class="r">Summe</th>${o.receipt?'<th class="r">Geliefert</th><th class="r">Rechnungspreis</th>':''}<th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6" class="muted">Noch keine Positionen.</td></tr>'}</tbody>
        <tfoot><tr><td colspan="4">${o.receipt ? 'Summe bestellt, exkl. MwSt.' : 'Summe exkl. MwSt.'}</td><td class="r mono" data-l="${o.receipt ? 'Summe bestellt' : 'Summe'}">${eur(tot)}</td>${o.receipt?`<td class="r muted tf-l">geliefert</td><td class="r mono" data-l="Summe geliefert">${eur(deliveredTotal(o))}</td>`:''}<td class="ol-x"></td></tr></tfoot></table></div>
        ${editable ? `<div class="panel-f"><select id="olAdd" class="sm-sel" aria-label="Artikel hinzufügen"><option value="">+ Artikel von ${esc(sp.name)} …</option>${addable.map(p=>`<option value="${p.id}">${esc(p.name)}${p.pack?' ('+esc(p.pack)+')':''}</option>`).join('')}</select><button type="button" class="btn sm" data-act="olSuggest" data-id="${o.id}">Vorschlag laden</button></div>` : ''}
      </section>
      ${o.complaint ? `<section class="panel"><div class="panel-h"><h2>Reklamation</h2><select data-cst="${o.id}" class="sm-sel">${Object.entries(CSTAT).map(([k,l])=>`<option value="${k}" ${o.complaint.status===k?'selected':''}>${l}</option>`).join('')}</select></div>
        <textarea data-ctext="${o.id}" class="sm-ta" style="min-height:110px">${esc(o.complaint.text)}</textarea>
        <div class="row-btns" style="margin-top:10px">${sp.email?`<a class="btn sm" href="mailto:${encodeURIComponent(sp.email)}?subject=${encodeURIComponent('Reklamation zu '+o.no)}&body=${encodeURIComponent(o.complaint.text+'\n\n'+S.settings.name)}">E-Mail an Lieferant</a>`:''}${sp.whatsapp?`<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${sp.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent('Reklamation zu '+o.no+': '+o.complaint.text)}">WhatsApp</a>`:''}<button type="button" class="btn sm" data-act="cCopy" data-id="${o.id}">${ico('copy')}Kopieren</button></div>
        ${o.receipt?.photo && IMG[o.receipt.photo] ? `<img class="ls-ph" src="${IMG[o.receipt.photo]}" alt="Lieferschein">` : ''}</section>` : ''}
    </div>
    <div class="col">
      <section class="panel ${editable?'accent':''}">
        <div class="panel-h"><h2>${editable?'Senden':'Status'}</h2></div>
        ${editable ? `<label class="f">Gewünschte Lieferung<select data-od="${o.id}">${[...new Set([o.deliveryDate, ...deliveryOptions(sp)])].sort().map(d=>`<option value="${d}" ${o.deliveryDate===d?'selected':''}>${dayLabel(d)}</option>`).join('')}</select></label>
          <label class="f">Bemerkung an den Lieferanten<input data-on="${o.id}" value="${esc(o.note)}" placeholder="z. B. Leergut 3 Kisten mitnehmen"></label>
          <div class="kv"><span>Summe</span><span>${eur(tot)}</span><span>Mindestbestellwert</span><span class="${below?'bad-t':''}">${sp.minOrder ? eur(sp.minOrder) + (below ? '' : ' · erreicht') : 'keiner'}</span><span>Annahmeschluss</span><span>${esc(sp.cutoff)} Uhr</span></div>
          ${below ? `<p class="hint bad-t">Noch ${eur(sp.minOrder-tot)} bis zum Mindestbestellwert.</p>` : ''}
          ${sendBtns()}
          <details class="alg-det"><summary>Bestelltext ansehen</summary><pre class="otext">${esc(orderText(o))}</pre></details>`
        : `<div class="kv"><span>Lieferung</span><span>${dayLabel(o.deliveryDate)}</span><span>Summe bestellt</span><span>${eur(tot)}</span>${o.receipt?`<span>Summe geliefert</span><span>${eur(deliveredTotal(o))}</span><span>Lieferschein</span><span>${esc(o.receipt.noteNo||'—')}</span><span>Geprüft von</span><span>${esc(userName(o.receipt.checkedBy))}</span>${o.receipt.temp?`<span>Temperatur</span><span>${esc(o.receipt.temp)}</span>`:''}`:''}${o.confirmedNote?`<span>Bestätigung</span><span>${esc(o.confirmedNote)}</span>`:''}</div>
          <div class="row-btns" style="margin-top:12px">
            ${o.status==='sent'?`<button type="button" class="btn" data-act="ordConfirm" data-id="${o.id}">Bestätigung erhalten</button>`:''}
            ${['sent','confirmed'].includes(o.status)?`<button type="button" class="btn primary" data-act="ordRecv" data-id="${o.id}">${ico('truck')}Wareneingang prüfen</button><button type="button" class="btn" data-act="ordDelay" data-id="${o.id}">Lieferung verschoben</button>`:''}
            <button type="button" class="btn" data-act="ordRe" data-id="${o.id}">Nachbestellen</button>
            ${['sent','confirmed'].includes(o.status)?`<button type="button" class="btn danger" data-act="ordCancel" data-id="${o.id}">Stornieren</button>`:''}
          </div>`}
        ${editable?`<div class="row-btns" style="margin-top:12px"><button type="button" class="btn sm danger" data-act="ordDel" data-id="${o.id}">Entwurf löschen</button></div>`:''}
      </section>
      <section class="panel"><div class="panel-h"><h2>Lieferant</h2><button type="button" class="icon-btn" data-act="supEdit" data-id="${sp.id}" aria-label="Lieferant bearbeiten">${ico('edit')}</button></div>
        <div class="kv"><span>Bestelltage</span><span>${DAYS.filter(([i])=>sp.orderDays.includes(i)).map(([,l])=>l).join(' ')}</span><span>Liefertage</span><span>${DAYS.filter(([i])=>sp.deliveryDays.includes(i)).map(([,l])=>l).join(' ')}</span><span>Ansprechpartner</span><span>${esc(sp.contact||'—')}</span></div>
        ${sp.note?`<p class="hint">${esc(sp.note)}</p>`:''}</section>
    </div></div>`;
}
function receiveForm(o, hasCold){
  return `<section class="panel flush"><div class="panel-h pad"><h2>Wareneingang prüfen</h2><button type="button" class="btn sm" data-act="rAll" data-id="${o.id}">Alles wie bestellt</button></div>
    <div class="tbl-wrap"><table class="otab recv"><thead><tr><th>Artikel</th><th class="r">Bestellt</th><th class="r">Geliefert</th><th class="r">Preis lt. Rechnung</th><th>Status</th></tr></thead><tbody>
    ${o.lines.map((l,i)=>{ const p = P(l.pid); const d = l.delivered ?? ''; const ip = l.invPrice ?? l.price; const diff = ip && l.price ? (ip/l.price-1)*100 : 0; return `<tr>
      <td data-l="Artikel"><b class="pn">${esc(p?p.name:'?')}</b><small class="muted">${esc(l.artNo)} · ${esc(l.ou)}</small></td>
      <td class="r mono" data-l="Bestellt">${num(l.n,2)} × ${esc(l.ou)}<small class="muted rc-sum">${eur(l.price)} je ${esc(l.ou)} · Summe ${eur(l.n*l.price)}</small></td>
      <td class="r" data-l="Geliefert"><input id="rd-${i}" class="num-in" type="text" inputmode="decimal" data-num="de" data-msg="Ungültige Menge, nicht geändert" data-rd="${i}" value="${numIn(d)}" placeholder="${num(l.n,2)}" aria-label="Geliefert ${esc(p?p.name:'')}"></td>
      <td class="r" data-l="Preis lt. Rechnung"><span class="qty"><input id="rp-${i}" class="num-in" type="text" inputmode="decimal" data-num="de price" data-rp="${i}" value="${num2(ip)}" aria-label="Preis laut Rechnung ${esc(p?p.name:'')}"><em class="${Math.abs(diff)>3?'bad-t':''}">${Math.abs(diff)>0.05?(diff>0?'+':'−')+num(Math.abs(diff),1)+' %':''}</em></span></td>
      <td data-l="Status"><select data-rs="${i}" aria-label="Status ${esc(p?p.name:'')}">${Object.entries(LSTAT).map(([k,v])=>`<option value="${k}" ${(l.ls||'ok')===k?'selected':''}>${v}</option>`).join('')}</select></td></tr>`; }).join('')}
    </tbody></table></div>
    <div class="panel-f recv-f">
      <label class="f">Lieferschein-Nr.<input id="rNo" value="${esc(o.receiptDraft?.noteNo||'')}" placeholder="z. B. LS 2240"></label>
      ${hasCold?`<label class="f">Temperatur Kühlware<input id="rTemp" value="${esc(o.receiptDraft?.temp||'')}" placeholder="z. B. 3,5 °C"></label>`:''}
      <div class="f">Foto Lieferschein<div class="row-btns">${o.receiptDraft?.photo && IMG[o.receiptDraft.photo] ? `<img class="ls-th" src="${IMG[o.receiptDraft.photo]}" alt="">` : ''}<button type="button" class="btn sm" data-act="rPhoto" data-id="${o.id}">${ico('camera')}${o.receiptDraft?.photo?'Ändern':'Aufnehmen'}</button></div></div>
      <span class="sp"></span><button type="button" class="btn" data-act="rCancel">Abbrechen</button><button type="button" class="btn primary" data-act="rBook" data-id="${o.id}">Einbuchen</button>
    </div>
    <p class="hint pad-x pad-b">Leeres Feld „Geliefert“ heißt: wie bestellt. Preisabweichungen über 3 % werden markiert, der Einkaufspreis wird als gleitender Durchschnitt übernommen. Bei Abweichungen entsteht automatisch eine Reklamation.</p>
  </section>`;
}

/* ---------- Lieferanten ---------- */
function supplierView(){
  const sups = S.suppliers || [];
  return `<div class="layout-intro"><p class="hint" style="margin:0">Bestelltage, Annahmeschluss, Liefertage und Mindestbestellwert erfahren Sie direkt beim Lieferanten. Die App erinnert dann im Cockpit, wer heute bestellt werden muss.</p><button type="button" class="btn primary" data-act="supEdit" data-id="">${ico('plus')}Lieferant</button></div>
  <div class="lo-grid">${sups.map(sp => { const st = supStats(sp.id); const n = S.products.filter(p=>p.supplier===sp.id).length; const spend = S.orders.filter(o=>o.supplier===sp.id && o.receipt && o.receipt.date.slice(0,7)===todayStr().slice(0,7)).reduce((a,o)=>a+deliveredTotal(o),0); return `<article class="lo ${sp.active?'':'off'}">
    <div class="lo-h"><b>${esc(sp.name)}</b><span class="tag">${CHANNELS[sp.channel]}</span></div>
    <div class="muted sm">${esc(SUP_CATS[sp.cat]||'')} · ${n} Artikel${sp.customerNo?' · Kd.-Nr. '+esc(sp.customerNo):''}</div>
    <div class="kv"><span>Bestellen</span><span>${DAYS.filter(([i])=>sp.orderDays.includes(i)).map(([,l])=>l).join(' ')} bis ${esc(sp.cutoff)}</span><span>Lieferung</span><span>${DAYS.filter(([i])=>sp.deliveryDays.includes(i)).map(([,l])=>l).join(' ')}</span><span>Mindestwert</span><span>${eur(sp.minOrder)}</span><span>Pünktlich / Fehlmengen</span><span>${st.onTime!=null?st.onTime+' % / '+st.shortRate+' %':'—'}</span><span>Einkauf diesen Monat</span><span>${eur(spend)}</span></div>
    <div class="row-btns"><button type="button" class="btn sm" data-act="supEdit" data-id="${sp.id}">${ico('edit')}Bearbeiten</button><button type="button" class="btn sm" data-act="ordNew" data-id="${sp.id}">${ico('cart')}Bestellen</button></div>
  </article>`; }).join('')}</div>
  <h2 class="sec-h">Preisentwicklung</h2>
  <section class="panel flush"><div class="tbl-wrap"><table class="otab"><thead><tr><th>Artikel</th><th>Lieferant</th><th class="r">Aktuell</th><th class="r">Vorher</th><th class="r">Änderung</th></tr></thead><tbody>
  ${S.products.map(p=>{ const h = priceHistory(p.id); const prev = movesByDate().find(m=>m.pid===p.id && m.prevPrice!=null)?.prevPrice ?? (h[1]); if(prev==null || Math.abs(prev - p.price) < 0.005) return ''; const ch = (p.price/prev-1)*100; return `<tr><td><b class="pn">${esc(p.name)}</b></td><td class="muted">${esc(supName(p))}</td><td class="r mono">${eur(p.price)}</td><td class="r mono muted">${eur(prev)}</td><td class="r mono ${ch>3?'bad-t':ch<0?'good-t':''}">${ch>0?'+':''}${num(ch,1)} %</td></tr>`; }).join('') || '<tr><td colspan="5" class="muted">Noch keine Preisänderungen erfasst.</td></tr>'}
  </tbody></table></div></section>`;
}
function supplierDialog(sp){
  const isNew = !sp; sp = sp || {id:uid('sup'), name:'', cat:'gross', channel:'email', contact:'', phone:'', whatsapp:'', email:'', shopUrl:'', customerNo:'', orderDays:[1,3,5], cutoff:'12:00', deliveryDays:[2,4,6], minOrder:0, freight:0, note:'', active:true};
  const dayBoxes = (name, sel) => `<div class="days">${DAYS.map(([i,l])=>`<label class="algc"><input type="checkbox" name="${name}" value="${i}" ${sel.includes(i)?'checked':''}><span>${l}</span></label>`).join('')}</div>`;
  openDialog(isNew ? 'Neuer Lieferant' : 'Lieferant bearbeiten', `
    <label class="f">Name<input name="name" required value="${esc(sp.name)}"></label>
    <div class="fields two"><label class="f">Bereich<select name="cat">${Object.entries(SUP_CATS).map(([k,l])=>`<option value="${k}" ${sp.cat===k?'selected':''}>${l}</option>`).join('')}</select></label>
      <label class="f">Bestellweg<select name="channel">${Object.entries(CHANNELS).map(([k,l])=>`<option value="${k}" ${sp.channel===k?'selected':''}>${l}</option>`).join('')}</select></label></div>
    <div class="fields two"><label class="f">E-Mail für Bestellungen<input name="email" type="email" value="${esc(sp.email)}"></label><label class="f">WhatsApp-Nummer<input name="whatsapp" value="${esc(sp.whatsapp)}" placeholder="+43 …"></label>
      <label class="f">Telefon<input name="phone" value="${esc(sp.phone)}"></label><label class="f">Webshop-Adresse<input name="shopUrl" value="${esc(sp.shopUrl)}" placeholder="https://"></label>
      <label class="f">Kundennummer<input name="customerNo" value="${esc(sp.customerNo)}"></label><label class="f">Ansprechpartner<input name="contact" value="${esc(sp.contact)}"></label></div>
    <div class="f">Bestelltage</div>${dayBoxes('od', sp.orderDays)}
    <div class="f">Liefertage</div>${dayBoxes('dd', sp.deliveryDays)}
    <div class="fields two"><label class="f">Annahmeschluss<input name="cutoff" type="time" value="${esc(sp.cutoff)}"></label><label class="f">Mindestbestellwert €<input name="minOrder" class="num-in" type="text" inputmode="decimal" value="${numIn(sp.minOrder)}"></label></div>
    <label class="f">Notiz<input name="note" value="${esc(sp.note)}" placeholder="z. B. Leergut freitags, Rechnung monatlich"></label>
    <div class="togs"><label class="tog"><input type="checkbox" name="active" ${sp.active?'checked':''}><span></span>Aktiv</label></div>`,
    fd => { Object.assign(sp, {name:fd.get('name').trim(), cat:fd.get('cat'), channel:fd.get('channel'), email:fd.get('email').trim(), whatsapp:fd.get('whatsapp').trim(), phone:fd.get('phone').trim(), shopUrl:fd.get('shopUrl').trim(), customerNo:fd.get('customerNo').trim(), contact:fd.get('contact').trim(),
      orderDays:fd.getAll('od').map(Number), deliveryDays:fd.getAll('dd').map(Number), cutoff:fd.get('cutoff')||'12:00', minOrder:+fd.get('minOrder')||0, note:fd.get('note').trim(), active:!!fd.get('active')});
      if(isNew) S.suppliers.push(sp); },
    {del: isNew ? null : () => { const n = S.products.filter(p=>p.supplier===sp.id).length; if(n) return info('Lieferant hat Artikel', `${n} Artikel sind diesem Lieferanten zugeordnet. Ordnen Sie sie zuerst einem anderen Lieferanten zu oder setzen Sie ihn auf inaktiv.`); ask(`Lieferant „${sp.name}“ löschen?`, () => { S.suppliers = S.suppliers.filter(x=>x!==sp); }); }});
}
function delayDialog(o){
  const sp = SUP(o.supplier);
  openDialog('Lieferung verschoben', `<p class="dlg-p">Neuer Liefertermin für ${esc(sp.name)}, ${o.no}. Das Cockpit zeigt die Lieferung dann am neuen Tag.</p>
    <label class="f">Neuer Termin<input name="d" type="date" required value="${addDays(o.deliveryDate,1)}"></label>
    <label class="f">Grund<select name="r"><option>Schneefall / Straße gesperrt</option><option>Lieferant hat verschoben</option><option>Ware nicht lieferbar</option><option>Sonstiges</option></select></label>`,
    fd => { o.deliveryDate = fd.get('d'); o.confirmedNote = `Verschoben: ${fd.get('r')}`; }, {ok:'Verschieben', done:'Liefertermin geändert'});
}
function printOrder(o){ $('#print').innerHTML = `<pre style="font:12pt/1.5 'JetBrains Mono',monospace;white-space:pre-wrap">${esc(orderText(o))}</pre>`; document.body.classList.remove('print-menu'); window.print(); }

/* ---------- Ereignisse ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return;
  const id = el.dataset.id;
  switch(el.dataset.act){
    case 'ordNew': { const o = newOrder(id); view.stab = 'bestellung'; view.order = o.id; view.recv = null; save(); go('stock'); break; }
    case 'ordOpen': view.stab = 'bestellung'; view.order = id; view.recv = null; go('stock'); break;
    case 'ordBack': view.order = null; view.recv = null; view.opened = null; render(); break;
    case 'ordRe': { const src = ORD(id); const ex = draftFor(src.supplier); const o = ex || newOrder(src.supplier, false); if(!ex){ o.lines = src.lines.map(l => { const p = P(l.pid); return p ? lineFor(p, l.n) : null; }).filter(Boolean); } save(); view.stab = 'bestellung'; view.order = o.id; view.recv = null; go('stock'); toast(ex ? 'Offener Entwurf geöffnet' : `Positionen aus ${src.no} übernommen`); break; }
    case 'ofilter': view.ofilter = id; render(); break;
    case 'olDel': { const o = ORD(view.order); o.lines.splice(+id,1); save(); render(); break; }
    case 'olSuggest': { const o = ORD(id); let n = 0; lowStock().filter(p=>p.supplier===o.supplier).forEach(p => { if(!o.lines.some(l=>l.pid===p.id)){ const q = packSuggest(p); if(q>0){ o.lines.push(lineFor(p,q)); n++; } } }); save(); render(); toast(n ? `${n} Artikel unter Mindestbestand ergänzt` : 'Alle Artikel unter Mindestbestand sind schon drin'); break; }
    case 'ordApproval': { const o = ORD(id); o.status = 'approval'; o.approvalBy = me().id; save(); render(); toast('Zur Freigabe an den Inhaber'); break; }
    case 'ordApprove': { const o = ORD(id); o.approvedBy = me().id; o.status = 'draft'; o.approved = true; save(); render(); toast('Freigegeben'); break; }
    case 'ordOpened': { const [oid, via] = id.split(':'); view.opened = oid; view.openedVia = via; setTimeout(render, 300); break; }
    case 'ordMarkSent': { const o = ORD(id); const sp = SUP(o.supplier); o.status = 'sent'; o.sentAt = new Date().toISOString(); o.sentVia = view.opened===o.id ? view.openedVia : CHANNELS[sp.channel]; o.sentBy = me().id; view.opened = null; save(); render(); toast(`${o.no} gesendet · Lieferung ${dayLabel(o.deliveryDate)}`); break; }
    case 'ordCopy': { const txt = orderText(ORD(id)); const pr = navigator.clipboard?.writeText(txt); const fb = () => openDialog('Bestelltext', `<textarea class="code" readonly id="ordTxt">${esc(txt)}</textarea>`, null, {cancel:'Schließen', after:()=>$('#ordTxt').select()}); if(pr) pr.then(()=>toast('Bestelltext kopiert'), fb); else fb(); break; }
    case 'ordPrint': printOrder(ORD(id)); break;
    case 'ordConfirm': { const o = ORD(id); o.status = 'confirmed'; o.confirmedNote = 'Bestätigung erhalten '+fmtDate(new Date().toISOString()); save(); render(); break; }
    case 'ordDelay': delayDialog(ORD(id)); break;
    case 'ordCancel': ask('Bestellung stornieren? Bitte den Lieferanten auch selbst informieren.', () => { ORD(id).status = 'cancelled'; }, 'Stornieren'); break;
    case 'ordDel': ask('Entwurf löschen?', () => { S.orders = S.orders.filter(o=>o.id!==id); view.order = null; }); break;
    case 'ordRecv': view.stab = 'bestellung'; view.order = id; view.recv = id; go('stock'); break;
    case 'rCancel': view.recv = null; render(); break;
    case 'rAll': { const o = ORD(id); o.lines.forEach(l => { l.delivered = l.n; l.ls = 'ok'; }); save(); render(); break; }
    case 'rPhoto': { const o = ORD(id); pickImage(data => { o.receiptDraft = o.receiptDraft || {}; if(o.receiptDraft.photo) imgDel(o.receiptDraft.photo); const iid = uid('img'); imgPut(iid, data); o.receiptDraft.photo = iid; save(); render(); toast('Lieferschein fotografiert'); }); break; }
    case 'rBook': { const o = ORD(id); const r = o.receiptDraft || {}; r.noteNo = $('#rNo')?.value || r.noteNo || ''; r.temp = $('#rTemp')?.value || r.temp || '';
      const diffs = [], priceUp = []; const date = new Date().toISOString();
      o.lines.forEach(l => { const p = P(l.pid); if(l.delivered == null || l.delivered === '') l.delivered = l.n; l.delivered = +l.delivered; if(l.invPrice == null || l.invPrice === '') l.invPrice = l.price; l.invPrice = +l.invPrice;
        if(!l.ls || l.ls==='ok'){ l.ls = l.delivered === 0 ? 'missing' : l.delivered < l.n ? 'short' : 'ok'; }
        if(p && l.delivered > 0) receiveIn(p, l.delivered*l.f, l.invPrice/l.f, `${o.no}${r.noteNo?' · '+r.noteNo:''}`, date);
        if(l.ls !== 'ok') diffs.push(`${p?p.name:'?'}: ${LSTAT[l.ls]} (bestellt ${num(l.n,2)} × ${l.ou}, geliefert ${num(l.delivered,2)})`);
        if(l.price && (l.invPrice/l.price-1)*100 > 3) priceUp.push(`${p?p.name:'?'}: ${eur(l.price)} → ${eur(l.invPrice)}`); });
      o.receipt = {date, noteNo:r.noteNo, temp:r.temp, photo:r.photo||'', checkedBy:me().id}; delete o.receiptDraft;
      if(diffs.length || priceUp.length){ o.status = 'complaint'; o.complaint = {status:'open', text:`Sehr geehrte Damen und Herren,\n\nbei der Lieferung zu ${o.no}${r.noteNo?' (Lieferschein '+r.noteNo+')':''} vom ${fmtDate(date)} gab es folgende Abweichungen:\n${[...diffs, ...priceUp.map(x=>'Preis abweichend: '+x)].map(x=>'• '+x).join('\n')}\n\nBitte um Gutschrift bzw. Nachlieferung.\n\nDanke und freundliche Grüße`}; }
      else o.status = 'delivered';
      view.recv = null; save(); render(); toast(o.status==='complaint' ? `Eingebucht · ${diffs.length + priceUp.length} Abweichungen, Reklamation vorbereitet` : `Eingebucht · ${o.lines.length} Positionen, alles in Ordnung`); break; }
    case 'cCopy': { const o = ORD(id); navigator.clipboard?.writeText(o.complaint.text).then(()=>toast('Reklamation kopiert'), ()=>{}); break; }
    case 'supEdit': supplierDialog(id ? SUP(id) : null); break;
    case 'userSwitch': S.settings.currentUser = id; save(); render(); toast(`Angemeldet als ${whoLabel(me())}`); break;
  }
});
document.addEventListener('change', e => {
  const t = e.target; if(!t.closest('#app')) return; const o = view.order && ORD(view.order);
  if(t.id === 'olAdd' && t.value && o){ const p = P(t.value); o.lines.push(lineFor(p, packSuggest(p) || 1)); save(); render(); return; }
  if(t.dataset.ol != null && o){ o.lines[+t.dataset.ol].n = Math.max(0, +t.value||0); save(); softRender(); return; }
  if(t.dataset.od && o){ o.deliveryDate = t.value; save(); return; }
  if(t.dataset.on && o){ o.note = t.value; save(); return; }
  if(t.dataset.rd != null && o){ const v = numParse(t.value); o.lines[+t.dataset.rd].delivered = t.value.trim() === '' || !isFinite(v) ? null : v; t.dataset.old = t.value; save(); return; }
  if(t.dataset.rp != null && o){ const v = numParse(t.value); o.lines[+t.dataset.rp].invPrice = t.value.trim() === '' || !isFinite(v) ? null : Math.round(v*100)/100; save(); softRender(); return; }
  if(t.dataset.rs != null && o){ o.lines[+t.dataset.rs].ls = t.value; save(); return; }
  if(t.dataset.cst){ ORD(t.dataset.cst).complaint.status = t.value; if(t.value==='closed' || t.value==='credit') ORD(t.dataset.cst).status = t.value==='closed' ? 'delivered' : 'complaint'; save(); render(); toast('Reklamation: '+CSTAT[t.value]); return; }
  if(t.dataset.ctext){ ORD(t.dataset.ctext).complaint.text = t.value; save(); return; }
  if(t.id === 'rNo' || t.id === 'rTemp'){ const oo = ORD(view.recv) || o; if(!oo) return; const r = oo.receiptDraft = oo.receiptDraft || {}; r[t.id==='rNo'?'noteNo':'temp'] = t.value; save(); return; }
  if(t.dataset.us === 'limit'){ S.settings.orderLimit = Math.max(0, +t.value||0); save(); toast('Freigabe-Limit gespeichert'); return; }
  if(t.dataset.us === 'addr'){ S.settings[t.dataset.k] = t.value; save(); return; }
});

/* Stand eines Lieferanten für heute: von „Heute“ und „Einkauf“ gemeinsam benutzt */
function supToday(sp){
  const t = todayStr(); const isDay = sp.orderDays.includes(wd(t)); const left = hm(sp.cutoff) - nowMin();
  const sent = lastOrderToday(sp.id); const draft = draftFor(sp.id);
  const state = !isDay ? 'none' : sent ? 'sent' : left < 0 ? 'past' : 'open';
  const leftTxt = `noch ${left>=60?Math.floor(left/60)+' h ':''}${Math.max(0,left%60)} min`;
  return {isDay, left, sent, draft, state, urgent: state==='open' && left < 90, label: state==='sent' ? 'heute bestellt' : state==='past' ? 'Annahmeschluss vorbei' : state==='open' ? leftTxt : '', delivery: nextDelivery(sp, state==='open' || state==='sent' ? t : null)};
}
function lastOrderToday(sid){ const t = todayStr(); return (S.orders||[]).some(o=>o.supplier===sid && o.status!=='draft' && o.status!=='cancelled' && (o.sentAt||'').slice(0,10)===t); }

/* =====================================================================
   Hauskarte: eine feste Gestaltung für alle Saisonen
   (Art Director, Menu Engineering und Kritik zusammengeführt)
   ===================================================================== */
const HK_SECTIONS = ['Flammkuchen','Zum Teilen','Suppen & Vorspeisen','Salate & Bowls','Rösti','Klassiker','Burger, Pasta & Co.','Süßes','Für Kinder'];
const HK_ACCENT = {winter:'#8e2f2a', fruehling:'#5c7838', sommer:'#2d5c86', herbst:'#9c6b1e'};
const HK_ACCENT_NAME = {winter:'Preiselbeere', fruehling:'Bärlauch', sommer:'Enzian', herbst:'Lärche'};
const HK_TITLE = {winter:'Winterkarte', fruehling:'Frühlingskarte', sommer:'Sommerkarte', herbst:'Herbstkarte'};
const HK_PLACE = 'Restobar | Café · Gerlos, gegenüber der Piste';
const HK_DAYWORD = ['sonntags','montags','dienstags','mittwochs','donnerstags','freitags','samstags'];
const SEC_MAP = {'Vorspeisen':'Suppen & Vorspeisen', 'Suppen':'Suppen & Vorspeisen', 'Fondue & Hauptspeisen':'Klassiker', 'Burger & Kebap':'Burger, Pasta & Co.', 'Desserts':'Süßes', 'Kindermenü':'Für Kinder'};
// alter Name → [Abschnitt, neuer Name, Reihenfolge, Variantengruppe, Variante, Signatur]
const MENU_V2 = {
  '„Der Elsässer“':['Flammkuchen','Elsässer',0,'','',1], '„Die Gärtnerin“':['Flammkuchen','Gärtnerin',1], '„Der Weiße“':['Flammkuchen','Weißer',2], '„Schwammerlsuche“':['Flammkuchen','Schwammerl',3],
  'Zillertaler Käsefondue':['Zum Teilen','Zillertaler Käsefondue',0,'','',1], '„Garnelen Pfandl“':['Zum Teilen','Garnelenpfandl',1], 'Ripperl-Tower':['Zum Teilen','Ripperl-Tower',2], '„Vegan Dippin’“':['Zum Teilen','Artischocke zum Dippen',3], 'Tiroler Kiachl':['Zum Teilen','Tiroler Kiachl',4], 'DAHUAM.202 Knoblauchbrot':['Zum Teilen','Knoblauchbrot',5],
  'Hausgemachte Gulaschsuppe':['Suppen & Vorspeisen','Gulaschsuppe',0], 'Fruchtige Tomatensuppe':['Suppen & Vorspeisen','Tomatensuppe',1], 'Kürbiscremesuppe':['Suppen & Vorspeisen','Kürbiscremesuppe',2], 'Kalte Gurken-Buttermilchsuppe':['Suppen & Vorspeisen','Kalte Gurken-Buttermilchsuppe',2], 'Kokos-Curry-Suppe':['Suppen & Vorspeisen','Kokos-Curry-Suppe',3], 'Rindsuppe mit Frittaten':['Suppen & Vorspeisen','Rindsuppe mit Frittaten',4], 'Rindsuppe mit Kaspressknödel':['Suppen & Vorspeisen','Rindsuppe mit Kaspressknödel',5],
  'Tatar vom Tiroler Rind 130 g':['Suppen & Vorspeisen','Tatar vom Tiroler Rind',6,'tatar','130 g'], 'Tatar vom Tiroler Rind 180 g':['Suppen & Vorspeisen','Tatar vom Tiroler Rind',7,'tatar','180 g'], '„Fabian’s Caprese“':['Suppen & Vorspeisen','Fabians Caprese',8], 'Bärlauch-Kaspressknödel':['Suppen & Vorspeisen','Bärlauch-Kaspressknödel',8], '„Alpen Ceviche“':['Suppen & Vorspeisen','Alpen-Ceviche',9],
  'Caesar Salat':['Salate & Bowls','Caesar Salat',0], 'Gerlos Bowl':['Salate & Bowls','Gerlos Bowl',1], 'Salatschüsserl mit Backhendl':['Salate & Bowls','Salatschüsserl mit Backhendl',2], 'Salatschüsserl mit Ziegenkäse':['Salate & Bowls','Salatschüsserl mit Ziegenkäse',3], 'DAHUAM.202 Sommersalat':['Salate & Bowls','Sommersalat',4], 'Kebap Bowl':['Salate & Bowls','Kebap Bowl',5],
  'Bauernrösti':['Rösti','Bauernrösti',0], 'Schwammerlrösti':['Rösti','Schwammerlrösti',1], 'Dolce Vita Rösti':['Rösti','Dolce-Vita-Rösti',2],
  'Wiener Schnitzel vom Schwein':['Klassiker','Wiener Schnitzel',0,'schnitzel','vom Schwein',1], 'Wiener Schnitzel vom Kalb':['Klassiker','Wiener Schnitzel',1,'schnitzel','vom Kalb',1], '„Stück Fleisch“':['Klassiker','Filetsteak 230 g',2], 'Hirschragout':['Klassiker','Hirschragout',3], 'Gebratener Zillertaler Saibling':['Klassiker','Zillertaler Saibling',3], 'Eierschwammerlgulasch':['Klassiker','Eierschwammerlgulasch',3], 'Zillertaler Krapfen':['Klassiker','Zillertaler Krapfen',4],
  'Kalbsrahmgulasch':['Klassiker','Kalbsrahmgulasch',5], 'Zillertaler Forelle „Müllerin“':['Klassiker','Forelle Müllerin',6], 'Original Wiener Tafelspitz':['Klassiker','Wiener Tafelspitz',7], 'Gerolltes Cordon bleu':['Klassiker','Cordon bleu',8], '„Hans-Wurst“':['Klassiker','Hans-Wurst',9],
  'Wadel-Beißer-Burger':['Burger, Pasta & Co.','Wadel-Beißer-Burger',0], 'DFC Burger':['Burger, Pasta & Co.','DFC Burger',1], 'Alpen Kebap':['Burger, Pasta & Co.','Alpen-Kebap',2], '„Fish n’ Chips“':['Burger, Pasta & Co.','Fish & Chips',3], 'Eierschwammerl Carbonara':['Burger, Pasta & Co.','Eierschwammerl-Carbonara',4], '„Wilde Bolo“':['Burger, Pasta & Co.','Wilde Bolo',5], '„Veganista Couch Potato“':['Burger, Pasta & Co.','Süßkartoffel mit Shakshuka',6],
  '„Wir sind Kaiser!“':['Süßes','Kaiserschmarrn',0,'','',1], 'Oma Lisl’s Apfelstrudel':['Süßes','Oma Lisls Apfelstrudel',1], '„Marillenzeit = Knödelzeit“':['Süßes','Marillenknödel',2], 'Cookie Pfandl':['Süßes','Cookie-Pfandl',3], '„Dippin me softly!“':['Süßes','Schokofondue',4], 'Affogato':['Süßes','Affogato',5], '„French Twist“':['Süßes','Crème brûlée',6], '„Fabian’s Schokotraum“':['Süßes','Schokomousse',7], '„Endless Summer“':['Süßes','Erdbeeren mit Cheesecake-Creme',8], '„Say Cheese“':['Süßes','Antonias Käseauswahl',9],
};
const DESC_V2 = {'Kaiserschmarrn':'Mit Apfelmus und Heidelbeerkompott', 'Schokofondue':'Milchschokolade, Obst, Marshmallows, pro Person', 'Zillertaler Käsefondue':'Brot, Erdäpfel, hausgemachte Mixed Pickles, pro Person', 'Wiener Tafelspitz':'Klassisch, mit Apfelkren und Schnittlauchsauce', 'Ripperl-Tower':'Pro Person', 'Elsässer':'Speck, Zwiebel, Frühlingszwiebel', 'Wiener Schnitzel':'Mit Pommes, Preiselbeeren und Zitrone', 'Tomatensuppe':'Crème fraîche, Pesto', 'Artischocke zum Dippen':'Ganze Artischocke, Zitronenvinaigrette, Wasabi-Caesar-Dip', 'Filetsteak 230 g':'Pfefferjus, Kräuterblütenbutter', 'Crème brûlée':'Mit Vanille', 'Schokomousse':'In der Kaffeetasse serviert', 'Antonias Käseauswahl':'Kleine Käse, ausgesucht von Antonia'};

function menuV2Migrate(d){
  const s = d.settings; if(s.menuV2) return d;
  d.menu.forEach(m => { const r = MENU_V2[m.name]; if(r){ const [sec,name,ord,grp,vl,sig] = r; m.section = sec; m.name = name; m.order = ord*10 + (vl==='vom Kalb'||vl==='180 g'?1:0); m.group = grp||''; m.vlabel = vl||''; m.top = !!sig; if(DESC_V2[name]) m.desc = DESC_V2[name]; if(name==='Ripperl-Tower'||name==='Wiener Tafelspitz') m.desc = m.desc.replace(/^(Nur|nur) (sonntags|dienstags)(, )?/,'') || DESC_V2[name]; } else { if(SEC_MAP[m.section]) m.section = SEC_MAP[m.section]; m.group = m.group||''; m.vlabel = m.vlabel||''; if(m.section==='Für Kinder') m.top = false; } m.name = m.name.replace(/[„“"]/g,''); });
  d.menu.filter(m=>m.name==='Ripperl-Tower'||m.name==='Wiener Tafelspitz').forEach(m=>{ m.desc = DESC_V2[m.name]; });
  d.cards.forEach(c => { if(SEC_MAP[c.category]) c.category = SEC_MAP[c.category]; if(c.category==='Fondue & Hauptspeisen') c.category = 'Klassiker'; });
  if(d.cards.find(c=>c.id==='dish_fondue')) d.cards.find(c=>c.id==='dish_fondue').category = 'Zum Teilen';
  const used = [...new Set(d.menu.map(m=>m.section))];
  s.sections = [...HK_SECTIONS.filter(x=>used.includes(x) || ['Flammkuchen','Süßes','Für Kinder'].includes(x)), ...used.filter(x=>!HK_SECTIONS.includes(x))];
  SEASONS.forEach(([k]) => { const ss = s.seasons[k]; if(!ss) return; ss.accent = HK_ACCENT[k]; ss.title = HK_TITLE[k]; ss.subtitle = HK_PLACE; ss.pal = {...ss.pal, accent:HK_ACCENT[k], paper:'#f4f0e7'}; });
  s.kidsSheet = true; s.menuV2 = true;
  return d;
}

/* ---------- Bausteine ---------- */
const hkPrice = p => fin(+p).toLocaleString('de-AT',{minimumFractionDigits:2, maximumFractionDigits:2});
function hkDays(m){ return m.days && m.days.length ? 'nur ' + m.days.map(i=>HK_DAYWORD[i]).join(' und ') : ''; }
function hkEntries(list){
  const out = [];
  for(const m of list){
    const last = out[out.length-1];
    if(m.group && last && last.group === m.group){ last.vars.push(m); continue; }
    out.push({group:m.group||'', head:m, vars:[m]});
  }
  return out;
}
function hkDish(e, used, opts={}){
  const m = e.head, vars = e.vars, multi = vars.length > 1 || (m.vlabel && vars.length===1 && m.group);
  const alg = [...new Set(vars.flatMap(v => itemAlg(v)))].sort(); alg.forEach(a=>used.add(a));
  const veg = vars.every(v=>v.veg==='vg') ? 'vg' : vars.every(v=>v.veg==='v' || v.veg==='vg') ? 'v' : '';
  const desc = [m.desc, hkDays(m)].filter(Boolean).join(', ');
  const name = m.name;
  const price = +m.price ? `<span class="hk-p">${hkPrice(m.price)}</span>` : '<span class="hk-p"></span>';
  return `<article class="hk-dish ${vars.some(v=>v.top) && !opts.noSig ? 'sig' : ''}">
    <div class="hk-l1"><span class="hk-n">${esc(name)}${veg?`<span class="hk-diet" title="${veg==='vg'?'vegan':'vegetarisch'}">${veg}</span>`:''}</span>${multi?'':price}</div>
    ${desc || alg.length ? `<p class="hk-d">${esc(desc)}${alg.length?`<span class="hk-alg" title="${esc(alg.map(a=>ALG[a]).join(', '))}">${alg.join(' ')}</span>`:''}</p>` : ''}
    ${multi ? vars.map(v=>`<div class="hk-var"><span>${esc(v.vlabel||v.name)}</span><span class="hk-p">${hkPrice(v.price)}</span></div>`).join('') : ''}
  </article>`;
}
function hkLegend(used, k){
  const s = S.settings.seasons[k];
  return `<footer class="hk-foot">
    ${used.size ? `<div class="hk-leg">${[...used].sort().map(a=>`<span><b>${a}</b> ${esc(ALG[a])}</span>`).join('')}</div>` : ''}
    <div class="hk-fl"><span>${esc(s.footer || 'Preise in Euro inkl. MwSt.')} · v vegetarisch · vg vegan · <span class="hk-sigkey"></span> Empfehlung des Hauses</span><span>Stand ${fmtDate(new Date().toISOString())}</span></div>
  </footer>`;
}
function hkHead(k, date, small){
  const s = S.settings.seasons[k];
  const season = `${esc(s.title)} ${seasonYear(k, date)}`;
  if(small) return `<header class="hk-head small"><div class="hk-top"><span class="hk-wm">DAHUAM<i>.</i>202</span><span class="hk-season">${small}</span></div></header>`;
  return `<header class="hk-head">
    <div class="hk-top"><span class="hk-wm">DAHUAM<i>.</i>202</span><span class="hk-season">${season}</span></div>
    <div class="hk-dict"><span class="hk-word">da·huam</span><span class="hk-gloss"><i>tirolerisch</i> — daheim, zuhause</span></div>
    <div class="hk-place">${esc(s.subtitle || HK_PLACE)}</div>
    <p class="hk-motto">Unkompliziert ist unser Motto beim Genießen.</p>
  </header>`;
}
function hkSpecial(sp, used, page){
  const d1 = new Date(sp.from+'T12:00:00'), d2 = new Date((sp.to||sp.from)+'T12:00:00');
  const f = d => d.toLocaleDateString('de-AT',{weekday:'short', day:'numeric'}).replace(/\./g,'')+'.';
  const date = sp.to && sp.to !== sp.from ? `${f(d1)} – ${f(d2)} ${d2.toLocaleDateString('de-AT',{month:'long'})}` : d1.toLocaleDateString('de-AT',{weekday:'long', day:'numeric', month:'long'});
  const items = sp.items.map(it => ({...it, id:'', top:false, group:'', days:[]}));
  return `<section class="hk-special ${page?'page':''}">
    <div class="hk-sp-label">${esc(date)}</div>
    <h3 class="hk-sp-title">${esc(sp.name)}</h3>${sp.note?`<p class="hk-sp-note">${esc(sp.note)}</p>`:''}
    ${hkEntries(items).map(e=>hkDish(e, used, {noSig:true})).join('')}
  </section>`;
}

/* ---------- Karten ---------- */
guestHtml = function(seasonKey, dateStr){
  dateStr = dateStr || todayStr();
  const k = seasonKey || seasonFor(dateStr) || 'winter';
  const s = S.settings.seasons[k];
  const kidsSep = S.settings.kidsSheet !== false;
  const items = guestItems(k, dateStr);
  const used = new Set();
  const inserts = specialsFor(dateStr).filter(sp => sp.mode !== 'tageskarte');
  const secs = secList().filter(sec => items.some(m=>m.section===sec) && !(kidsSep && sec==='Für Kinder'));
  let body = inserts.map(sp => hkSpecial(sp, used)).join('');
  for(const sec of secs){
    const list = items.filter(m=>m.section===sec);
    body += `<section class="hk-sec" data-sec="${esc(sec)}"><h3 class="hk-h">${esc(sec)}</h3>${hkEntries(list).map(e=>hkDish(e, used)).join('')}</section>`;
  }
  const cover = s.cover && IMG[s.cover] ? `<figure class="hk-cover"><img src="${IMG[s.cover]}" alt=""></figure>` : '';
  const index = secs.length > 3 ? `<nav class="hk-index" aria-label="Abschnitte">${secs.map(x=>`<button type="button" data-act="hkJump" data-id="${esc(x)}">${esc(x)}</button>`).join('')}</nav>` : '';
  return `<div class="hk-paper" style="--hk-a:${esc(s.accent || HK_ACCENT[k])}">${hkHead(k, dateStr)}${cover}${index}
    <div class="hk-cols">${body || '<p class="hk-empty">Noch keine sichtbaren Gerichte in dieser Saison.</p>'}</div>
    ${hkLegend(used, k)}</div>`;
};
function kidsHtml(k, dateStr){
  const items = guestItems(k, dateStr).filter(m=>m.section==='Für Kinder'); if(!items.length) return '';
  const used = new Set(); const s = S.settings.seasons[k];
  return `<div class="hk-paper hk-kids" style="--hk-a:${esc(s.accent || HK_ACCENT[k])}">${hkHead(k, dateStr, 'Für Kinder')}
    <h2 class="hk-sheet-title">Für unsere kleinen Gäste</h2>
    <div class="hk-cols one">${hkEntries(items).map(e=>hkDish(e, used, {noSig:true})).join('')}</div>${hkLegend(used, k)}</div>`;
}
tageskarteHtml = function(sp, k){
  k = k || seasonFor(sp.from) || 'winter'; const s = S.settings.seasons[k]; const used = new Set();
  return `<div class="hk-paper hk-tk" style="--hk-a:${esc(s.accent || HK_ACCENT[k])}">${hkHead(k, sp.from, 'Tageskarte')}
    ${hkSpecial(sp, used, true)}${hkLegend(used, k)}</div>`;
};
guestPrevHtml = function(){
  const date = view.gdate || todayStr(); const k = curSeasonKey();
  const wdn = new Date(date+'T12:00:00').getDay();
  const closed = (S.settings.closed||[]).includes(wdn) ? `<div class="g-closed">${ico('spark')}${DAYNAME[wdn]} ist Ruhetag. So sähe die Karte trotzdem aus.</div>` : '';
  const tks = specialsFor(date).filter(sp => sp.mode === 'tageskarte');
  const kids = S.settings.kidsSheet !== false ? kidsHtml(k, date) : '';
  return closed + guestHtml(k, date)
    + tks.map(sp=>`<div class="tk-label">Tageskarte, liegt bei · ${esc(sp.name)}</div>${tageskarteHtml(sp, k)}`).join('')
    + (kids ? `<div class="tk-label">Kinderkarte, eigenes Blatt</div>${kids}` : '');
};

/* ---------- Werkzeuge ---------- */
renderGuest = function(){
  const date = view.gdate || (view.gdate = todayStr());
  const auto = seasonFor(date); const k = view.gseason || auto || 'winter'; const s = S.settings.seasons[k];
  const sps = specialsFor(date);
  const miss = guestItems(k, date).filter(m=>!hasAlg(m)).length + sps.reduce((n,sp)=>n+sp.items.filter(it=>!hasAlg(it)).length,0);
  const accent = s.accent || HK_ACCENT[k];
  return `<div class="guest-wrap">
    <aside class="guest-tools">
      <section class="panel">
        <div class="panel-h"><h2>Was sehen die Gäste?</h2></div>
        <label class="f">Datum<input id="gdate" type="date" value="${date}"></label>
        <div class="chips-row tight"><button type="button" class="chip ${date===todayStr()?'on':''}" data-act="gdate" data-id="${todayStr()}">Heute</button><button type="button" class="chip" data-act="gdate" data-id="${addDays(todayStr(),1)}">Morgen</button>${S.specials.filter(sp=>spStatus(sp)[0]!=='past').slice(0,3).map(sp=>`<button type="button" class="chip" data-act="gdate" data-id="${sp.from}">${esc(sp.name)}</button>`).join('')}</div>
        <p class="hint">${auto ? `Am ${fmtDate(date+'T12:00:00')} gilt die <b>${esc(S.settings.seasons[auto].title)}</b>` : 'An diesem Datum gilt keine Saisonkarte'}${sps.length ? ` und ${sps.length===1?'die Aktion':'die Aktionen'} <b>${sps.map(x=>esc(x.name)).join(', ')}</b>.` : '.'}</p>
        ${miss ? `<div class="warn-box">${ico('spark')}<span><b>${miss} Gerichte ohne Allergenangabe.</b> In Österreich Pflicht: Rezeptur verknüpfen oder Allergene eintragen.</span><button type="button" class="btn sm" data-act="goMenu" data-id="noalg">Anzeigen</button></div>` : '<div class="ok-box">Alle Gerichte haben Allergenangaben.</div>'}
      </section>
      <section class="panel">
        <div class="panel-h"><h2>Saison</h2>${view.gseason?`<button type="button" class="link sm-link" data-act="gseason" data-id="">nach Datum</button>`:''}</div>
        ${seg('gseason', k, SEASONS.map(([sk,sl])=>[sk,sl]))}
        <div class="fields two">
          <label class="f">Gültig ab<input type="text" inputmode="numeric" placeholder="TT.MM." data-smd="from" value="${mdLabel(s.from)}"></label>
          <label class="f">bis<input type="text" inputmode="numeric" placeholder="TT.MM." data-smd="to" value="${mdLabel(s.to)}"></label>
        </div>
        <div class="f">Akzentfarbe der Saison</div>
        <div class="acc-row">${SEASONS.map(([sk])=>`<button type="button" class="acc ${accent===HK_ACCENT[sk]?'on':''}" style="--c:${HK_ACCENT[sk]}" data-act="hkAccent" data-id="${HK_ACCENT[sk]}" title="${HK_ACCENT_NAME[sk]}"><i></i>${HK_ACCENT_NAME[sk]}</button>`).join('')}<label class="clr"><input type="color" data-hka="1" value="${accent}" aria-label="Eigene Farbe"><span>Eigene</span></label></div>
        <p class="hint">Schrift, Raster und Papier bleiben in jeder Saison gleich. So erkennt man immer dasselbe Haus.</p>
        <label class="f">Titel der Karte<input data-st="title" value="${esc(s.title)}"></label>
        <label class="f">Unterzeile<input data-st="subtitle" value="${esc(s.subtitle||HK_PLACE)}"></label>
        <label class="f">Fußzeile<input data-st="footer" value="${esc(s.footer)}"></label>
        <div class="togs"><label class="tog"><input type="checkbox" data-hkk="1" ${S.settings.kidsSheet!==false?'checked':''}><span></span>Kinderkarte als eigenes Blatt</label></div>
        <div class="row-btns"><button type="button" class="btn sm" data-act="gcover">${ico('camera')}${s.cover?'Titelbild ändern':'Titelbild (optional)'}</button>${s.cover?'<button type="button" class="btn sm" data-act="gcoverDel">Entfernen</button>':''}</div>
        <p class="hint">Fotos einzelner Gerichte erscheinen bewusst nicht in der Karte: Sie verschieben die Zeilen. Ein ruhiges Titelbild genügt.</p>
      </section>
    </aside>
    <div class="guest-prev">${guestPrevHtml()}</div>
  </div>`;
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return;
  if(el.dataset.act === 'hkAccent'){ const s = S.settings.seasons[curSeasonKey()]; s.accent = el.dataset.id; s.pal = {...s.pal, accent:el.dataset.id}; save(); render(); }
  if(el.dataset.act === 'hkJump'){ const sec = [...el.closest('.hk-paper').querySelectorAll('.hk-sec')].find(x=>x.dataset.sec===el.dataset.id); sec && sec.scrollIntoView({behavior:'smooth', block:'start'}); }
});
document.addEventListener('input', e => { const t = e.target; if(t.dataset.hka){ const s = S.settings.seasons[curSeasonKey()]; s.accent = t.value; s.pal = {...s.pal, accent:t.value}; save(); refreshGuest(); } });
document.addEventListener('change', e => { const t = e.target; if(t.dataset.hkk){ S.settings.kidsSheet = t.checked; save(); refreshGuest(); } });

/* =====================================================================
   Phase 2: Cloud (Supabase) – Anmeldung, Sync zwischen Geräten,
   Fotos im Speicher, Bestellungen per E-Mail über Server-Funktion
   ===================================================================== */
const CLOUD_KEY = KEY + '_cloud', BASE_KEY = KEY + '_base';
let CL = (() => { try { return JSON.parse(localStorage.getItem(CLOUD_KEY)) || {}; } catch(e){ return {}; } })();
let cloudState = 'off', cloudMsg = '', pushTimer = null, pushing = false, dirty = false, pollTimer = null;
function clSave(){ try { localStorage.setItem(CLOUD_KEY, JSON.stringify(CL)); } catch(e){} }
function baseGet(){ try { return JSON.parse(localStorage.getItem(BASE_KEY)); } catch(e){ return null; } }
function baseSet(d){ try { localStorage.setItem(BASE_KEY, JSON.stringify(d)); } catch(e){} }
function cloudReady(){ return !FRAMED && !!(CL.url && CL.anon && CL.session && CL.rid); }
/* Fehlertexte: deutsch, ohne Technik */
function cloudErrText(x){
  const m = String((x && x.message) || x || ''); const st = x && x.status;
  if(/^(E-Mail oder Passwort|Dieses Konto|Sitzung abgelaufen|Bitte )/.test(m)) return m;
  if(x instanceof TypeError || /failed to fetch|networkerror|load failed|fetch|network|dns|cors|timed? ?out|invalid url|parse url/i.test(m) || st === 0 || st === 404 || st >= 500) return 'Keine Verbindung zum Cloud-Projekt. Adresse und Schlüssel prüfen.';
  if(st === 401 || st === 403 || /api key|apikey|jwt|not authorized|permission|unauthori[sz]ed/i.test(m)) return 'Zugriff abgelehnt. Schlüssel und Anmeldung prüfen.';
  if(/nicht angemeldet/.test(m)) return 'Nicht angemeldet. Bitte neu verbinden.';
  if(st === 429) return 'Zu viele Versuche. Bitte in ein paar Minuten noch einmal probieren.';
  return 'Die Cloud hat nicht geantwortet wie erwartet. Bitte später noch einmal versuchen.';
}
function setCloud(st, msg=''){ if(st === 'err' || st === 'offline') msg = st === 'offline' ? 'Kein Internet. Änderungen werden gespeichert und später übertragen.' : cloudErrText({message:msg}); cloudState = st; cloudMsg = msg; const b = $('#cloudChip'); if(b){ b.className = 'cloud-chip '+st; b.textContent = {off:'', ok:'Cloud · synchron', busy:'Cloud · speichert …', offline:'Cloud · offline', err:'Cloud · Fehler'}[st] || ''; b.title = msg; b.hidden = st==='off'; } }

async function clFetch(path, {method='GET', body, auth=true, raw=false, headers={}}={}){
  const h = {apikey:CL.anon, ...headers};
  if(body !== undefined && !(body instanceof Blob)) h['Content-Type'] = 'application/json';
  if(auth){ await ensureToken(); h.Authorization = 'Bearer ' + CL.session.access_token; }
  const r = await fetch(CL.url.replace(/\/+$/,'') + path, {method, headers:h, body: body === undefined ? undefined : body instanceof Blob ? body : JSON.stringify(body)});
  if(!r.ok){ let t = ''; try { t = (await r.json()).message || ''; } catch(e){} const err = new Error(t || ('HTTP '+r.status)); err.status = r.status; throw err; }
  if(raw) return r;
  const ct = r.headers.get('content-type') || ''; return ct.includes('json') ? r.json() : r.text();
}
async function ensureToken(){
  if(!CL.session) throw new Error('nicht angemeldet');
  if(Date.now()/1000 < (CL.session.expires_at||0) - 60) return;
  const r = await fetch(CL.url.replace(/\/+$/,'') + '/auth/v1/token?grant_type=refresh_token', {method:'POST', headers:{apikey:CL.anon, 'Content-Type':'application/json'}, body:JSON.stringify({refresh_token:CL.session.refresh_token})});
  if(!r.ok){ CL.session = null; clSave(); setCloud('err', 'Sitzung abgelaufen, bitte neu anmelden'); throw new Error('Sitzung abgelaufen'); }
  const j = await r.json(); CL.session = {access_token:j.access_token, refresh_token:j.refresh_token, expires_at:j.expires_at || (Date.now()/1000 + (j.expires_in||3600)), user:j.user}; clSave();
}
const rpc = (fn, args) => clFetch('/rest/v1/rpc/' + fn, {method:'POST', body:args});

async function cloudLogin(url, anon, email, pw){
  CL = {url:url.trim(), anon:anon.trim(), email:email.trim()};
  const r = await fetch(CL.url.replace(/\/+$/,'') + '/auth/v1/token?grant_type=password', {method:'POST', headers:{apikey:CL.anon, 'Content-Type':'application/json'}, body:JSON.stringify({email:CL.email, password:pw})});
  if(!r.ok){ let m = ''; try { const j = await r.json(); m = j.error_description || j.msg || j.message || ''; } catch(e){} if(m.includes('Invalid login') || r.status === 400) throw new Error('E-Mail oder Passwort falsch.'); const er = new Error(m || 'Anmeldung fehlgeschlagen'); er.status = r.status; throw er; }
  const j = await r.json(); CL.session = {access_token:j.access_token, refresh_token:j.refresh_token, expires_at:j.expires_at || (Date.now()/1000 + (j.expires_in||3600)), user:j.user};
  const ms = await rpc('my_memberships', {});
  if(!ms || !ms.length) throw new Error('Dieses Konto ist noch keinem Betrieb zugeordnet. Bitte den Inhaber, Sie zum Team hinzuzufügen.');
  const m = ms[0]; CL.rid = m.restaurant_id; CL.rname = m.restaurant_name; CL.member = {name:m.name, role:m.role}; CL.version = 0; clSave();
}
function cloudLogout(){ CL = {}; clSave(); try { localStorage.removeItem(BASE_KEY); } catch(e){} clearInterval(pollTimer); setCloud('off'); render(); }

/* ---------- 3-Wege-Zusammenführung (Basis, lokal, Cloud) ---------- */
const COLL = ['products','cards','menu','specials','moves','inventories','suppliers','orders'];
const J = x => JSON.stringify(x === undefined ? null : x);
function pick3(b, l, r){ const lc = J(l) !== J(b), rc = J(r) !== J(b); return lc && !rc ? l : !lc ? r : l; }
function mergeObj(b, l, r, stockDelta){
  b = b || {}; const o = {};
  for(const k of new Set([...Object.keys(l||{}), ...Object.keys(r||{})])){
    if(stockDelta && k === 'stock'){ o.stock = Math.round(((+r.stock||0) + (+l.stock||0) - (+b.stock||0))*1000)/1000; continue; }
    const v = pick3(b[k], (l||{})[k], (r||{})[k]); if(v !== undefined) o[k] = v;
  }
  return o;
}
function mergeArr(b, l, r, key){
  const mb = new Map((b||[]).map(x=>[x.id,x])), ml = new Map(l.map(x=>[x.id,x])), mr = new Map(r.map(x=>[x.id,x]));
  const ids = [...new Set([...r.map(x=>x.id), ...l.map(x=>x.id)])]; const out = []; let conflicts = 0;
  for(const id of ids){ const bb = mb.get(id), ll = ml.get(id), rr = mr.get(id); const lc = J(ll) !== J(bb), rc = J(rr) !== J(bb); let v;
    if(!lc) v = rr; else if(!rc) v = ll; else if(ll && rr){ v = mergeObj(bb, ll, rr, key==='products'); conflicts++; } else v = ll || rr;
    if(v) out.push(v); }
  if(key === 'moves') out.sort((a,b2) => String(b2.date).localeCompare(String(a.date)));
  return [out, conflicts];
}
function merge3(base, local, remote){
  base = base || {}; const out = {}; let conflicts = 0;
  for(const k of new Set([...Object.keys(local), ...Object.keys(remote)])){
    if(COLL.includes(k) && Array.isArray(local[k]) && Array.isArray(remote[k])){ const [a,c] = mergeArr(base[k], local[k], remote[k], k); out[k] = a; conflicts += c; }
    else if(['settings','salesDays','posMap','salesUnmapped'].includes(k)) out[k] = mergeObj(base[k], local[k]||{}, remote[k]||{});
    else { const v = pick3(base[k], local[k], remote[k]); if(v !== undefined) out[k] = v; }
  }
  return [out, conflicts];
}

/* ---------- Sync ---------- */
function snapshot(){ return JSON.parse(JSON.stringify(S)); }
async function cloudPull(first){
  const st = await rpc('get_state', {p_rid:CL.rid});
  if(!st || !st.data){ return cloudPush(true); }
  if(st.version === CL.version && !first) return;
  const base = baseGet();
  if(!base && first){ return st; }
  const [m, c] = merge3(base, S, st.data);
  const changed = J(m) !== J(S);
  S = migrate(m) || S; CL.version = st.version; CL.lastBy = st.updated_by; clSave();
  baseSet(st.data); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){}
  if(J(S) !== J(st.data)) dirty = true;
  if(changed && !first){ const ae = document.activeElement; if(!ae || !ae.closest('#app input, #app textarea, #app select, #dlg')) render(); toast(`Neue Daten von ${st.updated_by || 'Team'} übernommen${c?` (${c} gleichzeitig bearbeitet)`:''}`); }
  await syncPhotos();
  if(dirty) schedulePush(200);
}
async function cloudPush(force){
  if(!cloudReady() || pushing) return; pushing = true; setCloud('busy');
  try {
    for(let attempt = 0; attempt < 3; attempt++){
      const data = snapshot();
      const res = await rpc('save_state', {p_rid:CL.rid, p_data:data, p_expected:CL.version||0});
      if(res && res.ok){ CL.version = res.version; clSave(); baseSet(data); dirty = J(S) !== J(data); setCloud('ok', 'Gespeichert '+new Date().toLocaleTimeString('de-AT')); break; }
      const [m, c] = merge3(baseGet(), S, res.data); S = migrate(m) || S; CL.version = res.version; clSave(); baseSet(res.data);
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){}
      render(); if(c) toast(`${c} Einträge wurden gleichzeitig auf einem anderen Gerät geändert und zusammengeführt`);
    }
  } catch(err){ dirty = true; setCloud(navigator.onLine === false ? 'offline' : 'err', err.message); }
  finally { pushing = false; if(dirty && cloudState === 'ok') schedulePush(1500); }
}
function schedulePush(ms=1500){ if(!cloudReady()) return; dirty = true; clearTimeout(pushTimer); pushTimer = setTimeout(cloudPush, ms); }
async function cloudPoll(){
  if(!cloudReady() || document.hidden || pushing) return;
  try { const v = await rpc('get_version', {p_rid:CL.rid}); if(v && v.version > (CL.version||0)) await cloudPull(false); else if(dirty) schedulePush(100); else setCloud('ok', cloudMsg); }
  catch(err){ setCloud(navigator.onLine === false ? 'offline' : 'err', err.message); }
}
async function cloudStart(){
  if(!cloudReady()) { setCloud('off'); return; }
  setCloud('busy');
  try { await cloudPull(false); setCloud('ok'); } catch(err){ setCloud(navigator.onLine===false?'offline':'err', err.message); }
  clearInterval(pollTimer); pollTimer = setInterval(cloudPoll, 20000);
}
async function cloudConnectFlow(url, anon, email, pw){
  await cloudLogin(url, anon, email, pw);
  const st = await rpc('get_state', {p_rid:CL.rid});
  if(!st || !st.data){ CL.version = 0; await cloudPush(true); toast('Verbunden. Ihre Daten liegen jetzt in der Cloud.'); }
  else {
    openDialog('Cloud-Daten gefunden', `<p class="dlg-p">Für <b>${esc(CL.rname)}</b> gibt es bereits Daten in der Cloud (Stand ${fmtDate(st.updated_at||new Date().toISOString())}, ${esc(st.updated_by||'Team')}). Was soll passieren?</p>
      <div class="togs" style="flex-direction:column;align-items:flex-start"><label class="tog"><input type="radio" name="how" value="cloud" checked><span></span>Cloud-Daten auf dieses Gerät laden (empfohlen)</label><label class="tog"><input type="radio" name="how" value="local"><span></span>Daten dieses Geräts in die Cloud hochladen und dort ersetzen</label></div>`,
      fd => { if(fd.get('how') === 'cloud'){ S = migrate(st.data) || S; CL.version = st.version; baseSet(st.data); } else { CL.version = st.version; baseSet(st.data); dirty = true; } clSave(); setTimeout(() => { cloudPush(); syncPhotos(); }, 50); },
      {ok:'Weiter', done:'Mit der Cloud verbunden', cancel:'Abbrechen'});
  }
  setCloud('ok'); clearInterval(pollTimer); pollTimer = setInterval(cloudPoll, 20000);
}

/* ---------- Fotos im Cloud-Speicher ---------- */
function referencedImgs(){
  const ids = new Set(); const add = x => x && ids.add(x);
  S.menu.forEach(m=>add(m.img)); S.cards.forEach(c=>{ add(c.img); (c.steps||[]).forEach(s=>add(s.img)); });
  Object.values(S.settings.seasons||{}).forEach(s=>add(s.cover)); (S.orders||[]).forEach(o=>{ add(o.receipt?.photo); add(o.receiptDraft?.photo); });
  return [...ids];
}
async function dataUrlToBlob(d){ return (await fetch(d)).blob(); }
function blobToDataUrl(b){ return new Promise((res,rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(b); }); }
async function uploadImg(id){ if(!cloudReady() || !IMG[id]) return; try { await clFetch(`/storage/v1/object/photos/${CL.rid}/${id}.jpg`, {method:'POST', body:await dataUrlToBlob(IMG[id]), headers:{'x-upsert':'true', 'Content-Type':'image/jpeg'}}); CL.up = CL.up || {}; CL.up[id] = 1; clSave(); } catch(e){} }
async function syncPhotos(){
  if(!cloudReady()) return; let got = 0;
  for(const id of referencedImgs()){
    if(!IMG[id]){ try { const r = await clFetch(`/storage/v1/object/authenticated/photos/${CL.rid}/${id}.jpg`, {raw:true}); const d = await blobToDataUrl(await r.blob()); IMG[id] = d; try { idb && idb.transaction('img','readwrite').objectStore('img').put(d, id); } catch(e){} got++; } catch(e){} }
    else if(!(CL.up||{})[id]) await uploadImg(id);
  }
  if(got) render();
}
const _imgPut = imgPut; imgPut = function(id, data){ _imgPut(id, data); if(cloudReady()) uploadImg(id); };

/* ---------- Bestellung per Server senden ---------- */
async function cloudSendOrder(o){
  const sp = SUP(o.supplier);
  const res = await clFetch('/functions/v1/send-order', {method:'POST', body:{rid:CL.rid, orderNo:o.no, to:sp.email, subject:`Bestellung ${o.no} – ${S.settings.name}`, text:orderText(o), replyTo:S.settings.email}});
  o.status = 'sent'; o.sentAt = new Date().toISOString(); o.sentVia = 'E-Mail (automatisch)'; o.sentBy = me().id; o.mailId = res && res.id || ''; save(); render();
  toast(`${o.no} an ${sp.email} gesendet`);
}

/* ---------- Speichern koppeln ---------- */
const _save = save; save = function(){ _save(); if(cloudReady()) schedulePush(); };
window.addEventListener('online', () => cloudReady() && cloudPoll());
document.addEventListener('visibilitychange', () => { if(!document.hidden) cloudPoll(); });

/* ---------- Einstellungen (neu, mit Team, Einkauf und Cloud) ---------- */
renderSetup = function(){
  const n = Object.keys(IMG).length, s = S.settings, u = me();
  const cloud = cloudReady();
  return `<div class="page-h"><div><div class="eyebrow">Betrieb, Team & Daten</div><h1>Einstellungen</h1></div></div>
  <div class="row-btns m-only" style="margin-bottom:14px"><button type="button" class="btn" data-tab="report">${ico('report')}Auswertung</button><button type="button" class="btn" data-tab="products">${ico('products')}Produkte & Preise</button></div>
  <div class="setup-grid">
    <section class="panel"><div class="panel-h"><h2>Kalkulation</h2></div><div class="fields">
      <label class="f">Name des Betriebs<input id="s-name" data-sf="name" value="${esc(s.name)}"></label>
      <label class="f">MwSt. Speisen, %<input id="s-vat" class="num-in" data-sf="vat" data-num="req de" data-max="100" data-msg="MwSt. muss zwischen 0 und 100 liegen, nicht geändert" type="text" inputmode="decimal" value="${numIn(s.vat)}"></label>
      <label class="f">Ziel-Wareneinsatz, %<input id="s-target" class="num-in" data-sf="target" data-num="req de" data-min="1" data-max="100" data-msg="Ziel-Wareneinsatz muss zwischen 1 und 100 liegen, nicht geändert" type="text" inputmode="decimal" value="${numIn(s.target)}"></label>
    </div><p class="hint">In Österreich gilt für Speisen der ermäßigte Steuersatz von 10 %. Der Wareneinsatz wird vom Preis exkl. MwSt. berechnet.</p></section>
    <section class="panel"><div class="panel-h"><h2>Einkauf</h2></div><div class="fields two">
      <label class="f">Lieferadresse<input data-us="addr" data-k="address" value="${esc(s.address)}"></label>
      <label class="f">Hinweis für Fahrer<input data-us="addr" data-k="deliveryNote" value="${esc(s.deliveryNote)}"></label>
      <label class="f">Telefon für Rückfragen<input data-us="addr" data-k="phone" value="${esc(s.phone)}"></label>
      <label class="f">Antwort-E-Mail<input data-us="addr" data-k="email" type="email" value="${esc(s.email)}"></label>
      <label class="f">Freigabe ab €<input id="s-limit" class="num-in" data-us="limit" data-num="req de" data-msg="Ungültiger Betrag, nicht geändert" type="text" inputmode="decimal" value="${numIn(s.orderLimit)}"></label>
    </div><p class="hint">Bestellungen über diesem Betrag muss der Inhaber freigeben. Die Bar bestellt Getränke und Wein, der Küchenchef alles andere.</p></section>
    <section class="panel"><div class="panel-h"><h2>Wer arbeitet gerade?</h2><span class="muted sm">${esc(whoLabel(u))}</span></div>
      ${cloud ? `<p class="hint">Mit der Cloud verbunden: Name und Rolle kommen aus Ihrem Konto. Neue Mitarbeiter fügt der Inhaber im Cloud-Projekt hinzu (siehe Anleitung).</p>`
      : `<div class="who">${s.users.map(x=>`<button type="button" class="who-b ${s.currentUser===x.id?'on':''}" data-act="userSwitch" data-id="${x.id}" aria-pressed="${s.currentUser===x.id}"><b>${esc(x.name)}</b>${x.name===ROLES[x.role]?'':`<small>${ROLES[x.role]}</small>`}<small class="who-can">${{owner:'darf alles', chef:'Küche, Karte, Preise', bar:'Getränke bestellen', staff:'ansehen, Lager buchen'}[x.role]||''}</small></button>`).join('')}</div>
        <p class="hint">Ohne Cloud ist das eine Auswahl auf diesem Gerät, ohne Passwort. Mit der Cloud meldet sich jeder mit eigenem Konto an.</p>`}
    </section>
    <section class="panel ${cloud?'':'accent'}"><div class="panel-h"><h2>Cloud & Team</h2>${cloud?`<span class="cloud-chip ${cloudState}">${{ok:'synchron',busy:'speichert …',offline:'offline',err:'Fehler',off:''}[cloudState]}</span>`:''}</div>
      ${FRAMED ? `<p class="hint">Die Cloud funktioniert in der installierten Version der App auf Ihrer Website. In dieser Vorschau ist sie abgeschaltet.</p>`
      : cloud ? `<div class="kv"><span>Betrieb</span><span>${esc(CL.rname)}</span><span>Angemeldet</span><span>${esc(whoLabel(CL.member))}</span><span>Konto</span><span>${esc(CL.email)}</span><span>Stand</span><span>${{ok:'alles übertragen', busy:'wird übertragen …', offline:'kein Internet', err:'nicht übertragen'}[cloudState]||'—'}</span></div>
          ${cloudMsg?`<p class="hint">${esc(cloudMsg)}</p>`:''}
          <div class="row-btns" style="margin-top:12px"><button type="button" class="btn" data-act="cloudSync">Jetzt abgleichen</button><button type="button" class="btn danger" data-act="cloudOut">Abmelden</button></div>`
      : `<p class="hint" style="margin-top:0">Mit der Cloud sehen Küche, Bar und Büro auf allen Geräten dieselben Daten und Fotos, und Bestellungen gehen mit einem Klick per E-Mail raus. Sie brauchen dafür ein eigenes Cloud-Projekt; Adresse und Schlüssel stehen in der Einrichtungs-Anleitung (Ordner <b>dahuam/cloud</b>) oder kommen von der Person, die es eingerichtet hat.</p>
          <form id="cloudForm" class="cloud-form" novalidate>
            <label class="f">Adresse des Cloud-Projekts<input name="url" type="url" required inputmode="url" autocomplete="off" placeholder="https://…" value="${esc(CL.url||'')}"></label>
            <label class="f">Schlüssel des Projekts<input name="anon" required autocomplete="off" placeholder="lange Zeichenfolge aus der Anleitung" value="${esc(CL.anon||'')}"></label>
            <label class="f">Ihre E-Mail<input name="email" type="email" required autocomplete="username" value="${esc(CL.email||'')}"></label>
            <label class="f">Passwort<input name="pw" type="password" required autocomplete="current-password"></label>
            <div class="row-btns"><button type="submit" class="btn primary">Verbinden</button></div>
            <p class="hint bad-t" id="cloudErr" role="alert"></p>
          </form>`}
    </section>
    <section class="panel"><div class="panel-h"><h2>Startanimation</h2></div>
      <label class="f">Beim Öffnen der App<select data-intro="1">${[['candle','Kerzenschein'],['plate','Teller wie auf der Website'],['off','Keine']].map(([k,l])=>`<option value="${k}" ${(()=>{ try { return (localStorage.getItem(KEY+'_intro')||'candle')===k; } catch(e){ return k==='candle'; } })()?'selected':''}>${l}</option>`).join('')}</select></label>
      <div class="row-btns" style="margin-top:10px"><button type="button" class="btn sm" data-act="introNow">Jetzt ansehen</button></div><p class="hint">Erscheint einmal pro Sitzung und lässt sich mit einem Tipp überspringen.</p></section>
    <section class="panel"><div class="panel-h"><h2>Daten</h2><span class="muted sm">${n} Fotos gespeichert</span></div>
      <p class="hint">${cloud ? 'Die Daten liegen in der Cloud und zusätzlich auf diesem Gerät. Eine Sicherung als Datei schadet trotzdem nicht.' : 'Daten und Fotos werden nur in diesem Browser gespeichert. Erstellen Sie regelmäßig eine Sicherung.'}</p>
      <div class="row-btns wrap" style="margin-top:12px"><button type="button" class="btn" data-act="export">Sicherung erstellen</button>
        <button type="button" class="btn" data-act="importPick">Sicherung laden</button><input id="importFile" type="file" accept="application/json,.json" hidden>
        <button type="button" class="btn danger" data-act="reset">Demodaten wiederherstellen</button></div>
      ${(() => { const sf = safetyGet(); return sf && sf.data ? `<div class="safety"><span><b>Sicherheitskopie vom ${fmtDate(sf.at)}</b><small class="muted">${esc(sf.why||'')} · ${plural((sf.data.menu||[]).length,'Gericht','Gerichte')}, ${plural((sf.data.cards||[]).length,'Rezeptur','Rezepturen')}</small></span><span class="row-btns"><button type="button" class="btn sm" data-act="safetyRestore">Letzte Daten wiederherstellen</button><button type="button" class="btn sm" data-act="safetyDl">Als Datei speichern</button></span></div>` : ''; })()}
    </section>
  </div>`;
};
document.addEventListener('submit', async e => {
  if(e.target.id !== 'cloudForm') return; e.preventDefault();
  const f = e.target, btn = f.querySelector('button[type=submit]'), err = $('#cloudErr');
  btn.disabled = true; btn.textContent = 'Verbinde …'; err.textContent = '';
  const miss = ['url','anon','email','pw'].find(k => !f[k].value.trim());
  if(miss){ err.textContent = {url:'Bitte die Adresse des Cloud-Projekts eintragen.', anon:'Bitte den Schlüssel des Projekts eintragen.', email:'Bitte Ihre E-Mail eintragen.', pw:'Bitte das Passwort eintragen.'}[miss]; f[miss].focus(); btn.disabled = false; btn.textContent = 'Verbinden'; return; }
  if(!/^https:\/\/[^\s/]+\.[^\s/]+/i.test(f.url.value.trim())){ err.textContent = 'Die Adresse muss mit https:// beginnen, zum Beispiel https://meinbetrieb.example.'; f.url.focus(); btn.disabled = false; btn.textContent = 'Verbinden'; return; }
  try { await cloudConnectFlow(f.url.value, f.anon.value, f.email.value, f.pw.value); render(); }
  catch(x){ CL.session = null; err.textContent = cloudErrText(x); btn.disabled = false; btn.textContent = 'Verbinden'; }
});
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if(!el) return;
  if(el.dataset.act === 'cloudSync'){ try { await cloudPull(false); await cloudPush(); await syncPhotos(); toast('Alles übertragen'); render(); } catch(x){ toast('Übertragen fehlgeschlagen. ' + cloudErrText(x)); } }
  if(el.dataset.act === 'cloudOut') ask('Von der Cloud abmelden? Die Daten bleiben auf diesem Gerät.', () => cloudLogout(), 'Abmelden');
  if(el.dataset.act === 'ordCloudSend'){ const o = ORD(el.dataset.id); el.disabled = true; el.textContent = 'Sende …'; try { await cloudSendOrder(o); } catch(x){ el.disabled = false; el.textContent = 'Jetzt per E-Mail senden'; info('Senden fehlgeschlagen', cloudErrText(x) + ' Die Bestellung ist nicht gesendet. Nutzen Sie „E-Mail öffnen“ oder versuchen Sie es später noch einmal.'); } }
});

document.addEventListener('change', e => { const t = e.target; if(t.dataset.intro){ try { localStorage.setItem(KEY+'_intro', t.value); } catch(x){} toast('Startanimation: '+t.options[t.selectedIndex].text); } });
document.addEventListener('click', e => { const el = e.target.closest('[data-act="introNow"]'); if(el){ try { sessionStorage.removeItem('dahuam202_intro'); } catch(x){} location.reload(); } });

/* =====================================================================
   Premium-Oberfläche: Listenansichten, Umschalter, Navigation, Einkauf
   ===================================================================== */
const BUY = ['bestellung','lieferanten'];
/* Zahlen in Eingabefeldern: Anzeige mit Komma, Eingabe mit Komma oder Punkt */
const num2 = n => fin(n).toLocaleString('de-DE',{minimumFractionDigits:2, maximumFractionDigits:2});
const numIn = v => (v==='' || v==null || isNaN(+v)) ? '' : String(+v).replace('.', ',');
function numParse(v){ let s = String(v==null?'':v).trim().replace(/[€%\s]/g,''); if(!s) return NaN; if(s.includes(',') && s.includes('.')) s = s.replace(/\./g,'').replace(',','.'); else s = s.replace(',','.'); return +s; }
TABS.length = 0;
TABS.push(['dash','Heute','Heute'],['menu','Speisekarte','Karte'],['cards','Rezepturen','Rezepte'],['stock','Lager','Lager'],['buy','Einkauf','Einkauf'],['products','Produkte','Produkte'],['setup','Einstellungen','Mehr']);
ICO.buy = '<path d="M3 4h2l2.5 11h10L20 7H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>';
ICO.vlist = '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>';
ICO.vcompact = '<path d="M4 5h16M4 9.5h16M4 14h16M4 18.5h16"/>';
ICO.vcards = '<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/>';
ICO.sort = '<path d="M8 4v16M4 16l4 4 4-4M16 20V4M12 8l4-4 4 4"/>';
const NAV_GROUPS = [['Täglich',['dash','buy']],['Küche',['menu','cards']],['Bestand',['stock','products']],['',['setup']]];
navHtml = function(short){
  const item = k => { const t = TABS.find(x=>x[0]===k); return `<button type="button" class="nav-i" data-tab="${k}">${ico(k)}<span>${short?t[2]:t[1]}</span></button>`; };
  if(short) return ['dash','menu','cards','stock','buy','setup'].map(item).join('');
  return NAV_GROUPS.map(([g,ks]) => (g?`<div class="nav-group">${g}</div>`:'<div class="nav-group" aria-hidden="true"></div>') + ks.map(item).join('')).join('');
};

/* ---------- Ansicht merken ---------- */
const VKEY = KEY + '_views';
let VIEWS = (() => { try { return JSON.parse(localStorage.getItem(VKEY)) || {}; } catch(e){ return {}; } })();
function vmode(k){ return VIEWS[k] || 'list'; }
function setV(k, m){ VIEWS[k] = m; try { localStorage.setItem(VKEY, JSON.stringify(VIEWS)); } catch(e){} }
function vsw(k){ const m = vmode(k); return `<div class="vsw" role="group" aria-label="Ansicht">${[['list','Liste','vlist'],['compact','Kompakt','vcompact'],['cards','Karten','vcards']].map(([v,l,i])=>`<button type="button" class="${m===v?'on':''}" data-act="vsw" data-id="${k}:${v}" title="${l}" aria-label="${l}" aria-pressed="${m===v}">${ico(i)}</button>`).join('')}</div>`; }
const SORTS = (() => { try { return JSON.parse(localStorage.getItem(KEY+'_sorts')) || {}; } catch(e){ return {}; } })();
function sortHead(k, col, label, cls=''){ const s = SORTS[k] || {}; const on = s.col === col; return `<th class="${cls}"><button type="button" class="${on?'on':''}" data-act="lsort" data-id="${k}:${col}">${label}${on ? (s.dir>0?' ↑':' ↓') : ''}</button></th>`; }
function applySort(k, list, get){ const s = SORTS[k]; if(!s || !s.col) return list; const f = get[s.col]; if(!f) return list; return [...list].sort((a,b) => { const x = f(a), y = f(b); return (typeof x === 'string' ? x.localeCompare(y,'de') : (x??-1e9) - (y??-1e9)) * s.dir; }); }

/* ---------- Speisekarte: Kalkulation als Liste ---------- */
const _menuCalcCards = renderMenuCalc;
renderMenuCalc = function(){
  const mode = vmode('menu');
  if(mode === 'cards') return _menuCalcCards().replace('<div class="toolbar"><label class="search">', `<div class="toolbar">${vsw('menu')}<label class="search">`);
  const q = view.q.trim().toLowerCase();
  const all = menuSorted().map(m => ({m, k:menuCalc(m)}));
  const f = view.sec;
  const shown = all.filter(({m,k}) => (!q || (m.name+' '+m.desc+' '+m.section+' '+(k.t?k.t.lines.map(l=>l.name).join(' '):'')).toLowerCase().includes(q))
    && (f==='all' || (f==='none' ? k.cost==null : f==='over' ? (k.fc!=null && k.fc > S.settings.target) : f==='nophoto' ? !menuImg(m) : f==='noalg' ? !hasAlg(m) : SEASONS.some(x=>x[0]===f) ? m.seasons.includes(f) : m.section===f)));
  const cnt = x => all.filter(x).length;
  const chip = (k,l,n) => `<button type="button" class="chip ${f===k?'on':''}" data-act="sec" data-id="${esc(k)}">${esc(l)}<small>${n}</small></button>`;
  let h = `<div class="toolbar"><label class="search">${ico('search')}<input id="mq" type="search" placeholder="Gericht, Zutat oder Kategorie" value="${esc(view.q)}" autocomplete="off"></label><span class="sp"></span>${vsw('menu')}</div>
  <div class="toolbar filters">${seg('sec', f, [['all','Alle',all.length],['over','Über Ziel',cnt(x=>x.k.fc!=null&&x.k.fc>S.settings.target)],['none','Ohne Rezeptur',cnt(x=>x.k.cost==null)],['noalg','Ohne Allergene',cnt(x=>!hasAlg(x.m))],['nophoto','Ohne Foto',cnt(x=>!menuImg(x.m))]])}<select class="sel-cat" data-sel="sec" aria-label="Kategorie"><option value="all">Alle Kategorien</option>${secList().filter(s=>all.some(x=>x.m.section===s)).map(s=>`<option value="${esc(s)}" ${f===s?'selected':''}>${esc(s)} (${cnt(x=>x.m.section===s)})</option>`).join('')}<optgroup label="Saison">${SEASONS.map(([k,l])=>`<option value="${k}" ${f===k?'selected':''}>Nur ${l} (${cnt(x=>x.m.seasons.includes(k))})</option>`).join('')}</optgroup></select></div>`;
  if(!shown.length) return h + `<div class="panel empty">Keine Gerichte für diesen Filter.</div>`;
  const sorted = applySort('menu', shown, {name:x=>x.m.name, price:x=>+x.m.price, cost:x=>x.k.cost, fc:x=>x.k.fc, margin:x=>x.k.margin});
  const grouped = !(SORTS.menu && SORTS.menu.col);
  const row = ({m,k}) => { const img = menuImg(m); const st = [];
    if(!k.c) st.push('<span class="open" title="Noch keine Rezeptur verknüpft"><i></i>Rezeptur</span>'); if(!hasAlg(m)) st.push('<span class="open" title="Allergene fehlen"><i></i>Allergene</span>'); if(m.hidden) st.push('<span>ausgeblendet</span>'); if(m.top) st.push('<span class="top" title="Empfehlung des Hauses">★</span>');
    return `<tr class="row ${m.hidden?'off':''}" data-act="${k.c?'openCard':'editMenu'}" data-id="${k.c?k.c.id:m.id}">
      <td><div class="lt-n">${img?`<img src="${IMG[img]}" alt="">`:''}<span><b>${esc(m.name)}${m.vlabel?` <span class="lt-muted">· ${esc(m.vlabel)}</span>`:''}${m.veg?` <span class="lt-muted">${m.veg}</span>`:''}</b><small>${esc(m.desc||'')}</small></span></div></td>
      <td class="hide-m lt-muted">${m.seasons.length ? m.seasons.map(seasonName).join(', ') : 'ganzjährig'}${m.days&&m.days.length?' · '+esc(hkDays(m)):''}</td>
      <td class="r"><input class="lt-price num-in" id="mp-${m.id}" type="text" inputmode="decimal" data-num="req price" data-mp="${m.id}" value="${num2(m.price)}" aria-label="Preis ${esc(dishLabel(m))}"></td>
      <td class="r hide-m">${k.cost!=null?eur(k.cost):'<span class="lt-muted">—</span>'}</td>
      <td class="r"><span class="lt-fc ${fcClass(k.fc)}"><i></i>${k.fc!=null?num(k.fc,1)+' %':'—'}</span></td>
      <td class="r hide-m">${k.margin!=null?eur(k.margin):'<span class="lt-muted">—</span>'}</td>
      <td class="hide-m"><span class="lt-st">${st.join('')}</span></td>
      <td><div class="lt-acts"><button type="button" class="icon-btn" data-act="photoMenu" data-id="${m.id}" title="Foto" aria-label="Foto">${ico('camera')}</button><button type="button" class="icon-btn" data-act="editMenu" data-id="${m.id}" title="Bearbeiten" aria-label="Bearbeiten">${ico('edit')}</button></div></td></tr>`; };
  let body = '';
  if(grouped){ for(const s of secList()){ const list = sorted.filter(x=>x.m.section===s); if(!list.length) continue; body += `<tr class="grp"><td colspan="8">${esc(s)}<small>${list.length}</small></td></tr>` + list.map(row).join(''); } }
  else body = sorted.map(row).join('');
  return h + `<div class="lt-wrap"><table class="lt ${mode}"><thead><tr>${sortHead('menu','name','Gericht')}<th class="hide-m">Saison</th>${sortHead('menu','price','Preis','r')}${sortHead('menu','cost','WE','r hide-m')}${sortHead('menu','fc','WE %','r')}${sortHead('menu','margin','Rohertrag','r hide-m')}<th class="hide-m">Status</th><th></th></tr></thead><tbody>${body}</tbody></table></div>
  `;
};

/* ---------- Rezepturen als Liste ---------- */
const _cardsCards = renderCards;
renderCards = function(){
  const mode = vmode('cards');
  if(mode === 'cards') return _cardsCards().replace('<div class="rc-grid">', `<div class="toolbar" style="margin-top:-4px"><span class="sp"></span>${vsw('cards')}</div><div class="rc-grid">`);
  const q = view.q.trim().toLowerCase();
  const list0 = S.cards.filter(c => (view.ctype==='all' || c.type===view.ctype) && (!q || (c.name+' '+c.category).toLowerCase().includes(q)));
  const n = t => S.cards.filter(c=>t==='all'||c.type===t).length;
  const rows = list0.map(c => { const t = totals(c); const mk = S.menu.filter(m => m.card === c.id).map(menuCalc)[0]; return {c, t, mk, per100: c.yieldG ? t.cost/c.yieldG*100 : 0}; });
  const sorted = applySort('cards', rows.sort((a,b)=> a.c.type===b.c.type ? byName(a.c,b.c) : (a.c.type==='semi'?1:-1)), {name:x=>x.c.name, cat:x=>x.c.category||'', cost:x=>x.t.cost, per100:x=>x.per100, fc:x=>x.mk?x.mk.fc:null, items:x=>x.c.items.length});
  let h = `<div class="page-h"><div><div class="eyebrow">${n('dish')} Gerichte · ${n('semi')} Basisrezepte</div><h1>Rezepturen</h1></div>
    <div class="row-btns"><button type="button" class="btn" data-act="newCard" data-id="semi">${ico('plus')}Basisrezept</button><button type="button" class="btn primary" data-act="newCard" data-id="dish">${ico('plus')}Gericht</button></div></div>
  <div class="toolbar"><label class="search">${ico('search')}<input id="cq" type="search" placeholder="Rezeptur suchen" value="${esc(view.q)}" autocomplete="off"></label>
    ${seg('ctype', view.ctype, [['all','Alle',n('all')],['dish','Gerichte',n('dish')],['semi','Basisrezepte',n('semi')]])}<span class="sp"></span>${vsw('cards')}</div>`;
  if(!sorted.length) return h + `<div class="panel empty">Keine Rezepturen gefunden. Legen Sie eine mit „Gericht“ an.</div>`;
  return h + `<div class="lt-wrap"><table class="lt ${mode}"><thead><tr>${sortHead('cards','name','Rezeptur')}${sortHead('cards','cat','Kategorie','hide-m')}<th class="hide-m">Typ</th>${sortHead('cards','items','Zutaten','r hide-m')}${sortHead('cards','cost','WE','r')}${sortHead('cards','per100','pro 100 g','r hide-m')}${sortHead('cards','fc','WE %','r')}<th class="hide-m">Karte</th></tr></thead><tbody>
    ${sorted.map(({c,t,mk,per100}) => `<tr class="row" data-act="openCard" data-id="${c.id}">
      <td><div class="lt-n">${c.img&&IMG[c.img]?`<img src="${IMG[c.img]}" alt="">`:''}<span><b>${esc(c.name)}</b><small>Nr. ${c.no||'—'} · ${(c.steps||[]).length} Schritte · ${num(c.yieldG)} g</small></span></div></td>
      <td class="hide-m lt-muted">${esc(c.category||'—')}</td><td class="hide-m lt-muted">${c.type==='semi'?'Basisrezept':'Gericht'}</td>
      <td class="r hide-m">${c.items.length}</td><td class="r">${eur(t.cost)}</td><td class="r hide-m">${eur(per100)}</td>
      <td class="r">${c.type==='dish'?`<span class="lt-fc ${fcClass(mk?mk.fc:null)}"><i></i>${mk?num(mk.fc,1)+' %':'—'}</span>`:'<span class="lt-muted">—</span>'}</td>
      <td class="hide-m">${c.type==='dish' ? (mk ? '<span class="lt-st"><span class="ok">auf der Karte</span></span>' : `<span class="lt-st"><span>nicht auf der Karte</span></span>`) : ''}</td></tr>`).join('')}
  </tbody></table></div>`;
};

/* ---------- Einkauf als eigener Bereich ---------- */
function renderBuy(){
  if(!BUY.includes(view.stab)) view.stab = 'bestellung';
  const open = S.orders.filter(o=>['draft','approval','sent','confirmed','complaint'].includes(o.status)).length;
  const low = lowStock().length; const due = (S.suppliers||[]).filter(sp=>sp.active && sp.orderDays.includes(wd(todayStr()))).length;
  const exp = S.orders.filter(o=>['sent','confirmed'].includes(o.status) && o.deliveryDate<=todayStr()).length;
  const month = S.orders.filter(o=>o.receipt && o.receipt.date.slice(0,7)===todayStr().slice(0,7)).reduce((a,o)=>a+deliveredTotal(o),0);
  const editing = view.order && ORD(view.order);
  const head = editing ? '' : `<div class="page-h"><div><div class="eyebrow">${(S.suppliers||[]).length} Lieferanten · ${open} offene Bestellungen</div><h1>Einkauf</h1></div>
    <div class="row-btns"><button type="button" class="btn" data-act="moveDlg" data-id="in">${ico('truck')}Lieferung ohne Bestellung</button><button type="button" class="btn primary" data-act="buyNew">${ico('plus')}Bestellung</button></div></div>
  <div class="tiles"><div class="tile"><div><div class="t-l">Heute bestellen</div><div class="t-v">${due}</div></div></div><div class="tile"><div><div class="t-l">Lieferungen heute</div><div class="t-v ${exp?'':'good-t'}">${exp}</div></div></div><div class="tile"><div><div class="t-l">Unter Mindestbestand</div><div class="t-v ${low?'bad-t':''}">${low}</div></div></div><div class="tile"><div><div class="t-l">Einkauf diesen Monat</div><div class="t-v">${eur(month)}</div></div></div></div>
  <div class="toolbar">${seg('stab', view.stab, [['bestellung','Bestellungen',open],['lieferanten','Lieferanten',(S.suppliers||[]).length]])}<span class="sp"></span>${vsw('buy')}</div>`;
  return head + (view.stab === 'lieferanten' ? supplierView() : orderView());
}
function buyNewDialog(){
  const sups = (S.suppliers||[]).filter(s=>s.active);
  openDialog('Neue Bestellung', `<label class="f">Lieferant<select name="sid">${sups.map(s=>`<option value="${s.id}">${esc(s.name)} · ${esc(SUP_CATS[s.cat]||'')}</option>`).join('')}</select></label>
    <div class="togs"><label class="tog"><input type="checkbox" name="fill" checked><span></span>Artikel unter Mindestbestand vorschlagen</label></div>`,
    fd => { const o = newOrder(fd.get('sid'), !!fd.get('fill')); view.stab = 'bestellung'; view.order = o.id; }, {ok:'Anlegen', done:'Entwurf angelegt'});
}

/* ---------- Ereignisse ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return;
  const id = el.dataset.id;
  if(el.dataset.act === 'vsw'){ const [k,m] = id.split(':'); setV(k, m); render(); }
  if(el.dataset.act === 'lsort'){ const [k,col] = id.split(':'); const s = SORTS[k] || {}; if(s.col === col){ if(!s.flip) SORTS[k] = {col, dir:-s.dir, flip:1}; else delete SORTS[k]; } else SORTS[k] = {col, dir: col==='name'||col==='cat' ? 1 : -1}; try { localStorage.setItem(KEY+'_sorts', JSON.stringify(SORTS)); } catch(x){} render(); }
  if(el.dataset.act === 'buyNew') buyNewDialog();
}, true);
document.addEventListener('click', e => { if(e.target.closest('.lt-price')) e.stopPropagation(); }, true);
document.addEventListener('change', e => {
  const t = e.target;
  if(t.dataset.mp){ const m = S.menu.find(x=>x.id===t.dataset.mp); const old = +m.price; const nv = +t.value; if(t.value === '' || !isFinite(nv) || nv < 0){ t.value = num2(old); return; } m.price = Math.round(nv*100)/100; save(); softRender(); if(old !== m.price) toast(`${m.name}: ${eur(old)} → ${eur(m.price)}`); }
});

/* =====================================================================
   Verkäufe: Speicher, Kassen-Import, Demodaten, Zeitraum-Rechnung
   S.salesDays = { 'YYYY-MM-DD': [[menuId, Menge, UmsatzBrutto], …] }
   S.posMap    = { 'kassen-schlüssel': menuId | '-' (ignorieren) }
   ===================================================================== */
function salesEnsure(d){ if(!d.salesDays) d.salesDays = {}; if(!d.posMap) d.posMap = {}; if(!d.salesImports) d.salesImports = []; return d; }
function isoDate(dt){ return new Date(dt.getTime() - dt.getTimezoneOffset()*6e4).toISOString().slice(0,10); }
function dParse(s){ return new Date(s+'T12:00:00'); }
function dAdd(s, n){ const d = dParse(s); d.setDate(d.getDate()+n); return isoDate(d); }
function dDiff(a, b){ return Math.round((dParse(b) - dParse(a))/864e5); }
function isOpenDemo(s){ const d = dParse(s), md = s.slice(5), w = d.getDay(); if(w === 3) return false; return !((md >= '04-20' && md <= '06-12') || (md >= '10-11' && md <= '11-30')); }

// Demodaten: plausible Tagesverkäufe der letzten 14 Monate
function salesDemo(d){
  salesEnsure(d); if(d.salesDemoDone) return d;
  let seed = 20262; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const pop = {'Elsässer':9,'Zillertaler Käsefondue':7,'Wiener Schnitzel':12,'Kaiserschmarrn':9,'Gulaschsuppe':6,'Knoblauchbrot':6,'Wadel-Beißer-Burger':6,'Caesar Salat':4,'Oma Lisls Apfelstrudel':5,'Tomatensuppe':3,'Gärtnerin':3,'Weißer':2.5,'Schwammerl':2,'Garnelenpfandl':2.5,'Ripperl-Tower':2,'DFC Burger':4,'Alpen-Kebap':3.5,'Fish & Chips':2.5,'Filetsteak 230 g':1.6,'Cordon bleu':2,'Kalbsrahmgulasch':2,'Forelle Müllerin':1.5,'Hans-Wurst':2,'Bauernrösti':2.2,'Schwammerlrösti':1.6,'Dolce-Vita-Rösti':1.2,'Schokofondue':1.8,'Cookie-Pfandl':1.5,'Marillenknödel':2,'Crème brûlée':1.2,'Affogato':2,'Kinderschnitzel mit Pommes':3,'Chicken Nuggets mit Pommes':2.5,'Milchshake':3,'Palatschinke':2,'Gerlos Bowl':1.8,'Kebap Bowl':1.4,'Tatar vom Tiroler Rind':1.2,'Fabians Caprese':1.3,'Kokos-Curry-Suppe':1.5};
  const items = d.menu.map(m => ({m, w: (pop[m.name] || 0.8) * (m.vlabel==='vom Kalb' ? 0.45 : m.vlabel==='vom Schwein' ? 0.8 : m.vlabel==='180 g' ? .5 : 1)}));
  const end = isoDate(new Date()), start = dAdd(end, -425);
  const seasonOf = s => { const md = s.slice(5); for(const [k,ss] of Object.entries(d.settings.seasons||{})) { if(ss.from <= ss.to ? (md >= ss.from && md <= ss.to) : (md >= ss.from || md <= ss.to)) return k; } return null; };
  for(let s = start; s <= end; s = dAdd(s, 1)){
    if(!isOpenDemo(s)) continue;
    const dt = dParse(s), w = dt.getDay(), md = s.slice(5), k = seasonOf(s);
    let base = 70; if(k==='winter') base = md >= '12-24' || md <= '01-06' ? 175 : (md >= '02-01' && md <= '03-10' ? 150 : 115); else if(k==='sommer') base = md >= '07-10' && md <= '08-25' ? 105 : 80; else if(k==='herbst') base = 60; else if(k==='fruehling') base = 55;
    if(w === 6) base *= 1.25; if(w === 0) base *= 1.12; if(w === 1 || w === 2) base *= .85;
    const covers = Math.round(base * (0.85 + rnd()*0.3));
    const avail = items.filter(({m}) => (!m.seasons || !m.seasons.length || m.seasons.includes(k)) && (!m.days || !m.days.length || m.days.includes(w)));
    const sum = avail.reduce((a,x)=>a+x.w,0); const rows = [];
    for(const {m,w:wt} of avail){ const exp = covers * 1.25 * wt / sum; let q = Math.round(exp * (0.6 + rnd()*0.8)); if(q > 0) rows.push([m.id, q, Math.round(q * (+m.price||0) * 100)/100]); }
    d.salesDays[s] = rows;
  }
  d.salesDemo = true; d.salesDemoDone = true; return d;
}

/* ---------- Zeiträume ---------- */
function periodRange(key, ref){
  const t = ref || isoDate(new Date()); const d = dParse(t); const y = d.getFullYear(), m = d.getMonth();
  const mo = (yy, mm) => isoDate(new Date(yy, mm, 1, 12)); const lastOf = (yy, mm) => isoDate(new Date(yy, mm+1, 0, 12));
  const wdMon = (d.getDay()+6)%7;
  switch(key){
    case 'today': return [t, t];
    case 'yesterday': return [dAdd(t,-1), dAdd(t,-1)];
    case 'week': return [dAdd(t,-wdMon), dAdd(t, 6-wdMon)];
    case 'lastweek': return [dAdd(t,-wdMon-7), dAdd(t,-wdMon-1)];
    case 'month': return [mo(y,m), lastOf(y,m)];
    case 'lastmonth': return [mo(y,m-1), lastOf(y,m-1)];
    case 'quarter': { const q = Math.floor(m/3)*3; return [mo(y,q), lastOf(y,q+2)]; }
    case 'half': { const h = m < 6 ? 0 : 6; return [mo(y,h), lastOf(y,h+5)]; }
    case 'year': return [`${y}-01-01`, `${y}-12-31`];
    case 'lastyear': return [`${y-1}-01-01`, `${y-1}-12-31`];
    case 'winter': { const ws = S.settings.seasons.winter; const sy = (t.slice(5) >= ws.from) ? y : y-1; return [`${sy}-${ws.from}`, `${sy+1}-${ws.to}`]; }
    case 'lastwinter': { const ws = S.settings.seasons.winter; const sy = (t.slice(5) >= ws.from) ? y-1 : y-2; return [`${sy}-${ws.from}`, `${sy+1}-${ws.to}`]; }
    case 'summer': { const ss = S.settings.seasons.sommer; const sy = t.slice(5) >= ss.from ? y : y-1; return [`${sy}-${ss.from}`, `${sy}-${ss.to}`]; }
  }
  return [t, t];
}
function compareRange(from, to, mode){
  if(mode === 'prev'){ const n = dDiff(from, to) + 1; return [dAdd(from, -n), dAdd(from, -1)]; }
  const sh = s => { const y = +s.slice(0,4) - 1; let r = `${y}${s.slice(4)}`; if(r.slice(5) === '02-29') r = `${y}-02-28`; return r; };
  return [sh(from), sh(to)];
}
function salesAgg(from, to){
  const by = new Map(); const days = {}; let qty = 0, gross = 0, openDays = 0;
  for(const [day, rows] of Object.entries(S.salesDays || {})){
    if(day < from || day > to) continue; openDays++; let dg = 0;
    for(const [mid, q, g] of rows){ const a = by.get(mid) || {q:0, g:0}; a.q += q; a.g += g; by.set(mid, a); qty += q; gross += g; dg += g; }
    days[day] = dg;
  }
  return {by, days, qty, gross, openDays};
}
function vatOf(m){ const s = (m && m.section) || ''; return /getränk|wein|bar/i.test(s) ? 20 : (+S.settings.vat || 10); }

/* ---------- Kassen-Import (CSV) ---------- */
function csvParse(text){
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/).find(l => l.trim()) || '';
  const delim = [';','\t',',','|'].map(c => [c, (first.match(new RegExp('\\'+c,'g'))||[]).length]).sort((a,b)=>b[1]-a[1])[0][0];
  const rows = []; let row = [], cur = '', q = false;
  for(let i = 0; i < text.length; i++){ const ch = text[i];
    if(q){ if(ch === '"'){ if(text[i+1] === '"'){ cur += '"'; i++; } else q = false; } else cur += ch; continue; }
    if(ch === '"'){ q = true; continue; }
    if(ch === delim){ row.push(cur); cur = ''; continue; }
    if(ch === '\n' || ch === '\r'){ if(ch === '\r' && text[i+1] === '\n') i++; row.push(cur); if(row.some(c=>c.trim()!=='')) rows.push(row); row = []; cur = ''; continue; }
    cur += ch; }
  row.push(cur); if(row.some(c=>c.trim()!=='')) rows.push(row);
  return rows;
}
const COLS = {
  date:/^(datum|date|tag|buchungsdatum|beleg.?datum|zeit|zeitpunkt|timestamp|day)$/i,
  art:/^(art(ikel)?\.?\s*-?\s*(nr|nummer|no)\.?|plu|sku|code|artikelcode|id)$/i,
  name:/^(artikel|bezeichnung|artikelname|produkt|name|item|text|artikelbezeichnung|beschreibung)$/i,
  qty:/^(menge|anzahl|stk|stück|qty|quantity|verkauft|count)$/i,
  gross:/^(umsatz|brutto|umsatz\s*brutto|betrag|summe|gesamt|total|gross|vk\s*brutto|preis\s*gesamt|umsatz\s*\(brutto\))$/i,
  price:/^(preis|einzelpreis|vk|vk-preis|price|unit\s*price)$/i,
};
function guessCols(header){ const m = {}; header.forEach((h,i) => { const k = h.trim(); for(const [c,re] of Object.entries(COLS)) if(m[c]==null && re.test(k)) m[c] = i; }); return m; }
function numDE(s){ s = String(s||'').replace(/[€\s]/g,''); if(/,\d{1,2}$/.test(s) || (s.includes(',') && !s.includes('.'))) s = s.replace(/\./g,'').replace(',', '.'); else s = s.replace(/,/g,''); const n = parseFloat(s); return isFinite(n) ? n : 0; }
function dateDE(s){ s = String(s||'').trim(); let m;
  if((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`;
  if((m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/))) { const y = m[3].length===2 ? '20'+m[3] : m[3]; return `${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; }
  if((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;
  return null; }
function normName(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[„“"'’.,()\-]/g,' ').replace(/\s+/g,' ').trim(); }
function posKey(art, name){ return art ? 'a:'+String(art).trim() : 'n:'+normName(name); }
function autoMatch(name){
  const n = normName(name); if(!n) return null;
  let best = null, bs = 0;
  for(const m of S.menu){ const full = normName(m.name + (m.vlabel ? ' '+m.vlabel : '')), base = normName(m.name);
    let sc = 0; if(full === n || base === n) sc = 1; else { const a = new Set(n.split(' ')), b = new Set(full.split(' ')); const inter = [...a].filter(x=>b.has(x) && x.length > 2).length; sc = inter / Math.max(a.size, b.size); if(full.includes(n) || n.includes(base)) sc = Math.max(sc, .7); }
    if(sc > bs){ bs = sc; best = m; } }
  return bs >= .6 ? best : null;
}
function importAnalyse(text){
  const rows = csvParse(text); if(rows.length < 2) throw new Error('Die Datei enthält keine Datenzeilen.');
  const head = rows[0]; const c = guessCols(head);
  if(c.qty == null || (c.name == null && c.art == null)) throw new Error('Spalten für Artikel und Menge nicht gefunden. Erwartet z. B. „Datum; Artikelnr; Artikel; Menge; Umsatz“.');
  const fileDate = null; const lines = []; const unknown = new Map(); let skipped = 0;
  for(const r of rows.slice(1)){
    const date = c.date != null ? dateDE(r[c.date]) : fileDate; const q = numDE(r[c.qty]); if(!q){ skipped++; continue; }
    const art = c.art != null ? r[c.art] : '', name = c.name != null ? r[c.name] : art;
    let g = c.gross != null ? numDE(r[c.gross]) : (c.price != null ? numDE(r[c.price]) * q : 0);
    const key = posKey(art, name); let mid = S.posMap[key];
    if(mid === undefined){ const m = autoMatch(name); if(m) mid = m.id; }
    if(!date){ skipped++; continue; }
    lines.push({date, key, name:String(name).trim(), art:String(art||'').trim(), q, g, mid: mid ?? null});
    if(!mid) unknown.set(key, {key, name:String(name).trim(), art:String(art||'').trim(), q:(unknown.get(key)?.q||0)+q});
  }
  return {cols:c, head, lines, unknown:[...unknown.values()], skipped};
}
function importApply(res, {replace=true, stock=false}={}){
  const days = {};
  for(const l of res.lines){ const mid = S.posMap[l.key] !== undefined ? S.posMap[l.key] : l.mid; if(!mid || mid === '-') continue; (days[l.date] = days[l.date] || new Map()); const a = days[l.date].get(mid) || [0,0]; a[0] += l.q; a[1] += l.g; days[l.date].set(mid, a); }
  let n = 0, portions = 0; const acc = new Map();
  for(const [day, mp] of Object.entries(days)){
    const rows = [...mp.entries()].map(([mid,[q,g]]) => [mid, Math.round(q*1000)/1000, Math.round(g*100)/100]);
    if(replace || !S.salesDays[day]) S.salesDays[day] = rows; else { const cur = new Map(S.salesDays[day].map(r=>[r[0],r])); rows.forEach(r => { const c = cur.get(r[0]); if(c){ c[1] += r[1]; c[2] += r[2]; } else cur.set(r[0], r); }); S.salesDays[day] = [...cur.values()]; }
    n++; rows.forEach(([mid,q]) => { portions += q; if(stock){ const m = S.menu.find(x=>x.id===mid); const c = m && m.card && C(m.card); if(c) explode(c, q, acc); } });
  }
  Object.keys(days).forEach(d => markRealDay(d));
  if(stock && acc.size){ const grp = uid('sb'); acc.forEach((q,pid) => { const before = S.moves.length; addMove('sale', pid, -Math.round(q*1000)/1000, 'Kassen-Import'); if(S.moves.length > before) S.moves[0].grp = grp; }); S.saleGroups = S.saleGroups || {}; S.saleGroups[grp] = {day:null, n:Math.round(portions), rows:null, gross:0, imp:true}; }
  S.salesImports.unshift({date:new Date().toISOString(), days:n, portions:Math.round(portions), by:me().name, stock});
  if(S.salesDemo){ /* echte Daten: Demodaten entfernen, damit nichts vermischt wird */ }
  return {days:n, portions};
}

/* =====================================================================
   Auswertung: Verkäufe nach Zeitraum, Kassen-Import, Zuordnung
   ===================================================================== */
TABS.splice(TABS.findIndex(t=>t[0]==='setup'), 0, ['report','Auswertung','Zahlen']);
ICO.report = '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>';
NAV_GROUPS.splice(3, 0, ['Zahlen',['report']]);
const UNITS = [['day','Tag'],['week','Woche'],['month','Monat'],['quarter','Quartal'],['half','Halbjahr'],['year','Jahr'],['season','Saison'],['custom','Von–Bis']];
const MONTHS = ['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
view.rp = {unit:'month', ref:isoDate(new Date()), from:'', to:'', cmp:'year', tab:'sales', chip:'all', grouped:true};
const RSORT = {col:'gross', dir:-1, flip:0, def:1};

function isoWeek(s){ const d = dParse(s); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = t.getUTCFullYear(); const w = Math.ceil(((t - Date.UTC(y,0,1))/864e5 + 1)/7); return [y, w]; }
function seasonRange(ref){
  const ss = S.settings.seasons; const y = +ref.slice(0,4), md = ref.slice(5); const w = ss.winter, so = ss.sommer;
  const inW = w.from <= w.to ? (md >= w.from && md <= w.to) : (md >= w.from || md <= w.to);
  if(inW){ const sy = md >= w.from ? y : y-1; return {k:'winter', from:`${sy}-${w.from}`, to:`${sy+1}-${w.to}`, label:`Wintersaison ${sy}/${String(sy+1).slice(2)}`}; }
  if(md >= so.from && md <= so.to) return {k:'sommer', from:`${y}-${so.from}`, to:`${y}-${so.to}`, label:`Sommersaison ${y}`};
  // Zwischensaison: letzte abgeschlossene Saison
  if(md > so.to) return {k:'sommer', from:`${y}-${so.from}`, to:`${y}-${so.to}`, label:`Sommersaison ${y}`};
  const sy = y-1; return {k:'winter', from:`${sy}-${w.from}`, to:`${y}-${w.to}`, label:`Wintersaison ${sy}/${String(y).slice(2)}`};
}
function rpRange(rp){
  const r = rp.ref, d = dParse(r), y = d.getFullYear(), m = d.getMonth();
  const mo = (yy,mm) => isoDate(new Date(yy,mm,1,12)), last = (yy,mm) => isoDate(new Date(yy,mm+1,0,12));
  switch(rp.unit){
    case 'day': return {from:r, to:r, label:d.toLocaleDateString('de-AT',{weekday:'long', day:'numeric', month:'long', year:'numeric'})};
    case 'week': { const off = (d.getDay()+6)%7; const f = dAdd(r,-off), t = dAdd(f,6); const [wy,wn] = isoWeek(r); return {from:f, to:t, label:`KW ${wn} · ${fmtShort(f)}–${fmtShort(t)}${t.slice(0,4)}`}; }
    case 'month': return {from:mo(y,m), to:last(y,m), label:`${MONTHS[m]} ${y}`};
    case 'quarter': { const q = Math.floor(m/3); return {from:mo(y,q*3), to:last(y,q*3+2), label:`${q+1}. Quartal ${y}`}; }
    case 'half': { const h = m < 6 ? 0 : 1; return {from:mo(y,h*6), to:last(y,h*6+5), label:`${h+1}. Halbjahr ${y}`}; }
    case 'year': return {from:`${y}-01-01`, to:`${y}-12-31`, label:`Jahr ${y}`};
    case 'season': return seasonRange(r);
    case 'custom': { const f = rp.from || dAdd(isoDate(new Date()),-29), t = rp.to || isoDate(new Date()); return {from:f<=t?f:t, to:f<=t?t:f, label:`${fmtDate(f+'T12:00:00')} – ${fmtDate(t+'T12:00:00')}`}; }
  }
}
function rpStep(dir){
  const rp = view.rp, d = dParse(rp.ref);
  if(rp.unit==='day') rp.ref = dAdd(rp.ref, dir);
  else if(rp.unit==='week') rp.ref = dAdd(rp.ref, 7*dir);
  else if(['month','quarter','half'].includes(rp.unit)){ const n = {month:1, quarter:3, half:6}[rp.unit]; rp.ref = isoDate(new Date(d.getFullYear(), d.getMonth()+n*dir, 1, 12)); }
  else if(rp.unit==='year') rp.ref = `${d.getFullYear()+dir}-06-15`;
  else if(rp.unit==='season'){ const r = seasonRange(rp.ref); rp.ref = dir < 0 ? dAdd(r.from,-1) : dAdd(r.to, 1); let g = 0; while(g++ < 400 && seasonRange(rp.ref).from === r.from) rp.ref = dAdd(rp.ref, dir); if(dir > 0 && rp.ref.slice(5) > S.settings.seasons.sommer.to && rp.ref.slice(5) < S.settings.seasons.winter.from) rp.ref = `${rp.ref.slice(0,4)}-${S.settings.seasons.winter.from}`; }
  else if(rp.unit==='custom'){ const r = rpRange(rp); const n = dDiff(r.from, r.to)+1; rp.from = dAdd(r.from, n*dir); rp.to = dAdd(r.to, n*dir); }
}
function cmpRange(rp, r, today){
  if(rp.cmp === 'off') return null;
  let c;
  if(rp.cmp === 'prev'){
    if(['month','quarter','half','year','season'].includes(rp.unit)){ const p = {...rp}; const keep = view.rp; view.rp = p; try { rpStep(-1); } finally { view.rp = keep; } const pr = rpRange(p); c = {from:pr.from, to:pr.to}; }
    else { const n = dDiff(r.from, r.to)+1; c = {from:dAdd(r.from,-n), to:dAdd(r.from,-1)}; }
  }
  else if(rp.unit === 'day' || rp.unit === 'week') c = {from:dAdd(r.from,-364), to:dAdd(r.to,-364)};
  else { const sh = s => { let t = `${+s.slice(0,4)-1}${s.slice(4)}`; if(t.slice(5)==='02-29') t = t.slice(0,8)+'28'; return t; }; c = {from:sh(r.from), to:sh(r.to)}; }
  // läuft der Zeitraum noch, wird nur dieselbe Anzahl Tage ab Beginn verglichen
  today = today || isoDate(new Date());
  if(r.from <= today && r.to > today){ const n = dDiff(r.from, today); const to = dAdd(c.from, n); if(to < c.to){ c.to = to; c.same = n + 1; } }
  return c;
}

/* ---------- Kennzahlen ---------- */
function report(from, to){
  const a = salesAgg(from, to); const rows = [];
  let net = 0, we = 0, netCovered = 0, grossCovered = 0;
  for(const [mid, {q, g}] of a.by){
    const m = S.menu.find(x=>x.id===mid); const vat = vatOf(m); const n = g/(1+vat/100);
    const k = m ? menuCalc(m) : null; const cpp = k && k.cost != null ? k.cost : null;
    const w = cpp != null ? cpp*q : null;
    rows.push({mid, m, name: m ? dishLabel(m) : 'Gelöschtes Gericht', section: m ? m.section : '—', q, g, n, avg: q ? g/q : 0, we:w, cpp, fc: w != null && n ? w/n*100 : null, rg: w != null ? n - w : null});
    net += n; if(w != null){ we += w; netCovered += n; grossCovered += g; }
  }
  return {rows, qty:a.qty, gross:a.gross, net, we, netCovered, cover: a.gross ? grossCovered/a.gross*100 : 0, fc: netCovered ? we/netCovered*100 : null, rg: netCovered - we, days:a.days, openDays:a.openDays};
}
const delta = (cur, prev) => prev ? (cur/prev - 1)*100 : null;
function dPill(dv, inverse){ if(dv == null || !isFinite(dv)) return '<span class="rp-d">—</span>'; const up = dv >= 0; const good = inverse ? !up : up; return `<span class="rp-d ${Math.abs(dv) < .05 ? '' : good ? 'up' : 'down'}">${up?'+':''}${num(dv,1)} %</span>`; }

/* ---------- Ansicht ---------- */
function renderReport(){
  const rp = view.rp; const t = view.rp.tab;
  const head = `<div class="page-h"><div><div class="eyebrow">${Object.keys(S.salesDays||{}).length} Verkaufstage gespeichert${S.salesDemo?' · Demodaten':''}</div><h1>Auswertung</h1></div>
    <div class="row-btns">${t==='sales' ? `<button type="button" class="btn" data-act="rpCsv">${ico('copy')}Tabelle (CSV)</button>${false?'':`<button type="button" class="btn" data-act="rpPrint">${ico('print')}Bericht drucken / PDF</button>`}` : ''}${t==='import' ? '' : `<button type="button" class="btn primary" data-act="rpTab" data-id="import">${ico('plus')}Kasse importieren</button>`}</div></div>
  <div class="toolbar">${seg('rpTab', t, [['sales','Verkäufe'],['import','Kasse importieren'],['map','Zuordnung', Object.keys(S.salesUnmapped||{}).length || null]])}</div>`;
  if(t === 'import') return head + importView();
  if(t === 'map') return head + mapView();
  return head + salesView();
}
function salesView(){
  const rp = view.rp; const today = isoDate(new Date()); let r = rpRange(rp);
  // beim ersten Öffnen: hat der laufende Zeitraum keine Verkäufe, den letzten mit Daten zeigen
  if(!rp.auto){ rp.auto = true; if(rp.unit !== 'custom' && !Object.keys(S.salesDays||{}).some(d => d >= r.from && d <= r.to)){ const last = Object.keys(S.salesDays||{}).filter(d => d <= today).sort().pop(); if(last){ rp.ref = last; r = rpRange(rp); rp.jumped = true; } } }
  const to = r.to > today ? today : r.to; const cur = report(r.from, to);
  const cr = cmpRange(rp, r, today); const cmp = cr ? report(cr.from, cr.to > today ? today : cr.to) : null;
  const cmpLabel = cr ? `${fmtDate(cr.from+'T12:00:00')} – ${fmtDate(cr.to+'T12:00:00')}${cr.same ? ` · gleicher Zeitraum, ${plural(cr.same,'Tag','Tage')} ab Beginn` : ''}` : '';
  const unm = Object.values(S.salesUnmapped||{}); const unmG = unm.reduce((a,u)=>a+Object.entries(u.days||{}).filter(([d])=>d>=r.from&&d<=to).reduce((b,[,v])=>b+v[1],0),0);
  let h = `<section class="panel rp-period">
    <div class="rp-units">${seg('rpUnit', rp.unit, UNITS)}</div>
    <div class="rp-nav">${rp.unit==='custom' ? `<label class="f">Von<input type="date" data-rpd="from" value="${r.from}"></label><label class="f">Bis<input type="date" data-rpd="to" value="${r.to}"></label>` : ''}
      <button type="button" class="icon-btn lg" data-act="rpStep" data-id="-1" aria-label="Zurück">${ico('arrow')}</button>
      <div class="rp-label"><b>${esc(r.label)}</b><small>${fmtDate(r.from+'T12:00:00')} – ${fmtDate(r.to+'T12:00:00')}${r.to > today && r.from <= today ? ' · bis heute' : ''}${rp.jumped ? ' · letzter Zeitraum mit Verkäufen' : ''} · ${cur.openDays} ${cur.openDays===1?"Verkaufstag":"Verkaufstage"}</small></div>
      <button type="button" class="icon-btn lg" data-act="rpStep" data-id="1" aria-label="Weiter">${ico('arrow','flip')}</button>
      <button type="button" class="btn sm" data-act="rpToday">Aktuell</button>
      <span class="sp"></span><span class="muted sm">Vergleich</span>${seg('rpCmp', rp.cmp, [['off','Aus'],['prev','Vorperiode'],['year','Vorjahr']])}</div>
  </section>`;
  if(S.salesDemo) h += `<div class="note" style="display:flex">${ico('spark')}<span>Demodaten: erfundene Verkäufe der letzten 14 Monate, damit Sie die Auswertung ausprobieren können. Beim ersten echten Kassen-Import werden sie entfernt.</span></div>`;
  if(unm.length) h += `<div class="warn-box" style="margin-bottom:14px">${ico('spark')}<span><b>${unm.length} Kassenartikel nicht zugeordnet</b>${unmG?` · ${eur(unmG)} Umsatz in diesem Zeitraum fehlen in der Auswertung`:''}.</span><button type="button" class="btn sm" data-act="rpTab" data-id="map">Zuordnen</button></div>`;
  if(!cur.openDays) return h + `<section class="panel empty">Für diesen Zeitraum gibt es keine Verkäufe. Importieren Sie die Artikelumsätze aus Ihrer Kasse.<div class="row-btns" style="justify-content:center;margin-top:12px"><button type="button" class="btn primary" data-act="rpTab" data-id="import">Kasse importieren</button></div></section>`;
  const tile = (l, v, dv, sub, inv) => `<div class="tile"><div><div class="t-l">${l}</div><div class="t-v">${v}</div><div class="t-s">${cmp ? dPill(dv, inv)+' ' : ''}${sub||''}</div></div></div>`;
  h += `<div class="tiles">
    ${tile('Umsatz netto', eur(cur.net), cmp && delta(cur.net, cmp.net), `brutto ${eur(cur.gross)}`)}
    ${tile('Portionen', num(cur.qty), cmp && delta(cur.qty, cmp.qty))}
    ${tile('Ø pro Verkaufstag', eur(cur.openDays ? cur.net/cur.openDays : 0), cmp && delta(cur.net/cur.openDays, cmp.openDays ? cmp.net/cmp.openDays : 0), 'netto')}
    ${tile('Wareneinsatz', cur.fc!=null ? num(cur.fc,1)+' %' : '—', cmp && cmp.fc!=null && cur.fc!=null ? (cur.fc - cmp.fc)/cmp.fc*100 : null, `für ${num(cur.cover,0)} % des Umsatzes`, true)}
    ${tile('Rohertrag', eur(cur.rg), cmp && delta(cur.rg, cmp.rg), 'Gerichte mit Rezeptur')}
  </div>
  ${cr ? `<p class="hint rp-cmpnote">Vergleich mit ${cmpLabel}</p>` : ''}
  <section class="panel"><div class="panel-h"><h2>Umsatz im Zeitverlauf</h2><span class="legend">${cmp?'<i class="lg-c"></i>Vergleich':''}<i class="lg-b"></i>Umsatz netto</span></div>${chartSvg(r.from, to, cur, cr, cmp)}</section>
  ${itemTable(cur, cmp)}
  <div class="rp-grid">
    <section class="panel"><div class="panel-h"><h2>Menü-Matrix</h2><span class="muted sm">Beliebtheit × Rohertrag je Portion</span></div>${matrixSvg(cur)}</section>
    <section class="panel"><div class="panel-h"><h2>Wochentage</h2><span class="muted sm">Ø Umsatz netto je Verkaufstag</span></div>${weekdaySvg(cur)}</section>
  </div>
  <div class="rp-grid">${topFlop(cur, 'q', 'Meistverkauft')}${topFlop(cur, 'rg', 'Größter Rohertrag')}</div>
  ${specialsBlock(r.from, to, cur)}
  ${dDiff(r.from, to) > 62 ? monthTable(r.from, to) : ''}
  <p class="hint">Interne Auswertung. Maßgeblich für Steuer und Buchhaltung sind die Daten der Registrierkasse (RKSV/DEP). Netto: Speisen 10 %, Getränke 20 % MwSt.</p>`;
  return h;
}
function buckets(from, to){
  const n = dDiff(from, to) + 1; const out = [];
  if(n <= 31){ for(let s = from; s <= to; s = dAdd(s,1)) out.push({from:s, to:s, label: dParse(s).getDate()+'.', tip: fmtDate(s+'T12:00:00')}); return {g:'Tag', out}; }
  if(n <= 186){ let s = dAdd(from, -((dParse(from).getDay()+6)%7)); while(s <= to){ const e = dAdd(s,6); out.push({from:s < from ? from : s, to:e > to ? to : e, label:'KW '+isoWeek(s)[1], tip:`${fmtShort(s)}–${fmtShort(e)}`}); s = dAdd(s,7); } return {g:'Woche', out}; }
  let d = dParse(from); d = new Date(d.getFullYear(), d.getMonth(), 1, 12);
  while(isoDate(d) <= to){ const f = isoDate(d), e = isoDate(new Date(d.getFullYear(), d.getMonth()+1, 0, 12)); out.push({from:f < from ? from : f, to:e > to ? to : e, label:MONTHS[d.getMonth()].slice(0,3), tip:`${MONTHS[d.getMonth()]} ${d.getFullYear()}`}); d = new Date(d.getFullYear(), d.getMonth()+1, 1, 12); }
  return {g:'Monat', out};
}
function netOfDays(days, from, to){ let s = 0; for(const [d, rows] of Object.entries(S.salesDays||{})){ if(d < from || d > to) continue; for(const [mid,,g] of rows){ const m = S.menu.find(x=>x.id===mid); s += g/(1+vatOf(m)/100); } } return s; }
function chartSvg(from, to, cur, cr, cmp){
  const {g, out} = buckets(from, to); const vals = out.map(b => netOfDays(null, b.from, b.to));
  const off = cr ? dDiff(cr.from, from) : 0;
  const cv = cr ? out.map(b => netOfDays(null, dAdd(b.from,-off), dAdd(b.to,-off))) : null;
  const max = Math.max(1, ...vals, ...(cv||[0])); const step = niceStep(max/3); const top = Math.ceil(max/step)*step;
  const W = 1000, H = 230, L = 56, R = 8, T = 10, B = 28, bw = (W-L-R)/out.length;
  const y = v => T + (H-T-B) * (1 - v/top);
  let s = `<svg class="rp-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Umsatz netto je ${g}">`;
  for(let v = 0; v <= top + 1e-6; v += step) s += `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${L-8}" y="${y(v)+4}" class="ax" text-anchor="end">${v >= 1000 ? num(v/1000,1)+' k' : num(v)}</text>`;
  out.forEach((b,i) => { const x = L + i*bw; const v = vals[i]; const hh = Math.max(0, H-B-y(v)); s += `<rect x="${x+bw*.14}" y="${y(v)}" width="${Math.max(1,bw*.72)}" height="${hh}" class="bar"><title>${esc(b.tip)}: ${eur(v)}</title></rect>`;
    if(out.length <= 16 || i % Math.ceil(out.length/14) === 0) s += `<text x="${x+bw/2}" y="${H-9}" class="ax" text-anchor="middle">${esc(b.label)}</text>`; });
  if(cv) s += `<polyline class="cl" points="${cv.map((v,i)=>`${L+i*bw+bw/2},${y(v)}`).join(' ')}"/>`;
  return s + '</svg>';
}
function niceStep(x){ const p = Math.pow(10, Math.floor(Math.log10(Math.max(x,1)))); const f = x/p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
function itemTable(cur, cmp){
  const chip = view.rp.chip; const cq = cmp ? new Map(cmp.rows.map(r=>[r.mid, r.q])) : null;
  let rows = cur.rows;
  if(chip === 'norec') rows = rows.filter(r => r.we == null);
  let unsold = [];
  if(chip === 'unsold'){ const sold = new Set(cur.rows.map(r=>r.mid)); unsold = S.menu.filter(m => !m.hidden && !sold.has(m.id)); }
  const get = {name:r=>r.name, q:r=>r.q, share:r=>r.q, gross:r=>r.g, net:r=>r.n, avg:r=>r.avg, we:r=>r.we, fc:r=>r.fc, rg:r=>r.rg, d:r=>cq ? delta(r.q, cq.get(r.mid)||0) : null};
  const f = get[RSORT.col] || get.gross; rows = [...rows].sort((a,b) => { const x = f(a), y = f(b); return (typeof x === 'string' ? x.localeCompare(y,'de') : ((x??-1e12) - (y??-1e12))) * RSORT.dir; });
  const th = (c, l, cls='r') => `<th class="${cls}"><button type="button" class="${RSORT.col===c&&!RSORT.def?'on':''}" data-act="rpSort" data-id="${c}">${l}${RSORT.col===c&&!RSORT.def?(RSORT.dir>0?' ↑':' ↓'):''}</button></th>`;
  const tr = r => `<tr class="row" data-act="${r.m && r.m.card ? 'openCard' : 'editMenu'}" data-id="${r.m ? (r.m.card || r.m.id) : ''}">
    <td><div class="lt-n"><span><b>${esc(r.name)}</b>${!view.rp.grouped?`<small>${esc(r.section)}</small>`:''}</span></div></td>
    <td class="r"><b>${num(r.q)}</b></td><td class="r hide-m lt-muted">${num(cur.qty ? r.q/cur.qty*100 : 0,1)} %</td>
    <td class="r hide-m">${eur(r.g)}</td><td class="r rp-net">${eur(r.n)}</td><td class="r hide-m lt-muted">${eur(r.avg)}</td>
    <td class="r hide-m">${r.we!=null?eur(r.we):'<span class="lt-st"><span class="bad">keine Rezeptur</span></span>'}</td>
    <td class="r">${r.fc!=null?`<span class="lt-fc ${fcClass(r.fc)}"><i></i>${num(r.fc,1)} %</span>`:'<span class="lt-muted">—</span>'}</td>
    <td class="r hide-m">${r.rg!=null?eur(r.rg):'<span class="lt-muted">—</span>'}</td>
    ${cq?`<td class="r rp-dq">${dPill(delta(r.q, cq.get(r.mid)||0))}</td>`:''}</tr>`;
  let body = '';
  if(chip === 'unsold') body = unsold.map(m => `<tr class="row" data-act="editMenu" data-id="${m.id}"><td><div class="lt-n"><span><b>${esc(dishLabel(m))}</b><small>${esc(m.section)}</small></span></div></td><td class="r">0</td><td colspan="${cq?8:7}" class="lt-muted">Im Zeitraum nicht verkauft${m.seasons&&m.seasons.length?' · Saison: '+m.seasons.map(seasonName).join(', '):''}</td></tr>`).join('') || '<tr><td colspan="9" class="lt-muted">Jedes Gericht wurde mindestens einmal verkauft.</td></tr>';
  else if(view.rp.grouped){ for(const s of secList()){ const list = rows.filter(r=>r.section===s); if(!list.length) continue; const sq = list.reduce((a,r)=>a+r.q,0), sn = list.reduce((a,r)=>a+r.n,0); body += `<tr class="grp"><td colspan="${cq?10:9}">${esc(s)}<small>${num(sq)} Portionen · ${eur(sn)} netto</small></td></tr>` + list.map(tr).join(''); } const rest = rows.filter(r=>!secList().includes(r.section)); if(rest.length) body += `<tr class="grp"><td colspan="${cq?10:9}">Sonstige</td></tr>` + rest.map(tr).join(''); }
  else body = rows.map(tr).join('');
  const chipB = (k,l,n) => `<button type="button" class="chip ${chip===k?'on':''}" data-act="rpChip" data-id="${k}">${l}${n!=null?`<small>${n}</small>`:''}</button>`;
  return `<h2 class="sec-h">Artikel</h2>
  <div class="toolbar">${chipB('all','Alle',cur.rows.length)}${chipB('norec','Ohne Rezeptur',cur.rows.filter(r=>r.we==null).length)}${chipB('unsold','Ohne Verkauf')}<span class="sp"></span><label class="tog"><input type="checkbox" data-rpg="1" ${view.rp.grouped?'checked':''}><span></span>Nach Kategorie gruppieren</label></div>
  <div class="lt-wrap"><table class="lt rp-items"><thead><tr>${th('name','Gericht','')}${th('q','Menge')}${th('share','Anteil','r hide-m')}${th('gross','Umsatz brutto','r hide-m')}${th('net','Umsatz netto','r rp-net')}${th('avg','Ø Preis','r hide-m')}${th('we','WE gesamt','r hide-m')}${th('fc','WE %')}${th('rg','Rohertrag','r hide-m')}${cq?th('d','Δ Menge','r rp-dq'):''}</tr></thead>
  <tbody>${body}</tbody>
  <tfoot><tr><td>Summe</td><td class="r">${num(cur.qty)}</td><td class="hide-m"></td><td class="r hide-m">${eur(cur.gross)}</td><td class="r rp-net">${eur(cur.net)}</td><td class="hide-m"></td><td class="r hide-m">${eur(cur.we)}</td><td class="r">${cur.fc!=null?num(cur.fc,1)+' %':'—'}</td><td class="r hide-m">${eur(cur.rg)}</td>${cq?'<td class="rp-dq"></td>':''}</tr></tfoot></table></div>
  <p class="hint">Wareneinsatz-Abdeckung: ${num(cur.cover,0)} % des Umsatzes (Gerichte mit Rezeptur). Spaltenkopf antippen zum Sortieren.</p>`;
}
function matrixSvg(cur){
  const pts = cur.rows.filter(r => r.cpp != null && r.q >= 10 && r.m);
  if(pts.length < 3) return '<p class="hint">Für die Matrix braucht es mindestens drei Gerichte mit Rezeptur und je 10 verkauften Portionen.</p>';
  const tq = pts.reduce((a,r)=>a+r.q,0); const popT = .7 * tq / pts.length;
  const mT = pts.reduce((a,r)=>a + (r.n/r.q - r.cpp)*r.q, 0) / tq;
  const W = 520, H = 320, L = 44, B = 30, T = 12, R = 12;
  const xm = Math.max(...pts.map(r=>r.q))*1.08, ym = Math.max(...pts.map(r=>r.n/r.q - r.cpp))*1.12;
  const X = v => L + (W-L-R)*v/xm, Y = v => T + (H-T-B)*(1 - v/ym);
  const quad = r => { const hp = r.q >= popT, hm = (r.n/r.q - r.cpp) >= mT; return hp && hm ? 'star' : hp ? 'horse' : hm ? 'puzzle' : 'dog'; };
  const lab = {star:'Renner', horse:'Brotgericht', puzzle:'Rätsel', dog:'Verlierer'}, tip = {star:'halten', horse:'Preis oder Rezeptur prüfen', puzzle:'besser platzieren', dog:'streichen?'};
  let s = `<svg class="rp-matrix" viewBox="0 0 ${W} ${H}" role="img" aria-label="Menü-Matrix">
    <line x1="${X(popT)}" x2="${X(popT)}" y1="${T}" y2="${H-B}" class="th"/><line x1="${L}" x2="${W-R}" y1="${Y(mT)}" y2="${Y(mT)}" class="th"/>
    <text x="${W-R-4}" y="${T+12}" class="ql" text-anchor="end">Renner</text><text x="${L+4}" y="${T+12}" class="ql">Rätsel</text><text x="${W-R-4}" y="${H-B-6}" class="ql" text-anchor="end">Brotgerichte</text><text x="${L+4}" y="${H-B-6}" class="ql">Verlierer</text>
    <text x="${(L+W-R)/2}" y="${H-6}" class="ax" text-anchor="middle">Verkaufte Portionen</text><text x="12" y="${(T+H-B)/2}" class="ax" text-anchor="middle" transform="rotate(-90 12 ${(T+H-B)/2})">Rohertrag je Portion</text>`;
  pts.forEach(r => { const mg = r.n/r.q - r.cpp; s += `<g class="pt ${quad(r)}" data-act="openCard" data-id="${r.m.card}"><circle cx="${X(r.q)}" cy="${Y(mg)}" r="6"/>${(() => { const nm = dishLabel(r.m); const sh = nm.length > 20 ? nm.slice(0,19)+'…' : nm; const right = X(r.q) + 9 + sh.length*6.2 > W - R; return `<text x="${right ? X(r.q)-9 : X(r.q)+9}" y="${Y(mg)+4}" ${right ? 'text-anchor="end"' : ''}>${esc(sh)}</text>`; })()}<title>${esc(r.name)}: ${num(r.q)} Portionen, ${eur(mg)} Rohertrag je Portion</title></g>`; });
  s += '</svg>';
  const groups = ['star','horse','puzzle','dog'].map(k => { const l = pts.filter(r=>quad(r)===k); return `<li><b>${lab[k]}</b> <span class="muted">· ${tip[k]}</span><br><span class="sm">${l.map(r=>esc(dishLabel(r.m))).join(', ') || '—'}</span></li>`; }).join('');
  return s + `<ul class="rp-quads">${groups}</ul><p class="hint">Nur Gerichte mit Rezeptur und mindestens 10 Portionen. Grenze Beliebtheit: 70 % des Durchschnitts, Grenze Rohertrag: gewichteter Durchschnitt (${eur(mT)}).</p>`;
}
function weekdaySvg(cur){
  const sum = Array(7).fill(0), cnt = Array(7).fill(0);
  for(const [d] of Object.entries(cur.days)){ const w = (dParse(d).getDay()+6)%7; cnt[w]++; sum[w] += netOfDays(null, d, d); }
  const avg = sum.map((s,i)=>cnt[i] ? s/cnt[i] : 0); const max = Math.max(1, ...avg);
  const names = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const W = 420, H = 220, B = 26, T = 18, bw = W/7;
  let s = `<svg class="rp-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Umsatz je Wochentag">`;
  avg.forEach((v,i) => { const hh = (H-B-T)*v/max; const closed = !cnt[i]; s += closed ? `<rect x="${i*bw+bw*.18}" y="${H-B-14}" width="${bw*.64}" height="14" class="hatch"/><text x="${i*bw+bw/2}" y="${H-B-20}" class="ax" text-anchor="middle">Ruhetag</text>` : `<rect x="${i*bw+bw*.18}" y="${H-B-hh}" width="${bw*.64}" height="${hh}" class="bar"><title>${names[i]}: Ø ${eur(v)} an ${cnt[i]} Tagen</title></rect><text x="${i*bw+bw/2}" y="${H-B-hh-6}" class="ax" text-anchor="middle">${v>=1000?num(v/1000,1)+' k':num(v)}</text>`; s += `<text x="${i*bw+bw/2}" y="${H-8}" class="ax" text-anchor="middle">${names[i]}</text>`; });
  return s + '</svg>';
}
function topFlop(cur, k, title){
  const list = cur.rows.filter(r => k === 'q' || r.rg != null).sort((a,b)=>(b[k]||0)-(a[k]||0));
  const top = list.slice(0,10), flop = list.slice(-5).reverse();
  const li = r => `<li><span>${esc(r.name)}</span><b class="mono">${k==='q' ? num(r.q) : eur(r.rg)}</b></li>`;
  return `<section class="panel"><div class="panel-h"><h2>${title}</h2><span class="muted sm">Top 10 · schwächste 5</span></div><ol class="rp-top">${top.map(li).join('')}</ol><div class="rp-flop-h">Am schwächsten</div><ol class="rp-top flop">${flop.map(li).join('')}</ol></section>`;
}
function specialsBlock(from, to, cur){
  const sps = (S.specials||[]).filter(sp => sp.from <= to && (sp.to||sp.from) >= from); if(!sps.length) return '';
  const avgW = Array(7).fill(0), cW = Array(7).fill(0);
  for(const d of Object.keys(cur.days)){ const w = dParse(d).getDay(); avgW[w] += netOfDays(null,d,d); cW[w]++; }
  return `<section class="panel"><div class="panel-h"><h2>Aktionen</h2><span class="muted sm">Umsatz an Aktionstagen gegenüber gleichen Wochentagen</span></div><div class="lt-wrap flat"><table class="lt"><thead><tr><th>Aktion</th><th>Datum</th><th class="r">Umsatz netto</th><th class="r">Ø gleicher Wochentag</th><th class="r">Mehrumsatz</th></tr></thead><tbody>
  ${sps.map(sp => { let n = 0, base = 0, k = 0; for(let d = sp.from; d <= (sp.to||sp.from); d = dAdd(d,1)){ if(d < from || d > to) continue; n += netOfDays(null,d,d); const w = dParse(d).getDay(); if(cW[w]){ base += avgW[w]/cW[w]; k++; } } return `<tr><td><b>${esc(sp.name)}</b></td><td class="lt-muted">${fmtRange(sp)}</td><td class="r">${eur(n)}</td><td class="r lt-muted">${eur(base)}</td><td class="r">${dPill(base ? (n/base-1)*100 : null)}</td></tr>`; }).join('')}
  </tbody></table></div><p class="hint">Umsätze der Aktionsgerichte selbst erscheinen, sobald sie in der Kasse als eigene Artikel geführt und zugeordnet sind.</p></section>`;
}
function monthTable(from, to){
  const {out} = (() => { let d = dParse(from); d = new Date(d.getFullYear(), d.getMonth(), 1, 12); const o = []; while(isoDate(d) <= to){ const f = isoDate(d), e = isoDate(new Date(d.getFullYear(), d.getMonth()+1, 0, 12)); o.push({from:f<from?from:f, to:e>to?to:e, label:`${MONTHS[d.getMonth()]} ${d.getFullYear()}`}); d = new Date(d.getFullYear(), d.getMonth()+1, 1, 12); } return {out:o}; })();
  let tq = 0, tg = 0, t10 = 0, t20 = 0, tw = 0, tr = 0;
  const rows = out.map(b => { const rp = report(b.from, b.to); let n10 = 0, n20 = 0; rp.rows.forEach(r => { if(vatOf(r.m) === 20) n20 += r.n; else n10 += r.n; }); tq += rp.qty; tg += rp.gross; t10 += n10; t20 += n20; tw += rp.we; tr += rp.rg;
    return `<tr><td>${b.label}</td><td class="r">${num(rp.qty)}</td><td class="r">${eur(rp.gross)}</td><td class="r">${eur(n10)}</td><td class="r hide-m">${eur(n20)}</td><td class="r hide-m">${eur(rp.we)}</td><td class="r hide-m">${eur(rp.rg)}</td></tr>`; }).join('');
  return `<section class="panel flush"><div class="panel-h pad"><h2>Monatsübersicht</h2><span class="muted sm">für Jahresbericht und Steuerberatung</span></div><div class="lt-wrap flat"><table class="lt"><thead><tr><th>Monat</th><th class="r">Portionen</th><th class="r">Umsatz brutto</th><th class="r">netto 10 %</th><th class="r hide-m">netto 20 %</th><th class="r hide-m">Wareneinsatz</th><th class="r hide-m">Rohertrag</th></tr></thead><tbody>${rows}</tbody>
  <tfoot><tr><td>Summe</td><td class="r">${num(tq)}</td><td class="r">${eur(tg)}</td><td class="r">${eur(t10)}</td><td class="r hide-m">${eur(t20)}</td><td class="r hide-m">${eur(tw)}</td><td class="r hide-m">${eur(tr)}</td></tr></tfoot></table></div></section>`;
}

/* ---------- Import ---------- */
const SAMPLE_CSV = 'Datum;Artikelnr;Artikel;Menge;Umsatz brutto\n09.11.2026;1001;Wiener Schnitzel vom Schwein;14;292,60\n09.11.2026;1002;Wiener Schnitzel vom Kalb;6;173,40\n09.11.2026;2010;Flammkuchen Elsässer;11;152,90\n09.11.2026;3005;Kaiserschmarrn;9;142,20\n09.11.2026;9001;Gutschein;1;0,00\n09.11.2026;4410;Hüttenteller Spezial;3;59,70';
function importView(){
  const res = view.rpImport;
  const log = (S.salesImports||[]).slice(0,8);
  return `<div class="grid2"><div class="col">
    <section class="panel"><div class="panel-h"><h2>Artikelumsätze aus der Kasse laden</h2></div>
      <p class="hint" style="margin-top:0">Exportieren Sie im Kassen-Backoffice den Bericht <b>Artikelumsatz</b> (auch: Artikelstatistik, Verkaufsbericht pro Artikel) für einen Zeitraum, als CSV oder Excel. Die App erkennt die Spalten Datum, Artikelnummer, Artikel, Menge und Umsatz selbst.</p>
      <div class="row-btns"><button type="button" class="btn primary" data-act="rpFile">${ico('plus')}Datei wählen (CSV, Excel)</button><button type="button" class="btn" data-act="rpSample">Beispiel einfügen</button><input id="rpFileIn" type="file" accept=".csv,.txt,.tsv,.xlsx,.xls,text/csv" hidden></div>
      <label class="f" style="margin-top:12px">oder Inhalt einfügen<textarea id="rpPaste" class="code" rows="6" placeholder="Datum;Artikelnr;Artikel;Menge;Umsatz">${esc(view.rpPasteText||'')}</textarea></label>
      <div class="row-btns" style="margin-top:8px"><button type="button" class="btn" data-act="rpAnalyse">Prüfen</button></div>
      <p class="hint" id="rpErr" role="alert">${esc(view.rpErr||'')}</p>
    </section>
    ${res ? `<section class="panel accent"><div class="panel-h"><h2>Vorschau</h2><span class="muted sm">${res.lines.length} Zeilen</span></div>
      <div class="kv"><span>Zeitraum</span><span>${res.range}</span><span>Tage</span><span>${res.days}</span><span>Portionen</span><span>${num(res.q)}</span><span>Umsatz brutto</span><span>${eur(res.g)}</span><span>Zugeordnet</span><span>${num(res.mappedPct,0)} % des Umsatzes</span><span>Nicht zugeordnet</span><span>${res.unknown.length} Kassenartikel</span>${res.skipped?`<span>Übersprungen</span><span>${res.skipped} Zeilen (ohne Datum oder Menge)</span>`:''}</div>
      ${res.unknown.length ? `<p class="hint">Nicht zugeordnete Artikel werden gemerkt und können danach unter „Zuordnung“ einem Gericht zugewiesen werden, auch rückwirkend.</p>` : ''}
      <div class="togs" style="margin-top:10px;flex-direction:column;align-items:flex-start"><label class="tog"><input type="checkbox" id="rpReplace" checked><span></span>Vorhandene Tage im Zeitraum ersetzen (kein Doppelzählen)</label><label class="tog"><input type="checkbox" id="rpStock"><span></span>Zutaten laut Rezeptur vom Lager abbuchen</label></div>
      <div class="row-btns" style="margin-top:12px"><button type="button" class="btn primary" data-act="rpImport">Importieren</button><button type="button" class="btn" data-act="rpDiscard">Verwerfen</button></div>
    </section>` : ''}
  </div><div class="col">
    <section class="panel"><div class="panel-h"><h2>Kassen und ihre Exporte</h2></div>
      <ul class="rp-pos">
        <li><b>ready2order</b><span>Backoffice → Berichte → Artikel → Export CSV. Später auch automatisch über die Schnittstelle (API-Freigabe im Admin).</span></li>
        <li><b>orderbird</b><span>MY orderbird → Berichte → Artikelbericht → CSV per E-Mail.</span></li>
        <li><b>Vectron</b><span>myVectron → Auswertungen → Artikel → Export. Automatik mit dem Modul „BI-Schnittstelle“.</span></li>
        <li><b>SumUp / Lightspeed</b><span>Backoffice → Verkäufe nach Artikel → Export. Beide haben eine Schnittstelle für die Automatik.</span></li>
        <li><b>Andere Kassen</b><span>Beim Kassenhändler nach „Artikelumsatz als CSV“ fragen.</span></li>
      </ul>
      <p class="hint">Der gesetzliche RKSV-Export (DEP7) enthält nur Belegsummen je Steuersatz, keine einzelnen Gerichte. Für die Auswertung braucht es den Artikelbericht.</p></section>
    <section class="panel"><div class="panel-h"><h2>Importprotokoll</h2></div>
      ${log.length ? `<ul class="todo">${log.map(l=>`<li><div class="inv-h"><span><b>${fmtDate(l.date)}</b><small class="muted">${esc(l.by||'')}${l.stock?' · Lager abgebucht':''}</small></span><span class="r"><b class="mono">${plural(l.days,'Tag','Tage')}</b><small class="mono">${plural(l.portions,'Portion','Portionen')}</small></span></div></li>`).join('')}</ul>` : '<p class="hint">Noch kein Import.</p>'}
      ${S.salesDemo ? `<div class="row-btns" style="margin-top:12px"><button type="button" class="btn danger sm" data-act="rpDemoDel">Demodaten löschen</button></div>` : ''}
    </section>
  </div></div>`;
}
function mapView(){
  const un = Object.entries(S.salesUnmapped||{}).sort((a,b)=>b[1].g-a[1].g);
  const maps = Object.entries(S.posMap||{});
  const opts = sel => `<option value="">— wählen —</option><option value="-" ${sel==='-'?'selected':''}>Ignorieren (Gutschein, Pfand, Trinkgeld …)</option>${menuSorted().map(m=>`<option value="${m.id}" ${sel===m.id?'selected':''}>${esc(dishLabel(m))} — ${esc(m.section)}</option>`).join('')}`;
  return `<section class="panel flush"><div class="panel-h pad"><h2>Nicht zugeordnete Kassenartikel</h2><span class="muted sm">${un.length}</span></div>
    ${un.length ? `<div class="lt-wrap flat"><table class="lt"><thead><tr><th>Kassenartikel</th><th class="r">Menge</th><th class="r">Umsatz</th><th class="hide-m">Zuletzt</th><th>Gericht in der App</th></tr></thead><tbody>
    ${un.map(([k,u]) => { const sug = autoMatch(u.name); const last = Object.keys(u.days||{}).sort().pop(); return `<tr><td><b>${esc(u.name)}</b>${u.art?`<small class="lt-muted"> · Nr. ${esc(u.art)}</small>`:''}</td><td class="r">${num(u.q)}</td><td class="r">${eur(u.g)}</td><td class="hide-m lt-muted">${last?fmtDate(last+'T12:00:00'):''}</td><td><select class="sm-sel" data-pmap="${esc(k)}" aria-label="Gericht für ${esc(u.name)}">${opts(sug ? sug.id : '')}</select>${sug?` <button type="button" class="btn sm" data-act="pmapOk" data-id="${esc(k)}:${sug.id}">Vorschlag übernehmen</button>`:''}</td></tr>`; }).join('')}
    </tbody></table></div>` : '<p class="hint pad-x pad-b">Alle Kassenartikel sind zugeordnet.</p>'}
  </section>
  <section class="panel flush" style="margin-top:18px"><div class="panel-h pad"><h2>Gespeicherte Zuordnungen</h2><span class="muted sm">${maps.length}</span></div>
    ${maps.length ? `<div class="lt-wrap flat"><table class="lt"><thead><tr><th>Kassenartikel</th><th>Gericht</th><th></th></tr></thead><tbody>${maps.map(([k,mid]) => { const m = S.menu.find(x=>x.id===mid); return `<tr><td>${esc(k.replace(/^[an]:/,''))}</td><td>${mid==='-'?'<span class="lt-muted">ignoriert</span>':esc(m?dishLabel(m):'gelöscht')}</td><td class="r"><button type="button" class="icon-btn" data-act="pmapDel" data-id="${esc(k)}" aria-label="Zuordnung lösen">${ico('x')}</button></td></tr>`; }).join('')}</tbody></table></div>` : '<p class="hint pad-x pad-b">Zuordnungen entstehen beim Import automatisch (gleicher Name) oder hier von Hand. Sie gelten für alle künftigen Importe.</p>'}
  </section>`;
}
function analyseText(text){
  const a = importAnalyse(text); const dates = a.lines.map(l=>l.date).sort();
  let g = 0, gm = 0, q = 0; a.lines.forEach(l => { g += l.g; q += l.q; if(l.mid || S.posMap[l.key]) gm += l.g; });
  return {...a, text, days:new Set(dates).size, range: dates.length ? `${fmtDate(dates[0]+'T12:00:00')} – ${fmtDate(dates[dates.length-1]+'T12:00:00')}` : '—', g, q, mappedPct: g ? gm/g*100 : 0};
}
function doImport(res, replace, stock){
  // automatische Treffer merken
  res.lines.forEach(l => { if(l.mid && S.posMap[l.key] === undefined) S.posMap[l.key] = l.mid; });
  if(replace){ const ds = new Set(res.lines.map(l=>l.date)); ds.forEach(d => { delete S.salesDays[d]; Object.values(S.salesUnmapped||{}).forEach(u => { if(u.days) delete u.days[d]; }); });
    // Summen der nicht zugeordneten Artikel aus den verbliebenen Tagen neu rechnen (sonst zählt ein zweiter Import doppelt)
    Object.entries(S.salesUnmapped||{}).forEach(([k,u]) => { const ds = Object.values(u.days||{}); u.q = ds.reduce((a,v)=>a+v[0],0); u.g = Math.round(ds.reduce((a,v)=>a+v[1],0)*100)/100; if(!ds.length) delete S.salesUnmapped[k]; }); }
  const out = importApply(res, {replace:false, stock});
  S.salesUnmapped = S.salesUnmapped || {};
  res.lines.forEach(l => { if(S.posMap[l.key]) return; const u = S.salesUnmapped[l.key] = S.salesUnmapped[l.key] || {name:l.name, art:l.art, q:0, g:0, days:{}}; u.q += l.q; u.g += l.g; const dd = u.days[l.date] = u.days[l.date] || [0,0]; dd[0] += l.q; dd[1] += l.g; });
  return out;
}
function applyMapping(key, mid){
  S.posMap[key] = mid; const u = (S.salesUnmapped||{})[key]; if(!u) return;
  if(mid && mid !== '-') for(const [d,[q,g]] of Object.entries(u.days||{})){ const rows = S.salesDays[d] = S.salesDays[d] || []; const r = rows.find(x=>x[0]===mid); if(r){ r[1] += q; r[2] = Math.round((r[2]+g)*100)/100; } else rows.push([mid, q, Math.round(g*100)/100]); }
  delete S.salesUnmapped[key];
}
async function readFileAsCsv(file){
  if(/\.xlsx?$/i.test(file.name)){
    if(!window.XLSX) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = res; s.onerror = () => rej(new Error('Excel-Leser konnte nicht geladen werden. Bitte die Datei als CSV speichern.')); document.head.appendChild(s); });
    const wb = XLSX.read(await file.arrayBuffer(), {type:'array'}); return XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]], {FS:';'});
  }
  return await file.text();
}
function rpCsvText(){
  const r = rpRange(view.rp); const to = r.to > isoDate(new Date()) ? isoDate(new Date()) : r.to; const cur = report(r.from, to);
  const f2 = n => n == null ? '' : (Math.round(n*100)/100).toFixed(2).replace('.', ',');
  const lines = ['Gericht;Kategorie;Menge;Umsatz brutto;Umsatz netto;Ø Preis;WE gesamt;WE %;Rohertrag'];
  cur.rows.sort((a,b)=>secList().indexOf(a.section)-secList().indexOf(b.section) || b.g-a.g).forEach(x => lines.push([x.name, x.section, String(x.q).replace('.',','), f2(x.g), f2(x.n), f2(x.avg), f2(x.we), x.fc!=null?f2(x.fc):'', f2(x.rg)].map(v => /[;"\n]/.test(v) ? `"${v.replace(/"/g,'""')}"` : v).join(';')));
  lines.push(['Summe','',String(cur.qty).replace('.',','), f2(cur.gross), f2(cur.net), '', f2(cur.we), cur.fc!=null?f2(cur.fc):'', f2(cur.rg)].join(';'));
  return {text:'﻿'+lines.join('\r\n'), name:`DAHUAM202_Auswertung_${r.from}_${to}.csv`};
}

/* ---------- Ereignisse ---------- */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const id = el.dataset.id; const rp = view.rp;
  switch(el.dataset.act){
    case 'rpTab': rp.tab = id; if(view.tab !== 'report') go('report'); else render(); break;
    case 'rpUnit': rp.unit = id; rp.jumped = false; if(id==='custom' && !rp.from){ const r = rpRange({...rp, unit:'month'}); rp.from = r.from; rp.to = r.to; } render(); break;
    case 'rpStep': rpStep(+id); rp.auto = true; rp.jumped = false; render(); break;
    case 'rpToday': rp.ref = isoDate(new Date()); rp.auto = true; rp.jumped = false; render(); break;
    case 'rpCmp': rp.cmp = id; render(); break;
    case 'rpChip': rp.chip = id; render(); break;
    case 'rpSort': if(RSORT.col === id && !RSORT.def){ if(!RSORT.flip){ RSORT.dir *= -1; RSORT.flip = 1; } else Object.assign(RSORT, {col:'gross', dir:-1, flip:0, def:1}); } else Object.assign(RSORT, {col:id, dir: id==='name' ? 1 : -1, flip:0, def:0}); render(); break;
    case 'rpFile': $('#rpFileIn').click(); break;
    case 'rpSample': view.rpPasteText = SAMPLE_CSV; view.rpErr = ''; render(); break;
    case 'rpAnalyse': { const t = $('#rpPaste').value; view.rpPasteText = t; try { view.rpImport = analyseText(t); view.rpErr = ''; } catch(x){ view.rpImport = null; view.rpErr = x.message; } render(); break; }
    case 'rpDiscard': view.rpImport = null; render(); break;
    case 'rpImport': { const res = view.rpImport; if(!res) break; const replace = $('#rpReplace').checked, stock = $('#rpStock').checked;
      const run = (delDemo) => { let nDemo = 0; if(delDemo) nDemo = clearDemoSales(); const out = doImport(res, replace, stock); view.rpImport = null; view.rpPasteText = ''; save(); rp.tab = Object.keys(S.salesUnmapped).length ? 'map' : 'sales'; const ds = res.lines.map(l=>l.date).sort(); if(ds.length){ rp.unit = 'custom'; rp.from = ds[0]; rp.to = ds[ds.length-1]; rp.auto = true; rp.jumped = false; } run.msg = `${plural(out.days,'Tag','Tage')}, ${plural(Math.round(out.portions),'Portion','Portionen')} importiert` + (nDemo ? ` · ${plural(nDemo,'Demo-Tag','Demo-Tage')} entfernt` : ''); };
      const days = [...new Set(res.lines.map(l=>l.date))]; const nDemo = S.salesDemo ? demoSalesDays().length : 0; const over = replace ? days.filter(d => (S.salesReal||{})[d] && S.salesDays[d]).length : 0;
      let short = 0; if(stock){ const acc = new Map(); res.lines.forEach(l => { const mid = S.posMap[l.key] !== undefined ? S.posMap[l.key] : l.mid; const m = mid && mid !== '-' && S.menu.find(x=>x.id===mid); const c = m && m.card && C(m.card); if(c) explode(c, l.q, acc); }); acc.forEach((q,pid) => { const p = P(pid); if(p && q > (+p.stock||0) + 1e-9) short++; }); }
      if(!nDemo && !over && !short){ run(false); render(); toast(run.msg); break; }
      openDialog('Kassendaten importieren?', `<p class="dlg-p">Der Import enthält ${plural(days.length,'Verkaufstag','Verkaufstage')}.${over ? ` <b>${plural(over,'bereits gespeicherter Tag wird','bereits gespeicherte Tage werden')} ersetzt.</b>` : ''}</p>
        ${short ? `<div class="warn-box dlg-warn" role="alert">${ico('spark')}<span><b>Bestand reicht nicht für ${plural(short,'Artikel','Artikel')}.</b> Beim Abbuchen gehen diese Bestände ins Minus. Fehlt ein Wareneingang?</span></div>` : ''}
        ${nDemo ? demoSalesAskHtml() : ''}`,
        fd => { run(nDemo > 0 && fd.get('demoSales') === 'del'); }, {ok: short ? 'Trotzdem buchen' : 'Importieren', done:()=>run.msg}); break; }
    case 'rpDemoDel': { const n = demoSalesDays().length; ask(`${plural(n,'Tag','Tage')} mit Demo-Verkäufen löschen? Echte Importe und Buchungen bleiben erhalten.`, () => { clearDemoSales(); }, 'Löschen'); break; }
    case 'pmapOk': { const [k, mid] = id.split(/:(?=[^:]+$)/); applyMapping(k, mid); save(); render(); toast('Zugeordnet, auch rückwirkend'); break; }
    case 'pmapDel': delete S.posMap[id]; save(); render(); break;
    case 'rpCsv': { const {text, name} = rpCsvText(); if(!FRAMED){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})); a.download = name; a.click(); toast(name+' gespeichert'); } else openDialog('Tabelle (CSV)', `<p class="dlg-p">Text kopieren und als <b>${esc(name)}</b> speichern; Excel öffnet die Datei direkt.</p><textarea class="code" readonly id="rpCsvTxt">${esc(text)}</textarea><div class="row-btns"><button type="button" class="btn" id="rpCsvCopy">${ico('copy')}Kopieren</button></div>`, null, {cancel:'Schließen', after:()=>{ $('#rpCsvCopy').onclick = () => navigator.clipboard?.writeText(text).then(()=>toast('Kopiert'), ()=>$('#rpCsvTxt').select()); }}); break; }
    case 'rpPrint': { const r = rpRange(rp); $('#print').innerHTML = `<div class="rp-print"><div class="meta"><span>${esc(S.settings.name)}</span><span>Erstellt ${fmtDate(new Date().toISOString())}</span></div><h1>Auswertung · ${esc(r.label)}</h1>${$('#app').innerHTML.replace(/<section class="panel rp-period">[\s\S]*?<\/section>/,'')}</div>`; document.body.classList.remove('print-menu'); document.body.classList.add('print-report'); window.print(); setTimeout(()=>document.body.classList.remove('print-report'), 500); break; }
  }
});
document.addEventListener('change', async e => {
  const t = e.target;
  if(t.dataset.rpd){ view.rp[t.dataset.rpd] = t.value; render(); }
  if(t.dataset.rpg){ view.rp.grouped = t.checked; render(); }
  if(t.dataset.pmap){ if(t.value){ applyMapping(t.dataset.pmap, t.value); save(); render(); toast(t.value==='-' ? 'Wird künftig ignoriert' : 'Zugeordnet, auch rückwirkend'); } }
  if(t.id === 'rpFileIn' && t.files[0]){ try { const txt = await readFileAsCsv(t.files[0]); view.rpPasteText = txt.length > 200000 ? txt.slice(0,200000) : txt; view.rpImport = analyseText(txt); view.rpErr = ''; } catch(x){ view.rpImport = null; view.rpErr = x.message || 'Datei nicht lesbar.'; } t.value = ''; render(); }
});

/* =====================================================================
   Gästekarte im Stil der Website (dahuam202.at), nur logischer:
   Rahmen mit eingesetztem Titel, Reiter, zwei Spalten, punktierte Trennlinien,
   PT Sans / Saira Condensed wie auf der Website.
   ===================================================================== */
const WK_GROUPS = [
  ['flamm','Flammkuchen',['Flammkuchen']],
  ['start','Vorspeisen & Salate',['Suppen & Vorspeisen','Salate & Bowls']],
  ['teilen','Fondue & zum Teilen',['Zum Teilen']],
  ['haupt','Hauptspeisen',['Klassiker','Rösti','Burger, Pasta & Co.']],
  ['dessert','Desserts',['Süßes']],
  ['kinder','Kinderkarte',['Für Kinder']],
];
const WK_FILTERS = [['v','Vegetarisch'],['vg','Vegan'],['noA','Ohne Gluten'],['noG','Ohne Milch']];
const WK_QUOTE = '„DAHUAM202 ist da, wo man den Bauch nicht einziehen muss!“';
view.wk = {tab:'all', filters:[]};
function wkGroupsFor(items){
  const known = new Set(WK_GROUPS.flatMap(g=>g[2]));
  const extra = secList().filter(s => !known.has(s) && items.some(m=>m.section===s));
  const gs = WK_GROUPS.map(g => [...g]); if(extra.length) gs.splice(4, 0, ['mehr','Weitere',extra]);
  return gs.filter(g => g[2].some(s => items.some(m=>m.section===s)));
}
function wkPass(m){
  const f = view.wk.filters; if(!f.length) return true;
  const alg = itemAlg(m), known = hasAlg(m);
  if(f.includes('vg') && m.veg !== 'vg') return false;
  if(f.includes('v') && !(m.veg === 'v' || m.veg === 'vg')) return false;
  if(f.includes('noA') && (!known || alg.includes('A'))) return false;
  if(f.includes('noG') && (!known || alg.includes('G'))) return false;
  return true;
}
function wkPrice(p){ return '€ ' + fin(+p).toLocaleString('de-AT',{minimumFractionDigits:2, maximumFractionDigits:2}); }
function wkDish(e, used){
  const m = e.head, vars = e.vars, multi = vars.length > 1 || (m.group && m.vlabel);
  const alg = [...new Set(vars.flatMap(v=>itemAlg(v)))].sort(); alg.forEach(a=>used.add(a));
  const veg = vars.every(v=>v.veg==='vg') ? 'vg' : vars.every(v=>v.veg==='v'||v.veg==='vg') ? 'v' : '';
  const desc = [m.desc, hkDays(m)].filter(Boolean).join(' · ');
  return `<article class="wk-dish ${vars.some(v=>v.top)?'sig':''}">
    <div class="wk-l1"><h4 class="wk-n">${esc(m.name)}${veg?`<i class="wk-veg" title="${veg==='vg'?'vegan':'vegetarisch'}">${veg==='vg'?'VG':'V'}</i>`:''}</h4>${multi?'':`<span class="wk-p">${+m.price?wkPrice(m.price):''}</span>`}</div>
    ${desc ? `<p class="wk-d">${esc(desc)}</p>` : ''}
    ${multi ? `<div class="wk-vars">${vars.map(v=>`<div class="wk-var"><span>${esc(v.vlabel||v.name)}</span><span class="wk-p">${wkPrice(v.price)}</span></div>`).join('')}</div>` : ''}
    ${alg.length ? `<div class="wk-a" title="${esc(alg.map(a=>ALG[a]).join(', '))}">Allergene ${alg.join(' ')}</div>` : ''}
    ${vars.some(v=>v.top) ? '<div class="wk-sig">Empfehlung des Hauses</div>' : ''}
  </article>`;
}
function wkSpecial(sp, used){
  const d1 = dParse(sp.from), d2 = dParse(sp.to||sp.from);
  const f = d => d.toLocaleDateString('de-AT',{weekday:'long', day:'numeric', month:'long'});
  const items = sp.items.map(it => ({...it, id:'', top:false, group:'', days:[]}));
  return `<section class="wk-special"><div class="wk-sp-h"><span class="wk-sp-k">Nur für kurze Zeit</span><h3>${esc(sp.name)}</h3><span class="wk-sp-date">${sp.to && sp.to!==sp.from ? `${f(d1)} bis ${f(d2)}` : f(d1)}</span>${sp.note?`<p>${esc(sp.note)}</p>`:''}</div>
    <div class="wk-cols">${hkEntries(items).map(e=>wkDish(e, used)).join('')}</div></section>`;
}
function guestHtmlWeb(seasonKey, dateStr, opts={}){
  dateStr = dateStr || todayStr(); const k = seasonKey || seasonFor(dateStr) || 'winter'; const s = S.settings.seasons[k];
  const all = guestItems(k, dateStr); const items = all.filter(wkPass);
  const groups = wkGroupsFor(all); const used = new Set();
  const tab = opts.print ? 'all' : (groups.some(g=>g[0]===view.wk.tab) ? view.wk.tab : 'all');
  const inserts = specialsFor(dateStr).filter(sp => sp.mode !== 'tageskarte');
  const nav = opts.print ? '' : `<nav class="wk-tabs" aria-label="Kategorien">${[['all','Alles'], ...groups.map(g=>[g[0],g[1]])].map(([gk,gl])=>`<button type="button" class="${tab===gk?'on':''}" data-act="wkTab" data-id="${gk}">${esc(gl)}</button>`).join('')}</nav>
    <div class="wk-filters">${WK_FILTERS.map(([fk,fl])=>`<button type="button" class="${view.wk.filters.includes(fk)?'on':''}" data-act="wkFilter" data-id="${fk}" aria-pressed="${view.wk.filters.includes(fk)}">${fl}</button>`).join('')}${view.wk.filters.length?`<span class="wk-fcount">${items.length} von ${all.length} Gerichten</span>`:''}</div>`;
  let body = (tab === 'all' || opts.print) ? inserts.map(sp => wkSpecial(sp, used)).join('') : '';
  for(const [gk, gl, secs] of groups){
    if(tab !== 'all' && tab !== gk) continue;
    const parts = secs.map(sec => { const list = items.filter(m=>m.section===sec); return list.length ? `<section class="wk-sec">${secs.length > 1 || tab === 'all' ? `<h3 class="wk-h">${esc(sec === 'Zum Teilen' && gk==='teilen' ? 'Fondue & zum Teilen' : sec)}</h3>` : ''}<div class="wk-cols">${hkEntries(list).map(e=>wkDish(e, used)).join('')}</div></section>` : ''; }).join('');
    if(parts) body += parts;
  }
  if(!body) body = '<p class="wk-empty">Keine Gerichte für diese Auswahl.</p>';
  const legend = used.size ? `<div class="wk-leg">${[...used].sort().map(a=>`<span><b>${a}</b> ${esc(ALG[a])}</span>`).join('')}</div>` : '';
  const cover = s.cover && IMG[s.cover] ? `<figure class="wk-cover"><img src="${IMG[s.cover]}" alt=""></figure>` : '';
  return `<div class="wk-paper" style="--wk-a:${esc(s.accent || HK_ACCENT[k])}">${cover}
    <div class="wk-frame">
      <h2 class="wk-title"><span>Speisen &amp; Getränke</span></h2>
      <p class="wk-season">${esc(s.title)} ${seasonYear(k, dateStr)} · ${esc(s.subtitle || HK_PLACE)}</p>
      <p class="wk-quote">${WK_QUOTE}</p>
      ${nav}
      <div class="wk-body">${body}</div>
      <footer class="wk-foot"><div class="wk-keys"><span><i class="wk-veg">V</i> vegetarisch</span><span><i class="wk-veg">VG</i> vegan</span><span><i class="wk-sigk"></i> Empfehlung des Hauses</span></div>${legend}<p>${esc(s.footer || 'Alle Preise in Euro inkl. MwSt.')} · Stand ${fmtDate(new Date().toISOString())}</p></footer>
    </div></div>`;
}
const _guestHtmlBook = guestHtml;
guestHtml = function(k, d, opts){ return (S.settings.guestStyle || 'web') === 'web' ? guestHtmlWeb(k, d, opts) : _guestHtmlBook(k, d); };
const _printMenu = printMenu;
printMenu = function(){ if((S.settings.guestStyle||'web') !== 'web') return _printMenu(); const k = curSeasonKey(); $('#print').innerHTML = guestHtmlWeb(k, view.gdate || todayStr(), {print:true}); document.body.classList.add('print-menu'); window.print(); };
const _renderGuest = renderGuest;
renderGuest = function(){
  const html = _renderGuest();
  const st = S.settings.guestStyle || 'web';
  return html.replace('<div class="panel-h"><h2>Saison</h2>', `<div class="panel-h"><h2>Gestaltung</h2></div>${seg('gStyle', st, [['web','Wie die Website'],['book','Buchsatz']])}<p class="hint">„Wie die Website“ nutzt Rahmen, Reiter und Schriften von dahuam202.at.</p></section><section class="panel"><div class="panel-h"><h2>Saison</h2>`);
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const id = el.dataset.id;
  if(el.dataset.act === 'wkTab'){ view.wk.tab = id; refreshGuest(); }
  if(el.dataset.act === 'wkFilter'){ const f = view.wk.filters; const i = f.indexOf(id); if(i >= 0) f.splice(i,1); else { f.push(id); if(id==='vg'){ const j = f.indexOf('v'); if(j>=0) f.splice(j,1); } if(id==='v'){ const j = f.indexOf('vg'); if(j>=0) f.splice(j,1); } } refreshGuest(); }
  if(el.dataset.act === 'gStyle'){ S.settings.guestStyle = id; save(); render(); }
});

/* =====================================================================
   Echte Einkaufspreise: Richtwerte markieren, Preisliste importieren
   ===================================================================== */
function pricesMigrate(d){ (d.products||[]).forEach(p => { if(p.priceDemo === undefined) p.priceDemo = !!d.demo; }); return d; }
function markPrice(p, src){ p.priceDemo = false; p.priceDate = todayStr(); p.priceSrc = src; }
function demoPriceLines(c, d=0, acc=new Set()){ if(!c || d > 6) return acc; c.items.forEach(it => { const r = refObj(it.ref); if(!r) return; if(r.t === 'p'){ if(r.o.priceDemo && !r.o.noStock && +r.o.price) acc.add(r.o.id); } else demoPriceLines(r.o, d+1, acc); }); return acc; }

renderProducts = function(){
  const q = view.pq.trim().toLowerCase(); const f = view.pf || 'all';
  const all = S.products.filter(p => !p.noStock);
  const nDemo = all.filter(p=>p.priceDemo).length;
  const list = all.filter(p => (!q || (p.name+' '+supName(p)+' '+(p.artNo||'')).toLowerCase().includes(q)) && (f==='all' || (f==='demo' ? p.priceDemo : !p.priceDemo))).sort(byName);
  const chip = (k,l,n) => `<button type="button" class="chip ${f===k?'on':''}" data-act="pFilter" data-id="${k}">${l}<small>${n}</small></button>`;
  return `<div class="page-h"><div><div class="eyebrow">${all.length} Produkte · Preise je Einheit exkl. MwSt.</div><h1>Produkte</h1></div>
    <div class="row-btns"><button type="button" class="btn" data-act="plImport">${ico('copy')}Preisliste importieren</button><button type="button" class="btn primary" data-act="newProd">${ico('plus')}Produkt</button></div></div>
  <div class="toolbar"><label class="search">${ico('search')}<input id="pq" type="search" placeholder="Produkt, Lieferant oder Artikelnummer" value="${esc(view.pq)}" autocomplete="off"></label>${seg('pFilter', f, [['all','Alle',all.length],['demo','Richtwerte',nDemo],['ok','Bestätigt',all.length-nDemo]])}<span class="sp"></span>${nDemo ? `<button type="button" class="btn sm" data-act="pConfirmAll" data-id="${f}">Angezeigte Richtwerte bestätigen</button>` : ''}</div>
  <div class="lt-wrap"><table class="lt"><thead><tr><th>Produkt</th><th class="hide-m">Lieferant</th><th class="r">Preis €</th><th>Stand</th><th class="r hide-m">Putzverlust</th><th class="r hide-m">Garverlust</th><th class="hide-m">Allergene</th><th class="r hide-m">Rezepturen</th><th></th></tr></thead><tbody>
  ${list.map(p => { const u = usage('p:'+p.id).length; return `<tr class="row" data-act="editProd" data-id="${p.id}">
    <td><div class="lt-n"><span><b>${esc(p.name)}</b><small>${p.unit==='Stk'&&p.pieceG?`je Stk · ${num(p.pieceG)} g`:`je ${esc(p.unit)}`}${p.artNo?' · Nr. '+esc(p.artNo):''}${p.pack?' · '+esc(p.pack):''}</small></span></div></td>
    <td class="hide-m lt-muted">${esc(supName(p))}</td>
    <td class="r"><input class="lt-price num-in" id="pp-${p.id}" type="text" inputmode="decimal" data-num="req price" data-pp="${p.id}" data-pf="price" value="${num2(p.price)}" aria-label="Preis ${esc(p.name)}"></td>
    <td>${p.priceDemo ? '<span class="st-ref" title="Beispielpreis, noch nicht bestätigt">Richtwert</span>' : `<span class="lt-muted sm">${p.priceDate?fmtDate(p.priceDate+'T12:00:00'):'bestätigt'}${p.priceSrc?' · '+esc(p.priceSrc):''}</span>`}</td>
    <td class="r hide-m">${num(+p.lossCold||0,1)} %</td><td class="r hide-m">${num(+p.lossHot||0,1)} %</td>
    <td class="hide-m">${chips(new Set(algList(p.alg)))}</td><td class="r hide-m">${u}</td>
    <td><div class="lt-acts">${p.priceDemo?`<button type="button" class="btn sm" data-act="pConfirm" data-id="${p.id}" title="Preis stimmt">Stimmt</button>`:''}<button type="button" class="icon-btn" data-act="editProd" data-id="${p.id}" aria-label="Bearbeiten">${ico('edit')}</button></div></td></tr>`; }).join('') || '<tr><td colspan="9" class="lt-muted">Nichts gefunden.</td></tr>'}
  </tbody></table></div>
  `;
};

/* Hinweis in der Rezeptur */
const _renderCardP = renderCard;
renderCard = function(c){
  const h = _renderCardP(c); const ids = [...demoPriceLines(c)]; if(!ids.length || typeof pcStart === 'function') return h;
  const names = ids.map(id => P(id)?.name).filter(Boolean);
  const box = `<div class="warn-box" style="margin:-6px 0 18px">${ico('spark')}<span><b>Wareneinsatz geschätzt:</b> ${names.length} ${names.length===1?'Zutat hat':'Zutaten haben'} noch einen Richtwert-Preis (${esc(names.slice(0,6).join(', '))}${names.length>6?' …':''}). Mit Ihren Einkaufspreisen wird die Zahl genau.</span><button type="button" class="btn sm" data-act="pFix" data-id="${ids.join(',')}">Preise eintragen</button></div>`;
  return h.replace('<div class="grid2">', box + '<div class="grid2">');
};
function priceFixDialog(ids){
  const ps = ids.map(P).filter(Boolean);
  openDialog('Einkaufspreise eintragen', `<p class="dlg-p">Preis je Einheit ohne MwSt., wie auf Rechnung oder Preisliste. Leer lassen, wenn unbekannt.</p>
    <div class="pfix">${ps.map(p=>`<label class="pfix-r"><span><b>${esc(p.name)}</b><small class="muted">${esc(supName(p))} · Richtwert ${eur(p.price)} je ${esc(p.unit)}</small></span><span class="qty"><input name="p_${p.id}" class="num-in" type="text" inputmode="decimal" autocomplete="off" placeholder="${num2(p.price)}"><em>€/${esc(p.unit)}</em></span></label>`).join('')}</div>`,
    fd => { let n = 0; ps.forEach(p => { const v = fd.get('p_'+p.id); if(v !== '' && v != null){ p.price = Math.max(0, +v); markPrice(p, 'manuell'); n++; } }); priceFixDialog.n = n; },
    {ok:'Übernehmen', done:()=>`${priceFixDialog.n} Preise übernommen, Wareneinsatz neu berechnet`});
}

/* Preisliste importieren */
function plMatch(name, art){
  if(art){ const p = S.products.find(x => x.artNo && String(x.artNo).trim() === String(art).trim()); if(p) return p; }
  const base = x => normName(String(x).split('(')[0]);
  const n = base(name); if(!n) return null; let best = null, bs = 0;
  for(const p of S.products){ const pn = base(p.name); if(!pn) continue; let sc = 0;
    if(pn === n || normName(p.name) === normName(name)) sc = 1;
    else { const a = n.split(' ').filter(x=>x.length>2), b = new Set(pn.split(' ').filter(x=>x.length>2)); const hit = a.filter(x=>b.has(x)).length; sc = hit / Math.max(a.length, b.size, 1);
      if(Math.min(n.length, pn.length) >= 4 && (pn.startsWith(n) || n.startsWith(pn))) sc = Math.max(sc, .75); }
    if(sc > bs){ bs = sc; best = p; } }
  return bs >= .6 ? best : null;
}
function plAnalyse(text){
  const rows = csvParse(text); if(rows.length < 2) throw new Error('Die Liste enthält keine Datenzeilen.');
  const head = rows[0].map(h=>h.trim()); const idx = re => head.findIndex(h => re.test(h));
  const ci = {name: idx(/^(artikel|bezeichnung|produkt|name|artikelbezeichnung|beschreibung)$/i), art: idx(/^(art(ikel)?\.?\s*-?\s*(nr|nummer)\.?|sku|plu|code)$/i), price: idx(/^(preis|ek|ek-preis|einkaufspreis|netto|preis netto|nettopreis|price|preis\/einheit)$/i), unit: idx(/^(einheit|me|unit|vk-einheit)$/i), pack: idx(/^(gebinde|ve|verpackung|packung|inhalt)$/i)};
  if(ci.name < 0 || ci.price < 0) throw new Error('Spalten „Artikel“ und „Preis“ nicht gefunden. Erwartet z. B. „Artikelnr; Artikel; Einheit; Preis“.');
  const lines = rows.slice(1).map(r => { const name = (r[ci.name]||'').trim(), art = ci.art>=0 ? (r[ci.art]||'').trim() : '', price = numDE(r[ci.price]); const p = plMatch(name, art); return {name, art, price, unit: ci.unit>=0 ? (r[ci.unit]||'').trim() : '', pack: ci.pack>=0 ? (r[ci.pack]||'').trim() : '', pid: p ? p.id : '', old: p ? +p.price : null}; }).filter(l => l.name && l.price > 0);
  return {lines};
}
function plDialog(){
  const sups = (S.suppliers||[]);
  openDialog('Preisliste importieren', `<p class="dlg-p">CSV oder Excel-Liste des Lieferanten (oder aus der Rechnung abgetippt) mit Spalten <b>Artikel</b>, <b>Preis</b> netto und optional Artikelnr, Einheit, Gebinde. Erkannte Produkte werden aktualisiert, die Liste prüfen Sie vorher.</p>
    <label class="f">Lieferant<select name="sup"><option value="">— beliebig —</option>${sups.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label>
    <div class="row-btns"><button type="button" class="btn sm" id="plFileBtn">Datei wählen</button><button type="button" class="btn sm" id="plSample">Beispiel</button><input id="plFile" type="file" accept=".csv,.txt,.xlsx,.xls" hidden></div>
    <textarea id="plText" class="code" rows="6" placeholder="Artikelnr;Artikel;Einheit;Preis"></textarea>
    <div class="row-btns"><button type="button" class="btn sm" id="plCheck">Prüfen</button></div>
    <div id="plOut"></div>`,
    fd => { const res = plDialog.res; if(!res) { toast('Bitte zuerst „Prüfen“'); return false; } let n = 0, add = 0; const sid = fd.get('sup');
      res.lines.forEach((l, i) => { const sel = fd.get('m_'+i); if(sel === 'skip' || sel == null) return;
        if(sel === 'new'){ const unit = /^(stk|stück|st)$/i.test(l.unit) ? 'Stk' : /^(l|liter)$/i.test(l.unit) ? 'l' : 'kg'; const p = {id:uid('p'), name:l.name, unit, price:l.price, lossCold:0, lossHot:0, alg:'', pieceG:'', stock:0, minStock:0, loc:'L', supplier:sid||'', artNo:l.art, pack:l.pack, packQty:0}; markPrice(p, 'Preisliste'); S.products.push(p); add++; return; }
        const p = P(sel); if(!p) return; p.price = l.price; if(l.art) p.artNo = l.art; if(sid && !p.supplier) p.supplier = sid; markPrice(p, 'Preisliste'); n++; });
      plDialog.msg = `${n} Preise aktualisiert${add?`, ${add} Produkte neu angelegt`:''}`; plDialog.res = null; },
    {ok:'Preise übernehmen', done:()=>plDialog.msg, after: f => {
      plDialog.res = null;
      const show = () => { const res = plDialog.res; const opts = sel => `<option value="skip">nicht übernehmen</option><option value="new">als neues Produkt</option>${[...S.products].sort(byName).map(p=>`<option value="${p.id}" ${sel===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}`;
        $('#plOut').innerHTML = `<p class="hint">${res.lines.filter(l=>l.pid).length} von ${res.lines.length} Artikeln erkannt.</p><ul class="pl-list">${res.lines.map((l,i)=>`<li><span><b>${esc(l.name)}</b><small class="muted">${l.art?'Nr. '+esc(l.art)+' · ':''}${esc(l.unit||'')} ${l.old!=null?`· bisher ${eur(l.old)}`:''}</small></span><b class="mono">${eur(l.price)}</b><select name="m_${i}" class="sm-sel">${opts(l.pid || 'skip')}</select></li>`).join('')}</ul>`; };
      const run = () => { try { plDialog.res = plAnalyse($('#plText').value); show(); } catch(x){ $('#plOut').innerHTML = `<p class="hint bad-t">${esc(x.message)}</p>`; } };
      $('#plCheck').onclick = run;
      $('#plSample').onclick = () => { const ex = [['romaine',3.95],['parmesan',19.8],['quail',0.29],['capers',12.4],['bread',3.1]].map(([id,pr]) => { const p = P(id); return p ? `${p.artNo||''};${p.name};${p.unit};${String(pr).replace('.',',')}` : ''; }).filter(Boolean); $('#plText').value = ['Artikelnr;Artikel;Einheit;Preis', ...ex, 'NEU-901;Sardellenfilets;kg;24,00'].join('\n'); run(); };
      $('#plFileBtn').onclick = () => $('#plFile').click();
      $('#plFile').onchange = async e => { const file = e.target.files[0]; if(!file) return; try { $('#plText').value = await readFileAsCsv(file); run(); } catch(x){ $('#plOut').innerHTML = `<p class="hint bad-t">${esc(x.message)}</p>`; } };
    }});
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const id = el.dataset.id;
  if(el.dataset.act === 'pFilter'){ view.pf = id; if(view.tab !== 'products') go('products'); else render(); }
  if(el.dataset.act === 'pConfirm'){ const p = P(id); markPrice(p, 'bestätigt'); save(); render(); toast(`${p.name}: ${eur(p.price)} bestätigt`); }
  if(el.dataset.act === 'pConfirmAll'){ const q = view.pq.trim().toLowerCase(); const list = S.products.filter(p => !p.noStock && p.priceDemo && (!q || (p.name+' '+supName(p)+' '+(p.artNo||'')).toLowerCase().includes(q))); if(!list.length) return; ask(`${list.length} Richtwerte als bestätigte Einkaufspreise übernehmen? Besser: nur Preise bestätigen, die Sie geprüft haben.`, () => { list.forEach(p => markPrice(p, 'bestätigt')); }, 'Bestätigen'); }
  if(el.dataset.act === 'pFix') priceFixDialog(id.split(','));
  if(el.dataset.act === 'plImport') plDialog();
});
document.addEventListener('change', e => { const t = e.target; if(t.dataset && t.dataset.pp && t.dataset.pf === 'price'){ const p = P(t.dataset.pp); if(p && +t.value !== +p.price) markPrice(p, 'manuell'); } }, true);

/* =====================================================================
   Werkstatt: Aufbau-Reise, Preis-Check, Teller (Rezeptur bauen),
   „Wozu?“-Hinweise, Belohnungen. Original, kein Spiel-Klon.
   ===================================================================== */
ICO.aufbau = '<circle cx="5" cy="19" r="2"/><path d="M7 19h6a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h6"/><circle cx="19" cy="3" r="2"/>';
ICO.check = '<path d="M5 12.5l4.5 4.5L19 7.5"/>';
ICO.tag = '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>';
ICO.pot = '<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 10h20M8.5 10V7.5M15.5 10V7.5M7 4.5h10"/>';
ICO.plate = '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5.5"/>';
ICO.coins = '<ellipse cx="10" cy="7" rx="7" ry="3"/><path d="M3 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M3 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>';
ICO.help = '<circle cx="12" cy="12" r="9.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>';
ICO.sparkle = '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>';

/* ---------- Navigation ---------- */
TABS.unshift(['aufbau','Aufbau','Aufbau']);
TABS.push(['pcheck','Preis-Check','Preise']);
NAV_GROUPS.length = 0;
NAV_GROUPS.push(['Start',['aufbau','dash']], ['Küche',['menu','cards']], ['Bestand',['stock','buy','products']], ['Zahlen',['report']], ['',['setup']]);
navHtml = function(short){
  const item = k => { const t = TABS.find(x=>x[0]===k); return `<button type="button" class="nav-i" data-tab="${k}">${ico(k)}<span>${short?t[2]:t[1]}</span></button>`; };
  if(short) return ['aufbau','dash','menu','cards','stock','buy','setup'].map(item).join('');
  return NAV_GROUPS.map(([g,ks]) => (g?`<div class="nav-group">${g}</div>`:'<div class="nav-group" aria-hidden="true"></div>') + ks.map(item).join('')).join('');
};
view.tab = 'aufbau'; view.pc = null;

/* ---------- Daten: Spielstand ---------- */
function gameMigrate(d){
  if(!d.game || typeof d.game !== 'object') d.game = {done:{}, started:todayStr()};
  if(!d.game.done) d.game.done = {};
  return d;
}
function gameSilentDone(){ // schon fertige Stationen beim ersten Start still abhaken (keine Feier für Demodaten)
  if(S.game.init) return; S.game.init = true;
  stations().forEach(st => { if(st.pct >= 100) S.game.done[st.k] = S.game.done[st.k] || todayStr(); });
  save();
}

/* ---------- Stationen: Fortschritt aus echten Daten ---------- */
const LEVELS = [[0,'Grundstein'],[20,'Rohbau'],[45,'Einrichtung'],[70,'Probelauf'],[100,'Vollbetrieb']];
function firstMenuWithoutCard(){ return menuSorted().find(m => !m.hidden && !(m.card && C(m.card))) || menuSorted().find(m => !(m.card && C(m.card))); }
function stations(){
  const prods = S.products.filter(p=>!p.noStock);
  const confirmed = prods.filter(p=>!p.priceDemo).length;
  const sups = (S.suppliers||[]).filter(s=>s.active);
  const supOk = sups.filter(s => (s.email||s.whatsapp||s.phone||s.shopUrl) && s.orderDays.length && s.deliveryDays.length).length;
  const semis = S.cards.filter(c=>c.type==='semi');
  const semiOk = semis.filter(c => c.items.length && c.items.every(i=>refObj(i.ref) && +i.qty>0) && (+c.yieldG>0 || totals(c).out>0)).length;
  const withCard = S.menu.filter(m=>m.card && C(m.card)).length;
  const withAlg = S.menu.filter(hasAlg).length;
  const realDays = Object.keys(S.salesDays||{}).filter(d => (S.salesReal||{})[d]).length;
  const nextDish = firstMenuWithoutCard();
  const noAlg = S.menu.find(m=>!hasAlg(m));
  const pct = (a,b) => b ? Math.min(100, Math.round(a/b*100)) : 0;
  const list = [
    {k:'sup', no:1, name:'Lieferanten', ico:'truck', done:supOk, total:sups.length, pct: sups.length ? pct(supOk, sups.length) : 0,
      metric: sups.length ? `${supOk} von ${sups.length} Lieferanten mit Kontakt, Bestell- und Liefertagen` : 'Noch kein Lieferant angelegt',
      wozu:'Wer liefert was, an welchen Tagen? Dann weiß die App, wann bestellt werden muss.',
      act: supOk < sups.length || !sups.length ? {l: sups.length ? 'Lieferanten vervollständigen' : 'Ersten Lieferanten anlegen', a:'goBuyTab', id:'lieferanten'} : {l:'Lieferanten ansehen', a:'goBuyTab', id:'lieferanten'}},
    {k:'prices', no:2, name:'Produkte & Preise', ico:'tag', done:confirmed, total:prods.length, pct:pct(confirmed, prods.length),
      metric: `${confirmed} von ${prods.length} Preisen bestätigt`,
      wozu:'Jede Zutat braucht Ihren echten Einkaufspreis. Erst dann stimmt der Wareneinsatz.',
      act: confirmed < prods.length ? {l:`Preis-Check starten · ${prods.length-confirmed} offen`, a:'pcStart', id:''} : {l:'Produkte ansehen', a:'goTab', id:'products'}},
    {k:'semi', no:3, name:'Basisrezepte', ico:'pot', done:semiOk, total:semis.length, pct: semis.length ? pct(semiOk, semis.length) : 0,
      metric: semis.length ? `${semiOk} von ${semis.length} Basisrezepten vollständig (Zutaten + Ausbeute)` : 'Noch kein Basisrezept',
      wozu:'Teig, Fond, Dressing: einmal als Charge anlegen, in vielen Gerichten verwenden.',
      act: semis.length && semiOk < semis.length ? {l:'Basisrezept vervollständigen', a:'openCard', id:(semis.find(c => !(c.items.length && c.items.every(i=>refObj(i.ref) && +i.qty>0) && (+c.yieldG>0 || totals(c).out>0)))||semis[0]).id} : {l:'Neues Basisrezept', a:'newCard', id:'semi'}},
    {k:'recipes', no:4, name:'Rezepturen', ico:'cards', done:withCard, total:S.menu.length, pct:pct(withCard, S.menu.length),
      metric: `${withCard} von ${S.menu.length} Gerichten haben eine Rezeptur`,
      wozu:'Der Bauplan jedes Gerichts. Daraus rechnet die App Wareneinsatz und Allergene.',
      act: nextDish ? {l:`Rezeptur anlegen: ${nextDish.name}`, a:'newCardFor', id:nextDish.id} : {l:'Rezepturen ansehen', a:'goTab', id:'cards'}},
    {k:'menu', no:5, name:'Speisekarte', ico:'menu', done:withAlg, total:S.menu.length, pct:pct(withAlg, S.menu.length),
      metric: `${withAlg} von ${S.menu.length} Gerichten mit Allergenangabe`,
      wozu:'Preise, Allergene, Saison: Was die Gäste sehen, in Österreich mit Allergenpflicht.',
      act: noAlg ? {l:'Allergene ergänzen', a:'goMenu', id:'noalg'} : {l:'Gästekarte ansehen', a:'goGuest', id:''}},
    {k:'sales', no:6, name:'Kasse & Auswertung', ico:'report', done:realDays ? 1 : 0, total:1, pct: realDays ? 100 : 0,
      metric: realDays ? `${realDays} echte Verkaufstage importiert` : 'Noch keine echten Kassendaten',
      wozu:'Was wurde verkauft, was hat es gebracht? Mit Kassendaten wird aus Kalkulation Wissen.',
      act: realDays ? {l:'Auswertung öffnen', a:'goTab', id:'report'} : {l:'Kasse importieren', a:'goReportTab', id:'import'}},
  ];
  return list;
}
function gameOverall(){
  const st = stations(); const pct = Math.round(st.reduce((s,x)=>s+x.pct,0)/st.length);
  let lvl = 0; LEVELS.forEach(([p],i) => { if(pct >= p) lvl = i; });
  const next = st.find(x=>x.pct < 100);
  return {pct, lvl, lvlName:LEVELS[lvl][1], nextLvl: LEVELS[lvl+1] || null, doneN: st.filter(x=>x.pct>=100).length, st, next};
}
function bigRing(pct, size, stroke, cls=''){
  const r = (size-stroke)/2, c = 2*Math.PI*r;
  return `<svg class="gring ${cls}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle class="trk" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" fill="none"/><circle class="val" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-dasharray="${(c*Math.min(100,pct)/100).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 ${size/2} ${size/2})"/></svg>`;
}

/* ---------- Ansicht: Aufbau ---------- */
function renderAufbau(){
  const o = gameOverall();
  const nx = o.next;
  const seals = o.st.map(s => `<span class="seal ${s.pct>=100?'on':''}" title="${esc(s.name)}${s.pct>=100?' · fertig':''}">${s.pct>=100?ico('check'):`<b>${s.no}</b>`}</span>`).join('');
  const row = s => { const st = s.pct >= 100 ? 'done' : (nx && nx.k === s.k) ? 'active' : 'open';
    return `<li class="au-st ${st}">
      <div class="au-node"><span class="au-no">${s.pct>=100?ico('check'):s.no}</span></div>
      <div class="au-card">
        <div class="au-main">
          <div class="au-ico">${ico(s.ico)}</div>
          <div class="au-txt"><div class="au-name">${esc(s.name)}${st==='active'?'<span class="au-now">Jetzt dran</span>':''}${st==='done'?'<span class="au-ok">Fertig</span>':''}</div>
            <div class="au-wozu"><b>Wozu?</b> ${esc(s.wozu)}</div></div>
        </div>
        <div class="au-prog"><div class="au-metric">${esc(s.metric)}</div><div class="meter au-meter"><i style="width:${s.pct}%"></i></div><div class="au-pct">${s.pct} %</div></div>
        <div class="au-act"><button type="button" class="btn ${st==='active'?'primary':''}" data-act="${s.act.a}" data-id="${esc(s.act.id)}">${esc(s.act.l)}</button></div>
      </div></li>`; };
  return `<div class="page-h"><div><div class="eyebrow">Werkstatt · ${esc(S.settings.name)}</div><h1>Aufbau</h1></div>
    <div class="row-btns"><button type="button" class="btn" data-act="goTab" data-id="dash">${ico('dash')}Zum Tag</button>${o.st[1].pct<100?`<button type="button" class="btn primary" data-act="pcStart">${ico('tag')}Preis-Check</button>`:''}</div></div>
  <section class="au-hero">
    <div class="au-ring">${bigRing(o.pct, 132, 9)}<span><b>${o.pct}<small>%</small></b><em>aufgebaut</em></span></div>
    <div class="au-hero-txt">
      <div class="au-lvl">Stufe ${o.lvl+1} von ${LEVELS.length} · <b>${esc(o.lvlName)}</b></div>
      <h2>${o.pct>=100 ? 'Ihr Betrieb steht komplett in der App.' : nx ? `Nächster Schritt: ${esc(nx.name)}` : 'Fast geschafft.'}</h2>
      <p>${o.pct>=100 ? 'Alle sechs Stationen sind fertig. Ab jetzt heißt es pflegen: Preise beim Wareneingang übernehmen, neue Gerichte mit Rezeptur anlegen, Kasse regelmäßig importieren.' : nx ? `${esc(nx.metric)}. ${esc(nx.wozu)}` : ''}</p>
      <div class="au-hero-f">${nx ? `<button type="button" class="btn gold" data-act="${nx.act.a}" data-id="${esc(nx.act.id)}">${esc(nx.act.l)}${ico('arrow','flip')}</button>` : ''}<span class="au-seals">${seals}<small>${o.doneN} von ${o.st.length} Stationen</small></span></div>
    </div>
  </section>
  <ol class="au-path">${o.st.map(row).join('')}</ol>
  <p class="hint">Die Stationen bauen aufeinander auf, Sie können aber jederzeit überall weitermachen. Der Fortschritt rechnet sich immer aus Ihren echten Daten.</p>`;
}

/* ---------- Belohnung ---------- */
function checkRewards(){
  if(!S.game || !S.game.init) return;
  if(document.querySelector('.reward')) return;
  const o = gameOverall();
  const st = o.st.find(s => s.pct >= 100 && !S.game.done[s.k]);
  if(!st) return;
  S.game.done[st.k] = todayStr(); save();
  const nx = o.st.find(s => s.pct < 100);
  const el = document.createElement('div'); el.className = 'reward'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','Station abgeschlossen');
  el.innerHTML = `<div class="rw-box"><div class="rw-sparks">${Array.from({length:10},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div>
    <div class="rw-seal">${bigRing(100, 120, 6, 'gold')}<span>${ico('check')}</span></div>
    <div class="eyebrow">Station ${st.no} abgeschlossen</div><h2>${esc(st.name)}</h2>
    <p>${esc(st.metric)}. ${o.doneN >= o.st.length ? 'Damit ist der Aufbau komplett: Stufe „Vollbetrieb“.' : `Stufe ${o.lvl+1} · ${esc(o.lvlName)} · ${o.doneN} von ${o.st.length} Stationen.`}</p>
    <div class="row-btns rw-acts">${nx ? `<button type="button" class="btn gold" data-rw="next" data-act="${nx.act.a}" data-id="${esc(nx.act.id)}">Weiter: ${esc(nx.name)}</button>` : ''}<button type="button" class="btn" data-rw="close">${nx?'Später':'Schließen'}</button></div><button type="button" class="rw-x icon-btn" data-rw="close" aria-label="Schließen">${ico('x')}</button></div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  const bye = () => { el.classList.remove('in'); setTimeout(()=>el.remove(), 300); };
  el.addEventListener('click', e => { if(e.target.closest('[data-rw]')) bye(); });
  el._t = setTimeout(bye, 12000);
  el.addEventListener('pointerenter', () => clearTimeout(el._t));
  el.addEventListener('pointerleave', () => { el._t = setTimeout(bye, 6000); });
}

/* ---------- „Wozu?“ je Bereich ---------- */
const WOZU = {
  aufbau:'Ihr Bauplan: sechs Stationen, in denen Sie den Betrieb Stück für Stück in die App bringen. Der Fortschritt kommt aus echten Daten.',
  dash:'Ihr Tag auf einen Blick: Was heute bestellt, geliefert und gebucht werden soll, und wie die Karte kalkuliert ist.',
  menu:'Alle Gerichte mit Preis, Wareneinsatz und Allergenen. Hier entscheiden Sie, was die Gäste sehen.',
  cards:'Rezepturen sind der Bauplan jedes Gerichts: Zutaten, Mengen, Zubereitung. Daraus rechnet die App Wareneinsatz und Allergene.',
  stock:'Was ist im Haus? Wareneingang, Entnahmen, Schwund und Inventur, mit Lagerwert in Euro.',
  buy:'Lieferanten und Bestellungen: Wer liefert wann, was muss heute noch raus, was kommt morgen an.',
  products:'Jede Zutat mit Einkaufspreis je Einheit. Stimmen die Preise, stimmt die ganze Kalkulation.',
  report:'Was wurde verkauft, was hat es gebracht? Kassendaten importieren, Renner und Verlierer erkennen.',
  setup:'Betrieb, Team, Cloud und Sicherung. Hier stellen Sie den Rahmen ein.',
  pcheck:'Karte für Karte durch alle Richtwerte: echten Preis eintippen, Richtwert bestätigen oder überspringen. Enter geht weiter.',
};
const WOZU_KEY = KEY + '_wozu';
let WOZU_OFF = (() => { try { return JSON.parse(localStorage.getItem(WOZU_KEY)) || {}; } catch(e){ return {}; } })();
function wozuSave(){ try { localStorage.setItem(WOZU_KEY, JSON.stringify(WOZU_OFF)); } catch(e){} }
function injectWozu(){
  const app = $('#app'); const t = view.tab; const txt = WOZU[t]; if(!txt || view.card) return;
  const ph = app.querySelector('.page-h'); if(!ph) return;
  const h1 = ph.querySelector('h1');
  if(h1 && !h1.querySelector('.wozu-q')) h1.insertAdjacentHTML('beforeend', `<button type="button" class="wozu-q ${WOZU_OFF[t]?'':'on'}" data-act="wozuToggle" data-id="${t}" title="Wozu ist das?" aria-label="Wozu ist das?">${ico('help')}</button>`);
  if(WOZU_OFF[t]) return;
  ph.insertAdjacentHTML('afterend', `<div class="wozu"><span class="wozu-k">Wozu?</span><span>${esc(txt)}</span><button type="button" class="wozu-x" data-act="wozuToggle" data-id="${t}" aria-label="Hinweis ausblenden">${ico('x')}</button></div>`);
}
function injectDashStrip(){
  if(view.tab !== 'dash') return;
  const o = gameOverall(); if(o.pct >= 100) return;
  const ph = $('#app .page-h'); if(!ph) return;
  const nx = o.next;
  (document.querySelector('#app .wozu') || ph).insertAdjacentHTML('afterend', `<button type="button" class="au-strip" data-act="goTab" data-id="aufbau">${bigRing(o.pct, 40, 4)}<span class="au-strip-t"><b>Aufbau ${o.pct} % · Stufe ${o.lvl+1} ${esc(o.lvlName)}</b><small>${nx ? `Nächster Schritt: ${esc(nx.act.l)}` : ''}</small></span>${ico('arrow','flip')}</button>`);
}

/* ---------- Preis-Check ---------- */
function pcQueue(ids){
  const all = ids ? ids.map(P).filter(Boolean) : S.products.filter(p=>p.priceDemo && !p.noStock);
  return all.sort((a,b) => supName(a).localeCompare(supName(b),'de') || usage('p:'+b.id).length - usage('p:'+a.id).length || byName(a,b)).map(p=>p.id);
}
function avgFcAll(){ const l = S.menu.map(menuCalc).filter(k=>k.fc!=null); return l.length ? l.reduce((s,k)=>s+k.fc,0)/l.length : null; }
function dishesUsing(pid){ return S.menu.filter(m=>m.card && C(m.card)).map(m=>({m, k:menuCalc(m)})).filter(x => explode(x.k.c, 1).has(pid)); }
function pcStart(ids){
  const q = pcQueue(ids && ids.length ? ids : null);
  // merken, von wo der Preis-Check gestartet wurde: „Beenden“ führt dorthin zurück
  if(view.tab !== 'pcheck') view.pcFrom = {tab:view.tab, card:view.tab === 'cards' ? view.card : null};
  view.pc = {q, i:0, saved:0, confirmed:0, skipped:0, avg0:avgFcAll(), last:null, ids:!!(ids && ids.length), hist:[], msg:'', sure:null};
  go('pcheck');
  setTimeout(() => $('#pcIn')?.focus(), 50);
}
function pcStep(kind){
  const pc = view.pc; if(!pc) return; const p = P(pc.q[pc.i]); if(!p){ pc.i++; render(); return; }
  pc.hist = pc.hist || [];
  const stay = msg => { pc.msg = msg; const el = $('#pcMsg'); if(el){ el.innerHTML = msg; el.hidden = !msg; } const i = $('#pcIn'); if(i){ i.classList.toggle('bad-in', !!msg && !pc.sure); i.focus(); i.select(); } };
  let val = null;
  if(kind === 'save'){
    const raw = $('#pcIn') ? $('#pcIn').value.trim() : '';
    if(raw === '') kind = 'ok'; // leer = Richtwert stimmt (steht so unter dem Feld)
    else { const v = numParse(raw);
      if(!isFinite(v) || v <= 0){ pc.sure = null; return stay(v === 0 ? 'Ein Preis von 0 ist nicht möglich. Bitte den Einkaufspreis eintippen oder „Richtwert stimmt“ wählen.' : 'Das ist kein gültiger Preis. Bitte eine Zahl eintippen, zum Beispiel 12,50.'); }
      val = Math.round(v*100)/100; const ref = +p.price;
      if(ref > 0 && (val > ref*5 || val < ref/5) && pc.sure !== val){ pc.sure = val; return stay(`Wirklich ${eur(val)} je ${esc(p.unit)}? Der Richtwert ist ${eur(ref)}. <button type="button" class="btn sm" data-act="pcSave">Ja, übernehmen</button>`); } }
  }
  if(kind === 'ok' && !(+p.price > 0)) return stay('Dieser Artikel hat noch keinen Preis. Bitte den Einkaufspreis eintippen oder überspringen.');
  pc.msg = ''; pc.sure = null;
  pc.hist.push({i:pc.i, pid:p.id, kind, prev:{price:p.price, priceDemo:p.priceDemo, priceDate:p.priceDate, priceSrc:p.priceSrc}, saved:pc.saved, confirmed:pc.confirmed, skipped:pc.skipped, last:pc.last});
  if(kind === 'skip'){ pc.skipped++; pc.last = null; }
  else {
    const before = dishesUsing(p.id).map(x => ({name:dishLabel(x.m), a:x.k.fc}));
    const old = +p.price;
    if(kind === 'save') p.price = val;
    markPrice(p, kind === 'save' ? 'Preis-Check' : 'bestätigt');
    if(kind === 'save') pc.saved++; else pc.confirmed++;
    const after = dishesUsing(p.id).map(x => x.k.fc);
    pc.last = {name:p.name, unit:p.unit, old, nw:+p.price, changed: kind==='save' && Math.abs(old-p.price) > 0.004, dishes: before.map((b,i)=>({name:b.name, a:b.a, b:after[i]})).filter(d=>d.a!=null).sort((x,y)=>Math.abs(y.b-y.a)-Math.abs(x.b-x.a)).slice(0,3)};
    save();
  }
  pc.i++; render();
  setTimeout(() => { const i = $('#pcIn'); if(i){ i.focus(); } }, 30);
}
/* einen Schritt zurück: letzte Entscheidung samt Preisänderung rückgängig machen */
function pcBack(){
  const pc = view.pc; if(!pc || !pc.hist || !pc.hist.length) return; const h = pc.hist.pop(); const p = P(h.pid);
  if(p && h.kind !== 'skip'){ p.price = h.prev.price; p.priceDemo = h.prev.priceDemo; if(h.prev.priceDate === undefined) delete p.priceDate; else p.priceDate = h.prev.priceDate; if(h.prev.priceSrc === undefined) delete p.priceSrc; else p.priceSrc = h.prev.priceSrc; save(); }
  pc.i = h.i; pc.saved = h.saved; pc.confirmed = h.confirmed; pc.skipped = h.skipped; pc.last = h.last; pc.msg = ''; pc.sure = null;
  render(); toast(p ? `Zurück zu ${p.name}` : 'Einen Schritt zurück'); setTimeout(() => $('#pcIn')?.focus(), 30);
}
function pcFromLabel(){ const f = view.pcFrom || {}; return f.tab === 'cards' && f.card ? 'Zurück zur Rezeptur' : f.tab === 'products' ? 'Zur Produktliste' : f.tab === 'aufbau' || !f.tab ? 'Zum Aufbau' : 'Zurück'; }
function pcLeave(){ const f = view.pcFrom || {tab:'aufbau'}; view.pc = null; view.pcBack = null; view.pcFrom = null; go(f.tab === 'cards' && f.card && !C(f.card) ? 'cards' : (f.tab || 'aufbau'), f.tab === 'cards' ? (f.card && C(f.card) ? f.card : null) : null); }
function renderPriceCheck(){
  const pc = view.pc;
  const head = `<div class="page-h"><div><div class="eyebrow">Station 2 · Produkte & Preise</div><h1>Preis-Check</h1></div>
    <div class="row-btns">${pc && pc.hist && pc.hist.length ? `<button type="button" class="btn" data-act="pcBack">${ico('arrow')}Zurück</button>` : ''}<button type="button" class="btn" data-act="pcEnd" title="${esc(pcFromLabel())}">Beenden</button></div></div>`;
  if(!pc){ const n = S.products.filter(p=>p.priceDemo && !p.noStock).length;
    return head + emptyHtml('tag', n ? `${n} Preise warten auf Bestätigung` : 'Alle Preise sind bestätigt', n ? 'Wir gehen Produkt für Produkt durch: echten Einkaufspreis eintippen oder den Richtwert bestätigen.' : 'Neue Preise übernehmen Sie beim Wareneingang oder direkt in der Produktliste.', n ? `<button type="button" class="btn primary" data-act="pcStart">${ico('tag')}Preis-Check starten</button>` : `<button type="button" class="btn" data-act="goTab" data-id="aufbau">Zurück zum Aufbau</button>`); }
  const total = pc.q.length, i = pc.i;
  const prog = `<div class="pc-prog"><div class="pc-prog-t"><b>${Math.min(i,total)} von ${total}</b><span>${pc.saved} eingetragen · ${pc.confirmed} bestätigt · ${pc.skipped} übersprungen</span></div><div class="meter au-meter"><i style="width:${total?Math.min(100,i/total*100):100}%"></i></div></div>`;
  const fb = pc.last ? `<div class="pc-fb ${pc.last.changed?'chg':'ok'}">${ico('check')}<div><b>${esc(pc.last.name)}</b> ${pc.last.changed ? `${eur(pc.last.old)} → <b>${eur(pc.last.nw)}</b> je ${esc(pc.last.unit)}` : `${eur(pc.last.nw)} je ${esc(pc.last.unit)} bestätigt`}
      ${pc.last.dishes.length ? `<div class="pc-fb-d">${pc.last.dishes.map(d=>`<span>${esc(d.name)} <em class="${fcClass(d.b)}">${num(d.a,1)} % → ${num(d.b,1)} %</em></span>`).join('')}</div>` : (pc.last.changed ? '<div class="pc-fb-d muted">Noch in keiner Rezeptur verwendet.</div>' : '')}</div></div>` : '';
  if(i >= total){
    const avg1 = avgFcAll();
    return head + prog + `<section class="pc-done">
      <div class="rw-seal small">${bigRing(100, 96, 6, 'gold')}<span>${ico('check')}</span></div>
      <h2>${pc.ids ? 'Zutaten geprüft' : 'Preis-Check fertig'}</h2>
      <p>${pc.saved} Preise eingetragen, ${pc.confirmed} bestätigt${pc.skipped?`, ${pc.skipped} übersprungen`:''}.${pc.avg0!=null && avg1!=null ? ` Ø Wareneinsatz der kalkulierten Gerichte: ${num(pc.avg0,1)} % → <b>${num(avg1,1)} %</b>.` : ''}</p>
      <div class="row-btns" style="justify-content:center">${pc.skipped ? `<button type="button" class="btn" data-act="pcStart">Übersprungene noch einmal</button>` : ''}<button type="button" class="btn primary" data-act="pcEnd">${esc(pcFromLabel())}</button>${(view.pcFrom||{}).tab === 'products' ? '' : `<button type="button" class="btn" data-act="goTab" data-id="products">Produktliste</button>`}</div>
    </section>` + fb;
  }
  const p = P(pc.q[i]); if(!p){ pc.i++; return renderPriceCheck(); }
  const uses = dishesUsing(p.id); const semis = usage('p:'+p.id).filter(c=>c.type==='semi');
  const unitTxt = p.unit === 'Stk' ? 'Stück' : p.unit === 'l' ? 'Liter' : 'Kilogramm';
  return head + prog + `<section class="pc-card" data-key="${p.id}">
    <div class="pc-sup">${ico('truck')}<span>${esc(supName(p))}${p.artNo?` · Art.-Nr. ${esc(p.artNo)}`:''}${p.pack?` · ${esc(p.pack)}`:''}</span><span class="pc-count">Nr. ${i+1}</span></div>
    <h2 class="pc-name">${esc(p.name)}</h2>
    <div class="pc-grid">
      <div class="pc-ex"><small>Richtwert</small><b>${eur(p.price)}</b><span>je ${esc(unitTxt)}${p.unit==='Stk'&&p.pieceG?` · ${num(p.pieceG)} g`:''} · exkl. MwSt.</span></div>
      <label class="pc-in"><span>Ihr Einkaufspreis je ${esc(p.unit)}</span><span class="pc-field"><em>€</em><input id="pcIn" class="num-in" type="text" inputmode="decimal" data-num="self" placeholder="${num2(p.price)}" autocomplete="off" aria-describedby="pcMsg"></span><small>Netto, wie auf der Rechnung. Leer lassen, wenn der Richtwert stimmt.</small><span class="pc-msg" id="pcMsg" role="alert" ${pc.msg?'':'hidden'}>${pc.msg||''}</span></label>
    </div>
    <div class="pc-uses">${uses.length || semis.length ? `<b>Steckt in:</b> ${uses.slice(0,6).map(x=>`<span>${esc(dishLabel(x.m))} <em class="${fcClass(x.k.fc)}">${num(x.k.fc,1)} %</em></span>`).join('')}${semis.map(c=>`<span>${esc(c.name)} <em>Basisrezept</em></span>`).join('')}${uses.length>6?`<span class="muted">+${uses.length-6} weitere</span>`:''}` : '<span class="muted">Noch in keiner Rezeptur verwendet.</span>'}</div>
    <div class="pc-acts">${pc.hist && pc.hist.length ? `<button type="button" class="btn" data-act="pcBack">${ico('arrow')}Zurück</button>` : ''}<button type="button" class="btn" data-act="pcSkip">Überspringen<kbd>Esc</kbd></button><span class="sp"></span><button type="button" class="btn" data-act="pcOk">${ico('check')}Richtwert stimmt</button><button type="button" class="btn primary" data-act="pcSave">Übernehmen<kbd>↵</kbd></button></div>
  </section>${fb}`;
}

/* ---------- Teller: Rezeptur bauen ---------- */
function tellerHints(c){
  const h = []; const t = totals(c);
  const demo = [...demoPriceLines(c)];
  if(c.items.some(it => !refObj(it.ref))) h.push({cls:'bad', t:`${c.items.filter(it=>!refObj(it.ref)).length} Zutat ohne Auswahl`, a:'tellerTable', id:'', l:'Zur Tabelle'});
  if(demo.length) h.push({cls:'warn', t:`${demo.length} ${demo.length===1?'Zutat hat':'Zutaten haben'} noch einen Richtwert-Preis: ${demo.slice(0,3).map(id=>P(id)?.name).filter(Boolean).join(', ')}${demo.length>3?' …':''}`, a:'pcFor', id:demo.join(','), l:'Preise prüfen'});
  if(!(+c.yieldG > 0)) h.push({cls:'warn', t:c.type==='semi' ? 'Ausbeute der Charge fehlt (Gramm)' : 'Portionsgewicht fehlt (Gramm)', a:'focusEl', id:'cf-yieldG', l:'Eintragen'});
  if(!(c.img && IMG[c.img])) h.push({cls:'', t:'Kein Foto', a:'photoCard', id:c.id, l:'Foto'});
  if(!(c.steps||[]).some(s=>s.t && s.t.trim())) h.push({cls:'', t:'Zubereitung noch leer', a:'focusEl', id:'st-0', l:'Schritt schreiben'});
  if(c.type==='dish' && !S.menu.some(m=>m.card===c.id)) h.push({cls:'', t:'Noch nicht auf der Speisekarte', a:'toMenu', id:c.id, l:'Auf die Karte'});
  if(c.items.length && !t.alg.size) h.push({cls:'', t:'Keine Allergene erkannt, Produktdaten prüfen', a:'goTab', id:'products', l:'Produkte'});
  return h;
}
function tellerHtml(c){
  const t = totals(c); const sum = t.cost || 0;
  const menus = S.menu.filter(m => m.card === c.id); const k0 = menus[0] ? menuCalc(menus[0]) : null;
  const parts = c.items.map((it,i) => ({i, it, l:t.lines[i]})).sort((a,b)=>b.l.cost-a.l.cost);
  const colorOf = {}; parts.forEach((p,idx) => colorOf[p.i] = idx < 6 ? `var(--s${idx+1})` : 'var(--s7)');
  // Donut
  const R = 54, CX = 70, CY = 70, cir = 2*Math.PI*R; let off = 0;
  const segs = sum ? parts.filter(p=>p.l.cost>0).map(p => { const f = p.l.cost/sum; const s = `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${colorOf[p.i]}" stroke-width="16" stroke-dasharray="${(f*cir).toFixed(2)} ${cir.toFixed(2)}" stroke-dashoffset="${(-off*cir).toFixed(2)}" transform="rotate(-90 ${CX} ${CY})"><title>${esc(p.l.name)}: ${eur(p.l.cost)} · ${num(f*100)} %</title></circle>`; off += f; return s; }).join('') : '';
  const plate = `<div class="plate"><svg viewBox="0 0 140 140" aria-hidden="true"><circle cx="${CX}" cy="${CY}" r="66" class="rim"/><circle cx="${CX}" cy="${CY}" r="${R}" class="trk" fill="none" stroke-width="16"/>${segs}</svg>
    <div class="plate-c"><b>${eur(sum)}</b><small>${c.type==='semi'?'pro Charge':'pro Portion'}</small>${c.type==='dish' ? `<span class="fc ${fcClass(k0?k0.fc:null)}">${k0 ? pct(k0.fc)+' WE' : 'nicht auf der Karte'}</span>` : (c.yieldG ? `<span class="fc na">${eur(t.cost/c.yieldG*1000)} / kg</span>` : '')}</div></div>`;
  const tile = ({i, it, l}) => { const r = refObj(it.ref); const p = r && r.t==='p' ? r.o : null; const share = sum ? l.cost/sum*100 : 0;
    const flags = [];
    if(!r) flags.push('<span class="ti-flag bad">Zutat wählen</span>');
    if(p && p.priceDemo && !p.noStock) flags.push('<span class="ti-flag" title="Preis ist noch ein Richtwert">Richtwert</span>');
    if(r && r.t==='c') flags.push('<span class="ti-flag">Basisrezept</span>');
    return `<div class="ti" style="--c:${colorOf[i]}">
      <span class="ti-dot"></span>
      <div class="ti-h"><b class="ti-n">${esc(r ? l.name.replace(/^BR · /,'') : 'Neue Zutat')}</b><button type="button" class="icon-btn ti-x" data-act="delLine" data-id="${i}" title="Vom Teller nehmen" aria-label="Vom Teller nehmen">${ico('x')}</button></div>
      ${r ? `<div class="ti-q"><span class="qty"><input id="qty-${i}" class="num-in" type="text" inputmode="decimal" data-li="${i}" data-lf="qty" value="${numIn(it.qty)}" aria-label="Menge ${esc(l.name)}"><em>${l.unit}</em></span><span class="ti-c"><b>${eur(l.cost)}</b><small>${num(share)} %</small></span></div>
      <div class="ti-bar"><i style="width:${Math.min(100,share).toFixed(1)}%"></i></div>
      <div class="ti-m">${l.unit==='Stk' ? `${num(l.grossG)} g brutto · ` : ''}netto ${num(l.net)} g · fertig ${num(l.out)} g${p && p.alg ? ` · ${esc(p.alg)}` : ''}${flags.length?' ':''}${flags.join('')}</div>`
      : `<div class="ti-q"><select id="ref-${i}" data-li="${i}" data-lf="ref" aria-label="Zutat">${refOptions(it.ref, c.id)}</select></div><div class="ti-m">${flags.join('')}</div>`}
    </div>`; };
  const hints = tellerHints(c);
  return `<section class="panel teller-sec">
    <div class="panel-h"><h2>${ico('plate')}Teller · Zutaten ${c.type==='semi'?'pro Charge':'pro Portion'}</h2>${seg('tellerMode', 'teller', [['teller','Teller'],['table','Tabelle']])}</div>
    <div class="teller">${plate}
      <div class="tl-tiles">${c.items.map((it,i)=>tile({i,it,l:t.lines[i]})).join('')}
        <button type="button" class="ti ti-add" data-act="tellerPick">${ico('plus')}<b>Zutat</b><small>Produkt oder Basisrezept</small></button></div>
    </div>
    <div class="teller-f"><span class="kv-inline"><span>Brutto <b>${num(t.gross)} g</b></span><span>Netto <b>${num(t.net)} g</b></span><span>Fertig <b>${num(t.out)} g</b></span><span>Wareneinsatz <b>${eur(t.cost)}</b></span></span><span class="sp"></span><button type="button" class="link-btn" data-act="addLine">${ico('plus')}Leere Zeile</button></div>
    ${hints.length ? `<ul class="hints">${hints.map(h=>`<li class="${h.cls}"><span>${esc(h.t)}</span><button type="button" class="btn sm" data-act="${h.a}" data-id="${esc(h.id)}">${esc(h.l)}</button></li>`).join('')}</ul>` : `<div class="teller-ok muted sm">${ico('check')}Vollständig: Zutaten, Preise, Foto, Zubereitung.</div>`}
  </section>`;
}
const _renderCardT = renderCard;
renderCard = function(c){
  let h = _renderCardT(c);
  if(vmode('teller') === 'table'){ return h.replace('<div class="panel-h pad"><h2>Zutaten', `<div class="panel-h pad teller-sw"><span class="sp"></span>${seg('tellerMode', 'table', [['teller','Teller'],['table','Tabelle']])}</div><div class="panel-h pad"><h2>Zutaten`); }
  const a = h.indexOf('<div class="panel-h pad"><h2>Zutaten'); if(a < 0) return h;
  const s = h.lastIndexOf('<section class="panel flush">', a); const e = h.indexOf('</section>', a); if(s < 0 || e < 0) return h;
  return h.slice(0, s) + tellerHtml(c) + h.slice(e + '</section>'.length);
};
function tellerPickDialog(c){
  const ps = [...S.products].sort(byName), cs = S.cards.filter(x => x.type==='semi' && x.id!==c.id).sort(byName);
  const used = new Set(c.items.map(it=>it.ref));
  const tileP = p => `<button type="button" class="pk ${used.has('p:'+p.id)?'used':''}" data-pick="p:${p.id}" data-s="${esc((p.name+' '+supName(p)).toLowerCase())}"><b>${esc(p.name)}</b><small>${eur(p.price)} / ${esc(p.unit)}${p.priceDemo?' · Richtwert':''}</small>${used.has('p:'+p.id)?'<i>am Teller</i>':''}</button>`;
  const tileC = x => { const tt = totals(x); const y = +x.yieldG || tt.out; return `<button type="button" class="pk semi ${used.has('c:'+x.id)?'used':''}" data-pick="c:${x.id}" data-s="${esc(x.name.toLowerCase())} basisrezept"><b>${esc(x.name)}</b><small>Basisrezept · ${y ? eur(tt.cost/y*1000)+' / kg' : 'ohne Ausbeute'}</small>${used.has('c:'+x.id)?'<i>am Teller</i>':''}</button>`; };
  openDialog('Zutat auf den Teller', `<label class="search pk-s">${ico('search')}<input id="pkIn" placeholder="Zutat suchen …" autocomplete="off"></label>
    <div class="pk-wrap">${cs.length ? `<div class="pk-g">Basisrezepte</div><div class="pk-grid">${cs.map(tileC).join('')}</div>` : ''}<div class="pk-g">Produkte</div><div class="pk-grid">${ps.map(tileP).join('')}</div>
    <p class="hint pk-empty" hidden>Nichts gefunden. <button type="button" class="link" id="pkNew">Neues Produkt anlegen</button></p></div>`, null,
    {cancel:'Schließen', after: f => {
      const inp = f.querySelector('#pkIn'); setTimeout(()=>inp.focus(), 30);
      const filter = () => { const q = inp.value.trim().toLowerCase(); let n = 0; f.querySelectorAll('.pk').forEach(b => { const on = !q || b.dataset.s.includes(q); b.hidden = !on; if(on) n++; }); f.querySelectorAll('.pk-g').forEach(g => { const grid = g.nextElementSibling; g.hidden = ![...grid.children].some(x=>!x.hidden); }); f.querySelector('.pk-empty').hidden = n > 0; };
      inp.oninput = filter;
      inp.onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); const first = [...f.querySelectorAll('.pk')].find(b=>!b.hidden); first && first.click(); } };
      f.onclick = e => { const b = e.target.closest('[data-pick]'); if(!b) return; const ref = b.dataset.pick; const r = refObj(ref); if(!r) return;
        $('#dlg').close(); tellerAdd(c, ref, null); };
      const nb = f.querySelector('#pkNew'); if(nb) nb.onclick = () => { $('#dlg').close(); prodDialog(); };
    }});
}

/* ---------- Leere Zustände ---------- */
function emptyHtml(icon, title, text, btn){ return `<section class="panel empty-s">${ico(icon)}<h3>${esc(title)}</h3><p>${esc(text)}</p>${btn ? `<div class="row-btns" style="justify-content:center">${btn}</div>` : ''}</section>`; }
const _renderCardsG = renderCards;
renderCards = function(){ return _renderCardsG().replace('<div class="panel empty">Keine Rezepturen gefunden. Legen Sie eine mit „Gericht“ an.</div>', emptyHtml('cards', view.q ? 'Keine Rezeptur passt zur Suche' : 'Noch keine Rezepturen', view.q ? 'Anders schreiben oder die Suche leeren.' : 'Eine Rezeptur ist der Bauplan eines Gerichts. Legen Sie die erste an, der Teller wartet.', view.q ? `<button type="button" class="btn" data-act="clearQ">Suche leeren</button>` : `<button type="button" class="btn primary" data-act="newCard" data-id="dish">${ico('plus')}Erstes Gericht anlegen</button>`)); };
const _renderMenuCalcG = renderMenuCalc;
renderMenuCalc = function(){ return _renderMenuCalcG().replace('<div class="panel empty">Keine Gerichte für diesen Filter.</div>', emptyHtml('menu', 'Hier ist nichts', view.sec==='over' ? 'Kein Gericht liegt über dem Ziel-Wareneinsatz. Sehr gut.' : view.sec==='none' ? 'Jedes Gericht hat eine Rezeptur.' : view.sec==='noalg' ? 'Alle Gerichte haben Allergenangaben.' : 'Kein Gericht passt zu Filter und Suche.', `<button type="button" class="btn" data-act="sec" data-id="all">Alle Gerichte zeigen</button>`)); };
const _renderProductsG = renderProducts;
renderProducts = function(){
  const n = S.products.filter(p=>p.priceDemo && !p.noStock).length;
  let h = _renderProductsG();
  h = h.replace('<button type="button" class="btn" data-act="plImport">', `<button type="button" class="btn ${n?'primary':''}" data-act="pcStart">${ico('tag')}Preis-Check${n?` · ${n}`:''}</button><button type="button" class="btn" data-act="plImport">`);
  if(n) h = h.replace('class="btn primary" data-act="newProd"', 'class="btn" data-act="newProd"');
  return h.replace('<button type="button" class="btn sm" data-act="pFilter" data-id="demo">Richtwerte zeigen</button>', '<button type="button" class="btn sm" data-act="pcStart">Preis-Check starten</button>');
};
const _renderSetupG = renderSetup;
renderSetup = function(){
  const o = gameOverall();
  const panel = `<section class="panel"><div class="panel-h"><h2>Aufbau & Hilfe</h2><span class="muted sm">Stufe ${o.lvl+1} · ${esc(o.lvlName)}</span></div>
    <div class="au-mini">${bigRing(o.pct, 56, 6)}<div><b>${o.pct} % aufgebaut</b><small class="muted">${o.doneN} von ${o.st.length} Stationen fertig</small></div><button type="button" class="btn sm" data-act="goTab" data-id="aufbau">Zum Aufbau</button></div>
    <div class="row-btns" style="margin-top:12px"><button type="button" class="btn sm" data-act="wozuAll">„Wozu?“-Hinweise wieder einblenden</button><button type="button" class="btn sm" data-act="gameReset">Auszeichnungen zurücksetzen</button></div>
    <p class="hint">Der Fortschritt rechnet sich immer aus Ihren Daten. Zurücksetzen löscht nur die Erinnerung an gefeierte Stationen, keine Daten.</p></section>`;
  const h = _renderSetupG(); const i = h.lastIndexOf('</div>'); return h.slice(0, i) + panel + h.slice(i);
};

/* ---------- Rendern koppeln ---------- */
let firstRenderG = true;
const _renderG = render;
render = function(){
  if(firstRenderG){ firstRenderG = false; if(S && S.game){ gameSilentDone(); if(view.tab === 'aufbau' && !location.hash && gameOverall().pct >= 100) view.tab = 'dash'; } }
  if(view.tab === 'pcheck' && !view.pc && !S.products.some(p=>p.priceDemo && !p.noStock)){ /* nichts zu prüfen: Seite zeigt Hinweis */ }
  _renderG();
  injectWozu(); injectDashStrip();
  setTimeout(checkRewards, 120);
};

/* ---------- Ereignisse ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return; const id = el.dataset.id; const c = view.card ? C(view.card) : null;
  switch(el.dataset.act){
    case 'wozuToggle': WOZU_OFF[id] = !WOZU_OFF[id]; wozuSave(); render(); break;
    case 'wozuAll': WOZU_OFF = {}; wozuSave(); render(); toast('Hinweise werden wieder angezeigt'); break;
    case 'gameReset': S.game.done = {}; S.game.init = false; save(); gameSilentDone(); render(); toast('Zurückgesetzt'); break;
    case 'goBuyTab': view.stab = id; view.order = null; view.recv = null; go('buy'); break;
    case 'goReportTab': view.rp.tab = id; go('report'); break;
    case 'goGuest': view.mtab = 'guest'; go('menu'); break;
    case 'clearQ': view.q = ''; render(); break;
    case 'pcStart': view.pcBack = null; pcStart(); break;
    case 'pcFor': view.pcBack = view.card; pcStart(id.split(',').filter(Boolean)); break;
    case 'pcSkip': pcStep('skip'); break;
    case 'pcOk': pcStep('ok'); break;
    case 'pcSave': pcStep('save'); break;
    case 'pcEnd': pcLeave(); break;
    case 'pcBack': pcBack(); break;
    case 'tellerMode': setV('teller', id); render(); break;
    case 'tellerTable': setV('teller', 'table'); render(); break;
    case 'tellerPick': if(c) tellerPickDialog(c); break;
    case 'focusEl': { const n = document.getElementById(id); if(n){ n.scrollIntoView({behavior:'smooth', block:'center'}); n.focus({preventScroll:true}); } else if(id==='st-0' && c){ c.steps = c.steps || []; if(!c.steps.length){ c.steps.push({t:'',img:''}); save(); render(); } setTimeout(()=>document.getElementById('st-0')?.focus(), 50); } break; }
  }
});
document.addEventListener('keydown', e => {
  if(view.tab !== 'pcheck' || !view.pc || $('#dlg').open || !$('#pal').hidden) return;
  if(e.key === 'Enter' && e.target.id === 'pcIn'){ e.preventDefault(); pcStep('save'); }
  else if(e.key === 'Escape'){ e.preventDefault(); pcStep('skip'); }
});

/* =====================================================================
   Teller: Drag & Drop (Zutaten-Regal → Teller, Kacheln sortieren)
   Pointer Events, funktioniert mit Maus, Touch und Stift.
   ===================================================================== */
const GRIP_SVG = '<svg viewBox="0 0 10 16" aria-hidden="true"><g fill="currentColor"><circle cx="2.5" cy="3" r="1.3"/><circle cx="7.5" cy="3" r="1.3"/><circle cx="2.5" cy="8" r="1.3"/><circle cx="7.5" cy="8" r="1.3"/><circle cx="2.5" cy="13" r="1.3"/><circle cx="7.5" cy="13" r="1.3"/></g></svg>';

function shelfHtml(c){
  const used = new Set(c.items.map(i => i.ref));
  const q = (view.shelfQ || '').trim().toLowerCase();
  const cs = S.cards.filter(x => x.type === 'semi' && x.id !== c.id).sort(byName);
  const ps = [...S.products].sort(byName);
  const chip = (ref, name, sub, s, semi) => `<button type="button" class="sh-chip${semi?' semi':''}${used.has(ref)?' used':''}" data-shelf="${ref}" data-s="${esc(s)}" ${q && !s.includes(q) ? 'hidden' : ''} title="${esc(name)} auf den Teller ziehen oder antippen"><b>${esc(name)}</b><small>${sub}</small></button>`;
  const chips = cs.map(x => chip('c:'+x.id, x.name, 'Basisrezept', (x.name+' basisrezept').toLowerCase(), true)).join('')
    + ps.map(p => chip('p:'+p.id, p.name, `${eur(p.price)} / ${esc(p.unit)}${p.priceDemo?' · Richtwert':''}`, (p.name+' '+supName(p)).toLowerCase(), false)).join('');
  return `<div class="shelf" aria-label="Zutaten-Regal">
    <div class="shelf-h"><span class="shelf-t"><b>Zutaten-Regal</b><small>Auf den Teller ziehen oder antippen. Kacheln am Griff ${GRIP_SVG} ziehen, um sie zu sortieren.</small></span>
      <label class="search shelf-s">${ico('search')}<input id="shelfQ" type="search" placeholder="Zutat suchen" value="${esc(view.shelfQ||'')}" autocomplete="off" aria-label="Zutat im Regal suchen"></label></div>
    <div class="shelf-row">${chips}<span class="shelf-none" ${q && ![...cs.map(x=>(x.name+' basisrezept').toLowerCase()), ...ps.map(p=>(p.name+' '+supName(p)).toLowerCase())].some(s=>s.includes(q)) ? '' : 'hidden'}>Nichts gefunden.</span></div>
  </div>`;
}

const _tellerHtmlD = tellerHtml;
tellerHtml = function(c){
  let h = _tellerHtmlD(c); let n = 0, k = 0;
  h = h.replace(/<div class="ti" style=/g, () => `<div class="ti" data-ti="${n++}" style=`);
  h = h.replace(/<div class="ti-h">/g, () => `<div class="ti-h"><button type="button" class="ti-grip" data-grip="${k++}" title="Ziehen zum Sortieren (oder Alt + Pfeiltasten)" aria-label="Zutat verschieben">${GRIP_SVG}</button>`);
  return h.replace('<div class="teller-f">', shelfHtml(c) + '<div class="teller-f">');
};

function tellerAdd(c, ref, at){
  const r = refObj(ref); if(!r) return;
  // liegt die Zutat schon am Teller: nicht doppelt anlegen, sondern die Menge dort erhöhen lassen
  const dup = c.items.findIndex(x => x.ref === ref);
  if(dup >= 0 && !tellerAdd.force){
    const focusDup = () => { const q = document.getElementById('qty-'+dup); if(q){ q.scrollIntoView({block:'center', behavior:'smooth'}); q.focus({preventScroll:true}); q.select(); } };
    setTimeout(focusDup, 30);
    toast(`${r.o.name} liegt schon am Teller. Menge dort erhöhen?`, {label:'Trotzdem zweimal', ms:6000, action: () => { tellerAdd.force = true; try { tellerAdd(c, ref, at); } finally { tellerAdd.force = false; } }});
    return; }
  const it = {ref, qty: r.t === 'p' && r.o.unit === 'Stk' ? 1 : '', net:''};
  const empty = c.items.findIndex(x => !x.ref); let idx;
  if(at == null && empty >= 0){ c.items[empty] = it; idx = empty; }
  else { idx = at == null ? c.items.length : Math.max(0, Math.min(at, c.items.length)); c.items.splice(idx, 0, it); }
  save(); render(); toast(`${r.o.name} liegt am Teller`);
  setTimeout(() => { const q = document.getElementById('qty-'+idx); if(q){ q.focus({preventScroll:false}); q.select(); } }, 30);
}
function tellerMove(c, from, to){
  if(from === to || from < 0 || from >= c.items.length) return;
  const [it] = c.items.splice(from, 1); c.items.splice(Math.max(0, Math.min(to, c.items.length)), 0, it);
  save(); render();
  setTimeout(() => document.querySelector(`[data-grip="${Math.max(0, Math.min(to, c.items.length-1))}"]`)?.focus({preventScroll:true}), 20);
}

let DR = null;
function drClear(){ document.querySelectorAll('.drop-b,.drop-a,.drop-on').forEach(x => x.classList.remove('drop-b','drop-a','drop-on')); }
function drTarget(x, y){
  const el = document.elementFromPoint(x, y); if(!el) return null;
  const tile = el.closest('.tl-tiles .ti[data-ti]');
  const zone = el.closest('.teller');
  if(tile){ const r = tile.getBoundingClientRect(); const grid = tile.parentElement; const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    const before = cols > 1 ? x < r.left + r.width/2 : y < r.top + r.height/2; const i = +tile.dataset.ti; return {tile, zone, before, index: before ? i : i + 1}; }
  if(zone) return {zone, index: null};
  return null;
}
document.addEventListener('pointerdown', e => {
  if(e.button > 0 || DR) return;
  const g = e.target.closest('.ti-grip'), ch = e.target.closest('.sh-chip');
  if(!g && !ch) return;
  const src = g ? g.closest('.ti') : ch;
  DR = {kind: g ? 'move' : 'add', src, from: g ? +g.dataset.grip : null, ref: ch ? ch.dataset.shelf : null, x0: e.clientX, y0: e.clientY, started: false, ghost: null, t: null};
  if(g || e.pointerType === 'mouse') e.preventDefault();
});
document.addEventListener('pointermove', e => {
  if(!DR) return;
  const dx = e.clientX - DR.x0, dy = e.clientY - DR.y0;
  if(!DR.started){
    if(Math.hypot(dx, dy) < 7) return;
    if(DR.kind === 'add' && e.pointerType === 'touch' && Math.abs(dx) > Math.abs(dy)) { DR = null; return; } // waagrecht = Regal scrollen
    DR.started = true;
    const r = DR.src.getBoundingClientRect(); DR.ox = DR.x0 - r.left; DR.oy = DR.y0 - r.top;
    const gh = DR.src.cloneNode(true); gh.querySelectorAll('[id]').forEach(n => n.removeAttribute('id')); gh.removeAttribute('data-ti');
    gh.classList.add('drag-ghost'); gh.style.width = r.width + 'px'; document.body.appendChild(gh); DR.ghost = gh;
    DR.src.classList.add('drag-src'); document.body.classList.add('dragging');
    document.querySelector('.teller')?.classList.add('drop-ready');
  }
  e.preventDefault();
  DR.ghost.style.transform = `translate(${e.clientX - DR.ox}px, ${e.clientY - DR.oy}px) rotate(${DR.kind==='add'?-2:1.5}deg)`;
  drClear(); const t = drTarget(e.clientX, e.clientY); DR.t = t;
  if(t){ if(DR.kind === 'add') t.zone?.classList.add('drop-on'); if(t.tile && !(DR.kind === 'move' && +t.tile.dataset.ti === DR.from)) t.tile.classList.add(t.before ? 'drop-b' : 'drop-a'); }
  const edge = 70; if(e.clientY < edge) window.scrollBy(0, -14); else if(e.clientY > innerHeight - edge) window.scrollBy(0, 14);
}, {passive: false});
function drEnd(e, cancel){
  if(!DR) return; const d = DR; DR = null;
  if(!d.started) return;
  d.ghost.remove(); d.src.classList.remove('drag-src'); document.body.classList.remove('dragging'); document.querySelector('.teller')?.classList.remove('drop-ready'); drClear();
  const blk = ev => { ev.stopPropagation(); ev.preventDefault(); }; window.addEventListener('click', blk, true); setTimeout(() => window.removeEventListener('click', blk, true), 0);
  if(cancel) return;
  const c = C(view.card); if(!c) return; const t = drTarget(e.clientX, e.clientY);
  if(d.kind === 'add'){ if(t) tellerAdd(c, d.ref, t.index); else toast('Zum Hinzufügen auf den Teller ziehen'); }
  else if(t && t.index != null){ let to = t.index; if(d.from < to) to--; tellerMove(c, d.from, to); }
}
document.addEventListener('pointerup', e => drEnd(e, false));
document.addEventListener('pointercancel', e => drEnd(e, true));

document.addEventListener('click', e => {
  const ch = e.target.closest('.sh-chip'); if(!ch) return;
  const c = C(view.card); if(c) tellerAdd(c, ch.dataset.shelf, null);
});
document.addEventListener('keydown', e => {
  const g = e.target.closest && e.target.closest('.ti-grip'); if(!g) return;
  const c = C(view.card); if(!c) return; const i = +g.dataset.grip;
  const k = e.key; if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k)) return;
  e.preventDefault(); tellerMove(c, i, k === 'ArrowUp' || k === 'ArrowLeft' ? i - 1 : i + 1);
});
document.addEventListener('input', e => {
  if(e.target.id !== 'shelfQ') return; view.shelfQ = e.target.value; const q = view.shelfQ.trim().toLowerCase(); let n = 0;
  document.querySelectorAll('.sh-chip').forEach(b => { const on = !q || b.dataset.s.includes(q); b.hidden = !on; if(on) n++; });
  const none = document.querySelector('.shelf-none'); if(none) none.hidden = n > 0;
});

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

/* =====================================================================
   Feinschliff: ruhige, handgemachte Oberfläche.
   Ein Kontextsatz je Seite, keine Hinweis-Stapel, Zahlen deutsch,
   Heute als Tagesblatt, Aufbau als Liste, Warnfarbe nur für Seltenes.
   ===================================================================== */

/* ---------- Texte: kurz, Küchensprache ---------- */
Object.assign(WOZU, {
  aufbau:'Sechs Stationen, bis der Betrieb komplett in der App steht. Der Stand rechnet sich aus Ihren Daten.',
  menu:'Preis, Wareneinsatz und Allergene je Gericht. Preis direkt in der Zeile ändern, Klick öffnet die Rezeptur.',
  cards:'Zutaten, Mengen, Zubereitung je Gericht. Daraus kommen Wareneinsatz und Allergene.',
  stock:'Bestand, Wareneingang, Entnahmen, Schwund, Inventur.',
  buy:'Wer liefert wann, was muss heute noch raus, was kommt morgen.',
  products:'Einkaufspreis je Einheit, netto. Richtwerte sind Beispielpreise, bis Sie sie bestätigen.',
  report:'Kassendaten einlesen, Renner und Verlierer sehen.',
  setup:'Betrieb, Team, Cloud, Sicherung.',
  pcheck:'Produkt für Produkt: echten Preis eintippen oder Richtwert bestätigen. Enter geht weiter.',
});
delete WOZU.dash;

/* ---------- Hinweise: höchstens eine ruhige Zeile unter dem Titel ---------- */
demoNote = () => '';
injectDashStrip = function(){};
injectWozu = function(){
  const t = view.tab; const txt = WOZU[t]; if(!txt || view.card) return;
  const ph = $('#app .page-h'); if(!ph) return;
  const h1 = ph.querySelector('h1'); if(!h1) return;
  if(!h1.querySelector('.wozu-q')) h1.insertAdjacentHTML('beforeend', `<button type="button" class="wozu-q ${WOZU_OFF[t]?'':'on'}" data-act="wozuToggle" data-id="${t}" title="${WOZU_OFF[t]?'Hinweis zeigen':'Hinweis ausblenden'}" aria-label="Hinweis zum Bereich">${ico('help')}</button>`);
  if(WOZU_OFF[t]) return;
  if(!h1.parentNode.querySelector('.sub')) h1.insertAdjacentHTML('afterend', `<p class="sub">${esc(txt)}</p>`);
};
/* Vorzeile über dem Titel: weg. Nur bei Listen bleibt die Anzahl, ruhig hinter dem Titel. */
const COUNT_TABS = {menu:()=>S.menu.length, stock:()=>stockProducts().length, products:()=>S.products.filter(p=>!p.noStock).length};
function tidyHead(){
  const ph = $('#app .page-h'); if(!ph) return;
  const eb = ph.querySelector(':scope > div > .eyebrow'); if(!eb) return;
  const h1 = ph.querySelector('h1'); const cnt = COUNT_TABS[view.tab];
  if(h1 && cnt && !h1.querySelector('.h-n')){ const q = h1.querySelector('.wozu-q'); const n = document.createElement('span'); n.className = 'h-n'; n.textContent = num(cnt()); q ? h1.insertBefore(n, q) : h1.appendChild(n); }
  eb.remove();
}
const _renderPolish = render;
render = function(){
  _renderPolish();
  tidyHead();
  if(view.tab === 'report'){ document.querySelectorAll('#app .note').forEach(n => n.remove()); if(S.salesDemo){ const sub = $('#app .page-h .sub'); if(sub) sub.textContent = 'Demodaten: erfundene Verkäufe, bis zum ersten echten Kassen-Import.'; } }
  if(view.tab === 'setup' && S.demo){ const sub = $('#app .page-h .sub'); if(sub) sub.textContent = 'Demodaten: Karte und Preise von dahuam202.at, Rezepturen und Bestände sind Richtwerte.'; }
};

/* ---------- Heute: Tagesblatt ---------- */
function dayRow(lead, main, sub, meta, act, cls=''){
  return `<li class="rw ${cls}"><span class="rw-lead">${lead}</span><span class="rw-main"><b>${main}</b>${sub?`<small>${sub}</small>`:''}</span><span class="rw-meta">${meta||''}</span><span class="rw-act">${act||''}</span></li>`;
}
function daySec(title, sub, rowsHtml){ return `<section class="day-sec"><h2 class="day-h">${title}${sub?`<span>${sub}</span>`:''}</h2><ul class="rows">${rowsHtml}</ul></section>`; }
renderDash = function(){
  const t = todayStr(), w = wd(t), now = nowMin();
  const closed = (S.settings.closed||[]).includes(w);
  const sk = seasonFor(t); const sTitle = sk && S.settings.seasons && S.settings.seasons[sk] ? S.settings.seasons[sk].title : '';
  const all = S.menu.map(m => ({m, k:menuCalc(m)}));
  const linked = all.filter(x => x.k.cost != null).sort((a,b)=>b.k.fc-a.k.fc);
  const avg = linked.length ? linked.reduce((s,x)=>s+x.k.fc,0)/linked.length : null;
  const tg = +S.settings.target; const over = linked.filter(x => x.k.fc > tg);
  const low = lowStock(); const lastInv = S.inventories[0];
  const scale = Math.max(40, Math.ceil(((linked[0]?.k.fc)||0)/10)*10 + 5);
  const sups = (S.suppliers||[]).filter(s=>s.active);
  const due = sups.filter(sp => sp.orderDays.includes(w)).sort((a,b)=>hm(a.cutoff)-hm(b.cutoff));
  const exp = (S.orders||[]).filter(o => ['sent','confirmed'].includes(o.status) && o.deliveryDate <= t).sort((a,b)=>a.deliveryDate.localeCompare(b.deliveryDate));
  const live = specialsFor(t);
  const dayDishes = S.menu.filter(m => !m.hidden && m.days && m.days.length && m.days.includes(w));
  const nextSp = S.specials.filter(sp => spStatus(sp)[0]==='soon').sort((a,b)=>a.from.localeCompare(b.from))[0];
  const o = gameOverall();
  const dateStr = new Date().toLocaleDateString('de-AT',{weekday:'long', day:'numeric', month:'long'});
  // Stand je Lieferant kommt aus supToday(), genau wie im Einkauf
  const dueSt = due.map(sp => ({sp, st: supToday(sp)}));
  const openDue = dueSt.filter(x => x.st.state === 'open'), sentDue = dueSt.filter(x => x.st.state === 'sent'), pastDue = dueSt.filter(x => x.st.state === 'past');
  const orderInfo = !due.length ? 'kein Bestelltag' : openDue.length ? `${openDue.length} ${openDue.length===1?'Bestellung':'Bestellungen'} offen, bis ${esc(openDue[openDue.length-1].sp.cutoff)} Uhr` : pastDue.length ? `Annahmeschluss vorbei${sentDue.length ? `, ${sentDue.length} bestellt` : ''}` : 'alles bestellt';
  const subParts = [closed ? `${DAYNAME[w]} ist Ruhetag` : 'Servicetag', sTitle, orderInfo];
  const orderRow = ({sp, st}) => {
    const lowN = lowStock().filter(p=>p.supplier===sp.id).length; const val = lowStock().filter(p=>p.supplier===sp.id).reduce((a,p)=>a+packSuggest(p)*(p.packQty||1)*p.price,0);
    const sub = `${CHANNELS[sp.channel]} · Lieferung ${dayLabel(st.delivery)}${lowN?` · ${lowN} unter Mindestbestand, ${eur(val)}`:''}`;
    const meta = st.state === 'open' ? `<span class="${st.urgent ? 'bad-t' : ''}">${esc(st.label)}</span>` : esc(st.label);
    const act = st.state === 'sent' ? '' : st.draft ? `<button type="button" class="btn sm" data-act="ordOpen" data-id="${st.draft.id}">Entwurf öffnen</button>` : st.state === 'past' ? `<button type="button" class="btn sm" data-act="ordNew" data-id="${sp.id}">Für ${esc(dayLabel(st.delivery).split(',')[0])} vorbereiten</button>` : `<button type="button" class="btn sm" data-act="ordNew" data-id="${sp.id}">Vorbereiten</button>`;
    return dayRow(`bis ${esc(sp.cutoff)}`, esc(sp.name), sub, meta, act, st.state === 'open' ? '' : 'past');
  };
  const pastLine = pastDue.length ? `<li class="rw past rw-fold"><button type="button" class="rw-more" data-act="dashPast" aria-expanded="${view.dashPast?'true':'false'}">Annahmeschluss heute vorbei: ${pastDue.length} ${pastDue.length===1?'Lieferant':'Lieferanten'} · ${view.dashPast?'ausblenden':'anzeigen'}</button></li>` + (view.dashPast ? pastDue.map(orderRow).join('') : '') : '';
  const orderRows = [...openDue, ...sentDue].map(orderRow).join('');
  const recvRows = exp.map(o => { const sp = SUP(o.supplier); const late = o.deliveryDate < t;
    return dayRow(late ? `<span class="bad-t">${fmtDate(o.deliveryDate+'T12:00:00').slice(0,6)}</span>` : 'heute', esc(sp ? sp.name : '?'), `${o.no} · ${o.lines.length} Positionen · ${eur(orderTotal(o))}${late?' · überfällig':''}`, statusPill(o.status), `<button type="button" class="btn sm" data-act="ordRecv" data-id="${o.id}">Wareneingang</button>`); }).join('');
  const cardRows = [
    ...live.map(sp => dayRow('Aktion', esc(sp.name), `${sp.items.length} ${sp.items.length===1?'Gericht':'Gerichte'}${sp.to && sp.to!==sp.from ? ` · bis ${fmtDate(sp.to+'T12:00:00')}` : ''}`, '', `<button type="button" class="btn sm" data-act="previewSpecial" data-id="${sp.id}">Karte</button>`)),
    ...dayDishes.map(m => dayRow(DAYNAME[w].slice(0,2), esc(dishLabel(m)), `${esc(m.section)} · ${eur(m.price)}`, '', m.card && C(m.card) ? `<button type="button" class="btn sm" data-act="openCard" data-id="${m.card}">Rezeptur</button>` : '')),
    ...(nextSp && !live.length ? [dayRow(fmtDate(nextSp.from+'T12:00:00').slice(0,6), esc(nextSp.name), spStatus(nextSp)[1], '', `<button type="button" class="btn sm" data-act="previewSpecial" data-id="${nextSp.id}">Vorschau</button>`, 'past')] : []),
  ].join('');
  const openRows = [
    S.menu.length-linked.length ? dayRow(num(S.menu.length-linked.length), 'Gerichte ohne Rezeptur', '', '', `<button type="button" class="btn sm" data-act="goMenu" data-id="none">Ansehen</button>`) : '',
    S.menu.filter(m=>!hasAlg(m)).length ? dayRow(num(S.menu.filter(m=>!hasAlg(m)).length), 'Gerichte ohne Allergenangabe', '', '', `<button type="button" class="btn sm" data-act="goMenu" data-id="noalg">Ansehen</button>`) : '',
    over.length ? dayRow(`<span class="bad-t">${over.length}</span>`, `Gerichte über ${num(tg)} % Wareneinsatz`, '', '', `<button type="button" class="btn sm" data-act="goMenu" data-id="over">Ansehen</button>`) : '',
    low.length ? dayRow(num(low.length), 'Artikel unter Mindestbestand', '', '', `<button type="button" class="btn sm" data-act="goStock" data-id="bestellung">Bestellen</button>`) : '',
    dayRow(S.invDraft ? '…' : ico('clip'), S.invDraft ? 'Inventur läuft' : 'Inventur', lastInv ? `zuletzt ${fmtDate(lastInv.date)}` : 'noch keine', '', `<button type="button" class="btn sm" data-act="goStock" data-id="inventur">${S.invDraft?'Fortsetzen':'Zählen'}</button>`),
    o.pct < 100 ? dayRow(`${o.pct} %`, 'Aufbau', o.next ? `Stufe ${o.lvl+1} ${esc(o.lvlName)} · als Nächstes ${esc(o.next.name)}` : '', '', `<button type="button" class="btn sm" data-act="goTab" data-id="aufbau">Weiter</button>`) : '',
  ].join('');

  return `<div class="page-h"><div><h1>${dateStr}</h1><p class="sub">${subParts.filter(Boolean).join(' · ')}</p></div>
    <div class="row-btns"><button type="button" class="btn" data-act="sales">Verkäufe buchen</button><button type="button" class="btn primary" data-act="moveDlg" data-id="in">${ico('truck')}Wareneingang</button></div></div>
  <div class="day">
    ${openDue.length ? daySec('Bestellen', `${openDue.length} offen, Annahmeschluss`, orderRows + pastLine) : ''}
    ${recvRows ? daySec('Lieferungen prüfen', '', recvRows) : ''}
    ${!openDue.length && (orderRows || pastLine) ? daySec('Bestellen', sentDue.length ? `${sentDue.length} heute bestellt` : 'heute nichts mehr offen', orderRows + pastLine) : ''}
    ${cardRows ? daySec(live.length || dayDishes.length ? 'Heute auf der Karte' : 'Demnächst', '', cardRows) : ''}
    <div class="tiles">
      <div class="tile"><div><div class="t-l">Ø Wareneinsatz</div><div class="t-v ${avg!=null && avg > tg ? 'bad-t' : ''}">${avg==null?'—':num(avg,1)+' %'}</div><div class="t-s">Ziel ${num(tg)} %</div></div></div>
      <div class="tile"><div><div class="t-l">Kalkuliert</div><div class="t-v">${linked.length}<small> / ${S.menu.length}</small></div><div class="t-s">Gerichte mit Rezeptur</div></div></div>
      <button type="button" class="tile click" data-act="goStock" data-id="bestand"><div><div class="t-l">Lagerwert</div><div class="t-v">${eur(stockValue())}</div><div class="t-s">${lastInv?'Inventur '+fmtDate(lastInv.date):'noch keine Inventur'}</div></div></button>
      <button type="button" class="tile click" data-act="goStock" data-id="bestellung"><div><div class="t-l">Unter Mindestbestand</div><div class="t-v">${low.length}</div><div class="t-s">${low.length?'Bestellvorschlag':'alles vorrätig'}</div></div></button>
    </div>
    <div class="day-grid">
      <section class="panel">
        <div class="panel-h"><h2>Wareneinsatz je Gericht</h2><span class="legend"><i class="tl"></i>Ziel ${num(tg)} %</span></div>
        <div class="bars" style="--tg:${(tg/scale*100).toFixed(2)}%">
          ${linked.slice(0,12).map(({m,k})=>`<button type="button" class="bar-r" data-act="openCard" data-id="${k.c.id}" title="${esc(dishLabel(m))}"><span class="bar-n">${esc(dishLabel(m))}</span><span class="bar-t"><i class="${fcClass(k.fc)}" style="width:${Math.min(100,k.fc/scale*100).toFixed(2)}%"></i></span><span class="bar-v">${num(k.fc,1)} %</span></button>`).join('') || '<div class="empty">Noch keine Gerichte kalkuliert.</div>'}
          <div class="bar-axis"><span></span><span class="ax"><i>0 %</i><i>${num(scale/2)} %</i><i>${num(scale)} %</i></span><span></span></div>
        </div>
      </section>
      ${daySec('Offen', '', openRows)}
    </div>
  </div>`;
};

/* ---------- Aufbau: Liste statt Bühne ---------- */
renderAufbau = function(){
  const o = gameOverall(); const nx = o.next;
  const row = s => { const st = s.pct >= 100 ? 'done' : (nx && nx.k === s.k) ? 'active' : 'open';
    return `<li class="au-row ${st}">
      <span class="au-n">${s.pct>=100 ? ico('check') : s.no}</span>
      <span class="au-t"><b>${esc(s.name)}${st==='active'?'<em>jetzt dran</em>':''}</b><small>${esc(s.wozu)}</small></span>
      <span class="au-p"><span>${esc(s.metric)}</span><span class="au-m"><i style="width:${s.pct}%"></i></span></span>
      <span class="au-a">${st==='done' ? `<button type="button" class="btn sm" data-act="${s.act.a}" data-id="${esc(s.act.id)}">${esc(s.act.l)}</button>` : `<button type="button" class="btn sm ${st==='active'?'primary':''}" data-act="${s.act.a}" data-id="${esc(s.act.id)}">${esc(s.act.l)}</button>`}</span>
    </li>`; };
  return `<div class="page-h"><div><h1>Aufbau</h1></div>
    <div class="row-btns">${nx ? `<button type="button" class="btn primary" data-act="${nx.act.a}" data-id="${esc(nx.act.id)}">${esc(nx.act.l)}</button>` : ''}</div></div>
  <div class="au-sum"><span class="au-m big"><i style="width:${o.pct}%"></i></span><span class="au-sum-t"><b>${o.pct} %</b> · Stufe ${o.lvl+1} von ${LEVELS.length}, ${esc(o.lvlName)} · ${o.doneN} von ${o.st.length} Stationen fertig${o.pct>=100?' · alles steht':''}</span></div>
  <ol class="au-list">${o.st.map(row).join('')}</ol>`;
};

/* ---------- Zahlen: Komma-Eingabe zuerst normalisieren, dann rechnen die alten Handler ---------- */
/* Ungültig (Buchstaben, negativ, außerhalb des Bereichs, leer bei Pflichtfeldern): alter Wert bleibt, kurzer Hinweis, kein Handler läuft.
   data-num: "req" = darf nicht leer sein, "price" = Preis-Hinweis, "de" = Anzeige bleibt deutsch (Handler liest selbst mit numParse). */
function numReject(t, e){
  if(e) e.stopImmediatePropagation();
  t.value = t.dataset.old != null ? t.dataset.old : t.defaultValue;
  t.classList.add('bad-in'); setTimeout(() => t.classList.remove('bad-in'), 1600);
  toast(t.dataset.msg || ((t.dataset.num||'').includes('price') ? 'Ungültiger Preis, nicht geändert' : 'Ungültige Eingabe, nicht geändert'));
}
window.addEventListener('change', e => { const t = e.target; if(!t || !t.classList || !t.classList.contains('num-in') || t.closest('#dlgForm')) return;
  const kind = t.dataset.num || ''; const raw = t.value.trim(); if(kind.includes('self')) return;
  if(raw === ''){ if(kind.includes('req')) numReject(t, e); return; }
  const v = numParse(raw); const min = t.dataset.min != null ? +t.dataset.min : 0, max = t.dataset.max != null ? +t.dataset.max : Infinity;
  if(!isFinite(v) || v < min || v > max){ numReject(t, e); return; }
  if(!kind.includes('de')) t.value = String(v);
}, true);
document.addEventListener('focusin', e => { if(e.target.matches && e.target.matches('input.lt-price')) setTimeout(() => e.target.select(), 0); });

/* ---------- Bedienung ---------- */
document.addEventListener('keydown', e => {
  if(e.key !== '/' || e.target.closest('input,textarea,select,[contenteditable]') || !$('#pal').hidden || $('#dlg').open) return;
  const s = document.querySelector('#app #mq, #app #cq, #app #pq, #app #labIn, #app #shelfQ'); if(!s) return;
  e.preventDefault(); e.stopImmediatePropagation(); s.focus(); s.select();
}, true);
document.addEventListener('change', e => { const t = e.target; if(t.dataset && t.dataset.sel === 'sec'){ view.sec = t.value; render(); } });
document.addEventListener('click', e => { const b = e.target.closest('[data-act="dashPast"]'); if(b){ view.dashPast = !view.dashPast; render(); } });
document.addEventListener('click', e => { if(e.target.closest('tr.row') && e.target.closest('input,select,textarea,label,a')) e.stopPropagation(); }, true);

/* ---------- Speisekarte: Karten-Ansicht mit derselben Werkzeugleiste wie Liste/Kompakt ---------- */
function menuShownIds(){
  const q = view.q.trim().toLowerCase(), f = view.sec;
  return new Set(menuSorted().map(m => ({m, k:menuCalc(m)})).filter(({m,k}) => (!q || (m.name+' '+m.desc+' '+m.section+' '+(k.t?k.t.lines.map(l=>l.name).join(' '):'')).toLowerCase().includes(q))
    && (f==='all' || (f==='none' ? k.cost==null : f==='over' ? (k.fc!=null && k.fc > S.settings.target) : f==='nophoto' ? !menuImg(m) : f==='noalg' ? !hasAlg(m) : SEASONS.some(x=>x[0]===f) ? m.seasons.includes(f) : m.section===f))).map(x => x.m.id));
}
const _rmcPolish = renderMenuCalc;
renderMenuCalc = function(){
  if(vmode('menu') !== 'cards') return _rmcPolish();
  VIEWS.menu = 'list'; const swList = vsw('menu'); let head; try { head = _rmcPolish(); } finally { VIEWS.menu = 'cards'; }
  head = head.replace(swList, vsw('menu'));
  const cut = head.indexOf('<div class="lt-wrap');
  if(cut < 0) return head; // leerer Zustand: identisch zur Liste
  head = head.slice(0, cut);
  const ids = menuShownIds(); const q0 = view.q, s0 = view.sec; view.q = ''; view.sec = 'all';
  let full; try { full = _menuCalcCards(); } finally { view.q = q0; view.sec = s0; }
  const t = document.createElement('template'); t.innerHTML = full;
  t.content.querySelectorAll('.toolbar,.chips-row,.chips-wrap').forEach(n => n.remove());
  t.content.querySelectorAll('article.dish').forEach(a => { const id = a.querySelector('[data-act=editMenu]')?.dataset.id; if(!ids.has(id)) a.remove(); });
  t.content.querySelectorAll('.dish-grid').forEach(g => { if(!g.querySelector('article')){ const h = g.previousElementSibling; if(h && h.classList.contains('sec-h')) h.remove(); g.remove(); } });
  const box = document.createElement('div'); box.appendChild(t.content.cloneNode(true));
  return head + box.innerHTML;
};

/* =====================================================================
   PDF-Export: Speisekarte, Tageskarte, Rezeptur, Auswertung als A4-PDF.
   Funktioniert auch dort, wo window.print() gesperrt ist (eingebettet).
   ===================================================================== */
const PDF_LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];
let PDF_NAME = null;
function loadScript(src){ return new Promise((ok, no) => { if([...document.scripts].some(s => s.src === src)) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('Bibliothek konnte nicht geladen werden')); document.head.appendChild(s); }); }
async function pdfLibs(){ for(const s of PDF_LIBS) await loadScript(s); if(!window.html2canvas || !window.jspdf) throw new Error('PDF-Bibliothek fehlt'); }
async function saveFile(filename, data){
  try { const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
    if(dl){ try { await dl.save({filename, data}); return true; } catch(e){ if(e && e.code === 'declined') return false; if(e && !['unavailable','not_granted','capability_disabled','capability_removed'].includes(e.code)) { toast('Speichern nicht möglich: ' + (e.message || e.code)); return false; } } }
  } catch(e){}
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data])); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); return true;
}
function pdfFileName(base){ return (base || 'DAHUAM202').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-').slice(0, 80) + '.pdf'; }

async function exportPdf(filename){
  const el = $('#print'); if(!el || !el.innerHTML.trim()){ toast('Nichts zum Exportieren'); return; }
  toast('PDF wird erstellt …');
  try {
    await pdfLibs();
    el.classList.add('pdf'); if(document.fonts && document.fonts.ready) await document.fonts.ready;
    await Promise.all([...el.querySelectorAll('img')].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const W = el.offsetWidth, scale = 2;
    let blocks = [], cuts = [];
    // saubere Seitenumbrüche: nie mitten durch ein Gericht, eine Zeile oder einen Absatz
    const top = el.getBoundingClientRect().top; const H0 = el.scrollHeight;
    blocks = [...el.querySelectorAll('.wk-dish,.wk-item,.hk-item,.g-item,tr,li,p,h1,h2,h3,h4,figure,img,.pr-steps > *,.wk-legend,.wk-foot')].map(n => { const r = n.getBoundingClientRect(); return [Math.floor(r.top - top), Math.ceil(r.bottom - top)]; }).filter(([t,b]) => b > t);
    // Überschriften nie allein am Seitenende
    el.querySelectorAll('.wk-h,.wk-sp-h,.hk-sec-h,#print > h1,#print > h2,.pr-steps-h').forEach(n => { const r = n.getBoundingClientRect(); blocks.push([Math.floor(r.top - top), Math.ceil(r.bottom - top) + 90]); });
    cuts = [...new Set(blocks.flatMap(([t,b]) => [t - 1, b + 1]))].filter(c => c > 0 && !blocks.some(([t,b]) => t < c && c < b)).sort((a,b) => a-b);
    const canvas = await window.html2canvas(el, {scale, backgroundColor:'#ffffff', useCORS:true, logging:false, width:W, windowWidth:document.documentElement.clientWidth, windowHeight:window.innerHeight, scrollX:0, scrollY:-window.scrollY, onclone: doc => {
      // html2canvas-Fehler bei Versalien mit „ß“ u. ä. vermeiden: Großschreibung vorab ausführen
      const root = doc.getElementById('print'); if(!root) return; const win = doc.defaultView;
      root.querySelectorAll('*').forEach(n => { const tt = win.getComputedStyle(n).textTransform; if(tt && tt !== 'none'){ n.childNodes.forEach(t => { if(t.nodeType === 3) t.nodeValue = tt === 'uppercase' ? t.nodeValue.toUpperCase() : tt === 'lowercase' ? t.nodeValue.toLowerCase() : t.nodeValue; }); n.style.textTransform = 'none'; } });
    }});
    const H2 = Math.floor(canvas.height / scale); const k = H2 / H0; cuts = cuts.map(c => Math.round(c * k));
    const {jsPDF} = window.jspdf; const pdf = new jsPDF({unit:'pt', format:'a4', compress:true});
    const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
    const M = 26; // Seitenrand oben/unten in pt
    const pagePx = Math.floor(W * (ph - 2*M) / pw);
    let y = 0, page = 0;
    while(y < H2 - 2){
      if(page && H2 - y < 40) break; // nur noch Rahmenlinie übrig
      let end = Math.min(H2, y + pagePx);
      if(end < H2){ const c = cuts.filter(v => v > y + pagePx * .5 && v <= end).pop(); if(c) end = c; }
      const h = end - y; const part = document.createElement('canvas'); part.width = canvas.width; part.height = Math.round(h * scale);
      const g = part.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, part.width, part.height); g.drawImage(canvas, 0, Math.round(y * scale), canvas.width, part.height, 0, 0, canvas.width, part.height);
      if(page++) pdf.addPage();
      pdf.addImage(part.toDataURL('image/jpeg', .92), 'JPEG', 0, M, pw, h * pw / W);
      y = end;
    }
    const ok = await saveFile(filename, pdf.output('blob'));
    if(ok) toast(`PDF erstellt: ${filename} (${page} ${page===1?'Seite':'Seiten'})`);
  } catch(e){ toast('PDF fehlgeschlagen: ' + (e.message || e)); }
  finally { el.classList.remove('pdf'); }
}

/* window.print(): eingebettet (wo Drucken gesperrt ist) oder bei PDF-Knopf → PDF */
const _nativePrint = window.print ? window.print.bind(window) : null;
window.print = function(){ if(PDF_NAME || FRAMED || !_nativePrint){ const n = PDF_NAME || pdfFileName('DAHUAM202'); PDF_NAME = null; exportPdf(n); } else _nativePrint(); };

function pdfBtn(act, id, label){ return `<button type="button" class="btn" data-pdf="${act}" ${id?`data-id="${esc(id)}"`:''}>${ico('download')}${label||'PDF'}</button>`; }
ICO.download = ICO.download || '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>';
document.addEventListener('click', e => {
  const b = e.target.closest('[data-pdf]'); if(!b) return; e.preventDefault(); e.stopPropagation();
  const a = b.dataset.pdf, id = b.dataset.id;
  if(a === 'printMenu'){ const k = typeof curSeasonKey === 'function' ? curSeasonKey() : ''; PDF_NAME = pdfFileName(`Speisekarte-${S.settings.name.split(' ')[0]}-${k ? seasonName(k) : ''}-${view.gdate || todayStr()}`); printMenu(); }
  if(a === 'printCard'){ const c = C(id); PDF_NAME = pdfFileName('Rezeptur-' + (c ? c.name : id)); printCard(id); }
  if(a === 'printSpecial'){ const sp = S.specials.find(x => x.id === id); PDF_NAME = pdfFileName('Tageskarte-' + (sp ? sp.name : '')); $('#print').innerHTML = tageskarteHtml(sp); document.body.classList.add('print-menu'); window.print(); }
}, true);

/* Knöpfe einblenden */
const _renderMenuPdf = renderMenu;
renderMenu = function(){ let h = _renderMenuPdf();
  if(view.mtab === 'guest'){ const btns = pdfBtn('printMenu', '', 'Als PDF speichern') + (FRAMED ? '' : `<button type="button" class="btn" data-act="printMenu">${ico('print')}Drucken</button>`);
    h = h.replace(/<button type="button" class="btn" data-act="printMenu">[\s\S]*?<\/button>/, '');
    h = h.replace('<div class="row-btns">', '<div class="row-btns">' + btns); }
  return h; };
const _renderCardPdf = renderCard;
renderCard = function(c){ let h = _renderCardPdf(c); if(!/data-pdf="printCard"/.test(h)){ const m = h.match(/<button[^>]*data-act="printCard"[^>]*>[\s\S]*?<\/button>/); const b = `<button type="button" class="icon-btn lg" data-pdf="printCard" data-id="${c.id}" title="Rezeptur als PDF speichern" aria-label="Rezeptur als PDF speichern">${ico('download')}</button>`; h = m ? h.replace(m[0], (FRAMED ? '' : m[0]) + b) : h.replace(/<button type="button" class="icon-btn lg" data-act="dupCard"/, b + '<button type="button" class="icon-btn lg" data-act="dupCard"'); } return h; };


/* =====================================================================
   Hauskarte „Schiefer & Blattl“ – dritte Gestaltung der Gästekarte, Standard.
   Schiefer, Gold und Kreidetafel (Konzept C) mit Kapitelziffern, Haus-Favoriten
   und dem Tisch von oben (Konzept B). Echte A4-Blätter (794 × 1123 px):
   Gerichte werden vermessen und fließen auf weitere Blätter, nie geteilt.
   Texte: S.settings.menuCopy (vom Haus änderbar). Keine erfundenen Fakten.
   ===================================================================== */
const HS_W = 794, HS_H = 1123;
const HS_NAME = 'Hauskarte';
const HS_SEASON = {
  winter:   {ac:'#a9c3d6', ink:'#557890', gl:['snow','fir'],        word:'Jetzt im Winter'},
  fruehling:{ac:'#a8c97a', ink:'#5f7f3a', gl:['blossom','baerlauch'], word:'Jetzt im Frühling'},
  sommer:   {ac:'#86c5c0', ink:'#2f7b78', gl:['sun','wave'],        word:'Jetzt im Sommer'},
  herbst:   {ac:'#dd9150', ink:'#9a5620', gl:['leaf','mushroom'],   word:'Jetzt im Herbst'},
};
/* Standardtexte: nur Stimmung, keine Behauptungen. Alles im Reiter „Gestalten & PDF“ änderbar. */
const HS_COPY = {
  welcome: 'Servus und willkommen dahuam. Was gerade Saison hat, steht an der Tafel – mit Kreide, weil es sich ändert.',
  tafel: 'Heute an der Tafel',
  fav: 'Unsere Empfehlungen, quer durch die Karte.',
  back: 'Schön, dass Sie da sind. Lassen Sie sich Zeit.',
  sec: {
    'Flammkuchen': 'Dünn, heiß und knusprig.',
    'Zum Teilen': 'Für die Mitte vom Tisch.',
    'Suppen & Vorspeisen': 'Zum Ankommen und Aufwärmen.',
    'Salate & Bowls': 'Frisch und bunt – für alle, die es heute leichter mögen.',
    'Rösti': 'Außen knusprig, innen weich.',
    'Klassiker': 'Die Teller, auf die man sich schon am Heimweg freut.',
    'Burger, Pasta & Co.': 'Für den großen Hunger.',
    'Süßes': 'Ein bisserl was Süßes geht immer.',
    'Für Kinder': 'Kleine Portionen für große Augen.',
  },
};
function hsCopy(key, sec){
  const c = S.settings.menuCopy || {};
  if(key === 'sec'){ const v = c.sec && c.sec[sec]; return v != null ? v : (HS_COPY.sec[sec] || ''); }
  if(key === 'claim') return c.claim != null ? c.claim : WK_QUOTE;
  return c[key] != null ? c[key] : HS_COPY[key];
}
function hsStyle(){ const s = S.settings; return s.guestStylePick ? (s.guestStyle || 'haus') : 'haus'; }
function hausMigrate(d){
  const s = d.settings; if(!s) return d;
  if(!s.guestStylePick && (!s.guestStyle || s.guestStyle === 'web')) s.guestStyle = 'haus';
  if(!s.menuCopy || typeof s.menuCopy !== 'object') s.menuCopy = {};
  if(!s.menuCopy.sec || typeof s.menuCopy.sec !== 'object') s.menuCopy.sec = {};
  return d;
}

/* ---------- Schriften: Barlow Condensed (Titel, Preise), Fraunces (Ziffern, Namen, Fließtext), Caveat (nur Tafel) ---------- */
(function(){ const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Caveat:wght@400..600&display=swap'; document.head.appendChild(l); })();
const HS_FONTS = ['300 20px "Fraunces"','400 20px "Fraunces"','500 20px "Fraunces"','600 20px "Fraunces"','italic 300 20px "Fraunces"','italic 400 20px "Fraunces"','400 20px "Caveat"','600 20px "Caveat"','300 20px "Barlow Condensed"','400 20px "Barlow Condensed"','500 20px "Barlow Condensed"','600 20px "Barlow Condensed"'];

/* ---------- Linienzeichnungen (Gold), eigenständige SVGs mit festen Farben ---------- */
function hsSvg(inner, vb, w, h, color, sw){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner.replace(/currentColor/g, color)}</svg>`; }
const HS_ILL = {
  flammkuchen:'<path d="M8,54c0-12 14-22 34-22s34,10 34,22-14,22-34,22S8,66 8,54z"/><path d="M76,51h18a3,3 0 0 1 0,6h-18"/><path d="M14,54c0-9 12-16 28-16s28,7 28,16-12,16-28,16S14,63 14,54z" stroke-opacity=".8"/><path d="M24,52l7-2 2 4-7 2z M44,44l8 1-1 4-8-1z M56,58l7-3 2 4-7 3z M34,60l7 0 1 4-7 0z M50,52l6 1 0 3-6-1z"/><circle cx="38" cy="50" r="2.2"/><circle cx="60" cy="49" r="1.9"/><circle cx="30" cy="58" r="1.7"/><circle cx="46" cy="64" r="1.8"/>',
  fondue:'<path d="M22,46h56l-5,25a9,7 0 0 1-9,6h-28a9,7 0 0 1-9-6z"/><ellipse cx="50" cy="46" rx="28" ry="5"/><path d="M78,50h9a4,4 0 0 1 0,8h-6"/><path d="M38,44l-8-23 M30,21l-3-6 M30,21l3-7 M30,21l0-8"/><path d="M27,23l5-3 3 5-5 3z"/><path d="M61,44l10-25 M71,19l-2-7 M71,19l4-6 M71,19l1-8"/><path d="M32,80h36 M36,80l-4,10h36l-4-10"/><path d="M50,89c-5-4-2-8 0-11 1 4 5 6 3 10-1 1-2 1-3 1z"/>',
  suppe:'<path d="M20,52h60c0,18-14,28-30,28s-30-10-30-28z"/><path d="M14,82h72"/><path d="M20,56h-8 M80,56h8"/><path d="M40,42c0-6 4-6 4-12s-4-6-4-12 M50,40c0-6 4-6 4-12s-4-6-4-12 M60,42c0-6 4-6 4-12s-4-6-4-12" stroke-opacity=".75"/><path d="M30,62c6 4 16 6 20 6s14-2 20-6" stroke-opacity=".5"/>',
  salat:'<path d="M18,56h64c0,16-12,27-32,27s-32-11-32-27z"/><path d="M16,84h68" stroke-opacity=".6"/><path d="M34,56c-4-14 6-24 16-26 2 10-4 22-16 26z M36,53c4-8 8-14 13-21"/><path d="M60,56c8-10 10-22 2-30-8 8-10 20-2 30z M61,53c0-8 1-16 2-25"/><circle cx="48" cy="48" r="6"/><path d="M28,64c10 3 34 3 44 0" stroke-opacity=".5"/>',
  roesti:'<circle cx="44" cy="54" r="27"/><circle cx="44" cy="54" r="21"/><path d="M70,51h24 M70,57h24 M94,51v6"/><path d="M33,45l6 3 M42,40l4 6 M53,45l-5 4 M34,59l7-2 M50,60l6 3 M38,66l5-3 M55,53l6-2 M28,52l5 1" stroke-opacity=".8"/><circle cx="44" cy="54" r="5"/>',
  teller:'<circle cx="50" cy="52" r="26"/><circle cx="50" cy="52" r="19"/><path d="M16,26v52 M12,26v12a4,4 0 0 0 8,0v-12 M16,26v12"/><path d="M84,26v52 M84,26c-6,8-6,20 0,26"/><path d="M38,52c3-6 9-9 12-9s9 3 12 9" stroke-opacity=".5"/>',
  burger:'<path d="M22,46a28,20 0 0 1 56,0z"/><path d="M38,36l3-2 M48,32l3-1 M58,36l3 1 M44,40l3 0 M54,40l3-1 M34,42l2-1 M64,42l2 1"/><path d="M20,50q5,5 10,0t10,0t10,0t10,0t10,0t10,0"/><rect x="22" y="54" width="56" height="8" rx="4"/><path d="M22,66h56v4a8,8 0 0 1-8,8h-40a8,8 0 0 1-8-8z"/>',
  schmarrn:'<circle cx="52" cy="54" r="27"/><path d="M26,50h-18 M26,58h-18 M8,50v8"/><path d="M38,44l10-3 3 9-10 3z M54,40l9 2-2 9-9-2z M40,60l9-1 2 8-9 1z M56,58l8 3-4 8-7-3z M63,48l7 1 0 7-7-1z"/><circle cx="35" cy="37" r=".9"/><circle cx="46" cy="33" r=".9"/><circle cx="60" cy="31" r=".9"/><circle cx="70" cy="38" r=".9"/><circle cx="74" cy="60" r=".9"/><circle cx="33" cy="68" r=".9"/><circle cx="52" cy="72" r=".9"/>',
  krake:'<path d="M32,24a14,14 0 0 1 28,0v28h-28z"/><path d="M34,52c-2,10-8,14-12,22 M40,52c-1,10-4,16-6,24 M46,52c0,10 0,16 0,24 M52,52c1,10 4,16 6,24 M58,52c2,10 8,14 12,22"/><circle cx="40" cy="30" r="1.6" fill="currentColor" stroke="none"/><circle cx="52" cy="30" r="1.6" fill="currentColor" stroke="none"/><path d="M41,38q5,4 10,0"/><path d="M70,64h22l-3,16h-16z"/><path d="M75,64l4-14 M81,64l1-14 M87,64l-2-13"/>',
};
const HS_ILL_FOR = [[/flamm/i,'flammkuchen'],[/teil|fondue/i,'fondue'],[/supp|vorsp/i,'suppe'],[/salat|bowl/i,'salat'],[/rösti|roesti/i,'roesti'],[/burger|pasta/i,'burger'],[/süß|suess|dessert|nachsp/i,'schmarrn'],[/kind/i,'krake']];
function hsIll(name, size, color, sw){ const k = (HS_ILL_FOR.find(([re]) => re.test(name)) || [,'teller'])[1]; return hsSvg(HS_ILL[k], '0 0 100 100', size, size, color, sw || 1.5); }
const HS_GLYPH = {
  snow:'<path d="M12,2v20 M3.3,7l17.4,10 M3.3,17l17.4-10 M12,2l-2.5,2.5 M12,2l2.5,2.5 M12,22l-2.5-2.5 M12,22l2.5-2.5 M3.3,7l3.4-.9 M3.3,7l.9,3.4 M20.7,17l-3.4,.9 M20.7,17l-.9-3.4 M3.3,17l3.4,.9 M3.3,17l.9-3.4 M20.7,7l-3.4-.9 M20.7,7l-.9,3.4"/>',
  fir:'<path d="M12,3v18 M12,7l-4,4 M12,7l4,4 M12,11l-5,5 M12,11l5,5 M12,15l-6,6 M12,15l6,6"/>',
  leaf:'<path d="M4,20C4,10 12,4 20,4C20,12 14,20 4,20z M4,20L18,6"/>',
  mushroom:'<path d="M3,12a9,7 0 0 1 18,0z M9,12v6a3,3 0 0 0 6,0v-6"/>',
  baerlauch:'<path d="M12,22C6,16 6,8 12,2C18,8 18,16 12,22z M12,22V2"/>',
  blossom:'<circle cx="12" cy="12" r="2.5"/><path d="M12,9.5c0-4-3-6-3-6s-1,4 3,6z M14.5,12c4,0 6-3 6-3s-4-1-6,3z M12,14.5c0,4 3,6 3,6s1-4-3-6z M9.5,12c-4,0-6,3-6,3s4,1 6-3z"/>',
  sun:'<circle cx="12" cy="12" r="5"/><path d="M12,2v3 M12,19v3 M2,12h3 M19,12h3 M5,5l2,2 M17,17l2,2 M5,19l2-2 M17,7l2-2"/>',
  wave:'<path d="M2,10q3-4 6,0t6,0t6,0 M2,16q3-4 6,0t6,0t6,0"/>',
};
function hsGl(name, size, color, sw){ return hsSvg(HS_GLYPH[name], '0 0 24 24', size, size, color, sw || 1.6); }
/* Bergkamm, je Saison anders geschmückt */
function hsRidge(season, w, color, sw){
  const peaks = 'M0,112 L48,84 L82,96 L128,56 L162,80 L200,66 L252,28 L296,70 L336,46 L380,86 L430,58 L470,74 L522,38 L560,76 L600,60';
  const back = 'M0,100 C90,70 150,96 230,62 C300,34 330,70 410,50 C470,36 520,72 600,50';
  const hatch = 'M252,28 L246,44 M296,70 L302,56 M522,38 L516,54 M128,56 L124,70 M380,86 L386,72';
  let deco = '';
  if(season === 'winter'){
    const dots = []; let s = 7;
    for(let i = 0; i < 46; i++){ s = (s*9301+49297)%233280; const x = (s/233280)*600; s = (s*9301+49297)%233280; const y = 4+(s/233280)*70; dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1"/>`); }
    const fir = (x,y,h) => `<path d="M${x},${y} v-${h} M${x},${y-h+h*.25} l-${h*.22},${h*.22} M${x},${y-h+h*.25} l${h*.22},${h*.22} M${x},${y-h+h*.5} l-${h*.3},${h*.3} M${x},${y-h+h*.5} l${h*.3},${h*.3} M${x},${y-h+h*.75} l-${h*.36},${h*.36} M${x},${y-h+h*.75} l${h*.36},${h*.36}"/>`;
    deco = `<g stroke-opacity=".7">${dots.join('')}</g>` + fir(30,120,16)+fir(44,122,12)+fir(560,120,14)+fir(576,122,18)+fir(590,121,11) + '<path d="M0,122c40-6 80 2 120-2 M480,120c40-6 80 2 120-2" stroke-opacity=".6"/>';
  } else if(season === 'herbst'){
    const larch = (x,y,h) => `<path d="M${x},${y} v-${h} M${x},${y-h+h*.2} q-${h*.18},${h*.18} -${h*.2},${h*.1} M${x},${y-h+h*.2} q${h*.18},${h*.18} ${h*.2},${h*.1} M${x},${y-h+h*.45} q-${h*.26},${h*.2} -${h*.3},${h*.08} M${x},${y-h+h*.45} q${h*.26},${h*.2} ${h*.3},${h*.08} M${x},${y-h+h*.7} q-${h*.32},${h*.22} -${h*.38},${h*.06} M${x},${y-h+h*.7} q${h*.32},${h*.22} ${h*.38},${h*.06}"/>`;
    const leaf = (x,y,r) => `<g transform="translate(${x},${y}) rotate(${r})"><path d="M-5,4C-5,-1 -1,-5 5,-5C5,1 1,5 -5,4z M-5,4L4,-4"/></g>`;
    deco = larch(28,120,22)+larch(48,122,16)+larch(552,121,18)+larch(574,123,24)+larch(592,121,13) + `<g stroke-opacity=".8">${leaf(90,30,20)}${leaf(140,20,-30)}${leaf(455,24,40)}${leaf(500,14,-15)}${leaf(330,22,10)}</g>` + '<path d="M0,122c40-6 80 2 120-2 M480,120c40-6 80 2 120-2" stroke-opacity=".6"/>';
  } else if(season === 'fruehling'){
    deco = '<path d="M20,122c20-4 40-4 60 0 M520,122c20-4 40-4 60 0" stroke-opacity=".6"/><g stroke-opacity=".8"><path d="M40,120c-4-8-2-16 4-22 4 6 4 14 0 22 M56,122c-4-6-2-12 3-16 3 4 3 10-1 16 M548,121c-4-8-2-16 4-22 4 6 4 14 0 22 M566,122c-4-6-2-12 3-16 3 4 3 10-1 16"/></g>';
  } else {
    deco = '<circle cx="470" cy="20" r="9"/><path d="M470,4v4 M470,32v4 M454,20h4 M482,20h4 M459,9l3,3 M478,28l3,3 M459,31l3-3 M478,12l3-3" stroke-opacity=".8"/><path d="M0,124q10-5 20,0t20,0t20,0t20,0t20,0t20,0 M480,124q10-5 20,0t20,0t20,0t20,0t20,0t20,0" stroke-opacity=".6"/>';
  }
  return hsSvg(`<path d="${back}" stroke-opacity=".45"/><path d="${peaks}"/><path d="${hatch}" stroke-opacity=".6"/>${deco}`, '0 0 600 130', w, Math.round(w*130/600), color, sw || 1.2);
}

/* ---------- Bilder aus dem Canvas: Schiefer mit Kerzenlicht, Holztisch, Teller, Duoton-Fotos ---------- */
const HS_SRC = {logo:'brand/logo.svg', slate:'brand/slate.webp', wood:'brand/table.webp', fork:'brand/fork.webp', knife:'brand/knife.webp', stube:'photos/unmatched/gaststube.webp', aussen:'photos/unmatched/aussen-winter.webp', fondue:'photos/unmatched/silvesterabend-fondue.webp'};
const HS_A = {};            // fertige Daten-URLs
const HS_RAW = {};          // geladene Bilder
let HS_READY = false, HS_BASE_P = null; const HS_COVER_P = {}, HS_COVER_DONE = new Set();
function hsLoadImg(src){ return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('Bild fehlt: ' + src)); i.src = src; }); }
function hsUrl(c, type, q){ const d = c.toDataURL(type, q); try { const [h, b] = d.split(','); const bin = atob(b); const u = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return URL.createObjectURL(new Blob([u], {type:h.slice(5).split(';')[0]})); } catch(e){ return d; } }
function hsCan(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function hsDrawCover(g, img, W, H, fx, fy){ const r = Math.max(W/img.width, H/img.height); const w = img.width*r, h = img.height*r; g.drawImage(img, (W-w)*(fx==null?.5:fx), (H-h)*(fy==null?.5:fy), w, h); }
function hsDuotone(g, W, H, lo, hi, contrast, lift){
  const d = g.getImageData(0, 0, W, H), a = d.data;
  for(let i = 0; i < a.length; i += 4){ let l = (.299*a[i] + .587*a[i+1] + .114*a[i+2])/255; l = Math.min(1, Math.max(0, (l-.5)*(contrast||1) + .5 + (lift||0))); l = l*l*(3-2*l)*.5 + l*.5; a[i] = lo[0]+(hi[0]-lo[0])*l; a[i+1] = lo[1]+(hi[1]-lo[1])*l; a[i+2] = lo[2]+(hi[2]-lo[2])*l; }
  g.putImageData(d, 0, 0);
}
function hsVignette(g, W, H, warm, dark){
  let gr = g.createRadialGradient(W/2, H*.2, 0, W/2, H*.2, W*.95); gr.addColorStop(0, `rgba(255,196,120,${warm})`); gr.addColorStop(1, 'rgba(255,196,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  gr = g.createRadialGradient(W/2, H/2, H*.34, W/2, H/2, H*.74); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${dark})`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
function hsBase(){
  if(HS_BASE_P) return HS_BASE_P;
  HS_BASE_P = (async () => {
    try { await Promise.all(HS_FONTS.map(f => document.fonts.load(f, 'Äß09'))); } catch(e){}
    await Promise.all(Object.keys(HS_SRC).map(k => hsLoadImg(HS_SRC[k]).then(i => { HS_RAW[k] = i; }).catch(() => {})));
    try {
      const W = 1191, H = 1685;
      if(HS_RAW.slate){ const [c, g] = hsCan(W, H); hsDrawCover(g, HS_RAW.slate, W, H); g.fillStyle = 'rgba(12,13,16,.14)'; g.fillRect(0, 0, W, H); hsVignette(g, W, H, .09, .5); HS_A.slateC = c; HS_A.slate = hsUrl(c, 'image/jpeg', .86);
        const [c2, g2] = hsCan(900, 1100); hsDrawCover(g2, HS_RAW.slate, 900, 1100, .2, .3); g2.fillStyle = 'rgba(8,9,11,.42)'; g2.fillRect(0, 0, 900, 1100);
        for(const [x,y,r,a] of [[.3,.85,.5,.07],[.8,.2,.4,.05],[.55,.5,.6,.035]]){ const gr = g2.createRadialGradient(900*x, 1100*y, 0, 900*x, 1100*y, 900*r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 900, 1100); }
        let gr = g2.createRadialGradient(450, 550, 380, 450, 550, 760); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)'); g2.fillStyle = gr; g2.fillRect(0, 0, 900, 1100);
        HS_A.board = hsUrl(c2, 'image/jpeg', .86); }
      if(HS_RAW.wood){ const [c, g] = hsCan(W, H); hsDrawCover(g, HS_RAW.wood, W, H); g.fillStyle = 'rgba(30,17,8,.34)'; g.fillRect(0, 0, W, H); hsVignette(g, W, H, .05, .62); HS_A.wood = hsUrl(c, 'image/jpeg', .86); }
      { // Teller: weißes Porzellan mit Fahne und weichem Schatten
        const [c, g] = hsCan(640, 640); const cx = 320, cy = 310, R = 270;
        g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 34; g.shadowOffsetY = 16; g.fillStyle = '#e9e3d6'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.restore();
        let gr = g.createRadialGradient(cx-60, cy-80, 40, cx, cy, R); gr.addColorStop(0, '#fffdf8'); gr.addColorStop(.8, '#f4efe4'); gr.addColorStop(1, '#ddd5c5'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
        gr = g.createRadialGradient(cx, cy+6, R*.7, cx, cy, R*.8); gr.addColorStop(0, 'rgba(120,105,80,.0)'); gr.addColorStop(.55, 'rgba(120,105,80,.2)'); gr.addColorStop(1, 'rgba(120,105,80,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R*.82, 0, 7); g.fill();
        gr = g.createRadialGradient(cx-30, cy-40, 10, cx, cy, R*.74); gr.addColorStop(0, '#fffefb'); gr.addColorStop(1, '#f6f1e7'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R*.735, 0, 7); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R-2, 3.5, 5.2); g.stroke();
        HS_A.plate = hsUrl(c, 'image/png'); }
      for(const k of ['fork','knife']) if(HS_RAW[k]){ const i = HS_RAW[k]; const [c, g] = hsCan(i.width+70, i.height+50); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 20; g.shadowOffsetX = 10; g.shadowOffsetY = 12; g.drawImage(i, 25, 15); HS_A[k] = hsUrl(c, 'image/png'); }
      if(HS_RAW.stube){ const [c, g] = hsCan(1280, 600); hsDrawCover(g, HS_RAW.stube, 1280, 600, .5, .45); hsDuotone(g, 1280, 600, [26,24,24], [240,216,174], 1.12, -.02); HS_A.stube = hsUrl(c, 'image/jpeg', .86); }
      if(HS_RAW.fondue){ const [c, g] = hsCan(440, 784); hsDrawCover(g, HS_RAW.fondue, 440, 784, .5, .6); hsDuotone(g, 440, 784, [26,24,24], [240,216,174], 1.1, 0); HS_A.fondue = hsUrl(c, 'image/jpeg', .86); }
      if(HS_RAW.logo){ const [c, g] = hsCan(716, 731); g.drawImage(HS_RAW.logo, 0, 0, 716, 731); HS_A.logo = hsUrl(c, 'image/png'); const [e, eg] = hsCan(396, 396); eg.drawImage(c, -159, -39); HS_A.emblem = hsUrl(e, 'image/png'); }
      if(HS_A.slate) document.documentElement.style.setProperty('--hs-slate', `url("${HS_A.slate}")`);
      if(HS_A.wood) document.documentElement.style.setProperty('--hs-wood', `url("${HS_A.wood}")`);
      if(HS_A.board) document.documentElement.style.setProperty('--hs-board', `url("${HS_A.board}")`);
    } catch(e){ console.warn('Hauskarte: Bilder konnten nicht aufbereitet werden', e); }
    HS_READY = true;
  })();
  return HS_BASE_P;
}
/* Titelblatt: Foto (eigenes Titelbild der Saison, sonst im Winter das Haus im Schnee) als Duoton in den Schiefer geblendet */
function hsCoverKey(k){ const s = S.settings.seasons[k]; if(s.cover && IMG[s.cover]) return 'c:' + s.cover; return k === 'winter' ? 'aussen' : ''; }
function hsCoverBg(k){
  const key = hsCoverKey(k); if(!key) return Promise.resolve();
  if(HS_COVER_P[key]) return HS_COVER_P[key];
  return HS_COVER_P[key] = (async () => {
    await hsBase();
    try {
      const img = key === 'aussen' ? HS_RAW.aussen : await hsLoadImg(IMG[S.settings.seasons[k].cover]); if(!img || !HS_A.slateC) return;
      const W = 1191, H = 1685, y0 = Math.round(H*.235), bh = Math.round(H*.38);
      const [c, g] = hsCan(W, H); g.drawImage(HS_A.slateC, 0, 0);
      const [b, bg] = hsCan(W, bh); hsDrawCover(bg, img, W, bh, .5, .42); hsDuotone(bg, W, bh, [22,25,29], [214,186,142], 1.2, -.1);
      bg.globalCompositeOperation = 'destination-in'; const m = bg.createLinearGradient(0, 0, 0, bh); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(.1, 'rgba(0,0,0,.12)'); m.addColorStop(.3, 'rgba(0,0,0,.82)'); m.addColorStop(.52, 'rgba(0,0,0,.8)'); m.addColorStop(.8, 'rgba(0,0,0,.28)'); m.addColorStop(1, 'rgba(0,0,0,0)'); bg.fillStyle = m; bg.fillRect(0, 0, W, bh);
      g.drawImage(b, 0, y0);
      const v = g.createLinearGradient(0, 0, W, 0); v.addColorStop(0, 'rgba(20,22,26,.55)'); v.addColorStop(.18, 'rgba(20,22,26,0)'); v.addColorStop(.82, 'rgba(20,22,26,0)'); v.addColorStop(1, 'rgba(20,22,26,.55)'); g.fillStyle = v; g.fillRect(0, y0, W, bh);
      HS_A['cover:' + key] = hsUrl(c, 'image/jpeg', .88);
    } catch(e){ console.warn('Hauskarte: Titelbild', e); }
  })();
}
function hsAllReady(k){ const key = hsCoverKey(k); return HS_READY && (!key || HS_COVER_DONE.has(key)); }
function hsEnsure(k){ const key = hsCoverKey(k); return Promise.all([hsBase(), hsCoverBg(k)]).then(() => { if(key) HS_COVER_DONE.add(key); }); }

/* ---------- Bausteine ---------- */
const hsU = s => esc(String(s == null ? '' : s).toLocaleUpperCase('de-AT'));
const HS_MONTHS = ['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
function hsRange(a, b){ b = b || a; const [ya,ma,da] = a.split('-').map(Number), [yb,mb,db] = b.split('-').map(Number);
  if(a === b) return `${da}. ${HS_MONTHS[ma-1]}`; if(ma === mb) return `${da}.–${db}. ${HS_MONTHS[ma-1]}`; return `${da}. ${HS_MONTHS[ma-1]} – ${db}. ${HS_MONTHS[mb-1]}`; }
function hsTheme(k){ const d = HS_SEASON[k] || HS_SEASON.winter; const s = S.settings.seasons[k] || {}; let ac = d.ac, ink = d.ink;
  if(s.accent && /^#[0-9a-f]{6}$/i.test(s.accent) && s.accent.toLowerCase() !== (HK_ACCENT[k]||'').toLowerCase()){ const n = parseInt(s.accent.slice(1), 16), r = n>>16, g = n>>8&255, b = n&255; const mix = (c, t, f) => Math.round(c+(t-c)*f); const lum = (.299*r+.587*g+.114*b)/255;
    ink = lum > .5 ? `rgb(${mix(r,0,.4)},${mix(g,0,.4)},${mix(b,0,.4)})` : s.accent; ac = lum < .62 ? `rgb(${mix(r,255,.5)},${mix(g,255,.5)},${mix(b,255,.5)})` : s.accent; }
  return {ac, ink, gl:d.gl, word:d.word}; }
function hsInfo(e){
  const m = e.head, vars = e.vars, multi = vars.length > 1 || !!(m.group && m.vlabel);
  const alg = [...new Set(vars.flatMap(v => itemAlg(v)))].sort();
  const veg = vars.every(v => v.veg === 'vg') ? 'vg' : vars.every(v => v.veg === 'v' || v.veg === 'vg') ? 'v' : '';
  return {name:m.name, desc:[m.desc, hkDays(m)].filter(Boolean).join(' · '), alg, veg, top:vars.some(v => v.top), seasonal:vars.some(v => v.seasons && v.seasons.length),
    prices: multi ? vars.map(v => [v.vlabel || v.name, v.price]) : [['', m.price]], section:m.section};
}
function hsVeg(v){ return v === 'vg' ? '<span class="hs-veg">VEGAN</span>' : v === 'v' ? '<span class="hs-veg">VEG</span>' : ''; }
function hsAlg(a, used){ if(!a.length) return ''; a.forEach(x => used.add(x)); return `<span class="hs-al">${a.join(' ')}</span>`; }
function hsPrices(d){ const f = ([l, p]) => `<span class="hs-p">${l ? `<small>${esc(l)}</small>` : ''}${+p ? hkPrice(p) : ''}</span>`; return d.prices.length === 1 ? f(d.prices[0]) : `<span class="hs-ps">${d.prices.map(f).join('')}</span>`; }
function hsDish(d, x){
  const gl = d.seasonal ? `<span class="hs-gl">${hsGl(x.t.gl[0], 12, x.paper ? x.t.ink : x.t.ac)}</span>` : '';
  const al = hsAlg(d.alg, x.used);
  return `<div class="hs-d"><div class="hs-l"><span class="hs-n">${gl}${esc(d.name)}${hsVeg(d.veg)}</span><span class="hs-lead"></span>${hsPrices(d)}</div>${d.desc || al ? `<p class="hs-ds">${esc(d.desc)}${al}</p>` : ''}</div>`;
}
function hsFeat(d, x){
  const gl = d.seasonal ? `<span class="hs-gl">${hsGl(x.t.gl[0], 15, x.paper ? x.t.ink : x.t.ac)}</span>` : '';
  const al = hsAlg(d.alg, x.used);
  return `<div class="hs-feat"><span class="tab">EMPFEHLUNG DES HAUSES</span><i class="co a"></i><i class="co b"></i><i class="co c"></i><i class="co d"></i>
    <div><div class="fn">${gl}${esc(d.name)}${hsVeg(d.veg)}</div>${d.desc || al ? `<p class="hs-ds">${esc(d.desc)}${al}</p>` : ''}</div>${hsPrices(d)}</div>`;
}
function hsHost(){ let h = document.getElementById('hsMeasure'); if(!h){ h = document.createElement('div'); h.id = 'hsMeasure'; h.className = 'hs-measure'; h.setAttribute('aria-hidden', 'true'); document.body.appendChild(h); } return h; }
function hsEl(html){ const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function hsHead(x){ return `<header class="hs-ph"><span><b>${hsU(S.settings.name.split(' ')[0])}</b> ${hsU(S.settings.name.split(' ').slice(1).join(' '))}</span><span class="rr">${hsGl(x.t.gl[0], 14, x.t.ac)}${hsU(x.s.title)}</span></header>`; }
function hsFoot(left){ return `<footer class="hs-pf"><span>${left == null ? 'ALLERGENE &amp; ZEICHEN: SIEHE LETZTE SEITE' : left}</span><span class="n" data-hs-n></span></footer>`; }
function hsPage(x, cls, inner, o){ o = o || {}; const p = hsEl(`<article class="hs-page ${cls}" style="--ac:${x.t.ac};--ac-ink:${x.t.ink}${o.style ? ';' + o.style : ''}">${o.frame === false ? '' : '<div class="hs-frame"></div>'}${o.head === false ? '' : hsHead(x)}${inner}${o.foot === false ? '' : hsFoot(o.footLeft)}</article>`); x.host.appendChild(p); x.pages.push(p); return p; }

/* ---------- Blätter ---------- */
function hsCoverPage(x){
  const title = String(x.s.title || HK_TITLE[x.k] || 'Speisekarte'); const m = title.match(/^(.{3,}?)(karte)$/i);
  const bgKey = hsCoverKey(x.k), bg = bgKey && HS_A['cover:' + bgKey];
  const p = hsPage(x, 'hs-cover', `
    <div class="eb">${hsU(x.s.subtitle || HK_PLACE)}</div>
    <img class="hlogo" src="${HS_A.logo || 'brand/logo.svg'}" alt="${esc(S.settings.name)}">
    ${bg ? '' : `<div class="ridge">${hsRidge(x.k, HS_W, '#C59C69', 1.3)}</div>`}
    <div class="ttl"><div class="t1">${esc(m ? m[1] : title)}</div>${m ? `<div class="t2">${esc(m[2].toLowerCase())}</div>` : ''}
      <div class="yr"><i></i>${hsGl(x.t.gl[0], 16, x.t.ac)}<span>${esc(seasonYear(x.k, x.date))}</span>${hsGl(x.t.gl[1], 16, x.t.ac)}<i></i></div></div>
    ${hsCopy('claim') ? `<p class="claim">${esc(hsCopy('claim'))}</p>` : ''}
    ${S.settings.address ? `<p class="place">${hsU(S.settings.address)}</p>` : ''}
    <img class="cut fork" src="${HS_A.fork || HS_SRC.fork}" alt=""><img class="cut knife" src="${HS_A.knife || HS_SRC.knife}" alt="">`,
    {head:false, foot:false, style: bg ? `background-image:url('${bg}')` : ''});
  const t1 = p.querySelector('.t1'), t2 = p.querySelector('.t2'); let fs = 150;
  while(fs > 60 && t1.scrollWidth > 650){ fs -= 6; t1.style.fontSize = fs + 'px'; if(t2) t2.style.fontSize = Math.round(fs*.88) + 'px'; }
}
function hsTafelRow(d, x){ const al = hsAlg(d.alg, x.used);
  return `<div class="hs-tr"><div class="l"><span class="n">${esc(d.name)}${hsVeg(d.veg)}</span><span class="ld"></span><span class="p">${d.prices.map(([l,p]) => (l ? esc(l) + ' ' : '') + (+p ? hkPrice(p) : '')).join(' / ')}</span></div>${d.desc || al ? `<p class="d">${esc(d.desc)}${al}</p>` : ''}</div>`; }
function hsTafelPage(x){
  const seasonal = x.entries.filter(d => d.seasonal);
  const live = specialsFor(x.date);
  const until = addDays(x.date, 150);
  const soon = S.specials.filter(sp => sp.from > x.date && sp.from <= until).sort((a, b) => a.from < b.from ? -1 : 1).slice(0, 3);
  if(!seasonal.length && !live.length && !soon.length) return false;
  const chalk = '#efe9dc';
  const build = (list, c2, vm) => `
      <div class="hx">${esc(hsCopy('tafel'))}</div><div class="sq">${hsSvg('<path d="M2,7c20-6 30,4 50-1s40-6 60,0 30,4 50-2 40-4 56,1"/>', '0 0 220 12', 230, 12, 'rgba(228,203,159,.6)', 1.6)}</div>
      ${live.map(sp => `<div class="hs-tsub">${hsGl(x.t.gl[1], 20, x.t.ac)}${esc(sp.name)}<small>nur ${esc(hsRange(sp.from, sp.to))}${sp.note ? ' · ' + esc(sp.note) : ''}</small></div><div class="hs-tl">${hkEntries(sp.items.map(it => ({...it, id:'', top:false, group:'', days:[], seasons:[]}))).map(e => hsTafelRow(hsInfo(e), x)).join('')}</div>`).join('')}
      ${list.length ? `<div class="hs-tsub">${hsGl(x.t.gl[0], 20, x.t.ac)}${esc(x.t.word)}</div>${c2 ? `<div class="hs-tcols"><div class="hs-tl c2">${list.slice(0, Math.ceil(list.length/2)).map(d => hsTafelRow(d, x)).join('')}</div><div class="hs-tl c2">${list.slice(Math.ceil(list.length/2)).map(d => hsTafelRow(d, x)).join('')}</div></div>` : `<div class="hs-tl">${list.map(d => hsTafelRow(d, x)).join('')}</div>`}` : ''}
      ${vm.length ? `<div class="hs-tsub">${hsGl(x.t.gl[live.length ? 0 : 1], 20, x.t.ac)}Vormerken</div><div class="hs-vm">${vm.map(sp => `<span class="dt">${esc(hsRange(sp.from, sp.to))}</span><div><div class="vn">${esc(sp.name)}</div><p class="vi">${sp.items.map(i => esc(i.name)).join(' · ')}</p>${sp.note ? `<p class="vo">${esc(sp.note)}</p>` : ''}</div>`).join('')}</div>` : ''}
      <div class="mark">${hsSvg('<path d="M4,52 L22,30 L32,40 L48,14 L62,36 L70,28 L88,52"/><path d="M48,14 L45,26 M22,30 L24,38" stroke-opacity=".6"/><path d="M2,58c20-4 60-4 88,0" stroke-opacity=".5"/>', '0 0 92 62', 92, 62, 'rgba(239,233,220,.5)', 1.4)}</div>`;
  const welcome = hsCopy('welcome');
  const p = hsPage(x, 'hs-tafel', `<div class="hs-body">${welcome ? `<p class="hs-welcome">${esc(welcome)}</p>` : ''}<div class="hs-bframe"><div class="hs-board"></div></div>
    ${seasonal.length ? `<p class="hs-thint">Saisonales ist in der Karte mit <span class="hs-gl">${hsGl(x.t.gl[0], 12, x.t.ac)}</span> markiert.</p>` : ''}</div>`);
  const board = p.querySelector('.hs-board');
  const over = () => { const m = board.querySelector('.mark'); const last = m.previousElementSibling; return last.getBoundingClientRect().bottom > board.getBoundingClientRect().bottom - 22; };
  let list = seasonal.slice(), vm = soon.slice(), c2 = list.length > 7;
  for(let i = 0; i < 40; i++){ board.innerHTML = build(list, c2, vm); if(!over()) break; if(!c2 && list.length > 3){ c2 = true; continue; } if(vm.length > 1){ vm.pop(); continue; } if(list.length > 2){ list.pop(); continue; } if(vm.length){ vm.pop(); continue; } break; }
  return true;
}
function hsFavPage(x){
  let favs = x.entries.filter(d => d.top).slice(0, 5); if(!favs.length) return false;
  const item = (d, i) => `<div class="it"><div class="no">${i+1}</div><div class="tx"><div class="k">KAPITEL ${String(x.secNo[d.section] || 0).padStart(2, '0')} · ${hsU(d.section)}</div>
    <div class="fn">${esc(d.name)}${hsVeg(d.veg)}</div>${d.desc ? `<p class="hs-ds">${esc(d.desc)}</p>` : ''}<div class="pr">${d.prices.map(([l,p]) => `<span class="hs-p">${l ? `<small>${esc(l)}</small>` : ''}${+p ? hkPrice(p) : ''}</span>`).join('')}</div></div></div>`;
  const photo = HS_A.fondue ? `<div class="fph"><div class="fr"><img src="${HS_A.fondue}" alt=""></div></div>` : '';
  const p = hsPage(x, 'hs-fav', `<div class="hs-body"><div class="hd"><div class="hx">Haus-<i>Favoriten</i></div>${hsCopy('fav') ? `<p>${esc(hsCopy('fav'))}</p>` : ''}</div><div class="gr"><div class="li"></div>${photo}</div></div>`);
  const li = p.querySelector('.li');
  for(let n = favs.length; n > 0; n--){ li.innerHTML = favs.slice(0, n).map(item).join(''); p.classList.toggle('n5', n >= 5); if([...li.children].every(it => it.scrollHeight <= it.clientHeight + 1)) break; }
  return true;
}
const HS_SLOTS = { // Tellerplätze [x, y, Durchmesser] auf 794 × 831
  1:[[397,395,430]], 2:[[330,250,350],[500,610,270]], 3:[[300,215,330],[545,480,240],[290,630,230]],
  4:[[292,205,325],[578,215,228],[538,492,248],[272,628,252]],
  5:[[280,190,305],[570,150,205],[553,405,215],[272,565,225],[482,695,195]],
  6:[[270,175,285],[560,140,195],[555,372,205],[252,475,215],[472,595,195],[252,715,185]],
  7:[[260,165,265],[545,130,190],[560,352,195],[332,402,185],[542,582,195],[300,612,190],[440,752,152]],
  s:[[250,150,250],[540,118,182],[562,318,192],[342,378,172],[216,520,172],[480,538,178]],
};
function hsTablePage(x, sec){
  const all = sec.items.slice().sort((a, b) => (b.top - a.top) || (Math.max(...b.prices.map(p => +p[1]||0)) - Math.max(...a.prices.map(p => +p[1]||0))));
  const rest = all.length > 7 ? all.slice(6) : []; const on = all.length > 7 ? all.slice(0, 6) : all;
  if(rest.length > 8 || !HS_A.plate) return false;
  const slots = rest.length ? HS_SLOTS.s : HS_SLOTS[on.length];
  const used = new Set();
  const plate = (d, i) => { const [cx, cy, dm] = slots[i]; const al = d.alg.length ? `<span class="hs-al">${d.alg.join(' ')}</span>` : ''; d.alg.forEach(a => used.add(a));
    return `<div class="hs-plate" style="left:${cx-dm/2}px;top:${cy-dm/2}px;width:${dm}px;height:${dm}px;font-size:${(dm/14.2).toFixed(1)}px"><img src="${HS_A.plate}" alt="" style="left:-9.25%;top:-7.4%;width:118.5%;height:118.5%"><div class="tx">
      ${d.top && dm > 230 ? '<div class="tab">EMPFEHLUNG DES HAUSES</div>' : ''}<div class="pnm">${esc(d.name)}</div>${d.desc ? `<div class="pd">${esc(d.desc)}</div>` : ''}
      <div class="pp">${d.prices.map(([l,p]) => (l ? `<small>${esc(l)}</small>` : '') + (+p ? hkPrice(p) : '')).join(' &nbsp; ')}</div>${d.veg || al ? `<div class="pm">${hsVeg(d.veg)}${al}</div>` : ''}</div></div>`; };
  const xx = {...x, used, paper:true};
  const p = hsPage(x, 'hs-table wood', `<div class="hd"><div class="hs-num">${sec.no}</div><div class="tt"><div class="hs-title">${hsU(sec.name)}</div>${sec.intro ? `<p class="hs-intro">${esc(sec.intro)}</p>` : ''}</div></div>
    <div class="area"><img class="cut fork" src="${HS_A.fork || HS_SRC.fork}" alt=""><img class="cut knife" src="${HS_A.knife || HS_SRC.knife}" alt="">${on.map(plate).join('')}
    ${rest.length ? `<div class="hs-strip paper"><div class="st">AUSSERDEM FÜR DIE MITTE</div><div class="hs-grid c2">${rest.map(d => hsDish(d, xx)).join('')}</div></div>` : ''}</div>`, {frame:false});
  const strip = p.querySelector('.hs-strip');
  if(strip && strip.offsetHeight > 196){ p.remove(); x.pages.pop(); return false; }
  p.querySelectorAll('.hs-plate').forEach(pl => { const tx = pl.querySelector('.tx'); let fs = parseFloat(pl.style.fontSize); const pd = pl.querySelector('.pd');
    for(let i = 0; i < 14 && tx.scrollHeight > tx.clientHeight + 1; i++){ if(i === 5 && pd && pl.offsetWidth < 200){ pd.remove(); fs = parseFloat(pl.style.fontSize); continue; } fs *= .95; tx.style.fontSize = fs.toFixed(2) + 'px'; }
    // lange Wörter dürfen den Tellerspiegel nicht verlassen
    const pn = pl.querySelector('.pnm'); for(let i = 0; i < 10 && pn.scrollWidth > tx.clientWidth + 1; i++){ fs *= .95; tx.style.fontSize = fs.toFixed(2) + 'px'; } });
  used.forEach(a => x.used.add(a));
  return true;
}
function hsKidsPage(x, sec){
  const xx = {...x, paper:true};
  const kd = (d, i) => { const cls = d.top ? 'b' : ['b','','m',''][i % 4]; const al = hsAlg(d.alg, x.used);
    return `<div class="hs-kd ${cls}"><div class="kn">${esc(d.name)}${hsVeg(d.veg)}${d.desc || al ? `<small>${esc(d.desc)}${al}</small>` : ''}</div>${d.prices.map(([l,p]) => `<div class="kp" title="${esc(l)}">${+p ? hkPrice(p) : ''}</div>`).join('')}</div>`; };
  let i = 0, first = true, guard = 0;
  while(i < sec.items.length && guard++ < 6){
    const p = hsPage(x, 'hs-kids', `<div class="hs-body"><div class="hs-zone paper grow kz"><div class="hs-inl"></div>
      <div class="hs-sh"><div class="hs-num">${sec.no}</div><div class="tt"><div class="hs-title">${esc(sec.name)}${first ? '' : ' <span style="font-size:.5em">· Fortsetzung</span>'}</div>${first && sec.intro ? `<p class="hs-intro">${esc(sec.intro)}</p>` : ''}</div></div>
      <div class="ghost">${hsIll('kinder', 132, x.t.ink, 1.1)}</div><div class="hs-cloud"></div></div></div>`);
    const cloud = p.querySelector('.hs-cloud'); const fits = () => cloud.scrollHeight <= cloud.clientHeight + 1;
    const n0 = i;
    while(i < sec.items.length){ const n = hsEl(kd(sec.items[i], i)); cloud.appendChild(n); if(!fits()){ n.remove(); break; } i++; }
    if(i === n0){ cloud.appendChild(hsEl(kd(sec.items[i], i))); i++; }
    first = false;
  }
  return true;
}
function hsBackPage(x){
  const st = S.settings; const used = [...x.used].sort(); const keys = used.length ? used : Object.keys(ALG);
  const contact = [st.address, [st.phone, st.email].filter(Boolean).join(' · ')].filter(Boolean);
  hsPage(x, 'hs-back', `<div class="hs-body">
    ${HS_A.stube ? `<figure class="photo"><img src="${HS_A.stube}" alt="Die Gaststube"></figure>` : ''}
    ${hsCopy('claim') ? `<p class="claim">${esc(hsCopy('claim'))}</p>` : ''}
    ${hsCopy('back') ? `<p class="voice">${esc(hsCopy('back'))}</p>` : ''}
    <div class="mid">${HS_A.emblem ? `<img class="hs-emb2" src="${HS_A.emblem}" alt="">` : '<div class="hs-emb"><img src="brand/logo.svg" alt=""></div>'}<p class="addr"><b>${hsU(st.name)}</b>${contact.map(c => '<br>' + hsU(c)).join('')}</p></div>
    <div class="hs-leg"><div class="hx">ALLERGENE &amp; ZEICHEN</div><div class="lg">${keys.map(a => `<span><b>${a}</b> ${esc(ALG[a])}</span>`).join('')}</div>
      <div class="mk"><span>${hsVeg('v')} vegetarisch</span><span>${hsVeg('vg')} vegan</span><span>${hsGl(x.t.gl[0], 13, x.t.ac)} saisonal</span><span><i class="sw"></i> Empfehlung des Hauses</span></div>
      <p class="fnote">${esc(x.s.footer || 'Alle Preise in Euro inkl. MwSt.')}</p></div></div>`, {footLeft:''});
}

/* ---------- Fließende Kapitel: messen, umbrechen, nie ein Gericht teilen ---------- */
function hsFlow(x, secs){
  let page = null, body = null;
  const newPage = () => { page = hsPage(x, 'hs-list', '<div class="hs-body"></div>'); body = page.querySelector('.hs-body'); };
  const fits = () => body.scrollHeight <= body.clientHeight + 1;
  const zoneFor = surf => { let z = body.lastElementChild; if(z && z.classList.contains(surf)) return z; z = hsEl(`<div class="hs-zone ${surf}">${surf === 'paper' ? '<div class="hs-inl"></div>' : ''}</div>`); body.appendChild(z); return z; };
  for(const sec of secs){
    const surf = sec.surface, paper = surf === 'paper', xx = {...x, paper};
    const col = paper ? '#1f2328' : '#C59C69';
    const head = `<div class="hs-sh"><div class="hs-num">${sec.no}</div><div class="tt"><div class="hs-title">${hsU(sec.name)}</div>${sec.intro ? `<p class="hs-intro">${esc(sec.intro)}</p>` : ''}</div><div class="ill">${hsIll(sec.name, 58, paper ? '#b08a57' : col)}</div></div>`;
    const cont = `<div class="hs-cont"><span class="hs-num">${sec.no}</span>${hsU(sec.name)}<i>Fortsetzung</i></div>`;
    const feats = paper || sec.items.length > 1 ? sec.items.filter(d => d.top) : [];
    const units = [...feats.map(d => ['f', hsFeat(d, xx)]), ...sec.items.filter(d => !feats.includes(d)).map(d => ['d', hsDish(d, xx)])];
    const c2 = paper && units.filter(u => u[0] === 'd').length >= 6;
    let i = 0, first = true, guard = 0;
    while(i < units.length && guard++ < 30){
      if(!page) newPage();
      const fresh = !body.children.length;
      const zone = zoneFor(surf); const zNew = zone.children.length <= (paper ? 1 : 0);
      const se = hsEl(`<section class="hs-sec ${paper ? '' : 'hs-big'}" data-sec="${esc(sec.name)}">${first ? head : cont}<div class="hs-fts"></div>${c2 ? '<div class="hs-cols"><div class="hs-col"></div><div class="hs-col"></div></div>' : '<div class="hs-grid"></div>'}</section>`);
      zone.appendChild(se); const fts = se.querySelector('.hs-fts'), grid = se.querySelector('.hs-grid'), cols = [...se.querySelectorAll('.hs-col')]; const n0 = i;
      const put = []; // Gerichte dieses Abschnitts auf diesem Blatt (zweispaltig: Spalten gleich hoch, Lesefolge spaltenweise)
      const spread = () => { if(!c2) return; let tot = 0; put.forEach(n => { cols[0].appendChild(n); }); const hs = put.map(n => n.offsetHeight + 13); tot = hs.reduce((a, b) => a + b, 0); let acc = 0, k = 0; while(k < put.length && acc < tot/2 - 1){ acc += hs[k]; k++; } put.slice(k).forEach(n => cols[1].appendChild(n)); };
      const drop = () => { const n = put.pop(); n && n.remove(); spread(); };
      while(i < units.length){ const n = hsEl(units[i][1]);
        if(units[i][0] === 'f'){ fts.appendChild(n); if(!fits()){ n.remove(); break; } }
        else { put.push(n); if(c2) spread(); else grid.appendChild(n); if(!fits()){ drop(); break; } }
        i++; }
      let placed = i - n0; const left = units.length - i;
      // Überschrift nie allein, kein einzelnes Gericht als Rest
      if(left && !fresh && placed < Math.min(c2 ? 4 : 2, units.length - n0)){ i = n0; placed = 0; }
      if(left === 1 && placed >= 3 && put.length){ drop(); i--; placed--; }
      if(!placed){ se.remove(); if(zNew) zone.remove(); if(fresh){ // passt nicht einmal auf ein leeres Blatt: trotzdem setzen
          const z = zoneFor(surf); z.appendChild(se); const n = hsEl(units[i][1]); (units[i][0] === 'f' ? fts : (grid || cols[0])).appendChild(n); i++; first = false; } page = null; continue; }
      first = false;
      if(i < units.length) page = null;
    }
  }
}
/* Blätter ausgleichen: Papierbogen bis zum Rand, kurze Schieferkapitel groß, Bergkamm als Abschluss */
function hsBalance(x){
  for(const p of x.pages){ if(!p.classList.contains('hs-list')) continue;
    const body = p.querySelector('.hs-body'); const zones = [...body.children]; if(!zones.length) continue;
    const free = () => body.clientHeight - (zones[zones.length-1].offsetTop + zones[zones.length-1].offsetHeight);
    const last = zones[zones.length-1];
    if(zones.every(z => z.classList.contains('slate')) && free() > 260){
      const secs = [...body.querySelectorAll('.hs-sec')]; secs.forEach(s => s.classList.add('hs-hero')); secs.forEach(s => { const ill = s.querySelector('.ill'); if(ill) ill.innerHTML = hsIll(s.dataset.sec, 92, '#C59C69', 1.2); });
      if(body.scrollHeight > body.clientHeight + 1){ secs.forEach(s => { s.classList.remove('hs-hero'); const ill = s.querySelector('.ill'); if(ill) ill.innerHTML = hsIll(s.dataset.sec, 58, '#C59C69'); }); }
      else if(secs.length === 1 && zones.length === 1 && free() > 300){ // ein kurzes Kapitel allein: Gerichte gleichmäßig über das Blatt, Bergkamm als Abschluss
        last.classList.add('grow', 'hs-spread'); const n = secs[0].querySelectorAll('.hs-d,.hs-feat').length; last.style.paddingBottom = (n >= 4 ? 170 : 210) + 'px';
        last.appendChild(hsEl(`<div class="hs-fill">${hsRidge(x.k, 688, '#C59C69', 1.1)}</div>`)); continue; }
    }
    const f = free();
    if(last.classList.contains('paper')){ last.classList.add('grow'); if(f > 125) last.appendChild(hsEl(`<div class="hs-fill">${hsRidge(x.k, 660, '#C59C69', 1.1)}</div>`)); }
    else if(f > 190){ const sn = last.lastElementChild && last.lastElementChild.dataset.sec; body.appendChild(hsEl(`<div class="hs-fill">${f > 420 && sn ? `<div class="bigill">${hsIll(sn, 210, '#C59C69', .9)}</div>` : ''}${hsRidge(x.k, 688, '#C59C69', 1.1)}</div>`)); }
  }
}

function hsPages(k, date){
  const s = S.settings.seasons[k]; const host = hsHost(); host.innerHTML = '';
  const items = guestItems(k, date); const used = new Set();
  const secNames = secList().filter(sn => items.some(m => m.section === sn));
  const secs = secNames.map((name, i) => { const list = hkEntries(items.filter(m => m.section === name)).map(hsInfo);
    const kind = /teil/i.test(name) ? 'table' : /kind/i.test(name) ? 'kids' : 'list';
    return {name, no:String(i+1).padStart(2, '0'), intro:hsCopy('sec', name), items:list, kind, surface: list.length <= 4 ? 'slate' : 'paper'}; });
  const x = {k, date, s, t:hsTheme(k), host, pages:[], used, entries:secs.flatMap(sc => sc.items), secNo:Object.fromEntries(secs.map((sc, i) => [sc.name, i+1]))};
  hsCoverPage(x);
  hsTafelPage(x);
  hsFavPage(x);
  let run = [];
  const flush = () => { if(run.length){ hsFlow(x, run); run = []; } };
  for(const sec of secs){
    if(sec.kind === 'table'){ flush(); if(hsTablePage(x, sec)) continue; sec.kind = 'list'; }
    if(sec.kind === 'kids'){ flush(); hsKidsPage(x, sec); continue; }
    run.push(sec);
  }
  flush();
  if(!secs.length){ const p = hsPage(x, 'hs-list', '<div class="hs-body"><p class="hs-welcome">Für diese Saison sind noch keine Gerichte eingetragen.</p></div>'); }
  hsBalance(x);
  hsBackPage(x);
  x.pages.forEach((p, i) => { const n = p.querySelector('[data-hs-n]'); if(n) n.textContent = String(i+1).padStart(2, '0'); });
  const out = x.pages.map(p => p.outerHTML); host.innerHTML = '';
  return out;
}

/* ---------- Einbau: Stil, Vorschau, Texte ---------- */
view.hsBig = false;
let HS_PENDING = false;
function hsFit(){ document.querySelectorAll('.hs-prev').forEach(pv => { const sh = pv.querySelector('.hs-sheet'); if(sh && sh.clientWidth) pv.style.setProperty('--hs-s', (sh.clientWidth / HS_W).toFixed(5)); }); }
function guestHtmlHaus(k, date, opts){
  opts = opts || {}; date = date || todayStr(); k = k || seasonFor(date) || 'winter';
  const pages = hsPages(k, date);
  if(opts.print) return pages.join('');
  if(!hsAllReady(k) && !HS_PENDING){ HS_PENDING = true; hsEnsure(k).then(() => { HS_PENDING = false; if($('.hs-prev')) refreshGuest(); }, () => { HS_PENDING = false; }); }
  queueMicrotask(hsFit);
  return `<div class="hs-bar"><span class="hs-count">${pages.length} Blätter · A4 hoch</span>${seg('hsZoom', view.hsBig ? 'one' : 'grid', [['grid','Übersicht'],['one','Groß']])}</div>
    <div class="hs-prev ${view.hsBig ? 'one' : ''}">${pages.map((p, i) => `<div class="hs-sheet"><span class="hs-no">${i+1}</span>${p}</div>`).join('')}</div>`;
}
const _guestHtmlHs = guestHtml;
guestHtml = function(k, d, opts){ return hsStyle() === 'haus' ? guestHtmlHaus(k, d, opts) : _guestHtmlHs(k, d, opts); };
const _guestPrevHtmlHs = guestPrevHtml;
guestPrevHtml = function(){
  if(hsStyle() !== 'haus') return _guestPrevHtmlHs();
  const date = view.gdate || todayStr(); const k = curSeasonKey(); const wdn = new Date(date+'T12:00:00').getDay();
  const closed = (S.settings.closed||[]).includes(wdn) ? `<div class="g-closed">${ico('spark')}${DAYNAME[wdn]} ist Ruhetag. So sähe die Karte trotzdem aus.</div>` : '';
  return closed + guestHtmlHaus(k, date) + specialsFor(date).filter(sp => sp.mode === 'tageskarte').map(sp => `<div class="tk-label">Tageskarte, liegt bei · ${esc(sp.name)}</div>${tageskarteHtml(sp, k)}`).join('');
};
const _printMenuHs = printMenu;
printMenu = function(){
  const pr = $('#print');
  if(hsStyle() !== 'haus'){ pr.classList.remove('hs-print'); return _printMenuHs(); }
  const k = curSeasonKey(), date = view.gdate || todayStr();
  if(!hsAllReady(k)) toast('Karte wird vorbereitet …');
  hsEnsure(k).then(() => { pr.classList.add('hs-print'); pr.innerHTML = guestHtmlHaus(k, date, {print:true}); document.body.classList.add('print-menu'); window.print(); });
};
function hsCopyPanel(){
  const k = curSeasonKey(), date = view.gdate || todayStr(); const items = guestItems(k, date);
  const secs = secList().filter(sn => items.some(m => m.section === sn));
  return `<section class="panel"><div class="panel-h"><div class="hx">Texte</div><button type="button" class="link sm-link" data-act="hsCopyReset">Standardtexte</button></div>
    <div class="hs-copy">
      <label class="f">Begrüßung (Tafelseite)<textarea data-hsc="welcome" rows="3">${esc(hsCopy('welcome'))}</textarea></label>
      <label class="f">Überschrift der Tafel<input data-hsc="tafel" value="${esc(hsCopy('tafel'))}"></label>
      <label class="f">Zeile bei den Haus-Favoriten<input data-hsc="fav" value="${esc(hsCopy('fav'))}"></label>
      <details><summary>Einleitung je Kapitel (${secs.length})</summary>${secs.map(sn => `<label class="f">${esc(sn)}<input data-hsc="sec" data-sec="${esc(sn)}" value="${esc(hsCopy('sec', sn))}"></label>`).join('')}</details>
      <label class="f">Leitspruch (Titel und Rückseite)<input data-hsc="claim" value="${esc(hsCopy('claim'))}"></label>
      <label class="f">Text auf der Rückseite<textarea data-hsc="back" rows="2">${esc(hsCopy('back'))}</textarea></label>
      <p class="hint">Leere Felder bleiben in der Karte leer. Gerichte, Preise, Allergene, Saisonales und Aktionen kommen automatisch aus Ihren Daten.</p>
    </div></section>`;
}
const _renderGuestHs = renderGuest;
renderGuest = function(){
  let html = _renderGuestHs(); const st = hsStyle();
  const old = seg('gStyle', S.settings.guestStyle || 'web', [['web','Wie die Website'],['book','Buchsatz']]);
  const hint = st === 'haus' ? `„${HS_NAME}“: Schiefer, Gold und Kreidetafel auf fertigen A4-Blättern. Die Blätter füllen sich aus Ihren Daten.` : '„Wie die Website“ nutzt Rahmen, Reiter und Schriften von dahuam202.at.';
  html = html.replace(old, seg('gStyle', st, [['haus', HS_NAME],['web','Wie die Website'],['book','Buchsatz']])).replace('<p class="hint">„Wie die Website“ nutzt Rahmen, Reiter und Schriften von dahuam202.at.</p>', `<p class="hint">${hint}</p>`);
  if(st === 'haus'){
    html = html.replace(/<\/aside>\s*<div class="guest-prev">/, hsCopyPanel() + '</aside><div class="guest-prev">');
    html = html.replace(/<div class="togs"><label class="tog"><input type="checkbox" data-hkk="1"[\s\S]*?<\/div>/, '').replace('Schrift, Raster und Papier bleiben in jeder Saison gleich. So erkennt man immer dasselbe Haus.', 'Schiefer, Gold und Schriften bleiben in jeder Saison gleich. Die Standardfarbe der Saison ist auf den Schiefer abgestimmt; wählen Sie eine andere, färbt sie Saisonzeichen und Kinderseite.').replace('Fotos einzelner Gerichte erscheinen bewusst nicht in der Karte: Sie verschieben die Zeilen. Ein ruhiges Titelbild genügt.', 'Ein eigenes Titelbild wird in Gold-Schiefer-Tönen ins Titelblatt geblendet. Ohne Bild zeichnet die Karte den Bergkamm.');
  }
  return html;
};
let _hsT = 0;
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return;
  if(el.dataset.act === 'gStyle'){ S.settings.guestStylePick = true; }
  if(el.dataset.act === 'hsZoom'){ view.hsBig = el.dataset.id === 'one'; refreshGuest(); }
  if(el.dataset.act === 'hsCopyReset'){ ask('Alle Texte der Hauskarte auf die Standardtexte zurücksetzen?', () => { S.settings.menuCopy = {sec:{}}; save(); render(); }, 'Zurücksetzen'); }
}, true);
document.addEventListener('input', e => {
  const t = e.target; if(!t.dataset || !t.dataset.hsc) return;
  const c = S.settings.menuCopy || (S.settings.menuCopy = {}); if(!c.sec) c.sec = {};
  if(t.dataset.hsc === 'sec') c.sec[t.dataset.sec] = t.value; else c[t.dataset.hsc] = t.value;
  save(); clearTimeout(_hsT); _hsT = setTimeout(refreshGuest, 350);
});
window.addEventListener('resize', hsFit);
const _refreshGuestHs = refreshGuest;
refreshGuest = function(){ _refreshGuestHs(); hsFit(); };

/* ---------- PDF: jedes Blatt genau eine A4-Seite ---------- */
async function hsExportPdf(filename){
  const el = $('#print'); const pages = [...el.querySelectorAll('.hs-page')];
  toast('PDF wird erstellt …');
  try {
    await pdfLibs(); el.classList.add('pdf');
    if(document.fonts && document.fonts.ready) await document.fonts.ready;
    await Promise.all([...el.querySelectorAll('img')].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const {jsPDF} = window.jspdf; const pdf = new jsPDF({unit:'pt', format:'a4', compress:true});
    const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
    for(let i = 0; i < pages.length; i++){
      el.replaceChildren(pages[i]); await new Promise(r => requestAnimationFrame(r));
      const t = $('#toast'); if(t){ t.textContent = `PDF wird erstellt … Blatt ${i+1} von ${pages.length}`; t.classList.add('show'); clearTimeout(toast._t); }
      const t0 = performance.now(); const canvas = await window.html2canvas(pages[i], {scale:2, backgroundColor:'#1b1e23', useCORS:true, logging:false, width:HS_W, height:HS_H, windowWidth:Math.max(document.documentElement.clientWidth, 1000), windowHeight:window.innerHeight, scrollX:0, scrollY:-window.scrollY,
        ignoreElements: n => n.parentElement === document.body && n.id !== 'print' && n.tagName !== 'STYLE' && n.tagName !== 'LINK'});
      if(i) pdf.addPage(); if(window.HS_DEBUG) console.log('hs page', i+1, Math.round(performance.now() - t0)); 
      pdf.addImage(canvas.toDataURL('image/jpeg', .9), 'JPEG', 0, 0, pw, ph, undefined, 'FAST');
      canvas.width = canvas.height = 0;
    }
    const ok = await saveFile(filename, pdf.output('blob'));
    if(ok) toast(`PDF erstellt: ${filename} (${pages.length} Seiten)`);
  } catch(e){ toast('PDF fehlgeschlagen: ' + (e.message || e)); }
  finally { el.classList.remove('pdf'); el.replaceChildren(...pages); }
}
const _exportPdfHs = exportPdf;
exportPdf = function(filename){ const el = $('#print'); if(el && el.querySelector('.hs-page')) return hsExportPdf(filename); if(el) el.classList.remove('hs-print'); return _exportPdfHs(filename); };

/* =====================================================================
   Korrekturen aus dem Audit, die mehrere Bereiche betreffen:
   Gerichtsnamen mit Variante, Rollen (nur Ansicht), Fokus nach
   Inline-Eingaben, Tastaturbedienung, Schnellsuche, Adresse je Rezeptur,
   leere neue Rezepturen aufräumen, Datenmigration.
   ===================================================================== */

/* ---------- Gerichtsname mit Variante: überall derselbe ---------- */
function dishLabel(m){ return m ? String(m.name || '') + (m.vlabel ? ' · ' + m.vlabel : '') : ''; }

/* ---------- Migration neuer Felder ---------- */
function fixesMigrate(d){
  if(!d || typeof d !== 'object') return d;
  d.moves = d.moves || [];
  if(!d.saleGroups || typeof d.saleGroups !== 'object') d.saleGroups = {};
  // alte Verkaufsbuchungen: Zeilen mit gleichem Zeitpunkt und gleicher Notiz gehörten zu einer Buchung
  d.moves.forEach(m => { if(m && m.type === 'sale' && !m.grp){ const g = 'sb_' + String(m.date||'').slice(0,16).replace(/\D/g,'') + '_' + String(m.note||'').length; m.grp = g; if(!d.saleGroups[g]) d.saleGroups[g] = {day:String(m.date||'').slice(0,10), n:0, rows:null, gross:0, legacy:true}; } });
  Object.keys(d.saleGroups).forEach(g => { if(!d.moves.some(m => m && m.grp === g)) delete d.saleGroups[g]; });
  // echte Verkaufstage merken, damit Demo-Verkäufe getrennt gelöscht werden können
  if(!d.salesReal || typeof d.salesReal !== 'object'){ d.salesReal = {}; if(!d.salesDemo) Object.keys(d.salesDays||{}).forEach(k => { d.salesReal[k] = 1; }); }
  if(d.salesDemo && !Object.keys(d.salesDays||{}).some(k => !d.salesReal[k])) d.salesDemo = false;
  // Inventur: keine negativen Zählmengen
  if(d.invDraft && d.invDraft.counts) Object.keys(d.invDraft.counts).forEach(k => { const v = d.invDraft.counts[k]; if(v !== '' && !(+v >= 0)) d.invDraft.counts[k] = ''; });
  // Rezepturmengen: keine negativen Werte
  (d.cards||[]).forEach(c => { (c.items||[]).forEach(it => { if(+it.qty < 0) it.qty = ''; if(it.net !== '' && it.net != null && +it.net < 0) it.net = ''; }); if(+c.yieldG < 0) c.yieldG = ''; });
  return d;
}

/* ---------- Rollen: Mitarbeiter und Bar sehen Küchendaten nur an ---------- */
const RO_MSG = 'Nur Küchenchef/Inhaber';
function canEditAll(){ const r = me().role; return r === 'owner' || r === 'chef'; }
function isDrinkProduct(p){ if(!p) return false; const sp = SUP(p.supplier); return !!(sp && DRINK_CATS.includes(sp.cat)) || p.loc === 'W'; }
function canEditProduct(p){ return canEditAll() || (me().role === 'bar' && isDrinkProduct(p)); }
function whoLabel(u){ const r = ROLES[u.role] || ''; return !r || u.name === r ? u.name : `${u.name} · ${r}`; }
const RO_ACTS = new Set(['newMenu','editMenu','photoMenu','toMenu','newCardFor','newCard','photoCard','photoCardDel','addLine','delLine','stepAdd','stepDel','stepMove','stepPhoto','stepPhotoDel','applySim','dupCard','delCard','addSec','secMove','secDel','secSort','itemMove','itemHide','newProd','editProd','reset','importPick','safetyRestore','pConfirm','pConfirmAll','pFix','plImport','pcStart','pcFor','pcOk','pcSave','pcSkip','pcBack','tellerPick','gstyle','gStyle','glayout','gorn','palPreset','gcover','gcoverDel','gReset','newSpecial','editSpecial','dupSpecial','labTake','gameReset','hkAccent','hsCopyReset']);
const RO_PROD_ACTS = new Set(['editProd','pConfirm']);
const RO_INPUTS = 'input[data-mp],[data-pp],[data-li],[data-cf],textarea[data-step],.title-in,[data-sf],[data-us],[data-secname],[data-gs],[data-gf],[data-st],[data-pal],[data-sv],[data-smd],[data-ms],[data-hsc],[data-hkk],#pcIn';
function roBlocked(el){
  if(canEditAll() || !el) return false;
  const a = el.dataset.act;
  if(a){ if(!RO_ACTS.has(a)) return false; if(RO_PROD_ACTS.has(a) && canEditProduct(P(el.dataset.id))) return false; return true; }
  if(el.matches('.sh-chip,.ti-grip,[data-pick]')) return true;
  if(el.matches(RO_INPUTS)){ if(el.dataset.pp && canEditProduct(P(el.dataset.pp))) return false; return true; }
  return false;
}
function roGate(ok){ if(ok === undefined ? canEditAll() : ok) return true; toast(RO_MSG + ' können das ändern'); return false; }
window.addEventListener('click', e => { if(canEditAll()) return; const el = e.target.closest && e.target.closest('[data-act],.sh-chip,[data-pick]'); if(el && roBlocked(el)){ e.preventDefault(); e.stopImmediatePropagation(); roGate(false); } }, true);
window.addEventListener('pointerdown', e => { if(canEditAll()) return; const el = e.target.closest && e.target.closest('.ti-grip,.sh-chip'); if(el){ e.stopImmediatePropagation(); } }, true);
['change','input'].forEach(ev => window.addEventListener(ev, e => { if(canEditAll()) return; const t = e.target; if(!t || !t.matches || !t.closest('#app') || !roBlocked(t)) return; e.stopImmediatePropagation(); if(t.type === 'checkbox' || t.type === 'radio') t.checked = t.defaultChecked; else if(t.tagName !== 'SELECT') t.value = t.defaultValue; if(ev === 'change') roGate(false); }, true));
/* Dialoge, die auch über die Schnellsuche erreichbar sind */
const _menuDialogF = menuDialog; menuDialog = function(m, pre){ if(roGate()) return _menuDialogF(m, pre); };
const _prodDialogF = prodDialog; prodDialog = function(p){ if(roGate(p ? canEditProduct(p) : canEditAll())) return _prodDialogF(p); };
const _newCardF = newCard; newCard = function(type, fromMenu){ if(!roGate()) return; _newCardF(type, fromMenu); const c = C(view.card); if(c && !fromMenu){ c.fresh = true; save(); } };
const _specialDialogF = specialDialog; specialDialog = function(sp){ if(roGate()) return _specialDialogF(sp); };
function roApply(){
  const app = $('#app'); if(!app) return; app.querySelector('.ro-note')?.remove();
  if(canEditAll()) return;
  let n = 0;
  app.querySelectorAll('[data-act],' + RO_INPUTS + ',.sh-chip,.ti-grip,.guest-tools input,.guest-tools select,.guest-tools textarea').forEach(el => {
    const inTools = el.closest('.guest-tools') && !el.dataset.act && el.id !== 'gdate';
    if(!inTools && !roBlocked(el)) return;
    n++; if('disabled' in el) el.disabled = true; el.classList.add('ro'); el.setAttribute('aria-disabled', 'true');
    if(el.tagName === 'TR'){ el.classList.remove('row'); el.removeAttribute('data-act'); }
  });
  app.querySelectorAll('.link-btn[data-act="addLine"],.ti-add,.shelf').forEach(el => { el.hidden = true; });
  if(!n) return;
  const bar = me().role === 'bar';
  const note = `<div class="ro-note" role="note">${ico('eye')}<span><b>Nur Ansicht.</b> ${bar && view.tab === 'products' ? 'Die Bar ändert Getränke und Wein; alle anderen Produkte ändern ' : 'Ändern dürfen hier '}nur Küchenchef/Inhaber${bar && view.tab === 'products' ? '' : ''}. Angemeldet: ${esc(whoLabel(me()))}.</span></div>`;
  const ph = app.querySelector('.page-h, .hero'); if(ph) ph.insertAdjacentHTML(ph.classList.contains('hero') ? 'beforebegin' : 'afterend', note); else app.insertAdjacentHTML('afterbegin', note);
}

/* ---------- Fokus: nach Tab/Enter in Listenfeldern bleibt der Cursor im nächsten Feld ---------- */
function focusKey(el){
  if(!el || !el.closest || !el.closest('#app')) return null;
  if(el.id) return '#' + CSS.escape(el.id);
  const tag = el.tagName.toLowerCase(), ds = el.dataset;
  if(ds.act) return `#app ${tag}[data-act="${ds.act}"]` + (ds.id != null ? `[data-id="${CSS.escape(ds.id)}"]` : '');
  if(ds.pdf) return `#app ${tag}[data-pdf="${ds.pdf}"]`;
  for(const k of ['mp','pp','li','ol','rd','rp','rs','secname','sel']) if(ds[k] != null) return `#app ${tag}[data-${k}="${CSS.escape(ds[k])}"]` + (k === 'li' ? `[data-lf="${ds.lf}"]` : k === 'pp' ? `[data-pf="${ds.pf}"]` : '');
  return null;
}
function renderKeepFocus(){
  const sel = focusKey(document.activeElement); const y = window.scrollY;
  render();
  if(sel){ const n = document.querySelector(sel); if(n && n !== document.activeElement){ n.focus({preventScroll:true}); if(n.matches('input.num-in') && n.select) n.select(); } }
  if(Math.abs(window.scrollY - y) > 2) window.scrollTo(0, y);
}
softRender = function(){ if(ptrDown){ pendingRender = true; return; } setTimeout(renderKeepFocus, 0); };
/* Mausklick in ein anderes Feld nach einer Änderung: neu zeichnen, ohne den Fokus zu verlieren */
window.addEventListener('pointerup', () => { if(!pendingRender) return; pendingRender = false; ptrDown = false; setTimeout(renderKeepFocus, 0); }, true);
const INLINE_COLS = [['mp', t => 'input[data-mp]'], ['pp', t => `input[data-pp][data-pf="${t.dataset.pf}"]`], ['li', t => `input[data-li][data-lf="${t.dataset.lf}"]`], ['ol', t => 'input[data-ol]'], ['rd', t => 'input[data-rd]'], ['rp', t => 'input[data-rp]']];
document.addEventListener('keydown', e => {
  if(e.key !== 'Enter' || e.isComposing) return; const t = e.target;
  if(!t.matches || t.tagName !== 'INPUT' || !t.closest('#app')) return;
  const col = INLINE_COLS.find(([k]) => t.dataset[k] != null); if(!col) return;
  e.preventDefault(); e.stopPropagation();
  const all = [...document.querySelectorAll('#app ' + col[1](t))].filter(x => !x.disabled);
  const n = all[all.indexOf(t) + (e.shiftKey ? -1 : 1)];
  if(n){ n.focus(); if(n.select) n.select(); } else { t.blur(); t.focus(); if(t.select) t.select(); }
}, true);

/* ---------- Einstellungen: Zahlen prüfen, deutsch anzeigen ---------- */
document.addEventListener('change', e => {
  const t = e.target; if(!t.dataset) return;
  if(t.dataset.sf && t.dataset.sf !== 'name'){ e.stopPropagation(); const v = numParse(t.value); if(!isFinite(v)) return; S.settings[t.dataset.sf] = v; t.value = numIn(v); t.defaultValue = t.value; save(); toast('Gespeichert'); return; }
  if(t.dataset.us === 'limit'){ e.stopPropagation(); const v = numParse(t.value); if(!isFinite(v)) return; S.settings.orderLimit = v; t.value = numIn(v); t.defaultValue = t.value; save(); toast('Freigabe-Limit gespeichert'); }
}, true);

/* ---------- Adresse: #cards/<id> hält die offene Rezeptur über ein Neuladen ---------- */
function hashWant(){ return view.tab + (view.tab === 'cards' && view.card ? '/' + view.card : ''); }
function hashSync(){ try { const w = hashWant(); if(decodeURIComponent(location.hash.slice(1)) !== w) history.replaceState(null, '', '#' + w); } catch(e){} }
const _goF = go; go = function(tab, card=null){ _goF(tab, card); hashSync(); };
fromHash = function(){
  let h = ''; try { h = decodeURIComponent(location.hash.slice(1)); } catch(e){ h = location.hash.slice(1); }
  const i = h.indexOf('/'); const tab = i < 0 ? h : h.slice(0, i), id = i < 0 ? '' : h.slice(i+1);
  if(tab === 'cards' && id && C(id)){ if(view.tab !== 'cards' || view.card !== id){ view = {...view, tab:'cards', card:id, q:'', sim:null}; render(); } return; }
  if(TABS.some(t => t[0] === tab) && (tab !== view.tab || (tab === 'cards' && view.card))){ view = {...view, tab, card:null, q:''}; render(); }
};

/* ---------- „+ Gericht“ / „+ Basisrezept“: unberührte neue Rezeptur beim Verlassen still entfernen ---------- */
function cardPristine(c){
  return !!c && c.fresh && (c.name === 'Neues Gericht' || c.name === 'Neues Basisrezept') && !c.img && (c.yieldG === '' || c.yieldG == null)
    && !(c.items||[]).some(it => it.ref || (it.qty !== '' && it.qty != null)) && !(c.steps||[]).some(s => (s.t && s.t.trim()) || s.img)
    && !S.menu.some(m => m.card === c.id) && !usage('c:' + c.id).length;
}
let lastOpenCard = null, pruneInit = false;
function pruneFreshCards(){
  const open = view.tab === 'cards' ? view.card : null; let changed = false;
  const drop = c => { S.cards = S.cards.filter(x => x !== c); if(S.settings.nextNo === (+c.no||0) + 1) S.settings.nextNo--; changed = true; };
  if(!pruneInit){ pruneInit = true; let hc = ''; try { hc = decodeURIComponent(location.hash.slice(1)).split('/')[1] || ''; } catch(e){} S.cards.filter(c => c.id !== open && c.id !== hc && cardPristine(c)).forEach(drop); }
  if(lastOpenCard && lastOpenCard !== open){ const c = C(lastOpenCard); if(cardPristine(c)) drop(c); }
  lastOpenCard = open;
  if(changed) save();
}

/* ---------- Unterzeile je Unter-Reiter ---------- */
const SUB_TEXT = {
  menu:{guest:'Gästekarte gestalten, prüfen und als PDF speichern oder drucken.', plan:'Saisonzeiten festlegen und Aktionen planen. Die Gästekarte wechselt automatisch.', layout:'Kategorien und Reihenfolge der Karte. Mit dem Auge blenden Sie ein Gericht aus.'},
  stock:{buchungen:'Alle Lagerbewegungen, neueste zuerst. Mit dem Pfeil machen Sie eine Buchung rückgängig.', inventur:'Zählen, Differenz sehen, Bestand übernehmen.'},
  buy:{lieferanten:'Bestelltage, Annahmeschluss, Liefertage und Kontakt je Lieferant.'},
  report:{import:'Artikelumsätze aus der Kasse als Datei laden. Vor dem Import sehen Sie eine Vorschau.', map:'Kassenartikel den Gerichten der App zuordnen, auch rückwirkend.'},
};
function subTabOf(){ return view.tab === 'menu' ? view.mtab : view.tab === 'stock' || view.tab === 'buy' ? view.stab : view.tab === 'report' ? (view.rp && view.rp.tab) : null; }
function subTextApply(){ const sub = $('#app .page-h .sub'); const map = SUB_TEXT[view.tab]; if(!sub || !map) return; const txt = map[subTabOf()]; if(txt) sub.textContent = txt; }

/* ---------- Nach jedem Zeichnen ---------- */
function rowButtons(){
  // Listenzeilen mit der Tastatur öffnen: der Name ist ein echter Knopf
  document.querySelectorAll('#app tr.row[data-act]').forEach(tr => {
    if(tr.querySelector('.row-open')) return; const b = tr.querySelector('td b'); if(!b) return;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'row-open'; btn.dataset.act = tr.dataset.act; if(tr.dataset.id != null) btn.dataset.id = tr.dataset.id;
    const verb = /^edit/.test(tr.dataset.act) ? 'bearbeiten' : 'öffnen'; btn.setAttribute('aria-label', `${b.textContent.trim()} ${verb}`);
    b.parentNode.insertBefore(btn, b); btn.appendChild(b);
  });
}
function a11yLabels(){
  document.querySelectorAll('#app input[type=search]:not([aria-label]), #dlg input[type=search]:not([aria-label])').forEach(i => i.setAttribute('aria-label', i.placeholder || 'Suchen'));
  document.querySelectorAll('#app .lt thead th button[data-act], #app .rp-items thead th button').forEach(b => { if(!b.title) b.title = 'Sortieren'; });
}
function tabsIntoView(){
  document.querySelectorAll('#app .seg, #app .chips-row, #app .rp-units').forEach(box => { if(box.scrollWidth <= box.clientWidth + 2) return; const on = box.querySelector('.on'); if(!on) return; const br = box.getBoundingClientRect(), r = on.getBoundingClientRect(); if(r.left < br.left + 8 || r.right > br.right - 8) box.scrollLeft += r.left - br.left - (br.width - r.width)/2; });
  const nav = document.querySelector('.bottom .nav-slot'); const on = nav && nav.querySelector('.on'); if(on && nav.scrollWidth > nav.clientWidth + 2){ const br = nav.getBoundingClientRect(), r = on.getBoundingClientRect(); if(r.left < br.left || r.right > br.right) nav.scrollLeft += r.left - br.left - (br.width - r.width)/2; }
}
function whoApply(){ const w = $('#whoami'); if(!w) return; const u = me(); const r = ROLES[u.role] || ''; const extra = [u.name === r ? '' : r, typeof cloudReady === 'function' && cloudReady() ? 'Cloud' : ''].filter(Boolean).join(' · '); w.innerHTML = `<b>${esc(u.name)}</b>${extra ? `<small>${esc(extra)}</small>` : ''}`; w.setAttribute('aria-label', `Angemeldet: ${whoLabel(u)}. Einstellungen öffnen`); }
const _renderFx = render;
render = function(){
  pruneFreshCards();
  _renderFx();
  rowButtons(); a11yLabels(); subTextApply(); roApply(); whoApply(); tabsIntoView();
  if(view.tab === 'cards' || location.hash.indexOf('/') > 0) hashSync();
};

/* ---------- Schnellsuche: Treffer am Wortanfang zuerst, Bestellungen nach Nummer ---------- */
const _palDataF = palData;
palData = function(){
  const a = _palDataF();
  (S.orders||[]).forEach(o => { const sp = SUP(o.supplier); a.push({g:'Bestellung', n:o.no, s:`${sp ? sp.name : '?'} · ${OSTAT[o.status]||o.status} · Lieferung ${fmtDate(o.deliveryDate+'T12:00:00')}`, run:()=>{ view.stab = 'bestellung'; view.order = o.id; view.recv = null; go('buy'); }}); });
  return a.filter((x,i) => !(x.g === 'Bereich' && a.findIndex(y => y.g === 'Bereich' && y.n === x.n) !== i));
};
function palRank(x, q){
  const n = x.n.toLowerCase(); if(n === q) return 0; if(n.startsWith(q)) return 1;
  const clean = n.replace(/[„“"'«»()]/g, ''); if(clean.startsWith(q)) return 1;
  if(clean.split(/[\s\-–·|,./]+/).some(w => w.startsWith(q))) return 2;
  if(n.includes(q)) return 3; return 4;
}
palFilter = function(q){
  q = q.trim().toLowerCase(); const all = palData();
  if(!q) palItems = all.filter(x => x.g === 'Bereich' || x.g === 'Aktion').slice(0, 40);
  else palItems = all.map((x,i) => ({x, i, r: (x.n+' '+x.s+' '+x.g).toLowerCase().includes(q) ? palRank(x, q) : 9})).filter(o => o.r < 9).sort((a,b) => a.r - b.r || a.i - b.i).slice(0, 40).map(o => o.x);
  palSel = 0; palDraw();
};

/* ---------- Sicherheitskopie zurückholen ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if(!el) return;
  if(el.dataset.act === 'safetyRestore'){ const sf = safetyGet(); if(!sf) return; ask(`Daten vom ${fmtDate(sf.at)} (${sf.why}) wiederherstellen? Der jetzige Stand wird dabei ersetzt. Das geht nur einmal.`, () => { setTimeout(safetyRestore, 0); }, 'Wiederherstellen'); }
  if(el.dataset.act === 'safetyDl'){ const sf = safetyGet(); if(sf) saveFile(`dahuam202-sicherheitskopie-${String(sf.at).slice(0,10)}.json`, new Blob([JSON.stringify(sf.data)], {type:'application/json'})).then(ok => ok && toast('Sicherheitskopie gespeichert')); }
});

/* ---------- Start ---------- */
S = migrate(load()) || seed();
document.querySelectorAll('.nav-slot').forEach(n => n.innerHTML = navHtml(n.closest('.bottom')));
try { const th = localStorage.getItem(KEY+'_theme'); if(th) document.documentElement.dataset.theme = th; } catch(e){}
themeIcon();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', themeIcon);
function fromHash(){ const h = location.hash.slice(1); if(TABS.some(t=>t[0]===h) && h !== view.tab){ view = {...view, tab:h, card:null, q:''}; render(); } }
window.addEventListener('hashchange', fromHash);
try { fromHash(); render(); } catch(err){ console.error(err); $('#app').innerHTML = `<section class="panel" style="max-width:560px"><h2>Gespeicherte Daten konnten nicht geladen werden</h2><p class="hint">Laden Sie eine Sicherung oder starten Sie mit den Demodaten neu.</p><div class="row-btns" style="margin-top:12px"><button type="button" class="btn primary" data-act="importPick">Sicherung laden</button><button type="button" class="btn danger" data-act="reset">Demodaten laden</button></div><input id="importFile" type="file" accept="application/json,.json" hidden></section>`; }
imgLoadAll().then(() => { if(Object.keys(IMG).length) render(); cloudStart(); });

