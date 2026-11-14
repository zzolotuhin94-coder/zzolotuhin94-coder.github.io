# Fremde Bestandteile in `dahuam/vendor/`

Alles hier liegt auf dem eigenen Server, damit die App ohne fremde Dienste und ohne Internet startet.
Quelle ist jeweils das angegebene Paket aus der npm-Registry, unverändert kopiert (`vendor.py`). Ausnahme SheetJS (xlsx): die npm-Registry endet bei 0.18.5
(mit den Lücken CVE-2023-30533 und CVE-2024-22363); 0.20.3 kommt als Paket direkt vom Hersteller, https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
(SHA-256 8dc73fc3b00203e72d176e85b50938627c7b086e607c682e8d3c22c02bb99fe8), Datei `package/dist/xlsx.full.min.js`, unverändert.
Die vollständigen Lizenztexte liegen im Ordner `licenses/`.

| Datei / Schrift | Art | Paket und Version | Lizenz | Größe |
|---|---|---|---|---|
| Figtree | Schrift | @fontsource-variable/figtree 5.3.0 | OFL-1.1 | 30 KB |
| Barlow Condensed | Schrift | @fontsource/barlow-condensed 5.3.0 | OFL-1.1 | 175 KB |
| Fraunces | Schrift | @fontsource-variable/fraunces 5.3.0 | OFL-1.1 | 273 KB |
| Caveat | Schrift | @fontsource-variable/caveat 5.3.0 | OFL-1.1 | 102 KB |
| Schibsted Grotesk | Schrift | @fontsource-variable/schibsted-grotesk 5.3.0 | OFL-1.1 | 66 KB |
| Source Serif 4 | Schrift | @fontsource-variable/source-serif-4 5.3.1 | OFL-1.1 | 453 KB |
| JetBrains Mono | Schrift | @fontsource/jetbrains-mono 5.3.0 | OFL-1.1 | 29 KB |
| Cormorant Garamond | Schrift | @fontsource-variable/cormorant-garamond 5.3.0 | OFL-1.1 | 142 KB |
| html2canvas.min.js | Bibliothek | html2canvas 1.4.1 | MIT | 194 KB |
| jspdf.umd.min.js | Bibliothek | jspdf 2.5.1 | MIT | 356 KB |
| xlsx.full.min.js | Bibliothek | xlsx 0.20.3 (von cdn.sheetjs.com, siehe unten) | Apache-2.0 | 930 KB |
| zxing-library.min.js | Bibliothek | @zxing/library 0.21.3 | Apache-2.0 | 328 KB |

- **OFL-1.1** (SIL Open Font License): Schriften dürfen verwendet, eingebettet und weitergegeben werden; die Lizenz muss beiliegen, die Schriften dürfen nicht einzeln verkauft werden.
- **MIT** (html2canvas © Niklas von Hertzen, jsPDF © James Hall, yWorks GmbH und Mitwirkende): Verwendung frei, Copyright-Hinweis muss erhalten bleiben.
- **Apache-2.0** (SheetJS Community Edition © SheetJS LLC; ZXing © ZXing-Autoren, TypeScript-Fassung © zxing-js-Mitwirkende): Verwendung frei, Lizenz- und Copyright-Hinweis müssen erhalten bleiben.

Von den Schriften sind nur die Teile „latin“ und „latin-ext“ und nur die Schnitte enthalten, die die App zeichnet.
