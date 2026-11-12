#!/bin/sh
# Apartments: Buchungen, Kalender-Import (.ics), Übersicht, Reinigung, Heute, PDF, Sicherung, Beispiele, alter Stand, Geräte.
# Server muss auf :8765 laufen (python3 -m http.server 8765 im Ordner über dahuam/), oder PORT=… setzen. Feste Uhr: Do 12.11.2026, 10:30.
cd "$(dirname "$0")"
export PORT=${PORT:-8765}
for t in a01_buchung a02_ics a03_uebersicht a04_reinigung a05_pdf_daten a06_geraete; do timeout 900 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
