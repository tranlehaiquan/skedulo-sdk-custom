#!/bin/bash

rm -rf ../src/assets/templates && mkdir -p ../src/assets/templates;

for i in $(ls -d */ | grep -v dist | grep -v bundles); do
    echo ${i%%/};
    tar --exclude node_modules --exclude .DS_Store -cvzf ../src/assets/templates/${i%%/}.tar.gz -C ./${i%%/} .
done;
