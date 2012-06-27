#!/bin/sh
VERSION=`cat version`

rm -Rf ./build/*
mkdir ./build


codegrinder doc/*.udoc --out=doc --version=$VERSION

cat src/core.js src/element.js src/deco.js src/dom.js src/dombuilder.js src/fx.js > build/jax.js
cat deps/timekeeper.js deps/interpolator.js build/jax.js > build/jax-all.js

cd deps/jak
./makejaklight.sh
cd ../..
cat deps/jak.light.js deps/timekeeper.js deps/interpolator.js build/jax.js > build/jaxsa.js
echo "JAX.version='$VERSION';" >> build/jax.js
echo "JAX.version='$VERSION-alldeps';" >> build/jax-all.js
echo "JAX.version='$VERSION-sa';" >> build/jaxsa.js

zip build/jax-$VERSION.zip deps/*.js test/* doc/*.html doc/*.css build/jax.js build/jax-all.js build/jaxsa.js README.md

mkdir build/doc
mv doc/*.html doc/*.css build/doc/