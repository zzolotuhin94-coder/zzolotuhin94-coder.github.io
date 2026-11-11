#!/bin/sh
# Paket D1: Bar & Getränke. Getränke-Artikel, Schankrezeptur, Pfand und Leergut, Bar-Inventur, Gästekarte, Beispieldaten, alte Stände, Handy (Server muss auf :8765 laufen)
cd "$(dirname "$0")"
for t in d01_artikel d02_schank d03_pfand d04_inventur d05_gaestekarte d06_demo_alt_handy; do timeout 600 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
