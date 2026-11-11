#!/bin/sh
# Paket A: Speicher, Wiederherstellung, zwei Fenster, Offline, Update (Server muss auf :8765 laufen; anderer Port: PORT=…)
cd "$(dirname "$0")"
for t in s00_smoke s01_migration s02_failure s03_crash s04_corrupt s05_snapshots s06_reminder s07_tabs s08_offline s09_update s10_schema_cloud s11_xss s12_perf s13_embed; do timeout 600 node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
