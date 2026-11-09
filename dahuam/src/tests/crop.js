// node crop.js <name> <w> <h> "<js setup>" [selector to scroll to] [yoffset]
const L=require('./lib');const [,, name,W,H,js,sel,yo]=process.argv;
(async()=>{const {b,p,errs}=await L.open({vp:{width:+W,height:+H},mobile:+W<600,touch:+W<600});
await p.evaluate(js);await p.waitForTimeout(400);
if(sel){await p.evaluate(([s,y])=>{const e=document.querySelector(s);if(e){const r=e.getBoundingClientRect();window.scrollTo(0,window.scrollY+r.top-(+y||80));}},[sel,yo]);await p.waitForTimeout(250);}
await p.screenshot({path:`shots/${name}.png`});console.log(JSON.stringify(errs));await b.close();})();
