#!/bin/bash

set -eou pipefail

[[ -z "$1" ]] && { echo "Error: No SDK filename given"; exit 1; }
[[ -z "$2" ]] && { echo "Error: No Dist path given"; exit 1; }
[[ -z "$3" ]] && { echo "Error: No AWS Bucket given"; exit 1; }

SDK_FILENAME=$1
SDK_DIST_PATH=$2
AWS_BUCKET=$3

for ext in exe AppImage; do
  if [ -f $SDK_DIST_PATH/skedulo-sdk.$ext ] ; then
    aws s3api put-object --bucket $AWS_BUCKET --key $SDK_FILENAME.$ext --body $SDK_DIST_PATH/skedulo-sdk.$ext
  fi
done

# Issues with macOS.15 and electron-builder require manual zipping
# https://github.com/electron-userland/electron-builder/issues/4299
if [ -d $SDK_DIST_PATH/mac/skedulo-sdk.app ] ; then
  cd dist/mac
  zip -r skedulo-sdk-fix.zip skedulo-sdk.app
  aws s3api put-object --bucket $AWS_BUCKET --key $SDK_FILENAME.zip --body $SDK_DIST_PATH/skedulo-sdk.zip
fi
