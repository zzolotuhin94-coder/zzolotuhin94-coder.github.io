#!/bin/sh
# Paket B: Aufräumen. Umstellung alter Stände, Navigation, Einrichtung, Prep-Liste, Inventur am Handy, Zahlen, Rollen, Entferntes, Handy-Breite (Server muss auf :8765 laufen)
cd "$(dirname "$0")"
for t in b01_migration b02_nav b03_einrichtung b04_prep b05_inventur_handy b06_zahlen b07_rollen b08_weg b09_handy; do timeout 500 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
