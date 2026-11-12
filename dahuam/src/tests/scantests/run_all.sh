#!/bin/sh
# Strichcode-Scanner: Codes und Prüfziffern, Dekoder (ZXing), künstliche Kamera (.y4m), Inventur zählen (auch Getränke in Zehnteln), Codes lernen,
# Artikel-Dialog und Import (Spalte EAN), ohne Kamera, ohne Code zählen, Wareneingang, offline, Geräte (Server auf :8774; anderer Port: PORT=…).
cd "$(dirname "$0")"
export PORT="${PORT:-8774}"
for t in sc01_codes sc02_inventur sc03_lernen sc04_artikel sc05_ohne_kamera sc06_geraete; do timeout 900 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
