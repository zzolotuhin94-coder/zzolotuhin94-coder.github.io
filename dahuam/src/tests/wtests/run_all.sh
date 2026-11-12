#!/bin/sh
# Willkommensseite: erster Start, Widmung und Geschenk-Link, Hinweis je Gerät, Anleitung als PDF, Aussehen (Server muss auf :8765 laufen). Feste Uhr: Do 12.11.2026, 10:30.
cd "$(dirname "$0")"
for t in w01_erster_start w02_geraete w03_widmung_link w04_pdf_aussehen; do timeout 900 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
