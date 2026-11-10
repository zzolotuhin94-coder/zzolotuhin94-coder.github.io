#!/bin/sh
# Team: Rechenkern, Dienstplan-Abläufe, Checklisten, Handy (Server muss auf :8765 laufen)
cd "$(dirname "$0")"
for t in d01_calc d02_ui d03_check d04_phone d05_bereich; do timeout 500 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
