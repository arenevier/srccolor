#!/bin/sh

python highlight.js/tools/build.py bash cpp css diff erlang haskell java javascript lisp lua perl python ruby scala sql tex vala vbscript
cp -a highlight.js/src/highlight.pack.js modules/highlight.jsm
zip -r srccolor.xpi README.txt install.rdf bootstrap.js content/ modules/
