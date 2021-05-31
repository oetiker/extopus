#!/bin/bash
set -e
set -x
TOOL=ep
VERS=$(cat VERSION)
TOVE=$TOOL-$VERS
eval "$(plenv init -)"
echo $VERS $(date +"%Y-%m-%d %H:%M:%S %z") $(git config user.name) '<'$(git config user.email)'>' >> CHANGES.new
echo >> CHANGES.new
echo ' -' >> CHANGES.new
echo >> CHANGES.new
cat CHANGES >> CHANGES.new && mv CHANGES.new CHANGES
$EDITOR CHANGES
rm -f config.status
./bootstrap
for x in 5.32.0; do
  xs=$(echo $x| sed 's/.[0-9]*$//')
  test thirdparty/cpanfile-$xs.snapshot -nt cpanfile && continue
  echo "Building dependencies for perl $x ($xs)"
  plenv shell $x
  ./configure 
  cd thirdparty
  mv lib .lib-off
  make clean
  if [ -d .lib-$xs ]; then
     mv .lib-$xs lib
  fi
  make
  mv lib .lib-$xs
  make clean
  mv .lib-off lib
  cd ..
done
./configure
make
make test
make dist

