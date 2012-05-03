cat info.txt
VERSION=`cat version`

if [ "$1" = "devel" ]; then
	VERSION=`cat version`"-"`date +"%Y%m%d.devel"`
fi

cat src/core.js src/element.js src/deco.js src/dom.js src/dombuilder.js src/fx.js > jax.js
cat deps/timekeeper.js deps/interpolator.js jax.js > jax-all.js
cat deps/jak.js deps/timekeeper.js deps/interpolator.js jax.js > jaxsa.js
echo "JAX.version='$VERSION';" >> jax.js
echo "JAX.version='$VERSION-alldeps';" >> jax-all.js
echo "JAX.version='$VERSION-sa';" >> jaxsa.js
cp jax-all.js doc/

if [ "$1" = "release" ]; then
	zip jax-$VERSION.zip src/* deps/* test/* doc/* jax.js jax-all.js jaxsa.js info.txt
fi

if [ "$1" = "devel" ]; then
	zip jax-$VERSION.zip version src/* deps/* test/* doc/* build.sh info.txt info_devel.txt
fi

