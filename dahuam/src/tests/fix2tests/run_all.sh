#!/bin/sh
# fix2: Befunde der Durchsicht (Aufzeichnungen und Sicherheit, Rezepte, Dialoge). Feste Uhr: Do 12.11.2026, 10:30. Server auf PORT (wie etests).
# Vorher-/Nachher-Bilder: node shots.js before|after (keine Prüfung, nur Bilder).
cd "$(dirname "$0")"
for t in x01_eigenkontrolle x02_wareneingang x03_allergene x04_dialog_undo x05_rezepte; do timeout 900 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
