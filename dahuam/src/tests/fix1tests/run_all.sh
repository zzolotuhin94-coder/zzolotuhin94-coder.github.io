#!/bin/sh
# fix1: Prep-Liste mit „noch da“, Tagestyp oben, Gebinde-Preise, festgeschriebene Auswertung, Bestellen (Vorschlag, Rückfrage), Leergut, Verkäufe buchen (Server auf :8771 oder PORT=…). Feste Uhr: Do 12.11.2026.
cd "$(dirname "$0")"
export PORT=${PORT:-8771}
for t in x01_prep_rest x02_gebinde x03_auswertung x04_bestellung x05_leergut x06_verkaeufe; do timeout 900 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
