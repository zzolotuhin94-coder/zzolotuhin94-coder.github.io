#!/usr/bin/env python3
"""Paket A: Schriften und Bibliotheken aus den npm-Paketen (Ordner dl/) nach dahuam/vendor/ kopieren.
Erzeugt fonts.css (wird von build.py in die Seite eingebettet) und vendor/LICENSES.md.
Einmal ausführen, wenn sich die Auswahl ändert:  python3 vendor.py"""
import os, re, shutil, json, glob
SP = os.path.dirname(os.path.abspath(__file__)); DL = os.path.join(SP, 'dl')
OUT = '/home/user/zzolotuhin94-coder.github.io/dahuam/vendor'
os.makedirs(OUT + '/fonts', exist_ok=True); os.makedirs(OUT + '/licenses', exist_ok=True)
def pkg(prefix):
    d = [x for x in glob.glob(DL + '/x_' + prefix + '-[0-9]*') if os.path.isdir(x)]
    assert len(d) == 1, (prefix, d); p = d[0] + '/package'; return p, json.load(open(p + '/package.json'))
# (Paket, CSS-Schriftname in der App, [CSS-Dateien des Pakets])  -- nur was die App wirklich zeichnet (siehe storetests/font_audit.js)
FONTS = [
 ('fontsource-variable-figtree', 'Figtree', ['wght.css']),
 ('fontsource-barlow-condensed', 'Barlow Condensed', ['300.css', '400.css', '500.css', '600.css', '700.css']),
 ('fontsource-variable-fraunces', 'Fraunces', ['opsz.css', 'opsz-italic.css']),
 ('fontsource-variable-caveat', 'Caveat', ['wght.css']),
 ('fontsource-pt-sans', 'PT Sans', ['400.css', '700.css']),
 ('fontsource-variable-roboto-condensed', 'Roboto Condensed', ['wght.css']),
 ('fontsource-saira-condensed', 'Saira Condensed', ['300.css', '400.css']),
 ('fontsource-variable-schibsted-grotesk', 'Schibsted Grotesk', ['wght.css']),
 ('fontsource-variable-source-serif-4', 'Source Serif 4', ['opsz.css', 'opsz-italic.css']),
 ('fontsource-jetbrains-mono', 'JetBrains Mono', ['500.css']),
]
# variable Schriften: Bereich so begrenzen, wie die Schnitte bisher geladen wurden (gleiches Schriftbild wie vorher)
WEIGHTS = {'Figtree':'400 700', 'Fraunces':'300 600', 'Caveat':'400 600', 'Roboto Condensed':'400 700', 'Schibsted Grotesk':'500 600', 'Source Serif 4':'400 600'}
LIBS = [('html2canvas', 'dist/html2canvas.min.js', 'html2canvas.min.js'), ('jspdf', 'dist/jspdf.umd.min.js', 'jspdf.umd.min.js'), ('xlsx', 'dist/xlsx.full.min.js', 'xlsx.full.min.js')]
css = []; rows = []; files = []
for prefix, fam, sheets in FONTS:
    p, meta = pkg(prefix); n = 0
    for sh in sheets:
        for m in re.finditer(r'/\*\s*([\w-]+)\s*\*/\s*@font-face\s*\{([^}]*)\}', open(p + '/' + sh, encoding='utf-8').read()):
            name, body = m.group(1), m.group(2)
            if not re.search(r'-latin(-ext)?-', '-' + name.split(meta['name'].split('/')[-1] + '-')[-1] + '-') or re.search(r'cyrillic|greek|vietnamese', name): continue
            get = lambda k: re.search(k + r':\s*([^;]+);', body).group(1).strip()
            fn = name + '.woff2'; src = p + '/files/' + fn; assert os.path.exists(src), src
            shutil.copyfile(src, OUT + '/fonts/' + fn); files.append('vendor/fonts/' + fn); n += os.path.getsize(src)
            w = WEIGHTS.get(fam, get('font-weight')) if ' ' in get('font-weight') else get('font-weight')
            css.append('@font-face{font-family:"%s";font-style:%s;font-weight:%s;font-display:swap;src:url(vendor/fonts/%s) format("woff2");unicode-range:%s}' % (fam, get('font-style'), w, fn, get('unicode-range').replace(' ', '')))
    lic = p + '/LICENSE'; shutil.copyfile(lic, OUT + '/licenses/' + prefix.replace('fontsource-variable-', '').replace('fontsource-', '') + '-OFL.txt')
    rows.append('| %s | Schrift | %s %s | %s | %d KB |' % (fam, meta['name'], meta['version'], meta['license'], round(n/1024)))
for name, src, dst in LIBS:
    p, meta = pkg(name); shutil.copyfile(p + '/' + src, OUT + '/' + dst); files.append('vendor/' + dst)
    shutil.copyfile(p + '/LICENSE', OUT + '/licenses/' + name + '-LICENSE.txt')
    rows.append('| %s | Bibliothek | %s %s | %s | %d KB |' % (dst, meta['name'], meta['version'], meta['license'], round(os.path.getsize(p + '/' + src)/1024)))
open(SP + '/fonts.css', 'w', encoding='utf-8').write('\n'.join(css) + '\n')
open(SP + '/vendor_files.json', 'w').write(json.dumps(files, indent=0))
open(OUT + '/LICENSES.md', 'w', encoding='utf-8').write('''# Fremde Bestandteile in `dahuam/vendor/`

Alles hier liegt auf dem eigenen Server, damit die App ohne fremde Dienste und ohne Internet startet.
Quelle ist jeweils das angegebene Paket aus der npm-Registry, unverändert kopiert (`vendor.py`).
Die vollständigen Lizenztexte liegen im Ordner `licenses/`.

| Datei / Schrift | Art | Paket und Version | Lizenz | Größe |
|---|---|---|---|---|
''' + '\n'.join(rows) + '''

- **OFL-1.1** (SIL Open Font License): Schriften dürfen verwendet, eingebettet und weitergegeben werden; die Lizenz muss beiliegen, die Schriften dürfen nicht einzeln verkauft werden.
- **MIT** (html2canvas © Niklas von Hertzen, jsPDF © James Hall, yWorks GmbH und Mitwirkende): Verwendung frei, Copyright-Hinweis muss erhalten bleiben.
- **Apache-2.0** (SheetJS Community Edition © SheetJS LLC): Verwendung frei, Lizenz- und Copyright-Hinweis müssen erhalten bleiben.

Von den Schriften sind nur die Teile „latin“ und „latin-ext“ und nur die Schnitte enthalten, die die App zeichnet.
''')
print(len(css), 'font faces,', len(files), 'files,', sum(os.path.getsize('/home/user/zzolotuhin94-coder.github.io/dahuam/' + f) for f in files)//1024, 'KB')
