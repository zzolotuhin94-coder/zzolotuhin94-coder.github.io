#!/bin/sh
# Handy-Bedienung (phone.js): Heute, Suchen und Scannen, Bestellen, Vorbereitung, Inventur, Rezept, Mehr, Geräte, „Nicht im Lager“ (Server muss auf :8765 laufen, oder PORT setzen)
cd "$(dirname "$0")"
for t in p01_heute p02_suchen p03_bestellen p04_vorbereitung p05_inventur p06_rezept p07_mehr p08_geraete p09_nicht_im_lager; do timeout 600 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
