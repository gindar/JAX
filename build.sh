#!/bin/sh
VERSION=`cat version`

rm -Rf ./build/*
mkdir ./build

if [ "$1" = "devel" ]; then
	VERSION=`cat version`"-"`date +"%Y%m%d.devel"`
fi

cat src/core.js src/element.js src/deco.js src/dom.js src/dombuilder.js src/fx.js > build/jax.js
cat deps/timekeeper.js deps/interpolator.js build/jax.js > build/jax-all.js
cat deps/jak.light.js deps/timekeeper.js deps/interpolator.js build/jax.js > build/jaxsa.js
echo "JAX.version='$VERSION';" >> build/jax.js
echo "JAX.version='$VERSION-alldeps';" >> build/jax-all.js
echo "JAX.version='$VERSION-sa';" >> build/jaxsa.js

if [ "$1" = "release" ]; then
	zip build/jax-$VERSION.zip deps/* test/* doc/* build/jax.js build/jax-all.js build/jaxsa.js README.md
fi

if [ "$1" = "devel" ]; then
	zip build/jax-$VERSION.zip version src/* deps/* test/* doc/* build.sh README.md
fi

