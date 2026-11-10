// Calculation core unchanged: compare WE of all dishes, recipes and lines with the dump taken before the fixes (calc_before.json)
const L=require('./lib');const ok=L.ok;const fs=require('fs');const {execSync}=require('child_process');
(async()=>{execSync('node calc_dump.js calc_after.json',{cwd:__dirname});
const a=JSON.parse(fs.readFileSync(__dirname+'/calc_before.json')),b=JSON.parse(fs.readFileSync(__dirname+'/calc_after.json'));
const ka=Object.keys(a),kb=Object.keys(b);ok(ka.length===kb.length&&ka.every(k=>k in b),'same set of dishes/recipes/lines',[ka.length,kb.length]);
const diff=ka.filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k]));ok(diff.length===0,'all '+ka.length+' values numerically identical (cost, net price, WE %, margin, weights, allergens)',diff.slice(0,5));
// moving average price
const {b:br,p,errs}=await L.open({});
const r=await p.evaluate(()=>{const pr=P('pork');pr.stock=10;pr.price=8;moveDlg('in:pork');const f=$('#dlgForm');f.elements.qty.value='10';f.elements.price.value='10,00';f.requestSubmit();return {price:pr.price,stock:pr.stock,prev:S.moves[0].prevPrice,mp:S.moves[0].price};});
ok(r.price===9&&r.stock===20&&r.prev===8&&r.mp===10,'moving-average price on Wareneingang: (10×8 + 10×10)/20 = 9,00',r);
const r2=await p.evaluate(()=>{const pr=P('veal');pr.stock=4;pr.price=30;receiveIn(pr,6,35,'t',null);return pr.price});
ok(r2===33,'moving average in order receipt: (4×30 + 6×35)/10 = 33,00',r2);
await L.done(br,errs);})();
