JAX (JAK Extended)
===

Postaveno na [seznam/JAK](https://github.com/seznam/JAK).

JAX je kompaktní a jednoduchý systém silně provázaných knihoven, usnadňující práci v prostředí jazyka JavaScript a knihovny JAK.


Je potreba techto knihoven: 
 - JAK - co nejnovejsi
 - timekeeper - 1.0+
 - interpolator - 2.1+


Ve slozce deps/ jsou tyto knihovny ve verzi s niz funguje jax bezproblemove.

Soubor jax-all.js obsahuje timekeeper i interpolator.

Baleni vlastni verze JAXu (vytvari jax.js jax-all.js a jax-<verze>.zip):
 - './build.sh release' - zabali do zipu vydani JAXu
 - './build.sh devel' - zabali veskery obsah slozky s jaxem do zipu
 - './build.sh' - vybuildi jen jax.js a jax-all.js
  
Chyby a napady: https://github.com/gindar/JAX/issues

