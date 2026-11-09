#!/bin/sh
# guide layer checks (server must run on :8765)
cd "$(dirname "$0")"
for t in g01_tour g02_guides g03_interactive g04_help g05_missions g06_simple_firstrun; do timeout 400 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
