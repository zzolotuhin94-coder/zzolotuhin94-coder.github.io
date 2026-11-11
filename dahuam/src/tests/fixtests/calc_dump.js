// dumps WE of all dishes/cards on fresh demo data: node calc_dump.js out.json
const L=require('./lib');const fs=require('fs');
(async()=>{const {b,p}=await L.open({});
// Paket D1: die Beispiel-Getränke (Schankrezepturen, c.drink) kamen später dazu; verglichen wird wie bisher die Küche. Getränke prüft dtests/d02_schank.js.
const r=await p.evaluate(()=>{const o={};const dk=c=>!!(c&&c.drink);S.menu.filter(m=>!dk(m.card&&C(m.card))).forEach(m=>{const k=menuCalc(m);o['m|'+m.section+'|'+m.name+'|'+(m.vlabel||'')]=[k.cost,k.netPrice,k.fc,k.margin];});S.cards.filter(c=>!dk(c)).forEach(c=>{const t=totals(c);o['c|'+c.id]=[t.cost,t.gross,t.net,t.out,[...t.alg].sort().join('')];c.items.forEach((it,i)=>{const l=line(it,0);o['l|'+c.id+'|'+i]=[l.cost,l.grossG,l.net,l.out];});});return o;});
fs.writeFileSync(process.argv[2],JSON.stringify(r,null,1));console.log('keys',Object.keys(r).length);await b.close();})();
