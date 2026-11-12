import os, sys, json, hashlib
import re as _re
APP_VERSION = '1.6.0'   # Speisekarte-Gestalter: ein Modus für die Gästekarte, Vorlagen statt Stil-Schalter
SITE = '/home/user/zzolotuhin94-coder.github.io/dahuam/'
os.chdir(os.path.dirname(os.path.abspath(__file__)))
R = lambda f: open(f, encoding='utf-8').read()

# Reihenfolge zählt: spätere Dateien bauen auf früheren auf.
JS_BEFORE = ['script_de.js', 'store.js']          # Rechenkern, Speicher
JS_MODULES = ['season.js', 'season2.js', 'season3.js', 'einkauf.js', 'menu2.js', 'cloud.js', 'ui3.js', 'sales.js', 'report.js', 'menu3.js', 'prices.js',
              'game.js', 'drag.js', 'polish.js', 'pdf.js', 'allergen.js', 'hauskarte.js', 'fixes.js', 'guide_txt.js', 'guide.js', 'vorbereitung.js', 'team.js', 'nav.js', 'reliab.js', 'daten.js', 'bar.js', 'rezept.js', 'eigen.js', 'apart.js', 'welcome.js', 'gestalter.js', 'gestalter_ed.js', 'heute.js', 'ansicht.js', 'scan.js', 'phone.js']
CSS_MODULES = ['season.css', 'einkauf.css', 'menu2.css', 'ui3.css', 'report.css', 'prices.css', 'game.css', 'drag.css', 'polish.css',
               'fixes.css', 'guide.css', 'plus.css', 'team.css', 'reliab.css', 'nav.css', 'daten.css', 'bar.css', 'rezept.css', 'eigen.css', 'apart.css', 'welcome.css', 'gestalter.css', 'heute.css', 'ansicht.css', 'scan.css', 'phone.css']
start = '/* ---------- Start ---------- */'
a, b = R('ui2.js').split(start)                   # ui2.js: Oberfläche; der Start-Block läuft erst nach allen Modulen
js = '\n'.join([R(f) for f in JS_BEFORE] + [a] + [R(f) for f in JS_MODULES] + [start + b])
# Schriftgröße (Einstellungen › Anzeige): jede Schriftgröße in px wird zu calc(Npx * var(--fz,1)); am Bildschirm nichts unter 12 px.
# Ausgenommen: Druck und PDF (@media print, #print), der Speisekarte-Gestalter (seine Seite ist ein festes A4-Blatt), @font-face,
# das Allergen-Blatt und die Monatsmappe (.ab-*, .mp-*: ebenfalls feste A4-Blätter, deren kleine Schrift sonst auf 12 px wüchse und überliefe).
FZ_SKIP_FILES = {'fonts.css', 'gestalter.css'}
def fz(css):
    out = []; stack = []; i = 0; n = len(css); last = 0
    def skip():
        return any(p.startswith('@media print') or '#print' in p or '.pdf' in p or p.startswith('@font-face') or p.startswith('@page') or p.startswith('@keyframes') or _re.search(r'\.(ab|mp)-', p) for p in stack)
    def decl(txt):
        if skip(): return txt
        def one(m):
            v = float(m.group(2)); v = max(v, 12.0)
            return m.group(1) + 'calc(' + ('%g' % v) + 'px*var(--fz,1))'
        txt = _re.sub(r'(font-size\s*:\s*)(\d*\.?\d+)px(?=\s*(?:!important)?\s*(?:;|$))', one, txt)
        txt = _re.sub(r'(font\s*:\s*(?:italic\s+|normal\s+|small-caps\s+)*(?:\d{3}\s+|bold\s+|normal\s+)?)(\d*\.?\d+)px', one, txt)
        return txt
    while i < n:
        c = css[i]
        if c == '/' and css.startswith('/*', i):
            j = css.find('*/', i + 2); j = n if j < 0 else j + 2; i = j; continue
        if c == '{':
            seg = css[last:i]; k = max(seg.rfind(';'), seg.rfind('}'))
            pre = _re.sub(r'/\*.*?\*/', '', seg[k + 1:], flags=_re.S).strip()
            out.append(decl(seg)); out.append('{'); stack.append(pre); last = i + 1
        elif c == '}':
            out.append(decl(css[last:i])); out.append('}'); stack and stack.pop(); last = i + 1
        i += 1
    out.append(css[last:]); return ''.join(out)
