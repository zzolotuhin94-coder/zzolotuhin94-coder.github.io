#!/bin/sh
# Paket C: Eigene Daten. Leer starten, Importe (Speisekarte, Artikel, Rezepturen, Team), Allergene, zweiter Steuersatz, Rollen, alte Stände, Handy (Server muss auf :8765 laufen)
cd "$(dirname "$0")"
for t in c01_leer c02_speisekarte c03_artikel c04_rezepturen c05_team c06_allergene c07_mwst c08_rollen c09_migration c10_handy; do timeout 600 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
