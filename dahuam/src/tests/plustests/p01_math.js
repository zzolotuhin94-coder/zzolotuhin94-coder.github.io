// Rechenkern der Vorbereitung gegen von Hand gerechnete Zahlen (kleiner künstlicher Datensatz)
const L=require('../fixtests/lib');const ok=L.ok;const near=(a,b,t=0.01)=>Math.abs(a-b)<=t;
(async()=>{const {b,p,errs}=await L.open({});const ev=(f,a)=>p.evaluate(f,a);
// ---------- künstlicher Betrieb ----------
await ev(()=>{
  const prod=(id,unit,price,stock,sup,packQty,loc)=>({id,name:'T '+id,unit,price,lossCold:0,lossHot:0,alg:'',pieceG:'',stock,minStock:0,loc,supplier:sup,pack:packQty?'Gebinde':'',packQty,artNo:'',priceDemo:false});
  S.products.push(prod('tp1','kg',10,1,'sup_fleisch',2.5,'K'),prod('tp2','Stk',0.5,0,'sup_gem',0,'G'),prod('tp3','kg',2,0,'sup_gem',0,'G'));
  const card=(id,type,yieldG,items)=>({id,no:900,name:'T '+id,type,category:'Test',yieldG,method:'',steps:[],items:items.map(([ref,qty])=>({ref,qty,net:''}))});
  S.cards.push(card('tsB','semi',150,[['p:tp3',300]]),card('tsA','semi',600,[['c:tsB',100],['p:tp2',3]]),card('tdX','dish',500,[['p:tp1',500]]),card('tdY','dish',110,[['c:tsA',50],['c:tsB',60]]));
  const dish=(id,name,price,card,days)=>({id,section:'Test',name,desc:'',price,card,img:'',veg:'',top:false,hidden:false,seasons:[],days:days||[],alg:'',order:0});
  S.menu=[dish('mX','X',20.9,'tdX'),dish('mW','W',10,'',[2]),dish('mZ','Z',5,'')];
  S.settings.closed=[3];S.specials=[];S.moves=[];S.salesDemo=false;
  // Verkaufstage: 01.07.–28.09.2025 und 02.04.–30.06.2026 (dazwischen geschlossen), X 10, Z 2, W 7 nur dienstags
  window.mkSales=(fn)=>{S.salesDays={};const add=(a,z)=>{for(let d=a;d<=z;d=dAdd(d,1)){const r=fn(d);if(r&&r.length)S.salesDays[d]=r;}};add('2025-07-01','2025-09-28');add('2026-04-02','2026-06-30');PLC.m.clear();};
  mkSales(d=>{const rows=[['mX',d==='2026-06-23'?20:10,(d==='2026-06-23'?20:10)*20.9],['mZ',2,10]];if(dParse(d).getDay()===2)rows.push(['mW',7,70]);return rows;});
});
// ---------- Prognose: Gewichtung, Saison, Trend ----------
const fc=await ev(()=>{const f=vbForecastRaw('2026-06-30');const X=f.items.find(i=>i.key==='mX'),W=f.items.find(i=>i.key==='mW');return {mode:f.mode,pick:f.pick,sea:f.seaMatch,T:f.trend.T,tf:f.trend.f,X:[X.f,X.lo,X.hi,X.last],W:W.f,closed:f.closed};});
ok(fc.mode==='wd'&&fc.sea&&fc.pick.join()==='2026-06-23,2026-06-16,2025-09-09,2025-09-02,2025-08-26,2025-08-19,2025-08-12,2025-08-05','picks the 8 most recent Tuesdays of the same season (skips spring Tuesdays, reaches into last summer)',fc.pick);
// Trend: letzte 7 Tage 7×12+7+10 = 101, davor 7×12+7 = 91 → 1 + 0,5×(101/91−1) = 1,054945
ok(near(fc.T,101/91,1e-6)&&near(fc.tf,1.054945,1e-5),'trend: last 7 open days vs 7 before, counted half',[fc.T,fc.tf]);
// Gewichte 0,8^i: Summe 4,1611392; (20 + 10×3,1611392)/4,1611392 = 12,40319; × Trend = 13,0847
ok(near(fc.X[0],13.0847,0.001),'weighted forecast X = 13,08 (plain average would be 11,25)',fc.X[0]);
// Spanne: gewichtete Streuung 4,2728 × Trend = 4,5076 > Wurzel(13,08) → 8,58 … 17,59
ok(near(fc.X[1],8.577,0.01)&&near(fc.X[2],17.592,0.01),'range = forecast ± weighted standard deviation (at least √forecast)',fc.X.slice(1,3));
ok(near(fc.W,7*1.054945,0.001),'Tuesday-only dish: 7 × trend',fc.W);
const wed=await ev(()=>{const f=vbForecastRaw('2026-07-01');const g=vbForecastRaw('2026-07-02');return [f.closed,g.items.some(i=>i.key==='mW'),g.closed]});
ok(wed[0]===true&&wed[1]===false&&wed[2]===false,'Wednesday = Ruhetag; Tuesday-only dish is not forecast on a Thursday',wed);
// zu wenig Verlauf: nur 2 Dienstage → einfacher Durchschnitt der letzten Verkaufstage
const thin=await ev(()=>{const keep=S.salesDays;const nd={};Object.keys(keep).forEach(d=>{if(d>='2026-06-16')nd[d]=keep[d]});S.salesDays=nd;PLC.m.clear();const f=vbForecastRaw('2026-06-30');const X=f.items.find(i=>i.key==='mX');const out={mode:f.mode,same:f.same,n:f.pick.length,X:X.f,tr:f.trend.used};S.salesDays=keep;PLC.m.clear();return out;});
// 14 Verkaufstage 16.–29.06., X: 13×10+20 = 150/14 = 10,714
ok(thin.mode==='avg'&&thin.same===2&&thin.n===14&&near(thin.X,150/14,0.001)&&!thin.tr,'< 3 same weekdays: says so and falls back to the plain average (10,71), no trend',thin);
// ---------- Rückblick ohne Blick nach vorn ----------
await ev(()=>mkSales(d=>[['mX',d==='2026-06-30'?24:10,0]]));
const bt=await ev(()=>vbBacktest('2026-06-30'));
// 28 Verkaufstage, Prognose immer 10, nur am letzten Tag 24 verkauft: 14/28 = 0,5 Portionen; Tagesmenge (14/24)/28 = 2,083 %
ok(bt.n===28&&bt.from==='2026-06-03'&&near(bt.mae,0.5,1e-6)&&near(bt.pct,14/24*100/28,1e-4),'back-test over 28 days: ± 0,5 portions, ± 2,08 % (walk-forward)',bt);
const peek=await ev(()=>{const a=vbForecastRaw('2026-06-23').items.find(i=>i.key==='mX').f;Object.keys(S.salesDays).forEach(d=>{if(d>='2026-06-23')S.salesDays[d]=[['mX',99,0]]});PLC.m.clear();const b2=vbForecastRaw('2026-06-23').items.find(i=>i.key==='mX').f;S.salesDays['2026-06-16']=[['mX',50,0]];PLC.m.clear();const c=vbForecastRaw('2026-06-23').items.find(i=>i.key==='mX').f;return [a,b2,c]});
ok(peek[0]===peek[1]&&peek[2]!==peek[0],'forecast for a day ignores that day and everything after it, but reacts to the day before',peek);
// ---------- Chargen ----------
const ex=await ev(()=>{const r=vbExplode([[C('tdY'),13]]);return {b:r.batches.map(x=>[x.c.id,x.need,x.y,x.n]),p:[...r.prod.entries()]}});
// 13 Portionen: A 13×50 = 650 g → 2 Chargen à 600; B: 13×60 = 780 + 2×100 aus A = 980 g → 7 Chargen à 150; tp2 2×3 = 6 Stk; tp3 7×0,3 = 2,1 kg
ok(JSON.stringify(ex.b)==='[["tsA",650,600,2],["tsB",980,150,7]]','batches: A 650 g → 2 × 600 g, then B 980 g (incl. what A needs) → 7 × 150 g',ex.b);
ok(ex.p.length===2&&ex.p.find(x=>x[0]==='tp2')[1]===6&&near(ex.p.find(x=>x[0]==='tp3')[1],2.1,1e-9),'raw ingredients from whole batches: 6 Stk, 2,1 kg',ex.p);
// ---------- Fehlmenge → Entwurf in Gebinden ----------
const pk=await ev(()=>[vbPacks(P('tp1'),3.2),vbPacks(P('tp1'),2.5),vbPacks(P('tp2'),5.2),vbPacks(P('tp3'),1.2),vbPacks(P('tp3'),0)]);
ok(pk.join()==='2,1,6,1.5,0','packs: 3,2 kg / 2,5 kg pack → 2; exact pack → 1; pieces round up; loose weight to half units',pk);
const dr=await ev(()=>{let D=todayStr();while((S.settings.closed||[]).includes(dParse(D).getDay()))D=dAdd(D,1);window.TD=D;S.orders=S.orders.filter(o=>o.supplier!=='sup_fleisch');planState().ov[D]={mX:9};PLC.m.clear();
  const pl=vbPlan(D);const x=pl.prods.find(q=>q.p.id==='tp1');const r1=vbToDraft('sup_fleisch',D);const l1=r1.o.lines.map(l=>[l.pid,l.n,l.f]);const r2=vbToDraft('sup_fleisch',D);
  return {need:x.need,stock:x.stock,miss:x.miss,packs:x.packs,st:r1.o.status,l1,add:[r1.add,r2.add,r2.up],n2:r2.o.lines.length,sups:pl.sups.map(s=>s.sid)}});
// 9 Portionen × 0,5 kg = 4,5 kg, Lager 1 kg → fehlt 3,5 kg → 2 Gebinde à 2,5 kg
ok(near(dr.need,4.5)&&dr.stock===1&&near(dr.miss,3.5)&&dr.packs===2,'need 4,5 kg, stock 1 kg → missing 3,5 kg → 2 packs',dr);
ok(dr.st==='draft'&&JSON.stringify(dr.l1)==='[["tp1",2,2.5]]'&&dr.add.join()==='1,0,0'&&dr.n2===1,'„In Bestellung legen“: one draft line of 2 packs; a second click adds nothing',dr.l1);
const inc=await ev(()=>{const D=window.TD;S.orders.push({id:'o_t',no:'B-T',supplier:'sup_fleisch',createdAt:new Date().toISOString(),createdBy:'u_chef',status:'sent',deliveryDate:D,note:'',lines:[lineFor(P('tp1'),1)]});PLC.m.clear();const pl=vbPlan(D);const x=pl.prods.find(q=>q.p.id==='tp1');const g=pl.sups.find(s=>s.sid==='sup_fleisch');return {coming:x.coming,miss:x.miss,packs:x.packs,drafted:g&&g.drafted}});
ok(near(inc.coming,2.5)&&near(inc.miss,1)&&inc.packs===1&&inc.drafted===true,'an order already sent for that day counts: missing 1 kg → 1 pack, covered by the draft',inc);
await L.done(b,errs);})();
