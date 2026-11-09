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
