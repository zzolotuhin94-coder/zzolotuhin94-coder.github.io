#!/bin/sh
# Paket fix-3: Heute als ruhiges Tagesblatt, Schnellsuche, Platz auf Handy und Tablet, Lesbarkeit (Schriftgröße, Kontrast), untere Leiste, Einstellungen.
# Server muss laufen (PORT, Standard :8765). Feste Uhr: Do 12.11.2026, 10:30. Bilder nach ../x-out (oder SHOTS=Ordner).
cd "$(dirname "$0")"
for t in x01_heute x02_suche x03_platz x04_lesbar x05_navigation x06_einstellungen; do timeout 900 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
