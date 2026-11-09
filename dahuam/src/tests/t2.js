const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
const F='file:///home/user/zzolotuhin94-coder.github.io/dahuam/index.html';
for(const [w,h,cs,tag] of [[1440,960,'light','d'],[390,844,'dark','m']]){
 const p=await b.newPage({viewport:{width:w,height:h},colorScheme:cs});p.on('pageerror',e=>errs.push(tag+e.message));p.on('console',m=>m.type()==='error'&&errs.push(tag+m.text()));
 await p.goto(F);await p.waitForTimeout(900);await p.screenshot({path:tag+'-dash.png'});
 console.log(tag,'overflow',await p.evaluate(()=>document.documentElement.scrollWidth));
 await p.click('[data-tab=menu] >> visible=true');await p.waitForTimeout(300);await p.screenshot({path:tag+'-menu.png'});
 await p.evaluate(()=>go('cards','dish_schnitzel_veal'));await p.waitForTimeout(300);
 await p.fill('#sim','24');await p.dispatchEvent('#sim','input');await p.fill('#portions','40');await p.dispatchEvent('#portions','input');
 await p.screenshot({path:tag+'-card.png',fullPage:tag==='d'});
 console.log(tag,'overflow card',await p.evaluate(()=>document.documentElement.scrollWidth));
 await p.keyboard.press('Control+k');await p.waitForTimeout(100);console.log(tag,'focus',await p.evaluate(()=>document.activeElement.id));await p.keyboard.type('fondue');await p.waitForTimeout(150);await p.screenshot({path:tag+'-pal.png'});
 await p.keyboard.press('Enter');await p.waitForTimeout(200);console.log(tag,'after pal',await p.evaluate(()=>view.tab+' '+view.card));
 await p.evaluate(()=>go('products'));await p.fill('#pp-veal','28');await p.press('#pp-veal','Enter');await p.waitForTimeout(200);
 console.log(tag,'toast',await p.textContent('#toast'));
}
console.log('errors',errs);await b.close();})();
