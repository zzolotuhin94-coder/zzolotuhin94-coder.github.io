#!/bin/sh
# Hilfe: kurzer Rundgang, „So geht’s hier“, „Was ist das?“ (Server muss auf :8765 laufen)
cd "$(dirname "$0")"
for t in g01_rundgang g02_sogehts g03_hilfe; do timeout 400 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
