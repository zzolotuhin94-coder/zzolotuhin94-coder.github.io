// Paket A: App-Symbole aus brand/logo.svg auf Schiefer (brand/slate.webp). Einmal ausführen: node icons.js (Server auf :8765)
const {chromium} = require('playwright'); const fs = require('fs');
const OUT = '/home/user/wt-2/dahuam/icons/';
(async () => {
  fs.mkdirSync(OUT, {recursive:true});
  const b = await chromium.launch(); const p = await b.newPage({deviceScaleFactor:1});
  // [Datei, Kantenlänge, Anteil des Logos an der Kante] – maskierbar: Logo bleibt im sicheren Kreis (80 %)
  const jobs = [['icon-192.png', 192, .74], ['icon-512.png', 512, .74], ['maskable-192.png', 192, .56], ['maskable-512.png', 512, .56], ['apple-touch-icon.png', 180, .68]];
  for(const [name, size, k] of jobs){
    await p.setViewportSize({width:size, height:size});
    const html = `<style>html,body{margin:0;width:${size}px;height:${size}px;overflow:hidden;background:#1f2326}
      .bg{position:absolute;inset:0;background:#16181a url(brand/slate.webp) center/cover;filter:contrast(1.12) brightness(.8)}
      .sh{position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,rgba(0,0,0,0) 30%,rgba(0,0,0,.45) 100%)}
      img{position:absolute;left:50%;top:50%;height:${Math.round(size*k)}px;transform:translate(-50%,-50%)}</style>
      <div class="bg"></div><div class="sh"></div><img src="brand/logo.svg">`;
    await p.route('**/__icon.html', r => r.fulfill({contentType:'text/html', body:html}));
    await p.goto('http://127.0.0.1:8772/dahuam/__icon.html'); await p.unroute('**/__icon.html');
    await p.waitForFunction(() => { const i = document.querySelector('img'); return i.complete && i.naturalWidth > 0; });
    await p.waitForTimeout(250);
    await p.screenshot({path:OUT + name, clip:{x:0, y:0, width:size, height:size}});
    console.log(name, fs.statSync(OUT + name).size);
  }
  await b.close();
})();