_sh = R('shell.html'); _a, _b = _sh.split('<style>', 1); _st, _c = _b.split('</style>', 1)
shell = _a + '<style>' + fz(_st) + '</style>' + _c
shell = shell.replace('/*FONTS*/', R('fonts.css'), 1).replace('/*MODULE_CSS*/', ''.join(R(f) if f in FZ_SKIP_FILES else fz(R(f)) for f in CSS_MODULES), 1)
def _pdfcss(css):
    out=[]; i=0
    while True:
        k=css.find('@media print{', i)
        if k<0: break
        j=k+len('@media print{'); depth=1; st=j
        while depth and j<len(css):
            if css[j]=='{': depth+=1
            elif css[j]=='}': depth-=1
            j+=1
        body=css[st:j-1]; i=j
        for m in _re.finditer(r'([^{}]+)\{([^{}]*)\}', body):
            sel, dec = m.group(1).strip(), m.group(2)
            if '#print' not in sel or 'body >' in sel or '::before' in sel: continue
            sel=','.join(x.replace('#print', '#print.pdf') for x in sel.split(','))
            out.append(sel+'{'+dec+'}')
    return '\n'.join(out)
_light = _re.search(r':root\{([^}]*--bg:#f7f5f0[^}]*)\}', R('ui3.css')).group(1)
pdfcss = '#print.pdf{display:block!important;position:absolute;left:-12000px;top:0;width:794px;padding:44px 50px;box-sizing:border-box;background:#fff;color:#000;color-scheme:light;' + _light + '}\n' + _pdfcss(shell) + '\n#print.pdf .wk-paper{box-shadow:none;max-width:none;padding:0}#print.pdf .wk-tabs,#print.pdf .wk-filters{display:none}#print.pdf .wk-cols{columns:2}'
shell = shell.replace('</style>', pdfcss + '\n</style>', 1)
out = shell.replace('/*SCRIPT*/', js)
assert 'fonts.googleapis.com/css2?family=Cormorant' not in out and out.count('<link rel="stylesheet"') == 0

# ---------- Paket A: Offline-Paket (Service Worker, Manifest) mit gemeinsamer Build-Kennung ----------
ICONS = ['icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-192.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png']
PRECACHE = ['manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png'] + ['brand/logo.svg', 'brand/slate.webp', 'brand/table.webp'] \
    + ['photos/unmatched/gaststube.webp', 'photos/unmatched/aussen-winter.webp', 'photos/unmatched/silvesterabend-fondue.webp'] + json.load(open('vendor_files.json')) \
    + (['Anleitung-DAHUAM202.pdf'] if os.path.exists(SITE + 'Anleitung-DAHUAM202.pdf') else [])   # Anleitung (anleitung/make.js), offline verfügbar
manifest = json.dumps({
  'name': 'DAHUAM.202 Küche', 'short_name': 'DAHUAM Küche', 'description': 'Kalkulation, Lager, Einkauf und Dienstplan für die Küche',
  'lang': 'de-AT', 'dir': 'ltr', 'id': './', 'start_url': './index.html', 'scope': './', 'display': 'standalone', 'orientation': 'any',
  'background_color': '#1f2326', 'theme_color': '#173229',
  'icons': [
    {'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
    {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
    {'src': 'icons/maskable-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'maskable'},
    {'src': 'icons/maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]}, ensure_ascii=False, indent=1)
sw = R('sw-src.js')
h = hashlib.sha256(); h.update(out.encode('utf-8')); h.update(sw.encode('utf-8')); h.update(manifest.encode('utf-8')); h.update(os.environ.get('DAHUAM_BUILD_SALT', '').encode())
missing = [f for f in PRECACHE if f != 'manifest.webmanifest' and not os.path.exists(SITE + f)]
if missing: sys.exit('fehlt im Ordner dahuam/: ' + ', '.join(missing) + '  (python3 vendor.py / node icons.js)')
for f in PRECACHE:
    if f != 'manifest.webmanifest': h.update(open(SITE + f, 'rb').read())
BUILD = h.hexdigest()[:10]
assert out.count("'/*APP_BUILD*/'") == 1 and out.count("'/*APP_VERSION*/'") == 1
out = out.replace('/*APP_BUILD*/', BUILD).replace('/*APP_VERSION*/', APP_VERSION)
OUTDIR = os.environ.get('DAHUAM_OUT', SITE)
open(OUTDIR + 'index.html', 'w', encoding='utf-8').write(out)
open(OUTDIR + 'manifest.webmanifest', 'w', encoding='utf-8').write(manifest + '\n')
open(OUTDIR + 'sw.js', 'w', encoding='utf-8').write(sw.replace('/*APP_BUILD*/', BUILD).replace('/*PRECACHE*/[]', json.dumps(PRECACHE)))
print('built', len(out), 'version', APP_VERSION, 'build', BUILD, 'precache', len(PRECACHE) + 1, 'files', (sum(os.path.getsize(SITE + f) for f in PRECACHE if os.path.exists(SITE + f)) + len(out.encode('utf-8'))) // 1024, 'KB')
