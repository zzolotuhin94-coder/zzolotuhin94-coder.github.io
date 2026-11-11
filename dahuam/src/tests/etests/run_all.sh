#!/bin/sh
# Paket D2: Rezept für Küche und Service, Service-Liste, Eigenkontrolle (Wareneingang-Temperatur, Frittieröl, Reinigungsplan), Monatsmappe, alte Stände, Geräte (Server muss auf :8765 laufen). Feste Uhr: Do 12.11.2026, 10:30.
cd "$(dirname "$0")"
for t in e01_kueche e02_service e03_wareneingang e04_oel_reinigung e05_mappe e06_alt_handy; do timeout 900 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
