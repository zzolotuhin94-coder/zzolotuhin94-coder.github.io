'use strict';
const KEY = 'dahuam202_kueche_de_v1';
const FRAMED = (()=>{ try { return window.self !== window.top; } catch(e){ return true; } })();
const ALG = {A:'Gluten',B:'Krebstiere',C:'Ei',D:'Fisch',E:'Erdnuss',F:'Soja',G:'Milch/Laktose',H:'Schalenfrüchte',L:'Sellerie',M:'Senf',N:'Sesam',O:'Sulfite',P:'Lupinen',R:'Weichtiere'};

/* ---------- Beispieldaten ---------- */
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

/* save() und load(): siehe store.js */

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
    { const pl = pourLossOf(p); if(pl) res.cost /= (1 - pl/100); }   // Schankverlust (Fassbier, offener Wein): für ein volles Glas läuft mehr aus dem Gebinde
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
/* MwSt.: Speisen oder Getränke. Die Klasse kommt vom Gericht (wenn dort gewählt), sonst von der Kategorie. EIN Helfer für alle Rechnungen. */
function vatClass(m){ if(m && (m.vat === 'g' || m.vat === 's')) return m.vat; const sv = S.settings.secVat; return m && sv && sv[m.section] === 'g' ? 'g' : 's'; }
function vatRate(m){ const s = S.settings; if(vatClass(m) === 'g'){ const v = +s.vatDrinks; return isFinite(v) && s.vatDrinks !== '' && s.vatDrinks != null ? v : 20; } return s.vat; }
/* Schankverlust eines Artikels in % (0 bis unter 100); ohne Angabe 0 */
function pourLossOf(p){ const v = p ? +p.pourLoss : 0; return v > 0 && v < 100 ? v : 0; }
/* Getränk in anderer Größe: dieselbe Schankrezeptur, nach Menge gerechnet (0,3 l aus der Rezeptur für 0,5 l = Faktor 0,6). Speisen: immer 1. */
function menuFactor(m){ const c = m && m.card ? C(m.card) : null; return c && c.drink && +m.vol > 0 && +c.yieldG > 0 ? +m.vol / +c.yieldG : 1; }
function menuCalc(m){
  const c = m.card ? C(m.card) : null;
  const t = c ? totals(c) : null;
  const netPrice = (+m.price||0) / (1 + vatRate(m)/100);
  const cost = t ? t.cost * menuFactor(m) : null;
  return {c, t, cost, netPrice, fc: cost!=null && netPrice ? cost/netPrice*100 : null, margin: cost!=null ? netPrice - cost : null};
}
function fcClass(fc){ if(fc==null) return 'na'; const tg = +S.settings.target; return fc <= tg ? 'good' : fc <= tg+7 ? 'warn' : 'bad'; }
function chips(set){ const a = [...set].sort(); return a.length ? `<div class="chips">${a.map(x=>`<span class="alg" title="${esc(ALG[x]||x)}">${esc(x)}</span>`).join('')}</div>` : ''; }
function usage(ref){ return S.cards.filter(c => c.items.some(i => i.ref === ref)); }
