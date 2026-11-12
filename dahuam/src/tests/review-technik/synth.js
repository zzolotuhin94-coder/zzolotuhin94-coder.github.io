// runs in page: grow S to N years of realistic use. Returns sizes.
module.exports = function synth(years){
  const iso = d => d.toISOString().slice(0,10);
  const demoDays = Object.values(S.salesDays); const tplRuns = Object.values(S.checks.runs); const tplShifts = Object.values(S.team.shifts).filter(x=>x.length>=3);
  const start = new Date(); start.setDate(start.getDate() - Math.round(365*years));
  const pids = S.products.map(p=>p.id); let n = 0;
  for(let d = new Date(start); d <= new Date(); d.setDate(d.getDate()+1)){
    const k = iso(d); const wd = d.getDay(); if(wd === 1) continue;            // 1 Ruhetag
    if(!S.salesDays[k]) S.salesDays[k] = demoDays[n % demoDays.length];
    if(!S.checks.runs[k]) S.checks.runs[k] = JSON.parse(JSON.stringify(tplRuns[n % tplRuns.length]));
    if(!S.team.shifts[k]) S.team.shifts[k] = tplShifts[n % tplShifts.length].map((s,i)=>({...s, id:'ts_x'+n+'_'+i, demo:undefined}));
    for(let i=0;i<8;i++) S.moves.push({id:'mv_x'+n+'_'+i, date:d.toISOString(), type:i%3?'out':'in', pid:pids[(n+i)%pids.length], qty:1+i, price:9.5, note:i%3?'':'Lieferschein '+(1000+n)});
    if(wd===2||wd===4||wd===5){ const o = JSON.parse(JSON.stringify(S.orders[0])); o.id='o_x'+n; o.no='B-X-'+n; o.deliveryDate=k; S.orders.push(o); }
    n++;
  }
  const sz = {}; for(const k of ['salesDays','checks','team','moves','orders']) sz[k] = JSON.stringify(S[k]).length;
  sz.total = JSON.stringify(S).length; sz.days = n; return sz;
};
