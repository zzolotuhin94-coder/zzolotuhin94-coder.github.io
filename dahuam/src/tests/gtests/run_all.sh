#!/bin/sh
# Speisekarte-Gestalter: Vorlagen, Verbindung zur Speisekarte, Verschieben, Effekte, Rückgängig, PDF, Umstellung, Ansichten, fremder Text (Server muss auf :8765 laufen). Feste Uhr: Do 12.11.2026, 10:30.
cd "$(dirname "$0")"
for t in g01_vorlagen g02_verbunden g03_verschieben g04_effekte g05_pdf g06_umstellung g07_ansichten g08_fremdtext; do timeout 900 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
