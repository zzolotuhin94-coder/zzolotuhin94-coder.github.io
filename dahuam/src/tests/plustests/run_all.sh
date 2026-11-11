#!/bin/sh
# Vorbereitung: Rechenkern, Abläufe, Handy/Geschwindigkeit (Server muss auf :8765 laufen)
cd "$(dirname "$0")"
for t in p01_math p02_ui p03_phone_perf; do timeout 400 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
