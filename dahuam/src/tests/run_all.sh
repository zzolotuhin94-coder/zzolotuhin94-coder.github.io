#!/bin/sh
# all fix checks + the existing regression scripts
cd "$(dirname "$0")"
for t in smoke f00_calc f01_inputs f02_stock_sales f03_report f04_misc f05_pcheck_labor_format f20_phone_touch_contrast; do node $t.js > out_$t.txt 2>&1; echo "$t rc=$? ok=$(grep -c '^  ok' out_$t.txt) fail=$(grep -c '^  FAIL' out_$t.txt) $(grep '^errors' out_$t.txt | tr '\n' ' ')"; done
cd ..
for t in t4 t8 t12 t13 t14 t15 t17 t18 th th2; do timeout 170 node $t.js > fixtests/out_$t.txt 2>&1; echo "$t rc=$? $(tail -1 fixtests/out_$t.txt | cut -c1-80)"; done
