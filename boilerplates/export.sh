#!/bin/bash

# Requires (GNU tar) 1.32 to support
# reproducible tar builds

set -eoux pipefail

rm -rf ../src/assets/templates && mkdir -p ../src/assets/templates;

for i in $(ls -d */ | grep -v dist | grep -v bundles); do
    echo ${i%%/};
    gtar --mtime="1970-01-01" \
         --sort=name \
         --owner=0 --group=0 --numeric-owner \
         --exclude node_modules --exclude .DS_Store \
         --exclude dist --exclude __generated \
         -cv -C ./${i%%/} . | gzip -n > ../src/assets/templates/${i%%/}.tar.gz
done;
