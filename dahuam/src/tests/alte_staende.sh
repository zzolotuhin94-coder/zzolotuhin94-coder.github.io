#!/bin/sh
# Holt die alten gebauten Stände, gegen die storetests/s01, s12 (vor Paket A) und btests/b08 (vor Paket B) vergleichen.
cd "$(dirname "$0")"
git show eb66c0357aa2a21f2c6570249c6496e8ec1d3229:dahuam/index.html > index.before-a.html
git show 4be4b47ca1c4d49389e820516235d649b409724c:dahuam/index.html > index.before-b.html
echo "index.before-a.html und index.before-b.html geholt"
